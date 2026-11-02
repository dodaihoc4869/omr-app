# ĐỀ BÀI — MỘT định nghĩa "câu đã làm hôm nay" cho cả ba app

Boss soạn 21/09/2026 theo lệnh thầy (2 ảnh màn học sinh, cùng một em cùng một lúc): thẻ Hôm nay ghi "Đã làm **93** câu", ô Thi đua ghi em đó "**78** câu". "Bạn kiểm tra lại hiển thị câu đã làm ở mọi chỗ, mọi app xem đã chuẩn chưa."

## 1 · Kết quả rà (Boss, có tệp:dòng)
| Nơi | Đếm | Thời gian | Đòi đã trả lời | Ghi chú |
|---|---|---|---|---|
| Thẻ Hôm nay HS — `ke-hoach-ngay-d1.ts:273 TIEN_BO_NGAY` (cũng dùng ở `hom-nay-thay.ts:123`, `on-lai-nop.ts:158`) | qid khác nhau | cả ngày, KHÔNG mốc | KHÔNG (câu bỏ trống vẫn tính) | rộng nhất ⇒ 93 |
| Thi đua — `thi-dua-hom-nay.ts:255` | qid khác nhau | từ mốc hiển thị | có | ⇒ 78 |
| Phụ huynh — `ph-tat-ca-ve-con.ts:606` | qid khác nhau | từ mốc | có | còn TRỪ câu bị che ⇒ ≤ Thi đua |
| Thú ăn (có học ≥ 4 câu) — `game-v2-hap-thu.ts:37` | qid khác nhau | cả ngày | có | LUẬT, không phải hiển thị |
| Bảng tin thầy + Bảng tin sống — `gv-bang-tin.ts:166,203`, `gv-bang-tin-song.ts:152,181` | **LƯỢT làm** | từ mốc | có | làm lại một câu làm số phồng |
| Nhịp 30 ngày của thầy — `gv-hom-nay-v2.ts:551` | **LƯỢT** | cả ngày | không | |
| Đạt nhiệm vụ ngày (EXP/khiên) — `src/lib/dat-nhiem-vu-ngay.ts:153` qua `exp-d1.ts:453` | qid khác nhau | mốc tính EXP riêng | không | LUẬT, không phải hiển thị |

93 − 78 = câu em làm TRƯỚC 12:00 trưa nay + câu em BỎ TRỐNG. Từ ngày mai khác biệt do mốc tự hết; khác biệt do "bỏ trống" và do "lượt" thì còn mãi nếu không sửa.

## 2 · ĐỊNH NGHĨA CHUẨN (chỉ cho HIỂN THỊ)
**"Câu đã làm hôm nay" = số câu KHÁC NHAU (DISTINCT qid) em ĐÃ TRẢ LỜI (`ket_qua IS NOT NULL`), mọi nguồn, có `luc >= MAX(mốc hiển thị, 00:00 hôm nay giờ VN)`.** Đây đúng là định nghĩa ô Thi đua đang dùng ⇒ Thi đua là CHUẨN, các nơi khác sửa theo.
- Một nguồn: Code 3 đặt trong MỘT tệp máy chủ (`server/src/cau-da-lam.ts`: hằng SQL + hàm `tuLucHomNay(moc, nowMs)` — dùng lại `tuLucEmDaHoc` của 929aad6); mọi lệnh import, không chép SQL.
- Con số của LỚP (Bảng tin, Bảng tin sống, bản đồ lớp, ô nhiệt) = TỔNG các con số của từng em theo đúng định nghĩa trên ⇒ ô nhiệt của em X = số ở ô Thi đua của em X = số ở thẻ Hôm nay của em X. Nơi nào thầy cần số LƯỢT thì phải ghi nhãn "lượt làm", không gọi là "câu".

## 3 · KHÔNG ĐỔI (luật — đổi là phải dừng báo Boss)
`dat-nhiem-vu-ngay.ts` (đạt nhiệm vụ ngày, EXP, khiên), cổng "có học ≥ 4 câu" của thú ăn, trần 60 câu game. `TIEN_BO_NGAY` vẫn nuôi các luật đó như cũ. Việc này CHỈ thêm một trường hiển thị.

## 4 · Việc từng phiên
**Code 3:** (a) `cau-da-lam.ts` + test; (b) `/hs/ke-hoach-ngay` thêm CHỈ-THÊM `tienBo.soCauHienThi` theo định nghĩa chuẩn (giữ `daLam` cũ cho luật); `hom-nay-thay.ts`, `on-lai-nop.ts` tương tự nếu chúng HIỆN số; (c) `gv-bang-tin.ts`, `gv-bang-tin-song.ts`, `gv-hom-nay-v2.ts:551`: chuyển sang qid khác nhau theo em rồi cộng, HOẶC giữ lượt nhưng đổi khoá/nhãn thành "lượt làm" — chọn cách (đầu) cho mọi ô có chữ "câu"; giữ các phép khớp Σ lớp = tổng = ô nhiệt; (d) đo rows_read, ≤ 5 term. Nhắn Code 4 trước khi chạm tệp Bảng tin.
**Code 4:** `ph-tat-ca-ve-con.ts`: `câu đã làm` dùng định nghĩa chuẩn VÀ GỒM cả câu bị che (đếm số câu không lộ đáp án); riêng `câu đúng / tỉ lệ đúng` chỉ tính trên câu KHÔNG che, máy chủ gửi thêm mẫu số `soCauCoKetQua` để màn ghi "đúng 30 trong 38 câu đã có kết quả". Thi đua: import hằng chung, không đổi kết quả.
**Code 2:** thẻ Hôm nay + thẻ "Em đã xong việc hôm nay" + mọi chữ "Đã làm N câu" ở app học sinh đọc `soCauHienThi` (vắng ⇒ rơi về `daLam`, máy chủ cũ không vỡ); dòng "93/8 câu" dùng cùng con số; bảng phụ huynh đổi chữ theo mẫu số mới. Rà thêm mọi chỗ khác ở 3 app có chữ "câu đã làm / đã làm N câu" và báo nguồn số.
**Bất biến phải có test (Code 3 viết, một bộ dữ liệu cho mọi lệnh):** cùng sổ học ⇒ thẻ Hôm nay = Thi đua = phụ huynh = ô nhiệt Bảng tin cho cùng em; có câu trước mốc, câu bỏ trống, câu làm lại 3 lần, câu bị che — mỗi loại một ca.

## 5 · Việc kèm (ảnh 1 của thầy)
Thẻ Hôm nay có dòng "Kế hoạch lúc 18:06 — chưa cập nhật được, đang hiện bản cuối." ⇒ Code 3 soi nhật ký lỗi `/hs/ke-hoach-ngay` quanh 18:00–18:15 (trùng lượt Worker 18:07?) và báo: lỗi thoáng qua do đẩy hay lỗi thật.
