import type { DayTemplate, FocusBlock } from '../types'
import type { TimeFormat } from '../hooks/useSettings'
import { formatDisplayTime } from '../utils/timeblock'
import styles from './TemplateLibrary.module.css'

function totalPomodoros(template: DayTemplate): number {
  return template.blocks
    .filter((b): b is FocusBlock => b.type === 'focus')
    .reduce((sum, b) => sum + b.pomodoroCount, 0)
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
                <p className={styles.cardMeta}>
                  {t.blocks.length} {t.blocks.length === 1 ? 'block' : 'blocks'}
                  {' · '}
                  {totalPomodoros(t)} Pomodoros
                </p>
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
