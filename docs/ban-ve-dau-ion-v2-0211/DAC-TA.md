# Đặc tả + bản vẽ «Đấu Nguyên Tử v2 — Phòng thí nghiệm kính» · 02/11/2026 · CHỜ THẦY DUYỆT ẢNH (chưa build)

Thầy 02/11: «Làm game 3 đấu 3 phòng chờ thi xuất sắc hơn nữa, đẹp hơn nữa. Vẽ tôi duyệt rồi build».
Nền: bản 3 đấu 3 thầy đã duyệt và đã chạy thật (`docs/ban-ve-dau-ion-3v3-0111/DAC-TA.md`, 01/11).

**Phạm vi:** phần hình (lớp vẽ, lớp phủ, sảnh) + MỘT đổi luật thầy đã chọn 02/11 tối: **bỏ electron rải trên sân** («Bỏ mấy cái chấm xanh … cho đỡ rối mắt»).
Bỏ electron chạm lõi `src/lib/dau-ion/loi.ts` (bỏ rải / nhặt electron, súng lên cấp theo số lần trúng), phòng đấu chạy trong Durable Object (`server/`) và
gói tin ⇒ `PHIEN_BAN` 3 → 4 (máy cũ được báo tải lại như cơ chế sẵn có); test rải electron đối xứng đổi thành test lên cấp theo lần trúng. Còn lại giữ nguyên.
Chỉ đổi lớp vẽ, lớp phủ và sảnh: `src/components/phong-cho/dau-ion-ve.ts`, `DauIon.tsx`, `dau-ion.css`.
Mọi thứ đổi luật chơi đều nằm ở mục «Đề xuất — cần thầy chốt» cuối tệp. Thầy không chốt thì không làm.

## Ảnh duyệt

Ảnh là Chromium thật, chụp bằng `chup.mjs` từ `ve.html`, theo khổ 390 / 844 / 1440, sáng / tối.

| Bảng | Nội dung |
|---|---|
| `bang-1-tran.jpg` | Trận đấu: cũ và mới; ngang sáng / tối, máy yếu, dọc 390, máy tính 1440 |
| `bang-2-sanh.jpg` | Phòng chờ của game (sảnh): 390 sáng / tối, ngang 844, 1440 |
| `bang-3-het-van.jpg` | Hết ván: 844 sáng / tối, 390 |
| `bang-4-goi-y-vao-thay.jpg` | Gợi ý lần đầu 3 giây; bạn vào thay A.I; tinh thể phe em bị bắn |

Ảnh lẻ nằm trong `anh/`. Chụp lại bằng hai lệnh:

```
PW_CHROMIUM=/opt/pw-browsers/chromium node docs/ban-ve-dau-ion-v2-0211/chup.mjs
python3 docs/ban-ve-dau-ion-v2-0211/ghep.py
```

## 1. Mục tiêu + luật đã duyệt 01/11 (giữ nguyên)

- **Mục tiêu:** cùng trò chơi đó nhưng đẹp như một phòng thí nghiệm kính, ăn khớp giao diện Kính của app học sinh. Liếc nửa giây là đọc được ai mạnh, phe nào đang dẫn, ai vừa hạ ai.
- **Giữ nguyên:**
  - **Phe và màu:** Bazơ (OH⁻) dùng `--dn-tin`, Axit (H⁺) dùng `--dn-sai`.
  - **Vị trí phe em:** luôn ở trái khi xoay ngang, ở dưới khi cầm dọc.
  - **Không có:** thứ hạng, EXP, điểm. Chỉ có «Phe em thắng hôm nay» lưu ở máy em.
  - **Nút và lời nhắc:**
    - Một nút «Đấu»; gợi ý lần đầu 3 giây; «Rời sân» ở góc trái trên.
    - Lời nhắc «Xoay ngang điện thoại để chơi to hơn» khi cầm dọc.
  - **Cảm giác:** rung màn nhẹ; hồi sinh 1,2 giây; A.I chậm hơn 25 %.
  - **Hết ván:**
    - Mỗi em thật nhận một huy hiệu.
    - 4 câu phản ứng cũ: Hay đấy! · Suýt nữa! · Đấu lại nhé · Chơi đẹp.
    - Ván mới chia lại phe.
  - **Thầy bấm Bắt đầu:** game dừng ngay và vào bài ngay.
  - **Máy yếu:** tự hạ chất lượng như hiện nay.
