# ĐẶC TẢ BUILD — OMNI BẢN 3: "TICK BÀI → TỰ LUYỆN → CHỨNG CHỈ SẴN SÀNG 8+ → THẦY CHỈ CHỮA BƯỚC CUỐI"

Soạn 05/10/2026 · **Bản chốt để build một lần.** Gộp ba tệp: `DE-XUAT-KET-HOP-ALCHEMY-OMNI-0510.md` (bản 2), `prompt-tick-bai-tu-giao.md`, `NGHIEN-CUU-THAU-HIEU-VA-CHAC-8-0510.md` (bản 3). Chỗ nào ba tệp nói khác nhau thì **tệp này thắng**. Hình minh hoạ: `docs/omni-0510/*.jpg` (8 màn). Mô phỏng kiểm chứng: `docs/omni-0510/mo-phong-chac-8.mjs` (chạy 5 giây, tất định).

Thầy gõ `HÃY THỰC THI PROMPT NÀY` ⇒ build theo thứ tự mục 8, mỗi giai đoạn qua cổng mới sang giai đoạn sau.

---

## 0. KẾT QUẢ CUỐI CÙNG PHẢI ĐẠT (định nghĩa đo được)

**Với lượng kiến thức đã phân (các bài thầy đã tick), mỗi em nhận "Chứng chỉ Sẵn sàng 8+" của bài khi và chỉ khi cả bốn điều cùng đúng:**

| # | Điều kiện | Ngưỡng | Vì sao ngưỡng này |
|---|---|---|---|
| K | **Kiến thức**: P mọi vi kỹ năng của bài ≥ ngưỡng; ý Đúng–sai tính theo ý | **0,95** (ý Đúng–sai 0,95) | Mô phỏng (1b): P 0,90 chỉ cho 65 % cơ hội đạt 8; P 0,95 cho 90 % khi sơ ý 5 % |
| C | **Cẩn thận**: tỉ lệ sơ ý riêng của em (sai khi mọi kỹ năng cần đã vững) | **S_em ≤ 0,07** | Mô phỏng (1): nắm hết kỹ năng mà sơ ý 10 % ⇒ chỉ 88 % cơ hội đạt 8; 8 % ⇒ 95 %; 6 % ⇒ 99 % |
| M | **Mô hình**: xác suất điểm ≥ 8 trên đề 18 + 4 + 6 trong phạm vi bài (PMF tích chập, dùng P và S_em) | **≥ 0,90** | Biên an toàn cho mọi đề cùng khung |
| T | **Thực nghiệm**: ca chốt 28 câu **chưa gặp** đúng khung thi, 50 phút | **≥ 8,0** | Chống "vững ảo" do nhớ khuôn |

Chữ hiện: "Bài 6 · Sẵn sàng 8+ · độ tin 92 % · kiểm bằng 28 câu lạ ngày 12/10". **Không bao giờ hiện 100 %.** Chưa đạt ⇒ "Còn thiếu: … · ước N ngày theo nhịp của em" và kế hoạch kéo dài riêng; hạn lớp không đổi; chuẩn không hạ.

**Thầy chỉ còn một việc**: danh sách **"Cần thầy chữa"** trên Bảng bài (hình `GV-BangBai.jpg`), gồm ba loại: (1) vi kỹ năng có thẻ nút thắt (em đã qua thang tự gỡ mà vẫn vướng), (2) câu sai ≥ 4 lần đã rời kế hoạch, (3) em sơ ý cao (S_em > 0,09) dù kiến thức vững. Bấm "Chữa xong" ⇒ câu quay lại Đoàn hôm sau, đếm sai về 0 (đường `srs2_day_lai` đã có).

### 0.1 Số liệu mô phỏng làm căn cứ (chạy 05/10, 80 em/ô, thể lực 40, 36 vi kỹ năng, học thật T = 0,20)

| Sơ ý thật của em | Kiến thức xuất phát | Trung vị ngày đạt chứng chỉ | Đạt ≤ 7 ngày | Khai oan (P thật < 0,80 lúc cấp) |
|---|---|---|---|---|
| 3 % (cẩn thận) | Giỏi → Yếu | 3 → 4 | 100 % | 0–3 % |
| 6 % (thường) | Giỏi → Yếu | 3 → 5 | 99 → 91 % | 1–6 % |
| 10 % (sơ ý) | Giỏi → Yếu | 4 → 5 nhưng chỉ 26–41 % em từng đạt | 26–41 % | **14–28 %** |

Hai kết luận không thể bỏ: (a) **sơ ý là nút cổ chai**, không phải kiến thức — nên "Cẩn thận" là chương trình bắt buộc (mục 4.6), và chứng chỉ phải có điều kiện C; (b) ngày đạt trong mô phỏng là **lạc quan** vì giả định học thật T = 0,20 mỗi lượt và ma trận Q đúng; thực tế em yếu sẽ cần nhiều ngày hơn — vì thế thời gian là biến số.

