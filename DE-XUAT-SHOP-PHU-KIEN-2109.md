# ĐỀ XUẤT · Vàng từ EXP thừa + Cửa hàng phụ kiện thần thú (21/09/2026)

Đề bài: `prompt-shop-phu-kien-than-thu-2109.md` (các dòng BOSS CHỐT là quyết định cuối). Mẫu phác: `docs/ban-ve-shop-phu-kien-2109/mau-phac.html` + ảnh `mau-phac-390-toi.jpg`, `mau-phac-390-sang.jpg`.

## 1. Tóm tắt 10 dòng cho thầy

1. EXP thừa trong ống nghiệm đổi được thành **vàng**: 1 EXP = 1 vàng, một chiều, luôn giữ lại 200 EXP (1 ngày ăn) cho thần thú.
2. Vàng chỉ sinh từ việc học; không tặng, không chuyển cho bạn, không tiền thật, không có gì may rủi.
3. **Cửa hàng** mùa 1 có 40 phụ kiện, 5 bậc đắt dần (Thường · Đẹp · Hiếm · Sử thi · Huyền thoại), giá từ 20 tới 12.000 vàng; phụ kiện chỉ để đẹp. Tên món em chưa học bài ấy vẫn hiểu ("Đuôi Lửa Tím", "Vòng Sáng Neon", "Khung Vàng 999"); mỗi món kèm MỘT dòng **Bật mí Hoá học** — chỗ duy nhất dùng tên chất (mục 3, mục 9).
4. Em chăm (dư 80 EXP/ngày) mua món đầu ở **ngày 3**; món Huyền thoại rẻ nhất ở **ngày 78 ≈ 11 tuần**. Em trung bình: món đầu ngày 8. Em thất thường: 30 ngày chưa có vàng — vàng thưởng sự đều đặn.
5. Huyền thoại = giá + điều kiện học (chuỗi 14–30 ngày, 5 ấn thạch sáng) + mỗi món chỉ có 10–30 cái mỗi mùa. Có sẵn nhiều EXP cũng không mua ngay được.
6. Bạn cùng đoàn và Bảng vinh danh NHÌN THẤY phụ kiện; app phụ huynh không có gì; app thầy chỉ một dòng "số em đã mua phụ kiện".
7. Hai đợt: đợt 1 = 24 món ở ba chỗ đeo chưa cần bảng điểm đặt theo loài (Vòng sáng, Đuôi sáng, Khung tên); đợt 2 = 16 món Trên đầu và Trên lưng, cần bảng điểm đặt cho 8 loài.
8. Máy chủ giữ sổ chỉ-ghi-thêm, số dư = tổng sổ; máy em chỉ hiện số máy chủ trả.
9. Việc ĐẦU TIÊN của máy chủ: đo phân bố ống nghiệm thật (p50/p90/cao nhất) rồi Boss mới khoá bảng giá.
10. Tắt nhanh bằng cờ `cau_hinh.shop_phu_kien`; ba bảng mới xếp nhóm GIỮ khi reset.

## 2. Kinh tế vàng

**Luật.** Đổi được tối đa = max(0, ống nghiệm − 200), do máy chủ tính. Em kéo thanh chọn số EXP (bước 10), màn ghi dự trữ trước và sau khi đổi; hộp xác nhận hai câu ngắn, nói thật cái giá, không doạ: "Thần thú bớt X EXP dự trữ, vẫn đủ N ngày ăn. Em nhận X vàng, đổi rồi không đổi ngược lại được."

**Giả định về trần game mới.** Thầy vừa tách trần câu: Đảo 36 câu/ngày, Đoàn Hộ Tống 60 câu/ngày riêng. Nhưng trần EXP game vẫn là 120 EXP/ngày (`TRAN_EXP_GAME_NGAY`), nên thêm câu KHÔNG thêm EXP: em chăm vẫn kiếm 250–290 EXP/ngày, dư 50–90; bảng dùng 80. Nếu sau này nâng trần EXP game (ví dụ lên 200) thì em chăm dư khoảng 160/ngày, Huyền thoại 6.000 chỉ còn 39 ngày (5,6 tuần) ⇒ TRƯỢT; khi đó nhân đôi giá hai bậc Sử thi và Huyền thoại trước khi bật.

**Mô phỏng 30 ngày** (trường hợp xấu nhất: ống nghiệm bắt đầu 0; dồn hết, chưa mua gì; ô ghi "ống nghiệm / vàng đổi được"):

| Mốc | Chăm (dư 80/ngày) | Trung bình (dư 30/ngày) | Thất thường (học đủ 3 ngày/tuần) |
|---|---|---|---|
| Ngày 3 | 240 / 40 | 90 / 0 | 40 / 0 |
| Ngày 7 | 560 / 360 | 210 / 10 | 40 / 0 |
| Ngày 14 | 1.120 / 920 | 420 / 220 | 80 / 0 |
| Ngày 21 | 1.680 / 1.480 | 630 / 430 | 120 / 0 |
| Ngày 30 | 2.400 / 2.200 | 900 / 700 | 160 / 0 |
| Món Thường rẻ nhất (20 vàng) | **ngày 3** | ngày 8 | ngày 36 |
| Món Đẹp rẻ nhất (120) | ngày 4 | ngày 11 | ngày 50 |
| Món Hiếm rẻ nhất (500) | ngày 9 | ngày 24 | ngày 120 |
| Món Sử thi rẻ nhất (1.800) | ngày 25 | ngày 67 | ngoài mùa 1 |
| Món Huyền thoại rẻ nhất (6.000) | **ngày 78 = 11,1 tuần** | ngày 207 | không tới |

Em thất thường: Thứ Hai, Tư, Bảy học đủ (dư 40 mỗi ngày); Thứ Ba, Năm học qua loa (kiếm 80, thú ăn 120 ⇒ dự trữ −40); Thứ Sáu, Chủ nhật nghỉ hẳn (theo luật hấp thụ 200/120/0 thú ăn 0). Ròng +40 EXP/tuần. Biến thể nghỉ hẳn cả bốn ngày (+120/tuần): món đầu ngày 13, ngày 30 có 320 vàng. Em nào đã có sẵn từ 220 EXP trong ống nghiệm thì mua món đầu ngay ngày 1.

**Tự kiểm.** Món đầu của em chăm: ngày 3 (≤ 3) — ĐẠT. Huyền thoại rẻ nhất: 11,1 tuần (trong 8–12) — ĐẠT. Không phải chỉnh giá so với đề bài.

