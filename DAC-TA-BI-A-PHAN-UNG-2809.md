# ĐẶC TẢ — BI-A PHẢN ỨNG (game thứ ba trên Sảnh Bát Linh, app học sinh)

Bản chốt để build. Soạn 28/09/2026. Trạng thái: **CHƯA BUILD — chờ thầy ra lệnh.**
Bản vẽ chơi được (phiên bản 3): `docs/ban-ve-bi-a-2809/bi-a-phan-ung.html` — artifact https://claude.ai/artifact/7FjPu2CSL4QtnigCD4gdQg.
Đề bài build ngắn: `prompt-bi-a-phan-ung.md` (trỏ về tệp này; khi hai tệp khác nhau, **tệp này thắng**).

---

## 0. Tóm tắt một trang

- **Là gì**: game bi-a 1–1 trên điện thoại. Mỗi viên bi của em là **một câu trong kế hoạch hôm nay của chính em**, lấy từ Chiến dịch luyện thầy giao, giống Bát Linh Đảo và Đoàn Hộ Tống.
- **Học ở đâu**: bi rơi lỗ thì trả lời câu của bi đó, đúng mới ăn. Lúc đối thủ đánh, em **giải trước** câu của bi mình; đúng thì bi hoá vàng (vào lỗ là ăn ngay). Mỗi câu đúng cho 1 **Mắt thần** (thấy trước đường đi thật của bi).
- **Không phá kinh tế đang có**: dùng chung kế hoạch ngày, chung lệnh chấm, chung EXP (trần 120/ngày), chung Thể lực. Bi-a chỉ được lấy **tối đa 40% phần của Đoàn và 40% phần của Đảo** mỗi ngày.
- **Sau khi xong kế hoạch ngày**: mở **Bàn giao hữu** (không câu, không EXP, tối đa 2 ván/ngày).
- **Vật lý thật**: trượt rồi lăn, xoáy trên/dưới/ngang, ma sát băng và bi–bi, bi 3D xoay; tất định để đấu online chỉ gửi 1 gói tin mỗi cú.
- **Chơi với nhau**: mỗi em một máy (mời bạn cùng lớp hoặc mã bàn 4 số), hoặc đấu với A.I Đỗ Đại Học. Không có "hai người một máy".

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

## 2. Từ ngữ (thêm vào `docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md`, mục A2)

| Từ chuẩn | Nghĩa | Không dùng |
|---|---|---|
| Bi-a Phản Ứng | Tên game | "game bi-a", "billiard" |
| Bi của em / Bi của bạn | 7 bi trơn số 1–7 (người mời) / 7 bi sọc số 9–15 | "bi solid/stripe" |
| Bi vàng | Bi đã giải trước đúng, vào lỗ là ăn | "bi đã mở khoá" |
| Bi trống | Bi không có câu (khi hết trần hoặc ở Bàn giao hữu) | "bi rỗng" |
| Bi chốt / Câu chốt | Bi số 8 / câu phải trả lời khi hạ bi số 8 | "bi 8 đen", "câu cuối" |
| Giải trước | Giải câu của bi mình trong lượt đối thủ | "làm trước" |
| Mắt thần | Lượt thấy trước đường đi thật của bi | "gợi ý ngắm" |
| Phạm luật | Lỗi trong cú đánh | "foul", "lỗi" (dễ lẫn với "lỗ") |
| Đặt bi cái | Được đặt bi cái chỗ tuỳ ý sau khi đối thủ phạm luật | "ball in hand" |
| Điểm ván / Điểm bàn | Điểm trong một ván / điểm xếp hạng lâu dài | "rank", "elo" |
| Trần Bi-a | Số câu tối đa Bi-a được lấy trong ngày | "quota" |
| Bàn giao hữu | Ván không câu sau khi xong kế hoạch ngày | "chơi tự do" |
| Mã bàn | 4 chữ số để vào cùng bàn | "room code" |

Con số nào trên màn cũng có nhãn: "Trần Bi-a hôm nay: còn 11/15 câu", "Mắt thần: 2", "Điểm ván 120".

## 3. Luật chơi đầy đủ

### 3.1 Bàn và bi
- Bàn 500 × 900 đơn vị (dọc màn điện thoại), 6 lỗ (4 góc, 2 giữa cạnh dài). Bi bán kính R = 21.
- 15 bi xếp tam giác 5 hàng, đỉnh ở chấm chân bàn (250; 270), thứ tự từ đỉnh: `[1] [10,2] [3,8,11] [12,4,13,5] [6,14,7,15,9]`. Bi chốt số 8 ở giữa hàng 3; hai góc sau một trơn một sọc.
- Bi cái ở chấm đầu bàn (250; 720).
- Người mời (hoặc em, khi đấu A.I) có 7 bi trơn 1–7 và phá bàn. Người được mời có 7 bi sọc 9–15.
- Mỗi bi thường mang 1 câu của chủ bi, trừ khi là bi trống. Bi chốt mang Câu chốt riêng của từng em (xếp sẵn lúc vào ván).

### 3.2 Một lượt đánh
- Đồng hồ cú đánh: 30 giây, chỉ chạy khi tấm câu hỏi đang đóng. Hết giờ: mất lượt, không tính phạm luật.
- Nhắm: chạm/kéo trên bàn; nút ‹ › xoay 0,3°; phím ← → (Shift: 0,1°).
- Lực: kéo thanh lực sang phải (hoặc giữ phím cách), thả là đánh. Lực < 2% thì huỷ cú.
- Xoáy: chọn điểm chạm trên mặt bi cái, bán kính tối đa 0,8 (xoáy ngang sx, xoáy dọc sy).
- Phá bàn (cú đầu ván): chạm bi nào trước cũng được; vẫn tính phạm luật nếu bi cái rơi lỗ hoặc không chạm bi nào.

