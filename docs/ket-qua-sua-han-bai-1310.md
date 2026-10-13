# Kết quả sửa hạn bài và cân đối kế hoạch — 13/10

Nhánh bổ sung `codex/sua-han-bai-1310`, sau khi Claude gộp/phát hành thuật toán đề2026 ở PR267. Không đẩy tiếp nhánh cũ. Giữ thiết kế thẻ đợt20, metadata D1 và bước chuyển lịch/bật cờ của Claude.

- Sửa hạn bài/lớp bằng receipt/CAS trong batch nguyên tử; giữ sổ gặp, lời chữa, lỗi, điểm, phiên làm dở. Lần mở sảnh/chặng tiếp tính lại theo phần chưa gặp của từng em. Cron và em mới giữ hạn mới. Ngày không thật/quá khứ, bản cũ, bỏtick và ca mở bị chặn.
- Tổng quota câu mới ngày1kiểm tra không vượt12 trên mọi gói; ưu tiên bài mới còn hạn trước nợ cũ. 127/164câu vẫn chia hết trong7ngày ở các lịch mô phỏng khi em theo kế hoạch/nguồn hợp lệ. Nợ thật vẫn giữ nếu không đủ thời gian/lượt học.
- Phép chia lịch tính số ngày trực tiếp và chỉ duyệt lịch kiểm tra; đối chứng108trường hợp lịch cũ/mới, hạn xa đến9999-12-31 tính dưới50ms trong kiểm.
- Giữ cổng3đề trongmọi7ngày theoSBD cả khi đổi lớp; cho_nguon được hồi phục khi nguồn đủ dù ngày chu kỳ đã tới. Khi cờ tắt, có thể chuẩn bị lịch tương lai mà không chấm bài bịẩn/phát chu kỳ mới. Mốc bật cờ ngăn tự chấm những hạn đã qua trong thời gian tắt.

Cổng đo trên bản đã gộp main267: TS trước/sau build đạt, serverTS đạt; tốc độ tải3app/đợt chờD1 đạt0đỏ, không nâng mốc; SW13/13,169tệp/2733KiB; màu mới0/màu giữ0. Chromium390×844,844×390,1440×1000 ×sáng/tối:0lỗiJS,0tràn,0vùng chạm<44px; lưu quaAPIgiả thành công. Ảnh thật ghi rõ dữ liệu minh họa ởban-ve-sua-han-1310.

Kiểm liên quan12tệp:181đạt/1đỏ sau gộp; lỗi do bản giả đổi snapshotversion1 nhưng giữmetadataversion3. Đã sửa bản giả khớp đề/meta thực tế, giữ truy vấn metadata củaClaude; chạy lại10/10đạt. Tổng182kiểm liên quan không còn lỗi. Các kiểm màn ca làm lại tuần tự cùngCLItestTimeout15000:main36 vànhánh11/11đạt, không sửa test/độ khó/ngưỡng tốc độ ca.

Full đầu đối chiếu main36f392fe:15511đạt/146đỏ;nhánh15538đạt/146đỏ.4tên khác:3hết sau kiểm lại cùnglệnh trên cả2bên;1timeoutmànca hết11/11 ở cả2bên khi chạy tuần tự. Không gọi fullxanh. Full sau gộp main267 e8c3e2ab: main15522đạt/156đỏ, nhánh15530đạt/156đỏ.9tên khác biệt kiểm lại cùnglệnh trên cả2bên173đạt/7đỏ;6đỏ cùngtên cósẵn,1timeoutmànca kiểm lại tuần tự. Không bỏtest/nângngưỡng tốc độ. Sau full bổ sung kiểm xác nhận lưu hạn:52/52đạt (không báo thành công giả khi máy chủ chưa xác nhận).

Nguồn thật: mô phỏng chỉSELECT/WITH Actions38360174317 trên mộtđại diện/lớp, khối10 35/35,khối11 44/44,khối12 52/53. Khối12 còn thiếu câu đủ cổng nguồn/phạm vi/ma trận để phủnen:gia_tri_trung_binh; không đồng nghĩa kho không có câu gắn nhãn này, không tự duyệt nguồn. Đây là độphủ dự kiến, không chứng minh mọi em đã thành thạo/đạt điểm.

D1: bản sửa hạn chưa áp dụng vào dữ liệu thật. Claude phụ trách bật cờ qua workflowbat-lai-ktcn-1310 theo main267; không bật SQLtay. Không thay luật chấm điểm/ca chính thức. PR bổ sung chờ Claude soát rồi phát hành theo điều phối.
