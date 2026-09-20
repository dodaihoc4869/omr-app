# Hợp đồng BỘ NÃO — các lệnh `/ai/*` (máy chủ ↔ app thầy ↔ hai mã lệnh)

Bên CUNG CẤP (chủ tệp): **Code 1** (`src/lib/bo-nao-*.ts`, `server/src/bo-nao.ts`, `scripts/bo-nao/*`). Bên NỐI route + chạy migration + đẩy Worker: **Code 3** (`server/src/index.ts`). Bên DÙNG: **Code 4** (app thầy). Lập 21/09/2026 theo `prompt-bo-nao.md`, `DE-XUAT-BO-NAO-AI-2109.md`, cẩm nang `bo-nao/HUONG-DAN-BO-NAO.md` (KHUÔN đầu ra).
Kiểu dùng chung: `src/lib/bo-nao-khuon.ts` (`DauRaEm`, `DongBanTin`, `kiemKhuon`, `kiemBanTin`, `HAN_MUC_BO_NAO`) và `src/lib/btvn-nang-do.ts` (`DieuChinhEm`).

## Nguyên tắc
- MỌI lệnh `/ai/*` là **lệnh thầy**: nối SAU cổng `laThay` trong `index.ts` (header `x-ma-bi-mat`). Học sinh / phụ huynh không gọi được.
- **Chế độ BÓNG là mặc định**: điều chỉnh được nhận, kiểm, LƯU; KHÔNG tầng nào (kế hoạch ngày, BTVN nâng đỡ, `/hs/*`) đọc chúng ⇒ `/hs/ke-hoach-ngay` và BTVN của học sinh không đổi một byte (test khoá). Chỉ khi chế độ `that` của lớp em thì tầng đọc (việc SAU, Code 3).
- **Ẩn danh ở đầu máy thầy**: tệp AI đọc chỉ có bí danh; máy chủ chỉ biết SBD. Máy chủ ghép TÊN em từ SBD (`hoTen`) khi trả cho app thầy; AI chỉ viết chữ không tên.
- Máy chủ KIỂM LẦN NỮA bằng `kiemKhuon` (thẻ lưu từ lúc dựng hồ sơ ngày) trước khi lưu. Sai khuôn ⇒ bỏ phần tử ấy, báo lý do; không sửa hộ.
- Mọi lệnh trả `{ok: boolean, error?: string}`; lỗi bằng lời tiếng Việt.

## Cờ cấu hình `cau_hinh.bo_nao` — `POST /ai/cau-hinh`
- Đọc: thân `{}` → `{ok, cauHinh}`. Ghi: thân có ít nhất một trong `bat?: boolean`, `cheDo?: 'bong'|'that'`, `lopThat?: string[]` (trộn vào giá trị cũ) → `{ok, cauHinh}`.
- `cauHinh = { bat: boolean, cheDo: 'bong'|'that', lopThat: string[] }`. **Mặc định** khi chưa có: `{ bat: true, cheDo: 'bong', lopThat: [] }`.
- **Chế độ hiệu lực của một lớp L** = `lopThat.includes(L) ? 'that' : cheDo`. (`bat:false` ⇒ máy chủ vẫn nhận nhưng app thầy ẩn khối; mã lệnh `lay.mjs` báo "đang tắt" và dừng.) Giá trị lạ / `lopThat` quá 50 phần tử hoặc phần tử dài > 60 ký tự ⇒ `ok:false`.

## Đọc bản tin sáng — `POST /ai/dem-qua` (chỉ đọc)
Thân `{}` (tuỳ chọn `ngay: 'YYYY-MM-DD'`, mặc định đêm gần nhất có dữ liệu). Trả:
```json
{ "ok": true, "ngay": "2026-09-22", "chayLanCuoi": "2026-09-22T21:05:11.000Z" , "cheDo": "bong", "bat": true, "lopThat": [],
  "soEm": 120, "soSoiNhanh": 96, "soSoiKy": 18, "soVang": 6,
  "soDieuChinh": { "nhan": 30, "chiGhiSo": 9, "biLoai": 2 },
  "banTin": { "cacDong": [ { "loai": "can_thay_y|ca_lop|goi_len_bang|dieu_chinh|thay_xem_lai", "sbd": "12007", "hoTen": "Trần Thu Hà", "chu": "…", "hanhDong": "khong|goi_len_bang|nhan_phu_huynh|giao_bai_rieng|xem_ho_so", "dang": "…" } ] } }
```
- `chayLanCuoi`: ISO của lần NỘP gần nhất; chưa chạy lần nào ⇒ `null` và `banTin.cacDong = []`. Quá 36 giờ so với bây giờ ⇒ app cảnh báo (app tự tính).
- `banTin.cacDong` ≤ 6 dòng. `sbd` / `hoTen` có thể rỗng (dòng nói về cả lớp); `dang` rỗng nếu không gắn dạng. `chu` KHÔNG chứa tên em (máy chủ ghép `hoTen` riêng).
- `soSoiNhanh` / `soSoiKy` / `soVang`: số em theo luồng đêm ấy (`phanLuong`). `soEm` = tổng em có thẻ đêm ấy.
- `soDieuChinh`: `nhan` = phần tử qua kiểm khuôn; `chiGhiSo` = trong đó độ tin cậy < 0,5 (không áp dụng); `biLoai` = sai khuôn.

