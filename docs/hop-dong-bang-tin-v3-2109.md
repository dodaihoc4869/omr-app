# Hợp đồng `/gv/bang-tin` — BẢNG TIN CỦA THẦY bản 3 (Code 3 → Code 4), 21/09/2026

Đề bài: `prompt-bang-tin-thay-v3.md` mục 1. MỘT lệnh **ĐỌC-CHỈ** cho cả màn Hôm nay: `POST /gv/bang-tin {}` (sau cổng mã thầy, header `x-ma-bi-mat`), **≤ 12 truy vấn D1**, không ghi một byte, không gọi AI. Chưa có lệnh (404) / lỗi ⇒ màn rơi về các lệnh cũ, không báo đỏ.

## Mốc dữ liệu
- Khoá cấu hình `cau_hinh.bang_tin_tu` (ISO). Giá trị đầu `2026-09-21T05:00:00.000Z` (= 12:00 trưa 21/09 giờ VN). Mốc **CHỈ LỌC HIỂN THỊ**: không xoá/sửa dòng nào; thuật toán cá nhân hoá vẫn dùng toàn bộ lịch sử.
- Mọi con số "hôm nay" chỉ đếm sự kiện có `luc ≥ mốc`. Vắng khoá ⇒ `tuDangAp: false` và mốc = 00:00 hôm nay (giờ VN).
- `tu` = mốc đã cấu hình (ISO). `tuHomNay` = `max(tu, 00:00 hôm nay giờ VN)` — nơi màn viết đầu trang: cùng ngày `tuHomNay` mà không phải 00:00 ⇒ "Bảng tin · từ 12:00 Thứ Hai 21/09/2026"; mốc đã cũ hơn hôm nay ⇒ "Hôm nay · Thứ … dd/mm/yyyy".

## Thân trả
```json
{ "ok": true, "ngay": "2026-09-21", "tu": "2026-09-21T05:00:00.000Z", "tuHomNay": "2026-09-21T05:00:00.000Z", "tuDangAp": true, "capNhatLuc": "2026-09-21T06:12:00.000Z",
  "nhip": { "soEmHoc": 57, "tongEm": 263, "soCau": 1234, "soCauDung": 900, "tiLeDung": 0.729,
            "homQua": { "soEmHoc": 61, "soCau": 1100, "tiLeDung": 0.7 } },
  "baiTap": [ { "maBtvn": "Riêng-muapj3ut", "ten": "…", "tenLop": "12 - Lớp Thường", "nhieuLop": false, "giaoLuc": "…Z", "hanNop": "2026-09-25T05:00:00.000Z", "quaHan": false,
                "tong": 67, "chuaMo": 60, "dangLam": 5, "daNop": 2,
                "chang": { "tbDaXong": 1.4, "tong": 5, "soEm": 65 },
                "nhac": { "soEm": 0, "soPhuHuynh": 0, "luotKe": "2026-09-24T05:00:00.000Z" } } ],
  "tienBo": [ { "loai": "cham_nhat", "sbd": "12001", "hoTen": "…", "tenLop": "…", "so": 42, "chu": "42 câu đã làm hôm nay" } ],
  "canDeY": { "ds": [ { "sbd": "12007", "hoTen": "…", "tenLop": "…", "lyDo": [ { "loai": "sai_nhieu", "chu": "Sai 6/8 câu dạng Este hôm nay", "so": 6, "tong": 8 } ] } ], "conLai": 3 },
  "dangVap": [ { "ma": "ESTE.THUY_PHAN", "ten": "Thuỷ phân ester", "soEmVap": 9, "soEmGap": 24 } ],
  "boNao": { "ngay": "2026-09-21", "chayLuc": "…Z", "soEmSoi": 250, "soEmDieuChinh": 12, "soLoiNhan": 30, "goiY": [ { "chu": "…", "dang": "ESTE.THUY_PHAN", "tenDang": "Thuỷ phân ester" } ] },
  "mayDaLam": [ { "loai": "nhac_nop_bai", "so": 12, "soPhuHuynh": 9, "chu": "Nhắc nộp bài cho 12 em, báo 9 phụ huynh" } ],
  "sucKhoe": { "muc": "xanh", "chu": "Bộ não A.I chạy lúc 01:04 · nhắc nộp bài chạy lúc 13:30", "boNaoChayLuc": "…Z", "cronNhacLuc": "…Z" },
  "lyDoThieu": { "boNao": "Chưa có bản tin" }, "soTruyVan": 11 }
```
Khoá nào không có số liệu thật thì **VẮNG** (không bịa, không số 0 giả): `nhip.homQua`, `boNao`, `sucKhoe.*Luc`, `tienBo[]` từng bục, `luotKe`… Thiếu bảng/cột ⇒ khối ấy vắng và tên khối nằm ở `lyDoThieu` (lệnh vẫn `ok: true`). Trạng thái rỗng do app viết ("Từ 12:00 trưa nay chưa có em nào làm bài" khi `nhip.soCau = 0`).

