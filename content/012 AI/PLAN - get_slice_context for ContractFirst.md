---
created: 2026-05-27
status: plan
tags:
  - harness
  - contractfirst
  - plan
  - get_slice_context
---

# PLAN — `get_slice_context` for the contractfirst harness

> An executable implementation plan. Drop this into the `contractfirst` repo (e.g. as `PLAN-get-slice-context.md`) and hand it to an AI working in that repo. **For this implementation task, skip the contractfirst clarification/slicing/scale gates** — just execute the slices below. Ask only on genuine ambiguity; report changes at the end.

Related design docs (context, not required to read): [[Compile-enforced Slice Harness V3]], [[하네스 설계 결정 - 컨텍스트 유도 이식]].

---

## 1. Goal

Add a **context-scoping layer** to the harness. Today contractfirst gates the *front* (clarification: `score_ambiguity`) and the *back* (verification: `run_verify`), but nothing governs the **middle** — *what code context an implementation session loads*. That gap is the failure `OVERVIEW.md` names: long sessions, drifting compliance.

Close it with a new MCP tool, `get_slice_context`, that **computes and serves** a bounded working set for one slice instead of letting the AI forage:

- the slice's own module → **full text** (you edit it)
- its dependencies → **public signatures only, bodies stripped** (you only call them)
- everything else → **listed as excluded** (not loaded; declare if needed)

## 2. Design principle (do not violate)

**Delivery, not firewall. Low-enforcement by design.**

