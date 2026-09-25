-- CNH-1.0 P07 — CORE ENTITLEMENT SETTLEMENT SUBSTRATE (additive, internal, NOT activated).
--
-- ⚠️ SCOPE: this migration only creates the NEW tables the P07 settlement substrate needs.
-- It does NOT touch, migrate, or read any legacy table (game_v2_profile.json, exp_so, su-kien-hoc,
-- luot, ca, ...). It does NOT enable cutover. Account initialization / legacy migration is a
-- SEPARATE job and MUST run before this substrate is activated in production.
--
-- ⚠️ AUTHORITY: `cnh_exp_account` is intended to become the SINGLE wallet authority for CNH-1.0.
-- Until the cutover adapter exists, the legacy cron/SUM(ledger) path MUST NOT run alongside this
-- table (04 §5: "không vừa cộng ledger trực tiếp vừa chạy cron SUM(sổ) cộng lại").
--
-- All money columns are non-negative safe integers, enforced by CHECK so a corrupt write fails
-- closed at the SQL layer (not merely in application code).
--
-- ⚠️ SQLite INTEGER AFFINITY does NOT reject a fractional value like 1.5 (it stores it as REAL).
-- A range CHECK alone (`>= 0 AND <= 9007199254740991`) therefore does NOT prove integrality.
-- Every money/counter/revision column below ALSO carries `typeof(col) = 'integer'` so a REAL
-- (fractional) or TEXT write fails closed at the SQL layer. `achieved` is constrained to the
-- exact integers 0/1 via `typeof(...) = 'integer' AND ... IN (0, 1)`.

-- One row per student: the authoritative wallet + absorbed/earned counters + CAS revision.
CREATE TABLE IF NOT EXISTS cnh_exp_account (
  student_id   TEXT    NOT NULL PRIMARY KEY,
  wallet_exp   INTEGER NOT NULL DEFAULT 0 CHECK (typeof(wallet_exp) = 'integer' AND wallet_exp >= 0 AND wallet_exp <= 9007199254740991),
  earned_exp   INTEGER NOT NULL DEFAULT 0 CHECK (typeof(earned_exp) = 'integer' AND earned_exp >= 0 AND earned_exp <= 9007199254740991),
  revision     INTEGER NOT NULL DEFAULT 0 CHECK (typeof(revision)   = 'integer' AND revision   >= 0 AND revision   <= 9007199254740991),
  cap_nhat_luc TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- One row per (student, learning_day, policy_version): the persisted day state the settlement
-- recomputes entitlement from. `raw_core` and `achieved` are materialized by a FUTURE validated
-- submission adapter; this substrate only reads them.
CREATE TABLE IF NOT EXISTS cnh_exp_day (
  student_id        TEXT    NOT NULL,
  learning_day      TEXT    NOT NULL,
  policy_version    TEXT    NOT NULL,
  raw_core          INTEGER NOT NULL DEFAULT 0 CHECK (typeof(raw_core)          = 'integer' AND raw_core          >= 0 AND raw_core          <= 9007199254740991),
  achieved          INTEGER NOT NULL DEFAULT 0 CHECK (typeof(achieved)          = 'integer' AND achieved          IN (0, 1)),
  core_paid         INTEGER NOT NULL DEFAULT 0 CHECK (typeof(core_paid)         = 'integer' AND core_paid         >= 0 AND core_paid         <= 9007199254740991),
  compensation_paid INTEGER NOT NULL DEFAULT 0 CHECK (typeof(compensation_paid) = 'integer' AND compensation_paid >= 0 AND compensation_paid <= 9007199254740991),
  revision          INTEGER NOT NULL DEFAULT 0 CHECK (typeof(revision)          = 'integer' AND revision          >= 0 AND revision          <= 9007199254740991),
  cap_nhat_luc      TEXT    NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (student_id, learning_day, policy_version)
);

-- Idempotency + CAS claim. UNIQUE(student, command_type, request_id) makes a repeated request
-- collide; UNIQUE(execution_id) makes each CAS attempt's claim globally unique. A losing claim
-- inserts 0 rows, so every guarded mutation downstream becomes a no-op.
CREATE TABLE IF NOT EXISTS cnh_exp_command (
  student_id         TEXT    NOT NULL,
  command_type       TEXT    NOT NULL,
  request_id         TEXT    NOT NULL,
  request_hash       TEXT    NOT NULL,
  execution_id       TEXT    NOT NULL,
  response_json      TEXT    NOT NULL,
  committed_revision INTEGER NOT NULL CHECK (typeof(committed_revision) = 'integer' AND committed_revision >= 0 AND committed_revision <= 9007199254740991),
  tao_luc            TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (student_id, command_type, request_id),
  UNIQUE (execution_id)
);

-- Core grant ledger: one row per settled grant. The semantic key
-- (student, learning_day, policy_version, semantic_revision) makes a given day's grant unique,
-- so two concurrent settlements cannot both pay the same entitlement.
CREATE TABLE IF NOT EXISTS cnh_exp_grant_ledger (
  grant_id          TEXT    NOT NULL PRIMARY KEY,
  student_id        TEXT    NOT NULL,
  learning_day      TEXT    NOT NULL,
  policy_version    TEXT    NOT NULL,
  semantic_revision INTEGER NOT NULL CHECK (typeof(semantic_revision) = 'integer' AND semantic_revision >= 0 AND semantic_revision <= 9007199254740991),
  amount            INTEGER NOT NULL CHECK (typeof(amount)            = 'integer' AND amount            >= 0 AND amount            <= 9007199254740991),
  execution_id      TEXT    NOT NULL,
  tao_luc           TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (student_id, learning_day, policy_version, semantic_revision)
);

-- In-transaction invariant guard (04 §5.6). The settlement batch inserts ONE row here whenever the
-- claim committed: `ok = 1` when every essential write landed with the expected resulting values,
-- and `ok = 0` when any invariant FAILED. The `CHECK (ok = 1)` therefore turns a failed invariant
-- into a hard SQL error that aborts the whole batch — a failed invariant can NEVER be a silent
-- 0-row no-op. The invariants are evaluated in a `CASE WHEN ... THEN 1 ELSE 0` in the SELECT list;
-- ONLY the claim-existence test sits in the outer WHERE, so a losing claim inserts 0 rows here
-- (no-op) and the batch commits nothing. We do NOT rely on post-commit `meta.changes`.
CREATE TABLE IF NOT EXISTS cnh_exp_guard (
  execution_id TEXT    NOT NULL PRIMARY KEY,
  ok           INTEGER NOT NULL CHECK (ok = 1),
  tao_luc      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_cnh_exp_day_student ON cnh_exp_day (student_id, learning_day);
CREATE INDEX IF NOT EXISTS idx_cnh_exp_grant_student ON cnh_exp_grant_ledger (student_id, learning_day);