**Vòi vào – cống ra.** 250 em, giả định 20 % chăm, 50 % trung bình, 30 % thất thường: 50 × 560 + 125 × 210 + 75 × 40 = **57.250 vàng/tuần** (mức trần, khi ai cũng đổi hết). Trọn bộ 40 món = 64.210 vàng mỗi em (bỏ Huyền thoại: 19.710). Em chăm cả mùa 16 tuần kiếm 8.760 vàng ≈ 14 % cửa hàng ⇒ phải chọn, không ai mua sạch.

## 3. Bảng giá 5 bậc + 40 món

| Bậc | Giá (vàng) | Số món | Em chăm cần: món rẻ nhất → đắt nhất | Ánh sáng |
|---|---|---|---|---|
| Thường | 20–60 | 12 | ngày 3 → ngày 4 | viền xám bạc, không toả |
| Đẹp | 120–250 | 10 | ngày 4 → ngày 6 | viền lục |
| Hiếm | 500–900 | 8 | ngày 9 → ngày 14 | viền lam, toả nhẹ |
| Sử thi | 1.800–3.000 | 5 | ngày 25 → ngày 40 | viền tím, toả, nhịp thở 4 giây |
| Huyền thoại | 6.000–12.000 | 5 | ngày 78 → ngày 153 | vàng kim, ánh chạy chậm 6 giây |

Hai món 10.000 và 12.000 vượt 16 tuần nếu bắt đầu từ 0 — cố ý dành cho em dư trên 90/ngày hoặc có dự trữ sẵn; Boss quyết lại sau khi đo (mục 8). Điều kiện học: "chuỗi N ngày" = chuỗi ngày ĐẠT nhiệm vụ ngày; "ấn thạch sáng" lấy từ Đoàn Hộ Tống.

**Luật đặt tên (thầy lệnh 21/09: "dễ hiểu, thú vị, cuốn hút").** TÊN MÓN ≤ 4 từ, KHÔNG có tên chất, em chưa học bài ấy vẫn hình dung ra ngay. Hoá học là gia vị: mỗi món có MỘT dòng **Bật mí Hoá học** ≤ 14 từ, đúng khoa học, danh pháp 2018 — đây là chỗ duy nhất trên màn dùng tên chất. Tên mở đầu bằng chính thứ em sẽ thấy (Vòng, Thảm · Đuôi, Dấu chân · Khung · Mũ, Nơ, Sừng · Khăn, Áo, Cánh) để đọc tên là đoán được chỗ đeo.

