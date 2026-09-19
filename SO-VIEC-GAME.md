# SỔ VIỆC — GAME "ĐOÀN HỘ TỐNG" (phiên Code 5 - Game)

Đề bài: `prompt-game-doan-ho-tong.md` · Thiết kế đã chốt: `DE-XUAT-HO-TONG-LINH-TAM-1909.md` (mục 7) · Điều phối + soát: 0.Planer.
Nơi làm: worktree riêng, nhánh `claude/zealous-taussig-a50c90` (tách từ main 30b2fb7) — 0.Planer gộp vào main như tiền lệ nhánh rút đề riêng. Code 5 KHÔNG đẩy Worker/Pages.

| Bước | Việc | Trạng thái |
|---|---|---|
| 1 | Lõi thuần `doan-core.ts` + test bảng giá trị + đột biến | **XONG 19/09** — chờ 0.Planer soát |
| 2 | Máy chủ `server/src/game-v2-doan.ts` (mở/vào/nộp/kết chặng, chọn câu từ hồ sơ, ghi `su_kien_hoc` nguồn `game`) | chưa làm |
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
- Hành động: Đánh / Chắn (đúng 12, sai hoặc bỏ trống vẫn được khiên yếu 4) / Kỹ năng (tốn 2 năng lượng; mỗi câu đúng +1, tối đa 3).
- Trùm: một câu 4 ý chia vòng tròn cho các ghế (máy chủ giao lại theo bậc bằng `datGiaoY`); đúng ≥ 3/4 → vỡ giáp, quét sạch quái tồn; không vỡ → trùm đánh 8 × số đoạn giáp còn.
- Thắng = Linh Tâm còn máu sau hiệp 8. Sao: về đích 1 · còn từ nửa máu +1 · vỡ giáp cả hai trùm +1. Thua = 0 sao, không mất gì.
- `khungNhinHiep(kq, ghế)`: thứ được gửi xuống máy từng em — về BẠN chỉ có "ra đòn / chắn / giữ vị trí"; đòn trượt, khiên yếu, không chốt đều KHÔNG phân biệt được; không có đúng/sai, hệ số, ý trùm của bạn.

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
| 9 | Ghế gửi "kỹ năng" khi thiếu năng lượng → lõi coi là Đánh (máy chủ vẫn phải chặn trước bằng `kiemHanhDong`) | Không để một gói tin lạ làm hỏng cả phòng |

Điều còn hở (nói thẳng): tổng khiên của hiệp là số công khai, nên khi chỉ MỘT bạn chắn thì khiên 4 (thay vì 12) để lộ bạn ấy làm sai. Đây là hệ quả tất yếu của việc hành động có tác dụng lên sân; lõi không lộ câu nào, đáp án nào, bạn chọn gì.

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
