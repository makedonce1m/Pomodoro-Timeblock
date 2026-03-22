import { useState } from 'react'
import { BottomNav } from './components/BottomNav'
import type { AppView } from './components/BottomNav'
import { RunScreen } from './screens/RunScreen'
import { TemplatesScreen } from './screens/TemplatesScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { useSettings } from './hooks/useSettings'
import type { DayTemplate } from './types'
import { DEFAULT_DAY_TEMPLATE } from './defaults/schedule'
import styles from './App.module.css'

const TEMPLATES_KEY = 'pomodoro-templates'

function loadTemplates(): DayTemplate[] {
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY)
    if (raw) return JSON.parse(raw) as DayTemplate[]
  } catch {}
  return [DEFAULT_DAY_TEMPLATE]
}

function App() {
  const [view, setView] = useState<AppView>('run')
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null)
  const { settings, update: updateSettings } = useSettings()

  // Resolve the active template from localStorage on demand.
  const activeTemplate = activeTemplateId
    ? (loadTemplates().find(t => t.id === activeTemplateId) ?? null)
    : null

  function handleActivate(id: string) {
    setActiveTemplateId(id)
    setView('run')
  }

  return (
    <div className={styles.layout}>
      <main className={`${styles.content} ${view === 'run' ? styles.contentRun : ''}`}>
        {view === 'run' && (
          <RunScreen
            template={activeTemplate}
            templates={loadTemplates()}
            autoContinue={settings.autoContinue}
            onActivate={handleActivate}
            onDeactivate={() => setActiveTemplateId(null)}
          />
        )}
        {view === 'templates' && (
          <TemplatesScreen
            activeTemplateId={activeTemplateId}
            onActivate={handleActivate}
          />
        )}
        {view === 'settings' && (
          <SettingsScreen
            settings={settings}
            onUpdate={updateSettings}
          />
        )}
      </main>
      <BottomNav active={view} onChange={setView} />
    </div>
  )
}

export default App