| # | Tên | Chỗ đeo | Bậc | Giá | Cần có · số lượng | Bật mí Hoá học (hiện ở Thử đồ + Tủ đồ) | Mô tả hình cho hoạ sĩ |
|---|---|---|---|---|---|---|---|
| | **ĐỢT 1 — 24 món** | | | | | | |
| 1 | Vòng Sương Mai | Vòng sáng | Thường | 20 | — | Sương là hơi nước gặp lạnh, ngưng tụ thành giọt nhỏ li ti. | Vòng sương trắng mỏng quanh chân thú, ba giọt nước nhỏ. |
| 2 | Thảm Đỏ Xanh | Vòng sáng | Thường | 40 | — | Giấy quỳ tím gặp acid hoá đỏ, gặp base hoá xanh. | Đĩa tròn dưới chân, nửa đỏ nửa xanh, chỗ giáp nhau loang mềm (màu giấy quỳ). |
| 3 | Vòng Lửa Vàng | Vòng sáng | Đẹp | 150 | — | Đốt muối sodium, ngọn lửa chuyển sang màu vàng. | Quầng vàng cam ấm, năm lưỡi lửa nhỏ lay nhẹ. |
| 4 | Thảm Tinh Thể Xanh | Vòng sáng | Đẹp | 220 | — | Tinh thể copper(II) sulfate ngậm nước có màu xanh lam. | Cụm tinh thể xanh lam hình thoi mọc quanh bệ. |
| 5 | Vòng Sáng Neon | Vòng sáng | Hiếm | 600 | — | Khí neon phát sáng đỏ cam khi có dòng điện chạy qua. | Vòng ống sáng đỏ cam kiểu đèn neon, sáng lên rồi dịu xuống rất chậm. |
| 6 | Thảm Kim Cương | Vòng sáng | Hiếm | 850 | — | Kim cương chỉ gồm carbon; mỗi nguyên tử nối bốn nguyên tử khác. | Lưới tứ diện (mạng tinh thể kim cương), các nút lưới loé sáng. |
| 7 | Dải Cực Quang | Vòng sáng | Sử thi | 2.400 | Cần chuỗi 7 ngày | Màu lục của cực quang do nguyên tử oxygen trên cao phát ra. | Dải cực quang lục – tím uốn sau lưng thú. |
| 8 | Vòng Nguyên Tử Vàng | Vòng sáng | Huyền thoại | 9.000 | Cần chuỗi 14 ngày + 5 ấn thạch sáng · chỉ có 20 cái | Electron chuyển động rất nhanh quanh hạt nhân, tạo thành đám mây electron. | Ba vòng quỹ đạo vàng kim xoay chậm quanh thú, một đốm sáng (hạt nhân) sau lưng. |
| 9 | Đuôi Bong Bóng | Đuôi sáng | Thường | 20 | — | Bọt trong nước ngọt có ga là khí carbon dioxide thoát ra. | Chuỗi bong bóng tròn nhỏ dần phía sau. |
| 10 | Dấu Chân Muối | Đuôi sáng | Thường | 30 | — | Hạt muối ăn (sodium chloride) kết tinh thành khối lập phương. | Dấu chân rắc hạt tinh thể lập phương trắng. |
| 11 | Đuôi Giọt Hồng | Đuôi sáng | Thường | 60 | — | Phenolphthalein không màu, gặp dung dịch base thì chuyển hồng. | Giọt hồng rơi, loang thành vòng tròn nhạt. |
| 12 | Đuôi Lửa Tím | Đuôi sáng | Đẹp | 120 | — | Đốt muối potassium, ngọn lửa chuyển sang màu tím. | Đuôi lửa tím hoa cà mảnh, tàn lửa li ti. |
| 13 | Đuôi Lửa Xanh Lục | Đuôi sáng | Đẹp | 200 | — | Đốt muối copper(II), ngọn lửa chuyển sang màu xanh lục. | Đuôi lửa xanh lục, lõi sáng trắng. |
| 14 | Đuôi Pháo Sáng | Đuôi sáng | Hiếm | 700 | — | Magnesium cháy sáng trắng chói, nên được dùng làm pháo sáng. | Tia sáng trắng chói hình sao bắn ra theo bước chân. |
| 15 | Đuôi Sao Băng Đỏ | Đuôi sáng | Sử thi | 2.000 | Cần chuỗi 7 ngày | Muối strontium tạo màu đỏ tươi cho pháo hoa. | Dải đỏ tươi dài kiểu sao băng, đầu dải có đốm sáng. |
| 16 | Đuôi Tia Sét | Đuôi sáng | Huyền thoại | 7.500 | Cần chuỗi 21 ngày · chỉ có 25 cái | Dòng điện trong dây kim loại là dòng electron chuyển động có hướng. | Tia sét lam – vàng kim dọc đường đi, kí hiệu e⁻ mờ dần. |
| 17 | Khung Thuỷ Tinh | Khung tên | Thường | 20 | — | Thuỷ tinh nấu từ cát, thành phần chính là silicon dioxide. | Viền thuỷ tinh bo tròn, hai đầu loe như miệng ống thuỷ tinh phòng thí nghiệm. |
| 18 | Khung Nhãn Lọ | Khung tên | Thường | 40 | — | Hình thoi viền đỏ trên nhãn báo hoá chất nguy hiểm. | Nhãn giấy màu kem như nhãn lọ hoá chất, góc có hình thoi cảnh báo nhỏ. |
| 19 | Khung Ô Nguyên Tố | Khung tên | Thường | 50 | — | Bảng tuần hoàn có 118 nguyên tố, mỗi ô một nguyên tố. | Ô bảng tuần hoàn: kí hiệu ở góc, tên thú ở giữa. |
| 20 | Khung Bạc Sáng | Khung tên | Đẹp | 180 | — | Silver (bạc) dẫn điện tốt nhất trong các kim loại. | Viền bạc chải xước, hai đinh tán. |
| 21 | Khung Lục Giác | Khung tên | Đẹp | 250 | — | Phân tử benzene là một vòng sáu cạnh gồm sáu nguyên tử carbon. | Hai đầu khung là lục giác (vòng benzene), nối bằng nét đôi. |
| 22 | Khung Thạch Anh Tím | Khung tên | Hiếm | 500 | — | Thạch anh tím có màu tím nhờ lẫn một chút iron (sắt). | Viền tinh thể tím cắt giác, ánh sáng trượt trên cạnh. |
| 23 | Khung Đổi Màu | Khung tên | Sử thi | 1.800 | — | Lớp oxide mỏng trên titanium làm ánh sáng giao thoa, tạo nhiều màu. | Kim loại chuyển màu lam – tím – vàng theo góc nhìn. |
| 24 | Khung Vàng 999 | Khung tên | Huyền thoại | 6.000 | Cần chuỗi 14 ngày · chỉ có 30 cái | Vàng 999 chứa 99,9 % gold, để lâu không gỉ. | Khung vàng kim chạm nổi kí hiệu Au, ánh sáng chạy chậm trái sang phải. |
| | **ĐỢT 2 — 16 món (cần bảng điểm đặt theo loài)** | | | | | | |
| 25 | Kính Bảo Hộ | Trên đầu | Thường | 30 | — | Kính bảo hộ che mắt khỏi hoá chất bắn vào khi làm thí nghiệm. | Kính trong viền xanh đeo trên trán. |
| 26 | Mũ Phễu Lọc | Trên đầu | Thường | 60 | — | Phễu và giấy lọc giữ lại chất rắn, cho chất lỏng chảy qua. | Phễu thuỷ tinh úp ngược làm mũ chóp, giấy lọc thò ra. |
| 27 | Nơ Đôi | Trên đầu | Đẹp | 140 | — | Hai vạch song song trong công thức là liên kết đôi, như ở ethylene. | Nơ hai thanh song song kiểu liên kết đôi, hai đầu là quả cầu. |
| 28 | Mũ Bình Sủi Bọt | Trên đầu | Đẹp | 240 | — | Bình cầu đáy tròn giúp dung dịch nóng đều khi đun. | Bình cầu nhỏ đội lệch, bên trong dung dịch xanh lam sủi bọt. |
| 29 | Nguyệt Quế Đồng | Trên đầu | Hiếm | 550 | — | Copper (đồng) để lâu ngoài không khí ẩm sẽ phủ lớp gỉ xanh. | Vòng lá kim loại đỏ cam, vài lá đã lên gỉ xanh. |
| 30 | Sừng Cầu Vồng | Trên đầu | Hiếm | 900 | — | Tinh thể bismuth mọc thành bậc thang vuông, óng ánh bảy màu. | Cặp sừng bậc thang vuông ánh cầu vồng. |
| 31 | Vương Miện Thạch Anh | Trên đầu | Sử thi | 2.600 | Cần chuỗi 7 ngày | Thạch anh trong suốt là silicon dioxide kết tinh, cứng hơn thuỷ tinh. | Vương miện tinh thể trong suốt năm mũi, lõi phát sáng lam. |
| 32 | Vương Miện Bạch Kim | Trên đầu | Huyền thoại | 12.000 | Cần chuỗi 30 ngày + 5 ấn thạch sáng · chỉ có 10 cái | Platinum (bạch kim) không gỉ, còn giúp lọc khí thải ô tô. | Vương miện trắng bạc bảy chóp, đính kim cương ở giữa, toả tia. |
| 33 | Khăn Loang Màu | Trên lưng | Thường | 30 | — | Chấm mực lên giấy lọc rồi nhúng nước, mực tách thành nhiều màu. | Khăn quàng trắng gấp nếp, mép loang nhiều màu (kiểu sắc ký trên giấy lọc). |
| 34 | Vòng Cổ Ngọc Trai | Trên lưng | Thường | 50 | — | Ngọc trai, vỏ sò, đá vôi đều chủ yếu là calcium carbonate. | Chuỗi hạt tròn trắng ngà như ngọc trai (cùng chất với đá vôi). |
| 35 | Áo Nhà Khoa Học | Trên lưng | Đẹp | 160 | — | Áo thí nghiệm màu trắng để dễ thấy vết hoá chất dính vào. | Áo trắng phòng thí nghiệm, dáng ngắn, túi ngực cài ống nhỏ giọt. |
| 36 | Khăn Lửa Trắng | Trên lưng | Đẹp | 250 | — | Magnesium cháy trong không khí tạo bột trắng magnesium oxide. | Khăn choàng trắng sáng, mép là lưỡi lửa trắng xanh. |
| 37 | Cánh Giọt Nước | Trên lưng | Hiếm | 650 | — | Phân tử nước hình chữ V, góc giữa hai liên kết khoảng 104,5°. | Đôi cánh trong, ghép từ các phân tử nước hình chữ V. |
| 38 | Ba Lô Bóng Bay | Trên lưng | Hiếm | 800 | — | Khí helium nhẹ hơn không khí nên kéo bóng bay lên. | Hai bình khí nhỏ đeo lưng, một quả bóng bay nhỏ bay lên. |
| 39 | Cánh Bóng Đêm | Trên lưng | Sử thi | 3.000 | Cần chuỗi 7 ngày | Graphene là lớp carbon dày đúng một nguyên tử, xếp hình lục giác. | Cánh lưới lục giác mỏng đen ánh lam, mép phát sáng. |
| 40 | Áo Choàng Ngân Hà | Trên lưng | Huyền thoại | 10.000 | Cần chuỗi 28 ngày · chỉ có 15 cái | Hydrogen là nguyên tố nhiều nhất vũ trụ, nhiên liệu của các vì sao. | Áo choàng tím than điểm sao, viền vàng kim, sao lấp lánh chậm. |

