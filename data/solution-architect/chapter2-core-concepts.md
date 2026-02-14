# Chapter 2: Core System Design Concepts

This chapter covers the foundational concepts you must master for any system design interview.

## Scalability vs. Performance

It is crucial to distinguish between these two often-confused terms.

*   **Performance**: "How fast is it?" (Latency, response time).
    *   *Focus*: Optimizing a single unit of work (e.g., making a database query faster, optimizing an algorithm).
*   **Scalability**: "How much can it handle?" (Throughput, load).
    *   *Focus*: Adding more units to handle increased load (e.g., adding more servers).

> [!TIP]
> You can have a **highly performant system that doesn't scale** (e.g., a super-fast single server that crashes at 10k concurrent users). Conversely, you can have a **scalable system that isn't performant** (e.g., a massive distributed cluster that returns every request in 2 seconds).

### Vertical vs. Horizontal Scaling
*   **Vertical Scaling (Scale Up)**: Adding more power (CPU, RAM) to an existing machine.
    *   *Pros*: Simple, no code changes required.
    *   *Cons*: Hardware limits, expensive, single point of failure.
*   **Horizontal Scaling (Scale Out)**: Adding more machines to the pool.
    *   *Pros*: Theoretically infinite scaling, cheaper commodity hardware, redundancy.
    *   *Cons*: Complex (requires load balancing, data partitioning/sharding), network overhead.

## Availability & Reliability

*   **Reliability**: The system does the right thing (bug-free, accurate data).
*   **Availability**: The system is there when you need it (Uptime).

**Key Metrics:**
*   **SLA (Service Level Agreement)**: A contractual promise to customers (e.g., "We guarantee 99.9% uptime").
*   **SLO (Service Level Objective)**: An internal goal, usually stricter than the SLA (e.g., "Target 99.95% so we have a buffer").
*   **RTO (Recovery Time Objective)**: The maximum acceptable time the system can be down after a failure.
*   **RPO (Recovery Point Objective)**: The maximum acceptable amount of data loss (measured in time, e.g., "5 minutes of data").

### Designing for Failure
Assume everything will fail. Hard drives crash, networks partition, and data centers lose power. Your design must be **resilient**.
*   **Redundancy**: Eliminate single points of failure (SPOF) by duplicating components.
*   **Failover**: Automatic switching to a backup system when the primary fails.

## 🧠 The CAP Theorem (In Practice)

In a distributed system, you can only guarantee **2 of the following 3** properties:

1.  **Consistency (C)**: Every read receives the most recent write or an error.
2.  **Availability (A)**: Every request receives a (non-error) response, without the guarantee that it contains the most recent write.
3.  **Partition Tolerance (P)**: The system continues to operate despite an arbitrary number of messages being dropped or delayed by the network between nodes.

> [!IMPORTANT]
> **Partition Tolerance is not optional** in real-world distributed systems. Networks fail. Therefore, you are essentially choosing between **CP** (Consistency + Partition Tolerance) and **AP** (Availability + Partition Tolerance).

*   **CP (Availability sacrifices)**: "Sorry, the system is down/readonly because we can't talk to the leader."
    *   *Example*: Banking systems. You'd rather show an error than show an incorrect balance.
*   **AP (Consistency sacrifices)**: "You like this post, but your friend might not see the like for 5 seconds."
    *   *Example*: Social media feeds, DNS. You'd rather show slightly stale data than show an error page.

### ACID vs. BASE
*   **ACID (Relational/SQL)**:
    *   **Atomicity**: All or nothing.
    *   **Consistency**: Data is valid before and after.
    *   **Isolation**: Transactions don't interfere.
    *   **Durability**: Saved data stays saved.
*   **BASE (NoSQL/AP)**:
    *   **Basically Available**: The system guarantees availability.
    *   **Soft state**: State may change over time, even without input.
    *   **Eventual consistency**: The system will eventually become consistent once it stops receiving inputs.

## 🧱 Interview Q&A

**Interviewer:** "I have a legacy SQL database that is becoming slow. How do I scale it?"

**Candidate:**
"I'd approach this in phases:
1.  **Optimize First**: Check for missing indexes, slow queries (N+1 problems), and unnecessary data fetching.
2.  **Vertical Scaling (Scale Up)**: Increase RAM/CPU on the existing instance. This is the fastest, cheapest short-term fix.
3.  **Read Replicas (Scale Out Reads)**: If the workload is read-heavy (usually 80/20 rule), add Read Replicas and point GET requests to them.
4.  **Caching**: Implement Redis/Memcached for frequently accessed data.
5.  **Sharding (Scale Out Writes)**: If write throughput is the bottleneck, partition the data (e.g., by UserID) across multiple DB instances. This is complex and a last resort."

**Interviewer:** "Design a system for a real-time stock trading platform. Which CAP property do you sacrifice?"

**Candidate:**
"For a stock trading core engine, **Consistency is non-negotiable**. If I buy a stock, I must own it immediately, and no one else can buy it.
Therefore, I must choose a **CP (Consistency + Partition Tolerance)** system.
This means if the network partitions or nodes fail, the system must **reject trades** (become unavailable) rather than allow a double-spend or incorrect balance. I would use a strongly consistent database (like PostgreSQL or a dedicated ledger) and avoid eventually consistent stores for the core ledger."
