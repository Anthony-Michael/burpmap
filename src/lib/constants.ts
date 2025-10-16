/**
 * Centralized immutable constants.
 * Invariants: values are used for UX expectations and tests.
 */

export const DURATIONS = Object.freeze({
  LOUD_10S: 10_000,
  PEAKS_30S: 30_000,
  COUNTDOWN_3S: 3_000,
});

export const AUDIO = Object.freeze({
  FFT_SIZE: 2048, // power of two for AnalyserNode
  FRAME_MS: 16, // target processing frame ~60fps
  PEAK_DEBOUNCE_MS: 500,
  MIN_SAMPLE_RATE: 16_000,
});

export const VALIDATION = Object.freeze({
  MIN_ALIAS_LEN: 3,
  MAX_ALIAS_LEN: 12,
});
