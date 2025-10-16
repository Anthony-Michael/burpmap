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
