# Tinh tuý game theo lượt → kế thừa cho app học Hoá THPT

*Nghiên cứu ngày 01/10/2026 · chỉ đọc, không sửa repo · đối chiếu repo tại `origin/main` = `f562dd5`*

---

## 0. Phạm vi nguồn: đọc được gì, bị chặn gì

**Đọc thật bằng gì.** Mọi luận điểm về game và nghiên cứu ở đây lấy từ **trích đoạn kết quả WebSearch** (tiêu đề + đoạn tóm tắt do công cụ trả về) ngày **01/10/2026**. **WebFetch và curl bị proxy chặn (403, "egress blocked")** với mọi trang đã thử: en.wikipedia.org, gamedeveloper.com, localthunk.com, doi.org, pmc.ncbi.nlm.nih.gov, link.springer.com, gamesradar.com, pcgamer.com, store.steampowered.com, blakecrosley.com. Nghĩa là:

- Tôi **không** đọc toàn văn bài review hay bài báo nào. Chỉ đọc đoạn trích hiện trong kết quả tìm kiếm. Câu nào trong tài liệu này ghi "theo review X" thì nghĩa là "theo trích đoạn của review X trong kết quả tìm kiếm".
- Số liệu (doanh số, người chơi, tỉ lệ review) chỉ ghi khi đoạn trích nêu rõ, kèm URL. **Không có số retention độc lập nào** cho các game này. Số liệu của Duolingo là **do chính Duolingo công bố**, chưa được bình duyệt.
- DOI: có loại **thấy trong kết quả tìm kiếm** (đánh dấu ✔) và loại **ghi theo trí nhớ** (đánh dấu ◇, chưa mở được doi.org để đối chiếu, cần kiểm lại trước khi trích dẫn chính thức).

Mọi URL bên dưới: truy cập 01/10/2026.

---

## 1. Danh sách game và tiêu chí chọn

**Tiêu chí.** Game được chọn khi đạt ít nhất hai trong ba điều:
(a) có giải thưởng lớn hoặc điểm review cao, có nguồn;
(b) ảnh hưởng rõ đến một thể loại (người khác bắt chước cơ chế);
(c) độ phổ biến có nguồn (doanh số, người chơi đồng thời).
Ưu tiên ra mắt 2023–2026. Chỉ giữ bản kinh điển khi cơ chế lõi của nó vẫn là chuẩn đang được chép.

| # | Game (năm) | Lý do chọn (có nguồn) | Nhóm cơ chế chính |
|---|---|---|---|
| 1 | **Balatro** (2024) | Đoạt 4 giải GDC Awards 2025, gồm Game of the Year, Best Design, Innovation [gamingamigos.com/post/balatro-wins-gdc-awards]; bán > 5 triệu bản tính đến 01/2025, chưa gồm Apple Arcade [gematsu.com/2025/01/balatro-sales-top-five-million; playstack.com/news/balatro-5-million-copies-sold] | Combo nhân số, chuyến ngắn, cảm giác "juice" |
| 2 | **Slay the Spire** (2019) + **Slay the Spire 2** (Early Access 05/03/2026) | StS2 bán 3 triệu bản trong tuần đầu, hơn 570 nghìn người chơi đồng thời, 25 triệu lượt chơi chuyến [pcgamer.com/…slay-the-spire-2-sold-3-million…; gosugamers.net/…78130…]; review Steam 97% tích cực ngày đầu [notebookcheck.net/…175-000-players…]. Đây là game gốc của "ý đồ địch" (intent) | Ý đồ địch, bản đồ rẽ nhánh, chọn 1 trong 3 |
| 3 | **Into the Breach** (2018, Advanced Edition 2022) | BAFTA Games 2019, hạng Original Property [bafta.org/…british-academy-games-awards-in-2019] | Thông tin đầy đủ, thua mà hiểu, lùi một lượt |
| 4 | **Monster Train 2** (05/2025) | 95% trên 5.062 review Steam "Overwhelmingly Positive", 500 nghìn người chơi [pcgamesn.com/monster-train-2/steam-reviews-player-count; pcgamesn.com/monster-train-2/roadmap-updates-dlc] | Ghép 2 phe, phòng thủ nhiều tầng |
| 5 | **Baldur's Gate 3** (2023) | GOTY The Game Awards 2023, GOTY Steam Awards 2023 [deadline.com/2023/12/game-awards-2023-winners-list…; pcgamer.com/…2023-steam-awards] | Lựa chọn có hệ quả, xúc xắc minh bạch |
| 6 | **Metaphor: ReFantazio** (10/2024) | 1 triệu bản ngày đầu, game Atlus bán nhanh nhất [pcgamer.com/…fastest-selling-game-in-atlus-history…] | Thêm lượt khi đánh vào điểm yếu, lịch có hạn, gắn bó nhân vật |
| 7 | **Unicorn Overlord** (03/2024) | 1 triệu bản sau 6 tháng [gamedeveloper.com/business/unicorn-overlord-sells-over-1-million…] (đọc qua trích đoạn) | Chuẩn bị trước trận (lập trình chiến thuật) |
| 8 | **Honkai: Star Rail** (2023) | Game theo lượt trên di động phổ biến; dùng để **đối chiếu mặt trái** (gacha) [pcgamesn.com/honkai-star-rail/review] | Phá điểm yếu, thanh thứ tự lượt |
| 9 | **Pokémon Champions** (04/2026) / dòng chính | Dòng game theo lượt lâu đời nhất còn sống; Champions là bản thuần đấu theo lượt [gamespot.com/reviews/pokemon-champions-review…; gameinformer.com/review/pokemon-champions/…]. Ghi chú: Legends Z-A (10/2025) chuyển sang **thời gian thực** [gamespot.com/reviews/pokemon-legends-z-a-review…] | Bảng khắc chế hệ, chuẩn bị đội |
| 10 | **Darkest Dungeon II** (2023) | Hơn 600 nghìn bản tính đến 06/2023 [gameworldobserver.com/2023/06/08/darkest-dungeon-ii-sales-600k…] | Căng thẳng, quan hệ trong đội, hành trình |
| 11 | **Marvel Snap** (2022) | Trận trung bình 3 phút, lượt diễn ra đồng thời, nút "Snap" nhân đôi tiền cược [gamesbeat.com/ben-brode-bets-super-speed…; mobilegamer.biz/second-dinners-ben-brode…] | Ván ngắn, đặt cược tự tin |
| 12 | **Hearthstone** (2014–nay), cơ chế **Discover** + chế độ Battlegrounds | Discover (chọn 1 trong 3) "không thẻ nào bị giảm sức mạnh" mà vẫn được dùng rộng [hearthstonetopdecks.com/discover-an-ode…; hs.cardsrealm.com/…story-behind-discover…] | Ngẫu nhiên có quyền chọn |
| 13 | **Fire Emblem Engage** (2023) | Review khen hệ chiến đấu "masterful" [mobilesyrup.com/2023/01/17/fire-emblem-engage…] | Tam giác vũ khí + Break, hội thoại hỗ trợ |
| 14 | **Clair Obscur: Expedition 33** (04/2025) | GOTY The Game Awards 2025, 9 giải, nhiều nhất lịch sử lễ trao giải [techradar.com/…the-game-awards-2025-winners-list…]; GOTY GDC Awards 2026 [invenglobal.com/articles/20309]; 5 triệu bản tính đến 10/2025 [engadget.com/…five-million-copies…] | Lượt có phản xạ (né, đỡ) |
| 15 | **Blue Prince** (04/2025) *(thay Civilization VII)* | Best Design và Innovation, GDC Awards 2026 [invenglobal.com/articles/20309]; roguelike giải đố mỗi ngày 50 bước [gamespot.com/reviews/blue-prince-review…] | Kiến thức là thứ mang theo được, sổ ghi chép |
| — | **Civilization VII** (02/2025) *(chỉ làm phản ví dụ)* | Steam "Mixed", 47% trên 32.873 review; review gần đây xuống 38% [pcgamesn.com/civilization-vii/rating-steam] | Cảnh báo: thời kỳ "reset" làm mất cảm giác tiến bộ |
| — | **Wordle / Duolingo** (đối chiếu học tập) | Wordle cố ý chỉ 1 câu/ngày, không quảng cáo, không thông báo [techcrunch.com/2022/01/12/josh-wardle-interview-wordle]; Duolingo thử chuỗi ngày và bùa nghỉ cuối tuần [blog.duolingo.com/how-streaks-keep-duolingo-learners…] | Vòng thói quen, điểm dừng |

