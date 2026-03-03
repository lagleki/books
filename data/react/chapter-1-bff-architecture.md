# Chapter 1: BFF (Backend-for-Frontend) Architecture

## What is BFF?

The **Backend-for-Frontend (BFF)** pattern is an architectural approach where you create a dedicated backend service — or a thin API layer — specifically tailored for a particular frontend client (web app, mobile app, smart TV app, etc.). Rather than having one monolithic API that tries to satisfy every client's needs, each client gets its own backend that speaks its language.

The term was popularized by Sam Newman (author of *Building Microservices*) who described the problem: a single general-purpose API becomes a compromise — too chatty for mobile, too coarse for web, trying to please everyone and pleasing no one.

```
              ┌─────────────────────────────┐
              │      Downstream Services     │
              │  (Auth, Orders, Catalog...)  │
              └─────────────┬───────────────┘
                            │
          ┌─────────────────┼──────────────────┐
          │                 │                  │
    ┌─────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
    │  Web BFF   │   │ Mobile BFF  │   │   TV BFF    │
    │ (Next.js)  │   │  (Node.js)  │   │  (Node.js)  │
    └─────┬──────┘   └──────┬──────┘   └──────┬──────┘
          │                 │                  │
    ┌─────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
    │  React SPA │   │ React Native│   │  React TV   │
    └────────────┘   └─────────────┘   └─────────────┘
```

## Why BFF Exists: The Problem it Solves

### Problem 1 — The Over-fetching / Under-fetching Dilemma

A desktop web app might need a rich product page with 30+ fields (images gallery, related products, reviews, seller info). A mobile app showing the same product in a card list needs only 5 fields (name, thumbnail, price, rating, id).

A generic REST API returns the same payload to both — either the mobile wastes bandwidth on unused fields, or the web makes multiple requests.

```json
// Generic API — product endpoint returns everything
{
  "id": "prod_123",
  "name": "Mechanical Keyboard",
  "sku": "MK-87-BLK",
  "price": 149.99,
  "currency": "USD",
  "description": "... 500 chars ...",
  "images": ["url1", "url2", "url3", "url4", "url5"],
  "specs": { "weight": "900g", "switches": "Cherry MX Red", ... },
  "seller": { "id": "seller_42", "name": "TechStore", ... },
  "reviews": [ ... 10 items ... ],
  "relatedProducts": [ ... 6 items ... ],
  "stock": { "warehouse_1": 43, "warehouse_2": 12 }
}
```

With a **Web BFF**, the web client gets exactly what it needs:
```json
// Web BFF response — optimized for product detail page
{
  "id": "prod_123",
  "name": "Mechanical Keyboard",
  "price": { "amount": 149.99, "formatted": "$149.99" },
  "images": ["url1", "url2", "url3", "url4", "url5"],
  "specs": { "weight": "900g", "switches": "Cherry MX Red" },
  "seller": { "name": "TechStore", "rating": 4.8 },
  "reviews": { "average": 4.6, "count": 312, "items": [...first 5...] },
  "relatedProducts": [...6 items with name + thumbnail + price only...]
}
```

And the **Mobile BFF** returns a lean payload:
```json
// Mobile BFF response — optimized for list card
{
  "id": "prod_123",
  "name": "Mechanical Keyboard",
  "price": "$149.99",
  "thumbnail": "url1",
  "rating": 4.6
}
```

### Problem 2 — Chatty UIs / N+1 Requests

Without BFF, a React dashboard might fire 8 parallel requests on mount:
```
GET /api/user/profile
GET /api/user/notifications?limit=5
GET /api/orders/recent?limit=3
GET /api/products/featured
GET /api/banner/active
GET /api/stats/monthly
GET /api/cart
GET /api/wishlist/count
```

The BFF can aggregate these into a single call:
```
GET /bff/dashboard
```

The BFF calls upstream services in parallel and assembles the response — reducing client-perceived latency and simplifying React component logic significantly.

