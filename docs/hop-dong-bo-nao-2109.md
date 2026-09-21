# Hợp đồng BỘ NÃO — các lệnh `/ai/*` (máy chủ ↔ app thầy ↔ hai mã lệnh)

Bên CUNG CẤP (chủ tệp): **Code 1** (`src/lib/bo-nao-*.ts`, `server/src/bo-nao.ts`, `scripts/bo-nao/*`). Bên NỐI route + chạy migration + đẩy Worker: **Code 3** (`server/src/index.ts`). Bên DÙNG: **Code 4** (app thầy). Lập 21/09/2026 theo `prompt-bo-nao.md`, `DE-XUAT-BO-NAO-AI-2109.md`, cẩm nang `bo-nao/HUONG-DAN-BO-NAO.md` (KHUÔN đầu ra).
Kiểu dùng chung: `src/lib/bo-nao-khuon.ts` (`DauRaEm`, `DongBanTin`, `kiemKhuon`, `kiemBanTin`, `HAN_MUC_BO_NAO`) và `src/lib/btvn-nang-do.ts` (`DieuChinhEm`).

## Nguyên tắc
- MỌI lệnh `/ai/*` là **lệnh thầy**: nối SAU cổng `laThay` trong `index.ts` (header `x-ma-bi-mat`). Học sinh / phụ huynh không gọi được.
- **BỘ NÃO TỰ HÀNH (thầy chốt 21/09, thay cho "thầy duyệt")**: khi chế độ hiệu lực của lớp em là `that`, điều chỉnh qua kiểm khuôn và `doTinCay ≥ 0,6` (`HAN_MUC_BO_NAO.NGUONG_TIN_CAY`) được ÁP NGAY (`ap_dung = 1`); dưới 0,6 chỉ ghi sổ. Hôm sau máy chủ TỰ CHẤM (`danhGiaDieuChinh`): `xau_di` ⇒ TỰ GỠ (`huy = 1`, `tu_go = 1`, ghi sổ). Thầy chỉ đọc bản tin ("Đêm qua đã hỗ trợ N em") và có thể bấm "Xem" / "Bỏ điều chỉnh".
- **DEADLINE THẮNG MỌI NÚM**: không núm nào đổi hạn nộp; số chặng ≤ số ngày còn lại; mọi câu lõi chưa làm nằm gọn trong các chặng còn lại. Núm nào làm lõi không kịp hạn bị BỎ và ghi lý do (`ly_do_bo` trong nhật ký). Cài ở lõi `btvn-nang-do.ts` (test tính chất khoá).
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
- `soDieuChinh`: `nhan` = phần tử qua kiểm khuôn; `chiGhiSo` = trong đó độ tin cậy < 0,6 hoặc chế độ bóng (không áp dụng); `biLoai` = sai khuôn.
- **Tự hành (trường tuỳ chọn — thiếu thì app ẩn phần ấy)**: `soEmHoTro` = số em có điều chỉnh ĐÃ ÁP đêm ấy (bóng ⇒ 0). Mỗi dòng có thể thêm: `apDung: boolean` (false = chỉ ghi sổ / bóng) · `ngayDieuChinh: 'YYYY-MM-DD'` (ngày của điều chỉnh mà nút "Bỏ điều chỉnh" nhắm tới; mặc định = `ngay` gốc) · `ketQua` ('an_thua'|'khong_doi'|'xau_di'|'chua_du_du_lieu'|null) + `ketQuaChu` (câu ngắn do MÁY CHỦ ghép từ số đo, ví dụ "hôm qua đúng 7/9 câu, xong 2/2 chặng") của điều chỉnh HÔM QUA cho em ấy · `tuGo: boolean` (`xau_di` ⇒ bộ não đã tự gỡ). Dòng CHỈ-BÁO (không nút "Bỏ"): `loai='thay_xem_lai'` và `loai='can_thay_y'` có `hanhDong='nhan_phu_huynh'` (em vắng ≥ 5 ngày).
- Loại/khuôn dòng bản tin do AI viết: `chu` ≤ 160 ký tự; `hanhDong` ∈ khong|xem_ho_so|goi_len_bang|dua_vao_buoi_chua|nhan_phu_huynh|giao_bai_rieng.

