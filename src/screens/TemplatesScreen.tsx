import { useState, useEffect, useRef } from 'react'
import type { DayTemplate, PomodoroType } from '../types'
import { TemplateLibrary } from './TemplateLibrary'
import { TemplateBuilder } from './TemplateBuilder'
import styles from './TemplatesScreen.module.css'
import type { TimeFormat } from '../hooks/useSettings'

interface Props {
  templates: DayTemplate[]
  activeTemplateId: string | null
  onActivate: (id: string) => void
  onDeactivate: () => void
  onSaveTemplate: (template: DayTemplate) => void
  onDeleteTemplate: (id: string) => void
  timeFormat: TimeFormat
  onRegisterLeaveHandler?: (fn: (proceed: () => void) => void) => void
}

export function TemplatesScreen({ templates, activeTemplateId, onActivate, onDeactivate, onSaveTemplate, onDeleteTemplate, timeFormat, onRegisterLeaveHandler }: Props) {
  const [editing, setEditing] = useState<DayTemplate | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [showTypePicker, setShowTypePicker] = useState(false)
  const [pendingLeave, setPendingLeave] = useState<(() => void) | null>(null)
  const editingRef = useRef(editing)
  useEffect(() => { editingRef.current = editing }, [editing])

  useEffect(() => {
    onRegisterLeaveHandler?.((proceed) => {
      if (editingRef.current) {
        setPendingLeave(() => proceed)
      } else {
        proceed()
      }
    })
  }, [onRegisterLeaveHandler])

  function handleNew() {
    setShowTypePicker(true)
  }

  function handlePickType(type: PomodoroType) {
    setShowTypePicker(false)
    setEditing({ id: Date.now().toString(), label: 'New Template', blocks: [], pomodoroType: type })
    setIsNew(true)
  }

  function handleEdit(template: DayTemplate) {
    setEditing(template)
    setIsNew(false)
  }

  function handleSave(template: DayTemplate) {
    onSaveTemplate(template)
    setEditing(null)
  }

  function handleDelete(id: string) {
    onDeleteTemplate(id)
    setEditing(null)
  }

  if (editing) {
    return (
      <TemplateBuilder
        template={editing}
        timeFormat={timeFormat}
        onSave={handleSave}
        onCancel={() => setEditing(null)}
        onDelete={isNew ? undefined : handleDelete}
        pendingNavAway={pendingLeave}
        onClearPendingNavAway={() => setPendingLeave(null)}
      />
    )
  }

  return (
    <>
      <TemplateLibrary
        templates={templates}
        activeTemplateId={activeTemplateId}
        timeFormat={timeFormat}
        onNew={handleNew}
        onEdit={handleEdit}
        onActivate={onActivate}
        onDeactivate={onDeactivate}
      />
      {showTypePicker && (
        <div className={styles.typeOverlay}>
          <div className={styles.typeSheet}>
            <p className={styles.typeTitle}>Choose Pomodoro type</p>
            <p className={styles.typeDesc}>This setting is locked once the plan is created.</p>
            <div className={styles.typeOptions}>
              <button className={`${styles.typeOption} ${styles.typeOptionAdaptive}`} onClick={() => handlePickType('adaptive')}>
                Adaptive
                <span className={styles.typeOptionSub}>Switch between Standard (25/5) and Comfort (20/10) during your session</span>
              </button>
              <button className={styles.typeOption} onClick={() => handlePickType('classic')}>
                Classic
                <span className={styles.typeOptionSub}>Fixed 20-minute focus with 5-minute break — no mode switching</span>
              </button>
            </div>
            <button className={styles.typeCancel} onClick={() => setShowTypePicker(false)}>Cancel</button>
          </div>
        </div>
      )}
    </>
  )
}
