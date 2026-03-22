import { usePomodoroTimer } from './hooks/usePomodoroTimer'
import { ModeSidebar } from './components/ModeSidebar'
import { PomodoroTimer } from './components/PomodoroTimer'
import styles from './App.module.css'

function App() {
  const {
    mode, phase, elapsedSeconds, phaseDurationSeconds,
    isRunning, start, pause, resume, reset, skip, goToPhase, selectMode,
  } = usePomodoroTimer()

  const started = elapsedSeconds > 0 || isRunning

  return (
    <div className={styles.layout}>
      <ModeSidebar
        mode={mode}
        onSelect={selectMode}
        disabled={started}
      />
      <main className={styles.main}>
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
        />
      </main>
    </div>
  )
}

export default App
