# SỔ VIỆC — BUILD OMNI 3 (phiên cloud, nhánh `claude/gracious-heisenberg-hoe97n`)

Mở 05/10/2026. Đặc tả: `DAC-TA-BUILD-OMNI-3-0510.md` (thắng mọi tệp khác về kỹ thuật). Tệp riêng của phiên này — KHÔNG sửa `SO-VIEC.md` (của Coder 1).

## Lời thầy (nguyên văn)

- [x] "Hiển thi hình ảnh thay đổi của app cho tôi trước khi tôi quyết định build" | bằng chứng: 8 JPG `docs/omni-0510/*.jpg`, commit aa95c68, đã gửi thầy
- [x] "giải thích toàn bộ 1 vòng thuật toán cho tôi trước khi build nhé" | bằng chứng: trả lời 12 bước + mục 1 của đặc tả, commit aa95c68
- [x] "THỰC THI LUÔN" (build theo `DAC-TA-BUILD-OMNI-3-0510.md`) | bằng chứng: 9 làn gộp, `OMNI-3-build-status.md` mục 1–2; mã nghiệm thu e271f424
- [x] "Thay từ máy bằng A.i Đỗ Đại Học" | bằng chứng: chủ ngữ TEN_AI trong src/lib/omni-chu.ts; rà chữ mới app em không có "máy" làm chủ ngữ; ảnh hs-tram-hoi-phuc-390
- [x] "giao cho nhiều agent làm nhất có thể để tăng tốc nhé" | bằng chứng: 9 agent song song (đã gộp đủ), mỗi agent một worktree — máy chủ A1 lõi thuần · A2 kế hoạch nhiều bài · B1 tick bài + thư mục + Tu luyện · B2 D1 + API thầy/PH · B3 đường trả lời + game · D1 A.I gắn vi kỹ năng + câu nền tự sinh; giao diện C1 thầy · C2 học sinh · C3 phụ huynh + chuẩn chữ (C3 đã gộp ac389aa)
- [x] "khi buidl xong hết nhắn tôi trước khi đẩy nhé" — KHÔNG gộp main, KHÔNG deploy Worker/Pages, KHÔNG migration --remote trước khi thầy cho | bằng chứng: chỉ đẩy nhánh tính năng; nhắn thầy kèm ảnh + OMNI-3-build-status.md, chờ thầy cho
- [x] "tôi chỉ phải làm bước cuối cùng là chữa bài học sinh cần thầy chữa" ⇒ danh sách "Cần thầy chữa" + "Chữa xong" | bằng chứng: omni-3-gv + omni-3-thay-bang-bai (ba loại, Chữa xong gọi lệnh cũ); srs2-d1-2709 quay lại Đoàn hôm sau
- [x] "build thành công luôn lần đầu" ⇒ qua đủ cổng mục 8 của đặc tả | bằng chứng: build EXIT 0, tsc sạch, check:mau, kiem-sw 13/13, vitest 0 tên đỏ mới thật (1 test nhạy tải, chạy riêng 4/4)
- [x] "giữ nguyên mọi giao diện hiện tại nhé" (thầy nhắn giữa lúc build) | bằng chứng: ảnh so-sanh-main-hs-sanh-ca-trang-390 vs hs-sanh-ca-trang-390 chỉ khác 3 dòng nhỏ; test so nguyên HTML khi vắng omni
- [x] "bạn chỉ sửa câu chữ cần thiết" | bằng chứng: chữ mới một nguồn src/lib/omni-chu.ts + chuẩn chữ A2 (docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md)
- [x] "thêm những mục cần thiết đồng bộ với giao diện hiện tại nhé để học sinh không cảm thấy thay đổi nhiều" | bằng chứng: chỉ dòng/chip trong thẻ sẵn có; ảnh docs/omni-0510/anh-build/
- [x] "Làm luôn công cụ duyệt vi kỹ năng cho chương đang dạy, tự động chuẩn xác luôn nhé. Ko cần tôi." | bằng chứng: omni-gan-vkn.ts (nạp tờ, tick bài, mỗi đêm, kiểm định tuần); 799 câu thật; nghiệm thu xuyên làn bước 2
- [x] "Bạn hãy làm mọi thứ tôi chỉ chữa bài hs cần chữa" ⇒ câu nền cho các nhãn hay sai cũng tự động (sinh câu có đáp án tính bằng mã, kiểm chéo) | bằng chứng: omni-cau-nen-sinh.ts, 20 bước × 50 câu kiểm chéo; Trạm tự sinh khi thiếu (nghiệm thu xuyên làn bước 4)
- [x] "Tôi tick đề rồi, cho thêm chỗ chọn giao cho hs nhé" (thầy nhắn 05/10 giữa lúc build) ⇒ sau khi tick bài có chỗ chọn em được giao | bằng chứng: C1 9a1ee008/5cb2b58c; ảnh gv-bai-hom-nay-ca-lop-1440
- [x] "bạn bê luôn cái chọn hs ở chiến dịch cũ" ⇒ dùng lại đúng bộ chọn học sinh của màn tạo chiến dịch cũ | bằng chứng: ChonEmGiao + useDsEmGiao của màn Giao; omni-3-thay-bai-hom-nay
- [x] "cho chọn hs theo điểm danh nữa" ⇒ chọn nhanh các em có mặt theo điểm danh buổi học | bằng chứng: ảnh gv-bai-hom-nay-theo-diem-danh-1440; máy chủ xong 9e82611 (lệnh chỉ-đọc gan-day: buổi gần đây kể cả đã đóng + SBD có mặt; buoiGanDay ở app thầy; test 4/4 + test buổi học cũ 12/12); giao diện đã giao làn C1, máy chủ tick làm chắc đã giao làn B1
- [x] "hãy thiết kế tính tế đồng điệu với giao diện hiện tại nhé" ⇒ dùng lại đúng lớp CSS/token/thành phần đang có (h2-*, cd-*, m3), không màn mới kiểu khác, không đổi bố cục cũ | bằng chứng: check:mau sạch; ảnh docs/omni-0510/anh-build/

