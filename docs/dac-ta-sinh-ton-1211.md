# Đặc tả trò «Sinh Tồn» ở phòng chờ Live theo khối — thầy CHỐT 12/11/2026 «chốt build đẩy luôn lên», ĐÃ BUILD (mục «Bản thật» cuối tệp)

Thay trò «Giữ Lửa» (`src/components/live-khoi/TroGiuLua.tsx`). Giữ nguyên bốn đội Natri · Kali · Đồng · Canxi, khung phòng chờ, nút «Rời phòng chờ», nút «Bắt đầu live» của thầy.
Bản vẽ: `docs/ban-ve-sinh-ton-1211/` (16 ảnh Chromium thật; `mo-phong.html` + `chup.mjs` để vẽ lại). Chưa tham vấn được cố vấn (phiên này không có cố vấn).

Ý thầy đã vào bản vẽ: bốn đội · bắn súng sinh tồn · máy tự bù chỗ, em vào thì thay · súng tự bắn đối thủ gần nhất · bỏ nút di chuyển, vuốt / chạm cả màn · mỗi đội một nhân vật · vật cản để ẩn nấp · chữ hướng dẫn nhỏ, nét thanh · bé ma của em có ngọn lửa đội trên đầu · nhân vật nhỏ, súng to đeo bên người · bốn cấp súng tiến hoá, mỗi cấp một loại đạn · nhân vật kiểu bé ma không mặt, MẶT đúng màu đội, có áo choàng.

## 1. Mục tiêu + ai dùng
- **Học sinh:** vào phòng chờ là chơi được ngay trong 3 giây, không phải học nút. Cảm giác: vui, hồi hộp, có đồng đội. Không liên quan điểm học: lượt hạ trong trò KHÔNG cộng vào kJ buổi học (như trò cũ).
- **Thầy:** nhìn một màn là biết mấy em đã vào, đội nào đang thiếu người (máy đang bù), rồi bấm «Bắt đầu live».

## 2. Bố cục
Phòng chờ máy em luôn nằm ngang, luôn nền xanh than ⇒ bản vẽ chỉ có nền tối, ba khổ ngang 844 × 390 · 667 × 375 · 1180 × 820.
- **Máy em (01):** sân kín màn, máy quay đi theo bé ma của em (em luôn ở giữa màn). Không có nút điều khiển nào. Lớp phủ chỉ gồm: «Rời phòng chờ» (trên trái) · bảng lượt hạ bốn đội + «Ván 2 · còn 0:48» (trên giữa) · tin trận 2 dòng (trên phải) · bản đồ nhỏ (dưới phải) · hai dòng chữ nhỏ nét thanh «Súng cấp 3 · Súng Sấm» và «Phòng chờ · 8 em đã vào · chờ thầy bấm Bắt đầu» (dưới). Mọi dòng hướng dẫn: 12 px, nét thanh, một dòng, tự tắt.
- **Mọi máy thấy cùng diện tích sân** (tỉ lệ = √(rộng × cao ÷ 520 000)) ⇒ máy to không nhìn xa hơn máy nhỏ.
- **Máy thầy (10):** trái là CẢ sân thu nhỏ (chỉ xem); phải là bốn đội, mỗi đội ghi «3 em · 1 máy» + tên em + ô «Máy» viền đứt; một nút chính «Bắt đầu live».

### Nhân vật (02) và súng (11)
- Bốn bé ma: **Ma Natri** (cam, mũ chỏm xoáy) · **Ma Kali** (tím, mũ tai mèo) · **Ma Đồng** (xanh, mũ mầm lá) · **Ma Canxi** (đỏ, mũ hai búi tròn). Mặt màu đội, chỉ có hai mắt, không miệng; áo choàng trắng kem viền màu đội, khuy vàng. Hình tự thiết kế (không dùng hình nhân vật phim).
- Bé ma của em: ngọn lửa đội trên đầu + vòng trắng dưới chân + chữ «(em)». Máy: cần ăng-ten xanh + tên «Máy».
- Súng đeo bên người bằng quai chéo vai, nòng tự quay. Bốn cấp: **Súng Hạt** (đạn hạt tròn) → **Súng Đôi** (cặp đạn song song) → **Súng Sấm** (tia sét, nảy sang đối thủ đứng gần) → **Pháo Sao** (cầu lửa, nổ lan).

