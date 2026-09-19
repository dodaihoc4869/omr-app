# SỔ VIỆC — GIAO DIỆN "Bảng nhiệm vụ" (phiên Code 2)

Lập 19/09/2026 12:25. Theo `DIEU-PHOI.md` luật 4: phần giao diện ghi sổ ở đây, KHÔNG sửa `SO-VIEC.md`.
Đặc tả: `prompt-giao-dien-nhiem-vu-hoc-sinh-phu-huynh.md`. Bản vẽ: https://claude.ai/artifact/RFUcbWFDRPQ9PPY7EPAYnK.
Vùng được sửa: `src/components/bang-nhiem-vu/**`, `src/lib/nhiem-vu-adapter.ts` (DUY NHẤT tệp trong src/lib), `src/screens/StudentPortalScreen.tsx`, `src/screens/ParentPortalScreen.tsx`, test tương ứng, `docs/anh-bang-nhiem-vu-1909/`, tệp này.
KHÔNG sửa: `tro-ly-ca-nhan.ts`, `lich-lo-btvn.ts`, `html-phieu.ts`, `btvn-cho-em.ts`, `server/**`, `SO-VIEC.md`, `index.html`. KHÔNG tự phát hành (nhắn 0.Planer).

## Lời thầy / lệnh (nguyên văn)

- 12:22 · thầy: "xác nhận luôn" — giao phần GIAO DIỆN theo prompt trên.
- 12:40 · (qua 0.Planer) thầy uỷ quyền điều phối: "cần hỏi gì thì hỏi qua bạn, tôi không muốn làm gì cả, chỉ xong việc nhắn tôi". Ba câu hỏi trong prompt đã chốt: bỏ hẳn thanh tab · không thanh EXP ở góc thần thú · vinh danh theo ngày.
- 13:0x · (0.Planer) /hs/ke-hoach-ngay đã sống: nối nhánh thứ hai của adapter theo `docs/ke-hoach-ngay-api-1909.md`.

## Việc

