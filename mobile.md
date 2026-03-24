# iOS App Plan — Pomodoro Timeblock

This document covers the plan for building the native iPhone app using **Swift + SwiftUI + Xcode**. iPhone only, built properly with full access to Apple APIs.

---

## The Logic — What's Already Built

The web app contains all the core logic. The data models, timer state machines, session orchestration, and business rules are all defined and working. None of that needs to be invented — it needs to be ported to Swift. The structure maps cleanly.

---

## Data Models

### Web: `src/types/index.ts` → Swift: structs + enums

| Web (TypeScript) | Swift |
|---|---|
| `type PomodoroMode = 'standard' \| 'comfort'` | `enum PomodoroMode: String, Codable` |
| `type PomodoroType = 'classic' \| 'adaptive'` | `enum PomodoroType: String, Codable` |
| `interface FocusBlock` | `struct FocusBlock: Identifiable, Codable` |
| `interface LongBreakBlock` | `struct LongBreakBlock: Identifiable, Codable` |
| `type TimeBlock = FocusBlock \| LongBreakBlock` | `enum TimeBlock: Identifiable, Codable` with associated values |
| `interface DayTemplate` | `struct DayTemplate: Identifiable, Codable` |

**Fields carry over exactly:**
- `id: String` → `id: String`
- `label: String` → `label: String`
- `startTime: String` (HH:mm) → `startTime: String` (same format, same logic)
- `endTime: String` → `endTime: String`
- `pomodoroCount: Int` → `pomodoroCount: Int`
- `pomodoroType: PomodoroType` → `pomodoroType: PomodoroType`

Because everything is `Codable`, persistence to `UserDefaults` or a JSON file is trivial.

---

## Constants

### Web: `src/constants/timer.ts` → Swift: `enum TimerConstants`

All values are identical. Just translated to Swift syntax.

| Constant | Value | Meaning |
|---|---|---|
| `focusDuration[.standard]` | 1500s (25 min) | Standard mode focus |
| `focusDuration[.comfort]` | 1200s (20 min) | Comfort mode focus |
| `breakDuration[.standard]` | 300s (5 min) | Standard mode break |
| `breakDuration[.comfort]` | 600s (10 min) | Comfort mode break — intentionally long to cover a bathroom break |
| `classicFocusDuration` | 1200s (20 min) | Classic type, fixed |
| `classicBreakDuration` | 300s (5 min) | Classic type, fixed |
| `closingIntervalDuration` | 1800s (30 min) | Last pomodoro of a block — pure focus, no break |
| `modeSwitchCutoff` | 1190s (19:50) | Latest point at which the user can switch modes mid-session |

---

## Utilities

### Web: `src/utils/timeblock.ts` → Swift: free functions or `TimeBlockUtils`

Pure logic, no APIs. Port directly.

- `formatDisplayTime(hhmm, format)` → Swift function using string manipulation or `DateFormatter`
- `calcPomodoroCount(startTime, endTime)` → same arithmetic in Swift
- `addMinutes(time, minutes)` → same arithmetic in Swift

### Web: `src/utils/pomodoroMode.ts` → Swift: free function

- `canSwitchMode(phase, elapsedSeconds)` → same logic: `phase == .focus && elapsedSeconds < modeSwitchCutoff`

---

## Timer Engine

### Web: `usePomodoroTimer` → Swift: `PomodoroTimerViewModel: ObservableObject`

This is the most important port. The logic is identical — only the platform APIs change.

**What it does (same in Swift):**
- Tracks elapsed time using wall clock (not frame counting) — drift-resistant
- Manages two phases: `.focus` and `.break`
- Handles start, pause, resume, reset, skip, phase transitions
- Auto-advances focus → break → focus when a phase completes (configurable)
- Supports custom phase durations (closing intervals, long-break blocks)
- Supports mid-session mode switching during focus before the 19:50 cutoff, preserving elapsed time
- Fires an `onPhaseComplete` callback when a phase ends

**Platform API replacements:**

| Web | Swift |
|---|---|
| `Date.now()` for wall clock | `Date()` / `CFAbsoluteTimeGetCurrent()` |
| `requestAnimationFrame` for UI updates | `CADisplayLink` (exact equivalent — fires every frame, synced to display) |
| `visibilitychange` event for foreground re-entry | `NotificationCenter` observer on `UIApplication.willEnterForegroundNotification` |

`CADisplayLink` is actually a better fit than `requestAnimationFrame` — it's the native display sync mechanism that browsers implement `rAF` on top of.

---

## Session Engine

### Web: `useSession` → Swift: `SessionViewModel: ObservableObject`

