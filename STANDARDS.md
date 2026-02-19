# Coding Standards & Conventions

This document defines the canonical coding standards, patterns, and architectural rules for the ports-cli project. All new code must conform to these conventions.

---

## 1. Code Style

### Quotes & Punctuation
- **Single quotes** for string literals (`'hello'` not `"hello"`)
- **Template literals** for string interpolation (`` `${var}` ``)
- **No semicolons** — rely on ASI (Automatic Semicolon Insertion)

### Indentation & Formatting
- **2 spaces** for indentation (no tabs)
- **No trailing commas** in object/array literals
- **Line length**: No hard limit enforced; prefer readability over arbitrary column limits

### Import/Export Patterns
- **ESM with `.js` extensions**: All relative imports must include `.js` extension
  ```typescript
  import { getPorts } from './utils/getPorts.js';
  import type { PortEntry } from './types.js';
  ```
- **Named exports only**: No default exports anywhere in the codebase
- **Import order** (top to bottom):
  1. External dependencies (`react`, `ink`, `child_process`)
  2. Internal type-only imports (`type { ... }`)
  3. Internal value imports
- **Type imports**: Use `import type { ... }` syntax for type-only imports

### Naming Conventions
- **Components**: PascalCase (`SearchBar`, `PortList`, `HelpOverlay`)
- **Functions/variables**: camelCase (`getPorts`, `selectedIndex`, `executeKill`)
- **Constants**: SCREAMING_SNAKE_CASE for module-level constants
  ```typescript
  const AUTO_REFRESH_INTERVAL_MS = 2000;
  const KILL_MESSAGE_TIMEOUT_MS = 2000;
  ```
- **Types/Interfaces**: PascalCase (`PortEntry`, `AppMode`, `KillMessage`)
- **Props interfaces**: `ComponentName` + `Props` (`SearchBarProps`, `PortListProps`)

### File Naming
- **Components**: PascalCase matching component name (`SearchBar.tsx`, `PortList.tsx`)
- **Utilities**: camelCase with `.ts` extension (`getPorts.ts`, `killPort.ts`)
- **Type definitions**: camelCase (`types.ts`)
- **Tests**: Mirror source name + `.test.tsx` extension (`app.test.tsx`)

---

## 2. Architecture Rules

### Module Organization
```
/ports-cli
├── bin/           # CLI entry point
│   └── ports.tsx
├── src/
│   ├── app.tsx           # Root component — ALL state lives here
│   ├── types.ts          # Shared domain types
│   ├── components/       # Presentational components (no state)
│   │   ├── SearchBar.tsx
│   │   ├── PortList.tsx
│   │   ├── PortRow.tsx
│   │   ├── StatusBar.tsx
│   │   └── HelpOverlay.tsx
│   └── utils/            # Pure utility functions
│       ├── getPorts.ts
│       └── killPort.ts
└── tests/                # Mirrors src/ structure
    └── app.test.tsx
```

### State Management
- **Single source of truth**: ALL application state lives in `app.tsx`
- **No component-level state**: Child components are purely presentational
- **Props down only**: Components receive all data and callbacks via props
- **Derived state**: Compute from existing state rather than duplicating in `useState`
  ```typescript
  // GOOD: derived, stays in sync automatically
  const filteredPorts = ports.filter(p => matches(p, searchQuery));

  // BAD: stored state, requires manual sync
  const [filteredPorts, setFilteredPorts] = useState([]);
  ```

### Component Boundaries
- **Presentational components**: Accept props, render UI, no state or effects
  - All components in `src/components/`
  - Props interface must be named `ComponentNameProps`
- **Container component**: `app.tsx` only
  - Owns all state and effects
  - Manages keyboard input via `useInput`
  - Orchestrates data flow

### Import Restrictions
- **Types**: Must import from `../types.js`, never from `app.tsx` (prevents circular deps)
- **Components**: Can only import other components and types; no utils
- **Utils**: Can import types; no components
- **app.tsx**: Can import everything

### Prohibited Patterns
- **Circular dependencies**: Never import from a file that imports you
- **Default exports**: Use named exports exclusively
- **Type-only files importing values**: `types.ts` must not import non-type code
- **State in presentational components**: Components in `/components` must be stateless

---

## 3. TypeScript Standards

### Compiler Configuration
```json
{
  "strict": true,              // All strict checks enabled
  "target": "ES2022",
  "module": "NodeNext",
  "moduleResolution": "NodeNext",
  "jsx": "react-jsx",
  "noEmit": true               // Build via esbuild, tsc only for type checking
}
```

