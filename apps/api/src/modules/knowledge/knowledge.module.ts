import { Module } from "@nestjs/common";
import { RbacModule } from "../rbac/rbac.module";
import { KnowledgeService } from "./knowledge.service";
import { KnowledgeController } from "./knowledge.controller";

@Module({
  imports: [RbacModule],
  controllers: [KnowledgeController],
  providers: [KnowledgeService],
})
export class KnowledgeModule {}