## Từng khối
1. **`nhip`** (luôn có): `soEmHoc` = số em có ≥ 1 lượt ĐÃ CHẤM hôm nay (từ `tuHomNay`); `tongEm` = hồ sơ không bị khoá ∪ danh sách cổng; `soCau` = số lượt đã chấm; `tiLeDung` = đúng/số lượt (0–1, 3 chữ số; vắng khi `soCau = 0`). `homQua` CHỈ có khi **cả ngày hôm qua ≥ mốc** (00:00 hôm qua ≥ `tu`) — trước đó vắng (sáng 21–22/09 vắng; từ 23/09 có).
2. **`baiTap[]`** (≤ 8, bài giao `giaoLuc ≥ tu`, chưa xoá, `hanNop` chưa quá 1 ngày; xếp hạn gần trước): `tong = chuaMo + dangLam + daNop` (em chưa bị thu hồi). Trạng thái em: đã nộp = có `nop_luc`; chưa mở = bài cá nhân hoá chưa chốt bộ / bài thường chưa có đáp án nào; còn lại = đang làm. `tenLop` = tên lớp của ĐA SỐ em được giao (`nhieuLop: true` khi có ≥ 2 lớp). `chang` chỉ có ở bài cá nhân hoá: `tbDaXong` = số chặng đã xong trung bình (1 chữ số thập phân), `tong` = số chặng trung bình làm tròn, `soEm` = số em đã chốt bộ. `nhac`: `soEm` = số em đã nhận nhắc TỰ ĐỘNG hôm nay của bài (mốc M1–M4, không tính tin thầy bấm tay), `soPhuHuynh` = số tin phụ huynh (nhóm `ph_nhom`), `luotKe` = giờ lượt nhắc kế (vắng khi cờ tắt).
3. **`tienBo[]`** (≤ 3, mỗi bục một em, CHỈ khi có số): `cham_nhat` = nhiều lượt đã chấm nhất hôm nay (≥ 5); `tien_bo_nhat` = nhiều câu "sai trước nay làm đúng lại" nhất hôm nay (≥ 1); `ben_bi_nhat` = chuỗi ngày liên tiếp có ≥ 5 lượt đã chấm, đếm từ mốc (≥ 2 ngày — ngày đầu vắng). `so` là số thật, `chu` là câu sẵn để in. Không xếp hạng đáy, không nhãn năng lực.
4. **`canDeY`** (`ds` ≤ 5 em, `conLai` = số em còn lại; mỗi em MỘT dòng, có thể nhiều `lyDo`): `loai` ∈ `qua_han` (chưa nộp bài đã quá hạn ≤ 1 ngày) · `sai_nhieu` (≥ 4 lượt đã chấm ở một dạng từ mốc và sai ≥ 60 %; `so`/`tong` = sai/đã chấm) · `chua_mo_bai` (chưa mở bài còn ≤ 24 giờ tới hạn; `chu` có hạn: "Chưa mở bài «…», hạn 12:00 trưa mai (Thứ Tư 23/09)"). Xếp: nhiều lý do trước, rồi `qua_han` > `sai_nhieu` (tỉ lệ sai giảm) > `chua_mo_bai` (hạn gần trước), rồi SBD. Lý do luôn là SỐ, không so em với em.
5. **`dangVap[]`** (≤ 5): em vấp ở dạng = từ mốc làm ≥ 2 lượt dạng ấy và sai ≥ 50 %; dạng hiện khi ≥ 3 em vấp; `soEmGap` = số em có ≥ 1 lượt dạng ấy từ mốc; xếp `soEmVap/soEmGap` giảm rồi `soEmVap`. `ten` = tên dạng (không mã; thiếu tên ⇒ bỏ tiền tố `CD:` của mã).
6. **`boNao`**: bản tin GẦN NHẤT tới hôm nay (không lọc theo mốc — Bộ não chạy đêm): `soEmSoi` (`so_em`), `soEmDieuChinh` (điều chỉnh ĐÃ ÁP hôm nay, `ai_dieu_chinh.ap_dung = 1`, chưa huỷ), `soLoiNhan` (`so_nhan`), `goiY` ≤ 2 dòng `ca_lop` của bản tin (kèm `tenDang`). Chưa có bản tin ⇒ khối vắng.
7. **`mayDaLam[]`** (nhật ký TỰ ĐỘNG hôm nay từ `tuHomNay`, mỗi dòng MỘT việc, CHỈ dòng có `so > 0`, thứ tự cố định): `nhac_nop_bai` (em nhận nhắc tự động; kèm `soPhuHuynh`) · `khac_phuc_luon` (em có điều chỉnh "khắc phục luôn" đã áp) · `on_lai` (câu sai đưa về lịch ôn lại 1·3·7 hôm nay) · `bo_cau_rieng` (em vừa chốt bộ câu riêng của bài tập về nhà) · `vinh_danh` (em được vinh danh hôm nay) · `bo_nao_soi` (em Bộ não soi đêm qua). `chu` là câu sẵn: "Nhắc nộp bài cho 12 em, báo 9 phụ huynh", "Rút bộ câu riêng cho 40 em"…
8. **`sucKhoe`** (luôn có `muc` + `chu`): `xanh` = Bộ não chạy trong 26 giờ qua và (ngoài khung 07:00–21:30 hoặc cron nhắc chạy trong 45 phút qua); `vang` = một trong hai trễ hoặc chưa có dữ liệu để kiểm; `do` = cả hai trễ. `chu` một dòng ("Bộ não A.I chạy lúc 01:04 · nhắc nộp bài chạy lúc 13:30"). Chưa có dữ liệu ⇒ `vang`, không giả xanh.

## Rào
- `soTruyVan ≤ 12`; không ghi; không AI; tên em chỉ ở lệnh thầy. Đáp án, điểm, hạn nộp, luật chấm không đổi.
- Không đổi lệnh cũ (`/gv/chua-nop`, `/gv/can-giup`, `/gv/vinh-danh-ngay`, `/ai/dem-qua` giữ nguyên để màn cũ và trang Toàn cảnh một em còn dùng).
- Ghi mốc lên D1 thật là LỆNH GHI riêng: `server/dat-2109-bang-tin-tu.sql` (một lần, có lệnh lùi + câu kiểm), Boss soát rồi Code 3 chạy.
