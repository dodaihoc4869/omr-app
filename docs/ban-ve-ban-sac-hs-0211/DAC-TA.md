# App học sinh · bản sắc riêng «Ô nguyên tố» — đặc tả + bản vẽ (02/11)

Thầy 02/11: «giữ nguyên mọi tính năng, nhưng giao diện cần có bản sắc riêng không giống doligo … vẽ toàn bộ vector … đột phá, đơn giản, tinh tế, thân thiện với học sinh … vẽ trước khi build».

Đây là bước 2 của quy trình 4 bước. Thầy chưa duyệt thì chưa build.

**Xem nhanh**
- Tổng quan 14 màn: `bang/00-tong-quan.jpg`
- Lộ trình trước/sau: `bang/01-truoc-sau-lo-trinh.jpg`
- Từng màn (máy tính sáng · ngang tối · điện thoại sáng · điện thoại tối): `bang/<màn>.jpg`
- Ảnh gốc 84 tấm (14 màn × 3 khổ × sáng/tối): `anh/`
- Bản vẽ là HTML + SVG thật, mở bằng trình duyệt: `<màn>.html`. Chụp lại: `node chup.cjs <màn>…`, rồi `python3 ghep.py`.

## 1. Mục tiêu + ai dùng

Người dùng là học sinh lớp 10–12, chủ yếu trên điện thoại. Cảm giác cần đạt: mở app là thấy đây là app **Hoá của thầy Học**, không phải một bản sao Duolingo. Vẫn vui, vẫn rõ việc tiếp theo, nhưng gọn và tinh hơn.

**Ý tưởng chính:** mọi hình trên màn mượn từ chính môn Hoá. Có bốn dấu hiệu nhận diện:

| # | Dấu hiệu | Thay cho | Ý nghĩa với học sinh |
|---|---|---|---|
| 1 | **Ô nguyên tố**: ô bo vuông, số nhỏ ở góc như số hiệu nguyên tử | Nút tròn 3D | Mỗi chặng, mỗi việc là một «ô» như trong bảng tuần hoàn |
| 2 | **Mạch liên kết**: Lộ trình vẽ như công thức khung zic-zắc. Chặng đã xong nối bằng **liên kết đôi**, tới chặng đang học là liên kết đơn, chặng còn khoá là nét chấm. Kiểm tra ôn tập là **vòng benzen** (lục giác) | Đường nút tròn lượn sóng | Học xong một ngày là «tổng hợp» xong một phân tử |
| 3 | **Nguyên tử mục tiêu**: mỗi câu của mức hôm nay là một electron trên 3 quỹ đạo. Làm xong câu nào, electron ấy sáng lên. Vượt mức thì electron vàng hiện ở vòng ngoài | Vòng / thanh tiến độ | Thấy ngay còn bao nhiêu câu. Hiển thị đúng với mức 12/24/30/36 và cả vượt mức 17/12 |
| 4 | **Nền vở ô ly**: lưới ô rất mờ, chỉ dùng CSS | Mặt nạ công thức data-URI | Gần gũi với vở học sinh Việt Nam. Nhẹ hơn mặt nạ cũ |

Tiến độ trong chặng cũng là một **mạch nhỏ**: mỗi câu một ô, câu đã làm nối bằng liên kết đôi. Màu ô cho biết kết quả: chàm là tự làm đúng, vàng là có hỗ trợ, hồng là sai. Mol là linh vật bình cầu, giữ nguyên (ảnh vector chụp từ `mol-dong.ts` thật, không vẽ lại).

### Bảng «không giống Duolingo» (để thầy duyệt từng dòng)

