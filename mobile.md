# Mobile Migration Plan — Pomodoro Timeblock

This document covers the plan for building the iOS + Android version of Pomodoro Timeblock using **Expo (React Native)**. One codebase, both platforms.

---

## The Logic — What's Already Built

The current web app contains all the core logic of the application. This is the brain — it has nothing to do with how things look, only how they work. It lives in `src/hooks/`, `src/constants/`, `src/types/`, and `src/utils/`.

---

### Types (`src/types/index.ts`)

Defines the data shapes the entire app is built around. Carries over to mobile **unchanged**.

- **`PomodoroMode`** — `'standard'` or `'comfort'`. Determines focus/break durations.
- **`PomodoroType`** — `'classic'` or `'adaptive'`. Classic is a fixed 20/5 split. Adaptive uses Standard or Comfort modes.
- **`FocusBlock`** — A named, scheduled work session with a start time, end time, and a calculated pomodoro count. Example: "Deep Work 09:00–11:00" = 4 pomodoros.
- **`LongBreakBlock`** — A named rest block with a start and end time. No pomodoros, just a countdown.
- **`TimeBlock`** — Either a FocusBlock or a LongBreakBlock.
- **`DayTemplate`** — A full day plan: a name, an ordered list of TimeBlocks, and a locked PomodoroType.

---

### Constants (`src/constants/timer.ts`)

All durations are defined here as named constants. Never hardcoded anywhere else.

| Constant | Value | Meaning |
|---|---|---|
| `POMODORO_FOCUS_DURATION.standard` | 1500s (25 min) | Standard mode focus |
| `POMODORO_FOCUS_DURATION.comfort` | 1200s (20 min) | Comfort mode focus |
| `POMODORO_BREAK_DURATION.standard` | 300s (5 min) | Standard mode break |
| `POMODORO_BREAK_DURATION.comfort` | 600s (10 min) | Comfort mode break — intentionally long to cover a bathroom break |
| `CLASSIC_POMODORO_FOCUS_DURATION` | 1200s (20 min) | Classic type, fixed |
| `CLASSIC_POMODORO_BREAK_DURATION` | 300s (5 min) | Classic type, fixed |
| `CLOSING_INTERVAL_DURATION` | 1800s (30 min) | Last pomodoro of a block — pure focus, no break |
| `MODE_SWITCH_CUTOFF_SECONDS` | 1190s (19:50) | Latest point at which the user can switch modes mid-session |

---

### Utilities (`src/utils/`)

Pure functions. No web APIs, no state. Carry over **unchanged**.

**`timeblock.ts`**
- `formatDisplayTime(hhmm, format)` — Converts a stored `HH:mm` string to 12h or 24h display format.
- `calcPomodoroCount(startTime, endTime)` — Given two `HH:mm` strings, calculates how many 30-minute pomodoros fit in that range.
- `addMinutes(time, minutes)` — Adds minutes to an `HH:mm` string, returns `HH:mm`.

**`pomodoroMode.ts`**
- `canSwitchMode(phase, elapsedSeconds)` — Returns `true` only if the timer is in the focus phase and elapsed time is below the cutoff (19:50). This enforces the rule that mode switching is only allowed early in a focus session.

---

### Hook: `usePomodoroTimer` (`src/hooks/usePomodoroTimer.ts`)

This is the low-level timer. It knows nothing about sessions, blocks, or templates — it just runs a single pomodoro (focus + break cycle).

**What it does:**
- Tracks elapsed time using `Date.now()` (wall clock), not just frame counting. This makes it drift-resistant — if the phone is backgrounded, time keeps counting correctly.
- Manages two phases: `focus` and `break`.
- Handles start, pause, resume, reset, skip, and phase transitions.
- Auto-advances from focus → break → focus when a phase completes (configurable).
- Supports custom phase durations (used by the session layer for closing intervals and long-break blocks).
- Supports mid-session mode switching: the user can switch between Standard and Comfort while the timer is running, but only during focus and only before the 19:50 cutoff. Elapsed time is preserved on switch.
- Fires an `onPhaseComplete` callback when a phase ends, so the session layer can react.

**Web API used (needs replacing for mobile):**
- `requestAnimationFrame` — used for smooth UI updates. Replace with `setInterval` or React Native's animation loop.
- `visibilitychange` event — detects when the app is backgrounded/foregrounded to restart the animation loop. Replace with React Native's `AppState`.

---

### Hook: `useSession` (`src/hooks/useSession.ts`)

This is the high-level session orchestrator. It sits on top of `usePomodoroTimer` and manages the full day's progression through a template.

