# APP PHỤ HUYNH MỚI — build status (28/09/2026, nhánh `claude/funny-franklin-e8nxxx`)

## Lệnh của thầy
- "Trùng tu toàn bộ app phụ huynh, app phụ huynh không có giao bài cho con nữa chỉ xem được báo cáo mọi thứ về con … thiết kế lại … rất đẹp, cuốn hút và vô cùng dễ hiểu trực quan. Vẽ cho tôi xem trước khi build nhé"
- "màu phải theo mẫu màu app giáo viên hoặc làm cho đẹp hơn"
- "thiết kế cả xoay ngang và trang trên máy tính nhé" · "xong chốt luôn build luôn nhé"

Bản vẽ đã chốt (8 khổ màn): https://claude.ai/artifact/2HShm51xEiuVKcTAUpfeFT

## Đã làm
| Phần | Tệp | Ghi chú |
|---|---|---|
| Máy chủ: 3 lệnh CHỈ-ĐỌC | `server/src/ph-bao-cao-moi.ts`, `server/src/index.ts` (3 dòng định tuyến), `server/src/srs2-d1.ts` (`docKeHoachDaChot`), `server/src/ph-truy-cap.ts` (3 tên đường) | `/ph/bao-cao-ca` (bộ dựng chung `baoCaoMotEm`, chặn theo luật công bố, + nhận xét thầy chỉ khi đã công bố) · `/ph/loi-thay` · `/ph/hoc-2` (chiến dịch 2.0 + kế hoạch hôm nay ĐÃ CHỐT, không lập/ghi thay con) |
| App | `src/components/ph-v3/*` (khung, 5 màn, CSS), `src/lib/ph-v3/*` (lớp đọc + API), `src/screens/ParentPortalScreen.tsx` (chỉ còn đăng nhập) | Hôm nay · Điểm số · Chi tiết ca (`#ca/<mã>`, gói tải lười) · Tiến bộ · Lời thầy. Điện thoại dọc: thanh đáy; ≥ 600 px (xoay ngang, máy tính bảng): thanh dọc trái + lưới 2 cột; ≥ 1024 px: thanh bên 272 px + lưới 12 cột |
| Màu | `src/styles/tokens.css` (khối `--ph3-*`, chỉ thêm) | Bảng `--gvm-*` của app giáo viên + khối anh hùng xanh hải quân; sáng + tối theo máy |
| Bỏ | nút "Giao thêm bài cho con", màn "đã ngừng" theo công tắc Game Hoá 2.0 (`/hoa2/ph-ngung` không còn được cổng gọi; lệnh máy chủ vẫn để nguyên) | Lệnh 28/09 thay quyết định 27/09 "bỏ hẳn app phụ huynh" |

## Khác bản vẽ (cố ý, theo dữ liệu thật)
- Thẻ "Bài tập về nhà · 5 chặng" ⇒ thẻ **"Chiến dịch của con"** (Game Hoá 2.0 đang bật cả trung tâm: BTVN cũ đã nghỉ). Thanh 4 đoạn: đã thành thạo · đang luyện · cần thầy dạy lại · chưa gặp. Còn BTVN cũ trong dữ liệu thì vẫn hiện gọn.
- Vòng 1 của khối đầu = **kế hoạch hôm nay đã chốt** (câu đã làm / tổng); vòng "thời gian học" chỉ có cung khi có mục tiêu phút (2.0 không có ⇒ chỉ ray + số).
- Nhịp 14 ngày vẽ **số câu mỗi ngày** (máy chủ không có phút theo ngày).
- Không xếp hạng điểm, không so với bạn (máy chủ cố ý không trả); chỉ "độ chăm hôm nay" như cũ.
- Học phí / điểm danh: CHƯA có bảng dữ liệu nào ⇒ không có mục này.

## Bằng chứng (chạy trong phiên)
| Việc | Lệnh | Kết quả |
|---|---|---|
| Test máy chủ mới (D1 thật) | `npx vitest run tests/ph-bao-cao-moi-2809.test.ts` | 8/8 |
| Test app mới | `npx vitest run tests/ph-v3-app-2809.test.tsx` | 12/12 |
| Bộ test phụ huynh liên quan (41 tệp) | xem sổ | 1016 đạt · 5 đỏ = đúng 5 đỏ có sẵn (`luyen-dang-bai-1509`, nền trước khi sửa) |
| Kiểu | `npx tsc -p tsconfig.app.json --noEmit` · `npx tsc -p server/tsconfig.json --noEmit` | 0 lỗi |
| Màu | `npm run check:mau` | đạt |
| Build + SW | `npm run build` · `node scripts/kiem-sw.mjs` | đạt · 13/13 (169/170 tệp precache) |
| Chromium thật | 390×844 · 844×390 · 1440×1000, sáng + tối, 5 màn = 30 ảnh | cuộn ngang 0 · đích < 44 px 0 · chữ < 11 px 0 (ảnh: `docs/anh-ph-v3-2809/`) |

