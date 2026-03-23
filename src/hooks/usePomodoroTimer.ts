import { useCallback, useEffect, useRef, useState } from 'react';
import {
  POMODORO_FOCUS_DURATION,
  POMODORO_BREAK_DURATION,
} from '../constants/timer';
import { canSwitchMode } from '../utils/pomodoroMode';
import { playFocusEndSound, playBreakEndSound, playSkipSound } from '../utils/sound';
import type { PomodoroMode } from '../types';

type Phase = 'focus' | 'break';

export interface PomodoroTimerOptions {
  /** Override the duration (seconds) for the current phase. Use for closing/long-break intervals. */
  customPhaseDuration?: number;
  /**
   * Called when a phase ends, before the timer auto-advances (or stops).
   * Useful for session-layer state updates.
   */
  onPhaseComplete?: (phase: Phase) => void;
  /**
   * Whether to auto-advance to the next phase when one ends.
   * Pass `false` or a function returning `false` to stop and wait for external control.
   * Defaults to `true`.
   */
  autoAdvance?: boolean | (() => boolean);
}

interface PomodoroTimerState {
  mode: PomodoroMode;
  phase: Phase;
  elapsedSeconds: number;
  phaseDurationSeconds: number;
  isRunning: boolean;
  /** True once start() has been called; only resets to false on reset(). Survives phase transitions. */
  hasStarted: boolean;
  canSwitch: boolean;
}

interface PomodoroTimerActions {
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: (toPhase?: Phase) => void;
  skip: () => void;
  goToPhase: (phase: Phase) => void;
  switchMode: () => void;
  selectMode: (mode: PomodoroMode) => void;
}

export function usePomodoroTimer(
  initialMode: PomodoroMode = 'standard',
  options?: PomodoroTimerOptions,
): PomodoroTimerState & PomodoroTimerActions {
  const [mode, setMode] = useState<PomodoroMode>(initialMode);
  const [phase, setPhase] = useState<Phase>('focus');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const runStartWallTime = useRef<number | null>(null);
  const elapsedAtRunStart = useRef(0);
  const rafHandle = useRef<number | null>(null);

  // Keep mutable references to options so effects never capture stale values.
  const onPhaseCompleteRef = useRef(options?.onPhaseComplete);
  onPhaseCompleteRef.current = options?.onPhaseComplete;
  const autoAdvanceRef = useRef(options?.autoAdvance);
  autoAdvanceRef.current = options?.autoAdvance;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const phaseDurationSeconds =
    options?.customPhaseDuration ??
    (phase === 'focus'
      ? POMODORO_FOCUS_DURATION[mode]
      : POMODORO_BREAK_DURATION[mode]);

  const tick = useCallback(() => {
    if (runStartWallTime.current === null) return;
    const wallElapsed = (Date.now() - runStartWallTime.current) / 1000;
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
    runStartWallTime.current = Date.now();
    setElapsedSeconds(0);
    setIsRunning(true);
    setHasStarted(true);
    rafHandle.current = requestAnimationFrame(tick);
  }, [tick]);

  const pause = useCallback(() => {
    stopRaf();
    elapsedAtRunStart.current =
      elapsedAtRunStart.current +
      (runStartWallTime.current !== null
        ? (Date.now() - runStartWallTime.current) / 1000
        : 0);
    runStartWallTime.current = null;
    setIsRunning(false);
  }, [stopRaf]);

  const resume = useCallback(() => {
    runStartWallTime.current = Date.now();
    setIsRunning(true);
    rafHandle.current = requestAnimationFrame(tick);
  }, [tick]);

  const reset = useCallback((toPhase: Phase = 'focus') => {
    stopRaf();
    runStartWallTime.current = null;
    elapsedAtRunStart.current = 0;
    setElapsedSeconds(0);
    setPhase(toPhase);
    setIsRunning(false);
    setHasStarted(false);
  }, [stopRaf]);

  const skip = useCallback(() => {
    const nextPhase = phaseRef.current === 'focus' ? 'break' : 'focus';
    playSkipSound();
    stopRaf();
    runStartWallTime.current = null;
    elapsedAtRunStart.current = 0;
    setElapsedSeconds(0);
    setPhase(nextPhase);
    setIsRunning(false);
  }, [stopRaf]);

  const goToPhase = useCallback((target: Phase) => {
    stopRaf();
    elapsedAtRunStart.current = 0;
    setElapsedSeconds(0);
    setPhase(target);
    setIsRunning((running) => {
      if (running) {
        runStartWallTime.current = Date.now();
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
      if (!canSwitchMode(phaseRef.current, current)) return current;
      const next: PomodoroMode = mode === 'standard' ? 'comfort' : 'standard';
      setMode(next);
      elapsedAtRunStart.current = current;
      if (runStartWallTime.current !== null) {
        runStartWallTime.current = Date.now();
      }
      return current;
    });
  }, [mode]);

  // Advance or stop when the current phase duration is reached.
  useEffect(() => {
    if (elapsedSeconds >= phaseDurationSeconds && isRunning) {
      stopRaf();

      // Notify the session layer before transitioning.
      onPhaseCompleteRef.current?.(phaseRef.current);

      // Resolve autoAdvance: boolean | function | undefined → boolean.
      const raw = autoAdvanceRef.current;
      const shouldAdvance = typeof raw === 'function' ? raw() : (raw ?? true);

      if (shouldAdvance) {
        runStartWallTime.current = Date.now();
        elapsedAtRunStart.current = 0;
        setElapsedSeconds(0);
        setPhase((p) => {
          if (p === 'focus') { playFocusEndSound(); return 'break'; }
          else { playBreakEndSound(); return 'focus'; }
        });
        rafHandle.current = requestAnimationFrame(tick);
      } else {
        runStartWallTime.current = null;
        elapsedAtRunStart.current = 0;
        setElapsedSeconds(0);
        if (phaseRef.current === 'focus') playFocusEndSound();
        else playBreakEndSound();
        setIsRunning(false);
      }
    }
  }, [elapsedSeconds, phaseDurationSeconds, isRunning, stopRaf, tick]);

  useEffect(() => () => stopRaf(), [stopRaf]);

  // On iOS, RAF is suspended when the app is backgrounded.
  // When the app returns to foreground, restart RAF if the timer is running.
  // Date.now() keeps counting while backgrounded, so elapsed time stays accurate.
  useEffect(() => {
    function onVisibilityChange() {
      if (!document.hidden && runStartWallTime.current !== null) {
        if (rafHandle.current !== null) cancelAnimationFrame(rafHandle.current);
        rafHandle.current = requestAnimationFrame(tick);
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [tick]);

  return {
    mode,
    phase,
    elapsedSeconds,
    phaseDurationSeconds,
    isRunning,
    hasStarted,
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
