"use client";

import { useEffect, useState } from "react";

const PLACEHOLDER_COMMANDS = [
  "Go to Projects",
  "Go to Tasks",
  "Go to Deals",
  "Go to Documents",
  "Create new task",
];

/**
 * Built into the shell from day one, per the original build prompt: "Command
 * palette (Cmd+K)... retrofitting a command palette onto an existing app is
 * much more expensive than building it into the shell from day one."
 * Functional keyboard trigger + filtering; the command list itself is
 * placeholder text, not wired to real navigation/actions yet — see
 * TECH_DEBT.md.
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!open) return null;

  const filtered = PLACEHOLDER_COMMANDS.filter((c) =>
    c.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-32"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a command..."
          className="w-full border-b border-[var(--color-border)] bg-transparent px-4 py-3 text-sm outline-none placeholder:text-[var(--color-text-muted)]"
        />
        <ul className="max-h-80 overflow-y-auto p-2">
          {filtered.map((command) => (
            <li
              key={command}
              className="cursor-pointer rounded-md px-3 py-2 text-sm text-[var(--color-text)] hover:bg-white/5"
            >
              {command}
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-3 py-2 text-sm text-[var(--color-text-muted)]">No matches</li>
          )}
        </ul>
      </div>
    </div>
  );
}
