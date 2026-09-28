# ĐẶC TẢ — BI-A PHẢN ỨNG (game thứ ba trên Sảnh Bát Linh, app học sinh)

Bản chốt để build. Soạn 28/09/2026, cập nhật lần 5 cùng ngày (bi nguyên tố, tối đa 4 người, 3 bố cục màn hình, toàn màn hình, âm thanh, sai là sang lượt ngay, xem lại câu sai). Trạng thái: **CHƯA BUILD — chờ thầy ra lệnh.**
Bản vẽ chơi được (phiên bản 5): `docs/ban-ve-bi-a-2809/bi-a-phan-ung.html` — artifact https://claude.ai/artifact/7FjPu2CSL4QtnigCD4gdQg.
Đề bài build ngắn: `prompt-bi-a-phan-ung.md` (trỏ về tệp này; khi hai tệp khác nhau, **tệp này thắng**).

---

## 0. Tóm tắt một trang

- **Là gì**: game bi-a trên điện thoại (dọc và xoay ngang) và máy tính. Mỗi viên bi là **một nguyên tố** và mang **một câu trong kế hoạch hôm nay của chính em**, lấy từ Chiến dịch luyện thầy giao, giống Bát Linh Đảo và Đoàn Hộ Tống.
- **Bi nguyên tố**: Phe Kim loại (7 bi trơn ánh kim: Na, Mg, Al, Fe, Cu, Ag, Au) đấu Phe Phi kim (7 bi sọc: N, O, F, P, S, Cl, I); Bi chốt là carbon (C). Trên bi có ô tròn ghi Z và kí hiệu. **Chỉ vào bi nào** (rê chuột hoặc chạm) thì hiện nhãn: bi của em, của đồng đội, của đối thủ, hay Bi chốt.
- **Học ở đâu**: bi rơi lỗ thì người giữ bi trả lời câu của bi đó, đúng mới ăn. Sai thì **lượt sang người kế tiếp ngay**, em đọc lời giải, bấm "Đã đọc" là tấm đóng. Lúc người khác đánh, em **giải trước** câu của bi mình (đúng thì bi hoá vàng) hoặc bấm **Xem lại câu sai**. Mỗi câu đúng cho 1 **Mắt thần**.
- **Không phá kinh tế đang có**: dùng chung kế hoạch ngày, chung lệnh chấm, chung EXP (trần 120/ngày), chung Thể lực. Bi-a chỉ được lấy **tối đa 40% phần của Đoàn và 40% phần của Đảo** mỗi ngày.
- **Sau khi xong kế hoạch ngày**: mở **Bàn giao hữu** (không câu, không EXP, tối đa 2 ván/ngày).
- **Vật lý thật**: trượt rồi lăn, xoáy trên/dưới/ngang, ma sát băng và bi–bi, bi 3D xoay; tất định để đấu online chỉ gửi 1 gói tin mỗi cú. **Âm thanh mô phỏng** theo lực va chạm thật.
- **Chơi với nhau, tối đa 4 người**: luật 8 bi có 2 phe, nên **đấu đơn** (1–1) hoặc **đánh đôi** (2–2). Ghế trống do A.I Đỗ Đại Học ngồi; tự chơi một mình với A.I được. Mỗi em một máy; không có "hai người một máy".
- **Màn hình**: điện thoại dọc, điện thoại xoay ngang, máy tính; bàn tự nằm ngang khi khung rộng. Nút **toàn màn hình** chỉ còn bàn bi-a và điều khiển nổi.

## 1. Quyết định của thầy và giả định

### 1.1 Thầy đã chốt (nguyên văn, 28/09/2026)

| # | Lời thầy | Nghĩa trong đặc tả |
|---|---|---|
| Q1 | "tôi muốn nó phải gắn vào kho đề tôi đã chọn giống các game khác" | Câu lấy từ kế hoạch ngày của Chiến dịch luyện, chấm bằng lệnh chấm chung (mục 4). |
| Q2 | "Bi phải có đủ hiệu ứng xoay, xoáy như thật, độ trơn bị quán tính như thật" | Mô hình vật lý mục 7, nghiệm thu đo được ở mục 12. |
| Q3 | "1. Giữ 40%" | Trần Bi-a = floor(40% phần Đoàn) + floor(40% phần Đảo) của kế hoạch ngày (mục 4.3). |
| Q4 | "2. Câu đúng đủ mới ăn" | Câu Đúng–sai phải đúng cả 4 ý mới ăn bi, đúng cách chấm `grade()` hiện có. |
| Q5 | "3. có mở bàn giao hữu" | Bàn giao hữu sau khi xong kế hoạch ngày (mục 5). |
| Q6 | "soạn đặc tả thật kĩ trước khi build báo tôi ra lệnh xong mới build" | Tệp này. Không sửa `src/`, `server/` cho tới khi thầy ra lệnh. |
| Q7 | "thiết kế lại Bi đậm chất hoá học, chỉ vào bi nào thì đấy hiện của mình hay của đối thủ" | Bi nguyên tố (3.1, 7.3); nhãn chỉ bi (3.11). |
| Q8 | "có chế độ tự chơi với a.i và chơi tối đa cùng nhau số người theo luật" | Đấu đơn, đánh đôi, tối đa 4 người; ghế trống là A.I (3.10, 6). |
| Q9 | "thiết kế có cả xoay ngang màn hình và màn hình máy tính chuyên nghiệp, đẹp mắt và cuốn hút, có nút toàn màn hình chỉ hiện nguyên bàng Bia nhé" | Ba bố cục (8.3), toàn màn hình (8.6). |
| Q10 | "có đầy đủ âm thanh mô phỏng chân thật nhé" | Âm thanh mô phỏng (8.7). |
| Q11 | "khi trả lời sai thì lượt hiện luôn với người khác chơi được luôn rồi, còn đọc lời giải thì khi bấm đã đọc thì tự động biến mất, khi chờ tới lượt có nút xem lại câu sai hiện lên để xem lại câu sai theo chuẩn hiển thị của app trong lúc chờ lượt" | Sai là sang lượt ngay (3.5); nút "Đã đọc lời giải" đóng tấm (8.4); Xem lại câu sai (8.8). |

### 1.2 Giả định em tự chọn (thầy sửa một dòng là đổi)

| # | Giả định | Lý do |
|---|---|---|
| G1 | Câu chốt = câu **Vận dụng** trong phần Bi-a của kế hoạch, ưu tiên câu ôn em đang sai; không có câu Vận dụng thì lấy câu khó nhất còn lại. | Câu chốt là cú quyết định, nên là câu khó nhất. |
| G2 | Bàn giao hữu chỉ đấu với A.I hoặc với bạn **cũng đã xong kế hoạch ngày**; không tính Điểm bàn. | Không để bạn chưa học xong bị kéo đi chơi. |
| G3 | Điểm ván: Nhận biết 10, Thông hiểu 20, Vận dụng 30, hạ Bi chốt 50, bi trống 5. | Đã dùng trong bản vẽ. |
| G4 | Mắt thần tối đa 3; mỗi cú đánh của em tự dùng 1 nếu có. | Đơn giản cho học sinh, đã dùng trong bản vẽ. |
| G5 | A.I Đỗ Đại Học đúng Nhận biết 85%, Thông hiểu 75%, Vận dụng 60%, Câu chốt 70%; giải trước 1 bi mỗi 12 giây trong lượt em. | Số đang dùng trong bản vẽ; chỉnh sau khi xem 1 tuần dữ liệu thắng thua thật. |
| G6 | Đấu với A.I **có** câu thật và tính vào trần Bi-a như đấu với bạn. | A.I là cách chơi khi không ai rảnh; học vẫn phải thật. |
| G7 | Điểm bàn chỉ tính ở ván online với bạn (không tính ván A.I, không tính giao hữu). Elo K = 24, khởi đầu 1000. | Xếp hạng công bằng giữa người với người. |
| G8 | Mỗi em chỉ có 1 ván Bi-a đang mở; ván mở quá 2 giờ không ai đánh thì tự đóng. | Khớp cách Đảo/Đoàn giữ phiên 2 giờ. |
| G9 | Bi-a đóng hoàn toàn khi em đang có ca kiểm tra mở. | Không để game chen vào giờ thi. |
| G10 | Tối đa 4 người một bàn: 2 phe × 2 người (đánh đôi). Không làm 3 phe hay 6 người. | Luật 8 bi chỉ có 2 nhóm bi; đánh đôi là thể thức chuẩn của bi-a. |
| G11 | Đánh đôi: người 1 của phe giữ bi thứ 1, 3, 5, 7 của phe (4 bi), người 2 giữ bi thứ 2, 4, 6 (3 bi). **Người giữ bi trả lời câu của bi**, ai đánh vào cũng vậy; Câu chốt do người hạ Bi chốt trả lời (câu của chính người đó). | Mỗi em chỉ trả lời câu của mình, giữ đúng kế hoạch cá nhân. |
| G12 | Màu bi theo bảng màu nguyên tử Jmol (quy ước trong mô hình phân tử); riêng C của Bi chốt màu đen (truyền thống bi số 8), không xám như Jmol. Tên nguyên tố theo IUPAC như chương trình 2018. | Học sinh gặp lại đúng màu này ở mô hình phân tử trong sách. |
| G13 | Cùng một cú rơi nhiều bi thường: trả lời lần lượt; **một câu sai là dừng**: các bi còn chờ về chân bàn, không mở câu (câu đó không tính, về lại kế hoạch), lượt sang ngay. | Thầy yêu cầu sai là sang lượt ngay (Q11). |
| G14 | Đánh đôi online có người rớt mạng > 60 giây: ghế đó chuyển cho A.I Đỗ Đại Học (bi của người đó thành bi A.I, câu chưa trả lời về lại kế hoạch của người đó); ván không tính Điểm bàn. | Ba bạn còn lại không phải bỏ ván. |

## 2. Từ ngữ (thêm vào `docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md`, mục A2)

| Từ chuẩn | Nghĩa | Không dùng |
|---|---|---|
| Bi-a Phản Ứng | Tên game | "game bi-a", "billiard" |
| Bi nguyên tố | Mỗi bi là một nguyên tố, ghi Z và kí hiệu | "bi số" |
| Phe Kim loại / Phe Phi kim | 7 bi trơn ánh kim (Na Mg Al Fe Cu Ag Au) / 7 bi sọc (N O F P S Cl I) | "bi solid/stripe", "đội" |
| Bi của em / Bi của đồng đội / Bi của đối thủ | Quan hệ của một bi với em, hiện trên nhãn chỉ bi | "bi của bạn" (dễ lẫn đồng đội với đối thủ) |
| Đấu đơn / Đánh đôi | 1 đấu 1 / 2 đấu 2 | "solo", "2v2" |
| Đồng đội / Đối thủ | Người cùng phe / khác phe | "team" |
| Ghế | Một chỗ ngồi trong bàn (tối đa 4); ghế trống do A.I ngồi | "slot" |
| Bi vàng | Bi đã giải trước đúng, vào lỗ là ăn | "bi đã mở khoá" |
| Bi trống | Bi không có câu (khi hết trần hoặc ở Bàn giao hữu) | "bi rỗng" |
| Bi chốt / Câu chốt | Bi carbon (C) ở giữa hàng 3 / câu phải trả lời khi hạ Bi chốt | "bi 8 đen", "câu cuối" |
| Giải trước | Giải câu của bi mình trong lượt người khác | "làm trước" |
| Xem lại câu sai | Mở lại câu em sai trong ván, đúng mẫu "Câu đã làm" | "ôn lại" |
| Mắt thần | Lượt thấy trước đường đi thật của bi | "gợi ý ngắm" |
| Phạm luật | Lỗi trong cú đánh | "foul", "lỗi" (dễ lẫn với "lỗ") |
| Đặt bi cái | Được đặt bi cái chỗ tuỳ ý sau khi người trước phạm luật | "ball in hand" |
| Điểm ván / Điểm bàn | Điểm của phe trong một ván / điểm xếp hạng lâu dài | "rank", "elo" |
| Trần Bi-a | Số câu tối đa Bi-a được lấy trong ngày | "quota" |
| Bàn giao hữu | Ván không câu sau khi xong kế hoạch ngày | "chơi tự do" |
| Mã bàn | 4 chữ số để vào cùng bàn | "room code" |
| Toàn màn hình | Chỉ còn bàn bi-a và điều khiển nổi | "fullscreen" |

