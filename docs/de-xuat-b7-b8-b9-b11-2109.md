# Đề xuất máy chủ cho B7 · B8 · B9 · B11 (Code 3, 21/09/2026) — mỗi việc ≤ 1 trang, chờ Boss duyệt rồi mới làm

Chung cả bốn việc (theo mục D của `DE-XUAT-TU-DONG-HOA-2109.md`): **thuật toán/mẫu câu, KHÔNG AI ở phần máy chủ**; khung giờ gửi 07:00–21:30 giờ VN; khoá idempotent nên chạy lại không gửi đôi; mỗi việc một **cờ tắt** trong MỘT khoá `cau_hinh.tu_dong_cac_viec` = `{vinhDanh, mungMoc, keoLai, suKhoe}` (vắng khoá ⇒ `vinhDanh`, `mungMoc`, `suKhoe` BẬT, `keoLai` TẮT tới khi Boss bật sau tuần đọc nhật ký); mỗi việc ghi **nhật ký** (dòng ở bảng riêng hoặc `canh_bao_thay`) và hiện ở `mayDaLam` của `/gv/bang-tin`; không gửi gì ra ngoài app; lời viết theo `quy-tac-viet-phu-huynh` (xưng Thầy/em, số thật, không so em với em, không nhãn năng lực, không emoji, không doạ); Worker lên trước migration vẫn an toàn (bọc try/catch như nhắc tự động). Không việc nào đổi luật chấm, hạn nộp, luật vào thi.

## B7 · Vinh danh tự động 21:30
- **Việc:** cron chốt bản "Vinh danh ngày" lúc 21:30: `cham_nhat` (nhiều lượt đã chấm nhất), `tien_bo_nhat` (nhiều câu sai trước nay làm đúng lại), `ben_bi_nhat` (chuỗi ngày ≥ 5 lượt/ngày), mỗi bục MỘT em, chỉ khi có số (ngưỡng như `/gv/bang-tin`). Cùng công thức, tính từ mốc bảng tin.
- **Ghi:** bảng mới `vinh_danh_ngay(ngay, loai, sbd, so, chu, tao_luc, PRIMARY KEY(ngay, loai))` (chỉ-thêm) + một `student_notice` cho em được vinh danh ("Hôm nay em làm 42 câu, nhiều nhất lớp") — khoá `vd:<ngày>:<loại>`; phụ huynh thấy dòng trong bản tin ngày của con (không tin riêng ⇒ không tính trần 1 tin/ngày).
- **Đọc:** `/hs/vinh-danh` (đọc-chỉ, chỉ tên em + số + nhãn bục, không xếp hạng đáy, không nêu em yếu) cho app học sinh; thầy đọc từ `/gv/bang-tin.mayDaLam` ("Vinh danh 3 em").
- **Rủi ro/quyết:** cùng một em thắng ba ngày liền ⇒ nhường bục kế (tránh một em chiếm). Đề xuất: em đã được vinh danh cùng bục hôm qua nhường em kế tiếp nếu số ≥ ngưỡng. Boss chốt.
- **Ước công:** 0,5 ngày máy chủ + test; cần Code 2/4 dựng ô hiển thị.

## B8 · Mừng mốc tức thì cho em
- **Việc:** ngay sau khi em nộp chặng/ôn lại/xong bài (các lệnh đã ghi sổ `su_kien_hoc`), kiểm 4 mốc: lên bậc một dạng; đúng lại câu từng sai (câu chuyển sang `da_khac_phuc`); chuỗi 3/7/14 ngày đạt; xong bài tập về nhà trước hạn ≥ 24 giờ. Mỗi mốc ⇒ MỘT thẻ mừng ngắn theo mẫu có số thật ("Em đã làm đúng lại 3 câu từng sai ở dạng Este").
- **Ghi:** `student_notice` (target `mung_moc`, khoá `mung:<loại>:<sbd>:<mã mốc>` — mỗi mốc đúng một lần). **KHÔNG thêm EXP mới** (EXP hiện có đã có chuỗi/đạt ngày; thêm EXP là đổi kinh tế trò chơi ⇒ Boss chốt riêng).
- **Trần:** ≤ 3 thẻ/em/ngày (mốc dư xếp vào ngày sau, không mất); không tính vào trần tin nhắc nộp bài; chỉ trong khung 07:00–21:30 (ngoài khung: hẹn 07:00).
- **Đọc:** đường thông báo em hiện có (`student_notice`) — app học sinh chỉ cần hiển thị `mung_moc` như thẻ mừng.
- **Rủi ro:** chạy trong đường ghi của em ⇒ phải nhẹ (≤ 2 truy vấn thêm) và bọc lỗi nuốt (lỗi mừng không được làm hỏng việc nộp). Đề xuất kiểm bằng test hiệu năng đếm truy vấn.
- **Ước công:** 1 ngày máy chủ (móc vào 3 lệnh nộp) + test; Code 2/4 làm thẻ.

