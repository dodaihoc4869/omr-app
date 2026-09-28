# Màn làm bài — chức năng PHẢI GIỮ khi làm bố cục ngang (đọc từ `src/screens/ExamTakeScreen.tsx` 28/09)

Bản vẽ: `LamBai-Ngang.html` (cùng thư mục). Đây là bản VẼ, chưa build.

## Đang có trong màn thi (giữ nguyên hành vi, chỉ bố trí lại)
| # | Chức năng | Nơi trong mã |
|---|---|---|
| 1 | Ba phần: I trắc nghiệm A–D · II đúng–sai 4 ý a–d · III trả lời ngắn | `TheCau` (`src/components/TheCau.tsx`), dựng ở ExamTakeScreen ~3190–3270 |
| 2 | Chữ đề serif 17 px, giãn dòng 1,9; công thức/sơ đồ phản ứng qua `ChemText` (`lib/chem-format`) | TheCau |
| 3 | Hình cắt từ đề đặt đúng vị trí (sau đề, sau phương án/ý, cuối câu), bảng số liệu | `QuestionMedia` (`BangSoLieu`, `CauHinh`, `HinhTaiViTri`) |
| 4 | Xáo phương án/ý theo em — đáp án cất theo chữ cái GỐC | TheCau + `exam-assign` |
| 5 | Ô trả lời ngắn có nút "−" và "," (bàn phím số điện thoại thiếu) | `ONhapDapSo` |
| 6 | Đồng hồ đếm ngược theo giờ máy chủ; đỏ khi ≤ 5 phút (`--gap`); hết giờ tự nộp; thầy thêm phút giữa ca (chỉ kéo dài, không rút) | `ThanhTrenThiM3`, `gio-may-chu`, `them-phut` |
| 7 | Bài tập về nhà: không đồng hồ, hiện "Hạn …" | ThanhTrenThiM3 `chuThayDongHo` |
| 8 | Tiến độ "Đã làm x/y" + thanh 4 px | ThanhTrenThiM3 |
| 9 | Lưu tạm định kỳ lên máy chủ + lưu trên máy khi mất mạng; chữ trạng thái "đã lưu / đang lưu… / mất mạng — đã lưu trên máy"; gửi lại bài nộp dở | `luuTam`, `CongNhip`, `nhip-gui-lai` |
| 10 | Đánh dấu "xem lại sau" từng câu (cờ), nhớ trên máy | `KhungCauM3`, `lib/xem-lai-sau.ts` |
| 11 | Dải "câu chưa làm" + lưới số câu (bấm ⇒ cuộn tới câu) | `DaiCauChuaLamM3`, `showGrid` |
| 12 | Nộp bài hỏi lại: "Đã làm x/y", liệt kê câu chưa làm (đỏ), câu đã đánh dấu (cam), "Sau khi nộp không sửa được nữa", nút "Xem lại" (cuộn tới câu trống đầu) | `showConfirm` ~3491 |
| 13 | Ca "chỉ nộp trong phút cuối" (`chiNop3PhutCuoi`): nút nộp khoá + đếm giây | `camNopSom` ~3276 |
| 14 | Chống rời màn theo mức: lần 1 dải nhẹ, lần 2 đậm + rung, lần N khoá + tự nộp; rời quá N giây khoá ngay; thoát toàn màn hình tính là rời | `lib/chong-gian-lan.ts`, `DaiCanhBaoRoiM3`, `KhungKhoaM3` |
| 15 | Toàn màn hình (nút bật lại), chặn nút Back ("Đang làm bài, không thoát được. Nộp bài luôn?") | `batToanManHinh`, `showBackDialog` |
| 16 | "Giữ để đọc": đề chỉ hiện khi giữ tay; tấm phủ không che thanh trên | `ManGiuDeDoc`, `data-giu-de-an` |
| 17 | Vân tay bốn góc (truy ảnh chụp màn hình) | `VanTay` |
| 18 | Ghi giây làm từng câu (`giayCau`) | ExamTakeScreen |
| 19 | Phòng chờ trước giờ mở, trò chơi phòng chờ; sau nộp: kết quả, xem lại, hỏi bài | `PhongChoGame`, `KetQuaSauNop`, `TamTruotHoiBai` |
| 20 | Đáp án KHÔNG xuống máy học sinh trước khi nộp | `examContent` (bank công khai) |

## Thêm mới trong bản vẽ ngang (chờ thầy duyệt)
- Chia hai khung: ĐỀ (trái, cuộn riêng) · THANH KÉO · PHIẾU ĐÁP ÁN (phải). Kéo chuột/cảm ứng, bấm đúp về 58 %, phím ←/→ khi focus (Shift = bước 10 %), Home/End, giới hạn 35–75 %, nhớ tỉ lệ trên máy.
- Điều hướng theo phần (I · II · III) đầu khung đề; cỡ chữ đề A−/A+ (17–24 px, không bao giờ nhỏ hơn 17).
- Phiếu: lưới ô tròn A–D (Phần I), 4 ý Đ/S mỗi câu (Phần II), ô nhập ngắn (Phần III); ba trạng thái có màu + ký hiệu: chưa làm (viền), đã làm (tô), đánh dấu xem lại (cờ cam).
- Liên kết hai chiều: bấm số câu trên phiếu ⇒ đề cuộn tới; cuộn đề ⇒ phiếu tô câu đang xem.
- Cột điều khiển: đồng hồ lớn (bình thường → cam khi còn ≤ 10 phút → đỏ khi còn ≤ 5 phút), "Đã làm x/40", "Đã lưu hh:mm", nút Nộp bài.
- Phím tắt (1–4/A–D, Đ/S theo ý, N/P, M, F toàn màn hình, ? bảng gợi ý), nền dịu mắt (giấy ngà), chế độ toàn màn hình.
- Máy tính bảng ngang 1024–1180 px: cột điều khiển gộp thành dải trên đầu phiếu.
- Chọn đáp án ở CẢ HAI nơi: bấm phương án trong đề hoặc ô trên phiếu — đồng bộ tức thì.

## Cần thầy quyết
1. Giữ "Giữ để đọc" ở bố cục ngang (máy tính không có chạm giữ) — đề xuất: giữ phím Space để hiện đề.
2. Phím Đ/S cho Phần II: bấm Đ/S lần lượt điền ý a→d của câu đang xem (bản vẽ làm thế).
3. Cho chọn đáp án trong đề hay chỉ trên phiếu (bản vẽ: cả hai).
4. Ngưỡng đổi màu đồng hồ 10 phút (cam) — mới; 5 phút (đỏ) đang có.
