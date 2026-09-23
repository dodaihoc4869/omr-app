# Bằng chứng P05 lát cắt 8 — MỘT PLAN/NGÀY + MỤC TIÊU CORE ĐÓNG BĂNG (T13/T40)

Ngày chạy: 2026-09-23 (21:00–21:03 +07:00). `sourceFingerprint`: `fec2375cce83914927e4d7b40d357b0baf1b8736799ecdfe9c11780c4ec2a550`

| Lệnh | Exit | Kết quả | Artifact (sha256) |
|---|---|---|---|
| `vitest run tests/cnh-1-0-muc-tieu-plan-p05.test.ts` | 0 | **4 PASS** (D1 thật + qua Worker thật) | `p05h-vitest-muc-tieu-plan.log` — `2db4554d4804ead12b6b04358cd4bff4b3be46a57fc4b4137be0cb084642722c` |
| `vitest run tests/cnh-1-0-muc-tieu-core-p05.test.ts` | 0 | **12 PASS** (hàm thuần T40) | `p05h-vitest-muc-tieu-core.log` — `5b7fb49fdea78f54884efe00a1edec5d6845d65eae4b623e9d36ed478eb1966d` |
| nhóm (cnh-1-0, ke-hoach, ho-so, game, tran-ngay, doan, lich-on) | 0 | 55 tệp · **740 PASS / 0 đỏ** | `p05h-vitest-nhom.log` — `8aeee6be577d43665bc85a165bac8ba0c15d5f37cab0528f4da8be69e834e388` |
| `tsc -b` / `tsc -p server/tsconfig.json --noEmit` | 0 / 0 | 0 lỗi | — |
| chạy LẠI T05/T06 + T32 theo fingerprint mới | 0 | 21 + 6 PASS | `p05h-vitest-t05-t06.log` — `63150e2b417a357e9d9a718e418b71d50945632ce777d363cc560cbde80877fd` · `p05h-vitest-t32.log` — `696563456118860ba4bbd7d0b5011e0f4766280c4d973bf08b0d975052cbdac6` |

## Đã chứng minh trên đường sản phẩm

- **Một mục tiêu core, có hợp đồng đầy đủ**: `role · required_task_ids · n · min_success · policy_version · revision`
  (`muc-tieu-core.ts`), chọn role theo **đúng thứ tự §6** (return → homework_slice → repair → maintenance → consolidation).
- **Đóng băng**: `ke_hoach_ngay.muc_tieu_json` ghi **một lần/ngày**; lần lập lại trong ngày **KHÔNG ghi đè**, và
  `lapVaLuuKeHoach` **đọc lại bản đã chốt** để trả về — test chứng minh: thêm BTVN mới ⇒ `n`/`minSuccess`/`revision`
  của ngày vẫn y nguyên, trong khi một em có sẵn hai bài từ đầu thì `n` tính mới **lớn hơn** (phép đo có nghĩa, không rỗng).
- **n = 0 ⇒ `NO_VALID_CORE_TASKS`**: loại hết câu lỗi khỏi mẫu số thì ngày KHÔNG tự `achieved`, và **giữ quyền đã kiếm**
  (`giuQuyen`) thay vì lấy lại mảnh — đúng 02 §6.
- **Bài mẫu/retry/probe/tranh chấp KHÔNG vào mẫu số**; lần làm **có trợ giúp** tính hoàn tất việc nhưng **không vào số
  độc lập đúng**; mục **chờ giáo viên xác minh** giữ nhãn riêng.
- **Assignment quá tải giữ hạn gốc**: BTVN 60 câu / 2 ngày ⇒ `tai.vuot > 0`, plan ghi `deferred_count = vuot` và
  `over_budget_seconds > 0` vào D1, việc BTVN vẫn còn hạn (`hanCung`/`hanMem`), không cắt việc bắt buộc.
- **Family không bịa**: `consolidation` + kho chưa gắn nhãn ⇒ `thieuNhanFamily: true` (ghi rõ nhánh chưa áp được).

## Chưa làm (P05 vẫn IN_PROGRESS)

- **Đánh giá đạt/không đạt lúc CHỐT NGÀY** (`chotNgayCu`) chưa gọi `danhGiaCore` (hiện vẫn dùng luật đạt nhiệm vụ ngày cũ);
  cần ánh xạ kết quả từng task core từ `su_kien_hoc` sang `KetQuaTaskCore` (đã có hàm thuần + test sẵn).
- **Revision khi có mục lỗi** chưa nối vào command của giáo viên (P07).
- **Nhả chỗ khi lượt kết thúc** (P07); **ghép mẫu tốc độ theo part/mức** vào adapter ngân sách (`mau` đã có đường truyền).