### Type Discipline
- **Explicit return types** on all exported functions
  ```typescript
  export function getPorts(): PortEntry[] { ... }
  export function killPort(pid: string): KillResult { ... }
  ```
- **No `any`**: Explicit types or `unknown` only
- **Type vs Interface**:
  - Use `interface` for object shapes (`PortEntry`, `SearchBarProps`)
  - Use `type` for unions, discriminated unions, and primitives (`AppMode`, `KillResult`)

### Type Organization
- **Centralized in `types.ts`**: All shared domain types live here
- **Re-export pattern**: Components can re-export types from `types.ts` for backward compatibility
  ```typescript
  // app.tsx
  export type { AppMode, KillMessage } from './types.js';
  ```
- **Component props**: Define inline or immediately above component, not in `types.ts`

### Discriminated Unions
Use for success/error patterns with TypeScript's type narrowing:
```typescript
export type KillResult =
  | { success: true }
  | { success: false; error: string };

// Compiler knows `error` exists here
if (!result.success) {
  console.error(result.error);
}
```

---

## 4. Documentation Standards

### File-Level JSDoc
Required for all modules. Must include `@file` tag and `@description`:
```typescript
/**
 * @file app.tsx
 * @description Root component of the ports-cli TUI. Owns ALL application state.
 *
 * Architecture notes:
 * - All state lives here (single source of truth) rather than being split...
 */
```

### Function Documentation
Required for all exported functions. Must include:
- Brief description
- `@param` for each parameter (type + purpose)
- `@returns` with type and meaning
- Rationale comments for non-obvious decisions

Example:
```typescript
/**
 * Runs `lsof` and returns a sorted, deduplicated list of listening TCP ports.
 *
 * @returns Array of {@link PortEntry} objects sorted by port number ascending.
 *          Returns an empty array if lsof is unavailable, times out, or
 *          produces no output.
 */
export function getPorts(): PortEntry[] { ... }
```

### Inline Comments
- **Why, not what**: Explain rationale, not mechanics
  ```typescript
  // GOOD: explains why
  // Guard against dangerous PID values before touching the shell.
  // PID 0 is the swapper/scheduler (a kernel pseudo-process on most Unixes).

  // BAD: states the obvious
  // Check if PID is valid
  ```
- **Edge case documentation**: Call out subtle behavior
  ```typescript
  // Use lastIndexOf instead of indexOf to correctly split IPv6 addresses.
  // An IPv6 NAME field looks like `[::1]:3000` — the host portion itself
  // contains colons, so indexOf(':') would land inside the address.
  ```

### Type Documentation
Use JSDoc on interface properties for domain context:
```typescript
/**
 * Process ID as a string.
 * Kept as a string because lsof outputs strings and converting to a number
 * here would force every callsite to deal with the int — callers that pass
 * the PID to `killPort()` can pass it through without any conversion.
 */
pid: string;
```

### Architecture Documentation
Complex components (like `app.tsx`) should document:
- **Responsibility**: What this module owns
- **State flow**: How data moves through the system
- **Mode/state machine**: Different interaction modes
- **Invariants**: Assumptions that must hold

---

## 5. Error Handling Patterns

### Return Types Over Exceptions
- **Discriminated unions** for functions that can fail
  ```typescript
  type KillResult = { success: true } | { success: false; error: string };
  ```
- **Empty arrays** for safe fallback (not `null` or throwing)
  ```typescript
  try {
    // ... parse lsof output
    return ports;
  } catch {
    return [];  // Graceful degradation
  }
  ```

### Try/Catch Usage
- **Wrap external commands**: `execSync` always in try/catch
- **Never throw from pure functions**: Return error values instead
- **Type error objects**: Use `instanceof Error` to narrow `unknown` catch bindings
  ```typescript
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }
  ```

### User-Facing Messages
- **Neutral phrasing**: Don't assume the cause
  ```typescript
  // GOOD: covers all cases
  "No listening ports found."

  // BAD: may be false
  "No servers are running."
  ```
- **Actionable feedback**: Tell user what happened
  ```typescript
  `Failed: ${result.error}`
  `Killed ${selectedPort.process} (${selectedPort.pid})`
  ```

---

## 6. Testing Standards

### Test Organization
```
tests/
└── app.test.tsx    # Mirrors src/app.tsx
```
- **One test file per component**: `tests/ComponentName.test.tsx`
- **Mirrors source structure**: Same folder hierarchy as `src/`

