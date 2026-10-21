# Bản vẽ Hành trình giỏi Hóa · một trang 4 bước · 21/10/2026

Thầy dặn: bỏ hai thẻ "Dạy học & đầu giờ" và "Chữa bài". Màn đi từ trên xuống theo tiến trình: 1 Điểm danh, 2 Gọi lên bảng đầu giờ, 3 Dạy học, 4 Chữa câu khó và tính toán. Làm gọn, đẹp, khoa học, vẽ cho thầy duyệt trước khi build.

Thầy bổ sung (21/10): nút "Bổ sung bài hôm nay" thành hộp riêng, mở ngay tại chỗ (khung 4).

Thầy bổ sung (21/10): bước 1 là điểm danh, các bước sau đều lấy danh sách có mặt ở bước 1. Bước 2, 3, 4 chọn độc lập theo chức năng. Bản vẽ thể hiện ý này ở ba chỗ: vạch tách trên thước tiến trình, nút "Mở" trên mọi bước chưa làm, và khung 3 (thầy sang thẳng bước 4 khi bước 3 chưa làm).

Đặc tả 7 mục và hai câu cần thầy chốt: `docs/dac-ta-hanh-trinh-1-trang-2110.md`. Chưa sửa `src/`. Số trong ảnh là số GIẢ.

Bản vẽ nằm ở `hanh-trinh.html`. Ảnh Chromium thật nằm ở `anh/`, chụp bằng `node scripts/chup-ban-ve-hanh-trinh-2110.mjs`. Mỗi khung có 3 khổ (`doc` 390 · `ngang` 844 · `may-tinh` 1440), mỗi khổ một ảnh `sang` và một ảnh `toi`. Nhãn viền đứt "Gộp / Thay / Giữ" chỉ để thầy đọc bản vẽ, app không có.

| Khung | Tệp ảnh bắt đầu bằng | Lúc nào |
|---|---|---|
| 1 | `01-diem-danh-` | Đầu buổi: bước 1 đang mở (mã, QR, có mặt 18/24, nhóm Chăm/Lười, em vắng). Bước 2, 3, 4 mỗi bước một nút "Mở". |
| 2 | `02-day-hoc-` | Giữa buổi: bước 1 và 2 đã thu thành dòng tóm tắt. Bước 3 Dạy học mở: chiếu câu, gọi em, Bài đang giao. Đã bỏ phần Tick bài vừa dạy (thầy chốt 21/10: chọn bài chỉ ở hộp Bổ sung bài, khung 4). |
| 3 | `03-chua-cau-` | Thầy sang thẳng bước 4 khi bước 3 chưa làm. Bước 4 mở với hai khối: Câu khó & tính toán, và Câu học sinh cần chữa. |
| 4 | `04-bo-sung-` | Màn Hôm nay: bấm "Bổ sung bài hôm nay" thì hộp mở ngay tại chỗ (chọn lớp → chọn bài vừa dạy → xác nhận → Giao). Không sang Hành trình. |

Soát bằng máy, đủ 24 ảnh: 0 lỗi trang · 0 tràn ngang · 0 đích chạm nhỏ hơn 44 px. Màu chỉ dùng biến `--gvm-*` của `src/styles/tokens.css` (sáng và tối), không thêm màu mới.
