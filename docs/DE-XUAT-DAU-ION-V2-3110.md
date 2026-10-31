# Đề xuất · «Đấu Nguyên Tử 2» — làm lại game bắn nhau ở phòng chờ (31/10/2026)

**Lời thầy (31/10, nhắc nhiều lần):** «Game bắn nhau ở phòng chờ làm lại đẹp hơn màu mè hơn cho tự bắn tự ngắm vào đối thủ, bỏ hai nút điều khiển đi cho di chuyển theo cách nào đó mà ko phải tạo nút riêng, có vật phẩm ăn để tiến hóa súng, game phải nhẹ tối đa 6 người chơi cùng lúc đc, bắn phải hay đẹp hơn. Lối chơi cuốn hút gây nghiện nhưng lại đơn giản nhẹ nhàng vui vẻ. Vẽ tôi duyệt rồi build.»

**Đang ở:** bước 2 (đặc tả + bản vẽ). Chưa build, chưa sửa `src/`, `server/`. Chờ thầy duyệt.

- **Chơi thử ngay:** mở `scripts/ban-ve-dau-ion-v2-3110/thu.html` bằng trình duyệt điện thoại hoặc máy tính. Em + 5 A.I, không cần mạng.
- **Bản vẽ:** `docs/ban-ve-dau-ion-v2-3110/` (25 ảnh Chromium thật + 1 đoạn quay 13 giây). Danh sách ở cuối tệp.
- Đặc tả bản đang chạy: `docs/dac-ta-game-ban-sung-3010.md`.

## Tóm tắt

| | Hôm nay | Đề xuất |
|---|---|---|
| Điều khiển | 2 cần «Di chuyển», «Ngắm · Bắn» chiếm nửa dưới màn | **Không nút.** Kéo ở đâu cũng được. Chạm một điểm thì đi tới đó. Máy tính: rê chuột, W A S D |
| Ngắm, bắn | Em tự ngắm, giữ để bắn | **Súng tự ngắm bạn gần nhất, tự bắn** |
| Một trận | 1–1, hoặc nhóm 3–4 | **Sân tối đa 6 bạn**, vào giữa ván được. Thiếu người thì A.I vào cho đủ 4 |
| Vật phẩm | Xúc tác (bắn nhanh 5 giây), Khiên (chặn 1 viên) | **Electron** (nuôi súng), **Xúc tác** (lên ngay 1 cấp), **Khiên** (chặn 3 viên) |
| Súng | 1 loại | **5 cấp:** Liên kết đơn → đôi → ba → Phản ứng dây chuyền → Phản ứng toả nhiệt |
| Ván | 90 giây, hạ 5 lần là thắng | **60 giây**, hạ nhiều nhất là nhất. Ván mới tự chạy sau 6 giây |
| Màu | Xanh lá dịu của phòng chờ | Khung theo màu app học sinh. Sân nhiều màu, nền tối thì phát sáng |
| Mạng | Durable Object của ca, 20 ảnh/giây | **Giữ nguyên** phòng, vé, nhịp, mã đóng, lệnh `dong` |

## 1. Mục tiêu + ai dùng

- **Ai:** học sinh ở phòng chờ ca kiểm tra. Thầy, phụ huynh không thấy game.
- **Cảm giác:** vào là chơi ngay, không phải học cách điều khiển. Ván ngắn, thua vẫn vui, muốn «thêm một ván».
- **Không phải bài học:** không câu hỏi, không điểm, không EXP.
- **Chút Hoá có chủ đích:**
  - Mỗi em là một nguyên tử, áo màu theo quy ước CPK của mô hình phân tử.
  - 5 cấp súng là 5 khái niệm Hoá thật: liên kết đơn, đôi, ba; phản ứng dây chuyền (gốc tự do); phản ứng toả nhiệt.
  - Sân là bàn thí nghiệm: sàn lục giác (vòng benzene), bình cầu, bình nón, giá ống nghiệm, cốc.
- **Thiết kế riêng:** chủ đề, tên, hình, cách tiến hoá theo phản ứng và luật mất cấp đều tự đặt. Không chép nhân vật, tên, hình hay luật riêng của game nào.

### Vòng chơi (một ván 60 giây)

1. Bấm **Vào sân đấu**. Em vào ngay sân đang chơi của ca. Đang giữa ván cũng vào được: em xuất hiện ở bệ xa địch nhất, có khiên 1,2 giây.
2. **Kéo để đi.** Súng tự ngắm bạn gần nhất và tự bắn.
3. Nhặt **electron** (chấm lam ngọc rải khắp sân, đi gần là tự hút). Đủ số thì súng lên cấp.
4. **Máu 10.** Trúng 1 viên mất 1 Máu. 2,5 giây không trúng thì hồi 1 Máu mỗi 0,5 giây.
5. **Hết Máu là bị hạ:**
   - súng xuống 1 cấp;
   - rơi 3 electron tại chỗ;
   - hồi lại sau 1,5 giây.
   - Người hạ được cộng thẳng 2 electron.
