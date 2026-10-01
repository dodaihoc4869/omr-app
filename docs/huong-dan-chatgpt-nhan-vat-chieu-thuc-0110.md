# Hướng dẫn nhờ ChatGPT vẽ nhân vật chạy, đánh, tung chưởng và sáng tác cốt truyện, chiêu thức

Ngày 01/10/2026. Dùng cho game Bát Linh (thần thú đánh quái bằng câu Hoá).

---

## Cách dùng (đọc 1 phút)

| Bước | Dán prompt nào | Làm mấy lần | Thầy nhận về |
|---|---|---|---|
| 1 | **Prompt 0** (luật chung) | Một lần, đầu cuộc trò chuyện | ChatGPT nhắc lại luật |
| 2 | **Prompt 1** (bảng động tác), kèm ảnh thần thú hiện có | 4 lần mỗi con (chạy, đấm, chưởng, đứng/trúng đòn) | 4 ảnh PNG |
| 3 | **Prompt 2** (bảng mảnh rời) | Chỉ khi bước 2 vẽ lệch dáng | 1 ảnh PNG |
| 4 | **Prompt 3** (chiêu thức) | Một lần cho cả 8 con | 1 khối JSON |
| 5 | **Prompt 4** (cốt truyện đảo) | Mỗi đảo một lần, làm Đảo 9 trước | 1 khối JSON |
| 6 | **Prompt 5** (tự soát) | Sau mỗi lần ở bước 4 và 5 | Bảng lỗi, bản sửa |

**Làm thử một con trước.** Vẽ đủ 4 bảng cho **Thuỷ Long**, gửi em ghép vào bản thử. Thầy xem chuyển động ổn rồi mới vẽ 7 con còn lại.

**Đặt tên tệp khi lưu:** `thu-<số>-<động tác>.png`.
- Ví dụ: `thu-1-chay.png`, `thu-1-dam.png`, `thu-1-chuong.png`, `thu-1-dung-trung.png`.
- Số thần thú: 0 Thạch Quy, 1 Thuỷ Long, 2 Viêm Sư, 3 Phong Thố, 4 Tinh Lang, 5 Ái Hồ, 6 Ân Lộc, 7 Minh Linh.

**Mẹo giữ nhân vật không bị đổi mặt:**
- Vẽ cả 4 bảng của một con **trong cùng một cuộc trò chuyện**.
- Lần nào cũng đính kèm ảnh gốc của con đó, cộng với bảng đã duyệt gần nhất.
- Bảng nào lệch thì bảo "vẽ lại toàn bộ, giữ đúng nhân vật như ảnh đính kèm". Không bảo sửa từng ô: ChatGPT luôn vẽ lại cả ảnh.

---

## Prompt 0: Luật chung (dán một lần đầu cuộc trò chuyện)