## B9 · Kéo em quay lại
- **Việc:** 07:30 mỗi ngày tìm em vắng: **2–4 ngày** (không tính ngày nghỉ `cau_hinh.ngay_nghi`) ⇒ MỘT lời mời theo mẫu cho EM ("Em chưa làm bài 3 ngày rồi. Hôm nay em làm 5 câu ôn lại là đủ, khoảng 8 phút.") — không báo phụ huynh; **≥ 5 ngày** ⇒ đưa vào luồng `vang` của Bộ não A.I (Code 1 viết lời cho em + phụ huynh, trong trần 2 lời PH/7 ngày). Máy chủ chỉ **liệt kê** em ≥ 5 ngày cho Bộ não đọc (`/ai/...` sẵn có lấy từ `ai_ho_so_ngay.luong = 'vang'`).
- **Ghi:** `student_notice` khoá `ql:<sbd>:<ngày cuối học>` (một lời mỗi đợt vắng; em quay lại rồi vắng lại là đợt mới). Nhật ký `canh_bao_thay`-kiểu hoặc bảng `keo_lai_nhat_ky` nhỏ.
- **Trần/cờ:** em ≤ 1 tin tự động/ngày (tính chung với nhắc nộp bài: nhắc nộp ưu tiên); mặc định **TẮT** cho tới khi Boss đọc nhật ký thử 1 ngày (chạy "khô": chỉ ghi nhật ký, không gửi).
- **Rủi ro:** em vắng vì lý do chính đáng (ốm, nghỉ lễ) ⇒ ngày nghỉ và ca kiểm tra đang diễn ra không tính vắng; lời mẫu không trách, không doạ.
- **Ước công:** 0,5 ngày máy chủ; phần ≥ 5 ngày phụ thuộc Code 1.

## B11 · Tự canh sức khoẻ hệ thống
- **Việc:** mở rộng `sucKhoe` của `/gv/bang-tin` thành danh sách `canhBao[]` (mỗi dòng một câu tiếng Việt + mức xanh/vàng/đỏ): Bộ não A.I không chạy > **36 giờ** (hiện đang 26 giờ ở `sucKhoe`; chốt số nào); cron nhắc nộp bài không chiếm lượt > 45 phút trong khung giờ, hoặc có **lỗi** trong 24 giờ; tỉ lệ lời bị loại tăng (`ai_ban_tin.so_bi_loai/so_em` đêm nay ≥ 2× trung vị 7 đêm và ≥ 5 lời).
- **Ghi:** để biết "có lỗi", cần lưu lỗi cron — hiện chỉ `console.error`. Bảng mới `nhat_ky_may(id, luc, nguon, muc, chu)` (chỉ-thêm, giữ ≤ 500 dòng, chống trùng 1 dòng/nguồn/30 phút); các `catch` của cron nhắc nộp / mừng mốc / kéo lại ghi vào. Đọc-chỉ ở `/gv/bang-tin`.
- **Cờ/rào:** chỉ HIỂN THỊ (thầy đọc là biết); không gửi tin, không tự sửa; không lộ chi tiết kỹ thuật (câu chữ đơn giản: "Nhắc nộp bài lỗi lúc 13:30, máy sẽ thử lại").
- **Rủi ro:** báo động giả làm thầy nhờn ⇒ ngưỡng vàng trước, đỏ chỉ khi cả hai kênh trễ hoặc lỗi lặp ≥ 3 lượt liên tiếp.
- **Ước công:** 0,5 ngày máy chủ + test.

## Thứ tự đề nghị & câu cần Boss chốt
B11 (nền, để thấy lỗi của các việc còn lại) → B7 → B8 → B9 (dạng "chạy khô" trước). Cần chốt: (1) ngưỡng 26 hay 36 giờ cho Bộ não; (2) B7 có nhường bục cho em được vinh danh hôm qua không; (3) B8 không thêm EXP (đề xuất) hay có; (4) B9 bật thật sau bao lâu chạy khô.
