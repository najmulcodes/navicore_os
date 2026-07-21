import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { PermissionGuard } from "../rbac/guards/permission.guard";
import { RequirePermission } from "../rbac/decorators/require-permission.decorator";
import { CurrentUser } from "../rbac/decorators/current-user.decorator";
import { WebhooksService } from "./webhooks.service";
import { CreateWebhookSubscriptionDto, UpdateWebhookSubscriptionDto } from "./dto/webhook.dto";

@Controller("workspaces/:workspaceId/webhook-subscriptions")
@UseGuards(PermissionGuard)
@RequirePermission("webhooks:manage")
export class WebhooksController {
  constructor(private readonly webhooks: WebhooksService) {}

  @Post()
  create(
    @Param("workspaceId") workspaceId: string,
    @Body() dto: CreateWebhookSubscriptionDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.webhooks.create(workspaceId, dto, user.id);
  }

  @Get()
  findAll(@Param("workspaceId") workspaceId: string) {
    return this.webhooks.findAll(workspaceId);
  }

  @Patch(":subscriptionId")
  update(
    @Param("workspaceId") workspaceId: string,
    @Param("subscriptionId") subscriptionId: string,
    @Body() dto: UpdateWebhookSubscriptionDto,
  ) {
    return this.webhooks.update(workspaceId, subscriptionId, dto);
  }

  @Delete(":subscriptionId")
  remove(@Param("workspaceId") workspaceId: string, @Param("subscriptionId") subscriptionId: string) {
    return this.webhooks.remove(workspaceId, subscriptionId);
  }

  @Get(":subscriptionId/deliveries")
  findDeliveries(
    @Param("workspaceId") workspaceId: string,
    @Param("subscriptionId") subscriptionId: string,
  ) {
    return this.webhooks.findDeliveries(workspaceId, subscriptionId);
  }
}
