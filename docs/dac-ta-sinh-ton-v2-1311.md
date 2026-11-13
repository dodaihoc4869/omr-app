# Đặc tả «Sinh Tồn · Trang vở» (bản 2) — 13/11/2026 · CHỜ THẦY DUYỆT ẢNH, CHƯA BUILD

Bản vẽ: `docs/ban-ve-sinh-ton-v2-1311/` (24 ảnh Chromium thật + `00-tong-quan.jpg`). Chạy lại: `npx vite --port 5231 --strictPort` rồi
`node docs/ban-ve-sinh-ton-v2-1311/chup.mjs [lọc] [--do]`. Trang vẽ dùng **bản đồ, vòng an toàn, bụi của lõi thật** (`src/lib/live-khoi/sinh-ton-loi.ts`)
và **màu đọc từ token thật**; trình vẽ trong thư mục bản vẽ là bản nháp, lúc build viết lại trong `src/components/live-khoi/`.

## Lời thầy (13/11, theo thứ tự)
1. «thiết kế hình ảnh 2d hấp dẫn hơn… nhẹ nhất cuốn hút nhất… phá cách hoàn toàn với đồ họa 2d truyền thống». «Tôi đồng ý với tất cả các đề xuất trên… vẽ cho tôi xem trước khi build».
2. «thêm những câu… kiểu đỗ đại học rồi, trượt đại học rồi, thủ khoa… đã tiêu diệt thủ khoa…»
3. «cho nền chuẩn doligo nhé» · «tối là #131f24 mặc định là nền này luôn nhé».
4. «cho tới 6 khẩu súng nhé, thiết kế đẹp vào, đạn cũng xịn nữa».
5. «máy thì ko ghi là máy nữa đặt tên ngẫu nhiên giống học sinh».
6. «làm cho bản đồ rộng lớn hơn nhé, cách xuất hiện và sống lại hiệu ứng cũng wow xịn» · «vẫn là 2d nhưng vẽ đổ bóng 3d» · «bản đồ tự động thay đổi rộng lớn cho số lượng học sinh khác nhau».

## Hướng mỹ thuật «Trang vở»
- **Cả sân là trang vở ô li trên nền Duolingo tối #131f24** (luôn tối, kể cả máy để sáng). Có lề đỏ đôi, gáy vở khâu chỉ giữa mỗi trang, công thức Hoá viết bút chì mờ ở mép trang. Công thức đã soát:
  `2Na + 2H₂O → 2NaOH + H₂↑` · `2K + 2H₂O → 2KOH + H₂↑` · `Ca + 2H₂O → Ca(OH)₂ + H₂↑` · `Cu + 2AgNO₃ → Cu(NO₃)₂ + 2Ag` · `CaCO₃ → CaO + CO₂↑ (t°)`. Bên lề có hình vẽ chơi: vòng benzen và bình tam giác.
- **Mọi thứ vẽ tay bằng nét bút / phấn**: nét rung hai lượt, bé ma «sống» bằng 2 khung nét rung (kiểu hoạt hình vẽ tay). Bé ma vô diện giữ nguyên thiết kế thầy đã duyệt: mặt màu đội, áo choàng, chỏm riêng từng đội (lửa · tai · ăng-ten · nơ).
- **Vật chặn là đồ dùng học tập NỔI KHỐI 3D**: thước kẻ, bút chì, bút dạ, cục tẩy, có mặt trên, mặt trước tối hơn và bóng đổ từ chân khối. Bụi là mây bút dạ có đáy. Hộp tiếp tế là khối giấy nhớ. Bục bảng vàng là khối 3 mặt. Tất cả vẫn là 2D, nướng sẵn thành ảnh.
- **Lớp phủ**: băng dính giấy cho dải điểm, giấy nhớ vàng cho bản đồ nhỏ. Câu hô là **con dấu đỏ của thầy**. Chữ dùng phông viết tay **Patrick Hand** (OFL, đủ dấu tiếng Việt; latin 23,9 KB + tiếng Việt 11,6 KB, đã thử «ỗ ữ ặ ẫ ễ Ở»).
- **Màu**: mọi màu lấy từ token có sẵn. Mặt trang `--tr-nen`, kẻ `--tr-vien`, thẻ `--tr-mat`, chữ `--tr-chu`, bốn đội `--p-cam / --p-tim-2 / --p-xanh / --p-do`. Sắc mới chỉ pha bằng `color-mix`.
  - «Luôn tối» cần bộ token riêng không theo máy. Thêm `--st-nen: #131f24`, `--st-mat: #202f36`, `--st-vien: #37464f`, `--st-vien-2: #1a282e`, `--st-chu: #f1f7fb` vào `src/styles/tokens.css` (chỗ duy nhất được ghi mã màu; thầy ra lệnh 13/11). Trò đọc `--st-*`.
  - `kiem:mau-giu` phải bằng 0.