### Problem 3 — Security and Token Handling

Mobile apps storing OAuth tokens locally expose them to extraction. A BFF running server-side can hold refresh tokens in HttpOnly cookies, proxy authenticated requests, and never expose tokens to the frontend.

```typescript
// BFF auth flow — token stays on server
app.post('/auth/token', async (req, res) => {
  const { code } = req.body;
  
  const tokenResponse = await authService.exchangeCode(code);
  
  // Store refresh token in HttpOnly cookie — never exposed to JS
  res.cookie('refresh_token', tokenResponse.refresh_token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  // Only send access token to client (short-lived)
  res.json({ access_token: tokenResponse.access_token });
});
```

### Problem 4 — Frontend Teams Need Autonomy

With a shared API, every frontend change that requires new data needs backend team involvement, cross-team tickets, and release coordination. A BFF owned by the frontend team allows them to iterate independently — reshaping, aggregating, and versioning data contracts without gating on other teams.

---

## BFF vs. API Gateway

These two are often confused. Here's the distinction:

| Concern | API Gateway | BFF |
|---|---|---|
| Purpose | Cross-cutting (auth, rate-limit, routing) | Client-specific data shaping |
| Owner | Platform / infrastructure team | Frontend team |
| Number | Usually one | One per client type |
| Business logic | None / minimal | Yes — aggregation, transformation |
| Typical tech | Kong, AWS API GW, Nginx | Node.js, Next.js API routes |

They are complementary, not competing. A common setup:

```
React App → BFF (Next.js API routes) → API Gateway → Microservices
```

The API Gateway handles auth tokens, SSL termination, rate limiting. The BFF handles data stitching and shaping.

---

## BFF Implementation Patterns

### Pattern 1 — Next.js API Routes as BFF

The most popular React ecosystem approach. Your Next.js app ships with API routes that act as a BFF — same repo, same team, same deployment.

**Directory structure:**
```
app/
  api/
    dashboard/
      route.ts          ← GET /api/dashboard
    products/
      [id]/
        route.ts        ← GET /api/products/:id
    cart/
      route.ts          ← GET/POST /api/cart
```

**Example — Dashboard BFF endpoint:**
```typescript
// app/api/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch all data in parallel from downstream services
  const [profile, recentOrders, notifications, stats] = await Promise.all([
    fetch(`${process.env.USER_SERVICE_URL}/users/${session.user.id}`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    }).then(r => r.json()),

    fetch(`${process.env.ORDER_SERVICE_URL}/orders?userId=${session.user.id}&limit=5`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    }).then(r => r.json()),

    fetch(`${process.env.NOTIFICATION_SERVICE_URL}/notifications?userId=${session.user.id}&unread=true&limit=10`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    }).then(r => r.json()),

    fetch(`${process.env.ANALYTICS_SERVICE_URL}/stats?userId=${session.user.id}&period=30d`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    }).then(r => r.json()),
  ]);

  // Shape the data for the dashboard component
  return NextResponse.json({
    user: {
      name: profile.displayName,
      avatar: profile.avatarUrl,
      memberSince: profile.createdAt,
    },
    orders: {
      recent: recentOrders.items.map(order => ({
        id: order.id,
        status: order.status,
        total: formatCurrency(order.totalCents, order.currency),
        date: order.createdAt,
        itemCount: order.lineItems.length,
      })),
      totalCount: recentOrders.total,
    },
    notifications: {
      items: notifications.items,
      unreadCount: notifications.unreadCount,
    },
    stats: {
      totalSpent: formatCurrency(stats.totalSpentCents, 'USD'),
      ordersThisMonth: stats.ordersThisMonth,
      loyaltyPoints: stats.loyaltyPoints,
    },
  });
}

function formatCurrency(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}
```

