# Bản vẽ "Mức làm bài" · 20/10/2026

Thầy dặn: tính thời gian đọc hết đề từng câu cho từng em, đo thời gian làm, ra các mức làm; hiện ở điểm danh, hồ sơ, ai đã sai câu này, gọi lên bảng, app học sinh; **mọi câu đã làm, đang làm, sắp làm đều phải đo được**; vẽ trước khi build.

Đặc tả đầy đủ và các quyết định cần thầy chốt: `docs/dac-ta-muc-lam-bai-2010.md`. Chưa sửa `src/`, `server/`. Số trong ảnh là số GIẢ, tính từ MỘT bảng (`du-lieu-gia.mjs`); ngưỡng là TẠM.

Dựng lại: `node scripts/dung-ban-ve-muc-lam-2010.mjs && node scripts/chup-ban-ve-muc-lam-2010.mjs` (nguồn: `du-lieu-gia.mjs`, `muc-lam.css`, sinh ra `muc-lam.html` và `anh/`). Mở từng khung bằng `muc-lam.html#k=<khung>&toi=1`. Nhãn "Thêm / Đổi / Giữ" chỉ để thầy xem bản vẽ, không có trong app.

| Khung | Tệp ảnh bắt đầu bằng | Màn | Chiếu hay riêng |
|---|---|---|---|
| 01 | `01-thang-` | Thang bốn mức, cách tính, thước mỗi em một khác | Riêng |
| 02 | `02-do-` | Mọi câu đều đo: đã làm · đang làm · sắp làm, bảng nguồn, độ phủ | Riêng |
| 03 | `03-diem-danh-` | Bảng điểm danh của thầy | Riêng |
| 04 | `04-ho-so-` | Hồ sơ làm bài của em | Riêng |
| 05 | `05-ai-sai-` | Ai đã sai câu này | Riêng |
| 06 | `06-len-bang-` | Em được gọi lên bảng | Riêng, không lên chiếu |
| 07 | `07-hs-` | App học sinh: Tự sửa lỗi, màn sửa câu, Câu đã làm | Riêng |
| 08 | `08-ph-` | App phụ huynh | Riêng |
| 09 | `09-chieu-tat-` | Bản chiếu điểm danh, mặc định (chỉ số gộp của lớp) | **Chiếu** |
| 10 | `10-chieu-bat-` | Bản chiếu điểm danh, bật công tắc H (thanh nhỏ từng em) | **Chiếu** |
| 11 | `11-chieu-x-` | Tờ chiếu "ai sai câu này" (phím X) | **Chiếu** |

Khung 01–08: ba khổ `doc` 390 · `ngang` 844 · `may-tinh` 1440 × `sang` / `toi`. Khung 09–11: 1920×1080 và 1280×720 (bản chiếu luôn nền tối).

Soát bằng máy: 0 lỗi trang · 0 tràn ngang · 0 đích chạm nhỏ hơn 44 px · 0 bản chiếu bị cắt. Màu chỉ dùng biến chuẩn của `src/styles/tokens.css` (`--gvm-*` cho app thầy, `--nen/--the/--muc…` cho học sinh và phụ huynh, `--km-*` + `--bt-dang-lam` + `--bts-ai-do` cho bản chiếu). Không màu nào là kênh duy nhất: mọi mức đều kèm "Mức làm N" hoặc số.