6. **Hết 60 giây:** ai hạ nhiều nhất thì nhất ván. Bằng nhau thì xét ít bị hạ hơn, rồi cấp cao nhất. Bảng xếp hạng hiện 6 giây, rồi ván mới tự chạy, mọi người về Cấp 1.

**Vì sao cuốn mà vẫn nhẹ nhàng:**
- ván ngắn;
- luôn có thứ để nhặt ngay cạnh;
- súng đổi hình rõ ở mỗi cấp;
- người dẫn đầu có ngôi sao vàng, ai cũng muốn hạ;
- bị hạ chỉ mất 1 cấp, electron rơi ra thì người khác nhặt ⇒ không ai bị bỏ quá xa;
- ván mới tự chạy, không phải bấm gì.

### 5 cấp súng («súng phản ứng»)

| Cấp | Tên | Bắn | Lên cấp kế cần |
|---|---|---|---|
| 1 | Liên kết đơn (như H–H) | 1 viên mỗi loạt, 0,34 giây/loạt | 3 electron |
| 2 | Liên kết đôi (như O=O) | 2 viên song song | 5 electron |
| 3 | Liên kết ba (như N≡N) | 3 viên xoè | 7 electron |
| 4 | Phản ứng dây chuyền (như gốc Cl• tự do) | 3 viên; trúng thì tia sét nảy sang bạn gần nhất (trong 170 đơn vị), trừ thêm 1 Máu | 9 electron |
| 5 | Phản ứng toả nhiệt (như Mg cháy sáng) | 5 viên xoè, 0,4 giây/loạt; trúng thì nổ lan bán kính 46 | Cấp cao nhất: electron nhặt thêm hồi 1 Máu |

- Trên sân, cấp súng nhìn được 3 cách: **số trên huy hiệu** cạnh tên, **số electron quay** quanh nguyên tử, **hình nòng súng** (1 ống · 2 ống · 3 nhánh · ống có vòng cuộn · loa lửa vàng).
- Mỗi viên trừ 1 Máu ở mọi cấp. Cấp cao hơn mạnh hơn vì bắn nhiều viên hơn, không phải vì mỗi viên đau hơn.

### Vật phẩm

| Vật phẩm | Hình | Tác dụng | Xuất hiện |
|---|---|---|---|
| **Electron** | chấm sáng lam ngọc có vòng quỹ đạo | +1 electron cho thanh lên cấp. Cấp 5: hồi 1 Máu | Luôn có khoảng 14 cái trên sân; người bị hạ rơi 3 cái |
| **Xúc tác** | vòng benzene vàng, quay | Lên ngay 1 cấp. Cấp 5: hồi đầy Máu | Một cái một lúc, ở giữa sân; 14 giây hiện lại |
| **Khiên** | khiên chàm | Khiên: chặn 3 viên đạn kế tiếp (3 cung quanh nguyên tử, mất dần) | Một cái một lúc; 11 giây hiện lại |

## 2. Bố cục và điều khiển

### Điều khiển không nút

| Máy | Cách đi |
|---|---|
| Điện thoại dọc, ngang | **Kéo ở bất kỳ đâu trên màn.** Chạm xuống chỗ nào thì tâm «cần nổi» ở chỗ đó. Kéo về hướng nào thì đi hướng đó. Buông là dừng. Kéo xa quá 54 px thì tâm tự đi theo ngón, đổi hướng nhanh. Vòng mờ chỉ hiện dưới ngón khi đang kéo. Đó không phải nút. |
| Điện thoại (phụ) | **Chạm nhanh một điểm trên sân** (dưới 0,24 giây, không kéo) thì đi tới điểm đó (vòng đích nét đứt). |
| Máy tính | **Rê chuột trên sân:** nguyên tử đi theo con trỏ, con trỏ đặt lên nguyên tử thì đứng. Hoặc **W A S D / phím mũi tên**: chơi được chỉ bằng bàn phím. |

**Vì sao chọn «kéo ở đâu cũng được»:**
- **Ngón không che nguyên tử.** Kéo ở nửa dưới màn mà nguyên tử ở trên vẫn đi. Cách «chạm để đi» hay «đi theo ngón» thì ngón che đúng chỗ đang đánh.
- **Né đạn liên tục, tức thì.** Chạm-để-đi phải chạm nhiều lần, né chậm.
- **Không giữ chỗ cho nút.** Sân to hơn; nửa dưới màn dọc thành vùng kéo rộng cho ngón cái.
- **Dùng một ngón, cả màn dọc lẫn ngang.** Kiểu cần nổi là cách điều khiển chung của game điện thoại, em đã quen tay.
- **Máy tính:** rê chuột là đi, không cần giữ nút.

