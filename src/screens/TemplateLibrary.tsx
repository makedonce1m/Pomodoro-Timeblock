import type { DayTemplate, FocusBlock } from '../types'
import type { TimeFormat } from '../hooks/useSettings'
import { formatDisplayTime } from '../utils/timeblock'
import styles from './TemplateLibrary.module.css'

function focusMinutes(template: DayTemplate): number {
  return template.blocks
    .filter((b): b is FocusBlock => b.type === 'focus')
    .reduce((sum, b) => {
      const [sh, sm] = b.startTime.split(':').map(Number)
      const [eh, em] = b.endTime.split(':').map(Number)
      return sum + (eh * 60 + em) - (sh * 60 + sm)
    }, 0)
}

function formatFocusTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min focus`
  if (m === 0) return `${h} h focus`
  return `${h} h ${m} min focus`
}

function daySpan(template: DayTemplate, timeFormat: TimeFormat): string | null {
  if (template.blocks.length === 0) return null
  const times = template.blocks.flatMap(b => [b.startTime, b.endTime])
  const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
  const earliest = times.reduce((a, b) => toMin(a) <= toMin(b) ? a : b)
  const latest = times.reduce((a, b) => toMin(a) >= toMin(b) ? a : b)
  return `${formatDisplayTime(earliest, timeFormat)}–${formatDisplayTime(latest, timeFormat)}`
}

interface Props {
  templates: DayTemplate[]
  activeTemplateId: string | null
  timeFormat: TimeFormat
  onNew: () => void
  onEdit: (t: DayTemplate) => void
  onActivate: (id: string) => void
}

export function TemplateLibrary({ templates, activeTemplateId, timeFormat, onNew, onEdit, onActivate }: Props) {
  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <h1 className={styles.title}>Templates</h1>
        <button className={styles.newButton} onClick={onNew}>+ New</button>
      </div>

      <div className={styles.list}>
        {templates.length === 0 && (
          <p className={styles.empty}>No templates yet. Tap + New to create one.</p>
        )}
        {templates.map(t => {
          const isActive = t.id === activeTemplateId
          const span = daySpan(t, timeFormat)
          const focus = focusMinutes(t)
          return (
            <div
              key={t.id}
              className={`${styles.card} ${isActive ? styles.cardActive : ''}`}
              onClick={() => onEdit(t)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && onEdit(t)}
            >
              <div className={styles.cardBody}>
                <p className={styles.cardName}>{t.label}</p>
                {(span || focus > 0) && (
                  <p className={styles.cardMeta}>
                    {span}
                    {span && focus > 0 && ' · '}
                    {focus > 0 && formatFocusTime(focus)}
                  </p>
                )}
                <div className={styles.blockPills}>
                  {t.blocks.map(b => (
                    <span
                      key={b.id}
                      className={`${styles.pill} ${b.type === 'focus' ? styles.pillFocus : styles.pillBreak}`}
                    >
                      {formatDisplayTime(b.startTime, timeFormat)}–{formatDisplayTime(b.endTime, timeFormat)}
                    </span>
                  ))}
                </div>
              </div>
              <div className={styles.cardActions}>
                <button
                  className={`${styles.runButton} ${isActive ? styles.runButtonActive : ''}`}
                  onClick={e => { e.stopPropagation(); onActivate(t.id) }}
                  aria-label={`${isActive ? 'Active' : 'Run'} ${t.label}`}
                  title={isActive ? 'Active in Run tab' : 'Set as active in Run tab'}
                >
                  {isActive ? '●' : '▶'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