## 3. Trạng thái
| Trạng thái | Máy em thấy | Ảnh |
|---|---|---|
| Đầu ván | Một dòng nhỏ «Vuốt để chạy · Chạm để tới · Súng tự bắn đối thủ gần nhất», tắt sau 6 giây hoặc khi em vuốt lần đầu | 03 |
| Chạm một điểm | Đường chấm vòng qua tường + dấu đích; vuốt là huỷ | 04 |
| Giao tranh | Đạn theo cấp súng, số máu mất, thanh máu trên đầu | 01 |
| Ẩn trong bụi | Bé ma mờ đi, «Đang ẩn trong bụi · đội khác không thấy em · máu đang hồi» | 05 |
| Lên cấp súng | Quầng vàng quanh súng + «Súng lên cấp 4 · Pháo Sao» | 12 |
| Bị hạ | Sân mờ, «Huy · Đội Kali vừa hạ em», đếm 3 giây, hồi sinh ở trại đội | 06 |
| Bạn mới vào | «Minh Anh vào Đội Natri · thay một máy» | 07 |
| Hết ván | Xếp hạng bốn đội theo lượt hạ, 5 giây sau ván mới | 08 |
| Mất kết nối | «Mất kết nối · đang nối lại · em vẫn chạy được, các bạn tạm đứng yên» | 09 |
| Đang tải / trống | Sân + bé ma của em hiện ngay (không chờ mạng); chưa có ai khác thì máy đã đủ 15 chỗ còn lại | — |
| Thầy bấm Bắt đầu | Trò dừng, sang màn bốn đội như hiện nay | — |

## 4. Luật chơi và dữ liệu
**Điều khiển:** vuốt / kéo ở bất kỳ đâu = chạy theo hướng kéo (cần ảo vô hình, dùng lại phép đổi toạ độ khi màn bị xoay của trò cũ); chạm nhanh một điểm = tự chạy tới, tìm đường vòng qua tường; máy tính: phím W A S D / mũi tên, bấm chuột = chạm. Không có nút bắn.

**Luật (số đề xuất, chỉnh được sau khi chơi thử):**
- Ván 90 giây. Mỗi bé ma 100 máu. Súng tự bắn đối thủ gần nhất đang nhìn thấy trong tầm 240 đơn vị sân.
- **Tường, thùng** chặn đạn và chặn đường. **Bụi** đi xuyên được; đứng trong bụi thì đội khác không thấy và súng không ngắm được, trừ khi tới gần dưới 70 đơn vị hoặc em vừa bắn (lộ 1 giây).
- 3 giây không trúng đạn ⇒ hồi 15 máu mỗi giây ⇒ nấp để hồi là chiến thuật chính.
- **Vòng an toàn** co dần (dùng lại `vongLanh`); ngoài vòng mất 8 máu mỗi giây ⇒ cuối ván cả bốn đội bị ép vào giữa.
- **Hộp tiếp tế** giữa sân, 20 giây hiện một lần: đầy máu + súng lên một cấp.
- **Cấp súng:** mỗi lượt hạ lên một cấp (tối đa 4); bị hạ về cấp 1. Cấp 1: 10 máu × 3 phát / giây · cấp 2: 2 viên × 7 máu · cấp 3: 16 máu, nảy sang một đối thủ trong 90 đơn vị (nửa sát thương) · cấp 4: 40 máu × 1 phát / giây, nổ lan bán kính 60 (nửa sát thương).
- Bị hạ ⇒ hồi sinh sau 3 giây ở trại đội, 2 giây đầu không bị bắn (giữ `HOI_SINH_MS`, `BAT_TU_MS`). Không ai bị loại khỏi ván: phòng chờ cần em nào cũng được chơi.
- Điểm đội = tổng lượt hạ trong ván; bằng nhau thì đội bị hạ ít hơn xếp trên.

