# Thiết kế app học sinh bằng 5 skill (thầy 07/11 — vẽ trước khi build)

Thầy: «cài 5 skill này vào và dùng nó để thiết kế app, vẽ cho tôi trước khi build». Các skill đã cài ở `.claude/skills/`. Đây là bản vẽ trên bản build thật (dist 5f29173), dùng `proto-skill.css` đè lên `phang-hs.css`. Chưa sửa `src/`.

## 1. Mục tiêu
Tinh chỉnh app đã chốt (nền xanh than, phẳng kiểu Apple, nút Duolingo, giãn dòng 1,6) theo năm bộ quy tắc thiết kế. Mục tiêu là phân cấp rõ hơn, lỗi nói đúng giọng, nút có phản hồi khi nhấn, trợ năng đủ. Không đổi màu, không đổi phông, không làm chậm.

## 2. Người dùng, màn
Học sinh lớp 10–12, chủ yếu dùng điện thoại, cả máy yếu. Các màn: Hôm nay, làm câu (chưa chọn / đã chọn), dải kết quả đúng / sai, Lời giải, tấm Thêm, máy tính 1280, Fold 884×1104.

## 3. Bảng điểm `plan-design-review` (0–10, chấm trên ảnh chụp thật)

| Mặt | Trước | Sau | Vì sao chưa 10 |
|---|---|---|---|
| 1. Kiến trúc thông tin | 6 | 8 | Lời giải còn là tấm thấp, ít nội dung |
| 2. Trạng thái tương tác | 6 | 8 | Chưa có trạng thái «đang chấm» riêng |
| 3. Hành trình cảm xúc | 5 | 7 | Thưởng đúng có thể thêm một khoảnh khắc mừng duy nhất |
| 4. Nguy cơ «na ná AI» | 5 | 6 | Chuỗi «A · B» trong chữ (mã TSX); nút IN HOA do thầy chốt theo Duolingo |
| 5. Khớp hệ thiết kế | 7 | 8 | Tấm Thêm vẫn khác kiểu thẻ còn lại |
| 6. Đáp ứng khổ + trợ năng | 7 | 8 | Chưa đo chế độ chữ to của hệ điều hành |
| 7. Quyết định bỏ ngỏ | 6 | 7 | Xem mục 7 |
| **Trung bình** | **6,0** | **7,4** | |

## 4. Quyết định theo từng skill
- **ui-ux-pro-max** (`search.py … --design-system`):
  - Gợi ý chàm chính + cam nhấn, khớp bảng màu app nên giữ nguyên.
  - Gợi ý kiểu «claymorphism, tránh tối»: KHÔNG theo, vì thầy đã chốt phẳng + tối.
  - Gợi ý phông Be Vietnam Pro / Baloo: KHÔNG đổi, vì giữ phông DDH Rounded (tốc độ tải + nhận diện).
  - LẤY checklist: tiêu điểm bàn phím rõ, khe chạm ≥ 8px (đặt 10px), giảm chuyển động, ô chạm ≥ 44px.
- **frontend-design** (Anthropic):
  - Bỏ nhãn IN HOA giãn chữ «TỔNG CÂU HÔM NAY», đổi thành chữ thường câu (dấu hiệu trang máy làm).
  - «Lỗi là lúc chỉ đường, không phải tâm trạng»: dải SAI giữ «Chưa đúng» màu hồng, còn đáp án đúng thành chữ thường 17px màu chữ chính (trước: 20px hồng đậm 4 dòng).
- **emil-design-eng**:
  - Nút co 0,97 khi nhấn, ô đáp án / hàng việc co 0,985.
  - Chỉ chuyển `transform`, 160ms, `cubic-bezier(.23,1,.32,1)`, không `transition: all`.
- **animation-performance**: chỉ thuộc tính composite (transform), không blur, không `will-change`. Tắt hẳn ở `html.may-yeu` và `prefers-reduced-motion`.
- **apple-design §15**: giãn chữ theo cỡ (tiêu đề −0,012em, chữ thường 0). Phân cấp bằng độ đậm + cỡ: lệnh câu 22px / 750.
- **plan-design-review**:
  - Pass 1: bỏ khoảng trống ~64px giữa lệnh và đề. Hàng chờ lời giám thị luôn giữ chỗ, nay còn 8px. Bong bóng vẫn nổi đè lên nhãn khi giám thị nói (luật 02/11). Kết quả: đề + 3 phương án vào màn đầu ở 360px.
  - Pass 7: thử kéo tấm Lời giải cao 70% nhưng bỏ, vì lời giải ngắn để lại khoảng trống lớn.
- **app-store-screenshots**: skill dành cho ảnh giới thiệu app trên App Store / Google Play, không dùng cho giao diện, nên không dùng ở bản vẽ này.

## 5. Ảnh

| Tệp | Nội dung |
|---|---|
| `01-hom-nay.jpg` | TRƯỚC / SAU, tối + sáng |
| `02-lam-cau.jpg` | chưa chọn (tối) + đã chọn (sáng) |
| `03-ket-qua.jpg` | sai (tối) + đúng (sáng) |
| `04-loi-giai.jpg` | tối + sáng |
| `05-them.jpg` | tối + sáng |
| `06-may-tinh.jpg` | 1280: Hôm nay + làm câu |
| `07-fold.jpg` | 884×1104 |

## 6. Tốc độ
- Không thêm tệp hay ảnh.
- Chuyển động chỉ dùng `transform`: không bố cục lại, không vẽ lại. Máy yếu tắt hẳn.
- CSS thêm khoảng 2 KB vào mảnh TrongHs, không tính vào đường mở.

## 7. Còn bỏ ngỏ (cần thầy chọn)
1. Khi build: luật `.duo-gt-loi-o:not(:has(> .gt-loi))` cần viết lại cho qua `tests/muot-has-2710`, ví dụ bằng thuộc tính `data-` từ TSX.
2. Bong bóng giám thị nổi đè lên dòng «Chọn đáp án đúng» vài giây. Có chấp nhận không?
3. Chuỗi «Thứ Tư 30/09 · 12A0», «Ester – Lipid · còn 6 câu» nằm trong chữ ở mã TSX. Có đổi thành hai dòng không?
4. Có thêm một khoảnh khắc mừng duy nhất khi đủ mức hôm nay không (frontend-design: «một khoảnh khắc chuyển động duy nhất»)?
