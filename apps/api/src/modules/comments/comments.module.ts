import { Module } from "@nestjs/common";
import { RbacModule } from "../rbac/rbac.module";
import { CommentsService } from "./comments.service";
import { CommentsController } from "./comments.controller";

@Module({
  imports: [RbacModule],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
