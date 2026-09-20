# SỔ VIỆC — GAME "ĐOÀN HỘ TỐNG" (phiên Code 5 - Game)

Đề bài: `prompt-game-doan-ho-tong.md` · Thiết kế đã chốt: `DE-XUAT-HO-TONG-LINH-TAM-1909.md` (mục 7) · Điều phối + soát: 0.Planer.
Nơi làm: worktree riêng, nhánh `claude/zealous-taussig-a50c90` (tách từ main 30b2fb7) — 0.Planer gộp vào main như tiền lệ nhánh rút đề riêng. Code 5 KHÔNG đẩy Worker/Pages.

| Bước | Việc | Trạng thái |
|---|---|---|
| 1 | Lõi thuần `doan-core.ts` + test bảng giá trị + đột biến | **XONG 19/09** — 0.Planer đã soát + gộp main 243e746, duyệt cả 9 quyết định (ghi chú 9 → đã sửa, xem mục "Sửa sau soát") |
| 2 | Máy chủ `server/src/game-v2-doan.ts` (mở/vào/nộp/kết chặng, chọn câu từ hồ sơ, ghi `su_kien_hoc` nguồn `game`) | **XONG 19/09** — 0.Planer đã soát + gộp main e65efbb, duyệt luật Chắn mới và các điểm (3)(4)(5); Code 3 chạy migration + đẩy Worker |
| 3 | Giao diện 6 màn theo bản vẽ | **XONG 19/09** — Boss (0.Planer) đã soát + gộp main c1cfaac, kèm CỜ MỞ GAME; Worker 6ddc48c7 đã có, cờ bật riêng 12121212 |
| 4 | Tiếp sức (3 thẻ gợi ý máy chủ soạn) | **XONG 21/09** — Boss đã soát + gộp |
| 5 | Mồi hằng ngày (vé, Đoàn lớp, rương chuỗi, Trùm lớp) | **XONG 21/09** — Boss đã soát + gộp 0235a4d; Code 3 đã chạy migration + Worker a5b1db90 |
| 6 | Ấn thạch dạng + bạn đồng hành bù nhau + bảng cho thầy + hợp đồng hiển thị ngoài game | **XONG 21/09** — chờ Boss soát |
| + | Đảo thần thú bản mới (Code 6): `start` trả `role`, `answer` trả `lyDoThuong`, lệnh `so-tay` | **XONG 21/09**; NỐI `Game.tsx` chờ vỏ `dao/DaoThanThu` của Code 6 lên main |

---

## BƯỚC 1 — Lõi thuần (19/09/2026)

**Tệp (chỉ 3 tệp, đều MỚI, không sửa tệp nào có sẵn):** `src/game/than-thu-v2/doan-core.ts`, `tests/doan-core.test.ts`, `SO-VIEC-GAME.md`.
Chưa màn nào nạp lõi → gói Pages tăng 0 KB; game cũ (PvP 2v2) không đổi một dòng. Bước này không có giao diện nên không có ảnh chụp.

### Luật đã dựng (hằng số gom MỘT chỗ ở đầu tệp)
- Chặng 8 hiệp; hiệp 4 và 8 là TRÙM. Hiệp thường 40 s, hiệp trùm 60 s (bản vẽ 5 để đồng hồ 52 — cho các em kịp bàn). Lõi không đọc đồng hồ: `hetGioHiep(batDauLuc, bayGio, hiep)` nhận giờ từ nơi gọi.
- 1–4 em thật. Đi một mình → thêm ĐÚNG MỘT bạn máy (dắt thần thú khác em). Rời trận → ghế ấy do máy đỡ thay, đội không bị phạt.
- **Sát thương = đúng công thức đã chốt**: `round(16 × (đúng ? 1,5 : 0) × (Liên Kích ? 2 : 1) × (kỹ năng ấn thạch ? 1,25 : 1))` → 24 / 48 / 30 / 60; sai hoặc bỏ trống = 0.
- Lõi KHÔNG nhận cấp thần thú, độ khó, sao của câu — chỉ nhận "đúng/sai" máy chủ đã chấm ⇒ em yếu và em giỏi cùng đúng thì cùng 24.
- Liên Kích: bạn được tiếp sức làm lại ĐÚNG → cả người giúp lẫn người được giúp ×2 (kể cả khiên). Câu đã nhận thẻ thì `tuLam = false` dù đúng hay sai (máy chủ dựa vào cờ này để KHÔNG ghi bằng chứng).
- Hành động: Đánh / Chắn (khiên 8 dù đúng hay sai; em SAI thì đòn tự chuyển thành Chắn — luật đã đổi sau soát, xem "Sửa sau soát bước 1") / Kỹ năng (tốn 2 năng lượng; mỗi câu đúng +1, đúng-rồi-chắn +2, tối đa 3).
- Trùm: một câu 4 ý chia vòng tròn cho các ghế (máy chủ giao lại theo bậc bằng `datGiaoY`); đúng ≥ 3/4 → vỡ giáp, quét sạch quái tồn; không vỡ → trùm đánh 8 × số đoạn giáp còn.
- Thắng = Linh Tâm còn máu sau hiệp 8. Sao: về đích 1 · còn từ nửa máu +1 · vỡ giáp cả hai trùm +1. Thua = 0 sao, không mất gì.
- `khungNhinHiep(kq, ghế)`: thứ được gửi xuống máy từng em — về BẠN chỉ có "ra đòn / chắn / giữ vị trí (= không chốt)"; bạn sai và bạn đúng-rồi-chắn KHÔNG phân biệt được; không có đúng/sai, hệ số, ý trùm của bạn.

### Chỗ bản đề xuất để trống — Code 5 tự điền, CẦN 0.Planer SOÁT
| # | Quyết định | Vì sao |
|---|---|---|
| 1 | Quái 24 máu; mỗi hiệp thường sinh số quái = số ghế (trần 8 con trên sân); quái còn sống cuối hiệp đánh Linh Tâm 4 | Một câu đúng = nhìn thấy ngay MỘT quái gục. Sát thương dư tràn sang con kế nên không phí công ai |
| 2 | Máu Linh Tâm = 40 + 20 × số ghế (2 ghế 80 · 3 ghế 100 · 4 ghế 120) | Số quái tăng theo số ghế thì Linh Tâm cũng phải dày theo; bản vẽ 2 (3 bạn) ghi "Linh Tâm 80" trên thang 100 |
| 3 | Năng lượng: câu đúng +1 (kể cả đúng sau tiếp sức), tối đa 3; người tiếp sức THÀNH CÔNG +1 | Bản vẽ 2: hiệp 3 đã có "kỹ năng · 2 NL" = hai câu đúng trước đó. Thưởng năng lượng cho người dạy bạn |
| 4 | Kỹ năng gốc: sát thương chính vẫn 24 theo công thức + MỘT hiệu ứng phụ theo nhóm thần thú — công (Viêm Sư, Phong Thố, Minh Linh): đòn lan −6 mỗi quái còn sống · thủ (Thạch Quy, Tinh Lang): khiên +12 · hồi (Thuỷ Long, Ái Hồ, Ân Lộc): Linh Tâm +10. Ấn thạch sáng → biến thể ×1,25 | "Thêm lựa chọn chiến thuật, không tăng chỉ số thô". Tên kỹ năng viết lại vì tên cũ tả bàn cờ ô ("đẩy lùi", "vượt cầu") |
| 5 | **Mỗi chặng mỗi em chỉ NHẬN tối đa 2 lần tiếp sức; mỗi hiệp một em chỉ GIÚP một bạn** | Chống lạm dụng: xin tiếp sức = ×2 sát thương, không trần thì hai bạn thay nhau xin suốt chặng, không câu nào thành bằng chứng |
| 6 | Trùm không vỡ giáp đánh 8 × số đoạn giáp còn (2/4 → 16; 0/4 → 32) rồi rút lui; quái tồn vẫn đánh | Đúng 2 ý vẫn đỡ hơn đúng 0 ý — nỗ lực một phần vẫn có nghĩa |
| 7 | Bạn máy đúng 75% (rút từ hạt giống + hiệp + ghế); Linh Tâm ≤ 40% và sân còn quái → Chắn; đủ 2 NL → kỹ năng; không bao giờ XIN tiếp sức nhưng có thể GIÚP em | Đi một mình vẫn có Liên Kích; máy không tạo bằng chứng học |
| 8 | Hồi máu và mất máu tính GỘP rồi mới kẹp [0, tối đa] | Thân thiện: Linh Tâm còn 3 máu, bị đánh 4, được hồi 10 → còn 9, không vỡ |
| 9 | ~~Chắn đúng 12 / sai 4~~ → ĐÃ ĐỔI sau soát: Chắn 8 dù đúng hay sai; đòn của em SAI tự chuyển thành Chắn; đúng-rồi-chắn +2 năng lượng (riêng tư) | Bịt chỗ hở "khiên yếu làm lộ bạn sai" tận gốc: trên sân, đúng-rồi-chắn và sai trông Y HỆT nhau |
| 10 | Ghế gửi "kỹ năng" khi thiếu năng lượng → lõi coi là Đánh (máy chủ vẫn phải chặn trước bằng `kiemHanhDong`) | Không để một gói tin lạ làm hỏng cả phòng |

