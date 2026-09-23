# Kiểm tra tích hợp 3 app — 23/09/2026

Đã tích hợp và kiểm tra cục bộ. Báo cáo hiện hành: [sửa ba app](bao-cao-hoan-thien-3-app-2309.md). Không còn trạng thái chờ các nhánh sửa đầu ngày.

## Kết quả

- Build production và TypeScript server đạt; diff không có lỗi khoảng trắng.
- 782/782 kiểm thử tập trung, 37 file, đạt (gồm các ca rút câu/Đoàn cập nhật theo phạm vi cá nhân và mức vừa sức).
- Chromium: màn lên bảng ở cả hai chế độ chờ bấm; 30 phút không tự gọi; thần thú/thẻ tên hiện sau khi bấm; không đồng hồ. Bảng tin thật 16/16 ca đạt.
- Kiểm tràn giao diện 96 cảnh đạt.
- Toàn bộ: lượt cuối 11.082 đạt, 83 lỗi, 1 bỏ qua. Sau sửa fixture độ khó trùm trong test cấm tự luận, file này chạy lại 32/32 đạt; tổng hợp 11.083 đạt, 82 lỗi, 1 bỏ qua. [Các kiểm thử còn đỏ](kiem-thu-con-ton-2309.md) vẫn được giữ, không skip để làm xanh bộ kiểm thử.

## Trạng thái phát hành

Chưa commit, push hay deploy Pages/Worker; chưa sửa dữ liệu học sinh thật. Kiểm tra công khai đã xác nhận cấu hình HTTPS và CORS của Worker phản hồi, chưa thay thế nghiệm thu một ca thi từ hai máy thật.

Workflow `.github/workflows/deploy.yml` phát hành Pages khi push main; Worker có cấu hình riêng tại `server/wrangler.toml`. Workflow hiện cho phép một số bước kiểm tra tiếp tục khi lỗi, nên trạng thái deploy thành công không chứng minh mọi test đạt. Không thực hiện phát hành trong lượt này.
