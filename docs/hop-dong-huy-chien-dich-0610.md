# Hợp đồng: HUỶ chiến dịch ⇒ thu hồi hết phần đã phân (thầy 06/10)

> Thầy: "Tôi hủy một chiến dịch amine. Nhưng học sinh Đỗ Đại Học vẫn làm câu của chiến dịch. Tôi muốn khi hủy chiến dịch thì những học sinh đã phân phải đc thu hồi hết."

## Luật

**Huỷ = như chưa từng giao.** Kết thúc (`dong`) KHÁC huỷ: nợ của chiến dịch vẫn theo em (sổ nợ 29/09) — không đổi.

Huỷ KHÔNG xoá/sửa gì của dữ liệu thật: sổ làm bài `su_kien_hoc`, lượt `game_v2_attempt`, điểm, EXP, hồ sơ nắm kiến thức giữ nguyên. Chỉ thu hồi phần CHƯA làm và việc tính nợ.

## Gốc lỗi (tái hiện bằng test D1 thật, đỏ trước khi sửa)

`POST /gv/chien-dich {action:'huy'}` chỉ đổi `trang_thai`. Chiến dịch rời danh sách nên kế hoạch lập lại không còn câu chiến dịch — nhưng câu em đã làm **sai** trong chiến dịch vẫn bị "nguồn thứ 4" của vòng học v2 (`docQidSaiV2`: mọi lượt tự làm sai từ 29/09, mọi kênh) kéo lại làm **nợ cũ** ⇒ em vẫn làm câu của chiến dịch đã huỷ. Thêm: lượt Đảo / bàn Bi-a em đang mở (máy em đã tải sẵn câu) vẫn chấm tiếp câu ấy; bài tick gắn chiến dịch vẫn "đã dạy" nên câu bài ấy quay lại làm "Ôn bài cũ", và tick lại bài chỉ trả chiến dịch đã huỷ (`daCo`).

## API

`POST /gv/chien-dich {action:'huy', id}` ⇒ `{ ok:true, thuHoi:{ soEm, soLuotDangMo, nhaTick } }` (chỉ-thêm; `dong` vẫn `{ok:true}`).

| Trường | Nghĩa |
|---|---|
| `soEm` | số em của chiến dịch (cùng nhận thu hồi) |
| `soLuotDangMo` | số lượt game đang mở (≤ 2 giờ, Đảo / Bi-a) được đánh cờ vì có câu của chiến dịch |
| `nhaTick` | bài tick gắn chiến dịch này đã được nhả (bài trở về "chưa dạy") |

Huỷ hai lần: không lỗi, kết quả như nhau (`nhaTick` lần hai = false). Phần nào lỗi ghi thì bỏ phần ấy, huỷ vẫn thành công (phần đọc ở `docHoSo2` đủ để em không nhận lại câu).

## Năm phần thu hồi

1. **Kế hoạch hôm nay đã chốt** — không ghi gì thêm: chiến dịch rời danh sách (đệm 15 s, `xoaDemChienDich`) ⇒ kế hoạch lập lại ở lần mở kế tiếp của em (mã chiến dịch / tập chiến dịch đổi — cơ chế sẵn có), GIỮ câu đã làm hôm nay; câu không còn trong hồ sơ được thay tại chỗ. Phụ huynh mở app trước khi em mở lại: `tamHoanCauKhoa` đã bỏ câu ấy khỏi phần "còn lại".
2. **Nợ do chiến dịch sinh ra** — lọc lúc ĐỌC (`srs2-d1.ts` `docHoSo2`, nguồn thứ 4): câu của chiến dịch đã huỷ mà lần sai sớm nhất của em ≥ mốc giao của em (`mocTinhCua(tao_luc, them_luc)`; không chặn trên — lượt làm dở sau khi huỷ cũng không thành nợ) KHÔNG vào nợ. Giữ nguyên: nợ có từ TRƯỚC chiến dịch; câu còn thuộc chiến dịch khác (nguồn chiến dịch xét trước); nợ từ ca thi đã công bố / Lên bảng / đầu giờ (nguồn 2–3: việc của thầy dạy trên lớp). Đệm danh sách chiến dịch nay kèm chiến dịch đã huỷ từ 29/09 (cùng MỘT câu đọc — không thêm lượt D1; chỉ parse chiến dịch có em).
3. **Lượt game em đang mở** (`thu-hoi-chien-dich.ts`): lúc huỷ đánh cờ `thuHoiLuc` (ISO lúc huỷ SỚM NHẤT) vào JSON `game_v2_session` của các em chiến dịch, lượt ≤ 2 giờ, KHÔNG phải Đoàn, có câu của chiến dịch (khoá kế hoạch = `tc` hoặc phần trước `~` của qid). Chỉ lượt có cờ mới tốn truy vấn:
   - `answer` ⇒ mã **`cau_doi`** cho đúng câu của chiến dịch đã huỷ (đường câu rút khỏi kho — máy em Đảo / Bi-a / Game tự sang câu kế, KHÔNG tính sai, không ghi lần làm); câu khác của lượt chấm bình thường;
   - `resume` bỏ câu ấy; `complete` không đòi câu ấy.
