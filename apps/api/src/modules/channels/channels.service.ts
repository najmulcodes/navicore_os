import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@navicore/db";
import { CreateChannelDto } from "./dto/channel.dto";

@Injectable()
export class ChannelsService {
  async create(workspaceId: string, dto: CreateChannelDto, actorId: string) {
    const existing = await prisma.channel.findUnique({
      where: { workspaceId_slug: { workspaceId, slug: dto.slug } },
    });
    if (existing) throw new ConflictException(`Channel slug "${dto.slug}" already in use`);

    return prisma.$transaction(async (tx) => {
      const channel = await tx.channel.create({
        data: {
          workspaceId,
          name: dto.name,
          slug: dto.slug,
          isPrivate: dto.isPrivate ?? false,
          createdById: actorId,
        },
      });
      // Creator auto-joins — otherwise they'd have created a channel they
      // can't immediately post in.
      await tx.channelMember.create({ data: { channelId: channel.id, userId: actorId } });
      return channel;
    });
  }

  /**
   * Private channels only show up for members — public channels are
   * listable by anyone in the workspace (per the RBAC matrix's
   * "own only"/"scoped items only" pattern used elsewhere for Guest-tier
   * access, applied here to channel privacy instead of resource ownership).
   */
  async findAllForUser(workspaceId: string, userId: string) {
    return prisma.channel.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        OR: [{ isPrivate: false }, { members: { some: { userId } } }],
      },
      orderBy: { name: "asc" },
    });
  }

  async assertMember(channelId: string, userId: string): Promise<void> {
    const membership = await prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId } },
    });
    if (!membership) throw new ForbiddenException("Not a member of this channel");
  }

  async join(workspaceId: string, channelId: string, userId: string) {
    const channel = await prisma.channel.findFirst({
      where: { id: channelId, workspaceId, deletedAt: null },
    });
    if (!channel) throw new NotFoundException("Channel not found");
    if (channel.isPrivate) {
      throw new ForbiddenException("Private channels require an invite — join not allowed directly");
    }

    return prisma.channelMember.upsert({
      where: { channelId_userId: { channelId, userId } },
      update: {},
      create: { channelId, userId },
    });
  }

  /** For private channels — an existing member adds someone else directly, no invite-accept flow in this pass (see TECH_DEBT.md). */
  async addMember(channelId: string, userId: string) {
    return prisma.channelMember.upsert({
      where: { channelId_userId: { channelId, userId } },
      update: {},
      create: { channelId, userId },
    });
  }

  async leave(channelId: string, userId: string) {
    await prisma.channelMember.delete({ where: { channelId_userId: { channelId, userId } } });
  }

  async listMembers(channelId: string) {
    return prisma.channelMember.findMany({ where: { channelId } });
  }
}