| Đặc điểm Duolingo app đang có | Bản mới | Xử lý |
|---|---|---|
| Nút 3D gờ đáy dày (`--tr-*-day` làm bóng đáy) | Nút phẳng bo 16, bóng mềm cùng sắc | **Bỏ gờ đáy.** Biến `-day` vẫn giữ trong tệp màu, chỉ dùng làm sắc bóng |
| Đường nút tròn lượn zic-zắc, không có nét nối | Mạch liên kết: ô vuông + liên kết đôi/đơn/chấm + vòng benzen | **Thay hình** |
| Rương vàng kiểu Duolingo | Vẫn là «Rương hôm nay», vẽ lại phẳng, khoá hình lục giác | **Vẽ lại**, giữ tên và chức năng |
| Chữ nút IN HOA đậm («KIỂM TRA ÔN TẬP», «GÕ CỬA») | Chữ thường, đậm 700–800 | **Bỏ in hoa** |
| Dải màu kết quả chạy hết đáy màn | Thẻ nổi bo 26, có biểu tượng **giọt chỉ thị** | **Thay hình** |
| Menu dọc mép phải «kiểu Duolingo web» | Điện thoại: thanh dưới 4 ô (Lộ trình · Luyện tập · Thành tích · Thêm). Ngang/máy tính: ray trái đủ 6 mục | **Đổi chỗ — cần thầy chốt** (xem §2) |
| Bảng màu đo theo độ sáng/độ tươi Duolingo | **Giữ nguyên 100% biến màu `--tr-*`** (luật 05/10 + chốt 27/10) | Giữ. Muốn đổi màu là quyết định riêng, chưa vẽ |
| Phông ĐĐH Rounded (dựng cho giống chữ Duolingo) | Giữ phông, đổi cách dùng: ít đậm hơn, chữ thường, số `tabular-nums` | Giữ (luật tốc độ). Phương án đổi phông ghi ở §6 |
| Thanh tiến độ chặng dày có vệt bóng | Mạch nhỏ, mỗi câu một ô màu theo kết quả | **Thay hình** |

## 2. Bố cục

**Điện thoại dọc (390)**
- Thanh trên: 3 bộ đếm (Chuỗi · Nguyên tử · Tinh thể), nguyên tử mục tiêu thu nhỏ, chuông.
- Nội dung một cột.
- Thanh dưới nổi 4 ô.
- Nút A.I nổi góc phải (giữ hành vi kéo đổi chỗ).

**Ngang (844×390) và máy tính**
- Bỏ thanh dưới. Có ray trái: dưới 1200 px chỉ có biểu tượng; từ 1200 px có cả chữ (logo + 6 mục).
- Cột phải là «Hôm nay»: nguyên tử mục tiêu cỡ lớn, Giải tuần, Nhiệm vụ ngày, lối tắt Luyện tập.
- Nút A.I nổi ẩn vì ray đã có mục «Hỏi A.I». Cùng mở một tấm chat.

**Màn làm câu**
- Giữ đúng luật `haiCotLam` (01–02/11).
- Dọc: một cột. Nút chính dính đáy.
- Ngang / máy gập / máy tính: đề bên trái cuộn riêng; phương án, nút và thẻ kết quả bên phải.
- Phương trình dài nằm MỘT dòng trong ô cuộn (`.ct-dai`), mép phải mờ báo «còn nữa» (luật 01/11).

**Điều hướng — thầy cần chốt một trong hai**
- **(A) Đề xuất:** thanh dưới 4 ô trên điện thoại.
  - Ô «Thêm» chứa: Điểm danh, Ca kiểm tra, Hỏi A.I, Thông báo, Cài đặt (Âm thanh · Rung · Cập nhật bài học), Của em (Bài gia đình giao · Thông tin từ gia đình · Đăng xuất).
  - Khi có buổi học mở mà em chưa điểm danh, Lộ trình hiện thêm **thẻ Điểm danh** ngay đầu trang (thay thẻ dọc thò ở mép phải).
  - Đường vào ca: băng «Ca kiểm tra đang mở» + nút «Vào ca» ở đầu Lộ trình, như cũ.
- **(B)** Giữ menu mép phải đã chốt 27/10, chỉ đổi hình theo hệ mới.
- Lý do đề xuất (A): ngón cái với tới, học sinh thấy ngay 3 mục chính mà không phải mở menu, và đây là thứ gợi Duolingo rõ nhất.

## 3. Trạng thái (có trong bản vẽ)

