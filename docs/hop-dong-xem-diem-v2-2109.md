# Hợp đồng MÁY CHỦ cho "Xem điểm sau kiểm tra + báo cáo chi tiết" bản 2 (Code 3 → Code 2, Code 4 · 21/09/2026)

Đề bài: `prompt-xem-diem-bao-cao-v2.md` (mục 2, 4 và phần "THẦY ĐÃ CHỐT"); bản vẽ: `docs/ban-ve-xem-diem-2109/`. Mọi thứ dưới đây **chỉ-thêm**, **đọc-chỉ**, **không AI**, **không đổi luật chấm / luật công bố / luật vào thi**.
Trường nào máy chủ không có số thật thì **VẮNG** (không số 0 giả, không bịa) — màn ẩn khối ấy.

## 0 · Luật công bố đứng đầu (đã chặn ở `536f7db`, xem `server/src/cong-bo-diem.ts`)
Một luật cho mọi lệnh: `ngay` ⇒ công bố; `ca_lop_xong` ⇒ khi ca **đã đóng** hoặc **cả lớp đã nộp** (ca chưa ai vào KHÔNG tính là xong); `khong`/thiếu ⇒ không.
- Ca CHƯA công bố: mọi lệnh dưới đây trả **`congBo` + `soEmDaNop/soEmDaVao`** và **KHÔNG** kèm điểm, số câu đúng/sai, đáp án, lời giải, dạng đúng/tổng, câu cần xem lại, "A.I Đỗ Đại Học đã lo", tiến bộ (`ketQua`, `phan`, `dang`, `cauCanXemLai`, `aiDaLo`, `tienBo` **vắng hẳn**). Máy vẽ ba trạng thái: `daCongBo` · `congBo === 'ca_lop_xong'` ("Đã nộp a/b em — điểm hiện khi cả lớp nộp") · `congBo === 'khong'` ("Thầy chưa công bố điểm").
- Lệnh của THẦY (`/gv/*`) KHÔNG bị chặn (thầy xem mọi ca), nhưng trả thêm `congBo` để hiện nhãn.
- Đang sống ở máy chủ từ `536f7db` (chờ Boss soát rồi đẩy): `/hs/lich-su` + `lichSuEm` bớt ca chưa công bố và trả `chuaCongBo[{maCa, tenCa, nopLuc, congBo, soEmDaNop, soEmDaVao}]` (HS-3/PH-2 vẽ "chưa công bố / đã nộp a/b em"); `/hs/cau-sai` + `/hs/cau-da-thi` trả `caChuaCongBo: [maCa…]`; `phieuCuaEm` trả thêm `congBo, daCongBo, soEmDaNop, soEmDaVao` (ca chưa công bố: `tong/diemI/II/III = null`, `chiTietCau: []`, `bank: null`, `phieu: null`).

## 1 · Ba lệnh mới (cùng một bộ dựng `server/src/bao-cao-ca.ts`, khác xác thực và giọng)
| Lệnh | Xác thực | Trả |
|---|---|---|
| `POST /hs/bao-cao-ca {token, maCa, lanThu?}` | token học sinh (như `/hs/thu-thach-hom-nay`) | báo cáo của CHÍNH em, giọng "em" |
| `POST /ph/bao-cao-ca {pass, maCa, lanThu?}` | mã phụ huynh (`sbdCuaPhuHuynh`, như `/ph/ke-hoach`) | cùng dữ liệu + `phuHuynhLamGi[]`, không mã nội bộ |
| `POST /gv/bao-cao-ca {secret, maCa}` | mã thầy | tổng quan CẢ LỚP của ca (mục 4) |
| `POST /gv/bao-cao-ca-em {secret, maCa, sbd}` | mã thầy | báo cáo MỘT em trong ca (= của HS + `hangTrongLop`, mục 4) |
`lanThu` vắng ⇒ lượt nộp mới nhất của em. Lệnh HS/PH chỉ trả ca của CHÍNH em; ca em chưa nộp ⇒ `{ok:false, error:'Em chưa nộp bài ca này'}`.

