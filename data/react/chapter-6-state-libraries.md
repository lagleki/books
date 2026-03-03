# Chapter 6: State Management Libraries in React

## Why a State Management Library?

React's built-in state (`useState`, `useReducer`, Context API) is excellent for local and moderately shared state. You need a state library when:

- **Cross-cutting state** — data needed by many unrelated components
- **DevTools / time-travel debugging** — Redux DevTools
- **Complex update logic** — multi-step transactions, sagas, state machines
- **Server state** — caching, background refetch, synchronization
- **Performance at scale** — fine-grained subscriptions without Context waterfall

---

## Taxonomy of State

Before picking a library, classify your state:

| Type | Example | Best Tool |
|---|---|---|
| Local UI state | Modal open/close, accordion | `useState` / `useReducer` |
| Shared client state | User session, shopping cart, preferences | Zustand / Jotai / Redux Toolkit |
| Server/async state | Products, orders, notifications | TanStack Query / SWR |
| Form state | Input values, validation errors | React Hook Form |
| URL state | Search filters, current tab, pagination | `useSearchParams` (React Router) |
| Complex flows | Checkout wizard, multistep forms | XState |

The biggest mistake teams make: using Redux for server state (replace with TanStack Query) or using Context for high-frequency updates (use Zustand).

---

## Zustand

### Overview

Zustand is a minimal, fast, and unopinionated state library. Its API is incredibly small — you create a store with a single `create()` call and consume it with a hook:

```typescript
import { create } from 'zustand';

interface CartStore {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  totalItems: 0,
  totalPrice: 0,

  addItem: (product) => {
    const existing = get().items.find(i => i.id === product.id);
    if (existing) {
      set(state => ({
        items: state.items.map(i =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        ),
        totalItems: state.totalItems + 1,
        totalPrice: state.totalPrice + product.price,
      }));
    } else {
      set(state => ({
        items: [...state.items, { ...product, quantity: 1 }],
        totalItems: state.totalItems + 1,
        totalPrice: state.totalPrice + product.price,
      }));
    }
  },

  removeItem: (productId) => {
    const item = get().items.find(i => i.id === productId);
    if (!item) return;

    set(state => ({
      items: state.items.filter(i => i.id !== productId),
      totalItems: state.totalItems - item.quantity,
      totalPrice: state.totalPrice - item.price * item.quantity,
    }));
  },

  clearCart: () => set({ items: [], totalItems: 0, totalPrice: 0 }),
}));
```

### Selectors — The Key to Performance

```typescript
// ❌ Subscribes to all store changes — re-renders on ANY change
function CartIcon() {
  const store = useCartStore();
  return <span>{store.totalItems}</span>;
}

// ✅ Subscribes only to totalItems — only re-renders when totalItems changes
function CartIcon() {
  const totalItems = useCartStore(state => state.totalItems);
  return <span>{totalItems}</span>;
}

// ✅ Multiple values — use shallow comparison
import { useShallow } from 'zustand/react/shallow';

function CartSummary() {
  const { totalItems, totalPrice } = useCartStore(
    useShallow(state => ({ totalItems: state.totalItems, totalPrice: state.totalPrice }))
  );
  return <div>{totalItems} items — {totalPrice}</div>;
}
```

### Middleware

```typescript
import { create } from 'zustand';
import { persist, devtools, immer } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

const useStore = create<Store>()(
  devtools(              // Redux DevTools support
    persist(            // localStorage persistence
      immer(            // Immer for mutable-style updates
        (set) => ({
          count: 0,
          increment: () => set(state => { state.count += 1; }), // immer: direct mutation
        })
      ),
      { name: 'my-store', storage: createJSONStorage(() => localStorage) }
    ),
    { name: 'MyAwesomeStore' }
  )
);
```

### Slices Pattern (Large Stores)

```typescript
// userSlice.ts
export const createUserSlice = (set: SetState, get: GetState) => ({
  user: null as User | null,
  setUser: (user: User) => set({ user }),
  logout: () => set({ user: null }),
});

// cartSlice.ts
export const createCartSlice = (set: SetState) => ({
  items: [] as CartItem[],
  addItem: (item: CartItem) => set(state => ({ items: [...state.items, item] })),
});

// store.ts — combine slices
export const useStore = create<UserSlice & CartSlice>()((...args) => ({
  ...createUserSlice(...args),
  ...createCartSlice(...args),
}));
```

### Zustand Outside React

