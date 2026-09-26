-- CNH-1.0 P07 — ATOMIC RELEASED-CORE SUBMISSION SUBSTRATE (additive, internal, NOT activated).
--
-- ⚠️ SCOPE: this migration only creates the NEW tables the P07 submission vertical needs.
-- It does NOT touch, migrate, or read any legacy table (game_v2_profile.json, exp_so,
-- su-kien-hoc, luot, ca, ...). It does NOT enable cutover. It does NOT implement embargo,
-- release, correction, rollover, rubric, optional pricing, or HTTP routes — those are
-- SEPARATE jobs that MUST land before this substrate is activated.
--
-- ⚠️ AUTHORITY: `cnh_exp_account` (migration-2309-cnh-exp-ledger.sql) is intended to become the
-- SINGLE wallet authority for CNH-1.0. This migration adds the attempt-control / accepted-event /
-- academic-lock tables that the submission command writes in the SAME batch as the wallet/day
-- mutation. Until the cutover adapter exists, the legacy cron/SUM(ledger) path MUST NOT run
-- alongside these tables (04 §5).
--
-- ⚠️ SQLite INTEGER AFFINITY does NOT reject a fractional value like 1.5 (it stores it as REAL).
-- A range CHECK alone therefore does NOT prove integrality. Every money/counter/revision column
-- below ALSO carries `typeof(col) = 'integer'` so a REAL (fractional) or TEXT write fails closed
-- at the SQL layer. Boolean-ish columns are constrained to the exact integers 0/1.

