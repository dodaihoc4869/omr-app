# Đặc tả: hệ thưởng phạt kiểu Duolingo + Học cùng bạn

Thầy CHỐT 26/10: «Chốt thưởng phạt, build và đẩy lên bản sống luôn nhé».

- Luật số: `LUAT-THUONG-PHAT.md`, gồm cả mục «Ghép với hiện trạng» và «Bổ sung học cùng bạn».
- Hiệu ứng: `HIEU-UNG.md`.
- Bản vẽ đã duyệt: `ve-moi/tp-*.html`, `tp.css`, `tp.js`, ảnh ở `ve-moi/bang/tp-*`.
- Khi build, chép bản vẽ + 3 tệp md này vào `docs/ban-ve-thuong-phat-2610/`.

## 1. Mục tiêu + ai dùng
- **Học sinh** thấy vòng động lực kiểu Duolingo: nguyên tử, tinh thể, chuỗi, giải, nhiệm vụ, huy hiệu, Bi, học cùng bạn. Không thấy nhãn lười.
- **Phụ huynh** thấy tuần của con, có nhãn Học thật / Đối phó.
- **Thầy** thấy bảng thi đua + hệ lười + công tắc.
- Phạt chỉ vào thưởng và hạng. Không chặn học, không đụng điểm thi thật.

## 2. Bố cục
Theo bản vẽ tp-1 … tp-18: điện thoại dọc / ngang / máy tính, sáng + tối. Ngang và máy tính chia 2 cột như bản vẽ.

## 3. Trạng thái
Mọi màn có các trạng thái:
- đang tải: khung xương, chữ chờ trễ 800 ms;
- rỗng: tuần đầu chưa vào giải; chưa có bạn học cùng;
- lỗi / mất mạng: giữ bản gần nhất ở máy, nút «Thử lại»;
- công tắc tắt: màn hoặc khối đó ẩn hẳn, không báo lỗi.

## 4. Dữ liệu — HỢP ĐỒNG (mọi bên dùng đúng tên trường)

### 4.1 Nguyên tử (= EXP hiện có)
Dùng lõi `tinhExp` + sổ `exp_so`, thêm loại mới. Khoá chống cộng trùng giữ `daCoKhoa`.

**Luật câu:**
- đúng tự làm 10, đúng có hỗ trợ 5, sai nghiêm túc 2;
- câu khó đúng +5;
- chuỗi đúng ≥ 3: +2/câu; ≥ 5: +5/câu;
- vòng làm lại đúng 3;
- câu không được tính (Mức làm Bấm vội / treo máy / cố tình treo máy): 0, đứt chuỗi đúng.

**Luật bài:**
- hoàn hảo +20;
- KTCN / thi hoàn thành +30 (không phụ thuộc điểm);
- tự sửa 0. Chặn cả các khoản đang lọt: `dau_ngay`, lên bậc, khắc phục khi nguồn là tự sửa.

**Phản hồi lệnh `answer`** (thêm trường, không đổi trường cũ):
```
thuong?: {
  tinh: boolean,                        // false = câu không được tính → giao diện hiện tấm trung tính
  nguyenTu: number,
  dong: { nhan: string, so: number }[], // vd [{nhan:'Đúng',so:10},{nhan:'Chuỗi đúng 3',so:2}]
  chuoiDung: number,
  cauKho: boolean
}
ketBai?: {                              // có ở câu cuối của bài/chặng
  tong, dong: {nhan, so}[], soDung, soCau, chinhXac, giay, hoanHao: boolean,
  mucTieu: { daXong, can },
  giai?: { thuHang, doi }               // doi = số bậc lên(+)/xuống(-) trong nhóm sau bài
}
```
TUYỆT ĐỐI không thêm nhãn Bấm vội / treo vào phản hồi /hs. `tinh:false` là đủ.

### 4.2 Tinh thể (= ví «vàng» hiện có, đổi tên trên màn «Trong»)
Ghi vào sổ `vang_so` với loại mới.

**Kiếm:**
- nhiệm vụ 5–10, rương 15;
- mục tiêu ngày 5;
- mốc chuỗi 10 / 30 / 100 / 365; mốc chuỗi đôi 10 / 30 / 100;
- lên hạng 20 / 30 / 40 / 50 / 60;
- Kim cương 40;
- thắng cược 100.