### 3.3 Xử lý cuối cú đánh (thứ tự bắt buộc)
1. Xác định **phạm luật** (mục 3.4). Có phạm luật ⇒ mọi bi rơi trong cú (kể cả Bi chốt) đặt lại chân bàn; bi cái rơi thì đặt ở đầu bàn; đối thủ được **đặt bi cái**; hết lượt. Không mở câu nào.
2. Không phạm luật:
   - Bi của **đối thủ** rơi ⇒ đặt lại chân bàn; lượt sẽ kết thúc sau bước 3.
   - Bi **vàng** của em rơi ⇒ ăn ngay, cộng điểm ván.
   - Bi **trống** của em rơi ⇒ ăn ngay, +5 điểm ván.
   - Bi **thường** của em rơi ⇒ xếp vào hàng đợi câu (theo thứ tự rơi).
   - **Bi chốt** rơi ⇒ xếp Câu chốt cuối hàng đợi (chỉ xảy ra khi em đã ăn đủ 7 bi trước cú này, vì nếu không đã là phạm luật). Bi chốt đang là bi trống (hết trần, hoặc Bàn giao hữu) ⇒ thắng ngay, không cần câu.
3. Trả lời lần lượt từng câu trong hàng đợi (mục 3.5). Câu chốt đúng ⇒ **thắng ván**, dừng xử lý.
4. Được **đánh tiếp** khi và chỉ khi: không phạm luật, không câu nào sai, không bi đối thủ nào rơi, và có ít nhất 1 bi được ăn trong cú. Ngược lại hết lượt (không đặt bi cái).

### 3.4 Phạm luật
| Mã | Điều kiện |
|---|---|
| P1 | Bi cái rơi lỗ |
| P2 | Bi cái không chạm bi nào |
| P3 | Bi đầu tiên bi cái chạm là bi của đối thủ (không áp dụng ở cú phá bàn) |
| P4 | Bi đầu tiên bi cái chạm là Bi chốt khi em còn bi chưa ăn (không áp dụng ở cú phá bàn) |
| P5 | Bi chốt rơi khi em còn bi chưa ăn (kể cả ở cú phá bàn) |

Chạm băng sau va không bắt buộc (luật đơn giản cho học sinh).

### 3.5 Trả lời câu sau khi bi rơi
- Tấm câu hỏi mở ngay, che bàn, đối thủ thấy "đang giải bi 4 · Thông hiểu" và đồng hồ câu.
- Thời gian: Phần I 90 giây, Phần II 180 giây, Phần III 180 giây. Hết giờ = sai.
- **Đúng** (Phần II: đúng cả 4 ý): ăn bi, cộng điểm ván, +1 Mắt thần (tối đa 3). Lời giải gập, bấm "Xem lời giải" mới mở.
- **Sai**: bi đặt lại chân bàn và **đổi câu** (mục 4.4); lời giải mở sẵn theo mẫu chuẩn; nút "Đã đọc lời giải · sang lượt <tên>"; lượt kết thúc sau khi xử lý hết hàng đợi.
- Rơi 2 bi thường: trả lời lần lượt; câu đầu sai vẫn trả lời câu sau (bi sau vẫn có cơ hội ăn), nhưng lượt kết thúc.

### 3.6 Giải trước
- Mở được khi **không phải lúc em đang nhắm/đánh**: trong lượt đối thủ, khi bi đang lăn ở lượt đối thủ, khi đối thủ đang trả lời câu.
- Chạm một bi ở hàng "Bi của em" (chưa ăn, chưa vàng, không phải bi trống) ⇒ tấm câu hỏi của bi đó.
- **Đúng**: bi hoá vàng, +1 Mắt thần. **Sai**: lời giải mở sẵn, bi đổi câu (mục 4.4), không mất gì khác.
- Tới lượt em mà đang giải dở: giải xong mới đánh; đồng hồ cú đánh chỉ chạy khi đóng tấm câu. Tấm câu của em **không bao giờ** chặn cú đánh của đối thủ hay A.I.
- Không giải trước được Câu chốt.

### 3.7 Mắt thần
- Nguồn: mỗi câu đúng (sau khi bi rơi hoặc giải trước) +1, tối đa 3. Không có nguồn nào khác.
- Dùng: mỗi cú đánh của em trừ 1 nếu đang có.
- Có Mắt thần: đường đi thật của bi cái (chấm trắng, tới lần va thứ 2 hoặc 1,1 giây sau va đầu) và bi mục tiêu (vàng, 0,9 giây) tính bằng chính lõi vật lý với lực và xoáy đang chọn; cập nhật tối đa 16 lần/giây khi kéo lực. Chưa kéo lực thì mô phỏng ở lực 50%.
- Không có: chỉ đường thẳng tới điểm va, bóng bi ma, vòng tròn bi mục tiêu (đỏ + dấu × nếu chạm trước là phạm luật).

### 3.8 Bi chốt và Câu chốt
- Ăn đủ 7 bi thì mới được nhắm Bi chốt.
- Bi chốt rơi hợp lệ ⇒ Câu chốt. Đúng: +50 điểm ván, thắng. Sai: Bi chốt đặt lại chân bàn, lời giải, hết lượt; lần sau dùng **Câu chốt khác** (câu Vận dụng kế tiếp trong trần còn, gọi `bia-doi-cau` với `so = 8`). Không bao giờ hỏi lại câu đã trả lời trong phiên, vì `answer` chỉ nhận mỗi câu một lần mỗi phiên (khoá `phiên|câu`, gửi lại chỉ trả kết quả cũ). Hết trần khi cần Câu chốt mới ⇒ Bi chốt thành bi trống: hạ hợp lệ là thắng, không +50.
- Câu chốt chấm như vai `trum` (EXP câu trùm, mục 4.8).

