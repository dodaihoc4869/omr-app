# SỔ VIỆC THẦN THÚ — 16-09-2026

Mọi con số dưới đây đo được, không ước lượng. Chỗ nào chưa xong ghi ở mục E.

---

## A. SÁU CON THÚ NHÌN PHÁT RA NGAY LÀ SÁU CON KHÁC NHAU

**Lỗi gốc, và nó không phải lỗi thẩm mỹ.** Toạ độ mặt và phụ kiện (mắt, mõm,
mỏ phượng, bờm sư tử, vằn hổ, sừng) được viết cho bộ lông dày **0,07**. Bản
15-09 nâng lông lên **0,20 – 0,34** cho "lông lá nhiều hơn". Bộ lông phình ra
tới 1,34 lần bán kính thân, **nuốt trọn** mọi thứ gắn trên da. Ảnh chụp 16-09:
sáu con ra sáu quả trứng xù giống hệt nhau, chỉ khác màu.

**Đã sửa ba chỗ:**

| | Trước | Sau |
|---|---|---|
| Bề dày lông | 0,20 – 0,34 | 0,11 – 0,18, bù lại thêm 1 lớp vỏ mỗi con |
| Mặt, tai, mõm | gắn ở bán kính 1,0 (nằm trong lông) | nhân hệ số `VIEN_LONG = 1 + dayLong × 0,92` — luôn nằm **ngoài** mặt lông |
| Sừng, mào, bờm, vương miện | gắn thẳng vào `dau`, chưa co theo cỡ đầu | khung riêng `dauNgoai`, cùng cỡ mặt lông |

**Và tách nốt cái mặt.** Thân đã ra sáu khung xương từ 15-09, nhưng sáu cái
**mặt** vẫn là một cái mặt gấu bông: cùng mắt tròn to, mũi hồng, miệng cười,
má hồng. Nay có bảng `NET_MAT` sáu kiểu:

| Con | Kiểu mặt | Nét riêng |
|---|---|---|
| Nhiệt Nhôm Triều Dương Phượng | `chim` | mỏ hai mảnh dài 0,94 thay mõm · không tai · mào 5 lông vũ · yếm lông cổ |
| Cường Toan Ngân Hà Kỳ Lân | `huou` | mõm dài thanh · hai sừng xoắn · má hồng · bờm bay |
| Trầm Tủa Vạn Niên Thần Quy | `quy` | mỏ sừng hai mảnh · gờ mày dày · mắt nhỏ sâu · **thêm cổ 3 đốt** (trước đầu bay lơ lửng trên mai) |
| Halogen Cung Đình Thần Long | `rong` | **đồng tử khe dọc** · mõm dài · nanh · râu rồng · **bỏ tai thỏ** (tai tròn trên đầu rồng ra con thỏ) |
| Điện Cực Sơn Lâm Kim Lân | `thu` | bờm **hai vòng kín** quanh đầu, màu lông riêng không phát sáng · nanh · vằn |
| Trùng Hợp Thuỷ Phù Long Thần | `thuy` | đồng tử khe dọc · vây má · mào lá dọc lưng · sừng nhánh |

Phép kiểm `than-thu-3d.test.ts` (18 phép) vẫn xanh: cấp nào cũng dựng được cho
cả sáu con, cấp sau không nghèo đi cấp trước, mốc nào cũng giàu thêm.

---

## B. TÊN SÁU THẦN THÚ — MỘT NỬA HOÁ HỌC, MỘT NỬA THẦN THÚ

Luật đặt tên, và có phép kiểm giữ đúng luật ấy (`ten-than-thu-1609.test.ts`):

* `ten` = **[thuật ngữ Hoá có thật]** + **[tên thần thú]**
* `danhHieu` = **[công thức thật]** + **[danh xưng]**

