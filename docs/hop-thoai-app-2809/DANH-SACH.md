# Hộp thoại mặc định của trình duyệt — danh sách quét 28/09

Thầy gửi ảnh hộp "omr-app-b3u.pages.dev cho biết — Huỷ chiến dịch…? [Huỷ] [OK]": đổi mọi hộp như vậy sang hộp của app.
Quét `window.confirm` / `confirm(` / `alert(` / `prompt(` trong `src/` (cả `public/` cho chắc), trên `origin/main` 28/09.

| # | Tệp:dòng (trước khi sửa) | Câu hỏi | App | Xử lý |
|---|---|---|---|---|
| 1 | `src/components/chien-dich/DsChienDichDaGiao.tsx:83` | Huỷ chiến dịch "…"? Học sinh sẽ không nhận câu của chiến dịch này nữa. | Thầy (Ca kiểm tra › Chiến dịch đã giao) | `hoiXacNhan` — "Huỷ chiến dịch?" · nút đỏ **Huỷ chiến dịch** / **Giữ lại** |
| 2 | cùng dòng (nhánh Kết thúc) | Kết thúc chiến dịch "…" ngay bây giờ? | Thầy | `hoiXacNhan` — "Kết thúc chiến dịch?" · **Kết thúc ngay** / **Chưa kết thúc** |
| 3 | `src/components/KhoiKhacPhuc3CheDo.tsx:776` | Xoá bài luyện này khỏi lịch sử? | Học sinh (Luyện khắc phục › lịch sử) | `hoiXacNhan` — "Xoá bài luyện?" · nút đỏ **Xoá bài** / **Giữ lại** |
| 4 | `public/cai-app.html:657` (+ `cai-dat.html`, `cai-app/index.html`, ba bản y hệt) | Đang mở trang cài đặt… bấm ⋮ rồi "Cài đặt ứng dụng" | Trang cài app HS/PH (Android) | hộp `#modal-android` cùng kiểu hộp iOS của trang · **Mở trang cài**; nền/Esc = ở lại |
| 5 | `src/lib/html-phieu.ts:2478` | Còn N câu chưa làm, mấy câu đó tính là sai. Nộp luôn? | Phiếu HTML HS (BTVN) | **Giữ** — đã có sẵn hộp M3 `gd-hop` ("Nộp bài?" · Xem lại / Nộp luôn) chặn lời hỏi này và vẽ lại; không đổi luật nộp |
| 6 | `src/lib/html-phieu.ts:3192` | (cùng câu) | Phiếu HTML HS | **Giữ** — đường lùi khi không dựng được hộp M3 |

Không có: `window.alert`, `window.prompt`, `prompt(` của trình duyệt (chỉ `BeforeInstallPromptEvent.prompt()` trong `src/lib/pwa-install.ts` — không phải hộp), màn thi (`ExamTakeScreen`, `LamBaiNgang`), game.

## Ngoại lệ (giữ hộp của trình duyệt)
- `beforeunload`: trình duyệt bắt buộc hộp mặc định, trang không vẽ được hộp riêng. Hiện `src/` không dùng.
- `html-phieu.ts` (#5, #6): phiếu là tệp HTML độc lập (không React). Hộp người dùng thấy đã là hộp M3; hai lời gọi còn lại là cơ chế chặn + đường lùi. Test nguồn cho phép đúng 2 lời gọi ở tệp này.

## Thành phần chung
`src/components/hop-thoai.tsx`: `hoiXacNhan` → `Promise<boolean>`, `baoTin` → `Promise<void>`, `hoiNhap` → `Promise<string | null>`.
Vẽ bằng `HopXacNhan` (lớp `hxn-*`, `hop-xac-nhan.css`), bọc vỏ `display: contents`: `.m3.vo-thay` ở app thầy, `.m3` ở HS/PH.
Test: `tests/hop-thoai-app-2809.test.tsx`.

## Kiểm (28/09)
- `npx tsc -b`, tsc server, `npm run check:mau`: sạch. `npm run build:cf`: 13/13, precache 165 tệp / 2911 KB.
- Vitest toàn bộ: 41 tệp đỏ ngoài `docs/nen-vitest-do-1909.txt`, chạy lại riêng vẫn đỏ, KHÔNG tệp nào chạm phần sửa
  (vd. `m3-b-1909` đỏ do `m3-tuong-thich.css` sinh lệch sẵn trên origin/main; `khong-cu-phap-may-cu` do `chem-format-so-do.ts`).
- Ảnh: hộp huỷ chiến dịch (thầy sáng/tối), xoá bài luyện (HS sáng/tối), báo tin (PH) ở 390 và 1440 — nền đặc, tiêu điểm ở nút an toàn, không tràn ngang.
