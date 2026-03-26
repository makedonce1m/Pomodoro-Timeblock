import { useState, useEffect, useRef, useLayoutEffect } from 'react'
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

/** Migrate a single saved template from the old startTime/endTime-per-block format to durationMins. */
function migrateTemplate(raw: unknown): DayTemplate {
  const t = raw as Record<string, unknown>
  const rawBlocks = ((t.blocks as unknown[]) ?? []) as Record<string, unknown>[]

  const toMins = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number)
    return h * 60 + m
  }

  const blocks = rawBlocks.map(b => {
    // Already in new format
    if (typeof b.durationMins === 'number') return b as unknown as import('./types').TimeBlock
    const durationMins = toMins(b.endTime as string) - toMins(b.startTime as string)
    if (b.type === 'focus') {
      return {
        type: 'focus' as const,
        id: b.id as string,
        label: b.label as string,
        durationMins,
        pomodoroCount: Math.max(1, Math.floor(durationMins / 30)),
      }
    }
    return {
      type: 'long-break' as const,
      id: b.id as string,
      label: b.label as string,
      durationMins,
    }
  })

  // Use template-level startTime if present, otherwise fall back to first block's old startTime
  const startTime =
    typeof t.startTime === 'string'
      ? t.startTime
      : (rawBlocks[0] && typeof rawBlocks[0].startTime === 'string' ? rawBlocks[0].startTime as string : '09:00')

  return {
    id: t.id as string,
    label: t.label as string,
    startTime,
    blocks,
    pomodoroType: t.pomodoroType as import('./types').PomodoroType | undefined,
  }
}

function loadTemplates(): DayTemplate[] {
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as unknown[]
      return parsed.map(migrateTemplate)
    }
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

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = settings.theme ?? 'dark'
  }, [settings.theme])

  useLayoutEffect(() => {
    if (settings.accentColor && settings.accentColor !== 'amber') {
      document.documentElement.dataset.accent = settings.accentColor
    } else {
      delete document.documentElement.dataset.accent
    }
  }, [settings.accentColor])

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
              onReset={() => timer.reset(timer.phase)}
              onSkip={timer.skip}
              onGoToPhase={timer.goToPhase}
              onSelectMode={timer.selectMode}
              onSwitchMode={timer.switchMode}
            />
          )}
          {/* Keep RunScreen mounted while a plan is active so session state (incl. isDone) survives tab switches */}
          {activeTemplate && (
            <div style={view !== 'run' ? { display: 'none' } : undefined}>
              <RunScreen
                template={activeTemplate}
                autoContinue={settings.autoContinue}
                keepScreenOn={settings.keepScreenOn}
                timeFormat={settings.timeFormat}
                pomodoroType={activeTemplate.pomodoroType ?? 'adaptive'}
                defaultMode={settings.defaultMode}
                onDeactivate={() => setActiveTemplateId(null)}
              />
            </div>
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
