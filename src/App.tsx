import { usePomodoroTimer } from './hooks/usePomodoroTimer'
import { PomodoroTimer } from './components/PomodoroTimer'
import styles from './App.module.css'

function App() {
  const {
    mode, phase, elapsedSeconds, phaseDurationSeconds,
    isRunning, canSwitch, start, pause, resume, reset, skip, goToPhase, selectMode, switchMode,
  } = usePomodoroTimer()

  const started = elapsedSeconds > 0 || isRunning

  return (
    <div className={styles.layout}>
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
    </div>
  )
}

export default App
