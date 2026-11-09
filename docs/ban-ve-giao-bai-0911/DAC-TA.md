# Nút «Giao bài» ở màn Hôm nay — đặc tả 7 mục (09/11/2026, chờ thầy duyệt)

Thầy: «thiết kế 1 nút giao bài ngay ở màn hôm nay, bấm vào popup chọn bài đơn giản hiệu quả đẹp mắt, bỏ hết màn phân bài bên trong đi» · «Tôi chỉ việc chọn đề, bạn tự tính toán tự giao mọi thứ, hết hạn báo trên app gv cho tôi».
Đi cùng đề xuất lịch 28 câu/ngày: `docs/de-xuat-28-cau-v5-0911.md`.

## 1. Mục tiêu + ai dùng
- Giáo viên. Thầy làm đúng một việc: chọn bài. Máy tự tính, tự giao, tự đặt hạn từng em; quá hạn hoặc cần thầy thì báo ở «Việc cần thầy».
- Cảm giác: mở → thấy ngay bài gợi ý đã tick sẵn → một nút Giao. Không ô hạn nộp, không lượt/ngày, không «Giao cho».

## 2. Bố cục (ảnh `dt-*` 390 px, `mb-*` 820 px, `mt-*` 1366 px; `sang` / `toi`)
- **Hôm nay** (`*-0-hom-nay`): nút chính **«＋ Giao bài»** góc phải (điện thoại: nút rộng đầu màn). Có ca đang mở thì «Theo dõi ca» là nút chính, «Giao bài» là nút phụ cạnh bên (như hiện nay). Bên dưới: «Việc cần thầy» thêm 3 loại thẻ mới (mục 2b). Nhịp học và phần dưới giữ nguyên.
- **Hộp Giao bài** (`*-1-chon`) — máy tính: hộp giữa màn hai cột; điện thoại: tấm trượt từ đáy, tóm tắt một dòng + nút dính đáy:
  1. **Lớp**: chip từng lớp kèm số em; mặc định lớp của buổi đang mở; chọn nhiều lớp cùng khối.
  2. **Danh sách bài theo chương**: chương đã giao hết gộp thành một dòng «Hiện 2 chương đã giao hết»; mở sẵn chương có bài kế tiếp. Mỗi dòng: ô tick · số bài · tên · «96 câu · 4 ngày Mới». Bài kế tiếp **tick sẵn**, nhãn xanh «Gợi ý». Bài đang giao: mờ, dòng phụ «Đang giao · 41/53 em xong», nút ⋯ → «Gỡ bài» (hỏi lại, nói rõ hậu quả).
  3. **Tóm tắt** (máy tự tính): Câu mới (số câu · số ngày · 28 câu/ngày) · Đề chuẩn x/28 · **Hạn chung cả lớp** (số ngày + ngày hết hạn + số em dự kiến xong hết). Dòng «Cả lớp chung hạn. Em xong sớm được Ôn thêm; em yếu được nhiều ngày Sửa hơn». Nút **«Giao Bài 9 cho 12 Thường»**. Liên kết nhỏ «Không giao cho vài em…» mở danh sách em để bỏ tick, có chip «Cả lớp» và «Theo điểm danh» (buổi đang mở + tối đa 3 buổi gần nhất) đúng như bản cũ — giữ chức năng thầy yêu cầu 05/10, mặc định ẩn.
- **Thiếu câu chuẩn** (`*-2-thieu`): ô Đề chuẩn chuyển vàng «24/28 · thiếu câu Đúng/Sai», dòng giải thích + «Bổ sung câu Đúng/Sai ›». Vẫn giao được.
- **Đã giao** (`*-3-xong`): dấu ✓, «Đã giao Bài 9 cho 12 Thường · 53 em», một câu máy sẽ làm gì; [Giao thêm bài] [Xong].

