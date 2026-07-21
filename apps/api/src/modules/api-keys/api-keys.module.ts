import { Module } from "@nestjs/common";
import { RbacModule } from "../rbac/rbac.module";
import { ApiKeysService } from "./api-keys.service";
import { ApiKeysController } from "./api-keys.controller";

@Module({
  imports: [RbacModule],
  controllers: [ApiKeysController],
  providers: [ApiKeysService],
})
export class ApiKeysModule {}
