# Chapter 4: Modern React.js Practices

## The Modern React Landscape (2024–2025)

React has evolved dramatically. Gone are class components, lifecycle methods like `componentDidMount`, and spaghetti prop drilling. Modern React is:

- **Hooks-first** — all logic in functional components with hooks
- **Server-aware** — React Server Components blur the client/server line
- **Concurrent** — `useTransition`, `Suspense`, and `useDeferredValue` for smooth UIs
- **Typed** — TypeScript is now the de facto standard
- **Composition-driven** — small, focused hooks and components

---

## Project Structure

A well-organized React app uses a **feature-first** (vertical slice) structure rather than a type-based structure:

```
src/
  features/
    auth/
      components/
        LoginForm.tsx
        LoginForm.test.tsx
      hooks/
        useAuth.ts
        useAuth.test.ts
      api/
        authApi.ts
      store/
        authStore.ts
      index.ts            ← feature public API / barrel export
    products/
      components/
      hooks/
      api/
      store/
      index.ts
    checkout/
      ...
  shared/
    components/           ← truly reusable, feature-agnostic UI
      Button/
        Button.tsx
        Button.test.tsx
        Button.stories.tsx
      Modal/
      Input/
    hooks/
      useDebounce.ts
      useLocalStorage.ts
      useMediaQuery.ts
    utils/
      formatting.ts
      validation.ts
    types/
      api.d.ts
  app/
    Router.tsx
    store.ts
    App.tsx
  main.tsx
```

**Feature barrel exports** allow clean imports:
```typescript
// Outside the feature:
import { LoginForm, useAuth } from '@/features/auth';
// Not:
import { LoginForm } from '@/features/auth/components/LoginForm';
```

---

## Hooks Patterns

### useReducer for Complex State

When a component has multiple related state fields or complex update logic, `useReducer` is cleaner than multiple `useState` calls:

```typescript
type FormState = {
  values: { email: string; password: string };
  errors: Record<string, string>;
  isSubmitting: boolean;
};

type FormAction =
  | { type: 'SET_FIELD'; field: string; value: string }
  | { type: 'SET_ERROR'; field: string; message: string }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'SUBMIT_ERROR'; errors: Record<string, string> };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FIELD':
      return {
        ...state,
        values: { ...state.values, [action.field]: action.value },
        errors: { ...state.errors, [action.field]: '' }, // clear error on change
      };
    case 'SUBMIT_START':
      return { ...state, isSubmitting: true };
    case 'SUBMIT_SUCCESS':
      return { ...state, isSubmitting: false };
    case 'SUBMIT_ERROR':
      return { ...state, isSubmitting: false, errors: action.errors };
    default:
      return state;
  }
}

function LoginForm() {
  const [state, dispatch] = useReducer(formReducer, {
    values: { email: '', password: '' },
    errors: {},
    isSubmitting: false,
  });

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_FIELD', field, value: e.target.value });
  };

  // ...
}
```

### Custom Hooks — Extracting Reusable Logic

```typescript
// hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// hooks/useLocalStorage.ts
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('localStorage error:', error);
    }
  };

  return [storedValue, setValue] as const;
}

// hooks/useMediaQuery.ts
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

// Usage
const isMobile = useMediaQuery('(max-width: 768px)');
const isLarge = useMediaQuery('(min-width: 1200px)');
```

### useCallback and useMemo — When They Actually Help

```typescript
// ❌ WRONG — useCallback on everything is cargo cult
const handleClick = useCallback(() => setCount(c => c + 1), []);
// This costs memory and computation for no benefit — the saved function
// is rarely the bottleneck

// ✅ Correct — use useCallback when the function is a dependency of a child
// component wrapped in React.memo, or is used in useEffect dependencies
const fetchData = useCallback(async () => {
  const data = await api.getData(userId);
  setData(data);
}, [userId]); // userId in deps means fetchData is stable unless userId changes

useEffect(() => {
  fetchData();
}, [fetchData]); // stable reference = no infinite loop

// ✅ useMemo — for genuinely expensive computations
const sortedAndFilteredProducts = useMemo(
  () =>
    products
      .filter(p => p.category === selectedCategory)
      .sort((a, b) => a.price - b.price),
  [products, selectedCategory]
);
```

---

## React.memo

