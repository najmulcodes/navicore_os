import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { prisma } from "@navicore/db";
import { resolveSession } from "../../../lib/session";
import { resolveApiKey } from "../../../lib/api-key-auth";
import { PermissionsService } from "../permissions.service";
import { PERMISSION_KEY } from "../decorators/require-permission.decorator";

/**
 * Authenticates the caller AND checks the required permission (set via
 * `@RequirePermission('key')`) against their role in the workspace named by
 * the route's `:workspaceId` param — see docs/PHASE_0_ARCHITECTURE.md §4.
 *
 * Two authentication paths, checked in order (Phase 7 addition):
 *   1. API key (`Authorization: Bearer nvc_...`) — org-admin-equivalent
 *      access to any workspace in that key's organization, no per-workspace
 *      permission check. See lib/api-key-auth.ts for why.
 *   2. Better Auth session — the original path, full fine-grained RBAC.
 * This is exactly the "same guard, different strategy" design
 * docs/PHASE_0_ARCHITECTURE.md §5 calls for.
 *
 * Route param convention: every workspace-scoped controller in this codebase
 * is nested under `workspaces/:workspaceId/...` (see each module's
 * `@Controller()` path). This guard reads that param directly rather than a
 * generic "resource id" concept — simpler, and correct for the routes that
 * exist today.
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
      .getRequest<
        Request & {
          navicoreSession?: unknown;
          navicoreApiKey?: { organizationId: string; apiKeyId: string };
          params: Record<string, string>;
        }
      >();

    const workspaceId = request.params.workspaceId;
    if (!workspaceId) {
      throw new ForbiddenException(
        "PermissionGuard requires a :workspaceId route param — this route isn't workspace-scoped.",
      );
    }

    const apiKeyResult = await resolveApiKey(request);
    if (apiKeyResult) {
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { organizationId: true },
      });
      if (!workspace || workspace.organizationId !== apiKeyResult.organizationId) {
        throw new ForbiddenException("API key's organization does not own this workspace");
      }
      request.navicoreApiKey = apiKeyResult;
      return true;
    }

    const session = await resolveSession(request);
    if (!session) {
      throw new UnauthorizedException("Not authenticated");
    }
    request.navicoreSession = session;

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
