interface EyebrowLabelProps {
  children: React.ReactNode;
  accent?: boolean;
}

/** See ../../design-tokens.md's "Eyebrow labels" section. */
export function EyebrowLabel({ children, accent = false }: EyebrowLabelProps) {
  return (
    <p
      className={`text-xs font-medium uppercase tracking-widest ${
        accent ? "text-[var(--color-accent)]" : "text-[var(--color-text-muted)]"
      }`}
    >
      {children}
    </p>
  );
}
