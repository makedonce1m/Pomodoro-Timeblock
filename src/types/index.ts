/** A scheduled work session within a day. */
export interface TimeBlock {
  id: string;
  label: string;
  /** Start time in HH:mm (24-hour, local time) */
  startTime: string;
  /** End time in HH:mm (24-hour, local time) */
  endTime: string;
  /** Total number of Pomodoros that fit in this block (including the closing interval) */
  pomodoroCount: number;
}

/** A full day template: an ordered list of time blocks. */
export interface DayTemplate {
  id: string;
  label: string;
  blocks: TimeBlock[];
}
