import { Module } from "@nestjs/common";
import { RbacModule } from "../rbac/rbac.module";
import { FilesService } from "./files.service";
import { FilesController } from "./files.controller";
import { StorageService } from "../../lib/storage.service";

@Module({
  imports: [RbacModule],
  controllers: [FilesController],
  providers: [FilesService, StorageService],
})
export class FilesModule {}
