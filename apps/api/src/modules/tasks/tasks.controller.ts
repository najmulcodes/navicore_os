import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { PermissionGuard } from "../rbac/guards/permission.guard";
import { RequirePermission } from "../rbac/decorators/require-permission.decorator";
import { CurrentUser } from "../rbac/decorators/current-user.decorator";
import { TasksService } from "./tasks.service";
import { CreateTaskDto, LogTimeDto, MoveTaskDto, UpdateTaskDto } from "./dto/task.dto";

@Controller("workspaces/:workspaceId/projects/:projectId/tasks")
@UseGuards(PermissionGuard)
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Post()
  @RequirePermission("tasks:create")
  create(
    @Param("workspaceId") workspaceId: string,
    @Param("projectId") projectId: string,
    @Body() dto: CreateTaskDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.tasks.create(workspaceId, projectId, dto, user.id);
  }

  @Get()
  findAll(@Param("workspaceId") workspaceId: string, @Param("projectId") projectId: string) {
    return this.tasks.findAllForProject(workspaceId, projectId);
  }

  @Get(":taskId")
  findOne(@Param("workspaceId") workspaceId: string, @Param("taskId") taskId: string) {
    return this.tasks.findOne(workspaceId, taskId);
  }

  @Patch(":taskId")
  @RequirePermission("tasks:update")
  update(
    @Param("workspaceId") workspaceId: string,
    @Param("taskId") taskId: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.tasks.update(workspaceId, taskId, dto, user.id);
  }

  @Patch(":taskId/move")
  @RequirePermission("tasks:update")
  move(
    @Param("workspaceId") workspaceId: string,
    @Param("taskId") taskId: string,
    @Body() dto: MoveTaskDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.tasks.move(workspaceId, taskId, dto, user.id);
  }

  @Post(":taskId/time-entries")
  @RequirePermission("tasks:update")
  logTime(
    @Param("workspaceId") workspaceId: string,
    @Param("taskId") taskId: string,
    @Body() dto: LogTimeDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.tasks.logTime(workspaceId, taskId, dto, user.id);
  }

  @Delete(":taskId")
  @RequirePermission("tasks:delete")
  remove(
    @Param("workspaceId") workspaceId: string,
    @Param("taskId") taskId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.tasks.remove(workspaceId, taskId, user.id);
  }
}