## Nhật ký điều chỉnh của một em — `POST /ai/nhat-ky {sbd}` (chỉ đọc)
```json
{ "ok": true, "sbd": "12007", "hoTen": "Trần Thu Hà",
  "ds": [ { "ngay": "2026-09-22", "hetHan": "2026-09-25", "cheDo": "bong|that", "doTin": 0.8,
            "nhip": { "lech": -2, "khoiDong": 3 },
            "dang": [ { "ma": "ESTE.THUY_PHAN", "hanhDong": "uu_tien", "lyDo": "đúng 7/9 câu" } ],
            "co": "khong|tut_nhip|qua_tai|lam_cho_xong|nghi_chep",
            "loiNhanChoEm": "…", "goiYChoThay": { "chu": "…", "hanhDong": "khong|goi_len_bang|nhan_phu_huynh|giao_bai_rieng", "dang": "…" }, "ghiChuHlv": "…",
            "khacPhuc": [ { "dang": "ESTE.THUY_PHAN", "kieu": "khac_phuc|on_som", "soCau": 3, "bac": "dung_bac|thap_hon_mot_bac" } ],
            "apDung": true, "lyDoBo": [], "ketQua": "an_thua|khong_doi|xau_di|chua_du_du_lieu|null", "ketQuaChu": "xong 2/2 chặng, đúng 78 %", "tuGo": false, "daBo": false } ] }
```
`apDung`: đã áp cho em (chế độ thật + tin cậy ≥ 0,6 + chưa gỡ). `lyDoBo`: núm bị lõi BTVN BỎ vì làm lõi không kịp hạn (rỗng nếu không). `tuGo`: bộ não tự gỡ vì `xau_di`; `daBo`: thầy bấm "Bỏ". Mới nhất trước, ≤ 14 dòng. `ketQua = null` khi CHƯA được đánh giá (điều chỉnh mới, chưa có ≥ 1 chặng dữ liệu sau nó). `ketQuaChu` là câu ngắn do máy chủ ghép từ số đo (không do AI viết).

## Bỏ một điều chỉnh — `POST /ai/dieu-chinh/bo {sbd, ngay}`
→ `{ok, daBo: boolean}`. Đặt `huy = 1`: điều chỉnh không còn được đọc (nếu đang `that`) và nhật ký ghi `daBo: true`. Điều chỉnh không tồn tại ⇒ `ok:true, daBo:false`. Bỏ rồi bỏ lại: vô hại.

