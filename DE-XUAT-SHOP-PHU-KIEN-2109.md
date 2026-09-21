# ĐỀ XUẤT · Vàng từ EXP thừa + Cửa hàng phụ kiện thần thú (21/09/2026)

Đề bài: `prompt-shop-phu-kien-than-thu-2109.md` (các dòng BOSS CHỐT là quyết định cuối). Mẫu phác: `docs/ban-ve-shop-phu-kien-2109/mau-phac.html` + ảnh `mau-phac-390-toi.jpg`, `mau-phac-390-sang.jpg`.

## 1. Tóm tắt 10 dòng cho thầy

1. EXP thừa trong ống nghiệm đổi được thành **vàng**: 1 EXP = 1 vàng, một chiều, luôn giữ lại 200 EXP (1 ngày ăn) cho thần thú.
2. Vàng chỉ sinh từ việc học; không tặng, không chuyển cho bạn, không tiền thật, không có gì may rủi.
3. **Cửa hàng** mùa 1 có 40 phụ kiện, 5 bậc, giá từ 20 tới 12.000 vàng; phụ kiện chỉ để trang trí.
4. Em chăm (dư 80 EXP/ngày) mua món đầu ở **ngày 3**; món Huyền thoại rẻ nhất ở **ngày 78 ≈ 11 tuần**. Em trung bình: món đầu ngày 8. Em thất thường: 30 ngày chưa có vàng — vàng thưởng sự đều đặn.
5. Huyền thoại = giá + điều kiện học (chuỗi 14–30 ngày, 5 ấn thạch sáng) + 10–30 suất mỗi mùa. Có sẵn nhiều EXP cũng không mua ngay được.
6. Bạn cùng đoàn và Bảng vinh danh NHÌN THẤY phụ kiện; app phụ huynh không có gì; app thầy chỉ một dòng "số em đã mua phụ kiện".
7. Hai đợt: đợt 1 = 24 món ở ba ô không cần neo (hào quang, vệt di chuyển, khung tên); đợt 2 = 16 món ô đầu và cổ/lưng, cần bảng neo 8 loài.
8. Máy chủ giữ sổ chỉ-ghi-thêm, số dư = tổng sổ; máy em chỉ hiện số máy chủ trả.
9. Việc ĐẦU TIÊN của máy chủ: đo phân bố ống nghiệm thật (p50/p90/cao nhất) rồi Boss mới khoá bảng giá.
10. Tắt nhanh bằng cờ `cau_hinh.shop_phu_kien`; ba bảng mới xếp nhóm GIỮ khi reset.

## 2. Kinh tế vàng

**Luật.** Đổi được tối đa = max(0, ống nghiệm − 200), do máy chủ tính. Em kéo thanh chọn số EXP (bước 10), màn ghi dự trữ trước và sau khi đổi; hộp xác nhận: "Thần thú mất X EXP dự trữ, em nhận X vàng. Không đổi ngược lại được."

**Giả định về trần game mới.** Thầy vừa tách trần câu: Đảo 36 câu/ngày, Đoàn Hộ Tống 60 câu/ngày riêng. Nhưng trần EXP game vẫn là 120 EXP/ngày (`TRAN_EXP_GAME_NGAY`), nên thêm câu KHÔNG thêm EXP: em chăm vẫn kiếm 250–290 EXP/ngày, dư 50–90; bảng dùng 80. Nếu sau này nâng trần EXP game (ví dụ lên 200) thì em chăm dư khoảng 160/ngày, Huyền thoại 6.000 chỉ còn 39 ngày (5,6 tuần) ⇒ TRƯỢT; khi đó nhân đôi giá hai bậc Sử thi và Huyền thoại trước khi bật.

**Mô phỏng 30 ngày** (trường hợp xấu nhất: ống nghiệm bắt đầu 0; dồn hết, chưa mua gì; ô ghi "ống nghiệm / vàng đổi được"):

