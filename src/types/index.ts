export type PomodoroMode = 'standard' | 'comfort';
export type PomodoroType = 'classic' | 'adaptive';

/** A focus block: contains Pomodoros (focus intervals + short breaks, ending with a closing interval). */
export interface FocusBlock {
  type: 'focus';
  id: string;
  label: string;
  /** Start time in HH:mm (24-hour, local time) */
  startTime: string;
  /** End time in HH:mm (24-hour, local time) */
  endTime: string;
  /** Total number of Pomodoros that fit in this block (including the closing interval) */
  pomodoroCount: number;
}

/** A long break block: pure rest, no focus time. */
export interface LongBreakBlock {
  type: 'long-break';
  id: string;
  label: string;
  /** Start time in HH:mm (24-hour, local time) */
  startTime: string;
  /** End time in HH:mm (24-hour, local time) */
  endTime: string;
}

export type TimeBlock = FocusBlock | LongBreakBlock;

/** A full day template: an ordered list of time blocks. */
export interface DayTemplate {
  id: string;
  label: string;
  blocks: TimeBlock[];
  /** Locked Pomodoro type for this plan. Defaults to 'adaptive' for older saved templates. */
  pomodoroType?: PomodoroType;
}
