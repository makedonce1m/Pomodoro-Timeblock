import styles from './PlaceholderScreen.module.css'

export function TemplatesScreen() {
  return (
    <div className={styles.screen}>
      <p className={styles.label}>Templates</p>
      <p className={styles.hint}>Day templates will live here.</p>
    </div>
  )
}
