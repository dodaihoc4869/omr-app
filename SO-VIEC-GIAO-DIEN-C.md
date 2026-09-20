# SỔ VIỆC — GIAO DIỆN VIỆC C, COMPONENT ĐỘC LẬP (phiên Code 4)

Lập 19/09/2026. Theo `DIEU-PHOI.md` luật 4: không sửa `SO-VIEC.md` (của Code 3) và `SO-VIEC-GIAO-DIEN.md` (của Code 2).
Giao bởi 0.Planer (thầy đã uỷ quyền 100%: "nghe theo điều phối, không cần tôi xác nhận").

## Nguyên văn việc giao (0.Planer, 19/09)

- [~] "đồng bộ Material 3 cho các COMPONENT ĐỘC LẬP mà học sinh/phụ huynh bấm vào" | bằng chứng: 15 tệp được duyệt: XONG 13 (A1 46140c6, B 4a37ff2, C 5f41d50/70d3408, TheCau e1555a4 [CSS, chưa bật ở màn thi], A2 564dc08, TamTruotHoiBai 5d0d1c4); ĐỀ NGHỊ ĐỂ NGUYÊN 2 (KhoiBaiLuyen, TheCauChiTiet — bản giấy, chờ 0.Planer); CHỜ Code 2: bật TheCau ở màn thi bằng `m3` ở gốc ExamTakeScreen
- [x] BƯỚC 0: kiểm kê 20 tệp (có thật không, ai import, dùng chung với GV không, test soi gì) → nhắn 0.Planer | bằng chứng: bảng gửi 19/09; 0.Planer DUYỆT 17:00 (làm 15 tệp, bỏ 5: KhoiTienBo chỉ GV + 4 mã chết)
- [x] "DÙNG LẠI token và thành phần của Code 2, KHÔNG tạo bảng màu thứ hai" | bằng chứng: tests/m3-a1-1909.test.tsx quét src/components/m3/*: 0 mã #, 0 khai báo --m3-* mới; check:mau 0 dòng ở tệp của em
- [x] "Mỗi nhóm MỘT commit; chạy test các tệp liên quan; toàn `npx vitest run` một lần trước khi báo xong nhóm (ghi Nhật ký trước; nền 98 đỏ/43 tệp)" | bằng chứng: mỗi nhóm có dòng Nhật ký trong DIEU-PHOI.md trước khi chạy; lần cuối 97 đỏ / 42 tệp, đỏ MỚI của em: không
- [x] "`npm run build` ra thư mục riêng (đừng đè dist/)" | bằng chứng: `vite build --outDir <ngoài repo>` sau mỗi nhóm, không lỗi
- [x] "Xong mỗi nhóm nhắn tôi: commit, tệp đã sửa, ảnh 390 px sáng+tối ở docs/anh-dong-bo-m3-1909/" | bằng chứng: tin gửi 0.Planer cho từng nhóm; ảnh a1-/b-/c-/d-/a2- trong docs/anh-dong-bo-m3-1909/
- [x] Điền dòng "Code 4" trong DIEU-PHOI.md thành "đang làm" | bằng chứng: dòng 23 của bảng

## Luật cứng (chép từ lời giao)

đổi áo không đổi xương (không đổi luồng dữ liệu, prop, payload, khoá localStorage, câu chữ test đang soi — grep tests/ trước); không mã màu cứng trong .tsx; không thêm thư viện; không emoji; tắt chuyển động khi prefers-reduced-motion; sáng + tối. CẤM đụng: StudentPortalScreen.tsx, ParentPortalScreen.tsx, src/lib/html-phieu.ts, ExamTakeScreen.tsx, src/components/bang-nhiem-vu/**, server/**, mọi tệp giáo viên. Chỉ `git add <tệp cụ thể>`. Chỉ commit khi nhóm HOÀN CHỈNH và test xanh (Pages đóng gói toàn bộ src/). Không phát hành.

## Nhóm

- A — vào thi + thông báo: PhongVaoThi, MaCaInput, PhongChoGame, ThongBaoHocSinh
- B — luyện đề + khắc phục: LuyenDeChuan, KhoiKhacPhuc3CheDo, ModalKhacPhucCauSai, KhoiCauSai
- C — báo cáo + tiến bộ: BaoCaoCaThiPhuHuynhModal, BaoCaoCaThiHocSinhModal, TheTienBo
- D — thẻ câu + hỏi bài: TheCauChiTiet, TamTruotHoiBai, KhoiBaiLuyen, (TheCau — chờ 0.Planer)
- Bỏ (chờ duyệt): KhoiTienBo (chỉ GV), CardCaThiGanNhat, KhoiLuyenKhacPhuc, BongBongChatHocSinh, BongBongChatPhuHuynh (mã chết)

## Nhật ký

- 19/09 · Code 4 · kiểm kê xong, gửi 0.Planer. Cách cô lập GV: hook `dungM3()` = `!laManThayQuanLy(...)` (src/lib/vai-tro.ts).

## Nhóm A1 (PhongVaoThi + ThongBaoHocSinh) — XONG 19/09 14:09

- [x] thư viện `src/components/m3/` (index.ts: `dungM3()`; NutTron, ThanhTren; m3.css) | bằng chứng: 21 test xanh, đột biến bỏ lớp `m3` → 2 test đỏ, hoàn lại → 21 xanh
- [x] PhongVaoThi: gốc `m3 m3-phong`, thanh trên dính (nút Quay lại tròn 48 px), giữ aria-label "Vào phòng thi" | bằng chứng: test + ảnh a1-phong-vao-thi-390-{sang,toi}.png
- [x] ThongBaoHocSinh: chuông 48 px, tấm bo 28, thẻ tonal (chưa đọc = primary, đã đọc = trung tính), skeleton thay spinner, "Đang bật" bỏ ký tự ✓ dùng biểu tượng; MỌI logic/API/chuỗi giữ nguyên | bằng chứng: test + ảnh a1-thong-bao-390-*, a1-thong-bao-trong-390-*
- [x] tương phản ≥ 4,5 và đích chạm ≥ 48 px, sáng + tối, không tràn ngang | bằng chứng: bộ đo getComputedStyle trong Chromium thật (đối chứng chữ xám nhạt bị bắt: 2,32)
- [x] toàn vitest 98 đỏ / 43 tệp = đúng nền (đổi chỗ 1: tests/ho-so-lop-nam-kt-1909.test.ts của Code 1 mới đỏ vì src/lib/ho-so-lop.ts đang sửa dở; tests/parent-news.test.ts của Code 3 nay xanh); build ra thư mục riêng exit 0; `npm run check:mau`: 0 dòng của em (còn dòng của screens/PhanCongScreen.tsx — không phải của em)
- Ghi chú cho Code 2: khối `tab === 'vaothi'` trong StudentPortalScreen (thẻ "Vào phòng thi trực tuyến", dòng ~2010–2077) là nội dung của PhongVaoThi nhưng nằm trong tệp của Code 2 — vẫn Tailwind cũ; em chỉ đổi được vỏ tấm phủ.

## Việc tồn (không làm ở đợt này — 0.Planer duyệt 19/09)

- 4 tệp MÃ CHẾT (không tệp nào trong src/ import): `CardCaThiGanNhat.tsx`, `KhoiLuyenKhacPhuc.tsx` (tests/luyen-khac-phuc.test.tsx còn đòi StudentPortalScreen import nó — đang đỏ sẵn trong nền), `BongBongChatHocSinh.tsx`, `BongBongChatPhuHuynh.tsx` (test còn khẳng định màn KHÔNG chứa BongBongChat*). Không xoá, không đổi áo.
- `KhoiTienBo.tsx`: chỉ HocSinhScreen (app giáo viên) dùng → ngoài phạm vi học sinh/phụ huynh.
- Khối `tab === 'vaothi'` trong StudentPortalScreen (nội dung của PhongVaoThi) — của Code 2.
- TheCau: đợt màn thi thật (0.Planer: làm SAU CÙNG, bọc dungM3(), commit riêng, xin soát diff). Ghi chú cho lúc làm: hàng Đúng/Sai (Phần II) cao cố định 44 px bằng style nội tuyến (ba-loi-0609 khoá 44 px) → chưa đạt 48; đầu thẻ vẫn gradient --g1..--g4 của DesignSystem (chữ trắng trên gradient; ánh xạ trần `text-white` bị bỏ vì lý do này).

## Nhóm B (LuyenDeChuan, KhoiKhacPhuc3CheDo, ModalKhacPhucCauSai, KhoiCauSai) — XONG 19/09 14:35

- [x] Duyệt của 0.Planer với 4 điều chỉnh: (1) amber/yellow/orange → vai trò CẢNH BÁO (`--m3-canh-bao` #nền, `--m3-tren-canh-bao` #chữ, đúng cặp bản vẽ; khai trong m3.css của em) — TRONG KhoiKhacPhuc3CheDo amber là màu NHẬN DIỆN của khối (không phải cảnh báo) nên em đổi 125 lớp `amber-*` → `blue-*` (= primary) trong tệp đó; (2) cặp ĐÚNG/SAI có test tương phản + khác sắc riêng; (3) mọi bộ chọn có tiền tố `.m3 `, test dựng KhoiCauSai không có `.m3`; (4) chỉ quét 4 tệp nhóm B, đầu tệp ghi "TỆP SINH TỰ ĐỘNG"
- [x] scripts/sinh-m3-tuong-thich.mjs + src/components/m3/m3-tuong-thich.css (167 dòng) | bằng chứng: tests/m3-b-1909.test.tsx 15 xanh; đột biến (bỏ cô lập giáo viên / bỏ tiền tố `.m3` khỏi 1 luật / bỏ lớp m3 khỏi LuyenDeChuan) → 4 test đỏ, hoàn lại → 15 xanh
- [x] `text-white` trần KHÔNG ánh xạ (còn nằm trên gradient của DauThe); chỉ cặp `bg-<đặc>.text-white` → on-*; `dark:text-white` → on-surface (lỗi bắt được bằng ảnh: chữ tên ca gần tàng hình ở nền tối)
- [x] `:where(.m3) button { font/border/background/text-align }` (lỗi của em ở A1) đè lớp Tailwind vì không phân lớp → chỉ còn `cursor: pointer` (Tailwind preflight lo phần còn lại)
- [x] ModalKhacPhucCauSai: dùng chung với app giáo viên → `const m3 = dungM3()`; dưới /hs: gốc `m3`, hộp `m3-hop` (bỏ lớp `khac-phuc-modal` vì index.css có luật !important ép màu cũ), dải 4 màu Google ẩn; dưới `/`: DOM y hệt bản cũ (không lớp m3 nào)
- [x] chữ: bỏ 2 emoji ✨ (LuyenDeChuan, KhoiKhacPhuc3CheDo) + 1 ở Modal; không test soi
- [x] tương phản ≥ 4,5 (sáng + tối) và đích chạm ≥ 48 px: đo trong Chromium thật trên luyện đề (chưa mở + đang làm), khắc phục 4 chế độ, hộp thoại khắc phục | bằng chứng: 0 chữ dưới 4,5 ở mọi màn của em; còn 8 nút Đúng/Sai 64×44 và đầu thẻ gradient của TheCau (việc tồn, đợt màn thi)
- [x] toàn `npx vitest run` = 97 đỏ / 42 tệp (nền 98/43); test đỏ MỚI: không có; 1 test hết đỏ (parent-news của Code 3) | bằng chứng: so từng (tệp, tên test) với lần chạy A1
- [x] build ra thư mục riêng (`vite build --outDir` ngoài repo) không lỗi; `npm run check:mau`: 0 dòng của em
- [x] ảnh: docs/anh-dong-bo-m3-1909/b-*.png (luyện đề chưa mở + đang làm, khắc phục chế độ 1–4, hộp thoại khắc phục; 390 px sáng + tối); a1-*.png chụp lại sau khi sửa m3.css

## Nhóm C (BaoCaoCaThiPhuHuynhModal, BaoCaoCaThiHocSinhModal, TheTienBo → BieuDoTienBoGoogle) — XONG 19/09 14:50

- [x] Bộ sinh mở rộng: ánh xạ cả `from-/via-/to-` (điểm dừng gradient); phạm vi 9 tệp (4 nhóm B + 2 modal báo cáo + BieuDoTienBoGoogle, KhoiBaPhan, DongDemCau nằm TRONG hai modal)
- [x] BaoCaoCaThiPhuHuynhModal (chỉ phụ huynh → luôn `m3`); BaoCaoCaThiHocSinhModal (DÙNG CHUNG: học sinh, màn thi, giáo viên → `const m3 = dungM3()`; nút KHẮC PHỤC NGAY là nút chính M3; dưới `/` giữ gradient rose→amber y hệt bản cũ); dải 4 màu Google ẩn (`m3-an`)
- [x] Sửa chữ theo lệnh 0.Planer (Code 1 phát hiện): 4 mô tả mức nhận thức ở mỗi modal còn nói "Vòng 1/2/3 · Lõi Căn Bản · Trọng Tâm Cá Nhân · Thử Thách Bứt Phá" của hệ BTVN đã bỏ → chỉ còn mô tả nội dung ("Lý thuyết cơ bản, công thức, khái niệm"…). Không đụng nhãn độ khó trên thẻ câu; không test nào soi các chuỗi cũ
- [x] BieuDoTienBoGoogle (còn GV dùng): 10 màu SVG cứng → `var(--m3-*, màu cũ)` (ngoài `.m3` biến không tồn tại → rơi về đúng màu cũ); nhãn trục dùng on-surface-variant thay slate-400 (2,5:1 → đạt); dải 4 màu ẩn theo dungM3()
- [x] Lỗi em tự bắt bằng ảnh/đo: (i) `.m3 button {min-width:48px}` đè `min-width:auto` của phần tử flex → 4 nút tab co lại và đè chữ lên nhau → chỉ nút CHỈ có biểu tượng mới min-width 48 (`:has(> svg:only-child)`); (ii) thanh tab PH (`overflow-x-auto`) bị co dọc còn 31 px trong hộp flex-col → thêm `shrink-0`; (iii) `white-space:nowrap` của nút chính làm nút "Tạo bài luyện khắc phục cho con (Hạn 2h)" tràn khỏi hộp → bỏ nowrap (chỉ giữ ở "Bật ngay"/"Đã đọc"); (iv) nhóm chip đầu dòng câu sai `shrink-0` đè vòng số + tên câu → luật `.m3 button > .shrink-0.flex-wrap.justify-end` cho co (không sửa KhoiCauSai.tsx); (v) chip "Kết quả bài thi của con" có style nội tuyến rgba/rgb cứng (không phải hex nên check:mau không thấy) → 1.96:1 ở nền tối → thay bằng `m3-chip`
- [x] tests/m3-c-1909.test.tsx (PH + biểu đồ + bộ sinh, 6 test) + tests/m3-c-hs-modal-1909.test.tsx (HS modal, 6 test: `?vai=hocsinh` và `?examCode=` → m3; `/` → KHÔNG lớp m3, giữ gradient) | bằng chứng: đột biến (bỏ cô lập GV / khôi phục chữ 3 vòng / bỏ shrink-0 / bỏ m3-an) → 5 test đỏ, hoàn lại → 12 xanh
- [x] đo Chromium thật sáng+tối: 8 thẻ (HS 4 thẻ + PH 4 thẻ): 0 chữ dưới 4,5, 0 đích chạm < 48, không tràn ngang
- [x] toàn `npx vitest run` = 97 đỏ / 42 tệp; test đỏ MỚI: không (so từng tên test với lần chạy nhóm B); build riêng (vite build --outDir ngoài repo) OK; `npm run check:mau` 0 dòng của em. (`tsc -b` hiện báo 3 lỗi TS6133 ở src/lib/html-may-chieu.ts — tệp làm dở của phiên khác, không phải của em)
- Hai commit: (1) mọi thứ TRỪ BaoCaoCaThiHocSinhModal; (2) RIÊNG BaoCaoCaThiHocSinhModal.tsx + test — thuộc luồng thi thật, chờ 0.Planer soát

## SỬA LỖI 591d6e9 — báo cáo phụ huynh kết luận năng lực (0.Planer QUYẾT 1) — XONG 19/09 15:10

- [x] Nguyên nhân gốc: `loiKhuyenSuPham` của BaoCaoCaThiPhuHuynhModal viết sẵn 4 câu theo dải điểm, mỗi câu khẳng định năng lực ("Nắm rất chắc nền tảng", "phản xạ giải toán rất chắc chắn", "giữ vững phong độ đỉnh cao") — trái luật thầy chốt 18/09 | tái hiện: tests/bao-cao-khong-ket-luan-nang-luc-1909.test.tsx trên bản 5f41d50 = 5/5 đỏ; sau sửa = 5/5 xanh
- [x] Bốn dải chỉ còn nêu điểm ca này (x.xx/10) + chỉ dẫn xem mục Câu sai cần chữa; nhãn nút trong gợi ý sửa cho khớp nút thật ("Tạo bài luyện khắc phục cho con")
- [x] Bản HỌC SINH (BaoCaoCaThiHocSinhModal, lib/danh-gia-bai.ts) đã sạch các cụm cấm nên KHÔNG sửa → không cần soát luồng thi thật. Test quét cả ba tệp (bỏ chú thích) khoá "không còn"
- [ ] Ghi chú cho 0.Planer: lib/danh-gia-bai.ts (ngoài phạm vi em) còn câu "Phần lớn là bẫy đề và bước tính, không phải lỗ hổng lý thuyết" ở nhánh 8–9 điểm — cũng là suy luận năng lực từ điểm; chủ tệp quyết

## Nhóm D · TheCau — commit 1 (CSS `.m3 .the-cau`, chưa bật ở màn thi) — 19/09 15:15

- [x] `src/components/m3/the-cau.css` + MỘT dòng nạp CSS trong TheCau.tsx. Chỉ hiệu lực dưới tổ tiên `.m3` (luyện đề, khắc phục, báo cáo có sẵn); game thần thú (/hs) và app giáo viên không có `.m3` → KHÔNG đổi (test dưới /hs và /: gốc thẻ chỉ mang lớp `the-cau`, kiểu nội tuyến còn nguyên)
- [x] Bộ mặt theo bản vẽ PhieuLamBai: thẻ tonal không viền; số câu chip tròn 30 px; hàng phương án 52 px có vòng chữ cái ("A" bằng ::first-letter, dấu chấm ẩn), chọn = primaryContainer + vòng đặc, ĐÚNG = tertiary, SAI = error; Đ|S liền nhau ≥ 48 px; ô nhập viền nổi 1 px, lấy nét 2 px primary; ô lời giải đổi từ tone cảnh báo vàng sang khối tonal trung tính
- [x] Điều kiện của 0.Planer: (a) `!important` CHỈ trong `.m3 .the-cau …` — test quét tệp CSS (mọi bộ chọn của luật có !important đều bắt đầu `.m3 .the-cau`; thư mục m3/ ngoài the-cau.css chỉ còn khối tắt chuyển động); (c) test dưới ngữ cảnh game; (d) Chromium thật: hàng phương án 52 px trước và sau khi chọn (không xô), 8 nút Đ/S đều ≥ 48 px, ô Phần III inputMode=decimal 56 px; 0 chữ dưới 4,5 sáng+tối (cả chế độ xem lại đúng/sai); (e) không đụng chuỗi/kiểu nội tuyến mà xao-y-phan-hai, danh-dau-cau-hoi-lai, dau-tru-phan-ba, ba-loi-0609 khoá (test khoá lại các chuỗi đó)
- [x] tests/m3-d-the-cau-1909.test.tsx 11 xanh; đột biến (luật !important trần, hạ 48→44, thêm lớp m3 vào thẻ ở game) → 5 test đỏ, hoàn lại → 11 xanh
- [x] toàn `npx vitest run` = 100 đỏ / 43 tệp: 3 test mới đỏ ở tests/phieu-m3-1909.test.ts của CODE 2 (tệp untracked, html-phieu.ts đang sửa dở, 0 tham chiếu TheCau/m3); loại tệp đó → 97 đỏ / 42 tệp, test đỏ MỚI của em: không
- [ ] COMMIT 2 (bật ở màn thi qua `laManThi()`): CHỜ Code 2 làm vỏ màn thi — hoặc Code 2 đặt `m3` ở gốc ExamTakeScreen thì khỏi cần. Đoạn mã `laManThi` đã cất ở scratchpad phiên (m3/index.ts)

## SỬA LỖI b72ca8d — lib/danh-gia-bai.ts (0.Planer QUYẾT 2) — 19/09 15:35

- [x] Nguyên nhân gốc: `danhGiaBai(diem, soCanKhacPhuc, tongCau)` chỉ có 3 con số nhưng nhánh 8–9 điểm nói "Phần lớn là bẫy đề và bước tính, không phải lỗ hổng lý thuyết" và nhánh 5–6,5 nói "mất điểm đã sang cả phần nhận biết và thông hiểu" — hàm không có dữ liệu theo phần/mức độ ⇒ bịa. Sửa: chỉ còn điểm + số câu cần chữa + chỉ dẫn mở mục Câu sai cần chữa
- [x] tests/bao-cao-khong-ket-luan-nang-luc-1909.test.tsx thêm 6 test cho danhGiaBai: bản cũ đỏ 2/6 (điểm 8,4 và 5,5), bản mới xanh; tests/dong-nhat-bao-cao-1409.test.ts (khoá "N câu cần chữa", không "!", không "trên" khi thiếu tổng) vẫn xanh — KHÔNG phải sửa test nào

## Nhóm A2 (MaCaInput, PhongChoGame) + TamTruotHoiBai — 19/09 15:40

- [x] MaCaInput: kích thước/nền/viền ô đi qua biến `--ma-*` có giá trị dự phòng = giá trị cũ (48×56, viền 1,5 px, bo --bo-1) → ngoài `.m3` không đổi; dưới `.m3` (vao-thi.css, KHÔNG !important): ô 60 px bo 14 trắng viền 1 px, có số → vòng 2 px primary, ô đang gõ → primaryContainer + con trỏ nhấp nháy (bản vẽ ThiVaoVaKhoa). Cấu trúc div > div > div giữ nguyên (tests/the-cau.test.tsx đọc theo cấu trúc đó)
- [x] PhongChoGame: thêm vào phạm vi bộ sinh (10 tệp); móc lớp `m3-phong-cho-dau` (đầu thẻ gradient xanh-lục-chàm → primaryContainer); nội dung/chuỗi khoá (phong-cho-game-1309) nguyên
- [x] TamTruotHoiBai: bọc `m3` theo `laManThi()`; nút đóng 32→48, nút chọn nhanh 40→48, bo 28 phía trên qua biến `--tam-*` (dự phòng = giá trị cũ); danh sách TheCauChiTiet đặt trong MỘT tờ giấy (nền --p-giay, mực --p-muc) vì nền tối sẽ làm chữ thừa hưởng sáng trên giấy sáng (đo ra 1,17:1); DesignSystem.NutChinh: `color: var(--nut-chu, var(--giay))` (1 dòng; ngoài `.m3` y hệt) vì --giay trắng cố định đọc kém trên primary sáng của nền tối
- [x] laManThi() (m3/index.ts): CHỈ ?examCode= | /t/<mã> | /d/<mã> — /hs (game) KHÔNG bật; tests/m3-a2-1909.test.tsx 14 xanh, tests/m3-d2-tam-truot-1909.test.tsx 4 xanh; đột biến (bọc vô điều kiện / đổi giá trị dự phòng / thêm !important) → 3 test đỏ mỗi tệp, hoàn lại xanh
- [x] Chromium thật sáng+tối: ô mã ca, phòng chờ (có/không lỗi), tấm hỏi bài: 0 đích chạm < 48 px; 0 chữ < 4,5 ở phần của em. CÒN 4 cặp chữ nhỏ trong TheCauChiTiet (bảng --p-* "bản giấy": --p-do/--p-xanh làm chữ nhãn "A", "em chọn", "B", "đáp án đúng", 2,3–3,8:1) — NỢ CŨ, không phải do em; đổi cần sửa token trong tokens.css (tuong-phan-mau-1009 khoá)
- [x] KhoiBaiLuyen (PhieuScreen/PhieuV3: trang phiếu phụ huynh, bảng --p-* + lớp bc-* của css-bao-cao.ts): cùng lý do "bản giấy" với TheCauChiTiet → để nguyên; 0.Planer đồng ý ở lệnh giao C6/C7 ("KhoiBaiLuyen bên trong giữ giấy")

## SỬA LỖI 8475176 — cổng phụ huynh (ParentPortalScreen) — 19/09 15:58

- [x] (ii) tiêu đề sheet Khắc phục bị cắt ở 200 px: thanh trên bọc dòng (`flex-wrap sm:flex-nowrap`), tiêu đề `order-last basis-full` ở màn hẹp, h2 `truncate`; (i) chữ "ĐỖ ĐẠI HỌC" bị cắt mép trên ở màn đăng nhập: `paddingTop: max(10px, env(safe-area-inset-top))` — gốc là env() trả 0 trên máy không tai thỏ nên dự phòng không bao giờ được dùng. 2 test mới trong tests/m3-c9-phu-huynh-1909.test.tsx (đỏ trước, xanh sau); ảnh 360 px c9-tieu-de-khac-phuc-360-*, c9-dang-nhap-logo-360-*

## C6 — KhungXemPhieu (khung toàn màn bao phiếu HTML; ExamTakeScreen + app giáo viên dùng chung) — 19/09 16:05

- [x] `dungM3()` (và không phải tờ máy chiếu) → gốc `lop-xem-phieu m3`, MỘT thanh trên M3 (ThanhTren + dấu X, nút Đóng tròn 48 px aria-label "Đóng", tên phiếu), nền `--m3-surface`, iframe cũng nền surface; nút X nổi 34 px cũ chỉ vẽ khi KHÔNG M3. KHÔNG thêm dải thứ hai: vạch 48 px + tai thỏ phía trên iframe vốn đã có (padding-top của `.lop-xem-phieu`, chỗ nút X) — nay nó là thanh M3 (56 px). Quyết định "không có thanh công cụ" của thầy 04-09 (tránh HAI dải "Đóng" chồng nhau) vẫn giữ: chỉ một dải, không còn nút Đóng nào khác ngoài thanh.
- [x] Không viền đôi với `.gd-tren` của phiếu: thanh khung không viền, không bóng; nền = cùng `surface` với `.gd-tren` (test khoá: bảng surface của m3-theme.css == --gm-surface của phiếu, sáng + tối); ranh giới duy nhất là bóng cao độ 1 của `.gd-tren`. Ảnh thật khung + phiếu: docs/anh-dong-bo-m3-1909/c6-khung-phieu-lam-bai-390-{sang,toi}.png (phiếu làm bài có `.gd-tren`), c6-khung-phieu-chi-doc-390-{sang,toi}.png (phiếu chỉ đọc, không `.gd-tren`)
- [x] ThanhTren thêm prop tuỳ chọn `bieuTuong` (mặc định vẫn ArrowLeft) — PhongVaoThi không đổi
- [x] Cô lập: ở đường `/` bản mới và bản HEAD ra CÙNG DOM và CÙNG SHA điểm ảnh (2 loại phiếu × sáng/tối × 390/1280 = 8/8); đối chứng âm ở đường học sinh: 4/4 KHÁC. index.css KHÔNG đổi (tests/phieu-tuong-phan-trinh-duyet dựng lại đúng luật ở đó)
- [x] Chromium thật sáng+tối, 390 và 320 px: thanh cao 56 px, iframe bắt đầu đúng 56 px và kín tới đáy, nút Đóng 48×48 bấm được, chữ tên 16,0/14,5:1, biểu tượng 9,1/10,9:1, tên dài cắt bằng dấu ba chấm, 0 tràn ngang
- [x] tests/m3-c6-khung-xem-phieu-1909.test.tsx 20 xanh; 14 đột biến (bỏ !isMayChieu, luôn M3, nút cũ luôn vẽ, iframe luôn nền giấy, bỏ lớp m3, đổi/bỏ biểu tượng X, đổi nhãn, thêm bóng, thanh 44 px, bỏ tai thỏ, nền thanh khác, bỏ ellipsis, thêm !important, ThanhTren bỏ qua bieuTuong) → tất cả đỏ, hoàn lại xanh; 7 tệp khoá cũ (khung-xem-phieu, bam-chon-tren-de, ly-do-chi-doc…, man-phan-cong-btvn-1209, goi-len-bang-to-chieu-cham-1909, phieu-tuong-phan-trinh-duyet, m3-a1) 117 xanh KHÔNG sửa tệp nào

## C7 — PhieuScreen (trang phiếu công khai /p#<mã>, ?vai=phieu) — 19/09 16:15

- [x] Phạm vi đúng lời 0.Planer: VỎ TẢI/LỖI + nút "Xem đề em/con vừa làm". Vỏ: `bc m3` khi `dungM3()` (nền surface, chữ on-surface, nút Thử lại nút chính M3 cao 48 px bo tròn — trước đây ~42 px không có min-height); mọi kích thước/màu đi qua biến `--phieu-*` có giá trị dự phòng = giá trị cũ (như MaCaInput) → ngoài M3 không đổi
- [x] Nút "Xem đề … vừa làm": đích chạm 46 → 48 px qua `--xem-de-cao`; GIỮ bảng --p-* (không sang M3) vì nó nằm trong THẺ GIẤY của báo cáo — báo cáo rời máy thầy nên luôn giấy trắng mực đen kể cả khi máy tối; chữ primary của chế độ tối rơi lên giấy trắng là không đọc được. Vòng focus dùng --p-tim. Báo cáo, KhoiBaiLuyen, PhieuV3 KHÔNG đổi
- [x] Ảnh: c7-phieu-cho-390-*, c7-phieu-loi-390-*, c7-phieu-loi-cho-390-*, c7-phieu-nut-xem-de-390-*, c7-phieu-mo-khung-390-* (nút → khung M3 mở ra) sáng+tối
- [x] tests/m3-c7-phieu-screen-1909.test.tsx 10 xanh; 15 tệp đọc PhieuScreen: 247/249 xanh, 2 đỏ (tests/nop-phieu-khac-phuc: `.q-opt.lam-o[aria-checked]` — chuỗi CSS phiếu của Code 2, ĐÃ đỏ trong nền) — không sửa test nào; 14 đột biến → đỏ, hoàn lại xanh
- [ ] LƯU Ý cho 0.Planer (không sửa vì ngoài lệnh): `.bc-nut` trong css-bao-cao.ts (nút của KhoiBaiLuyen) cao 46 px — dưới 48 nhưng đó là bản giấy đã chốt để nguyên; muốn 48 thì đổi MỘT dòng `min-height:46px`

## SỬA LỖI (C7) — màn lỗi trang phiếu dính hai câu — 19/09 16:35

- [x] Nguyên nhân gốc: `{loi} {huongDan}` nối bằng một dấu cách nên câu lỗi không có dấu kết ("Máy chủ trả lỗi HTTP 503", "Chưa cấu hình được máy chủ") dính vào "Link vẫn còn dùng được…" / "Phụ huynh nhắn lại…". Thêm dấu chấm khi thiếu dấu câu. tests/phieu-loi-co-dau-cham-1909.test.tsx: đỏ 2/3 trước sửa, xanh sau; đột biến "luôn thêm chấm" → đỏ 1

## Kết quả vitest toàn bộ sau C6 + C7 — 19/09 16:30

- [x] 102 đỏ / 46 tệp (nền c9: 100/44). Đỏ MỚI: 5 — 4 test đo giờ (de-rieng-ho-so-1909 "dưới 500 ms", de-rieng-tran-trung ×2, xep-buoi-chua-1409 "ngân sách") + goi-len-bang-to-chieu-cham-1909 "BẤM ĐÚP" — chạy RIÊNG 4 tệp đó: 107/107 xanh (máy tải khi nhiều phiên chạy vitest cùng lúc). Test của em: 0 đỏ mới. 3 test xanh lại (nhiem-vu-adapter, than-thu-v2 ×2)

## LOGO MỚI TOÀN HỆ THỐNG (0.Planer giao 19/09, thầy chốt "quá đẹp") — 19/09 17:30

**Kiểm kê chỗ dùng logo/icon (đã đọc mã trước khi thay) → cách xử lý**

| Nơi | Cỡ · nền | Bản dùng | SW cache theo tên? | Test khoá? | Xử lý |
|---|---|---|---|---|---|
| `LogoGiaoVien/PhuHuynh/HocSinh` (ThanhBenTrai 38 + chữ, ParentPortal thanh trên 38 + chữ, KhoaApp, các màn đăng nhập, PhongChoGame 44, ExamTakeScreen 48/54) | 38–64 px · sáng+tối | ≤ 40 → nét đậm `-nho`, > 40 → thường | precache theo tên tệp (revision băm) | không tên tệp; m3-c9 chỉ soi LogoApp không có `safe-area` | 3 tệp thành vỏ mỏng của `LogoVai.tsx` (SVG qua `<img>`, hết `rounded-xl`) |
| `LogoDDH` (mã chết, 0 nơi gọi) · `LogoApp` (InfographicHuongDan 56, AppDaChuyenScreen 56) | 56 | thường | như trên | không | LogoDDH → `AnhLogo`; LogoApp không đổi (chọn theo vai) |
| Khối tay "ĐỖ ĐẠI HỌC + Kiên Trì" ở 4 màn đăng nhập/vào thi (KhoaApp, StudentPortal, ParentPortal, ExamTakeScreen) | 52–54 px | thường | — | không | thay bằng `LogoDoc` (logo 64 + tên + viên thuốc vai trò + `6,022 · 10²³`) |
| `index.html` (favicon + apple-touch-icon theo vai, `document.write`) | 64 / 180 | favicon SVG `-nho` + PNG 64 `-nho`; apple-touch 180 tràn nền | trình duyệt cache theo URL → đổi `-v3` | không | 3 thẻ `-v3` theo vai |
| `manifest.json / -hs / -ph` | 192/512 | tràn nền + **maskable 512 riêng** (mới) | `/manifest*.json` no-cache (`_headers`) | không | icon `-v3`, thêm maskable |
| `cai-app.html` = `cai-dat.html` = `cai-app/index.html` (3 bản y hệt) | header 78, xem trước 60 | tràn nền 180/192 (CSS tự bo góc) | — | không | `-v3`, đổi icon theo tab vai như cũ |
| `hs.mobileconfig` / `ph.mobileconfig` (khoá `Icon` = PNG base64 180) | 180 | tràn nền | `_headers` no-store | không | script sinh lại base64 (75+77 KB → 21+20 KB) |
| `src/sw.ts` thông báo đẩy | icon 192 / badge 64 | `logo-hs-192-v3` / `logo-hs-64-v3` | precache | không | đổi tên |
| `vite.config.ts` includeAssets | — | — | — | không | bỏ 4 tên không tồn tại (`icon-hs/ph-*`), thêm `logo-*-v3.*` |
| `apple-touch-icon.png`, `icon-192/512/512-maskable.png` (không manifest nào trỏ; còn ở `/`) | 180/192/512 | tràn nền GV | precache | không | sinh lại từ GV (giữ tên) |
| `favicon.svg` | — | nét đậm GV | — | không | tự chứa, hết `<image>` trỏ sang PNG |
| html-phieu / html-may-chieu / InfographicHuongDan | — | — | — | — | KHÔNG nhúng logo → không đổi |

- [x] 0ad168f — **nhóm 1**: `scripts/sinh-logo-png.mjs` (Chromium của Playwright, không thêm phụ thuộc; `--kiem` so từng byte: chạy 2 lần đều ✅), `scripts/do-logo-maskable.mjs`, 26 tệp `public/logo-*-v3.*`, icon/favicon/mobileconfig sinh lại. Ghi chú lệch nhỏ so với lệnh: PNG **64 px sinh từ bản NÉT ĐẬM** (không phải tràn nền) vì DOC-TRUOC xếp favicon/thông báo ở bản nét đậm và tràn nền ở 64 px làm hình thu còn ~70%; thêm bản **maskable 512 thu 90%** vì bản `-day` gốc để góc vuông bo/mái nhà chạm ngoài vòng an toàn (đo 44,3% GV, 42,4% PH so với ngưỡng 40%): sau thu 90% = 39,8 / 32,9 / 38,1%; bản tràn nền chưa thu vẫn "NGOÀI" (đối chứng của phép đo)
- [x] 4b0eb76 — **nhóm 2**: manifest ×3, index.html, cai-app ×3, sw.ts, vite.config.ts
- [x] f3773f1 — **nhóm 3**: `LogoVai.tsx` + `logo-ddh.css` (không hex; viên thuốc vai trò `rgb()` đo ≥ 4,5:1: GV 5,12 / HS 4,80 / PH 5,02 sáng, ≥ 7,97 tối; tên 12,5–16,5:1; hằng số 6,49–9,39:1), LogoGiaoVien/PhuHuynh/DDH, 3 màn đăng nhập
- [x] c92ca16 — **nhóm 4 (LUỒNG THI THẬT — CHỜ 0.Planer soát)**: `LogoHocSinh.tsx` + ExamTakeScreen đúng MỘT chỗ (khối thương hiệu màn vào thi → `LogoDoc` học sinh); PhongChoGame KHÔNG sửa dòng nào (test khoá dòng `<LogoHocSinh size={44} hienChu={false} />`); 43 tệp test đụng màn thi/phòng chờ: 0 đỏ mới
- [x] ccd79a0 — phép kiểm "không còn -v2" (quét mã, html, manifest, scripts, test) + ảnh trước/sau. **Lưu ý**: lần `git rm` 12 PNG -v2 của em bị **commit c5c1348 của Code 2 cuốn theo** (dùng chung chỉ mục) — cây làm việc đúng, chỉ là nhãn commit không nói. Bài học: không để đồ staged giữa hai lệnh; dùng `git add` rồi `git commit` NGAY
- [x] Ảnh docs/anh-logo-1909: `truoc-*` (bản cũ dựng ở worktree tạm cb5f192, đã xoá) và `sau-*`: thanh trên 3 app (`thanh-tren`), màn đăng nhập GV/HS/PH (`dn-gv/hs/ph`), trang cài app (`cai-app`), 390 px sáng + tối
- [x] Chromium thật: mở manifest từng vai (`?vai=gv|hocsinh|phuhuynh`) qua CDP `Page.getAppManifest`: 0 lỗi manifest; 3 icon mỗi vai nạp được đúng cỡ khai (192, 512 any, 512 maskable); 3 thẻ link biểu tượng (SVG, PNG 64, apple-touch 180) đều 200 đúng content-type; 0 yêu cầu hỏng/4xx. Màn đăng nhập: 0 tràn ngang, mọi `<img>` logo nạp được, bo góc 0
- [x] `vite build --outDir` ngoài repo exit 0; `kiem-sw.mjs` 10/10; dist không còn `-v2`; sw.js precache đủ 26 tệp logo mới
- [x] **Cỡ gói**: logo + icon + hồ sơ iPhone **2 498 840 B → 957 702 B (−62%)**: PNG 192 = 14,5–17,9 KB (cũ 58–59 KB), PNG 512 = 74–96 KB (cũ 362–382 KB); SVG mỗi app: thường + nét đậm = 54,6 KB (GV) / 55,3 KB (HS) / 3,5 KB (PH) < PNG 59 KB cũ, mỗi tệp ≤ 33 KB
- [x] tests/logo-bo-moi-1909.test.tsx 39 xanh (đổi .ts → .tsx); đột biến 7 (nhóm 1) + 7 (nhóm 2) + 11 (nhóm 3) + 4 (nhóm 4) + 2 (dọn -v2) đều đỏ rồi hoàn lại xanh
- [ ] CÒN MỞ (không sửa vì ngoài lệnh): (a) huy hiệu thông báo Android là mặt nạ chỉ-alpha → `logo-hs-64-v3.png` ra khối bánh quy đặc, không thấy chữ A (trước là ô vuông đặc): muốn đẹp thì thêm một PNG huy hiệu từ `logo-don-sac.svg`; (b) header trang cài app vẫn dùng logo GIÁO VIÊN cho trang "Học sinh & Phụ huynh" (như cũ); (c) app đã cài trên máy em/phụ huynh giữ icon cũ tới khi gỡ cài lại (trình duyệt không tự làm mới icon PWA đã cài)

## SỬA LỖI 140af65 — Bảng tin trạng thái trống (Code 2 báo, 0.Planer: mọi màn HS/PH đẹp khi dữ liệu trống hoàn toàn) — 19/09 17:20

- [x] (1) Nguyên nhân gốc: `refresh()` chỉ `setReport(r.report)`; máy chủ ok mà không có `report` → null mãi; thẻ "Đang tổng hợp…" hiện khi `!report` nên quay vô hạn. Sửa: cờ `daTai` (đặt trong `finally`, về false khi đổi sbd) — đang tải lần đầu → vòng quay (HS xưng "em", PH "con"; trước HS cũng thấy "của con"); tải xong chưa có bản tin → "Chưa có bản tin hôm nay. Bản tin mới lúc 00:01 mỗi ngày."; lỗi mạng → chỉ dải cảnh báo. tests/bang-tin-trong-sau-reset-1909.test.tsx 7 ca; đột biến bỏ `finally` (đúng lỗi cũ) → 6 đỏ
- [x] (2) BangVinhDanh (chung với app giáo viên, KHÔNG sửa .css/.tsx của nó) nay cùng gốc `m3` với Bảng tin; bang-tin.css ẩn dải 4 màu Google và cho chữ "DẤU ẤN MỖI NGÀY" theo `--m3-tren-canh-bao`: Chromium 390: **1,71 → 9,20:1 sáng, 7,89:1 tối**; câu trống vinh danh 9,39 / 6,49; trạng thái CÓ 3 người vinh danh so bản không-m3: không tụt (tên/khen/chân ≥ 6,1:1). tests/m3-c8-bang-tin-1909 đổi có chủ ý 1 phép khoá ("vinh danh KHÔNG bị bọc" → "cùng một gốc m3"), ghi chú trong tên test
- [x] Ảnh docs/anh-dong-bo-m3-1909/c8-bang-tin-trong-{hs,ph}-390-*, c8-vinh-danh-co-nguoi-390-*

## Kết quả vitest toàn bộ sau logo + sửa lỗi Bảng tin — 19/09 17:45

- [x] 99 đỏ / 44 tệp (nền c6c7: 102/46). Đỏ MỚI 2: (1) **tests/m3-a1-1909 "không có mã màu # ở bất kỳ tệp nào của m3/" — LỖI CỦA EM**: chú thích mới trong bang-tin.css (140af65) có chữ `#fbbc04`; đã bỏ hex khỏi chú thích, m3-a1 xanh lại; (2) tests/ca-dang-mo-1909 "HAI truy vấn…" — chạy riêng xanh (máy tải). 5 test đo giờ đỏ ở nền nay xanh lại. Test của em khác: 0 đỏ mới. Bài học: chú thích trong m3/*.css cũng bị test quét hex

## Huy hiệu thông báo + dòng nhắc icon (0.Planer giao) — 4be32ac

- [x] `logo-huy-hieu-96-v3.png` sinh từ `logo-don-sac.svg` (96 px, nền trong suốt, mọi điểm không trong suốt đều trắng, lề ≥ 8 px, nét chéo/ngang dày lên 24/20 vì 13/11 mảnh quá ở 24 dp); `sw.ts`: `badge` trỏ tới nó, `icon` vẫn logo màu 192. Test giải mã PNG (RGBA 8-bit, tự viết bộ bỏ lọc) kiểm 4 góc alpha 0 · đơn sắc trắng · lề · nguồn; đột biến 5 → đỏ
- [x] Trang cài app (3 bản y hệt): "Muốn thấy icon mới: gỡ app khỏi màn hình chính rồi thêm lại." — đúng một dòng, không làm gì hơn

## SOÁT APP GIÁO VIÊN Ở DỮ LIỆU TRỐNG (0.Planer giao 19/09) — b6cdaef — 21/09

**Cách soát (đo trên máy chủ THẬT, không giả bằng tay):** dựng Worker thật (`server/src/index.ts`) trên D1 giả bằng sqlite thật (`tests/_d1-that.ts`: lược đồ thật, DỮ LIỆU TRỐNG) qua http :8787; vỏ app giáo viên + MỘT màn trong trang xem thử (Chromium thật, Playwright chuyển hướng `omr.ttadodaihoc.workers.dev` → :8787, mã bí mật phiên đặt như sau khi mở khoá). Tệp tạm (KHÔNG commit, ở `.claude/m3-xem/`): `may-chu-trong.ts` (đóng gói bằng rolldown: `node dong-goi-may-chu.mjs`; đặt `LECH_NGAY=2` để đồng hồ máy chủ qua mốc reset, `mocReset` bật), `gv.html/gv.tsx`; kịch bản `soat-gv.mjs`, `tuong-tac-gv.mjs` ở scratchpad phiên. Gieo thêm: `dong_bo.ca_day_du`, 3 học sinh 2 lớp (giữ lại sau reset), 1 ca mở chưa có lượt.

- [x] 10 màn (Danh sách lớp, Trang chủ/Bảng tin thầy, Mở ca, Ngân hàng đề, Chi tiết ca, Ca thi, Học sinh, Gọi lên bảng, Giao BTVN, Học sinh hỏi) × 6 tình huống: 390 sáng · 390 tối · 1280 sáng · KHÔNG danh sách lớp (cả máy lẫn máy chủ) · máy chủ SAU reset (`mocReset` = 2026-09-21) · ca mở chưa em nào vào: **0 màn trắng, 0 vòng quay vô hạn, 0 lỗi đỏ, 0 tràn ngang, 0 lỗi trang**. Kịch bản bấm 19 nút trên các màn (Báo cáo / Mức độ tiến bộ của em chưa thi, Thêm học sinh, Dán link, Chọn đề, Đồng bộ, mã ca sai, Giao bài mới, Đồng bộ lại phiếu, Cấu hình…): đều ra câu chữ đúng, không lỗi
- [x] SỬA 2 câu chữ (b6cdaef, luồng thi — CHỜ 0.Planer soát): `HopChonDe` (chung Mở ca / Giao BTVN / Gọi lên bảng) kho rỗng hiện `Không có đề nào khớp "".` → "Kho đề đang trống. Vào Ngân hàng câu hỏi → Đồng bộ ngay để nạp đề."; `ExamMonitorScreen` mã ca không có nhắc "danh sách bên dưới" khi không có → `loiKhongTimThayCa` (src/lib/cau-chu-ca.ts). 7 test, đột biến 4 → đỏ
- [x] **ĐÃ XÁC NHẬN (Code 3, 21/09 00:30): cột `da_xoa` CÓ trên D1 thật** (INTEGER NOT NULL DEFAULT 0; thầy mở "Học sinh hỏi" không bị 500) — KHÔNG viết migration ADD COLUMN (chạy lại sẽ lỗi "duplicate column name"); Code 3 thêm cột vào danh sách bù ở tests/_d1-that.ts cùng đợt reset. Nội dung phát hiện ban đầu:  cột `cau_hoi_em.da_xoa` KHÔNG nằm trong migration nào của repo (chỉ `migration-1209-toan-bo.sql` tạo bảng, không có cột này) nhưng `server/src/goi-cu.ts` (`danhSachCauHoi`, thùng rác) dùng `q.da_xoa`. Trên D1 giả dựng từ repo, màn "Học sinh hỏi" trả HTTP 500 `no such column: q.da_xoa`; sau khi ALTER thêm cột thì ra "Chưa em nào gửi câu hỏi…". Nếu D1 thật CHƯA có cột này thì thầy mở "Học sinh hỏi" là 500 — cùng loại lệch lược đồ mà `tests/_d1-that.ts` đã ghi cho bảng `ca`
- [x] Không phát hiện lỗi ở tệp Code 1 (GoiLenBang, html-may-chieu, xep-buoi-chua…): màn Gọi lên bảng rỗng ra "Chưa có ca nào khớp." + "Chưa có đề nào trong máy — vào Ngân hàng câu hỏi bấm Đồng bộ trước." (không cần nhắn Code 1)
- Ghi chú: hai test đỏ lúc chạy vùng liên quan (`man-ca-thi-may-chu-moi-1109 "ghi theo lô"`, `goi-len-bang-to-chieu-cham-1909 "KHÔNG ĐẠT"`) đỏ CẢ KHI HopChonDe là bản HEAD — do WIP tờ chiếu của Code 1 (html-may-chieu/to-chieu-cau-noi đang sửa), không phải của em; `uoc-luong-bo-cuc-1909` (6 test) cũng của Code 1
- Ảnh: docs/anh-gv-trong-1909 (`gv-trong-<màn>-{390-sang,390-toi,1280-sang}`, `tt-*`, `toan-trang-giaobtvn-giao-moi-390`)

## RÀ CUỐI M3 SÁNG + TỐI (Boss giao 21/09) — sau các đợt của phiên khác

- [x] Quét Chromium 390 px, 22 trạng thái × sáng + tối (phòng vào thi, thông báo HS, luyện đề chuẩn, khắc phục 4 chế độ, báo cáo ca HS + PH, ô mã ca, phòng chờ, modal khắc phục, tấm Hỏi bài Thầy, Bảng tin HS/PH/trống, khung xem phiếu, trang phiếu + vỏ lỗi, đăng nhập HS + PH, thanh logo): lỗi trang, tràn ngang, đích chạm < 44 px, chữ dưới ngưỡng tương phản (4,5:1; 3:1 chữ lớn)
- [x] Tìm ra và SỬA: (1) `.btn-google-primary` nền tối chữ trắng trên xanh nhạt 2,11:1 (nút "Đăng nhập" HS) → d5e5dab, chỉ nút nền xanh mặc định (`:not([class*='!bg-'])`; nút rose/purple/emerald/amber của game + cổng HS giữ chữ trắng); (2) chữ nút "Xem đề … vừa làm" 4,47:1 → chàm đậm ≥ 4,5:1 (ad3917a); (3) huy hiệu "đáp án đúng" 2,54:1 / "em chọn" 3,76:1 của TheCauChiTiet (nợ A2) → token giấy `--p-xanh-dam` / `--p-do-dam` (commit sau ad3917a); (4) form đăng nhập HS 42 px, nút mắt 16 px không aria-label → Code 2 sửa bf36218 (em đo lại: 0 đích < 44, 0 chữ dưới ngưỡng, sáng + tối)
- [x] Còn lại sau rà: 0 đích chạm < 44 (checkbox 24 px của luyện đề nằm trong nhãn 334×48 → đạt), 0 chữ dưới ngưỡng ở mọi thành phần của em; DUY NHẤT còn: chip "Khá" 4,06:1 (12,5 px) trong báo cáo giấy v2 (css-bao-cao, không phải của em, hiếm gặp: link báo cáo cũ)
- [x] TheCau commit 2 KHÔNG cần: Code 2 làm C10 (đặt `m3` ở gốc ExamTakeScreen theo cách (a)); em sẽ chụp thẻ câu 3 phần sáng + tối ở màn thi thật sau khi Code 2 commit
- [x] Toàn vitest 21/09: 132 đỏ / 50 tệp; đỏ MỚI 34 so với lần chạy trước, TẤT CẢ ở tệp máy chủ của Code 3 đang sửa dở (server/src/reset-toan-app.ts, exp-d1.ts, game-v2-auth.ts, game-v2-bank.ts modified; tests reset-toan-app-1909 ×29, kenh4-than-thu ×3, cau-theo-qid, ho-so-len-bang-may-chu, ke-hoach-than-thu, man-ca-thi, nhiem-vu-adapter); 0 test của em đỏ
- [ ] CHỜ: hợp đồng token phụ huynh của Code 3 → cổng PH nhận `?ph=…` (giai đoạn mềm, SBD trần vẫn vào). (`cau_hoi_em.da_xoa`: đã xác nhận có trên D1 thật — xong)

## Trạng thái cuối phiên — 19/09 15:50

- Việc còn mở: (1) chờ 0.Planer soát 70d3408 (đã soát), e1555a4 (đã soát), 564dc08, 5d0d1c4, b72ca8d; (2) TheCau bật ở màn thi = Code 2 đặt `m3` ở gốc ExamTakeScreen (đã thoả thuận, Code 2 xác nhận cách (a)); (3) KhoiBaiLuyen + TheCauChiTiet để nguyên (đề nghị, chờ đồng ý); (4) nợ cũ ngoài phạm vi: 4 cặp chữ nhỏ --p-do/--p-xanh của TheCauChiTiet dưới 4,5:1 (tokens.css); (5) dọn: thư mục tạm `.claude/m3-xem/` (trang xem thử, KHÔNG commit) — xoá được
- Mã chết không đổi áo: CardCaThiGanNhat, KhoiLuyenKhacPhuc, BongBongChatHocSinh, BongBongChatPhuHuynh; KhoiTienBo chỉ app giáo viên

## APP GIÁO VIÊN M3 (đề bài prompt-app-giao-vien-m3.md, Boss 21/09) — G1 vỏ: 4a51718 · 6fef218
- [x] Điều hướng TRÁI: ThanhBenTrai (ngăn kéo 264 ≥1100 · rail 88 880–1100) + BottomNav (<880: 4 mục + tờ Thêm = đủ 8 mục) cùng `MUC_DIEU_HUONG`; nút Mở ca kiểm tra; màn CaiDatScreen mới (Giao diện · KhoiMayChuMoi · KhoiMatKhauApp; NganHangDe giữ bản cũ vì 7 test soi chuỗi); vỏ `src/styles/vo-thay.css` (không hex/!important); gốc App `m3 m3-thay vo-thay`; gỡ thanh PHẢI + tay kéo khỏi index.css (`rongBenTrai` còn trong danh sách dọn reset)
- [x] Sáng/tối/theo máy ÉP ĐƯỢC không sao chép bảng màu: `giao-dien-thay.ts` viết lại điều kiện `prefers-color-scheme` của mọi luật (kể cả CSS nạp muộn) — Chromium 6 tổ hợp đạt; lỗi "sáng→tối không đổi lại" bắt bằng test
- [x] TEP +16 tệp thầy (m3-c-1909 đổi có chủ ý); exam-setup.css hết hex; `dungM3()` KHÔNG đổi (component dùng chung vẫn cổng route; vỏ thầy luôn `.m3`)
- Còn: `!important` trong teacher-layout.css/exam-setup.css giữ vì thắng style nội tuyến của DesignSystem — gỡ dần ở G5 khi từng màn được viết lại. Đỏ có sẵn ở tệp Code 1 (don-moc-reset-giao-vien: khoá `buoiChua:` mới trong exam-db.ts) — không của em.

## Cổng phụ huynh ?ph= (21/09) — f3a6b05
- Làm theo `docs/token-phu-huynh-1909.md` (Code 3, giai đoạn mềm): `src/lib/ph-token.ts` (nhận `?ph=` → cất `omr_ph_pass`, xoá khỏi địa chỉ bằng history.replaceState; `/ph/xac-dinh`), `mom-api.ts` (bốn đường `/parent-news/*`, `/mom/parent-list`, `/mom/create` gửi `pass` thay `sbd`; `/mom/review` … vẫn sbd), `ParentPortalScreen.tsx` (tên con lấy từ xac-dinh, hết hạn → đúng câu máy chủ + xoá pass + vẫn nhập SBD được, đăng xuất xoá pass).
- Test `tests/ph-token-1909.test.tsx` 8 ca; đột biến 4/4 (bỏ thay pass · không xoá ?ph= · tra SBD trần · hết hạn không xoá pass) đều đỏ.
- Không phải luồng thi, không phải làn Code 1. Toàn nhóm test đọc mom-api/ParentPortal: 300 xanh; 5 đỏ là `luyen-dang-bai-1509` (đã nằm trong nen-vitest-do-1909).
- Phát hiện: `check:mau` đỏ ở `PhanCongScreen.tsx:1036,1059` (hex `#1e8e3e/#d93025/#f29900/#1a73e8`, từ 18/09) — thuộc màn Giao BTVN → xử ở G5.

## APP GIÁO VIÊN M3 — G4 Ca thi (21/09): 3044dbd (theo dõi ca) · c1090a7 (danh sách ca) · a1bf736 (nút nổi + ảnh)
- [x] ExamMonitorScreen (LUỒNG THI THẬT — chỉ phần nhìn): khung `.ca-luoi` hai cột từ 1360 px (trái học sinh · phải thẻ Thời gian + thẻ ca cũ + cảnh báo), hẹp hơn một cột với thẻ ca đứng trên như cũ; tab Tất cả·Đang làm·Phòng chờ·Đã nộp·Chưa vào (mặc định Tất cả — không ẩn em nào; Chưa vào CHỈ khi ca "chọn từng em", vì máy chỉ khi đó mới biết sĩ số); bảng 5 cột trạng thái·tiến độ·chống gian lận·điểm theo bề rộng CỘT TRÁI (container query). Mọi nút cũ + luồng xác nhận (Báo phụ huynh · Mở khoá/Đồng ý mở khoá · Cho thi lại/Xoá lượt cũ…) và các câu cảnh báo còn nguyên (test khoá).
- [x] Số MỚI hiện ra đều truy được nguồn: đồng hồ = `batDauThiLuc + thoiGianPhut − gioMayChu()` chỉ khi ca đã bắt đầu + đồng bộ giờ (ca tính giờ riêng thì nói thẳng, không bịa); tiến độ x/tổng = số câu trong bài đang lưu / mẫu số của ca (chưa biết mẫu số → "—"); "Ns ngoài màn" = `tongGiayRoiMan`.
- [ ] KHÔNG làm (ngoài "chỉ đổi nhìn" / không có dữ liệu): "Thêm 5 phút" và "Chiếu mã vào thi" trên bản vẽ = tính năng mới → cần thầy/Boss quyết; tab "Biên bản đề riêng" — khối đề riêng (câu hỏi lại, `ghiChu` tin/cảnh báo) vẫn ở thẻ ca bên phải, chưa tách card xanh/cam như bản vẽ (dữ liệu có sẵn ở `bienBanGoc.ghiChu`, làm khi Boss muốn).
- [x] LichSuCaScreen: lớp Tailwind màu rời + 9 hex → lớp `ls-*` (`lich-su-ca-m3.css`); thư mục năm sinh thành lưới thẻ (1 thư mục vẫn đầy khung); "Đồng bộ lại phiếu mọi ca" xuống CUỐI trang (nút/chữ/luồng giữ; vẫn ẩn khi chọn/xem ca đã xoá).
- [x] Sửa lỗi kèm theo: nút nổi "Mở ca" (điện thoại) đè góc phải dưới màn theo dõi ca, đúng chỗ Khoá ca/Mở khoá → ẩn ở exammonitor + examsetup. Đệm đầu trang `.gv-page` từ `env(…,12px)`=0 lên 20px (tiêu đề dính mép bo ở mọi màn thầy).
- Test: ca-thi-m3-2109 (29, đột biến 7/7) · lich-su-ca-m3-2109 (8, đột biến 4/4) · vo-thay-m3-2109 (+2). 34 test đọc ExamMonitor/LichSuCa: 5 đỏ đều là đỏ nền (đỏ cả với bản gốc): danh-dau-cau-hoi-lai ×1, de-rieng-luc-bat-dau ×1, luyen-khac-phuc ×1, phong-cho ×2.
- Ảnh: `docs/anh-app-giao-vien-2109/g4-ca-thi-*` (1440/390 × sáng/tối). Chưa làm (để G6): đo tương phản + chạm ≥44 cho tab/hàng mới; nút nhỏ trong hàng học sinh còn `minHeight:32` nội tuyến (có sẵn); thẻ ca ở LichSuCa là `div onClick` không tab được bằng bàn phím (có sẵn, sửa ở G6).
- Còn `check:mau` đỏ 200 hex toàn app (không phải của G4): PhanCong 33 · giao-dien-to-chieu 19 · index.css 19 · game/BangVinhDanh 18+18 · BangTinGiaoVien 18 · ExamSetup 14 · HocSinh 12 · ClassList 9 · GoiLenBang 6 … → phần app thầy xử ở G3/G5.

## APP GIÁO VIÊN M3 — G3 Học sinh (21/09): 4f1fc28 · kèm 667dad4 (Sửa lỗi tương phản vinh danh, Code 2 nhờ) · ce9b28e (Hôm nay hiện lyDoThieu)
- [x] HocSinhScreen: hết 12 hex + lớp Tailwind màu rời → `hs-*` (`hoc-sinh-m3.css`); hồ sơ = đầu thẻ (avatar, chip SBD/lớp, điểm gần nhất, **Giao bài riêng · Cho thi lại · Nhắn phụ huynh**) + 2 tab cũ + khối tổng quan `KhoiHoSoHocTap` (mạnh–yếu theo chuyên đề [KhoiChuyenDe cũ] · **Lịch ôn 1·3·7** 4 ô · **Kế hoạch hôm nay của em** · **Thần thú · EXP**).
- [x] ĐỔI LUỒNG (xin soát): chạm TÊN → hồ sơ tổng quan (trước: tự bật báo cáo; đóng báo cáo là văng ra danh sách → hồ sơ gần như không dùng được); nút Báo cáo trong hàng vẫn mở báo cáo như cũ; đóng báo cáo → về tổng quan. hai-nut-moi-em + 11 tệp test khác đọc màn này: xanh.
- [x] Nguồn số (chỉ đọc, `src/lib/ho-so-em-thay.ts`): `/ho-so/xem {sbd}` (mã bí mật) → đếm `cau[].trangThai` + `mocOnKe` ≤ hôm nay (ngày VN); `/hs/ke-hoach-ngay {sbd}` → ngân sách, việc (giữ thứ tự EDF của máy chủ, ≤4), tiến bộ, thần thú, EXP hôm nay. Lệnh chưa có → "đang chờ máy chủ". Đột biến 8/8, 18 test.
- [ ] CHƯA LÀM: mạnh–yếu theo TÊN dạng (`nam_kt_dang`) — hồ sơ một em (`/ho-so/xem`) chỉ có `maDang`, tên dạng chỉ có ở `hom-nay-thay` (top dạng theo lớp) → cần Code 3 thêm tên dạng vào `/ho-so/xem` nếu thầy muốn; master–detail hai cột như bản vẽ (giữ hai trang: danh sách → hồ sơ, vì 12 tệp test khoá luồng); "Giao bài riêng" chưa chọn sẵn em (làm ở G5 cùng Giao BTVN); "phụ huynh: đã kết nối" trên bản vẽ chưa có nguồn số.
- [x] Hôm nay (ce9b28e): khối máy chủ không tính được → hiện ĐÚNG `lyDoThieu` (đo Worker thật e836aef trên D1 trống: tên trường khớp hợp đồng).
- [x] 667dad4: `.honors-rank`/`.honors-score`/tên hạng 1 trong m3/bang-tin.css: thấp nhất 7,78:1 (đo 390, HS+PH, sáng/tối, có/không `.dark`) — bẫy: nền hạng 1 cứng màu kem nên ĐỔI CẢ nền lẫn chữ.

## APP GIÁO VIÊN M3 — G5 (15f9bc6) + G6 (0cc503d) + nối /gv/ke-hoach-em (3a5e099, sau ba1ea0a)
- [x] G5: 6 tệp thầy (PhanCong · BangTinGiaoVien · ExamSetup · ClassList · CauHoi · NganHangDe) hết 83 hex → token M3 (bảng ánh xạ: primary/on-tertiary-container/on-error-container/tren-canh-bao; nền đặc đi cặp on-*). LÔ BTVN: `KhoiBtvnLo` dùng chung Hôm nay + tab theo dõi của Giao bài tập về nhà (đọc `dangChay` của lệnh Hôm nay). "Giao bài riêng" → `sbdGiaoRieng` → Giao BTVN mở sẵn chế độ chọn từng em. So HEAD: cùng 28+2 đỏ nền, không đỏ mới.
- [x] G6 (đo Chromium thật, `scratchpad/g6.mjs`): 11 màn × 1440/1280/390 × sáng/tối, dữ liệu đủ + trống → 0 chữ dưới AA, 0 vùng chạm nhỏ (điện thoại <44 / máy tính <40), 0 tràn ngang, 0 lỗi console. Chỗ đo ra & đã sửa: "DẤU ẤN MỖI NGÀY" 1,71:1 ở Hôm nay (bảng vinh danh thầy không nạp bang-tin.css) · nút 23/30/32/40px → 44 · ô nhập/summary/min-width trong vo-thay.css · chip "Tôi tự chọn bài để chữa" 3,47:1 (GoiLenBang của Code 1 → Code 1 tự đổi, 4737b62).
- [x] Sửa lỗi kèm theo: lệnh có ghi — `layKeHoachEm` bỏ `/hs/ke-hoach-ngay` (Boss bắt được khi soát G3), nối `/gv/ke-hoach-em` chỉ đọc; Hôm nay hiện đúng `lyDoThieu`; tương phản vinh danh (Code 2 nhờ, 667dad4); `m3-tuong-thich.css` sinh lại (b81ebda) — bài học: chạy m3-b/m3-c trước khi commit tệp trong TEP.
- Loose ends: `!important` trong teacher-layout.css/exam-setup.css (thắng style nội tuyến của DesignSystem) — chưa gỡ; master–detail hai cột ở Học sinh (giữ hai trang vì 12 tệp test khoá luồng); tên DẠNG ở hồ sơ (cần Code 3 thêm vào /ho-so/xem); "Thêm 5 phút"/"Chiếu mã vào thi" (Boss hỏi thầy); tab "Biên bản đề riêng" + thẻ xanh/cam đề riêng ở cột phải Ca thi; `check:mau` còn hex ở index.css (19, nền slate + readable-solution), game/*.css, BangVinhDanh.css (18) — không thuộc app thầy.

## BTVN NÂNG ĐỠ — app thầy, bước 2 (8ec0d82; bản vẽ dc1d6af)
- [x] Nối: `src/lib/btvn-nang-do-thay.ts` (mọi thứ dính hợp đồng `docs/hop-dong-btvn-nang-do-2109.md` nằm ở đây + `giaoBtvn`; đổi hợp đồng chỉ sửa tại đó — `qidCuaCau` là điểm nối mã câu, hiện = `q.id`, CHƯA đối chiếu với server thật).
- [x] Màn Giao (`PhanCongScreen` + `KhoiCaNhanHoa`): công tắc Cá nhân hoá MẶC ĐỊNH BẬT (tắt = y như cũ, không gửi trường mới) · 3 ô số (lõi/dạng/ghim) · GHIM TUỲ CHỌN (0 câu ghim không cảnh báo, Giao/Xem trước không bao giờ khoá vì thiếu ghim; trần 10) · "Xem trước phân bổ" (`/btvn/xem-truoc`, ≤50 em/lượt, danh sách câu cho MỘT em, không xếp hạng). Xem trước + Giao dùng CHUNG một `hatGiong`.
- [x] Nói thật: máy chủ 404 ⇒ "chưa có lệnh Xem trước phân bổ"; `/btvn/giao` không trả `caNhan:true` ⇒ cảnh báo cam "đã giao NHƯ CŨ, không phân bổ riêng"; `canhBao loi_it_hon_6`, `boQuaQid`, `thieuMeta` hiện đúng lời. Không giả số.
- [x] Theo dõi: thẻ "N câu trong bài · Cá nhân hoá · lõi X"; từng em "Bộ của em N câu · chặng a/b" / "Chưa mở bài — bộ câu chưa chốt", "Lõi x/y (d/10)", "Câu thưởng chưa đúng N (không tính vào điểm)".
- [x] Bằng chứng: 34 test mới (thay 21 + màn giao 8 + theo dõi 5, có ca ghim=[]) + đột biến 11/11 bị bắt; m3-b/m3-c xanh; `check:mau` sạch; `tsc -b --force` exit 0 + `npm run build` exit 0; ảnh 1440/390 sáng/tối `docs/anh-app-giao-vien-2109/bn-*.jpg` (11 tệp ≤ 102 KB); đo g6: 0 tương phản < AA, 0 vùng chạm nhỏ, 0 tràn ngang.
- [ ] CHƯA thử với Worker thật (Code 3 chưa đẩy lệnh) — khi lên: đối chiếu định dạng qid, số lõi thật, thứ tự chặng.
- Ghi chú: `tests/btvn-nang-do-2109.test.ts` (Đợt 2 `thichNghiChangSau`) đang đỏ do Code 1 sửa dở `src/lib/btvn-nang-do.ts` — không phải của phiên này, không đụng.
- [x] SỬA MÃ CÂU (9526c0e, Boss chặn đẩy 8ec0d82): trước gửi `q.id`; máy chủ chấm bằng `<mã tờ kho gốc>-<phần>-<so>` (`homeworkQuestions`, btvn-grading.ts:128; `goc` = bỏ hậu tố -TN/-DS/-TLN; `so` = trường `so` trong tờ kho). Nay `qidCuaCau(maDe, phan, q)` lấy `so` ở đuôi `q.id` khi tiền tố là mã gốc hoặc mã có hậu tố (`X-TN-I-3` ⇒ `X-I-3`); câu mang mã riêng của tờ khác (tờ ghép) ⇒ KHÔNG gửi, không đoán (đoán = gắn nhãn nhầm) — máy chủ tự điền nhãn từ tờ kho, đếm `thieuMeta`. `taoCauGiao` cũng bỏ câu máy chủ loại (phần III đáp án tự luận, mục -VD/-DT) + khử trùng ⇒ `boQuaQid` không báo oan. Lời cảnh báo boQuaQid/thieuMeta sửa đúng hành vi (máy chủ lấy nhãn từ kho).
- [x] Test khoá `tests/btvn-nang-do-ma-cau-2109.test.ts`: tờ mẫu đủ ba phần (so 1,2,49 / 3,4 / 5..9) — qid app thầy = qid `homeworkQuestions` thật của máy chủ (import thẳng), cùng thứ tự; đột biến 9/9; `tsc -b --force` + build exit 0.

## BỘ NÃO A.I — app thầy (055f1f1; bản vẽ f2dfab6 — giọng cũ, đã thay bằng ảnh thật `docs/anh-app-giao-vien-2109/bnao-*.jpg`)
- [x] Lớp nối `src/lib/bo-nao-thay.ts` bám `docs/hop-dong-bo-nao-2109.md` (Code 1: dem-qua, nhat-ky, dieu-chinh/bo, cau-hinh; đã thêm theo đề nghị của em: soEmHoTro, apDung, ketQua/ketQuaChu, tuGo, ngayDieuChinh, khacPhuc, lyDoBo — em còn xin loiNhanChoPhuHuynh + thuTuan ở nhat-ky). Không có lệnh (404) ⇒ lời thật "Máy chủ chưa có bản tin bộ não", không dựng số.
- [x] Hôm nay: "Bộ não A.I · đêm qua đã hỗ trợ N em" (chạy thử: "đã soi N em"); dòng ĐÃ LÀM + kết quả hôm sau; chạy thử ghi ĐỀ XUẤT (không nói đã làm); nút chỉ "Xem" (mở hồ sơ / Gọi lên bảng — hàm sẵn có) + "Bỏ điều chỉnh" (hỏi lại, gọi /ai/dieu-chinh/bo {sbd, ngay điều chỉnh}); dòng chỉ-báo (thầy xem lại · vắng ≥ 5 ngày) và điều chỉnh đã tự gỡ không có nút Bỏ; quá 36 giờ ⇒ cảnh báo; nhãn "CHẠY THỬ — chưa tác động tới học sinh" CHỈ khi chế độ thử (thầy đổi chữ bóng → thử).
- [x] Hồ sơ em: Nhật ký điều chỉnh (ngày · núm kể cả khắc phục/ôn sớm · lý do bằng số · kết quả hôm sau · trạng thái thật: đã áp / chỉ ghi sổ / tự gỡ / đã bỏ) + NGUYÊN VĂN lời cho em, cho phụ huynh, thư tuần kèm ngày (ghi "CHƯA gửi — chạy thử" khi chưa áp) + Bỏ điều chỉnh này (chỉ khi còn hiệu lực).
- [x] Cài đặt: công tắc + chế độ Chạy thử/Thật theo lớp (`POST /ai/cau-hinh`); chuyển Thật phải xác nhận; chỉ đổi màn khi máy chủ xác nhận, lỗi ⇒ "Chưa lưu được: …". Đổi một lớp KHÔNG làm đổi lớp khác (test).
- [x] Bảng tin giáo viên: bản gọn (đêm hiện tại chỉ tiêu đề + số đếm vì khối đầy đủ ở ngay trên cùng màn Hôm nay; chọn ngày khác ⇒ kèm 3 dòng). Ghi chú: ExamHub gắn cả Hôm nay lẫn Bảng tin trên một màn ⇒ `teacher-news` KHÔNG cần thêm mục Bộ não (tránh trùng).
- [x] Bằng chứng: 28 test + đột biến 14/14; tsc -b --force + build exit 0; m3-b/m3-c xanh; 3 test đỏ ở man-hoc-sinh-hoi / tim-thay-giao-bai-tap ĐÚNG như HEAD sạch (nền đỏ); ảnh 1440/390 sáng/tối, đo 0 tương phản < AA, 0 vùng chạm nhỏ, 0 tràn ngang, 0 lỗi console.
- [ ] CHƯA thử với Worker thật (/ai/* chưa lên). Khi lên: đối chiếu tên trường thật (loai, apDung, soEmHoTro), thử Bỏ điều chỉnh + công tắc trên một em/12121212.
