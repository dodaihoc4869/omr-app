# Thứ tự CHẠY THẬT trên D1 sống + Worker (Code 3, 21/09/2026) — mỗi bước ghi dữ liệu thật CHỈ chạy khi Boss soát và thầy cho phép

Lệnh chạy từ `/Volumes/SSD NGOÀI/omr-app/server` (D1 tên `omr`). Tệp SQL nằm ở `server/`; tệp không có tiền tố `migration-` KHÔNG được test/D1 mới tự nạp.

| # | Việc | Lệnh | Kiểm sau khi chạy | Lùi |
|---|---|---|---|---|
| 0 | Sao lưu D1 | `npx wrangler d1 export omr --remote --output="/Volumes/SSD NGOÀI/omr-saoluu/omr-d1-<yyyymmdd-hhmm>.sql"` | tệp có kích cỡ ~ 100 MB, dòng cuối `COMMIT`/không lỗi | — |
| 1 | Migration chỉ-thêm: bảng `canh_bao_thay` (nhắc tự động) | `npx wrangler d1 execute omr --file=migration-2109-canh-bao-thay.sql --remote -y` | `SELECT name FROM sqlite_master WHERE name LIKE 'canh_bao_thay%'` ⇒ 1 bảng + 3 chỉ mục | `DROP TABLE canh_bao_thay` |
| 2 | Migration chỉ-thêm: cột `hoc_sinh.ten_lop` (chạy MỘT lần, không chạy lại được) | `… --file=migration-2109-ten-lop.sql …` | `PRAGMA table_info(hoc_sinh)` có `ten_lop` | `ALTER TABLE hoc_sinh DROP COLUMN ten_lop` |
| 3 | Gán 42 em "12 - Tinh Hoa" | `… --file=gan-2109-ten-lop-tinh-hoa.sql …` | `SELECT COUNT(*) FROM hoc_sinh WHERE ten_lop = '12 - Tinh Hoa'` = **42** | `UPDATE hoc_sinh SET ten_lop = NULL WHERE ten_lop = '12 - Tinh Hoa'` |
| 4 | **ĐẨY WORKER** từ worktree sạch tại commit đã soát: `./DAY-MAY-CHU.command </dev/null` (chốt ca thi đang mở + tsc) | — | `wrangler deployments list`; `POST /gv/lop` ok | `wrangler rollback e268ce35` (mốc Worker trước gói) |
| 5 | Gán 15 em "12 - Nhóm 10 điểm" | `… --file=gan-2109-ten-lop-nhom-10-diem.sql …` | `COUNT(ten_lop='12 - Nhóm 10 điểm')` = **15**; Tinh Hoa vẫn **42**; `POST /gv/lop` trả **3 lớp khối 12** | `UPDATE hoc_sinh SET ten_lop = NULL WHERE ten_lop = '12 - Nhóm 10 điểm'` |
| 6 | Đổi tên 12028 "Nguyễn Công Hy" ⇒ "Nguyễn Công Huy" | `… --file=doi-ten-2109-12028.sql …` | câu SELECT cuối tệp: mỗi bảng một dòng, tên "Nguyễn Công Huy" | `… --file=doi-ten-2109-12028-lui.sql …` |
| 7 | Migration chỉ-thêm: bảng lưu `hoc_sinh_da_go`, `danh_sach_da_go` | `… --file=migration-2109-hoc-sinh-da-go.sql …` | 2 bảng mới, rỗng | `DROP TABLE hoc_sinh_da_go; DROP TABLE danh_sach_da_go` (khi đã khôi phục hết) |
| 8 | Gỡ 2 em khỏi danh sách (KHÔI PHỤC ĐƯỢC): 12121 Dương Quỳnh Mai (hồ sơ + danh sách cổng), 12126 Đỗ Anh Toàn (chỉ danh sách cổng) | `… --file=go-2109-em-chua-mo-app.sql …` | `SELECT sbd FROM hoc_sinh_da_go` = 12121; `SELECT sbd FROM danh_sach_da_go` = 12121, 12126; `SELECT COUNT(*) FROM hoc_sinh WHERE sbd IN ('12121','12126')` = 0 | `… --file=go-2109-em-chua-mo-app-lui.sql …` |

## Ghi chú
- Bước 3, 5, 6, 8 đụng dữ liệu học sinh THẬT: chỉ chạy sau dòng "đã soát" của Boss và khi thầy cho phép. Bước 8 tự bỏ qua em nào vừa có dấu vết hoạt động (token, mật khẩu, 27 bảng sổ, bài tập đã mở/nộp) — số em thực sự gỡ có thể < 2; đọc câu kiểm.
- Chỉ động vào `hoc_sinh` + `danh_sach` (+ hai bảng lưu). Các bảng khác (bài tập đã giao `btvn_em`, kế hoạch ngày, thông báo…) giữ nguyên: em bị gỡ có thể còn dòng ở `btvn_em` của bài đã giao trước đó.
- Worker lên trước migration `ten_lop`/`canh_bao_thay` vẫn an toàn (mọi lệnh liên quan thiếu bảng/cột thì báo bằng lời hoặc bỏ qua); thứ tự trên vẫn nên giữ để tránh trạng thái nửa vời.
- Test: `tests/ten-lop-may-chu-2109.test.ts`, `tests/go-em-chua-mo-app-2109.test.ts`, `tests/doi-ten-12028-2109.test.ts`.
