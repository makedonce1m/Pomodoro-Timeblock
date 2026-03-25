# CLAUDE.md — Pomodoro Timeblock

This file provides guidance for AI assistants (Claude and others) working on this repository.

---

## Project Overview

**Pomodoro-Timeblock** is a productivity application combining the Pomodoro Technique with time-blocking. Users build day plans made up of ordered focus and break blocks. Within each focus block, a Pomodoro timer runs through work intervals interleaved with short breaks.

### Core Concepts
- **Time Block**: A named work session with a duration (e.g., "Deep Work — 2 hours")
- **Pomodoro**: A 30-minute interval consisting of a focus period followed by a break
- **Short Break**: Rest period between Pomodoros within a focus block
- **Long Break Block**: An explicitly scheduled rest block added to the plan by the user (not auto-triggered)
- **Closing Interval**: The final Pomodoro of a focus block — 30 minutes of pure focus with no trailing break, since a longer inter-block break follows immediately

### Pomodoro Interval Modes
Two modes are supported; users can switch between them in settings:

| Mode | Focus | Break | Total | Intent |
|------|-------|-------|-------|--------|
| **Standard** (default) | 25 min | 5 min | 30 min | Primary work mode |
| **Comfort** | 20 min | 10 min | 30 min | Break sized to include a bathroom stop alongside a normal rest |

> **Note on Comfort Pomodoro**: The 10-minute break is intentionally long enough to cover a bathroom break combined with a normal rest. Do not shorten it.

### Closing Interval (Last Pomodoro of a Focus Block)
When a focus block ends, the final Pomodoro runs as a **30-minute pure focus interval** (no break appended). The rationale: a longer inter-block break is already scheduled after the block, so a 5-minute trailing break would be redundant and disruptive to the natural transition.

### Long Breaks
Long breaks are **explicit plan blocks** (`LongBreakBlock`) that the user adds to their plan via `+ Break`. They are not auto-triggered after N Pomodoros. The user decides when and how long a break is by placing it in the plan.

---

## Repository State

The application is functionally complete for core features. The tech stack is React + TypeScript + Vite + CSS Modules, deployed as a mobile-first web app.

---

## Actual Project Structure

```
Pomodoro-Timeblock/
├── CLAUDE.md
├── README.md
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
└── src/
    ├── main.tsx                        # Entry point
    ├── App.tsx                         # Root: template state, routing between views
    ├── App.module.css
    ├── index.css                       # Global CSS variables (themes, tokens)
    ├── vite-env.d.ts
    ├── components/
    │   ├── BottomNav.tsx               # Tab bar (Run / Plans / Settings)
    │   ├── PomodoroTimer.tsx           # Standalone timer UI (no active plan)
    │   └── ModeSidebar.tsx             # Standard/Comfort mode switcher panel
    ├── constants/
    │   └── timer.ts                    # POMODORO_FOCUS_DURATION, CLOSING_INTERVAL_DURATION, etc.
    ├── defaults/
    │   └── schedule.ts                 # DEFAULT_DAY_TEMPLATE (sample plan)
    ├── hooks/
    │   ├── usePomodoroTimer.ts         # Core drift-resistant timer (performance.now)
    │   ├── useSession.ts               # Block/Pomodoro progression logic for an active plan
    │   ├── useSettings.ts              # App settings (persisted to localStorage)
    │   └── useWakeLock.ts              # Screen wake lock while timer runs
    ├── screens/
    │   ├── RunScreen.tsx               # Active session UI
    │   ├── TemplatesScreen.tsx         # Orchestrates plan list + builder + modals
    │   ├── TemplateLibrary.tsx         # Plan list view
    │   ├── TemplateBuilder.tsx         # Plan editor (blocks, drag-to-reorder, duration selects)
    │   └── SettingsScreen.tsx          # App settings UI
    ├── types/
    │   └── index.ts                    # All TypeScript types (DayTemplate, FocusBlock, etc.)
    └── utils/
        ├── timeblock.ts                # formatDisplayTime, addMinutes, calcBlockTimes
        ├── pomodoroMode.ts             # Mode-related utilities
        └── sound.ts                   # Skip/notification sounds
```

> No `tests/` directory exists yet. No `store/` directory — state is managed via hooks and component state.

---

## Development Workflow

### Setup
```bash
npm install
npm run dev       # Start dev server
npm run build     # Production build
npm run lint      # ESLint
```

### Branch Strategy
- `main` — stable, production-ready code
- `claude/<description>-<session-id>` — AI-assisted feature branches (never push to main directly)
- Feature branches should be short-lived and merged via pull request

