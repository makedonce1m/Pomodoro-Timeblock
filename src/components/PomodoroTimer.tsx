import { usePomodoroTimer } from '../hooks/usePomodoroTimer'
import { POMODORO_FOCUS_DURATION, POMODORO_BREAK_DURATION } from '../constants/timer'
import styles from './PomodoroTimer.module.css'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function PomodoroTimer() {
  const { mode, phase, elapsedSeconds, phaseDurationSeconds, isRunning, start, pause, resume, reset, skip } =
    usePomodoroTimer()

  const remaining = Math.max(0, phaseDurationSeconds - elapsedSeconds)
  const started = elapsedSeconds > 0 || isRunning

  const focusRemaining = phase === 'focus' ? remaining : POMODORO_FOCUS_DURATION[mode]
  const breakRemaining = phase === 'break' ? remaining : POMODORO_BREAK_DURATION[mode]

  return (
    <div className={styles.wrapper}>
      <span className={styles.pomodoroLabel}>Pomodoro</span>
      <div className={styles.outerBox}>

        <div className={`${styles.block} ${phase === 'focus' ? styles.active : styles.inactive}`}>
          <p className={styles.blockLabel}>Focus</p>
          <p
            className={styles.display}
            role="timer"
            aria-live="off"
            aria-label={`Focus time remaining: ${formatTime(focusRemaining)}`}
          >
            {formatTime(focusRemaining)}
          </p>
          <div className={styles.controls}>
            {!isRunning ? (
              <button onClick={started ? resume : start}>
                {started ? 'Resume' : 'Start'}
              </button>
            ) : (
              <button onClick={pause}>Pause</button>
            )}
            <button onClick={reset} disabled={!started}>Reset</button>
            {phase === 'focus' && started && (
              <button onClick={skip}>Skip</button>
            )}
          </div>
        </div>

        <div className={`${styles.block} ${phase === 'break' ? styles.active : styles.inactive}`}>
          <p className={styles.blockLabel}>Break</p>
          <p
            className={styles.display}
            role="timer"
            aria-live="off"
            aria-label={`Break time remaining: ${formatTime(breakRemaining)}`}
          >
            {formatTime(breakRemaining)}
          </p>
        </div>

      </div>
    </div>
  )
}
