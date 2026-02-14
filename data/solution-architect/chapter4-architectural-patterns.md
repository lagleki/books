# Chapter 4: Architectural Patterns & Trade-offs

Architecture is the art of trade-offs. There is no "best" pattern, only the one that best fits your current constraints.

## Monolith vs. Microservices

### The Monolith
*   **Definition**: A single codebase where all components (User, Order, Payment) run in the same process/server.
*   **Pros**: Simple to develop, deploy, and debug initially. No network latency between internal calls.
*   **Cons**: Hard to scale specific parts (must scale the whole app). A memory leak in one module crashes everything. Large teams step on each other's toes.

### Microservices
*   **Definition**: Splitting the application into small, independent services that communicate over a network (HTTP/gRPC).
*   **Pros**: Independent scaling (scale "Payments" x10, leave "User" x1). Technology diversity (Python for ML, Node for I/O). Team autonomy.
*   **Cons**: **Complexity**. Network failure is now a daily reality. Distributed transactions are hard (Sagas). DevOps overhead is massive.

> [!WARNING]
> **The Distributed Monolith Trap**: You split the code, but Service A cannot work without calling Service B, C, and D synchronously. You now have the **latency** and **failure modes** of a distributed system with the **tight coupling** of a monolith. This is the worst of both worlds.

## Event-Driven Architecture (EDA)
Decouple services using events. Instead of Service A calling Service B, Service A publishes an event ("User Signed Up"), and Service B listens for it.

*   **Kafka**: Log-based. Messages are persisted and can be "replayed". High throughput. Good for streaming data and "source of truth" event logs.
*   **RabbitMQ**: Queue-based. Messages are transient (removed after consumption). Great for complex routing rules and task distribution.

### Idempotency
In EDA, messages *will* eventually be delivered more than once (network retries). Your consumers must be **idempotent**.
*   **Definition**: Processing the same message multiple times has the same effect as processing it once.
*   **Implementation**: Track processed message IDs in a database or Redis. `IF exists(msg_id) THEN skip`.

## Serverless (FaaS)
*   **Definition**: Run code (Functions) without provisioning or managing servers (e.g., AWS Lambda).
*   **Pros**: Pay-per-use (zero cost when idle). Infinite scaling (in theory). No OS management.
*   **Cons**:
    *   **Cold Starts**: The delay when the cloud provider spins up a new container for your function (can be 1-5 seconds for Java/C#).
    *   **Vendor Lock-in**: Hard to move off AWS Lambda to Azure Functions.
    *   **Stateless**: DB connections are hard to manage (need connection pooling proxies like RDS Proxy).
