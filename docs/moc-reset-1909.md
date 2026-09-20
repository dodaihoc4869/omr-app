# Hợp đồng `mocReset` và phản hồi "đang làm mới" — cho app học sinh, phụ huynh, giáo viên

Người viết: Code 3 (máy chủ). Mã: `server/src/reset-toan-app.ts`, nối ở `server/src/index.ts`. Bối cảnh: thầy chốt RESET TOÀN APP (cập nhật 21/09 00:08): xoá BTVN, bài Mẹ giao, kế hoạch ngày, game, thần thú (em chọn lại thú), EXP, mảnh khiên; GIỮ tài khoản, lớp, kho đề, cấu hình, toàn bộ SỔ + HỒ SƠ MẠNH YẾU của học sinh, và MỌI CA THI đã thi (ca, lượt, điểm từng câu…; thầy chốt 21/09 ~01:30). Không còn giờ cố định: job chạy khi thầy/Boss ra lệnh (xem `docs/reset-2109.md`). Máy học sinh/giáo viên còn giữ nhiều thứ theo mã cũ trong localStorage/IndexedDB; mốc này cho máy tự dọn.

## 1. Trường `mocReset`

- Kiểu: chuỗi `"YYYY-MM-DD"` = **ngày VN lúc job reset XONG** (không còn hằng `2026-09-21`; ngày thật do lúc ra lệnh quyết định, chưa biết trước). Máy khách KHÔNG được so với một giá trị cố định: chỉ so "khác giá trị đã lưu".
- Ở GỐC JSON của ba phản hồi (không lồng trong `exp`/`thanThu`…):
  - `POST /hs/ke-hoach-ngay` (HS và PH gọi),
  - `POST /hs/ca-dang-mo` (HS và PH gọi),
  - `POST /ca/danh-sach` (đường CHÍNH của app giáo viên; lệnh của thầy, kèm mã bí mật),
  - `POST /goi {action:"danhSachCa"}` (đường dự phòng của app giáo viên khi `/ca/danh-sach` trả null).
- **VẮNG hoàn toàn cho tới khi job reset chạy XONG** (không gửi `null`, không gửi chuỗi rỗng). Lý do: máy khách coi "máy chưa từng thấy mốc + máy chủ có mốc" là tín hiệu dọn nháp; gửi sớm = xoá nháp bài của học sinh ngay tối Chủ nhật. Nguồn giá trị: khoá `cau_hinh.reset_toan_app` có `trangThai:"xong"` (giá trị lấy từ `mocReset` trong khoá). Job xong thì trường xuất hiện trong vài giây (bộ nhớ đệm máy chủ 3 giây). Chưa từng có `mocReset` nào được gửi trước đây, nên ngày này lớn hơn mọi giá trị máy đã lưu: cả cách so "khác giá trị đã lưu" (app giáo viên) lẫn cách so "mới hơn" (app học sinh/phụ huynh, chuỗi ≥) đều dọn đúng một lần (đã xác nhận với Code 1 và Code 2 ngày 21/09). Job này chỉ chạy một lần; nếu sau này có reset khác trong CÙNG một ngày VN thì phải thêm giờ vào mốc (chuỗi ≤ 40 ký tự chữ, số, `.`, `_`, `:`, `-`).
- Máy khách gợi ý: giữ `omr_moc_reset` trong localStorage. Khi phản hồi có `mocReset` mà giá trị đã lưu KHÁC (kể cả chưa từng lưu) → dọn bộ nhớ theo danh sách dưới rồi mới lưu mốc mới. Phản hồi không có `mocReset` → không làm gì.
- Nên dọn (HS/PH): bản nhớ kế hoạch ngày, bài Mẹ giao/BTVN nhớ trong máy (`omr_mom_btvn_<sbd>`…), bản nhớ thần thú/EXP (máy chủ đã về vạch xuất phát, em chọn thú lại). GIỮ: đăng nhập/token (mật khẩu không đổi), cài đặt giao diện, và MỌI thứ gắn với CA THI (danh sách ca, nháp/khôi phục bài làm theo mã ca: ca thi được giữ nguyên trên máy chủ, em vẫn xem lại được bài đã thi).
- Nên dọn (giáo viên): chỉ thứ gắn với BTVN và bài Mẹ giao đã xoá, và buổi chữa dở nếu gắn kế hoạch ngày. KHÔNG cần dọn bank/đáp án, ca cache, bản đồ đề riêng, hàng đợi đẩy của ca: MỌI CA THI đã thi được GIỮ trên máy chủ (thầy chốt 21/09 ~01:30); dọn đi chỉ khiến máy tải lại. Hàng đợi đẩy dữ liệu chưa gửi của ca vẫn đẩy được bình thường.

