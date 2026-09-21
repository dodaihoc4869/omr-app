# BỘ NÃO A.I — TẦNG ĐỌC (chế độ THẬT) · Code 3 · 21/09/2026

Mã: `server/src/bo-nao-doc.ts` (đọc `ai_dieu_chinh` do `bo-nao.ts` của Code 1 ghi). Test: `tests/bo-nao-doc-2109.test.ts` (16 test, đột biến 20/21 — mẫu còn lại là cổng tương đương). Hợp đồng ghi: `docs/hop-dong-bo-nao-2109.md`.

## Khi nào có hiệu lực
Chế độ HIỆU LỰC của lớp em (`lopThat.includes(lớp) ? 'that' : cheDo`, lớp lấy từ thẻ ngày `ai_ho_so_ngay.lop`) là `that` VÀ `bat = true`. Công tắc về `bong`/`bat:false` ⇒ DỪNG NGAY (mọi điều chỉnh đang còn hạn thôi có hiệu lực). Chạy thử (`bong`) ⇒ KHÔNG trả gì, KHÔNG đổi một byte (test: kế hoạch ngày, mở bài, nộp chặng, bộ câu y hệt bản không có bảng `ai_*`).
Điều chỉnh (nhịp/khởi động/dạng/khắc phục/on_som) chỉ dùng khi hàng `ai_dieu_chinh`: `ap_dung = 1`, `huy = 0`, `tu_go = 0`, `het_han ≥ hôm nay`, `ngay ≤ hôm nay` (mới nhất mỗi em thắng). KHÔNG núm nào đổi `han_nop` (test khoá).

## Tác động
- **Kế hoạch ngày** (`ke-hoach-ngay-d1.ts` `docDauVao` + `ke-hoach-ngay.ts` `tinhNganSach`): `nhip` ±3 câu/ngày vào `mucTieuCau` (kẹp [6, 16]; gốc ngoài khoảng không bị kéo vào; TĂNG không vượt sức chứa theo số phút/ngày em/phụ huynh đã đặt); thêm dòng `nganSach.dieuChinh` "Bộ não A.I: thêm/bớt N câu/ngày". `on_som`: câu vừa sai (`moi_sai`/`dang_on`) của dạng được chọn có mốc ôn ở tương lai ⇒ mốc HIỆU LỰC = "ngày mai" của đêm điều chỉnh (CHỈ SỚM hơn; không ghi lại `nam_kt_cau`).
- **BTVN nâng đỡ**: lúc CHỐT bộ, điều chỉnh còn hạn đi qua cổng `dieuChinh` của `chonBoCuaEm` (lưu ở `btvn_em.ngan_sach_json.dieuChinh`); SAU MỖI chặng xong, `thichNghiChangSau` (lõi Code 1) với điều chỉnh ấy cho các chặng CHƯA MỞ, rồi máy chủ KIỂM LẠI bất biến (số chặng, chặng đã mở, lõi, thử thách) trước khi lưu — vi phạm ⇒ bỏ cả thay đổi. Em KHÔNG có điều chỉnh (hoặc bong/tắt) ⇒ không gọi thích nghi, bộ y nguyên. `/btvn/xem-truoc` tính thử theo cùng điều chỉnh cho em chưa chốt.
- **Lời nhắn** (`che_do = 'that'` lúc nộp, `huy = 0`; đêm chạy thử KHÔNG BAO GIỜ ra):
  - HS: `POST /hs/ke-hoach-ngay` thêm `loiNhanHlv: {ngay, loi, gan:[{ngay, loi}]}` (gan ≤ 7, mới nhất trước, gồm hôm nay; lời mới nhất phải ≤ 1 ngày tuổi). CHỈ `loiNhanChoEm`. Không có ⇒ KHÔNG có khoá (phản hồi y hệt cũ).
  - PH: `POST /ph/ke-hoach {pass}` thêm `boNaoAi: {ngay, loiNhan, thuTuan, tuanTu?}` (loiNhan = lời phụ huynh mới nhất ≤ 2 ngày; thuTuan = thư tuần mới nhất ≤ 7 ngày, `tuanTu` = ngày viết), SBD chỉ từ token. Không có ⇒ KHÔNG có khoá.