### Commit Conventions
Follow [Conventional Commits](https://www.conventionalcommits.org/):
```
feat: add long break notification sound
fix: prevent timer drift on tab switch
refactor: extract timer logic into usePomodoro hook
test: add unit tests for time-block scheduling
docs: update README with keyboard shortcuts
chore: upgrade dependencies
```

---

## Key Conventions

### General
- **Language**: TypeScript (strict mode preferred)
- **Formatting**: Prettier with default settings; run before every commit
- **Linting**: ESLint; fix all errors before committing
- **No `any`**: Avoid TypeScript `any`; use proper types or `unknown`

### Timer Logic
- Timer state is in `usePomodoroTimer` (low-level) and `useSession` (plan-aware)
- Pomodoro durations come from constants in `src/constants/timer.ts` — never hardcode
- The two supported modes are Standard (25/5) and Comfort (20/10); both total 30 minutes
- Comfort mode's 10-minute break is designed to cover a bathroom break — do not shorten it
- The last interval of every focus block is a **closing interval**: 30 minutes of focus with no break; implemented as `CLOSING_INTERVAL_DURATION`
- Use `performance.now()` for drift-resistant timing — never naive `setInterval` counting
- Pause/resume preserves elapsed time accurately
- **Mid-session mode switching**: permitted only during focus phase and only while elapsed time < `MODE_SWITCH_CUTOFF_SECONDS` (19:50). Button is disabled outside this window.

### Plan / Time Block Model
- `DayTemplate` has a plan-level `startTime: string` (HH:mm, 24h)
- `FocusBlock` and `LongBreakBlock` store `durationMins: number` — **not** `startTime/endTime`
- Block start/end times are **derived** by chaining durations from the plan's `startTime` via `calcBlockTimes()` in `src/utils/timeblock.ts`
- This means drag-to-reorder always produces valid, consistent times (no manual cascade needed)
- `FocusBlock.pomodoroCount = durationMins / 30` (always an integer)
- Focus block durations are multiples of 30 min (1–16 pomos). Break durations: 15, 30, 45, 60, 90, 120 min.

### New Plan Creation Flow
1. User taps `+ New` in the plan list
2. Modal 1: Choose Pomodoro type — **Adaptive** (Standard/Comfort switchable) or **Classic** (20/5 fixed). Locked after creation.
3. Modal 2: Choose day start time (30-min increment dropdown)
4. Plan builder opens with the chosen start time

### State Management
- UI state stays local (component state) unless shared across unrelated components
- Global shared state: current timer, active template ID, app settings
- Do not store derived values in state — compute them (e.g. block times come from `calcBlockTimes`, not stored)

### Persistence
- Templates stored in `localStorage` under key `pomodoro-templates`
- Settings stored in `localStorage` under key `pomodoro-app-settings`
- `App.tsx` runs `migrateTemplate()` on load to handle the old `startTime/endTime`-per-block format
- No versioned schema yet — migrations are ad-hoc

### Accessibility
- Timer countdowns must be announced to screen readers (use `aria-live`)
- All interactive controls need keyboard navigation support
- Color alone must not be the only indicator of state (e.g., running/paused)

---

## What Is Not Yet Built

- **Tests**: No test suite exists. Priority areas: `usePomodoroTimer`, `useSession`, `calcBlockTimes`
- **Versioned localStorage schema**: Migrations are currently ad-hoc in `migrateTemplate()`
- **Notifications / sounds**: Skip sound exists (`sound.ts`) but no end-of-block or end-of-session notification
- **README**: Needs a user-facing README

---

## Testing Guidelines (when tests are added)

- Write unit tests for all timer and scheduling logic (pure functions are easiest to test)
- Integration tests for user flows: start timer → pause → resume → complete Pomodoro → take break
- Do not test implementation details; test observable behavior
- Aim for meaningful coverage of business logic, not 100% line coverage everywhere

---

## AI Assistant Notes

When working in this repository:

1. **Read before editing**: Always read the relevant source files before making changes
2. **Small, focused changes**: Make the minimal change that satisfies the requirement
3. **No speculative additions**: Do not add features, error handling, or abstractions beyond what is explicitly requested
4. **Preserve existing conventions**: Match the style, naming, and patterns already present in the codebase
5. **Update this file**: If you discover conventions or structure that differ from what is documented here, update this CLAUDE.md
6. **Commit messages**: Use Conventional Commits format (see above)
7. **Branch**: Always develop on the designated `claude/` branch; never push to `main`

---

## Resources

- [Pomodoro Technique](https://francescocirillo.com/pages/pomodoro-technique) — original methodology
- [Time Blocking Guide](https://todoist.com/productivity-methods/time-blocking) — background on time blocking
- [Conventional Commits](https://www.conventionalcommits.org/) — commit message format
