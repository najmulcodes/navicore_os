import { Injectable, NotFoundException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { prisma } from "@navicore/db";
import { AiServiceClient } from "./ai-service.client";

@Injectable()
export class AiService {
  constructor(
    private readonly client: AiServiceClient,
    private readonly events: EventEmitter2,
  ) {}

  createConversation(workspaceId: string, userId: string, title?: string) {
    return prisma.aiConversation.create({ data: { workspaceId, userId, title } });
  }

  findConversations(workspaceId: string, userId: string) {
    // Scoped to the caller's own conversations — the Assistant is a personal
    // tool, not a shared thread, in this pass. Revisit if/when shared AI
    // threads become a real requirement.
    return prisma.aiConversation.findMany({
      where: { workspaceId, userId },
      orderBy: { updatedAt: "desc" },
    });
  }

  async findConversation(workspaceId: string, conversationId: string, userId: string) {
    const conversation = await prisma.aiConversation.findFirst({
      where: { id: conversationId, workspaceId, userId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!conversation) throw new NotFoundException("Conversation not found");
    return conversation;
  }

  async sendMessage(workspaceId: string, conversationId: string, userId: string, content: string) {
    const conversation = await this.findConversation(workspaceId, conversationId, userId);

    await prisma.aiMessage.create({
      data: { conversationId, role: "USER", content },
    });

    const history = [...conversation.messages, { role: "USER" as const, content }].map((m) => ({
      role: m.role === "USER" ? ("user" as const) : ("assistant" as const),
      content: m.content,
    }));

    const replyContent = await this.client.chat(history);

    const reply = await prisma.aiMessage.create({
      data: { conversationId, role: "ASSISTANT", content: replyContent },
    });
    await prisma.aiConversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });

    const organizationId = (
      await prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId }, select: { organizationId: true } })
    ).organizationId;
    this.events.emit("ai_conversation.message_sent", {
      organizationId,
      workspaceId,
      actorId: userId,
      entityType: "ai_conversation",
      entityId: conversationId,
      action: "message_sent",
    });

    return reply;
  }

  summarize(text: string) {
    return this.client.summarize(text);
  }
}
