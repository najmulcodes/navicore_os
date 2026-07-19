import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { PermissionGuard } from "../rbac/guards/permission.guard";
import { RequirePermission } from "../rbac/decorators/require-permission.decorator";
import { CurrentUser } from "../rbac/decorators/current-user.decorator";
import { AiService } from "./ai.service";
import { CreateConversationDto, SendMessageDto, SummarizeDto } from "./dto/ai.dto";

@Controller("workspaces/:workspaceId/ai/conversations")
@UseGuards(PermissionGuard)
@RequirePermission("ai:use_assistant")
export class AiConversationsController {
  constructor(private readonly ai: AiService) {}

  @Post()
  create(
    @Param("workspaceId") workspaceId: string,
    @Body() dto: CreateConversationDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.ai.createConversation(workspaceId, user.id, dto.title);
  }

  @Get()
  findAll(@Param("workspaceId") workspaceId: string, @CurrentUser() user: { id: string }) {
    return this.ai.findConversations(workspaceId, user.id);
  }

  @Get(":conversationId")
  findOne(
    @Param("workspaceId") workspaceId: string,
    @Param("conversationId") conversationId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.ai.findConversation(workspaceId, conversationId, user.id);
  }

  @Post(":conversationId/messages")
  sendMessage(
    @Param("workspaceId") workspaceId: string,
    @Param("conversationId") conversationId: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.ai.sendMessage(workspaceId, conversationId, user.id, dto.content);
  }
}

@Controller("workspaces/:workspaceId/ai")
@UseGuards(PermissionGuard)
@RequirePermission("ai:use_assistant")
export class AiUtilityController {
  constructor(private readonly ai: AiService) {}

  @Post("summarize")
  summarize(@Body() dto: SummarizeDto) {
    return this.ai.summarize(dto.text);
  }
}
