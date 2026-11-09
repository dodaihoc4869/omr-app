# ĐỀ XUẤT v5 — 28 câu/ngày «đủ 28, chuẩn nhất có thể» + Ôn + Sửa theo chuẩn nghiên cứu (09/11/2026)

Trạng thái: **ĐỀ XUẤT, CHƯA BUILD.** Bản HIỆN HÀNH, thay `docs/de-xuat-phan-bo-28-cau-0811.md` (v1–v4) và `docs/de-xuat-on-sua-0811.md`.
Thầy chốt 09/11: mỗi ngày đúng 28 câu theo cấu trúc mức độ đề thi; câu không đủ chuẩn thì rút sát chuẩn nhất, miễn đủ 28.
Kịch bản kiểm (chạy lại được): `docs/de-xuat-28-cau-mo-phong/` — `rut28.py` (rút câu), `tai-on.py` (tải Ôn/Sửa), `lich28.py` + `kiem-du-bao.py` (chu kỳ).

## 1. RÚT 28 CÂU — một luật cho mọi đường rút (ngày Mới, Ôn, Sửa, mọi kiểu ca kiểm tra)

Chuẩn mỗi đề (blueprint thầy): Phần I 12 Biết · 4 Hiểu · 2 VD; Phần II 2 Hiểu · 2 VD; Phần III 3 Hiểu · 3 VD.

**Bốn ưu tiên, theo thứ tự:** (1) đủ 28 câu; (2) đúng **phần** (18 TN · 4 ĐS · 6 TLN — hình dạng đề); (3) đúng **mức**; (4) câu của chính bài trước câu bù.

**«Giá lệch» của một câu đặt vào một suất:** cùng phần = số bậc mức chênh (Biết↔Hiểu 1, Biết↔VD 2); khác phần = 10 + số bậc chênh. Máy chọn cách xếp có TỔNG giá lệch nhỏ nhất.

**Năm bước cho ngày Mới của một bài:**
1. M = ⌈N / 28⌉ ngày Mới (N = câu rút được của bài: bỏ tự luận, câu chưa duyệt).
2. Khớp đúng ô trước.
3. Câu thừa của bài lấp suất thiếu có giá lệch nhỏ nhất (mọi câu của bài đều được làm).
4. Suất còn thiếu: câu bù đúng ô (song sinh → kho chung cùng chương); hết bù đúng ô mới bù ô gần nhất.
5. Rải đều câu lệch cho M ngày (lệch phần rải trước), không dồn ngày nào.

**Ví dụ tính bằng máy (`rut28.py`, kho giả định):**

| Bài | Kho theo ô (I-B, I-H, I-VD, II-H, II-VD, III-H, III-VD) | M | Mỗi ngày | Lệch |
|---|---|---|---|---|
| A — dồn Phần I Hiểu | 40·22·10·8·4·7·9 = 100 | 4 | 4 ngày đều 18/4/6, đúng ô 26/28, 3 câu bù | 8/112 suất, đều trong Phần I: câu Hiểu/VD vào suất Biết (đề khó hơn chuẩn một chút) |
| B — chỉ 6 câu ĐS, kho chung còn 4 | 50·20·8·3·3·10·6 = 100 | 4 | Phần I/II/III: 20/2/6 · 20/2/6 · 20/3/5 · 19/3/6; đúng ô 25–26/28 | 9/112; thiếu 6 câu ĐS ⇒ 6 suất Phần II phải lấy câu TN |

- So với luật cũ «ma trận tuyệt đối»: bài A cần 6 ngày Mới + 68 câu bù; luật mới: **4 ngày + 12 câu bù**, chỉ 2 câu/ngày lệch mức trong cùng phần.
- Mỗi đề hiện cho thầy **độ chuẩn «26/28 đúng ô»** và lý do lệch («Bài B thiếu 6 câu Đúng/Sai — bổ sung thì đủ 18/4/6»).
- Số câu khác 28 (ca kiểm tra 10, 40 câu …): chuẩn chia theo phần dư lớn nhất rồi rút đúng luật trên. Ca kiểm tra trên lớp: máy hiện độ chuẩn trước khi mở; thầy vẫn mở được.

