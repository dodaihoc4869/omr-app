# `/ph/tat-ca-ve-con` — trường MỚI cho bảng "Mọi thứ về con" kiểu Apple (Code 4, 21/09)

Chỉ THÊM, chỉ ĐỌC, mọi con số tính TỪ MỐC hiển thị (`hien_thi_tu` ⇒ … ⇒ 12:00 trưa 21/09), luật che giữ nguyên. Khối nào không có số thật thì VẮNG (không số 0 giả, không mảng bịa) — trừ `dieuDangMung` (mảng rỗng là câu trả lời thật: "hôm nay học rồi mà chưa có gì đáng mừng").
Test: `tests/ph-tat-ca-ve-con-may-chu-2109.test.ts`, khối "bảng kiểu Apple — trường mới". Ngân sách truy vấn: phần dữ liệu ≤ 14 (thêm 1 truy vấn gộp thử thách riêng + lần nhắc hạn; thêm 1 truy vấn "câu của bài tập về nhà chưa nộp" — `docCauChanBtvnChuaNop`, che theo bài 21/09), tổng ≤ 24.

**Che theo bài chưa nộp (21/09):** ngoài luật che theo câu từ sổ, câu nằm trong bài tập về nhà con CHƯA nộp (cá nhân hoá = câu giao cho con; bài thường = cả tờ đề; bỏ bài đã xoá/thu hồi) bị che `chua_nop` ở danh sách và từ chối ở chi tiết dù con làm câu ấy ở kênh ôn. Cùng luật với `docCauBtvnChuaNop` của game, mở rộng ra mọi qid cùng nhóm nội dung. Lỗi đọc ⇒ lùi về hàm của game; lỗi nữa ⇒ không che thêm + ghi console.

| Khoá | Ý nghĩa · khi nào vắng |
|---|---|
| `homNay.tongQuan.mucTieu {cau, phut}` | `cau` = `mucTieuCau` của kế hoạch ngày; `phut` = ước theo tốc độ của CON (trung vị giây/câu 14 ngày, mặc định 90). Vắng khi chưa có kế hoạch hôm nay. |
| `homNay.tongQuan.viecXong` + `viecTong` | Việc của kế hoạch ngày: `viecTong` = việc còn lại (bắt buộc / nên làm; KHÔNG tính nhãn `tuy_chon`, KHÔNG tính lượt luyện dạng `than_thu`) + `viecXong`. `viecXong` = việc ĐO ĐƯỢC hôm nay từ mốc: ôn lại đã ngồi (kế hoạch không còn việc ôn), bài về nhà đã nộp hôm nay, bài gia đình giao đã nộp hôm nay. CHÍNH XÁC HOẶC VẮNG: hôm nay con có CHẶNG bài nâng đỡ (còn trong kế hoạch hoặc đã làm hôm nay) ⇒ VẮNG cả hai (máy chủ chưa đếm được chặng; màn tự ẩn vòng "N/M việc"). Vắng cả hai khi không có kế hoạch. |
| `homNay.tongQuan.soLanHoc`, `lanDaiNhatPhut` | Số phiên học hôm nay (kể cả phiên bị che) và phút của phiên dài nhất — đúng bằng `dongThoiGian[]`. |
| `homNay.tongQuan.soVoiHomQua.phutHoc` | Phút học hôm qua (từ mốc). Vắng khi sổ hôm qua không có giây. |
| `homNay.dieuDangMung[]` | ≤ 3 dòng `{loai, so, chiTiet?}`: `dung_lai` (câu từng sai nay đúng lại), `len_bac` (`chiTiet` = ≤ 3 tên dạng), `chuoi` (học đều ≥ 2 ngày liền, từ ngày mốc). Có mặt (kể cả `[]`) khi hôm nay con ĐÃ học; vắng khi chưa học. |
| `homNay.aiDaLam[]` | Khi con đã học hôm nay, ≤ 5 dòng có số THẬT, theo thứ tự: `chon_rieng` (`so` = câu A.I chọn riêng trong kế hoạch: on_lai/than_thu/on_thi/btvn_lo; `chiTiet` = số theo nguồn), `xep_on` (câu xếp vào lịch ôn ngày mai), `soan_thu_thach` (`so` = số câu, `luc` = giờ soạn), `nhac_han` (`so` = số lần đã nhắc phụ huynh hôm nay, `luc` = lần gần nhất), `cham` (số câu đã chấm). Dòng nào không có số ⇒ không gửi. |
| `homNay.aiDaChuanBi[]` | Cảnh "hôm nay con CHƯA học": cùng khuôn, không có `cham`. Vắng nếu không có gì để nói. Khi có, `homNay` chỉ có thể kèm `tongQuan` (mục tiêu/việc của kế hoạch). |
| `homNay.cau[].lan` | Chỉ số phiên (0, 1, …) = vị trí trong `dongThoiGian[]` — để nhóm câu theo lần ngồi học. Có cả ở câu bị che. |
| `homNay.cau[].lamLau` | `true` khi giây ≥ `NGUONG_LAM_LAU_GIAY` = 120; `false` khi nhanh hơn; vắng khi sổ không có giây. |
| `homNay.cau[].conChon` | KHÔNG đổi: chỉ có ở câu của CA KIỂM TRA (sổ chỉ lưu lựa chọn ở đó). Câu bài về nhà/ôn lại: không bao giờ có `conChon` — màn chỉ đánh dấu "Đáp án đúng". |
| `homNay.dongThoiGian[].soCauDaLam` | Phiên BỊ CHE: số câu khác nhau con đã làm (KHÔNG đúng/sai) để ghi "Con đã làm 6 câu · kết quả hiện sau khi con nộp bài". |
| `baiTapVeNha.dangChay[].chang[]` | `[{thu, ngay, trangThai}]` một chấm mỗi chặng theo lịch mở đã lưu: `thu` ∈ CN,T2…T7 của NGÀY MỞ (giờ VN), `ngay` YYYY-MM-DD, `trangThai` ∈ `xong` / `hom_nay` (đã mở, chưa xong) / `sap_toi` (chưa mở). Vắng khi bài không có lịch chặng (vẫn có `changXong/changTong`). Không có `soDung/soCau/nopLuc` từng chặng. |
| `baiTapVeNha.gan[].nopTreGio` | Số giờ nộp trễ (1 chữ số thập phân), chỉ khi nộp SAU hạn. (`diem` giữ nguyên.) |
| `lichOn.tongTungSai` | `daKhacPhuc14Ngay + conSaiChuaKhacPhuc` — mẫu số của "đã khắc phục 12 trong 31". |
| `lichOn.bayNgayToi[]` | Đúng 7 dòng `{ngay, soCau}` (ngày mai … +7); mỗi ngày kẹp bằng trần ôn của ngày (không hiện tồn đọng cũ). Chỉ khi con có hồ sơ nắm kiến thức (như `lichOn`). |
| `lichOn.phutNgayMai` | Phút ước cho `lichOn.ngayMai` câu (cùng tốc độ với `mucTieu.phut`). Vắng khi ngày mai không có câu. |
| `nhipHoc.tongCau`, `trungBinhCauMoiNgay` | Tổng câu và trung bình trên các NGÀY CÓ HỌC (đúng bằng danh sách `nhipHoc.ngay[]`, 1 chữ số thập phân). |