```
Bạn là họa sĩ nhân vật game 2D kiêm biên kịch game giáo dục. Bạn giúp tôi làm game "Bát Linh" cho học sinh THPT Việt Nam 15–18 tuổi ôn môn Hoá theo sách Kết nối tri thức.

THẾ GIỚI
- Quần đảo Bát Linh từng được tám linh thú canh giữ cuốn Nguyên Tố Thư. Cuốn sách bị xé, mỗi trang rơi xuống biển thành một hòn đảo.
- Chỗ chữ bị nhoè sinh ra Mê Vụ, màn sương của những hiểu nhầm. Từ sương mọc lên quái.
- Quái không ác, chúng chỉ TIN SAI một kiến thức Hoá (ví dụ tin Fe luôn lên hoá trị III). Muốn quái tan phải chỉ đúng chỗ nó sai.
- Người chơi là "Người Giữ Sổ", đi cùng 3 thần thú.

TÁM THẦN THÚ (giữ đúng tên)
0 Thạch Quy (đất, rùa đá); 1 Thuỷ Long (nước, rồng nhỏ); 2 Viêm Sư (lửa, sư tử); 3 Phong Thố (gió, thỏ); 4 Tinh Lang (sao, sói); 5 Ái Hồ (tình thương, cáo chín đuôi hồng); 6 Ân Lộc (cây cỏ, hươu); 7 Minh Linh (ánh sáng, linh điểu).

CÁCH ĐÁNH TRONG GAME
- Trả lời đúng: thần thú chạy tới đấm liên hoàn, hoặc đứng xa tung chưởng.
- Đúng 3 câu liền: cả đội tung tuyệt chiêu, quay chậm.
- Trả lời sai: quái đánh lại, thần thú hồi máu, rồi hiện giải thích vì sao sai.
- Thần thú KHÔNG có chỉ số riêng: con nào cũng mạnh như nhau, chỉ khác hình và hiệu ứng.

LUẬT BẮT BUỘC
1. Không sao chép nhân vật, tên chiêu, trang phục, hình dáng của bất kỳ game hay truyện nào (Ngọc Rồng, Pokémon, Naruto, Genshin, Tinh Linh Nguyên Thuỷ...). Chỉ học phong cách chuyển động.
2. Lời thoại giọng teen vui, được trêu quái. TUYỆT ĐỐI không chê bai, mỉa mai học sinh. Quái được khiêu khích; thần thú luôn đứng về phía học sinh.
3. Kiến thức Hoá phải đúng chương trình 2018: danh pháp IUPAC (sulfur, nitrogen, bromine, acid...), thể tích khí ở đkc 24,79 L/mol. Không chắc thì ghi [CẦN KIỂM TRA], không được đoán.
4. Không bạo lực máu me. Quái thua thì tan thành khói hoặc quy phục, không chết thảm.
5. Không lồng tiếng. Mọi lời thoại là chữ, mỗi câu tối đa 14 chữ.

Trả lời "Đã nhớ luật" và tóm tắt 5 luật trên trong 5 dòng.
```

---

## Prompt 1: Bảng động tác (mỗi con vẽ 4 bảng)

Đính kèm ảnh gốc của thần thú, ví dụ ảnh Thuỷ Long trong app. Dán prompt dưới, thay hai chỗ `<...>`.

```
Vẽ BẢNG ĐỘNG TÁC (sprite sheet) cho thần thú <TÊN THẦN THÚ> trong ảnh đính kèm, động tác: <TÊN ĐỘNG TÁC>.

GIỮ NGUYÊN NHÂN VẬT
- Đúng nhân vật trong ảnh đính kèm: cùng màu, cùng hoa văn, cùng số đuôi/sừng/cánh, cùng phong cách vẽ.
- Tỉ lệ chibi: đầu khoảng 1/3 chiều cao.

KHUÔN ẢNH (bắt buộc đúng từng số)
- Ảnh ngang 1536 × 1024 px, chia lưới 3 cột × 2 hàng = 6 ô, mỗi ô 512 × 512 px.
- Đọc theo thứ tự: hàng trên trái → phải là ô 1, 2, 3; hàng dưới trái → phải là ô 4, 5, 6.
- Mỗi ô là MỘT khung hình liên tiếp của cùng một động tác.
- Góc nhìn NGHIÊNG, nhân vật quay mặt sang PHẢI, ở cả 6 ô.
- Cùng kích thước nhân vật ở cả 6 ô: cao khoảng 400 px (80% ô).
- Chân chạm cùng một đường đất ở độ cao 470 px tính từ mép trên mỗi ô (trừ khung đang bật nhảy).
- Thân nhân vật nằm giữa ô theo chiều ngang. Nếu động tác có lao người tới trước thì được lệch tối đa 60 px.
- Ánh sáng từ góc trên bên trái, giống nhau ở cả 6 ô.

NỀN
- Nền TRONG SUỐT (PNG có kênh alpha).
- Nếu không làm được nền trong suốt: tô nền một màu hồng sen thuần #FF00FF, phẳng tuyệt đối, không đổ bóng. Không dùng màu #FF00FF ở bất kỳ chỗ nào trên nhân vật.

KHÔNG VẼ
- Không vẽ đường kẻ lưới, số thứ tự, chữ, khung viền.
- Không vẽ bóng dưới chân.
- Không vẽ hiệu ứng chưởng, tia, vệt sáng, tia lửa bay ra ngoài người. Hiệu ứng sẽ do lập trình vẽ riêng.
- Lửa, nước, lá vốn là một phần cơ thể nhân vật thì giữ.

ĐỘNG TÁC (chọn đúng một khối theo tên động tác)

[CHẠY]
Vòng chạy lặp lại liền mạch: ô 6 nối được về ô 1.
- Ô 1: chân trước chạm đất.
- Ô 2: người hạ thấp, gánh lực.
- Ô 3: đạp đất, người bật lên.
- Ô 4: lơ lửng, hai chân duỗi.
- Ô 5: chân kia chạm đất.
- Ô 6: đạp đất lần hai.
Người nghiêng về trước 10–15 độ. Đuôi, tóc, bờm bay ngược ra sau.

[ĐẤM]
Đòn cận chiến liên hoàn.
- Ô 1: thủ thế.
- Ô 2: rút tay hoặc vuốt về sau.
- Ô 3: đấm thẳng, tay duỗi hết cỡ.
- Ô 4: đòn thứ hai bằng tay hoặc chân kia.
- Ô 5: lấy đà xoay người.
- Ô 6: cú hất móc lên trời, toàn thân vươn lên.

[CHƯỞNG]
Tung chưởng tầm xa.
- Ô 1: thủ thế.
- Ô 2: lùi nửa bước, hai tay hoặc miệng thu về, gồng người.
- Ô 3: gồng mạnh nhất, mắt sáng, bờm/đuôi bung ra.
- Ô 4: đẩy chưởng ra trước, tay hoặc miệng mở hướng sang phải ngang tầm ngực.
- Ô 5: giữ tư thế đẩy, người giật lùi nhẹ.
- Ô 6: thu về thủ thế.
Ghi rõ "điểm bắn" ở ô 4: vị trí tay hoặc miệng, tính bằng pixel trong ô (x, y). Ghi ở phần chữ trả lời, KHÔNG ghi lên ảnh.

[ĐỨNG-TRÚNG]
- Ô 1–2: đứng thở, ngực phồng và xẹp nhẹ.
- Ô 3: bị trúng đòn, người giật lùi, nhắm mắt.
- Ô 4: bị hất bay, người ngả ra sau.
- Ô 5: tiếp đất, khuỵu một gối.
- Ô 6: đứng dậy tạo dáng thắng trận, vui vẻ.

SAU KHI VẼ, trả lời thêm bằng chữ:
- Điểm bắn ở ô 4 (chỉ khi động tác là CHƯỞNG).
- Ô nào bạn thấy chưa khớp ô bên cạnh (lệch kích thước, lệch đường đất, đổi màu).
```