Đếm: 8 món mỗi chỗ đeo × 5 chỗ đeo; Thường 12 · Đẹp 10 · Hiếm 8 · Sử thi 5 · Huyền thoại 5. "Trên lưng" gồm mọi thứ khoác từ cổ xuống lưng (khăn, vòng cổ, áo, cánh, ba lô); khoá máy chủ vẫn là `co-lung`. Hết mùa 1 (hết học kỳ I) món có số lượng giới hạn ngừng bán, đồ đã mua giữ mãi. Không giảm giá, không đếm ngược, không mở bán chớp nhoáng.

## 4. Trải nghiệm: 4 màn

Đường vào: nút "Cửa hàng" cạnh Túi đồ trong Đảo thần thú, và thẻ thần thú ở Bảng nhiệm vụ. Mọi câu chữ dưới đây lấy từ kho câu chữ mục 9 (số trong ngoặc vuông); giọng: câu ngắn, động từ trước, nói thật, mỗi màn tối đa một dấu chấm than.

**Lần đầu mở.** Một tấm chào, hiện đúng một lần [C1–C4]: "Chào em tới Cửa hàng." · "EXP thừa đổi thành vàng. Vàng mua đồ cho thần thú." · "Phụ kiện chỉ để đẹp, không làm thần thú mạnh hơn." · "Vàng chỉ đến từ việc học. Không nạp tiền, không xin bạn được." Nút "Xem Cửa hàng".

**Cửa hàng.** Tiêu đề "Cửa hàng", dòng phụ "Sắm đồ cho thần thú · Mùa 1, tới hết học kỳ I". Trên cùng là ví: "Vàng của em · 340 vàng", dòng phụ dùng đúng chữ app đang có: "Ống nghiệm có 620 EXP · Dự trữ đủ 3 ngày ăn". Dưới là khối **"Đổi vàng"** ("EXP thừa trong ống nghiệm đổi được thành vàng."): thanh kéo, dòng "Em đổi · 180 EXP thành 180 vàng", hai dòng "Trước khi đổi · 620 EXP · đủ 3 ngày ăn" và "Sau khi đổi · 440 EXP · đủ 2 ngày ăn", ghi chú "1 EXP thừa = 1 vàng. Thần thú luôn giữ lại 200 EXP, đủ ăn 1 ngày.", nút "Đổi 180 EXP lấy 180 vàng". Thanh lọc theo **chỗ đeo**: Tất cả · Vòng sáng · Đuôi sáng · Khung tên · Trên đầu, Trên lưng ghi "Sắp mở". Dòng chú giải năm bậc mở đầu bằng chữ "Đắt dần:" để em không chơi game vẫn hiểu thứ tự. Lưới 2 cột thẻ món: hình trên nền đêm, bậc, tên, "Chỗ đeo: Vòng sáng", "Giá 600 vàng", dòng khoá nói rõ em đang ở đâu ("Cần chuỗi 14 ngày (em đang chuỗi 9 ngày)"), số lượng nói thật ("Chỉ còn 12 cái"; chưa ai mua thì "Mùa 1 chỉ có 25 cái"). Thẻ 2 cột ở 360 px CHẬT nên dòng Bật mí Hoá học không nằm trên thẻ. Chạm thẻ = thử.

**Xác nhận đổi vàng.** Hai câu, nói thật cái giá, không doạ [X1]: "Thần thú bớt 180 EXP dự trữ, vẫn đủ 2 ngày ăn. Em nhận 180 vàng, đổi rồi không đổi ngược lại được." Hai nút "Để sau" và "Đổi 180 EXP". Xong [M3]: "Đã đổi xong. Em có 520 vàng, thần thú vẫn đủ 2 ngày ăn."

**Thử đồ.** Tiêu đề "Thử đồ", dòng phụ "Thử thoải mái, không mất vàng". Thần thú CỦA EM đứng trên bệ sáng (sân khấu luôn là đêm, kể cả giao diện sáng), mặc ngay món vừa chạm, chuyển lớp 220 ms. Mỗi chỗ đeo thử một món; nhãn sân khấu "Đang thử 3 phụ kiện". Dòng tự hào, nói thật [T2]: "Cả đoàn sẽ thấy thần thú của em y như thế này. Bảng vinh danh cũng vậy." Danh sách "Em đang thử · chạm một món để xem kỹ" ghi trạng thái từng món bằng đúng bảng từ chuẩn: "Đủ vàng rồi" · "Chưa đủ vàng — còn thiếu 260 vàng" · "Cần chuỗi 14 ngày" · "Đã có" · "Đang mặc". Khung chi tiết: bậc · chỗ đeo, tên, một câu tả, hộp **Bật mí Hoá học**, các dòng "Giá" · "Vàng của em" · "Cần có" · "Số lượng". Nút chính "Mua · 120 vàng". Thiếu vàng thì thay bằng lời chỉ đường + nút "Đổi vàng": em có đủ EXP thừa ⇒ [D1] "Em có đủ EXP thừa. Đổi vàng là mua được."; chưa đủ ⇒ [D2] "Học đều khoảng 13 ngày nữa là đủ vàng." Còn khoá ⇒ [D3] "Giữ chuỗi thêm 5 ngày nữa là mở." Nút phụ "Bỏ thử món này".

**Xác nhận mua.** Tấm phủ một bước [X2]: "Em trả 120 vàng, còn lại 220 vàng. Mua rồi giữ mãi, không trả lại hay bán lại được." Hai nút "Để sau" và "Mua · 120 vàng". Thành công: số vàng chạy xuống 300 ms, rung nhẹ 18 ms, món tự mặc, lời mừng ngắn [M1] "Hợp quá! Đuôi Lửa Tím đã là của em. Em còn 220 vàng." rồi một câu chỉ món kế [M2] "Em vẫn đủ vàng cho Vòng Lửa Vàng, giá 150 vàng." (không còn món nào vừa số vàng thì dùng [D2] cho món rẻ nhất chưa có). Số mới là số máy chủ trả.

