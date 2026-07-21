/**
 * Payload shape for every domain event emitted across the app — see
 * docs/PHASE_0_ARCHITECTURE.md §2 ("in-process, via NestJS's EventEmitter2").
 * Event names follow `${entityType}.${action}`, e.g. "task.created",
 * "deal.stage_changed" — ActivityModule's listener subscribes to all of them
 * via a wildcard and writes one ActivityLog row per event, generically.
 */
export interface DomainEvent {
  organizationId: string;
  // Nullable — org-level events (API key create/revoke, etc.) have no
  // natural workspace to attach to. Every workspace-scoped event still
  // passes a real string; this only widens the type, it doesn't change
  // behavior for the vast majority of emit() call sites. See CHANGELOG's
  // Phase 10 entry and ActivityLog's own schema comment for why.
  workspaceId: string | null;
  actorId: string;
  entityType: string;
  entityId: string;
  action: string;
  metadata?: Record<string, unknown>;
}
