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
import { ORG_ROLE_KEY } from "../decorators/require-org-role.decorator";

@Injectable()
export class OrgRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<string[] | undefined>(
      ORG_ROLE_KEY,
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

    const organizationId = request.params.organizationId;
    if (!organizationId) {
      throw new ForbiddenException("OrgRoleGuard requires an :organizationId route param.");
    }

    // Same dual-auth pattern as PermissionGuard — an API key is
    // org-admin-equivalent for its own organization, see lib/api-key-auth.ts.
    const apiKeyResult = await resolveApiKey(request);
    if (apiKeyResult) {
      if (apiKeyResult.organizationId !== organizationId) {
        throw new ForbiddenException("API key does not belong to this organization");
      }
      request.navicoreApiKey = apiKeyResult;
      return true;
    }

    const session = await resolveSession(request);
    if (!session) {
      throw new UnauthorizedException("Not authenticated");
    }
    request.navicoreSession = session;

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const userId = (session as { user: { id: string } }).user.id;
    const membership = await prisma.member.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
      select: { role: true },
    });

    if (!membership || !requiredRoles.includes(membership.role)) {
      throw new ForbiddenException(`Requires organization role: ${requiredRoles.join(" or ")}`);
    }

    return true;
  }
}
