import type { DayTemplate } from '../types';

/**
 * Default day template.
 *
 * Schedule:
 *   08:30 – 10:30  Focus Block 1 (4 Pomodoros)
 *   10:30 – 11:00  Long break (30 min, inter-block gap)
 *   11:00 – 12:00  Focus Block 2 (2 Pomodoros)
 *   12:00 – 13:00  Lunch (inter-block gap)
 *   13:00 – 15:00  Focus Block 3 (4 Pomodoros)
 */
export const DEFAULT_DAY_TEMPLATE: DayTemplate = {
  id: 'default',
  label: 'Default Day',
  blocks: [
    {
      id: 'block-1',
      label: 'Focus Block 1',
      startTime: '08:30',
      endTime: '10:30',
      pomodoroCount: 4,
    },
    {
      id: 'block-2',
      label: 'Focus Block 2',
      startTime: '11:00',
      endTime: '12:00',
      pomodoroCount: 2,
    },
    {
      id: 'block-3',
      label: 'Focus Block 3',
      startTime: '13:00',
      endTime: '15:00',
      pomodoroCount: 4,
    },
  ],
};
