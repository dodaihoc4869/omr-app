# Bản vẽ KHỐI B — ngày Học mới / Kiểm tra ôn tập / Sửa lỗi cho học sinh (09/11) — CHỜ THẦY DUYỆT, CHƯA BUILD

Thầy 09/11: «vẽ luôn màn Mới / Ôn / Sửa cho tôi duyệt» · «sửa gì xong cuối cùng phải giữ nguyên tốc độ app hs tức thì như hiện tại» · «giữ thiết kế phẳng đẹp sắc nét như hiện tại».
Nguồn sư phạm: `docs/de-xuat-28-cau-v5-0911.md` mục 2–4. Bản vẽ: `moi-on-sua.html` (phẳng đúng `src/styles/phang-hs.css`, màu đúng `src/styles/trong-hs-mau.css`), chụp: `node docs/ban-ve-moi-on-sua-0911/chup.mjs <thư mục phông>`.
Nhãn vàng **MỚI** / **TUỲ CHỌN** và khung nét đứt chỉ có trên bản vẽ để thầy thấy phần thêm, không có trong app.

## 0. Bốn điều thầy cần chốt (em đã chọn sẵn, thầy muốn khác thì nói)
1. **Ngày Ôn = «Kiểm tra ôn tập» đang có** (đề 28 câu, chấm sau khi nộp, điểm /10) — một khái niệm một tên. Em đề xuất: lịch Kiểm tra ôn tập hằng tuần hiện nay **chuyển sang theo chu kỳ bài** (mỗi bài 1 ngày; 3 tháng cuối 2 ngày), không chạy cả hai ⇒ em không phải làm hai bài kiểm tra. Phần lịch + chọn câu của Kiểm tra ôn tập thuộc làn Codex ⇒ bước 4 chia: Claude làm Lộ trình, ngày Sửa, «Vì sao em sai?»; Codex làm lịch và chọn câu Kiểm tra ôn tập.
2. **Chỗ cũ bị thay** (luật không lặp):
   - Dòng «Câu này đã vào lịch ôn 1 · 3 · 7 ngày» ⇒ «Câu này vào nhóm sửa «…»».
   - Thẻ «Em biết câu này. Sai vì bước nào?» (chỉ em sơ ý trên 7%) ⇒ gộp vào «Vì sao em sai?»; chọn «Tính / đọc đề sai» thì hỏi tiếp bước như thẻ cũ.
   - «Làm lại câu sai» cuối chặng: **giữ nguyên** (luyện ngay trong buổi; ngày Sửa là luyện cách ngày).
   - Dòng «Luyện tập › Tự sửa lỗi» và màn Tự sửa lỗi: giữ làm đường xem lại lỗi; số trên dòng đổi thành số nhóm lỗi chưa sạch.
3. **«Lịch Bài 8» (dự kiến các ngày tới) là TUỲ CHỌN** — đề xuất v5 chỉ hứa «Hôm nay: Ngày Mới · Bài … · 28 câu». Thầy gạch thì Lộ trình chỉ còn nhãn loại ngày.
4. **«Vì sao em sai?» bắt buộc chạm một ô** mới bấm Tiếp tục (một chạm; A.I Đỗ Đại Học chọn sẵn khi đoán được bẫy). Thầy muốn không bắt buộc thì em để nút Tiếp tục luôn mở.

## 1. Mục tiêu sư phạm + ai dùng
Học sinh mở app biết ngay **hôm nay làm loại gì, vì sao**: Học mới (28 câu mới đúng ma trận), Kiểm tra ôn tập (đề thi thử trộn bài đã học, đúng dạng em sắp quên), Sửa lỗi (từng nhóm dạng em sai, xem đúng thứ cần xem theo loại lỗi rồi làm câu cùng dạng). Cảm giác: rõ việc, không bị phạt, sai là có đường sửa cụ thể. Thầy không phải làm gì thêm. Phụ huynh vẫn thấy loại ngày và điểm Kiểm tra ôn tập như hiện có.

