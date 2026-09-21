# Hợp đồng `POST /gv/lich-su-cau-cua-em` — "em đã làm câu này chưa" trên thẻ tên Gọi lên bảng

Bản nháp của Code 1 (màn) ngày 21/09/2026, theo `prompt-len-bang-da-lam-chua-2109.md` mục B. **Code 3 (máy chủ) bổ sung** ba mục cuối (số truy vấn, ước lượng dòng đọc, kênh đã / chưa phủ) khi làm xong lệnh; đổi tên trường thì báo Code 1 trước.

## Vào
Cổng mã bí mật như mọi lệnh `/gv/*` (header `x-ma-bi-mat`; sai ⇒ từ chối như các lệnh kia).

```json
{ "cap": [ { "sbd": "S1", "qid": "K1-I-3" }, … ] }
```
- 1–200 cặp mỗi lần. Rỗng hoặc không phải mảng ⇒ `{ ok:false, lyDo:'thieu' }`. Quá 200 ⇒ `{ ok:false, lyDo:'qua_nhieu_cap' }` (màn tự chia lô, không bao giờ gửi quá 200).
- Cặp trùng: máy chủ trả MỘT phần tử cho mỗi cặp vào, đúng thứ tự vào (kể cả trùng) — màn tra theo vị trí lẫn theo khoá `sbd|qid`.
- `qid` theo quy ước máy chủ (`<mã tờ gốc>-<phần>-<số>`, `qidCuaCau`). Một câu mang qid khác nhau ở đề khác nhau: khớp theo qid; nếu kho có khoá gốc chung thì dùng, không có thì ghi giới hạn ở mục "Giới hạn".

## Ra
```json
{ "ok": true, "ketQua": [ {
    "sbd": "S1", "qid": "K1-I-3",
    "daLam": true,            // có ≥ 1 dòng ở BẤT KỲ nguồn nào (kể cả lên bảng), mọi ngày, KHÔNG áp mốc hiển thị 12:00
    "soLan": 3,               // số lần làm (mọi nguồn TRỪ lên bảng)
    "soDung": 1, "soSai": 2,  // chỉ đếm lần CÓ kết quả tự chấm và được phép thấy; soDung + soSai ≤ soLan
    "lanCuoi": { "dung": false, "ngay": "2026-09-19", "nguon": "on_lai" },   // lần gần nhất theo thời gian; null nếu soLan = 0
    "lenBang": { "soLan": 1, "datLanCuoi": true }                            // từ bảng `len_bang`; null nếu chưa lên bảng câu này
} ] }
```
- `lanCuoi.dung`: `true` / `false` / **`null`** = đã làm nhưng KHÔNG được trả đúng/sai. `null` bắt buộc khi: bài về nhà CHƯA NỘP; ca kiểm tra CHƯA công bố; câu tự luận (không có đúng/sai tự chấm). Màn chiếu trước lớp không được thành đường lộ đáp án của bài đang mở.
- Lần chưa được thấy đúng/sai vẫn tính vào `soLan`, không vào `soDung`/`soSai`.
- `lanCuoi.ngay`: ngày VN `YYYY-MM-DD` của lần gần nhất. `nguon`: tên nguồn trong sổ học (`thi`, `on_lai`, `luyen`, `game`, `do`, `btvn`, …) — chỉ để ghi chú, màn không phân nhánh theo nó.
- `lenBang.datLanCuoi`: `true` đạt · `false` chưa đạt · `null` chưa có kết quả.
- Lỗi đọc dữ liệu ⇒ `{ ok:false, lyDo, error }` cho CẢ lệnh (không trả nửa vời): màn ẩn nhãn, không bịa.

## Màn dùng thế nào (Code 1)
Chỉ SAU KHI thẻ tên hiện (bấm nút hoặc hết giờ làm bài), một dòng dưới tên: chưa có dòng nào ⇒ "Chưa làm câu này" · lần gần nhất đúng ⇒ "Đã làm · lần gần nhất đúng" · sai ⇒ "Đã làm · lần gần nhất sai" · `dung:null` ⇒ "Đã làm · chưa có kết quả". Dòng phụ khi `soLan ≥ 2`: "3 lần: 1 đúng, 2 sai · gần nhất 19/09"; có `lenBang` ⇒ thêm "Đã lên bảng câu này 1 lần · đạt". Không gọi được (mất mạng, máy chủ cũ, 404) ⇒ KHÔNG nhãn, không bịa. Cùng nội dung ở một cột nhỏ của bảng phân công (màn thầy, trước khi chiếu).

