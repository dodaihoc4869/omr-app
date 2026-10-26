# Hướng dẫn BUILD «Một trang» (thầy chốt 26/10: «Chốt cả 3 app, build và đẩy lên bản sống luôn nhé»)

Thầy muốn: mở app là thấy đủ, MỘT màn vừa khít khung hình, KHÔNG cuộn — ở điện thoại dọc 390×844, điện thoại ngang 844×390, máy tính 1440×900.

## Bản vẽ đã chốt (thư mục `/tmp/claude-0/-home-user/2f335f0b-2646-5301-87ed-bb027f9d41d9/scratchpad/ve-moi/`)
- Học sinh: `hs-mot-trang.html`, `hs-mot-trang-menu.html`, `hs-mot-trang-ca.html`, `hs-mot-trang-xong.html`, `hs-mot-trang-menu-xong.html` + `mot-trang.css` + phần menu/điểm danh/A.I trong `khung.js` (tìm `diemDanh`, `muc-ai`).
- Phụ huynh: `ph-mot-trang.html` + `mot-ph.css`.
- Thầy: `gv-mot-trang.html` + `mot-gv.css`.
- Ảnh: `anh/<tên>-{doc,ngang,may-tinh}-{sang,toi}.jpg`, tấm ghép `bang/<tên>.jpg`. Hệ thiết kế chung `trong.css`. Chú thích `GỌN HƠN` đầu mỗi tệp HTML nói rõ đã gom/ẩn gì.

## Nền đã có trên main (7654f0c3)
Giao diện «Trong» đang sống: `src/styles/trong.css` (+ các tệp `trong-*.css`), `<html data-trong="hs|gv">` do `src/main.tsx` gắn; lùi một máy: localStorage `ddh.trong`='tat'. Đọc `docs/ban-ve-trong-2610/HUONG-DAN-BUILD.md` (luật cũ vẫn áp dụng, trừ chỗ dưới đây ghi khác).

## Luật
- Chỉ đổi TRÌNH BÀY và BỐ CỤC. Không thêm lệnh máy chủ, không đổi API, không đổi luồng nộp/chấm/khoá/đồng hồ/điểm danh. Đáp án không xuống máy học sinh trước khi nộp.
- Không bịa số: ô nào bản vẽ có số mà app không có sẵn dữ liệu rẻ ⇒ hiện nhãn + con số app ĐANG có, hoặc bỏ số giữ nhãn; ghi lại trong báo cáo.
- Giao diện cũ phải còn nguyên khi tắt: HS/GV ⇒ không có data-trong ⇒ y như trước. PH: xem đề bài PH.
- CSS mới chỉ dưới bộ chọn bật (`[data-trong…]`, hoặc cờ của PH), chỉ dùng biến màu sẵn có (`--tr-*` cho HS/GV; biến/màu sẵn có của app PH cho PH). KHÔNG mã màu thô.
- Tốc độ: `npm run build && npm run kiem:toc-do` phải 0 đỏ, mốc KHÔNG nâng. Không thêm vòng chờ D1. Precache ≤ 170 tệp (`node scripts/kiem-sw.mjs` 13/13) — mảnh lười mới thì cho vào globIgnores như `TrongHs-*` trong vite.config.ts (LƯU Ý: chú thích trong globIgnores KHÔNG được chứa chữ `ExamTakeScreen`).
- Không để biến dùng trước khai báo (oxlint `no-use-before-define`; test `tests/khong-dung-bien-truoc-khi-khai.test.ts`), kể cả trong `scripts/`.
- Cảnh chụp: thêm cảnh mới vào `scripts/chup-v2/trang.tsx` ở KHỐI RIÊNG có đánh dấu `// ═══ MỘT TRANG <HS|PH|GV> 26/10` để gộp ba nhánh dễ (đừng sửa dòng của người khác).

## Kiểm «không cuộn» bằng máy
Chụp bằng `scripts/chup-v2` (`npx vite build --config scripts/chup-v2/vite.config.mjs --outDir <ngoài repo>`; `node scripts/chup-v2/chup.mjs <dist> <thư mục ảnh> <tiền tố>`), và đo `document.documentElement.scrollHeight <= innerHeight` (+ scrollWidth ≤ innerWidth) ở 390×844, 844×390, 1440×900, sáng + tối. Đích bấm ≥ 44px. So từng ảnh với ảnh bản vẽ. Màn có nhiều dữ liệu thật hơn bản vẽ (danh sách dài) ⇒ cắt bớt/hiện «Xem đủ N» chứ không cho cuộn trang.

## Cổng trước khi báo xong (trong worktree của mình)
`npm run -s build` (có `tsc -b` — `npx tsc --noEmit -p .` KHÔNG kiểm gì) · vitest các tệp test liên quan (`grep -rl <Tên> tests`) — đỏ thì chạy lại cùng tệp trên `origin/main` để biết có sẵn hay không · `npm run -s check:mau` · `npm run -s kiem:mau-giu` · `npm run -s kiem:toc-do` · `node scripts/kiem-sw.mjs` · `npx oxlint --format=json` không thêm `no-use-before-define` mới.

## Luật repo
Chỉ sửa tệp trong làn của mình. Commit theo đường dẫn `git commit -m "…" -- <tệp…>` (tiếng Việt; cuối lời commit 2 dòng: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` và `Claude-Session: https://claude.ai/code/session_012bzhc4y4LFFoewwaqDi15m`). Cấm git add -A, commit -a, stash, reset --hard, push, deploy. Không đụng /home/user/omr-app. Báo lại ≤ 200 từ: mã commit, màn đã xong + đường dẫn 2–3 ảnh, số kiem:toc-do, test đỏ (có sẵn hay mới), chỗ chưa sát bản vẽ / số chưa có dữ liệu.