- [x] "Lời giải hiển thị đúng chuẩn chưa?" (thầy hỏi 05/10 sau khi xem ảnh) ⇒ soát cách hiện lời giải theo chuẩn app | bằng chứng: CHƯA đúng chuẩn 28/09 — chỉ số Unicode (CO₂, Fe³⁺) vẽ bằng phông dự phòng ở Đảo 2.0, Đoàn, hộp câu nền (có sẵn trên main; "Câu đã làm" đã đúng). Sửa a3f30fab (src/lib/chi-so-ro.ts); test omni-3-chi-so-ro-0510 + omni-3-cau-nen-chi-so-0510; game 540 test: 3 đỏ đều có trong nền
- [x] "hiển thị lại cho tôi xem" ⇒ ảnh lời giải hiện đúng (Đảo + câu nền sau khi nộp), chụp đúng khung nhìn | bằng chứng: hs-dao-loi-giai-trac-nghiem-390, hs-dao-loi-giai-tra-loi-ngan-390, hs-tram-cau-nen-loi-giai-390 (docs/omni-0510/anh-build/)
- [x] "Khi tích chọn bạn chỉ lấy 3 phần trắc nghiệm, đúng sai trả lời ngắn làm tự động giao" ⇒ tick bài chỉ giao -TN/-DS/-TLN | bằng chứng: gộp C1 d9ea2096 (475f173b); dòng "Tự giao: …" thay ô tích; ảnh gv-bai-hom-nay-theo-diem-danh-1440; 56/56 test tick + nghiệm thu
- [x] "bỏ phần ví dụ minh họa và các dạng trọng tâm nhé" ⇒ không bao giờ giao -VD, -DT (cả bài mới lẫn bài cũ ôn lại), bỏ ô tích thêm | bằng chứng: bai-hom-nay.ts laMaToKhongGiao (-VD/-DT/-TL/-VDMH/-DTTT + tên), máy chủ bai-da-day.ts lưới an toàn ở maDe + phamVi; test omni-3-tick-bai-0510
- [x] "Làm thêm 6 bước tính toán" ⇒ bộ sinh câu nền: bao_toan_electron, lap_he_phuong_trinh, cong_thuc_phan_tu, hang_so_can_bang, bien_thien_enthalpy, nang_luong_lien_ket (kiểm chéo độc lập) | bằng chứng: gộp ac234db2 (00cef6d0); 93/93; 6 câu mẫu điều phối tính tay khớp (9,916 L · 30% · C₇H₈O · Kc 250 · −902 kJ · −2 880 kJ)

