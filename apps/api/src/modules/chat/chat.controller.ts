import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { PermissionGuard } from "../rbac/guards/permission.guard";
import { CurrentUser } from "../rbac/decorators/current-user.decorator";
import { ChatService } from "./chat.service";
import { SendChatMessageDto } from "./dto/chat.dto";

@Controller("workspaces/:workspaceId/channels/:channelId/messages")
@UseGuards(PermissionGuard)
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Post()
  send(
    @Param("workspaceId") workspaceId: string,
    @Param("channelId") channelId: string,
    @Body() dto: SendChatMessageDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.chat.sendMessage(workspaceId, channelId, dto, user.id);
  }

  @Get()
  findAll(
    @Param("channelId") channelId: string,
    @CurrentUser() user: { id: string },
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
  ) {
    return this.chat.findMessages(channelId, user.id, cursor, limit ? Number(limit) : undefined);
  }
}