### 3.9 Kết thúc ván
| Tình huống | Kết quả |
|---|---|
| Câu chốt đúng | Người đó thắng |
| Bỏ cuộc (nút "Bỏ ván", có hộp xác nhận nêu hậu quả) | Người kia thắng; câu chưa đụng tới trả về kế hoạch |
| Rớt mạng > 60 giây (online) | Người còn lại thắng; ván ghi "đối thủ rớt mạng" |
| Ván mở quá 2 giờ | Tự đóng, không ai thắng |

Màn Kết thúc ván: người thắng; bảng Câu đúng x/y, Bi đã ăn x/7, Bi vàng, Điểm ván; EXP nhận (lấy từ phản hồi `answer`, không tự tính ở máy); Thể lực còn; Trần Bi-a còn; danh sách dạng câu sai đã vào lịch ôn; nút "Về Sảnh", "Đấu lại".

### 3.10 Chế độ chơi
| Chế độ | Câu | Tính trần Bi-a | Điểm bàn | Ghi chú |
|---|---|---|---|---|
| Đấu với bạn (mời hoặc mã bàn) | Có | Có | Có | Mỗi em một máy |
| Đấu với A.I Đỗ Đại Học | Có | Có | Không | Khi không ai rảnh |
| Bàn giao hữu | Không (mọi bi là bi trống) | Không | Không | Chỉ sau khi xong kế hoạch, tối đa 2 ván/ngày |

## 4. Nguồn câu, trần câu, chấm và ghi dữ liệu

### 4.1 Luồng
Thầy giao **Chiến dịch luyện** (`GiaoChienDich.tsx` → `/gv/chien-dich` → bảng `chien_dich`) → máy chủ chốt **kế hoạch ngày** của từng em lúc mở app lần đầu trong ngày (`layKeHoachHomNay`, `server/src/srs2-d1.ts:248-292`, bảng `srs2_ke_hoach`: `dao_json`, `doan_json`, `tong`) → Đoàn lấy phần `doan` (câu ôn Phần I/III), Đảo lấy phần `dao` (câu mới + câu ôn Phần II), **Bi-a lấy tối đa 40% mỗi phần**.
"Đã làm hôm nay" do `docDemHomNay` (`srs2-d1.ts:220-228`) đếm từ `su_kien_hoc` (`nguon='game'`, theo `ngay_vn`, mỗi khoá kế hoạch có thể mang hậu tố `#n`, bỏ bằng `qidGoc`). Câu Bi-a đi qua lệnh `answer` chung nên **tự** được đếm: Thể lực giảm, luật "câu thứ 41 trở đi 0 EXP" tự áp, Đảo/Đoàn tự không phát lại câu đó.

### 4.2 Xếp 8 câu cho một ván (`bia-xep-ban`)
1. Đọc `kh` hôm nay. Không có chiến dịch hoặc `kh.tong = 0` ⇒ trả lý do "chưa có chiến dịch", không xếp.
2. Tính trần còn (mục 4.3) cho phần `doan` và phần `dao`.
3. Loại khỏi ứng viên: câu đã làm hôm nay; câu đang nằm trong phiên Đảo/Đoàn còn mở (< 2 giờ, như `dangPhat` của `startDoan2`); câu đang bảo vệ cho ca kiểm tra (`protectedQuestions`); câu tự luận (`laCauTuLuan`); câu vượt khối của em (`khoi-cau`).
4. Chọn **Câu chốt** trước (giả định G1): câu Vận dụng trong phần được phép, ưu tiên câu ôn đang sai (cc = 0 trong hồ sơ `hs`); không có thì câu có `mucDo` cao nhất.
5. Chọn tối đa 7 câu cho bi 1–7: phần `doan` trước (tới hết trần phần `doan`), rồi phần `dao`. Trong mỗi phần giữ đúng thứ tự kế hoạch. Nạp bằng `napCau` (hiện là hàm nội bộ của `srs2-game.ts` — xuất ra để dùng chung).
6. Thiếu câu (trần còn < 8) ⇒ số bi còn lại là **bi trống**; Câu chốt luôn được giữ trước nếu trần còn ≥ 1. Trần còn 0 ⇒ không xếp ván, trả `{ lyDo: 'het_tran', conDoan, conDao }`.
7. Tạo phiên `game_v2_session` với json `{ mode: 'bia', hoa2: 1, bia: 1, van: <id ván>, created, questions: RefPhien[] }`; ref của Câu chốt có `role: 'trum'`, câu mới `'moi'`, câu ôn `'on_lai'`; `goiY` từ `goiYCho(q, t, sbd|qid|ngay)` như Đảo/Đoàn.
8. Trả về: `{ ok, van, session, bi: [{ so: 1..7, trong: boolean, cau?: publicQuestion + vai + goiY? }], chot: { cau: publicQuestion + vai + goiY? }, tran: { con, tong }, conDoan, conDao }`. **Không** có `correct`, `solution`, `answer` (dùng `publicQuestion`, qua `chanPhanHoiCau` ở máy).

