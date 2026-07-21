import { Module } from "@nestjs/common";
import { RbacModule } from "../rbac/rbac.module";
import { ChannelsModule } from "../channels/channels.module";
import { RealtimeModule } from "../realtime/realtime.module";
import { ChatService } from "./chat.service";
import { ChatController } from "./chat.controller";

@Module({
  imports: [RbacModule, ChannelsModule, RealtimeModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
