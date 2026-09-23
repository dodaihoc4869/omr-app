# Bằng chứng gói P04 (CNH-1.0) — FSRS và chống lặp (LÁT CẮT LÕI, gói CHƯA PASS)

Ngày chạy: 2026-09-23 (18:15–18:25 +07:00).
`sourceFingerprint`: `24ed5c2bfd791a8d35937aeda7813054b825c27f4d99bc07361378463cc36eee`

Tệp này tóm tắt (log bị `.gitignore` chặn nên không lên git).

## 1. Lệnh đã chạy

| # | Lệnh | Exit | Kết quả | Artifact (sha256) |
|---|---|---|---|---|
| 1 | `npm exec -- vitest run tests/cnh-1-0-fsrs-t41.test.ts` | 0 | **11 PASS** (lát cắt T41) | `p04-vitest-t41.log` — `4aad351ea6cf5fd17274509a815ea0b2269faca970764743dcd68513a7484bb2` |
| 2 | `npm exec -- vitest run tests/cnh-1-0 tests/ho-so tests/lich-on tests/ke-hoach tests/exp tests/dem-ke-hoach tests/cau-da-lam tests/game` | 1 | 33 tệp · **496 PASS / 1 đỏ CÓ SẴN trong nền P00** (`cau-da-lam-2109.test.ts`, dòng 10 của `p00-vitest-fail-tests.txt`) | `p04-vitest-nhom.log` — `262bef75b62a1333ead03a4f89420f3911301fa47f74e66436ca14015d88cb83` |
| 3 | `npm exec -- tsc -b` + `npm exec -- tsc -p server/tsconfig.json --noEmit` | 0 / 0 | 0 lỗi | — |
| 4 | `vitest run tests/cnh-1-0-nang-luc-t05-t06.test.ts` (chạy LẠI sau khi sửa code P04) | 0 | 21 PASS — bằng chứng T05/T06 cập nhật theo fingerprint mới | `p04-vitest-t05-t06.log` — `ef31f0a81b5d6d325fe69c37e077c6054b36ae5a547341f719e6d9951f8cd4f2` |
| 5 | `vitest run tests/cnh-1-0-replay-t32.test.ts` (chạy LẠI) | 0 | 6 PASS | `p04-vitest-t32.log` — `378b01d882c50f093f3a5cb7d9e0383c4c2ee9f7e09291aa4fa9257e14225755` |
| 6 | `vitest run tests/cnh-1-0-su-kien-chuan.test.ts` (chạy LẠI) | 0 | 10 PASS | `p04-vitest-su-kien.log` — `27b55f09cdc2ecaf8f918e2825629cf9c14501852b9d67f087dd342e2916ec9d` |

LƯU Ý về #4–#6: sửa code cho P04 làm fingerprint đổi, nên bằng chứng P03 đã được **chạy lại** và cập nhật
số fingerprint/mới; nếu không thì log cũ thuộc phiên bản code khác (đúng luật "không có log đúng phiên bản là NOT_RUN").

## 2. Đã chứng minh trong lát cắt này

- **Trạng thái đủ**: `LichOnFsrs` có `khoa`, `phienBan` (`fsrs6-ts5.4.2-ret0.9-cfg1`), `lucGoc`, `cursor`, `docLap`, `soLanHoTro`; state của phiên bản lịch khác bị **dựng lại** (không trộn).
- **Khoá trí nhớ** `content_group#memory_version`: hai qid cùng nhóm nội dung dùng CHUNG một card (T04 phần card); đổi phiên bản câu ⇒ card mới.
- **Một quan sát độc lập/card/ngày**; **Again thắng** trong ngày (tính trên state ĐẦU NGÀY, không nhân đôi); **bỏ trống** không cập nhật card.
- **Lần có HỖ TRỢ** không thêm Good, **không kéo mốc xa** (chỉ đếm + giữ cursor); trên đường hồ sơ: không tăng `dung_lien_tiep`/`ngay_dung_khac_nhau`, không đổi trạng thái, không nâng bậc dạng, **không gỡ nhãn `can_day_lai`**.
- **Đường lùi**: D1 chưa áp migration (thiếu cột `assistance`) ⇒ hồ sơ tự đọc bằng câu cũ, không hỏng kế hoạch ngày.

## 3. CHƯA làm (nên P04 vẫn IN_PROGRESS, T41/T04/T07 chưa PASS)

- **Module chống lặp** theo thứ tự ưu tiên 02 §4.2: "due hợp lệ không bị 30 ngày chặn", cùng `content_group` trong ngày bị chặn trừ `repair_retry`, tối đa 6 câu/lượt, mỗi family 1 câu thường (repair 2 câu khi ≥2 nhiệm vụ hoặc ≥300 giây), family vừa làm nghỉ tối thiểu 1 ngày VN cho consolidation với ngoại lệ có `repeat_reason`.
- **Family spacing + repair exception** có lý do; giảm lượt khi thiếu nguồn.
- **Nối `khoaTriNho` vào kênh thật**: cần `content_group` từ kho; hiện `docSuKienDoc` chưa lấy trường này nên trên đường thật mỗi `qid` vẫn là một khoá (chỉ đúng ở tầng hàm thuần + nơi gọi truyền khoá).
- T17/T29 (phần thưởng) thuộc P07.
