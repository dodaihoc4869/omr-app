# Đặc tả «Chạm để hiểu đề» và «Gợi ý 3 tầng» (26/10)

Trạng thái: **BẢN VẼ CHỜ THẦY DUYỆT. Chưa build.**

Thầy (26/10), nguyên văn:
- «khi chạm vào đơn vị thì được hiển thị giải thích đơn vị này có ý nghĩa gì ngắn gọn, siêu đẹp dễ hiểu để học sinh định hướng, chạm vào câu hỏi thì biết bắt đầu từ đâu, mỗi bài sẽ tô màu đẹp vào chỗ chạm để gợi ý được … giống doligo. vẽ cho tôi xem trước khi duyệt build»
- «phần gợi ý phải có ý nghĩa thực sự cho bài đó … hiển thị đẹp hơn doligo»
- «nếu đề cho tên công thức bấm vào hiện tên công thức nữa … tuỳ từng bài in đậm thêm thông tin chỗ nào»

Bản vẽ:
- Ảnh: `anh/` (3 khổ × sáng/tối).
- Tấm duyệt: `bang/`.
- Màn HTML: `doc-de-*.html`.
- Bộ khung lấy từ «Trong» (`../ban-ve-trong-2610/`), không có màu mới.

Đề mẫu do tôi tự soạn, số khớp nhau:
- 8,8 g ethyl acetate, M = 88 ⇒ 0,1 mol.
- 100 mL NaOH 1,5 M ⇒ 0,15 mol.
- Đáp án là 10,2 g (CH₃COONa 8,2 g + NaOH dư 2 g). Bản vẽ không đánh dấu phương án nào.

## 1. Mục tiêu sư phạm, ai dùng

Người dùng là học sinh, ở **màn luyện**: Học tập/game, Tu luyện, Tự sửa lỗi, Ôn lại. Mục tiêu là em **đọc hiểu đề** trước khi tính: đề cho gì, hỏi gì, chất nào, từ nào quyết định cách làm.

Bốn lớp, từ nhẹ đến nặng:

| Lớp | Em thấy gì | Có tính là trợ giúp không |
|---|---|---|
| Tô màu sẵn | Số liệu + đơn vị nền chàm (Đề cho). Câu hỏi nền hổ phách (Đề hỏi). Chất gạch chấm xanh. Từ then chốt in đậm. | Không |
| Chạm một chữ | Thẻ giải nghĩa: đơn vị (nghĩa + công thức chung), chất (tên IUPAC + tên cũ + loại + M), công thức (ngược lại, ra tên), từ then chốt (nghĩa + câu tự hỏi) | Không (như tra từ điển) |
| «Bắt đầu từ đâu?» gợi ý 1–3 | Gợi ý **viết riêng cho câu này**, mở từng tầng: ① Đề đang nói gì (kèm sơ đồ phản ứng) · ② Chìa khoá của bài · ③ Bước đầu tiên (phép tính đầu với số của bài, không ra kết quả) | **Có** (quyết định B 20/10) |
| «Học cách giải» | Như hiện nay | Có |

**Đẹp hơn Duolingo ở chỗ «soi sáng»:**
- Mở gợi ý thì đề mờ đi. Chỉ những chữ mà tầng đang nói tới **sáng lên** (viền vàng).
- Em thấy ngay mình cần nhìn vào đâu.
- Tầng sau khoá, chỉ mở khi em bấm «Gợi ý tiếp».

## 2. Bố cục 3 khổ

**Điện thoại dọc (390px)**
- Câu là nhân vật chính.
- Dải chú giải màu nằm một dòng trên đề.
- Chạm chữ ⇒ tấm trượt từ đáy (có thanh kéo, nút «Đã hiểu» rộng hết).
- Gợi ý 3 tầng nằm **giữa đề và phương án**, nên đề vẫn nhìn thấy, không bị che.

**Điện thoại ngang / máy tính bảng (≤ 900px)**
- Như điện thoại dọc: tấm trượt từ đáy, rộng tối đa 640px.
- Lý do: máy chạm, và thẻ nổi bị tràn mép (đã thấy ở bản vẽ).

**Máy tính (1440px)**
- Thẻ nổi neo ngay dưới chữ được chạm, có mũi nhọn.
- Gợi ý 3 tầng nằm giữa đề và phương án.

Đích chạm:
- Chữ tô màu có vùng chạm nới thêm 10px trên/dưới.
- Mọi nút ≥ 44px. Bộ chụp đo được 0 đích nhỏ.

## 3. Trạng thái