Đã cân nhắc và không chọn làm cách chính: chạm để đi (né chậm); đi theo ngón (ngón che); nghiêng máy (không hợp khi ngồi trong lớp).

### Tự ngắm, tự bắn

- **Mục tiêu** là bạn gần nhất thoả cả ba điều kiện:
  - còn trên sân và đã hết khiên hồi sinh;
  - trong tầm 320 đơn vị (sân rộng 600);
  - không bị vật che chắn đường bắn.
- **Giữ mục tiêu cũ** cho tới khi có bạn khác gần hơn hẳn (25 %) ⇒ nòng không giật qua lại.
- **Có mục tiêu thì tự bắn** theo nhịp của cấp súng. Không có thì không bắn (đỡ tốn gói); nòng quay theo hướng đi.
- **Bắn vào chỗ bạn đang đứng, không đón đầu** ⇒ ai đi khéo thì né được. Kỹ năng nằm ở cách đi.
- **Đường ngắm:**
  - của em: nét đứt chạy về mục tiêu, kèm vòng ngắm quay trên mục tiêu;
  - của bạn khác: mờ, để em biết ai đang nhắm mình;
  - máy yếu: chỉ hiện đường của em.
- A.I tự ngắm đúng luật này. A.I chỉ khác người ở cách đi.

### Bố cục 3 khổ

| Khổ | Bố cục |
|---|---|
| Điện thoại dọc (390 × 844) | Trên cùng: dải «Phòng chờ · Thầy bắt đầu là vào bài» + «Rời sân». Dưới dải: khung của em (Máu, Cấp súng, electron) bên cạnh ô Còn / Hạ. Giữa: sân vuông rộng hết màn. Dưới sân: «Xếp hạng ván này» (6 ô, 2 cột). Đáy màn để trống làm vùng kéo, có dòng gợi ý «Kéo ở bất kỳ đâu…» |
| Điện thoại ngang (844 × 390) | Trái: khung em + Còn / Hạ (ngón cái trái kéo ở khoảng trống bên dưới). Giữa: sân. Phải: xếp hạng |
| Máy tính (1440 × 900) | Sân 820 px bên trái. Cột phải: khung em, Còn / Hạ, xếp hạng, Cách chơi |

- **Tin nổi** nằm trên khung của em, **không che sân**. Ví dụ: «Em hạ Quốc Bảo! · Hạ liền 3», «Xúc tác! Lên Cấp 4 · Phản ứng dây chuyền», «Quốc Bảo hạ em · súng xuống Cấp 3 · hồi lại sau 1,5 giây».
- **Sảnh** là thẻ trong phòng chờ, nằm dưới «Đang chờ Thầy bấm bắt đầu». Chữ ca, lớp, thời lượng giữ nguyên. Thẻ gồm:
  - tiêu đề + «Thắng hôm nay»;
  - ảnh bìa (vẽ một lần);
  - một câu luật;
  - 5 chip cấp;
  - MỘT nút chính «Vào sân đấu» + dòng «Sân 3 · 4/6 bạn đang chơi · ván 60 giây»;
  - chọn nguyên tố (7 nút 44 px);
  - «Ẩn tên».
- **Hết ván:** thẻ đè lên sân. Gồm «Em nhất ván!» / «Em hạng 3/6», bảng (Hạ · Bị hạ · Cấp cao nhất · Chuỗi hạ), «Ván mới sau N giây» + thanh đếm, 4 câu phản ứng nhanh (giữ từ bản cũ), nút «Chơi ván mới» và «Về sảnh», dòng «Kết quả chỉ để vui, không lưu vào điểm.»

### Hình và màu

- **Khung** (thẻ sảnh, khung em, xếp hạng, bảng hết ván, nút) dùng **token app học sinh** `--tr-*` (bảng «Chất chỉ thị» thầy duyệt 27/10):
  - nút chính `--tr-hs-nut`, gờ nổi `--tr-hs-day`;
  - Máu `--tr-dung`, còn ít Máu `--tr-sai`;
  - Hạ `--tr-sao-chu`;
  - electron `--tr-tin`.
  - Trang phòng chờ giữ nguyên `--pc-*`.
