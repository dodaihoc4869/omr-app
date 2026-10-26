# Hướng dẫn BUILD giao diện «Trong» (thầy chốt 26/10: «Chốt BUILD LUÔN NHÉ»)

Bản vẽ đã chốt: `scratchpad/ve-moi/` (tệp HTML + ảnh `anh/<tên>-{doc,ngang,may-tinh}-{sang,toi}.jpg` + tấm ghép `bang/<tên>.jpg`). Hệ thiết kế: `ve-moi/trong.css`, nguyên tắc: `ve-moi/HUONG-DAN-VE.md`, đặc tả: `ve-moi/DAC-TA.md`.

## Nền đã có (commit f7970467, KHÔNG sửa trừ khi thật cần và ghi rõ)
- `src/styles/trong.css`: bảng màu --tr-* (sáng/tối), ánh xạ vào biến sẵn có (--nen/--the/--muc…, --gvm-*, --m3-*), da nhẹ cho thẻ/nút/chip/tab/ô nhập/thanh bên/thanh đáy/hộp thoại. Biến dùng được: --tr-nen --tr-mat --tr-mat-2 --tr-mat-3 --tr-vien --tr-vien-2 --tr-chu --tr-chu-2 --tr-chu-3 --tr-chinh (màu app) --tr-chinh-nut (nền nút chính) --tr-chinh-nhat --tr-chinh-chu --tr-tren-chinh (chữ trên nút chính) --tr-dung(-nhat/-chu) --tr-sai(-nhat/-chu) --tr-chu-y(-nhat/-chu) --tr-tin(-nhat/-chu) --tr-sao(-nhat/-chu) --tr-bong-1/2/3 --tr-phu.
- `<html data-trong="hs|gv">` do main.tsx gắn. Lùi: localStorage ddh.trong='tat' ⇒ KHÔNG có data-trong ⇒ app phải về y giao diện cũ.

## Việc của mỗi nhóm
Đưa các màn của nhóm về ĐÚNG bản vẽ «Trong» (bố cục, thứ tự, khoảng thở, một nút chính, chữ, màu) — CHỈ đổi TRÌNH BÀY:
- Không đổi logic, lệnh máy chủ, dữ liệu, luồng nộp/chấm/khoá/đồng hồ. Không thêm tính năng. Nhãn chữ giữ đúng app thật (bản vẽ đã theo nhãn thật; chỗ bản vẽ khác app thật về CHỮ thì giữ chữ app thật).
- TSX: được thêm className, bọc thêm phần tử trình bày, đổi THỨ TỰ khối JSX cho đúng bản vẽ (không đổi điều kiện hiện). Mọi thay đổi bố cục phải để giao diện cũ (không data-trong) y như trước — nếu đổi thứ tự JSX làm khác giao diện cũ, dùng CSS `order`/grid dưới [data-trong] thay vì đổi JSX.
- CSS: MỌI bộ chọn mới bắt đầu bằng `[data-trong]` (hoặc `[data-trong='hs']`/`[data-trong='gv']`). Chỉ dùng var(--tr-*) và biến sẵn có — KHÔNG mã màu thô (check:mau, kiem:mau-giu sẽ chặn). Viết vào tệp CSS RIÊNG của nhóm (tên dưới đây), import tệp ấy từ CHÍNH tệp component màn của nhóm (để chỉ tải khi màn mở) — KHÔNG import từ App.tsx/main.tsx (trừ nhóm 3 cho khung app thầy).
- Gọn nhẹ: CSS ngắn, không lặp; luật tốc độ `npm run kiem:toc-do` phải 0 đỏ (mốc chỉ hạ, KHÔNG được nâng). Đỏ ⇒ làm nhẹ lại.

## Soát bằng ảnh thật
Bộ chụp `scripts/chup-v2` đã bật «Trong»: `npx vite build --config scripts/chup-v2/vite.config.mjs --outDir <thư mục ngoài repo>` rồi `node scripts/chup-v2/chup.mjs <dist> <thư mục ảnh> <tiền tố cảnh,…>` (xem danh sách cảnh trong scripts/chup-v2/chup.mjs; cảnh có thể dựng thêm trong scripts/chup-v2/trang.tsx nếu thiếu). So từng ảnh với ảnh bản vẽ cùng màn, sửa tới khi sát; soát cả sáng/tối, điện thoại/máy tính; 0 tràn ngang, đích bấm ≥ 44px. Thêm `&trong=tat` vào cảnh để chắc giao diện cũ không đổi.
Tham khảo cấu trúc (CHỈ ý tưởng bố cục, KHÔNG chép da viền mực): các commit đợt «Khối đậm» `git show 049e71a4` (GV Hôm nay), `1faedb8d` (HS Hôm nay), `e2b50c5e` (màn quản lý thầy), `6e1c9a4d` + `617e20eb` (màn thi, làm bài).

## Cổng trước khi báo xong (chạy trong worktree của mình)
`npx tsc --noEmit -p .` · test vitest của các tệp đã đụng (`grep -rl <TênComponent> tests` rồi `npx vitest run <tệp> --reporter=dot`) — đỏ thì so với nền đỏ có sẵn `docs/nen-vitest-do-1909.txt`/chạy lại trên commit f7970467 để chắc không do mình · `npm run -s check:mau` · `npm run -s kiem:mau-giu` · `npm run -s build && npm run -s kiem:toc-do` (0 đỏ) · `node scripts/kiem-sw.mjs` (13/13).

## Luật repo
Chỉ sửa tệp trong làn của nhóm mình. Commit theo đường dẫn: `git commit -m "…" -- <tệp…>` (tiếng Việt, cuối lời commit thêm 2 dòng: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` và `Claude-Session: https://claude.ai/code/session_012bzhc4y4LFFoewwaqDi15m`). Cấm git add -A, commit -a, stash, reset --hard, push. Không đụng /home/user/omr-app (thư mục chung). Báo lại ≤ 150 từ: mã commit, màn đã xong (kèm đường dẫn 2–3 ảnh tiêu biểu), số liệu kiem:toc-do, test đỏ (nếu có, có phải sẵn không), chỗ chưa sát bản vẽ.
