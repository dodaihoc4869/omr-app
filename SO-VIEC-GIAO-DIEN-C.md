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

## Nhóm A1 (PhongVaoThi + ThongBaoHocSinh) — XONG 19/09 14:12

- [x] thư viện `src/components/m3/` (index.ts: `dungM3()`; NutTron, ThanhTren; m3.css) | bằng chứng: 21 test xanh, đột biến bỏ lớp `m3` → 2 test đỏ, hoàn lại → 21 xanh
- [x] PhongVaoThi: gốc `m3 m3-phong`, thanh trên dính (nút Quay lại tròn 48 px), giữ aria-label "Vào phòng thi" | bằng chứng: test + ảnh a1-phong-vao-thi-390-{sang,toi}.png
- [x] ThongBaoHocSinh: chuông 48 px, tấm bo 28, thẻ tonal (chưa đọc = primary, đã đọc = trung tính), skeleton thay spinner, "Đang bật" bỏ ký tự ✓ dùng biểu tượng; MỌI logic/API/chuỗi giữ nguyên | bằng chứng: test + ảnh a1-thong-bao-390-*, a1-thong-bao-trong-390-*
- [x] tương phản ≥ 4,5 và đích chạm ≥ 48 px, sáng + tối, không tràn ngang | bằng chứng: bộ đo getComputedStyle trong Chromium thật (đối chứng chữ xám nhạt bị bắt: 2,32)
- [x] toàn vitest 98 đỏ / 43 tệp = đúng nền (đổi chỗ 1: tests/ho-so-lop-nam-kt-1909.test.ts của Code 1 mới đỏ vì src/lib/ho-so-lop.ts đang sửa dở; tests/parent-news.test.ts của Code 3 nay xanh); build ra thư mục riêng exit 0; `npm run check:mau`: 0 dòng của em (còn dòng của screens/PhanCongScreen.tsx — không phải của em)
- Ghi chú cho Code 2: khối `tab === 'vaothi'` trong StudentPortalScreen (thẻ "Vào phòng thi trực tuyến", dòng ~2010–2077) là nội dung của PhongVaoThi nhưng nằm trong tệp của Code 2 — vẫn Tailwind cũ; em chỉ đổi được vỏ tấm phủ.
