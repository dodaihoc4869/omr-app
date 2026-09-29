# ĐỀ XUẤT EXP v5: nạp tự do, không trần ngày, lên cấp theo "ngày đạt" (29/09/2026)

> **TRẠNG THÁI: THẦY ĐÃ CHỐT 29/09/2026** ("build và đẩy luôn") — chốt cả 5 điểm mục 11 theo khuyến nghị: (1) "ngày học" = ngày đạt nhiệm vụ ngày, đếm từ 21/09; (2) ngày nghỉ chung thầy đặt tính là ngày đạt cho mốc cấp (không cộng mảnh); (3) giữ giá shop v4 + khoá bậc 4 cần cấp ≥ 10, bậc 5 cần cấp ≥ 20; (4) khiên 36 mảnh + 2 600 vàng + ngày đạt ≥ 36 + 18(k − 1) cho khiên thứ k; (5) EXP câu game đúng = ½ câu học tập (1–5), mọi câu game đúng đều có.
> Đã build ở nhánh `exp-v5-2909`: hằng số và bảng D/T một nguồn `src/lib/kinh-te-game.ts` (+ `server/src/exp-cau-hinh.ts`); nhận EXP + cổng ngày + EXP tràn + chuyển v4→v5 `src/lib/hap-thu-ngay.ts` (`nhanV5`, `chuyenV4SangV5`); mô phỏng bằng hàm sản phẩm `src/lib/mo-phong-bang-gia-exp.ts`; nghiệm thu `tests/exp-v5-2909.test.ts`.
> Ghi chú build: mảnh tràn cộng thẳng vào `khienRen.manh` của hồ sơ (cùng lần ghi CAS, không thêm dòng sổ `tran_manh`); vàng tràn luỹ kế nằm ở `tranV5.tongVang` và đúc lười qua sổ `vang_so` như vàng thường; giữ `mocVang` của v4 (tương đương `mocVangV5`: vàng đáng đúc liền mạch lúc chuyển). Khoản câu game: `cau_game|<lượt>|<qid>`.
> (Bản gốc: mọi số trong bảng do máy chạy `mo-phong.mjs` ra, 1 300 ngày, 5 hồ sơ.)
> Nền: luật v4 (`docs/DE-XUAT-EXP-2909.md`, lên main sáng 29/09). v5 thay đúng phần thầy yêu cầu, còn lại giữ nguyên.

## 0. Ý chính (một đoạn)
Muốn lên cấp c, thần thú cần **đủ hai thứ**: đủ **EXP** (T(c)) và đủ **ngày đạt nhiệm vụ ngày** (D(c)). EXP thì cày bao nhiêu cũng được, không có trần. Ngày thì không cày nhanh được, vì mỗi ngày chỉ đạt một lần. Vì vậy em chăm và em cày cực nhiều **lên cấp cùng ngày** (cấp 10 ngày 21, cấp 120 ngày 1 200). Phần EXP em cày thêm khi thú đã đầy thanh mà chưa đủ ngày gọi là **EXP tràn**. EXP tràn không mất mà tự đổi thành **vàng và mảnh khiên**, đổi càng nhiều trong ngày thì mỗi EXP được càng ít (lợi suất giảm dần, không có trần). Em trung bình hoặc yếu thiếu EXP hơn là thiếu ngày nên chậm hơn theo đúng sức học.

Vì sao chọn cách này:
- Trần NGÀY (v3) và trần NGUỒN (v4) đều cắt EXP ở một con số, nên em thấy "làm thêm không được gì". Cổng ngày thì không cắt EXP. Mọi câu đúng đều có "+N" và đều vào thú hoặc thành vàng/mảnh.
- Mốc ngày D(c) được chốt bằng công thức, không phụ thuộc giả định về sức học. Nhờ vậy "cấp 10 ≥ ngày 21, cấp 120 ≥ ngày 1 200, khiên ≥ ngày 36" đúng với **mọi** mức cày. Đây là điều mà hiệu chỉnh đường EXP một mình không bảo đảm được.
- Đường EXP T(c) có cùng dáng với D(c) (tỉ lệ S EXP cho mỗi ngày đạt). Vì vậy em nào kiếm ≥ S EXP mỗi ngày đạt thì luôn đi đúng lịch ngày. Em kiếm ít hơn thì đi theo EXP, chậm theo tỉ lệ.

