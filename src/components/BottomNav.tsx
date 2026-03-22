import React from 'react'
import styles from './BottomNav.module.css'

export type AppView = 'run' | 'templates' | 'settings'

function IconRun() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
    </svg>
  )
}

function IconTemplates() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
      <path d="M3 3h8v8H3zm0 10h8v8H3zm10-10h8v8h-8zm0 10h8v8h-8z" />
    </svg>
  )
}

function IconSettings() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
      <path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a6.94 6.94 0 0 0-1.62-.94l-.36-2.54A.484.484 0 0 0 14 2h-4a.484.484 0 0 0-.48.41l-.36 2.54a7.3 7.3 0 0 0-1.62.94l-2.39-.96a.48.48 0 0 0-.59.22L2.74 8.87a.48.48 0 0 0 .12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.36 1.04.67 1.62.94l.36 2.54c.05.27.29.47.58.47h4c.29 0 .53-.2.57-.47l.36-2.54a7.3 7.3 0 0 0 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.47.47 0 0 0-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
    </svg>
  )
}

interface Props {
  active: AppView
  onChange: (view: AppView) => void
}

export function BottomNav({ active, onChange }: Props) {
  const tabs: { view: AppView; label: string; Icon: () => React.ReactElement }[] = [
    { view: 'run', label: 'Run', Icon: IconRun },
    { view: 'templates', label: 'Templates', Icon: IconTemplates },
    { view: 'settings', label: 'Settings', Icon: IconSettings },
  ]

  return (
    <nav className={styles.nav} aria-label="Main navigation">
      {tabs.map(({ view, label, Icon }) => (
        <button
          key={view}
          className={`${styles.tab} ${active === view ? styles.tabActive : ''}`}
          onClick={() => onChange(view)}
          aria-current={active === view ? 'page' : undefined}
        >
          <span className={styles.icon}><Icon /></span>
          <span className={styles.label}>{label}</span>
        </button>
      ))}
    </nav>
  )
}