-- One row per (student, attempt): the server-mutable control record for an issued attempt.
-- `assistance` is the SERVER-asserted independence state (never the client's). `released` is the
-- publication-eligibility flag (NOT a suspicion signal). `active` is false once the attempt is
-- revoked/expired. `revision` is the CAS guard: a control change (e.g. assistance downgrade)
-- bumps it, so a submission that read the old revision loses the CAS and re-reads.
--
-- Provisioning is an INTERNAL helper called ONLY by the issued-task adapter; there is NO HTTP
-- shortcut. A missing control row fails closed (the submission command never invents one).
CREATE TABLE IF NOT EXISTS cnh_exp_attempt_control (
  student_id   TEXT    NOT NULL,
  attempt_id   TEXT    NOT NULL,
  assistance   TEXT    NOT NULL CHECK (assistance IN ('none', 'assisted', 'unknown')),
  released     INTEGER NOT NULL DEFAULT 0 CHECK (typeof(released) = 'integer' AND released IN (0, 1)),
  active       INTEGER NOT NULL DEFAULT 1 CHECK (typeof(active)   = 'integer' AND active   IN (0, 1)),
  revision     INTEGER NOT NULL DEFAULT 0 CHECK (typeof(revision) = 'integer' AND revision >= 0 AND revision <= 9007199254740991),
  cap_nhat_luc TEXT    NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (student_id, attempt_id)
);

-- One row per (student, attempt): the immutable ACCEPTED submission event. Written in the SAME
-- batch as the wallet/day mutation. `answer_hash` is the canonical hash of the raw answer; a
-- second submission for the same attempt with a DIFFERENT answer hash is ATTEMPT_ALREADY_SUBMITTED
-- (no automatic correction). `snapshot_hash` pins the exact grading material used.
--
-- This row is ALSO the minimal COMPLETE immutable LearningEvent evidence for a released CORE
-- submission (04 §2 `LearningEvent`). It stores the canonical raw answer payload, the canonical
-- per-subitem results produced by the ACTUAL grade, the SERVER-asserted assistance, the policy
-- version, an explicit `visibility` and the `correction_of` slot. Fields NOT known at submission
-- time are explicit NULLs — telemetry (`active_seconds`) is NEVER fabricated. The row is
-- INSERT-only: a retry/replay NEVER rewrites it (the claim is guarded by `NOT EXISTS (accepted)`),
-- so accepted evidence is immutable by construction.
CREATE TABLE IF NOT EXISTS cnh_exp_accepted (
  student_id     TEXT    NOT NULL,
  attempt_id     TEXT    NOT NULL,
  answer_hash    TEXT    NOT NULL,
  received_at    INTEGER NOT NULL CHECK (typeof(received_at) = 'integer' AND received_at >= 0 AND received_at <= 9007199254740991),
  learning_day   TEXT    NOT NULL,
  correct        INTEGER NOT NULL CHECK (typeof(correct) = 'integer' AND correct IN (0, 1)),
  raw            INTEGER NOT NULL CHECK (typeof(raw)     = 'integer' AND raw     >= 0 AND raw     <= 9007199254740991),
  snapshot_hash  TEXT    NOT NULL,
  -- The ORIGINAL command execution that produced this accepted event. A same-attempt replay
  -- loads the ORIGINAL receipt via this reference and returns it verbatim — it NEVER recomputes
  -- entitlement/wallet from current rows (which could invent a positive grant after a later
  -- `achieved` change). Written in the SAME batch as the accepted row.
  execution_id   TEXT    NOT NULL,
  -- ── LearningEvent evidence (04 §2) ──────────────────────────────────────────────────────────
  -- Canonical JSON of the raw answer payload, captured BEFORE any await and used for hashing,
  -- grading AND persistence (one frozen value ⇒ no input-mutation race). Server-only.
  answer_json    TEXT    NOT NULL,
  -- Canonical JSON array of `{id, correct, skillIds}` from the ACTUAL grade, in issued order.
  -- `[]` when the part has no subitems (Parts I/III) — never a fabricated placeholder.
  subitems_json  TEXT    NOT NULL,
  -- SERVER-asserted assistance from the authoritative control row (never the client's claim).
  assistance     TEXT    NOT NULL CHECK (assistance IN ('none', 'assisted', 'unknown')),
  policy_version TEXT    NOT NULL,
  -- Publication state of this event. A released CORE submission is 'released' at write time.
  visibility     TEXT    NOT NULL CHECK (visibility IN ('embargoed', 'released')),
  -- Correction linkage. NULL for an original submission; a correction job sets it later.
  correction_of  TEXT    NULL,
  -- Active learning seconds. NULL at submission time: telemetry is NOT fabricated here.
  active_seconds INTEGER NULL CHECK (active_seconds IS NULL OR (typeof(active_seconds) = 'integer' AND active_seconds >= 0 AND active_seconds <= 9007199254740991)),
  -- Trusted server context that produced the event (e.g. 'submit_core'). NEVER from the answer.
  source         TEXT    NOT NULL,
  tao_luc        TEXT    NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (student_id, attempt_id)
);

-- Academic reward lock: at most ONE paid raw per (student, content_group, learning_day), shared
-- across core and (future) optional pricing. The submission command inserts this row ONLY when it
-- actually credits a non-zero raw; a duplicate content_group on the same day is accepted with
-- raw = 0 (no conflict loop). `attempt_id` records which attempt won the lock.
CREATE TABLE IF NOT EXISTS cnh_exp_academic_lock (
  student_id    TEXT    NOT NULL,
  content_group TEXT    NOT NULL,
  learning_day  TEXT    NOT NULL,
  attempt_id    TEXT    NOT NULL,
  raw           INTEGER NOT NULL CHECK (typeof(raw) = 'integer' AND raw >= 0 AND raw <= 9007199254740991),
  tao_luc       TEXT    NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (student_id, content_group, learning_day)
);

-- In-transaction invariant guard (04 §5.6), same pattern as cnh_exp_guard in the ledger
-- migration. The submission batch inserts ONE row here whenever the claim committed: `ok = 1`
-- when every essential write landed with the expected resulting values, `ok = 0` when any
-- invariant FAILED. `CHECK (ok = 1)` turns a failed invariant into a hard SQL error that aborts
-- the whole batch — a failed invariant can NEVER be a silent 0-row no-op. The invariants are
-- evaluated in a `CASE WHEN ... THEN 1 ELSE 0` in the SELECT list; ONLY the claim-existence test
-- sits in the outer WHERE, so a losing claim inserts 0 rows here (no-op).
CREATE TABLE IF NOT EXISTS cnh_exp_submit_guard (
  execution_id TEXT    NOT NULL PRIMARY KEY,
  ok           INTEGER NOT NULL CHECK (ok = 1),
  tao_luc      TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Durable CONTENT-GROUP LEARNING EXPOSURE lock (04 §4.3). Once a hint/reveal is served for a
-- (student, content_group) exposure, EVERY issued attempt in that exposure is `assisted` — a
-- later attempt in the same exposure can NEVER become independent, even if it was issued (or
-- provisioned) before the assistance command ran. This is the durable fact the submission
-- command's control row inherits from (see capDieuKhienNopBai) and that the submission command
-- CAS-guards on (see nopBaiCore).
--
-- ⚠️ EXPOSURE IDENTITY (documented, NOT invented): spec 04 §4.3 requires assistance to bind to
-- "attempt và content_group learning exposure" so that "mở màn khác không biến thành independent",
-- but does NOT define the exposure's identity. §3 `active_reservation` keys reservations by
-- `UNIQUE student+content_group` (NO day component), while §3 `day_account`/`academic_lock` are
-- per-day. We therefore key the exposure lock by `(student_id, content_group)` with NO day
-- component, matching §3 `active_reservation`.
--
-- ⚠️ EXPOSURE LIFECYCLE — UNRESOLVED, NOT APPROVED (acceptance backlog, MUST be specified before
-- route activation): the spec does NOT state whether a learning exposure resets across VN
-- learning days, nor whether it is further scoped by `plan_id`/`plan_revision`. This table
-- deliberately does NOT reset by day and does NOT invent a reset rule. The claim that a
-- permanent (student, content_group) ban is "spec-mandated" is UNSUPPORTED and is NOT made here.
-- The current lock scope is the existing cross-channel protection fix; the exposure lifecycle
-- remains an open acceptance item. This module stays INTERNAL and UNACTIVATED until that is
-- resolved.
CREATE TABLE IF NOT EXISTS cnh_exp_exposure_lock (
  student_id    TEXT    NOT NULL,
  content_group TEXT    NOT NULL,
  -- The attempt whose assistance command first locked this exposure (provenance only).
  attempt_id    TEXT    NOT NULL,
  -- The assistance state this exposure is locked to. Today only 'assisted' is written.
  assistance    TEXT    NOT NULL CHECK (assistance IN ('assisted')),
  -- The command execution that created the lock (provenance / audit).
  execution_id  TEXT    NOT NULL,
  -- CAS guard: bumped whenever the lock is (re)written. The submission command reads this
  -- revision and guards its claim on it, so a lock created between the submission's read and its
  -- batch loses the CAS and the submission re-reads the effective assisted state.
  revision      INTEGER NOT NULL DEFAULT 0 CHECK (typeof(revision) = 'integer' AND revision >= 0 AND revision <= 9007199254740991),
  tao_luc       TEXT    NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (student_id, content_group)
);

-- Durable SEMANTIC assistance receipt: ONE row per (student, attempt, kind). This is the
-- monotonic-transition record for the assistance command. The FIRST command that transitions an
-- attempt to `assisted` for a given kind writes this row with the ORIGINAL response; a later
-- command for the SAME (attempt, kind) under a NEW request key replays that ORIGINAL response
-- verbatim and does NOT bump the control revision again. This is what makes the transition
-- monotonic (`none`/`unknown` → `assisted` exactly once) while still giving every distinct
-- request key a durable, hash-bound receipt.
--
-- `kind` is part of the key so a `hint` and a `reveal` for the same attempt are distinct semantic
-- actions (each gets its own original response), while a repeated `hint` is a replay.
CREATE TABLE IF NOT EXISTS cnh_exp_assistance_receipt (
  student_id    TEXT    NOT NULL,
  attempt_id    TEXT    NOT NULL,
  kind          TEXT    NOT NULL CHECK (kind IN ('hint', 'reveal')),
  -- The command execution that first performed this semantic action (provenance / audit).
  execution_id  TEXT    NOT NULL,
  -- The ORIGINAL response JSON, replayed verbatim for a same-action replay under a new key.
  response_json TEXT    NOT NULL,
  tao_luc       TEXT    NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (student_id, attempt_id, kind)
);

-- In-transaction invariant guard for the assistance command (04 §5.6), same pattern as
-- cnh_exp_submit_guard. `CHECK (ok = 1)` turns a failed invariant into a hard SQL error that
-- aborts the whole batch — a failed invariant can NEVER be a silent 0-row no-op.
CREATE TABLE IF NOT EXISTS cnh_exp_assistance_guard (
  execution_id TEXT    NOT NULL PRIMARY KEY,
  ok           INTEGER NOT NULL CHECK (ok = 1),
  tao_luc      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_cnh_exp_control_student ON cnh_exp_attempt_control (student_id, attempt_id);
CREATE INDEX IF NOT EXISTS idx_cnh_exp_assistance_receipt_student ON cnh_exp_assistance_receipt (student_id, attempt_id);
CREATE INDEX IF NOT EXISTS idx_cnh_exp_accepted_student ON cnh_exp_accepted (student_id, learning_day);
CREATE INDEX IF NOT EXISTS idx_cnh_exp_lock_student ON cnh_exp_academic_lock (student_id, learning_day);
-- Event-reader index: the incremental projection consumes events in `(received_at, event_id)`
-- order (04 §6). `attempt_id` is the stable event identity for a submission event.
CREATE INDEX IF NOT EXISTS idx_cnh_exp_accepted_cursor ON cnh_exp_accepted (received_at, attempt_id);
