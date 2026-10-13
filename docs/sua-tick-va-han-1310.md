# Tick bài và sửa hạn — 13/10/2026

Thầy yêu cầu tải ổn định, lưu hạn từng lớp tại chỗ và sửa hạn hàng loạt. Bản sửa giữ bảng và màn hiện tại trong suốt lúc lưu; chỉ báo **Đã lưu** sau khi máy chủ xác nhận đúng gói/ngày. Refresh thất bại giữ dữ liệu cũ và báo chưa cập nhật, không biến thành số 0.

## Hợp đồng chỉ-thêm

- `POST /gv/goi-bai-7`, `action: 'tong_hop'`: `{ ok, bat, goi, thongKe }`; `thongKe[goiId] = { soEm, pGap, pTuLam }`. Đếm gốc phân biệt đã gặp/tự làm, đúng phiên bản gói; không trả đề/câu trả lời/JSON câu hỏi. Một API tổng hợp: metadata nhẹ rồi chỉ thống kê tối đa 12 dòng đang hiển thị, không 1+N gọi theo lớp hoặc quét các bài cũ đang ẩn. `caCu:true` đọc thống kê bài quá hạn khi thầy mở bộ lọc. `serverNow` là số mili-giây máy chủ, dùng cùng ngày Việt Nam để chọn dòng, hiển thị hạn và giới hạn ngày nhập.
- `action: 'sua_han'` giữ `{ goiId, han, hanCu }`; trả xác nhận `goiId/han`.
- `action: 'sua_han_hang_loat'`, `{ goi: [{ goiId, hanCu }], han }`: máy chủ kiểm mọi dòng, cập nhật nguyên tử và trả `ketQua: [{ goiId, han, ok: true }]`. Một dòng đã đổi, không còn tick hoặc có ca thi mở: từ chối toàn lượt, không ghi một phần.
- Hạn là hết ngày Việt Nam. Đổi hạn tính lại quota các gói theo phần còn thiếu và lịch kiểm tra; không xoá tiến độ, lượt làm, bài đang làm hay đề kiểm tra đã phát hành.

## Nghiệm thu

1. Bấm Lưu hạn trên màn dạy học thật: không điều hướng, giữ bảng và vị trí cuộn; đúng dòng hiện Đã lưu.
2. Chọn nhiều lớp, lưu một ngày: xác nhận đủ từng dòng. Lỗi/stale giữ ngày và lựa chọn để sửa lại.
3. Tải ban đầu và Cập nhật dùng số liệu tổng hợp; refresh thất bại có thử lại, giữ số gần nhất và phân biệt dữ liệu cũ.
4. Đổi tài khoản/nguồn không lấy đệm tài khoản khác; lời đáp đến muộn không ghi đè ngày vừa lưu.
5. Thời hạn chờ gồm cả đọc body JSON, không treo vô hạn sau khi đã nhận headers.
6. TS/test/build/tốc độ/màu/SW theo hợp đồng; so toàn bộ test theo tên với main; xác nhận Worker/Pages cùng commit sau phát hành.

## Lượt sau 00:00 ngày 14/10

Agent rà soát từng làn độc lập, root soát/gộp. Chỉ bỏ mã game/chiến dịch cũ sau khi kiểm tra các điểm vào và tham chiếu; `game-v2` chứa lõi học tập nên không xoá theo tên. Không xoá D1, R2 hay lịch sử học thật. Đo số byte mở app, số lượt đọc/vòng chờ D1 và tốc độ thao tác trước/sau, báo phạm vi đã rà và phần chưa xác minh.
