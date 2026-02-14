# Chapter 9: Engineering Leadership & Management

For **CTO, VP of Engineering, or Staff/Principal** roles, the interview shifts from "How do I build this?" to "How do I ensure *we* can build this?"

## 1. Strategic Thinking: Build vs. Buy

One of the most critical decisions a leader makes.

*   **The Rule**: **Buy** everything that is *commodity* (Auth, Payments, Logging, Email). **Build** only what is your *Core Differentiator* (your Secret Sauce).
*   **Example**: Don't build your own Chat system unless you are Slack. Use Stream or Sendbird.
*   **Cost of Building**: It's not just dev time. It's maintenance, security patches, upgrades, and onboarding new hires to a custom tool forever.

## 2. Managing Technical Debt

Tech debt is not inherently bad; it's a financial instrument. You take on debt to ship faster (speed to market).

**Strategies to manage it**:
1.  **The Boy Scout Rule**: "Leave the code cleaner than you found it." allocated 10-20% of every sprint to refactoring.
2.  **Tech Debt Portfolio**: Treat debt like a backlog. Label it (High Interest vs Low Interest).
    *   **High Interest**: A messy core library that everyone touches daily. Fix this immediately.
    *   **Low Interest**: A messy admin script used once a year. Ignore it.
3.  **The "Rewrite" Trap**: Avoid total rewrites. Prefer incremental refactoring (Strangler Fig).

## 3. Team Topology & Culture (Conway's Law)

*   **Autonomy**: Create cross-functional squads (Backend + Frontend + QA + PM) that can ship a feature end-to-end without waiting on another team.
*   **Psychological Safety**: Google's "Project Aristotle" found this is the #1 predictor of high-performing teams. Engineers must feel safe to propose crazy ideas or admit mistakes without fear of blame.
*   **Hiring**: Hire for "Slope" (trajectory/learning speed), not just "Y-Intercept" (current skill).

## 4. Interview Q&A: Leadership

### Q1: "How do you handle a conflict between two Senior Engineers who disagree on an architecture?"

**Bad Answer**: "I pick the best one and tell them to do it." (Dictator).
**Bad Answer**: "I let them fight it out." (Weak).

**Good Answer (Disagree and Commit)**:
"I facilitate a 'Design Review'. I ask both to write a 1-page **RFC (Request for Comments)** listing Pros, Cons, and Risks.
We discuss it as a group. We look at data: 'Which is simpler? Which scales better?'
If it's a tie, I make the decision to break the deadlock, but I explain *why* based on business goals (e.g., 'Option A is faster to market, which is our priority right now'). We then adopt the 'Disagree and Commit' principle—once decided, we all support it 100%."

### Q2: "A critical project is slipping. We are going to miss the deadline. What do you do?"

**The Framework**:
1.  **Communicate Early**: Bad news must travel fast. Tell stakeholders *now*, not on the deadline day.
2.  **Scope Hammer**: Don't move the date; cut the scope. "We can hit the date if we drop features C, D, and E. We will launch with just A and B (MVP)."
3.  **Add Resources? (Brooks' Law)**: "Adding manpower to a late software project makes it later." Avoid throwing new people at it unless the task is perfectly parallelizable.
4.  **Protect the Team**: Don't mandate 'Death March' overtime. It destroys morale and creates bugs.

### Q3: "How do you measure Engineering Productivity?"

**Trap**: Don't say "Lines of Code" or "Commits per day."

**Better Metrics (DORA Metrics)**:
1.  **Deployment Frequency**: How often do we ship?
2.  **Lead Time for Changes**: Time from "Commit" to "Production".
3.  **Change Failure Rate**: What % of deployments cause an incident?
4.  **Mean Time to Recovery (MTTR)**: How fast do we fix it?

These measure *velocity* and *stability*, which are the true outputs of engineering.

## 5. Incident Management (War Room)

When site is down:
1.  **Assign Roles**:
    *   **Incident Commander**: Runs the call. Does NOT code.
    *   **Scribe**: Writes down timeline.
    *   **Ops/Dev**: Debugging.
    *   **Comms**: Updates the status page/customers.
2.  **Protocol**: "Status update every 15 mins."
3.  **Post-Mortem**: Required after resolution. "5 Whys." focus on *Process* failure, not *Human* error. (e.g. "Why did the dev push bad code?" -> "Because CI didn't catch it." -> "Why?" -> "Missing test case.")