## Đủ 10 đề xuất + phần thầy thêm (ảnh tương ứng)
| # | Việc | Ảnh |
|---|---|---|
| 1 | Trúng / hạ có lực: số máu bay, vết mực, giấy vo, con dấu chuỗi hạ | `04-trung-ha-chuoi-844` |
| 2 | Bảng vàng cuối ván: máy thầy chiếu + thẻ máy em | `13-bang-vang-may-thay-1366`, `14-cuoi-van-em-844` |
| 3 | Biểu cảm nhanh: chạm bé ma của em ⇒ 4 nhãn 58 px «Hay quá! · Cứu với! · Theo tớ! · Haha», cả lớp thấy 2 giây | `06-bieu-cam-844` |
| 4 | Truy nã thủ khoa: vương miện, tên đỏ, sao trên bản đồ nhỏ, hạ được thì súng lên cấp ngay | `07-truy-na-844`, `08-diet-thu-khoa-844` |
| 5 | Thầy vào trận: bé ma Thầy to ×2,2, đeo kính, súng bút đỏ; máy thầy có nút «Thầy vào trận / Rời trận»; chỉ ở phòng chờ live | `11-thay-vao-tran-em-844`, `12-thay-vao-tran-may-thay-1366` |
| 6 | Hộp tiếp tế 4 loại: Hồi đầy máu · Khiên 5 giây · Chạy nhanh 6 giây · Pháo Sao 10 giây | `09-hop-tiep-te-844`, `02-bo-hinh-1366` |
| 7 | Boss Ma Mực giữa ván: thanh máu + phần trăm sát thương bốn đội; đội đánh nhiều nhất được cộng 5 lượt hạ | `10-boss-ma-muc-844` |
| 8 | Tủ đồ bé ma: mũ, áo choàng, vệt đạn, hiệu ứng khi hạ, mở bằng **chuỗi ngày** và **cấp** EXP thật; **chỉ đổi hình, không mạnh hơn** | `15-tu-do-390` |
| 9 | Đội cố định cả học kỳ + thi đua đội tuần (lượt hạ cộng dồn) | `16-sanh-…-390`, `17-thi-dua-tuan-may-thay-1366` |
| 10 | Danh hiệu tuần: Thợ săn tuần · Kẻ phá thủ khoa · Hạ gục Thầy, hiện cạnh tên suốt tuần sau | `16`, `17` |
| + | Phòng chờ ca kiểm tra bản êm | `18-ban-em-phong-cho-ca-844` |
| + | Sáu khẩu súng, sáu kiểu đạn | `19-sau-khau-sung-1366` |
| + | Sân tự lớn theo sĩ số | `20-san-tu-lon-theo-si-so-1366` |
| + | Xuất hiện đầu ván: nét chì vẽ viền → bút dạ quét màu → bung vòng mực, giấy hoa, sao, chữ «Vào trận!» | `21-xuat-hien-dau-van-844` |
| + | Sống lại: cục giấy vo mở ra → vẽ lại → bung; vòng «Bất tử 2 giây» nhấp nháy; chữ «Thi lại!» | `22-song-lai-844`, `05-bi-ha-844` |
| + | Bảng câu hô | `03-cau-ho-1366` |

