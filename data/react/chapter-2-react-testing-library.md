# Chapter 2: React Testing Library — Coverage, Use Cases & Practical Stories

## The Testing Philosophy

React Testing Library (RTL) was created by Kent C. Dodds with a guiding principle:

> *"The more your tests resemble the way your software is used, the more confidence they can give you."*

This contrasts with enzyme's component-internals-first approach. RTL tests interaction through the DOM — **what the user sees and does** — not component methods, state, or implementation details.

### The Testing Trophy

Kent C. Dodds advocates for the **Testing Trophy** over the traditional Testing Pyramid:

```
        ╔══════╗
        ║  e2e  ║       ← Few, expensive (Playwright, Cypress)
        ╚══════╝
      ╔══════════╗
      ║Integration║      ← Most valuable — test components + hooks together
      ╚══════════╝
    ╔══════════════╗
    ║    Unit       ║    ← Pure functions, utilities, hooks in isolation
    ╚══════════════╝
  ╔══════════════════╗
  ║   Static (types)  ║  ← TypeScript, ESLint — huge ROI
  ╚══════════════════╝
```

---

## Setup and Configuration

### Installation

```bash
npm install -D @testing-library/react @testing-library/user-event @testing-library/jest-dom vitest jsdom
```

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: ['node_modules/', 'src/test/', '**/*.d.ts', '**/*.config.*'],
    },
  },
});
```

### src/test/setup.ts

```typescript
import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => cleanup());
```

### Custom render() with Providers

```typescript
// src/test/test-utils.tsx
import { ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, MemoryRouterProps } from 'react-router-dom';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: MemoryRouterProps['initialEntries'];
  queryClient?: QueryClient;
}

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    initialEntries = ['/'],
    queryClient = createTestQueryClient(),
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>
          {children}
        </MemoryRouter>
      </QueryClientProvider>
    );
  }
  return { queryClient, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

export * from '@testing-library/react';
export { renderWithProviders as render };
```

---

## Core API

### Query Priority Order

```typescript
// 1. Preferred — by role (what screen readers see)
screen.getByRole('button', { name: /submit/i });
screen.getByRole('heading', { name: /welcome/i, level: 1 });
screen.getByRole('textbox', { name: /email/i });

// 2. By label text — for form fields
screen.getByLabelText(/password/i);

// 3. By text — for non-interactive elements
screen.getByText(/invalid email/i);

// 4. Last resort — test id
screen.getByTestId('product-list');
```

### Query Variants

```typescript
// getBy* — throws if not found
screen.getByRole('button', { name: /save/i });

// queryBy* — returns null if not found (assert absence)
expect(screen.queryByText(/Error/)).not.toBeInTheDocument();

// findBy* — async version
const data = await screen.findByText(/John Doe/);

// getAllBy* — multiple elements
const items = screen.getAllByRole('listitem');
expect(items).toHaveLength(5);
```

---

## userEvent vs fireEvent

**Always prefer `userEvent`**.

```typescript
import userEvent from '@testing-library/user-event';
const user = userEvent.setup();

// ❌ fireEvent — synthetic, misses focus/pointer behavior
fireEvent.click(button);
fireEvent.change(input, { target: { value: 'hello' } });

// ✅ userEvent — realistic simulation
await user.click(button);
await user.type(input, 'hello');
await user.clear(input);
await user.selectOptions(select, 'value');
await user.tab();
await user.keyboard('{Enter}');
```

---

## Average Test Coverage Targets

| Coverage Level | Context |
|---|---|
| 0–40% | Prototype / internal tools |
| 40–60% | Early-stage startup, basic flow coverage |
| 60–75% | Standard for most production apps |
| **75–85%** | **Sweet spot — good ROI, no over-testing** |
| 85–95% | Fintech, health, e-commerce checkout |
| 95–100% | Usually diminishing returns / trivial code |

### What to Always Test

- ✅ User-facing interactions (clicks, form submissions, navigation)
- ✅ Authentication flows
- ✅ Error states (API errors, form validation)
- ✅ Loading states and async behavior
- ✅ Critical business logic in custom hooks
- ✅ Accessibility

### What NOT to Test

- ❌ Third-party library internals
- ❌ Implementation details (state variable names)
- ❌ Trivial render smoke tests
- ❌ CSS classes or styling details

---

## Practical Stories

### Story 1 — Testing a Login Form

```tsx
// LoginForm.tsx
export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} aria-label="Sign in form">
      <label htmlFor="email">Email</label>
      <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
      <label htmlFor="password">Password</label>
      <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
      {error && <p id="form-error" role="alert">{error}</p>}
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
}
```

```typescript
// LoginForm.test.tsx
vi.mock('@/stores/auth');
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useNavigate: () => mockNavigate,
}));