Con số nào trên màn cũng có nhãn: "Trần Bi-a hôm nay: còn 11/15 câu", "Mắt thần: 2", "Điểm ván 120", "Lượt em · 24 giây".

## 3. Luật chơi đầy đủ

### 3.1 Bàn và bi
- Bàn 500 × 900 đơn vị (bàn dọc; màn rộng thì **vẽ** nằm ngang, vật lý không đổi), 6 lỗ (4 góc, 2 giữa cạnh dài). Bi bán kính R = 21.
- 15 bi nguyên tố:

| Phe | Bi (Z) | Kiểu bi |
|---|---|---|
| Kim loại | Na (11), Mg (12), Al (13), Fe (26), Cu (29), Ag (47), Au (79) | trơn, ánh kim |
| Phi kim | N (7), O (8), F (9), P (15), S (16), Cl (17), I (53) | sọc |
| Bi chốt | C (6) | đen |

- Xếp tam giác 5 hàng, đỉnh ở chấm chân bàn (250; 270), từ đỉnh: `[Na] [O, Mg] [Al, C, N] [S, Fe, Cl, Cu] [Ag, F, Au, P, I]`. Bi chốt ở giữa hàng 3; hai góc sau một Kim loại (Ag) một Phi kim (I).
- Bi cái ở chấm đầu bàn (250; 720).
- Phe Kim loại phá bàn (người mời, hoặc em khi tự chơi với A.I). Người được mời vào Phe Phi kim; đánh đôi thì chủ bàn xếp ghế ở phòng chờ.
- Mỗi bi thường mang 1 câu của **người giữ bi** (G11), trừ khi là bi trống. Bi chốt mang Câu chốt riêng của từng em (xếp sẵn lúc vào ván).

### 3.2 Một lượt đánh
- Đồng hồ cú đánh: 30 giây, chỉ chạy khi tấm câu hỏi đang đóng. Hết giờ: mất lượt, không tính phạm luật.
- Nhắm: chạm/kéo trên bàn; nút ‹ › xoay 0,3°; phím ← → (Shift: 0,1°).
- Lực: thanh lực nằm ngang ở màn dọc (kéo sang phải), dựng đứng ở màn ngang, máy tính và toàn màn hình ngang (kéo xuống); hoặc giữ phím cách. Thả là đánh. Lực < 2% thì huỷ cú.
- Xoáy: chọn điểm chạm trên mặt bi cái, bán kính tối đa 0,8 (xoáy ngang sx, xoáy dọc sy).
- Phá bàn (cú đầu ván): chạm bi nào trước cũng được; vẫn tính phạm luật nếu bi cái rơi lỗ hoặc không chạm bi nào.

### 3.3 Xử lý cuối cú đánh (thứ tự bắt buộc)
1. Xác định **phạm luật** (mục 3.4). Có phạm luật ⇒ mọi bi rơi trong cú (kể cả Bi chốt) đặt lại chân bàn; bi cái rơi thì đặt ở đầu bàn; đối thủ được **đặt bi cái**; hết lượt. Không mở câu nào.
2. Không phạm luật:
   - Bi của **phe đối thủ** rơi ⇒ đặt lại chân bàn; lượt sẽ kết thúc sau bước 3.
   - Bi **vàng** của phe người đánh rơi ⇒ ăn ngay, phe cộng điểm ván (tính cho người giữ bi).
   - Bi **trống** của phe người đánh rơi ⇒ ăn ngay, +5 điểm ván.
   - Bi **thường** của phe người đánh rơi ⇒ xếp vào hàng đợi câu (theo thứ tự rơi); người giữ bi trả lời (có thể là đồng đội của người đánh).
   - **Bi chốt** rơi ⇒ xếp Câu chốt cuối hàng đợi, người đánh trả lời (chỉ xảy ra khi phe đã ăn đủ 7 bi trước cú này, vì nếu không đã là phạm luật). Bi chốt đang là bi trống (hết trần, hoặc Bàn giao hữu) ⇒ phe thắng ngay, không cần câu.
3. Trả lời lần lượt từng câu trong hàng đợi (mục 3.5). Câu chốt đúng ⇒ **phe thắng ván**, dừng. **Một câu sai ⇒ dừng hàng đợi**, các bi còn chờ về chân bàn không mở câu, **lượt sang người kế tiếp ngay** (G13).
4. Người đánh được **đánh tiếp** khi và chỉ khi: không phạm luật, không câu nào sai, không bi phe đối thủ nào rơi, và có ít nhất 1 bi được ăn trong cú. Ngược lại hết lượt (không đặt bi cái), sang ghế kế tiếp theo thứ tự ở 3.10.

### 3.4 Phạm luật
| Mã | Điều kiện |
|---|---|
| P1 | Bi cái rơi lỗ |
| P2 | Bi cái không chạm bi nào |
| P3 | Bi đầu tiên bi cái chạm là bi của phe đối thủ (không áp dụng ở cú phá bàn). Chạm trước bi của **đồng đội** không phạm luật (cùng phe). |
| P4 | Bi đầu tiên bi cái chạm là Bi chốt khi phe còn bi chưa ăn (không áp dụng ở cú phá bàn) |
| P5 | Bi chốt rơi khi phe còn bi chưa ăn (kể cả ở cú phá bàn) |

Chạm băng sau va không bắt buộc (luật đơn giản cho học sinh).

### 3.5 Trả lời câu sau khi bi rơi
- **Ai trả lời**: người giữ bi (G11). Đánh đôi: đồng đội đánh bi của em vào lỗ ⇒ tấm câu mở trên máy em, dòng trên cùng "Đồng đội Minh Châu đánh bi Na của em vào lỗ · em trả lời". Em đang giải trước dở ⇒ chốt câu đó xong mới mở câu này; lượt đứng chờ. Người khác thấy "Linh đang giải bi Na · Thông hiểu" và đồng hồ câu, không thấy nội dung.
- Thời gian: Phần I 90 giây, Phần II 180 giây, Phần III 180 giây. 10 giây cuối có tiếng tích tắc. Hết giờ = sai trong ván (bi về chân bàn, sang lượt). *(Đã làm, 28/09)*: hết giờ mà em đã chọn đủ ⇒ tự nộp cho máy chủ chấm; chưa chọn đủ ⇒ KHÔNG gửi máy chủ (lệnh `answer` chỉ nhận đáp án đúng định dạng) — câu **chưa tính**, bi giữ câu cũ, không đếm vào câu sai của ván.
- **Đúng** (Phần II: đúng cả 4 ý): phe ăn bi, cộng điểm ván, người trả lời +1 Mắt thần (tối đa 3). Lời giải gập, bấm "Xem lời giải" mới mở. Nút vàng "Đánh tiếp" (em là người đánh) hoặc "Về bàn" (đồng đội là người đánh); bấm xong người đánh đánh tiếp.
- **Sai**: bi đặt lại chân bàn và **đổi câu** (mục 4.4). **Lượt sang người kế tiếp ngay lúc chấm** — không chờ em đọc lời giải; người kế tiếp (bạn, đồng đội hay A.I) đánh được luôn. Tấm câu ở lại trên máy em: băng "Chưa đúng · bi Na quay lại bàn · Đã sang lượt <tên>", lời giải mở sẵn theo mẫu chuẩn, đồng hồ câu ẩn, một nút xanh **"Đã đọc lời giải"**; bấm là tấm đóng, không làm gì thêm. Câu vào danh sách **Xem lại câu sai** của ván (8.8).
- Tấm lời giải đang mở mà tới lượt em đánh: đồng hồ cú đánh chưa chạy, bấm "Đã đọc" xong mới chạy.
- Rơi nhiều bi thường: như G13.

### 3.6 Giải trước
- Mở được khi **không phải lúc em đang nhắm/đánh**: trong lượt đối thủ hoặc đồng đội, khi bi đang lăn ở lượt người khác, khi người khác đang trả lời câu. Không mở khi em đang xem lại câu sai.
- Chạm một bi ở hàng "Bi của em" (chưa ăn, chưa vàng, không phải bi trống) ⇒ tấm câu hỏi của bi đó.
- **Đúng**: bi hoá vàng, +1 Mắt thần. **Sai**: lời giải mở sẵn, bi đổi câu (mục 4.4), không mất gì khác.
- Tới lượt em mà đang giải dở: giải xong mới đánh; đồng hồ cú đánh chỉ chạy khi đóng tấm câu. Tấm câu của em **không bao giờ** chặn cú đánh của người khác hay A.I.
- Không giải trước được Câu chốt.

### 3.7 Mắt thần
- Nguồn: mỗi câu đúng **của chính em** (sau khi bi rơi hoặc giải trước) +1, tối đa 3. Không có nguồn nào khác; Mắt thần không chia cho đồng đội.
- Dùng: mỗi cú đánh của em trừ 1 nếu đang có.
- Có Mắt thần: đường đi thật của bi cái (chấm trắng, tới lần va thứ 2 hoặc 1,1 giây sau va đầu) và bi mục tiêu (vàng, 0,9 giây) tính bằng chính lõi vật lý với lực và xoáy đang chọn; cập nhật tối đa 16 lần/giây khi kéo lực. Chưa kéo lực thì mô phỏng ở lực 50%.
- Không có: chỉ đường thẳng tới điểm va, bóng bi ma, vòng tròn bi mục tiêu (đỏ + dấu × nếu chạm trước là phạm luật).

### 3.8 Bi chốt và Câu chốt
- Phe ăn đủ 7 bi thì người tới lượt của phe mới được nhắm Bi chốt.
- Bi chốt rơi hợp lệ ⇒ người hạ trả lời Câu chốt **của chính mình**. Đúng: +50 điểm ván, phe thắng. Sai: Bi chốt đặt lại chân bàn, lời giải, hết lượt; lần sau dùng **Câu chốt khác** (câu Vận dụng kế tiếp trong trần còn, gọi `bia-doi-cau` với `chot: true`). Không bao giờ hỏi lại câu đã trả lời trong phiên, vì `answer` chỉ nhận mỗi câu một lần mỗi phiên (khoá `phiên|câu`, gửi lại chỉ trả kết quả cũ). Hết trần khi cần Câu chốt mới ⇒ Bi chốt thành bi trống: hạ hợp lệ là thắng, không +50.
- Câu chốt chấm như vai `trum` (EXP câu trùm, mục 4.8).

### 3.9 Kết thúc ván
| Tình huống | Kết quả |
|---|---|
| Câu chốt đúng | Phe người đó thắng |
| Bỏ cuộc (nút "Bỏ ván", có hộp xác nhận nêu hậu quả) | Đấu đơn: người kia thắng. Đánh đôi: ghế bỏ chuyển cho A.I (G14). Câu chưa đụng tới trả về kế hoạch |
| Rớt mạng > 60 giây (online) | Đấu đơn: người còn lại thắng. Đánh đôi: ghế chuyển cho A.I (G14) |
| Ván mở quá 2 giờ | Tự đóng, không ai thắng |

