import { Injectable, NotFoundException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { prisma } from "@navicore/db";
import {
  CreateCompanyDto,
  CreateContactDto,
  CreateDealDto,
  CreatePipelineStageDto,
  UpdateCompanyDto,
  UpdateContactDto,
  UpdateDealDto,
} from "./dto/crm.dto";

@Injectable()
export class CrmService {
  constructor(private readonly events: EventEmitter2) {}

  private async organizationIdFor(workspaceId: string): Promise<string> {
    const workspace = await prisma.workspace.findUniqueOrThrow({
      where: { id: workspaceId },
      select: { organizationId: true },
    });
    return workspace.organizationId;
  }

  // --- Companies -----------------------------------------------------------

  createCompany(workspaceId: string, dto: CreateCompanyDto) {
    return prisma.company.create({ data: { workspaceId, ...dto } });
  }

  findCompanies(workspaceId: string) {
    return prisma.company.findMany({ where: { workspaceId, deletedAt: null }, orderBy: { name: "asc" } });
  }

  async findCompany(workspaceId: string, companyId: string) {
    const company = await prisma.company.findFirst({
      where: { id: companyId, workspaceId, deletedAt: null },
      include: { contacts: true },
    });
    if (!company) throw new NotFoundException("Company not found");
    return company;
  }

  async updateCompany(workspaceId: string, companyId: string, dto: UpdateCompanyDto) {
    await this.findCompany(workspaceId, companyId);
    return prisma.company.update({ where: { id: companyId }, data: dto });
  }

  async removeCompany(workspaceId: string, companyId: string) {
    await this.findCompany(workspaceId, companyId);
    return prisma.company.update({ where: { id: companyId }, data: { deletedAt: new Date() } });
  }

  // --- Contacts --------------------------------------------------------------

  createContact(workspaceId: string, dto: CreateContactDto) {
    return prisma.contact.create({ data: { workspaceId, ...dto } });
  }

  findContacts(workspaceId: string) {
    return prisma.contact.findMany({ where: { workspaceId, deletedAt: null }, orderBy: { lastName: "asc" } });
  }

  async findContact(workspaceId: string, contactId: string) {
    const contact = await prisma.contact.findFirst({ where: { id: contactId, workspaceId, deletedAt: null } });
    if (!contact) throw new NotFoundException("Contact not found");
    return contact;
  }

  async updateContact(workspaceId: string, contactId: string, dto: UpdateContactDto) {
    await this.findContact(workspaceId, contactId);
    return prisma.contact.update({ where: { id: contactId }, data: dto });
  }

  async removeContact(workspaceId: string, contactId: string) {
    await this.findContact(workspaceId, contactId);
    return prisma.contact.update({ where: { id: contactId }, data: { deletedAt: new Date() } });
  }

  // --- Pipeline stages ---------------------------------------------------------

  createPipelineStage(workspaceId: string, dto: CreatePipelineStageDto) {
    return prisma.pipelineStage.create({
      data: { workspaceId, name: dto.name, order: dto.order, probability: dto.probability ?? 0 },
    });
  }

  findPipelineStages(workspaceId: string) {
    return prisma.pipelineStage.findMany({ where: { workspaceId }, orderBy: { order: "asc" } });
  }

  // --- Deals -----------------------------------------------------------------

  async createDeal(workspaceId: string, dto: CreateDealDto, actorId: string) {
    const stage = await prisma.pipelineStage.findFirst({ where: { id: dto.stageId, workspaceId } });
    if (!stage) throw new NotFoundException("Pipeline stage not found in this workspace");

    const deal = await prisma.$transaction(async (tx) => {
      const created = await tx.deal.create({
        data: {
          workspaceId,
          title: dto.title,
          companyId: dto.companyId,
          contactId: dto.contactId,
          stageId: dto.stageId,
          valueCents: dto.valueCents ?? 0,
          currency: dto.currency ?? "USD",
          expectedCloseDate: dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : undefined,
          ownerId: actorId,
        },
      });
      await tx.dealStageHistory.create({
        data: { dealId: created.id, toStageId: dto.stageId, changedById: actorId },
      });
      return created;
    });

    this.events.emit("deal.created", {
      organizationId: await this.organizationIdFor(workspaceId),
      workspaceId,
      actorId,
      entityType: "deal",
      entityId: deal.id,
      action: "created",
    });

    return deal;
  }

  findDeals(workspaceId: string) {
    return prisma.deal.findMany({
      where: { workspaceId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }

  async findDeal(workspaceId: string, dealId: string) {
    const deal = await prisma.deal.findFirst({
      where: { id: dealId, workspaceId, deletedAt: null },
      include: { stageHistory: { orderBy: { changedAt: "asc" } } },
    });
    if (!deal) throw new NotFoundException("Deal not found");
    return deal;
  }

  async updateDeal(workspaceId: string, dealId: string, dto: UpdateDealDto, actorId: string) {
    await this.findDeal(workspaceId, dealId);
    const updated = await prisma.deal.update({ where: { id: dealId }, data: dto });

    this.events.emit("deal.updated", {
      organizationId: await this.organizationIdFor(workspaceId),
      workspaceId,
      actorId,
      entityType: "deal",
      entityId: dealId,
      action: "updated",
      metadata: dto as Record<string, unknown>,
    });

    return updated;
  }

  async moveDealStage(workspaceId: string, dealId: string, stageId: string, actorId: string) {
    const existing = await this.findDeal(workspaceId, dealId);
    const stage = await prisma.pipelineStage.findFirst({ where: { id: stageId, workspaceId } });
    if (!stage) throw new NotFoundException("Pipeline stage not found in this workspace");

    const updated = await prisma.$transaction(async (tx) => {
      const deal = await tx.deal.update({ where: { id: dealId }, data: { stageId } });
      await tx.dealStageHistory.create({
        data: { dealId, fromStageId: existing.stageId, toStageId: stageId, changedById: actorId },
      });
      return deal;
    });

    this.events.emit("deal.stage_changed", {
      organizationId: await this.organizationIdFor(workspaceId),
      workspaceId,
      actorId,
      entityType: "deal",
      entityId: dealId,
      action: "stage_changed",
      metadata: { fromStageId: existing.stageId, toStageId: stageId },
    });

    return updated;
  }
}