- **Trong sân** dùng biến game `--dn-*`, pha bằng `color-mix` từ token, không thêm màu thô (qua được `npm run kiem:mau-giu`):
  - 7 màu nguyên tố: Na tím, O hồng đỏ, N lam, Cl lục ngọc, S vàng, Fe cam, Ne lam ngọc;
  - 5 màu cấp: xám → lam ngọc → lục → hồng tím → vàng;
  - sàn lục giác có vết dung dịch nhiều màu; dụng cụ thí nghiệm chứa dung dịch màu;
  - nền tối: sàn chàm đêm, đạn và nguyên tử phát sáng.
- **Không chỉ báo bằng màu:** Máu có số («Máu 7/10»); cấp có số trên huy hiệu.
- **Mỗi sân 6 màu khác nhau:** hai em chọn trùng nguyên tố thì phòng đổi một em sang nguyên tố còn trống, chỉ trong ván đó.

### Hiệu ứng (bắn hay, đẹp)

| Lúc | Hiệu ứng |
|---|---|
| Bắn | Loé đầu nòng, nòng giật lùi, đạn có vệt sáng theo màu nguyên tố. Cấp 4: tia lách tách quanh đạn. Cấp 5: vệt lửa vàng, đầu đạn trắng |
| Trúng | Tia vụn màu người bắn. Mục tiêu loé trắng và méo nhẹ 0,14 giây. «−1» bay lên (chỉ khi có em, tối đa 1 số / 0,3 giây mỗi mục tiêu). Em trúng: viền đỏ nhẹ + màn rung 3 đơn vị + rung máy 12 ms |
| Hạ | Nguyên tử vỡ thành bong bóng + sóng tròn, chữ «Hạ!» (to khi em hạ), màn rung nhẹ, 3 electron văng ra |
| Lên cấp | Hai vòng sáng màu cấp mới, sao lấp lánh, «Cấp 4» dưới chân, tin «Lên Cấp 4 · Phản ứng dây chuyền» |
| Nhặt | Electron bay vào nguyên tử, «+1». Xúc tác: vòng vàng loang. Khiên: vòng chàm |
| Dây chuyền | Tia sét hai lớp (màu cấp 4 + lõi trắng) nối hai mục tiêu |
| Toả nhiệt | Quả cầu nổ vàng loang ra bán kính 46 + vòng sáng |

## 3. Trạng thái

| Trạng thái | Hiện gì |
|---|---|
| Đang tải mảnh game | «Đang chuẩn bị trò chơi…» (giữ). Mảnh lỗi: «Mini-game chưa tải được. Em vẫn sẽ vào bài khi Thầy bắt đầu.» |
| Chưa vào | Nút «Vào sân đấu». **0 kết nối** cho tới khi bấm. Lần sau tự vào (giữ cách cũ) |
| Đang nối | «Đang vào sân đấu…» |
| Sân vắng | A.I vào cho đủ 4. Dòng phụ: «Sân 1 · 1 bạn + 3 A.I» |
| Đang chơi | Màn trận |
| Em bị hạ | Tin nổi (ai hạ, xuống cấp mấy, hồi sau 1,5 giây); thanh Máu đầy lại khi hồi |
| Hết ván | Bảng xếp hạng, ván mới sau 6 giây |
| Mất mạng | «Mất kết nối sân đấu — đang thử lại (lần N)…» (1 → 2 → 4 → 8 giây, 5 lần). Hết lượt thử: nút chính đổi thành «Chơi với A.I» (chạy tại máy, em + 5 A.I, 0 mạng) |
| Sảnh tắt / không vé / vé hết hạn / mở ở máy khác / sảnh đầy | Giữ nguyên chữ hôm nay; nút chính thành «Chơi với A.I» |
| Máy không vẽ được Canvas | «Máy này chưa vẽ được sân đấu. Em vẫn chờ thầy bắt đầu bình thường.» (giữ) |
| **Thầy bấm bắt đầu** | **Ngay lập tức:** đóng WebSocket, huỷ vòng vẽ, tháo màn trận. Chỉ còn «Thầy đã bắt đầu thi · Đấu Nguyên Tử đã dừng. Em đang được đưa vào bài…» (ảnh 7) |

## 4. Dữ liệu và mạng (≤ 6 người, nhẹ)

**Giữ nguyên (không đổi máy chủ ngoài lớp game):**
- Durable Object `PhongDauIon` của mỗi ca, WebSocket Hibernation, ping/pong tự động.
- Vé `veDau` ký HMAC ở lệnh vào thi (nhánh phòng chờ), tên gọi = hai chữ cuối họ tên.
- Mã đóng 4000 / 4002 / 4003 / 4008 / 4009 / 4010. Lệnh `{t:'dong', ly:'bat-dau'}` khi thầy bắt đầu.
- **0 lệnh D1, không bảng mới, không migration.**

