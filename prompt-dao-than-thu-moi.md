# ĐỀ BÀI BUILD — ĐẢO THẦN THÚ bản mới (thầy CHỐT 21/09: "chốt luôn 2 thiết kế, giao làm luôn")

Người làm: phiên **Code 6 - Đảo thần thú** (thư mục chung, nhánh main). Phối hợp: **Code 5 - Game** (chủ `Game.tsx` + máy chủ game, ở worktree riêng) — nhắn thẳng nhau. Quyết/soát/gộp: **Boss**.
Đọc trước: `CLAUDE.md` → `DIEU-PHOI.md` → 4 ảnh `docs/ban-ve-dao-than-thu-2109/` (+ `sinh-ban-ve.py` = mẫu màu, bóng, keyframes) → `src/game/than-thu-v2/Game.tsx` (tab home), `LearningBattle.tsx`, `learning-battle.ts`, `core.ts` (`chooseSession`, `advance`), `evolution.ts`, `Spirit2D.tsx`.

## VAI TRÒ
Kỹ sư giao diện game cho học sinh cấp 3, điện thoại yếu, mạng chập chờn. React + TS theo giọng mã của kho.

## BỐI CẢNH (đã đọc từ mã)
Màn đảo hiện đặc chữ người lớn ("Thuật toán 3 Vòng", "Lõi Căn Bản"), hai nút bắt đầu ở hai nơi, không mục tiêu ngắn hạn, thưởng 20/40/40 không giải thích, `tower` + `Spirit3D`/`spirit-model` là mã chết, và ~27 MB tranh đẹp KHÔNG dùng: `public/than-thu-v2/combat/0..7.png` (mỗi thú 2 trạng thái Bình thường | Cuồng nộ), `bat-linh.png`. Atlas 3 MB nạp nguyên tấm rồi mới cắt.

## NHIỆM VỤ — đổi CÁCH KỂ, GIỮ thuật toán chọn câu/chấm/thưởng
1. **Tài nguyên nhẹ**: script `scripts/cat-anh-than-thu.mjs` (chạy lại được, tất định, không thêm phụ thuộc nặng) cắt atlas tiến hoá → ảnh riêng từng thú × 6 dạng (webp/png ≤ 60 KB), cắt `combat/*.png` → thẻ `binh-thuong` / `cuong-no` (≤ 90 KB), vào `public/than-thu-v2/nho/`; màn mới chỉ nạp ảnh nhỏ, lazy. KHÔNG xoá tệp gốc (màn cũ, màn chiếu, Đoàn còn dùng) — chỉ ghi danh sách "có thể bỏ sau" vào sổ.
2. **Chọn bạn đồng hành** (ảnh 1): băng chuyền 8 thẻ tranh, chạm lật xem Cuồng nộ, ô đặt tên, một nút vàng. Đây là màn ĐẦU TIÊN cả trường thấy sau reset — phải đẹp, 1 chạm là chọn.
3. **Hòn đảo của em** (ảnh 2): thú thật trên đảo + vòng EXP + "còn N EXP lên cấp"; MỘT thẻ "Chuyến thám hiểm hôm nay" (4 nhóm ải từ đúng công thức `chooseSession`: 2 yếu · 1 tới hạn · 2 lấp · 1 thử thách) + một nút LÊN ĐƯỜNG (gộp `sync`+`start`, thông báo bằng lời của học sinh, không "tờ đề"); 3 "Mục tiêu gần nhất" (lên cấp · thành thạo một dạng · rèn khiên từ `exp.manhKhien`); đường tiến hoá 6 dạng (dạng chưa tới là "?"); thanh điều hướng dưới: Đảo · Đoàn (chỉ khi `doanMo`) · Sổ tay · Túi đồ (khiên "chống đuổi" + mảnh khiên chuyển vào đây — GIỮ nguyên tác dụng khiên). Bỏ mọi chữ "3 Vòng/Lõi Căn Bản". EXP hiển thị theo EXP MỚI (`exp.homNay`), không còn "today/100".
4. **Chuyến thám hiểm** (ảnh 3): dải 6 ải trên cùng; trận giữ công thức `learning-battle.ts` (HP, 3 đúng liền → cuồng nộ ×2) nhưng Cuồng nộ hiện bằng TRANH cuồng nộ thật; sau mỗi câu một dòng LÝ DO THƯỞNG ("+40 · đúng lại sau 1 ngày — sao thứ 2 của dạng này"); bỏ `scrollIntoView` tự cuộn; reduce-motion tắt sạch; không cuộn ở 360×740 phần trận + câu.
5. **Sổ tay dạng bài** (ảnh 4): 3 sao/dạng từ `mastery[]` (20/40/40 = sao 1/2/3), gom theo chương, dạng chưa gặp = "???", thẻ "N dạng đang yếu". Không bịa phần thưởng chưa có (ô "trang phục" trong bản vẽ → để "SẮP MỞ" có khoá).
6. Cần từ máy chủ (nhờ Code 5/Code 3, hợp đồng vào `docs/`): `start` trả thêm `role` của từng câu (`yeu|toi_han|lap|thu_thach`); `answer` trả `lyDoThuong` (mốc 1/2/3 + chữ sẵn in). Chưa có thì suy ở máy khách từ `stage`, KHÔNG chặn việc.

## NGUYÊN TẮC
Tệp mới đặt trong `src/game/than-thu-v2/dao/` + `dao.css`; việc nối vào `Game.tsx` do Code 5 làm theo hợp đồng prop em viết (em KHÔNG sửa `Game.tsx`). Test cũ của game là hợp đồng (than-thu-v2, learning-battle, evolution-v2, kenh4, escort-*, doan-*). Gói thêm ≤ 40 KB gzip (nạp lazy). Không emoji, không hex trong TSX (`check:mau`) — màu qua biến CSS trong `dao.css`. Mỗi màn một commit theo đường dẫn + ảnh 390 sáng (JPG ≤ 150 KB) vào `docs/anh-dao-than-thu-2109/` + mục trong `SO-VIEC-DAO.md` + tin ≤ 150 từ cho Boss. Không tự đẩy Pages/Worker.

## NGHIỆM THU
1. Em chưa chọn thú → chọn xong trong ≤ 2 chạm, vào đảo; em đã có thú → đảo hiện đúng thú/cấp/dạng tiến hoá thật. 2. Từ đảo tới câu đầu tiên ≤ 2 chạm; trọn 6 ải không lỗi console ở 360×740. 3. Lý do thưởng đúng với `stage` máy chủ trả; sổ tay khớp `mastery[]`. 4. Tổng ảnh màn đảo nạp lần đầu ≤ 400 KB (đo bằng Chromium, ghi số). 5. Cờ `doanMo=false` ⇒ không có mục Đoàn. 6. vitest: tệp mới xanh, so tên với nền MỚI ĐỎ = [].
