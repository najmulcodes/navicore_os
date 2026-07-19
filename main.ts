import "dotenv/config";
import "reflect-metadata";

import { NestFactory } from "@nestjs/core";
import { RequestMethod } from "@nestjs/common";
import { loadEnv } from "@navicore/config";

import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  // Fail fast, per docs/PHASE_0_ARCHITECTURE.md §8: validate every env var
  // this process needs before the Nest application context is even created,
  // rather than discovering a missing DATABASE_URL on the first request.
  const env = loadEnv();

  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix("api/v1", {
    // Health check stays unversioned and outside /api/v1 — load balancers and
    // container orchestrators (Railway, k8s-style probes) expect a stable,
    // predictable path, and it isn't a resource in the sense §5's API
    // conventions describe.
    exclude: [{ path: "health", method: RequestMethod.GET }],
  });

  await app.listen(env.API_PORT);
}

bootstrap();