"Ngày học" dùng **ngày đạt nhiệm vụ ngày** (khái niệm đã có, máy chủ đếm, thầy đặt mục tiêu từng em, đang dùng cho mảnh, chuỗi và khiên quà). Không dùng "ngày có ≥ N câu đúng" vì câu game dễ và câu lặp lại giúp lách được. Đếm từ mốc `khien_moc` (21/09) giống khoá mốc v4.

## 1. Công thức đóng
- `p = ln(1200/21) / ln(119/9) ≈ 1,5669`
- **Mốc ngày**: `D(c) = ⌊21 · ((c−1)/9)^p⌋` (D(1) = 0). Ra đúng D(10) = 21, D(120) = 1 200. Cấp đầu cách nhau 1–3 ngày, cấp cuối cách nhau khoảng 15 ngày.
- **Mốc EXP (tổng)**: `T(c) = làmTròn10( S · (21·((c−1)/9)^p − ½) )`, với **S = 570** EXP cho mỗi ngày đạt (T(1) = 0). S = 90% EXP/ngày ổn định của em chăm (636), làm tròn xuống 10. Phần đệm 10% để một ngày kém không làm lệch mốc. Trừ ½ ngày để cấp 2 chỉ cần 100 EXP.
- **Cấp** = cấp c lớn nhất có `EXP trong thú ≥ T(c)` **và** `ngày đạt ≥ D(c)`.
- **Sức chứa**: thú nhận EXP tới `T(cN + 1) − 1`, với cN là cấp cao nhất mà số ngày đạt cho phép (tức thanh đầy, còn thiếu 1 EXP). Phần vượt là **EXP tràn**. Ở cấp 120, mọi EXP đều là EXP tràn.
- Máy chủ và máy em dùng **hai bảng số nguyên viết thẳng** (121 số D, 121 số T) sinh từ công thức, có test khoá. Không tính mũ lúc chạy.

## 2. Bảng mốc
| Cấp | Ngày đạt D | Tổng EXP T | Thanh lên cấp sau |
|---|---|---|---|
| 1 | 0 | 0 | 100 |
| 2 | 0 | 100 | 750 |
| 3 | 1 | 850 | 1 010 |
| 4 | 3 | 1 860 | 1 210 |
| 5 | 5 | 3 070 | 1 410 |
| 6 | 8 | 4 480 | 1 580 |
| 7 | 11 | 6 060 | 1 730 |
| 8 | 14 | 7 790 | 1 880 |
| 9 | 17 | 9 670 | 2 020 |
| **10** | **21** | 11 690 | 2 140 |
| 11 | 24 | 13 830 | 2 280 |
| 12 | 28 | 16 110 | 2 390 |
| 13 | 32 | 18 500 | 2 510 |
| 14 | 37 | 21 010 | 2 620 |
| 15 | 41 | 23 630 | 2 740 |
| 16 | 46 | 26 370 | 2 830 |
| 17 | 51 | 29 200 | 2 940 |
| 18 | 56 | 32 140 | 3 040 |
| 19 | 62 | 35 180 | 3 130 |
| 20 | 67 | 38 310 | 3 230 |
| 30 | 131 | 74 590 | 4 080 |
| 50 | 298 | 170 030 | 5 480 |
| 80 | 631 | 359 690 | 7 170 |
| 100 | 899 | 512 390 | 8 140 |
| **120** | **1 200** | 683 720 | — |
(Tổng tới cấp 10 của v4 là 11 700, của v5 là 11 690, gần như trùng nên chuyển dữ liệu rất êm.)