**Vì sao đổi Civilization VII lấy Blue Prince.** Civ VII là game theo lượt lớn nhất năm 2025, nhưng đón nhận yếu. Trên Steam, phàn nàn tập trung vào hệ "Thời kỳ": sang thời kỳ mới "giống như reset" [pcgamesn.com/civilization-vii/rating-steam; steamcommunity.com/app/1295660/discussions/2/598519626423380103]. Bài học này nằm ở phần "điều KHÔNG làm". Blue Prince hợp với app hơn ở một điểm: **thứ người chơi mang theo giữa các ngày chủ yếu là hiểu biết**, không phải chỉ số.

---

## 2. Từng game: vòng chơi, tinh tuý, khoảnh khắc, mặt trái, mức chuyển sang Hoá

Thang "mức chuyển sang Hoá": ★★★ chuyển gần nguyên vẹn · ★★ chuyển được nếu đổi vỏ · ★ chỉ học tinh thần · ✗ không nên chuyển.

### 2.1 Balatro
- **Vòng lõi.** Đánh 5 lá poker để vượt mốc điểm của mỗi "blind" (vòng thử thách). Giữa các vòng mua Joker (lá bổ trợ) ở cửa hàng. Điểm của một tay bài = Chips × Mult.
- **Tinh tuý.**
  1. **Công thức điểm hai thừa số, dễ đọc.** ×Mult mạnh hơn +Mult rất nhiều: ×3 biến 100 thành 300, còn +10 Mult chỉ biến 100 thành 110 [gamedatacentral.com/guides/balatro-beginners-guide-how-scoring-actually-works].
  2. **Joker đơn giản nhưng phối hợp sinh tổ hợp vô tận.** Mỗi Joker có hiệu ứng ngắn. Ba Joker tương tác tạo ra số tổ hợp mà người chơi chưa khám phá hết sau 50 giờ [blakecrosley.com/guides/design/balatro].
  3. **"Juice": phản hồi nghe-nhìn là sản phẩm chính.** Phép tính khô được biến thành "pháo hoa" [blakecrosley.com/guides/design/balatro].
  4. **Dựng lối chơi (build)** quanh một loại tay bài hoặc chất bài [goombastomp.com/how-balatro-became-one-of-the-most-addictive-roguelikes].
- **Khoảnh khắc điển hình.** Tay "Lá cao" (High Card) tầm thường, nhờ thứ tự +Mult rồi ×Mult rồi kích hoạt lại, nổ thành điểm lớn hơn cả Thùng phá sảnh [gamedatacentral.com].
- **Mặt trái.** Game ẩn ô xem trước điểm để tạo hồi hộp, người chơi phải tự tính [gmtk.substack.com/p/balatros-cursed-design-problem]. Về sau con số tăng đến mức phải ghi kiểu khoa học (từ Ante 14). Có bài phân tích xếp Balatro vào "game may rủi" vì vỏ poker [mechanicsofmagic.com/2026/05/22/critical-play-…-balatro].
- **Mức chuyển: ★★.** Nên lấy phép nhân **hiện rõ** (sát thương = nền × hệ số) và juice. Không lấy vỏ cờ bạc.

### 2.2 Slay the Spire / Slay the Spire 2
- **Vòng lõi.** Leo tháp theo bản đồ rẽ nhánh. Mỗi trận dùng tay 5 lá, 3 năng lượng. Thắng trận thì chọn 1 trong 3 lá bài thưởng. Tinh anh (elite) cho cổ vật, lửa trại cho chọn hồi máu hoặc nâng cấp.
- **Tinh tuý.**
  1. **Ý đồ địch (intent).** Biểu tượng trên đầu quái cho biết **chính xác** lượt tới nó làm gì. Nhờ đó có chiều sâu chiến thuật: biết trước để chọn chặn hay dồn sát thương [slay-the-spire.fandom.com/wiki/Intent; gordianblade.com/reveal-enemy-intents…].
  2. **Bản đồ rủi ro/phần thưởng.** Tinh anh rủi ro cao, thưởng cao. Ngay trước trùm luôn có lửa trại. Người chơi nên "lập đường đi ngược từ đích" [arxiv.org/html/2504.03918v1; sts2.untapped.gg/…map-choices…].
  3. **Lửa trại: chọn hồi máu hay nâng cấp.** Một quyết định nhỏ, hệ quả rõ [sts2guides.com/en/guides/pathing.html].
  4. **Cân bằng dựa trên số liệu**, có bài GDC riêng [gdcvault.com/play/1025731/-Slay-the-Spire-Metrics].
  5. **StS2 thêm co-op 4 người** và được khen "quen thuộc nhưng đầy ý mới" [gamesradar.com/slay-the-spire-2-review/].
- **Khoảnh khắc điển hình.** Quái báo "đánh 24". Em có 3 năng lượng: hoặc chặn đủ 24, hoặc dồn hạ nó trước khi nó ra tay.
- **Mặt trái.** Mỗi chuyến dài 45–90 phút. Bộ bài phình to nếu nhận thưởng bừa [sts2.untapped.gg].
- **Mức chuyển: ★★★.** Lấy ý đồ địch, bản đồ rẽ nhánh, chọn 1 trong 3.

### 2.3 Into the Breach
- **Vòng lõi.** Bàn cờ 8×8, ba robot. Quái báo trước ô sẽ đánh. Lượt của em là phản ứng với kế hoạch đó: đẩy quái lệch hướng, chặn, cứu nhà dân.
- **Tinh tuý.**
  1. **Thông tin đầy đủ.** Đầu mỗi lượt, người chơi biết chính xác quái sẽ làm gì [gamedeveloper.com/…road-to-the-igf-subset-games…] (đọc qua trích đoạn).
  2. **"Chết là do mình."** Nhà phát triển muốn mọi thất bại đều do lỗi của người chơi, nên giảm ngẫu nhiên so với FTL (cùng nguồn).
  3. **Mỗi trận là một câu đố**: phải "nghiên cứu rồi giải" [shacknews.com/article/99108].
  4. **Lùi thời gian một lần mỗi trận** để thử lại một lượt [gamespot.com/reviews/into-the-breach-advanced-edition-review…].
- **Khoảnh khắc điển hình.** Đẩy một con quái vào đúng ô mà con quái khác sắp bắn, hạ hai con bằng một nước.
- **Mặt trái.** Khó. Có review gọi đây là "câu đố" hơn là thử thách võ nghệ [squareblind.wordpress.com/2018/09/29/into-the-breach…], nên ai không thích giải đố sẽ chán.
- **Mức chuyển: ★★★.** "Thua mà hiểu" và "lùi một lần" khớp thẳng với phản hồi sửa lỗi.

### 2.4 Monster Train 2
- **Vòng lõi.** Đoàn tàu 4 tầng, lò lửa (pyre) ở tầng trên cùng. Quái leo từ dưới lên mỗi lượt. Đầu chuyến em chọn **2 phe** (phe chính + phe đồng minh) [gamesradar.com/games/roguelike/monster-train-2-review/; fullcleared.com/reviews/monster-train-2-review/].
- **Tinh tuý.** Ghép hai phe nên lúc nào cũng có một tổ hợp mới. Có nhiều tầng để phân bổ lực. Game Informer gọi đây là "Engine Ingenuity" (khéo dựng cỗ máy) [gameinformer.com/review/monster-train-2/engine-ingenuity].
- **Khoảnh khắc điển hình.** Một tầng chặn bằng giáp trong khi tầng sau nuôi bầy quân "lăn cầu tuyết" [railtools.net/monster-train-2/pairings/].
- **Mặt trái.** Nhiều chữ, nhiều từ khoá. Cutscene bị chê [fullcleared.com].
- **Mức chuyển: ★★.** Ý "đội nhiều ghế, mỗi tầng một việc" đã có trong Đoàn Hộ Tống (2–4 ghế).

### 2.5 Baldur's Gate 3
- **Vòng lõi.** RPG theo lượt dựa trên D&D. Mọi hành động lớn là một lần đổ xúc xắc d20, hiện rõ số cần đạt. Cốt truyện rẽ nhánh lớn.
- **Tinh tuý.** Tự do lựa chọn và hệ quả kéo dài [screenrant.com/baldurs-gate-3-2023-goty-award-game-year/; beebom.com/…]. Xác suất minh bạch: em biết mình cần đổ ≥ 12.
- **Khoảnh khắc điển hình.** Đổ trượt một lần thuyết phục, cả nhánh truyện rẽ theo hướng khác mà vẫn hay.
- **Mặt trái.** Rất dài (hàng trăm giờ). Cấu hình máy nặng.
- **Mức chuyển: ★.** Chỉ lấy tinh thần "con số cần đạt hiện ra trước khi làm".

