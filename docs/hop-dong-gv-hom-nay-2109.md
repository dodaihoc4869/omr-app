# Hợp đồng — lệnh đọc-chỉ cho màn HÔM NAY của app giáo viên (Code 4 ↔ Code 3, 21/09)

Màn Hôm nay (`src/screens/HomNayScreen.tsx`) chỉ hiện số NÉM TỪ máy chủ. Khối nào máy chủ không tính được thì trả `null` (kèm `lyDo`) — màn hiện "đang chờ máy chủ", KHÔNG bịa số, KHÔNG chữ "nắm chắc", KHÔNG kết luận năng lực từ điểm.

## Lệnh
`POST /ke-hoach/hom-nay-thay` — sau cổng `laThay` (index.ts, cạnh `/ke-hoach/do-phu-phuc-vu`); mã bí mật ở header `x-ma-bi-mat` (như `/teacher-news`); body `{ ngay?: 'YYYY-MM-DD' }` (mặc định hôm nay giờ VN). CHỈ ĐỌC (không ghi, không sinh vé). ≤ 8 truy vấn D1; mỗi khối bọc `try/catch` riêng → lỗi một khối = `null` khối đó, KHÔNG làm hỏng cả lệnh. Câu tới hạn ôn KHÔNG nằm trong lệnh này: client gọi `/ke-hoach/do-phu-phuc-vu` sẵn có (`qidToiHan`, `qidPhucVuDuoc`).

## Phản hồi (`ok:true` + …; mọi khối có thể `null`)
```
serverNow, ngay,
soEm, soLop,                      // hoc_sinh/danh_sach — số em, số lớp có em
nhiemVu:  { tong, dat, tongHomQua|null, datHomQua|null } | null
            // tong = số dòng ke_hoach_ngay hôm nay (la_ngay_nghi=0); dat = số em đã đạt kế hoạch HÔM NAY theo đúng công thức chotNgayCu
            // (ke-hoach-ngay-d1.ts:308) áp cho ngày đang chạy; homQua = đếm ket_qua='dat' (null nếu chưa có dữ liệu — sau reset)
btvn:     { soEmCoLo, soEmDungNhip, dangChay: [{ ma, ten, lop, soEm, loHienTai, tongLo, soEmKip, han }] } | null
            // từ ke_hoach_ngay.viec_json (loai='btvn_lo': chiTiet{ma,chiSo,tongLo,treNhip}); ten từ de_kho.ten_de/ca.ten_ca; tối đa 6 bài, hạn gần nhất trước
            // dungNhip = soEmKip/soEmCoLo. tongLo khác nhau theo em → trả lô hiện tại + tổng LỚN NHẤT của bài, soEmKip = em có treNhip=false
canYTuong:{ tong, ds: [{ sbd, hoTen, lop, lyDo, soLieu }] } | null      // ds ≤ 8 em, mỗi em MỘT lý do (thứ tự ưu tiên bên dưới)
dangYeu:  [{ lop, siSo, dang: [{ ma, ten, soEmYeu }] }] | null          // ≤ 4 lớp đông nhất, mỗi lớp ≤ 3 dạng (nhiều em yếu nhất)
doan:     { lop, tram, tongTram, gopSucHomNay, siSo } | null            // CHỈ khi cờ cau_hinh.doan_ho_tong bật; ngược lại null (không phải lỗi)
lyDoThieu: { nhiemVu?, btvn?, canYTuong?, dangYeu?, doan? }             // chuỗi ngắn tiếng Việt khi khối = null
```

## Lý do "cần thầy để ý" (`lyDo` + `soLieu`; client tự ghép câu, máy chủ chỉ đưa số)
1. `tre_nhip` — `{ ngay }`: số ngày (trừ `cau_hinh.ngay_nghi`) kể từ `MAX(su_kien_hoc.ngay_vn)`; vào danh sách khi ≥ 3.
2. `tut_bac` — `{ soCau, soNgay: 3 }`: số câu tụt bậc trong 3 ngày (`TIEN_BO_NGAY.tut_bac` / `ke_hoach_ngay.so_cau_tut_bac`); ≥ 3 câu.
3. `dang_yeu` — `{ ma, ten, soCauSai }`: dạng sai nhiều nhất của em (`nam_kt_dang`, ngưỡng `NGUONG_DANG_YEU` ở ho-so-cau-hinh.ts).
Em thoả nhiều lý do → chỉ trả lý do ĐẦU theo thứ tự trên. `canYTuong.tong` đếm cả em ngoài `ds`. `dangYeu.dang[].ten`: từ `game_v2_question.json.$.tenDang` (KHÔNG trả cột `json` — có đáp án); thiếu tên thì trả `ma` bỏ tiền tố `CD:`.

## Phía màn hình (Code 4)
`src/lib/hom-nay-api.ts` (kiểu = hợp đồng này; gọi 1 lệnh + `/ke-hoach/do-phu-phuc-vu`; mọi lỗi mạng/`null` → "đang chờ máy chủ"). Buổi chữa tối nay đọc ở máy thầy (`docBuoiChua`, `tinhTrangBuoi` của Code 1 — không thêm truy vấn). Chưa có lệnh / lệnh 404 ⇒ màn hiện khung + "đang chờ máy chủ" (đã chạy được). Mọi con số trên màn truy được về một dòng ở trên.
## Không suy được từ dữ liệu hiện có (để `null`, ghi vào `lyDoThieu`)
So với hôm qua và chuỗi ngày đạt sau reset; tụt bậc mức dạng; % lô kịp hạn trước khi bật `exp_moi`; người tiếp sức của tuần (thiếu định nghĩa "tuần").
