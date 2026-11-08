# ĐỀ XUẤT — Lịch 28 câu/ngày theo ma trận đề 2026 (08/11/2026)

Trạng thái: **ĐỀ XUẤT, CHƯA BUILD.** Chờ thầy duyệt và gửi tệp ma trận
`ma_tran_dac_ta_sieu_chi_tiet_de_thi_hoa_2026_claude_blueprint.md` (phiên đám mây chưa đọc được tệp này vì nó nằm trên máy Mac của thầy).

## 0. Hiện trạng (đã đọc mã)
| Luồng | Đang chạy | Lệch yêu cầu mới |
|---|---|---|
| Câu mới (Gói 7, `server/src/goi-bai-7*.ts`) | mỗi bài cố định 7 ngày, quota = ⌈câu còn / ngày còn⌉, mức ngày 24/30/36 theo tầng, trộn mới + chữa + sửa + ôn trong cùng ngày | số ngày không tính theo 28; ngày nào cũng trộn |
| Ma trận (`ma-tran-rut-moi.ts`, `src/lib/ma-tran-hoa-2026.ts`, `kiem-tra-ca-nhan-ma-tran.ts`) | 3 bản chép tay cùng số, chỉ theo **phần × mức** (I 11/4/3 · II 0/3/1 · III 1/2/3), do app tự phân tích 4 đề | chưa có chiều **chương / lớp 10-11-12**; 3 bản tách rời |
| Sửa lỗi (`sua-loi-phan-bo.ts`) | 12–36 câu/ngày, 12 ngày sửa ≥ 80 % | không phải 28, không theo ma trận |
| Ôn (`srs2-loi.ts`, `omni-on-bai-cu.ts`) | tỉ lệ 20 % ôn bài cũ trộn trong ngày | không có ngày ôn riêng |
| Ca kiểm tra | `rutDeChuan2026`, `chonChuKyKt2026` theo ma trận; `rut-de-v2` (đề riêng, lấp lỗi) chưa ép ma trận | chưa ép ở mọi đường |

## 1. Một nguồn ma trận duy nhất
- Tệp mới `src/lib/ma-tran-chuan.ts` (Worker dùng chung, không chép tay nữa) chứa đúng bảng trong blueprint của thầy: **ô = phần × mức × chủ đề (chương, lớp)**. Ba bản cũ đọc từ tệp này.
- Test khoá: tổng 28 = 18 + 4 + 6; mọi ô khớp blueprint từng số.

## 2. Chia ma trận cho số câu bất kỳ (N ≠ 28)
- Chia theo **phần dư lớn nhất** (Hamilton) trên các ô, hoà ⇒ ô trọng số lớn trước.
- Ví dụ (chiều phần × mức, thứ tự I-Biết, I-Hiểu, I-VD, II-Hiểu, II-VD, III-Biết, III-Hiểu, III-VD):
  - N = 10 → 4·2·1·1·0·0·1·1
  - N = 20 → 8·3·2·2·1·1·1·2
  - N = 28 → 11·4·3·3·1·1·2·3
  - N = 40 → 16·6·4·4·2·1·3·4
- **Cộng dồn:** ô làm tròn về 0 hôm nay (N nhỏ) được ưu tiên lần rút sau ⇒ cộng nhiều ngày luôn đúng tỉ lệ, sai lệch mỗi ô ≤ 1 câu.
- Chiều chương: chia hai chiều có giữ tổng biên (tổng theo phần, theo mức, theo chương đều lệch ≤ 1 so với số chính xác). Phạm vi chưa học hết ⇒ tỉ lệ chương chia lại trên các chương ĐÃ học.

## 3. Ba loại ngày, mỗi ngày đúng 28 câu, không trộn
| Ngày | Nguồn | Ma trận |
|---|---|---|
| **Mới** | câu chưa gặp của bài thầy vừa chọn | phần × mức (một bài = một chương ⇒ không áp chiều chương) |
| **Ôn** | câu đã làm của TẤT CẢ bài cũ | phần × mức × chương (trên chương đã học) |
| **Sửa** | câu em làm sai chưa tự sửa | phần × mức; ô thiếu bù câu song sinh của chính câu sai cùng ô |

## 4. Tính số ngày cho mỗi bài (chu kỳ bài k)
- **M (ngày mới)** = ⌈N_bài / 28⌉, N_bài = câu rút được (bỏ tự luận, đã duyệt).
  - Ô thiếu (kho bài có ít câu ô đó hơn số cần × M): bù theo thứ tự (1) câu song sinh đã qua máy soát của câu cùng ô trong bài, (2) câu cùng ô cùng chương trong kho chung chưa giao. Vẫn thiếu ⇒ **không phá ma trận**, báo thầy «Bài X thiếu k câu ô Y».
  - Ô thừa: câu thừa giữ làm **dự trữ chưa gặp** cho đề kiểm tra (đề kiểm tra cần câu chưa gặp mới đo thật). Chọn giữ lại câu phủ dạng còn thiếu, câu dạng đã phủ đi dự trữ.
