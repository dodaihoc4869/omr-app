# GHI CHÚ BUILD — bảng "Mọi thứ về con" kiểu Apple (bản vẽ 21/09/2026)

Tệp: `ph-d-bang-day-du.html` (đầy đủ) · `ph-e-bang-thua.html` (`#canh=thua` mặc định, `#canh=chua-hoc`) · CSS `ph-apple-bang.css` · bộ sinh `sinh-bang.mjs` (`--anh` = chụp + kiểm tràn; CHỈ xoá ảnh `ph-d-*`/`ph-e-*`). Thử tên dài + chữ to: thêm `#ten=dai&co=115`.
MỌI lớp CSS bắt đầu bằng `phm-` (bộ sinh tự kiểm, in "lớp sai tiền tố 0"). Khi build giữ tiền tố này — KHÔNG dùng `mt-` (đụng `.mt`/`.mt-tren` của `src/index.css`).

## Chỗ NÊN có chuyển động (≤ 300 ms trừ vòng; tắt sạch khi `prefers-reduced-motion`)
1. Ba vòng chạy đầy từ 0 khi thẻ anh hùng vào màn (600–800 ms, ease-out, lệch nhau 80 ms); vòng vượt mục tiêu chạy tiếp cung thứ hai rồi mới hiện bóng đầu vòng.
2. Ba con số cạnh vòng (38 · 79 % · 52) và số 7,5 của ca kiểm tra đếm lên cùng nhịp với vòng (chỉ `opacity`/`transform` + đổi chữ số; chữ số tabular nên không giật).
3. Ba dòng "Điều đáng mừng" hiện lần lượt (mờ → rõ, trượt lên 8 px, cách nhau 90 ms) — chỉ lần đầu trong ngày.
4. Dấu tích xanh của thẻ "A.I Đỗ Đại Học đã làm gì" bật lần lượt (scale 0,6 → 1); cột 14 ngày và cột giờ mọc từ chân trục.
5. Large Title co lại: tiêu đề nhỏ trên thanh hiện dần khi tiêu đề lớn trôi khỏi màn (bản vẽ đã có); câu đang mở: mũi tên xoay 180°, khối phương án mở bằng chiều cao.

## TRƯỜNG máy chủ cần trả THÊM so với `server/src/ph-tat-ca-ve-con.ts` hiện có
(Tệp hiện KHÔNG có `export interface`; hình dạng trả về dựng bằng các khoá `ra.*`: `homNay{tongQuan,dongThoiGian,cau}`, `caGanNhat`, `nhipHoc`, `tienBo`, `bacTheoDang`, `dangVap`, `vuaLenBac`, `manhYeu`, `baiTapVeNha`, `lichOn`, `phuHuynhLamGi`, `loiBoNao`, `giaoThem`, `doCham`, `no`.)
- `homNay.tongQuan.mucTieu { soCau, phutHoc }` — mục tiêu ngày để vẽ vòng 1 và 3 (hiện chỉ có `datNhiemVu` đúng/sai; `toiThieuCau` nằm trong kế hoạch ngày, chưa trả ra). Thiếu ⇒ ẩn vòng, chỉ hiện số.
- `homNay.tongQuan.soLanHoc`, `lanDaiNhatPhut` — đếm được từ `dongThoiGian[]`, nhưng trả sẵn để câu tóm tắt không lệch.
- `homNay.tongQuan.soVoiHomQua.phutHoc` — hiện chỉ có `soCau`, `tiLeDung`; thiếu phút thì bỏ chip "lâu hơn N phút".
- `homNay.dieuDangMung[]` = `{ loai: 'dung_lai' | 'len_bac' | 'chuoi', so, chiTiet? }`. `dung_lai` = biến `lenBac` đang tính nội bộ ở dòng ~484 (câu từng sai nay đúng) — chỉ cần trả ra; `len_bac` lấy từ `manhYeu.lenBacHomNay`; `chuoi` từ `chuoiNgayHoc`. Không có mục nào ⇒ ẩn cả thẻ.
- `homNay.aiDaLam[]` = `{ loai: 'chon_rieng' | 'xep_on' | 'soan_thu_thach' | 'nhac_han' | 'cham', so?, luc?, chiTiet? }` — số THẬT: câu chọn riêng (đếm theo nguồn của kế hoạch ngày), câu xếp ôn (`lichOn.ngayMai`), giờ soạn thử thách, giờ nhắc hạn (sổ cảnh báo/nhắc), số câu đã chấm (`soCau`). Việc nào không có số thật ⇒ không gửi dòng đó. Cảnh "con chưa học": `aiDaChuanBi[]` cùng khuôn.
- `homNay.cau[].conChon` cho nguồn KHÁC ca kiểm tra — hiện chỉ có khi `nguon === 'thi'`. Không thêm được thì màn chỉ đánh dấu "Đáp án đúng" (bản vẽ đã có dòng bài tập về nhà không có "Con chọn").
- `homNay.cau[].lamLau: boolean` (hoặc ngưỡng `nguongLamLauGiay`) để lọc "Làm lâu" không phải chép ngưỡng sang máy khách; `homNay.cau[].lan` = chỉ số lần ngồi học để nhóm câu theo `dongThoiGian[]`.
- `homNay.dongThoiGian[].soCau` khi bị che — hiện câu bị che chỉ có `che`; cần `soCauDaLam` để ghi "Con đã làm 6 câu · kết quả hiện sau khi con nộp bài" (KHÔNG đúng/sai).
- `baiTapVeNha.dangChay[].chang[]` = `{ thu, ngay, trangThai: 'xong' | 'hom_nay' | 'sap_toi', soDung?, soCau?, nopLuc? }` để vẽ 5 chấm chặng (hiện chỉ có `changXong`, `changTong`); `baiTapVeNha.gan[]` cần `diem`, `nopTreGio`.
- `lichOn.tongTungSai` (mẫu số của vòng "đã khắc phục 12 trong 31"; hiện có `daKhacPhuc14Ngay` + `conSaiChuaKhacPhuc`), `lichOn.bayNgayToi[]` (số câu đến lịch từng ngày), `lichOn.phutNgayMai`.
- `nhipHoc.trungBinhCauMoiNgay`, `nhipHoc.tongCau` (tính được từ `nhipHoc.ngay[]`; trả sẵn cho khớp).
- Khối đã có, đủ dùng: `caGanNhat` (+ `phan[]`), `manhYeu`, `doCham {hang, siSo}`, `giaoThem.conLaiHomNay`, `loiBoNao`, `phuHuynhLamGi`, `no` (dòng cam "Con còn 1 chặng của Thứ Hai" = `no.theoNgay[]` + `no.tongPhut`).

## Lưu ý khi build
- Hai cột từ 900 px: bản vẽ dùng `display: contents` + `order` để điện thoại giữ thứ tự đã chốt; bản React nên xếp theo breakpoint thay vì `order` (thứ tự Tab ở hàng đầu đang lệch thứ tự nhìn).
- Màu cam "cần luyện", tím "phút học", mảng xanh nền tối, vạch tóc, nền mờ: app CHƯA có token (ghi "CẦN THÊM TOKEN" trong CSS). Ảnh chụp headless không vẽ `backdrop-filter`, nên nền thanh để đục 92 %.
- Từ chuẩn: bản vẽ dùng "Dạng con còn vấp" theo đề bài của trưởng nhóm; bảng A2 đang ghi màn phụ huynh là "Dạng em đang luyện thêm" — cần Boss chốt một từ.
