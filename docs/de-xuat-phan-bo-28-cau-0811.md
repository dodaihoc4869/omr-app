# ĐỀ XUẤT — Lịch 28 câu/ngày theo ma trận đề 2026 của thầy (08/11/2026)

Trạng thái: **ĐỀ XUẤT, CHƯA BUILD.** Nguồn ma trận: tệp thầy gửi 08/11
`ma_tran_dac_ta_sieu_chi_tiet_de_thi_hoa_2026_claude_blueprint.md` (mã đề 0326 & 0339), sau đây gọi là **blueprint**.

## 1. Ma trận chuẩn (lấy nguyên từ blueprint, đơn vị = CÂU)

### 1a. Phần × mức
| Phần | Biết | Hiểu | Vận dụng | Tổng |
|---|---|---|---|---|
| I (18 câu) | 12 | 4 | 2 | 18 |
| II (4 câu) | 0 | 2 | 2 | 4 |
| III (6 câu) | 0 | 3 | 3 | 6 |
| **Tổng** | **12** | **9** | **7** | **28** |

- Phần I, III: đúng bảng 1.3 của blueprint.
- Phần II: blueprint chấm mức theo **ý** (Biết 5 · Hiểu 7 · VD 4 trên 16 ý). Kho câu của app hiện chỉ gắn mức theo **cả câu** (cột `muc_do`), chưa có mức từng ý ⇒ tạm quy theo mức cao nhất của câu: C1 phức chất Hiểu, C2 tinh bột/cellulose Hiểu, C3 chuẩn độ VD, C4 chất béo VD ⇒ **0/2/2**. Giai đoạn 2: gắn mức từng ý rồi ép thêm 5/7/4 theo ý.
- So với app đang chạy (I 11/4/3 · II 0/3/1 · III 1/2/3, app tự phân tích 4 đề cũ): thay toàn bộ.

### 1b. Chương (28 vị trí — từ bảng 1.2 và 3.1–3.3, quy về mã chương của kho)
| Lớp | Chương (mã kho) | Câu | Vị trí (mã 0326) · mức |
|---|---|---|---|
| 10 | Nguyên tử `NGUYEN_TU` | 1 | P1.C10 Biết |
| 10 | Bảng tuần hoàn `BANG_TUAN_HOAN` | 1 | P1.C16 Biết |
| 11 | Cân bằng `CAN_BANG` | 3 | P1.C1 VD, P1.C2 VD, P2.C3 chuẩn độ VD |
| 11 | Nitrogen – Sulfur `NITROGEN_SULFUR` | 1 | P3.C3 Haber-Bosch VD |
| 11 | Đại cương hữu cơ `HUU_CO_DAI_CUONG` | 1 | P1.C11 Biết |
| 11 | Hydrocarbon `HYDROCARBON` | 1 | P1.C9 Biết |
| 11 | Carbonyl `CARBONYL_ACID` | 1 | P1.C12 Biết |
| 12 | Ester – Lipid `ESTER` | 3 | P1.C3 Hiểu, P2.C4 VD, P3.C2 Hiểu |
| 12 | Carbohydrate `CARBOHYDRATE` | 2 | P2.C2 Hiểu, P3.C4 VD |
| 12 | Hợp chất nitrogen `HOP_CHAT_N` | 3 | P1.C4 Biết, P1.C5 Biết, P1.C18 Hiểu |
| 12 | Polymer `POLYMER` | 2 | P1.C6 Biết, P3.C6 Hiểu |
| 12 | Pin điện – Điện phân `DIEN_PHAN` | 4 | P1.C7 Biết, P1.C13 Hiểu, P1.C15 Biết, P3.C5 Hiểu |
| 12 | Đại cương kim loại `KIM_LOAI` | 2 | P1.C8 Hiểu, P1.C17 Biết |
| 12 | Nhóm IA, IIA `KIM_LOAI_IA_IIA` | 1 | P3.C1 xi măng VD |
| 12 | Chuyển tiếp – Phức chất `PHUC_CHAT` | 2 | P1.C14 Biết, P2.C1 Hiểu |

Kiểm: 28 câu; lớp 10 = 2, lớp 11 = 7, lớp 12 = 19; Biết 12 · Hiểu 9 · VD 7 — khớp 1a.
Chương có **0 câu** trong blueprint: Liên kết, Năng lượng hoá học, Tốc độ phản ứng, Oxi hoá – khử, Halogen, Alcohol – Phenol.

