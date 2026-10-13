# Kết quả sửa hạn bài và cân đối kế hoạch — 13/10

Nhánh bổ sung `codex/sua-han-bai-1310`, sau khi Claude gộp/phát hành thuật toán đề2026 ở PR267. Không đẩy tiếp nhánh cũ. Giữ thiết kế thẻ đợt20, metadata D1 và bước chuyển lịch/bật cờ của Claude.

- Sửa hạn bài/lớp bằng receipt/CAS trong batch nguyên tử; giữ sổ gặp, lời chữa, lỗi, điểm, phiên làm dở. Lần mở sảnh/chặng tiếp tính lại theo phần chưa gặp của từng em. Cron và em mới giữ hạn mới. Ngày không thật/quá khứ, bản cũ, bỏtick và ca mở bị chặn.
- Tổng quota câu mới ngày1kiểm tra không vượt12 trên mọi gói; ưu tiên bài mới còn hạn trước nợ cũ. 127/164câu vẫn chia hết trong7ngày ở các lịch mô phỏng khi em theo kế hoạch/nguồn hợp lệ. Nợ thật vẫn giữ nếu không đủ thời gian/lượt học.
- Phép chia lịch tính số ngày trực tiếp và chỉ duyệt lịch kiểm tra; đối chứng108trường hợp lịch cũ/mới, hạn xa đến9999-12-31 tính dưới50ms trong kiểm.
- Giữ cổng3đề trongmọi7ngày theoSBD cả khi đổi lớp; cho_nguon được hồi phục khi nguồn đủ dù ngày chu kỳ đã tới. Khi cờ tắt, có thể chuẩn bị lịch tương lai mà không chấm bài bịẩn/phát chu kỳ mới. Mốc bật cờ ngăn tự chấm những hạn đã qua trong thời gian tắt.

Cổng đo trên bản đã gộp main267: TS trước/sau build đạt, serverTS đạt; tốc độ tải3app/đợt chờD1 đạt0đỏ, không nâng mốc; SW13/13,170tệp/2726KiB; màu mới0/màu giữ0. Chromium390×844,844×390,1440×1000 ×sáng/tối:0lỗiJS,0tràn,0vùng chạm<44px; lưu quaAPIgiả thành công. Ảnh thật ghi rõ dữ liệu minh họa ởban-ve-sua-han-1310.

Kiểm liên quan12tệp:181đạt/1đỏ sau gộp; lỗi do bản giả đổi snapshotversion1 nhưng giữmetadataversion3. Đã sửa bản giả khớp đề/meta thực tế, giữ truy vấn metadata củaClaude; chạy lại10/10đạt. Tổng182kiểm liên quan không còn lỗi. Các kiểm màn ca làm lại tuần tự cùngCLItestTimeout15000:main36 vànhánh11/11đạt, không sửa test/độ khó/ngưỡng tốc độ ca.

Full đầu đối chiếu main36f392fe:15511đạt/146đỏ;nhánh15538đạt/146đỏ.4tên khác:3hết sau kiểm lại cùnglệnh trên cả2bên;1timeoutmànca hết11/11 ở cả2bên khi chạy tuần tự. Không gọi fullxanh. Full sau gộp main267 e8c3e2ab: main15522đạt/156đỏ, nhánh15530đạt/156đỏ.9tên khác biệt kiểm lại cùnglệnh trên cả2bên173đạt/7đỏ;6đỏ cùngtên cósẵn,1timeoutmànca kiểm lại tuần tự cùngCLI15000:11/11đạt ở cảmain267 vànhánh,0lỗi mới còn tái hiện. Không bỏtest/nângngưỡng tốc độ. Sau full bổ sung kiểm xác nhận lưu hạn:52/52đạt (không báo thành công giả khi máy chủ chưa xác nhận).

