# Prompt — Màn hình duy nhất "Bảng nhiệm vụ" cho app học sinh và app phụ huynh (Material 3)

Soạn 19/09/2026. Gõ `HÃY THỰC THI PROMPT NÀY` mới làm.
Liên quan: `DE-XUAT-CA-NHAN-HOA-1909.md` (nguồn dữ liệu nhiệm vụ), `src/styles/tokens.css`, `src/components/DesignSystem.tsx`.

### Góc nhìn khác

Thầy đang mô tả một màn hình đẹp. Bài toán thật là **một quyết định**: em mở app, trong 3 giây phải biết *làm việc gì ngay bây giờ* và *vì sao đáng làm*. Mọi thứ khác — thần thú, nền động, vinh danh — chỉ có giá trị nếu chúng kéo mắt về đúng thẻ "Làm ngay" và cho em một lý do quay lại ngày mai. App hiện có 6 tab + 2 bảng trợ lý + game, tức là 8 nơi để đi lạc; màn mới không thêm gì, nó **gỡ 7 nơi** và giữ một. Câu hỏi nên hỏi không phải "đặt thần thú ở góc nào" mà là "thần thú phản ứng thế nào khi em xong lô hôm nay" — đó mới là thứ kích thích mở app.

### Người top 0,1% làm gì

- **Một hành động chính trên màn đầu tiên**, đúng luật Material 3: một nút nổi bật, còn lại là thẻ tonal. Mức ưu tiên mã hoá bằng **vai trò màu M3** (error / tertiary / primary / secondary container) **và vị trí**, không phải bằng 5 màu badge tự nghĩ.
- **Ngân sách chuyển động**: nền động chỉ là CSS gradient trôi 20–30 s trên 2 lớp, không JS, tắt hẳn khi `prefers-reduced-motion`; thần thú ở góc dùng `Spirit2D compact` (có sẵn), **không** dựng `Spirit3D` (three.js) trên màn chính vì máy Android tầm trung không giữ được 60 fps.
- **Không đẻ bộ màu thứ hai.** `tokens.css` đã có `--gg-xanh/--gg-do/--gg-vang/--gg-luc` và bậc chữ/khoảng cách. Ánh xạ vai trò M3 lên token có sẵn qua Tailwind v4 `@theme`, một nguồn sự thật.
- **Vinh danh không viền = dùng cao độ và tonal surface**, không dùng `border`; "lung linh" là một dải shimmer chạy qua 1 lần lúc tải và nhịp 8 s, không phải glow liên tục. Máy chủ đã xếp top 3 mỗi ngày kèm thần thú/biệt danh/cấp (`server/src/honors.ts`) — dùng, không tính lại ở client.
- **Trạng thái trống phải thật**: chưa có bài → thẻ "Hôm nay chưa có việc — thần thú đang nghỉ", không bịa nhiệm vụ; chưa đo được tốc độ → nói "chưa đo". Cấm chữ "nắm chắc".
- **Đo được**: LCP < 2,5 s trên 3G giả lập, 60 fps khi cuộn, đích chạm ≥ 48 dp, tương phản ≥ 4,5:1, skeleton thay spinner.

### PROMPT

