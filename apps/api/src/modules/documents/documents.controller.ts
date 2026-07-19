import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { PermissionGuard } from "../rbac/guards/permission.guard";
import { RequirePermission } from "../rbac/decorators/require-permission.decorator";
import { CurrentUser } from "../rbac/decorators/current-user.decorator";
import { DocumentsService } from "./documents.service";
import { CreateDocumentDto, CreateDocumentVersionDto, ReviewApprovalDto } from "./dto/document.dto";

@Controller("workspaces/:workspaceId/documents")
@UseGuards(PermissionGuard)
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Post()
  @RequirePermission("documents:create")
  create(
    @Param("workspaceId") workspaceId: string,
    @Body() dto: CreateDocumentDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.documents.create(workspaceId, dto, user.id);
  }

  @Get()
  findAll(@Param("workspaceId") workspaceId: string) {
    return this.documents.findAll(workspaceId);
  }

  @Get(":documentId")
  findOne(@Param("workspaceId") workspaceId: string, @Param("documentId") documentId: string) {
    return this.documents.findOne(workspaceId, documentId);
  }

  @Post(":documentId/versions")
  @RequirePermission("documents:update")
  createVersion(
    @Param("workspaceId") workspaceId: string,
    @Param("documentId") documentId: string,
    @Body() dto: CreateDocumentVersionDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.documents.createVersion(workspaceId, documentId, dto, user.id);
  }

  @Post(":documentId/approvals")
  @RequirePermission("documents:update")
  requestApproval(
    @Param("workspaceId") workspaceId: string,
    @Param("documentId") documentId: string,
    @Body("approverId") approverId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.documents.requestApproval(workspaceId, documentId, approverId, user.id);
  }

  @Post("approvals/:approvalId/review")
  @RequirePermission("documents:approve")
  reviewApproval(
    @Param("workspaceId") workspaceId: string,
    @Param("approvalId") approvalId: string,
    @Body() dto: ReviewApprovalDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.documents.reviewApproval(workspaceId, approvalId, dto.status, user.id);
  }
}