**Máy bù chỗ:** mỗi đội luôn đủ 4 trên sân; đội có từ 4 em thật thì không còn máy. Em vào ⇒ một máy của đội đó (máu thấp nhất) rời sân, em hiện ở trại đội. Em rời / im quá 5 giây ⇒ máy bù lại. Máy biết: đi cùng em thật gần nhất của đội · thấy đối thủ thì dừng ở mép tường còn đường ngắm · máu dưới 35 thì lùi về tường / bụi khuất tầm nhìn để hồi · vòng co thì vào vòng. Máy yếu hơn người: bắn 2 phát / giây, phản ứng trễ 0,4 giây, súng tối đa cấp 2, không nhặt hộp tiếp tế.

**Sân theo sĩ số:** tới 24 nhân vật sân 1600 × 1000; 25–60 sân 2400 × 1500; trên 60 sân 3200 × 2000 (cùng mẫu đối xứng bốn góc ⇒ bốn đội công bằng).

**Dữ liệu — dùng lại nguyên:** kênh lớp `'tro'` (`src/lib/live-khoi/kieu.ts`, `server/src/kenh-lop-may.ts`), danh sách `NguoiLop { sbd, ten, doi }`, bốn đội `DOI_BPU`, giờ phòng `l`, ngọn lửa `NgonLua`, cờ `mayYeu`, `xoay`, `xemThoi`.
**Cần đổi ở hợp đồng `'tro'` (chỉ trong bộ nhớ phòng, không D1):**
- Máy em gửi (≤ 4 gói / giây như cũ): `{ p: [x, y, máu, cấp súng], a?: số báo danh người vừa hạ mình }`.
- Phòng phát mỗi 250 ms (như cũ): `{ ds: { [sbd | 'm0'…'m15']: [x, y, máu, đội, cấp súng] }, an: [người hạ, người bị hạ][], van }`.
- Sát thương do máy BỊ bắn tự tính theo luật tất định từ ảnh chụp (ai đang coi em là mục tiêu gần nhất nhìn thấy) — đúng kiểu «máy bị thu phục tự báo» của trò cũ ⇒ không thêm gói «đạn». Đạn trên màn chỉ là hình vẽ.
- Máy bù chỗ chạy trong phòng (Durable Object) ở đúng nhịp 250 ms sẵn có; lõi luật là tệp thuần dùng chung `src/lib/live-khoi/sinh-ton-loi.ts` (máy em và phòng cùng nhập).

## 5. Ngoại lệ
- Mất mạng: bé ma của em vẫn chạy; các bạn đứng yên mờ đi; nối lại thì lấy ảnh chụp mới, không cộng bù lượt hạ.
- Đổi tab / khoá màn: dừng vòng vẽ (như cũ); im quá 5 giây thì máy bù vào chỗ em, quay lại thì thay máy.
- Thầy bấm Bắt đầu giữa ván: trò tắt hẳn, không hiện bảng hết ván.
- 80–100 em: sân lớn, chỉ vẽ nhân vật trong khung nhìn; tên chỉ hiện cho nhân vật trong màn.
- Máy yếu / «giảm chuyển động»: 30 khung / giây, bỏ quầng sáng và rung, đạn vẽ nét đơn.
- Tên dài: trên sân chỉ hiện hai chữ cuối của tên (như cũ); máy thầy hiện đủ tên.
- Bấm lặp / nhiều ngón: chỉ ngón đầu điều khiển. iPhone cầm dọc: màn xoay bằng CSS, toạ độ chạm đổi theo (đã có).
- Hai em hạ nhau cùng lúc: cả hai cùng tính, cùng hồi sinh.

## 6. Chi phí máy chủ
- **0 D1, 0 storage** — như trò cũ. Số gói không đổi: máy em ≤ 4 gói / giây, phòng 1 ảnh chụp / 250 ms.
- Thêm: phòng tính tối đa 15 máy mỗi nhịp (vài phép cộng, không chờ mạng). Phòng không có em thật nào ở phòng chờ ⇒ không nhịp (giữ điều kiện dừng hiện có). Trò tắt hẳn khi vào live.
- Ảnh chụp to hơn 1 số / nhân vật (cấp súng) + tối đa 15 dòng máy.
- Mã trò vẫn nạp lười (chỉ tải khi em vào phòng chờ) ⇒ byte tải mở app không đổi. Nhân vật, súng, đạn vẽ bằng nét (Path2D), nướng sẵn ra ảnh một lần — không thêm tệp ảnh.
- Không có đáp án nào đi kèm trò.

