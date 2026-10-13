# Bản vẽ đợt 19 · làn P — Màn chiếu điểm danh + App phụ huynh trùng tu

Đây CHỈ LÀ BẢN VẼ để thầy duyệt. Chưa sửa gì trong `src/` hay `server/`. Dữ liệu và tên trong bản vẽ đều GIẢ.

- `man-chieu-diem-danh.html`: mở toàn màn hình. Thêm `#vua-diem-danh` vào cuối đường dẫn để xem cảnh có em vừa điểm danh.
- `app-phu-huynh.html`: một trang tự co theo khổ (kéo hẹp hoặc rộng cửa sổ). Máy để chế độ tối thì trang tự chuyển sang khổ tối.
- Cả hai tệp tự chứa, không gọi mạng. Phông Be Vietnam Pro được nhúng sẵn. Huy hiệu 12 bậc trong bản vẽ là bản TẠM, vẽ theo phong cách làn M: khiên tròn cho Lười, lục giác cho Chưa đều, tròn viền kép cho Chăm, tia sáng ở bậc 10, sao ở bậc 11, nguyệt quế và ánh kim ở bậc 12.

Ảnh trong `anh/` (JPG, mỗi ảnh ≤ 145 KB; ảnh lớn được thu nhỏ cho vừa dung lượng):

| Ảnh | Khổ |
|---|---|
| `chieu-1920.jpg` | Màn chiếu 1920×1080 (ảnh thu về 1152 px ngang) |
| `chieu-1920-chi-tiet.jpg` | Một góc màn chiếu 1920×1080, đúng kích thước gốc |
| `chieu-1440.jpg` | Màn chiếu 1440×900 (16:10) |
| `chieu-vua-diem-danh-1920.jpg` | Cảnh có em vừa điểm danh, thẻ của em nổi lên giữa màn |
| `ph-doc-1.jpg` … `ph-doc-4.jpg` | App phụ huynh dọc 390×844, cả trang chia 4 đoạn từ trên xuống |
| `ph-ngang.jpg` | App phụ huynh ngang 844×390 |
| `ph-may-tinh.jpg` | App phụ huynh máy tính 1440×900, màn đầu |
| `ph-may-tinh-ca-trang.jpg` | App phụ huynh máy tính, toàn trang (ảnh thu nhỏ để xem bố cục) |
| `ph-doc-toi.jpg` | App phụ huynh dọc, khổ tối |

## Ý thiết kế

**Màn chiếu điểm danh**
1. Mỗi em có một thẻ. Thẻ xếp từ bậc cao xuống bậc thấp, nên cả lưới đọc được như bảng xếp hạng độ chăm của lớp. Trên thẻ có huy hiệu lớn kèm số bậc, tên bậc tô màu của bậc, Điểm chăm, Chuỗi ngày (em nhóm Lười thì thay bằng "Thoát Lười k/6"), Đủ mức x/12 ngày. Vạch ở đáy thẻ cho biết điểm chăm.
2. Thang 12 bậc vẽ thành bậc thềm: bậc càng cao thì bệ càng cao. Mỗi bậc ghi số em. Phía trên chia rõ ba nhóm Lười 1–5, Chưa đều 6–7, Chăm 8–12, cộng thêm ô Mới cho em chưa xếp bậc.
3. Góc "Bậc cao nhất lớp" vinh danh em có bậc cao nhất (cùng bậc thì em nhiều điểm chăm hơn đứng trước). Huy hiệu có tia vàng, kèm ba số và hai em theo sát phía sau.
4. Em vừa điểm danh có viền vàng và nhãn "Vừa vào" (ba em mới nhất). Em mới nhất còn được hiện thẻ lớn giữa màn khoảng 4 giây, ghi "Còn N điểm chăm nữa lên Bậc …". Thẻ nổi lên trong ≤ 250 ms bằng transform/opacity và tắt hẳn khi máy bật giảm chuyển động.
5. Mã buổi và QR vẫn ở bên trái. Một đơn vị cỡ `--u` dùng cho cả 1920×1080 và 1440×900. Ở khổ 16:10 thì dòng "Chuỗi" xuống dòng riêng cho đỡ chật. Tên dài và tên bậc dài tự thu chữ nhỏ lại. Không thêm lệnh máy chủ nào.