**Tủ đồ.** Tiêu đề "Tủ đồ", dòng phụ "Đồ em đã mua, giữ mãi". Năm chỗ đeo, mỗi chỗ liệt kê món đã có; chạm để "Mặc" hoặc "Cởi ra"; món đang trên người thú ghi "Đang mặc"; chạm tên món hiện lại dòng Bật mí Hoá học. Chỗ chưa có món: "Chưa có món nào cho chỗ này." Trống cả tủ: "Tủ đồ còn trống. Ghé Cửa hàng chọn món đầu tiên, có món chỉ 20 vàng." + nút "Tới Cửa hàng".

**Trạng thái chung.** Đang tải: khung xám giữ chỗ đúng kích thước. Lỗi: lời máy chủ + nút "Thử lại". Mất mạng: "Mất mạng rồi. Có mạng lại mới mua được, em vẫn xem được Tủ đồ." (Tủ đồ của lần tải trước). Dưới 200 EXP: khối đổi ghi "Chưa có EXP thừa. Thần thú cần giữ 200 EXP để ăn." + "Làm nhiệm vụ hôm nay để ống nghiệm đầy thêm." Cờ tắt: ẩn cả hai đường vào, thú vẫn mặc đồ đã có.

**Cách tính lời chỉ đường [D2]** (chỉ là chữ, KHÔNG thêm trường máy chủ): số ngày = làm tròn lên của (vàng còn thiếu − EXP thừa đang đổi được) ÷ 80, với 80 = mức dư mỗi ngày của em học đủ (mục 2); luôn kèm chữ "khoảng". Tính từ các số máy chủ đã trả (`vang`, `doiToiDa`, `gia`), không phải số dư tự tính. Boss đổi hằng số 80 sau khi đo A0; muốn đúng theo từng em thì để máy chủ trả sẵn câu này ở đợt sau.

## 5. Hợp đồng máy chủ

**Bảng D1 (migration chỉ-thêm).**
- `vang_so(id INTEGER PK, sbd, loai CHECK IN('doi','mua','hoan'), so_vang INTEGER, exp_tru INTEGER, ma_mon, khoa_yeu_cau, luc, UNIQUE(sbd,khoa_yeu_cau))` + chỉ mục `(sbd)`. Chỉ INSERT. Số dư = `SUM(so_vang)`. `hoan` chỉ dành cho Boss sửa lỗi máy chủ, học sinh không có lệnh hoàn.
- `phu_kien_so_huu(sbd, ma_mon, mua, gia, khoa_yeu_cau, luc, PK(sbd,ma_mon))` + chỉ mục `(ma_mon,mua)` để đếm số cái đã bán.
- `phu_kien_dang_mac(sbd, o_gan, ma_mon, luc, PK(sbd,o_gan))`.

**Danh mục món để TRONG MÃ**, không để bảng: `src/lib/phu-kien-danh-muc.ts` (hằng `DANH_MUC_PHU_KIEN`, `PHIEN_BAN = 'm1-v1'`, mỗi món có `moBan`), máy chủ và giao diện cùng nhập. Lý do: 40 món đổi theo mùa chứ không theo ngày; giá đi qua soát commit và test khoá; không cần màn quản trị; máy chủ vẫn là nơi quyết giá. Tệp không được dùng `window`/`localStorage` (kiểm thêm `tsc --noEmit -p server`).

**5 lệnh** dưới `/game-v2/…`, xác thực học sinh như các lệnh hiện có (bỏ khỏi mẫu). Lỗi luôn dạng `{"ok":false,"ma":"…","loi":"<lời tiếng Việt hiện thẳng lên màn>"}`.

1. `vang-xem` — vào `{}` · ra `{"ok":true,"bat":true,"vang":340,"ongNghiem":620,"giuLai":200,"doiToiDa":420,"ngayAn":3,"chuoiNgay":9,"anThachSang":3,"mua":"m1"}`
2. `vang-doi` — vào `{"soExp":180,"khoaYeuCau":"doi-7f3a"}` · ra `{"ok":true,"daDoi":180,"vang":520,"ongNghiem":440,"ngayAn":2,"lapLai":false}` · lỗi `duoi_nguong`: "Thần thú cần giữ lại 200 EXP để ăn. Em đổi được tối đa 420 EXP."
3. `shop-danh-sach` — vào `{}` · ra `{"ok":true,"phienBan":"m1-v1","vang":340,"mon":[{"ma":"KT-08","gia":6000,"daCo":false,"dangMac":false,"moKhoa":false,"thieu":"Cần chuỗi 14 ngày (em đang chuỗi 9 ngày)","suatCon":12,"suatTong":30}]}`
4. `shop-mua` — vào `{"maMon":"VD-04","giaThay":120,"khoaYeuCau":"mua-91c2"}` · ra `{"ok":true,"maMon":"VD-04","vang":220,"daMac":true,"lapLai":false}` · lỗi `thieu_vang` "Chưa đủ vàng — còn thiếu 260 vàng." · `chua_mo` · `het_suat` "Món này đã hết. Mùa 1 chỉ có 30 cái." · `da_co` · `gia_doi` "Giá vừa thay đổi, em xem lại rồi mua nhé." · `tam_dong` "Cửa hàng đang tạm đóng."
5. `thu-mac-do` — vào `{"oGan":"vet","maMon":"VD-04"}` (`maMon:null` = cởi) · ra `{"ok":true,"dangMac":{"hao-quang":null,"vet":"VD-04","khung":"KT-03","dau":null,"co-lung":null}}` · lỗi `chua_co`.

**Bấm lặp không ghi hai lần.** `khoaYeuCau` do máy em sinh một lần cho mỗi lần bấm; gọi lại cùng khoá ⇒ trả đúng kết quả cũ, `lapLai:true`, không ghi thêm.

**Nguyên tử.** Ống nghiệm là `wallet` trong `game_v2_profile.json` (khoá lạc quan `revision`). `vang-doi` = MỘT `DB.batch`: (a) `UPDATE game_v2_profile SET json=?,revision=revision+1 WHERE sbd=? AND revision=? AND NOT EXISTS(khoá đã có trong vang_so)`; (b) `INSERT OR IGNORE INTO vang_so … SELECT … WHERE EXISTS(hồ sơ đang ở revision+1)`. Hai dòng cùng đổi hoặc cùng không; không đổi ⇒ đọc lại, thử tối đa 3 lần. `exp_tru` ghi ngay trên dòng `vang_so`, không ghi vào `exp_so`. `shop-mua` = MỘT batch: (a) `INSERT OR IGNORE INTO phu_kien_so_huu … SELECT … WHERE SUM(vang_so) >= giá AND COUNT(số cái đã bán) < giới hạn`; (b) `INSERT OR IGNORE INTO vang_so(−giá) … WHERE EXISTS(dòng sở hữu mang đúng khoá)`. Điều kiện học đọc bằng đúng nguồn đang hiện cho em: `chuoiDat` của kế hoạch ngày và `anChoSanh` (`game-v2-doan-an.ts`).