- **R (ngày ôn)** = 0 nếu là bài đầu; còn lại = max(⌈M/2⌉, ⌈số bài cũ / 28⌉, ⌈câu ôn đến hạn của em / 28⌉), trần = M. Trong R ngày, mỗi bài cũ có ít nhất 1 câu; ưu tiên câu đến hạn ôn → chương em yếu nhất → bài lâu chưa ôn.
- **S (ngày sửa) — riêng từng em** = ⌈câu sai chưa sửa / 28⌉, giữ cam kết 12 ngày sửa ≥ 80 %. Em không có câu sai ⇒ S = 0, chu kỳ ngắn lại. Có câu sai nhưng < 28 ⇒ bù câu song sinh của chính câu sai cho đủ 28.
- **Xếp ngày:** đan xen, không hai ngày ôn/sửa liền nhau. Mẫu: Mới · Mới · Ôn · Mới · Sửa · Mới · Ôn … ; ngày cuối chu kỳ là Sửa (dọn lỗi của bài vừa học).
- **Cá nhân hoá:** M giống cả lớp (cùng bài); R chọn câu theo hồ sơ ôn từng em; S hoàn toàn riêng. Em vắng / chưa xong ⇒ phần câu mới còn lại dời sang ngày Mới kế tiếp của chính em, không dồn quá 28.

### Ví dụ giả định (số minh hoạ, không phải dữ liệu thật)
Bài 100 câu, kho theo ô 40·22·10·8·2·3·6·9:
- M = ⌈100/28⌉ = 4 ngày ⇒ cần 44·16·12·12·4·4·8·12 = 112 câu.
- Thiếu 18 (I-Biết 4, I-VD 2, II-Hiểu 4, II-VD 2, III-Biết 1, III-Hiểu 2, III-VD 3) ⇒ bù song sinh. Thừa 6 câu I-Hiểu ⇒ dự trữ kiểm tra.
- Bài thứ 5 ⇒ R = max(2, 1, …) = 2. Em có 40 câu sai ⇒ S = 2. Chu kỳ = 4 + 2 + 2 = **8 ngày**; em không sai câu nào ⇒ 6 ngày.

## 5. Ca kiểm tra — mọi đường đều qua một cổng
- Mọi đường rút tự động (đề chuẩn, kiểm tra cá nhân, đề riêng lấp lỗi `rut-de-v2`, ca thêm, luyện đề) gọi chung `chiaMaTran(N, phạm vi chương)` rồi qua `kiemMaTran(de)`; lệch ⇒ **không mở ca**, hiện ô thiếu + nút «Tự bù».
- Giả định: đề thầy tự đưa nguyên bản (đề in, đề scan) ⇒ máy chỉ kiểm và báo lệch, không tự đổi câu của thầy.

## 6. Nói thẳng — giới hạn cần thầy biết
- 28 câu/ngày = 196 câu/tuần cho CẢ mới + ôn + sửa. Thầy dạy 2 bài/tuần × ~100 câu ⇒ riêng câu mới đã cần ~7 ngày/tuần, không còn ngày ôn/sửa. Máy sẽ hiện ngày dự kiến xong chu kỳ của từng lớp khi thầy chọn bài và cảnh báo khi nhịp chọn bài nhanh hơn sức chứa; bài mới thầy chọn khi chu kỳ cũ chưa xong ⇒ xếp hàng, không cắt ngày ôn/sửa.
- Ép ma trận tuyệt đối ở ngày Sửa ⇒ câu sai mức Vận dụng (ô chỉ 3 + 1 + 3 câu/ngày) chờ lâu hơn. Cách gỡ: S tính theo ô nghẽn nhất, không theo tổng.
- Ma trận app đang dùng là app tự phân tích 4 đề (`GHI_CHU_MA_TRAN`). Blueprint của thầy sẽ thay toàn bộ.

## 7. Thứ tự build (sau khi duyệt)
1. `ma-tran-chuan.ts` + `chiaMaTran` + test khoá blueprint.
2. Lõi lịch chu kỳ (hàm thuần M/R/S + xếp ngày) + test.
3. Gói 7 đổi sang lịch chu kỳ; ngày Ôn, ngày Sửa 28 câu.
4. Cổng ma trận cho mọi đường mở ca.
5. Màn thầy: khi chọn bài hiện «Bài X: 4 ngày mới · thiếu ô … · dự kiến xong dd/mm».
6. Cổng tốc độ + tác tử toc-do, phát hành.
