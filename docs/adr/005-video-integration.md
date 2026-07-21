# ADR-005: Video Call Integration — Provider Choice (Planning Only)

**Status:** Accepted
**Date:** 2026-07-22
**Deciders:** Founder/CTO

## Context

Phase 0's module list scopes this explicitly: "video-call integration planning (embed an existing provider — don't build video infra)." This ADR is that planning — it picks a provider and defines the integration point, but doesn't implement a working call. `Channel.videoRoomUrl` exists in the schema (Phase 8) as the landing spot for whatever this decision produces; nothing populates it yet.

## Decision

**Daily.co** for the embedded video API, called from a new (not yet built) endpoint that creates a room and stores the URL on `Channel.videoRoomUrl`.

## Options Considered

Evaluated against: fastest integration (this is a "start a call from a chat channel" feature, not NAVICORE's core product), reasonable free tier for early usage, no separate per-seat licensing that complicates NAVICORE's own per-org Stripe billing (Phase 5).

### Daily.co — chosen
**Pros:** widely cited as the fastest embeddable-video integration to a working prototype, a clean HTTP API (create a room, get a URL back — matches the "embed, don't build" framing exactly), 10,000 free minutes/month, genuine pay-as-you-go beyond that with no mandatory monthly base subscription.
**Cons:** hosted-only (no self-hosted option) — acceptable here since NAVICORE isn't trying to own video infrastructure per the roadmap's own instruction.

### LiveKit
**Pros:** open-source with a managed-cloud option, free tier, would fit NAVICORE's general preference (seen elsewhere in this stack — Better Auth, Supabase) for infrastructure it can self-host if needed.
**Cons:** more integration surface than Daily's room-URL model for a feature this secondary to the product; worth revisiting if video ever becomes a core differentiator rather than a "start a call from a channel" convenience feature.

### Zoom Video SDK
**Cons:** requires a mandatory monthly Build Platform subscription ($100+) regardless of usage, priced via a credit-pool model that doesn't map cleanly onto NAVICORE's own per-org subscription billing. Brand recognition doesn't offset the pricing/complexity mismatch for a secondary feature.

### Whereby Embedded
**Pros:** genuinely simple, permanent room URLs, lowest integration effort alongside Daily.
**Cons:** feature set is deliberately minimal (no transcription, no AI summaries) and large-meeting stability is weaker — not disqualifying for NAVICORE's use case, but Daily's API shape was judged a slightly better fit for a "create a room, get a URL, drop it in a chat channel" integration.

## Consequences

- **Not done by this ADR:** the actual endpoint (`POST workspaces/:workspaceId/channels/:channelId/video-room`, calling Daily's REST API, storing the result on `Channel.videoRoomUrl`), the `DAILY_API_KEY` env var, any UI. All tracked in TODO.md as the next step once this planning is acted on.
- Revisit trigger: if video becomes a core product feature rather than a channel convenience — re-evaluate LiveKit at that point, since self-hosting control matters more once the feature is load-bearing.

## Action Items

1. [ ] Add `DAILY_API_KEY` to `packages/config`'s env schema (optional, same pattern as Stripe/Supabase/Anthropic) when the endpoint is actually built
2. [ ] Build the room-creation endpoint + wire it into `ChatModule` or a new thin `VideoModule`
