# ĐẶC TẢ — Thẻ «Nợ câu»: nợ cộng dồn, trả tối thiểu kiểu ngân hàng (11/11/2026)

Trạng thái: **THẦY DUYỆT 11/11 («Duyệt build đẩy lên bản sống luôn») — ĐÃ BUILD.** Thầy thêm cùng ngày: «Tính lãi như ngân hàng luôn nhé» ⇒ luật lãi ở mục 4. Ảnh của bản đã build (component thật): thư mục `that/` (`node docs/ban-ve-lam-bu-1111/chup-that.mjs <thư mục build chup-v2>`).
Thầy 11/11: «hiện thẻ làm bù bất kì câu mới ôn sửa cộng dồn và bắt làm bù trước rồi mới đến câu mới … Đếm theo câu … cho phép học sinh làm tối thiểu (tự tính toán) giống như trả tối thiểu của ngân hàng. Ghi rõ đang nợ bao nhiêu câu, bấm vào chọn được trả tối thiểu bao nhiêu câu thì được làm câu mới hoặc trả hết … tối đa 3 ngày nợ tối thiểu, đến ngày thứ tư phải trả hết mới được làm tiếp. Vẽ tôi xem rồi build».

Thầy 11/11 (sau bản vẽ lần 1): «Ghi rõ nợ câu nhé theo cơ chế trả tối thiểu kiểu ngân hàng nhé» ⇒ bản vẽ lần 2: nhãn thẻ «Nợ câu», nút chính «Trả nợ câu trước», tối thiểu = 25 % số nợ còn lại (sàn 6 câu) thay cho «chia đều số lần còn lại».

Bản vẽ: 9 ảnh Chromium thật trong thư mục này — chụp trên CHÍNH màn Hôm nay của app (component thật, dữ liệu giả), thẻ «Làm bù» là phần vẽ thêm. Chạy lại: `node docs/ban-ve-lam-bu-1111/chup.mjs <thư mục build chup-v2>`.

## 1. Mục tiêu và người dùng
- **Học sinh:** thiếu câu ngày nào thì thấy rõ mình nợ bao nhiêu, phải trả trước khi học tiếp; được trả dần nên không bị dồn tới mức bỏ.
- **Thầy, phụ huynh:** thấy em đang nợ bao nhiêu câu (đợt 2, sau khi thẻ của em chạy ổn).
- Cảm giác cần đạt: rõ ràng, công bằng, có lối ra. Không doạ.

## 2. Bố cục
- **Có nợ, hôm nay chưa trả** (ảnh `dt-sang-1`, `dt-sang-2`, `mb-sang-1`, `mt-sang-1`): lời chào → **thẻ Nợ câu** → **nút chính** «Trả nợ câu trước» → thẻ mức hôm nay. Nút chính nằm trọn trong màn đầu của điện thoại cao 844 px. Hôm nay vẫn chỉ MỘT nút chính.
- Thẻ: nhãn «Nợ câu» · chip số lần trả tối thiểu · số lớn «N câu đang nợ» · dòng theo loại (Câu mới · Câu sửa · Câu ôn) · hai ô chọn «Trả tối thiểu» / «Trả hết» · một dòng luật.
- Chọn ô nào thì nút chính đổi theo: «Trả tối thiểu · 11 câu» hoặc «Trả hết · 42 câu».
- **Đã trả tối thiểu hôm nay** (ảnh `dt-sang-3`): thẻ mức và nút chính về chỗ cũ (nút chính là bài hôm nay); thẻ gọn «Còn nợ 31 câu» + nút phụ «Trả thêm» nằm dưới nút chính.
- **Hết 3 lần trả tối thiểu** (ảnh `dt-sang-4`, `dt-toi-4`): thẻ đổi sang màu báo sai, chỉ còn ô «Trả hết».
- Màu: chỉ dùng biến sẵn có của app học sinh (chú ý — cam; sai — hồng). Không thêm màu.