| Hệ | Tên | Danh hiệu |
|---|---|---|
| Hoả | **Nhiệt Nhôm Triều Dương Phượng** | 2Al + Fe₂O₃ — Hoàn Cầu Thiêu Thiết Hoả Đế |
| Acid | **Cường Toan Ngân Hà Kỳ Lân** | HNO₃ : HCl = 1 : 3 — Hoá Kim Nhất Giác Vương |
| Base | **Trầm Tủa Vạn Niên Thần Quy** | Ba²⁺ + SO₄²⁻ — Lõi Thời Không Bất Tan Đế |
| Khí | **Halogen Cung Đình Thần Long** | F₂ · Cl₂ — Bích Ngọc Cửu Trùng Phệ Kim Long Đế |
| Điện hoá | **Điện Cực Sơn Lâm Kim Lân** | Zn‖Cu²⁺ — Băng Sương Lôi Đình Chi Chủ |
| Hữu cơ | **Trùng Hợp Thuỷ Phù Long Thần** | (–CH₂–CH₂–)ₙ — Quang Sinh Vạn Xích Bất Đoạn |

Sáu bậc tiến hoá của từng con cũng đặt lại cho khớp, ví dụ hệ Khí:
Trứng Halogen → Thanh Long Nhỏ → Bích Ngọc Thanh Long → Phệ Kim Halogen Long →
Cung Đình Cửu Trùng Thần Long → **TỐI THƯỢNG BÍCH NGỌC PHỆ KIM LONG ĐẾ**.

Phép kiểm chặn đúng cái dễ đánh rơi ở lần đổi tên sau: tên nào thiếu nửa Hoá
hoặc thiếu nửa thần thú là đỏ; danh hiệu nào không có công thức thật là đỏ.

---

## C. ÂM SÁU CHƯỞNG TỐI THƯỢNG — ĐO, KHÔNG ĐOÁN

Tôi không nghe được, nên tôi **dựng sóng offline rồi đo**
(`OfflineAudioContext` 44,1 kHz, đo đỉnh, rms, tâm phổ bằng DFT tự viết).

Đo **riêng** tiếng của từng chiêu, không kèm lớp nổ chung:

| Chiêu | Dài (s) | Đỉnh | rms | Tâm phổ (Hz) | Số lớp |
|---|---|---|---|---|---|
| ULTIMATE JADE BLAST (Khí) | 1,68 | 0,68 | 0,113 | 3 193 | 350 |
| GALAXY CROWN LASER (Acid) | 1,70 | 0,62 | 0,119 | 852 | 164 |
| CHRONO-CORE CANON ARRAY (Base) | 1,36 | 0,53 | 0,084 | 260 | 118 |
| SOLAR FLARE ERUPTION (Hoả) | 1,80 | 0,70 | 0,117 | 233 | 243 |
| CHILLING FROST ROAR (Điện hoá) | 1,69 | 0,68 | 0,113 | 187 | 223 |
| BIOLUMINESCENT VORTEX BLAST (Hữu cơ) | 1,71 | 0,64 | 0,148 | 111 | 119 |
| *(đòn thường, để so)* | *0,53* | *0,26* | *0,024* | *237* | *20* |

**Hai lỗi phép đo bắt được, đã sửa:**

1. **GALAXY CROWN LASER yếu hơn cả đòn thường** — đỉnh 0,20 so với 0,26. Một
   chiêu tối thượng mà nhỏ tiếng hơn đòn phổ thông thì đúng là "đơn điệu".
   Đã thêm nền hạ âm + lớp hơi rít, nâng ba lớp: nay 0,62.
2. **ULTIMATE JADE BLAST chỉ có dải cao** nên nghe mỏng (đỉnh 0,45). Thêm một
   lớp hạ âm đi cùng: nay 0,68 — ra khẩu pháo, không phải cái còi.

Kết quả sau khi sửa: chiêu **yếu nhất vẫn to gấp 2,0 lần** đòn thường về đỉnh,
**gấp 3,5 lần** về rms, **dài gấp 2,6 lần**. Tâm phổ trải từ 111 Hz (xoáy nước
trầm) tới 3 193 Hz (tia laze sáng) — **cách nhau 28,9 lần**, hai tiếng gần nhau
nhất còn lệch 11 %.

