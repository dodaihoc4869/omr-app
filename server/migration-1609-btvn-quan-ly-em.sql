ALTER TABLE btvn_em ADD COLUMN thu_hoi INTEGER NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS btvn_em_lich_su (
 id TEXT PRIMARY KEY, khoa TEXT NOT NULL, luu_luc TEXT NOT NULL, hanh_dong TEXT NOT NULL, du_lieu TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_btvn_em_lich_su ON btvn_em_lich_su(khoa);
