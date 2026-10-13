# Bản vẽ đợt 20 — Kiểm tra ôn tập (thẻ ở Hôm nay + màn làm bài) · 13/10/2026

Thầy dặn: "thiết kế chỗ này cho đẹp mịn, thân thiện, xem cả màn làm bài kiểm tra của phần này của học sinh thiết kế lại đỉnh đẹp tối ưu thân thiện. Vẽ cho tôi xem trước khi duyệt build".

Bản vẽ ở `kiem-tra-on-tap.html`. Ảnh Chromium thật nằm trong `anh/`, chụp bằng `node scripts/chup-ban-ve-dot20.mjs`. Số liệu trong ảnh là số GIẢ. Chưa sửa `src/`.

## Có gì mới so với bản đang chạy
| Chỗ | Bây giờ | Bản vẽ |
|---|---|---|
| Thẻ "Đang chuẩn bị" (ảnh thầy gửi; 172/261 em đang ở trạng thái này) | Thẻ to choán cả bề ngang, một câu chữ trơn | Thẻ mỏng màu vàng dịu đặt cạnh khối Học tiếp: em biết việc hôm nay vẫn là học thường. Có thanh "Phần kiến thức đã có câu kiểm tra 42/60". |
| Ngày kiểm tra | Ba số trơn + thanh `progress` mặc định | Vòng tiến độ "5/18 đã trả lời" + 3 dòng có biểu tượng (chặng · phút · hạn nộp) + đúng 1 nút chính "Làm tiếp · còn 13 câu". Máy tính: 2 cột. |
| Sắp đến | Chữ "Mở … · hoàn thành trong 24 giờ" | Tờ lịch "TH 7 · 17 · Tháng 10", "còn 4 ngày", 3 ô số có nhãn. Không đếm ngược từng giây. |
| Đã nộp / hết hạn | Một dòng điểm | Huy hiệu xanh / đồng hồ xám, điểm cỡ lớn, số câu đúng, nút Xem kết quả |
| Trang bài | Lưới nút "Làm chặng N" | Lộ trình chặng (đã chốt ✓ · đang làm còn 7:42 · chưa mở 🔒). Hai ô tách rõ **hạn nộp cả bài 24:00** và **giờ riêng từng chặng** (hợp đồng đòi phân biệt hai thứ này). |
| Làm chặng | Thanh trên chữ + đồng hồ số | Đồng hồ vòng (chuyển đỏ `--gap` khi còn dưới 1 phút) · chấm xanh câu đã trả lời · "Đã lưu" cạnh tiến độ · thanh đáy cố định "Câu trước / Câu tiếp theo". Máy tính: cột phải có đồng hồ lớn + lưới câu. Ngang: lưới câu bên trái. |
| Nộp bài | `window.confirm` của trình duyệt | Tấm xác nhận trong app: "Còn 3 câu chưa trả lời", liệt kê từng câu bấm để quay lại, hai nút "Làm tiếp" / "Nộp bài" |
| Kết quả | Bảng 3 cột | Vòng điểm, "15/18 câu đúng", mỗi bài hai thanh "Đã kiểm tra" / "Đúng lần này", bộ lọc "Cần ôn lại · 3", danh sách câu bấm xem lời giải |

## Nguồn số (đều có sẵn trong `TomTatKiemTra` / API kết quả, không thêm lệnh máy chủ)
- Thẻ: `tong`, `daTra`, `soChang`, `phut`, `soBai`, `hanLuc`, `moLuc`, `lyDo`, `diem`, `nopLuc`, `trangThai`.
- Thanh "phần kiến thức đã có câu" = `phuDe` / `tongKienThuc`.
- Lộ trình chặng: `chang[]` (`daChot`, `han`, `soCau`, `giay`) từ `hoc-tap-ktcn-trang-thai`.
- Kết quả: `ketQua.bai[]`, `ketQua.cau[]`.

## Cần chốt khi dựng (chưa vẽ thành luật)
1. Dòng "đã trả lời 2/6" của từng chặng: `chang[]` hiện chưa có số này. Có hai cách:
   - bỏ dòng này;
   - thêm trường chỉ-thêm vào `hoc-tap-ktcn-trang-thai`, đếm từ `tra_json` đã đọc sẵn, không thêm lượt D1.
2. "Chặng 3 · Chưa mở — mở được khi chặng 2 đã chốt": hợp đồng ghi "chỉ một chặng mở". Phải kiểm lại máy chủ trước khi dùng câu này.
3. Hỏi lại khi nộp chặng còn câu trống: đây là hành vi MỚI, chỉ hỏi khi còn câu trống.
4. Thẻ "hết hạn": câu "App đã tự chốt các câu em đã lưu" khớp `chotKtCn(…, true)` của cron. Phải kiểm lại trước khi dùng.

## Làn
Thẻ và màn này thuộc làn Codex (`TheKiemTraCaNhan`, `ManKiemTraCaNhan`). Sau khi thầy duyệt có hai cách dựng:
- Claude dựng: ghi Nhật ký "định sửa" và thêm test khoá luồng như `tests/ph-kiem-tra-dot19-1310.test.tsx`.
- Giao Codex qua `docs/viec-giao-codex.md`.