## 2 · Thân trả của HS / PH (`/hs/bao-cao-ca`, `/ph/bao-cao-ca`)
```jsonc
{ "ok": true, "serverNow": 0,
  "ca": { "maCa": "…", "tenCa": "…", "lanThu": 1, "nopLuc": "ISO", "thoiGianPhut": 45, "thoiGianLamGiay": 1930 },   // thoiGianLamGiay = nộp − vào (vắng nếu thiếu mốc)
  "congBo": { "congBo": "ngay|ca_lop_xong|khong", "daCongBo": true, "soEmDaNop": 27, "soEmDaVao": 32 },          // LUÔN có
  // ── chỉ khi daCongBo ──
  "ketQua": { "tong": 7.5, "diemI": 3, "diemII": 2.5, "diemIII": 2, "soCau": 28, "soCauDung": 21, "soCauSai": 5, "soCauMotPhan": 1, "soCauBoTrong": 1 },
  "truoc":  { "maCa": "…", "tenCa": "…", "nopLuc": "ISO", "tong": 6.75, "doi": 0.75 },                         // ca đã công bố liền trước CỦA CHÍNH EM; vắng ở ca đầu
  "phan":   [ { "ma": "I", "dung": 10, "tong": 12, "motPhan": 0, "diem": 3 }, { "ma": "II", "dung": 2, "tong": 4, "motPhan": 1, "diem": 2.5 }, { "ma": "III", "dung": 4, "tong": 6, "motPhan": 0, "diem": 2 } ],
  "dang":   [ { "ma": "ESTE.THUY_PHAN", "ten": "Thuỷ phân ester", "dung": 3, "tong": 5, "bac": 1, "bacSau": 1, "bacTruoc": 0, "doiBac": "len" } ],   // dạng vấp xếp trên
  "cauCanXemLai": [ { "qid": "…", "phan": "I", "soCau": 7, "de": "đề rút gọn ≤ 160 ký tự", "dapAnChon": "A", "dapAnDung": "C", "loiGiai": "…", "giay": 84, "tbGiay": 61, "laDungNhungLau": false, "ngayOnLai": "2026-09-22" } ],
  "aiDaLo": { "cauSaiVaoLichOn": 5, "ngayOnGanNhat": "2026-09-22", "soCauOnNgayMai": 3, "dangBaiTapKe": [ { "ma": "…", "ten": "…" } ], "expDaCong": 40 },
  "tienBo": { "diem": [ { "ngay": "2026-09-01", "diem": 6, "maCa": "…" } ], "dangLenBac": [ { "ma": "…", "ten": "…", "tu": 0, "den": 1 } ] },
  "phuHuynhLamGi": [ "Nhắc con làm 3 câu ôn lại vào ngày 22/09, khoảng 5 phút." ]    // CHỈ /ph/bao-cao-ca
}
```
Nguồn và luật vắng từng khối (mọi số lấy từ bảng chấm của CHÍNH em, không suy từ điểm):
- `ketQua`: `luot.tong/diem_i/ii/iii`; số câu đếm từ `chi_tiet_cau` cùng lượt (đúng luật `goiDemCau`). Không có bảng chấm ⇒ chỉ có điểm, các `soCau*` vắng. `soCauMotPhan` = câu phần II đúng một phần (không tính là đúng).
- `truoc`: lượt nộp liền trước của em ở ca **đã công bố** (cùng luật ở mục 0), `doi = tong − truoc.tong` (2 chữ số). Vắng khi không có ca trước — màn nói "chưa có lần trước".
- `phan`: đếm từ `chi_tiet_cau` (KHÔNG tổng cứng 12/12/10/6). Phần không có câu nào bị bỏ.
- `dang`: `dung/tong` trong CA NÀY (nhóm theo mã dạng của câu, `nam_kt_cau.ma_dang`; câu không rõ dạng ⇒ không vào dòng nào, tổng các dòng ≤ số câu); `ten` từ `tenCuaCacDang` (không mã trên màn HS/PH); `bac` = bậc HIỆN TẠI (`nam_kt_dang.bac`: 0 Biết · 1 Hiểu · 2 Vận dụng), **`bacTruoc` / `bacSau`** = bậc ngay trước / ngay sau ca này, tính bằng **phát lại sổ học** (`phatLaiSuKien` trên sự kiện của em có `luc` < lượt vào ca / ≤ lượt nộp) — không cần bảng mới; `doiBac` = `len|xuong|giu` (vắng khi thiếu sổ). Dạng vấp (đúng/tổng thấp nhất) xếp trên; ≤ 12 dòng.
- `cauCanXemLai`: câu SAI + câu ĐÚNG nhưng `giay` ≥ 2 × trung vị cả ca của em (tối đa 8 câu, sai trước). `de` = đầu đề rút gọn từ kho; `loiGiai` chỉ ở ca đã công bố và **KHÔNG BAO GIỜ câu tự luận** (`src/lib/cau-tu-luan.ts`). `giay` = `chi_tiet_cau.giay`; `tbGiay` = trung bình giây câu ấy của các em đã nộp ca (chỉ khi ≥ 5 em có số, để không lộ từng em); `ngayOnLai` = `nam_kt_cau.moc_on_ke` của câu (chỉ khi câu đang trong lịch ôn: `moi_sai`/`dang_on`). Không có ⇒ vắng.
- `aiDaLo` ("A.I Đỗ Đại Học đã lo" — CHỈ điều chắc chắn): `cauSaiVaoLichOn` = số câu sai của ca có `nam_kt_cau.trang_thai IN (moi_sai, dang_on)` và `moc_on_ke` (đã nằm trong lịch ôn 1·3·7); `ngayOnGanNhat` = `min(moc_on_ke)` của chúng; `soCauOnNgayMai` = số câu có mốc ≤ ngày mai (kể cả câu ngoài ca này); `dangBaiTapKe` = các dạng em đang YẾU sau ca (`dangYeu` của hồ sơ) — máy chủ chỉ nêu khi có ít nhất một dạng yếu, câu chữ ở máy là "Bài tập về nhà tới sẽ ưu tiên dạng …" (đúng luật chọn bộ câu hiện có; nếu thầy chưa giao bài thì chưa có bài); `expDaCong` = tổng `exp_so` gắn mã ca của em (chỉ khi > 0; **CHỈ ở `/hs/bao-cao-ca` và `/gv/*` — `/ph/*` KHÔNG BAO GIỜ có** vì app phụ huynh không hiện gì của game). Mọi trường vắng khi không có số thật.
- `tienBo`: `diem` = tối đa 5 ca đã công bố gần nhất của em (cũ→mới, gồm ca này); `dangLenBac` = tối đa 3 dạng có `bacSau > bacTruoc` ở ca này. Không xếp hạng, không so với bạn.
- `phuHuynhLamGi` (chỉ PH): 1–2 câu mẫu có số thật, xưng "con", theo `quy-tac-viet-phu-huynh` (ví dụ ngày ôn lại + số câu + phút ước tính; nhắc con xem lại N câu sai). Không có số thật ⇒ mảng rỗng (vắng).
- Giọng HS/PH khác NHAU ở chữ máy vẽ; JSON giống nhau. Không có mã dạng trần trong trường hiển thị; `qid`/`ma` chỉ để nối (máy không in).

