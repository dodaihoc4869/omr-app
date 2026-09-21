# Bản vẽ "Xem điểm + báo cáo chi tiết" bản 2 — danh sách ảnh + 5 dòng khác biệt (Code 2, 21/09/2026)

Mở `index.html` (hoặc từng trang) bằng trình duyệt; dữ liệu và tên là GIẢ; chưa build, chưa đụng mã chạy thật. Sinh lại: `node docs/ban-ve-xem-diem-2109/sinh-ban-ve.mjs [--anh]`.

## Ảnh (thư mục `anh/`, JPG ≤ 150 KB, 390 và 1440 × sáng và tối; trang dài quá 150 KB thì cắt đôi `-a`/`-b`)
| Trang | Tệp ảnh (tiền tố) | Nội dung |
|---|---|---|
| Bộ thành phần chung (Code 4 dùng lại) | `bo-thanh-phan-{390,1440}-{sang,toi}[-a/-b]` | SoLon, trạng thái công bố, ThanhPhan, DongDang + bậc, TheCau (công bố / khoá), MayDaLo, DuongDiem, DongCa, MucLuc, chờ·rỗng·lỗi·mất mạng, nút |
| HS-1a Sau nộp · đã công bố | `hs-1a-da-cong-bo-…` | điểm to, ba phần, "máy đã lo", MỘT nút chính "Xem báo cáo chi tiết" |
| HS-1b Sau nộp · chờ cả lớp | `hs-1b-cho-ca-lop-…` | "Đã nộp 27/32 em", không lộ điểm/đáp án |
| HS-1c Sau nộp · thầy chưa công bố | `hs-1c-chua-cong-bo-…` | nói thật, không lộ gì |
| HS-2 Báo cáo chi tiết | `hs-2-bao-cao-chi-tiet-…` | MỘT trang cuộn dọc + mục lục dính (thay 4 tab) |
| HS-3 Danh sách ca (tab Xem điểm) | `hs-3-danh-sach-ca-…` | điểm 5 ca gần nhất, chưa có điểm / đã có điểm |
| PH-1 Báo cáo phụ huynh | `ph-1-bao-cao-phu-huynh-…` | tiếng thường + "Anh/chị có thể làm gì" |
| PH-2 Danh sách ca (phụ huynh) | `ph-2-danh-sach-ca-…` | cùng khung HS-3, giọng "con" |
| Bản in A4 (PhieuScreen) | `ban-in-a4-a4.jpg` | hai trang, nền trắng, mực đen |
| PH-3 Thẻ "Ca kiểm tra gần nhất của con" (thầy lệnh 21/09) | `ph-3-the-ca-gan-nhat-{390,1440}-{sang,toi}` | thẻ ở ĐẦU Bảng nhiệm vụ phụ huynh, 4 trạng thái: đã công bố (điểm tăng) · ca đầu tiên · chờ cả lớp (27/32) · thầy chưa công bố (không điểm). Cả thẻ = MỘT đích chạm ≥ 48 px, mũi tên "Xem tất cả về con" |
| PH-4 Trang "Tất cả về con" (thầy lệnh 21/09) | `ph-4-tat-ca-ve-con-{390,1440}-{sang,toi}[-a/-b]` | MỘT trang cuộn + mục lục dính, 8 mục: Ca gần nhất · Tiến bộ · Bài tập về nhà · Dạng con còn vấp (+ vừa lên bậc) · Lịch ôn lại · Nhịp học 14 ngày · Lời từ A.I Đỗ Đại Học (lời hôm nay + thư tuần) · Anh/chị có thể làm gì + nút "Giao thêm bài cho con". KHÔNG thần thú/EXP/khiên/game, KHÔNG xếp hạng, KHÔNG so con với bạn; ngày không học để trống (không trách) |
(GV-1/2/3 do Code 4 vẽ sau, dùng đúng bộ thành phần này.)

## 5 dòng "bản 2 khác bản cũ ở đâu"
1. **Một khung cho cả 3 app, một trang thay bốn tab**: Kết quả · Ba phần · Theo dạng bài · Câu cần xem lại · Máy đã lo · Tiến bộ, có mục lục dính (điện thoại = hàng chip, máy tính = cột trái); HS/PH/GV khác giọng và độ sâu, không khác cấu trúc.
2. **Số THẬT thay tổng cứng**: bỏ tổng 12/12/10/6 của tab "Mức độ nhận thức"; ba phần và tám dạng cộng đủ đúng 21/28 câu của ca (Phần II tính câu đúng trọn cả 4 ý, có chú thích).
3. **Bỏ hạng**: hết "Hạng x/sĩ số"; chỉ so với LẦN TRƯỚC CỦA CHÍNH EM (mũi tên + dấu + số); điểm giảm dùng giọng trung tính (không đỏ, không doạ); ca đầu tiên nói thẳng "chưa có lần trước".
4. **Luật công bố đứng đầu**: ba trạng thái (đã công bố · chờ cả lớp nộp 27/32 · thầy chưa công bố); hai trạng thái sau KHÔNG lộ điểm, đáp án, lời giải — thẻ câu ghi "hiện khi thầy công bố điểm".
5. **Dùng dữ liệu đã có mà báo cáo cũ bỏ**: bậc theo dạng (Biết · Hiểu · Vận dụng) + có lên bậc không, thời gian từng câu, lịch ôn ("máy đã xếp câu này vào lịch ôn ngày dd/mm"), thẻ "Máy đã lo" (bài tập về nhà ưu tiên dạng nào, mai ôn N câu, +N EXP — chỉ điều chắc chắn xảy ra), phụ huynh có "Anh/chị có thể làm gì".

## Tự kiểm (Chromium, 8 trang × 390/1440 × sáng/tối = 32 ca)
0 chữ dưới 4,5:1 · 0 đích chạm dưới 48 px · 0 tràn ngang · 0 lỗi console · 0 emoji · 0 mã nội bộ · màu chỉ đọc biến của app (tokens.css + m3-theme.css) · nút chính đúng MỘT/màn.

## Ghi thêm 21/09 (PH-3/PH-4)
- Sửa chữ mẫu "Este" → **"Ester"** ở mọi trang (theo Boss); ảnh cũ chụp lại cho khớp.
- Thẻ và trang chỉ GHÉP bộ `xd-*` đã chốt + vài khối riêng của phụ huynh (`xd-tcg*`, `xd-btvn*`, `xd-on-*`, `xd-nhip*`, `xd-loi*`). Dữ liệu mẫu theo `docs/hop-dong-xem-diem-v2-2109.md` mục 6 (`/ph/tat-ca-ve-con`); khối nào thiếu số thật ⇒ ẨN, không bịa.
- Tự kiểm Chromium 390/1440 × sáng/tối: 0 chữ dưới 4,5:1 · 0 đích chạm < 48 px · 0 tràn ngang · 0 lỗi console.