## Mẫu JSON rút gọn (một con đã học hôm nay)
```json
{
  "ok": true, "hoTen": "Nguyễn Thu Hà",
  "homNay": {
    "tongQuan": { "soCau": 38, "soDung": 30, "phutHoc": 34, "chuoiNgayHoc": 2, "soLanHoc": 2, "lanDaiNhatPhut": 21,
      "mucTieu": { "cau": 30, "phut": 45 }, "viecXong": 2, "viecTong": 3, "soVoiHomQua": { "soCau": 22, "tiLeDung": 0.727, "phutHoc": 26 } },
    "dieuDangMung": [ { "loai": "dung_lai", "so": 4 }, { "loai": "len_bac", "so": 1, "chiTiet": ["Thuỷ phân ester"] }, { "loai": "chuoi", "so": 2 } ],
    "aiDaLam": [ { "loai": "chon_rieng", "so": 20, "chiTiet": { "on_lai": 8, "btvn_lo": 12 } }, { "loai": "xep_on", "so": 6 },
      { "loai": "soan_thu_thach", "so": 5, "luc": "2026-09-22T05:30:00.000Z" }, { "loai": "nhac_han", "so": 1, "luc": "2026-09-22T09:00:00.000Z" }, { "loai": "cham", "so": 38 } ],
    "dongThoiGian": [ { "batDau": "2026-09-22T03:10:00.000Z", "nguon": "btvn", "ten": "Este – Lipid", "soCau": 12, "soDung": 9, "phut": 13 },
      { "batDau": "2026-09-22T08:00:00.000Z", "nguon": "ca_kiem_tra", "ten": "Ca 1", "che": "chua_cong_bo", "soCauDaLam": 6, "phut": 21 } ],
    "cau": [ { "luc": "2026-09-22T08:12:00.000Z", "nguon": "ca_kiem_tra", "che": "chua_cong_bo", "giay": 140, "lamLau": true, "lan": 1 },
      { "luc": "2026-09-22T03:40:00.000Z", "nguon": "btvn", "qid": "Q1", "deRutGon": "…", "dapAn": "B", "dung": false, "giay": 95, "lamLau": false, "lan": 0, "coLoiGiai": true } ]
  },
  "nhipHoc": { "ngay": [ { "ngay": "2026-09-21", "soCau": 22, "soCauDung": 16 }, { "ngay": "2026-09-22", "soCau": 38, "soCauDung": 30 } ], "tongCau": 60, "trungBinhCauMoiNgay": 30 },
  "baiTapVeNha": { "dangChay": [ { "maBtvn": "B1", "ten": "Este – Lipid", "hanNop": "2026-09-26T05:00:00.000Z", "changXong": 2, "changTong": 5,
      "chang": [ { "thu": "CN", "ngay": "2026-09-20", "trangThai": "xong" }, { "thu": "T2", "ngay": "2026-09-21", "trangThai": "xong" }, { "thu": "T3", "ngay": "2026-09-22", "trangThai": "hom_nay" },
                 { "thu": "T4", "ngay": "2026-09-23", "trangThai": "sap_toi" }, { "thu": "T5", "ngay": "2026-09-24", "trangThai": "sap_toi" } ] } ],
    "gan": [ { "maBtvn": "B0", "ten": "Cân bằng hoá học", "nopLuc": "2026-09-22T02:00:00.000Z", "dungHan": false, "nopTreGio": 2.5, "diem": 7.5 } ] },
  "lichOn": { "homNay": 8, "ngayMai": 6, "daKhacPhuc14Ngay": 12, "conSaiChuaKhacPhuc": 19, "tongTungSai": 31, "phutNgayMai": 9,
    "bayNgayToi": [ { "ngay": "2026-09-23", "soCau": 6 }, { "ngay": "2026-09-24", "soCau": 3 }, { "ngay": "2026-09-25", "soCau": 0 }, { "ngay": "2026-09-26", "soCau": 4 }, { "ngay": "2026-09-27", "soCau": 0 }, { "ngay": "2026-09-28", "soCau": 2 }, { "ngay": "2026-09-29", "soCau": 0 } ] }
}
```
Cảnh "hôm nay con chưa học": `homNay: { "tongQuan": { "mucTieu": {…}, "viecXong": 0, "viecTong": 3 }, "aiDaChuanBi": [ {"loai":"chon_rieng","so":20,…}, {"loai":"xep_on","so":6} ] }` (không `dieuDangMung`, `aiDaLam`, `dongThoiGian`, `cau`).

