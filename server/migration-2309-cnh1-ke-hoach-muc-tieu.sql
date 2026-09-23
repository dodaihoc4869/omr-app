-- CNH-1.0 (P05) — MỤC TIÊU CORE ĐÓNG BĂNG CỦA PLAN NGÀY.
--
-- VÌ SAO: 02 §5.2/§6 yêu cầu "chốt mục tiêu và task đầu buổi" và "không tăng target sau khi em gần xong".
-- Bản ghi mục tiêu (role, required_task_ids, n, min_success, policy_version, revision, lý do revision,
-- task bị loại) phải ĐÓNG BĂNG theo ngày: mở lại app KHÔNG được tính lại rồi nâng điều kiện đạt.
-- Cột MỚI, có DEFAULT nên mọi bản ghi cũ vẫn đọc được bình thường.
ALTER TABLE ke_hoach_ngay ADD COLUMN muc_tieu_json TEXT NOT NULL DEFAULT '';

-- Số câu/giây bị HOÃN vì ngân sách (02 §5.2: "plan ghi deferred_count và over_budget_seconds để thầy thấy").
-- Hai số này thuộc BẢN GHI PLAN nên để cạnh `ket_qua` (không nhét vào `viec_json` để thầy truy vấn thẳng).
ALTER TABLE ke_hoach_ngay ADD COLUMN deferred_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE ke_hoach_ngay ADD COLUMN over_budget_seconds INTEGER NOT NULL DEFAULT 0;
