# OMNI 3 — trạng thái build (05/10/2026)

**Kết luận: BUILD XONG · CHƯA PHÁT HÀNH.** Thầy dặn "khi build xong hết nhắn tôi trước khi đẩy" ⇒ chưa gộp `main`, chưa đẩy Worker/Pages, chưa chạy migration `--remote`. Chỉ đẩy nhánh `claude/gracious-heisenberg-hoe97n`.

- Đặc tả: `DAC-TA-BUILD-OMNI-3-0510.md` · hợp đồng: `docs/hop-dong-omni-3.md` · sổ việc: `SO-VIEC-OMNI-3.md`
- Mã commit nghiệm thu: `e271f424` (109 commit trên `main` 416ee47, gồm 30 commit gộp: 9 làn + `main` mới)
- Công tắc `cau_hinh.omni` mặc định TẮT ⇒ phát hành xong chưa em nào thấy gì mới cho tới khi thầy bật theo lớp ở Cài đặt.

## 1. Bảng nghiệm thu (số liệu là kết quả thật của lệnh chạy trong phiên)

| Việc | Cách đo | Kết quả | Đạt/Trượt |
|---|---|---|---|
| Toàn bộ vitest so nền | `npx vitest run` (JSON), so TÊN với nền `aa95c68` | 13 912 test: 13 724 đạt · 141 đỏ · 47 bỏ qua; 9 tệp lỗi môi trường (đúng 9 tệp của nền). Tên đỏ mới: 1 — `doan-het-cau-2809` "đi một mình… 2 câu" (sao tính theo máu, test chạy theo đồng hồ thật ⇒ máy quá tải thì quái kịp đánh); chạy riêng 4/4 đạt trên nhánh, đạt trên `main` | Đạt |
| Test OMNI + reset + điểm danh + nhịp | `npx vitest run tests/omni-3-*.test.ts* tests/reset-* tests/buoi-hoc-may-chu-2809… tests/nhip-bang-2109…` | 38 tệp · 723/723 | Đạt |
| Nghiệm thu xuyên làn không giả lớp nào | `tests/omni-3-nghiem-thu-0510.test.ts` | 1/1: tick (chọn em, lọc SBD lạ, tick lần hai không tạo thêm) ⇒ A.I gắn vi kỹ năng ⇒ Sảnh omni ⇒ Trạm có câu nền tự sinh ⇒ luyện nền chấm đúng ⇒ Bảng bài ⇒ tắt công tắc y như cũ | Đạt |
| Kiểm kiểu | `cd server && npx tsc --noEmit -p tsconfig.json` · `npx tsc --noEmit -p tsconfig.app.json` | EXIT 0 · EXIT 0 | Đạt |
| Build | `npm run build` | EXIT 0 | Đạt |
| Màu | `npm run check:mau` | "Không có mã màu # nào ngoài src/styles/tokens.css" | Đạt |
| Service worker | `node scripts/kiem-sw.mjs` | 13/13 · precache 160 tệp / 2 983 KB (trần 170 / 3 000; `main` 2 993 KB) | Đạt |
| Màn thi không đổi | `git diff origin/main HEAD -- src/screens/ExamTakeScreen.tsx` | 0 dòng | Đạt |
| Migration chỉ-thêm | chạy `server/migration-0510-omni-3.sql` 2 lần trên node:sqlite | sạch cả 2 lần, 20 bảng; không ALTER bảng cũ | Đạt |
| Ảnh app thật | `scripts/chup-omni-3/` (component thật + máy chủ giả, chặn mọi yêu cầu ra ngoài) | 14 ảnh · 0 lỗi trang · 0 tràn ngang (`docs/omni-0510/anh-build/`) | Đạt |

## 2. Định nghĩa hoàn thành (đặc tả mục 9)

