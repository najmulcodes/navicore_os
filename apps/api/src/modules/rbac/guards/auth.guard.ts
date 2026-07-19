import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { resolveSession } from "../../../lib/session";

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { navicoreSession?: unknown }>();

    const session = await resolveSession(request);
    if (!session) {
      throw new UnauthorizedException("Not authenticated");
    }

    request.navicoreSession = session;
    return true;
  }
}
