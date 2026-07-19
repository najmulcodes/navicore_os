import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { PermissionGuard } from "../rbac/guards/permission.guard";
import { RequirePermission } from "../rbac/decorators/require-permission.decorator";
import { ActivityService } from "./activity.service";

@Controller("workspaces/:workspaceId/activity")
@UseGuards(PermissionGuard)
@RequirePermission("activity:read")
export class ActivityController {
  constructor(private readonly activity: ActivityService) {}

  @Get()
  list(
    @Param("workspaceId") workspaceId: string,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
  ) {
    return this.activity.listForWorkspace(workspaceId, cursor, limit ? Number(limit) : undefined);
  }
}
