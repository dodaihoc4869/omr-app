# Bằng chứng gói P03 (CNH-1.0) — Sổ học và hồ sơ năng lực

Ngày chạy: 2026-09-23 (giờ máy: 18:06–18:11 +07:00).
`sourceFingerprint` (node docs/cline-ca-nhan-hoa-2309/kiem-tra-bo-ban-giao.mjs --fingerprint):
`b4a33d6293b80bf25951ed563b33a70aa4488faadaa0adf45f95ab64537ae382`

LƯU Ý: `.gitignore` chặn `*.log` (repo công khai) nên các log dưới đây KHÔNG lên git.
Tệp này là bản tóm tắt có số liệu + sha256 để đối chiếu.

## 1. Lệnh đã chạy và kết quả

| # | Lệnh | Exit | Kết quả | Artifact (sha256) |
|---|---|---|---|---|
| 1 | `npm exec -- vitest run tests/cnh-1-0` | 0 | **6 tệp · 106 test PASS** (69 test CNH cũ + **37 test mới của P03**) | `p03-vitest-cnh1.log` — `4b620b2e240c9de4de7028d8c4975249fa4e7dc3318f8425e809d167b9649ce7` |
| 2 | `npm exec -- vitest run` (toàn bộ) | 1 | 730 tệp: **81 đỏ / 695 xanh / 1 bỏ qua**; test: 81 đỏ / 11 218 đạt | `p03-vitest-full.log` — `577c0e37c933bc899faeeb5121a39561a6823fd991902b09e6b2d26b40eed90a` |
| 3 | `node docs/cline-ca-nhan-hoa-2309/evidence/so-sanh-danh-sach-do.mjs p00 p03` | 0 | **0 file mới đỏ · 0 test mới đỏ** so với nền P00 (82 đỏ/35 tệp) | `p03-so-sanh-do.log` — `37327a73c1bcfc84dc6d9fc7b7c578dab2f9c247bcc867a510021f204872b078` |
| 4 | `npm exec -- tsc -b` | 0 | 0 lỗi (phía app) | — |
| 5 | `npm exec -- tsc -p server/tsconfig.json --noEmit` | 0 | 0 lỗi (phía máy chủ) | — |
| 6 | `node docs/cline-ca-nhan-hoa-2309/kiem-tra-bo-ban-giao.mjs` | 0 | bộ bàn giao hợp lệ: 42 yêu cầu, 50 tình huống | — |
| 7 | `npm exec -- vitest run tests/cnh-1-0 tests/su-kien tests/ho-so tests/reset-toan-app-1909` | 0 | 16 tệp · **294 test PASS** | — |
| 8 | `npm exec -- vitest run tests/game tests/tran-ngay tests/exp tests/ke-hoach tests/dem-ke-hoach tests/cau-da-lam` | 1 | 18 tệp · 268 PASS / **1 đỏ CÓ SẴN trong nền P00** (`cau-da-lam-2109.test.ts > … đọc tổng hợp … lỗi ⇒ kế hoạch VẪN dựng`, dòng 10 của `p00-vitest-fail-tests.txt`) | — |

## 2. Hồi quy

`p00` 82 test đỏ / 35 tệp · `p03` 81 test đỏ / 34 tệp.
- **FILE MỚI ĐỎ (hồi quy): []**
- **TEST MỚI ĐỎ: []**
- Tệp hết đỏ: `tests/bang-tin-san-chong-chu-trinh-duyet-2109.test.ts` — đây là test UI (Chromium, đợt màn hình) đã được ghi là **DAO ĐỘNG** từ phiên P02 (lúc đỏ lúc xanh), KHÔNG phải do bản sửa P03.

## 3. Việc thực chứng minh trong P03 (ánh xạ tình huống)

