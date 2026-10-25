# Đề xuất: chữa câu sai GỌN, em được ghi nhận NGAY khi sửa xong — 25/10/2026

Trạng thái: **ĐẶC TẢ (bước 2 quy trình 4 bước). Chưa build.** Bản vẽ (Chromium thật, 3 khổ × sáng/tối) làm tiếp theo; thầy duyệt ảnh rồi mới build.
Thầy (25/10): "tôi muốn bạn đề xuất lại việc chữa câu đơn giản và hiệu quả nhất có thể, để học sinh thấy được ghi nhận ngay khi sửa xong, hiện tại đang quá phức tạp".
Tiếp nối và THAY phần luồng của `docs/dac-ta-tu-sua-y-nghia-2010.md` (quyết định A về 12 câu/ngày giữ nguyên).

## 0. Nói thẳng trước (số đo thật, D1 bản sống 25/10, chỉ đọc gộp — run 40171633930, 40172089822, 40172160844, 40172232917, 40172531297)

| Điều đo | Số thật |
|---|---|
| Đợt tự sửa đang mở | 24 262 của 266 em |
| Trong đó sai trong 14 ngày | 12 239 (50%) |
| Đợt mới mở mỗi ngày (18–24/10) | 666 – 1 077 đợt, 195–240 em ⇒ **3–5 câu sai mới / em / ngày** |
| Kênh sinh ra đợt 14 ngày | game 12 094 (98,8%) · tự luyện 121 · lên bảng 17 · thi 2 |
| Có lời giải trong kho (`solution`) | 12 234 / 12 239 (**99,96%**) |
| Có đáp án để máy chấm (`correct`) | 12 234 / 12 239 |
| Đợt chưa xong có học liệu từng bước (đường cũ cần) | 1 136 / 24 262 (4,7%); 23 099 đợt (94,9%) ở `thieu_hoc_lieu` |
| Đã ra "Đã tự sửa" | 89 / 24 351 (0,4%); 14 ngày: 9 lượt trên 1 716 lượt nộp |
| Dạng nhiều đợt nhất | Amine cấu tạo chọn phát biểu 1 091 · đếm đồng phân 762 · nhận dạng 683 · HNO₃ nhận dạng 502 … (đa số LÝ THUYẾT) |
| 543 câu gốc có ≥ 5 em cùng sai | chiếm 10 322 / 12 239 đợt (84%) |
| Có câu song sinh soạn sẵn (`cau_bo_tro`) | 1 214 / 12 239 (9,9%) |
| Có câu anh em cùng dạng, khác nội dung trong kho | 11 575 / 12 239 (94,6% — **trần trên**: chưa lọc khối em, câu em đã gặp) |
| **Em ĐÃ làm đúng lại chính câu gốc sau lần sai cuối, mà đợt vẫn mở** | **2 014 / 12 239 (16,5%)**, 1 938 trong số đó đúng ở ngày khác (chỉ tính đúng câu gốc; đúng bản khác chưa đếm ⇒ số thật lớn hơn) |

Kết luận:
1. **Có 2 014 câu em đã làm đúng lại (1 938 câu ở ngày khác ngày sai) mà app vẫn ghi "Cần sửa".** Em làm đúng lại trong game / luyện tập nhưng vòng chữa không biết. Luật đóng phải loại lượt đúng ngay sau khi em đọc lời giải (kiểm `loi_giai_hoi` như đường cũ). Đây là chỗ "không được ghi nhận" rõ nhất, sửa được ngay mà không cần màn mới (mục 4, dòng đồng bộ).
2. **Vì sao em không thấy được ghi nhận:** đường hiện tại có 6 trạng thái, phải qua "sửa từng bước → ghép cả bài → chờ ≥ 24 giờ → làm bản mới" mới tính "Đã tự sửa"; và 95% câu không có học liệu từng bước nên không bao giờ đi hết đường. Không phải em lười — đường không có lối ra.
3. **Học liệu đã đủ cho đường gọn:** gần 100% câu có lời giải + đáp án. Bản làm lại: song sinh soạn sẵn chỉ 9,9%, nên phần lớn sẽ là câu anh em cùng dạng (câu lý thuyết chiếm đa số) hoặc câu gốc xáo phương án. Không cần soạn thêm gì để chạy.
4. **Số câu sai mới (3–5/em/ngày) gần bằng sức chữa (12/ngày theo quyết định A)** ⇒ đủ để em theo kịp câu MỚI; 12 nghìn câu cũ không cần — và không nên — bắt em chữa hết.
5. **Sửa lời tôi đã đề xuất ở báo cáo quét (mục 4 "cộng EXP khi sửa"):** trái quyết định của thầy 20/10 ("Không EXP, không điểm thưởng, không xếp hạng" cho phần tự sửa). Bản này KHÔNG có EXP. Ghi nhận đến từ dấu tích, con số tiến độ, câu "Em đã tự sửa xong câu này" và dòng báo phụ huynh. Thầy muốn cộng EXP thì đó là đổi quyết định 20/10 — mục 8, câu hỏi 1.
6. **Một lỗi có sẵn phải sửa luôn:** màn "Sửa trên câu gốc" hiện tải **đáp án + lời giải xuống máy em ngay khi mở câu** (`hoa2-cau-chi-tiet` trả `dapAn`, `loiGiai`) rồi chấm trên máy; lệnh này **không ghi** `loi_giai_hoi` (đã kiểm `srs2-game.ts` `cauChiTiet` và chỗ gọi `game-v2.ts:314` — đóng điểm 6.1 của đặc tả 20/10). Em mở công cụ trình duyệt là thấy đáp án; máy chủ không biết em đã làm đúng. Đường mới chấm ở máy chủ.