- **Màu 5 cấp súng giữ như v1** (`--dn-capm-1…5`: xám → lục → cam → chàm → vàng): tô chấm số cấp trên nhãn tên. Số vòng electron là thêm, không thay màu cấp.
- **Sân giữ đúng toạ độ trong `src/lib/dau-ion/loi.ts`:** `VAT_CAN` (bình cầu giữa, 4 bình nón, 2 giá ống, 4 cốc), `BE_PHE` (3 bệ mỗi phe), `CHO_XT`, `CHO_KH`. Bản vẽ dùng đúng các số này, chỉ thay «da».

## 2. Bố cục 3 khổ

### Trận đấu

| Phần | Mới |
|---|---|
| Sàn | Kính mờ, lưới lục giác rất nhạt. Nửa sân mỗi phe loang màu giấy quỳ; vạch giữa nét đứt. |
| Vật chắn | Dụng cụ vẽ bằng nét (không thêm tệp ảnh): <br>• bình cầu giữa chứa dung dịch xanh lục, nhãn «pH 7» (dung dịch trung tính) <br>• bình nón tím / lục <br>• cốc có mỏ và vạch chia, dung dịch vàng <br>• giá 5 ống nghiệm màu trung tính (dọc màn hình thì giá nằm ngang) <br>Không dùng màu đỏ / xanh để khỏi lẫn với hai phe. |
| Nguyên tử | Quả cầu bóng màu phe, ký hiệu nguyên tố chữ tối ở giữa. **Số vòng electron quay quanh = cấp súng (1–5)**, nhìn là biết bạn mạnh cỡ nào. <br>Em có vòng trắng. Nhãn tên kèm số cấp; thanh máu nhỏ dưới bạn khác, chuyển đỏ khi < 35 %. |
| Đạn | Hạt màu phe, vệt ngắn mờ dần, tia loé khi trúng. Đường ngắm nét đứt từ em tới mục tiêu, kèm dấu ngắm 4 cung (giữ như cũ). |
| Vật phẩm | Xúc tác: lục giác vàng, tia sét. Khiên: lục giác tím (`--tr-hs`), không trùng màu phe. Electron: chấm xanh lục có quầng. |
| Bệ | 3 bệ nét đứt mỗi phe; bệ giữa ghi OH⁻ / H⁺. |

### Lớp phủ trên trận

| Khổ | Bố cục |
|---|---|
| Ngang 844 × 390 | Hàng trên, trái sang phải: <br>• «Rời sân» (kính) <br>• **thanh tỉ số kiểu thang pH**: OH⁻ Bazơ 7 · dải pH đỏ → tím có kim · 5 Axit H⁺; đồng hồ nằm trên kim <br>• thẻ của em: nguyên tử, «Cấp 3», thanh máu, «3/5 electron · hạ 3» <br>Tin «Thu Hà hạ A.I Neon» xếp góc dưới phải, nhỏ, không che sân. |
| Dọc 390 × 844 | Trên: «Rời sân» + thanh pH; tên phe ẩn, giữ nhãn OH⁻ / H⁺. Dưới: thẻ của em. <br>Tin nằm góc dưới trái. Lời nhắc xoay hiện trên mép sân. |
| Máy tính 1440 × 900 | Như khổ ngang; lớp phủ phóng 1,3 lần. |

Thang pH: đầu thang phía phe em là màu của phe em (em Bazơ ⇒ trái = 14 · bazơ tím-xanh, phải = 0 · axit đỏ; em Axit ⇒ ngược lại), khớp nhãn OH⁻ / H⁺ đứng cạnh. Kim theo HOÁ HỌC, không theo «em»: Bazơ dẫn ⇒ pH > 7 ⇒ kim lệch về đầu bazơ, dù em ở phe nào. Hết ván dùng cùng hướng thang.

### Phòng chờ của game (sảnh)

- Thẻ kính lớn gồm:
  - tiêu đề «Đấu Nguyên Tử» và chip «Phe em thắng hôm nay · 2»;
  - **sân thu nhỏ** (ảnh tĩnh vẽ một lần);
  - hàng 6 ghế «3 đấu 3»: em và A.I, ghế A.I mờ;
  - nút «Đấu» lớn có biểu tượng nguyên tử, dòng phụ «vào sân ngay · ván 60 giây»;
  - hai dòng luật ngắn;
  - **chọn nguyên tử dạng ô bảng tuần hoàn**: số hiệu, ký hiệu, tên.
