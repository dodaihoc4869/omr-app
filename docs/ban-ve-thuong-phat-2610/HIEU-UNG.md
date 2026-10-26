# Danh mục hiệu ứng — học mọi hiệu ứng Duolingo, bản Hoá học «hơn Duolingo» (thầy 26/10)

Thầy 26/10: «Hiệu ứng phải hấp dẫn hoặc hơn doligo nhé. Học tập mọi hiệu ứng của dolingo».

## Luật kỹ thuật chung
- Chỉ animate transform và opacity. Không đổi bố cục, không làm tràn trang (kể cả giữa chuyển động).
- Không dùng thư viện (không Lottie, không canvas-confetti). Dùng CSS keyframes và Web Animations API; đếm số dùng requestAnimationFrame.
- Mỗi hiệu ứng tối đa khoảng 40 hạt. Xong thì gỡ phần tử.
- prefers-reduced-motion: bỏ chuyển động, giữ đổi màu và số cuối.
- Mọi hiệu ứng đi kèm rung (rung.ts) và âm (am-thanh.ts) cùng nhịp. Gọi chung một hàm phanHoi(kieu).
- Không chặn bấm: bấm Tiếp tục giữa hiệu ứng thì nhảy tới trạng thái cuối.
- CSS và mã hiệu ứng nằm trong mảnh nạp lười, không vào nhóm mở app.

## A. Trong lúc làm câu
| # | Duolingo | Bản của mình | Thời lượng |
|---|---|---|---|
| A1 | Nút 3D ấn lún | Như Duolingo: viền đáy dày, ấn thì lún 4 px | 80 ms |
| A2 | Chọn phương án: viền xanh dương, nảy nhẹ | Như Duolingo, nảy scale 0,97 → 1 | 120 ms |
| A3 | Câu mới trượt vào | Câu cũ trượt trái và mờ dần, câu mới trượt từ phải vào | 180 ms |
| A4 | Đúng: tấm xanh trượt lên, âm ting | Tấm trượt lên, dấu tick tự vẽ nét. **Hơn Duolingo:** 6–8 hạt lục giác bung ra từ ô đúng, Bi nảy | 220 / 300 / 450 ms |
| A5 | Sai: tấm đỏ, ô lắc | Ô lắc ±6 px ba nhịp, tấm đỏ trượt lên, Bi lo lắng lắc đầu | 320 ms |
| A6 | Combo «3 câu đúng liền!» trượt từ trên xuống | **Phản ứng dây chuyền:** băng nhỏ trượt xuống. Một phân tử mọc thêm một nguyên tử nối liên kết sau mỗi câu đúng liền (3 → 5 → 10). Từ 5 câu nhãn đổi «Phản ứng dây chuyền!» | 600 ms |
| A7 | Thanh tiến độ đổi màu cam phát sáng khi combo | **Ống nghiệm:** thanh tiến độ là ống nghiệm, chất lỏng dâng lên, bọt nổi. Combo ≥ 3 thì chất lỏng đổi sang cam phát sáng, kèm vệt sáng lướt | 500 ms |
| A8 | +XP nổi lên | «+12 ⚛» bay lên từ tấm kết quả rồi tan | 700 ms |

## B. Kết bài
| # | Duolingo | Bản của mình | Thời lượng |
|---|---|---|---|
| B1 | Thẻ số bật lên lần lượt, XP đếm tăng | Ba thẻ (Nguyên tử · Chính xác · Thời gian) bật lên cách nhau 120 ms. Số đếm tăng từ 0 lên kết quả | 800 ms |
| B2 | Bài hoàn hảo: cúp và tia sáng xoay | **Tinh thể kết tinh:** tinh thể kim cương mọc dần từ tâm, tia sáng xoay chậm. Bi đổi vàng và nhảy | 1,2 s |
| B3 | Nhân vật nhảy múa | Bi «mung» nhảy, hoa giấy lục giác rơi | 1,2 s |
| B4 | Vòng mục tiêu ngày tô dần | Vòng tô dần. Đầy thì nổ hạt và hiện «Đạt mục tiêu!» | 600 ms |

