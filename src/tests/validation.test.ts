/**
 * Tests: validation helpers for input sanitization and anti-cheat.
 */

import { describe, expect, it } from "vitest";

import {
  createHash,
  normalizeMetric,
  validateAlias,
  validateClientStats,
  validateCountryCode,
  validateMode,
} from "../lib/validation";

describe("validateAlias", () => {
  it("accepts valid aliases", () => {
    expect(validateAlias("user123")).toBe(true);
    expect(validateAlias("test_user")).toBe(true);
    expect(validateAlias("user.name")).toBe(true);
    expect(validateAlias("user-name")).toBe(true);
  });

  it("rejects invalid aliases", () => {
    expect(validateAlias("ab")).toBe(false); // too short
    expect(validateAlias("a".repeat(13))).toBe(false); // too long
    expect(validateAlias("user@domain")).toBe(false); // invalid char
    expect(validateAlias("")).toBe(false); // empty
    expect(validateAlias("   ")).toBe(false); // whitespace only
  });
});

describe("validateCountryCode", () => {
  it("accepts valid country codes", () => {
    expect(validateCountryCode("US")).toBe(true);
    expect(validateCountryCode("GB")).toBe(true);
    expect(validateCountryCode("CA")).toBe(true);
  });

  it("rejects invalid country codes", () => {
    expect(validateCountryCode("usa")).toBe(false); // lowercase
    expect(validateCountryCode("USA")).toBe(false); // 3 letters
    expect(validateCountryCode("U")).toBe(false); // 1 letter
    expect(validateCountryCode("")).toBe(false); // empty
  });
});

describe("validateMode", () => {
  it("accepts valid modes", () => {
    expect(validateMode("burp_loudest_10s")).toBe(true);
    expect(validateMode("burp_most_peaks_30s")).toBe(true);
  });

  it("rejects invalid modes", () => {
    expect(validateMode("invalid")).toBe(false);
    expect(validateMode("burp_loudest")).toBe(false);
    expect(validateMode("")).toBe(false);
  });
});

describe("validateClientStats", () => {
  it("accepts valid stats", () => {
    expect(
      validateClientStats({
        durationMs: 10000,
        coverage: 0.9,
        sampleRate: 44100,
      }),
    ).toBe(true);
  });

  it("rejects invalid stats", () => {
    expect(validateClientStats(null)).toBe(false);
    expect(validateClientStats({})).toBe(false);
    expect(
      validateClientStats({
        durationMs: -1000,
        coverage: 0.9,
        sampleRate: 44100,
      }),
    ).toBe(false);
    expect(
      validateClientStats({
        durationMs: 10000,
        coverage: 1.5,
        sampleRate: 44100,
      }),
    ).toBe(false);
    expect(
      validateClientStats({
        durationMs: 10000,
        coverage: 0.9,
        sampleRate: 8000,
      }),
    ).toBe(false);
  });
});

describe("normalizeMetric", () => {
  it("handles valid numbers", () => {
    expect(normalizeMetric(42.7)).toBe(43);
    expect(normalizeMetric(0)).toBe(0);
    expect(normalizeMetric(100)).toBe(100);
  });

  it("handles invalid numbers", () => {
    expect(normalizeMetric(NaN)).toBe(0);
    expect(normalizeMetric(Infinity)).toBe(0);
    expect(normalizeMetric(-5)).toBe(0);
  });
});

describe("createHash", () => {
  it("produces consistent hashes", () => {
    const input = "test string";
    const hash1 = createHash(input);
    const hash2 = createHash(input);
    expect(hash1).toBe(hash2);
  });

  it("produces different hashes for different inputs", () => {
    const hash1 = createHash("input1");
    const hash2 = createHash("input2");
    expect(hash1).not.toBe(hash2);
  });
});
