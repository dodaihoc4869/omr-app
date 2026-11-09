# Bảng Bình Phản Ứng: bỏ đề, thay bằng đua top

Ngày 09/11/2026. Đây là bản vẽ chờ thầy duyệt, chưa sửa mã sản phẩm. Ảnh chụp bằng Chromium từ `ban-ve.html` với dữ liệu giả: lớp 16 em, chia 4 đội. Có hai phương án, A và B.

Thầy dặn ngày 09/11: «bảng hiện đề không hiện đề nữa mà hiện gì đó ý nghĩa thúc đẩy động lực cho học sinh… kiểu đua tốp… thẻ tên của học sinh nhỏ ở góc dưới làm lại hết vì đề đã hiện trên máy học sinh rồi; khi bấm lên bảng thì có đủ đề ở màn chiếu cũ rồi.»

| | Đang làm câu | Đã mở đáp án |
|---|---|---|
| **A · Tháp lửa** | `A-dang-lam-1920.jpg` · `A-dang-lam-1366.jpg` | `A-mo-dap-an-1920.jpg` · `A-mo-dap-an-1366.jpg` |
| **B · Đường đua** | `B-dang-lam-1920.jpg` · `B-dang-lam-1366.jpg` | `B-mo-dap-an-1920.jpg` · `B-mo-dap-an-1366.jpg` |

Mở trực tiếp: `ban-ve.html#A-lam`, `#A-mo`, `#B-lam`, `#B-mo`. Chụp lại: `node docs/ban-ve-bpu-dua-top-0911/chup.cjs`.

## 1. Mục tiêu

- Màn chiếu không còn đề. Đề đã có trên máy từng em, và khi thầy gọi lên bảng thì tờ chiếu cũ vẫn hiện đủ đề.
- Mỗi màn có **một điểm nhìn chính**: các đội đua nhau bằng kJ. Bảng xếp hạng em đứng thứ hai.
- Trong lúc làm, mỗi lần một em gửi bài thì cả lớp thấy ngay: tên em bay vào đội, số «x/y em đã gửi» tăng lên.
- Khi mở đáp án, màn cho thấy đội nào vừa bứt lên và ai đúng nhanh nhất.
- **Tế nhị trước lớp: bảng chỉ tôn vinh.** Không nêu tên em sai, em chưa biết làm hay em tụt hạng (chi tiết ở mục 5).
- Màu nền giữ tối dịu như bảng hiện tại. Chữ đủ to để đọc từ cuối lớp: ở khổ 1366, tên em vẫn khoảng 20 px trở lên.

## 2. Bố cục (sân khấu 1920×1080, co theo màn như hiện tại)

**Thanh trên giữ như hiện tại:** «Lượt 3» · loại câu · lớp và mã · đồng hồ · `? Phím` · nút chính «Lên bảng L» (khi đã mở đáp án thì là «Câu tiếp →»). Khi đã mở đáp án, thanh trên có thêm thẻ kết quả lên bảng: «Lên bảng: Khánh Linh · Đạt · Đội Canxi +200».

### A · Tháp lửa

| Vùng | Đang làm | Đã mở đáp án |
|---|---|---|
| **Giữa trái** (1210×710): 4 ống nghiệm, mỗi đội một ống | Ống chứa chất lỏng màu đội, cao theo kJ của đội, ngọn lửa thử màu cháy trên mặt chất lỏng. Đội dẫn đầu: ống viền sáng, quầng màu đội, ngọn lửa to hơn. Dưới ống là kí hiệu và tên đội, **số kJ to (64 px)**, rồi «Dẫn đầu» hoặc «kém hạng trên 120 kJ». | Chất lỏng dâng lên. Vạch nét đứt kèm nhãn «trước 1.720» đánh dấu mức cũ. Dưới số kJ có ô trắng «+687 kJ lượt này». Đội vừa vượt lên đầu có nhãn **«Bứt lên dẫn đầu»** trên ngọn lửa, kèm vài ngôi sao. |
| **Cột phải** (590 px) | Bộ đếm **«11/16 em đã gửi»** (số 96 px) và thanh 16 ô. Dưới là **Bảng vàng kJ** (6 em nhiều kJ nhất cả buổi): huy hiệu 1-2-3, kí hiệu đội, số kJ, «▲2» khi em lên hạng so với lượt trước. Cuối cột là thẻ **«Chuỗi đúng dài nhất»**. | Thẻ **Đáp án B · 12/16 em đúng**, băng vàng «Vượt năng lượng hoạt hoá · cả lớp +30 kJ» (chỉ khi đạt). Thẻ viền vàng **«Nhanh và đúng nhất»** có 3 em, mỗi em kèm «+180 kJ». Bảng vàng kJ còn 4 em. |
| **Dải tên** (đáy, cao 206 px) | Bốn nhóm theo đội, mỗi nhóm có viền trên màu đội, dòng đầu «Natri · 3/4 đã gửi», tên em xếp 2 cột. Ba trạng thái tên em ở mục 4. | Giữ nguyên. Ba em nhanh nhất có huy hiệu 1, 2, 3 thay cho dấu ✓. |

