# Đặc tả chế độ LIVE màn hình chữa bài — 10/11/2026 (bước 2 quy trình 4 bước, CHỜ THẦY DUYỆT ẢNH)

Thầy 10/11: «thêm chế độ live màn hình chữa bài trên bảng, tôi muốn viết bằng bút wacom lên phần bảng đen… cực mượt… giọng nói phải tức thì. Chỉ cần bấm một nút live trên màn chiếu là lập tức máy học sinh xem full màn hình màn chiếu và tự xoay ngang luôn.» · «làm tiếng và hình phải tức thì… hs phải trầm trồ vì như nói trực tiếp với nhau» · «bên học sinh cũng có mic để đàm thoại 2 chiều» · «khi bấm live app hs áp dụng cả rời màn, cửa sổ nổi, chia đôi màn hình cảnh báo cho thầy» · «nút đổi màu theo đội của em… tự ẩn để tăng diện tích tối đa màn hình, có nút nhỏ vuốt ra».

- Bản vẽ: `docs/ban-ve-live-1011/` (40 ảnh Chromium thật, danh sách ở mục 11). Trang mô phỏng: `docs/ban-ve-live-1011/mo-phong.html`, chụp lại bằng `node scripts/chup-ban-ve-live-1011.mjs`.
- Chưa build gì vào mã chạy. Chưa tham vấn được cố vấn (phiên tác tử phụ không có công cụ cố vấn).
- Phụ thuộc: bộ máy bút mới (nhánh `claude/but-bang-1011`, chưa đẩy lên máy chủ lúc viết) phải xuất nét theo hợp đồng ở mục 4.3.

## 0. Kết luận nhanh

| Kênh | Chốt | Trễ kỳ vọng (sẽ đo ở Đợt 0) |
|---|---|---|
| HÌNH | Phát lại VECTƠ. Máy em tự dựng đề từ `cau` đã có, vẽ nét phấn nhận được. Điểm đang viết đi **DataChannel không tin cậy qua Cloudflare Realtime SFU**; nét đã xong + ảnh trạng thái đi **WebSocket qua phòng (Durable Object) đang có**. | ngòi bút chạm → hiện trên máy em: Wi-Fi 65–125 ms, 4G tốt 105–200 ms |
| TIẾNG | **WebRTC Opus qua Cloudflare Realtime SFU**, một chiều thầy → lớp ở Đợt 1, hai chiều (giơ tay, mời nói) ở Đợt 2. | miệng thầy → loa máy em: Wi-Fi 115–240 ms, 4G tốt 170–320 ms |
| Vào live | Máy em nối SFU ngầm từ lúc vào phòng; thầy phát sẵn một track câm, bấm Live chỉ đổi nguồn sang mic (`replaceTrack`, không đàm phán lại). | bấm Live → có hình + tiếng ≤ 1 giây |
| Chi phí | Băng thông ra ≈ 16 GB cho một buổi 300 em × 90 phút. Cloudflare miễn phí 1.000 GB mỗi tháng. | 26 buổi/tháng ≈ 416 GB ⇒ **0 USD** thêm |

Kiểm tài khoản Cloudflare (chỉ đọc, 10/11): khoá API đang dùng để phát hành **còn hiệu lực nhưng THIẾU quyền Realtime** (HTTP 403, mã 10000) ⇒ chưa biết tài khoản đã có ứng dụng SFU hay chưa. Việc thầy cần làm: mục 8, điểm 1.

## 1. Mục tiêu sư phạm + ai dùng

- **Thầy (màn chiếu):** đang chiếu đề thì bấm MỘT nút «Live». Thầy viết bút Wacom lên bảng đen, nói vào mic. Không thao tác gì thêm.
- **Học sinh (máy em):** màn tự chuyển sang bảng live phủ kín, tự xoay ngang. Nét phấn chạy theo tay thầy, tiếng thầy đến ngay. Em thấy cả con trỏ bút lúc thầy chưa chạm bảng. Cảm giác cần đạt: như ngồi bàn đầu, thầy nói với riêng mình.
- **Hai chiều:** em giơ tay, thầy mời, em nói, cả lớp nghe.
- **Kỷ luật:** trong lúc live, máy em bắt rời màn y như Bình Phản Ứng. Tên em rời hiện ngay trên màn chiếu.
- **Phụ huynh:** không đổi gì.

Mục tiêu ĐO ĐƯỢC (kiến trúc chọn theo các số này):

| Chỉ số | Đạt | Không đạt |
|---|---|---|
| Trễ tiếng đầu-cuối, trung vị | ≤ 200 ms Wi-Fi · ≤ 250 ms 4G tốt | > 300 ms, hoặc p95 > 450 ms |
| Trễ nét đầu-cuối, trung vị | ≤ 120 ms Wi-Fi · ≤ 150 ms 4G tốt | > 200 ms, hoặc p95 > 300 ms |
| Nét chạy liên tục | mỗi khung hình đầu nét đều tiến; khoảng đứng dài nhất khi thầy đang viết ≤ 50 ms (p95) | đứng > 100 ms |
| Lệch tiếng–nét | nét sớm hơn tiếng ≤ 80 ms, không bao giờ muộn hơn tiếng quá 40 ms | ngoài khoảng đó |
| Bấm Live → máy em có hình + tiếng | ≤ 1,0 s (p90, máy đã nối sẵn) | > 2 s |
| Khung hình máy em lúc thầy viết, CPU ×4 | p95 khoảng khung ≤ 20 ms | > 33 ms |
| Hai chiều, mỗi chiều | ≤ 250 ms trung vị | > 350 ms |

## 2. Bố cục

### 2.1 Màn chiếu của thầy (ảnh 01–12)

- **Nút «Live»** nằm trên thanh dưới của tờ chiếu, bên phải, ngay trước «Cài đặt» (ảnh 01–03). Chưa live: viền mờ + chấm đỏ + chữ «Live». Phím tắt đề xuất `V` (kiểm trùng phím lúc build; `L` đã là «Lên bảng»).
- **Lần đầu / đổi mic** (ảnh 04): thẻ nổi neo trên nút gồm ô chọn mic, vạch mức âm khi thầy nói thử, dòng «Lọc tiếng ồn + khử vọng: Đang bật», nút «Bắt đầu live». Các lần sau bấm «Live» là live ngay với mic đã nhớ.
- **Đang live** (ảnh 05–07): nút thành MỘT viên đỏ ba ngăn: `● LIVE 12:34` · `142/150 em xem` · mic + vạch mức âm chạy theo giọng. Bấm vào viên đỏ mở lại thẻ mic. Bên cạnh là «Tắt live». Để đủ chỗ, khi live hai nút `T`, `Tab` chỉ còn phím, nút `?` ẩn (phím vẫn chạy).
- **Em rời màn** (ảnh 08, 09): đề xuất DẠNG GỌN để không che bảng đang giảng.
  - Viền đỏ mảnh quanh màn, đứng yên; chỉ nháy 2 nhịp khi có em MỚI rời.
  - Một thẻ nhỏ ở góc phải, ngay trên thanh: «3 em rời màn» + ba ô tên viết tắt màu đội (ảnh 08).
  - Có em mới rời, hoặc thầy bấm thẻ: thẻ mở ra tên + đội + kiểu rời + đã bao lâu, tối đa 3 em và «+N em nữa» (ảnh 09). Tự thu gọn sau 4 giây.
  - Em quay lại (tin `ve` có xác nhận, `viewEm.em.dangRoi` đã có trên main) thì tên tự mất; hết em rời thì viền tắt.
- **Giơ tay** (ảnh 10–12): thẻ gọn «2 em giơ tay» cùng chỗ. Mở ra là hàng chờ theo thứ tự giơ, mỗi em một nút «Mời nói»; dưới cùng «Hạ hết tay». Em đang nói: dòng đầu có sóng âm + «Thu mic»; dưới cùng «Tắt mic tất cả».
- Em lên bảng, chấm Đạt, mở đáp án, Giải, Thống kê: KHÔNG đổi, vẫn chạy khi live (live chỉ thêm một lớp phát, không đụng luật lượt).

### 2.2 Máy em (ảnh 13–40)

Máy em soi đúng màn chiếu: giấy đề bên trái, bảng đen bên phải, cùng kiểu giấy thầy đang chọn (sáng / tối theo THẦY, không theo máy em). Hệ toạ độ lôgic 1600 × 820, co vừa màn, nét vectơ nên sắc ở mọi cỡ.

- **Mặc định ẩn hết** (ảnh 13–18): bảng phủ kín màn ngang, KHÔNG thanh cố định nào. Chỉ còn một **tay nắm**: viên thuốc mảnh màu đội (7 × 46, vùng chạm 48 × 76), mép phải, giữa chiều cao, đồng điệu nút «Gửi» nổi `.bpu-gui-noi`.
  - Điện thoại dài (19,5:9): vùng chiếu dính trái, dải dư bên phải là chỗ của tay nắm ⇒ không che nét.
  - Điện thoại 16:9 và máy bảng: tay nắm đè mép bảng ⇒ mờ 78 %, em kéo được lên / xuống dọc mép; tự né nếu nét mới chạy tới vùng nó đang đứng.
  - Tay nắm mang trạng thái: quầng sáng nhịp theo «thầy đang nói»; có huy hiệu bàn tay khi em đang giơ tay mà khay đóng (ảnh 29).
- **Khay điều khiển** (ảnh 19–24): chạm hoặc vuốt tay nắm thì khay trượt ra từ mép phải; chạm ngoài hoặc 3 giây không chạm thì thu lại. Kính mờ tối, bo 26, mọi nút ≥ 48 px. Từ trên xuống:
  1. «Thầy đang nói» (sóng âm màu đội theo mức âm thật) + 3 vạch chất lượng mạng.
  2. Nút chính màu đội: «Giơ tay» → «Đang giơ tay · Em thứ 2 trong hàng · chạm để hạ tay» (ảnh 28).
  3. «Tiếng: Đang bật / Đang tắt» (ảnh 27).
  4. Đội + kJ gọn: «Đội Natri · 245 kJ».
  - KHÔNG có nút thoát. Em chỉ rời khi thầy tắt live.
  - Đủ bốn màu đội: Natri `--p-cam`, Kali `--p-tim-2`, Đồng `--p-xanh`, Canxi `--p-do` (ảnh 19–22), lấy từ `DOI_BPU` qua biến `--doi` máy em đang dùng. Chữ trên nền màu đội dùng `--p-muc`. Không thêm màu mới.
