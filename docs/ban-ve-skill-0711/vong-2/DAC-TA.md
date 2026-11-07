# Thiết kế bằng 5 skill — VÒNG 2 (07/11 khuya, chờ thầy duyệt, CHƯA build)

Thầy hỏi: «có tăng chỉ số lên cao hơn nữa không».

Vòng 2 lấp từng khoảng hở mà vòng 1 ghi ở mục «Vì sao chưa 10». Ảnh được vẽ:
- trên bản build mới nhất của main (`dist-v5`): phẳng, khung trong suốt viền 2px bo 16, nền tối #131f24, phông ĐĐH Rounded v5;
- với lớp `proto-skill-v2.css` (gồm vòng 1 + vòng 2) đè lên, không đè lại các quyết định thầy đã chốt.

Màn Lời giải được chụp bằng component thật (`scripts/loi-giai-kinh/xem-truoc`, bản Kính mẫu câu 3 Phần III) cùng CSS app.

## 1. Bảng điểm `plan-design-review` (0–10)

| Mặt | Vòng 1 | Vòng 2 | Bằng chứng | Vì sao chưa 10 |
|---|---|---|---|---|
| 1. Kiến trúc thông tin | 8 | **9** | `04`: Lời giải đưa KẾT LUẬN lên đầu (ĐÁP ÁN 13,2 to, câu em trả lời gạch nhỏ), có hàng mục lục dính Cốt lõi · Từng bước · Phương trình · Bẫy · Tự kiểm. `05`: 4 ô số gộp một khung. | Mục lục mới vẽ, chưa có hành vi cuộn tới / tự sáng theo mục đang xem |
| 2. Trạng thái tương tác | 8 | **9** | `02`: trống (chưa có việc), đang chấm (nút có vòng quay, dùng `button[data-cho]` có sẵn), mất mạng (dải báo + «Thử lại»), tiêu điểm bàn phím | Chưa vẽ khung xương khi tải chậm và lỗi máy chủ lúc nộp |
| 3. Hành trình cảm xúc | 7 | **9** | `03`: MỘT khoảnh khắc mừng khi đúng, 3 khung 0 / 160 / 400 ms (✓ nảy 0,6 → 1,12 → 1 + vệt sáng lướt dải). Màn trống nói thân thiện kèm việc làm được | Chưa có rung / âm (tuỳ thầy) |
| 4. Nguy cơ «na ná AI» | 6 | **8** | `01`: bỏ chuỗi «A · B» ở dòng ngày (lớp thành chip) và ở nút chính (BẮT ĐẦU nhãn trên, «Chặng 3» tiêu đề, «còn 6 câu» chip); `04` câu kết quả. Dấu ấn Hoá: chặng xong là huy hiệu LỤC GIÁC (vòng benzen) | Còn «·» ở «Buổi học mẫu · 12A0», chip công thức lời giải; nút IN HOA (thầy chốt theo Duolingo) |
| 5. Khớp hệ thiết kế | 8 | **9** | `05`: 4 ô số tấm Thêm thành một khung viền 2px bo 16 ngăn vạch; `04`: thẻ Lời giải theo chuẩn khung mới (trong suốt + viền 2px) | Chưa soát Thành tích, Kiểm tra, màn thi theo chuẩn khung mới |
| 6. Đáp ứng khổ + trợ năng | 8 | **9** | `06`: chữ phóng 130% thì «/40 câu» tự xuống dòng (vòng 1 bị ống nghiệm đè), khổ 320 không tràn ngang (đo `scrollWidth = clientWidth`); `02`: vòng tiêu điểm rõ | Chưa thử với trình đọc màn hình thật (TalkBack / VoiceOver) |
| 7. Quyết định bỏ ngỏ | 7 | **9** | Mục 7 chốt đề xuất từng câu; còn 3 câu cần thầy | — |
| **Trung bình** | **7,4** | **8,9** | | |

Trước vòng 1 điểm trung bình là 6,0.

## 2. Thay đổi (theo skill)

- **plan-design-review · ui-ux-pro-max** (phân cấp, «progress / empty / error states»):
  - lời giải kết luận trước + mục lục dính;
  - ba trạng thái trống / đang chấm / mất mạng;
  - tấm Thêm gộp ô số.
