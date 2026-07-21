import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@navicore/db";

/**
 * "Marketplace foundation" per Phase 0's own framing ("plugin system
 * foundation... marketplace (Phase 10+)") — this is genuinely just that: a
 * registry of what integrations exist and which orgs have them installed.
 * No OAuth flows, no webhook receivers per integration, no sandboxed plugin
 * runtime, no third-party developer platform. See TECH_DEBT.md for what a
 * real implementation would need — this is the foundation, not the feature.
 */
@Injectable()
export class IntegrationsService {
  findAvailable() {
    return prisma.integrationDefinition.findMany({ where: { isEnabled: true } });
  }

  findInstalled(organizationId: string) {
    return prisma.organizationIntegration.findMany({
      where: { organizationId },
      include: { integration: true },
    });
  }

  async install(organizationId: string, integrationKey: string, actorId: string) {
    const definition = await prisma.integrationDefinition.findUnique({ where: { key: integrationKey } });
    if (!definition || !definition.isEnabled) {
      throw new NotFoundException(`Integration "${integrationKey}" not found or not enabled`);
    }

    return prisma.organizationIntegration.upsert({
      where: {
        organizationId_integrationDefinitionId: {
          organizationId,
          integrationDefinitionId: definition.id,
        },
      },
      update: {},
      create: { organizationId, integrationDefinitionId: definition.id, installedById: actorId },
    });
  }

  async uninstall(organizationId: string, installationId: string) {
    const existing = await prisma.organizationIntegration.findFirst({
      where: { id: installationId, organizationId },
    });
    if (!existing) throw new NotFoundException("Installation not found");

    return prisma.organizationIntegration.delete({ where: { id: installationId } });
  }
}