| Mốc | Chăm (dư 80/ngày) | Trung bình (dư 30/ngày) | Thất thường (học đủ 3 ngày/tuần) |
|---|---|---|---|
| Ngày 3 | 240 / 40 | 90 / 0 | 40 / 0 |
| Ngày 7 | 560 / 360 | 210 / 10 | 40 / 0 |
| Ngày 14 | 1.120 / 920 | 420 / 220 | 80 / 0 |
| Ngày 21 | 1.680 / 1.480 | 630 / 430 | 120 / 0 |
| Ngày 30 | 2.400 / 2.200 | 900 / 700 | 160 / 0 |
| Món Thường rẻ nhất (20 vàng) | **ngày 3** | ngày 8 | ngày 36 |
| Món Đẹp rẻ nhất (120) | ngày 4 | ngày 11 | ngày 50 |
| Món Hiếm rẻ nhất (500) | ngày 9 | ngày 24 | ngày 120 |
| Món Sử thi rẻ nhất (1.800) | ngày 25 | ngày 67 | ngoài mùa 1 |
| Món Huyền thoại rẻ nhất (6.000) | **ngày 78 = 11,1 tuần** | ngày 207 | không tới |

Em thất thường: Thứ Hai, Tư, Bảy học đủ (dư 40 mỗi ngày); Thứ Ba, Năm học qua loa (kiếm 80, thú ăn 120 ⇒ dự trữ −40); Thứ Sáu, Chủ nhật nghỉ hẳn (theo luật hấp thụ 200/120/0 thú ăn 0). Ròng +40 EXP/tuần. Biến thể nghỉ hẳn cả bốn ngày (+120/tuần): món đầu ngày 13, ngày 30 có 320 vàng. Em nào đã có sẵn từ 220 EXP trong ống nghiệm thì mua món đầu ngay ngày 1.

**Tự kiểm.** Món đầu của em chăm: ngày 3 (≤ 3) — ĐẠT. Huyền thoại rẻ nhất: 11,1 tuần (trong 8–12) — ĐẠT. Không phải chỉnh giá so với đề bài.

**Vòi vào – cống ra.** 250 em, giả định 20 % chăm, 50 % trung bình, 30 % thất thường: 50 × 560 + 125 × 210 + 75 × 40 = **57.250 vàng/tuần** (mức trần, khi ai cũng đổi hết). Trọn bộ 40 món = 64.210 vàng mỗi em (bỏ Huyền thoại: 19.710). Em chăm cả mùa 16 tuần kiếm 8.760 vàng ≈ 14 % cửa hàng ⇒ phải chọn, không ai mua sạch.

## 3. Bảng giá 5 bậc + 40 món

| Bậc | Giá (vàng) | Số món | Em chăm cần: món rẻ nhất → đắt nhất | Ánh sáng |
|---|---|---|---|---|
| Thường | 20–60 | 12 | ngày 3 → ngày 4 | viền xám bạc, không toả |
| Đẹp | 120–250 | 10 | ngày 4 → ngày 6 | viền lục |
| Hiếm | 500–900 | 8 | ngày 9 → ngày 14 | viền lam, toả nhẹ |
| Sử thi | 1.800–3.000 | 5 | ngày 25 → ngày 40 | viền tím, toả, nhịp thở 4 giây |
| Huyền thoại | 6.000–12.000 | 5 | ngày 78 → ngày 153 | vàng kim, ánh chạy chậm 6 giây |

Hai món 10.000 và 12.000 vượt 16 tuần nếu bắt đầu từ 0 — cố ý dành cho em dư trên 90/ngày hoặc có dự trữ sẵn; Boss quyết lại sau khi đo (mục 8). Điều kiện học: "chuỗi N ngày" = chuỗi ngày ĐẠT nhiệm vụ ngày; "ấn thạch sáng" lấy từ Đoàn Hộ Tống. Tên nguyên tố, chất theo danh pháp 2018.