### B · Đường đua

| Vùng | Đang làm | Đã mở đáp án |
|---|---|---|
| **Trên** (1840×400): 4 làn đua ngang | Đầu làn có kí hiệu đội và «3/4 đã gửi», thêm chấm cho từng em (không có tên). Ngọn lửa của đội chạy trên ray, kéo theo vệt màu đội, ngay sau là **số kJ (40 px)**. Cuối làn ghi «Dẫn đầu», hoặc «Hạng 2 · kém 120 kJ». | Vòng nét đứt đánh dấu chỗ đứng cũ, ngọn lửa đã chạy lên. Cạnh số kJ có ô trắng «+687». Làn vượt lên đầu ghi «Bứt lên dẫn đầu». Một dòng chú giải nói rõ vòng nét đứt và ô trắng nghĩa là gì. |
| **Giữa** (cao 290 px): 3 khối | Trái: vòng tròn **11/16** với dòng «em đã gửi · còn 5 em đang làm». Giữa: **bục vinh quang** cho hạng 1-2-3 kJ cả buổi. Phải: «Hạng 4–8». | Trái: **Đáp án B · 12/16 em trả lời đúng** và băng năng lượng hoạt hoá. Giữa: bục **«Nhanh và đúng nhất»** có 3 em, mỗi em kèm «+kJ». Phải: Bảng vàng kJ có 5 em, kèm «▲». |
| **Dải tên** (2 hàng) | Mỗi hàng 2 đội. Đầu mỗi đội là ô kí hiệu «Na 3/4», sau đó là 4 thẻ tên cao 84 px, chữ 30 px. | Như bên A. |

## 3. Chuyển động dự kiến (chỉ dùng transform và opacity)

| Lúc | Chuyển động |
|---|---|
| Một em vừa gửi | Thẻ tên ở dải đáy bừng sáng: lớp viền sáng đổi opacity, nền đổi sang «đã gửi». Một thẻ tên nổi lên từ chỗ em đó và bay theo đường cong. Bên A, thẻ bay vào miệng ống của đội. Bên B, thẻ bay lên làn đội rồi trượt vào ngọn lửa. Cả quãng bay khoảng 700 ms, dùng `translate` và `scale` từ 1 xuống 0,6, opacity từ 1 về 0. Đây là ngoại lệ có chủ ý cho màn trình diễn, giống chuỗi mở đáp án. Ngọn lửa đội nhún một nhịp (`scale` 1 → 1,15 → 1). Bộ đếm «x/y» nảy số (`scale`). |
| Nhiều em gửi cùng lúc | Xếp hàng chờ. Tối đa 3 thẻ bay cùng lúc, mỗi thẻ cách nhau 120 ms. Hàng chờ dài hơn thì chỉ bật sáng thẻ tên ở dải đáy, không cho bay. |
| Ngọn lửa | Ngọn lửa luôn phập phồng nhẹ: hiệu ứng `bb-lua` đang có, chỉ dùng `scaleY`. |
| Mở đáp án | Đáp án hiện ra trong 0–0,3 s (opacity, `scale`). Từ 0,4 đến 1,4 s, chất lỏng dâng lên (A) hoặc ngọn lửa chạy tới chỗ mới (B). Chất lỏng là một khối cao bằng cả ống, nằm trong ống `overflow:hidden` và trượt lên bằng `translateY`. Không dùng `scaleY`, vì nó bóp méo đáy tròn và bọt khí. Ngọn lửa đi theo bằng `translateY`/`translateX`. Số kJ cũ mờ dần và số mới hiện lên (hai lớp chữ đổi opacity), không đếm từng bước. Lúc 1,5 s, nhãn «Bứt lên dẫn đầu» nảy ra (`scale` 0,6 → 1), quầng sáng chuyển từ đội cũ sang đội mới (opacity). Sau đó ba em nhanh nhất lần lượt trượt vào, cách nhau 150 ms. Các hàng của Bảng vàng đổi chỗ bằng FLIP (`translateY`). |
| Máy yếu / giảm chuyển động | Không bay, không dâng: hiện ngay trạng thái cuối, theo cùng luật `html.may-yeu` và `prefers-reduced-motion` mà bảng đang dùng. |