**Bạn bè nhìn thấy.** Thêm trường chỉ-thêm `phuKien:{<chỗ đeo>:<mã món>}` vào thẻ thần thú Bảng nhiệm vụ, sảnh + trận Đoàn, Bảng vinh danh. Đọc cho cả đoàn bằng một truy vấn `WHERE sbd IN (SELECT value FROM json_each(?))` — D1 giới hạn 100 tham số bind và 5 vế mỗi UNION. App thầy: một lệnh `/gv/*` chỉ đọc trả "số em đã mua phụ kiện".

**Reset + cờ.** Thêm ba bảng vào `BANG_GIU` của `server/src/reset-toan-app.ts` + test phân loại (vàng và đồ là tài sản em đã kiếm; `game_v2_profile` bị xoá không ảnh hưởng vì EXP đã trừ xong). Cờ `cau_hinh.shop_phu_kien = {"bat":true,"chiSbd":[…]}`: vắng hoặc `bat:false` ⇒ bốn lệnh ghi/xem shop trả `tam_dong`, `phuKien` vẫn trả để đồ đã mua không biến mất.

## 6. Mỹ thuật

- **Quy cách.** Lớp phủ trên thú: SVG `viewBox 0 0 256 256`; đuôi sáng `0 0 256 96`; khung tên làm bằng CSS + token, không cần tệp hình. Mỗi tệp ≤ 6 KB sau SVGO, ≤ 40 nút; không `<image>`, không chữ; bậc Thường–Hiếm không dùng `<filter>`. Màu qua biến `--pk-1…--pk-3` khai ở tệp token của game, không hex trong TSX. Không vẽ lại sprite thú.
- **5 điểm đặt đồ** (trong mã gọi là `neo`) mỗi loài × giai đoạn (`src/game/than-thu-v2/phu-kien-neo.ts`): `dau` (đỉnh đầu), `co` (gáy), `lung` (giữa lưng), `chan` (điểm chạm đất — vòng sáng và đuôi sáng), `ten` (dưới chân — khung tên). Mỗi điểm `{x, y}` theo tỉ lệ 0–1 của khung sprite, kèm `goc`, `tiLe`, `truocSau`. Đợt 1 chỉ dùng `chan`, `ten` = tâm đáy khung nên CHƯA cần bảng theo loài.
- **Ánh sáng theo bậc** như bảng mục 3; ánh chạy làm bằng `transform` (không `background-position`); tối đa 3 chuyển động cùng lúc trên một thú; trong trận Đoàn (nhiều thú) vẽ bản TĨNH; thẻ món không dùng `backdrop-filter`; "giảm chuyển động" ⇒ tĩnh hết.
- **Dung lượng.** Gói mã shop ≤ 60 KB gzip, nạp lười; hình nạp khi thẻ vào khung nhìn; tổng hình đợt 1 ≤ 120 KB, đợt 2 ≤ 100 KB.

## 7. Kế hoạch build 3 làn

**Làn A · máy chủ (Code 3).** A0 lệnh chỉ đọc đo p50/p90/cao nhất ống nghiệm ⇒ Boss khoá giá. A1 migration 3 bảng + `BANG_GIU` + test phân loại + cờ mặc định TẮT. A2 danh mục + `vang-xem`, `vang-doi` + test bấm đúp/đua. A3 `shop-danh-sach`, `shop-mua`, `thu-mac-do` + test hết hàng khi hai em cùng mua cái cuối. A4 trường `phuKien` ở ba nơi + dòng thống kê cho thầy. A5 đẩy Worker, gọi thử MỌI lệnh bị chạm trên D1 thật, bật `chiSbd` cho một em thử rồi mới toàn bộ.

**Làn B · giao diện game học sinh (Code 2).** B1 token 5 bậc + khung 4 màn chạy dữ liệu giả đúng hợp đồng mục 5 (không chờ máy chủ). B2 Cửa hàng + ví + khối Đổi vàng. B3 Thử đồ + Xác nhận mua + Tủ đồ, đủ 5 trạng thái; CHỮ chép đúng kho câu chữ mục 9, không tự đặt chữ mới. B4 thành phần vẽ thú kèm phụ kiện, gắn vào Bảng nhiệm vụ, Đảo, Đoàn, Bảng vinh danh. B5 nối lệnh thật — **CẦN A5 đã sống** — chụp 360/390 sáng + tối. B6 đẩy Pages từ worktree sạch.

**Làn C · mỹ thuật SVG + bảng điểm đặt (Code 4 hoặc Code 1).** C1 quy cách + 3 món mẫu mỗi chỗ đeo, Boss duyệt nét. C2 đủ 24 món đợt 1. C3 bảng điểm đặt 8 loài × giai đoạn + trang soi điểm đặt. C4 16 món đợt 2. C5 đo dung lượng và khung hình trên Android 360.

**Thứ tự lên sóng** (luật: máy chủ TRƯỚC, giao diện sau). Đợt 1: A5 → B6, cần C2. Đợt 2: Worker bật `moBan` cho 16 món → Pages, cần C3 + C4. A0–A4, B1–B4, C1–C2 chạy song song ngay.

## 8. Rủi ro + cờ tắt nhanh

- **Số dư lớn sau chuyển đổi 21/09.** Nhiều em đang có sẵn ống nghiệm lớn ⇒ tuần đầu có thể mua sạch bậc Thường–Hiếm. Vì vậy A0 đo thật trước khi khoá giá; nếu p90 trên 3.000, Boss chọn nâng giá ba bậc giữa hoặc chỉ cho đổi EXP kiếm SAU ngày mở cửa hàng. Huyền thoại luôn kèm điều kiện học + số lượng giới hạn nên không bị mua ngay.
- **Em đổi hết rồi thú đói.** Đã chặn bằng mức giữ 200 EXP và dòng "Dự trữ còn N ngày ăn".
- **Hai món đỉnh không ai tới.** Cuối mùa Boss xem số đã bán; mùa 2 đổi giới hạn, không giảm giá giữa mùa.
- **So bì, xin xỏ.** Không tặng, không chuyển vàng, không bảng xếp hạng vàng.
- **Lệch sổ.** Số dư chỉ là tổng sổ; mọi ghi trong batch nguyên tử; máy em không lưu số dư, không tự trừ.
- **Rà cấm.** 0 cơ chế ngẫu nhiên trả thưởng · 0 chỗ phụ kiện cộng chỉ số, EXP, vé hay thứ hạng · 0 chỗ máy em tự tính số dư.
- **Cờ tắt** `cau_hinh.shop_phu_kien`: đặt `{"bat":false}` ⇒ đóng cửa hàng trong một lượt tải, không cần đẩy mã; vàng và đồ đã mua còn nguyên.

