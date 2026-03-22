import { useRef } from 'react'
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
    startSession, continueToNext, goToPhase, resetPomodoro, jumpToPomodoro,
  } = session

  const upcomingBlocks = template.blocks.slice(blockIndex + 1)

  // Swipe to navigate between pomodoros within the current block
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current)
    // Ignore if not a clear horizontal swipe
    if (Math.abs(dx) < 50 || dy > Math.abs(dx)) return
    if (dx < 0 && pomodoroIndex < totalPomodoros - 1) {
      jumpToPomodoro(pomodoroIndex + 1)
    } else if (dx > 0 && pomodoroIndex > 0) {
      jumpToPomodoro(pomodoroIndex - 1)
    }
  }

  const sessionStarted = sessionPhase !== 'idle'
  const isLongBreak = sessionPhase === 'long-break'

  // When waiting for the user to tap continue, the play button advances to the next phase.
  const handleResume = waitingForContinue ? continueToNext : session.resume

  return (
    <div className={styles.screen} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>

      {/* ── Session context header ── */}
      <div className={styles.sessionHeader}>
        <div className={styles.sessionInfo}>
          <p className={styles.templateName}>{template.label}{currentBlock ? ` · ${currentBlock.label}` : ''}</p>
          {!isLongBreak && totalPomodoros > 0 && (
            <p className={styles.blockName}>Pomo {pomodoroIndex + 1}</p>
          )}
          {isLongBreak && currentBlock && (
            <p className={styles.blockName}>{currentBlock.label}</p>
          )}
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
        isClosingInterval={isClosingInterval}
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
