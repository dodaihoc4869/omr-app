# Bằng chứng P04 — lát cắt 2: MODULE CHỐNG LẶP (02 §4.2)

Ngày chạy: 2026-09-23 (18:38 +07:00).
`sourceFingerprint`: `c80eb18dafa3387faa4311c8d1204e45a8b6b21b1c29d6a8a4afe13bebe07fea`

## Lệnh đã chạy

| # | Lệnh | Exit | Kết quả | Artifact (sha256) |
|---|---|---|---|---|
| 1 | `npm exec -- vitest run tests/cnh-1-0-chong-lap-p04.test.ts` | 0 | **17 PASS** | `p04b-vitest-chong-lap.log` — `e5b39a75ed241126f7b3e382f6b3fa69e9de29529419e04f43e42931a9933a6b` |
| 2 | `npm exec -- vitest run tests/cnh-1-0 tests/chong-lap tests/game tests/ke-hoach tests/lich-on tests/ho-so` | 0 | 26 tệp · **370 PASS** (0 đỏ) | `p04b-vitest-nhom.log` — `7288b58356d5c61386abfa610ec62ee06cb16286a92032ba566f5d510b18f290` |
| 3 | `npm exec -- tsc -b` + `npm exec -- tsc -p server/tsconfig.json --noEmit` | 0 / 0 | 0 lỗi | — |
| 4 | `vitest run tests/cnh-1-0-nang-luc-t05-t06.test.ts` (chạy LẠI sau khi thêm tệp mới) | 0 | 21 PASS — bằng chứng T05/T06 cập nhật fingerprint mới | `p04c-vitest-t05-t06.log` — `a3dff7cd0a9b889464dfa8110c5f5585e13fd2b51086b7321bb53b29154c7a22` |
| 5 | `vitest run tests/cnh-1-0-replay-t32.test.ts` (chạy LẠI) | 0 | 6 PASS | `p04c-vitest-t32.log` — `4fd194142d6610ea954a755c0b0c535d90bd14ac0e0c13fae692f282cc29069e` |

## Đã chứng minh (module `server/src/chong-lap.ts`, hàm thuần + adapter D1 thật)

- **Đến hạn không bị cooldown chặn**: câu `denHan` được ôn ngay cả khi family vừa làm hôm nay, kèm `repeat_reason: DUE_REVIEW`; và test **khoá việc module không chứa hằng số 3/14/30 ngày nào**.
- **Chưa đến hạn** + mục đích `due_review` ⇒ loại `KHONG_DEN_HAN` (không dùng nguyên văn để lấp số); nhưng vẫn dùng được cho `consolidation`/`transfer`.
- **Cùng content_group hôm nay** ⇒ loại `DA_LAM_HOM_NAY`; **`repair_retry` do máy chủ tạo rõ** ⇒ phát lại nhưng `khongNhanExpCau:true, khongNangFsrs:true`.
- **Task đang mở** ⇒ trả lại đúng task cũ (`dungLaiTask`), không phát bản khác ở màn khác.
- **Phạm vi/quyền công bố thắng mọi ngoại lệ**: `ngoaiPhamVi` ⇒ loại `NGOAI_PHAM_VI` dù đến hạn hay đang có task.
- **Giãn family 1 ngày VN** cho consolidation mới + **4 ngoại lệ đều có `repeat_reason`** (đến hạn · repair · bài thầy giao · probe).
- **Trần lượt**: quá 6 câu ⇒ `TRAN_LUOT`; mỗi family 1 câu thường; repair câu thứ hai chỉ khi ≥2 nhiệm vụ khác HOẶC ≥300 giây; chưa gán family tối đa 1 câu/lượt; thiếu ứng viên ⇒ **rút ngắn** và báo `thieu` (không nới bảo vệ).
- **Adapter D1 thật**: `docDaLamHomNay` lấy đúng `content_group` có kết quả hôm nay (bỏ dòng bỏ trống, bỏ ngày khác); `familyLanCuoiTuSuKien` lấy family từ SỰ KIỆN vì kho thật chưa gắn nhãn family.

## CHƯA làm (P04 vẫn IN_PROGRESS)

- **Chưa nối module vào bộ chọn thật**: theo `05-P05` mục 3, việc ghép pipeline hard-filter + family-spacing + mã lý do thiếu thuộc **P05** (cần `content_group`/`family` từ kho và danh sách task đang mở từ D1). Module đã export sẵn API thuần + adapter đọc để P05 dùng, nhưng **chưa có đường học nào gọi** ⇒ chưa được coi là xong.
- T41/T04 chưa PASS; T07 (P05), T17/T29 (P07).
