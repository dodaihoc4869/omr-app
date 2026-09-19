# SỔ VIỆC — GIAO DIỆN VIỆC C, COMPONENT ĐỘC LẬP (phiên Code 4)

Lập 19/09/2026. Theo `DIEU-PHOI.md` luật 4: không sửa `SO-VIEC.md` (của Code 3) và `SO-VIEC-GIAO-DIEN.md` (của Code 2).
Giao bởi 0.Planer (thầy đã uỷ quyền 100%: "nghe theo điều phối, không cần tôi xác nhận").

## Nguyên văn việc giao (0.Planer, 19/09)

- [ ] "đồng bộ Material 3 cho các COMPONENT ĐỘC LẬP mà học sinh/phụ huynh bấm vào" | bằng chứng: (chưa có)
- [x] BƯỚC 0: kiểm kê 20 tệp (có thật không, ai import, dùng chung với GV không, test soi gì) → nhắn 0.Planer | bằng chứng: bảng gửi 19/09; 0.Planer DUYỆT 17:00 (làm 15 tệp, bỏ 5: KhoiTienBo chỉ GV + 4 mã chết)
- [x] "DÙNG LẠI token và thành phần của Code 2, KHÔNG tạo bảng màu thứ hai" | bằng chứng: tests/m3-a1-1909.test.tsx quét src/components/m3/*: 0 mã #, 0 khai báo --m3-* mới; check:mau 0 dòng ở tệp của em
- [ ] "Mỗi nhóm MỘT commit; chạy test các tệp liên quan; toàn `npx vitest run` một lần trước khi báo xong nhóm (ghi Nhật ký trước; nền 98 đỏ/43 tệp)"
- [ ] "`npm run build` ra thư mục riêng (đừng đè dist/)"
- [ ] "Xong mỗi nhóm nhắn tôi: commit, tệp đã sửa, ảnh 390 px sáng+tối ở docs/anh-dong-bo-m3-1909/"
- [ ] Điền dòng "Code 4" trong DIEU-PHOI.md thành "đang làm"

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
