# SỔ VIỆC — GIAO DIỆN (phiên Code 2)

Lập 19/09/2026 12:25. Theo `DIEU-PHOI.md` luật 4: phần giao diện ghi sổ ở đây, KHÔNG sửa `SO-VIEC.md`.

## ĐANG Ở ĐÂU / VIỆC KẾ TIẾP (cập nhật cuối mỗi mốc)

- MỐC A: XONG, đã lên Pages đợt 1 (0.Planer đẩy, 5a6effde). MỐC A.1 (bản nhớ kế hoạch ngày, stale-while-revalidate): XONG mã + test, commit ngay sau dòng này; toàn vitest 98 đỏ / 43 tệp (lần 1 có 99/44 vì `escort-context-menu` chập chờn theo tải — chạy riêng 4/4 xanh, chạy lại toàn bộ 98/43, 0 đỏ mới). Em KHÔNG tự đẩy Pages → 0.Planer đẩy đợt 1b.
- KẾ TIẾP: việc B = `prompt-giao-dien-phieu-lam-bai.md` + `prompt-giao-dien-dong-bo-man-hoc-sinh.md` (phủ MỌI lối gọi dungPhieu; thay áo, không thay xương; CSS mới dưới `body .gd-m3`; bản in/tờ máy chiếu không đổi 1 byte). Vùng mở thêm: `src/lib/html-phieu.ts`. Bản vẽ: 3 khung hàng 2 của canvas (PhieuLamBai/PhieuSauNop/PhieuLuoiCau).
- SAU ĐÓ việc C: gửi 0.Planer BẢNG KIỂM KÊ mọi đường bấm HS/PH rồi làm nhóm 1 (React – xem), 2, 3; màn thi thật (ExamTakeScreen/exam-setup.css) LÀM CUỐI và nhắn 0.Planer soát diff trước khi đẩy.
- Nếu phiên bị ngắt: đọc mục "Việc" + "Nhật ký vòng sửa" dưới đây; mọi thứ của mốc A đã commit.

## DÙNG LẠI CHO PHIÊN KHÁC (Code 4…) — bảng màu và mẫu giao diện M3

- **Bảng màu**: `src/components/bang-nhiem-vu/m3-theme.css` — `import '.../bang-nhiem-vu/m3-theme.css'` rồi đặt `className="m3"` lên phần tử GỐC của màn (bí danh của `.bnv`). Sáng/tối tự theo `prefers-color-scheme`. KHÔNG hard-code màu trong .tsx: chỉ `var(--m3-…)`.
- **Biến**: `--m3-primary/on-primary/primary-container/on-primary-container(+ -phu)`, `--m3-secondary(-container/on-…)`, `--m3-tertiary(-container/on-…)`, `--m3-error(-container/on-…)`, bề mặt `--m3-surface`, `--m3-surface-container-lowest/low/(trơn)/high`, `--m3-on-surface`, `--m3-on-surface-variant`, `--m3-outline`; cao độ `--m3-cao-do-1/3`; bo góc `--m3-bo-12/16/28/tron`; chữ `--bnv-cx-1..6` (đã kèm rem cho cỡ chữ hệ thống 130%).
- **Vai trò màu → ý nghĩa**: error=khẩn/sai, primary=bắt buộc/đang chọn, secondary=nên làm/thông tin, tertiary=tuỳ chọn/đúng/đạt. Thẻ tonal: đặt `data-vai-tro="error|primary|secondary|tertiary"` để có `--bnv-mau-nen/-chu/-chu-phu/-dam` (xem `bang-nhiem-vu.css`, cuối tệp có `.bnv-the--nhat` cho thẻ trung tính).
- **CHƯA có thư viện thành phần chung**: các mẫu (nút tròn 48 px `.bnv-nut-tron`, nút `.bnv-nut-tonal/-vien/-chinh`, thẻ `.bnv-the`, chip `.bnv-chip`, skeleton `.bnv-xuong`, menu, thanh trên) nằm trong `bang-nhiem-vu.css` và gắn với `.bnv`. Phiên khác tạo `src/components/m3/` (ThanhTren, TheTonal, NutChinh/NutPhu, ChipTrangThai, HangChon, NutPhanDoan, OSo, TamTruot) dựa trên các mẫu này, dùng `.m3` + biến trên; đừng sửa `bang-nhiem-vu/**` (của em).
- **Luật cứng**: đích chạm ≥ 48 px; tương phản ≥ 4,5 (đo bằng Lighthouse/getComputedStyle, KHÔNG chỉ mắt); không viền — tách lớp bằng tonal + cao độ; tắt chuyển động khi `prefers-reduced-motion`; aria-label chứa NGUYÊN chữ nhìn thấy; thẻ mờ 38% cho việc chưa mở; tên gọi/luồng dữ liệu/khoá localStorage giữ nguyên.
- **Phiếu HTML** (chuỗi, không phải React) do em làm ở `src/lib/html-phieu.ts` dưới lớp `body.gd-m3` — đừng đụng.
- **Ảnh chụp/đo**: bộ chụp Chromium + Lighthouse của em ở thư mục tạm phiên (chup.mjs, medir.sh); nếu cần, hỏi em. Nền vitest 98 đỏ / 43 tệp; `escort-context-menu` chập chờn theo tải.

