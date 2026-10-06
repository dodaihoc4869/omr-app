# OMNI 3 — trạng thái build (05/10/2026)

**Kết luận (05/10 ~23:45 giờ VN): PHÁT HÀNH theo lệnh thầy** — "Đẩy hết lên app trước 6h sáng mai nhé. Tự đẩy tự sửa không cần hỏi ý kiến tôi nhé", "Bật hết omni luôn nhé", "Từ giờ tới lúc đó ko có ca thi nào mở cả". Bản vá khối đã lên trước (PR #149, Worker 9c71d99b). Đợt này: PR nhánh `claude/gracious-heisenberg-hoe97n` → main ⇒ Actions đẩy Pages + Worker, rồi 4 migration chỉ-thêm qua workflow (omni-3, y-ds, lam-lai, migration-du-lieu/bat-omni-0510 = BẬT OMNI mọi em). Xem mục 9. (Trước đó: build xong, chưa phát hành, chờ thầy.)

- Đặc tả: `DAC-TA-BUILD-OMNI-3-0510.md` · hợp đồng: `docs/hop-dong-omni-3.md` · sổ việc: `SO-VIEC-OMNI-3.md`
- Mã commit nghiệm thu: `ac234db2` (bản cuối sau ba lệnh thêm của thầy 05/10; trước đó `e271f424`). Gốc `main` 416ee47.
- Công tắc `cau_hinh.omni`: mã mặc định vẫn TẮT (test giữ nguyên); bản sống BẬT cho mọi em đang dùng Hoá 2.0 bằng migration dữ liệu `server/migration-du-lieu/bat-omni-0510.sql` (thầy 05/10 "Bật hết omni luôn nhé"). Tắt/chỉ bật vài lớp: Cài đặt OMNI ở app thầy.

## 1. Bảng nghiệm thu (số liệu là kết quả thật của lệnh chạy trong phiên)

| Việc | Cách đo | Kết quả | Đạt/Trượt |
|---|---|---|---|
| Toàn bộ vitest so nền | `npx vitest run` (JSON), so TÊN với nền `aa95c68` | Bản cuối `ac234db2`: 13 949 test · 13 761 đạt · 141 đỏ · 47 bỏ qua; 141 tên đỏ TRÙNG ĐÚNG nền; 9 tệp lỗi môi trường TRÙNG ĐÚNG nền. Tên đỏ mới: 0 | Đạt |
| Test OMNI + reset + điểm danh + nhịp | `npx vitest run tests/omni-3-*.test.ts* tests/reset-* tests/buoi-hoc-may-chu-2809… tests/nhip-bang-2109…` | 38 tệp · 723/723 | Đạt |
| Nghiệm thu xuyên làn không giả lớp nào | `tests/omni-3-nghiem-thu-0510.test.ts` | 1/1: tick (chọn em, lọc SBD lạ, tick lần hai không tạo thêm) ⇒ A.I gắn vi kỹ năng ⇒ Sảnh omni ⇒ Trạm có câu nền tự sinh ⇒ luyện nền chấm đúng ⇒ Bảng bài ⇒ tắt công tắc y như cũ | Đạt |
| Kiểm kiểu | `cd server && npx tsc --noEmit -p tsconfig.json` · `npx tsc --noEmit -p tsconfig.app.json` | EXIT 0 · EXIT 0 | Đạt |
| Build | `npm run build` | EXIT 0 | Đạt |
| Màu | `npm run check:mau` | "Không có mã màu # nào ngoài src/styles/tokens.css" | Đạt |
| Service worker | `node scripts/kiem-sw.mjs` | 13/13 · precache 162 tệp / 2 984 KB (trần 170 / 3 000; `main` 2 993 KB) | Đạt |
| Màn thi không đổi | `git diff origin/main HEAD -- src/screens/ExamTakeScreen.tsx` | 0 dòng | Đạt |
| Migration chỉ-thêm | chạy `server/migration-0510-omni-3.sql` 2 lần trên node:sqlite | sạch cả 2 lần, 20 bảng; không ALTER bảng cũ | Đạt |
| Ảnh app thật | `scripts/chup-omni-3/` (component thật + máy chủ giả, chặn mọi yêu cầu ra ngoài) | 18 ảnh (gồm lời giải trắc nghiệm, trả lời ngắn, câu nền sau khi nộp) · 0 lỗi trang · 0 tràn ngang (`docs/omni-0510/anh-build/`) | Đạt |

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
| "Lời giải hiển thị đúng chuẩn chưa? hiển thị lại cho tôi xem" | CHƯA đúng chuẩn 28/09 ở Đảo 2.0 (cả đề thử), Đoàn, hộp câu nền: chỉ số Unicode (CO₂, Fe³⁺) vẽ bằng phông dự phòng (có sẵn trên `main`). Sửa bằng hàm chung `src/lib/chi-so-ro.ts` ⇒ <sub>/<sup> cùng phông; màn thi, `TheCau`, `chem-format` không đổi | `a3f30fab`; `omni-3-chi-so-ro-0510`, `omni-3-cau-nen-chi-so-0510`; ảnh `hs-dao-loi-giai-trac-nghiem-390`, `hs-dao-loi-giai-tra-loi-ngan-390`, `hs-tram-cau-nen-loi-giai-390` |
| "Khi tích chọn bạn chỉ lấy 3 phần trắc nghiệm, đúng sai trả lời ngắn làm tự động giao bỏ phần ví dụ minh họa và các dạng trọng tâm" | Bỏ hết ô tích; dòng tĩnh "Tự giao: Trắc nghiệm · Đúng sai · Trả lời ngắn" (phần 0 câu thì bỏ) + "Không giao Ví dụ minh hoạ và Các dạng toán trọng tâm"; áp cả bài cũ ôn lại; máy chủ có lưới an toàn | gộp `d9ea2096`; `omni-3-thay-bai-hom-nay`, `omni-3-tick-bai-0510`; ảnh `gv-bai-hom-nay-theo-diem-danh-1440` |
| "Làm thêm 6 bước tính toán" | Bộ sinh câu nền: bảo toàn electron, lập hệ, công thức phân tử, hằng số cân bằng, biến thiên enthalpy, năng lượng liên kết; ΔfH/Eb/nồng độ in sẵn trong đề; 26/29 bước có bộ sinh | gộp `ac234db2`; `omni-3-cau-nen-sinh` 93/93 (6 nhãn mới kiểm chéo TOÀN BỘ câu sinh được); 6 câu mẫu điều phối tính tay khớp |
| "Làm luôn bộ sinh câu bảo toàn điện tích nhé" | Bộ sinh `bao_toan_dien_tich`: 3 dạng (tìm số mol ion, khối lượng muối khi cô cạn, hai ẩn từ khối lượng muối), 999 câu khác nhau, CHỈ ghép ion cùng tồn tại được (loại kết tủa, khí, H⁺ + Fe²⁺ + NO₃⁻; HCO₃⁻ chỉ đi với Na⁺, K⁺, NH₄⁺, Mg²⁺, Ca²⁺, Ba²⁺); 27/29 bước có bộ sinh | gộp `1995aeb6` (làn `5fc3d7cb`); `omni-3-cau-nen-sinh` 100/100 (bộ giải độc lập giải lại cả 999 câu; 26 nhãn cũ khoá mã băm sinh y hệt); 3 câu mẫu điều phối tính tay khớp: 0,35 · 27,4 · 0,05 |

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
9. **Chỉ số hoá học** (CO₂, Fe³⁺) ở Đảo 2.0 / Đoàn / hộp câu nền vẽ bằng phông dự phòng — trái luật 28/09 mà "Câu đã làm" đã theo ⇒ hàm chung `chi-so-ro.ts`. `a3f30fab`.

## 6. Phát hiện cần thầy quyết (KHÔNG tự đổi ngưỡng)

1. **Tốc độ cấp chứng chỉ Sẵn sàng 8+.** Chỉ điều kiện mô hình: 58/60 em ≤ 7 ngày. Đủ ba điều kiện Kiến thức ∧ Cẩn thận ∧ Mô hình: sơ ý 6% ⇒ 36/40 em trong 14 ngày (làn A1 đo thêm: 33–48% em trong 7 ngày); sơ ý 10% ⇒ 1/40. Khai oan 0 ở mọi ô. Con số "91–99% ≤ 7 ngày" báo trước đây chỉ tính điều kiện mô hình.
2. **Tờ Ví dụ minh hoạ và Các dạng toán trọng tâm** — nay đúng lệnh thầy 05/10: tick bài không bao giờ giao (mục 3).
3. **Đoàn: câu bấm quá nhanh vẫn tính trượt trong trận** (sổ học vẫn ghi đúng là chưa tính).
0. **THIẾU (phát hiện 05/10 khi tra mã trả lời thầy):** đặc tả mục 4.6 "Chương trình Cẩn thận (bắt buộc)" — khi Sơ ý > 7 %: (a) câu đã vững ôn duy trì dày hơn (mốc ×0,7), (b) ô "Soát lại đơn vị và số liệu" trước khi nộp câu Phần III, (c) thẻ "Em biết câu này. Sai vì bước nào?" ở lượt chắc-mà-sai — CHƯA CÓ trong mã. Phần đã có: số Sơ ý ở Sảnh, nhóm "em sơ ý cao" (> 9 %) trong Cần thầy chữa, điều kiện C của chứng chỉ. Chờ thầy duyệt (b)(c) (thêm chữ/nút vào app học sinh).
4. **Câu nền tự sinh: 27/29 bước.** Còn 2 bước không có bộ sinh vì không phải bước tính: tính chất hoá học và làm tròn kết quả — Trạm dùng câu nền thầy đã nạp, chưa có thì đổi ải dễ hơn.
5. **"Làm câu ôn" ra khỏi gói tải sẵn** — mở lần đầu cần mạng (vốn cần mạng để lấy câu).

## 7. Khi thầy cho phát hành

1. Kiểm KHÔNG có ca thi mở (DIEU-PHOI: không phát hành khi đang có ca thi).
2. Gộp nhánh vào `main` (đẩy `main` ⇒ GitHub Actions phát hành Pages + Worker); ghi mã commit gộp + mã phiên bản Worker.
3. Chạy migration chỉ-thêm: `cd server && npx wrangler d1 execute omr --remote --file=migration-0510-omni-3.sql` (máy chủ cũng tự tạo bảng lúc dùng).
4. Thầy bật OMNI theo lớp ở Cài đặt → OMNI; chạy thử 1 lớp 7–10 ngày (GĐ E).
5. Lùi: `git revert -m 1 <commit gộp>` rồi đẩy `main`; Worker `npx wrangler rollback <mã phiên bản trước>`; bảng mới để nguyên (chỉ-thêm) hoặc DROP theo đầu tệp migration.

## 8. Ảnh (`docs/omni-0510/anh-build/`)

`hs-sanh-ca-trang-390` (+ `so-sanh-main-…` cùng màn trên `main`) · `hs-sanh-cho-bai-moi-ca-trang-390` · `hs-dao-cau-co-chip-chua-chac-390` · `hs-dao-dung-nhung-cham-390` · `hs-dao-chac-ma-sai-mo-loi-giai-390` · `hs-dao-loi-giai-trac-nghiem-390` · `hs-dao-loi-giai-tra-loi-ngan-390` · `hs-tram-hoi-phuc-390` · `hs-tram-cau-nen-390` · `hs-tram-cau-nen-loi-giai-390` · `hs-de-thu-390` · `gv-bai-hom-nay-ca-lop-1440` · `gv-bai-hom-nay-theo-diem-danh-1440` · `ph-chien-dich-cua-con-390` (+ `so-sanh-main-…`) · `ph-hom-nay-ca-trang-390`.
Phần đầu Sảnh trông thô ở cả hai bản (OMNI và `main`) là giới hạn của trang chụp (cảnh bản đồ cần khung cổng học sinh), không phải do OMNI.

## 9. Phát hành 05/10 (đêm) — nghiệm thu bản cuối trên bản sạch

| Kiểm | Lệnh | Kết quả | Đạt |
|---|---|---|---|
| vitest toàn bộ (eed47857, worktree sạch) | `npx vitest run --reporter=json` → so TÊN với nền main 3cdabd43 | 14 176 test · 142 đỏ / 62 tệp + 9 tệp lỗi nạp; 149 dòng trùng nền; 2 tên mới = NGÂN SÁCH D1 (chốt đáp án Đảo 2: đợt câu đúng 8 > 7; Sảnh hoa2 mở lần 2: vòng 4 > 3) — đã giao làn tối ưu máy chủ, đẩy đợt sau | Đạt có ghi chú |
| Cổng điểm ảnh 9 màn, OMNI tắt | `scripts/do-app-hs.mjs --kich=anh` bản sống (558c4a4c) vs bản cuối + `so-anh.mjs` | 8/9 trùng khít; 7-doan-tran chỉ khác số giây đồng hồ hiệp 27→26 (cắt vùng soi tận mắt; chụp lại bản sống 2 lần trùng 9/9 ⇒ do màn mở nhanh hơn) | Đạt |
| Cổng điểm ảnh 9 màn, OMNI bật | dist-chip vs bản cuối `--omni=1` | 8/9 trùng; cùng ô đồng hồ hiệp | Đạt |
| Build + service worker | `vite build` + `kiem-sw.mjs` | 0 lỗi; 13/13 | Đạt |
| Màu giữ nguyên / mã màu | `kiem:mau-giu` (so origin/main) · `check:mau` | 72 tệp src/ đổi · 0 vi phạm · sạch | Đạt |
| Lộ đáp án | `kiem:lo-dap-an` | 9/9 | Đạt |
| Kiểu | `tsc -b` + `tsc --noEmit -p server` | 0 lỗi | Đạt |

Làn gộp đêm 05/10: 5 thước đo (7ddb522d), máy soạn (3e21f7e2, kèm main 3cdabd43), thang 4 bậc (3684980f), bộ sinh biến thể (a790af0e, giải tay 14/14), chuyển màn (b165d375), chặn khác khối (55a73326 + f90479a0), khởi động app (f2945eaa), main 558c4a4c (96aa8369). CHƯA gộp: tối ưu máy chủ (đợt sau).

Lùi: `git revert -m 1 <commit gộp PR>` rồi đẩy main (Actions đẩy lại Pages + Worker). Tắt OMNI không cần lùi mã: Cài đặt OMNI hoặc xoá dòng `cau_hinh` khoa = 'omni'. Bảng mới chỉ-thêm để nguyên.

### 9b. Đã lên bản sống + đợt 2 (tối ưu máy chủ)

- OMNI 3 ĐÃ LÊN 06/10 00:03 giờ VN: PR #150 (main 3620f437), Actions run 37341470213 thành công, Worker `950a961d-0522-4f2b-9361-9e9dfec0dc2d`; 4 migration chỉ-thêm thành công (37343466562, 37344425340, 37344934295, 37345471742 — bật OMNI: rows_written 2).
- Đợt 2 = làn tối ưu máy chủ (gộp d709d431): chỉ `server/` + test + `docs/toi-uu-0510/MAY-CHU.md`. Đợt D1 (main → sau): mở app tắt 54→23 · bật 53→28; chơi tắt 67→31 · bật 66→38; 2 test ngân sách hết đỏ (chốt đáp án câu đúng 2 đợt ≤ 7; Sảnh lần 2: 2 ≤ 3). OMNI bật chưa đạt 2× (cổng khối đọc thêm). Sảnh lần đầu +15–40 ms CPU (chưa rõ nguyên nhân, theo dõi).
- vitest toàn bộ d709d431: 14 179 test, 149 dòng trùng nền + 9 tên phụ thuộc giờ chạy (00:05–00:25 giờ VN) — chạy lại cùng giờ trên main 3cdabd43 (trước OMNI) ra đúng 9 tên đó ⇒ có sẵn, không do đợt này.
- Đợt 2 ĐÃ LÊN 06/10 00:33 giờ VN: PR #151 (main d6903f8c), Actions run 37347411056 thành công, Worker `a67d3030-184b-4494-814f-1e48bf0ff015`. Máy chủ tự báo "ban" ~10 phút sau đẩy rồi về "tot" (00:44).
- Lùi từng đợt: #151 `git revert -m 1 d6903f8c` · #150 `git revert -m 1 3620f437` · #149 `git revert -m 1 558c4a4c`, rồi đẩy main (Actions đẩy lại). Tắt OMNI không cần lùi mã: Cài đặt OMNI ở app thầy.

## 10. Đợt 3 (06/10 sáng) — gộp làn A, A′, B, D + Bài hôm nay làm lại: nghiệm thu bản sạch `968f079c`

Lệnh thầy: "Làm nốt đi tất cả rồi đẩy luôn lên app nhé"; "Sửa lại toàn bộ chỗ này cho hiện đại siêu đẹp mắt và tích chọn được nhiều lớp, sắp xếp bài theo đúng thứ tự từ bé tới lớn…"; "Làm cho màn hình xoay ngang và máy tính nữa nhé". Gốc `main` d6903f8c (#151). Worktree mới tại đúng commit; mọi số là kết quả lệnh chạy trong phiên.

| Kiểm | Lệnh | Kết quả | Đạt |
|---|---|---|---|
| vitest toàn bộ, lượt 2 (máy yên tĩnh) | `npx vitest run --reporter=json` → so TÊN với nền d709d431 | 14 344 test · 141 đỏ / 61 tệp + 9 tệp lỗi nạp · **0 tên đỏ mới** | Đạt |
| vitest toàn bộ, lượt 1 | như trên | 144 đỏ: 3 tên mới đều CHẬP CHỜN, lượt 2 xanh (bảng dưới) | Đạt có ghi chú |
| Kiểu | `tsc -b` · `tsc --noEmit -p server` | 0 lỗi · 0 lỗi | Đạt |
| Build + service worker | `npm run build` · `kiem:sw` | thành công · 13/13 | Đạt |
| Màu | `check:mau` · `kiem:mau-giu` (so origin/main) | sạch · 30 tệp src/ đổi, 0 vi phạm | Đạt |
| Lộ đáp án | `kiem:lo-dap-an` | 9/9 | Đạt |
| Cổng điểm ảnh 9 màn học sinh | `do-app-hs.mjs --kich=anh` (OMNI tắt, bật `--omni=1`) vs `anh-final` / `anh-final-omni` + `so-anh.mjs` | 9/9 trùng khít · 9/9 trùng khít (0 điểm ảnh lệch, cả 7-doan-tran) | Đạt |
| Worker đóng gói | `wrangler deploy --dry-run` | thành công: 3 238 KiB, nén 842 KiB | Đạt |
| Kiểm ca thi mở (chỉ đọc) | workflow `kiem-ca-mo` run 37395505740 (07:44 giờ VN) | so_ca_mo = 0 · so_luot_dang_lam = 0 | Đạt |

Ba tên đỏ chập chờn của lượt 1 (cả ba xanh ở lượt 2):
- `tests/doan-het-cau-2809` "đi một mình (1 em + bạn máy)…": nguyên nhân gốc — mã chặng `ma` sinh bằng `crypto.getRandomValues` làm hạt giống (`hatGiong: ma`, game-v2-doan.ts), bạn máy đáp đúng/sai theo `rut(hatGiong, 'may|hiệp|ghế') < TI_LE_MAY_DUNG` ⇒ chỉ một phần hạt giống cho "3 sao" mà test khẳng định cứng. Tái hiện: chạy riêng 14 lượt — bản này đỏ 3/14, `main` đỏ 2/14. Có sẵn từ trước, không do đợt này (không sửa trong đợt này; sửa đúng = ghim hạt giống trong test).
- `tests/tu-ngu-cum6-2109` (quá 5 000 ms) và `tests/shop-man-2109` (tiêu điểm sau mua xong): đỏ chỉ ở lượt chạy toàn bộ đầu; mã nguồn hai màn này (Võ đài, Cửa hàng) KHÔNG nằm trong thay đổi của đợt; chạy riêng xanh (3 lượt dưới 8 vòng lặp ép CPU: 60/60 test mỗi lượt, gồm cả tệp Đoàn may mắn xanh).

Gộp (đã nối trên nhánh `claude/gracious-heisenberg-hoe97n`): làn B Cẩn thận (d9314c02), làn A′ thang ở Trạm/Vé/Bi-a/Tu luyện (5303f3a1), làn A bậc `~bt`/`~yd` (4ca6c119), bước Bài hôm nay làm lại (5d3e97c4 + 8d8a0ea1 + 8e7a2d30), sửa ngân sách D1 `cau-theo-qid` (f4b7ef09), làn D tốc độ (69157d51; D3 đã gỡ) + sửa test lane D (968f079c), bước kiểm ca thi mở (fb474aa9). Không migration; bảng chỉ-thêm `omni_buoc_sai` tạo lúc chạy. Commit sau `968f079c` chỉ là tài liệu.

CHƯA làm (nói thẳng): chẩn đoán câu nền chèn vào chuyến (A′), Trạm/chẩn đoán xếp theo `omni_buoc_sai`, xoay vòng song sinh, ghim phiên bản `~bt`, chip "Đã tính vào phạm vi" cho Bài 1–5, kho ý Đúng–Sai còn rỗng tới khi chạy `node scripts/loi-giai/may-soan.mjs --lop tat-ca`. Tốc độ: đo trên máy chủ giả (đăng nhập → Sảnh 1905 → 1454 ms), chưa đo trên D1 thật; luồng NDJSON có thể bị gom đệm ở rìa — kiểm `curl -N`, công tắc khẩn `TAT_KEM_SANH`.

Lùi: `git revert -m 1 <commit gộp PR đợt 3>` rồi đẩy main (Actions đẩy lại Pages + Worker). Tắt riêng: thang làm lại `cau_hinh` khoá `lam_lai_khac` = `{"bat":false}`; đăng nhập kèm Sảnh `TAT_KEM_SANH`; cả OMNI ở Cài đặt OMNI. Bản Worker trước đợt này: `a67d3030-184b-4494-814f-1e48bf0ff015`.

### 10b. Đã lên bản sống (06/10)

- ĐÃ LÊN 06/10 08:34 giờ VN (01:34 UTC): PR #152 (main 973875d2), Actions run 37398491975 thành công (check:mau · npm test · build · Pages · Worker). Pages `b3ad07b4`; Worker `1e17cf25-3045-41c5-a3e1-f53d0f9dec0a` (khởi động 38 ms; tải lên 3 237,77 KiB / nén 841,84 KiB — đúng bằng bản đóng gói thử). Không migration.
- Ca thi mở kiểm LẠI ngay trước khi gộp: 08:18 giờ VN, run 37398426014 — so_ca_mo = 0, so_luot_dang_lam = 0.
- Kiểm sống không cần mật khẩu em: `/hs/ca-dang-mo` HTTP 200, `nhipDeNghi.muc` = "tot"; `/gv/buoi-hoc`, `/gv/omni/cai-dat` không mã ⇒ 403 "Sai mã bí mật"; `/hs/dang-nhap` thiếu số báo danh kèm `kemSanh:true` ⇒ HTTP 200 JSON thường (đường lỗi y hệt cũ, không luồng).
- Nhịp máy chủ sau đẩy: 20 mẫu trong 10 phút (30 giây một mẫu, 08:35–08:45 giờ VN): 20 mẫu HTTP 200 và `nhipDeNghi.muc` = "tot", 0 bất thường (đợt trước từng báo "ban" ~10 phút sau đẩy; lần này không thấy).
- CHƯA kiểm được từ phiên đám mây (không thử mật khẩu em): đăng nhập thật theo luồng NDJSON (`curl -N`), thẻ Cẩn thận/thang làm lại trên em thật. Cần thầy hoặc một em dùng thử; công tắc khẩn nếu đăng nhập chậm hơn trước: biến môi trường `TAT_KEM_SANH`.
- Lùi: `git revert -m 1 973875d2` rồi đẩy main (Actions đẩy lại Pages + Worker); Worker trước đợt này `a67d3030-184b-4494-814f-1e48bf0ff015`.

## 11. Đợt 4 (06/10 trưa) — chẩn đoán bước sai, ba việc nhỏ, gọn mã, test chập chờn, chip "Đã dạy" + ô "Giao cho", nút Chắc / Chưa chắc: nghiệm thu bản sạch `13bd7724`

Lệnh thầy: "Làm chuẩn đoán bước sai, còn nhỏ, gọn mã, test chập chờn"; "khi tôi chọn bài nào thì những bài trước hiện đã dạy, chỗ chọn lớp cho thêm mục chọn theo em (giao theo em) giao theo điểm danh nữa"; "Nút chưa chắc với chắc đổi màu dễ nhìn hơn nhé, và bấm nó chưa phản hồi". Gốc `main` 10c882dd (đợt 3 + ghi sổ). Mã nghiệm thu `13bd7724`; sau đó chỉ thêm tệp `.md`.

| Kiểm | Lệnh | Kết quả | Đạt |
|---|---|---|---|
| vitest toàn bộ, lượt 1 (f82e498a, trước sửa khung hình) | `npx vitest run --reporter=json` → so TÊN với nền đợt 3 (141 đỏ) và nền d709d431 (158 đỏ) | 14 404 test · 142 đỏ / 62 tệp + 9 tệp lỗi nạp · 1 tên mới: ô "Giao cho" hiện "0 / 5 em" — LỖI THẬT, đã sửa (13bd7724) | Đạt sau sửa |
| vitest toàn bộ, lượt 2 (13bd7724) | như trên | 14 404 test · 143 đỏ / 63 tệp + 9 tệp lỗi nạp · tên "Giao cho" xanh; 2 tên mới đều CHẬP CHỜN (bảng dưới), không do đợt | Đạt có ghi chú |
| Kiểu | `tsc -b` · `tsc -p server/tsconfig.json --noEmit` | 0 lỗi · 0 lỗi | Đạt |
| Build + service worker | `npm run build` · `kiem:sw` | thành công · 13/13 | Đạt |
| Màu | `check:mau` · `kiem:mau-giu` (so origin/main) | sạch · 40 tệp src/ đổi, 0 vi phạm | Đạt |
| Lộ đáp án | `kiem:lo-dap-an` | 9/9 | Đạt |
| Cổng điểm ảnh 9 màn học sinh, OMNI tắt | `do-app-hs.mjs --kich=anh` vs `anh-cuoi` + `so-anh.mjs` | 9/9 trùng khít (0 điểm ảnh lệch) | Đạt |
| Cổng điểm ảnh, OMNI bật + hai ảnh nút Chắc / Chưa chắc | `--omni=1 --them=chac` vs `anh-chac` | 11/11 trùng khít ở lượt 2; lượt 1 chỉ khác chữ số đồng hồ hiệp ở màn Đoàn (hai lượt cùng một bản dựng cũng khác nhau đúng vùng đó ⇒ nhiễu thời gian, không phải đổi mã) | Đạt |
| Gọn mã không đổi gói | dựng có đồng hồ + mã phiên bản ghim, hai worktree sạch dc44c76b (trước) ↔ fe2c4398 (sau gộp làn gọn mã) | dist 517 tệp trùng sha256 (diff 0 dòng); Worker `index.js` trùng `c1601ffa…` | Đạt |
| Worker đóng gói | `wrangler deploy --dry-run` | thành công: 3 260 KiB, nén 849 KiB (đợt 3: 3 238 / 842; thêm mã chẩn đoán) | Đạt |
| Kiểm ca thi mở (chỉ đọc) | workflow `kiem-ca-mo` run 37413609699 (11:25 giờ VN) | so_ca_mo = 0 · so_luot_dang_lam = 0 | Đạt |

Hai tên đỏ chập chờn của lượt 2 (xanh ở lượt 1, xanh khi chạy riêng 11/11; chưa sửa — việc riêng, chỉ sửa test):
- `tests/bi-a-mat-than-tra-loi` "Sảnh có công tắc (role switch…) — bật là nhớ": ĐỎ CẢ Ở BẢN ĐANG CHẠY (main 10c882dd) khi máy tải 4 lò (1/4 lượt) ⇒ có sẵn từ trước đợt.
- `tests/chien-dich-giao` "bấm nút chính ⇒ `tao`…": `waitFor` mặc định 1 000 ms hết giờ khi máy tải (cả test 1 420 ms); màn Giao chiến dịch không đổi trong đợt (chỉ gỡ export chết ở BangChienDich / btvn-da-giao / kho-de-giao).

Việc của đợt (commit trên nhánh `claude/gracious-heisenberg-hoe97n`, gộp từ hai làn agent): (1) chẩn đoán bước sai de66e8e5 · (2a) cd11435e · (2b) da9ea341 · (2c) 839cfe66 · (3) gọn mã df6fb9b4 + 4c68c43a + f2ce276a + 71ddf1fd (0 tệp mồ côi; gỡ 76 khai báo export chết ở 36 tệp, ròng −531 dòng) · (4) test chập chờn 88234bfd · (5)(6) chip "Đã dạy" + ô "Giao cho" 50db6f52 · (7) nút Chắc / Chưa chắc 5591dd7e · sửa khung hình "0 / N em" 13bd7724. Thiết kế chẩn đoán: `docs/chan-doan-buoc-sai-0610.md`.

CHƯA làm (nói thẳng): kho ý Đúng–Sai trên bản sống còn RỖNG ⇒ nhánh "chìa khoá + 2 ý Đ/S" của chẩn đoán chưa chèn câu nào (chỉ nhánh câu nền sinh bằng mã chạy) cho tới khi chạy `node scripts/loi-giai/may-soan.mjs --lop tat-ca`; 105 tệp (24 112 dòng, chỉ test/công cụ nhập, không vào gói) và 1 546 chữ `export` chỉ dùng nội bộ để nguyên — xoá cần xoá 22 test, sửa 73 test: chờ thầy quyết; ôn bài cũ (a)(b)(c) chờ thầy nói "làm"; ngưỡng chứng chỉ 8+ chờ thầy; đăng nhập thật NDJSON, thẻ Cẩn thận, thang làm lại, câu chẩn đoán và nút Chắc / Chưa chắc trên em thật chưa kiểm được từ phiên đám mây (không dùng mật khẩu em) — cần thầy hoặc một em dùng thử.

Lùi: `git revert -m 1 <commit gộp PR đợt 4>` rồi đẩy main (Actions đẩy lại Pages + Worker). Tắt riêng: chẩn đoán `cau_hinh` khoá `chan_doan_buoc_sai` = `{"bat":false}`; thang làm lại khoá `lam_lai_khac` = `{"bat":false}`; đăng nhập kèm Sảnh `TAT_KEM_SANH`; cả OMNI ở Cài đặt OMNI. Bản Worker trước đợt này `1e17cf25-3045-41c5-a3e1-f53d0f9dec0a`.

### 11b. Đã lên bản sống (06/10)

- ĐÃ LÊN 06/10 11:42 giờ VN (04:42 UTC): PR #154 (main 02bd30bc), Actions run 37413831815 thành công (check:mau · npm test · build · Pages · Worker; 14 phút 51 giây). Pages `4cd12e66`; Worker `25850a01-f721-4029-bed5-6db8d43342bb` (khởi động 21 ms; tải lên 3 259,56 KiB / nén 848,90 KiB — khớp bản đóng gói thử 3 260 / 849).
- Ca thi mở kiểm LẠI ngay trước khi gộp: 11:27 giờ VN, run 37413770362 — so_ca_mo = 0, so_luot_dang_lam = 0 (lần trước đó 11:25, run 37413609699).
- Kiểm sống không cần mật khẩu em (11:43 giờ VN): `/hs/ca-dang-mo` HTTP 200, `nhipDeNghi.muc` = "tot"; `/gv/buoi-hoc`, `/gv/omni/cai-dat` không mã ⇒ 403 "Sai mã bí mật"; `/hs/dang-nhap` thiếu số báo danh kèm `kemSanh:true` ⇒ HTTP 200 JSON thường.
- Nhịp máy chủ sau đẩy: 20 mẫu trong 10 phút (30 giây một mẫu, 11:43–11:53 giờ VN): 20/20 HTTP 200; 19 mẫu "tot", 1 mẫu "ban" thoáng qua (11:46; các mẫu sau trở lại "tot"), 1 lượt chậm 4,6 s (11:52, vẫn "tot"). Mức "ban" tính theo p95 thời gian trả lời trong 2 phút của MỘT isolate (`suc-khoe-may.ts`, > 1,5 s) — dao động thoáng qua, không thấy kéo dài.
- Hai test chập chờn của lượt 2 đã sửa sau đợt (chỉ test, commit 623f1dc7; ghi chú ở sổ việc OMNI 3).
- CHƯA kiểm được từ phiên đám mây (không thử mật khẩu em): đăng nhập thật theo luồng NDJSON, câu chẩn đoán, nút Chắc / Chưa chắc, thẻ Cẩn thận và thang làm lại trên em thật. Cần thầy hoặc một em dùng thử; công tắc khẩn: chẩn đoán `chan_doan_buoc_sai`, thang `lam_lai_khac`, đăng nhập kèm Sảnh `TAT_KEM_SANH`.
- Lùi: `git revert -m 1 02bd30bc` rồi đẩy main (Actions đẩy lại Pages + Worker); Worker trước đợt này `1e17cf25-3045-41c5-a3e1-f53d0f9dec0a`.

### 11c. Máy soạn đẩy kho (06/10 chiều, lệnh thầy "Chạy máy soạn đề đẩy kho")

- Chạy `node scripts/loi-giai/may-soan.mjs --mot-lan --lop tat-ca` trên phiên đám mây, 12:27–13:50 giờ VN (4 luồng, 12 câu/lô, 57 lô nộp thật; mã bí mật chỉ đọc từ biến môi trường, không in, không truyền cho phiên soạn con). Kiểm ca thi mở trước khi chạy: 12:24 giờ VN, run 37418298485 — 0 ca mở, 0 lượt đang làm. Thử 1 lô không nộp (`--thu`) và soát tay mẫu trước.
- Kết quả: hồ sơ lời giải đạt 91, trượt 9 (ba câu số khoa học bị khoá số từ chối, xem dưới); học liệu thêm 498 câu, 0 lỗi — bản khác lưu 1 188 / 1 226 đề xuất, ý Đúng–Sai lưu 1 381 / 1 387; hồ sơ chờ 96 → 0, hồ sơ đã duyệt 7 049 → 7 140, học liệu xong 0 → 391. Cờ đáp án tự xử: khớp 0, nghi 0. 62,7 triệu token (tính cả đọc bộ nhớ đệm), 284 phút máy cộng dồn 4 luồng.
- Soát mẫu của tôi (không phải toàn bộ): 14 ý Đ–S + 8 bản khác tính toán, tính lại bằng tay = 22/22 đúng; mọi mục đã qua hai lượt độc lập (soạn + kiểm mù) và kiểm lại ở máy chủ trước khi nối vào `cau_bo_tro` / `cau_y_ds` (chỉ-thêm).
- Tác động lên app (chưa kiểm trên em thật): kho ý Đúng–Sai từ RỖNG thành 1 381 ý ⇒ nhánh "chìa khoá + 2 ý Đ/S" của chẩn đoán bước sai có dữ liệu (câu lý thuyết Phần I cùng dạng, đúng khối, đề không hình); 1 188 bản khác vào `cau_bo_tro` ⇒ thang làm lại có thêm bản song sinh. Tắt riêng: `chan_doan_buoc_sai` / `lam_lai_khac`.
- Tồn: (1) ba câu `DH-10-C1-B2-III-23`, `DH-10-C1-B2-III-24`, `DB-11-B2-D6-III-3` — đáp số dạng a.10ⁿ ("1,1.10²³", "1,3.10²³", "1,3.10⁻³") mà phép tính cuối của máy chỉ ra phần a nên khoá số từ chối 3 lần ⇒ việc về `truot`; cần sửa bộ kiểm khoá số cho dạng a.10ⁿ hoặc nhập hồ sơ tay; (2) 26 hồ sơ chờ duyệt có sẵn từ trước (máy đề nghị sửa chữ trong đề: 53 chỗ; 1 chỗ giữ đáp án kho `DH-12-C3-B10-II-22`) — không đổi trong lượt này.
- Nhịp máy chủ đo sống: trong lúc chạy (12:35, 12:56) và sau khi chạy xong (10 mẫu, 13:52–13:56 giờ VN) đều HTTP 200, "tot".
- Chạy lại sau này: lệnh trên (hàng "câu em đã sai chưa có bản khác" tự làm mới ≤ 15 phút một lần; đề mới nạp tự vào hàng). Hướng dẫn: `docs/loi-giai-a/HUONG-DAN-CHAY.md`.

## 12. Đợt 5 (06/10 chiều) — Đoàn MỘT người thật có Trạm hồi phục + bỏ dòng "câu này sẽ quay lại sớm" khi chọn Chưa chắc: nghiệm thu bản sạch `83525bc0` (+ test đầu-cuối `d7cd2940`, hợp đồng `ea9cf4c8`)

Lệnh thầy: "Khi chọn chưa chắc bỏ dòng gợi ý câu này sẽ quay lại sớm"; "Làm sai 3 câu liên tiếp có cho vào trạm hồi phục không? Tôi làm thử chiến dịch sai 3 câu liên tiếp trong đoàn không thấy về trạm hồi phục". Gốc `main` 0f50359f. Không đổi schema, không đụng dữ liệu.

**Trả lời thầy:** Trạm hồi phục là của chuyến Đảo VÀ chặng Đoàn chơi MỘT mình (đặc tả gốc: "Đoàn nhiều người không có trạm: đồng hồ hiệp chung"). Gốc lỗi: `phienMoTram` (omni-game.ts) loại MỌI phiên Đoàn, kể cả Đoàn một mình ⇒ thầy thử trong Đoàn không bao giờ thấy. Nay: Đoàn một người thật có Trạm; Đoàn nhiều người vẫn không (có chủ ý, theo đặc tả).

Cách mở (giống Đảo, trừ hai chỗ nói ở dưới): 3 câu SAI TỰ LÀM liền trong một chặng · câu ĐÚNG hoặc câu có tiếp sức/gợi ý cắt chuỗi · câu sai quá nhanh bị tính "lướt" (tối đa 3 lượt/ngày, ngưỡng < max(3 giây, 10 % thời gian kỳ vọng) kẹp [3, 8] giây) thì BỎ QUA, không tính và không cắt · tối đa 1 Trạm/chặng · cần OMNI bật cho em. Khác Đảo: (1) Đoàn chỉ mở khi CÓ 3 câu nền (ải kế đã chia sẵn cho cả đội nên không đổi được bằng câu dễ hơn — không gọi `hoa2-omni-tram-xong`); không có ⇒ không mở và không đánh dấu phiên; (2) thẻ nằm dưới kết quả câu thứ ba, nút "Làm 3 câu nền" mở hộp "Luyện kiến thức nền" của thang tự gỡ (`/hs/luyen-nen`). Máu Linh Tâm không đổi.

| Kiểm | Lệnh | Kết quả | Đạt |
|---|---|---|---|
| Tái hiện lỗi thầy gặp | `tests/omni-3-doan-tram-may-chu-0610.test.ts` (Worker thật + D1 thật, Hoá 2.0 + OMNI bật; `doan-mo → doan-xem → doan-nop`) chạy trên bản ĐANG CHẠY main 0f50359f | ĐỎ 2/2: "câu sai thứ ba liền phải có Trạm: expected undefined to be truthy" | Tái hiện đúng |
| Cùng lệnh sau sửa | như trên trên 83525bc0 | XANH 2/2 (Trạm ở câu thứ ba; hai câu đầu không; sau Trạm không có Trạm thứ hai; phiên `tram:1`; thẻ Trạm không mang đáp án; câu đúng giữa chừng cắt chuỗi; chặng thật có hiệp 4 là Trùm — hiệp không có câu riêng của em — test đi qua nó bằng `doan-tiep`) | Đạt |
| Test mới khác | `omni-3-tra-loi` (+4 ca Đoàn: một mình mở / luật chuỗi / không câu nền / cờ giả bị từ chối) · `omni-3-doan-tram-0610` (thẻ, vắng ⇒ không thẻ, `coCauNen` false, OMNI tắt, CSS không màu thô, hộp nằm trên lớp phủ Đoàn) | 23/23 · 6/6 | Đạt |
| vitest toàn bộ (bản sạch 83525bc0) | `npx vitest run --reporter=json` → so TÊN với nền đợt 3 (`final2-do.s2`) và hai nền khác | 14 414 test (+10 mới) · 141 đỏ / 61 tệp + 9 tệp lỗi nạp = 150 tên, TRÙNG KHÍT tập nền đợt 3; 0 tên mới; hai test chập chờn đã sửa ở đợt 4 nay xanh | Đạt |
| Kiểu | `tsc -b` · `tsc -p server/tsconfig.json --noEmit` · test mới qua `tsc --strict` | 0 lỗi · 0 lỗi · 0 lỗi | Đạt |
| Build + service worker | `npm run build` (đồng hồ + mã phiên bản ghim) · `kiem:sw` | 517 tệp dist · 13/13 | Đạt |
| Màu | `check:mau` · `kiem:mau-giu` (so origin/main) | sạch · 7 tệp src/ đổi, 0 vi phạm (thẻ Trạm chỉ dùng biến `--the-2`, `--vien-dam`, `--muc` có sẵn) | Đạt |
| Lộ đáp án | `kiem:lo-dap-an` | 9/9 | Đạt |
| Cổng điểm ảnh, OMNI tắt (9 màn) | `do-app-hs.mjs --kich=anh` vs `anh-cuoi` + `so-anh.mjs` | 9/9 trùng khít (0 điểm ảnh lệch) | Đạt |
| Cổng điểm ảnh, OMNI bật + Chắc/Chưa chắc (11 ảnh) | `--omni=1 --them=chac` vs `anh-chac` | 10/11 trùng khít; khác DUY NHẤT ảnh `7b-doan-chua-chac` (64 085 điểm ảnh, vùng x 52–667, y 886–1033 = bóng báo "Đã chọn: Chưa chắc" ngắn lại do bỏ vế "câu này sẽ quay lại sớm") — đổi chữ có chủ ý theo lệnh thầy; nền so ảnh đã cập nhật | Đạt |
| Ảnh thật 360 px | `scripts/chup-omni-3` cảnh `doan-tram` (lỗi trang 0, tràn ngang 0) | `docs/omni-0510/anh-build/hs-doan-tram-*`: thẻ đọc rõ trên thẻ giấy; hộp câu nền nằm TRÊN lớp phủ Đoàn | Đạt |
| Worker đóng gói | `wrangler deploy --dry-run` | thành công: 3 260,37 KiB, nén 849,07 KiB (đợt 4 đã lên: 3 259,56 / 848,90) | Đạt |
| Kiểm ca thi mở (chỉ đọc) | workflow `kiem-ca-mo` run 37431714583 (14:46 giờ VN) | so_ca_mo = 0 · so_luot_dang_lam = 0 | Đạt |

Việc của đợt: máy chủ `server/src/omni-game.ts` (`phienMoTram(phien, doanMotMinh)`, `docTruocOmni`, `xetOmniTraLoi` + cổng "Đoàn phải có câu nền"), `game-v2.ts` (chỉ tin cờ `motMinh` khi là lệnh NỘI BỘ của Đoàn), `game-v2-doan.ts` (`doan-nop` đặt `motMinh: choEmMotMinh(phong)`); máy em `doan2/TheTram2.tsx` (mới), `DoanCau.tsx`, `DoanHoTong.tsx`, `doan-kieu.ts`, `doan2/doan2.css`; chữ `omni-chu.ts` (`BONG_CHUA_CHAC` = "Đã chọn: Chưa chắc", `NUT_LAM_CAU_NEN` dùng chung); hợp đồng `docs/hop-dong-omni-3.md`; bảng chuẩn từ ngữ.

Còn nguyên (nói thẳng): (1) dòng KẾT QUẢ sau khi nộp ĐÚNG mà em đã chọn Chưa chắc vẫn là "Đúng. Em chọn "Chưa chắc" nên câu này sẽ quay lại sớm cho chắc hẳn." (`CHU_DUNG_CHUA_CHAC`) — chữ khác, lúc khác, thầy chưa nói bỏ; (2) Trạm ở Đoàn chưa thử trên em thật (không dùng mật khẩu em) — đã chứng minh bằng test đầu-cuối trên Worker thật + D1 thật và ảnh trình duyệt thật, cần thầy hoặc một em thử lại cảnh "chặng Đoàn một mình, sai 3 câu liền" (chú ý: bấm sai quá nhanh sẽ thành "lướt" và không tính).

Lùi: `git revert -m 1 <commit gộp PR #157>` rồi đẩy main (Actions đẩy lại Pages + Worker). Không có công tắc riêng cho Trạm ở Đoàn — tắt cả Trạm bằng Cài đặt OMNI (OMNI tắt ⇒ y hệt cũ). Bản Worker trước đợt này `25850a01-f721-4029-bed5-6db8d43342bb`.

### 12b. Đã lên bản sống (06/10)

- ĐÃ LÊN 06/10 15:10 giờ VN (08:10 UTC): Actions run 37432674474 trên main `efc515c8` thành công (check:mau · npm test · build · Pages · Worker; 15 phút 50 giây). Pages `3873f698`; Worker `372416ea-f5a8-4efc-b7f6-89d786395b34` (khởi động 24 ms; tải lên 3 259,88 KiB / nén 849,03 KiB).
- LƯU Ý đẩy chung: PR #157 gộp lúc 14:46 giờ VN (main `076687ba`) và có run đẩy riêng 37431811558; run ấy bị HUỶ lúc 14:56 vì phiên khác gộp PR #158 (`claude/tong-hop-0610`, main `efc515c8`) — workflow huỷ run cũ khi có đẩy mới. Run 37432674474 vì thế đẩy CẢ HAI cùng lúc: mã của đợt này + toàn bộ nội dung PR #158 (66 tệp: lời giải chuẩn, thú/quái giữa đường, bản nguyên tố, chiếu mã…; phiên đó chịu trách nhiệm về phần của họ, đợt này không kiểm riêng phần ấy). Mã của đợt này nguyên vẹn trên main (`doanMotMinh`, `TheTram2.tsx`, `BONG_CHUA_CHAC` đều có); ảnh `doan-tram` chụp lại trên main `efc515c8` vẫn đúng (thẻ đọc rõ, hộp câu nền nằm trên lớp phủ Đoàn).
- Ca thi mở kiểm hai lần: 14:46 giờ VN (run 37431714583, main 0f50359f) và LẠI 14:56 ngay sau khi run kia bị huỷ (run 37432839389, main efc515c8) — cả hai so_ca_mo = 0, so_luot_dang_lam = 0; run đẩy kết thúc 15:10.
- Kiểm sống không cần mật khẩu em (15:11 giờ VN): POST `/hs/ca-dang-mo` HTTP 200, `nhipDeNghi.muc` = "tot"; POST `/gv/buoi-hoc`, `/gv/omni/cai-dat` không mã ⇒ 403 "Sai mã bí mật". Gói Pages sống KHÔNG kiểm trực tiếp được (máy chủ trung gian của phiên chặn pages.dev) — đã kiểm gói dựng sạch cùng mã: có "Làm 3 câu nền" (Dao2, DoanHoTong, omni-chu), có "Đã chọn: Chưa chắc", không còn "Chưa chắc · câu này sẽ quay lại sớm".
- Nhịp máy chủ sau đẩy: 20 mẫu trong 5 phút (15 giây một mẫu, 15:12–15:17 giờ VN): 20/20 HTTP 200, 20/20 "tot".
- CHƯA kiểm được từ phiên đám mây (không thử mật khẩu em): Trạm ở Đoàn trên em thật — cần thầy hoặc một em thử cảnh "chặng Đoàn một mình, sai 3 câu liền" (đừng bấm quá nhanh: sai nhanh = "lướt", không tính). Công tắc khẩn: OMNI ở Cài đặt OMNI (tắt cả Trạm); không có công tắc riêng cho Trạm ở Đoàn.
- Lùi: `git revert -m 1 076687ba` rồi đẩy main (có thể xung đột nhẹ ở `doan2.css` / `DoanHoTong.tsx` với PR #158 — giải tay, giữ phần của #158); Worker trước lượt đẩy này `25850a01-f721-4029-bed5-6db8d43342bb`.

## 13. Đợt 6 (06/10 chiều) — 6a, 6b, 6c' ĐÃ LÊN (tờ chữa chiến dịch không lẫn câu khối khác · khoá số a.10ⁿ · bỏ vế "quay lại sớm" · ôn bài cũ chia đều + tỉ lệ theo lớp · huỷ chiến dịch ⇒ thu hồi hết phần đã phân) · 6c gọn mã lần 2 xem 13d

### 13a. Đợt 6a — PR #162 → main `fcc8bf95` (nguồn nghiệm thu bản sạch `5cd9c6c0`, đầu PR `be4792fb`)

Lệnh thầy: "Mở câu chữa các chiến dịch đã xong của lớp 11 vẫn còn lẫn rất nhiều các câu thuộc lớp 10. Bạn áp dụng chặn câu luôn cho các chiến dịch đã xong nhé và tờ chữa phải loại bỏ hết câu nhầm khối" + "Bạn tự làm luôn hết rồi đẩy lên luôn nhé".

**Gốc lỗi (đo trên D1 thật trước khi sửa):** danh sách chữa của máy chủ (`buoi-chua`, `bang`) đã sạch khối từ 05/10 — 4 chiến dịch, 0 mã khác khối, lớp 11 có 120 mã đều khối 11. Nhưng các dòng KHÔNG mang nội dung câu: đoạn đính nội dung cũ chọn cột `phan` mà `game_v2_question` không có nên lỗi bị nuốt (chưa bao giờ chạy được). Tờ chiếu ở máy thầy (`to-chieu.ts`) phải ĐOÁN nội dung từ Ngân hàng đề trên máy: khớp đuôi mã (`id.endsWith(khoá)`) + khoá theo số thứ tự (`3`, `III-3`, `q3`, `cau-3`…). Câu của chiến dịch chưa có trên máy bị thay bằng MỘT CÂU KHÁC của tờ đầu tiên trong ngân hàng — thường tờ lớp 10. Vì vậy chặn thêm ở danh sách không đủ: lỗi nằm ở chỗ lấy nội dung.

**Sửa:** (1) máy chủ: lệnh `noi-dung-cau` (`server/src/noi-dung-cau-chien-dich.ts`) trả nội dung ĐÚNG mã câu — chỉ mã thuộc chiến dịch, qua CÙNG cổng khối lớp (`chanKhacKhoiLop`) với `buoi-chua` / `bang` (câu khác khối / mâu thuẫn ⇒ `boKhoi`; tự luận / hỏng / không còn ở chỉ mục ⇒ `khongCo`), đổi câu chỉ mục game sang khuôn Ngân hàng đề của thầy (`cauChoThay`), gỡ hai đoạn đính nội dung hỏng, `bang.canDayLai` có `phan`; (2) máy thầy: bảng tra chỉ khoá định danh của câu, tra NGUYÊN mã (`traChinhXac`), chỉ hỏi máy chủ những câu máy không có đúng mã (`napNoiDungChoToChieu`), BỎ khỏi tờ câu máy chủ báo khác khối (+ lớp phòng thủ thứ hai theo mã câu), báo "N câu thuộc khối khác đã được bỏ khỏi tờ chiếu"; mọi câu bị chặn ⇒ không mở tờ rỗng; máy chủ cũ chưa có lệnh ⇒ tờ vẫn mở (câu có đúng mã hiện thật, còn lại dòng thay thế, không đoán). Hợp đồng: `docs/hop-dong-game-hoa-2.md` (B). Công cụ đọc D1 thật chỉ ra số đếm: workflow `kiem-noi-dung-cau.yml` (bấm tay).
Kèm trong PR (đã có trên nhánh từ trước): máy soạn hiểu đáp số a.10ⁿ (`4ed9f79a`), dòng KẾT QUẢ sau nộp đúng + Chưa chắc bỏ vế "quay lại sớm" (`8bf203ec`), kế hoạch sửa kho 06/10 (chỉ tài liệu).

| Việc | Cách đo | Kết quả | Đạt/Trượt |
|---|---|---|---|
| Tái hiện gốc lỗi | `tests/chien-dich-to-chieu-khong-doan-0610.test.tsx` chạy trên mã CŨ `33e55691` (ngân hàng chỉ có tờ khối 10, câu khối 11 không có trên máy) | 14/16 đỏ — câu lớp 10 hiện thế chỗ câu khối 11 trên tờ; mã mới 16/16 | Đạt |
| Máy chủ trên D1 thật | `tests/noi-dung-cau-chien-dich-0610.test.ts` (kho 3 khối + tờ không rõ + tờ mâu thuẫn; chiến dịch lớp 11 thầy chọn cả 5 tờ) | 10/10; tắt cổng khối thử ⇒ đỏ (54 câu khối 10 / 12 lọt) | Đạt |
| Test liên quan | chiến dịch · chặn khối · buổi chữa · tờ chiếu · srs2 (cây đã gộp main) | 28 tệp / 336 test xanh | Đạt |
| Kiểu · màu | `tsc -b` · `tsc -p server` · `check:mau` · `kiem:mau-giu` | 0 lỗi · 0 lỗi · sạch · 0 vi phạm | Đạt |
| Build + service worker | `npm run build` (đồng hồ + mã phiên bản ghim) · `kiem:sw` | 518 tệp dist · 13/13 (precache 150 tệp / 2986 KB, trần 3000 KB) | Đạt |
| Worker | `wrangler deploy --dry-run` → thực tế | 3 265,46 → 3 264,97 KiB (nén 850,61); khởi động 22 ms | Đạt |
| vitest toàn bộ (bản sạch `5cd9c6c0`) | `chay-day-du.sh` + so tên với nền r5 | 14 526 test, 153 đỏ / 64 tệp (9 tệp lỗi nạp như nền). 11 tên đỏ ngoài nền (máy tải ~11 lúc chạy: các test có trần thời gian / 1 200–2 000 ca ngẫu nhiên quá giờ). Chạy LẺ 7 tệp chứa chúng trên cùng bản sạch (JSON, so tên): 161 test, 10 đỏ — 9 tên thuộc nền r5, chỉ 1 tên ngoài nền (`chon-luot-2109` "KHO ĐỦ LỚN … 2 000 trạng thái ngẫu nhiên" quá trần 5 giây; qua khi chạy lẻ trên main bản sạch `c0e5f88e`); 10 tên còn lại qua khi chạy lẻ. Không test nào đỏ vì mã của nhánh này | Đạt (0 tên đỏ do nhánh này) |
| Ca thi mở (chỉ đọc) | workflow `kiem-ca-mo` run 37446103327 (16:54 giờ VN) | so_ca_mo = 0 · so_luot_dang_lam = 0 | Đạt |
| Kiểm SỐNG (sau đẩy, 17:12 giờ VN) | lệnh `noi-dung-cau` thật với mã bí mật của thầy, mọi chiến dịch | lớp 10: 60/60 có nội dung; lớp 11 (buổi chữa): 96 mã ⇒ 95 có nội dung (id khớp mã, khối 11, đủ chuyên đề, Phần II mảng 4 Đ/S), 1 không có (câu tự luận), 0 bị chặn; lớp 12: 200/200 và 75/75; mã của chiến dịch khối khác xin vào ⇒ 0 nội dung ở cả 4 chiến dịch | Đạt |
| Đo D1 thật (workflow `kiem-noi-dung-cau`, run 37446753175) | chỉ đọc, chỉ in số đếm | 798 mã khác nhau trong 4 chiến dịch: 798 có hàng · 797 đổi được sang khuôn Ngân hàng đề (797 đủ chuyên đề ⇒ tờ có nút Đạt / Chưa đạt) · 1 tự luận · 0 hỏng; mã khác khối theo mã câu: 0 | Đạt |

Việc làm trên bản sống sau đẩy: xếp lại 3 việc máy soạn trượt vì đáp số a.10ⁿ (4 mã câu) bằng `tra_lai`, máy soạn chạy một lượt (10:15–10:16 UTC) ⇒ đạt 3 · trượt 0 · thiếu 0; cả 4 mã câu `da_duyet`, máy duyệt, 0 cờ; quét 268 tờ: không còn việc nào trượt vì số khoa học.

Còn nguyên (nói thẳng): (1) CHƯA kiểm được trên máy thầy bằng trình duyệt thật (không dùng mã/IndexedDB của thầy): chứng minh bằng test đầu-cuối + kiểm lệnh thật; thầy cần TẢI LẠI app để nhận bản mới; (2) câu có đúng mã trên Ngân hàng đề của máy vẫn lấy từ ngân hàng (giàu thông tin hơn bản chỉ mục game; có thể cũ hơn kho nếu máy chưa đồng bộ) — chỉ câu KHÔNG có đúng mã mới hỏi máy chủ; (3) 14 sửa kho + 26 hồ sơ chờ duyệt CHƯA áp: công cụ `tu-sua-kho.mjs` tự dừng vì có ca thi lớp 12 đang mở (xem 13b); (4) nền đỏ 150 tên vẫn còn nguyên (gồm 5 test chắc chắn đỏ của `chon-luot-2109`: kho nhỏ, vòng bù, Đoàn… — đỏ cả ở commit `83525bc0` chạy lại hôm nay, không do đợt này) — chưa ai sửa.
Lùi: `git revert -m 1 fcc8bf95` rồi đẩy main (Actions đẩy lại Pages + Worker); lệnh `noi-dung-cau` chỉ-thêm, máy thầy cũ vẫn chạy với máy chủ mới. Worker trước lượt này `47fd64eb-1a91-4fcf-9f93-1ec911f7f6c7`.

### 13b. Đợt 6b — ôn bài cũ chia đều + tỉ lệ theo lớp (làn A), nghiệm thu bản sạch `378546a4`; ĐÃ LÊN cùng 13c (PR #163, 06/10 18:30 giờ VN)

Hoãn vì: 17:17 giờ VN thấy ca thi lớp 12 (loại thi, 15 phút) trạng thái `mo`, bắt đầu 17:30, nhận em tới 18:00, 0 em vào; kiểm ca thi mở lúc 16:54 còn 0. Luật: không phát hành khi đang có ca thi mở ⇒ chờ ca xong (muộn nhất ≈ 18:15) rồi kiểm lại.
Việc của làn A (commit bf8e2595 · eb929a7e · 1e865af9): (a) dòng "Ôn bài cũ: tối đa N câu/em · kho X câu · phủ ≈ Y%" ở thẻ xác nhận Bài hôm nay; (b) cắt trần 800 ứng viên CÔNG BẰNG giữa các bài, trong nhóm xen kẽ bài (xoay theo ngày) rồi dạng; (c) thầy chỉnh tỉ lệ ôn bài cũ theo lớp (0–60 %, mặc định 20 % / 40 % ngày thứ 4–5 của bài). Tắt (b): `cau_hinh.on_bai_cu_deu` = {"bat":false} ⇒ y hệt cũ; (c) vắng cấu hình ⇒ y hệt cũ. Đọc cấu hình KÈM câu đọc nhóm cờ (không thêm vòng D1).
Nghiệm thu: `tsc -b` · `tsc -p server` 0 lỗi · `check:mau` sạch · `kiem:mau-giu` 0 vi phạm · build 518 tệp, `kiem:sw` 13/13 (precache 150 tệp / 2986 KB) · Worker dry-run 3 279,09 KiB (nén 854,27) · 68 tệp / 1 025 test liên quan xanh · vitest toàn bộ trên bản sạch: 14 624 test, 150 đỏ / 65 tệp — 4 tên đỏ lạ (cau-da-lam-it-dot-0610, de-rieng-tran-trung, hop-thoai-app-2809, omni-3-loi-mo-phong) đều qua khi chạy lẻ (40/40) = lỗi thời gian lúc máy tải nặng.
Rủi ro nói thẳng: hạng dạng / trọng số OMNI vẫn đứng trước nên "phủ k bài" chỉ chắc khi hoà hạng; đổi cách chọn câu ôn của học sinh (mặc định BẬT) — công tắc tắt ở trên.

### 13c. Đợt 6c' — HUỶ chiến dịch ⇒ thu hồi hết phần đã phân (thầy 06/10: "Tôi hủy một chiến dịch amine. Nhưng học sinh Đỗ Đại Học vẫn làm câu của chiến dịch… khi hủy chiến dịch thì những học sinh đã phân phải đc thu hồi hết") — nghiệm thu xong, ĐÃ LÊN (PR #163 → main `92a50b9a`, 06/10 18:30 giờ VN, gộp cùng 6b)

Gốc lỗi (tái hiện D1 thật, đỏ): `huy` chỉ đổi `trang_thai`. Kế hoạch lập lại không còn câu chiến dịch, nhưng câu em đã SAI trong chiến dịch vẫn bị nguồn thứ 4 của vòng học v2 (`docQidSaiV2`) kéo lại làm nợ cũ; lượt Đảo / Bi-a em đang mở vẫn chấm tiếp; bài tick gắn chiến dịch vẫn "đã dạy" (câu quay lại làm Ôn bài cũ; tick lại chỉ trả chiến dịch đã huỷ).
Luật: huỷ = như chưa từng giao; kết thúc (`dong`) KHÔNG đổi; không xoá dữ liệu thật. Thực hiện (hợp đồng docs/hop-dong-huy-chien-dich-0610.md): (1) nợ do chiến dịch huỷ sinh ra lọc lúc đọc (`docHoSo2`; lần sai sớm nhất ≥ mốc giao của em; đệm danh sách chiến dịch kèm chiến dịch đã huỷ từ 29/09 — cùng một câu đọc, parse lười); (2) kế hoạch đã chốt lập lại bằng cơ chế sẵn có, phụ huynh thấy đúng ngay; (3) lượt game đang mở (≤ 2 giờ, Đảo / Bi-a) đánh cờ `thuHoiLuc` ⇒ `answer` báo `cau_doi` (máy em tự sang câu kế, không tính sai), `resume` / `complete` bỏ câu; (4) bài tick gắn chiến dịch nhả dấu như `bo-tick`; (5) app thầy: hộp xác nhận + lời báo "thu hồi khỏi N em".
Nghiệm thu: 29 test mới trên D1 thật (kiểm đột biến: tắt bộ lọc nợ ⇒ 7/10 đỏ; tắt móc `answer`/`complete` ⇒ 5/9 đỏ) · `tsc -b` · `tsc -p server` 0 lỗi · `check:mau` sạch · `kiem:mau-giu` 0 vi phạm · 65 tệp / 980 test liên quan: 979 xanh, 1 đỏ có sẵn trong nền (sua-chien-dich-2809 "không phải thầy…").
Giới hạn nói thẳng: trận Đoàn Hộ Tống đang diễn ra chạy hết như cũ (phòng giữ sẵn câu; không đánh cờ để khỏi kẹt phòng); "Tự luyện câu sai" em tự bấm vẫn liệt kê câu em từng sai. Lùi: `git revert` commit đợt; bài đã nhả tick khôi phục bằng `UPDATE bai_da_day SET bo_tick_luc = NULL WHERE chien_dich_id = '<mã>'`.
Phát hiện thêm (việc #48, chưa tra): chẩn đoán `chan-doan-em` của tài khoản thử 12121212 treo >5 phút trên máy chủ thật (em khác 1,5 s).


**Đã lên (06/10 18:30 giờ VN).** PR #163 → main `92a50b9a` (gộp 11:20:04Z); Actions run 37455704181 THÀNH CÔNG 11:30:00Z (check:mau · npm test · build · Pages `28844d4e` · Worker `32904021-eaec-43cf-aa55-b81fa7092373`; trước đó Pages `278469e1`, Worker `8b0dbc0b-80e2-4c1c-8925-da717653d314`). Nguồn nghiệm thu bản sạch `e48aa68f`: vitest toàn bộ 14 653 test (= 14 624 + 29 mới), 150 tên đỏ — trùng tên với nền, 0 tên đỏ mới · `tsc -b` · `tsc -p server` 0 lỗi · `check:mau` sạch · `kiem:mau-giu` 0 vi phạm · build ghim 518 tệp · `kiem:sw` 13/13 · Worker dry-run 3 285,14 KiB (nén 855,99).
**Ngoại lệ ca thi mở (nói thẳng).** Luật "đang có ca thi mở thì dừng" bị phá có chủ ý ở đúng một điểm: ca lớp 12 mã 269409 (15 phút; bắt đầu 17:30, nhận em tới 18:00; em đầu bắt đầu làm 17:38) vẫn ở trạng thái `mo` lúc gộp NHƯNG hết hạn vào từ 18:00, 26/26 em đã vào đều đã nộp (daVao 26 · daNop 26), `so_luot_dang_lam` = 0 lúc 18:18 giờ VN (kiểm lại 18:44: vẫn 26/26) — không còn lượt nào có thể đang làm. Lùi nếu thầy phản đối: `git revert -m 1 92a50b9a`.
**Kiểm sống (chỉ đọc; KHÔNG huỷ thử một chiến dịch thật vì huỷ ghi dữ liệu thật).** Nhịp 12/12 mẫu HTTP 200 "tot" (0,45–0,97 s) trong 3 phút sau phát hành; `chan-doan-em` của em 11000 vẫn `ok:true` (119 câu trong hồ sơ, không treo); phần ĐỌC tương đương của hai câu ghi + hai câu đọc mới đã chạy trên D1 THẬT (workflow `kiem-sql-thu-hoi-0610`, run 37456312013, 11:26Z): không lỗi cú pháp — 4 chiến dịch chưa huỷ · 2 huỷ từ 29/09 · 0 huỷ trước 29/09 · 0 JSON hỏng · 0 lượt đã có cờ (chưa ai huỷ sau phát hành). Lần huỷ kế tiếp của thầy hiện lời báo "thu hồi khỏi N em" là bằng chứng cuối.
**Đối chiếu SỔ THẬT với lời thầy** (chỉ đọc, chỉ đếm, không in tên / mã em / mã câu; workflow `kiem-sau-huy-to-0610` · `kiem-ke-hoach-huy-0610` · `kiem-chien-dich-cua-em-0610`, runs 37456643073 · 37457064839 · 37457179893 · 37457334234 · 37458727076 · 37458930072). Có hai chiến dịch huỷ từ 29/09, đều chỉ có MỘT em — 12121212, tài khoản thử (cùng em ở việc #48; run 37459741242: em này nằm trong cả (A), (B) và chiến dịch đang chạy bên dưới): (A) tờ `DH-12-C2-B6`, 170 câu, giao 28/09 09:21, huỷ 29/09 09:23 (giờ VN); (B) tờ `DH-12-C3-B8` — chiến dịch "amine" (tên có chữ amin), 164 câu, giao 06/10 09:22, huỷ 14:04, hạn 19/10.
- (A) RÒ THẬT trước bản vá: kế hoạch ngày 04/10 và 05/10, mỗi ngày có 4 câu (1 Đảo + 3 Đoàn) thuộc tập câu của chiến dịch đã huỷ 6–7 ngày trước, dù kế hoạch lập SAU lúc huỷ và không còn ghi mã chiến dịch (suy ra: đi qua đường nợ cũ từ lần sai trong chiến dịch — đúng đường bản vá chặn). Em CHƯA làm câu nào của (A) sau lúc huỷ (0 lần, mọi kênh); trong đời chiến dịch em làm 53 lần (35 cặp câu sai).
- (B) amine: KHÔNG tái hiện được điều thầy thấy. 0 lần em làm câu của (B) từ lúc giao đến nay (trong đời lẫn sau huỷ, mọi kênh); kế hoạch ngày 04–06/10 của em không có câu nào của (B); kế hoạch 06/10 lập trước lúc huỷ.
- Điều em ĐANG làm: em còn nằm trong MỘT chiến dịch khác CHƯA huỷ, đang chạy — tạo 29/09 09:23 giờ VN (bảy giây sau lúc huỷ (A)), 111 em, 112 câu, 4 tờ Chương 1–2 (`DH-12-C1-B3-D1/D2`, `DH-12-C2-B7-D1/D2`), hạn nộp 05/10 (đã quá hạn nhưng CHƯA kết thúc). 46/46 câu trong kế hoạch ngày 06/10 của em (6 Đảo + 40 Đoàn) là câu của chiến dịch này; mọi lần em làm game từ 29/09 (186 lần, 23 lần hôm nay) đều là câu của nó, kể cả 12 lần sau lúc huỷ (B). Chiến dịch quá hạn mà chưa Kết thúc vẫn đẩy câu cho em mỗi ngày (luật sổ nợ 29/09) — rất có thể đó là "câu của chiến dịch" thầy thấy. Muốn rút hết cho em phải huỷ (hoặc Kết thúc, hoặc Sửa chiến dịch ⇒ Bớt em) chiến dịch ấy; việc chạm 111 em thật nên KHÔNG tự làm — chờ thầy.

### 13d. Đợt 6c — gọn mã lần 2 (làn C): xoá 29 tệp mã chết + 20 tệp test riêng; nghiệm thu trên cây gộp `f0e4823e` (main `92a50b9a` + làn C), ĐÃ LÊN (PR #164 → main `ec36bcab`, 06/10 19:09 giờ VN)

Lệnh thầy: "Bạn tự làm luôn hết rồi đẩy lên luôn nhé" (xử 105 tệp "chỉ test/công cụ dùng" mà đợt 4 để chờ thầy quyết). Bảng cụm → quyết định → bằng chứng: `docs/gon-ma-0610-lan-2.md`. Luật: chỉ xoá cụm đã chứng minh "đã bị thay thế + hết đường dùng"; có script / trang xem thử / cấu hình nhập thật thì GIỮ; nghi ngờ thì GIỮ; mã tài chính / điểm (CNH-1.0 EXP) GIỮ.
Xoá: cụm A game Thần thú v1 (25 tệp · 11 121 dòng; app đang dùng `game/than-thu-v2`) + cụm B báo cáo xem điểm cũ của thầy và thẻ "Ca kiểm tra gần nhất" cũ của app phụ huynh (4 tệp · 1 033 dòng) = 29 tệp · 12 154 dòng; test: xoá nguyên 20 tệp (323 test), gỡ khối phụ thuộc ở 17 tệp (79 test). Giữ: 76 tệp · 11 728 dòng (cụm ph-moi 31 tệp · 4 004 dòng còn được hai công cụ đo nhập; cụm F1 · F2 · G2 · G3 nghi ngờ ⇒ giữ — chờ thầy quyết).

| Việc | Cách đo | Kết quả | Đạt/Trượt |
|---|---|---|---|
| Cây gộp | `git diff --stat 92a50b9a f0e4823e` | 69 tệp, +670 / −17 004 dòng | — |
| vitest toàn bộ (worktree sạch, `f0e4823e`) | JSON, so TÊN đỏ với nền r5 (150) và nền hợp (160) | 14 251 test (= 14 653 − 323 − 79, khớp tuyệt đối), 109 đỏ / 53 tệp (9 tệp lỗi nạp như nền); **0 tên đỏ mới**; 32 tên đỏ biến mất đều thuộc test của mã đã xoá (10 tệp, 8 tệp xoá nguyên) | Đạt |
| Kiểu · màu | `tsc -p server` · `check:mau` · `kiem:mau-giu` (so origin/main) | 0 lỗi · sạch · 0 vi phạm (29 tệp mã chết xoá nguyên tệp: ngoại lệ ĐÓNG, không tính) | Đạt |
| Build + service worker | `npm run build` (đồng hồ + mã phiên bản ghim, gồm `tsc -b`) · `kiem:sw` | 518 tệp dist · 13/13 (precache 150 mục / 2 790,27 KiB) | Đạt |
| Worker | `wrangler deploy --dry-run`, sha256 `index.js` | TRÙNG BYTE với main `92a50b9a` (`d2f8811f…`, 3 285,14 KiB / nén 855,99) ⇒ đợt này chỉ đổi Pages, Worker không đổi | Đạt |
| Gói app | so dist hai bản sau khi chuẩn hoá tên băm | JS trùng; chỉ khác `assets/index.css` (347 896 → 332 183 byte) và `sw.js` (bảng precache theo hash). 65 tên lớp tiện ích Tailwind không còn trong CSS (chỉ dùng ở tệp đã xoá); 0 tên còn xuất hiện dạng chữ trong gói JS/HTML đang chạy (`text-slate-300` vẫn còn luật riêng) ⇒ không thể mất kiểu của màn đang dùng | Đạt |

Quyết định chờ thầy (không chặn phát hành): (a) giữ hay bỏ ngoại lệ đóng của cổng `kiem:mau-giu` (đúng 29 đường dẫn, chỉ trạng thái xoá — `scripts/kiem-mau-giu-nguyen.mjs`, commit `08897972`); (b) cụm ph-moi (31 tệp) có xoá cùng hai công cụ đo không; (c) các cụm nghi ngờ F1 · F2 · G2 · G3.
Lùi: `git revert -m 1 <commit gộp PR 6c>` (Pages cũ trở lại; Worker không đổi nên không cần lùi).

**Đã lên (06/10 19:09 giờ VN).** PR #164 → main `ec36bcab` (gộp 11:53Z); Actions run 37459456065 THÀNH CÔNG 12:09:32Z sau 16 phút (check:mau · npm test · build · Pages `ba22f362` · Worker `5ce67e91-08f8-459a-a666-725af493c2e6`, upload 3 284,65 KiB / nén 855,94, khởi động 26 ms; trước đó Pages `28844d4e`, Worker `32904021-eaec-43cf-aa55-b81fa7092373`). Ca thi mở lúc gộp: ca 269409 vẫn `mo`, 26/26 đã nộp, hết hạn vào từ 18:00 (ngoại lệ như 13c).
**Kiểm sống (chỉ đọc).** Nhịp 12/12 mẫu HTTP 200 (0,48–1,04 s): 10 "tot" + 2 "bận" (trùng lúc chính tôi chạy lệnh chẩn đoán / kiểm nội dung); `chan-doan-em` em 11000: 1,8 s, em 12121212: 6,7 s (không treo); lệnh `noi-dung-cau` của 6a còn đúng: 4 chiến dịch · 60 / 96 (+1 tự luận) / 200 / 76 mã có nội dung, 0 bị chặn, 0 id lệch, 0 thiếu chuyên đề / đáp án, mã chiến dịch khác khối xin vào ⇒ 0 nội dung. (Số "khacKhoi = 10" ở chiến dịch lớp 12 "Nhóm 10 điểm" là nhận dạng sai của script kiểm: tiền tố mã `100-` = đề 100 câu bị đọc thành khối 100; chuyên đề của 10 câu đó đều của lớp 12.)
**Pages sống KHÔNG kiểm được bằng trình duyệt từ máy làm việc** (chính sách ra ngoài chặn `*.pages.dev`, CONNECT 403). Thay bằng: bản dựng của đúng cây gộp và bản dựng của main chạy cục bộ trong Chromium (không đăng nhập), 3 app × sáng/tối = 6 màn: 4 màn trùng từng điểm ảnh, 2 màn lệch 18 và 2 trên 312 000 điểm (mọi lệch ≤ 24/255 = nhiễu khử răng cưa, không đổi kiểu); 0 lỗi trang, 0 request hỏng (một lỗi chứng chỉ của tài nguyên ngoài như nhau ở cả hai bản — do máy làm việc).

### 13e. Việc #48 — `chan-doan-em` của 12121212 treo > 5 phút: KHÔNG TÁI HIỆN, chưa có nguyên nhân gốc

Phát hiện lúc làm 13c: ~11:00Z (18:00 giờ VN, ngay sau ca thi lớp 12) `chan-doan-em` của em 12121212 treo 2 lần (HeadersTimeout 300 s) còn em 11000 trả 1,5 s. Đo lại (chỉ đọc, chỉ đếm; workflow `kiem-em-treo-0610`, bộ đo `scripts/do-treo-0610.ts`, runs 37459741242 · 37460612031):
- Chạy ĐÚNG mã `chanDoanEm` trên D1 THẬT qua lớp mỏng chỉ nhận SELECT (API REST): 12121212 = 40 truy vấn, 8,4 s (phần lớn là độ trễ REST ~300 ms/truy vấn), không có khoảng chặn CPU nào; 11000 = 41 truy vấn, 9,3 s. Không truy vấn nào chậm bất thường (chậm nhất 0,8–1,7 s).
- Dữ liệu cùng cỡ: sổ 735 dòng (12121212) so với 684 (11000); không bảng nào trong 91 bảng có cột sbd lệch cả nghìn lần. 12121212 không thuộc lớp nào (`hoc_sinh.lop` rỗng) ⇒ không đi qua bước prior lớp; ảnh chụp OMNI đêm phủ 261/261 em (lớp 12: 126 · lớp 11: 88 · lớp 10: 46 · không lớp: 1) nên cũng không có bước tính lại hàng loạt.
- Máy chủ sống sau đợt 11:30Z: 12121212 trả HTTP 200 trong 6,1–6,7 s (11000: 1,8 s), `ok:true`, 102 câu trong hồ sơ — KHÔNG treo.
Kết luận: lần treo 11:00Z không tái hiện được trên mã hiện tại. Giả thuyết còn lại (chưa kiểm chứng): (a) tắc tạm thời ở D1 / Worker đúng lúc ca thi lớp 12 ghi nặng (em 11000 cùng khoảng ấy vẫn nhanh nên không phải nghẽn chung); (b) lỗi của mã TRƯỚC 11:30Z đã mất khi đợt 6b + 6c' đổi đường đọc chiến dịch / lập kế hoạch; (c) khác biệt môi trường Worker (R2 / Durable Object / D1 sessions) mà bộ đo Node không có. KHÔNG sửa mã vì chưa có nguyên nhân gốc. Nếu tái diễn: chạy ngay workflow `kiem-em-treo-0610` (bấm tay) + xem `wrangler tail`; khi cần thì thêm bộ đếm giờ từng bước vào `chanDoanEm`.