### 4.3 Trần Bi-a 40% (thầy chốt)
- `tranDoan = floor(0,4 × số khoá phần doan của kế hoạch đã chốt hôm nay)`, `tranDao = floor(0,4 × số khoá phần dao)`. Trần Bi-a = `tranDoan + tranDao`.
- `daDungDoan` / `daDungDao` = số khoá của từng phần đã được **trả lời trong phiên Bi-a** hôm nay (đếm từ `game_v2_attempt` nối `game_v2_session` có `$.bia = 1`, tạo hôm nay) + số câu đang **giữ** trong ván Bi-a đang mở mà chưa trả lời.
- `conDoan_Bia = min(tranDoan − daDungDoan, số câu doan còn chưa làm)`, tương tự phần dao.
- Ví dụ (đúng số trong bản vẽ): kế hoạch 14 doan + 26 dao ⇒ trần 5 + 10 = 15. Chơi Bi-a trước tới hết trần ⇒ Đoàn còn 9, Đảo còn 16.
- Đoàn, Đảo **không** đổi luật: làm được toàn bộ phần còn lại, nên mỗi phần luôn còn ≥ 60% cho game của nó (vì floor).
- Huyết Chiến (tổng 80): công thức giữ nguyên, trần ≈ 32.
- Kế hoạch bị dựng lại giữa ngày (đổi chiến dịch, `onSaiLuat`): trần tính lại theo kế hoạch mới; câu đã làm vẫn đã làm.

### 4.4 Đổi câu khi sai (`bia-doi-cau`)
- Gọi sau mỗi câu sai của bi 1–7, và sau mỗi Câu chốt sai (`so = 8`, câu thay là câu Vận dụng kế tiếp).
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
| Câu thường đúng (bi 1–7, giải trước hoặc sau khi rơi) | Thưởng bậc thành thạo như câu Đảo/Đoàn, qua `nhanExpGame`, chung trần 120/ngày |
| Câu chốt đúng, không Bùa | Thêm EXP câu trùm `expMotCau(phan, sao)` |
| Câu thứ 41 trở đi trong ngày | 0 (luật hiện hành) |
| Thắng ván, bi trống, Bàn giao hữu, Điểm bàn | 0 |

### 4.9 Chống gian lận
- Đáp án, lời giải chỉ có trong phản hồi `answer` sau khi chốt.
- Máy đối thủ không bao giờ nhận nội dung câu, chỉ `{ so, trangThai: 'dang_giai'|'vang'|'da_an'|'doi_cau'|'trong', mucDo }`.
- Online: phòng đấu không tin máy khách tự báo đúng/sai; khi nhận "bi 3 đúng" phòng đọc `game_v2_attempt` (phiên, qid) để xác nhận (1 lần đọc D1 mỗi câu, không hỏi vòng).
- Thắng ván không cho EXP nên không có động cơ gian lận kết quả ván; Điểm bàn do phòng đấu tính từ trạng thái nó giữ.

## 5. Bàn giao hữu

- **Mở khi**: kế hoạch ngày của em đã xong (Thể lực còn 0 và tổng > 0) và em không có ca kiểm tra mở.
- **Giới hạn**: tối đa 2 ván/ngày/em, đếm lúc **bắt đầu** ván (vào ván là tính, bỏ giữa chừng vẫn tính).
- **Đối thủ**: A.I Đỗ Đại Học, hoặc bạn cùng lớp cũng đã xong kế hoạch ngày và còn lượt giao hữu. Lời mời tới bạn chưa xong kế hoạch thì không gửi được: "Minh Châu chưa xong kế hoạch hôm nay".
- **Luật**: như mục 3 nhưng mọi bi là bi trống (vào lỗ là ăn, 5 điểm), không Mắt thần (đường ngắm cơ bản), không Câu chốt (hạ Bi chốt hợp lệ là thắng).
- **Thưởng**: không EXP, không Vàng, không Điểm bàn, không trừ Thể lực.
- **Sảnh**: màn "Hôm nay em xong rồi" của Sảnh Bát Linh thêm thẻ "Bàn giao hữu · còn 2/2 ván hôm nay".

## 6. Chơi với nhau

### 6.1 Đấu với A.I Đỗ Đại Học (GĐ1)
- Chạy hoàn toàn trên máy em. A.I dùng chính lõi vật lý: thử tối đa 60 cú ứng viên (bóng bi ma theo từng bi của A.I × 6 lỗ × 3 lực, cộng 5 cú nhắm thẳng), chấm điểm từng cú (ăn bi +150, bi vàng +200, bi đối thủ rơi −90, phạm luật −250 đến −300, Bi chốt hợp lệ +1500), nhiễu góc ±0,7°. Đặt bi cái: thử 2 khoảng cách sau bóng bi ma của từng bi × lỗ.
- Bi của A.I không mang câu thật; A.I "trả lời" và "giải trước" theo tỉ lệ ở giả định G5.
- Kết thúc ván gọi `bia-ket-van` để ghi `bi_a_van` (loại `'ai'`).

### 6.2 Đấu với bạn (GĐ2)
- **Mời**: Sảnh Bi-a liệt kê bạn cùng lớp (`hoc_sinh.ten_lop`) **đang ở Sảnh Bi-a** (thấy trong 20 giây gần nhất), còn trần Bi-a, không đang đấu. Bảng `app_presence` hiện có không lưu số báo danh nên không dùng được; thay vào đó lệnh hỏi lời mời `bia-loi-moi` (mỗi 6 giây, **chỉ khi đang ở Sảnh Bi-a**, giống Võ đài) ghi luôn `bi_a_co_mat.last_seen`. "Mời" ⇒ `bia-moi`; lời mời hết hạn sau 60 giây.
- **Mã bàn**: `bia-tao-ban` trả mã 4 chữ số (duy nhất trong các bàn đang mở), bạn ngồi cạnh nhập mã ⇒ `bia-vao-ban`.
- **Phòng đấu**: mỗi bàn là 1 Durable Object `BanBiA` (lớp SQLite, WebSocket Hibernation), khoá theo mã ván. Kết nối `GET /bi-a/phong/<van>` nâng cấp WebSocket; gói đầu tiên `{loai:'vao', token}` (không để token trên đường dẫn).
- **Gói tin** (JSON, có `seq` tăng dần):
  - Máy → phòng: `cu {seq, dx, dy, v, sx, sy, datBi?:{x,y}}` (v là tốc độ đã tính, xem 7.1), `cau_xong {so, qid, attempt}`, `giai_truoc {so, trangThai:'dang_giai'|'dong'}`, `nhan {id: 1..6}`, `bo_van {}`.
  - Phòng → máy: `trang_thai {seq, bam, bi[], luot, diem, matThan, datBi, dongHo}` (đầy đủ, gửi khi vào/vào lại), `cu {seq, ...}` của đối thủ, `ket_qua_cu {seq, bam, suKien}`, `cau_ban {so, trangThai, mucDo}`, `nhan {tu, id}`, `ket_thuc {thang, lyDo}`, `loi {ma, chu}`.
