# Đặc tả Mức làm 6 mức — thêm "Treo máy" và "Cố tình treo máy", đo lại cho chính xác — 22/10/2026

Trạng thái: **LÕI đã xong (`server/src/muc-lam.ts`: `treoCuaLuot` (chỉ Mức 5), `nangCoTinhTheoNgay` (Mức 6), `mucCongKhai`, `tongMucLam(…, {tachTreo})`; lượt đã đo mà không treo mang `daDoTreo`, vắng cả hai ⇒ chưa đo; test `tests/muc-lam-6-muc-2210.test.ts`). ĐỢT 1 (đồng hồ ở máy em) đang làm, chưa đổi giao diện. ĐỢT 2 (giao diện 6 mức) CHỜ THẦY DUYỆT ẢNH.** Tiếp nối `docs/dac-ta-muc-lam-bai-2010.md` (Mức làm 1–4, mục 3–4 giữ nguyên).

## 1. Thầy yêu cầu (22/10)
"Xem bảng điểm danh hiện tại như thế nào, phần đánh giá mức 1 chưa đọc xong đề đến mức 4 (tôi muốn bạn thêm 2 mức nữa là treo máy, cố tình treo máy) bạn dùng trí thông minh của mình tối ưu lại phần đo này cho chính xác và hiệu quả nhất, giao diện hồ sơ của học sinh … chia việc tối ưu cả giao diện cho đầy đủ trực quan dễ nhìn thân thiện hơn nữa, giao cho mỗi code làm 1 phần."

## 2. Nói thẳng trước khi làm
1. **Lượt đã làm KHÔNG xếp được "treo máy".** Đồng hồ hiện nay dừng đếm khi tab ẩn hoặc 180 giây không chạm, rồi BỎ khoảng đó đi — không ghi lại là đã có khoảng treo. Không có dữ liệu thì không đoán. Treo máy chỉ xếp được cho lượt làm SAU khi Đợt 1 lên bản thật; lượt cũ hiện "Chưa đo treo máy".
2. **Không chạm màn ≠ treo máy.** Môn Hoá: em tính nháp trên giấy 2–5 phút không chạm màn là bình thường (Phần III). Ngưỡng treo máy phải dài hơn thời gian tính nháp hợp lý và có thêm dấu hiệu khác (mục 4).
3. **Màn hình tự khoá ≠ rời app.** Điện thoại tự tắt màn sau 30 giây – 2 phút ⇒ trình duyệt báo "ẩn" ngay trong lúc em đang tính nháp. Hiện KHÔNG màn nào giữ màn sáng (`wakeLock`: 0 chỗ). Muốn phân biệt "rời app" với "màn tự tắt" thì phải giữ màn sáng trong lúc câu đang mở (mục 5, đề xuất).
4. **"Cố tình" không kết luận từ một lượt.** Một lượt chỉ biết "đã treo"; "cố tình" cần mẫu lặp lại (mục 4). Đây là lời buộc tội ⇒ đề xuất **chỉ thầy thấy**, ngưỡng thận trọng, chỉnh lại sau ~1 tuần dữ liệu thật.
5. **Sai số đang có, sửa được:** (a) đồng hồ mới tính cả tối đa 180 giây đứng yên vào giây làm ⇒ một lượt "treo 10 phút rồi bấm bừa" hiện thành ~185 giây = Mức làm 3–4 "Có nghĩ / Làm kỹ" — SAI; (b) OMNI ước tốc độ em từ `msLam` (đồng hồ tường, cả lúc treo, cả lúc ẩn) ⇒ lượt treo kéo lệch "thời gian thường" của em và β của câu, kéo lệch luôn ranh Mức làm 4; (c) hệ số đọc riêng của em (τ OMNI) chưa nối vào T_đọc (đặc tả 20/10 ghi "TẠM 1,0").

## 3. Đo thêm gì (Đợt 1 — mọi nơi có đồng hồ, không đổi giao diện)
Giữ NGUYÊN `g` (giây làm như hôm nay) để Mức làm 1–4 so được với dữ liệu cũ. Cụm `doGiay` thêm 5 số nguyên (máy chủ làm sạch, ghi vào `raw_json.doc` — JSON, KHÔNG đổi schema):