- **Khổ 390:** ô chỉ ghi số hiệu và ký hiệu. Dưới bảng có dòng «Em đang là Clo · Cl».
- **Khổ rộng:** hai cột, sân xem trước bên trái. Khổ ngang thấp (390 px) gọn lại và bỏ hai dòng ca kiểm tra.
- **Nút «Đấu»** dùng quy ước nút của app học sinh: `--tr-hs` / `--tr-hs-nut`, chữ `--tr-hs-tren`. Sáng / tối đều đủ tương phản.

### Hết ván

- Thẻ kính trên trận mờ, gồm:
  - tiêu đề màu phe thắng;
  - dòng «Phe em thắng · em nhận huy hiệu Bền bỉ»;
  - **thang pH lớn** có kim «pH 9 · Bazơ 12 – 9 Axit»;
  - hai thẻ phe: dòng của em có viền; mỗi bạn kèm số liệu và huy hiệu sao vàng;
  - 4 câu phản ứng cũ, mỗi câu có biểu tượng nét (không emoji);
  - vòng đếm 5 giây «Ván mới · máy chia lại phe cho đều»;
  - nút «Về phòng chờ».
- 390: hai phe xếp chồng. Ngang thấp: số liệu nằm cùng dòng với tên.

## 3. Trạng thái

| Trạng thái | Hiện gì |
|---|---|
| Sảnh, chưa nối | Như trên; 0 kết nối tới khi bấm «Đấu» (giữ). |
| Đang nối | Nút «Đấu» mờ, vòng nguyên tử quay, «Đang vào sân đấu…» (giữ chữ cũ). |
| Lần đầu vào sân | Viên kính giữa màn «Kéo để chạy · súng tự ngắm, tự bắn» 3 giây (`goiy-844`). |
| Trong trận | Như mục 2. |
| Bạn vào thay A.I | Bong bóng tan ở chỗ A.I. Người vào hiện ở bệ, có vòng khiên nét đứt 3 giây. <br>Dải kính «Gia Huy vào thay A.I Sulfur · Phe Bazơ» 2 giây (`vaothay-*`). |
| Bạn rời sân | Ngược lại: A.I vào ghế đó, dải «A.I vào thay Thu Hà». |
| Mất mạng | Dải kính nhỏ «Mất kết nối sân đấu — đang thử lại (lần 2)…». Quá 5 lần thì chơi với A.I ngay tại máy (giữ). |
| Sân đầy | Tự sang phòng kế, không báo gì thêm (giữ). |
| Thầy bấm Bắt đầu giữa trận | Dừng ngay: huỷ vòng vẽ, đóng kết nối, vào bài ngay. Dải «Sắp vào thi · 3 · 2 · 1» chỉ hiện trong lúc bài tải (giữ). |
| Hết ván | Như mục 2; vòng đếm 5 giây rồi sang ván mới. |
| Máy yếu | Ảnh `tran-844-sang-yeu`: nguyên tử phẳng, 1 vòng electron đứng yên, đạn là chấm, không vệt, không quầng, không lưới lục giác, không lấp lánh trong bình. |

## 4. Dữ liệu (mọi thứ trên màn tính từ trạng thái sẵn có, không thêm trường nào)

| Hiện | Lấy từ |
|---|---|
| Tỉ số | `BoChay.tiSo()` → OH⁻ (Bazơ), H⁺ (Axit) |
| Số pH + vị trí kim | pH = 7 + 7·(OH⁻ − H⁺)/(OH⁻ + H⁺) (0 – 0 ⇒ 7); 12 – 9 ⇒ pH 8, 7 – 5 ⇒ 8,2. Hiện số làm tròn. Vị trí kim tính từ đầu thang phía phe em: em Bazơ ⇒ (14 − pH)/14; em Axit ⇒ pH/14; kẹp 4–96 %. |
| Số vòng electron | `cap` của từng nguyên tử (đã có trong ảnh trận) |
| Thanh máu | `mau` |
| «trúng 3/5 lên Cấp 4 · hạ 3» | `em()`: bộ đếm trúng (thay `e`), `CAN_E[cap]`, số lần hạ |
| Tin «X hạ Y» | sự kiện `{ t: 'ha', ai, boi, chuoi }` đã có |
| Huy hiệu, số liệu hết ván | `ket()` (giữ như cũ) |
| Ô bảng tuần hoàn | danh sách `NT` 7 nguyên tố sẵn có; số hiệu là hằng tại máy |
| Sân thu nhỏ ở sảnh | vẽ TĨNH một lần (nền sân + 6 nguyên tử đứng yên), 0 vòng vẽ, 0 CPU khi chờ — không chạy lõi ở sảnh |

