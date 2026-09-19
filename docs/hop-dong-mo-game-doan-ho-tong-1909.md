# Hợp đồng: MỞ GAME "ĐOÀN HỘ TỐNG" từ ngoài (Bảng nhiệm vụ, thông báo, thẻ việc…)

Người viết: Code 5 - Game (19/09/2026). Người dùng: Code 2 (cổng học sinh). Code 5 KHÔNG sửa tệp của Code 2.

## Cách mở (chọn MỘT trong hai, kết quả như nhau)

**Cách A — không đổi prop nào (khuyên dùng):** trước khi chuyển sang tab thần thú, đặt một khoá sessionStorage rồi mở tab như đang làm:
```ts
import { KHOA_MAN_DAU } from '../game/than-thu-v2/Game' // = 'game-v2:man-dau'
try { sessionStorage.setItem(KHOA_MAN_DAU, 'doan') } catch { /* máy chặn lưu: game vẫn mở, ở màn Đảo thần thú */ }
setTab('thanthu')
```
Game đọc khoá MỘT lần lúc dựng rồi tự xoá (mở lại tab lần sau về Đảo thần thú như cũ). Không import được hằng số thì dùng thẳng chuỗi `'game-v2:man-dau'` / giá trị `'doan'`.

**Cách B — prop:** `<ThanThuHoaHocGame manDau="doan" … />` (mặc định `'home'`). Chỉ có tác dụng lúc component được dựng.

## Em thấy gì
- Đã chọn thần thú → vào thẳng **Sảnh Đoàn Hộ Tống** (lớp phủ toàn màn). Đang có chặng dở (tải lại trang, đổi tab) → tự mở lại đúng chặng ấy.
- CHƯA chọn thần thú (mọi em sau reset 00:01 thứ Hai 21/09) → màn **Chọn bạn đồng hành** của game, phía trên có lời mời: "Đoàn Hộ Tống đang chờ em. Em chọn một thần thú để cùng cả lớp hộ tống Linh Tâm — chọn xong là lên đường được ngay." Chọn xong → vào Sảnh, không phải bấm thêm gì. Không có thông báo lỗi nào.
- Chưa đăng nhập game (chưa có phiên game trên máy) → ô nhập mật khẩu của game như cũ, xong thì vào Sảnh.

## Về lại Bảng nhiệm vụ
Nút chính ở màn Kết chặng là **"VỀ BẢNG NHIỆM VỤ"** → gọi đúng prop `onDong` mà cổng đang truyền cho game (hiện là `() => setTab('diem')`). Muốn về đúng Bảng nhiệm vụ thì Code 2 chỉ cần để `onDong` trỏ về tab ấy — game không biết tên tab của cổng.

## Tên gọi giữ nguyên (0.Planer dặn, dùng cho cả nhãn nút phía cổng)
"Đoàn Hộ Tống" · "Linh Tâm" · "Tiếp sức" · "Liên Kích" · "Trùm lớp". Nhãn nút gợi ý: **"Lên đường cùng Đoàn Hộ Tống"**.

## Dữ liệu hiển thị ngoài game (ấn thạch, hào quang, danh hiệu, trạm Đoàn lớp)
Chưa có — thuộc bước 5 và 6. Khi có, Code 5 gửi hợp đồng riêng (một lệnh đọc-chỉ, máy chủ chưa trả thì ẩn, không bịa số).
