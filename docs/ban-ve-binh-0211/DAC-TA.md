# Bình «Hôm nay» sinh động — đặc tả (bản vẽ 02/11, chờ thầy duyệt)

Lời thầy: «Cái bình này màu hồng tôi muốn nó vector sinh động, nghiêng máy thì chất lỏng bên trong nghiêng theo, khi đổi màu thì tỏa sáng hồng tinh tế đẹp mắt, tải sẵn hiệu ứng cho mọi máy nhé, vẽ vector trc cho tôi xem rồi build».

1. **Mục tiêu:** bình nón trên thẻ Hôm nay (app HS, giao diện Kính) sống động, đúng vật lí, nhẹ.
2. **Hình:** SVG thuần; thuỷ tinh có ánh phản chiếu, vạch chia, vạch mức (nét đứt hồng = «điểm tương đương»), mặt dung dịch gợn sóng nhẹ, 7 bọt khí nổi.
3. **Nghiêng máy:** đọc `deviceorientation` (gamma). Mặt dung dịch luôn nằm ngang theo trọng lực: máy nghiêng góc g ⇒ khối dung dịch xoay −g (giới hạn ±35°), lò xo tắt dần nên có sóng sánh. Chỉ đổi `transform` của 1 nhóm SVG, gộp vào 1 khung rAF; không có cảm biến (máy tính) ⇒ đứng yên, gợn sóng nhẹ.
   - iPhone phải bấm cho phép cảm biến: xin quyền ở lần chạm đầu vào thẻ, không bật hộp thoại tự động.
4. **Đổi màu (đủ câu) — HÀO QUANG (thầy 02/11: «Tỏa nhẹ nhàng như hào quang tinh tế vào»):** chàm → hồng; một quầng hồng mềm sau bình + một vành sáng mảnh nở chậm từ trong ra (2,2 giây, chậm dần), rồi «thở» rất nhẹ; 3 sao 4 cánh nhỏ lấp lánh. Bỏ tia và vệt quét. Mỗi ngày diễn 1 lần (nhớ trong máy).
5. **Tải sẵn mọi máy:** hiệu ứng là SVG + CSS nằm sẵn trong gói app (không ảnh, không tải thêm); thêm < 3 KB nén.
6. **Nhẹ:** cảm biến lắng nghe chỉ khi thẻ đang hiện (IntersectionObserver) và tab đang mở; máy yếu (`ddh.mayYeu`) / «giảm chuyển động» ⇒ không gợn sóng, không bọt chạy, nghiêng vẫn có nhưng không sóng sánh; quầng đổi màu chỉ mờ dần.
7. **Nghiệm thu:** `npm run kiem:toc-do` 0 đỏ, `kiem:mau-giu` 0, `check:mau` 0; test nghiêng/đổi màu; tác tử `toc-do` đo trước/sau.

Ảnh: `bang-binh.jpg` (hàng 1–2 tối, 3–4 sáng: thẳng · nghiêng trái 20° · nghiêng phải 20° · khoảnh khắc đổi màu · đã hồng · hồng nghiêng). Cận cảnh bình cỡ lớn: `can-canh.jpg`. Tệp vector gốc (mở phóng to bao nhiêu cũng nét): `binh-cham.svg`, `binh-hong.svg`. Video 10 giây: `video-sang.mp4`, `video-toi.mp4`.
