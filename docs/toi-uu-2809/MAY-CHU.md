# Tối ưu máy chủ 28/09 — trước / sau

Nhánh `toi-uu-may-chu` (gốc `origin/main` f1c0704). Nguồn soát: báo cáo BE (mỗi vòng D1 nối tiếp ≈ 300–400 ms).
Đo bằng bộ đếm giả `tests/_dem-vong-d1.ts` (bọc `env.DB`: **vòng** = số lần đi-về D1, **đợt** = số đợt NỐI TIẾP ≈ độ trễ).
Tệp đo `tests/do-toi-uu-may-chu-2809.test.ts` chạy được trên cả hai bản; số "trước" = chạy tệp này trên `origin/main`.

| # | Việc | Chỉ số | Trước | Sau | Test chứng minh |
|---|---|---|---|---|---|
| 1 | Lỗi bất đồng bộ thoát khỏi định tuyến (~40 route `return f()` không await; nhánh GET ngoài try) | 7 route thử với D1/R2 hỏng: trả JSON có CORS | 1/7 (6 ném ⇒ Cloudflare 1101, không CORS) | 7/7 (`{ok:false,error}` 500 + CORS) | `may-chu-loi-bat-dong-bo-2809` |
| 2 | Cờ `cau_hinh` (game_hoa_2, bi_a, trám P08) đọc lại mỗi lượt | truy vấn cờ cho 6 lần đọc trong 1 request | 6 | 1 (đệm 15 s/isolate, xoá khi thầy lưu cờ; cửa GHI P08 vẫn đọc tươi) | `cau-hinh-dem-2809` |
| 3 | `game_v2_attempt` thiếu chỉ mục theo `session` | kế hoạch truy vấn NOT EXISTS mở Đảo | quét bảng / theo sbd | dùng `game_v2_attempt_session(session, sbd)` | `chi-muc-2809` |
| 4a | `/ca/danh-sach` | câu gom `luot` / vòng D1 | quét TOÀN `luot` (cả ca đã xoá), 2 câu nối tiếp; 5 vòng | chỉ `luot` của ca liệt kê (IN + chỉ mục), 1 `DB.batch`; 4 vòng | `do-toi-uu…` › /ca/danh-sach |
| 4b | Sảnh Game Hóa 2.0 (`sanh2`, mở lần 2 trong ngày) | đợt nối tiếp | 7 | 2 | `do-toi-uu…` › Sảnh |
| 4c | `napCau` (6 câu Đảo/Đoàn; `napMot` Bi-a) | truy vấn | 6 (N+1) | 1 (lô ≤ 40 câu) | `do-toi-uu…` › napCau |
| 4d | `protectedQuestions` trong ca thi (em vào/nộp làm vân tay đổi) | lần đọc đề R2 qua 6 lượt, 3 ca | 18 | 3 (đệm theo `bank_r2|cap_nhat_luc`; đẩy lại đề ⇒ đọc lại đúng đề đó) | `do-toi-uu…` › protectedQuestions |
| 4e | `/gv/chien-dich` danh-sach + thongKe (5 chiến dịch, gọi lại trong 60 s) | vòng D1 | 27 | 2 (đệm 60 s theo chữ ký chiến dịch; đóng/sửa ⇒ tính lại) | `do-toi-uu…` › thongKe |
| 5 | DDL lúc chạy (sửa chiến dịch 4 lệnh, buổi học 2, nhận xét ca 1, ngày bắt đầu 1) | vòng mỗi lượt ghi | 4 / 2 / 1 / 1 MỖI lượt | 1 batch lần đầu mỗi isolate, sau đó 0 | `ddl-mot-lan-2809` |
| 4f | `loadProfile` (mọi lệnh game) | đợt đọc mùa + hồ sơ | 2 | 1 | (đổi thứ tự đọc; test game hiện có giữ xanh) |

Ghi chú: loadProfile, docHoSo2 (câu sai ca đã công bố đọc cùng đợt chiến dịch), layKeHoachHomNay (hồ sơ ‖ đếm hôm nay ‖ kế hoạch đã chốt), sanh2 (rương ‖ kế hoạch), docChienDichCuaEm (ngày bắt đầu song song, không JOIN vì bảng phụ có thể chưa có) — đều chỉ đổi THỨ TỰ ĐỌC, không đổi kết quả.

