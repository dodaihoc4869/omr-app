# KẾ HOẠCH · Máy chủ không nghẽn giờ cao điểm (Boss, 21/09/2026 sau sự cố 20:30–21:00)

Thầy lệnh 21:1x: "tìm cách hiệu quả nhất tối ưu server thời gian này, khắc phục 100%".

## Sự cố đã xảy ra (để không lặp lại)
- 20:30–21:00 D1 nghẽn toàn cục: lệnh đọc 8–23 giây, máy em hết giờ 20 giây ⇒ "lỗi kết nối máy chủ", nhiều em không nộp được chặng 1.
- GỐC: D1 là MỘT luồng. Tổng thời gian truy vấn/giây vượt 1 ⇒ mọi lệnh xếp hàng. Ba nguồn đốt: (1) game dựng lại kho câu mỗi thao tác (`readScope`, 6,3 triệu dòng/giờ); (2) app học sinh tự hỏi nền 15–30 giây/lần trên mọi máy (≈ 900 lượt/phút, mỗi lượt đọc `mat_khau` + `cau_hinh`); (3) `/hs/ke-hoach-ngay` ≥ 12 truy vấn × 89 lượt/phút; cộng bão thử lại khi hết giờ; cộng các phép đo tay Boss giao giữa giờ cao điểm.
- Đã vá trong sự cố: Worker d8c585ec (đệm kho câu theo dạng 60 giây, đệm xác thực 60 giây, cờ reset 30 giây); đóng tạm Đoàn; P15 giãn nhịp nền 180 giây + lùi dần khi lỗi.

## Mục tiêu đo được (nghiệm thu)
- Giờ cao điểm 20:00–21:30 với 250 em: p50 < 400 ms, p95 < 1,5 giây cho `/hs/ke-hoach-ngay`, `/btvn/cua-em`, `/btvn/xong-lo`, `/hs/on-lai/nop`; 0 lượt nộp bị huỷ vì hết giờ.
- Tổng thời gian D1 mỗi phút ≤ 25 giây (D1 rảnh ≥ 58 %) ở đỉnh tải.
- Không lệnh nào của em vượt NGÂN SÁCH: ≤ 8 truy vấn và ≤ 2.000 dòng đọc mỗi lượt (lệnh nộp ≤ 15 truy vấn).

## Nguyên tắc kỹ thuật
1. **Đọc ít hơn, không đọc nhanh hơn**: dữ liệu CHUNG (kho câu, cấu hình, danh sách lớp, bảng Thi đua của lớp, Bảng tin) tính MỘT lần rồi dùng chung 30–60 giây ở mức mô-đun; dữ liệu RIÊNG của em đệm 20 giây + single-flight, và XOÁ ĐỆM NGAY khi em có ghi (số của chính em không bao giờ đứng).
2. **Lệnh nộp là thiêng**: `/btvn/xong-lo`, `/btvn/nop`, `/hs/on-lai/nop`, nộp bài thi — đi đường ngắn nhất, không chờ việc phụ (EXP, vé, thông báo, sổ phụ làm sau bằng `ctx.waitUntil`), idempotent để em bấm lại không mất/không nhân đôi.
3. **Máy em lịch sự**: mọi vòng hỏi nền ≥ 120 giây + lệch ngẫu nhiên, dừng khi tab ẩn, lỗi ⇒ lùi dần 30 → 60 → 120 → 300 giây, không bao giờ thử lại dồn dập; máy chủ được quyền trả `nhipDeNghi` để giãn nhịp từ xa.
4. **Tự hạ tải**: cờ `che_do_cao_diem` (tự bật khi p95 > 2 giây trong 2 phút, tay cũng bật được): game hỏi thưa hơn, Bảng tin sàn 10 → 30 giây, Thi đua đệm 60 giây, tắt các khối trang trí — ưu tiên tuyệt đối cho làm bài + nộp bài.
5. **Đo trước khi giờ cao điểm đến**: mọi lệnh có test NGÂN SÁCH truy vấn/dòng đọc trên D1 giả cỡ thật; mỗi tối 23:10 một lệnh insights lưu top 20 vào `docs/do-tai-d1/`; phép đo/quét tay trên D1 thật CHỈ sau 23:00.
6. **Mở đường thoát cho đọc**: bật D1 Read Replication (Sessions API) cho các lệnh CHỈ-ĐỌC của thầy/phụ huynh/bảng tin nếu tài khoản hỗ trợ — tách tải đọc khỏi luồng ghi chính; đánh giá đưa kho câu (đọc-nhiều, đổi-hiếm) sang KV/Cache API theo phiên bản kho.

## Việc theo phiên
**Code 3 (máy chủ, chủ trì)**
- M1 (đêm nay): `/hs/ke-hoach-ngay` single-flight + đệm 20 giây/em + xoá đệm khi ghi. `cau_hinh` đệm 30 giây MỘT chỗ cho cả Worker.
- M2 (23:10 đêm nay): insights cả buổi tối ⇒ bảng top 20 theo tổng thời gian + dòng đọc, ghi `docs/do-tai-d1/2109.md`; với mỗi truy vấn top 10: EXPLAIN, chỉ mục thiếu (migration chỉ-thêm), hoặc đệm.
- M3 (sáng 22/09): lệnh nộp đi đường ngắn (việc phụ sang `waitUntil`, idempotent); `nhipDeNghi` trong phản hồi; bộ đo p50/p95 theo lệnh trong bộ nhớ + lệnh `/gv/suc-khoe-may-chu`.
- M4 (trước 18:00 22/09): cờ `che_do_cao_diem` + tự bật; khảo sát Read Replication / KV cho kho câu, báo Boss trước khi bật.
- Test ngân sách cho 12 lệnh em gọi nhiều nhất (đỏ khi vượt ngân sách).

**Code 2 (app học sinh/phụ huynh)**
- P15: nhịp nền 180 giây (đã soát). P16: bảng MỌI `setInterval`/tự gọi lại của app HS/PH/game, đưa hết về `nhip-ben-vung.ts`; đọc `nhipDeNghi`; nút nộp: giữ bài ở máy + hàng đợi nộp lại tự động có lùi dần (em không phải bấm lại), hiện "Đã lưu ở máy, đang chờ máy chủ".
- Màn Hôm nay vẽ NGAY từ bản lưu lần trước rồi mới cập nhật (không trắng màn khi máy chủ chậm).

**Code 4 (app thầy)**: Bảng tin sàn đọc `nhipDeNghi`, tab ẩn thì dừng (đã có), thêm chip "Máy chủ: tốt / đang bận" từ `/gv/suc-khoe-may-chu`.

**Code 1**: bộ BẮN TẢI GIẢ (script Node, chạy với `wrangler dev` + D1 cục bộ nạp từ bản sao lưu đêm, KHÔNG bắn vào máy chủ thật): mô phỏng 250 em giờ cao điểm (mở app, kế hoạch ngày, làm 1 chặng, nộp, chơi 1 lượt Đảo) ⇒ đếm truy vấn/dòng đọc mỗi lệnh, tìm lệnh vượt ngân sách; chạy lại sau mỗi gói của Code 3.

**Boss**: soát từng gói; 19:30 tối 22/09 đo trước giờ cao điểm; 20:00–21:30 trực đo 5 phút/lần; chỉ mở lại Đoàn khi p95 < 1,5 giây ổn định 15 phút.
