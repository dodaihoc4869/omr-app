# Đề xuất B6 — "Buổi chữa tối nay" xếp sẵn (Code 1 → Boss duyệt TRƯỚC khi sửa màn Gọi lên bảng · 21/09/2026)

**Đích** (`DE-XUAT-TU-DONG-HOA-2109.md` mục B6): mỗi chiều màn Gọi lên bảng đã có sẵn "Buổi chữa tối nay: N em · M câu · P phút"; thầy chỉ bấm **Mở** (hoặc tự chọn như cũ). Máy chỉ CHUẨN BỊ, thầy vẫn quyết (mục C của bản đồ).

## Đã có sẵn (khảo sát 21/09, không viết lại)
- Màn `GoiLenBangScreen.tsx` (2334 dòng): mục 2 có 4 chip lấy câu (`theo_dang` · `san` · `tu_chon` mặc định · `btvn_gan_nhat`); nút "Xếp giờ & phân công" chạy `xepBuoiChua`/`xepGioLenBang` (ngân sách 90 phút, lane L0–L3). **"P phút" đã có**: `DongChua.giay` từ `thoi-gian-len-bang.ts`.
- **Dạng cả lớp yếu**: `/ke-hoach/hom-nay-thay` → `dangYeu[{lop, siSo, dang[{ma, ten, soEmYeu}]}]` (hồ sơ nắm kiến thức) và `lop.dangCaLopYeu` của Bộ não (chỉ tới thầy dưới dạng dòng chữ `ca_lop`, không có số riêng).
- **Gợi ý Bộ não**: dòng bản tin `hanhDong ∈ {goi_len_bang, dua_vao_buoi_chua}` + `goiYChoThay` (đang mở màn Gọi lên bảng nhưng **không mang dạng/em** sang).
- **Chưa có**: lệnh gom "câu cốt lõi nhiều em sai" theo qid (chỉ có `banDoSaiCa` từng em; client tự đếm ở `rowsLopSai`); cron 17:00 (Worker chỉ có `1 17 * * *` = 00:01 VN và mỗi phút).

## Thiết kế đề xuất (nhỏ, dùng lại tối đa)
1. **Hàm thuần mới** `src/lib/buoi-chua-de-xuat.ts` (làn em; test tính chất + đột biến): vào = dạng cả lớp yếu (2 nguồn, dạng có ở CẢ hai xếp trước) + câu lõi sai nhiều (≥ 30 % em có làm, ≥ 3 em, 3 ngày gần nhất) + dòng bản tin Bộ não; ra = danh sách câu (mỗi dạng ≤ 2 câu) + em đề xuất + **lý do bằng số thật** ("Dạng X: 9/24 em vấp") + tổng em · câu · phút (dùng `thoiGianCau` + ngân sách 90 phút). Không nhãn năng lực, không xếp hạng đáy, tên em chỉ hiện trong màn thầy.
2. **Máy chủ (Code 3), chỉ đọc + chỉ thêm**: lệnh `/gv/buoi-chua-de-xuat` gom số liệu (một truy vấn `GROUP BY qid` trên `su_kien_hoc` + đọc `dangYeu` + dòng bản tin đêm qua). **Giai đoạn 1 tính khi thầy mở màn** (không cron, không bảng mới) — vẫn "có sẵn" khi mở; **Giai đoạn 2** thêm cron 17:00 (`0 10 * * *` UTC, nhánh riêng trước `else` kẻo rơi vào `deliverNotices`) chốt ảnh chụp + dòng nhắc ở màn Hôm nay.
3. **Giao diện**: MỘT thẻ đầu mục 2 "Buổi chữa tối nay (đã xếp sẵn)" — N em · M câu · P phút, 2 dòng vì sao, nút **Mở buổi này** (điền sẵn chip `tu_chon` + em rồi chạy `xepBuoiChua` như nút cũ) và **Tự chọn lại** (giữ nguyên luồng cũ). Luồng hiện tại không đổi một byte khi thẻ ẩn.
4. **Rào**: công tắc tắt trong Cài đặt (mẫu `cau_hinh.bo_nao`); thiếu dữ liệu (< 5 em có sổ 3 ngày) ⇒ ẩn thẻ, không bịa; không tự gửi gì ra ngoài; ảnh Chromium 390/1440 sáng+tối; `npm run check:mau` + `sinh-m3-tuong-thich` sau khi sửa.

## Boss chốt giúp 3 điều
- **(a)** Giai đoạn 1 tính-khi-mở (đề xuất, ít hạ tầng nhất) hay làm luôn cron 17:00?
- **(b)** Đề xuất TỰ ĐỘNG có lọc câu tự luận (`cau-tu-luan.ts`) không? Em đề xuất **có lọc** (đúng luật kênh tự động; thầy vẫn thêm tay được vì Gọi lên bảng "thầy chọn gì hiện đúng thế").
- **(c)** Phân việc: em làm hàm thuần + thẻ ở màn; **Code 3** làm `/gv/buoi-chua-de-xuat` (+ cron nếu chọn); Code 4 có cần soát màn không?
