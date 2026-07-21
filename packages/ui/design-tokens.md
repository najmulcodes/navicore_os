# NAVICORE OS Design Tokens & Patterns

Corrected 2026-07-23 to match navicore.co's actual brand system. If you're
building anything in `apps/web`, start here — not `docs/PHASE_0_ARCHITECTURE.md`'s
original "Reference points: Linear, Vercel, Stripe, Notion" line, which
predates this correction and is now wrong for anything visual (the
architecture, module, and API guidance elsewhere in that doc is unaffected).

## Colors

| Token | Value | Use |
|---|---|---|
| `--color-surface` | `#080D17` | Page background |
| `--color-surface-raised` | `#0D1B35` | Cards, sidebars, modals — anything sitting above the base surface |
| `--color-border` | `#1C2B4A` | Dividers, card borders |
| `--color-text` | `#E8ECF3` | Primary text |
| `--color-text-muted` | `#8B96AD` | Secondary text, labels |
| `--color-accent` | `#D4A843` | CTAs, links, active states, emphasis |
| `--color-accent-pressed` | `#C49A2A` | Hover/active state of accent elements |

**Gold is sparing, not structural.** It marks the one thing on a screen that
matters most — a primary button, an active nav item, a KPI trending in the
right direction. It is never a background fill for a card, section, or panel;
a gold-filled surface reads as a warning/alert state, not a brand moment.
When in doubt, use `--color-surface-raised` for the container and reserve
gold for a border, an icon, or the text/CTA inside it.

## Typography

- **Display** (`--font-display`, Plus Jakarta Sans, bold weights): page
  titles, section headers, the kind of large confident headline navicore.co's
  own hero uses. Not for body copy or UI chrome.
- **Body/UI** (`--font-sans`, Inter): everything else — labels, buttons,
  table content, form fields.
- **Monospace** (`--font-mono`, JetBrains Mono): **not just code.** Use it
  for:
  - KPI numbers on stat blocks (see below)
  - Timestamps
  - API keys, IDs, and other identifiers (task IDs, invoice numbers)
  - Anything the user might copy-paste

## Compositional patterns

Reused from navicore.co where a SaaS UI has a natural equivalent, rather than
inventing new conventions for the same job.

### Eyebrow labels

Small, uppercase, letter-spaced text above a section header — the
`text-transform: uppercase; letter-spacing: 0.08em` treatment navicore.co
uses above its own section headers. Use `--color-text-muted` or
`--color-accent` (sparingly — see above), never full text color; an eyebrow
label is a quiet cue, not a second headline.

```html
<p class="text-xs font-medium uppercase tracking-widest text-[var(--color-accent)]">
  Pipeline
</p>
<h2 class="font-display text-2xl font-bold">Deals by stage</h2>
```

### Stat blocks (big number + small label)

The Analytics module's KPI cards are the primary home for this pattern —
open tasks, pipeline value, MRR-equivalent, overdue invoices. Number in
`--font-mono`, large and bold; label small, muted, below or beside it.

```html
<div class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
  <p class="font-mono text-3xl font-bold text-[var(--color-text)]">$48,200</p>
  <p class="text-xs text-[var(--color-text-muted)]">Weighted pipeline value</p>
</div>
```

### Numbered step indicators (01 / 02 / 03)

For onboarding and the Automation workflow builder's step sequence
(trigger → conditions → actions maps naturally onto this). Two-digit,
zero-padded, `--font-mono`, muted until the step is active or complete, then
accent.

```html
<div class="flex items-center gap-2">
  <span class="font-mono text-sm text-[var(--color-accent)]">01</span>
  <span class="text-sm text-[var(--color-text)]">Trigger</span>
</div>
```

## Copy tone

Precise and confident, not cutesy. No exclamation points doing the work a
clear sentence should do, no "Oops!" on error states, no forced
personality. Say what happened and what to do about it.

- Not: "Oops! Looks like something went wrong 😬"
- Instead: "The workspace couldn't be created. Try a different slug."

## Component reference

`src/components/` has three working examples of the patterns above
(`EyebrowLabel`, `StatBlock`, `StepIndicator`) — real components, not just
documentation, since these three patterns recur across nearly every module
(Analytics' KPI cards, the workflow builder, onboarding).
