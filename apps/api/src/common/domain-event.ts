/**
 * Payload shape for every domain event emitted across the app — see
 * docs/PHASE_0_ARCHITECTURE.md §2 ("in-process, via NestJS's EventEmitter2").
 * Event names follow `${entityType}.${action}`, e.g. "task.created",
 * "deal.stage_changed" — ActivityModule's listener subscribes to all of them
 * via a wildcard and writes one ActivityLog row per event, generically.
 */
export interface DomainEvent {
  organizationId: string;
  workspaceId: string;
  actorId: string;
  entityType: string;
  entityId: string;
  action: string;
  metadata?: Record<string, unknown>;
}
