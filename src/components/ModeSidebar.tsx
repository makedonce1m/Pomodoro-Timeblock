import type { PomodoroMode } from '../types'
import styles from './ModeSidebar.module.css'

interface Props {
  mode: PomodoroMode
  onSelect: (mode: PomodoroMode) => void
  disabled: boolean
}

export function ModeSidebar({ mode, onSelect, disabled }: Props) {
  return (
    <aside className={styles.sidebar}>
      <p className={styles.heading}>Modes</p>
      <p className={styles.subheading}>Select your pace</p>

      <div className={styles.list}>
        <button
          className={`${styles.item} ${mode === 'standard' ? styles.itemActive : ''}`}
          onClick={() => onSelect('standard')}
          disabled={disabled}
          aria-pressed={mode === 'standard'}
        >
          <span className={styles.icon}>⏱</span>
          <span className={styles.label}>Standard</span>
        </button>

        <button
          className={`${styles.item} ${mode === 'comfort' ? styles.itemActive : ''}`}
          onClick={() => onSelect('comfort')}
          disabled={disabled}
          aria-pressed={mode === 'comfort'}
        >
          <span className={styles.icon}>🍃</span>
          <span className={styles.label}>Comfort</span>
        </button>
      </div>
    </aside>
  )
}
