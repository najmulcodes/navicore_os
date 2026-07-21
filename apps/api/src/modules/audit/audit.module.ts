import { Module } from "@nestjs/common";
import { RbacModule } from "../rbac/rbac.module";
import { AuditService } from "./audit.service";
import { AuditController } from "./audit.controller";

@Module({
  imports: [RbacModule],
  controllers: [AuditController],
  providers: [AuditService],
})
export class AuditModule {}