### 2.6 Metaphor: ReFantazio
- **Vòng lõi.** Theo lượt kiểu Press Turn: đánh trúng điểm yếu thì **được thêm lượt**, địch cũng vậy, nên trận nhanh và tàn nhẫn. Lịch có hạn: mỗi chuyến đi đều tốn thời gian trước ngày bầu vua. Hệ Archetype (lớp nhân vật) và Follower (quan hệ) [techradar.com/gaming/metaphor-refantazio-review; gamingtrend.com/reviews/metaphor-refantazio-review-living-the-dream].
- **Tinh tuý.**
  1. Thưởng cho **hiểu điểm yếu**, không cho cày.
  2. Archetype cho phép tuỳ biến đội "chưa từng có".
  3. Quan hệ với nhân vật mở thêm sức mạnh.
  4. Lịch có hạn khiến mỗi ngày có sức nặng.
- **Khoảnh khắc điển hình.** Tìm ra điểm yếu của trùm, chuỗi thêm lượt kết thúc trận trong một vòng.
- **Mặt trái.** Lịch có hạn tạo áp lực, game dài.
- **Mức chuyển: ★★.** Lấy "đánh đúng chỗ yếu thì thêm lượt". Không lấy lịch ép giờ.

### 2.7 Unicorn Overlord
- **Vòng lõi.** Trước trận, em lập "chiến thuật" cho từng đơn vị (kỹ năng + tối đa 2 điều kiện + thứ tự ưu tiên, giống Gambit của FF12). Trong trận chỉ điều quân trên bản đồ; các cuộc đấu tự diễn ra [nintendolife.com/reviews/nintendo-switch/unicorn-overlord; destructoid.com/unicorn-overlord-details…].
- **Tinh tuý.** Phần lớn quyết định nằm ở khâu **chuẩn bị** [fullcleared.com/reviews/unicorn-overlord-review/]. Ghép điều kiện ra tổ hợp mạnh. Trận ngắn ("bite-sized").
- **Khoảnh khắc điển hình.** Đặt "nếu địch là kỵ binh thì dùng giáo trước": trận tự diễn, đúng y như em tính.
- **Mặt trái.** Menu dày, người mới ngợp.
- **Mức chuyển: ★★.** Khớp với việc "chuẩn bị trước trận" mà app chưa có. Bản Hoá: em xem trước 4 ý của trùm và chọn ai giữ ý nào.

### 2.8 Honkai: Star Rail
- **Vòng lõi.** Theo lượt, chỉ số SPD quyết định thứ tự. Đánh đúng hệ thì phá thanh cứng (toughness) và đẩy lượt địch lùi lại.
- **Tinh tuý.** Thanh thứ tự lượt nhìn thấy được. Phá điểm yếu cho cảm giác "hiểu thì thắng". Chất lượng tiện ích cao [pcgamesn.com/honkai-star-rail/review].
- **Mặt trái.** Có review chê phá điểm yếu "nông", trận lặp lại [wccftech.com/review/honkai-star-rail-trails-of-mediocrity/]. **Gacha được gọi là "bản chất săn mồi"** [pcgamesn.com/honkai-star-rail/review].
- **Mức chuyển: ✗ cho gacha. ★ cho thanh thứ tự lượt.**

### 2.9 Pokémon (Champions 2026; dòng chính Scarlet/Violet)
- **Vòng lõi.** Đội 6 con, đấu theo lượt, 18 hệ khắc chế lẫn nhau. Champions bỏ phiêu lưu, chỉ còn đấu [gamesradar.com/games/pokemon/pokemon-champions-guide/].
- **Tinh tuý.** **Bảng khắc chế** là kiến thức có quy luật để thuộc. Chuẩn bị đội quyết định nhiều. Hệ thống được "tinh luyện cao" [gamespot.com/reviews/pokemon-champions-review…].
- **Mặt trái.** Champions bị chê giải thích kém và cấu trúc free-to-play "lấn át" (Game Informer 7/10) [gameinformer.com/review/pokemon-champions/it-hurt-itself-in-its-confusion].
- **Mức chuyển: ★★.** "Bảng khắc chế" rất gần với Hoá: chất nào phản ứng với chất nào, dãy hoạt động hoá học. Nhưng cần nhãn chủ đề mà app chưa có.

### 2.10 Darkest Dungeon II
- **Vòng lõi.** Chuyến xe ngựa qua địa ngục. Đội 4 người có thanh căng thẳng (stress) và quan hệ với nhau. Một người suy sụp làm mất quan hệ với cả đội [rpgfan.com/review/darkest-dungeon-ii/; rogueliker.com/darkest-dungeon-ii-review/].
- **Tinh tuý.** Nhân vật có cảm xúc nên em gắn bó. Hành trình có nhịp lên xuống.
- **Mặt trái.** Cân quan hệ "mệt"; cảm giác tiêu cực "gần như không tránh được" [hardcoregamer.com/reviews/review-darkest-dungeon-ii/440887/].
- **Mức chuyển: ★.** Lấy gắn bó nhân vật. **Không** lấy cơ chế phạt bằng căng thẳng.

### 2.11 Marvel Snap
- **Vòng lõi.** 6 lượt, bộ 12 lá, hai bên ra bài **cùng lúc**, ván khoảng 3 phút. Nút **Snap** nhân đôi cược; đối thủ chọn rút lui hoặc theo [gamesbeat.com/ben-brode-bets-super-speed…; mobilegamer.biz/second-dinners-ben-brode-reveals…].
- **Tinh tuý.**
  1. Ván cực ngắn.
  2. Lượt đồng thời nên không phải chờ.
  3. Snap biến **mức tự tin** thành quyết định có hệ quả.
  4. Công thức thiết kế ghép từ backgammon, board game, Clash Royale (cùng nguồn).
- **Khoảnh khắc điển hình.** Snap ở lượt 4 khi chắc thắng, đối thủ rút lui, em được cược đôi.
- **Mặt trái.** Mô hình tiền tệ và cày bộ sưu tập bị một số người bỏ cuộc vì nó [thomashvizdos.substack.com/p/im-done-playing-marvel-snap] (chỉ thấy tiêu đề).
- **Mức chuyển: ★★★ cho "đặt cược tự tin".** Khớp với hiệu ứng sửa lỗi siêu mạnh (hypercorrection), xem mục 4.

### 2.12 Hearthstone: Discover và Battlegrounds
- **Tinh tuý.** Discover là chọn 1 trong 3 lá ngẫu nhiên: thêm biến số mà **không lấy mất quyền chọn** [hs.cardsrealm.com/…story-behind-discover…]. Battlegrounds cho mỗi ván một cảm giác khác, vào chơi ngay không cần tự xây bộ bài, người mới cũng có cơ hội ngang nhau [us.forums.blizzard.com/…why-is-battlegrounds-so-popular] (nguồn diễn đàn, tin cậy thấp).
- **Mặt trái.** Đội phát triển coi ngẫu nhiên là nguồn "câu chuyện" [pcgamesn.com/hearthstone/hearthstone-dev-communication…], nhưng người chơi hay bực vì thua do may rủi.
- **Mức chuyển: ★★★ cho "chọn 1 trong 3".**

### 2.13 Fire Emblem Engage
- **Tinh tuý.** Tam giác vũ khí (kiếm > rìu > giáo > kiếm). Đánh đúng khắc chế thì gây **Break**: địch bị tước vũ khí, không phản đòn được [rpgfan.com/review/fire-emblem-engage/; mobilesyrup.com/2023/01/17/…]. Hội thoại hỗ trợ giữa các nhân vật.
- **Mặt trái.** Hội thoại hỗ trợ ngắn, ít đào sâu [rpgfan.com].
- **Mức chuyển: ★★.** "Đúng khắc chế thì tước phản đòn" giống "đúng thì quái không đánh được hiệp này".

### 2.14 Clair Obscur: Expedition 33
- **Vòng lõi.** Theo lượt, nhưng đến lượt địch thì em **né hoặc đỡ** theo nhịp. Đỡ thành công được điểm hành động [gamespot.com/reviews/clair-obscur-expedition-33-review…; xboxtavern.com/clair-obscur-expedition-33-review/].
- **Tinh tuý.** Em không ngồi chờ lượt địch, vẫn có việc để làm. Lỡ nhịp vẫn còn công cụ gỡ lại [fextralife.com/clair-obscur-expedition-33-review/].
- **Mặt trái.** Đòi phản xạ và hình ảnh nặng.
- **Mức chuyển: ★ (ý tưởng) / ✗ (phản xạ).** Lấy ý "trong lượt địch em vẫn có việc". App đã làm đúng điều này ở Bi-a: em giải trước trong lượt đối thủ. **Không** lấy QTE phản xạ: máy yếu, và phản xạ không đo được năng lực Hoá.

