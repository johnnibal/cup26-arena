import Link from "next/link";

import { LEADERBOARD_PAGE_SIZE } from "@/lib/data/leaderboard";

type LeaderboardPaginationProps = {
  page: number;
  pageCount: number;
  totalCount: number;
};

export function LeaderboardPagination({ page, pageCount, totalCount }: LeaderboardPaginationProps) {
  if (pageCount <= 1) return null;

  const prev = Math.max(1, page - 1);
  const next = Math.min(pageCount, page + 1);
  const startIdx = totalCount === 0 ? 0 : (page - 1) * LEADERBOARD_PAGE_SIZE + 1;
  const endIdx = Math.min(page * LEADERBOARD_PAGE_SIZE, totalCount);

  return (
    <nav
      className="flex flex-col items-center justify-between gap-3 border-t border-white/[0.08] pt-5 text-sm text-muted sm:flex-row"
      aria-label="Leaderboard pagination"
    >
      <p className="tabular-nums">
        Showing <span className="font-semibold text-heading">{startIdx}</span>–
        <span className="font-semibold text-heading">{endIdx}</span> of{" "}
        <span className="font-semibold text-heading">{totalCount}</span>
      </p>
      <div className="flex items-center gap-2">
        <PaginationLink href={page <= 1 ? null : `/leaderboard?page=${prev}`} label="Previous" />
        <span className="px-2 text-xs font-medium text-muted">
          Page {page} / {pageCount}
        </span>
        <PaginationLink
          href={page >= pageCount ? null : `/leaderboard?page=${next}`}
          label="Next"
        />
      </div>
    </nav>
  );
}

function PaginationLink({ href, label }: { href: string | null; label: string }) {
  if (!href) {
    return (
      <span className="inline-flex h-9 cursor-not-allowed items-center rounded-lg border border-white/10 bg-surface-muted/30 px-3 text-xs font-medium text-muted/50">
        {label}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="inline-flex h-9 items-center rounded-lg border border-white/10 bg-surface-muted/50 px-3 text-xs font-semibold text-heading transition hover:border-team-primary/35 hover:bg-team-primary/10"
    >
      {label}
    </Link>
  );
}
