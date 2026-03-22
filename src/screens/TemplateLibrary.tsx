import type { DayTemplate, FocusBlock } from '../types'
import styles from './TemplateLibrary.module.css'

function totalPomodoros(template: DayTemplate): number {
  return template.blocks
    .filter((b): b is FocusBlock => b.type === 'focus')
    .reduce((sum, b) => sum + b.pomodoroCount, 0)
}

interface Props {
  templates: DayTemplate[]
  onNew: () => void
  onEdit: (t: DayTemplate) => void
  onDelete: (id: string) => void
}

export function TemplateLibrary({ templates, onNew, onEdit, onDelete }: Props) {
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
        {templates.map(t => (
          <div key={t.id} className={styles.card} onClick={() => onEdit(t)} role="button" tabIndex={0}
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
                    {b.startTime}–{b.endTime}
                  </span>
                ))}
              </div>
            </div>
            <button
              className={styles.deleteButton}
              onClick={e => { e.stopPropagation(); onDelete(t.id) }}
              aria-label={`Delete ${t.label}`}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