Màn Kết thúc ván: người (đấu đơn) hoặc phe (đánh đôi) thắng; bảng mỗi ghế một dòng: Câu đúng x/y, Bi ăn, Bi vàng; dòng Điểm ván của 2 phe; nút "Xem lại câu sai (n)" khi em có câu sai; EXP nhận (lấy từ phản hồi `answer`, không tự tính ở máy); Thể lực còn; Trần Bi-a còn; danh sách dạng câu sai đã vào lịch ôn; nút "Về Sảnh", "Đấu lại".

### 3.10 Chế độ chơi (tối đa 4 người — G10)
| Chế độ | Người | Câu | Tính trần Bi-a | Điểm bàn |
|---|---|---|---|---|
| Đấu đơn với bạn (mời hoặc mã bàn) | 2 (1–1) | Có | Có | Có |
| Đánh đôi với bạn | 4 (2–2); ghế trống chủ bàn thêm A.I | Có | Có | Có khi cả 4 ghế là người; có A.I thì không |
| Tự chơi với A.I · đấu đơn | em + 1 A.I | Có | Có | Không |
| Tự chơi với A.I · đánh đôi | em + 1 A.I đồng đội + 2 A.I đối thủ | Có | Có | Không |
| Bàn giao hữu | 1–4 người, ghế trống A.I | Không (mọi bi là bi trống) | Không | Không |

- Thứ tự đánh: đấu đơn luân phiên; đánh đôi **ghế 1 (Kim loại) → ghế 2 (Phi kim) → ghế 3 (Kim loại) → ghế 4 (Phi kim)** rồi quay lại. "Hết lượt" là sang ghế kế tiếp; "đánh tiếp" là cùng ghế.
- Phạm luật: ghế kế tiếp được đặt bi cái.
- Bi của A.I không mang câu thật; A.I trả lời theo G5.

### 3.11 Nhãn chỉ bi (thầy yêu cầu Q7)
- Rê chuột lên bi (máy tính) hoặc chạm vào bi (điện thoại) ⇒ nhãn nổi trên bi: **kí hiệu, tên nguyên tố, Z**; dòng quan hệ có màu: **"Bi của em"** (xanh lá), **"Bi của đồng đội <tên>"** (xanh dương), **"Bi của đối thủ"** (đỏ; đánh đôi thêm tên), **"Bi chốt"** (vàng); một dòng phụ:
  - bi của em: dạng · mức độ · điểm (không lộ nội dung câu), thêm "bi vàng" nếu đã giải trước đúng;
  - bi đồng đội: "Cùng phe · vào lỗ thì đồng đội trả lời";
  - bi đối thủ: "Chạm bi này trước là phạm luật" (cú phá bàn: "Phá bàn: chạm bi nào trước cũng được");
  - Bi chốt: "Phe em ăn đủ 7 bi mới được đánh" hoặc "Phe em đánh Bi chốt được rồi".
- Vòng sáng quanh bi cùng màu quan hệ. Nhãn đảo xuống dưới bi khi sát mép trên, không tràn ra ngoài bàn; đúng vị trí cả khi bàn nằm ngang.
- Thời gian hiện: rê chuột là hiện liên tục; chạm là 1,8 giây; khi em đang nhắm (kéo trên bàn, nút ‹ ›, phím ← →) nhãn tự hiện cho bi đang nhắm tới 1,2 giây.
- Ẩn khi đang mở tấm câu hoặc Xem lại câu sai. Nhãn bi của người khác không bao giờ có dạng câu.
- Dòng "Đang nhắm" dưới bàn (màn dọc) dùng cùng quan hệ: "Na · Khái niệm ester · Nhận biết · 10 điểm — bi của em".

## 4. Nguồn câu, trần câu, chấm và ghi dữ liệu

### 4.1 Luồng
Thầy giao **Chiến dịch luyện** (`GiaoChienDich.tsx` → `/gv/chien-dich` → bảng `chien_dich`) → máy chủ chốt **kế hoạch ngày** của từng em lúc mở app lần đầu trong ngày (`layKeHoachHomNay`, `server/src/srs2-d1.ts:248-292`, bảng `srs2_ke_hoach`: `dao_json`, `doan_json`, `tong`) → Đoàn lấy phần `doan` (câu ôn Phần I/III), Đảo lấy phần `dao` (câu mới + câu ôn Phần II), **Bi-a lấy tối đa 40% mỗi phần**.
"Đã làm hôm nay" do `docDemHomNay` (`srs2-d1.ts:220-228`) đếm từ `su_kien_hoc` (`nguon='game'`, theo `ngay_vn`, mỗi khoá kế hoạch có thể mang hậu tố `#n`, bỏ bằng `qidGoc`). Câu Bi-a đi qua lệnh `answer` chung nên **tự** được đếm: Thể lực giảm, luật "câu thứ 41 trở đi 0 EXP" tự áp, Đảo/Đoàn tự không phát lại câu đó.

### 4.2 Xếp câu cho một ván (`bia-xep-ban`, gọi riêng cho từng em có mặt trong bàn)
1. Đọc `kh` hôm nay. Không có chiến dịch hoặc `kh.tong = 0` ⇒ trả lý do "chưa có chiến dịch", không xếp.
2. Tính trần còn (mục 4.3) cho phần `doan` và phần `dao`.
3. Loại khỏi ứng viên: câu đã làm hôm nay; câu đang nằm trong phiên Đảo/Đoàn còn mở (< 2 giờ, như `dangPhat` của `startDoan2`); câu đang bảo vệ cho ca kiểm tra (`protectedQuestions`); câu tự luận (`laCauTuLuan`); câu vượt khối của em (`khoi-cau`).
4. Chọn **Câu chốt** trước (giả định G1): câu Vận dụng trong phần được phép, ưu tiên câu ôn đang sai (cc = 0 trong hồ sơ `hs`); không có thì câu có `mucDo` cao nhất.
5. Chọn tối đa `soBi` câu cho các bi em giữ (đấu đơn 7; đánh đôi 4 cho người 1 của phe, 3 cho người 2 — G11): phần `doan` trước (tới hết trần phần `doan`), rồi phần `dao`. Trong mỗi phần giữ đúng thứ tự kế hoạch. Nạp bằng `napCau` (hiện là hàm nội bộ của `srs2-game.ts` — xuất ra để dùng chung).
6. Thiếu câu (trần còn < `soBi` + 1) ⇒ số bi còn lại là **bi trống**; Câu chốt luôn được giữ trước nếu trần còn ≥ 1. Trần còn 0 ⇒ không xếp ván, trả `{ lyDo: 'het_tran', conDoan, conDao }`.
7. Tạo phiên `game_v2_session` với json `{ mode: 'bia', hoa2: 1, bia: 1, van: <id ván>, created, questions: RefPhien[] }`; ref của Câu chốt có `role: 'trum'`, câu mới `'moi'`, câu ôn `'on_lai'`; `goiY` từ `goiYCho(q, t, sbd|qid|ngay)` như Đảo/Đoàn.
8. Trả về: `{ ok, van, session, bi: CauCongKhai[], trong, chot: CauCongKhai | null, tran: { con, tong }, theLuc, conDoan, conDao }`. *(Đã làm, 28/09 — khác bản đầu)*: `bi` là danh sách câu theo thứ tự, máy khách gán lần lượt cho các bi em giữ; `trong` = số bi em giữ không có câu. Máy chủ không cần biết kí hiệu bi. **Không** có `correct`, `solution`, `answer` (test quét sâu). Hợp đồng đầy đủ: `docs/hop-dong-bi-a.md`.

### 4.3 Trần Bi-a 40% (thầy chốt)
- `tranDoan = floor(0,4 × số khoá phần doan của kế hoạch đã chốt hôm nay)`, `tranDao = floor(0,4 × số khoá phần dao)`. Trần Bi-a = `tranDoan + tranDao`.
- `daDungDoan` / `daDungDao` = số khoá của từng phần đã được **trả lời trong phiên Bi-a** hôm nay (đếm từ `game_v2_attempt` nối `game_v2_session` có `$.bia = 1`, tạo hôm nay) + số câu đang **giữ** trong ván Bi-a đang mở mà chưa trả lời.
- `conDoan_Bia = min(tranDoan − daDungDoan, số câu doan còn chưa làm)`, tương tự phần dao.
- Ví dụ (đúng số trong bản vẽ): kế hoạch 14 doan + 26 dao ⇒ trần 5 + 10 = 15. Chơi Bi-a trước tới hết trần ⇒ Đoàn còn 9, Đảo còn 16.
- Đoàn, Đảo **không** đổi luật: làm được toàn bộ phần còn lại, nên mỗi phần luôn còn ≥ 60% cho game của nó (vì floor).
- Huyết Chiến (tổng 80): công thức giữ nguyên, trần ≈ 32.
- Kế hoạch bị dựng lại giữa ngày (đổi chiến dịch, `onSaiLuat`): trần tính lại theo kế hoạch mới; câu đã làm vẫn đã làm.

### 4.4 Đổi câu khi sai (`bia-doi-cau`)
- Gọi sau mỗi câu sai của bi thường, và sau mỗi Câu chốt sai (câu thay là câu Vận dụng kế tiếp). Gọi ngay lúc chấm, không chờ em bấm "Đã đọc". *(Đã làm, 28/09)*: vào `{ session, qidCu, chot }` — mã câu vừa sai + cờ câu chốt; máy chủ từ chối nếu câu cũ chưa có lượt trả lời.
- Câu thay: câu cùng `dang` trong phần được phép và còn trần; không có thì câu kế tiếp trong phần được phép; trần hết ⇒ bi thành **bi trống** (`{ trong: true }`).
- Câu thay được thêm vào `questions` của phiên (để `answer` nhận), trả `publicQuestion`.
- Câu sai đã ghi `su_kien_hoc` nên thuật toán tự xếp lịch ôn; không cần làm gì thêm.

### 4.5 Câu chưa đụng tới
Ván kết thúc (thắng, bỏ, quá 2 giờ) ⇒ câu trong phiên chưa có `game_v2_attempt` không bị tính, tự về lại kế hoạch (vì "đã làm" chỉ đếm `su_kien_hoc`). `bia-ket-van` đánh dấu phiên đã đóng (`$.dong = 1`) để thôi giữ câu.

### 4.6 Chấm và ghi dữ liệu — dùng lại, không viết mới
- Mỗi câu: `POST /game-v2` action `answer` `{ token, session, qid, answer }` (`server/src/game-v2.ts:413-467`). Đã đọc mã: `answer` **không** bắt trả lời theo thứ tự trong phiên (`currentQuestion` chỉ nạp bản mới nhất của câu), nên em chọn bi nào giải trước cũng được; mỗi câu chỉ trả lời một lần mỗi phiên. Định dạng: Phần I `^[ABCD]$`, Phần II `^[DS]{4}$` (đúng cả 4 ý mới đúng), Phần III ≤ 40 kí tự (`soKhopSo`).
- `answer` đã làm sẵn: kiểm câu thuộc phiên, phiên < 2 giờ, câu bảo vệ, chống gửi lại (`replayed`), ghi `game_v2_attempt`, `game_v2_reward`, hồ sơ, `su_kien_hoc` (`nguon:'game'`, `ma_nguon` = mã phiên), thưởng bậc thành thạo qua `nhanExpGame` (trần 120 EXP/ngày), EXP câu trùm (`ghiKhoanExpGame`, `expMotCau(phan, sao)`) khi `role = 'trum'`, đúng, không trợ giúp, chưa quá câu 40.
- `assisted` = có `goiY` ⇒ câu có Bùa Trợ giảng không nhận EXP câu trùm (đúng luật hiện hành).
- Phản hồi dùng thẳng: `correct`, `answer`, `solution`, `solutionImages`, `reward`, `expThuThach`, `profile` ⇒ màn hiện EXP nhận được, không tự tính ở máy.
- "Câu đã làm", Bảng chiến dịch của thầy, hồ sơ nắm kiến thức tự có câu Bi-a vì cùng đọc `su_kien_hoc`.