### 1c. Chỗ blueprint tự mâu thuẫn — thầy chốt
1. P2.C2 ý b mã 0339: bảng đối chiếu (dòng gốc 20) ghi «giữ nguyên hoàn toàn», đáp án Đ – Đ – S – S; mục 3.2 và bảng 7.2 ghi «tăng mạch» ⇒ Đ – **S** – S – S. Không ảnh hưởng ma trận, chỉ ảnh hưởng đáp án nếu nạp đề 0339.
2. P1.C8 (bảo quản Na/K): bảng 1.2 xếp Chương 6 Đại cương kim loại, mục 3.1 ghi «Đại cương kim loại & Nhóm IA». Em theo bảng 1.2.
- Đã tính lại các đáp số Phần II/III trong blueprint (xi măng 17,2 / 61,6; Haber 42,9; sấy đường 4,95 / 3,34; E° pin 0,64 / 0,48; chuẩn độ 10,13 và 5,96 mmol): đều đúng.

## 2. Chia ma trận cho số câu bất kỳ
- Một hàm chung `chiaMaTran(N, phạm vi chương)`; chia theo phần dư lớn nhất trên 7 ô phần × mức (thứ tự I-B, I-H, I-VD, II-H, II-VD, III-H, III-VD):
  - N = 10 → 4·1·1·1·1·1·1 (I 6 · II 2 · III 2)
  - N = 20 → 9·3·2·1·1·2·2 (I 14 · II 2 · III 4)
  - N = 28 → 12·4·2·2·2·3·3
  - N = 40 → 17·6·3·3·3·4·4 (I 26 · II 6 · III 8)
- **Cộng dồn:** ô bị làm tròn xuống hôm nay được ưu tiên lần rút sau ⇒ cộng nhiều ngày đúng tỉ lệ, mỗi ô lệch ≤ 1 câu.
- Chiều chương: chia theo bảng 1b, chỉ trên chương ĐÃ học; vị trí của chương chưa học chuyển cho chương đã học **cùng phần × mức**, theo tỉ trọng blueprint.
- Câu thuộc ô 0 (Phần II Biết, Phần III Biết): không vào đường rút tự động (bản cũ đang đẩy lên Hiểu — sai nhãn, bỏ). Máy báo số câu này theo từng bài để thầy xem lại mức hoặc dùng ở Gọi lên bảng.

## 3. Ba loại ngày, mỗi ngày đúng 28 câu, không trộn
| Ngày | Nguồn | Ma trận |
|---|---|---|
| **Mới** | câu chưa gặp của bài thầy vừa chọn | phần × mức (một bài = một chương) |
| **Ôn** | câu đã làm của TẤT CẢ bài cũ | phần × mức × chương (chương đã học) |
| **Sửa** | câu em làm sai chưa tự sửa | phần × mức; ô thiếu bù câu song sinh của chính câu sai cùng ô |

## 4. Số ngày cho mỗi bài (chu kỳ bài)
- **M — ngày Mới** = ⌈N_bài / 28⌉ (N_bài = câu rút được: bỏ tự luận, bỏ ô 0, đã duyệt).
  - Ô thiếu: bù (1) câu song sinh đã qua máy soát của câu cùng ô trong bài → (2) câu cùng ô, cùng chương trong kho chung chưa giao. Vẫn thiếu ⇒ **không phá ma trận**, báo «Bài X thiếu k câu ô Y».
  - Ô thừa: giữ làm **dự trữ chưa gặp** cho đề kiểm tra (kiểm tra cần câu chưa gặp mới đo thật). Câu giữ lại cho ngày Mới ưu tiên phủ đủ dạng của bài.
- **R — ngày Ôn** = 0 nếu bài đầu; còn lại max(⌈M/2⌉, ⌈câu ôn đến hạn của em / 28⌉), trần = M. Mỗi bài cũ có ít nhất 1 câu trong R ngày; ưu tiên câu đến hạn → chương em yếu nhất → bài lâu chưa ôn.
- **S — ngày Sửa (riêng từng em)** = số ngày để ô nghẽn nhất sửa xong: max theo ô ⌈câu sai ô đó / suất ô đó mỗi ngày⌉, giữ cam kết 12 ngày sửa ≥ 80 %. Không có câu sai ⇒ S = 0. Có câu sai nhưng < 28 ⇒ bù câu song sinh của chính câu sai.
- **Xếp ngày:** đan xen Mới · Mới · Ôn · Mới · Sửa …; không hai ngày Ôn/Sửa liền nhau; ngày cuối chu kỳ là Sửa.
- **Cá nhân hoá:** M chung cả lớp; R chọn câu theo hồ sơ ôn từng em; S hoàn toàn riêng. Em vắng ⇒ câu mới còn lại dời sang ngày Mới kế tiếp của em, không dồn quá 28.

