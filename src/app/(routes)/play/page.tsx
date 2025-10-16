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

export default function PlayPage(): ReactElement {
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

  const canSubmit = round.state === RoundState.FINISHED && validateAlias(alias) && Boolean(country);

  return (
    <Screen>
      <Screen.Header>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Burp Round</h1>
          <p className="text-xs text-gray-600">Audio processed locally; only scores are stored.</p>
        </div>
      </Screen.Header>
      <Screen.Body>
        <div className="space-y-4">
          <fieldset className="grid grid-cols-2 gap-2" aria-label="Mode">
            <button
              className={`rounded border px-3 py-2 text-sm ${
                isLoudest ? "bg-gray-900 text-white" : ""
              }`}
              aria-pressed={isLoudest}
              onClick={() => {
                setMode(Mode.BurpLoudest10s);
                round.setMode(Mode.BurpLoudest10s, config);
              }}
            >
              Loudest (10s)
            </button>
            <button
              className={`rounded border px-3 py-2 text-sm ${
                !isLoudest ? "bg-gray-900 text-white" : ""
              }`}
              aria-pressed={!isLoudest}
              onClick={() => {
                setMode(Mode.BurpMostPeaks30s);
                round.setMode(Mode.BurpMostPeaks30s, config);
              }}
            >
              Most Peaks (30s)
            </button>
          </fieldset>

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

          {round.state === RoundState.FINISHED && (
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
                disabled={!canSubmit}
                className="w-full rounded bg-gray-900 px-4 py-3 text-white"
              >
                Submit score
              </button>
            </section>
          )}
        </div>
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
