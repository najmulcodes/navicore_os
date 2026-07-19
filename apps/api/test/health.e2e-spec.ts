import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";

import { AppModule } from "../src/app.module";

/**
 * Integration-level e2e test, per docs/PHASE_0_ARCHITECTURE.md §8's testing
 * standard: this hits a real Postgres and a real Redis, not mocks. Run
 * `docker compose up -d` first (see root docker-compose.yml) and make sure
 * .env's DATABASE_URL/DIRECT_URL/REDIS_URL point at it.
 */
describe("HealthController (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /health returns 200 with both dependencies reporting up", async () => {
    const response = await request(app.getHttpServer()).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.body.info.database.status).toBe("up");
    expect(response.body.info.redis.status).toBe("up");
  });
});