- **emil-design-eng · apple-design · animation-performance**:
  - khoảnh khắc mừng ≤ 400 ms, chỉ dùng `transform` / `opacity`, ease-out mạnh, lò xo nảy vừa;
  - vòng quay «đang chấm» chỉ `transform`;
  - tắt cả hai ở `html.may-yeu` và `prefers-reduced-motion`.
- **frontend-design** («ground in the subject»): huy hiệu lục giác cho chặng xong; bỏ chuỗi «A · B» kiểu trang máy làm.
- **Trợ năng**: hàng chip tự xuống dòng; nút chính và chữ tiêu đề không cắt; «12 /40 câu» được xuống dòng.

## 3. Chỗ cần sửa mã khi build

| Việc | Tệp | Ghi chú |
|---|---|---|
| Đang chấm | CSS | Dùng `.duo-nut[data-cho]` sẵn có |
| Khoảnh khắc mừng | CSS | `.duo-ket[data-tt=dung] .duo-tick` + `::after` của dải |
| Lục giác chặng xong | CSS | `.kb-dong[data-tt='xong'] .kb-tich` (clip-path) |
| Tấm Thêm gộp ô số, thẻ Lời giải theo chuẩn khung | CSS | |
| Chữ 130% (`.kb-so` xuống dòng) | CSS | |
| Tách «A · B» dòng ngày + nút chính | `src/components/hoc-tap/TrongHs.tsx` | Dòng ngày ở `.kb-dau-giua > p`; nút `.kb-cta` (`tenDong`, dòng phụ) |
| Kết luận đầu lời giải + mục lục dính | `src/components/loi-giai-kinh/LoiGiaiKinhHs.tsx` / `LoiGiaiKinh.tsx` | Thẻ `.lgk-kq`; mục lục nhảy tới `.lgk-the`, sáng theo mục đang xem bằng IntersectionObserver |
| Màn trống Việc hôm nay | `TrongHs.tsx` | Khi không có chặng |
| Dải mất mạng | Lớp gửi lại hiện có | Hiện khi hàng đợi chưa gửi được |

Lưu ý khi build:
- không viết bộ chọn `:has(...)` kết thúc bằng `*` (`tests/muot-has-2710`);
- không thêm bóng mờ lớn hay `filter`;
- các luật «chỉ để vẽ» (`.ve-luot-tinh`, `.ve-*` chèn bằng JS) KHÔNG đưa vào app.

## 4. Ảnh

| Tệp | Nội dung |
|---|---|
| `01-hom-nay.jpg` | HIỆN TẠI + vòng 1 / vòng 2 · tối, sáng (tách «A · B», lục giác) |
| `02-trang-thai.jpg` | Trống · đang chấm · mất mạng · tiêu điểm |
| `03-mung-dung.jpg` | Khoảnh khắc mừng 0 / 160 / 400 ms (tối) + 160 ms (sáng) |
| `04-loi-giai.jpg` | Lời giải HIỆN TẠI + vòng 1 / vòng 2 · tối, sáng |
| `05-them.jpg` | Tấm Thêm |
| `06-tro-nang.jpg` | Chữ 130% trước / sau, làm câu 130%, khổ 320 |
| `07-loi-giai-may-tinh.jpg` | Lời giải vòng 2 trên máy tính 1280 |

## 5–6. Máy yếu / tốc độ

Hoạt ảnh chỉ dùng `transform` / `opacity` (lớp ghép), tắt ở máy yếu. Không thêm tệp tải; CSS thêm khoảng 3 KB vào mảnh TrongHs.

## 7. Quyết định — em đề xuất / cần thầy chọn

1. **Bong bóng giám thị đè «Chọn đáp án đúng» vài giây** (từ vòng 1). Em đề xuất giữ, vì nó chỉ đè nhãn và tự tắt. **Thầy chọn.**
2. **Huy hiệu lục giác cho chặng xong.** Em đề xuất giữ, vì đó là dấu ấn Hoá. **Thầy chọn** giữ lục giác hay vòng tròn.
3. **Rung nhẹ 15 ms khi đúng**, chỉ máy có rung, tắt ở máy yếu. **Thầy chọn.**
4. **Mục lục dính trong Lời giải** (thêm một hàng cao khoảng 52px). Em đề xuất giữ.
5. **Nhãn «Tổng câu hôm nay» chữ thường** (vòng 1). Đã chốt theo vòng 1.
