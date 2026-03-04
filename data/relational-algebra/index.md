# Relational Algebra, Predicate Logic, and Lojban

This book delves into relational algebra in detail, its connection to predicate logic and SQL, and how these fundamental database concepts can be expressed in the Lojban constructed language. Lojban is based on predicate logic, which makes it particularly suitable to act as an expressive, unambiguous substrate for querying and modeling relational data.

## Table of Contents
1. [Relational Algebra Fundamentals](#relational-algebra-fundamentals)
2. [Connection to Predicate Logic](#connection-to-predicate-logic)
3. [Relationship with SQL](#relationship-with-sql)
4. [Relational Algebra in Lojban](#relational-algebra-in-lojban)
5. [Common SQL Concepts: Sort By and Group By](#common-sql-concepts-sort-by-and-group-by)
6. [Case Studies and Practical Examples](#case-studies-and-practical-examples)

---

## Relational Algebra Fundamentals

Relational algebra is a procedural query language developed by Edgar F. Codd that serves as the theoretical foundation for relational databases. It operates on "relations" (conceptually tables) and produces new relations as a result.

The core operations in relational algebra include:

*   **Selection ($\sigma$)**: Filters the rows of a relation based on a specified condition (a predicate).
*   **Projection ($\pi$)**: Filters the columns of a relation, returning only the specified attributes (and discarding duplicates since the result is mathematically a set).
*   **Rename ($\rho$)**: Changes the names of the attributes in a relation or the name of the relation itself.
*   **Union ($\cup$)**: Combines all distinct tuples from two relations. The relations must be *union-compatible* (have the same number of attributes and matching domains).
*   **Set Difference ($-$)**: Returns tuples that belong to the first relation but not the second.
*   **Cartesian Product ($\times$)**: Combines every tuple from the first relation with every tuple from the second relation. 
*   **Join ($\bowtie$)**: A derived operation (typically based on Cartesian product followed by selection) that merges rows from two relations when certain common attributes match.

---

## Connection to Predicate Logic

Predicate logic (first-order logic) is a formal system in which propositions are modeled via variables, predicates, and quantifiers ($\forall$, $\exists$). 

Relational databases conceptually use the same model. A relation schema is fundamentally an $n$-ary predicate. For example, a relation schema `Employee(ID, Name, Salary)` matches the predicate $Employee(x, y, z)$. 

*   A **tuple** in the table is an instantiation of variables that makes the predicate True. For example, `(123, 'Alice', 50000)` makes $Employee(123, \text{'Alice'}, 50000)$ evaluate to True. Every row in the relation represents a known true fact under this predicate.
*   **Selection ($\sigma$)** uses propositional logic formulas to evaluate truth against existing tuples.
*   **Queries** in relational algebra correspond to formulas in relational calculus, a declarative version of the query language built strictly upon predicate logic. Codd's theorem states that relational algebra and relational calculus are logically equivalent in expressive power, provided queries are "domain-independent."

Because Lojban's grammar strictly implements first-order predicate logic, a direct translation from relational representations into Lojban sentences is natural.

---

## Relationship with SQL

While relational algebra represents a mathematically robust procedural method for processing sets, SQL (Structured Query Language) is the commercial declarative language inspired by it.

*   **Declarative vs. Procedural**: In SQL, you declare *what* data you want (using `SELECT`). Under the hood, the Database Management System (DBMS) translates the SQL query into an equivalent abstract syntax tree composed of relational algebra operations, which describes *how* to procedurally fetch the data.
*   **Sets vs. Bags**: Theoretical relational algebra strictly works with *sets* (no duplicate tuples allowed). SQL operates on *bags* or *multisets* (duplicates are permitted unless explicitly removed via `DISTINCT`).
*   **Operation Mapping**:
    *   **Selection ($\sigma$)** $\iff$ `WHERE` clause
    *   **Projection ($\pi$)** $\iff$ `SELECT` clause
    *   **Join ($\bowtie$)** $\iff$ `JOIN` clauses (`INNER JOIN`, `LEFT JOIN`, etc.)
    *   **Union ($\cup$)** $\iff$ `UNION` operator
    *   **Set Difference ($-$)** $\iff$ `EXCEPT` or `MINUS`

---

## Relational Algebra in Lojban

Lojban constructs its semantics around predicates (brivla). A standard brivla assigns a relationship between its positional arguments (sumti). Therefore, a database table is precisely an observation of a Lojban selbri across many different sets of arguments.

To discuss the structure of data querying itself (the algebra) in Lojban, we propose a new specialized lexicon of *fu'ivla* (loanwords or constructed words) and lujvo (compound words):

### Core Lojban Terminology

*   **Database Table / Relation**: `selcmickini` (se cmima ckini - set of relations) or simply `kicre` (short for relational set). Let's propose **`kricku`** (database / relational book).
*   **Row / Tuple**: `ponda'i` (porsi danfu - sequence instance) or **`seljudri`** (entity of a given predicate instance).
*   **Column / Attribute**: `terckini` (attribute of relation) or simply **`kalselci`** (column/cell factor). 
*   **Select ($\sigma$)**: **`cuxna`** (to choose/filter).
*   **Project ($\pi$)**: **`pilcuxna`** (to select parts/columns) or `kazycuxna` (class-based select).
*   **Join ($\bowtie$)**: **`joigro`** (from joi + girzu - joined group) or **`kanskycpina`** (relationally combined). 
*   **Rename ($\rho$)**: **`cmevi'e`** (cmene vimcu/binxo - name change/alteration).

### Lojban Predicate Equivalence Example
Given table: `zgana(observer, object, conditions)`
SQL:
```sql
SELECT observer FROM zgana WHERE object = "moon";
```
Lojban Relational Algebra equivalent:
$$ \pi_{observer}(\sigma_{object = \text{"moon"}}(zgana)) $$
In Lojban grammar, this translates cleanly into an internal predicate query:
*`ma zgana lo lunra`* (Who observes the moon?)

---

## Common SQL Concepts: Sort By and Group By

While sorting and grouping are not strictly part of Codd's original relational algebra (they belong to extended relational algebra for analytical databases), they are essential standard operations in SQL. Lojban needs precise ways to express these.

### 1. ORDER BY (Sort By)
Sorting transforms an unordered set of tuples into an ordered sequence or list based on a key attribute.

*   Proposed Term: **`porgau`** (porsi gasnu - to make into a sequence) or **`selsycpaci`** (sorted relation). 
*   In sentence form: "We sequence the relation by column X." -> *`.i mi'o porgau lo kricku fi lo jai se sela'u`* (We sequence the database table ordered-by...).
*   **ASC / DESC**: `mahygau` (increasing) / `mlegygau` (decreasing).

### 2. GROUP BY and Aggregation
Grouping partitions tuples into subsets sharing a common attribute value, allowing aggregation over those subsets.

*   Proposed Term for Group By: **`girgau`** (girzu gasnu - to group).
*   Proposed Term for Aggregate: **`cunsni`** (from cunso + sinxa or similar, representing a summary/computed stat) or **`zumcpa`** (to extract mass property).
*   Specific Aggregators:
    *   `SUM()` -> **`su'ofle`** (summation) / `pavyjmi`
    *   `COUNT()` -> **`klacpe`** (quantity request) / `se klani`
    *   `AVG()` -> **`midycun`** (middle/average value)
    *   `MAX()` -> **`traji`** (superlative)
    *   `MIN()` -> **`mletra`** (lowest superlative)

---

## Case Studies and Practical Examples 

Let's assume a schema modeling transactions in a store, using a Lojban selbri as our table structure.
Table **`vecnu`** (seller, buyer, item, price).

### Example 1: Basic Selection & Projection
**Goal**: Get all the items that Alice bought.
*   **Algebra**: $\pi_{item}(\sigma_{buyer = \text{"Alice"}}(vecnu))$
*   **SQL**: `SELECT item FROM vecnu WHERE buyer = 'Alice'`
*   **Lojban Query**: *`ma se vecnu la .alis.`*
*   **Lojban Procedural Statement**: *`.i mi'o pilcuxna lo te vecnu tu'a lo se cuxna be la .alis. beife lo se vecnu bei lo kricku`*

### Example 2: JOIN Operations
We have the `vecnu` table, and another table **`kosta`** (item, cost_to_manufacturer).
**Goal**: Combine tables to see sales next to manufacturing costs.
*   **Algebra**: $vecnu \bowtie_{\text{item}} kosta$
*   **SQL**: `SELECT * FROM vecnu JOIN kosta ON vecnu.item = kosta.item`
*   **Lojban Query**: *`coi ro ponda'i noi ke'a joigro lo vecnu ku joi lo kosta poi te vecnu ke'a`*
*   **Lojban Procedural**: *`.i joigro lo vecnu ku joi lo kosta sepi'o lo te vecnu kalselci`*

### Example 3: GROUP BY & SUM
**Goal**: Get the total revenue for every seller.
*   **Algebra (Extended)**: $\gamma_{\text{seller, SUM(price)}}(vecnu)$
*   **SQL**: `SELECT seller, SUM(price) FROM vecnu GROUP BY seller`
*   **Lojban Procedural Statement**: *`.i girgau lo kricku fi lo vecnu kalselci .i zumcpa su'ofle lo ve vecnu kalselci`*
(We group the table by the seller column, and apply a sum-aggregation to the price column.)

### Example 4: ORDER BY
**Goal**: List all sales ordered by price from highest to lowest.
*   **SQL**: `SELECT * FROM vecnu ORDER BY price DESC`
*   **Lojban Procedural Statement**: *`.i porgau lo kricku tezu'e lo ve vecnu kalselci noi mlegygau`*
(We sequence the table by the price column such that it decreases.)

---
### Conclusions

Because Lojban was intentionally designed around the logical formulations that birthed relational database theory, bridging the gap between database query languages and spoken Lojban relies mostly on agreeing to procedural conventions. These proposed fu'ivla and lujvo (`kricku`, `pilcuxna`, `joigro`, `girgau`, `porgau`) grant us a robust framework to speak about data manipulation natively.