## 3. Nguồn EXP: bỏ mọi trần ngày
| Nguồn | v4 | v5 |
|---|---|---|
| Câu học tập (I 2/3/5 · II 3/5/8 · III 4/6/10) | đủ tới 2× mục tiêu, sau đó 25%, quá 3× thì 0 | **đủ mọi câu** (bỏ `TRAN_MEM_*`, `TRAN_CUNG_HE_SO`) |
| Khắc phục 30 · lên bậc 6 | ≤ 3 lần · ≤ 10 lần mỗi ngày | **không trần** |
| Game | tổng ≤ 120/ngày; câu thứ 41 trở đi (Huyết Chiến) = 0; tiếp sức ≤ 5 lần | **bỏ cả ba** (Huyết Chiến vẫn không rơi vật phẩm, chỉ rơi EXP) |
| Đạt ngày 80, chuỗi, lô, BTVN, mẹ giao, lên bảng, ca thi | theo lịch | giữ nguyên |
Vẫn giữ luật chống lặp đang có: mỗi câu chỉ có EXP một lần theo khoá sổ, câu được hỗ trợ (gợi ý) = 0.

**EXP mỗi câu ĐÚNG trong game (mới)**, bay "+N EXP" vào thú ngay khi chấm:
| Câu game thường [0/1/2 sao] | Phần I | Phần II | Phần III |
|---|---|---|---|
| EXP | 1 / 2 / 3 | 2 / 3 / 4 | 2 / 3 / 5 |
Bằng khoảng ½ câu học tập, làm tròn lên, vì câu game được ôn lặp lại và dễ hơn. Câu thử thách và câu trùm giữ đủ EXP như câu học tập (luật hiện có), **không** cộng thêm câu thường. Thưởng nấc dạng 10/20/30 và thưởng chặng Đoàn giữ nguyên, cộng thêm vào. Em chăm (30 câu game) được khoảng 74 EXP từ câu, cộng khoảng 50 từ nấc và chặng.

## 4. EXP tràn → vàng + mảnh (lợi suất giảm dần, không trần)
- **Vàng thường**: 1 vàng cho mỗi 5 EXP **vào thú** (như v4, nhưng tính trên EXP vào thú). Đúc theo luỹ kế nên phần lẻ không mất.
- **Vàng tràn** trong một ngày VN: `⌊60 · ln(1 + tràn/300)⌋`. Vài EXP tràn đầu đổi 1 vàng/5 EXP, đến 300 EXP thì chỉ còn nửa giá đó.
- **Mảnh tràn** trong một ngày VN: `⌊log₂(1 + tràn/600)⌋`.
| EXP tràn trong ngày | 100 | 300 | 600 | 1 000 | 1 800 | 3 000 | 5 000 | 10 000 | 20 000 |
|---|---|---|---|---|---|---|---|---|---|
| Vàng | 17 | 41 | 65 | 87 | 116 | 143 | 172 | 212 | 252 |
| Mảnh | 0 | 0 | 1 | 1 | 2 | 2 | 3 | 4 | 5 |
Cách tính giữ tính lặp lại an toàn: máy chủ tính trên **tổng EXP tràn hôm nay**, đúc phần chênh `f(tổng) − đã đúc hôm nay`. Sang ngày mới thì lợi suất tốt trở lại. Không có con số nào chặn cứng.

## 5. Khiên rèn
- Cần **36 mảnh + 2 600 vàng + số ngày đạt ≥ 36 + 18·(k − 1)** cho khiên thứ k. Giữ tối đa 5 khiên chưa dùng (như cũ).
- Mảnh có hai nguồn: +1 cho mỗi ngày đạt (như cũ) và mảnh tràn (mục 4).
- Khiên đầu bị cổng 36 ngày đạt chặn cứng, nên dù cày bao nhiêu cũng không sớm hơn ngày 36. Em chăm có đúng 36 mảnh vào ngày 36. Em cày có thêm mảnh tràn nên rèn khiên sau nhanh hơn, nhưng nhanh nhất cũng cách nhau 18 ngày (em chăm cách nhau 36 ngày).
- 2 600 vàng bằng 60% vàng em chăm có ở ngày 36 (4 459), làm tròn xuống 100. Em vẫn còn khoảng 1 800 vàng để mua đồ.
- Khiên quà tiến hoá cấp 10 (21 ngày đạt) giữ nguyên, vì cấp 10 nay tự nó đã cần 21 ngày.

