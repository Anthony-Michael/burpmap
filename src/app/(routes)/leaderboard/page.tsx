/**
 * Leaderboard: displays top scores with Daily/Weekly tabs and mode selection.
 * Invariants: read-only queries, mobile-first layout, deterministic sorting.
 */
"use client";

import { initializeApp } from "firebase/app";
import {
  collection,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import type { ReactElement } from "react";
import { useCallback, useEffect, useState } from "react";

import Screen from "../../../components/ui/Screen";
import type { LeaderboardEntry } from "../../../lib/ranking";
import { formatMetric, getTimeRange, getTopN, sortScores } from "../../../lib/ranking";
import { Mode } from "../../../types";

// Initialize Firebase (client-side)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

type TimeRange = "daily" | "weekly";

function useLeaderboardData(): {
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  viewMode: Mode;
  setViewMode: (mode: Mode) => void;
  entries: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
  setEntries: (entries: LeaderboardEntry[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
} {
  const [timeRange, setTimeRange] = useState<TimeRange>("daily");
  const [viewMode, setViewMode] = useState<Mode>(Mode.BurpLoudest10s);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  return {
    timeRange,
    setTimeRange,
    viewMode,
    setViewMode,
    entries,
    loading,
    error,
    setEntries,
    setLoading,
    setError,
  };
}

export default function LeaderboardPage(): ReactElement {
  const {
    timeRange,
    setTimeRange,
    viewMode,
    setViewMode,
    entries,
    loading,
    error,
    setEntries,
    setLoading,
    setError,
  } = useLeaderboardData();

  const buildQuery = useCallback(() => {
    const { start, end } = getTimeRange(timeRange);
    const scoresRef = collection(db, "scores");

    return query(
      scoresRef,
      where("game", "==", "burp"),
      where("mode", "==", viewMode),
      where("createdAt", ">=", start),
      where("createdAt", "<", end),
      orderBy("metric", "desc"),
      orderBy("createdAt", "asc"),
      limit(50),
    );
  }, [timeRange, viewMode]);

  const processScores = useCallback(
    (snapshot: { docs: Array<{ id: string; data: () => Record<string, unknown> }> }) => {
      const rawScores = snapshot.docs.map(
        (doc: { id: string; data: () => Record<string, unknown> }) => ({
          id: doc.id,
          ...doc.data(),
        }),
      ) as Array<{
        id: string;
        game: string;
        mode: Mode;
        alias: string;
        country: string;
        metric: number;
        createdAt: number;
      }>;

      const sorted = sortScores(rawScores, viewMode);
      return getTopN(sorted, 20);
    },
    [viewMode],
  );

  const loadScores = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const q = buildQuery();
      const snapshot = await getDocs(q);
      const topEntries = processScores(snapshot);
      setEntries(topEntries);
    } catch (err) {
      setError("Failed to load scores");
      console.error("Leaderboard error:", err);
    } finally {
      setLoading(false);
    }
  }, [buildQuery, processScores, setLoading, setError, setEntries]);

  useEffect(() => {
    void loadScores();
  }, [loadScores]);

  const formatResetTime = (type: TimeRange): string => {
    return type === "daily" ? "Resets daily at 00:00 UTC" : "Resets weekly on Monday at 00:00 UTC";
  };

  return (
    <Screen>
      <Screen.Header>
        <h1 className="text-xl font-semibold">Leaderboard</h1>
        <p className="text-xs text-gray-600">{formatResetTime(timeRange)}</p>
      </Screen.Header>

      <Screen.Body>
        <LeaderboardContent
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          viewMode={viewMode}
          setViewMode={setViewMode}
          entries={entries}
          loading={loading}
          error={error}
          onRetry={loadScores}
        />
      </Screen.Body>

      <Screen.Footer>
        <nav className="flex items-center justify-between text-sm">
          <a className="underline" href="/play">
            Play
          </a>
          <a className="underline" href="/leaderboard">
            Leaderboard
          </a>
          <a className="underline" href="/privacy">
            Privacy
          </a>
        </nav>
      </Screen.Footer>
    </Screen>
  );
}

function LeaderboardContent({
  timeRange,
  setTimeRange,
  viewMode,
  setViewMode,
  entries,
  loading,
  error,
  onRetry,
}: {
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  viewMode: Mode;
  setViewMode: (mode: Mode) => void;
  entries: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}): ReactElement {
  return (
    <div className="space-y-4">
      <TimeRangeTabs timeRange={timeRange} setTimeRange={setTimeRange} />
      <ModeTabs viewMode={viewMode} setViewMode={setViewMode} />
      <LeaderboardDisplay
        entries={entries}
        loading={loading}
        error={error}
        viewMode={viewMode}
        onRetry={onRetry}
      />
    </div>
  );
}

function TimeRangeTabs({
  timeRange,
  setTimeRange,
}: {
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
}): ReactElement {
  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        className={`rounded border px-3 py-2 text-sm ${
          timeRange === "daily" ? "bg-gray-900 text-white" : ""
        }`}
        onClick={() => setTimeRange("daily")}
        aria-pressed={timeRange === "daily"}
      >
        Daily
      </button>
      <button
        className={`rounded border px-3 py-2 text-sm ${
          timeRange === "weekly" ? "bg-gray-900 text-white" : ""
        }`}
        onClick={() => setTimeRange("weekly")}
        aria-pressed={timeRange === "weekly"}
      >
        Weekly
      </button>
    </div>
  );
}

function ModeTabs({
  viewMode,
  setViewMode,
}: {
  viewMode: Mode;
  setViewMode: (mode: Mode) => void;
}): ReactElement {
  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        className={`rounded border px-3 py-2 text-sm ${
          viewMode === Mode.BurpLoudest10s ? "bg-gray-900 text-white" : ""
        }`}
        onClick={() => setViewMode(Mode.BurpLoudest10s)}
        aria-pressed={viewMode === Mode.BurpLoudest10s}
      >
        Loudest (10s)
      </button>
      <button
        className={`rounded border px-3 py-2 text-sm ${
          viewMode === Mode.BurpMostPeaks30s ? "bg-gray-900 text-white" : ""
        }`}
        onClick={() => setViewMode(Mode.BurpMostPeaks30s)}
        aria-pressed={viewMode === Mode.BurpMostPeaks30s}
      >
        Most Peaks (30s)
      </button>
    </div>
  );
}

function LeaderboardDisplay({
  entries,
  loading,
  error,
  viewMode,
  onRetry,
}: {
  entries: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
  viewMode: Mode;
  onRetry: () => void;
}): ReactElement {
  if (loading) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-600">Loading scores...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded bg-red-100 p-3 text-red-800">
        <p className="text-sm">{error}</p>
        <button onClick={onRetry} className="mt-2 text-sm underline">
          Try again
        </button>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-600">No scores yet for this period.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-medium">
        Top {entries.length} - {formatMetric(viewMode, 0).replace("0", "")}
      </h2>
      <div className="space-y-1">
        {entries.map((entry) => (
          <div
            key={`${entry.rank}-${entry.alias}`}
            className="flex items-center justify-between rounded border p-3"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-gray-600">#{entry.rank}</span>
              <div>
                <p className="font-medium">{entry.alias}</p>
                <p className="text-sm text-gray-600">{entry.country}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold">{formatMetric(viewMode, entry.metric)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
