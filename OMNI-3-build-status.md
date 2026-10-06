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
