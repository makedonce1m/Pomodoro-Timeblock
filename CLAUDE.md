# CLAUDE.md — Pomodoro Timeblock

This file provides guidance for AI assistants (Claude and others) working on this repository.

---

## Project Overview

**Pomodoro-Timeblock** is a productivity application combining the Pomodoro Technique with time-blocking. Users define scheduled time blocks throughout their day, and within each block a Pomodoro timer runs (work intervals interleaved with short and long breaks).

### Core Concepts
- **Time Block**: A named, calendar-scheduled work session (e.g., "Deep Work 9:00–11:00")
- **Pomodoro**: A 25-minute focused work interval (configurable)
- **Short Break**: 5-minute rest between Pomodoros
- **Long Break**: 15–30-minute rest after every 4 Pomodoros

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
- Pomodoro durations are user-configurable; never hardcode `25 * 60` — use constants or settings
- Use `Date.now()` / `performance.now()` for drift-resistant timing rather than naive `setInterval` counting
- Pause/resume must preserve elapsed time accurately

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
