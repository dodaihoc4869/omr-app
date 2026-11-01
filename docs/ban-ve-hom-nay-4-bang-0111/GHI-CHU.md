# Hôm nay của thầy · 4 bảng Học thật / Học đối phó / Chăm / Lười — đặc tả 7 mục + bản vẽ (01/11/2026, chờ thầy duyệt)

Thầy 01/11: «Bỏ hết màn hồ sơ cũ của hs, ẩn hết tất cả các thông số. Đo chính xác 4 thông số: Học thật (nghiêm túc học, chữa bài, sửa câu sai, nỗ lực làm kĩ), Học đối phó
(học cho có, làm cho có, che đậy), Lười (không làm, không nỗ lực), Chăm (làm đều, nỗ lực thật). Hiện 4 bảng sắp xếp từ cao tới thấp, bấm vào mỗi học sinh phải ra bảng
bằng chứng vô cùng sắc bén khiến học sinh tâm phục khẩu phục. Thiết kế siêu đẹp, khoa học, trực quan, thân thiện. Vẽ cho tôi duyệt trước khi build.»

Bản vẽ: trang HTML trong bộ khung «Trong» (`docs/ban-ve-trong-2610/gv-hom-nay-4-bang.html`, `gv-bang-chung-em.html#dp|ht|ch|lu`), ảnh Chromium thật ở `anh/`
(390 dọc · 844 ngang · 1440 máy tính × sáng/tối). Chụp lại: `node docs/ban-ve-hom-nay-4-bang-0111/chup.cjs` — soát 0 lỗi trang · 0 tràn · 0 đích bấm nhỏ.
Số liệu và tên trong bản vẽ là GIẢ.

## 1. Mục tiêu + ai dùng
- Ai dùng: thầy, trên app thầy, ở màn đầu tiên («Hôm nay»).
- Mở ra là biết ngay em nào học thật, em nào đối phó, em nào chăm, em nào lười, và vì sao.
- Bấm vào một em ⇒ một trang bằng chứng: số liệu thật, có ngày giờ, có câu cụ thể, có so với cả lớp. Thầy chiếu hoặc đưa cho em xem, em không cãi được.

## 2. Bố cục
**Màn Hôm nay** (`gv-hom-nay-4-bang-*`)
- Đầu màn giữ nguyên hai nút «Bổ sung bài hôm nay» và «Theo dõi ca đang mở». Dưới là chọn khối (Tất cả · K10 · K11 · K12) và ô tìm tên.
- BỎ HẲN: dải 5 con số, Nhịp học theo lớp, 12 bậc, Em cần thầy để ý, hồ sơ làm bài cũ (6 mức làm bài, 7 ngày, sáu tín hiệu, giây theo mức độ…).
- 4 bảng, xếp theo 2 trục:
  - hàng trên là trục chất lượng: Học thật | Học đối phó;
  - hàng dưới là trục chăm chỉ: Chăm | Lười.
- Mỗi bảng có:
  - tiêu đề + số em + một dòng nói bảng đo gì;
  - 6 em đầu, rồi «Xem đủ N em».
- Mỗi dòng: hạng · tên · lớp · điểm 0–100 kèm thanh · MỘT bằng chứng sắc nhất (vd «46% câu chọn khi chưa đọc hết đề»).
- Màu:
  - Học thật: vàng `sao`;
  - Đối phó: chàm `tin`;
  - Chăm: xanh `dung`;
  - Lười: đỏ `sai`.
  - Giữ đúng màu của bản xếp hạng 30/10.
- «Việc cần thầy» (ca đang mở, cần thầy chữa, học sinh hỏi) xuống cuối màn. Đây là việc phải làm, không phải thông số.
- Điện thoại: 4 ô chọn bảng 2×2 có số em, dưới là danh sách của bảng đang chọn. Máy tính và điện thoại ngang: lưới 2×2. Màn hẹp hơn 1100px: một cột.

**Trang bằng chứng** (`gv-bang-chung-em-{dp,ht,ch,lu}-*`), mở khi bấm một em:
- **Kết luận:** một câu có số, theo màu bảng của em, ghi rõ «Học đối phó · hạng 1/18».
- **Bằng chứng:** 3–4 thẻ đánh số, xếp từ mạnh tới nhẹ. Mỗi thẻ có:
  - lời khẳng định + con số lớn;
  - thanh «Em / Cả lớp»;
  - ví dụ CỤ THỂ: ngày giờ · bài · câu · số chữ của đề ⇒ thời gian đọc tối thiểu · em chọn sau mấy giây · chọn gì · đúng/sai;
  - với kiểu bấm lặp: chuỗi chữ cái em đã bấm, ô xanh là câu đúng;
  - với kiểu «luyện cao, kiểm tra thấp»: hai ô so sánh.