```
VAI TRÒ
Kỹ sư giao diện trưởng của omr-app (React + Vite + Tailwind v4, mã tiếng Việt), 10 năm làm app học tập cho học sinh cấp 3 trên Android tầm trung, đã áp Material 3 cho 5 sản phẩm.

BỐI CẢNH
Kho mã /Volumes/SSD NGOÀI/omr-app. Lớp luyện thi Hoá 100–300 học sinh; học sinh mở app trên điện thoại 360–430 px, phụ huynh mở trên điện thoại. Hiện app học sinh (src/screens/StudentPortalScreen.tsx) có 6 tab (diem, btvn, mom, khacphuc, vaothi, thanthu) + BangTroLyHocSinh + BangVinhDanh; app phụ huynh (ParentPortalScreen.tsx) có BangTroLyPhuHuynh + BangTinPhuHuynh. Đã có: src/styles/tokens.css (màu, chữ, khoảng cách, bo góc, bóng, --gg-* màu Google), src/components/DesignSystem.tsx (6 thành phần dùng chung, chưa áp), src/game/than-thu-v2/Spirit2D.tsx (thần thú 2D, có compact và reducedMotion), src/components/PhongVaoThi.tsx (vào thi), src/components/BangVinhDanh.tsx + máy chủ /honors (top 3 mỗi ngày kèm pet/nickname/level, server/src/honors.ts), src/lib/tro-ly-ca-nhan.ts tongHopKeHoachTroLy (danh sách nhiệm vụ + capDoUuTien + radar). Sắp có: lệnh máy chủ /hs/ke-hoach-ngay trả kế hoạch ngày đã xếp (DE-XUAT-CA-NHAN-HOA-1909.md, GĐ 2) — màn mới phải nhận được CẢ HAI nguồn qua một adapter.

NHIỆM VỤ
Thay toàn bộ trang chủ của app học sinh và app phụ huynh bằng MỘT màn hình "Bảng nhiệm vụ" theo Material 3, gồm đúng 5 vùng: (1) đầu trang có thần thú ở góc + lời chào + chuỗi ngày; (2) thẻ "Làm ngay" duy nhất; (3) danh sách nhiệm vụ phân 4 bậc; (4) nút Vào thi; (5) thẻ Vinh danh top 3 — trên nền động tinh tế; mọi chức năng cũ mở từ thẻ dưới dạng sheet toàn màn, không còn thanh tab.

NGUYÊN TẮC BẮT BUỘC
- Material 3: ánh xạ vai trò màu (primary/secondary/tertiary/error + *Container + on*, surface 5 bậc, outline) lên token có sẵn trong tokens.css bằng Tailwind v4 @theme; seed primary = --gg-xanh #1a73e8; KHÔNG hard-code mã màu trong .tsx (test grep "#[0-9a-f]{6}" trong src/components/bang-nhiem-vu/ phải ra 0 kết quả). Bo góc theo thang M3: 12/16/28 px; chữ theo thang có sẵn --cx-1..6; đích chạm ≥ 48 dp; tương phản ≥ 4,5:1 ở cả sáng và tối (tokens.css đã có prefers-color-scheme).
- Bốn bậc nhiệm vụ, mỗi bậc một vai trò màu + một vị trí, nhìn là biết: (1) KHẨN — errorContainer, đứng đầu, có đồng hồ đếm lùi; (2) BẮT BUỘC HÔM NAY — primaryContainer; (3) NÊN LÀM — secondaryContainer; (4) TUỲ CHỌN/THỬ THÁCH — tertiaryContainer. Nguồn: capDoUuTien và thứ tự của tongHopKeHoachTroLy hôm nay; khi /hs/ke-hoach-ngay có thì đọc viec_json (batBuoc, khan, cong) qua cùng adapter src/lib/nhiem-vu-adapter.ts — một hàm thuần, có test cho cả hai nguồn.
- Đúng MỘT thẻ "Làm ngay" (M3 filled, cao độ 3) là việc đầu tiên đang mở; các việc bị cổng (chưa xong việc trước) hiện mờ 38% với nhãn "Mở sau khi xong: <tên việc>"; không có hai nút nổi bật trên màn.
- Thần thú: Spirit2D compact 96 dp ở góc trên phải, motion 'idle'; khi em vừa xong một việc trong phiên → motion 'victory' 1,2 s rồi về idle; chạm → mở KhungThanThuToanManHinh (game đầy đủ). KHÔNG dựng Spirit3D trên màn chính.
- Nền động: 2 lớp radial-gradient từ primaryContainer/tertiaryContainer, trôi bằng CSS @keyframes 24 s, độ mờ ≤ 18%, GPU-only (transform/opacity), tắt hoàn toàn khi prefers-reduced-motion hoặc khi pin tiết kiệm (navigator.getBattery không có thì bỏ qua); không JS animation loop.
- Vinh danh: thẻ surfaceContainerHigh, không border; top 3 từ /honors (live=true), mỗi dòng: hạng, thần thú (SpiritArt 40 dp), biệt danh hoặc tên viết tắt theo luật hiện có của BangVinhDanh, điểm, bài; shimmer 1 lần lúc tải (1,4 s) + nhịp nhẹ mỗi 8 s; không có dữ liệu → "Hôm nay chưa có bài chấm xong", không bịa.
- Nút Vào thi: M3 extended FAB, góc dưới phải, nhãn "Vào thi", mở PhongVaoThi như hiện nay; khi có ca đang mở cho lớp của em thì FAB đổi thành tertiary và có chấm nhịp; giữ y nguyên luật vào thi/mã ca.
- Hiệu năng và tiếp cận: LCP < 2,5 s trên Chrome DevTools "Slow 3G"; không rớt dưới 55 fps khi cuộn danh sách 20 thẻ trên Moto G-class (giả lập CPU 4x slowdown); skeleton cho 3 vùng dữ liệu, không spinner; mọi thẻ có aria-label; hỗ trợ cỡ chữ hệ thống 130%.
- Phụ huynh: cùng thành phần BangNhiemVu với prop vaiTro='phuhuynh': đọc-chỉ, thêm một hàng hành động "Giao bài cho con" mở luồng mom hiện có; không hiện nút Vào thi; thần thú của con vẫn hiện.

GIẢ ĐỊNH ĐÃ DÙNG (thầy sửa một dòng là xong)
- Font: giữ --sans (Be Vietnam Pro) thay Google Sans (không có giấy phép); Roboto làm dự phòng.
- Thanh tab dưới bị bỏ ở app học sinh và phụ huynh; các màn cũ (Xem điểm, BTVN, Bài gia đình giao, Khắc phục, Thần thú) mở bằng sheet toàn màn từ thẻ tương ứng hoặc từ menu 3 chấm ở đầu trang; giáo viên không đổi.
- Chuỗi ngày ở đầu trang = chuoiNgayHoc hiện có (đếm ngày nộp); khi GĐ 2 của đề xuất cá nhân hoá lên thì đổi sang streak "đạt" — adapter che khác biệt này.
- Vinh danh dùng luật ẩn danh hiện có của BangVinhDanh (biệt danh thần thú nếu có, không lộ SBD).
- Chế độ tối dùng token đã có; không thêm nút chuyển sáng/tối.
- Không đổi gì ở logic nộp bài, thi, chấm, EXP; đây là thay vỏ và cách vào chức năng.

KHÔNG ĐƯỢC LÀM
- Không thêm thư viện UI (MUI, framer-motion, lottie); chỉ Tailwind v4 + CSS + lucide-react đã có.
- Không tự xếp lại thứ tự nhiệm vụ ở lớp giao diện; thứ tự là của adapter/dữ liệu.
- Không chữ "nắm chắc", không huy hiệu/điểm số tự bịa, không hiện nhiệm vụ khi nguồn trả rỗng.
- Không quá 1 nút nổi bật, không quá 4 màu vai trò trên một màn, không glow/particle chạy liên tục.
- Không đụng màn giáo viên; không sửa test đang xanh ngoài ke-hoach-giao-dien.test.tsx và mo-bai-tu-bang-tin.test.tsx (chỉ đổi selector, giữ hành vi).

ĐỊNH DẠNG ĐẦU RA
1. Thư mục src/components/bang-nhiem-vu/: BangNhiemVu.tsx, DauTrang.tsx, TheLamNgay.tsx, DanhSachNhiemVu.tsx, TheVinhDanh.tsx, NutVaoThi.tsx, NenDong.css, m3-theme.css (khối @theme ánh xạ token); src/lib/nhiem-vu-adapter.ts.
2. StudentPortalScreen.tsx và ParentPortalScreen.tsx chỉ còn render BangNhiemVu + các sheet; diff ≤ 400 dòng mỗi tệp.
3. Ảnh chụp bằng Chromium ở 360×780, 390×844, 430×932, 768×1024, mỗi cỡ sáng và tối = 8 ảnh, lưu docs/anh-bang-nhiem-vu-<ddmm>/ và gửi cho thầy; một ảnh trạng thái trống, một ảnh trạng thái có việc khẩn.
4. Test: tests/nhiem-vu-adapter-<ddmm>.test.ts (2 nguồn ra cùng cấu trúc, 4 bậc đúng vai trò, cổng đúng), tests/bang-nhiem-vu-<ddmm>.test.tsx (1 nút nổi bật, thẻ mờ khi bị cổng, trống thì không bịa, reduced-motion tắt nền); chạy toàn bộ vitest, số đỏ không tăng so với nền 98 test/43 tệp.
5. Mục mới đầu SO-VIEC.md: việc, bằng chứng (số test, Lighthouse mobile ≥ 90 hiệu năng và ≥ 95 tiếp cận, tem bản dựng, link phát hành).
6. Một đoạn 5 dòng cho thầy: em sẽ thấy gì khác khi mở app.

NGHIỆM THU (đạt/trượt)
- Mở app học sinh bằng tài khoản có 1 BTVN khẩn + 1 lô hôm nay + 1 bài mẹ giao: thẻ "Làm ngay" là BTVN khẩn, đúng 1 nút nổi bật, 4 bậc đúng 4 màu vai trò; bấm "Làm ngay" mở đúng bài (payload giữ nguyên {bt}).
- Tài khoản không có việc: hiện thẻ trống với chữ nói thật, không có thẻ nhiệm vụ nào, thần thú vẫn hiện.
- grep "#[0-9a-f]{6}" -ri src/components/bang-nhiem-vu/ → 0 kết quả; grep "Spirit3D" trong thư mục đó → 0 kết quả.
- Lighthouse mobile (Slow 3G, CPU 4x): Performance ≥ 90, Accessibility ≥ 95; LCP < 2,5 s.
- Bật "Reduce motion" trong hệ thống: nền đứng yên, thần thú idle tĩnh, shimmer vinh danh tắt.
- /honors trả 3 người: thẻ vinh danh hiện đủ 3 với thần thú; trả rỗng: hiện dòng "Hôm nay chưa có bài chấm xong".
- Toàn bộ vitest: số đỏ ≤ 98, số tệp đỏ ≤ 43; build thành công; service worker 10/10; phát hành xong curl 3 URL trả 200.
```

