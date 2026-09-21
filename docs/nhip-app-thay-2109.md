# Nhịp tự gọi máy chủ của app thầy (`/`, `/gv`) — bảng soát 21/09/2026

Kế hoạch: `KE-HOACH-MAY-CHU-GIO-CAO-DIEM-2109.md` (mục Code 4, việc (3): "rà MỌI vòng tự gọi của app thầy: bảng nhịp + tab ẩn thì dừng + không gọi chồng"). Bối cảnh: sự cố D1 20:30–21:00 ngày 21/09 — D1 chỉ MỘT luồng, mọi vòng hỏi nền đè nhau.

**Luật chung (mọi vòng tự gọi máy chủ):** nhịp lấy từ BẢNG dưới đây (`BANG_NHIP_THAY` trong `src/lib/nhip-may-thay.ts`) · tab ẩn thì KHÔNG gọi · không gọi chồng (lượt trước chưa xong thì thôi) · lỗi / hết giờ ⇒ lùi 30 → 60 → 120 s, không bao giờ nhanh hơn nhịp thường · tab hiện / có mạng lại thì gọi nhưng chặn dội (≥ min(nhịp, 20 s) kể từ lượt trước). Cách làm: `useNhipThay(chay, coSoMs, bat)` = vỏ React của `batNhipBenVung` (`src/lib/nhip-ben-vung.ts` của app học sinh). `chay` báo LỖI bằng `false` hoặc ném lỗi. Thêm vòng mới ⇒ thêm dòng vào bảng + vào `BANG_NHIP_THAY`; test `tests/nhip-may-thay-2109.test.tsx` chặn `setInterval` lạ.

## Vòng GỌI MÁY CHỦ của app thầy (đã đưa về luật chung)
| Vòng | Tệp | Lệnh | Nhịp | Chỉ khi | Tab ẩn | Chồng | Lỗi |
|---|---|---|---|---|---|---|---|
| **Bảng tin sàn** (màn Hôm nay) | `components/bang-tin-san/use-san-song.ts` | `POST /gv/bang-tin-song` | 10 s (`bangTinSan`) | màn Hôm nay đang mở | dừng, hiện lại hỏi (chặn dội 10 s) | không (cờ `dangHoi` + nhịp đợi lượt trước) | lùi 30→60→120 s; hụt ≥ 2 nhịp ⇒ chip "Mất kết nối"; máy chủ nói KHÔNG (404 / từ chối / sai dạng) ⇒ 5 phút mới hỏi lại |
| **Bảng tin bản 3** (dự phòng của sàn) | `screens/HomNayScreen.tsx` (`HomNayBan3`) | `/gv/bang-tin` | 60 s (`bangTinV3`) | sàn chưa có lệnh / cờ tắt | dừng | không | lùi 30→60→120 s; giữ bản đọc được gần nhất |
| **Theo dõi ca** | `screens/ExamMonitorScreen.tsx` | `chiTietCa` (chi tiết ca) | 20 s (`theoDoiCa`) | ca đang mở VÀ còn em đang làm | dừng | không (lượt nền bỏ qua khi có lượt tải đang chạy, kể cả bấm "Tải" tay) | lùi 30→60→120 s |

Trước đợt này: Theo dõi ca là `setInterval` trần 20 s (không đợi lượt trước — một lượt chậm 20 s dồn lượt khác; lỗi vẫn cứ 20 s một lần; dựng lại mỗi lần `chiTiet` đổi); `useTuLamMoi` (Bảng tin bản 3 + sàn) không chống chồng, không lùi khi lỗi, hiện lại tab gọi ngay không chặn dội.

## Vòng dùng chung, KHÔNG phải của tôi (đã đúng luật hoặc không chạm D1)
| Vòng | Tệp | Ghi chú |
|---|---|---|
| Hiện diện (`/presence`) | `lib/app-presence.ts` (Boss / Code 2) | 60 s ± 10 s, cả vai gv — đã dùng `batNhipBenVung` (không chồng, lùi dần, tab ẩn dừng). Chờ Code 3 nới cửa sổ "online 90 s" mới giãn thêm |
| Hỏi bản mới | `lib/cap-nhat-app.ts` | `registration.update()` mỗi 30 phút + khi quay lại tab (chặn ≥ 60 s) — tệp tĩnh trên Pages, KHÔNG chạm Worker/D1 |
| Bảo hiểm bản mới | `lib/bao-hiem-ban-moi.ts` | 10 phút, tải tệp tĩnh của bản mới — không chạm D1 |

## Bộ đếm giao diện (KHÔNG gọi máy chủ)
`KhoaAppScreen` đếm ngược 1 s khi bị chờ khoá · `bang-tin-san/hooks.ts` số lăn kiểu công-tơ 1 s · `KhoiThoiGianCa` đồng hồ ca 1 s (giờ máy chủ đã nạp sẵn, tính cục bộ) · `App.tsx` `visibilitychange` = đồng hồ khoá app (cục bộ). Tờ chiếu Gọi lên bảng (`html-may-chieu.ts`, `to-chieu-cau-noi.ts`) nói chuyện bằng `postMessage`, không gọi máy chủ.

## Còn chờ
- **`nhipDeNghi`** (Code 3, sáng 22/09): máy chủ trả nhịp đề nghị (mặc định 10 s, bận ⇒ 30 s) ⇒ Bảng tin sàn đọc và truyền vào `useNhipThay` (đổi `coSoMs` = vòng mới).
- **Chip "Máy chủ: tốt / đang bận"** từ `/gv/suc-khoe-may-chu` (Code 3 làm sáng 22/09, chờ hợp đồng).
