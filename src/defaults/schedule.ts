import type { DayTemplate } from '../types';

/**
 * Default day template.
 *
 *   08:30 – 10:30  Focus Block 1    (4 Pomodoros)
 *   10:30 – 11:00  Long Break       (30 min)
 *   11:00 – 12:00  Focus Block 2    (2 Pomodoros)
 *   12:00 – 13:00  Lunch Break      (60 min)
 *   13:00 – 15:00  Focus Block 3    (4 Pomodoros)
 */
export const DEFAULT_DAY_TEMPLATE: DayTemplate = {
  id: 'default',
  label: 'Default Day',
  blocks: [
    {
      type: 'focus',
      id: 'block-1',
      label: 'Focus Block 1',
      startTime: '08:30',
      endTime: '10:30',
      pomodoroCount: 4,
    },
    {
      type: 'long-break',
      id: 'block-2',
      label: 'Long Break',
      startTime: '10:30',
      endTime: '11:00',
    },
    {
      type: 'focus',
      id: 'block-3',
      label: 'Focus Block 2',
      startTime: '11:00',
      endTime: '12:00',
      pomodoroCount: 2,
    },
    {
      type: 'long-break',
      id: 'block-4',
      label: 'Lunch Break',
      startTime: '12:00',
      endTime: '13:00',
    },
    {
      type: 'focus',
      id: 'block-5',
      label: 'Focus Block 3',
      startTime: '13:00',
      endTime: '15:00',
      pomodoroCount: 4,
    },
  ],
};
