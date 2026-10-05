# SỔ VIỆC — BUILD OMNI 3 (phiên cloud, nhánh `claude/gracious-heisenberg-hoe97n`)

Mở 05/10/2026. Đặc tả: `DAC-TA-BUILD-OMNI-3-0510.md` (thắng mọi tệp khác về kỹ thuật). Tệp riêng của phiên này — KHÔNG sửa `SO-VIEC.md` (của Coder 1).

## Lời thầy (nguyên văn)

- [x] "Hiển thi hình ảnh thay đổi của app cho tôi trước khi tôi quyết định build" | bằng chứng: 8 JPG `docs/omni-0510/*.jpg`, commit aa95c68, đã gửi thầy
- [x] "giải thích toàn bộ 1 vòng thuật toán cho tôi trước khi build nhé" | bằng chứng: trả lời 12 bước + mục 1 của đặc tả, commit aa95c68
- [ ] "THỰC THI LUÔN" (build theo `DAC-TA-BUILD-OMNI-3-0510.md`) | bằng chứng: (chưa có)
- [ ] "Thay từ máy bằng A.i Đỗ Đại Học" | bằng chứng: (chưa có)
- [ ] "giao cho nhiều agent làm nhất có thể để tăng tốc nhé" | bằng chứng: 9 agent song song, mỗi agent một worktree — máy chủ A1 lõi thuần · A2 kế hoạch nhiều bài · B1 tick bài + thư mục + Tu luyện · B2 D1 + API thầy/PH · B3 đường trả lời + game · D1 A.I gắn vi kỹ năng + câu nền tự sinh; giao diện C1 thầy · C2 học sinh · C3 phụ huynh + chuẩn chữ (C3 đã gộp ac389aa)
- [ ] "khi buidl xong hết nhắn tôi trước khi đẩy nhé" — KHÔNG gộp main, KHÔNG deploy Worker/Pages, KHÔNG migration --remote trước khi thầy cho | bằng chứng: (chưa có)
- [ ] "tôi chỉ phải làm bước cuối cùng là chữa bài học sinh cần thầy chữa" ⇒ danh sách "Cần thầy chữa" + "Chữa xong" | bằng chứng: (chưa có)
- [ ] "build thành công luôn lần đầu" ⇒ qua đủ cổng mục 8 của đặc tả | bằng chứng: (chưa có)
- [ ] "giữ nguyên mọi giao diện hiện tại nhé" (thầy nhắn giữa lúc build) | bằng chứng: (chưa có)
- [ ] "bạn chỉ sửa câu chữ cần thiết" | bằng chứng: (chưa có)
- [ ] "thêm những mục cần thiết đồng bộ với giao diện hiện tại nhé để học sinh không cảm thấy thay đổi nhiều" | bằng chứng: (chưa có)
- [ ] "Làm luôn công cụ duyệt vi kỹ năng cho chương đang dạy, tự động chuẩn xác luôn nhé. Ko cần tôi." | bằng chứng: (chưa có)
- [ ] "Bạn hãy làm mọi thứ tôi chỉ chữa bài hs cần chữa" ⇒ câu nền cho các nhãn hay sai cũng tự động (sinh câu có đáp án tính bằng mã, kiểm chéo) | bằng chứng: (chưa có)
- [ ] "hãy thiết kế tính tế đồng điệu với giao diện hiện tại nhé" ⇒ dùng lại đúng lớp CSS/token/thành phần đang có (h2-*, cd-*, m3), không màn mới kiểu khác, không đổi bố cục cũ | bằng chứng: (chưa có)

## Định nghĩa hoàn thành (chép từ đặc tả mục 9 — vạch đích, không đổi)

