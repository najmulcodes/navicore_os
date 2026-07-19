import { Injectable, NotFoundException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { prisma } from "@navicore/db";
import { StorageService } from "../../lib/storage.service";
import { CommentableTypeDto } from "../comments/dto/comment.dto";

@Injectable()
export class AttachmentsService {
  constructor(
    private readonly storage: StorageService,
    private readonly events: EventEmitter2,
  ) {}

  async upload(
    workspaceId: string,
    organizationId: string,
    entityType: CommentableTypeDto,
    entityId: string,
    file: Express.Multer.File,
    actorId: string,
  ) {
    const key = this.storage.buildKey(workspaceId, file.originalname);
    await this.storage.upload(key, file.buffer, file.mimetype);

    const attachment = await prisma.attachment.create({
      data: {
        entityType,
        entityId,
        storageKey: key,
        fileName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        uploadedById: actorId,
      },
    });

    this.events.emit("attachment.created", {
      organizationId,
      workspaceId,
      actorId,
      entityType: "attachment",
      entityId: attachment.id,
      action: "created",
      metadata: { onEntityType: entityType, onEntityId: entityId, fileName: file.originalname },
    });

    return attachment;
  }

  async findForEntity(entityType: CommentableTypeDto, entityId: string) {
    return prisma.attachment.findMany({
      where: { entityType, entityId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }

  async getDownloadUrl(attachmentId: string) {
    const attachment = await prisma.attachment.findFirst({
      where: { id: attachmentId, deletedAt: null },
    });
    if (!attachment) throw new NotFoundException("Attachment not found");

    return { url: await this.storage.getSignedDownloadUrl(attachment.storageKey) };
  }

  async remove(attachmentId: string) {
    const attachment = await prisma.attachment.findFirst({
      where: { id: attachmentId, deletedAt: null },
    });
    if (!attachment) throw new NotFoundException("Attachment not found");

    await this.storage.delete(attachment.storageKey);
    return prisma.attachment.update({
      where: { id: attachmentId },
      data: { deletedAt: new Date() },
    });
  }
}