## 2. ÔN — đề thi thử 28 câu, đúng chỗ em sắp quên

| Làm gì | Vì sao (nghiên cứu) |
|---|---|
| Ôn bằng **làm đề**, không đọc lại | Tự kiểm tra + ôn giãn cách: hai kỹ thuật duy nhất «hiệu quả cao» trong 10 kỹ thuật (Dunlosky 2013) |
| **Trộn mọi bài đã học** trong một đề | Thử nghiệm 787 học sinh: 61 % so với 38 % sau 1 tháng (Rohrer 2020) |
| Dùng **câu song sinh** (đẳng cấu) của câu đã làm | Đo hiểu, không đo nhớ đáp án — đúng cách Bộ biến 0326 → 0339 trong blueprint |
| Ôn **lúc sắp quên**, giãn dần | Khoảng cách tốt nhất tăng theo thời gian cần nhớ (Cepeda 2008); Duolingo, Anki/FSRS |
| **Chấm sau khi nộp cả đề**, xem chữa ngay sau đó | Đáp án trả sau cả bài trắc nghiệm giúp nhớ hơn trả từng câu (Butler, Karpicke & Roediger 2007) — luật «đáp án đề có điểm không xuống máy» thành lợi thế |

**Toán — một con số cho mỗi em × mỗi dạng:** độ bền h (ngày). Khả năng nhớ hôm nay **R = 2^(−t/h)** (t = ngày từ lần làm gần nhất).
- Dự báo làm đúng có tính **đoán mò**: P(đúng) = g + (1 − g)·R, g = 0,25 (Phần I, 4 phương án), 0,5 (mỗi ý ĐS), 0 (Phần III).
- Đúng ⇒ h × [1 + (0,5 + 3(1 − R)) × (1 − g)] — đúng câu tự luận số tin hơn đúng câu khoanh. Ví dụ R = 70 %: Phần III ×2,4; Phần I ×2,05.
- Đúng nhưng em bấm «Chưa chắc» ⇒ h × 1,2. Sai ⇒ h × 0,6 và thành lỗi.
- Câu ĐS: mỗi ý cập nhật dạng của ý đó (`kien_thuc_y`).
- Hằng số là giá trị tạm; mỗi tháng máy khớp lại bằng lịch sử thật (`su_kien_hoc`), báo độ khớp dự báo.

**Chọn câu đề Ôn (ví dụ bài 9, đã học 8 bài):** 28 vị trí blueprint, chỉ chương đã học (vị trí chương chưa học chuyển cho chương đã học em yếu nhất, giữ phần × mức). Mỗi vị trí:
1. nhóm lỗi đang chờ lượt kiểm lại (mục 3);
2. dạng **vừa chạm ngưỡng quên** (R gần 70 % nhất — thầy chỉnh ngưỡng);
3. dạng **quên sâu** (R < 30 %) KHÔNG ôn mù ⇒ chuyển sang ngày Sửa dạng «học lại» (xem ví dụ mẫu trước rồi làm).

**Số ngày Ôn = ngân sách 1 ngày/bài** (thầy chỉnh 1–2; ngày chưa có bài mới thì thêm Ôn; 3 tháng cuối trước thi nên tăng 2 ngày/bài).
- Đã kiểm: «ôn mọi dạng dưới ngưỡng» làm số ngày Ôn phình 16 ngày (bài 9) → 28 ngày (bài 15) vì Phần II VD chỉ 2 suất/đề. Ngân sách cố định ⇒ chu kỳ bài 9 và bài 15 gần bằng nhau, lỗi sạch; ưu tiên «gần ngưỡng» tốn ít ngày Sửa hơn «quên sâu nhất» (`tai-on.py`).
- Điểm đề Ôn chấm thang Bộ (Phần II: 1 ý 0,1 · 2 ý 0,25 · 3 ý 0,5 · 4 ý 1,0) ⇒ báo phụ huynh như điểm thi thử.

