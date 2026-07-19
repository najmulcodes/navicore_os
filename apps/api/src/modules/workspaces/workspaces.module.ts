import { Module } from "@nestjs/common";
import { RbacModule } from "../rbac/rbac.module";
import { WorkspacesService } from "./workspaces.service";
import { WorkspacesController, OrganizationWorkspacesController } from "./workspaces.controller";

@Module({
  imports: [RbacModule],
  controllers: [OrganizationWorkspacesController, WorkspacesController],
  providers: [WorkspacesService],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