## 7. Nghiệm thu đo bằng máy
- `tests/live-khoi-sinh-ton-loi-1211.test.ts`: tường chặn đường ngắm · bụi che / lộ · sát thương + hồi máu · cấp súng lên / về 1 · hồi sinh + 2 giây bất tử · vòng an toàn · tìm đường vòng tường · bản đồ đối xứng bốn góc.
- `tests/live-khoi-sinh-ton-may-1211.test.ts`: luôn đủ 4 mỗi đội · em vào thì bớt đúng một máy · em rời thì bù lại · máy lùi khi máu dưới 35 · máy không vượt cấp 2.
- `tests/live-khoi-may-chu-1211.test.ts` (bổ sung): phòng chỉ nhịp ở giai đoạn chờ, 0 lượt D1, kẹp toạ độ / máu / cấp, bỏ gói quá nhịp.
- Cổng: `tsc -b` · `npm run build && npm run kiem:toc-do` 0 đỏ · `npm run check:mau` · `npm run kiem:mau-giu` 0 · `npm run kiem:co-tep` · `node scripts/kiem-sw.mjs`.
- Ảnh Chromium của bản THẬT ở ba khổ: 0 lỗi trang, 0 lớp phủ đè nhau, 0 tràn, nút «Rời phòng chờ» ≥ 44 px (bản vẽ hiện đạt cả bốn mục — `chup.mjs` tự đếm).
- Đo khung hình ở CPU ×4 với 16 và 100 nhân vật; sau gộp chạy tác tử `toc-do`.

## Bốn điều thầy chốt
1. Hình bốn bé ma (ảnh 02) và bốn khẩu súng + đạn (ảnh 11).
2. Bị hạ thì hồi sinh sau 3 giây, không bị loại khỏi ván.
3. Lên cấp súng: mỗi lượt hạ một cấp, bị hạ về cấp 1.
4. Tên trò «Sinh Tồn»; gọi bot là «Máy».

## Danh sách ảnh
`01-em-giao-tranh-{844,667,1180}` · `02-bon-nhan-vat-1366` · `11-bon-cap-sung-1366` · `12-em-sung-len-cap-844` · `03-em-dau-van-huong-dan-{844,667}` · `04-em-cham-de-toi-844` · `05-em-an-trong-bui-844` · `06-em-bi-ha-hoi-sinh-844` · `07-em-ban-moi-thay-ban-may-844` · `08-em-het-van-{844,667}` · `09-em-mat-ket-noi-844` · `10-thay-xem-tran-1366`.

## Bản thật (bước 4, build 12/11 chiều)
- **Mã:** lõi thuần `src/lib/live-khoi/sinh-ton-loi.ts` (bản đồ, đường ngắm, sát thương, tìm đường, bé ma của em) + `sinh-ton-may.ts` (máy bù chỗ); hình nét `src/components/live-khoi/sinh-ton-hinh.ts`; vẽ khung `sinh-ton-ve.ts`; màn `TroSinhTon.tsx` + `tro-sinh-ton.css`; phòng `server/src/kenh-lop-may.ts`; hợp đồng `src/lib/live-khoi/kieu.ts`. Gỡ `TroGiuLua.tsx`, `tro-loi.ts` (giữ `tro-giu-lua.css`: khung `.gl`, bảng điểm, tin trận dùng lại + luật giữ màu).
- **Khác bản vẽ / đặc tả, đã chọn khi build:**
  - Bụi: đứng YÊN trong bụi 0,4 giây thì súng NGỪNG bắn ⇒ ẩn hẳn và máu hồi; hễ di chuyển là súng bắn lại (lộ). Nhờ vậy «nấp để hồi» mới dùng được.
  - Bên bắn khai mục tiêu (`t`) trong gói; bên bị bắn tự trừ máu theo ảnh chụp. Phòng đếm lượt hạ khi bên bị hạ báo (`a`), mỗi em tối đa một lượt / 2,5 giây.
  - Số ván trên màn = số thứ tự ván của phòng (`v`), mọi máy thấy cùng một số.
  - Tin trận không hiện «Máy hạ Máy». Bảng hết ván ghi «hoà» khi hai đội đầu bằng điểm.
  - Máy thầy: ô «Máy» viền mảnh trong danh sách đội; huy hiệu đội giữ kiểu chữ ký hiệu (Na · K · Cu · Ca) như cũ.