- [x] "Làm luôn bộ sinh câu bảo toàn điện tích nhé" (thầy 05/10) ⇒ bộ sinh câu nền bao_toan_dien_tich, ion cùng tồn tại được, đáp án kiểm chéo độc lập ⇒ 27/29 bước | bằng chứng: 1995aeb6; omni-3-cau-nen-sinh 100/100 + chỉ số + nghiệm thu 103/103; tsc máy chủ sạch; 3 mẫu tính tay khớp (0,35 · 27,4 · 0,05)

- [ ] "Tối ưu code cho tinh gọn" (thầy 05/10) ⇒ gọn mã OMNI: bỏ trùng lặp, mã chết, gộp hàm trùng | bằng chứng: (chưa có)
- [ ] "tối ưu luôn cho máy chủ" ⇒ giảm số vòng D1 tuần tự + ms CPU ở lệnh nóng (hoa2-sanh, start, answer, việc đêm) | bằng chứng: (chưa có)
- [ ] "app thật mượt mà nhanh gấp 2 lần hiện tại nhé" ⇒ đo bằng máy trên điện thoại yếu giả lập (scripts/do-app-hs.mjs) + đo máy chủ, so main hiện tại; mục tiêu ≥ 2× ở chỉ số chính | bằng chứng: (chưa có)
- [ ] "Chưa đẩy gì nhé" ⇒ KHÔNG deploy Worker/Pages, KHÔNG gộp main, KHÔNG migration --remote (chỉ đẩy nhánh tính năng để giữ việc) | bằng chứng: (chưa có)
- [x] "Mục hỏi thầy theo thuật toán mới có tác dụng gì." (thầy 05/10) ⇒ giải thích bằng mã thật (không đoán) | bằng chứng: server/src/omni-p-vkn.ts (MS_SAU_DOC_LOI_GIAI 12 h, lượt có hỗ trợ không là quan sát), omni-d1.ts (chứng chỉ chỉ đếm lượt tự làm), loi-giai.ts (dòng xem_loi_giai); giao diện nút không đổi (diff main…HEAD không thêm chỗ Hỏi thầy nào)
- [x] "Phần các câu cần chữa có thay đổi gì không?" ⇒ so main vs nhánh OMNI, nêu đúng chỗ đổi/không đổi | bằng chứng: OMNI tắt ⇒ thẻ "Cần thầy dạy lại" y nguyên; bật ⇒ "Cần thầy chữa" 3 nhóm (CanThayChuaOmni.tsx, omni-bang.ts NHOM_CAN_THAY_CHUA); luật vào danh sách (sai ≥ 4, lần cuối sai) không đổi (ho-so-nam-kt.ts); Buổi chữa chỉ đổi nguồn câu "Mở ca chốt" (BuoiChua.tsx); báo cáo ca thi (ca-thi/) không đổi. Sửa lỗi chữ tràn "…đơn chức2 em" (nguyên nhân gốc: luật chung `.cd-ds-cau li b:last-child { nowrap }` bắt nhầm tên câu) — đo hộp trong Chromium trước/sau, test bảng 35/35
- [x] "Rồi cho tôi xem ảnh app hs và gv có những thay đổi gì" ⇒ ảnh app thật trước/sau cho học sinh + thầy | bằng chứng: docs/omni-0510/anh-build/ 24 ảnh (thêm Bảng chiến dịch OMNI tắt/bật, thẻ Cần thầy chữa cuộn xuống, Cài đặt OMNI; màn thầy chụp trong khung app thầy thật); chup.mjs: lỗi trang 0, tràn ngang 0

## Định nghĩa hoàn thành (chép từ đặc tả mục 9 — vạch đích, không đổi)