## 5. Ngoại lệ

- **Tên dài:** cắt «…» 16 ký tự (giữ). Ẩn tên thì hiện «Bạn Cl».
- **Cấp 5 (5 vòng):** vòng ngoài cùng ≤ r + 25 px, không chạm vật chắn khi vẽ. Chỉ là hình, không đổi vùng va chạm.
- **Giảm chuyển động** (`prefers-reduced-motion`): vòng electron đứng yên, bỏ vệt đạn và lấp lánh.
- **Tai thỏ:** lớp phủ lùi theo `env(safe-area-inset-*)` (giữ).
- **Mù màu:** phe phân biệt bằng nhãn OH⁻ / H⁺ và vị trí (trái / dưới), không chỉ bằng màu. Kim pH có nhãn chữ.
- **Màn tối:** mọi chữ trên quả cầu sáng dùng chữ tối. Điểm sáng dùng `--tr-chu`, vì ở chế độ tối `--tr-trang` là màu nền.

## 6. Chi phí máy chủ

**0 lệnh D1** (như nay). Durable Object chạy lõi mới (bỏ electron ⇒ mỗi bước lõi NHẸ hơn: không rải / không xét nhặt); gói tin bỏ mảng electron ⇒ ảnh trận nhỏ hơn.
Sân thu nhỏ ở sảnh là ảnh tĩnh vẽ tại máy, không nối mạng, không chạy lõi.

## 7. Nghiệm thu đo bằng máy

- **Mượt:** chạy `node docs/ban-ve-dau-ion-3v3-0111/do-muot.mjs` (CPU ×4, mạng giả 120 ± 40 ms, 844 × 390, 4 lượt). Ngưỡng:

  | Chỉ số | Ngưỡng (bản v1 đã đo) |
  |---|---|
  | Giật mỗi 20 giây | ≤ 0,25 |
  | p95 khung | ≤ 35,5 ms |
  | Khung tệ nhất | ≤ 49,4 ms |

  Thêm một lượt CPU ×6 có `ddh.mayYeu`: không tệ hơn v1.
- **Cách vẽ để giữ mượt:**
  - nền và dụng cụ vẽ MỘT lần vào canvas phụ (như v1);
  - quả cầu và bộ vòng electron theo từng cấp vẽ sẵn thành ảnh nhỏ, mỗi khung chỉ `drawImage` và xoay;
  - không `shadowBlur`, không tạo gradient trong vòng vẽ;
  - vệt đạn tối đa 6 đoạn mỗi viên; hạt hiệu ứng có trần như v1.
- **Nét căng mọi màn hình (thầy 02/11 «vẽ bằng vector siêu nét»):** mọi thứ vẽ bằng nét vector (canvas path), ảnh vẽ sẵn của nguyên tử / vòng / dụng cụ dựng đúng mật độ điểm của máy (`devicePixelRatio`, tối đa 3) và dựng lại khi đổi màn hình / thu phóng; máy yếu vẫn tự hạ về mật độ 1 như nay.
- **Không thêm tệp ảnh:** precache giữ 170 / 170. Kiểm bằng `node scripts/kiem-sw.mjs`.
- **Tốc độ tải:** `npm run build && npm run kiem:toc-do` 0 đỏ. Game nạp lười nên đường mở app học sinh không đổi byte.
- **Màu:** `npm run check:mau` và `npm run kiem:mau-giu` 0 vi phạm. Chỉ thêm biến `--dn-*` trỏ vào token `--tr-*` có sẵn.
- **Test:** chạy `npx vitest run tests/dau-ion-*` và giữ xanh. Thêm test cho các điểm sau:
  - số vòng = cấp;
  - kim pH theo tỉ số, kẹp trong 4–96 %;
  - tin «hạ» lấy từ sự kiện `ha`;
  - máy yếu: 1 vòng, không vệt.
- **Ảnh app thật sau build:** 3 khổ × sáng / tối. Yêu cầu: 0 lỗi trang, 0 tràn, đích bấm ≥ 44 px, không lộ số báo danh.
- **Sau gộp:** chạy tác tử `toc-do` (luật 27/10).