**Duyệt ảnh trước khi gửi em.** Đặt 6 ô cạnh nhau rồi soát:
- Nhân vật có cùng to nhỏ không?
- Chân có cùng một đường đất không?
- Màu và hoa văn có giữ nguyên không?
- Mặt có quay cùng sang phải không?

Sai một điều là vẽ lại.

---

## Prompt 2: Bảng mảnh rời (dùng khi Prompt 1 vẽ lệch dáng nhiều lần)

Cách này chỉ cần vẽ một lần mỗi con. Em sẽ ráp các mảnh và cho chúng cử động bằng lập trình, nên chạy, đấm, chưởng đều mượt và không bao giờ lệch mặt.

```
Vẽ BẢNG MẢNH RỜI của thần thú <TÊN THẦN THÚ> trong ảnh đính kèm, dùng để ráp khung xương hoạt hình 2D.

- Ảnh ngang 1536 × 1024 px, lưới 4 cột × 2 hàng = 8 ô, mỗi ô 384 × 512 px.
- Nền trong suốt; không được thì nền #FF00FF phẳng.
- Góc nhìn nghiêng, quay mặt sang PHẢI. Cùng tỉ lệ với nhân vật đứng thẳng cao 400 px.
- Mỗi ô một mảnh, đặt giữa ô:
  1 đầu (kèm tai, sừng, bờm); 2 thân; 3 tay/chân trước phía gần; 4 tay/chân trước phía xa (tô tối hơn 15%);
  5 chân sau phía gần; 6 chân sau phía xa (tô tối hơn 15%); 7 đuôi; 8 phụ kiện (cánh, vây, đuôi thứ hai...). Không có phụ kiện thì để trống ô 8.
- Mỗi mảnh vẽ dư phần khớp nối (cổ, vai, hông) khoảng 20 px, để khi xoay không hở.
- Không vẽ chữ, số, lưới, bóng.

Sau khi vẽ, trả lời bằng chữ một bảng: tên mảnh | điểm khớp (x, y trong ô, là chỗ mảnh xoay quanh) | mảnh đó gắn vào mảnh nào.
```

