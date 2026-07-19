import { Module } from "@nestjs/common";
import { RbacModule } from "../rbac/rbac.module";
import { AiService } from "./ai.service";
import { AiServiceClient } from "./ai-service.client";
import { AiConversationsController, AiUtilityController } from "./ai.controller";

@Module({
  imports: [RbacModule],
  controllers: [AiConversationsController, AiUtilityController],
  providers: [AiService, AiServiceClient],
})
export class AiModule {}
