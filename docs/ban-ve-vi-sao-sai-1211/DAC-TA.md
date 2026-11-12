# «Vì sao em sai?» dừng hẳn — đặc tả 7 mục (12/11) — CHỜ THẦY DUYỆT ẢNH, CHƯA BUILD

Thầy 12/11: «Cái chọn ý nó bị thoát nhanh quá chưa kịp nhìn, cho dừng hẳn lại để học sinh chọn rồi bấm tiếp (sai do chưa biết làm …), làm tinh tế cho hiển thị
đẹp và gọn hơn ở màn dọc, vẽ tôi xem trước khi build».

Ảnh (Chromium thật, `node docs/ban-ve-vi-sao-sai-1211/chup.mjs`): `dt-sang-0-hien-tai` (bản đang chạy, để so) · `dt-sang-1-chua-chon` · `dt-sang-2-ai-doan` ·
`dt-sang-3-da-chon` · `dt-toi-1/3` · `dt-nho-sang-1` (360×640) · `mb-sang-3` (máy tính bảng) · `mt-sang-1`, `mt-toi-3` (máy tính).

## 1. Mục tiêu sư phạm + ai dùng
Học sinh, câu luyện tập ở Lộ trình vừa làm SAI. Em phải DỪNG LẠI, nhìn đáp án đúng, tự gọi tên lỗi của mình (Tính / đọc đề sai · Chưa biết cách · Hiểu nhầm)
rồi mới đi tiếp — lý do em chọn quyết định cách sửa (số lượt đúng cần có, «Xem ví dụ mẫu» cho nhóm Chưa biết cách…).

Vì sao đang «thoát nhanh» (đọc mã `src/components/hoc-tap/KetSaiDuo.tsx`, `vi-sao-sai.ts`):
- A.I đoán «Hiểu nhầm» ⇒ máy TỰ CHỌN SẴN ⇒ không còn chờ ⇒ «Tiếp tục» sáng ngay; nút «Tiếp tục» nằm đúng chỗ nút «Kiểm tra» ⇒ em chạm hai lần là lướt qua.
- Chốt an toàn đo ô lý do ngay khung hình đầu (dải đang trượt lên) ⇒ có lúc tưởng ô quá nhỏ ⇒ bỏ chờ.

## 2. Bố cục
- Điện thoại dọc (chính): dải «Chưa đúng» → đáp án đúng + một dòng lời giải ngắn + «Lời giải từng bước» → thẻ «Vì sao em sai?» (góc phải: «Chọn 1 ý» / «✓ Đã ghi»)
  → BA HÀNG chọn một (vòng tròn + tên lý do + một dòng giải thích), mỗi hàng cao ≥ 48 px → nút chính rộng hết dải.
- Thay ba ô ngang hiện tại (chữ «Tính / đọc đề sai» bị bẻ hai dòng, khó đọc) bằng ba hàng dọc gọn, chữ một dòng.
- Máy tính bảng / máy tính: ba hàng thành ba cột cạnh nhau. Điện thoại xoay ngang: giữ dạng gọn một hàng ba ô như hiện tại (đã có, không đổi).

## 3. Trạng thái
- Vừa hiện, chưa chọn: nút xám «Chọn một ý để tiếp tục» (tắt). KHÔNG chọn sẵn.
- A.I đoán: nhãn nhỏ «A.I đoán» cạnh «Hiểu nhầm» — chỉ là gợi ý, em vẫn phải chạm.
- Đã chọn: hàng tô viền đỏ + chấm tròn; góc thẻ «✓ Đã ghi»; nút đổi thành «Tiếp tục» (màu nút sai như cũ). Chạm hàng khác ⇒ đổi ý, giữ lần cuối.
- Câu làm lại (song sinh cuối chặng): không hỏi lý do (như cũ).
- Tối: dùng đúng biến màu tối đã có.

## 4. Dữ liệu
Không đổi: lý do vẫn xếp hàng trên máy (localStorage) và đi kèm lệnh nộp câu kế (`ly`), máy chủ ghi như cũ. 0 lệnh mới, 0 bảng mới.

## 5. Ngoại lệ
- Chạm đúp từ «Kiểm tra»: nút chính bỏ qua mọi chạm trong 600 ms đầu sau khi dải hiện (chống lướt).
- Chốt an toàn (bố cục lạ không chạm được ô lý do): chỉ đo SAU khi dải trượt xong (sự kiện kết thúc chuyển động, dự phòng 800 ms), không đo khung đầu.
- Phím Enter / bàn phím: Enter chỉ đi khi đã chọn; phím 1/2/3 chọn nhanh trên máy tính.
- Mất mạng / tắt app: lý do đã chạm vẫn trong hàng chờ, gửi ở lần nộp sau (như cũ).
- Máy yếu: không thêm chuyển động; tô hàng bằng màu, không đổ bóng.

## 6. Chi phí máy chủ
Không đổi (0 lệnh D1 thêm, 0 byte đường mở app — mã nằm trong mảnh màn làm bài đã có).

## 7. Nghiệm thu đo bằng máy
- Test: dải sai ⇒ «Tiếp tục» tắt tới khi chạm lý do, kể cả khi A.I đoán; chạm trong 600 ms đầu bị bỏ; chốt an toàn không kích hoạt khi dải đang trượt.
- Ảnh Chromium 390×844 / 360×640 / 820×1180 / 1366×900, sáng + tối: không tràn ngang, đích chạm ≥ 44 px.
- Cổng: vitest, build:cf, kiem:toc-do (byte tải không tăng), kiem:mau-giu (0 màu mới), co-tep; tác tử toc-do sau gộp.
