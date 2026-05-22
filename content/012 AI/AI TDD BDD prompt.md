---
type: reference
created: 2026-05-15
---

# CLAUDE.md — Contract-First Development

  

## Purpose

Source of truth is the **Contract**, not implementation.

Contract = **SPEC + INTERFACE + INVARIANTS + VERIFICATION**

  

Your job: implement changes that satisfy the Contract with minimal tech debt.

  

---

  

## Non-Negotiable Rules

  

**NEVER modify without explicit approval:**

- SPEC documents (docs/specs/*.md)

- Public INTERFACE / type signatures

- INVARIANTS (docs/invariants/*.md)

- Test assertions / verification expectations

  

**If Contract seems wrong:** STOP and ask. Do not "fix" by editing specs/tests.

  

**If implementation seems impossible within Contract:**

- Explain the conflict

- Suggest contract change (human decides)

- Never silently work around

  

---

  

## What Human Must Own (100% Understand)

  

- SPEC (user-visible behavior, acceptance criteria)

- INTERFACE (public API boundaries, type signatures)

- INVARIANTS (Always/Never rules)

- Key risks (security, performance, concurrency)

- How to verify (tests/manual checklist)

  

You do NOT need human to understand every line of internal implementation, but it must be verifiable.

  

---

  

## Invariant Types

  

| Type | If Broken | Example |

|------|-----------|---------|

| Safety | Critical damage | "Rewards only from server" |

| Consistency | Data corruption | "Balance >= 0", "One UI per player" |

| Boundary | Layer violation | "Server never touches GUI" |

| Performance | Resource leak | "Max N spawns per frame" |

  

Write invariants as **Always/Never** statements with enforcement location.

  

---

  

## Standard Workflow

  

### Step 0 — One Ticket

Work on ONE feature/bug at a time.

  

### Step 1 — SPEC First

If no SPEC exists, ask for it or propose draft. Do not implement yet.

SPEC must include: Goal, Non-goals, Out-of-scope, User flow, Edge cases, Acceptance Criteria, Done definition.

  

### Step 2 — Freeze INTERFACE

Confirm public API before internals. Present 1-2 alternatives with tradeoffs if unsure.

  

### Step 3 — Lock INVARIANTS

Confirm as Always/Never statements with enforcement location.

  

### Step 4 — Define VERIFICATION

Tests or manual checklist (V1, V2, V3...). Migrate to automation later.

  

### Step 5 — Plan First

Before code, produce plan:

```

SCOPE: what changes / what doesn't

FILES: create/modify list

STEPS: small steps (~30 min each)

VALIDATION: what to check after each step

RISKS: rollback note

```

  

### Step 6 — Implement Small

- Do Step 1-3 only, then stop for verification

- State exactly how to validate after each increment

  

### Step 7 — Self-Review

Check: invariant violations, boundary mistakes, unnecessary complexity

  

### Step 8 — Evolve Verification (On Request)

Only suggest automation improvements when human asks or when manual verification becomes clearly repetitive (5+ times same check).

  

---

  

## Rollback Policy

  

If invariant violated or verification fails:

1. **STOP** — don't add more code

2. Analyze root cause (report which invariant/AC violated)

3. Prefer revert over "patch forward"

4. Propose fix, wait for approval

5. Fix and re-verify ALL tests

  

---

  

## Testing Rules

  

- Don't test UI/rendering/engine first

- Extract **pure logic** (calculators, stores, state machines) and test those

- Tests = Contract. Never change tests just to make them pass.

  

---

  

## File Structure

  

Structure varies by project scale. Check existing structure before proposing new files.

  

**General pattern:**

```

docs/specs/         # Feature specs (human-owned)

docs/invariants/    # Rules by domain (human-owned)

src/                # Implementation (structure varies)

tests/              # Test files

```

  

**When proposing new files:** Follow existing project conventions. If unclear, ask about preferred structure.

  

Link artifacts: SPEC ↔ INVARIANTS ↔ INTERFACE ↔ TESTS

Add header comments when feasible.

  

---

  

## Output Format

  

When proposing changes, include:

- Which Contract items you relied on

- Files you will change

- How to validate

- Risks or assumptions

  

If ambiguous, ask 3-7 targeted questions before coding.

  

---

  

## Quick Reference

  

### Forbidden

- Changing SPEC/Invariants/Tests without approval

- Implementing Non-goals

- Modifying Out-of-scope code

- Skipping verification

- "Fixing" tests to pass

  

### Required

- Read contracts before implementing

- Propose plan, wait for approval

- Run tests after changes

- Report violations immediately

- Ask when contracts seem wrong