### 2.15 Blue Prince
- **Vòng lõi.** Mỗi ngày có 50 bước. Mở cửa thì chọn 1 trong 3 phòng để "vẽ" vào dinh thự. Hết bước thì ngủ, ngày mai dinh thự trở lại từ đầu [gamespot.com/reviews/blue-prince-review…; adventuregamehotspot.com/review/4117/blue-prince].
- **Tinh tuý.** **Thứ mang theo là kiến thức**, người chơi được khuyến khích ghi chép [finalweapon.net/2025/04/14/blue-prince-review-home-sweet-maze/]. Mỗi ngày có điểm dừng rõ.
- **Mặt trái.** Dễ bế tắc. Phụ thuộc may rủi khi rút phòng.
- **Mức chuyển: ★★★.** Đây đúng là bản chất học: "Sổ tay mẹo của em" là vật phẩm mang theo được.

### 2.16 Đối chiếu: Wordle và Duolingo
- **Wordle.** Wardle muốn "ba phút mỗi ngày và chỉ thế thôi". Không vô tận, không quảng cáo, không thông báo. Cả thế giới giải cùng một câu nên sinh ra chuyện để kể với nhau [techcrunch.com/2022/01/12/josh-wardle-interview-wordle; gamedeveloper.com/marketing/josh-wardle-reflects…].
- **Duolingo.** Duolingo tự công bố, chưa bình duyệt:
  - nhóm được thử bùa nghỉ cuối tuần có khả năng quay lại sau 1 tuần cao hơn 4%, ít mất chuỗi hơn 5%;
  - người học "cày dồn" bỏ app nhiều hơn người học đều đặn [blog.duolingo.com/how-streaks-keep-duolingo-learners…, qua trích đoạn];
  - cho giữ 2–3 lần đóng băng chuỗi thay vì 1 làm tăng quay lại [getrecall.ai/summary/lennys-podcast/…].

  Phía phê bình: chuỗi khiến người học coi **con số** là mục tiêu thay vì việc học; mất chuỗi dễ dẫn đến bỏ hẳn ("abstinence violation effect") [lexontech.org/streaks-considered-harmful; professorgame.com/podcast/423/].
- **Mức chuyển: ★★★ cho điểm dừng rõ và chuỗi khoan dung.**

---

## 3. Tinh tuý xuyên game

| # | Tinh tuý | Thấy ở | Vì sao người chơi mê | Tương ứng khoa học học tập |
|---|---|---|---|---|
| T1 | **Ý đồ địch hiện rõ**: biết trước mối đe doạ để lập kế hoạch | Slay the Spire, Into the Breach, Star Rail (thanh lượt) | Biến trận thành câu đố, thua là do mình | Mục tiêu rõ, phản hồi về nhiệm vụ (Wisniewski 2020) |
| T2 | **Quyết định ngắn có hệ quả** (chặn hay đánh, nghỉ hay nâng cấp) | StS lửa trại, Marvel Snap, BG3 | Cảm giác tự chủ (autonomy) | SDT: tự chủ + năng lực dự báo mức vui thích (Ryan và cs. 2006) |
| T3 | **Combo / nhân số hiện rõ** | Balatro, Metaphor (thêm lượt), FE Break | "Pháo hoa" khi hiểu đúng cơ chế | Cần gắn với **đúng thật**, nếu không thành phần thưởng rỗng |
| T4 | **Chuyến ngắn có biến đổi** (roguelike) | StS, Balatro, Monster Train, Blue Prince | Mỗi lần một khác, "thêm một chuyến" | Xen kẽ, đa dạng hoá bối cảnh (Bjork 2011) |
| T5 | **Thua mà hiểu** (thông tin đầy đủ, lùi một lần) | Into the Breach | Công bằng nên muốn thử lại | Phản hồi sửa lỗi, học từ lỗi (Metcalfe 2017) |
| T6 | **Chọn 1 trong 3** (ngẫu nhiên có quyền chọn) | Hearthstone Discover, StS thưởng, Blue Prince | Bất ngờ mà vẫn tự quyết | Tự chủ; không làm giảm độ khó mong muốn |
| T7 | **Chuẩn bị trước trận** | Unicorn Overlord, Pokémon, Metaphor Archetype | Thấy kế hoạch của mình "chạy" | Lập kế hoạch, siêu nhận thức |
| T8 | **Đặt cược tự tin** | Marvel Snap | Mạo hiểm có kiểm soát | Hypercorrection, hiệu chỉnh độ tự tin |
| T9 | **Gắn bó nhân vật** | Metaphor Follower, DD2, FE hội thoại, Expedition 33 | Quan tâm đến ai đó trong game | SDT: gắn kết (relatedness) |
| T10 | **Juice** | Balatro, Expedition 33 | Hành động "có cảm giác" | Không có bằng chứng học trực tiếp; chỉ là chất xúc tác |
| T11 | **Kiến thức là vật phẩm** | Blue Prince, Pokémon bảng hệ | Tiến bộ thật, không thể "mua" | Luyện nhớ chủ động, tự giải thích (Dunlosky 2013) |
| T12 | **Vòng ngày + điểm dừng rõ** | Wordle, Duolingo, Blue Prince 50 bước | Không mệt, mai quay lại | Ôn cách quãng (Cepeda 2006) |

**Ba điều khiến game bị bỏ cuộc** (để tránh):
1. Phạt nặng kéo dài: căng thẳng DD2, mất chuỗi.
2. Ép tiền hoặc ép cày: gacha Star Rail, free-to-play của Champions.
3. Reset làm mất cảm giác tiến bộ: Civ VII.

---

## 4. Khoa học học tập liên quan

| Nguyên lý | Bằng chứng chính | Số liệu (từ trích đoạn) | Giới hạn cần nhớ |
|---|---|---|---|
| **Luyện nhớ chủ động (testing effect)** | Adesope, Trevisan & Sundararajan 2017, *Review of Educational Research* 87(3), 659–701, DOI 10.3102/0034654316689306 ✔ [eric.ed.gov/?id=EJ1141817; semanticscholar.org/…] | g ≈ 0,51 so với đọc lại; ≈ 0,93 so với không làm gì | Phần lớn nghiên cứu trong phòng thí nghiệm, bài ngắn. Trắc nghiệm có thể "dạy" nhầm phương án nhiễu nếu không có phản hồi |
| **Kỹ thuật học hiệu quả** | Dunlosky và cs. 2013, *Psychological Science in the Public Interest* 14, 4–58, DOI 10.1177/1529100612453266 ◇ [pubmed.ncbi.nlm.nih.gov/26173288/] | Luyện đề và học giãn cách được xếp "hữu ích cao"; xen kẽ "trung bình" | Tổng quan có đánh giá chủ quan |
| **Ôn cách quãng** | Cepeda, Pashler, Vul, Wixted & Rohrer 2006, *Psychological Bulletin* 132, 354–380, DOI 10.1037/0033-2909.132.3.354 ◇ [yorku.ca/ncepeda/publications/CPVWR2006.html; escholarship.org/uc/item/3rr6q10c] | 839 phép đo, 317 thí nghiệm | Chủ yếu nhớ từ ngữ; với giải bài toán Hoá nhiều bước thì bằng chứng ít hơn |
| **Xen kẽ** | Brunmair & Richter 2019, *Psychological Bulletin* 145(11), 1029–1052, DOI 10.1037/bul0000209 ◇ [researchgate.net/publication/335004545] | Toán: ~0,34 SD; **với từ ngữ thì hiệu ứng âm** | "Similarity matters": có lợi khi các dạng **dễ nhầm với nhau** (cùng là tính mol khí, khác chất). Không nên xen ngẫu nhiên mọi thứ |
| **Phản hồi** | Wisniewski, Zierer & Hattie 2020, *Frontiers in Psychology* 10:3087, DOI 10.3389/fpsyg.2019.03087 ◇ [semanticscholar.org/…; researchgate.net/publication/338745455] | Hiệu ứng mức trung bình. Trích đoạn nêu d ≈ 0,55, hoặc ≈ 0,42 khi loại nghiên cứu không có nhóm đối chứng. Tôi chưa đọc được tóm tắt gốc để đối chiếu | Dị biệt rất lớn. Phản hồi "giỏi lắm" kém xa phản hồi về nhiệm vụ và cách sửa |
| **Học từ lỗi, hypercorrection** | Metcalfe 2017, *Annual Review of Psychology*, DOI 10.1146/annurev-psych-010416-044022 ✔ [annualreviews.org/doi/pdf/10.1146/annurev-psych-010416-044022] | Lỗi sai khi **tự tin cao** được sửa và nhớ tốt hơn; mắc lỗi ở tình huống **ít rủi ro** có lợi | Cần phản hồi ngay và đúng. Lỗi ở bài kiểm tra có điểm thật thì gây lo âu |
| **Desirable difficulty** | Bjork & Bjork 2011, chương sách trong *Psychology and the Real World* (Worth), 56–64 [bjorklab.psych.ucla.edu/…; unh.edu/…bjork-and-bjork.pdf] | Giãn cách, xen kẽ, đa dạng hoá: chậm lúc học nhưng nhớ và chuyển giao tốt hơn | Khó phải "**vượt được**". Quá khó thì bỏ cuộc |
| **Productive failure** | Sinha & Kapur 2021, *Review of Educational Research* 91(5), 761–798, DOI 10.3102/00346543211019105 ✔ [journals.sagepub.com/doi/10.3102/00346543211019105] | d = 0,36 cho hiểu khái niệm và chuyển giao; mạnh hơn khi làm đúng nguyên tắc | Với HS nhỏ tuổi và kỹ năng chung thì đảo chiều. THPT nằm trong vùng có lợi |
| **Gamification (meta)** | Sailer & Homner 2020, *Educational Psychology Review* 32(1), 77–112, DOI 10.1007/s10648-019-09498-w ◇ [mendeley.com/catalogue/c8c24cbf…] | Hiệu ứng nhỏ đến vừa lên nhận thức, động lực, hành vi; **phụ thuộc yếu tố game được dùng** | Nghiên cứu ngắn hạn, chất lượng không đều. Hiệu ứng mới lạ có thể phai |
| **Gamification (tổng quan)** | Hamari, Koivisto & Sarsa 2014, HICSS, DOI 10.1109/HICSS.2014.377 ◇ [researchportal.tuni.fi/…] | Tác động tích cực nhưng **phụ thuộc bối cảnh và người dùng** | Tổng quan cũ, ít RCT |
| **Động lực chơi game (SDT)** | Ryan, Rigby & Przybylski 2006, *Motivation and Emotion* 30(4), 347–363, DOI 10.1007/s11031-006-9051-8 ◇ [semanticscholar.org/…]; Przybylski, Rigby & Ryan 2010, DOI 10.1037/a0019440 ✔ | Tự chủ, năng lực, gắn kết dự báo vui thích và ý định chơi tiếp | Người lớn, game thương mại |
| **Rương may rủi và cờ bạc** | Zendle & Cairns 2018, *PLOS ONE* 13(11) e0206767, DOI 10.1371/journal.pone.0206767 ✔; bản lặp lại 2019, DOI 10.1371/journal.pone.0213194 ✔ | Chi tiền cho rương may rủi liên hệ với mức cờ bạc có vấn đề; liên hệ này mạnh hơn các loại chi tiêu khác trong game | Tương quan, chưa chứng minh nhân quả. Đủ để **không làm** |