~~Điều còn hở: khiên 4 thay vì 12 để lộ bạn chắn sai~~ → ĐÃ BỊT (commit a844712, xem "Sửa sau soát").

### Bằng chứng
- `npx vitest run tests/doan-core.test.ts` → **50/50 xanh** (bảng công thức 6 dòng; mở chặng; hiệp thường tính tay; tiếp sức/Liên Kích; kỹ năng/năng lượng; trùm; thắng-thua-sao-tóm tắt; công bằng; bạn máy/rời trận; tất định + không sửa đầu vào + qua JSON nguyên vẹn; soi mã nguồn không có Date.now/Math.random/React; khung nhìn không lộ).
- Test hợp đồng cũ không bị đụng: `escort-core`, `escort-question`, `escort-context-menu`, `than-thu-v2` — không sửa dòng nào, không tệp nào trong số đó đỏ ở lần chạy toàn bộ.
- **Toàn bộ `npx vitest run` (worktree sạch, 19/09 15:5x giờ máy): 5470 test · 97 đỏ / 42 tệp = ĐÚNG NỀN · MỚI ĐỎ = []** (`doan-core.test.ts` không nằm trong 42 tệp đỏ; không tệp nào có sẵn nạp `doan-core`).
- `npx tsc -p tsconfig.app.json --noEmit` sạch.

### Đột biến đã thử (sửa lõi → test PHẢI đỏ) — 40 đột biến, 39 bị bắt
Bị bắt (số test đỏ): nền 16→18 (21) · hệ đúng 1,5→1 (27) · Liên Kích 2→1 (6) · ấn 1,25→1 (4) · sai vẫn có sát thương (9) · quái 24→30 máu (13) · quái đánh 4→5 (9) · chắn sai = chắn đúng (2) · vỡ giáp từ 2 ý (3) · trùm đánh 8→6 (3) · bỏ trần nhận tiếp sức (1) · Linh Tâm không theo số ghế (8) · câu được giúp vẫn là "tự làm" (5) · Liên Kích nổ cả khi bạn sai (2) · một người giúp nhiều bạn một hiệp (1) · kỹ năng sai vẫn mất NL (1) · kỹ năng không cần NL (1) · ấn tính cả cho Đánh thường (2) · sát thương dư không tràn (2) · bỏ trần số quái (1) · chốt sau đè chốt trước (3) · ai cũng trả lời được ý của bạn (1) · vỡ giáp không quét quái (3) · vỡ giáp vẫn mất máu (1) · hồi trước rồi mới kẹp (1) · mất trước, vỡ rồi mới hồi (1) · Linh Tâm vỡ vẫn đi tiếp (2) · sao nửa máu luôn có (1) · sao trùm luôn có (2) · giaiHiep sửa thẳng đầu vào (4) · bạn máy dùng Math.random (3) · bạn máy không bao giờ chắn (1) · khung nhìn lộ đòn trượt của bạn (1) · khung nhìn gửi nguyên ghế bạn (1) · hiệp trùm 40 giây (1) · người giúp không được NL (1) · NL tối đa 3→9 (1) · rời trận không chuyển cho máy · đi một mình không thêm bạn máy. (Con số trong ngoặc là của vòng đầu; vòng cuối chạy lại đủ 40 đột biến trên bản mã CUỐI: 39 đỏ, 1 tương đương.)
- Vòng đầu có 3 đột biến SỐNG → đã xử lý: "hồi trước rồi mới kẹp" → thêm test gộp (đầy máu và còn 3 máu), nay bị bắt; "ghế máy nhận bài gửi hộ" → điều kiện ấy THỪA (ghế máy đã được xếp bài trước), đã bỏ điều kiện thừa, hành vi vẫn có test khoá.
- Còn 1 đột biến TƯƠNG ĐƯƠNG không bắt được: "bỏ `Math.round`" — với hằng số hiện tại mọi tích (24/48/30/60) đều nguyên nên làm tròn không đổi kết quả; giữ `round` để khi thầy đổi hằng số vẫn ra số nguyên.

### Cách lùi
Ba tệp đều mới, chưa nơi nào nạp: `git revert <commit bước 1>` hoặc xoá ba tệp; không ảnh hưởng bản đang chạy.

### Sửa sau soát bước 1 (commit a844712) — ghi chú 9 của 0.Planer
- Vấn đề: thanh máu Linh Tâm là số công khai, nên chỉ ẩn con số khiên KHÔNG đủ — biết số quái còn sống (×4) và máu mất là suy ngược ra khiên 4 hay 12, tức bạn đúng hay sai. Cũng vậy: bạn "đã chốt" mà không gây gì = bạn sai.
- Sửa ở GỐC (luật), không phải ở chỗ hiển thị: **Chắn = 8 dù đúng hay sai; đòn của em SAI (hoặc bỏ trống đã chốt) tự chuyển thành Chắn** (đúng tinh thần câu "sai vẫn được Chắn" của bản đề xuất). Bạn đã chốt mà không ra đòn ⇒ luôn hiện "chắn 8" — có thể là đúng-rồi-chủ-động-chắn, có thể là sai; không phân biệt được. Thưởng cho làm ĐÚNG khi chắn là thứ riêng tư: +2 năng lượng thay vì +1.
- Hệ quả tốt: em yếu làm sai VẪN góp 8 khiên cho Linh Tâm — không bao giờ là gánh nặng. Cả đội sai hết vẫn thua dần (quái dồn 2 → 4 → 6, hiệp 3 bắt đầu mất máu), nên nỗ lực vẫn quyết định.
- Test mới: khung nhìn của người xem **bằng nhau từng byte** giữa đúng-rồi-chắn / sai-khi-Đánh / sai-khi-Chắn / sai-khi-Kỹ-năng (có và không có ấn) trong đội 2 người — tức đúng trường hợp "chỉ MỘT bạn chắn"; mọi con số công khai của sân (máu, quái, khiên, sát thương) cũng bằng nhau. Đột biến: "sai không tự chuyển Chắn", "Chắn 8→12", "chắn đúng chỉ +1 NL", "chắn sai yếu hơn" → đều đỏ.
- Còn lại (đã được duyệt là tất yếu): Liên Kích KHÔNG nổ sau khi em tiếp sức thì em biết bạn làm lại vẫn sai; hiệp trùm đội 2 người thì tổng ý đúng trừ ý của mình ra số ý đúng của bạn (các em vốn bàn miệng với nhau ở hiệp này).

---

## BƯỚC 2 — Máy chủ (19/09/2026)