### Câu hô (con dấu đỏ; chỉ ở phòng chờ live)
| Khi nào | Câu |
|---|---|
| Hạ đầu tiên của ván (cả lớp thấy dòng tin) | MỞ BÀI! |
| Chuỗi 2 · 3 · 4 · từ 5 (hạ liên tiếp, chưa bị hạ) | ĐỖ TỐT NGHIỆP! · ĐỖ ĐẠI HỌC! · Á KHOA! · KHÔNG AI CẢN NỔI! |
| Em dẫn đầu lượt hạ ván ⇒ bị truy nã | EM LÀ THỦ KHOA! (dấu vàng) |
| Hạ bạn đang bị truy nã | ĐÃ TIÊU DIỆT THỦ KHOA! |
| Hạ bạn đang có chuỗi từ 3 | ĐÁNH TRƯỢT ĐẠI HỌC! |
| Em bị hạ · bị Thầy hạ | TRƯỢT ĐẠI HỌC RỒI! (kèm «Thi lại sau 3 giây») · BỊ THẦY GẠCH TÊN! |
| Em hạ Thầy | ĐÃ HẠ GỤC THẦY! (dấu vàng, tên lên bảng vàng) |
| Đội em hạ Ma Mực · cả một đội bị hạ cùng lúc | ĐÃ DIỆT MA MỰC! · CẢ ĐỘI CANXI TRƯỢT! |
| Ra ngoài vòng · 10 giây cuối · đầu ván · sống lại | RA KHỎI PHÒNG THI! · SẮP THU BÀI! · VÀO TRẬN! · THI LẠI! |
| Cuối ván theo hạng đội | ĐỖ THỦ KHOA VÁN n! · Đỗ á khoa · Đỗ vớt · Thi lại ván sau |

Phòng chờ ca kiểm tra không có con dấu và **không dùng chữ «trượt»** (ngay trước giờ kiểm tra thật, chữ này gây áp lực / «xui»). Dòng tin hạ chỉ giữ câu tích cực.

### Sáu khẩu súng (hạ được bạn ⇒ lên một cấp; bị hạ ⇒ về cấp 1)
| Cấp | Súng | Đạn | Hiệu ứng đề xuất | Sát thương / giây (đề xuất) |
|---|---|---|---|---|
| 1 | Súng Hạt | hạt mực tròn + vệt tốc độ | — | 34 |
| 2 | Súng Đôi | hai tia song song | — | 42 |
| 3 | Súng Bọt | bọt khí to rung rinh | vỡ ra: nửa sát thương lên bạn đứng sát (bán kính 40) | 50 |
| 4 | Súng Sấm | tia sấm gấp khúc có nhánh | nảy nửa sát thương sang 1 đối thủ trong 90 (luật cấp 3 hiện tại) | 58 |
| 5 | Súng Lửa Màu | cầu lửa **đúng màu thử ngọn lửa của nguyên tố đội**: Na vàng · K tím · Cu xanh lục · Ca đỏ cam | cháy thêm 2 giây, 8 máu / giây | 66 |
| 6 | Pháo Sao | sao lớn xoay, đuôi sao | nổ lan bán kính 60 (luật cấp 4 hiện tại) | 74 |

Máy bù lên tối đa cấp 3. Cân bằng chốt bằng mô phỏng `tests/live-khoi-sinh-ton-*` lúc build.

### Sân tự lớn theo sĩ số (đếm cả máy bù, mỗi đội ít nhất 4; chỉ đổi ở đầu ván)
| Số nhân vật | Sân | Ghép |
|---|---|---|
| tới 20 | 3200 × 2000 | 2 × 2 trang |
| 21 – 36 | 4800 × 2000 | 3 × 2 |
| 37 – 64 | 4800 × 3000 | 3 × 3 |
| 65 – 96 | 6400 × 3000 | 4 × 3 |
| từ 97 | 6400 × 4000 | 4 × 4 |

Thang này **thay hẳn** thang 5 mức vừa lên sống ở `f5954054d` (bắt đầu 1600 × 1000); lúc build không giữ cả hai. Mỗi trang 1600 × 1000 có đủ vật chặn, bụi và **một hộp tiếp tế ở giữa trang**. Bốn trại ở bốn góc ngoài sân. Vòng an toàn co nhanh hơn ở sân lớn để cuối ván vẫn chạm trán. Trại đã ngoài vòng thì hồi sinh ngay mép trong vòng (luật `choTrai(…, nay)` đã có).

### Máy bù mang tên như học sinh
- Không có nhãn «Máy» ở bảng tên, tin hạ hay máy chiếu (máy chiếu ghi «40 bạn đang chơi»).
- Tên lấy từ kho khoảng 80 tên gọi tiếng Việt (2 chữ). Loại mọi tên có trong **danh sách lớp** (không chỉ em đang trong phòng), để em vắng mặt không thấy «mình» đang chơi. Mỗi máy giữ một tên suốt ván. Máy thầy vẫn biết số máy ở bảng điều khiển riêng, không chiếu lên.
- Máy bù **không bao giờ** vào bảng vàng, thi đua tuần hay danh hiệu, để máy chiếu không vinh danh một bạn không có thật.

