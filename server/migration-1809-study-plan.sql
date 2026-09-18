-- Bổ sung độc lập, không thay bảng điểm hay câu đã giao.
CREATE TABLE IF NOT EXISTS study_preferences (
 sbd TEXT PRIMARY KEY, minutes INTEGER NOT NULL DEFAULT 10, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS study_drafts (
 sbd TEXT NOT NULL, homework TEXT NOT NULL, answers TEXT NOT NULL DEFAULT '{}',
 answered INTEGER NOT NULL DEFAULT 0, revision INTEGER NOT NULL DEFAULT 0,
 day TEXT NOT NULL, baseline INTEGER NOT NULL DEFAULT 0, stuck INTEGER NOT NULL DEFAULT 0,
 updated_at TEXT NOT NULL, PRIMARY KEY(sbd,homework)
);
CREATE INDEX IF NOT EXISTS study_drafts_homework ON study_drafts(homework);
