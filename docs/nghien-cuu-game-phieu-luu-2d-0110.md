# NGHIÊN CỨU GAME PHIÊU LƯU 2D → ĐỀ XUẤT "MỖI ẢI = MỘT CÂU" CHO BÁT LINH

*Bản 01/10/2026 · chỉ đọc repo, không sửa mã · viết cho thầy Đỗ Đại Học*
*Đầu vào: `GDD-BAT-LINH-0110.md`, `DAC-TA-BAT-LINH-0110.md`, mã `src/game/than-thu-v2/dao2/`, `doan2/`, `origin/main:src/game/bi-a/`.*

---

## 0. Phạm vi nguồn (đọc trước)

- **Tìm web:** 37 lượt WebSearch ngày **01/10/2026**. Em chỉ đọc được **trích đoạn kết quả tìm kiếm**, chưa đọc toàn văn trang nào.
- **WebFetch bị chặn:** thử `threadreaderapp.com` (chuỗi bài của Maddy Thorson về Celeste) thì proxy trả `EGRESS_BLOCKED`. GDD cũng ghi `nature.com` và `mobilegamer.biz` bị chặn. Vì vậy "theo nguồn X" trong tài liệu này nghĩa là **theo trích đoạn của X**.
- **Con số doanh số/giải thưởng:** chỉ ghi khi trích đoạn nêu rõ. Game nào trích đoạn không có số thì ghi "không có số trong trích đoạn". Số lấy từ diễn đàn hoặc trang ước lượng thì ghi "cảnh giác".
- **Nhận xét về âm thanh, nhịp hoạt ảnh, cảm giác điều khiển** không có nguồn trích thì là **phân tích của người viết**, ghi ký hiệu *(pt)*. Đây là nhận định thiết kế, không phải số liệu.
- **Hoá:** mọi ví dụ tự kiểm số. Thể tích khí ở đkc **24,79 L/mol**. Nguyên tử khối: H 1, C 12, O 16, Br 80, Cu 64, Ag 108.
- **Repo:** đọc đầu tệp `dao2/TrongAi.tsx`, `dao2/BanDo.tsx`, `doan2/Canh2.tsx`, `dao2-core.ts`, `bi-a/vat-ly.ts`, `bi-a/am-thanh.ts` (origin/main), danh sách `public/than-thu-v2/`. Ghi nhận: Đảo và Hộ Tống hiện vẽ bằng **SVG/CSS** (`Canh2.tsx`: "Tranh vẽ bằng SVG tĩnh trong mã"); Bi-a vẽ bằng **canvas 2D** với **vật lý tất định** bước 1/240 giây; âm thanh tổng hợp **Web Audio**, không tệp; `package.json` **chưa có PixiJS**, chỉ có `three`. Ảnh `public/than-thu-v2/combat/*.png` và `spells/*.png` mỗi tấm **2,2–2,8 MB**, chưa chuyển webp.

---

## 1. Danh sách 25 game và tiêu chí chọn

### 1.1 Tiêu chí

| # | Tiêu chí | Cách áp |
|---|---|---|
| C1 | **Lối chơi 2D** (cuộn ngang, nhìn từ trên, hoặc 2,5D nhưng điều khiển trên mặt phẳng) | 2,5D ghi rõ |
| C2 | **Nổi tiếng có bằng chứng**: số bán/tải, giải lớn, hoặc vị trí kinh điển được nhiều nguồn nhắc | Ghi số chỉ khi trích đoạn nêu |
| C3 | **Phủ đủ 5 dòng** thầy nêu: platformer, metroidvania, giải đố phiêu lưu, hành động nhìn từ trên, giải đố vật lý | Mỗi dòng ≥ 3 game |
| C4 | **Có bài học chuyển được** sang app học Hoá trên web máy yếu | Game chỉ có cái hay là phản xạ khó thì xếp thấp |

### 1.2 Bảng 25 game