| Màn | Trạng thái đã vẽ |
|---|---|
| Đăng nhập | Đã nhập SBD + mật khẩu (giữ chữ: «Lần đầu chưa có để trống để đặt», «Quên mật khẩu: nhắn thầy để đặt lại.») |
| Lộ trình · ngày thường | Chặng xong / đang học (vòng đoạn 2/6) / khoá; Tự sửa lỗi khoá (đếm 3); BTVN (đếm 1); rương; Mol + bong bóng; thẻ Gõ cửa |
| Lộ trình · ngày Kiểm tra ôn tập | Thẻ Điểm danh gọn; Kiểm tra ôn tập (vòng benzen) đứng đầu, đang mở thẻ bật ra «Bắt đầu»; chặng khoá đến khi làm xong |
| Lộ trình · ca đang mở | Băng «Ca kiểm tra đang mở» + «Vào ca»; Mol nhắc vào ca trước |
| Lộ trình · đủ mức | «Đủ mức hôm nay! Đã làm 17 câu (mức 12)»; dải gọn khi cuộn; Tự sửa lỗi xong; BTVN là việc chính; «Học thêm câu mới» |
| Làm câu | Câu mới (Tự làm câu này / Học cách giải); trắc nghiệm đang chọn + Gợi ý + phương trình dài; Đúng–sai 4 ý (chưa đúng 3/4); Trả lời ngắn + bàn phím số (Chính xác!, cách nghĩ một phép tính) |
| Kết chặng | Mạch 6 câu, 3 ô số, nguyên tử 18/24, «Học tiếp chặng 4» / «Nghỉ và về Lộ trình» |
| Luyện tập | 6 ô; Tự sửa lỗi đứng đầu, nổi bật khi còn câu |
| Thành tích | Chuỗi 12 ngày + 7 ô ngày; Huy hiệu · Chuỗi ngày · Giải tuần · Học cùng bạn · Thử thách Kim cương · Cửa hàng; Điểm thầy đã công bố |
| Thêm | Điểm danh 6 ô mã (đang gõ), Ca kiểm tra, Hỏi A.I, Thông báo (2), Cài đặt, Của em |
| A.I Đỗ Đại Học | Đang trực; ảnh đề; trả lời theo sơ đồ cột dọc; «Tôi đang nghe đây…»; 3 nút ảnh/dán; lượt nhắn |

Các trạng thái giữ hành vi cũ, chỉ mặc theo hệ mới khi build: đang tải (khung xương), lỗi + «Thử lại», mất mạng, tạm đóng app, máy yếu.

## 4. Dữ liệu

- **Không thêm lệnh máy chủ, không đổi API.** Mọi số trên màn đều lấy từ nguồn đang có của `TrongHs.tsx` / `ThanhThuong` / `ManLamBaiTap`:
  - chuỗi, nguyên tử, tinh thể, `so.daLam` / `so.muc`;
  - chặng (`tt`, `co`, `phan`), `soDoan` / `daDoan`;
  - `kiem.*`, `soSua`, `soBaiTap`, `tq.bat.*`.
- Màu của từng ô trong mạch nhỏ (tự làm đúng / có hỗ trợ / sai) dùng đúng trạng thái câu đang có: «tự làm đúng · sai · có hỗ trợ · đang làm · chưa làm».
- Số trong bản vẽ là dữ liệu giả sát thực tế: Bài 9 Amino acid (P1), mức 24 và 12. Đáp án hai câu tính đã tự kiểm:
  - 0,1 mol alanine → 0,1 × 111 = 11,10 g;
  - 0,1 mol glycine → muối ClH₃NCH₂COOH: 0,1 × 111,5 = 11,15 g.

## 5. Ngoại lệ

- **Màn thi thật (`ExamTakeScreen`), phòng chờ, cảnh báo rời màn, khoá bài: KHÔNG đổi trong đợt này** (luật C-RÀO). Khi build chỉ có thể thay màu khung, chữ giữ nguyên văn.
- **Kiểm tra ôn tập (`ManKiemTraCaNhan`) thuộc làn Codex.** Chỉ vẽ nút trên Lộ trình. Màn bài sẽ giao Codex mặc theo hệ mới qua `docs/viec-giao-codex.md` sau khi thầy chốt.
- **Chữ hoặc công thức dài:**
  - tên bài dài: dải gọn cắt «…»;
  - phương trình: một dòng trong ô cuộn;
  - lời Mol: bong bóng co theo chữ và né nút (giữ `bong-bong-mol.ts`).
