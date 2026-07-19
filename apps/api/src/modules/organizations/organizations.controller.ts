import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { OrgRoleGuard } from "../rbac/guards/org-role.guard";
import { RequireOrgRole } from "../rbac/decorators/require-org-role.decorator";
import { OrganizationsService } from "./organizations.service";

@Controller("organizations/:organizationId")
@UseGuards(OrgRoleGuard)
export class OrganizationsController {
  constructor(private readonly organizations: OrganizationsService) {}

  @Get("subscription")
  @RequireOrgRole("owner", "admin", "member")
  getSubscription(@Param("organizationId") organizationId: string) {
    return this.organizations.getSubscription(organizationId);
  }
}

@Controller("plans")
export class PlansController {
  constructor(private readonly organizations: OrganizationsService) {}

  @Get()
  list() {
    return this.organizations.listPlans();
  }
}
