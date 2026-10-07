# Kiểm đột biến — "Xem câu gốc" + ô ghi chú câu thay gọn (việc 17, 07/10)

Cách làm: trên một cây làm việc riêng (`git worktree`, không đụng cây chính), làm hỏng TỪNG điểm của mã mới bằng một lần sửa văn bản, chạy các test liên quan với `--bail 1`; "bị bắt" = có test đỏ, "sống sót" = mọi test vẫn xanh (test chưa đủ chặt hoặc điều kiện thừa). Mỗi lần xong khôi phục tệp gốc và kiểm băm (`KHÔI PHỤC NGUYÊN VẸN: True`).

## Lượt 1 — 47 đột biến

| Nhóm | Số | Bị bắt | Điểm bị làm hỏng |
|---|---|---|---|
| Máy chủ `/hs/cau-goc` (`cau-goc.ts`) | 17 | 16 | bỏ kiểm lượt · phát mọi qid xin · bỏ lọc tự luận · bỏ cổng đề bảo vệ · bỏ ngoại lệ trừ ca / nới lỏng bảo vệ ca khác · bỏ cổng khác khối · lộ `correct` · lộ ảnh sau lời giải · nhận mọi khoá ngoài `~goc:` · fail-open khi không kiểm được bảo vệ · bỏ trần số câu · đọc nhầm phần `daLam` · bản đồ ca khác · lượt em khác · bỏ dọn qid · (sống: bỏ cổng SBD lạ) |
| Đề bảo vệ trừ một ca (`game-v2-bank.ts`) | 2 | 2 | không loại ca đang xét · loại hết mọi ca |
| Lõi (`rut-de-da-dung.ts`) | 7 | 4 | đảo kiểu thay số / cùng dạng · đảo chữ lý thuyết · khoá `~goc:` đọc sai · nhận mọi khoá (sống: 3 điều kiện thừa) |
| Bộ đọc câu gốc (`cau-goc.ts`) | 5 | 4 | nhận mọi nguồn ảnh · không cắt 4 phương án · chép nguyên mọi trường · bỏ kiểm đề (sống: cho phép ảnh lời giải) |
| Ô ghi chú (`DaiCauThay.tsx`) | 12 | 12 | nút khi không có qid gốc · mở lại là hỏi lại · lỗi không hỏi lại · khung luôn hiện · `aria-expanded` · nhãn dài thay dòng ngắn · hỏi nhầm qid · null không báo · không có "Tải lại" · ô chọn đáp án · đảo Xem/Ẩn |
| Gói hỏi máy chủ (`exam-api.ts`) | 4 | 4 | sai đường · thiếu qid · lỗi bị coi "không có" · lấy câu đầu bất kỳ |
| **Cộng** | **47** | **42** | **5 sống sót** |

## Xử lý 5 điểm sống sót của lượt 1

| Điểm | Nguyên nhân | Việc đã làm |
|---|---|---|
| bỏ cổng SBD lạ (`cau-goc.ts`) | test chấp nhận cả `ok:false` nên không phân biệt được | siết test: SBD lạ phải ra đúng `khongCo` gọn, không lỗi |
| cho phép ảnh lời giải (`cau-goc.ts` ở máy em) | mẫu ảnh lời giải dùng nguồn không hợp lệ nên bị bỏ vì lý do khác | mẫu dùng nguồn hợp lệ (`data:image/…`) — nay chỉ vị trí `sau_loi_giai` mới loại được nó |
| `!thaySo &&` trong `tachNhanThay` | điều kiện thừa: `nhanThay` không bao giờ sinh "Câu lý thuyết này thay số" | bỏ điều kiện |
| `!c.bu` và `c.thay` trong `banDoDaDung` (2 điểm) | thừa: `goc` chỉ được đặt cùng `thay` ở câu đã thay (`apThayVaoKetQua`), câu bù không có | bỏ hai điều kiện, giữ `c.goc && nhãn` |

## Lượt 2 — chạy lại các điểm vừa sửa (6 đột biến)

Gồm 5 điểm cần test chặt hơn hoặc mã mới + 1 biến thể mới (bỏ riêng đoạn kiểm khoá `__proto__` / `constructor` / `prototype` của SBD ở máy chủ). Bị bắt 5/6; biến thể còn sống là **mã chết** (SBD chỉ đi vào đường dẫn JSON của SQL, không có đối tượng JS nào đánh chỉ mục theo SBD) nên đã gỡ khỏi mã nguồn. Sau cùng mọi điều kiện còn trong mã đều có ít nhất một test chạm tới.

## Đo bằng trình duyệt thật (Chromium, bản dựng thật, máy chủ chặn trả dữ liệu mẫu)

Kịch bản `chup-cau-goc.mjs` (40 điều kiện): 4 cỡ điện thoại (360 · 390 · 430 · 768 px) + máy tính 1440 px + chế độ tối. **40/40 đạt**: nút "Xem lại sau" không giao ô ghi chú ở mọi thẻ (đo hình chữ nhật thật), nhìn thấy ≤ 36 px và vùng chạm thật ≥ 46 px (hit-test cách mép 5 px trúng nút, cách mép 7 px không trúng), nút "Xem câu gốc" cao ≤ 34 px vùng chạm thật ≥ 44 px, không tràn ngang, đúng 4 nút cho 4 câu thay (câu nguyên văn không có), bấm → hỏi ĐÚNG câu gốc + mã ca + SBD, hiện đề + 4 phương án / 4 ý, không in đáp án dù máy chủ mẫu cố ý gửi thừa `correct`/`solution`, gập / mở lại không hỏi thêm, lỗi → "Tải lại" → hiện câu, không tải trước hàng loạt.
Chế độ **điện thoại xoay ngang** (844×390, `lam-bai-ngang.css`, kịch bản `chup-ngang.mjs`): có ô ghi chú + 4 phương án thì câu nào cũng cao hơn khung ⇒ luôn CHIA ĐÔI (đo thật, kể cả đề ngắn); mọi khối ngoài thân thẻ là `flex: none` nên câu gốc bung ra chiếm hết chỗ (**đối chứng: thân câu bị ép còn 33 px**) ⇒ thêm trần cao `38vh` + cuộn riêng cho `.lb-gon-de[data-chia] .thi-thay-goc`: câu gốc cao 148 px, thân câu còn 86 px, cuộn được. **12/12 đạt**.
Đo lượt đầu CHẶN ĐƯỢC LỖI THẬT mà test mã nguồn bỏ sót: luật chung `.m3 button { min-height: 48px }` (m3.css) ép nút "Xem lại sau" cao 48 px nên `height: 36px` đứng một mình vô tác dụng (nút vẫn đè ô ghi chú, 10/36 điều kiện trượt) ⇒ thêm `min-height: 0` cho `.m3 .thi-cau-dau` và `.m3 .thi-thay-nut`.
