# ĐẶC TẢ — Thẻ «Làm bù»: nợ câu cộng dồn, trả tối thiểu như ngân hàng (11/11/2026)

Trạng thái: **CHỜ THẦY DUYỆT ẢNH — CHƯA BUILD.**
Thầy 11/11: «hiện thẻ làm bù bất kì câu mới ôn sửa cộng dồn và bắt làm bù trước rồi mới đến câu mới … Đếm theo câu … cho phép học sinh làm tối thiểu (tự tính toán) giống như trả tối thiểu của ngân hàng. Ghi rõ đang nợ bao nhiêu câu, bấm vào chọn được trả tối thiểu bao nhiêu câu thì được làm câu mới hoặc trả hết … tối đa 3 ngày nợ tối thiểu, đến ngày thứ tư phải trả hết mới được làm tiếp. Vẽ tôi xem rồi build».

Bản vẽ: 9 ảnh Chromium thật trong thư mục này — chụp trên CHÍNH màn Hôm nay của app (component thật, dữ liệu giả), thẻ «Làm bù» là phần vẽ thêm. Chạy lại: `node docs/ban-ve-lam-bu-1111/chup.mjs <thư mục build chup-v2>`.

## 1. Mục tiêu và người dùng
- **Học sinh:** thiếu câu ngày nào thì thấy rõ mình nợ bao nhiêu, phải trả trước khi học tiếp; được trả dần nên không bị dồn tới mức bỏ.
- **Thầy, phụ huynh:** thấy em đang nợ bao nhiêu câu (đợt 2, sau khi thẻ của em chạy ổn).
- Cảm giác cần đạt: rõ ràng, công bằng, có lối ra. Không doạ.

## 2. Bố cục
- **Có nợ, hôm nay chưa trả** (ảnh `dt-sang-1`, `dt-sang-2`, `mb-sang-1`, `mt-sang-1`): lời chào → **thẻ Làm bù** → **nút chính** «Làm bù trước» → thẻ mức hôm nay. Nút chính nằm trọn trong màn đầu của điện thoại cao 844 px. Hôm nay vẫn chỉ MỘT nút chính.
- Thẻ: nhãn «Câu làm bù» · chip số lần trả tối thiểu · số lớn «N câu đang nợ» · dòng theo loại (Câu mới · Câu sửa · Câu ôn) · hai ô chọn «Trả tối thiểu» / «Trả hết» · một dòng luật.
- Chọn ô nào thì nút chính đổi theo: «Trả tối thiểu · 11 câu» hoặc «Trả hết · 42 câu».
- **Đã trả tối thiểu hôm nay** (ảnh `dt-sang-3`): thẻ mức và nút chính về chỗ cũ (nút chính là bài hôm nay); thẻ gọn «Còn nợ 31 câu» + nút phụ «Trả thêm» nằm dưới nút chính.
- **Hết 3 lần trả tối thiểu** (ảnh `dt-sang-4`, `dt-toi-4`): thẻ đổi sang màu báo sai, chỉ còn ô «Trả hết».
- Màu: chỉ dùng biến sẵn có của app học sinh (chú ý — cam; sai — hồng). Không thêm màu.

## 3. Trạng thái
| Trạng thái | Màn |
|---|---|
| Không nợ | Không có thẻ; màn Hôm nay y như hiện nay |
| Có nợ, chưa trả hôm nay | Thẻ đầy đủ, nút chính «Làm bù trước»; bài hôm nay chưa mở |
| Đang làm bù | Màn làm bài hiện có, nhãn chặng «Làm bù · x/N câu» |
| Đã trả đủ số đã chọn | Thẻ gọn; bài hôm nay mở |
| Hết 3 lần trả tối thiểu | Chỉ còn «Trả hết» |
| Trả hết | Thẻ biến mất; Mol khen một lần |
| Ngày Kiểm tra ôn tập | Bài kiểm tra đi trước (có hạn 24:00); thẻ gọn nằm dưới, làm bù sau khi nộp |
| Đang tải / mất mạng | Chưa có số thì chưa vẽ thẻ (không nhấp nháy); mất mạng giữ số đọc gần nhất, không cho đổi lựa chọn |

## 4. Luật tính (đếm theo câu)
**Nợ phát sinh.** Hết một ngày, thiếu = mức của ngày (28) − số câu em đã làm của ngày đó. Phần thiếu cộng vào nợ, ghi theo loại ngày: ngày Học mới → «Câu mới», ngày Sửa → «Câu sửa», ngày Kiểm tra ôn tập (phần chưa trả lời) và ngày ôn → «Câu ôn».

**Không phát sinh nợ:** các ngày trước khi bật tính năng; ngày em chưa có bài; ngày kho hết câu (mức đã hạ).

**Trần nợ: 84 câu** (3 ngày). Vượt trần không cộng thêm; câu vẫn nằm trong hàng chờ của em, không mất.

**Trả tối thiểu** = ⌈nợ ÷ (4 − số lần đã trả tối thiểu)⌉, không dưới 6 câu (nợ dưới 6 thì trả hết luôn). Ví dụ nợ 42 câu, mỗi ngày làm đủ bài hôm nay:

