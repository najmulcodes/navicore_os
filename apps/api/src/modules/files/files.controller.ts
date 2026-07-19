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
import { PermissionGuard } from "../rbac/guards/permission.guard";
import { RequirePermission } from "../rbac/decorators/require-permission.decorator";
import { CurrentUser } from "../rbac/decorators/current-user.decorator";
import { FilesService } from "./files.service";

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

@Controller("workspaces/:workspaceId/files")
@UseGuards(PermissionGuard)
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Post("folders")
  @RequirePermission("files:upload")
  createFolder(
    @Param("workspaceId") workspaceId: string,
    @Body("name") name: string,
    @Body("parentFolderId") parentFolderId: string | undefined,
    @CurrentUser() user: { id: string },
  ) {
    return this.files.createFolder(workspaceId, name, parentFolderId, user.id);
  }

  @Get()
  list(@Param("workspaceId") workspaceId: string, @Query("folderId") folderId?: string) {
    return this.files.listFolder(workspaceId, folderId ?? null);
  }

  @Post()
  @RequirePermission("files:upload")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_UPLOAD_BYTES } }))
  upload(
    @Param("workspaceId") workspaceId: string,
    @Body("folderId") folderId: string | undefined,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: { id: string },
  ) {
    return this.files.upload(workspaceId, folderId, file, user.id);
  }

  @Get(":fileAssetId/download-url")
  getDownloadUrl(@Param("workspaceId") workspaceId: string, @Param("fileAssetId") fileAssetId: string) {
    return this.files.getDownloadUrl(workspaceId, fileAssetId);
  }

  @Delete(":fileAssetId")
  @RequirePermission("files:delete")
  remove(@Param("workspaceId") workspaceId: string, @Param("fileAssetId") fileAssetId: string) {
    return this.files.remove(workspaceId, fileAssetId);
  }
}
