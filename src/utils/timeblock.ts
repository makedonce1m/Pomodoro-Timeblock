/** Returns the number of 30-minute Pomodoros that fit in the given HH:mm range. */
export function calcPomodoroCount(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  const durationMin = (eh * 60 + em) - (sh * 60 + sm)
  return Math.max(0, Math.floor(durationMin / 30))
}

/** Adds minutes to an HH:mm string, returns HH:mm. */
export function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + minutes
  const hh = Math.floor(total / 60) % 24
  const mm = total % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}
