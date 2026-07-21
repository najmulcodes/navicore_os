import { DomainEvent } from "../../../common/domain-event";

interface SendWebhookConfig {
  url: string;
}

/**
 * Deliberately fire-and-forget, no retry queue — this is a workflow action
 * configured ad hoc ("as one step, also ping this URL"), not the persistent
 * subscription system in modules/webhooks, which does get retries and a
 * delivery audit trail. If this action needs reliability guarantees later,
 * route it through WEBHOOK_DELIVERIES_QUEUE instead of a direct fetch — not
 * done here to keep the two concepts (workflow step vs. subscription)
 * clearly separate. See TECH_DEBT.md.
 */
export async function executeSendWebhook(
  config: SendWebhookConfig,
  context: { event: DomainEvent },
): Promise<void> {
  const response = await fetch(config.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event: context.event }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`SEND_WEBHOOK action: ${config.url} responded ${response.status}`);
  }
}
