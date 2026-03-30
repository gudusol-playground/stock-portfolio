# Claude Code Instructions

## Clarification Before Implementation

Before writing any code, if the request contains ambiguous, underspecified, or potentially incomplete requirements:

1. **Stop and ask** — Do not make assumptions and proceed. Identify what is unclear.
2. **Provide concrete options** — Present 2–4 specific alternatives with brief examples so the user can choose or refine their intent.
3. **Keep it focused** — Ask only about the parts that genuinely affect implementation decisions. Do not ask about things that have an obvious default.

### When to ask:
- The UI behavior or user flow is not clearly defined
- There are multiple reasonable implementation approaches with different tradeoffs
- A data model decision would be hard to change later
- The scope of the task is unclear (e.g., "update the portfolio page" — which part?)

### When NOT to ask:
- The request is straightforward and unambiguous
- The missing detail has a clear, conventional default (e.g., loading states, error handling patterns)
- It's a minor style or naming decision that can easily be changed

### Example format when asking:
> Before I proceed, I want to confirm a few things:
>
> **1. [Ambiguous point]**
> - Option A: [description + brief example]
> - Option B: [description + brief example]
>
> **2. [Another point]**
> - Option A: ...
> - Option B: ...

## Git Workflow

- **After completing work**: `git commit` only — do NOT push automatically.
- **Push only when**: the user explicitly says to push or deploy (e.g. "push해줘", "올려줘", "배포해줘").
