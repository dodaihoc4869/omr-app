CREATE TABLE IF NOT EXISTS luyen_de_2026 (
 id TEXT PRIMARY KEY, sbd TEXT NOT NULL, created_at INTEGER NOT NULL,
 deadline INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'active',
 bank_key TEXT NOT NULL, answers TEXT NOT NULL DEFAULT '{}', result TEXT,
 updated_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS luyen_de_2026_active ON luyen_de_2026(sbd) WHERE status='active';
CREATE INDEX IF NOT EXISTS luyen_de_2026_history ON luyen_de_2026(sbd,created_at DESC);
