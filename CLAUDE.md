# omr-app — hướng dẫn cho mọi phiên Claude (đọc xong là vào việc, đừng khám phá lại)

Ba app cho trung tâm luyện thi Hoá của thầy Đỗ Đại Học: giáo viên (`/`, `/gv`), học sinh (`/hs`), phụ huynh (`/ph`) — React + Vite + TS + Tailwind v4 (`src/`), máy chủ Cloudflare Worker + D1 + R2 (`server/`). Mã, chú thích, commit viết TIẾNG VIỆT. Trả lời thầy bằng tiếng Việt dễ hiểu, ngắn.

## Làm việc nhiều phiên
- Đọc `DIEU-PHOI.md` (danh bạ ai lo gì, luật, 12 dòng Nhật ký mới nhất) TRƯỚC khi sửa. Điều phối = phiên **Boss**. Nhắn thẳng phiên khác bằng SendMessage; KHÔNG hỏi thầy.
- Chỉ sửa tệp trong làn của mình. Commit theo đường dẫn: `git commit -m "…" -- <tệp>`. Cấm `git add -A`, `commit -a`, stash, `reset --hard`.
- **TỰ ĐỘNG BUILD / TEST / DEPLOY (thầy cấp toàn quyền 23/09/2026).** Thấy việc thì LÀM LUÔN, không xin phép: chạy `npx vitest run` (và `tsc`) cho vùng mình sửa; **test xanh ⇒ tự `git push`**; cần máy chủ ⇒ **tự đẩy Worker TỪ WORKTREE SẠCH tại đúng commit của mình** (`git worktree add --detach <WT> <commit>` + symlink `node_modules`, rồi `cd server && npx -y wrangler@latest deploy`) — KHÔNG đẩy từ thư mục chung (sẽ cõng tệp dở của phiên khác). Migration CHỈ-THÊM thì tự chạy `--remote`. Mỗi lượt deploy ghi một dòng Nhật ký (giờ · phiên · đẩy gì · commit · mã bản lùi).
- Phải DỪNG và báo Boss CHỈ khi: **XOÁ/GHI ĐÈ DỮ LIỆU THẬT** (reset, xoá bảng, sửa điểm thật hàng loạt), **schema KHÔNG phải chỉ-thêm**, hoặc phát hiện **đang có ca thi mở**. Ngoài ba việc đó thì tự quyết và tự phát hành.
- Không nhập/đoán mật khẩu, không in token/mã bí mật. Đáp án không xuống máy học sinh trước khi nộp.
- **THAM VẤN CỐ VẤN (thầy 19/10).** Phiên chính chạy Sonnet 5.5, cố vấn Opus 5.5 (`advisorModel` trong `.claude/settings.json`). BẮT BUỘC hỏi cố vấn ở ba lúc: (1) trước khi chốt kế hoạch; (2) khi gặp cùng một lỗi lần thứ hai, trước khi sửa tiếp; (3) trước khi báo xong một việc. Phiên không có cố vấn (tắt / nền tảng chưa hỗ trợ) ⇒ ghi rõ "chưa tham vấn được cố vấn" trong báo cáo.
- **TÁC TỬ PHỤ CHỈ ĐỌC (Haiku 5.5, `.claude/agents/`):** `search` lập bản đồ repo · `grep` tìm chỗ gọi hàm/mã · `docs` lấy tài liệu API. Tra cứu giao cho ba tác tử này, phiên chính chỉ nhận kết luận.
- **CODEX (thầy 13/10):** "từ giờ tôi nhắn ở đây, việc gì thằng codex làm tốt hơn bạn giao luôn cho nó tự làm nhé". Codex là công cụ khác, không nhắn bằng SendMessage được. Giao việc bằng cách GHI THÊM mục `[ ]` vào `docs/viec-giao-codex.md` rồi đẩy lên `main` (Codex tự đọc `AGENTS.md` ⇒ mở tệp đó mỗi lần nhận việc). Không dùng `@codex` trên GitHub: bot chỉ trả "create an environment" (thử 13/10, issue 260). Đề bài phải tự đủ nghĩa: việc, tệp, luật chung, nghiệm thu. Theo dõi PR tới khi xong rồi báo thầy. Giao Codex khi việc nằm trong làn Codex (kiểm tra cá nhân, chiếu chữa / người gọi, máy soạn câu song sinh) hoặc là tiếp nối PR của chính Codex. Việc độc lập, chạy song song được, không giẫm tệp đang sửa cũng có thể giao. Luật chung và chia làn: `docs/hop-dong-claude-codex-1310.md`.
- **QUY TRÌNH 4 BƯỚC (thầy đồng ý 13/10)** — áp dụng cho tính năng mới, màn mới, đổi giao diện rõ rệt:
  1) Thầy gửi ý tưởng. Có đặc tả ChatGPT thì dán một lần.
  2) Claude viết đặc tả 7 mục + bản vẽ (ảnh Chromium thật, 3 khổ, sáng/tối).
  3) Thầy duyệt ảnh. Chưa duyệt thì không build.
  4) Claude hoặc Codex (theo làn) build → cổng → phát hành; bên còn lại soát trên PR.

  Mẫu đặc tả và luật: `docs/quy-trinh-4-buoc-1310.md`. Sửa lỗi hoặc tối ưu không đổi giao diện thì làm thẳng.