## 3. Trạng thái
| Trạng thái | Màn |
|---|---|
| Không nợ | Không có thẻ; màn Hôm nay y như hiện nay |
| Có nợ, chưa trả hôm nay | Thẻ đầy đủ, nút chính «Trả nợ câu trước»; bài hôm nay chưa mở |
| Đang trả nợ | Màn làm bài hiện có, nhãn chặng «Trả nợ câu · x/N câu» |
| Đã trả đủ số đã chọn | Thẻ gọn; bài hôm nay mở |
| Hết 3 lần trả tối thiểu | Chỉ còn «Trả hết» |
| Trả hết | Thẻ biến mất; Mol khen một lần |
| Ngày Kiểm tra ôn tập | Bài kiểm tra đi trước (có hạn 24:00); thẻ gọn nằm dưới, làm bù sau khi nộp |
| Đang tải / mất mạng | Chưa có số thì chưa vẽ thẻ (không nhấp nháy); mất mạng giữ số đọc gần nhất, không cho đổi lựa chọn |

## 4. Luật tính (đếm theo câu)
**Nợ phát sinh.** Hết một ngày, thiếu = mức của ngày (28) − số câu em đã làm của ngày đó. Phần thiếu cộng vào nợ, ghi theo loại ngày: ngày Học mới → «Câu mới», ngày Sửa → «Câu sửa», ngày Kiểm tra ôn tập (phần chưa trả lời) và ngày ôn → «Câu ôn».

**Không phát sinh nợ:** các ngày trước khi bật tính năng; ngày em không mở app mà cũng không có bài nào đang trong hạn (lớp chưa được giao bài, nghỉ giữa hai bài — ngày ấy cũng không tính lãi); ngày kho hết câu (mức đã hạ).

**Trần nợ: 84 câu** (3 ngày). Vượt trần không cộng thêm; câu vẫn nằm trong hàng chờ của em, không mất.

**Trả tối thiểu kiểu ngân hàng** = 25 % số nợ còn lại, làm tròn lên, không dưới 6 câu (nợ dưới 6 thì trả hết luôn). Được trả tối thiểu tối đa 3 lần; ngày thứ tư phải trả hết. Ví dụ nợ 42 câu, mỗi ngày làm đủ bài hôm nay:

| Lần | Nợ đầu ngày | Tối thiểu (25 %, sàn 6) | Còn nợ | Lãi đêm ấy (5 %) | Nợ sáng hôm sau |
|---|---|---|---|---|---|
| 1 | 42 | 11 | 31 | 2 | 33 |
| 2 | 33 | 9 | 24 | 2 | 26 |
| 3 | 26 | 7 | 19 | 1 | 20 |
| Ngày thứ tư | 20 | phải trả hết 20 | 0 | 0 | 0 |

Tổng em trả 47 câu cho khoản nợ 42 câu: 5 câu là lãi. Trả hết ngay ngày đầu thì chỉ 42 câu.

