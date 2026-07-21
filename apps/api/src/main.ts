import "dotenv/config";
import "reflect-metadata";

import { NestFactory } from "@nestjs/core";
import { RequestMethod, ValidationPipe } from "@nestjs/common";
import helmet from "helmet";
import { loadEnv } from "@navicore/config";

import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  // Fail fast, per docs/PHASE_0_ARCHITECTURE.md §8: validate every env var
  // this process needs before the Nest application context is even created,
  // rather than discovering a missing DATABASE_URL on the first request.
  const env = loadEnv();

  const app = await NestFactory.create(AppModule, {
    // Required by @thallesp/nestjs-better-auth: Better Auth needs the raw
    // request body for its own routes, and the module re-adds body parsing
    // for everything else. See apps/api/src/app.module.ts and
    // https://better-auth.com/docs/integrations/nestjs.
    bodyParser: false,
  });

  // Security headers (Phase 10 hardening) — this is a JSON/SSE API, not an
  // HTML-serving app, so helmet's defaults are used as-is rather than
  // customizing CSP (which matters for pages rendering untrusted content,
  // not API responses). apps/web is a separate Next.js app and would need
  // its own CSP consideration if that becomes relevant later.
  app.use(helmet());

  app.setGlobalPrefix("api/v1", {
    exclude: [
      // Health check stays unversioned — load balancers and container
      // orchestrators (Railway, k8s-style probes) expect a stable path.
      { path: "health", method: RequestMethod.GET },
      // Better Auth's own routes conventionally live at /api/auth/* (its
      // client SDK, cookie config, and every doc example assume this) — not
      // yet smoke-tested against a live server; verify this exclusion
      // pattern actually keeps auth off /api/v1/api/auth/* once install is
      // possible. See CHANGELOG.
      { path: "auth/*path", method: RequestMethod.ALL },
    ],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip properties not declared on the DTO
      forbidNonWhitelisted: true, // ...and reject the request if any were present, rather than silently dropping them
      transform: true, // route params/query strings arrive as strings; DTOs declare real types
    }),
  );

  await app.listen(env.API_PORT);
}

bootstrap();