**App phụ huynh**
1. Một trang "Hôm nay của Khôi". Mở ra là thấy ngay con đã làm bao nhiêu câu so với mức, số câu đúng, số câu sai, số giây trung bình, có mặt buổi học không, nhóm, bậc kèm huy hiệu, điểm chăm và chuỗi ngày.
2. Mọi phần nằm ngay trên trang, không phần nào phải bấm mới thấy: Cần nhắc con · Nhận xét của thầy · Nhịp học 14 ngày · Thái độ làm bài · Câu sai và tự sửa · Thời gian làm bài · Kiểm tra và tiến bộ · Bài tập về nhà · Buổi học · Lịch sử. Mỗi tín hiệu thái độ có số đo, thước kèm vạch ngưỡng, một dòng "Nghĩa là", ngưỡng và độ tin cậy. Điện thoại có thanh mục dính ở trên. Máy tính có thanh bên.
3. Giao diện ấm: nền màu kem (pha `--ph3-nen` với `--ph3-hp-nhat`), khối Hôm nay chuyển từ kem sang trắng, có lời chào "Chào anh/chị". Chỉ dùng các token `--ph3-*` đang có và 12 màu bậc chuẩn. Không thêm màu thô nào.
4. Tin xấu nói thẳng, có số, giọng bình tĩnh. Ví dụ: "Có dấu hiệu đối phó vì con trả lời rất nhanh ở 32% số lượt mà nhóm này chỉ đúng 29%". Số nào cũng có nhãn. Không có mã nội bộ, không có đáp án. Không có mục hay nhãn nào về tính cách (thầy chốt 13/10).
5. Ba khổ. Điện thoại dọc: một cột. Xoay ngang hoặc máy tính bảng: thanh trái 88 px và lưới 2 cột; khi màn thấp thì đầu trang thu gọn. Máy tính: thanh bên 264 px, hai cột trái 8 / phải 4, sau đó là lưới 12 cột. Khổ tối dùng bản tối của cùng các token.

## (1) Phần nào lấy số từ đâu

### Màn chiếu (không thêm truy vấn D1: mọi số đã có trong hai lệnh bản chiếu đang gọi)
| Phần | Lệnh · trường |
|---|---|
| Mã buổi 6 số + QR | `/gv/buoi-hoc` (buoi-hoc.ts). Mã đổi mỗi phút. QR là `linkDiemDanh` |
| Có mặt x/y, còn N em chưa điểm danh | `TrangThaiBuoi.coMat`, `lopEm` → `emCuaBuoi`, `emVangBuoi` (diem-danh-nhip.ts) |
| Thẻ em: tên | `EmBuoi.hoTen` |
| Số bậc, tên bậc, huy hiệu, Điểm chăm | `/gv/nhip-hoc` `em[].bacCham {bac, diem, diemLenBac}`, tên lấy từ `BAC_CHAM_CHI` (bac-cham-chi.ts) |
| Đủ mức x/y ngày | `DongNhipHoc.soNgayDu / soNgayQua` (`phanNhomEm` tính từ `muc[]` và `lam[]`) |
| Chuỗi ngày · Thoát Lười k/6 | `DongNhipHoc.chuoiDuGanNhat`, so với `LUAT_NHOM_NHIP.ngayLienThoatLuoi` |
| Mới: "Đã có số k/3 ngày" | `nhom = 'chua-du'` + `soNgayQua` (cần 3 ngày theo `soNgayToiThieu`) |
| "Vừa vào" | `coMat[].luc`, lấy 3 em mới nhất. Giờ để trong `title` |
| Thang 12 bậc + số em mỗi nhóm | `demTheoBac` (nhip-hoc-thay.ts), đếm trên các em có mặt |
| Bậc cao nhất lớp, theo sát phía sau | Sắp các em có mặt theo `bacCham.bac` rồi `bacCham.diem` |
| Thẻ nổi "Vừa điểm danh" | Em có `luc` mới nhất trong lượt làm mới 5 giây. "Còn N điểm lên bậc" lấy từ `diemLenBac`. Khi số này là `null`: nếu bậc kế thuộc nhóm khác thì ghi câu luật nhóm (`ngayDuCanThemDeCham`, phép thuần); nếu đang ở bậc 11 mà chuỗi ngắn thì ghi "cần chuỗi đủ mức 7 ngày" |

