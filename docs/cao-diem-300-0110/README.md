# Cao điểm 300 học sinh — 01/10/2026

Yêu cầu: tìm/sửa điểm nghẽn tốc độ, độ mượt và ổn định; thử 300 học sinh đồng thời; tự phát hành. Mục tiêu toàn app 5× phải có số đo, không cam kết khi chưa chứng minh.

## Bản mã và phép đo

- Trước: `652ea46400b7fe444ede794e8c132f2e98b0094b` (main đang phát hành; bao gồm sửa chuỗi ngày và khung lời giải).
- Sau: `3ff75f2f` (bản nguồn cố định `/workspace/omr-peak-v4`).
- Worker thực chạy bằng `wrangler dev --local`, D1/R2 hoàn toàn cục bộ, 300 tài khoản tổng hợp. Không gửi tải giả vào app thật.
- Độ trễ thêm: D1 40 ms/vòng, R2 30 ms/lượt. Runtime cùng máy; chạy trước/sau tuần tự, không chạy hồi quy nặng đồng thời. Nguồn đo giữ cố định để Wrangler không nạp lại giữa ca.
- Kết quả JSON đính kèm. p95 là thời gian tối đa của 95% lượt, gồm máy khách và runtime thử nghiệm; không phải số đo mạng học sinh ngoài thực tế. SQLite/RPC cục bộ có thể khác D1 thật.

## Thay đổi

1. Phòng chờ chỉ đệm ba trường trạng thái đã đọc xong (250 ms); không chia sẻ Promise I/O giữa request. Mỗi lượt dùng timer của mình, đợi hữu hạn rồi tự đọc lại nếu lượt chủ chậm/treo. Mở/đóng/bắt đầu/sửa ca bỏ đệm ngay, dùng Map mới để lượt cũ không lấp lại đệm đã xoá. Vào thi/lưu/nộp vẫn đọc/ghi chính xác tại D1.
2. Cờ cấu hình và danh sách chiến dịch cũng chỉ đệm giá trị hoàn tất; giữ TTL và móc bất hoạt cũ.
3. `gopDocD1` gộp SELECT độc lập trong một request game/hồ sơ, bao gồm lô chỉ đọc. Không có hàng đợi chung giữa các HTTP request. Các nhóm đọc độc lập chạy song song; ghi chờ đọc trước đó, đọc sau ghi chờ ghi xong. Lô ghi/CAS/`changes()` giữ nguyên. Bảng/cột phụ còn thiếu: batch đọc lỗi thì đọc từng câu để giữ fallback cũ. Nested game dùng lại wrapper của chính request.
4. Gói đề đang bảo vệ: chỉ dùng chung danh sách qid/nhóm đã chuẩn hoá, theo (bank_r2, cap_nhat_luc); không chuyển stream/Promise R2 giữa request. Giữ nguyên kiểm quyền, đệm phạm vi 5 giây, invalidation và lỗi fail-closed.
5. Lịch sử trước mốc sớm nhất vốn bị bỏ được lọc ngay tại SQL; vẫn xét mốc riêng từng câu. Gom lịch sử bằng push, tránh sao chép O(n²). Mùa + hồ sơ đọc tươi trong lô của chính request, không đệm vàng/hồ sơ/đáp án.
6. Khởi tạo bảng Bi-a nhớ trạng thái hoàn tất theo D1 gốc, kể cả khi mỗi request có wrapper khác nhau; không khởi tạo lặp từng lượt. Không dùng chung Promise I/O. Không thêm schema mới hoặc đổi luật/chỉ tiêu Bi-a.

## Kết quả cuối

| Game, 300 em đồng thời | p95 trước | p95 sau | Tỉ số |
|---|---:|---:|---:|
| Mở Sảnh | 16.951 ms | 13.532 ms | 1,25× |
| Vào Đảo | 13.349 ms | 12.025 ms | 1,11× |
| Chốt câu | 11.545 ms | 5.698 ms | 2,03× |