| # | Tên | Ô gắn | Bậc | Giá | Điều kiện · giới hạn | Mô tả hình cho hoạ sĩ |
|---|---|---|---|---|---|---|
| | **ĐỢT 1 — 24 món** | | | | | |
| 1 | Quầng sáng Hơi nước | Hào quang | Thường | 20 | — | Vòng sương trắng mỏng quanh chân thú, ba giọt nước nhỏ. |
| 2 | Nền Giấy quỳ | Hào quang | Thường | 40 | — | Đĩa tròn dưới chân, nửa đỏ nửa xanh, ranh giới loang mềm. |
| 3 | Hào quang Ngọn lửa Sodium | Hào quang | Đẹp | 150 | — | Quầng vàng cam ấm, năm lưỡi lửa nhỏ lay nhẹ. |
| 4 | Nền Tinh thể Copper(II) sulfate | Hào quang | Đẹp | 220 | — | Cụm tinh thể lam hình thoi mọc quanh bệ. |
| 5 | Hào quang Khí Neon | Hào quang | Hiếm | 600 | — | Vòng ống sáng đỏ cam kiểu đèn neon, sáng dịu rất chậm. |
| 6 | Nền Mạng tinh thể Kim cương | Hào quang | Hiếm | 850 | — | Lưới tứ diện carbon, nút mạng loé sáng. |
| 7 | Hào quang Cực quang Oxygen | Hào quang | Sử thi | 2.400 | Chuỗi 7 ngày | Dải cực quang lục – tím uốn sau lưng thú. |
| 8 | Hào quang Orbital Vàng kim | Hào quang | Huyền thoại | 9.000 | Chuỗi 14 ngày + 5 ấn thạch sáng · 20 suất | Ba quỹ đạo electron vàng kim xoay chậm, hạt nhân sáng sau lưng. |
| 9 | Vệt Bọt khí Carbon dioxide | Vệt di chuyển | Thường | 20 | — | Chuỗi bong bóng tròn nhỏ dần phía sau. |
| 10 | Dấu chân Muối ăn | Vệt di chuyển | Thường | 30 | — | Dấu chân rắc hạt tinh thể lập phương trắng. |
| 11 | Vệt Giọt Phenolphthalein | Vệt di chuyển | Thường | 60 | — | Giọt hồng rơi, loang thành vòng tròn nhạt. |
| 12 | Vệt Lửa Potassium | Vệt di chuyển | Đẹp | 120 | — | Đuôi lửa tím hoa cà mảnh, tàn lửa li ti. |
| 13 | Vệt Lửa Copper | Vệt di chuyển | Đẹp | 200 | — | Đuôi lửa xanh lục, lõi sáng trắng. |
| 14 | Vệt Bụi Magnesium cháy | Vệt di chuyển | Hiếm | 700 | — | Tia sáng trắng chói hình sao bắn ra theo bước chân. |
| 15 | Vệt Sao băng Strontium | Vệt di chuyển | Sử thi | 2.000 | Chuỗi 7 ngày | Dải đỏ tươi dài kiểu sao băng, đầu vệt có đốm sáng. |
| 16 | Vệt Dòng Electron | Vệt di chuyển | Huyền thoại | 7.500 | Chuỗi 21 ngày · 25 suất | Tia sét lam – vàng kim dọc đường đi, kí hiệu e⁻ mờ dần. |
| 17 | Khung Ống nghiệm | Khung tên | Thường | 20 | — | Viền thuỷ tinh bo tròn, hai đầu là miệng ống nghiệm. |
| 18 | Khung Nhãn lọ hoá chất | Khung tên | Thường | 40 | — | Nhãn giấy màu kem, góc có hình thoi cảnh báo nhỏ. |
| 19 | Khung Ô nguyên tố | Khung tên | Thường | 50 | — | Ô bảng tuần hoàn: kí hiệu ở góc, tên thú ở giữa. |
| 20 | Khung Bạc Silver | Khung tên | Đẹp | 180 | — | Viền bạc chải xước, hai đinh tán. |
| 21 | Khung Vòng Benzene | Khung tên | Đẹp | 250 | — | Hai đầu khung là lục giác benzene, nối bằng nét đôi. |
| 22 | Khung Thạch anh tím | Khung tên | Hiếm | 500 | — | Viền tinh thể tím cắt giác, ánh sáng trượt trên cạnh. |
| 23 | Khung Titanium ngũ sắc | Khung tên | Sử thi | 1.800 | — | Kim loại chuyển màu lam – tím – vàng theo góc. |
| 24 | Khung Vàng ròng Gold 999 | Khung tên | Huyền thoại | 6.000 | Chuỗi 14 ngày · 30 suất | Khung vàng kim chạm nổi kí hiệu Au, ánh chạy chậm trái sang phải. |
| | **ĐỢT 2 — 16 món (cần bảng neo)** | | | | | |
| 25 | Kính bảo hộ Phòng thí nghiệm | Đầu | Thường | 30 | — | Kính trong viền xanh đeo trên trán. |
| 26 | Mũ Phễu lọc | Đầu | Thường | 60 | — | Phễu thuỷ tinh úp ngược làm mũ chóp, giấy lọc thò ra. |
| 27 | Nơ Liên kết đôi | Đầu | Đẹp | 140 | — | Nơ hai thanh song song kiểu liên kết đôi, hai đầu là quả cầu. |
| 28 | Mũ Bình cầu | Đầu | Đẹp | 240 | — | Bình cầu nhỏ đội lệch, bên trong dung dịch lam sủi bọt. |
| 29 | Vòng nguyệt quế Copper | Đầu | Hiếm | 550 | — | Lá kim loại đỏ cam, vài lá đã lên gỉ xanh. |
| 30 | Sừng Tinh thể Bismuth | Đầu | Hiếm | 900 | — | Cặp sừng bậc thang vuông ánh cầu vồng. |
| 31 | Mũ miện Thạch anh Silicon dioxide | Đầu | Sử thi | 2.600 | Chuỗi 7 ngày | Miện tinh thể trong suốt năm mũi, lõi phát sáng lam. |
| 32 | Vương miện Bạch kim Platinum | Đầu | Huyền thoại | 12.000 | Chuỗi 30 ngày + 5 ấn thạch sáng · 10 suất | Vương miện trắng bạc bảy chóp, đính kim cương ở giữa, toả tia. |
| 33 | Khăn quàng Giấy lọc | Cổ/lưng | Thường | 30 | — | Khăn trắng gấp nếp, mép loang màu sắc ký. |
| 34 | Vòng cổ Hạt Calcium carbonate | Cổ/lưng | Thường | 50 | — | Chuỗi hạt đá vôi trắng ngà tròn. |
| 35 | Áo choàng Blouse trắng | Cổ/lưng | Đẹp | 160 | — | Áo phòng thí nghiệm ngắn, túi ngực cài ống nhỏ giọt. |
| 36 | Khăn choàng Ngọn lửa Magnesium | Cổ/lưng | Đẹp | 250 | — | Khăn trắng sáng, mép là lưỡi lửa trắng xanh. |
| 37 | Cánh Phân tử Nước | Cổ/lưng | Hiếm | 650 | — | Đôi cánh trong, ghép từ các phân tử nước hình chữ V. |
| 38 | Ba lô Bình khí Helium | Cổ/lưng | Hiếm | 800 | — | Hai bình nhỏ đeo lưng, một quả bóng bay nhỏ bay lên. |
| 39 | Cánh Graphene | Cổ/lưng | Sử thi | 3.000 | Chuỗi 7 ngày | Cánh lưới lục giác mỏng đen ánh lam, mép phát sáng. |
| 40 | Áo choàng Ngân hà Hydrogen | Cổ/lưng | Huyền thoại | 10.000 | Chuỗi 28 ngày · 15 suất | Áo choàng tím than điểm sao, viền vàng kim, sao lấp lánh chậm. |