---

## Prompt 3: Chiêu thức cho 8 thần thú

```
Sáng tác bộ chiêu thức cho 8 thần thú Bát Linh. Theo đúng luật đã nhớ.

YÊU CẦU
- Mỗi con 3 chiêu: (a) ĐẤM: cận chiến liên hoàn; (b) CHƯỞNG: tầm xa; (c) TUYỆT CHIÊU: chiêu lớn, quay chậm.
- Tên chiêu kiểu Hán Việt, 2–4 chữ. Không trùng tên chiêu của game hay truyện có thật.
- Hiệu ứng CHỈ được ghép từ danh sách sau (lập trình vẽ được, chạy mượt trên máy yếu):
  vệt chưởng (mũi dài thon) · cầu chưởng · tia chưởng (dải sáng thẳng) · gai sáng toả · vòng sóng · mây khói ·
  sao lấp lánh · hạt bay lên · hạt rơi · bóng mờ khi lướt · chớp trắng · rung màn · quay chậm · khựng hình ·
  lá bay · cánh hoa · tia sét gấp khúc · bọt nước.
  Muốn hiệu ứng ngoài danh sách thì mô tả bằng hình học đơn giản: hình gì, màu gì, bay hướng nào, bao lâu (mili giây).
- Màu: mỗi con 1 màu chính + 1 màu phụ, ghi mã hex.
- Câu hô khi tung chiêu: tối đa 6 chữ, giọng teen, không chê người chơi.
- Thêm 4 HỢP KÍCH (hai thần thú phối hợp), mỗi hợp kích ghi hai con nào, diễn biến 3 nhịp.
- Mỗi chiêu gắn một ý Hoá ĐÚNG làm "chất" cho chiêu. Ví dụ: chiêu của Minh Linh gắn dòng electron đi từ cực âm sang cực dương ở mạch ngoài của pin. Không chắc thì ghi [CẦN KIỂM TRA].

ĐẦU RA: chỉ một khối JSON hợp lệ, đúng cấu trúc sau, không thêm chữ ngoài khối:
{
  "than_thu": [
    {
      "so": 1, "ten": "Thuỷ Long", "mau_chinh": "#5fd4ff", "mau_phu": "#ffffff",
      "chieu": [
        {
          "loai": "dam", "ten": "...", "cau_ho": "...",
          "dien_bien": ["nhịp 1 ...", "nhịp 2 ...", "nhịp 3 ..."],
          "hieu_ung": ["vệt chưởng", "gai sáng toả"],
          "y_hoa": "...", "can_kiem_tra": false
        }
      ]
    }
  ],
  "hop_kich": [
    { "ten": "...", "hai_con": [1, 2], "dien_bien": ["...", "...", "..."], "hieu_ung": ["..."], "y_hoa": "..." }
  ]
}
```

---

## Prompt 4: Cốt truyện một đảo (mỗi đảo dán một lần, làm Đảo 9 trước)

Thay các chỗ `<...>`. Dữ liệu từng đảo (tên, quái, bẫy, trùm) lấy ở bảng mục 3.4 của tệp `GDD-BAT-LINH-0110.md`. Ví dụ Đảo 9 đã điền sẵn dưới đây.