- Cùng kịch bản 901 yêu cầu: trước/sau đều 0 lỗi. Sau: đối chiếu D1 có đủ 300 em, mỗi em đúng một bản chốt.
- Vòng D1 tổng giảm 14.403 → 10.204 (−29,2%). Riêng chốt câu 14,58 → 6 vòng/lượt.
- R2 đọc 301 → 2 (giảm khoảng 150×), dung lượng 21,3 → 0,2 MiB. Không gọi mức giảm tải này là tốc độ toàn app.
- Lặp thử game khi bật tính năng Bi-a: 901 yêu cầu, 0 lỗi, đủ 300 bản chốt; p95 chốt câu 5.376 ms. Kịch bản này mở Sảnh rồi Đảo/chốt câu; không phải phép thử 300 trận Bi-a hoặc kết nối WebSocket đồng thời.
- Ca thi: 300 em vào đồng thời và nộp đồng loạt, 2.186 yêu cầu, 0 lỗi; đủ 300/300 bài, đáp án và thời gian từng câu khớp. Nộp lặp không đổi bài đã chốt; lưu sau nộp bị chặn. p95 nộp đồng loạt 2.906 ms trong phép thử cục bộ này.
- Test lịch sử tổng hợp 4.020 → 20 dòng cần đọc/truyền (201×); kết quả sau bằng chính tập lần làm còn hợp lệ của bản trước. Không suy ra mức này cho mọi tài khoản.
- Lần khảo sát đầu phát hiện lỗi sở hữu I/O/hung ở phòng chờ khi thêm độ trễ; native không thêm độ trễ không lỗi. Các lượt đo còn sửa mã/chạy hồi quy cùng lúc không dùng làm kết quả cuối (Wrangler có thể restart giữa yêu cầu).

## Giới hạn và vận hành

Đã giảm tải lớn và cải thiện đường chốt câu, chưa chứng minh toàn app nhanh/mượt/ổn định ít nhất 5×. Ca 300 đột ngột là phép thử hợp lệ, không phải bảo đảm SLA hoặc khả năng 5.000 em cùng làm. Không thay gói máy chủ/schema, không cần tăng chi phí cố định cho các thay đổi này. Chưa đo lại FPS trên điện thoại yếu; không suy ra FPS từ mức giảm truy vấn. Kiểm thực tế sau phát hành bằng log p95/lỗi của D1/Worker và thiết bị yếu; giữ bản lùi rõ ràng. Phép đo giờ cao điểm thực không thực hiện được từ workspace đang chặn miền Cloudflare.

## Hồi quy và phát hành

- Bản cuối: toàn bộ Vitest 13.131 trường hợp, 12.976 đạt, 127 đỏ, 28 bỏ qua. So TÊN với bộ nền `ed771f1c`: 127 tên thuộc nền, 0 tên đỏ mới, 6 tên hết đỏ; chi tiết `doi-chieu-hoi-quy.json`. Không tuyên bố toàn suite xanh.
- Kiểm chính trong toàn suite đều đạt: hồ sơ/SQL/bộ đệm Bi-a (5), phòng chờ (6), ca thi (22), ngưỡng chốt đáp án cũ (3). Không hạ ngưỡng kiểm tốc độ.
- D1 thật trong runtime workerd: 9 tệp / 95 kiểm tra đạt (chống ghi trùng, EXP, lưu/nộp, quyền và che đáp án).
- TypeScript Worker, build app, kiểm màu đạt. Service worker 13/13; 165 tệp / 2.988 KB, dưới trần hiện có 170 / 3.000 KB. Dựng ở worktree sạch, phục hồi nguyên byte `public/sw-version.json` sau build; không phát hành tệp dở.
- Đang chuẩn bị phát hành qua GitHub Actions từ commit gồm đúng bản nguồn `3ff75f2f` và tài liệu này. Chỉ xác nhận live sau khi cả Pages và Worker có log thành công.

Trước phát hành: `652ea464`, Pages `4921ae1d`, Worker `51a97eae-ceb5-4520-848f-97cf5571ebdb`, Actions `36795011208` thành công.
