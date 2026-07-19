const NAV_ITEMS = [
  { label: "Dashboard", href: "#" },
  { label: "Projects", href: "#" },
  { label: "Tasks", href: "#" },
  { label: "Deals", href: "#" },
  { label: "Documents", href: "#" },
  { label: "Knowledge base", href: "#" },
  { label: "Invoices", href: "#" },
  { label: "Assistant", href: "#" },
];

export function Sidebar() {
  return (
    <aside className="flex w-56 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
      <div className="mb-6 flex items-center gap-2 px-2">
        <div className="h-2 w-2 rounded-full bg-[var(--color-navicore-cyan)]" />
        <span className="font-semibold tracking-tight">NAVICORE OS</span>
      </div>
      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="rounded-md px-2 py-1.5 text-sm text-[var(--color-text-muted)] transition-colors hover:bg-white/5 hover:text-[var(--color-text)]"
          >
            {item.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
