# `/ca/them-phut` — định nghĩa máy chủ đã chọn (bổ sung `docs/hop-dong-them-phut-2109.md` mục 1)

Người viết: Code 3. Mã: `server/src/them-phut.ts` (lệnh), `server/src/index.ts` (`examStatus` = `dayTrangThai`, `chiTietCaMoi`). Migration: `server/migration-2109-them-phut.sql` (`ca.them_phut_tong INTEGER NOT NULL DEFAULT 0`, chỉ thêm). Test: `tests/them-phut-may-chu-1909.test.ts` (14 test SQLite thật, đột biến). Phía màn thi học sinh (Code 2) nằm ở `tests/them-phut-1909.test.ts`.

**Vào**: `POST /ca/them-phut {maCa, phut}` (mã bí mật). `phut` phải là SỐ nguyên 1..15 (chuỗi "5", 2.5, 0, 16, null đều bị từ chối). **Ra**: `{ok:true, phut, soLuotCong, soLuotKhoaCong, thoiGianPhut, themPhutTong}` (`soLuotCong` chỉ đếm lượt đang làm; `soLuotKhoaCong` đếm lượt khoá).

**Từ chối bằng lời** (`ok:false`, `error`): thiếu mã ca; phút sai; ca không tồn tại; ca không `trang_thai='mo'` (đóng, đã xoá); ca `loai='baitap'`; tổng đã thêm cộng phút mới vượt 30 ("Ca này đã thêm N phút. Thêm M phút nữa sẽ vượt trần 30 phút mỗi ca."); chưa chạy migration; và `thuLai:true` khi có lệnh khác chen vào giữa lúc đọc và ghi (không đổi gì, thầy bấm lại).

**Làm gì (MỘT batch, ba câu, cùng điều kiện "`them_phut_tong` vẫn bằng giá trị vừa đọc")**:
1. `luot.het_gio_luc += phut` cho lượt `trang_thai='dang_lam'` có hạn ĐỌC ĐƯỢC.
2. Như trên cho lượt `trang_thai='khoa'` (Boss soát 21/09): `moKhoaEm` (goi-cu.ts) đưa `khoa` về `dang_lam` với NGUYÊN `het_gio_luc`, nên em được mở khoá SAU khi thêm phút mà không cộng thì thiệt giờ. Lượt `khoa` này đã có `nop_luc` (khoá lúc rời màn); chỉ `het_gio_luc` đổi. Lượt `duoc_duyet_lai` không cộng: hạn tính lại từ `ca.thoi_gian_phut` (đã cộng) khi em vào lại. Lượt đã nộp (`da_nop`), hạn rỗng hoặc hỏng giữ nguyên.
3. `ca.thoi_gian_phut += phut`, `ca.them_phut_tong += phut`. Em vào SAU khi thêm phút nhận đủ giờ mới (`mocHetGio` và ca đồng bộ giờ tính theo `thoi_gian_phut`).
KHÔNG đụng `het_han_vao`, điểm, đáp án, lượt đã nộp. Chỉ cộng, không bao giờ trừ.

**ĐẨY LẠI CA không làm mất phút đã thêm (Boss soát 21/09)**: `publish` (`dayCa`) và `/ca/nhieu` ghi đè `thoi_gian_phut` theo bản của app thầy. Ca có `them_phut_tong > 0` thì máy chủ ghi `MAX(số app gửi, thoi_gian_phut hiện có)`: app gửi số cũ (45) thì vẫn giữ 55; app gửi số lớn hơn thì theo số lớn hơn. Ca chưa thêm phút: đúng số app gửi (hạ được như cũ). Chưa chạy migration thì ghi như cũ (đọc bằng `docPhutCaDaThem`, không đưa cột mới vào câu upsert nên không vỡ).

**`examStatus` (POST `/trang-thai`)** thêm `hetGioLuc` (ISO) = `luot.het_gio_luc` của lượt `dang_lam` mới nhất của đúng em trong `maCa` gửi kèm. VẮNG khi thân không có `maCa`, không có lượt đang làm, lượt đã nộp/khoá/chờ duyệt lại, hoặc lượt chưa có hạn. Câu đọc đi CÙNG lượt gọi D1 (batch) với câu ghi `trang_thai`, nên nhịp nóng nhất không thêm vòng đi-về. Luôn `ok:true` như trước.

**`/ca/chi-tiet`**: `ca.themPhutTong` (tổng đã thêm; 0 nếu chưa thêm hoặc chưa chạy migration).

**Lưu ý cho app thầy**: sau khi thêm phút nên đọc `thoiGianPhut` mới (phản hồi lệnh hoặc `/ca/chi-tiet`) để bản của app khớp máy chủ; nếu không, đẩy lại ca vẫn KHÔNG mất phút (máy chủ giữ số lớn hơn), nhưng thầy muốn HẠ giờ ca đã thêm phút thì không làm được qua `publish`.

**Reset**: `ca` được giữ khi reset nên cột đi theo.
