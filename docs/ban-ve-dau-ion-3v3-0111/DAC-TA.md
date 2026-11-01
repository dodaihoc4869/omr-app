# Đặc tả + bản vẽ «Đấu Nguyên Tử» 3 đấu 3 — 01/11/2026 (CHƯA DUYỆT)

**Thầy yêu cầu (01/11 tối):** «Game phòng chờ tự phân chia làm 2 phe, ba đấu ba, nhân vật mỗi phe khác màu phân biệt dễ nhất; bắn hiện tại vẫn hơi giật lag làm mượt hẳn nhé. Chế độ tự bắn tự ngắm đối thủ có khoảng cách gần nhất, ko cần đến gần mới tự bắn. Chướng ngại vật thiết kế thông minh hiệu quả cho cả hai phe, chiến thuật hơn. Tự động tạo phe để hs vào phòng chờ bấm vào đấu là chơi đc liên tục, nếu ko đủ thì bot tự tạo đủ, hs xin vào bot tự ẩn đi. Tất cả hs đều phải chơi đc. Vẽ trước tôi xem rồi build nhé.»
Thầy thêm: «Cho màn hình chơi to thoải mái xoay ngang to tràn điện thoại luôn nhé» · «Tối ưu thân thiện nhất để học sinh thực sự có những giây phút giải trí trước bài thi nhé».