**Tiêu:** bình giữ chuỗi 150 (luật 27/10: mỗi tuần mua tối đa 1 bình, bỏ tặng thứ Hai, bỏ «vắng có phép giữ chuỗi»), cược 50.

**Thăng hoa:**
- 2 ngày liền không xong bài nào và không có bình đỡ ⇒ mất 10% tinh thể (tối thiểu 5, tối đa 50, không âm);
- chạy cron hằng ngày 00:10 giờ VN;
- ghi một thông báo cho lần mở app tới.

### 4.3 Chuỗi ngày
Máy chủ do **Code app 4** làm (B3). Trường dùng chung:
```
chuoiNgay: {
  so, giuChuoi, sucChua,
  lich7: {ngay, kieu: 'hoc'|'binh'|'phep'|'tat'}[],
  cuu?: {hetHan, daLam, can: 2},
  binhVuaDo?: ngay
}
```
Phía thưởng phạt chỉ ĐỌC trường này. Mua bình = gọi hàm cộng bình của B3 sau khi trừ tinh thể (một giao dịch `batch`).

### 4.4 Lệnh mới (/hs đọc song song, KHÔNG thêm vòng chờ nối tiếp)
- `GET /hs/thuong` → tổng quan:
```
{
  bat: {giai, thangHoa, banBe, kimCuong},
  nguyenTuHomNay, tinhThe,
  mucTieu: {daXong, can},
  chuoiNgay,
  nhiemVu: {ma, ten, tien, can, thuong, xong}[],
  ruong: {mo, thuong},
  giai?: {hang: 'sat'|'dong'|'bac'|'vang'|'bachkim'|'kimcuong', thuHang, soNguoi, hetHanGiay},
  thongBao: {ma, loai: 'thang_hoa'|'binh_do'|'cuoi_tuan'|'moc_chuoi'|'cuoc'|'huy_hieu'|'moc_doi'|'go_cua'|'moi_ban', duLieu}[]
}
```
  `thongBao` hiện một lần; giao diện gọi `POST /hs/thuong/da-xem {ma}`.
- `GET /hs/giai` → `{hang, hetHanGiay, nhom: {thuHang, ten, lop, nguyenTu, laEm}[], len: 5, roi: 4}`
  - `nguyenTu` ở bảng giải = chỉ lượt Học thật (lọc bằng `danh_gia_em_tuan.bac` + `assistance`);
  - KHÔNG trả nhãn;
  - tên bạn khác: tên + lớp, không số báo danh.
- `POST /hs/thuong/mo-ruong`, `POST /hs/thuong/mua-binh`, `POST /hs/thuong/cuoc` (`{dat: 50}`). Mỗi lệnh có chống bấm lặp: khoá theo ngày/tuần + `INSERT OR IGNORE`.
- `GET /hs/huy-hieu` → `{ma, ten, co: boolean, tienDo?: {da, can}, ngay?}[]`
- **Kim cương:**
  - `POST /hs/kim-cuong/bat-dau {chuyenDe}` → `{phien, cau: Question[10] (KHÔNG đáp án), ong: 3}`;
  - nộp qua lệnh `answer` sẵn có, kèm `phien`. Phản hồi thêm `kimCuong: {ongCon, xong?, dat?}`;
  - trượt thì khoá 24 giờ.
- **Học cùng bạn:**
  - `GET /hs/ban` → `{ban: {ma, ten, lop, chuoiDoi, homNay: 'ca_hai'|'ban_chua'|'em_chua'|'ca_hai_chua', daGoCua}[], loiMoi: {ma, ten, lop}[]}`. Không trả điểm của bạn;
  - `GET /hs/ban/tim?q=` (tên hoặc SBD, chỉ trong trung tâm, tối đa 10 kết quả);
  - `POST /hs/ban/moi`, `/hs/ban/tra-loi {ma, dongY}`, `/hs/ban/go-cua {ma}` (1 lần/ngày/bạn), `/hs/ban/thoi {ma}`;
  - tối đa 3 bạn.