The state machine logic ports directly. All the rules, edge cases, and transition paths are the same.

**What it does (same in Swift):**
- Walks through a `DayTemplate`'s blocks in order
- Tracks `blockIndex` and `pomodoroIndex`
- Session phases: `.idle`, `.focus`, `.shortBreak`, `.longBreak`, `.blockDone`, `.done`
- Closing interval: last pomodoro of a focus block = 30 min pure focus, no break
- Long-break blocks: single countdown, no break appended
- `autoContinue`: automatic transitions vs. manual Continue button
- `jumpToPomodoro(index)`: tap a progress dot to navigate within the block
- Resets when the template changes

**Swift implementation note:** `SessionViewModel` owns a `PomodoroTimerViewModel` as a `@Published` property. SwiftUI views observe both via `@StateObject` / `@ObservedObject`.

---

## Settings

### Web: `useSettings` + `localStorage` → Swift: `@AppStorage` or `UserDefaults`

**Settings:**
- `autoContinue: Bool`
- `keepScreenOn: Bool`
- `timeFormat: TimeFormat` (`.h24` / `.h12`)
- `pomodoroType: PomodoroType` (`.classic` / `.adaptive`)
- `defaultMode: PomodoroMode` (`.standard` / `.comfort`)

**Swift:** Each setting becomes an `@AppStorage` property wrapper — one line per setting, automatic persistence to `UserDefaults`, no boilerplate. No separate hook needed.

```swift
@AppStorage("autoContinue") var autoContinue: Bool = true
@AppStorage("keepScreenOn") var keepScreenOn: Bool = true
```

---

## Keep Screen On

### Web: `useWakeLock` → Swift: one line

```swift
UIApplication.shared.isIdleTimerDisabled = keepScreenOn && sessionIsRunning
```

Called whenever `keepScreenOn` or the running state changes. No library needed.

---

## Sound

### Web: `AudioContext` synthesis → Swift: `AVFoundation` or `AVAudioEngine`

The web app synthesizes bird-like chirp sounds (5-chirp ascending/descending sequences) entirely in code using the Web Audio API. Two options for Swift:

**Option A — Pre-record from the web app (simpler)**
Record the three sounds from the running web app as `.wav` files, bundle them in Xcode, play with `AVAudioPlayer`. Zero synthesis code.

**Option B — Re-synthesize with AVAudioEngine (faithful)**
`AVAudioEngine` can do everything the Web Audio API does: oscillators, gain nodes, LFOs, frequency ramps. The chirp parameters (frequencies, durations, gain envelope) are all defined in `sound.ts` and can be translated directly. More work but preserves the exact sound design.

Option A is recommended to start with.

---

## Plans Screen

### Library view → SwiftUI `List` or `LazyVStack`

A scrollable list of plan cards plus a `+ New` button in the navigation bar.

**Each card shows:**
- Plan name
- Day span (earliest start – latest end)
- Total focus time
- Pomodoro type badge (Classic / Adaptive)
- Row of coloured time pills per block
- Run button (▶ / ●) to activate the plan in the Run tab
- ✕ deactivate button when the plan is already active

**SwiftUI:** `List` with custom row views. Run/cancel buttons use `.simultaneousGesture` or `ButtonRole` to prevent the row tap from firing.

---

### Type picker → `.confirmationDialog` or `.sheet`

Shown before the builder opens for a new plan. User picks Classic or Adaptive — **locked for the plan's lifetime**.

**SwiftUI:** `.confirmationDialog` with two options, or a small `.sheet` with styled buttons.

---

### Builder view

#### Header
- Back chevron → SwiftUI `.toolbar` with a custom back button; intercepts navigation when there are unsaved changes
- Plan name → `TextField`
- Save button → `.toolbar` trailing button

#### Type badge
Read-only `Text` badge showing "Classic · locked" or "Adaptive · locked".

#### Blocks list — drag to reorder
SwiftUI `List` with `.onMove` modifier handles drag-to-reorder natively with zero custom gesture code. The system provides the drag handle and drop animation automatically. This is significantly simpler than the web implementation.

```swift
List {
    ForEach($blocks) { $block in
        BlockRowView(block: $block)
    }
    .onMove { source, destination in
        blocks.move(fromOffsets: source, toOffset: destination)
    }
}
.environment(\.editMode, .constant(.active))
```

#### Block type icon
- Focus block: book SF Symbol (`book.fill`)
- Break block: coffee cup SF Symbol (`cup.and.saucer.fill`)

No custom SVGs needed — SF Symbols covers both.

