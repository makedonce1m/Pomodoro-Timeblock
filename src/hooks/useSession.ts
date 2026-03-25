import { useCallback, useEffect, useRef, useState } from 'react';
import type { DayTemplate, FocusBlock, LongBreakBlock, PomodoroMode, PomodoroType, TimeBlock } from '../types';
import {
  CLOSING_INTERVAL_DURATION,
  CLASSIC_POMODORO_FOCUS_DURATION,
  CLASSIC_POMODORO_BREAK_DURATION,
} from '../constants/timer';
import { usePomodoroTimer } from './usePomodoroTimer';
import { playSkipSound } from '../utils/sound';

export type SessionPhase =
  | 'idle'          // session not yet started
  | 'focus'         // in a Pomodoro focus interval
  | 'short-break'   // in a Pomodoro short break
  | 'long-break'    // in a long-break block
  | 'block-done'    // focus block complete, waiting/transitioning to next
  | 'done';         // all blocks complete

/** Compute block duration in seconds from durationMins. */
function blockSeconds(block: { durationMins: number }): number {
  return block.durationMins * 60;
}

export interface UseSessionReturn {
  // ── Timer state (forwarded) ──────────────────────────────────────
  pomodoroType: PomodoroType;
  mode: PomodoroMode;
  timerPhase: 'focus' | 'break';
  elapsedSeconds: number;
  phaseDurationSeconds: number;
  isRunning: boolean;
  canSwitch: boolean;
  // ── Timer actions ────────────────────────────────────────────────
  pause: () => void;
  resume: () => void;
  skip: () => void;
  switchMode: () => void;
  selectMode: (m: PomodoroMode) => void;
  // ── Session state ────────────────────────────────────────────────
  sessionPhase: SessionPhase;
  blockIndex: number;
  pomodoroIndex: number;
  totalBlocks: number;
  totalPomodoros: number;        // pomodoroCount of the current focus block (0 if long-break)
  isClosingInterval: boolean;
  currentBlock: TimeBlock | null;
  nextBlock: TimeBlock | null;
  isDone: boolean;
  waitingForContinue: boolean;
  // ── Session actions ──────────────────────────────────────────────
  startSession: () => void;
  continueToNext: () => void;
  /** Manually switch the timer to a given phase (mirrors the phase cards). */
  goToPhase: (phase: 'focus' | 'break') => void;
  /** Reset the current Pomodoro timer back to zero without changing block/Pomodoro position. */
  resetPomodoro: () => void;
  /** Jump to a specific Pomodoro index within the current block (resets timer, waits for play). */
  jumpToPomodoro: (index: number) => void;
}

