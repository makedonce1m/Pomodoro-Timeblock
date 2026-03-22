import { useCallback, useEffect, useRef, useState } from 'react';
import {
  POMODORO_FOCUS_DURATION,
  POMODORO_BREAK_DURATION,
} from '../constants/timer';
import { canSwitchMode } from '../utils/pomodoroMode';
import type { PomodoroMode } from '../types';

type Phase = 'focus' | 'break';

interface PomodoroTimerState {
  mode: PomodoroMode;
  phase: Phase;
  /** Seconds elapsed within the current phase. */
  elapsedSeconds: number;
  /** Total seconds for the current phase (derived from mode + phase). */
  phaseDurationSeconds: number;
  isRunning: boolean;
  /** Whether the mode switch button should be enabled. */
  canSwitch: boolean;
}

interface PomodoroTimerActions {
  start: () => void;
  pause: () => void;
  resume: () => void;
  /** Stop the timer and reset to the beginning without starting. */
  reset: () => void;
  /** Skip the current focus phase and jump straight to break. No-op if not in focus phase. */
  skip: () => void;
  /** Switch to the given phase, reset elapsed time, and maintain current running state. */
  goToPhase: (phase: 'focus' | 'break') => void;
  /** Switch between standard and comfort. No-op if canSwitch is false. */
  switchMode: () => void;
  /** Select a mode freely. Only works when the timer has not started yet. */
  selectMode: (mode: PomodoroMode) => void;
}

export function usePomodoroTimer(
  initialMode: PomodoroMode = 'standard',
): PomodoroTimerState & PomodoroTimerActions {
  const [mode, setMode] = useState<PomodoroMode>(initialMode);
  const [phase, setPhase] = useState<Phase>('focus');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Drift-resistant timing: track the wall-clock origin of the current run.
  const runStartWallTime = useRef<number | null>(null);
  const elapsedAtRunStart = useRef(0);
  const rafHandle = useRef<number | null>(null);

  const phaseDurationSeconds =
    phase === 'focus'
      ? POMODORO_FOCUS_DURATION[mode]
      : POMODORO_BREAK_DURATION[mode];

  const tick = useCallback(() => {
    if (runStartWallTime.current === null) return;

    const wallElapsed = (performance.now() - runStartWallTime.current) / 1000;
    const total = elapsedAtRunStart.current + wallElapsed;

    setElapsedSeconds(total);
    rafHandle.current = requestAnimationFrame(tick);
  }, []);

  const stopRaf = useCallback(() => {
    if (rafHandle.current !== null) {
      cancelAnimationFrame(rafHandle.current);
      rafHandle.current = null;
    }
  }, []);

  const start = useCallback(() => {
    elapsedAtRunStart.current = 0;
    runStartWallTime.current = performance.now();
    setElapsedSeconds(0);
    setPhase('focus');
    setIsRunning(true);
    rafHandle.current = requestAnimationFrame(tick);
  }, [tick]);

  const pause = useCallback(() => {
    stopRaf();
    // Snapshot elapsed so resume can continue from here.
    elapsedAtRunStart.current =
      elapsedAtRunStart.current +
      (runStartWallTime.current !== null
        ? (performance.now() - runStartWallTime.current) / 1000
        : 0);
    runStartWallTime.current = null;
    setIsRunning(false);
  }, [stopRaf]);

  const resume = useCallback(() => {
    runStartWallTime.current = performance.now();
    setIsRunning(true);
    rafHandle.current = requestAnimationFrame(tick);
  }, [tick]);

  const reset = useCallback(() => {
    stopRaf();
    runStartWallTime.current = null;
    elapsedAtRunStart.current = 0;
    setElapsedSeconds(0);
    setPhase('focus');
    setIsRunning(false);
  }, [stopRaf]);

  const skip = useCallback(() => {
    const nextPhase = phase === 'focus' ? 'break' : 'focus';
    stopRaf();
    runStartWallTime.current = performance.now();
    elapsedAtRunStart.current = 0;
    setElapsedSeconds(0);
    setPhase(nextPhase);
    setIsRunning(true);
    rafHandle.current = requestAnimationFrame(tick);
  }, [phase, stopRaf, tick]);

  const goToPhase = useCallback((target: 'focus' | 'break') => {
    stopRaf();
    elapsedAtRunStart.current = 0;
    setElapsedSeconds(0);
    setPhase(target);
    setIsRunning((running) => {
      if (running) {
        runStartWallTime.current = performance.now();
        rafHandle.current = requestAnimationFrame(tick);
      } else {
        runStartWallTime.current = null;
      }
      return running;
    });
  }, [stopRaf, tick]);

  const selectMode = useCallback((target: PomodoroMode) => {
    if (isRunning || elapsedSeconds > 0) return;
    setMode(target);
  }, [isRunning, elapsedSeconds]);

  const switchMode = useCallback(() => {
    setElapsedSeconds((current) => {
      if (!canSwitchMode(phase, current)) return current;

      const next: PomodoroMode = mode === 'standard' ? 'comfort' : 'standard';
      setMode(next);

      // Keep the elapsed snapshot in sync so the RAF loop continues correctly.
      elapsedAtRunStart.current = current;
      if (runStartWallTime.current !== null) {
        runStartWallTime.current = performance.now();
      }

      return current; // elapsed time is unchanged
    });
  }, [mode, phase]);

  // Advance phase when the current phase duration is reached.
  useEffect(() => {
    if (elapsedSeconds >= phaseDurationSeconds && isRunning) {
      stopRaf();
      runStartWallTime.current = performance.now();
      elapsedAtRunStart.current = 0;
      setElapsedSeconds(0);
      setPhase((p) => (p === 'focus' ? 'break' : 'focus'));
      rafHandle.current = requestAnimationFrame(tick);
    }
  }, [elapsedSeconds, phaseDurationSeconds, isRunning, stopRaf, tick]);

  // Cleanup on unmount.
  useEffect(() => () => stopRaf(), [stopRaf]);

  return {
    mode,
    phase,
    elapsedSeconds,
    phaseDurationSeconds,
    isRunning,
    canSwitch: canSwitchMode(phase, elapsedSeconds),
    start,
    pause,
    resume,
    reset,
    skip,
    goToPhase,
    switchMode,
    selectMode,
  };
}
