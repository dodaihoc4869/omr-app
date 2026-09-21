# Câu KHÔNG đọc ra khối từ mã tờ (đo trên bản sao lưu D1 21/09 18:07, Code 1)

Hàm dùng chung `src/lib/khoi-cau.ts` (41ce3d2) đọc khối của câu từ **mã tờ / mã câu**: `DH-12-C2-B6`, `DB-12-B8-D1` (khối ở đoạn 2) và `12-C1-B2-D1`, `10-C1-B1`, `12-KT-C1-D1` (khối ở đoạn đầu). Đo trên `game_v2_question` (15 359 câu, 268 tờ):

| Khối | Số câu | Số tờ (`de_kho.lop`) |
|---|---:|---:|
| 10 | 2 802 | 51 |
| 11 | 3 047 | 68 |
| 12 | 9 510 | 149 |
| **không đọc ra** | **28** | **1** |

`de_kho.lop` luôn khớp khối đọc từ mã (0 lệch trên 15 331 câu đọc được).

## Tờ duy nhất còn lại
- `ma_de = 100` — "Bộ đề lấy theo chuẩn", `de_kho.lop = 12`, 28 câu (`100-I-1`, `100-II-…`, `100-III-…`). Mã tờ chỉ là số `100` nên không có khối trong mã.
- Hệ quả: câu của tờ này KHÔNG bị bộ lọc khối chặn (luật "không biết ⇒ không kết tội") ⇒ có thể tới em khối 10/11 qua Đảo/Đoàn/ôn lại. Luyện đề 2026 đã chặn em < 12 riêng (bản vá luyen-de).

## Cách sửa (chọn một, việc của Code 3 / thầy nạp đề)
1. Đổi mã tờ `100` thành `DH-12-BDC` (hoặc `12-BDC`) khi nạp kho — sạch nhất, không cần sửa mã.
2. Hoặc thêm `lop` vào JSON câu trong `game_v2_question` khi nạp (hàm đã đọc trường `lop`/`khoi` của câu: `khoiCuaCau({..., lop})`).
3. Hoặc `readScope` đưa `d.lop` vào câu trước khi lọc (đệm theo dạng đã có; thêm một cột vào truy vấn khoá).

Tái lập số đo: `node scripts/ban-tai-gia/nap-sao-luu.mjs && node scripts/ban-tai-gia/chuan-bi.mjs` rồi đếm `khoiCuaCau` trên `.trang-thai/mau.sqlite`.
