# Lệnh `/ke-hoach/hom-nay-thay` — định nghĩa máy chủ đã chọn (bổ sung cho `docs/hop-dong-gv-hom-nay-2109.md`)

Người viết: Code 3. Mã: `server/src/hom-nay-thay.ts`. Test: `tests/hom-nay-thay-1909.test.ts` (12 test SQLite thật, đột biến 26/26). Chỉ ĐỌC, ≤ 8 truy vấn D1 (số thật ở trường `soTruyVan` của phản hồi), sau cổng mã bí mật.

Chỗ hợp đồng để mở, máy chủ chọn như sau (đổi thì nhắn Code 3):

- `soEm`: số dòng `hoc_sinh` không bị khoá (`trang_thai <> 'khoa'`), gồm cả em chưa có lớp. `soLop`: số lớp khác rỗng có em. `siSo` của từng lớp cũng đếm như vậy.
- `caDangMo`: ca `trang_thai='mo'`, `loai='thi'`, mà `quyetDinhVaoThi` (luật vào thi) cho vào được ở giờ hiện tại. Không lọc theo lớp.
- `nhiemVu.tong`: số em có dòng `ke_hoach_ngay` của ngày, không phải ngày nghỉ. `dat`: công thức của `chotNgayCu` (đã làm ≥ `toiThieuCau`, kế hoạch không báo trễ nhịp, và có câu lên bậc hoặc không có câu tới hạn), số câu lấy trực tiếp từ sổ (`TIEN_BO_NGAY`) chứ không từ cột đã chốt. `tongHomQua/datHomQua`: null nếu hôm qua chưa có dòng nào được chốt `ket_qua` (không đếm 0 giả).
- `btvn.dangChay`: mỗi bài một dòng, ≤ 6, hạn gần nhất trước. `loHienTai` = lô mà NHIỀU em đang ở nhất (hiển thị từ 1; hoà thì lô sau); `tongLo` = lớn nhất trong các em; `soEmKip` = em có `treNhip=false`; `soEm` = số em có lô của bài này hôm nay; `lop` = lớp có nhiều em nhất trong bài (hoà thì tên nhỏ hơn); `han` = sớm nhất trong `btvn.han_nop` và `hanCung` các em; `ten` = `ca.ten_ca`, không có thì `de_kho.ten_de`, không có nữa thì mã bài (sau reset các bảng ấy có thể trống). `soEmDungNhip` = em có lô mà không lô nào trễ nhịp.
- `canYTuong`: chỉ xét em CÓ kế hoạch hôm nay (không phải ngày nghỉ). Trễ nhịp: số ngày từ ngày làm câu cuối (`MAX(su_kien_hoc.ngay_vn)`) tới ngày xét, trừ ngày nghỉ trong `cau_hinh.ngay_nghi`, ≥ 3; em chưa từng làm câu nào KHÔNG bị xét trễ nhịp. Tụt bậc: `so_cau_tut_bac` của hai ngày trước cộng số câu tụt bậc trong ngày (từ sổ), ≥ 3. Dạng yếu: dạng `dangYeu` của hồ sơ có `soSai` lớn nhất. Xếp: trễ nhịp (nhiều ngày trước), tụt bậc (nhiều câu trước), dạng yếu (nhiều câu sai trước), hoà thì theo SBD.
- `dangYeu`: 4 lớp đông nhất (hoà thì tên lớp), mỗi lớp ≤ 3 dạng có nhiều em yếu nhất (hoà thì mã dạng); lớp không có dạng yếu vẫn hiện với `dang: []`. Chỉ tên dạng (`tenDang`) đi ra, không có cột `json` của câu hỏi.
- `doan`: `null` khi cờ `cau_hinh.doan_ho_tong` tắt (không phải lỗi, không ghi `lyDoThieu`). Bật: MỘT lớp là lớp đông nhất trong các lớp đã mở (`toanBo` thì mọi lớp; `dsSbd` thì lớp của các em trong danh sách); `tram` = `tramCuaLop(số chặng thắng của lớp trong mùa, sĩ số)` cùng hàm với Sảnh của game; `gopSucHomNay` = số em khác nhau có chặng thắng hôm nay.
- Khối nào truy vấn lỗi (thiếu bảng, D1 lỗi) thì `null` kèm `lyDoThieu.<khối>`; các khối còn lại vẫn ra. Thiếu `hoc_sinh` thì `soEm`, `soLop`, `dangYeu`, `canYTuong` null (danh sách em lấy từ đó).
- Không có trong hợp đồng, thêm cho tiện: `serverNow`, `soTruyVan`, `lyDoThieu.soEm`, `lyDoThieu.caDangMo`.
