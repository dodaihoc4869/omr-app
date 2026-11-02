# Đề xuất: bộ đo hằng ngày Học thật · Đối phó · Chăm · Lười — lấy TRÊN LỚP làm thước

**02/11/2026.** Thầy: «quét bộ đo học thật, chăm, lười đối phó. Sau đó đề xuất để biết được chính xác học sinh thuộc nhóm nào. Sử dụng mọi dữ liệu, bài kiểm tra trực tiếp tôi mở trên lớp và đạt hay không đạt khi gọi lên bảng làm căn cứ. Tạo bộ đo cập nhật hàng ngày … học sinh đối phó phải có bộ đo chính xác 100%.» · «tham khảo mọi phương pháp tốt nhất thế giới» · «đề xuất cho tôi trước khi build».

Nguồn số: workflow chỉ-đọc `.github/workflows/do-bon-bang-0211.yml` (run 41394902869, 41395086695, 02/11 12:35 VN) — chỉ đếm gộp trên bảng nhỏ, không mã em, không tên, không quét `su_kien_hoc`.

---

## 1. Kết quả quét (bản đang chạy v3b, tính sáng 02/11, 271 em)

| Bảng | Số em | Ghi chú |
|---|---|---|
| Học thật | **240** (89%) | 114 em KHÔNG có xác nhận trên lớp nào (ca thi khớp ≥ 2 đơn vị hoặc lên bảng đạt ≥ 2) |
| Đối phó | **30** | 21 em có bằng chứng trên lớp · **9 em chỉ do hành vi ở nhà** · 4 em chỉ vì một họ «treo máy» |
| Chăm | 230 | |
| Lười | 42 | |

Họ Đối phó đang bật (trong 30 em): lệch ca thi 21 · chọn vội 15 · bỏ mặc câu sai 11 · treo máy 10 · thuộc đáp án 8 · lên bảng chưa đạt 7 · bấm lặp 2.

Dữ liệu trên lớp:
- **Ca thi: 20/20 ca trong 60 ngày đều có phòng chờ + thầy bấm «Bắt đầu» (đồng bộ giờ)** ⇒ đúng là bài thầy mở trên lớp, dùng làm thước được. 246/272 em có ca thi, 195 em có ≥ 6 câu thi ghép được với luyện tập, trung bình 84 câu thi/em.
- **Lên bảng: 317 dòng nhưng 316 nhóm là CẶP TRÙNG** (cùng em, cùng câu, cùng kết quả, cách nhau trung bình 0,85 giây). Thật ra chỉ có **159 lượt** lên bảng, 122 em: 91 em lên 1 câu, 25 em 2 câu, 6 em 3 câu.
- Kiểm tra đầu giờ: 52 câu (33 đạt, 1 chưa đạt, 18 chưa chấm).

## 2. Chỗ sai và chỗ hở

1. **Lỗi ghi đôi lên bảng (lỗi thật, ảnh hưởng ngay).** `ghiLenBang` ở app thầy (`src/lib/exam-api.ts:2577`) gửi lệnh cũ `action: ghiLenBang` — mà địa chỉ «Apps Script» nay CHÍNH là Worker (`server/src/index.ts:3404` xử lý lệnh cũ ⇒ ghi) — rồi lại «soi sang máy chủ mới» `/len-bang` ⇒ ghi lần hai. Hệ quả:
   - Luật «chưa đạt MỘT lần ⇒ không tính» bị phá: 1 lần chưa đạt thành 2 ⇒ bật họ `bangChua` ⇒ có em bị đẩy về Đối phó oan.
   - «Lên bảng đạt ≥ 2» (101 em Học thật) phần lớn là MỘT lần đạt bị nhân đôi.
   - EXP lên bảng của em bị cộng gấp đôi; hồ sơ lên bảng, bảng mạnh–yếu đếm gấp đôi.