## 6. Vàng và shop
Vàng tích luỹ theo mô phỏng: xem bảng mục 7. Vàng mỗi ngày (từ ngày 36 đến 365): cày 246 · chăm 123 · TB 63 · yếu 30 · cách quãng 70.
- Em TB vẫn được **63 vàng/ngày, đúng như số dùng để định giá v4**. Vì vậy **giữ nguyên bảng giá v4** (không đổi giá, không làm thiệt em đã mua).
- Em cày được gấp đôi em chăm, không hơn. Tổng 40 món là 32 260 vàng, em cày cần khoảng 131 ngày để mua hết. Nhưng một món bậc 5 (2 210–3 780) thì em cày gom được trong 10–15 ngày. Để đồ hiếm vẫn hiếm, thêm **khoá cấp** (cấp đã bị cổng ngày chặn): **bậc 4 cần thú cấp ≥ 10 (sớm nhất ngày 21), bậc 5 cần cấp ≥ 20 (sớm nhất ngày 67)**. Điều kiện chuỗi và suất của bậc 5 giữ như cũ. Làm bằng trường mới `canCap` trong `phu-kien-danh-muc.ts` (chỉ thêm).

## 7. Mô phỏng 1 300 ngày (ngày 1 = Thứ Hai, không mua đồ)
Giả định:
- **Chăm** (mức bình thường tốt, giống "chăm nhất" v4): mục tiêu 16; mỗi ngày 48 câu đúng (I/II/III = 60/15/25%, sao 0/1/2 = 30/40/30%), 10 lên bậc, 3 khắc phục, 30 câu game và 50 EXP nấc/chặng; đạt mọi ngày; lô T2–T6; BTVN T4 và T7; lên bảng T5; ca thi 10 điểm vào CN.
- **Cày vô hạn**: như chăm nhưng 500 câu học tập, 200 câu game, 30 lên bậc, 10 khắc phục, 2 ca thi và 2 lượt lên bảng mỗi tuần.
- **TB** và **yếu**: như v4 (TB 22 câu, đạt 6/7 ngày, 20 câu game; yếu 10 câu, đạt 4/7 ngày, 10 câu game).
- **Cách quãng**: sức học như chăm nhưng chỉ học 4/7 ngày (T2, T3, T5, T7).

| Hồ sơ | EXP/ngày | Cấp 2 | Cấp 3 | Cấp 5 | **Cấp 10** | Cấp 20 | Cấp 50 | **Cấp 120** | **Khiên 1** | Khiên 2 | Khiên 3 | Vàng n7/21/36/100/365 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Cày vô hạn | 3 494 | 1 | 1 | 5 | **21** | 67 | 298 | **1 200** | **36** | 54 | 72 | 1 875 / 5 366 / 9 241 / 25 467 / 90 305 |
| Chăm | 636 | 1 | 2 | 5 | **21** | 67 | 298 | **1 200** | **36** | 72 | 108 | 874 / 2 595 / 4 459 / 12 374 / 44 901 |
| Trung bình | 313 | 1 | 3 | 10 | 38 | 123 | 544 | 2 185 | 42 | 83 | 125 | 438 / 1 314 / 2 255 / 6 263 / 22 845 |
| Yếu | 152 | 1 | 6 | 20 | 78 | 253 | 1 122 | 4 511 | 86 | 172 | 258 | 215 / 639 / 1 101 / 3 028 / 11 071 |
| Cách quãng 4/7 | 363 | 1 | 2 | 8 | 36 | 116 | 520 | 2 099 | 62 | 125 | 188 | 496 / 1 490 / 2 592 / 7 192 / 25 774 |
(Vàng ở đây là vàng tích luỹ, đã cộng lại phần dùng rèn khiên.)

