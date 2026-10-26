# Hướng dẫn vẽ bản vẽ «Trong» (26/10)

Thầy muốn một giao diện mới cho app học sinh (HS) và app thầy (GV): đẹp nhất, thân thiện nhất, khoa học nhất, **gọn gàng, đơn giản, tinh tế**. Bố cục từng màn cũng phải tối ưu lại.
Đây là BẢN VẼ để thầy duyệt, không phải mã app. Mỗi màn là MỘT tệp HTML tĩnh trong thư mục này.

**Bài học từ bản trước (thầy đã gỡ «Khối đậm»):** viền mực dày, bóng khối, phông đều nét và màu chói làm app nặng nề, khó đọc. Bản «Trong» đi ngược hẳn:
- nền sáng, thẻ trắng viền mảnh;
- một phông Be Vietnam Pro;
- nhiều khoảng thở;
- mỗi màn đúng một nút chính.

## 8 nguyên tắc (từ Duolingo, Khan Academy, Brilliant, Google Classroom, Apple Fitness, Linear)

1. **Biết việc tiếp theo trong 3 giây.** Mỗi màn đúng MỘT nút `.nut.chinh`. Nút đó nằm ở chỗ mắt nhìn đầu tiên. Các hành động khác dùng `.nut` thường, `.nut.nhe` hoặc `.lien-ket`.
2. **Bớt để thấy rõ.** Không trang trí thừa: không viền dày, không bóng khối, không tô nền chữ, không emoji. Tách các vùng bằng khoảng trắng và cỡ chữ, không bằng khung.
3. **Con số nào cũng dẫn tới việc làm** (màn thầy). Mỗi số đo có nhãn rõ, và nếu cần thầy làm gì thì có nút ngay cạnh, ví dụ «Việc cần thầy» ở `gv-hom-nay.html`.
4. **Tiến bộ nhìn thấy được** (màn học sinh). Dùng `.vong` (vòng mục tiêu), `.chang` (chặng), `.thanh` (thanh), chuỗi ngày `chip sao`, thang tầng kiểu Khan. Khen bằng số thật, không hô hào.
5. **Một khái niệm, một màu.**
   - Xanh lá `dung`: đúng / xong.
   - Đỏ `sai`: sai / cần sửa / Lười.
   - Hổ phách `chu-y`: cần để ý / chưa đều.
   - Chàm `tin`: kiểm tra / thông tin.
   - Vàng `sao`: thành tích / chuỗi ngày.
   - `chinh`: màu của app (HS xanh lá, GV xanh dương).
6. **Tập trung khi làm bài** (kiểu Brilliant). Màn làm câu hoặc làm bài thi phải sạch:
   - một câu là nhân vật chính, chữ đề 17px, phương án to;
   - đồng hồ và tiến độ gọn trên thanh trên;
   - không thẻ phụ, không nút A.I (`data-ai="khong"`).
7. **Đọc nhanh trên lớp** (màn thầy). Bảng gọn, số căn phải, chữ số bằng nhau (`tabular-nums` đã bật), chữ ≥ 13px. Danh sách dài thì hiện 5–8 dòng đầu và thêm «Xem đủ N …».
8. **Điện thoại là chính.** Ở 390px:
   - không tràn ngang;
   - cột phụ `.an-dt` hoặc `.an-hep` được phép ẩn;
   - bảng rộng bọc `.cuon-ngang`, hoặc chuyển thành danh sách `.ds`;
   - nút chính rộng hết thẻ nếu cần;
   - đích bấm ≥ 44px.

## Bộ khung (BẮT BUỘC dùng, KHÔNG sửa `trong.css`, `khung.js`, `chup.cjs`, hai màn mẫu)

- **Màn mẫu, đọc kỹ trước khi vẽ:** `hs-hom-nay.html` và `gv-hom-nay.html` (xem ảnh trong `anh/`).
- **`trong.css` chia làm các nhóm:**
  - Bố cục: `.khung` (`main`), `.cot`, `.hang` (`.giua`), `.day` (đẩy sang phải), `.luoi-2/3/4`, `.chinh-phu` (2 cột chính + phụ), `.mt-1…8`.
  - Chữ: `.tieu-de` (h1), `.h2`, `.h3`, `.phu`, `.mo`, `.nhan`, `.so-lon`, `.so` (kèm `<small>`), `.dam`, `.dung-mau/.sai-mau/.chu-y-mau/.chinh-mau`.
  - Thẻ: `.the` (`.dem` = không đệm, cho danh sách; `.chim` = nền chìm), `.the-dau` (hàng tiêu đề thẻ), `.lien-ket`, `.vach`.
  - Nút: `.nut` (`.chinh` `.nhe` `.trong` `.do` `.lon` `.rong-het` `.vuong`).
  - Chip, chấm, đếm: `.chip` (`.chinh/.dung/.sai/.chu-y/.tin/.sao/.vien`), `.cham` (chấm màu), `.dem-so` (số đỏ nhỏ).
  - Biểu tượng, ảnh đại diện: `.o-icon` (`.dung/.sai/.chu-y/.tin/.sao/.xam/.lon`), `.av` (`.a1…a4/.lon`).
  - Danh sách: `.ds > .dong` (`.giua` > `.ten` + `.mo`; `.phai`).
  - Tiến độ: `.thanh` (`style="--p:40%"`, `.dung/.chu-y/.sai/.tin/.manh`), `.vong` (`style="--p:40;--d:120px;--net:10px"`), `.chang > i` (`.xong/.dang/.sai`).
  - Số liệu: `.kpi`, `.dai-kpi` (`style="--n:4"`), `.delta.len/.xuong`.
  - Điều khiển: `.tab > span` (`.on`), `.o-nhap` (`.co-chu/.tap-trung`), `label.nhan-o`, `.cong-tac` (`.on`).
  - Bảng: `.cuon-ngang`, `table.bang` (`td.so-o` căn phải).
  - Câu hỏi: `.cau-de`, `.lua-chon` (div > b + chữ; `.chon/.dung/.sai`), `.y-ds` (`.noi` + `.ds-chon` span `.on-d/.on-s`).
  - Trạng thái: `.ghi-chu` (`.chu-y/.tin/.dung/.sai`), `.rong`, `.xuong`, `.phu-mo` + `.hop` (hộp thoại).
  - Ẩn theo khổ: `.an-hep` (≤ 1100px), `.an-dt` (≤ 600px).