- **Quyền quyết**: phòng mô phỏng lại mọi cú bằng `vat-ly.ts` và áp `luat.ts`; hai máy mô phỏng để chiếu ngay; băm lệch thì lấy `trang_thai` của phòng.
- **Câu trong trận**: máy em gọi `answer` qua HTTP như thường, rồi gửi `cau_xong {so, qid, attempt}`; phòng đọc `game_v2_attempt` (id = attempt) để biết đúng/sai thật rồi mới đổi trạng thái bi. Đang chờ câu sau khi bi rơi: phòng giữ lượt tối đa bằng thời gian câu + 10 giây.
- **6 câu nhắn soạn sẵn**, không chat tự do: "Cú đẹp!", "Suýt nữa!", "Tới lượt tớ nhé", "Hay đấy", "Chờ tớ giải câu", "Đấu lại không?".
- **Rớt mạng**: tự nối lại trong 60 giây, nhận `trang_thai` đầy đủ; quá 60 giây thua. Đồng hồ cú đánh của người rớt vẫn chạy.
- **D1 trong trận**: 0 lần đọc theo nhịp; chỉ 1 lần đọc xác nhận mỗi câu và 1 lần ghi kết thúc ván (`bi_a_van`, `bi_a_diem_ban`) trong 1 batch.
- **Dự phòng** (gói Cloudflare không có Durable Object): bảng `bi_a_ban (id, revision, json)` + hỏi vòng 1,5 giây như Đoàn Hộ Tống, giữ nguyên nội dung gói tin.

### 6.3 Bàn giao hữu với bạn (GĐ2)
Như 6.2, `loai = 'giao_huu'`, cả hai em phải đã xong kế hoạch và còn lượt giao hữu; không gọi `answer`, không có `cau_xong`.

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

### 7.3 Vẽ bi
- Bi 3D vẽ theo từng điểm ảnh: pháp tuyến mặt cầu × ma trận quay (từ quaternion) ⇒ màu nền, dải sọc (|lz| < 0,5), 2 đĩa số ở ±x cục bộ (|lx| > 0,9) lấy mẫu từ ảnh chữ số 48×48; đèn chiếu góc trên trái, bóng mờ viền, điểm loá.
- Bi cái có 6 chấm đỏ ở ±x, ±y, ±z cục bộ để thấy xoáy.
- Ảnh mỗi bi lưu đệm; chỉ vẽ lại khi hướng quay đổi. Độ phân giải tối đa gấp 2 lần điểm ảnh CSS.

## 8. Giao diện

### 8.1 Cửa vào trên Sảnh Bát Linh
- Cửa thứ ba "Bi-a Phản Ứng" cạnh Đoàn Hộ Tống và Bát Linh Đảo, cả bản dọc và bản ngang (cột 7/5).
- Trên cửa: "Trần Bi-a hôm nay: còn 15/15 câu". Hết trần: cửa mờ, dòng "Hết câu Bi-a hôm nay · Đoàn còn 9 câu · Đảo còn 16 câu". Xong kế hoạch: cửa đổi thành "Bàn giao hữu · còn 2/2 ván". Có ca kiểm tra mở: cửa mờ, "Đang có ca kiểm tra".
- Đầu Sảnh vẫn một dòng Thể lực như hiện nay; thêm dòng nhỏ "Đoàn còn a · Đảo còn b · Bi-a còn c".

### 8.2 Sảnh Bi-a
- Thẻ chiến dịch (tên, số câu, hạn nộp), Thể lực, Trần Bi-a, số câu Đoàn/Đảo còn.
- Nút chính vàng "Đấu với bạn cùng lớp"; hai nút phụ "Nhập mã bàn", "Đấu với A.I".
- Danh sách bạn cùng lớp đang ở Sảnh Bi-a (tên, "Trần Bi-a còn n câu" hoặc "Đang đấu"), nút "Mời" / "Xem" (xem là GĐ3).
- Lời mời đến: tấm dưới "Minh Châu mời em đấu Bi-a · Nhận / Từ chối" (tự đóng sau 60 giây).