| # | Game (năm) | Dòng | Bằng chứng nổi tiếng (theo trích đoạn) | Nguồn |
|---|---|---|---|---|
| 1 | Super Mario Bros. (1985) / **Super Mario Bros. Wonder** (2023) | Platformer | Wonder: **11,96 triệu bản** (báo cáo quý 3 tài khoá 2024 của Nintendo), 4,3 triệu bản trong 2 tuần, bán nhanh nhất dòng Mario | shacknews.com/article/138621; gamedeveloper.com (4.3 million) |
| 2 | **Hollow Knight** (2017) / **Silksong** (04/09/2025) | Metroidvania | HK: **15 triệu bản**. Silksong **đã phát hành 04/09/2025** trên PC, Switch, Switch 2, PS4/5, Xbox (Wikipedia, GamesRadar). Silksong "hơn 7 triệu bản trong 3 tháng" chỉ thấy ở diễn đàn ResetEra → **cảnh giác** | vgchartz.com/article/465558; gamesradar.com (Silksong release); en.wikipedia.org/wiki/Hollow_Knight:_Silksong |
| 3 | **Celeste** (2018) | Platformer chính xác | Hơn 500.000 bản đến 21/12/2018; hơn 1 triệu bản cuối 2019 | gamepressure.com; nintendosoup.com |
| 4 | **Ori and the Blind Forest** (2015) / **Will of the Wisps** (2020) | Metroidvania | WotW: The Game Awards 2020 **Chỉ đạo nghệ thuật** và **Nhạc**; Golden Joystick 2020 Xbox Game of the Year | gamesradar.com; en.wikipedia.org/wiki/Ori_and_the_Will_of_the_Wisps |
| 5 | **Rayman Legends** (2013) | Platformer | Không có số bán trong trích đoạn. Kinh điển vì engine UbiArt và màn nhạc | en.wikipedia.org/wiki/Rayman_Legends |
| 6 | **Cuphead** (2017) | Run-and-gun, đấu trùm | **5 triệu bản** trong 2 năm (09/2019); DLC 2 triệu bản | gamedeveloper.com; studiomdhr.com |
| 7 | **Dead Cells** (2018) | Roguelite metroidvania | **Hơn 10 triệu bản** | pcgamer.com |
| 8 | **Terraria** (2011) | Phiêu lưu sinh tồn 2D | **Khoảng 70 triệu bản** (kỷ niệm 15 năm, 05/2026) | gamesradar.com; vgchartz.com/article/467843 |
| 9 | **Limbo** (2010) | Giải đố phiêu lưu | Không có số bán trong trích đoạn. Kinh điển về "thử và chết", điểm lưu dày | gamespot.com (Playdead on Limbo's puzzles); en.wikipedia.org/wiki/Limbo_(video_game) |
| 10 | **Inside** (2016) | Giải đố phiêu lưu (2,5D, chơi trên mặt phẳng) | **4 giải BAFTA 2017**: Thành tựu nghệ thuật, Thiết kế game, Cốt truyện, Tác phẩm gốc | engadget.com; dfi.dk |
| 11 | **Gris** (2018) | Platformer cảm xúc | The Game Awards 2019 **Games for Impact** | catalannews.com; nintendobserver.com |
| 12 | **Shovel Knight** (2014) | Platformer kiểu NES | Không có số bán trong trích đoạn. Bài blog của hãng về bảng màu NES | yachtclubgames.com/blog/breaking-the-nes |
| 13 | **Undertale** (2015) | Nhập vai phiêu lưu | Wikipedia: "ít nhất 5 triệu bản"; số 10–24 triệu từ trang ước lượng → **cảnh giác** | en.wikipedia.org/wiki/Undertale; steampageanalyzer.com |
| 14 | **Zelda: A Link to the Past** (1991) / **Link's Awakening** (2019) | Hành động phiêu lưu nhìn từ trên | Link's Awakening bản Switch: **6,46 triệu bản** (12/2022) | en.wikipedia.org/wiki/The_Legend_of_Zelda:_Link's_Awakening_(2019_video_game) |
| 15 | **Spelunky 2** (2020) | Roguelike platformer | Không có số bán trong trích đoạn. Kinh điển về màn sinh ngẫu nhiên và thử thách ngày | en.wikipedia.org/wiki/Spelunky_2; gamedeveloper.com (Daily Challenge) |
| 16 | **Super Meat Boy** (2010) | Platformer chính xác | Không có số bán trong trích đoạn. Kinh điển về hồi sinh tức thì | en.wikipedia.org/wiki/Super_Meat_Boy; hardcoregaming101.net |
| 17 | **Katana Zero** (2019) | Hành động, mỗi phòng một câu đố | Không có số bán trong trích đoạn | en.wikipedia.org/wiki/Katana_Zero |
| 18 | **Hades** (2020) | Hành động nhìn từ trên, **2,5D isometric** | The Game Awards 2020: **Best Independent Game**, **Best Action**; hơn 1 triệu bản (09/2020, tweet của hãng) | x.com/SupergiantGames; pcgamer.com |
| 19 | **Kingdom Rush** (2011) | Thủ thành 2D | Không có số bán trong trích đoạn. Nổi tiếng nhờ cho dừng để tính | en.wikipedia.org/wiki/Kingdom_Rush; pocketgamer.com |
| 20 | **Angry Birds** (2009) | Giải đố vật lý | Bản gốc **hơn 1,2 tỉ lượt tải**; cả dòng hơn 4 tỉ | techcrunch.com (2012); mobidictum.com |
| 21 | **Cut the Rope** (2010) | Giải đố vật lý | Google Play: **100 triệu+ lượt tải**, 425 màn trong 17 hộp, 3 sao mỗi màn | play.google.com (com.zeptolab.ctr.ads) |
| 22 | **Alto's Adventure / Odyssey** (2015 / 2018) | Chạy vô tận một chạm | Không có số bán trong trích đoạn. Ánh sáng, thời tiết động, Zen Mode | altosodyssey.com/press; en.wikipedia.org/wiki/Alto's_Odyssey |
| 23 | **Monument Valley** (2014) | Giải đố, **2,5D isometric** | **26,1 triệu lượt tải**, doanh thu 14,38 triệu USD (theo trích đoạn tổng hợp) | gamedeveloper.com; mcvuk.com |
| 24 | **Donkey Kong Country** (1994) | Platformer | Không có số bán trong trích đoạn. Kinh điển về dựng 3D trước rồi chuyển thành sprite 2D | en.wikipedia.org/wiki/Donkey_Kong_Country |
| 25 | **Kirby** (từ 1992) | Platformer dễ vào | Không có số bán trong trích đoạn. Triết lý "tử tế với người mới" của Sakurai | nintendolife.com (2023/09); remptongames.com |

**Đã cân nhắc nhưng loại:**

| Game | Bằng chứng | Lý do loại |
|---|---|---|
| Sonic Mania (2017) | Metacritic 86, game Sonic được chấm cao nhất trong 15 năm (Wikipedia) | Cái hay chính là tốc độ phản xạ, trái luật K3 |
| Blasphemous (2019) | Hơn 4 triệu bản đến 09/2025 (baike.baidu trích) | Máu me, hình tôn giáo; không hợp học sinh 15–18 trong app học |
| Stardew Valley (2016) | Hơn 41 triệu bản (12/2024, pocketgamer.biz) | Là game nông trại, phiêu lưu chỉ phụ. Bài học "một ngày có điểm dừng" đã có trong GDD 4.3 |

---

## 2. Phân tích từng game

Mỗi game có bảy mục: **Vòng chơi · Lối chơi · Đồ hoạ · Chuyển động · Âm thanh · Hợp máy yếu và học sinh (1–5) · Không lấy**. Điểm hợp: 5 là rất hợp.

### 2.1 Super Mario Bros. / Mario Wonder
- **Vòng chơi:** chạy sang phải, vượt chướng ngại, tới cột cờ. Màn dài 1–3 phút.
- **Lối chơi:** (1) **Dạy bằng màn, không cần chữ.** World 1-1 cho hố đầu có đáy để thử nhảy xa an toàn, rồi ngay sau là hố giống hệt nhưng thật (gamedeveloper.com, "How Miyamoto built World 1-1"). Nhóm làm 1-1 *sau cùng*, khi đã biết người chơi cần kỹ năng gì. (2) **Bông hoa nói chuyện** của Wonder: mục tiêu số một là "khen hoặc an ủi để giữ động lực" (Tezuka, GDC 2024, theo gamedeveloper.com). Bật tắt được. (3) **Hoa Wonder**: mỗi màn có một khoảnh khắc biến hình bất ngờ *(pt)*.
- **Đồ hoạ:** màu bão hoà, viền rõ, nền 2–3 lớp parallax nhẹ, vật nguy hiểm khác màu với vật thưởng *(pt)*.
- **Chuyển động:** nhân vật nén khi đáp, giãn khi bật; khối "?" nảy lên khi đụng *(pt)*.
- **Âm thanh:** tiếng xu một nốt rất ngắn; nhạc chạy theo nhịp màn *(pt)*.
- **Hợp:** 5. Không cần vật lý nặng.
- **Không lấy:** chết vì rơi hố (ép phản xạ); bộ đếm giờ màn.

### 2.2 Hollow Knight / Silksong
- **Vòng chơi:** khám phá bản đồ nối nhau, mở năng lực, quay lại chỗ cũ đi tiếp.
- **Lối chơi:** (1) Bản đồ mở dần, chỗ bị khoá thấy được từ sớm. (2) Mỗi trùm có kiểu đòn đọc được.
- **Đồ hoạ:** vẽ tay, bảng màu hẹp theo vùng, nhân vật đen trắng nổi trên nền màu *(pt)*.
- **Chuyển động:** đánh trúng thì **quái nháy trắng, cả hai bị đẩy lùi**; trúng đòn thì **nhạc tắt, hành động chậm lại một nhịp, chớp sáng quanh chỗ trúng** (gamedev.net "Hollow Knight Design Critique"). Một bài báo của ĐH Washington (lin22features.pdf) nêu **hit-stop, âm thanh khớp hình và camera** ảnh hưởng mạnh tới cảm giác va chạm.
- **Âm thanh:** đàn dây buồn, mỗi vùng một chủ đề *(pt)*.
- **Hợp:** 3. Hit-stop gần như không tốn gì. Khó và tối, không hợp buổi 15 phút.
- **Không lấy:** độ khó thao tác cao; mất tiền khi chết.

### 2.3 Celeste
- **Vòng chơi:** mỗi màn là một phòng ngắn, chết thì hồi sinh ngay đầu phòng.
- **Lối chơi:** (1) **Tha thứ ẩn** (chuỗi bài của Maddy Thorson, 13/03/2020, đọc qua trích đoạn x.com và gigazine.net): **coyote time** (rời mép vẫn nhảy được thêm một chút); **jump buffering** (bấm nhảy hơi sớm thì game nhảy đúng khung hình chạm đất); **trọng lực giảm một nửa ở đỉnh nhảy** nếu giữ nút; **chỉnh góc** (đụng đầu vào góc thì game đẩy nhẹ sang bên). (2) **Assist Mode**: giảm tốc độ game xuống 50% theo từng nấc 10%, bất tử, bỏ qua chương (celeste.ink; gamedeveloper.com). Theo Thorson, nhóm muốn trao quyền cho người chơi, chấp nhận buông một phần ý đồ thiết kế.
- **Đồ hoạ:** pixel art, mỗi chương một tông màu, hạt bụi tuyết bay nhẹ *(pt)*.
- **Chuyển động:** tóc Madeline đổi màu khi hết lượt lướt (trạng thái hiện thẳng trên nhân vật) *(pt)*.
- **Âm thanh:** nhạc piano và điện tử, có lớp đổi theo chỗ đứng *(pt)*.
- **Hợp:** 4 về triết lý, 1 về thao tác.
- **Không lấy:** độ chính xác khung hình.
- **Lấy:** ý *"khó nhưng muốn em thắng"*, và Assist Mode thành "bùa Trợ giảng" không xấu hổ.

### 2.4 Ori and the Blind Forest / Will of the Wisps
- **Vòng chơi:** metroidvania, cảnh chạy trốn có kịch bản.
- **Đồ hoạ:** **hơn 7.000 hình vẽ tay**; nền là **tranh vẽ sẵn phủ ánh sáng động và hạt**; hơn 90 hình cây khác nhau, **mỗi hình có thể đổi ánh sáng, màu, chuyển động riêng** (Xbox Wire, "The Art of Ori"). Cảm hứng từ Mononoke *(trích đoạn)*.
- **Chuyển động:** nhân vật nhỏ phát sáng, vệt sáng theo sau, cây cỏ lay khi đi qua *(pt)*.
- **Âm thanh:** nhạc Gareth Coker đoạt giải Ivor Novello (nme.com).
- **Hợp:** 4 nếu chỉ lấy **công thức "tranh tĩnh + ánh sáng + hạt"**. Đây là công thức hợp nhất với ảnh do máy vẽ.
- **Không lấy:** số lượng hình (7.000); cảnh chạy trốn ép phản xạ.

### 2.5 Rayman Legends
- **Lối chơi:** (1) **Màn nhạc**: nhảy, đánh khớp với bài nhạc ("Black Betty", "Eye of the Tiger"). (2) **Murfy**: người chơi thứ hai dùng màn cảm ứng *cắt dây, bật cơ quan* giúp người chạy (Wikipedia).
- **Đồ hoạ:** engine **UbiArt** biến tranh vẽ tay 2D thành màn chơi; Legends chiếu sáng nhân vật 2D bằng ánh sáng 3D thời gian thực (Wikipedia; mycplus.com).
- **Chuyển động:** nhân vật làm từ mảnh ghép, uốn bằng xương *(pt)*.
- **Hợp:** 4. Ý **Murfy** rất đáng giá: một người chạm, nhân vật tự chạy. Đó chính là mô hình cho học sinh: **em không điều khiển chân nhân vật, em quyết định ở chỗ quan trọng**.
- **Không lấy:** màn nhạc ép nhịp.

### 2.6 Cuphead
- **Vòng chơi:** đấu trùm nhiều pha, thua thì thấy thanh tiến độ.
- **Đồ hoạ:** hoạt hình 1930, nền màu nước vẽ tay (unity.com).
- **Chuyển động:** **hoạt ảnh 24 hình/giây** như phim 1930, game chạy **60 hình/giây** để điều khiển nhạy (unity.com; trích đoạn). Khoảng 50.000 hình vẽ tay (gamesradar.com). Bài học: *nhịp hoạt ảnh thấp mà mỗi hình đẹp vẫn mượt, miễn là game phản hồi tức thì*.
- **Âm thanh:** big band, jazz thu thật *(pt)*.
- **Hợp:** 2. Lấy thanh tiến độ khi thua.
- **Không lấy:** độ khó; khối lượng hình vẽ.

### 2.7 Dead Cells
- **Vòng chơi:** chạy một lượt, chết thì mất phần lớn, giữ một ít mở khoá vĩnh viễn.
- **Đồ hoạ:** dựng mô hình **3D**, kết xuất ở độ phân giải thấp **không khử răng cưa**, shader hoạt hình, lưu từng hình PNG kèm normal map. Một người vẽ làm hết suốt một năm (gamedeveloper.com, "Art Design Deep Dive"). Bài học: **sản xuất hình bằng máy để một người làm được**. Bát Linh làm tương tự với ảnh máy vẽ.
- **Chuyển động:** đòn nhanh, rung màn ngắn, số sát thương bay *(pt)*.
- **Hợp:** 3. Lấy "mở khoá vĩnh viễn, mỗi lượt vẫn mới".
- **Không lấy:** chết là mất đồ.

### 2.8 Terraria
- **Vòng chơi:** đào, xây, chế đồ, đánh trùm theo mốc.
- **Lối chơi:** **cây chế tạo**: vật liệu mới mở công thức mới *(pt)*. Khoảng 70 triệu bản (gamesradar.com).
- **Đồ hoạ:** pixel, ô vuông, nền ngày đêm *(pt)*.
- **Hợp:** 2 cho ải, 4 cho ý "Sổ tay": **chất mở chất** (Fe mở FeCl₂…) hợp làm sổ sưu tầm.
- **Không lấy:** thế giới mở rộng, chơi không có điểm dừng.

### 2.9 Limbo
- **Vòng chơi:** đi sang phải, gặp bẫy, chết, hiểu, qua.
- **Lối chơi:** **"thử và chết"**: lần đầu gặp bẫy thường chết, *cái chết là bài học*; **điểm lưu chỉ cách vài giây**, nạp lại gần như tức thì (en.wikipedia; cinematicplatformers.com). Người thiết kế: muốn người chơi "hơi bực", nhưng **lời giải đúng phải dễ thực hiện và rất đã khi ghép xong** (gamespot.com).
- **Đồ hoạ:** **đơn sắc, bóng đen trên nền xám, độ sâu trường ảnh tạo cảm giác hộp diorama nhiều lớp** (trích đoạn).
- **Hợp:** 5 về đồ hoạ: **bóng đen + nền mờ dần = rất rẻ** và che được việc ảnh máy vẽ không đồng đều chi tiết.
- **Không lấy:** chết rùng rợn; nội dung u ám.

### 2.10 Inside
- **Lối chơi:** như Limbo nhưng câu đố gắn liền cảnh, không chữ.
- **Đồ hoạ:** bảng màu lạnh hạn chế, ánh sáng mềm, nhiều lớp sâu *(pt)*. 4 giải BAFTA 2017, có **Thành tựu nghệ thuật** và **Thiết kế game** (engadget.com).
- **Chuyển động:** nhân vật có quán tính thật, ngã, vấp *(pt)*.
- **Hợp:** 3. Lấy "câu đố không cần chữ hướng dẫn".
- **Không lấy:** chủ đề nặng nề.

### 2.11 Gris
- **Vòng chơi:** đi qua 5 chương, mỗi chương **mở một màu**: xám → đỏ → xanh lá → xanh dương → vàng (Wikipedia; trích đoạn). **Màu mới loang ra như màu nước thấm giấy** (thisiscolossal.com).
- **Lối chơi:** gần như không thể thua, tập trung cảm xúc.
- **Hợp:** 5. Đây là **ẩn dụ tốt nhất cho Mê Vụ tan dần**: đảo xám, mỗi bẫy thuần phục thì một mảng màu loang ra. Làm bằng mã: một lớp phủ xám (`saturate`/ma trận màu) có mặt nạ tròn lớn dần.
- **Không lấy:** nhịp chậm không có thử thách (học sinh cần câu).

### 2.12 Shovel Knight
- **Đồ hoạ:** theo bảng màu NES (khoảng 54 màu dùng được) nhưng **phá luật, thêm 5 màu**: màu tối và nhạt để có dải sáng tối mượt, thêm màu da tối cho nhân vật đa dạng (yachtclubgames.com, "Breaking the NES").
- **Bài học:** **bảng màu hẹp, có chủ ý, cho phép phá luật có lý do**. Với ảnh máy vẽ, khoá một bảng 12–16 màu mỗi quần đảo giúp tranh nhất quán.
- **Hợp:** 4.
- **Không lấy:** độ khó NES.

### 2.13 Undertale
- **Vòng chơi:** gặp quái, mỗi lượt chọn **FIGHT / ACT / ITEM / MERCY**; quái nói chuyện, game cho biết cảm xúc và hành động của quái; có thể **tha** khi tên quái chuyển vàng (Wikipedia).
- **Lối chơi:** (1) **Hiểu quái thì không cần đánh.** (2) Lời thoại ngắn, hài.
- **Hợp:** 5 về ý tưởng: **quái bẫy có tính cách, gọi đúng tên bẫy thì "thuần phục"** (đã có trong GDD 6.2).
- **Không lấy:** pha né đạn (bullet hell) ép phản xạ.

### 2.14 Zelda: A Link to the Past / Link's Awakening
- **Vòng chơi:** hầm ngục nhiều phòng; mỗi hầm có **đồ vật chính** trong rương lớn; **Chìa Lớn** mở cửa lớn và rương (zelda.fandom.com); công tắc đổi tường màu, bẫy gai (trích đoạn).
- **Lối chơi:** (1) **Mỗi phòng một câu đố nhỏ.** (2) **Đồ vật là công cụ giải**: có cung thì bắn được mắt; có móc thì qua được hố.
- **Đồ hoạ (Link's Awakening 2019):** **diorama đồ chơi, hiệu ứng tilt-shift** làm thế giới như mô hình thu nhỏ; Aonuma chọn để gợi lại màn Game Boy nhỏ mà rộng (Wikipedia; nintendoeverything.com). 6,46 triệu bản.
- **Hợp:** 4. Tilt-shift = mờ trên mờ dưới, rẻ nếu **vẽ sẵn vào ảnh nền**, không dùng bộ lọc thời gian thực.
- **Không lấy:** đánh kiếm thời gian thực; mê cung dài.

### 2.15 Spelunky 2
- **Lối chơi:** màn **sinh ngẫu nhiên**; **Thử thách ngày** dùng **cùng một hạt giống** cho mọi người chơi trong ngày (Wikipedia; gamedeveloper.com).
- **Hợp:** 3. Lấy **"Ải của ngày"**: cả lớp cùng gặp một câu mỗi ngày, so với chính mình (không xếp hạng công khai, giữ K5).
- **Không lấy:** chết mất hết.

### 2.16 Super Meat Boy
- **Lối chơi:** màn 10–30 giây; **mạng vô hạn, hồi sinh gần như tức thì**; **phát lại tất cả lần thử cùng lúc** khi qua màn; vệt thịt đánh dấu chỗ từng chết (Wikipedia; godisageek.com).
- **Hợp:** 4 về ý **phát lại**: cuối chuyến cho xem "đường đi" gồm cả ngã rẽ sai đã đi.
- **Không lấy:** độ khó, hình máu.

### 2.17 Katana Zero
- **Lối chơi:** **mỗi phòng là một câu đố**; nhân vật "tiên tri", chết thì **tua ngược** và cốt truyện nói đó chỉ là "kế hoạch trong đầu" (Wikipedia; katana-zero.fandom).
- **Hợp:** 5 về khung truyện: **sai = thần thú "nhìn trước" một nhánh không thành**, rồi quay lại. Biến thất bại thành thiết kế, không phải hình phạt.
- **Không lấy:** chém thời gian thực.

### 2.18 Hades (2,5D)
- **Vòng chơi:** chạy qua các phòng, chọn **cửa kế tiếp theo phần thưởng hiện trên cửa**, chết thì về nhà, nói chuyện, mạnh dần.
- **Lối chơi:** (1) **Cửa có biểu tượng thưởng** = chọn đường có thông tin. (2) Chết vẫn có tiến bộ (cốt truyện chạy tiếp). TGA 2020 hai giải (pcgamer.com).
- **Hợp:** 4. GDD 6.3 (ngã rẽ Tinh anh / Suối hồi) đã lấy ý này.
- **Không lấy:** chiến đấu nhanh; dựng 2,5D.

### 2.19 Kingdom Rush
- **Lối chơi:** thủ thành, **được dừng game để tính** (pocketgamer.com; trích đoạn).
- **Hợp:** 3. Lấy **"thế giới đứng yên khi em đang nghĩ"**.
- **Không lấy:** quản lý nhiều thứ cùng lúc.

### 2.20 Angry Birds
- **Vòng chơi:** kéo ná, bắn, nhìn công trình đổ, 1–3 sao.
- **Lối chơi:** **một hành động, hậu quả vật lý đã mắt**. Ảnh hưởng từ game Flash *Crush the Castle* (trích đoạn).
- **Chuyển động:** chim bay theo đường cong, gỗ gãy, bụi tung, lợn nảy *(pt)*.
- **Hợp:** 4 cho **phần trình diễn sau khi chấm** (mô phỏng tất định, không cần em ngắm).
- **Không lấy:** ngắm bằng tay quyết định thắng thua (đó là kỹ năng thao tác, không đo Hoá).

### 2.21 Cut the Rope
- **Vòng chơi:** kẹo treo trên dây, **vuốt cắt dây** đúng thứ tự để kẹo rơi vào miệng Om Nom; **3 sao mỗi màn**; 425 màn trong 17 hộp; cần đủ sao để mở màn sau (play.google.com; trích đoạn).
- **Lối chơi:** (1) Một thao tác rất đơn giản (cắt). (2) Nhân vật nhận quà có biểu cảm đáng yêu.
- **Hợp:** 4 cho **thao tác "chọn = cắt dây"**. Nhưng 425 màn đều **thiết kế tay**: không nhân ra được hàng nghìn câu trong kho đề.
- **Không lấy:** câu đố phụ thuộc thời điểm cắt.

### 2.22 Alto's Adventure / Odyssey
- **Lối chơi:** **một chạm**; **Zen Mode** không điểm, không xu (altosodyssey.com/press; Wikipedia).
- **Đồ hoạ:** nền phẳng nhiều lớp, **ánh sáng và thời tiết động** (bão cát, sao băng, gió xoáy, nước chảy).
- **Chuyển động:** nhân vật lướt liên tục, camera trượt mềm *(pt)*.
- **Hợp:** 5 về đồ hoạ: **hình phẳng + gradient trời đổi theo giờ + vài lớp núi** là kiểu đẹp **rẻ nhất** cho canvas.
- **Không lấy:** chạy vô tận không điểm dừng.

### 2.23 Monument Valley (2,5D)
- **Lối chơi:** **xoay, kéo một phần kiến trúc** để mở đường cho công chúa Ida; ảo giác Escher (Wikipedia; cultofmac.com). **Màn phải gọn để mẹo thị giác hiệu quả** (trích đoạn). Chỉ 10 màn.
- **Hợp:** 3. Lấy **"mở đường = sắp lại thế giới"**, bảng màu pastel.
- **Không lấy:** mỗi màn thiết kế tay; dựng isometric.

### 2.24 Donkey Kong Country
- **Đồ hoạ:** dựng 3D trên máy Silicon Graphics, kết xuất thành sprite và ô nền 2D cho SNES (Wikipedia; racketboy.com).
- **Bài học:** **làm hình đẹp ở nơi mạnh, phát hình phẳng ở nơi yếu**. Bát Linh làm đúng như vậy: ChatGPT vẽ, máy học sinh chỉ dán ảnh webp.
- **Hợp:** 5 về quy trình.

### 2.25 Kirby
- **Lối chơi:** **"tử tế với người mới"**; **bay được** để ai cũng qua màn; **Copy Ability** cho người giỏi chơi sâu (nintendolife.com; remptongames.com). Đạo diễn hiện nay tóm tắt: "dễ vào mà sâu".
- **Hợp:** 5 về triết lý: **sàn thấp, trần cao**. Em yếu luôn qua ải (★), em giỏi săn ★★★ và bẫy.
- **Không lấy:** gần như không có gì phải bỏ.

---

## 3. Tinh tuý xuyên game theo 3 trục

Cột "Chi phí" tính trên máy yếu: **R** = rẻ (gần như 0), **V** = vừa, **Đ** = đắt (phải tắt ở chế độ nhẹ).

### 3.1 Trục LỐI CHƠI

| # | Tinh tuý | Từ game | Cách làm trong Bát Linh | Chi phí |
|---|---|---|---|---|
| L1 | **Một ải = một quyết định rõ** | Cut the Rope, Hades (cửa), Monument Valley | Ải kết thúc bằng một "điểm quyết định" duy nhất: chọn cổng / chọn đồ / nhập số | R |
| L2 | **Thế giới đứng yên khi em nghĩ** | Kingdom Rush, Celeste Assist (giảm tốc), Rayman–Murfy | Nhân vật tự chạy tới cổng rồi **dừng hẳn**. Không đồng hồ trong ải (chỉ hạn mềm theo GDD K3) | R |
| L3 | **Dạy bằng màn, không bằng chữ** | Mario 1-1 | Ải đầu mỗi đảo là câu dễ nhất, có hố đáy nông: sai thì rơi xuống bậc thấp, đi tiếp | R |
| L4 | **Thất bại là bài học, quay lại ngay** | Limbo, Super Meat Boy, Katana Zero | Sai: thần thú "nhìn trước" nhánh hỏng 2 giây, gọi tên bẫy, mở "Vì sao sai", đi tiếp; Trận phục thù tối đa 2 | R |
| L5 | **Sàn thấp, trần cao** | Kirby, Celeste | Luôn qua ải (★); hạ quái (★★); không mất máu (★★★). Bùa Trợ giảng = "cánh bay" của Kirby | R |
| L6 | **Hiểu quái thì thắng, quái có tên, có tính cách** | Undertale, Hollow Knight | Bẫy có tên (GDD 6.2) thành quái gác cổng, nói 1 câu trước và sau | R |
| L7 | **Ngã rẽ có thông tin** | Hades | Ngã rẽ Tinh anh / Suối hồi (GDD 6.3) vẽ thành **hai cổng có biểu tượng** | R |
| L8 | **Mở khoá vĩnh viễn, sổ sưu tầm** | Dead Cells, Terraria | Sổ tay bẫy, mảnh màu của đảo | R |
| L9 | **Lời khen đúng lúc** | Mario Wonder (Bông hoa nói chuyện) | Thần thú nói 1 câu ngắn theo kết quả; bật tắt chữ/tiếng | R |
| L10 | **Ải của ngày chung một hạt giống** | Spelunky 2 | Một câu chung cả lớp mỗi ngày, chỉ so với chính mình | R |
| L11 | **Phát lại hành trình** | Super Meat Boy | Cuối chuyến: bản đồ cuộn lại, hiện các ngã rẽ đã đi, sai hiện mờ | R |
| L12 | **Hậu quả vật lý đã mắt** | Angry Birds, Cut the Rope | Sau khi chấm, chạy mô phỏng tất định (dùng lại cách bước cố định của `bi-a/vat-ly.ts`) | V |

### 3.2 Trục ĐỒ HOẠ

| # | Tinh tuý | Từ game | Cách làm bằng canvas + ảnh máy vẽ | Chi phí |
|---|---|---|---|---|
| G1 | **Tranh tĩnh + ánh sáng + hạt** | Ori, Rayman Legends | Nền là ảnh webp; ánh sáng = 1 ảnh gradient tròn trong suốt vẽ chồng chế độ `lighter`/`screen`; hạt ≤ 12 | R→V |
| G2 | **Parallax 3–5 lớp** | Alto, Ori, Limbo | Mỗi lớp một ảnh ngang lặp được; lớp xa trôi 0,1×, gần 1×. Canvas `drawImage` 2 lần mỗi lớp (nối đuôi) | R |
| G3 | **Bảng màu hẹp có chủ ý** | Shovel Knight, Gris, Inside | Mỗi quần đảo khoá 12–16 màu; câu lệnh ChatGPT ghi mã màu; kiểm bằng mắt | R |
| G4 | **Bóng đen tiền cảnh + nền mờ** | Limbo, Inside | Lớp tiền cảnh là bóng đen (cỏ, đá) trên nền sáng → che chi tiết thừa của ảnh máy vẽ | R |
| G5 | **Màu loang = tiến bộ** | Gris | Đảo bắt đầu xám (Mê Vụ). Thuần phục bẫy thì vòng màu loang ra. Lớp phủ xám có mặt nạ tròn | V (vẽ 1 lần, lưu canvas phụ) |
| G6 | **Trời đổi theo giờ thật** | Alto | Gradient trời vẽ bằng mã theo giờ máy em; buổi tối đổi tông | R |
| G7 | **Diorama, tilt-shift vẽ sẵn** | Link's Awakening | Yêu cầu ChatGPT vẽ sẵn mờ hai mép trên dưới; không dùng bộ lọc blur thời gian thực | R |
| G8 | **Vẽ đẹp ở nơi mạnh, phát phẳng ở nơi yếu** | Donkey Kong Country, Dead Cells | ChatGPT vẽ → cắt nền → nén webp → atlas. Máy em chỉ dán ảnh | R |
| G9 | **Tín hiệu nguy hiểm/thưởng khác hình, không chỉ khác màu** | Mario, GDD 8.2 | Cổng đúng/sai sau chấm có ✓/✗ + chữ, không chỉ xanh/cam | R |

### 3.3 Trục CHUYỂN ĐỘNG ("game feel")

| # | Tinh tuý | Từ game | Cách làm bằng mã | Chi phí | Máy yếu |
|---|---|---|---|---|---|
| M1 | **Nén và giãn (squash & stretch)** | Mario, Celeste | Đáp đất: `scale(1,15; 0,85)` → `(0,95; 1,05)` → `(1;1)` trong 180 ms, hàm `easeOutBack` | R | Giữ |
| M2 | **Nhún khi chạy** thay cho chuỗi hình chạy | Cuphead (nhịp hình thấp vẫn mượt), Rayman | Một ảnh tách nền, dịch y theo `|sin|` 2,5 Hz, nghiêng ±4°; bóng dưới chân co giãn ngược pha | R | Giữ |
| M3 | **Hit-stop** | Hollow Knight | Đúng: dừng mọi chuyển động 60–90 ms, quái nháy trắng 1 khung (vẽ lại ảnh với `globalCompositeOperation='source-atop'` lên màu trắng, lưu sẵn) | R | Giữ |
| M4 | **Đẩy lùi cả hai bên** | Hollow Knight | Thần thú lùi 6 px, quái lùi 12 px, `easeOutQuad` 120 ms | R | Giữ |
| M5 | **Rung màn ngắn** | Vlambeer "Art of Screenshake", Juice It or Lose It | Dịch camera ngẫu nhiên giảm dần, 4 px × 150 ms. Chỉ khi hạ trùm/vỡ giáp | R | **Tắt** (và khi `prefers-reduced-motion`) |
| M6 | **Hạt** | Juice It or Lose It, Ori | ≤ 12 hạt, mỗi hạt 1 `drawImage` ảnh 16 px, sống 400–800 ms | V | **Tắt** |
| M7 | **Tween mọi thứ (không nhảy cóc)** | Juice It or Lose It | Thẻ câu trượt lên `easeOutCubic` 220 ms; cổng mở `easeInOutSine` 400 ms; số nảy `easeOutBack` | R | Giữ, rút ngắn 30% |
| M8 | **Coyote / buffer theo nghĩa "tha thứ"** | Celeste | Đây là app chạm: **chạm lệch 12 px quanh cổng vẫn tính**; bấm trước khi nhân vật tới cổng thì ghi nhận, áp khi tới | R | Giữ |
| M9 | **Chớp sáng + nhạc ngắt khi bị cắn** | Hollow Knight | Sai: viền cam, rung 4 px × 2 (GDD 8.2), nhạc nền giảm 50% trong 400 ms | R | Giữ, bỏ rung |
| M10 | **Camera trượt mềm, nhìn trước** | Alto | Camera đi trước nhân vật 20% chiều rộng, nội suy `lerp 0,1` mỗi khung | R | Giữ |
| M11 | **Hoạt ảnh "niệm chú" che độ trễ chấm** | GDD 8.1 | Từ lúc bấm chốt đến khi máy chủ trả: thần thú tụ sáng 300 ms; > 3 s hiện "Đang chấm…" | R | Giữ |

**Âm thanh (chung):** dùng tiếp Web Audio tổng hợp như `bi-a/am-thanh.ts` và `battle-audio.ts`: không tệp, nhẹ. Bài học từ Mario (tiếng xu rất ngắn), Hollow Knight (nhạc ngắt khi trúng đòn), Rayman (âm khớp nhịp): **mỗi sự kiện một âm ngắn ≤ 300 ms, âm đúng đi lên, âm sai trầm mềm, không còi báo**. Nhạc nền tắt mặc định ở chế độ nhẹ.

---

## 4. Thiết kế "MỖI ẢI = MỘT CÂU": ba phương án

### 4.0 Luật chung cho cả ba phương án (không phương án nào được vi phạm)

| Luật | Nội dung |
|---|---|
| U1 | **Đúng/sai do máy chủ chấm.** Máy khách vẽ **cả hai kết cục từ cùng bộ ảnh**. Tên ảnh, đường dẫn, thứ tự cổng **không mang thông tin đáp án**. Cổng/đồ vật xếp theo thứ tự A–D như đề, không xáo theo đáp án |
| U2 | **Chỉ Phần I (4 lựa chọn), Phần II (Đúng/Sai 4 ý), Phần III (trả lời ngắn).** Không tự luận (`src/lib/cau-tu-luan.ts`) |
| U3 | **Không ép giờ.** Thế giới đứng yên khi câu hiện. Chỉ giữ hạn mềm theo GDD K3 |
| U4 | **Sai không phạt nặng:** mất máu theo ý đồ quái (GDD 6.1), gọi tên bẫy, "Vì sao sai", Trận phục thù ≤ 2 mỗi chuyến |
| U5 | **Độ khó thao tác = 0.** Mọi hành động là chạm/nhập. Kỹ năng tay (nếu có) chỉ cho thứ trang trí, không ảnh hưởng sao, vàng, EXP |
| U6 | **Câu chiếm ≥ 65% thời gian buổi** (GDD 8.3). Mọi hoạt ảnh bấm để tua |
| U7 | **Nhân ra được cho cả kho đề:** cảnh là **mẫu theo dạng câu × đảo**, không thiết kế tay cho từng câu |

Bố cục màn điện thoại dọc (390 × 844) cho cả ba phương án: **cảnh trên ~38% chiều cao**, **thẻ câu dưới ~62%** (dùng lại `TheCau` như `TrongAi.tsx`). Khi câu hiện, cảnh mờ 30% và đứng yên.

---

### 4.1 Phương án A: "Phòng thí nghiệm treo dây" (giải đố vật lý kiểu Cut the Rope / Angry Birds)

**Ý chính:** đáp án là **vật phẩm** treo trên dây (Phần I), **quả nặng** đặt lên cân (Phần II), hoặc **lực bắn** của máy bắn đá đo lường (Phần III). Em chọn, máy chủ chấm, rồi **vật lý tất định chạy để trình diễn kết quả**: vật đúng rơi vào lò, mở đường; vật sai nảy ra, quái bẫy hiện.

**Luồng một ải (≈ 45–80 giây):**

| Bước | Thời gian | Màn hình |
|---|---|---|
| 1. Vào ải | 2 s | Camera trượt từ trái vào phòng; thần thú nhảy xuống (M1). Cửa đá đóng ở bên phải |
| 2. Đọc câu | 30–60 s | Thẻ câu trượt lên. Phía trên: 4 viên đá A–D treo trên 4 dây, đung đưa nhẹ (chỉ trang trí) |
| 3. Hành động | 1–3 s | Chạm viên đá → viền sáng → "Cắt dây?" → chạm lần 2 để chốt (chống bấm nhầm) |
| 4. Chấm | 0,3–3 s | Niệm chú (M11); dây rung nhẹ chờ |
| 5. Phản hồi | 2–4 s | **Đúng:** dây đứt, đá rơi theo đường cong định sẵn vào lò, hit-stop 80 ms, lò bừng sáng, cửa mở, ✓ "Đúng". **Sai:** dây đứt, đá rơi trúng mép lò, **nảy ra**, lăn tới chân quái bẫy; quái bước ra, gọi tên bẫy, ✗ "Chưa đúng"; viên đá đúng sáng lên (sau chấm, được phép) |
| 6. Hiệu ứng | 1–2 s | Cửa mở dù sai (ải vẫn qua, ít sao). Thần thú chạy sang ải sau |

- **Phần II:** cân đĩa 4 quả nặng; mỗi ý em đặt quả vào đĩa "Đúng" hoặc "Sai"; chốt cả 4. Sau chấm, cân nghiêng theo số ý đúng; ≥ 3 ý đúng thì giáp trùm vỡ (giữ luật GDD 6.1).
- **Phần III:** **máy bắn đá đo lường**: em nhập số → máy chủ chấm → đá bay. **Đúng:** trúng tâm. **Sai:** máy chủ đã trả đáp án sau chấm, nên máy khách so số em nhập với đáp án và cho **đá rơi ngắn (em nhỏ hơn) hoặc bay quá (em lớn hơn)**. Đây là phản hồi có nghĩa: em thấy mình thiếu hay thừa.
- **Thần thú:** đứng cạnh lò, hứng vật; sai thì nói "Tớ thấy viên này nảy ra vì…". Kỹ năng thần thú (GDD 6.1) hiện thành "dây phép".
- **Tách độ khó:** em không ngắm, không canh lúc cắt. Vật lý chỉ là trình diễn.
- **Máy yếu:** mô phỏng con lắc + rơi ≤ 6 vật, bước cố định như Bi-a; nhẹ. Chế độ nhẹ: thay vật lý bằng đường cong tween vẽ sẵn.

**Ví dụ A1: Đảo Oxi Hoá – Khử (Lớp 10, Chương 4 "Phản ứng oxi hoá – khử")**
- Câu Phần I: *"Trong phản ứng Fe + CuSO₄ → FeSO₄ + Cu, chất khử là"* A. Fe · B. CuSO₄ · C. FeSO₄ · D. Cu. **Đáp án A.** Fe⁰ → Fe²⁺ + 2e, Fe nhường electron.
- Cảnh: phòng đá xanh rêu, lò "Electron" ở giữa. 4 viên đá khắc công thức, treo trên dây.
- Đúng (A): viên Fe rơi vào lò, **hai tia sáng nhỏ (2 electron)** bay từ lò sang tinh thể Cu²⁺ trên cửa, tinh thể hoá đồng đỏ, cửa trượt lên.
- Sai (B): viên CuSO₄ nảy ra. Quái **Song Diện Electron** (trùm Đảo 4 trong GDD) bước ra: *"Bẫy Nhầm vai: CuSO₄ nhận electron, nó là chất oxi hoá."*

**Ví dụ A2: Đảo Nitrogen – Sulfur (Lớp 11, Chương 2 "Nitrogen và sulfur")**
- Câu Phần III: *"Hoà tan hết 19,2 g Cu trong dung dịch HNO₃ loãng dư, thu được V lít khí NO (sản phẩm khử duy nhất, đkc). Tính V."*
- Kiểm: n(Cu) = 19,2 : 64 = 0,3 mol. 3Cu + 8HNO₃ → 3Cu(NO₃)₂ + 2NO + 4H₂O ⇒ n(NO) = 0,3 × 2/3 = 0,2 mol ⇒ V = 0,2 × 24,79 = **4,958 L**. Bẫy: 7,437 L (lấy n(NO) = n(Cu) = 0,3).
- Cảnh: vách đá có khói nâu, máy bắn đá bằng đồng. Bia là miệng hang Rồng Khói Nâu.
- Đúng (4,958): đá bay trúng tâm, rung màn nhẹ (máy mạnh), miệng hang sập, đường mở.
- Sai (7,437): đá **bay vượt** qua bia (em lớn hơn đáp án). Quái **Rồng Khói Nâu** gọi bẫy: *"Quên tỉ lệ 3 Cu : 2 NO."*

**Công sức (giả thuyết):** **Cao.** Cần lõi dây và con lắc (Verlet ~150–250 dòng), 3 mẫu phòng (treo dây, cân, máy bắn đá) × 21 đảo về ảnh; mỗi mẫu cần căn quỹ đạo để vật "vừa rơi vào" hoặc "vừa nảy ra".

**Điểm yếu lớn:** cảm giác "thử nghiệm vật lý" ở Cut the Rope đến từ việc **người chơi tự giải bài vật lý**. Ở đây vật lý chỉ là trình diễn, nên phần "đã" ngắn. Và Cut the Rope có 425 màn thiết kế tay, không nhân được cho hàng nghìn câu (vi phạm tinh thần U7 nếu muốn mỗi ải khác nhau thật).

---

### 4.2 Phương án B: "Đường Linh Thú" (platformer tự chạy kiểu Rayman–Murfy / Alto, cổng là câu)

**Ý chính:** cảnh cuộn ngang. **Thần thú tự chạy** (em không điều khiển chân). Mỗi ải là một đoạn đường **kết thúc ở một Cổng câu hỏi** do một quái bẫy gác. Hình cổng đổi theo dạng câu:

| Dạng câu | Cổng | Thao tác |
|---|---|---|
| Phần I | **Bốn cửa đá A–D** cạnh nhau, giống hệt nhau, chỉ khắc chữ cái | Chạm cửa → chạm "Đi" |
| Phần II | **Cầu 4 nhịp**, mỗi nhịp có hai tấm ván "Đúng" và "Sai" | Chọn đủ 4 nhịp rồi "Đi" |
| Phần III | **Cổng số**: ổ khoá có bàn phím số khắc đá (dùng ô nhập của `TheCau`) | Nhập rồi "Đi" |

**Luồng một ải (≈ 40–80 giây):**

| Bước | Thời gian | Màn hình |
|---|---|---|
| 1. Vào ải | 3–4 s | Thần thú chạy qua đoạn đường parallax 4 lớp (M2 nhún chạy, M10 camera). Linh quang tự hút vào người (trang trí). Quái gác cổng hiện ý đồ: "Sắp cắn: 8" |
| 2. Đọc câu | 30–60 s | Thần thú **dừng trước cổng**, ngồi xuống. Thẻ câu trượt lên. Thế giới đứng yên, chỉ có lá rơi chậm (tắt được) |
| 3. Hành động | 1–3 s | Chọn Đánh / Chắn / Kỹ năng (giữ lõi trận GDD 6.1), chọn cửa, có thể bấm "Chắc!". Chạm "Đi" |
| 4. Chấm | 0,3–3 s | Thần thú lấy đà (niệm chú M11) |
| 5. Phản hồi | 2–4 s | **Đúng:** thần thú lao qua cửa đã chọn, hit-stop 80 ms, quái nháy trắng, đẩy lùi (M3, M4), số `16 × 1,5 = 24` nảy lên, cửa bừng sáng. **Sai:** cửa mở ra **một đoạn hang ngắn 2 s** ("thần thú nhìn trước", kiểu Katana Zero), thần thú trượt xuống, quái cắn theo ý đồ, gọi tên bẫy, mở "Vì sao sai". Cửa đúng sáng lên sau chấm |
| 6. Nối ải | 1–2 s | Dù đúng hay sai, đường đều nhập lại; chạy sang ải sau. Sai ở phương án có mã bẫy và kho có câu cùng mã → **Trận phục thù**: quái quay lại chặn ở cổng kế |

- **Ngã rẽ GDD 6.3** = hai cổng có biểu tượng (⚔ Tinh anh / ❖ Suối hồi) kiểu Hades, đứng giữa ải 2–3 và 4–5.
- **Trùm ải (ải 6):** cầu 4 nhịp Phần II là "giáp 4 đoạn" (GDD 6.1). Mỗi nhịp đúng = một mảng giáp vỡ khi chạy qua.
- **Thần thú làm gì:** là nhân vật chạy (đã có 8 con × 6 bậc trong `public/than-thu-v2/nho/`); nói 1 câu sau mỗi kết quả kiểu Bông hoa nói chuyện; kỹ năng nhóm thủ/hồi/công hiện thành khiên, suối, vệt lửa.
- **Đáp án không lộ:** 4 cửa giống hệt nhau, hang sau mỗi cửa vẽ **sau khi chấm**. Không có "đường đúng" dựng sẵn trong dữ liệu màn.
- **Tách độ khó:** 0 thao tác chân. Linh quang tự hút; máy mạnh có thể chạm để thần thú nhảy hái thêm, **chỉ để trang trí**.
- **Máy yếu:** 4 lớp nền + 2–3 sprite + ≤ 12 hạt. Canvas 2D đủ, không cần PixiJS.

**Ví dụ B1: Đảo Tốc Độ (Lớp 10, Chương 6 "Tốc độ phản ứng")**
- Câu Phần I: *"Một phản ứng có hệ số nhiệt độ Van't Hoff γ = 2. Tăng nhiệt độ từ 30 °C lên 60 °C thì tốc độ phản ứng tăng bao nhiêu lần?"* A. 6 · B. 8 · C. 3 · D. 9. **Đáp án B**: 2^((60 − 30)/10) = 2³ = 8. Bẫy A: nhân 2 × 3 (**Thỏ Cộng Dồn**).
- Cảnh: đảo bánh răng đồng, trời chiều cam; đường ray gỗ; 4 cửa là 4 mặt đồng hồ. Luật đảo LD-15 (chọn 25 °C / 35 °C) hiện thành **cần gạt nhiệt** trước cổng.
- Đúng: thần thú lao qua, ba bánh răng quay liên tiếp (×2, ×2, ×2), cửa bật mở.
- Sai (A): thần thú vào hang ngắn, đồng hồ quay chậm, **Thỏ Cộng Dồn** nhảy ra: *"Mỗi 10 °C nhân 2, không phải cộng 2."*

**Ví dụ B2: Đảo Carbohydrate (Lớp 12, Chương 2 "Carbohydrate"), trùm ải, Phần II**

| Ý | Nội dung | Đúng/Sai | Kiểm |
|---|---|---|---|
| a | Glucose và fructose là đồng phân của nhau | **Đúng** | Cùng C₆H₁₂O₆, khác cấu tạo |
| b | Saccharose có phản ứng tráng bạc | **Sai** | Saccharose không có nhóm –CHO tự do |
| c | Thuỷ phân hoàn toàn 34,2 g saccharose rồi cho toàn bộ sản phẩm tráng bạc hoàn toàn thu được 43,2 g Ag | **Đúng** | 0,1 mol saccharose → 0,1 glucose + 0,1 fructose → 0,4 mol Ag × 108 = 43,2 g |
| d | Tinh bột và cellulose là đồng phân của nhau | **Sai** | (C₆H₁₀O₅)ₙ với n khác nhau, không cùng phân tử khối |

- Cảnh: rừng mía và hoa ong; **Cây Tinh Bột Cổ** (trùm GDD) cuối cầu, thân cây quấn 4 vòng giáp.
- Em chọn ván cho 4 nhịp, "Đi". Sau chấm: thần thú chạy qua từng nhịp; nhịp đúng → vòng giáp vỡ (hit-stop + 6 hạt lá); nhịp sai → tấm ván lún nhẹ, **Ong Đường Mía** bay ra gọi bẫy "Saccharose không tráng bạc". ≥ 3 ý đúng thì giáp vỡ hết (GDD 6.1).

**Công sức (giả thuyết):** **Vừa.** Một bộ máy cảnh cuộn (parallax, sprite, tween, hạt) dùng chung cho mọi đảo; 3 mẫu cổng; ảnh mỗi đảo ~12–16 tấm.

---

### 4.3 Phương án C: "Phòng Giả Kim" (phiêu lưu nhìn từ trên kiểu Zelda)

**Ý chính:** mỗi ải là **một phòng** nhìn từ trên xuống (góc 3/4 kiểu diorama Link's Awakening). Phòng có cửa khoá và **đồ vật Hoá làm công cụ** (bình, đèn cồn, quỳ tím, cân, điện cực…). Em **chạm vào ô sàn** để thần thú đi tới (đi tự động theo đường ngắn nhất), chạm đồ vật để chọn, rồi **"dùng" lên ổ khoá**.

**Luồng một ải (≈ 50–90 giây):**

| Bước | Thời gian | Màn hình |
|---|---|---|
| 1. Vào phòng | 2 s | Cửa trượt, thần thú bước vào; camera tilt-shift vẽ sẵn |
| 2. Đọc câu | 30–60 s | Thẻ câu. Trên sàn: 4 bệ A–D, mỗi bệ một đồ vật có nhãn |
| 3. Hành động | 3–6 s | Chạm bệ → thần thú đi tới, nhặt đồ (bay lên trên đầu như Zelda) → chạm ổ khoá |
| 4. Chấm | 0,3–3 s | Thần thú đưa đồ vào ổ |
| 5. Phản hồi | 2–4 s | **Đúng:** phản ứng xảy ra trong ổ (đổi màu, bọt, kết tủa), cơ quan quay, cửa mở. **Sai:** không phản ứng hoặc phản ứng sai hướng, quái bẫy hiện từ bóng tối của phòng |
| 6. Ra phòng | 1–2 s | Cửa mở dù sai (ít sao). Trùm ải = phòng lớn 4 ổ khoá cho 4 ý Phần II |

- **Đáp án không lộ:** 4 đồ vật luôn ở 4 bệ theo thứ tự A–D; phản ứng vẽ sau chấm.
- **Điểm mạnh:** **tích hợp nội tại** cao nhất: đồ vật chính là chất, ổ khoá là phản ứng. Habgood & Ainsworth (2011, *Journal of the Learning Sciences* 20(2)) so 3 bản game Zombie Division: bản **gắn toán vào cơ chế chiến đấu** cho trẻ **học được nhiều hơn** trong thời gian cố định và **chơi lâu gấp 7 lần** khi được tự do so với bản đặt câu hỏi trắc nghiệm giữa các màn (shura.shu.ac.uk/3556; trích đoạn).
- **Điểm yếu:** muốn đồ vật đúng là chất trong đề thì **mỗi câu phải gắn nhãn phương án → đồ vật** (công nhập liệu). Câu không có chất cụ thể (câu lý thuyết, câu số) phải dùng đồ chung "cuộn giấy A–D", mất cái hay.
- **Máy yếu:** một phòng tĩnh + 5–6 sprite; rẻ. Đi bộ chạm-ô tốn thêm 2–4 s mỗi ải (giảm tỉ lệ thời gian dành cho câu).

**Ví dụ C1: Đảo Halogen (Lớp 10, Chương 7 "Nguyên tố nhóm VIIA")**
- Câu Phần I: *"Cho từ từ chất nào sau đây vào dung dịch NaBr thì dung dịch chuyển sang màu vàng nâu?"* A. Nước iodine · B. Nước chlorine · C. Dung dịch HCl · D. Dung dịch NaCl. **Đáp án B**: Cl₂ + 2NaBr → 2NaCl + Br₂ (Br₂ màu vàng nâu). Bẫy A: "I₂ cũng đẩy được Br⁻" (halogen yếu không đẩy halogen mạnh hơn).
- Cảnh: phòng đá muối trắng, ổ khoá là bể kính chứa dung dịch NaBr không màu. 4 bình: tím nhạt, vàng lục nhạt, trong, trong.
- Đúng (B): thần thú dốc bình vàng lục; **màu vàng nâu loang trong bể** (tween màu 800 ms), chất lỏng nâu chảy theo rãnh làm quay bánh xe, cửa mở. Luật LD-16 kích hoạt: quái Br⁻ đứng sau mất 8 máu.
- Sai (A): dốc bình tím, bể **không đổi màu**; **Sói Âm Điện** bước ra: *"I₂ yếu hơn Br₂, không đẩy được Br⁻."*

**Ví dụ C2: Đảo Alcohol – Phenol (Lớp 11, Chương 5 "Dẫn xuất halogen – alcohol – phenol")**
- Câu Phần III: *"Cho 9,4 g phenol tác dụng với nước bromine dư, thu được m gam kết tủa trắng. Tính m."*
- Kiểm: n(phenol) = 9,4 : 94 = 0,1 mol → 0,1 mol 2,4,6-tribromophenol C₆H₂Br₃OH, M = 6×12 + 2×1 + 3×80 + 16 + 1 = **331** → m = **33,1 g**. Bẫy: 17,3 g (thế 1 Br, M = 173) = **Cáo Một Brom**.
- Cảnh: phòng gỗ có **cân đĩa khổng lồ** làm khoá: đĩa phải chở đúng khối lượng thì cửa mở. Em nhập số trên mặt cân.
- Đúng: bình bromine đổ vào cốc phenol, **kết tủa trắng rơi như tuyết** (6 hạt) đầy đĩa, cân thăng bằng, cửa nâng.
- Sai (17,3): đĩa nhẹ, cân lệch về phía em (em nhỏ hơn đáp án, so sau chấm), **Cáo Một Brom** chui ra: *"Nhân thơm phenol thế 3 vị trí, không phải 1."*

**Công sức (giả thuyết):** **Cao.** Lưới phòng, đi tìm đường, 3 mẫu ổ khoá, ~10 đồ vật Hoá mỗi đảo, **cột nhập liệu "đồ vật cho từng phương án"**.

---

## 5. So sánh và khuyến nghị

### 5.1 Bảng so sánh (1–5, 5 là tốt nhất)

| Tiêu chí | A. Treo dây vật lý | B. Đường Linh Thú | C. Phòng Giả Kim |
|---|---|---|---|
| **Cuốn** (cảm giác phiêu lưu, đi tới) | 3 (đẹp lúc rơi, nhưng đứng một chỗ) | **5** (luôn tiến về phía trước, cảnh đổi) | 4 (khám phá phòng) |
| **Học** (tích hợp nội tại, thời gian dành cho câu) | 3 (trình diễn chung chung, trừ máy bắn đá Phần III) | 3 (cổng là vỏ ngoài; bù bằng luật đảo LD và cổng số) | **5** (đồ vật = chất, ổ khoá = phản ứng) |
| **Máy yếu** | 3 (vật lý + nhiều vật) | **5** (parallax + vài sprite) | 4 (phòng tĩnh) |
| **Công sức** (5 = ít) | 2 | **4** | 2 |
| **Nhân cho cả kho đề** (U7) | 3 | **5** (mẫu cổng theo dạng câu) | 2 (cần nhãn đồ vật từng câu) |
| **Thời gian thao tác thừa / ải** | 2–4 s | **1–3 s** | 3–6 s |
| **Dùng lại app hiện tại** | Bi-a: vật lý tất định, canvas, âm thanh | Đảo `dao2/`: bản đồ 6 nút, `TrongAi` + `TheCau`, lõi trận; Hộ Tống `doan2/Canh2` (cảnh trên, HUD); `battle-audio.ts` | `TheCau`, lõi trận; ít dùng lại phần cảnh |
| **Tổng** | 19 | **31** | 23 |

### 5.2 Khuyến nghị: **Phương án B làm xương sống, lai thêm hai "mảnh" của A và C**

**"Đường Linh Thú lai"**:

1. **B là khung** cho mọi ải: thần thú tự chạy, dừng ở Cổng câu hỏi, quái bẫy gác cổng. Nhân được cho cả kho đề, rẻ nhất trên máy yếu, giữ nguyên lõi trận GDD 6.1 (Đánh/Chắn/Kỹ năng, "Chắc!", ý đồ quái).
2. **Lấy từ A: Cổng số = máy bắn đá đo lường** cho Phần III. Đá **bay ngắn hay vượt** cho em thấy mình nhỏ hơn hay lớn hơn đáp án (chỉ tính sau chấm). Đây là chỗ duy nhất vật lý mang nghĩa học.
3. **Lấy từ C: "Phòng Giả Kim" chỉ cho câu được gắn nhãn đồ vật**: mỗi đảo chọn **5–10 câu tiêu biểu** (thường là câu hiện tượng: đổi màu, kết tủa, khí). Câu có nhãn `doVat` thì cổng biến thành ổ khoá phản ứng. Câu không có nhãn thì dùng cổng thường. Cách này lấy được "tích hợp nội tại" (Habgood & Ainsworth) mà không bắt nhập nhãn cho cả kho.
4. **Lấy từ Gris:** đảo bắt đầu xám (Mê Vụ); mỗi bẫy thuần phục → màu loang thêm một vòng trên bản đồ đảo. Tiến bộ nhìn thấy bằng mắt.

**Lý do chọn:**
- Thầy chỉ cập nhật kho đề (Q2). B không bắt thầy làm gì thêm. Phần C là tuỳ chọn, thêm dần.
- Học sinh máy yếu: B là kiểu Alto/Limbo, đẹp mà rẻ nhất.
- "Phiêu lưu" đến từ **đi tới liên tục + cảnh đổi theo đảo + quái có tên**, không cần em điều khiển nhảy.
- Điểm yếu "cổng là vỏ ngoài" được bù bằng: **luật đảo LD** (biến kiến thức chương thành luật trận), **cổng số có hướng sai**, và **phòng giả kim** cho câu hiện tượng.

### 5.3 Nối với những thứ đã chốt

| Thứ đã chốt | Trong "Đường Linh Thú lai" |
|---|---|
| **21 đảo** (GDD 3.4) | 21 bộ ảnh nền (4 lớp) + 1 quái đầu đàn + 1 trùm; 3 quần đảo khoá 3 bảng màu |
| **Chuyến 6 ải** (`SO_AI_CHUYEN = 6`) | 6 đoạn đường, ải 6 là cầu trùm. `BanDo.tsx` (6 nút) thành bản đồ chọn chuyến; mỗi nút mở ra một đoạn cuộn |
| **Luật riêng mỗi đảo** (LD-10…LD-37) | Hiện thành **vật trên đường trước cổng**: cần gạt nhiệt (LD-15), hàng quái theo bán kính (LD-11), vòng giáp electron (LD-13), dây phối tử (LD-37)… Luật chỉ đổi số trận (LD-03), không đổi câu |
| **Bẫy có tên + Trận phục thù** (GDD 6.2) | Quái gác cổng mang tên bẫy; sai → quái **chạy theo** và chặn ở cổng kế (Trận phục thù ≤ 2); thắng → quái quỳ, thành tấm thẻ bay vào Sổ tay |
| **Ngã rẽ + bùa** (GDD 6.3) | Hai cổng có biểu tượng kiểu Hades; bùa chọn 1 trong 3 là 3 bình trên bệ đá |
| **Thần thú 8 hệ, không cho chỉ số** | Thần thú là nhân vật chạy; hệ chỉ đổi màu vệt sáng và lời thoại |
| **Kế hoạch ngày + thể lực** (DAC-TA 4.4) | Số đoạn đường trong chuyến = số câu kế hoạch xếp; game không tự thêm câu (GDD 6.1) |
| **Tick bài đã học** (Q3, Q4) | Cổng chỉ nhận câu thuộc bài đã tick. Đảo chưa học = đảo xám sương, có "Câu thử" (một đoạn ngắn, không vào kế hoạch) |
| **Chế độ gọn, Thi thử, Tu luyện** | Không dùng cảnh cuộn (LD-02); giữ màn thẻ câu thuần |
| **Ngân sách hiệu năng** (GDD 8.1) | Mục 6 bên dưới |

**Lệnh máy chủ:** không cần lệnh mới cho B; dùng lại luồng câu của Đảo 2.0. Phòng Giả Kim cần **thêm cột `doVat`** (chỉ thêm) cho phương án của một số câu: kiểu `{A:'binh-iod', B:'binh-clo', …}`. Cột này **chỉ là nhãn hình**, không chứa đúng/sai, nên gửi xuống trước được. Cần kiểm kỹ: hình đồ vật không được gợi đáp án hơn chữ của phương án.

---

## 6. Đặc tả hình và chuyển động tối thiểu (ải mẫu, phương án khuyến nghị)

### 6.1 Công nghệ vẽ

| Lựa chọn | Đánh giá |
|---|---|
| **Canvas 2D thuần (khuyên dùng trước)** | Bi-a đã dùng canvas 2D. Không thêm thư viện, giữ JS màn trận ≤ 150 KB (GDD 8.1). Đủ cho 4 lớp parallax + ≤ 6 sprite + ≤ 12 hạt |
| PixiJS v8 | Mạnh khi cần nhiều sprite và bộ lọc. Trang hướng dẫn hiệu năng của Pixi khuyên: **gom ảnh vào atlas** để batch, **tắt antialias** trên máy cũ, **dùng ảnh 0,5× cho máy yếu**, TilingSprite cho nền lặp (pixijs.com/8.x/guides/concepts/performance-tips; trích đoạn). Chưa đo cỡ gói; nếu dùng phải nạp lười và đo bằng `npm run build` |
| SVG/CSS (như hiện nay) | Hợp màn tĩnh. Cuộn nhiều lớp ảnh lớn bằng CSS transform cũng được nhưng khó điều khiển hit-stop, hạt |

### 6.2 Lớp cảnh của một ải

| Lớp | Nội dung | Cỡ ảnh | Webp (ước) | Tốc độ trôi | Chế độ nhẹ |
|---|---|---|---|---|---|
| L0 Trời | Gradient vẽ bằng mã theo giờ (G6) | — | 0 KB | 0 | Giữ |
| L1 Xa | Núi, đảo xa, mờ | 2048 × 512, lặp ngang | 60–100 KB | 0,1× | Giữ |
| L2 Giữa | Rừng/kiến trúc đặc trưng đảo | 2048 × 640, lặp ngang | 100–160 KB | 0,35× | Giữ |
| L3 Đường | Mặt đường + mép đất | 2048 × 256, lặp ngang | 50–90 KB | 1× | Giữ |
| L4 Tiền cảnh | Bóng đen cỏ, đá (G4) | 1024 × 256, trong suốt | 20–40 KB | 1,4× | **Tắt** |
| Ánh sáng | 1 vệt sáng gradient tròn | vẽ bằng mã | 0 KB | — | **Tắt** |
| Sương xám (Gris) | Lớp phủ xám có mặt nạ | vẽ bằng mã, lưu canvas phụ | 0 KB | — | Đơn giản hoá: xám đều |

**Tổng ảnh nền một đảo: ~250–400 KB**, khớp ngân sách nền 200–400 KB của GDD 8.1. Thiết bị có `devicePixelRatio` ≥ 2 và không ở chế độ nhẹ mới tải bản 2048; còn lại tải bản 1024 (0,5×).

### 6.3 Sprite và "khung hình"

Ảnh máy vẽ khó ra chuỗi hình chạy nhất quán. Vì vậy **không dùng sprite sheet nhiều khung**; dùng **một ảnh tách nền + tween bằng mã** (M1, M2):

| Vật | Ảnh | Cỡ | Webp | "Khung hình" |
|---|---|---|---|---|
| Thần thú | Có sẵn `nho/thu-x-y` (đã webp) | 256–384 px | có sẵn | 1 ảnh; nhún 2,5 Hz, nghiêng ±4°, nén/giãn khi đáp; **2 ảnh** (thường / "cuồng nộ" `the-x-cuong-no`) |
| Quái đầu đàn | Mới | 512 × 512 | 40–60 KB | 1 ảnh + bản "nháy trắng" tạo bằng mã lúc nạp; thở (scale 1 ↔ 1,03, 1,6 s) |
| Trùm đảo | Mới | 768 × 768 | 80–120 KB | 1 ảnh + 4 vòng giáp (atlas) |
| Cổng / cửa | Atlas | 1024 × 1024 | 100–150 KB | Cửa đóng, cửa mở, bệ, ván cầu, ổ khoá |
| Hạt | Atlas nhỏ | 128 × 128 | 5 KB | 4 hình (lá, tia, bụi, tinh thể) |

**Nhịp:** game vẽ theo `requestAnimationFrame` (mục tiêu 60, sàn 30); tween tính theo thời gian thật, không theo số khung. Như Cuphead: chuyển động "có hồn" đến từ **đường cong và thời điểm**, không cần nhiều hình.

### 6.4 Hiệu ứng bật/tắt theo máy

Đo thời gian khung trong 3 giây đầu như GDD 8.1 (> 24 ms trung bình ⇒ chế độ nhẹ). Tôn trọng `prefers-reduced-motion`.

| Hiệu ứng | Thường | Nhẹ | Giảm chuyển động |
|---|---|---|---|
| Parallax 4 lớp | Bật | 3 lớp (bỏ L4) | Bật nhưng cuộn chậm 50% |
| Nhún chạy, nén/giãn | Bật | Bật | Tắt nghiêng, giữ nhún nhỏ |
| Hit-stop 80 ms | Bật | Bật | Bật (không gây chóng mặt) |
| Nháy trắng | Bật | Bật | Bật |
| Rung màn | Bật (chỉ trùm) | **Tắt** | **Tắt** |
| Hạt ≤ 12 | Bật | **Tắt** (thay bằng 1 vòng sáng) | Giảm còn 4 |
| Ánh sáng chồng | Bật | **Tắt** | Bật |
| Màu loang | Tween 800 ms | Hiện ngay | Hiện ngay |
| Nhạc nền | Bật | **Tắt** mặc định | Theo cài đặt |

### 6.5 Danh sách ảnh nhờ ChatGPT vẽ cho 1 đảo (mẫu: **Đảo Halogen**, lớp 10, chương 7)

**Cách giữ nhất quán phong cách:**
- Dán **cùng một "đoạn phong cách"** ở đầu mọi câu lệnh (bên dưới).
- Vẽ **L2 trước**, rồi đính kèm ảnh L2 khi xin các ảnh khác: "match the style of the attached image".
- Khoá **bảng màu** bằng mã hex cho mỗi quần đảo. Khởi Nguyên (lớp 10): nền giấy ngà, xanh lục nhạt Cl₂, nâu đỏ Br₂, tím I₂, xám đá.
- Ảnh lặp ngang: ChatGPT thường không vẽ được mép khớp nhau. Xử lý bằng mã: **nối ảnh với bản lật gương của nó** hoặc **phủ chuyển tiếp 64 px ở mép**.
- Ảnh nhân vật xin **nền trong suốt** (hoặc nền một màu phẳng rồi tách nền).

**Đoạn phong cách (dán đầu mỗi câu lệnh):**
```
Style: 2D side-view game art, soft painterly shapes with clean silhouettes, flat lighting with one warm rim light, limited palette (ivory #F3EBD8, pale chlorine green #C9E07A, bromine red-brown #9A3B1E, iodine violet #5B3F8C, slate grey #6E7680), no text, no letters, no UI, no logos, consistent with the attached reference.
```

| # | Ảnh | Dùng ở | Câu lệnh mẫu (tiếng Anh, sau đoạn phong cách) |
|---|---|---|---|
| 1 | L1 nền xa | Parallax xa | `Wide panorama 4:1, distant salt cliffs and misty sea at dusk, very low contrast, hazy, no foreground objects, horizontally continuous.` |
| 2 | L2 nền giữa | Parallax giữa | `Wide panorama 3:1, mid-ground of white salt crystal formations and old glass alchemy towers with pale green gas wisps, readable silhouettes, empty bottom 15% for the path.` |
| 3 | L3 mặt đường | Đường chạy | `Long horizontal strip 8:1, stone path of salt bricks seen from the side, top edge flat and walkable, simple texture.` |
| 4 | L4 tiền cảnh | Tiền cảnh | `Horizontal strip 4:1, pure black silhouettes of grass tufts and crystal shards along the bottom edge, transparent background.` |
| 5 | Quái đầu đàn "Sói Âm Điện" | Gác cổng | `Single character, a lean wolf made of pale green crystal with small lightning sparks, mischievous not scary, full body, side view facing left, transparent background.` |
| 6 | Trùm "Nữ Hoàng Clo" | Ải 6 | `Single character, a tall queen made of swirling pale green gas and white salt armor, calm and proud, kid-friendly, full body, front three-quarter view, transparent background.` |
| 7 | Quái thường Br⁻ / I⁻ | Hàng quái (LD-16) | `Two small round slime creatures, one red-brown, one violet, cute, side view, transparent background, same size.` |
| 8 | Atlas cổng | Cổng Phần I | `Sprite sheet on transparent background: one stone archway door closed, the same door open with light inside, a small stone pedestal, all same perspective, evenly spaced.` |
| 9 | Atlas cầu | Cổng Phần II | `Sprite sheet on transparent background: a wooden bridge segment, a plank with a carved check-mark shape, a plank with a carved cross shape, a cracked plank.` |
| 10 | Ổ khoá bể kính | Phòng Giả Kim | `A glass tank lock on a stone frame with a small water wheel beside it, liquid inside clear and colorless, side view, transparent background.` |
| 11 | 4 bình | Phòng Giả Kim | `Four identical-shaped glass flasks in a row, liquids: very pale violet, pale yellow-green, clear, clear. Side view, transparent background, no labels.` |
| 12 | Máy bắn đá | Cổng số | `A small bronze catapult with a dial gauge on its side, side view facing right, transparent background.` |
| 13 | Thẻ đảo | Bản đồ, Sổ luật | `Square island emblem, a salt crystal over sea waves with a green gas swirl, centered, flat background ivory.` |

Mỗi ảnh: xin cỡ lớn nhất, rồi **cắt, tách nền, nén webp chất lượng 0,8** bằng máy thầy; kiểm cỡ theo bảng 6.2–6.3. Ước tính mỗi đảo **13 ảnh**, **~600–800 KB** tổng (tải lười theo màn).

**Lưu ý chữ:** ChatGPT hay vẽ chữ giả lên hình. Đoạn phong cách đã ghi "no text, no letters". Chữ A–D, công thức, số **vẽ bằng mã** đè lên, để đúng chính tả Hoá và không ảnh nào mang đáp án.

---

## 7. Rủi ro và cách thử với 10–15 em

### 7.1 Rủi ro

| # | Rủi ro | Mức | Giảm thiểu |
|---|---|---|---|
| R1 | **"Bông cải phủ sô-cô-la"**: cổng là vỏ, em thấy vẫn là làm trắc nghiệm | Cao | Luật đảo LD hiện trên đường; cổng số có hướng sai; Phòng Giả Kim cho câu hiện tượng; đo bằng khảo sát + thời gian tự nguyện chơi (Habgood & Ainsworth dùng đúng chỉ số này) |
| R2 | **Hoạt ảnh ăn thời gian câu** | Cao | Ngân sách: vào ải ≤ 4 s, phản hồi ≤ 4 s, mọi thứ bấm để tua; đo tỉ lệ thời gian dành cho câu ≥ 65% |
| R3 | **Lộ đáp án qua hình** (vd. bình màu vàng lục quá "đẹp", em đoán theo hình) | Cao | Mọi bình/cửa cùng hình dạng, độ đẹp; đồ vật chỉ lặp lại thông tin có trong chữ phương án; thầy duyệt bảng `doVat`; không đặt nhãn đúng/sai vào tên tệp, URL |
| R4 | **Ảnh máy vẽ không đồng bộ** giữa các đảo | Vừa | Đoạn phong cách cố định, bảng màu hex, đính kèm ảnh mẫu; bóng đen tiền cảnh che chi tiết lệch |
| R5 | **Máy yếu giật** khi cuộn 4 lớp 2048 px | Vừa | Bản 1024 cho máy DPR thấp; chế độ nhẹ tự bật; đo FPS thật của em |
| R6 | **Đọc câu dài trên màn nhỏ** bị cảnh chiếm chỗ | Vừa | Cảnh thu còn dải 25% khi câu dài hơn ~400 ký tự; nút "Ẩn cảnh" |
| R7 | **Em giỏi chán** vì cảnh lặp | Thấp–vừa | 21 đảo khác cảnh; ★★★; quái phục thù có thoại mới; Ải của ngày |
| R8 | **Công sức ảnh** 21 đảo × 13 ảnh = 273 ảnh | Vừa | Làm 1 đảo trước để thử; đảo sau dùng lại atlas cổng, chỉ đổi nền và quái |

### 7.2 Cách thử (2 tuần, 10–15 em)

**Chuẩn bị:** 1 đảo (Halogen hoặc Kim Loại) dựng đủ B + cổng số + 2 phòng giả kim; 30–50 câu gắn mã bẫy (theo GDD MVP). Bản đối chứng: **cùng câu**, màn thẻ câu thuần như `TrongAi` hiện tại.

**Thiết kế:** mỗi em chơi **cả hai bản** (trong-đối-tượng), mỗi bản 2 buổi, đổi thứ tự giữa hai nửa nhóm (nửa A trước, nửa B trước) để trừ hiệu ứng làm quen.

| Đo | Cách lấy | Ngưỡng "đạt" (giả thuyết) |
|---|---|---|
| Tỉ lệ thời gian dành cho câu | Nhật ký thời điểm câu hiện → chốt | ≥ 65% |
| Thời gian vào ải + phản hồi | Nhật ký | ≤ 8 s mỗi ải |
| FPS thật | Đo thời gian khung, gửi kèm kết quả buổi | ≥ 30 trên ≥ 90% máy |
| Tỉ lệ tự sửa lỗi (T1 của GDD) | Sai → đúng ở lần gặp lại cùng mã bẫy | Bản B không thấp hơn bản đối chứng |
| Tự nguyện chơi thêm | Số em bấm "Thêm một chuyến" / "Thử sức thêm" | Bản B cao hơn rõ |
| Khảo sát 3 câu | "Vui không? Có thấy học được không? Có thấy rối/chậm không?" (thang 1–5) | Vui ≥ 4, Rối ≤ 2 |
| Phỏng vấn 5 phút với 4–5 em | Hỏi: chỗ nào muốn bấm tua, có đoán đáp án theo hình không | Không em nào nói "đoán theo hình" |

**Quyết định sau thử:** đạt ngưỡng ⇒ làm tiếp quần đảo Khởi Nguyên; tỉ lệ thời gian dành cho câu < 65% ⇒ cắt hoạt ảnh trước khi làm thêm; có em đoán theo hình ⇒ sửa R3 trước mọi việc khác.

---

## 8. Danh mục nguồn (tra 01/10/2026, chỉ đọc trích đoạn WebSearch)

**Game, doanh số, giải thưởng**
- Mario Wonder: shacknews.com/article/138621/super-mario-bros-wonder-q3-2024-sales · gamedeveloper.com/business/super-mario-bros-wonder-hits-4-3-million-sales-in-two-weeks
- Mario 1-1: gamedeveloper.com/design/how-miyamoto-built-i-super-mario-bros-i-legendary-world-1-1
- Bông hoa nói chuyện: gamedeveloper.com/design/the-talking-flowers-in-super-mario-bros-wonder-became-nintendo-s-very-own-mr-motivator · nintendo.com/us/whatsnew/ask-the-developer-vol-11-super-mario-bros-wonder-part-3/
- Hollow Knight: vgchartz.com/article/465558/hollow-knight-has-sold-over-15-million-units/ · gamesradar.com (leftover lunches, 15 million)
- Silksong: en.wikipedia.org/wiki/Hollow_Knight:_Silksong · gamesradar.com (release date September 4) · resetera.com (7 triệu, diễn đàn, cảnh giác)
- Hollow Knight cảm giác đòn: gamedev.net/tutorials/game-design/game-design-and-theory/hollow-knight-design-critique-r4996 · faculty.washington.edu/zkwen/articles/lin22features.pdf
- Celeste: x.com/MaddyThorson/status/1238338575545978880 (buffering) · x.com/maddythorson/status/1238338578310000642 (corner correction) · gigazine.net/gsc_news/en/20200317-celeste-action-feel-things/ · celeste.ink/wiki/Assist_Mode · gamedeveloper.com (Celeste's remarkably granular Assist options) · gamepressure.com; nintendosoup.com (doanh số) · **threadreaderapp.com: WebFetch bị chặn (EGRESS_BLOCKED)**
- Ori: news.xbox.com/en-us/2015/03/17/games-the-artwork-of-ori-and-the-blind-forest/ · gamesradar.com (Golden Joystick) · en.wikipedia.org/wiki/Ori_and_the_Will_of_the_Wisps · nme.com (Ivor Novello)
- Rayman Legends: en.wikipedia.org/wiki/Rayman_Legends · mycplus.com (UbiArt)
- Cuphead: unity.com/made-with-unity/cuphead · gamesradar.com/the-making-of-cuphead/ · gamedeveloper.com (5 million copies in two years)
- Dead Cells: gamedeveloper.com/production/art-design-deep-dive-using-a-3d-pipeline-for-2d-animation-in-i-dead-cells-i- · pcgamer.com/dead-cells-sells-over-10-million/
- Terraria: gamesradar.com (70 million) · vgchartz.com/article/467843
- Limbo: gamespot.com/articles/playdead-on-limbos-puzzles/1100-6301771/ · en.wikipedia.org/wiki/Limbo_(video_game) · cinematicplatformers.com/games/limbo/
- Inside: engadget.com/2017-04-07-bafta-games-awards-2017-winners.html · dfi.dk/en/english/inside-game-wins-four-baftas
- Gris: thisiscolossal.com/2018/09/gris-video-game-by-nomada-studio/ · en.wikipedia.org/wiki/Gris · catalannews.com (Game Award for Impact)
- Shovel Knight: yachtclubgames.com/blog/breaking-the-nes/ · gamedeveloper.com/design/breaking-the-nes-for-shovel-knight
- Undertale: en.wikipedia.org/wiki/Undertale · steampageanalyzer.com (ước lượng, cảnh giác)
- Zelda: zelda.fandom.com/wiki/Big_Key · zeldadungeon.net · en.wikipedia.org/wiki/The_Legend_of_Zelda:_Link's_Awakening_(2019_video_game) · nintendoeverything.com (Aonuma on art style)
- Spelunky 2: en.wikipedia.org/wiki/Spelunky_2 · gamedeveloper.com (Spelunky's new Daily Challenge)
- Super Meat Boy: en.wikipedia.org/wiki/Super_Meat_Boy · godisageek.com/2010/10/super-meat-boy-review/
- Katana Zero: en.wikipedia.org/wiki/Katana_Zero · katana-zero.fandom.com
- Hades: x.com/SupergiantGames/status/1307744738552938496 · pcgamer.com (1 million) · en.wikipedia.org/wiki/Hades_(video_game)
- Kingdom Rush: en.wikipedia.org/wiki/Kingdom_Rush · pocketgamer.com/kingdom-rush/basic-strategies/
- Angry Birds: techcrunch.com/2012/05/09/angry-birds-games-catapults-itself-to-one-billion-downloads · mobidictum.com/the-slingshot-formula/
- Cut the Rope: play.google.com/store/apps/details?id=com.zeptolab.ctr.ads · cuttherope.fandom.com
- Alto: altosodyssey.com/press/ · en.wikipedia.org/wiki/Alto's_Odyssey
- Monument Valley: en.wikipedia.org/wiki/Monument_Valley_(video_game) · cultofmac.com/news/inside-monument-valley · gamedeveloper.com (revenues top $14 million) · mcvuk.com
- Donkey Kong Country: en.wikipedia.org/wiki/Donkey_Kong_Country · racketboy.com
- Kirby: nintendolife.com/news/2023/09/random-kirbys-dream-land-is-all-about-being-kind-to-beginners-says-sakurai · remptongames.com/2022/10/03/how-masahiro-sakurai-makes-games-game-designer-spotlight/
- Loại: Sonic Mania (en.wikipedia.org/wiki/Sonic_Mania) · Blasphemous (baike.baidu.com; kickstarter.com) · Stardew Valley (pocketgamer.biz)

**Game feel và kỹ thuật**
- Juice It or Lose It (Jonasson & Purho, 2012): gdcvault.com/play/1016487/juice-it-or-lose · valdemird.com/blog/game-feel-on-the-web/
- The Art of Screenshake (Nijman, 2013): archive.org/details/the-art-of-screenshake
- PixiJS hiệu năng: pixijs.com/8.x/guides/concepts/performance-tips · pixijs.download/dev/docs/scene.TilingSprite.html

**Học tập**
- Habgood & Ainsworth (2011), *Journal of the Learning Sciences* 20(2), 169–206: shura.shu.ac.uk/3556/1/Habgood_Ainsworth_final.pdf (trích đoạn)
