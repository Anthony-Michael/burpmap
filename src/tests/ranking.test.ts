/**
 * Tests: ranking utilities for deterministic leaderboard sorting.
 */

import { describe, expect, it } from "vitest";

import { formatMetric, getTimeRange, getTopN, type ScoreEntry, sortScores } from "../lib/ranking";
import { Mode } from "../types";

describe("sortScores", () => {
  const mockScores: ScoreEntry[] = [
    {
      id: "1",
      game: "burp",
      mode: Mode.BurpLoudest10s,
      alias: "user1",
      country: "US",
      metric: 50,
      createdAt: 1000,
    },
    {
      id: "2",
      game: "burp",
      mode: Mode.BurpLoudest10s,
      alias: "user2",
      country: "GB",
      metric: 60,
      createdAt: 2000,
    },
    {
      id: "3",
      game: "burp",
      mode: Mode.BurpLoudest10s,
      alias: "user3",
      country: "CA",
      metric: 60, // tie with user2
      createdAt: 1000, // earlier timestamp wins
    },
  ];

  it("sorts by metric descending", () => {
    const result = sortScores(mockScores, Mode.BurpLoudest10s);
    expect(result[0].metric).toBe(60);
    expect(result[1].metric).toBe(60);
    expect(result[2].metric).toBe(50);
  });

  it("breaks ties by createdAt ascending", () => {
    const result = sortScores(mockScores, Mode.BurpLoudest10s);
    expect(result[0].alias).toBe("user3"); // earlier timestamp
    expect(result[1].alias).toBe("user2"); // later timestamp
  });

  it("filters by game and mode", () => {
    const mixedScores = [
      ...mockScores,
      {
        id: "4",
        game: "other",
        mode: Mode.BurpLoudest10s,
        alias: "other",
        country: "US",
        metric: 100,
        createdAt: 500,
      },
      {
        id: "5",
        game: "burp",
        mode: Mode.BurpMostPeaks30s,
        alias: "peaks",
        country: "US",
        metric: 100,
        createdAt: 500,
      },
    ];

    const result = sortScores(mixedScores, Mode.BurpLoudest10s);
    expect(result).toHaveLength(3);
    expect(result.every((entry) => entry.alias)).toBe(true);
  });
});

describe("getTopN", () => {
  const entries = Array.from({ length: 10 }, (_, i) => ({
    rank: i + 1,
    alias: `user${i + 1}`,
    country: "US",
    metric: 100 - i,
    createdAt: 1000 + i,
  }));

  it("returns top N entries", () => {
    const result = getTopN(entries, 5);
    expect(result).toHaveLength(5);
    expect(result[0].alias).toBe("user1");
    expect(result[4].alias).toBe("user5");
  });

  it("handles empty array", () => {
    const result = getTopN([], 5);
    expect(result).toHaveLength(0);
  });

  it("handles limit larger than array", () => {
    const result = getTopN(entries, 20);
    expect(result).toHaveLength(10);
  });
});

describe("formatMetric", () => {
  it("formats loudest mode", () => {
    expect(formatMetric(Mode.BurpLoudest10s, 50)).toBe("50 dBFS");
  });

  it("formats peaks mode", () => {
    expect(formatMetric(Mode.BurpMostPeaks30s, 15)).toBe("15 peaks");
  });
});

describe("getTimeRange", () => {
  it("returns daily range", () => {
    const { start, end } = getTimeRange("daily");
    expect(end - start).toBe(24 * 60 * 60 * 1000); // 24 hours
    expect(start % (24 * 60 * 60 * 1000)).toBe(0); // start of day
  });

  it("returns weekly range", () => {
    const { start, end } = getTimeRange("weekly");
    expect(end - start).toBe(7 * 24 * 60 * 60 * 1000); // 7 days
    const startDate = new Date(start);
    expect(startDate.getUTCDay()).toBe(1); // Monday
    expect(startDate.getUTCHours()).toBe(0); // 00:00 UTC
  });
});
