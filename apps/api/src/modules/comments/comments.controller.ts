import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { prisma } from "@navicore/db";
import { PermissionGuard } from "../rbac/guards/permission.guard";
import { RequirePermission } from "../rbac/decorators/require-permission.decorator";
import { CurrentUser } from "../rbac/decorators/current-user.decorator";
import { PermissionsService } from "../rbac/permissions.service";
import { CommentsService } from "./comments.service";
import { CommentableTypeDto, CreateCommentDto, UpdateCommentDto } from "./dto/comment.dto";

@Controller("workspaces/:workspaceId/comments")
@UseGuards(PermissionGuard)
export class CommentsController {
  constructor(
    private readonly comments: CommentsService,
    private readonly permissions: PermissionsService,
  ) {}

  @Post()
  @RequirePermission("comments:create")
  async create(
    @Param("workspaceId") workspaceId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: { id: string },
  ) {
    const workspace = await prisma.workspace.findUniqueOrThrow({
      where: { id: workspaceId },
      select: { organizationId: true },
    });
    return this.comments.create(workspaceId, workspace.organizationId, dto, user.id);
  }

  @Get()
  findForEntity(@Query("entityType") entityType: CommentableTypeDto, @Query("entityId") entityId: string) {
    return this.comments.findForEntity(entityType, entityId);
  }

  @Patch(":commentId")
  update(
    @Param("commentId") commentId: string,
    @Body() dto: UpdateCommentDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.comments.update(commentId, dto, user.id);
  }

  @Delete(":commentId")
  async remove(
    @Param("workspaceId") workspaceId: string,
    @Param("commentId") commentId: string,
    @CurrentUser() user: { id: string },
  ) {
    const canDeleteAny = await this.permissions.hasPermission(user.id, workspaceId, "comments:delete_any");
    return this.comments.remove(commentId, user.id, canDeleteAny);
  }
}
