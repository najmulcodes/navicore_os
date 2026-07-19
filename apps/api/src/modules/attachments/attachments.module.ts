import { Module } from "@nestjs/common";
import { RbacModule } from "../rbac/rbac.module";
import { AttachmentsService } from "./attachments.service";
import { AttachmentsController } from "./attachments.controller";
import { StorageService } from "../../lib/storage.service";

@Module({
  imports: [RbacModule],
  controllers: [AttachmentsController],
  providers: [AttachmentsService, StorageService],
  exports: [AttachmentsService, StorageService],
})
export class AttachmentsModule {}