```typescript
// Access / update store outside components (e.g., in API interceptors)
import { useCartStore } from '@/stores/cart';

const state = useCartStore.getState();    // read current state
useCartStore.setState({ items: [] });    // update state
const unsubscribe = useCartStore.subscribe(  // subscribe to changes
  state => state.totalItems,
  (totalItems) => console.log('Cart changed:', totalItems)
);
```

---

## Redux Toolkit (RTK)

### Overview

Redux Toolkit is the **official, opinionated** Redux setup. It eliminates the boilerplate of vanilla Redux (actions, action creators, reducers, constants) with `createSlice` and includes Immer for mutable-style updates.

### When to Choose RTK Over Zustand

- Large team that already knows Redux patterns
- Need Redux DevTools time-travel debugging across complex multi-step flows
- Action history matters (logging, analytics)
- Complex side effects (RTK Query or Redux-Saga)

### Store Setup

```typescript
// store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import { cartReducer } from './cartSlice';
import { userReducer } from './userSlice';
import { api } from './api'; // RTK Query

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    user: userReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefault) =>
    getDefault().concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### createSlice

```typescript
// store/cartSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CartState {
  items: CartItem[];
}

const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [] } as CartState,
  reducers: {
    addItem(state, action: PayloadAction<Product>) {
      // Immer lets us "mutate" state directly
      const existing = state.items.find(i => i.id === action.payload.id);
      if (existing) {
        existing.quantity += 1;
      } else {
        state.items.push({ ...action.payload, quantity: 1 });
      }
    },
    removeItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter(i => i.id !== action.payload);
    },
    clearCart(state) {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    // Handle async thunks
    builder
      .addCase(fetchCartFromServer.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCartFromServer.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
      });
  },
});

export const { addItem, removeItem, clearCart } = cartSlice.actions;
export const cartReducer = cartSlice.reducer;

// Selectors (can use reselect for memoized derived data)
export const selectCartItems = (state: RootState) => state.cart.items;
export const selectCartTotal = createSelector(
  selectCartItems,
  items => items.reduce((sum, item) => sum + item.price * item.quantity, 0)
);
```

### RTK Query — Server State with RTK

```typescript
// store/api.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).user.accessToken;
      if (token) headers.set('authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Product', 'Cart', 'Order'],
  endpoints: (builder) => ({
    getProducts: builder.query<Product[], { category?: string }>({
      query: ({ category }) => `/products${category ? `?category=${category}` : ''}`,
      providesTags: ['Product'],
    }),
    getProduct: builder.query<Product, string>({
      query: (id) => `/products/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Product', id }],
    }),
    updateProduct: builder.mutation<Product, { id: string; updates: Partial<Product> }>({
      query: ({ id, updates }) => ({
        url: `/products/${id}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Product', id }],
    }),
  }),
});

export const { useGetProductsQuery, useGetProductQuery, useUpdateProductMutation } = api;

// In component
function ProductDetail({ id }: { id: string }) {
  const { data, isLoading, error } = useGetProductQuery(id);
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();

  // ...
}
```

---

## Jotai

### Overview

Jotai takes a **bottom-up atomic** approach: state is broken into tiny independent atoms. Components subscribe only to the atoms they need. No providers beyond the root (optional), no selectors needed.

```typescript
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';

// Primitive atoms
const countAtom = atom(0);
const userAtom = atom<User | null>(null);

// Derived atoms (read-only computed values)
const doubleCountAtom = atom((get) => get(countAtom) * 2);

// Read-write derived atoms
const todoAtom = atom(
  (get) => get(todoListAtom).filter(t => !t.done).length, // read
  (get, set, newCount: number) => set(todoListAtom, /* update */) // write
);

// Async atoms
const productsAtom = atom(async () => {
  const response = await fetch('/api/products');
  return response.json();
});

// In components
function Counter() {
  const [count, setCount] = useAtom(countAtom);
  const double = useAtomValue(doubleCountAtom); // read-only — no setter
  const setUser = useSetAtom(userAtom);         // write-only — no re-render on read

  return (
    <div>
      <span>{count} (double: {double})</span>
      <button onClick={() => setCount(c => c + 1)}>+</button>
    </div>
  );
}
```

### Jotai with Async Data

```typescript
import { atom } from 'jotai';
import { atomWithQuery } from 'jotai-tanstack-query'; // integration package

const productIdAtom = atom<string>('prod_1');

// Reacts to productIdAtom changes — refetches when ID changes
const productAtom = atomWithQuery((get) => ({
  queryKey: ['product', get(productIdAtom)],
  queryFn: () => fetchProduct(get(productIdAtom)),
}));

