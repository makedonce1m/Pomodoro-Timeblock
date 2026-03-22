import { usePomodoroTimer } from '../hooks/usePomodoroTimer'
import { POMODORO_FOCUS_DURATION, POMODORO_BREAK_DURATION } from '../constants/timer'
import styles from './PomodoroTimer.module.css'

const RADIUS = 90
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatMinutes(seconds: number): string {
  return `${Math.round(seconds / 60)}m`
}

function IconPlay() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function IconPause() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  )
}

function IconReset() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
      <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
    </svg>
  )
}

function IconSkip() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
      <path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z" />
    </svg>
  )
}

export function PomodoroTimer() {
  const {
    mode, phase, elapsedSeconds, phaseDurationSeconds,
    isRunning, start, pause, resume, reset, skip,
  } = usePomodoroTimer()

  const remaining = Math.max(0, phaseDurationSeconds - elapsedSeconds)
  const started = elapsedSeconds > 0 || isRunning

  const focusTotal = POMODORO_FOCUS_DURATION[mode]
  const breakTotal = POMODORO_BREAK_DURATION[mode]

  const progressFraction = phaseDurationSeconds > 0 ? remaining / phaseDurationSeconds : 1
  const strokeDashoffset = CIRCUMFERENCE * (1 - progressFraction)

  return (
    <div className={styles.page}>
      <p className={styles.pomodoroLabel}>Pomodoro</p>

      {/* Circular ring timer */}
      <div className={styles.ringContainer}>
        <svg className={styles.ring} viewBox="0 0 200 200">
          <circle
            cx="100" cy="100" r={RADIUS}
            fill="none"
            stroke="#1E293B"
            strokeWidth="6"
          />
          <circle
            cx="100" cy="100" r={RADIUS}
            fill="none"
            stroke="#F59E0B"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 100 100)"
          />
        </svg>
        <div className={styles.ringCenter}>
          <span
            className={styles.timeDisplay}
            role="timer"
            aria-live="off"
            aria-label={`${phase === 'focus' ? 'Focus' : 'Break'} time remaining: ${formatTime(remaining)}`}
          >
            {formatTime(remaining)}
          </span>
          <span className={styles.phaseLabel}>
            {phase === 'focus' ? 'Focus' : 'Break'}
          </span>
        </div>
      </div>

      {/* Focus / Break cards */}
      <div className={styles.cards}>
        <div className={`${styles.card} ${phase === 'focus' ? styles.cardActive : ''}`}>
          <span className={styles.cardIcon}>⚡</span>
          <span className={styles.cardTime}>{formatMinutes(focusTotal)}</span>
          <span className={styles.cardLabel}>Focus</span>
        </div>
        <div className={`${styles.card} ${phase === 'break' ? styles.cardActive : ''}`}>
          <span className={styles.cardIcon}>🌙</span>
          <span className={styles.cardTime}>{formatMinutes(breakTotal)}</span>
          <span className={styles.cardLabel}>Break</span>
        </div>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.sideControl}>
          <button className={styles.sideButton} onClick={reset} disabled={!started} aria-label="Reset">
            <IconReset />
          </button>
          <span className={styles.buttonLabel}>Reset</span>
        </div>

        <button
          className={styles.playButton}
          onClick={!started ? start : isRunning ? pause : resume}
          aria-label={isRunning ? 'Pause' : 'Play'}
        >
          {isRunning ? <IconPause /> : <IconPlay />}
        </button>

        <div className={styles.sideControl}>
          <button
            className={styles.sideButton}
            onClick={skip}
            disabled={!started || phase === 'break'}
            aria-label="Skip"
          >
            <IconSkip />
          </button>
          <span className={styles.buttonLabel}>Skip</span>
        </div>
      </div>
    </div>
  )
}
