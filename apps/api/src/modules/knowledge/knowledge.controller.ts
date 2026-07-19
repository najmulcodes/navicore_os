import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { PermissionGuard } from "../rbac/guards/permission.guard";
import { RequirePermission } from "../rbac/decorators/require-permission.decorator";
import { CurrentUser } from "../rbac/decorators/current-user.decorator";
import { KnowledgeService } from "./knowledge.service";
import { CreateKnowledgeArticleDto, UpdateKnowledgeArticleDto } from "./dto/knowledge.dto";

@Controller("workspaces/:workspaceId/knowledge")
@UseGuards(PermissionGuard)
export class KnowledgeController {
  constructor(private readonly knowledge: KnowledgeService) {}

  @Post("articles")
  @RequirePermission("knowledge:create")
  create(
    @Param("workspaceId") workspaceId: string,
    @Body() dto: CreateKnowledgeArticleDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.knowledge.create(workspaceId, dto, user.id);
  }

  @Get("articles")
  findAll(@Param("workspaceId") workspaceId: string) {
    return this.knowledge.findAll(workspaceId);
  }

  @Get("articles/:articleId")
  findOne(@Param("workspaceId") workspaceId: string, @Param("articleId") articleId: string) {
    return this.knowledge.findOne(workspaceId, articleId);
  }

  @Patch("articles/:articleId")
  @RequirePermission("knowledge:create")
  update(
    @Param("workspaceId") workspaceId: string,
    @Param("articleId") articleId: string,
    @Body() dto: UpdateKnowledgeArticleDto,
  ) {
    return this.knowledge.update(workspaceId, articleId, dto);
  }

  @Post("articles/:articleId/publish")
  @RequirePermission("knowledge:publish")
  publish(@Param("workspaceId") workspaceId: string, @Param("articleId") articleId: string) {
    return this.knowledge.publish(workspaceId, articleId);
  }

  @Get("search")
  search(@Param("workspaceId") workspaceId: string, @Query("q") q: string) {
    return this.knowledge.search(workspaceId, q);
  }
}
