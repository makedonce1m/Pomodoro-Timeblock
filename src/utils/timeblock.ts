import type { TimeFormat } from '../hooks/useSettings';
import type { TimeBlock } from '../types';

/** Formats a stored HH:mm string for display according to the user's chosen format. */
export function formatDisplayTime(hhmm: string, format: TimeFormat): string {
  if (format === '24h') return hhmm;
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

/** Adds minutes to an HH:mm string, returns HH:mm. */
export function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + minutes
  const hh = Math.floor(total / 60) % 24
  const mm = total % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

/**
 * Computes the start and end time for each block by chaining durations from the plan start time.
 * Returns an array parallel to `blocks`.
 */
export function calcBlockTimes(startTime: string, blocks: TimeBlock[]): Array<{ start: string; end: string }> {
  let current = startTime;
  return blocks.map(block => {
    const start = current;
    const end = addMinutes(start, block.durationMins);
    current = end;
    return { start, end };
  });
}