- No sandbox, no file removal, no compiler/build/visibility gate.
- The tool does **not** block reading other files; it makes the bounded set the easy default.
- Enforcement honesty (match `OVERVIEW.md`'s three strengths):
  - `get_slice_context` output = **auditable structured output** (the packaged context is written to `.contractfirst/`).
  - The new skill "Context Boundary" rule = **skill instruction** (compliance assumption).
  - No new OS/hard-enforcement layer.
- Compliance is raised *probabilistically* by small context + short sessions + making boundary-crossing a visible, declared decision — not by physical prevention.

## 3. Where it sits in the workflow

```
[3] Clarification Gate   score_ambiguity          (front gate — intent clear?)
[4-6] Contract            spec/invariant/interface  (intent; human-owned; NO big code load)
[7] Plan
──── new session per slice ────
[8] Implement   ← ★ FIRST action: get_slice_context(module)
                  load owns(full)+deps(sig); work within it
[10] Verify Gate          run_verify               (back gate — did it work?)
```

- Fires at the **entry to Implementation (step 8)**, once per slice/session.
- Primarily **Medium+** (Micro/Small have trivial context — may skip).
- The implementation session loads exactly two bounded things: the **contract artifacts** (small, human-owned) and the **slice context** (this tool's output). Neither is the whole codebase.

## 3.5 What "the contract" is — without separate spec/invariant docs

The four contract parts (spec, invariant, interface, test) need not all be separate documents. Interface and test already live in the codebase. **Spec and invariant can too** — split each into (a) the part a machine can check, (b) the part only a human can check, (c) pure rationale. This removes the per-feature `docs/specs/` + `docs/invariants/` writing-and-syncing burden while keeping the contract enforced when the feature is later modified.

**Three homes — chosen per piece of content, not per feature:**

| Content | Home | Enforced on later edits by |
|---|---|---|
| Auto-verifiable (Acceptance Criteria; state/safety invariants; boundary rules) | tests / `assert` / architecture tests, in the codebase | `run_verify` re-runs them on every change |
| Human-verifiable only (UI/UX: layout, focus order, animation feel, "no jank") | `track_manual_checks` items — a structured checklist, **not** a written document | `run_verify(feature=...)` re-flags them as `pending_manual` after any change, blocking "done" |
| Open design intent / rationale ("why this choice") | a short comment next to the code | not enforced; co-located so it is seen, and `get_slice_context` delivers it with the module |

**Mapping the two docs:**
- **Spec** → Acceptance Criteria become test names; Goal / Non-goals become a docstring at the top of the test file; non-testable UI/UX acceptance becomes `track_manual_checks` items.
- **Invariant** → state/safety → `assert` or property-based test at the enforcement location; boundary/architecture → architecture test; the "why" → a `CONTRACT:` comment.

**How UI/UX is respected on later edits (the key point):** a feature's manual-check items are surfaced when the slice is loaded (see Slice 2) and re-armed by `run_verify(feature=...)` — editing the feature flips them back to unconfirmed, forcing the human to re-verify alignment / focus / jank before "done". A written document that nothing re-checks cannot do this.

Manual checks are a **graduation queue, not a permanent dump**: once UI test infra exists (e.g. focus order becomes assertable), an item moves from `track_manual_checks` to an automated test. (V5: "verification evolves — manual → automated → hybrid".)

**What still warrants a written document:** only **cross-cutting, project-wide** UX/architecture principles that have no single module to live in (e.g. "all destructive actions use undo, not a confirm dialog"). That is **one shared, slowly-changing doc** — not a per-feature spec. Everything feature-local goes to the three homes above.

**Honest limits:**
- A `CONTRACT:` comment can be deleted silently during an edit — same rot risk as a doc. So anything that must hold has to be **executable** (test / assert / arch-test); comments carry rationale only.
- Co-locating spec/invariant in code means you cannot `chmod 444` a whole code file. Enforcement moves from "OS lock on a doc" to "checks that run every verify" — a stronger guarantee of *adherence*, a weaker guarantee of *not being edited*. Consistent with this harness's low-enforcement stance.

## 4. Tool contract

```
get_slice_context(project_root: str, module: str, depth: int = 1) -> dict
```

| Param | Meaning |
|---|---|
| `project_root` | repo root (existing convention across all tools) |
| `module` | folder path **or** single file, relative to project_root (e.g. `mcp-server/src/contractfirst/links.py`) |
| `depth` | dependency hops to include signatures for. Default 1 (direct deps). >1 optional. |

**Return (structured):**

```json
{
  "module": "mcp-server/src/contractfirst/links.py",
  "language": "python",
  "module_files": [
    {"path": "...", "full_text": "..."}
  ],
  "dependencies": [
    {"name": "append_gate", "kind": "function",
     "signature": "def append_gate(project_root: str, record: dict) -> None",
     "doc": "Append one JSON line to gates.jsonl.",
     "source_module": "contractfirst.gatelog", "source_path": "...gatelog.py"}
  ],
  "excluded": ["verify.py", "ambiguity.py", "failure.py", "manual_checks.py", "server.py"],
  "token_estimate": 1840,
  "manifest_path": ".contractfirst/slice-context-links-20260527T1530.json",
  "warnings": ["unresolved import: third_party.foo (external; skipped)"]
}
```

**Behavior:**

1. Resolve `module` → list its source files.
2. `module_files` = those files, **full text**.
3. Parse the module's files → find imported/referenced symbols whose definitions live **outside** the module.
4. For each external dependency symbol, extract its **public signature + doc, body stripped**.
5. `excluded` = sibling modules/packages under the source root that are neither the module nor a resolved dependency (names only).
6. `token_estimate` = rough token count of the assembled payload.
7. Write the full payload to `.contractfirst/slice-context-<slug>-<ts>.json` and append a one-line record to `.contractfirst/gates.jsonl` (reuse `gatelog`).
8. Read-only except those two audit writes.

## 5. Backend interface (the language seam)

Only **two operations** are language-specific. Everything else (3-bucket assembly, token estimate, manifest) is shared.

```python
class LanguageBackend(Protocol):
    name: str
    def matches(self, module_path: str) -> bool: ...
    # {symbols: [SymbolRecord], imports: [str]}  — body-stripped
    def extract_public_surface(self, file_path: str) -> dict: ...
    # which external symbols this module depends on
    def resolve_deps(self, module_files: list[str], project_root: str) -> list[DepRef]: ...
```

**Normalized `SymbolRecord` schema (the contract that makes backends interchangeable):**

```json
{"name": "...", "kind": "function|class|method|...",
 "signature": "...", "doc": "...|null",
 "visibility": "public", "range": {"start": 0, "end": 0}}
```

**First backend = Python (`ast`), in-process.** Key points:
- Walk `FunctionDef` / `AsyncFunctionDef` / `ClassDef`.
- Public = not `_`-prefixed (honor `__all__` if present).
- **Body stripping is automatic**: emit signature from `node.name` + `ast.unparse(node.args)` + return annotation; never read `node.body`.
- Doc via `ast.get_docstring(node)`.
- `resolve_deps`: walk `ast.Import` / `ast.ImportFrom`, map targets to files under `project_root`; a target outside the module dir = dependency. Imports that resolve outside the project (stdlib / third-party) → add to `warnings`, skip (don't dump).

## 6. Files

| Action | Path | Purpose |
|---|---|---|
| **CREATE** | `mcp-server/src/contractfirst/context.py` | tool orchestration + `LanguageBackend` protocol + `PythonAstBackend` |
| **MODIFY** | `mcp-server/src/contractfirst/server.py` | register `get_slice_context` as the 8th tool (follow existing tool registration pattern) |
| **REUSE** | `mcp-server/src/contractfirst/gatelog.py` | append the one-line audit record |
| **CREATE** | `skill/references/context-scoping.md` | modular-folder convention + how the tool packages context + the "stop and declare" soft-guard |
| **MODIFY** | `skill/SKILL.md` | add the `[8]`-entry step, the Context-Boundary implementation rule, an anti-pattern, and the references entry |
| **MODIFY** | `mcp-server/README.md` | document the 8th tool in the tools table |
| **CREATE** | `mcp-server/tests/test_context.py` | tests (follow existing test convention; if none, add minimal pytest) |

## 7. Vertical slices (incremental, each independently verifiable)

### Slice 1 — MCP tool + Python backend (core, dogfoodable)
Build `context.py` (`get_slice_context` + `LanguageBackend` + `PythonAstBackend`) and register it in `server.py`.

**AC1.1** `get_slice_context(project_root=<repo>, module="mcp-server/src/contractfirst/links.py")` returns `links.py` in `module_files` as full text.
**AC1.2** Its dependency on `gatelog` appears in `dependencies` as **signature-only** (no function body present anywhere in the payload).
**AC1.3** `excluded` lists the other contractfirst modules (e.g. `verify.py`, `ambiguity.py`); `token_estimate` is a positive int.
**AC1.4** A manifest file is written under `.contractfirst/` and a line is appended to `gates.jsonl`.
**AC1.5** The MCP server still registers and runs all existing 7 tools unchanged.

### Slice 2 — Skill wiring + reference doc
**AC2.1** `skill/SKILL.md` Workflow gains `[8] entry: call get_slice_context(module); work only within the returned context.`
**AC2.2** Implementation Rules gain: **"Context Boundary — operate only within the loaded slice context. To use anything outside it, STOP and declare it (symbol + why)."**
**AC2.3** Anti-patterns gain: **"❌ Reading/importing outside the loaded slice context without declaring it."**
**AC2.4** Session-discipline line added: **"one slice = one session; close after Verify Gate; don't accumulate cross-slice context."**
**AC2.5** `skill/references/context-scoping.md` exists and is linked from the References list in `SKILL.md`. It documents the §3.5 "three homes" model (auto-test / manual-check list / co-located comment) and when a shared project-wide doc is still warranted.
**AC2.6** When `get_slice_context` is called for a module that maps to a feature with a `track_manual_checks` ledger, the response surfaces that feature's pending manual-check items (so a modifier sees the non-testable UI/UX constraints). If no mapping exists, this is a no-op (see Risks: module↔feature mapping).

### Slice 3 — pluggable second backend (language-agnostic) — OPTIONAL / LATER
Formalize a backend registry; add one non-Python backend (tree-sitter for signature extraction, or an LSP/Roslyn sidecar for C#) behind the same `LanguageBackend` interface.

**AC3.1** A non-Python module returns signatures via the new backend with no change to `context.py`'s 3-bucket assembly logic.

## 8. Verification (dogfood against this repo)

The repo is Python, so Slice 1 is self-testable:

```
get_slice_context(project_root=".", module="mcp-server/src/contractfirst/links.py")
→ expect: links.py full; gatelog symbols as signatures; verify.py/ambiguity.py in excluded.
```

Run the project verify (`./verify.sh` or pytest) after each slice. One failing check = slice not done.

## 9. Non-goals / out of scope

- No sandbox, file removal, or compiler/visibility enforcement.
- No automatic module-manifest generation beyond the folder/file convention (a manifest is optional input).
- No multi-language support in Slice 1 (Python only). Language-agnostic = Slice 3.
- Do not modify or change the behavior of the existing 7 tools or `gates.jsonl` format.
- Do not auto-edit `## Links` blocks or contract files (H1).

## 10. Risks / open decisions

- **Dep resolution precision (Python).** AST + imports won't resolve every dynamic reference. Acceptable for MVP; record unresolved ones in `warnings`. Escalate to LSP/semantic resolution only if misses hurt.
- **`module` granularity.** Allow both folder and single-file. Document the convention in `context-scoping.md`.
- **`depth` default.** Ship `depth=1`. Revisit only if "miss" feedback (agent needed something a hop further) is common.
- **`excluded` size.** For big repos this list can be large — cap/summarize (e.g. top-level packages only) to avoid bloating the payload.
- **Token estimate method.** A cheap heuristic (chars/4) is fine for MVP; note it's approximate.
- **module ↔ feature mapping (for AC2.6).** `get_slice_context` keys on `module` (folder/file); `track_manual_checks` keys on `feature` (name). Decide the mapping: accept an optional `feature` arg, infer from folder name, or read a one-line marker in the module. MVP can no-op when no mapping is found.