| # | Tiêu chí | Bằng chứng |
|---|---|---|
| 1 | Tick bài ⇒ chiến dịch đúng tờ, hạn tự tính, xác nhận đúng 6 con số; tick lần hai không tạo thêm | `omni-3-tick-bai-0510` (máy chủ), `omni-3-thay-bai-hom-nay` 18/18 (6 con số, giao đúng maDe/phamVi), nghiệm thu xuyên làn (tick lần hai `daCo`); ảnh `gv-bai-hom-nay-*` |
| 2 | Hai bài song song (bài 2 tick ngày 4): mỗi bài cọ xát 100% trước hạn riêng − 3; không câu bài 3 | `omni-3-ke-hoach-mo-phong` (40 em × 2 bài) |
| 3 | Ngày 8 không tick: kế hoạch ≤ 60%, Sảnh vẫn có việc | `omni-3-ke-hoach-*` (chế độ chờ trần 24/40), Sảnh `choBaiMoi`; ảnh `hs-sanh-cho-bai-moi-ca-trang-390` |
| 4 | Câu mới xếp theo điểm còn lấy được; dạng vững ⇒ câu mới dư thành tuỳ chọn | `omni-3-ke-hoach-loi` (trongSoCau, dangVung) |
| 5 | 3 sai liền chung bước ⇒ Trạm đúng tên lỗi, đúng câu nền, Máu không đổi; lướt thứ 4 tính sai | `omni-3-tra-loi*` 33/33, nghiệm thu xuyên làn; ảnh `hs-tram-hoi-phuc-390`, `hs-tram-cau-nen-390` |
| 6 | Chắc mà sai ⇒ lời giải mở ngay; đúng-chưa-chắc không tính vững; đúng-chậm đúng chữ | `omni-3-tra-loi`, `omni-3-dao-hs`; ảnh `hs-dao-chac-ma-sai-*`, `hs-dao-dung-nhung-cham-*`, `hs-dao-cau-co-chip-chua-chac-390` |
| 7 | Chứng chỉ chỉ khi K∧C∧M∧T; không bao giờ 100%; xoá omni_* dựng lại khớp | `omni-3-loi-chung-chi`, `omni-3-d1-that` (xoá bảng đệm ⇒ y hệt), `doTinChu` kẹp 99% |
| 8 | Bảng bài có Cần thầy chữa ba loại; Chữa xong ⇒ câu quay lại Đoàn hôm sau | `omni-3-gv` + `omni-3-thay-bang-bai` (ba loại, nút gọi đúng lệnh cũ `chua-xong`), `srs2-d1-2709` "Chữa xong ⇒ quay lại Đoàn hôm sau" (xanh) |
| 9 | Công tắc tắt ⇒ app như hôm nay; vitest không thêm tên đỏ; màn thi không đổi | `omni-3-ke-hoach-co-tat` (30 kịch bản JSON y hệt), nghiệm thu xuyên làn bước 7, mục 1 ở trên; ảnh so sánh `so-sanh-main-*` |

## 3. Lệnh thầy giữa lúc build

| Lệnh (nguyên văn) | Đã làm | Bằng chứng |
|---|---|---|
| "Thay từ máy bằng A.i Đỗ Đại Học" | Chữ mới lấy chủ ngữ `TEN_AI` trong `src/lib/omni-chu.ts`; rà chữ mới của app em: không "máy" làm chủ ngữ | ảnh Trạm: "A.I Đỗ Đại Học cho em 3 câu nhỏ…" |
| "giữ nguyên mọi giao diện hiện tại… chỉ sửa câu chữ cần thiết… đồng bộ" | Chỉ thêm dòng/chip trong thẻ sẵn có, dùng lớp h2-*/dao2-*/ph3-*/cd-*; vắng `omni` ⇒ DOM y hệt (test so nguyên HTML) | `so-sanh-main-hs-sanh-ca-trang-390` vs `hs-sanh-ca-trang-390`: chỉ khác 3 dòng nhỏ trong thẻ chiến dịch |
| "Làm luôn công cụ duyệt vi kỹ năng… tự động chuẩn xác… Ko cần tôi" | A.I tự gắn `dang:` + `nen:` lúc nạp tờ DẠY HỌC, lúc tick bài, mỗi đêm; tự kiểm định tuần; thầy chỉ xem nếu muốn | `omni-3-gan-vkn*`; chạy thử 799 câu thật: 342 câu lý thuyết chỉ nhận `dang:`; 251/457 câu bài tập có nhãn nền |
| "Bạn hãy làm mọi thứ tôi chỉ chữa bài hs cần chữa" | Câu nền tự sinh cho 20 bước tính toán, đáp án tính bằng mã, kiểm chéo bằng bộ giải độc lập | `omni-3-cau-nen-sinh` (20 × 50 câu khớp) |
| "Tôi tick đề rồi, cho thêm chỗ chọn giao cho hs… bê luôn cái chọn hs ở chiến dịch cũ, cho chọn hs theo điểm danh" | Bộ chọn Khối › Lớp › Em của màn Giao cũ + hàng "Theo điểm danh" (buổi đang mở + 3 buổi gần nhất) + "Cả lớp"; máy chủ lọc SBD lạ/trùng/khoá, em vắng không bị ghi "đã dạy"; lệnh chỉ-đọc `/gv/buoi-hoc gan-day` | `omni-3-buoi-gan-day-0510` 4/4, `omni-3-thay-bai-hom-nay`, nghiệm thu xuyên làn; ảnh `gv-bai-hom-nay-theo-diem-danh-1440` |

