# Đề xuất kỹ thuật V3 "Mục tiêu tuần" + V4 "Vòng khép kín" (Code 1 → Boss duyệt trước khi build · 21/09/2026)
**Nguyên tắc:** máy chủ ĐO bằng số (tất định), AI chỉ ĐỀ XUẤT trong khuôn đóng, `kiemKhuon` kiểm cứng cả hai đầu; hạn nộp / điểm / lõi / bài bắt buộc không đổi; không so em với em, không nhãn năng lực; mỗi vai một cờ tắt (`cau_hinh.bo_nao.mucTieuTuan`, `.voiEm`).
**Dùng lại sẵn có, không cần nguồn dữ liệu học mới:** thẻ + `luotSoiKyTuan` (mỗi em một ngày trong tuần, xoay vòng theo `toiLuotSoiKy`) + `thuTuan` · `nam_kt_dang.bac` · `homQuaDanhGia` · `thu_thach_rieng` (có hàng = em ĐÃ MỞ thẻ, vì chốt câu xảy ra lần gọi đầu) · `su_kien_hoc(nguon='thu_thach_rieng')` (làm / đúng).

## V4 · Vòng khép kín (làm trước — dữ liệu đã có)
1. **Đo (Code 3, tất định, không do AI):** thẻ thêm `homQuaThuThach { mo, soDaLam, soDung, bac }` (từ `thu_thach_rieng` + sổ) và `gioHoc` (giờ trung vị của `su_kien_hoc.luc` 7 ngày). ≈ 40 token/em.
2. **Học (AI đề xuất, máy chủ kiểm):** `huongEm` ≤ 2 nhãn trong DANH SÁCH KÍN `thu_thach|tran_an` · `ngan|giai_thich` · `som|muon`, mỗi nhãn kèm số bằng chứng (≥ 3 ngày dữ liệu). KHÔNG chữ tự do ⇒ không nhãn năng lực, không lộ đời tư. Lưu `ai_huong_em(sbd, json, het_han = +14 ngày)` (bảng MỚI chỉ-thêm), ghi đè theo em; thầy chỉ ĐỌC ở Hồ sơ em; em không thấy.
3. **Dùng:** thẻ ngày sau có `huongEm`; `kiemKhuon` thêm luật nhất quán: `tran_an` ⇒ `thuThach.bac ≠ cao_hon_mot_bac`; `ngan` ⇒ `soCau ≤ 5`; lời KHÔNG nói "mình biết em thích…". Không có `huongEm` ⇒ Y HỆT bản hiện nay.

## V3 · Mục tiêu tuần
1. **Khi nào:** đúng ngày `luotSoiKyTuan` của em (đã có; dàn tải token, không cần lượt chạy mới). Boss muốn Chủ nhật cho cả lớp thì đổi một hằng số.
2. **Khuôn:** `mucTieuTuan { dang: 1 mã có trong thẻ, den: bậc hiện tại + 1 }` + `loiMucTieu ≤ 160` (≥ 1 số thật, mọi số có trong thẻ, không hứa "sẽ lên bậc"). Luật cứng: dạng đủ tin (≥ 4 câu), đích ≤ Vận dụng, em CHƯA có mục tiêu đang chạy (7 ngày), thẻ có `luotSoiKyTuan`.
3. **Đo (Code 3):** bảng `ai_muc_tieu_tuan(sbd, tu_ngay, dang, bac_tu, bac_den, loi, ket_qua_json)` (MỚI, chỉ-thêm); tiến độ = số câu đúng ở bậc đích / ngưỡng lên bậc của `ho-so-lop` (Code 3 xác nhận công thức); thẻ có `mucTieuTuan { dang, tu, den, ngayCon, tienDo }` làm NGUỒN SỐ cho lời nhắn hằng ngày, thanh tiến độ và thư tuần.
4. **Khép tuần:** thẻ tuần sau có `mucTieuTuanTruoc { dang, tu, den, dat, bacNay }` ⇒ `thuTuan` báo phụ huynh KẾT QUẢ bằng số; không đạt thì nói thật, bình tĩnh, không phạt. Thử thách riêng hằng ngày ưu tiên dạng mục tiêu (luật mềm ở cẩm nang).

## Chi phí · phân việc · rủi ro
- **Token:** không thêm lượt AI; V3 chỉ thêm một trường ở lượt sâu đã chạy; thẻ nặng thêm ≈ 100 token/em. **Rủi ro chính:** AI đoán sai `huongEm` ⇒ hết hạn 14 ngày + luật nhất quán chỉ làm bộ NHẸ đi, không bao giờ nặng thêm.
- **Code 3:** 2 bảng + khối đo trong thẻ + lệnh nhận/áp (V4 trước, V3 sau) · **Code 1:** khuôn + luật + cẩm nang + test/đột biến + mẫu lời · **Code 2:** thanh tiến độ mục tiêu tuần ở Bảng nhiệm vụ · **Code 4:** Hồ sơ em (`huongEm` chỉ đọc) + dòng "Máy đã tự làm hôm nay". Ước lượng: V4 nửa ngày, V3 nửa ngày (mã ba phía, chưa tính soát).
- **Đo hiệu quả (tự động):** so CHÍNH EM trước/sau (tỉ lệ mở thẻ, số câu làm, số em lên bậc trong tuần, số em đạt mục tiêu tuần) — hiện ở bảng tin của thầy.

## Boss/thầy chốt
(1) `huongEm` = nhãn kín (khuyên) hay chữ tự do? (2) Mục tiêu tuần theo `luotSoiKyTuan` xoay vòng (khuyên) hay Chủ nhật? (3) Tuổi thọ `huongEm` 14 ngày? (4) Em có được thấy `huongEm`? (khuyên: KHÔNG).