**Tệp:** `server/src/game-v2-doan.ts` (MỚI) · `server/migration-1909-game-doan.sql` (MỚI, chỉ-thêm) · `tests/doan-may-chu.test.ts` (MỚI) · `server/src/game-v2.ts` (**5 dòng nối**, xem dưới). Commit: a844712 (sửa lõi) · 806a940 (bước 2) · fdfe962 (gộp main về nhánh, xung đột 1 chỗ ở dòng import của game-v2.ts — giữ cả hai phía) · commit test bổ sung sau đột biến.

### Nguyên tắc dựng: KHÔNG có bản chọn câu / bản chấm thứ hai
- CHỌN CÂU = gọi đúng lệnh `start` sẵn có của game v2 (readScope → allowed → chooseSession; chặn câu ca thi chưa công bố; chặn câu đã làm hôm nay ở nguồn khác; phạm vi thầy đặt riêng; trần 200 câu/ngày; thầy tạm dừng game). Máy chủ chỉ XẾP LẠI 6 câu: tới hạn ôn (`nam_kt_cau.moc_on_ke ≤ hôm nay`, chưa khắc phục) → dạng đang yếu → câu còn lại, và gắn nhãn cho thẻ câu. Câu lấy từ CHÍNH chỉ mục `game_v2_question` (cùng định nghĩa với `qidPhucVuDuoc` của Code 3) nên không thể chọn qid không có nội dung; tờ kho bị rút GIỮA chặng → em được báo "Chắn rồi chốt, không bị tính sai".
- CHẤM = gọi đúng lệnh `answer` sẵn có → giữ nguyên 20/40/40 vào ví, có trợ giúp = không ghi bằng chứng, ghi `su_kien_hoc` nguồn `game`, idempotent theo `phiên|qid`, không chạm bảng học tập.
- Phiên câu của Đoàn được đóng dấu `$.doan=1`: lệnh `answer` từ máy em bị từ chối ("trả lời ngay trong trận"), lệnh `resume` không trả phiên này. Lời gọi nội bộ nhận diện bằng WeakSet theo ĐỐI TƯỢNG → gói tin từ máy em không thể tự xưng nội bộ; cờ `assisted` do máy chủ quyết (bước 4 sẽ đặt true khi em đã nhận thẻ).
- 5 dòng nối trong `game-v2.ts`: import · kiểu `Session.doan?` · một dòng định tuyến `doan-*` (đòi đã chọn thần thú) · `resume` thêm `AND json_extract(json,'$.doan') IS NULL` · `answer` thêm một dòng từ chối phiên Đoàn gọi từ ngoài.

### Lệnh `/game-v2/doan-*` (đều cần `token` như game v2)
| Lệnh | Việc |
|---|---|
| `doan-mo {cheDo?: 'phong'}` | Đang có chặng dở (< 1 giờ) → trả lại chặng ấy. Mặc định: đi một mình + bạn máy, bắt đầu luôn (đếm ngược 3 s). `phong`: mở sảnh, trả mã `DH…` |
| `doan-vao {ma}` · `doan-bat-dau {ma}` · `doan-roi {ma}` | Tối đa 4 bạn; chỉ chủ đoàn cho lên đường; rời sảnh trả ghế (chủ rời → bạn kế làm chủ); rời giữa trận → máy đỡ thay, bạn ở lại không phải chờ; cả đội rời → đóng chặng |
| `doan-xem {ma, coCau?}` | Hỏi-đáp 1,5–2 s. Tự giải hiệp khi hết giờ (+1,5 s ân hạn mạng) hoặc đủ bài. `coCau` = qid máy em đã có → không gửi lại đề |
| `doan-nop {ma, hiep, answer, hanhDong}` hoặc `{boTrong:true, hanhDong:'chan'}` | Kiểm đòn TRƯỚC khi chấm (thiếu năng lượng không tốn lượt làm). Trả `ketQuaCau` (đáp án + lời giải) — chỉ của câu MÌNH, chỉ SAU khi chốt. Bỏ trống: không chấm, không ghi sổ |
| `doan-nop-y {ma, hiep, y, answer:'D'|'S'}` | Chỉ người GIỮ ý mới chốt được; chốt rồi không đổi; không phản hồi đúng/sai tới khi hiệp trùm giải xong |
| `doan-loi-giai-trum {ma, hiep}` | Đáp án + lời giải câu chung, CHỈ sau khi hiệp trùm ấy đã giải |
| `doan-tin-hieu {ma, tinHieu}` | Chỉ 4 mẫu có sẵn (`can_tiep_suc`, `chac_y`, `ban_them`, `doi_ti`) — không chat chữ |

### Câu chung của trùm
Một câu Phần II đã duyệt, đủ 4 ý, thuộc dạng mà ít nhất một bạn trong đội đang có câu cá nhân VÀ mọi kiến thức nền của câu nằm trong kiến thức nền của các câu cá nhân ấy (không đoán phạm vi từ tên dạng). Ưu tiên dạng cả lớp sai nhiều nhất (`nam_kt_dang` của các em cùng lớp). Loại: câu ca thi chưa công bố, câu thầy chặn riêng bất kỳ bạn nào, câu ai đó đã/đang làm hôm nay, các câu cá nhân của chặng. 4 ý chia theo BẬC của từng bạn ở dạng ấy (ý đầu → bạn bậc thấp nhất; bạn máy = bậc giữa). Không ghi attempt, không ghi sổ, không tính trần 200. **Không có câu hợp lệ** → hiệp trùm tự giải theo phong độ: ý của ghế nào đúng khi ghế ấy tự làm đúng ≥ 2/3 hiệp thường vừa rồi (chặng không bao giờ kẹt).

### Bảng mới (migration chỉ-thêm, chưa chạy thì mọi lệnh `doan-*` báo "Đoàn Hộ Tống chưa mở trên máy chủ", game cũ không hề hấn)
`doan_chang` (phòng: json + revision khoá lạc quan) · `doan_luot` (sổ lượt đi của từng EM THẬT — bạn máy không bao giờ có dòng, đúng ghi chú 7 của 0.Planer; chốt MỘT lần trong cùng giao dịch với lần ghi kết chặng) · `doan_tiep_suc` (bước 4 ghi). Vé / Đoàn lớp theo mùa / rương: bước 5. Đã báo Code 3: ba bảng này không cần vào job reset 21/09 (chưa từng có trên D1 thật).

### "Hôm nay em tiến bộ gì" (kết chặng) — mọi số đo được, không chữ "nắm chắc"
`tienBo = { soCau, tuLamDung, lenBac, giup, giupThanhCong, duocGiup }`. `lenBac` đo từ SỔ: số câu em tự làm đúng trong chặng mà đã từng đúng ở một ngày VN TRƯỚC (đúng luật lên bậc của hồ sơ); thiếu sổ → `null`, giao diện không in dòng ấy. Về bạn chỉ trả `soLanGiupThanhCong` — không có số câu đúng/sai của bạn.

