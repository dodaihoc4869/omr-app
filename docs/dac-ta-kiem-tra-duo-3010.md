# Đặc tả màn làm ca kiểm tra kiểu Duo: chữ mảnh, giám thị, đèn pha (30/10/2026)

**Trạng thái.** Thầy tự duyệt bản vẽ lúc 22:45 ngày 30/10: «tự duyệt bản vẽ buil luôn». Bản đã dựng nằm trên nhánh `claude/kiem-tra-duo-3010`. Chưa gộp main, chưa phát hành.
Bản vẽ là ảnh Chromium chụp từ chính thành phần thật, đặt ở `docs/ban-ve-kiem-tra-duo-3010/` (xem `mau.html`). Khung chụp: `scripts/chup-kiem-tra-duo-3010/`. Mọi số trên ảnh là số giả để minh hoạ.

Thầy yêu cầu (30/10):
- «làm luôn lại giao diện kiểm tra của học sinh: cho chữ mảnh ko in đậm, có cả giám thị hiển thị như ở chặng luôn nhé»;
- «Tối ưu giao diện xoay ngang làm kiểm tra và giao diện máy tính. mọi thứ phải tốc độ ổn định và mượt mà nhất cho thể»;
- «Giao điện kiểm tra phải siêu đẹp doligo, giám thị soi đèn pha vào đáp án học sinh bấm với hiệu ứng mịn đẹp xịn».

## 1. Mục tiêu sư phạm và người dùng
- **Người dùng:** học sinh đang làm ca kiểm tra trên app «Trong» (`<html data-trong="hs">`, khung `ThiDuo`). Ca thi thật, bài tập về nhà dạng ca, và cả ba khổ màn đều dùng chung khung này.
- **Cảm giác cần đạt:** chữ đề nhẹ, dễ đọc lâu, giống màn làm chặng. Có người coi thi đứng cạnh đề, nghiêm mà thân thiện. Mỗi lần em chạm một đáp án, em thấy ngay máy đã nhận lựa chọn, và thấy rõ mình vừa chọn ô nào.
- **Luật thi giữ nguyên:**
  - Màu chỉ có nghĩa «đang chọn».
  - Không có đúng/sai, không gợi ý.
  - Đèn chỉ soi ô em VỪA CHẠM trên máy em, không biết đáp án nào.
  - Đáp án không xuống máy học sinh trước khi nộp.

## 2. Bố cục
Bố cục chung ở cả ba khổ:
- **Thanh trên** giữ nguyên: Thoát, thanh «đã làm», đồng hồ, lưới câu có chấm lưu.
- **Nhãn câu** giữ nguyên, ví dụ «CÂU 3/28 · PHẦN I · TRẮC NGHIỆM». Nút «Xem lại sau» ở cuối hàng.
- **Giám thị** đứng bên trái. Đề nằm trong bong bóng bên phải, mũi nhọn chĩa vào mặt giám thị. Đây là cùng cách đặt với màn làm chặng.
- **Đề dài** tràn xuống dưới chân giám thị. Khi đó bong bóng thành chữ L: góc trái trên khuyết một ô ôm giám thị, chữ chạy bên phải giám thị rồi tràn sát mép trái.

**Người coi theo phần.** Gói đề của em không có mức câu, và cũng không cần thêm mức câu vào gói. Vì vậy mỗi phần có một người coi:

| Phần | Giám thị |
|---|---|
| Phần I | Tí |
| Phần II | Cô Cốc |
| Phần III | Chú Tam |
| Tấm «Nộp bài?» | Giáo sư Kíp (thay Bi, đèn bật) |

**Chữ mảnh.** Mặt chữ «Đề» của ĐĐH Rounded, độ đậm 500, dùng cho:
- đề và phương án;
- ý Đúng–Sai và nút Đúng / Sai;
- ô số và phím số.

Đổi lựa chọn chỉ đổi màu và viền, không đổi độ đậm, nên chữ không nhảy dòng khi em chọn. Nhãn câu, nút chính, đồng hồ và số câu vẫn dùng mặt Đậm.

