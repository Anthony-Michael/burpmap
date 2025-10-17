/**
 * Shared validation helpers.
 * Invariants: pure, side-effect free, and safe on untrusted input.
 */

import { VALIDATION } from "./constants";

const ALIAS_RE = /^[A-Za-z0-9 _.-]+$/;

export function validateAlias(input: string): boolean {
  if (typeof input !== "string") return false;
  const s = input.trim();
  if (s.length < VALIDATION.MIN_ALIAS_LEN) return false;
  if (s.length > VALIDATION.MAX_ALIAS_LEN) return false;
  return ALIAS_RE.test(s);
}

export function normalizeMetric(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  return Math.round(n);
}

export function validateCountryCode(code: string): boolean {
  if (typeof code !== "string") return false;
  return /^[A-Z]{2}$/.test(code);
}

export function validateMode(mode: string): boolean {
  return mode === "burp_loudest_10s" || mode === "burp_most_peaks_30s";
}

export function validateClientStats(stats: unknown): boolean {
  if (!stats || typeof stats !== "object") return false;
  const s = stats as Record<string, unknown>;
  return (
    typeof s.durationMs === "number" &&
    s.durationMs > 0 &&
    typeof s.coverage === "number" &&
    s.coverage >= 0 &&
    s.coverage <= 1 &&
    typeof s.sampleRate === "number" &&
    s.sampleRate >= 16000
  );
}

export function createHash(input: string): string {
  // Simple hash for rate limiting (not cryptographic)
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}
