# ĐỀ XUẤT (bản 2) — "BỘ NÃO AI" chạy NGAY TRÊN MÁY THẦY, phối hợp 4 tầng với thuật toán

Người viết: Boss · 21/09/2026 · CHỜ THẦY CHỐT (chưa build gì).
Thầy quyết: bộ não chạy trong phiên Claude trên máy thầy (máy bật 24/7), không dùng API trả tiền riêng. Bản này thiết kế lại theo quyết định đó và vá trước các điểm yếu của cách chạy tại máy.

## 1 · BỐN TẦNG THÔNG MINH — mỗi tầng làm đúng việc nó giỏi nhất
| Tầng | Ai | Khi nào | Làm gì |
|---|---|---|---|
| **T1 · Trọng tài** | Thuật toán trong app | Tức thì, lúc em mở bài | Chọn đúng câu theo lõi, bậc thang, chặng (BTVN nâng đỡ đang build). Tất định, công bằng, 0 đồng. |
| **T2 · Trợ lý số liệu** | Thuật toán trên máy chủ | 03:30 mỗi đêm | Tính đặc trưng từng em (xu hướng 7 ngày, tốc độ, bỏ dở, lặp lỗi), ĐO hiệu quả điều chỉnh hôm qua, và **PHÂN LUỒNG**: em nào ổn ⇒ để T1 tự lo; em nào "cần một bộ óc nhìn vào" (tụt nhịp, sai lặp một kiểu, đúng nhanh bất thường, kẹt bậc > 5 ngày, vừa thi xong, mới vào lớp) ⇒ chuyển T3. |
| **T3 · Huấn luyện viên AI** | Phiên Claude hẹn giờ trên máy thầy | 04:00 mỗi đêm | Đọc hồ sơ các em được chuyển lên + bức tranh cả lớp → VẶN NÚM cho từng em, viết lời nhắn cho em, viết bản tin sáng cho thầy, ghi "bài học" vào sổ tay huấn luyện. |
| **T4 · Trưởng ban** | Phiên Boss | Chủ nhật hằng tuần | Đọc sổ tay + số đo của T2 ⇒ đề xuất SỬA THAM SỐ của chính thuật toán T1/T2 (kèm bằng chứng), thầy duyệt mới đổi. Đây là chỗ AI làm thuật toán **khôn dần theo lớp của thầy**. |

Nguyên tắc giữ nguyên: **AI không chọn mã câu** — AI vặn núm, thuật toán chọn câu. T3 không chạy (máy tắt, hết lượt dùng) ⇒ app chạy y như thường, không em nào bị ảnh hưởng.

## 2 · CHẠY TẠI MÁY THẦY THẾ NÀO CHO CHẮC
- **Mỗi đêm một phiên MỚI TINH** bằng công cụ hẹn giờ của app (đã có sẵn), không dùng một phiên chat dài: không đầy bộ nhớ, không trôi ngữ cảnh. "Trí nhớ" nằm ở tệp: `bo-nao/so-tay/` (bài học rút ra, ≤ 2.000 chữ, T3 đọc đầu mỗi đêm) + ghi chú HLV 1–2 dòng cho từng em lưu ở máy chủ.
- **Ba bước cố định mỗi đêm**, hai đầu là mã lệnh, giữa mới là AI:
  1. `lay-ho-so-ngay`: tải hồ sơ ngày (đã qua T2) về `bo-nao/<ngày>/vao/` — **ẩn danh**: tệp mang bí danh, bảng bí danh ↔ SBD nằm riêng, AI không mở.
  2. AI đọc theo nhóm 15 em (chia cho các trợ lý con chạy song song, mô hình nhỏ; phần tổng hợp cả lớp dùng mô hình lớn) → ghi JSON đúng khuôn vào `bo-nao/<ngày>/ra/`.
  3. `kiem-va-nop`: kiểm khuôn + biên độ + từ cấm + đối chiếu mọi con số trong lời nhắn ⇒ đổi bí danh về SBD ⇒ nộp lên MỘT lệnh hẹp của máy chủ; máy chủ kiểm LẦN NỮA rồi mới lưu. Sai khuôn là bỏ, không sửa hộ.
