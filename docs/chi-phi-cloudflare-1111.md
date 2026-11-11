# Vì sao Cloudflare trừ 127,61 USD lúc 17:30 ngày 11/11/2026

Thầy 11/11: «Tôi chỉ đk gói 5 đô tại sao lại trừ vậy. Tìm hiểu kĩ nguyên nhân».

Nguồn số: GraphQL Analytics + REST chỉ đọc của chính tài khoản (workflow chỉ đọc `.github/workflows/do-chi-phi-cf-1111.yml`, kịch bản `scripts/do-chi-phi-cf-1111.mjs`), kỳ **11/10 → 11/11** (giờ UTC). Bảng giá đọc trực tiếp từ trang chính thức developers.cloudflare.com ngày 11/11. Khoá API của repo **không có quyền đọc hoá đơn** (403) ⇒ số dưới đây là số tự tính từ số dùng × bảng giá, chưa phải dòng hoá đơn.

## 1. Gói 5 USD không phải trọn gói
Workers Paid = **tối thiểu 5 USD/tháng** + **phần dùng vượt mức tính theo lượng** (không có trần). Hoá đơn ngày 11 gồm 5 USD kỳ mới + phần vượt của kỳ vừa qua.

## 2. Bảng tính (kỳ giả định 11/10 → hết 10/11 UTC; D1 và Durable Object tính cho CẢ TÀI KHOẢN)
Tài khoản có **3 D1**: `omr` (thật, 2,98 GB), `omr-thu` (0,89 GB, tạo 31/10) và `omr-thu-tai` (1,47 GB, tạo 28/10) — hai cái sau là của **Worker thử tải**. Mức miễn phí của gói tính chung cả tài khoản.

| Hạng mục | Cả tài khoản | Trong đó do Worker thử | Mức gồm | Đơn giá vượt | Thành tiền |
|---|---|---|---|---|---|
| Phí gói | — | — | — | — | 5,00 |
| D1 — hàng ghi | 100,7 triệu | **44,5 triệu** | 50 triệu | 1 USD / triệu | **50,74** |
| D1 — hàng đọc | 65,5 tỉ | 7,7 tỉ | 25 tỉ | 0,001 USD / triệu | **40,54** |
| Durable Objects — thời gian chạy | 14,62 triệu giây × 128 MB = 1,87 triệu GB-s | **13,02 triệu giây** (`omr-thu_NganHocSinh`, 31/10–01/11) | 0,4 triệu GB-s | 12,50 USD / triệu GB-s (làm tròn lên) | **18,40–25,00** |
| Workers AI | 1,61 triệu neuron (một ngày 27/10) | — | 10.000 / ngày | 0,011 USD / 1.000 | **17,62** |
| Workers — CPU | 202 triệu ms | 16,7 triệu ms | 30 triệu ms | 0,02 USD / triệu ms | 3,44 |
| Durable Objects — lượt gọi | 3,80 triệu | 1,24 triệu | 1 triệu | 0,15 USD / triệu | 0,42–0,45 |
| Workers — lượt gọi | 10,12 triệu | 0,9 triệu | 10 triệu | 0,30 USD / triệu | 0,04–0,30 |
| R2 · Realtime · lưu trữ Durable Object | | | trong mức | | 0 |
| **Cộng** | | | | | **≈ 136–143** |

⇒ Số tự tính **khớp cỡ** với 127,61 USD (chênh ~7–12 %: cách làm tròn, mốc giờ đầu / cuối kỳ, số liệu phân tích là số lấy mẫu). Đối chiếu từng dòng cần trang **Billing → Billable Usage / Invoices** (khoá API của repo không có quyền đọc hoá đơn). Không cần giả định thêm nhật ký hay thuế mới giải thích được số tiền.

**Hai Worker thử tải chiếm khoảng 70–77 USD** (≈ 44,5 hàng ghi + 7,7 hàng đọc + gần trọn dòng Durable Object + CPU). Riêng app thật của học sinh (phần vượt) ≈ 60–65 USD, trong đó Workers AI 27/10 là 17,62.

