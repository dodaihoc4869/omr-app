# Tự sửa kho đề — thẩm định đợt 1 (29/09, Code 4b)

Nguồn: `/gv/loi-giai/sua-kho` lúc 14:30 VN — 135 mục `sua` (đề in sai / trình bày) + 14 mục "đáp án kho sai" do phiên chốt kết luận.
**Trạng thái: ĐÃ GHI KHO 29/09 (thầy cho phép trực tiếp).** 142 việc / 56 đề / 121 câu, đề nào cũng đọc lại khớp; không có ca thi nào lúc ghi. Kế hoạch: `ke-hoach-dot-1.json`; danh sách đã sửa: `da-tu-sua.md`; bản gốc từng câu: `sao-luu/<mã đề>.json`. Lùi: `node scripts/loi-giai/tu-sua-kho.mjs --lui <qid,...> --that`. 57 câu đổi băm đã tự vào lại hàng soạn lời giải.
Không áp: sửa bảng DH-12-C1-B1-P1-II-26 (trường `bang` không phải chữ) và việc xoá "– 2850" đi cặp với nó (tránh mất số).

## 14 câu "đáp án kho sai" — Code 4b giải lại độc lập

| qid | kho | kết luận | làm gì |
|---|---|---|---|
| 12-C8-B27-II-20 | DSDS | **DSSS** — Z = [PtI₂(NH₃)₂] trung hoà, không dẫn điện tốt (xem ảnh sơ đồ K₂[PtCl₄] → X → Y → Z) | đổi đáp án |
| 12-KT-C56-D1-III-5 | 6,0 | **4,8** — 14400/96500 × 40 × 0,8 = 4,775 (kho bỏ sót hiệu suất 80%) | đổi đáp án |
| DB-12-B5-D2-III-344 | 3,45 | **2** — chỉ maltose, tinh bột có α-1,4 (3,45 là nhập nhầm) | đổi đáp án |
| DH-12-C2-B6-III-7 | 3,45 | **2** — như trên (bản trùng) | đổi đáp án |
| 12-KT-C56-D1-III-4 | 5 | **2** — đã chốt ở `CHOT-2909.md` | đổi đáp án |
| 12-KT-C3-D3-I-12 | A (500) | 50 mL, không phương án nào đúng | sửa đề: `pa.A` "500" → "50", giữ A |
| DB-12-B8-D1-I-267 | A (500) | như trên (bản trùng) | sửa đề: `pa.A` "500" → "50", giữ A |
| DB-12-B6-D2-II-33 | DSSD | **kho ĐÚNG**. Phiên chốt đọc lệch vì ý lưu thứ tự a,b,d,c | chỉ xếp lại khoá `y` về a,b,c,d |
| DH-12-C2-B6-II-7 | DSSD | như trên (bản trùng) | chỉ xếp lại khoá `y` |
| 12-C3-B10-D2-III-27 | 2 | phiên chốt nói 3 (alanine tạo phức Cu²⁺) — còn tranh luận | **để nguyên** |
| 12-KT-C3-D2-III-3 | 2 | như trên (bản trùng) | **để nguyên** |
| 12-C3-B8-D2-II-23 | SSSD | ý a: Kb tính đủ = 6,47·10⁻⁵ ≈ 6,5 (Đ); tính gần đúng x²/0,1 = 6,3 (S) — tuỳ cách tính | **để nguyên** |
| DB-12-B8-D2-II-27 | SSSD | như trên (bản trùng) | **để nguyên** |
| 12-KT-C3-D2-I-16 | A | đồ thị về 0 ở 50 °C ⇒ cả (a)(b)(c)(d) đều đúng, không phương án khớp — đề lỗi | **để nguyên**, thầy sửa đề |

