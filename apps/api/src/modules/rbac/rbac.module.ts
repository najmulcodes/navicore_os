import { Module } from "@nestjs/common";
import { PermissionsService } from "./permissions.service";
import { PermissionOverridesService } from "./permission-overrides.service";
import { AuthGuard } from "./guards/auth.guard";
import { PermissionGuard } from "./guards/permission.guard";
import { OrgRoleGuard } from "./guards/org-role.guard";
import { PermissionOverridesController } from "./permission-overrides.controller";

@Module({
  controllers: [PermissionOverridesController],
  providers: [PermissionsService, PermissionOverridesService, AuthGuard, PermissionGuard, OrgRoleGuard],
  exports: [PermissionsService, PermissionOverridesService, AuthGuard, PermissionGuard, OrgRoleGuard],
})
export class RbacModule {}
