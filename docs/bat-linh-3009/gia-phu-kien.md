# Giá phụ kiện m1-v2 · 30/09/2026

Theo yêu cầu cân giá với vàng hiện tại. Mốc tính từ luật v5: 570 EXP/ngày, 1 vàng/5 EXP vào thú; EXP tràn dùng lợi suất giảm dần, tương ứng 63–114 vàng/ngày. Đây là kịch bản tham chiếu, không phải dữ liệu tài khoản thực tế. Không thay công thức kiếm vàng hoặc yêu cầu lên cấp.

| Bậc | Giá vàng | Ngày tích luỹ tham chiếu, từ số dư 0 |
|---|---:|---:|
| Thường | 40–75 | 1–2 |
| Đẹp | 150–280 | 2–5 |
| Hiếm | 360–650 | 4–11 |
| Sử thi | 900–1.600 | 8–26; vẫn cần cấp 10 |
| Huyền thoại | 2.000–3.200 | 18–51; vẫn cần cấp 20 |

Mỗi chỗ đeo có món đầu tiên ≤63 vàng. Bộ khởi đầu Vòng Sương Mai + Đuôi Bong Bóng + Khung Thuỷ Tinh =120 vàng, trong hai ngày tham chiếu thận trọng nếu dành toàn bộ vàng cho bộ này. Thực tế phụ thuộc lượng học, ngày nghỉ và chi tiêu; không cam kết thời gian. Huyền thoại cần ít nhất 67 ngày đạt để đạt cấp 20, nên ngày đủ vàng không đồng nghĩa ngày được mua.

| Mã | Giá mới |
|---|---:|
| HQ-01 | 40 |
| HQ-02 | 60 |
| HQ-03 | 180 |
| HQ-04 | 240 |
| HQ-05 | 420 |
| HQ-06 | 600 |
| HQ-07 | 1,200 |
| HQ-08 | 2,800 |
| VD-01 | 40 |
| VD-02 | 50 |
| VD-03 | 75 |
| VD-04 | 150 |
| VD-05 | 220 |
| VD-06 | 500 |
| VD-07 | 1,000 |
| VD-08 | 2,400 |
| KT-01 | 40 |
| KT-02 | 60 |
| KT-03 | 65 |
| KT-04 | 200 |
| KT-05 | 280 |
| KT-06 | 360 |
| KT-07 | 900 |
| KT-08 | 2,000 |
| DA-01 | 50 |
| DA-02 | 75 |
| DA-03 | 160 |
| DA-04 | 260 |
| DA-05 | 400 |
| DA-06 | 650 |
| DA-07 | 1,400 |
| DA-08 | 3,200 |
| CL-01 | 50 |
| CL-02 | 65 |
| CL-03 | 190 |
| CL-04 | 280 |
| CL-05 | 460 |
| CL-06 | 550 |
| CL-07 | 1,600 |
| CL-08 | 3,000 |

Toàn bộ 40 món: 26.270 vàng, giảm 18,6% so với bảng trước (32.260). Không tính Huyền thoại: 12.870 vàng. Có 24 món đang mở bán như trước; 16 món đợt hai chỉ chuẩn bị bảng giá.

Máy chủ và giao diện lấy chung một danh mục; máy chủ trả PHIEN_BAN m1-v2. Máy cũ gửi giá lệch bị từ chối gia_doi; màn xác nhận tải lại giá trước khi mua. Giao dịch lặp giữ nguyên kết quả đã ghi. Không đổi số dư, đồ đã mua, giá ghi trong giao dịch cũ, điều kiện học/cấp/ấn thạch hoặc số suất. Không migration hay chỉnh dữ liệu thật.

Kiểm chứng: test catalogue khoá 40 giá; test mua thật trên SQLite về sổ vàng, bấm đúp, tranh mua suất cuối, số dư không âm và giá cũ/mới; test giao diện cửa hàng → thử → xác nhận → mua → tự mặc → tủ đồ.

Kiểm tra trước phát hành: 100/100 test catalogue + server shop + logic/UI mua đạt; 25/25 test EXP v5 đạt sau cập nhật hai kỳ vọng giá có chủ ý. Chromium bốn trường hợp mua VD-04 150 vàng, ví 340→190, tự mặc đúng (390/1.440 px × sáng/tối). Build, tsc Worker, kiểm màu và service worker 13/13 đạt. Toàn suite 13.106 test: 12.919 đạt, 139 đỏ, 48 bỏ qua; 137 tên đỏ tái hiện trên nền, một lỗi timing không tái hiện khi chạy riêng và một hợp đồng giá v4 cũ đã cập nhật/rerun đạt. Không còn tên test đỏ mới sau đối chiếu. Log đầy đủ nằm trong /tmp/bat-linh-gia-*.json.
