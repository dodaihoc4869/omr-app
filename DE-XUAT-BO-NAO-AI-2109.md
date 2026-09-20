# ĐỀ XUẤT — "BỘ NÃO AI": mỗi đêm đọc dữ liệu từng em, điều tiết việc học ngày mai

Người viết: Boss · 21/09/2026 · CHỜ THẦY XEM (chưa build gì).
Ý của thầy: dữ liệu theo ngày của học sinh đổ về một phiên AI; AI là bộ não đánh giá từng em rồi tự điều chỉnh phân bổ, vì AI đọc dữ liệu và điều chỉnh tốt hơn thuật toán cứng.

## 1 · NÓI THẲNG: AI HƠN Ở ĐÂU, KÉM Ở ĐÂU
| Việc | Thuật toán | AI |
|---|---|---|
| Chọn ĐÚNG câu nào, theo ràng buộc (lõi, bậc, ngân sách), chạy ngay lúc em mở bài | **Hơn hẳn**: tức thì, tất định, test được, 0 đồng, công bằng | Kém: chậm, tốn tiền, có thể bịa mã câu, mỗi lần chạy ra một kiểu |
| Hiểu VÌ SAO em sai (chọn nhầm đáp án nào, sai lặp một kiểu, làm quá nhanh/quá chậm, bỏ dở giữa chặng, tụt nhịp sau ngày thi…) | Kém: chỉ đếm | **Hơn hẳn**: đọc nhiều tín hiệu rời rạc thành một nhận định |
| Quyết "ngày mai nên nhẹ đi hay đẩy lên", "dạng nào ưu tiên trước" cho TỪNG em | Trung bình (luật cứng) | **Hơn**: cân nhiều yếu tố một lúc |
| Viết một câu động viên ĐÚNG với em đó, gợi ý cho thầy nên làm gì với em nào | Không làm được | **Hơn hẳn** |

⇒ Thiết kế thông minh nhất không phải "AI thay thuật toán" mà là **AI LÀM HUẤN LUYỆN VIÊN, THUẬT TOÁN LÀM TRỌNG TÀI**: AI không chọn câu; AI vặn các **NÚM ĐIỀU CHỈNH** của từng em trong khoảng cho phép, thuật toán BTVN nâng đỡ (đang build) nhận các núm ấy rồi chọn câu. AI sai/ngừng/hết tiền ⇒ app chạy y như không có AI.

## 2 · BỘ NÃO ĐẶT Ở ĐÂU — không nên là một phiên chat trên máy thầy
Một phiên như phiên này không hợp làm bộ não chạy hằng đêm: máy thầy ngủ là bộ não ngủ (đã từng lỡ mốc reset 31 tiếng); phiên dài thì đầy bộ nhớ; việc GHI vào dữ liệu thật bị hệ phân quyền chặn khi không có thầy ngồi đó (vừa gặp lúc reset); và tốn token của mô hình lớn cho việc lặp lại.
**Khuyến nghị: bộ não chạy TRÊN MÁY CHỦ** — Cloudflare hẹn giờ 23:30 mỗi đêm → gọi Claude qua API cho từng em có hoạt động trong ngày → nhận về JSON có khuôn → máy chủ KIỂM rồi mới lưu → 00:01 kế hoạch ngày mới + BTVN dùng các núm đó. Phiên Boss giữ vai **"trưởng ban huấn luyện"**: mỗi tuần đọc nhật ký bộ não, đo hiệu quả, sửa lời dặn cho bộ não, báo thầy.
Cần ở thầy: một khoá API Anthropic (trả tiền riêng, KHÔNG nằm trong gói app Claude thầy đang dùng); thầy tự nhập khoá vào máy chủ — tôi và các phiên không được cầm khoá.

## 3 · AI ĐỌC GÌ (mỗi em một "hồ sơ ngày" ≤ ~1.500 token, KHÔNG tên, KHÔNG SBD — dùng bí danh đổi mỗi đêm)
7 ngày gần nhất: từng dạng (gặp/đúng/sai/bậc, đang lên hay tụt) · câu sai gần đây: chọn nhầm phương án nào, mất bao nhiêu giây so với trung vị của chính em · chặng BTVN: xong/bỏ dở ở câu thứ mấy, giờ làm bài · lịch ôn 1·3·7 tới hạn · chuỗi ngày, EXP · điểm ca thi gần nhất · núm hôm qua và kết quả hôm nay (để AI tự thấy điều chỉnh của mình có ăn thua không).