**Nghiệm thu máy: tất cả ĐẠT.** Cày và chăm đều lên cấp 10 ngày 21, cấp 120 ngày 1 200, khiên đầu ngày 36. Em chăm lên cấp 2 ngày 1, cấp 3 ngày 2, còn mọi cấp khác đúng ngày mốc D(c). TB, yếu và cách quãng đều chậm hơn.
Độ nhạy:
- Em chăm chỉ kiếm 88% EXP: cấp 10 ngày 22, cấp 120 ngày 1 225, khiên đầu vẫn ngày 36.
- Em chăm nghỉ đúng 1 ngày: cấp 10 và khiên đầu cùng lùi 1 ngày. Đúng bản chất cổng ngày: không thể bù ngày nghỉ bằng cách cày.

## 8. Chuyển dữ liệu v4 → v5 (chỉ thêm, không ai tụt)
1. **Giữ nguyên cấp.** EXP trong thanh đổi theo tỉ lệ `⌊exp_cũ / thanhV4(c) · thanhV5(c)⌋`, cùng hàm chuyển v3→v4. Em đang ở cấp cao hơn số ngày cho phép (lên theo đường cũ) vẫn giữ cấp. Cổng ngày chỉ áp cho lần lên cấp tiếp theo.
2. **EXP chờ mốc của v4 (`choMoc`) giữ nguyên trong một ngăn riêng**. Ngăn này đổ vào thú mỗi khi sức chứa tăng. Nó **không** thành EXP tràn và không đúc vàng, vì v4 đã đúc 1/5 vàng trên phần này rồi.
3. **Vàng, mảnh, khiên, đồ đã mua giữ nguyên.** Đặt `mocVangV5` = EXP đã vào thú lúc chuyển, để không đúc vàng hai lần. Mảnh hiện có (tối đa khoảng 9, vì đếm từ 21/09) tính tiếp lên mốc 36. Chưa em nào đủ 21 mảnh nên không ai mất lượt rèn khiên v4.
4. Hồ sơ ghi `luatCap = 5` và `truocV5` (cấp, exp, choMoc, vàng) để lùi được. Hồ sơ là JSON nên chỉ thêm trường, **không cần migration D1**. Sổ `exp_so` và `manh_khien_so` không sửa. Thêm `loai` khoản mới là `cau_game` và `tran_vang`/`tran_manh` (chỉ thêm).

## 9. Rủi ro
- **Tải ghi sổ**: mỗi câu game sinh một khoản. Nên gộp vào cùng batch D1 đang ghi `game_v2_attempt`, máy em chỉ phát hiệu ứng. Không thêm lượt gọi.
- **Em khó hiểu vì sao "đầy thanh mà không lên cấp"**: màn phải nói rõ, có số, ví dụ "Thanh đã đầy. Còn 3 ngày đạt nữa lên cấp 11. EXP thêm hôm nay đổi thành vàng: +41 vàng." Chữ phải soát theo `docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md` (bỏ hết chữ "ống nghiệm", "ăn no").
- **S phụ thuộc giả định em chăm.** Cổng ngày bảo đảm không ai sớm hơn mốc. S chỉ quyết định em chăm vừa đủ có kịp mốc hay không (đã có đệm 10%). Sau 2 tuần nên đo EXP/ngày thật của top 5 em rồi chỉnh S. Đổi S không làm ai tụt cấp.
- **Ngày nghỉ chung của trung tâm (Tết, thi cử)** mà không giao nhiệm vụ thì cả lớp chậm mốc. Xem điểm chốt 2.
- **Game lấn học**: EXP câu game chỉ bằng ½, và cổng ngày dựa trên nhiệm vụ ngày (học tập) nên chơi game không mở được cấp. Nên đo thời gian game của em yếu sau khi phát hành.
- Vàng em cày gấp 2 em chăm. Nếu thầy muốn hẹp hơn thì hạ `B_VANG` (300 → 150).

