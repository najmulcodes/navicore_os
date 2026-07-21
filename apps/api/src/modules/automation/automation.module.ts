import { Module } from "@nestjs/common";
import { RbacModule } from "../rbac/rbac.module";
import { QueueModule } from "../queue/queue.module";
import { AutomationService } from "./automation.service";
import { AutomationController } from "./automation.controller";
import { AutomationTriggerListener } from "./automation-trigger.listener";
import { AutomationProcessor } from "./automation.processor";

@Module({
  imports: [RbacModule, QueueModule],
  controllers: [AutomationController],
  providers: [AutomationService, AutomationTriggerListener, AutomationProcessor],
})
export class AutomationModule {}