---

## 1. MỘT VÒNG THUẬT TOÁN (từ tick tới chứng chỉ) — 12 bước

1. **Tick** (app thầy, hình `GV-TickBai.jpg`): thầy chọn lớp, tích Bài N trên cây DẠY HỌC. Máy ghi phạm vi đã dạy = Bài 1..N, tạo chiến dịch bài với hạn 7–14 ngày tự tính theo lượt cần của em trung vị (tiêu chí 80 % sức chứa), thể lực theo lớp, rải đều, ghi `learner_scope` taught. Dòng xác nhận hiện số: câu, hạn, lượt cần/sức chứa, số em đủ lượt luyện hết, số em đủ lượt để ca chốt ≥ 8, em quá tải.
2. **Đêm 00:01** (cron): phát lại sổ `su_kien_hoc` từng em ⇒ P vi kỹ năng (cập nhật Bayes hội, mục 4.1), S_em (mục 4.2), tốc độ τ_em và cường độ câu β_j (4.3), FSRS 4 mức (4.5), SPRT ba trạng thái (4.4), dự báo điểm ca chốt và điểm thi + con đường 8 rẻ nhất (5.2), hồ sơ mệt theo khung giờ (4.7), trọng số dạng cho kế hoạch.
3. **Em mở app** lần đầu trong ngày ⇒ **kế hoạch ngày chốt** (`lapKeHoachNgay`, nhiều chiến dịch): nợ đến lịch ≤ 50 % → câu mới theo quota EDF, xếp theo điểm còn lấy được × độ tăng P kỳ vọng × fit, ưu tiên vùng P(đúng) 0,75–0,90 → củng cố → duy trì ≤ 20 % → ôn bài cũ theo vi kỹ năng yếu ≤ 20 %. Vi kỹ năng P < 0,4 ⇒ Ví dụ minh hoạ có câu kiểm đi trước. Thể lực = thể lực lớp, hoặc phút/ngày của em nếu thầy chốt điều 8 bản 2. Khung giờ "mệt" của em ⇒ đổi thứ tự + đề nghị dời câu mới khó, em quyết.
4. **Mỗi câu** (Đảo/Đoàn): máy em gửi `answer` + `msLam` + `tuTin` (Chắc/Chưa chắc). Máy chủ chấm, ghi sổ (ket_qua, assistance, mili_giay, tu_tin), nhãn tốc độ (trôi chảy / bình thường / chậm / lướt), cập nhật P vi kỹ năng và S_em ngay, EXP như luật v5.
5. **Phản hồi theo trạng thái** (hình `HS-KetQua-DungNhungCham.jpg`): chắc-mà-sai ⇒ lời giải chủ động + câu kiểm; đúng-chưa-chắc ⇒ hẹn sớm, không tính vững; đúng-chậm ⇒ "chưa tính vững, mai gặp câu tương tự"; sai-quá-nhanh ⇒ lướt (≤ 3/ngày); sai ⇒ hẹn mai bằng song sinh.
6. **3 câu sai liền** (hình `HS-TramHoiPhuc.jpg`): giao K của ba câu, vi kỹ năng P thấp nhất là tên lỗi ⇒ 3 câu nền theo nhãn, không trừ Máu, ải kế hạ 1 bậc. Không có giao ⇒ câu nền của câu cuối.
7. **Hết kế hoạch ngày**: Rương, đạt ngày, chuỗi; thẻ "Hôm nay em tiến thêm gì" + Nhật ký 3 dòng (hình `HS-CuoiNgay-ChungChi.jpg`); Thử sức thêm; vé thử thách 2/tuần.
8. **Ngày 4–5**: 40 % lượt là câu bài cũ cùng chương trộn vào. **Ngày 6**: đề thử nửa 14 câu lạ, 25 phút, đồng hồ thật, chỉ đo. Dạng/vi kỹ năng đạt SPRT "vững" + điều kiện bằng chứng ⇒ câu mới dư thành Thử sức thêm; quota giảm.
9. **Thầy giữa chiến dịch** (hình `GV-BangBai.jpg`): lưới em × dạng tô theo P kèm số câu; cột Sơ ý; cột Khoảng cách tới 8 (chỉ thầy tới khi đủ 3 ca chốt và sai số ≤ 0,6); kiểm tra đầu giờ / lên bảng Đạt ⇒ thành thạo ngay (đã có); nút xác nhận dạng (+2,08 SPRT / mở đợt dạy lại), ghi sổ nguồn `thay_xac_nhan`.
10. **Hết hạn bài**: Buổi chữa xếp sẵn (điểm chữa = số em chưa vững + 2 × cần dạy lại + điểm còn lấy được); **ca chốt** 28 câu: nửa song sinh câu bài, nửa câu chưa gặp cùng ô từ TU LUYỆN, 50 phút; kết quả ⇒ chứng chỉ (K, C, M, T) hoặc kế hoạch kéo dài riêng; câu chưa thành thạo ⇒ nợ cũ, câu thành thạo ⇒ duy trì FSRS.
11. **Thầy tick bài mới**: hai bài song song, hạn riêng, thể lực chung (EDF). **Không tick**: chế độ chờ — thể lực 60 % (sàn 12), nợ → duy trì ≤ 50 % → ôn bài cũ theo vi kỹ năng yếu; nhắc thầy từ ngày chờ thứ 3.
12. **Đêm Thứ Hai hằng tuần** (`tu-hoan-thien.ts`): chỉnh S, T theo dạng trong ràng buộc; so dự báo với ca chốt (sai số, thiên lệch); câu nghi sai đáp án; kiểm ma trận Q (câu lệch cổng AND); EM offline khi đủ 10 000 quan sát/dạng (script Node, chỉ ghi nếu tốt hơn trên tập giữ riêng).