## 9. Bảng từ chuẩn + kho câu chữ của shop

Thầy duyệt bản thiết kế 21/09 kèm lệnh "đặt lại ngôn ngữ dễ hiểu, thú vị, cuốn hút". Mục này là NGUỒN DUY NHẤT cho chữ của shop: phiên giao diện chép đúng từng chuỗi, không tự đặt chữ mới; thiếu thì đề nghị Boss bổ sung vào đây (và vào bảng A2 của `docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md`). Luật, con số, tên lệnh, khoá JSON KHÔNG đổi.

### 9.1. Sáu luật giọng văn
1. Người đọc 15–18 tuổi, đọc trên điện thoại, lướt nhanh: câu ≤ 12 từ, động từ trước, xưng "em", gọi "thần thú" hoặc biệt danh của thú.
2. Dễ hiểu trước, Hoá học là gia vị: tên món không có tên chất; tên chất chỉ nằm ở dòng Bật mí Hoá học.
3. Một khái niệm một từ (bảng 9.2). Mọi con số có nhãn: "120 vàng", "đủ 3 ngày ăn", "chuỗi 9 ngày".
4. Cuốn hút bằng SỰ THẬT: khơi tò mò, tự hào ("Cả đoàn sẽ thấy…"), chỉ đường tới món kế, mừng ngắn gọn.
5. CẤM: đếm ngược ép mua, "sắp hết!!!", so sánh hạ thấp bạn khác, chữ gợi cờ bạc (quay, rương, may mắn, trúng), giọng quảng cáo. Mỗi màn tối đa MỘT dấu chấm than.
6. Không mã nội bộ, không tiếng Anh trên màn — trừ EXP và tên chất ở dòng Bật mí.

### 9.2. Bảng từ chuẩn của shop
| Khái niệm | TỪ CHUẨN | Không dùng |
|---|---|---|
| Tiền trong shop | **vàng** — viết thường, luôn đi sau con số ("120 vàng"); nhãn ví: "Vàng của em" | xu, tiền, điểm vàng, đồng vàng, gold, coin |
| Nơi mua | **Cửa hàng** | shop, tiệm, chợ, quầy |
| Nơi giữ đồ đã mua | **Tủ đồ** | kho đồ, hành trang, túi (Túi đồ là của Đảo thần thú, đựng vật phẩm game — thứ khác) |
| Một món trang trí | **phụ kiện** — gọi tắt "món" | trang bị, vật phẩm, đồ hiếm, skin, item |
| Mặc thử trước khi mua | **Thử đồ** · trạng thái "Đang thử" | xem trước, ướm, preview |
| Việc biến EXP thừa thành vàng | **Đổi vàng** · nút "Đổi 180 EXP lấy 180 vàng" | quy đổi, rút, nạp, chuyển, bán EXP |
| Phần EXP được phép đổi | **EXP thừa** = phần ống nghiệm trên 200 EXP | EXP dư, EXP rảnh, EXP lẻ |
| Nơi chứa EXP chưa nạp | **ống nghiệm** — GIỮ: app học sinh đang dùng đúng từ này ("Ống nghiệm có 620 EXP" ở thẻ cho ăn, Đảo của em, thành phần `OngNghiemExp`). Vì thế món #17 KHÔNG tên "Khung Ống nghiệm" nữa (một từ không mang hai nghĩa) ⇒ "Khung Thuỷ Tinh" | kho EXP, ví EXP, bình EXP |
| EXP để dành cho thần thú ăn | **dự trữ** · "Dự trữ đủ 3 ngày ăn" (đúng chữ app đang có) | quỹ, tồn, số dư EXP |
| Vị trí món nằm trên thú | **Chỗ đeo** — 5 chỗ: **Vòng sáng · Đuôi sáng · Khung tên · Trên đầu · Trên lưng** | ô gắn, ô, slot, neo, hào quang, vệt di chuyển, cổ/lưng |
| Cho thú mang món | **mặc** · **cởi ra** · trạng thái "Đang mặc" (chữ "đeo" chỉ có trong cụm "Chỗ đeo") | trang bị, gắn, lắp, tháo, dùng |
| Năm mức giá | **bậc**: **Thường · Đẹp · Hiếm · Sử thi · Huyền thoại**, chú giải luôn mở bằng "Đắt dần:" | độ hiếm, cấp, hạng, sao, phẩm chất |
| Điều kiện học để mua | **Cần có** · dạng ngắn "Cần chuỗi 14 ngày" | điều kiện mở, mở khoá, yêu cầu, đạt mốc |
| Món có số lượng giới hạn | **Chỉ còn N cái** · chưa ai mua: "Mùa 1 chỉ có N cái" · hết: "Đã hết" | suất, lượt, giới hạn, số lượng có hạn, sắp hết |
| Dòng kiến thức của món | **Bật mí Hoá học** | bạn có biết, mẹo, fun fact, kiến thức |
| Khoảng thời gian bán | **Mùa 1** (tới hết học kỳ I) | đợt bán, season ("đợt 1 / đợt 2" là chữ nội bộ của kế hoạch build; trên màn chỉ ghi "Sắp mở") |

**Vì sao GIỮ năm tên bậc Thường · Đẹp · Hiếm · Sử thi · Huyền thoại.** (1) Học sinh chơi game đã thuộc thang này cùng bộ màu xám → lục → lam → tím → vàng kim, không phải học lại. (2) Thang "vui" kiểu kim loại (Đồng · Bạc · Vàng · Bạch kim · Kim cương) rõ thứ tự hơn nhưng ĐỤNG từ: "Vàng" đã là tiền của shop, và "Khung Bạc Sáng", "Thảm Kim Cương", "Vương Miện Bạch Kim" là tên món — một từ hai nghĩa. (3) Chỗ còn mơ hồ với em không chơi game (Sử thi hay Huyền thoại đắt hơn?) được chữa bằng chữ "Đắt dần:" ở chú giải và bằng chính giá ghi trên thẻ.

**Bảy trạng thái của một món** (đúng từng chữ): Đang thử · Đủ vàng rồi · Chưa đủ vàng — còn thiếu N vàng · Cần chuỗi N ngày (kèm "+ 5 ấn thạch sáng" nếu có) · Chỉ còn N cái · Đã có · Đang mặc.