### 4.7 Ba chỗ phải chặn để Bi-a không lẫn vào Đảo (phát hiện khi tra mã)
| Chỗ | Vấn đề | Sửa |
|---|---|---|
| `resume` (`game-v2.ts:403`) | Lấy mọi phiên có `$.doan IS NULL` ⇒ sẽ lấy nhầm phiên Bi-a | Thêm điều kiện `COALESCE(json_extract(json,'$.bia'),0)=0` |
| `startDao2` tìm chuyến đang dở (`srs2-game.ts:83`) | Lấy phiên `hoa2=1` và `doan` = 0 ⇒ có thể lấy phiên Bi-a | Thêm cùng điều kiện |
| `dieuKienLoaiPhien` (`game-v2-luot.ts:26`) | Phiên không có `$.doan=1` bị tính là Đảo | Loại `$.bia=1` khỏi loại `'dao'` (chế độ 2.0 hiện không áp trần này, sửa để đếm đúng) |
Ngược lại, `startDao2` và `startDoan2` thêm câu đang giữ trong ván Bi-a mở vào tập `chan` (không phát câu Bi-a đang giữ).
Các hàm `luot.ts` (`demLuotHomNay`, `moPhienLuotMoi`, `docLuotDangCho`, `docDauVaoLuot`) chỉ nhận `mode = 'adventure'` nên phiên `mode = 'bia'` tự đứng ngoài — có test chứng minh.

### 4.8 EXP tóm tắt
| Nguồn | EXP |
|---|---|
| Câu thường đúng (bi của em, giải trước hoặc sau khi rơi; ai đánh vào cũng vậy) | Thưởng bậc thành thạo như câu Đảo/Đoàn, qua `nhanExpGame`, chung trần 120/ngày |
| Câu chốt đúng, không Bùa | Thêm EXP câu trùm `expMotCau(phan, sao)` |
| Câu thứ 41 trở đi trong ngày | 0 (luật hiện hành) |
| Thắng ván, bi trống, Bàn giao hữu, Điểm bàn | 0 |

### 4.9 Chống gian lận
- Đáp án, lời giải chỉ có trong phản hồi `answer` sau khi chốt.
- Máy người khác (đối thủ **và đồng đội**) không bao giờ nhận nội dung câu, chỉ `{ ki, trangThai: 'dang_giai'|'vang'|'da_an'|'doi_cau'|'trong', mucDo }`.
- Online: phòng đấu không tin máy khách tự báo đúng/sai; khi nhận "bi 3 đúng" phòng đọc `game_v2_attempt` (phiên, qid) để xác nhận (1 lần đọc D1 mỗi câu, không hỏi vòng).
- Thắng ván không cho EXP nên không có động cơ gian lận kết quả ván; Điểm bàn do phòng đấu tính từ trạng thái nó giữ.

## 5. Bàn giao hữu

- **Mở khi**: kế hoạch ngày của em đã xong (Thể lực còn 0 và tổng > 0) và em không có ca kiểm tra mở.
- **Giới hạn**: tối đa 2 ván/ngày/em, đếm lúc **bắt đầu** ván (vào ván là tính, bỏ giữa chừng vẫn tính).
- **Người chơi**: đấu đơn hoặc đánh đôi; ghế trống là A.I Đỗ Đại Học; bạn mời vào phải cũng đã xong kế hoạch ngày và còn lượt giao hữu. Lời mời tới bạn chưa xong kế hoạch thì không gửi được: "Minh Châu chưa xong kế hoạch hôm nay".
- **Luật**: như mục 3 nhưng mọi bi là bi trống (vào lỗ là ăn, 5 điểm), không Mắt thần (đường ngắm cơ bản), không Câu chốt (hạ Bi chốt hợp lệ là thắng).
- **Thưởng**: không EXP, không Vàng, không Điểm bàn, không trừ Thể lực.
- **Sảnh**: màn "Hôm nay em xong rồi" của Sảnh Bát Linh thêm thẻ "Bàn giao hữu · còn 2/2 ván hôm nay".

## 6. Chơi với nhau

### 6.1 Tự chơi với A.I Đỗ Đại Học (GĐ1)
- **Đấu đơn**: em (Phe Kim loại) + 1 A.I (Phe Phi kim). **Đánh đôi**: em + A.I 2 (đồng đội, giữ 3 bi của phe em) + A.I 1 và A.I 3 (Phe Phi kim). Chọn ở Sảnh Bi-a: "Tự chơi với A.I" → "Đấu đơn" / "Đánh đôi".
- Chạy hoàn toàn trên máy em. A.I dùng chính lõi vật lý: thử tối đa 60 cú ứng viên (bóng bi ma theo từng bi của phe A.I × 6 lỗ × 3 lực, cộng 5 cú nhắm thẳng), chấm điểm từng cú (ăn bi của phe +110, bi vàng +200, bi phe đối thủ rơi −90, phạm luật −250 đến −300, Bi chốt hợp lệ +1500), nhiễu góc ±0,7°. Đặt bi cái: thử 2 khoảng cách sau bóng bi ma của từng bi × lỗ.
- Bi của A.I không mang câu thật; A.I "trả lời" và "giải trước" theo tỉ lệ ở giả định G5. A.I giải trước mỗi 12 giây một bi, chọn ngẫu nhiên một ghế A.I không đang đánh.
- Em đánh bi của A.I đồng đội vào lỗ ⇒ A.I đồng đội trả lời (băng "A.I 2 đang giải câu bi Mg"); A.I đồng đội đánh bi của em vào lỗ ⇒ tấm câu mở cho em (3.5).
- Kết thúc ván gọi `bia-ket-van` để ghi `bi_a_van` + `bi_a_ghe` (ghế A.I có `sbd` NULL).

### 6.2 Đấu với bạn (GĐ2)
- **Mời**: Sảnh Bi-a liệt kê bạn cùng lớp (`hoc_sinh.ten_lop`) **đang ở Sảnh Bi-a** (thấy trong 20 giây gần nhất), còn trần Bi-a, không đang đấu. Bảng `app_presence` hiện có không lưu số báo danh nên không dùng được; thay vào đó lệnh hỏi lời mời `bia-loi-moi` (mỗi 6 giây, **chỉ khi đang ở Sảnh Bi-a**, giống Võ đài) ghi luôn `bi_a_co_mat.last_seen`. "Mời" ⇒ `bia-moi`; lời mời hết hạn sau 60 giây.
- **Mã bàn**: `bia-tao-ban {cheDo:'don'|'doi'}` trả mã 4 chữ số (duy nhất trong các bàn đang mở), bạn ngồi cạnh nhập mã ⇒ `bia-vao-ban {ma}`.
- **Phòng chờ** (đánh đôi): 4 ghế chia 2 phe; mỗi ghế trống có "Mời bạn" / "Thêm A.I"; chủ bàn đổi chỗ được trước khi bắt đầu; nút "Bắt đầu" sáng khi đủ 4 ghế (người hoặc A.I). Thứ tự đánh hiện ngay trong phòng chờ. Đấu đơn không có phòng chờ: bạn nhận lời là vào ván.
- **A.I ở ghế trống (online)**: chạy trên máy **chủ bàn**, gửi gói `cu` như một ghế; phòng vẫn mô phỏng lại mọi cú. Chủ bàn rớt mạng ⇒ người có ghế nhỏ nhất còn lại nhận chạy A.I. Bàn có A.I không tính Điểm bàn nên không có lợi gì khi làm A.I yếu đi.
- **Phòng đấu**: mỗi bàn là 1 Durable Object `BanBiA` (lớp SQLite, WebSocket Hibernation), khoá theo mã ván. Kết nối `GET /bi-a/phong/<van>` nâng cấp WebSocket; gói đầu tiên `{loai:'vao', token}` (không để token trên đường dẫn).
- **Gói tin** (JSON, có `seq` tăng dần):
  - Máy → phòng: `cu {seq, ghe, dx, dy, v, sx, sy, datBi?:{x,y}}` (v là tốc độ đã tính, xem 7.1), `cau_xong {ghe, ki, qid, attempt}`, `giai_truoc {ghe, ki, trangThai:'dang_giai'|'dong'}`, `nhan {id: 1..6}`, `bo_van {}`.
  - Phòng → máy: `trang_thai {seq, bam, bi[], ghe[], luot (số ghế), diem[2], matThan, datBi, dongHo}` (đầy đủ, gửi khi vào/vào lại), `cu {seq, ghe, ...}` của ghế khác, `ket_qua_cu {seq, bam, suKien, luotMoi}`, `cau_ban {ghe, ki, trangThai, mucDo}`, `nhan {tu, id}`, `ket_thuc {doiThang, lyDo}`, `loi {ma, chu}`.
  - Câu sai: phòng đổi lượt **ngay khi nhận `cau_xong` sai** (không chờ máy em đóng tấm lời giải).
- **Quyền quyết**: phòng mô phỏng lại mọi cú bằng `vat-ly.ts` và áp `luat.ts`; hai máy mô phỏng để chiếu ngay; băm lệch thì lấy `trang_thai` của phòng.
- **Câu trong trận**: máy em gọi `answer` qua HTTP như thường, rồi gửi `cau_xong {ghe, ki, qid, attempt}`; phòng đọc `game_v2_attempt` (id = attempt) để biết đúng/sai thật rồi mới đổi trạng thái bi. Đang chờ câu sau khi bi rơi: phòng giữ lượt tối đa bằng thời gian câu + 10 giây.
- **6 câu nhắn soạn sẵn**, không chat tự do: "Cú đẹp!", "Suýt nữa!", "Tới lượt tớ nhé", "Hay đấy", "Chờ tớ giải câu", "Đấu lại không?".
- **Rớt mạng**: tự nối lại trong 60 giây, nhận `trang_thai` đầy đủ; quá 60 giây: đấu đơn thì thua, đánh đôi thì ghế chuyển cho A.I (G14). Đồng hồ cú đánh của người rớt vẫn chạy.
- **Số kết nối**: mỗi phòng tối đa 4 WebSocket (1 mỗi ghế người); gói thứ 5 bị từ chối `loi {ma:'day_ban'}`.
- **D1 trong trận**: 0 lần đọc theo nhịp; chỉ 1 lần đọc xác nhận mỗi câu và 1 lần ghi kết thúc ván (`bi_a_van`, `bi_a_diem_ban`) trong 1 batch.
- **Dự phòng** (gói Cloudflare không có Durable Object): bảng `bi_a_ban (id, revision, json)` + hỏi vòng 1,5 giây như Đoàn Hộ Tống, giữ nguyên nội dung gói tin.

### 6.3 Bàn giao hữu với bạn (GĐ2)
Như 6.2 (đấu đơn hoặc đánh đôi), `loai = 'giao_huu'`, mọi em trong bàn phải đã xong kế hoạch và còn lượt giao hữu; không gọi `answer`, không có `cau_xong`.

## 7. Vật lý

