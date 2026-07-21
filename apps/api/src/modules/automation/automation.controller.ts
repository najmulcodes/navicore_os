import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { PermissionGuard } from "../rbac/guards/permission.guard";
import { RequirePermission } from "../rbac/decorators/require-permission.decorator";
import { CurrentUser } from "../rbac/decorators/current-user.decorator";
import { AutomationService } from "./automation.service";
import { CreateWorkflowDto, UpdateWorkflowDto } from "./dto/workflow.dto";

@Controller("workspaces/:workspaceId/workflows")
@UseGuards(PermissionGuard)
@RequirePermission("automation:manage")
export class AutomationController {
  constructor(private readonly automation: AutomationService) {}

  @Post()
  create(
    @Param("workspaceId") workspaceId: string,
    @Body() dto: CreateWorkflowDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.automation.create(workspaceId, dto, user.id);
  }

  @Get()
  findAll(@Param("workspaceId") workspaceId: string) {
    return this.automation.findAll(workspaceId);
  }

  @Get(":workflowId")
  findOne(@Param("workspaceId") workspaceId: string, @Param("workflowId") workflowId: string) {
    return this.automation.findOne(workspaceId, workflowId);
  }

  @Patch(":workflowId")
  update(
    @Param("workspaceId") workspaceId: string,
    @Param("workflowId") workflowId: string,
    @Body() dto: UpdateWorkflowDto,
  ) {
    return this.automation.update(workspaceId, workflowId, dto);
  }

  @Delete(":workflowId")
  remove(@Param("workspaceId") workspaceId: string, @Param("workflowId") workflowId: string) {
    return this.automation.remove(workspaceId, workflowId);
  }

  @Get(":workflowId/runs")
  findRuns(@Param("workspaceId") workspaceId: string, @Param("workflowId") workflowId: string) {
    return this.automation.findRuns(workspaceId, workflowId);
  }
}
