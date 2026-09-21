# Hợp đồng `POST /gv/bang-tin-song` — Bảng tin kiểu sàn giao dịch (Code 4 ⇄ Code 3, 21/09)

Lệnh ĐỌC-CHỈ cho màn `src/components/bang-tin-san/` (mật khẩu thầy như `/gv/bang-tin`; không ghi D1; không AI). Màn hỏi **10 giây/lần** khi tab đang mở; giữa hai lần chỉ nội suy chuyển động (không bịa sự kiện).
Máy chủ ĐỆM kết quả 10 giây (bộ nhớ Worker hoặc `cau_hinh`) — 8 640 lượt/ngày/thầy không được thành 8 640 lần tính. Mọi con số TỪ MỐC HIỂN THỊ (`giaiMocHienThi` ở moc-no.ts). D1 THẬT: ≤ 5 term mỗi truy vấn UNION.
Máy chủ chưa có lệnh / lỗi / `cau_hinh.bang_tin_san = 'tat'` ⇒ màn tự dùng Bảng tin bản 3 (`/gv/bang-tin`).

## Trả về
`{ ok: true, serverNow, ...MỌI khoá của /gv/bang-tin hiện có (gọi chung hàm, không chép mã), song: {…} }`

```jsonc
"song": {
  "tongEm": 264,                       // sĩ số = mọi em có tài khoản (KHÔNG tính tài khoản thử 12121212)
  "dungNhip": { "soEm": 59, "soCoLo": 59 },   // "Bài tập về nhà đúng nhịp"; null khi chưa có số
  "tia60": {                           // 60 điểm, mỗi điểm một phút, PHẦN TỬ CUỐI = hiện tại; giá trị LUỸ KẾ từ mốc tại cuối phút đó
    "hs":   [/*60*/],                  // số em đã học
    "cau":  [/*60*/],                  // số câu đã làm
    "tile": [/*60*/],                  // tỉ lệ đúng CẢ NGÀY (%, 0–100)
    "nhip": [/*60*/] | null            // số em đúng nhịp; null nếu chưa có
  },
  "nen": [ { "tu": 1790000000000, "mo": 86.2, "cao": 88.3, "thap": 84.5, "dong": 84.8, "soCau": 51 } ],   // khung 5 phút từ mốc, cũ → mới, ≤ 100 nến gần nhất
  "theoLop": [ { "lop": "12 - Tinh Hoa", "siSo": 38, "daHoc": 7, "soCau": 247, "soCauDung": 227 } ],
  "nhiet":   [ { "sbd": "12001", "hoTen": "Nguyễn Văn An", "lop": "12 - Tinh Hoa", "soCau": 24, "soCauDung": 20, "dangVap": false } ],   // MỌI em (kể cả chưa học), theo lớp rồi tên
  "suKienMoi": [ { "luc": 1790000000000, "loai": "len" | "xuong" | "cham", "chu": "Nguyễn Văn An", "phu": "· 12 - Tinh Hoa · đúng 5 câu liền" } ],   // ≤ 20, cũ → mới; chữ soạn sẵn, KHÔNG mã dạng/qid
  "danDau": [ { "sbd": "12001", "hoTen": "Nguyễn Văn An", "tenLop": "12 - Tinh Hoa", "soCau": 61, "tienBo": 9 } ]   // ≤ 5; tienBo = điểm % so với CHÍNH em, 7 ngày (không so em này với em khác)
}
```

## Luật KHỚP (màn tự kiểm bằng `kiemTraKhop`, lệch thì vẫn hiện số của bảng theo lớp / ô nhiệt nhưng ghi nhận)
- Σ `theoLop[].soCau` = `nhip.soCau` = phần tử cuối `tia60.cau`; Σ `soCauDung` = `nhip.soCauDung`.
- số `nhiet[]` có `soCau > 0` = `nhip.soEmHoc` = Σ `theoLop[].daHoc` = cuối `tia60.hs`; `nhiet.length` = `tongEm` = Σ `theoLop[].siSo`.
- "Chưa học hôm nay" = `tongEm − soEmHoc` (màn tự tính; khớp `chuaHocHomNay`).

## Nến 5 phút — định nghĩa (để hai bên cùng hiểu "giá")
Gọi A(t) = % câu ĐÚNG trong các câu có kết quả (`ket_qua IS NOT NULL`) có `luc ∈ (t − 5 phút, t]` (trượt 5 phút). Khung [T, T+5 phút): `mo` = A(T) (trước khung nếu không có câu = `dong` khung trước; đầu ngày = A tại câu đầu), `dong` = A(min(bây giờ, T+5 phút)), `cao/thap` = max/min của A tại mọi thời điểm có câu trong khung (kể cả `mo`, `dong`), `soCau` = số câu KHÁC NHAU… (đếm sự kiện có kết quả) trong khung. Khung yên (không câu) ⇒ nến phẳng ở giá trước, `soCau 0`. Chưa có câu nào ⇒ `nen: []` (màn ẩn khối nến). Chú giải màn ghi "tỉ lệ đúng trong 5 phút" (khác ô "Tỉ lệ đúng" cả ngày).

## Tên
`nhiet[].hoTen`, `danDau[].hoTen`: tên THẬT (lệnh của thầy, có cổng mật khẩu). `suKienMoi.chu`: tên gọi ngắn hoặc tên lớp/dạng (tên dạng, không mã). Tên bài tập về nhà ở `baiTap[].ten` = TÊN CHUYÊN ĐỀ + lớp (`tenHienThi` từ kho đề), không mã kỹ thuật.

## Chi phí (Boss dặn): báo ước lượng dòng đọc/ngày khi xin soát
Gom nến/tia/lớp từ `su_kien_hoc` bằng truy vấn có index `ngay_vn`/`luc` (từ mốc), ≤ vài nghìn dòng mỗi lần tính; đệm 10 giây.