### 8.3 Màn chơi (bố cục bản vẽ, dọc 360–430 px)
Từ trên xuống: đầu trang (Sảnh · tên game · âm thanh) → hai thẻ người chơi + điểm ván giữa (vòng đồng hồ 30 giây quanh ảnh thần thú) → hàng "Bi của em" (7 bi, trạng thái thường/vàng/đã ăn/trống, chip Mắt thần) → bàn (canvas) → dòng "Đang nhắm: Bi 3 · Chất béo · Thông hiểu · 20 điểm" → hàng điều khiển (nút xoáy · ‹ · thanh lực · ›).
Ảnh đại diện là thần thú của em (dùng lại Spirit2D), không dùng chữ viết tắt như bản vẽ.
Gắn vào app theo đúng mẫu màn "Câu đã làm": thêm `'bia'` vào `TabType` (`StudentPortalScreen.tsx:190`), `const BiA = lazy(() => import('../game/bi-a/BiaGame'))` cạnh dòng 79-81, khối toàn màn như dòng 1421-1427 với `Suspense fallback={<ChoNapGame/>}`, loại `'bia'` khỏi điều kiện tấm chung (dòng 1429), khỏi `vaoM3` (1297) và đầu trang (1449); `useToanManHinhGame` (249) nhận thêm `tab==='bia'`. Đóng Bi-a thì `useLamMoiKhiDong` tự tải lại `hoa2-sanh`.
Cửa trên Sảnh: thêm prop `onChoiBia` vào `SanhBanDoProps` (`SanhBanDo.tsx:33-57`), vẽ cửa trong `NutViec` (450-481, dùng chung dọc và ngang); dòng số câu trong `TheTheLucNgang`/HUD (96-102, 533-557). Kiểu `SanhHoa2` và bộ đọc `docSanh` (`src/components/hoa2/api.ts:22-30, 135-167`) thêm trường `bia`.

### 8.4 Tấm câu hỏi
- Khi trả lời: bọc `TheCau` chế độ `'thi'` (`src/components/TheCau.tsx`) theo đúng cách `TheCauAi` của Đảo 2.0 (`src/game/than-thu-v2/dao2/TrongAi.tsx:104-119`): Phần I `choices/selected/onSelect`, Phần II `ideas/selected[4]/onSelect(i,'D'|'S')`, Phần III ô `ONhapDapSo` (có sẵn phím "−" và ","). Gạch phương án của Bùa dùng lại `useGachPhuongAn` (`TrongAi.tsx:95-103`), dải Bùa và `cotLoi` như dòng 115-116; `docGoiY` ở `dao2-core.ts:27-33`.
- Sau khi chốt: lời giải bằng `loiGiaiChoTheCau(solution, phan, dapAn)` + `TheCau` chế độ `'xem_lai'` + ảnh `HinhTaiViTri` vị trí `'sau_loi_giai'` (mẫu `doan2/XemLaiChuan.tsx`). Công thức qua `ChemText`. Không vẽ bộ lời giải thứ hai; bản vẽ HTML chỉ minh hoạ bố cục.
- Nhãn: "BI 4 · CÂU ÔN" / "BI 4 · CÂU MỚI" / "BI CHỐT · CÂU CHỐT"; dạng · mức độ · kiểu câu; đồng hồ "Còn 1:24".
- Phần I: 4 nút phương án, chọn rồi "Chốt đáp án". Phần II: 4 hàng, mỗi hàng nút "Đúng"/"Sai". Phần III: ô số + bàn phím 0–9, ",", "−", ⌫ (dùng lại bàn phím ô đáp số đang có).
- Bùa Trợ giảng (goiY) hiện như Đoàn: gạch phương án hoặc kiến thức cốt lõi.
- Sau khi chốt: băng kết quả trên thẻ ("Đúng · ăn bi 4 · +20 điểm" / "Chưa đúng · bi 4 quay lại bàn"), nút xanh "Đã đọc lời giải · …" khi sai, nút vàng "Đánh tiếp"/"Về bàn" khi đúng.
- Tấm cuộn được khi dài; phần đầu không bao giờ bị cắt (đã sửa trong bản vẽ).

### 8.5 Sáng, tối, màu, chữ, âm thanh
- Nền game theo cặp của Đảo 2.0: mặc định sáng (hoàng hôn), tối (biển đêm) khi `prefers-color-scheme: dark` hoặc `:root[data-giao-dien='toi']`, giống `dao2.css:369-398`. Token riêng tiền tố `--bia-*` trong `src/game/bi-a/bi-a.css`, khai báo trên lớp gốc `.bia`.
- Màu trong `src/game/bi-a/` viết `rgb()` hoặc mảng số, không hex (để `npm run check:mau` đạt, không phải thêm tệp vào danh sách ngoại lệ).
- Chữ: Baloo 2 cho tiêu đề và số lớn, Be Vietnam Pro cho chữ; chữ câu hỏi ≥ 15 px.
- Âm thanh tổng hợp bằng Web Audio (va bi, băng, rơi lỗ, ăn bi, thắng) trong `src/game/bi-a/am-thanh.ts`; tắt/bật dùng chung khoá `localStorage 'game-battle-muted'` qua `battleMuted()`/`setBattleMuted()` của `battle-audio.ts`; mở khoá âm thanh trong thao tác chạm đầu tiên.
- Tự soát B1–B10 của bảng chuẩn; vùng chạm ≥ 44 px; `touch-action: none` trên bàn và thanh lực; tôn trọng giảm chuyển động (bớt hạt hiệu ứng).

## 9. Máy chủ và dữ liệu

### 9.1 Lệnh mới (họ `bia-*`, qua `/game-v2`, cạnh `doan-`/`LENH_HOA2` ở `game-v2.ts:254-259`, cần token)
| Lệnh | Vào | Ra | GĐ |
|---|---|---|---|
| `bia-sanh` | — | `{ bat, lyDoKhoa?, chienDich, theLuc, conDoan, conDao, tran:{con,tong}, giaoHuu:{mo, con}, diemBan?, vanDangMo? }` | 1 |
| `bia-xep-ban` | `{ cheDo, van? }` — `cheDo` là `ai`, `ban` hoặc `giao_huu` | mục 4.2 (giao hữu: mọi bi `trong:true`) | 1 |
| `bia-doi-cau` | `{ session, so }` | `{ so, trong, cau? }` | 1 |
| `bia-ket-van` | `{ session, van, ketQua:{thang, diemVan, lyDo} }` | `{ ok, expHomNay, theLuc, tran }` | 1 |
| `bia-moi` / `bia-loi-moi` / `bia-tra-loi-moi` | sbd bạn / — / `{id, nhan}` | lời mời | 2 |
| `bia-tao-ban` / `bia-vao-ban` | — / `{ma}` | `{ma, van}` | 2 |
`hoa2-sanh` (`sanh2`, `srs2-d1.ts:297-316`) trả thêm `bia: { bat, con, tong, giaoHuu:{mo,con}, lyDoKhoa? }` để Sảnh vẽ cửa.
Mọi lệnh `bia-*` trả `{ lyDoKhoa: 'dang_co_ca' }` khi em có ca kiểm tra mở (dùng cùng nguồn với `hsCaDangMo`, `index.ts:3275`) và `{ lyDoKhoa: 'chua_bat' }` khi cờ tắt.