## 3. SỬA — phân loại lỗi, chữa đúng loại, kiểm lại nhiều lượt

| Làm gì | Vì sao (nghiên cứu) |
|---|---|
| Sai là hiện **đáp án + lời giải**, không chỉ báo «sai» | Chỉ báo đúng/sai không giúp; phải có đáp án (Pashler 2005). Sai rồi được chữa có lợi; phân tích lập luận dẫn tới sai đặc biệt quan trọng (Metcalfe 2017) |
| Lời giải **bác bỏ hiểu nhầm** khi em mắc bẫy | Văn bản bác bỏ: nêu hiểu nhầm → vì sao sai → đúng là gì; tổng hợp 44 so sánh g = 0,41 (Schroeder & Kucera 2022) |
| **Ví dụ mẫu** khi chưa biết cách | Hiệu ứng ví dụ mẫu (Sweller); bớt dần khi em đã vững (đảo ngược theo trình độ) |
| **Kiểm lại ở nhiều ngày** | Học lại nhiều lượt; ~3 buổi đủ phần lớn lợi ích (Rawson & Dunlosky 2011) |
| Sai mà **chắc** ⇒ ưu tiên | Sửa nhanh (hypercorrection, Butterfield & Metcalfe 2001) nhưng dễ tái phạm nếu quên ⇒ cần kiểm lại |

**Bước 1 — ngay lúc sai** (ngày Mới, Sửa: tức thì; đề Ôn: sau khi nộp): một chạm chọn loại lỗi + bước sai (đã có `chan-doan-buoc-sai.ts`):
- **«Tính / đọc đề sai»** (bất cẩn);
- **«Chưa biết cách»**;
- **«Hiểu nhầm»** — máy tự gợi ý loại này khi em chọn đúng phương án nhiễu mà blueprint đã mô tả bẫy (cột «Logic thiết kế phương án nhiễu», vd chọn «chất oxi hoá» ở câu ăn mòn) hoặc em đã bấm «Chắc».

**Bước 2 — chữa theo loại, gộp theo nhóm** (cùng bài + cùng dạng + cùng ô; một câu song sinh chung cho cả nhóm):

| Loại | Xem gì trước | Số lượt đúng cần (ở các ngày khác nhau) |
|---|---|---|
| Tính / đọc đề sai | lời giải chỉ đúng bước sai | 1 |
| Chưa biết cách | ví dụ mẫu theo tư duy dạy của thầy (`docs/tu-duy-day-hoa-thay-2610.md`: sơ đồ cột dọc, bảo toàn nguyên tố) | 2 |
| Hiểu nhầm | lời giải bác bỏ đúng cái bẫy em mắc | 3 |

- Lượt 1 ở ngày Sửa (câu song sinh, không xem lời giải trước). Lượt 2, 3 do đề Ôn gọi (mục 2, ưu tiên 1) ⇒ không tốn thêm ngày Sửa.
- Chu kỳ bài đóng khi mọi nhóm xong lượt 1; nhóm còn lượt sang chu kỳ sau.
- Sai 3 lần ⇒ **thầy chữa trực tiếp**. Từ 30 % số em của lớp cùng một nhóm lỗi ⇒ app gợi ý thầy **chữa chung trên lớp** (Gọi lên bảng / Bình Phản Ứng) thay vì để từng em tự sửa.

**Ngày Sửa 28 câu, đúng luật rút mục 1:** lỗi trong ô → nhóm «học lại» (dạng quên sâu) → song sinh củng cố của nhóm vừa xong cùng ô.