---

## 2. PHẠM VI KHO VÀ PHẠM VI HỌC (luật cứng)

- **DẠY HỌC** (mã `DH-…` hoặc thư mục "DẠY HỌC"; `laDeDayHoc` `src/lib/day-hoc-len-bang.ts`): nguồn duy nhất của tick bài, game Đảo/Đoàn/Bi-a, Thử sức thêm, vé, Trạm hồi phục (câu nền `cau_nen`), ôn bài cũ. **Chỉ câu của bài đã tick của lớp.** *(Ngoại lệ 06/10, thầy: "chiến dịch đang chạy mà em báo hôm nay chưa có câu nào": câu của chiến dịch ĐANG CHẠY — câu thầy giao thẳng — luôn vào kế hoạch Đảo/Đoàn dù tờ thuộc TU LUYỆN hoặc bài chưa tick; luật lọc chỉ áp cho nợ cũ, duy trì, câu sai ca / Lên bảng và ôn bài cũ. Xem OMNI-3-build-status.md mục 15.)*
- **TU LUYỆN** (mọi tờ còn lại, thư mục ảo suy từ `nhom`, không ghi đè): chỉ Tu luyện (câu rút thêm/câu mới) và ca kiểm tra (gồm ca chốt nửa lạ, đề thử nửa ngày 6). Mở ca kiểm tra vẫn chọn mọi thư mục.
- Máy chủ biết thư mục qua `de_kho_thu_muc` (đồng bộ từ app thầy, ≤ 1 lần/ngày); thiếu ⇒ TU_LUYEN trừ mã `DH-`.

---

## 3. MÔ HÌNH DỮ LIỆU — CHỈ-THÊM (tạo lúc chạy + bản SQL `server/migration-0510-omni-3.sql`)

