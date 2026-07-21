import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { PermissionGuard } from "./guards/permission.guard";
import { RequirePermission } from "./decorators/require-permission.decorator";
import { CurrentUser } from "./decorators/current-user.decorator";
import { PermissionOverridesService } from "./permission-overrides.service";
import { GrantPermissionOverrideDto } from "./dto/permission-override.dto";

/**
 * "Advanced permissions" from Phase 10's module list — grants that widen a
 * specific user's access to a specific resource beyond their workspace-wide
 * role. Gated behind org:manage_members (the same permission that gates
 * ordinary workspace member management) since granting elevated access is
 * itself a member-management action.
 */
@Controller("workspaces/:workspaceId/permission-overrides")
@UseGuards(PermissionGuard)
@RequirePermission("org:manage_members")
export class PermissionOverridesController {
  constructor(private readonly overrides: PermissionOverridesService) {}

  @Post()
  grant(
    @Param("workspaceId") workspaceId: string,
    @Body() dto: GrantPermissionOverrideDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.overrides.grant(
      workspaceId,
      dto.userId,
      dto.resourceType,
      dto.resourceId,
      dto.permissionKey,
      user.id,
    );
  }

  @Get(":userId")
  findForUser(@Param("workspaceId") workspaceId: string, @Param("userId") userId: string) {
    return this.overrides.findForUser(workspaceId, userId);
  }

  @Delete(":overrideId")
  revoke(
    @Param("workspaceId") workspaceId: string,
    @Param("overrideId") overrideId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.overrides.revoke(workspaceId, overrideId, user.id);
  }
}
