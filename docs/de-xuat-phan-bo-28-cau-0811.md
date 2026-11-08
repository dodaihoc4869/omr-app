# ĐỀ XUẤT v4 — Lịch 28 câu/ngày: làm HẾT câu mới, SỬA HẾT, ÔN TOÀN DIỆN, tính riêng từng em (08/11/2026)

Trạng thái: **ĐỀ XUẤT, CHƯA BUILD.** Thay v1–v3. Thầy chốt 08/11: mọi em làm hết câu mới, sửa hết, ôn hết ⇒ bỏ khung bậc A/B/C và kho bù của v3.
Nguồn ma trận: blueprint thầy gửi 08/11 (mã đề 0326 & 0339). Bằng chứng: `docs/de-xuat-28-cau-mo-phong/` (giả lập từng câu, từng ngày).

## 1. Ba loại ngày — mỗi ngày đúng một đề 28 câu, đúng ma trận

| Phần | Biết | Hiểu | Vận dụng |
|---|---|---|---|
| I (18) | 12 | 4 | 2 |
| II (4) | 0 | 2 | 2 |
| III (6) | 0 | 3 | 3 |

- **Mới:** câu chưa gặp của bài đang học; xếp «phủ dạng trước».
- **Ôn = đề kiểm tra ôn tập:** 28 vị trí theo chương (bảng 28 vị trí blueprint, chỉ chương đã học); câu song sinh của câu em đã làm, thiếu song sinh thì câu gốc đã làm. Chấm thang 10 như thi.
- **Sửa:** theo **nhóm lỗi** = cùng bài + cùng dạng + cùng ô ma trận. Ví dụ: em sai 10 câu cùng dạng «bậc amine» ở Phần I Biết ⇒ 1 nhóm; làm đúng 1 câu song sinh ⇒ cả 10 câu xong. Sai ⇒ lần sau song sinh khác; sai 3 lần ⇒ chuyển **thầy chữa trực tiếp** (danh sách trên app thầy). Câu chưa có mã dạng ⇒ nhóm 1 câu.
- **Củng cố:** ô không đủ nhóm lỗi ⇒ câu song sinh khác của nhóm vừa sửa xong cùng ô (không có thì song sinh câu đã làm của bài). Sai câu củng cố ⇒ **mở lại nhóm đó, mang sang chu kỳ sau**, không chặn chu kỳ này đóng; vẫn tính luật 3 lần sai.

## 2. Chu kỳ một bài của MỘT em (máy tự xếp)
1. Đầu chu kỳ: nhóm lỗi mang sang từ chu kỳ trước vào hàng Sửa.
2. Làm **M ngày Mới**; cứ sau 2 ngày Mới chen **1 ngày Sửa** (nếu có lỗi).
3. Hết câu mới ⇒ **R ngày Ôn** (đề kiểm tra ôn tập toàn diện bài cũ).
4. **Sửa đến khi sạch nhóm lỗi** của chu kỳ (trừ nhóm mở lại do sai câu củng cố ⇒ chu kỳ sau).
5. Chu kỳ đóng ⇒ sang bài kế thầy đã chọn (theo thứ tự chọn; không bỏ bài nào). Chưa có bài mới ⇒ thêm ngày Ôn.

## 3. Công thức số ngày (máy tính lúc thầy chọn bài, tính lại mỗi đêm theo kết quả thật)
- **M — ngày Mới (chung cả lớp):** M = max( ⌈N / 28⌉ , max theo ô ⌈câu của ô / suất của ô⌉ ). N = câu rút được của bài (bỏ tự luận, câu chưa duyệt, câu ô 0). Ô nào dồn quá nhiều câu thì bài phải thêm ngày Mới; các ô còn lại bù bằng song sinh / câu cùng ô cùng chương. Máy báo thầy ô gây thêm ngày.
- **R — ngày Ôn — thầy chọn một trong hai:**
  - **(B, em đề xuất) R = 1:** mỗi đề Ôn có MỌI chương đã học (theo 28 vị trí blueprint); bài trong cùng chương **xoay vòng** (bài lâu chưa ôn nhất, bài em yếu nhất trước) ⇒ mỗi bài cũ được ôn ít nhất 1 lần trong mỗi k chu kỳ, k = ⌈số bài đã học của chương / số vị trí của chương⌉.
  - **(A) Mỗi bài cũ có câu trong MỌI chu kỳ:** R = max(1, max theo chương ⌈số bài đã học của chương / số vị trí⌉). 7 chương chỉ có 1 vị trí (Nguyên tử, Bảng tuần hoàn, Nitrogen – Sulfur, Đại cương hữu cơ, Hydrocarbon, Carbonyl, Nhóm IA-IIA): học 3 bài Hydrocarbon ⇒ R = 3 ⇒ **mọi em thêm 2 ngày mỗi bài**, mãi về sau.
  - Chương 0 vị trí (6 chương): không có trong công thức; chỉ vào đề Ôn nếu thầy duyệt phần 10 % (mục 9).
