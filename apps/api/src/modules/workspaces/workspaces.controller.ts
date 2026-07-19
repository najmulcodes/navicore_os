import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { WorkspacesService } from "./workspaces.service";
import {
  AddWorkspaceMemberDto,
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  UpdateWorkspaceMemberDto,
} from "./dto/workspace.dto";
import { OrgRoleGuard } from "../rbac/guards/org-role.guard";
import { PermissionGuard } from "../rbac/guards/permission.guard";
import { RequireOrgRole } from "../rbac/decorators/require-org-role.decorator";
import { RequirePermission } from "../rbac/decorators/require-permission.decorator";
import { CurrentUser } from "../rbac/decorators/current-user.decorator";

@Controller("organizations/:organizationId/workspaces")
@UseGuards(OrgRoleGuard)
export class OrganizationWorkspacesController {
  constructor(private readonly workspaces: WorkspacesService) {}

  @Post()
  @RequireOrgRole("owner", "admin")
  create(
    @Param("organizationId") organizationId: string,
    @Body() dto: CreateWorkspaceDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.workspaces.create(organizationId, dto, user.id);
  }

  @Get()
  @RequireOrgRole("owner", "admin", "member")
  findAll(@Param("organizationId") organizationId: string) {
    return this.workspaces.findAllForOrganization(organizationId);
  }
}

@Controller("workspaces/:workspaceId")
@UseGuards(PermissionGuard)
export class WorkspacesController {
  constructor(private readonly workspaces: WorkspacesService) {}

  @Get()
  findOne(@Param("workspaceId") workspaceId: string) {
    return this.workspaces.findOne(workspaceId);
  }

  @Patch()
  @RequirePermission("workspace:manage_settings")
  update(@Param("workspaceId") workspaceId: string, @Body() dto: UpdateWorkspaceDto) {
    return this.workspaces.update(workspaceId, dto);
  }

  @Delete()
  @RequirePermission("workspace:manage_settings")
  remove(@Param("workspaceId") workspaceId: string) {
    return this.workspaces.softDelete(workspaceId);
  }

  @Get("members")
  listMembers(@Param("workspaceId") workspaceId: string) {
    return this.workspaces.listMembers(workspaceId);
  }

  @Post("members")
  @RequirePermission("org:manage_members")
  addMember(@Param("workspaceId") workspaceId: string, @Body() dto: AddWorkspaceMemberDto) {
    return this.workspaces.addMember(workspaceId, dto.userId, dto.role);
  }

  @Patch("members/:userId")
  @RequirePermission("org:manage_members")
  updateMember(
    @Param("workspaceId") workspaceId: string,
    @Param("userId") userId: string,
    @Body() dto: UpdateWorkspaceMemberDto,
  ) {
    return this.workspaces.updateMemberRole(workspaceId, userId, dto.role);
  }

  @Delete("members/:userId")
  @RequirePermission("org:manage_members")
  removeMember(@Param("workspaceId") workspaceId: string, @Param("userId") userId: string) {
    return this.workspaces.removeMember(workspaceId, userId);
  }
}
