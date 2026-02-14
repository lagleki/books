# Chapter 8: The Interview Day & Tips

## Whiteboarding Strategies

The whiteboard (or shared doc) is your stage.

1.  **Step 1: Clarify Requirements (5-10 mins)**
    *   Don't start drawing yet!
    *   Ask: "What is the scale (DAU/MAU)?" "Read-heavy or Write-heavy?" "Mobile app or Web?"
    *   Define the MVP scope: "For this 45 mins, I'll focus on the Feed generation, not the Chat feature."

2.  **Step 2: High Level Design (5-10 mins)**
    *   Draw the "Standard Boxes": Client -> Load Balancer -> API Gateway -> Service -> Database.
    *   Get a "Check-in": "Does this high-level flow look good to you?"

3.  **Step 3: Drill Down (20 mins)**
    *   Identify the **Bottleneck**. "Since we have 10M writes/second, a single SQL DB won't work."
    *   Propose the solution: "I'll shard the DB by UserID" or "I'll introduce a Write-Behind Cache."
    *   Discuss the Database Schema.

4.  **Step 4: Wrap Up (5 mins)**
    *   Mention what you missed. "If I had more time, I'd add Monitoring (Prometheus) and Distributed Tracing."

## Communication Tips

*   **Breadth first, then Depth**: Give an overview before diving into the weeds.
*   **Check in often**: "Does that make sense?" "Should I go deeper into the caching strategy?"
*   **Frameworks**: Use frameworks like **Five Pillars of AWS Well-Architected Framework** (Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization) to structure your answers.

## Critical Advice

1.  **Admit what you don't know**: "I haven't used GraphQL in production, but based on my REST experience, I assume the caching challenges would be X..." -> This shows intelligence and honesty.
2.  **Focus on Trade-offs**: Never say "Redis is the best." Say "Redis is great for speed, but `memcached` might be simpler if we don't need persistent structures."
3.  **Think Big, Start Small**: Design for the end state (10M users), but explain how you launch MVP (1k users) without over-engineering.

## Final Checklist
*   [ ] Do you know your "War Stories" by heart?
*   [ ] Can you draw a Load Balancer and describe Layer 4 vs Layer 7?
*   [ ] Can you explain "CAP Theorem" in 30 seconds?
*   [ ] Have you researched the company's tech stack?

Good luck. You got this.
