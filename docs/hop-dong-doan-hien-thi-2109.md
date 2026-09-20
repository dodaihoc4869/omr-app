# Hợp đồng HIỂN THỊ NGOÀI GAME — hào quang, danh hiệu, ấn thạch của Đoàn Hộ Tống (Code 5 viết 21/09)

Người dùng: Code 2 (Bảng nhiệm vụ HS/PH), Code 4 (Vinh danh/Bảng tin), Code 1 (màn chiếu lên bảng). Code 5 KHÔNG sửa tệp của các phiên ấy. Máy chủ chưa trả / cờ game tắt → ẨN, không bịa.

## 1. Của chính em — `POST /game-v2/doan-hien-thi` `{ token }` (token game của em)
→ `{ ok, hienThi: { anSang: number, anNut: number, haoQuang: 'khong'|'bac'|'vang', danhHieu: string|null } }`
- `haoQuang`: số ẤN SÁNG (dạng em đã khắc phục xong theo hồ sơ thật, đủ ≥ 4 câu đã gặp và không còn yếu) — < 3 không · 3–5 bạc · ≥ 6 vàng. Vẽ: vòng sáng quanh thần thú (bạc `rgb(200,214,242)`, vàng `rgb(255,209,102)`); `khong` thì không vẽ gì.
- `danhHieu`: hiện có một danh hiệu — `"Người tiếp sức"` khi em tiếp sức bạn THÀNH CÔNG ≥ 3 lần trong 7 ngày gần nhất; chưa đạt → `null`. In nguyên chuỗi dưới tên thần thú.
- Em chưa bật cờ game (`doanMo=false`) → lệnh trả lỗi "Đoàn Hộ Tống sắp ra mắt…" ⇒ ẩn toàn bộ.
- Chữ gợi ý (không kết luận năng lực): "Ấn sáng 4 · nứt 2" — không viết "giỏi/yếu".

## 2. Cho thầy / cả lớp — `POST /game-v2-admin` `{ action: 'doan-bao-cao', lop?: '12A1', soNgay?: 7 }` (đường quản trị sẵn có, đã qua cổng giáo viên)
→ `{ ok, lop, soNgay, tiepSuc: [{ tu, tenTu, den, tenDen, soLan, thanhCong }], nguoiTiepSucCuaTuan: [{ sbd, ten, lop, soLan, thanhCong }] (tối đa 10, xếp theo thanhCong), trum: [{ maDang, ten, soLan, yDungTB, voGiap }] }`
- `nguoiTiepSucCuaTuan[0]` = "Người tiếp sức của tuần" cho Vinh danh / màn chiếu. Bạn máy không bao giờ có trong bảng.
- `trum`: lớp yếu dạng nào qua CÂU CHUNG của trùm — `yDungTB` = số ý đúng trung bình /4 (thấp = yếu), `voGiap` = số lần đúng ≥ 3/4. KHÔNG có tên em nào (câu chung không tạo bằng chứng cá nhân).
- Chưa chạy migration / chưa ai chơi → các mảng rỗng.
