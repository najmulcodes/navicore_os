import { Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { OrgRoleGuard } from "../rbac/guards/org-role.guard";
import { RequireOrgRole } from "../rbac/decorators/require-org-role.decorator";
import { CurrentUser } from "../rbac/decorators/current-user.decorator";
import { IntegrationsService } from "./integrations.service";

@Controller("integrations")
export class IntegrationsCatalogController {
  constructor(private readonly integrations: IntegrationsService) {}

  /** Public catalog — no guard, same reasoning as PlansController (Phase 5). */
  @Get()
  findAvailable() {
    return this.integrations.findAvailable();
  }
}

@Controller("organizations/:organizationId/integrations")
@UseGuards(OrgRoleGuard)
export class OrganizationIntegrationsController {
  constructor(private readonly integrations: IntegrationsService) {}

  @Get()
  @RequireOrgRole("owner", "admin", "member")
  findInstalled(@Param("organizationId") organizationId: string) {
    return this.integrations.findInstalled(organizationId);
  }

  @Post(":integrationKey")
  @RequireOrgRole("owner", "admin")
  install(
    @Param("organizationId") organizationId: string,
    @Param("integrationKey") integrationKey: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.integrations.install(organizationId, integrationKey, user.id);
  }

  @Delete(":installationId")
  @RequireOrgRole("owner", "admin")
  uninstall(@Param("organizationId") organizationId: string, @Param("installationId") installationId: string) {
    return this.integrations.uninstall(organizationId, installationId);
  }
}