Đếm: 8 món mỗi ô × 5 ô; Thường 12 · Đẹp 10 · Hiếm 8 · Sử thi 5 · Huyền thoại 5. Hết mùa 1 (hết học kỳ I) món có suất ngừng bán, đồ đã mua giữ mãi. Không giảm giá, không đếm ngược, không mở bán chớp nhoáng.

## 4. Trải nghiệm: 4 màn

Đường vào: nút "Cửa hàng" cạnh Túi đồ trong Đảo thần thú, và thẻ thần thú ở Bảng nhiệm vụ.

**Cửa hàng.** Trên cùng là ví: "Vàng của em: 340 vàng", dòng phụ "Ống nghiệm 620 EXP · Dự trữ đủ 3 ngày ăn". Dưới là khối "Đổi EXP thừa lấy vàng" (thanh kéo, dự trữ trước/sau, nút "Đổi 180 EXP lấy 180 vàng"). Thanh lọc theo ô gắn (Tất cả · Hào quang · Vệt di chuyển · Khung tên · Đầu, Cổ/lưng ghi "Sắp mở"). Lưới 2 cột thẻ món: hình trên nền đêm, bậc, tên, "Giá 600 vàng", khoá điều kiện nói rõ em đang ở đâu, "Còn 12 trong 30 suất". Chạm thẻ = thử.

**Thử đồ.** Thần thú CỦA EM đứng trên bệ sáng (sân khấu luôn là đêm, kể cả giao diện sáng), mặc ngay món vừa chạm, chuyển lớp 220 ms. Mỗi ô thử một món; danh sách "Em đang thử" ghi trạng thái từng món: "Đủ vàng để mua" · "Chưa đủ vàng — còn thiếu 260 vàng" · "Chưa mở điều kiện học". Nút chính "Mua · 120 vàng"; thiếu vàng thì thay bằng nút "Đổi EXP thừa lấy vàng". Có dòng "Bạn cùng đoàn và Bảng vinh danh sẽ thấy đúng như thế này".

