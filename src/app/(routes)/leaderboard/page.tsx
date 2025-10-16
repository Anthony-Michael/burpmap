/**
 * Leaderboard placeholder: tabs and explanatory copy.
 * Invariants: no data fetching yet; UI-only.
 */
import type { ReactElement } from "react";

export default function LeaderboardPage(): ReactElement {
  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-semibold">Leaderboard</h1>
      <div className="mb-4 grid grid-cols-2 gap-2">
        <button className="rounded border px-3 py-2 text-sm" aria-label="Daily">
          Daily
        </button>
        <button className="rounded border px-3 py-2 text-sm" aria-label="Weekly">
          Weekly
        </button>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-2">
        <button className="rounded border px-3 py-2 text-sm" aria-label="Loudest 10 seconds">
          Loudest (10s)
        </button>
        <button className="rounded border px-3 py-2 text-sm" aria-label="Most peaks 30 seconds">
          Most Peaks (30s)
        </button>
      </div>
      <p className="text-sm text-gray-600">
        Scores will appear here once submission is wired. Only scores and coarse stats are stored.
      </p>
    </div>
  );
}
