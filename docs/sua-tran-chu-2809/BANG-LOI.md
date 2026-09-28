# Bảng lỗi tràn chữ — app GIÁO VIÊN + app HỌC SINH (kể cả game) · 28/09/2026

Cách dò: Vite dev + Chromium thật, chặn mạng bằng `page.route` trả JSON mẫu CỐ Ý DÀI (tên em 5 chữ, tên lớp
"12A1 Chuyên Hoá", tên chiến dịch/ca 60–80 ký tự, tên dạng dài). Mỗi màn chạy bộ dò trong trang (`cong-cu/do-tran.js`):
chữ bị tổ tiên `overflow:hidden/clip` cắt (không ellipsis) · chữ ra ngoài màn · một chữ ≥3 ký tự bị bẻ đôi xuống dòng ·
nhãn ngắn (chip/nút/huy hiệu) tách 2 dòng · hai mẩu chữ đè nhau (khác phần tử, cùng lớp nổi, không bị mặt nền che) ·
trang cuộn ngang. Cỡ: 360×740, 390×844, 768×1024, 1440×900 (+ 844×390 cho app HS).

Màn đã đi — **app thầy (19 cảnh)**: Tổng quan · Ca kiểm tra · Mở ca · Chi tiết ca đang mở · Chiếu mã vào thi · Chiến dịch luyện ·
Giao chiến dịch · Bảng chiến dịch · Chữa trên lớp · Gọi lên bảng theo ca · Học sinh · Báo cáo em · Lịch sử ca của em ·
Toàn cảnh em · Kho đề · Cài đặt · Công cụ kỹ thuật. **App HS (30 cảnh)**: Sảnh · Câu đã làm (+ lời giải) · Vào phòng thi ·
Làm bài · Túi đồ · Sổ tay · Đảo (vào từ Sảnh + trang xem-thử: bản đồ, khoá đảo, chọn thú, sổ tay, túi, thám hiểm 5 bước) ·
Đoàn Hộ Tống (sảnh + 8 trạng thái trận) · Cửa hàng / Thử đồ / Tủ đồ.

## Lỗi tìm thấy và đã sửa

| # | App | Màn | Cỡ | Phần tử | Mô tả | Sửa |
|---|---|---|---|---|---|---|
| 1 | GV | Mọi màn (thanh bên) | 1440×900 | `.ben-trai-dem` | Huy hiệu "1 mở" tách 2 dòng, đè biểu tượng Ca kiểm tra | `white-space:nowrap` |
| 2 | GV | Giao chiến dịch | 1440×900 | `.cd-nut-mo-chon` | Nút "Chọn em" tách 2 dòng khi ô gợi ý bên cạnh dài | `flex:0 0 auto; nowrap` |
| 3 | GV | Mọi màn (thanh đáy Hoá 2.0) | 360×740 | `.day-thay-muc.dang` | Nhãn "Ca kiểm tra" (đậm) tách 2 dòng | bỏ đệm ngang, `nowrap`, ≤379 px chữ 11 px |
| 4 | GV | Màn ca-thi (Mở ca, Ca đã mở…) | mọi cỡ | `.ct button` → `.ct-nut-chinh` | `.ct button{color:inherit}` (0,1,1) đè màu chữ nút chính ⇒ chữ tối trên nền màu | tách `color` sang `.ct :where(button)` (0,1,0); đo lại: nút chính 5,73:1 (≥4,5) |
| 5 | HS | Đoàn – câu chung trùm | 360, 390 | `.dh-y>div>span` | Ba nút Đúng/Sai/Chốt ép chữ ý còn ~40 px, bẻ từng chữ ("acetate.") | hàng ý `flex-wrap`, chữ `flex:1 1 150px`, nhóm nút xuống dòng dưới |
| 6 | HS | Đoàn – mọi trạng thái trận | 360, 844×390 | `.dh2-hud-dong span` | "◆ = hiệp trùm" / "◆ đang ở hiệp trùm" chui dưới nút "Rời chuyến" | ellipsis + `title` đủ câu |
| 7 | HS | Đoàn – trận (sau hiệp) | 360, 390, 768 | `.dh2-sat-thuong` | Số "-24 ĐÒN CỦA EM" đè chip đồng đội / "Liên kích" | màn dọc: một hàng, neo trên nhãn Máu (`bottom:58px`) |
| 8 | HS | Đảo 2.0 – bản đồ | 360×740 | `.dao2-bd-dau h2` | "Đảo Carbohydrate": chữ "Carbohydrate" bẻ đôi | cỡ `clamp(17px,5vw,22px)`, `overflow-wrap:break-word`, ≤380 px gap 6 |
| 9 | HS | Đảo – thám hiểm (bật Giảm chuyển động) | 360×740 | `.dao-san-so` | Số "-34 máu" đứng yên đè nhãn "Thần thú của em" (không có hoạt ảnh tắt dần) | Giảm chuyển động ⇒ ẩn số nổi (thanh Máu vẫn có) |
| 10 | HS | Đảo – chọn thần thú | 844×390 | `.dao-chon-ten em` | Nhãn hệ "Đức tin", "Sự sáng ý thức" bị cắt trong thẻ hẹp | `.dao-chon-ten{flex-wrap:wrap}` |
| 11 | HS | Sảnh – bản ngang | 844×390 | `.h2-nhan-dao` | Nhãn đảo (neo trên) vượt lên đè khung tiêu đề bản đồ | `CanhSanh3D`: nhãn neo trên không lên quá mép trên vùng cảnh |

Tổng: **GV 4 lỗi — sửa 4 · HS 7 lỗi — sửa 7.** Lượt dò cuối (sau sửa, sau gộp main 499ef50): **0 lỗi** ở 67 lượt app thầy và 149 lượt app HS.

## Đợt 2 (Boss giao sửa nốt)

| # | App | Màn | Phần tử | Mô tả | Sửa |
|---|---|---|---|---|---|
| 12 | HS | Sảnh dọc (360–768) | `.h2-ray` "Đăng xuất" | Nút cuối cột lối tắt bị tấm dưới che, không bấm được | `.h2-dem` cao theo số nút lối tắt (4 nút 330 px, 5 nút 400 px) — kiểm `elementFromPoint` trúng nút ở 5 cỡ |
| 13 | GV | Chiếu mã vào thi | `.cm-dem` "/ 24 em" | Viên nền xanh nhạt của `.ca-chieu-cho` dưới chữ sáng: tương phản 1,4:1 | `.cm .cm-dem` bỏ nền viên ⇒ chữ sáng trên nền tối (≈10:1) |
| 14 | GV | Bảng chiến dịch · Nhịp của lớp | `.cd-thanh--*` | Thanh vượt 100% khi dữ liệu > sĩ số | kẹp bề rộng 0–100%, số hiện vẫn là giá trị thật |

Nút "Rời chuyến" (HUD Đoàn) 2 dòng là thiết kế nút vuông, không phải lỗi.

Vùng ca-thi (`src/components/ca-thi/*`, Mở ca, Ca đã mở, Chiếu mã) đã dò sau khi gộp main 499ef50: không còn tràn chữ.

Công cụ dò (chép từ phiên): `cong-cu/` — `khung.mjs <canh-gv|canh-hs>.mjs [lọc] [cỡ,…] [--anh]` (cần `vite` ở cổng 5199,
cho phép phục vụ `node_modules` liên kết mềm: `server.fs.allow`).