**What it does:**
- Takes a `DayTemplate` and walks through its blocks in order.
- Tracks `blockIndex` (which block you're on) and `pomodoroIndex` (which pomodoro within that block).
- Derives the current session phase: `idle`, `focus`, `short-break`, `long-break`, `block-done`, or `done`.
- Handles the closing interval: the last pomodoro of any focus block runs for 30 minutes with no trailing break.
- Handles long-break blocks: the entire block duration is treated as a single "focus" phase (just a countdown, no break after).
- Supports `autoContinue` mode: when on, transitions happen automatically. When off, the user must press Continue at each step.
- Exposes `jumpToPomodoro(index)` so the user can tap a progress dot to navigate within the current block.
- Resets cleanly when the template changes.

**Nothing to replace for mobile** — this hook uses only React state and refs.

---

### Hook: `useSettings` (`src/hooks/useSettings.ts`)

Manages user preferences and persists them across app restarts.

**Settings stored:**
- `autoContinue` — Whether transitions happen automatically or wait for the user.
- `keepScreenOn` — Whether to prevent the screen from sleeping during a session.
- `timeFormat` — `'24h'` or `'12h'` for displaying block times.
- `pomodoroType` — `'classic'` or `'adaptive'`.
- `defaultMode` — `'standard'` or `'comfort'` (used when starting an adaptive session).

**Web API used (needs replacing for mobile):**
- `localStorage` — Replace with `@react-native-async-storage/async-storage`. The logic stays identical, only the read/write calls change.

---

### Hook: `useWakeLock` (`src/hooks/useWakeLock.ts`)

Prevents the screen from going to sleep while a session is active. Controlled by the `keepScreenOn` setting.

**What it does:**
- Requests a Screen Wake Lock when `active` is true.
- Re-acquires the lock automatically if the app returns to the foreground (the browser releases it when the page is hidden).
- Silently does nothing on unsupported browsers.

**Web API used (needs replacing for mobile):**
- `navigator.wakeLock` (Screen Wake Lock API) — Replace with `expo-keep-awake`. The hook becomes a one-liner: `useKeepAwake()` when active.

---

### Default Template (`src/defaults/schedule.ts`)

A pre-loaded example template shown to new users. Carries over **unchanged**.

```
08:30 – 10:30  Study Block 1   (4 Pomodoros)
10:30 – 11:00  Long Break      (30 min)
11:00 – 12:00  Study Block 2   (2 Pomodoros)
12:00 – 13:00  Lunch Break     (60 min)
13:00 – 15:00  Study Block 3   (4 Pomodoros)
```

---

### Sound (`src/utils/sound.ts`)

Synthesizes bird-like chirp sounds using the Web Audio API. Three sounds:

- `playFocusEndSound()` — 5 descending chirps. Plays when focus ends and break starts. Feels like a gentle wind-down.
- `playBreakEndSound()` — 5 ascending chirps. Plays when break ends and focus starts. Feels like an energetic call.
- `playSkipSound()` — 2 quick chirps. Plays when the user skips.

**Web API used (needs replacing for mobile):**
- `AudioContext` (Web Audio API) — This is browser-only and cannot run in React Native. The sounds will need to be pre-recorded as audio files (`.mp3` or `.wav`) and played with `expo-audio`. The synthesized chirps should be recorded from the web app first so the sound design is preserved.

---

## Pomodoro Modes — Full Breakdown

There are two layers here that are easy to conflate: **PomodoroType** (set per template) and **PomodoroMode** (the Standard/Comfort choice within Adaptive). They interact, but they are separate.

---

### PomodoroType: `'adaptive'` vs `'classic'`

Set on the `DayTemplate` and locked for the duration of a session. Cannot be changed mid-session.

**Adaptive** — the default. The user chooses Standard or Comfort mode, and can switch between them during a session (see rules below). The timer uses `POMODORO_FOCUS_DURATION[mode]` and `POMODORO_BREAK_DURATION[mode]` from the constants, keyed by the active mode.

**Classic** — a simpler, fixed variant. `useSession` passes `customFocusDuration = 1200s` and `customBreakDuration = 300s` directly to `usePomodoroTimer`, bypassing the mode system entirely. Internally the timer is initialised with `mode = 'standard'` but that value is irrelevant — the custom overrides take precedence and mode switching (`switchMode`, `selectMode`) has no effect. Classic always runs 20 min focus / 5 min break, no exceptions.

---

### PomodoroMode: `'standard'` vs `'comfort'` (Adaptive only)

Only meaningful when `PomodoroType` is `'adaptive'`.

| Mode | Focus | Break | Total | Intent |
|---|---|---|---|---|
| **Standard** | 25 min | 5 min | 30 min | Default work mode |
| **Comfort** | 20 min | 10 min | 30 min | Break long enough to cover a bathroom stop alongside normal rest |

The Comfort break is **intentionally 10 minutes**. Do not shorten it.

Both modes produce a 30-minute slot. This is the design constraint that makes Pomodoros slot cleanly into time blocks.

---

### Mid-Session Mode Switching (Adaptive only)

While a Pomodoro is running, the user can switch between Standard and Comfort without stopping the timer. All of the following must be true for a switch to be allowed:

1. `PomodoroType` is `'adaptive'` (Classic ignores this entirely)
2. Current phase is `'focus'` (switching during a break is not allowed)
3. Elapsed focus time is **below `MODE_SWITCH_CUTOFF_SECONDS` (1190s = 19:50)**

The cutoff exists because Comfort focus is 20 min. Switching at 19:51 would mean the focus phase ends in 9 seconds — meaningless. The 10-second buffer ensures meaningful time remains regardless of which mode you switch to.

**How it works in the code:**

- `canSwitchMode(phase, elapsedSeconds)` — the pure gate function. Returns `true` only when both conditions above are met. Used to derive `canSwitch` in the timer state and to guard the `switchMode` action itself.
- `switchMode()` — toggles `standard` ↔ `comfort` while the timer keeps running. Elapsed time is preserved exactly. The wall-clock anchor (`runStartWallTime`) is reset to `Date.now()` so future ticks measure from the correct base.
- `selectMode(mode)` — a separate action for pre-session mode selection (before the timer has started). It is blocked once the timer is running or has elapsed time. This is the settings-screen or pre-start picker path, not the in-session toggle.

**UI requirement:** The switch button must be disabled (not hidden) when `canSwitch` is `false`. It is visible throughout focus and break phases so the user knows it exists, but grayed out when switching is not permitted.

---

## What Carries Over Unchanged

| File | Status |
|---|---|
| `src/types/index.ts` | ✅ Copy as-is |
| `src/constants/timer.ts` | ✅ Copy as-is |
| `src/utils/timeblock.ts` | ✅ Copy as-is |
| `src/utils/pomodoroMode.ts` | ✅ Copy as-is |
| `src/hooks/useSession.ts` | ✅ Copy as-is |
| `src/defaults/schedule.ts` | ✅ Copy as-is |

## What Needs Small Changes

| File | Change needed |
|---|---|
| `src/hooks/usePomodoroTimer.ts` | Replace `requestAnimationFrame` → `setInterval`, replace `visibilitychange` → `AppState` |
| `src/hooks/useSettings.ts` | Replace `localStorage` → `AsyncStorage` |
| `src/hooks/useWakeLock.ts` | Replace `navigator.wakeLock` → `expo-keep-awake` |
| `src/utils/sound.ts` | Replace Web Audio API synthesis with `expo-audio` + pre-recorded files |

---

## Migration Phases

### Phase 1 — Foundation
- Create new GitHub repo (`Pomodoro-Timeblock-Mobile`)
- Scaffold Expo project (`npx create-expo-app@latest`)
- Copy over all logic files
- Apply the small API swaps above
- Validate everything compiles

### Phase 2 — Navigation Shell
- Set up Expo Router (file-based routing, built into Expo)
- Build the bottom navigation: Focus, Plans, Settings tabs
- Stub out the 3 screens with placeholder content

### Phase 3 — Screens (simplest to hardest)
1. **Settings screen** — toggles and pickers for all user preferences
2. **Templates/Plans screen** — list, create, and edit day templates with time blocks
3. **Run screen** — the active session UI (timer display, progress dots, phase transitions, swipe navigation)

### Phase 4 — Polish
- Integrate pre-recorded sounds with `expo-audio`
- Add `expo-keep-awake` for the "keep screen on" setting
- Test on iOS and Android via Expo Go
- Platform-specific tweaks (fonts, shadows, status bar)

---

## Home Setup Checklist

Before the first session, install the following:

- [ ] [Node.js LTS](https://nodejs.org)
- [ ] **Expo Go** on your phone (iOS App Store / Google Play)
- [ ] Run `npx create-expo-app@latest` to verify Expo works
- [ ] Create the new GitHub repo: `Pomodoro-Timeblock-Mobile`

No Xcode or Android Studio required for development and testing.
