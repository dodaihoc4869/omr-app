CREATE TABLE IF NOT EXISTS app_presence(day TEXT NOT NULL,session_id TEXT NOT NULL,role TEXT NOT NULL,first_seen TEXT NOT NULL,last_seen TEXT NOT NULL,PRIMARY KEY(day,session_id,role));
CREATE INDEX IF NOT EXISTS idx_presence_seen ON app_presence(last_seen);
