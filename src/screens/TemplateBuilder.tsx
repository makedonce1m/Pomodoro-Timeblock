import { useState, useRef, useEffect } from 'react'
import type { DayTemplate, TimeBlock, FocusBlock, LongBreakBlock } from '../types'
import type { TimeFormat } from '../hooks/useSettings'
import { calcBlockTimes, formatDisplayTime } from '../utils/timeblock'
import styles from './TemplateBuilder.module.css'

interface Props {
  template: DayTemplate
  timeFormat: TimeFormat
  onSave: (t: DayTemplate) => void
  onCancel: () => void
  /** Not provided for brand-new unsaved templates. */
  onDelete?: (id: string) => void
  /** When set, show the unsaved-changes dialog and resolve it before proceeding. */
  pendingNavAway?: (() => void) | null
  onClearPendingNavAway?: () => void
}

export function TemplateBuilder({ template, timeFormat, onSave, onCancel, onDelete, pendingNavAway, onClearPendingNavAway }: Props) {
  const [label, setLabel] = useState(template.label)
  const [startTime, setStartTime] = useState(template.startTime ?? '09:00')
  const [blocks, setBlocks] = useState<TimeBlock[]>(template.blocks)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showUnsaved, setShowUnsaved] = useState(false)
  const pendingNavAwayAction = useRef<(() => void) | null>(null)

  // ── Drag-to-reorder ──────────────────────────────────────────────
  const [dragging, setDragging] = useState<number | null>(null)
  const [dropAt, setDropAt] = useState<number | null>(null)
  const blockEls = useRef<(HTMLDivElement | null)[]>([])
  const blocksContainerRef = useRef<HTMLDivElement>(null)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingDrag = useRef<{ index: number; startY: number } | null>(null)
  const autoScrollRaf = useRef<number | null>(null)
  const autoScrollSpeed = useRef(0)

  // Prevent touch-driven scroll while dragging; auto-scroll via JS instead.
  // Must be non-passive so preventDefault() is honoured.
  useEffect(() => {
    if (dragging === null) return
    const el = blocksContainerRef.current
    if (!el) return
    const prevent = (e: TouchEvent) => e.preventDefault()
    el.addEventListener('touchmove', prevent, { passive: false })
    return () => {
      el.removeEventListener('touchmove', prevent)
      stopAutoScroll()
    }
  }, [dragging])

  function startAutoScroll(speed: number) {
    autoScrollSpeed.current = speed
    if (autoScrollRaf.current !== null) return // loop already running
    function tick() {
      const el = blocksContainerRef.current
      if (el && autoScrollSpeed.current !== 0) el.scrollTop += autoScrollSpeed.current
      autoScrollRaf.current = requestAnimationFrame(tick)
    }
    autoScrollRaf.current = requestAnimationFrame(tick)
  }

  function stopAutoScroll() {
    if (autoScrollRaf.current !== null) {
      cancelAnimationFrame(autoScrollRaf.current)
      autoScrollRaf.current = null
    }
    autoScrollSpeed.current = 0
  }

  function handleTouchStart(index: number, clientY: number) {
    pendingDrag.current = { index, startY: clientY }
    longPressTimer.current = setTimeout(() => {
      if (pendingDrag.current !== null) {
        setDragging(pendingDrag.current.index)
        setDropAt(pendingDrag.current.index)
        pendingDrag.current = null
      }
    }, 300)
  }

  function handleTouchMove(clientY: number) {
    if (pendingDrag.current !== null) {
      // Not yet active — cancel if the finger moved (user is scrolling)
      if (Math.abs(clientY - pendingDrag.current.startY) > 8) {
        clearTimeout(longPressTimer.current!)
        longPressTimer.current = null
        pendingDrag.current = null
      }
      return
    }
    if (dragging === null) return

    // Auto-scroll when finger is near the top or bottom edge
    const ZONE = 64
    const MAX_SPEED = 10
    const container = blocksContainerRef.current
    if (container) {
      const { top, bottom } = container.getBoundingClientRect()
      if (clientY < top + ZONE) {
        startAutoScroll(-((ZONE - (clientY - top)) / ZONE) * MAX_SPEED)
      } else if (clientY > bottom - ZONE) {
        startAutoScroll(((ZONE - (bottom - clientY)) / ZONE) * MAX_SPEED)
      } else {
        stopAutoScroll()
      }
    }

    // Update drop position from block midpoints
    const mids = blockEls.current.map(el => {
      if (!el) return 0
      const r = el.getBoundingClientRect()
      return r.top + r.height / 2
    })
    let drop = blocks.length
    for (let i = 0; i < mids.length; i++) {
      if (clientY < mids[i]) { drop = i; break }
    }
    setDropAt(drop)
  }

  function handleTouchEnd() {
    stopAutoScroll()
    if (longPressTimer.current !== null) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    pendingDrag.current = null
    if (dragging !== null && dropAt !== null && dropAt !== dragging && dropAt !== dragging + 1) {
      const next = [...blocks]
      const [item] = next.splice(dragging, 1)
      const insertAt = dropAt > dragging ? dropAt - 1 : dropAt
      next.splice(insertAt, 0, item)
      setBlocks(next)
    }
    setDragging(null)
    setDropAt(null)
  }
  // ────────────────────────────────────────────────────────────────

  const hasChanges =
    label !== template.label ||
    startTime !== (template.startTime ?? '09:00') ||
    JSON.stringify(blocks) !== JSON.stringify(template.blocks)

  // When the nav triggers a leave while editing, show the unsaved dialog.
  useEffect(() => {
    if (!pendingNavAway) return
    if (hasChanges) {
      pendingNavAwayAction.current = pendingNavAway
      setShowUnsaved(true)
    } else {
      onClearPendingNavAway?.()
      pendingNavAway()
    }
  }, [pendingNavAway]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleBack() {
    if (hasChanges) {
      setShowUnsaved(true)
    } else {
      onCancel()
    }
  }

  function addFocusBlock() {
    const block: FocusBlock = {
      type: 'focus',
      id: Date.now().toString(),
      label: `Focus Block ${blocks.filter(b => b.type === 'focus').length + 1}`,
      durationMins: 120,
      pomodoroCount: 4,
    }
    setBlocks(prev => [...prev, block])
  }

  function addBreakBlock() {
    const block: LongBreakBlock = {
      type: 'long-break',
      id: Date.now().toString(),
      label: 'Break',
      durationMins: 30,
    }
    setBlocks(prev => [...prev, block])
  }

  function updateLabel(id: string, value: string) {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, label: value } : b))
  }

  function updateDuration(id: string, durationMins: number) {
    setBlocks(prev => prev.map(b => {
      if (b.id !== id) return b
      if (b.type === 'focus') return { ...b, durationMins, pomodoroCount: durationMins / 30 }
      return { ...b, durationMins }
    }))
  }

  function deleteBlock(id: string) {
    setBlocks(prev => prev.filter(b => b.id !== id))
  }

  const blockTimes = calcBlockTimes(startTime, blocks)

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={handleBack} aria-label="Back">←</button>
        <input
          className={styles.nameInput}
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="Template name"
          aria-label="Template name"
        />
        <button className={styles.saveButton} onClick={() => onSave({ ...template, label, startTime, blocks })}>
          Save
        </button>
      </div>

      {template.pomodoroType && (
        <div className={styles.typeBadgeRow}>
          <span className={styles.typeBadge}>
            {template.pomodoroType === 'classic' ? 'Classic' : 'Adaptive'}
          </span>
          <span className={styles.typeBadgeLocked}>locked</span>
        </div>
      )}

      {/* Plan-level start time */}
      <div className={styles.planStartRow}>
        <span className={styles.planStartLabel}>Day starts at</span>
        <StartTimeSelect value={startTime} timeFormat={timeFormat} onChange={setStartTime} />
      </div>

      <div className={styles.blocks} ref={blocksContainerRef}>
        {blocks.length === 0 && (
          <p className={styles.empty}>Add your first block below.</p>
        )}
        {blocks.map((block, idx) => {
          const times = blockTimes[idx]
          return (
            <div key={block.id}>
              {dragging !== null && dropAt === idx && (
                <div className={styles.dropLine} />
              )}
              <div
                ref={el => { blockEls.current[idx] = el }}
                className={[
                  styles.block,
                  block.type === 'focus' ? styles.blockFocus : styles.blockBreak,
                  dragging === idx ? styles.blockDragging : '',
                ].filter(Boolean).join(' ')}
                onTouchStart={e => handleTouchStart(idx, e.touches[0].clientY)}
                onTouchMove={e => handleTouchMove(e.touches[0].clientY)}
                onTouchEnd={handleTouchEnd}
              >
                <div className={styles.dragHandle} aria-hidden="true">
                  <svg width="14" height="18" viewBox="0 0 14 18" fill="none">
                    <circle cx="4" cy="4" r="1.5" fill="currentColor"/>
                    <circle cx="10" cy="4" r="1.5" fill="currentColor"/>
                    <circle cx="4" cy="9" r="1.5" fill="currentColor"/>
                    <circle cx="10" cy="9" r="1.5" fill="currentColor"/>
                    <circle cx="4" cy="14" r="1.5" fill="currentColor"/>
                    <circle cx="10" cy="14" r="1.5" fill="currentColor"/>
                  </svg>
                </div>

                {block.type === 'focus' ? (
                  <div className={`${styles.blockPill} ${styles.blockPillFocus}`} aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                ) : (
                  <div className={`${styles.blockPill} ${styles.blockPillBreak}`} aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M18 8h1a4 4 0 0 1 0 8h-1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="6" y1="1" x2="6" y2="4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="10" y1="1" x2="10" y2="4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="14" y1="1" x2="14" y2="4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                )}

                <div className={styles.blockContent}>
                  <div className={styles.blockHeader}>
                    <span className={styles.blockType}>
                      {block.type === 'focus' ? 'Focus' : 'Break'}
                    </span>
                    {block.type === 'focus' && (
                      <span className={styles.pomCount}>{block.pomodoroCount} Pomodoros</span>
                    )}
                    <button
                      className={styles.deleteBlock}
                      onClick={() => deleteBlock(block.id)}
                      aria-label="Remove block"
                    >
                      ×
                    </button>
                  </div>

                  <input
                    className={styles.blockLabel}
                    value={block.label}
                    onChange={e => updateLabel(block.id, e.target.value)}
                    placeholder="Block name"
                    aria-label="Block name"
                  />

                  <div className={styles.timeRows}>
                    <span className={styles.computedTime}>
                      {formatDisplayTime(times.start, timeFormat)}–{formatDisplayTime(times.end, timeFormat)}
                    </span>
                    <label className={styles.timeRowItem}>
                      <span className={styles.timeLabel}>Duration</span>
                      {block.type === 'focus' ? (
                        <FocusDurationSelect
                          durationMins={block.durationMins}
                          onChange={v => updateDuration(block.id, v)}
                        />
                      ) : (
                        <BreakDurationSelect
                          durationMins={block.durationMins}
                          onChange={v => updateDuration(block.id, v)}
                        />
                      )}
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        {dragging !== null && dropAt === blocks.length && (
          <div className={styles.dropLine} />
        )}

        <div className={styles.footer}>
          <button className={styles.addButton} onClick={addFocusBlock}>+ Focus Block</button>
          <button className={`${styles.addButton} ${styles.addBreak}`} onClick={addBreakBlock}>+ Break</button>
        </div>

        {onDelete && (
          <div className={styles.deleteZone}>
            {confirmDelete ? (
              <div className={styles.deleteConfirm}>
                <span className={styles.deleteConfirmText}>Delete this plan?</span>
                <button className={styles.deleteConfirmNo} onClick={() => setConfirmDelete(false)}>Cancel</button>
                <button className={styles.deleteConfirmYes} onClick={() => onDelete(template.id)}>Delete</button>
              </div>
            ) : (
              <button className={styles.deleteTemplate} onClick={() => setConfirmDelete(true)}>
                Delete Plan
              </button>
            )}
          </div>
        )}
      </div>

      {/* Unsaved-changes confirmation */}
      {showUnsaved && (
        <div className={styles.unsavedOverlay}>
          <div className={styles.unsavedSheet}>
            <p className={styles.unsavedTitle}>Unsaved changes</p>
            <p className={styles.unsavedDesc}>Would you like to save before leaving?</p>
            <div className={styles.unsavedActions}>
              <button
                className={styles.unsavedSave}
                onClick={() => {
                  onSave({ ...template, label, startTime, blocks })
                  const act = pendingNavAwayAction.current
                  pendingNavAwayAction.current = null
                  onClearPendingNavAway?.()
                  act?.()
                }}
              >
                Save
              </button>
              <button
                className={styles.unsavedDiscard}
                onClick={() => {
                  const act = pendingNavAwayAction.current
                  pendingNavAwayAction.current = null
                  onClearPendingNavAway?.()
                  onCancel()
                  act?.()
                }}
              >
                Discard
              </button>
              <button
                className={styles.unsavedKeep}
                onClick={() => {
                  pendingNavAwayAction.current = null
                  onClearPendingNavAway?.()
                  setShowUnsaved(false)
                }}
              >
                Keep editing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Dropdown for plan-level start time in 30-minute increments across the full day.
 */
function StartTimeSelect({
  value,
  timeFormat,
  onChange,
}: {
  value: string
  timeFormat: TimeFormat
  onChange: (v: string) => void
}) {
  const options = Array.from({ length: 48 }, (_, i) => {
    const h = Math.floor(i / 2)
    const m = i % 2 === 0 ? '00' : '30'
    return `${String(h).padStart(2, '0')}:${m}`
  })

  // Snap stored value to nearest 30-min slot
  const [h, m] = value.split(':').map(Number)
  const snapped = `${String(h).padStart(2, '0')}:${m < 30 ? '00' : '30'}`
  const selected = options.includes(snapped) ? snapped : options[0]

  return (
    <select
      className={styles.endSelect}
      value={selected}
      onChange={e => onChange(e.target.value)}
    >
      {options.map(o => (
        <option key={o} value={o}>
          {formatDisplayTime(o, timeFormat)}
        </option>
      ))}
    </select>
  )
}

/**
 * Dropdown for focus block duration: 1–16 Pomodoros (30-min steps).
 */
function FocusDurationSelect({
  durationMins,
  onChange,
}: {
  durationMins: number
  onChange: (v: number) => void
}) {
  const MAX_POMOS = 16
  const options = Array.from({ length: MAX_POMOS }, (_, i) => ({
    pomos: i + 1,
    mins: (i + 1) * 30,
  }))
  const snapped = Math.min(MAX_POMOS * 30, Math.max(30, Math.round(durationMins / 30) * 30))

  function durationLabel(mins: number): string {
    if (mins < 60) return `${mins}m`
    if (mins % 60 === 0) return `${mins / 60}h`
    return `${Math.floor(mins / 60)}h ${mins % 60}m`
  }

  return (
    <select
      className={styles.endSelect}
      value={snapped}
      onChange={e => onChange(Number(e.target.value))}
    >
      {options.map(o => (
        <option key={o.mins} value={o.mins}>
          {o.pomos === 1 ? '1 pomo' : `${o.pomos} pomos`} · {durationLabel(o.mins)}
        </option>
      ))}
    </select>
  )
}

/**
 * Dropdown for break block duration: 15-minute steps up to 2 hours.
 */
function BreakDurationSelect({
  durationMins,
  onChange,
}: {
  durationMins: number
  onChange: (v: number) => void
}) {
  const options = [15, 30, 45, 60, 90, 120]
  const snapped = options.includes(durationMins) ? durationMins : 30

  function label(mins: number): string {
    if (mins < 60) return `${mins}m`
    if (mins % 60 === 0) return `${mins / 60}h`
    return `${Math.floor(mins / 60)}h ${mins % 60}m`
  }

  return (
    <select
      className={styles.endSelect}
      value={snapped}
      onChange={e => onChange(Number(e.target.value))}
    >
      {options.map(o => (
        <option key={o} value={o}>{label(o)}</option>
      ))}
    </select>
  )
}

