# ĐỀ BÀI BUILD — Thiết kế lại mục "Bài tập về nhà đã giao" (app giáo viên)

Boss soạn 21/09/2026. Thầy hỏi (kèm ảnh màn hiện tại): "có cách nào để quản lý chỗ này thông minh, trực quan, đẹp mắt hơn nữa không?" ⇒ Boss vẽ mẫu phác ⇒ **thầy chốt 18:1x: "thiết kế lại theo mẫu đề xuất đi"**. Mẫu phác: `docs/ban-ve-btvn-da-giao-2109/mau-phac.html` (mở bằng trình duyệt; dữ liệu mô phỏng).

Làn: **Code 1** (màn `src/screens/PhanCongScreen.tsx`, mục "Bài tập về nhà đã giao" — làn giáo viên ⇒ mọi commit cần dòng "Boss đã soát"), **Code 3** (mở rộng CHỈ-THÊM lệnh `/btvn/theo-doi`), **Code 2** đẩy Pages. KHÔNG đụng mục "Giao bài mới".

## 0 · Màn hiện tại yếu ở đâu (để không làm lại lỗi cũ)
1. Tên bài là mã nội bộ ("Riêng-muapgf2t · 10", "Ca Riêng"); tên thật là một dòng đường dẫn "Dạy học / Lớp 10 / Ch.2 / Bài 5 / …".
2. Bốn bài hiện HAI lần (khối `KhoiBtvnLo` "đang chạy" + các thẻ bên dưới).
3. Ba ô số 0 chiếm chỗ đẹp nhất.
4. Khung sửa hạn (ô ngày giờ + 4 nút nhanh + Lưu hạn + Thu hồi) mở sẵn ở MỌI thẻ; Thu hồi nằm sát Lưu hạn.
5. "100% kịp" không nói AI; không thấy em nào chưa mở bài, em nào chậm nhịp; mỗi thẻ một ô tìm riêng.

## 1 · Bố cục mới (đúng mẫu phác)
**A. Đầu màn:** bộ lọc lớp (Tất cả · từng lớp, dùng TÊN LỚP chuẩn `ten_lop`) + MỘT ô tìm tên / số báo danh cho cả màn (gõ ⇒ chỉ còn các bài có em đó, mở sẵn ngăn danh sách ở đúng em). Nút "Cập nhật dữ liệu" giữ.
**B. Dải "cần thầy để ý":** ba ô — "Em chưa mở bài" (số em · số bài) · "Em chậm nhịp" · "Hạn gần nhất" (đếm ngược). Ô nào = 0 thì ẨN; cả ba trống ⇒ một dòng xanh "Mọi bài đang đúng nhịp". Mọi con số có nhãn.
**C. Mỗi bài MỘT thẻ**, xếp theo mức cần để ý (chậm nhịp × 2 + chưa mở, rồi hạn gần trước). Thẻ đầu MỞ sẵn; các thẻ sau THU GỌN một dòng (tên · lớp · chặng n trong m · hạn · thanh nhóm nhỏ · "N chưa mở · M chậm"); bấm để mở/thu, nhớ trong phiên.
Thẻ mở gồm:
- Tên ĐỌC ĐƯỢC: dùng đúng `tenBaiHienThi` của máy chủ (`server/src/gv-bang-tin.ts:58`, một nguồn với Bảng tin) — ví dụ "Lớp 10 · Chương 2 · Bài 5". Dòng phụ: sĩ số · số câu · số câu lõi · "giao 10:48 Thứ Hai". Mã nội bộ chỉ còn trong hộp "Chi tiết bài" sau nút ⋯.
- Cờ hạn nộp + đếm ngược theo phút ("còn 2 ngày 17 giờ"); dưới 6 giờ đổi cam; qua hạn ⇒ "Đã qua hạn · N em đang nộp trễ" (luật nộp trễ phương án B đã sống — KHÔNG đổi).
- Đường chặng CÓ NGÀY (Chặng 1 · hôm nay | Chặng 2 · Thứ Ba | …), chặng hôm nay tô đậm, chặng đã qua tô nhạt. Bài không chia chặng ⇒ không có đường này.
- THANH NHÓM cả lớp: chưa mở (xám) · đúng nhịp (xanh dương) · chậm nhịp (cam) · xong chặng hôm nay (xanh lá) · đã nộp cả bài (xanh lá đậm, chỉ khi > 0); số nằm trong đoạn, chú giải bên dưới; đoạn quá hẹp thì số ra chú giải. Bài không chia chặng: chưa mở · đang làm · đã nộp.
- Hàng hành động: "Xem N em này" (N = chưa mở + chậm nhịp) mở NGĂN DANH SÁCH; bấm một đoạn của thanh ⇒ ngăn mở đúng nhóm đó. Nút "Nhắc trong app": CHỈ làm nếu app đã có sẵn lệnh nhắc do thầy bấm tay trong app học sinh; không có thì KHÔNG dựng nút, ghi vào sổ (không tạo kênh gửi mới, không gửi gì ra ngoài app).
- Nút ⋯ (đích ≥ 44 px): "Đổi hạn nộp" (mở hộp chứa đúng ô ngày giờ + 4 nút nhanh + Lưu hạn hiện có — giữ nguyên lệnh `/btvn/sua`), "Xem bài làm", "Chi tiết bài", và "Thu hồi" nằm CUỐI, màu cảnh báo, có hộp xác nhận nói rõ hậu quả như hiện nay.
**D. Ngăn danh sách em** (bên phải ≥ 1100 px, tấm trượt dưới ở màn hẹp): các tab theo nhóm có số đếm; mỗi em một dòng: họ tên · chặng đang ở · số câu đã làm / số câu của em · lần học gần nhất ("hôm nay 20:41", "2 ngày trước", "chưa mở"); em nộp trễ có chip "nộp trễ N giờ". Bấm em ⇒ Toàn cảnh em (đường sẵn có). KHÔNG gắn nhãn năng lực, không xếp hạng em với em.
**E. Bỏ khối trùng:** mục này không còn dựng `KhoiBtvnLo` (khối đó vẫn ở Hôm nay/Bảng tin — không sửa ở đó).