- [ ] 1. Tick bài ⇒ chiến dịch đúng tờ, đúng hạn tự tính, dòng xác nhận đúng 6 con số; tick lần hai không tạo thêm | bằng chứng: (chưa có)
- [ ] 2. Mô phỏng 2 bài song song (bài 2 tick ngày 4): mỗi bài cọ xát 100 % trước hạn riêng − 3; không câu bài 3 | bằng chứng: (chưa có)
- [ ] 3. Ngày 8 không tick: kế hoạch nhẹ ≤ 60 %, Sảnh có việc nếu còn nợ/duy trì/bài cũ | bằng chứng: (chưa có)
- [ ] 4. Em có P ⇒ câu mới xếp theo điểm còn lấy được; dạng vững ⇒ câu mới dư thành tuỳ chọn | bằng chứng: (chưa có)
- [ ] 5. 3 sai liền chung vi kỹ năng ⇒ Trạm đúng tên lỗi, đúng câu nền, Máu không đổi; lướt thứ 4 trong ngày tính sai | bằng chứng: (chưa có)
- [ ] 6. Chắc-mà-sai ⇒ lời giải mở ngay; đúng-chưa-chắc ⇒ không tính vững; đúng-chậm ⇒ thẻ đúng chữ | bằng chứng: (chưa có)
- [ ] 7. Chứng chỉ chỉ cấp khi K ∧ C ∧ M ∧ T; không bao giờ hiện 100 %; xoá omni_* dựng lại khớp | bằng chứng: (chưa có)
- [ ] 8. Thầy: Bảng bài có Cần thầy chữa ba loại; Chữa xong ⇒ câu quay lại Đoàn hôm sau | bằng chứng: (chưa có)
- [ ] 9. Công tắc tắt ⇒ app như hôm nay; vitest không thêm tên đỏ; ExamTakeScreen không đổi | bằng chứng: (chưa có)

## Cổng giai đoạn (đặc tả mục 8)

- [ ] GĐ A · Lõi thuần + test vàng (phanBoDe(P=1,S=0,10)=8,66 ± 0,01 · P(≥8)=88 ± 1 %; bảng Phần II; phát lại 2 lần; JSON kế hoạch cũ y hệt; SPRT; gán trách; khai oan ≤ 6 %) + tsc | bằng chứng: (chưa có)
- [ ] GĐ B · Máy chủ (xoá omni_* dựng lại 100 %; công tắc tắt không thêm đỏ; Tu luyện không rút DẠY HỌC; không câu bài chưa tick ở hoa2-sanh/start/doan-*) | bằng chứng: (chưa có)
- [ ] GĐ C · App thầy (chữ A2, nút động từ, số có nhãn, ảnh 1440×900, check:mau) | bằng chứng: (chưa có)
- [ ] GĐ D · App em + PH (ảnh 390×844, ExamTakeScreen diff = 0, đáp án không xuống trước nộp) | bằng chứng: (chưa có)
- [!] GĐ E · Chạy thử 1 lớp 7–10 ngày lịch | KẸT có chủ ý: cần lên app thật — thầy dặn nhắn trước khi đẩy

## Việc tự phát sinh

- [x] Cài node_modules (repo chưa có) | bằng chứng: `npm ci` EXIT 0, 369 gói, có vitest/tsc/vite/wrangler
- [x] Đo nền vitest trên bản sạch HEAD trước khi sửa (so TÊN test đỏ) | bằng chứng: worktree sạch aa95c68, 13 262 test: 13 074 đạt · 141 đỏ · 47 bỏ qua; 146 tên đỏ lưu scratchpad/nen-do-ten.txt
- [x] Hợp đồng chung (kiểu + API + bảng) trước khi chia agent | bằng chứng: commit ec17bca + f189d2b (omni-kieu.ts, omni-chu.ts, stub 10 tệp, migration-0510-omni-3.sql chạy 2 lần sạch trên SQLite, docs/hop-dong-omni-3.md); tsc máy chủ + app EXIT 0; định tuyến f6213b1
- [ ] Gộp nhánh các agent, nối định tuyến index.ts, tsc app + server | bằng chứng: (chưa có)
- [ ] Toàn vitest bản cuối so nền, build, check:mau, kiem-sw | bằng chứng: (chưa có)
- [ ] Ảnh chụp app thật sau build (390×844, 1440×900) | bằng chứng: (chưa có)
- [ ] `OMNI-3-build-status.md` (nhật ký app) + dòng Nhật ký DIEU-PHOI.md | bằng chứng: (chưa có)
- [x] Phần trăm OMNI viết liền "6%" cho đồng điệu app (128 chỗ viết liền / 12 chỗ có cách) | bằng chứng: d7cb031, test phụ huynh 9/9
- [x] Bộ chụp ảnh nghiệm thu `scripts/chup-omni-3/` (component thật + máy chủ giả, chặn mọi yêu cầu ra ngoài) | bằng chứng: ac9e858; chạy thử 4 ảnh, 0 lỗi trang, 0 tràn ngang
- [x] Gộp main mới (13 commit) vào nhánh tính năng | bằng chứng: 8fa147a, không xung đột, tsc máy chủ + app EXIT 0, đã push nhánh tính năng
- [x] Mã câu nền tự sinh phải khớp luật id của thầy `/^[\w.-]{1,80}$/` ⇒ `sinh.<nhãn>.<số>` | bằng chứng: đã báo làn D1
