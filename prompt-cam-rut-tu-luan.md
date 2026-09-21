# ĐỀ BÀI — CẤM RÚT CÂU TỰ LUẬN ở MỌI chỗ rút đề của cả 3 app (thầy lệnh 21/09, kèm ảnh: game Đảo thần thú ải "Sửa lỗi" hiện một câu TỰ LUẬN "Theo em, có thể dùng phương pháp nào để tách saccharose…?" với ô nhập đáp án ngắn)

Thầy: "Tuyệt đối không rút câu tự luận, chỉ được rút câu trắc nghiệm, đúng sai, trả lời ngắn; sửa ở tất cả chỗ rút đề của cả 3 app, TRỪ màn Gọi lên bảng — tôi chọn gì hiển thị đúng như thế."
Quyết/soát: Boss. Mọi commit cần dòng soát.

## MỘT ĐỊNH NGHĨA DÙNG CHUNG (Code 1 viết TRƯỚC, thuần, máy chủ + máy khách cùng import)
`src/lib/cau-tu-luan.ts`: `laCauTuLuan(c)` ⇒ true khi câu KHÔNG chấm tự động được như trắc nghiệm / đúng-sai / trả lời ngắn. Gốc để bám: luật sẵn có của máy chủ ở `server/src/btvn-grading.ts:~127` (phần III mà đáp án dài > 20 ký tự có khoảng trắng, hoặc chứa xuống dòng `; → ⇌ :`), cộng: câu có `kieu`/`loai` tự luận, câu phần III KHÔNG có đáp án, mục dạy học/dạng tự luận (`-VD`, `-DT`, `-TL` nếu kho có), câu phần I thiếu phương án, câu phần II thiếu đủ ý. `laCauRutDuoc(c) = !laCauTuLuan(c)`. Test bảng giá trị bằng câu THẬT lấy từ kho (gồm đúng câu saccharose trong ảnh thầy) + đột biến. `btvn-grading.ts` chuyển sang gọi hàm chung (hành vi BTVN không đổi — test khoá).

## RÀ VÀ SỬA MỌI CHỖ RÚT (mỗi phiên tự kiểm kê làn của mình, ghi danh sách vào sổ việc; chỗ nào đã lọc thì ghi "đã lọc" kèm dòng mã)
- **Code 3 — máy chủ**: game Đảo thần thú (`server/src/game-v2*.ts`: chọn phiên, kho `game_v2_question`/`game_v2_index` — lọc lúc CHỌN và lúc dựng chỉ mục), Đoàn Hộ Tống (`game-v2-doan*.ts`), ôn lại (`ke-hoach-ngay.ts` on_lai + `cau-theo-qid.ts`), kế hoạch ngày, bài Mẹ giao (`mom`), luyện đề, khắc phục sau ca, BTVN thường + nâng đỡ (đã lọc — xác nhận), mọi lệnh "rút bộ câu" khác. Câu tự luận em TỪNG sai vẫn nằm trong hồ sơ nhưng KHÔNG được phục vụ lại qua các kênh trên.
- **Code 1 — máy thầy**: `src/lib/de-rieng.ts` (đề riêng), `GiaoBaiTap.tsx` `rutBaiTap`, rút bộ câu ở màn Mở ca (`ExamSetupScreen` — LUỒNG THI: chỉ thêm bộ lọc ở bước RÚT TỰ ĐỘNG, đề thầy tự chọn nguyên tờ giữ nguyên), "Giao BTVN theo 3 dạng này"/"Rút đề kiểm tra" ở màn Hôm nay, mọi hàm rút tự động khác. **KHÔNG đụng Gọi lên bảng / tờ chiếu**: thầy chọn gì hiện đúng thế.
- **Code 2 — máy học sinh/phụ huynh**: lớp phòng thủ cuối — phiếu, game, ôn lại: nhận phải câu `laCauTuLuan` thì BỎ QUA câu đó (không hiện ô nhập ngắn cho câu tự luận), ghi console cảnh báo.
Màn của thầy nơi có số đếm câu: ghi rõ "đã bỏ N câu tự luận" khi bộ lọc loại câu.

## NGHIỆM THU
1. Test tích hợp mỗi kênh: kho mẫu có câu tự luận ⇒ 0 câu tự luận trong đầu ra. 2. Gọi lên bảng: thầy chọn câu tự luận ⇒ vẫn hiện đủ (test khoá). 3. Câu saccharose trong ảnh thầy không còn xuất hiện ở game. 4. vitest: đỏ mới = [].
