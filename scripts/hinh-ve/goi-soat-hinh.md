# Việc: SOÁT hình vẽ lại — đối chiếu từng cặp (thầy Đỗ Đại Học 03/11: «tuyệt đối không vẽ qua loa, chuẩn thì mới đẩy lên»)

`vao/img/<bam>.*` = ảnh GỐC của đề. `ra/<bam>.png` = hình đã vẽ lại (đúng phông và màu app). `vao/<bam>.json` có `phienAm` (chữ chép từ ảnh gốc) và `de`. Mở CẢ HAI ảnh bằng Read, rồi ghi `soat/<bam>.json`: `{ "dat": true|false, "loi": ["…"] }`.

`dat: true` CHỈ KHI ĐỦ TẤT CẢ:
1. **Đủ và đúng nội dung**: mọi thành phần của ảnh gốc đều có (dụng cụ, chất, nhãn, mũi tên, dấu «+», hệ số, số liệu), đúng SỐ LƯỢNG (số nguyên tử / nhóm / nét / electron mỗi lớp), đúng vị trí tương đối, đúng chiều mũi tên, nhãn chỉ đúng vào phần của nó. Không thêm thông tin ảnh gốc không có.
2. **Chữ**: mọi nhãn đọc rõ, KHÔNG đè lên hình hay lên nhau, không bị cắt mép; công thức có CHỈ SỐ dưới / điện tích trên đúng chỗ và đúng cỡ (NH₃, SO₄²⁻, Fe³⁺, 2H₂O — không «NH3»); xúc tác / dung môi ở TRÊN mũi tên, nhiệt độ / điều kiện thứ hai DƯỚI mũi tên.
3. **Hình học**: vòng benzen / lục giác đều, liên kết đúng góc, liên kết đôi / ba song song đều; dụng cụ cân đối, đúng hình dạng (bình tam giác ≠ bình cầu ≠ cốc), không méo, không lệch tâm, không nhô ra ngoài khung.
4. **Phong cách**: đúng gu mẫu của thầy — thuỷ tinh bo tròn màu dịu có vệt sáng, bóng chân dưới vật, dung dịch tô màu, mũi tên / dấu cộng tím nhạt; KHÔNG kiểu nét đen mảnh thô, KHÔNG trống trải bất thường, KHÔNG qua loa.
5. Hình đẹp, cân đối, đọc được ở khổ điện thoại.

Còn BẤT KỲ lỗi nào ⇒ `dat: false` và `loi` liệt kê TỪNG lỗi cụ thể, hành động được («thiếu electron lớp 2: ảnh có 8, hình có 6», «nhãn FeBr₃ đang nằm dưới mũi tên, phải ở trên», «bình hứng lệch trái 20 đơn vị»). KHÔNG nương tay: nghi ngờ thì `dat: false`. Chỉ dùng Read và Write. Trả lời cuối đúng 1 dòng: số ảnh đạt / tổng.
