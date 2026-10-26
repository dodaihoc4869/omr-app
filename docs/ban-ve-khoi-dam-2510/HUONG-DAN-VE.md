# Hướng dẫn vẽ bản vẽ «Khối đậm» (25/10)

Thầy gửi ảnh trang Model Pulse và muốn vẽ lại TOÀN BỘ app thầy và app học sinh theo phong cách đó: đẹp hơn, «wow» hơn.
Đây là BẢN VẼ để thầy duyệt, không phải mã app. Mỗi màn là MỘT tệp HTML tĩnh trong thư mục này.

## Bộ khung có sẵn (BẮT BUỘC dùng, không tự chế lại)

- `neo.css`: biến màu, phông, `.the` (thẻ viền mực + bóng khối), `.chip`, `.nut` (`.dang` vàng, `.san-ho` = nút chính, `.to-hon`), `.cong-tac` (công tắc viên thuốc, `span.on`), `.danh-dau` (tô vàng chữ), `.so` (số to Fredoka), `.nhan` (nhãn chữ máy), `.len` / `.xuong`, `.moc`, `.thanh` (thanh tiến độ; `.vang` `.la`), `.o-so` (dải ô số liệu như ảnh mẫu).
- `khung.css`: khung + thành phần:
  - bố cục: `.khung`, `.chips`, `.tieu-de`, `.mo-ta`, `.pad`, `.tieu` (hàng tiêu đề thẻ), `.luoi-2`, `.luoi-2.deu`, `.luoi-3`, `.cot`, `.mt`;
  - số liệu và biểu đồ: `.o-so` / `.o-so.ba` (`.chinh-so .so`, `.so-vua`, `.so-nho`), `.bieu` + `svg.duong` (`.thap`), `.hang` / `.phai`;
  - bảng và danh sách: `table.bang`, `.cuon-ngang`, `.lop`, `.dong` (hàng danh sách), `.av`, `.dau-tick` (`.cho` `.sai` `.trong`), `.ngay` (khối lịch), `.o-nho` (3 ô số nhỏ), `.chang` (vạch chặng: `i.xong` `i.dang` `i.sai`);
  - câu hỏi: `.cau` `.de` `.so-cau`, `.lua-chon` (div > b + chữ; `.chon` `.dung` `.sai`), `.y-ds` (4 ý Đúng/Sai, `.ds span.on`), `.o-nhap` (`.trong`), `.nhan-o`;
  - trạng thái và trang trí: `.phu` + `.hop` (hộp thoại), `.rong` + `.hinh` (trạng thái rỗng), `.xuong-cho` (khung chờ tải), `.ghi-chu`, `.huy-hieu`, `.nhieu-nut`, `.nut.rong-het`, `.nut.do`, `.nut.la`;
  - chip màu: `.chip.vang/.la/.do/.san-ho/.nho`;
  - ẩn theo khổ: `.an-hep` (ẩn ≤ 900px), `.an-dt` (ẩn ≤ 520px).
- `khung.js`: tự dựng đầu trang, thanh bên (app thầy), thanh dưới và nút A.I (app học sinh). Hàm biểu đồ: `veDuong(id, mangSo, {max, buoc, moc, nhanCuoi, dinhDang, mau})` và `veCot(id, [[nhãn, số, màu?]], {max, donVi})`.
- MẪU CHUẨN, đọc trước khi vẽ: `hs-hom-nay.html`, `gv-hom-nay.html`.

## Khung một màn

```html
<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>HS · Tên màn</title><link rel="stylesheet" href="neo.css"><link rel="stylesheet" href="khung.css">
<style>/* chỉ thêm khi thật cần, dùng biến màu var(--…) */</style></head>
<body data-app="hs" data-tab="on-sua">            <!-- màn chính của một thẻ -->
<!-- màn con: data-khung="man-con" data-tieu="Tên màn" data-phu="dòng phụ" data-ve="Ôn & sửa" -->
<!-- màn toàn màn hình (đăng nhập, làm bài thi): data-khung="khong" rồi tự vẽ đầu màn -->
<main class="khung"> … </main>
<script src="khung.js"></script>
</body></html>
```

`data-tab`:
- app học sinh: `hom-nay`, `hanh-trinh`, `on-sua`, `ket-qua`;
- app thầy: `hom-nay`, `hanh-trinh`, `ca-kiem-tra`, `hoc-sinh`, `kho-de`, `giao-bai`, `giao-tuan`, `goi-bang`, `hs-hoi`, `go-nut`, `cai-dat`.

Với app thầy, `data-nut-dau='<span class="nut">…</span>'` đặt nút hành động ở đầu trang.

## Luật

1. Tên tệp: `hs-<man>.html` / `gv-<man>.html`, kebab không dấu.
2. Chữ trên màn GIỮ ĐÚNG nhãn tiếng Việt của app thật (theo kiểm kê nội dung). Không thêm tính năng mới. Chỗ nào làm đẹp thêm thì chỉ là cách TRÌNH BÀY (ô số to, biểu đồ, mốc, thẻ khối).
3. Số liệu giả nhưng sát thực tế và KHỚP nhau trong cùng màn (tổng = cộng các phần; % đúng với phân số). Tên học sinh giả kiểu Việt Nam. Hoá học đúng chương trình GDPT 2018, tên chất IUPAC như SGK mới (sodium chloride, nitric acid…).
4. Mỗi màn có điểm «wow» như ảnh mẫu: một dải `.o-so` số to hoặc biểu đồ có mốc, tô vàng `.danh-dau` một cụm chữ khoá, nút chính san hô. Không nhồi: màn làm bài thi phải sạch, tập trung vào câu hỏi.
5. Màu: CHỈ dùng biến `var(--…)` trong neo.css. Không viết mã màu mới (ngoại lệ: nền avatar).
6. Không emoji trong nội dung (ký hiệu đơn giản như ✓ ! → ← ＋ ⌕ được).
7. Đích bấm ≥ 44 px. Ở 390 px không tràn ngang: bảng rộng bọc trong `.cuon-ngang`, cột phụ gắn `.an-hep`.
8. Chụp và tự kiểm: `node chup.cjs <tên-tệp-không-đuôi> …` ⇒ ảnh vào `anh/`, in «lỗi · tràn · chip/nút < 34px». Yêu cầu: lỗi 0, tràn 0px. Mở ít nhất ảnh `-doc-sang` và `-may-tinh-toi` để soát bằng mắt (chữ đè nhau, khoảng trống lạ, đầu trang bị cắt), sửa đến khi sạch.
9. KHÔNG sửa `neo.css`, `khung.css`, `khung.js`, `chup.cjs`, hai tệp mẫu. Cần thành phần mới ⇒ viết trong `<style>` của tệp mình, bằng biến màu.
10. Không đụng repo `/home/user/omr-app` (chỉ ĐỌC mã để lấy nhãn nếu cần).