## 1. Mục tiêu sư phạm + ai dùng
- **Học sinh:** sửa một câu sai mất 1–3 phút, làm đúng là **thấy ngay** "Đã tự sửa" (dấu tích, con số "Hôm nay đã tự sửa 5/12" nhảy lên). Sai thì được gợi ý vừa đủ, không bị đẩy sang hàng chờ 24 giờ.
- **Thầy:** câu em đã thử hết sức vẫn sai tự về danh sách **Cần thầy chữa** (sẵn có) — đúng chỗ cần dạy lại trên lớp.
- **Phụ huynh:** một dòng "Tuần này con tự sửa 23 câu từng sai · còn 4 câu cần thầy chữa".
- Cảm giác cần đạt: "sửa xong là được tính", "ít câu, làm được", không phải "155 câu chờ".
- Trung thực: "Đã tự sửa" là tự làm đúng, không xem lời giải; máy kiểm lại lặng lẽ sau vài ngày (mục 3) để con số không bị thổi phồng.

## 2. Luồng một câu (thay cả 6 bước cũ) + bố cục

```
Mở câu ─► Làm lại (máy chủ chấm)
            ├─ Đúng, lần 1, qua LUẬT TỰ LÀM ────► ✓ ĐÃ TỰ SỬA (ngay) ─► xem lời giải nếu muốn ─► câu kế
            └─ Sai ─► Gợi ý 1 (một bước đầu của lời giải) ─► Làm lại
                        ├─ Đúng ────────────────► xong phần hôm nay; câu hẹn lại sau 3 ngày (quyết định B 20/10: có gợi ý thì chưa là tự sửa)
                        └─ Sai ─► Lời giải đầy đủ ─► "Em đã hiểu" ─► xong phần hôm nay; câu hẹn lại sau 3 ngày
                                                   └─ "Em vẫn chưa hiểu" ─► Nhờ thầy (vào Cần thầy chữa)
```

- **Bản làm lại (chống học thuộc, chống đoán):**
  1. Có câu song sinh soạn sẵn (`cau_bo_tro`, `~ss`) hoặc biến thể bằng mã (`~bt`, Phần I/III tính toán) ⇒ em làm BẢN ĐÓ.
  2. Không có ⇒ câu anh em cùng dạng (bộ chọn sẵn có `cau-anh-em.ts`) — chủ yếu cho câu lý thuyết.
  3. Không có cả hai ⇒ chính câu gốc, Phần I/II **xáo phương án/ý** (bậc 3 của thang làm lại 05/10, hoán vị chỉ ở máy chủ), **không hiện lựa chọn cũ của em**.
  Đây là đúng thang 4 bậc "làm lại câu sai bằng bản khác" thầy đã duyệt 05/10, dùng lại mã có sẵn.
