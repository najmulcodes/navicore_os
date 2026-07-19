import { BadRequestException, Body, Controller, Headers, Param, Post, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { OrgRoleGuard } from "../rbac/guards/org-role.guard";
import { RequireOrgRole } from "../rbac/decorators/require-org-role.decorator";
import { BillingService } from "./billing.service";
import { CreateCheckoutSessionDto } from "./dto/billing.dto";

@Controller("organizations/:organizationId/billing")
@UseGuards(OrgRoleGuard)
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Post("checkout-session")
  @RequireOrgRole("owner")
  createCheckoutSession(
    @Param("organizationId") organizationId: string,
    @Body() dto: CreateCheckoutSessionDto,
  ) {
    return this.billing.createCheckoutSession(organizationId, dto.planKey, dto.successUrl, dto.cancelUrl);
  }
}

/**
 * Separate, unguarded controller: Stripe calls this directly, there's no
 * user session to check — authenticity comes entirely from the webhook
 * signature (BillingService.handleWebhook), not from PermissionGuard/
 * OrgRoleGuard. Requires raw body — see BillingModule.configure(), which
 * applies express.raw() to exactly this path before Nest's normal body
 * handling would otherwise JSON-parse it.
 */
@Controller("webhooks/stripe")
export class StripeWebhookController {
  constructor(private readonly billing: BillingService) {}

  @Post()
  handleWebhook(@Req() req: Request, @Headers("stripe-signature") signature: string) {
    if (!signature) {
      throw new BadRequestException("Missing stripe-signature header");
    }
    // With express.raw() applied to this route, req.body is the raw Buffer,
    // not a parsed object — see BillingModule.
    return this.billing.handleWebhook(req.body as Buffer, signature);
  }
}
