# Hợp đồng THỬ THÁCH RIÊNG HÔM NAY (Bộ não A.I Nấc 1 · V1 + V2) — Code 3 → Code 1 · Code 2 · Code 4, 21/09/2026

Nguồn: `DE-XUAT-BO-NAO-VAI-TRO-MOI-2109.md` (thầy đã chốt 11:31: "Chốt hết, triển luôn để tối nay chạy thật"). Mục tiêu: mỗi em mở app tối nay thấy MỘT thẻ do Bộ não A.I viết riêng cho em — gắn thần thú bằng SỐ THẬT, kèm đúng mấy câu nên làm hôm nay — còn bài tập về nhà, hạn nộp, điểm y nguyên.

## Luật cứng (không ai được đổi)
Thử thách **KHÔNG bắt buộc, không hạn, không tính vào bài tập về nhà**, không đổi hạn nộp/điểm/ca kiểm tra · Bộ não **KHÔNG chọn mã câu** — máy chủ chọn · câu **không tự luận**, **chưa làm trong 14 ngày**, **không vượt bậc + 1**, không thuộc đề thi đang bảo vệ · KHÔNG gửi đáp án xuống máy em trước khi nộp · chấm + ghi sổ + EXP đi **đường có sẵn** của ôn lại (nguồn sổ mới `thu_thach_rieng`), KHÔNG loại thưởng mới · câu sai vào lịch ôn như mọi câu · lời mời chỉ hứa điều chắc chắn, có ≥ 1 số thật trong thẻ, không so em với em, không nhãn năng lực, không doạ, không tên em (bí danh) · dữ liệu cho A.I ẩn danh · trần em ≤ 2 lời Bộ não/ngày (`loiNhanChoEm` sáng + `loiMoi` tối) · cờ tắt `cau_hinh.bo_nao.thuThach` (mặc định BẬT khi chế độ hiệu lực của lớp em là `that`).

## Luồng
1. Bộ não (chạy tay ~18:30, sau này tự động) đọc thẻ `/ai/ho-so-ngay` (nay có thêm `thanThu`) → nộp `/ai/dieu-chinh/nop` với `thuThach` + `loiMoi` trong `DauRaEm` (ghi đè theo (sbd, ngày), như các điều chỉnh khác).
2. Máy chủ kiểm khuôn lần hai; qua ≥ 0,6 tin cậy và chế độ `that` ⇒ áp (`ap_dung = 1`).
3. Em mở app → máy em gọi `POST /hs/thu-thach-hom-nay`: lần đầu trong ngày máy chủ **CHỌN VÀ CHỐT** câu (lưu `thu_thach_rieng`), trả thẻ + câu công khai; các lần sau trả lại đúng các câu đã chốt.
4. Em làm → `POST /hs/thu-thach-hom-nay/nop`: chấm, ghi sổ (`nguon = thu_thach_rieng`), EXP, dựng lại hồ sơ; đáp án chỉ đi ra SAU khi ghi sổ.

## 1 · `/ai/ho-so-ngay` — thẻ thêm SỐ THẬT thần thú (Code 3 dựng, Code 1 dùng)
Thêm khối tuỳ chọn vào `TheNgan` (`src/lib/bo-nao-dac-trung.ts`, Code 1 khai kiểu): 
```json
"thanThu": { "ten": "Rồng Lửa", "cap": 6, "expConThieu": 40, "manhKhien": 3, "manhKhienTong": 12, "chuoiNgay": 4 }
```
`ten` = tên thú của em; `cap` = cấp hiện tại; `expConThieu` = EXP còn thiếu để lên cấp kế; `manhKhien`/`manhKhienTong` = mảnh khiên hiện có / cần để rèn (12); `chuoiNgay` = chuỗi ngày đạt hiện tại. **Ẩn danh**: chỉ tên loài thú, không tên em/nickname. Khoá nào không có số thật thì VẮNG (em chưa chọn thú ⇒ cả khối vắng ⇒ Bộ não không được nhắc tới thú). Số lấy tại lúc dựng thẻ.

