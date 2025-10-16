/**
 * Burp detector (WebAudio skeleton): local-only processing, no recording.
 * Invariants: cleans up tracks on stop; helpers are pure for testability.
 */

import { useCallback, useRef, useState } from "react";

import { AUDIO } from "../lib/constants";
import { logger } from "../lib/logger";

export interface DetectorControls {
  isReady: boolean;
  isActive: boolean;
  sampleRate: number | null;
  coverage: number; // 0..1 calibration progress
  peakDb: number;
  events: number;
  start: () => Promise<void>;
  stop: () => void;
  reset: () => void;
}

// Helpers kept small for testability
export const rms = (data: Float32Array): number => {
  if (data.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
  return Math.sqrt(sum / data.length);
};

export const toDbFS = (value: number): number => {
  if (value <= 1e-8) return -100; // floor
  return 20 * Math.log10(value);
};

export const isDebounced = (nowMs: number, lastMs: number, windowMs: number): boolean => {
  return nowMs - lastMs >= windowMs;
};

export function useBurpDetector(): DetectorControls {
  const [isReady, setReady] = useState(false);
  const [isActive, setActive] = useState(false);
  const [sampleRate, setSampleRate] = useState<number | null>(null);
  const [coverage, setCoverage] = useState(0);
  const [peakDb, setPeakDb] = useState(-100);
  const [events, setEvents] = useState(0);

  const audioRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const trackRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const calibRef = useRef<{ start: number; baseline: number }>({ start: 0, baseline: 0 });
  const lastEventAtRef = useRef<number>(0);

  const cleanup = (): void => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    analyserRef.current?.disconnect();
    sourceRef.current?.disconnect();
    audioRef.current?.close().catch(() => {});
    audioRef.current = null;
    analyserRef.current = null;
    sourceRef.current = null;
    if (trackRef.current) {
      trackRef.current.getTracks().forEach((t) => t.stop());
      trackRef.current = null;
    }
  };

  const processFrame = useCallback((): void => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const buf = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buf);
    const level = rms(buf);
    const db = toDbFS(level);

    // Calibration coverage and baseline
    const now = performance.now();
    const elapsed = now - calibRef.current.start;
    const cov = Math.min(1, elapsed / 1000);
    setCoverage(cov);
    if (cov < 1) {
      // moving average baseline during calibration
      calibRef.current.baseline = calibRef.current.baseline * 0.9 + Math.max(db, -100) * 0.1;
    } else {
      setPeakDb((p) => Math.max(p, db));
      const threshold = calibRef.current.baseline + 10 * Math.log10(3); // ~3x factor in dB
      if (db > threshold) {
        const ts = performance.now();
        if (isDebounced(ts, lastEventAtRef.current, AUDIO.PEAK_DEBOUNCE_MS)) {
          lastEventAtRef.current = ts;
          setEvents((e) => e + 1);
        }
      }
    }
    rafRef.current = requestAnimationFrame(processFrame);
  }, []);

  const start = useCallback(async (): Promise<void> => {
    if (isActive) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      trackRef.current = stream;
      const ctx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      if (ctx.sampleRate < AUDIO.MIN_SAMPLE_RATE) {
        logger.warn("Low sample rate", { sampleRate: ctx.sampleRate });
      }
      audioRef.current = ctx;
      setSampleRate(ctx.sampleRate);
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = AUDIO.FFT_SIZE;
      src.connect(analyser);
      analyserRef.current = analyser;
      sourceRef.current = src;

      calibRef.current = { start: performance.now(), baseline: -100 };
      setReady(true);
      setActive(true);
      setCoverage(0);
      setPeakDb(-100);
      setEvents(0);
      rafRef.current = requestAnimationFrame(processFrame);
    } catch (err) {
      logger.error("Microphone permission failed", { err: String(err) });
      cleanup();
      throw err;
    }
  }, [isActive, processFrame]);

  const stop = useCallback((): void => {
    if (!isActive) return;
    setActive(false);
    cleanup();
  }, [isActive]);

  const reset = useCallback((): void => {
    setReady(false);
    setActive(false);
    setCoverage(0);
    setPeakDb(-100);
    setEvents(0);
  }, []);

  return { isReady, isActive, sampleRate, coverage, peakDb, events, start, stop, reset };
}
