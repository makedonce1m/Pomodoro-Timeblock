import type { AppSettings } from '../hooks/useSettings'
import styles from './SettingsScreen.module.css'

interface Props {
  settings: AppSettings
  onUpdate: (patch: Partial<AppSettings>) => void
}

export function SettingsScreen({ settings, onUpdate }: Props) {
  return (
    <div className={styles.screen}>
      <h1 className={styles.title}>Settings</h1>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Session</h2>

        <label className={styles.row}>
          <div className={styles.rowInfo}>
            <span className={styles.rowLabel}>Auto-continue</span>
            <span className={styles.rowDesc}>
              Automatically advance from focus → break → next Pomodoro → next block without tapping Continue.
            </span>
          </div>
          <button
            role="switch"
            aria-checked={settings.autoContinue}
            className={`${styles.toggle} ${settings.autoContinue ? styles.toggleOn : ''}`}
            onClick={() => onUpdate({ autoContinue: !settings.autoContinue })}
          >
            <span className={styles.toggleThumb} />
          </button>
        </label>

        <label className={styles.row}>
          <div className={styles.rowInfo}>
            <span className={styles.rowLabel}>Keep screen on</span>
            <span className={styles.rowDesc}>
              Prevent the screen from sleeping while the timer is running.
            </span>
          </div>
          <button
            role="switch"
            aria-checked={settings.keepScreenOn}
            className={`${styles.toggle} ${settings.keepScreenOn ? styles.toggleOn : ''}`}
            onClick={() => onUpdate({ keepScreenOn: !settings.keepScreenOn })}
          >
            <span className={styles.toggleThumb} />
          </button>
        </label>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Display</h2>

        <div className={styles.row}>
          <div className={styles.rowInfo}>
            <span className={styles.rowLabel}>Time format</span>
            <span className={styles.rowDesc}>Choose how times appear throughout the app.</span>
          </div>
          <div className={styles.segmented}>
            <button
              className={`${styles.seg} ${settings.timeFormat === '24h' ? styles.segActive : ''}`}
              onClick={() => onUpdate({ timeFormat: '24h' })}
            >24h</button>
            <button
              className={`${styles.seg} ${settings.timeFormat === '12h' ? styles.segActive : ''}`}
              onClick={() => onUpdate({ timeFormat: '12h' })}
            >AM/PM</button>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Timer</h2>

        <div className={styles.row}>
          <div className={styles.rowInfo}>
            <span className={styles.rowLabel}>Pomodoro type</span>
            <span className={styles.rowDesc}>
              Classic: 20 min focus / 5 min break.{' '}
              Adaptive: choose between Standard (25/5) and Comfort (20/10).
            </span>
          </div>
          <div className={styles.segmented}>
            <button
              className={`${styles.seg} ${settings.pomodoroType === 'classic' ? styles.segActive : ''}`}
              onClick={() => onUpdate({ pomodoroType: 'classic' })}
            >Classic</button>
            <button
              className={`${styles.seg} ${settings.pomodoroType === 'adaptive' ? styles.segActive : ''}`}
              onClick={() => onUpdate({ pomodoroType: 'adaptive' })}
            >Adaptive</button>
          </div>
        </div>

        {settings.pomodoroType === 'adaptive' && (
          <div className={styles.row}>
            <div className={styles.rowInfo}>
              <span className={styles.rowLabel}>Default mode</span>
              <span className={styles.rowDesc}>
                Standard: 25 min focus / 5 min break.{' '}
                Comfort: 20 min focus / 10 min break (includes bathroom break).
              </span>
            </div>
            <div className={styles.segmented}>
              <button
                className={`${styles.seg} ${settings.defaultMode === 'standard' ? styles.segActive : ''}`}
                onClick={() => onUpdate({ defaultMode: 'standard' })}
              >Standard</button>
              <button
                className={`${styles.seg} ${settings.defaultMode === 'comfort' ? styles.segActive : ''}`}
                onClick={() => onUpdate({ defaultMode: 'comfort' })}
              >Comfort</button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
