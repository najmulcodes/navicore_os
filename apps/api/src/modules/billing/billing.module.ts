import { MiddlewareConsumer, Module, NestModule, RequestMethod } from "@nestjs/common";
import express from "express";
import { RbacModule } from "../rbac/rbac.module";
import { BillingService } from "./billing.service";
import { BillingController, StripeWebhookController } from "./billing.controller";

@Module({
  imports: [RbacModule],
  controllers: [BillingController, StripeWebhookController],
  providers: [BillingService],
})
export class BillingModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Stripe's webhook signature verification (BillingService.handleWebhook)
    // needs the exact raw request bytes — JSON-parsing and re-serializing
    // would change the byte content and break signature verification. This
    // applies BEFORE the global auth-module body-parser re-addition would
    // otherwise JSON-parse it, scoped to exactly this one path.
    consumer
      .apply(express.raw({ type: "application/json" }))
      .forRoutes({ path: "webhooks/stripe", method: RequestMethod.POST });
  }
}