**Xác nhận mua.** Tấm phủ một bước: "Em trả 120 vàng, còn lại 220 vàng. Mua rồi không trả lại, không bán lại được." Hai nút "Để sau" và "Mua · 120 vàng". Thành công: số vàng chạy xuống 300 ms, rung nhẹ 18 ms, món tự mặc, dòng "Đã mua … — vàng của em còn 220 vàng". Số mới là số máy chủ trả.

**Tủ đồ.** Năm ô gắn, mỗi ô liệt kê món đã có; chạm để mặc hoặc "Cởi ra". Trống: "Em chưa có phụ kiện nào — ghé Cửa hàng chọn món đầu tiên, có món chỉ 20 vàng."

**Trạng thái chung.** Đang tải: khung xám giữ chỗ đúng kích thước. Lỗi: lời máy chủ + nút "Thử lại". Mất mạng: "Mất mạng — cửa hàng cần mạng để mua", vẫn xem được Tủ đồ lần tải trước. Dưới 200 EXP: khối đổi ghi "Chưa có EXP thừa — thần thú cần giữ 200 EXP để ăn". Cờ tắt: ẩn cả hai đường vào, thú vẫn mặc đồ đã có.

## 5. Hợp đồng máy chủ

**Bảng D1 (migration chỉ-thêm).**
- `vang_so(id INTEGER PK, sbd, loai CHECK IN('doi','mua','hoan'), so_vang INTEGER, exp_tru INTEGER, ma_mon, khoa_yeu_cau, luc, UNIQUE(sbd,khoa_yeu_cau))` + chỉ mục `(sbd)`. Chỉ INSERT. Số dư = `SUM(so_vang)`. `hoan` chỉ dành cho Boss sửa lỗi máy chủ, học sinh không có lệnh hoàn.
- `phu_kien_so_huu(sbd, ma_mon, mua, gia, khoa_yeu_cau, luc, PK(sbd,ma_mon))` + chỉ mục `(ma_mon,mua)` để đếm suất.
- `phu_kien_dang_mac(sbd, o_gan, ma_mon, luc, PK(sbd,o_gan))`.

**Danh mục món để TRONG MÃ**, không để bảng: `src/lib/phu-kien-danh-muc.ts` (hằng `DANH_MUC_PHU_KIEN`, `PHIEN_BAN = 'm1-v1'`, mỗi món có `moBan`), máy chủ và giao diện cùng nhập. Lý do: 40 món đổi theo mùa chứ không theo ngày; giá đi qua soát commit và test khoá; không cần màn quản trị; máy chủ vẫn là nơi quyết giá. Tệp không được dùng `window`/`localStorage` (kiểm thêm `tsc --noEmit -p server`).

**5 lệnh** dưới `/game-v2/…`, xác thực học sinh như các lệnh hiện có (bỏ khỏi mẫu). Lỗi luôn dạng `{"ok":false,"ma":"…","loi":"<lời tiếng Việt hiện thẳng lên màn>"}`.

1. `vang-xem` — vào `{}` · ra `{"ok":true,"bat":true,"vang":340,"ongNghiem":620,"giuLai":200,"doiToiDa":420,"ngayAn":3,"chuoiNgay":9,"anThachSang":3,"mua":"m1"}`
2. `vang-doi` — vào `{"soExp":180,"khoaYeuCau":"doi-7f3a"}` · ra `{"ok":true,"daDoi":180,"vang":520,"ongNghiem":440,"ngayAn":2,"lapLai":false}` · lỗi `duoi_nguong`: "Thần thú cần giữ lại 200 EXP để ăn. Em đổi được tối đa 420 EXP."
3. `shop-danh-sach` — vào `{}` · ra `{"ok":true,"phienBan":"m1-v1","vang":340,"mon":[{"ma":"KT-08","gia":6000,"daCo":false,"dangMac":false,"moKhoa":false,"thieu":"Cần chuỗi 14 ngày (em đang chuỗi 9 ngày)","suatCon":12,"suatTong":30}]}`
4. `shop-mua` — vào `{"maMon":"VD-04","giaThay":120,"khoaYeuCau":"mua-91c2"}` · ra `{"ok":true,"maMon":"VD-04","vang":220,"daMac":true,"lapLai":false}` · lỗi `thieu_vang` "Chưa đủ vàng — còn thiếu 260 vàng." · `chua_mo` · `het_suat` "Món này đã hết suất của mùa 1." · `da_co` · `gia_doi` "Giá vừa thay đổi, em xem lại rồi mua nhé." · `tam_dong` "Cửa hàng đang tạm đóng."
5. `thu-mac-do` — vào `{"oGan":"vet","maMon":"VD-04"}` (`maMon:null` = cởi) · ra `{"ok":true,"dangMac":{"hao-quang":null,"vet":"VD-04","khung":"KT-03","dau":null,"co-lung":null}}` · lỗi `chua_co`.

