# ĐỀ BÀI BUILD — GAME "ĐOÀN HỘ TỐNG" (Hộ tống Linh Tâm bản mới)

Thầy đã CHỐT 19/09. Người làm: phiên **Code 5 - Game**. Điều phối + soát: **0.Planer** (hỏi gì hỏi 0.Planer qua SendMessage, KHÔNG hỏi thầy).
Đọc trước, theo thứ tự: `DIEU-PHOI.md` (luật chung) → `DE-XUAT-HO-TONG-LINH-TAM-1909.md` (thiết kế + mục 7 bản vẽ đã chốt) → 6 ảnh trong `docs/ban-ve-doan-ho-tong-1909/` → `DE-XUAT-EXP-MANH-KHIEN-1909.md` (EXP, mảnh khiên — Code 3 đang build) → mã hiện có: `src/game/than-thu-v2/` (đặc biệt `escort-core.ts`, `EscortRoom.tsx`, `EscortQuestion.tsx`, `LearningBattle.tsx`, `Spirit2D.tsx`, `core.ts`, `evolution.ts`) và `server/src/game-v2*.ts`.

## VAI TRÒ
Kỹ sư game + thiết kế chuyển động, đã làm game học tập cho học sinh cấp 3 trên điện thoại yếu, mạng chập chờn. Viết React + TypeScript + Cloudflare Worker/D1 theo đúng giọng mã của kho (tên biến, chú thích tiếng Việt).

## BỐI CẢNH
Trung tâm luyện thi Hoá ~100–300 học sinh. Game hiện tại là 2 đấu 2 theo lượt 60 giây, phải hẹn nhau online, không gắn với việc học. Thầy muốn nó thành "mồi ngon" để em mở app MỖI NGÀY, chơi cùng nhau rất vui, và tiến bộ môn Hoá ngay khi chơi. Hệ cá nhân hoá đã có trên máy chủ: sổ `su_kien_hoc`, hồ sơ `nam_kt_cau`/`nam_kt_dang` (Leitner 1/3/7 ngày), `/hs/ke-hoach-ngay`, `/hs/cau-theo-qid`, `/hs/on-lai/nop`, game v2 đọc bằng chứng từ hồ sơ (`readScope`, `blocked` theo qid hôm nay).

## NHIỆM VỤ
Dựng lối chơi chính mới "Đoàn Hộ Tống" theo 6 bước phát hành ở mục 5 của bản đề xuất; mỗi bước CHƠI ĐƯỢC NGAY, một nhóm commit riêng, báo 0.Planer soát rồi mới lên máy chủ. PvP 2v2 cũ GIỮ NGUYÊN mã, chỉ chuyển cửa vào thành "Võ đài thứ Bảy".

Thứ tự bắt buộc:
1. **Lõi thuần** `src/game/than-thu-v2/doan-core.ts` (KHÔNG React, KHÔNG Date.now/Math.random — hạt giống qua `hashSeed`/`mulberry32` của `exam-shuffle.ts`): trạng thái chặng 8 hiệp (4, 8 là trùm), 1–4 người (thiếu người → bạn máy tất định), mỗi hiệp 40 s làm ĐỒNG THỜI, hành động Đánh / Chắn / Kỹ năng, công thức sát thương ở mục 7 bản đề xuất, Liên Kích, HP Linh Tâm, điều kiện thắng/thua, tóm tắt kết chặng. Test bảng giá trị tính tay + đột biến.
2. **Máy chủ** (tệp MỚI `server/src/game-v2-doan.ts`, nối vào bộ định tuyến game v2 hiện có bằng ít dòng nhất): mở chặng / vào chặng / nộp hiệp / kết chặng. MÁY CHỦ chọn câu cho từng em từ hồ sơ của chính em (tới hạn ôn → dạng yếu đúng bậc → câu mới), chấm, tính sát thương, ghi `su_kien_hoc` nguồn `game` (câu được tiếp sức = assisted → không ghi bằng chứng). Đáp án KHÔNG BAO GIỜ xuống máy em trước khi em chốt. Bảng mới chỉ-thêm (migration riêng, có phòng vệ khi chưa chạy): chặng, lượt tiếp sức, tiến độ Đoàn lớp theo mùa, vé, chuỗi/rương. **Code 5 KHÔNG tự đẩy Worker** — commit xong báo 0.Planer; Code 3 là phiên DUY NHẤT đẩy Worker và chạy migration.
3. **Giao diện** theo đúng 6 ảnh: Sảnh → Trong trận → Tiếp sức → Tung chưởng → Trùm câu chung → Kết chặng. Dùng ảnh thần thú thật (`evolutionCrop` + atlas `-cutout.png`) và tia chiêu thức thật (`public/than-thu-v2/spells/`, cách cắt xem `LearningBattle.tsx`). Màn trận không cuộn ở 360×740 trở lên. Mọi chuyển động tắt khi `prefers-reduced-motion`.
4. **Tiếp sức**: 3 thẻ gợi ý do MÁY CHỦ soạn từ lời giải có sẵn của câu (cắt bước đầu / loại một phương án sai / nhắc kiến thức gốc từ trường kiến thức của câu). Câu không có lời giải → chỉ có thẻ "loại một phương án". Có test: chuỗi thẻ không chứa đáp án đúng, không chứa toàn bộ lời giải.
5. **Mồi hằng ngày**: chặng đầu ngày (ngày VN) miễn phí; chặng thêm tốn 1 vé; vé chỉ sinh từ sự kiện học (đạt nhiệm vụ ngày +2, xong lô đúng nhịp +1 — đọc từ sổ EXP/khoá idempotent của Code 3, KHÔNG tự tính lại); Đoàn lớp theo mùa 4 tuần, 30 trạm; rương chuỗi 3/7/14 (phần thưởng tất định theo sbd+ngày+mùa); Trùm lớp Chủ nhật 20:00–20:20 giờ VN.
6. **Ấn thạch dạng** + hào quang/danh hiệu hiện ở Bảng nhiệm vụ, Vinh danh, màn chiếu (phần hiển thị ngoài game: gửi hợp đồng dữ liệu cho 0.Planer để giao Code 2/Code 1, KHÔNG tự sửa tệp của họ).

