import { usePomodoroTimer } from '../hooks/usePomodoroTimer'
import styles from './PomodoroTimer.module.css'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function PomodoroTimer() {
  const { phase, elapsedSeconds, phaseDurationSeconds, isRunning, start, pause, resume, reset } =
    usePomodoroTimer()

  const remaining = Math.max(0, phaseDurationSeconds - elapsedSeconds)
  const started = elapsedSeconds > 0 || isRunning

  return (
    <div className={styles.container}>
      <p className={styles.phase}>{phase === 'focus' ? 'Focus' : 'Break'}</p>
      <p
        className={styles.display}
        role="timer"
        aria-live="off"
        aria-label={`${phase === 'focus' ? 'Focus' : 'Break'} time remaining: ${formatTime(remaining)}`}
      >
        {formatTime(remaining)}
      </p>
      <div className={styles.controls}>
        {!isRunning ? (
          <button onClick={started ? resume : start}>
            {started ? 'Resume' : 'Start'}
          </button>
        ) : (
          <button onClick={pause}>Pause</button>
        )}
        <button onClick={reset} disabled={!started}>
          Reset
        </button>
      </div>
    </div>
  )
}
