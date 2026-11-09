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

### 2b. KHÔNG thêm thẻ nào cần thầy (thầy 09/11: «không có cái gì cần thầy cả, mọi thứ tự động tôi chỉ chọn giao bài máy phải làm hết»)
- Bỏ các thẻ đã vẽ «Hết hạn · chưa xong», «Nên chữa chung», «Bài thiếu câu chuẩn», nguồn mới cho «Cần thầy chữa». «Việc cần thầy» giữ nguyên như trước việc này.
- Ô thiếu câu chuẩn: máy tự lấy câu ô gần nhất (ô Đề chuẩn chỉ báo thông tin). Em chưa xong khi hết hạn: lỗi mang sang khung sau, máy tự xếp sửa trước.

## 3. Trạng thái
- Đang tải: khung xương đúng hình (danh sách + tóm tắt). Đang tính dự kiến: ba ô hiện «…», nút Giao vẫn bấm được (số chỉ để xem).
- Chưa tick bài: nút ghi «Chọn bài để giao», bị khoá. Tick nhiều bài: «Giao 2 bài cho 12 Thường», tóm tắt cộng gộp.
- Đang giao: nút «Đang giao…» khoá; mạng lỗi ⇒ dòng đỏ «Chưa chắc đã giao — xem dòng bài trong danh sách rồi hãy bấm lại» (không tự bấm lại).
- Có ca thi đang mở: vẫn bấm Giao được; bài được ghi, còn gói của các em chỉ tạo khi không có ca mở (`goi-bai-7.ts`, điều kiện `NOT EXISTS ca mở`) và máy chủ đồng bộ gói MỖI PHÚT (`index.ts`, cron `* * * * *` gọi `dongBoGoi7`) ⇒ báo «Đang có ca thi — các em nhận bài ngay khi ca đóng».
- Không còn bài chưa giao trong khối: dòng «Đã giao hết bài của khối 12».

## 3b. HẠN CHUNG CẢ LỚP (thầy 09/11: «hạn chung cho học sinh vì học sinh đang phải học cùng nhau trên lớp»)
- **Hạn chung T = số ngày ít nhất mà máy dự kiến ≥ 90 % em của lớp làm xong hết** (hết câu mới + sửa sạch lỗi của bài + ít nhất 1 ngày Ôn). Dự kiến từng em = M + 1 + số ngày Sửa dự báo theo năng lực từng ô của em (+ lỗi đang mang sang); máy hiệu chỉnh bằng kết quả thật mỗi tháng.
- **Cá nhân hoá nằm TRONG cùng hạn:** mọi em M ngày Mới như nhau (cả lớp xong câu mới cùng ngày) → 1 ngày Ôn → Sửa đến sạch → còn ngày thì Ôn thêm. Em giỏi: nhiều ngày Ôn; em yếu: nhiều ngày Sửa. Chỉ Ôn thêm khi đã sạch lỗi (Ôn khi còn lỗi sinh thêm lỗi).
- Giả lập lớp 53 em, bài 112 câu (`docs/de-xuat-28-cau-mo-phong/han-chung.py`, giả định):
  - Luật «≥ 90 % em xong» với công thức dự báo CHƯA hiệu chỉnh cho **12–13 ngày** (52–53/53 em xong) — công thức đang tính dư khoảng 2 ngày, nghiêng về an toàn.
  - Thực tế giả lập: hạn **10 ngày** đã đủ cho 49–53/53 em (92–100 %) ⇒ khi máy hiệu chỉnh dự báo bằng kết quả thật (`su_kien_hoc`), hạn sẽ rút về khoảng 10 ngày. **Phải hiệu chỉnh trước khi bật**; chưa đủ dữ liệu thì dùng hạn an toàn.
  - Trong hạn 10 ngày: em giỏi được ~2 ngày Ôn, em yếu ~5 ngày Sửa. Hạn dài hơn chỉ thêm ngày Ôn cho em giỏi.
  - Lỗi mang sang không tăng dần: trung bình ~11 nhóm/em sau bài 3, 6 và 10 (hạn 10 ngày).
- Em chưa xong khi hết hạn (≤ 10 %): lỗi còn lại sang khung bài sau, sửa trước; báo thầy thẻ «Hết hạn · chưa xong».
- **Thầy giao bài kế sớm hơn hạn:** khung bài trước **đóng ngay ngày bài mới bắt đầu**; lỗi dở là lỗi mang sang (sửa trước ở khung mới), KHÔNG tính «Hết hạn» — thẻ «Hết hạn · chưa xong» chỉ xét khung đóng đúng hạn. Bài mới bắt đầu ngay nếu lớp đã xong câu mới bài trước; chưa xong thì bắt đầu sau ngày đó (cả lớp có cùng số ngày Mới nên xong cùng ngày). Hộp ghi rõ: «Bài 9 còn 6 ngày Ôn/Sửa — giao bây giờ thì phần đó chuyển sang khung Bài 10 · bắt đầu 13/11».
- **Em bỏ ngày, còn câu mới chưa làm khi hết hạn:** câu mới còn nợ làm ĐẦU khung kế, trước câu mới của bài mới (không em nào bỏ câu mới); em này có trong thẻ «Hết hạn · chưa xong».
- **Chọn nhiều lớp một lúc:** mỗi lớp một hạn chung riêng (năng lực khác nhau); ô «Hạn chung» hiện theo từng lớp.

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