**Kết luận cho thiết kế.** Sức hút phải nằm **trong** hành động trả lời câu Hoá. Cụ thể là luyện nhớ, phản hồi sửa lỗi, xen kẽ các dạng dễ nhầm, giãn cách. Sức hút không được nằm **bên cạnh** việc học (rương, huy hiệu). Đây đúng là điều Sailer & Homner gợi ý: hiệu quả phụ thuộc yếu tố được dùng.

---

## 5. Kế thừa vào app hiện tại

### 5.1 Sự thật đã kiểm thêm trong repo (`origin/main` `f562dd5`)

- **Đoàn Hộ Tống** (`src/game/than-thu-v2/doan-core.ts`):
  - Hằng số: `SO_HIEP=8`, `HIEP_TRUM=[4,8]`, `NL_TOI_DA=3`, `NL_KY_NANG=2`, `CHAN=8`, `CONG_QUAI=4`, `HP_QUAI=24`, `SO_Y_TRUM=4`, `Y_VO_GIAP=3`, `CONG_TRUM_MOI_GIAP=8`, `SAT_THUONG_NEN=16`, hệ số `HE_DUNG=1.5`, `HE_LIEN_KICH=2`, `HE_AN_THACH=1.25`.
  - **Sát thương địch hoàn toàn tất định.** Hiệp thường: `linhTamMat = max(0, sốQuáiCònLại × 4 − tổngChắn)`. Hiệp trùm: `(4 − sốÝĐúng) × 8 + sốQuái × 4`, và = 0 nếu đúng ≥ 3 ý (vỡ giáp).
  - Quái sinh ra mỗi hiệp: 1 con mỗi ghế, tối đa 8 con.
  - **Vì vậy hiện được "ý đồ địch" chính xác mà không cần đổi luật**, chỉ cần tính và vẽ trước.
- **Bát Linh Đảo** (`dao2/dao2-core.ts`): `SO_AI_CHUYEN=6`. Mỗi ải có vai "Câu mới / Ôn lại / Trùm ải". Đã có `vungTheoDang` (vùng bản đồ theo dạng) và `henOnCua` (hẹn ôn của câu). Nghĩa là **đã có xen kẽ câu mới với câu ôn theo SRS**.
- **SRS theo câu**: `server/src/srs2-loi.ts` (cùng các tệp `srs2-gv.ts`, `srs2-game.ts`, `srs2-d1.ts`). Có trạng thái "Cần thầy dạy lại", dùng trong `src/components/hoa2/CauDaLam.tsx` và `cau-chuyen.ts`.
- **Đúng/sai do máy chủ chấm** (`NopHiep.dung`). "Tiếp sức" thì **không** ghi bằng chứng học (`tuLam=false`). Thiết kế đúng tinh thần, nên giữ.

### 5.2 Bảng ánh xạ

| Game | Tinh tuý | Chỗ trong app | Giữ / Sửa / Thêm | Việc học Hoá diễn ra ở đâu | Rủi ro | Cách đo |
|---|---|---|---|---|---|---|
| Slay the Spire, Into the Breach | Ý đồ địch hiện rõ | Đoàn Hộ Tống, đầu mỗi hiệp; trùm ải ở Đảo | **Thêm** | Em đọc mối đe doạ rồi chọn Đánh/Chắn/Kỹ năng. Hành động chỉ "nổ" khi câu đúng | Em chọn Chắn rồi làm qua loa | Tỉ lệ hiệp Linh Tâm mất máu; tỉ lệ đúng không đổi hoặc tăng |
| Marvel Snap + Metcalfe | Đặt cược tự tin | Mọi câu trong Đảo/Hộ Tống, nút "Chắc!" trước khi chốt | **Thêm** | Em tự đánh giá mức hiểu (siêu nhận thức). Sai mà đã "Chắc!" thì mở ngay "vì sao sai" | Thành "đoán liều để lấy ×2" | Độ hiệu chỉnh (tỉ lệ đúng khi "Chắc!" vs khi không); tỉ lệ đúng ở lần ôn sau của câu "Chắc! mà sai" |
| Into the Breach (thua mà hiểu) | Lỗi có tên + trận phục thù | KhungLoiGiai, Tu luyện | **Thêm** (cần mã lỗi theo đáp án sai, bài tương tự) | Đối chiếu bẫy; làm ngay câu cùng bẫy, khác số | Tốn công gắn nhãn | Tỉ lệ đúng câu tương tự sau bẫy; lặp lại cùng mã lỗi sau 7 ngày |
| StS bản đồ, Hearthstone Discover, Blue Prince | Rẽ nhánh và chọn 1 trong 3 | Bản đồ Đảo (giữa các ải) | **Sửa** | Em chọn ải "Tinh anh" (câu bậc cao) hay "Suối hồi" (ôn câu SRS) | Em né câu khó mãi | Tỉ lệ chọn Tinh anh; phân bố bậc câu đã làm |
| Balatro | Phép nhân hiện rõ, juice | Màn sát thương Hộ Tống/Đảo | **Sửa** (hiện `16 × 1,5 × 2 = 48`) | Không trực tiếp; làm rõ đúng ⇒ mạnh | Hiệu ứng nặng trên máy yếu | FPS hoặc thời gian khung trên máy thấp; thời gian từ chốt đến câu kế |
| Unicorn Overlord, Pokémon | Chuẩn bị trước trận | Trước hiệp trùm (4, 8) | **Thêm** (bước 20 giây: xem 4 ý, nhận ý) | Đọc lướt đề, tự đánh giá mình mạnh ý nào | Kéo dài thời gian | Thời gian hiệp trùm; tỉ lệ vỡ giáp |
| Blue Prince, Pokédex | Kiến thức là vật phẩm | "Sổ tay mẹo của em" ở Câu đã làm | **Thêm** (cần nhãn chủ đề) | Tự giải thích một câu sau khi khắc phục xong một dạng | Em chép bừa | Độ dài/chất lượng mẹo (thầy duyệt mẫu); tỉ lệ đúng dạng đó sau 14 ngày |
| Wordle, Duolingo | Điểm dừng rõ, chuỗi khoan dung | Sảnh Hoá 2.0, Chuỗi ngày, Rương Bát Linh | **Sửa** | Kế hoạch ngày vẫn do máy chủ quyết (SRS) | Bớt "kích thích" thì giảm ngày hoạt động | Số ngày hoạt động/tuần; tỉ lệ bỏ app sau khi đứt chuỗi |
| Metaphor (thêm lượt), FE (Break) | Đúng điểm yếu thì thêm lượt hoặc tước phản đòn | Cuồng nộ ở Đảo (3 đúng liên tiếp) | **Giữ** | Đã có | — | — |
| Bi-a (đã có) ↔ Expedition 33 | Lượt địch vẫn có việc | Bi-a: giải trước trong lượt đối thủ | **Giữ** | Đã có | — | — |
| Metaphor, DD2, FE hội thoại | Gắn bó nhân vật | Thần thú 8 hệ, Thần thú nói một câu sau buổi | **Sửa nhẹ** | Thần thú nhắc **lỗi cụ thể** em vừa sửa xong | Lời thoại sáo rỗng | Khảo sát 1 câu |
| Monster Train 2 | Ghép phe | Đội 2–4 ghế Hộ Tống | **Giữ** | — | — | — |
| Star Rail gacha, Civ VII reset | — | — | **Không làm** | — | — | — |