## Hai lệnh cho mã lệnh (`scripts/bo-nao/*`)
**`POST /ai/ho-so-ngay {ngay?, trang?, coTrang?, phan?}`** — dựng hồ sơ ngày THEO YÊU CẦU cho MỘT TRANG em (chưa cần cron). `ngay` mặc định hôm nay (giờ Việt Nam); `trang` từ 1; `coTrang` mặc định 40 (tối đa 60); `phan: 'em'|'lop'` (mặc định `em`).
- `phan:'em'` → `{ok, ngay, trang, soTrang, soEm, cacEm:[{sbd, lop, luong:'nhanh'|'sau'|'vang'|'bo_qua', lyDoLuong:string[], the: TheNgan, hoSo?: HoSoDayDu}]}` — `hoSo` chỉ có khi `luong === 'sau'`. Thẻ được LƯU vào `ai_ho_so_ngay` (để lúc nộp kiểm lại đúng thẻ đó). `TheNgan` / `HoSoDayDu`: `src/lib/bo-nao-dac-trung.ts`.
- `phan:'lop'` → `{ok, ngay, lop: BucTranhLop, doiLuong:[{sbd, luong, lyDoLuong}], tran}` — bức tranh cả lớp + kết quả các điều chỉnh hôm qua. **Gọi CUỐI lượt** (sau mọi trang `phan:'em'`): máy chủ CHỐT LUỒNG CẢ LỚP (`chotLuongCaLop`: luồng sâu ≤ 25 % lớp; dạng cả lớp cùng sai ⇒ `lop.dangCaLopYeu:[{ma, soEm, phanTram, tongSai}]`, ghi MỘT lần ở bản tin lớp và không còn là lý do đẩy từng em vào sâu), ghi luồng/lý do đã chốt vào `ai_ho_so_ngay` và trả `doiLuong` = em đổi luồng/lý do so với luồng tạm ở các trang. `lay.mjs` áp `doiLuong` vào tệp `vao/*.json` (trang gửi luồng TẠM). `tran` = số đo phục vụ báo cáo `{soEmCoThe, toiDaSau, soUngVienSau, soSau}`.
- **Luồng `vang`**: em vắng ≥ 2 ngày. Từ 21/09 (giảm token): vắng **2–4 ngày** ⇒ `lay.mjs` KHÔNG đưa cho AI mà THUẬT TOÁN soạn (`src/lib/bo-nao-vang.ts`, `soanLoiMoiVang`) ⇒ `bo-nao/<ngày>/tu-dong/vang.json` (mảng `DauRaEm`: `doTinCay 0,7`, `nhip {lech −2, khoiDong 3}`, `dang`/`khacPhuc` rỗng, `co 'khong'`, `loiNhanChoEm` từ 8 mẫu luân phiên có số THẬT, tránh 3 lời gần nhất; không lời phụ huynh); vắng **≥ 5 ngày** vẫn vào `vao/vang*.json` cho AI (kèm gợi ý nhắn phụ huynh). `nop.mjs` gộp `tu-dong/vang.json` vào lượt nộp, **phần tử của AI cho cùng bí danh THẮNG**; phần tử tự động cũng qua `kiemKhuon` cục bộ + ở máy chủ như mọi phần tử (máy chủ không phân biệt nguồn — KHÔNG cần đổi gì ở Worker). Cẩm nang gọn cho trợ lý con: `bo-nao/LUAT-RUT-GON.md` (≤ 1.200 chữ; `lay.mjs` chép vào thư mục ngày; test khoá khớp `HAN_MUC_BO_NAO`).
**`POST /ai/dieu-chinh/nop {ngay, cacEm:[{sbd, …DauRaEm bỏ biDanh}], banTin?:{cacDong:[{…DongBanTin, sbd}]}}`** — `cacEm` ≤ 100 phần tử/lượt. Mỗi phần tử: kiểm khuôn với thẻ đã lưu của (sbd, ngày); hợp lệ ⇒ lưu `ai_dieu_chinh` (ghi đè theo (sbd, ngày), `het_han = ngày + 3`); trả `{ok, nhan, chiGhiSo, soApDung, biLoai, loai:[{sbd, lyDo:[…]}], canhBao:[{sbd, canhBao:[…]}], banTin:{nhan, loi:[…], canhBao:[…]}}`. `canhBao` = lỗi chỉ làm mất MỘT LỜI (phụ huynh / thư tuần): phần tử vẫn nhận, phần núm giữ, lời ấy bị làm rỗng (`lamSachDauRa`); số ở `lyDo`/`goiYChoThay`/dòng bản tin chỉ CẢNH BÁO (mềm), số trong lời cho em/phụ huynh/thư tuần là LỖI CỨNG. `banTin` kiểm bằng `kiemBanTin` với số liệu lớp đã lưu; lưu `ai_ban_tin`. Chế độ hiệu lực do lớp của em quyết (ghi cột `che_do`); `bong` ⇒ `ap_dung` luôn 0.