2. **Học thật là nhãn «mặc định khi không bị bắt».** `vaoHt = có bằng chứng && !vaoDp` (`server/src/bon-chi-so.ts`) ⇒ em chỉ cần có lượt làm là Học thật. 89% trung tâm Học thật là quá lỏng.
3. **Đối phó còn kết luận bằng suy đoán.** 9/30 em chỉ có hành vi ở nhà; «treo máy» một mình đủ vào Đối phó; «bỏ mặc câu sai» (là Lười, không phải đối phó kiến thức) đang cộng sức Đối phó.
4. **Dữ liệu đã thu mà chưa dùng:** mã máy luyện tập `tb` (thu từ 01/11, `server/src/do-giay-luot.ts`) — chưa bắt «hai số báo danh cùng một máy cùng buổi» (làm hộ); chưa đo trùng đáp án SAI hiếm giữa hai em cùng giờ (chép).
5. **Con số 99,7–100% là vòng tròn:** đo trên học sinh mô phỏng do chính máy sinh theo đúng luật của nó. Chưa có số đo độ chính xác trên dữ liệu thật.
6. **Nhãn không có độ bám:** tính lại mỗi ngày từ cửa sổ trượt ⇒ em có thể lật Học thật ⇄ Đối phó qua lại mà không có sự kiện mới; không có nhật ký đổi nhãn.
7. Đơn vị so chỉ ở mức **chuyên đề** — thô: em giỏi «este» mà hỏng «bài toán đốt cháy este» vẫn bị trộn.

## 3. «Chính xác 100%» nghĩa là gì

Không phương pháp thống kê nào chứng minh được 100% khi chỉ suy từ hành vi. Thứ làm được 100% là **định nghĩa bằng sự kiện thầy tận mắt chứng kiến**:

> **Đối phó** = có **≥ 2 sự kiện trên lớp ở ≥ 2 buổi khác nhau**, mỗi sự kiện là: ở nhà em đã làm ĐÚNG (lần đầu, không gợi ý, không xem lời giải) câu hoặc dạng X, lên lớp (ca thi thầy mở / gọi lên bảng / kiểm tra đầu giờ) em làm SAI đúng câu hoặc dạng X.

Đã loại trừ: câu trên lớp khó hơn (hiệu chỉnh độ khó Rasch), dạng em chưa luyện đủ, một buổi kém (ốm, run — bỏ buổi kém nhất vẫn phải còn ≥ 2 sự kiện). Mỗi em Đối phó có kèm danh sách sự kiện (ngày · câu · ở nhà đúng lúc mấy giờ · trên lớp sai buổi nào) — thầy, em, phụ huynh đều kiểm được, không cãi được. Hành vi ở nhà (chọn vội, dò đáp án, rời app rồi đúng, làm hộ) **không tự gán nhãn**, chỉ dùng để (a) giải thích em đối phó BẰNG CÁCH NÀO, (b) chọn ai cần gọi lên bảng trước.

## 4. Bộ đo mới

### 4.1 Trục chất lượng (thầy cần chọn A hoặc B — mục 6)

| Nhãn | Điều kiện |
|---|---|
| **Đối phó (đã kiểm trên lớp)** | như mục 3 |
| **Học thật (đã kiểm trên lớp)** | ≥ 2 buổi trên lớp mà kết quả khớp hoặc cao hơn kỳ vọng từ luyện tập (ca thi khớp ≥ 2 dạng, hoặc lên bảng / đầu giờ đạt ≥ 2 câu khác nhau), 0 sự kiện lệch |
| **Cần kiểm trên lớp** | chưa đủ sự kiện trên lớp. KHÔNG phải «theo dõi» thụ động: mỗi ngày app đưa thầy **danh sách gọi lên bảng / đầu giờ**, mỗi em 2–3 câu em đã làm đúng ở nhà, ở dạng ca thi chưa phủ; em nghi đối phó (hành vi) xếp trước. Chốt nhãn trong ≤ 2 buổi |

### 4.2 Phương pháp (chuẩn thế giới) → luật cụ thể