Nguồn thật: mô phỏng chỉSELECT/WITH Actions38360174317 trên mộtđại diện/lớp, khối10 35/35,khối11 44/44,khối12 52/53. Khối12 còn thiếu câu đủ cổng nguồn/phạm vi/ma trận để phủnen:gia_tri_trung_binh; không đồng nghĩa kho không có câu gắn nhãn này, không tự duyệt nguồn. Đây là độphủ dự kiến, không chứng minh mọi em đã thành thạo/đạt điểm.

D1: bản sửa hạn chưa áp dụng vào dữ liệu thật. Claude phụ trách bật cờ qua workflowbat-lai-ktcn-1310 theo main267; không bật SQLtay. Không thay luật chấm điểm/ca chính thức. PR bổ sung chờ Claude soát rồi phát hành theo điều phối.

Gộp tiếp main268/124208fb (Hỏi thêm Thầy), không bỏ cập nhật bên kia:202/202kiểm liên quan đạt. Cập nhật này làm cổng tải đỏ cả3app, đã tách mã khung lời giải và Hỏi thêm sang nạp khi dùng, giữ CSS/API/backend nguyên.110/110kiểm luồng sau tối ưu đạt; mộtkiểmHỏi thêm đợi tải bằngfindByRole thaygetByRole, ghi SỬA CÓ CHỦ ĐÍCH, khôngskip. Build/TS/serverTS/tốc độ/SW/màu0đỏ. TảiGV268,6KB/HS330,7KB/PH266,1KB, giảm3,9/2,6/3,3KBso mốc; hạ mốc đúng số đo275064/338686/272461byte, không nâng. SW170/13-13.


## Cập nhật 13/10 20:27 — thầy nhắc nút chưa xuất hiện

PR269 chưa được gộp nên bảng sống không có nút. Gộp main ec23546a (main tiếp theo5db64591 chỉ nhật ký). Giữ Hỏi Thầy mới: hộp thoại, trả lời có cấu trúc, mô hình3.1 và trần12/6. API Hỏi thêm giữ nguyên5tham số/dangLam/cauTruc, nạp cùng khung khi bấm; cầu nối tương thích bắt lỗi mất mảnh để không kẹt gửi.

Soát độc lập phát hiện hai gói cùng hạn cùng dự trù12chỗ ở ngày kiểm tra cuối; đã sửa dự trù chỗ chung theo hạn trên mọi ngày kiểm tra tương lai. Hai gói164câu: đủ328trong7ngày, ngày kiểm tra cuối tổng≤12. Nợ quá hạn không chiếm dự trù tương lai. Kiểm API/sổ thật trong kho thử và nhiều hạn/ngày2kiểm tra: goi7 31/31.

- Liên quan cuối:7tệp99/99. FrontendTS qua build, serverTS sạch.
- Full đối chiếu main ec23546a: nền15587đạt/138đỏ, nhánh15596/138;2tên chỉ đỏ ở nhánh và2chỉ đỏ ở nền. Chạy lại4tệp khác biệt cả hai: nhánh36/36, nền34/34; không còn lỗi mới tái hiện. Các sửa sau so full được kiểm lại trong7tệp99/99. Không tuyên bố toàn bộ đều xanh.
- Build/SW13/13:169mảnh,2727KiB. Màu0; tốc độ0đỏ, mốc lấy số nhỏ hơn từng mục, không nâng. Byte mở GV275987/HS338822/PH273115; nhẹ hơn main hiện tại276137/338986/273281.
- Ảnh6khổ trongban-ve-sua-han-1310 vẫn đúng bố cục sửa hạn (không đổi giao diện sau ảnh).
- Đo D1 chỉ đọc lúc19:53:10 cũ761/mới18;11 cũ528/mới99;ba lớp12 cũ899/mới164. Workflow38400669996. Tỷ lệ dự báo là sức chứa, không phải tiến bộ đã đo.

Không tự sửa hạn D1 của thầy; phát hành chỉ bổ sung nút và lệnh để thầy chọn hạn.