- **Biểu tượng:** `<i data-i="ten"></i>` (thêm `class="nho"` hoặc `"to"`). Danh sách tên ở đầu `khung.js`. Không tự vẽ biểu tượng khác.
- **Biểu đồ:**
  - `veDuong(id, mangSo, { buoc, max, nhan: [...], moc: [[giá trị, 'chữ']], mau: '--tin' })` vẽ đường.
  - `veCot(id, [[nhãn, số, 'dung'|'sai'|'chu-y'|'tin'|'chinh'|'sao'|'nhat']], { soTren: true, khongTruc: true, max })` vẽ cột.
  - Đặt trên `<svg id="…" style="width:100%;height:160px;display:block">`, gọi SAU `<script src="khung.js">`.

## Khung một màn

```html
<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>HS · Tên màn</title><link rel="stylesheet" href="trong.css">
<style>/* chỉ thêm khi thật cần; chỉ dùng var(--…) của trong.css */</style></head>
<body data-app="hs" data-tab="on-sua">
<!-- màn con: data-khung="man-con" data-tieu="Tên màn" data-phu="dòng phụ" data-ve="Ôn & sửa" [data-duoi="co"] [data-nut-dau='<span class="nut">…</span>'] -->
<!-- toàn màn (đăng nhập, làm bài thi): data-khung="khong" rồi tự vẽ thanh trên gọn; thêm data-ai="khong" để bỏ nút A.I -->
<main class="khung cot" style="gap:20px"> … </main>
<script src="khung.js"></script>
</body></html>
```

`data-tab`:
- HS: `hom-nay`, `hanh-trinh`, `on-sua`, `ket-qua`.
- GV: `hom-nay`, `hanh-trinh`, `ca-kiem-tra`, `hoc-sinh`, `kho-de`, `goi-bang`, `hs-hoi`, `go-nut`, `giao-bai`, `giao-tuan`, `cai-dat`.

## Nội dung

- Bản cũ cùng tên ở `cu/<tên>.html` có đủ nội dung và số liệu mẫu. Kiểm kê nhãn thật nằm ở `KIEM-KE-HS.md` và `KIEM-KE-GV.md`.
- **Giữ đúng nhãn tiếng Việt và tính năng của app thật. Không thêm tính năng mới.**
- **Được phép (và nên) tối ưu BỐ CỤC:**
  - sắp lại thứ tự theo mức quan trọng;
  - gộp khối trùng ý;
  - đưa phần ít dùng vào `.lien-ket` «Xem thêm…»;
  - bỏ chữ thừa, rút câu dài.
- Ghi những gì đã gọn hơn bản cũ vào chú thích HTML đầu `<main>`: `<!-- GỌN HƠN: … -->`, 1–3 dòng.
- **Số liệu:** giả nhưng sát thực tế và KHỚP nhau (tổng = cộng các phần, % đúng với phân số).
- **Tên:** tên người Việt.
- **Hoá học:** đúng chương trình GDPT 2018, tên chất theo IUPAC như SGK mới (ethyl acetate, sodium hydroxide…).
- Không emoji. Không mã nội bộ trên màn học sinh.

## Chụp và tự soát

1. Chạy `node chup.cjs <tên-không-đuôi> …`.
   - Ảnh ra thư mục `anh/`: 3 khổ × sáng/tối.
   - Yêu cầu: lỗi 0, tràn 0px, đích nhỏ 0.
   - Mục «cắt chữ» chỉ là cảnh báo: chấm đỏ của chuông và thẻ có `overflow:hidden` là bình thường.
2. **MỞ ẢNH để soát bằng mắt**, ít nhất `-doc-sang` và `-may-tinh-sang`, thêm `-may-tinh-toi` cho một màn.
   - Ảnh điện thoại cao thì cắt bằng Python (PIL) phần đầu 1600px để xem.
   - Soát: chữ đè, chữ xuống dòng xấu, khoảng trống lạ, cột lệch, màn rối.
3. Sửa đến khi sạch và đạt chuẩn của hai màn mẫu.

## Luật

- Tên tệp giữ đúng tên bản cũ (`hs-…html` / `gv-…html`).
- Chỉ ghi tệp của mình trong thư mục này. KHÔNG đụng repo `/home/user/omr-app` (chỉ được đọc).
- Màu: chỉ `var(--…)` có trong `trong.css`. Không mã màu mới.