- **Mã bí mật của thầy**: nằm trong một tệp riêng ngoài kho mã do THẦY tự đặt một lần; chỉ hai mã lệnh trên đọc, không in ra, AI không bao giờ thấy.
- **Quyền**: phiên bộ não chỉ được chạy đúng 2 mã lệnh đó và đọc/ghi trong thư mục `bo-nao/`. Thầy bấm cho phép MỘT lần lúc cài (tôi không tự cấp quyền cho mình được).
- **Máy ngủ / app đóng**: bật "giữ máy thức" của app; lỡ một đêm thì lượt sau chạy bù ngày thiếu; màn Hôm nay hiện "Bộ não chạy lần cuối: …", quá 36 giờ thì nhắc thầy. Điều chỉnh tới trễ thì áp vào kế hoạch của em nào CHƯA mở app hôm đó, em đã mở thì áp từ chặng kế.
- **Tiết kiệm lượt dùng**: nhờ T2 phân luồng, mỗi đêm AI chỉ đọc ~20–30 % số em (60–90 em / 300) + một trang tổng hợp lớp ⇒ ước 150–250 nghìn token/đêm, nằm trong gói thầy đang dùng, không phát sinh tiền API.

## 3 · AI ĐỌC GÌ
Mỗi em ≤ ~1.200 token, không tên/SBD: 7 ngày theo dạng (gặp/đúng/sai/bậc, lên hay tụt) · các câu sai gần đây: chọn nhầm phương án nào, giây so với trung vị của chính em · chặng BTVN: xong/bỏ dở ở câu mấy, giờ làm · lịch ôn 1·3·7 · chuỗi ngày, EXP · điểm ca thi gần nhất · **núm hôm qua + kết quả hôm nay** · ghi chú HLV cũ · lý do T2 chuyển em lên. Cả lớp: dạng nào nhiều em kẹt, chặng nào nhiều em bỏ, em nào nổi lên.

## 4 · AI ĐƯỢC VẶN GÌ (máy chủ kiểm từng trường; tự hết hạn sau 3 ngày; thầy sửa/tắt được)
Nhịp (±3 câu/ngày, trong [6, 16]; 1–3 câu khởi động) · tối đa 3 dạng/em: `uu_tien` / `ha_mot_bac` / `cho_thu_len_bac` / `tam_nghi` · cờ `tut_nhip` / `qua_tai` / `lam_cho_xong` / `nghi_chep` · lời nhắn cho em ≤ 140 ký tự (chỉ số có thật, không so với bạn, không nhãn năng lực, không "nắm chắc") · gợi ý cho thầy ≤ 200 ký tự + một hành động (gọi lên bảng dạng X · nhắn phụ huynh · giao bài riêng) · độ tin cậy (thấp ⇒ chỉ ghi sổ) · ghi chú HLV cho đêm sau.
**Cấm tuyệt đối**: chọn mã câu, bỏ câu lõi, câu vượt bậc + 1, sửa điểm, gửi gì cho phụ huynh, đụng ca thi.

## 5 · THẦY THẤY GÌ
Màn Hôm nay thêm khối **"Bộ não đêm qua"**: ≤ 6 dòng — em cần thầy để ý (lý do bằng số + một nút hành động), dạng cả lớp nên chữa lại, gợi ý gọi lên bảng, em được tăng/giảm nhịp, và "điều chỉnh hôm kia có ăn thua không". Hồ sơ mỗi em: **nhật ký điều chỉnh** (ngày · núm · lý do · kết quả hôm sau) + nút "Bỏ điều chỉnh này". Công tắc tắt toàn bộ ở Cài đặt. Học sinh chỉ thấy bài vừa sức hơn và một lời nhắn đúng với mình.

