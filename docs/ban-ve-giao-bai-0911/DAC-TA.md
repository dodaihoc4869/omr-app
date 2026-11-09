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
  3. **Tóm tắt** (máy tự tính): Câu mới (số câu · số ngày · 28 câu/ngày) · Đề chuẩn x/28 · Lớp dự kiến xong (khoảng ngày + mốc ngày). Dòng «Hạn riêng từng em máy tự đặt khi em bắt đầu bài». Nút **«Giao Bài 9 cho 12 Thường»**. Liên kết nhỏ «Không giao cho vài em…» (mở danh sách em để bỏ tick — giữ chức năng thầy cần 05/10, mặc định ẩn).
- **Thiếu câu chuẩn** (`*-2-thieu`): ô Đề chuẩn chuyển vàng «24/28 · thiếu câu Đúng/Sai», dòng giải thích + «Bổ sung câu Đúng/Sai ›». Vẫn giao được.
- **Đã giao** (`*-3-xong`): dấu ✓, «Đã giao Bài 9 cho 12 Thường · 53 em», một câu máy sẽ làm gì; [Giao thêm bài] [Xong].

### 2b. Thẻ mới ở Việc cần thầy (không có việc thì không hiện)
| Thẻ | Khi nào | Nút |
|---|---|---|
| Quá hạn bài (đỏ) | em qua hạn riêng mà chưa xong chu kỳ bài | Xem em |
| Nên chữa chung (vàng) | từ 30 % em của lớp cùng một nhóm lỗi | Gọi lên bảng (mở sẵn dạng đó) |
| Cần thầy chữa (vàng, đã có) | thêm nguồn: nhóm lỗi sai 3 lần | Mở |
| Bài thiếu câu chuẩn (xám) | bài đang giao có đề chuẩn < 26/28 | Xem ô thiếu |
- Em bỏ làm KHÔNG thành thẻ (thầy đã bỏ thẻ «N em chưa làm» 12/10 vì Nhịp học đã nói) ⇒ hiện ở Nhịp học.
- «Lớp chưa xong bài trước» KHÔNG thành thẻ (với nhịp chọn bài 7 ngày sẽ hiện gần như mọi lần) ⇒ đã có ở ô «Lớp dự kiến xong» trong hộp.

## 3. Trạng thái
- Đang tải: khung xương đúng hình (danh sách + tóm tắt). Đang tính dự kiến: ba ô hiện «…», nút Giao vẫn bấm được (số chỉ để xem).
- Chưa tick bài: nút ghi «Chọn bài để giao», bị khoá. Tick nhiều bài: «Giao 2 bài cho 12 Thường», tóm tắt cộng gộp.
- Đang giao: nút «Đang giao…» khoá; mạng lỗi ⇒ dòng đỏ «Chưa chắc đã giao — xem dòng bài trong danh sách rồi hãy bấm lại» (không tự bấm lại).
- Có ca thi đang mở: vẫn giao được (máy chủ đã chặn ghi lịch khi ca mở như hiện nay ⇒ báo «Đang có ca thi — bài sẽ giao khi ca đóng»).
- Không còn bài chưa giao trong khối: dòng «Đã giao hết bài của khối 12».

## 4. Dữ liệu
- Đã có: cây bài theo khối (`bai-hom-nay.ts`), `/gv/bai-da-day danh-sach | xem-truoc | tick | bo-tick`, danh sách em (`useDsEmGiao`), gói 7 (`goi-bai-7*.ts`).
- Thay đổi máy chủ (theo v5): `xem-truoc` trả thêm M (⌈N/28⌉), độ chuẩn đề, dự kiến xong (min–max theo dự báo từng em); `tick` không nhận hạn / lượt nữa — hạn riêng từng em đặt KHI EM BẮT ĐẦU bài (bài xếp hàng sau bài cũ chưa có hạn ⇒ không báo quá hạn dây chuyền). Bảng chỉ-thêm: hạn riêng từng em × bài.
- Đề 28 câu mỗi ngày dựng khi em mở app lần đầu trong ngày (như `goi_bai_7_ngay`); việc chạy đêm chỉ gom số cho thẻ cảnh báo và dự kiến.

## 5. Ngoại lệ
- Bấm Giao hai lần: nút khoá ngay; máy chủ `tick` vốn bỏ qua lớp đã có bài.
- Tên bài dài: xuống dòng, không cắt chữ; số bài và ô tick cố định.
- Lớp khác khối được tick: bỏ chọn bài, báo «Bài theo khối — đã bỏ chọn».
- Máy yếu (`ddh.mayYeu`): không bóng đổ, không chuyển động mở hộp.
- Đổi tab giữa chừng: giữ bài đang tick (như `chonNho` hiện có).

## 6. Bỏ đi (thầy: «bỏ hết màn phân bài bên trong»)
- Hành trình › bước Dạy học: phần chọn bài «Bài hôm nay» (`BuocBaiHomNay` trong `DayHocLenBang.tsx`) — phần dạy trên bảng giữ nguyên.
- Hộp «Bổ sung bài hôm nay» cũ (`HopBoSungBai` + `BoSungNhieuBai`) — thay bằng hộp Giao bài; lối cũ `boSungBai` mở hộp mới.
- Bảng «Bài đang giao» (`TheBaiDaDay` / `BangBaiDangGiao`) — gộp vào hộp (dòng bài đang giao + ⋯ Gỡ bài; Thêm/Bớt em ở «Không giao cho vài em…»).
- «Giao bài tập về nhà», «Giao đề theo tuần» không có trong thanh bên hiện tại (chế độ Game Hoá 2) ⇒ không đụng.
- Mã cũ gỡ khỏi mọi lối vào ngay; xoá hẳn sau một tuần chạy ổn (dễ lùi).

## 7. Nghiệm thu đo bằng máy
- Test: hộp chỉ có lớp + bài + tóm tắt + nút (không ô hạn, không lượt); bài kế tiếp tick sẵn; nhiều bài cộng gộp đúng; ⋯ Gỡ bài gọi `bo-tick` sau khi hỏi lại.
- Không còn lối nào tới các màn ở mục 6 (test điều hướng).
- Ảnh Chromium 3 khổ × sáng/tối: 0 tràn ngang, 0 nút < 44 px (đã đạt ở bản vẽ: `chup.mjs`).
- `npm run kiem:toc-do` 0 đỏ: hộp tải lười như hộp cũ; bỏ bảng Dạy học chọn bài phải làm nhẹ gói Hành trình. Tác tử toc-do đo trước/sau.
- Dữ liệu trong ảnh là dữ liệu mẫu (lớp, số em, số câu, ngày dự kiến), không phải số thật.

Chụp lại ảnh: `node docs/ban-ve-giao-bai-0911/chup.mjs <thư mục chứa be-vietnam-pro-*.woff2>`.