### 9.2 Cờ bật Bi-a
- Khoá riêng `cau_hinh.khoa = 'bi_a'`, giá trị `{ bat, lop[], sbd[] }`, đọc bằng `biaMoCho(env, sbd, lop)` theo mẫu `doanMoCho` (`game-v2-doan.ts:55-62`). Không nhét vào khoá `game_hoa_2` vì `coLuu` (`srs2-gv.ts:42-47`) chỉ giữ `{bat, lop, sbd}` và ghi đè mỗi lần lưu.
- Mặc định tắt. Thầy bật trong app giáo viên: công tắc "Bi-a Phản Ứng" cạnh công tắc Game Hoá 2.0 (`src/components/chien-dich/CongTacHoa2.tsx`), gọi 2 lệnh mới `bia-co-doc` / `bia-co-luu` trong bộ định tuyến `/gv/chien-dich` (`srs2-gv.ts:17-35`). Làn giáo viên ⇒ Boss soát commit.

### 9.3 Bảng mới (migration CHỈ-THÊM `server/migration-<DDMM>-bi-a.sql`)
```sql
CREATE TABLE IF NOT EXISTS bi_a_van (
  id TEXT PRIMARY KEY,            -- mã ván
  loai TEXT NOT NULL,             -- 'ai' | 'ban' | 'giao_huu'
  ngay TEXT NOT NULL,             -- ngày VN
  sbd_a TEXT NOT NULL, sbd_b TEXT,-- sbd_b NULL khi đấu A.I
  session_a TEXT, session_b TEXT, -- phiên game_v2_session của mỗi em (NULL ở giao hữu)
  trang_thai TEXT NOT NULL,       -- 'mo' | 'xong' | 'bo' | 'het_gio'
  thang TEXT,                     -- sbd người thắng, 'ai', hoặc NULL
  diem_a INTEGER, diem_b INTEGER,
  json TEXT,                      -- tóm tắt: câu đúng/sai, bi ăn, bi vàng, lý do kết thúc
  tao_luc TEXT NOT NULL, xong_luc TEXT
);
CREATE INDEX IF NOT EXISTS bi_a_van_sbd_ngay ON bi_a_van(sbd_a, ngay);
CREATE INDEX IF NOT EXISTS bi_a_van_sbd_b_ngay ON bi_a_van(sbd_b, ngay);
CREATE TABLE IF NOT EXISTS bi_a_diem_ban (sbd TEXT PRIMARY KEY, diem INTEGER NOT NULL DEFAULT 1000, so_van INTEGER NOT NULL DEFAULT 0, cap_nhat TEXT);  -- GĐ2
CREATE TABLE IF NOT EXISTS bi_a_moi (id TEXT PRIMARY KEY, tu_sbd TEXT NOT NULL, den_sbd TEXT NOT NULL, loai TEXT NOT NULL, van TEXT, trang_thai TEXT NOT NULL, tao_luc TEXT NOT NULL); -- GĐ2
CREATE INDEX IF NOT EXISTS bi_a_moi_den ON bi_a_moi(den_sbd, trang_thai);
CREATE TABLE IF NOT EXISTS bi_a_co_mat (sbd TEXT PRIMARY KEY, ten_lop TEXT, last_seen TEXT NOT NULL); -- GĐ2: ai đang ở Sảnh Bi-a
CREATE INDEX IF NOT EXISTS bi_a_co_mat_lop ON bi_a_co_mat(ten_lop, last_seen);
```
Số ván giao hữu hôm nay = số dòng `bi_a_van` loại `'giao_huu'` của em trong ngày (tính cả `bo`).

### 9.4 Durable Object (GĐ2)
- `server/wrangler.toml`: `[[durable_objects.bindings]] name = "BAN_BIA"`, `class_name = "BanBiA"`; `[[migrations]] tag = "bia-v1"`, `new_sqlite_classes = ["BanBiA"]`. `Env` (`server/src/kieu.ts:39-46`) thêm `BAN_BIA?: DurableObjectNamespace` (có dấu ? để Worker cũ vẫn chạy khi chưa gắn).
- `server/src/index.ts` xuất thêm `export { BanBiA } from './bi-a-phong'` và định tuyến `/bi-a/phong/*`.
- Code 3 kiểm gói Cloudflare có Durable Object lớp SQLite trước GĐ2; không có thì làm dự phòng 6.2.

## 10. Tệp và làn (theo DIEU-PHOI.md)

