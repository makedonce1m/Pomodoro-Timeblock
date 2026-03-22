import type { DayTemplate } from '../types'
import type { TimeFormat } from '../hooks/useSettings'
import { useSession } from '../hooks/useSession'
import { PomodoroTimer } from '../components/PomodoroTimer'
import { formatDisplayTime } from '../utils/timeblock'
import styles from './RunScreen.module.css'

interface Props {
  template: DayTemplate
  autoContinue: boolean
  timeFormat: TimeFormat
  onDeactivate: () => void
}

export function RunScreen({ template, autoContinue, timeFormat, onDeactivate }: Props) {
  const session = useSession(template, autoContinue)

  const {
    mode, timerPhase, elapsedSeconds, phaseDurationSeconds, isRunning, canSwitch,
    sessionPhase, blockIndex, pomodoroIndex, totalPomodoros, isClosingInterval,
    currentBlock, isDone, waitingForContinue,
    pause, skip, switchMode, selectMode,
    startSession, continueToNext, goToPhase, resetPomodoro,
  } = session

  const upcomingBlocks = template.blocks.slice(blockIndex + 1)

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

      {/* ── Upcoming blocks ── */}
      {upcomingBlocks.length > 0 && !isDone && (
        <div className={styles.upcoming}>
          {upcomingBlocks.map((block, i) => (
            <div key={block.id} className={styles.upcomingRow}>
              <span className={styles.nextLabel}>{i === 0 ? 'Next' : ''}</span>
              <span className={styles.nextName}>{block.label}</span>
              <span className={styles.nextTime}>{formatDisplayTime(block.startTime, timeFormat)}–{formatDisplayTime(block.endTime, timeFormat)}</span>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