## 3 · Trần truy vấn và hiệu năng
Một lệnh báo cáo ≤ 8 truy vấn D1 (`chi_tiet_cau` của em+ca, `luot` ca, `nam_kt_dang/cau` của em, `su_kien_hoc` của em cho phát lại, kho câu cho `de`/tên dạng, `exp_so`, ca trước). `tbGiay` tính bằng MỘT truy vấn gộp trên `chi_tiet_cau` của ca (không lặp theo câu).

## 4 · Lệnh của thầy
`/gv/bao-cao-ca {maCa}` — tổng quan lớp (đọc-chỉ, sau cổng thầy; **không bị chặn công bố**, trả `congBo`):
```jsonc
{ "ok": true, "ca": { "maCa": "…", "tenCa": "…", "loai": "thi", "trangThai": "mo|dong", "lop": "…" },
  "congBo": { "congBo": "…", "daCongBo": false, "soEmDaNop": 27, "soEmDaVao": 32 },
  "tongQuan": { "soEm": 27, "tb": 6.9, "cao": 9.5, "thap": 2.5, "phoDiem": [ { "tu": 0, "den": 1, "so": 0 } ],
                 "phanTb": [ { "ma": "I", "diemTb": 2.6, "dungTb": 8.4, "tong": 12, "toiDa": 3 } ] },      // như HS `phan` (Code 4 xin): trung bình đúng x/y câu + điểm/trần điểm
  "dangCaLopVap": [ { "ma": "…", "ten": "…", "tiLeDung": 0.46, "soEmSai": 10, "soEm": 12 } ],   // tiLeDung = tỉ lệ CÂU đúng của cả lớp ở dạng ấy trong ca; soEmSai = số em sai ÍT NHẤT MỘT câu của dạng; soEm = số em có câu dạng ấy
  "cauSaiNhieu": [ { "qid": "…", "phan": "I", "soCau": 7, "de": "…", "dang": "Thuỷ phân ester", "soEmSai": 15, "soEm": 27, "dapAnDung": "C", "dapAnSaiNhieu": { "dapAn": "A", "soEm": 9 } } ],
  "emCanYY": [ { "sbd": "…", "hoTen": "…", "tong": 2.5, "diemTruoc": 5, "doi": -2.5 } ],
  "hocSinh": [ { "sbd": "…", "hoTen": "…", "tong": 7.5, "diemTruoc": 6.75, "doi": 0.75, "thoiGianLamGiay": 1930, "soCauDung": 21, "soCau": 28 } ],
  "aiDaLo": { "soCauSaiVaoLichOn": 96, "soEmCoLichOn": 24, "dangBuoiChuaXepSan": [ { "ma": "…", "ten": "…" } ], "dangBaiTapKe": [ { "ma": "…", "ten": "…", "soEm": 12 } ] } }
```
- `phoDiem`: 10 khoảng [0,1)…[9,10]; `dapAnSaiNhieu` = đáp án SAI được chọn nhiều nhất + số em (chỉ đáp án và số em, không lý do); `dang` = tên dạng (không mã, vắng nếu không rõ), `de` không bao giờ là câu tự luận; `emCanYY` = tối đa 5 em (điểm giảm ≥ 1,5 so với lần trước của CHÍNH em hoặc điểm DƯỚI 5 — nửa thang, khớp chữ trên màn; máy thầy tự gộp lý do "rời màn ≥ 3 lần"/"chưa nộp" từ dữ liệu lượt) — chỉ số liệu, không nhãn năng lực; `dangBuoiChuaXepSan` = dạng cả lớp vấp mà `/gv/buoi-chua-de-xuat` đã có; `dangBaiTapKe` = dạng nhiều em yếu nhất sau ca. Khối nào thiếu số thật thì vắng.
`/gv/bao-cao-ca-em {maCa, sbd}` — thân MỤC 2 (không chặn công bố; `congBo` vẫn có) **+** `hangTrongLop: { "hang": 5, "siSo": 27 }` (chỉ ở lệnh thầy; hạng trong lớp của ca này) + `aiDaLo` mở rộng: `dangUuTien`, `ngayOnLai` + số câu, `expDaCong`.