```sql
-- Phạm vi đã dạy
CREATE TABLE IF NOT EXISTS bai_da_day (id TEXT PRIMARY KEY, lop TEXT NOT NULL, khoa_bai TEXT NOT NULL, ten_bai TEXT NOT NULL, vi_tri INTEGER NOT NULL,
  ma_to_json TEXT NOT NULL, tick_luc TEXT NOT NULL, nguoi TEXT, chien_dich_id TEXT, bo_tick_luc TEXT);
CREATE INDEX IF NOT EXISTS bai_da_day_lop ON bai_da_day(lop, vi_tri);
CREATE TABLE IF NOT EXISTS de_kho_thu_muc (ma_de TEXT PRIMARY KEY, thu_muc TEXT NOT NULL, cap_nhat_luc TEXT NOT NULL);
-- Vi kỹ năng + ma trận Q
CREATE TABLE IF NOT EXISTS omni_vkn (id TEXT PRIMARY KEY, ma_dang TEXT NOT NULL, ten TEXT NOT NULL, ten_loi TEXT, nhan_nen TEXT, thu_tu INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS omni_q (qid TEXT NOT NULL, y INTEGER NOT NULL DEFAULT -1, vkn_json TEXT NOT NULL, nguon TEXT NOT NULL, duyet_luc TEXT, PRIMARY KEY (qid, y));
-- Hồ sơ (ĐỆM, dựng lại 100 % từ su_kien_hoc)
CREATE TABLE IF NOT EXISTS omni_p_vkn (sbd TEXT NOT NULL, vkn_id TEXT NOT NULL, p REAL NOT NULL, n_tu_lam INTEGER NOT NULL, n_ngay INTEGER NOT NULL,
  n_troi_chay INTEGER NOT NULL DEFAULT 0, diem_sprt REAL NOT NULL DEFAULT 0, trang_thai TEXT NOT NULL, cursor TEXT, phien_ban TEXT NOT NULL, cap_nhat_luc TEXT NOT NULL, PRIMARY KEY (sbd, vkn_id));
CREATE TABLE IF NOT EXISTS omni_em (sbd TEXT PRIMARY KEY, n_vung INTEGER NOT NULL DEFAULT 0, n_sai_vung INTEGER NOT NULL DEFAULT 0, s_uoc REAL NOT NULL,
  tau REAL NOT NULL DEFAULT 0, n_tau INTEGER NOT NULL DEFAULT 0, khung_gio_json TEXT, gio_hoc TEXT, muc_tieu REAL NOT NULL DEFAULT 8, phien_ban TEXT NOT NULL, cap_nhat_luc TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS omni_beta_cau (qid TEXT PRIMARY KEY, beta REAL NOT NULL, n INTEGER NOT NULL, cap_nhat_luc TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS omni_du_bao (sbd TEXT NOT NULL, pham_vi TEXT NOT NULL, ky_vong REAL NOT NULL, p8 REAL NOT NULL, sai_so REAL NOT NULL, s_dung REAL NOT NULL,
  con_duong TEXT, con_thieu_json TEXT, so_bang_chung INTEGER NOT NULL, luc TEXT NOT NULL, PRIMARY KEY (sbd, pham_vi));
CREATE TABLE IF NOT EXISTS omni_chung_chi (sbd TEXT NOT NULL, bai_id TEXT NOT NULL, cap_luc TEXT NOT NULL, do_tin REAL NOT NULL, diem_ca_chot REAL, ma_ca TEXT, PRIMARY KEY (sbd, bai_id));
CREATE TABLE IF NOT EXISTS omni_lo_dien (qid TEXT NOT NULL, ngay_vn TEXT NOT NULL, so_em INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (qid, ngay_vn));
CREATE TABLE IF NOT EXISTS omni_ve (sbd TEXT NOT NULL, tuan TEXT NOT NULL, con INTEGER NOT NULL, PRIMARY KEY (sbd, tuan));
-- Cột thêm (ALTER … ADD COLUMN, bọc try — CI không chạy migration)
ALTER TABLE su_kien_hoc ADD COLUMN mili_giay INTEGER;      -- máy em đo, kẹp [0, 900000]
ALTER TABLE su_kien_hoc ADD COLUMN tu_tin TEXT;            -- 'chac' | 'chua_chac' | NULL
ALTER TABLE su_kien_hoc ADD COLUMN nhan_toc_do TEXT;       -- 'troi_chay' | 'thuong' | 'cham' | 'luot' | NULL
ALTER TABLE srs2_ke_hoach ADD COLUMN chien_dich_json TEXT; -- danh sách id chiến dịch đã dùng
```

`cau_hinh` khoá mới: `omni` (`{"bat":true,"lop":[...]}` — công tắc theo lớp, mặc định TẮT), `tick_bai` (theo lớp), `the_luc_lop` (`{"12A1":40}`), `ma_tran_thi_2026` (ô × số câu), `omni_tham_so` (G theo phần, S khởi đầu 0,08, T 0,15, ngưỡng K/C/M, SPRT, tốc độ). Mọi bảng `omni_*` xoá đi dựng lại từ sổ ra y hệt (test).

---

## 4. MÔ-ĐUN THUẦN (server/src, không đọc đồng hồ, không Math.random) — CHỈ RÕ ĐẦU VÀO/ĐẦU RA

### 4.1 `omni-p-vkn.ts` — P vi kỹ năng với cổng AND
```ts
capNhatHoi(P: Record<vkn, number>, kn: vkn[], dung: boolean, g: number, s: number, T: number): Record<vkn, number>
// pall = Π P[k]; pc = pall(1−s) + (1−pall)g
// đúng: P[k]' = P[k]·((1−s)·pKhac + g·(1−pKhac))/pc ; sai: P[k]' = P[k]·(s·pKhac + (1−g)(1−pKhac))/(1−pc), pKhac = pall/P[k]
// kẹp [0,02; 0,99] rồi P'' = P' + (1−P')·T. Đúng công thức đã chạy trong mo-phong-chac-8.mjs (hàm capNhat).
phatLaiEm(suKien: SuKienDoc[], q: Map<qid|y, vkn[]>, thamSo): { p: Record<vkn, HoSoVkn>, em: HoSoEm }  // một quan sát/câu/ngày, bỏ lượt hỗ trợ, lướt, đọc lời giải 12 h
```
G theo phần: I 0,25 · ý II 0,5 (mỗi ý một quan sát; câu II đủ 4 ý ⇒ 4 quan sát) · III 0,01. Thiếu Q cho câu ⇒ dùng `CD:<dạng>` làm một vi kỹ năng duy nhất (lùi về bản 2).

