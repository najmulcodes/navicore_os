import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { PermissionGuard } from "../rbac/guards/permission.guard";
import { RequirePermission } from "../rbac/decorators/require-permission.decorator";
import { CurrentUser } from "../rbac/decorators/current-user.decorator";
import { ProjectsService } from "./projects.service";
import { CreateProjectDto, UpdateProjectDto } from "./dto/project.dto";

@Controller("workspaces/:workspaceId/projects")
@UseGuards(PermissionGuard)
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Post()
  @RequirePermission("projects:create")
  create(
    @Param("workspaceId") workspaceId: string,
    @Body() dto: CreateProjectDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.projects.create(workspaceId, dto, user.id);
  }

  @Get()
  findAll(@Param("workspaceId") workspaceId: string) {
    return this.projects.findAll(workspaceId);
  }

  @Get(":projectId")
  findOne(@Param("workspaceId") workspaceId: string, @Param("projectId") projectId: string) {
    return this.projects.findOne(workspaceId, projectId);
  }

  @Patch(":projectId")
  @RequirePermission("projects:update")
  update(
    @Param("workspaceId") workspaceId: string,
    @Param("projectId") projectId: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.projects.update(workspaceId, projectId, dto, user.id);
  }

  @Delete(":projectId")
  @RequirePermission("projects:delete")
  remove(
    @Param("workspaceId") workspaceId: string,
    @Param("projectId") projectId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.projects.softDelete(workspaceId, projectId, user.id);
  }
}
