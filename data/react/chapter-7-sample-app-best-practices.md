# Chapter 7: Sample React.js App with Best Practices

## Overview

This chapter walks through a **small, realistic React app** that applies the best practices from earlier chapters:

- **CSR SPA** built with Vite (client-side rendering)
- **Feature-first folder structure**
- **TanStack Query** for server state
- **Zustand** for global client state (auth)
- **React Hook Form + Zod** for forms and validation
- **Routing & code splitting**
- **Accessibility, error handling, and UX details**

You can adapt this into any stack (Next.js, Remix), but the principles stay the same.

---

## Project Structure

```text
src/
  app/
    App.tsx
    router.tsx
    queryClient.ts
  features/
    auth/
      api.ts
      store.ts
      components/
        LoginForm.tsx
    todos/
      api.ts
      components/
        TodoList.tsx
        AddTodoForm.tsx
  shared/
    components/
      Button.tsx
      TextField.tsx
      PageLayout.tsx
    hooks/
      useTitle.ts
    lib/
      axiosClient.ts
  main.tsx
```

**Key ideas:**

- `features/*` is **vertical**: API, store, components live together per domain.
- `shared/*` contains **truly reusable** primitives (buttons, layout, simple hooks).
- `app/*` wires everything together (routing, providers).

---

## App Shell with Providers

```tsx
// src/app/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: true,
      retry: 2,
    },
  },
});
```

```tsx
// src/app/App.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './queryClient';
import { AppRouter } from './router';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

**Best practices covered:**

- Single `QueryClientProvider` at the root.
- Devtools wired in but non-intrusive.
- Routing separated into its own module.

---

## Routing and Code Splitting

```tsx
// src/app/router.tsx
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PageLayout } from '@/shared/components/PageLayout';

const TodosPage = lazy(() => import('@/features/todos/components/TodosPage'));
const LoginPage = lazy(() => import('@/features/auth/components/LoginPage'));

export function AppRouter() {
  return (
    <PageLayout>
      <Suspense fallback={<div>Loading page…</div>}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/todos" element={<TodosPage />} />
          <Route path="*" element={<Navigate to="/todos" replace />} />
        </Routes>
      </Suspense>
    </PageLayout>
  );
}
```

**Best practices:**

- **Route-level code splitting** via `lazy`.
- A shared `PageLayout` for consistent shell (header, main region, etc.).
- Sensible wildcard route.

---

## Shared UI Components

```tsx
// src/shared/components/Button.tsx
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: Variant;
  isLoading?: boolean;
}

export function Button({ children, variant = 'primary', isLoading, disabled, ...rest }: ButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants: Record<Variant, string> = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
    ghost: 'bg-transparent text-slate-900 hover:bg-slate-100',
  };

  return (
    <button
      type={rest.type ?? 'button'}
      className={`${base} ${variants[variant]}`}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading ? 'Please wait…' : children}
    </button>
  );
}
```

```tsx
// src/shared/components/TextField.tsx
import type { InputHTMLAttributes } from 'react';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function TextField({ id, label, error, ...rest }: TextFieldProps) {
  const inputId = id ?? rest.name;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-slate-800">
        {label}
      </label>
      <input
        id={inputId}
        className={`rounded border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-500' : 'border-slate-300'
        }`}
        {...rest}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
```

**Best practices:**

- Accessible form controls (`label` + `htmlFor`).
- Clear error messaging.
- Simple, composable primitives instead of a huge design system.

---

## Auth Feature: Zustand + React Query

```tsx
// src/features/auth/store.ts
import { create } from 'zustand';

interface User {
  id: string;
  email: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  setSession: (user: User, accessToken: string) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>(set => ({
  user: null,
  accessToken: null,
  setSession: (user, accessToken) => set({ user, accessToken }),
  clearSession: () => set({ user: null, accessToken: null }),
}));
```

```tsx
// src/shared/lib/axiosClient.ts
import axios from 'axios';
import { useAuthStore } from '@/features/auth/store';

export const axiosClient = axios.create({
  baseURL: '/api',
});

axiosClient.interceptors.request.use(config => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
});
```

```tsx
// src/features/auth/api.ts
import { axiosClient } from '@/shared/lib/axiosClient';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: { id: string; email: string };
  accessToken: string;
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await axiosClient.post<LoginResponse>('/auth/login', payload);
  return data;
}
```

**Best practices:**

- Auth token lives in a **global client store** (Zustand), not React Context.
- API client is configured once, **reads state outside React** via `getState()`.

---

## Auth Form: React Hook Form + Zod

```tsx
// src/features/auth/components/LoginForm.tsx
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { login, type LoginPayload } from '../api';
import { useAuthStore } from '../store';
import { Button } from '@/shared/components/Button';
import { TextField } from '@/shared/components/TextField';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const setSession = useAuthStore(state => state.setSession);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (values: LoginPayload) => login(values),
    onSuccess: ({ user, accessToken }) => {
      setSession(user, accessToken);
      // navigate to /todos (using React Router's useNavigate in the page component)
    },
  });

  const onSubmit = (values: FormValues) => {
    mutate(values);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex max-w-sm flex-col gap-4">
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        {...register('email')}
        error={errors.email?.message}
      />
      <TextField
        label="Password"
        type="password"
        autoComplete="current-password"
        {...register('password')}
        error={errors.password?.message}
      />
      <Button type="submit" variant="primary" isLoading={isPending}>
        Log in
      </Button>
    </form>
  );
}
```

**Best practices:**

- Validation is **schema-based** (Zod) and shared between front-end and back-end if desired.
- Form logic is centralized with **React Hook Form**, not hand-written `useState`.

---

## Todos Feature: React Query + Optimistic UI

```tsx
// src/features/todos/api.ts
import { axiosClient } from '@/shared/lib/axiosClient';

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

