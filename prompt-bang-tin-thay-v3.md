# ĐỀ BÀI — BẢNG TIN CỦA THẦY bản 3: "thầy chỉ ĐỌC, không cuộn, số tính từ 12:00 trưa 21/09"

Người viết: Boss · 21/09/2026 ~13:00. Thầy lệnh (nguyên văn rút gọn): "mục bảng tin của tôi lấy dữ liệu từ 12h trưa nay, hiện đang lấy cả dữ liệu cũ trong khi tôi vừa mới giao bài tập về nhà… thiết kế lại trực quan, siêu hấp dẫn… hiển thị cho tôi ĐỌC chứ KHÔNG CÓ CUỘN nữa, chuẩn Google… tôi không cần phải làm gì trên app cả, chỉ tập trung đi dạy; trên app bạn tự động hoá mọi thứ để học sinh tiến bộ từng ngày."

"Bảng tin" = màn **Hôm nay** của app thầy (`src/screens/HomNayScreen.tsx`, `src/components/hom-nay/*`, `src/lib/hom-nay-v2.ts`). Bản 3 THAY bố cục bản 2 (khung cuộn) — thầy đã đổi ý: không cuộn.

## 1 · MỐC DỮ LIỆU (Code 3)
- Khoá cấu hình mới `cau_hinh.bang_tin_tu` = ISO. Giá trị đầu: `2026-09-21T05:00:00.000Z` (12:00 trưa giờ VN 21/09). Vắng khoá ⇒ y hệt hiện tại.
- Mốc CHỈ LỌC PHẦN HIỂN THỊ trên bảng tin của thầy. **KHÔNG xoá, KHÔNG sửa dòng dữ liệu nào.** Thuật toán cá nhân hoá (bậc thang, ôn lại 1·3·7, Bộ não A.I, bài tập về nhà nâng đỡ) VẪN dùng toàn bộ lịch sử — bỏ lịch sử là hại các em.
- MỘT lệnh đọc-chỉ mới `/gv/bang-tin` (sau cổng `laThay`, ≤ 12 truy vấn D1, không ghi byte nào), trả đủ cho cả màn, mọi con số chỉ đếm sự kiện có `luc ≥ mốc`:
  - `tu`: mốc đang áp · `capNhatLuc`.
  - `nhip`: số em đã học hôm nay / tổng em; số câu đã làm hôm nay; tỉ lệ đúng hôm nay; so với hôm qua (chỉ khi hôm qua ≥ mốc, không thì vắng — không bịa).
  - `baiTap[]`: mỗi bài còn sống giao sau mốc — tên, lớp (`tenLop`), hạn nộp, số em: chưa mở · đang làm · đã nộp; chặng trung bình đã xong / tổng chặng; nhắc tự động hôm nay đã gửi mấy em · mấy phụ huynh · lượt kế.
  - `tienBo[]` (≤ 3): chăm nhất · tiến bộ nhất · bền bỉ nhất hôm nay, mỗi em một con số thật. Không xếp hạng đáy.
  - `canDeY[]` (≤ 5 + `conLai`): em cần thầy để ý, lý do bằng SỐ tính từ mốc (vd. "sai 6/8 câu dạng Ester hôm nay", "chưa mở bài, hạn 12:00 trưa mai"). Không nhãn năng lực, không so em với em.
  - `dangVap[]` (≤ 5): dạng cả lớp đang vấp từ mốc — tên dạng (không mã), số em vấp / số em đã gặp.
  - `boNao`: đêm qua điều chỉnh mấy em, mấy lời nhắn cho em · phụ huynh, 1–2 gợi ý cho thầy (đã có ở `/ai/dem-qua`).
  - `mayDaLam[]`: NHẬT KÝ TỰ ĐỘNG hôm nay, mỗi dòng một việc máy đã tự làm kèm số: nhắc nộp bài N em · khắc phục luôn N em · đưa M câu sai về lịch ôn lại · rút bộ câu riêng cho N em · vinh danh N em · Bộ não A.I soi N em.
  - `sucKhoe`: Bộ não chạy lần cuối lúc nào · cron nhắc nộp lượt cuối · có lỗi không (một dòng, xanh/vàng/đỏ).
- Thiếu bảng/cột ⇒ phần đó vắng, lệnh vẫn `ok`. Hợp đồng: `docs/hop-dong-bang-tin-v3-2109.md` (viết TRƯỚC, Code 4 làm theo). Test: mốc lọc đúng biên (sự kiện 04:59:59Z không đếm, 05:00:00Z đếm), ≤ 12 truy vấn, không ghi, đột biến.

