export type PomodoroMode = 'standard' | 'comfort';
export type PomodoroType = 'classic' | 'adaptive';

/** A focus block: contains Pomodoros (focus intervals + short breaks, ending with a closing interval). */
export interface FocusBlock {
  type: 'focus';
  id: string;
  label: string;
  /** Duration of this block in minutes (always a multiple of 30). */
  durationMins: number;
  /** Total number of Pomodoros that fit in this block (durationMins / 30). */
  pomodoroCount: number;
}

/** A long break block: pure rest, no focus time. */
export interface LongBreakBlock {
  type: 'long-break';
  id: string;
  label: string;
  /** Duration of this block in minutes. */
  durationMins: number;
}

export type TimeBlock = FocusBlock | LongBreakBlock;

/** A full day template: an ordered list of time blocks with a plan-level start time. */
export interface DayTemplate {
  id: string;
  label: string;
  /** When the day starts, in HH:mm (24-hour, local time). Block times are derived from this. */
  startTime: string;
  blocks: TimeBlock[];
  /** Locked Pomodoro type for this plan. Defaults to 'adaptive' for older saved templates. */
  pomodoroType?: PomodoroType;
}