- **Số đột biến:**
  - mức 36: electron nhỏ lại (r 5,2);
  - vượt mức: electron vàng ở vòng ngoài;
  - đếm Tự sửa lỗi / BTVN ≥ 10: phù hiệu tự giãn ngang.
- **Máy yếu (`ddh.mayYeu`) và giảm chuyển động:**
  - mạch liên kết, nguyên tử mục tiêu, vòng đoạn là SVG tĩnh, không có hoạt ảnh vô hạn;
  - bóng mềm đổi thành viền;
  - không làm mờ nền sau thanh dưới (bỏ `backdrop-filter`);
  - Mol giữ đúng luật máy yếu đã có.
- **Bấm lặp, đổi tab, mất mạng:** giữ nguyên logic hiện tại (chỉ đổi giao diện).

## 6. Chi phí máy chủ + tốc độ

- **Máy chủ:** 0 lượt đọc/ghi D1 mới, 0 vòng chờ mới. Đáp án vẫn không xuống máy trước khi nộp (không đụng luồng chấm, `dap-an-may`).
- **Tải app:**
  - bỏ mặt nạ công thức data-URI trong `trong-hs.css` (~4,2 KB chưa nén);
  - bỏ các luật gờ đáy 3D;
  - lưới ô ly chỉ là 2 dòng CSS;
  - mạch liên kết là SVG vẽ bằng mã, không thêm tệp ảnh;
  - không thêm phông.
  - Mục tiêu: byte mở app HS và cổng HS đã đăng nhập ≤ mốc trong `docs/moc-toc-do.json` (mốc chỉ hạ).
- **Phương án đổi phông (KHÔNG có trong bản vẽ):** nếu thầy muốn khác hẳn chữ Duolingo, có thể dùng Inter (đã có trong repo cho app phụ huynh). Thêm khoảng 58 KB (Inter latin 48 KB + tiếng Việt 10 KB), nạp lười sau khi vẽ xong. Em không khuyên làm: chữ tròn thân thiện với học sinh hơn, và vi phạm mốc tốc độ nếu nạp sớm.

## Chưa vẽ trong lượt này (lượt 2, sau khi thầy chốt ngôn ngữ hình)

Lượt này vẽ 14 màn em mở hằng ngày để thầy duyệt **ngôn ngữ hình**. Các màn dưới đây sẽ mặc cùng hệ (ô nguyên tố, thẻ, nút phẳng, mạch nhỏ, nền ô ly) và vẽ ở lượt 2:

| Màn | Sẽ thừa hưởng |
|---|---|
| Tự sửa lỗi (`ManTuChua`), Chữa câu sai (`ManChuaCauSai`) | Số lớn kiểu ô nguyên tố. «Đường tự gỡ» vẽ như mạch nhỏ (mỗi bước một ô) |
| Học cách giải (từng bước), tấm «Xem lời giải đầy đủ» | Thẻ «Cách nghĩ» như màn Trả lời ngắn. Sơ đồ cột dọc theo `tu-duy-day-hoa-thay-2610.md` |
| Tu luyện, Câu đã làm, Bài tập về nhà, Bài gia đình giao | Ô lớn + dòng hành động như Luyện tập / Thêm |
| Huy hiệu, Giải tuần, Cửa hàng, lịch Chuỗi ngày, Học cùng bạn, Thử thách Kim cương | Lưới ô nguyên tố. Huy hiệu là ô có số |
| Kết quả sau nộp, lịch sử ca, tấm Thông báo, phủ «tạm đóng app» | Thẻ + chip theo hệ. Chữ của luồng thi giữ nguyên văn |
| Màn thi thật (`ExamTakeScreen`) | **Không đổi** (C-RÀO) |
| Kiểm tra ôn tập (`ManKiemTraCaNhan`) | Làn Codex. Giao sau khi thầy chốt |

## Chữ mới đề xuất (chưa có trong app — thầy duyệt cùng ảnh)

