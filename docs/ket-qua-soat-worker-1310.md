# Soát độc lập Worker và PWA — 13/10/2026

Nền: `main` 97300016. Làn: `/workspace/soat-worker-1310`.
Các thay đổi dưới đây sửa lỗi tái hiện trước 00h VN; chưa thực hiện dọn mã cũ hoặc tối ưu diện rộng. Không ghi D1 thật, không phát hành riêng, không đổi điểm đã ghi, ma trận đề hay luật xác thực hiện có.

## Lỗi tái hiện và bản sửa

| Lỗi | Bằng chứng trước sửa | Thay đổi | Commit |
|---|---|---|---|
| Đọc kho D1 cũ hồi sinh đệm sau khi thầy cập nhật | Hai trường hợp đọc trước/chen giữa ghi đều trả phiên bản cũ ở request kế | Đời đệm; xoá trước và sau ghi; không thêm D1 | `4e883209` |
| Cấp link PH không ràng buộc mật khẩu khi D1 lỗi | `parentPass` vẫn trả token không `pk` khi SELECT ném lỗi | Lỗi đọc thì không cấp; giữ em thật chưa mật khẩu và token legacy | `8faaa553` |
| Kho phiên bị chặn/đầy làm lỗi nạp mảnh lộ lỗi kho | Ba trường hợp SecurityError/QuotaExceededError | Không tự tải lại nếu không giữ được mốc chống lặp; hiện lời thử lại | `62656dff` |
| Em nộp sau ghi nguồn R2 vẫn nhận phiên bản trước | Harness lạnh: 1 R2get, request sau ghi nhận bản cũ | Bỏ flight/đệm và đổi đời riêng ca trước/sau `put`; giữ gom các lượt đọc lạnh | `bb06d3e6` |
| GET phiếu văng khi tự chữa đọc D1 hoặc ghi R2 lỗi | Hai GET `/phieu` trả 500 vì body đã bị đọc | Đọc text một lần; trả JSON gốc khi chữa lỗi; chỉ stringify một lần khi chữa thành công | `26ec63a3` |

R2 có năm vị trí ghi đã nối wrapper: `index.ts` (đẩy ca, nối đề riêng), `goi-cu.ts` (cập nhật tờ đáp án, nối kho ca), `key-bank-bo-sung.ts` (phục hồi tờ đáp án). Không đổi thứ tự thao tác hay cách hợp nhất đáp án. Luồng xóa kho cũ chưa thay đổi; cần kiểm riêng khi có yêu cầu thao tác đó.

## Kiểm đã chạy

- D1 đọc/đệm/quá tải: 5 tệp, 27/27.
- Token PH + legacy + em không mật khẩu + auth đệm: 3 tệp, 26/26.
- PWA fallback/kho phiên/không tự huỷ SW: 5 tệp, 73/73.
- R2/ca thi/đáp án: 4 tệp, 51/51. Có 300 lượt lạnh cùng ca chỉ 1 R2get; flight ca khác vẫn dùng chung; request cũ không đè request mới; ghi thất bại không giả thành đã ghi; `capNhatKeyBank` thật được kiểm.
- Phiếu/không lộ đáp án: 3 tệp, 31/31. Có kiểm tự chữa thành công vẫn chỉ ghi 1 R2, không đổi `chi_tiet_cau`.
- Cổng bốn lệnh nóng: 1/1, không vượt mốc số đợt chờ D1.
- TypeScript frontend và server sạch ở các lượt kiểm tương ứng. Root cần kiểm lại bản tích hợp cuối, build/byte/màu/SW và so toàn bộ test theo tên với main.

Số tệp kiểm ở các lượt trên có trùng nhau, không cộng thành số tệp riêng biệt. Test D1 chạy SQLite trong bộ nhớ; test R2 dùng mô hình bất đồng bộ và stream thật của Node. Chưa đo p95/p99 production hoặc tải đồng thời trên Cloudflare thật; không coi các phép kiểm này là bằng chứng mức tải thực tế.

## Rà phạm vi nguồn và hướng tối ưu sau 00h

Đã soi luồng/đoạn nóng của 31 tệp nguồn; không tuyên bố đã kiểm từng dòng toàn bộ repo:

- Worker: `index`, `game-v2`, `game-v2-auth`, `dem-chung`, `doc-d1-theo-luot`, `cau-hinh-dem`, `dau-kho-cau`, `kieu`, `giu-cho`, `ngan-sach-luot`, `suc-khoe-may`, `tu-dong-cac-viec`, `chi-muc-luc-chay`, `notifications`, `kho-anh`, `ph-truy-cap`, `dem-ca-thi`, `goi-cu`, `key-bank-bo-sung`, `key-bank-hop-nhat`, `reset-toan-app`.
- Khởi động/PWA: `sw`, `main`, `nap-manh`, `tai-gioi-han`, `bao-hiem-ban-moi`, `do-tai-loi`, `hoi-som`, `nap-truoc-man-em`, `nhip-de-nghi`, `app-presence`.

Ưu tiên có bằng chứng mã cụ thể:

1. `/ph/cap-ma`: đã đọc mật khẩu của cả danh sách, sau đó `for await parentPass` lại đọc từng em. Với 89 em, ít nhất 90 lượt D1 nối tiếp. Dùng chính dòng đã đọc để cấp mã và ký song song có giới hạn; không nới auth.
2. `suc-khoe-may`: gom mẫu bằng `[...mảng, mẫu]` làm sao chép O(n²) cho mỗi nhóm, tối đa 800 mẫu/lượt. Đổi sang `push`, giữ tính phân vị/ngưỡng/đệm hiện có. Đo CPU cục bộ tại `/tmp/worker-do-suc-khoe-1310.ts` trước/sau; không lấy số đó thay cho p95 Cloudflare.
3. Cron `index.ts`: các việc chuyển đổi game cũ và chỉ mục Bi-a vẫn được gọi. Chỉ bỏ sau khi đối chiếu đồ thị phụ thuộc; `chotNgayRoiTruKhien` có thể còn chốt EXP học nên không xóa theo tên game.
4. `giuCho` chạy tối đa bốn truy vấn nối tiếp cho từng câu. Hiện caller ghi ở đường game cũ; xác định đường nào nghỉ rồi mới tối ưu/bỏ. Giữ CAS và khóa theo đơn vị nội dung.
5. Giữ `BanBiA` export/binding/migration khi bỏ route giao diện: không xóa namespace hay D1. Các module luật game vẫn có cạnh Worker dùng thực.

Index/game và dọn mã cũ do root tích hợp theo làn. Mọi phát hành phải kiểm ca thi đang mở và giữ PR283/Hỏi Thầy, `COT_META_KT`, câu mới, lịch kiểm tra, Gói 7 và tiến độ đã làm.
