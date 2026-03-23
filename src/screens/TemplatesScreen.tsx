import { useState, useEffect } from 'react'
import type { DayTemplate, PomodoroType } from '../types'
import { DEFAULT_DAY_TEMPLATE } from '../defaults/schedule'
import { TemplateLibrary } from './TemplateLibrary'
import { TemplateBuilder } from './TemplateBuilder'
import styles from './TemplatesScreen.module.css'

const STORAGE_KEY = 'pomodoro-templates'

function loadTemplates(): DayTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as DayTemplate[]
  } catch {}
  return [DEFAULT_DAY_TEMPLATE]
}

import type { TimeFormat } from '../hooks/useSettings'

interface Props {
  activeTemplateId: string | null
  onActivate: (id: string) => void
  onDeactivate: () => void
  timeFormat: TimeFormat
}

export function TemplatesScreen({ activeTemplateId, onActivate, onDeactivate, timeFormat }: Props) {
  const [templates, setTemplates] = useState<DayTemplate[]>(loadTemplates)
  const [editing, setEditing] = useState<DayTemplate | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [showTypePicker, setShowTypePicker] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
  }, [templates])

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
    setTemplates(prev =>
      isNew ? [...prev, template] : prev.map(t => t.id === template.id ? template : t)
    )
    setEditing(null)
  }

  function handleDelete(id: string) {
    setTemplates(prev => prev.filter(t => t.id !== id))
  }

  if (editing) {
    return (
      <TemplateBuilder
        template={editing}
        timeFormat={timeFormat}
        onSave={handleSave}
        onCancel={() => setEditing(null)}
        onDelete={isNew ? undefined : (id) => { handleDelete(id); setEditing(null) }}
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
              <button className={styles.typeOption} onClick={() => handlePickType('adaptive')}>
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