> **Lệnh mới THAY lệnh sáng 01/11** (#705, «đừng tự thêm máy ảo, hs thách bao nhiêu thì chơi bấy nhiêu»): từ nay sân luôn đủ 6 ghế, thiếu người thì **A.I** ngồi ghế, em vào là A.I nhường chỗ. A.I luôn ghi rõ «A.I» trước tên.

Nhánh `claude/dau-ion-3v3-0111`. Mã nguyên mẫu đã có trên nhánh (ảnh là bản build thật, Chromium thật); phần mạng / A.I nhường chỗ ở máy chủ / nhiều phòng / mượt hẳn làm ở bước build sau khi thầy duyệt.

## Ảnh bản vẽ (thư mục này, JPG ≤ 150 KB)

| Cảnh | Tệp | Thấy gì |
|---|---|---|
| A · Sảnh | `sanh-390-sang`, `sanh-390-toi`, `sanh-844-sang`, `sanh-1440-sang` | Thẻ game trong phòng chờ: hai phe, MỘT nút lớn «Đấu», dòng luật «3 đấu 3 · thiếu bạn thì A.I vào thay · bạn vào là A.I nhường chỗ» |
| B · Trận (ảnh chính = ngang) | `tran-844-sang`, `tran-844-toi`, `tran-932-sang`, `tran-390-sang`, `tran-1440-sang` | «Phe Bazơ 7 – 5 Phe Axit · 0:42»; phe em bên trái (ngang) / dưới (dọc); em ngắm Quốc Bảo ở XA (đường nét đứt) trong khi Ngọc Trâm GẦN hơn nhưng nấp sau bình cầu ⇒ không bị bắn; hành lang cánh trên Thu Hà đấu A.I Neon |
| Gợi ý lần đầu | `goi-y-dau-844-sang` | «Kéo để chạy · súng tự ngắm, tự bắn» — 3 giây rồi tự tắt, mỗi máy một lần |
| C · Vào thay | `vao-thay-390-sang`, `vao-thay-844-sang` | A.I Sulfur tan thành bong bóng, Gia Huy hiện ở bệ phe Bazơ có khiên 3 giây; dải «Gia Huy vào thay A.I · Phe Bazơ» |
| D · Hết ván + huy hiệu | `het-van-390-sang`, `het-van-844-sang`, `het-van-1440-sang` | «Phe Bazơ thắng 12 – 9», hai cột theo phe, mỗi em một huy hiệu, KHÔNG số thứ hạng, đếm ngược ván mới |
| E · Sơ đồ sân | `so-do-san.jpg` | Căn cứ, tường chắn, hành lang, Xúc tác, Khiên, đường bắn bị chặn (✕ tính bằng đúng hàm `thayNhau` của lõi) |

Chụp lại: `npm run build && node docs/ban-ve-dau-ion-3v3-0111/chup.mjs` (phòng mẫu `phong-3v3.ts` chạy LÕI THẬT trong Node; `kiem.json`: 0 lỗi trang, 0 tràn ngang, 0 đích bấm < 44 px, không lộ số báo danh). Tên đều giả.

---

## 1. Mục tiêu + ai dùng

- **Ai:** học sinh ở phòng chờ thi (trước giờ thầy bấm Bắt đầu), điện thoại là chính, cả máy tính.
- **Cảm giác cần đạt:** bấm «Đấu» là chơi ngay, không chờ ai; thấy rõ phe mình / phe bạn trong nửa giây; vui, dịu mắt, không căng thẳng trước bài thi; thắng thua theo PHE, ai cũng được khen.
- **Không:** không điểm, không EXP, không lưu kết quả lên máy chủ (chỉ «Phe em thắng hôm nay» ở máy em).

### Thân thiện, thư giãn (thầy 01/11)
| Mong muốn | Thiết kế |
|---|---|
| Không cần học luật | Một nút «Đấu». Lần đầu vào sân: gợi ý 3 giây «Kéo để chạy · súng tự ngắm, tự bắn» rồi tự tắt (ảnh `goi-y-dau`). Chỉ MỘT thao tác: kéo ở đâu cũng được (hoặc chạm một điểm để đi tới; máy tính rê chuột / W A S D). |
| Không căng thẳng | Hồi sinh 1,2 giây (cũ 1,5). **Đề xuất: bị hạ KHÔNG tụt cấp súng** (cũ: tụt 1 cấp) — chỉ mất electron đang gom dở; đã làm trong nguyên mẫu. A.I bắn chậm hơn người 25 %. Em mới vào sân (vào thay A.I) có khiên 3 giây; hồi sinh có khiên 1,5 giây. Ván 60 giây. |
| Không bêu ai đứng chót | Hết ván: thắng thua theo PHE; hai cột không số thứ hạng (em đứng đầu cột mình, rồi bạn thật, rồi A.I). Mỗi em THẬT nhận đúng một huy hiệu, chia đều: Xạ thủ (hạ nhiều) · Đồng đội cứu nguy (góp sức hạ) · Nhặt electron giỏi · Bền bỉ (trụ liền lâu nhất) · Bắn trúng nhiều · Súng cấp cao; ai còn lại «Hăng hái». A.I không nhận huy hiệu. Tin «bị hạ» màu xám dịu: «Quốc Bảo hạ em · về bệ sau 1 giây, súng giữ Cấp 3». |
| Vui nhưng dịu mắt | Rung màn nhẹ hơn một nửa (1,5–3 px), loé trắng khi trúng nhẹ hơn, viền đỏ khi em trúng đạn mờ hơn (0,26). Tôn trọng «giảm chuyển động» và máy yếu (giữ cơ chế tự hạ hiện có). Không có âm thanh (nếu thêm sau: mặc định tắt). |
| Ra / vào lúc nào cũng được | «Rời sân» luôn ở góc trái trên; rời là A.I vào lại ghế đó, không phạt. Vào lại bấm «Đấu». |
| Thầy bấm Bắt đầu | **Đề xuất** (chưa vẽ): game dừng NGAY (huỷ vòng vẽ, đóng kết nối — như hiện nay), màn cha vào bài NGAY; chỉ thêm một dải nhẹ «Sắp vào thi · 3 · 2 · 1» chồng lên trong lúc bài đang tải (≤ 1,5 giây, mỗi số 0,5 giây; bài tải xong trước thì bỏ dải). Không làm chậm việc vào thi. |
| Biểu cảm nhanh | Hiện có 4 câu phản ứng ở bảng hết ván (kênh `pu`). **Đề xuất** đổi chữ thành «Hay!» · «Vui quá» · «Cháy!» · «GG» với biểu tượng nét (không emoji, theo chuẩn giao diện). Không bắt buộc. |

## 2. Bố cục

### Luật phe & màu (giấy quỳ)
- **Phe Bazơ** (nhãn OH⁻) = `--dn-tin` (xanh) · **Phe Axit** (nhãn H⁺) = `--dn-sai` (đỏ hồng). Chữ màu phe dùng `--dn-tin-chu` / `--dn-sai-chu` (≥ 4,5 trên thẻ / nền nhạt). Thêm biến `--dn-phe-0/1(-chu, -nhat)` trỏ vào biến có sẵn; `check:mau` và `kiem:mau-giu` sạch.
- **Cả quả nguyên tử tô màu phe**, ký hiệu nguyên tố (em chọn ở sảnh) ở giữa, chữ tối cho đủ tương phản; vòng viền đậm màu phe; **thanh Máu màu phe**; **đạn màu phe**; bệ xuất phát và giá ống chắn căn cứ tô màu phe của căn cứ đó; nửa sân mỗi phe loang nhẹ màu phe.
- **Em:** vòng TRẮNG ngoài (có viền tối mảnh để nổi cả trên sàn sáng) + nhãn đặc màu phe chữ «Em». **Đồng đội / đối thủ:** nhãn sáng, viền + chữ màu phe. **A.I:** «A.I Sulfur», «A.I Neon»…
- **Đối thủ em đang ngắm:** dấu ngắm nhỏ (4 cung) màu phe em + đường ngắm nét đứt chạy từ em tới, kể cả ở xa. **Đối thủ đang ngắm EM:** vạch chấm mờ màu phe họ (biết để nấp). Đường ngắm của người khác không vẽ (đỡ rối).
- Đổi màu phụ cho khỏi lẫn với hai phe: **electron xanh lá** (cũ xanh dương), **5 cấp súng: xám → lục → cam → chàm → vàng** (cũ có xanh, hồng). Biến mới `--dn-e`, `--dn-capm-1…5`; biến cũ giữ nguyên.
- Nền tối: hai màu tách rõ (ảnh `tran-844-toi`). Mù màu đỏ–lục: xanh lam ngọc ↔ hồng vẫn tách theo độ sáng; thêm nhãn OH⁻ / H⁺ và vị trí (phe em luôn trái / dưới) nên không chỉ dựa vào màu.

### Phe em luôn ở trái (ngang) / dưới (dọc)
Lõi và phòng chỉ có MỘT sân 1040 × 520 (Bazơ đầu trái, Axit đầu phải). Máy em đổi toạ độ trước khi vẽ (`dau-ion-xoay.ts`, bốn phép QUAY — không lật gương nên chữ, nòng súng không ngược): em phe Axit ⇒ xoay 180°; điện thoại dọc ⇒ xoay 90° để sân dài theo chiều cao. Hướng kéo / điểm chạm đổi ngược lại trước khi gửi. Sân đối xứng nên hai phe thấy như nhau.

### Trận tràn màn
| Khổ | Sân (đo trên ảnh) | Lớp phủ |
|---|---|---|
| Điện thoại ngang 844 × 390 | 748 × 374 (89 % rộng, 96 % cao) | Một hàng mỏng 34 px: «Rời sân» · tỉ số + đồng hồ · ô của em (Máu, cấp, electron, số hạ) — chỉ đè dải viền trên của sân. Tin nổi giữa dưới. |
| Ngang 932 × 430 | 828 × 414 | như trên |
| Điện thoại dọc 390 × 844 | 367 × 734, sân dựng đứng | Tỉ số ở dải trên, ô của em ở dải dưới (không đè sân); nhắc nhỏ «Xoay ngang điện thoại để chơi to hơn» 6 giây |
| Máy tính 1440 × 900 | 1392 × 696 | Thanh trên + hai cột phe (tên, cấp) dưới sân |

- Vào trận trên điện thoại: xin **toàn màn** + `screen.orientation.lock('landscape')` ngay trong lượt bấm «Đấu» (Android Chrome làm được). iOS không khoá được ⇒ chơi dọc vẫn tràn màn + lời nhắc xoay. Rời sân / thầy bắt đầu ⇒ thoát toàn màn, mở khoá xoay.
- Tôn trọng tai thỏ: mọi lớp phủ và khung sân lùi theo `env(safe-area-inset-*)`.

## 3. Trạng thái

| Trạng thái | Hiện gì |
|---|---|
| Sảnh (chưa nối) | Nút «Đấu» + dòng luật + «Bấm là vào trận ngay · ván 60 giây nối liền». 0 kết nối tới khi bấm (giữ như nay). |
| Đang nối | Nút mờ + chấm nhấp nháy «Đang vào sân đấu…» (thường < 1 giây). |
| Có sân đang đấu | «Đang đấu: 4 bạn + 2 A.I · bấm là vào ngay». |
| Trong trận | Ảnh B. Đồng hồ chạy từ 1:00. |
| Em vào thay A.I / bạn vào thay | Ảnh C: bong bóng ở chỗ A.I, người vào hiện ở bệ phe đó, khiên 3 giây, dải «Gia Huy vào thay A.I · Phe Bazơ» 2 giây. |
| Bạn rời sân | A.I vào lại ghế đó (bong bóng ngược), dải «A.I vào thay Thu Hà». |
| Hết ván (6 giây) | Ảnh D; tự sang ván mới, **chia lại phe cho đều số người thật**; phe em có thể đổi ⇒ sân xoay lại cho phe em vẫn ở trái / dưới, dải «Ván mới · em ở Phe Axit». |
| Mất mạng | Dải nhỏ «Mất kết nối sân đấu — đang thử lại (lần 2)…»; quá 5 lần ⇒ về sảnh, «Đấu» chơi với A.I tại máy (em + 2 A.I đấu 3 A.I). |
| Sảnh tắt / vé hết hạn / bản cũ | «Đấu» chơi với A.I tại máy (`TranAI` đã là 3 đấu 3). |
| Thầy bắt đầu | Dừng ngay, vào bài ngay (mục 1). |

## 4. Dữ liệu

### 4.1 Tự ngắm xa (lõi `src/lib/dau-ion/loi.ts`, đã làm)
- `chonMuc`: đối thủ (khác phe) gần nhất trên **cả sân** (tầm 1200 ≥ đường chéo 1163), còn trên sân, hết khiên hồi sinh, không vắng, **đường bắn không bị vật che** (`thayNhau`); giữ mục tiêu cũ tới khi có đối thủ gần hơn 25 %.
- Mọi đối thủ đều nấp ⇒ không bắn; **nòng vẫn dõi theo đối thủ gần nhất** (`doiTheo`). Đạn bay hết sân (tầm 1180), **xuyên đồng đội** (không trúng, không mất viên); dây chuyền / nổ lan không trúng đồng đội.
- Mô phỏng 200 ván 6 A.I: **0 lần trúng đồng đội**.

### 4.2 Sân chiến thuật 1040 × 520 (toạ độ sân, Bazơ trái) — gương cả hai trục
| Thứ | Toạ độ | Vai trò |
|---|---|---|
| Bình cầu (tròn r 46) | (520, 260) | Chặn đường bắn thẳng từ căn cứ này sang căn cứ kia |
| Bình nón (r 22) | (520, 135), (520, 385) | Tách 2 **hành lang cánh** (rộng 113) khỏi ngõ giữa; khe bình nón–bình cầu 57 (vừa một nguyên tử) |
| Bình nón nhỏ (r 20) | (400, 260), (640, 260) | Chỗ nấp tiến lên ở ngõ giữa |
| Tường chắn căn cứ (giá ống đứng 22 × 120) | x 136–158 và 882–904, y 200–320 | Che **bệ giữa**: vừa hồi sinh không bị bắn thẳng |
| Cốc (44 × 44) | tâm (300, 96), (300, 424), (740, 96), (740, 424) | Chỗ nấp nửa đường hai hành lang cánh |
| Bệ Bazơ | cánh trên (76, 96) · giữa (62, 260) · cánh dưới (76, 424) | Bệ Axit = đối xứng tâm: (964, 424) · (978, 260) · (964, 96) |
| Xúc tác | (520, 58), (520, 462) | Giữa hai hành lang cánh — tranh chấp, cách bệ gần nhất của HAI phe đều 446; hiện cùng lúc cả hai |
| Khiên | (200, 260), (840, 260) | Trước tường chắn mỗi căn cứ (gần nhà, phải bước ra khỏi chỗ nấp) |
| Electron | ngẫu nhiên THEO CẶP đối xứng tâm, mỗi 2 giây, tối đa 12 | Hai phe nhận đúng như nhau |

Thứ tự vật che dọc sân xen kẽ: x 300 (cốc cánh) · 400 (bình nón nhỏ giữa) · 520 (bình nón cánh + bình cầu) · 640 · 740 ⇒ tiến / lùi luôn có chỗ nấp kế tiếp.

**Số đo (bằng chính hàm lõi, lưới 10 đơn vị, 4 223 ô đi được):**
- Đối xứng: 0 vật che / 0 bệ lệch.
- **Không có ô nấp an toàn tuyệt đối:** ô kín nhất (ngay sau tường chắn) vẫn bị 15,7 % sân nhìn thấy; trung vị 48 %.
- Bệ giữa: lộ 0 % với nửa sân đối thủ; bệ cánh: 13,5 %. Không bệ nào thấy bệ đối thủ.
- **Mỗi bệ có lối ra có che** trong ≤ 43 đơn vị (khuất với 3 bệ đối thủ + 5 điểm giữa sân).
- Liên thông 100 % (không có góc kẹt).
- Mô phỏng 200 ván 6 A.I (sau khi sửa thứ tự bước — mục Rủi ro): tổng hạ Bazơ 3 057 · Axit 2 928; thắng 104 / 91 / hoà 5 (trong sai số); trung bình 30 lần hạ mỗi ván (ảnh mẫu 12 – 9 là sát thực tế); 58 % ghế lên Cấp 5, trung vị ở giây 41.

### 4.3 Ghép phe tự động, không bao giờ phải chờ (máy chủ — làm ở bước build)
- Bấm «Đấu» ⇒ phòng chọn sân: sân đang chạy **còn ghế A.I**, ưu tiên sân **nhiều người thật nhất**; vào **phe đang ít người thật hơn** (bằng nhau ⇒ phe đang thua). Em thế chỗ một A.I của phe đó: gói `{t:'thay', cu: idA.I, moi: idEm, ten, phe}`; A.I tan tại chỗ, em hiện ở bệ phe đó (bệ xa đối thủ nhất), khiên 3 giây, giữ nguyên tỉ số phe.
- Không sân nào còn ghế A.I ⇒ mở sân mới **1 em + 5 A.I**, chạy ngay.
- Em rời sân / rớt mạng quá 8 giây ⇒ A.I vào lại đúng ghế đó (`thay` ngược, `ai: 1`).
- Mỗi sân luôn 6 ghế, ván 60 giây nối ván; nghỉ 6 giây; **ván mới chia lại phe**: xếp người thật xen kẽ hai phe (số người thật hai phe lệch ≤ 1), A.I lấp phần còn lại.
- Gom sân: sân chỉ còn 1 em mà sân khác còn ghế A.I và có ≥ 2 người thật ⇒ chuyển em sang lúc hết ván (không cắt giữa ván).
- **Tất cả HS đều chơi được — nhiều phòng:** mỗi phòng (Durable Object) giữ tối đa 78 em (14 sân × 6 ghế = 84 ghế ≥ 80 kết nối). Phòng thứ k đủ 78 ⇒ đóng `4009` kèm lý do `sang:k+1`; máy em tự nối `dau-ion:<mã ca>:<k+1>` (không báo gì cho em), tối đa 8 phòng = 624 em một ca. Không cần D1.
- Dòng ghế `ghe`: `[id, tên, nguyên tố, là A.I (0/1), phe]` (đã làm). Bảng `ket`: `[id, hạ, bị hạ, cấp cao nhất, chuỗi hạ, electron đã nhặt, góp sức, trúng, giây trụ liền]` (đã làm) ⇒ máy em tự tính tỉ số và huy hiệu (`huyHieu` ở lõi).

### 4.4 Gói tin
- **PHIÊN BẢN GIAO THỨC 3** (đã đổi): toạ độ × 50 (sân 1040 vừa 16 bit, sai số 0,02 đơn vị); ảnh trận mã 4. Bước build thêm **mốc thời gian trận** (2 byte, ms trong ván) vào đầu ảnh trận cho kế hoạch mượt (mục dưới).

## 5. Ngoại lệ
- Mất mạng giữa ván: ghế giữ 8 giây (đang chạy như nay), A.I tạm điều khiển ghế đó thay vì đứng im (bước build); quá 8 giây A.I giữ hẳn ghế.
- Bấm «Đấu» liên tục: nút khoá khi đang nối; gói `vao-san` lặp bị bỏ.
- Tên dài: nhãn cắt «…» 16 ký tự (như nay). Ẩn tên ⇒ «Bạn Cl».
- Đổi tab / khoá màn: vòng vẽ ngủ; phòng coi là vắng sau 3 giây (không bị ngắm, không bắn) — như nay.
- Xoay máy giữa trận: đổi khung xoay, vẽ lại nền một lần (đã làm).
- Máy yếu: giữ tự hạ (DPR 1, 30 khung/giây, bỏ quầng / vệt đạn / rung).
- Máy còn bản cũ (giao thức 2): phòng đóng `4010` «Đấu Nguyên Tử đã có bản mới. Em tải lại trang để vào sân nhé.» (cơ chế sẵn có).

### Kế hoạch MƯỢT HẲN + cách đo (bước build)
1. **Phòng bước theo đồng hồ thật:** `setInterval` không đều ⇒ mỗi nhịp đọc `Date.now()`, dồn vào bộ tích luỹ, chạy đủ số bước cố định 1/20 giây (tối đa 4 bước bù), gửi ảnh trận kèm **mốc thời gian trận**.
2. **Máy em nội suy theo dòng thời gian của phòng** (không theo giờ nhận gói): ước lượng lệch đồng hồ (trung vị trượt), vẽ ở `thờiGianPhòng − đệm`; **đệm tự co giãn 100–200 ms** theo độ rung mạng (trung bình + 2 × độ lệch chuẩn khoảng cách gói); thiếu ảnh ⇒ **ngoại suy ngắn ≤ 120 ms** theo vận tốc thay vì đứng hình.
3. **Súng CỦA EM bắn ngay tại máy** đúng nhịp cấp súng khi máy em thấy có mục tiêu lộ (chỉ là hình; phòng vẫn quyết trúng / hạ); loạt phòng gửi về khớp với loạt đã vẽ theo số thứ tự, không vẽ đôi. Trúng ⇒ nháy hiệu ứng ngay tại máy, «−1» chờ phòng xác nhận.
4. Nòng bạn khác quay mượt (đã có làm mềm góc, hạ hệ số 20 → 14); nòng dõi đối thủ gần nhất khi không có mục tiêu.
5. Khớp vị trí em êm hơn: sai số < 6 đơn vị bỏ qua; 6–80 ⇒ kéo dần 10 %/khung (cũ 25 %/gói); > 80 ⇒ nhảy.
- **Đo trước / sau** (bản build thật, Chromium, mạng giả **120 ± 40 ms** chèn ở `routeWebSocket`, 6 ghế, 30 giây, CPU ×1 và ×4): (a) số khung «đứng hình» = khung mà một bạn khác đang di chuyển không nhích quá 80 ms; (b) độ giật nòng = bước nhảy góc nòng > 0,3 rad giữa hai khung; (c) độ giật đạn = viên đạn đổi hướng / nhảy > 12 đơn vị giữa hai khung; (d) trễ từ ý định tới hình em di chuyển. Đạt khi (a) giảm ≥ 80 % và về < 1 %, (b)(c) ≈ 0, (d) ≤ 1 khung. Ghi `do-muot.json`.

## 6. Chi phí máy chủ
- **0 lệnh D1**, như nay (vé ký sẵn khi vào thi). A.I chạy trong Durable Object: 14 sân × 6 ghế, A.I quyết hướng ~5 lần/giây, bước lõi 20 lần/giây. Mô phỏng tại máy: 200 ván 60 giây (6 A.I) chạy trong ~13 giây CPU ⇒ một sân ≈ 1 ms CPU mỗi giây trận; 14 sân ≈ 14 ms/giây — dư xa giới hạn DO. Bước build thêm test đo CPU 14 sân.
- Phòng ngủ khi không còn sân (WebSocket Hibernation như nay); sân toàn A.I (mọi em đã rời) ⇒ đóng ngay, không chạy A.I đấu A.I.
- Băng thông: ảnh trận ~ 70–110 byte × 20 lần/giây / em (như nay). Đáp án / dữ liệu thi không liên quan.

## 7. Nghiệm thu đo bằng máy
- Viết lại test: `tests/dau-ion-3v3-loi.test.ts` (tự ngắm xa, che đường bắn, nòng dõi khi nấp, xuyên đồng đội, đối xứng sân + 0 ô an toàn tuyệt đối, huy hiệu mỗi em một cái, bị hạ không tụt cấp, mô phỏng 200 ván cân hai phe), `dau-ion-3v3-phong.test.ts` (bấm Đấu ⇒ vào sân có ghế A.I, phe ít người thật, `thay`, rời ⇒ A.I vào lại, ván mới chia phe, phòng đầy ⇒ `sang:k+1`), `dau-ion-3v3-goi.test.ts` (giao thức 3, × 50, mốc thời gian), `dau-ion-3v3-man.test.tsx` (nút «Đấu», xoay khung, gợi ý 3 giây, hết ván không thứ hạng), `dau-ion-xoay.test.ts` (4 phép quay ngược / xuôi khớp nhau).
- Hiện trạng nhánh: 23 / 60 test cũ của Đấu Nguyên Tử 2 đỏ — đều do luật mới (sân vuông, mọi người đấu mọi người, nút «Vào sân đấu», dòng ghế 4 cột); thay bằng bộ trên ở bước build.
- `npm run check:mau` 0 · `npm run kiem:mau-giu` 0 (đã chạy) · `npm run build && npm run kiem:toc-do` 0 đỏ · `node scripts/kiem-sw.mjs`.
- Ảnh Chromium (`kiem.json`): 0 lỗi trang · 0 tràn ngang · 0 đích bấm < 44 px · không lộ số báo danh (đã đạt ở bản vẽ).
- Đo mượt: `do-muot.json` đạt ngưỡng mục 5.

## Các tệp sẽ sửa
| Tệp | Bản vẽ (đã có) | Bước build |
|---|---|---|
| `src/lib/dau-ion/loi.ts` | phe, sân mới, tự ngắm xa, xuyên đồng đội, bước hai lượt, huy hiệu, không tụt cấp | chỉnh tham số theo đo |
| `src/lib/dau-ion/goi.ts` | giao thức 3, × 50 | mốc thời gian trận |
| `src/components/phong-cho/dau-ion-xoay.ts` (mới) | xoay khung | — |
| `src/components/phong-cho/dau-ion-ve.ts` | màu phe, vòng Em, nhãn, dấu ngắm, nền | — |
| `src/components/phong-cho/dau-ion-tran.ts` | phe, A.I, `thay`, tỉ số | nội suy theo đồng hồ phòng, đệm co giãn, ngoại suy, súng em bắn tại máy, `thay {cu, moi}` |
| `src/components/phong-cho/DauIon.tsx` | sảnh «Đấu», trận tràn màn, gợi ý, hết ván huy hiệu | dải «Sắp vào thi 3·2·1» |
| `src/components/phong-cho/dau-ion.css` | khối 3v3 đè lên khối cũ | xoá lớp cũ không dùng (cần thầy duyệt vì `kiem:mau-giu` coi là xoá màu) |
| `src/components/phong-cho/dau-ion-mang.ts` | — | tự nối phòng k+1, đo độ rung |
| `src/components/PhongChoGame.tsx` | — | dải 3·2·1 (nếu thầy chọn) |
| `server/src/dau-ion-phong.ts` | dòng ghế + bảng kết quả mới | ghế A.I, ghép phe, `thay`, chia phe ván mới, đồng hồ thật + bộ tích luỹ |
| `server/src/phong-dau-ion.ts`, `server/src/index.ts`, `server/src/dau-ion-ve.ts` | — | nhiều phòng mỗi ca (`dau-ion:<ca>:<k>`) |

## Rủi ro
- **Đổi giao thức (2 → 3):** máy còn mảnh game cũ trong bộ nhớ đệm bị phòng đóng `4010` và được báo tải lại; phát hành Worker và Pages CÙNG lượt.
- **Thứ tự bước lõi làm lệch phe:** bản đầu (mỗi ghế vừa đi vừa bắn) cho Axit thắng 29 / 40 ván trên sân đối xứng — ghế đứng sau ngắm vào vị trí mới hơn. Đã sửa: mọi ghế đi xong mới ngắm / bắn, thứ tự đảo mỗi nhịp ⇒ 104 / 91 / 5. Giữ test mô phỏng 200 ván ở bước build.
- **Tầm ngắm cả sân dễ thành «đứng bắn từ xa»:** đạn bay ~2 giây qua sân nên mục tiêu đang chạy thường né được; vật che dày ở giữa. Theo dõi tỉ lệ trúng khi chơi thật; nếu cần thì đạn xa giảm sát thương (đề xuất, chưa làm).
- **Lớp phủ ở khổ ngang thấp** che dải viền trên của sân (≈ 20 đơn vị); vật phẩm đã lùi khỏi dải đó (Xúc tác y 58).
- **CSS:** khối cũ còn nằm trong `dau-ion.css` để `kiem:mau-giu` sạch; dọn ở bước build khi thầy duyệt.
- **iOS** không cho khoá ngang / toàn màn ⇒ chơi dọc + lời nhắc xoay.
- **Bị hạ không tụt cấp** ⇒ nhiều em Cấp 5 hơn (58 % ghế, trung vị giây 41). Nếu thầy muốn giữ tụt cấp thì đổi một dòng ở lõi.

## Điều cần thầy quyết
1. **Bị hạ không tụt cấp súng** (đề xuất, đã làm trong bản vẽ) — giữ hay trả lại «tụt 1 cấp»?
2. **Dải «Sắp vào thi · 3 · 2 · 1»** (≤ 1,5 giây, chồng lên lúc bài đang tải) — có làm không?
3. **Đổi màu electron (xanh dương → xanh lá) và màu 5 cấp súng** để khỏi lẫn với hai phe — đồng ý?
4. 4 biểu cảm nhanh «Hay! · Vui quá · Cháy! · GG» thay 4 câu cũ — có đổi không?
