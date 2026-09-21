# Hợp đồng `/gv/buoi-chua-de-xuat` — Buổi chữa tối nay xếp sẵn (B6)

Bên CUNG CẤP: **Code 3** (`server/src`, chỉ đọc, ≤ 12 truy vấn, giai đoạn 1 = tính khi thầy mở màn, không cron, không bảng mới). Bên DÙNG: **Code 1** — lõi thuần `src/lib/buoi-chua-de-xuat.ts` (chọn câu/em, ước phút), nối máy `src/lib/buoi-chua-de-xuat-lenh.ts`, thẻ ở mục 2 màn Gọi lên bảng. Đề xuất gốc + Boss duyệt: `docs/de-xuat-buoi-chua-xep-san-2109.md`.

## Lệnh (lệnh thầy: sau cổng `laThay`, header `x-ma-bi-mat`)
`POST /gv/buoi-chua-de-xuat` thân `{ ngay?: 'YYYY-MM-DD', lop?: string }` (mặc định hôm nay giờ Việt Nam; `lop` có ⇒ chỉ em thuộc lớp ấy). Trả SỐ LIỆU THÔ — ngưỡng và xếp câu do hàm thuần của app thầy quyết (máy chủ chỉ lọc sàn ≥ 3 em):
```json
{ "ok": true, "ngay": "2026-09-22", "lop": "12A1", "soEmCoSo3Ngay": 24,
  "dangCaLopYeu": [ { "lop": "12A1", "siSo": 24, "dang": [ { "ma": "ESTE.THUY_PHAN", "ten": "Thuỷ phân ester", "soEmYeu": 9 } ] } ],
  "dangBoNao": [ { "dang": "ESTE.THUY_PHAN", "tenDang": "Thuỷ phân ester", "chu": "…" } ],
  "cauSaiNhieu": [ { "qid": "DH-12-C1-B2-I-49", "maDe": "DH-12-C1-B2", "phan": "I", "dang": "ESTE.THUY_PHAN", "tenDang": "…", "soEmLam": 20, "soEmSai": 9, "tiLeSai": 0.45,
                     "loi": true, "emSai": [ { "sbd": "12007", "hoTen": "Trần Thu Hà", "lop": "12A1" } ] } ],
  "dongBoNao": [ { "sbd": "12007", "hoTen": "…", "lop": "12A1", "hanhDong": "goi_len_bang|dua_vao_buoi_chua", "dang": "…", "tenDang": "…", "chu": "…" } ],
  "soTruyVan": 9 }
```
- `soEmCoSo3Ngay`: số em có làm câu nào trong 3 ngày tới `ngay` (mẫu số của "9/24 em"). `dangCaLopYeu`: hồ sơ nắm kiến thức, mỗi lớp ≤ 8 dạng có ≥ 3 em yếu. `dangBoNao`: các dòng `ca_lop` của bản tin đêm qua. `dongBoNao`: dòng bản tin đêm qua có `hanhDong` gọi lên bảng / đưa vào buổi chữa.
- `cauSaiNhieu`: 3 ngày gần nhất, CHỈ câu ≥ 3 em sai VÀ ≥ 30 % em làm sai, ≤ 40 câu xếp `soEmSai` giảm; **đã lọc câu tự luận** (`cau-tu-luan.ts`) và câu thuộc đề thi đang bảo vệ. `loi` (tuỳ chọn, mặc định `false`) = câu cốt lõi của bài tập về nhà (`btvn_cau.loi = 1`). `qid` theo quy ước máy chủ `<mã tờ gốc>-<phần>-<số>`.
- Không nhãn năng lực; tên em chỉ ở màn thầy. Lệnh chưa có (404) / lỗi / thân sai dạng ⇒ app thầy **ẨN thẻ**, không báo lỗi đỏ.

## Việc của app thầy (Code 1 — đã có ở `buoi-chua-de-xuat.ts`)
- `docDauVao`: dạng yếu của mọi lớp cùng mã cộng dồn số em; dạng có trong `dangBoNao` thêm nguồn "Bộ não A.I" (thấy ở CẢ hai nơi xếp trước); `dongBoNao` chỉ giữ hai hành động gọi lên bảng. Phần tử hỏng bị bỏ.
- `deXuatBuoiChua(dauVao, kho)`: ẩn khi < 5 em có sổ; câu ≥ 3 em sai và ≥ 30 % (ngưỡng ở app, máy chủ lọc sàn); ghép kho trên máy thầy (thiếu ⇒ bỏ + đếm; tự luận ⇒ bỏ + đếm); mỗi dạng ≤ 2 câu, tổng ≤ 10; vừa ngân sách 90 phút (`giayBienGhepDoi` + hao phí); em = gợi ý Bộ não trước rồi em sai nhiều câu trong buổi, ≤ 20.

## Ghi chú máy chủ (Code 3, đã nối ở `server/src/gv-buoi-chua-de-xuat.ts`)
- `lop` (ở thân yêu cầu và ở mỗi phần tử trả về) = **TÊN LỚP hiệu lực** (`docs/hop-dong-ten-lop-2109.md`: "12 - Lớp Thường", "12 - Tinh Hoa", khối 10/11 = chính khối). Thân yêu cầu `lop` khớp TÊN LỚP **hoặc KHỐI** ("12" gồm cả hai lớp khối 12). `dangCaLopYeu[]` có thêm `khoi`; `siSo` = số em của lớp (đã áp bộ lọc `lop`).
- `cauSaiNhieu`: đếm MỌI nguồn sổ (kể cả lên bảng), chỉ lượt ĐÃ CHẤM; `soEmLam` = số em có lượt chấm của câu ấy. Câu không tra được nội dung trong kho ⇒ bỏ (không bịa). Không kiểm được đề thi đang bảo vệ ⇒ `cauSaiNhieu: []` + `lyDoThieu.cauSaiNhieu`.
- `loi` = câu cốt lõi (`btvn_cau.loi = 1`) của một bài chưa xoá. `soEmCoSo3Ngay` = số em có BẤT KỲ sổ học trong 3 ngày tới `ngay`.
- Tối đa 11 truy vấn D1 (`soTruyVan`); không ghi gì.
- Test: `tests/buoi-chua-de-xuat-may-chu-2109.test.ts` (14 test, đột biến 25/25 sau bổ sung).