- **S — ngày Sửa (riêng từng em):** S = max theo ô ⌈nhóm lỗi dự kiến của ô / (suất của ô × tỉ lệ sửa được của em ở ô đó)⌉ + ⌊(M − 1) / 2⌋ ngày Sửa chen giữa.
  - nhóm lỗi dự kiến của ô = số dạng của ô × (1 − p^(câu/dạng)) + suất ô × R × (1 − p_ôn) + nhóm đang mang sang của ô (máy biết số thật), với p = tỉ lệ đúng của CHÍNH em ở ô đó (14 ngày gần nhất).
- **Tổng T = M + R + S.** Chu kỳ chỉ đóng khi xong thật; T là dự báo để thầy nhìn, tính lại mỗi đêm.

## 4. Kết quả giả lập (giả định, không phải dữ liệu thật)
Giả định tỉ lệ đúng Biết / Hiểu / VD: Giỏi 97/90/80 %, Khá 92/80/60 %, Trung bình 85/65/40 %, Yếu 75/50/25 %; xem lời giải lấp nửa khoảng hổng; câu Ôn đúng kém 5 điểm %; R = 1 (phương án B); lỗi rải đều trên các dạng; 5 bài khởi động rồi đo bài thứ 6; 200 lượt/em.
Chạy lại: `cd docs/de-xuat-28-cau-mo-phong && python3 -I kiem-du-bao.py` (và `python3 -I lich28.py` cho 10 bài liên tiếp).

| Bài | M | Giỏi | Khá | Trung bình | Yếu |
|---|---|---|---|---|---|
| 56 câu đủ ô | 2 | 5 ngày | 6 | 7 | 8 |
| 112 câu đủ ô | 4 | 8 | 9 | 10 | 11 |
| 100 câu lệch ô (40·22·10·8·4·7·9) | 6 | 11 | 12 | 13 | 14 |

Số = trung vị số ngày một chu kỳ. Dự báo trung vị **khớp giả lập** ±1 ngày ở 24/24 trường hợp; từng lượt riêng khớp ±1 ngày 53–98 % (em yếu dao động nhiều hơn ⇒ máy tính lại mỗi đêm). Công thức được chỉnh trên chính giả lập này ⇒ đây là kiểm nhất quán, độ chính xác thật đo khi có dữ liệu.
Qua 10 bài liên tiếp: mọi chu kỳ đóng; mỗi ngày đúng 28 câu, đúng 7 ô (máy tự kiểm từng đề); hết câu mới; nhóm lỗi mang sang có trần (tối đa 8–38 nhóm, không phình); 0–6 % số câu sai phải chuyển thầy chữa (em yếu nhiều nhất).
Bài 100 câu lệch ô: 22 câu Phần I Hiểu, ô này 4 suất/ngày ⇒ 6 ngày Mới thay vì 4, cần 68 suất bù.

## 5. Nhịp dạy của thầy (máy hiện khi chọn bài)
- Một em không thể làm nhanh hơn T ngày/bài với 28 câu/ngày. Thầy chọn bài mới khi em còn chu kỳ cũ ⇒ bài xếp hàng, em chậm dần (không bỏ phần nào).
- Ví dụ giả lập, thầy chọn 1 bài / 7 ngày: bài 56 câu ⇒ em giỏi, khá theo kịp, em yếu chậm ~1 ngày/bài; bài 112 câu ⇒ em giỏi chậm ~0,6 ngày/bài, em yếu ~4 ngày/bài. **Cộng dồn sau 15 bài: em giỏi chậm ~9 ngày, em yếu chậm ~2 tháng.**
- Màn chọn bài hiện: «Bài X: M ngày Mới · lớp cần 8–11 ngày · nên chọn bài kế từ ngày dd/mm · em đang chậm: …».

## 6. Rút câu chuẩn chỉ — máy tự kiểm MỌI đề trước khi phát (sai ⇒ không phát, ghi lỗi)
1. Đúng 28 câu; đúng 7 ô (12·4·2·2·2·3·3).
2. Đề Ôn: đúng 28 vị trí chương (chương chưa học chuyển vị trí cho chương đã học em yếu nhất, cùng phần × mức).
3. Ngày Mới chỉ có câu mới của bài đang học (+ câu bù ghi rõ); ngày Ôn, Sửa không có câu mới.
4. Không câu tự luận, không câu chưa duyệt, không câu thuộc ô 0; không lặp câu trong một đề; câu đã làm không bao giờ phát lại như câu mới.
5. Đề Ôn có điểm ⇒ đáp án không xuống máy trước khi nộp (chấm sau nộp như thi). Ngày Mới, Sửa chấm tức thì như hiện nay.
6. Mọi đường mở ca kiểm tra qua cùng `chiaMaTran` + `kiemMaTran`; lệch ⇒ không mở ca. Số câu khác 28: chia phần dư lớn nhất, cộng dồn qua các lần rút. Đề thầy tự đưa nguyên bản ⇒ chỉ báo lệch.
Test khoá: 10 000 ngày giả lập mọi đề đạt 6 điều trên.