## Việc — MỐC A

- [x] Adapter `src/lib/nhiem-vu-adapter.ts`: nhánh 1 (tongHopKeHoachTroLy) + nhánh 2 (/hs/ke-hoach-ngay THẬT) | bằng chứng: tests/nhiem-vu-adapter-1909.test.ts 38/38
- [x] Nhánh 2 theo docs/ke-hoach-ngay-api-1909.md: KHÔNG sắp lại viec[]; KHẨN=khan||khan_cap, BẮT BUỘC=batBuoc, NÊN LÀM=bu, TUỲ CHỌN=tuy_chon; hien:false → mờ + "Mở sau khi xong: <việc id=cong>"; Làm ngay = việc đầu hien; ghiChuVanToc in nguyên văn; chuoiDat; canhBao in nguyên văn; quaHan riêng; JSON hỏng → rơi về trợ lý | bằng chứng: các test trên + `laKeHoachNgayHopLe` (10 kiểu đầu vào hỏng)
- [x] Nối gọi: `useKeHoachNgay` (token ưu tiên, không có thì sbd; mở màn + 60 s + khi quay lại tab + khi vừa đóng một sheet; lỗi → GIỮ bản cuối + "Kế hoạch lúc <giờ VN>"), `useCaDangMo` (POST /hs/ca-dang-mo; lỗi/404 → false) | bằng chứng: tests/bang-nhiem-vu-may-chu-1909.test.tsx 14/14 (gồm tích hợp StudentPortalScreen thật; đột biến làm hỏng parse → 3 test đỏ)
- [x] Bài Mẹ giao KHÔNG rơi khỏi trang chủ: nhánh 1 vì top3 cắt; nhánh 2 vì máy chủ chỉ đưa bài Mẹ ĐÃ BẮT ĐẦU vào viec[] (bài mới nhận không có) → bù ở CUỐI nhóm BẮT BUỘC | bằng chứng: test tái hiện cả hai nhánh + E2E thấy thẻ "Bài của Mẹ giao" bấm được
  · ĐỀ NGHỊ cho phía máy chủ (Coder 1 đã dừng): đưa bài Mẹ chưa bắt đầu vào viec[] (hanCung null, batBuoc true) thì adapter bỏ được đoạn bù.
- [x] 5 vùng + 2 màn cổng (diff HS ~340 dòng, PH ~250) + nền động + thần thú nạp SAU khung hình đầu (vòng giữ chỗ 96 dp) | bằng chứng: test + ảnh
- [x] Thần thú đứng yên khi trống ("đang nghỉ"); thẻ Vinh danh không dựng khi còn skeleton (CLS) | bằng chứng: test
- [x] Ảnh chụp cuối: docs/anh-bang-nhiem-vu-1909/ (20 ảnh: HS khẩn 4 cỡ × sáng/tối = 8, đủ 4 bậc (khan2), ca đang mở (ca-mo), nguồn trợ lý, trống; PH khẩn + trống) | bằng chứng: Chromium trên bản dựng thật, 0 vi phạm / 20 kịch bản
- [x] Đoạn 5 dòng cho thầy (dưới)
- [x] MỐC A.1 — bản nhớ kế hoạch ngày (0.Planer giao 13:4x): nhớ bản dựng từ máy chủ (localStorage `omr_bnv_ke_hoach:<sbd>`, kèm tên bài + payload); mở lại thì VẼ NGAY từ bản nhớ cùng ngày VN + dòng "Kế hoạch lúc HH:MM · đang cập nhật…", gọi máy chủ rồi thay; bản nhớ ngày khác/rác không dùng để vẽ việc; máy chủ lỗi sau khi dữ liệu đã về ⇒ thôi vẽ bản nhớ, rơi về nguồn trợ lý; không nhớ nguồn trợ lý/bản cuối; khác SBD không lẫn | bằng chứng: adapter 43 + tích hợp StudentPortalScreen 20 (đột biến bỏ kiểm ngày → 2 test đỏ); Chromium thật với mọi API chậm 4 s/lần: thẻ "Làm ngay" hiện sau 80 ms từ bản nhớ, bấm được, rồi thay khi bản mới về