- **Chạy thử bản thật ngoài app:** `npx vite --port 5199 --strictPort` rồi mở `/docs/ban-ve-sinh-ton-1211/that/` (`?ban=5` số bạn giả · `?xem=1` máy thầy · `?yeu=1` máy yếu). Trang này gắn `TroSinhTon.tsx` thật với lớp `KenhLopMay` THẬT của máy chủ chạy trong trình duyệt. Chụp: `CHROMIUM=<đường dẫn> node docs/ban-ve-sinh-ton-1211/that/chup-that.mjs` ⇒ ảnh `that/that-*.jpg`.
- **Đã đo (Chromium, bản dev):** 58–62 khung / giây ở 844 × 390 · 667 × 375 · 1180 × 820 và ở sân 40 em; 0 lỗi trang, 0 lớp phủ đè / tràn; chạy trọn một ván: hạ máy ⇒ súng lên cấp 2, 3; bị hạ ⇒ đếm ngược; hết ván ⇒ bảng xếp hạng.
- **CHƯA thử:** lớp thật nhiều máy qua mạng thật, iPhone thật (màn xoay bằng CSS), 80–100 em cùng lúc, máy yếu thật.

## Chỉnh sau khi thầy chơi thử bản sống (12/11 chiều)
- **«Tự bắn phải gần quá mới bắn, tôi muốn tự bắn khi thấy đối thủ gần nhất»:** bỏ tầm bắn 240. Súng bắn đối thủ gần nhất ĐANG HIỆN TRÊN MÀN của em (lùi mép 24 px), vẫn theo luật tường chắn và bụi ẩn. Máy bù chỗ dùng khung mặc định nửa rộng 500 × nửa cao 240 (cỡ màn điện thoại ngang). Phòng nhận sát thương trong 660 đơn vị.
- **«Cho con ma nhỏ hơn chút nữa, súng nhỏ hơn phù hợp với con ma»:** cỡ bé ma 0,86 → 0,74; cỡ súng 1,12 → 0,9 nét gốc.
- **«Thêm âm thanh bắn súng cho phấn khích» (12/11 tối):** `src/components/live-khoi/sinh-ton-am.ts` — tiếng tổng hợp bằng Web Audio, không tệp âm thanh. Mỗi cấp súng một tiếng (Súng Hạt «piu», Súng Đôi «piu-piu», Súng Sấm «xẹt», Pháo Sao «bùm»), kêu đúng nhịp đạn trên màn; tiếng súng người khác nhỏ dần theo khoảng cách, trần 7 tiếng / 0,25 giây. Thêm tiếng trúng đạn, hạ đối thủ, lên cấp, bị hạ, nhặt hộp, hết ván. Nút loa 44 px dưới «Rời phòng chờ» để tắt / bật (nhớ ở máy); tôn trọng «Âm thanh» đã tắt của app. Máy thầy xem trận không kêu.
- **«Cho màn chơi nhiều thời gian hơn chút»:** ván 90 giây → 2 phút (vòng an toàn co chậm theo).

## Đề xuất «2D có chiều sâu» — CHỜ THẦY DUYỆT ẢNH (12/11 tối), chưa build
Thầy: «giữ 2d thêm bóng đổ ánh sáng cho có chiều sâu, vẽ lại tôi xem vẽ đẹp vào, không dùng 3d vì rất lag». Bản vẽ: `docs/ban-ve-sinh-ton-chieu-sau-1211/` (9 ảnh; `mo-phong.html` + `chup.mjs`). Bản vẽ 3D đã xoá theo lời thầy.
- **Giữ nguyên:** luật chơi, máy chủ, cử chỉ, lớp chữ phủ, hình bé ma và súng thầy đã chốt. Vẫn MỘT canvas 2D.
- **Thêm chiều sâu:** một hướng nắng (trên-trái) ⇒ mọi bóng đổ về dưới-phải · tường / thùng có mặt trên sáng + mặt trước sẫm · bé ma lơ lửng, bóng tách khỏi thân · áo choàng và mặt có khối sáng tối · bụi là các khối tròn sáng phía nắng · đạn, chớp nòng, trại đội, hộp tiếp tế hắt quầng sáng lên mặt sân · nền gạch hai tông · vòng an toàn phát sáng, ngoài vòng tối lạnh · viền tối quanh màn.
- **Cách làm để không chậm:** bóng và quầng sáng là ẢNH NƯỚNG SẴN một lần (như hình bé ma hiện nay), mỗi khung chỉ dán thêm ảnh; không dùng bộ lọc làm mờ lúc chạy. Máy yếu / «giảm chuyển động» tự tắt bóng và quầng sáng (về đúng bản đang sống). Không thêm thư viện, không thêm tệp ảnh.
- **Nghiệm thu khi build:** khung hình không thấp hơn bản đang sống ở CPU ×1 và ×4 (16 và 100 nhân vật); mảnh `TroSinhTon` không to thêm quá 3 KB nén; các cổng như cũ.