## 7. Các kênh đang cấp câu hằng ngày gộp về 28
Gói 7 ⇒ ngày Mới; Sửa lỗi 12–36 ⇒ ngày Sửa; Ôn srs2 / OMNI trộn 20 % ⇒ thôi trộn, chỉ cấp câu cho ngày Ôn; Kiểm tra cá nhân (làn Codex, đã rút 28 câu theo ma trận + phủ kiến thức yếu) ⇒ máy dựng đề ngày Ôn; game chiến dịch ⇒ vỏ của đề hôm nay; BTVN có điểm / ca kiểm tra trên lớp ⇒ là đề của ngày đó, lịch lùi 1 ngày; Bình Phản Ứng, Gọi lên bảng ⇒ trên lớp, không tính. Khi build soát lại kênh nào còn sống trước khi tắt.

## 8. Rủi ro (nói thẳng)
- **Phần II chưa có câu song sinh** (`songSinhDuDuLieu` chỉ nhận Phần I, III) ⇒ Sửa Phần II tạm dùng câu ĐS khác cùng dạng hoặc làm lại câu gốc sau khi xem lời giải. Cần đo độ phủ song sinh thật và giao Codex soạn bù.
- Giả lập dùng tỉ lệ đúng giả định; số câu mỗi bài, số dạng mỗi bài và nhịp chọn bài thật sẽ đo khi build (phiên này chưa đọc được D1: khoá Cloudflare bị từ chối).
- Ô dồn câu (mục 4) làm bài dài thêm 1–2 ngày ⇒ thầy xem lại mức câu của ô đó nếu thấy lạ.

## 9. Thầy chốt
1. **Sửa theo nhóm lỗi (dạng), không theo từng câu** — đòn bẩy làm lịch hội tụ (sửa từng câu: em trung bình/yếu chạy mãi không kịp, bài 3–5 kéo 30–70 ngày). Hệ quả: «sửa xong» tính theo dạng; cam kết cũ «12 ngày sửa ≥ 80 % câu sai» và số «câu cần chữa» trên các bảng đổi nghĩa ⇒ bảng sẽ hiện cả số câu sai và số nhóm (dạng) cần sửa.
2. Ngày Ôn: phương án B (R = 1, bài trong chương xoay vòng — em đề xuất) hay A (mọi bài cũ mọi chu kỳ, có thể +1–2 ngày/bài).
3. Luật chu kỳ mục 2 và «sai 3 lần ⇒ thầy chữa».
4. 6 chương 0 câu trong blueprint: đề kiểm tra mô phỏng ép tuyệt đối; ngày Ôn 10 % cho các chương này nếu đã học.
5. Phần II tạm theo mức cả câu (0/2/2).
6. Mâu thuẫn blueprint: P2.C2 ý b mã 0339 (Đ hay S); P1.C8 thuộc Chương 6 hay Nhóm IA.

## 10. Thứ tự build sau khi duyệt
1. `src/lib/ma-tran-chuan.ts` + `chiaMaTran` / `kiemMaTran` + test khoá blueprint.
2. Lõi thuần TypeScript chuyển từ `docs/de-xuat-28-cau-mo-phong/lich28.py`: công thức M/R/S, xếp chu kỳ, chọn câu từng loại ngày, nhóm lỗi + test giả lập 10 000 ngày.
3. Đo số thật (câu/bài, dạng/bài, nhịp chọn bài, độ phủ song sinh); giao Codex soạn song sinh Phần II.
4. Nối Gói 7 / Sửa / Ôn vào chu kỳ; gộp các kênh mục 7. Gói 7 đang có hạn cố định 7 ngày và bước phát hành `scripts/ap-goi7-song.ts` chốt quota ngày theo hạn đó ⇒ phải đổi sang chu kỳ theo thứ tự (không hạn cứng), sửa cả bước phát hành.
5. Cổng ma trận mọi đường mở ca.
6. Bản vẽ màn chọn bài (dự báo ngày theo em) + thẻ loại ngày của học sinh → thầy duyệt → build giao diện.
7. Cổng tốc độ + tác tử toc-do, phát hành.