**The React component consuming it:**
```tsx
// components/Dashboard.tsx
import useSWR from 'swr';

interface DashboardData {
  user: { name: string; avatar: string; memberSince: string };
  orders: { recent: Order[]; totalCount: number };
  notifications: { items: Notification[]; unreadCount: number };
  stats: { totalSpent: string; ordersThisMonth: number; loyaltyPoints: number };
}

export function Dashboard() {
  const { data, isLoading, error } = useSWR<DashboardData>('/api/dashboard');

  if (isLoading) return <DashboardSkeleton />;
  if (error) return <ErrorState />;

  return (
    <div className="dashboard">
      <UserHeader user={data.user} notifications={data.notifications} />
      <StatsRow stats={data.stats} />
      <RecentOrders orders={data.orders.recent} total={data.orders.totalCount} />
    </div>
  );
}
```

Notice how the component is clean — it doesn't know about 4 different service URLs, auth headers, or data transformation. That's in the BFF.

---

### Pattern 2 — Standalone Node.js BFF (Express / Fastify)

When multiple frontends (web + mobile) share a common BFF layer but are deployed separately:

```typescript
// bff-service/src/routes/products.ts
import { FastifyPluginAsync } from 'fastify';

const productsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Params: { id: string } }>('/products/:id', async (request, reply) => {
    const { id } = request.params;
    const clientType = request.headers['x-client-type'] as 'web' | 'mobile';

    // Fetch from microservices in parallel
    const [product, seller, reviews] = await Promise.all([
      fastify.catalogService.getProduct(id),
      fastify.sellerService.getSeller(product?.sellerId).catch(() => null),
      fastify.reviewService.getReviews(id, { limit: clientType === 'web' ? 5 : 0 }),
    ]);

    if (!product) {
      return reply.code(404).send({ error: 'Product not found' });
    }

    // Return different shapes based on client type
    if (clientType === 'mobile') {
      return {
        id: product.id,
        name: product.name,
        price: formatMobilePrice(product),
        thumbnail: product.images[0],
        rating: reviews.average,
      };
    }

    // Web — rich data
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: formatWebPrice(product),
      images: product.images,
      specs: product.specifications,
      seller: seller ? { name: seller.name, rating: seller.rating } : null,
      reviews: {
        average: reviews.average,
        count: reviews.total,
        items: reviews.items,
      },
    };
  });
};
```

---

### Pattern 3 — GraphQL BFF

GraphQL is a natural fit for BFF because it lets the frontend request exactly the fields it needs from a schema that stitches together multiple services.

```typescript
// bff-service/src/schema.ts
import { makeExecutableSchema } from '@graphql-tools/schema';

const typeDefs = `
  type Query {
    dashboard: DashboardData!
    product(id: ID!): Product
    cart: Cart!
  }

  type DashboardData {
    user: User!
    recentOrders(limit: Int = 5): [Order!]!
    unreadNotificationsCount: Int!
    stats: UserStats!
  }

  type Product {
    id: ID!
    name: String!
    price: FormattedPrice!
    images: [String!]!
    seller: Seller
    reviews(limit: Int = 5): ReviewConnection!
  }
  # ... more types
`;

const resolvers = {
  Query: {
    dashboard: async (_parent, _args, context) => {
      const { userId, services } = context;
      return { userId, services }; // pass to field resolvers
    },
  },
  DashboardData: {
    user: async ({ userId, services }) => services.userService.getUser(userId),
    recentOrders: async ({ userId, services }, { limit }) =>
      services.orderService.getOrders(userId, { limit }),
    unreadNotificationsCount: async ({ userId, services }) =>
      services.notificationService.getUnreadCount(userId),
    stats: async ({ userId, services }) =>
      services.analyticsService.getUserStats(userId),
  },
};
```

The frontend sends a single GraphQL query and gets exactly what it needs — no more, no less.

---

## Error Handling and Resilience

A production BFF must handle partial failures gracefully — if the reviews service is down, the product page should still render without reviews rather than returning a 500 error.

