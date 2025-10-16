/**
 * Tests: helper math for burp detector.
 */

import { describe, expect, it } from "vitest";

import { isDebounced, rms, toDbFS } from "../hooks/useBurpDetector";

describe("rms", () => {
  it("returns 0 for empty", () => {
    expect(rms(new Float32Array())).toBe(0);
  });
  it("computes RMS correctly", () => {
    const data = new Float32Array([1, -1, 1, -1]);
    expect(rms(data)).toBeCloseTo(1, 5);
  });
});

describe("toDbFS", () => {
  it("floors tiny values", () => {
    expect(toDbFS(0)).toBeLessThanOrEqual(-100);
  });
  it("converts amplitude to dBFS", () => {
    expect(Math.round(toDbFS(1))).toBe(0);
    expect(Math.round(toDbFS(0.5))).toBeCloseTo(-6, 0);
  });
});

describe("isDebounced", () => {
  it("enforces minimum spacing", () => {
    expect(isDebounced(1000, 400, 500)).toBe(true);
    expect(isDebounced(800, 400, 500)).toBe(false);
  });
});