Màn này là màn trình diễn trên máy chiếu. Có hai ngoại lệ so với luật «≤ 300 ms»: chuỗi mở đáp án dài khoảng 1,6 s (bảng hiện tại cũng đang trễ 1,8 s) và quãng bay tên 700 ms. Các phản hồi còn lại, như bừng sáng, nảy số hay nhún lửa, đều giữ ở mức 300 ms trở xuống.

## 4. Thẻ tên em ở dải đáy

Trạng thái thể hiện bằng **hình và chữ**, không chỉ bằng màu, vì màu đội trùng với màu trạng thái: Đồng xanh lục gần màu «đúng», Canxi đỏ gần màu «rời màn», Natri cam gần màu huy chương vàng.

| Trạng thái | Cách vẽ |
|---|---|
| Chưa gửi | Nền trong suốt, viền mảnh, chữ mờ 58 %, vạch màu đội bên trái nhạt. |
| Đã gửi | Nền pha 20 % màu đội, chữ sáng đậm, **dấu ✓ trên đĩa giấy** ở góc phải. |
| Vừa gửi | Thêm viền giấy và quầng màu đội trong khoảng 1 s. |
| Đang rời màn | Viền đỏ 3 px, **nhãn chữ «Rời màn»** ở mép trên. Lớp phủ báo cháy toàn màn hiện có vẫn giữ nguyên. |
| Mở đáp án | Ai đã gửi đều giữ y như nhau, không ai bị làm mờ. Chỉ ba em nhanh và đúng nhất có huy hiệu số 1, 2, 3. |

## 5. Tế nhị trước lớp

- Không có màu hay dấu «sai» trên tên em nào. Ai đã gửi thì trông như nhau, kể cả em bấm «Em chưa biết làm».
- Không có «+kJ» riêng cho từng em trên dải tên hay trên Bảng vàng. Nếu có, cả lớp sẽ tự suy ra em nào sai, vì em đó thiếu ô cộng, và em nào bấm chưa biết làm, vì em đó chỉ được +20. Chỉ ba em nhanh nhất có «+kJ», vì đó là tôn vinh.
- Mức tăng kJ chỉ tính theo **đội**.
- Mũi tên chỉ có **▲ lên hạng**, không có mũi tên xuống.
- **Chuỗi đúng** chỉ nằm trong một thẻ tôn vinh, «Chuỗi đúng dài nhất», và chỉ hiện lúc đang làm. Nó không gắn vào từng dòng Bảng vàng, nên khi mở đáp án không ai bị «mất chuỗi» trước lớp.
- Em nào chưa gửi vẫn hiện như lúc đang làm. Đây không phải thông tin mới với lớp.

## 6. Dữ liệu lấy từ đâu trong `viewBang` (src/lib/bpu/phong.ts)

| Trên màn | Nguồn |
|---|---|
| kJ đội | `ds[].kj` của em trong đội cộng `doiThuong[d]`. Hàm `diemDoi` đã có trong BangBinhPhanUng. |
| «+kJ lượt này», vạch / vòng «trước» | Bảng chụp lại kJ từng đội ở **mỗi** view có pha khác `mo`, và dùng ảnh chụp cuối cùng trước khi sang `mo`. Phải chụp liên tục vì kJ vẫn đổi trong lúc làm: em đến muộn được `KJ.vaoLop` vào `doiThuong`, đội đủ quân đầu tiên được `KJ.duQuanDau`. Khi mở đáp án, `moDapAn` cộng kJ câu này, và +200 lên bảng Đạt vào `doiThuong`. Mức tăng = sau − trước. Nếu `soDoi` đổi giữa lượt (em thứ 13 vào thì `chiaLaiDoi` chia lại từ 2 thành 4 đội), bỏ vạch «trước» và «+kJ» đội ở lượt đó. |
| Bảng vàng kJ | `ds` lọc `vao`, xếp theo `kj` giảm dần (như `xepEm`). |
| «▲ lên hạng» | So thứ hạng ngay trước lần mở đáp án gần nhất với thứ hạng ngay sau lần đó. Mũi tên giữ nguyên qua pha `tra-loi` của lượt sau; trong lúc làm, thứ hạng chỉ đổi khi có em đến muộn. Dữ liệu lưu trong bộ nhớ trang, nên tải lại trang thì tới lần mở đáp án kế tiếp mới có mũi tên. |
| Chuỗi đúng dài nhất | Lấy `max ds[].chuoi` trong các em có mặt, chỉ khi ≥ 3. Hai em bằng nhau thì em nhiều kJ hơn đứng trước. |
| Đã gửi, «x/y em đã gửi», chấm từng đội | `luot.daGui` (đã gửi) trên số em có mặt (`ds` có `vao`). |
| Vừa gửi (tên bay) | So `daGui` của hai view liền nhau. **Không dựa vào thứ tự trong mảng `daGui`**: JS tự xếp lại khoá dạng số, và view không có giờ gửi. |
| Rời màn | `roiNay`: em đang ở ngoài app (mảng rỗng khi mở đáp án). Dải tên hiện tại dùng `luot.roiMe`, tức em đã từng rời trong lượt. Đề nghị dải mới theo `roiNay` để khớp với lớp báo cháy. |
| Đáp án, số em đúng | Chỉ có khi `pha === 'mo'`. Đáp án lấy `luot.dung`; số em đúng là số `ketQua[sbd].dung` bằng true. |
| Nhanh và đúng nhất | `ketQua[sbd].nhanh` là 1, 2, 3 (bằng null khi em sai), «+kJ» lấy `ketQua[sbd].kj`. |
| Năng lượng hoạt hoá | `luot.kich`, cộng `KJ.kichHoat` cho cả lớp. |
| Kết quả lên bảng | `luot.goi.dat`, giữ chip như hiện tại. |
| «chưa biết làm» | `luot.chuaBiet`. Giữ dòng nhỏ dưới bộ đếm như hiện tại: «trong đó x em chưa biết làm», chỉ có số, không có tên. |

