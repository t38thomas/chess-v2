---
description: Workflow end-to-end per bugfix su Pactchess (Expo/React Native/Web + Node/WS): riproduzione, diagnosi, test, fix minimo, verifica, PR-ready con note e comandi.
---

# Bug Resolver (Pactchess)

## Goal
Fix a reported bug reliably with: reproducible case → root cause → failing test (or manual checklist) → minimal fix → verification → PR-ready summary.

## Required Inputs (if missing, infer or ask)
- Bug description (what/where)
- Expected vs actual behavior
- Environment: platform (web/ios/android/server), build/commit, device/OS
- Steps to reproduce (if unknown, derive)
- Logs/stack trace/screenshots (if available)
- Scope constraints (what must not change)

---

## Phase 1 — Triage (fast, 3–8 min)
1. Restate the bug in 1 sentence.
2. Classify:
   - Severity: blocker / major / minor
   - Area: client UI / game logic / server / WS / persistence / matchmaking
3. List top 3 hypotheses (ordered) and what evidence would confirm each.

**Output:** `Triage` section with severity, area, hypotheses.

---

## Phase 2 — Reproduce (must attempt)
1. Follow steps to reproduce.
2. If not reproducible:
   - vary one parameter at a time (env/data/account/network)
   - add minimal temporary logs around suspected flow
3. Capture evidence:
   - console/server logs, WS frames (if relevant), screenshots/video
4. Produce a minimal reproducible example (MRE):
   - shortest steps that still trigger the bug

**Output:** `Repro` section: ✅/❌ + MRE + evidence.

---

## Phase 3 — Diagnose (root cause, not symptoms)
1. Trace execution path:
   - entrypoint → state changes → side effects → output
2. Identify the first incorrect transition:
   - wrong state, wrong message, wrong timing, wrong assumptions
3. Pinpoint the root cause:
   - file/module + function + why it happens
4. Propose 2 fix options:
   - Option A (minimal), Option B (more robust)
   - pros/cons + risk

**Output:** `Root Cause` section with file/function pointers + fix options.

---

## Phase 4 — Safety net (tests first if possible)
### Preferred order
1. Unit test (fastest)
2. Integration test
3. E2E test
If none feasible, create a **Manual Verification Checklist** that is repeatable.

### Pactchess-specific guidance
- If bug involves WS:
  - test message schema + ordering + reconnection behavior
  - verify idempotency on repeated messages
- If bug involves game state:
  - test reducer/state machine transitions
  - test serialization/deserialization between client/server

**Output:** 
- Add/Update tests that FAIL before fix and PASS after fix
- or `Manual Checklist` with exact steps + expected outcomes.

---

## Phase 5 — Implement minimal fix
Rules:
- Fix must directly address root cause.
- Avoid large refactors unless required.
- Add guardrails:
  - input validation, schema checks, null/undefined handling
  - monotonic state updates, defensive checks for race conditions
- Keep logs useful and not noisy (remove temporary logs unless needed).

**Output:** `Changes` section: what changed and why (bullet list).

---

## Phase 6 — Verify & regression check
1. Run relevant test suite(s).
2. Re-run the MRE: must be fixed.
3. Verify adjacent flows:
   - matchmaking, join/leave room, reconnect, move submit/ack, UI states
4. If WS involved:
   - verify duplicate messages don’t corrupt state
   - verify reconnect resumes safely
   - verify server handles stale clients gracefully

**Output:** `Verification` section:
- commands executed + results
- checklist results
- confirmation that MRE passes

---

## Phase 7 — PR-ready wrap-up
Provide a PR description:
- What was broken
- Root cause
- Fix summary
- How to test (commands + manual steps)
- Risks/rollback

**Final Output Format (always)**
### Status
- Reproduced: ✅/❌
- Root cause found: ✅/❌
- Tests added: ✅/❌ (or Manual checklist ✅)
- Fixed: ✅/❌

### Root Cause (2–6 lines)
Explain why it happened.

### Fix Summary (bullets)
- ...

### How to Verify
- Commands:
  - ...
- Manual:
  - ...

### Risks / Notes
- ...