describe('LoginForm', () => {
  const user = userEvent.setup();
  const mockLogin = vi.fn();

  beforeEach(() => {
    vi.mocked(useAuthStore).mockReturnValue(mockLogin as any);
    mockNavigate.mockClear();
    mockLogin.mockClear();
  });

  it('renders form fields', () => {
    render(<LoginForm />);
    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('submits and redirects on success', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'pass123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard'));
  });

  it('shows error on failure', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'x@y.com');
    await user.type(screen.getByLabelText(/password/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('disables button while loading', async () => {
    mockLogin.mockImplementation(() => new Promise(() => {}));
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'u@e.com');
    await user.type(screen.getByLabelText(/password/i), 'pass');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
  });
});
```

---

### Story 2 — Async Data Fetching with React Query

```typescript
// ProductList.test.tsx
vi.mock('@/api/products');

describe('ProductList', () => {
  it('shows loading state', () => {
    vi.mocked(fetchProducts).mockImplementation(() => new Promise(() => {}));
    render(<ProductList category="electronics" />);
    expect(screen.getByRole('status')).toHaveTextContent(/loading/i);
  });

  it('renders products after load', async () => {
    vi.mocked(fetchProducts).mockResolvedValueOnce([
      { id: '1', name: 'Keyboard', price: 149.99 },
      { id: '2', name: 'Mouse', price: 49.99 },
    ]);
    render(<ProductList category="electronics" />);

    await screen.findByRole('list');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('Keyboard')).toBeInTheDocument();
  });

  it('shows error state on failure', async () => {
    vi.mocked(fetchProducts).mockRejectedValueOnce(new Error('Network'));
    render(<ProductList category="electronics" />);
    expect(await screen.findByRole('alert')).toHaveTextContent(/failed/i);
  });
});
```

---

### Story 3 — Testing Custom Hooks

```typescript
// useCounter.test.ts
describe('useCounter', () => {
  it('starts at initial value', () => {
    const { result } = renderHook(() => useCounter(10));
    expect(result.current.count).toBe(10);
  });

  it('increments', () => {
    const { result } = renderHook(() => useCounter(0));
    act(() => result.current.increment());
    expect(result.current.count).toBe(1);
  });

  it('respects max boundary', () => {
    const { result } = renderHook(() => useCounter(3, { max: 3 }));
    act(() => result.current.increment());
    expect(result.current.count).toBe(3);
  });

  it('resets to initial', () => {
    const { result } = renderHook(() => useCounter(5));
    act(() => result.current.increment());
    act(() => result.current.reset());
    expect(result.current.count).toBe(5);
  });
});
```

---

## Mock Service Worker (MSW)

MSW intercepts requests at the network level — the most realistic approach:

```typescript
// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/products', () =>
    HttpResponse.json([
      { id: '1', name: 'Keyboard', price: 149.99 },
    ])
  ),

  http.post('/api/auth/login', async ({ request }) => {
    const { email, password } = await request.json();
    if (email === 'user@example.com' && password === 'password123') {
      return HttpResponse.json({ token: 'fake-jwt' });
    }
    return HttpResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }),
];

// src/mocks/server.ts
import { setupServer } from 'msw/node';
export const server = setupServer(...handlers);

// src/test/setup.ts
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

## Common Mistakes

| Mistake | Better Approach |
|---|---|
| `getByTestId` for everything | `getByRole` with name |
| `fireEvent.click()` | `await user.click()` |
| Asserting on state values | Assert on what the user sees |
| Testing implementation details | Test behavior from user's perspective |
| Brittle snapshot tests | Specific `expect(el).toHaveTextContent(...)` |
| Not mocking network calls | Use MSW for network-level mocking |
