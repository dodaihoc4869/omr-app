# Hợp đồng: sổ «mời ra khỏi lớp» của buổi live cho văn phòng (13/11)

Nguồn: thầy chuyển yêu cầu của Javis DDH 13/11 («app cần ghi lại mỗi lần một em bị mời ra và mở một đường cho văn phòng đọc»). Phiên app KHÔNG đọc được tệp `brains/DDH/viec-chung/live-1311/yeu-cau-cho-app-luat-moi-ra.md` (nằm trên máy văn phòng) ⇒ hợp đồng dưới đây do phiên app đặt theo kiểu các lệnh văn phòng đang dùng (`/gv/ai-ddh/*`). Tên đường / tên trường khác bản Javis đã soạn thì báo lại, phiên app đổi cho khớp.

## Ghi
- Luật rời màn (`docs/dac-ta-live-moi-1211.md` mục 47) vừa **mời ra** một em, thầy vừa **từ chối**, hoặc em **được vào lại** ⇒ phòng ghi MỘT dòng vào bảng D1 `live_moi_ra` (chỉ-thêm, tự tạo lúc ghi lần đầu). Ghi trong vòng ~1 giây, không chặn buổi live.
- App **không** tự nhắn phụ huynh. Dòng «Đã gửi thông báo cho phụ huynh» trên máy em chỉ đúng khi văn phòng nhắn theo sổ này.

## Đọc
`POST https://omr.ttadodaihoc.workers.dev/gv/bpu/moi-ra` — xác thực bằng mã GV y như `/gv/ai-ddh/hang-cho` (đầu mục `x-ma-bi-mat`). Sai mã ⇒ 403.

Thân (JSON, mọi trường đều tuỳ chọn):

| Trường | Nghĩa |
|---|---|
| `sau` | số `moc` của lần đọc trước. Bỏ trống / 0 ⇒ lấy các dòng trong 24 giờ gần nhất |
| `toiDa` | số dòng tối đa, 1–200, mặc định 50 |
| `buoiId` | chỉ lấy một buổi |

Trả về: `{ ok: true, ds: [...], moc }`. Lần sau gửi `sau = moc`. Không có gì mới ⇒ `ds: []`, `moc` giữ nguyên.

Mỗi dòng trong `ds`:

| Trường | Nghĩa |
|---|---|
| `stt` | số thứ tự tăng dần (dùng làm mốc, cũng là khoá chống nhắn trùng) |
| `loai` | `ra` = em bị mời ra · `tu` = thầy từ chối, em không vào lại được tới hết buổi · `vao` = em được vào lại (thầy duyệt, thầy đổi ý, hoặc thầy tắt luật) |
| `sbd`, `ten`, `lop` | số báo danh, họ tên theo hồ sơ (không có hồ sơ ⇒ tên trong phòng), lớp |
| `lan`, `n` | số lần em đã rời màn hình và ngưỡng của luật lúc đó (chỉ có ở `ra`; loại khác = 0) |
| `luc`, `gio`, `ngay` | mốc ms, giờ Việt Nam `HH:MM`, ngày Việt Nam `YYYY-MM-DD` |
| `buoiId`, `phong`, `khoi` | mã buổi, tên phòng live, khối |

## Cách dùng gợi ý
- Hỏi 20–30 giây một lần, CHỈ trong giờ có buổi live (mỗi lượt hỏi là một lệnh đọc D1).
- Nhắn phụ huynh theo dòng `ra`. Dòng `tu` ⇒ nhắn thêm «Thầy không cho em vào lại buổi này». Dòng `vao` đến trước khi kịp nhắn `ra` không xoá việc em đã rời màn hình đủ số lần; văn phòng tự quyết có nhắn hay không.
- Số điện thoại / Zalo phụ huynh: văn phòng tra theo `sbd` ở sổ của văn phòng, app không trả.

## Chưa có
- Chưa có lệnh để văn phòng đánh dấu «đã nhắn». Cần thì thêm sau (`/gv/bpu/moi-ra-xong`).
- Chưa thử trên buổi live thật; đã thử bằng test máy chủ `tests/live-moi-ra-van-phong-1311.test.ts`.
