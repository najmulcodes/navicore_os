import { Module } from "@nestjs/common";
import { RbacModule } from "../rbac/rbac.module";
import { ChannelsService } from "./channels.service";
import { ChannelsController } from "./channels.controller";

@Module({
  imports: [RbacModule],
  controllers: [ChannelsController],
  providers: [ChannelsService],
  exports: [ChannelsService],
})
export class ChannelsModule {}
