-- Additive and idempotent. Never alters academic tables.
CREATE TABLE IF NOT EXISTS game_v2_profile (sbd TEXT PRIMARY KEY, revision INTEGER NOT NULL DEFAULT 0, json TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS game_v2_question (ma_de TEXT NOT NULL, qid TEXT NOT NULL, version TEXT NOT NULL, content_group TEXT NOT NULL, dang TEXT, json TEXT NOT NULL, PRIMARY KEY(ma_de,qid));
CREATE INDEX IF NOT EXISTS game_v2_question_dang ON game_v2_question(dang);
CREATE INDEX IF NOT EXISTS game_v2_question_qid ON game_v2_question(qid);
CREATE INDEX IF NOT EXISTS game_v2_question_group ON game_v2_question(content_group);
CREATE TABLE IF NOT EXISTS game_v2_index (ma_de TEXT PRIMARY KEY, source_version TEXT NOT NULL, indexed_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS game_v2_session (id TEXT PRIMARY KEY, sbd TEXT NOT NULL, json TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS game_v2_session_student ON game_v2_session(sbd,created_at);
CREATE TABLE IF NOT EXISTS game_v2_attempt (id TEXT PRIMARY KEY, sbd TEXT NOT NULL, session TEXT NOT NULL, qid TEXT NOT NULL, content_group TEXT NOT NULL, json TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS game_v2_attempt_student ON game_v2_attempt(sbd,created_at);
CREATE TABLE IF NOT EXISTS game_v2_reward (id TEXT PRIMARY KEY, sbd TEXT NOT NULL, amount INTEGER NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS game_v2_room (id TEXT PRIMARY KEY, revision INTEGER NOT NULL DEFAULT 0, json TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS game_v2_scope (sbd TEXT PRIMARY KEY, json TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS game_v2_task (id TEXT PRIMARY KEY, sbd TEXT NOT NULL, dang TEXT NOT NULL, created_at TEXT NOT NULL, completed_at TEXT);
CREATE INDEX IF NOT EXISTS game_v2_task_student ON game_v2_task(sbd,completed_at);
