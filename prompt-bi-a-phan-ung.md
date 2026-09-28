# Prompt — Bi-a Phản Ứng: game bi-a học Hoá, chơi với nhau, cửa thứ ba trên Sảnh Bát Linh

Soạn 28/09/2026. Bản vẽ chơi được: `docs/ban-ve-bi-a-2809/bi-a-phan-ung.html` (artifact https://claude.ai/artifact/7FjPu2CSL4QtnigCD4gdQg). Chưa build. Thầy gõ **HÃY THỰC THI PROMPT NÀY** thì mới làm.

## Góc nhìn khác

- Đừng nhét câu hỏi vào giữa các cú đánh. Kiểu "đánh một cú, trả lời một câu" làm học sinh chán sau 2 ván vì câu hỏi cắt nhịp chơi. Bài toán thật là biến kiến thức Hoá thành **lợi thế chiến thuật**: mỗi bi là một ion, hai ion phản ứng va nhau thì phản ứng thật hiện ra và em được đánh tiếp. Em thuộc bảng tính tan sẽ nhắm Ba²⁺ vào SO₄²⁻ để giữ lượt.
- App đã có kinh tế chặt: 40 câu/ngày, trần 120 EXP game/ngày. Nếu Bi-a phát EXP thì học sinh sẽ bỏ học để cày điểm ở đây. Nên làm ngược lại: Bi-a **tiêu vé**, và vé kiếm bằng câu đã học. Bạn rủ đấu thì phải học trước, nên game chơi với bạn trở thành động cơ để học.
- Chơi với nhau không cần máy chủ thời gian thực đắt tiền. Bi-a đánh theo lượt, mỗi cú chỉ là 3 con số (hướng, lực, xoáy). Hai máy mô phỏng ra cùng một kết quả, máy chủ chỉ chuyển một gói tin mỗi cú.

## Người top 0,1% làm gì

- **Vật lý tất định**: bước thời gian cố định 1/240 giây, trong mô phỏng chỉ dùng + − × ÷ √, nên cùng một cú cho cùng một kết quả trên mọi điện thoại. Máy chủ mô phỏng lại từng cú để chấm, học sinh không sửa được kết quả.
- **Không đọc D1 trong trận.** D1 từng nghẽn ngày 21/09. Mỗi bàn đấu chạy trong một Durable Object qua WebSocket, D1 chỉ ghi một lần khi hết ván.
- **Màu hiện tượng phải đúng sách**: Cu(OH)₂ xanh lam, Fe(OH)₃ nâu đỏ, BaSO₄ trắng. Màu sai là dạy sai. Bảng phản ứng là dữ liệu thầy duyệt, không viết cứng trong mã.
- **Luật giải thích được trong 3 dòng.** Thử thách lượt và Câu chốt là lớp sâu hơn cho em giỏi, em mới vẫn chơi được ngay.
- **Ván ngắn 4–6 phút**: 13 bi thay vì 15, bi to gần gấp đôi tỉ lệ bàn thật để đọc được công thức trên màn 390 px.

## PROMPT

```
VAI TRÒ
Em là kỹ sư game nhiều người chơi kiêm lập trình viên React/TypeScript và Cloudflare Workers, đã phát hành ít nhất 5 game vật lý đánh theo lượt trên điện thoại và 3 hệ thống phòng đấu WebSocket.

BỐI CẢNH
- Trung tâm luyện thi Hoá của thầy Đỗ Đại Học, 100–300 học sinh lớp 10–12. Kho omr-app: React + Vite + TS + Tailwind v4 ở src/, Cloudflare Worker + D1 + R2 ở server/. Đọc CLAUDE.md và DIEU-PHOI.md trước khi sửa.
- App học sinh (/hs → src/screens/StudentPortalScreen.tsx). Chế độ Game Hoá 2.0 (cờ cheDo2) mở Sảnh bản đồ Bát Linh (src/components/hoa2/SanhBanDo.tsx) với 2 game: Bát Linh Đảo (src/game/than-thu-v2/dao/) và Đoàn Hộ Tống (src/game/than-thu-v2/DoanHoTong.tsx). Bi-a Phản Ứng là cửa thứ ba trên Sảnh này.
- Kinh tế đã chốt: Thể lực 40 câu/ngày chung 2 game (Huyết Chiến 80); trần 120 EXP game/ngày (src/lib/hap-thu-ngay.ts, ghiKhoanExpGame ở server/src/exp-d1.ts); tiền: EXP (ống nghiệm), Vàng (server/src/game-v2-shop.ts), Ấn thạch sáng, Mảnh khiên.
- Hạ tầng: Worker chưa có Durable Object hay WebSocket (server/wrangler.toml chỉ có D1 "DB", R2 "DE", 2 cron). Đoàn Hộ Tống hỏi vòng /game-v2/doan-xem mỗi 1,5 giây, trạng thái JSON trong D1 bảng doan_chang có revision. D1 từng nghẽn ngày 21/09 nên trong trận không đọc D1.
- Câu hỏi: kho R2 qua server/src/game-v2-bank.ts; publicQuestion() bỏ đáp án; grade() chấm ở máy chủ; loại câu tự luận bằng src/lib/cau-tu-luan.ts (laCauTuLuan); khối lớp theo src/lib/khoi-cau.ts. Xác thực học sinh: gameToken HMAC (server/src/game-v2-auth.ts).
- Giao diện: token màu ở src/styles/tokens.css và src/components/bang-nhiem-vu/m3-theme.css; game dùng Baloo 2 (tiêu đề, số) + Be Vietnam Pro (chữ); nút vàng 3D; nền biển đêm (tối) và hoàng hôn (sáng); `npm run check:mau` cấm hex thô trong src/; chữ theo docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md.
- Bản vẽ thầy duyệt, chơi được: docs/ban-ve-bi-a-2809/bi-a-phan-ung.html. Chép lõi vật lý, luật, dữ liệu bộ bi, bố cục màn chơi, Sảnh Bi-a, Câu chốt, Kết thúc ván từ tệp này.
- Phát hành: Worker chỉ phiên Code 3 đẩy, Pages do Code 2 đẩy, luôn từ worktree sạch. Phiên cloud không có khoá Cloudflare.
- Học sinh chơi sau giờ học, với bạn cùng lớp ở nhà hoặc ngồi cạnh nhau ở trung tâm.

NHIỆM VỤ
Build game "Bi-a Phản Ứng" thành cửa thứ ba trên Sảnh Bát Linh theo 4 giai đoạn. GĐ1: lõi vật lý + màn chơi + chung một máy + A.I Đỗ Đại Học + Câu chốt chấm ở máy chủ. GĐ2: đấu online 1–1 (mời bạn, mã bàn 4 số, vé, Điểm bàn, bảng tuần của lớp). GĐ3: thử thách lượt, bộ bi "Kim loại và ion" (dãy điện hoá) và "Nhận biết hữu cơ", gậy và mặt bàn ở Cửa hàng. GĐ4: giải đấu lớp do thầy mở trên app giáo viên. Mỗi giai đoạn kết thúc bằng commit, test xanh và bản chạy được.

NGUYÊN TẮC BẮT BUỘC
- Lõi vật lý thuần TS, dùng chung máy khách và Worker (src/game/bi-a/vat-ly.ts). Bước cố định 1/240 giây. Vòng mô phỏng chỉ dùng + − × ÷ và Math.sqrt, không có Math.sin/cos/random/Date. Hướng đánh gửi dạng vector đơn vị làm tròn 1e-6. Hằng số lấy từ bản vẽ: bàn 500×900, R = 21, VMAX = 2650, ma sát 230 + 0,42·v, hồi phục bi 0,95, băng 0,78.
- Mạng: mỗi cú một gói tin {seq, huong:[x,y], luc, xoay:[x,y], datBi?}. Máy chủ mô phỏng lại rồi trả {seq, bamTrangThai, suKien}. Máy khách chạy hoạt ảnh ngay khi đánh; băm lệch thì lấy trạng thái máy chủ.
- Mỗi phòng đấu là 1 Durable Object (lớp SQLite) + WebSocket Hibernation. Trong trận không đọc hay ghi D1 lần nào. Hết ván ghi tối đa 3 câu lệnh D1 trong 1 batch. Gói Cloudflare không có Durable Object thì dùng dự phòng: hỏi vòng 1,5 giây như Đoàn (bảng bi_a_ban JSON + revision), giữ nguyên giao thức gói tin.
- Kinh tế: 0 EXP, không trừ Thể lực, không đổi kế hoạch ngày. Vé = floor(số câu Thể lực đã làm hôm nay / 10), tối đa 4 vé/ngày, mỗi người tốn 1 vé cho 1 ván. Thưởng: Điểm bàn (Elo, K = 24, khởi đầu 1000), Sổ phản ứng, gậy và mặt bàn đổi bằng Vàng (GĐ3). Khoá Bi-a khi em có ca kiểm tra đang mở.
- Nội dung Hoá là dữ liệu: mỗi bộ bi là một tệp src/game/bi-a/bo-bi/*.ts (ion, màu, phe, bảng phản ứng, phương trình ion rút gọn, hiện tượng) và có test đối chiếu từng cặp. Bộ mặc định "Ion trong dung dịch": 6 cation (H⁺, Na⁺, NH₄⁺, Ba²⁺, Cu²⁺, Fe³⁺), 6 anion (OH⁻, CO₃²⁻, SO₄²⁻, Cl⁻, NO₃⁻, Br⁻), 9 cặp phản ứng, 27 cặp không.
- Câu chốt: câu Phần I (4 lựa chọn) em đã làm trong 30 ngày, cùng khối hoặc thấp hơn, không phải tự luận, mức độ hiểu hoặc vận dụng. Không phản hồi nào có đáp án hay lời giải trước khi em chốt. Máy chủ chấm. Hạn 60 giây. Ghi vào bảng riêng bi_a_cau_chot.
- Giao diện: màn dọc 360–430 px; bi ≥ 24 px trên màn 390 px; khung hình p95 ≤ 16,7 ms khi Chromium hạ CPU 4 lần; vùng chạm ≥ 44 px; chữ câu hỏi ≥ 15 px; không chat tự do (6 câu nhắn soạn sẵn). Thêm vào bảng từ chuẩn: Bi-a Phản Ứng, Bi chốt, Câu chốt, Phe Cation, Phe Anion, Vé bàn, Điểm bàn, Sổ phản ứng, Phạm luật, Đặt bi cái.

GIẢ ĐỊNH ĐÃ DÙNG
- Luật: 6 bi Cation (trơn) + 6 bi Anion (sọc) + Bi chốt. Phe chia sẵn từ đầu, người mời là Cation. Vào lỗ bi phe mình +10 và đánh tiếp. Phản ứng mới +15 và đánh tiếp, mỗi cặp 1 lần/ván. Xong thử thách lượt +20. Hạ Bi chốt hợp lệ +50 và thắng. Trước mỗi cú đánh Bi chốt trả lời đúng một Câu chốt, sai thì mất lượt. Bi chốt rơi sớm: đặt lại giữa bàn và tính phạm luật, không xử thua. Hết 30 giây: mất lượt, không tính phạm luật.
- Phạm luật: bi cái rơi lỗ, không chạm bi nào, chạm bi phe kia trước, chạm Bi chốt khi còn bi phe mình. Đối thủ được đặt bi cái ở bất kỳ đâu.
- Cặp Cu²⁺ + CO₃²⁻ ghi: 2Cu²⁺ + 2CO₃²⁻ + H₂O → Cu₂(OH)₂CO₃↓ + CO₂↑, có cờ tắt cặp này (chờ thầy chốt).
- Cặp Fe³⁺ + CO₃²⁻ ghi: 2Fe³⁺ + 3CO₃²⁻ + 3H₂O → 2Fe(OH)₃↓ + 3CO₂↑.
- Vé: 10 câu = 1 vé, tối đa 4 vé/ngày.
- A.I Đỗ Đại Học: thử tối đa 60 cú ứng viên bằng chính lõi vật lý, nhiễu góc ±0,7°. GĐ3 thêm 3 mức.
- Ảnh đại diện là thần thú của em (dùng lại Spirit2D).
- Tệp prompt-game-hoa-2-0.md có dòng "Không thêm màn nào vào app học sinh ngoài Sảnh, 2 game…": sửa thành 3 game, nhắn Boss ghi Nhật ký.
- GĐ4 chỉ làm khi thầy yêu cầu.

KHÔNG ĐƯỢC LÀM
- Không cộng EXP, không gọi ghiKhoanExpGame, không trừ Thể lực, không ghi su_kien_hoc từ Bi-a.
- Không đọc D1 theo nhịp trong trận; dự phòng hỏi vòng không nhanh hơn 1,5 giây.
- Không gửi đáp án hay lời giải Câu chốt xuống máy trước khi em chốt; không rút câu tự luận.
- Không sửa đồ hoạ, hoạt ảnh của Bát Linh Đảo và Đoàn Hộ Tống; không sửa tệp ngoài làn khi chưa nhắn chủ làn theo DIEU-PHOI.md.
- Không thêm thư viện vật lý hay đồ hoạ (matter-js, pixi…). Dùng canvas 2D + lõi tự viết; gói JS của game ≤ 60 KB sau gzip.
- Schema chỉ-thêm; không xoá, không ghi đè dữ liệu thật; không đẩy Worker từ thư mục chung.

ĐỊNH DẠNG ĐẦU RA
- Máy khách: src/game/bi-a/ gồm vat-ly.ts, luat.ts, ai.ts, bo-bi/ion-dung-dich.ts, ve-ban.ts, am-thanh.ts, BiaGame.tsx, BiaSanh.tsx, bi-a.css; nối cửa thứ ba vào SanhBanDo.tsx qua chủ làn.
- Máy chủ: server/src/bi-a.ts (lệnh bia-sanh, bia-cau-chot, bia-chot, bia-ket-van), server/src/bi-a-phong.ts (Durable Object), server/migration-DDMM-bi-a.sql (bi_a_van, bi_a_so_phan_ung, bi_a_cau_chot, bi_a_diem_ban).
- Test: tests/bi-a-*.test.ts. Hợp đồng API: docs/hop-dong-bi-a.md (Code 3 là bên cung cấp).
- Sổ việc: SO-VIEC-BI-A.md. Nhật ký build: BI-A-build-status.md.
- Mỗi giai đoạn: commit tiếng Việt theo đường dẫn, báo Boss ≤ 150 từ, ghi một dòng Nhật ký khi đẩy.

NGHIỆM THU
1. Tất định: 1.000 cú ngẫu nhiên (seed cố định) mô phỏng 2 lần trên Node và 1 lần trong Chromium qua Playwright, băm trạng thái trùng 1.000/1.000.
2. Bảng phản ứng: test 36 cặp cation × anion (9 có, 27 không) và 30 cặp cùng phe (0 phản ứng) khớp bảng thầy duyệt.
3. Câu chốt: test chứng minh phản hồi bia-cau-chot không có khoá correct, solution, answer; câu tự luận bị loại.
4. Kinh tế: sau 1 ván, EXP, Thể lực và kế hoạch ngày của cả 2 em không đổi (test D1 harness); số câu lệnh D1 ghi mỗi ván ≤ 3.
5. Online: Playwright mở 2 trình duyệt đánh hết 1 ván qua Durable Object chạy cục bộ; băm trạng thái 2 màn trùng sau mỗi cú; rớt mạng 10 giây rồi vào lại thì tiếp tục đúng lượt.
6. Giao diện: npm run check:mau đạt; có ảnh 390 px và 1440 px, sáng và tối; khung hình p95 ≤ 16,7 ms khi hạ CPU 4 lần; không tràn ngang ở 360 px.
```

## Ba câu hỏi làm prompt sắc hơn

1. Cặp Cu²⁺ + CO₃²⁻: giữ phương trình tạo Cu₂(OH)₂CO₃↓ + CO₂↑, hay bỏ cặp này khỏi bộ bi?
2. Vé: 10 câu = 1 vé (tối đa 4 vé/ngày), hay chỉ mở bàn khi em đã xong 40/40 câu hôm nay?
3. Build GĐ1 trước (chung một máy + A.I, dùng được ngay ở trung tâm), hay làm luôn GĐ1 và GĐ2 (đấu online) trong một đợt?
