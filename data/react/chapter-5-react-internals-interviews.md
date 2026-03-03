# Chapter 5: Deep Understanding of React Internals & Senior Interview Questions

## React's Architecture

### The Fiber Architecture

React 16 introduced **Fiber** — a complete rewrite of React's internal reconciliation engine. Before Fiber, React's reconciler was recursive and synchronous: once it started rendering, it couldn't be interrupted. This caused "jank" in complex UIs because a long render blocked the main thread.

Fiber solves this by making rendering **incremental and interruptible**.

**Fiber is a data structure** — a unit of work. Each component in the React tree corresponds to a fiber node:

```typescript
// Simplified Fiber node structure
interface FiberNode {
  // Component info
  type: string | Function | null;    // 'div', MyComponent, etc.
  key: string | null;
  
  // Instance
  stateNode: Element | ComponentInstance | null;  // DOM node or class instance
  
  // Tree pointers (singly linked list structure)
  return: FiberNode | null;    // parent fiber
  child: FiberNode | null;     // first child fiber
  sibling: FiberNode | null;   // next sibling fiber
  index: number;
  
  // State and effects
  pendingProps: any;
  memoizedProps: any;
  memoizedState: any;
  
  // Effect list
  flags: Flags;              // what effects need to happen (Placement, Update, Deletion)
  subtreeFlags: Flags;
  deletions: FiberNode[] | null;
  
  // Priority
  lanes: Lanes;              // priority lanes for concurrent features
  childLanes: Lanes;
  
  // Double buffering
  alternate: FiberNode | null;   // the "work in progress" twin
}
```

React maintains **two fiber trees**:
1. **current** — the tree currently rendered on screen
2. **workInProgress** — the tree being built during the render phase

This is called **double buffering**. When the workInProgress tree is complete, React atomically swaps them.

### Reconciliation

The reconciler compares the new React element tree with the existing fiber tree — this is the **diffing algorithm**:

1. **Same type, same key** → reuse the fiber, update its props
2. **Different type, same position** → destroy old fiber subtree, create new one
3. **Keys for lists** → enables efficient reordering

```tsx
// React uses key to identify elements in lists
// Without key — React assumes index == identity
// Adding/removing from the start confuses React

// ❌ Using index as key
{items.map((item, i) => <Item key={i} item={item} />)}

// ✅ Using stable unique ID
{items.map(item => <Item key={item.id} item={item} />)}
```

### Render, Commit, and Paint Phases

React's update cycle has three phases:

**1. Render Phase (pure, interruptible)**
- React calls your component functions and hooks
- Computes what changed by diffing
- Creates a list of "effects" (DOM mutations, ref assignments, hooks)
- Can be paused, abandoned, or resumed (this is what makes concurrent mode tick)
- Must be **pure** — no side effects (that's why `useEffect` runs after)

**2. Commit Phase (synchronous, not interruptible)**
- **beforeMutation** — `getSnapshotBeforeUpdate` for class components
- **mutation** — DOM mutations are applied (`useLayoutEffect` cleanup runs here)  
- **layout** — `useLayoutEffect` runs synchronously after DOM mutations
- Must complete synchronously — the DOM can't be in a half-mutated state

**3. Browser Paint**
- Browser paints the updated pixels
- `useEffect` runs asynchronously after paint (doesn't block the browser)

```
User action / setState()
        │
        ▼
  ┌─────────────────────────┐
  │   RENDER PHASE          │ ← Interruptible, pure
  │  Component functions    │
  │  Hooks (useState, etc)  │
  │  Diffing / reconcile    │
  └──────────┬──────────────┘
             │
             ▼
  ┌─────────────────────────┐
  │   COMMIT PHASE          │ ← Synchronous, not interruptible
  │  DOM mutations          │
  │  useLayoutEffect runs   │
  └──────────┬──────────────┘
             │
             ▼
       Browser paints
             │
             ▼
  ┌─────────────────────────┐
  │  useEffect runs         │ ← Asynchronous, after paint
  └─────────────────────────┘
```

---

## useState Deep Dive

### State is a Snapshot

React state is a **snapshot** taken at render time. Closures capture that snapshot:

```typescript
function Counter() {
  const [count, setCount] = useState(0);

  function handleClick() {
    setCount(count + 1);  // count is 0 here (snapshot from this render)
    setCount(count + 1);  // still 0! Multiple calls don't accumulate
    setCount(count + 1);  // still 0!
    // Result: count becomes 1, not 3
  }

  // ✅ Use updater function to get latest value
  function handleClickFixed() {
    setCount(prev => prev + 1);  // 0 → 1
    setCount(prev => prev + 1);  // 1 → 2
    setCount(prev => prev + 1);  // 2 → 3
    // Result: count becomes 3
  }
}
```

### Batching

React 18 introduced **automatic batching** — all state updates inside event handlers, `setTimeout`, Promises, and native event handlers are batched into a single re-render:

```typescript
// React 18 — all three setStates cause ONE re-render
setTimeout(() => {
  setLoading(false);   ─┐
  setData(result);      ├── batched → 1 render
  setError(null);      ─┘
}, 0);

// Pre-React 18 — only event handlers were batched; setTimeout caused 3 renders
// If you need to opt out of batching:
import { flushSync } from 'react-dom';
flushSync(() => setLoading(false));  // renders immediately
flushSync(() => setData(result));    // renders immediately
```

---

## useEffect Deep Dive

```typescript
useEffect(() => {
  // Setup — runs after every render where deps changed
  const subscription = subscribe(userId);

  return () => {
    // Cleanup — runs before next effect OR unmount
    subscription.unsubscribe();
  };
}, [userId]);  // dependencies array
```

### Strict Mode Double Invocation

In development + Strict Mode, React intentionally mounts → **unmounts → remounts** every component. This is specifically to help you find effects that don't clean up properly:

```typescript
// ❌ BUG — this will fire twice in dev
useEffect(() => {
  api.trackPageView('/products');  // fires twice in development
}, []);

// ✅ This is fine — cleanup ensures single active subscription
useEffect(() => {
  const sub = eventBus.subscribe('update', handler);
  return () => sub.unsubscribe();
}, []);
```

### Rules of Hooks

Hooks must be called at the **same order** in every render:

```typescript
// ❌ WRONG — conditional hook call
function Component({ userId }: Props) {
  if (!userId) return null;          // early return before hooks!
  const [data, setData] = useState([]); // called conditionally

  // ❌ Inside loops
  for (const item of items) {
    const [selected] = useState(false);
  }
}

// ✅ CORRECT — hooks before any conditional returns
function Component({ userId }: Props) {
  const [data, setData] = useState([]);
  const isLoaded = useFetch(userId);  // all hooks first

  if (!userId) return null;          // conditional return after hooks
}
```

---

## Virtual DOM

The Virtual DOM is a **JavaScript object representation of the DOM**. React uses it as a cheap in-memory intermediary to batch and minimize expensive real DOM mutations.

```typescript
// JSX compiles to React.createElement calls
const element = <div className="card"><h2>Title</h2></div>;

// Becomes (in React 19+, automatically via the new JSX transform):
const element = {
  type: 'div',
  props: {
    className: 'card',
    children: {
      type: 'h2',
      props: { children: 'Title' },
    },
  },
};
```

The reconciler diffs the new virtual DOM against the previous one and computes the minimal set of real DOM operations needed.

---

## 50+ Senior Interview Questions

### Hooks & State

**Q1: What is the difference between `useState` and `useRef`?**

`useState` triggers a re-render when its value changes. `useRef` holds a mutable value that persists across renders without causing re-renders. Use `useRef` for: DOM element references, storing previous values, timeout/interval IDs, or any mutable value you don't want to trigger renders.

**Q2: Explain `useLayoutEffect` vs `useEffect`. When would you use each?**

Both run after DOM mutations. `useLayoutEffect` runs **synchronously before the browser paints**. `useEffect` runs **asynchronously after the browser paints**. Use `useLayoutEffect` when you need to read DOM measurements (e.g., element size/position) and apply changes before the user sees a flicker. For everything else, prefer `useEffect`.

**Q3: What are the rules of hooks and why do they exist?**

1. Only call hooks at the top level (not inside conditions, loops, or nested functions)
2. Only call hooks from React function components or custom hooks

These rules exist because React relies on the ORDER of hook calls to associate state with the correct hook. If hooks are called conditionally, the order changes between renders and React can't match hook state correctly.

**Q4: How does `useCallback` differ from `useMemo`?**

`useMemo` memoizes a **computed value**: `const value = useMemo(() => compute(x), [x])`.  
`useCallback` memoizes a **function reference**: `const fn = useCallback(() => doThing(x), [x])`.  
`useCallback(fn, deps)` is equivalent to `useMemo(() => fn, deps)`.

**Q5: When does React bail out of a state update?**

When you call `setState` with the same value as current state (determined by `Object.is()`), React bails out with no re-render. This is the "bail out" optimization.

```typescript
const [obj, setObj] = useState({ count: 0 });
setObj(obj);  // Same reference — NO re-render
setObj({ ...obj, count: 0 });  // New reference — RE-RENDER even though value is same!
```

**Q6: What is a "stale closure" in React? How do you avoid it?**

A stale closure occurs when a function closes over an old value of a state/prop, and that value has since changed. Common in `useEffect`:

```typescript
// ❌ Stale closure — count is always 0 because the effect only ran once
useEffect(() => {
  const interval = setInterval(() => {
    console.log(count); // always 0!
  }, 1000);
  return () => clearInterval(interval);
}, []); // count not in deps

// ✅ Fix 1: Add count to deps (re-creates interval on each change)
// ✅ Fix 2: Use updater form setCount(prev => prev + 1)
// ✅ Fix 3: Use useRef to hold latest value
const countRef = useRef(count);
useEffect(() => { countRef.current = count; }, [count]);
```

---

### Performance

**Q7: What is React reconciliation and how does it determine what changed?**

Reconciliation is React's algorithm for comparing the previous and new element trees to determine what DOM updates are needed. It relies on two heuristics:
1. Elements of different types produce different trees (destroy + create)
2. The developer can hint at stability with the `key` prop

**Q8: What causes unnecessary re-renders? How do you diagnose and fix them?**

Causes: parent re-renders (most common), context value changes, store subscriptions, unstable prop references.

Diagnosis: React DevTools Profiler (record → inspect why each component rendered).

Fixes: `React.memo`, stable callbacks from stores (Zustand), splitting contexts, `useMemo`/`useCallback` where warranted.

**Q9: Explain React 18 Concurrent Mode. What problems does it solve?**

Concurrent Mode allows React to prepare multiple versions of the UI simultaneously. It makes rendering interruptible — React can pause a low-priority render when a high-priority update arrives (e.g., user input). Features: `useTransition`, `useDeferredValue`, Suspense improvements, automatic batching.

**Q10: What is the downside of putting everything in a single React Context?**

Any component that consumes the context will re-render when ANY part of the context value changes, even if the component only cares about one field. Solution: split context by concern/update frequency, or use a selector-based state library.

---

### Architecture

**Q11: What is "lifting state up" and when should you do it?**

Moving state to the closest common ancestor of components that need it. Do it when two or more components need to share and synchronize state. Avoid lifting too high — it causes unnecessary re-renders in unrelated parts of the tree.

**Q12: What is prop drilling and how do you mitigate it?**

Passing props through multiple intermediate components that don't need them, just to reach a deeply nested component. Solutions: Context API, state management library, component composition (children/render props).

**Q13: Explain the difference between controlled and uncontrolled components.**

- **Controlled**: React state is the single source of truth. Input value is driven by state, changes dispatch events to update state. Full control, works well with validation.
- **Uncontrolled**: DOM is the source of truth. Use `useRef` to read value on demand (e.g., form submit). Less re-renders, simpler for basic forms.

React Hook Form uses uncontrolled inputs by default for this performance reason.

**Q14: What are Render Props and when would you still use them?**

A pattern where a component receives a function as a prop that returns JSX:

```typescript
<DataFetcher url="/api/users" render={(data) => <UserList users={data} />} />
```

Mostly replaced by hooks. Still useful for: animation libraries (Framer Motion), headless component libraries (Radix, Headless UI's render prop pattern), situations where component-level polymorphism is needed.

**Q15: What is composition vs inheritance in React?**

React strongly favors **composition** (combining components) over inheritance (extending components). You express variations via props rather than subclasses:

```tsx
// Instead of BaseButton, PrimaryButton extends BaseButton:
function Button({ variant = 'primary', ...props }: ButtonProps) {
  return <button className={`btn btn--${variant}`} {...props} />;
}
```

**Q16: What are Higher-Order Components (HOCs)?**

Functions that take a component and return a new component with enhanced behavior:

```typescript
function withAuth<T>(WrappedComponent: React.ComponentType<T>) {
  return function WithAuth(props: T) {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" />;
    return <WrappedComponent {...props} />;
  };
}
```

Mostly superseded by hooks. Still useful for class components or cross-cutting concerns.

---

### Deep Internals

**Q17: What is React's synthetic event system?**

React 17+ attaches event listeners to the **root container** (not individual DOM nodes). This is event delegation. React wraps native events in a `SyntheticEvent` that normalizes cross-browser behavior. After React 17, events bubble to the root element rather than `document`.

**Q18: What is `ReactDOM.createPortal` and when would you use it?**

Renders children into a DOM node outside the component's tree (e.g., `document.body`) while maintaining React event bubbling and context:

```typescript
createPortal(
  <Modal>{children}</Modal>,
  document.getElementById('modal-root')!
);
```

Use for: modals, tooltips, dropdowns that need to break out of `overflow: hidden` parents.

**Q19: How does React handle keys during reconciliation?**

Keys help React identify which elements in a list have changed, been added, or removed. React matches elements by key across renders. If keys change (e.g., using index as key and items reorder), React unnecessarily destroys and recreates components.

**Q20: Why should you not mutate state directly?**

React compares old and new state by reference. If you mutate state in place, the reference doesn't change, so React doesn't detect the change and won't re-render. Always return a new object/array.

---

### Hooks - Advanced

**Q21: Explain `useImperativeHandle`. When is it appropriate?**

Used with `forwardRef` to expose a custom imperative API to parent components:

```typescript
const Input = forwardRef<InputHandle, InputProps>((props, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    clear: () => { if (inputRef.current) inputRef.current.value = ''; },
  }));

  return <input ref={inputRef} {...props} />;
});

// Parent can now: inputRef.current.focus()
```

Use sparingly — prefer declarative patterns.

**Q22: What does `useId` do?**

Generates a stable, unique ID that is consistent between server and client renders. Use for HTML `id`/`aria-labelledby` attributes:

```typescript
const id = useId();
// Generates: ":r0:", ":r1:", etc.
<label htmlFor={id}>Name</label>
<input id={id} />
```

**Q23: Explain `useSyncExternalStore`.**

Hook for subscribing to external stores (non-React state) in a Concurrent Mode–safe way. Used by Redux, Zustand, and other libraries internally:

```typescript
const value = useSyncExternalStore(
  store.subscribe,       // subscribe function
  store.getSnapshot,     // get current value (client)
  store.getServerSnapshot // get value for SSR (optional)
);
```

**Q24: What is `startTransition` and how does it differ from `useTransition`?**

Both mark updates as non-urgent. `useTransition` is a hook that also gives you an `isPending` boolean. `startTransition` is an imperative function (works outside components):

```typescript
import { startTransition } from 'react';
startTransition(() => setSearchResults(computed));
```

**Q25: What is the difference between server components and client components in React 19?**

Server Components run on the server — they can read files, databases, and use top-level await. They produce no JavaScript sent to the client. Client Components (`'use client'`) run in the browser with full React features (hooks, event handlers). Server Components can pass serializable props to Client Components.

---

### Testing & Quality

**Q26: How do you test a component that uses React Router?**

Wrap the component in `MemoryRouter` (for test isolation) and pass `initialEntries`:

```typescript
render(
  <MemoryRouter initialEntries={['/products/123']}>
    <Routes>
      <Route path="/products/:id" element={<ProductDetail />} />
    </Routes>
  </MemoryRouter>
);
```

**Q27: What's the difference between `act()` and `waitFor()` in RTL?**

`act()` flushes all pending state updates and effects synchronously. Use for synchronous state changes. `waitFor()` polls until an assertion passes — use for async operations like data fetching.

**Q28: How do you test a component that uses a context?**

Wrap with the Provider in your custom render utility or directly in the test:

```typescript
render(
  <ThemeContext.Provider value="dark">
    <ComponentUnderTest />
  </ThemeContext.Provider>
);
```

---

### Real-World Scenarios

**Q29: How would you implement optimistic updates in React?**

```typescript
const updateTodo = useMutation({
  mutationFn: api.updateTodo,
  onMutate: async (newTodo) => {
    // Cancel in-flight queries
    await queryClient.cancelQueries({ queryKey: ['todos'] });
    // Snapshot previous value
    const previous = queryClient.getQueryData(['todos']);
    // Optimistically update
    queryClient.setQueryData(['todos'], (old) =>
      old.map(t => t.id === newTodo.id ? newTodo : t)
    );
    return { previous };
  },
  onError: (_err, _vars, context) => {
    // Roll back optimistic update on error
    queryClient.setQueryData(['todos'], context.previous);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] });
  },
});
```

**Q30: How would you share state between sibling components without a state library?**

1. **Lift state** to their closest common ancestor
2. **Context API** if prop drilling becomes impractical
3. **URL state** (search params) for shareable/bookmarkable state
4. **Custom event bus** or `BroadcastChannel` for cross-tab communication (edge cases)

**Q31: How do you handle race conditions in data fetching?**

```typescript
// Classic cleanup pattern
useEffect(() => {
  let cancelled = false;

  async function fetchData() {
    const data = await api.getProduct(id);
    if (!cancelled) setProduct(data);   // ignore stale response
  }

  fetchData();
  return () => { cancelled = true; };
}, [id]);

// With AbortController
useEffect(() => {
  const controller = new AbortController();
  fetch(`/api/products/${id}`, { signal: controller.signal })
    .then(r => r.json())
    .then(setProduct)
    .catch(e => { if (e.name !== 'AbortError') setError(e); });
  return () => controller.abort();
}, [id]);
```

React Query handles this automatically when `queryKey` changes.

**Q32: What is the "children as a function" (Render Props) pattern?**

```typescript
<Toggle>
  {({ on, toggle }) => (
    <button onClick={toggle}>{on ? 'ON' : 'OFF'}</button>
  )}
</Toggle>
```

Popularized by libs like Downshift. Modern equivalent: headless hooks that return state + handlers.

**Q33: Describe how you would architect a complex form with dynamic fields.**

- React Hook Form for performance
- Zod schema for validation
- `useFieldArray` for dynamic arrays of fields
- `<Controller>` for complex controlled inputs
- `watch()` for conditional fields based on other field values
- Sub-forms as separate components using `useFormContext()`

**Q34: How would you implement infinite scroll?**

```typescript
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
  queryKey: ['products'],
  queryFn: ({ pageParam = 0 }) => fetchProducts({ offset: pageParam, limit: 20 }),
  getNextPageParam: (lastPage, allPages) =>
    lastPage.hasMore ? allPages.length * 20 : undefined,
});

// IntersectionObserver to trigger fetchNextPage
const sentinel = useRef<HTMLDivElement>(null);
useEffect(() => {
  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && hasNextPage) fetchNextPage();
  });
  if (sentinel.current) observer.observe(sentinel.current);
  return () => observer.disconnect();
}, [hasNextPage, fetchNextPage]);
```

---

### Advanced Questions

**Q35: What is the React reconciler and can you describe its phases?**

The reconciler is the core algorithm that compares the current fiber tree with the new React elements and determines what changed. It has two phases: the **render phase** (pure, interruptible) where it diffs and builds the work-in-progress tree, and the **commit phase** (synchronous) where it applies DOM mutations.

**Q36: How does `key` affect component state?**

Changing a component's `key` forces React to destroy and recreate the component — resetting all state. This is a deliberate reset pattern:

```typescript
// Force reset a form by changing its key
<UserForm key={userId} userId={userId} />
// When userId changes, the entire form is unmounted and remounted — fresh state
```

**Q37: What happens when you throw a Promise in a React component?**

This is how Suspense works (in legacy mode). When a component throws a Promise, React catches it, renders the nearest `<Suspense fallback>`, and when the Promise resolves, attempts to render the component again. In React 19, `use()` hook wraps this pattern.

**Q38: Explain the Compound Component pattern.**

```typescript
// Components that share implicit state via Context
function Tabs({ children, defaultTab }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  );
}

Tabs.List = function TabList({ children }) {
  return <div role="tablist">{children}</div>;
};

Tabs.Tab = function Tab({ value, children }) {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  return (
    <button
      role="tab"
      aria-selected={activeTab === value}
      onClick={() => setActiveTab(value)}
    >
      {children}
    </button>
  );
};

// Usage
<Tabs defaultTab="profile">
  <Tabs.List>
    <Tabs.Tab value="profile">Profile</Tabs.Tab>
    <Tabs.Tab value="settings">Settings</Tabs.Tab>
  </Tabs.List>
</Tabs>
```

**Q39: What is tree shaking and does React support it?**

Tree shaking removes unused code from the bundle during build. React supports it — named exports like `{ useState, useEffect }` are tree-shakeable. Importing entire modules (`import React from 'react'`) with the old JSX transform was less efficient; the new JSX transform (React 17+) doesn't require the React import.

**Q40: How do you handle authentication in a React SPA?**

1. **Tokens**: store access token in memory (not localStorage for security), refresh token in HttpOnly cookie
2. **Protected Routes**: `<ProtectedRoute>` component that redirects unauthenticated users
3. **Axios interceptors**: attach bearer token to all requests, handle 401 responses to refresh token
4. **Auth state**: Zustand/Context that holds `{ user, isLoading, login, logout }`
5. **Initial auth check**: read session on app mount before rendering routes

**Q41: What are the trade-offs of SSR vs CSR vs SSG?**

| Mode | First Paint | SEO | Data Freshness | Infrastructure |
|---|---|---|---|---|
| CSR | Slow | Poor | Live | Simple (static host) |
| SSR | Fast | Good | Live | Server required |
| SSG | Instant | Excellent | Stale | Simple (CDN) |
| ISR | Fast | Good | Configurable | Server + CDN |

**Q42: How does React handle events differently in React 17+ vs earlier versions?**

Pre-React 17: events bubbled to `document`. React 17+: events bubble to the **root container** (`#root`). This makes it safe to embed multiple React versions on the same page and fixes issues with micro-frontends.

**Q43: What is hydration and what causes hydration errors?**

Hydration is the process of attaching React event listeners to server-rendered HTML. React "hydrates" the static HTML by walking the DOM and attaching its fiber tree. Hydration errors occur when the server-rendered HTML doesn't match what React would render on the client:
- Accessing `window`/`localStorage` during server render
- Rendering different content based on `typeof window !== 'undefined'`
- User's browser extensions modifying the DOM
- Non-deterministic rendering (Math.random(), new Date())

**Q44: What is `useInsertionEffect` and who uses it?**

Runs synchronously *before* DOM mutations, even before `useLayoutEffect`. Designed for CSS-in-JS libraries to inject styles before the browser paints. Not for application code.

**Q45: How would you implement a component library with accessible components?**

1. Use semantic HTML (roles, labels, headings)
2. Build on top of headless libraries (Radix UI, Headless UI, Ariakit)
3. Test with `jest-axe` for automated accessibility violations
4. Test with screen readers (VoiceOver, NVDA) manually
5. Ensure keyboard navigation (focus trapping for modals, tab order)
6. Support reduced motion with `prefers-reduced-motion`

**Q46: Explain the Module Federation concept in React micro-frontends.**

Module Federation (Webpack 5 / Vite federation plugin) allows multiple independently deployed applications to share code at runtime:
- **Host**: the main app that loads remote modules
- **Remote**: an app that exposes components/functions
- Components can be shared without being duplicated in bundles

**Q47: What is the difference between `Object.is()` and `===`?**

`Object.is(NaN, NaN)` → `true` (=== returns false)  
`Object.is(+0, -0)` → `false` (=== returns true)  

React uses `Object.is` for state comparison.

**Q48: How do you optimize a React app for the Core Web Vitals?**

- **LCP** (Largest Contentful Paint): preload hero images, SSR/SSG, no render-blocking resources
- **CLS** (Cumulative Layout Shift): set width/height on images, avoid inserting content above fold
- **INP** (Interaction to Next Paint): use `useTransition`, avoid long tasks, defer analytics
- **FID/TBT**: code splitting, minimize bundle size, avoid heavy synchronous computations

**Q49: What is the `use` hook in React 19?**

A new primitive that can unwrap Promises and Contexts. Unlike other hooks, `use` can be called conditionally:

```typescript
import { use } from 'react';

function ProductDetail({ productPromise }: { productPromise: Promise<Product> }) {
  const product = use(productPromise);  // Suspends until resolved
  return <div>{product.name}</div>;
}

function ThemedButton() {
  const theme = use(ThemeContext);  // Works like useContext but can be called conditionally
  return <button className={theme}>Click</button>;
}
```

**Q50: What would you look for in a code review of a React component?**

1. **State design** — is state minimal? Is co-location appropriate?
2. **Performance** — unnecessary re-renders, missing keys, expensive computations without memo
3. **Accessibility** — semantic HTML, aria labels, keyboard navigation
4. **Error handling** — are loading/error states handled?
5. **TypeScript** — proper types, no `any`, generic components where appropriate
6. **Tests** — meaningful coverage of user behaviors
7. **Naming** — clear component/prop/hook names
8. **Side effects** — all in `useEffect` with proper cleanup
9. **Dependencies** — correct and complete `useEffect`/`useCallback` deps
10. **Separation of concerns** — data fetching, state, and UI in appropriate layers

---

## Summary

Understanding React at this depth — its fiber architecture, rendering pipeline, hook semantics, and concurrent features — is what separates senior developers from mid-level ones. The mental model of "renders are snapshots" and "effects run after paint" underlies nearly every subtle bug and performance issue in React applications.
