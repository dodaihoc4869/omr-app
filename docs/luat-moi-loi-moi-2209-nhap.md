# NHÁP — LUẬT MỚI CHO LỜI MỜI (thử thách riêng) sau khi luật cấp mới sống — CHƯA ÁP (Code 1 → Boss duyệt trước lượt 04:00 sáng 22/09)

Hiện đang giữ lệnh tạm: lời mời KHÔNG nêu số EXP còn thiếu / số cấp / khiên. Sáng mai thay bằng 6 dòng dưới (viết vào `bo-nao/LUAT-CHIEU.md` + cẩm nang, thay mục "TẠM CẤM").

1. **Nói về "cho thú ăn hôm nay"**, không nói "còn thiếu N EXP lên cấp": "hôm nay {tên thú} còn ăn được K EXP" (K = trần hôm nay − đã ăn; số K PHẢI có trong thẻ: `thanThu.hapThu = { da, tran }`, máy chủ tính).
2. **Được nhắc luật ăn**: "em đạt nhiệm vụ ngày thì {tên thú} ăn no 200 EXP" (200 · 120 là hằng số của luật, máy cho phép sẵn); KHÔNG nói "sẽ lên cấp", KHÔNG nêu số cấp, KHÔNG nêu số EXP còn thiếu để lên cấp (vẫn cấm).
3. **Khiên chỉ theo luật mới**: nếu nhắc khiên thì chỉ được nói "36 ngày đạt nhiệm vụ ngày" (con số 36 cho phép sẵn; máy loại lời có "khiên" mà không kèm "36 ngày đạt nhiệm vụ ngày"); vẫn cấm số mảnh khiên và "còn N mảnh".
4. **Việc cụ thể thay cho phần thưởng**: lời mời gắn với thứ em làm được hôm nay (câu ôn đến lịch, chặng bài tập về nhà, dạng em đang luyện) — đạt nhiệm vụ ngày là đích, không hứa EXP sẽ có (EXP chỉ khi đúng).
5. **Em chưa đủ 4 câu hôm nay**: có thể nói "làm đủ 4 câu để {tên thú} được ăn" (4 là hằng số của luật); em đã ăn no thì không mời "nạp thêm".
6. **Vẫn giữ**: không nêu số câu sẽ làm, không khen chung chung / khen ngầm so với bạn, không nhãn năng lực, mỗi lời ≥ 1 số thật có trong thẻ hoặc là hằng số luật (200 · 120 · 36 · 4).

## Việc kỹ thuật kèm theo (Code 1 làm khi Boss duyệt; ~30 phút)
- `bo-nao-khuon.ts`: bỏ `SO_EXP_CAP_TAM_CAM` cho phần "EXP còn thiếu" nhưng GIỮ cấm số cấp + "còn thiếu N EXP lên cấp"; thêm tập số luật cho phép {200, 120, 36, 4}; `khiên` chỉ hợp lệ khi câu có "36 ngày đạt nhiệm vụ ngày"; `SO_GAME_AN_TAM` giữ ẩn `exp`, `cap`, `expConThieu`, `manhKhien*` (AI không cần), HIỆN `thanThu.hapThu`.
- Code 3: thẻ chiều/đêm thêm `thanThu.hapThu = { da, tran }` (ngày VN hôm nay, từ `hapThu` của hồ sơ + `tranHapThu`), chỉ-thêm.
- Test: mẫu tốt viết lại (5 mẫu có "Rồng Lửa đang chờ em cùng thử" → thêm 3 mẫu "cho thú ăn hôm nay"), mẫu cấm thêm ("còn thiếu 27 EXP để lên cấp 8", "khiên 12 mảnh"); LUAT-CHIEU giữ ≤ 1 400 chữ (hiện 1 393 ⇒ cắt chỗ khác).
- Đóng gói bo-nao SAU khi Code 3 đẩy thẻ có `thanThu.hapThu` (nếu chưa có, lời "K EXP" bị loại vì số không có trong thẻ — an toàn, chỉ mất câu ấy).