## 4. Các làn (agent song song, mỗi làn một worktree) và commit gộp

| Làn | Phạm vi | Commit gộp |
|---|---|---|
| A1 | Lõi thuần: P vi kỹ năng (Bayes cổng AND), SPRT, tốc độ, dự báo PMF, chứng chỉ, mệt giờ, Q gợi ý | 2a02088 |
| A2 | Kế hoạch ngày nhiều bài, ôn bài cũ, chế độ chờ, Để mai/Làm luôn | e295a47a |
| B1 | Tick bài ⇒ chiến dịch theo bài (chọn em), hai thư mục kho, Tu luyện chỉ rút TU LUYỆN | 22318590 |
| B2 | Lớp D1 OMNI, `/gv/omni`, Sảnh + phụ huynh có omni, ảnh chụp đêm, hiệu chỉnh tuần | 16f1facf |
| B3 | Đường trả lời (msLam, tự tin, lướt, chắc mà sai), Trạm, vé, đề thử, FSRS 4 mức | 8cacf5f |
| C1 | App thầy: Bài hôm nay, Bảng bài + Cần thầy chữa, vi kỹ năng, công tắc theo lớp, ca chốt | cb384f5c |
| C2 | App em: dòng Sảnh, chip Chưa chắc, dòng nhắn, Trạm, vé, đề thử | 135240bb |
| C3 | App phụ huynh + chuẩn chữ A2 | ac389aa |
| D1 | A.I tự gắn vi kỹ năng + câu nền tự sinh | 2348eb52 |

## 5. Sửa trong lúc gộp (nguyên nhân gốc → sửa → đo lại đúng lệnh cũ)

1. **7 test reset đỏ** — 15 bảng OMNI chưa được xếp XOÁ/GIỮ (lỗi của bước hợp đồng). Cả hai job reset đã chạy xong (21/09, 28/09), không chạy lại ⇒ xếp GIỮ. `c276369`; 67/67.
2. **Kiểm định Q ghi câu nghi vào `cau_nghi_dap_an`** ⇒ rút đề ca kiểm tra bỏ câu tốt. "Q chưa giải thích được" ≠ đáp án sai ⇒ chỉ ghi bảng riêng `omni_q_nghi`. `bd8ca8e6`.
3. **Việc đêm mới chạy cả khi công tắc tắt** (câu nền tự sinh ghi `cau_nen` mà bậc thang tự gỡ sẵn có dùng ⇒ phạm tiêu chí 9) ⇒ chỉ chạy khi bật. `f2efcb8f`.
4. **Gói tải sẵn vượt trần (3 040 KB)** — mảnh chỉ màn thầy bị cất xuống máy em ⇒ đưa ra kho chạy-lúc (đồ thị nhập đã soát) + "Làm câu ôn" (nạp lười, cần mạng). `41f95154`; 13/13.
5. **Mã câu nền tự sinh** phải khớp luật id của thầy `/^[\w.-]{1,80}$/` ⇒ `sinh.<nhãn>.<số>`.
6. **Đoàn chưa chuyển phần omni** ⇒ `doan-nop` chuyển ra kết quả câu. `ca931e98`.
7. **Phần trăm** viết liền "6%" như phần lớn app. `d7cb031`.
8. **Gợi ý quá tải** luôn khuyên bỏ tờ "Các dạng toán trọng tâm" (tờ đó vốn bị loại vì tự luận) ⇒ "bỏ bớt tờ ở trên". `41bcbf1f`.

