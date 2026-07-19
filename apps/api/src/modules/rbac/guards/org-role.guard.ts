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
      .getRequest<Request & { navicoreSession?: unknown; params: Record<string, string> }>();

    const session = await resolveSession(request);
    if (!session) {
      throw new UnauthorizedException("Not authenticated");
    }
    request.navicoreSession = session;

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const organizationId = request.params.organizationId;
    if (!organizationId) {
      throw new ForbiddenException(
        "OrgRoleGuard requires an :organizationId route param.",
      );
    }

    const userId = (session as { user: { id: string } }).user.id;
    const membership = await prisma.member.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
      select: { role: true },
    });

    if (!membership || !requiredRoles.includes(membership.role)) {
      throw new ForbiddenException(
        `Requires organization role: ${requiredRoles.join(" or ")}`,
      );
    }

    return true;
  }
}