- [x] Đọc bản vẽ 5 tệp project/*.dc.html                                        | bằng chứng: đã đọc; màu vai trò khớp (xem NT-màu)
- [x] Đọc mã hiện có (2 màn cổng, tokens.css, tro-ly-ca-nhan, BangVinhDanh, Spirit2D, PhongVaoThi) | bằng chứng: đã đọc
- [x] `src/lib/nhiem-vu-adapter.ts` — hàm thuần, nguồn trợ lý (nhánh 1) | bằng chứng: tests/nhiem-vu-adapter-1909.test.ts 20/20
- [ ] Adapter nhánh 2: `/hs/ke-hoach-ngay` theo docs/ke-hoach-ngay-api-1909.md (KHÔNG sắp lại viec[], hien===false → cổng, ghiChuVanToc, chuoiDat, rơi về trợ lý khi lỗi mạng) | bằng chứng: (chưa có) — nhánh 2 hiện có là bản GIẢ ĐỊNH theo đề xuất, sai hình dạng JSON thật
- [ ] Nối gọi `/hs/ke-hoach-ngay` vào StudentPortalScreen (token, không có thì sbd) + phụ huynh | bằng chứng: (chưa có)
- [x] `tests/nhiem-vu-adapter-1909.test.ts` | bằng chứng: 20 test xanh (2 nguồn cùng cấu trúc, 4 bậc đúng vai trò, cổng, bài Mẹ không rơi, trống thật)
- [x] `m3-theme.css` (@theme + biến, sáng/tối) | bằng chứng: 9 vùng × 2 chế độ trùng mã bản vẽ bằng getComputedStyle trong Chromium
- [x] `NenDong.css` — 2 lớp 24 s, ≤18%, tắt reduced-motion/pin yếu | bằng chứng: test CSS + test hook (jsdom)
- [x] DauTrang / TheLamNgay / DanhSachNhiemVu / TheVinhDanh / NutVaoThi / BangNhiemVu | bằng chứng: tests/bang-nhiem-vu-1909.test.tsx 23/23 + ảnh chụp
- [x] StudentPortalScreen: bỏ tab + công tắc giao diện cũ, sheet toàn màn (menu ba chấm), diff ≤ 400 | bằng chứng: `git diff --stat` 323 dòng
- [x] ParentPortalScreen: vaiTro='phuhuynh', hàng "Giao bài cho con", không Vào thi, diff ≤ 400 | bằng chứng: 243 dòng
- [x] Đổi selector (giữ hành vi) mo-bai-tu-bang-tin.test.tsx | bằng chứng: 7/7 xanh; ke-hoach-giao-dien.test.tsx không phải đổi (3/3 xanh)
- [x] Bài Mẹ giao KHÔNG được rơi khỏi trang chủ khi top3 của tongHopKeHoachTroLy cắt mất (LỖI TỰ TÌM RA khi chạy bản dựng thật) | bằng chứng: nguyên nhân gốc = top3 cắt, "Luyện sửa lỗi" đẩy bài Mẹ ra; sửa trong adapter (không sửa tro-ly); 6 test khoá lỗi; chụp lại thấy đủ 3 thẻ bậc bắt buộc
- [x] Tương phản nhãn "LÀM NGAY" 4,46 < 4,5 (Lighthouse) → 12% thay 18% | bằng chứng: Lighthouse hết `color-contrast`
- [x] Tên truy cập chứa nguyên chữ nhìn thấy (label-content-name-mismatch) | bằng chứng: Lighthouse hết lỗi này (còn meta-viewport)
- [x] Chuông thông báo 44→48 dp | bằng chứng: bộ chấm "nutNho = 0" ở 14 kịch bản
- [ ] Ảnh chụp cuối (8 ảnh + trống + khẩn) → docs/anh-bang-nhiem-vu-1909/ + gửi thầy | bằng chứng: bản nháp đã chụp ở thư mục tạm, CHƯA chép vào repo (chụp lại sau khi nối nhánh 2)
- [ ] Đoạn 5 dòng cho thầy | bằng chứng: (chưa có)

## Nghiệm thu

- [x] NT1 · 1 BTVN khẩn + lô hôm nay + bài Mẹ: "Làm ngay" là BTVN khẩn, đúng 1 nút nổi bật, bấm gửi đúng {maCa:'CA-ANCOL',maBtvn:'BT-ANCOL'} (payload {bt}) | bằng chứng: E2E Chromium trên bản dựng thật (POST /btvn/cua-em đúng ca, không mở nhầm ca Este) + unit
  · "4 bậc đúng 4 màu": nguồn trợ lý CHỈ sinh 3 bậc (khan/bat_buoc/tuy_chon; không bao giờ có nen_lam vì mọi loại việc ≥ severity .85) — đủ 4 bậc chỉ ở nguồn máy chủ (nhan==='bu'). Test jsdom kiểm đủ 4; ảnh E2E có 3.
- [x] NT2 · không việc: thẻ trống nói thật, không thẻ nào, thần thú vẫn hiện (đứng yên "nghỉ") | bằng chứng: E2E + unit
- [x] NT3 · grep "#[0-9a-f]{6}" -ri bang-nhiem-vu/ → 0; grep Spirit3D → 0; `npm run check:mau` không kêu tệp nào của em | bằng chứng: lệnh grep = 0, test kỷ luật mã nguồn
- [!] NT4 · Lighthouse mobile (Slow 3G 400 Kbps/RTT 400 ms, CPU 4x): TRƯỢT ngưỡng. Học sinh: Perf 55 · A11y 94 · LCP 18,5 s (FCP 17,9 s) · TBT 0 · CLS 0,046. Phụ huynh: Perf 55 · A11y 94 · LCP 19,1 s.
  · Đối chứng bản CŨ (HEAD d378c25, cùng phép đo): HS Perf 6 · A11y 89 · FCP 17,8 s · LCP 21,6 s · TBT 1650 ms · CLS 0,631; PH Perf 42 · A11y 87 · FCP 15,8 s.
  · Kết luận: màn mới TỐT HƠN bản cũ ở mọi chỉ số do màn hình quyết định (TBT 1650→0, CLS 0,631→0,046) nhưng FCP y hệt (17,8 vs 17,9 s) ⇒ nút cổ chai là gói JS + ảnh của CẢ APP, không phải bảng nhiệm vụ. Ngoài vùng của em: (1) index.html `user-scalable=no,maximum-scale=1` — lỗi tiếp cận DUY NHẤT còn lại, xoá đi là A11y ≥ 95; (2) `public/than-thu-v2/evolution-elements-cutout.png` 3,1 MB (sprite thần thú, đã có từ trang chủ cũ); (3) JS ở đường găng ≈ 190 KB + 119 KB gzip (chem-format).
- [x] NT5 · Reduce motion: nền đứng yên, thần thú tĩnh, shimmer tắt | bằng chứng: unit (matchMedia + getBattery) — chưa chụp trong Chromium với emulate reduced-motion
- [x] NT6 · /honors 3 người đủ 3 kèm thần thú; rỗng → "Hôm nay chưa có bài chấm xong" | bằng chứng: E2E (3 hạng có SpiritArt) + unit
- [ ] NT7 · Toàn bộ vitest ≤ 98 đỏ / 43 tệp; build; SW 10/10 | bằng chứng: lần đo 12:38 = 98/43 đúng nền, 12 test đỏ liên quan cổng (giao-btvn 5, khac-phuc-tren-dien-thoai 2, luyen-dang-bai 5) là CÓ SẴN trước khi em sửa cổng; build exit 0; SW 10/10 (`kiem-sw.mjs` trên bản dựng ở thư mục riêng). CẦN đo lại toàn bộ sau khi nối nhánh 2.
- [ ] NT8 · Phát hành + curl 3 URL — KHÔNG phải việc của em (luật 2): nhắn 0.Planer
- [!] Nút Vào thi tertiary khi "ca đang mở": prop `caDangMo` + CSS + test đã có nhưng KHÔNG có nguồn dữ liệu (không có endpoint máy chủ liệt kê ca đang mở cho lớp; server/** ngoài vùng em) ⇒ luôn false. Cần 0.Planer/Coder 1 quyết.
- [!] Chưa có luồng "Nhắn Thầy" trong app phụ huynh ⇒ KHÔNG dựng nút giả (bản vẽ có). Prop `onNhanThay` sẵn, chỉ cần nối khi luồng có.
- [!] Phụ huynh chưa có danh sách BTVN của con (`parentNewsApi` chỉ trả số) ⇒ bảng nhiệm vụ PH nói số bài chưa nộp bằng 1 dòng, không dựng thẻ. Sẽ đủ khi `/ke-hoach/xem` nối (nhánh 2).

## Nhật ký vòng sửa (nguyên nhân gốc → sửa → chạy lại đúng lệnh)

1. 12:40 Bài Mẹ giao mất khỏi trang chủ. Gốc: `tongHopKeHoachTroLy` chỉ trả top3. Sửa: `themBaiMeBiCat` trong adapter (chỉ bài Mẹ, BTVN không bù vì luật nhịp lô). Chạy lại E2E: thẻ bậc bắt buộc 2→3.
2. 12:45 Bộ chấm tương phản báo 20 chữ oan. Gốc: tính cả glyph `display:none` của Spirit2D. Sửa bộ chấm (bỏ phần tử không có client rect). Sau đó lộ tiếp: bộ chấm bỏ sót `color-mix` ⇒ thêm parse `color(srgb …)` + đếm `boQua`.
3. 12:52 Lighthouse trượt tương phản 4,46 ở nhãn LÀM NGAY (bộ chấm tự viết đã bỏ sót). Gốc: lớp phủ 18% trên nền primary. Sửa 12% (≥5,0). Chạy lại Lighthouse: hết lỗi.
4. 12:55 label-content-name-mismatch. Gốc: (a) nhãn bậc đứng đầu aria-label; (b) hai span liền nhau không có khoảng trắng. Sửa cả hai. Chạy lại: hết.
5. 12:57 Đối chứng bản cũ ra điểm 0 (NO_FCP). Gốc: LỖI CỦA BỘ ĐO EM — `pkill -f "lh/may.mjs"` không khớp dòng lệnh thật nên máy chủ đo cũ không tắt, lượt dựng bản cũ ghi đè thư mục phục vụ. Sửa: `pkill -f "may.mjs"` + kiểm cổng trống. Chạy lại đúng 4 phép đo: hợp lệ.