### 7.1 Mô hình (chép nguyên từ bản vẽ, đã đo)
- Trục: x sang phải, y xuống, z đâm vào mặt bàn. 1 đơn vị ≈ 2,54 mm ⇒ g = 3862 đv/s². Bước cố định HS = 1/240 giây.
- Trạng thái mỗi bi: (x, y, vx, vy, wx, wy, wz, on). Vận tốc trượt ở điểm chạm nỉ: u = (vx + R·wy, vy − R·wx).
- **Trượt** (|u| > 1): gia tốc −μt·g·û với μt = 0,2; dω = (5μt·g / 2R)·(ûy, −ûx)·HS. Nếu |u| ≤ 3,5·μt·g·HS thì chuyển thẳng sang lăn: v ← (5v + 2R·(−wy, wx)) / 7 (bảo toàn mô men quanh điểm chạm).
- **Lăn**: tốc độ giảm μl·g·HS mỗi bước, μl = 0,02; giữ ràng buộc wx = vy/R, wy = −vx/R. Tốc độ ≤ 2 thì dừng.
- **Xoáy đứng** wz giảm 24 rad/s².
- **Cú đánh**: v = VMAX·(0,05 + 0,95·p^1,2), VMAX = 2600; k = 1,25·v/R; wx = k·sy·dy, wy = −k·sy·dx, wz = −k·sx (điểm chạm lệch tâm 0,5R·(sx, sy)).
- **Bi–bi**: xung pháp tuyến hồi phục 0,95; ma sát bề mặt μb = 0,06 trên độ trượt gt = (vB − vA)·t − R(wzA + wzB), xung tiếp tuyến jt = clamp(−gt/7, ±μb·jn); wz mỗi bi −= 2,5·jt/R.
- **Băng**: hồi phục e = 0,86 − 0,1·min(1, |vn|/2500); mũi băng ăn 60% xoáy lăn vào băng (thành phần ω theo trục song song băng); ma sát băng μc = 0,2 với độ trượt s = v·T − R·wz, jt = clamp(−s/3,5, ±μc(1+e)|vn|), wz −= 2,5·jt/R.
- **Lỗ và hàm lỗ**: 4 lỗ góc tâm lệch (−4; −4) bán kính bắt 36; 2 lỗ giữa tâm (−14; 450) bán kính bắt 30; miệng góc 50, miệng giữa 37; 12 điểm hàm bán kính 5 xử lý như băng điểm. Bi ra ngoài mặt nỉ bị hút về lỗ gần nhất 1800 đv/s².
- **Tất định**: trong vòng mô phỏng chỉ dùng + − × ÷ và `Math.sqrt`; `Math.pow` chỉ dùng lúc tính v của cú đánh (một lần, trước mô phỏng) — khi đánh online, máy người đánh gửi **v đã tính** (số thực) thay cho p để máy khác không phải gọi `pow`. Không `Math.random`, `Date`, `sin/cos` trong vòng mô phỏng.
- Hướng quay để vẽ (quaternion) cập nhật từ (wx, wy, wz) mỗi bước, **không** ảnh hưởng vật lý và không nằm trong băm trạng thái.

### 7.2 Số đo phải giữ (đã đo trên bản vẽ, là nghiệm thu mục 12)
| Phép đo | Kết quả bản vẽ | Ngưỡng nghiệm thu |
|---|---|---|
| Đánh giữa tâm, tỉ lệ tốc độ lúc bắt đầu lăn | 0,714 | 0,707–0,721 |
| Va thẳng bi cách 150, lực 45%, 0,6 giây sau va: xoáy trên | đi theo 137 | > 100 |
| … đánh giữa | đi theo 46 | < 60 |
| … xoáy dưới | lùi 88 | > 60 |
| Xoáy phải/trái 0,8 đập băng thẳng, lực 50%, qua y = 300 | x = 372,9 / 127,1 | lệch phải > 100, lệch trái > 100, chênh ≤ 2 |
| Phá bàn lực 100% | dừng sau 4,1–4,4 giây | 3–7 giây |
| Cùng một cú chạy 2 lần | trùng khít | trùng 1.000/1.000 |

### 7.3 Vẽ bi nguyên tố
- Bi 3D vẽ theo từng điểm ảnh: pháp tuyến mặt cầu × ma trận quay (từ quaternion). Đèn cố định theo **màn hình** (góc trên trái), kể cả khi bàn nằm ngang.
- **Kim loại**: màu Jmol + **ánh kim** — phản chiếu môi trường cố định theo màn (nửa trên sáng như đèn trần, một vạch chân trời tối, nửa dưới tối như nỉ), điểm loá hẹp nhuốm màu kim loại, viền sáng Fresnel; ô nhãn không ánh kim.
- **Phi kim**: nền trắng, dải sọc màu Jmol ở |lz| < 0,5. **Bi chốt C**: đen.
- **Hai ô nhãn** đối nhau ở ±x cục bộ: |lx| > 0,874 nền trắng, 0,86–0,874 là viền tối; trong ô: Z (chữ nhỏ, trên) và kí hiệu (chữ lớn, dưới), lấy mẫu từ ảnh chữ 64 × 64; ô nhãn lăn theo bi.
- Bi cái trắng có 6 chấm đỏ ở ±x, ±y, ±z cục bộ để thấy xoáy.
- Bàn nằm ngang: trước khi nhân ma trận quay, pháp tuyến màn quay (nx, ny) → (ny, −nx) để bi lăn đúng chiều trên màn; bóng bi, bi, chữ nổi vẽ theo toạ độ màn để đèn không xoay theo bàn.
- Ảnh mỗi bi lưu đệm; chỉ vẽ lại khi hướng quay đổi; độ phân giải tối đa gấp 2 lần điểm ảnh CSS.
- Màu trong `src/` viết `rgb()` (không hex, để `check:mau` đạt):

| Bi | rgb | Bi | rgb |
|---|---|---|---|
| Na | 171, 92, 242 | N | 48, 80, 248 |
| Mg | 138, 255, 0 | O | 255, 13, 13 |
| Al | 191, 166, 166 | F | 144, 224, 80 |
| Fe | 224, 102, 51 | P | 255, 128, 0 |
| Cu | 200, 128, 51 | S | 255, 255, 48 |
| Ag | 192, 192, 192 | Cl | 31, 240, 31 |
| Au | 255, 209, 35 | I | 148, 0, 148 |
| C (Bi chốt) | 28, 28, 30 | | |

## 8. Giao diện

### 8.1 Cửa vào trên Sảnh Bát Linh
- Cửa thứ ba "Bi-a Phản Ứng" cạnh Đoàn Hộ Tống và Bát Linh Đảo, cả bản dọc và bản ngang (cột 7/5).
- Trên cửa: "Trần Bi-a hôm nay: còn 15/15 câu". Hết trần: cửa mờ, dòng "Hết câu Bi-a hôm nay · Đoàn còn 9 câu · Đảo còn 16 câu". Xong kế hoạch: cửa đổi thành "Bàn giao hữu · còn 2/2 ván". Có ca kiểm tra mở: cửa mờ, "Đang có ca kiểm tra".
- Đầu Sảnh vẫn một dòng Thể lực như hiện nay; thêm dòng nhỏ "Đoàn còn a · Đảo còn b · Bi-a còn c".

### 8.2 Sảnh Bi-a
- Thẻ chiến dịch (tên, số câu, hạn nộp), Thể lực, Trần Bi-a, số câu Đoàn/Đảo còn.
- Nút chính vàng "Đấu đơn với bạn"; nút phụ "Đánh đôi 2 đấu 2", "Nhập mã bàn", "Tự chơi với A.I Đỗ Đại Học" (hỏi tiếp: đấu đơn / đánh đôi).
- Danh sách bạn cùng lớp đang ở Sảnh Bi-a (tên, "Trần Bi-a còn n câu" hoặc "Đang đấu"), nút "Mời" / "Xem" (xem là GĐ3).
- Lời mời đến: tấm dưới "Minh Châu mời em đấu Bi-a · Nhận / Từ chối" (tự đóng sau 60 giây).

### 8.3 Màn chơi — ba bố cục
Chọn theo **kích thước thật của khung** (ResizeObserver), không theo loại máy. Bàn tự nằm ngang khi khung rộng hơn cao (chọn chiều cho bàn to nhất); vật lý luôn tính trên bàn dọc 500 × 900, chỉ đổi phép vẽ (màn = (H − y, x) — phép quay, không lật, nên xoáy trái/phải đúng chiều) và phép đổi toạ độ chạm. Bản vẽ đã đo sai lệch toạ độ chạm 0,000 đơn vị ở cả màn ngang và máy tính.

| Bố cục | Khi nào | Sắp xếp |
|---|---|---|
| **Điện thoại dọc** | cao ≥ rộng | Từ trên xuống: đầu trang (Sảnh · tên game · Toàn màn hình · Âm thanh) → hai thẻ phe + điểm ván giữa (đấu đơn: ảnh + tên + tên phe; đánh đôi: tên phe + 2 ghế) → hàng "Bi của em" dạng **ô nguyên tố** (Z góc trên, kí hiệu lớn; thường / vàng / đã ăn / trống) + chip Mắt thần → bàn dọc → dòng "Đang nhắm" → hàng điều khiển (xoáy · ‹ · thanh lực ngang · ›) |
| **Điện thoại xoay ngang** | rộng > cao và cao < 500 px | 3 cột: trái 172 px (nút biểu tượng Sảnh/Toàn màn hình/Âm thanh, 2 thẻ phe xếp dọc, ô Bi của em 4 cột) · giữa bàn nằm ngang · phải 110 px (nút xoáy, **thanh lực dựng đứng kéo xuống**, ‹ ›). Chừa tai thỏ bằng `env(safe-area-inset-*)`. Tấm câu giữa màn, rộng tối đa 620 px, cuộn được |
| **Máy tính** | rộng ≥ 1024 px và cao ≥ 600 px | Thanh trên (Sảnh, tên, Toàn màn hình, Âm thanh) · cột trái 110 px (xoáy, lực dựng đứng, ‹ ›) · giữa: 2 thẻ phe + bàn ngang lớn · cột phải 292 px (ô Bi của em 4 cột, **Diễn biến ván**, **Phím tắt**). Chuột: rê để xem nhãn bi, bấm-kéo để nhắm. Phím: ← → (Shift: tinh), giữ Space lấy lực, F toàn màn hình, M âm thanh, Esc thoát/đóng. Tấm câu giữa màn, rộng tối đa 640 px |

Diễn biến ván (máy tính): mỗi thông báo trên bàn thành một dòng có giờ "0:42", viền xanh khi tốt, đỏ khi phạm luật; tối đa 40 dòng.
Ảnh đại diện là thần thú của em (dùng lại Spirit2D), không dùng chữ viết tắt như bản vẽ.
Gắn vào app theo đúng mẫu màn "Câu đã làm": thêm `'bia'` vào `TabType` (`StudentPortalScreen.tsx:190`), `const BiA = lazy(() => import('../game/bi-a/BiaGame'))` cạnh dòng 79-81, khối toàn màn như dòng 1421-1427 với `Suspense fallback={<ChoNapGame/>}`, loại `'bia'` khỏi điều kiện tấm chung (dòng 1429), khỏi `vaoM3` (1297) và đầu trang (1449); `useToanManHinhGame` (249) nhận thêm `tab==='bia'`. Đóng Bi-a thì `useLamMoiKhiDong` tự tải lại `hoa2-sanh`.
Cửa trên Sảnh: thêm prop `onChoiBia` vào `SanhBanDoProps` (`SanhBanDo.tsx:33-57`), vẽ cửa trong `NutViec` (450-481, dùng chung dọc và ngang); dòng số câu trong `TheTheLucNgang`/HUD (96-102, 533-557). Kiểu `SanhHoa2` và bộ đọc `docSanh` (`src/components/hoa2/api.ts:22-30, 135-167`) thêm trường `bia`.