**Một lỗi nữa, về lúc nào thì kêu.** Bản trước phát tiếng nổ tối thượng cho
**mọi câu đúng**, kể cả khi trùm còn nguyên máu và hình chỉ là đòn thường.
Nghe một buổi là em nhờn tai. Nay: trùm chết mới nổ + tiếng riêng của hệ; còn
lại là tiếng đánh thường. Âm khớp hình.

---

## D. HAI VIỆC LỚN CÒN LẠI ĐÃ LÀM XONG

### D1. Câu có ẢNH và BẢNG hiện ra được trong màn chiến đấu

15-09 mới làm được nửa việc: `cau-hoi-cua-em.ts` thôi vứt câu có ảnh, nhưng
màn đánh **vẫn chỉ in chữ**. Em đọc "Dựa vào đồ thị bên dưới…" mà không có đồ
thị nào bên dưới — buộc phải đoán, rồi cái đoán sai ấy vào sổ như em học kém.

Đã sửa, và bắt thêm hai lỗi trong lúc sửa:

* **Vị trí ảnh bị ép qua `Number()`** → mọi ảnh thành `NaN`, mất sạch vị trí,
  ảnh của phương án bị dồn lên đầu câu. Đúng cái lỗi thầy đã bắt ở màn báo cáo
  ngày 14-09. Nay `viTri` giữ nguyên chuỗi (`sau_de`, `sau_pa_A`, `cuoi_cau`).
* **Phương án chỉ có ảnh, chữ rỗng → vứt cả câu.** Nhiều câu Hoá cho bốn công
  thức cấu tạo bằng ảnh. Nay chấp nhận; thiếu **cả** chữ lẫn ảnh mới bỏ.

Khung hiển thị dùng lại đúng bộ của thẻ câu thi (`QuestionMedia.tsx`), không
nghĩ ra kiểu mới. **Đã soi bằng ảnh chụp thật**: câu đồ thị + bảng số liệu hiện
đủ; câu bốn phương án bằng ảnh hiện bốn ảnh đúng bốn chỗ.
9 phép kiểm trong `anh-bang-vao-game-1609.test.ts`.

### D2. ĐẤU TRƯỜNG CHÂN LÝ — bấm Võ Đài là ra ngay

Tab Võ Đài trước đây là một trang thống kê. Nay bấm vào ra thẳng đấu trường;
kỷ lục cá nhân lùi xuống dưới.

**Bốn cơ chế gốc giữ nguyên:** cửa hàng 5 ô quay theo tỉ lệ tăng dần theo cấp
đội · ba ghép một lên sao (chỉ số ×1,8 mỗi sao) · vàng nền + **lãi** 10 ăn 1
(tối đa 5) + thưởng chuỗi thắng **và** chuỗi thua · đánh tự động, thua mất máu
theo số quân địch sống sót, hết máu bị loại, trụ cuối cùng hạng nhất.

**Một cơ chế thêm, và là lý do game này tồn tại:** trả lời đúng câu Hoá được
+2 vàng. Không học thì không có tiền mua quân.

**Bộ quân:** 24 quân, sáu hệ × bốn bậc giá, mỗi quân là một chất hoặc quá
trình có thật kèm phương trình (Nhiệt Nhôm, Nước Javel, Kết Tủa BaSO₄, Nước
Cường Toan, Pin Zn–Cu, Chuỗi Polymer…).

**Phòng:** tối đa 6 người, mời **bằng số báo danh** đúng như thầy chốt. Ghế
trống để máy lấp nên hai người cũng chơi được ngay.

**Chỗ đáng nói về kỹ thuật:** máy chủ **không xử trận**. Nó chỉ cất đội hình
từng người nộp mỗi vòng; máy em chạy lại cả ván từ vòng 1 bằng một hàm thuần
tất định. Cùng mã phòng thì máy em và máy bạn ra **cùng một bảng hạng** — có
phép kiểm chạy lại 10 lần so chuỗi JSON. Làm thế để khỏi nuôi hai bản luật
(một trên Worker, một trên máy em) rồi sửa cân bằng bên này quên bên kia.

