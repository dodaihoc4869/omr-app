# App học sinh v2 · hệ «Kính» — đặc tả + bản vẽ toàn bộ màn (02/11)

**Lịch sử yêu cầu**
- Thầy 02/11: «bản sắc riêng không giống doligo … vẽ toàn bộ vector».
- Thầy chê bản v1 «Ô nguyên tố» (`../DAC-TA.md`): «chưa có đột phá và khác biệt thực sự».
- Thầy dặn thêm: «học tập mọi thiết kế tốt nhất thân thiện nhất đẹp nhất trên thế giới», rồi «vẽ vector sắc nét chuyên nghiệp như các app hàng đầu … vẽ tất cả các màn».

Đây là bước 2 của quy trình 4 bước. Thầy chưa duyệt thì chưa build.

## Xem nhanh

| Mục | Ở đâu |
|---|---|
| Đang chạy → v1 → v2 | `bang/00-truoc-sau.jpg` |
| 5 tấm theo nhóm màn | `bang/01-…05-…jpg` |
| Từng màn, 4 khổ | `bang/man-<màn>.jpg` (máy tính sáng · ngang tối · điện thoại sáng · điện thoại tối) |
| Ảnh gốc | `anh/` — 29 màn × 3 khổ × sáng/tối = 174 ảnh |
| Mã vẽ | `tao.mjs` (bộ sinh), `kinh.css` (hệ), `binh.js` (bình tam giác), `kve.js` (hình khối) |

Chạy lại: `node tao.mjs && node chup.cjs <màn>… && python3 ghep.py`

## 1. Khác Duolingo ở **khung**, không chỉ ở hình

| Khung Duolingo app đang có | v2 thay bằng |
|---|---|
| Đường nút tròn đi xuống | Màn **«Hôm nay»**: một số lớn + **bình tam giác** dâng dung dịch + danh sách việc có ô tích, theo đúng thứ tự và khoá như cũ |
| Linh vật đứng cạnh đường | Mol nói trong bong bóng kính, đứng ngay trên nút chính |
| Dải bộ đếm trên cùng | Chuỗi · Nguyên tử · Tinh thể là chip trong thẻ «Mức hôm nay» |
| Thanh tab chạy hết mép đáy / menu mép phải | **Thanh công cụ kính nổi** (không chạm mép) + **nút A.I tròn tách riêng**. Máy tính / xoay ngang: ray nổi bên trái |
| Rương cuối đường | Khoảnh khắc **đủ mức = dung dịch đổi hồng** (phenolphtalein tới điểm tương đương) |
| Dải màu kết quả hết đáy, nút 3D gờ dày | Thẻ kết quả kính bo 32, nút viên thuốc, không gờ đáy |
| Kết chặng kiểu bảng điểm | Kết chặng dạng **story**: thanh story, chữ rất to, mỗi dòng một con số |

## 2. Học từ ai, áp vào đâu

| Nguồn (thiết kế hàng đầu) | Học điều gì | Áp vào màn |
|---|---|---|
| **Apple Liquid Glass** (WWDC 2025): vật liệu trong suốt, khúc xạ ánh sáng nền | Mọi thẻ là **kính** nổi trên nền màu loang → trùng với đồ thuỷ tinh phòng thí nghiệm | Toàn app |
| **Google Material 3 Expressive** (2025): hình khối đậm, đa dạng, thanh công cụ nổi | Thanh công cụ nổi không tràn mép; huy hiệu mỗi cái một hình (bánh quy 12 múi = logo app, cỏ 4 lá, hoa 8 cánh, lục giác bo); nút chính viên thuốc lớn có ô bánh quy | Thanh dưới, Huy hiệu, nút chính |
| **Thanh tab iOS 26**: nút tìm kiếm tách thành nút tròn riêng | **Nút A.I tròn tách khỏi thanh** — luôn với tới, không chen vào 4 mục | Mọi màn chính |
| **Apple Fitness** (vòng hoạt động): một con số lớn, đóng vòng là khoảnh khắc ăn mừng | «Mức hôm nay 14/24» số 68 px; đủ mức là đổi hồng | Hôm nay |
| **Things 3** (danh sách việc được khen gọn nhất) | Ô tích tròn, việc xong gạch ngang, việc đang làm có vòng tiến độ, việc khoá có ổ khoá | Việc hôm nay |
| **Brilliant** (học bằng tương tác, một ý mỗi màn) | Màn làm câu thoáng, đề một thẻ, phương án viên thuốc, Học cách giải từng bước có sơ đồ | Làm câu, Học cách giải, Chữa câu sai |
| **Finch** (thú nuôi đồng hành, giữ chân người dùng) | Mol luôn hiện diện, nói đúng việc tiếp theo, đổi mặt theo kết quả | Hôm nay, Kết chặng, Tự sửa lỗi, Thành tích |
| **Instagram Stories / Spotify Wrapped** | Tổng kết bằng chữ cực to, mỗi màn một ý, thanh story | Kết chặng |
| **Tide Guide** (Apple Design Award 2026, đồ hoạ) | Biểu đồ đường cong mượt, vạch mức nét đứt | Thành tích: 14 ngày gần nhất |
| **CapWords** (Apple Design Award 2025, «Vui và cuốn hút»: ảnh chụp → nhãn dán) | Ảnh đề em gửi hiện thành **nhãn dán** viền trắng nghiêng | A.I Đỗ Đại Học |
| **Bento grid** (trang sản phẩm Apple, widget iOS) | Ô to nhỏ khác nhau theo độ quan trọng | Luyện tập, Tu luyện, Cửa hàng |
| **Bảng xếp hạng nhóm** (vùng lên / xuống) | Vạch «Vùng lên nhóm / Vùng xuống nhóm» | Giải tuần |