```tsx
// Only re-renders if props change (shallow comparison)
const ProductCard = React.memo(function ProductCard({ product, onAddToCart }: Props) {
  return (
    <div>
      <h3>{product.name}</h3>
      <span>{product.price}</span>
      <button onClick={() => onAddToCart(product.id)}>Add to cart</button>
    </div>
  );
});

// Custom comparison function
const ProductCard = React.memo(
  function ProductCard({ product, onAddToCart }: Props) { /* */ },
  (prevProps, nextProps) =>
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.price === nextProps.product.price
);

// For memo to be effective — pass stable callbacks
function ProductList({ products }: { products: Product[] }) {
  const { addToCart } = useCartStore();

  // ✅ Stable function from Zustand selector doesn't change on re-render
  return products.map(p => (
    <ProductCard key={p.id} product={p} onAddToCart={addToCart} />
  ));
}
```

---

## Concurrent Features

### useTransition — Non-Blocking State Updates

```tsx
import { useState, useTransition } from 'react';

function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleSearch = (value: string) => {
    setQuery(value); // Urgent update — reflects immediately

    startTransition(() => {
      // Non-urgent update — can be interrupted by more urgent work
      const filtered = expensiveSearch(allProducts, value);
      setResults(filtered);
    });
  };

  return (
    <div>
      <input value={query} onChange={e => handleSearch(e.target.value)} />
      {isPending && <Spinner />}
      <ul>
        {results.map(p => <li key={p.id}>{p.name}</li>)}
      </ul>
    </div>
  );
}
```

### useDeferredValue — Defer Expensive Re-renders

```tsx
import { useDeferredValue, memo } from 'react';

function ProductGrid({ query }: { query: string }) {
  const deferredQuery = useDeferredValue(query);
  const isStale = query !== deferredQuery;

  return (
    <div style={{ opacity: isStale ? 0.6 : 1 }}>
      {/* This renders with the previous query until the deferred value catches up */}
      <ExpensiveList query={deferredQuery} />
    </div>
  );
}
```

### Suspense for Data Fetching

```tsx
import { Suspense } from 'react';

// With React Query (requires experimental suspense mode)
function ProductDetail({ id }: { id: string }) {
  const { data } = useSuspenseQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProduct(id),
  });

  // Always has data here — no isLoading check needed
  return <div>{data.name}</div>;
}

// In parent
function ProductPage({ id }: { id: string }) {
  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      <ErrorBoundary fallback={<ErrorMessage />}>
        <ProductDetail id={id} />
      </ErrorBoundary>
    </Suspense>
  );
}
```

---

## React Server Components (RSC)

React Server Components (Next.js App Router) run only on the server. They can directly access databases, file systems, and secrets — without adding any JavaScript to the client bundle.

```tsx
// app/products/page.tsx — Server Component (default in App Router)
// No 'use client' directive = runs on server only
import { db } from '@/lib/db';

export default async function ProductsPage() {
  // Direct database access — no API layer needed
  const products = await db.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return (
    <main>
      <h1>Products</h1>
      {/* ProductGrid is a Server Component — no JS bundle */}
      <ProductGrid products={products} />
      {/* AddToCartButton needs interactivity — must be a Client Component */}
      <Suspense fallback={<Skeleton />}>
        <FeaturedBanner />
      </Suspense>
    </main>
  );
}
```

```tsx
// components/AddToCartButton.tsx — Client Component
'use client'; // Opt into client-side rendering

import { useCartStore } from '@/stores/cart';

export function AddToCartButton({ productId }: { productId: string }) {
  const addToCart = useCartStore(state => state.addToCart);

  return (
    <button onClick={() => addToCart(productId)}>
      Add to cart
    </button>
  );
}
```

**RSC mental model:**
- No `useState`, `useEffect`, event handlers → Server Component
- Needs interactivity, browser APIs, React state → `'use client'` Client Component
- Server Components can import Client Components (but not vice versa)
- Pass Server Component output as `children` prop to Client Components

---

## Error Boundaries

```tsx
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback: ReactNode | ((error: Error, reset: () => void) => ReactNode);
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
    // Send to error tracking: Sentry.captureException(error)
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      const { fallback } = this.props;
      return typeof fallback === 'function'
        ? fallback(this.state.error, this.reset)
        : fallback;
    }
    return this.props.children;
  }
}

// react-error-boundary library (recommended)
import { ErrorBoundary } from 'react-error-boundary';

<ErrorBoundary
  FallbackComponent={({ error, resetErrorBoundary }) => (
    <div>
      <p>Something went wrong: {error.message}</p>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  )}
  onError={(error) => Sentry.captureException(error)}
>
  <ProductDetail id={id} />
</ErrorBoundary>
```