## 6 · LỘ TRÌNH
- **Nấc 0 (đang build)**: BTVN nâng đỡ — thêm sẵn "cổng nhận núm" ở lõi thuật toán (không có núm ⇒ chạy như thường).
- **Nấc 1 · T2 + CHẠY BÓNG 7 đêm**: máy chủ tính đặc trưng + phân luồng; bộ não chạy thật mỗi đêm nhưng KHÔNG tác động tới học sinh, chỉ ghi "tôi sẽ chỉnh thế này" + bản tin sáng cho thầy đọc thử. Đạt khi: thầy thấy ≥ 80 % gợi ý hợp lý, 0 lời nhắn vi phạm, 7/7 đêm chạy đủ, lượt dùng đúng ước lượng.
- **Nấc 2 · BẬT NÚM cho MỘT lớp** 2 tuần, đo so với lớp chưa bật: tỉ lệ xong chặng, đúng lại sau 3 và 7 ngày, số lần lên bậc, số em bỏ dở.
- **Nấc 3**: bật cả trường · T4 hằng tuần · nháp nhận xét tuần cho phụ huynh (thầy duyệt mới gửi) · chẩn đoán "lỗi hay gặp" từ phương án chọn nhầm để T1 ưu tiên đúng câu chữa lỗi đó.

## 7 · RỦI RO CÒN LẠI (nói thật)
Phụ thuộc máy thầy và app đang mở — đã có chạy bù + cảnh báo + app không cần AI để chạy. Dữ liệu học tập (đã ẩn danh) đi qua Claude như mọi phiên làm việc hiện nay. Gói dùng của thầy có trần — T2 phân luồng giữ mức dùng thấp; chạm trần thì đêm đó bỏ qua. AI nói sai — hai lớp kiểm (tại máy và tại máy chủ) + biên độ hẹp + tự hết hạn.

## 8 · VIỆC THẦY LÀM MỘT LẦN LÚC CÀI (~5 phút)
(1) Duyệt tác vụ hẹn giờ 04:00. (2) Tự đặt mã bí mật vào tệp riêng theo hướng dẫn. (3) Bấm cho phép phiên bộ não chạy 2 mã lệnh + thư mục `bo-nao/`. (4) Bật "giữ máy thức".

## 9 · XIN THẦY CHỐT
1. Kiến trúc 4 tầng, AI chỉ vặn núm — đồng ý?
2. Chạy 04:00 mỗi đêm, chạy bóng 7 đêm trước khi tác động tới học sinh — đồng ý?
3. Làm sau khi BTVN nâng đỡ Đợt 1 lên máy chủ (để không giành người với việc số 1) — đồng ý?

## 10 · THẦY HỎI THÊM: gọi API bằng MÔ HÌNH CAO NHẤT, mỗi TUẦN quét và điều chỉnh MỘT lần thì tốn bao nhiêu?
Giả định: 300 em, mỗi em một hồ sơ TUẦN ~3.000 token vào + ~500 token ra, thêm một lượt tổng hợp cả lớp ⇒ mỗi tuần ≈ 0,95 triệu token vào + 0,16 triệu token ra.
Tôi KHÔNG chắc bảng giá hiện hành của mô hình cao nhất, nên tính theo hai mức giá tham chiếu của dòng cao cấp; phải kiểm trang giá của Anthropic trước khi bật.

| Mức giá (USD / 1 triệu token vào · ra) | Mỗi tuần | Mỗi tháng | Nếu gộp lô qua đêm (−50 %) |
|---|---|---|---|
| 5 · 25 | ≈ 8,6 | ≈ 35–40 | ≈ 18–20 / tháng |
| 15 · 75 | ≈ 26 | ≈ 105–115 | ≈ 55 / tháng |

Nếu T2 phân luồng, chỉ gửi ~40 % số em ⇒ các con số trên nhân 0,4 (≈ 8–45 USD/tháng).
**Nhận xét**: tuần một lần bằng mô hình cao nhất cho nhận định SÂU (rất hợp để viết nhận xét tuần, chỉnh bậc, chỉnh tham số), nhưng QUÁ CHẬM cho mục tiêu "tiến bộ từng ngày": em tụt nhịp hôm thứ Ba thì tới Chủ nhật mới được đỡ. Cách ghép tốt nhất: **hằng đêm** T2 (thuật toán) + T3 (phiên trên máy thầy, không tốn tiền API) lo việc ngày; **hằng tuần** một lượt quét sâu bằng mô hình cao nhất — chạy ngay trên máy thầy (0 đồng API) hoặc qua API theo bảng trên nếu thầy muốn tách khỏi máy.