### Test Naming
- **describe blocks**: Component or function name
  ```typescript
  describe('App', () => { ... })
  describe('getPorts', () => { ... })
  ```
- **it blocks**: Short behavior description (not full sentences)
  ```typescript
  it('renders the port list from getPorts', () => { ... })
  it('enters search mode when / is pressed', async () => { ... })
  ```

### Mock Patterns
- **Module-level mocks**: Place at top of file, before imports
  ```typescript
  vi.mock('../src/utils/getPorts.js', () => ({
    getPorts: vi.fn(),
  }));
  ```
- **Named exports**: Mock must match actual export structure exactly

### Async Testing with Ink
- **tick() function**: Allows React 18's MessageChannel scheduler to flush
  ```typescript
  const tick = () => new Promise<void>(resolve => setTimeout(resolve, 10));
  ```
- **Before stdin.write()**: Wait for `useInput` effect to register listener
- **After stdin.write()**: Wait for state updates to re-render
  ```typescript
  await tick();
  result.stdin.write('/');
  await tick();
  ```
- **NO fake timers**: `vi.useFakeTimers()` breaks React's scheduler

### Cleanup Requirements
- **afterEach unmount**: Always call `unmount()` to stop intervals/timers
  ```typescript
  afterEach(() => {
    unmount?.();
    unmount = undefined;
  });
  ```

### Coverage Expectations
- **Provider**: v8
- **Reporters**: text, lcov
- **Included**: All `.ts` and `.tsx` in `src/`
- **Excluded**: `src/types.ts` (type-only, cannot be instrumented)
- **No coverage target enforced**: Aim for meaningful tests, not arbitrary %

---

## 7. Build & Deployment

### Build Tool: esbuild
**Configuration** (from `package.json`):
```json
{
  "scripts": {
    "build": "esbuild bin/ports.tsx --bundle --platform=node --target=node18 --format=esm --jsx=automatic --loader:.ts=ts --loader:.tsx=tsx --loader:.js=jsx --loader:.jsx=jsx --outfile=dist/ports.js --banner:js='#!/usr/bin/env node' --external:react --external:ink && chmod +x dist/ports.js"
  }
}
```

### Build Standards
- **Format**: ESM (`--format=esm`)
  - Matches `package.json` `"type": "module"`
- **Platform**: Node (`--platform=node`)
- **Target**: Node 18+ (`--target=node18`)
- **JSX**: Automatic runtime (`--jsx=automatic`)
- **Shebang**: Injected via `--banner:js='#!/usr/bin/env node'`
- **Executable**: `chmod +x dist/ports.js` after build
- **External deps**: `react`, `ink` (loaded from `node_modules` at runtime)

### Pre-Publish Hook
```json
"prepublishOnly": "npm run build"
```
Ensures dist/ is always fresh before publishing to npm.

### Entry Points
- **Source**: `bin/ports.tsx` (boots Ink runtime)
- **Built**: `dist/ports.js` (bundled, executable)
- **Package bin**: `{ "ports": "./dist/ports.js" }`

### Files Shipped to npm
```json
"files": ["dist"]
```
Only the built bundle ships; source code excluded.

---

## 8. Dependency Policies

### Production Dependencies
```json
{
  "ink": "^4",
  "react": "^18"
}
```
- **Minimize external deps**: Only add when essential
- **Ink v4 required**: Stable API, ESM-native
- **React 18+**: Required by Ink v4

### Development Dependencies
- **TypeScript**: Type checking only (not for build)
- **esbuild**: Bundler for CLI distribution
- **vitest**: Test runner with v8 coverage
- **ink-testing-library v4**: Matches Ink v4 API

### External Dependency Rules
- **Mark as external in esbuild**: `--external:react --external:ink`
  - These are loaded from `node_modules` at runtime
  - Reduces bundle size and avoids version conflicts
- **No unused deps**: Remove from package.json if not imported
- **Exact versions in lock**: `package-lock.json` must be committed

---

## 9. React/Ink-Specific Patterns

### Component Structure
```typescript
interface ComponentProps {
  value: string;
  isActive: boolean;
}

export function Component({ value, isActive }: ComponentProps) {
  return (
    <Box>
      <Text>{value}</Text>
    </Box>
  );
}
```
- **Destructure props** in function signature
- **No prop spreading**: Be explicit about what gets passed