## Một định nghĩa "câu đã làm" (21/09, thầy: thẻ Hôm nay 93 ≠ Thi đua 78)
Đề bài: `prompt-mot-dinh-nghia-cau-da-lam-2109.md`. **Câu đã làm hôm nay = số câu KHÁC NHAU (DISTINCT qid) đã TRẢ LỜI (`ket_qua IS NOT NULL`), mọi nguồn, có `luc ≥ MAX(mốc hiển thị, 00:00 hôm nay giờ VN)`** — đúng định nghĩa ô Thi đua (`tuLucEmDaHoc`). Ở `/ph/tat-ca-ve-con`:
- `homNay.tongQuan.soCau` = số trên, **GỒM cả câu bị che** (đếm số câu, không lộ đúng/sai). `soDung` + **`soCauCoKetQua`** (mẫu số của tỉ lệ đúng) chỉ tính trên câu KHÔNG che ⇒ màn ghi "đúng {soDung} trong {soCauCoKetQua} câu đã có kết quả". Cả ngày chỉ có câu che ⇒ vắng `soDung` / `soCauCoKetQua` (không "0 đúng" giả).
- `nhipHoc.ngay[]` và `homNay.tongQuan.soVoiHomQua`: cùng định nghĩa cho từng ngày (trước đây đếm LƯỢT ở nhịp). `soCauDung` + `soCauCoKetQua` (nhịp) / `soCauCoKetQua` + `tiLeDung` (so với hôm qua) chỉ trên câu không che; ngày chỉ có câu che ⇒ chỉ `soCau`.
- `aiDaLam` dòng `cham` = `soCau` (cùng số). `datNhiemVu` giữ đúng số cũ (`soCauCoKetQua`) — luật đạt nhiệm vụ ngày không đổi.
- Test khoá: `tests/ph-tat-ca-ve-con-may-chu-2109.test.ts`, khối "ĐỊNH NGHĨA CHUẨN": khớp truy vấn của định nghĩa; câu làm lại / bỏ trống / trước mốc / bị che mỗi loại một ca; **đổi đúng ⇄ sai của câu che không đổi một byte phản hồi** (không suy ngược được).
