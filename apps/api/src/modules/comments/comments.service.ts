import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { prisma } from "@navicore/db";
import { CreateCommentDto, UpdateCommentDto } from "./dto/comment.dto";

@Injectable()
export class CommentsService {
  constructor(private readonly events: EventEmitter2) {}

  /**
   * Prisma can't enforce referential integrity on entityId (see the schema's
   * own comment on CommentableType) since it's a polymorphic pointer to one
   * of several tables. This is the check that makes that safe in practice —
   * without it, a comment could silently attach to a non-existent Task/Deal/
   * Document with no error.
   */
  private async assertEntityExists(entityType: CreateCommentDto["entityType"], entityId: string) {
    const exists = await (async () => {
      switch (entityType) {
        case "TASK":
          return prisma.task.findFirst({ where: { id: entityId, deletedAt: null }, select: { id: true } });
        case "DEAL":
          return prisma.deal.findFirst({ where: { id: entityId, deletedAt: null }, select: { id: true } });
        case "DOCUMENT":
          return prisma.document.findFirst({ where: { id: entityId, deletedAt: null }, select: { id: true } });
      }
    })();

    if (!exists) {
      throw new NotFoundException(`${entityType} ${entityId} not found`);
    }
  }

  async create(workspaceId: string, organizationId: string, dto: CreateCommentDto, actorId: string) {
    await this.assertEntityExists(dto.entityType, dto.entityId);

    const comment = await prisma.comment.create({
      data: {
        entityType: dto.entityType,
        entityId: dto.entityId,
        authorId: actorId,
        body: dto.body,
      },
    });

    this.events.emit("comment.created", {
      organizationId,
      workspaceId,
      actorId,
      entityType: "comment",
      entityId: comment.id,
      action: "created",
      metadata: { onEntityType: dto.entityType, onEntityId: dto.entityId },
    });

    return comment;
  }

  async findForEntity(entityType: CreateCommentDto["entityType"], entityId: string) {
    return prisma.comment.findMany({
      where: { entityType, entityId, deletedAt: null },
      orderBy: { createdAt: "asc" },
    });
  }

  async update(commentId: string, dto: UpdateCommentDto, actorId: string) {
    const comment = await prisma.comment.findFirst({ where: { id: commentId, deletedAt: null } });
    if (!comment) throw new NotFoundException("Comment not found");
    if (comment.authorId !== actorId) {
      throw new ForbiddenException("Can only edit your own comments");
    }

    return prisma.comment.update({ where: { id: commentId }, data: { body: dto.body } });
  }

  /**
   * comments:delete_any (Owner/Admin) vs. self-delete (any author, any role)
   * — the RBAC matrix grants delete_any separately; ordinary authors can
   * always delete their own comment regardless of role. isDeleteAnyAllowed
   * is resolved by the controller via PermissionGuard/PermissionsService and
   * passed in, rather than this service reaching into RBAC directly.
   */
  async remove(commentId: string, actorId: string, canDeleteAny: boolean) {
    const comment = await prisma.comment.findFirst({ where: { id: commentId, deletedAt: null } });
    if (!comment) throw new NotFoundException("Comment not found");
    if (comment.authorId !== actorId && !canDeleteAny) {
      throw new ForbiddenException("Not permitted to delete this comment");
    }

    return prisma.comment.update({ where: { id: commentId }, data: { deletedAt: new Date() } });
  }
}
