import { SetMetadata } from "@nestjs/common";

export const PERMISSION_KEY = "navicore:required_permission";

/**
 * Marks a route as requiring `permissionKey` in the caller's workspace role
 * (see docs/PHASE_0_ARCHITECTURE.md §4). Must be paired with
 * `@UseGuards(PermissionGuard)` — the decorator only attaches metadata, the
 * guard is what actually enforces it.
 */
export const RequirePermission = (permissionKey: string) =>
  SetMetadata(PERMISSION_KEY, permissionKey);
