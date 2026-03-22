let ctx: AudioContext | null = null

async function getCtx(): Promise<AudioContext> {
  if (!ctx) ctx = new AudioContext()
  // iOS suspends AudioContext until a user gesture — resume before every use
  if (ctx.state === 'suspended') {
    try { await ctx.resume() } catch { /* best-effort */ }
  }
  return ctx
}

/**
 * Plays a single bird-like chirp: a quick frequency sweep upward with
 * a soft vibrato, shaped by an amplitude envelope.
 */
function chirp(
  audioCtx: AudioContext,
  startTime: number,
  freqStart: number,
  freqPeak: number,
  freqEnd: number,
  duration: number,
  gain: number,
) {
  const osc = audioCtx.createOscillator()
  const gainNode = audioCtx.createGain()

  // Vibrato LFO
  const lfo = audioCtx.createOscillator()
  const lfoGain = audioCtx.createGain()
  lfo.frequency.setValueAtTime(18, startTime)
  lfoGain.gain.setValueAtTime(freqStart * 0.04, startTime)
  lfo.connect(lfoGain)
  lfoGain.connect(osc.frequency)

  osc.connect(gainNode)
  gainNode.connect(audioCtx.destination)

  osc.type = 'sine'
  osc.frequency.setValueAtTime(freqStart, startTime)
  osc.frequency.exponentialRampToValueAtTime(freqPeak, startTime + duration * 0.4)
  osc.frequency.exponentialRampToValueAtTime(freqEnd, startTime + duration)

  // Amplitude envelope: quick attack, hold, fast decay
  gainNode.gain.setValueAtTime(0.001, startTime)
  gainNode.gain.linearRampToValueAtTime(gain, startTime + duration * 0.15)
  gainNode.gain.setValueAtTime(gain, startTime + duration * 0.6)
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration)

  lfo.start(startTime)
  lfo.stop(startTime + duration)
  osc.start(startTime)
  osc.stop(startTime + duration)
}

/**
 * Soft descending bird song — played when focus ends and break starts.
 * Feels like a gentle "wind down" call.
 */
export async function playFocusEndSound() {
  const audioCtx = await getCtx()
  const now = audioCtx.currentTime
  // 5 chirps, descending in pitch, spaced ~0.55s apart over ~3s; last two fade out
  chirp(audioCtx, now + 0.0,  2800, 3400, 2600, 0.35, 0.18)
  chirp(audioCtx, now + 0.55, 2400, 2900, 2200, 0.35, 0.16)
  chirp(audioCtx, now + 1.1,  2000, 2500, 1850, 0.38, 0.15)
  chirp(audioCtx, now + 1.7,  1700, 2100, 1600, 0.50, 0.08)
  chirp(audioCtx, now + 2.35, 1500, 1800, 1400, 0.60, 0.04)
}

/**
 * Bright ascending bird song — played when break ends and focus starts.
 * Feels like an energetic morning call.
 */
export async function playBreakEndSound() {
  const audioCtx = await getCtx()
  const now = audioCtx.currentTime
  // 5 chirps, ascending in pitch, spaced ~0.55s apart over ~3s; last two fade out
  chirp(audioCtx, now + 0.0,  1400, 1700, 1500, 0.30, 0.12)
  chirp(audioCtx, now + 0.5,  1700, 2100, 1900, 0.32, 0.14)
  chirp(audioCtx, now + 1.05, 2000, 2500, 2200, 0.35, 0.16)
  chirp(audioCtx, now + 1.65, 2400, 3000, 2700, 0.50, 0.08)
  chirp(audioCtx, now + 2.3,  2800, 3500, 3200, 0.60, 0.04)
}

/**
 * Two quick chirps — played when skip is pressed.
 */
export async function playSkipSound() {
  const audioCtx = await getCtx()
  const now = audioCtx.currentTime
  chirp(audioCtx, now + 0.0,  2200, 2800, 2400, 0.18, 0.15)
  chirp(audioCtx, now + 0.25, 2400, 3000, 2600, 0.18, 0.15)
}