## Nghiệm thu — MỐC A

- [x] NT1 Làm ngay là BTVN khẩn, 1 nút nổi bật; bấm gửi đúng {maCa:'CA-ANCOL',maBtvn:'BT-ANCOL'} (không mở nhầm ca Este) | E2E Chromium + unit. Đủ 4 bậc/4 màu: ảnh hs-khan2 (error/primary/secondary/tertiary).
- [x] NT2 không việc: thẻ trống nói thật + dòng cảnh báo thieu_nguon_bu của máy chủ, không thẻ nào, thần thú vẫn hiện (đứng yên)
- [x] NT3 `grep '#[0-9a-f]{6}' -ri src/components/bang-nhiem-vu/` = 0; grep Spirit3D = 0; check:mau không kêu tệp của em; thư mục chỉ import react + lucide-react (test)
- [x] Màu vai trò: 9 vùng × sáng/tối trùng mã bản vẽ (getComputedStyle trong Chromium thật)
- [!] NT4 Lighthouse mobile Slow 3G (400 Kbps / RTT 400 ms / CPU 4x), 3 lần mỗi bên, trung vị — **chưa đạt đích tuyệt đối (Perf ≥ 90, LCP < 2,5 s); đạt tiêu chí đã sửa của 0.Planer ở Perf/TBT/CLS/A11y nhưng FCP/LCP TRỄ HƠN bản cũ chút**:
  | | Perf | A11y | FCP | LCP | TBT | CLS |
  |---|---|---|---|---|---|---|
  | HS cũ (HEAD) | 31 | 89 | 17,8 s | 20,0 s | 58–61 ms | 0,83–0,90 |
  | HS mới | 55 | 94 | 18,2 s | 21,6 s | 0–6 ms | 0 |
  | PH cũ | 52 (28/53/52) | 87 | 15,8 s | 18,6 s | 58–1398 ms | 0,08–0,10 |
  | PH mới | 55 | 94 | 15,8 s | 19,3 s | 0 ms | 0 |
  · Trễ FCP/LCP (+0,4 / +1,6 s HS; +0 / +0,7 s PH): màn chờ kế hoạch máy chủ (thêm một vòng API) rồi mới vẽ nội dung, để không hiện "trống" giả. Có thể giảm bằng cách nhớ kế hoạch ngày gần nhất trong máy và vẽ ngay (kèm "Kế hoạch lúc …") — chưa làm.
  · Cổ chai của CẢ APP (ngoài vùng): gói JS đường găng ~190 KB + 119 KB gzip; sprite `evolution-elements-cutout.png` 3,1 MB (0.Planer: không đổi định dạng vì thiếu công cụ).
  · A11y 94 còn thiếu 1 lỗi duy nhất: index.html `user-scalable=no,maximum-scale=1` — 0.Planer quyết GIỮ (màn thi/quét); việc CHỜ THẦY QUYẾT.
  · Đo lần đầu (12:5x) có số đẹp hơn (TBT 1650→0) là do bản CŨ dao động mạnh giữa các lần; bảng trên là 3 lần/bên.
