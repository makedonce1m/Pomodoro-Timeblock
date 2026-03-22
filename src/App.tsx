import { useState } from 'react'
import { BottomNav } from './components/BottomNav'
import type { AppView } from './components/BottomNav'
import { PomodoroTimer } from './components/PomodoroTimer'
import { usePomodoroTimer } from './hooks/usePomodoroTimer'
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

  // Standalone timer — always alive so it keeps running when switching tabs.
  const timer = usePomodoroTimer()
  const timerStarted = timer.hasStarted

  const activeTemplate = activeTemplateId
    ? (loadTemplates().find(t => t.id === activeTemplateId) ?? null)
    : null

  function handleActivate(id: string) {
    setActiveTemplateId(id)
    setView('run')
  }

  return (
    <div className={styles.layout}>
      <main className={`${styles.content} ${view === 'run' && !activeTemplate ? styles.contentCentered : ''}`}>
        {view === 'run' && !activeTemplate && (
          <PomodoroTimer
            mode={timer.mode}
            phase={timer.phase}
            elapsedSeconds={timer.elapsedSeconds}
            phaseDurationSeconds={timer.phaseDurationSeconds}
            isRunning={timer.isRunning}
            started={timerStarted}
            canSwitch={timer.canSwitch}
            onStart={timer.start}
            onPause={timer.pause}
            onResume={timer.resume}
            onReset={timer.reset}
            onSkip={timer.skip}
            onGoToPhase={timer.goToPhase}
            onSelectMode={timer.selectMode}
            onSwitchMode={timer.switchMode}
          />
        )}
        {view === 'run' && activeTemplate && (
          <RunScreen
            template={activeTemplate}
            autoContinue={settings.autoContinue}
            timeFormat={settings.timeFormat}
            onDeactivate={() => setActiveTemplateId(null)}
          />
        )}
        {view === 'templates' && (
          <TemplatesScreen
            activeTemplateId={activeTemplateId}
            onActivate={handleActivate}
            timeFormat={settings.timeFormat}
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
