import { SetMetadata } from "@nestjs/common";

export const ORG_ROLE_KEY = "navicore:required_org_role";

/**
 * For actions scoped to an Organization rather than a Workspace — most
 * importantly workspace:create itself, which can't be checked by
 * PermissionGuard since there's no :workspaceId yet. Checks Better Auth's
 * own coarse Member.role ("owner" | "admin" | "member"), not the fine-grained
 * Role/Permission system — see docs/adr/002-auth-provider.md on why those
 * are deliberately separate.
 */
export const RequireOrgRole = (...roles: Array<"owner" | "admin" | "member">) =>
  SetMetadata(ORG_ROLE_KEY, roles);