| Chỗ | Chữ mới | Ghi chú |
|---|---|---|
| Thanh dưới | **Thêm** | Ô chứa Điểm danh, Ca kiểm tra, Hỏi A.I, Thông báo, Cài đặt, Của em |
| Câu mới, lối Tự làm | «Làm đúng ngay được tính tự làm đúng» | Dòng phụ. App hiện chỉ có tên nút |
| Câu mới, lối Học cách giải | «Xem từng bước rồi làm lại câu tương tự» | Dòng phụ |
| Câu mới, dòng hỏi | «Câu này mới với em. Em muốn bắt đầu thế nào?» | |
| Thẻ kết quả (trả lời đúng) | Khối «Cách nghĩ» (một phép tính) | Lời giải ngắn ngay trên thẻ |
| Kết chặng | «tự làm đúng · có hỗ trợ · cần sửa» | Dùng đúng tên trạng thái câu đang có |
| Thêm | «Nhập mã ca thầy cho để vào làm» · «Chụp đề, hỏi bài, tâm sự» · «Tải bài mới thầy vừa giao» | Dòng phụ |
| Nguyên tử mục tiêu | «Mỗi câu làm xong thắp một electron» | Chỉ ở cột «Hôm nay» trên màn rộng |

Mọi chữ khác lấy đúng từ app thật:
- `TrongHs.tsx`: «Học tiếp», «Bắt đầu», «Đủ mức hôm nay! Đã làm 17 câu (mức 12)», «Tiếp theo: …», lời Mol, «Lửa đôi 3 ngày», «Gõ cửa», «20 câu · khoảng 30 phút · hạn nộp 21:00», «Thứ Năm 06/11 · còn 4 ngày», 6 ô Luyện tập, các ô Thành tích, «Điểm thầy đã công bố».
- `ManLamBaiTap.tsx`: «Học cách giải», «Tự làm câu này», «Gợi ý», «Kiểm tra», «Câu tiếp theo», «Xem lời giải đầy đủ».
- Màn đăng nhập và A.I: theo kiểm kê + bảng từ chuẩn. A.I xưng «tôi», gọi «bạn».

## 7. Nghiệm thu đo bằng máy

- **Ảnh bản vẽ (đã đạt):** 84 ảnh Chromium, 0 lỗi trang, 0 tràn ngang, 0 đích bấm < 44 px, 0 chữ bị cắt, **0 cặp chữ/nền dưới ngưỡng tương phản** (`node chup.cjs …` in TỔNG).
  - Cách đo tương phản: tính màu chữ thật so với nền thật của từng chữ, cả sáng lẫn tối. Ngưỡng giống `scripts/do-tuong-phan-hs.mjs`: chữ thường ≥ 4,5:1; chữ to và chữ đậm trên nút / huy hiệu ≥ 3:1.
  - Hệ quả: chữ nhỏ không đặt trên mặt tô đậm ở bản sáng, vì trắng trên chàm chỉ đạt 3,4:1. Thẻ bật ra, Điểm danh, lối «Tự làm câu này», ô số bài, bong bóng tin nhắn của em và nhân nguyên tử mục tiêu đều dùng nền nhạt + chữ đậm cùng họ màu.
- **Khi build:**
  - `tsc`;
  - vitest các tệp Lộ trình / Mol / bong bóng / chặng ngang / `ktcn-ngang-0211` / `bo-cuc-lam`;
  - test mới `tests/ban-sac-hs-0211.test.ts`: nguyên tử mục tiêu đúng số electron với mức 12/24/30/36 và vượt mức; mạch đúng kiểu liên kết theo trạng thái; không còn bóng gờ đáy trên nút HS;
  - `npm run build && npm run kiem:toc-do` 0 đỏ;
  - `npm run kiem:mau-giu` 0;
  - `npm run check:mau`;
  - `node scripts/kiem-sw.mjs`;
  - ảnh bản thật ở 390×844 · 844×390 · 904×690 (Fold mở) · 1440×900, sáng/tối;
  - tác tử `toc-do` sau gộp.

**Thứ tự build đề xuất** (mỗi bước một PR nhỏ, lùi được):
1. Token hình dạng + nút phẳng + nền ô ly.
2. Mạch liên kết Lộ trình + nguyên tử mục tiêu.
3. Màn làm câu + thẻ kết quả.
4. Luyện tập / Thành tích / Thêm + điều hướng (theo lựa chọn A/B).
5. Đăng nhập + A.I.