### 8.4 Tấm câu hỏi
- Khi trả lời: bọc `TheCau` chế độ `'thi'` (`src/components/TheCau.tsx`) theo đúng cách `TheCauAi` của Đảo 2.0 (`src/game/than-thu-v2/dao2/TrongAi.tsx:104-119`): Phần I `choices/selected/onSelect`, Phần II `ideas/selected[4]/onSelect(i,'D'|'S')`, Phần III ô `ONhapDapSo` (có sẵn phím "−" và ","). Gạch phương án của Bùa dùng lại `useGachPhuongAn` (`TrongAi.tsx:95-103`), dải Bùa và `cotLoi` như dòng 115-116; `docGoiY` ở `dao2-core.ts:27-33`.
- Sau khi chốt: lời giải bằng `loiGiaiChoTheCau(solution, phan, dapAn)` + `TheCau` chế độ `'xem_lai'` + ảnh `HinhTaiViTri` vị trí `'sau_loi_giai'` (mẫu `doan2/XemLaiChuan.tsx`). Công thức qua `ChemText`. Không vẽ bộ lời giải thứ hai; bản vẽ HTML chỉ minh hoạ bố cục.
- Nhãn: "BI Na · CÂU ÔN" / "BI Na · CÂU MỚI" / "BI CHỐT · CÂU CHỐT"; dạng · mức độ · kiểu câu; đồng hồ "Còn 1:24". Dòng trên tấm: "Bi Na vào lỗ · trả lời đúng để ăn bi" / "Đồng đội … đánh bi Na của em vào lỗ · em trả lời" / "Lượt của … · em giải trước".
- Phần I: 4 nút phương án, chọn rồi "Chốt đáp án". Phần II: 4 hàng, mỗi hàng nút "Đúng"/"Sai". Phần III: ô số + bàn phím 0–9, ",", "−", ⌫ (dùng lại bàn phím ô đáp số đang có).
- Bùa Trợ giảng (goiY) hiện như Đoàn: gạch phương án hoặc kiến thức cốt lõi.
- Sau khi chốt: băng kết quả trên thẻ ("Đúng · ăn bi Na · +10 điểm" / "Chưa đúng · bi Na quay lại bàn · Đã sang lượt <tên>"), đồng hồ câu ẩn. Sai: nút xanh **"Đã đọc lời giải"** — lượt đã sang người khác từ lúc chấm, bấm chỉ đóng tấm. Đúng: nút vàng "Đánh tiếp" / "Về bàn".
- Tấm cuộn được khi dài; phần đầu không bao giờ bị cắt (đã sửa trong bản vẽ).

### 8.5 Sáng, tối, màu, chữ, âm thanh
- Nền game theo cặp của Đảo 2.0: mặc định sáng (hoàng hôn), tối (biển đêm) khi `prefers-color-scheme: dark` hoặc `:root[data-giao-dien='toi']`, giống `dao2.css:369-398`. Token riêng tiền tố `--bia-*` trong `src/game/bi-a/bi-a.css`, khai báo trên lớp gốc `.bia`.
- Màu trong `src/game/bi-a/` viết `rgb()` hoặc mảng số, không hex (để `npm run check:mau` đạt, không phải thêm tệp vào danh sách ngoại lệ).
- Chữ: Baloo 2 cho tiêu đề và số lớn, Be Vietnam Pro cho chữ; chữ câu hỏi ≥ 15 px.
- Âm thanh: mục 8.7.
- Tự soát B1–B10 của bảng chuẩn; vùng chạm ≥ 44 px; `touch-action: none` trên bàn và thanh lực; tôn trọng giảm chuyển động (bớt hạt hiệu ứng).

### 8.6 Toàn màn hình (thầy yêu cầu Q9)
- Nút ⛶ ở đầu màn chơi (cả 3 bố cục) và phím F. Dùng Fullscreen API trên khối màn chơi (`requestFullscreen({ navigationUI: 'hide' })`). Trình duyệt không cho (iPhone Safari với phần tử không phải video, khung nhúng) ⇒ phủ `position: fixed; inset: 0` lên cả cửa sổ và khoá cuộn trang — cùng giao diện.
- Chỉ còn: **bàn bi-a** to nhất có thể (tự ngang khi màn ngang, dọc khi màn dọc), điều khiển nổi mờ (màn ngang: cột trái — xoáy, lực dựng đứng, ‹ ›; màn dọc: hàng đáy), một chip nhỏ trên cùng "Lượt em · 24 giây · Kim loại 20 : 10 Phi kim · Mắt thần 1", nút "Bi của em" (mở bảng ô để giải trước) và nút "Thoát". Tấm câu, lời giải, Xem lại câu sai, Kết thúc ván vẫn hiện trên toàn màn hình.
- Thoát: nút Thoát, Esc, cử chỉ hệ thống ⇒ về đúng bố cục cũ. Trong app, khung app đã ẩn sẵn nhờ `useToanManHinhGame`; nút này là lớp thêm để ẩn cả thanh trình duyệt.

### 8.7 Âm thanh mô phỏng (thầy yêu cầu Q10)
- Tổng hợp bằng Web Audio trong `src/game/bi-a/am-thanh.ts`, **không tệp âm thanh**. Chuỗi: từng tiếng → lệch trái/phải (StereoPanner, theo vị trí bi **trên màn**) → tổng → nén (DynamicsCompressor) → loa; nhánh vang phòng (Convolver, xung tổng hợp 0,9 giây, 16%).
- Độ to theo **vận tốc va chạm thật** từ lõi vật lý (móc `hook('bi'|'bang'|'lo')` ở `step`), không phát trong mô phỏng của A.I hay Mắt thần. Va chạm trong một khung hình được gom: phát tối đa 5 tiếng bi + 3 tiếng băng to nhất, lệch nhau vài mili giây (phá bàn không vỡ tiếng).

| Tiếng | Cách tạo | Khi nào |
|---|---|---|
| Gậy chạm bi | nhiễu dải 1,7 kHz 14 ms + tiếng "tốc" 820→600 Hz + thân trầm 190 Hz; to theo lực | mỗi cú |
| Bi chạm bi | 3 dao động không hoà âm (≈2,7–3,6 kHz × 1; 1,53; 2,31) tắt trong 12–28 ms + nhiễu cao 3,5 kHz — tiếng "cạch" nhựa phenolic | mỗi va chạm |
| Dội băng | nhiễu trầm 320 Hz 60 ms + 120→70 Hz — cao su | mỗi lần chạm băng, hàm lỗ |
| Rơi lỗ | chạm túi (nhiễu 420 Hz + 150→60 Hz) rồi 6 tiếng lọc cọc thưa dần trong máng + tiếng ầm 0,7 giây | bi rơi |
| Đặt bi cái, xoa phấn | tiếng chạm nỉ; 5 tiếng sột soạt | thả bi cái; mở chọn xoáy |
| Trả lời đúng / sai | chuông 4 nốt đi lên / 2 nốt đi xuống nhẹ | chấm câu |
| Bi hoá vàng, ăn bi | chuỗi nốt cao lấp lánh; tiếng "ting" | giải trước đúng; ăn bi |
| Phạm luật, đổi lượt | 2 nốt trầm; tiếng "pốp" | cuối cú; sang ghế |
| Sắp hết giờ | tiếng tích | 5 giây cuối cú đánh, 10 giây cuối câu |
| Mở tấm câu | tiếng lật giấy | mở câu, mở Xem lại câu sai |
| Thắng ván | kèn 4 nốt + hợp âm + tiếng vỗ tay | hạ Bi chốt đúng |

- **KHÔNG có tiếng lăn trên nỉ** (thầy bỏ hẳn 28/09): bi đang lăn thì im; chỉ có tiếng va chạm, rơi lỗ và các tín hiệu trong bảng trên.
- Mở khoá âm thanh ở thao tác chạm/phím đầu tiên (luật trình duyệt). Tắt/bật: nút loa và phím M, dùng chung khoá `localStorage 'game-battle-muted'` qua `battleMuted()`/`setBattleMuted()` của `battle-audio.ts`. Tôn trọng máy đang tắt tiếng.
- Bản vẽ có thẻ "Nghe thử từng tiếng" (16 nút) để thầy duyệt.

### 8.8 Xem lại câu sai (thầy yêu cầu Q11)
- Nút đỏ nổi ở đáy bàn **"Xem lại câu sai · n"** (toàn màn hình: dưới chip trên cùng), hiện khi: em có ≥ 1 câu sai trong ván **và** không phải lượt em đánh (lượt đối thủ, đồng đội, lúc chuyển lượt) **và** không có tấm câu đang mở.
- Bấm ⇒ tấm "Xem lại câu sai · Câu k/n" với ‹ › lật câu, dòng "Đang lượt <tên> · tới lượt em thì tấm này tự đóng". Mỗi câu hiện **đúng mẫu "Câu đã làm" của app**: `TheCau` chế độ `'xem_lai'` + `loiGiaiChoTheCau(solution, phan, dapAn)` + ảnh `HinhTaiViTri` vị trí `'sau_loi_giai'` (mẫu `doan2/XemLaiChuan.tsx`): nhãn bi, dạng · mức độ · kiểu câu, câu hỏi, "Em chọn" + ✗, đáp án ✓, lời giải. Dữ liệu lấy từ phản hồi `answer` đã nhận trong ván (không gọi máy chủ thêm); câu hết giờ ghi "Hết giờ trả lời nên tính là sai".
- Không chặn ván: người khác vẫn đánh. **Tới lượt em thì tấm tự đóng**, băng "Tới lượt em". Đang xem thì không giải trước (một tấm một lúc).
- Màn Kết thúc ván có nút "Xem lại câu sai (n)".

## 9. Máy chủ và dữ liệu

### 9.1 Lệnh mới (họ `bia-*`, qua `/game-v2`, cạnh `doan-`/`LENH_HOA2` ở `game-v2.ts:254-259`, cần token)
| Lệnh | Vào | Ra | GĐ |
|---|---|---|---|
| `bia-sanh` | — | `{ bat, lyDoKhoa?, chienDich, theLuc, conDoan, conDao, tran:{con,tong}, giaoHuu:{mo, con}, diemBan?, vanDangMo? }` | 1 |
| `bia-xep-ban` | `{ loai, cheDo, soBi, van? }` — `loai` là `ai`, `ban` hoặc `giao_huu`; `cheDo` là `don` hoặc `doi`; `soBi` 7, 4 hoặc 3 | mục 4.2 (giao hữu: mọi bi `trong:true`) | 1 |
| `bia-doi-cau` | `{ session, qidCu, chot }` *(đã làm)* | `{ trong, cau? }` | 1 |
| `bia-ket-van` | `{ van, ghe:[{ghe, doi, ai, dung, sai, an, vang}], ketQua:{doiThang, diem:[2], lyDo}, soCu }` *(đã làm)* | `{ ok, van, dung, sai, theLuc }` (gọi lại ⇒ `{ daGhiTruoc:true }`) | 1 |
| `bia-moi` / `bia-loi-moi` / `bia-tra-loi-moi` | `{sbd, van, ghe}` / — / `{id, nhan}` | lời mời | 2 |
| `bia-tao-ban` / `bia-vao-ban` / `bia-ghe` | `{cheDo}` / `{ma}` / `{van, ghe, lam:'them_ai'|'bo_ai'|'doi_cho'}` | `{ma, van, ghe[]}` | 2 |
`hoa2-sanh` (`sanh2`, `srs2-d1.ts:297-316`) trả thêm `bia: { bat, con, tong, giaoHuu:{mo,con}, lyDoKhoa? }` để Sảnh vẽ cửa.
Mọi lệnh `bia-*` trả `{ lyDoKhoa: 'dang_co_ca' }` khi em có ca kiểm tra mở (dùng cùng nguồn với `hsCaDangMo`, `index.ts:3275`) và `{ lyDoKhoa: 'chua_bat' }` khi cờ tắt. *(Đã làm, 28/09)*: `coCaDangMo` dùng `quyetDinhVaoThi` trên ca `mo` của lớp em nhưng KHÔNG xét phạm vi khối/danh sách chọn — chặt hơn một chút (ca của lớp đang mở là đóng Bi-a). Hợp đồng đầy đủ: `docs/hop-dong-bi-a.md`.