| Trạng thái | Hiển thị |
|---|---|
| Thường | Đề tô màu sẵn, nút «Bắt đầu từ đâu?» |
| Đang chạm | Chữ có viền, thẻ giải nghĩa mở. Chạm chỗ khác hoặc «Đã hiểu» thì đóng. |
| Đang xem gợi ý | Chip «Đang xem gợi ý». Đề mờ, chữ liên quan sáng. 3 vạch tiến độ gợi ý. |
| Câu chưa có gợi ý soạn sẵn | Gợi ý tự sinh từ đề: Đề cho · Đề hỏi · Bước đầu (đổi dữ kiện ra mol) |
| Câu lý thuyết | Chỉ tô câu hỏi + bẫy «không đúng». Gợi ý riêng: đề nói gì · mảng kiến thức · câu tự hỏi (vd «thu N₂ bằng đẩy nước ⇒ tan nhiều hay ít?») |
| Mất mạng | Tô màu, chạm chữ vẫn chạy (từ điển trên máy). Gợi ý soạn sẵn báo «Chưa tải được gợi ý, em thử lại», kèm gợi ý tự sinh. |
| Ca thi, KTCN, chấm điểm thật | **Tắt hết** (đề trơn như hiện nay) |

## 4. Dữ liệu

### Số đo thật trên kho
D1 bản sống, chỉ đếm, run 40321020325, 26/10; 15 359 câu `game_v2_question`.

| Điều đếm | Phần I (8 882) | Phần II (2 514) | Phần III (3 963) |
|---|---|---|---|
| Đề có số + đơn vị (gam, mol, lít, mL, M, %) | 868 (9,8%) | 537 (21,4%) | 1 543 (38,9%) |

Các đếm khác trên cả kho:
- **Điều kiện khí:**
  - «đkc»: 123 câu;
  - «đktc»: 4 câu;
  - «24,79»: 10 câu;
  - «22,4»: 0 câu.
  ⇒ Thể tích mol lấy theo đúng chữ của đề, không gắn cứng một giá trị.
- **«nguyên tử khối» trong đề:** 169 câu. Có thì dùng đúng số của đề.
- **Câu hỏi bẫy:**
  - «không đúng»: 527;
  - «nào sau đây sai»: 102;
  - «không phải»: 111;
  - «phát biểu sai»: 12.
  - Nhiễu không được tô: «không khí» 163, «không màu» 67.
- **Nguy cơ nhận nhầm đơn vị M:** «kim loại M» 20; «Giá trị của m» 362. M chỉ là đơn vị khi đứng sát ngay sau một con số.
- **Câu hỏi nhận ra được:**
  - đề kết thúc bằng «… là»: 3 656;
  - «là bao nhiêu»: 1 289;
  - «Giá trị của»: 637;
  - «Tính»: 444.

**Kết luận:** kho chủ yếu là câu lý thuyết; chỉ khoảng 19% câu có số liệu. Vì vậy hai lớp giúp được nhiều câu nhất là **tên chất / công thức** và **từ then chốt**, chứ không phải đơn vị.

### Nguồn từng lớp

- **Tô màu, đơn vị, chất, từ then chốt:**
  - Hàm thuần chạy trên máy em, chỉ đọc chữ đề (thân câu và các ý Đ/S), không bao giờ đọc đáp án hay lời giải.
  - Từ điển:
    - đơn vị: khoảng 25 mục;
    - chất: khoảng 400 chất chương trình GDPT 2018, gồm tên IUPAC + tên cũ + loại;
    - từ then chốt: khoảng 40 cụm, ví dụ «hoàn toàn», «vừa đủ», «dư», «đun nóng», «cô cạn», «khan», «đkc/đktc», «trung hoà», «điện phân», «thu được kết tủa».
  - M tính bằng mã từ công thức và bảng nguyên tử khối SGK, hoặc từ số của đề nếu đề có ghi. Không gõ M bằng tay.
- **Gợi ý 3 tầng viết riêng cho từng câu:**
  - Máy soạn từ đề + lời giải đã có (kho có `solution` cho 99,96% câu; hồ sơ lời giải thầy duyệt khi có).
  - Mỗi câu một bản: `{deNoiGi, soDo?, chiaKhoa, buocDau, chuSang[tầng]}`. `chuSang` là chữ trong đề sẽ sáng lên ở mỗi tầng.
  - Lưu ở bảng mới chỉ-thêm `goi_y_cau` theo băm câu.
  - Chỉ tải khi em bấm «Bắt đầu từ đâu?», qua một lệnh mới. Lệnh này ghi luôn «có trợ giúp».
  - Hai cửa kiểm trước khi dùng:
    - (a) máy chặn bản nào chứa đáp án hoặc kết quả cuối;
    - (b) lượt kiểm hoá học thứ hai, rồi thầy duyệt mẫu.
  - Thứ tự soạn:
    - 543 câu có từ 5 em cùng sai (chiếm 84% đợt sai 14 ngày);
    - câu đang giao;
    - phần còn lại.
  - Câu chưa có bản soạn: dùng gợi ý tự sinh (Đề cho · Đề hỏi · Bước đầu).

