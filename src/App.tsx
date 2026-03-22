import { useState } from 'react'
import { usePomodoroTimer } from './hooks/usePomodoroTimer'
import { PomodoroTimer } from './components/PomodoroTimer'
import { BottomNav } from './components/BottomNav'
import type { AppView } from './components/BottomNav'
import { TemplatesScreen } from './screens/TemplatesScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import styles from './App.module.css'

function App() {
  const [view, setView] = useState<AppView>('run')

  const {
    mode, phase, elapsedSeconds, phaseDurationSeconds,
    isRunning, canSwitch, start, pause, resume, reset, skip, goToPhase, selectMode, switchMode,
  } = usePomodoroTimer()

  const started = elapsedSeconds > 0 || isRunning

  return (
    <div className={styles.layout}>
      <main className={`${styles.content} ${view === 'run' ? styles.contentCentered : ''}`}>
        {view === 'run' && (
          <PomodoroTimer
            mode={mode}
            phase={phase}
            elapsedSeconds={elapsedSeconds}
            phaseDurationSeconds={phaseDurationSeconds}
            isRunning={isRunning}
            started={started}
            onStart={start}
            onPause={pause}
            onResume={resume}
            onReset={reset}
            onSkip={skip}
            onGoToPhase={goToPhase}
            onSelectMode={selectMode}
            onSwitchMode={switchMode}
            canSwitch={canSwitch}
          />
        )}
        {view === 'templates' && <TemplatesScreen />}
        {view === 'settings' && <SettingsScreen />}
      </main>
      <BottomNav active={view} onChange={setView} />
    </div>
  )
}

export default App