### 9.2 Cờ bật Bi-a
- Khoá riêng `cau_hinh.khoa = 'bi_a'`, giá trị `{ bat, lop[], sbd[] }`, đọc bằng `biaMoCho(env, sbd, lop)` theo mẫu `doanMoCho` (`game-v2-doan.ts:55-62`). Không nhét vào khoá `game_hoa_2` vì `coLuu` (`srs2-gv.ts:42-47`) chỉ giữ `{bat, lop, sbd}` và ghi đè mỗi lần lưu.
- Mặc định tắt. Thầy bật trong app giáo viên: công tắc "Bi-a Phản Ứng" cạnh công tắc Game Hoá 2.0 (`src/components/chien-dich/CongTacHoa2.tsx`), gọi 2 lệnh mới `bia-co-doc` / `bia-co-luu` trong bộ định tuyến `/gv/chien-dich` (`srs2-gv.ts:17-35`). Làn giáo viên ⇒ Boss soát commit.

### 9.3 Bảng mới (migration CHỈ-THÊM `server/migration-<DDMM>-bi-a.sql`)
```sql
CREATE TABLE IF NOT EXISTS bi_a_van (
  id TEXT PRIMARY KEY,            -- mã ván
  loai TEXT NOT NULL,             -- 'ai' | 'ban' | 'giao_huu'
  che_do TEXT NOT NULL,           -- 'don' (2 ghế) | 'doi' (4 ghế)
  ngay TEXT NOT NULL,             -- ngày VN
  chu_ban TEXT NOT NULL,          -- sbd người tạo ván
  trang_thai TEXT NOT NULL,       -- 'mo' | 'xong' | 'bo' | 'het_gio'
  doi_thang INTEGER,              -- 0 Kim loại | 1 Phi kim | NULL
  diem_0 INTEGER, diem_1 INTEGER, -- điểm ván 2 phe
  json TEXT,                      -- tóm tắt: lý do kết thúc, số cú, ghế đổi sang A.I
  tao_luc TEXT NOT NULL, xong_luc TEXT
);
CREATE INDEX IF NOT EXISTS bi_a_van_chu_ngay ON bi_a_van(chu_ban, ngay);
CREATE TABLE IF NOT EXISTS bi_a_ghe (
  van TEXT NOT NULL, ghe INTEGER NOT NULL,  -- ghế 1..4, thứ tự đánh
  doi INTEGER NOT NULL,                     -- 0 Kim loại | 1 Phi kim
  sbd TEXT,                                 -- NULL = A.I Đỗ Đại Học
  session TEXT,                             -- phiên game_v2_session của em (NULL ở A.I, giao hữu)
  dung INTEGER NOT NULL DEFAULT 0, sai INTEGER NOT NULL DEFAULT 0, an INTEGER NOT NULL DEFAULT 0, vang INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (van, ghe)
);
CREATE INDEX IF NOT EXISTS bi_a_ghe_sbd ON bi_a_ghe(sbd);
CREATE TABLE IF NOT EXISTS bi_a_diem_ban (sbd TEXT PRIMARY KEY, diem INTEGER NOT NULL DEFAULT 1000, so_van INTEGER NOT NULL DEFAULT 0, cap_nhat TEXT);  -- GĐ2
CREATE TABLE IF NOT EXISTS bi_a_moi (id TEXT PRIMARY KEY, tu_sbd TEXT NOT NULL, den_sbd TEXT NOT NULL, loai TEXT NOT NULL, van TEXT, ghe INTEGER, trang_thai TEXT NOT NULL, tao_luc TEXT NOT NULL); -- GĐ2
CREATE INDEX IF NOT EXISTS bi_a_moi_den ON bi_a_moi(den_sbd, trang_thai);
CREATE TABLE IF NOT EXISTS bi_a_co_mat (sbd TEXT PRIMARY KEY, ten_lop TEXT, last_seen TEXT NOT NULL); -- GĐ2: ai đang ở Sảnh Bi-a
CREATE INDEX IF NOT EXISTS bi_a_co_mat_lop ON bi_a_co_mat(ten_lop, last_seen);
```
Số ván giao hữu hôm nay của em = số dòng `bi_a_ghe` có `sbd` = em, nối `bi_a_van` loại `'giao_huu'` trong ngày (tính cả `bo`). Điểm bàn chỉ cập nhật khi mọi ghế có `sbd` (không có A.I). Đánh đôi: Elo của phe = trung bình 2 người, cộng/trừ như nhau cho 2 người.

### 9.4 Durable Object (GĐ2)
- `server/wrangler.toml`: `[[durable_objects.bindings]] name = "BAN_BIA"`, `class_name = "BanBiA"`; `[[migrations]] tag = "bia-v1"`, `new_sqlite_classes = ["BanBiA"]`. `Env` (`server/src/kieu.ts:39-46`) thêm `BAN_BIA?: DurableObjectNamespace` (có dấu ? để Worker cũ vẫn chạy khi chưa gắn).
- `server/src/index.ts` xuất thêm `export { BanBiA } from './bi-a-phong'` và định tuyến `/bi-a/phong/*`.
- Code 3 kiểm gói Cloudflare có Durable Object lớp SQLite trước GĐ2; không có thì làm dự phòng 6.2.

## 10. Tệp và làn (theo DIEU-PHOI.md)

| Tệp | Việc | Chủ làn / người soát |
|---|---|---|
| `src/game/bi-a/**` (mới): `nguyen-to.ts` (bảng bi, màu rgb), `vat-ly.ts`, `luat.ts` (đơn/đôi, ghế, phe), `ai.ts`, `du-doan.ts`, `ve-bi.ts`, `ve-ban.ts` (xoay bàn), `bo-cuc.ts` (chọn dọc/ngang/máy tính), `am-thanh.ts`, `mang.ts` (GĐ2), `BiaGame.tsx`, `BiaSanh.tsx`, `PhongCho.tsx` (GĐ2), `BanChoi.tsx`, `NhanBi.tsx`, `HangBiCuaEm.tsx`, `TamCauBia.tsx`, `XemLaiCauSai.tsx`, `ToanManHinh.tsx`, `DienBienVan.tsx`, `KetThucVan.tsx`, `bi-a.css` | Game | Phiên build Bi-a (làn mới) |
| `server/src/bi-a.ts`, `server/src/bi-a-tran.ts`, `server/src/bi-a-phong.ts` (GĐ2), `server/migration-<DDMM>-bi-a.sql` | Máy chủ | Viết ở phiên build Bi-a, **Code 3 soát và đẩy Worker, chạy migration** |
| `server/src/game-v2.ts` (định tuyến `bia-`, điều kiện `resume`), `server/src/srs2-game.ts` (xuất `napCau`, `RefPhien`; chặn phiên Bi-a ở `startDao2`; `chan` câu Bi-a đang giữ ở `startDao2`/`startDoan2`), `server/src/game-v2-luot.ts` (`dieuKienLoaiPhien`), `server/src/srs2-d1.ts` (`sanh2` thêm `bia`), `server/src/srs2-gv.ts` (`bia-co-*`), `server/src/kieu.ts`, `server/src/index.ts`, `server/wrangler.toml` | Sửa nhỏ tệp có sẵn | Nhắn Code 3 trước khi sửa; commit riêng từng tệp |
| `src/screens/StudentPortalScreen.tsx` | Tab `'bia'` | Code 2 (người đẩy Pages) |
| `src/components/hoa2/SanhBanDo.tsx`, `src/components/hoa2/api.ts`, `sanh-ban-do.css` | Cửa thứ ba, số câu | Chủ làn Game Hoá 2.0 (Boss chỉ định) |
| `src/components/chien-dich/CongTacHoa2.tsx` | Công tắc Bi-a | Làn giáo viên, Boss soát |
| `docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md` | Thêm từ mục 2 | Boss |
| `prompt-game-hoa-2-0.md` | Sửa dòng "không thêm màn nào… ngoài Sảnh, 2 game" thành 3 game | Boss |
| `tests/bi-a-*.test.ts(x)`, `scripts/chup-bi-a.mjs` | Test, chụp ảnh | Phiên build Bi-a |

Luật chung giữ nguyên: commit theo đường dẫn, không `git add -A`, không stash; đẩy Worker/Pages từ worktree sạch; phiên cloud không có khoá Cloudflare nên nhờ Code 3 (Worker) và Code 2 (Pages) phát hành; không phát hành khi đang có ca thi mở.

## 11. Lộ trình build

| GĐ | Làm | Không làm | Phát hành |
|---|---|---|---|
| **GĐ1** | Lõi vật lý + luật (đơn, đôi) + A.I + bi nguyên tố 3D + nhãn chỉ bi + Mắt thần; 3 bố cục + toàn màn hình; âm thanh mô phỏng; màn chơi, hàng Bi của em, tấm câu (TheCau), sai là sang lượt ngay, Xem lại câu sai, Diễn biến ván, Kết thúc ván; Sảnh Bi-a (chỉ "Tự chơi với A.I" — đấu đơn và đánh đôi — hoạt động, nút online ghi "Sắp mở"); cửa trên Sảnh + số câu 3 game; lệnh `bia-sanh`, `bia-xep-ban`, `bia-doi-cau`, `bia-ket-van`; trần 40%; 3 chỗ chặn lẫn Đảo; bảng `bi_a_van`, `bi_a_ghe`; cờ + công tắc; Bàn giao hữu với A.I | Online, Điểm bàn | Worker (Code 3) rồi Pages (Code 2), cờ bật cho 1 lớp thử trước |
| **GĐ2** | Durable Object, đấu đơn và đánh đôi online (tối đa 4 người), phòng chờ 4 ghế, thêm A.I vào ghế trống, mời bạn, mã bàn, nối lại, ghế rớt mạng chuyển A.I, 6 câu nhắn, Bàn giao hữu với bạn, Điểm bàn (Elo) | Xem đấu, cửa hàng | Như GĐ1 |
| **GĐ3** | Bảng tuần của lớp (top 3, không lộ số báo danh), xem bạn đấu, gậy và mặt bàn đổi Vàng ở Cửa hàng, 3 mức A.I | — | Như GĐ1 |

## 12. Định nghĩa hoàn thành GĐ1 (mỗi dòng là một dòng sổ việc, phải có bằng chứng là lệnh đã chạy)

