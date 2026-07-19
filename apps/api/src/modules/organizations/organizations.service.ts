import { Injectable } from "@nestjs/common";
import { prisma } from "@navicore/db";

/**
 * Deliberately thin: Organization create/update/delete/invite-member all
 * come from Better Auth's own auto-mounted routes (organization plugin) —
 * see apps/api/src/lib/auth.ts and docs/adr/002-auth-provider.md. This
 * module only covers NAVICORE-specific extensions Better Auth doesn't know
 * about, namely platform subscription status.
 */
@Injectable()
export class OrganizationsService {
  async getSubscription(organizationId: string) {
    return prisma.subscription.findUnique({
      where: { organizationId },
      include: { plan: true },
    });
  }

  async listPlans() {
    return prisma.plan.findMany({ orderBy: { priceCents: "asc" } });
  }
}
