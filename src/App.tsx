import { useState, useEffect, useRef } from 'react'
import { BottomNav } from './components/BottomNav'
import type { AppView } from './components/BottomNav'
import { PomodoroTimer } from './components/PomodoroTimer'
import { usePomodoroTimer } from './hooks/usePomodoroTimer'
import { RunScreen } from './screens/RunScreen'
import { TemplatesScreen } from './screens/TemplatesScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { useSettings } from './hooks/useSettings'
import { useWakeLock } from './hooks/useWakeLock'
import type { DayTemplate } from './types'
import { DEFAULT_DAY_TEMPLATE } from './defaults/schedule'
import { CLASSIC_POMODORO_FOCUS_DURATION, CLASSIC_POMODORO_BREAK_DURATION } from './constants/timer'
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
  const templatesLeaveRef = useRef<((proceed: () => void) => void) | null>(null)

  function handleNavChange(newView: AppView) {
    if (view === 'templates' && newView !== 'templates' && templatesLeaveRef.current) {
      templatesLeaveRef.current(() => setView(newView))
    } else {
      setView(newView)
    }
  }
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null)
  const [templates, setTemplates] = useState<DayTemplate[]>(loadTemplates)
  const { settings, update: updateSettings } = useSettings()

  useEffect(() => {
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates))
  }, [templates])

  // Standalone timer — always alive so it keeps running when switching tabs.
  const timer = usePomodoroTimer(
    settings.pomodoroType === 'classic' ? 'standard' : settings.defaultMode,
    {
      customFocusDuration: settings.pomodoroType === 'classic' ? CLASSIC_POMODORO_FOCUS_DURATION : undefined,
      customBreakDuration: settings.pomodoroType === 'classic' ? CLASSIC_POMODORO_BREAK_DURATION : undefined,
    },
  )
  const timerStarted = timer.hasStarted

  const activeTemplate = activeTemplateId
    ? (templates.find(t => t.id === activeTemplateId) ?? null)
    : null

  useWakeLock(timer.isRunning && settings.keepScreenOn && !activeTemplate)

  function handleActivate(id: string) {
    setActiveTemplateId(id)
    setView('run')
  }

  function handleSaveTemplate(template: DayTemplate) {
    setTemplates(prev =>
      prev.some(t => t.id === template.id)
        ? prev.map(t => t.id === template.id ? template : t)
        : [...prev, template]
    )
  }

  function handleDeleteTemplate(id: string) {
    if (activeTemplateId === id) setActiveTemplateId(null)
    setTemplates(prev => prev.filter(t => t.id !== id))
  }

  return (
    <>
      <div className={styles.layout}>
        <main className={`${styles.content} ${view === 'run' && !activeTemplate ? styles.contentCentered : ''}`}>
          {view === 'run' && !activeTemplate && (
            <PomodoroTimer
              pomodoroType={settings.pomodoroType}
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
              keepScreenOn={settings.keepScreenOn}
              timeFormat={settings.timeFormat}
              pomodoroType={activeTemplate.pomodoroType ?? 'adaptive'}
              defaultMode={settings.defaultMode}
              onDeactivate={() => setActiveTemplateId(null)}
            />
          )}
          {view === 'templates' && (
            <TemplatesScreen
              templates={templates}
              activeTemplateId={activeTemplateId}
              onActivate={handleActivate}
              onDeactivate={() => setActiveTemplateId(null)}
              onSaveTemplate={handleSaveTemplate}
              onDeleteTemplate={handleDeleteTemplate}
              timeFormat={settings.timeFormat}
              onRegisterLeaveHandler={fn => { templatesLeaveRef.current = fn }}
            />
          )}
          {view === 'settings' && (
            <SettingsScreen
              settings={settings}
              onUpdate={updateSettings}
            />
          )}
        </main>
      </div>
      {/* Nav is outside the layout so position:fixed reaches the real viewport bottom,
          unaffected by the layout's overflow:hidden */}
      <BottomNav active={view} onChange={handleNavChange} />
    </>
  )
}

export default App
