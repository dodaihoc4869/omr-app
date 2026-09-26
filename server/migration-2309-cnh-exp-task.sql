-- CNH-1.0 P07 — immutable SERVER-ISSUED task/attempt reward snapshot registry.
--
-- ADDITIVE ONLY. Does not touch the legacy `cau_snapshot` (sbd,qid) store, does not
-- create any mutable money flag, and does not write grants/ledger rows. Adapters MUST
-- route BOTH issuance and submission through this registry before activating rewards.
--
-- Immutability is enforced by the write path (INSERT ... ON CONFLICT DO NOTHING + read
-- back + hash compare), not by triggers: D1 batch semantics are the transaction boundary.
CREATE TABLE IF NOT EXISTS cnh_exp_task (
  student_id TEXT NOT NULL,
  attempt_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  qid TEXT NOT NULL,
  content_group TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  plan_revision INTEGER NOT NULL,
  policy_version TEXT NOT NULL,
  purpose TEXT NOT NULL,
  bucket TEXT NOT NULL,
  issued_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  expected_seconds INTEGER NOT NULL,
  -- Canonical JSON of the FULL server-only snapshot (grading key/policy + order mapping included).
  snapshot_json TEXT NOT NULL,
  -- SHA-256 (lowercase hex) of the canonical JSON above. Caller never supplies this.
  snapshot_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (student_id, attempt_id)
);

-- task_id is unique PER STUDENT: reusing a task_id for another attempt must conflict
-- (a plain INSERT OR IGNORE would swallow this and hide the bug).
CREATE UNIQUE INDEX IF NOT EXISTS idx_cnh_exp_task_student_task
  ON cnh_exp_task (student_id, task_id);

-- Plan lookup (student + plan) and content-group lookup (student + content_group).
CREATE INDEX IF NOT EXISTS idx_cnh_exp_task_student_plan
  ON cnh_exp_task (student_id, plan_id, plan_revision);
CREATE INDEX IF NOT EXISTS idx_cnh_exp_task_student_content_group
  ON cnh_exp_task (student_id, content_group);