## 2. Lúc job đang chạy (đóng băng từ lúc lên đạn tới khi job xong hoặc hết 60 phút; CHỈ khi thầy đã bật cờ "lên đạn")

Mọi lệnh (trừ `/khoe` và các đường chuyển hướng) trả:

```json
{ "ok": false, "error": "Hệ thống đang làm mới, thử lại sau 1 phút", "dangLamMoi": true, "serverNow": 1789… }
```
HTTP 200 (như các lỗi nghiệp vụ khác). Máy khách gặp `dangLamMoi:true`: KHÔNG coi là lỗi đăng nhập/mất mạng, KHÔNG xoá phiên đăng nhập; hiện đúng câu `error`, tự thử lại sau ~60 giây.

## 3. Mã đã dùng không được cấp lại

Job nạp mã BTVN và mã bài Mẹ giao KHÔNG phải UUID vào bảng `ma_da_dung` trước khi xoá (máy em còn nháp theo mã cũ). KHÔNG nạp mã ca: mọi ca được giữ trong bảng `ca`. Các lệnh sau vẫn chặn "mã ca đã dùng mà không còn trong bảng `ca`" (chỉ có tác dụng nếu mã ca được nạp tay vào `ma_da_dung`), và KHÔNG BAO GIỜ chặn ca còn trong bảng:

| Lệnh | Khi mã cũ | Phản hồi |
|---|---|---|
| `publish` (đẩy ca) | mã ca nằm trong tập và không còn trong `ca` | `{ ok:false, error:"Mã ca đã từng dùng, tạo lại với mã khác", maCaDaDung:true }` |
| `capNhatKeyBank`, `noiKhoCa` | như trên | `{ ok:false, error:"Ca này đã bị xoá khi làm mới hệ thống…", maCaDaDung:true }`, KHÔNG ghi R2 |
| Mẹ giao `create` | id nằm trong tập | lỗi `"Mã bài đã từng dùng. Tạo lại bài với mã khác."` (đường này VẪN hoạt động sau reset: id `daily_<ngày cũ>` bị chặn, id mới thì tạo được) |
| `/ca/nhieu` (đẩy nhiều ca + lượt) | ca hoặc lượt mang mã trong tập mà không còn trong `ca` | BỎ QUA các mục ấy, phần còn lại vẫn đẩy; phản hồi có `boQuaMaCu:[…]`; nếu mọi ca đều bị bỏ: `{ ok:false, maCaDaDung:true, boQuaMaCu:[…] }` |

Mã BTVN do máy chủ sinh dạng `<mã ca>-<thời gian base36>` nên không trùng; giữ trong tập để tra cứu.

## 4. Sau reset, máy chủ trả gì

- `/hs/ke-hoach-ngay`: `thanThu: null` cho mọi em (chưa chọn thú); `exp`/`expNhan` theo EXP mới từ lúc job bắt đầu (`cau_hinh.exp_moi = {tu:"<batDauLuc>", toanBo:true}`). Sổ học cũ vẫn còn nhưng KHÔNG sinh EXP. Kế hoạch ngày, câu ôn, hồ sơ mạnh yếu của em GIỮ NGUYÊN (dựa trên sổ + hồ sơ được giữ): việc ôn hôm nay của em vẫn là các câu tới hạn từ trước reset.
- Game v2: hồ sơ tạo lại là bản trắng (`choice:true`, cấp 1, 0 EXP, 0 mảnh khiên, không tên), mùa game mới `<ngày VN lúc bắt đầu>-mua-1`.
- Đăng nhập: mật khẩu và token cũ dùng được (bảng `hoc_sinh` giữ nguyên).
- Ca thi: MỌI ca đã thi còn nguyên. `/ca/danh-sach`, `/goi danhSachCa`, `/hs/lich-su`, `/hs/ca-dang-mo` trả đúng như trước reset (điểm, lượt, bản đồ sai, tờ đáp án trong R2). BTVN và bài Mẹ giao thì trống.

## 5. Máy khách cần và không cần làm gì
- Cần dọn khi `mocReset` đổi (mục 1). Vì reset mới GIỮ hồ sơ mạnh yếu ở máy chủ, KHÔNG dọn những thứ chỉ là bản nhớ của hồ sơ mạnh yếu nếu app có: chúng vẫn đúng. Chỉ dọn thứ gắn với ca, BTVN, bài Mẹ giao, EXP, thú.
- Không cần đổi mã nếu máy khách chỉ so chuỗi `mocReset` với giá trị đã lưu (khác thì dọn). Sai nếu máy so với hằng `"2026-09-21"`.
