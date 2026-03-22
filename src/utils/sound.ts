let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  return ctx
}

function playTone(
  frequency: number,
  duration: number,
  gain: number,
  type: OscillatorType,
  startTime: number,
  audioCtx: AudioContext,
) {
  const osc = audioCtx.createOscillator()
  const gainNode = audioCtx.createGain()
  osc.connect(gainNode)
  gainNode.connect(audioCtx.destination)

  osc.type = type
  osc.frequency.setValueAtTime(frequency, startTime)

  gainNode.gain.setValueAtTime(gain, startTime)
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration)

  osc.start(startTime)
  osc.stop(startTime + duration)
}

/** Soft descending chime — played when focus ends and break starts. */
export function playFocusEndSound() {
  const audioCtx = getCtx()
  const now = audioCtx.currentTime
  playTone(880, 0.4, 0.3, 'sine', now, audioCtx)
  playTone(660, 0.4, 0.3, 'sine', now + 0.25, audioCtx)
  playTone(440, 0.6, 0.3, 'sine', now + 0.5, audioCtx)
}

/** Ascending tone — played when break ends and focus starts. */
export function playBreakEndSound() {
  const audioCtx = getCtx()
  const now = audioCtx.currentTime
  playTone(440, 0.3, 0.3, 'sine', now, audioCtx)
  playTone(660, 0.3, 0.3, 'sine', now + 0.2, audioCtx)
  playTone(880, 0.5, 0.3, 'sine', now + 0.4, audioCtx)
}

/** Short beep — played when skip is pressed. */
export function playSkipSound() {
  const audioCtx = getCtx()
  const now = audioCtx.currentTime
  playTone(600, 0.15, 0.2, 'square', now, audioCtx)
}