## 5. Ngoại lệ

- **Không bao giờ tô màu phương án A–D.** Lớp này không dùng màu xanh/đỏ, vì trước khi nộp, xanh/đỏ trông như chấm điểm.
- **«không»:**
  - chỉ tô trong mẫu câu hỏi «… nào sau đây không đúng / sai / không phải …»;
  - không tô «không khí», «không màu», «không tan».
- **Chữ M:** chỉ là đơn vị khi đi ngay sau một số («0,5M», «1 M»). «Kim loại M», «M = …», «Giá trị của m» không phải đơn vị.
- **Công thức nằm cạnh chữ** (CH₃COOC₂H₅, ion, điện tích): ranh chữ chạm được cắt đúng ranh công thức. Chữ hoá vẫn hiện qua ChemText như hiện nay.
- **Đề rất dài, nhiều số:** tô hết số liệu, nhưng tầng 3 chỉ nói bước đầu.
- **Bấm liên tục / máy yếu:**
  - từ điển nạp lười ở lần chạm đầu;
  - tô màu tính một lần cho mỗi câu (ghi nhớ).

## 6. Chi phí

- Đường `/t` (thi): 0 byte (tắt).
- Màn luyện:
  - mảnh mới nạp lười, có từ điển chất;
  - vào kho chạy-lúc, không thêm tệp precache (đang 170/170 theo Boss).
  - Đo `npm run kiem:toc-do` 0 đỏ trước khi đẩy.
- Máy chủ:
  - tô màu và từ điển: 0 lệnh;
  - gợi ý soạn sẵn: 1 lệnh đọc khi em bấm (1 vòng D1);
  - soạn gợi ý chạy nền theo lô, ngoài 19–24h.
- Đo kho 26/10: truy vấn đếm lớn nhất 1,6 giây. Lượt đo lỡ chạy lúc 19:14 VN (giờ cao điểm), lần sau đo ngoài giờ ấy.

## 7. Nghiệm thu đo bằng máy

- Test hàm tô màu trên 60 đề mẫu viết tay, gồm cả các bẫy:
  - «kim loại M», «không khí», «22,4 vs 24,79», «Cho nguyên tử khối»;
  - công thức sát chữ, «Giá trị của m».
  - Yêu cầu: **0 tô sai** trên bộ bẫy.
- Đo trên kho sau build (chỉ đếm):
  - % câu có ít nhất 1 chữ chạm được;
  - mẫu 200 câu ngẫu nhiên do thầy hoặc máy soát:
    - tô sai ≤ 1%;
    - M tính sai = 0.
- Gợi ý soạn sẵn:
  - test chặn lộ đáp án: gợi ý chứa đáp án hoặc kết quả cuối thì không lưu;
  - phản hồi mở câu không có `correct`/`solution` (`kiem:lo-dap-an`);
  - bấm gợi ý ⇒ lượt nộp ghi `assistance: assisted`.
- Ảnh build khớp bản vẽ: 3 khổ × sáng/tối, tràn 0, đích nhỏ 0.
- Các cổng:
  - `kiem:mau-giu`: 0;
  - `check:mau`;
  - `kiem:toc-do`: 0 đỏ;
  - precache không vượt trần.

## 8. Cần thầy quyết (có mặc định)

1. **Có bật trong ca thi / KTCN / BTVN chấm điểm không?** Mặc định: **tắt**, chỉ bật ở màn luyện.
2. **«Bắt đầu từ đâu?» có tính là gợi ý (có trợ giúp) không?** Mặc định: **có**, giữ quyết định B. Chạm tra đơn vị / chất / từ then chốt thì **không** tính.
3. **Tên chất:** mặc định hiện tên IUPAC to, tên cũ nhỏ.
4. **Soạn gợi ý riêng:** mặc định 543 câu nhiều em sai trước. Thầy duyệt 20 câu mẫu rồi mới chạy lô.

## 9. Chia làn

| Phần | Ai |
|---|---|
| Hàm tô màu, từ điển, thẻ giải nghĩa, khung gợi ý trên màn luyện | Claude (Code app 3) |
| Một cờ bật/tắt trên `TheCau.tsx` (luồng thi) | Boss soát trước khi gộp |
| Bảng `goi_y_cau` + lệnh đọc gợi ý + máy soạn gợi ý theo lô | Cần Boss chỉ định (gần làn «máy soạn» của Codex) |

**Lưu ý:** Code app 1 (Boss) đang làm lại giao diện «Trong». Bản vẽ này dựng trên đúng bộ khung «Trong» để ghép vào không lệch.
