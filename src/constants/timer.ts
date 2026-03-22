import type { PomodoroMode } from '../types';

const MINUTE = 60; // seconds

export const POMODORO_FOCUS_DURATION: Record<PomodoroMode, number> = {
  standard: 25 * MINUTE, // 1500 s
  comfort:  20 * MINUTE, // 1200 s
};

export const POMODORO_BREAK_DURATION: Record<PomodoroMode, number> = {
  standard:  5 * MINUTE, //  300 s
  comfort:  10 * MINUTE, //  600 s
};

/** 30-minute closing interval: pure focus, no trailing break. */
export const CLOSING_INTERVAL_DURATION = 30 * MINUTE;

/**
 * Latest point (in elapsed focus seconds) at which the user may switch modes.
 * Locks 10 seconds before Comfort mode's 20-minute focus mark so there is
 * always meaningful focus time remaining in either mode.
 */
export const MODE_SWITCH_CUTOFF_SECONDS = 20 * MINUTE - 10; // 1190 s