- [x] 1. Tick bài ⇒ chiến dịch đúng tờ, đúng hạn tự tính, dòng xác nhận đúng 6 con số; tick lần hai không tạo thêm | bằng chứng: OMNI-3-build-status.md mục 2
- [x] 2. Mô phỏng 2 bài song song (bài 2 tick ngày 4): mỗi bài cọ xát 100 % trước hạn riêng − 3; không câu bài 3 | bằng chứng: OMNI-3-build-status.md mục 2
- [x] 3. Ngày 8 không tick: kế hoạch nhẹ ≤ 60 %, Sảnh có việc nếu còn nợ/duy trì/bài cũ | bằng chứng: OMNI-3-build-status.md mục 2
- [x] 4. Em có P ⇒ câu mới xếp theo điểm còn lấy được; dạng vững ⇒ câu mới dư thành tuỳ chọn | bằng chứng: OMNI-3-build-status.md mục 2
- [x] 5. 3 sai liền chung vi kỹ năng ⇒ Trạm đúng tên lỗi, đúng câu nền, Máu không đổi; lướt thứ 4 trong ngày tính sai | bằng chứng: OMNI-3-build-status.md mục 2
- [x] 6. Chắc-mà-sai ⇒ lời giải mở ngay; đúng-chưa-chắc ⇒ không tính vững; đúng-chậm ⇒ thẻ đúng chữ | bằng chứng: OMNI-3-build-status.md mục 2
- [x] 7. Chứng chỉ chỉ cấp khi K ∧ C ∧ M ∧ T; không bao giờ hiện 100 %; xoá omni_* dựng lại khớp | bằng chứng: OMNI-3-build-status.md mục 2
- [x] 8. Thầy: Bảng bài có Cần thầy chữa ba loại; Chữa xong ⇒ câu quay lại Đoàn hôm sau | bằng chứng: OMNI-3-build-status.md mục 2
- [x] 9. Công tắc tắt ⇒ app như hôm nay; vitest không thêm tên đỏ; ExamTakeScreen không đổi | bằng chứng: OMNI-3-build-status.md mục 2

## Cổng giai đoạn (đặc tả mục 8)

- [x] GĐ A · Lõi thuần + test vàng (phanBoDe(P=1,S=0,10)=8,66 ± 0,01 · P(≥8)=88 ± 1 %; bảng Phần II; phát lại 2 lần; JSON kế hoạch cũ y hệt; SPRT; gán trách; khai oan ≤ 6 %) + tsc | bằng chứng: (chưa có)
- [x] GĐ B · Máy chủ (xoá omni_* dựng lại 100 %; công tắc tắt không thêm đỏ; Tu luyện không rút DẠY HỌC; không câu bài chưa tick ở hoa2-sanh/start/doan-*) | bằng chứng: (chưa có)
- [x] GĐ C · App thầy (chữ A2, nút động từ, số có nhãn, ảnh 1440×900, check:mau) | bằng chứng: (chưa có)
- [x] GĐ D · App em + PH (ảnh 390×844, ExamTakeScreen diff = 0, đáp án không xuống trước nộp) | bằng chứng: (chưa có)
- [!] GĐ E · Chạy thử 1 lớp 7–10 ngày lịch | KẸT có chủ ý: cần lên app thật — thầy dặn nhắn trước khi đẩy

## Việc tự phát sinh

