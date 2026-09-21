# Hợp đồng TÊN LỚP (máy chủ ↔ màn của thầy) — Code 3 → Code 4, 21/09/2026

Thầy lệnh, Boss chốt: khối 12 tách thành **"12 - Tinh Hoa"** (42 em) và **"12 - Lớp Thường"** (mọi em khối 12 còn lại). `hoc_sinh.lop` **giữ nguyên = KHỐI** (`'10' | '11' | '12'`, dùng ở cổng vào thi và nhiều nơi) — KHÔNG đổi giá trị. Tên lớp nằm ở cột mới `hoc_sinh.ten_lop`.

Mã: `server/src/ten-lop.ts` · migration chỉ-thêm `server/migration-2109-ten-lop.sql` · gán dữ liệu thật MỘT lần `server/gan-2109-ten-lop-tinh-hoa.sql` (không nằm trong danh sách migration) · test `tests/ten-lop-may-chu-2109.test.ts`.

## Luật
- Mỗi em ĐÚNG MỘT lớp. Em chưa gán (`ten_lop` rỗng) ⇒ **mặc định theo khối**: khối 12 ⇒ `"12 - Lớp Thường"`; khối 10/11 ⇒ chính khối (`"10"`, `"11"`); khối rỗng ⇒ `"Chưa xếp lớp"`. Em thêm sau này khối 12 tự vào Lớp Thường.
- Chỉ đổi tên lớp; **không đụng `lop` (khối)**, không đổi luật giao bài. "Chọn theo lớp" ở màn Phân công = chọn sẵn các `sbd` của lớp vào đường giao "Riêng" có sẵn.
- Nguồn danh sách em của `/gv/lop` = hồ sơ (`hoc_sinh`, trừ trạng thái `khoa`) ∪ danh sách cổng (`danh_sach`, em chỉ có ở đó rơi vào lớp mặc định theo khối).
- Worker có thể lên TRƯỚC migration: `/gv/lop` vẫn ok nhưng có `lyDoThieu`, mọi em ở lớp mặc định; `/em/danh-sach` và `listStudents` **không có trường `tenLop`** (đừng bịa); `/gv/doi-lop-em` báo lỗi bằng lời. Màn phải chịu được cả ba.

## `POST /gv/lop {}` — ĐỌC-CHỈ (sau cổng mã thầy), ≤ 3 truy vấn
```json
{ "ok": true, "soEm": 172,
  "lop": [
    { "tenLop": "12 - Lớp Thường", "khoi": "12", "soEm": 83, "sbd": ["12001", "…"] },
    { "tenLop": "12 - Tinh Hoa",   "khoi": "12", "soEm": 42, "sbd": ["12021", "…"] },
    { "tenLop": "11", "khoi": "11", "soEm": 91, "sbd": ["…"] },
    { "tenLop": "10", "khoi": "10", "soEm": 41, "sbd": ["…"] }
  ],
  "lyDoThieu": "(chỉ có khi chưa chạy migration)", "soTruyVan": 3 }
```
- Thứ tự: khối lớn trước, cùng khối theo tên (tiếng Việt). `sbd` đã sắp tăng dần. `khoi` = khối đông nhất trong lớp (hoà ⇒ khối lớn hơn).
- Số em trong ví dụ chỉ để minh hoạ; số thật do máy chủ trả.

## `POST /gv/doi-lop-em {sbd, tenLop}` — GHI (sau cổng mã thầy)
- Thành công: `{ "ok": true, "sbd": "12003", "tenLop": "12 - Tinh Hoa" }` (tên đã chuẩn hoá: gộp khoảng trắng, cắt hai đầu).
- Từ chối bằng lời tiếng Việt trong `error` (không ghi gì): `Thiếu số báo danh.` · `Thiếu tên lớp.` · `Tên lớp không được để trống.` · `Tên lớp tối đa 40 ký tự.` · `Tên lớp có ký tự không hợp lệ.` (ký tự điều khiển, `<`, `>`) · `Không tìm thấy học sinh có số báo danh …` · `Em này chưa có hồ sơ tài khoản nên chưa đổi được tên lớp.` (em chỉ có ở danh sách cổng) · lỗi thiếu cột khi chưa chạy migration.
- Thầy chọn từ danh sách lớp có sẵn (`/gv/lop`) HOẶC gõ tên mới (≤ 40 ký tự). Chỉ đổi MỘT em mỗi lệnh; đổi cả lớp = gọi lặp.
- Chỉ ghi `ten_lop` (không đổi `cap_nhat_luc`, không đổi thứ tự danh sách).

## Trường `tenLop` thêm vào danh sách học sinh hiện có
- `POST /em/danh-sach` (và `action: "danhSachEm"`): mỗi phần tử có thêm `tenLop` (đã gán hoặc mặc định theo khối). `lop` vẫn là KHỐI.
- `action: "listStudents"` (hồ sơ đã đăng ký): mỗi phần tử có thêm `tenLop`.
- Không cần sửa gì nếu màn chỉ dùng map `sbd → tenLop` dựng từ `/gv/lop`.

## Việc còn lại phía dữ liệu thật (Code 3, cần quyền của thầy)
1. Chạy `migration-2109-ten-lop.sql` (`ALTER TABLE hoc_sinh ADD COLUMN ten_lop TEXT`, chạy MỘT lần) rồi `gan-2109-ten-lop-tinh-hoa.sql` (42 em Tinh Hoa) trên D1 thật.
2. Sau khi chạy: `SELECT COUNT(*) FROM hoc_sinh WHERE ten_lop = '12 - Tinh Hoa'` mong 42. Danh sách 41 em lấy từ bảng `phong_cho` của ca 848875 trong bản sao lưu 02:25 ngày 21/09 (đủ 41, cả 41 đều khối 12) + SBD 12074; đối chiếu với `btvn_em` của `848875-muamnh60` khi có quyền đọc D1 thật.