- **LUẬT TỐC ĐỘ (thầy 13/10):** "Khi bạn sửa bất kì cái gì thì luôn phải đảm bảo sau khi sửa xong tốc độ load app và tốc độ máy chủ phải nhanh hơn". Trước khi đẩy: `npm run build && npm run kiem:toc-do` phải 0 đỏ — đo byte tải mở từng app (`scripts/kiem-toc-do-tai.mjs`) và số đợt chờ D1 nối tiếp của 4 lệnh nóng (`tests/toc-do-may-chu-lenh-nong-1310.test.ts`), so mốc `docs/moc-toc-do.json`. Mốc CHỈ HẠ, không nâng; đỏ ⇒ làm nhẹ/bớt vòng chờ rồi mới đẩy. Thêm lệnh máy chủ mới: đọc song song (`som`/`Promise.all`/`batch`), không thêm vòng chờ nối tiếp.

## TIẾT KIỆM NGỮ CẢNH (thầy yêu cầu 21/09)
- KHÔNG đọc/ls sâu: `node_modules/`, `dist/`, `.dist-old-*/`, `src/graphify-out/`, `public/than-thu-v2/*.png` (ảnh 3 MB), `docs/anh-*/`, `docs/ban-ve-*/*.jpg` (chỉ mở ảnh khi việc cần nhìn).
- Tìm bằng Grep/Glob có mục tiêu; tệp > 600 dòng đọc theo KHOẢNG DÒNG (`offset/limit`), không đọc cả tệp. Sổ việc (`SO-VIEC*.md`, có tệp 150 KB): chỉ đọc 80 dòng cuối, chỉ GHI THÊM ở cuối.
- Quét rộng nhiều tệp → giao tác tử `search` (bản đồ) hoặc `grep` (chỗ gọi) rồi lấy kết luận, đừng tự đọc từng tệp.
- Test: chạy tệp liên quan `npx vitest run tests/<tệp> --reporter=dot`. TOÀN BỘ vitest (~10 phút, ~6000 test) chỉ chạy khi: sắp đẩy Pages/Worker, gộp nhánh, hoặc vừa đổi tệp dùng chung. Nền đỏ có sẵn: 97 test / 42 tệp (`docs/nen-vitest-do-1909.txt`) — so TÊN test, đừng dán log dài vào hội thoại (ghi ra tệp rồi `grep`).
- Lệnh có đầu ra dài: luôn `| tail -n 30` hoặc ghi ra tệp. Không in JSON/HTML lớn ra hội thoại.
- Báo cáo cho phiên khác ≤ 150 từ: việc + mã commit + điều cần; chi tiết để trong sổ việc. Không lặp lại nội dung đã có trong tệp — dẫn đường dẫn.
- Ảnh chụp bằng chứng: JPG ≤ 150 KB; không đọc lại ảnh vừa chụp trừ khi phải nhìn để quyết.

## Chữ và giao diện
- TRƯỚC khi đặt chữ mới hoặc báo xong một màn: đọc `docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md` (bảng từ chuẩn 3 app + 10 mục tự soát giao diện). Con số nào cũng có nhãn; một khái niệm một từ; không mã nội bộ trên màn học sinh/phụ huynh.
- MÀU (thầy 05/10: "giữ nguyên mọi màu sắc các lớp trong 3 app hiện tại, bạn thêm thì phải đồng bộ đúng chuẩn"): không đổi/xoá màu đang có; thứ thêm mới chỉ dùng biến màu chuẩn đã có của đúng app (token M3, bảng màu app thầy, biến game). Trước khi đẩy: `npm run kiem:mau-giu` (so origin/main) phải 0 vi phạm.
- **TƯ DUY DẠY BÀI TÍNH (thầy 26/10):** viết gợi ý / lời giải / giải thích cho học sinh PHẢI theo `docs/tu-duy-day-hoa-thay-2610.md` — số mol là tiền, hệ số là độ giàu, hiệu suất là đánh thuế (xuôi × H/100, ngược × 100/H), sơ đồ cột dọc theo chất, một phép tính.
- KHÔNG rút câu TỰ LUẬN ở bất kỳ kênh rút đề tự động nào (dùng `src/lib/cau-tu-luan.ts`); riêng Gọi lên bảng thầy chọn gì hiện đúng thế.

## Bản đồ nhanh
- Bảng nhiệm vụ HS/PH: `src/components/bang-nhiem-vu/`, `src/lib/nhiem-vu-adapter.ts`. M3 dùng chung: `src/components/m3/`. Phiếu HTML: `src/lib/html-phieu.ts`. Màn thi: `src/screens/ExamTakeScreen.tsx`. App thầy: `src/screens/*Screen.tsx`, khung `src/App.tsx`, `src/components/ThanhBenTrai.tsx`.
- Game: `src/game/than-thu-v2/` (Đảo thần thú `Game.tsx`, Đoàn Hộ Tống `Doan*.tsx`, lõi `doan-core.ts`), máy chủ `server/src/game-v2*.ts`.
- Máy chủ: định tuyến `server/src/index.ts`, lệnh cũ `goi-cu.ts`, kế hoạch ngày `ke-hoach-ngay.ts`, sổ/hồ sơ `su-kien-hoc.ts` `ho-so-nam-kt.ts`, EXP `exp-*.ts`, reset `reset-toan-app.ts`. Hợp đồng API: `docs/*hop-dong*`, `docs/ke-hoach-ngay-api-1909.md`.
- Thiết kế đã chốt: `DE-XUAT-*.md`, `prompt-*.md`, bản vẽ `docs/ban-ve-*`, logo `docs/logo-1909/`.
- Kiểm màu: `npm run check:mau` (cấm hex thô trong `src/`). Build: `npm run build`. Bản sống: Pages `omr-app-b3u.pages.dev`, Worker `omr.ttadodaihoc.workers.dev`.
