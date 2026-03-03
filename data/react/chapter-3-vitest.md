# Chapter 3: Vitest — The Modern Unit Testing Framework

## What is Vitest?

**Vitest** is a blazing-fast unit testing framework powered by Vite. It was built to be the natural testing solution for Vite-based projects (and works great standalone too). It shares Vite's configuration and plugin pipeline, meaning you get the same transforms, aliases, and environment your app uses — no separate babel config, no divergence.

Key properties:
- **Vite-native** — reuses your `vite.config.ts`
- **Jest-compatible API** — migrate from Jest with minimal changes
- **Extremely fast** — leverages ESM, parallelism, and smart watch mode
- **Built-in TypeScript** — no `@types/jest` or babel transforms needed
- **Component testing** — supports browser mode via playwright
- **Snapshot testing, mocking, coverage** — all built in

---

## Installation and Setup

### New Vite project

```bash
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

### Adding to an existing Vite app

```bash
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @vitest/coverage-v8 @vitest/ui
```

---

## Configuration

Vitest reads from `vite.config.ts` or a dedicated `vitest.config.ts`:

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    // Test environment
    environment: 'jsdom',   // or 'node', 'happy-dom', 'edge-runtime'

    // Global APIs — no need to import describe/it/expect in every file
    globals: true,

    // Setup files run before each test file
    setupFiles: ['./src/test/setup.ts'],

    // File patterns
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'e2e/**'],

    // Coverage
    coverage: {
      provider: 'v8',                     // or 'istanbul'
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**'],
      exclude: [
        'src/test/**',
        'src/**/*.d.ts',
        'src/**/index.ts',                 // barrel exports
        'src/**/*.stories.tsx',
      ],
      thresholds: {
        lines: 75,
        functions: 75,
        branches: 75,
        statements: 75,
      },
    },

    // Watch mode configuration
    watch: true,

    // Timeout per test (ms)
    testTimeout: 10_000,
    hookTimeout: 10_000,

    // Pool: threads (default), forks, vmThreads
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
      },
    },

    // Reporters
    reporters: ['verbose'],   // default, verbose, dot, junit, html (with @vitest/ui)
  },
});
```