## 1. Mục tiêu sư phạm + ai dùng
Học sinh ở phòng chờ live và phòng chờ ca kiểm tra; thầy chiếu ở máy chiếu. Trò giữ em ở lại sớm và vui trước giờ học. Các mốc thưởng (trang phục, danh hiệu, đội cả kỳ) **nối với học đều** qua chuỗi ngày và cấp EXP, không bao giờ cộng sức mạnh. Câu hô theo «hành trình thi cử» để không khí sôi nổi đúng chất lớp luyện thi. Phòng chờ ca là bản êm.

## 2. Bố cục
- **Ngang 844 × 390 / 667 × 375 / 1180 × 820**: dải điểm giữa trên, tin hạ góc phải trên, loa (+ «Thoát trò» ở phòng ca) góc trái trên, thanh 6 cấp súng góc trái dưới, trạng thái phòng chờ giữa dưới, bản đồ nhỏ góc phải dưới. Ở khổ < 760 px: bỏ chữ «Súng cấp n ·», tin hạ xuống dưới dải điểm.
- **Dọc 390**: thẻ sảnh (đội cả kỳ, danh hiệu, thi đua tuần, «Tủ đồ», «Chơi»), tủ đồ (xem trước, luật «chỉ đổi hình», lưới 2 cột, dải nút dính đáy).
- **Máy chiếu 1366**: thanh điều khiển của thầy, cả sân, gợi ý «Thầy chạm vào sân để bé ma Thầy chạy tới».
- Đích bấm ≥ 44 px (đã soát bằng máy).

## 3. Trạng thái
Vào trận (đầu ván) · đang chơi · trốn trong bụi · khiên · bất tử 2 giây · bị hạ (đếm 3 giây) · sống lại · ngoài vòng · thủ khoa bị truy nã · Ma Mực xuất hiện / bị diệt · Thầy trong trận / rời trận · 10 giây cuối · bảng vàng 5 giây · mất mạng (giữ dòng hiện có) · phòng ca đóng mã 4000 ⇒ gỡ trò ngay · máy yếu ⇒ kiểu phẳng (bỏ nét rung, bỏ khối, giữ bóng 1 lớp).

## 4. Dữ liệu
- **Ảnh chụp phòng (`SinhTonAnh`) thêm** (đổi giao thức ⇒ `PHIEN_BAN_ST` +1 mỗi đợt):
  - `tk` mã thủ khoa đang bị truy nã, vì `an` bị xoá sau mỗi ảnh nên máy em không tự tính được;
  - `bx` boss `{x, y, máu, %4 đội}`;
  - `ty` mã bé ma Thầy;
  - `hp` loại hộp từng trang;
  - `bv` bảng vàng (top 3 + hạng đội), **một lần cuối ván**.
- **Gói của em thêm** `e` (biểu cảm 0–3) và `c` (bộ đồ đang mặc, gửi một lần lúc vào).
- **Trang phục**: điều kiện mở tính từ `cap` (`server/src/exp-ho-so-game.ts`) và chuỗi ngày (`server/src/chuoi-ngay-bai-d1.ts`), **đọc cùng lúc phát vé** (dữ liệu đã đọc sẵn) ⇒ 0 vòng chờ D1 thêm; máy chủ cấp, máy em không tự mở.
- **D1 chỉ-thêm**:
  - `st_mac (sbd, mu, ao, dan, ha, luc)`: đồ đang mặc;
  - `st_doi_ky (sbd, ky, doi)`: đội cả học kỳ;
  - `st_tuan (tuan, sbd, doi, ha, bi_ha, ha_thay, diet_tk)`: thi đua tuần + danh hiệu.

## 5. Ngoại lệ
- Em vào giữa ván ⇒ hiện ra theo hiệu ứng «sống lại».
- Đổi cỡ sân giữa hai ván ⇒ dòng «Lớp đông hơn · sân mở rộng».
- Đội cả kỳ làm lệch người trong một phòng ⇒ máy bù bù đủ 4 mỗi đội.
- Thầy rời trận / mất mạng ⇒ bé ma Thầy biến mất, không tính hạ.
- Boss chưa chết khi hết ván ⇒ không thưởng.
- Tên dài ⇒ cắt ở 16 ký tự.
- Đổi tab ⇒ dừng vẽ (giữ nguyên hiện tại).
- Máy yếu (`ddh.mayYeu` hoặc tự hạ khi < 48 khung / giây) ⇒ kiểu phẳng.