## Ngoại lệ có chủ ý
Lệnh này KHÔNG áp mốc hiển thị 12:00 ngày 21/09 (`docMocHienThi`): thầy lệnh quét HẾT lịch sử của em. Ghi chú thích ngay trong mã máy chủ.

## Máy chủ (Code 3, `server/src/gv-lich-su-cau.ts`)
- **D1 THẬT chỉ cho TỐI ĐA 5 term trong một truy vấn UNION** (node:sqlite / test cục bộ không bắt được — sự cố 21/09; `tests/_d1-that.ts` nay ném đúng lỗi): mọi truy vấn của lệnh ≤ 4 term. Đã gọi thử trên D1 thật (xem Nhật ký).
- **Số truy vấn mỗi lần gọi: 2** (đề cho ≤ 3). (1) sự kiện của các cặp: `json_each(cặp) JOIN su_kien_hoc` theo (sbd, qid), MỌI ngày, đi chỉ mục `idx_skh_em_qid*`. (2) MỘT truy vấn gộp ≤ 4 term: `len_bang` + `btvn_em` (đã nộp?) + `mom_bai` (đã nộp?) + `ca` (đã công bố? — cùng luật `SQL_DA_CONG_BO`), chỉ các phần có nguồn tương ứng trong (1). Chỉ đọc, không ghi, không AI.
- **Ước lượng dòng đọc / ngày:** mỗi lần gọi ≈ 0,5–3 nghìn dòng (200 cặp × vài sự kiện, chỉ mục + tra khoá chính). Màn gọi vài lần mỗi buổi chữa ⇒ ≪ 0,1 triệu dòng/ngày (tổng D1 hiện ≈ 120 triệu/ngày sau tối ưu).
- **Kênh đã nằm trong sổ học `su_kien_hoc` (đo trên D1 thật 21/09):** `thi` (12–18/09; MỌI dòng `chi_tiet_cau` đều có trong sổ), `btvn` (15–19/09), `btvn_lo` (chặng bài nâng đỡ, từ 21/09), `on_lai`, `luyen`, `khac_phuc`, `game`, `mom`. `len_bang` đi bằng bảng `len_bang` (sổ chưa có nguồn này; nếu sau này ghi cả vào sổ thì lệnh đếm là "đã làm", không cộng vào `soLan`).
- **Kênh CHƯA phủ, ghi rõ (không bỏ lặng lẽ):** (a) bài làm ca kiểm tra trước 12/09 và bài về nhà trước 15/09 — sổ học chỉ bắt đầu từ các ngày đó, lệnh KHÔNG đọc bảng gốc nào khác; (b) bài về nhà / gói gia đình bị dọn ở lần reset 21/09 (bảng gốc `btvn_em`/`mom_bai` đã xoá): kết quả đã ghi trong sổ vẫn hiện như bài đã nộp; (c) `game_v2_attempt` là nhật ký thô của game, lệnh chỉ đọc bản đã vào sổ.
- **Tự luận:** không đọc kho câu để nhận diện (tốn đọc JSON). Câu tự luận không có kết quả tự chấm ⇒ `ket_qua` rỗng trong sổ ⇒ `dung: null` tự nhiên, chỉ `daLam` + `lenBang`; lần "bỏ trống" của câu trắc nghiệm cũng `dung: null`.
- **Giới hạn khớp qid:** khớp ĐÚNG chuỗi qid. Cùng một câu mang qid khác ở đề khác (kho có `content_group` nhưng lệnh không dùng) ⇒ KHÔNG nối: em làm câu ở đề A không hiện là "đã làm" ở đề B. Ghi để thầy biết; nếu cần nối theo nội dung thì là việc riêng (thêm một truy vấn qua `game_v2_question.content_group`).
- **Quy ước bổ sung với bản nháp:** `lenBang.datLanCuoi` luôn `true|false` (cột `len_bang.dat` NOT NULL); lỗi đọc ⇒ `{ ok:false, lyDo:'loi_doc' }`; cặp thiếu sbd hoặc qid ⇒ `lyDo:'thieu'`.
