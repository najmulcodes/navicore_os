import { Injectable, NotFoundException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { prisma } from "@navicore/db";
import { CreateDocumentDto, CreateDocumentVersionDto } from "./dto/document.dto";

@Injectable()
export class DocumentsService {
  constructor(private readonly events: EventEmitter2) {}

  private async organizationIdFor(workspaceId: string): Promise<string> {
    const workspace = await prisma.workspace.findUniqueOrThrow({
      where: { id: workspaceId },
      select: { organizationId: true },
    });
    return workspace.organizationId;
  }

  async create(workspaceId: string, dto: CreateDocumentDto, actorId: string) {
    const document = await prisma.$transaction(async (tx) => {
      const doc = await tx.document.create({
        data: { workspaceId, title: dto.title, folderId: dto.folderId, createdById: actorId },
      });
      const version = await tx.documentVersion.create({
        data: { documentId: doc.id, versionNumber: 1, content: dto.content, createdById: actorId },
      });
      return tx.document.update({
        where: { id: doc.id },
        data: { currentVersionId: version.id },
        include: { currentVersion: true },
      });
    });

    this.events.emit("document.created", {
      organizationId: await this.organizationIdFor(workspaceId),
      workspaceId,
      actorId,
      entityType: "document",
      entityId: document.id,
      action: "created",
    });

    return document;
  }

  findAll(workspaceId: string) {
    return prisma.document.findMany({
      where: { workspaceId, deletedAt: null },
      include: { currentVersion: true },
      orderBy: { updatedAt: "desc" },
    });
  }

  async findOne(workspaceId: string, documentId: string) {
    const doc = await prisma.document.findFirst({
      where: { id: documentId, workspaceId, deletedAt: null },
      include: {
        currentVersion: true,
        versions: { orderBy: { versionNumber: "desc" } },
      },
    });
    if (!doc) throw new NotFoundException("Document not found");
    return doc;
  }

  async createVersion(workspaceId: string, documentId: string, dto: CreateDocumentVersionDto, actorId: string) {
    const doc = await this.findOne(workspaceId, documentId);
    const nextVersionNumber = (doc.versions[0]?.versionNumber ?? 0) + 1;

    const version = await prisma.documentVersion.create({
      data: { documentId, versionNumber: nextVersionNumber, content: dto.content, createdById: actorId },
    });
    const updated = await prisma.document.update({
      where: { id: documentId },
      data: { currentVersionId: version.id },
    });

    this.events.emit("document.version_created", {
      organizationId: await this.organizationIdFor(workspaceId),
      workspaceId,
      actorId,
      entityType: "document",
      entityId: documentId,
      action: "version_created",
      metadata: { versionNumber: nextVersionNumber },
    });

    return updated;
  }

  async requestApproval(workspaceId: string, documentId: string, approverId: string, actorId: string) {
    const doc = await this.findOne(workspaceId, documentId);
    if (!doc.currentVersionId) throw new NotFoundException("Document has no current version");

    const approval = await prisma.documentApproval.create({
      data: { documentVersionId: doc.currentVersionId, approverId },
    });

    this.events.emit("document.approval_requested", {
      organizationId: await this.organizationIdFor(workspaceId),
      workspaceId,
      actorId,
      entityType: "document",
      entityId: documentId,
      action: "approval_requested",
      metadata: { approverId },
    });

    return approval;
  }

  async reviewApproval(
    workspaceId: string,
    approvalId: string,
    status: "APPROVED" | "REJECTED",
    actorId: string,
  ) {
    const approval = await prisma.documentApproval.findFirst({
      where: { id: approvalId },
      include: { documentVersion: { include: { document: true } } },
    });
    if (!approval || approval.documentVersion.document.workspaceId !== workspaceId) {
      throw new NotFoundException("Approval not found");
    }

    const updated = await prisma.documentApproval.update({
      where: { id: approvalId },
      data: { status, respondedAt: new Date() },
    });

    this.events.emit("document.approval_reviewed", {
      organizationId: await this.organizationIdFor(workspaceId),
      workspaceId,
      actorId,
      entityType: "document",
      entityId: approval.documentVersion.document.id,
      action: "approval_reviewed",
      metadata: { status },
    });

    return updated;
  }
}
