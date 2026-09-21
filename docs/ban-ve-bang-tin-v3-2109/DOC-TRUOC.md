# Bản vẽ BẢNG TIN CỦA THẦY bản 3 — THẦY ĐÃ CHỐT 21/09/2026 ("chốt bảng tin build")

Ba tệp `.dc.html` là NGUỒN bản vẽ Boss đưa thầy duyệt (trang thiết kế riêng của thầy). Đọc phần `<x-dc>…</x-dc>` để lấy bố cục, kích thước, cỡ chữ, thứ tự ô; phần `renderVals()` là DỮ LIỆU MẪU (số và tên giả). Không chạy được trực tiếp trong kho (cần máy vẽ) — chỉ để ĐỌC.

Build theo đúng bản vẽ, với các điều sau:
- Màu trong bản vẽ là hex thô để vẽ nhanh ⇒ trong `src/` PHẢI đổi sang token sẵn có (check:mau đang xanh, giữ xanh); thiếu token thì thêm vào `src/styles/tokens.css` có cặp sáng/tối. Ô "Máy đã tự làm hôm nay" nền đậm ở CẢ sáng và tối.
- Phông trong bản vẽ (Be Vietnam Pro) chỉ để minh hoạ ⇒ dùng phông hiện có của app.
- Máy tính 1440×900 và 1280×720: toàn trang trong MỘT khung nhìn, không cuộn (test đo). Hàng: đầu trang 56 · 4 số lớn 124 · hai ô giữa 288 · bốn ô dưới chiếm phần còn lại; khoảng cách 16; bo góc 20.
- Điện thoại 390: 6 trang lướt ngang (scroll-snap), mỗi trang vừa một màn, chấm chỉ trang + chữ "Lướt sang: …". Bản vẽ mới có trang 1 và 2 ⇒ trang 3–6 (Tiến bộ hôm nay · Em cần thầy để ý · Dạng cả lớp đang vấp · Bộ não A.I đêm qua) dựng CÙNG ngôn ngữ: tiêu đề "Trang k trong 6 · …", thẻ bo 20, chữ thân ≥ 15.
- Nền tối: tự dựng theo token, chụp ảnh gửi Boss.
- KHÔNG nút hành động trên trang. "+N em nữa" mở tấm bên. Chạm tên em ⇒ Toàn cảnh một em. Ô tra cứu ở góc phải (điện thoại: nút tròn 48).
- Dữ liệu thật: `/gv/bang-tin` (hợp đồng `docs/hop-dong-bang-tin-v3-2109.md`); khối nào máy chủ báo vắng ⇒ hiện trạng thái rỗng viết thật, không giả số.
