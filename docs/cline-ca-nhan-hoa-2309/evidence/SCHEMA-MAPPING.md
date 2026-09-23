# SCHEMA-MAPPING — tên logic CNH-1.0 → bảng/cột thật (P00/P01)

Đối chiếu `04-DU-LIEU-API-DONG-THOI.md` mục 3 với D1 thật. Danh sách bảng lấy từ
`grep 'CREATE TABLE' server/*.sql` tại HEAD `539cd99`. Cột "Kết luận" nói rõ bảng đã có hay phải thêm.

| Tên logic (04) | Bảng/cột thật trong repo | Khóa/chỉ mục hiện có | Kết luận |
|---|---|---|---|
| `learning_event` | `su_kien_hoc` (`server/migration-1909-su-kien-hoc.sql`; `server/src/su-kien-hoc.ts`) | sổ sự kiện bất biến theo `khoa` | **Đã có** — cần bổ sung `assistance`, `visibility`, `correctionOf`, `policyVersion` (P03) |
| `daily_plan` | `ke_hoach_ngay` (`server/migration-1909-ke-hoach.sql`; `server/src/ke-hoach-ngay-d1.ts`) | theo sbd + ngày | **Đã có** — cần cột revision + uniqueness `(sbd, ngay, policy)` (P05) |
| `task_snapshot` | `game_v2_task` + `ke_hoach_ngay` (JSON nhiệm vụ) | theo sbd + ngày | **Đã có một phần** — cần snapshot đáp án/thứ tự lựa chọn bất biến (P01) |
| `memory_snapshot` (FSRS) | Chưa xác định được bảng lưu Card: `server/src/lich-on-fsrs.ts` là module thuần, không tự truy vấn | — | **CHƯA XÁC VERIFY** — P04 phải truy nơi ghi state FSRS (`game_v2_question`, `cau_hoi_em`, `nop_khac_phuc` hoặc JSON `game_v2_profile`) |
| `skill_snapshot` | `nam_kt_cau`, `nam_kt_dang` (`server/src/ho-so-nam-kt.ts`) | theo sbd + câu/dạng | **Đã có** — cần `working_level`/`validated_level`/`confidence` + cursor/revision (P03) |
| `learner_scope` | **Không có bảng riêng**. Phạm vi hiện suy từ `nam_kt_*`, `qid_da_lam`, `cau_hinh` | — | **Phải thêm** bảng `learner_scope` (P02) |
| `economy` ledger | `exp_so`, `manh_khien_so`, `khien_mat_so`, `vang_so`, `game_v2_reward`, `cau_hinh` (`server/migration-1909-exp.sql`, `migration-2109-khien.sql`, `migration-2109-shop-phu-kien.sql`) | theo sbd | **Đã có** nhưng còn nhiều nguồn số dư — phải gộp về một authority (P07/P08) |
| `EconomyReceipt` / idempotency | `ma_da_dung` (`server/migration-1909-ma-da-dung.sql`) | mã dùng một lần | **Đã có một phần** — cần `receiptId/requestId/hash` + UNIQUE (P07) |
| revision hồ sơ | `game_v2_profile` (JSON + revision), `hoc_sinh` | theo sbd | **Đã có** |
| hồ sơ đã ghim/khóa câu | `game_v2_question`, `cau_hoi_em`, `qid_da_lam` | — | **Đã có** |
| ca thi / giữ chỗ | `ca`, `phong_cho`, `trang_thai`, `tien_do_ca`, `kho_ca_them` | — | **Đã có** |
| kinh tế game | `than_thu`, `phu_kien_so_huu`, `phu_kien_dang_mac`, `doan_*` | — | **Đã có** |

## Việc migration cần làm (chưa thực hiện trong P00/P01)

1. Thêm bảng `learner_scope` (P02).
2. Bổ sung cột cho `su_kien_hoc`: `attempt_id`, `assistance`, `visibility`, `correction_of`, `policy_version` (P03).
3. Bổ sung `revision`/`cursor` cho `ke_hoach_ngay` và `nam_kt_*` (P03/P05).
4. Bổ sung bảng receipt/command cho giao dịch nguyên tử (P07).
5. Xác định chỗ lưu state FSRS rồi thêm `content_group` + `memory_version` (P04).

Không DROP dữ liệu cũ ở đợt đầu (07 mục 2.1). Mọi migration phải có dry-run + rerun theo CAS (P08/P10).