Không cần thêm trường nào cho máy chủ.

## 7. A khác B ở đâu

| | A · Tháp lửa | B · Đường đua |
|---|---|---|
| Hình ảnh chính | Ống nghiệm và ngọn lửa thử màu, đúng chất phòng thí nghiệm, ngọn lửa «cao dần». | Bốn làn đua ngang, cảm giác «đua» rõ hơn và dễ thấy khoảng cách giữa các đội. |
| Bảng xếp hạng | Một cột bên phải, 6 dòng chữ 31 px, đọc liền một mạch. | Bục hạng 1-2-3 và danh sách hạng 4–8. Nổi hơn nhưng chia thành 3 khối. |
| Độ rối | Ít: 3 vùng (tháp, cột phải, dải tên). | Nhiều hơn: 4 vùng, và khối giữa có 3 thẻ. |
| Dải tên | Bốn nhóm đội, 2 cột. Lớp đông (khoảng 35 em, 9 em mỗi đội) thì chuyển sang 3 cột × 3 hàng, chữ 24 px. | Hai hàng, mỗi hàng 2 đội. Lớp đông thì thẻ hẹp lại khoảng 95 px, nên phải lên 4 hàng hoặc thu chữ. |
| Hai đội (từ 12 em trở xuống) | Hai ống to, rộng khoảng 360 px. Dễ. | Hai làn cao. Dễ. |

## 8. Khuyến nghị

Nên chọn **A · Tháp lửa**, vì bốn lẽ:

- Có một điểm nhìn chính rõ ràng.
- Đúng hình ảnh môn Hoá: ống nghiệm và ngọn lửa thử màu, như logo Bình Phản Ứng.
- Bảng vàng gọn trong một cột.
- Dải tên vẫn chạy tốt khi lớp đông.

Nếu thầy thích cảm giác đua ngang của B, có thể mượn **vòng nét đứt «chỗ đứng trước»** của B lắp vào A, thay cho vạch «trước».

## 9. Thầy cần quyết

1. **Phím G (lời giải), M (phương án), O (mở đáp án ngay).** Bảng mới không còn chỗ đề, nên đề nghị bấm G hoặc M thì một tấm giấy hiện đè lên vùng tháp (A) hoặc làn (B), như lời giải thu gọn hiện nay. Bấm lại thì quay về màn đua. Lên bảng (L / Space) vẫn chuyển sang tờ chiếu cũ có đủ đề.
2. **Màn «Đua ngọn lửa» cũ (phím, màn `dua`) và màn Vinh danh.** Màn mới đã có đua đội và Bảng vàng. Đề nghị bỏ màn `dua`, giữ Vinh danh làm màn tổng kết cuối buổi.
3. **Câu Đúng–sai, Trả lời ngắn, Tự luận khi mở đáp án.** Đề nghị như sau:
   - Đúng–sai: «Đáp án: Đ · S · Đ · S» và «x em đúng đủ 4 ý».
   - Trả lời ngắn: «Đáp số 2,24».
   - Tự luận: không có ô đáp án, chỉ có «x em đã làm xong» và mức tăng kJ của đội (thường là 0, trừ lên bảng).
4. **Em chưa vào lớp (`vao=false`).** Đề nghị không hiện trên dải tên. Số y trong «x/y» là số em có mặt, giống bảng hiện tại.
5. **Lớp đông khoảng 35 em.** Thầy xem cách xếp 3 cột × 3 hàng mỗi đội ở phương án A (mục 7) có ổn không. Nếu ổn thì khi build, Claude vẽ thêm một ảnh lớp 35 em để thầy duyệt.
