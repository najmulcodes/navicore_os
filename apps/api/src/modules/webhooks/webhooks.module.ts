import { Module } from "@nestjs/common";
import { RbacModule } from "../rbac/rbac.module";
import { QueueModule } from "../queue/queue.module";
import { WebhooksService } from "./webhooks.service";
import { WebhooksController } from "./webhooks.controller";
import { WebhookTriggerListener } from "./webhook-trigger.listener";
import { WebhookDeliveryProcessor } from "./webhook-delivery.processor";

@Module({
  imports: [RbacModule, QueueModule],
  controllers: [WebhooksController],
  providers: [WebhooksService, WebhookTriggerListener, WebhookDeliveryProcessor],
})
export class WebhooksModule {}