## NGUYÊN TẮC BẮT BUỘC
- Công bằng theo nỗ lực: em yếu làm đúng câu vừa sức gây sát thương NGANG em giỏi. Cấp thần thú không cho chỉ số trong trận (giữ luật cũ).
- Không ai thấy bạn SAI gì / đã chọn gì — chỉ thấy "đã chốt", "đang làm", "cần tiếp sức".
- Không chat chữ tự do; chỉ tín hiệu có sẵn. Thua không mất gì. Rời trận → bạn máy đỡ thay, đội không bị phạt.
- GIỮ các luật đang có test khoá: trần 200 câu game/ngày, câu ca thi chưa công bố bị chặn, assisted = không ghi bằng chứng, game không sửa bảng học tập, 20/40/40 theo mastery vào ví, Boss/câu chung không tạo bằng chứng cá nhân.
- EXP: câu trong game KHÔNG nhận EXP câu (bảng 9 ô); nhưng "lên bậc +6", "khắc phục +30", mảnh khiên theo chuyển trạng thái hồ sơ thì có (0.Planer đã chốt với Code 3). "EXP tiếp sức" +3/lần, tối đa 5 lần/ngày, khoá `tiepsuc|<sbd>|<ngay>|<n>` — đề nghị Code 3 thêm vào bảng khoản, đừng tự ghi sổ EXP.
- Không bao giờ in chữ "nắm chắc" hay kết luận năng lực từ điểm; bảng "Hôm nay em tiến bộ gì" chỉ gồm số đo được từ hồ sơ.
- Test cũ của game (`escort-core`, `escort-question`, `escort-context-menu`, `than-thu-v2`) là hợp đồng: không sửa để cho xanh. Tab `thanthu` không bị Code 2/Code 4 đụng — và Code 5 không đụng tệp ngoài `src/game/than-thu-v2/`, `server/src/game-v2-doan*.ts`, `tests/doan-*.test.*`, `docs/`, sổ việc của mình `SO-VIEC-GAME.md`.

## GIẢ ĐỊNH ĐÃ DÙNG (thầy đổi một dòng là xong)
- Đồng bộ nhiều người: hỏi-đáp ngắn (poll 1,5–2 s) qua lệnh máy chủ như phòng hiện có (`game-v2-room.ts`), chưa dùng Durable Object/WebSocket.
- Lớp của em lấy theo lớp trong hồ sơ học sinh hiện có; em không có lớp → Đoàn "Tự do".
- Mùa 1 bắt đầu thứ Hai đầu tiên sau ngày phát hành bước 3.
- Quái/trùm vẽ bằng SVG trong mã (như bản vẽ); khi thầy có ảnh quái thật thì thay.

## KHÔNG ĐƯỢC LÀM
- Không nhập/đoán mật khẩu; không in mã bí mật/token; không ghi/xoá dữ liệu D1 thật ngoài bảng mới của game.
- Không `git add -A`/`git commit -a`; luôn `git commit -m "…" -- <tệp của mình>`. Không stash, không reset --hard.
- Không tự đẩy Worker/Pages. Không đổi luật chấm, luật vào thi, schema không-chỉ-thêm (phải dừng báo 0.Planer).
- Không thêm thư viện game/animation nặng; gói Pages tăng ≤ 60 KB gzip cho toàn bộ game mới (ảnh đã có sẵn, không thêm ảnh > 300 KB).

## ĐỊNH DẠNG ĐẦU RA
Mỗi bước: commit riêng (mã + test + ảnh chụp 390 sáng trong `docs/anh-doan-ho-tong-1909/`), một mục trong `SO-VIEC-GAME.md` (việc, bằng chứng, đột biến đã thử, cách lùi), một tin cho 0.Planer: mã commit, tệp đụng, kết quả vitest so với nền (97 đỏ / 42 tệp — MỚI ĐỎ phải = []), điều cần soát.

## NGHIỆM THU
1. Một em đi trọn chặng MỘT MÌNH (với bạn máy) trong 5–6 phút trên 360×740, không cuộn ở màn trận, không lỗi console.
2. Hai tài khoản cùng chặng: mỗi em nhận câu KHÁC nhau từ hồ sơ mình; tiếp sức chạy hai chiều; Liên Kích nổ đúng khi bạn làm lại đúng; không gói tin nào xuống máy em chứa đáp án trước khi chốt (test soi payload).
3. Cùng hạt giống + cùng đầu vào → cùng diễn biến (test tất định); nạp lại sổ hai lần → vé, trạm lớp, rương không cộng trùng.
4. Chặng thứ hai trong ngày khi hết vé bị từ chối bằng lời tiếng Việt chỉ cách kiếm vé; làm xong nhiệm vụ ngày → có vé.
5. Màn tung chưởng khớp ảnh `4-tung-chuong.jpg`, ≤ 3 giây, bỏ qua được, tắt sạch khi reduce-motion.