## 6. Phát hiện cần thầy quyết (KHÔNG tự đổi ngưỡng)

1. **Tốc độ cấp chứng chỉ Sẵn sàng 8+.** Chỉ điều kiện mô hình: 58/60 em ≤ 7 ngày. Đủ ba điều kiện Kiến thức ∧ Cẩn thận ∧ Mô hình: sơ ý 6% ⇒ 36/40 em trong 14 ngày (làn A1 đo thêm: 33–48% em trong 7 ngày); sơ ý 10% ⇒ 1/40. Khai oan 0 ở mọi ô. Con số "91–99% ≤ 7 ngày" báo trước đây chỉ tính điều kiện mô hình.
2. **Tờ "-DT" (Các dạng toán trọng tâm) không vào luyện tự động** — luật tự luận của thầy (`laMaDeTuLuan` coi -VD/-DT/-TL là mục dạy học/tự luận).
3. **Đoàn: câu bấm quá nhanh vẫn tính trượt trong trận** (sổ học vẫn ghi đúng là chưa tính).
4. **9 bước chưa có bộ sinh câu nền** (BT electron, BT điện tích, lập hệ, CTPT, Kc, ΔH tạo thành, năng lượng liên kết, tính chất hoá học, làm tròn). Đề nghị viết thêm bộ sinh cho 6 bước tính toán.
5. **"Làm câu ôn" ra khỏi gói tải sẵn** — mở lần đầu cần mạng (vốn cần mạng để lấy câu).

## 7. Khi thầy cho phát hành

1. Kiểm KHÔNG có ca thi mở (DIEU-PHOI: không phát hành khi đang có ca thi).
2. Gộp nhánh vào `main` (đẩy `main` ⇒ GitHub Actions phát hành Pages + Worker); ghi mã commit gộp + mã phiên bản Worker.
3. Chạy migration chỉ-thêm: `cd server && npx wrangler d1 execute omr --remote --file=migration-0510-omni-3.sql` (máy chủ cũng tự tạo bảng lúc dùng).
4. Thầy bật OMNI theo lớp ở Cài đặt → OMNI; chạy thử 1 lớp 7–10 ngày (GĐ E).
5. Lùi: `git revert -m 1 <commit gộp>` rồi đẩy `main`; Worker `npx wrangler rollback <mã phiên bản trước>`; bảng mới để nguyên (chỉ-thêm) hoặc DROP theo đầu tệp migration.

## 8. Ảnh (`docs/omni-0510/anh-build/`)

`hs-sanh-ca-trang-390` (+ `so-sanh-main-…` cùng màn trên `main`) · `hs-sanh-cho-bai-moi-ca-trang-390` · `hs-dao-cau-co-chip-chua-chac-390` · `hs-dao-dung-nhung-cham-390` · `hs-dao-chac-ma-sai-mo-loi-giai-390` · `hs-tram-hoi-phuc-390` · `hs-tram-cau-nen-390` · `hs-de-thu-390` · `gv-bai-hom-nay-ca-lop-1440` · `gv-bai-hom-nay-theo-diem-danh-1440` · `ph-chien-dich-cua-con-390` (+ `so-sanh-main-…`) · `ph-hom-nay-ca-trang-390`.
Phần đầu Sảnh trông thô ở cả hai bản (OMNI và `main`) là giới hạn của trang chụp (cảnh bản đồ cần khung cổng học sinh), không phải do OMNI.