---

## Forms — React Hook Form

React Hook Form (RHF) is the modern standard for forms. It uses uncontrolled inputs with refs, which is high-performance by default:

```tsx
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'At least 8 characters'),
  age: z.number().min(18, 'Must be 18+'),
  role: z.enum(['admin', 'user', 'moderator']),
});

type FormValues = z.infer<typeof schema>;

function SignupForm() {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'user' },
  });

  const onSubmit = async (data: FormValues) => {
    await api.createUser(data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} placeholder="Email" />
      {errors.email && <span>{errors.email.message}</span>}

      <input {...register('password')} type="password" />
      {errors.password && <span>{errors.password.message}</span>}

      {/* Controller for custom inputs / component libraries */}
      <Controller
        name="role"
        control={control}
        render={({ field }) => (
          <Select {...field} options={['admin', 'user', 'moderator']} />
        )}
      />

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create account'}
      </button>
    </form>
  );
}
```

---

## Code Splitting

```tsx
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

// These are loaded only when the route is visited — not in the main bundle
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const ProductsPage = lazy(() => import('@/pages/ProductsPage'));
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage'));

function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
      </Routes>
    </Suspense>
  );
}
```

---

## Performance Patterns

### Virtualization for Long Lists

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

function VirtualProductList({ products }: { products: Product[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: products.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // estimated row height in px
    overscan: 5,
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <ProductRow product={products[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Context API — Avoid Re-render Cascades

```tsx
// ❌ Single context with mixed concerns — any update re-renders all consumers
const AppContext = createContext({ user: null, theme: 'light', cart: [] });

// ✅ Split contexts by update frequency
const UserContext = createContext<User | null>(null);
const ThemeContext = createContext<'light' | 'dark'>('light');
const CartContext = createContext<CartState | null>(null);

// ✅ Use selector pattern (Zustand makes this easy)
const { count } = useCartStore(state => ({ count: state.items.length }));
// CartStore re-renders this component only when items.length changes
```

---

## TypeScript Patterns for React

```typescript
// Component props with optional and required
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  className?: string;
}

// Polymorphic component (renders as different element)
interface TextProps<T extends React.ElementType = 'span'> {
  as?: T;
  children: React.ReactNode;
}
type Props<T extends React.ElementType> = TextProps<T> &
  Omit<React.ComponentPropsWithoutRef<T>, keyof TextProps<T>>;

function Text<T extends React.ElementType = 'span'>({ as, children, ...rest }: Props<T>) {
  const Component = as ?? 'span';
  return <Component {...rest}>{children}</Component>;
}
// Usage: <Text as="h1" className="title">Hello</Text>
// Usage: <Text as="a" href="/about">About</Text>

// Generic component
interface SelectProps<T> {
  options: T[];
  value: T | null;
  onChange: (value: T) => void;
  getLabel: (option: T) => string;
  getValue: (option: T) => string;
}

function Select<T>({ options, value, onChange, getLabel, getValue }: SelectProps<T>) {
  return (
    <select
      value={value ? getValue(value) : ''}
      onChange={e => {
        const selected = options.find(o => getValue(o) === e.target.value);
        if (selected) onChange(selected);
      }}
    >
      {options.map(option => (
        <option key={getValue(option)} value={getValue(option)}>
          {getLabel(option)}
        </option>
      ))}
    </select>
  );
}
```

---

## Summary of Modern React Best Practices

| Practice | Recommendation |
|---|---|
| Component type | Always functional; class components only for error boundaries |
| State management | useState → useReducer → Zustand/Jotai (by complexity) |
| Data fetching | React Query / SWR — not useEffect with fetch |
| Forms | React Hook Form + Zod |
| Routing | React Router v6 or Next.js App Router |
| Styling | CSS Modules, Tailwind, or CSS-in-JS (styled-components) |
| Type safety | TypeScript everywhere |
| Testing | Vitest + RTL, ~80% meaningful coverage |
| Bundler | Vite (for SPAs), Next.js (for SSR/RSC) |
| Memoization | Use sparingly — profile first, optimize after |
| Code splitting | Route-level by default, component-level when needed |
