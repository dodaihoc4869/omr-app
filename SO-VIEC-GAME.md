# SỔ VIỆC — GAME "ĐOÀN HỘ TỐNG" (phiên Code 5 - Game)

Đề bài: `prompt-game-doan-ho-tong.md` · Thiết kế đã chốt: `DE-XUAT-HO-TONG-LINH-TAM-1909.md` (mục 7) · Điều phối + soát: 0.Planer.
Nơi làm: worktree riêng, nhánh `claude/zealous-taussig-a50c90` (tách từ main 30b2fb7) — 0.Planer gộp vào main như tiền lệ nhánh rút đề riêng. Code 5 KHÔNG đẩy Worker/Pages.

| Bước | Việc | Trạng thái |
|---|---|---|
| 1 | Lõi thuần `doan-core.ts` + test bảng giá trị + đột biến | **XONG 19/09** — 0.Planer đã soát + gộp main 243e746, duyệt cả 9 quyết định (ghi chú 9 → đã sửa, xem mục "Sửa sau soát") |
| 2 | Máy chủ `server/src/game-v2-doan.ts` (mở/vào/nộp/kết chặng, chọn câu từ hồ sơ, ghi `su_kien_hoc` nguồn `game`) | **XONG 19/09** — chờ 0.Planer soát; Code 3 chạy migration + đẩy Worker |
| 3 | Giao diện 6 màn theo bản vẽ | chưa làm |
| 4 | Tiếp sức (3 thẻ gợi ý máy chủ soạn) | chưa làm |
| 5 | Mồi hằng ngày (vé, Đoàn lớp, rương chuỗi, Trùm lớp) | chưa làm |
| 6 | Ấn thạch dạng + hợp đồng hiển thị ngoài game | chưa làm |

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