```
Viết cốt truyện cho một đảo của Bát Linh. Theo đúng luật đã nhớ.

THÔNG TIN ĐẢO
- Đảo: <Đảo 9 – Đảo Nitrogen – Sulfur> (chương Nitrogen và Sulfur, Hoá 11, sách Kết nối tri thức).
- Quái đầu đàn: <Rồng Khói Nâu>. Hiểu nhầm nó tin: <cho số mol NO bằng số mol Cu khi Cu tác dụng với HNO₃ loãng>.
- Quái thường: <Bọ Thụ Động> (tin Al, Fe tan trong HNO₃ đặc nguội), <Ma Khói NO₂> (tin NO₂ không màu).
- Trùm đảo: <Long Vương Sulfur>.
- Đội thần thú: <Thuỷ Long, Viêm Sư, Ái Hồ>.

YÊU CẦU
1. Hồi truyện mở đảo: tối đa 120 chữ. Có một bí ẩn nhỏ khiến người chơi muốn đi tiếp.
2. Mỗi quái:
   - ngoại hình, tối đa 30 chữ;
   - hiểu nhầm nó tin, viết thành câu nói của quái;
   - 5 câu khiêu khích trước trận;
   - 3 câu khi bị đánh trúng;
   - 1 câu khi quy phục. Câu quy phục phải tự nói ra kiến thức ĐÚNG, ví dụ "Ờ ha, 3 Cu chỉ cho 2 NO thôi".
3. Mỗi thần thú trong đội: 5 câu đáp trả quái, 3 câu động viên khi người chơi trả lời sai, 3 câu ăn mừng khi đúng.
   - Câu động viên chỉ ra hướng sửa, không chê.
4. Trùm đảo: hồi xuất hiện tối đa 80 chữ; 3 giai đoạn đánh, mỗi giai đoạn gắn một hiểu nhầm khác nhau trong chương; câu thua cuộc.
5. Kết đảo: tối đa 60 chữ, mở sang đảo tiếp theo.
6. Mỗi câu thoại tối đa 14 chữ, giọng teen tự nhiên. Không dùng từ chửi thề, không body-shaming, không chê học sinh ngu dốt.
7. Mọi kiến thức Hoá nhắc tới phải đúng. Có số liệu thì ghi phép tính kiểm tra ngắn.

ĐẦU RA: một khối JSON hợp lệ, không thêm chữ ngoài khối:
{
  "dao": 9, "ten_dao": "...", "mo_dao": "...",
  "quai": [
    {
      "ten": "...", "ngoai_hinh": "...", "hieu_nham": "...",
      "khieu_khich": ["..."], "trung_don": ["..."], "quy_phuc": "...",
      "kien_thuc_dung": "...", "phep_tinh_kiem_tra": "..."
    }
  ],
  "than_thu": [
    { "ten": "...", "dap_tra": ["..."], "dong_vien_khi_sai": ["..."], "an_mung": ["..."] }
  ],
  "trum": {
    "ten": "...", "xuat_hien": "...",
    "giai_doan": [ { "hieu_nham": "...", "kien_thuc_dung": "...", "loi_thoai": ["..."] } ],
    "thua_cuoc": "..."
  },
  "ket_dao": "...",
  "can_kiem_tra": ["liệt kê mọi chỗ bạn chưa chắc"]
}
```

---

## Prompt 5: Bắt ChatGPT tự soát (dán sau mỗi lần ở Prompt 3 và Prompt 4)

```
Soát lại khối JSON bạn vừa viết theo 6 tiêu chí. Mỗi tiêu chí ghi ĐẠT hoặc TRƯỢT, và chỉ đúng vị trí trượt:
1. JSON hợp lệ, đủ trường, đúng cấu trúc yêu cầu.
2. Không câu thoại nào dài quá 14 chữ; không câu hô nào dài quá 6 chữ.
3. Không câu nào chê, mỉa mai hoặc hạ thấp người chơi.
4. Không tên, chiêu, trang phục nào trùng với game hay truyện có thật.
5. Mọi kiến thức Hoá đúng chương trình 2018, đúng danh pháp IUPAC, khí ở đkc 24,79 L/mol. Có số liệu thì tính lại từng phép tính.
6. Hiệu ứng chỉ dùng từ danh sách cho phép, hoặc được mô tả bằng hình học đơn giản.
Có tiêu chí TRƯỢT thì đưa lại TOÀN BỘ khối JSON đã sửa.
```

---

## Gửi lại cho em

- **Ảnh:** 4 tệp PNG mỗi con, đặt tên đúng quy ước. Kèm điểm bắn của bảng CHƯỞNG.
- **Chữ:** khối JSON chiêu thức và JSON từng đảo (chép nguyên khối, hoặc lưu tệp `.json`).

Em sẽ làm tiếp:
- tách nền và cắt khung hình;
- ghép vào bản thử để thầy xem;
- kiểm lại kiến thức Hoá trong JSON trước khi đưa vào game;
- báo những chỗ ChatGPT ghi [CẦN KIỂM TRA] để thầy duyệt.