| Tệp | Việc | Chủ làn / người soát |
|---|---|---|
| `src/game/bi-a/**` (mới): `vat-ly.ts`, `luat.ts`, `ai.ts`, `du-doan.ts`, `ve-bi.ts`, `ve-ban.ts`, `am-thanh.ts`, `mang.ts` (GĐ2), `BiaGame.tsx`, `BiaSanh.tsx`, `BanChoi.tsx`, `HangBiCuaEm.tsx`, `TamCauBia.tsx`, `KetThucVan.tsx`, `bi-a.css` | Game | Phiên build Bi-a (làn mới) |
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
| **GĐ1** | Lõi vật lý + luật + A.I + vẽ bi 3D + Mắt thần; màn chơi, hàng Bi của em, tấm câu (TheCau), Kết thúc ván; Sảnh Bi-a (chỉ nút "Đấu với A.I" hoạt động, hai nút online ghi "Sắp mở"); cửa trên Sảnh + số câu 3 game; lệnh `bia-sanh`, `bia-xep-ban`, `bia-doi-cau`, `bia-ket-van`; trần 40%; 3 chỗ chặn lẫn Đảo; bảng `bi_a_van`; cờ + công tắc; Bàn giao hữu với A.I | Online, Điểm bàn | Worker (Code 3) rồi Pages (Code 2), cờ bật cho 1 lớp thử trước |
| **GĐ2** | Durable Object, mời bạn, mã bàn, nối lại, 6 câu nhắn, Bàn giao hữu với bạn, Điểm bàn (Elo) | Xem đấu, cửa hàng | Như GĐ1 |
| **GĐ3** | Bảng tuần của lớp (top 3, không lộ số báo danh), xem bạn đấu, gậy và mặt bàn đổi Vàng ở Cửa hàng, 3 mức A.I | — | Như GĐ1 |

## 12. Định nghĩa hoàn thành GĐ1 (mỗi dòng là một dòng sổ việc, phải có bằng chứng là lệnh đã chạy)

| # | Tiêu chí | Cách đo |
|---|---|---|
| 1 | Vật lý đạt các số đo mục 7.2 | `npx vitest run tests/bi-a-vat-ly.test.ts` |
| 2 | Tất định: 1.000 cú ngẫu nhiên seed cố định, chạy 2 lần trên Node cho cùng băm; cùng 50 cú chạy trong Chromium (Playwright) cho cùng băm với Node | `npx vitest run tests/bi-a-vat-ly.test.ts` + `node scripts/bi-a-tat-dinh.mjs` |
| 3 | Luật: ≥ 18 ca có tên — bi vàng rơi; bi thường rơi đúng; rơi sai; rơi 2 bi câu đầu sai; bi trống rơi; bi đối thủ rơi; P1–P5; phá bàn chạm bi đối thủ không phạm luật; Câu chốt đúng; Câu chốt sai; giải trước đúng; giải trước sai; hết giờ cú; hết giờ câu; Mắt thần không vượt 3; tấm câu của em không chặn cú đánh của A.I | `npx vitest run tests/bi-a-luat.test.ts` |
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
| 15 | Chạy thật trên bản sống sau phát hành: 1 em thử (cờ bật cho 1 sbd) chơi hết 1 ván A.I; Bảng chiến dịch của thầy có câu của ván; Thể lực và trần Bi-a đúng số | Ảnh chụp + truy vấn `su_kien_hoc` đọc-chỉ |

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
| Tấm câu chặn cú đánh của đối thủ (lỗi đã gặp ở bản vẽ) | Nghiệm thu 3, ca cuối |
| Gói Cloudflare không có Durable Object | Dự phòng hỏi vòng 1,5 giây (6.2) |
| Phiên cloud không đẩy được Worker/Pages | Code 3 đẩy Worker, Code 2 đẩy Pages từ worktree sạch |

## 14. Không làm

- Không viết bộ chấm, bộ EXP, bộ lời giải, thuật toán kế hoạch thứ hai; không đổi `grade()`, `lapKeHoachNgay`, `nhanExpGame`.
- Không cộng EXP khi thắng ván, ở bi trống, ở Bàn giao hữu.
- Không cho đổi đáp án sau khi chốt; không rút câu tự luận; không gửi nội dung câu của em sang máy đối thủ.
- Không chat tự do; không chế độ "hai người một máy".
- Không sửa đồ hoạ, hoạt ảnh của Bát Linh Đảo và Đoàn Hộ Tống.
- Không thêm thư viện vật lý hay đồ hoạ; gói JS của game ≤ 60 KB sau gzip.
- Không đổi schema có sẵn; không xoá, ghi đè dữ liệu thật; không phát hành khi đang có ca thi mở.

## 15. Phụ lục — bảng quyết định cuối cú đánh (dùng cho `luat.ts` và phòng đấu)

```
vao: su_kien {firstHit, potted[], cuePotted}, conTruoc (số bi chưa ăn của người đánh), laPhaBan
1  loi = P1 nếu cuePotted
       | P2 nếu firstHit rỗng
       | (không phá bàn) P4 nếu firstHit = 8 và conTruoc > 0
       | (không phá bàn) P3 nếu firstHit là bi đối thủ
       | P5 nếu 8 ∈ potted và conTruoc > 0
2  nếu loi: đặt lại mọi bi trong potted (kể cả 8), bi cái → đầu bàn nếu rơi; đối thủ đặt bi cái; HẾT LƯỢT
3  biBan = potted ∩ bi đối thủ → đặt lại chân bàn
   biAn  = potted ∩ (bi vàng ∪ bi trống của người đánh) → ăn ngay
   nếu 8 ∈ potted và Bi chốt là bi trống ⇒ THẮNG (dừng)
   hang  = potted ∩ bi thường của người đánh (theo thứ tự rơi) + [Câu chốt nếu 8 ∈ potted]
4  với từng mục trong hang: mở câu → đúng: ăn (+Mắt thần) | sai: đặt lại, đổi câu
   Câu chốt đúng ⇒ THẮNG (dừng)
5  ĐÁNH TIẾP ⇔ không sai câu nào ∧ biBan rỗng ∧ (biAn ∪ bi ăn ở bước 4) khác rỗng
   ngược lại HẾT LƯỢT (không đặt bi cái)
```
