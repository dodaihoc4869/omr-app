# Tối ưu tải app và kho ca trên máy thầy — 14/10

Nền: `2ad8bafd` (PR288). Làn này không sửa máy chủ, Tick bài, giao diện học sinh/phụ huynh, luật thi hoặc dữ liệu thật.

## Thay đổi

- `main.tsx` bỏ import `game-toan-bo.css` (28.128 byte nguồn), phối hợp làn C1. Các tờ màu/phông/vỏ app vẫn theo thứ tự cũ; C1 xoá tờ CSS đã bỏ.
- `loadAllSessionTeacherBanks()` đọc khoá và bank trong cùng một giao dịch chỉ đọc, thay đọc từng bank nối tiếp. Giữ đúng cặp mã ca → bank khi tab khác ghi/xoá; không nhớ đáp án trong một bộ đệm mới.
- Đồng bộ thư mục mục đích gộp những lượt đang chạy cùng ngày/cùng nguồn kho. Hai caller đồng thời đọc kho một lần và gửi một bộ lô; lỗi/mất mạng không giữ kết quả hỏng, lượt sau vẫn thử lại.
- Hôm nay chỉ nhập luật ca từ `lib/ca-dang-chay.ts`, tránh kéo theo toàn màn Ca kiểm tra. `LichSuCaScreen` vẫn re-export API cũ. Khối hai hàm giữ nguyên từng byte: SHA256 `8f3d888c3b5d94925650304be7717382b22f0147acaab98ccc95ba1e3452831f`.

## Đo trong Chromium thật

Kho ca thử gồm 120 bank × 28 câu, JSON fixture 4.108.851 byte UTF-8 (3.100.251 ký tự). Không dùng dữ liệu thật. Đo trên trang HTML trống cùng origin, nhập trực tiếp module nền và module mới qua Vite; không dựng app/polling/SW. CPU giả lập chậm 6 lần, 2 lượt làm nóng + 15 mẫu mỗi bản, đổi thứ tự nền/mới xen kẽ trong cùng trình duyệt.

| Đo | Nền | Mới |
| --- | ---: | ---: |
| Giao dịch IDB mỗi lần đọc toàn bank | 121 | 1 |
| Lượt đo ghép 1: p50 / p90 | 802,3 / 1.465,8 ms | 141,5 / 238,6 ms |
| Lượt đo ghép 2: p50 / p90 | 1.167,5 / 1.909,5 ms | 189,5 / 315,4 ms |
| Hai caller đồng bộ 901 mã cùng lúc (test) | 2 đọc kho, 6 lệnh | 1 đọc kho, 3 lệnh |

Thời gian dao động do máy workspace dùng chung; đây là độ trễ đọc fixture trên CPU giả lập, không phải p50/p90 production hay thời gian mở toàn app. Số giao dịch 121 → 1 không dao động. Đọc vẫn trả trọn cùng số bank/câu/mã ca, không cắt dữ liệu.

Đóng import tĩnh nội bộ từ `GvHomNayScreen` sau TypeScript transpile loại import chỉ kiểu: 122 → 72 tệp; 1.475.511 → 962.868 byte nguồn (giảm 512.643 byte). Đây chưa minify/gzip; có thư viện vốn nằm trong vỏ app nên không quy số này thành byte mạng hay số HTTP giảm. Cổng build tổng hợp đo byte tải thực do làn gộp thực hiện.

Bằng chứng trong workspace: `/tmp/tai-teacher-1410/{idb-paired.json,idb-paired-final.json,graph-before-after.json,test-final.log,nen-idb.log,tsc-final.log}`. Mã đo một lần nằm ở `/tmp/tai-teacher-1410/do-idb-paired.mjs` và `do-graph.mjs`; module nền tạm được tạo bằng `git show 2ad8bafd:src/lib/exam-db.ts`, đã xoá sau đo.

## Kiểm

- `npx tsc -b`: đạt.
- 89/89 test trong 6 tệp liên quan: Hôm nay, cảnh báo ca đang chạy, bank IDB cùng bản chụp/hỏng giao dịch, thư mục cùng lượt/lỗi mạng/bộ nhớ bị chặn, reset máy thầy, mở ca trên máy mới. Các test cũ nhập luật ca qua `LichSuCaScreen` vẫn dùng API cũ.
- `tests/indexeddb-co-han-2409.test.ts` có 3 đỏ nền: test cấu hình treo và 2 test gọi `khongTreo` không còn export. Chạy riêng nguồn nền `2ad8bafd` tái hiện đủ 3 tên và cùng lỗi; không coi chúng là lỗi mới hoặc báo toàn bộ xanh.
- Chưa chạy full Vitest/build/SW/màu trong leaf này; làn gộp chạy các cổng tổng hợp để tránh build đồng thời. Không push/deploy từ leaf.