- Cột phải:
  - **4 chỉ số của em**: 4 thanh, vạch xám là giữa lớp;
  - **14 ngày của em**: cột chồng «câu làm kỹ / câu chọn khi chưa đọc hết đề», ô đỏ là ngày không làm, vạch đứt là mức ngày;
  - **Cách tính**: giống nhau cho mọi em.
- «Xem đủ N lượt làm câu» mở danh sách từng lượt để soi tận gốc.

## 3. Trạng thái
- **Đang tải:** khung xương 4 bảng. Số cũ trong máy hiện ngay, số mới thay vào khi về.
- **Rỗng:** khối hoặc lớp chưa có em nào đủ dữ liệu ⇒ «Chưa đủ dữ liệu — cần ít nhất 3 ngày học».
- **Lỗi hoặc mất mạng:** giữ bảng lần trước + «cập nhật lúc hh:mm». Không bịa số.
- **Em chưa đủ dữ liệu** (dưới 40 lượt trong 14 ngày):
  - không xếp Học thật / Đối phó, thanh ghi «— chưa đủ dữ liệu»;
  - vẫn xếp Chăm / Lười theo số ngày (mẫu `#lu`).
- **Em ở hai bảng** (vd Chăm + Đối phó): hiện ở cả hai. Trang bằng chứng mở theo bảng thầy bấm, 4 chỉ số luôn đủ.

## 4. Dữ liệu (đo CHÍNH XÁC — chỉ dùng thứ máy chủ đã ghi, không đoán)
**Cửa sổ:** 14 ngày gần nhất tính đến hôm qua. Hôm nay hiện riêng, không làm tụt hạng giữa ngày. Nguồn:
- `su_kien_hoc`: mỗi lượt làm câu có
  - giây thật, đúng/sai, chọn gì (`raw_json.chon`), thời gian treo / ẩn tab (`doc`);
  - câu song sinh (`tc`), làm lại (`lan`, `correction_of`);
  - xem lời giải / lướt (`purpose`), có hỗ trợ (`assistance`);
  - nguồn: chặng học, Gói 7, Sửa lỗi, Tự sửa, Tự luyện.
- Kho câu: số chữ của đề (`game_v2_question`) ⇒ thời gian đọc tối thiểu = số chữ ÷ 4 chữ/giây. Câu chỉ có ảnh: dùng ngưỡng theo phần (8 giây / Phần III 15 giây).
- Kiểm tra: ca thi (`chi_tiet_cau`), kiểm tra cá nhân (`kiem_tra_ca_nhan`). So theo CÙNG DẠNG với luyện tập.
- Mức ngày: Nhịp học (`muc` / `lam` từng ngày). Ngày không giao bài thì không tính. Em vào giữa chừng thì tính từ ngày vào.
- Sửa lỗi: `chua_loi_*`, `tu_sua_viec_ngay`.

**Bốn điểm 0–100** (một bộ máy chung thay hai bộ cũ đang lệch nhau: `danh-gia-hoc-that` tuần và cờ đối phó của Nhịp học):
- **Học thật** = 35% sửa đúng câu từng sai trong 3 ngày (cùng câu hoặc câu song sinh) + 25% câu đọc đủ thời gian + 20% đúng ở câu mới lần đầu, không xem lời giải + 20% kiểm tra khớp luyện tập.
  - Vào bảng khi ≥ 75 và Đối phó < 30.
- **Học đối phó** = cộng các dấu hiệu, mỗi dấu hiệu có trần:
  - chọn khi chưa đọc hết đề mà sai;
  - bấm một chữ từ 6 câu liền;
  - mở lời giải rồi chọn dưới 5 giây;
  - treo máy quá 2 phút/câu;
  - luyện từ 70% mà kiểm tra cùng dạng từ 5 điểm trở xuống;
  - câu sai để quá 3 ngày không sửa, hoặc «sửa» bằng lướt.
  - Vào bảng khi ≥ 50.
- **Chăm** = 50% số ngày đủ mức + 30% số câu làm kỹ trên số câu được giao + 20% chuỗi ngày đủ mức. Câu làm vội KHÔNG tính: làm nhiều cho có không thành chăm.
  - Vào bảng khi ≥ 75.
- **Lười** = 100 − Chăm. Vào bảng khi ≥ 60.
- Mọi tỉ lệ lấy cận dưới tin cậy 90% (Wilson) để em ít câu không bị thổi phồng. Mọi số trên màn đi kèm số cả lớp.

