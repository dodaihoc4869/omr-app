# Bản vẽ «HÔM NAY CHỈ MỘT NÚT» + tự vào chặng kế (thầy 10/11) — CHỜ THẦY DUYỆT, CHƯA BUILD

Thầy 10/11 (2 ảnh Hôm nay): «ẩn hết những phần ở dưới, chỉ để lại một nút bấm vào làm luôn cho học sinh đỡ rối, áp dụng xoay ngang dọc, máy tính, fold» · «giữ
lại nút này nhé, làm xong tự chuyển để học sinh làm tiếp» · «vẽ cho tôi trước khi build nhé».

Ảnh (Chromium thật, app thật + lớp mẫu `proto-mot-nut.css`, dữ liệu giả ngày Sửa lỗi; chụp lại: `node docs/ban-ve-mot-nut-1011/chup.mjs <bản dựng chup-v2> docs/ban-ve-mot-nut-1011`):

| Ảnh | Nội dung |
|---|---|
| `1-hom-nay-dt-sang` · `1-hom-nay-dt-toi` | Điện thoại dọc: đếm ngược (lớp 12) → chào → thẻ mức → MỘT nút «Bắt đầu sửa lỗi · Sửa nhóm 1». Không còn gì bên dưới. |
| `2-hom-nay-ngang` · `3-hom-nay-gap` · `4-hom-nay-may-tinh-sang/toi` | Xoay ngang, màn gập, máy tính: cùng một cột giữa ≤ 640 px (bỏ cột phải). |
| `5-ket-chang-dt` · `5-ket-chang-may-tinh` | Xong chặng: nút chính «Làm tiếp: Sửa nhóm 2», dòng «Tự vào sau 3 giây · chạm màn để ở lại», nút «Về Hôm nay». |
| `6-xong-het-dt` | Xong hết hôm nay: thẻ chúc mừng + Rương sáng (mở rương) + «Học thêm câu mới». |

## 1. Mục tiêu + ai dùng
Học sinh mở app thấy đúng MỘT việc phải làm, bấm là vào làm; làm xong một chặng thì app tự đưa sang chặng kế, không phải quay ra chọn. Bớt rối, ít bấm.

## 2. Bố cục (mọi khổ: dọc, ngang, màn gập, máy tính)
- Giữ: đếm ngược ngày thi (lớp 12) · hàng chào + chuông · thẻ mức hôm nay (số câu, bình, Mol) · nút chính (giữ nguyên như ảnh thầy: nhãn việc, tên nhóm / bài, «còn N câu»).
- Ẩn khỏi Hôm nay: dải «Còn của Bài … chưa gặp», «Nhóm lỗi hôm nay», «Việc hôm nay», «Lịch bài», thẻ Bạn bè, Rương khi chưa sáng. Thứ tự việc vẫn do máy chủ xếp
  (bài nợ cũ trước, nhóm 1 trước…) ⇒ nút chính luôn chỉ đúng việc kế; nút ghi rõ tên bài / nhóm.
- Máy tính / màn gập / ngang: một cột giữa ≤ 640 px, thẳng hàng với thẻ đếm ngược (không còn cột phải vì không còn thẻ phụ).

## 3. Trạng thái
- Đang tải, mất mạng, lỗi: như hiện tại (khung giữ chỗ, dòng báo, «Thử lại»).
- Ca kiểm tra đang mở ⇒ nút «Vào ca kiểm tra» (như hiện tại). Ngày Kiểm tra ôn tập ⇒ nút «Kiểm tra ôn tập».
- Xong hết ⇒ thẻ chúc mừng + Rương sáng để mở + «Học thêm câu mới» (ảnh 6).
- XONG CHẶNG (màn kết chặng, ảnh 5): còn việc kế ⇒ nút «Làm tiếp: <việc kế>»; đếm 3 giây (bắt đầu SAU khi hiệu ứng thưởng chạy xong) rồi tự vào; chạm màn
  hoặc «Về Hôm nay» ⇒ dừng đếm. Việc kế là Kiểm tra ôn tập / ca kiểm tra ⇒ KHÔNG tự vào (em tự bấm). Hết việc ⇒ «Về Hôm nay» như cũ, không đếm.

## 4. Dữ liệu
Không thêm trường máy chủ. Việc kế = nút đang làm đầu tiên của danh sách việc hôm nay (Lộ trình đã có, `TrongHs` → `nut`) sau khi Lộ trình tải lại số mới;
tự vào = gọi đúng hành động của nút chính (như em bấm).

## 5. Ngoại lệ
Đổi tab / ẩn app trong lúc đếm ⇒ dừng đếm, về Hôm nay. Mất mạng lúc tự vào ⇒ ở lại Hôm nay với nút chính. Bấm lặp ⇒ khoá sau lần đầu. Chặng kế bị khoá
(chờ sửa lỗi xong, chờ thầy bổ sung) ⇒ không tự vào. Máy yếu: không thêm hiệu ứng mới.

## 6. Chi phí máy chủ
0 lệnh D1 thêm (tự vào = đúng lệnh mở chặng như bấm tay). Byte mở app: không tăng (ẩn bớt thẻ; mảnh lười Nhóm lỗi / Lịch bài thôi nạp ở Hôm nay).

## 7. Nghiệm thu đo bằng máy
- Test mới `tests/mot-nut-hom-nay-1011.test.tsx`: Hôm nay chỉ một nút chính; các thẻ ẩn không có trong trang; xong hết hiện Rương sáng + «Học thêm câu mới».
- Test mới `tests/tu-vao-chang-ke-1011.test.tsx`: kết chặng còn việc ⇒ nút «Làm tiếp: …»; hết 3 giây gọi đúng hành động việc kế; chạm màn / đổi tab dừng; việc cuối,
  Kiểm tra ôn tập, ca kiểm tra không tự vào.
- `npm run kiem:toc-do` 0 đỏ, `npm run kiem:mau-giu` 0; ảnh Chromium 0 lỗi trang, 0 tràn ngang.

## Cần thầy chốt
1. Tự vào sau **3 giây** (đề xuất) — hay chỉ đổi nút thành «Làm tiếp» để em tự bấm?
2. Ẩn hẳn «Nhóm lỗi hôm nay» và «Lịch bài» khỏi Hôm nay (đề xuất, đúng lời thầy) — hay để chúng trong tấm «Thêm» cho em nào muốn xem?
