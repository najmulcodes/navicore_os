interface StatBlockProps {
  value: string;
  label: string;
  trend?: "up" | "down" | "flat";
}

/**
 * See ../../design-tokens.md's "Stat blocks" section. Primary home is the
 * Analytics module's KPI cards (see apps/api's AnalyticsController for the
 * data this renders), but the pattern applies anywhere a headline number
 * needs a quiet label under it.
 */
export function StatBlock({ value, label, trend }: StatBlockProps) {
  const trendColor =
    trend === "up" ? "text-[var(--color-accent)]" : trend === "down" ? "text-red-400" : "text-[var(--color-text-muted)]";

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
      <p className={`font-mono text-3xl font-bold ${trend ? trendColor : "text-[var(--color-text)]"}`}>
        {value}
      </p>
      <p className="mt-1 text-xs text-[var(--color-text-muted)]">{label}</p>
    </div>
  );
}