## Bảng D1 (chỉ-thêm; `server/migration-2109-bo-nao.sql`)
- `ai_ho_so_ngay(sbd, ngay, lop, luong, ly_do_luong, the_json, tao_luc, PRIMARY KEY(sbd, ngay))`
- `ai_dieu_chinh(sbd, ngay, json, do_tin, che_do, ap_dung, het_han, huy, tu_go, ly_do_bo, ket_qua, ket_qua_chu, nop_luc, PRIMARY KEY(sbd, ngay))`
- `ai_ban_tin(ngay PRIMARY KEY, json, che_do, nop_luc, so_nhanh, so_sau, so_vang, so_nhan, so_chi_ghi_so, so_bi_loai)`
- Cờ ở `cau_hinh` khoá `bo_nao`.

## `khacPhuc` (khắc phục luôn) — ai làm gì
`DauRaEm.khacPhuc[]` ≤ 2: `{dang, kieu:'khac_phuc'|'on_som', soCau 2–4, bac:'dung_bac'|'thap_hon_mot_bac'}` (`on_som` không mang soCau/bac). `kiemKhuon` kiểm: dạng có trong thẻ, không lặp, soCau nguyên 2–4, bậc hợp lệ.
- `khac_phuc` → cổng `dieuChinh.khacPhuc` của `btvn-nang-do.ts` (`dieuChinhTuDauRa`): rút câu cùng dạng CHƯA giao từ kho của chính bài, chèn vào chặng CHƯA mở kế tiếp, bớt câu riêng dễ nhất để tổng tải không tăng.
- **Đã cài (21/09 chiều)**: `chonBoCuaEm` (lúc chốt bộ: chèn vào chặng ĐẦU) và `thichNghiChangSau` (sau chặng xong: chặng chưa mở đầu tiên = `max(chỉ số vừa xong + 1, soChangDaMo)`; truyền `chiSoChangVuaXong = -1` để áp lên bộ đang chạy khi chưa chặng nào xong). Chèn 2–4 câu cùng dạng CHƯA giao (không lõi, không trong bộ, đúng bậc đích hoặc thấp hơn một bậc, em chưa đúng ≥ 2 ngày) và BỚT đúng bấy nhiêu câu CỦNG CỐ dễ nhất của dạng khác (chặng đích trước) ⇒ tổng tải không tăng; số chặng, lõi, thử thách, chặng đã mở, hạn nộp NGUYÊN. Không đủ câu/không còn câu để bớt ⇒ chèn được bao nhiêu trả bấy nhiêu. Kết quả + lý do: `BoCuaEm.khacPhuc[]` / `KetQuaThichNghi.khacPhuc[]` (`{dang, yeuCau, duoc, vao[], ra[], chang, lyDo}`); chèn thật nằm ở `KetQuaThichNghi.doi` với `loai: 'khac_phuc'` (Code 3 lưu như các thay đổi thích nghi khác; `ly_do_bo` của nhật ký lấy từ `lyDo`). Câu chèn mang nhãn `dang_yeu` (chưa có nhãn riêng). Vắng `khacPhuc` ⇒ kết quả Y HỆT bản không có cổng.
- **Bộ kiểm chỉ cho AI hứa điều làm được**: thẻ mang `coBaiCaNhanDangChay` (đã chốt bộ, chưa nộp/thu hồi/xoá, hạn chưa qua, `so_chang − lo_da_xong ≥ 2`) và `soCauConLaiCungDang` = {mã dạng: [câu chưa giao đúng bậc hiện tại, câu chưa giao thấp hơn một bậc]} (kho − lõi − bộ của em; máy chủ dựng ở `docBaiCaNhan` của `server/src/bo-nao.ts`; lỗi truy vấn ⇒ coi như không có bài). `kiemKhuon`: `khac_phuc` bị loại (cả phần tử) khi thẻ nói không có bài, hoặc ô của dạng < 2, hoặc `soCau` > ô ấy. Thẻ cũ không có trường ⇒ không kiểm. Số ô là cận trên (bậc đích trong bài có thể lệch bậc hồ sơ ±1) — lõi vẫn trả đúng số làm được.
- `on_som` → việc của Code 3 (kế hoạch ngày): kéo `moc_on_ke` của các câu vừa sai thuộc dạng đó về ngày mai — CHỈ SỚM hơn, không bao giờ muộn hơn.

