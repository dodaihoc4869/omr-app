-- LÙI `migration-2309-cnh-exp-p08.sql` (CHỈ-THÊM ⇒ lùi SẠCH, không đụng bảng nào khác).
--
-- ⚠️ NGUY HIỂM: xoá SỔ MẢNH + SỔ TIÊU + TRẠNG THÁI P08 (mảnh/khiên/cấp/vàng em đã kiếm) — không
-- khôi phục được ngoài Time Travel. CHỈ chạy khi Boss VÀ thầy cùng ra lệnh; trước đó GHI MỐC
-- Time Travel. Cờ P08 mặc định TẮT (`THAM-SO.autoAbsorbDefault = false`) ⇒ chưa ai có dữ liệu thì
-- lùi không mất gì.
--
-- Thứ tự: INDEX trước TABLE. KHÔNG `DROP`/`ALTER` bảng của P07 (`cnh_exp_account`, `cnh_exp_day`,
-- `cnh_exp_grant_ledger`, `cnh_exp_command`, `cnh_exp_guard`, …) — tệp này KHÔNG được phép chạm.
DROP INDEX IF EXISTS idx_cnh_exp_fragment_student;
DROP INDEX IF EXISTS idx_cnh_exp_spend_student;
DROP TABLE IF EXISTS cnh_exp_p08_guard;
DROP TABLE IF EXISTS cnh_exp_p08_giai_quyet;
DROP TABLE IF EXISTS cnh_exp_p08_chuyen_doi;
DROP TABLE IF EXISTS cnh_exp_spend_ledger;
DROP TABLE IF EXISTS cnh_exp_fragment_ledger;
DROP TABLE IF EXISTS cnh_exp_p08_state;
