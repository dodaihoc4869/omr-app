# Hợp đồng · Sức khoẻ máy chủ + `nhipDeNghi` (Code 3 ↔ Code 2, Code 4, Boss) — 21/09/2026, M3

Mục đích: máy khách (app em, PH, thầy) TỰ giãn nhịp hỏi nền khi máy chủ bận, không chờ ai bật cờ. Mã: `server/src/suc-khoe-may.ts`, gắn ở `server/src/index.ts`. Kiểm: `tests/suc-khoe-may-2109.test.ts`. Không chạm D1.

## 1. `nhipDeNghi` — trong MỌI phản hồi JSON của Worker (chỉ-thêm, kể cả phản hồi lỗi)
`"nhipDeNghi": { "heSo": 1 | 2 | 4, "muc": "tot" | "ban" | "nghen" }`
- `heSo` là HỆ SỐ (không phải giây): máy khách nhân vào nhịp hỏi nền GỐC của mình rồi kẹp trần của mình (vd Bảng nhiệm vụ 180 s ⇒ tối đa 300 s; Bảng tin sàn 10 s ⇒ 20 / 40 s). `1` = giữ nhịp; `2` = bận; `4` = nghẽn.
- Cách tính: cửa sổ 2 phút của chính isolate đang trả lời; dưới 20 mẫu ⇒ `tot`; p95 > 1.500 ms ⇒ `ban`; p95 > 3.500 ms ⇒ `nghen`.
- Mỗi isolate có bộ đo riêng ⇒ mỗi lượt có thể thấy số khác nhau. Máy khách lấy **MAX của 3 phản hồi gần nhất**, và chỉ về 1 khi **3 phản hồi liền** đều `heSo:1` (hoặc 120 giây không có phản hồi nào). Không dùng `heSo` để quyết việc quan trọng (nộp bài không bao giờ bị trì hoãn vì `heSo`).
- Có ở mọi lệnh đi qua `ra()`; lệnh trả `Response` dựng tay (phiếu, đề, redirect) thì KHÔNG có.

## 2. `POST /gv/suc-khoe-may-chu` (chỉ thầy: header `x-ma-bi-mat`; thiếu ⇒ 403)
Vào `{}` · ra `{ ok:true, muc, heSo, p50Ms, p95Ms, soLuot, cuaSoGiay:120, theoLenh:[{duong,soLuot,p50Ms,p95Ms}] (≤ 8 lệnh nhiều lượt nhất), nguong:{banMs:1500,nghenMs:3500,toiThieuMau:20}, ghiChu }`.
- Không truy vấn D1, không đệm (số đo bộ nhớ, tính lại tối đa mỗi 2 giây). Lệnh này KHÔNG tự đếm chính nó.
- Chip "Máy chủ: tốt / đang bận / nghẽn" = `muc` (`tot` / `ban` / `nghen`). Gọi ≤ 1 lần / 10 giây (nhịp của app thầy đã có `useNhipThay`).
- Số đo là của isolate đang trả lời: hai lần gọi liền nhau có thể lệch; chip nên lấy MAX vài lượt như mục 1.

## 3. Việc chưa làm (M3/M4)
- Cờ `che_do_cao_diem` (tự bật khi `nghen` 2 phút) — M4. Lệnh nộp đường ngắn `ctx.waitUntil` — M3 sáng 22/09, cần Boss chốt vì đổi nội dung phản hồi nộp.
