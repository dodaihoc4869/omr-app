# Hoàn thiện V2 — thiết kế đồng bộ được duyệt

## Điều kiện của người dùng

Người dùng đã xác nhận: “Tự thiết kế theo V2 luôn nha”. Các màn con được tự thiết kế theo cùng hệ V2, không cần thêm concept riêng. Chỉ phát hành sau kiểm tra; bản trước đợt này là `42733af1`.

## Đã sửa

- GV: bộ chọn khối cùng hàng tiêu đề ở desktop; bảng nhịp học tách mục tiêu, bậc theo dạng, lý do; giữ số câu đã làm thật. Khi tải thất bại, không hiển thị số 0 như dữ liệu hợp lệ.
- HS: ghép đảo nổi mới từ bản concept, tối ưu WebP 172 KiB; tiêu đề hành trình không bị tên bài ghi đè; bỏ ảnh biểu cảm trùng trên sân khấu; giữ đúng loài, cấp và dạng tiến hóa hiện có.
- Đoàn: đưa các bề mặt đêm còn sót về kem/ngọc; chỉnh tương phản nút Rời chuyến, HUD, nhãn quái, nút phụ và các thẻ.
- Chọn thú: sửa tên/mô tả bị cắt trên màn ngang; vẫn hiển thị đủ tám loài.
- PH: tiêu đề trước thẻ thông tin con; biểu đồ và tóm tắt ngày học trong một thẻ; chi tiết mở bằng disclosure chuẩn; bảo vệ phép chia khi mục tiêu bằng 0.
- Kiểu chữ V2 dùng sans thống nhất qua token; không đổi thuật toán phân câu, dữ liệu điểm, tài khoản hoặc quyền truy cập.

## Kiểm tra

- Kiểm lại sau duyệt: 94 kiểm thử liên quan / 11 tệp đạt, gồm 5 kiểm thử mới `tests/v2-finition-0810.test.tsx` và các hợp đồng vận hành bắt buộc.
- Chạy lại trọn lượt sau duyệt: 27 màn/trạng thái × 3 kích thước = 81 tổ hợp đạt; không lỗi JavaScript, không tràn ngang trang, không ảnh hỏng. Báo cáo `/workspace/anh-v2-approved/kiem-tra.json`. Dữ liệu mô phỏng; không phải dữ liệu production.
- Ba kích thước: 390×844, 844×390, 1440×960. Thiết bị giả lập dark; app vẫn dùng màu V2 sáng.
- Phạm vi: sảnh, hoàn thành ngày, ba màn PH và tab phụ, Hành trình, tổng quan, lên bảng, chọn bài, bảng OMNI, cài đặt, ca thi/mở ca/chi tiết ca/lịch sử, lớp, học sinh, toàn cảnh em, kho đề, gỡ nút thắt, duyệt lời giải, chọn thú, sổ tay, túi đồ, cửa hàng, sửa sai, Đoàn.
- Màn chưa có dữ liệu hợp lệ được kiểm trạng thái trống/lỗi; không suy ra đã kiểm mọi dữ liệu hay mọi thao tác nghiệp vụ.
- Kiểm riêng tên thần thú không bị cắt trong sân khấu ngang và màu chữ nút Rời chuyến; ảnh hỏng được ghi trong báo cáo chụp mới.
- Build Cloudflare và PWA đạt; precache khoảng 2943 KB, trần 3000 KB.
- Kiểm màu và quét tĩnh giao diện đạt; không lỗi diff whitespace.
- Bộ toàn kho mã bị giới hạn 5 phút, có lỗi và kết thúc mã 124; KHÔNG ghi nhận là đạt. Đối chứng nguyên bản `42733af1` ở worktree `/tmp/omr-v2-baseline-0810`: ba tệp `omni-3-thay-bai-hom-nay`, `giao-dien-to-chieu-1909`, `btvn-nang-do-2109` cũng có 11 lỗi / 117 bài. Chưa phân loại toàn bộ lỗi còn lại.

## Chưa đủ để ký xác nhận “100% mọi lớp”

- Ba ảnh concept chính định hướng hệ thiết kế; người dùng đã duyệt tự thiết kế màn con. Không đồng nghĩa có ảnh đối chiếu pixel-perfect cho từng màn.
- Không chép số mẫu “14–22 phút”, “+0,4 điểm dự báo”, “mục tiêu 8,5+” khi API chưa có dữ liệu tương ứng. Các khác biệt này có chủ ý để tránh thông tin giả.
- Tám thần thú và sáu cấp tiến hóa vẫn giữ bộ ảnh hiện có; không coi nền đảo mới là đã vẽ lại toàn bộ bộ thú.
- Chưa chứng nhận mọi hộp thoại/trạng thái nghiệp vụ hoặc pixel-perfect. Phát hành theo hệ V2 đã được duyệt, không tuyên bố kiểm hết mọi trạng thái dữ liệu.
- Fixture cửa hàng dùng cùng bộ vẽ thú mặc phụ kiện và hình vật phẩm như cửa hàng thật; vẫn dùng dữ liệu mô phỏng, không mua vật phẩm hoặc thay đổi tài khoản thật.
- Kiểm thêm luồng thử đồ → mở xác nhận mua → Escape: hộp thoại nằm trong viewport ở 390×844, 844×390 và 1440×960; không xác nhận mua.

## Bằng chứng ảnh local

- `/workspace/anh-v2-final`: màn chính và giáo viên.
- `/workspace/anh-v2-all-gv`: các màn GV bổ sung, gồm trạng thái trống/lỗi.
- `/workspace/anh-v2-lop-phu`: sổ tay, túi đồ, cửa hàng, sửa sai.
- `/workspace/anh-v2-fix-contrast`: chọn thú sau sửa bố cục ngang.
- `/workspace/anh-v2-recheck`: kiểm lại Đoàn, kho đề (đã sửa dữ liệu giả đúng kiểu), PH cuối.

Script chạy lại: `scripts/kiem-v2-ba-app.mjs` với `V2_MODES` chọn màn, `V2_OUTPUT` chọn thư mục. Server fixture: `npx vite --config scripts/chup-omni-3/vite.config.mjs --host 127.0.0.1 --port 4178`.