4. **Bài tick gắn chiến dịch** (`bai_da_day.chien_dich_id`): nhả dấu như `bo-tick` (chỉ ghi `bo_tick_luc`, đệm phạm vi xoá) ⇒ bài không còn "đã dạy", câu bài ấy không quay lại làm "Ôn bài cũ", thầy tick lại được thành chiến dịch MỚI. `bo-tick` gọi huỷ bên trong không ghi đè dấu. Chiến dịch giao tay (không gắn bài tick) / `dong` không nhả.
5. **App thầy** (`DsChienDichDaGiao.tsx`): hộp xác nhận nói rõ "câu chưa làm được thu hồi ngay, kể cả lượt em đang mở. Kết quả đã làm vẫn giữ."; lời báo sau huỷ: "Đã huỷ chiến dịch — câu chưa làm đã thu hồi khỏi N em[; bài này không còn tính là đã dạy]" (máy chủ cũ không trả `thuHoi` ⇒ lời cũ).

## Giới hạn nói thẳng

- **Trận Đoàn Hộ Tống đang diễn ra** (phòng giữ sẵn câu của từng em): không đụng — trận ấy chạy hết như cũ (vài phút); sang trận sau câu đã thu hồi. Lượt Đoàn không được đánh cờ để không làm kẹt phòng.
- Em ở isolate máy chủ còn đệm cũ ≤ 15 s sau lúc huỷ vẫn thấy chiến dịch còn chạy (cơ chế đệm có sẵn); sau đó tự đồng bộ.
- "Tự luyện câu sai" (em tự bấm) vẫn liệt kê câu em từng sai, kể cả của chiến dịch đã huỷ — đó là việc em tự chọn, không phải câu được phân.
- Bài tick KHÔNG gắn chiến dịch nào (tick trước khi có cơ chế gắn) không bị nhả.

## Khoá bằng test (D1 thật, kiểm đột biến: tắt từng mảnh ⇒ test đỏ)

`tests/huy-chien-dich-thu-hoi-0610.test.ts` (nợ không quay lại; nợ trước chiến dịch / chiến dịch khác / Lên bảng giữ; `dong` không đổi; huỷ hai lần; phụ huynh; OMNI bật hai chiến dịch) · `tests/huy-chien-dich-luot-dang-mo-0610.test.ts` (cờ lượt, `answer` ⇒ `cau_doi`, `resume`, `complete`, Bi-a, câu anh em, không cờ khi không liên quan) · `tests/huy-chien-dich-nha-tick-0610.test.ts` (nhả tick, tick lại, `bo-tick` không đổi) · `tests/chien-dich-da-giao-2809.test.tsx` (hộp xác nhận + lời báo).

## Lùi

`git revert` commit đợt này. Dữ liệu do huỷ ghi (không có xoá): cờ `thuHoiLuc` trong JSON lượt (vô hại, lượt hết hạn sau 2 giờ) và `bai_da_day.bo_tick_luc` của bài gắn chiến dịch đã huỷ — khôi phục bài: `UPDATE bai_da_day SET bo_tick_luc = NULL WHERE chien_dich_id = '<mã chiến dịch>'`.
