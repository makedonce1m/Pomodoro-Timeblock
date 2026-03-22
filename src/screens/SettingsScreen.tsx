import styles from './SettingsScreen.module.css'

export function SettingsScreen() {
  return (
    <div className={styles.screen}>
      <p className={styles.label}>Settings</p>
      <p className={styles.hint}>Timer and app settings will live here.</p>
    </div>
  )
}