- **T05** — `tests/cnh-1-0-nang-luc-t05-t06.test.ts` (10 ca): 4 câu Biết đúng cùng ngày KHÔNG xác nhận Vận dụng; xác nhận mức chỉ khi ≥5 family ở ĐÚNG mức, ≥2 ngày VN, ≥4/5 recent5; nền có đợt dạy lại đang mở thì chặn; `confidence` khớp vector V47/V48 (0,4 · 1); probe đúng ở bậc trên mới nâng `working_level`, probe sai không hạ; bằng chứng quá 30 ngày giữ mức đã xác nhận + cờ cần kiểm lại.
- **T06** — cùng tệp (11 ca): ba lỗi độc lập khác content_group, ≥2 family, trong 7 ngày ⇒ `needs_teaching`; hướng dẫn ⇒ `practicing`; tự làm đúng biến thể mới đủ giãn (≥2 nhiệm vụ HOẶC ≥300 giây) ⇒ `recovered`; thêm lần đúng NGÀY KHÁC ≥24 h ⇒ `stable`; ba lỗi cũ KHÔNG mở lại đợt.
- **T29 (phần DỮ LIỆU)** — `tests/cnh-1-0-su-kien-chuan.test.ts` (10 ca): nộp bài qua `/game-v2/answer` của Worker THẬT với `assisted` ⇒ sổ ghi `assistance='assisted'` + `attempt_id` do máy chủ cấp; hồ sơ KHÔNG nhận làm bằng chứng độc lập, không nâng mức. Cờ TẮT ⇒ hành vi cũ giữ nguyên (không ghi dòng nào). PHẦN THƯỞNG (`raw core=2`, không FSRS Good/transfer 10) thuộc P07 — CHƯA chứng minh.
- **T32** — `tests/cnh-1-0-replay-t32.test.ts` (6 ca): 3.000 sự kiện đảo thứ tự nhận ⇒ hồ sơ y hệt; correction chèn vào quá khứ ⇒ gộp tăng dần BẰNG phát lại đầy đủ, dòng gốc bất biến và bị THAY bằng dòng sửa; kỹ năng dơ thiếu sổ ⇒ NÉM LỖI; đổi trạng thái embargo cũng làm dơ và vẫn bằng; trên D1 THẬT: sổ không đổi ⇒ lần dựng thứ hai KHÔNG ghi lại gì (0 batch), correction trước con trỏ ⇒ dựng lại và bằng đúng phát lại đầy đủ.
- **T14 (phần EVENT)** — cùng tệp sự kiện: cùng `attempt` gửi lại ⇒ MỘT dòng sổ, kết quả đã chốt không đổi. PHẦN TIỀN/receipt thuộc P07 — CHƯA chứng minh.
- **T47 (phần HỒ SƠ)** — cùng tệp: sự kiện `embargoed` không vào bằng chứng, DTO không lộ `eventRef`; sau `/ho-so/cong-bo` mới vào bằng chứng và giữ NGUYÊN ngày gốc. PHẦN VÍ/THÔNG BÁO thuộc P07 — CHƯA chứng minh.

## 4. Điều CHƯA xác minh (không được đọc là đã xong)

- Cờ `cau_hinh.nang_luc_v1` **chưa bật ở production**; migration `migration-2309-cnh1-su-kien-chuan.sql` **chưa áp** lên D1 thật (đúng yêu cầu phiên trước). Chưa deploy.
- Kho thật **chưa có nhãn `family`** ⇒ `familyId` luôn `null` và mức KHÔNG xác nhận được trên dữ liệu thật cho tới khi thầy gắn nhãn (P02 `baoThieuNhan` đã liệt kê phần thiếu).
- CÁCH BIỂU DIỄN dòng sửa điểm trong sổ (row riêng + `correction_of`) do lệnh correction của **P07 (R04)** chốt; P03 chỉ định nghĩa luật áp dụng và kiểm bằng fixture dòng riêng.
- Chưa kiểm hai thiết bị/mạng thật (P11, đã được miễn theo quyền phiên trước).