| Phương pháp | Dùng vào đâu |
|---|---|
| **Kiểm chứng có giám sát cho điểm không giám sát** (cách các kỳ thi trực tuyến kiểm điểm làm tại nhà bằng bài kiểm lại có giám sát) | Ở nhà = không giám sát; ca thi phòng chờ / lên bảng / đầu giờ = có giám sát. Đối phó = trượt bài kiểm lại |
| **Mô hình Rasch / IRT** (đã có) + **chỉ số lệch mẫu (person-fit)** | Hiệu chỉnh độ khó câu trên lớp; ở nhà «đúng câu khó, sai câu dễ» bất thường ⇒ tín hiệu nghi |
| **Đo nỗ lực theo thời gian trả lời (rapid guessing)** (đã có — chọn vội) | Tín hiệu nghi + loại câu vội khỏi «làm thật» của Chăm |
| **Chỉ số chép bài** (trùng đáp án SAI hiếm giữa hai em, cùng giờ) | Tín hiệu nghi mạnh, kèm cặp em + câu |
| **Mã máy** (`tb`, không IP) | Hai số báo danh cùng máy cùng buổi ⇒ nghi làm hộ, đưa cả hai lên đầu danh sách gọi |
| **Theo dõi thành thạo theo dạng (knowledge tracing)** | Đơn vị so = **dạng** (`ma_dang`) khi đủ lượt, thiếu thì chuyên đề; chọn câu gọi lên bảng có lượng thông tin cao nhất |
| **Kiểm định tuần tự (SPRT)** | Mỗi sự kiện trên lớp cập nhật tỉ số khả năng «đối phó / học thật»; vượt ngưỡng mới chốt, chưa vượt thì gọi tiếp — biết KHI NÀO đủ chắc thay vì ngưỡng cứng |
| **Độ bám (hysteresis)** | Nhãn chỉ đổi khi có sự kiện trên lớp mới. Ra khỏi Đối phó cần 2 lần đạt ở đúng dạng từng lệch |
| **Kiểm định ngược trên dữ liệu thật** | Với mỗi buổi trên lớp đã qua: tín hiệu ở nhà TRƯỚC buổi đó có dự đoán đúng Đạt / Chưa đạt không ⇒ độ chính xác THẬT của từng tín hiệu, báo mỗi tuần, tự hạ trọng số tín hiệu kém. Không tốn thêm thời gian của thầy |

### 4.3 Trục công sức
Giữ luật v3b (ngày đủ mức bằng câu làm thật, làm cho có ≤ 10%, không dồn sát giờ chốt). Chuyển «treo máy» và «bỏ mặc câu sai» sang lý do **Lười** (đang cộng nhầm vào Đối phó).

### 4.4 Cập nhật hằng ngày
- Cron 00:00–06:00 tính lại toàn bộ 271 em (~11 phút, đã có), ban ngày chỉ tính lại em vừa có sự kiện trên lớp.
- Bảng chỉ-thêm `bon_nhan_nhat_ky`: mỗi lần em đổi nhãn ghi (ngày, nhãn cũ → mới, sự kiện gây ra) ⇒ màn Hôm nay hiện «Hôm nay: +2 Đối phó, −1 Đối phó» bấm xem lý do.
- Không thêm lệnh nóng, không thêm vòng chờ D1 nối tiếp; byte mở app giữ nguyên.

## 5. Kế hoạch build

1. **Đợt 1 — máy chủ, không đổi giao diện (làm ngay khi thầy chốt):**
   - Sửa ghi đôi lên bảng (app thầy chỉ gửi MỘT đường + máy chủ chống trùng theo em·câu·kết quả trong 10 giây).
   - Dữ liệu cũ: KHÔNG xoá dòng nào; khi đọc thì gộp cặp trùng ≤ 2 giây (cả bộ đo, EXP, hồ sơ).
   - Luật Đối phó / Học thật theo mục 3–4, đơn vị theo dạng, độ bám, nhật ký đổi nhãn, kiểm định ngược.
   - Test mô phỏng giữ nguyên + test sự kiện trên lớp; đếm lại bằng workflow chỉ-đọc trước/sau.
2. **Đợt 2:** mã máy (làm hộ) + chỉ số chép bài.
3. **Đợt 3 — giao diện mới:** thẻ «Gọi lên bảng hôm nay» ở Hôm nay app thầy (bấm là vào Gọi lên bảng với đúng em + câu) và nhãn «Cần kiểm trên lớp». Có bản vẽ 3 khổ sáng/tối để thầy duyệt trước (quy trình 4 bước).

## 6. Thầy cần quyết một việc

- **A (khuyên dùng):** ba nhãn chất lượng như 4.1. Đối phó và Học thật đều 100% có sự kiện trên lớp làm chứng. Em chưa đủ sự kiện nằm ở «Cần kiểm trên lớp» kèm danh sách câu để gọi — trái với lệnh 02/11 «không còn theo dõi nữa», nhưng là cách DUY NHẤT để Đối phó đúng 100%.
- **B:** giữ hai nhãn như v3b (mọi em đều có nhãn). Em thiếu sự kiện trên lớp xếp theo hành vi, ghi thêm «(chưa kiểm trên lớp)». Khi đó nhóm Đối phó KHÔNG còn 100%.

Mọi thứ khác (ngưỡng, trọng số, chỗ đặt) em tự quyết khi build.
