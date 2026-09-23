# Code 3 — giảm số lệnh D1 khi đồng bộ thông báo (23/09)

## Kết quả

`syncNotices` trước đây đọc các bài đang mở, rồi gọi `INSERT OR IGNORE` riêng cho từng thông báo và từng nhắc hạn. Mỗi lần học sinh mở danh sách thông báo lại lặp các lệnh ghi, kể cả khi mã thông báo đã tồn tại. Báo cáo D1 ngày 21/09 (`docs/do-tai-d1/2109.md`) ghi nhận họ `INSERT OR IGNORE student_notice` từng chạy khoảng 234 nghìn lần/ngày trước các đợt giảm tải khác.

Đã thay vòng lặp bằng **một** `INSERT OR IGNORE ... SELECT` dùng CTE `tasks`. Nhánh theo học sinh vẫn đặt `sbd=?` trực tiếp trong cả `btvn_em` và `mom_bai`, cho phép dùng các chỉ mục `idx_btvn_em` và `mom_bai_student_date`. Nhánh cron không có `sbd` vẫn xử lý toàn trường. Thông báo sắp hết hạn được tạo trong cùng lệnh bằng `julianday`, giữ ngưỡng `0 < thời gian còn lại ≤ 1 giờ`.

| Mẫu SQLite cục bộ | Trước | Sau | Số thông báo |
| --- | ---: | ---: | ---: |
| Một học sinh: 40 bài thầy giao, 10 bài luyện, 20 bài trong giờ cuối | 71 lệnh DB | 1 lệnh DB | 70 |
| Cron hai học sinh, dữ liệu gấp đôi | 141 lệnh DB | 1 lệnh DB | 140 |

Đây là số lệnh thật do D1 giả gửi tới SQLite, đo trong `tests/notifications-hieu-nang-2309.test.ts`. Không suy diễn thành số mili giây hay mức giảm tải D1 sản xuất: bài kiểm tra không có độ trễ mạng và không chạy trên D1 từ xa. Khi không có bài, đường cũ và mới đều dùng một lệnh.

## Bảo toàn hành vi

- Đối chiếu toàn bộ `id`, `sbd`, tiêu đề, nội dung, đích và `read_at` giữa thuật toán cũ và mới trên cùng bộ dữ liệu. Một học sinh không nhận thông báo của học sinh khác.
- Quét lại không sinh trùng và không xoá dấu `read_at` đã ghi. `INSERT OR IGNORE` cũng giữ `created_at` của bản ghi cũ.
- Các bài đã nộp/thu hồi tiếp tục bị loại ở bước gửi push; kiểm thử `notifications-delivery` vẫn đạt.
- Kiểm thử `EXPLAIN QUERY PLAN` hiện có xác nhận hai nhánh theo `sbd` dùng chỉ mục; truy vấn mới đã chạy thực sự trên `node:sqlite`, không chỉ so chuỗi SQL.

## Kiểm tra

`npx vitest run tests/notifications-hieu-nang-2309.test.ts tests/notifications-delivery.test.ts tests/chi-muc-ke-hoach-2109.test.ts`: 14/14 đạt. `npx tsc --noEmit -p server/tsconfig.json` và `npx oxlint server/src/notifications.ts tests/notifications-hieu-nang-2309.test.ts` đạt.

Không chạy tải trên production, không ghi DB thật, không deploy. Thay đổi giới hạn ở `server/src/notifications.ts` và bài kiểm tra mới; các file đang có thay đổi trước đó được giữ nguyên.

## Review độc lập phần kết nối và chấm điểm của Code 1

Review chỉ đọc file Code 1, thêm hai bài kiểm tra riêng. Kịch bản thực thi `tests/review-cham-ket-noi-2309.test.ts` đã xác nhận luồng phương án I và ý II xáo nhưng lưu theo thứ tự gốc, rồi chấm qua `gradeFromKeyBank` và dựng chi tiết bằng `taoChiTietCau`: cả 3 câu đúng, 10 điểm, không có danh sách câu sai. Đáp án số dùng dấu trừ Unicode và dấu phẩy cũng khớp với số em nhập bằng dấu trừ thường và dấu chấm.

Ba lỗi có tái hiện, đã gửi Boss để chuyển Code 1 xử lý; Code 3 không sửa file thuộc vùng của Code 1:

1. `scorePhanIII` nhận khóa rác `abc` và câu trả lời `abc` là đúng, cho điểm, thay vì báo khóa Phần III sai cấu trúc (`tests/review-cham-ket-noi-2309.test.ts`).
2. `saveScriptUrl('https://teacher-selected.test')` ghi khóa `scriptUrl`, nhưng `loadScriptUrl()` bỏ qua khóa vừa lưu và trả URL fallback. Ô “Địa chỉ máy chủ” trên màn Cài đặt vì vậy không điều khiển địa chỉ dùng sau khi bấm Lưu (`tests/review-ket-noi-2309.test.ts`).
3. `gradeMom` dùng `'A'` làm khóa mặc định khi câu trắc nghiệm không có `dapAn`/`dapAnDung`; bài làm chọn A được tính đúng. Dữ liệu Mom mới có bước lọc câu, nhưng bản lưu cũ hoặc hỏng vẫn có thể đi vào hàm chấm (`tests/review-cham-ket-noi-2309.test.ts`). `questionOutcomes` và dòng ghi sổ trong cùng module cũng dùng khóa mặc định này nên cần xem cùng một lần sửa.

Ở thời điểm review, test chấm có 1 đạt/2 lỗi có chủ đích; test kết nối có 1 lỗi. **Chưa chạy toàn bộ bộ test/build** vì các agent đang sửa đồng thời; Code 3 nhận trách nhiệm chạy một lần kiểm tích hợp sau tín hiệu của Boss. Xem `docs/kiem-tra-tich-hop-2309.md`.