### useEffect Patterns
- **Return cleanup function** for all effects with timers/intervals
  ```typescript
  useEffect(() => {
    const timer = setTimeout(() => { ... }, 2000);
    return () => clearTimeout(timer);
  }, [dependency]);
  ```
- **Empty dependency array** for mount-once effects (polling interval)
- **Sync effects** to update state when derived values diverge
  ```typescript
  useEffect(() => {
    if (selectedIndex !== clampedIndex) {
      setSelectedIndex(clampedIndex);
    }
  }, [clampedIndex, selectedIndex]);
  ```

### useInput Pattern
- **Single handler** in root component (`app.tsx`)
- **No event bubbling**: Ink calls handler for every keypress
- **Early returns**: Priority order with explicit returns
  ```typescript
  useInput((input, key) => {
    if (key.ctrl && input === 'c') { exit(); return; }
    if (mode === 'navigate') {
      if (input === 'q') { exit(); return; }
      // ...
      return;
    }
    // ...
  });
  ```

### Layout Constants
- **Named exports** from component for shared dimensions
  ```typescript
  // PortRow.tsx
  export const COL_PORT = 8;
  export const COL_PID = 8;

  // PortList.tsx imports these to align headers
  import { COL_PORT, COL_PID } from './PortRow.js';
  ```

---

## 10. Git & Version Control

### Commit Messages
- **Imperative mood**: "Add feature" not "Added feature"
- **Concise**: 1-2 sentences max
- **Focus on why**: Not what (diff shows what)
- **Co-author attribution**: Include when pair programming
  ```
  Add search mode with live filtering

  Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
  ```

### Branch Strategy
- **main**: Production-ready code
- **Feature branches**: Short-lived, merged via PR

### Files to Commit
- **Source**: All `.ts`, `.tsx`, `.json`, `.md`
- **Config**: `tsconfig.json`, `package.json`, `vitest.config.ts`
- **Lock file**: `package-lock.json` (ensures reproducible builds)
- **Built artifacts**: `dist/` committed (enables `npx` usage without build step)

### Files to Ignore (.gitignore)
```
node_modules/
coverage/
*.log
.DS_Store
```

---

## 11. Node.js & CLI Standards

### execSync Usage
- **Timeout required**: Prevent hangs on stale mounts
  ```typescript
  execSync('lsof ...', { timeout: 5000 });
  ```
- **Redirect stderr**: Silence expected errors
  ```bash
  lsof ... 2>/dev/null
  ```
- **UTF-8 encoding**: Always specify
  ```typescript
  execSync('...', { encoding: 'utf8' });
  ```

### PID Handling
- **String type**: Keep as string until exec
  ```typescript
  pid: string;  // From lsof, passed to kill
  ```
- **Validation**: Parse with radix 10, reject ≤ 0
  ```typescript
  const safePid = parseInt(pid, 10);
  if (isNaN(safePid) || safePid <= 0) {
    return { success: false, error: 'Invalid PID' };
  }
  ```

### Signal Choice
- **SIGKILL (kill -9)**: Unblockable, immediate termination
- **Rationale**: Developer tool prioritizes speed over graceful shutdown
- **Trade-off documented**: User warned in killPort.ts JSDoc

---

## Summary Checklist

When reviewing code, verify:

**Style**
- [ ] Single quotes, no semicolons
- [ ] 2-space indentation
- [ ] Named exports only
- [ ] `.js` extensions on all relative imports
- [ ] Import order: external → types → internal

**Architecture**
- [ ] State lives in `app.tsx` only
- [ ] Components are presentational (props in, JSX out)
- [ ] Types imported from `types.ts`, not `app.tsx`
- [ ] No circular dependencies

**TypeScript**
- [ ] Strict mode enabled
- [ ] Explicit return types on exports
- [ ] No `any`, use `unknown`
- [ ] Discriminated unions for success/error

**Documentation**
- [ ] File-level JSDoc with `@file` and `@description`
- [ ] Exported functions have `@param` and `@returns`
- [ ] Comments explain why, not what
- [ ] Edge cases documented

**Testing**
- [ ] Tests mirror `src/` structure
- [ ] `tick()` before and after stdin writes
- [ ] `unmount()` in `afterEach`
- [ ] No fake timers with Ink tests

**Build**
- [ ] ESM format (`--format=esm`)
- [ ] Shebang in built output
- [ ] External: `react`, `ink`
- [ ] `prepublishOnly` runs build
