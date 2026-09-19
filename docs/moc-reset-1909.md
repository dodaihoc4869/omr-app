# Hợp đồng `mocReset` và phản hồi "đang làm mới" — cho app học sinh, phụ huynh, giáo viên

Người viết: Code 3 (máy chủ). Mã: `server/src/reset-toan-app.ts`, nối ở `server/src/index.ts`. Bối cảnh: thầy chốt RESET TOÀN APP lúc 00:01 giờ VN thứ Hai 21/09/2026 (xoá ca thi, lượt, BTVN, sổ học, game, thần thú…; giữ tài khoản, lớp, kho đề, cấu hình). Máy học sinh/giáo viên còn giữ nhiều thứ theo mã cũ trong localStorage/IndexedDB; mốc này cho máy tự dọn.

## 1. Trường `mocReset`

- Kiểu: chuỗi `"YYYY-MM-DD"`. Giá trị duy nhất hiện nay: `"2026-09-21"`.
- Ở GỐC JSON của ba phản hồi (không lồng trong `exp`/`thanThu`…):
  - `POST /hs/ke-hoach-ngay` (HS và PH gọi),
  - `POST /hs/ca-dang-mo` (HS và PH gọi),
  - `POST /ca/danh-sach` (đường CHÍNH của app giáo viên; lệnh của thầy, kèm mã bí mật),
  - `POST /goi {action:"danhSachCa"}` (đường dự phòng của app giáo viên khi `/ca/danh-sach` trả null).
- **VẮNG hoàn toàn cho tới khi job reset chạy XONG** (không gửi `null`, không gửi chuỗi rỗng). Lý do: máy khách coi "máy chưa từng thấy mốc + máy chủ có mốc" là tín hiệu dọn nháp; gửi sớm = xoá nháp bài của học sinh ngay tối Chủ nhật. Nguồn giá trị: `cau_hinh.reset_20260921.xongLuc` đã có. Job xong thì trường xuất hiện trong vài giây (bộ nhớ đệm máy chủ tối đa 5 giây).
- Máy khách gợi ý: giữ `omr_moc_reset` trong localStorage. Khi phản hồi có `mocReset` mà giá trị đã lưu KHÁC (kể cả chưa từng lưu) → dọn bộ nhớ theo danh sách dưới rồi mới lưu mốc mới. Phản hồi không có `mocReset` → không làm gì.
- Nên dọn (HS/PH): bản nhớ kế hoạch ngày, nháp/khôi phục bài làm theo MÃ CA trong IndexedDB, danh sách ca, bài Mẹ giao/BTVN nhớ trong máy (`omr_mom_btvn_<sbd>`…), bản nhớ thần thú/EXP (máy chủ đã về vạch xuất phát, em chọn thú lại). GIỮ: đăng nhập/token (mật khẩu không đổi), cài đặt giao diện.
- Nên dọn (giáo viên): danh sách ca, bank/đáp án và bản đồ đề riêng nhớ theo mã ca cũ, hàng đợi đẩy dữ liệu chưa gửi của ca cũ (kẻo đẩy ngược ca ma lên máy chủ).

## 2. Lúc job đang chạy (đóng băng 00:00–00:20 giờ VN, mở ngay khi job xong)

Mọi lệnh (trừ `/khoe` và các đường chuyển hướng) trả:

```json
{ "ok": false, "error": "Hệ thống đang làm mới, thử lại sau 1 phút", "dangLamMoi": true, "serverNow": 1789… }
```
HTTP 200 (như các lỗi nghiệp vụ khác). Máy khách gặp `dangLamMoi:true`: KHÔNG coi là lỗi đăng nhập/mất mạng, KHÔNG xoá phiên đăng nhập; hiện đúng câu `error`, tự thử lại sau ~60 giây.

## 3. Mã đã dùng không được cấp lại

Job nạp mọi mã ca (từ `ca`, `luot`, `phieu`…), mã BTVN và mã bài Mẹ giao KHÔNG phải UUID vào bảng `ma_da_dung` trước khi xoá. Sau reset:

| Lệnh | Khi mã cũ | Phản hồi |
|---|---|---|
| `publish` (đẩy ca) | mã ca nằm trong tập và không còn trong `ca` | `{ ok:false, error:"Mã ca đã từng dùng, tạo lại với mã khác", maCaDaDung:true }` — app giáo viên tự sinh mã khác rồi đẩy lại |
| `capNhatKeyBank` | mã ca cũ, không còn trong `ca` | `{ ok:false, error:"Ca này đã bị xoá khi làm mới hệ thống…", maCaDaDung:true }` — KHÔNG ghi R2 (lớp bảo hiểm thứ hai; app thầy đã tự chặn không đẩy ca ngoài danh sách máy chủ) |
| `noiKhoCa` | như trên | như trên |
| Mẹ giao `create` | id nằm trong tập | lỗi `"Mã bài đã từng dùng. Tạo lại bài với mã khác."` |

Mã ca chưa từng dùng và chưa có dòng trong `ca` vẫn ghi được `capNhatKeyBank` bình thường (đẩy đáp án có thể đi trước đẩy ca). Mã BTVN do máy chủ sinh dạng `<mã ca>-<thời gian base36>` nên không trùng; giữ trong tập để tra cứu.

## 4. Sau reset, máy chủ trả gì

- `/hs/ke-hoach-ngay`: `thanThu: null` cho mọi em (chưa chọn thú); `exp`/`expNhan` theo EXP mới từ mốc 00:01 21/09 (`cau_hinh.exp_moi = {tu:"2026-09-20T17:01:00.000Z", toanBo:true}`).
- Game v2: hồ sơ tạo lại là bản trắng (`choice:true`, cấp 1, 0 EXP, 0 mảnh khiên, không tên), mùa game mới `2026-09-21-mua-1`.
- Đăng nhập: mật khẩu và token cũ dùng được (bảng `hoc_sinh` giữ nguyên).
