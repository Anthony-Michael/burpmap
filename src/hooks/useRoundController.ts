/**
 * Round controller: manages IDLE -> COUNTDOWN -> RUN -> FINISHED transitions.
 * Invariants: deterministic timers; safe to call start/stop/reset redundantly.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { type Mode, type RoundConfig, RoundState } from "../types";

interface Controller {
  state: RoundState;
  mode: Mode;
  timeLeftMs: number;
  isRunning: boolean;
  start: () => void;
  stop: () => void;
  reset: () => void;
  setMode: (mode: Mode, config: RoundConfig) => void;
}

export function useRoundController(initialMode: Mode, initialConfig: RoundConfig): Controller {
  const [state, setState] = useState<RoundState>(RoundState.IDLE);
  const [mode, setModeState] = useState<Mode>(initialMode);
  const [timeLeftMs, setTimeLeftMs] = useState<number>(initialConfig.durationMs);

  const cfgRef = useRef<RoundConfig>(initialConfig);
  const tickingRef = useRef<number | null>(null);
  const phaseRef = useRef<RoundState>(RoundState.IDLE);
  const endAtRef = useRef<number>(0);
  const countdownEndAtRef = useRef<number>(0);

  const clearTicker = (): void => {
    if (tickingRef.current !== null) {
      clearInterval(tickingRef.current);
      tickingRef.current = null;
    }
  };

  const stop = useCallback((): void => {
    clearTicker();
    if (phaseRef.current === RoundState.FINISHED) return;
    setState(RoundState.FINISHED);
    phaseRef.current = RoundState.FINISHED;
    setTimeLeftMs(0);
    cfgRef.current.onFinish?.();
  }, []);

  const tickCountdown = useCallback((): void => {
    const now = Date.now();
    const remaining = Math.max(0, countdownEndAtRef.current - now);
    cfgRef.current.onTick?.(remaining + cfgRef.current.durationMs);
    if (remaining <= 0) {
      // start run phase
      setState(RoundState.RUN);
      phaseRef.current = RoundState.RUN;
      endAtRef.current = Date.now() + cfgRef.current.durationMs;
    }
    setTimeLeftMs(remaining + cfgRef.current.durationMs);
  }, []);

  const tickRun = useCallback((): void => {
    const now = Date.now();
    const remaining = Math.max(0, endAtRef.current - now);
    setTimeLeftMs(remaining);
    cfgRef.current.onTick?.(remaining);
    if (remaining <= 0) stop();
  }, [stop]);

  const tick = useCallback((): void => {
    if (phaseRef.current === RoundState.COUNTDOWN) return tickCountdown();
    if (phaseRef.current === RoundState.RUN) return tickRun();
  }, [tickCountdown, tickRun]);

  const start = useCallback((): void => {
    if (phaseRef.current === RoundState.RUN || phaseRef.current === RoundState.COUNTDOWN) return;
    clearTicker();
    setState(RoundState.COUNTDOWN);
    phaseRef.current = RoundState.COUNTDOWN;
    countdownEndAtRef.current = Date.now() + cfgRef.current.countdownMs;
    endAtRef.current = 0;
    // immediate tick to sync UI
    tickCountdown();
    tickingRef.current = setInterval(tick, 50) as unknown as number;
  }, [tick, tickCountdown]);

  const reset = useCallback((): void => {
    clearTicker();
    setState(RoundState.IDLE);
    phaseRef.current = RoundState.IDLE;
    setTimeLeftMs(cfgRef.current.durationMs);
  }, []);

  const setMode = useCallback(
    (next: Mode, config: RoundConfig): void => {
      if (!config || config.durationMs <= 0 || config.countdownMs < 0) return;
      cfgRef.current = config;
      setModeState(next);
      reset();
    },
    [reset],
  );

  useEffect(() => () => clearTicker(), []);

  return {
    state,
    mode,
    timeLeftMs,
    isRunning: state === RoundState.COUNTDOWN || state === RoundState.RUN,
    start,
    stop,
    reset,
    setMode,
  };
}
