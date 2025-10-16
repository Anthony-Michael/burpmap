/**
 * Types shared across BurpMap.
 * Invariants: enums are stable identifiers persisted in URLs/DB; avoid renaming.
 */

export enum Game {
  Burp = "burp",
}

export enum Mode {
  BurpLoudest10s = "burp_loudest_10s",
  BurpMostPeaks30s = "burp_most_peaks_30s",
}

export enum RoundState {
  IDLE = "IDLE",
  COUNTDOWN = "COUNTDOWN",
  RUN = "RUN",
  FINISHED = "FINISHED",
}

export interface RoundConfig {
  durationMs: number;
  countdownMs: number;
  onTick?: (remainingMs: number) => void;
  onFinish?: () => void;
}

export interface RoundStats {
  mode: Mode;
  score: number;
  startedAt: number | null;
  finishedAt: number | null;
}

export interface DetectorSnapshot {
  isReady: boolean;
  isActive: boolean;
  sampleRate: number | null;
  coverage: number; // 0..1 calibration progress
  peakDb: number; // current instantaneous peak in dBFS
  events: number; // debounced peak events
}
