import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { PermissionGuard } from "../rbac/guards/permission.guard";
import { RequirePermission } from "../rbac/decorators/require-permission.decorator";
import { CurrentUser } from "../rbac/decorators/current-user.decorator";
import { ChannelsService } from "./channels.service";
import { CreateChannelDto } from "./dto/channel.dto";

@Controller("workspaces/:workspaceId/channels")
@UseGuards(PermissionGuard)
export class ChannelsController {
  constructor(private readonly channels: ChannelsService) {}

  @Post()
  @RequirePermission("channels:manage")
  create(
    @Param("workspaceId") workspaceId: string,
    @Body() dto: CreateChannelDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.channels.create(workspaceId, dto, user.id);
  }

  @Get()
  findAll(@Param("workspaceId") workspaceId: string, @CurrentUser() user: { id: string }) {
    return this.channels.findAllForUser(workspaceId, user.id);
  }

  @Post(":channelId/join")
  join(
    @Param("workspaceId") workspaceId: string,
    @Param("channelId") channelId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.channels.join(workspaceId, channelId, user.id);
  }

  @Post(":channelId/members/:userId")
  @RequirePermission("channels:manage")
  addMember(@Param("channelId") channelId: string, @Param("userId") userId: string) {
    return this.channels.addMember(channelId, userId);
  }

  @Delete(":channelId/leave")
  leave(@Param("channelId") channelId: string, @CurrentUser() user: { id: string }) {
    return this.channels.leave(channelId, user.id);
  }

  @Get(":channelId/members")
  listMembers(@Param("channelId") channelId: string) {
    return this.channels.listMembers(channelId);
  }
}