### package.json scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "test:watch": "vitest --watch"
  }
}
```

---

## Core API

Vitest's API is a superset of Jest's — almost a drop-in replacement.

### Test Organization

```typescript
import { describe, it, test, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';

describe('Calculator', () => {
  describe('add()', () => {
    it('adds two positive numbers', () => {
      expect(add(2, 3)).toBe(5);
    });

    it('handles negative numbers', () => {
      expect(add(-1, 1)).toBe(0);
    });
  });

  // Aliases
  test('subtract works', () => {
    expect(subtract(5, 3)).toBe(2);
  });

  // Only run this test
  it.only('focused test', () => {});

  // Skip this test
  it.skip('skipped test', () => {});

  // Run with dynamic sets of data
  it.each([
    [1, 2, 3],
    [0, 0, 0],
    [-1, -2, -3],
  ])('add(%i, %i) = %i', (a, b, expected) => {
    expect(add(a, b)).toBe(expected);
  });

  // Template literal version
  it.each`
    a    | b    | expected
    ${1} | ${2} | ${3}
    ${0} | ${5} | ${5}
  `('$a + $b = $expected', ({ a, b, expected }) => {
    expect(add(a, b)).toBe(expected);
  });
});
```

---

## Matchers

```typescript
// Equality
expect(value).toBe(42);           // strict equality (===)
expect(obj).toEqual({ a: 1 });    // deep equality
expect(obj).toStrictEqual({ a: 1 }); // strict deep equality (checks undefined keys)

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();
expect(value).toBeDefined();

// Numbers
expect(0.1 + 0.2).toBeCloseTo(0.3, 5);
expect(count).toBeGreaterThan(0);
expect(count).toBeGreaterThanOrEqual(1);
expect(count).toBeLessThan(100);

// Strings
expect(str).toContain('hello');
expect(str).toMatch(/^hello/);

// Arrays
expect(arr).toHaveLength(3);
expect(arr).toContain('item');
expect(arr).toEqual(expect.arrayContaining(['a', 'b']));

// Objects
expect(obj).toHaveProperty('name', 'Alice');
expect(obj).toMatchObject({ role: 'admin' }); // partial match

// Errors
expect(() => badFn()).toThrow();
expect(() => badFn()).toThrow(TypeError);
expect(() => badFn()).toThrow(/Expected a number/);

// Async errors
await expect(asyncFn()).rejects.toThrow('forbidden');
await expect(asyncFn()).resolves.toEqual({ data: 'ok' });

// DOM matchers (from @testing-library/jest-dom)
expect(el).toBeInTheDocument();
expect(el).toBeVisible();
expect(el).toBeDisabled();
expect(el).toHaveTextContent('hello');
expect(el).toHaveValue('input value');
expect(el).toHaveClass('active');
expect(el).toHaveAttribute('aria-label', 'submit');
expect(el).toHaveFocus();
```

---

## Mocking

### vi.fn() — Function Mocks

```typescript
import { vi, expect } from 'vitest';

const mockFn = vi.fn();

// Call it
mockFn('hello', 42);

// Assert calls
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledTimes(1);
expect(mockFn).toHaveBeenCalledWith('hello', 42);
expect(mockFn).toHaveBeenLastCalledWith('hello', 42);

// Set return values
mockFn.mockReturnValue('fixed');
mockFn.mockReturnValueOnce('first call').mockReturnValueOnce('second call');

// Async mocks
mockFn.mockResolvedValue({ data: 'ok' });
mockFn.mockRejectedValueOnce(new Error('Boom'));

// Mock implementation
mockFn.mockImplementation((x: number) => x * 2);

// Spy on real function
const original = { greet: (name: string) => `Hello ${name}` };
const spy = vi.spyOn(original, 'greet');
original.greet('Alice'); // still calls real implementation
expect(spy).toHaveBeenCalledWith('Alice');

// Override implementation with spy
spy.mockImplementation((name) => `Hi ${name}`);

// Reset / restore
mockFn.mockClear();    // clears call history only
mockFn.mockReset();    // clears + resets implementation
mockFn.mockRestore();  // restores original (only for spies)
```

### vi.mock() — Module Mocking

```typescript
// Auto-mock entire module (replaces all exports with vi.fn())
vi.mock('./api/products');

// Mock with factory function
vi.mock('./api/products', () => ({
  fetchProducts: vi.fn().mockResolvedValue([
    { id: '1', name: 'Keyboard', price: 149 },
  ]),
  fetchProduct: vi.fn().mockResolvedValue({ id: '1', name: 'Keyboard' }),
}));

// Partial mock — keep real implementations, override some
vi.mock('./utils/formatting', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./utils/formatting')>();
  return {
    ...actual,
    formatCurrency: vi.fn((amount) => `$${amount}`), // override just this one
  };
});

// Mock with dynamic value (accessed per-test)
const mockFetch = vi.fn();
vi.mock('./api/client', () => ({ get: mockFetch }));

describe('ProductService', () => {
  beforeEach(() => mockFetch.mockClear());

  it('fetches products', async () => {
    mockFetch.mockResolvedValueOnce({ data: [], status: 200 });
    await ProductService.getAll();
    expect(mockFetch).toHaveBeenCalledWith('/products');
  });
});
```

### vi.stubGlobal() — Mocking Global APIs

```typescript
// Mock fetch globally
vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ data: 'mocked' }),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
  removeItem: vi.fn(),
};
vi.stubGlobal('localStorage', localStorageMock);

// Mock window.location
vi.stubGlobal('location', { href: 'http://localhost/', assign: vi.fn() });
```

### Timers

```typescript
describe('debounce', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('executes after delay', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledOnce();
  });

  it('only executes once for multiple rapid calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced();
    debounced();
    debounced();
    vi.advanceTimersByTime(300);

    expect(fn).toHaveBeenCalledOnce();
  });

  it('uses system time with vi.setSystemTime', () => {
    vi.setSystemTime(new Date('2024-01-15'));
    const result = getFormattedDate();
    expect(result).toBe('January 15, 2024');
  });
});
```

---

## Snapshot Testing

```typescript
// Basic snapshot
it('renders correctly', () => {
  const { asFragment } = render(<Button label="Submit" />);
  expect(asFragment()).toMatchSnapshot();
});