## Lời cho phụ huynh, thư tuần, thẻ và khuôn (21/09 — bổ sung)
- `DauRaEm` có thêm `loiNhanChoPhuHuynh` (≤ 280 ký tự, xưng "Bộ não A.I", gọi "anh chị"/"con") và `thuTuan` (≤ 600, mỗi em một thư/tuần, chỉ khi thẻ có `luotSoiKyTuan`). AI CHỈ được viết `loiNhanChoPhuHuynh` khi thẻ có `khiNaoVietPhuHuynh` ⊂ {`moc_dang_khen`, `vap_lap_da_xu_ly`, `bo_do_2_ngay`, `vang_3_ngay`, `vua_thi`}; trần `TRAN_LOI_PHU_HUYNH_7_NGAY = 2` lời/em/7 ngày (thẻ mang `soLoiPhuHuynh7`, máy chủ đọc từ lịch sử `ai_dieu_chinh`) và "vấp lặp đã xử lý" chỉ hợp lệ với dạng KHÁC dạng trong lời phụ huynh gần nhất (`dangLoiPhuHuynhTruoc`). Máy chủ ghi `loiNhanChoPhuHuynh`/`thuTuan` trong `json` của `ai_dieu_chinh`; tầng đọc của Code 3 (`server/src/bo-nao-doc.ts`, `docLoiNhanCuaEm`) chỉ lấy lời của điều chỉnh `che_do = 'that'`, chưa huỷ, của lớp đang ở chế độ thật ⇒ lời của đêm chạy thử/bóng KHÔNG BAO GIỜ tới em hay phụ huynh.
- **Kiểm khuôn CỨNG chỉ với `loiNhanChoEm`, `loiNhanChoPhuHuynh`, `thuTuan`** (số phải là sự thật trong thẻ; số dính chữ cái như N2, CO2, H2SO4 và cụm cửa sổ 7/3/30 ngày, 1 tuần, 1·3·7 luôn được). `lyDo`, `goiYChoThay.chu`, dòng bản tin: chỉ `canhBao`. Lời PH/thư tuần vi phạm ⇒ chỉ lời ấy bị làm rỗng.
- **Thẻ** (`TheNgan`, `bo-nao-dac-trung.ts`) thêm: `mocReset` (ngày xoá sổ toàn app gần nhất — máy chủ đọc `docMocReset` và truyền vào MỌI dựng hồ sơ; sau reset mấy ngày đầu: không nói "mới vào", tụt nhịp giả bị chặn, lời phụ huynh hạn chế tới hết tuần đầu), `hoatDong.sauXoaSo`, `loiNhanGanDay` (≤ 3 lời gần nhất cho em — chống lặp), `mocDangKhen`, `khiNaoVietPhuHuynh`, `luotSoiKyTuan`, `loiPhuHuynh7`. Tệp cho AI dùng THẺ NÉN (`src/lib/bo-nao-nen.ts`: `nenThe`/`nenHoSo`/`nenTheVang`), thẻ ĐẦY ĐỦ ở `.the-day-du.json` (AI không mở) để `kiemKhuon` cục bộ.
- Ngưỡng luồng nằm trong `NGUONG_BO_NAO` (`bo-nao-dac-trung.ts`); mọi giới hạn độ dài/số lượng nằm trong `HAN_MUC_BO_NAO` (`bo-nao-khuon.ts`) và được test so với cẩm nang + `LUAT-RUT-GON.md`.

## Việc SAU (chế độ `that`, Code 3 — không thuộc đợt này)
Kế hoạch ngày + BTVN nâng đỡ đọc `ai_dieu_chinh` còn hạn, chưa huỷ (`huy = 0`), `ap_dung = 1` qua cổng `dieuChinh` của `chonBoCuaEm` (`dieuChinhTuDauRa`); `/hs/ke-hoach-ngay` trả `loiNhanHlv`. Cron 03:30 dựng hồ sơ ngày.