**Mô hình đồng bộ — máy chủ quyết** (đơn giản nhất mà chạy được, đã có sẵn):
- Phòng chạy lõi chung `src/lib/dau-ion/loi.ts`, 20 nhịp/giây: vị trí, tự ngắm, bắn, trúng, hạ, vật phẩm, cấp súng.
- Máy em chỉ gửi **hướng đi**. Ngắm và bắn tính ở phòng ⇒ không ai gian được ngắm, bắn, Máu, cấp.
- Máy em giữ hai cách làm mượt đang có:
  - đoán trước bước đi của chính em;
  - vẽ bạn khác trễ 100 ms, nội suy giữa hai ảnh.
- Đạn: phòng gửi **một sự kiện mỗi loạt** (vị trí, góc, cấp). Máy em tự sinh 1–5 viên theo cấp và cho bay. Trúng hay không thì phòng báo.
- Tự ngắm chạy cả ở máy em (cùng hàm của lõi) để vẽ đường ngắm của em ngay, không chờ mạng.

**Gói tin:**
- **Lên:** giữ gói ý định 8 byte, khoảng 12 lần/giây. Chỉ dùng seq, dx, dy; byte ngắm và bắn bỏ qua. ≈ **0,15 KB/giây**.
- **Xuống:** ảnh trận nhị phân **mã mới 3**, để bản cũ và bản mới không đọc lẫn.
  - Đầu gói 6 byte.
  - 10 byte mỗi ghế: id, x, y, mục tiêu, Máu (4 bit) + cấp (3 bit), cờ (khiên hồi sinh, Khiên, vắng), Hạ, electron.
  - Sự kiện: loạt bắn 10 B · trúng 10 B · hạ 8 B · vật phẩm hiện 6 B / nhặt 4 B · lên cấp 3 B · dây chuyền 9 B · nổ lan 6 B.
  - Sân 6 bạn: 66 B + sự kiện trung bình khoảng 40 B ≈ 110 B/ảnh × 20 ảnh/giây ≈ **2,2 KB/giây mỗi em**. Một ván 60 giây ≈ 130 KB; 5 phút chờ ≈ 0,7 MB. Đây là ước tính, bước build sẽ đo thật bằng test.
- Vật phẩm chỉ gửi lúc hiện và lúc nhặt. Em vào giữa ván thì nhận danh sách vật phẩm một lần trong gói JSON `san`.

**JSON sảnh:**
- Thêm:
  - `{t:'san', id, so, con, ghe:[[id, ten, nt, laAI]], vp:[[id, loai, x, y]]}` khi vào sân;
  - `{t:'ket', bang}` khi hết ván;
  - `{t:'van'}` khi ván mới bắt đầu.
- Bỏ (nếu thầy chọn ở mục «Thầy quyết» số 5): `thach`, `nhan`, `tu-choi`, `nhom-*`, `nhanh`.

**Ghép sân:**
- «Vào sân đấu» ⇒ vào sân đang chơi còn chỗ (tối đa 6 người thật). Đủ 6 ⇒ mở sân mới.
- Trần phòng giữ 80 kết nối ⇒ tối đa 14 sân mỗi ca.

**A.I lấp ghế:**
- A.I chạy ngay trong phòng bằng lõi chung (cùng hàm A.I của bản thử). Tên «A.I» + tên nguyên tố: «A.I Neon», «A.I Sulfur», để em luôn biết đâu là A.I.
- Sân có dưới 4 người thật ⇒ A.I vào cho đủ 4.
- Người thật vào ⇒ một A.I nhường ghế ngay.
- Sân chỉ còn A.I ⇒ đóng sân, không tốn nhịp.

## 5. Ngoại lệ

- **Thầy bấm bắt đầu:** giữ hai lớp chặn như hôm nay.
  - Máy em thấy `batDau` ⇒ tháo game.
  - Phòng gửi `{t:'dong', ly:'bat-dau'}` rồi đóng mã 4000, kể cả máy chưa kịp hỏi lại phòng chờ.
  - Bản thử có nút giả lập: game dừng trong cùng khung hình.
- **Treo máy để súng tự bắn:**
  - Ghế không gửi ý định quá 3 giây thì thành «vắng»: không tự bắn, vẽ mờ, A.I không nhắm.
  - Vắng quá 8 giây (giữ hạn cũ) thì rời sân; nếu sân dưới 4 người thật, A.I vào thay.
