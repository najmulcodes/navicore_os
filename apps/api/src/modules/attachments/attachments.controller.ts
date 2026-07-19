import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { prisma } from "@navicore/db";
import { PermissionGuard } from "../rbac/guards/permission.guard";
import { RequirePermission } from "../rbac/decorators/require-permission.decorator";
import { CurrentUser } from "../rbac/decorators/current-user.decorator";
import { AttachmentsService } from "./attachments.service";
import { CommentableTypeDto } from "../comments/dto/comment.dto";

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25MB — revisit once real usage patterns are known

@Controller("workspaces/:workspaceId/attachments")
@UseGuards(PermissionGuard)
export class AttachmentsController {
  constructor(private readonly attachments: AttachmentsService) {}

  @Post()
  @RequirePermission("files:upload")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_UPLOAD_BYTES } }))
  async upload(
    @Param("workspaceId") workspaceId: string,
    @Body("entityType") entityType: CommentableTypeDto,
    @Body("entityId") entityId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: { id: string },
  ) {
    const workspace = await prisma.workspace.findUniqueOrThrow({
      where: { id: workspaceId },
      select: { organizationId: true },
    });
    return this.attachments.upload(workspaceId, workspace.organizationId, entityType, entityId, file, user.id);
  }

  @Get()
  findForEntity(@Query("entityType") entityType: CommentableTypeDto, @Query("entityId") entityId: string) {
    return this.attachments.findForEntity(entityType, entityId);
  }

  @Get(":attachmentId/download-url")
  getDownloadUrl(@Param("attachmentId") attachmentId: string) {
    return this.attachments.getDownloadUrl(attachmentId);
  }

  @Delete(":attachmentId")
  @RequirePermission("files:delete")
  remove(@Param("attachmentId") attachmentId: string) {
    return this.attachments.remove(attachmentId);
  }
}
