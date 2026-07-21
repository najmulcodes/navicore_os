import { Module } from "@nestjs/common";
import { RbacModule } from "../rbac/rbac.module";
import { RealtimeService } from "./realtime.service";
import { RealtimeController } from "./realtime.controller";

@Module({
  imports: [RbacModule],
  controllers: [RealtimeController],
  providers: [RealtimeService],
  exports: [RealtimeService],
})
export class RealtimeModule {}