## 2 · Luật tính nhóm — MỘT NGUỒN
Bốn trạng thái của em phải khớp Bảng tin thầy (`emChamNhip`, `server/src/gv-bang-tin.ts`) và thẻ "Đường về đích" của em (`src/lib/ve-dich.ts soNo`/`trangThaiChangTheoMoc`), tính từ MỐC HIỂN THỊ (`docMocHienThi`): chưa mở = chưa có dòng mở bài · chậm nhịp = có chặng lẽ ra xong trước 00:00 hôm nay mà chưa xong · xong chặng hôm nay · đúng nhịp = còn lại · đã nộp. Chặng MỞ SỚM chưa làm không tính là chậm (đã có mốc gốc `truoc`). KHÔNG viết công thức thứ hai ở máy khách: máy khách chỉ ĐỌC nhóm máy chủ trả.

## 3 · Máy chủ (Code 3) — `/btvn/theo-doi` CHỈ-THÊM
Mỗi bài thêm: `ten` (tenBaiHienThi) · `tenLop` · `soCauLoi` · `chang[] {so, ngay, laHomNay}` · `nhom {chuaMo, dungNhip, chamNhip, xongHomNay, daNop, nopTre}`; mỗi em thêm: `nhom` · `changHienTai` · `soCauDaLam` · `soCauCuaEm` · `hocGanNhat` · `nopTreGio?`. Giữ mọi khoá cũ (màn cũ vẫn chạy). Mỗi truy vấn ≤ 5 term UNION (giới hạn D1 thật); kèm số truy vấn, rows_read đo trên D1 thật, ước lượng dòng đọc/ngày; test đối chiếu: cùng dữ liệu ⇒ `nhom.chamNhip` = số em `emChamNhip` của Bảng tin cho bài đó. Hợp đồng: `docs/hop-dong-btvn-theo-doi-v2-2109.md`. Sau khi đẩy: gọi thử D1 thật có mã bí mật.
Máy chủ CŨ (thiếu khoá mới) ⇒ màn hiện thẻ không có thanh nhóm + dòng "Cập nhật máy chủ để xem theo nhóm" — không bịa số, không vỡ.

## 4 · Giao diện
Chuẩn Google M3 của app thầy; token màu sáng + tối sẵn có (cấm hex thô, `npm run check:mau`); tiền tố lớp CSS mới `btg-` + một hàng trong `tests/khong-va-cham-lop-css-2109.test.ts`; chữ ≥ 12 px; đích chạm ≥ 44 px; giảm chuyển động ⇒ không hoạt ảnh; từ ngữ theo `docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md` ("bài tập về nhà", "chặng", "hạn nộp", "chậm nhịp", "nộp trễ"; chủ ngữ việc tự động là "A.I Đỗ Đại Học"). Kiểm 1280×800 và 1440 TRONG vỏ app (thanh bên trái), 390 điện thoại; sáng + tối; 0 chồng chữ, 0 tràn ngang, tên bài dài + lớp tên dài.

## 5 · KHÔNG đổi (rào)
Luật hạn nộp, nộp trễ, thu hồi, giao bài, chấm điểm; lệnh `/btvn/sua`, `/btvn/giao`; không tự động đổi hạn, không tự nhắc, không gửi tin ra ngoài app. Chỉ đổi PHẦN NHÌN + thêm dữ liệu chỉ-đọc.

## 6 · Nghiệm thu
1. Trang xem thử dev (đặt ở `src/components/xem-thu/`, không vào gói sản phẩm) với 5 cảnh dữ liệu GIẢ: bình thường · nhiều em chậm · bài không chia chặng · bài qua hạn có nộp trễ · máy chủ cũ thiếu khoá.
2. Ảnh JPG ≤ 150 KB: 1280 sáng + tối trong vỏ app, 390 sáng, ngăn danh sách em, hộp Đổi hạn nộp, hộp xác nhận Thu hồi — `docs/anh-btvn-da-giao-2109/`.
3. Test: sắp xếp thẻ, ẩn ô = 0, thanh nhóm khớp số, bấm đoạn ⇒ đúng nhóm, tìm em ⇒ lọc bài, Thu hồi luôn qua hộp xác nhận, máy chủ cũ không vỡ, không còn mã "Riêng-…" ở thẻ; Chromium thật 0 tràn/0 chồng chữ ở 3 cỡ. Đột biến.
4. Code 1 chạy TOÀN BỘ vitest trước khi xin soát (màn dùng tệp dùng chung). Phần cần mã bí mật trên bản sống: không phiên nào tự mở — Boss gửi ảnh cho thầy, thầy tự xem.
