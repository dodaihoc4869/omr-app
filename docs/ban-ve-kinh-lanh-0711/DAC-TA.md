# Kính lóng lánh + thanh tiến độ kính + «Vào phòng thi» gọn (app học sinh, thầy chốt 07/11)

Thầy 07/11:
- «Nền của thanh màu xanh làm cho kính hơn nữa».
- «Ở xoay ngang và máy tính thì bỏ hẳn nền ở dưới đi».
- «Khung bài tập và đáp án làm hiệu ứng kính lóng lánh giống apple» ⇒ thầy «Chốt A ko gờ».
- «Phần nền vào phòng thi … thu gọn vào chữ bo mềm mại».

| Ảnh | Nội dung |
|---|---|
| `01`, `02` | Thanh tiến độ kính: điện thoại sáng / tối; xoay ngang và máy tính bỏ nền viên thuốc dưới thanh |
| `03`–`06` | Khung đề + ô đáp án: TRƯỚC · A (chốt) · B (bỏ) — sáng, tối, máy tính |
| `07`, `08` | «Vào phòng thi»: thanh trên thành viên thuốc kính ôm chữ |
| `09` | Ảnh soát trên bản build thật |

## Cách vẽ
- **Kính lóng lánh** (`src/styles/kinh-lanh-hs.css` cho biến `--kl-*`, luật nằm trong `trong-lam-bai.css`):
  - mặt trong 44 % (tối 58 %);
  - ánh tím → lam ngọc → hồng 15 %;
  - mép vát sáng: trên-trái trắng, dưới-phải trắng 70 %;
  - vệt sáng chéo; vòng mảnh chàm 22 %; bóng mềm.
- **Không gờ:** các trạng thái chọn, đúng, sai dùng vòng 2 px + quầng mềm cùng màu. Nút KIỂM TRA / TIẾP TỤC giữ gờ như cũ.
- **Không làm mờ phía sau** (`backdrop-filter`). Đã bỏ từ trước vì chậm khi bấm. Nền sau thẻ là dải loang mịn nên mặt trong cho cùng cảm giác.
- **Máy yếu:** không thêm gì nặng.
- **Thanh tiến độ:** rãnh trong 35 % có vòng mảnh. Phần xanh là kính màu với vệt sáng trên và đáy hơi sẫm. Khổ rộng: bỏ nền, bóng, làm mờ của viên thuốc thanh trên.
- **«Vào phòng thi»** (`src/components/m3/phong-vao-thi.css`, mảnh lười): `.m3-thanh-tren` có `width: fit-content`, bo 999 px, mặt 86 %, nút ← tròn 44 px.

## Nghiệm thu
- Các cổng đạt: `kiem:co-tep`, `kiem:mau-giu` (ngoại lệ ghi trong `docs/ban-ve-nut-net-0711/mau-doi-duyet.json`), `check:mau`, `kiem:toc-do` (đường mở mọi app bằng mốc), `kiem-sw`.
- 24 tệp test liên quan đạt.
