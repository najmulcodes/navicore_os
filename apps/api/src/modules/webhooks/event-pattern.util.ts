/**
 * Matches an event type string ("task.created") against a subscription
 * pattern ("task.*", "*.created", "*.*", or an exact "task.created"). Only
 * two segments supported (entityType.action) — matches DomainEvent's shape,
 * not a general glob.
 */
export function matchesEventPattern(eventType: string, pattern: string): boolean {
  const eventParts = eventType.split(".");
  const patternParts = pattern.split(".");
  if (eventParts.length !== patternParts.length) return false;

  return patternParts.every((part, i) => part === "*" || part === eventParts[i]);
}