Nguồn tham khảo:
- [Apple — 2025 Apple Design Awards](https://www.apple.com/sn/newsroom/2025/06/apple-unveils-winners-and-finalists-of-the-2025-apple-design-awards)
- [Apple — 2026 Apple Design Awards](https://www.apple.com/newsroom/2026/06/apple-reveals-winners-of-the-2026-apple-design-awards/)
- [TechRadar — Liquid Glass](https://www.techradar.com/tech/apple-reveals-major-visual-redesign-for-ios-26-macos-26-and-more-at-wwdc-2025)
- [Dezeen — Material 3 Expressive](https://www.dezeen.com/2025/05/28/google-ushers-in-age-of-expressive-interfaces-with-material-design-update/amp/)
- [9to5Google — Material 3 Expressive](https://9to5google.com/2025/05/05/material-3-expressive-leak/)
- [Pratt IxD — phê bình Finch](https://ixd.prattsi.org/2026/02/design-critique-finch-self-care-pet-ios-app/)

Ghi chú về số liệu Material 3 Expressive: Google nói đã làm 46 nghiên cứu với hơn 18 000 người, và người dùng nhận ra nút chính nhanh hơn tới 4 lần. Đây là số do Google tự công bố, chưa có bài bình duyệt độc lập.

## 3. Hệ hình

- **Màu: giữ 100% biến `--tr-*`** (bảng chất chỉ thị thầy chốt 27/10).
  - Nền loang chỉ là 4 dải `radial-gradient` pha từ chàm, ngọc lam, hồng, vàng. Không ảnh, không mã màu mới.
  - Chữ nhỏ trên mặt tô đậm dùng biến đậm hơn (`--tr-hs-day`, `--tr-*-chu`) để đạt ≥ 4,5:1. Máy đo của `chup.cjs` kiểm từng chữ.
- **Phông:** giữ ĐĐH Rounded. Số lớn đậm 800, chữ thường, không IN HOA trên nút.
- **Kính:** `--kinh` = mặt thẻ 62% + `backdrop-filter: blur(26px) saturate(170%)` + viền sáng mép trên.
  - Máy yếu / giảm hiệu ứng: bỏ blur, kính thành mặt đặc `--kinh-dam` (không mất chữ, không mất nút).
- **Vector:** mọi hình đều là SVG vẽ bằng mã hoặc CSS: bình tam giác (dải phản quang, mặt khum, bọt, vạch chia), hình khối, biểu đồ, kim cương, nhãn dán. Mol là SVG thật của app. Không thêm ảnh PNG/JPG nào vào đường tải.

## 4. Màn đã vẽ (29) — tính năng giữ nguyên, chữ lấy từ app thật

| Nhóm | Màn |
|---|---|
| Hôm nay | đang học · đủ mức (đổi hồng) · ngày có Kiểm tra ôn tập + điểm danh · ca kiểm tra đang mở · tấm Thông báo |
| Học một chặng | câu mới (Tự làm / Học cách giải) · trắc nghiệm + phương trình dài + Gợi ý · bàn phím số · Đúng–sai (chưa đúng) · Trả lời ngắn (đúng, «Cách nghĩ») · Học cách giải (sơ đồ cột dọc) · Kết chặng (story) |
| Luyện tập | bento 6 việc · Tự sửa lỗi · Chữa câu sai (đường tự gỡ 4 bước) · Câu đã làm (lọc + lịch ôn) · Tu luyện (4 chế độ + bộ lọc) · Bài tập về nhà |
| Thành tích | tổng quan (chuỗi, biểu đồ 14 ngày, huy hiệu hình khối) · Chuỗi ngày (lịch, bình giữ chuỗi) · Giải tuần · Cửa hàng · Học cùng bạn · Thử thách Kim cương · Kết quả ca kiểm tra |
| Khác | Thêm (điểm danh 6 ô mã, ca kiểm tra, A.I, thông báo, cài đặt, của em) · A.I Đỗ Đại Học · Đăng nhập · Thầy tạm đóng app |

**Không vẽ lại**
- Màn thi thật (`ExamTakeScreen`): luật C-RÀO.
- Màn bài Kiểm tra ôn tập: làn Codex, giao sau khi thầy chốt.

## 5. Thay đổi cần thầy chốt

1. **Đổi tên «Lộ trình» → «Hôm nay»**, vì không còn con đường. Bảng từ chuẩn A2 sẽ sửa theo.
2. **Bỏ menu mép phải (chốt 27/10).** Thay bằng thanh công cụ nổi 4 mục (Hôm nay · Luyện tập · Thành tích · Thêm) + nút A.I tròn riêng. Ca kiểm tra, điểm danh, cài đặt nằm trong «Thêm»; ca đang mở và điểm danh còn hiện thẳng ở Hôm nay.
3. **Chữ mới đề xuất:**
   - «MỨC HÔM NAY», «Còn 10 câu nữa là dung dịch đổi màu», «tới điểm tương đương, dung dịch đã hồng»;
   - 2 dòng phụ ở Tự làm / Học cách giải;
   - «Câu này mới với em…», «Cách nghĩ»;
   - phần chữ của Kết chặng dạng story;
   - Cửa hàng: tên các món ngoài bình giữ chuỗi chỉ là ví dụ minh hoạ — **món thật lấy từ máy chủ**;
   - Giải tuần: «Vùng lên nhóm / Vùng xuống nhóm», «Nhóm Bạc · tuần 45»;
   - Tạm đóng: «Em nghỉ một chút nhé…».

## 6. Dữ liệu · máy chủ · tốc độ

- **Không thêm lệnh máy chủ.** Mọi số lấy từ nguồn đang có (`TrongHs.tsx`, `ThanhThuong`, `ManLamBaiTap`, `ManTuChua`, các màn thưởng phạt).
- Hai chỗ cần kiểm khi build (nếu chưa có thì ghi thành việc máy chủ riêng):
  - biểu đồ 14 ngày dùng `nhip.ngay` (đang có cho 7 ngày);
  - «Bài tập về nhà» 3 ô (Chặng đang mở / Chặng sau / Nộp bài) lấy đúng từ màn BTVN cũ.
- **Tốc độ:**
  - bỏ mặt nạ công thức data-URI và các luật gờ 3D;
  - thêm khoảng 2–3 KB CSS hệ Kính;
  - bình / hình khối vẽ bằng mã (~2 KB), không thêm phông, không thêm ảnh;
  - `backdrop-filter` tắt trên máy yếu;
  - không có hoạt ảnh vô hạn.
  - Mục tiêu: byte mở app HS ≤ mốc `docs/moc-toc-do.json`.

## 7. Nghiệm thu bằng máy

- **Bản vẽ (đã đạt):** 174 ảnh. Kết quả dòng TỔNG của `chup.cjs`: 0 lỗi trang, 0 tràn ngang, 0 đích bấm < 44 px, 0 chữ cắt, 0 cặp chữ/nền dưới ngưỡng tương phản.
- **Khi build:**
  - `tsc` + vitest liên quan + test mới cho bình (số câu → mức dung dịch, đổi hồng khi đủ mức, vượt mức) và danh sách việc (thứ tự, khoá);
  - `npm run build && npm run kiem:toc-do` 0 đỏ;
  - `kiem:mau-giu` 0;
  - `check:mau`;
  - `kiem-sw`;
  - ảnh bản thật 4 khổ;
  - tác tử `toc-do`.
- **Thứ tự build** (mỗi bước một PR):
  1. hệ Kính + thanh công cụ;
  2. Hôm nay;
  3. làm câu + kết chặng;
  4. Luyện tập;
  5. Thành tích;
  6. Thêm / A.I / đăng nhập.