## 4 · AI ĐƯỢC VẶN GÌ (JSON có khuôn, máy chủ kiểm từng trường)
- **Nhịp**: số câu/ngày lệch tối đa ±3 so với thuật toán, trong [6, 16]; số câu khởi động 1–3.
- **Dạng**: tối đa 3 dạng/em: `uu_tien` · `ha_mot_bac` (em đang đuối) · `cho_thu_len_bac` · `tam_nghi` (đã đủ, để dành sức).
- **Cờ**: `tut_nhip` · `qua_tai` · `lam_cho_xong` (đúng bất thường nhanh) · `nghi_chep` · `khong`.
- **Lời nhắn cho em** ≤ 140 ký tự — chỉ được dùng con số CÓ trong hồ sơ ngày (máy chủ đối chiếu), cấm so với bạn khác, cấm nhãn năng lực, cấm chữ "nắm chắc".
- **Gợi ý cho thầy** ≤ 200 ký tự + một hành động: gọi lên bảng dạng X · nhắn phụ huynh · giao bài riêng · không.
- **Độ tin cậy** 0–1: dưới ngưỡng thì chỉ ghi nhật ký, không áp dụng.
**AI KHÔNG BAO GIỜ được**: chọn mã câu, bỏ câu lõi, cho câu vượt bậc + 1, sửa điểm, gửi gì cho phụ huynh, đụng ca thi. Mỗi điều chỉnh tự hết hạn sau 3 ngày, lệch mỗi ngày có trần, ghi sổ `ai_dieu_chinh` kèm lý do; thầy xem/sửa/tắt cho từng em, có công tắc tắt toàn bộ.

## 5 · THẦY THẤY GÌ
Màn Hôm nay thêm khối **"Bộ não đêm qua"**: 5 dòng — em nào cần thầy để ý và vì sao (bằng số), dạng nào cả lớp nên chữa lại, danh sách gợi ý gọi lên bảng, em nào được giảm/tăng nhịp. Hồ sơ mỗi em có **nhật ký điều chỉnh** (ngày · núm nào · lý do · kết quả hôm sau) + nút "Bỏ điều chỉnh này". Học sinh chỉ thấy bài vừa sức hơn và một lời nhắn đúng với mình.

## 6 · CHI PHÍ (ước lượng, phải kiểm bảng giá lúc bật)
~300 em, ~60 % có hoạt động/đêm, ~1.500 token vào + ~300 token ra mỗi em; dùng mô hình nhỏ (Claude Haiku 4.5) + gộp lô qua đêm + nhớ đệm phần lời dặn chung ⇒ **cỡ 10–20 USD/tháng**; mô hình lớn hơn ≈ gấp 3. Mỗi tuần một lượt tổng hợp cả lớp bằng mô hình lớn: vài USD/tháng. Máy chủ giữ **trần tiền tháng**; chạm trần ⇒ tự về thuật toán.

## 7 · LỘ TRÌNH — đi từng nấc, nấc nào cũng đo
- **Nấc 0 (đang làm)**: BTVN nâng đỡ Đợt 1–2 — đây là "đôi tay" bộ não sẽ điều khiển. Thêm sẵn cổng nhận núm điều chỉnh (không có núm ⇒ chạy như thường).
- **Nấc 1 · CHẠY BÓNG 1–2 tuần**: bộ não chạy thật mỗi đêm nhưng KHÔNG tác động gì tới học sinh; chỉ ghi "tôi sẽ chỉnh thế này" để thầy và Boss so với thực tế hôm sau. Đạt khi: gợi ý hợp lý ≥ 80 % theo mắt thầy, 0 lời nhắn vi phạm, chi phí đúng ước lượng.
- **Nấc 2 · BẬT NÚM** cho MỘT lớp: nhịp + ưu tiên dạng + lời nhắn. Đo 2 tuần so với lớp chưa bật: tỉ lệ xong chặng, tỉ lệ đúng lại sau 3 và 7 ngày, số lần lên bậc, số em bỏ dở.
- **Nấc 3**: bản tin sáng cho thầy, cảnh báo bất thường, nháp nhận xét tuần cho phụ huynh (thầy duyệt mới gửi).

## 8 · RỦI RO VÀ CÁCH CHẶN
Dữ liệu trẻ vị thành niên ra ngoài ⇒ chỉ gửi số liệu học tập ẩn danh, không tên/SBD/lớp/trường; ghi rõ trong thông báo với phụ huynh. AI nói sai ⇒ mọi con số trong lời nhắn bị đối chiếu, sai là bỏ. AI thiên vị/kỳ quặc ⇒ biên độ hẹp, tự hết hạn, thầy tắt được. Lệ thuộc AI ⇒ app không bao giờ cần AI để chạy.

## 9 · BA ĐIỀU XIN THẦY CHỐT
1. Bộ não chạy trên MÁY CHỦ qua API (khuyên) thay vì một phiên chat trên máy thầy — thầy đồng ý tạo khoá API và chịu khoản ~10–20 USD/tháng?
2. AI chỉ VẶN NÚM trong khung, không tự chọn câu (khuyên) — đồng ý?
3. Bắt đầu bằng 1–2 tuần CHẠY BÓNG trước khi cho tác động tới học sinh (khuyên) — đồng ý?
