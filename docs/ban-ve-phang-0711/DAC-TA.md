# Bản thử «PHẲNG kiểu Apple» cho app học sinh (07/11, chờ thầy duyệt)

Thầy 07/11: «tôi muốn giao diện app hs phẳng giống apple, bạn thử vẽ siêu đẹp tôi xem có ok hông».

## 1. Việc
Đổi phong cách app học sinh từ kính lóng lánh sang **phẳng kiểu iOS**. Bố cục, chữ và màu từng lớp giữ nguyên.

## 2. Màn áp dụng
Mọi màn app HS:
- Hôm nay, Việc hôm nay, tấm Thêm, thanh chuyển màn.
- Màn làm câu: điện thoại, máy tính, xoay ngang.
- Dải kết quả, bong bóng Mol, bong bóng giám thị.

## 3. Cách vẽ
| Phần | Cách vẽ |
|---|---|
| Nền trang | Xám nhóm `--tr-mat-2` (tối: `--tr-nen`). Bỏ dải loang màu. |
| Thẻ | Đặc `--tr-mat`, không viền, không bóng, bo 20. |
| Việc hôm nay, tấm Thêm | Danh sách nhóm iOS: hàng phẳng, vạch mảnh thụt lề dưới chữ. Hàng đang làm tô nhạt `--tr-hs-nhat`, bỏ vòng viền. |
| Tấm Thêm | Nền tấm xám, các nhóm bên trong là thẻ trắng, giống màn Cài đặt iOS. |
| Nút chính | Đặc, phẳng, giữ màu riêng từng nút (chàm / hồng / lục). Không vệt sáng, không gờ. |
| Nút phụ, chip | Tô xám nhạt `--tr-mat-2`, không viền. |
| Ô đáp án | Thẻ đặc. Khi chọn: tô nhạt chàm + vòng 2 px, ô chữ cái thành tròn đặc chàm. Đúng / sai: tô nhạt lục / hồng + vòng 2 px. |
| Đúng / Sai | Điều khiển phân đoạn kiểu iOS. |
| Thanh tiến độ | Phẳng: rãnh `--tr-mat-3`, phần đầy `--tr-hs-nut`, bỏ vệt sáng. |
| Thanh trên | Phẳng, cùng màu nền. |
| Bong bóng Mol | Kiểu iMessage: mặt đặc màu cảm xúc, không viền, mũi liền. |
| Đề chữ L quanh giám thị | Thẻ đặc chữ nhật, bỏ nét viền khuyết. |
| Thanh chuyển màn | Viên đặc phẳng, bóng rất nhẹ. Mục đang chọn tô nhạt, không vòng. |

## 4. Màu
Chỉ dùng biến có sẵn (`--tr-*`, `--bb-*`, `--gt-*`), không thêm màu mới.

## 5. Tốc độ
Nhẹ hơn bản kính: bỏ chồng nhiều lớp gradient và bóng, không làm mờ phía sau.

## 6. Ảnh
| Ảnh | Nội dung |
|---|---|
| `01-hom-nay` | Hôm nay |
| `02-viec-hom-nay` | Việc hôm nay |
| `03-lam-cau` | Màn làm câu |
| `04-ket-qua` | Dải kết quả |
| `05-them` | Tấm Thêm |
| `06`–`09` | Máy tính: Hôm nay và làm câu, sáng / tối |
| `10`, `11` | Xoay ngang |

Ảnh `01`–`05` có 4 cột: trước / phẳng × sáng / tối, khổ 360. Ảnh `06`–`11` có 2 cột: trước / phẳng.

## 7. Nghiệm thu khi build
- Thầy duyệt ảnh.
- Gỡ phần kính trong `kinh-toan-hs.css`, `kinh-lanh-hs.css` và `trong-lam-bai.css`, thay bằng luật phẳng (bản thử: `proto-phang.css`).
- Các cổng đạt: `kiem:co-tep`, `kiem:mau-giu`, `check:mau`, `kiem:toc-do`.
- Có số đo của tác tử `toc-do`.