#### Block fields
- **Block name:** `TextField`
- **Start time:** `DatePicker` with `.hourAndMinute` display component. Stores as `HH:mm` string (same format as web).
- **End time — Focus blocks:** `Picker` with `.wheel` style showing options from start + 30 min to start + 480 min (1–16 pomodoros), each labelled "10:00 · 2 pomos". Enforces the 30-minute multiple constraint.
- **End time — Break blocks:** `DatePicker` same as start time. No constraint.
- **Pomodoro count:** Derived automatically, displayed as a badge. Never entered by the user.
- **Delete block button:** Swipe-to-delete on the list row (`.onDelete` modifier), or an explicit × button in the row.

**Start time change behaviour (same as web):** When start time changes on a focus block, the pomodoro count is preserved and end time is recalculated: `newEnd = start + pomodoroCount × 30 min`.

#### Add buttons
`+ Focus Block` and `+ Break` buttons at the bottom of the list. New blocks append from the last block's end time. Focus blocks default to 120 min (4 pomodoros), break blocks to 30 min.

#### Delete Plan
Shown only for existing plans. First tap: `.confirmationDialog` asking "Delete this plan?" with Cancel and Delete. Confirmed: removes from storage and pops the view.

---

### Unsaved-changes dialog

Triggered when:
1. User taps the back button with unsaved changes
2. User taps a different tab while the builder is open with unsaved changes

**SwiftUI:** `.alert` or `.confirmationDialog` with three actions:

| Button | Action |
|---|---|
| **Save** | Saves, then navigates away |
| **Discard** | Discards, then navigates away |
| **Keep editing** | Dismisses the dialog |

Tab switch interception uses a custom `TabView` selection binding that checks for unsaved state before allowing the tab to change.

---

### How Pomodoro Count Is Derived (same as web)

```
pomodoroCount = floor((endMinutes - startMinutes) / 30)
```

Never entered by the user. Calculated when:
- A new focus block is added (default 120 min → 4 pomodoros)
- End time changes (user picks from the dropdown)
- Start time changes (end recalculated from preserved count, count reconfirmed)

Displayed in the block row and on the library card. Used by `SessionViewModel` to detect the closing interval.

---

## Pomodoro Modes — Full Breakdown

Two layers: **PomodoroType** (set per template, locked) and **PomodoroMode** (Standard/Comfort choice within Adaptive).

---

### PomodoroType: `.adaptive` vs `.classic`

**Adaptive** — the default. User chooses Standard or Comfort, can switch during a session. Timer uses `focusDuration[mode]` and `breakDuration[mode]`.

**Classic** — fixed. `SessionViewModel` passes `customFocusDuration = 1200s` and `customBreakDuration = 300s` to `PomodoroTimerViewModel`, bypassing the mode system entirely. Mode switching has no effect. Always 20 min focus / 5 min break.

---

### PomodoroMode: `.standard` vs `.comfort` (Adaptive only)

| Mode | Focus | Break | Total | Intent |
|---|---|---|---|---|
| **Standard** | 25 min | 5 min | 30 min | Default work mode |
| **Comfort** | 20 min | 10 min | 30 min | Break long enough to cover a bathroom stop alongside normal rest |

The Comfort break is **intentionally 10 minutes**. Do not shorten it.

Both modes total 30 minutes — the constraint that makes pomodoros slot cleanly into time blocks.

---

### Mid-Session Mode Switching (Adaptive only)

All of the following must be true to allow a switch:

1. `pomodoroType` is `.adaptive`
2. Current phase is `.focus`
3. Elapsed focus time is **below 1190s (19:50)**

The cutoff exists because Comfort focus ends at 20 min. Switching at 19:51 leaves 9 seconds — meaningless. The 10-second buffer ensures meaningful time remains in either mode.

**Rules:**
- `canSwitchMode(phase, elapsedSeconds)` — the gate function. Used to derive `canSwitch` and guard the switch action.
- `switchMode()` — toggles `.standard` ↔ `.comfort` while the timer keeps running. Elapsed time preserved. Wall-clock anchor reset to `Date()`.
- `selectMode(mode)` — pre-session mode selection only. Blocked once the timer has started.

**UI:** The switch button must be **disabled, not hidden**, when `canSwitch` is false.

---

## Settings Screen

Three sections, five controls. All persist automatically via `@AppStorage`.

### Session

**Auto-continue** — `Toggle`. Advances all transitions automatically. When off, a Continue button appears at each boundary.

**Keep screen on** — `Toggle`. Sets `UIApplication.shared.isIdleTimerDisabled` while a session is running.

### Display

**Time format** — `Picker` with `.segmented` style. Options: `24h` and `AM/PM`.

### Timer

**Pomodoro type** — `Picker` with `.segmented` style. Options: Classic, Adaptive. Global default for new plans; existing plans are unaffected.

