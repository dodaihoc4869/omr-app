# omr-app — hướng dẫn cho Codex (Codex tự đọc tệp này mỗi lần nhận việc)

Ba app cho trung tâm luyện thi Hoá của thầy Đỗ Đại Học: giáo viên (`/`, `/gv`), học sinh (`/hs`), phụ huynh (`/ph`). React + Vite + TS + Tailwind v4 (`src/`), máy chủ Cloudflare Worker + D1 + R2 (`server/`). Mã, chú thích, commit, PR viết TIẾNG VIỆT.

## 1. Luật chung — đọc trước
- Mọi luật trong `CLAUDE.md` áp dụng nguyên cho Codex: luật tốc độ (`npm run build && npm run kiem:toc-do` 0 đỏ, mốc `docs/moc-toc-do.json` chỉ hạ), màu (`npm run check:mau`, `npm run kiem:mau-giu` 0), commit theo đường dẫn, không in bí mật, đáp án không xuống máy học sinh trước khi nộp (ngoại lệ thầy duyệt 31/10: câu luyện tập mang `dm` mã hoá, máy chủ chấm lại — xem CLAUDE.md; câu thi / kiểm tra cá nhân / BTVN có điểm / câu bảo vệ ca thi / tự luận vẫn KHÔNG), không rút câu tự luận.
- Chỉ dừng hỏi thầy khi: xoá/ghi đè dữ liệu D1 thật · schema không chỉ-thêm · đang có ca thi mở.
- Làm chung với Claude: `docs/hop-dong-claude-codex-1310.md` (chia làn, tệp dùng chung, không phát hành chồng nhau). Nhật ký chung: cuối `DIEU-PHOI.md`.

## 2. Việc Claude giao cho Codex
Claude không nhắn trực tiếp được cho Codex, và `@codex` trên GitHub đang hỏng (bot chỉ trả "create an environment"). Vì vậy Claude giao việc trong **`docs/viec-giao-codex.md`**.

Mỗi lần nhận việc:
1. Kéo `main` mới nhất, mở `docs/viec-giao-codex.md`.
2. Làm các mục `[ ]` theo thứ tự từ trên xuống.
3. Việc thầy giao trực tiếp luôn được làm trước.

Xong mỗi mục:
- Trong cùng PR, đổi `[ ]` thành `[x]`, ghi kèm mã PR và kết quả kiểm.
- Ghi một dòng vào cuối `DIEU-PHOI.md`.

Không làm được thì đổi thành `[!]` kèm lý do một dòng. Không xoá mục nào.

## 3. Quy trình 4 bước (thầy đồng ý 13/10)
Áp dụng cho tính năng mới, màn mới, đổi giao diện rõ rệt. Đọc `docs/quy-trinh-4-buoc-1310.md`.

- Việc giao kèm đặc tả 7 mục và bản vẽ thầy đã duyệt: build đúng như vậy.
- Thầy giao thẳng một tính năng mới mà chưa có bản vẽ duyệt:
  - làm bước 2 trước (đặc tả 7 mục + ảnh Chromium thật, 3 khổ, sáng/tối) trong PR nháp;
  - thầy duyệt rồi mới build.
- Sửa lỗi, sửa chữ, tối ưu không đổi giao diện: làm thẳng.
- Soát chéo với Claude trên PR GitHub, không soát code dán vào chat.

## 4. Trước khi mở PR vào `main`
- `npx tsc -b`; `cd server && npx tsc --noEmit -p .`; `npm run build && npm run kiem:toc-do`; `node scripts/kiem-sw.mjs` 13/13.
- Chạy toàn bộ vitest, so **theo tên test** với `main`: không có test đỏ mới.
- Xem Actions `deploy.yml` không có lượt đang chạy, rồi gộp `main` mới nhất vào nhánh.
