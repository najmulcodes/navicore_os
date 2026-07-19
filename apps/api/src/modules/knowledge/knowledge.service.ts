import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@navicore/db";
import { CreateKnowledgeArticleDto, UpdateKnowledgeArticleDto } from "./dto/knowledge.dto";

interface SearchResult {
  id: string;
  title: string;
  type: "knowledge_article" | "document";
  rank: number;
}

@Injectable()
export class KnowledgeService {
  create(workspaceId: string, dto: CreateKnowledgeArticleDto, actorId: string) {
    return prisma.knowledgeArticle.create({
      data: { workspaceId, title: dto.title, slug: dto.slug, content: dto.content, createdById: actorId },
    });
  }

  findAll(workspaceId: string) {
    return prisma.knowledgeArticle.findMany({
      where: { workspaceId, deletedAt: null },
      orderBy: { updatedAt: "desc" },
    });
  }

  async findOne(workspaceId: string, articleId: string) {
    const article = await prisma.knowledgeArticle.findFirst({
      where: { id: articleId, workspaceId, deletedAt: null },
    });
    if (!article) throw new NotFoundException("Article not found");
    return article;
  }

  async update(workspaceId: string, articleId: string, dto: UpdateKnowledgeArticleDto) {
    await this.findOne(workspaceId, articleId);
    return prisma.knowledgeArticle.update({ where: { id: articleId }, data: dto });
  }

  async publish(workspaceId: string, articleId: string) {
    await this.findOne(workspaceId, articleId);
    return prisma.knowledgeArticle.update({
      where: { id: articleId },
      data: { publishedAt: new Date() },
    });
  }

  /**
   * Postgres full-text search across Knowledge articles + Document titles,
   * scoped to a workspace. Deliberately raw SQL rather than a Prisma-modeled
   * tsvector column — Prisma's FTS support has historically been limited/
   * preview-gated across versions, and to_tsvector/plainto_tsquery are
   * standard, stable Postgres functions this doesn't need Prisma's help for.
   * This is NOT the pgvector/RAG semantic search Phase 6's AI Layer adds —
   * that's a separate, embeddings-based path (see the Embedding model and
   * apps/ai-service). This is the plain keyword search §6 of the Phase 0
   * architecture doc calls "search foundation... not yet AI-powered".
   */
  async search(workspaceId: string, query: string): Promise<SearchResult[]> {
    const results = await prisma.$queryRaw<SearchResult[]>`
      SELECT id, title, 'knowledge_article' AS type,
             ts_rank(to_tsvector('english', title || ' ' || content), plainto_tsquery('english', ${query})) AS rank
      FROM "KnowledgeArticle"
      WHERE "workspaceId" = ${workspaceId}
        AND "deletedAt" IS NULL
        AND to_tsvector('english', title || ' ' || content) @@ plainto_tsquery('english', ${query})
      UNION ALL
      SELECT d.id, d.title, 'document' AS type,
             ts_rank(to_tsvector('english', d.title || ' ' || COALESCE(dv.content, '')), plainto_tsquery('english', ${query})) AS rank
      FROM "Document" d
      LEFT JOIN "DocumentVersion" dv ON dv.id = d."currentVersionId"
      WHERE d."workspaceId" = ${workspaceId}
        AND d."deletedAt" IS NULL
        AND to_tsvector('english', d.title || ' ' || COALESCE(dv.content, '')) @@ plainto_tsquery('english', ${query})
      ORDER BY rank DESC
      LIMIT 20;
    `;
    return results;
  }
}
