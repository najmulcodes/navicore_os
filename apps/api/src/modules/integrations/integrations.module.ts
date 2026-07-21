import { Module } from "@nestjs/common";
import { RbacModule } from "../rbac/rbac.module";
import { IntegrationsService } from "./integrations.service";
import { IntegrationsCatalogController, OrganizationIntegrationsController } from "./integrations.controller";

@Module({
  imports: [RbacModule],
  controllers: [IntegrationsCatalogController, OrganizationIntegrationsController],
  providers: [IntegrationsService],
})
export class IntegrationsModule {}