**LÃI kiểu ngân hàng (thầy 11/11 «Tính lãi như ngân hàng luôn»).** Mỗi đêm, số nợ CÒN LẠI sau phần em đã trả trong ngày bị cộng **5 %**, làm tròn lên (còn nợ là có ít nhất 1 câu lãi). Chi tiết:
- Trả hết thì không có lãi.
- Phần thiếu của chính ngày hôm ấy được **miễn lãi đêm đầu** (như khoản mới phát sinh của thẻ ngân hàng): thiếu hôm nay, mai trả hết thì không mất câu lãi nào.
- Lãi cộng vào nợ, đêm sau tính lãi trên cả gốc lẫn lãi (lãi kép). Nợ kể cả lãi không vượt trần 84 câu.
- Trả nợ thì trừ lãi trước, gốc sau.
- Ngày Kiểm tra ôn tập không tính lãi (ngày ấy em chỉ làm bài kiểm tra, không trả nợ được).
- **Câu lãi lấy từ đâu (thầy 11/11: «số câu lãi lấy từ đâu cho hợp lý và cá nhân hoá cho học sinh nhất»):** lãi là giá của việc để lâu, mà thứ mất đi khi để lâu là trí nhớ ⇒ câu lãi là **câu ÔN của chính em**, không bao giờ là câu mới. Thứ tự lấy: (1) câu ôn đã đến hạn của em, xếp theo «nợ ôn theo dạng» — dạng em vừa sai hoặc lâu chưa làm lên đầu, mỗi dạng một câu rồi mới tới câu thứ hai; (2) chưa đủ thì câu em đã làm ở các bài trước (ôn sớm), cùng cách xếp; (3) hết cả hai mới tới câu em đang sai chưa sửa. Câu lãi đứng ĐẦU đề của ngày (trả lãi trước, gốc sau) và vẫn nằm trong đúng suất phần × mức của đề. Mã: `server/src/goi-bai-7-loi.ts` (khối `suat`, tham số `lai`), số câu lãi còn phải trả hôm nay = lãi nằm trong số đã chọn trả − số đã trả.
- Thẻ ghi rõ lãi: «Lãi 2» trong dòng theo loại, và «đêm nay cộng 2 câu» nếu em chỉ trả tối thiểu.

**Đếm lần trả tối thiểu:** mỗi ngày em để ở «Trả tối thiểu» và có làm bài (từ 1 câu) mà chưa hết nợ = 1 lần — làm chưa đủ số tối thiểu cũng tính (không lách được bằng cách trả thiếu). Trả hết nợ thì đếm lại từ 0. Ngày em không làm câu nào không mất lần, nhưng nợ vẫn tăng (tới trần).

**Thứ tự trong ngày — MỘT CON SỐ:** mức hôm nay = 28 + số câu trả nợ đã chọn (ví dụ 39). Câu em làm đầu tiên trong ngày tính vào trả nợ cho tới khi đủ số đã chọn, sau đó mới tính vào 28 câu hôm nay. Hôm nay làm thiếu thì phần thiếu thành nợ ngày mai. Làm VƯỢT mức hôm nay (học thêm) bao nhiêu câu thì nợ giảm thêm bấy nhiêu.

**Câu trả nợ là câu nào:** rút từ hàng chờ của chính em bằng đúng luật đề theo suất (`rut28`) của hôm nay; mức 39 câu thì 7 ô của đề chia đúng tỉ lệ đề 28 (17 · 5 · 3 · 3 · 3 · 4 · 4). Không có loại phiên riêng. KHÁC bản vẽ: không ưu tiên riêng «loại của khoản nợ cũ nhất» — số theo loại trên thẻ chỉ cho biết nợ sinh ra từ ngày loại nào; câu thật vẫn theo hàng chờ của em (câu mới chưa học, câu sai chưa sửa, dạng tới hạn ôn).

**Chuỗi và thưởng:** giữ chuỗi khi làm đủ mức hôm nay (số trả nợ đã chọn + 28). Câu trả nợ được nguyên tử như câu thường.

**Nói thẳng:** ngày có nợ em làm nhiều hơn 28 câu. Trả tối thiểu: 28 + khoảng 6–21 câu (25 % của tối đa 84). Trả hết một lần ở mức trần: 28 + 84 = 112 câu. Có lãi nên càng trả chậm càng phải làm nhiều câu hơn.

## 5. Ngoại lệ
- Em bấm đổi lựa chọn: đổi qua lại được trong ngày khi chưa hết 3 lần trả tối thiểu (mức hôm nay đổi theo). Câu đã làm không mất: sổ nợ đếm theo tổng số câu em làm trong ngày.
- Bấm lặp nút chính: lệnh chọn có khoá chống lặp (như lệnh mở chặng).
- Qua nửa đêm khi đang làm bù: câu đã làm tính cho ngày em làm; ngày mới tính lại nợ.
- Ca kiểm tra trên lớp đang mở: không bị nợ chặn.
- Hàng chờ của em không đủ câu để trả (kho hết): phần không trả được tự xoá khỏi nợ.
- Thầy sửa / rút câu của bài: nợ đếm theo số câu, không gắn mã câu ⇒ không lệch.