- **Mỗi câu chỉ 1 lần chấm trước gợi ý, 1 lần sau gợi ý.** Trắc nghiệm không thử đi thử lại được.
- **LUẬT TỰ LÀM (một luật cho MỌI đường — màn sửa câu lẫn game / luyện tập):** lượt đúng chỉ tính "Đã tự sửa" khi đủ cả hai:
  (a) không xem gợi ý, và không có dấu đọc lời giải câu này (`loi_giai_hoi`, câu gốc hoặc bản của nó) trong 12 giờ trước lúc nộp;
  (b) làm BẢN KHÁC (song sinh / biến thể / câu anh em), HOẶC làm câu gốc ở NGÀY KHÁC ngày sai cuối.
  Lý do (b): game đang hiện lời giải ngay sau câu sai mà chỉ lượt gọi 7 ghi `loi_giai_hoi` (đã kiểm `game-v2.ts:669`) ⇒ không thể dựa riêng vào (a). Không qua luật ⇒ "xong phần hôm nay" + hẹn lại.
  Dòng điều kiện trên màn (quyết định B, giữ chữ): "Tự làm, không xem gợi ý hay lời giải. Đúng thì câu này tính là đã tự sửa." 
- **Ngày của em (quyết định A giữ nguyên):** 12 câu, 3 chặng × 4. Hết 12 câu: nút phụ "Sửa thêm 1 chặng". Thứ tự: câu hẹn lại hôm nay → câu sai trong 7 ngày (mới nhất trước) → câu nhiều em cùng sai → câu sai 8–14 ngày. Câu sai quá 14 ngày KHÔNG vào ngày của em (vẫn ở "Câu cũ hơn", gập lại, em tự mở được).
- **Bố cục điện thoại dọc (ưu tiên):** đầu màn: "Hôm nay đã tự sửa 5/12" + 3 ô chặng; giữa: câu (đề → ô trả lời → nút chính "Kiểm tra"); sau khi đúng: dải xanh "Đã tự sửa" + một dòng "Em vừa sửa: <tên dạng>", nút chính "Câu tiếp theo", nút phụ "Xem lời giải". Ngang / máy tính: câu bên trái, cột phải là tiến độ ngày + 4 câu của chặng.
- **Thẻ ở Hôm nay:** "Sửa câu sai · đã tự sửa 5/12 hôm nay" (bỏ số tổng lớn). Bấm vào mở thẳng câu kế.

## 3. Trạng thái
**Hai trạng thái chính**: **Cần sửa** · **Đã tự sửa** (+ nút hành động "Nhờ thầy"); hai dấu phụ "xong phần hôm nay" và "gặp lại <ngày>". Không thêm từ khái niệm mới ("Đã chắc", "kiểm chứng", "ghép bài", "gặp lại 2" — bỏ khỏi màn em).

| Trạng thái | Em thấy | Khi nào |
|---|---|---|
| Cần sửa | thẻ câu, nút "Sửa câu này" | đợt mở |
| Đã tự sửa | dấu tích xanh, ngày sửa | đúng lần 1, qua luật tự làm (mục 2) |
| Xong phần hôm nay | dấu "xong phần" (không phải tích xanh) | đúng sau gợi ý, đúng mà chưa qua luật tự làm, đã đọc lời giải đầy đủ, hoặc bấm Nhờ thầy |
| Hẹn lại | "Câu này gặp lại Thứ Tư 28/10" | sau khi đọc lời giải; câu về ngày của em sau 3 ngày, làm đúng ⇒ Đã tự sửa |
| Kiểm lại lặng lẽ | không thấy gì | sau Đã tự sửa ~3–7 ngày, câu (bản khác) lẫn vào luyện tập thường; sai ⇒ đợt mới mở như mọi lần sai, em thấy "Cần sửa" lại — không trừ con số cũ |

Các trạng thái chung: đang tải (khung xám đúng chỗ câu), rỗng ("Hôm nay em không có câu nào cần sửa"), lỗi / mất mạng ("Chưa gửi được, bấm Gửi lại" — bài làm giữ trên máy), hết câu làm được ("Hôm nay em đã sửa hết phần có thể sửa").