## 135 mục sửa đề
Đã soát cả 135 (danh sách ở `/gv/loi-giai/sua-kho`). Đa số là chính tả / kí hiệu (tuối → tuổi, 90o → 90°, CO2 → CO₂, bỏ dòng "HẾT"). Các mục đổi nghĩa đã xem ngữ cảnh, đều giữ đáp án kho hoặc làm đề khớp đáp án:
- 389,30 → 389,31 kJ (25/180 × 2803 = 389,3056; đáp án A không đổi) — 4 câu.
- K[Au(CN)₂] → K[Au(CN)₄] (12-KT-C56-D2-II-3): số liệu electron và ý b "Au³⁺ + 3e" chỉ khớp vàng +3.
- Mạ Ni (12-KT-C5-D4-II-4 ý d): thêm "phủ kín cả mặt bên và hai đáy; M(Ni) = 59" ⇒ 4,61 giờ, khớp đáp án kho d = Sai.
- 305 mg → 305 g dung dịch (lon 304,6 mL); "không có trong tự nhiên" → "không có trong protein thiên nhiên" (β-alanine có trong tự nhiên; đáp án B giữ).
- Thay `<br>` bằng xuống dòng khi trường đề là chữ thường (kho không dùng HTML).

## Lỗi dây chuyền phát hiện kèm
`src/lib/loi-giai-kiem.ts:216` ghép chuỗi đáp án Đ/S theo thứ tự khoá của `y`, còn màn thi (`exam-kho-de-import.ts:446`) ghép theo a,b,c,d. Câu lưu ý lệch thứ tự ⇒ hồ sơ lời giải sai Đ/S. Hiện gặp 1/2117 câu. Sửa: xếp `ids` theo a–d (và A–D với `pa`); cần đẩy Worker ⇒ để Boss giao.

## Đợt 1b — quyết 5 câu còn treo (thầy lệnh 15:05 "tự xử lý tối ưu nhất") — ĐÃ GHI 29/09 ~15:20 (thầy cho phép tất cả): 4 việc / 3 đề đọc lại khớp; 2 hồ sơ alanine đã nộp lại với daChot "giữ đáp án kho 2"
Kế hoạch: `ke-hoach-dot-1b.json` (đã chạy thử: 4 việc / 3 đề áp được).
- **Kb (12-C3-B8-D2-II-23, DB-12-B8-D2-II-27):** đổi đáp án SSSD → **DSSD**. Kb = x²/(0,1 − x) = 6,47·10⁻⁵ ≈ 6,5·10⁻⁵, trùng đúng số in; cách gần đúng ra 6,3 không khớp số nào ⇒ số 6,5 là số tính đủ, ý a Đúng.
- **Enzyme (12-KT-C3-D2-I-16):** sửa đề tối thiểu, giữ đáp án A: (b) "khoảng 51 °C" → "khoảng 50 °C"; (c) → "Tốc độ phản ứng ở 45 °C cao hơn ở 37 °C." (sai rõ theo đồ thị) ⇒ A = (a), (b), (d) là đáp án duy nhất.
- **Alanine + Cu(OH)₂ (12-C3-B10-D2-III-27, 12-KT-C3-D2-III-3):** GIỮ đáp án kho 2, không sửa kho. Đây là câu trong bộ ôn thi TN THPT (Bài 7 Peptide, protein, enzyme — VietJack, Lazi), các nguồn đều chấm 2 (protein, ethylamine). Chỉ cần soạn lại hồ sơ lời giải: chuyển cờ `dapAn` sang `daChot` "giữ đáp án kho theo đề thi".

## Đợt 2 — ĐÃ GHI 29/09 ~15:25: 63 việc / 33 đề (xem `tham-dinh-dot-2.md`).
## Đợt 3 — ĐÃ GHI 29/09 18:40 (sau khi ca 12L2-L1 đóng + công bố): 91 việc / 48 đề — 88 sửa đề, đổi đáp án 12-C5-B16-I-50 B→D, 12-KT-C2-D2-I-8 A→B, DB-12-B4-D3-I-152 A→B (xem `tham-dinh-dot-3.md`).
Sửa công cụ: kiểm ca khoá theo đúng luật `laSanSangCongBo` (congBo là chế độ, không phải cờ).
## Đợt 4 (khối 10–11 + phần còn lại khối 12) — ĐÃ GHI 29/09 ~20:25: 306 việc / 83 đề — 4a 141 + 4b 138 sửa đề; 4c: đổi đáp án 10-C1-B1-II-10 và DB-10-B1-D1-II-61 DSSS→DSDS (1 : 0,00055 ≈ 1818), 25 việc sửa đề giữ đáp án (xem `tham-dinh-dot-4a/4b/4c.md`). 110 câu vào lại hàng soạn.