### Bằng chứng
- `tests/doan-may-chu.test.ts` **21/21** trên SQLite thật + lược đồ thật (`_d1-that`), đồng hồ giả: đi một mình trọn 8 hiệp (6 câu khác nhau, 6 attempt, 6 dòng sổ nguồn game, trùm 0 dòng, bảng học tập không đổi, sổ lượt chốt 1 lần) · lên bậc đo từ sổ · tải lại trang · sảnh / 4 bạn / rời sảnh · hai tài khoản mỗi em câu KHÁC nhau từ hồ sơ mình · soi payload MỌI lệnh trước khi chốt (không khoá `correct|solution|answer|reviewed|solutionImages`, không chuỗi lời giải, không SBD bạn) · cấp 1 và cấp 100 cùng 24 · chốt rồi không đổi, hiệp cũ bị từ chối · bỏ trống · hết giờ + ân hạn · rời trận · tín hiệu · trùm (chỉ người giữ ý, không lộ, lời giải sau khi giải, không bằng chứng) · chia ý theo bậc · câu bảo vệ / thầy chặn / thiếu kiến thức nền không thành câu chung → phong độ · answer/resume thường bị chặn với phiên Đoàn, lượt luyện thường vẫn chạy · trần 200 · chưa chọn thú · thầy tạm dừng · thiếu migration.
- Lõi: `tests/doan-core.test.ts` **52/52**.
- **Toàn bộ `npx vitest run` sau khi gộp main: 5680 test · 97 đỏ / 42 tệp = ĐÚNG NỀN · MỚI ĐỎ = [] · HẾT ĐỎ = []** (so TỪNG TÊN test với lần chạy bước 1). `tsc` sạch cả `server/tsconfig.json` lẫn `tsconfig.app.json`. `than-thu-v2` 46 + `kenh4` + `escort-core` xanh, không sửa dòng nào.
- Đột biến bước 2: **39 đột biến** (4 ở lõi cho luật Chắn mới, 32 ở `game-v2-doan.ts`, 3 ở `game-v2.ts`) → 38 đỏ. Vòng đầu sống 3: "gửi nguyên lịch sử hiệp" và "câu chung không xét kiến thức nền" → đã thêm test, nay đỏ; "chốt sổ lượt cả cho bạn máy" là TƯƠNG ĐƯƠNG (bạn máy không có dòng `doan_luot` nên UPDATE không trúng gì) — giữ dòng `continue` cho rõ ý.

### Cách lùi
`git revert` các commit bước 2 (5 dòng trong game-v2.ts tự về như cũ) — hoặc chỉ cần KHÔNG chạy migration: mọi lệnh `doan-*` tự báo chưa mở, không lệnh cũ nào đổi hành vi (trừ `resume` bỏ qua phiên có `$.doan`, mà phiên ấy chỉ sinh ra từ lệnh `doan-*`).

### Việc Code 3 cần làm khi 0.Planer đã soát
1. `wrangler d1 execute … --remote --file server/migration-1909-game-doan.sql` (3 bảng + 5 chỉ mục, chỉ-thêm). 2. Đẩy Worker. 3. Kiểm bản sống bằng tài khoản thầy: `doan-mo` → có `doan.ma`, `doan.tran.hiep = 1`, payload không có `correct/solution`.

---

## BƯỚC 3 — Giao diện (19/09/2026)

**Tệp MỚI** (đều trong `src/game/than-thu-v2/`): `doan-kieu.ts` (kiểu gói tin) · `DoanHinh.tsx` (thần thú thật cắt từ atlas, quái/trùm/Linh Tâm SVG) · `doan.css` (mọi bộ chọn có tiền tố `.dh`) · `DoanCau.tsx` (thẻ câu giấy ấm) · `DoanSanh.tsx` · `DoanTran.tsx` (trong trận + trùm) · `DoanTungChuong.tsx` · `DoanKetChang.tsx` · `DoanHoTong.tsx` (khung điều khiển). `tests/doan-giao-dien.test.tsx` · `docs/anh-doan-ho-tong-1909/` (9 ảnh + `chup.mjs`) · `docs/hop-dong-mo-game-doan-ho-tong-1909.md`.
**Tệp SỬA:** `Game.tsx` (tab mới, cửa vào, Võ đài thứ Bảy) · `LearningBattle.tsx` (chỉ thêm chữ `export` trước `SpellArt`) · `server/src/game-v2-doan.ts` (khung nhìn thêm `cap`, `loaiQuai`, `loaiTrum` — CHỈ để vẽ, không vào lõi).
Commit (mỗi màn một commit, theo lệnh 0.Planer): 9023df2 nền · 2bac1ee Sảnh · 28795c2 Trong trận + Trùm · 62394c9 Tung chưởng · 36670bc Kết chặng · c40b279 khung + cửa vào + test + mã chụp · commit cuối: test bổ sung sau đột biến + sổ việc + hợp đồng cửa vào.

### Đã dựng
- **Lớp phủ toàn màn vẽ qua cổng vào `document.body`** → không dính kiểu nút của game cũ (`.spirit-game button…`), không đụng màn nào khác. Thẻ câu ghim biến màu của app về bản SÁNG nên chế độ tối không bị chữ trắng trên giấy.
- **Thần thú THẬT** (`evolutionCrop` + atlas `-cutout.png`, đúng hình thái theo cấp — cấp chỉ để vẽ) và **tia chiêu thức THẬT** (`public/than-thu-v2/spells/*.png`, dùng lại đúng `SpellArt` của màn luyện tập; ảnh vẽ ngang nên xoay −90° để bắn LÊN trúng quái như bản vẽ 4).
- Nội dung câu (công thức hoá, bảng số liệu, ảnh cắt từ đề, lời giải) dùng lại đúng bộ hiển thị của app: `ChemText`, `BangSoLieu`, `CauHinh`, `HinhTaiViTri`, `LoiGiaiCauSai`. Phần I lưới 2×2 (phương án dài/có ảnh → một cột), Phần II bốn hàng Đúng/Sai, Phần III ô nhập số.
- Màn 1 SẢNH: bản đồ + thần thú thật, thẻ "Chặng hôm nay" nói rõ câu của RIÊNG em hôm nay (đọc lệnh `recommendations` sẵn có: "3 câu Ester · 2 câu Ancol…"), nút vàng LÊN ĐƯỜNG, "Đi cùng bạn" (mở đoàn lấy mã / nhập mã), phòng chờ 4 ghế. **Đoàn lớp, vé, rương chuỗi, Trùm lớp, ấn thạch CHƯA hiện** — máy chủ chưa có số (bước 5, 6); không bịa số (có test).
- Màn 2 TRONG TRẬN: 8 vạch hiệp (◆ trùm), vòng đếm giờ (đỏ khi ≤ 10 s), cảnh trận, dải đồng đội CHỈ có trạng thái, thẻ câu, 3 nút đòn (Kỹ năng khoá khi < 2 NL), nút Chốt ("Chốt đòn · B + Đánh" / "Chốt · bỏ trống + Chắn"). Chốt rồi không đổi. Quãng nghỉ 6 s: đọc lại câu vừa làm + lời giải. Rời chặng phải chạm HAI lần.
- Màn 5 TRÙM: một câu Phần II, chỉ ý CỦA EM (viền vàng) có Đúng/Sai + nút Chốt; ý của bạn chỉ "đã chốt / đang nghĩ… / máy đỡ"; giáp 4 đoạn giữ NGUYÊN tới khi hiệp giải (không lộ ai đúng ai sai giữa chừng); 3 tín hiệu có sẵn, không ô nhập chữ; sau hiệp mới xin đáp án + lời giải. Không có câu chung hợp lệ → nói thật "Hiệp này không có câu chung phù hợp với cả đội" (đúng lệnh 0.Planer).
- Màn 4 TUNG CHƯỞNG: dải tên chiêu cắt ngang, tia thật của tối đa hai bạn RA ĐÒN, quái rung, chớp sáng, số vàng, HẠ GỤC ×n, LIÊN KÍCH ×2, bảng "VÌ SAO ĐÒN NÀY MẠNH" (×1,5 tự làm đúng · ×2 Liên Kích · ẤN · hiệu ứng kỹ năng). Em sai → bảng "HIỆP NÀY CỦA EM": thần thú đã chắn + câu sẽ quay lại. Bạn chắn (có thể vì sai) KHÔNG bao giờ bị nêu tên. Tự tắt 3 s, một chạm là tắt, giảm chuyển động = ảnh tĩnh + số.
- Màn 6 KẾT CHẶNG: VƯỢT CHẶNG + 3 sao + hoa giấy; thua → "Linh Tâm cần nghỉ · Thua không mất gì cả"; thẻ "HÔM NAY EM TIẾN BỘ GÌ" chỉ in số máy chủ đo được (dòng "lên bậc" ẩn khi máy chủ trả `null`); nút chính VỀ BẢNG NHIỆM VỤ.
- Cửa vào: tab **Đoàn Hộ Tống** trong game; tab cũ thành **Võ đài thứ Bảy** (mã `EscortRoom` giữ NGUYÊN, chỉ mở thứ Bảy theo giờ VN; ngày khác là thẻ mời sang Đoàn). Mở từ ngoài: `manDau="doan"` hoặc sessionStorage `game-v2:man-dau` — hợp đồng cho Code 2 ở `docs/hop-dong-mo-game-doan-ho-tong-1909.md`. Chưa chọn thú → lời mời đẹp phía trên màn chọn thú, chọn xong vào thẳng Sảnh.

