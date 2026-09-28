# Gỡ "Bộ não A.I Đỗ Đại Học" — bản đồ + việc đã làm (28/09/2026)

Thầy lệnh: "xoá bỏ chức năng bộ não a.i đỗ đại học nhé, những mục nhận xét trong báo cáo thay bằng Thầy Đỗ Đại Học". Nhánh `go-bo-nao`.
KHÔNG DROP bảng, KHÔNG xoá dữ liệu: `ai_ho_so_ngay`, `ai_dieu_chinh`, `ai_ban_tin`, `thu_thach_rieng`, khoá `cau_hinh.bo_nao` còn nguyên, chỉ không ai đọc/ghi nữa.

## 1. Chức năng này từng làm gì

| Phần | Làm gì | Chạy ở đâu |
|---|---|---|
| Lượt ĐÊM (04:00) | `launchd` trên **máy Mac của thầy** chạy `~/.omr-bo-nao/app/scripts/bo-nao/chay-dem.sh` → `claude -p` (gọi mô hình AI) → `lay.mjs` kéo thẻ ẩn danh qua `POST /ai/ho-so-ngay` → AI viết điều chỉnh + lời nhắn → `nop.mjs` gửi `POST /ai/dieu-chinh/nop` | Máy thầy (KHÔNG phải cron Worker) |
| Lượt CHIỀU | `chay-chieu.sh` (tay/launchd): chọn "thử thách riêng hôm nay" cho từng em | Máy thầy |
| Máy chủ `/ai/*` | `cau-hinh`, `ho-so-ngay`, `dieu-chinh/nop`, `dem-qua`, `nhat-ky`, `dieu-chinh/bo` (sau cổng `laThay`); ghi `ai_ho_so_ngay`, `ai_dieu_chinh`, `ai_ban_tin`, `cau_hinh.bo_nao` | Worker `server/src/bo-nao.ts` |
| Tầng đọc (chế độ THẬT) | `server/src/bo-nao-doc.ts`: điều chỉnh còn hạn của em → kế hoạch ngày (núm nhịp ±3 câu, `on_som` kéo câu ôn về sớm), BTVN nâng đỡ (cổng `dieuChinh` lúc chốt bộ / thích nghi sau chặng / tính thử), lời nhắn cho em (`loiNhanHlv`), lời + thư tuần cho phụ huynh (`boNaoAi`, `loiBoNao`) | Worker |
| Cron Worker `scheduled` | KHÔNG có việc nào của Bộ não (đã kiểm `index.ts` `scheduled`) | — |

## 2. Chỗ HIỆN RA trước khi gỡ (và đã gỡ)