| Khổ | Bố cục | Giám thị | Nút chính |
|---|---|---|---|
| Điện thoại dọc (390×844) | Một cột 720 px: giám thị + bong bóng đề, phương án bên dưới | 120 px (≤ 380 px: 100 px) | Đáy dính: «‹» vuông + «CÂU TIẾP» / «NỘP BÀI» (câu cuối) |
| Điện thoại ngang (844×390) | Hai cột: ĐỀ (giám thị + bong bóng) bên trái, TRẢ LỜI bên phải. Câu thường vừa một màn, không cuộn. Bảng nhập số xếp hàng ô trên, phím 4 cột dưới, phím ≥ 44 px | 96 px | Hàng nút ghim đáy, chỉ dưới cột trả lời, không che đề. Nút «Vào lại toàn màn hình» sang góc trái dưới |
| Máy tính (≥ 1100 × > 500) | Khung 1120 px, hai cột: đề trái, trả lời phải | 150 px | Hàng đáy kiểu Duolingo: «‹» bên trái, nút chính gọn bên phải |

### Đèn pha
Giám thị đội một đèn pha trên trán, vẽ trong hình người v3 nên đi theo mặt khi quay. Khi em chạm một ô:

1. Ô được chọn vẽ ngay trong khung đầu, như cũ.
2. Từ khung sau, đèn bật: kính vàng và có quầng sáng.
3. Tia sáng vươn từ đèn tới ô em chạm trong 260 ms.
4. Một vũng sáng bầu dục nở trên ô.
5. Nếu em chạm ô khác khi đèn còn sáng, tia QUÉT sang ô mới và vũng sáng trượt theo.
6. Sau 1,1 giây không chạm, đèn tắt dần trong 0,4 giây.

Đèn soi đúng thứ em vừa chạm ở từng phần:
- **Phần I:** phương án.
- **Phần II:** nút Đúng / Sai của ý.
- **Phần III:** hàng ô số khi em bấm phím, kể cả gõ phím trên máy tính.

## 3. Trạng thái
- **Đang tải:** khung câu hiện trước. Giám thị dựng sau khung đầu (rAF rồi setTimeout), nên không chặn lượt vẽ câu. Hình người nằm ở mảnh `giam-thi-*` dùng chung với màn làm chặng (kho chạy-lúc).
- **Câu là ảnh** (không có khối chữ đề): không có giám thị, không có đèn. Câu hiện như cũ.
- **Giám thị theo thao tác của em:**

  | Khi nào | Giám thị làm gì |
  |---|---|
  | Câu mới | «đọc đề» rồi liếc xuống ô đã chọn |
  | Rê chuột trên máy tính | mắt dõi theo ô |
  | 25 giây không thao tác | dáng chờ |
  | Chạm lại | về dáng yên |

- **Sắp hết giờ** (đồng hồ chuyển gấp): giám thị xem đồng hồ và nói MỘT lời nhắc mỗi ca: «Sắp hết giờ, soát lại bài nhé.» Ngoài câu này, giám thị không nói gì về câu.
- **Không có trạng thái riêng:** đúng, sai, chưa tính, lời càu nhàu của màn làm chặng.
- **Mất mạng / lưu / nộp:** giữ nguyên, do ExamTakeScreen lo. Chấm lưu ở nút lưới giữ nguyên. Đèn không phụ thuộc mạng.
- **Tấm «Nộp bài?»:** Giáo sư Kíp đứng ở chỗ Bi, đèn bật, dựng tĩnh một lần. Ở khung thấp xoay ngang, tấm không có chỗ cho hình nên ẩn hình như trước.

## 4. Dữ liệu
- **Không lệnh máy chủ mới, không trường mới.** Màn chỉ đọc những gì khung đã có: câu đang xem, phần của câu, cờ `gap` của đồng hồ.
- Đèn đo vị trí ô em chạm trên chính màn của em: kính đèn, ô và lớp phủ, mỗi thứ đọc `getBoundingClientRect` một lần, sau khung đầu.
- `src/components/kiem-tra-duo/den-soi.ts` và `GiamThiThi.tsx` không đọc đáp án, không gọi API. Test `tests/kiem-tra-duo-den-3010.test.tsx` khoá điều này bằng cách đọc mã nguồn.

## 5. Ngoại lệ
- **Hết giờ / tự nộp:** giữ nguyên luồng cũ. Đèn tắt theo khung.
- **Đổi câu** (nút, phím ← →, lưới câu): đèn tắt ngay. Giám thị đo lại đề mới.
- **Đổi phần:** đổi người coi. Người cũ huỷ, người mới dựng sau khung đầu.
- **Bấm lặp / bấm nhanh:**
  - mỗi lần chạm huỷ lượt soi đang chờ, nên chỉ soi lần cuối;
  - đèn đang sáng thì tia quét sang ô mới, không bật lại từ đầu;
  - giám thị và đèn không nhận chạm (`pointer-events: none`), nên mọi chạm vẫn tới thẻ câu.
