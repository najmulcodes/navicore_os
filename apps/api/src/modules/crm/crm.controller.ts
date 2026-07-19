import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { PermissionGuard } from "../rbac/guards/permission.guard";
import { RequirePermission } from "../rbac/decorators/require-permission.decorator";
import { CurrentUser } from "../rbac/decorators/current-user.decorator";
import { CrmService } from "./crm.service";
import {
  CreateCompanyDto,
  CreateContactDto,
  CreateDealDto,
  CreatePipelineStageDto,
  MoveDealStageDto,
  UpdateCompanyDto,
  UpdateContactDto,
  UpdateDealDto,
} from "./dto/crm.dto";

@Controller("workspaces/:workspaceId/companies")
@UseGuards(PermissionGuard)
export class CompaniesController {
  constructor(private readonly crm: CrmService) {}

  @Post()
  @RequirePermission("crm:companies:create")
  create(@Param("workspaceId") workspaceId: string, @Body() dto: CreateCompanyDto) {
    return this.crm.createCompany(workspaceId, dto);
  }

  @Get()
  findAll(@Param("workspaceId") workspaceId: string) {
    return this.crm.findCompanies(workspaceId);
  }

  @Get(":companyId")
  findOne(@Param("workspaceId") workspaceId: string, @Param("companyId") companyId: string) {
    return this.crm.findCompany(workspaceId, companyId);
  }

  @Patch(":companyId")
  @RequirePermission("crm:companies:update")
  update(
    @Param("workspaceId") workspaceId: string,
    @Param("companyId") companyId: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.crm.updateCompany(workspaceId, companyId, dto);
  }

  @Delete(":companyId")
  @RequirePermission("crm:companies:delete")
  remove(@Param("workspaceId") workspaceId: string, @Param("companyId") companyId: string) {
    return this.crm.removeCompany(workspaceId, companyId);
  }
}

@Controller("workspaces/:workspaceId/contacts")
@UseGuards(PermissionGuard)
export class ContactsController {
  constructor(private readonly crm: CrmService) {}

  @Post()
  @RequirePermission("crm:contacts:create")
  create(@Param("workspaceId") workspaceId: string, @Body() dto: CreateContactDto) {
    return this.crm.createContact(workspaceId, dto);
  }

  @Get()
  findAll(@Param("workspaceId") workspaceId: string) {
    return this.crm.findContacts(workspaceId);
  }

  @Get(":contactId")
  findOne(@Param("workspaceId") workspaceId: string, @Param("contactId") contactId: string) {
    return this.crm.findContact(workspaceId, contactId);
  }

  @Patch(":contactId")
  @RequirePermission("crm:contacts:update")
  update(
    @Param("workspaceId") workspaceId: string,
    @Param("contactId") contactId: string,
    @Body() dto: UpdateContactDto,
  ) {
    return this.crm.updateContact(workspaceId, contactId, dto);
  }

  @Delete(":contactId")
  @RequirePermission("crm:contacts:delete")
  remove(@Param("workspaceId") workspaceId: string, @Param("contactId") contactId: string) {
    return this.crm.removeContact(workspaceId, contactId);
  }
}

@Controller("workspaces/:workspaceId/pipeline-stages")
@UseGuards(PermissionGuard)
export class PipelineStagesController {
  constructor(private readonly crm: CrmService) {}

  @Post()
  @RequirePermission("deals:manage_pipeline_stages")
  create(@Param("workspaceId") workspaceId: string, @Body() dto: CreatePipelineStageDto) {
    return this.crm.createPipelineStage(workspaceId, dto);
  }

  @Get()
  findAll(@Param("workspaceId") workspaceId: string) {
    return this.crm.findPipelineStages(workspaceId);
  }
}

@Controller("workspaces/:workspaceId/deals")
@UseGuards(PermissionGuard)
export class DealsController {
  constructor(private readonly crm: CrmService) {}

  @Post()
  @RequirePermission("deals:create")
  create(
    @Param("workspaceId") workspaceId: string,
    @Body() dto: CreateDealDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.crm.createDeal(workspaceId, dto, user.id);
  }

  @Get()
  findAll(@Param("workspaceId") workspaceId: string) {
    return this.crm.findDeals(workspaceId);
  }

  @Get(":dealId")
  findOne(@Param("workspaceId") workspaceId: string, @Param("dealId") dealId: string) {
    return this.crm.findDeal(workspaceId, dealId);
  }

  @Patch(":dealId")
  @RequirePermission("deals:update")
  update(
    @Param("workspaceId") workspaceId: string,
    @Param("dealId") dealId: string,
    @Body() dto: UpdateDealDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.crm.updateDeal(workspaceId, dealId, dto, user.id);
  }

  @Patch(":dealId/stage")
  @RequirePermission("deals:update")
  moveStage(
    @Param("workspaceId") workspaceId: string,
    @Param("dealId") dealId: string,
    @Body() dto: MoveDealStageDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.crm.moveDealStage(workspaceId, dealId, dto.stageId, user.id);
  }
}