### 4.2 `omni-s-em.ts` — sơ ý riêng từng em
`S_em = (n_sai_vung + 0,08 × 10) / (n_vung + 10)`; "vững" tại thời điểm làm = mọi vi kỹ năng cần có P ≥ 0,9 trước lượt đó; lượt chắc-mà-sai ở câu vững nhân đôi trọng số (bằng chứng sơ ý rõ nhất); lướt không tính. Theo khung giờ: cùng công thức, 5 khung, 20 lượt ảo.

### 4.3 `omni-toc-do.ts` — lognormal
`β_j` = trung vị ln(mili_giay) của lớp trên câu j (≥ 8 mẫu đúng, tự làm); thiếu ⇒ ln(baseSeconds × 1000) từ `uoc-luong-thoi-gian.ts`. `τ_em` = trung vị (β_j − ln t) trên 20 lượt đúng tự làm gần nhất, co về 0 với 10 mẫu ảo. Nhãn: `t ≤ 1,25·e^{β−τ}` trôi chảy · `> 2,0·` chậm · sai và `t < max(3 s, 10 % e^{β−τ})` lướt.

### 4.4 `omni-sprt.ts`
`diem += dung ? ln(0,9/0,7) : ln(0,1/0,3)` (ý Đúng–sai: 0,93/0,7). `≥ ln(0,8/0,1)=2,08` ⇒ `vung`; `≤ ln(0,2/0,9)=−1,50` ⇒ `chua_vung`; giữa ⇒ `chua_du`. Thầy xác nhận ⇒ +2,08 / −1,50 cho mọi vi kỹ năng của dạng. "Dạng đã vững" = mọi vi kỹ năng `vung` **và** ≥ 4 câu tự làm khác `content_group` **và** ≥ 3 ngày **và** ≥ 2 lượt trôi chảy **và** không đợt dạy lại **và** ≥ 2 câu chưa gặp từ bài khác DẠY HỌC đúng.

### 4.5 `lich-on-fsrs.ts` — 4 mức
sai → Again · đúng + chưa chắc → Hard · đúng + chắc → Good · đúng + chắc + trôi chảy → Easy. Tăng `PHIEN_BAN_FSRS` → `fsrs6-ts5.4.2-ret0.9-cfg2`.

### 4.6 Chương trình **Cẩn thận** (mới, bắt buộc)
- Mỗi em thấy S_em bằng số ("Sơ ý tuần này 6 % · mục tiêu dưới 7 %") ở Sảnh và thẻ cuối ngày.
- S_em > 0,07 ⇒ ba việc tự động: (a) câu đã vững vẫn quay lại ôn duy trì dày hơn (mốc ×0,7) để luyện độ chắc; (b) trước khi nộp câu Phần III hiện ô "Soát lại đơn vị và số liệu" (một chạm, không bắt buộc); (c) lượt chắc-mà-sai ở câu vững hiện thẻ "Em biết câu này. Sai vì bước nào?" với 3 lựa chọn tên lỗi của dạng — bấm là ghi sổ, không chấm. Thầy thấy em sơ ý cao trong "Cần thầy chữa".
- S_em ≤ 0,07 ⇒ không có gì thêm. Không bao giờ viết "em bất cẩn".

### 4.7 `omni-met-gio.ts` — hồ sơ mệt theo khung giờ
Kích hoạt khi khung hiện tại có tỉ lệ sơ ý ≥ 2 × khung tốt nhất của em và ≥ 20 lượt thật. Hành động duy nhất: đổi thứ tự kế hoạch đã chốt (nhẹ trước) + đề nghị dời câu mới khó sang mai nếu D − 3 ≥ 1; hai nút "Để mai" / "Làm luôn". Không khoá, không báo phụ huynh.

### 4.8 `du-bao-diem.ts` — PMF tích chập (đúng hàm `phanBoDe` của mô phỏng)
Đầu vào: P vi kỹ năng, S_em, ma trận Q của phạm vi, ma trận đề (ca chốt: phân bố câu của bài; thi: `ma_tran_thi_2026`), τ_em và β để lọc **tập câu khả thi trong 50 phút**. Đầu ra: `{kyVong, p8, saiSo, conDuong ('A'|'B'|'C'), conThieu[], soBangChung}`. Điểm còn lấy được theo vi kỹ năng = Σ ô × điểm × (1 − P đúng) × phần của vi kỹ năng trong ô. Độ tăng P kỳ vọng = p̂·ΔP(đúng) + (1−p̂)·ΔP(sai).

### 4.9 `srs2-loi.ts` — mở rộng, không đổi hành vi cũ
`lapKeHoachNgay(cau, tt, tc)` nhận thêm `chienDich?: {id, hanNop, theLucNgay, raiDeu}[]`, `trongSoDang?`, `onBaiCu?: CauSrs[]`, `cheDoCho?: boolean`, `metGio?: boolean`. Vắng tất cả ⇒ JSON y hệt hôm nay (test khoá).