## 2 · GIAO DIỆN (Code 4) — "một trang báo, không cuộn"
- **1440×900 và 1280×720: TOÀN BỘ nằm trong MỘT khung nhìn, `document.scrollingElement.scrollHeight ≤ innerHeight`** (test đo). Không khung cuộn con trên trang chính. Danh sách dài ⇒ hiện top-N + nút chữ "+N em nữa" mở TẤM BÊN (tấm bên được cuộn; trang chính thì không).
- **390 (điện thoại)**: không nhồi — chia thành các TRANG LƯỚT NGANG (scroll-snap), mỗi trang vừa một màn, có chấm chỉ trang + tiêu đề trang; không cuộn dọc trong trang. Thứ tự trang: Nhịp hôm nay → Bài tập về nhà → Tiến bộ → Cần để ý → Dạng đang vấp → Máy đã làm.
- Lưới bento Material 3 (dùng `src/components/m3/`, token màu sẵn có, cấm hex thô): hàng trên 4 SỐ LỚN có nhãn + mũi tên so hôm qua; giữa: "Bài tập về nhà đang chạy" (mỗi bài MỘT thanh xếp chồng chưa mở/đang làm/đã nộp, có số trên thanh) cạnh "Tiến bộ hôm nay" (3 thẻ em, ảnh thần thú nếu có); dưới: "Em cần thầy để ý" · "Dạng cả lớp đang vấp" (thanh ngang) · "Bộ não A.I đêm qua" · "Máy đã tự làm hôm nay".
- Đầu trang: "Bảng tin · từ 12:00 Thứ Hai 21/09/2026" (đọc `tu`; khi mốc đã cũ hơn hôm nay ⇒ "Hôm nay · Thứ … dd/mm/yyyy"), giờ cập nhật, tự làm mới mỗi 60 giây (dừng khi tab ẩn), ô tra cứu em giữ ở góc phải.
- **Thầy chỉ ĐỌC**: bỏ mọi nút hành động khỏi trang chính (kể cả "Nhắc ngay") — việc đó máy tự làm, trang chỉ BÁO đã làm. Bấm vào em ⇒ mở trang Toàn cảnh một em (đã có). Trạng thái rỗng viết thật: "Từ 12:00 trưa nay chưa có em nào làm bài" — không giả số.
- Hấp dẫn bằng SỐ THẬT và chuyển động nhẹ (số đếm lên ≤ 600 ms, thanh lớn dần; tôn trọng prefers-reduced-motion), không emoji, không màu đỏ doạ; chữ theo `docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md`; mọi con số có nhãn; sáng + tối; đích chạm ≥ 48.
- LÀM THEO HAI BƯỚC: (a) dựng BẢN MẪU chạy được với dữ liệu giả đúng hợp đồng + ảnh 1440/1280/390 sáng·tối (JPG ≤ 150 KB) ⇒ gửi Boss soát TRƯỚC; (b) nối `/gv/bang-tin`, lệnh chưa có ⇒ rơi về các lệnh cũ, không lỗi đỏ. Sửa có chủ ý các test bản 2 (khung cuộn, nút Nhắc ngay) và ghi rõ trong message.

## 3 · RÀO
Không đổi luật chấm, luật vào thi, hạn nộp; không gửi gì ra ngoài app; không đụng ExamTakeScreen. Code 3 đẩy Worker, Code 2 đẩy Pages, đều sau dòng soát của Boss. `npm run check:mau`, `soi:giao-dien --tep`, `tsc -b --force`, test liên quan + m3-b.

## 4 · TỰ ĐỘNG HOÁ TIẾP THEO (sau bảng tin, theo `DE-XUAT-TU-DONG-HOA-2109.md` mục B — thầy đã nhắc lại "tự động hoá mọi thứ")
B7 vinh danh tự động 21:30 · B8 mừng mốc tức thì cho em · B9 kéo em quay lại (vắng 2–4 ngày: mẫu câu; ≥ 5 ngày: Bộ não A.I viết) · B11 tự canh sức khoẻ hệ thống (hiện ở ô `sucKhoe`). Mỗi việc: Code 3 viết đề xuất ≤ 1 trang trước, Boss duyệt, rồi làm; có trần tần suất + cờ tắt + nhật ký vào `mayDaLam`.
