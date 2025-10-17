/**
 * Play page: run a round with modes, timer, and submission panel.
 * Invariants: local audio only; submission UI shown post-finish.
 */

"use client";

import type { ReactElement } from "react";
import { useCallback, useMemo, useState } from "react";

import Screen from "../../../components/ui/Screen";
import { useBurpDetector } from "../../../hooks/useBurpDetector";
import { useRoundController } from "../../../hooks/useRoundController";
import { DURATIONS, VALIDATION } from "../../../lib/constants";
import { logger } from "../../../lib/logger";
import { validateAlias } from "../../../lib/validation";
import { Mode, RoundState } from "../../../types";

function formatTime(ms: number): string {
  const clamped = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(clamped / 60)
    .toString()
    .padStart(2, "0");
  const s = (clamped % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function usePlayState(): {
  mode: Mode;
  setMode: (mode: Mode) => void;
  alias: string;
  setAlias: (alias: string) => void;
  country: string;
  setCountry: (country: string) => void;
  round: ReturnType<typeof useRoundController>;
  detector: ReturnType<typeof useBurpDetector>;
  isLoudest: boolean;
  metric: number;
} {
  const [mode, setMode] = useState<Mode>(Mode.BurpLoudest10s);
  const [alias, setAlias] = useState("");
  const [country, setCountry] = useState("");

  const config = useMemo(
    () => ({
      durationMs: mode === Mode.BurpLoudest10s ? DURATIONS.LOUD_10S : DURATIONS.PEAKS_30S,
      countdownMs: DURATIONS.COUNTDOWN_3S,
      onTick: () => {},
      onFinish: () => {},
    }),
    [mode],
  );

  const round = useRoundController(mode, config);
  const detector = useBurpDetector();

  const isLoudest = mode === Mode.BurpLoudest10s;
  const metric = isLoudest ? Math.max(0, Math.round(detector.peakDb)) : detector.events;

  return {
    mode,
    setMode,
    alias,
    setAlias,
    country,
    setCountry,
    round,
    detector,
    isLoudest,
    metric,
  };
}

function PlayGameContent({
  mode,
  setMode,
  alias,
  setAlias,
  country,
  setCountry,
  round,
  detector,
  isLoudest,
  metric,
}: {
  mode: Mode;
  setMode: (mode: Mode) => void;
  alias: string;
  setAlias: (alias: string) => void;
  country: string;
  setCountry: (country: string) => void;
  round: ReturnType<typeof useRoundController>;
  detector: ReturnType<typeof useBurpDetector>;
  isLoudest: boolean;
  metric: number;
}): ReactElement {
  const config = useMemo(
    () => ({
      durationMs: mode === Mode.BurpLoudest10s ? DURATIONS.LOUD_10S : DURATIONS.PEAKS_30S,
      countdownMs: DURATIONS.COUNTDOWN_3S,
      onTick: () => {},
      onFinish: () => {},
    }),
    [mode],
  );

  const onStart = useCallback(async () => {
    await detector.start();
    round.start();
  }, [detector, round]);

  const onStop = useCallback(() => {
    round.stop();
    detector.stop();
  }, [detector, round]);

  const onReset = useCallback(() => {
    round.reset();
    detector.reset();
  }, [detector, round]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<"success" | "error" | null>(null);

  const canSubmit = round.state === RoundState.FINISHED && validateAlias(alias) && Boolean(country);

  const buildSubmissionData = useCallback(() => {
    return {
      alias: alias.trim(),
      country,
      mode,
      metric: isLoudest ? Math.max(0, Math.round(detector.peakDb)) : detector.events,
      clientStats: {
        durationMs: mode === Mode.BurpLoudest10s ? 10000 : 30000,
        coverage: detector.coverage,
        sampleRate: detector.sampleRate || 44100,
      },
    };
  }, [alias, country, mode, detector, isLoudest]);

  const handleSubmissionResponse = useCallback(
    (result: { ok: boolean; id?: string; error?: string }) => {
      if (result.ok) {
        setSubmitResult("success");
        logger.info("Score submitted successfully", { id: result.id });
      } else {
        setSubmitResult("error");
        logger.warn("Score submission failed", { error: result.error });
      }
    },
    [],
  );

  const onSubmitScore = useCallback(async () => {
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const response = await fetch("/api/submitScore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildSubmissionData()),
      });

      const result = await response.json();
      handleSubmissionResponse(result);
    } catch (error) {
      setSubmitResult("error");
      logger.error("Score submission error", { error: String(error) });
    } finally {
      setIsSubmitting(false);
    }
  }, [canSubmit, isSubmitting, buildSubmissionData, handleSubmissionResponse]);

  return (
    <div className="space-y-4">
      <ModeSelector mode={mode} setMode={setMode} config={config} round={round} />
      <GameDisplay round={round} metric={metric} isLoudest={isLoudest} />
      <GameControls round={round} onStart={onStart} onStop={onStop} onReset={onReset} />
      <SubmissionPanel
        round={round}
        alias={alias}
        setAlias={setAlias}
        country={country}
        setCountry={setCountry}
        isSubmitting={isSubmitting}
        submitResult={submitResult}
        onSubmitScore={onSubmitScore}
      />
    </div>
  );
}

export default function PlayPage(): ReactElement {
  const {
    mode,
    setMode,
    alias,
    setAlias,
    country,
    setCountry,
    round,
    detector,
    isLoudest,
    metric,
  } = usePlayState();

  return (
    <Screen>
      <Screen.Header>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Burp Round</h1>
          <p className="text-xs text-gray-600">Audio processed locally; only scores are stored.</p>
        </div>
      </Screen.Header>
      <Screen.Body>
        <PlayGameContent
          mode={mode}
          setMode={setMode}
          alias={alias}
          setAlias={setAlias}
          country={country}
          setCountry={setCountry}
          round={round}
          detector={detector}
          isLoudest={isLoudest}
          metric={metric}
        />
      </Screen.Body>
      <Screen.Footer>
        <nav className="flex items-center justify-between text-sm">
          <a className="underline" href="/play">
            Play
          </a>
          <a className="underline" href="/leaderboard">
            Leaderboard
          </a>
          <a className="underline" href="/privacy">
            Privacy
          </a>
        </nav>
      </Screen.Footer>
    </Screen>
  );
}

function ModeSelector({
  mode,
  setMode,
  config,
  round,
}: {
  mode: Mode;
  setMode: (mode: Mode) => void;
  config: { durationMs: number; countdownMs: number; onTick: () => void; onFinish: () => void };
  round: ReturnType<typeof useRoundController>;
}): ReactElement {
  return (
    <fieldset className="grid grid-cols-2 gap-2" aria-label="Mode">
      <button
        className={`rounded border px-3 py-2 text-sm ${
          mode === Mode.BurpLoudest10s ? "bg-gray-900 text-white" : ""
        }`}
        aria-pressed={mode === Mode.BurpLoudest10s}
        onClick={() => {
          setMode(Mode.BurpLoudest10s);
          round.setMode(Mode.BurpLoudest10s, config);
        }}
      >
        Loudest (10s)
      </button>
      <button
        className={`rounded border px-3 py-2 text-sm ${
          mode === Mode.BurpMostPeaks30s ? "bg-gray-900 text-white" : ""
        }`}
        aria-pressed={mode === Mode.BurpMostPeaks30s}
        onClick={() => {
          setMode(Mode.BurpMostPeaks30s);
          round.setMode(Mode.BurpMostPeaks30s, config);
        }}
      >
        Most Peaks (30s)
      </button>
    </fieldset>
  );
}

function GameDisplay({
  round,
  metric,
  isLoudest,
}: {
  round: ReturnType<typeof useRoundController>;
  metric: number;
  isLoudest: boolean;
}): ReactElement {
  return (
    <div
      className="rounded border p-4"
      style={{ touchAction: round.state === RoundState.RUN ? "none" : "auto" }}
    >
      <div className="mb-2 text-center text-5xl font-bold" aria-live="polite">
        {formatTime(round.timeLeftMs)}
      </div>
      <div className="text-center text-sm text-gray-600">
        {isLoudest ? `${metric} dBFS peak` : `${metric} events`}
      </div>
    </div>
  );
}

function GameControls({
  round,
  onStart,
  onStop,
  onReset,
}: {
  round: ReturnType<typeof useRoundController>;
  onStart: () => Promise<void>;
  onStop: () => void;
  onReset: () => void;
}): ReactElement {
  return (
    <div className="flex items-center justify-center gap-3">
      {round.isRunning ? (
        <button
          className="h-14 rounded bg-red-600 px-6 text-white"
          onClick={onStop}
          aria-label="Stop round"
        >
          Stop
        </button>
      ) : (
        <button
          className="h-14 rounded bg-green-600 px-6 text-white"
          onClick={onStart}
          aria-label="Start round"
        >
          Start
        </button>
      )}
      <button className="h-14 rounded border px-4" onClick={onReset} aria-label="Reset round">
        Reset
      </button>
    </div>
  );
}

function SubmissionPanel({
  round,
  alias,
  setAlias,
  country,
  setCountry,
  isSubmitting,
  submitResult,
  onSubmitScore,
}: {
  round: ReturnType<typeof useRoundController>;
  alias: string;
  setAlias: (alias: string) => void;
  country: string;
  setCountry: (country: string) => void;
  isSubmitting: boolean;
  submitResult: "success" | "error" | null;
  onSubmitScore: () => void;
}): ReactElement {
  const canSubmit = round.state === RoundState.FINISHED && validateAlias(alias) && Boolean(country);

  if (round.state !== RoundState.FINISHED) return <></>;

  return (
    <section className="space-y-3" aria-label="Submit score">
      <div className="grid grid-cols-1 gap-3">
        <label className="text-sm">
          Alias
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            minLength={VALIDATION.MIN_ALIAS_LEN}
            maxLength={VALIDATION.MAX_ALIAS_LEN}
            aria-label="Alias"
          />
        </label>
        <label className="text-sm">
          Country
          <select
            className="mt-1 w-full rounded border px-3 py-2"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            aria-label="Country"
          >
            <option value="">Select…</option>
            <option value="US">United States</option>
            <option value="GB">United Kingdom</option>
            <option value="CA">Canada</option>
            <option value="AU">Australia</option>
          </select>
        </label>
      </div>
      <button
        disabled={!canSubmit || isSubmitting}
        onClick={onSubmitScore}
        className="w-full rounded bg-gray-900 px-4 py-3 text-white disabled:opacity-50"
      >
        {isSubmitting ? "Submitting..." : "Submit score"}
      </button>

      {submitResult === "success" && (
        <div className="rounded bg-green-100 p-3 text-green-800">
          <p className="text-sm font-medium">Score submitted successfully!</p>
          <a href="/leaderboard" className="text-sm underline">
            View leaderboard →
          </a>
        </div>
      )}

      {submitResult === "error" && (
        <div className="rounded bg-red-100 p-3 text-red-800">
          <p className="text-sm font-medium">Submission failed. Please try again.</p>
        </div>
      )}
    </section>
  );
}
