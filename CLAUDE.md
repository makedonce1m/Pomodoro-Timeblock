# CLAUDE.md — Pomodoro Timeblock

This file provides guidance for AI assistants (Claude and others) working on this repository.

---

## Project Overview

**Pomodoro-Timeblock** is a productivity application combining the Pomodoro Technique with time-blocking. Users define scheduled time blocks throughout their day, and within each block a Pomodoro timer runs (work intervals interleaved with short and long breaks).

### Core Concepts
- **Time Block**: A named, calendar-scheduled work session (e.g., "Deep Work 9:00–11:00")
- **Pomodoro**: A 30-minute interval consisting of a focus period followed by a break
- **Short Break**: Rest period between Pomodoros within a time block
- **Long Break**: Rest after a user-configurable number of Pomodoros (4, 5, or 6); duration is also configurable (15 min, 30 min, or 60 min)
- **Closing Interval**: The final Pomodoro of a time block — 30 minutes of pure focus with no trailing break, since a longer inter-block break follows immediately

### Pomodoro Interval Modes
Two modes are supported; users can switch between them in settings:

| Mode | Focus | Break | Total | Intent |
|------|-------|-------|-------|--------|
| **Standard** (default) | 25 min | 5 min | 30 min | Primary work mode |
| **Comfort** | 20 min | 10 min | 30 min | Break sized to include a bathroom stop alongside a normal rest |

> **Note on Comfort Pomodoro**: The 10-minute break is intentionally long enough to cover a bathroom break combined with a normal rest. Do not shorten it.

### Closing Interval (Last Pomodoro of a Time Block)
When a time block ends, the final Pomodoro runs as a **30-minute pure focus interval** (no break appended). The rationale: a longer inter-block break is already scheduled after the time block, so a 5-minute trailing break would be redundant and disruptive to the natural transition.

### Long Break Options
After a user-configured number of Pomodoros (4, 5, or 6), users take a long break. Both the interval count and the break length are configurable:

| Option | Duration |
|--------|----------|
| Short long break | 15 min |
| Standard long break | 30 min |
| **Extended long break** | 60 min |

---

## Repository State

> **Note**: This repository is in early/initial state. As the project grows, update this file to reflect actual structure, tooling, and conventions.

---

## Expected Project Structure

When source code is added, the likely structure will be:

```
Pomodoro-Timeblock/
├── CLAUDE.md                  # This file
├── README.md                  # User-facing documentation
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── .eslintrc.*                # Linting rules
├── .prettierrc                # Code formatting
├── .gitignore
├── src/
│   ├── main.*                 # Entry point
│   ├── components/            # UI components
│   ├── store/                 # State management
│   ├── hooks/                 # Custom React hooks (if React)
│   ├── utils/                 # Pure utility functions
│   ├── types/                 # TypeScript type definitions
│   └── styles/                # CSS / styling
├── tests/                     # Test files (mirror src/ structure)
└── public/                    # Static assets
```

---

## Development Workflow

### Setup
```bash
# Install dependencies (once package.json exists)
npm install         # or: yarn install / pnpm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Lint and format
npm run lint
npm run format
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

## Key Conventions (to be confirmed once code exists)

### General
- **Language**: TypeScript (strict mode preferred)
- **Formatting**: Prettier with default settings; run before every commit
- **Linting**: ESLint; fix all errors before committing
- **No `any`**: Avoid TypeScript `any`; use proper types or `unknown`

### Timer Logic
- Timer state should be managed in a dedicated store or hook, not scattered across UI components
- Pomodoro intervals are user-configurable; never hardcode durations — use named constants or settings (e.g., `STANDARD_MODE`, `COMFORT_MODE`)
- The two supported modes are Standard (25 min focus / 5 min break) and Comfort (20 min focus / 10 min break); both total 30 minutes
- Comfort mode's 10-minute break is designed to cover a bathroom break combined with a normal rest — do not shorten it
- Long break duration is user-configurable: 15 min, 30 min, or 60 min; use a named constant (e.g., `LONG_BREAK_DURATION`) — never hardcode
- The number of Pomodoros before a long break is user-configurable: 4, 5, or 6; use a named constant (e.g., `POMODOROS_BEFORE_LONG_BREAK`) — never hardcode
- The last interval of every time block is a **closing interval**: 30 minutes of focus with no break; implement this as a distinct interval type (e.g., `CLOSING_INTERVAL`) so it is never confused with a standard Pomodoro
- Use `Date.now()` / `performance.now()` for drift-resistant timing rather than naive `setInterval` counting
- Pause/resume must preserve elapsed time accurately
- **Mid-session mode switching**: While a Pomodoro is running, a button allows switching between Standard and Comfort mode. The timer must not stop. Switching is only permitted during the focus phase and only while elapsed focus time is below `MODE_SWITCH_CUTOFF_SECONDS` (10 seconds before Comfort mode's 20-minute focus mark, i.e. < 19:50). The button must be disabled outside this window. Elapsed time is preserved on switch.

### Time Block Scheduling
- Store time blocks as `{ id, label, startTime: ISO8601, endTime: ISO8601, pomodoroCount: number }`
- Validate that time blocks do not overlap
- Times should always be handled in local time for display but stored/compared in UTC or epoch ms

### State Management
- Keep UI state local (component state) when it does not need to be shared
- Lift to global store only what truly needs to be shared across unrelated components (e.g., current timer state, today's schedule)
- Do not store derived values in state — compute them from source data

### Persistence
- User settings and today's schedule should persist across page reloads (localStorage or IndexedDB)
- Use a versioned schema for stored data to enable future migrations

### Accessibility
- Timer countdowns must be announced to screen readers (use `aria-live`)
- All interactive controls need keyboard navigation support
- Color alone must not be the only indicator of state (e.g., running/paused)

---

## Testing Guidelines

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
