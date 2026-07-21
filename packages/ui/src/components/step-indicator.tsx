interface StepIndicatorProps {
  step: number;
  label: string;
  status: "upcoming" | "active" | "complete";
}

/**
 * See ../../design-tokens.md's "Numbered step indicators" section. Two
 * intended homes: onboarding, and the Automation workflow builder, where
 * trigger → conditions → actions (see apps/api's Workflow model) maps
 * directly onto a 3-step sequence.
 */
export function StepIndicator({ step, label, status }: StepIndicatorProps) {
  const numberColor = status === "upcoming" ? "text-[var(--color-text-muted)]" : "text-[var(--color-accent)]";
  const labelColor = status === "active" ? "text-[var(--color-text)]" : "text-[var(--color-text-muted)]";

  return (
    <div className="flex items-center gap-2">
      <span className={`font-mono text-sm ${numberColor}`}>{String(step).padStart(2, "0")}</span>
      <span className={`text-sm ${labelColor}`}>{label}</span>
    </div>
  );
}
