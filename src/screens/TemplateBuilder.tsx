import { useState } from 'react'
import type { DayTemplate, TimeBlock, FocusBlock, LongBreakBlock } from '../types'
import type { TimeFormat } from '../hooks/useSettings'
import { calcPomodoroCount, addMinutes } from '../utils/timeblock'
import styles from './TemplateBuilder.module.css'

interface Props {
  template: DayTemplate
  timeFormat: TimeFormat
  onSave: (t: DayTemplate) => void
  onCancel: () => void
  /** Not provided for brand-new unsaved templates. */
  onDelete?: (id: string) => void
}

/** Format HH:mm string for display (24h always in editor; time picker returns HH:mm regardless of locale) */
function fmt24(hhmm: string): string {
  return hhmm // already HH:mm
}

export function TemplateBuilder({ template, timeFormat, onSave, onCancel, onDelete }: Props) {
  const [label, setLabel] = useState(template.label)
  const [blocks, setBlocks] = useState<TimeBlock[]>(template.blocks)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showUnsaved, setShowUnsaved] = useState(false)

  const hasChanges =
    label !== template.label ||
    JSON.stringify(blocks) !== JSON.stringify(template.blocks)

  function handleBack() {
    if (hasChanges) {
      setShowUnsaved(true)
    } else {
      onCancel()
    }
  }

  function lastEndTime(): string {
    return blocks.length > 0 ? blocks[blocks.length - 1].endTime : '08:00'
  }

  function addFocusBlock() {
    const start = lastEndTime()
    const end = addMinutes(start, 120)
    const block: FocusBlock = {
      type: 'focus',
      id: Date.now().toString(),
      label: `Focus Block ${blocks.filter(b => b.type === 'focus').length + 1}`,
      startTime: start,
      endTime: end,
      pomodoroCount: calcPomodoroCount(start, end),
    }
    setBlocks(prev => [...prev, block])
  }

  function addBreakBlock() {
    const start = lastEndTime()
    const end = addMinutes(start, 30)
    const block: LongBreakBlock = {
      type: 'long-break',
      id: Date.now().toString(),
      label: 'Break',
      startTime: start,
      endTime: end,
    }
    setBlocks(prev => [...prev, block])
  }

  function updateField(id: string, field: 'label' | 'startTime' | 'endTime', value: string) {
    setBlocks(prev => prev.map(b => {
      if (b.id !== id) return b
      const next = { ...b, [field]: value }
      if (next.type === 'focus') {
        next.pomodoroCount = calcPomodoroCount(next.startTime, next.endTime)
      }
      return next as TimeBlock
    }))
  }

  function deleteBlock(id: string) {
    setBlocks(prev => prev.filter(b => b.id !== id))
  }

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
        <button className={styles.saveButton} onClick={() => onSave({ ...template, label, blocks })}>
          Save
        </button>
      </div>

      <div className={styles.blocks}>
        {blocks.length === 0 && (
          <p className={styles.empty}>Add your first block below.</p>
        )}
        {blocks.map(block => (
          <div
            key={block.id}
            className={`${styles.block} ${block.type === 'focus' ? styles.blockFocus : styles.blockBreak}`}
          >
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
              onChange={e => updateField(block.id, 'label', e.target.value)}
              placeholder="Block name"
              aria-label="Block name"
            />

            <div className={styles.timeRow}>
              <label className={styles.timeField}>
                <span className={styles.timeFieldLabel}>Start</span>
                <TimeInput
                  value={block.startTime}
                  timeFormat={timeFormat}
                  onChange={v => updateField(block.id, 'startTime', v)}
                />
              </label>
              <span className={styles.timeSep}>→</span>
              <label className={styles.timeField}>
                <span className={styles.timeFieldLabel}>End</span>
                <TimeInput
                  value={block.endTime}
                  timeFormat={timeFormat}
                  onChange={v => updateField(block.id, 'endTime', v)}
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <button className={styles.addButton} onClick={addFocusBlock}>+ Focus Block</button>
        <button className={`${styles.addButton} ${styles.addBreak}`} onClick={addBreakBlock}>+ Break</button>
      </div>

      {onDelete && (
        <div className={styles.deleteZone}>
          {confirmDelete ? (
            <div className={styles.deleteConfirm}>
              <span className={styles.deleteConfirmText}>Delete this template?</span>
              <button className={styles.deleteConfirmNo} onClick={() => setConfirmDelete(false)}>Cancel</button>
              <button className={styles.deleteConfirmYes} onClick={() => onDelete(template.id)}>Delete</button>
            </div>
          ) : (
            <button className={styles.deleteTemplate} onClick={() => setConfirmDelete(true)}>
              Delete Template
            </button>
          )}
        </div>
      )}

      {/* Unsaved-changes confirmation */}
      {showUnsaved && (
        <div className={styles.unsavedOverlay}>
          <div className={styles.unsavedSheet}>
            <p className={styles.unsavedTitle}>Unsaved changes</p>
            <p className={styles.unsavedDesc}>Would you like to save before leaving?</p>
            <div className={styles.unsavedActions}>
              <button
                className={styles.unsavedSave}
                onClick={() => { onSave({ ...template, label, blocks }) }}
              >
                Save
              </button>
              <button className={styles.unsavedDiscard} onClick={onCancel}>
                Discard
              </button>
              <button className={styles.unsavedKeep} onClick={() => setShowUnsaved(false)}>
                Keep editing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** Time input that always displays in HH:mm (24h) regardless of device locale. */
function TimeInput({
  value,
  timeFormat,
  onChange,
}: {
  value: string
  timeFormat: TimeFormat
  onChange: (v: string) => void
}) {
  if (timeFormat === '12h') {
    // Let the native picker display AM/PM as the user prefers
    return (
      <input
        type="time"
        className={styles.timeInput}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    )
  }

  // 24h mode: show the formatted time as visible text, overlay an invisible
  // native input so the user still gets the native time picker wheel.
  return (
    <div className={styles.timeInputWrapper}>
      <span className={styles.timeInputDisplay}>{fmt24(value)}</span>
      <input
        type="time"
        className={styles.timeInputHidden}
        value={value}
        onChange={e => onChange(e.target.value)}
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  )
}
