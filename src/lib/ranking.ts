/**
 * Ranking utilities for leaderboard sorting.
 * Invariants: deterministic tie-breaking, pure functions.
 */

import type { Mode } from "../types";

export interface ScoreEntry {
  id: string;
  game: string;
  mode: Mode;
  alias: string;
  country: string;
  metric: number;
  createdAt: number;
}

export interface LeaderboardEntry {
  rank: number;
  alias: string;
  country: string;
  metric: number;
  createdAt: number;
}

export function sortScores(entries: ScoreEntry[], mode: Mode): LeaderboardEntry[] {
  const sorted = [...entries]
    .filter((e) => e.game === "burp" && e.mode === mode)
    .sort((a, b) => {
      // Primary: metric (descending)
      if (b.metric !== a.metric) return b.metric - a.metric;
      // Secondary: createdAt (ascending - earlier wins ties)
      return a.createdAt - b.createdAt;
    });

  return sorted.map((entry, index) => ({
    rank: index + 1,
    alias: entry.alias,
    country: entry.country,
    metric: entry.metric,
    createdAt: entry.createdAt,
  }));
}

export function getTopN(entries: LeaderboardEntry[], limit: number): LeaderboardEntry[] {
  return entries.slice(0, limit);
}

export function formatMetric(mode: Mode, metric: number): string {
  if (mode === "burp_loudest_10s") {
    return `${metric} dBFS`;
  }
  return `${metric} peaks`;
}

export function getTimeRange(type: "daily" | "weekly"): { start: number; end: number } {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const weekMs = 7 * dayMs;

  if (type === "daily") {
    const startOfDay = new Date(now);
    startOfDay.setUTCHours(0, 0, 0, 0);
    return {
      start: startOfDay.getTime(),
      end: startOfDay.getTime() + dayMs,
    };
  }

  // Weekly: Monday 00:00 UTC
  const startOfWeek = new Date(now);
  const dayOfWeek = startOfWeek.getUTCDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  startOfWeek.setUTCDate(startOfWeek.getUTCDate() - daysToMonday);
  startOfWeek.setUTCHours(0, 0, 0, 0);

  return {
    start: startOfWeek.getTime(),
    end: startOfWeek.getTime() + weekMs,
  };
}