## 10. Tệp mã sẽ sửa khi build
- `src/lib/kinh-te-game.ts`: `S_EXP_NGAY = 570`, `BANG_NGAY_CAP[121]`, `B_VANG_TRAN = 300`, `B_MANH_TRAN = 600`, `MANH_REN_KHIEN = 36`, `VANG_REN_KHIEN = 2600`, `ngayDatKhien(k)`, `vangTranNgay()`, `manhTranNgay()`; bỏ `CAP_KHOA_MOC` và `NGAY_DAT_MO_CAP_10` (thay bằng bảng D).
- `src/game/than-thu-hoa-hoc/kinh-nghiem.ts`: `BANG_THANH_EXP` v5 (từ T); giữ bảng v4 và v3 để chuyển đổi.
- `src/lib/hap-thu-ngay.ts`: `hapThu` nhận thêm số ngày đạt, tính sức chứa và trả về `{daVao, tran}`; `chuyenV4SangV5`.
- `server/src/exp-cau-hinh.ts`: bỏ `TRAN_MEM_*`, `TRAN_CUNG_HE_SO`, `KHAC_PHUC_TOI_DA_NGAY`, `LEN_BAC_TOI_DA_NGAY`, `TIEP_SUC_TOI_DA_NGAY`; thêm `EXP_CAU_GAME`.
- `server/src/exp-hoc-tap.ts`: bỏ trần câu, khắc phục và lên bậc.
- `server/src/exp-d1.ts`: `congVaoHoSoGame` và `ghiKhoanExpGame` tính sức chứa theo ngày đạt, EXP tràn, đúc vàng thường và vàng/mảnh tràn; bỏ trần game 120.
- `server/src/game-v2.ts` (~440–480): khoản `cau_game` cho mỗi câu đúng không hỗ trợ; bỏ `khongThuong` (Huyết Chiến) cho EXP; trả `expCau` để máy em bay số. `srs2-loi.ts` `duocThuongCauThu` chỉ còn giữ cho vật phẩm.
- `server/src/exp-ho-so-game.ts`: rèn khiên 36 mảnh, 2 600 vàng, cổng `ngayDatKhien(k)`.
- `server/src/cnh-exp-p08*.ts`: `KINH_TE`, `tinhHapThu`, `xetKhien`, `moPhongChuan` theo v5; cập nhật vector `docs/cline-ca-nhan-hoa-2309/MAU-KET-QUA.json`.
- `src/lib/phu-kien-danh-muc.ts`: thêm `canCap` (bậc 4 = 10, bậc 5 = 20); `server/src/game-v2-shop.ts` kiểm `canCap`.
- Màn: `src/game/than-thu-v2/dao/dao-core.ts`, `Game.tsx`, `Doan*.tsx` (hiệu ứng +N mỗi câu và thanh "chờ ngày"), `src/components/bang-nhiem-vu/TheChoAn.tsx`.
- `src/lib/mo-phong-bang-gia-exp.ts`: thay bằng mô phỏng này, chạy bằng hàm sản phẩm.
- Test: `tests/exp-v4-2909.test.ts` → thêm `tests/exp-v5-2909.test.ts` (bảng D/T khoá, nghiệm thu 5 hồ sơ, chuyển v4→v5 không tụt cấp và không mất vàng/mảnh), `tests/exp-hoc-tap-1909`, `tests/phu-kien-danh-muc-2109`.

## 11. Thầy cần chốt
1. **"Ngày học" = ngày đạt nhiệm vụ ngày, đếm từ 21/09.** *Khuyến nghị: đồng ý* (chống lách tốt nhất, trùng khái niệm đang dùng).
2. **Ngày nghỉ chung do thầy đặt có tính là ngày đạt cho mốc cấp không** (không cộng mảnh)? *Khuyến nghị: có*, để Tết không làm cả lớp trễ mốc.
3. **Khoá cấp shop**: bậc 4 cần cấp ≥ 10, bậc 5 cần cấp ≥ 20; giữ nguyên giá v4. *Khuyến nghị: đồng ý.*
4. **Khiên**: 36 mảnh + 2 600 vàng; khiên sau cách nhau ít nhất 18 ngày đạt. *Khuyến nghị: đồng ý.*
5. **EXP câu game bằng ½ câu học tập**; bỏ Huyết Chiến cho EXP (vật phẩm vẫn không rơi). *Khuyến nghị: đồng ý.*
