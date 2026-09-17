CREATE TABLE IF NOT EXISTS mom_bai (
 sbd TEXT NOT NULL, id TEXT NOT NULL, title TEXT NOT NULL, created_at TEXT NOT NULL,
 question_count INTEGER NOT NULL, bank_key TEXT NOT NULL,
 started_at TEXT, submitted_at TEXT, answers TEXT NOT NULL DEFAULT '{}',
 result TEXT, PRIMARY KEY(sbd,id)
);
CREATE INDEX IF NOT EXISTS mom_bai_student_date ON mom_bai(sbd,created_at DESC);