- **Mất mạng giữa ván:** ghế giữ 8 giây, nối lại vào đúng sân, đúng cấp.
- **Đổi tab, khoá màn:** vòng vẽ dừng. Máy em ngừng gửi ⇒ thành «vắng» như trên.
- **Hai ngón cùng chạm:** chỉ ngón đầu điều khiển.
- **Kéo bắt đầu trên dải trên cùng hoặc trên thẻ hết ván:** không tính là kéo (nút vẫn bấm được).
- **Mất focus:** nhả hết phím.
- **Dội gói:** quá 40 gói/giây bị bỏ, quá 80 thì đóng mã 4008 (giữ).
- **Tên dài:** cắt «…», tên gọi tối đa 16 ký tự (giữ). Màn hẹp 360 px: sân 344 px, chữ tên trên sân 11 px.
- **Đổi sáng/tối giữa trận:** đọc lại biến màu, vẽ lại nền.
- **Giảm chuyển động:** không rung màn, không quay, dùng chế độ máy yếu.

### Chế độ máy yếu

- **Tự bật** như hôm nay (`giamHieuUng()`, `ddh.mayYeu`, giảm chuyển động).
- **Tự hạ trong trận (mới):** đo 2 giây đầu (sau 1 giây làm nóng). Dưới 45 khung/giây thì bật chế độ máy yếu cho cả phiên, một lần, không hỏi.
- **Khi bật:**
  - 30 khung/giây, canvas DPR 1;
  - bỏ quầng sáng, vệt đạn, loé đầu nòng, rung màn, electron quay;
  - đường ngắm chỉ của em;
  - trần hiệu ứng 40 (thường 160).
- **Luôn luôn:**
  - canvas DPR tối đa 1,5;
  - nền vẽ một lần vào canvas phụ;
  - nguyên tử và quầng sáng vẽ sẵn thành ảnh nhỏ, không dùng `shadowBlur`;
  - khung của em và xếp hạng (DOM) chỉ vẽ lại khi số đổi;
  - không `setInterval` ở máy em;
  - không thư viện, không ảnh, không âm thanh.

**Đo khung hình của bản thử** (`node scripts/ban-ve-dau-ion-v2-3110/chup.mjs --do`, kết quả ở `docs/ban-ve-dau-ion-v2-3110/do-khung.json`):
- Chromium không giao diện trong máy chủ, vẽ bằng CPU, không GPU ⇒ chậm hơn điện thoại thật.
- Khung nhìn 390 × 844, sân 6 nguyên tử, A.I lái cả «Em». Đo 8 giây sau 2,5 giây làm nóng.

| CPU | Chế độ | Khung/giây trung bình | Trung vị | p95 |
|---|---|---|---|---|
| ×1 | thường | 60 | 16,7 ms | 16,8 ms |
| ×4 | thường | 47–48 | 16,7 ms | 33,4 ms |
| ×4 | máy yếu | 30 | 33,3 ms | 33,4 ms |
| ×6 | máy yếu | 29 | 33,3 ms | 50 ms |

⇒ Đạt yêu cầu ~60 khung/giây ở máy thường. Ở CPU ×4, p95 = 33,4 ms nghĩa là đạt sàn 30 khung/giây.

## 6. Chi phí máy chủ và tải

- **D1:** 0 lệnh thêm.
- **Durable Object** (gói lên ÷ 20 = 1 yêu cầu tính phí; gói xuống không tính):
  - một sân 6 người, 60 giây ≈ 4.320 gói ≈ 216 yêu cầu;
  - một ca 40 em, cả 40 em chơi 6 phút ≈ 172.800 gói ≈ 8.640 yêu cầu;
  - 300 ca/tháng ≈ 2,6 triệu yêu cầu ≈ 0,25 USD nếu phần có sẵn đã hết;
  - thời lượng ≈ 46 GB-s/ca ⇒ 300 ca ≈ 14.000 GB-s (khoảng 3,5 % phần có sẵn 400.000 GB-s).
  - ⇒ **dưới 0,5 USD/tháng.**
- **CPU phòng:** 14 sân, đạn chia bước 12 đơn vị, tự ngắm kiểm vật che. Ước tính dưới 1 ms/nhịp; bước build đo thật như lần 30/10 (khi đó: 0,35 ms/nhịp cho 30 trận).
- **Băng thông mỗi em:** xuống ≈ 2,2 KB/giây, lên ≈ 0,15 KB/giây.
- **Tải mảnh:**
  - Game vẫn là mảnh nạp lười `DauIon-*` ngoài precache (`vite.config.ts` globIgnores giữ nguyên `**/{ChuyenBay,DauIon}-*.{js,css}`).
  - Bản thử, phần lõi + vẽ + giao diện ≈ 20,6 KB gzip.
  - Ngân sách bản thật: **JS ≤ 24 KB gzip, CSS ≤ 4 KB gzip** (hôm nay 17,2 + 3,5).
  - Byte mở app: không đổi. Phông ĐĐH Rounded đã có sẵn trong app học sinh.