export async function fetchTodos(): Promise<Todo[]> {
  const { data } = await axiosClient.get<Todo[]>('/todos');
  return data;
}

export async function createTodo(title: string): Promise<Todo> {
  const { data } = await axiosClient.post<Todo>('/todos', { title });
  return data;
}
```

```tsx
// src/features/todos/components/TodoList.tsx
import { useQuery } from '@tanstack/react-query';
import { fetchTodos } from '../api';

export function TodoList() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  });

  if (isLoading) return <p>Loading todos…</p>;
  if (isError) return <p>Failed to load todos</p>;

  if (!data?.length) {
    return <p className="text-sm text-slate-500">You have no todos yet. Add one above.</p>;
  }

  return (
    <ul className="space-y-2">
      {data.map(todo => (
        <li key={todo.id} className="flex items-center gap-2">
          <input type="checkbox" checked={todo.completed} readOnly aria-label={todo.title} />
          <span className={todo.completed ? 'line-through text-slate-400' : ''}>{todo.title}</span>
        </li>
      ))}
    </ul>
  );
}
```

```tsx
// src/features/todos/components/AddTodoForm.tsx
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTodo, type Todo } from '../api';
import { Button } from '@/shared/components/Button';

export function AddTodoForm() {
  const [title, setTitle] = useState('');
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (t: string) => createTodo(t),
    onMutate: async newTitle => {
      await queryClient.cancelQueries({ queryKey: ['todos'] });
      const previous = queryClient.getQueryData<Todo[]>(['todos']) ?? [];

      const optimistic: Todo = {
        id: `temp-${Date.now()}`,
        title: newTitle,
        completed: false,
      };

      queryClient.setQueryData<Todo[]>(['todos'], [...previous, optimistic]);
      setTitle('');

      return { previous };
    },
    onError: (_error, _newTitle, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['todos'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    mutate(title.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Add a new todo"
        className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
      />
      <Button type="submit" variant="primary" isLoading={isPending}>
        Add
      </Button>
    </form>
  );
}
```

```tsx
// src/features/todos/components/TodosPage.tsx
import { TodoList } from './TodoList';
import { AddTodoForm } from './AddTodoForm';

export default function TodosPage() {
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 p-4">
      <header>
        <h1 className="text-xl font-semibold text-slate-900">Todos</h1>
        <p className="text-sm text-slate-600">A simple list powered by React Query.</p>
      </header>
      <AddTodoForm />
      <TodoList />
    </main>
  );
}
```

**Best practices:**

- Server state (todos) managed entirely by **TanStack Query**.
- Optimistic updates with proper **rollback** on error.
- UI stays responsive even with slow networks.

---

## Putting It All Together

This small app demonstrates how to combine:

- **CSR SPA** with React Router and route-level code splitting.
- **Feature-first structure** so each domain owns its API, state, and UI.
- **TanStack Query** for server data (todos).
- **Zustand** for global client state (auth).
- **React Hook Form + Zod** for forms and validation.
- **Accessible, reusable UI primitives** in `shared/components`.

From here you can grow the app by:

- Adding **role-based routes** (admin vs user) using the auth store.
- Introducing **RSC/SSR** by moving to Next.js while keeping the same feature boundaries.
- Adding **tests** (Vitest + RTL) around critical flows (`LoginForm`, `TodosPage`).

The patterns stay the same — only the rendering environment (CSR/SSR/RSC) and routing layer change.

