import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@navicore/db";
import { ChannelsService } from "../channels/channels.service";
import { RealtimeService } from "../realtime/realtime.service";
import { workspaceChatChannel, userNotificationChannel } from "../realtime/channel-names";
import { SendChatMessageDto } from "./dto/chat.dto";

@Injectable()
export class ChatService {
  constructor(
    private readonly channels: ChannelsService,
    private readonly realtime: RealtimeService,
  ) {}

  /**
   * Deliberately does not emit a DomainEvent the way every other write path
   * in this codebase does (see common/domain-event.ts) — chat is
   * high-frequency, routine traffic, and would otherwise spam ActivityLog
   * and give every workspace's Automation workflows a trigger firing on
   * every message. It has its own dedicated realtime channel instead
   * (RealtimeService), which is the right-shaped delivery mechanism for
   * this kind of event, not the business-event system built for Phase 2-7.
   */
  async sendMessage(workspaceId: string, channelId: string, dto: SendChatMessageDto, actorId: string) {
    const channel = await prisma.channel.findFirst({
      where: { id: channelId, workspaceId, deletedAt: null },
    });
    if (!channel) throw new NotFoundException("Channel not found");
    await this.channels.assertMember(channelId, actorId);

    const mentionedUserIds = dto.mentionedUserIds ?? [];
    if (mentionedUserIds.length > 0) {
      const members = await prisma.channelMember.findMany({
        where: { channelId, userId: { in: mentionedUserIds } },
        select: { userId: true },
      });
      const validIds = new Set(members.map((m) => m.userId));
      const invalid = mentionedUserIds.filter((id) => !validIds.has(id));
      if (invalid.length > 0) {
        throw new BadRequestException(
          `mentionedUserIds includes users who aren't members of this channel: ${invalid.join(", ")}`,
        );
      }
    }

    const message = await prisma.chatMessage.create({
      data: { channelId, authorId: actorId, content: dto.content, mentionedUserIds },
    });

    await this.realtime.publish(workspaceChatChannel(workspaceId), {
      type: "chat_message",
      channelId,
      message,
    });

    for (const mentionedUserId of mentionedUserIds) {
      if (mentionedUserId === actorId) continue; // don't notify yourself
      const notification = await prisma.notification.create({
        data: {
          userId: mentionedUserId,
          type: "CHAT_MENTION",
          entityType: "chat_message",
          entityId: message.id,
        },
      });
      await this.realtime.publish(userNotificationChannel(mentionedUserId), {
        type: "notification",
        notification,
      });
    }

    return message;
  }

  async findMessages(channelId: string, actorId: string, cursor?: string, limit = 50) {
    await this.channels.assertMember(channelId, actorId);

    const items = await prisma.chatMessage.findMany({
      where: { channelId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;

    return { data: page, meta: { nextCursor: hasMore ? page[page.length - 1]!.id : null } };
  }
}
