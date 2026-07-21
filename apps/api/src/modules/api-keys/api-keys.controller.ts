import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { OrgRoleGuard } from "../rbac/guards/org-role.guard";
import { RequireOrgRole } from "../rbac/decorators/require-org-role.decorator";
import { CurrentUser } from "../rbac/decorators/current-user.decorator";
import { ApiKeysService } from "./api-keys.service";
import { CreateApiKeyDto } from "./dto/api-key.dto";

@Controller("organizations/:organizationId/api-keys")
@UseGuards(OrgRoleGuard)
export class ApiKeysController {
  constructor(private readonly apiKeys: ApiKeysService) {}

  @Post()
  @RequireOrgRole("owner", "admin")
  create(
    @Param("organizationId") organizationId: string,
    @Body() dto: CreateApiKeyDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.apiKeys.create(organizationId, dto, user.id);
  }

  @Get()
  @RequireOrgRole("owner", "admin")
  findAll(@Param("organizationId") organizationId: string) {
    return this.apiKeys.findAll(organizationId);
  }

  @Delete(":apiKeyId")
  @RequireOrgRole("owner", "admin")
  revoke(
    @Param("organizationId") organizationId: string,
    @Param("apiKeyId") apiKeyId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.apiKeys.revoke(organizationId, apiKeyId, user.id);
  }
}