Về màu: nền chiếu luôn tối, nên 12 màu bậc trong bản vẽ dùng giá trị khối TỐI của tokens.css. Lý do: `--vang-diu` bản sáng (#91691e) nằm trên nền tối trông xỉn. Khi build có thể thêm bộ chọn `.ddc` vào khối tối có sẵn của tokens.css: chỉ thêm bộ chọn, không thêm màu.

### App phụ huynh
| Phần | Lệnh · trường |
|---|---|
| Hôm nay: đã làm / mức | `/ph/con-tong-quan` `ngay[hôm nay].daLam / canLam` |
| Câu đúng · câu sai · trung bình giây | `/ph/con-tong-quan` `dem.homNay.dung / sai / giayTb` |
| **Có mặt buổi học · giờ** | **cần mở** (xem mục 2) |
| **Các lần học hôm nay · so với hôm qua** | **cần mở**: `/ph/tat-ca-ve-con` `homNay.dongThoiGian[]`, `homNay.tongQuan.soVoiHomQua` |
| Nhóm · bậc · điểm chăm · chuỗi | `/ph/nhip-hoc` `nhom`, `bacCham.bac / diem`, `chuoiDuGanNhat` |
| Cần nhắc con | Gồm: `/ph/con-tong-quan` `goiY[]`, `cauSai.chuaSua`; `/ph/ho-so-thai-do` `tinHieu` (qua-nhanh, xu-huong); `lichOn.homNay` và `baiTapVeNha.dangChay` (hai khối này **cần mở**) |
| Nhận xét của thầy | `/ph/loi-thay` |
| Nhịp học 14 ngày (ô ngày, đủ mức, chuỗi, câu còn thiếu) | `/ph/nhip-hoc` `ngay[] {muc, lam}`, `soNgayQua`, `soNgayDu`, `phanTram`, `chuoiDuGanNhat`, `tongCauThieu` |
| Thang 12 bậc · lên bậc kế · độ tin cậy | `/ph/nhip-hoc` `bacCham`, `viecTiep` (`len-cham.ngayCanThem`), `doTinCay`, `canThem` |
| **Độ chăm hôm nay: hạng x/y** | **cần mở**: `/ph/tat-ca-ve-con` `doCham {hang, siSo}` |
| Thái độ: nhãn, cờ đối phó, 6 tín hiệu | `/ph/ho-so-thai-do` `nhomNhip`, `coDoiPho`, `ketLuan`, `tinHieu[] {ten, muc, giaTri, tu, mau, chu, nguong, doTinCay}`, vạch ngưỡng `NGUONG_THAI_DO`. Dòng "Nghĩa là" do app viết từ `muc` + số đo, không cần máy chủ |
| Câu sai và tự sửa | `/ph/ho-so-thai-do` `tuSuaSai {soCauSai, soCauDaSua, phanTram}`; danh sách: `/ph/lich-su-lam-cau` `cauSai[] {tieuDe, mucDo, soSai, lanCuoi, lanCuoiDung, giaySai[]}` |
| **Lịch ôn lại** | **cần mở**: `/ph/tat-ca-ve-con` `lichOn {homNay, ngayMai, phutNgayMai, bayNgayToi[], daKhacPhuc14Ngay}` |
| Thời gian: trung bình, trung vị | `/ph/ho-so-thai-do` `dem.giayTb / giayTrungVi / soLuotCoGiay` |
| Số giây theo mức độ câu | App tính từ `/ph/lich-su-lam-cau` `lan[] {mucDo, giay, dung}` (`giayTheoMucDo`, HoSoLamCauEm.tsx) |
| Phân bố 7 ngày · làm khuya · ước tính | `/ph/con-tong-quan` `thoiGian.phanBo[]`, `soUoc`, `soChuaDo`, `khuya` |
| Giờ học quen | `/ph/tat-ca-ve-con` `nhipHoc.gioThuongHoc` (dự phòng: `/ph/hoc-2` `omni.gioHoc`) |
| Kiểm tra: ca gần nhất, các phần, so ca trước, 4 ca | `/ph/tat-ca-ve-con` `caGanNhat {tenCa, nopLuc, thoiGianLamGiay, ketQua, truoc, phan[]}`, `tienBo.diem[]` |
| Sơ ý · dạng cần vững · khoảng cách tới 8 | `/ph/hoc-2` `omni {sEm, dangCanVung, khoangCach8, hieuChuan}` (chỉ hiện khoảng cách khi đã hiệu chuẩn) |
| Dạng làm tốt · đang luyện thêm · vừa lên bậc | `/ph/tat-ca-ve-con` `manhYeu`, `dangVap`, `vuaLenBac` |
| **Bài tập về nhà** | **cần mở**: `/ph/tat-ca-ve-con` `baiTapVeNha.dangChay[] {ten, hanNop, changXong, changTong}`, `gan[] {nopLuc, dungHan, nopTreGio, diem}`, `no {tongCau, tongPhut}` |
| **Buổi học trên lớp** | **cần mở** (xem mục 2) |
| Lịch sử từng ngày | `/ph/con-tong-quan` `ngay[] {daLam, canLam, dung, sai, trangThai}` |
| Câu gần đây · xem tất cả | `/ph/con-tong-quan` `ganDay[]`; `/ph/lich-su-lam-cau` `lan[]` |

## (2) Mục cần mở thêm cho phụ huynh (máy chủ đã có số, phụ huynh chưa xem được)
Trong bản vẽ, các mục này có viền đứt màu tím và nhãn "Cần mở cho phụ huynh".

| Mục | Máy chủ có ở đâu | Có thêm truy vấn D1 không |
|---|---|---|
| Điểm danh buổi học: hôm nay có mặt lúc mấy giờ, 8 buổi gần nhất, giờ vào, tự điểm danh hay thầy điểm danh, buổi vắng | Bảng `buoi_hoc` + `buoi_hoc_diem_danh` (buoi-hoc.ts). Hiện chưa có lệnh `/ph` nào đọc | **Thêm 1 truy vấn**, chạy song song trong `Promise.all` có sẵn của `/ph/tat-ca-ve-con`, nên KHÔNG thêm đợt chờ nối tiếp. Câu truy vấn: `SELECT b.ten, b.mo_luc, d.luc, d.cach, d.trang_thai FROM buoi_hoc b LEFT JOIN buoi_hoc_diem_danh d ON d.buoi_id = b.id AND d.sbd = ? WHERE b.lop = (SELECT COALESCE(ten_lop, lop) FROM hoc_sinh WHERE sbd = ?) AND b.mo_luc >= ? ORDER BY b.mo_luc DESC LIMIT 8`. Buổi ghi "Mọi lớp" chỉ tính khi con có mặt |
| Bài tập về nhà: bài đang làm (chặng, hạn), bài đã nộp (đúng hạn hay trễ bao nhiêu giờ, điểm) | Khối `baiTapVeNha` trong `/ph/tat-ca-ve-con`, đã trả về nhưng app chưa vẽ | Không |
| Lịch ôn lại: hôm nay, ngày mai, 7 ngày tới, số câu đã khắc phục | Khối `lichOn` trong `/ph/tat-ca-ve-con` | Không |
| Độ chăm hôm nay: hạng x trong y bạn | Khối `doCham` trong `/ph/tat-ca-ve-con` (lệnh đã tính sẵn) | Không |
| Các lần học hôm nay, số phút, so với hôm qua | `homNay.dongThoiGian`, `homNay.tongQuan.{soLanHoc, lanDaiNhatPhut, phutHoc, soVoiHomQua}` trong `/ph/tat-ca-ve-con` | Không |
| Câu dồn từ các ngày trước | Khối `no {tongCau, tongPhut}` trong `/ph/tat-ca-ve-con` | Không |

Về tốc độ (luật thầy 13/10): sáu tín hiệu thái độ, số giây theo mức độ câu và danh sách tự sửa hiện chỉ có trong tấm "Hồ sơ làm bài" (nạp lười khi bấm). Bản vẽ đưa chúng lên trang chính. Khi build nên nạp `/ph/ho-so-thai-do` và `/ph/lich-su-lam-cau` lúc phần đó cuộn tới (IntersectionObserver), song song với nhau, để tải đầu không nặng thêm.

Có thể mở thêm nhưng bản vẽ CHƯA vẽ: số lượt con tự báo "Chưa chắc" và số lượt "Em chắc mà sai". Số này nằm ở `su_kien_hoc.raw_json.tt` (OMNI). Chỉ cần thêm một cột `json_extract(raw_json, '$.tt')` vào câu SELECT sẵn có của `/ph/con-tong-quan`, không thêm truy vấn. Nhưng số này chỉ có ở những lượt làm khi OMNI đang bật.

## (3) Mục KHÔNG vẽ vì không đo được
- Tính cách, tâm lý, cảm xúc, động lực, mức tập trung của con: app không đo. Thầy chốt 13/10: không hiện. Bản vẽ không có mục hay nhãn nào về những điều này.
- Thời gian học thật ngoài app (đọc sách, học nhóm): app chỉ đo số giây làm từng câu trong app.
- Hành vi trên lớp ngoài điểm danh và lượt Lên bảng (phát biểu, chép bài, giờ ra về): bảng điểm danh chỉ có giờ vào.
- Dự báo điểm khi chưa đủ 3 ca chốt: chưa hiệu chuẩn, nên bản vẽ ghi "Chưa tính (cần 3 ca chốt, đã có 1)", không có con số.
- Chuỗi đủ mức dài nhất từ trước tới nay (kỷ lục): máy chủ chỉ có chuỗi gần nhất (`chuoiDuGanNhat`).
- So sánh con với từng bạn có tên: chỉ có hạng chăm hôm nay (số hạng và sĩ số, không có tên bạn nào).
