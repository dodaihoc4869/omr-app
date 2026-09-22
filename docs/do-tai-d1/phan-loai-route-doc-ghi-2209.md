# Phân loại route CHỈ ĐỌC vs CÓ GHI cho Sessions API (Code 3, 22/09, lượt 2)

Boss giao danh sách ~30 route ứng viên cho `DB.withSession('first-unconstrained')` (Sessions API D1: Cloudflare tự
chọn bản sao gần nhất thay vì luôn đi primary). Trước khi bọc bất kỳ route nào phải soát TỚI TẬN hàm dùng chung —
một route nhìn "chỉ đọc" ở handler vẫn có thể ghi qua một hàm phụ nó gọi (ví dụ log truy cập). Giao Explore agent
soát từng handler tới tận `.run()`/`.batch()`, không đoán. Kết quả dưới đây.

## Phát hiện quan trọng nhất: HẦU HẾT `/ph/*` KHÔNG chỉ đọc

Mọi route `/ph/*` (trừ `/ph/cap-ma`, `/ph/dem-truy-cap`) gọi `sbdCuaPhuHuynh` → `ghiTruyCap`
(`server/src/ph-truy-cap.ts:31-39`), GHI một dòng đếm truy cập vào bảng `ph_truy_cap` ở **MỌI lượt gọi**, kể cả khi
phần thân route chỉ đọc dữ liệu (`/ph/tat-ca-ve-con`, `/ph/chi-tiet-cau-ve-con`). Route trong danh sách gốc của
Boss (`bang-tin(-song)`, `daily-honors`, `notifications/list`, `hs/lich-su`, `/ph/*`) vì vậy KHÔNG bọc được nguyên
khối — phải soát riêng từng route.

## Bảng phân loại (30 route đã soát)

### CHỈ ĐỌC — đã bọc `envDoc` (Sessions API) trong `index.ts`, 22/09

| Route | Handler | Vì sao an toàn |
|---|---|---|
| `/hs/thi-dua-hom-nay` | `hsThiDuaHomNay` | Chỉ SELECT; đệm 30s là Map bộ nhớ, không phải D1 |
| `/ph/cap-ma` | `phCapMa` | Chỉ SELECT `hoc_sinh`; không gọi `sbdCuaPhuHuynh` |
| `/ph/dem-truy-cap` | `phDemTruyCap` | Ba SELECT trên `ph_truy_cap`, không ghi |
| `/gv/ke-hoach-em` | `gvKeHoachEm` | Đầu tệp ghi rõ "TUYỆT ĐỐI KHÔNG ghi" (test khoá) |
| `/gv/chua-nop` | `gvChuaNop` | Đầu tệp `gv-hom-nay-v2.ts`: "KHÔNG ghi một byte" (test khoá) |
| `/gv/can-giup` | `gvCanGiup` | như trên |
| `/gv/vinh-danh-ngay` | `gvVinhDanhNgay` | như trên |
| `/gv/tim-em` | `gvTimEm` | như trên |
| `/gv/em-toan-canh` | `gvEmToanCanh` | như trên |
| `/gv/lich-su-cau-cua-em` | `gvLichSuCauCuaEm` | Đầu tệp "ĐỌC-CHỈ"; 2 SELECT |
| `/gv/bao-cao-ca` | `gvBaoCaoCa` | Không `.run/.batch` trong 853 dòng; hàm phụ đều đọc |
| `/gv/bao-cao-ca-em` | `gvBaoCaoCaEm` | cùng tệp trên |
| `/gv/bang-tin-song` | `gvBangTinSong` + SELECT `cau_hinh` trước đó | Không ghi (grep xác nhận); đệm là biến module-level, không khoá theo `env` |
| `/gv/lop` | `gvLop` | Chỉ SELECT `hoc_sinh`/`danh_sach` |
| `/gv/buoi-chua-de-xuat` | `gvBuoiChuaDeXuat` | Không ghi trong tệp; `protectedQuestions` dùng cũng chỉ đọc |
| `/gv/bang-tin` | `gvBangTin` + `gvChuaHocHomNay` | Không ghi trong 502 dòng, mọi hàm phụ đọc |

### CÓ GHI (trực tiếp hoặc gián tiếp) — GIỮ NGUYÊN `env` (primary), không bọc

| Route | Vì sao |
|---|---|
| `/daily-honors` | Nhánh 0-người-thắng đệ quy `dailyHonors(env,false)` → `INSERT ... ON CONFLICT` |
| `/hs/lich-su` | Chấm bù tự động khi thiếu `chi_tiet_cau` → `env.DB.batch()` ghi + `ghiSuKienThi` |
| `/ph/xac-dinh`, `/ph/ke-hoach`, `/ph/canh-bao/xem`, `/ph/thoi-gian-hoc`, `/ph/giao-them`, `/ph/tat-ca-ve-con`, `/ph/chi-tiet-cau-ve-con` | Đều gọi `sbdCuaPhuHuynh` → `ghiTruyCap` ghi `ph_truy_cap` mỗi lượt (một số còn ghi thêm: `/ph/ke-hoach` ghi `ke_hoach_ngay`, `/ph/giao-them` ghi bài tập mới) |
| `/gv/canh-bao-nop-bai` | `env.DB.batch()` INSERT cảnh báo |
| `/gv/nhac-tu-dong` | Ghi `cau_hinh` khi gửi kèm tham số bật/tắt |
| `/gv/doi-lop-em` | `UPDATE hoc_sinh SET ten_lop` |
| `/gv/tu-dong-cac-viec` | Đọc-ghi (route tự nhận là "đọc-ghi") |
| `notifications/list` | `syncNotices` ghi `INSERT OR IGNORE INTO student_notice` trước khi đọc lại |

## Thực thi

- `server/src/kieu.ts`: thêm `D1DatabaseSession` + `D1Database.withSession?(...)` (tuỳ chọn — D1 giả trong test có thể bỏ qua).
- `tests/_d1-that.ts`: `dbThat.withSession()` trả nguyên `dbThat` (cùng sqlite trong bộ nhớ) — route dùng Sessions API chạy Y HỆT route không dùng trong test.
- `server/src/index.ts`: `envDoc = env.DB.withSession ? {...env, DB: env.DB.withSession('first-unconstrained')} : env`, tính MỘT lần đầu `fetch`; 16 route ở trên gọi handler bằng `envDoc` thay vì `env`.
- Không đổi bất kỳ route có ghi/đọc-sau-ghi nào — vẫn `env` (primary), không rủi ro đọc dữ liệu vừa ghi từ bản sao trễ.

Đo cục bộ: Sessions API không mô phỏng được replica thật ở local/test (không có nhiều colo) — lợi ích chỉ đo được
trên production qua độ trễ p50/p95 (`nhipDeNghi`, `/gv/suc-khoe-may-chu`) SAU khi đẩy, không đo trước được.