## 2. Bố cục (điện thoại dọc trước; máy tính bảng 820; máy tính 1366)
| Ảnh | Màn | Việc chính duy nhất |
|---|---|---|
| `dt-sang-1-ngay-moi` (+ `dt-toi-1`, `mt-sang-1`, `mt-toi-1`) | Lộ trình · **Ngày học mới**: thẻ đếm ngược (đã có) → thẻ mức hôm nay mang nhãn loại ngày + tên bài → Lịch bài (tuỳ chọn) → nút chính → Việc hôm nay 5 chặng (6·6·6·6·4 = 28) | «Học tiếp · Chặng 2» |
| `dt-sang-2-sai-co-goi-y` (+ `dt-toi-2`) | Câu sai ở ngày Học mới, câu có dữ liệu bẫy: lời giải bác bỏ «Em nghĩ · Chỗ chưa đúng · Đúng là», «Vì sao em sai?» chọn sẵn «Hiểu nhầm» | «Tiếp tục» |
| `dt-sang-2b-sai-chua-goi-y` | Câu chưa có dữ liệu bẫy: lời giải thường, chưa chọn sẵn; nút «Chọn một lý do để tiếp tục» | chạm một lý do |
| `dt-sang-3-ngay-sua` (+ `mb-sang-3`) | Lộ trình · **Ngày sửa lỗi**: 4 nhóm (8 + 6 + 4 + 10 = 28 câu), mỗi nhóm mang loại lỗi và thứ sẽ xem trước | «Sửa nhóm 1» |
| `dt-sang-4-vi-du-mau` (+ `dt-toi-4`, `mt-sang-4`) | Nhóm «Chưa biết cách» ⇒ **ví dụ mẫu cách thầy làm** (sơ đồ cột dọc, bảo toàn N, một phép tính) | «Em làm câu cùng dạng» |
| `dt-sang-5-cau-cung-dang` | Câu cùng dạng (Trả lời ngắn), chip «Chưa chắc» (mặc định Chắc), «Xem lại ví dụ mẫu» | «Kiểm tra» |
| `dt-sang-6-kiem-tra-dang-lam` | **Kiểm tra ôn tập** câu 7/28: chọn đáp án, «Chưa chắc», không chấm từng câu | «Câu tiếp» |
| `dt-sang-7-kiem-tra-ket-qua` | Kết quả thang Bộ + «Vì sao em sai?» cho từng câu sai | «Lưu lý do · về Lộ trình» |
| `dt-sang-8-trang-thai` | Đang tải · mất mạng · không còn lỗi · hết hạn chưa xong · sai 3 lần · Ngày Kiểm tra ôn tập | — |

Ba loại lỗi xem trước khác nhau (đề xuất v5 mục 3): **Tính / đọc đề sai** ⇒ lời giải chỉ đúng bước em sai, cần đúng 1 lần · **Chưa biết cách** ⇒ ví dụ mẫu, cần đúng 2 lần ở 2 ngày · **Hiểu nhầm** ⇒ lời giải bác bỏ, cần đúng 3 lần ở 3 ngày (lượt 2–3 do Kiểm tra ôn tập gọi). **Học lại** = dạng em đã quên nhiều (R dưới 30%).
Màu theo đúng ánh xạ đang có (`SAC_POP`): học mới chàm (`--tr-hs`), Kiểm tra ôn tập lam ngọc (`--tr-tin`), sửa lỗi hồng (`--tr-sai`). Không thêm màu.

## 3. Trạng thái
- **Đang tải:** khung xương trong thẻ mức hôm nay + «Đang xếp bài hôm nay…».
- **Mất mạng:** «Chưa tải được bài hôm nay» + lý do + «Thử lại»; chặng đã tải trước vẫn làm, câu gửi khi có mạng (hàng đợi nộp hiện có).
- **Không còn lỗi:** ngày đáng là Sửa ⇒ thành Học mới (hoặc Kiểm tra ôn tập nếu đã hết câu mới).
- **Hết hạn chung mà chưa xong:** bài kế mở đầu bằng dải «Còn của Bài 8. Amine: 6 câu mới + 2 nhóm lỗi — làm trước câu của bài mới» (không thẻ báo thầy — thầy chốt 09/11).
- **Sai 3 lần cùng nhóm:** nhóm thành «Học lại»: xem lại ví dụ mẫu từng bước, làm câu dễ hơn cùng dạng rồi mới quay lại câu mức cũ (thay cho «thầy chữa trực tiếp»).
- **Đủ mức / xong hết:** băng «Đủ 28/28 câu hôm nay!» và thẻ chúc mừng như hiện có.

