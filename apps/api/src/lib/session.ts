import type { Request } from "express";
import { auth } from "./auth";

/**
 * Resolves the current Better Auth session directly against `auth.api.getSession`
 * — Better Auth's own documented, framework-agnostic server API — rather than
 * reading a request property that @thallesp/nestjs-better-auth's global guard
 * may or may not attach under a name this codebase can rely on. This is more
 * verbose than reading `request.session` would be, but it only depends on
 * Better Auth's own stable public API, not a third-party package's internals.
 */
export async function resolveSession(request: Request) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, v);
    } else if (value !== undefined) {
      headers.append(key, value);
    }
  }

  return auth.api.getSession({ headers });
}

export type ResolvedSession = Awaited<ReturnType<typeof resolveSession>>;
