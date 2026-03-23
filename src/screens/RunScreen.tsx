import { useRef, useState } from 'react'
import type { DayTemplate } from '../types'
import type { TimeFormat } from '../hooks/useSettings'
import { useSession } from '../hooks/useSession'
import { PomodoroTimer } from '../components/PomodoroTimer'
import { formatDisplayTime } from '../utils/timeblock'
import { POMODORO_FOCUS_DURATION, CLOSING_INTERVAL_DURATION } from '../constants/timer'
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

  // ── Animated swipe between pomodoros ──────────────────────────────
  const [swipeX, setSwipeX] = useState(0)
  const [swipeTransition, setSwipeTransition] = useState(false)
  const [previewDir, setPreviewDir] = useState<'next' | 'prev' | null>(null)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const dragging = useRef(false)
  const animPhase = useRef<'idle' | 'exit' | 'enter'>('idle')
  const pendingJump = useRef<number | null>(null)
  const exitToward = useRef(0) // -1 = left exit, +1 = right exit

  function handleTouchStart(e: React.TouchEvent) {
    if (animPhase.current !== 'idle') return
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    dragging.current = true
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!dragging.current) return
    const dx = e.touches[0].clientX - touchStartX.current
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current)
    if (dy > Math.abs(dx)) { dragging.current = false; setSwipeX(0); setPreviewDir(null); return }
    // Determine preview direction once we know horizontal intent
    if (previewDir === null && Math.abs(dx) > 8) {
      if (dx < 0 && pomodoroIndex < totalPomodoros - 1) setPreviewDir('next')
      else if (dx > 0 && pomodoroIndex > 0) setPreviewDir('prev')
    }
    // Apply rubber-band resistance when at the edge (no pomo in that direction)
    const atLeft = pomodoroIndex === 0 && dx > 0
    const atRight = pomodoroIndex === totalPomodoros - 1 && dx < 0
    setSwipeX(dx * ((atLeft || atRight) ? 0.25 : 1))
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!dragging.current) return
    dragging.current = false
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current)

    const canNext = dx < 0 && pomodoroIndex < totalPomodoros - 1
    const canPrev = dx > 0 && pomodoroIndex > 0

    if (Math.abs(dx) >= 50 && dy <= Math.abs(dx) && (canNext || canPrev)) {
      const targetIndex = dx < 0 ? pomodoroIndex + 1 : pomodoroIndex - 1
      exitToward.current = dx < 0 ? -1 : 1
      pendingJump.current = targetIndex
      animPhase.current = 'exit'
      setSwipeTransition(true)
      setSwipeX(exitToward.current * window.innerWidth)
    } else {
      // Snap back
      setSwipeTransition(true)
      setSwipeX(0)
    }
  }

  function handleSwipeTransitionEnd() {
    if (animPhase.current === 'exit') {
      // The preview card animated to center — let the real card take over there instantly.
      animPhase.current = 'idle'
      jumpToPomodoro(pendingJump.current!)
      pendingJump.current = null
      setSwipeTransition(false)
      setSwipeX(0)
      setPreviewDir(null)
    } else if (animPhase.current === 'enter') {
      animPhase.current = 'idle'
      setSwipeTransition(false)
      setPreviewDir(null)
    } else {
      // Snap-back completed
      setPreviewDir(null)
    }
  }

  const sessionStarted = sessionPhase !== 'idle'
  const isLongBreak = sessionPhase === 'long-break'

  // Preview card for swipe animation
  const previewPomoIndex = previewDir === 'next' ? pomodoroIndex + 1 : pomodoroIndex - 1
  const previewIsClosing = previewPomoIndex === totalPomodoros - 1
  const previewDuration = previewIsClosing ? CLOSING_INTERVAL_DURATION : POMODORO_FOCUS_DURATION[mode]
  const previewOffsetX = previewDir === 'next'
    ? swipeX + window.innerWidth
    : swipeX - window.innerWidth

  // When waiting for the user to tap continue, the play button advances to the next phase.
  const handleResume = waitingForContinue ? continueToNext : session.resume

  return (
    <div className={styles.screen}>

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

      {/* ── Full Adaptive Pomo timer (swipeable) ── */}
      <div className={styles.swipeViewport}>
        <div
          className={styles.swipeCard}
          style={{
            transform: `translateX(${swipeX}px)`,
            transition: swipeTransition ? 'transform 0.22s ease-out' : 'none',
          }}
          onTransitionEnd={handleSwipeTransitionEnd}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <PomodoroTimer
            mode={mode}
            phase={timerPhase}
            elapsedSeconds={elapsedSeconds}
            phaseDurationSeconds={phaseDurationSeconds}
            isRunning={isRunning}
            started={sessionStarted}
            canSwitch={canSwitch}
            isClosingInterval={isClosingInterval}
            isLongBreak={isLongBreak}
            onStart={startSession}
            onPause={pause}
            onResume={handleResume}
            onReset={resetPomodoro}
            onSkip={skip}
            onGoToPhase={goToPhase}
            onSelectMode={selectMode}
            onSwitchMode={switchMode}
          />
        </div>
        {previewDir !== null && (
          <div
            className={styles.previewCard}
            style={{
              transform: `translateX(${previewOffsetX}px)`,
              transition: swipeTransition ? 'transform 0.22s ease-out' : 'none',
            }}
          >
            <PomodoroTimer
              mode={mode}
              phase="focus"
              elapsedSeconds={0}
              phaseDurationSeconds={previewDuration}
              isRunning={false}
              started={false}
              canSwitch={false}
              isClosingInterval={previewIsClosing}
              onStart={() => {}}
              onPause={() => {}}
              onResume={() => {}}
              onReset={() => {}}
              onSkip={() => {}}
              onGoToPhase={() => {}}
              onSelectMode={() => {}}
              onSwitchMode={() => {}}
            />
          </div>
        )}
      </div>

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