## 2 · `/ai/dieu-chinh/nop` — khuôn mới trong `DauRaEm` (Code 1 sửa `src/lib/bo-nao-khuon.ts`; Code 3 gọi lại `kiemKhuon` ở máy chủ)
```json
"thuThach": { "dang": ["ESTE.THUY_PHAN"], "soCau": 6, "bac": "dung_bac" },
"loiMoi": "Rồng Lửa còn thiếu 40 EXP để lên cấp 7. Hôm nay thử 6 câu Thuỷ phân ester, xong là đủ."
```
- `dang`: 1–2 mã dạng, **có trong thẻ**, không lặp. `soCau`: nguyên 3–8. `bac` ∈ `dung_bac` | `thap_hon_mot_bac` | `cao_hon_mot_bac`.
- `loiMoi` ≤ 200 ký tự, phải chứa **ít nhất MỘT con số thật có trong thẻ** (`thanThu.*`, số câu đúng/sai của dạng…); tên thú lấy từ `thanThu.ten` (nếu nhắc thú mà thẻ không có `thanThu` ⇒ bị loại). Không xuống dòng, không tên em, không emoji, không dấu gạch dài, không lời doạ/so sánh (cùng bộ kiểm chữ của `loiNhanChoEm`).
- `thuThach` và `loiMoi` **đi cùng nhau** (thiếu một ⇒ cả hai bị loại, `lyDo` rõ). Sai khuôn ⇒ bỏ CẢ phần thử thách, các phần khác của phần tử vẫn xét như cũ.
- **Cờ**: `POST /ai/cau-hinh` thêm `thuThach?: boolean` (mặc định BẬT). Tắt ⇒ máy chủ vẫn nhận/lưu nhưng không phát thẻ. `cauHinh` trả thêm `thuThach`.
- Trần: `loiNhanChoEm` + `loiMoi` = ≤ 2 lời/em/ngày (mỗi loại một lần vì (sbd, ngày) chỉ có một dòng).

## 2b · Máy chủ áp thử thách khi nào
`ai_dieu_chinh` của (sbd, **hôm nay giờ VN**) có `ap_dung = 1`, `huy = 0`, `thuThach` hợp lệ, cờ `thuThach` bật, và chế độ hiệu lực của lớp em là `that` ⇒ em có thử thách. Không thoả ⇒ `co:false`, app KHÔNG hiện thẻ (im lặng, không lỗi đỏ).

## 3 · `POST /hs/thu-thach-hom-nay` (Code 2 gọi; đăng nhập như `/hs/on-lai/nop`: `{token | sbd, …}`)
Thân `{}`. Trả:
```json
{ "ok": true, "co": true, "ngay": "2026-09-21", "loiMoi": "…", "soCau": 6, "dang": [{ "ma": "ESTE.THUY_PHAN", "ten": "Thuỷ phân ester" }], "bac": "dung_bac",
  "trangThai": "chua_lam|dang_lam|xong", "soDaLam": 0,
  "thanThu": { "ten": "Rồng Lửa", "cap": 6, "expConThieu": 40, "manhKhien": 3, "manhKhienTong": 12, "chuoiNgay": 4 },
  "cau": [ { "qid": "…", "maDe": "…", "phan": "I", "text": "…", "choices": [], "…": "câu công khai như /hs/cau-theo-qid, KHÔNG đáp án" } ],
  "daNop": [ { "qid": "…", "dung": true } ], "thieu": { "soCau": 4, "lyDo": "Dạng này còn ít câu em chưa làm gần đây." } }
```
- `co:false` ⇒ chỉ `{ok:true, co:false}` (app ẩn thẻ). Lỗi đăng nhập ⇒ `{ok:false, error}` như các lệnh `/hs/*`.
- `cau` = các câu CHƯA làm (đã có trong `daNop` thì không lặp lại); `soCau` = số câu đã chốt cho hôm nay. `thieu` chỉ có khi máy chủ chọn được ÍT hơn `thuThach.soCau` (khoá vắng khi đủ). 0 câu chọn được ⇒ `co:false`.
- `thanThu` = số THẬT tại lúc gọi (máy chủ tính lại, không sao chép lời Bộ não) — app dựng thanh tiến độ từ đây; `loiMoi` giữ nguyên chữ của Bộ não.
- Chốt một lần/ngày: gọi lại cùng ngày trả ĐÚNG các câu đã chốt (kể cả khi dữ liệu đổi giữa ngày).