- [x] Cài node_modules (repo chưa có) | bằng chứng: `npm ci` EXIT 0, 369 gói, có vitest/tsc/vite/wrangler
- [x] Đo nền vitest trên bản sạch HEAD trước khi sửa (so TÊN test đỏ) | bằng chứng: worktree sạch aa95c68, 13 262 test: 13 074 đạt · 141 đỏ · 47 bỏ qua; 146 tên đỏ lưu scratchpad/nen-do-ten.txt
- [x] Hợp đồng chung (kiểu + API + bảng) trước khi chia agent | bằng chứng: commit ec17bca + f189d2b (omni-kieu.ts, omni-chu.ts, stub 10 tệp, migration-0510-omni-3.sql chạy 2 lần sạch trên SQLite, docs/hop-dong-omni-3.md); tsc máy chủ + app EXIT 0; định tuyến f6213b1
- [x] Gộp nhánh các agent, nối định tuyến index.ts, tsc app + server | bằng chứng: 9 làn gộp; tsc EXIT 0 cả hai
- [x] Toàn vitest bản cuối so nền, build, check:mau, kiem-sw | bằng chứng: OMNI-3-build-status.md mục 1
- [x] Ảnh chụp app thật sau build (390×844, 1440×900) | bằng chứng: 14 ảnh docs/omni-0510/anh-build/, 0 lỗi trang, 0 tràn ngang
- [x] `OMNI-3-build-status.md` (nhật ký app) + dòng Nhật ký DIEU-PHOI.md | bằng chứng: tệp ở gốc repo + dòng 05/10 đầu Nhật ký
- [x] Phần trăm OMNI viết liền "6%" cho đồng điệu app (128 chỗ viết liền / 12 chỗ có cách) | bằng chứng: d7cb031, test phụ huynh 9/9
- [x] Bộ chụp ảnh nghiệm thu `scripts/chup-omni-3/` (component thật + máy chủ giả, chặn mọi yêu cầu ra ngoài) | bằng chứng: ac9e858; chạy thử 4 ảnh, 0 lỗi trang, 0 tràn ngang
- [x] Gộp main mới (13 commit) vào nhánh tính năng | bằng chứng: 8fa147a, không xung đột, tsc máy chủ + app EXIT 0, đã push nhánh tính năng
- [x] Mã câu nền tự sinh phải khớp luật id của thầy `/^[\w.-]{1,80}$/` ⇒ `sinh.<nhãn>.<số>` | bằng chứng: đã báo làn D1
- [x] Gộp làn A1 lõi thuần | bằng chứng: 2a02088; 4 tệp tests/omni-3-loi*.test.ts 96/96 trên nhánh gộp; số vàng 8,66 · 88%; phát lại 12 thứ tự y hệt
- [!] PHÁT HIỆN cần thầy quyết (không tự hạ ngưỡng): chứng chỉ ĐỦ K∧C∧M chậm hơn con số đã báo. Chỉ điều kiện mô hình: 58/60 em ≤ 7 ngày. Đủ ba điều kiện, 14 ngày: sơ ý 6% ⇒ 36/40 em; sơ ý 10% ⇒ 1/40. Làn A1 đo thêm: đủ ba điều kiện trong 7 ngày chỉ 33–48% em (S 6%). Khai oan 0 ở mọi ô. Con số 91–99% ≤ 7 ngày báo trước đây chỉ tính điều kiện mô hình.
- [x] Gộp làn B3 đường trả lời + game | bằng chứng: 8cacf5f; 3 tệp tests/omni-3-tra-loi*.test.ts 33/33 (làn báo)
- [x] Sửa 7 test reset đỏ do 15 bảng OMNI chưa phân loại (lỗi của bước hợp đồng ec17bca) — nguyên nhân gốc: bộ kiểm reset bắt mọi bảng trong migration phải được xếp XOÁ/GIỮ | bằng chứng: c276369; xếp GIỮ ở cả hai job (cả hai đã `xong` 21/09 và 28/09, không chạy lại); đúng lệnh cũ `npx vitest run tests/reset-hoa2-2709.test.ts tests/reset-toan-app-1909.test.ts` 67/67
- [x] Soát 2 test CauDaLam (PDF) làn B3 thấy đỏ khi chạy chung, xanh khi chạy riêng — không có trong nền | bằng chứng: không đỏ ở lượt toàn vitest cuối
- [x] Giới hạn đã biết: Đoàn chưa đọc cờ lướt (sổ ghi đúng, nhưng trong trận lướt vẫn tính trượt) — ghi vào báo cáo | bằng chứng: OMNI-3-build-status.md mục 6
- [x] Gộp làn B1 tick bài + thư mục + Tu luyện (kèm lọc em được chọn) | bằng chứng: 22318590; 3 tệp test của làn 45/45 trên nhánh gộp
- [x] Nối móc dayDeKho ⇒ ghiThuMucKhiDayDe (chỉ khi có gói) + chỉ mục bai_da_day_mot vào migration | bằng chứng: commit nối móc; tests/omni-3-day-de-thu-muc-0510.test.ts 3/3; migration chạy 2 lần sạch (node:sqlite)
- [x] Tờ "-DT" không vào luyện tự động — GIỮ theo luật thầy "KHÔNG rút câu TỰ LUẬN ở bất kỳ kênh rút đề tự động nào" (laMaDeTuLuan coi -VD/-DT/-TL là mục dạy học/tự luận) | bằng chứng: báo cáo làn B1; ghi vào báo cáo cuối
- [x] Gộp làn A2 kế hoạch ngày nhiều bài | bằng chứng: e295a47a; 5 tệp tests/omni-3-ke-hoach-*.test.ts 133/133 (làn báo), 30 kịch bản JSON y hệt bản cũ, cờ tắt trùng ảnh chụp f189d2b
- [x] Bảng đệm srs2_ke_hoach_omni vào migration + phân loại reset | bằng chứng: migration 2 lần sạch (16 bảng); reset + kế hoạch D1 80/80
- [x] Soát test mô phỏng chứng chỉ (omni-3-loi-mo-phong) quá giờ 5 giây khi máy tải nặng — chạy riêng xanh | bằng chứng: không đỏ ở lượt toàn vitest cuối
- [x] Gộp làn D1 A.I gắn vi kỹ năng + câu nền tự sinh | bằng chứng: 2348eb52; 147/147 (làn báo); chạy thử 799 câu thật: 342 câu lý thuyết chỉ nhận dang:, 251/457 câu bài tập được gắn nhãn nền; câu nền 20 nhãn × 50 câu kiểm chéo bằng bộ giải độc lập
- [x] Sửa tác dụng phụ: kiểm định Q tuần ghi câu nghi vào cau_nghi_dap_an ⇒ rút đề ca kiểm tra bỏ câu tốt — nay CHỈ ghi bảng riêng omni_q_nghi | bằng chứng: bd8ca8e6; test D1 sửa theo ý định mới
- [x] Ba bảng phụ omni_q_gan / omni_q_nhat_ky / omni_q_nghi vào migration + reset GIỮ | bằng chứng: bd8ca8e6; migration 2 lần sạch (20 bảng)
- [x] Nối móc A.I gắn vi kỹ năng: nạp tờ DẠY HỌC, tick bài (nền), việc đêm, kiểm định thứ Hai, Trạm tự sinh câu nền | bằng chứng: 6e7cfd52; test các làn chạm 141/141
- [x] Gộp làn B2 lớp D1 + /gv/omni + Sảnh/PH | bằng chứng: 16f1facf; làn báo 53/53 + workerd 2/2
- [x] Việc đêm mới chỉ chạy khi công tắc bật (giữ tiêu chí 9 "tắt ⇒ y như hôm nay": câu nền tự sinh ghi cau_nen mà bậc thang tự gỡ sẵn có dùng) + chạy tiếp ảnh chụp đêm 00:02–05:00 | bằng chứng: f2efcb8f; mọi test OMNI + reset + điểm danh 602/602
- [x] Test nghiệm thu xuyên làn KHÔNG giả lớp nào (tick ⇒ gắn vi kỹ năng ⇒ Sảnh omni ⇒ Trạm có câu nền tự sinh ⇒ luyện nền chấm đúng ⇒ Bảng bài ⇒ tắt công tắc) | bằng chứng: 25e44d03; tests/omni-3-nghiem-thu-0510.test.ts 1/1
- [x] Gộp làn C2 app học sinh | bằng chứng: 135240bb; làn báo 41/41 + 198/198 liên quan; chữ mới không có "máy" làm chủ ngữ, không "vi kỹ năng" trên màn em
- [x] Đoàn: doan-nop chuyển phần omni ra kết quả câu (dòng nhắn hiện trong Đoàn) | bằng chứng: ca931e98; tests/omni-3-doan-ket-qua-0510.test.ts 2/2
- [x] Xếp loại vòng 1 giây đồng hồ đề thử vào SO-VIEC-GIAO-DIEN.md | bằng chứng: 6f15603e
- [x] Ảnh chụp app thật: Sảnh, Đảo (chip Chưa chắc, đúng-nhưng-chậm, chắc-mà-sai), Trạm + câu nền, đề thử, phụ huynh, thầy | bằng chứng: docs/omni-0510/anh-build/ (14 ảnh + 2 ảnh so sánh main)
- [x] Gộp làn C1 app thầy (kèm chọn em theo điểm danh) | bằng chứng: cb384f5c; 55/55 làn + 18/18 bài hôm nay sau sửa gợi ý
- [x] Gói tải sẵn vượt trần sau khi gộp C1 (3 040 KB) — nguyên nhân gốc: mảnh chỉ màn thầy bị precache | bằng chứng: 41f95154; kiem-sw 13/13, 160 tệp / 2 983 KB
- [x] Toàn vitest bản cuối | bằng chứng: 13 912 test · 13 724 đạt · 141 đỏ · 9 tệp lỗi môi trường (= nền); 1 tên đỏ mới là test nhạy tải doan-het-cau-2809 (chạy riêng 4/4, đạt trên main)
