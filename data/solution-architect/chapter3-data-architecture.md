# Chapter 3: Data Architecture Deep Dive

This is often the "make or break" section of the interview. A generic "I'll use a database" answer is a guaranteed fail. You must define *which* database and *why*.

## SQL vs. NoSQL Decision Matrix

No single database fits every use case. Use this matrix to guide your decision.

| Feature | **Relational (SQL)** | **Non-Relational (NoSQL)** |
| :--- | :--- | :--- |
| **Structure** | Rigid Schema (Tables, Rows, Columns, Foreign Keys). | Flexible Schema (Documents, Key-Value, Graphs). |
| **Scaling** | Vertical scaling (bigger machine) is easiest. Horizontal scaling (sharding) is complex and often manual. | Horizontal scaling (sharding) is often built-in and seamless across commodity hardware. |
| **Consistency** | **ACID** (Strong Consistency). Crucial for transactions. | **BASE** (Eventual Consistency) *mostly*. Prioritizes availability. |
| **Querying** | Powerful SQL (JOINs, Aggregations). | Varies (JSON-based, simple lookups). JOINs often handled in app code. |
| **Best For** | Financials, Inventory, Structured Data, Complex Reporting. | Massive Scale, Unstructured inputs, Rapid prototyping, Real-time feeds. |

## ⚔️ PostgreSQL vs. MongoDB

### PostgreSQL (The Reliable Workhorse)
*   **When to use**:
    *   Data integrity is paramount (e.g., financial transactions).
    *   You have complex relationships (Users -> Orders -> Items -> Invoices).
    *   You need strict ACID compliance.
    *   You need advanced geospatial queries (PostGIS).
*   **JSON capabilities**: Postgres has `JSONB`! You can store document interactions *within* a relational table. This effectively makes Postgres a hybrid database, often eliminating the need for MongoDB in diverse use cases.
*   **Limitations**: Harder to write-scale massively (millions of writes/sec) compared to Mongo/Cassandra without complex partitioning or extensions like Citus.

### MongoDB (The Flexible Scaler)
*   **When to use**:
    *   Your schema changes frequently or is unknown upfront.
    *   You have deep, nested documents that are usually read together.
    *   You need massive **Write** throughput that exceeds the capacity of a single Postgres node.
    *   You need built-in sharding and high availability with Replica Sets.
*   **The Trap**: Don't use it just because you don't want to enforce a schema. "Schema-less" usually means "Implicit Schema that breaks your code later".
*   **Real-Life Failure**: Using MongoDB for financial ledgers. Eventually, you will need multi-document transactions (which Mongo *can* do now, but it's not its native strength) and complex reporting joins, leading to performance pain.

## 🐘 Cassandra & Wide-Column Stores

**The "Discord" Example**
Cassandra is designed for **Writes**. Massive, relentless streams of writes (e.g., Logs, Chat history, IoT sensor data).

*   **Architecture**: Distributed Hash Table (DHT). No Master node; all nodes are peers. Data is replicated across N nodes (tunable consistency).
*   **Trade-off**: Querying is very limited. You can query *only* by the Primary Key (Partition Key + Clustering Key). No `JOIN`s. No `WHERE` clauses on non-indexed columns (efficiently). You must model your data *based on your queries*.

### Case Study: Discord's Migration
*   **Initial State**: Used Cassandra to store billions of chat messages.
*   **Problem**: **"Hot Partitions"**. Everyone talking in one popular channel created deep queues on specific nodes (partitions), causing latency spikes. Cassandra's read performance suffered as partitions grew large.
*   **Migration**: Moved to **ScyllaDB** (a C++ rewrite of Cassandra) combined with a custom Rust data layer.
*   **Solution Elements**:
    *   **Request Coalescing**: Grouping multiple requests for the same partition.
    *   **ScyllaDB**: Better handling of large partitions and lower garbage collection pause times (since C++ has no GC).
*   **Lesson**: Even highly scalable databases like Cassandra have physical limits (Hot Partitions). Understanding data access patterns is critical.

## 🧱 Interview Q&A

**Interviewer: "Design the data layer for a user profile system where fields change often (social links, bio, themes)."**

**Candidate:**
"For a user profile with a flexible schema, I would choose a **Document Store (NoSQL)** like **MongoDB** or **DynamoDB**.
*   **Why**: Users might have different fields (some have Twitter, some have BlueSky). A rigid SQL schema would require frequent `ALTER TABLE` migrations or many sparsely populated columns. A JSON document structure aligns perfectly with the object model."

**Interviewer: "We are building a stock trading engine. We need to handle millions of transactions per second with zero data loss. Speed is key."**

**Candidate:**
"Be careful with the word 'Speed'. For a trading engine:
1.  **Order Matching**: This needs extreme low latency. I would use an **In-Memory** structure (like a custom engine or Redis) for the order book.
2.  **Ledger (Ownership)**: This needs strict **ACID Consistency**. You cannot have 'eventual consistency' in valid ownership. I would use a specialized high-performance SQL layer (like **PostgreSQL** or **TimescaleDB** for tick data) or a dedicated ledger database (like **TigerBeetle**) that prioritizes consistency over availability (CP system).
3.  I would **never** use MongoDB or Cassandra for the core ledger due to their default eventual consistency models."

**Interviewer: "We need to store 'Who follows whom' for 1 Billion users. We need to find 'Friends of Friends of Friends' efficiently."**

**Candidate:**
"This is a classic Graph Traversal problem.
*   **SQL Impact**: Doing `JOIN`s on a `Followers` table 3 levels deep (`A->B->C->D`) is exponentially expensive ($O(log n)$ searches repeated) and will kill the DB.
*   **Solution**: Use a **Graph Database** like **Neo4j** or **Amazon Neptune**.
*   **Why**: Graph DBs store relationships as direct pointers (physical adjacency). A 3-hop query is just following 3 pointers, which is constant time $O(1)$ relative to the total dataset size."

**Interviewer: "We deploy 10,000 IoT sensors. Each sends temperature every second. We need to graph the average temperature per minute."**

**Candidate:**
"This is a **Time-Series** problem.
*   **Volume**: 10k * 60 = 600,000 writes/minute. A standard Relational DB might choke on the indexing overhead.
*   **Pattern**: Write-heavy (Append only), Read-heavy (Aggregations over time ranges).
*   **Solution**: **TimescaleDB** (Postgres extension) or **InfluxDB**.
*   **Why**: They are optimized for high-volume ingestion and have built-in functions for 'downsampling' (automatic rollups) to query averages quickly without scanning billions of rows."