- **Được mời nói** (ảnh 30): tấm giữa màn «Thầy mời em nói» + «Bật mic và nói» (màu đội) + «Để sau».
- **Đang nói** (ảnh 31): viên màu đội LUÔN HIỆN (mic đang mở thì không được tự ẩn): sóng âm, «Em đang nói · Thầy và cả lớp đang nghe», nút «Xong, tắt mic».
- **Bạn đang nói** (ảnh 32): dải nhỏ đáy màn «Bạn Minh Anh đang nói».
- **Vào live** (ảnh 25): màn đang ở đâu cũng mờ nhẹ, viên đỏ «Thầy đang live» hiện 0,6 giây, bảng nở ra từ giữa rồi xoay ngang.
- **Tiếng bị chặn** (ảnh 26): một nút màu đội «Chạm để bật tiếng thầy». Hình vẫn chạy.
- **Mất mạng** (ảnh 33, 34): bảng đứng tại nét cuối, tối đi; dải trên «Mất kết nối · đang nối lại… · Bảng dừng ở lúc 20:14:07 · nối lại sẽ tự bắt kịp».
- **Phóng bảng** (ảnh 35): chạm hai lần vào bảng đen thì bảng phủ kín màn; chạm hai lần nữa về toàn cảnh.
- **iPhone máy dọc** (ảnh 36–38): hình xoay 90° bằng CSS. Tai thỏ thành mép trái hình, thanh home thành mép phải hình; tay nắm và khay vẫn ở mép phải HÌNH. Vuốt đổi trục theo hướng hình.
- **iPhone ngang có tai thỏ** (ảnh 39, 40): chừa `env(safe-area-inset-*)` hai mép và đáy.

Chuyển động (theo skill apple-design):
- Chỉ `transform` / `opacity`.
- Khay bám ngón tay 1:1 khi vuốt (`setPointerCapture`), thả tay thì lò xo nhận vận tốc lúc thả; ngắt giữa chừng được, kéo quá thì đàn hồi.
- Lò xo: giảm chấn 0,8 · đáp 0,3 s khi có vuốt; mở bằng chạm thì giảm chấn 1,0 (không nảy).
- Phản hồi ngay lúc chạm xuống (`:active` co 0,97).
- Máy yếu (`ddh.mayYeu`) / `prefers-reduced-motion`: hiện / ẩn tức thì. `prefers-reduced-transparency`: kính thành nền đặc.

### 2.3 Chữ mới đề nghị thêm vào bảng từ chuẩn A2

| Khái niệm | Từ chuẩn | Không dùng |
|---|---|---|
| Chế độ phát bảng + tiếng tới máy em | **Live** («Live», «Tắt live», «Thầy đang live», «142/150 em xem») | stream, phát sóng, trực tuyến |
| Em xin nói | **Giơ tay** · «Đang giơ tay» · «Hạ tay» · thầy: «Mời nói», «Hạ hết tay» | raise hand, xin phát biểu |
| Thầy lấy lại quyền nói | **Thu mic** · «Tắt mic tất cả» | mute, kick |
| Âm thanh trên máy em | **Tiếng** («Tiếng: Đang bật / Đang tắt», «Chạm để bật tiếng thầy») | âm lượng, audio, loa |
| Rời màn (đã có) | **rời màn** («3 em rời màn») — giữ nguyên chữ của Bình Phản Ứng | thoát, vi phạm |

## 3. Trạng thái

| Nơi | Trạng thái | Hiện gì |
|---|---|---|
| Thầy | Chưa live | nút «Live» (ảnh 01) |
| Thầy | Lần đầu / chưa cho mic | thẻ chọn mic; trình duyệt hỏi quyền một lần (ảnh 04) |
| Thầy | Mic bị từ chối / không có mic | thẻ ghi «Chưa dùng được mic: …» + «Live không tiếng» (vẫn phát bảng) + «Thử lại» |
| Thầy | Đang nối (≤ 1 s) | viên «Đang bật live…» |
| Thầy | Đang live | viên đỏ ba ngăn (ảnh 05) |
| Thầy | Mic im > 20 s khi đang live | ngăn mic nháy vàng «Mic đang im» |
| Thầy | Mạng thầy rớt | viên chuyển vàng «Đang nối lại…», bảng thầy vẫn viết được; nối lại tự gửi bù nét |
| Thầy | Có em rời / giơ tay / đang nói | thẻ gọn góc phải (ảnh 08–12) |
| Em | Chưa live | màn Bình Phản Ứng như cũ (đã nối sẵn ngầm) |
| Em | Đang vào | «Thầy đang live» (ảnh 25) |
| Em | Đang xem | ẩn hết / khay mở (ảnh 13–24) |
| Em | Tiếng bị chặn | «Chạm để bật tiếng thầy» (ảnh 26) |
| Em | Giơ tay / được mời / đang nói | ảnh 28–31 |
| Em | Mất mạng | ảnh 33, 34 |
| Em | Mạng chặn tiếng trực tiếp (UDP + TURN đều hỏng) | chế độ nhẹ: nét hiện theo từng nét đã xong, dải «Mạng này chặn tiếng trực tiếp» |
| Em | Thầy tắt live | bảng thu lại, bỏ khoá ngang, về màn Bình Phản Ứng |
| Em | Buổi chưa mở / em không thuộc lớp | như hiện tại, không có live |

## 4. Dữ liệu và kiến trúc

### 4.1 Sơ đồ