### Bằng chứng
- `tests/doan-giao-dien.test.tsx` **15/15** · cùng `doan-core` 52 + `doan-may-chu` 21 + `escort-context-menu` + `escort-question` = 92/92.
- **Toàn bộ `npx vitest run`: 5804 test · 97 đỏ / 42 tệp = ĐÚNG NỀN · MỚI ĐỎ = [] · HẾT ĐỎ = []** (so từng tên test với lần chạy bước 2). `tsc` sạch cả app lẫn server.
- `node docs/anh-doan-ho-tong-1909/chup.mjs` (Playwright, đi qua cổng học sinh thật `/hs`, máy chủ giả): 6 màn **0 lỗi console**; **màn trận và màn trùm KHÔNG cuộn ở 360×740 và 390×844** (đo `scrollHeight − clientHeight = 0`, đáy nút cuối 728/740 và 832/844); **tung chưởng tự tắt sau 2,78 s**, một chạm là bỏ qua; `prefers-reduced-motion` → **0 phần tử còn animation**, vẫn hiện −114.
- **Cỡ gói (vite build, gzip −9): `DoanHoTong` JS 13,2 KB + CSS 6,7 KB = 19,9 KB** ≤ 60 KB; nạp riêng (`lazy`) nên không làm nặng Đảo thần thú. Không thêm ảnh, không thêm thư viện.
- Đột biến giao diện: **21 đột biến → 21 đỏ** (mọi ý trùm đều có nút · kỹ năng không khoá · chưa chọn vẫn chốt · chốt rồi vẫn đổi đòn · giả vờ có câu chung · dải đồng đội in "sai" · rời một chạm · bỏ trống vẫn gửi đáp án · không gắn lớp tĩnh · sai lệnh vào đoàn · tung chưởng không tự tắt / kéo 6 s / chạm không tắt · nêu tên bạn đã chắn · em sai vẫn "vì sao đòn mạnh" · in "lên bậc" khi không đo được · nút chính không về Bảng nhiệm vụ · chữ "nắm chắc" · bịa số trạm · khách thấy nút lên đường · thứ Bảy theo UTC). Vòng đầu sống 1 ("nêu tên bạn đã chắn") → đã thêm ca test, nay đỏ.

### Chưa làm trong bước này (nói thẳng)
- Màn 3 TIẾP SỨC (tấm trượt 3 thẻ) — CSS đã có sẵn, component + lệnh máy chủ làm ở bước 4.
- Các khối Sảnh cần số liệu bước 5/6 (Đoàn lớp 30 trạm, vé, chuỗi/rương, Trùm lớp, bạn đồng hành bù nhau, 6 ấn thạch) và dòng "Linh Tâm của lớp: trạm 17 → 18/30", mảnh khiên ở Kết chặng.
- Chưa kiểm trên bản sống thật (cần Worker có `doan-*` + Pages mới): nghiệm thu 1 "đi trọn chặng một mình 5–6 phút" mới kiểm ở test máy chủ (đi trọn 8 hiệp) + ảnh từng màn, chưa phải một lượt chơi thật liền mạch.

### Cách lùi
`git revert` dải commit bước 3 → tab game về như cũ ("Hộ Tống Linh Tâm" mở mọi ngày). Không có dữ liệu nào bị đụng.

### Sửa sau soát bước 3 (0.Planer, 19/09) — CỜ MỞ GAME + 4 ô SẮP MỞ + tung chưởng
- **CỜ MỞ GAME** (chặn gộp): bảng `cau_hinh`, khoá `doan_ho_tong`, JSON `{"dsSbd":["12121212"],"toanBo":false}` — cùng kiểu cờ EXP của Code 3. KHÔNG có dòng / JSON hỏng / thiếu bảng = TẮT với mọi em.
  - Máy chủ: `doanMoCho(env, sbd)` trong `game-v2-doan.ts`; mọi lệnh `doan-*` của em chưa được mở → "Đoàn Hộ Tống sắp ra mắt. Em chờ thêm ít hôm nhé." (kiểm TRƯỚC mọi thứ, không ghi gì); lệnh `profile` trả thêm `doanMo`. `game-v2.ts` thêm đúng 2 chỗ: tên hàm trong dòng import + một trường trong phản hồi `profile` (đã báo Code 3).
  - Giao diện: `doanMo=false` (hoặc máy chủ cũ không trả cờ) ⇒ game Y HỆT trước: 4 mục cũ, tên tab "Hộ Tống Linh Tâm", Võ đài mở MỌI ngày, không chữ "Đoàn" nào, lớp phủ Đoàn KHÔNG được dựng dù một khung hình; cửa ngoài xin mở Đoàn → về Đảo thần thú, không màn trống. `doanMo=true` ⇒ giao diện mới. Hàm thuần `cuaGame(doanMo, now)`.
  - Test: `tests/doan-cua-vao.test.tsx` 6 ca (dựng `Game` thật với fetch giả, cả hai phía cờ, chưa chọn thú, thứ Hai/thứ Bảy) + 2 ca cờ ở `doan-may-chu` (9 lệnh đều bị từ chối và không ghi dòng nào; theo danh sách; toanBo; JSON hỏng). Đột biến cờ: 12 → 12 đỏ ("máy chủ BỎ KIỂM CỜ" đỏ 2 test; vòng đầu sống 1 "cờ tắt vẫn dựng lớp phủ" → test nạp sẵn gói lazy rồi đếm số lần dựng, nay đỏ).
  - BẬT cho một em (0.Planer/Code 3 chạy, em KHÔNG chạy): `INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('doan_ho_tong','{"dsSbd":["12121212"],"toanBo":false}',datetime('now')) ON CONFLICT(khoa) DO UPDATE SET gia_tri=excluded.gia_tri,cap_nhat_luc=excluded.cap_nhat_luc;` — TẮT lại: xoá dòng ấy.
- **4 ô "SẮP MỞ" có khoá** ở Sảnh: Đoàn lớp · Rương chuỗi ngày · Trùm lớp (Chủ nhật 20:00) · Ấn thạch dạng — chỉ tên + một dòng mô tả + biểu tượng khoá, không con số nào (test khoá: không chữ số ngoài "20:00", không nút bấm).
- **Tung chưởng**: hai tia (lửa của em + nước của bạn) nay xuất phát từ ĐẦU từng thần thú và hội vào quái như bản vẽ 4 (cột tia 168 px × 37 vh, nghiêng ±17°); số sát thương đặt dưới dải tên chiêu, cách mép phải 16 px, không đè chữ.
- Test đo giờ: ca "tự tắt sau 3 giây" từng ĐỎ OAN khi chạy chung cả bộ (đồng hồ giả trôi theo giờ thật, máy nặng thì màn đã tự tắt trước khi test kịp tìm) → viết lại KHÔNG chờ đồng hồ: bắt đúng cái hẹn giờ 3000 ms rồi tự bấm; ca "một chạm là tắt" kiểm NGAY sau cú chạm (không còn được hẹn giờ cứu). Hạn chờ findBy/waitFor của hai tệp giao diện nới lên 8 s.
- Toàn bộ vitest sau cùng: **5812 test · 97 đỏ / 42 tệp = ĐÚNG NỀN · MỚI ĐỎ = []**; tsc sạch app + server.

---

## BƯỚC 4 — Tiếp sức (21/09/2026)