## 3. Ba nguyên nhân lớn
1. **Hai Worker thử tải** dựng bản sao app + D1 riêng để đo tải: `omr-thu-tai` (28/10) và `omr-thu` (31/10). Đợt thử 31/10 – 01/11 giữ Durable Object `omr-thu_NganHocSinh` chạy **13,02 triệu giây** (89 % thời gian Durable Object cả kỳ) và hai D1 thử ghi **44,5 triệu hàng**. **`omr-thu-tai` VẪN CÒN lịch chạy mỗi phút** (`* * * * *`, ~1.430 lượt / ngày, ~0,37 triệu ms CPU / ngày) trên D1 thử của nó — tiếp tục tốn tiền mỗi ngày dù không phục vụ học sinh.
2. **Workers AI ngày 27/10**: 1,61 triệu neuron (41,7 triệu token vào, 19 triệu token ra) trong một ngày — máy soạn lời giải dự phòng khi Gemini hết hạn mức (`server/src/soan-so-do.ts`, thầy 27/10 «soạn luôn bằng mọi cách ko chờ gemini») ⇒ 17,62 USD.
3. **D1 thật đọc quá nhiều hàng** (dùng hằng ngày, đang TĂNG): 25 tỉ hàng miễn phí hết sau khoảng 8–10 ngày. Ba câu đọc nặng nhất (10 giờ sáng 11/11):
   - `su_kien_hoc` theo em + `ngay_vn >=` — 260 nghìn lượt, **789 triệu hàng**;
   - `loi_giai_hoi` theo em + lọc `nguon LIKE` — 276 nghìn lượt, **381 triệu hàng**;
   - danh sách `ca` kèm đếm `luot` — 186 nghìn lượt, **271 triệu hàng**.

## 4. Tháng tới nếu không làm gì (trung bình 7 ngày 04–10/11)
D1 đọc 3,29 tỉ hàng/ngày ⇒ ~99 tỉ/tháng ⇒ **~74 USD**; D1 ghi 2,39 triệu/ngày ⇒ **~22 USD**; Durable Objects ~0,18 triệu giây/ngày ⇒ **12,50 USD**; CPU **~3 USD**; lượt gọi **~2,4 USD**; phí gói 5 USD ⇒ **~119 USD + nhật ký + thuế**. Dung lượng D1 tăng ~75 MB/ngày ⇒ vượt 5 GB khoảng đầu tháng 12 (0,75 USD/GB).

## 5. Cách giảm (chờ thầy chọn — chưa làm gì)
| # | Việc | Ước tiết kiệm / tháng | Ảnh hưởng |
|---|---|---|---|
| A | **Xoá 2 Worker thử `omr-thu`, `omr-thu-tai` và 2 D1 thử** (`omr-thu`, `omr-thu-tai`); luật: thử tải xong phải xoá trong ngày | dừng lịch chạy mỗi phút đang chạy; kỳ vừa rồi chúng tốn ~70–77 USD | Không ảnh hưởng học sinh (bản sao thử, dữ liệu giả / bản chép) |
| B | Giảm hàng đọc D1 ở 3 câu trên (chỉ mục đúng cột, thu hẹp khoảng ngày, đệm danh sách ca) | ~40–55 | Không đổi giao diện; phải đo trước/sau |
| C | Nhật ký máy chủ: lấy mẫu 10 % hoặc tắt nhật ký từng lượt gọi | tới ~30 (tuỳ số thật) | Khó soi sự cố hơn |
| D | Đặt trần Workers AI (neuron/ngày) hoặc tắt máy soạn dự phòng | tới ~17 mỗi lần chạy lớn | Lời giải chờ Gemini |
| E | Bật cảnh báo chi tiêu trong dash (Notifications → Usage-based billing) | — | Báo sớm trước khi bị trừ |

Hoàn tiền / khiếu nại (ví dụ phần thử tải 31/10): chỉ qua bộ phận Billing Support của Cloudflare.

## 6. Đã làm tối 11/11 (thầy «Làm mọi thứ để dùng bản 5 đô/tháng thôi»)

