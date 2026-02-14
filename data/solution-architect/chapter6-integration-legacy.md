# Chapter 6: Integration, Legacy Systems, & Migration

Real-world architecture often isn't about building greenfield apps with the latest tech. It's about dealing with messy legacy code, unreliable 3rd party APIs, and migrating data without losing a single byte.

## 1. The Strangler Fig Pattern (Legacy Migration)

**Concept**: Instead of rewriting a massive legacy Monolith from scratch ("The Big Bang Rewrite" - which almost always fails), you gradually replace it piece by piece.

**The Strategy (Step-by-Step)**:
1.  **Identify**: Pick one isolated functional area to modernize (e.g., "User Profile" or "Search").
2.  **Build**: Create a new Microservice for "Search" using modern tech (e.g., swapping a Java 6 app for a Go service).
3.  **Proxy**: Put an API Gateway (NGINX, Kong, AWS API Gateway) in front of the Legacy Monolith.
4.  **Route**: Configure the Gateway:
    *   `/search` -> Routes to **New Service**.
    *   `/*` (everything else) -> Routes to **Legacy Monolith**.
5.  **Strangle**: Over time, migrate `/cart`, `/checkout`, `/auth`. The Legacy Monolith shrinks until it can be retired.

**The "Anti-Corruption Layer" (ACL)**:
Sometimes the modern service models data differently than the legacy system. An ACL is a translator shim that converts the legacy dinosaur API responses into your clean, modern domain objects so your new code doesn't get polluted by legacy structures.

## 2. Resilience Patterns (Surviving 3rd Party APIs)

When integrating with external systems (Stripe, Twilio, Shipping APIs), assume they will be slow, inconsistent, or down.

### A. Circuit Breaker
If a 3rd party service fails repeatedly, **stop calling it** to prevent cascading failures.

*   **Closed (Healthy)**: Normal operation.
*   **Open (Broken)**: After N failures (e.g., 5 errors in 10s), the circuit "opens". All requests fail immediately with a fallback (No network call). This saves your thread pool from exhaustion.
*   **Half-Open (Testing)**: After a cooldown (e.g., 30s), let **one** request through. If it succeeds, close the circuit. If it fails, open it again.

### B. Exponential Backoff with Jitter
If an API call fails, don't retry immediately in a tight loop.
*   **Bad**: Retry immediately. (DDoS your own vendor).
*   **Good**: Wait 1s, 2s, 4s, 8s.
*   **Best (Jitter)**: `wait = 2^n + random_ms(0-500)`. This comes prevents "Thundering Herd" problems where all your retrying servers hit the recovered service at the exact same millisecond.

### C. Fallbacks (Graceful Degradation)
Always have a Plan B. The user should never see a 500 error page just because a non-critical service is down.

*   *Recommendation Service down?* -> Show "Global Popular Items" (cached) instead of "Personalized Picks".
*   *Inventory Service down?* -> Allow "Backorder" or show "Likely in Stock".
*   *Search Service down?* -> Show a static category list.

## 3. Data Migration Strategies (Zero Downtime)

Moving 10TB of data from Oracle to Postgres without stopping the business.

### The "Dual Write" Strategy
1.  **Setup**: Provision the new DB.
2.  **Dual Write**: Modify the Application to write to **both** Old DB and New DB. (Wrap in a transaction or catch errors so Old DB success is mandatory, New DB failure is just logged).
3.  **Backfill**: Run a background script to copy historical data from Old to New, skipping records that have already been written by the Dual Write process (idempotency helps here).
4.  **Verification**: Compare counts and random samples between DBs.
5.  **Switch Reads**: Flip a Feature Flag to read from the New DB. If bugs appear, flip it back to Old DB immediately.
6.  **Stop Old Write**: Once stable for weeks, stop writing to Old DB.
7.  **Decommission**.

## 4. Organizational Challenges

Technical problems are easy; people are hard.

*   **Conway's Law**: "Organizations design systems that mirror their own communication structure."
    *   *Fix*: If you want Microservices, you need small, autonomous squads. If you have a siloed hierarchy, you will end up with a distributed monolith.
*   **The "Not Invented Here" Syndrome**: Engineers wanting to build a custom logging framework instead of using ELK/Datadog.
    *   *Solution*: Focus on "Business Value". Does building a logger sell more shoes? No. Buy it.

## 🧱 Interview Q&A

**Interviewer:** "We have a legacy monolithic SOAP API that is slow and unmaintained. We need to move to GraphQL. How do you approach this?"

**Candidate:**
"I would use the **Strangler Fig Pattern**.
1.  I'd introduce an API Gateway to sit in front of the SOAP service.
2.  I'd spin up the new GraphQL server.
3.  Initially, the GraphQL resolvers would just wrap calls to the SOAP API (acting as an Anti-Corruption Layer). This lets frontend devs start using GraphQL immediately.
4.  Gradually, I'd refactor the resolvers to read directly from the database or new microservices, bypassing the SOAP API entirely one endpoint at a time."

**Interviewer:** "How do you handle a 3rd party Payment Gateway going down during a Black Friday sale?"

**Candidate:**
"First, **Resilience**. My system should have a **Circuit Breaker** to detect the failure instantly and stop hammering the provider.
Second, **Fallback**. Do we have a secondary provider (e.g., PayPal vs Stripe)? If so, route traffic there.
If not, can we accept the order in a 'Pending' state and process payments asynchronously later? This carries risk (payment might fail later), but it saves the sale. I’d discuss this risk trade-off with the Product Owner beforehand."
