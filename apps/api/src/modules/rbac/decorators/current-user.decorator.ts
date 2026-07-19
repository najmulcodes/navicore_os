import { createParamDecorator, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";

/**
 * Reads the session attached to the request by AuthGuard or PermissionGuard
 * (see apps/api/src/modules/rbac/guards). Only valid on routes behind one of
 * those guards — throws rather than silently returning undefined if used
 * without one, since a controller silently getting `undefined` for "current
 * user" is a much worse failure mode than a clear 401.
 */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Request & { navicoreSession?: { user: { id: string; email: string; name: string } } }>();

  if (!request.navicoreSession) {
    throw new UnauthorizedException(
      "@CurrentUser() used on a route with no auth guard applied — add @UseGuards(AuthGuard) or @UseGuards(PermissionGuard).",
    );
  }

  return request.navicoreSession.user;
});