### 4.10 `omni-chung-chi.ts`
`xetChungChi(P, S_em, duBao, caChot?) → {dat: boolean, doTin, thieu: {vkn[], y[], soY}, uocNgay}`; `uocNgay` = ⌈Σ lượt cần / nhịp thật của em⌉, lượt cần theo công thức ln((1−0,95)/(1−P))/ln(1−T·p̂).

---

## 5. HỢP ĐỒNG API (ghi đầy đủ vào `docs/hop-dong-omni-3.md` khi build)

| Lệnh | Vai | Thân | Trả |
|---|---|---|---|
| `POST /gv/bai-da-day` | thầy | `{action: 'tick'|'bo-tick'|'danh-sach'|'xem-truoc', lop, khoaBai, tenBai, viTri, maDe[], hanNop?, theLucNgay?}` | xem-truoc: `{soCau, soTuLuan, hanNop, D, luotCan, sucChua, duLuot, duDiem8, quaTai[]}`; tick: `{chienDichId}` |
| `POST /kho/thu-muc` | thầy | `{ds: [{maDe, thuMuc}]}` ≤ 400 | `{daGhi}` |
| `POST /gv/omni/bang` | thầy | `{lop, baiId}` | lưới `{em[], dang[], o[sbd][dang]: {p, n, trangThai}, sEm[sbd], khoangCach8[sbd], canChua[]}` |
| `POST /gv/omni/xac-nhan` | thầy | `{sbd, maDang, ket: 'vung'|'day_lai'}` | ghi sổ `thay_xac_nhan` |
| `POST /gv/omni/q` | thầy | `{action: 'lo'|'duyet', maDang?, ds?: [{qid, y, vkn[]}]}` | lô 50 câu gợi ý / số đã duyệt |
| `POST /game-v2/answer` | em | thêm `msLam?: number, tuTin?: 'chac'|'chua_chac'` | thêm `nhanTocDo, loiNhan` |
| `POST /game-v2/hoa2-sanh` | em | như cũ | thêm `baiDangLuyen, dangVung {a,b}, conDangDe8, sEm, chungChi[], tram?, metGio?, ve {con}` |
| `POST /hs/omni/tram` | em | `{session}` | 3 câu nền + tên lỗi (đáp án không xuống) |
| `POST /hs/omni/ve` | em | `{maDang}` | 3 câu cao hơn một bậc; `ve.con − 1` |
| `POST /hs/omni/nhat-ky` | em | `{ngay?}` | 3–5 dòng từ sổ |
| `POST /hs/omni/doi-thu-tu` | em | `{quyet: 'de_mai'|'lam_luon'}` | kế hoạch đã đổi thứ tự |
| `POST /ph/omni/tien-do` | PH | `{token}` | `{baiDangLuyen, khoangCach8, dangCanVung[], sEm, chungChi[], chuoi, gioHoc, canThayChua, loiThay}` |
| `POST /gv/chien-dich` `ca-chot` | thầy | `{id, kieu: '50-50'}` | gói ca chốt (nửa song sinh câu bài, nửa TU LUYỆN cùng ô) ⇒ màn Mở ca |

---

## 6. GIAO DIỆN — 8 MÀN (hình trong `docs/omni-0510/`) VÀ CHỮ CHUẨN

| Hình | Màn | Chữ mới cần thêm vào bảng A2 (qua Boss) |
|---|---|---|
| `HS-Sanh.jpg` | Sảnh: Bài đang luyện · Cọ xát · Thành thạo · **Dạng vững a/b** · còn N dạng để chạm 8 · **Sơ ý** · chứng chỉ bài trước · Đoàn/Đảo · Vé thử thách · Thử sức thêm · Rương | Bài đang luyện · Dạng vững · Sơ ý · Vé thử thách · Chứng chỉ Sẵn sàng 8+ |
| `HS-CauHoi-ChacChuaChac.jpg` | Câu + hai nút **Chắc / Chưa chắc** + thời gian câu so với mức thường của em | Chắc · Chưa chắc |
| `HS-KetQua-DungNhungCham.jpg` | Kết quả: **Đúng nhưng chậm**, P dạng kèm cỡ mẫu, lời giải từng bước có "em đã qua" | Đúng nhưng chậm · Trôi chảy |
| `HS-TramHoiPhuc.jpg` | **Trạm hồi phục** theo vi kỹ năng, 3 câu nền, Máu không mất | Trạm hồi phục · Vi kỹ năng |
| `HS-CuoiNgay-ChungChi.jpg` | Hôm nay em tiến thêm gì · Nhật ký 3 dòng · tiến độ chứng chỉ · Rương · Lời thầy tuần | Nhật ký của em |
| `GV-TickBai.jpg` | Dạy học · Bài hôm nay: cây DẠY HỌC có trạng thái, dòng xác nhận, tờ vào bài, cảnh báo quá tải | Bài hôm nay · Giao theo bài · Chờ bài mới |
| `GV-BangBai.jpg` | Bảng bài: lưới P × dạng, Sơ ý, **Khoảng cách tới 8**, xác nhận dạng, **Cần thầy chữa**, Buổi chữa | Khoảng cách tới 8 · Cần thầy chữa |
| `PH-TienDo.jpg` | Tiến độ của con: khoảng cách tới 8 bằng điểm, dạng cần vững, sơ ý, chứng chỉ, chuỗi, giờ học, lời thầy | — (không chữ game) |

