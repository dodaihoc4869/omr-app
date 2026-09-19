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