## Test cũ đã sửa CÓ CHỦ Ý (khoá hành vi thầy đã bỏ 28/09)
`ph-ngung-2709` (viết lại: không còn màn đã ngừng) · `hoa2-sanh-2709` (gỡ khối màn đã ngừng) · `giao-them-cho-con-man-2109` (gỡ 4 test nút giao trên cổng thật, thêm test "không còn nút") · `ph-mot-man-mot-nut-2109` (viết lại cho app chỉ xem) · `ph-moi-man-2109` (gỡ 3 test cổng thật dùng ManChinh) · `ph-token-1909`, `m3-c9-phu-huynh-1909` (bộ chọn / CSS mới).
Mã cũ `src/components/ph-moi/**` (ManChinh, bảng "Mọi thứ về con", GiaoThemChoCon) GIỮ NGUYÊN trong kho, không còn được /ph dùng — gỡ hẳn là việc riêng.

## Phát hành
Chưa phát hành: nhánh đã đẩy, chờ gộp vào `main` (GitHub Actions tự đẩy Pages + Worker). Lùi: `git revert <mã commit gộp>`.

## Vòng 2 — thầy 28/09 tối: "Bỏ A.I Đỗ Đại Học thay bằng Thầy Đỗ Đại Học" + "đồng bộ mọi giao diện xoay ngang"
- App: mọi chữ phụ huynh thấy dùng "Thầy Đỗ Đại Học" (thẻ "Thầy Đỗ Đại Học đã lo cho con", chữ ký thư tuần, biểu tượng ĐH). Chữ máy chủ (thư tuần, cảnh báo, nhận xét ca) đi qua `chuThay()` trong `src/components/ph-v3/tien-ich.ts` — đổi "Bộ não A.I hỗ trợ riêng em <Tên>" / "Bộ não A.I" / "A.I Đỗ Đại Học" ⇒ "Thầy Đỗ Đại Học".
  - Lỗi vòng này: khoảng `[A-ZÀ-Ỹ]` chứa cả chữ thường (đ, à…) ⇒ ăn mất "đã" sau tên con. Sửa bằng `\p{Lu}`; test `chuThay` khoá.
  - Test khoá nguồn: không tệp nào trong `src/components/ph-v3/` (trừ `tien-ich.ts`) còn chữ "A.I"/"Bộ não" ngoài chú thích; màn Lời thầy không hiện "A.I".
- Bản vẽ (artifact 2HShm51xEiuVKcTAUpfeFT, bản 4): đủ 3 hàng × 5 màn — dọc, xoay ngang (844), máy tính (1440); bấm "xem chi tiết ca" ở khổ nào mở chi tiết ca ĐÚNG khổ đó. App thật vốn đã co giãn theo khổ (không nhảy sang dọc).
- Đo: tsc 0 lỗi; vitest 5 tệp phụ huynh 47/47; check:mau sạch; chụp 30 màn (sáng/tối × dọc/ngang/máy tính): còn chữ A.I 0, cuộn ngang 0, đích < 44px 0, chữ < 11px 0.

## Vòng 3 — thầy 28/09: "gộp luôn, đổi cả bên học sinh"
- App học sinh: thẻ "Thầy Đỗ Đại Học hỗ trợ riêng em <tên>", thử thách riêng, kết quả sau nộp, phiếu, khung lời giải game, thẻ Đoàn; tin khiên/thần thú/thẻ Đoàn/bài gia đình giao. Tin cũ đã lưu: `/notifications list` lọc qua `chuThay` (`src/lib/chu-thay.ts`), không ghi đè D1. App giáo viên giữ "A.I Đỗ Đại Học".
- Tự phát hiện + sửa: hướng dẫn ở cổng phụ huynh còn "Tạo Bài gia đình giao (tối đa 99 câu)".
- Gộp: PR dodaihoc4869/omr-app#39 → main 441cc5e (đã trộn PR #38; PR #40 gộp xen giữa, không tệp chung, tsc + 168 test liên quan xanh trên 441cc5e). Thầy xác nhận không có ca mở (18:15).
- Phát hành: GitHub Actions run 538 thành công 18:39 giờ VN (Pages + Worker). Kiểm sống: /ph/hoc-2, /ph/loi-thay, /ph/bao-cao-ca trả lời đúng (đòi số báo danh). Toàn vitest 131 đỏ = nền. Precache 169/170 tệp · 2940/3000 KB.
- Lùi bản: `git revert -m 1 441cc5e` rồi đẩy main (Actions tự phát hành lại).