## 4. Dữ liệu (API thật + phần phải thêm ở máy chủ)
Đang có: `TomTatGoi7` (`src/lib/goi-bai-7.ts`: toiThieu, daLamHomNay, goi[]…), `p.ngayKiem` + nhãn «Ngày Kiểm tra ôn tập» (`TrongHs.tsx:1148`), `vaiGoi7` (moi · tiep_can · lam_lai · chua), Kiểm tra ôn tập (`server/src/kiem-tra-ca-nhan*.ts`, điểm, chặng), chẩn đoán bước sai (`server/src/chan-doan-buoc-sai.ts`), lời giải chuẩn / Lời giải Kính.
**Phải thêm (chỉ-thêm, không đổi bảng cũ):**
- Kế hoạch ngày: `loaiNgay: 'moi' | 'kiem' | 'sua'`, chốt một lần mỗi ngày trong `goi_bai_7_ngay` (cột mới) — cùng lúc chốt mức 28.
- Nhóm lỗi: bảng `nhom_loi(sbd, goi_id, dang, o, loai: 'tinh'|'cach'|'nham'|'hoc_lai', luot_can, luot_da, ngay_dung_cuoi, so_sai)`; `vaiGoi7` thêm `'sua'`.
- Độ bền theo dạng: bảng `do_ben_dang(sbd, dang, h, t_cuoi)` (R = 2^(−t/h), đề xuất v5 mục 2).
- Lý do sai: trường `lyDo` gửi kèm lệnh nộp câu (xem mục 6); Kiểm tra ôn tập: ghi một lần khi «Lưu lý do».
- «Chưa chắc»: trường `tuTin: 'chua_chac'` (đã có kiểu ở `src/lib/omni-hs.ts`) đưa vào lệnh nộp câu Sửa và vào `tra_json` của Kiểm tra ôn tập.
- **Bẫy phương án: kho câu CHƯA có** ⇒ cần trường mới `bayPA` (mỗi phương án nhiễu: hiểu nhầm nó bắt) — nguồn: cột «Logic thiết kế phương án nhiễu» của blueprint thầy; câu chưa có ⇒ màn `2b` (không đoán, không bác bỏ). Việc soạn trường này giao Codex (máy soạn câu).
- Ví dụ mẫu theo dạng: dùng lời giải chuẩn đã duyệt của một câu cùng dạng (đánh dấu `viDuMau` trên câu) theo `docs/tu-duy-day-hoa-thay-2610.md`.
- Lịch bài (tuỳ chọn): `lichBai: { ngay, loai, xong, duKien }[]` tính từ hạn chung + số câu mới còn + nhóm lỗi còn — tính sẵn khi chốt ngày, không tính lại mỗi lần mở.

## 5. Ngoại lệ
- Bấm lặp «Kiểm tra» / «Tiếp tục»: nút khoá trong lúc chấm như hiện tại; chạm lý do nhiều lần chỉ giữ lần cuối.
- Mất mạng giữa chừng: lý do sai, «Chưa chắc» đi cùng hàng đợi nộp sẵn có, gửi lại khi có mạng; không mất.
- Đổi tab / tắt app giữa ngày Sửa: mở lại vào đúng nhóm, đúng câu (tiến độ lưu theo câu như chặng hiện nay).
- Chữ / công thức dài (tên dạng 2 dòng, công thức chỉ số dưới): cắt dòng có chủ đích, sơ đồ cột dọc co chữ theo khổ (đã kiểm 390 px không tràn).
- Máy yếu (`ddh.mayYeu`): không hiệu ứng mới; mọi thứ là thẻ phẳng tĩnh.
- Ca kiểm tra trên lớp mở: như hiện tại (khoá chặng, nút Vào ca).

## 6. Chi phí máy chủ + TỐC ĐỘ (thầy 09/11: «giữ nguyên tốc độ app hs tức thì như hiện tại»)
- **Byte mở app: +0.** Nhãn loại ngày chỉ là chữ trong thẻ đã có. Lịch bài nằm trong mảnh Lộ trình đã nạp; màn Sửa, ví dụ mẫu, «Vì sao em sai?», kết quả Kiểm tra ôn tập nằm trong mảnh màn làm bài nạp sau (ngoài precache, có trong kho tải ngầm) — đường `cong-hs` 238,1 KB không tăng.
- **Mở Sảnh: 0 đợt chờ VÀ 0 lệnh D1 thêm** (cổng đếm cả hai, mốc chỉ hạ: `sanh-lan-dau` 12 đợt / 21 lệnh, `sanh-lan-sau` 1 đợt / 2 lệnh). Cách giữ: loại ngày, danh sách nhóm lỗi của ngày và 28 câu chốt MỘT lần ở lần mở đầu ngày, ghi thành cột JSON trên dòng `goi_bai_7_ngay` mà lệnh chốt mức 28 ĐANG ghi (cùng câu lệnh, không câu mới); lần mở sau đọc lại đúng dòng ấy (câu đọc đã có). Độ bền h và nhóm lỗi gốc chỉ đọc ở lần chốt đầu ngày — gộp vào câu đọc lịch sử hiện có của `lapGoi7` (một câu đọc thêm cột), không bảng truy vấn riêng mỗi lần mở; nếu vẫn phải thêm một câu đọc thì bỏ bù một câu đọc cũ trên cùng đường (đo bằng `tests/toc-do-may-chu-lenh-nong-1310.test.ts` trước khi đẩy).
- **Bấm phương án / «Kiểm tra»: tức thì như hiện tại; lệnh nộp câu giữ mốc 3 lệnh.** Câu ngày Mới và ngày Sửa là câu luyện tập ⇒ đi đường chấm trên máy đã niêm phong (`dm`), máy chủ chấm lại. Lý do sai, «Chưa chắc», cập nhật h và nhóm lỗi ghi vào cột JSON của dòng sổ câu mà lệnh nộp ĐANG ghi (cùng câu lệnh); cron đêm tách ra bảng nhóm lỗi / độ bền ⇒ 0 lệnh và 0 lượt mạng thêm ở lúc bấm.
- **Gói câu luyện tập niêm phong (`dm`) to thêm** vì mang lời giải bác bỏ + trường bẫy phương án: gói này nạp khi mở chặng (sau khi mở app, không nằm trên đường mở) — đo cỡ gói trước/sau, chỉ mang câu của chặng đang mở.
- **Kiểm tra ôn tập: đường nộp không đổi; đáp án và lời giải KHÔNG xuống máy trước khi nộp.**
- **Cron:** chỉ gom số đêm; mỗi phút không đọc thêm bảng lịch sử.