## 4. Dữ liệu
- **Lấy câu của ngày:** lệnh danh sách sẵn có của vòng chữa (`chua-cau-sai.ts`, đang trả 100 dòng) thêm LỌC KHI ĐỌC: đợt mở + `COALESCE(sai_cuoi_luc, mo_luc)` trong 14 ngày, thứ tự như mục 2. **Không cập nhật hàng loạt** 24 nghìn đợt cũ (đó là ghi đè dữ liệu thật — thuộc Boss, mục 8 câu 3).
- **Lệnh mới `chua-gon-nop`** {dotId, ban (qid bản làm lại), traLoi, lan (1|2)}: máy chủ chấm (đáp án không bao giờ rời máy chủ trước khi em nộp), trả {dung, trangThai, demHomNay, goiY? (chỉ khi sai lần 1), loiGiai? (chỉ khi đúng hoặc sai lần 2)}.
- **Ghi (một batch):** một dòng sổ `su_kien_hoc` (purpose `repair`, sẵn có) + khi qua luật tự làm `chua_loi_dot`: `trang_thai_day='da_tu_sua'`, `dong_luc` (cột sẵn có, giá trị sẵn có; đúng một dòng của chính em, khoá `revision` — như đường đóng hiện nay ở `chua-cau-sai.ts:258`). Có gợi ý / đọc lời giải: ghi `loi_giai_hoi` như mọi kênh khác. **Không đổi schema, không migration.** (`trang_thai_day` là TEXT không có CHECK — đã kiểm `migration-0710-chua-cau-sai.sql`.)
- **Gợi ý 1:** bước đầu của hồ sơ lời giải từng bước nếu có (`loi_giai`), không có thì câu đầu của `solution` trong kho. Cần kiểm trên 30 câu thật xem "câu đầu lời giải" có lộ đáp án không (mục 8 câu 4).
- **Phụ huynh:** đếm `da_tu_sua` theo `dong_luc` trong 7 ngày (đọc chỉ-thêm trong lệnh phụ huynh sẵn có).
- **Đồng bộ với game:** em làm ĐÚNG lại câu ấy trong game / luyện tập, qua luật tự làm (mục 2) ⇒ cũng là "Đã tự sửa" (đóng đợt lúc ghi sổ). Hiện 2 014 đợt mở 14 ngày có lượt đúng lại câu gốc, 1 938 ở ngày khác (qua vế b); vế a (dấu đọc lời giải 12 giờ) chưa lọc trong số đo ⇒ số đóng thật ≤ 1 938. Làm hai phần: (a) từ nay đóng lúc ghi sổ; (b) 2 014 đợt có sẵn: đóng theo đúng luật ấy (đọc sổ, mỗi đợt một UPDATE khoá `revision`) — là ghi hàng loạt lên dữ liệu thật ⇒ **Boss duyệt trước** (mục 8 câu 3). Không duyệt thì đóng lười khi em mở đợt (như `chuaCoLoi` đang làm).

## 5. Ngoại lệ
- **Đoán mò:** 1 lần chấm trước gợi ý; Phần I/II gốc xáo thứ tự; không hiện lựa chọn cũ. Đúng do đoán sẽ lộ ở lượt kiểm lại lặng lẽ.
- **Câu tự luận:** không vào ngày của em (`src/lib/cau-tu-luan.ts`); vẫn hiện ở danh sách đầy đủ, nút "Nhờ thầy".
- **Câu đang bảo vệ ca thi / đang có ca thi mở:** không phát (luật sẵn có `cauDangBaoVe`, `coCaDangMo`).
- **Câu bị nghi sai đáp án** (`cau_nghi_dap_an`): không phát, báo thầy.
- **Bấm lặp / mạng chập chờn:** `khoa` chống lặp như `/nop`; lần nộp thứ hai cùng khoá trả lại kết quả cũ.
- **Mất mạng giữa chừng:** câu trả lời giữ trên máy; gửi lại được; không tính xong khi chưa có kết quả máy chủ.
- **Chữ / công thức dài, máy yếu:** dùng khung câu M3 sẵn có (`KhungCauM3`) — đã đo trên máy yếu 21/10.
- **Đổi tab:** không đếm giờ, không ảnh hưởng.

## 6. Chi phí máy chủ
- `chua-gon-nop`: 1 đợt đọc song song (đợt + câu + đáp án + câu bảo vệ, `Promise.all`) → 1 batch ghi = **2 vòng chờ nối tiếp**. Không dài hơn `/nop` của ca thi.
- Lọc 14 ngày nằm trong câu SELECT sẵn có của lệnh danh sách: **0 vòng chờ thêm**; trả ít dòng hơn (≤ 24 thay vì 100) ⇒ nhẹ hơn.
- Không lệnh nóng nào thêm vòng chờ (cổng `tests/toc-do-may-chu-lenh-nong-1310.test.ts`).
- Màn em: bỏ tải đáp án + lời giải lúc mở câu ⇒ byte tải mở câu giảm.

