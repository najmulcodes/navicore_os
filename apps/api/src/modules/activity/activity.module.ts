import { Module } from "@nestjs/common";
import { RbacModule } from "../rbac/rbac.module";
import { ActivityListener } from "./activity-listener.service";
import { ActivityService } from "./activity.service";
import { ActivityController } from "./activity.controller";

@Module({
  imports: [RbacModule],
  controllers: [ActivityController],
  providers: [ActivityListener, ActivityService],
})
export class ActivityModule {}
