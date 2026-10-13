# Đề Hóa 2026 và kế hoạch học nhẹ — bàn giao Claude

Thầy chốt ngày 13/10: đề theo cấu trúc thi thật 2026, phủ kiến thức đã dạy, tối đa 3 kiểm tra/tuần và 2/ngày; ngày một kiểm tra vẫn giao tối thiểu 12 câu riêng, giữ câu mới. Văn bản này cập nhật các đoạn tương ứng trong hợp đồng kiểm tra 1310 cũ.

## Đề và lịch từng em

- Mỗi đề: 18 TN, 4 ĐS, 6 TLN; 28 câu, 50 phút; thời hạn nộp 24 giờ VN. Mức độ đúng `MA_TRAN_HOA_2026` đang phân tích trong app từ bốn đề 2026; đây chưa phải tài liệu ma trận chính thức của Bộ.
- Phủ có ràng buộc từng ô phần × mức độ. Một đề phủ đủ thì chỉ một đề; chưa đủ thì thêm đề thứ hai, thứ ba chỉ khi tăng độ phủ. Không ép đủ ba bài cho mọi em. Tuyệt đối không thêm câu làm một đề dài hàng trăm câu.
- Lịch ưu tiên một đề/ngày (thấp hơn trần 2/ngày của thầy): hai đề cách 3 ngày; ba đề ở ngày đầu, +2 và +4. Chu kỳ kế tiếp bắt đầu không sớm hơn ngày đầu +7; có cổng ghi SQL chặn quá 3 đề trong mọi 7 ngày liên tiếp, kể cả retry/cron cùng chạy. Kho hiện có UNIQUE(sbd,ngay); bản này chưa mở khả năng hai đề cùng ngày. Nếu cần hai đề thật, phải bổ sung slot và hợp đồng API riêng, không gỡ unique trên dữ liệu thật.
- Ngày đầu riêng theo hồ sơ yếu/chưa đo, nhịp ngày học, half-life hợp lệ và tránh cuối hạn bài mới. Mỗi em dùng seed riêng; chọn câu ưu tiên phần yếu/chưa đo và nguồn chưa gặp nhưng không phá ma trận.
- Bản đã mở/bắt đầu/nộp giữ nguyên câu, phiên bản, thời gian và điểm. Làm mới chỉ lịch tương lai. Không phát thêm một chu kỳ khi các đề của chu kỳ đã bắt đầu còn chờ.

## Độ phủ và nguồn

Nền `nen:` toàn cục tính một lần; bài có bằng chứng đo riêng. Dạng được quy về cơ chế theo cây từ vựng thật chương → cơ chế → thao tác. Toàn bộ vi kỹ năng lá vẫn lưu trong `viKyNang` và sổ OMNI, không bỏ lá khó để tuyên bố đạt. `phuKienThuc` là số cơ chế/nền xuất hiện trong đề; `phuChuKy` là số trong cả chu kỳ; không đồng nghĩa đã tự làm, đã đúng hay vững lâu.

Nguồn tương đương phải đã duyệt, chỉ mục đúng phiên bản, đúng khối, toàn bộ kiến thức đã dạy, không tự luận/ca/BTVN/công tắc chặn. ĐS phải có ma trận nguyên câu hoặc đầy đủ bốn ý. Thiếu nguồn/ô ma trận → `cho_nguon`, giữ mẫu số và nhiệm vụ bài ngày, không giả 100%. Mô phỏng nguồn thật trước bản cuối: khối10 35/35, khối11 44/44; khối12 còn thiếu nguồn đã duyệt cho `nen:gia_tri_trung_binh` (52/53), chưa thể xác nhận phủ toàn bộ. Không tự duyệt bốn câu đang chờ duyệt.

## Bài mới và kế hoạch ngày

Đề version3 có `baiNgayToiThieu:12` chỉ-thêm trong snapshot, metadata và `TomTatKiemTra`. Học sinh vẫn thấy thẻ kiểm tra và kế hoạch ngày, cả hai nút hoạt động. Hành trình vẫn có nút học; phụ huynh thấy hai khối, thầy thấy số ngày 12 và kiểm tra tách riêng.

Quota câu mới chia theo sức chứa đến hạn: ngày thường trọng số 24, ngày một kiểm tra 12, ngày hai kiểm tra 0 (trong bản này lịch luôn giãn một/ngày). Ưu tiên câu chưa gặp, giữ nguyên hạn 7 ngày. Kế hoạch ngày kiểm tra chốt 12 câu, câu mới nằm trong 12; phần còn lại dành lỗi/ôn phù hợp. Không cộng 28 câu kiểm tra vào “đã làm/12”. Lượt tự làm hợp lệ trong kiểm tra vẫn được tính là đã gặp đúng phiên bản của câu gốc; không tính tải câu/lướt hay bỏ trống là đã tự làm/đã vững. Câu khó chưa sẵn sàng vẫn đi luồng học có hỗ trợ. Nếu em nghỉ học hoặc nguồn bị giữ, giữ nợ và báo đúng phần thiếu, không kéo hạn hay đánh dấu đủ giả.

Lịch version1/2 giữ hợp đồng cũ cho phiên đang làm. Version3 thay các lịch tương lai chưa mở. Hợp đồng cũ “ngày kiểm tra không có bài tập” được cập nhật cho version3 theo chỉ đạo mới của thầy.

## Câu sai, tốc độ và phát hành

Nộp kiểm tra ghi một receipt ổn định/câu đã trả lời đủ vào `su_kien_hoc`, nguồn game, purpose de_thu, assistance none. SRS/OMNI đọc lần làm thật đó; sai không bị xóa bởi việc nộp xong/xem chữa, phần đúng/sai giữ từng ý. Không tăng số câu đề đang làm sau một lỗi. Lỗi giữ trong vòng ôn/sửa và chỉ được đóng qua bằng chứng kiểm chứng của động cơ hiện có. Bỏ trống không tạo bằng chứng thành thạo.

Giữ bản vá Claude: `kiem_tra_ca_nhan_meta`, snapshot+meta cùng batch nguyên tử, `COT_META_KT` đường nóng chỉ bóc JSON nhỏ, `buMetaKt` cron. Đọc lịch Gói7 song song câu/sổ/quota. Chuẩn bị lúc phát hành chỉ một lô nhỏ; không 500 vòng quét toàn học sinh. Script bật lại cờ chặn lịch tương lai chưa chuyển về 28/50.

Cờ kiểm tra đang tạm tắt sau sự cố D1. PR này chưa bật cờ/chưa phân lại D1 thật; mô phỏng chỉ SELECT. Gộp sau Claude soát, không phát hành chồng với main đang chạy; chưa thể bật toàn bộ nếu nguồn đã duyệt còn thiếu. Tắt cờ là cách lùi, giữ lịch/bài nộp/điểm/sổ.