### 2b. Thẻ mới ở Việc cần thầy (không có việc thì không hiện)
| Thẻ | Khi nào | Nút |
|---|---|---|
| Hết hạn · chưa xong (đỏ) | hết hạn chung mà em còn câu mới chưa làm hoặc lỗi của bài chưa sửa | Xem em |
| Nên chữa chung (vàng) | từ 30 % em của lớp cùng một nhóm lỗi | Gọi lên bảng (mở sẵn dạng đó) |
| Cần thầy chữa (vàng, đã có) | thêm nguồn: nhóm lỗi sai 3 lần | Mở |
| Bài thiếu câu chuẩn (xám) | bài đang giao có đề chuẩn < 26/28 | Xem ô thiếu |
- Em bỏ làm KHÔNG thành thẻ (thầy đã bỏ thẻ «N em chưa làm» 12/10 vì Nhịp học đã nói) ⇒ hiện ở Nhịp học.
- «Lớp chưa xong bài trước» KHÔNG thành thẻ (với nhịp chọn bài 7 ngày sẽ hiện gần như mọi lần) ⇒ đã có ở ô «Lớp dự kiến xong» trong hộp.

## 3. Trạng thái
- Đang tải: khung xương đúng hình (danh sách + tóm tắt). Đang tính dự kiến: ba ô hiện «…», nút Giao vẫn bấm được (số chỉ để xem).
- Chưa tick bài: nút ghi «Chọn bài để giao», bị khoá. Tick nhiều bài: «Giao 2 bài cho 12 Thường», tóm tắt cộng gộp.
- Đang giao: nút «Đang giao…» khoá; mạng lỗi ⇒ dòng đỏ «Chưa chắc đã giao — xem dòng bài trong danh sách rồi hãy bấm lại» (không tự bấm lại).
- Có ca thi đang mở: vẫn bấm Giao được; bài được ghi, còn gói của các em chỉ tạo khi không có ca mở (`goi-bai-7.ts`, điều kiện `NOT EXISTS ca mở`) và máy chủ đồng bộ gói MỖI PHÚT (`index.ts`, cron `* * * * *` gọi `dongBoGoi7`) ⇒ báo «Đang có ca thi — các em nhận bài ngay khi ca đóng».
- Không còn bài chưa giao trong khối: dòng «Đã giao hết bài của khối 12».

## 3b. HẠN CHUNG CẢ LỚP (thầy 09/11: «hạn chung cho học sinh vì học sinh đang phải học cùng nhau trên lớp»)
- **Hạn chung T = số ngày ít nhất mà máy dự kiến ≥ 90 % em của lớp làm xong hết** (hết câu mới + sửa sạch lỗi của bài + ít nhất 1 ngày Ôn). Dự kiến từng em = M + 1 + số ngày Sửa dự báo theo năng lực từng ô của em (+ lỗi đang mang sang); máy hiệu chỉnh bằng kết quả thật mỗi tháng.
- **Cá nhân hoá nằm TRONG cùng hạn:** mọi em M ngày Mới như nhau (cả lớp xong câu mới cùng ngày) → 1 ngày Ôn → Sửa đến sạch → còn ngày thì Ôn thêm. Em giỏi: nhiều ngày Ôn; em yếu: nhiều ngày Sửa. Chỉ Ôn thêm khi đã sạch lỗi (Ôn khi còn lỗi sinh thêm lỗi).
- Giả lập lớp 53 em, bài 112 câu (`docs/de-xuat-28-cau-mo-phong/han-chung.py`, giả định): hạn 10 ngày ⇒ 49–53/53 em sửa sạch lỗi của bài trong hạn; em giỏi được ~2 ngày Ôn, em yếu ~5 ngày Sửa; hạn dài hơn chỉ thêm ngày Ôn cho em giỏi.
- Em chưa xong khi hết hạn (≤ 10 %): lỗi còn lại sang khung bài sau, sửa trước; báo thầy thẻ «Hết hạn · chưa xong».
- **Thầy giao bài kế sớm hơn hạn:** vì M chung, cả lớp xong câu mới cùng ngày ⇒ giao sau ngày đó thì khung mới bắt đầu ngay, lỗi dở mang sang; giao trước ngày đó thì bài mới bắt đầu khi lớp xong câu mới bài trước (hộp ghi rõ «bắt đầu 13/11»). Lớp luôn đi cùng nhau.

