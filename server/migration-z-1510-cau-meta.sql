-- B2 (thầy 15/10 "làm cả đợt 1 và 2" — docs/de-xuat-toi-uu-1510.md): bảng siêu dữ liệu câu TÍNH SẴN. Bản sao `SQL_CAU_META` (server/src/cau-meta.ts).
-- CHỈ THÊM: hai bảng đệm dẫn xuất mới (xoá đi thì cron mỗi phút tự dựng lại từ game_v2_question). Câu đọc chỉ dùng bảng khi khớp mốc lập chỉ mục.
CREATE TABLE IF NOT EXISTS cau_meta(ma_de TEXT NOT NULL,qid TEXT NOT NULL,thu_tu INTEGER NOT NULL,version,content_group,dang,phan,muc_do,ten_dang,sao,lop_json,chuyen_de,kien_thuc,kien_thuc_y,tu_luan,reviewed,nhan_ht,gon,anh_pa,anh_y,hinh_gon,j_qid,j_version,PRIMARY KEY(ma_de,qid));
CREATE INDEX IF NOT EXISTS cau_meta_qid ON cau_meta(qid,thu_tu);
CREATE TABLE IF NOT EXISTS cau_meta_to(ma_de TEXT PRIMARY KEY,indexed_at TEXT NOT NULL);