**Tệp MỚI:** `server/src/game-v2-doan-the.ts` (hàm thuần soạn thẻ) · `tests/doan-the-goi-y.test.ts` · `src/game/than-thu-v2/DoanTiepSuc.tsx` (màn 3) · `docs/anh-doan-ho-tong-1909/3-tiep-suc-390-sang.jpg`.
**Tệp SỬA:** `server/src/game-v2-doan.ts` (lệnh + cờ assisted + sổ tiếp sức + EXP) · `doan-kieu.ts` · `DoanTran.tsx` · `DoanHoTong.tsx` · `doan.css` · 2 tệp test cũ · `chup.mjs`. KHÔNG đụng `game-v2.ts`, không migration mới (bảng `doan_tiep_suc` đã có từ bước 2).

### Thẻ do MÁY CHỦ soạn từ dữ liệu có sẵn của câu (không sinh nội dung mới)
| Thẻ | Nguồn | Khi nào KHÔNG phát |
|---|---|---|
| Nhắc công thức | trường `kienThuc` của câu ("Kiến thức gốc của câu này: a · b"); thiếu thì câu chốt của lời giải có cấu trúc | không có kiến thức VÀ (lời giải không có phần nào khác ngoài câu chốt, hoặc câu chốt lộ đáp án) |
| Loại 1 phương án | máy gạch MỘT phương án SAI, rút tất định theo (mã chặng, qid) | không phải Phần I |
| Chỉ bước đầu | `buoc[0]` của lời giải NHIỀU bước | lời giải < 2 bước, bước đầu lộ đáp án, hoặc dài > 60% toàn văn lời giải |
Ba chốt (thà thiếu thẻ còn hơn lộ bài): (1) `loDapAn` — Phần I: chữ cái ("chọn B", "B là đúng", "đáp án: b") hoặc NỘI DUNG phương án đúng; Phần II: dãy Đ/S liền hoặc rời ("Đúng, Sai, Đúng, Sai"), "ý a đúng", dấu ✓✗; Phần III: đáp số như một con số trọn vẹn (12,5 = 12.5, nhưng 0,125 / 112,5 / 12,55 KHÔNG bị bắt nhầm); (2) không phải toàn bộ lời giải; (3) câu không lời giải → chỉ còn "Loại 1 phương án" (Phần II, III: không thẻ nào → em được báo "câu này chưa có thẻ gợi ý, em tự làm nhé" ngay lúc xin, không treo tín hiệu).

### Luồng
B (chưa chốt) bấm **"Cần tiếp sức · còn 2 lần được tiếp sức"** → A (ĐÃ chốt) thấy nút vàng "Tiếp sức cho <tên>" → tấm trượt: thân câu RÚT GỌN của B (không phương án, không ý, "em không thấy … đã chọn gì"), 3 thẻ (thẻ máy chủ không phát thì khoá), dòng "không bao giờ là đáp án" → A chọn LOẠI thẻ → B nhận NỘI DUNG thẻ + biểu ngữ "LIÊN KÍCH ×2 SẴN SÀNG" → B chốt → lõi tính Liên Kích.
- Người tiếp sức KHÔNG BAO GIỜ thấy nội dung thẻ, phương án, đáp án hay SBD của bạn (test soi gói tin).
- **Câu đã nhận thẻ chấm với `assisted:true`** (cờ do máy chủ quyết theo phòng, không do máy em khai) → đường `answer` cũ tự lo: không ghi `su_kien_hoc`, không thưởng mastery — đúng hay sai đều vậy. Test đọc thẳng `game_v2_attempt` + đếm sổ.
- Trần: mỗi chặng NHẬN 2 lần, mỗi hiệp GIÚP 1 bạn, chưa chốt thì chưa giúp được, bạn chưa bật tín hiệu thì không gửi được, hiệp trùm không có thẻ.
- Đi MỘT MÌNH (hoặc bạn đã rời): bật tín hiệu là **bạn máy gửi thẻ ngay** (rút tất định) → vẫn có Liên Kích; bạn máy không có EXP, không có dòng sổ lượt. Còn bạn THẬT trong đoàn thì máy không chen vào.
- Sổ `doan_tiep_suc`: ghi lúc gửi thẻ (`INSERT OR IGNORE`), `thanh_cong` cập nhật trong CÙNG giao dịch với lần lưu phòng khi hiệp giải.
- **EXP tiếp sức: gọi `ghiTiepSuc(env, sbdNgườiGiúp, now, "<mã chặng>|<hiệp>|<ghế được giúp>")` của Code 3** — game không tự ghi sổ EXP; hiển thị đúng số trả về ("+3 EXP tiếp sức"); cờ EXP mới tắt → 0, không hiện gì.
- Sửa kèm: tải lại trang SAU khi chốt, máy em mất đề → máy chủ gửi lại đề (bản công khai) trừ khi máy em báo đã có (`coCau`).

### Bằng chứng
- `doan-the-goi-y` 11/11 (gồm quét 300 câu sinh tự động: không thẻ nào lộ đáp án / là toàn bộ lời giải) · `doan-may-chu` 28/28 (5 ca Tiếp sức mới) · `doan-giao-dien` 18/18 (3 ca màn 3) · `doan-core` 52 · `doan-cua-vao` 6. tsc sạch app + server. Playwright: 7 màn 0 lỗi console, các phép đo bố cục như cũ.
- Đột biến bước 4: **34 → 32 đỏ**, 2 TƯƠNG ĐƯƠNG do hai chốt chồng nhau ("câu chốt là toàn bộ lời giải" bị chốt 2 bắt; "Phần II/III có thẻ loại phương án" bị điều kiện đáp án một chữ cái bắt). Vòng đầu sống thêm 3 → đã thêm test (bước đầu > 60% toàn văn; một bước + câu chốt dài; kiến thức chứa phương án đúng).
- Toàn bộ vitest (đã gộp main 9d1db2d): 6003 test · 108 đỏ / 50 tệp. **11 đỏ mới KHÔNG phải của game**: chạy riêng 8 tệp ấy trên bản SẠCH của main ad3917a vẫn đỏ đúng 11 (btvn-submit, ca-dang-mo, cau-theo-qid, ho-so-len-bang-may-chu, kenh4 ×3, man-ca-thi-may-chu-moi, reset-toan-app ×2, teacher-news — dấu hiệu: WeakMap trong reset-toan-app.ts + truy vấn cổng reset chen vào + mốc ngày 21/09). Đã nhắn thẳng Code 3 kèm cách tái hiện. Loại 11 test ấy: 97 đỏ / 42 tệp = nền, **MỚI ĐỎ của game = []**.

### Cách lùi
`git revert` commit bước 4: nút xin/giúp biến mất, `assisted` về `false` cứng như bước 2; bảng `doan_tiep_suc` để nguyên (chỉ-thêm).

---

## BƯỚC 5 — Mồi hằng ngày (21/09/2026)

**Tệp MỚI:** `server/src/game-v2-doan-mua.ts` · `server/migration-2109-game-doan-mua.sql` (chỉ-thêm: `doan_ve_so`, `doan_trum_lop`) · `tests/doan-mua.test.ts`.
**Tệp SỬA:** `server/src/game-v2-doan.ts` (lệnh `doan-sanh`, cổng vé ở `doan-mo`/`doan-vao`, hoàn vé ở `doan-roi`, khối `doanLop` ở kết chặng, chặn vào đoàn thứ hai) · `doan-kieu.ts` · `DoanSanh.tsx` · `DoanKetChang.tsx` · `DoanHoTong.tsx` · `doan.css` · test + ảnh. KHÔNG đụng `game-v2.ts`.
Commit: 7a203ac (máy chủ) · commit giao diện + sổ việc.