## 7. Nghiệm thu đo bằng máy

**Test vitest (tên dự kiến):**
- `tests/dau-ion-v2-loi-3110.test.ts`:
  - tự ngắm: gần nhất, tầm 320, vật che, giữ mục tiêu 25 %;
  - 5 cấp: số viên, nhịp bắn; dây chuyền; nổ lan;
  - electron lên cấp, Xúc tác, Khiên 3 viên;
  - bị hạ: xuống 1 cấp, rơi 3 electron, người hạ +2;
  - hồi Máu; ván 60 giây; xếp hạng;
  - tất định theo hạt giống.
- `tests/dau-ion-v2-goi-3110.test.ts`: mã và đọc ảnh trận mã 3 cho 6 ghế và mọi sự kiện; gói trung bình ≤ 120 byte.
- `tests/dau-ion-v2-phong-3110.test.ts`:
  - ghép sân ≤ 6, vào giữa ván;
  - A.I lấp đủ 4 rồi nhường ghế;
  - ghế vắng không tự bắn;
  - trùng nguyên tố thì đổi màu;
  - `dong` bắt đầu ⇒ đóng 4000; dội gói.
- `tests/dau-ion-v2-man-3110.test.tsx` (jsdom):
  - 0 mạng khi chưa bấm;
  - kéo ở đâu cũng đi; chạm nhanh thì đi tới;
  - `batDau` ⇒ tháo trận, huỷ requestAnimationFrame ngay trong lượt đó.
- Cập nhật có chủ ý: `tests/dau-ion-*-3010.*`, `tests/phong-cho-game-1309.test.ts`.

**Cổng phát hành:**
- `tsc` (app + server);
- `npm run build && npm run kiem:toc-do`: 0 đỏ;
- `npm run kiem:mau-giu`: 0; `npm run check:mau`;
- `node scripts/kiem-sw.mjs`;
- tác tử `toc-do` sau khi gộp.

**Ảnh và khung hình:**
- Ảnh Chromium: 0 lỗi trang, 0 tràn ngang, 0 đích bấm < 44 px. Bản vẽ này đã đạt: `docs/ban-ve-dau-ion-v2-3110/kiem.json`.
- Khung hình, sân 6 nguyên tử, CPU ×4:
  - chế độ thường: trung bình ≥ 45 khung/giây, p95 ≤ 34 ms;
  - máy yếu: 30 khung/giây đều.
  - Đo lại trên bản build bằng `chup.mjs --do`.

## Thay đổi so với hôm nay

| | |
|---|---|
| **Giữ** | Tên «Đấu Nguyên Tử». Phòng DO, vé, mã đóng, lệnh `dong`. Mảnh nạp lười ngoài precache. Chọn nguyên tố, Ẩn tên, Thắng hôm nay (lưu ở máy em). 4 câu phản ứng nhanh (nay chỉ ở bảng hết ván). Không chat, không điểm, không EXP. Chơi với A.I tại máy khi không có mạng. Sân 600 × 600 đơn vị, cùng một sân cho mọi khổ màn |
| **Đổi** | Điều khiển (không nút). Ngắm, bắn (tự động). Số người (≤ 6 + A.I). Vật phẩm (electron, Xúc tác lên cấp, Khiên 3 viên). Súng 5 cấp. Ván 60 giây xoay vòng. Màu khung theo app học sinh, sân nhiều màu. Ảnh trận mã 3. Nguyên tử bán kính 22 → 18. Máu 3 → 10. Đạn 470 → 460 đơn vị/giây |
| **Bỏ** | Hai cần «Di chuyển», «Ngắm · Bắn». Hàng phản ứng nhanh dưới màn trận. Nút «Đấu nhanh» 1–1. Nếu thầy chọn: «Thách» theo tên / số báo danh, «Nhóm 3–4 bạn», «Không nhận lời thách» |

**Từ mới, đề nghị thêm vào bảng từ chuẩn khi build:**
- **Sân đấu**: nơi tối đa 6 bạn chơi.
- **Ván**: 60 giây.
- **Cấp súng**: «Cấp 1»…«Cấp 5». Không dùng «bậc» vì «bậc» đã dành cho Bậc thang của em ở BTVN.
- **Electron**, **Xúc tác**, **Khiên**.

## Thầy quyết

1. **Điều khiển chạm:**
   - (A) kéo ở đâu cũng được + chạm một điểm để đi tới **[đề xuất]**;
   - (B) chỉ chạm để đi tới;
   - (C) chỉ kéo.