### 9.3. Kho câu chữ (58 chuỗi; `{…}` là số hoặc tên do máy chủ trả)
**Tiêu đề màn + nhãn**
- [N1] Cửa hàng — dòng phụ: Sắm đồ cho thần thú · Mùa 1, tới hết học kỳ I
- [N2] Thử đồ — dòng phụ: Thử thoải mái, không mất vàng
- [N3] Tủ đồ — dòng phụ: Đồ em đã mua, giữ mãi
- [N4] Vàng của em · {340} vàng
- [N5] Ống nghiệm có {620} EXP · Dự trữ đủ {3} ngày ăn
- [N6] Đổi vàng — dòng phụ: EXP thừa trong ống nghiệm đổi được thành vàng.
- [N7] 1 EXP thừa = 1 vàng. Thần thú luôn giữ lại 200 EXP, đủ ăn 1 ngày.
- [N8] Trước khi đổi · {620} EXP · đủ {3} ngày ăn — Sau khi đổi · {440} EXP · đủ {2} ngày ăn
- [N9] Đắt dần: Thường · Đẹp · Hiếm · Sử thi · Huyền thoại
- [N10] Chỗ đeo: {Vòng sáng} · Giá {600} vàng · Cần có · Số lượng · Bật mí Hoá học
- [N11] Em đang thử · chạm một món để xem kỹ
- [N12] Đang thử {3} phụ kiện — khi không thử gì: Đồ thần thú đang mặc

**Nút (động từ + kết quả)**
- [B1] Đổi {180} EXP lấy {180} vàng — trong hộp xác nhận: Đổi {180} EXP
- [B2] Mua · {120} vàng
- [B3] Để sau
- [B4] Mặc ngay · Cởi ra
- [B5] Đổi vàng (nút phụ khi chưa đủ vàng — đưa em tới khối Đổi vàng)
- [B6] Bỏ thử món này
- [B7] Tới Cửa hàng · Xem Cửa hàng · Tủ đồ
- [B8] Thử lại
- [B9] Kéo thanh để chọn số EXP (nút mờ khi thanh ở 0) · Chưa có EXP thừa để đổi (nút mờ khi ống nghiệm ≤ 200 EXP)

**Lần đầu mở Cửa hàng (hiện một lần)**
- [C1] Chào em tới Cửa hàng.
- [C2] EXP thừa đổi thành vàng. Vàng mua đồ cho thần thú.
- [C3] Phụ kiện chỉ để đẹp, không làm thần thú mạnh hơn.
- [C4] Vàng chỉ đến từ việc học. Không nạp tiền, không xin bạn được.

**Tự hào + tò mò (nói thật)**
- [T1] Thử thoải mái, không mất vàng.
- [T2] Cả đoàn sẽ thấy thần thú của em y như thế này. Bảng vinh danh cũng vậy.
- [T3] Thần thú đang mặc món này.
- [T4] Mỗi món có một Bật mí Hoá học. Thử đồ là đọc được.

**Hộp xác nhận (hành động không hoàn tác — nói thật cái giá, không doạ)**
- [X1] Đổi vàng: Thần thú bớt {180} EXP dự trữ, vẫn đủ {2} ngày ăn. Em nhận {180} vàng, đổi rồi không đổi ngược lại được.
- [X2] Mua: Em trả {120} vàng, còn lại {220} vàng. Mua rồi giữ mãi, không trả lại hay bán lại được.

**Mừng sau khi xong (ngắn, một dấu chấm than là hết)**
- [M1] Hợp quá! {Đuôi Lửa Tím} đã là của em. Em còn {220} vàng.
- [M2] Em vẫn đủ vàng cho {Vòng Lửa Vàng}, giá {150} vàng.
- [M3] Đã đổi xong. Em có {520} vàng, thần thú vẫn đủ {2} ngày ăn.
- [M4] Đã mặc {Khung Ô Nguyên Tố}. — Đã cởi {Khung Ô Nguyên Tố}.

**Chỉ đường tới món kế (không ép, không đếm ngược)**
- [D1] Em có đủ EXP thừa. Đổi vàng là mua được.
- [D2] Học đều khoảng {13} ngày nữa là đủ vàng. (cách tính: cuối mục 4)
- [D3] Giữ chuỗi thêm {5} ngày nữa là mở.
- [D4] Kiếm thêm {2} ấn thạch sáng ở Đoàn Hộ Tống là mở.
- [D5] Làm nhiệm vụ hôm nay để ống nghiệm đầy thêm.

**Trạng thái của món** — đúng bảy chuỗi ở 9.2, thêm dạng dài của khoá:
- [S1] Cần chuỗi {14} ngày (em đang chuỗi {9} ngày)
- [S2] Cần {5} ấn thạch sáng (em đang có {3} ấn thạch)
- [S3] Chỉ còn {12} cái · mùa 1 có {30} cái — chưa ai mua: Mùa 1 chỉ có {25} cái
- [S4] Chưa mua được — cần chuỗi {14} ngày (em đang chuỗi {9} ngày)

**Trống**
- [R1] Tủ đồ còn trống. Ghé Cửa hàng chọn món đầu tiên, có món chỉ 20 vàng.
- [R2] Chưa có món nào cho chỗ này.
- [R3] Em chưa thử món nào. Chạm một phụ kiện ở Cửa hàng, thần thú mặc thử liền.
- [R4] Chưa có EXP thừa. Thần thú cần giữ 200 EXP để ăn.

**Lỗi bằng lời (lời máy chủ trả ở trường `loi`, mã lỗi giữ nguyên như mục 5)**
- [L1] `duoi_nguong`: Thần thú cần giữ lại 200 EXP để ăn. Em đổi được tối đa {420} EXP.
- [L2] `thieu_vang`: Chưa đủ vàng — còn thiếu {260} vàng.
- [L3] `chua_mo`: Món này cần chuỗi {14} ngày. Em đang chuỗi {9} ngày.
- [L4] `het_suat`: Món này đã hết. Mùa 1 chỉ có {30} cái.
- [L5] `da_co`: Em đã có món này rồi. Vào Tủ đồ để mặc.
- [L6] `gia_doi`: Giá vừa thay đổi, em xem lại rồi mua nhé.
- [L7] `tam_dong`: Cửa hàng đang tạm đóng. Đồ em đã mua vẫn còn nguyên.
- [L8] `chua_co`: Em chưa có món này nên chưa mặc được.
- [L9] Mất mạng: Mất mạng rồi. Có mạng lại mới mua được, em vẫn xem được Tủ đồ.
- [L10] Lỗi không rõ: Cửa hàng chưa tải được. Em bấm Thử lại nhé.