### Luật
- **Vé hộ tống** — sổ chỉ-thêm `doan_ve_so`, số vé = SUM(so), MỖI khoản một khoá idempotent (nạp lại hai lần không cộng trùng — có test): `<sbd>|dat|<ngày>` +2 · `<sbd>|lo|<mã>|<chỉ số>` +1 · `…|ruong|<mốc>|<ngày>` · `…|moc|<mùa>|<trạm>` +1 · `…|trum|<mùa>|<Chủ nhật>` +1 · `…|tieu|<mã chặng>` −1. **Vé CHỈ sinh từ việc học: game gọi `capNhatExp` rồi ĐỌC `docThanhTichNgay` của Code 3 (hôm nay + hôm qua, vì khoản có thể ghi bù muộn) — không tự tính "đạt ngày"/"đúng nhịp".** Lô trễ nhịp (exp 4) không có vé. Cờ EXP mới tắt cho em → không có vé, vẫn có chặng miễn phí mỗi ngày.
- **Chặng đầu ngày (giờ VN) MIỄN PHÍ; chặng thêm tốn 1 vé**, trừ NGAY lúc mở/vào đoàn (khoá theo mã chặng nên bấm lại không trừ đôi). Sảnh bỏ dở KHÔNG đốt chặng miễn phí (chỉ chặng đã lên đường mới tính); rời sảnh trước khi lên đường → HOÀN vé; sảnh hết hạn 1 giờ → hoàn vé ở lần mở Sảnh kế. Đang ở một đoàn thì không vào được đoàn thứ hai (chặn lách "hai chặng miễn phí").
- **Hết vé → từ chối bằng lời chỉ cách kiếm vé** (nghiệm thu 4): "Hôm nay em đã đi chặng miễn phí rồi và em chưa có vé. Vé chỉ kiếm bằng học: đạt nhiệm vụ ngày +2 vé, xong một lô bài tập đúng nhịp +1 vé…" — KHÔNG mở chặng, không ghi dòng `doan_chang` nào.
- **Mùa 4 tuần** tính từ NGÀY ghi trong mùa game (`game_v2_settings.season.id` = `<YYYY-MM-DD>-mua-N`, Code 3 ghi lúc reset) — không gắn cứng 21/09; reset dời thì mùa 1 dời theo; chưa reset hoặc ngày ở tương lai → khối 28 ngày theo lịch (bắt đầu thứ Hai).
- **Đoàn lớp 30 trạm**: số chặng THẮNG của lớp trong mùa ÷ `changMoiTram(sĩ số)` = ⌈sĩ số × 12 / 30⌉ (lớp 30 em: 12 chặng/trạm; tối thiểu 2). Đọc thẳng từ `doan_luot` (bạn máy không có dòng → không bao giờ được tính; chặng thua, chặng ngoài mùa không tính). Mốc 10/20/30 (Rừng Xúc Tác · Hồ Cân Bằng · Thành Pha Lê): em ĐÃ GÓP SỨC trong mùa nhận +1 vé.
- **Rương chuỗi 3/7/14** = 1/2/3 vé, "rương may mắn" +1 rút TẤT ĐỊNH theo (sbd, ngày, mùa); mở đúng ngày chuỗi chạm mốc, xem lại không mở lần hai; hôm nay chưa đi thì chuỗi tới hôm qua vẫn sống.
- **Trùm lớp — BẢN GỌN (Boss đồng ý cắt phạm vi có chủ ý):** không có phòng thời gian thực. Chặng THẮNG kết thúc trong khung **Chủ nhật 20:00–20:20 giờ VN** cộng sát thương của em vào sổ chỉ-thêm `doan_trum_lop`; mục tiêu = sĩ số × 100; lớp đạt → em đã góp tối đó +1 vé. Sảnh: trong khung là thanh máu "cả lớp đã góp X/Y", ngoài khung là thẻ hẹn "Chủ nhật 20:00 · còn N ngày M giờ", sáng thứ Hai vẫn thấy kết quả tối qua.
- Kết chặng: "Linh Tâm của lớp: trạm 17 → 18/30 · Em là bạn thứ 10 góp sức hôm nay · còn 2 trạm tới <mốc>"; nút "Đi thêm một chặng · 1 vé"; hết vé → "Làm xong nhiệm vụ hôm nay để nhận 2 vé."
- Chưa chạy migration bước 5: `doan-sanh` trả `sanh:null` (Sảnh giữ 4 ô SẮP MỞ), game vẫn chơi được một chặng miễn phí/ngày, không lỗi thô.

### Bằng chứng
- `tests/doan-mua.test.ts` **15/15** (5 ca hàm thuần tính tay + 10 ca D1 SQLite thật: miễn phí → từ chối → đạt ngày → có vé → trừ 1; nạp lại 3 lần không cộng trùng; cờ EXP tắt; sảnh bỏ dở/hoàn vé/đoàn thứ hai; thiếu migration; trạm lớp + bạn thứ mấy; thua/ngoài mùa; rương + mốc; Trùm lớp trong/ngoài khung, thắng/thua, quà; em không có lớp). `doan-may-chu` 28 · `doan-giao-dien` 22 (4 ca bước 5) · `doan-core` 52 · `doan-cua-vao` 6 · `doan-the-goi-y` 11 = **134/134**. tsc sạch app + server. Playwright 7 màn 0 lỗi console.
- Đột biến bước 5: **35 → 34 đỏ**; 1 tương đương ("Trùm lớp theo giờ UTC": mốc nửa đêm và thứ trong tuần lệch cùng một lượng nên ra cùng thời điểm mở — đã thử 4 mép giờ). Vòng đầu sống thêm 1 ("chặng thua cũng góp Trùm lớp") → thêm ca thua trong khung giờ, nay đỏ.
- Toàn bộ vitest: 6040 test · 111 đỏ / 52 tệp; **đỏ thuộc game = []**. Đỏ ngoài nền đều có sẵn trên main sạch 56c0704 (đã chạy lại trên worktree sạch): nhóm reset-toan-app + ke-hoach-than-thu + 11 test đã báo Code 3 hôm nay. Riêng test "MỌI bảng đều được phân loại XOÁ/GIỮ" sẽ kể thêm 2 bảng mới của game → đã nhắn Code 3 thêm `'doan_ve_so','doan_trum_lop'` vào nhóm XOÁ.

### Cách lùi
`git revert` hai commit bước 5: Sảnh về 4 ô SẮP MỞ, mọi chặng lại miễn phí như bước 4. Hai bảng mới để nguyên (chỉ-thêm) hoặc DROP theo ghi chú đầu tệp migration.

---

## BƯỚC 6 — Ấn thạch dạng · bạn đồng hành bù nhau · bảng cho thầy (21/09/2026)