## 4. Chu kỳ một bài của từng em
M ngày Mới (cứ 2 Mới chen 1 Sửa nếu có lỗi) → 1 ngày Ôn → Sửa đến khi mọi nhóm xong lượt 1 → bài kế (không bỏ bài).
- Kiểm tải có tính quên (`tai-on.py`, giả định, bài 112 câu đủ ô, 1 ngày Ôn/bài, luật sửa 2 lượt, chưa tính đoán mò): em khá ~10–11 ngày/bài, em yếu ~18 ngày/bài; không phình theo số bài. Lượt 2–3 nằm trong ngân sách Ôn nên phân loại lỗi không làm dài chu kỳ; sẽ chạy lại khi build.
- Máy hiện khi thầy chọn bài: số ngày Mới, độ chuẩn đề, dự kiến từng em xong ngày nào, em nào đang chậm.

## 5. Nói thẳng
- Các con số chu kỳ dùng thông số tạm; máy đo lại bằng dữ liệu trung tâm sau khi chạy.
- Phần II **chưa có câu song sinh** ⇒ Sửa/Ôn Phần II tạm dùng câu ĐS khác cùng dạng; cần giao Codex soạn.
- Bằng chứng ôn trộn mạnh nhất ở toán lớp 7; học lại nhiều lượt chủ yếu ở đại học; bác bỏ hiểu nhầm có tranh luận (Zengilowski 2021 hoài nghi, Danielson 2024 vẫn thấy lợi). Áp vào Hoá luyện thi là suy luận hợp lý.
- Thêm nút «Chắc / Chưa chắc» và một chạm «loại lỗi» là đổi giao diện ⇒ cần bản vẽ, thầy duyệt trước build.

## 6. Thầy chốt
1. Bốn ưu tiên rút câu (đủ 28 > đúng phần > đúng mức > câu của bài) và «độ chuẩn x/28» hiện cho thầy.
2. Ngưỡng quên 70 %, ngân sách 1 ngày Ôn/bài.
3. Phân loại lỗi 3 loại với 1 / 2 / 3 lượt; nút «Chắc / Chưa chắc» chỉ ở câu Ôn và Sửa.
4. Gợi ý chữa chung trên lớp khi từ 30 % em cùng nhóm lỗi.
5. Giữ từ trước: 6 chương 0 câu trong blueprint (ngày Ôn dành 10 %?); Phần II tạm theo mức cả câu (0/2/2); hai mâu thuẫn blueprint (P2.C2 ý b mã 0339; P1.C8 thuộc chương nào).

## 7. Nguồn
Dunlosky 2013 (https://www.sciencedaily.com/releases/2013/01/130110111734.htm) · Rohrer 2020 (https://ies.ed.gov/ncee/wwc/Study/88770) · Cepeda 2008 (https://www.evullab.org/pdf/CepedaVulRohrerWixtedPashler-PS-2008.pdf) · Duolingo HLR (https://www.github.com/duolingo/halflife-regression) · FSRS (https://expertium.github.io/Algorithm.html, https://expertium.github.io/Benchmark.html) · Butler, Karpicke & Roediger 2007 (https://pcllab.github.io/downloads/2007/2007_Butler_Karpicke_Roediger_JEPA.pdf) · Pashler 2005 (https://digitalcommons.usf.edu/psy_facpub/1773) · Metcalfe 2017 (https://www.learningscientists.org/blog/2019/10/17-1) · Schroeder & Kucera 2022 (https://link.springer.com/article/10.1007/s10648-021-09656-z) · Danielson 2024 (https://par.nsf.gov/biblio/10629626) · Ví dụ mẫu (https://en.wikipedia.org/wiki/Worked-example_effect) · Rawson & Dunlosky (https://openscholarship.wustl.edu/circle_book/8) · Hypercorrection (https://en.wikipedia.org/wiki/Hypercorrection_(psychology))