## 6. Dữ liệu và chi phí máy chủ
- Hai bảng CHỈ-THÊM (goi-bai-7-schema.ts): `goi_bai_7_no_em(sbd, no, lan, loai_json, den_ngay, luc)` (sổ nợ của em: nợ đầu ngày kế sau `den_ngay`, số lần đã trả tối thiểu, nợ theo loại kể cả lãi) và `goi_bai_7_no_chon(sbd, ngay, kieu, so, goc, luc)` (lựa chọn mỗi ngày; `goc` = mức gốc của ngày, mức hôm nay = goc + so).
- Sổ nợ + lựa chọn hôm nay đọc CÙNG câu đọc mức ngày ⇒ ngày thường **0 đợt chờ D1 thêm** trên lệnh nóng. Riêng lần lập ĐẦU TIÊN của ngày (thường là lượt lập sẵn ban đêm, không ai chờ) thêm 1 lô đọc các ngày đã qua + 1 lô ghi (chốt nợ, lựa chọn mặc định «trả tối thiểu», nâng mức hôm nay). Không chốt trong 2 phút đầu ngày (chờ dòng sổ của câu làm lúc 23:59).
- Tóm tắt trả về trong `goi7.noCau = { no, con, theoLoai: { moi, sua, on, lai }, toiThieu, lan, phaiTraHet, kieu, so, daTra, lai, laiDemNay }`. Một lệnh mới `hoc-tap-no-cau-chon { kieu: 'toi_thieu' | 'het' }`. Mã: `server/src/no-cau.ts` (luật thuần), `server/src/no-cau-d1.ts`, `src/components/hoc-tap/TheNoCau.tsx` (mảnh lười), `src/lib/no-cau-doc.ts`.
- Kế hoạch ngày: số câu cần = số đã chọn trả + 28, vẫn qua `rut28`. Đáp án không xuống máy trước khi nộp — như mọi chặng hiện nay.

## 7. Nghiệm thu đo bằng máy
- `tests/no-cau-1111.test.ts` — luật thuần: phát sinh nợ, trần 84, lãi 5 %, tối thiểu 42 → 11 · 9 · 7 rồi ngày thứ tư trả hết 20, trả hết thì đếm lại, sàn 6 câu, suất chia theo tỉ lệ khi mức > 28.
- `tests/no-cau-may-chu-1111.test.ts` — chốt nợ một lần mỗi ngày, mức hôm nay = 28 + số trả, lập lại không cộng dồn, lệnh đổi lựa chọn, em vắng nhiều ngày tới trần, bảng hỏng thì học như cũ.
- `tests/no-cau-giao-dien-1111.test.tsx` — bộ đọc chặt, số sống khớp máy chủ, bốn trạng thái của thẻ, bấm ô chọn gửi đúng lệnh rồi nạp lại Sảnh.
- `npm run build && npm run kiem:toc-do` 0 đỏ; `npm run kiem:mau-giu` 0; `npm run check:mau`.
- Ảnh Chromium của 9 khung trên component THẬT (`that/`): 0 lỗi trang, 0 tràn ngang, 0 đích bấm dưới 44 px; nút chính nằm trọn trong màn đầu điện thoại 844 px (đáy nút 692–710).