## 6. Chi phí máy chủ
- **Đường trò vẫn 0 D1.**
- Ghi D1 chỉ khi đóng phòng (`/dong` hoặc mỗi 5 ván): một `batch` cho cả phòng.
- Đọc trang phục / đội cả kỳ cùng lệnh phát vé.
- **Phải làm trước mục 5 và 7 — «chỉ gửi gần»**: mỗi máy em chỉ nhận nhân vật trong khoảng 1,5 khung nhìn, cộng dải điểm và các mã đặc biệt (`tk`, `ty`, `bx`). Máy thầy nhận đủ.
  - Số đo hiện tại: 78 em gửi 693 KB / giây (trò cũ 135).
  - Đích: ≤ 200 KB / giây ở 78 em.
  - Sân lớn hơn ⇒ ít bạn trong tầm hơn ⇒ càng nhẹ.

## 7. Nghiệm thu đo bằng máy (lúc build)
- `npx vitest run tests/live-khoi-sinh-ton-loi-1211.test.ts tests/live-khoi-sinh-ton-may-1211.test.ts tests/live-khoi-may-chu-1211.test.ts tests/sinh-ton-ca-phong-1311.test.ts tests/sinh-ton-ca-man-1311.test.tsx` cùng các test mới:
  - thang cỡ sân 5 mức, đối xứng, thông đường;
  - 6 cấp súng;
  - câu hô theo sự kiện, phòng ca không có chữ «trượt»;
  - máy bù không mang nhãn «Máy», không trùng tên em thật;
  - trang phục không đổi sát thương / tốc độ;
  - `PHIEN_BAN_ST` tăng.
- `npm run build && npm run kiem:toc-do` 0 đỏ: byte tải mở 3 app **không tăng**. Phông và ảnh chỉ nằm trong mảnh `TroSinhTon`, đưa vào `globIgnores`, `kiem-sw` 14/14.
- `npm run kiem:mau-giu` 0 · `check:mau` 0 (mã màu chỉ ở `tokens.css`).
- **Khung hình (bộ đo của tác tử toc-do, màn trận 844 × 390, 15 bạn)**: CPU ×4 ≥ 40,2 và ×6 ≥ 25,5 khung / giây (số bản hiện tại).
  - Trang vẽ nháp (không chip đồ hoạ, khác mã sản xuất nên chỉ để tham khảo):
    - 7 bé ma: 60,3 / 42,7 / 31,7 khung / giây ở ×1 / ×4 / ×6;
    - **15 bạn quanh em như mốc: 60,3 / 37,0 / 24,3**, tức **chưa đạt** mốc 40,2 / 25,5.
  - Lúc build phải bù bằng cách nướng sẵn bảng tên + vạch máu thành ảnh (trang nháp vẽ chữ mỗi khung) và gộp công thức / hình vẽ chơi vào ô mẫu nền. Chưa đạt mốc thì chưa phát hành.
  - Nền ô mẫu và vùng gạch tô theo **điểm ảnh thiết bị**, không co giãn mẫu mỗi khung: nếu co giãn thì chỉ còn 24 khung / giây ở ×4.
- Bộ nhớ ảnh nướng sẵn ≤ 12 MB ở dpr 2: bé ma 4 đội × 2 hướng × 2 khung + trang phục đang có trên sân, súng 6 × 4, vật chặn theo cỡ.
- Ảnh Chromium: 0 lỗi trang, 0 tràn, 0 đè, 0 đích bấm < 44 px (`chup.mjs` đã soát; lượt cuối 24 ảnh: 0 lỗi trang).
- Sau khi gộp: tác tử `toc-do` đo trước / sau.

## Chưa làm / cần thầy biết
- Đây là **bản vẽ**: chưa đụng mã sản xuất, chưa đổi giao thức.
- **Khối lượng build lớn**, đề nghị chia đợt:
  1. nền tối + hình «Trang vở» + 6 súng + câu hô + xuất hiện / sống lại + tên máy bù;
  2. «chỉ gửi gần» + sân lớn mới;
  3. truy nã + hộp 4 loại + biểu cảm + bảng vàng;
  4. Thầy vào trận + Ma Mực;
  5. tủ đồ + đội cả kỳ + thi đua tuần + danh hiệu (D1 chỉ-thêm).
