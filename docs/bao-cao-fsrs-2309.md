# Lịch ôn FSRS — bàn giao 23/09/2026

Đã thay lịch cố định 1/3/7 của hồ sơ ngày bằng FSRS-6 thực (`ts-fsrs` khóa phiên bản 5.4.2). Đường chạy: `lapVaLuuKeHoach` → `dungLaiHoSo` → `phatLaiSuKien` → `lich-on-fsrs` → `nam_kt_cau.moc_on_ke`. Kế hoạch nhận câu đúng chưa từng sai khi tới hạn, cả khi đọc D1 lẫn dùng hồ sơ vừa dựng trong bộ nhớ. Bộ lọc dạy lại vẫn loại `can_day_lai` khỏi hàng ôn tự động.

## Chính sách và giới hạn

- State riêng từng học sinh × qid, tái dựng từ sổ đã đọc sẵn; không thêm cột/bảng, không sửa sổ hay điểm cũ, không thêm truy vấn theo từng câu.
- Sai đã chấm → Again; đúng đã chấm → Good. Không suy luận Easy/Hard từ tốc độ. Bỏ trống không đưa vào FSRS, không cộng số sai. Nếu chưa có kết quả nào, hẹn thử lại ngày sau lần trống đầu tiên; bỏ trống tiếp không hoãn lịch mãi.
- Lịch ngày VN: tối đa một quan sát FSRS/ngày/câu. Nếu có sai trong ngày thì dùng Again trên state trước ngày đó, tại timestamp quan sát đầu tiên; các lần đúng sau không nâng mốc thêm. Đây là chính sách chống lặp dồn áp trên FSRS, không phải replay mọi attempt như flashcard nguyên bản.
- Nhãn `da_khac_phuc`, số ngày đúng và `can_day_lai` giữ luật sư phạm riêng; không gọi stability là “đã nắm chắc”.
- Fuzz và học lại vài phút tắt; mức nhớ mục tiêu mặc định 0,90. Cấu hình tập trung `CAU_HINH_FSRS`; replay nhận `retention` cho kiểm thử/so sánh. Khi đổi cấu hình triển khai phải tăng `PHIEN_BAN_KE_HOACH` để hồ sơ cũ được dựng lại. Không huấn luyện tham số cá nhân khi chưa đủ bằng chứng.
- Timestamp hợp lệ là nguồn ngày VN; dữ liệu ngày ghi sai được chuẩn hóa trong bản replay, sổ nguồn giữ nguyên. Bỏ timestamp không hợp lệ và sự kiện sau giờ dựng. Khóa sự kiện trùng không tính hai lần. Hàm thuần không đọc đồng hồ hay số ngẫu nhiên.
- Kho lịch dùng qid, chưa gộp các qid tương đương thành một FSRS card. Chống trùng nội dung thuộc selector game, do Code 2 phụ trách.

## Chuyển đổi hồ sơ cũ

`PHIEN_BAN_KE_HOACH` tăng từ 1 lên 2. Truy vấn fingerprint lấy thêm `phien_ban`; sổ không đổi nhưng version cũ vẫn dựng lại. Chỉ lưu version/số sổ mới sau replay thành công; thất bại giữ dấu cũ để lần sau thử lại. Dữ liệu đã dựng đúng thì giữ cơ chế chỉ ghi dòng khác, không xóa rồi chèn toàn bộ.

Fingerprint đếm sự kiện tới thời điểm máy chủ, nên log tương lai không bị phát lại trước giờ và sẽ tự làm fingerprint đổi khi tới giờ. Bộ đệm RAM được nạp lại khi Worker đổi mã; hàng đã lưu trong D1 được chuyển lười ở lần lập kế hoạch/cron kế tiếp, không tuyên bố đã chuyển toàn bộ dữ liệu thật. Ngày đã chốt vẫn không bị ghi đè; nếu bản kế hoạch cũ của ngày đã chốt chưa đổi được version thì có thể replay thêm lần trong ngày đó, sang ngày mới sẽ đóng dấu mới. Không chạy migration/deploy trên production.

## Kiểm chứng

Lệnh: `npx vitest run tests/lich-on-fsrs-2309.test.ts tests/ho-so-nam-kt-1909.test.ts tests/ho-so-cap-nhat-doi-2109.test.ts tests/ke-hoach-ngay-1909.test.ts` — **90/90 đạt**, gồm 11 test mới. `npx tsc -p server/tsconfig.json --noEmit` đạt; oxlint các file sửa đạt; `git diff --check` đạt.

Test mới đối chiếu mốc với API `fsrs.next` chính thức, đổi khoảng cách thực/retention, chống spam cùng ngày, sai ưu tiên, bỏ trống, duplicate, hai em, ranh giới ngày VN, không đồng hồ/random, tương lai, migration khi số sổ không đổi, retry khi replay lỗi, câu chưa từng sai tới hạn và hai đường SQL/bộ nhớ. Assertion lịch cũ được cập nhật đúng mốc FSRS, vẫn giữ kiểm tra trạng thái/đếm. Fixture ghi sự kiện sau giờ dựng được sửa giờ dựng cho hợp lý vì giờ đây không phát lại tương lai.

## Đo CPU cục bộ

Workload tổng hợp: 10.000 log = 20 em × 50 qid × 10 ngày (01–10/09/2026 lúc 03:00Z), mỗi cặp em/qid 10 lần, kết quả sai khi `(ngày + chỉ số qid) % 5 == 0`, còn lại đúng, cùng mã dạng và 60 giây/câu. Đo toàn `phatLaiSuKien` với `performance.now`, xác nhận 1.000 dòng câu đầu ra. So với hàm lịch cố định đọc từ Git HEAD `ab7b745`, cùng Node/Vitest/máy, một lượt đầu và trung vị 7 lượt tiếp theo. File benchmark/baseline tạm đã xóa sau đo.

| Lượt | Lịch cố định | FSRS |
|---|---:|---:|
| Đầu tiên | 17,36 ms | 44,85 ms |
| Trung vị 7 lượt | 13,39 ms | 33,99 ms |

FSRS thêm khoảng **20,60 ms/10.000 log**, CPU khoảng 2,54 lần lịch cố định ở workload này. Đây là chi phí cho lịch thích nghi, không phải tối ưu CPU so với cộng ngày đơn giản. Không thêm SQL/N+1; vẫn chỉ replay khi version/sổ đổi và chỉ ghi dòng khác. Phép đo không gồm độ trễ mạng D1, không phải benchmark Worker production, chưa đo tác động dài hạn đến số câu ôn và kết quả học.

## Nguồn

- [ts-fsrs chính thức](https://github.com/open-spaced-repetition/ts-fsrs): FSRS-6, API `next`, tham số retention/fuzz/short term; đã kiểm README và type definitions của gói 5.4.2 cài từ npm.
- [SRS benchmark](https://github.com/open-spaced-repetition/srs-benchmark): cơ sở chọn họ thuật toán để dự đoán nhớ trên log flashcard; không chứng minh tối ưu mọi bài Hóa.
- [Nghiên cứu ôn thích nghi](https://pmc.ncbi.nlm.nih.gov/articles/PMC6028005/): cơ sở xem xét lịch theo người học/kết quả/thời gian.

Không khẳng định “tốt nhất thế giới”. Trước khi điều chỉnh retention hoặc huấn luyện weights, cần theo dõi tỉ lệ trả lời đúng khi tới hạn, tải ôn và độ phủ phần đã học.
