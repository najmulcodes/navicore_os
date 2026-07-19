import { Injectable } from "@nestjs/common";
import { prisma } from "@navicore/db";

@Injectable()
export class ActivityService {
  async listForWorkspace(workspaceId: string, cursor?: string, limit = 25) {
    const items = await prisma.activityLog.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;

    return {
      data: page,
      meta: { nextCursor: hasMore ? page[page.length - 1]!.id : null },
    };
  }
}