## 8. Những điều em tự chọn — thầy muốn khác thì nói
1. Trần nợ 84 câu.
2. Tối thiểu = 25 % số nợ còn lại, sàn 6 câu. Lãi 5 % mỗi đêm trên số còn nợ, làm tròn lên; miễn lãi đêm đầu cho phần thiếu mới; ngày Kiểm tra ôn tập không tính lãi.
3. «3 ngày» đếm theo số lần em thật sự trả tối thiểu, không đếm ngày em vắng.
4. Ngày Kiểm tra ôn tập: bài kiểm tra đi trước, làm bù sau.
5. Bài Kiểm tra ôn tập bỏ lỡ (không nộp): 28 câu thành nợ «Câu ôn»; đã nộp thì không nợ, kể cả còn câu bỏ trống (đã tính vào điểm). Điểm bài đó vẫn chốt như hiện nay.
6. Chưa trừ ngày nghỉ có phép (app chưa có chỗ thầy đánh dấu cho việc này).
7. Nợ tính từ ngày đầu tiên em mở app sau khi phát hành (11/11); các ngày trước đó không tính. Em vắng lâu: chỉ xét 7 ngày gần nhất (đằng nào cũng chạm trần 84).
8. Số lớn trên thẻ mức là tổng của ngày (ví dụ 0/39 câu), dòng dưới ghi «Trả nợ 11 câu trước, rồi tới 28 câu hôm nay» — bản vẽ ghi 0/28; đổi để số trên thẻ, bình và các chặng là MỘT con số.
9. Thẻ gọn (đã trả tối thiểu): nút «Trả hết» thay cho «Trả thêm»; đã đủ mức hôm nay thì thẻ nhắc «học thêm câu nào, nợ giảm câu ấy» (không đổi mức, không ảnh hưởng chuỗi).

## 9. Thầy và phụ huynh xem nợ câu từng em (thầy 11/11: «Làm tiếp cho thầy và phụ huynh xem nợ câu từng em»)
- **App thầy** — bảng «Bài hằng ngày» (Hôm nay › Nhịp học › Xem bảng từng ngày): em đang nợ có dòng «Nợ N câu» ngay dưới tên (hết 3 lần trả tối thiểu: «Nợ N câu · phải trả hết», nền đậm). Rê chuột / trình đọc màn hình đọc câu đầy đủ: nợ đầu ngày theo loại, số lần đã trả tối thiểu, hôm nay em chọn gì và đã trả bao nhiêu (hoặc «Hôm nay em chưa mở app»), lãi đêm nay. Trên bảng có dòng tổng «N em đang nợ câu · tổng X câu».
- **App phụ huynh** — trang «Hôm nay của con», ngay dưới số câu hôm nay: khối «Con đang nợ N câu» + nợ theo loại + hôm nay con chọn trả gì, đã trả bao nhiêu + luật lãi và số lần trả tối thiểu còn lại. Con không nợ thì không có khối.
- **Một con số cho ba bên:** hai lệnh `/gv/bai-hang-ngay` và `/ph/con-tong-quan` dùng chung một hàm đọc; sổ nợ đọc CÙNG lệnh đọc mức Gói 7 (0 lệnh D1 thêm, 0 đợt chờ thêm) và tính bằng đúng luật của học sinh (`server/src/no-cau-xem.ts`). Em chưa mở app từ sau ngày chốt sổ: máy tính tiếp các ngày đã qua bằng cùng luật (tối đa 7 ngày) ⇒ con số thầy / phụ huynh thấy là con số em sẽ thấy khi mở app.
- Em chưa từng mở app từ sau ngày phát hành (chưa có sổ nợ) thì chưa hiện nợ — đúng luật «nợ tính từ ngày đầu em mở app».
- Ảnh thật: `thay-ph/` (9 khung; `node docs/ban-ve-lam-bu-1111/chup-thay-ph.mjs <thư mục build chup-v2>`). Test: `tests/no-cau-xem-1111.test.ts`, thêm ca trong `tests/bai-hang-ngay-gv-1210.test.tsx`, `tests/ph-con-tong-quan-man-1210.test.tsx`.

## 10. Chưa làm
- Nhãn chặng «Trả nợ câu · x/N câu» trong màn làm bài; lời khen của Mol khi trả hết.
- Trừ ngày nghỉ có phép.

