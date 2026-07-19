import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { resolveSession } from "../../../lib/session";
import { PermissionsService } from "../permissions.service";
import { PERMISSION_KEY } from "../decorators/require-permission.decorator";

/**
 * Authenticates the caller AND checks the required permission (set via
 * `@RequirePermission('key')`) against their role in the workspace named by
 * the route's `:workspaceId` param — see docs/PHASE_0_ARCHITECTURE.md §4.
 *
 * Route param convention: every workspace-scoped controller in this codebase
 * is nested under `workspaces/:workspaceId/...` (see each module's
 * `@Controller()` path). This guard reads that param directly rather than a
 * generic "resource id" concept — simpler, and correct for the routes that
 * exist today. Revisit if a route ever needs to resolve workspace scope some
 * other way (e.g. from the request body instead of the URL).
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissions: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.get<string | undefined>(
      PERMISSION_KEY,
      context.getHandler(),
    );

    const request = context
      .switchToHttp()
      .getRequest<Request & { navicoreSession?: unknown; params: Record<string, string> }>();

    const session = await resolveSession(request);
    if (!session) {
      throw new UnauthorizedException("Not authenticated");
    }
    request.navicoreSession = session;

    const workspaceId = request.params.workspaceId;
    if (!workspaceId) {
      throw new ForbiddenException(
        "PermissionGuard requires a :workspaceId route param — this route isn't workspace-scoped.",
      );
    }

    const userId = (session as { user: { id: string } }).user.id;

    if (!requiredPermission) {
      // No specific permission required, but this is still a workspace-scoped
      // route — the caller must at least be a member of the workspace (any
      // role), not merely authenticated to the app in general.
      const membership = await this.permissions.getWorkspaceRole(userId, workspaceId);
      if (!membership) {
        throw new ForbiddenException("Not a member of this workspace");
      }
      return true;
    }

    const allowed = await this.permissions.hasPermission(userId, workspaceId, requiredPermission);

    if (!allowed) {
      throw new ForbiddenException(`Missing required permission: ${requiredPermission}`);
    }

    return true;
  }
}