- [x] NT5 Reduce motion + pin yếu: unit (matchMedia, getBattery) — chưa chụp emulate reduce-motion trong Chromium
- [x] NT6 vinh danh 3 hạng có thần thú; rỗng → "Hôm nay chưa có bài chấm xong" | E2E + unit
- [x] NT7 Toàn bộ vitest 98 đỏ / 43 tệp = đúng nền (355 tệp, 4815 test); build exit 0; kiem-sw 10/10 (bản dựng ra thư mục riêng, không đè dist/)
- [ ] NT8 Phát hành + curl 3 URL: 0.Planer đẩy (em không tự đẩy)
- [x] "Ca đang mở" nối xong: test dựng phản hồi coCaMo:true → Vào thi tertiary + chấm nhịp; ảnh hs-ca-mo. Bản sống chưa có ca mở nên chưa thấy nhánh true ngoài đời.
- [x] "Nhắn Thầy" ở app phụ huynh: HOÃN theo 0.Planer (chưa có luồng nhắn; không dựng nút giả). Prop `onNhanThay` sẵn.
- [!] on_lai / on_thi (ôn câu tới hạn / ôn trước ca): chưa có luồng mở ĐÚNG các câu máy chủ chọn (chiTiet.qid) → tạm mở luồng "luyện lại câu sai" hiện có (báo "không có câu sai" nếu em chưa sai câu nào). Cần thêm lệnh máy chủ trả nội dung câu theo qid (thuộc GĐ 3+ của Coder 1).

## Đoạn 5 dòng cho thầy — em sẽ thấy gì khác khi mở app

1. Vào app là thấy ngay lời chào, chuỗi ngày và thần thú ở góc; không còn thanh tab nào.
2. Ngay dưới có MỘT thẻ xanh "Làm ngay" — việc cần làm trước, kèm giờ còn lại và nút bắt đầu.
3. Việc còn lại xếp 4 nhóm màu: Khẩn (đỏ, có đồng hồ đếm lùi), Bắt buộc hôm nay (xanh dương), Nên làm (xanh trời), Tuỳ chọn (xanh lá); việc chưa tới lượt mờ đi và ghi "Mở sau khi xong: …".
4. Cuối trang là vinh danh top 3 hôm nay; nút "Vào thi" nổi góc dưới phải, đổi sang xanh lá có chấm nhịp khi lớp em có ca đang mở.
5. Xem điểm, BTVN, bài Mẹ giao, khắc phục, thần thú vẫn còn — mở từ menu ba chấm góc trên; hôm nào không có việc thì hiện "Hôm nay chưa có việc — thần thú đang nghỉ".

## Nhật ký vòng sửa (nguyên nhân gốc → sửa → chạy lại đúng lệnh)

1. Bài Mẹ giao mất khỏi trang chủ (nhánh trợ lý). Gốc: `tongHopKeHoachTroLy` chỉ trả top3. Sửa: bù trong adapter; 6 test khoá; E2E lại: đủ 3 thẻ.
2. Bộ chấm tương phản báo oan 20 chữ (glyph display:none) rồi bỏ sót `color-mix`. Sửa bộ chấm; Lighthouse tìm ra lỗi thật: nhãn LÀM NGAY 4,46 < 4,5 → lớp phủ 12% (≥ 5). Chạy lại: hết.
3. label-content-name-mismatch: nhãn bậc đứng đầu aria-label + hai span liền nhau không có khoảng trắng. Sửa cả hai. Chạy lại: hết.
4. Bộ đo bản cũ điểm 0. Gốc: LỖI CỦA BỘ ĐO EM (pkill sai mẫu, lsof sai cú pháp macOS, zsh không tách chuỗi khi `set -- $x`) → viết `medir.sh` (bash, đối số tường minh, thử lại khi lỗi). Chạy lại 3 lần/bên: hợp lệ.
5. CLS phụ huynh 0,131 > cũ 0,101. Gốc: thẻ Vinh danh nằm dưới skeleton, nội dung thật phình ra đẩy nó. Sửa: không dựng thẻ Vinh danh khi còn skeleton (+ test). Chạy lại: CLS 0 ở cả hai app.
6. Nhánh 2 viết theo giả định của đề xuất, sai hình dạng JSON thật (tienBo, nganSach, hien, cong, không có tieuDe) — 0.Planer báo 2 tệp test đỏ "reading daLamCau" khi Coder 1 chạy toàn bộ giữa lúc em sửa dở. Sửa: viết lại theo docs, fixture = JSON thật, validator từ chối JSON thiếu phần; chạy lại toàn bộ: nền 98/43.
7. Máy chủ chỉ đưa bài Mẹ ĐÃ BẮT ĐẦU vào viec[] (đọc server/src/ke-hoach-ngay.ts) ⇒ bài mới nhận sẽ biến mất nếu chỉ vẽ theo viec[] ⇒ bù ở adapter (mục Việc).