---

## 6. Đề xuất: tối đa 6 thay đổi

Thứ tự xếp theo (tác động học + mê) ÷ công sức. Công sức ước theo những gì đã thấy trong mã: **T** thấp (≤ 1 ngày, chủ yếu giao diện), **V** vừa (2–4 ngày, có máy chủ), **C** cao (cần dữ liệu hoặc nhãn mới).

### Đ1. Ý đồ địch hiện rõ ở Đoàn Hộ Tống · tác động cao · công sức **T**

**Lối chơi.** Đầu mỗi hiệp thường, trên đầu đàn quái hiện **"Sắp đánh: 3 quái × 4 = 12 vào Linh Tâm"**. Cạnh đó là gợi ý đọc nhanh: "Mỗi Chắn đúng đỡ 8. Hạ 1 quái (24 máu) thì bớt 4."

Hiệp trùm hiện **"Giáp 4 ý · Vỡ giáp khi đúng ≥ 3 · Nếu chỉ đúng 2: mất (4−2)×8 + quái×4"**.

Các con số tính từ đúng công thức trong `doan-core.ts` (tất định), không đổi luật. Em vẫn phải trả lời đúng thì Đánh/Chắn mới có tác dụng. Ý đồ chỉ giúp em **chọn hành động** có lý do, như Into the Breach: thua thì biết vì sao.

**Ví dụ Hoá (một hiệp).** Câu: "Đốt cháy hoàn toàn 0,1 mol C₂H₅OH. Thể tích CO₂ thu được ở điều kiện chuẩn (đkc) là?"
- Lời giải: C₂H₅OH + 3O₂ → 2CO₂ + 3H₂O; n(CO₂) = 0,2 mol; V = 0,2 × 24,79 = **4,958 L**.
- Em chọn **Chắn** vì ý đồ báo 12 và đội còn hai ghế yếu. Đúng thì chắn 8, Linh Tâm chỉ mất 4.

### Đ2. Nút "Chắc!": đặt cược tự tin · tác động cao · công sức **T–V**

**Lối chơi.** Trước khi chốt một câu, em được bấm **"Chắc!"**. Lấy ý từ nút Snap của Marvel Snap.
- **Đúng:** hệ số sát thương ×2, hiện rõ kiểu Balatro: `16 × 1,5 (đúng) × 2 (Chắc!) = 48`. Bảng tổng kết ghi một dòng "Em chắc và đúng: 5/6".
- **Sai:** **không phạt thêm máu**. Ở đây khác Marvel Snap: không trừ thêm vì phạt nặng gây bỏ cuộc. Thay vào đó, khung "vì sao sai" của đúng phương án em chọn **mở ngay**, và câu được SRS **hẹn ôn sớm** (1 ngày).

Cơ chế dựa vào hiệu ứng hypercorrection: lỗi tự tin cao được sửa và nhớ tốt hơn (Metcalfe 2017). Đồng thời nó tập cho em thói quen tự hỏi "mình có chắc không".

**Chống lạm dụng.** Mỗi chuyến tối đa 3 lần "Chắc!". Không bấm sau khi đã mở gợi ý.

**Ví dụ Hoá.** "Cho pin điện hoá Zn–Cu với E°(Zn²⁺/Zn) = −0,76 V, E°(Cu²⁺/Cu) = +0,34 V. Sức điện động chuẩn của pin là?"
- Đáp án: E°pin = 0,34 − (−0,76) = **1,10 V**.
- Phương án nhiễu −0,42 V (lấy 0,34 + (−0,76)) là lỗi hay gặp khi tự tin. Em bấm "Chắc!" rồi chọn −0,42 thì mở ngay "Vì sao sai: em cộng hai thế điện cực. E°pin = E°(cực dương) − E°(cực âm)."

### Đ3. "Bẫy có tên" và trận phục thù · tác động học cao nhất · công sức **C** (làm dần)

**Lối chơi.** Khi em sai ở phương án đã gắn **mã lỗi**, màn hình hiện tên bẫy em vừa dính, ví dụ **"Bẫy Fe hoá trị III"**. Trong cùng chuyến xuất hiện ngay một **"Trận phục thù"**: câu tương tự, cùng bẫy, khác số.
- Thắng trận phục thù: bẫy được "thuần phục", ghi vào hồ sơ.
- Cùng mã lỗi lặp lại ≥ 2 lần trong 14 ngày thì nhập vào cờ "Cần thầy dạy lại" sẵn có.

Đây là "thua mà hiểu" của Into the Breach cộng với "lùi một lượt". Về học: phản hồi sửa lỗi (Wisniewski 2020) và xen kẽ hai câu **dễ nhầm với nhau** (Brunmair & Richter 2019: similarity matters).

**Cách làm dần.** Bắt đầu với 30–50 câu dùng nhiều nhất. Thầy hoặc phiên soạn đề gắn mã lỗi cho từng phương án sai. Câu tương tự: thầy chọn từ ngân hàng, chưa cần sinh tự động.

**Ví dụ Hoá.** Câu gốc: "Cho 5,6 g Fe tác dụng với HCl dư. Thể tích H₂ (đkc) là?" Ta có n(Fe) = 0,1; Fe + 2HCl → FeCl₂ + H₂; V = 0,1 × 24,79 = **2,479 L**.

| Phương án sai | Mã lỗi | Vì sao ra số này |
|---|---|---|
| 3,7185 L | *Fe hoá trị III* | Coi Fe lên Fe³⁺: 0,15 mol H₂ |
| 2,24 L | *Dùng 22,4 (đktc cũ)* | Dùng thể tích mol ở điều kiện cũ |
| 4,958 L | *Nhân 2 nhầm hệ số* | Nhân đôi số mol H₂ |

Trận phục thù cho bẫy *Fe hoá trị III*: "Cho 2,7 g Al tác dụng với HCl dư. V H₂ (đkc)?" Ta có n(Al) = 0,1; 2Al + 6HCl → 2AlCl₃ + 3H₂; n(H₂) = 0,15; V = **3,7185 L**. Em phải tự thấy hoá trị quyết định tỉ lệ mol: đúng phần đã sai ở câu gốc, nhưng chiều ngược lại.

### Đ4. Bản đồ Đảo có ngã rẽ và "chọn 1 trong 3" · tác động vừa đến cao · công sức **V**

**Lối chơi.** Sau ải 2 và ải 4 của chuyến 6 ải, đường rẽ đôi:
- **⚔ Tinh anh:** câu bậc cao hơn một mức, rương cuối chuyến thêm 1 ô;
- **❖ Suối hồi:** một câu "Ôn lại" do SRS đến hạn; đúng thì hồi máu.

Thắng một Tinh anh thì **chọn 1 trong 3 bùa** dùng trong chuyến (kiểu Discover). Ví dụ:
- "Kính lúp": gạch 1 phương án sai, nhưng câu đó không tính "Chắc!";
- "Đồng hồ cát": +20 giây hạn mềm cho 1 câu;
- "Lá chắn bẫy": nếu dính bẫy đã thuần phục thì không mất máu.

Bùa chỉ sống trong chuyến, không mua được, không tích trữ.

Trải nghiệm này giống bản đồ rủi ro/phần thưởng của Slay the Spire và chọn phòng của Blue Prince. Máy chủ vẫn quyết **tập câu**; em chỉ quyết **thứ tự và mức khó**. Nhờ vậy giữ được SRS và tạo cảm giác tự chủ (SDT).

**Ví dụ Hoá (ải Tinh anh, bậc Vận dụng).** "Xà phòng hoá hoàn toàn 8,8 g CH₃COOC₂H₅ bằng NaOH vừa đủ. Khối lượng muối thu được là?"
- M(este) = 88 nên n = 0,1.
- Muối CH₃COONa có M = 82, nên m = **8,2 g**.
- Nhiễu 4,6 g là khối lượng C₂H₅OH: nhầm sản phẩm.

### Đ5. Chuẩn bị trước trận trùm Hộ Tống · tác động vừa · công sức **T–V**

