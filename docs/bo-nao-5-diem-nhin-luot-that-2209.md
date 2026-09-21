# Bộ não A.I — 5 điểm cần nhìn sáng 22/09 (lượt THẬT đầu tiên, 04:00)

Nơi nhìn: `bo-nao/2026-09-22/bao-cao.md` (hoặc ngày soi ghi trong đó), `bo-nao/2026-09-22/nop-ket-qua.json`, nhật ký `~/.omr-bo-nao/nhat-ky/<ngày-giờ>.log`, `bo-nao/so-tay/do-token.md`. Mốc so sánh = đêm THỬ 21/09 (220 phần tử ra).

| # | Nhìn gì | Bình thường | Bất thường ⇒ nghĩa là gì |
|---|---|---|---|
| 1 | Dòng "Chế độ" trong bao-cao.md và `soApDung` trong nop-ket-qua.json | "THẬT"; `soApDung` = `nhan` (đêm thử: chỉ-ghi-sổ, soApDung = 0) | Vẫn ghi "chạy thử" hoặc `soApDung` = 0 mà `nhan` > 0 ⇒ cờ `bo_nao` bị đổi/độ tin cậy chặn — không áp gì lên em; `nhan` = 0 ⇒ nộp hỏng |
| 2 | Số phần tử BỊ BỎ vì sai khuôn: `biLoaiCucBo`, `biLoaiMayChu` | Đêm thử: 73/220 (33 %) loại cục bộ, 0 máy chủ (hai lỗi chính đã sửa trong cẩm nang ⇒ kỳ vọng thấp hơn) | > 40 % loại, hoặc `biLoaiMayChu` > 0 (máy chủ chặn thứ máy thầy cho qua ⇒ gói lệch máy chủ), hoặc một lý do lặp ≥ 20 lần |
| 3 | Số em BỊ ĐỔI NHỊP (`nhip.lech` ≠ 0) và khởi động ≠ 2 | Đêm thử: 90/220 (41 %) lệch nhịp, 78/220 (35 %) khởi động ≠ 2 | > 60 %, hoặc 0 %, hoặc gần như CÙNG một chiều (toàn giảm / toàn tăng) ⇒ luật hỏng hoặc dữ liệu ngày lệch |
| 4 | Số THỬ THÁCH riêng (lần đầu thật; đêm thử = 0) | > 0 và ≤ số em soi sâu (~115); mỗi em ≤ 1; thẻ hiện trên máy em ít hơn số đề xuất (máy chủ lọc khối/câu đã làm 14 ngày) | 0 ⇒ cờ `bo_nao.thuThach` tắt hoặc khuôn sai; > 150 ⇒ AI đề xuất tràn; nhiều em `co:false` ⇒ dạng thiếu câu đúng khối |
| 5 | LỖI NỘP + THỜI GIAN CHẠY (nhật ký launchd) | có log 04:00; "kết thúc, mã thoát 0"; ~13 phút (đêm thử); token ~1,6 triệu; mọi lô nộp "nhận" | không có log 04:00 (máy ngủ/tắt); mã thoát ≠ 0; > 45 phút hoặc "Background tasks still running… terminating"; lô nộp lỗi 401/429/5xx; token > 3 triệu |

Nếu điểm 1 hoặc 5 bất thường: nộp lại vô hại (máy chủ ghi đè theo (em, ngày)) — chạy `bash scripts/bo-nao/chay-tay.sh` (hoặc chỉ `node scripts/bo-nao/nop.mjs <ngày>` khi ra/*.json còn nguyên). Không đổi `cau_hinh.bo_nao` (thầy quyết "Giữ thật" 21/09).