export function useSession(
  template: DayTemplate | null,
  autoContinue: boolean,
  pomodoroType: PomodoroType = 'adaptive',
  defaultMode: PomodoroMode = 'standard',
): UseSessionReturn {
  const [blockIndex, setBlockIndex] = useState(0);
  const [pomodoroIndex, setPomodoroIndex] = useState(0);
  const [sessionPhase, setSessionPhase] = useState<SessionPhase>('idle');
  const [isDone, setIsDone] = useState(false);
  const [waitingForContinue, setWaitingForContinue] = useState(false);

  // Mutable refs so callbacks always read latest values without stale closures.
  const autoContinueRef = useRef(autoContinue);
  autoContinueRef.current = autoContinue;
  const templateRef = useRef(template);
  templateRef.current = template;
  const blockIndexRef = useRef(blockIndex);
  blockIndexRef.current = blockIndex;
  const pomodoroIndexRef = useRef(pomodoroIndex);
  pomodoroIndexRef.current = pomodoroIndex;

  // Derived values for the current position.
  const blocks = template?.blocks ?? [];
  const currentBlock = blocks[blockIndex] ?? null;
  const isLongBreakBlock = currentBlock?.type === 'long-break';
  const currentFocusBlock = isLongBreakBlock ? null : (currentBlock as FocusBlock | null);
  const isClosingInterval = !!currentFocusBlock && pomodoroIndex === currentFocusBlock.pomodoroCount - 1;
  const nextBlock = blocks[blockIndex + 1] ?? null;

  // Refs for derived values used inside timer callbacks.
  const isClosingIntervalRef = useRef(isClosingInterval);
  isClosingIntervalRef.current = isClosingInterval;
  const isLongBreakBlockRef = useRef(isLongBreakBlock);
  isLongBreakBlockRef.current = isLongBreakBlock;

  // customPhaseDuration: overrides the timer's default phase duration when needed.
  const customPhaseDuration = isLongBreakBlock
    ? blockSeconds(currentBlock as LongBreakBlock)
    : isClosingInterval
    ? CLOSING_INTERVAL_DURATION
    : undefined;

  // For classic pomodoro type, supply fixed focus/break durations (20/5).
  const customFocusDuration = pomodoroType === 'classic' ? CLASSIC_POMODORO_FOCUS_DURATION : undefined;
  const customBreakDuration = pomodoroType === 'classic' ? CLASSIC_POMODORO_BREAK_DURATION : undefined;

  // Advance to the next block. Called by onPhaseComplete and continueToNext.
  const advanceBlock = useCallback((fromBlockIndex: number) => {
    const tmpl = templateRef.current;
    if (!tmpl) return;
    const nextBi = fromBlockIndex + 1;
    if (nextBi >= tmpl.blocks.length) {
      setIsDone(true);
      setSessionPhase('done');
      setWaitingForContinue(false);
    } else {
      setBlockIndex(nextBi);
      setPomodoroIndex(0);
      const nb = tmpl.blocks[nextBi];
      setSessionPhase(nb.type === 'long-break' ? 'long-break' : 'focus');
      setWaitingForContinue(false);
    }
  }, []);

  // Called by the timer when a phase ends (before auto-advance / stop).
  const handlePhaseComplete = useCallback((completedPhase: 'focus' | 'break') => {
    const bi = blockIndexRef.current;
    const pi = pomodoroIndexRef.current;
    const isCI = isClosingIntervalRef.current;
    const isLB = isLongBreakBlockRef.current;
    const ac = autoContinueRef.current;

    if (completedPhase === 'focus') {
      if (isCI || isLB) {
        // End of this block.
        if (ac) {
          advanceBlock(bi); // state update; timer will restart via continueToNext effect
        } else {
          setSessionPhase('block-done');
          setWaitingForContinue(true);
        }
      } else {
        // End of a normal focus interval → short break up next.
        if (!ac) {
          setSessionPhase('short-break');
          setWaitingForContinue(true);
        } else {
          setSessionPhase('short-break'); // timer auto-advances, just update label
        }
      }
    } else {
      // completedPhase === 'break' → end of short break, next Pomodoro.
      const newPi = pi + 1;
      setPomodoroIndex(newPi);
      if (!ac) {
        setSessionPhase('focus');
        setWaitingForContinue(true);
      } else {
        setSessionPhase('focus'); // timer auto-advances
      }
    }
  }, [advanceBlock]);

  // autoAdvance function: the timer calls this to decide whether to auto-advance.
  // Returns false to stop the timer and let the session handle the transition manually.
  const autoAdvanceFnRef = useRef<() => boolean>(() => true);
  autoAdvanceFnRef.current = () => {
    // Never auto-advance when autoContinue is OFF — every transition is manual.
    if (!autoContinueRef.current) return false;
    // Closing interval: no break after the last Pomodoro of a block.
    if (isClosingIntervalRef.current) return false;
    // Long-break block: the single "focus" phase covers the whole break — don't add a break.
    if (isLongBreakBlockRef.current) return false;
    return true;
  };

  // Stable wrapper so the timer always calls the latest version.
  const [stableAutoAdvanceFn] = useState(() => () => autoAdvanceFnRef.current());

  const timer = usePomodoroTimer(pomodoroType === 'classic' ? 'standard' : defaultMode, {
    customPhaseDuration,
    customFocusDuration,
    customBreakDuration,
    onPhaseComplete: handlePhaseComplete,
    autoAdvance: stableAutoAdvanceFn,
  });

  // When autoContinue=true and a block ends (advanceBlock was called in handlePhaseComplete),
  // the timer is stopped (autoAdvance returned false). We need to restart it for the new block.
  // Watch for sessionPhase changes that require the timer to auto-start.
  const prevSessionPhaseRef = useRef<SessionPhase>('idle');
  useEffect(() => {
    const prev = prevSessionPhaseRef.current;
    prevSessionPhaseRef.current = sessionPhase;

    // When autoContinue=true, restart the timer on any block transition.
    // 'block-done' → next: manual continue path (autoContinue=false hits this too, but filtered by autoContinueRef)
    // 'long-break' → next: long-break ended naturally
    // 'focus' → 'long-break': closing interval ended with autoContinue=true
    const isBlockTransition = prev !== sessionPhase && (
      prev === 'block-done' || prev === 'long-break' ||
      (prev === 'focus' && sessionPhase === 'long-break')
    );

    if (skipNoRestartRef.current) {
      skipNoRestartRef.current = false;
      return;
    }

    if (
      autoContinueRef.current &&
      !waitingForContinue &&
      (sessionPhase === 'focus' || sessionPhase === 'long-break') &&
      isBlockTransition
    ) {
      // Block transition: restart timer for the new block.
      timer.reset();
      timer.resume();
    }
  }, [sessionPhase, waitingForContinue, timer]);

  // Reset the session when the template changes.
  useEffect(() => {
    setBlockIndex(0);
    setPomodoroIndex(0);
    setSessionPhase('idle');
    setIsDone(false);
    setWaitingForContinue(false);
    timer.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template?.id]);

  const startSession = useCallback(() => {
    if (!templateRef.current) return;
    setBlockIndex(0);
    setPomodoroIndex(0);
    setIsDone(false);
    setWaitingForContinue(false);
    const firstBlock = templateRef.current.blocks[0];
    setSessionPhase(firstBlock?.type === 'long-break' ? 'long-break' : 'focus');
    timer.start();
  }, [timer]);

  const continueToNext = useCallback(() => {
    const sp = sessionPhase;
    setWaitingForContinue(false);

    if (sp === 'short-break') {
      // Start the short break.
      timer.goToPhase('break');
      timer.resume();
    } else if (sp === 'focus') {
      // Start the next focus (timer is already in focus phase after stopping).
      timer.goToPhase('focus');
      timer.resume();
    } else if (sp === 'block-done') {
      // Advance to next block then start.
      advanceBlock(blockIndexRef.current);
      // advanceBlock sets state; the useEffect above will restart the timer.
    }
  }, [sessionPhase, timer, advanceBlock]);

  const goToPhase = useCallback((phase: 'focus' | 'break') => {
    timer.goToPhase(phase);
    setSessionPhase(phase === 'focus' ? 'focus' : 'short-break');
    setWaitingForContinue(false);
  }, [timer]);

  const resetPomodoro = useCallback(() => {
    timer.reset(timer.phase);
    setSessionPhase(prev => {
      if (prev === 'idle') return 'idle';
      if (prev === 'long-break') return 'long-break';
      return timer.phase === 'break' ? 'short-break' : 'focus';
    });
    setWaitingForContinue(false);
  }, [timer]);

  const jumpToPomodoro = useCallback((index: number) => {
    timer.reset();
    setPomodoroIndex(index);
    setSessionPhase('focus');
    setWaitingForContinue(false);
  }, [timer]);

  // Skip: on closing interval or long-break → advance to next block.
  //        on any other pomo → advance to next pomo within the block.
  // skipNoRestartRef prevents the restart effect from auto-starting the timer after a skip.
  const skipNoRestartRef = useRef(false);
  const skipBlock = useCallback(() => {
    const tmpl = templateRef.current;
    if (!tmpl) return;
    playSkipSound();
    timer.reset();

    if (isClosingIntervalRef.current || isLongBreakBlockRef.current) {
      // Advance to next block — leave timer stopped.
      skipNoRestartRef.current = true;
      const nextBi = blockIndexRef.current + 1;
      if (nextBi >= tmpl.blocks.length) {
        setIsDone(true);
        setSessionPhase('done');
        setWaitingForContinue(false);
      } else {
        setBlockIndex(nextBi);
        setPomodoroIndex(0);
        const nb = tmpl.blocks[nextBi];
        setSessionPhase(nb.type === 'long-break' ? 'long-break' : 'focus');
        setWaitingForContinue(false);
      }
    } else {
      // Advance to next pomo within the current block.
      setPomodoroIndex(pomodoroIndexRef.current + 1);
      setSessionPhase('focus');
      setWaitingForContinue(false);
    }
  }, [timer]);

  return {
    pomodoroType,
    mode: timer.mode,
    timerPhase: timer.phase,
    elapsedSeconds: timer.elapsedSeconds,
    phaseDurationSeconds: timer.phaseDurationSeconds,
    isRunning: timer.isRunning,
    canSwitch: timer.canSwitch,
    pause: timer.pause,
    resume: timer.resume,
    skip: skipBlock,
    switchMode: timer.switchMode,
    selectMode: timer.selectMode,
    sessionPhase,
    blockIndex,
    pomodoroIndex,
    totalBlocks: blocks.length,
    totalPomodoros: currentFocusBlock?.pomodoroCount ?? 0,
    isClosingInterval,
    currentBlock,
    nextBlock,
    isDone,
    waitingForContinue,
    startSession,
    continueToNext,
    goToPhase,
    resetPomodoro,
    jumpToPomodoro,
  };
}