## 4. Dữ liệu
- Đã có: cây bài theo khối (`bai-hom-nay.ts`), `/gv/bai-da-day danh-sach | xem-truoc | tick | bo-tick`, danh sách em (`useDsEmGiao`), gói 7 (`goi-bai-7*.ts`).
- Thay đổi máy chủ (theo v5): `xem-truoc` trả thêm M (⌈N/28⌉), độ chuẩn đề, hạn chung (mục 3b) và số em dự kiến xong hết; `tick` không nhận hạn / lượt nữa — máy tính hạn chung của lớp (mục 3b) và ghi vào gói bài (cột hạn đã có ở `goi_bai_7`).
- Đề 28 câu mỗi ngày dựng khi em mở app lần đầu trong ngày (như `goi_bai_7_ngay`); việc chạy đêm chỉ gom số cho thẻ cảnh báo và dự kiến.

## 5. Ngoại lệ
- Bấm Giao hai lần: nút khoá ngay; máy chủ `tick` vốn bỏ qua lớp đã có bài.
- Tên bài dài: xuống dòng, không cắt chữ; số bài và ô tick cố định.
- Lớp khác khối được tick: bỏ chọn bài, báo «Bài theo khối — đã bỏ chọn».
- Máy yếu (`ddh.mayYeu`): không bóng đổ, không chuyển động mở hộp.
- Đổi tab giữa chừng: giữ bài đang tick (như `chonNho` hiện có).

## 6. Bỏ đi (thầy: «bỏ hết màn phân bài bên trong»)
- **Trang Hành trình 4 bước (điểm danh · gọi lên bảng đầu giờ · dạy học · chữa câu khó, `TheBaiDaDay`) GIỮ NGUYÊN.** Chỉ bỏ hai phần giao bài bên trong:
  - phần chọn bài «Bài hôm nay» trong bước Dạy học (`BuocBaiHomNay` ở `DayHocLenBang.tsx`) — phần dạy trên bảng giữ nguyên;
  - bảng «Bài đang giao» (`BangBaiDangGiao`, nằm trong `TheBaiDaDay`) — gộp vào hộp (dòng bài đang giao + ⋯ Gỡ bài; Thêm/Bớt em ở «Không giao cho vài em…»).
- Hộp «Bổ sung bài hôm nay» cũ (`HopBoSungBai` + `BoSungNhieuBai`) — thay bằng hộp Giao bài; lối cũ `boSungBai` mở hộp mới.
- «Giao bài tập về nhà», «Giao đề theo tuần» không có trong thanh bên hiện tại (chế độ Game Hoá 2) ⇒ không đụng.
- Mã cũ gỡ khỏi mọi lối vào ngay; xoá hẳn sau một tuần chạy ổn (dễ lùi).

## 7. Nghiệm thu đo bằng máy
- Test: hộp chỉ có lớp + bài + tóm tắt + nút (không ô hạn, không lượt); bài kế tiếp tick sẵn; nhiều bài cộng gộp đúng; ⋯ Gỡ bài gọi `bo-tick` sau khi hỏi lại.
- Không còn lối nào tới các màn ở mục 6 (test điều hướng).
- Ảnh Chromium 3 khổ × sáng/tối: 0 tràn ngang, 0 nút < 44 px (đã đạt ở bản vẽ: `chup.mjs`).
- `npm run kiem:toc-do` 0 đỏ: hộp tải lười như hộp cũ; bỏ bảng Dạy học chọn bài phải làm nhẹ gói Hành trình. Tác tử toc-do đo trước/sau.
- Dữ liệu trong ảnh là dữ liệu mẫu (lớp, số em, số câu, ngày dự kiến), không phải số thật.

Chụp lại ảnh: `node docs/ban-ve-giao-bai-0911/chup.mjs <thư mục chứa be-vietnam-pro-*.woff2>`.