**Lối chơi.** Trước hiệp 4 và hiệp 8 có màn **20 giây "Trinh sát"**. Cả đội thấy **tiêu đề** 4 ý của trùm (chưa thấy nội dung đầy đủ hay đáp án). Mỗi em bấm **"Em nhận"** ý mình tự tin nhất. Ý không ai nhận thì máy chia như cũ (`chiaY`).

Ý tưởng lấy từ Unicorn Overlord và Pokémon: quyết định nằm ở khâu chuẩn bị. Về học: em phải đọc lướt, tự đánh giá "mình mạnh phần nào" (siêu nhận thức), và nói với đội.

**Ràng buộc.** Mỗi em giữ tối đa 2 ý, để không có em gánh hết còn em khác ngồi chơi.

**Ví dụ Hoá (trùm 4 ý, dạng Đúng/Sai Phần II, chủ đề kim loại kiềm thổ và nước cứng).** Bốn tiêu đề:
1. "Nước cứng tạm thời"
2. "Làm mềm bằng Na₂CO₃"
3. "Đun sôi"
4. "Thạch cao"

Nội dung, ví dụ ý (b): "Na₂CO₃ làm mềm được cả nước cứng tạm thời và vĩnh cửu" → **Đúng**, vì CO₃²⁻ kết tủa Ca²⁺ và Mg²⁺.

### Đ6. Vòng ngày có điểm dừng rõ + chuỗi khoan dung · tác động lên "mê bền" cao · công sức **T**

**Lối chơi.** Xong kế hoạch ngày thì mở Rương Bát Linh rồi đến **màn "Hôm nay xong rồi"** (kiểu Wordle):
- một dòng: "Em đã thuần phục 1 bẫy, ôn 3 câu đến hạn";
- một dòng: "Mai Thần thú hẹn em 2 câu ôn";
- nút chính chuyển thành **"Nghỉ thôi"**. "Thử sức thêm" vẫn còn nhưng là nút phụ.

Chuỗi ngày đổi sang **"chuỗi tuần"**: một tuần tính là giữ chuỗi nếu có ≥ 4 ngày có làm ≥ 1 câu. Không cần mua, không cần bùa. Cách này lấy từ ý bùa nghỉ cuối tuần của Duolingo và tránh "abstinence violation".

Thần thú **không** nhắn kiểu doạ mất chuỗi.

**Ví dụ Hoá.** Câu ôn hẹn mai là câu em vừa sai ở Đ3 (Fe/HCl), khoảng cách 1 ngày, rồi theo SRS (Cepeda 2006).

### Vòng một buổi hoàn chỉnh (12–18 phút)

| Phút | Màn | Việc của em | Tinh tuý game | Việc học |
|---|---|---|---|---|
| 0–1 | **Sảnh Hoá 2.0** | Một nút chính do máy chủ quyết: "Ra đảo (Thể lực 10)". Thần thú nói một câu về bẫy em sắp gặp lại | Vòng thói quen, gắn bó nhân vật | — |
| 1–3 | **Ải 1–2 Đảo** | 1 câu Ôn lại đến hạn + 1 câu mới | Chuyến ngắn | Luyện nhớ, giãn cách |
| 3–4 | **Ngã rẽ 1** | Chọn Tinh anh hay Suối hồi | Rẽ nhánh (StS) | Tự chủ |
| 4–9 | **Ải 3–5** | Dùng tối đa 3 lần "Chắc!". Dính bẫy thì gặp ngay Trận phục thù | Đặt cược (Snap), thua mà hiểu | Hypercorrection, xen kẽ câu dễ nhầm |
| 9–11 | **Ải 6 Trùm ải** | Ý đồ trùm hiện rõ | Ý đồ địch | Câu tổng hợp |
| 11–12 | **Xong chuyến** | Xem bảng `nền × hệ số` của chuyến; ghi **một dòng Sổ tay mẹo** cho bẫy vừa thuần phục (bùa không mang sang chuyến sau) | Kiến thức là vật phẩm (Blue Prince) | Tự giải thích |
| 12–13 | **Rương Bát Linh + "Hôm nay xong rồi"** | Nhận EXP/vàng; thấy lịch ôn ngày mai | Điểm dừng (Wordle) | Hẹn giãn cách |
| (tối, theo lớp) | **Đoàn Hộ Tống** | Sự kiện đội 2–4 em, có Trinh sát trước trùm và ý đồ địch | Chuẩn bị trước trận, co-op | Phần II nhiều ý |

**Chỉ tiêu tỉ lệ.** Ít nhất 65% thời gian buổi là đọc và giải câu Hoá. Đo bằng tổng thời gian câu chia thời gian phiên.

---

## 7. Điều KHÔNG làm và lý do

1. **Rương may rủi mua bằng tiền thật, gacha thần thú.** Liên hệ với cờ bạc có vấn đề (Zendle & Cairns 2018; lặp lại 2019). Đối tượng là HS 15–18 tuổi. Star Rail bị gọi gacha là "săn mồi".
2. **Phạt mất chuỗi nặng, thông báo doạ.** Gây bỏ hẳn khi đứt chuỗi; chuỗi thành mục tiêu thay cho việc học (lexontech, professorgame). Ngay Duolingo cũng phải nới bằng bùa.
3. **Ép giờ gắt hoặc QTE phản xạ** kiểu Expedition 33. Máy yếu, và phản xạ không đo Hoá. Giữ "hạn mềm" theo độ dài câu như M6 đã làm.
4. **Thanh căng thẳng hoặc phạt cảm xúc** kiểu DD2. Review nói tiêu cực "gần như không tránh được".
5. **"Reset" làm mất tiến bộ** kiểu thời kỳ của Civ VII. Hồ sơ bẫy đã thuần phục, Sổ tay, thần thú phải luôn được giữ.
6. **Bảng xếp hạng công khai cả trường theo điểm.** Không có nguồn đã đọc riêng cho điểm này; lý do là SDT: so sánh xã hội làm giảm cảm giác năng lực ở nhóm yếu. Nếu cần thì chỉ so với chính em tuần trước, hoặc theo đội Hộ Tống.
7. **Thưởng EXP cho Tu luyện.** Giữ quy tắc hiện tại để tránh cày câu dễ lấy EXP.
8. **Hiệu ứng nặng** (hạt 3D, rung màn liên tục). Máy yếu. Juice chỉ cần chữ số nảy, âm thanh ngắn, tắt được.
9. **Kênh tự động rút câu tự luận** (theo CLAUDE.md). Mọi đề xuất trên chỉ dùng câu trắc nghiệm, Đúng/Sai, trả lời ngắn.
10. **Tiết lộ đáp án trước khi nộp** để hiện ý đồ hoặc bẫy. Ý đồ địch chỉ dùng số quái và số ý, không đụng đáp án. Mã lỗi chỉ hiện **sau** khi chấm.

---

## 8. Giả thuyết và cách thử với 2–3 lớp thật

**Thiết kế.** Có 2–3 lớp, cỡ mẫu nhỏ, nên **không** làm thử nghiệm ngẫu nhiên cấp cá nhân cho mọi thứ.
- **Đ1, Đ5, Đ6** (giao diện, tác động cả lớp): bật theo kiểu **ABAB theo tuần** trong cùng lớp, 4 tuần. So tuần bật với tuần tắt.
- **Đ2, Đ3** (cấp câu): **ngẫu nhiên trong em**. Mỗi em, một nửa câu có nút "Chắc!" hoặc trận phục thù, một nửa không. So trong chính em đó, nên bớt nhiễu do khác biệt giữa các em và giữa các thầy.
- Ghi lịch thi, kiểm tra trên lớp để loại tuần nhiễu.

| Giả thuyết | Chỉ số chính | Ngưỡng coi là có ích |
|---|---|---|
| H1: Ý đồ địch (Đ1) làm em ra quyết định có lý do hơn mà không làm giảm tỉ lệ đúng | % hiệp Linh Tâm mất máu; tỉ lệ đúng câu Hộ Tống; % em chọn Chắn khi ý đồ ≥ 12 | Mất máu giảm ≥ 20% tương đối; tỉ lệ đúng không giảm |
| H2: "Chắc!" (Đ2) cải thiện hiệu chỉnh và nhớ câu đã sai-tự-tin | Tỉ lệ đúng khi "Chắc!" trừ tỉ lệ đúng chung (tăng dần theo tuần); **tỉ lệ đúng ở lần ôn đầu** của câu "Chắc! mà sai" so với câu "sai không Chắc!" | Lần ôn đầu: nhóm "Chắc! mà sai" ≥ nhóm kia |
| H3: Trận phục thù (Đ3) giảm lặp lỗi | Tỉ lệ dính **cùng mã lỗi** trong 14 ngày: câu có phục thù vs không | Giảm ≥ 25% tương đối |
| H4: Ngã rẽ (Đ4) không làm em né câu khó | % chọn Tinh anh; phân bố bậc câu đã làm | ≥ 40% chọn Tinh anh; bậc trung bình không giảm |
| H5: Điểm dừng và chuỗi tuần (Đ6) giữ nhịp đều, giảm cày dồn | Số ngày hoạt động mỗi tuần; trung vị độ dài phiên; % em bỏ ≥ 7 ngày sau khi đứt chuỗi | Ngày hoạt động không giảm; phiên trung vị 12–20 phút; bỏ sau đứt chuỗi giảm |
| H6 (tổng): Học thật sự tăng | Điểm phần tương ứng ở **ca kiểm tra** sẵn có, so với cùng kỳ hoặc lớp đối chứng | Ghi nhận xu hướng; không kết luận nhân quả với 2–3 lớp |

