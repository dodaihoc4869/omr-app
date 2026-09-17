CREATE TABLE IF NOT EXISTS student_notice(id TEXT PRIMARY KEY,sbd TEXT NOT NULL,title TEXT NOT NULL,body TEXT NOT NULL,target TEXT NOT NULL,created_at TEXT NOT NULL,read_at TEXT);
CREATE INDEX IF NOT EXISTS idx_notice_student ON student_notice(sbd,created_at);
CREATE TABLE IF NOT EXISTS student_push(endpoint TEXT PRIMARY KEY,sbd TEXT NOT NULL,subscription TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS student_push_delivery(notice_id TEXT NOT NULL,endpoint TEXT NOT NULL,sent_at TEXT,attempts INTEGER NOT NULL DEFAULT 0,lease_until INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(notice_id,endpoint));