// Inline snapshot — stored in the test file
it('renders inline', () => {
  const { asFragment } = render(<Tag>Sale</Tag>);
  expect(asFragment()).toMatchInlineSnapshot(`
    <DocumentFragment>
      <span class="tag">Sale</span>
    </DocumentFragment>
  `);
});

// Update snapshots: vitest run --update-snapshots
```

> ⚠️ Use snapshots sparingly. They break on any UI change and become maintenance burden. Prefer specific assertions.

---

## Environment Modes

```typescript
// Per-file environment override — JSDoc comment at top of file
// @vitest-environment node
// or
// @vitest-environment jsdom
// or
// @vitest-environment edge-runtime

// Global env in config
test: {
  environment: 'jsdom',   // jsdom (default for React)
                          // node (for Node.js utilities)
                          // happy-dom (faster jsdom alternative)
                          // edge-runtime (for Cloudflare Workers / Next.js edge)
}
```

---

## In-Source Testing

Vitest supports tests co-located with source code:

```typescript
// src/utils/math.ts
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// These are only included in test mode — zero production overhead
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;
  describe('clamp', () => {
    it('clamps to min', () => expect(clamp(-5, 0, 10)).toBe(0));
    it('clamps to max', () => expect(clamp(15, 0, 10)).toBe(10));
    it('passes through', () => expect(clamp(5, 0, 10)).toBe(5));
  });
}
```

Enable in config:
```typescript
test: {
  includeSource: ['src/**/*.{js,ts}'],
}
```

---

## Coverage

```bash
# Run with coverage
npx vitest run --coverage

# HTML report
npx vitest run --coverage --reporter=html
```

### Coverage Thresholds

```typescript
coverage: {
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 70,
    statements: 80,
    // File-specific (globs supported)
    'src/utils/**': { lines: 90 },
    'src/components/ui/**': { lines: 60 }, // UI components — less strict
  },
}
```

---

## Vitest UI

```bash
npx vitest --ui
```

The Vitest UI gives you a browser-based test runner with:
- File tree of all tests
- Live pass/fail status with watch mode
- Coverage inline in file view
- Graph of test dependencies
- Console output per test

---

## Comparing Vitest vs Jest

| Feature | Jest | Vitest |
|---|---|---|
| Transform | Babel / ts-jest | ESbuild / native ESM |
| Config | `jest.config.js` | `vite.config.ts` + `test:` |
| Speed | Moderate | 2–10x faster |
| TS support | Requires @types/jest | Native |
| Watch mode | Yes | Yes (smarter HMR-aware) |
| Mocking | Excellent | Equivalent |
| ESM support | Limited | First-class |
| Coverage | jest-coverage / istanbul | v8 or istanbul |
| Browser mode | No | Yes (experimental) |
| API compatibility | N/A | ~95% Jest compatible |
| Globals | Optional | Optional |

### Migration from Jest

```bash
# 1. Install vitest
npm install -D vitest

# 2. Update config (vitest.config.ts replaces jest.config.js)
# 3. Replace jest imports with vitest imports
# - "import { jest } from '@jest/globals'" → "import { vi } from 'vitest'"
# - "jest.fn()" → "vi.fn()"
# - "jest.mock()" → "vi.mock()"
# - "jest.spyOn()" → "vi.spyOn()"
# - "jest.useFakeTimers()" → "vi.useFakeTimers()"

# 4. Enable globals to avoid any import changes
test: { globals: true }
```

---

## Advanced: Custom Matchers

```typescript
// src/test/matchers.ts
import { expect } from 'vitest';

expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be within [${floor}, ${ceiling}]`
          : `expected ${received} to be within [${floor}, ${ceiling}]`,
    };
  },
});

// Usage
expect(42).toBeWithinRange(1, 100);
```

---

## Advanced: Concurrent Tests

```typescript
describe.concurrent('parallel tests', () => {
  // These run in parallel (safe for independent tests)
  it.concurrent('test 1', async () => { /* ... */ });
  it.concurrent('test 2', async () => { /* ... */ });
  it.concurrent('test 3', async () => { /* ... */ });
});
```

---

## Summary

Vitest is the obvious choice for modern React + Vite projects. Its Jest-compatible API means zero learning curve for existing Jest users, its speed is significantly better, and its deep Vite integration means you share one config, one transform pipeline, and one mental model across development and testing.
