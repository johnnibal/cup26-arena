"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import { AvatarFlag } from "@/components/profile/AvatarFlag";
import { updateFavoriteTeam } from "@/lib/actions/profile";
import type { Team } from "@/types/domain";

type FlagPickerProps = {
  teams: Team[];
  currentCode: string | null;
};

// Searchable, group-stage-organised picker. Clicking a team fires the
// server action and revalidates the main layout, which refreshes the
// theme variables and navbar avatar on the next render.
export function FlagPicker({ teams, currentCode }: FlagPickerProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(currentCode);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Keep in sync with server when not saving (avoid clearing optimistic pick mid-request).
  useEffect(() => {
    if (pending) return;
    setSelected(currentCode);
  }, [currentCode, pending]);

  const filteredGroups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? teams.filter(
          (t) => t.name.toLowerCase().includes(needle) || t.code.toLowerCase().includes(needle),
        )
      : teams;

    const groups = new Map<string, Team[]>();
    for (const t of filtered) {
      const arr = groups.get(t.group_letter) ?? [];
      arr.push(t);
      groups.set(t.group_letter, arr);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [teams, query]);

  const handleSelect = (code: string) => {
    if (pending) return;
    const previous = selected;
    setSelected(code);
    setError(null);

    startTransition(async () => {
      const result = await updateFavoriteTeam(code);
      if (!result.ok) {
        setSelected(previous);
        setError(result.error);
        return;
      }
      await router.refresh();
    });
  };

  const handleClear = () => {
    if (pending || selected === null) return;
    const previous = selected;
    setSelected(null);
    setError(null);

    startTransition(async () => {
      const result = await updateFavoriteTeam(null);
      if (!result.ok) {
        setSelected(previous);
        setError(result.error);
        return;
      }
      await router.refresh();
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex-1">
          <span className="sr-only">Search teams</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search country or code (e.g. BRA)"
            className="focus:ring-team-primary/20 w-full rounded-xl border border-white/10 bg-surface-muted/50 px-4 py-2.5 text-sm text-heading shadow-inner outline-none transition placeholder:text-muted/60 focus:border-team-primary focus:ring-2"
          />
        </label>
        <button
          type="button"
          onClick={handleClear}
          disabled={pending || selected === null}
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-surface-muted/40 px-4 text-xs font-semibold text-muted transition hover:border-white/20 hover:text-heading disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear selection
        </button>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-brand-accent/35 bg-brand-accent/10 px-3 py-2 text-xs text-rose-300"
        >
          {error}
        </p>
      ) : null}

      {filteredGroups.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/15 bg-surface-muted/30 p-8 text-center text-sm text-muted">
          No teams match &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <div className="space-y-6">
          {filteredGroups.map(([letter, members]) => (
            <section key={letter} aria-labelledby={`group-${letter}-heading`}>
              <h3
                id={`group-${letter}-heading`}
                className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-muted"
              >
                <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[10px] text-heading">
                  Group {letter}
                </span>
              </h3>
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {members.map((team) => {
                  const isSelected = selected === team.code;
                  const primary = team.primary_color;
                  return (
                    <li key={team.code}>
                      <button
                        type="button"
                        onClick={() => handleSelect(team.code)}
                        disabled={pending}
                        aria-pressed={isSelected}
                        style={
                          isSelected && primary
                            ? {
                                boxShadow: `inset 0 0 0 1px ${primary}, 0 0 24px -8px ${primary}`,
                              }
                            : undefined
                        }
                        className={cx(
                          "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left shadow-card transition",
                          "hover:border-white/15 hover:bg-surface-muted/50 disabled:cursor-not-allowed disabled:opacity-60",
                          isSelected
                            ? "border-team-primary/50 bg-team-primary/10 ring-2 ring-team-primary/35"
                            : "border-white/[0.08] bg-surface-muted/35",
                        )}
                      >
                        <AvatarFlag team={team} size="md" coloredGlow={false} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-heading">
                            {team.name}
                          </span>
                          <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted">
                            {team.code}
                          </span>
                        </span>
                        {isSelected ? (
                          <span
                            aria-hidden
                            className="flex h-6 w-6 items-center justify-center rounded-full bg-team-primary text-xs font-bold text-team-ink"
                          >
                            ✓
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function cx(...parts: Array<string | undefined | false>): string {
  return parts.filter(Boolean).join(" ");
}
