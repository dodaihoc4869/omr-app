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
- **Sửa:** theo **nhóm lỗi** = cùng bài + cùng dạng + cùng ô ma trận. Mỗi nhóm một suất: làm câu song sinh, đúng ⇒ cả nhóm xong; sai ⇒ lần sau song sinh khác; sai 3 lần ⇒ chuyển **thầy chữa trực tiếp** (danh sách trên app thầy). Ô không đủ nhóm lỗi ⇒ câu củng cố (song sinh của nhóm vừa xong, cùng ô).

## 2. Chu kỳ một bài của MỘT em (máy tự xếp)
1. Làm **M ngày Mới**; cứ sau 2 ngày Mới chen **1 ngày Sửa** (nếu có lỗi).
2. Hết câu mới ⇒ **R ngày Ôn** (đề kiểm tra ôn tập toàn diện bài cũ).
3. **Sửa đến khi sạch nhóm lỗi** của chu kỳ.
4. Chu kỳ đóng ⇒ sang bài kế thầy đã chọn (theo thứ tự chọn; không bỏ bài nào). Chưa có bài mới ⇒ thêm ngày Ôn.

## 3. Công thức số ngày (máy tính lúc thầy chọn bài, tính lại mỗi đêm theo kết quả thật)
- **M — ngày Mới (chung cả lớp):** M = max( ⌈N / 28⌉ , max theo ô ⌈câu của ô / suất của ô⌉ ). N = câu rút được của bài (bỏ tự luận, câu chưa duyệt, câu ô 0). Ô nào dồn quá nhiều câu thì bài phải thêm ngày Mới; các ô còn lại bù bằng song sinh / câu cùng ô cùng chương. Máy báo thầy ô gây thêm ngày.
- **R — ngày Ôn:** R = max(1, max theo chương ⌈số bài đã học của chương / số vị trí của chương⌉) ⇒ **mỗi bài cũ có ít nhất 1 câu trong mỗi chu kỳ**. Trong chương, bài lâu chưa ôn và bài em yếu nhất được chọn trước.
- **S — ngày Sửa (riêng từng em):** S = max theo ô ⌈nhóm lỗi dự kiến của ô / (suất của ô × tỉ lệ sửa được của em ở ô đó)⌉ + ⌊(M − 1) / 2⌋ ngày Sửa chen giữa.
  - nhóm lỗi dự kiến của ô = số dạng của ô × (1 − p^(câu/dạng)) + suất ô × R × (1 − p_ôn), với p = tỉ lệ đúng của CHÍNH em ở ô đó (14 ngày gần nhất).
- **Tổng T = M + R + S.** Thực tế chu kỳ chỉ đóng khi xong thật; con số T là dự báo để thầy nhìn.

## 4. Kết quả giả lập (giả định, không phải dữ liệu thật)
Giả định tỉ lệ đúng Biết / Hiểu / VD: Giỏi 97/90/80 %, Khá 92/80/60 %, Trung bình 85/65/40 %, Yếu 75/50/25 %; xem lời giải lấp nửa khoảng hổng; câu Ôn đúng kém 5 điểm %; 5 bài cũ; 200 lượt/em.

| Bài | M | Giỏi | Khá | Trung bình | Yếu |
|---|---|---|---|---|---|
| 56 câu đủ ô | 2 | 4 ngày (thực 5) | 5 (5) | 6 (6) | 7 (7) |
| 112 câu đủ ô | 4 | 8 (8) | 9 (9) | 10 (10) | 11 (11) |
| 100 câu lệch ô (40·22·10·8·4·7·9) | 6 | 11 (11) | 12 (12) | 13 (13) | 14 (14) |

Số ngoài ngoặc = máy dự báo, trong ngoặc = trung vị giả lập. Lệch quá ±1 ngày: **0/24** trường hợp. Mọi lượt: mỗi ngày đúng 28 câu, đúng 7 ô (máy tự kiểm từng đề), hết câu mới, sạch lỗi; 0–4 % số lỗi chuyển thầy chữa (em yếu nhiều nhất).
Bài 100 câu lệch ô: 22 câu Phần I Hiểu, ô này 4 suất/ngày ⇒ 6 ngày Mới thay vì 4, cần 68 suất bù.

## 5. Nhịp dạy của thầy (máy hiện khi chọn bài)
- Một em không thể làm nhanh hơn T ngày/bài với 28 câu/ngày. Thầy chọn bài mới khi em còn chu kỳ cũ ⇒ bài xếp hàng, em chậm dần (không bỏ phần nào).
- Ví dụ giả lập, thầy chọn 1 bài / 7 ngày: bài 56 câu ⇒ cả 4 kiểu em theo kịp; bài 112 câu ⇒ em giỏi chậm ~1 ngày/bài, em yếu ~4 ngày/bài, cộng dồn.
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
1. Luật chu kỳ mục 2 (2 Mới – 1 Sửa – … – Ôn – Sửa đến sạch) và «sai 3 lần ⇒ thầy chữa».
2. 6 chương 0 câu trong blueprint: đề kiểm tra mô phỏng ép tuyệt đối; ngày Ôn 10 % cho các chương này nếu đã học.
3. Phần II tạm theo mức cả câu (0/2/2).
4. Mâu thuẫn blueprint: P2.C2 ý b mã 0339 (Đ hay S); P1.C8 thuộc Chương 6 hay Nhóm IA.

## 10. Thứ tự build sau khi duyệt
1. `src/lib/ma-tran-chuan.ts` + `chiaMaTran` / `kiemMaTran` + test khoá blueprint.
2. Lõi thuần TypeScript chuyển từ `docs/de-xuat-28-cau-mo-phong/lich28.py`: công thức M/R/S, xếp chu kỳ, chọn câu từng loại ngày, nhóm lỗi + test giả lập 10 000 ngày.
3. Đo số thật (câu/bài, dạng/bài, nhịp chọn bài, độ phủ song sinh); giao Codex soạn song sinh Phần II.
4. Nối Gói 7 / Sửa / Ôn vào chu kỳ; gộp các kênh mục 7.
5. Cổng ma trận mọi đường mở ca.
6. Bản vẽ màn chọn bài (dự báo ngày theo em) + thẻ loại ngày của học sinh → thầy duyệt → build giao diện.
7. Cổng tốc độ + tác tử toc-do, phát hành.