| # | Tiêu chí | Cách đo |
|---|---|---|
| 1 | Vật lý đạt các số đo mục 7.2 | `npx vitest run tests/bi-a-vat-ly.test.ts` |
| 2 | Tất định: 1.000 cú ngẫu nhiên seed cố định, chạy 2 lần trên Node cho cùng băm; cùng 50 cú chạy trong Chromium (Playwright) cho cùng băm với Node | `npx vitest run tests/bi-a-vat-ly.test.ts` + `node scripts/bi-a-tat-dinh.mjs` |
| 3 | Luật: ≥ 18 ca có tên — bi vàng rơi; bi thường rơi đúng; rơi sai; rơi 2 bi câu đầu sai (bi sau về bàn không mở câu, lượt sang ngay); bi trống rơi; bi đối thủ rơi; P1–P5; phá bàn chạm bi đối thủ không phạm luật; Câu chốt đúng; Câu chốt sai; giải trước đúng; giải trước sai; hết giờ cú; hết giờ câu; Mắt thần không vượt 3; tấm câu của em không chặn cú đánh của A.I | `npx vitest run tests/bi-a-luat.test.ts` |
| 4 | Trần 40%: 14+26 → 5+10; 1+1 → 0+0; 80 câu Huyết Chiến; kế hoạch dựng lại giữa ngày; câu đang giữ tính vào trần; hết trần → `het_tran` kèm số câu Đoàn/Đảo | `npx vitest run tests/bi-a-tran-cau.test.ts` |
| 5 | Máy chủ (D1 thật `tests/_d1-that.ts`, `goiWorker`): 8 câu đều thuộc kế hoạch hôm nay, câu ôn doan trước; loại câu đã làm, câu trong phiên Đảo/Đoàn mở, câu bảo vệ ca thi, câu tự luận; quét sâu phản hồi `bia-xep-ban` và `bia-doi-cau` không có khoá `correct`/`solution`/`answer` | `npx vitest run tests/bi-a-may-chu.test.ts` |
| 6 | Dữ liệu: trả lời qua `answer` ghi 1 dòng `su_kien_hoc` `nguon='game'`, Thể lực giảm 1, Câu chốt vai `trum` đúng không Bùa có `expThuThach`, câu 41 trở đi `khongThuong`; ván dừng giữa chừng không trừ câu chưa trả lời | `npx vitest run tests/bi-a-may-chu.test.ts` |
| 7 | Không lẫn Đảo: `resume` bỏ qua phiên Bi-a; `startDao2` không nhận phiên Bi-a làm chuyến dở; `startDao2`/`startDoan2` không phát câu Bi-a đang giữ; `dieuKienLoaiPhien('dao')` loại phiên Bi-a; 4 hàm `luot.ts` bỏ qua `mode='bia'` | `npx vitest run tests/bi-a-khong-lan-dao.test.ts` |
| 8 | Bàn giao hữu: chỉ mở khi xong kế hoạch; tối đa 2 ván/ngày (tính cả ván bỏ); không câu; 0 dòng EXP, 0 dòng `su_kien_hoc` | `npx vitest run tests/bi-a-giao-huu.test.ts` |
| 9 | Khoá: cờ tắt ⇒ không có cửa; ca kiểm tra mở ⇒ cửa mờ và mọi `bia-*` trả `dang_co_ca` | `npx vitest run tests/bi-a-may-chu.test.ts tests/hoa2-sanh-bia.test.tsx` |
| 10 | Giao diện (jsdom, giả lập canvas trong tệp): cửa thứ ba và dòng số câu trên Sảnh (dọc và ngang); hàng Bi của em 4 trạng thái; tấm câu dùng `TheCau` cho cả 3 phần; lời giải mở sẵn khi sai, gập khi đúng; giải trước chỉ mở ngoài lượt đánh của em | `npx vitest run tests/hoa2-sanh-bia.test.tsx tests/bi-a-man-choi.test.tsx` |
| 11 | `npm run check:mau` đạt; `npx tsc --noEmit` sạch (cả `server/`); `npm run build` đạt | 3 lệnh |
| 12 | Ảnh 390 px và 1440 px, sáng và tối: Sảnh, màn chơi, tấm câu (sai, có lời giải), Kết thúc ván, Bàn giao hữu; JPG ≤ 150 KB ở `docs/anh-bi-a-<DDMM>/` | `node scripts/chup-bi-a.mjs` |
| 13 | Hiệu năng: phá bàn ở màn 390 px, Chromium hạ CPU 4 lần, khung hình p95 ≤ 16,7 ms (đo bằng `requestAnimationFrame` trong trang) | `node scripts/chup-bi-a.mjs --do-khung` |
| 14 | Toàn bộ vitest: không có test đỏ mới so với nền (so tên với `docs/nen-vitest-do-1909.txt`) | `npx vitest run` (báo trước ở Nhật ký) |
| 15 | Chạy thật trên bản sống sau phát hành: 1 em thử (cờ bật cho 1 sbd) chơi hết 1 ván A.I đấu đơn và 1 ván đánh đôi; Bảng chiến dịch của thầy có câu của ván; Thể lực và trần Bi-a đúng số | Ảnh chụp + truy vấn `su_kien_hoc` đọc-chỉ |
| 16 | Đánh đôi: thứ tự 4 ghế; chia bi 4/3 đúng G11; đồng đội đánh bi của em ⇒ em trả lời; em đánh bi đồng đội ⇒ đồng đội trả lời; chạm trước bi đồng đội không phạm luật; Câu chốt do người hạ trả lời; phe thắng; ghế rớt mạng chuyển A.I | `npx vitest run tests/bi-a-luat.test.ts` |
| 17 | Sai là sang lượt ngay: sau khi chấm sai ≤ 0,5 giây lượt đã sang ghế kế tiếp trong khi tấm lời giải vẫn mở; "Đã đọc lời giải" chỉ đóng tấm (không gọi luật lần nữa); tới lượt em khi tấm còn mở thì đồng hồ cú đánh chưa chạy | `npx vitest run tests/bi-a-luat.test.ts tests/bi-a-man-choi.test.tsx` |
| 18 | Xem lại câu sai: nút chỉ hiện khi chờ lượt và có câu sai; nội dung dùng `TheCau` `'xem_lai'` + `loiGiaiChoTheCau`; tới lượt em tự đóng; màn Kết thúc có nút | `npx vitest run tests/bi-a-man-choi.test.tsx` |
| 19 | Nhãn chỉ bi: 4 quan hệ đúng chữ và màu, đúng vị trí khi bàn dọc và ngang; bi người khác không có dạng câu | `npx vitest run tests/bi-a-man-choi.test.tsx` |
| 20 | Bố cục: 360×780, 390×844, 844×390, 1280×800, 1440×900 — không tràn ngang; bàn tự ngang/dọc đúng; sai lệch toạ độ chạm ≤ 0,01 đơn vị; toàn màn hình chỉ còn bàn + điều khiển nổi, Esc/Thoát về đúng bố cục | `node scripts/chup-bi-a.mjs --bo-cuc` |
| 21 | Âm thanh: 16 tiếng chạy không lỗi (giả lập AudioContext trong test, Chromium thật trong script chụp); phá bàn phát ≤ 8 tiếng mỗi khung; tắt âm ⇒ tổng = 0 và ghi khoá dùng chung | `npx vitest run tests/bi-a-am-thanh.test.ts` + `node scripts/chup-bi-a.mjs` |

GĐ2 thêm: phòng đấu chạy cục bộ (workerd, mẫu `vitest.config.d1.ts`) — 2 máy đánh hết 1 ván, băm trùng sau mỗi cú; nối lại sau 10 giây; gói "cau_xong" giả (attempt không có hoặc sai) bị từ chối; số lần đọc D1 mỗi ván ≤ số câu đã trả lời + 2; Điểm bàn đổi đúng Elo K = 24.

## 13. Rủi ro và cách chặn

| Rủi ro | Chặn |
|---|---|
| Phiên Bi-a bị Đảo lấy nhầm (`resume`, chuyến dở) | Mục 4.7 + nghiệm thu 7 |
| Bi-a làm Đảo/Đoàn hết câu | Trần 40% theo phần + nghiệm thu 4 |
| Lộ đáp án qua phiên | Chỉ `publicQuestion`, quét sâu phản hồi (nghiệm thu 5) |
| Máy yếu giật khi vẽ bi 3D | Đệm ảnh mỗi bi, độ phân giải tối đa 2×; trung bình khung > 20 ms trong 2 giây thì tự chuyển bi phẳng (không xoay số) |
| Hai máy lệch kết quả vật lý | Chỉ + − × ÷ √ trong vòng mô phỏng, gửi v thay p, băm mỗi cú, phòng đấu là quyền quyết |
| D1 nghẽn giờ cao điểm | Không hỏi vòng trong trận; lời mời hỏi 6 giây chỉ ở Sảnh Bi-a |
| Học sinh cố tình sai để đổi câu dễ | Câu thay cùng dạng, vẫn tốn trần và Thể lực, không được gì |
| Tấm câu chặn cú đánh của đối thủ (lỗi đã gặp ở bản vẽ) | Nghiệm thu 3, ca cuối; nghiệm thu 17 |
| Trình duyệt chặn toàn màn hình (iPhone, khung nhúng) | Phủ `position: fixed` cùng giao diện (8.6) |
| Tiếng va chạm dồn khi phá bàn gây rè, nặng máy | Gom theo khung, tối đa 8 tiếng mỗi khung, qua bộ nén (8.7) |
| Nhiều người một bàn làm lộ câu | Máy người khác (kể cả đồng đội) chỉ nhận trạng thái bi (4.9) |
| Bàn ngang lớn ở máy tính làm nặng vẽ bi | Độ phân giải tối đa 2×, đệm ảnh từng bi (7.3) |
| Gói Cloudflare không có Durable Object | Dự phòng hỏi vòng 1,5 giây (6.2) |
| Phiên cloud không đẩy được Worker/Pages | Code 3 đẩy Worker, Code 2 đẩy Pages từ worktree sạch |

## 14. Không làm

- Không viết bộ chấm, bộ EXP, bộ lời giải, thuật toán kế hoạch thứ hai; không đổi `grade()`, `lapKeHoachNgay`, `nhanExpGame`.
- Không cộng EXP khi thắng ván, ở bi trống, ở Bàn giao hữu.
- Không cho đổi đáp án sau khi chốt; không rút câu tự luận; không gửi nội dung câu của em sang máy đối thủ.
- Không chat tự do; không chế độ "hai người một máy"; không quá 4 người một bàn, không 3 phe.
- Không sửa đồ hoạ, hoạt ảnh của Bát Linh Đảo và Đoàn Hộ Tống.
- Không thêm thư viện vật lý hay đồ hoạ; gói JS của game ≤ 60 KB sau gzip.
- Không đổi schema có sẵn; không xoá, ghi đè dữ liệu thật; không phát hành khi đang có ca thi mở.

## 15. Phụ lục — bảng quyết định cuối cú đánh (dùng cho `luat.ts` và phòng đấu)

```
vao: su_kien {firstHit, potted[], cuePotted}, ghe (người đánh), doi = doi(ghe),
     conTruoc (số bi chưa ăn của phe doi), laPhaBan
1  loi = P1 nếu cuePotted
       | P2 nếu firstHit rỗng
       | (không phá bàn) P4 nếu firstHit = C và conTruoc > 0
       | (không phá bàn) P3 nếu firstHit là bi của phe khác doi   (bi đồng đội không tính)
       | P5 nếu C ∈ potted và conTruoc > 0
2  nếu loi: đặt lại mọi bi trong potted (kể cả C), bi cái → đầu bàn nếu rơi;
            ghế kế tiếp đặt bi cái; HẾT LƯỢT
3  biBan = potted ∩ bi phe khác → đặt lại chân bàn
   biAn  = potted ∩ (bi vàng ∪ bi trống của phe doi) → ăn ngay (tính cho người giữ bi)
   nếu C ∈ potted và Bi chốt là bi trống ⇒ phe doi THẮNG (dừng)
   hang  = potted ∩ bi thường của phe doi (theo thứ tự rơi) + [Câu chốt nếu C ∈ potted]
4  với từng mục trong hang:
     người trả lời = người giữ bi (Câu chốt: ghe)
     đúng: ăn, người trả lời +Mắt thần; Câu chốt đúng ⇒ phe doi THẮNG (dừng)
     sai:  đặt lại, đổi câu; các mục còn lại trong hang → đặt lại, không mở câu;
           HẾT LƯỢT NGAY (không chờ đóng tấm lời giải)
5  ĐÁNH TIẾP (cùng ghe) ⇔ không sai câu nào ∧ biBan rỗng ∧ (biAn ∪ bi ăn ở bước 4) khác rỗng
   ngược lại HẾT LƯỢT: ghế kế tiếp = (ghe mod số ghế) + 1, không đặt bi cái
```