### Ví dụ giả định (số minh hoạ, không phải dữ liệu thật)
Bài 100 câu, kho theo ô 40·22·10·8·4·7·9:
- M = 4 ⇒ cần 48·16·8·8·8·12·12 = 112 câu.
- Thiếu 20 (I-Biết 8, II-VD 4, III-Hiểu 5, III-VD 3) ⇒ bù song sinh. Thừa 8 (I-Hiểu 6, I-VD 2) ⇒ dự trữ kiểm tra. Kiểm: 100 − 8 + 20 = 112.
- Bài thứ 5 ⇒ R = 2; em có 40 câu sai rải đều ô ⇒ S = 2 ⇒ chu kỳ 8 ngày; em không sai ⇒ 6 ngày.

## 5. Ca kiểm tra — mọi đường đều qua một cổng
- Mọi đường rút tự động (đề chuẩn, kiểm tra cá nhân, đề riêng lấp lỗi `rut-de-v2`, ca thêm, luyện đề) gọi `chiaMaTran` rồi qua `kiemMaTran(de)`; lệch ⇒ **không mở ca**, hiện ô thiếu + nút «Tự bù».
- Đề 28 câu phạm vi đủ chương: rút theo **28 vị trí** của bảng 1b (đúng chương + phần + mức); cùng cơ chế với đề gốc (vd P1.C4 ⇒ `HOP_CHAT_N.AMINE_CAU_TAO`) được ưu tiên, không bắt buộc.
- Giả định: đề thầy tự đưa nguyên bản (đề in, đề scan) ⇒ máy chỉ kiểm và báo lệch, không đổi câu của thầy.

## 6. Quyết định thầy cần chốt
1. **6 chương có 0 câu trong blueprint** (Liên kết, Năng lượng, Tốc độ, Oxi hoá – khử, Halogen, Alcohol – Phenol). Ép tuyệt đối ⇒ các chương này không bao giờ vào ngày Ôn và đề kiểm tra tổng hợp (ngày Mới của bài thuộc chương đó vẫn chạy, theo phần × mức).
   **Em đề xuất:** đề kiểm tra mô phỏng thi ép tuyệt đối bảng 1b; ngày Ôn giữ tuyệt đối phần × mức, còn chương thì 90 % theo bảng 1b, 10 % (≈ 3 câu/ngày) cho chương 0 câu đã học.
2. Phần II tạm theo mức cả câu (0/2/2) cho tới khi gắn mức từng ý (mục 1a).
3. Hai mâu thuẫn ở mục 1c.

## 7. Giới hạn cần biết
- 28 câu/ngày = 196 câu/tuần cho cả Mới + Ôn + Sửa. Dạy 2 bài/tuần × ~100 câu thì riêng câu mới đã hết tuần. Khi thầy chọn bài, máy hiện ngày dự kiến xong của từng lớp và cảnh báo khi nhịp chọn bài nhanh hơn sức chứa; bài mới xếp hàng, không cắt ngày Ôn/Sửa.
- Ép ma trận ở ngày Sửa ⇒ câu sai mức Vận dụng (7 suất/ngày) chờ lâu hơn ⇒ S tính theo ô nghẽn nhất (mục 4).

## 8. Thứ tự build (sau khi duyệt)
1. `src/lib/ma-tran-chuan.ts` (bảng 1a + 1b, một nguồn duy nhất; ba bản cũ đọc từ đây) + `chiaMaTran` + test khoá đúng từng số blueprint.
2. Lõi lịch chu kỳ (hàm thuần M/R/S + xếp ngày) + test.
3. Gói 7 đổi sang lịch chu kỳ; ngày Ôn, ngày Sửa 28 câu.
4. Cổng ma trận cho mọi đường mở ca.
5. Màn thầy: khi chọn bài hiện «Bài X: 4 ngày mới · thiếu ô … · dự kiến xong dd/mm» (bản vẽ duyệt trước).
6. Cổng tốc độ + tác tử toc-do, phát hành.