Luật chữ giữ nguyên A1: số có nhãn, một khái niệm một từ, không mã nội bộ trên màn em/PH, không nhãn năng lực, không doạ, không 100 %.

---

## 7. ĐIỀU KIỆN TIÊN QUYẾT (làm trước hoặc có đường lùi)

| Điều kiện | Nếu chưa có | Đường lùi để build vẫn xong |
|---|---|---|
| Ma trận Q cho bài đang dạy | Thầy duyệt lô 50 câu/15 phút; máy gợi từ `kienThuc[]` + `nhan_nen` | Câu không có Q ⇒ một vi kỹ năng = dạng (bản 2) — mọi luật vẫn chạy |
| Thư viện tên lỗi 3–6/dạng | Viết cùng Q | Trạm hồi phục dùng nhãn nền của câu cuối |
| `ma_tran_thi_2026` | Thầy nhập ở Cài đặt | Mặc định 18/4/6 chia theo tỉ lệ kho; chỉ dự báo ca chốt |
| Thời gian câu game | Máy em gửi `msLam` từ GĐ B | Chưa có ⇒ nhãn tốc độ `NULL`, điều kiện trôi chảy tạm miễn, chữ nói "chưa đo tốc độ" |
| Ca chốt ≥ 3 để hiệu chuẩn | Chạy thử lớp 1 | Cột Khoảng cách tới 8 chỉ thầy thấy, nhãn "đang hiệu chỉnh (n/3)" |

---

## 8. THỨ TỰ BUILD VÀ CỔNG — "THÀNH CÔNG LẦN ĐẦU" NGHĨA LÀ QUA ĐỦ CỔNG

| GĐ | Làm | Cổng (phải xanh mới sang GĐ sau) |
|---|---|---|
| **A · Lõi thuần** (1 ngày) | `omni-p-vkn.ts`, `omni-s-em.ts`, `omni-toc-do.ts`, `omni-sprt.ts`, `du-bao-diem.ts`, `omni-chung-chi.ts`, mở rộng `lapKeHoachNgay`, FSRS 4 mức | **Test vàng** `tests/omni-3-loi.test.ts`: (1) `phanBoDe(P=1, S=0,10)` = 8,66 ± 0,01 và P(≥8) = 88 ± 1 % (khớp mô phỏng); (2) bảng Phần II mục 3.1 bản 3 tái lập; (3) phát lại 2 lần cùng số; (4) `lapKeHoachNgay` vắng tham số mới ⇒ JSON y hệt 20 kịch bản cũ; (5) SPRT: 9 đúng liên tiếp ⇒ vững, 13 đúng + 1 sai ⇒ vững, 3 sai ⇒ chưa vững; (6) gán trách: sai câu 2 kỹ năng, kỹ năng P thấp hơn giảm nhiều hơn; (7) mô phỏng 80 em × S 0,06 ⇒ khai oan ≤ 6 %. `tsc` sạch. |
| **B · Máy chủ** (1–2 ngày) | Migration chỉ-thêm; `bai_da_day`, `/gv/bai-da-day`, `/kho/thu-muc`, `docHoSo2` nhiều chiến dịch, `answer` nhận `msLam`/`tuTin`, cron đêm dựng `omni_*`, `/gv/omni/*`, `/hs/omni/*`, `/ph/omni/tien-do`, ca chốt 50/50, Tu luyện lọc TU_LUYEN, công tắc `omni`/`tick_bai` | Test D1 (workerd): xoá `omni_*` dựng lại khớp 100 %; công tắc tắt ⇒ toàn vitest không thêm tên đỏ so nền; Tu luyện không rút DẠY HỌC làm câu mới; không câu bài chưa tick ở `hoa2-sanh`/`start`/`doan-*` (test 20 kịch bản) |
| **C · App thầy** (1–2 ngày) | Bước "Bài hôm nay" + "Giao theo bài", cây có trạng thái + thư mục TU LUYỆN, dòng xác nhận, Bảng bài (lưới P, Sơ ý, Khoảng cách tới 8, xác nhận dạng, Cần thầy chữa), công cụ duyệt Q theo lô, Cài đặt (ma trận, thể lực lớp) | Test giao diện: chữ đúng bảng A2; nút = động từ; số có nhãn; ảnh 1440×900 khớp bố cục `GV-*.jpg`; `check:mau` xanh |
| **D · App em + PH** (1–2 ngày) | Sảnh thêm thẻ; Chắc/Chưa chắc; thẻ kết quả theo trạng thái; Trạm hồi phục; vé; nhật ký; đề thử nửa; chế độ muộn; PH tiến độ | Ảnh 390×844 khớp `HS-*.jpg`, `PH-TienDo.jpg`; luồng thi thật không đổi một dòng (`ExamTakeScreen` diff = 0); đáp án không xuống trước nộp (test) |
| **E · Chạy thử** (7–10 ngày lịch) | 1 lớp, 2 bài liên tiếp, ca chốt 50/50 ×2 | Sai số dự báo vs ca chốt ≤ 0,6; khai oan chứng chỉ ≤ 5 %; % em đạt ≥ 8 ở ca chốt so với bài trước của chính lớp; chuỗi ngày trung vị không giảm; % bỏ chuyến giữa đường giảm |