```
 MÁY THẦY (tờ chiếu + bút Wacom)          CLOUDFLARE                          MÁY EM (100–300)
┌───────────────────────────┐  WebRTC/UDP ┌───────────────┐  WebRTC/UDP ┌──────────────────────────┐
│ mic ─▶ Opus 24 kb/s mono  │──«thay»────▶│ Realtime SFU  │──«thay»────▶│ <audio> đã mở khoá từ    │
│ trộn tiếng em được mời    │──«khach»───▶│ (anycast, PoP │──«khach»───▶│ lần chạm đầu             │
│ bút ─▶ lô điểm mỗi 16 ms  │──«net»─────▶│ Hà Nội / HCM /│──«net»─────▶│ đệm phát 30–150 ms ─▶    │
│  (DataChannel không tin   │  không tin  │ Đà Nẵng)      │             │ nội suy theo mốc thời    │
│   cậy, không thứ tự)      │  cậy        └───────▲───────┘             │ gian ─▶ canvas «đang viết»│
│                           │                     │ mic em được mời     │                          │
│ nét đã xong / xoá / trang │  WebSocket  ┌───────┴───────┐  WebSocket  │ canvas «đã chốt» + sửa   │
│ lệnh live, mời, thu mic   │────────────▶│ DO Phòng BPU  │────────────▶│ nét theo bản chốt; vào   │
│                           │◀──viewBang──│ (đang có)     │◀─roi/ve/tay─│ muộn / nối lại: phát lại │
└───────────────────────────┘             └───────┬───────┘             │ sổ nét từ số thứ tự cuối │
                                                  │ HTTPS, App Secret   └──────────────────────────┘
                                   Worker `/bpu/live/*` ⇄ rtc.live.cloudflare.com/v1
```

Ba đường, mỗi đường một việc:
1. **SFU, tiếng:** hai track của thầy. «thay» = mic thầy. «khach» = tiếng các em đang được mời, do máy thầy trộn lại. 300 máy em đăng ký hai track này MỘT LẦN lúc vào phòng; ai nói ai thôi không làm 300 máy phải đàm phán lại.
2. **SFU, DataChannel «net»** (`ordered: false`, `maxRetransmits: 0`): điểm đang viết + con trỏ bút. Mất gói thì bỏ, gói sau mang lặp lô trước.
3. **Phòng (DO), WebSocket đang có:** mọi thứ phải ĐÚNG và ĐỦ: bật/tắt live, nét đã xong, xoá, đổi trang, giơ tay, mời, thu mic, rời màn. Phòng giữ sổ nét để em vào muộn / nối lại bắt kịp.

### 4.2 Vì sao chọn vậy (số liệu ở mục 6 và phụ lục A)

**HÌNH: vectơ, không quay màn hình.**

| | (1) Vectơ (chọn) | (2) Quay màn hình thành video qua SFU |
|---|---|---|
| Độ nét | sắc mọi cỡ, phóng bảng vẫn nét | mờ khi 4G yếu, chữ nhỏ nhoè |
| Băng thông mỗi em, 90 phút | ≈ 16 MB nét (+ 32 MB tiếng) | ≈ 810 MB ở 1,2 Mb/s |
| Trễ | 65–200 ms | 200–500 ms (mã hoá video + đệm) |
| Máy thầy | gần như không tốn | mã hoá video liên tục, tốn CPU lúc đang viết |
| Mỗi lần bật | không hỏi gì | trình duyệt hỏi chọn cửa sổ mỗi lần |
| Chi phí 26 buổi × 300 em | 0 USD | ≈ 266 USD/tháng |
| Điểm yếu | máy em phải dựng lại đúng bố cục đề (rủi ro R3) | không |

**Kênh mang nét: DataChannel qua SFU cho điểm đang viết, không phải WebSocket qua DO.**
- WebSocket chạy trên TCP: một gói rớt trên 4G là cả dòng đứng chờ gửi lại (0,2–2 s), nét giật từng khúc. DataChannel không tin cậy bỏ gói cũ, nét không đứng.
- Tải DO: 60 lô/giây × 300 em = 18.000 lệnh gửi/giây trên MỘT DO một luồng, chung với luật phòng. Tài liệu Durable Objects cảnh báo đúng việc này: «Sending many small messages can overwhelm a single Durable Object. This happens even if the total data volume is small.» SFU sinh ra để nhân bản gói.
- Đường đi: DO nằm ở một vùng cố định (có thể ngoài Việt Nam), mọi gói phải ghé đó. SFU anycast nhận ở PoP gần nhất.
- Phần cần đúng và đủ vẫn đi DO: nét đã xong gom 250 ms một lần ⇒ tối đa 4 khung/giây × 300 = 1.200 lệnh gửi/giây, an toàn.
- Dự phòng: máy em không mở được DataChannel thì tự rơi về «chế độ nhẹ» chỉ dùng WebSocket (nét hiện theo từng nét đã xong).

**TIẾNG: WebRTC qua Cloudflare Realtime SFU.**

| Cách | Trễ thực tế | iPhone iOS 14–15 | Tự phát | Giá cho 26 buổi × 300 em × 90 phút | Giới hạn người nghe | Độ phức tạp |
|---|---|---|---|---|---|---|
| **WebRTC Opus qua Cloudflare Realtime SFU (chọn)** | 115–320 ms | có (WebRTC từ Safari 11) | cần một lần chạm; máy em đã có | 0 USD (trong 1.000 GB miễn phí) | tài liệu không nêu trần số người đăng ký một track; phải thử tải 300 (R1) | vừa: tự viết tín hiệu qua Worker + DO đang có |
| LiveKit Cloud | tương đương; máy chủ gần nhất nhiều khả năng ngoài Việt Nam (chưa xác minh) | có | như trên | ≈ 326 USD/tháng (gói Ship 50 USD + 552.000 phút × 0,0005) | theo gói | thấp hơn (có SDK phòng), nhưng thêm nhà cung cấp, thêm ~100 KB SDK |
| P2P thẳng thầy ↔ từng em | thấp nhất khi cùng mạng LAN (bớt 10–40 ms) | có | như trên | 0 USD | thực tế ≤ 10–20 em: máy thầy phải mã hoá + tải lên N luồng (300 em ≈ 14 Mb/s tải lên, 300 kết nối) | cao; em dùng 4G vẫn phải qua máy chuyển tiếp |
| Lai: P2P khi ít, SFU khi đông | — | — | — | — | — | hai đường mã, hai kiểu lỗi; được lợi ≤ 40 ms |
| Tự chuyển Opus qua WebSocket + WebCodecs | 150–400 ms, đứng hình khi rớt gói | **không**: `AudioDecoder` chỉ có từ Safari 26 | — | 0 USD | DO: 50 gói/giây × 300 = 15.000 lệnh gửi/giây | cao, phải kèm bộ giải mã WASM |
| MediaRecorder + MSE / ManagedMediaSource | 0,5–3 s (đệm theo khúc) | **không**: iPhone không có MSE; ManagedMediaSource từ iOS 17.1 | — | — | — | LOẠI theo mục tiêu trễ |
| HLS | 3–30 s | có | — | — | — | LOẠI |

Kết luận đường tiếng:
- **100–300 em:** SFU. **Nhóm nhỏ:** cũng SFU, cùng một đường mã.
- SFU thêm bao nhiêu trễ so với P2P: bằng quãng vòng qua PoP, ước 10–40 ms khi thầy và em cùng thành phố. Cloudflare có điểm hiện diện ở Hà Nội, TP.HCM, Đà Nẵng và công bố Realtime chạy trên mọi điểm. Nhà mạng Việt Nam đôi khi đẩy sang Singapore / Hồng Kông ⇒ Đợt 0 đo `currentRoundTripTime` tới SFU trên Viettel / VNPT / FPT / Mobifone. Nếu RTT > 60 ms mới cân nhắc lại P2P cho nhóm nhỏ hoặc máy chủ đặt tại Việt Nam.
- Mốc tham chiếu «như nói trực tiếp»: ITU-T G.114 coi trễ một chiều ≤ 150 ms là trong suốt, tới 400 ms còn chấp nhận được.

Cấu hình Opus + mic thầy:
- `getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } })`, `track.contentHint = 'speech'`.
- Mono, 48 kHz, trần 24 kb/s qua `sender.setParameters({ encodings: [{ maxBitrate: 24000 }] })`.
- FEC trong băng `useinbandfec=1` (mặc định theo RFC 7587). DTX `usedtx=1` để lúc thầy im gần như không tốn băng thông.
- Khung 20 ms (mặc định). Đợt 0 đo thử 10 ms: bớt ~10 ms trễ, đổi lại gấp đôi số gói.
- Máy em: đệm jitter để tự thích ứng ở mức thấp nhất; `receiver.jitterBufferTarget = 0` nơi có (Chrome ≥ 124).
- Phát qua thẻ `<audio>`, không qua Web Audio (trên iPhone, Web Audio bị nút gạt im lặng tắt tiếng; cần kiểm lại trên máy thật).

### 4.3 Hợp đồng tin nhắn phòng — CHỈ THÊM

Mọi trường cũ giữ nguyên. Máy em / bảng bản cũ gặp trường lạ thì bỏ qua.

**Trạng thái phòng** (`TrangThaiPhong`, thêm trường tuỳ chọn):
```ts
live?: {
  san: boolean          // thầy đã phát sẵn track câm ⇒ máy em nối ngầm
  bat: boolean          // đang live
  tu: number | null     // giờ bật (ms)
  phien: number         // tăng mỗi lần bật — chống gói lạc phiên cũ
  ss: { id: string; kenh: number } | null  // phiên SFU của thầy + mã DataChannel «net» (không phải bí mật)
  tay: { sbd: string; luc: number }[]      // hàng giơ tay, theo thứ tự
  noi: string[]                            // em đang được nói (mặc định tối đa 1, cấu hình 1–3)
  xa: boolean                              // cho em ở xa vào xem (điểm quyết 4)
  tiengLop: boolean                        // máy em trong lớp có phát tiếng không (điểm quyết 3)
  soNet: number                            // số thứ tự mục cuối của sổ nét
}
```

**View thêm:**
- `viewBang.live`: `{ san, bat, tu, xem, tay: [{ sbd, luc }], noi: [sbd], xa, tiengLop }`. `xem` = số em đã báo `live-ok`, còn nối, không nằm trong `roiNay`.
- `viewEm.live`: `{ san, bat, tu, phien, ss, tieng: boolean, emTay: boolean, hangTay: number | null, emDuocMoi: boolean, emNoi: boolean, noi: [{ sbd, ten, doi }] }`.
- BẤT BIẾN AN TOÀN giữ nguyên: `viewEm` không mang `dung`, `giai` trước pha `mo`. `viewEm.live` không mang gì về đáp án. Thêm test khoá.

**Tin chữ (JSON, cùng kiểu `t` đang dùng):**

| Chiều | Tin | Nghĩa |
|---|---|---|
| thầy → phòng | `{t:'live-san', ss}` | thầy đã phát sẵn track câm + kênh nét |
| thầy → phòng | `{t:'live-bat'}` · `{t:'live-tat'}` | bật / tắt live |
| thầy → phòng | `{t:'live-moi', sbd}` | mời em nói (phòng kiểm số người nói) |
| thầy → phòng | `{t:'live-thu', sbd?}` | thu mic một em; không `sbd` = tất cả |
| thầy → phòng | `{t:'live-ha-tay'}` | hạ hết tay |
| thầy → phòng | `{t:'live-dat', xa?, tiengLop?}` | đổi công tắc buổi |
| em → phòng | `{t:'live-ok'}` | máy em đã có hình + tiếng (để đếm «em xem») |
| em → phòng | `{t:'live-tay', v}` | giơ / hạ tay |
| em → phòng | `{t:'live-noi', v}` | em đã bật mic / đã tắt mic (phòng chỉ nhận khi em nằm trong `noi`) |
| em → phòng | `{t:'live-do', …}` | số đo trễ gom 10 giây một lần (mục 7) |
| em → phòng | `{t:'chao', net: <số thứ tự cuối đã có>}` | `chao` đang có, thêm trường `net` ⇒ phòng gửi bù phần sổ nét còn thiếu |
| đã có, không đổi | `roi` · `ve` · `tra` · `goi` · `dat` · `mo` … | rời màn và luật lượt chạy như cũ khi live |

**Tin nhị phân (mới; hiện `webSocketMessage` bỏ qua mọi tin không phải chữ nên thêm nhánh không đụng đường cũ):** thầy → phòng → mọi máy em, mỗi khung ≤ 16 KB, gom 250 ms.

| Mã | Mục sổ nét | Trường |
|---|---|---|
| `0x11` | nét đã xong | `stt u32`, `idNet u16`, kiểu bút `u8` (màu phấn, độ dày), vùng `u8` (giấy / bảng), `n u16`, n điểm đã giản lược |
| `0x12` | xoá một nét | `stt`, `idNet` |
| `0x13` | xoá sạch bảng | `stt` |
| `0x14` | sang trang / đợt mới | `stt`, băm `qid` |

Phòng nối vào sổ (bộ nhớ + `storage`, gặp `0x13` / `0x14` thì dọn phần cũ), tăng `soNet`, chuyển nguyên khung cho máy em.

**DataChannel «net» (thầy → SFU → em), mỗi gói ≤ 1.100 byte:**
```
u8  loai     1 = điểm nét đang viết · 2 = con trỏ lơ lửng · 3 = nhấc bút
u16 phien
u32 tGui     ms kể từ lúc bật live, theo đồng hồ máy thầy
u16 idNet · u16 tu (chỉ số điểm đầu trong gói) · u8 n
[kiểu bút u8 + vùng u8 khi tu = 0]
n × { x, y: toạ độ lôgic ×8, điểm đầu tuyệt đối i16, sau đó chênh lệch; luc u8; dt u8 (ms) }
+ lặp nguyên lô liền trước (mất một gói không thủng nét)
```
- Nhịp gửi: mỗi khung hình máy thầy khi bút đang chạm (≈ 16 ms, gom `getCoalescedEvents()` để giữ đủ ~200 điểm/giây của Wacom). Con trỏ lơ lửng 20 lần/giây.
- Toạ độ theo hệ lôgic của VÙNG (giấy hoặc bảng), không theo điểm ảnh máy thầy.

**Hợp đồng với bộ máy bút (`claude/but-bang-1011`)** — tờ chiếu (khung trong) gửi lên app thầy qua `postMessage`, `nguon: 'to-chieu'`:
- `loai: 'net-diem'` `{ idNet, vung, kieu, diem: Int16Array }` mỗi khung khi đang viết;
- `loai: 'net-xong'` `{ idNet, vung, kieu, diem }` nét đã làm mượt;
- `loai: 'net-xoa'` `{ idNet }` · `loai: 'net-xoa-het'` · `loai: 'net-tro'` `{ x, y, vung }`;
- hàm hỏi `anhTrangThai()` trả toàn bộ nét đang có (dùng khi thầy bật live sau khi đã viết).

**Cửa HTTP mới ở Worker** (0 lệnh D1; kiểm vé HMAC `bpu|` đang có; App Secret chỉ nằm ở Worker):
- `POST /bpu/live/noi { ve }`: tạo phiên SFU cho máy gọi, đăng ký «thay», «khach», kênh «net», trả lời mời SDP.
- `POST /bpu/live/dap { ve, sdp }`: nộp câu trả lời SDP.
- `POST /bpu/live/phat { ve, sdp }`: máy thầy phát track; máy em CHỈ phát được khi phòng xác nhận em nằm trong `live.noi`.
- Bí mật Worker mới: `REALTIME_APP_ID`, `REALTIME_APP_SECRET` (và khoá TURN nếu bật dự phòng TCP 443).

### 4.3b Hợp đồng THỰC TẾ sau Đợt 1A (nhánh `claude/live-1a-1011`) — chỗ khác với 4.3 ở trên thì theo mục này

Mã: luật `src/lib/bpu/phong-live.ts` · phòng `server/src/phong-live.ts` · cửa SFU `server/src/live-sfu.ts` · máy khách `src/lib/live/` (cửa vào `index.ts`, có ví dụ nối).

- **Nét = nét của bộ máy bút** (`src/lib/but-bang-loi.ts`): `{ id, cong, mau, co, diem: [x, y, apLuc, t][] }`, mã hoá nhị phân KHÔNG MẤT (x, y × 100000; áp lực × 100; t ms). Máy thầy đưa mọi `SuKienBut` vào `taoLiveThay().nhanSuKienBut(sk)`; máy em nhận lại đúng `SuKienBut` qua `khiBut` ⇒ `taoLoiBut().apSuKien(ds, sk)`. Không còn `vung`, không còn `postMessage` riêng.
- **`live.ss`** = `{ id, tieng, kenh }`: `id` mã phiên SFU của thầy, `tieng` tên track (`'thay'`), `kenh` TÊN DataChannel (`'net'`) hoặc null. (4.3 ghi `kenh: number`; theo tài liệu SFU mỗi máy nhận tự được cấp mã kênh riêng nên chỉ cần tên.)
- **`viewBang.live`**: `{ san, bat, tu, phien, ss, xem, ws, tay, noi, xa, tiengLop, soNet, tieng: 'bat' | 'chua-cau-hinh' }` hoặc `null` (công tắc `cau_hinh.live_bang` tắt / phòng mở bằng bản cũ). `ws` = số em đang xem cần điểm qua WebSocket.
- **`viewEm.live`**: `{ duocXem, san, bat, tu, phien, ss, tieng: 'bat' | 'tat' | 'chua-cau-hinh', soNet, emTay, hangTay, emDuocMoi, emNoi, noi }` hoặc `null`. `tieng: 'tat'` = em trong lớp mặc định tắt tiếng (điểm quyết 3); `'chua-cau-hinh'` = Worker chưa có khoá SFU, live chỉ có hình.
- **Tin chữ đã có ở 1A:** thầy `live-san {ss, san?}` · `live-bat` · `live-tat` · `live-dat {xa?, tiengLop?}` · `live-nhip` (thầy còn đang nói / viết; im 15 phút phòng tự tắt). Em `live-ok {dc}` · `live-bu {net}` (xin bù sổ nét; `chao {net}` cũng được) · `live-do {d, j, m, rtt, tt, dc}`. Phòng trả: `live-so {lamLai, soNet, muc}` (trước các khung bù) · tới máy thầy `live-xem {xem, ws}` (gom 300 ms) · `live-do {…}` (gộp, 10 giây) · `live-can-anh` (sổ quá dài, xin ảnh trạng thái) · `live-kq {lenh:'bat', ok:false, lyDo}`. `live-moi` / `live-thu` / `live-ha-tay` / `live-tay` / `live-noi`: Đợt 2.
- **Khung nhị phân** (chỉ máy thầy gửi, ≤ 16 KB): sổ nét `0x11` nét xong (có `vt`, nét rất dài chia nhiều khung) · `0x12` xoá nét (nhiều mã) · `0x13` xoá hết · `0x14` bảng mới (khoá trang + tỉ lệ vùng viết) · `0x15` hoàn tác; byte 1..4 = số thứ tự do PHÒNG ghi. Điểm đang viết `0x21` điểm · `0x22` con trỏ · `0x23` nhấc bút: cùng một khung cho DataChannel «net» và đường dự phòng WebSocket (phòng chuyển nguyên văn tới máy em đã báo `live-ok {dc:false}`, ≤ 30 lô/giây, không lưu).
- **Cửa HTTP** `POST /bpu/live/{noi,dap,kenh,phat,dong}` (thân luôn kèm `ve`): xem đầu tệp `server/src/live-sfu.ts`. Chưa có khoá ⇒ `{ ok:false, lyDo:'chua-cau-hinh' }`.

### 4.3c Thêm ở nhánh `claude/live-1c-1011` — bảng live theo lượt + mic của em lên bảng (thầy 10/11)

Thầy: «Khi bấm nút live, khi chuyển câu thì vẫn giữ live tiếng với hs, màn hình hs hiện câu hỏi như bình thường, khi bấm gọi lên bảng thu về màn chiếu thì lập tức màn hình hs chuyển sang chế độ live để xem thầy và bạn được gọi lên bảng chữa bài, tự động bật mic cho bạn lên bảng».

- **`live.bang`** (thêm vào `viewBang.live` và `viewEm.live`): máy em có HIỆN BẢNG LIVE không. Tiếng giữ suốt khi `bat`.
  - Tự BẬT: thầy gọi em lên bảng (tin `goi` / `lam-bang` đang có) lúc đang live; bật live khi đang có em được gọi.
  - Tự TẮT: mở lượt mới / bỏ lượt (`/luot`) — máy em về màn câu hỏi, live KHÔNG tắt, `phien` và phiên SFU KHÔNG đổi (không rớt tiếng); tắt live.
  - GIỮ: chấm Đạt / Chưa đạt, mở đáp án (thầy còn chữa tiếp trên bảng tới lượt mới).
  - Tay: thầy `live-dat { bang: true | false }` (chỉ khi đang live).
  - `bang` false ⇒ máy thầy không phát điểm đang viết, máy em bỏ điểm đang viết; nét xong vẫn vào sổ nên bật bảng là đủ nét.
- **Mic của em được gọi lên bảng** (một em mỗi lúc):
  - `viewEm.live.emDuocMoi` = em được phép bật mic lúc này (đang live + SFU có khoá + đúng em trong `luot.goi` + thầy chưa chấm + lượt chưa mở đáp án + em không đang rời màn). `emNoi` = phòng đã ghi nhận track mic của em.
  - Máy em gọi `POST /bpu/live/phat { ve, phien, sdp, tracks:[{mid}] }` trên phiên SFU của chính nó. Worker HỎI PHÒNG (`/live-mic` nội bộ, 0 D1) trước khi gọi SFU; tên track do máy chủ đặt (`mic`); SFU nhận xong Worker báo phòng ghi `live.mic` rồi phòng phát view. Em khác ⇒ `chua-duoc-moi`.
  - `live.noi` (cả hai view) = mảng TỐI ĐA MỘT phần tử `{ sbd, ten, doi, xa, ss: { id, tieng } }` — `ss` để các máy kéo track về nghe bằng lệnh mới `POST /bpu/live/nhan { ve, phien, nguon, ten:[…] }` (+ `dap`).
  - Tự THU mic: chấm Đạt / Chưa đạt, mở đáp án, lượt mới / bỏ lượt, gọi em khác, tắt live, hết buổi, em rời màn, em mất kết nối, thầy `live-thu-mic`, em tự tắt `live-mic-tat`. Phòng đóng track ở SFU (`tracks/close` force) nên thu mic có hiệu lực cả khi máy em không nghe lệnh.
  - Ai nghe: máy em nào đang BẬT tiếng thì tự kéo track của bạn (rải 0–0,8 giây); em trong lớp mặc định tắt tiếng nên không kéo (điểm quyết 3). Máy thầy mặc định CHỈ phát ra loa khi em ở xa (`noi[0].xa`), vì em đứng trong lớp mà loa lớp phát lại giọng em qua mic máy em thì hú; thầy đổi bằng `datNgheEm`.
  - Chống vọng: máy em không bao giờ kéo track của chính mình; khi mic em mở, tiếng thầy trên máy em hạ còn 25 % (loa máy kề mic; khử vọng của trình duyệt lọc phần lớn, hạ âm lượng bớt phần lọt và bớt hú; iPhone không cho trang đổi âm lượng nên ở đó chỉ còn khử vọng).
- **Thư viện:** `taoLiveEm` thêm `batMicLenBang()`, `tatMic()`, `mucAmMic()`, `dangChoQuyenMic()` (hộp hỏi quyền mic đang hiện ⇒ bộ rời màn đừng báo), tuỳ chọn `tuBatMic`; trạng thái thêm `bang`, `duocMoMic`, `mic` (`tat` · `xin-quyen` · `dang-noi` · `dang-phat` · `tu-choi` · `loi`), `banNoi`. `taoLiveThay` thêm `dat({ bang })`, `thuMic()`, `datNgheEm()`, `mucAmEm()`; trạng thái thêm `bang`, `emNoi`, `ngheEm`.

### 4.3d Giao diện đợt 1B (nhánh `claude/live-1b-1011`) — chỗ nối thực tế

- **Máy thầy.** Mặt live nằm trên TỜ CHIẾU (`src/lib/live-to-chieu.ts`, chèn vào `len-bang-moi-to-chieu.ts`): nút «Live» (phím `V`), thẻ chọn mic, viên đỏ `LIVE mm:ss · N/M em xem · mic`, công tắc «Bảng → máy em», «Tắt live», thẻ gọn «N em rời màn» + viền mảnh, thẻ «Đang nói» + «Thu mic» + «Phát tiếng em ra loa lớp». MÁY CHẠY ở cửa sổ app (`src/components/live/thay-noi.ts`): mic + WebRTC + phòng — vì tờ là khung dựng lại mỗi lần chọn câu, khung `srcdoc` không chắc có quyền mic, WebSocket của phòng vốn ở app (`src/components/bpu/cau-live.ts` là chỗ bảng Bình Phản Ứng trao kết nối). Tờ ⇄ app: `postMessage` `{ nguon:'to-chieu', loai:'live', viec }` / `{ nguon:'bpu-bang', lenh:'live-tt' | 'live-muc' }`.
- **Ô giấy / ô bảng đi trong KHOÁ TRANG** của sổ nét (`0x14`): `<khoá>~gx0,gy0,gx1,gy1,bx0,by0,bx1,by1~<s|t>` (phần nghìn của cửa sổ tờ; `t` = giấy tối), ≤ 60 ký tự, phòng không đọc. Máy em tách ra (`src/components/live/bo-cuc.ts`) để dựng «cửa sổ thầy ảo» cùng tỉ lệ rồi cắt lấy giấy + bảng; khoá trơn ⇒ ô mặc định của tờ 16:9.
- **Máy em.** `ManBinhPhanUng` nạp lười `src/components/live/LopLive.tsx` khi `live.san` / `live.bat`: `live.bat` mà chưa `live.bang` ⇒ màn câu hỏi như thường + dấu «Thầy đang live» (nút tiếng); `live.bang` ⇒ bảng live toàn màn xoay ngang (Android `orientation.lock` sau toàn màn hình; không khoá được ⇒ xoay CSS), tay nắm màu đội + khay, không nút thoát. Đề trên giấy = khối đề dùng chung của chặng (`DeCau` + phương án, chỉ xem) theo nền sáng / tối CỦA MÁY EM (chưa theo giấy của thầy). Lớp «đang viết» là canvas nhỏ đi theo đầu bút; màn Bình Phản Ứng bên dưới thôi vẽ khi bảng phủ kín.
- **Rời màn.** «Khoá xoay» 600 ms (`tat-man.ts`: `khoaXoay` / `conKhoaXoay`) sau `lock` / `unlock` / `orientationchange` / đổi toàn màn hình; hộp hỏi quyền mic ⇒ `datKiemQuyenNgoai(le.dangChoQuyenMic)`. Bảng tình huống: `tests/live-xoay-chia-doi-1011.test.ts`.
- **Bộ thử hai trang** (Chromium thật, phòng thật trong Node, dữ liệu giả): `scripts/thu-live-1011/` — ảnh `docs/ban-ve-live-1011/that-*.jpg`, số đo `so-do-that.json`.

### 4.3e Sửa khẩn 11/11 sau khi thầy test máy thật (nhánh `claude/live-2-1111`) — chỗ khác với các mục trên thì theo mục này

Thầy (11/11, 06:33): «khi bấm nộp thì không tự về màn live» · «bấm lên bảng là phải ép hết mọi hs vào live không chờ nộp xong» · «thêm nút tạm dừng live và kết thúc live ở trong nút live luôn» · «thanh ẩn và ô tắt mở tiếng ẩn hết vào thanh và chuyển thanh đó sang mép bên trái, cửa sổ của nút live cũng vậy» · «các nút bấm ở thanh dưới thu gọn vào một biểu tượng».

- **Luật màn máy em lúc live** (`src/components/bpu/luat-man-live.tsx` `cheLiveCua`) — THAY điểm quyết 5 và dòng «bật live ⇒ chỉ có tiếng» của 4.3c:
  - màn câu hỏi chỉ hiện lúc em ĐANG LÀM (lượt đang mở, em chưa gửi, chưa hết giờ); em bấm gửi (đổi ngay trên máy, không chờ phòng, không chờ tia lửa gửi) / hết giờ / thầy mở đáp án / chưa có lượt ⇒ BẢNG LIVE;
  - cờ phòng `live.bang` (tự bật khi gọi em lên bảng; thầy bật tay bằng «Bảng → máy em») nay nghĩa là ÉP cả lớp vào bảng live kể cả em chưa gửi. Lượt khoá theo luật gọi lên bảng đang có (`nhanTra` ⇒ `da-khoa`), KHÔNG gửi hộ đáp án em chọn dở;
  - máy thầy phát điểm đang viết SUỐT lúc live (không còn theo cờ `bang`); máy em chỉ nhận khi lớp giao diện báo `datHienBang(true)`.
- **Tạm dừng**: thầy `live-dat { nghi: true | false }` (chỉ khi đang live) ⇒ `live.nghi` ở cả hai view. Tên trường KHÔNG phải `dung` (trùng khoá đáp án mà test an toàn soát). Dừng: máy thầy tắt tiếng mic tại nguồn (`track.enabled`), bỏ mọi sự kiện bút; phiên SFU / số phiên / `tu` giữ nguyên; phòng thu mic của em đang nói; chờ tự tắt 60 phút thay 15. Tiếp tục: bật tiếng + gửi lại ảnh trạng thái trang đang chiếu. Máy em: dải «Thầy tạm dừng live».
- **Màn chiếu**: nút Live / viên Live đứng ĐẦU thanh (mép trái), cửa sổ neo mép trái; cửa sổ lúc live có «Bảng → máy em», «Tạm dừng» ⇄ «Tiếp tục», «Kết thúc live», «Xong» (bỏ hai nút rời «Tắt live», «Bảng → máy em» trên thanh). Lúc live các nút phím + «Lên bảng» + «Cài đặt» gom sau MỘT nút lưới (`.mc-lv-gon`; bấm ⇒ xoè, 8 giây không chạm / bấm ra ngoài ⇒ thu; phím tắt giữ nguyên). Tờ → app thêm `tam-dung { v }`.
- **Máy em**: tay nắm + khay ở MÉP TRÁI (dải dư của điện thoại dài chuyển sang trái); ô «Tiếng» và «Mic của em» (em lên bảng) nằm TRONG khay, tay nắm mang huy hiệu mic khi mic đang mở; màn câu hỏi chỉ còn tay nắm nhỏ mép trái (chấm đỏ = thầy đang live) — hết viên «Thầy đang live» nổi đáy màn, hết nút nổi «Bật mic lại». Vào bảng không còn viên «Thầy đang live» giữa màn trừ lúc thầy vừa bật live (≤ 1,5 giây).
- **Dải lượt trên bảng live** (`src/components/live/DaiLuot.tsx`, sửa lệch B3): đoán + tiếp sức khi thầy gọi bạn lên bảng (cùng lệnh `doan` / `tiep`), kết quả lên bảng + kết quả của em sau khi mở đáp án, «Đã gửi · n/m bạn đã gửi». Không in đáp án.
- **Giấy đề giống giấy thầy** (rủi ro R3, sửa lệch B1): tờ đo từng khối chữ của giấy (`lvDoGiay`: loại, thứ tự, x, y, rộng, cao, cỡ chữ, cao dòng, độ đậm, chỗ hết chữ — CHỈ SỐ, ≤ 24 khối) ⇒ `live-dat { giay }` ⇒ `viewEm.live.giay` ⇒ `src/components/live/GiayThay.tsx` đặt từng khối vào đúng ô trên tấm giấy cùng bề rộng lôgic rồi co vừa; chữ dựng bằng `ChemText` của màn làm bài; sáng / tối theo giấy thầy. Máy em tự đo lại (chiều cao + chỗ hết chữ từng khối): khớp ⇒ giữ nét trên giấy; lệch / giấy có ảnh, bảng, sơ đồ, mũi tên phản ứng (`la`) ⇒ cách dựng thường + cắt lớp nét khỏi ô giấy (`clip-path`) + số đo `live-do { gl: true }` (phòng gộp `giayLech`).
- **Kiểu rời màn** (sửa lệch B2): máy em gửi `roi { k }`, `k` = `thoat` (trang ẩn, máy phân biệt được khoá màn) · `an` (trang ẩn, máy không phân biệt được ⇒ «thoát app hoặc khoá màn») · `noi` (cửa sổ nổi) · `chia` (chia đôi); `viewBang.roiKieu`; thẻ ghi đúng chữ ấy, máy bản cũ không báo ⇒ «rời màn».
- **Đợt 2 (4.8)** — luật phòng + máy chủ + thư viện ĐÃ CÓ và có test, GIAO DIỆN CHƯA MỞ (cờ `GIAO_DIEN_DOT_2 = false` ở `phong-live.ts`; chờ thử tiếng trên máy thật). Khác 4.8: không trộn kênh «khach» — máy nào đang bật tiếng tự kéo track của em đang nói (như 4.3c); một em nói mỗi lúc. Tin: em `live-tay { v }` · `live-de-sau` · `live-mic-loi { ly }` · `live-mic-tat`; thầy `live-moi { sbd }` · `live-ha-tay { sbd? }` · `live-thu-mic { sbd? }` · `live-dat { xa }`. View thêm `moi`, `micLoi` (bảng) · `emMoi`, `xa` (em). Em lên bảng bị thầy thu mic không tự bật lại tới khi thầy gọi lại. Nhật ký (`tay`, `ha`, `ha-het`, `moi`, `de-sau`, `mic-loi`, `noi`, `thoi { tu, vi }`) ghi vào kho của Durable Object theo khoá `nk:<giờ>:<số>` (đọc: đường nội bộ `/live-nk`), 0 D1. Em ở xa: vé `x: 1` từ `/hs/bpu/cua-em` (chỉ khi cờ giao diện bật; em có mặt vẫn đúng một lệnh D1), phòng bỏ `vao` / `tra` / `doan` / `tiep` của vé này.
- **Bộ thử**: `scripts/thu-live-1011/thu-2.mjs` (34 phép kiểm, ảnh `that-2-*.jpg`, số đo `so-do-that-2.json`). `thu.mjs` (đợt 1B) còn kịch bản cũ «gửi xong vẫn ở màn câu hỏi» — chưa cập nhật.

### 4.4 Nét trên máy em chạy mượt như đang viết

- Hai lớp canvas: «đã chốt» (vẽ một lần, chỉ vẽ lại khi đổi cỡ / phóng) và «đang viết» (xoá + vẽ lại mỗi khung, chỉ chứa nét dở). Con trỏ bút là một phần tử DOM dời bằng `transform`.
- **Đệm phát theo mốc thời gian:** mỗi điểm có giờ theo đồng hồ thầy. Máy em ước độ lệch đồng hồ bằng giá trị nhỏ nhất của (giờ nhận − `tGui`), rồi phát tại «bây giờ − D».
- **D thích ứng:** D = p95 dao động giờ tới trong 2 giây gần nhất + một lô; kẹp 30–150 ms; mỗi khung đổi tối đa 2 ms; không bao giờ đi lùi.
- **Nội suy:** mỗi khung hình vẽ tới đúng vị trí giữa hai điểm kẹp mốc phát (đường cong qua trung điểm) ⇒ đầu nét tiến ở MỌI khung dù gói tới thưa 33–50 ms.
- Hết điểm mà nét chưa nhấc: giữ đầu nét, không đoán xa.
- Nét xong: bản chốt từ phòng thay bản đang viết (cùng `idNet`), chuyển xuống lớp «đã chốt».
- **Đồng bộ tiếng–nét:** hai kênh đi cùng đường mạng nên phần mạng tự triệt. Máy em đọc `getStats()` mỗi giây lấy trễ đệm tiếng, cộng ~45 ms thu + mã hoá và trễ loa, ra trễ tiếng ước lượng; đặt D nét = kẹp(trễ tiếng − 60, D theo jitter, 150). Nét đi trước tiếng ≤ 80 ms. Mốc tham chiếu: ITU-R BT.1359 (hình sớm hơn tiếng tới ~125 ms người xem chưa nhận ra).
- Máy yếu: vẽ 30 khung/giây, bỏ quầng con trỏ, D + 16 ms.

### 4.4b Sửa sau khi thầy thử máy thật 11/11 (nhánh `claude/but-dong-bo-1111`) — chỗ khác với 4.4 thì theo mục này

Thầy: «đang bị giật khựng ở máy hs, phải đồng bộ nét bút tức thì mượt mà cực mượt mà» · «thay nút vàng bằng một cái bút nhỏ» · «bảng đen khi live có cuộn vô hạn». Số đo trước / sau: `docs/do-but-dong-bo-1111.md`.

- **Mốc phát là một đồng hồ chạy**, không còn là «bây giờ − D» cứng: mỗi khung tiến `dt × nhịp`, nhịp 0,65–1,6 để bám đích «bây giờ − lệch − D». Nét đang viết hết điểm (lô về muộn, mất gói) ⇒ đồng hồ đứng ở điểm mới nhất; lô tới thì chạy nhanh hơn một chút cho tới khi bắt kịp. Không dồn cả lô vào một khung.
- **D** = số lớn hơn giữa (p95 dao động + khoảng cách lô p90) và p95 «độ cần» của từng lô (giờ tới − lệch − giờ của điểm mới đầu tiên trong lô), + 4 ms; vẫn kẹp 30–150 ms, đổi ≤ 2 ms mỗi khung.
- **Gói cuối của nét** máy thầy gửi DataChannel thêm một lần. Vẫn mất ⇒ bản chốt từ sổ nét VÁ điểm thiếu cho nét dở phát nốt (`DemPhat.va`), không xoá nét dở vẽ lại.
- **Máy thầy gửi điểm ngay sau khung vẽ** (trước: chờ thêm 16 ms), hai gói cách nhau ≥ 12 ms. Con trỏ lơ lửng báo mỗi khung (trước: 20 lần / giây).
- **Con trỏ = cây bút nhỏ**, vẽ trên lớp «đang viết» cùng lượt với đuôi nét (không còn là phần tử DOM dời mỗi khung — đo CPU ×4 / ×6 thấy mỗi lần dời làm trang tính lại kiểu). Thư viện trả MỘT vị trí `KhungLiveEm.but = { x, y, cham, mau, net }`: đang viết thì ngòi ở đúng đầu nét; nhấc bút thì trượt từ cuối nét tới chỗ lơ lửng kế tiếp (trước: con trỏ đứng ở chỗ lơ lửng cũ suốt nét rồi nhảy).
- **Đuôi nét dở vẽ đúng dáng nét xong** (đã thon cuối) ⇒ nét chốt không đổi hình.
- **Bảng đen cuộn — KHÔNG thêm loại khung nào, chỉ thêm quy ước:**
  - nét bắt đầu trong cột bảng đen mang mã bắt đầu bằng `b_`; toạ độ `y` của nó = y màn + độ cuộn của bảng, tính bằng số lần bề dọc cửa sổ thầy ⇒ `y` có thể > 1 (tối đa 160; `u24 × 100000` chứa tới 167). Khung `0x11` (nét xong) và `0x21` (điểm đang viết) giữ nguyên định dạng. Nét trên giấy đề mã như cũ, `y` trong 0..1.
  - gói con trỏ `0x22` có **`x > 1,5`** (máy thầy gửi `x = 2`) không phải con trỏ mà là ĐỘ CUỘN của bảng (`y`): máy em soi đúng độ cuộn đó (`KhungLiveEm.cuon`). Máy thầy gửi khi cuộn đổi và nhắc lại mỗi 0,5 giây lúc bút lơ lửng. Bản máy em cũ sẽ coi nó là con trỏ nằm ngoài màn (vô hại).
  - chưa nhận được độ cuộn (em vào muộn, xem lại buổi live chỉ có sổ nét) ⇒ lớp vẽ tự trôi theo bút: đầu nét / nét vừa tới ra ngoài tầm nhìn thì trôi cho nó về khoảng giữa bảng.
  - máy em: nét bảng đã chốt nằm trong một khung cắt đặt đúng ô bảng đen, canvas cao 2,2 lần ô bảng dời bằng `transform`; chỉ vẽ lại khi tầm nhìn sắp ra khỏi canvas.
  - máy thầy cuộn bằng: lăn chuột / hai ngón trên bảng đen, kéo vạch mảnh ở mép phải bảng (bút kéo được), viết sát đáy rồi ngừng 0,9 giây thì bảng tự trôi lên. Đang viết thì không cuộn. Độ cuộn nhớ theo đợt.

### 4.5 Vào live tức thì

1. Thầy mở tờ chiếu có phòng, công tắc «Sẵn sàng live» bật (tự bật nếu buổi trước của lớp đã dùng Live): app thầy nạp lười mảnh live, phát hai track CÂM (nguồn Web Audio, không đụng mic, đèn mic không sáng) + kênh «net», gửi `live-san`.
2. Máy em thấy `viewEm.live.san`: nạp lười mảnh live, nối SFU ngầm, rải ngẫu nhiên trong 20 giây để 300 máy không dồn một lúc. Sổ nét đã có cũng được tải ngầm.
3. Lần chạm đầu của em trong buổi (đã có: chạm để toàn màn hình): gọi `audio.play()` trên luồng câm ⇒ tiếng đã «đang phát», sau này có tiếng thật không cần chạm nữa.
4. Thầy bấm «Live»: `getUserMedia` (đã có quyền: 0,1–0,3 s) → `replaceTrack(mic)` → `live-bat`. Phòng phát `viewEm` tới 300 máy. Máy em bật lớp bảng + xoay ngang.
5. Em vào muộn / chưa nối sẵn: đi đủ các bước, 2–3 giây, hiện «Thầy đang live».

### 4.6 Máy em: toàn màn hình, xoay ngang, giữ sáng

| Việc | Android (Chrome, Samsung Internet) | iPhone |
|---|---|---|
| Toàn màn hình | có (`requestFullscreen`, đang dùng) | **không có** trên iPhone (chỉ iPad, từ 16.4). App cài ra màn hình chính thì vốn đã kín màn. |
| Tự xoay ngang | `screen.orientation.lock('landscape')` sau khi đã toàn màn hình (Chrome Android ≥ 38). Bị từ chối ⇒ xoay bằng CSS. | **không khoá được** (Safari chưa hỗ trợ `lock`). Máy đang dọc ⇒ xoay hình 90° bằng CSS. Em tự xoay máy ngang ⇒ bỏ xoay CSS. |
| Giữ màn sáng | `wakeLock` (đang có, `giu-sang.ts`) | `wakeLock` Safari ≥ 16.4 (app cài: ≥ 18.4); cũ hơn dùng video câm dự phòng đang có |
| Tiếng tự phát | cần một lần chạm trong buổi | như trên; cuộc gọi đến / Siri làm ngắt ⇒ hiện «Chạm để bật tiếng thầy» |
| Mic (hai chiều) | hỏi quyền lúc em bấm «Bật mic và nói» | như trên; iOS 14 ở app cài cần kiểm trên máy thật |
| Bắt khoá màn | có quyền IdleDetector ⇒ khoá màn không tính rời | không phân biệt được ⇒ khoá màn cũng tính rời (như hiện tại) |

### 4.7 Rời màn khi live — YÊU CẦU CỨNG

- Dùng nguyên bộ bắt của Bình Phản Ứng (`ManBinhPhanUng.tsx`, `tat-man.ts`): thoát app / chuyển app, cửa sổ nổi, chia đôi màn hình; iPhone khoá màn cũng tính; Android có quyền IdleDetector thì khoá màn không tính.
- Em rời ⇒ gửi `roi` ngay ⇒ thầy thấy tên trên màn chiếu đang live (mục 2.1). Em về ⇒ `ve` có xác nhận ⇒ tên tự tắt.
- Rời màn thì tiếng trên máy em NGỪNG (không nghe live trong lúc dùng app khác). Về lại nghe tiếp từ hiện tại, không phát bù.
- **Không báo nhầm chia đôi khi xoay.** `dangChiaDoi()` so khung trang với cỡ màn theo hướng MÁY (`screen.orientation.type`), không theo CSS:
  - iPhone máy dọc, hình xoay CSS: máy vẫn dọc, khung trang vẫn đầy ⇒ đúng là không chia đôi.
  - Android khoá ngang: hướng máy và khung trang cùng ngang ⇒ không chia đôi.
  - Khoảnh khắc đang xoay: sự kiện đổi cỡ và hướng màn có thể lệch nhau vài chục ms, trong khi ngưỡng báo là 200 ms (`NOI_MS`). Thêm «khoá xoay»: 600 ms sau khi gọi `lock()` / `unlock()`, sau `orientationchange`, sau vào / ra toàn màn hình thì chưa xét chia đôi; hết 600 ms xét lại.
  - Hộp hỏi quyền mic làm trang mất tiêu điểm ⇒ đang chờ `getUserMedia` thì không báo «cửa sổ nổi» (đã có tiền lệ với hộp hỏi IdleDetector).
  - Cách kiểm: test vitest bảng tình huống cho `dangChiaDoi` (mục 7) + thử tay trên 1 Android, 1 iPhone: xoay 20 lần, bật / tắt live 10 lần ⇒ 0 lần báo rời.
- Trừ kJ: điểm quyết 2.

### 4.8 Đàm thoại hai chiều (Đợt 2) — YÊU CẦU CỨNG

1. Em bấm «Giơ tay» ⇒ `live-tay`. Thầy thấy thẻ «N em giơ tay».
2. Thầy bấm «Mời nói» ⇒ phòng ghi `live.noi`. Máy em hiện «Thầy mời em nói».
3. Em bấm «Bật mic và nói» (lần chạm này là điều kiện để trình duyệt cho mở mic) ⇒ hỏi quyền mic lần đầu ⇒ phát track mic lên SFU qua `/bpu/live/phat` ⇒ `live-noi`.
   - Bị từ chối quyền: «Máy em chưa cho dùng mic. Em mở Cài đặt của trình duyệt để cho phép, hoặc phát biểu sau.» Tay tự hạ, thầy thấy «chưa bật được mic».
4. CHỈ máy thầy đăng ký track của em. Máy thầy phát ra loa lớp, đồng thời trộn vào track «khach» mà cả lớp đã nghe sẵn. Em đang nói tự tắt «khach» trên máy mình (không nghe lại giọng mình).
   - Thầy ↔ em: mỗi chiều một chặng SFU, mục tiêu ≤ 250 ms.
   - Cả lớp nghe em: thêm một chặng qua máy thầy, ước 300–400 ms. Chấp nhận vì các bạn chỉ nghe.
5. Em bấm «Xong, tắt mic», hoặc thầy «Thu mic» / «Tắt mic tất cả» ⇒ phòng gỡ khỏi `noi`, Worker đóng track của em ở SFU (thu mic có hiệu lực ngay cả khi máy em không nghe lệnh).
6. Số người nói cùng lúc: mặc định 1, cấu hình được tới 3 (các em đang nói đăng ký thẳng track của nhau).
7. Mic em: `echoCancellation`, `noiseSuppression`, `autoGainControl` đều bật.
8. Chống lạm dụng: em chỉ phát được khi phòng đã ghi tên; «Thu mic» tức thì; sổ ghi của phòng thêm dòng ai giơ tay, ai được mời, nói từ giờ nào tới giờ nào, ai bị thu mic. Không ghi âm.
9. HÚ / VỌNG khi nhiều máy trong CÙNG PHÒNG mở loa: điểm quyết 3.
10. Chế độ tự do cho nhóm nhỏ (không cần mời): để sau Đợt 2, khi đã có số đo.

### 4.9 Ai xem được

- Mặc định: em đã vào phòng buổi học (đã điểm danh, `vao: true`).
- Phương án cho em ở nhà: điểm quyết 4.

## 5. Ngoại lệ

| Tình huống | Xử lý |
|---|---|
| Lượt đang mở, em CHƯA gửi đáp án, thầy đang live | điểm quyết 5 (đề xuất: giữ màn làm bài, vẫn nghe tiếng, gửi xong tự sang bảng live) |
| Thầy viết lời giải lên bảng khi lượt chưa mở đáp án | nét là việc thầy chủ động mở ⇒ vẫn phát. Viên live hiện nhắc «Lượt đang mở · 37 em chưa gửi». Lời giải KHO chỉ xuống máy em khi pha `mo` như cũ. |
| Thầy bấm G (Giải) khi live | máy em chỉ hiện lời giải khi phòng đã ở pha `mo`; chưa `mo` thì vùng giấy máy em giữ đề |
| Thầy chuyển câu | sổ nét sang trang mới (`0x14`); máy em dựng đề mới từ `viewEm.luot.cau` |
| Thầy đã viết rồi mới bật live | app thầy lấy `anhTrangThai()` gửi vào sổ nét trước khi `live-bat` |
| Bấm «Live» lặp / hai máy thầy cùng mở | phòng chỉ nhận một `live-bat` khi chưa live; máy thầy thứ hai thấy «đang live ở máy khác» và chỉ điều khiển |
| Thầy tải lại trang giữa lúc live | sổ nét còn ở phòng; app thầy nối lại, phát lại track, live tiếp cùng `phien` + 1 |
| Thầy quên tắt live | hết buổi (`ket-thuc`) hoặc mic im + không nét 15 phút ⇒ tự tắt, ghi sổ |
| Em mất mạng giữa chừng | WebSocket nối lại như hiện có, `chao` kèm số thứ tự nét ⇒ nhận phần thiếu; WebRTC khởi động lại ICE, quá 5 giây thì tạo phiên mới |
| Em vào muộn | nhận cả sổ nét (một lần), vào thẳng hiện tại, không phát lại từ đầu |
| Đề dài, có ảnh, công thức | máy em dựng bằng CÙNG hàm dựng tờ chiếu, cùng bề rộng lôgic, cùng phông nhúng. Nét trên giấy neo theo vùng giấy (rủi ro R3). |
| Máy yếu | mục 4.4; khay hiện / ẩn tức thì |
| Mạng chặn UDP | thử TURN qua TCP 443; vẫn hỏng ⇒ chế độ nhẹ |
| Em đổi tab, khoá màn | tính rời màn (mục 4.7) |
| Số đột biến (500 em) | SFU chịu; phòng chỉ gửi nét đã xong 4 lần/giây ⇒ tải tăng tuyến tính, đo ở Đợt 0 |
| Em ở xa không có đội | khay ẩn dòng đội + kJ; tay nắm dùng màu trung tính `--mc-bang-chu` |

## 6. Chi phí máy chủ

- **D1: 0 lượt đọc, 0 lượt ghi trên đường live.** Vé là HMAC đang có. Nhật ký giơ tay / nói ghi vào sổ của phòng, đổ về D1 cùng lô ghi cuối buổi đang có. Không thêm vòng chờ D1 nối tiếp.
- **Đường mở app: 0 byte thêm.** Mọi mã live nằm trong mảnh nạp lười riêng (thầy: sau khi tờ chiếu có phòng; em: sau khi `viewEm.live.san`). Tờ chiếu chỉ thêm nút + móc xuất nét, đặt ở tệp mới để `html-may-chieu.ts` không to thêm (cổng `kiem:co-tep`).
- **Đáp án:** không có trường nào của live mang đáp án. Đề trên máy em dựng từ `cau` công khai.
- **Cloudflare Realtime** (0,05 USD/GB ra, 1.000 GB đầu mỗi tháng miễn phí, SFU và TURN dùng chung; dữ liệu đẩy LÊN Cloudflare không tính tiền):

| Khoản, cho một buổi 300 em × 90 phút | Cách tính | GB |
|---|---|---|
| Tiếng thầy | 24 kb/s Opus + ~23 kb/s phần đầu gói ở 50 gói/giây ≈ 48 kb/s × 5.400 s × 300 | 9,7 |
| Nét + con trỏ | ~54 kb/s lúc viết (35 % thời gian) + ~15 kb/s lúc rê bút (30 %) ≈ 23 kb/s trung bình × 300 | 4,7 |
| Tiếng em được mời (kênh «khach») | giả định có em nói 15 % thời gian | 1,5 |
| **Cộng** | | **≈ 16** |

| Lịch dạy GIẢ ĐỊNH | GB/tháng | Tiền Realtime |
|---|---|---|
| 26 buổi/tháng, mỗi buổi 300 em, live trọn 90 phút | 416 | 0 USD |
| 60 buổi/tháng (hai buổi mỗi tối) | 960 | 0 USD |
| 100 buổi/tháng | 1.600 | 30 USD |
| So sánh: quay màn hình thành video 1,2 Mb/s, 26 buổi | 6.318 | ≈ 266 USD |

- **Durable Object** (Workers Paid: 1 triệu yêu cầu + 400.000 GB-giây mỗi tháng đã gồm; tin WebSocket ĐẾN tính 20 tin = 1 yêu cầu; tin GỬI ĐI miễn phí):
  - Tin đến từ thầy: 4 khung nét/giây × 5.400 s ≈ 21.600 tin ⇒ ≈ 1.080 yêu cầu tính tiền mỗi buổi.
  - Thời gian thức: 5.400 s × 0,128 GB ≈ 691 GB-giây mỗi buổi; 26 buổi ≈ 18.000 GB-giây (4,5 % phần đã gồm).
  - Tải gửi đi cao nhất: 4 khung/giây × 300 em = 1.200 lệnh gửi/giây (so với 18.000 nếu đẩy cả điểm đang viết qua DO).
- **Worker:** mỗi em vào ≈ 3 lệnh gọi + ≈ 5 lệnh HTTPS sang SFU; 300 em ≈ 900 yêu cầu mỗi buổi, không đáng kể so với 10 triệu đã gồm.
- **Dung lượng 4G của em:** ≈ 50 MB cho 90 phút (video sẽ là ≈ 810 MB).

## 7. Nghiệm thu đo bằng máy

**Test vitest (tên dự kiến):**
- `tests/live-phong-1011.test.ts`: luật phòng thuần — bật / tắt, một `live-bat`, giơ / hạ tay, mời khi đã đủ người nói, thu mic, hết buổi tự tắt, phòng lưu bản cũ không có `live`.
- `tests/live-an-toan-dap-an-1011.test.ts`: `viewEm` có `live` vẫn không mang `dung` / `giai` trước pha `mo`; em không trong `noi` gọi `/bpu/live/phat` bị từ chối.
- `tests/live-net-ma-hoa-1011.test.ts`: mã hoá nhị phân khứ hồi; mất gói lẻ không thủng nét nhờ lô lặp; gói lạc `phien` bị bỏ; khung > 16 KB bị từ chối.
- `tests/live-dem-phat-1011.test.ts`: đệm phát với chuỗi giờ tới giả (đều, dao động 80 ms, mất 10 %): đầu nét tiến mỗi khung, không lùi, D trong 30–150 ms.
- `tests/live-so-net-noi-lai-1011.test.ts`: em nối lại với số thứ tự cũ nhận đúng phần thiếu; xoá bảng dọn sổ.
- `tests/live-xoay-chia-doi-1011.test.ts`: bảng tình huống `dangChiaDoi` — iPhone dọc xoay CSS, Android khoá ngang toàn màn, Android ngang còn thanh trình duyệt, lệch hướng trong 600 ms khoá xoay, chia đôi thật 50 %.
- `tests/live-roi-man-1011.test.ts`: đang live em rời ⇒ `viewBang.roiNay` có tên; `ve` ⇒ mất; đang chờ quyền mic không tính rời.
- `tests/toc-do-may-chu-lenh-nong-1310.test.ts` (đang có): 4 lệnh nóng không thêm đợt chờ D1.

**Cổng:** `tsc` · `npm run build && npm run kiem:toc-do` 0 đỏ · `npm run kiem:mau-giu` 0 · `npm run check:mau` · `npm run kiem:co-tep` · `node scripts/kiem-sw.mjs` · ảnh Chromium: 0 lỗi trang, 0 tràn, 0 đích bấm máy em < 48 px (script chụp đã soát 40 ảnh: 0 / 0 / 0).

**Đo trễ thật (Đợt 0 và trước mỗi lần phát hành; ghi `docs/do-live-<ngày>.md`):**

| Chỉ số | Cách đo | Máy |
|---|---|---|
| Trễ tiếng đầu-cuối | Chuẩn vàng: gõ một tiếng «tách» cạnh mic thầy, đặt máy em sát bên, máy thứ ba ghi âm cả hai, đo khoảng cách hai đỉnh sóng (20 lần, lấy trung vị + p95). Tự động: chế độ `?do=1` thay mic bằng tiếng «bíp» phát lúc `t0`, gửi `t0` qua kênh nét; máy em bắt đỉnh trên luồng nhận, cộng trễ đệm + trễ loa từ `getStats()`. | 1 Android tầm thấp + 1 iPhone, Wi-Fi lớp và 4G |
| Trễ nét | mỗi lô mang `tGui`; máy em ghi giờ vẽ xong − `tGui` − độ lệch đồng hồ (ước bằng ping/pong phòng, lấy mẫu RTT nhỏ nhất). Đối chứng: quay chậm 240 khung/giây cả màn thầy lẫn máy em. | như trên |
| Nét liên tục | máy em ghi khoảng đứng dài nhất của đầu nét trong lúc nét chưa nhấc | như trên |
| Lệch tiếng–nét | thầy gõ ngòi bút xuống bảng vẽ (tiếng gõ vào mic + nét bắt đầu cùng lúc); máy em so giờ đỉnh âm với giờ điểm đầu của nét | như trên |
| Bấm Live → có hình + tiếng | giờ `live-bat` ở phòng → giờ `live-ok` của từng em; lấy p90 | cả lớp thử |
| Khung hình máy em | Playwright CPU ×4 (và ×6), phát lại một bản ghi nét 60 giây, đo p95 khoảng khung như `scripts/toc-do-sau-gop.mjs` | máy đo |
| Tải 300 em | 300 trình duyệt không đầu nghe tiếng + nhận nét 10 phút: tỉ lệ nối được, gói mất, CPU của phòng, số lệnh gửi/giây | máy đo |
| RTT tới SFU | `candidate-pair.currentRoundTripTime` trên Viettel, VNPT, FPT, Mobifone | máy thật |

Máy em gửi `live-do` 10 giây một lần (trung vị + p95 trễ nét, trễ đệm tiếng, khoảng đứng, RTT); phòng gộp, thầy xem ở Thống kê sau buổi. Số của tác tử `toc-do` sau khi gộp vẫn bắt buộc như mọi việc khác.

## 8. Điểm CẦN THẦY QUYẾT (5 điểm, mỗi điểm có mặc định)

1. **Mở Cloudflare Realtime cho app.** Khoá API hiện có thiếu quyền Realtime nên em chưa tự tạo được.
   - Mặc định đề xuất: thầy vào bảng điều khiển Cloudflare → Realtime → SFU → tạo một ứng dụng (2 phút, không mất tiền), rồi dán App ID + App Secret vào form bảo mật em sẽ gửi (không dán vào chat).
   - Cách khác: thầy thêm quyền «Realtime: Edit» vào khoá phát hành, em tự tạo.
   - Chưa có thì chưa làm được Đợt 0.
2. **Trừ kJ khi em rời màn lúc live.**
   - Mặc định đề xuất: y như Bình Phản Ứng đang chạy — em −50 kJ, đội −50 kJ mỗi lần rời, với em đã điểm danh có đội. Em xem từ xa (không đội) chỉ bị cảnh báo tên trên màn chiếu.
3. **Tiếng trên máy em đang ngồi TRONG LỚP, và chống hú khi hai chiều.** Nhiều máy cùng phòng mở loa sẽ thành dàn đồng ca lệch 0,2 giây; em trong lớp bật mic cạnh loa lớp dễ hú.
   - Mặc định đề xuất: em trong lớp (đã điểm danh tại lớp) mặc định TẮT tiếng, tự bật khi đeo tai nghe; em ở xa mặc định BẬT. Em trong lớp vẫn «Giơ tay» để xếp hàng, được mời thì đứng lên nói trực tiếp (mic thầy thu lại cho em ở xa); chỉ em ở xa mới mở mic máy. Thẻ bật live có công tắc «Tiếng trên máy em: Em ở xa / Tất cả».
   - Lựa chọn khác: bật tiếng tất cả (buổi dạy online hoàn toàn).
4. **Em ở nhà vào xem không cần mã điểm danh.**
   - Mặc định đề xuất: TẮT. Thầy bật từng buổi bằng công tắc «Cho em ở xa vào xem». Chỉ em có tên trong lớp, đã đăng nhập app; không tính điểm danh, không đội, không kJ; vẫn bị bắt rời màn.
5. **Lượt đang mở mà em chưa gửi đáp án, thầy đang live: máy em ưu tiên gì.**
   - Mặc định đề xuất: giữ màn làm bài (dọc), vẫn nghe tiếng thầy, có dải nhỏ «Thầy đang live»; gửi xong tự sang bảng live.
   - Lựa chọn khác: luôn bảng live, làm bài qua khay.

## 9. Giai đoạn build

| Đợt | Làm gì | Xong khi |
|---|---|---|
| **0 · Thử khả thi** (cần điểm quyết 1) | Trang thử sau cờ, không lộ cho em. Thầy ↔ 2 máy thật: đo trễ tiếng, trễ nét, RTT tới SFU trên 4 nhà mạng. Tải giả 300 người nghe. Chốt khung Opus 10 hay 20 ms, DTX, cách phát sẵn track câm. | có `docs/do-live-<ngày>.md`. Trễ tiếng trung vị > 300 ms, hoặc 300 người nghe không ổn ⇒ DỪNG, báo thầy phương án B (LiveKit / máy chủ tại Việt Nam). |
| **1 · Một chiều** | Nút Live + thẻ mic; tiếng thầy; nét + con trỏ + đồng bộ; máy em toàn màn, xoay ngang, khay tự ẩn theo màu đội (Tiếng, mạng, đội + kJ); vào live ≤ 1 s; rời màn + thẻ gọn trên màn chiếu; nối lại + sổ nét; chế độ nhẹ; số đo `live-do`; công tắc `cau_hinh.live_bang` (mặc định tắt, bật cho một lớp thử trước). | đủ test mục 7 + bảng số đo đạt trên máy thật |
| **2 · Hai chiều** | Giơ tay, mời nói, thu mic, kênh «khach», chống hú theo điểm quyết 3, nhật ký ai nói, em ở xa theo điểm quyết 4, phóng bảng chạm hai lần. | hai chiều ≤ 250 ms mỗi chiều; thu mic có hiệu lực ≤ 0,5 s |
| Không làm (chưa ai yêu cầu) | Xem lại buổi live, ghi âm, camera thầy, chat chữ. | — |

Làn: phòng + máy em + tờ chiếu thuộc làn Bình Phản Ứng (Claude). Bộ máy bút: nhánh `claude/but-bang-1011`. Codex soát trên PR.

## 10. Rủi ro

| | Rủi ro | Giảm thế nào |
|---|---|---|
| R1 | Tài liệu SFU không nêu trần số người đăng ký một track / một DataChannel; ví dụ chính thức (Pocket Radio) chỉ thử 8 người nghe và ghi rõ đó không phải giới hạn SFU. | Đợt 0 thử tải 300. Hỏng ⇒ nét rơi về WebSocket có gom lô; tiếng xét LiveKit. |
| R2 | Nhà mạng Việt Nam đẩy sang PoP nước ngoài ⇒ +30–60 ms. | Đo RTT ở Đợt 0; vẫn trong mục tiêu nếu ≤ 60 ms. |
| R3 | Đề trên máy em xuống dòng khác máy thầy ⇒ nét gạch chân trên giấy lệch chữ. | Cùng hàm dựng, cùng bề rộng lôgic, cùng phông nhúng; thầy gửi kèm vị trí các dòng để máy em tự kiểm, lệch thì ẩn nét trên giấy và báo số đo. Nét trên bảng đen không bị ảnh hưởng. |
| R4 | iPhone: nút gạt im lặng, ngắt tiếng khi có cuộc gọi, mở mic làm đổi chế độ loa. | Phát qua `<audio>`; mất tiếng thì hiện «Chạm để bật tiếng thầy»; thử trên iOS 14, 15, 17, 26. |
| R5 | Mạng trường chặn UDP. | TURN qua TCP 443 (miễn phí khi dùng cùng SFU); cuối cùng là chế độ nhẹ. |
| R6 | Báo nhầm rời màn khi xoay / hỏi quyền mic. | Khoá xoay 600 ms + cờ chờ quyền mic + test bảng tình huống + thử tay. |
| R7 | Bộ máy bút mới chưa có API xuất nét đúng hợp đồng. | Chốt hợp đồng mục 4.3 với phiên bút trước khi vào Đợt 1. |
| R8 | Em nói bậy / gây ồn khi được mời. | Chỉ nói khi được mời, «Thu mic» đóng track ở máy chủ, có nhật ký. |
| R9 | DTX cắt đầu chữ, hoặc trình duyệt không nhận sửa SDP. | Đợt 0 nghe thử; không ổn thì tắt DTX (tốn thêm ≈ 1,6 GB mỗi buổi lúc chờ, vẫn 0 USD). |
| R10 | Tốn pin / dữ liệu vì nối sẵn cả buổi không live. | Chỉ nối sẵn khi «Sẵn sàng live» bật; track câm + DTX ≈ 1 kb/s. |

## 11. Danh sách ảnh (`docs/ban-ve-live-1011/`)

| Ảnh | Nội dung |
|---|---|
| 01, 02, 03 | Màn chiếu thầy CHƯA live: 1366, 1920, giấy tối |
| 04 | Thầy bật live lần đầu: chọn mic, vạch mức âm |
| 05, 06, 07 | Thầy ĐANG live: viên đỏ có đồng hồ, số em xem, mức mic; 1366, 1920, giấy tối |
| 08, 09 | Em rời màn: thẻ gọn + viền đỏ; thẻ mở tên em |
| 10, 11, 12 | Giơ tay: thẻ gọn; hàng chờ + «Mời nói»; em đang nói + «Thu mic» |
| 13–18 | Máy em ẩn hết (chỉ tay nắm): 844 × 390, 667 × 375, 1180 × 820; giấy sáng + tối |
| 19–22 | Khay mở, đủ bốn màu đội: Natri, Kali, Đồng, Canxi |
| 23, 24 | Khay mở trên 667 giấy tối và máy bảng 1180 |
| 25 | Hiệu ứng vào live «Thầy đang live» |
| 26, 27 | «Chạm để bật tiếng thầy»; Tiếng đang tắt |
| 28, 29 | Đang giơ tay: khay mở; khay đóng (huy hiệu trên tay nắm) |
| 30, 31, 32 | Được mời nói; em đang nói (sóng âm); bạn đang nói |
| 33, 34 | Mất mạng, đang nối lại: 844 và 667 giấy tối |
| 35 | Phóng bảng đen kín màn |
| 36, 37, 38 | iPhone máy dọc, hình xoay bằng CSS: ẩn hết, khay mở, đang nói |
| 39, 40 | iPhone ngang có tai thỏ: ẩn hết, khay mở |

Bản vẽ dùng dữ liệu giả sát thực tế (lớp 12A1, 150 em). Nét phấn trong ảnh là hình minh hoạ, không phải bộ máy bút thật.

## Phụ lục A — Nguồn (tra ngày 10/11/2026)

Tài liệu Cloudflare đọc từ kho nguồn chính thức của trang tài liệu (`cloudflare/cloudflare-docs`, nhánh `production`) vì phiên này không mở được `developers.cloudflare.com`; số giá Realtime đối chiếu thêm bằng tìm kiếm trang giá chính thức.

| Điều dùng trong đặc tả | Nguồn |
|---|---|
| Realtime 0,05 USD/GB ra; 1.000 GB đầu miễn phí mỗi tháng; SFU + TURN chung; đẩy lên không tính | developers.cloudflare.com/realtime/sfu/platform/pricing/ |
| SFU: 50 yêu cầu/giây mỗi phiên; ≤ 64 track mỗi yêu cầu; track không có gói trong 30 giây bị dọn; codec Opus | developers.cloudflare.com/realtime/sfu/platform/limits/ |
| DataChannel qua SFU: một người phát, nhiều người nhận; `ordered: false`, `maxRetransmits: 0` cho «pointer movement» | developers.cloudflare.com/realtime/sfu/features/datachannels/ |
| App Secret giữ ở máy chủ; API `rtc.live.cloudflare.com/v1`; không chọn vùng SFU; mẫu «Broadcast» | …/realtime/sfu/concepts/architecture/ · …/realtime/sfu/api/ |
| Ví dụ một thiết bị phát Opus + DataChannel cho nhiều trình duyệt nghe, Worker + Durable Object giữ tín hiệu | …/realtime/sfu/examples/embedded-devices/ |
| Realtime chạy trên mọi điểm hiện diện; Việt Nam có Hà Nội, TP.HCM, Đà Nẵng | blog.cloudflare.com/announcing-cloudflare-calls/ · cloudflare.com/network/ · cloudflarestatus.com/locations |
| Durable Objects: 1 triệu yêu cầu + 400.000 GB-giây đã gồm; 0,15 USD/triệu; 12,50 USD/triệu GB-giây; tin WebSocket đến 20:1; tin gửi đi miễn phí | developers.cloudflare.com/durable-objects/platform/pricing/ |
| «Sending many small messages can overwhelm a single Durable Object» | developers.cloudflare.com/durable-objects/best-practices/websockets/ |
| Workers Paid: 10 triệu yêu cầu đã gồm, 0,30 USD/triệu | developers.cloudflare.com/workers/platform/pricing/ |
| `screen.orientation.lock`: Chrome Android 38, Safari chưa hỗ trợ · `requestFullscreen`: iOS 16.4 chỉ iPad · `wakeLock`: Safari 16.4, iOS 18.4 · `AudioDecoder`: Chrome 94, Safari 26 · `ManagedMediaSource`: iOS 17.1 · MSE: không có trên iPhone · `jitterBufferTarget`: Chrome 124 · `getCoalescedEvents`: Safari 18.2 · `IdleDetector`: Chrome 94, Safari không · `getDisplayMedia`: Chrome Android không · WebRTC + DataChannel: Safari 11 | bảng tương thích MDN (`mdn/browser-compat-data`, nhánh `main`) |
| LiveKit Cloud: Build 0 USD, Ship 50 USD/tháng, Scale 500 USD/tháng; 150.000 phút đã gồm rồi 0,0005 USD/phút | livekit.com/pricing — CHỈ đọc được qua kết quả tìm kiếm, chưa mở được trang; giá băng thông vượt mức chưa xác minh |
| Safari: luồng WebRTC tự phát khi trang đang thu hoặc đang phát tiếng; lần đầu cần thao tác của người dùng | webkit.org/blog/7763/a-closer-look-into-webrtc/ — đọc qua trích dẫn ở bugs.webkit.org, chưa mở được trang gốc |
| Opus trong SDP: `useinbandfec`, `usedtx`, `ptime`, `maxaveragebitrate` | RFC 7587 — đọc qua kết quả tìm kiếm |
| Ngưỡng trễ đàm thoại (G.114), ngưỡng lệch hình–tiếng (BT.1359), tốc độ báo điểm của Wacom ~200 điểm/giây, tỉ lệ máy cần chuyển tiếp khi P2P | theo hiểu biết sẵn có, CHƯA tra lại hôm nay; Đợt 0 đo thay cho giả định |

**Kiểm tài khoản Cloudflare (chỉ đọc):** proxy của phiên không mang khoá Cloudflare, nên chạy workflow chỉ đọc `.github/workflows/kiem-realtime-chi-doc-1011.yml` trên nhánh này (chỉ GET, không in khoá / mã, không tạo gì). Lượt chạy 42828525455, 10/11 20:52 giờ Việt Nam:

| Hỏi | Kết quả |
|---|---|
| `GET /user/tokens/verify` | HTTP 200, khoá `active` |
| `GET /accounts/<id>/calls/apps` (ứng dụng SFU) | HTTP 403, mã 10000 «Authentication error» ⇒ khoá THIẾU quyền Realtime |
| `GET /accounts/<id>/calls/turn_keys` | HTTP 403, như trên |
| `GET /accounts/<id>/realtime/kit/apps` | HTTP 403, như trên |

Chưa kết luận được tài khoản đã có ứng dụng SFU hay chưa. Sau khi thầy thêm quyền, chạy lại workflow này là biết.
