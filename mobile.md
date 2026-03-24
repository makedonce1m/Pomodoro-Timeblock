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

## Plans Screen — Full Breakdown

The Plans screen is split into two views that replace each other: the **Library** (list of saved plans) and the **Builder** (editor for one plan). They are never shown simultaneously.

---

### Library (`TemplateLibrary.tsx`)

A scrollable list of saved plan cards plus a `+ New` button.

**Each card shows:**
- Plan name
- Day span (earliest start – latest end, formatted per time format setting)
- Total focus time (e.g. "4 h 30 min focus")
- Pomodoro type badge (Classic / Adaptive)
- A row of coloured time pills — one per block, colour-coded by type (focus = one colour, break = another)
- A run button (▶ / ●) to set the plan as active in the Run tab
- A ✕ cancel button that appears only when the plan is already active

**Tapping a card** (anywhere except the run/cancel buttons) opens the Builder for that plan.

**Mobile implementation notes:**
- The card list is a `FlatList`
- The block pills row can be a horizontal `ScrollView` inside each card if there are many blocks
- The run (▶) and cancel (✕) buttons use `e.stopPropagation()` on web to prevent the card tap — in React Native use separate `Pressable` components instead of nesting inside the card's `Pressable`

---

### Creating a New Plan — Type Picker

Tapping `+ New` shows a modal bottom sheet before the Builder opens. The user must choose the Pomodoro type first, because **it is locked for the lifetime of the plan and cannot be changed later**.

Two options:
- **Adaptive** — switch between Standard (25/5) and Comfort (20/10) during sessions
- **Classic** — fixed 20 min focus / 5 min break, no mode switching

After picking, the Builder opens with an empty plan named "New Template" and the chosen type already set.

**Mobile:** Bottom sheet modal (`Modal` with slide-up animation, or a library like `@gorhom/bottom-sheet`).

---

### Builder (`TemplateBuilder.tsx`)

The editor for a single plan. Contains a header, a type badge, the blocks list, add buttons, a delete zone, and the unsaved-changes dialog.

#### Header
- **Back arrow (←)** — exits the builder. If there are unsaved changes, triggers the unsaved-changes dialog instead of navigating immediately.
- **Plan name input** — editable text field, placeholder "Template name". The plan name is independent of any block labels.
- **Save button** — saves the plan and exits the builder immediately. Always visible; no dirty-state gating.

#### Type badge
A read-only badge showing "Classic" or "Adaptive" with a "locked" label next to it. Reminds the user this cannot be changed.

#### Blocks list

Each block is a card with:

**Drag handle** (six-dot grid icon, left side)
- Long-press (300ms) activates drag mode.
- If the finger moves more than 8px vertically before the 300ms fires, the long-press is cancelled and the gesture is treated as a scroll instead.
- While dragging, a **drop line** appears between blocks to show where the dragged block will land.
- Auto-scroll kicks in when the finger is within 64px of the top or bottom edge of the list (speed scales with proximity, max 10px/frame).
- On release, the block is inserted at the drop position.
- **Mobile:** the existing touch logic (`onTouchStart`/`onTouchMove`/`onTouchEnd`) already targets mobile and carries over as-is. The `requestAnimationFrame` auto-scroll loop needs replacing with React Native's `Animated` or a `setInterval`-based scroll on a `ScrollView` ref.

**Block type icon** (coloured pill on the left of the card content)
- Focus block: book/open-book SVG icon in a coloured pill
- Break block: coffee cup SVG icon in a coloured pill
- These are decorative (`aria-hidden`), not interactive

**Block header row**
- Type label: "Focus" or "Break" (non-editable, derived from block type)
- Pomodoro count badge: shown only on focus blocks — e.g. "4 Pomodoros". Auto-calculated from start/end times; the user never sets this directly.
- Delete button (×) — removes the block from the list immediately, no confirmation

**Block name input**
- Editable text field. Default names are "Focus Block 1", "Focus Block 2", etc. and "Break".
- Free text — the user can name it anything ("Deep Work", "Lunch", "Morning Run").

**Start time**
- Native time picker (`<input type="time">` on web).
- When start time changes on a focus block, the pomodoro count is preserved and the end time is recalculated: `newEnd = start + pomodoroCount × 30 min`. This prevents the block from losing its size when the user slides the start time.
- **Mobile:** `DateTimePicker` from `@react-native-community/datetimepicker` in time mode.

**End time — Focus blocks**
- A dropdown (`<select>`) that only offers valid end times: exactly 1 to 16 pomodoros from the start (i.e. start + 30 min, start + 60 min, … start + 480 min). Each option shows the time AND the pomodoro count: e.g. "11:00 · 4 pomos".
- The end time is always a multiple of 30 minutes from start — this is enforced by the picker, not validated after the fact.
- If the stored end time is not an exact multiple (e.g. from an old saved plan), it is snapped to the nearest valid option on display.
- **Mobile:** a custom picker wheel (e.g. `Picker` from `@react-native-picker/picker`, or a modal scroll picker) showing the same formatted options.