**Cần thêm ở máy chủ** (chỉ-thêm, không đụng dữ liệu cũ):
- `server/src/bon-chi-so.ts` (thuần) + `bon-chi-so-d1.ts`;
- bảng `bon_chi_so_em(sbd, ngay, ht, dp, ch, lu, du_du_lieu, bang_chung_json, luc)`;
- lệnh `/gv/bon-bang?khoi=` (4 danh sách đã xếp + số em) và `/gv/bon-bang/em?sbd=` (bằng chứng).
- Bằng chứng lưu kèm ví dụ cụ thể (mã câu, giờ, giây, chọn gì) để trang mở tức thì.

**Kiểm chứng trước khi bật:** chạy bộ máy mới trên dữ liệu thật ở chế độ CHỈ ĐỌC (truy vấn đọc, không `d1 export`), in phân bố không tên. Thầy soát 10 em thầy biết rõ, rồi mới thay màn.

## 5. Ngoại lệ
- **Em nghỉ học có lý do:** «vắng buổi» không tính (luật 31/10 giữ nguyên); chỉ tính ngày có giao bài.
- **Mạng chập chờn:** lượt ghi nền vẫn mang giây thật. Lượt mất giây thì bỏ khỏi phép đo thời gian, không tính là vội.
- **Câu dài, câu có bảng / hình:** thời gian đọc tối thiểu cộng thêm cho bảng / hình (như bộ đo `muc-lam`).
- **Đáp án đúng trùng chữ nhiều câu liền** (vd đề có 3 câu liền đáp án B): chuỗi bấm lặp chỉ tính khi đáp án đúng của chuỗi KHÔNG cùng một chữ.
- **Số đột biến** (một ngày làm 300 câu): vẫn tính, và hiện ra thành một bằng chứng riêng nếu đó là lướt.
- **Máy yếu:** màn chỉ vẽ 4 × 6 dòng. «Xem đủ» và trang bằng chứng nạp lười.

## 6. Chi phí máy chủ
- Mở màn Hôm nay: 1 lượt đọc D1 (bảng đã tính sẵn), không vòng chờ nối tiếp.
- Bấm một em: 1 lượt đọc (bằng chứng đã tính sẵn). Nút «Làm mới» tính lại một em: đọc `su_kien_hoc` 14 ngày của đúng em đó (có chỉ mục `sbd`, `ngay_vn`).
- Tính sẵn: cron đêm 00:10–04:00 giờ VN, mỗi phút một lô em (như cron Học thật hiện nay); thêm một lượt cập nhật trưa cho em có học sáng nay.
- Không gì xuống máy học sinh: đây là màn của thầy.

## 7. Nghiệm thu đo bằng máy
- **`tests/bon-chi-so-0111.test.ts`** khoá:
  - đúng 4 công thức và ngưỡng vào bảng;
  - Wilson với em ít câu;
  - câu vội không tính chăm;
  - bấm lặp khi đáp án đúng cùng chữ không tính;
  - luyện cao / kiểm tra thấp theo cùng dạng;
  - dưới 40 lượt ⇒ chưa xếp;
  - ngày không giao bài không tính lười.
- **`tests/bon-chi-so-d1-0111.test.ts`:** D1 thật, cron theo lô, `/gv/bon-bang`, `/gv/bon-bang/em`.
- **`tests/hom-nay-4-bang-0111.test.tsx`:** 4 bảng xếp cao → thấp; không còn dải số, Nhịp học, 12 bậc, hồ sơ cũ; bấm em ⇒ trang bằng chứng; điện thoại 4 ô chọn.
- Cổng: `tests/toc-do-may-chu-lenh-nong-1310.test.ts` (lệnh mới 1 đợt chờ).
- `npm run build && node scripts/kiem-toc-do-tai.mjs` 0 đỏ (màn Hôm nay nhẹ đi vì bỏ 4 khối); `npm run kiem:mau-giu` 0.
- Ảnh Chromium 0 lỗi trang, 0 tràn, 0 đích bấm < 44 px.

## Đã build (01/11) — ảnh giao diện THẬT
- Chụp từ đúng mã `BonBang` / `BangChungBon` với dữ liệu GIẢ (30 em tên giả) đi qua đúng bộ máy máy chủ `bon-chi-so.ts`: `anh/that-bon-may-tinh-light.jpg`, `anh/that-bon-may-tinh-dark.jpg`, `anh/that-bc-may-tinh-light.jpg`, `anh/that-bon-doc-light.jpg`, `anh/that-bc-doc-dark.jpg`. Không tràn ngang ở 390 px.
- Sửa khi soát ảnh thật: (1) «Lần cuối học» lấy ngày muộn nhất giữa sổ học và các ngày có làm trong 14 ngày — không còn nói «em chưa làm câu nào» khi em có làm; (2) Đối phó mà 0 ngày đủ mức ⇒ «Em làm cho có: …»; (3) nút «Hôm nay» trên điện thoại không xuống dòng.
