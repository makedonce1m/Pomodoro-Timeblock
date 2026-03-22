import type { DayTemplate } from '../types'
import { useSession } from '../hooks/useSession'
import { PomodoroTimer } from '../components/PomodoroTimer'
import styles from './RunScreen.module.css'

interface Props {
  template: DayTemplate
  autoContinue: boolean
  onDeactivate: () => void
}

export function RunScreen({ template, autoContinue, onDeactivate }: Props) {
  const session = useSession(template, autoContinue)

  const {
    mode, timerPhase, elapsedSeconds, phaseDurationSeconds, isRunning, canSwitch,
    sessionPhase, pomodoroIndex, totalPomodoros, isClosingInterval,
    currentBlock, nextBlock, isDone, waitingForContinue,
    pause, skip, switchMode, selectMode,
    startSession, continueToNext, goToPhase, resetPomodoro,
  } = session

  const sessionStarted = sessionPhase !== 'idle'
  const isLongBreak = sessionPhase === 'long-break'

  // When waiting for the user to tap continue, the play button advances to the next phase.
  const handleResume = waitingForContinue ? continueToNext : session.resume

  return (
    <div className={styles.screen}>

      {/* ── Session context header ── */}
      <div className={styles.sessionHeader}>
        <div className={styles.sessionInfo}>
          <p className={styles.templateName}>{template.label}</p>
          {currentBlock && <p className={styles.blockName}>{currentBlock.label}</p>}
        </div>
        <button className={styles.endButton} onClick={onDeactivate} aria-label="End session">✕</button>
      </div>

      {/* ── Pomodoro progress dots ── */}
      {!isLongBreak && !isDone && totalPomodoros > 0 && (
        <div className={styles.dots} aria-label={`Pomodoro ${pomodoroIndex + 1} of ${totalPomodoros}`}>
          {Array.from({ length: totalPomodoros }, (_, i) => (
            <span
              key={i}
              className={`${styles.dot}
                ${i < pomodoroIndex ? styles.dotDone : ''}
                ${i === pomodoroIndex ? (isClosingInterval ? styles.dotClosing : styles.dotActive) : ''}`}
            />
          ))}
          {isClosingInterval && (
            <span className={styles.closingBadge}>closing</span>
          )}
        </div>
      )}

      {/* ── Full Adaptive Pomo timer ── */}
      <PomodoroTimer
        mode={mode}
        phase={timerPhase}
        elapsedSeconds={elapsedSeconds}
        phaseDurationSeconds={phaseDurationSeconds}
        isRunning={isRunning}
        started={sessionStarted}
        canSwitch={canSwitch}
        onStart={startSession}
        onPause={pause}
        onResume={handleResume}
        onReset={resetPomodoro}
        onSkip={skip}
        onGoToPhase={goToPhase}
        onSelectMode={selectMode}
        onSwitchMode={switchMode}
      />

      {/* ── Done overlay ── */}
      {isDone && (
        <div className={styles.doneRow}>
          <span className={styles.doneMsg}>Session complete!</span>
          <button className={styles.restartButton} onClick={startSession}>Start Again</button>
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
