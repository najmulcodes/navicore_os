import { Module } from "@nestjs/common";
import { PermissionsService } from "./permissions.service";
import { AuthGuard } from "./guards/auth.guard";
import { PermissionGuard } from "./guards/permission.guard";
import { OrgRoleGuard } from "./guards/org-role.guard";

@Module({
  providers: [PermissionsService, AuthGuard, PermissionGuard, OrgRoleGuard],
  exports: [PermissionsService, AuthGuard, PermissionGuard, OrgRoleGuard],
})
export class RbacModule {}
