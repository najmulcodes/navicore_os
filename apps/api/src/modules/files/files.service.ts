import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@navicore/db";
import { StorageService } from "../../lib/storage.service";

@Injectable()
export class FilesService {
  constructor(private readonly storage: StorageService) {}

  createFolder(workspaceId: string, name: string, parentFolderId: string | undefined, actorId: string) {
    return prisma.folder.create({ data: { workspaceId, name, parentFolderId, createdById: actorId } });
  }

  listFolder(workspaceId: string, folderId: string | null) {
    return Promise.all([
      prisma.folder.findMany({ where: { workspaceId, parentFolderId: folderId } }),
      prisma.fileAsset.findMany({ where: { workspaceId, folderId, deletedAt: null } }),
    ]).then(([folders, files]) => ({ folders, files }));
  }

  async upload(
    workspaceId: string,
    folderId: string | undefined,
    file: Express.Multer.File,
    actorId: string,
  ) {
    const key = this.storage.buildKey(workspaceId, file.originalname);
    await this.storage.upload(key, file.buffer, file.mimetype);

    return prisma.fileAsset.create({
      data: {
        workspaceId,
        folderId,
        storageKey: key,
        fileName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        uploadedById: actorId,
      },
    });
  }

  async getDownloadUrl(workspaceId: string, fileAssetId: string) {
    const file = await prisma.fileAsset.findFirst({
      where: { id: fileAssetId, workspaceId, deletedAt: null },
    });
    if (!file) throw new NotFoundException("File not found");
    return { url: await this.storage.getSignedDownloadUrl(file.storageKey) };
  }

  async remove(workspaceId: string, fileAssetId: string) {
    const file = await prisma.fileAsset.findFirst({
      where: { id: fileAssetId, workspaceId, deletedAt: null },
    });
    if (!file) throw new NotFoundException("File not found");

    await this.storage.delete(file.storageKey);
    return prisma.fileAsset.update({ where: { id: fileAssetId }, data: { deletedAt: new Date() } });
  }
}
