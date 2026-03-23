import { useState, useEffect } from 'react'
import type { DayTemplate } from '../types'
import { DEFAULT_DAY_TEMPLATE } from '../defaults/schedule'
import { TemplateLibrary } from './TemplateLibrary'
import { TemplateBuilder } from './TemplateBuilder'

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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
  }, [templates])

  function handleNew() {
    setEditing({ id: Date.now().toString(), label: 'New Template', blocks: [] })
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
    <TemplateLibrary
      templates={templates}
      activeTemplateId={activeTemplateId}
      timeFormat={timeFormat}
      onNew={handleNew}
      onEdit={handleEdit}
      onActivate={onActivate}
      onDeactivate={onDeactivate}
    />
  )
}