| Trường | Nghĩa | Khoảng |
|---|---|---|
| `g` | (giữ nguyên) giây câu hiện, tab hiện, ≤ 180 giây từ lần chạm cuối | 1–900 |
| `v` | tổng giây câu mở **khi tab hiện** (không cắt 180 giây) | 0–7200 |
| `a` | tổng giây câu mở **khi tab ẩn / màn tắt** | 0–7200 |
| `l` | khoảng lặng dài nhất (giây giữa hai lần chạm liên tiếp, hoặc từ lần chạm cuối tới lúc nộp) khi tab hiện | 0–7200 |
| `n` | số khoảng lặng 120–179 giây (ngay dưới ngưỡng cắt — dấu hiệu chạm giữ máy) | 0–60 |
| `w` | 1 nếu đã xin được giữ màn sáng trong lúc câu mở (màn ẩn lúc ấy là em tự rời app / tắt màn) | 0/1 |

"Chạm" = `pointerdown`, `keydown`, `input`, `touchstart`, `wheel` (như đồng hồ hiện nay). Mọi nơi đo (7 chỗ: game/học tập `ManLamBaiTap`, ôn `LamCauOn`, mở bài `StudentPortalScreen`, phiếu BTVN/khắc phục `html-phieu` + `KhungXemPhieu`/`btvn-nop-chang-em`, ca thi `ExamTakeScreen`, kiểm tra cá nhân `ManKiemTraCaNhan`) gửi CÙNG khuôn này. Máy chủ: `lamSachDo` (server/src/do-giay-luot.ts) nhận, kẹp khoảng, bỏ giá trị sai khuôn; thiếu trường ⇒ lượt ấy "Chưa đo treo máy".

## 4. Hai mức mới (lõi `server/src/muc-lam.ts`, một nguồn cho mọi màn)
Mức làm 1–4 GIỮ NGUYÊN công thức. Hai mức mới **đè lên** mức 1–4 khi xảy ra (lượt treo thì số giây không còn nói lên em đã nghĩ bao lâu). Ngưỡng là TẠM, chỉnh sau 1 tuần dữ liệu:

| Mức | Điều kiện | Chữ cho thầy |
|---|---|---|
| **Mức làm 5 · Treo máy** (một lượt) | khoảng lặng dài nhất `l` ≥ **300 giây** (5 phút không chạm khi màn đang sáng); HOẶC rời app `a` ≥ **180 giây** khi màn được giữ sáng (`w = 1`); HOẶC `a` ≥ **600 giây** khi không giữ được màn sáng; HOẶC `n` ≥ **3** (ba quãng lặng 2–3 phút rồi chạm ngay trước ngưỡng cắt) | Treo máy |
| **Mức làm 6 · Cố tình treo máy** (mẫu lặp) | CHỈ từ mẫu trong CÙNG một ngày của em: ≥ **3 lượt** Mức làm 5. Một lượt đơn lẻ KHÔNG BAO GIỜ là Mức 6 (kể cả `n` ≥ 3: em làm Phần III khó có thể tính nháp ba quãng 2–3 phút, chạm/cuộn giữa các quãng). Luật theo ngày chỉ áp ở danh sách lượt của MỘT em (hồ sơ, lịch sử, điểm danh); "Ai đã sai?" không có Mức 6 | Cố tình treo máy |

Vì sao 300 giây: dài hơn tính nháp Phần III hợp lý (đo trên lượt thật sẽ chỉnh); thấp hơn thì em tính nháp chăm chỉ bị gọi oan.

Hệ quả đo lường (chính xác hơn):
- Lượt Mức 5–6 KHÔNG dùng làm mẫu "thời gian thường" (β câu, τ em) và KHÔNG tính vào "làm lâu" ở app phụ huynh.
- Giây làm cho Mức 1–4 của lượt KHÔNG treo vẫn là `g`.
- Nối τ OMNI vào hệ số đọc (kẹp 0,75–1,5) khi em có τ — T_đọc riêng từng em (Đợt 2, cần soát động cơ OMNI).

