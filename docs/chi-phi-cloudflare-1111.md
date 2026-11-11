# Vì sao Cloudflare trừ 127,61 USD lúc 17:30 ngày 11/11/2026

Thầy 11/11: «Tôi chỉ đk gói 5 đô tại sao lại trừ vậy. Tìm hiểu kĩ nguyên nhân».

Nguồn số: GraphQL Analytics của chính tài khoản (workflow chỉ đọc `.github/workflows/do-chi-phi-cf-1111.yml`, kịch bản `scripts/do-chi-phi-cf-1111.mjs`), kỳ **11/10 → 11/11** (giờ UTC). Bảng giá đọc trực tiếp từ trang chính thức developers.cloudflare.com ngày 11/11. Khoá API của repo **không có quyền đọc hoá đơn** (403) ⇒ số dưới đây là số tự tính từ số dùng × bảng giá, chưa phải dòng hoá đơn.

## 1. Gói 5 USD không phải trọn gói
Workers Paid = **tối thiểu 5 USD/tháng** + **phần dùng vượt mức tính theo lượng** (không có trần). Hoá đơn ngày 11 gồm 5 USD kỳ mới + phần vượt của kỳ vừa qua.

## 2. Bảng tính kỳ 11/10 → 11/11
| Hạng mục | Đã dùng | Mức gồm trong gói | Đơn giá vượt | Thành tiền |
|---|---|---|---|---|
| Phí gói | — | — | — | 5,00 |
| D1 — hàng đọc | 59,97 tỉ | 25 tỉ | 0,001 USD / triệu | **34,97** |
| Durable Objects — thời gian chạy | 14,65 triệu giây × 128 MB = 1,87 triệu GB-s | 0,4 triệu GB-s | 12,50 USD / triệu (làm tròn lên triệu) | **25,00** |
| Workers AI | 1,61 triệu neuron (một ngày 27/10) | 10.000 neuron/ngày | 0,011 USD / 1.000 | **17,62** |
| D1 — hàng ghi | 56,54 triệu | 50 triệu | 1 USD / triệu | 6,54 |
| Workers — CPU | 205,7 triệu ms | 30 triệu ms | 0,02 USD / triệu ms | 3,51 |
| Durable Objects — lượt gọi | 3,82 triệu | 1 triệu | 0,15 USD / triệu (làm tròn) | 0,45 |
| Workers — lượt gọi | 10,44 triệu | 10 triệu | 0,30 USD / triệu | 0,13–0,30 |
| D1 dung lượng 2,98 GB · R2 0,7 GB / 88 nghìn lượt · Realtime 17 MB · DO lưu 0,77 GB | | trong mức | | 0 |
| **Cộng phần đo được** | | | | **≈ 93,4** |
| **Còn thiếu so với 127,61** | | | | **≈ 34,2** |

Phần còn thiếu ~34 USD chưa đo được. Hai khả năng (không loại trừ nhau):
- **Workers Logs** (nhật ký máy chủ đang bật 100 %, cả nhật ký từng lượt gọi, ở cả 3 Worker): gói gồm 20 triệu sự kiện/tháng, vượt 0,60 USD / triệu. ~34 USD ≈ 57 triệu sự kiện vượt. Khoá API không có quyền đếm (403).
- **Thuế** nếu Cloudflare thu VAT với tài khoản Việt Nam.
⇒ Chỉ trang **Billing → Billable Usage / Invoices** trên dash.cloudflare.com cho biết chắc.

## 3. Ba nguyên nhân lớn
1. **Thử tải 31/10 – 01/11 trên Worker thử `omr-thu`** (tạo 31/10 07:01 VN, vẫn còn): vùng Durable Object `omr-thu_NganHocSinh` chạy **13,02 triệu giây** = 89 % thời gian Durable Object của cả kỳ ⇒ gần như toàn bộ 25 USD dòng Durable Objects. Ngày thường sau đó chỉ ~0,08–0,30 triệu giây/ngày. Worker thử thứ hai `omr-thu-tai` (28/10) dùng thêm 15,9 triệu ms CPU.
2. **Workers AI ngày 27/10**: 1,61 triệu neuron (41,7 triệu token vào, 19 triệu token ra) trong một ngày — máy soạn lời giải dự phòng khi Gemini hết hạn mức (`server/src/soan-so-do.ts`, thầy 27/10 «soạn luôn bằng mọi cách ko chờ gemini») ⇒ 17,62 USD.
3. **D1 đọc quá nhiều hàng** (dùng thật hằng ngày, đang TĂNG): 25 tỉ hàng miễn phí hết sau khoảng 10 ngày. Ba câu đọc nặng nhất (10 giờ sáng 11/11):
   - `su_kien_hoc` theo em + `ngay_vn >=` — 260 nghìn lượt, **789 triệu hàng**;
   - `loi_giai_hoi` theo em + lọc `nguon LIKE` — 276 nghìn lượt, **381 triệu hàng**;
   - danh sách `ca` kèm đếm `luot` — 186 nghìn lượt, **271 triệu hàng**.

## 4. Tháng tới nếu không làm gì (trung bình 7 ngày 04–10/11)
D1 đọc 3,29 tỉ hàng/ngày ⇒ ~99 tỉ/tháng ⇒ **~74 USD**; D1 ghi 2,39 triệu/ngày ⇒ **~22 USD**; Durable Objects ~0,18 triệu giây/ngày ⇒ **12,50 USD**; CPU **~3 USD**; lượt gọi **~2,4 USD**; phí gói 5 USD ⇒ **~119 USD + nhật ký + thuế**. Dung lượng D1 tăng ~75 MB/ngày ⇒ vượt 5 GB khoảng đầu tháng 12 (0,75 USD/GB).

## 5. Cách giảm (chờ thầy chọn — chưa làm gì)
| # | Việc | Ước tiết kiệm / tháng | Ảnh hưởng |
|---|---|---|---|
| A | Xoá 2 Worker thử `omr-thu`, `omr-thu-tai` (cùng Durable Object của chúng); luật: thử tải xong phải xoá trong ngày | chặn tái phát ~25 USD mỗi lần thử | Không ảnh hưởng học sinh (Worker thử) |
| B | Giảm hàng đọc D1 ở 3 câu trên (chỉ mục đúng cột, thu hẹp khoảng ngày, đệm danh sách ca) | ~40–55 | Không đổi giao diện; phải đo trước/sau |
| C | Nhật ký máy chủ: lấy mẫu 10 % hoặc tắt nhật ký từng lượt gọi | tới ~30 (tuỳ số thật) | Khó soi sự cố hơn |
| D | Đặt trần Workers AI (neuron/ngày) hoặc tắt máy soạn dự phòng | tới ~17 mỗi lần chạy lớn | Lời giải chờ Gemini |
| E | Bật cảnh báo chi tiêu trong dash (Notifications → Usage-based billing) | — | Báo sớm trước khi bị trừ |

Hoàn tiền / khiếu nại (ví dụ phần thử tải 31/10): chỉ qua bộ phận Billing Support của Cloudflare.
