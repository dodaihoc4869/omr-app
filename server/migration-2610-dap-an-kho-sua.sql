-- TỰ SỬA ĐÁP ÁN KHO (thầy 26/10: «Nếu lệch đáp án tự động lấy đáp án bạn giải ko cần hỏi tôi điều gì»). Mã: server/src/sua-dap-an-kho.ts.
-- CHỈ THÊM: một bảng mới + một chỉ mục; không đụng bảng nào đang có. Mỗi lần sửa `dap_an`/`correct` của MỘT câu trong gói R2 `kho/{ma_de}.json`
-- ghi một dòng TRƯỚC khi ghi R2: `cu` = đáp án cũ, `moi` = đáp án mới ⇒ lùi được (`luiDapAnKho`, route `POST /quan-tri/lui-dap-an-kho {id}`).
-- `nguon` = ai sửa ('soan-so-do' = máy soạn lời giải sơ đồ sau 2 lần giải mù cùng số); `da_lui` = 1 khi đã lùi (hoặc ghi R2 không thành).
-- Cùng câu CREATE ở SQL_BANG_SUA trong mã (tự tạo lúc ghi lần đầu).
CREATE TABLE IF NOT EXISTS dap_an_kho_sua (id TEXT PRIMARY KEY, ma_de TEXT NOT NULL, qid TEXT NOT NULL, phan TEXT NOT NULL, cu TEXT NOT NULL, moi TEXT NOT NULL,
    ly_do TEXT, nguon TEXT NOT NULL, luc TEXT NOT NULL, da_lui INTEGER NOT NULL DEFAULT 0);
CREATE INDEX IF NOT EXISTS dap_an_kho_sua_qid ON dap_an_kho_sua(qid);