## Chỉ mục (việc 3)
- `server/migration-2809-chi-muc.sql` — CHỈ-THÊM: `CREATE INDEX IF NOT EXISTS game_v2_attempt_session ON game_v2_attempt(session, sbd)`.
- Tạo lúc chạy: `server/src/chi-muc-luc-chay.ts`, gọi trong **cron** (mỗi phút) MỘT lần mỗi isolate — không nằm trên đường lệnh fetch (lệnh đọc-chỉ không có DDL; test "0 ghi" giữ xanh).
- Cỡ bảng: `game_v2_attempt` bị xoá ở reset 21/09 ⇒ ước ≤ vài chục nghìn dòng ⇒ tạo < 1 s. Chưa đếm trên D1 thật (phiên này không chạm D1 thật). Nếu Boss thấy bảng > vài trăm nghìn dòng: chạy tay migration lúc vắng rồi mới deploy.

## Mã chết (việc 6)
Đã gỡ (không nơi gọi trong `src/`, `public/`, `scripts/`, lịch sử git của app; không có tài liệu vận hành):
`/em/cau-sai` (+ hàm `cauSaiCuaEm`), `/ca/bat-dau` (app bắt đầu ca qua `/goi batDauThi` — giữ), `/ca/xoa-vinh-vien` (app xoá qua `/goi` — hàm `G.xoaVinhVienCa` giữ).
Test sửa: `dong-bo-gio-phong-thi` (bỏ `/ca/bat-dau` khỏi vòng kiểm 403). Không test nào chỉ khoá mã chết nên không xoá test nào.

Sửa lỗi phát hiện khi soát: **`/gv/kho-de-giao` bị rơi khỏi định tuyến** (thêm 26/09, mất sau một lần gộp) ⇒ màn "Giao đề theo tuần" báo "Máy chủ chưa có lệnh". Đã nối lại (dùng `env`, vì `luu` có ghi).

GIỮ (lý do):
| Route / tệp | Lý do giữ |
|---|---|
| `/ph/cap-ma`, `/ph/dem-truy-cap` | Lệnh quản trị thầy/Boss gọi tay (docs/token-phu-huynh-1909.md mục 4) |
| `/gv/nhac-tu-dong`, `/gv/tu-dong-cac-viec`, `/ke-hoach/chay-ca-lop` | Chạy tay việc của cron (quản trị) |
| `/ph/thoi-gian-hoc`, `/hs/thoi-gian-hoc` | Hợp đồng API còn ghi trong docs + 3 tệp test hành vi; bỏ cần quyết định sản phẩm (kế hoạch ngày cũ) |
| `/ten-theo-sbd` | `CHUYEN-SANG-MAY-CHU-MOI.command` còn gọi để kiểm máy chủ |
| `/chua-day`, `/da-day`, `/phieu/xoa` | Có thể Apps Script phía Google (không nằm trong repo) còn gọi đồng bộ Sheet/thu hồi phiếu — không kiểm được từ repo |
| `/ca/cham-lai` | Khai trong sổ cổng CNH-1.0 (`cnh-exp-route-gate.ts`), đang chờ nối P07 |
| `/kho/chi-muc-lay` | Thêm 28/09 cho công cụ sửa trình bày kho đề |
| `/hoa2/ph-ngung`, `/ai/*` | Máy khách gỡ 28/09 — app cũ còn trong máy em/PH 1–2 ngày |
| `/hs/thu-thach-hom-nay(/nop)` | `src/` còn gọi (vỏ trả `co:false`) |
| `cnh-exp-assistance.ts`, `cnh-exp-correction.ts`, `cnh-exp-p08-setup.ts`, `hop-dong-chung.ts` | Phần CNH-1.0 đã soát, "CÀI — CHƯA NỐI route"; có test riêng; xoá là mất việc đã duyệt |
| `gv-kho-de-giao.ts` | KHÔNG chết — là lệnh của màn Giao đề theo tuần (đã nối lại) |

## Đề xuất chưa làm
- **Việc 9 (Boss quyết):** `docChienDichCuaEm` quét toàn `chien_dich` + `json_each(sbd_json)` mỗi Sảnh/start — lớn dần theo số chiến dịch. Dùng bảng thành viên `chien_dich_em` (đã có, chỉ-thêm) cần **nạp bù dữ liệu (GHI D1 thật)** cho các chiến dịch cũ rồi đổi câu đọc; không làm trong phiên này.
- `/ca/xac-nhan` dùng `DE.get` chỉ để kiểm có tệp ⇒ `DE.head` (cần thêm `head` vào kiểu `Env.DE` + D1 giả).
- Đoàn Hộ Tống giữ phòng bằng JSON D1 + CAS: dài hạn chuyển Durable Object như Bi-a.
- Đệm cờ chỉ có hiệu lực tức thì ở isolate nhận lệnh lưu cờ; isolate khác trễ ≤ 15 s (trong hạn 30 s thầy cho).