**Tệp MỚI:** `server/src/game-v2-doan-an.ts` · `server/migration-2109-game-doan-trum-cau.sql` (chỉ-thêm `doan_trum_cau`) · `tests/doan-an-thach.test.ts` · `docs/hop-dong-doan-hien-thi-2109.md` · ảnh `1c-sanh-cuoi-trang`. **SỬA:** `game-v2-doan.ts` · `game-v2-reports.ts` (1 dòng định tuyến `doan-bao-cao` + import) · `DoanSanh/DoanTran/DoanKetChang/DoanHoTong/doan-kieu/doan.css` · test. Commit a841b74 (máy chủ) + commit giao diện.
- **Ấn thạch** đọc `nam_kt_dang` bằng ĐÚNG MỘT định nghĩa "dạng yếu" của hồ sơ (`dangYeu`): NỨT ⇔ dạng yếu; SÁNG = đủ ≥ 4 câu đã gặp và không yếu; chưa đủ căn cứ → chưa có ấn. "Còn N câu nữa là sáng" = max(1, số câu cần ổn thêm để tỉ lệ ≥ 0,7, số câu mới sai). Sảnh hiện tối đa 6 ấn (nứt trước), kèm tên biến thể kỹ năng của thần thú em.
- **Trong trận:** lúc vào đoàn chụp MỘT lần tập dạng ấn sáng → câu thuộc dạng ấy mang `an:true`; em dùng Kỹ năng ở hiệp ấy → biến thể ấn ×1,25 đúng công thức (test: 24, 24, 30). Không tăng chỉ số thô; Đánh thường không ăn ấn. Nút kỹ năng đổi tên biến thể + "ấn sáng ×1,25".
- **Bạn đồng hành bù nhau:** bạn cùng lớp có ấn SÁNG ở dạng em nứt VÀ ngược lại; chỉ nói điều mỗi bên VỮNG; tất định theo (sbd, ngày); bạn chưa chọn thú thì bỏ qua.
- **Hào quang / danh hiệu** (lệnh `doan-hien-thi`): ≥ 3 ấn sáng bạc, ≥ 6 vàng; "Người tiếp sức" khi giúp THÀNH CÔNG ≥ 3 lần / 7 ngày. Hợp đồng cho Code 2/4/1: `docs/hop-dong-doan-hien-thi-2109.md` (em không sửa tệp của họ).
- **Bảng cho thầy** `POST /game-v2-admin {action:'doan-bao-cao', lop?, soNgay?}`: ai giúp ai, Người tiếp sức của tuần (bạn máy không bao giờ lọt), lớp yếu dạng nào qua CÂU TRÙM (sổ `doan_trum_cau`, không tên em nào). Màn hiển thị ở app thầy là việc của Code 1.
- Kết chặng thêm dòng "Ấn Ester: còn 3 câu nữa là sáng → mở <biến thể>".
- Bằng chứng: `doan-an-thach` 8/8 · `doan-giao-dien` 24 · `doan-may-chu` 28 · `doan-mua` 15 · `doan-core` 52 · `doan-cua-vao` 6 · `doan-the-goi-y` 11 · `doan-dao-hop-dong` 4 = **148/148**; tsc sạch; Playwright 0 lỗi console. Đột biến bước 6 + hợp đồng Đảo: 20 → 19 đỏ, 1 tương đương (`so-tay` bỏ `allowed`: kho câu của `readScope` vốn chỉ chứa dạng có bằng chứng). Toàn bộ vitest sau khi gộp main: 6185 test · 101 đỏ / 44 tệp, **đỏ thuộc game = []**; ngoài nền chỉ có `reset-toan-app-1909` (bảng mới `doan_trum_cau` chưa phân loại — đã nhắn Code 3 thêm vào BANG_XOA) và `dao-chon-ban-dong-hanh` của Code 6 (chạy riêng xanh, đỏ oan khi máy nặng).

## Việc cho ĐẢO THẦN THÚ bản mới (Code 6) — phần máy chủ
`core.ts`: `chooseSessionWithRoles` (chooseSession giữ NGUYÊN kết quả — có test so từng mode) · `ly-do-thuong.ts` (chữ sẵn in theo mốc 20/40/40) · `game-v2.ts`: `start` trả `role`, `answer` trả `lyDoThuong`, lệnh đọc-chỉ `so-tay`. Hợp đồng: `docs/hop-dong-dao-than-thu-may-chu-2109.md`. Commit 6069d51, 309c969. **Còn lại: nối vỏ `dao/DaoThanThu` vào `Game.tsx`** theo `docs/hop-dong-dao-than-thu-prop-2109.md` khi vỏ lên main.

### Nối ĐẢO THẦN THÚ bản mới vào `Game.tsx` — đợt 1 (21/09)
Vỏ `dao/DaoThanThu` của Code 6 CHƯA có trên main (mới có màn 1 `ChonBanDongHanh`, màn 2 `DaoCuaEm`, `TuiDo`), nên nối TỪNG MÀN dùng độc lập được, nạp lazy:
- `profile.choice` → `dao/ChonBanDongHanh` thay bảng chọn thú cũ (`choose` rồi `rename` nếu em đặt tên; lời mời Đoàn qua `moiDoan`; thẻ mở đầu khác nhau theo SBD).
- tab Đảo → `dao/DaoCuaEm` bọc trong `.dao` thay `mission-dashboard` + `spirit-hero` (LÊN ĐƯỜNG = `sync`+`start` sẵn có; ôn theo nhắc = `start('repair')`; nạp = `invest`; đổi tên = `rename`). GIỮ dưới đảo: nút "Tiếp tục lượt học gần nhất" và `ImmortalShield` (khiên chống đuổi) tới khi vỏ/Túi đồ lo. Ẩn đầu trang cũ ở tab Đảo + màn chọn thú; thanh mục GIỮ (vỏ chưa có thanh dưới).
- Dọn các biến/nhập khẩu chết theo (xem trước tiến hoá, form đổi tên cũ…). Tab `learn` (trận luyện cũ) CHƯA đổi — chờ màn 3 của Code 6.
- Bằng chứng: tsc sạch; `doan-cua-vao` 6 · `doan-giao-dien` 24 · `dao-cua-em` 13 · `khoa-vai-3-app` 34 xanh; Playwright qua cổng /hs: đảo + chọn thú 0 lỗi console. `dao-chon-ban-dong-hanh` của Code 6 CHẬP CHỜN (1/8 lúc đỏ lúc xanh khi chạy riêng, không liên quan Game.tsx) — đã báo Code 6. Hai script tay `scripts/kiem-khien-mien-tu.mjs`, `kiem-evolution-v2.mjs` còn tìm markup cũ (`spirit-hero`…) — không thuộc vitest.
- Còn lại: khi Code 6 đưa vỏ `dao/DaoThanThu` lên main → thay ba chỗ trên bằng MỘT vỏ theo `docs/hop-dong-dao-than-thu-prop-2109.md`.

### Nối ĐẢO THẦN THÚ bản mới vào `Game.tsx` — đợt 2: MỘT VỎ, trọn vòng (21/09) — thay đợt 1
- `Game.tsx` nạp lazy đúng MỘT vỏ `dao/DaoThanThu` của Code 6 khi `profile.choice || tab==='home'`: `sbd, profile, doanMo, call=request, tasks, moiDoan = doanMo && cửa vào là Đoàn, onMoDoan/onMoVoDai/onMoTienBo = đổi tab, onDong`. `exp`/`chuoiNgay` để vắng (cây Game không có EXP mới; vỏ tự ẩn). Vỏ tự lo choose → rename, recommendations, so-tay, resume → sync → start, answer, complete, shield-use, invest.
- Khi vỏ đang hiện: ẩn đầu trang cũ, thanh mục cũ, dòng trạng thái cũ; khung game bỏ đệm (`.spirit-game-dao` trong game.css). Ra Võ đài / Tiến bộ / Đoàn thì thanh mục cũ hiện lại, bấm "Đảo thần thú" là về đảo. Tab `learn` cũ GIỮ cho lượt Võ đài (arena).
- Bỏ khỏi `Game.tsx` (vỏ đã lo): bảng chọn thú cũ, `mission-dashboard`, `spirit-hero`, hẹn giờ `recommendations` 30 s, hàm `resume`, `ImmortalShield` đặt rời, xem trước tiến hoá.
- Cờ Đoàn: `doanMo=false` ⇒ thanh dưới của vỏ không có mục Đoàn, không lệnh `doan-*` nào được gửi, Võ đài mở mọi ngày với tên cũ; `doanMo=true` ⇒ mục Đoàn mở lớp phủ Đoàn Hộ Tống. Chưa chọn thú + vào từ cửa Đoàn ⇒ vỏ hiện màn chọn thú kèm lời mời.
- Bằng chứng: tsc sạch; 18 tệp test game + đảo + cửa vào = **282/282** (`doan-cua-vao` viết lại quanh vỏ: soi prop truyền vào + các lối ra, 6 ca, giữ ca "cờ tắt không dựng lớp phủ Đoàn dù một khung hình"). **Playwright TRỌN VÒNG qua cổng /hs thật, máy chủ giả có trạng thái** (mã ở scratchpad `tron-vong-dao.mjs`): (a) CHƯA có thú + cờ bật, 390×844: chọn thú → đảo → LÊN ĐƯỜNG → 2 ải (lý do thưởng "sao thứ 2" hiện đúng) → `complete` → Về đảo → Sổ tay (có Ester) → Túi đồ → mục Đoàn → Sảnh Đoàn; (b) ĐÃ có thú + cờ tắt, 360×740: cùng vòng → Võ đài có 4 mục cũ, KHÔNG lệnh `doan-*` nào. Cả hai 0 lỗi console.