**Chống gian:** máu **không** nhận từ máy em (máu do chạy trận mà ra); đội hình
nộp lên bị cắt còn 6 quân; quân bịa ra bị loại bỏ. Ba điều này đều có phép kiểm.

**Tầng đỏ:** máy chủ **không** trả số báo danh của bạn cùng phòng về máy em —
mỗi người hiện ra bằng biệt danh (tên thần thú). Số báo danh chỉ đi **lên**
máy chủ đúng một chỗ: ô mời. Màn game vẫn không biết em là ai (tám lệnh đi qua
hàm gọi lại do cổng học sinh đóng sẵn số báo danh vào).

**Đã soi bằng ảnh chụp thật:** mở phòng → mã `K7P3` → 6 ghế → mời → bắt đầu →
trả lời câu lấy vàng → mua quân → nộp đội hình → vòng 1 xử xong ("Thắng! Đối
thủ mất 4 máu") → vòng 2 vàng 13, chuỗi thắng 1.

40 phép kiểm trong `dau-truong-chan-ly.test.ts`.

---

## E. CHƯA XONG — MỘT VIỆC, VÀ NÓ CẦN THẦY BẤM

**Đấu Trường chưa lên máy chủ.** Cần hai bước, theo đúng thứ tự:

1. Bấm đúp **`DUNG-BANG-VO-DAI.command`** — dựng hai bảng `vo_dai_phong` và
   `vo_dai_moi` trên D1. Tệp SQL chỉ có `CREATE TABLE IF NOT EXISTS`; bản thân
   tệp `.command` tự soi lại tệp SQL và **từ chối chạy** nếu thấy DROP / ALTER /
   DELETE / UPDATE.
2. Bấm đúp **`DAY-MAY-CHU.command`** — đẩy Worker có tám đường `/vo-dai/*`.
   Tệp này tự chặn nếu đang có ca thi mở.

Chạy ngược thứ tự thì Worker gọi bảng chưa có.

**Vì sao tôi chưa tự chạy:** wrangler trên máy thầy đăng nhập bằng phiên của
Thầy, không dùng được từ phía tôi, nên tôi phải bấm đúp qua Finder — mà lúc
này **một phiên Claude khác đang chiếm Finder và Terminal** (đang chạy
`_phat-hanh.log`, 01:07). Hai lượt đẩy chồng nhau là hỏng cả hai. Thầy bấm hai
tệp ấy, hoặc bảo tôi một tiếng khi phiên kia xong, tôi chạy và đọc kết quả.

Phần app (thú, tên, âm, ảnh–bảng, màn Đấu Trường) đã **commit vào HEAD**
(`939be43`), nên nút phát hành dựng-từ-HEAD sẽ cõng theo đủ.

---

## F. BA ĐIỀU TÔI KHÔNG TỰ KIỂM ĐƯỢC

1. **Khung hình 3D trên điện thoại thật.** Tôi dựng bằng swiftshader, chậm hơn
   máy thật khoảng 20 lần, nên không đo nổi FPS thực. Số lớp lông trên máy cảm
   ứng đã hạ còn 9 (máy bàn 14), nhưng phải có em mở trên iPhone mới biết chắc.
2. **Nghe thật sáu tiếng chưởng.** Tôi chỉ đo được sóng. Các con số ở mục C nói
   rằng sáu tiếng khác nhau và đều mạnh, nhưng "nghe có đã tai không" thì phải
   thầy bật loa.
3. **Tỉ lệ sao thật trong kho đề.** Thang khó của tháp dựa vào `can_chua.sao`.
   Nếu kho còn nhiều câu chưa gắn sao thì tầng cao vẫn ra câu dễ — không phải
   lỗi thuật toán mà là thiếu dữ liệu. Cần một lượt đếm sao trên kho thật.