### Bản vẽ đã duyệt (19/09)

Canvas: https://claude.ai/artifact/RFUcbWFDRPQ9PPY7EPAYnK — 5 khung 390 px, đọc bằng Artifact tool (`read` từng tệp `project/*.dc.html`) để lấy đúng màu vai trò, bo góc, cỡ chữ, khoảng cách, thứ tự vùng:
- `project/Main.dc.html` — học sinh, sáng (bản gốc, mọi khung khác suy từ đây)
- `project/HocSinhToi.dc.html` — học sinh, tối; nút Vào thi khi **ca đang mở**
- `project/HocSinhTrong.dc.html` — học sinh, **không có việc** (thần thú nghỉ, không bịa việc)
- `project/PhuHuynhSang.dc.html`, `project/PhuHuynhToi.dc.html` — phụ huynh, đọc-chỉ, chip trạng thái, ô cảnh báo tải trước khi giao bài

Màu vai trò đã dùng trong bản vẽ (sáng / tối): primary #0b57d0 / #a8c7fa · primaryContainer #d3e3fd / #0842a0 · secondaryContainer #c2e7ff / #004a77 · tertiaryContainer #c4eed0 / #0f5223 · errorContainer #f9dedc / #8c1d18 · surface #fdfbff / #131314 · surfaceContainer #f0f4f9 / #1e1f20 · surfaceContainerHigh #e9eef6 / #282a2c. Khi build, các mã này đi vào `m3-theme.css` (một nguồn), không nằm trong .tsx.

### Ba câu hỏi làm prompt sắc hơn

1. Bỏ hẳn thanh tab dưới, hay giữ 2 nút (Bảng nhiệm vụ / Thần thú)? Bỏ hẳn thì màn sạch nhất nhưng em quen tab cũ mất vài ngày.
2. Thần thú ở góc có hiện **thanh EXP** nhỏ không? Có thì kích thích hơn, nhưng 3 bảng EXP hiện chưa thống nhất (game/academic/V1), phải chọn một.
3. Vinh danh top 3 theo **ngày** (như máy chủ đang có) hay theo **tuần**? Theo ngày thì hầu hết ngày không có ca thi sẽ trống.

19/09/2026
