# Bố cục màn làm chặng khổ rộng kiểu Duolingo (bản vẽ 07/11, chờ thầy duyệt)

Thầy 07/11: «chỉnh bố cục xoay ngang máy tính và fold giống như thế này, cân đối lại bố cục làm bài vẽ trước cho tôi duyệt nhé» (ảnh Duolingo «Chọn nghĩa đúng»).

| Ảnh | Nội dung |
|---|---|
| `01-may-tinh.jpg` | Máy tính 1280×800: trước (hai cột) · sau (một cột giữa) |
| `02-fold.jpg` | Máy gập mở 884×1104 và 1104×884 |
| `03-may-tinh-bang.jpg` | Máy tính bảng 1180×820, máy tính 1440×900 |
| `04-dien-thoai-ngang.jpg` | Điện thoại ngang 740×360: hai cột (đang dùng) và một cột (thử) |
| `05-chon-va-ket-qua.jpg` | Đã chọn phương án · dải kết quả đúng — sáng và tối |
| `06-toi.jpg` | Chế độ tối: máy tính, Fold |

CSS bản vẽ: `proto-bo-cuc.css` (chép từ scratchpad, chèn sau mọi tờ). Ảnh chụp trên bản build hiện hành, nên chế độ tối còn nền tím cũ.

## 1. Mục tiêu
Màn làm câu trên máy tính, Fold và máy tính bảng gọn, cân đối như Duolingo. Mắt em đi một đường thẳng từ trên xuống: lệnh, đề, phương án, nút. Không phải liếc qua lại hai cột.

## 2. Bố cục (máy tính, Fold, máy tính bảng — cao > 500)
- **Hàng trên:** nút × bên trái, thanh tiến độ kéo dài, nguyên tử bên phải. Cả hàng rộng tối đa 1080 px, đặt giữa.
- **Thân:** một cột giữa rộng tối đa 660 px, căn giữa theo chiều dọc.
  - Nhãn và lệnh (28 px, đậm), bóng đèn «Trợ giúp» bên phải.
  - Giám thị và bong bóng đề.
  - Phương án xếp dọc, kín bề rộng cột.
- **Dải đáy cố định:** full màn, vạch mảnh `--tr-vien` ở trên. «Kiểm tra» rộng 240 px nằm bên phải, thẳng mép phải với hàng trên.
- **Kết quả:** dải đáy đổi thành dải tô màu đúng / sai full màn. Chữ (kết luận, đáp án, lời chốt) bên trái; «Hỏi thầy» và «Tiếp tục» bên phải.
- **Lời càu nhàu của giám thị:** không còn giữ sẵn một hàng trống. Khi giám thị nói, lời hiện đúng chỗ nhãn và lệnh trong vài giây, nên đề nằm sát lệnh.
- **Điện thoại ngang (cao ≤ 500):** nên GIỮ hai cột như cũ. Bản một cột chỉ thấy một phương án, phải cuộn (ảnh 04).

## 3. Trạng thái
Chưa chọn, đã chọn, kết quả đúng, kết quả sai, sáng và tối. Đề dài thì cả cột cuộn, dải đáy đứng yên. Thân có chừa chỗ bằng dải đáy, khi hiện kết quả thì chừa 46 % chiều cao màn.

## 4. Dữ liệu
Không đổi. Chỉ sửa CSS, không đụng máy chủ.

## 5. Ngoại lệ
- Đề hoặc phương án dài: cuộn cả trang, dải đáy luôn thấy.
- Lời giải dài trong dải kết quả: dải cao tối đa 46 % màn và cuộn bên trong.
- Bên trái dải đáy đang trống, vì app không có nút «Bỏ qua». Nếu thầy muốn có thể đặt nút «Trợ giúp» ở đó, nhưng việc này cần sửa thêm mã giao diện ngoài CSS.

## 6. Chi phí máy chủ
Bằng 0.

## 7. Nghiệm thu
- Các cổng đạt: `kiem:toc-do`, `kiem:co-tep` (`trong-chang-ngang.css` cần thay luật hai cột bằng luật một cột, không cộng thêm), `kiem:mau-giu`, `check:mau`.
- Chụp lại 6 khổ, cả sáng và tối.
- Các test bố cục khổ rộng (`tests/*chang-ngang*`, `bo-cuc-lam`) cập nhật theo bố cục một cột.
