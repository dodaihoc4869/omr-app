# BẢN DUYỆT V2 — nhật ký build (phiên cloud 09/10/2026, nhánh `claude/amazing-albattani-03aros`)

Trạng thái: **ĐANG PHÁT HÀNH** — thầy chốt bản vẽ tối giản 09/10 ("1. Bát linh đảo 2. Chốt 3. Bỏ hẳn 4. Thêm 5. Bật lại 6. Giữ nguyên — Build rồi đẩy luôn"; "làm tiếp xong hết đẩy lên máy chủ luôn nhé"). Đường phát hành: PR vào main ⇒ `deploy.yml` đẩy Pages + Worker.

## Đã làm
| Màn | Tệp | Ghi chú |
|---|---|---|
| Design system | `src/styles/tokens.css` (4 màu gốc), `src/styles/ban-duyet-v2.css` (sắc dẫn xuất + thành phần), `src/index.css` `@theme` | Tailwind v4 không có tailwind.config.js ⇒ `@theme`. Tiêu đề 'Baloo 2' 800, thẻ bo 24px. |
| 00/01 Hôm nay HS | `src/components/ban-duyet-v2/SanhV2.tsx`, `sanh-v2.css`, `SanhHomNay.tsx` | Nạp lười ngoài precache; lỗi nạp/vẽ ⇒ Sảnh cũ. Dọc / ngang điện thoại / máy tính. |
| 06 Thần thú | `src/game/than-thu-v2/dao/ThanThuV2.tsx`, `than-thu-v2.css` | Mục "Thần thú" trên thanh Đảo (2.0); cửa `game-v2:man-dau=than-thu`. |
| 07 Cửa hàng | `src/game/than-thu-v2/shop/shop-v2.css` (+ lớp `.ps-v2`) | Chỉ đổi da; tranh món nền xanh than để món phát sáng vẫn rõ. |
| 08/09 Trận | `dao2/TrongAi.tsx`, `DoanTran.tsx`, `dao2/tran-v2.css` | 40/60 có sẵn; thêm môn + Câu k/n, Cấp N, nút "CHỐT ĐÁP ÁN" cả hai game. |
| 14 Hành trình (thầy) | `src/components/chien-dich/HanhTrinhV2.tsx`, `gv-v2.css`, `ChienDichScreen.tsx` | Tổng quan (cũ) · Nhịp hôm nay (mới) · Cần chữa (dẫn điểm danh). |
| 18 Ma trận đề | `src/lib/ma-tran-de.ts`, `src/components/ma-tran-de/*`, chèn vào `ExamSetupScreen.tsx` | Chỉ đọc. **Tệp luồng thi ⇒ cần Boss soát trước khi lên Pages.** |
| Precache | `vite.config.ts` globIgnores | 2988/3000 KB (bản gốc 2996). |

## Chưa làm (lý do thật)
- 15 hộp chọn nhiều bài: máy chủ chưa có lệnh "thêm bài vào hành trình theo khối" (hành trình tự lấy mọi câu đã duyệt của khối; tick bài tạo chiến dịch theo lớp). Nút "Bổ sung bài" mở luồng Bài hôm nay có sẵn. Cần hợp đồng API mới (Code 3).
- 16/17/19/20/21 giao diện mới: chưa đổi trong lượt này (điểm danh, buổi chữa, theo dõi ca, hồ sơ em, kho đề giữ giao diện hiện tại). 19 thuộc luồng thi thật.
- Ô bản duyệt chưa có dữ liệu máy chủ (không vẽ để khỏi bịa): phút học hôm nay, "Mục tiêu 8,5+", chấm từng câu mỗi bước, chủ đề "đang mạnh lên", "Sẵn sàng +1 bậc", lý do từng em, "máy tự điều chỉnh N kế hoạch", cột Vận dụng cao.
- Bát Linh V2 (8 loài vẽ mới): bảng duyệt ghi "chưa thay vào app" và chưa có tệp ảnh mới trong repo ⇒ giữ ảnh hiện tại.

## Kiểm (lệnh đã chạy trong phiên)
| Việc | Lệnh | Kết quả |
|---|---|---|
| Kiểu | `npx tsc -b`; `npx tsc --noEmit -p server/tsconfig.json` | 0 lỗi |
| Build + SW | `npm run build:cf` | exit 0 · SW 13/13 · precache 149 tệp / 2988 KB |
| Màu thô | `npm run check:mau` | 0 |
| Giữ màu | `npm run kiem:mau-giu` | 3 = đúng 3 mã gốc thầy ra lệnh (#fffef6, #0f3d3a, #f7a800) — chờ thầy xác nhận |
| Test toàn bộ (1090 tệp) | `npx vitest run …` | 127 đỏ / 70 tệp; chạy lại 70 tệp ấy trên `origin/main`: 125 đỏ — 2 đỏ mới là thay đổi có chủ ý, đã sửa test; sau đó 0 đỏ mới (so TÊN) |
| Test V2 | `npx vitest run tests/ban-duyet-v2-0910.test.tsx` | 11/11 |
| Ảnh Chromium | `node scripts/chup-v2/chup.mjs` (20 ảnh) | 0 lỗi trang, 0 tràn ngang; chạm < 44px chỉ còn ở thành phần cũ (chip cửa hàng 32px, nút thầy 40px theo chuẩn mật độ màn rộng) |

## Lùi
Chưa phát hành nên không có bản lùi. Bỏ thay đổi: `git revert <mã commit>`.

## Đợt 2 — tối giản 3 app (thầy chốt 09/10)
| Phần | Commit | Ghi chú |
|---|---|---|
| Tên "Bát Linh Đảo" | 66fa48d, 11dd5e8, 7ee7bf4 | Chữ hiển thị HS + nhãn nguồn câu sai (máy chủ, chỉ nhãn) + CongTacHoa2; PH chặn cả hai tên. |
| Phụ huynh 3 mục | 688e12f | Hôm nay · Tiến bộ · Ca kiểm tra; Hôm nay 4 khối. |
| Học sinh | 6f5fc95, 0efad47 | Hôm nay · Hành trình (tầng từng bài) · Thần thú (Túi đồ, Cửa hàng, Đăng xuất) · Câu đã làm; "Thử sức thêm" bật lại; Tu luyện giữ phụ đề. |
| Máy chủ | d4af938 | `hanhTrinh.bai[]` (chỉ đọc, không đổi schema), Thử sức thêm khi chạy Hành trình. |
| Giáo viên | 93f23ba | 5 mục + Cài đặt, màn Hôm nay mới, Hành trình 4 thẻ, bỏ hạn 9999. |
| Gộp main | caa450a | Tối ưu CPU Sảnh/Hành trình của main; số lệnh D1 Sảnh mở lại 36→30. |

Còn lại (ngoài làn, báo thầy): nút Mở ca riêng ở màn Ca kiểm tra (tạm đặt đầu màn từ App.tsx), câu "ở thanh bên" trong `CHU_CA_TRONG_HOA2`, chữ "Chữa trên lớp" cũ, "Sửa em" khi đang ở Hành trình không chuyển thẻ; `vung` từng bài = null (chưa có số đo).
