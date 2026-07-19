import { Module } from "@nestjs/common";
import { RbacModule } from "../rbac/rbac.module";
import { OrganizationsService } from "./organizations.service";
import { OrganizationsController, PlansController } from "./organizations.controller";

@Module({
  imports: [RbacModule],
  controllers: [OrganizationsController, PlansController],
  providers: [OrganizationsService],
})
export class OrganizationsModule {}