- **Phụ huynh:** khối `tuan` trong dữ liệu PH sẵn có thêm `{chuoi, soBai, hang, tiLeHocThat, hocCung: string[]}`.
- **Thầy:**
  - `GET /gv/thi-dua-tuan?lop=` → mỗi em: `{nguyenTuThat, nguyenTuLoai, hang, chuoi, nhan, bacDuoi, hocCung}`;
  - `GET/POST /gv/thuong/cong-tac` → `cau_hinh` các khoá: `thuong_giai_tuan`, `thuong_thang_hoa`, `thuong_ban_be`, `thuong_kim_cuong` (giá trị 'bat' | 'tat').

### 4.5 Bảng D1 (migration CHỈ THÊM: `migration-2610-thuong-phat.sql`)
- `giai_tuan` (tuan, em, hang, nhom, nguyen_tu_that, thu_hang_chot)
- `nhiem_vu_ngay` (ngay, em, ma, can, da, xong_luc)
- `ruong_ngay`
- `huy_hieu_em`
- `cuoc_chuoi`
- `kim_cuong_phien`
- `ban_hoc` (em_a, em_b, trang_thai, tu_ngay)
- `go_cua`
- `thong_bao_thuong`
Có chỉ mục theo (em, ngay/tuan).

### 4.6 Cron
- Thứ Hai 00:05 VN: chốt giải tuần — lên 5 / rơi 4, chia nhóm mới khoảng 20 người cùng hạng, ghi thông báo `cuoi_tuan` + thưởng tinh thể.
- Hằng ngày 00:10 VN: thăng hoa, tính chuỗi đôi, sinh 3 nhiệm vụ mới (lấy ngẫu nhiên có hạt giống theo em + ngày).

## 5. Ngoại lệ
- Bấm lặp: mỗi lệnh ghi có khoá duy nhất.
- Đổi ngày giữa bài: tính theo ngày bắt đầu bài.
- Mất mạng: giao diện giữ trạng thái, gửi lại theo biên nhận như `answer`.
- Em mới chưa có dữ liệu: nhóm giải tạo khi em có nguyên tử đầu tiên trong tuần.
- Tinh thể không âm. Thăng hoa không chạy khi số dư = 0.
- Bạn bị xoá hoặc nghỉ học: chuỗi đôi kết thúc êm.

## 6. Chi phí máy chủ
- `/hs/thuong`: 1 lượt `batch` đọc song song (khoảng 6 câu SELECT), 0 vòng chờ nối tiếp.
- Phần thưởng trong `answer`: tính trong cùng giao dịch đang có (+1 batch ghi).
- Giải và nhiệm vụ: đọc `exp_so` theo chỉ mục `ngay_vn`.
- Phần nặng (chia nhóm, chốt tuần, thăng hoa) chạy bằng cron.
- Đáp án không xuống máy trước khi nộp, kể cả Kim cương.

## 7. Nghiệm thu
- **Test máy chủ:**
  - tests/thuong-nguyen-tu-2610: bảng luật câu/bài, câu không được tính = 0, tự sửa = 0, chặn các khoản đang lọt;
  - tests/thuong-tinh-the-2610: kiếm, tiêu, thăng hoa 10% / tối thiểu 5 / tối đa 50 / không âm, chống lặp;
  - tests/thuong-giai-tuan-2610: lọc Học thật, lên 5 / rơi 4, hạng Sắt không rơi;
  - tests/thuong-ban-be-2610: tối đa 3, phải đồng ý, chuỗi đôi, gõ cửa 1 lần/ngày, không lộ điểm;
  - tests/thuong-kim-cuong-2610: 3 ống, không đáp án, khoá 24 giờ;
  - tests/thuong-khong-lo-luoi-2610: mọi phản hồi /hs mới KHÔNG chứa khoá hoặc chữ lười.
- **Test giao diện:** tp-* render đúng số từ dữ liệu giả; reduced-motion; công tắc tắt thì ẩn.
- **Cổng:** `npm run kiem:toc-do` 0 đỏ, `kiem:mau-giu` 0, `kiem-sw` 13/13, oxlint 381; ảnh Chromium 3 khổ, sáng + tối, 0 tràn / chồng chữ / đích bấm < 44 px.
- **Phát hành:**
  - migration chỉ thêm, chạy `--remote` tự động;
  - công tắc mặc định 'bat' (thầy bảo đẩy lên sống luôn);
  - thầy tắt được từng phần ở app thầy.