Số đo kỳ mới (00:00 → 11:49 UTC 11/11, máy `theo-doi-chi-phi-cf.yml`): D1 đọc 2,32 tỉ hàng trong nửa ngày ⇒ dự báo 141 tỉ/kỳ (gói gồm 25 tỉ) ⇒ ~117 USD;
Worker CPU dự báo 259 triệu ms (gói 30 triệu) ⇒ ~4,6 USD; lượt gọi Worker 20,6 triệu (gói 10 triệu) ⇒ ~3,2 USD. D1 ghi, DO thời gian: trong gói.

| Việc | Trạng thái | Số trước (24 giờ) |
|---|---|---|
| Xoá Worker `omr-thu-tai`, `omr-thu` + 2 D1 thử (vùng DO `omr-thu_*` đi theo) | XONG 18:34 VN, run 43013003785 | 44,5 tr hàng ghi + 7,7 tỉ hàng đọc + 13 tr giây DO / kỳ trước |
| Lần làm câu sai: `qid IN … OR tc IN …` ⇒ 2 nhánh đi chỉ mục (`chua-cau-sai-adapter.ts`) | chờ phát hành | 1,19 tỉ hàng, 3.048 hàng/lượt |
| Dấu hỗ trợ câu sai: quét mọi dấu của em ⇒ dò khoảng qid trên khoá chính | chờ phát hành | 0,55 tỉ hàng, 1.384 hàng/lượt |
| Ca bảo vệ đề: không đếm lượt của ca đã đóng (`game-v2-bank.ts`) | chờ phát hành | 0,41 tỉ hàng, 1.456 hàng/lượt |
| Cron gói sửa mỗi phút: chỉ mục bộ phận đợt mở (`chi-muc-luc-chay.ts`, dựng 00:01) | chờ phát hành | 0,13 tỉ hàng, 98.216 hàng/lượt |
| Workers AI: trần 9.000 neurons/ngày UTC (phần miễn phí 10.000; hệ số neurons/token là ƯỚC LƯỢNG) + công tắc `cau_hinh.workers_ai_tat` | chờ phát hành | 27/10: 1,61 tr neurons ≈ 17,6 USD |
| Workers Logs lấy mẫu | TẠM HOÃN: phiên Live đang soi nhật ký `live_tieng`; chưa đo được số sự kiện (khoá thiếu quyền) | — |
| Máy theo dõi chi phí 23:17 VN mỗi đêm, đỏ khi dự báo > 6 USD + 15 câu D1 đọc nặng nhất | XONG | — |

Kế hoạch truy vấn trên D1 THẬT (EXPLAIN, `ke-hoach-d1-1111.yml`): nhánh qid ⇒ `idx_skh_em_qid_ngay`, nhánh tc ⇒ `idx_skh_em_tc`, dấu hỗ trợ ⇒ `idx_lg_hoi_em_cau_luc (sbd, qid>?, qid<?)`.
Test so cũ ↔ mới: `tests/doc-loi-dau-chi-muc-1111.test.ts`, `tests/ca-bao-ve-dem-mo-1111.test.ts`.

Số thật 24 giờ tới 12:08 UTC 11/11: D1 đọc **3,97 tỉ hàng** (gói ~0,83 tỉ/ngày); 4 câu sửa đợt này = 2,28 tỉ ⇒ còn ~**1,69 tỉ/ngày** (15 câu nặng nhất còn lại ~0,78 tỉ,
đuôi dài ngoài top-15 ~0,91 tỉ). Dự báo sau đợt này: D1 đọc ~25 USD + CPU ~4,5 USD + lượt gọi ~3,2 USD + 5 USD gói ≈ **38 USD/kỳ** (trước: ~127 USD).
Muốn về ~5–10 USD cần thêm 2–3 đợt: chua_loi_dot `qid_chuan=? OR content_group=?` + chèn kèm (~157 tr), hanh_trinh_v4_canh (~125 tr), giao kho sai cả lớp (~88 tr),
cau_meta (~75 tr), game_v2_session (~72 tr), kiểm em có tồn tại (~69 tr)… + giảm lượt gọi và CPU Worker. Máy theo dõi đêm sẽ ĐỎ (GitHub gửi thư) tới khi dự báo ≤ 6 USD.
