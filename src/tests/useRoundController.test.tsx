/**
 * Tests: round controller deterministic transitions (JSX test component).
 */

import { act, render } from "@testing-library/react";
import type { ReactElement } from "react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useRoundController } from "../hooks/useRoundController";
import { Mode, RoundState } from "../types";

describe("useRoundController", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
  });

  it("counts down then runs for duration", () => {
    const apiRef: { current: ReturnType<typeof useRoundController> | null } = { current: null };
    function Test(): ReactElement | null {
      const ctrl = useRoundController(Mode.BurpLoudest10s, {
        durationMs: 1000,
        countdownMs: 300,
        onTick: vi.fn(),
        onFinish: vi.fn(),
      });
      apiRef.current = ctrl as unknown as ReturnType<typeof useRoundController>;
      return null;
    }
    render(<Test />);

    act(() => apiRef.current!.start());
    expect(apiRef.current!.state).toBe(RoundState.COUNTDOWN);

    act(() => {
      vi.setSystemTime(300);
      vi.advanceTimersByTime(300);
    });
    expect(
      apiRef.current!.state === RoundState.RUN || apiRef.current!.state === RoundState.FINISHED,
    ).toBeTruthy();

    act(() => {
      vi.setSystemTime(1300);
      vi.advanceTimersByTime(1000);
    });
    expect(apiRef.current!.state).toBe(RoundState.FINISHED);
    expect(apiRef.current!.timeLeftMs).toBe(0);
  });

  it("stop moves to finished early", () => {
    const apiRef: { current: ReturnType<typeof useRoundController> | null } = { current: null };
    function Test(): ReactElement | null {
      const ctrl = useRoundController(Mode.BurpLoudest10s, {
        durationMs: 1000,
        countdownMs: 300,
      });
      apiRef.current = ctrl as unknown as ReturnType<typeof useRoundController>;
      return null;
    }
    render(<Test />);
    act(() => apiRef.current!.start());
    act(() => {
      vi.setSystemTime(100);
      vi.advanceTimersByTime(100);
    });
    act(() => apiRef.current!.stop());
    expect(apiRef.current!.state).toBe(RoundState.FINISHED);
    expect(apiRef.current!.timeLeftMs).toBe(0);
  });
});