**Idempotent.** `khoaYeuCau` do máy em sinh một lần cho mỗi lần bấm; gọi lại cùng khoá ⇒ trả đúng kết quả cũ, `lapLai:true`, không ghi thêm.

**Nguyên tử.** Ống nghiệm là `wallet` trong `game_v2_profile.json` (khoá lạc quan `revision`). `vang-doi` = MỘT `DB.batch`: (a) `UPDATE game_v2_profile SET json=?,revision=revision+1 WHERE sbd=? AND revision=? AND NOT EXISTS(khoá đã có trong vang_so)`; (b) `INSERT OR IGNORE INTO vang_so … SELECT … WHERE EXISTS(hồ sơ đang ở revision+1)`. Hai dòng cùng đổi hoặc cùng không; không đổi ⇒ đọc lại, thử tối đa 3 lần. `exp_tru` ghi ngay trên dòng `vang_so`, không ghi vào `exp_so`. `shop-mua` = MỘT batch: (a) `INSERT OR IGNORE INTO phu_kien_so_huu … SELECT … WHERE SUM(vang_so) >= giá AND COUNT(suất đã bán) < giới hạn`; (b) `INSERT OR IGNORE INTO vang_so(−giá) … WHERE EXISTS(dòng sở hữu mang đúng khoá)`. Điều kiện học đọc bằng đúng nguồn đang hiện cho em: `chuoiDat` của kế hoạch ngày và `anChoSanh` (`game-v2-doan-an.ts`).

**Bạn bè nhìn thấy.** Thêm trường chỉ-thêm `phuKien:{<ô gắn>:<mã món>}` vào thẻ thần thú Bảng nhiệm vụ, sảnh + trận Đoàn, Bảng vinh danh. Đọc cho cả đoàn bằng một truy vấn `WHERE sbd IN (SELECT value FROM json_each(?))` — D1 giới hạn 100 tham số bind và 5 vế mỗi UNION. App thầy: một lệnh `/gv/*` chỉ đọc trả "số em đã mua phụ kiện".

**Reset + cờ.** Thêm ba bảng vào `BANG_GIU` của `server/src/reset-toan-app.ts` + test phân loại (vàng và đồ là tài sản em đã kiếm; `game_v2_profile` bị xoá không ảnh hưởng vì EXP đã trừ xong). Cờ `cau_hinh.shop_phu_kien = {"bat":true,"chiSbd":[…]}`: vắng hoặc `bat:false` ⇒ bốn lệnh ghi/xem shop trả `tam_dong`, `phuKien` vẫn trả để đồ đã mua không biến mất.

## 6. Mỹ thuật

- **Quy cách.** Lớp phủ trên thú: SVG `viewBox 0 0 256 256`; vệt di chuyển `0 0 256 96`; khung tên làm bằng CSS + token, không cần tệp hình. Mỗi tệp ≤ 6 KB sau SVGO, ≤ 40 nút; không `<image>`, không chữ; bậc Thường–Hiếm không dùng `<filter>`. Màu qua biến `--pk-1…--pk-3` khai ở tệp token của game, không hex trong TSX. Không vẽ lại sprite thú.
- **5 điểm neo** mỗi loài × giai đoạn (`src/game/than-thu-v2/phu-kien-neo.ts`): `dau` (đỉnh đầu), `co` (gáy), `lung` (giữa lưng), `chan` (điểm chạm đất — hào quang và vệt), `ten` (dưới chân — khung tên). Mỗi neo `{x, y}` theo tỉ lệ 0–1 của khung sprite, kèm `goc`, `tiLe`, `truocSau`. Đợt 1 chỉ dùng `chan`, `ten` = tâm đáy khung nên CHƯA cần bảng theo loài.
- **Ánh sáng theo bậc** như bảng mục 3; ánh chạy làm bằng `transform` (không `background-position`); tối đa 3 chuyển động cùng lúc trên một thú; trong trận Đoàn (nhiều thú) vẽ bản TĨNH; thẻ món không dùng `backdrop-filter`; "giảm chuyển động" ⇒ tĩnh hết.
- **Dung lượng.** Gói mã shop ≤ 60 KB gzip, nạp lười; hình nạp khi thẻ vào khung nhìn; tổng hình đợt 1 ≤ 120 KB, đợt 2 ≤ 100 KB.

