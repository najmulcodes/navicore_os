import { Module } from "@nestjs/common";
import { RbacModule } from "../rbac/rbac.module";
import { CrmService } from "./crm.service";
import {
  CompaniesController,
  ContactsController,
  DealsController,
  PipelineStagesController,
} from "./crm.controller";

@Module({
  imports: [RbacModule],
  controllers: [CompaniesController, ContactsController, PipelineStagesController, DealsController],
  providers: [CrmService],
  exports: [CrmService],
})
export class CrmModule {}