## Nhật ký điều chỉnh của một em — `POST /ai/nhat-ky {sbd}` (chỉ đọc)
```json
{ "ok": true, "sbd": "12007", "hoTen": "Trần Thu Hà",
  "ds": [ { "ngay": "2026-09-22", "hetHan": "2026-09-25", "cheDo": "bong|that", "doTin": 0.8,
            "nhip": { "lech": -2, "khoiDong": 3 },
            "dang": [ { "ma": "ESTE.THUY_PHAN", "hanhDong": "uu_tien", "lyDo": "đúng 7/9 câu" } ],
            "co": "khong|tut_nhip|qua_tai|lam_cho_xong|nghi_chep",
            "loiNhanChoEm": "…", "goiYChoThay": { "chu": "…", "hanhDong": "khong|goi_len_bang|nhan_phu_huynh|giao_bai_rieng", "dang": "…" }, "ghiChuHlv": "…",
            "ketQua": "an_thua|khong_doi|xau_di|chua_du_du_lieu|null", "ketQuaChu": "xong 2/2 chặng, đúng 78 %", "daBo": false } ] }
```
Mới nhất trước, ≤ 14 dòng. `ketQua = null` khi CHƯA được đánh giá (điều chỉnh mới, chưa có ≥ 1 chặng dữ liệu sau nó). `ketQuaChu` là câu ngắn do máy chủ ghép từ số đo (không do AI viết).

## Bỏ một điều chỉnh — `POST /ai/dieu-chinh/bo {sbd, ngay}`
→ `{ok, daBo: boolean}`. Đặt `huy = 1`: điều chỉnh không còn được đọc (nếu đang `that`) và nhật ký ghi `daBo: true`. Điều chỉnh không tồn tại ⇒ `ok:true, daBo:false`. Bỏ rồi bỏ lại: vô hại.

## Hai lệnh cho mã lệnh (`scripts/bo-nao/*`)
**`POST /ai/ho-so-ngay {ngay?, trang?, coTrang?, phan?}`** — dựng hồ sơ ngày THEO YÊU CẦU cho MỘT TRANG em (chưa cần cron). `ngay` mặc định hôm nay (giờ Việt Nam); `trang` từ 1; `coTrang` mặc định 40 (tối đa 60); `phan: 'em'|'lop'` (mặc định `em`).
- `phan:'em'` → `{ok, ngay, trang, soTrang, soEm, cacEm:[{sbd, lop, luong:'nhanh'|'sau'|'vang'|'bo_qua', lyDoLuong:string[], the: TheNgan, hoSo?: HoSoDayDu}]}` — `hoSo` chỉ có khi `luong === 'sau'`. Thẻ được LƯU vào `ai_ho_so_ngay` (để lúc nộp kiểm lại đúng thẻ đó). `TheNgan` / `HoSoDayDu`: `src/lib/bo-nao-dac-trung.ts`.
- `phan:'lop'` → `{ok, ngay, lop: BucTranhLop}` (bức tranh cả lớp + kết quả các điều chỉnh hôm qua).
**`POST /ai/dieu-chinh/nop {ngay, cacEm:[{sbd, …DauRaEm bỏ biDanh}], banTin?:{cacDong:[{…DongBanTin, sbd}]}}`** — `cacEm` ≤ 100 phần tử/lượt. Mỗi phần tử: kiểm khuôn với thẻ đã lưu của (sbd, ngày); hợp lệ ⇒ lưu `ai_dieu_chinh` (ghi đè theo (sbd, ngày), `het_han = ngày + 3`); trả `{ok, nhan, chiGhiSo, biLoai, loai:[{sbd, lyDo:[…]}]}`. `banTin` kiểm bằng `kiemBanTin` với số liệu lớp đã lưu; lưu `ai_ban_tin`. Chế độ hiệu lực do lớp của em quyết (ghi cột `che_do`); `bong` ⇒ `ap_dung` luôn 0.

## Bảng D1 (chỉ-thêm; `server/migration-2109-bo-nao.sql`)
- `ai_ho_so_ngay(sbd, ngay, lop, luong, ly_do_luong, the_json, tao_luc, PRIMARY KEY(sbd, ngay))`
- `ai_dieu_chinh(sbd, ngay, json, do_tin, che_do, ap_dung, het_han, huy, ket_qua, ket_qua_chu, nop_luc, PRIMARY KEY(sbd, ngay))`
- `ai_ban_tin(ngay PRIMARY KEY, json, che_do, nop_luc, so_nhanh, so_sau, so_vang, so_nhan, so_chi_ghi_so, so_bi_loai)`
- Cờ ở `cau_hinh` khoá `bo_nao`.

## Việc SAU (chế độ `that`, Code 3 — không thuộc đợt này)
Kế hoạch ngày + BTVN nâng đỡ đọc `ai_dieu_chinh` còn hạn, chưa huỷ, `ap_dung = 1` qua cổng `dieuChinh` của `chonBoCuaEm` (`dieuChinhTuDauRa`); `/hs/ke-hoach-ngay` trả `loiNhanHlv`. Cron 03:30 dựng hồ sơ ngày.