## 5. Đề xuất cần thầy quyết (ở bước duyệt ảnh)
- **Giữ màn sáng khi đang làm câu — ĐÃ BẬT ở Đợt 1 (thầy muốn tắt thì báo).** Screen Wake Lock: xin khi màn làm câu mở, tự nhả khi rời màn; **nhả sau 10 phút không chạm** (máy bỏ quên trên bàn không sáng mãi), chạm lại thì xin lại; trình duyệt tự nhả khi tab ẩn ⇒ xin lại khi hiện lại. Cần để biết em rời app hay chỉ màn tự tắt. Máy không hỗ trợ / từ chối ⇒ `w = 0`, dùng ngưỡng 600 giây. Tuần chỉnh ngưỡng: tách số liệu theo `w` và loại máy (iOS cài ra màn hình chính chưa chắc giữ được màn) trước khi tin nhánh 180 giây.
- **Ai thấy gì:** Mức 5 "Treo máy" — thầy + học sinh ("Câu này máy để treo X phút") + phụ huynh (chỉ số lượt, không chi tiết). Mức 6 "Cố tình treo máy" — **CHỈ THẦY** cho tới khi thầy cho mở.

## 6. Chia việc
| Phần | Ai | Tệp (làn) | Khi nào |
|---|---|---|---|
| Lõi Mức làm 5–6, máy chủ nhận trường mới, nhãn nhóm Kiểm tra đầu giờ / Chữa câu | Boss (Code app 1) | `server/src/muc-lam*.ts`, `do-giay-luot.ts`, `src/components/day-hoc/KiemTraDauGio.tsx`, `chien-dich/ThayTuChua.tsx`, `chua-cau-sai/CauCanChuaTrenLop.tsx` | ngay |
| Đồng hồ mới ở game/học tập, ôn, mở bài | Boss | `ManLamBaiTap.tsx`, `LamCauOn.tsx`, `StudentPortalScreen.tsx` | Đợt 1 |
| Đồng hồ mới ở ca thi + phiếu BTVN/khắc phục (+ giữ màn sáng) | Code app 3 | `ExamTakeScreen.tsx`, `html-phieu.ts`, `KhungXemPhieu.tsx`, `btvn-nop-chang-em.ts` | Đợt 1 (Boss soát luồng thi) |
| Đồng hồ mới ở kiểm tra cá nhân + làm test `ktcn-dong-ho-la-1410` tất định | Codex | `ManKiemTraCaNhan.tsx`, test KTCN | Đợt 1 |
| Bảng điểm danh (thanh Mức làm 14 ngày → 6 mức) + tờ chiếu "Ai đã sai" | Code app 2 | `src/components/day-hoc/*điểm danh*`, `muc-lam-giao-dien.tsx` (phần thanh), tờ chiếu X | Đợt 2: bản vẽ → thầy duyệt → build |
| Hồ sơ học sinh (thầy xem em · học sinh · phụ huynh): làm lại cho đầy đủ, trực quan, thân thiện; 6 mức | Code app 4 | Hồ sơ làm bài 3 app, `ToanCanhEmScreen`, `HoSoCuaEmHs`, `ph-v3` phần hồ sơ | Đợt 2: bản vẽ → thầy duyệt → build |

Luật chung: chỉ sửa tệp trong làn; màu chỉ dùng biến có sẵn (`npm run kiem:mau-giu` 0); `npm run kiem:toc-do` 0 đỏ (mốc chỉ hạ); precache ≤ 169; KHÔNG tự gộp main — Boss gộp chung một lượt sau khi cổng xanh; bản vẽ: ảnh Chromium thật 3 khổ × sáng/tối, số trong ảnh là số giả ghi rõ "minh hoạ".

## 7. Nghiệm thu
- Đợt 1: mọi nơi đo gửi đủ `g v a l n w`; test lõi: lượt treo 10 phút rồi bấm ⇒ Mức 5 (không còn Mức 3–4); tính nháp 4 phút có chạm ⇒ không Mức 5; 3 lượt treo trong ngày ⇒ Mức 6; lượt cũ thiếu trường ⇒ "Chưa đo treo máy"; giây tối đa và khoảng làm sạch đúng.
- Đợt 2: ảnh duyệt khớp màn build; nhãn Mức 6 không lộ ở app học sinh/phụ huynh; hồ sơ học sinh qua 10 mục tự soát `docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md`.
