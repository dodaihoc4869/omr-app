# Tối ưu 05/10 — SỐ NỀN "TRƯỚC" (thầy: "nhanh gấp 2 lần hiện tại", "Chưa đẩy gì nhé")

Đo bằng `node scripts/do-app-hs.mjs --dist=<dist> --kich=nhanh --ra=<kq.json>`: bản build THẬT, Chromium, CPU chậm 6×, mạng Slow 4G
(RTT 562,5 ms, 1,44 Mb/s), màn 360×740, máy chủ GIẢ trả lời tức thì (số này CHƯA gồm thời gian D1 của máy chủ thật — đo riêng ở MAY-CHU.md).
"Trước" = main `c74100ef` (bản đang chạy thật). Hai bản chạy SONG SONG cùng lúc (cùng tải máy). 1 lượt — số nghiệm thu cuối dùng trung vị ≥ 3 lượt.
JSON gốc: `app-hs-main-c74100ef-1.json`, `app-hs-omni-73604678-1.json`. So sánh: `node scripts/do-app-hs/so-sanh.mjs <trước> <sau>`.

| Chỉ số (ms trừ khi ghi khác) | main c74100ef | nhánh OMNI 73604678 | ĐÍCH (≤ ½ main) |
|---|---:|---:|---:|
| Mở đầu · màn đăng nhập hiện (FCP) | 8212 | 6728 | ≤ 4106 |
| Mở đầu · JS trước màn đăng nhập | 301 KB gzip · 54 tệp | 306 KB · 57 tệp | — |
| Bấm Đăng nhập → Sảnh dùng được | 3285 | 2982 | ≤ 1643 |
| Mở lại (SW) · Sảnh dùng được | 2889 | 2813 | ≤ 1445 |
| Mở lại lần 2 (SW) · Sảnh dùng được | 3035 | 1946 | ≤ 1518 |
| Mở lại (SW) · TBT 5 s đầu | 924 | 781 | ≤ 462 |
| Sảnh → Đảo (bản đồ) | 2544 | 2538 | ≤ 1272 |
| Đảo: Lên đường → trận | 374 | 545 | ≤ 187 |
| Sảnh → Đoàn (trận) | 1857 | 1774 | ≤ 929 |
| Sảnh → Câu đã làm | 1615 | 1610 | ≤ 808 |
| Câu đã làm · tác vụ dài lớn nhất | 2104 | 1886 | ≤ 1052 (mong < 200) |
| Nút DOM cuối kịch bản | 17149 | 17154 | ≤ 8575 |

Nền tên test đỏ để so khi gộp: `nen-do-ac234db2.txt` (150 tên = 141 test + 9 tệp lỗi môi trường).