function ProductDetail() {
  const [{ data, isPending }] = useAtom(productAtom);
  if (isPending) return <Spinner />;
  return <div>{data.name}</div>;
}
```

### When to Choose Jotai

- You want fine-grained, atomic state without boilerplate
- State is naturally decomposable into independent atoms
- You're building a UI-heavy app where many small pieces of state need to interact
- You like the `useState`-like API at the atom level

---

## TanStack Query (React Query)

### Overview

TanStack Query is the **gold standard for server state** in React. It handles caching, background refetching, stale-while-revalidate, pagination, optimistic updates, and mutations — things `useEffect` + `useState` combinations do badly.

```typescript
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,    // data is fresh for 5 min
      gcTime: 10 * 60 * 1000,      // cache for 10 min after unused
      retry: 3,
      refetchOnWindowFocus: true,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MyApp />
    </QueryClientProvider>
  );
}
```

### useQuery

```typescript
function ProductsPage({ category }: { category: string }) {
  const {
    data,
    isLoading,
    isError,
    error,
    isFetching,      // true even for background refetch
    isStale,
    refetch,
  } = useQuery({
    queryKey: ['products', category],  // cache key — array, often hierarchical
    queryFn: () => fetchProducts(category),
    staleTime: 60_000,   // fresh for 1 min
    enabled: !!category, // only fetch when category is set
    select: (data) => data.sort((a, b) => a.name.localeCompare(b.name)), // transform
    placeholderData: keepPreviousData, // show old data while refetching
  });

  if (isLoading) return <Skeleton />;
  if (isError) return <ErrorMessage error={error} />;

  return (
    <ul>
      {data.map(p => <ProductCard key={p.id} product={p} />)}
      {isFetching && <span>Refreshing...</span>}
    </ul>
  );
}
```

### useMutation

```typescript
function CreateProductForm() {
  const queryClient = useQueryClient();

  const createProduct = useMutation({
    mutationFn: (newProduct: CreateProductDto) => api.post('/products', newProduct),
    
    onSuccess: (data) => {
      // Invalidate cache — triggers refetch of product lists
      queryClient.invalidateQueries({ queryKey: ['products'] });
      // Or manually update cache to avoid refetch
      queryClient.setQueryData(['products', data.id], data);
      toast.success('Product created!');
    },
    
    onError: (error) => {
      toast.error(`Failed: ${error.message}`);
    },
  });

  const handleSubmit = (formData: CreateProductDto) => {
    createProduct.mutate(formData);
    // Or: await createProduct.mutateAsync(formData); for await/catch pattern
  };

  return <form onSubmit={/* ... */}>
    <button type="submit" disabled={createProduct.isPending}>
      {createProduct.isPending ? 'Creating...' : 'Create'}
    </button>
  </form>;
}
```

### Infinite Queries

```typescript
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useInfiniteQuery({
  queryKey: ['products', 'infinite'],
  queryFn: ({ pageParam }) => fetchProducts({ cursor: pageParam, limit: 20 }),
  initialPageParam: null,
  getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
});

// data.pages is an array of pages
const allProducts = data?.pages.flatMap(page => page.items) ?? [];
```

---

## XState

### Overview

XState is a state machine / statechart library. It's ideal when component state has complex legal transitions — not all states can transition to all other states, and there are well-defined events.

```typescript
import { createMachine, assign } from 'xstate';

const checkoutMachine = createMachine({
  id: 'checkout',
  initial: 'cart',
  context: {
    items: [],
    shippingAddress: null,
    paymentMethod: null,
    error: null,
  },
  states: {
    cart: {
      on: {
        PROCEED_TO_SHIPPING: 'shipping',
        ADD_ITEM: { actions: assign({ items: (ctx, event) => [...ctx.items, event.item] }) },
      },
    },
    shipping: {
      on: {
        SUBMIT_ADDRESS: {
          target: 'payment',
          actions: assign({ shippingAddress: (_, event) => event.address }),
        },
        BACK: 'cart',
      },
    },
    payment: {
      on: {
        SUBMIT_PAYMENT: 'processing',
        BACK: 'shipping',
      },
    },
    processing: {
      invoke: {
        src: 'processPayment',
        onDone: 'success',
        onError: {
          target: 'payment',
          actions: assign({ error: (_, event) => event.data.message }),
        },
      },
    },
    success: { type: 'final' },
  },
});

// In React
import { useMachine } from '@xstate/react';