## 7. Nghiệm thu đo bằng máy
- `tests/chua-gon-nop-2510.test.ts`: đúng lần 1 qua luật tự làm ⇒ `da_tu_sua` + `dong_luc`; đúng câu gốc cùng ngày sai / có `loi_giai_hoi` 12 giờ / đúng sau gợi ý ⇒ chỉ "xong phần", đợt vẫn mở; sai lần 1 ⇒ có `goiY`, KHÔNG có `loiGiai`/`dapAn`; sai lần 2 ⇒ `loiGiai`, trạng thái "hẹn lại" 3 ngày; lần 3 bị từ chối; khoá lặp trả kết quả cũ; câu bảo vệ ⇒ khoá.
- `tests/chua-gon-khong-lo-dap-an-2510.test.ts`: phản hồi mở câu không có `correct`/`solution`/`dapAn`/`loiGiai` (thêm vào `npm run kiem:lo-dap-an`).
- `tests/chua-gon-ngay-2510.test.ts`: 12 câu, 3 chặng; thứ tự đúng; câu > 14 ngày không vào ngày; câu tự luận không vào.
- `tests/chua-gon-dong-bo-game-2510.test.ts`: đúng lại trong game qua luật tự làm ⇒ đóng đợt; đúng ngay sau khi xem lời giải / cùng ngày trên câu gốc ⇒ không đóng.
- `npm run build && npm run kiem:toc-do` 0 đỏ; `npm run kiem:mau-giu` 0; `check:mau`; precache ≤ 169.
- Đo lại sau 7 ngày (cùng workflow `do-phu-chua-cau-2510.yml`, truy vấn 19 và 20): tỉ lệ đợt sai trong 14 ngày đã thành "Đã tự sửa" — mốc đo 25/10: 42 / 12 281 = **0,3%** (run 40172531297), mục tiêu ≥ 30%; tỉ lệ "Đã tự sửa" bị lượt kiểm lại bắt sai (nếu > 40% ⇒ siết luật, ví dụ bỏ tính "có gợi ý").

## 8. Cần thầy / Boss quyết
1. **EXP:** giữ "không EXP" (20/10) — tôi đề nghị giữ. Muốn cộng thì thầy nói rõ là đổi quyết định 20/10.
2. **Đường cũ (sửa từng bước, ghép bài, gặp lại 2):** đề nghị ẩn khỏi màn em; học liệu từng bước (4,7% đợt) chỉ còn làm nguồn cho gợi ý 1. Dữ liệu giữ nguyên.
3. **Đóng 2 014 đợt em đã làm đúng lại (mục 4)** — ghi hàng loạt, cần Boss duyệt. **24 nghìn đợt cũ (> 14 ngày):** đề nghị KHÔNG đóng, chỉ không đưa vào ngày của em. Đóng hàng loạt = ghi đè dữ liệu thật ⇒ Boss quyết nếu muốn.
4. **Gợi ý 1 lấy từ câu đầu lời giải** — tôi soát 30 câu thật trước khi build; lộ đáp án thì gợi ý 1 chỉ là "tên dạng + chỗ hay sai".
5. **Đúng sau gợi ý 1 có tính "Đã tự sửa" không?** Mặc định KHÔNG (giữ quyết định B 20/10). Tính thì em được ghi nhận nhiều hơn nhưng con số kém thật hơn.
6. **Bốn luật "đã vững"** (vòng chữa, đóng lỗi sổ `loi-hoc-luat.ts`, `da_khac_phuc` hồ sơ, srs2) — thống nhất thuộc Boss. Bản này chỉ làm "Đã tự sửa" của vòng chữa khớp với đóng lỗi khi em đúng lại ở kênh khác.

## 9. Chia làn
| Phần | Ai | Tệp |
|---|---|---|
| Màn em: Hôm nay (thẻ), Tự sửa lỗi, màn làm câu | Claude (làn hiện có) | `src/components/chua-cau-sai/*`, `ChuaTrucTiep.tsx` (thay), thẻ Hôm nay |
| Lệnh `chua-gon-nop`, lọc 14 ngày trong lệnh danh sách, đồng bộ với game | **chưa có làn rõ — báo Boss** (Codex PR318 đã chạm đường đọc) | `server/src/chua-cau-sai*.ts`, chỗ ghi sổ game |
| Dòng phụ huynh | làn phụ huynh (Boss chỉ định) | `ph-v3` |
| Thống nhất luật "đã vững", đóng đợt cũ | Boss | — |
