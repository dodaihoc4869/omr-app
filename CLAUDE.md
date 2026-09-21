# omr-app — hướng dẫn cho mọi phiên Claude (đọc xong là vào việc, đừng khám phá lại)

Ba app cho trung tâm luyện thi Hoá của thầy Đỗ Đại Học: giáo viên (`/`, `/gv`), học sinh (`/hs`), phụ huynh (`/ph`) — React + Vite + TS + Tailwind v4 (`src/`), máy chủ Cloudflare Worker + D1 + R2 (`server/`). Mã, chú thích, commit viết TIẾNG VIỆT. Trả lời thầy bằng tiếng Việt dễ hiểu, ngắn.

## Làm việc nhiều phiên
- Đọc `DIEU-PHOI.md` (danh bạ ai lo gì, luật, 12 dòng Nhật ký mới nhất) TRƯỚC khi sửa. Điều phối = phiên **Boss**. Nhắn thẳng phiên khác bằng SendMessage; KHÔNG hỏi thầy.
- Chỉ sửa tệp trong làn của mình. Commit theo đường dẫn: `git commit -m "…" -- <tệp>`. Cấm `git add -A`, `commit -a`, stash, `reset --hard`.
- Đẩy Worker + migration `--remote`: CHỈ Code 3. Đẩy Pages: Code 2, từ worktree sạch. Commit luồng thi thật / làn giáo viên cần dòng "đã soát <mã>" của Boss (tra cả `docs/nhat-ky-dieu-phoi-cu.md`).
- Phải DỪNG báo Boss: đổi luật chấm điểm, luật vào thi/chống gian lận, schema không-chỉ-thêm, xoá/ghi đè D1 thật. Không nhập/đoán mật khẩu, không in token/mã bí mật. Đáp án không xuống máy học sinh trước khi nộp.

## TIẾT KIỆM NGỮ CẢNH (thầy yêu cầu 21/09)
- KHÔNG đọc/ls sâu: `node_modules/`, `dist/`, `.dist-old-*/`, `src/graphify-out/`, `public/than-thu-v2/*.png` (ảnh 3 MB), `docs/anh-*/`, `docs/ban-ve-*/*.jpg` (chỉ mở ảnh khi việc cần nhìn).
- Tìm bằng Grep/Glob có mục tiêu; tệp > 600 dòng đọc theo KHOẢNG DÒNG (`offset/limit`), không đọc cả tệp. Sổ việc (`SO-VIEC*.md`, có tệp 150 KB): chỉ đọc 80 dòng cuối, chỉ GHI THÊM ở cuối.
- Quét rộng nhiều tệp → giao Agent `Explore` rồi lấy kết luận, đừng tự đọc từng tệp.
- Test: chạy tệp liên quan `npx vitest run tests/<tệp> --reporter=dot`. TOÀN BỘ vitest (~10 phút, ~6000 test) chỉ chạy khi: sắp đẩy Pages/Worker, gộp nhánh, hoặc vừa đổi tệp dùng chung. Nền đỏ có sẵn: 97 test / 42 tệp (`docs/nen-vitest-do-1909.txt`) — so TÊN test, đừng dán log dài vào hội thoại (ghi ra tệp rồi `grep`).
- Lệnh có đầu ra dài: luôn `| tail -n 30` hoặc ghi ra tệp. Không in JSON/HTML lớn ra hội thoại.
- Báo cáo cho phiên khác ≤ 150 từ: việc + mã commit + điều cần; chi tiết để trong sổ việc. Không lặp lại nội dung đã có trong tệp — dẫn đường dẫn.
- Ảnh chụp bằng chứng: JPG ≤ 150 KB; không đọc lại ảnh vừa chụp trừ khi phải nhìn để quyết.

## Chữ và giao diện
- TRƯỚC khi đặt chữ mới hoặc báo xong một màn: đọc `docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md` (bảng từ chuẩn 3 app + 10 mục tự soát giao diện). Con số nào cũng có nhãn; một khái niệm một từ; không mã nội bộ trên màn học sinh/phụ huynh.
- KHÔNG rút câu TỰ LUẬN ở bất kỳ kênh rút đề tự động nào (dùng `src/lib/cau-tu-luan.ts`); riêng Gọi lên bảng thầy chọn gì hiện đúng thế.

## Bản đồ nhanh
- Bảng nhiệm vụ HS/PH: `src/components/bang-nhiem-vu/`, `src/lib/nhiem-vu-adapter.ts`. M3 dùng chung: `src/components/m3/`. Phiếu HTML: `src/lib/html-phieu.ts`. Màn thi: `src/screens/ExamTakeScreen.tsx`. App thầy: `src/screens/*Screen.tsx`, khung `src/App.tsx`, `src/components/ThanhBenTrai.tsx`.
- Game: `src/game/than-thu-v2/` (Đảo thần thú `Game.tsx`, Đoàn Hộ Tống `Doan*.tsx`, lõi `doan-core.ts`), máy chủ `server/src/game-v2*.ts`.
- Máy chủ: định tuyến `server/src/index.ts`, lệnh cũ `goi-cu.ts`, kế hoạch ngày `ke-hoach-ngay.ts`, sổ/hồ sơ `su-kien-hoc.ts` `ho-so-nam-kt.ts`, EXP `exp-*.ts`, reset `reset-toan-app.ts`. Hợp đồng API: `docs/*hop-dong*`, `docs/ke-hoach-ngay-api-1909.md`.
- Thiết kế đã chốt: `DE-XUAT-*.md`, `prompt-*.md`, bản vẽ `docs/ban-ve-*`, logo `docs/logo-1909/`.
- Kiểm màu: `npm run check:mau` (cấm hex thô trong `src/`). Build: `npm run build`. Bản sống: Pages `omr-app-b3u.pages.dev`, Worker `omr.ttadodaihoc.workers.dev`.