function Checkout() {
  const [state, send] = useMachine(checkoutMachine, {
    services: {
      processPayment: (context) => api.processPayment(context),
    },
  });

  if (state.matches('cart')) return <CartStep onProceed={() => send('PROCEED_TO_SHIPPING')} />;
  if (state.matches('shipping')) return <ShippingStep onSubmit={(address) => send({ type: 'SUBMIT_ADDRESS', address })} />;
  if (state.matches('processing')) return <Spinner />;
  if (state.matches('success')) return <OrderConfirmation />;
}
```

---

## SWR

SWR (stale-while-revalidate) is Vercel's lightweight alternative to TanStack Query. Perfect for Next.js apps with simpler fetching needs:

```typescript
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

function Profile() {
  const { data, error, isLoading, mutate } = useSWR('/api/user', fetcher, {
    revalidateOnFocus: true,
    refreshInterval: 30_000, // poll every 30s
  });

  if (isLoading) return <Skeleton />;
  if (error) return <Error />;

  return <UserCard user={data} onUpdate={() => mutate()} />;
}
```

---

## Comparison

| Library | Bundle | Mental model | Best for |
|---|---|---|---|
| Zustand | ~2kb | Single store, selectors | Global client state, simple to complex |
| Redux Toolkit | ~12kb | Slices, actions, reducers | Large teams, complex flows, time-travel |
| Jotai | ~3kb | Atomic state | Fine-grained reactive state |
| Recoil | ~20kb | Atoms + selectors | Facebook-scale, complex derived state |
| TanStack Query | ~13kb | Query/mutation/cache | Server state (the best choice here) |
| SWR | ~4kb | Simple fetching | Simpler apps, Next.js |
| XState | ~10kb | State machines | Complex workflows, multistep flows |
| Valtio | ~3kb | Proxy-based mutable | Simple, intuitive mutable state |

---

## Recommended Stack by App Size

**Small app / startup MVP:**
```
- useState / useReducer (local state)
- TanStack Query (server state)
- react-hook-form (forms)
```

**Medium SPA / growing team:**
```
- Zustand (global client state: auth, cart, preferences)
- TanStack Query (server state)
- react-hook-form + Zod (forms)
- React Router URL state (filters, pagination)
```

**Large enterprise app / complex flows:**
```
- Redux Toolkit (global state with history/auditing)
- RTK Query OR TanStack Query (server state)
- XState (checkout, onboarding, complex wizards)
- react-hook-form + Zod (forms)
```

---

## Common Patterns

### Colocation Principle

Keep state as close to where it's used as possible:

```typescript
// ❌ Global store for modal open/close state
const useStore = create(set => ({
  isProductModalOpen: false,
  openProductModal: () => set({ isProductModalOpen: true }),
}));

// ✅ Local state — only ProductList needs to know about this
function ProductList() {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  return (
    <>
      {/* ... */}
      {selectedProductId && (
        <ProductModal id={selectedProductId} onClose={() => setSelectedProductId(null)} />
      )}
    </>
  );
}
```

### Derived State vs Stored State

Never store computed values — derive them:

```typescript
// ❌ Storing derived state — gets out of sync
const useCartStore = create(set => ({
  items: [],
  totalItems: 0,    // ← duplicates info from items
  totalPrice: 0,    // ← duplicates info from items
}));

// ✅ Compute on the fly with selectors
const useCartStore = create(() => ({ items: [] }));

const selectTotalItems = (state) => state.items.reduce((sum, i) => sum + i.quantity, 0);
const selectTotalPrice = (state) => state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

// Or with Zustand subscribeWithSelector middleware for memoized selectors
```

### Optimistic Updates Pattern

```typescript
// With TanStack Query — covered in chapter 5
// With Zustand — manual approach
const addItemOptimistic = async (product: Product) => {
  // 1. Immediately update UI
  useCartStore.getState().addItemLocally(product);

  try {
    // 2. Sync with server
    await api.addToCart(product.id);
  } catch (error) {
    // 3. Roll back on failure
    useCartStore.getState().removeItemLocally(product.id);
    toast.error('Failed to add to cart');
  }
};
```

---

## Summary: Choosing the Right Tool

The modern React state management answer is rarely "one library for everything." It's a composition:

1. **Local state** → `useState` / `useReducer`
2. **Server/async state** → TanStack Query
3. **Global client state** → Zustand (simple) or Redux Toolkit (complex/large team)
4. **Atomic fine-grained state** → Jotai
5. **Complex state machines** → XState
6. **Forms** → React Hook Form
7. **URL state** → React Router `useSearchParams`

Over-engineering state management is one of the most common mistakes in React apps. Start with the simplest tool (`useState`) and migrate when the pain is real.
