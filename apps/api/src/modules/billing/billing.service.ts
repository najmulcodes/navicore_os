import { Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import Stripe from "stripe";
import { prisma } from "@navicore/db";

/**
 * This is NAVICORE's own revenue infrastructure (organization -> Plan
 * subscription), separate from the customer-facing Invoicing/Payments in
 * FinanceModule — see docs/PHASE_0_ARCHITECTURE.md's Finance module
 * description. Every method here needs a real STRIPE_SECRET_KEY (test-mode
 * is fine) to actually run — none of this has been exercised against a real
 * Stripe account. See TECH_DEBT.md.
 */
@Injectable()
export class BillingService {
  private client: Stripe | null = null;

  private getClient(): Stripe {
    if (this.client) return this.client;

    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new InternalServerErrorException(
        "Billing isn't configured — STRIPE_SECRET_KEY is unset. See .env.example.",
      );
    }
    // API version pinned explicitly rather than left to the SDK default, so
    // a Stripe account-level API upgrade can't silently change this app's
    // behavior. Verify this is still current before going live — Stripe
    // ships new API versions regularly.
    this.client = new Stripe(key, { apiVersion: "2025-06-30.basil" as Stripe.LatestApiVersion });
    return this.client;
  }

  async createCheckoutSession(
    organizationId: string,
    planKey: string,
    successUrl: string,
    cancelUrl: string,
  ) {
    const plan = await prisma.plan.findUnique({ where: { key: planKey } });
    if (!plan || !plan.stripePriceId) {
      throw new NotFoundException(`Plan "${planKey}" not found or has no Stripe price configured`);
    }

    const existingSub = await prisma.subscription.findUnique({ where: { organizationId } });

    const session = await this.getClient().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      // Reuses the existing Stripe customer if this org already has one
      // (e.g. was on a different plan before); Stripe creates a new customer
      // automatically on first checkout otherwise. There's no organization
      // email field to pre-fill customer_email with yet — see TECH_DEBT.md.
      customer: existingSub?.stripeCustomerId ?? undefined,
      client_reference_id: organizationId,
      metadata: { organizationId, planKey },
    });

    return { checkoutUrl: session.url };
  }

  /**
   * Verifies the Stripe signature and updates Subscription state. Wire this
   * into a raw-body POST route (Stripe requires the unparsed request body for
   * signature verification — see billing.controller.ts's use of `rawBody`).
   */
  async handleWebhook(rawBody: Buffer, signature: string) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new InternalServerErrorException("STRIPE_WEBHOOK_SECRET is unset — cannot verify webhook.");
    }

    const event = this.getClient().webhooks.constructEvent(rawBody, signature, webhookSecret);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const organizationId = session.metadata?.organizationId;
        const planKey = session.metadata?.planKey;
        if (!organizationId || !planKey) break;

        const plan = await prisma.plan.findUnique({ where: { key: planKey } });
        if (!plan) break;

        await prisma.subscription.upsert({
          where: { organizationId },
          update: {
            planId: plan.id,
            stripeCustomerId: String(session.customer),
            stripeSubscriptionId: String(session.subscription),
            status: "ACTIVE",
          },
          create: {
            organizationId,
            planId: plan.id,
            stripeCustomerId: String(session.customer),
            stripeSubscriptionId: String(session.subscription),
            status: "ACTIVE",
          },
        });
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const existing = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: sub.id },
        });
        if (!existing) break;

        await prisma.subscription.update({
          where: { id: existing.id },
          data: {
            status: mapStripeStatus(sub.status),
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          },
        });
        break;
      }
      // Other event types intentionally ignored — this is a starting point,
      // not a complete webhook handler. See TECH_DEBT.md.
    }

    return { received: true };
  }
}

function mapStripeStatus(
  status: Stripe.Subscription.Status,
): "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "INCOMPLETE" {
  switch (status) {
    case "trialing":
      return "TRIALING";
    case "active":
      return "ACTIVE";
    case "past_due":
    case "unpaid":
      return "PAST_DUE";
    case "canceled":
      return "CANCELED";
    default:
      return "INCOMPLETE";
  }
}
