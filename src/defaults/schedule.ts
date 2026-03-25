import type { DayTemplate } from '../types';

/**
 * Default day template.
 *
 *   08:30 – 10:30  Study Block 1    (4 Pomodoros, 120 min)
 *   10:30 – 11:00  Long Break       (30 min)
 *   11:00 – 12:00  Study Block 2    (2 Pomodoros, 60 min)
 *   12:00 – 13:00  Lunch Break      (60 min)
 *   13:00 – 15:00  Study Block 3    (4 Pomodoros, 120 min)
 */
export const DEFAULT_DAY_TEMPLATE: DayTemplate = {
  id: 'default',
  label: 'Study Session',
  startTime: '08:30',
  pomodoroType: 'adaptive',
  blocks: [
    {
      type: 'focus',
      id: 'block-1',
      label: 'Study Block 1',
      durationMins: 120,
      pomodoroCount: 4,
    },
    {
      type: 'long-break',
      id: 'block-2',
      label: 'Long Break',
      durationMins: 30,
    },
    {
      type: 'focus',
      id: 'block-3',
      label: 'Study Block 2',
      durationMins: 60,
      pomodoroCount: 2,
    },
    {
      type: 'long-break',
      id: 'block-4',
      label: 'Lunch Break',
      durationMins: 60,
    },
    {
      type: 'focus',
      id: 'block-5',
      label: 'Study Block 3',
      durationMins: 120,
      pomodoroCount: 4,
    },
  ],
};