**Default mode** — `Picker` with `.segmented` style. Options: Standard, Comfort. **Only shown when Pomodoro type is Adaptive.** Starting mode for new adaptive sessions; can still be switched mid-session.

**SwiftUI implementation:**
```swift
Form {
    Section("Session") {
        Toggle("Auto-continue", isOn: $autoContinue)
        Toggle("Keep screen on", isOn: $keepScreenOn)
    }
    Section("Display") {
        Picker("Time format", selection: $timeFormat) { ... }
            .pickerStyle(.segmented)
    }
    Section("Timer") {
        Picker("Pomodoro type", selection: $pomodoroType) { ... }
            .pickerStyle(.segmented)
        if pomodoroType == .adaptive {
            Picker("Default mode", selection: $defaultMode) { ... }
                .pickerStyle(.segmented)
        }
    }
}
```

`Form` gives you section grouping, labels, and native iOS styling for free.

---

## What to Build in Swift (Nothing Carries Over)

Everything needs to be written in Swift. The web code is the reference — port the logic, replace the APIs.

| Web file | Swift equivalent |
|---|---|
| `src/types/index.ts` | Swift structs + enums (`Codable`, `Identifiable`) |
| `src/constants/timer.ts` | `enum TimerConstants` with static lets |
| `src/utils/timeblock.ts` | Free functions in `TimeBlockUtils.swift` |
| `src/utils/pomodoroMode.ts` | Free function `canSwitchMode(_:_:)` |
| `src/hooks/usePomodoroTimer.ts` | `PomodoroTimerViewModel: ObservableObject` |
| `src/hooks/useSession.ts` | `SessionViewModel: ObservableObject` |
| `src/hooks/useSettings.ts` | `@AppStorage` properties (no class needed) |
| `src/hooks/useWakeLock.ts` | One line: `UIApplication.shared.isIdleTimerDisabled` |
| `src/utils/sound.ts` | `AVAudioPlayer` with pre-recorded files |
| `src/defaults/schedule.ts` | A static `DayTemplate` constant |
| `src/screens/TemplateLibrary.tsx` | `PlanLibraryView: View` |
| `src/screens/TemplateBuilder.tsx` | `PlanBuilderView: View` |
| `src/screens/SettingsScreen.tsx` | `SettingsView: View` |
| `src/screens/RunScreen.tsx` | `RunView: View` |
| `src/components/BottomNav.tsx` | `TabView` (built into SwiftUI) |

---

## Migration Phases

### Phase 1 — Xcode Project + Data Models
- Create new Xcode project (App template, SwiftUI, Swift)
- Create a new GitHub repo (`Pomodoro-Timeblock-iOS`)
- Define all data models: enums, structs, constants
- Port utility functions
- Verify models encode/decode correctly with `JSONEncoder`

### Phase 2 — Timer + Session Engines
- Build `PomodoroTimerViewModel` — this is the heart of the app
- Write unit tests for timer logic: phase transitions, mode switching cutoff, closing interval, pause/resume accuracy
- Build `SessionViewModel` on top of it
- Test the full session flow in a throwaway SwiftUI view

### Phase 3 — Navigation Shell
- Set up `TabView` with three tabs: Run, Plans, Settings
- Set up `NavigationStack` inside the Plans tab
- Stub all three screens with placeholder content

### Phase 4 — Screens (simplest to hardest)
1. **Settings** — `Form` with `@AppStorage` bindings. Trivial.
2. **Plans Library** — `List` of plan cards with run/deactivate buttons
3. **Plan Builder** — the most complex screen: block editing, drag reorder, time pickers, unsaved-changes dialog
4. **Run screen** — active session UI: timer ring, progress dots, phase labels, mode switch button, continue/skip controls

### Phase 5 — Polish
- Record sounds from the web app, integrate with `AVAudioPlayer`
- Haptic feedback on phase transitions (`UIImpactFeedbackGenerator`)
- Lock Screen widget showing the current timer (WidgetKit — a genuine Apple advantage)
- Dynamic Island live activity for the timer (also Apple-only)
- App icon and launch screen
- TestFlight build for device testing

---

## Home Setup Checklist

- [ ] **Xcode** — free from the Mac App Store
- [ ] **Apple Developer account** — free account works for running on your own iPhone via USB. $99/year only needed to submit to the App Store.
- [ ] Connect your iPhone to your Mac via USB once to trust the device in Xcode
- [ ] Create new GitHub repo: `Pomodoro-Timeblock-iOS`

No additional tools required. Xcode includes the simulator, debugger, Instruments (performance profiler), and the build system.