## 4 · `POST /hs/thu-thach-hom-nay/nop` — thân `{ traLoi: [{ qid, dapAn, giay? }] }`
Chỉ nhận qid đã chốt hôm nay cho em này (qid khác ⇒ `khongCo`). Trả **y hệt `/hs/on-lai/nop`**: `{ok, ketQua:[{qid, dung, dapAnDung, loiGiai, anhLoiGiai}], khongCo, chuaLam, tienBo, exp, expNhan?, manhNhan?}` + `trangThai`. Chưa trả lời câu nào thì KHÔNG ghi (vào `chuaLam`), nộp lại cùng câu cùng ngày không đổi kết quả lần đầu.

## 5 · Cách máy chủ CHỌN câu (Code 3; hằng ở `server/src/thu-thach-rieng.ts`)
Với mỗi dạng (soCau chia đều, dạng đầu nhận phần dư): câu cùng dạng ở kho game (`game_v2_question`) · **không tự luận** (`cau-tu-luan`) · **không thuộc đề thi đang bảo vệ** · **đúng bậc**: bậc đích = bậc hiện tại của em ở dạng (`nam_kt_dang.bac`) + {0 | −1 | +1 (tối đa bậc + 1)} theo `bac` · **chưa làm trong 14 ngày** (`qid_da_lam` / sổ) · không nằm trong bộ câu bài tập về nhà đang chạy của em · xáo tất định theo `<sbd>|<ngày>|thu-thach` (cùng ngày cùng kết quả). Thiếu câu ⇒ bớt (ghi `thieu`), 0 câu ⇒ `co:false`.

## 6 · Sổ, EXP, hồ sơ (đường có sẵn — KHÔNG thêm luật thưởng)
`nguon = 'thu_thach_rieng'`, `maNguon = 'thu_thach:<ngày>'` ở `su_kien_hoc`; EXP đúng như `on_lai` (mỗi câu đúng), EXP mới (`capNhatExp`) tính như ôn lại; hồ sơ mạnh–yếu (`dungLaiHoSo`) dùng chung ⇒ câu sai vào lịch ôn 1·3·7. Không mở thêm loại EXP/mảnh khiên; mảnh khiên vẫn "đạt nhiệm vụ ngày +1".

## 7 · Bảng tin của thầy
`/gv/bang-tin.mayDaLam` thêm `{ "loai": "thu_thach_rieng", "so": N, "soDaLam": M, "chu": "N em nhận thử thách riêng · M em đã làm" }` (chỉ khi N > 0): N = số em có thử thách áp hôm nay, M = số em đã nộp ít nhất một câu.

## 8 · Bảng D1 (chỉ-thêm, `server/migration-2109-thu-thach-rieng.sql`)
`thu_thach_rieng(sbd, ngay, dang_json, bac, so_cau, qid_json, loi_moi, tao_luc, PRIMARY KEY(sbd, ngay))` — chốt câu của ngày. Kết quả làm bài lấy từ sổ `su_kien_hoc` (không lặp dữ liệu). Reset toàn app GIỮ bảng này (số liệu vận hành).

## 9 · Phân công · mốc
- **Code 3**: thẻ `thanThu`; áp thử thách khi nhận điều chỉnh; `/hs/thu-thach-hom-nay(+/nop)`; chọn câu; bảng + migration; `mayDaLam`; rà mọi chỗ đọc `bo.loi`/`so_loi` cho "lõi đúng bậc" (theo danh sách Code 1 gửi). Xong 15:30.
- **Code 1**: khai kiểu `thanThu` ở `TheNgan`; sửa `bo-nao-khuon.ts` (`thuThach`, `loiMoi`, luật số thật, cờ), cẩm nang + mã lệnh `lay.mjs`/`nop.mjs` chạy được với khuôn mới; lõi đúng bậc.
- **Code 2 (hoặc 4)**: thẻ ở đầu Bảng nhiệm vụ của em: tiêu đề = `loiMoi`, thanh EXP từ `thanThu`, nút "Làm N câu này" mở màn làm câu (dùng lại màn ôn lại + `traLoi`), trạng thái `xong` ⇒ thẻ đổi thành "Hôm nay em đã làm N câu" với số thật; `co:false`/lỗi ⇒ ẩn thẻ. Lệnh 404 (Worker chưa lên) ⇒ ẩn.
- Mốc: hợp đồng 12:30 · mã ba phía 15:30 · Boss soát 16:30 · Worker + Pages 17:00.