2. **Thời lượng ván:** 60 giây **[đề xuất]** · 45 giây · 90 giây.
3. **A.I lấp ghế:** cho đủ 4 **[đề xuất]** · cho đủ 6 · không lấp.
4. **Bị hạ:** súng xuống 1 cấp **[đề xuất]** · về Cấp 1 · giữ nguyên cấp.
5. **Chơi cùng bạn:**
   - tự ghép vào sân còn chỗ; bỏ «Thách theo số báo danh» và «Nhóm 3–4 bạn» **[đề xuất, gọn nhất]**;
   - hoặc thêm ô «Vào sân của bạn: số sân» để rủ bạn ngồi cạnh.
6. **Màu khung game:** theo app học sinh (chàm) **[đề xuất]** · giữ xanh lá dịu của phòng chờ.
7. **Đường ngắm của bạn khác:** hiện mờ **[đề xuất]** · ẩn.
8. **Rung máy khi em trúng đạn** (Android): rung nhẹ 12 ms **[đề xuất]** · tắt.
9. **Âm thanh:** không có **[đề xuất, lớp đang chờ thi]** · có tiếng nhỏ, mặc định tắt.
10. **Tên game:** giữ «Đấu Nguyên Tử» **[đề xuất]** · «Đấu Nguyên Tử · Phản ứng tiến hoá».

Thầy chỉ cần nhắn số + chữ cái (ví dụ «1A 2: 60 3: đủ 4 … chốt build»).

## Bản vẽ (`docs/ban-ve-dau-ion-v2-3110/`)

| Tệp | Nội dung |
|---|---|
| `0-phong-cho-{390,1440}-{sang,toi}.jpg` | Phòng chờ có game: «Đang chờ Thầy bấm bắt đầu» + thẻ Đấu Nguyên Tử |
| `1-sanh-390-{sang,toi}.jpg`, `1-sanh-844-sang.jpg` | Sảnh: ảnh bìa, 5 cấp, nút «Vào sân đấu», chọn nguyên tố |
| `2-tran-{390,844,1440}-{sang,toi}.jpg` | **Trận chính:** 6 bạn, đường ngắm, đạn đang bay, cần nổi dưới ngón (điện thoại) / điểm đến theo chuột (máy tính) |
| `3-nhat-xuc-tac-390-{sang,toi}.jpg` | Nhặt Xúc tác ⇒ lên ngay Cấp 4 |
| `4-len-cap-5-390-toi.jpg` | Nhặt electron cuối ⇒ tiến hoá Cấp 5 |
| `5-trung-ha-390-{toi,sang}.jpg` | Trúng + hạ: bong bóng vỡ, «Hạ!», tin «Em hạ … · Hạ liền N» |
| `6-het-van-{390-sang,844-toi,1440-sang}.jpg` | Hết ván: bảng xếp hạng, đếm ván mới |
| `7-thay-bat-dau-390-sang.jpg` | Thầy bấm bắt đầu ⇒ game dừng, chỉ còn một dòng chữ |
| `8-kich-ban-6-khung.jpg` | Một ván trong 6 khung |
| `9-bang-cap-vat-pham-hieu-ung-{sang,toi}.jpg` | Bảng 5 cấp súng, 4 vật phẩm, 6 hiệu ứng |
| `quay-thu-390-toi.webm` | Quay 13 giây trận thật của bản thử (nền tối) |
| `kiem.json`, `do-khung.json` | Số kiểm ảnh, số đo khung hình |

Chụp lại: `node scripts/ban-ve-dau-ion-v2-3110/chup.mjs` (mọi ảnh dựng tất định qua cửa `window.__dn` của bản thử).

## Tệp dự kiến khi build (bước 4)

- **Lõi chung:**
  - `src/lib/dau-ion/loi.ts`: thay luật, tự ngắm, 5 cấp, vật phẩm, A.I đi;
  - `src/lib/dau-ion/goi.ts`: ảnh trận mã 3.
- **Máy em:**
  - `src/components/phong-cho/DauIon.tsx`: sảnh gọn, màn trận không cần, khung em, xếp hạng;
  - `dau-ion-ve.ts`: lớp vẽ mới, theo bản thử;
  - `dau-ion-tran.ts`: TranAI 6 ghế, TranMang ảnh mã 3;
  - `dau-ion-mang.ts`: giữ;
  - `ban-nguyen-to.css`: biến `--dn-*` pha từ token.
- **Máy chủ:** `server/src/dau-ion-phong.ts` (ghép sân ≤ 6, A.I lấp ghế, ván xoay vòng, ghế vắng). `phong-dau-ion.ts` và `dau-ion-ve.ts` giữ nguyên.
- **Không đụng:** `ExamTakeScreen.tsx` (chỉ giữ đường `batDau` / `onBatDau`), `vite.config.ts`, `wrangler.toml`.
