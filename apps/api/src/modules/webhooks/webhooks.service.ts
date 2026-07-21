import { Injectable, NotFoundException } from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { prisma } from "@navicore/db";
import { CreateWebhookSubscriptionDto, UpdateWebhookSubscriptionDto } from "./dto/webhook.dto";

@Injectable()
export class WebhooksService {
  async create(workspaceId: string, dto: CreateWebhookSubscriptionDto, actorId: string) {
    const secret = randomBytes(32).toString("hex");
    const subscription = await prisma.webhookSubscription.create({
      data: {
        workspaceId,
        url: dto.url,
        eventPattern: dto.eventPattern,
        secret,
        createdById: actorId,
      },
    });

    // The only time the raw secret is ever returned — not stored anywhere
    // retrievable afterward (same pattern as ApiKeysService). The caller
    // needs it now to configure their receiving endpoint's signature check.
    return { ...subscription, secret };
  }

  findAll(workspaceId: string) {
    return prisma.webhookSubscription.findMany({
      where: { workspaceId },
      select: {
        id: true,
        url: true,
        eventPattern: true,
        isActive: true,
        createdAt: true,
        // secret intentionally excluded from list/read responses after creation
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async update(workspaceId: string, subscriptionId: string, dto: UpdateWebhookSubscriptionDto) {
    const existing = await prisma.webhookSubscription.findFirst({
      where: { id: subscriptionId, workspaceId },
    });
    if (!existing) throw new NotFoundException("Webhook subscription not found");

    return prisma.webhookSubscription.update({ where: { id: subscriptionId }, data: dto });
  }

  async remove(workspaceId: string, subscriptionId: string) {
    const existing = await prisma.webhookSubscription.findFirst({
      where: { id: subscriptionId, workspaceId },
    });
    if (!existing) throw new NotFoundException("Webhook subscription not found");

    return prisma.webhookSubscription.delete({ where: { id: subscriptionId } });
  }

  async findDeliveries(workspaceId: string, subscriptionId: string) {
    const existing = await prisma.webhookSubscription.findFirst({
      where: { id: subscriptionId, workspaceId },
    });
    if (!existing) throw new NotFoundException("Webhook subscription not found");

    return prisma.webhookDelivery.findMany({
      where: { subscriptionId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }
}