Mỗi GĐ: `npx vitest run tests/omni-3-*.test.ts --reporter=dot`, `tsc`, commit theo đường dẫn, một dòng Nhật ký `DIEU-PHOI.md`, báo ≤ 150 chữ. Toàn vitest trước khi gộp. Không đẩy khi có ca mở.

---

## 9. NGHIỆM THU CUỐI (đạt/trượt, tự kiểm)

1. Tick bài ⇒ chiến dịch đúng tờ, đúng hạn tự tính, dòng xác nhận đúng 6 con số; tick lần hai không tạo thêm.
2. Mô phỏng 2 bài song song (bài 2 tick ngày 4): mỗi bài cọ xát 100 % trước hạn riêng − 3; không câu bài 3.
3. Ngày 8 không tick: kế hoạch nhẹ ≤ 60 %, Sảnh có việc nếu còn nợ/duy trì/bài cũ.
4. Em có P ⇒ câu mới xếp theo điểm còn lấy được; dạng vững ⇒ câu mới dư thành tuỳ chọn.
5. 3 sai liền chung vi kỹ năng ⇒ Trạm đúng tên lỗi, đúng câu nền, Máu không đổi; lướt thứ 4 trong ngày tính sai.
6. Chắc-mà-sai ⇒ lời giải mở ngay; đúng-chưa-chắc ⇒ không tính vững; đúng-chậm ⇒ thẻ đúng chữ.
7. Chứng chỉ chỉ cấp khi K ∧ C ∧ M ∧ T; không bao giờ hiện 100 %; xoá `omni_*` dựng lại khớp.
8. Thầy: Bảng bài có Cần thầy chữa ba loại; Chữa xong ⇒ câu quay lại Đoàn hôm sau.
9. Công tắc tắt ⇒ app như hôm nay; vitest không thêm tên đỏ; `ExamTakeScreen` không đổi.

---

## 10. GIẢ ĐỊNH MẶC ĐỊNH (thầy không nói khác thì build theo đây)

Ngưỡng K 0,95 · C 0,07 · M 0,90 · T 8,0 · SPRT 0,7/0,9 (ý 0,93), α 0,10, β 0,20 · G 0,25/0,5/0,01 · S khởi đầu 0,08 · T 0,15 · trôi chảy 1,25× · chậm 2,0× · lướt max(3 s, 10 %) ≤ 3/ngày · trạm ≤ 1/chuyến · vé 2/tuần · hạn bài 7–14 ngày, tiêu chí 80 % · thể lực lớp 40 · chế độ chờ 60 % sàn 12 · đan xen ngày 4–5 là 40 % · đề thử nửa 14 câu 25 phút · ca chốt 50/50 28 câu 50 phút · Ví dụ minh hoạ không vào bài luyện · TU LUYỆN chỉ Tu luyện + ca kiểm tra · dự báo thô chỉ thầy (PH thấy điểm sau hiệu chuẩn; em thấy dạng) · mục tiêu 8,0 (đổi 9,0 khi đã có ≥ 3 chứng chỉ).

## 11. ĐIỀU THẦY NÊN CHỐT TRƯỚC KHI GÕ BUILD (không chốt ⇒ dùng mặc định mục 10)

1. Chứng chỉ có điều kiện **Cẩn thận S ≤ 7 %** — đây là chỗ mô phỏng chỉ ra là quyết định nhất.
2. Thầy nhận việc duyệt ma trận Q cho **chương đang dạy** trước (≈ 6–8 lô × 15 phút), phần còn lại rải sau.
3. Em thấy "còn N dạng để chạm 8", **không** thấy điểm dự báo thô.
4. Ca chốt 50/50 thay "rút từ chiến dịch".
5. Thể lực theo phút của em (điều 8 bản 2) bật ngay hay chờ đo GĐ E.