## 7. Kế hoạch build 3 làn

**Làn A · máy chủ (Code 3).** A0 lệnh chỉ đọc đo p50/p90/cao nhất ống nghiệm ⇒ Boss khoá giá. A1 migration 3 bảng + `BANG_GIU` + test phân loại + cờ mặc định TẮT. A2 danh mục + `vang-xem`, `vang-doi` + test bấm đúp/đua. A3 `shop-danh-sach`, `shop-mua`, `thu-mac-do` + test hết suất khi hai em cùng mua. A4 trường `phuKien` ở ba nơi + dòng thống kê cho thầy. A5 đẩy Worker, gọi thử MỌI lệnh bị chạm trên D1 thật, bật `chiSbd` cho một em thử rồi mới toàn bộ.

**Làn B · giao diện game học sinh (Code 2).** B1 token 5 bậc + khung 4 màn chạy dữ liệu giả đúng hợp đồng mục 5 (không chờ máy chủ). B2 Cửa hàng + ví + khối đổi. B3 Thử đồ + Xác nhận mua + Tủ đồ, đủ 5 trạng thái. B4 thành phần vẽ thú kèm phụ kiện, gắn vào Bảng nhiệm vụ, Đảo, Đoàn, Bảng vinh danh. B5 nối lệnh thật — **CẦN A5 đã sống** — chụp 360/390 sáng + tối. B6 đẩy Pages từ worktree sạch.

**Làn C · mỹ thuật SVG + bảng neo (Code 4 hoặc Code 1).** C1 quy cách + 3 món mẫu mỗi ô, Boss duyệt nét. C2 đủ 24 món đợt 1. C3 bảng neo 8 loài × giai đoạn + trang soi neo. C4 16 món đợt 2. C5 đo dung lượng và khung hình trên Android 360.

**Thứ tự lên sóng** (luật: máy chủ TRƯỚC, giao diện sau). Đợt 1: A5 → B6, cần C2. Đợt 2: Worker bật `moBan` cho 16 món → Pages, cần C3 + C4. A0–A4, B1–B4, C1–C2 chạy song song ngay.

## 8. Rủi ro + cờ tắt nhanh

- **Số dư lớn sau chuyển đổi 21/09.** Nhiều em đang có sẵn ống nghiệm lớn ⇒ tuần đầu có thể mua sạch bậc Thường–Hiếm. Vì vậy A0 đo thật trước khi khoá giá; nếu p90 trên 3.000, Boss chọn nâng giá ba bậc giữa hoặc chỉ cho đổi EXP kiếm SAU ngày mở cửa hàng. Huyền thoại luôn kèm điều kiện học + suất nên không bị mua ngay.
- **Em đổi hết rồi thú đói.** Đã chặn bằng mức giữ 200 EXP và dòng "Dự trữ còn N ngày ăn".
- **Hai món đỉnh không ai tới.** Cuối mùa Boss xem số đã bán; mùa 2 đổi giới hạn, không giảm giá giữa mùa.
- **So bì, xin xỏ.** Không tặng, không chuyển vàng, không bảng xếp hạng vàng.
- **Lệch sổ.** Số dư chỉ là tổng sổ; mọi ghi trong batch nguyên tử; máy em không lưu số dư, không tự trừ.
- **Rà cấm.** 0 cơ chế ngẫu nhiên trả thưởng · 0 chỗ phụ kiện cộng chỉ số, EXP, vé hay thứ hạng · 0 chỗ máy em tự tính số dư.
- **Cờ tắt** `cau_hinh.shop_phu_kien`: đặt `{"bat":false}` ⇒ đóng cửa hàng trong một lượt tải, không cần đẩy mã; vàng và đồ đã mua còn nguyên.
