import { MODE_SWITCH_CUTOFF_SECONDS } from '../constants/timer';

/**
 * Returns true when the user is allowed to switch Pomodoro mode mid-session.
 *
 * Switching is permitted only during the focus phase, while elapsed focus time
 * is below the cutoff (10 seconds before Comfort mode's 20-minute focus mark).
 * This ensures there is always meaningful focus time remaining regardless of
 * which mode the user switches to.
 *
 * @param phase          - Current timer phase.
 * @param elapsedSeconds - Seconds elapsed in the current focus phase.
 */
export function canSwitchMode(
  phase: 'focus' | 'break',
  elapsedSeconds: number,
): boolean {
  return phase === 'focus' && elapsedSeconds < MODE_SWITCH_CUTOFF_SECONDS;
}