| App | Khối | Trạng thái |
|---|---|---|
| Thầy · Cài đặt | `KhoiBoNaoCaiDat` (bật/tắt, chạy thử/thật, lớp thật) | **Xoá** tệp + chỗ gắn |
| Thầy · Hôm nay (cũ) | `KhoiBoNaoDemQua` "Bộ não A.I · đêm qua" | **Xoá** |
| Thầy · Hồ sơ em | `NhatKyDieuChinh` (nhật ký điều chỉnh, nút bỏ điều chỉnh) | **Xoá** |
| Thầy · Bảng tin v3 | ô `KhoiBoNao` "Bộ não A.I · đêm qua"; dòng "Bộ não A.I soi N em", "N em nhận thử thách riêng", "Đưa câu khắc phục vào bài cho N em"; sức khoẻ "Bộ não A.I chạy lúc…/chưa chạy lại", "bị loại N lời" | **Gỡ** (lưới hàng dưới còn 3 ô) |
| Thầy · Bảng tin sân | nhóm số "Bộ não A.I đêm qua" trong `CotAI` | **Gỡ** |
| Thầy · Toàn cảnh em | loại sự kiện `bo_nao` trong dòng thời gian + bộ lọc | **Gỡ** (máy chủ + app) |
| Thầy · Buổi chữa đề xuất | `dangBoNao` / `dongBoNao` từ `ai_ban_tin` | Máy chủ trả `[]` (giữ khoá hợp đồng) |
| Học sinh · Bảng nhiệm vụ | `TheBoNao` (lời "Bộ não A.I hỗ trợ riêng em") | **Xoá** |
| Học sinh · Thử thách riêng hôm nay | thẻ do Bộ não chọn dạng/số câu | **Xoá** thẻ `TheThuThachRieng` + css, hook `useThuThachHomNay`, trường `thuThachRieng` của Bảng nhiệm vụ, nhánh "Để sau". Máy chủ `/hs/thu-thach-hom-nay` luôn `{ok:true, co:false}`, `/nop` ⇒ đã gỡ. Còn lại: nút cũ "Luyện nâng cao" của nguồn trợ lý (`mo_thu_thach`) gọi route ấy ⇒ báo "Chưa có câu thử thách" |
| Phụ huynh (cũ) · Bảng nhiệm vụ | lời + thư tuần Bộ não | **Xoá**; `bo-nao-lay-loi-ph.ts` → `tai-thong-tin-ph.ts` chỉ còn "Cảnh báo của thầy" |
| Phụ huynh (mới) · Mọi thứ về con | thư "Lời A.I Đỗ Đại Học gửi anh/chị" (`loiBoNao`) | Bỏ phần thư; khối còn "Anh/chị có thể làm gì" (số thật của máy chủ), đổi tên "Lời Thầy Đỗ Đại Học gửi anh/chị" |
| Phụ huynh (ph-v3, PR #39) · Lời thầy | khối "Thư tuần về con" (`loiBoNao`) | **Gỡ**; khối đầu = nhận xét mới nhất của thầy. `AppPhuHuynh` lấy cảnh báo qua `tai-thong-tin-ph.ts` |

## 3. Máy chủ — đã gỡ gì

- `server/src/bo-nao.ts`, `bo-nao-doc.ts`: **xoá**. `index.ts`: mọi `/ai/*` ⇒ `{ok:false, error:'Chức năng đã gỡ'}` (sau cổng `laThay`, không ghi bảng nào). Bỏ `loiNhanHlv` khỏi `/hs/ke-hoach-ngay`, `boNaoAi` khỏi `/ph/ke-hoach`, `loiBoNao` khỏi `/ph/tat-ca-ve-con`.
- `ten-dang-bo-nao.ts`: bỏ `themTenDangNhatKy/DemQua`; GIỮ `tenCuaCacDang` (hàm dùng chung của bảng tin, báo cáo ca, buổi chữa, giao thêm).
- `scripts/bo-nao/*`, thư mục cẩm nang `bo-nao/`: **xoá** khỏi kho.

## 4. Luồng khác từng ĐỌC kết quả Bộ não ⇒ nay đi đường mặc định

| Luồng | Trước | Nay |
|---|---|---|
| Kế hoạch ngày (`ke-hoach-ngay*.ts`) | em ở lớp chế độ THẬT: nhịp ±3 câu/ngày; `on_som` kéo mốc ôn về ngày mai | Không núm nhịp, không kéo sớm = y hệt chế độ CHẠY THỬ/TẮT cũ (vốn là mặc định) |
| BTVN nâng đỡ (`btvn-nang-do-d1.ts`) | cổng `dieuChinh` (khởi động, núm dạng, khắc phục) lúc chốt bộ, thích nghi sau chặng, tính thử | Luôn `undefined` ⇒ lõi đi đường không điều chỉnh (y hệt chạy thử). Cổng tuỳ chọn trong lõi `src/lib/btvn-nang-do.ts` GIỮ (không ai truyền) |
| Thử thách riêng | Bộ não chọn ⇒ máy chủ chốt câu | Không có thẻ (xem mục 2) |
| Sức khoẻ bảng tin | vàng/đỏ khi Bộ não quá 26 giờ chưa chạy | Chỉ còn nhắc nộp bài + lỗi việc nền |

Nếu lớp nào đang ở chế độ THẬT: từ bản này em lớp đó nhận kế hoạch/BTVN như lớp chạy thử (thay đổi hành vi DUY NHẤT với học sinh). Bộ BTVN ĐÃ CHỐT trước đó giữ nguyên câu.

## 5. Đổi nhãn (tác giả nhận xét / chủ ngữ tự động)

Luật mới ghi ở `docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md` (hàng 37, 47): màn học sinh / phụ huynh / báo cáo ⇒ **"Thầy Đỗ Đại Học"**; màn thầy tự đọc (việc app tự làm, app tự giải đáp án) ⇒ **"App"**.
- "Thầy Đỗ Đại Học" (≈27 chỗ): báo cáo chi tiết ("Thầy Đỗ Đại Học đã lo", "Nhận xét của Thầy Đỗ Đại Học"), kết quả sau nộp, phiếu (bộ câu đã gán riêng), app phụ huynh mới (AiLam ×3, Dang, SapCo, ThanhDayAp, LoiAi/VoBang, giao thêm), Giao thêm cho con ×2, khối bài luyện, tin nhắn máy chủ (khiên ×2, thần thú, bài gia đình giao ×2), Đoàn Hộ Tống (thẻ gợi ý ×3), thẻ thử thách.
- "App" (≈25 chỗ): bảng tin v3 + sân ("App đã tự làm hôm nay", "App đã nhắc…", việc tự làm, lỗi việc nền "app sẽ tự thử lại"), rút đề ×5, ngân hàng đề ×3, chiến dịch ×4, mã dạng, bài tập PDF, lời giải game lệch đáp án, luyện khắc phục.
- Bỏ "& Trợ lý AI" ở Hướng dẫn (không còn tính năng ấy).
- KHÔNG sửa: khối phòng chờ `ExamMonitorScreen.tsx` ~dòng 1393 (trợ lý khác đang làm lại).

## 6. Việc còn lại NGOÀI kho (Boss/thầy)

- Máy Mac của thầy vẫn còn tác vụ `launchd` + bản đóng gói `~/.omr-bo-nao/app`: 04:00 mỗi đêm sẽ vẫn mở `claude -p` rồi dừng vì `/ai/ho-so-ngay` báo "Chức năng đã gỡ" (tốn một lượt khởi động). Nên tắt: `launchctl list | grep -i bo-nao` → `launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/<tệp>.plist`, rồi xoá `~/.omr-bo-nao/app` (giữ `~/.omr-bo-nao/ma-bi-mat` hay xoá tuỳ thầy).
- Phải đẩy Worker + Pages thì mới có hiệu lực (phiên này KHÔNG đẩy).