## «2D có chiều sâu» — ĐÃ BUILD (thầy «Chốt build đi», 13/11 rạng sáng)
- **Mã:** `sinh-ton-san.ts` (MỚI: tường / thùng / bụi / bóng đổ / quầng sáng nướng sẵn thành ảnh, cùng cỡ dùng chung một ảnh) · `sinh-ton-hinh.ts` (khối sáng tối trên áo và mặt bé ma, thân súng chuyển sắc kim loại; thân KHÔNG lật theo hướng ngắm để nắng luôn từ trên-trái) · `sinh-ton-ve.ts` (nền gạch hai tông màu đặc, bóng đổ, bé ma lơ lửng, đạn / chớp nòng / trại đội / hộp tiếp tế hắt sáng, vòng an toàn phát sáng) · `tro-sinh-ton.css` (`.st-phu`: nắng chéo + viền tối quanh màn là MỘT lớp CSS, không tốn lượt vẽ canvas).
- **TỰ HẠ:** hơn 1/4 số khung trong 120 khung chậm hơn 19 ms (dưới ~48 khung / giây) ⇒ máy tự chuyển sang kiểu PHẲNG (bỏ bóng + ánh sáng + nền gạch, về đúng mức vẽ bản trước) cho tới khi rời phòng chờ. Máy yếu (`ddh.mayYeu`) và «giảm chuyển động» phẳng ngay từ đầu.
- **Đo (Chromium KHÔNG có chip đồ hoạ — trường hợp xấu):** 844 × 390 và 667 × 375: 61 khung / giây, giữ đủ bóng + ánh sáng (cả sân 40 em). 1180 × 820: 42 khung / giây lúc đầu ⇒ tự hạ sau ~4 giây ⇒ 60. Màn thầy 940 × 590: 50 ⇒ tự hạ ⇒ 61. Bản trước: 58–62 ở mọi khổ. Mảnh `TroSinhTon` 16,3 → 18,6 KB nén (nạp lười). CHƯA đo trên điện thoại / máy tính bảng thật.
- **«Cho đạn của 4 cấp súng bắn nhanh hơn chút nữa» (13/11):** nhịp bắn 3 → 4 phát / giây (Pháo Sao 1 giây → 0,7 giây một phát), đạn bay nhanh hơn, sát thương mỗi giây 30 · 40 · 50 · 60 → 36 · 48 · 60 · 72. Hình đạn, tiếng súng và sát thương cùng lấy từ `NHIP_BAN_MS` / `SAT_THUONG_GIAY`.
- **Sửa sau số đo của tác tử tốc độ (13/11 04:15):** ở CPU ×4, màn 1180 × 820 tụt còn 27 khung / giây suốt ~4 giây đầu trước khi tự hạ. Nay đo theo cửa sổ 0,6 giây (bỏ 1 giây đầu): hai cửa sổ liền nhau dưới 48 khung / giây ⇒ phẳng sau ≈ 2,2 giây; máy đã hạ được NHỚ 1 ngày (`ddh.sinhton.phang`) ⇒ lần sau phẳng ngay từ khung đầu. Đồng thời vá lỗi bộ đếm cũ: khung dài hơn 250 ms làm đặt lại bộ đếm nên máy rất chậm không bao giờ hạ được.