| Lần | Nợ đầu ngày | Tối thiểu | Còn nợ |
|---|---|---|---|
| 1 | 42 | 11 | 31 |
| 2 | 31 | 11 | 20 |
| 3 | 20 | 10 | 10 |
| Ngày thứ tư | 10 | phải trả hết 10 | 0 |

**Đếm lần trả tối thiểu:** mỗi ngày em chọn trả tối thiểu và làm đủ số đó = 1 lần. Trả hết nợ thì đếm lại từ 0. Ngày em không mở app không mất lần, nhưng nợ vẫn tăng (tới trần).

**Thứ tự trong ngày:** làm bù đủ số đã chọn → mới mở 28 câu hôm nay. Hôm nay làm thiếu thì phần thiếu thành nợ ngày mai.

**Câu làm bù là câu nào:** rút từ hàng chờ của chính em bằng đúng luật đề theo suất (`rut28`), ưu tiên loại của khoản nợ cũ nhất; hết loại đó thì lấy loại kế. Câu đầu tiên em làm trong ngày tính vào trả nợ cho tới khi đủ số đã chọn — không cần loại phiên riêng.

**Chuỗi và thưởng:** giữ chuỗi khi làm đủ 28 câu của hôm nay (sau phần trả). Câu làm bù được nguyên tử như câu thường.

**Nói thẳng:** ngày có nợ em làm nhiều hơn 28 câu. Trả tối thiểu: 28 + khoảng 6–21 câu. Trả hết một lần ở mức trần: 28 + 84 = 112 câu.

## 5. Ngoại lệ
- Em bấm đổi lựa chọn sau khi đã bắt đầu làm bù: được đổi từ tối thiểu lên trả hết; không được đổi ngược sau khi đã vượt số tối thiểu.
- Bấm lặp nút chính: lệnh chọn có khoá chống lặp (như lệnh mở chặng).
- Qua nửa đêm khi đang làm bù: câu đã làm tính cho ngày em làm; ngày mới tính lại nợ.
- Ca kiểm tra trên lớp đang mở: không bị nợ chặn.
- Hàng chờ của em không đủ câu để trả (kho hết): phần không trả được tự xoá khỏi nợ.
- Thầy sửa / rút câu của bài: nợ đếm theo số câu, không gắn mã câu ⇒ không lệch.

## 6. Dữ liệu và chi phí máy chủ
- Hai bảng CHỈ-THÊM: `lam_bu_no(sbd, ngay, loai, so, luc)` (khoản nợ từng ngày) và `lam_bu_chon(sbd, ngay, kieu, so, luc)` (lựa chọn mỗi ngày).
- Chốt nợ của các ngày trước ở lần mở app đầu tiên trong ngày, ghi CÙNG lô với dòng mức 28; đọc CÙNG câu đọc mức ngày ⇒ **0 đợt chờ D1 thêm** trên lệnh nóng.
- Tóm tắt trả về trong `goi7.lamBu = { no, theoLoai, toiThieu, lanToiThieu, chon, daTraHomNay }`. Một lệnh mới `hoc-tap-lam-bu-chon { kieu: 'toi_thieu' | 'het' }`.
- Kế hoạch ngày: số câu cần = số đã chọn trả + 28, vẫn qua `rut28`. Đáp án không xuống máy trước khi nộp — như mọi chặng hiện nay.

## 7. Nghiệm thu đo bằng máy
- `tests/lam-bu-1111.test.ts` — luật thuần: phát sinh nợ, trần 84, tối thiểu 42 → 11 · 11 · 10 · 10, lần thứ tư phải trả hết, trả hết thì đếm lại, sàn 6 câu.
- `tests/lam-bu-may-chu-1111.test.ts` — chốt nợ một lần mỗi ngày, cổng «chưa trả đủ thì chưa mở bài hôm nay», ngày Kiểm tra ôn tập không bị chặn.
- `tests/lam-bu-giao-dien-1111.test.tsx` — bốn trạng thái của thẻ, chỉ một nút chính, đổi lựa chọn thì nút chính đổi theo.
- `npm run build && npm run kiem:toc-do` 0 đỏ; `npm run kiem:mau-giu` 0; `npm run check:mau`.
- Ảnh Chromium của 9 khung: 0 lỗi trang, 0 tràn ngang, 0 đích bấm dưới 44 px (đã đạt ở bản vẽ).

## 8. Sáu điều em tự chọn — thầy muốn khác thì nói
1. Trần nợ 84 câu.
2. Tối thiểu chia đều cho số lần còn lại (nợ ÷ 4, rồi ÷ 3, ÷ 2), sàn 6 câu.
3. «3 ngày» đếm theo số lần em thật sự trả tối thiểu, không đếm ngày em vắng.
4. Ngày Kiểm tra ôn tập: bài kiểm tra đi trước, làm bù sau.
5. Bài Kiểm tra ôn tập bỏ lỡ: phần chưa làm thành nợ «Câu ôn»; điểm bài đó vẫn chốt như hiện nay.
6. Chưa trừ ngày nghỉ có phép (app chưa có chỗ thầy đánh dấu cho việc này).
