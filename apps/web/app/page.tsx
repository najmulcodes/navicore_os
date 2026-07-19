import { Sidebar } from "@/components/sidebar";
import { CommandPalette } from "@/components/command-palette";

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
          <h2 className="mb-1 text-xl font-semibold">Welcome back</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            This is Milestone 1.3&apos;s shell — layout, theming, and the command palette are wired
            up; real dashboard widgets (project status, deal pipeline, recent activity) are the
            next pass. See TODO.md.
          </p>
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