## LUẬT TINH THỂ (thầy 02/11 tối: «Cho mỗi bên một tinh thể, bên nào tinh thể bị bắn vỡ trước là thua, vừa phải chiến đấu bảo vệ tinh thể vừa phải bắn vỡ tinh thể đối phương») — CẦN THẦY GẬT CÙNG LÚC DUYỆT ẢNH

| Điểm | Đề xuất |
|---|---|
| Vị trí | Mỗi phe một tinh thể ở đầu sân của mình, sau tường giá ống (Bazơ (46, 260), Axit (994, 260) — đối xứng gương như mọi thứ trên sân). Bệ giữa dời ra trước (102 / 938). Bắn từ giữa sân thẳng vào bị giá ống chắn ⇒ phải vòng hai cánh mới bắn được. |
| Máu | Tinh thể 60 máu; mỗi viên đạn phe bạn trúng −1; vòng máu quanh tinh thể + thanh trên cùng (thay thang pH). Dưới 60 % hiện vết nứt. Tinh thể không tự hồi. |
| Thắng / thua | Tinh thể phe nào vỡ trước ⇒ phe kia thắng ngay. Hết giờ mà chưa vỡ ⇒ phe còn nhiều máu tinh thể hơn thắng; bằng ⇒ hoà. Ván dài **90 giây** (60 giây ít khi kịp phá tinh thể). |
| Súng tự ngắm | Ưu tiên bạn phe kia trong tầm (giữ như cũ); không có ai ⇒ tự bắn tinh thể phe kia nếu trong tầm ⇒ em chỉ cần chạy tới gần là bắn tinh thể. |
| Bảo vệ | Tinh thể phe em bị bắn ⇒ dải kính đỏ «Tinh thể phe em đang bị bắn! · còn 38 %» 2 giây + viền màn đỏ mềm (máy yếu: viền mảnh, không loé) — ảnh `bao-*`. |
| A.I | 1 A.I mỗi phe ở lại giữ tinh thể, các A.I khác đi phá tinh thể phe kia (A.I vẫn bắn chậm hơn 25 %). |
| Huy hiệu | Thêm «Phá tinh thể» (bắn trúng tinh thể nhiều nhất) và «Hộ vệ» (hạ / chặn nhiều nhất gần tinh thể phe mình); bỏ «Nhặt electron giỏi». |
| Hết ván | Tiêu đề «Phe Bazơ phá vỡ tinh thể Axit!», hai ô «Tinh thể Bazơ còn 64 %» · «Tinh thể Axit đã vỡ» thay thang pH lớn. |
| Kỹ thuật | Lõi `loi.ts` thêm hai tinh thể (vòng va chạm r 22, đạn chạm ⇒ trừ máu), sự kiện `{t:'tt', phe, mau}` + `{t:'vo', phe}`; phòng (Durable Object) kết thúc ván khi vỡ; gói tin thêm 2 số máu; `PHIEN_BAN` 4 (gộp cùng lượt bỏ electron). Vẫn 0 lệnh D1. |

## Luật lên cấp khi bỏ electron — CẦN THẦY GẬT CÙNG LÚC DUYỆT ẢNH
Em đề xuất: **mỗi lần đạn em trúng đối thủ = +1**; đủ 3 / 5 / 7 / 9 lần (đúng ngưỡng `CAN_E` cũ) thì lên Cấp 2 / 3 / 4 / 5. Bị hạ: giữ cấp, bộ đếm về 0 (như electron cũ).
Xúc tác giữ nguyên (nhặt ⇒ lên một cấp ngay). Huy hiệu «Nhặt electron giỏi» đổi thành «Lên cấp nhanh» (lên Cấp 4 sớm nhất). Thẻ của em ghi «trúng 3/5 lên Cấp 4».

## Đề xuất — cần thầy chốt (KHÔNG nằm trong tầng 1, chưa vẽ thành luật)

1. **Đạn hai phe chạm nhau thì trung hoà** (H⁺ + OH⁻ → H₂O, loé giọt nước). Đúng chất Hoá, nhưng đổi luật, phải sửa lõi + máy chủ + giao thức 4.
2. **Thang pH thật:** pH tính theo tỉ lệ điểm, ghi số pH lên kim trong trận (hiện chỉ ghi ở hết ván).
3. **Hai cột phe dưới sân ở máy tính 1440** (tên, cấp từng bạn). v1 có ghi trong đặc tả; bản vẽ này dồn vào thanh pH cho gọn. Thầy muốn giữ cột thì em thêm.
