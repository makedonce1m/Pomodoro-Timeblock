import type { DayTemplate } from '../types'
import { useSession } from '../hooks/useSession'
import styles from './RunScreen.module.css'

const RADIUS = 90
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function IconPlay() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
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

function IconSkip() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z" />
    </svg>
  )
}

interface PickerProps {
  templates: DayTemplate[]
  onActivate: (id: string) => void
}

function TemplatePicker({ templates, onActivate }: PickerProps) {
  return (
    <div className={styles.picker}>
      <p className={styles.pickerHint}>Choose a template to start a session</p>
      {templates.length === 0 && (
        <p className={styles.pickerEmpty}>No templates yet — create one in Templates.</p>
      )}
      {templates.map(t => {
        const focusBlocks = t.blocks.filter(b => b.type === 'focus')
        const totalPoms = focusBlocks.reduce((s, b) => s + (b as { pomodoroCount: number }).pomodoroCount, 0)
        return (
          <button key={t.id} className={styles.pickerCard} onClick={() => onActivate(t.id)}>
            <span className={styles.pickerName}>{t.label}</span>
            <span className={styles.pickerMeta}>{focusBlocks.length} blocks · {totalPoms} Pomodoros</span>
            <span className={styles.pickerArrow}>▶</span>
          </button>
        )
      })}
    </div>
  )
}

interface Props {
  template: DayTemplate | null
  templates: DayTemplate[]
  autoContinue: boolean
  onActivate: (id: string) => void
  onDeactivate: () => void
}

export function RunScreen({ template, templates, autoContinue, onActivate, onDeactivate }: Props) {
  const session = useSession(template, autoContinue)

  if (!template) {
    return <TemplatePicker templates={templates} onActivate={onActivate} />
  }

  const {
    sessionPhase, elapsedSeconds, phaseDurationSeconds, isRunning,
    pomodoroIndex, totalPomodoros, isClosingInterval,
    currentBlock, nextBlock, isDone, waitingForContinue,
    pause, resume, skip, startSession, continueToNext,
  } = session

  const remaining = Math.max(0, phaseDurationSeconds - elapsedSeconds)
  const progressFraction = phaseDurationSeconds > 0 ? remaining / phaseDurationSeconds : 1
  const strokeDashoffset = CIRCUMFERENCE * (1 - progressFraction)

  const isIdle = sessionPhase === 'idle'
  const isLongBreak = sessionPhase === 'long-break'

  // Display label inside the ring
  function phaseLabel(): string {
    if (isIdle) return 'Ready'
    if (isDone) return 'Done'
    if (sessionPhase === 'long-break') return 'Long Break'
    if (sessionPhase === 'short-break') return 'Break'
    if (isClosingInterval) return 'Closing'
    return 'Focus'
  }

  // Ring colour: amber for focus/closing, slate for breaks
  const isFocusPhase = sessionPhase === 'focus' || sessionPhase === 'idle' || isClosingInterval
  const ringColour = isFocusPhase ? '#F59E0B' : '#64748B'

  return (
    <div className={styles.screen}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <p className={styles.templateLabel}>{template.label}</p>
          {currentBlock && (
            <p className={styles.blockLabel}>{currentBlock.label}</p>
          )}
        </div>
        <button className={styles.endButton} onClick={onDeactivate} aria-label="End session">
          ✕
        </button>
      </div>

      {/* ── Progress dots ── */}
      {!isLongBreak && totalPomodoros > 0 && (
        <div className={styles.dots} aria-label={`Pomodoro ${pomodoroIndex + 1} of ${totalPomodoros}`}>
          {Array.from({ length: totalPomodoros }, (_, i) => (
            <span
              key={i}
              className={`${styles.dot} ${i < pomodoroIndex ? styles.dotDone : ''} ${i === pomodoroIndex ? styles.dotActive : ''}`}
            />
          ))}
        </div>
      )}

      {/* ── Timer ring ── */}
      <div className={styles.ringContainer}>
        <svg className={styles.ring} viewBox="0 0 200 200" aria-hidden="true">
          <circle cx="100" cy="100" r={RADIUS} fill="none" stroke="#1a1a1a" strokeWidth="6" />
          <circle
            cx="100" cy="100" r={RADIUS}
            fill="none"
            stroke={ringColour}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={isDone || isIdle ? CIRCUMFERENCE : strokeDashoffset}
            transform="rotate(-90 100 100)"
            style={{ transition: 'stroke 0.3s' }}
          />
        </svg>
        <div className={styles.ringCenter}>
          <span
            className={styles.timeDisplay}
            role="timer"
            aria-live="off"
            aria-label={`${phaseLabel()} time remaining: ${formatTime(remaining)}`}
          >
            {isDone ? '✓' : formatTime(remaining)}
          </span>
          <span className={styles.phaseLabel}>{phaseLabel()}</span>
        </div>
      </div>

      {/* ── Pomodoro counter ── */}
      {!isLongBreak && !isDone && totalPomodoros > 0 && (
        <p className={styles.pomCounter}>
          {isClosingInterval
            ? `Closing interval · ${totalPomodoros} of ${totalPomodoros}`
            : `Pomodoro ${pomodoroIndex + 1} of ${totalPomodoros}`}
        </p>
      )}

      {/* ── Controls ── */}
      {!isDone && (
        <div className={styles.controls}>
          {isIdle ? (
            <button className={styles.playButton} onClick={startSession} aria-label="Start session">
              <IconPlay />
            </button>
          ) : waitingForContinue ? (
            <button className={styles.continueButton} onClick={continueToNext}>
              Continue →
            </button>
          ) : (
            <>
              <button
                className={styles.sideButton}
                onClick={skip}
                aria-label="Skip"
                disabled={isIdle}
              >
                <IconSkip />
              </button>
              <button
                className={styles.playButton}
                onClick={isRunning ? pause : resume}
                aria-label={isRunning ? 'Pause' : 'Resume'}
              >
                {isRunning ? <IconPause /> : <IconPlay />}
              </button>
              <div className={styles.sideButton} aria-hidden="true" />
            </>
          )}
        </div>
      )}

      {isDone && (
        <div className={styles.doneActions}>
          <p className={styles.doneMsg}>Session complete!</p>
          <button className={styles.restartButton} onClick={startSession}>
            Start Again
          </button>
        </div>
      )}

      {/* ── Next up ── */}
      {nextBlock && !isDone && (
        <div className={styles.nextUp}>
          <span className={styles.nextLabel}>Next</span>
          <span className={styles.nextName}>{nextBlock.label}</span>
          <span className={styles.nextTime}>{nextBlock.startTime}–{nextBlock.endTime}</span>
        </div>
      )}
    </div>
  )
}