```typescript
// Resilient BFF pattern with partial failure handling
async function buildProductPage(id: string, userId: string) {
  const [productResult, reviewsResult, recommendationsResult] = await Promise.allSettled([
    catalogService.getProduct(id),
    reviewService.getReviews(id).catch(() => null),         // graceful degradation
    recommendationService.getRecommendations(id, userId),   // optional feature
  ]);

  // Product is required — fail fast if unavailable
  if (productResult.status === 'rejected' || !productResult.value) {
    throw new ServiceUnavailableError('Product not found');
  }

  return {
    product: productResult.value,
    // Reviews are optional — return null if service is down
    reviews: reviewsResult.status === 'fulfilled' ? reviewsResult.value : null,
    // Recommendations are optional
    recommendations: recommendationsResult.status === 'fulfilled'
      ? recommendationsResult.value
      : [],
    // Client can show degraded UI based on this
    _meta: {
      reviewsAvailable: reviewsResult.status === 'fulfilled',
      recommendationsAvailable: recommendationsResult.status === 'fulfilled',
    },
  };
}
```

---

## BFF Caching Strategy

```typescript
// Next.js App Router — built-in fetch caching in BFF routes
export async function GET(request: NextRequest) {
  const products = await fetch(`${process.env.CATALOG_URL}/products/featured`, {
    // Cache for 60 seconds, revalidate in background (stale-while-revalidate)
    next: { revalidate: 60 },
  }).then(r => r.json());

  // Per-user data — no caching
  const cart = await fetch(`${process.env.CART_URL}/cart/${userId}`, {
    cache: 'no-store',
  }).then(r => r.json());

  return NextResponse.json({ products, cart });
}
```

For Redis-based caching in a standalone BFF:
```typescript
import { createClient } from 'redis';
const redis = createClient({ url: process.env.REDIS_URL });

async function getCachedOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds = 300
): Promise<T> {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached) as T;

  const fresh = await fetcher();
  await redis.setEx(key, ttlSeconds, JSON.stringify(fresh));
  return fresh;
}

// Usage in route handler
const featuredProducts = await getCachedOrFetch(
  'featured-products',
  () => catalogService.getFeaturedProducts(),
  60 // 1 minute
);
```

---

## When NOT to Use BFF

BFF adds operational complexity — another service to deploy, monitor, and maintain. Don't use BFF when:

1. **You have a single client** — a generic API is fine.
2. **Your team is small** — the overhead outweighs the benefits.
3. **Your data needs are uniform** — all clients need the same data shape.
4. **You already have GraphQL** — GraphQL inherently solves the over/under-fetching problem.
5. **You're building an MVP** — optimize when you know the pain points.

---

## BFF in a Monorepo Setup (Real-World Example)

Google's architecture team and companies like Netflix, SoundCloud, and Zalando have published extensively on BFF. Here's a realistic monorepo layout:

```
packages/
  bff-web/
    src/
      routes/
        api/
          dashboard.ts
          products/
            [id].ts
          checkout.ts
      middleware/
        auth.ts
        rateLimit.ts
        logging.ts
      services/
        catalogClient.ts    ← typed HTTP client for catalog service
        orderClient.ts
        userClient.ts
      utils/
        formatting.ts
        errors.ts
    tests/
      integration/
        dashboard.test.ts
      unit/
        formatting.test.ts
  bff-mobile/
    src/
      # Similar structure, different data shaping
  web-app/
    # React app consuming bff-web
  mobile-app/
    # React Native app consuming bff-mobile
```

---

## Summary

| When to use BFF | Benefit |
|---|---|
| Multiple client types with different data needs | Tailored APIs, no over/under-fetching |
| Frontend teams need to move fast | Ownership and autonomy |
| Auth token security matters | Server-side token storage |
| Reducing client-side request waterfalls | Aggregation at BFF layer |
| Complex data transformation | Keep React components clean |

The BFF pattern is particularly powerful in the React ecosystem because Next.js API routes or a Node.js service written by the same team can be developed, typed, tested, and deployed alongside the frontend — making it a natural complement to React application architecture.
