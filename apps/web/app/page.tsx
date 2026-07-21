import { Sidebar } from "@/components/sidebar";
import { CommandPalette } from "@/components/command-palette";
import { EyebrowLabel, StatBlock } from "@navicore/ui";

export default function DashboardPage() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-3">
          <h1 className="text-sm font-medium text-[var(--color-text-muted)]">
            Product Team <span className="mx-1.5 text-[var(--color-border)]">/</span> Dashboard
          </h1>
          <kbd className="rounded border border-[var(--color-border)] px-1.5 py-0.5 font-mono text-xs text-[var(--color-text-muted)]">
            ⌘K
          </kbd>
        </header>
        <main className="flex-1 p-6">
          <EyebrowLabel>Overview</EyebrowLabel>
          <h2 className="mb-4 font-[family-name:var(--font-display)] text-2xl font-bold">
            Welcome back
          </h2>
          <div className="grid grid-cols-4 gap-4">
            <StatBlock value="12" label="Open tasks" />
            <StatBlock value="8" label="Active deals" trend="up" />
            <StatBlock value="$48,200" label="Weighted pipeline value" trend="up" />
            <StatBlock value="2" label="Overdue invoices" trend="down" />
          </div>
          <p className="mt-6 text-sm text-[var(--color-text-muted)]">
            This is Milestone 1.3&apos;s shell, now on navicore.co&apos;s actual brand tokens
            (packages/ui) — the stat blocks above use real design-system components, not
            one-off styling. Real dashboard data wiring is the next pass. See TODO.md.
          </p>
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