- **Chữ hoặc công thức dài:** bong bóng chuyển chữ L, do ResizeObserver đo sau khi trình duyệt tự tính bố cục. Đề ngắn thì `--kt-du` đẩy hình, bảng, phương án xuống dưới chân giám thị, không đè.
- **Máy yếu** (`html.may-yeu`, `ddh.mayYeu`) **và giảm chuyển động:** KHÔNG bỏ hiệu ứng (thầy 30/10: «Không được bỏ hiệu ứng»). Đèn chạy bản GỌN:
  - tia, vũng sáng và quầng hiện tại chỗ chỉ bằng opacity (120 ms), không vươn, không quét;
  - giám thị đứng tư thế tĩnh như màn làm chặng ở máy yếu;
  - ảnh nghiệm thu: `doc-b-may-yeu-sang.jpg`.
- **Đổi tab:** đèn tắt, giám thị dừng vòng vẽ. Hiện lại thì đếm nhịp chờ lại từ đầu.
- **Đổi khổ màn / xoay máy:** đèn tắt ngay. Giám thị đo lại vị trí.
- **Giữ để đọc, vân tay, chống rời màn:** không đổi. Giám thị và đèn nằm trong khối câu, dưới tấm che «Giữ để đọc».

## 6. Chi phí máy chủ và máy em
- **Máy chủ:** 0 lượt đọc / ghi D1 thêm, 0 lệnh mới.
- **Byte tải:** giám thị và đèn đi trong mảnh `ThiDuo`, cùng mảnh dùng chung `giam-thi-*`. Cả hai đều ngoài precache, nạp lười khi `data-trong="hs"`.
  - Precache vẫn 170 tệp / 2795 KB.
  - `kiem-toc-do-tai` không đường nào chậm hơn, cổng học sinh nhẹ hơn mốc 4 KB.
- **Mượt:**
  - Đèn chỉ dùng transform và opacity (Web Animations), chạy ở luồng vẽ.
  - Tia là nêm `conic-gradient` vẽ một lần. Vũng sáng là `radial-gradient` phóng bằng transform.
  - Không blur, không bóng đổ động, không mix-blend.
  - Lớp đèn có `contain: strict` và không nhận chạm.
  - `will-change` chỉ bật khi đèn sáng: lúc nghỉ không thêm lớp GPU nào.
  - Khối câu mang `data-gt` suốt khung (gắn một lần), không bật / tắt theo câu.

## 7. Nghiệm thu đo bằng máy
- **Test:**
  - `tests/kiem-tra-duo-den-3010.test.tsx` (10 test, mới): hình học tia, đèn tự tắt, không đọc đáp án, người coi theo phần, lời nhắc, chữ 500, khung có lớp giám thị và lớp đèn ẩn với trình đọc màn hình;
  - `tests/kiem-tra-duo-chi-rung-2710.test.tsx`: tấm nộp ca thi nay có giám thị thay Bi;
  - `giam-thi-*`, `bang-thi-duo-2710`, `may-yeu-2909` giữ nguyên, vẫn xanh.
- **Cổng:**
  - `npx tsc -p tsconfig.app.json --noEmit`;
  - `npm run build:cf` (service worker 13/13);
  - `node scripts/kiem-toc-do-tai.mjs` 0 đỏ;
  - `npm run -s kiem:mau-giu` 0 vi phạm;
  - `npm run check:mau`.
- **Ảnh Chromium:** `node scripts/chup-kiem-tra-duo-3010/chup.mjs`.
  - 3 khổ × sáng / tối × 6 cảnh, cộng 8 khung hình đèn pha và 1 ảnh máy yếu.
  - 0 lỗi trang, 0 tràn ngang, 0 đích chạm < 44 px.
  - Mỗi ảnh ≤ 150 KB.

Tên ảnh theo mẫu `{doc|ngang|may}-{cảnh}-{sang|toi}.jpg`:

| Cảnh | Nội dung |
|---|---|
| a | câu ngắn, chưa chọn |
| b | vừa chạm C, đèn soi |
| e | đề dài, bong bóng chữ L |
| c2 | Phần II, soi nút «Sai» |
| c3 | Phần III, soi hàng ô số |
| d | tấm «Nộp bài?» |

Khung hình đèn pha: `den-{sang|toi}-{1..4}-{40|140|260|520}ms.jpg`.