## 7. Nghiệm thu đo bằng máy (khi build)
- Test mới: `tests/loai-ngay-0911.test.ts` (chốt loại ngày: còn câu mới ⇒ Mới; có lỗi sau 2 Mới ⇒ Sửa; tới lượt Ôn ⇒ Kiểm tra; không lỗi ⇒ không Sửa; hết hạn ⇒ nợ lên đầu bài sau), `tests/nhom-loi-0911.test.ts` (gộp nhóm theo dạng × ô; 1/2/3 lượt theo loại; sai lại ⇒ nâng loại; sai 3 lần ⇒ Học lại; tổng ngày Sửa = 28 câu đúng ma trận), `tests/vi-sao-sai-0911.test.tsx` (chọn sẵn khi có bẫy, bắt buộc chạm, gửi kèm lệnh nộp kế), `tests/toc-do-may-chu-lenh-nong-1310.test.ts` (mốc đợt chờ không tăng).
- `npm run kiem:toc-do` 0 đỏ (byte mở 3 app không tăng); `npm run kiem:mau-giu` 0; `node scripts/kiem-sw.mjs` 14/14, precache ≤ 170.
- **Tác tử `toc-do` đo trước/sau** (chạm được, bấm phương án, «Kiểm tra», chuyển câu, khung cuộn, CPU ×1/×4/×6 + Slow 3G, đợt chờ D1): không chỉ số nào chậm hơn bản trước — chưa đạt thì chưa phát hành.
- Ảnh Chromium sau build ở 390 / 820 / 1366, sáng + tối: 0 lỗi trang, 0 tràn ngang, 0 đích bấm < 44 px (bản vẽ này đã đạt cả 16 khung).

## Số trong bản vẽ (đã tính lại)
- Ví dụ mẫu: n(CH₃NH₂) = 9,3 / 31 = 0,3 mol; M(CH₃NH₃Cl) = 12 + 6 + 14 + 35,5 = 67,5; m = 0,3 × 67,5 = 20,25 g (kiểm chéo bảo toàn khối lượng: 9,3 + 0,3 × 36,5 = 20,25 g).
- Câu cùng dạng: C₃H₇NH₂ M = 59 ⇒ 11,8 / 59 = 0,2 mol; muối C₃H₇NH₃Cl M = 95,5 ⇒ 19,1 g (số em gõ trên bản vẽ; đáp án không hiện trước khi chấm).
- Kết quả Kiểm tra ôn tập thang Bộ: Trắc nghiệm 15/18 × 0,25 = 3,75; Đúng–sai 4 câu đúng 4·3·4·2 ý = 1 + 0,5 + 1 + 0,25 = 2,75; Trả lời ngắn 4/6 × 0,25 = 1,0 ⇒ 7,5/10; câu sai = 3 + 2 + 2 = 7.
- Câu 25 (ester hoá, H = 60%): 6 g CH₃COOH ⇒ 0,1 mol ⇒ 0,1 × 88 × 0,6 = 5,28 g.
- Ngày: 10/11/2026 Thứ Ba, 11/11 Thứ Tư, 17/11 Thứ Ba; đếm ngược 224 (10/11), 223 (11/11).