## C. Chuỗi ngày
| # | Duolingo | Bản của mình | Thời lượng |
|---|---|---|---|
| C1 | Màn «Chuỗi N ngày!»: số lật, lửa bùng | Sau bài đầu tiên trong ngày: số cũ lật sang số mới, ngọn lửa bùng to rồi cháy đều. Ô hôm nay trên lịch tuần tô cam lan ra. Bi «lua» nhảy | 1,4 s |
| C2 | Mốc chuỗi: pháo hoa | Mốc 7 / 30 / 100: pháo hoa lục giác, huy hiệu lật 3D | 1,6 s |
| C3 | Đóng băng chuỗi: băng phủ | **Bình giữ chuỗi:** nắp bình đóng lại, hơi lạnh toả ra, ô ngày hôm đó hoá xanh băng | 900 ms |
| C4 | Sửa chuỗi | **Cứu chuỗi:** ngọn lửa nhỏ leo lét lắc lư, đồng hồ đếm ngược. Cứu xong thì lửa bùng lại | — |

## D. Phần thưởng
| # | Duolingo | Bản của mình | Thời lượng |
|---|---|---|---|
| D1 | Gem bay tới bộ đếm | Các viên tinh thể bay theo đường cong tới bộ đếm ở thanh trên. Bộ đếm nảy, số tăng, âm «lách cách» | 700 ms |
| D2 | Rương lắc rồi bật nắp | Rương lắc ba nhịp, bật nắp, tinh thể phun ra rồi bay vào bộ đếm (D1) | 1,2 s |
| D3 | Huy hiệu mới lật | Thẻ lật 3D (rotateY) lộ huy hiệu, lấp lánh | 800 ms |

## E. Giải tuần
| # | Duolingo | Bản của mình | Thời lượng |
|---|---|---|---|
| E1 | Hàng của mình trượt lên vị trí mới | Hàng của em trượt tới thứ hạng mới, các hàng khác dịch theo (kỹ thuật FLIP). Số hạng lật | 600 ms |
| E2 | Lên hạng: huy hiệu mới rơi xuống, hoa giấy | Huy hiệu kim loại mới rơi xuống và xoay lấp lánh. Hoa giấy, Bi mừng, fanfare | 1,6 s |
| E3 | Rơi hạng | Huy hiệu trượt xuống, Bi buồn. Không hoa giấy, âm trầm nhẹ | 900 ms |

## F. Lộ trình
| # | Duolingo | Bản của mình | Thời lượng |
|---|---|---|---|
| F1 | Nút hiện tại phồng thở, bong bóng «BẮT ĐẦU» nhún | Nút lục giác hiện tại phồng thở. Bong bóng «Bắt đầu» nhún phía trên | lặp 1,6 s |
| F2 | Chặng vừa xong: nút đổi màu, sao bay | Nút đổi màu, vòng lan ra, sao bay | 700 ms |
| F3 | Mở khoá chặng mới | **Khoá tinh thể vỡ** thành mảnh rồi tan | 600 ms |
| F4 | Tự cuộn tới nút hiện tại | Cuộn mượt tới nút hiện tại khi mở Lộ trình | 400 ms |

## G. Linh vật Bi
- **Đứng yên:** nhún nhẹ, bọt khí bay lên, thỉnh thoảng chớp mắt (ngẫu nhiên 3–6 s).
- **Nói:** bong bóng lời hiện chữ kiểu gõ dần.
- **Đổi cảm xúc:** dung dịch đổi màu dần, như chất chỉ thị đổi màu (400 ms).

## H. Phạt (vẫn vui, không doạ)
- **H1 Thăng hoa:** các viên tinh thể mờ dần, bốc lên thành hơi rồi tan. Bộ đếm giảm. Bi «ngu» thức dậy rồi buồn (1,4 s).
- **H2 Thử thách Kim cương:** ống nghiệm vỡ: nứt, mảnh rơi, chất lỏng tràn (500 ms). Vỡ ống thứ 3 thì màn trượt.
- **H3 Câu không được tính:** tấm xám trung tính trượt lên. Phân tử combo rã ra từng nguyên tử rồi rơi (500 ms).
- **H4 Cược thua:** đồng xu tinh thể nứt đôi (700 ms).

## Âm thanh bổ sung (cùng bộ tổng hợp am-thanh.ts)
- `combo`: chuông đi lên một nốt mỗi bậc combo.
- `tinhThe`: lách cách cao.
- `ruong`: bật nắp kèm lấp lánh.
- `lenHang`: fanfare 4 nốt.
- `roiHang`: hai nốt trầm.
- `chuoi`: «phừng» lửa (tiếng ồn lọc, lướt lên) kèm chuông.
- `vo`: ống nghiệm vỡ (tiếng ồn ngắn kèm leng keng).
- `thangHoa`: xì hơi (tiếng ồn lọc, lướt xuống).
