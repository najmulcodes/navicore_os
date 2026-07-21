import { prisma } from "@navicore/db";
import { DomainEvent } from "../../../common/domain-event";

interface CreateNotificationConfig {
  userId: string;
  type: string; // matches the Notification.type enum values, validated by Prisma at write time
}

export async function executeCreateNotification(
  config: CreateNotificationConfig,
  context: { event: DomainEvent },
): Promise<void> {
  await prisma.notification.create({
    data: {
      userId: config.userId,
      type: config.type as never, // enum validated by Prisma; a bad value throws a clear DB error rather than being silently coerced
      entityType: context.event.entityType,
      entityId: context.event.entityId,
    },
  });
}
