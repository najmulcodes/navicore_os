import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { OrgRoleGuard } from "../rbac/guards/org-role.guard";
import { RequireOrgRole } from "../rbac/decorators/require-org-role.decorator";
import { AuditService } from "./audit.service";

@Controller("organizations/:organizationId/audit-log")
@UseGuards(OrgRoleGuard)
@RequireOrgRole("owner", "admin")
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  search(
    @Param("organizationId") organizationId: string,
    @Query("entityType") entityType?: string,
    @Query("actorId") actorId?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
  ) {
    return this.audit.search(
      organizationId,
      {
        entityType,
        actorId,
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined,
      },
      cursor,
      limit ? Number(limit) : undefined,
    );
  }
}