## 5 · Mốc và test
Test khoá (đột biến): chưa công bố ⇒ không một trường số/đáp án nào (kể cả `JSON.stringify` không chứa dấu bí mật), ba trạng thái; ba lệnh cùng bộ dựng (HS/PH cùng dữ liệu); `bacTruoc/bacSau` khớp phát lại sổ; số câu theo dạng cộng ≤ tổng câu; `tbGiay` chỉ khi ≥ 5 em; không tự luận; vắng đúng chỗ thiếu; ≤ 8 truy vấn. Build máy chủ sau khi Code 2/4 gật đầu thân trả (sửa tên trường ở đây TRƯỚC khi tôi viết mã).

## 6 · Lệnh MỚI cho phụ huynh: `/ph/tat-ca-ve-con` (thẻ "Ca kiểm tra gần nhất của con" + trang "Tất cả về con", mục D của `prompt-ph-giao-them-bai-2109.md`)
Đọc-chỉ, xác thực `pass` như `/ph/ke-hoach`, **≤ 12 truy vấn** (+ 3 của `doCham` + 5 của `no` — Dồn về đích, W3b), không ghi, không AI, **KHÔNG trường nào của game** (không thần thú, EXP, khiên, chuỗi game), không xếp hạng, không so với bạn. Chung luật công bố (mục 0). Nguyên báo cáo ca gần nhất = gọi song song `/ph/bao-cao-ca {maCa: caGanNhat.maCa}` (mục 2) — lệnh này chỉ trả thẻ gọn để thẻ đầu Bảng nhiệm vụ nhẹ.
```jsonc
{ "ok": true, "serverNow": 0, "hoTen": "…",
  "caGanNhat": { "maCa": "…", "tenCa": "…", "nopLuc": "ISO", "thoiGianLamGiay": 1930,                                     // vắng cả khối khi con chưa nộp ca nào ⇒ không vẽ thẻ
                 "congBo": { "congBo": "…", "daCongBo": true, "soEmDaNop": 27, "soEmDaVao": 32 },                        // luôn có
                 "ketQua": { "tong": 7.5, "soCau": 28, "soCauDung": 21 },                                                  // chỉ khi daCongBo
                 "truoc": { "tong": 6.75, "doi": 0.75 },                                                                   // chỉ khi daCongBo và có ca trước
                 "phan": [ { "ma": "I", "dung": 10, "tong": 12, "diem": 3 } ] },                                           // chỉ khi daCongBo
  "tienBo": { "diem": [ { "ngay": "2026-09-01", "diem": 6, "maCa": "…", "tenCa": "…" } ],                                  // ≤ 8 ca ĐÃ CÔNG BỐ, cũ → mới
              "dangTienBoNhat": [ { "ma": "…", "ten": "…", "tu": 0, "den": 1 } ] },                                        // ≤ 3, bậc 14 ngày trước → nay
  "baiTapVeNha": { "dangChay": [ { "maBtvn": "…", "ten": "…", "hanNop": "ISO", "changXong": 2, "changTong": 5 } ],
                   "gan": [ { "maBtvn": "…", "ten": "…", "nopLuc": "ISO", "dungHan": true, "diem": 8.2 } ] },             // ≤ 5 bài đã nộp
  "bacTheoDang": [ { "ma": "…", "ten": "…", "bac": 1 } ],  "dangVap": [ { "ma": "…", "ten": "…", "dung": 3, "tong": 8 } ],  // 14 ngày, ≤ 5
  "vuaLenBac": [ { "ma": "…", "ten": "…", "tu": 0, "den": 1, "ngay": "2026-09-20" } ],
  "lichOn": { "homNay": 4, "ngayMai": 3, "daKhacPhuc14Ngay": 12, "conSaiChuaKhacPhuc": 5 },
  "nhipHoc": { "ngay": [ { "ngay": "2026-09-20", "soCau": 24, "soCauDung": 19 } ], "gioThuongHoc": "19:00–21:00" },     // 14 ngày, chỉ ngày có học
  "loiBoNao": { "loi": "…", "ngay": "2026-09-21", "thuTuan": "…" },                                                       // chỉ lời cho PHỤ HUYNH đã qua kiểm khuôn (che_do that); không chữ game
  "phuHuynhLamGi": [ "Nhắc con làm 3 câu ôn lại vào ngày mai, khoảng 5 phút." ],
  "giaoThem": { "conLaiHomNay": 3 } }                                                                                      // cho nút "Giao thêm bài cho con" (nguồn: bảng đếm lượt của `/ph/giao-them`)
```
- Khối nào không có số thật thì VẮNG; `lichOn`/`dangVap`/`bacTheoDang` chỉ khi con có hồ sơ nắm kiến thức. `gioThuongHoc` = khung 2 giờ có nhiều lượt chấm nhất 14 ngày (vắng nếu < 20 lượt). Không bao giờ có `than_thu`, `exp`, `manhKhien`, `khien`, `doan`, `dao`, `vo_dai` — test quét cả JSON trả về.
- `tenCuaCacDang` cho mọi tên dạng (không mã trên màn); câu tự luận không bao giờ vào bất cứ danh sách câu nào.