**End time — Break blocks**
- A free time picker, same as the start time input. No pomodoro-count constraint.

#### Add buttons (footer of the blocks list)
- `+ Focus Block` — appends a new focus block starting at the last block's end time, defaulting to 2 hours (4 pomodoros).
- `+ Break` — appends a new break block starting at the last block's end time, defaulting to 30 minutes.
- Both buttons are always visible at the bottom of the scrollable blocks list.

#### Delete Plan button
- Only shown when editing an **existing** plan (not shown for brand-new unsaved plans).
- First tap shows an inline confirmation: "Delete this plan?" with Cancel and Delete buttons.
- Confirmed delete removes the plan from storage and exits the builder.

---

### Unsaved-Changes Dialog

Triggered in two situations:
1. The user taps the back arrow while there are unsaved changes.
2. The user taps a different bottom nav tab while the builder is open with unsaved changes.

The dialog is a bottom sheet overlay with three buttons:

| Button | Action |
|---|---|
| **Save** | Saves the plan, then proceeds with the navigation |
| **Discard** | Discards changes, then proceeds with the navigation |
| **Keep editing** | Dismisses the dialog, stays in the builder |

The "nav away" trigger works via a registered leave handler: the parent (`TemplatesScreen`) registers a callback with the nav system. When the nav fires it, the builder checks for unsaved changes and either blocks the navigation (showing the dialog) or lets it through immediately.

**Mobile:** React Navigation's `beforeRemove` event handles the back-button case. For tab switches, a custom `tabPress` listener on the tab navigator achieves the same interception.

---

### How Pomodoro Count Is Derived

The user never types a pomodoro count. It is always computed:

```
pomodoroCount = floor((endMinutes - startMinutes) / 30)
```

This happens in `calcPomodoroCount()` (`src/utils/timeblock.ts`) and is called:
- When a new focus block is added (from the default 120-minute size → 4 pomodoros)
- When the end time changes (user picks a different option from the dropdown)
- When the start time changes (end time is recalculated from preserved count, then count is reconfirmed)

The count is displayed in the block header and on the library card summary. It is stored in the `FocusBlock` data and used by `useSession` to know when the closing interval is reached.

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

## Settings Screen — Web vs Mobile

The web settings screen (`src/screens/SettingsScreen.tsx`) has three sections with five controls total. All five map directly to fields in `AppSettings` and persist via `useSettings`.

---

### Session

**Auto-continue** (`autoContinue: boolean`)
Toggle switch. When on, the timer advances automatically through all transitions — focus → break → next Pomodoro → next block — without the user tapping anything. When off, a Continue button appears at each boundary.
- Web: custom CSS toggle (`role="switch"`)
- Mobile: `Switch` from React Native core

**Keep screen on** (`keepScreenOn: boolean`)
Toggle switch. Prevents the display from sleeping while the timer is running.
- Web: `useWakeLock` hook using `navigator.wakeLock`
- Mobile: `expo-keep-awake` — call `useKeepAwake()` when this is true and a session is active

---

### Display

**Time format** (`timeFormat: '24h' | '12h'`)
Segmented control with two options: `24h` and `AM/PM`. Controls how block start/end times are displayed throughout the app via `formatDisplayTime()`.
- Web: two `<button>` elements styled as a segmented picker
- Mobile: two-option `SegmentedControl` (or a pair of styled `Pressable` components)

---

### Timer

**Pomodoro type** (`pomodoroType: 'classic' | 'adaptive'`)
Segmented control: Classic or Adaptive. This is a global default — new templates inherit it. Existing templates store their own `pomodoroType` and are unaffected by changing this setting mid-use.
- Web: two-button segmented control
- Mobile: same pattern

**Default mode** (`defaultMode: 'standard' | 'comfort'`)
Segmented control: Standard or Comfort. **Only shown when Pomodoro type is set to Adaptive** — the row is hidden entirely when Classic is selected. This is the starting mode for new Adaptive sessions; the user can still switch mid-session.
- Web: conditionally rendered row (`{settings.pomodoroType === 'adaptive' && ...}`)
- Mobile: same conditional render

---

### Implementation Notes for Mobile

| Control | Web pattern | Mobile equivalent |
|---|---|---|
| Toggle (Auto-continue, Keep screen on) | Custom `<button role="switch">` | `Switch` (React Native core) |
| Segmented (Time format, Pomodoro type, Default mode) | Styled `<button>` pair | `SegmentedControl` or styled `Pressable` pair |
| Conditional row (Default mode) | `{condition && <div>}` | Same — identical React pattern |
| Persistence | `localStorage` via `useSettings` | `AsyncStorage` via `useSettings` (swap only) |
| Section grouping | `<section>` with heading | `View` with `Text` heading, or `SectionList` |

The settings screen is the simplest screen to build — all logic already exists in `useSettings`, the UI is just five straightforward controls.

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