**Đo cảm nhận.** Khảo sát 3 câu cuối tuần, thang 1–5: "Em thấy vui", "Em hiểu vì sao mình sai", "Em thấy áp lực". Ngưỡng dừng: điểm áp lực tăng ≥ 1 bậc thì tắt tính năng đó.

**Giới hạn.**
- Cỡ mẫu nhỏ, có hiệu ứng mới lạ (gamification meta cảnh báo).
- Tỉ lệ đúng phụ thuộc độ khó câu SRS chọn, nên phải so theo **bậc** câu.
- Mọi kết luận chỉ là tín hiệu để quyết định có giữ tính năng hay không, không phải bằng chứng khoa học.

---

## 9. Danh mục nguồn (truy cập 01/10/2026, qua trích đoạn WebSearch)

**Game**
- Balatro: gamingamigos.com/post/balatro-wins-gdc-awards · gematsu.com/2025/01/balatro-sales-top-five-million · playstack.com/news/balatro-5-million-copies-sold/ · blakecrosley.com/guides/design/balatro · gamedatacentral.com/guides/balatro-beginners-guide-how-scoring-actually-works · gmtk.substack.com/p/balatros-cursed-design-problem · mechanicsofmagic.com/2026/05/22/critical-play-on-games-of-chance-and-addiction-balatro/ · goombastomp.com/how-balatro-became-one-of-the-most-addictive-roguelikes/
- Slay the Spire 1/2: slay-the-spire.fandom.com/wiki/Intent · gordianblade.com/reveal-enemy-intents-or-how-i-run-rpg-combats-like-slay-the-spire/ · gdcvault.com/play/1025731/-Slay-the-Spire-Metrics · arxiv.org/html/2504.03918v1 · sts2.untapped.gg/en/guides/how-to-make-the-best-map-choices-in-slay-the-spire-2 · sts2guides.com/en/guides/pathing.html · gamesradar.com/slay-the-spire-2-review/ · pcgamer.com/games/card-games/even-though-i-threw-out-my-back…slay-the-spire-2-sold-3-million-copies-in-its-first-week/ · gosugamers.net/entertainment/news/78130-… · notebookcheck.net/Highly-anticipated-roguelike-deckbuilder-launches-on-Steam-with-over-175-000-players-in-hours.1243586.0.html
- Into the Breach: gamedeveloper.com/game-platforms/road-to-the-igf-subset-games-i-into-the-breach-i- (chỉ trích đoạn) · shacknews.com/article/99108 · gamespot.com/reviews/into-the-breach-advanced-edition-review-a-mechanized-masterpiece/1900-6416865/ · bafta.org/media-centre/press-releases/winners-announced-british-academy-games-awards-in-2019/ · squareblind.wordpress.com/2018/09/29/into-the-breach-the-immersive-appeal-of-the-digital-board-game/
- Monster Train 2: gamesradar.com/games/roguelike/monster-train-2-review/ · fullcleared.com/reviews/monster-train-2-review/ · gameinformer.com/review/monster-train-2/engine-ingenuity · pcgamesn.com/monster-train-2/steam-reviews-player-count · pcgamesn.com/monster-train-2/roadmap-updates-dlc · railtools.net/monster-train-2/pairings/
- Baldur's Gate 3: deadline.com/2023/12/game-awards-2023-winners-list-baldurs-gate-3-1235657995/ · pcgamer.com/baldurs-gate-3-completes-its-game-of-the-year-sweep-with-top-honor-in-the-2023-steam-awards/ · screenrant.com/baldurs-gate-3-2023-goty-award-game-year/
- Metaphor: techradar.com/gaming/metaphor-refantazio-review · gamingtrend.com/reviews/metaphor-refantazio-review-living-the-dream/ · pcgamer.com/games/rpg/metaphor-refantazio-is-the-new-fastest-selling-game-in-atlus-history…
- Unicorn Overlord: nintendolife.com/reviews/nintendo-switch/unicorn-overlord · fullcleared.com/reviews/unicorn-overlord-review/ · destructoid.com/unicorn-overlord-details-its-gambit-like-tactical-battle-system-and-more-characters/ · gamedeveloper.com/business/unicorn-overlord-sells-over-1-million-copies-in-six-months
- Honkai: Star Rail: pcgamesn.com/honkai-star-rail/review · wccftech.com/review/honkai-star-rail-trails-of-mediocrity/
- Pokémon: gamespot.com/reviews/pokemon-champions-review-the-battle-frontier/1900-6418480/ · gameinformer.com/review/pokemon-champions/it-hurt-itself-in-its-confusion · gamesradar.com/games/pokemon/pokemon-champions-guide/ · gamespot.com/reviews/pokemon-legends-z-a-review-a-battle-revolution/1900-6418423/
- Darkest Dungeon II: rpgfan.com/review/darkest-dungeon-ii/ · rogueliker.com/darkest-dungeon-ii-review/ · hardcoregamer.com/reviews/review-darkest-dungeon-ii/440887/ · gameworldobserver.com/2023/06/08/darkest-dungeon-ii-sales-600k-copies-steam-launch
- Marvel Snap: gamesbeat.com/ben-brode-bets-super-speed-will-make-marvel-snap-stand-out/ · mobilegamer.biz/second-dinners-ben-brode-reveals-marvel-snaps-recipe-for-success-literally/ · thomashvizdos.substack.com/p/im-done-playing-marvel-snap
- Hearthstone: hearthstonetopdecks.com/discover-an-ode-to-the-best-mechanic-in-the-game/ · hs.cardsrealm.com/en-us/articles/hearthstone-the-story-behind-discover-the-mechanic-that-came-to-stay · pcgamesn.com/hearthstone/hearthstone-dev-communication-balance-design-rng · us.forums.blizzard.com/en/hearthstone/t/why-is-battlegrounds-so-popular/81403
- Fire Emblem Engage: rpgfan.com/review/fire-emblem-engage/ · mobilesyrup.com/2023/01/17/fire-emblem-engage-nintendo-switch-review/
- Clair Obscur: techradar.com/gaming/gaming-industry/the-game-awards-2025-winners-list-… · invenglobal.com/articles/20309/… · engadget.com/gaming/clair-obscur-expedition-33-has-sold-five-million-copies-153148952.html · gamespot.com/reviews/clair-obscur-expedition-33-review-light-and-shadow/1900-6418358/ · xboxtavern.com/clair-obscur-expedition-33-review/ · fextralife.com/clair-obscur-expedition-33-review/
- Blue Prince: gamespot.com/reviews/blue-prince-review-an-intricate-layered-roguelike-puzzle/1900-6418355/ · adventuregamehotspot.com/review/4117/blue-prince · finalweapon.net/2025/04/14/blue-prince-review-home-sweet-maze/
- Civilization VII: pcgamesn.com/civilization-vii/rating-steam · steamcommunity.com/app/1295660/discussions/2/598519626423380103/
- Wordle/Duolingo: techcrunch.com/2022/01/12/josh-wardle-interview-wordle/ · gamedeveloper.com/marketing/josh-wardle-reflects-on-the-the-unconventional-road-to-wordle-s-success · blog.duolingo.com/how-streaks-keep-duolingo-learners-committed-to-their-language-goals/ · getrecall.ai/summary/lennys-podcast/behind-the-product-duolingo-streaks-… · lexontech.org/streaks-considered-harmful · professorgame.com/podcast/423/
- Juice: limboy.me/links/7ihzixkwzj3qu31 · roblog.co.uk/2024/03/juicy-games/ (bài nói "Juice it or lose it" của Jonasson và Purho; tôi chưa xem video)

**Nghiên cứu học tập**: xem bảng mục 4. Dấu ✔ là DOI thấy trong kết quả tìm kiếm; dấu ◇ là DOI theo trí nhớ, **cần kiểm** trước khi trích chính thức.

**Không đọc được (bị chặn):** toàn văn mọi trang ở trên; Wikipedia; doi.org; PMC; Steam store. Không có số liệu retention độc lập cho game nào.
