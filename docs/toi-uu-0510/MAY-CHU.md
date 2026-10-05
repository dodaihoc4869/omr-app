# Tối ưu 05/10 — MÁY CHỦ (Worker + D1): bớt đợt D1 nối tiếp, KHÔNG đổi kết quả

Thầy duyệt "Làm 1 và 2" — việc (1) = tối ưu máy chủ, KHÔNG đụng giao diện. Thầy dặn "Chưa đẩy gì nhé" ⇒ chỉ commit trong nhánh này:
không push, không deploy, không chạm D1/R2 thật, không migration (làn này KHÔNG thêm bảng/cột nào). Chỉ sửa `server/src/**`, tệp đo
`tests/do-toi-uu-0510-may-chu.test.ts` và tệp này.

## Đo thế nào

- Công cụ: `tests/do-toi-uu-0510-may-chu.test.ts` — D1 THẬT trên `node:sqlite` (`tests/_d1-that.ts`, nạp mọi migration) với dữ liệu gần
  thật (một lớp nhiều em, kho đề + chỉ mục game, sổ học nhiều ngày, câu sai đang chờ làm lại, chiến dịch, bài đã dạy, Đoàn, cửa hàng, vàng…),
  gọi `worker.fetch` ĐÚNG như app (token thật), hai kịch bản: OMNI TẮT rồi OMNI BẬT. Giờ giả cố định, ngẫu nhiên có hạt ⇒ chạy lại ra y hệt.
- Mỗi lệnh đo:
  - **vòng** = số lượt gọi D1 (mỗi `first/all/run`, hoặc một `batch` = 1 vòng);
  - **đợt** = số đợt NỐI TIẾP trên đường găng (lượt gọi chạy song song tính chung một đợt; mỗi lượt có độ trễ giả 25 ms để lộ thứ tự chờ).
    Việc nền (`ctx.waitUntil`, chạy sau khi em đã nhận phản hồi) không tính. **Trên D1 thật mỗi đợt ≈ 300–400 ms — đây là số đo CŨ của
    nhóm, không đo lại ở đây; mọi "giây tiết kiệm" dưới đây là ƯỚC TÍNH = số đợt bớt × 0,3–0,4 s;**
  - **ms** = thời gian CPU (Worker + SQLite trong tiến trình, độ trễ giả 0), TRUNG VỊ nhiều lượt chạy XEN KẼ ba bản (cùng tải máy — máy
    đo dùng chung 4 nhân với nhiều làn khác nên số tuyệt đối dao động mạnh, chỉ so tương đối);
  - **KB** = cỡ JSON phản hồi.
- Ba bản:
  - **main** `c74100ef` — bản đang chạy thật;
  - **trước** = nhánh điều phối OMNI `676f0870` (đã gộp main `558c4a4c`: bản vá khối #149 với cổng cuối `chan-khac-khoi`, đổi SBD; đã có
    OMNI 3, thang 4 bậc làm lại câu sai, bộ sinh biến thể, chuyển màn nhanh) — CHƯA có làn này;
  - **SAU** = nhánh này, commit cuối (đã gộp đầu nhánh OMNI `38e4522b`; từ `676f0870` tới đó nhánh OMNI chỉ đổi sổ việc/tài liệu ⇒ mã máy chủ
    của "trước" y hệt đầu nhánh lúc gộp cuối).
- Chạy lại: `DO_KQ=kq.json npx vitest run tests/do-toi-uu-0510-may-chu.test.ts --reporter=dot` (in các dòng `DO|kịch bản|lệnh|vòng|đợt|ms|KB`);
  ghi mẫu phản hồi + ảnh D1: `DO_GHI=mau.json`; so với mẫu: `DO_SO=mau.json` ⇒ in `SO|KHOP|0` khi khớp hết.

## Kết quả (số SAU khi gộp nhánh OMNI mới nhất `676f0870`)

Chuỗi mở app = đăng nhập → Sảnh Hoá 2.0 lần đầu → kế hoạch ngày → academic-sync (cộng đợt từng lệnh). App gọi ba lệnh sau SONG SONG
⇒ "găng mở app" = đợt đăng nhập + đợt của lệnh lâu nhất trong ba lệnh ấy (đây là số em thật sự chờ). Chuỗi chơi = start → 4 lần trả lời →
complete → 2 lần nộp Đoàn.

| Chuỗi (tổng ĐỢT D1 nối tiếp) | main | trước (676f0870) | **SAU** | main ÷ SAU | ước tính bớt so main (× 0,3–0,4 s/đợt) |
|---|---:|---:|---:|---:|---:|
| Mở app · OMNI tắt | 54 | 56 | **23** | **2,35×** ✅ | ≈ 9–12 s cộng dồn |
| Mở app · OMNI bật | 53 | 69 | **28** | **1,89×** ❌ | ≈ 8–10 s cộng dồn |
| Găng mở app · OMNI tắt | 37 | 38 | **14** | 2,64× | ≈ 7–9 s em chờ |
| Găng mở app · OMNI bật | 36 | 37 | **14** | 2,57× | ≈ 7–9 s em chờ |
| Chơi · OMNI tắt | 67 | 75 | **31** | **2,16×** ✅ | ≈ 11–14 s / chuỗi |
| Chơi · OMNI bật | 66 | 119 | **38** | **1,74×** ❌ | ≈ 8–11 s / chuỗi |

Đích "≥ 2× so main": **ĐẠT khi OMNI tắt** (2,35× / 2,16×) và ở găng mở app (2,6× cả hai kịch bản); **KHÔNG ĐẠT khi OMNI bật** sau khi gộp
bản vá khối: 1,89× / 1,74×. Trước khi gộp bản vá khối (SAU `acee7f00` so `5ffab234`), OMNI bật là 25 / 33 đợt = 2,12× / 2,00×; cổng cuối
`chan-khac-khoi` (làn khối — làn này KHÔNG được sửa tệp ấy) thêm lượt đọc khối của câu NỐI TIẾP ở nhiều lệnh (start +4 đợt khi OMNI bật,
Sảnh +2, kế hoạch ngày +1, complete +1…) — bản trước cũng tăng (chuỗi chơi OMNI bật trước 109 → 119, SAU 33 → 38). Xem "Chỗ chưa tốt".

**Hai test ngân sách D1 điều phối báo đỏ trên nhánh OMNI (chưa có làn này) — trên nhánh này đều dưới trần, không nới trần, không bỏ cổng khối:**

| Test | Trần | Nhánh OMNI (điều phối báo) | SAU |
|---|---:|---:|---:|
| `do-cham-dap-an-2909` · ĐO chốt đáp án (answer Đảo 2): đợt câu đúng | 7 | 8 | **2** (vòng 4) |
| `do-toi-uu-may-chu-2809` · Sảnh hoa2 (mở lần 2 trong ngày): đợt | 3 | 4 | **2** (vòng 8; trước commit `cab9e55d`: 3 đợt / 13 vòng) |

Sảnh lần 2 của test 2809 tốn thêm một đợt vì thế giới test THIẾU hai bảng dựng lười (`chien_dich_em`, `loi_giai_hoi`): một câu đọc bảng
thiếu làm hỏng cả lô đọc hồ sơ ⇒ cả lô chạy lại từng câu ở đợt sau. Commit `cab9e55d` (doc-d1-theo-luot.ts): bảng D1 báo
"no such table" được nhớ 60 s trong isolate, câu nhắc bảng ấy đi RIÊNG song song với lô (kết quả y hệt; `xoaMoiDem()` xoá đệm này).

## Bảng từng lệnh

vòng/đợt = số tất định của kịch bản (chạy lại ra y hệt). ms = trung vị thời gian xử lý (JS + SQLite tại chỗ, độ trễ giả 0) qua 5 lượt chạy
xen kẽ ba bản trên máy dùng chung (dao động mạnh — xem hồ sơ CPU ở mục "Chỗ chưa tốt"). KB phản hồi của
SAU BẰNG đúng KB của trước (phản hồi khớp sâu); cột KB so với main (khác main là do tính năng mới của nhánh OMNI, không phải làn này).
Lệnh mới không có ở main ghi "–" (hoặc 0/0 khi main không có lệnh ấy: `/gv/omni`).

### OMNI TẮT

| Lệnh | main vòng/đợt | trước vòng/đợt | SAU vòng/đợt | ms main / trước / SAU | KB main / SAU |
|---|---:|---:|---:|---:|---:|
| dang-nhap | 3/3 | 3/3 | **2/2** | 1.9 / 0.6 / 0.7 | 0.4 / 0.4 |
| hoa2-sanh-1 | 11/11 | 13/12 | **6/5** | 10.8 / 31.2 / 47.9 | 0.5 / 0.5 |
| ke-hoach-ngay | 51/34 | 52/35 | **50/12** | 15.3 / 21.9 / 19.4 | 2.4 / 2.4 |
| academic-sync | 6/6 | 6/6 | **4/4** | 1.0 / 1.2 / 1.5 | 1.8 / 1.8 |
| profile | 8/8 | 8/8 | **2/2** | 1.1 / 1.3 / 1.6 | 2.4 / 2.4 |
| hoa2-sanh-2 | 6/6 | 7/7 | **4/4** | 10.3 / 17.8 / 18.5 | 0.5 / 0.5 |
| recommendations | 4/4 | 6/5 | **4/4** | 9.8 / 20.7 / 15.2 | 0.5 / 0.5 |
| so-tay | 10/10 | 10/10 | **7/7** | 4.4 / 3.2 / 1.9 | 0.1 / 0.1 |
| resume | 2/2 | 2/2 | **2/2** | 0.6 / 0.9 / 0.5 | 0.1 / 0.1 |
| sync | 2/2 | 2/2 | **2/2** | 0.4 / 0.5 / 0.5 | 0.1 / 0.1 |
| start | 10/10 | 18/17 | **12/10** | 12.2 / 24.8 / 25.0 | 2.9 / 4.2 |
| answer-1 | 7/5 | 7/5 | **5/2** | 2.0 / 2.2 / 3.5 | 2.4 / 2.4 |
| answer-2 | 9/8 | 9/8 | **5/2** | 2.8 / 5.5 / 4.1 | 2.4 / 2.4 |
| answer-3 | 7/5 | 7/5 | **5/2** | 2.0 / 2.9 / 3.1 | 2.4 / 2.4 |
| answer-4 | 9/8 | 9/8 | **5/2** | 2.5 / 3.0 / 3.2 | 2.4 / 2.4 |
| complete | 11/11 | 12/12 | **3/3** | 1.0 / 1.4 / 1.3 | 1.8 / 1.8 |
| hoa2-cau-da-lam | 7/7 | 8/8 | **7/7** | 12.8 / 22.6 / 25.1 | 38.2 / 38.7 |
| hoa2-cau-chi-tiet | 30/30 | 31/31 | **5/5** | 13.5 / 23.4 / 17.9 | 9.1 / 9.7 |
| dang-nhap-S02 | 2/2 | 2/2 | **1/1** | 0.7 / 0.7 / 0.9 | 0.4 / 0.4 |
| hoa2-sanh-S02 | 11/11 | 13/12 | **6/5** | 14.9 / 24.9 / 42.3 | 0.6 / 0.6 |
| doan-sanh | 37/37 | 37/37 | **9/9** | 4.3 / 4.7 / 4.5 | 0.7 / 0.7 |
| doan-mo | 35/35 | 34/34 | **26/26** | 15.0 / 22.5 / 23.6 | 0.9 / 0.9 |
| doan-xem-1 | 4/4 | 4/4 | **2/2** | 1.0 / 1.3 / 1.1 | 1.6 / 1.6 |
| doan-nop-1 | 13/12 | 13/12 | **7/5** | 3.7 / 4.6 / 4.2 | 1.8 / 1.8 |
| doan-xem-2 | 3/3 | 3/3 | **1/1** | 1.1 / 1.2 / 1.1 | 1.6 / 1.6 |
| doan-xem-2b | 6/6 | 6/6 | **3/2** | 1.5 / 1.4 / 2.1 | 2.5 / 2.5 |
| doan-nop-2 | 9/8 | 9/8 | **6/5** | 2.5 / 2.6 / 4.3 | 1.9 / 1.9 |
| vang-xem | 8/8 | 8/8 | **6/4** | 1.9 / 2.8 / 2.8 | 0.2 / 0.2 |
| shop-danh-sach | 5/5 | 5/5 | **5/4** | 1.5 / 1.5 / 2.1 | 3.4 / 3.4 |
| luyen-nen | 5/5 | 5/5 | **4/4** | 0.6 / 0.8 / 0.7 | 0.1 / 0.1 |
| ph-tat-ca-ve-con | 19/13 | 19/13 | **19/5** | 33.9 / 42.5 / 30.2 | 4.8 / 5.4 |
| ph-hoc-2 | 9/6 | 11/7 | **10/7** | 10.1 / 17.8 / 25.0 | 0.3 / 0.3 |
| ph-loi-thay | 3/2 | 3/2 | **3/2** | 0.9 / 0.8 / 1.0 | 0.1 / 0.1 |
| gv-omni-co-doc | 0/0 | 1/1 | **1/1** | 0.2 / 0.3 / 0.4 | 0.1 / 0.1 |
| gv-omni-bang | 0/0 | 188/15 | **28/10** | 0.1 / 82.8 / 75.0 | 0.1 / 10.4 |
| gv-chien-dich | 3/2 | 3/2 | **3/2** | 0.9 / 1.3 / 1.1 | 1.7 / 1.7 |
| gv-chien-dich-thong-ke | 23/4 | 23/4 | **23/3** | 15.7 / 21.8 / 24.9 | 2.3 / 2.4 |
| gv-bai-da-day | 1/1 | 6/4 | **6/3** | 0.3 / 1.0 / 1.5 | 0.1 / 0.8 |
| answer-5 | – | 10/9 | **5/2** | – / 3.1 / 3.2 | – |
| answer-6 | – | 6/4 | **5/2** | – / 1.5 / 2.4 | – |
| **TỔNG chuỗi mở app (đợt)** | 71/54 | 74/56 | **62/23** | main÷SAU = 2.35× | |
| **TỔNG chuỗi chơi (đợt)** | 75/67 | 84/75 | **48/31** | main÷SAU = 2.16× | |
| **Găng mở app** (đăng nhập + lâu nhất của 3 lệnh song song) | 37 | 38 | **14** | main÷SAU = 2.64× | |
| ms chuỗi mở app (trung vị) | | | | 29 / 55 / 69 | |
| ms chuỗi chơi (trung vị) | | | | 29 / 47 / 49 | |
| ms TỔNG 38 lệnh có ở cả 3 bản (trung vị, n=5 lượt/bản) | | | | 216 / 423 / 440 | |

### OMNI BẬT

| Lệnh | main vòng/đợt | trước vòng/đợt | SAU vòng/đợt | ms main / trước / SAU | KB main / SAU |
|---|---:|---:|---:|---:|---:|
| dang-nhap | 3/3 | 3/3 | **2/2** | 2.7 / 0.8 / 0.8 | 0.4 / 0.4 |
| hoa2-sanh-1 | 11/11 | 32/26 | **22/10** | 11.2 / 62.4 / 102.0 | 0.5 / 0.9 |
| ke-hoach-ngay | 50/33 | 51/34 | **49/12** | 20.4 / 20.4 / 21.5 | 2.4 / 2.4 |
| academic-sync | 6/6 | 6/6 | **4/4** | 1.3 / 1.4 / 1.3 | 1.8 / 1.6 |
| profile | 8/8 | 8/8 | **2/2** | 1.2 / 1.4 / 1.2 | 2.4 / 2.2 |
| hoa2-sanh-2 | 6/6 | 15/11 | **10/6** | 10.4 / 36.5 / 31.1 | 0.5 / 0.9 |
| recommendations | 4/4 | 15/11 | **10/6** | 9.9 / 36.1 / 30.0 | 0.5 / 0.9 |
| so-tay | 9/9 | 9/9 | **6/6** | 1.7 / 1.9 / 1.6 | 0.1 / 0.1 |
| resume | 2/2 | 2/2 | **2/2** | 0.5 / 0.5 / 0.4 | 0.1 / 0.1 |
| sync | 2/2 | 2/2 | **2/2** | 0.3 / 0.3 / 0.3 | 0.1 / 0.1 |
| start | 10/10 | 24/21 | **16/12** | 13.4 / 37.8 / 34.8 | 2.9 / 4.7 |
| answer-1 | 7/5 | 18/12 | **6/3** | 1.9 / 20.0 / 8.9 | 2.4 / 2.6 |
| answer-2 | 9/8 | 20/15 | **7/3** | 2.3 / 19.7 / 9.9 | 2.4 / 2.5 |
| answer-3 | 7/5 | 18/12 | **7/3** | 1.6 / 19.4 / 7.1 | 2.4 / 2.6 |
| answer-4 | 9/8 | 20/15 | **7/3** | 2.0 / 19.8 / 7.8 | 2.4 / 2.7 |
| complete | 10/10 | 12/12 | **3/3** | 1.1 / 1.8 / 1.9 | 1.8 / 1.9 |
| hoa2-cau-da-lam | 7/7 | 12/10 | **10/8** | 12.5 / 36.6 / 36.1 | 38.2 / 52.1 |
| hoa2-cau-chi-tiet | 30/30 | 35/33 | **8/6** | 11.0 / 29.5 / 30.1 | 9.1 / 9.5 |
| dang-nhap-S02 | 2/2 | 2/2 | **1/1** | 0.6 / 2.3 / 0.8 | 0.4 / 0.4 |
| hoa2-sanh-S02 | 11/11 | 25/20 | **13/7** | 15.3 / 52.8 / 71.2 | 0.6 / 1.0 |
| doan-sanh | 37/37 | 37/37 | **9/9** | 3.1 / 4.8 / 3.5 | 0.7 / 0.7 |
| doan-mo | 35/35 | 39/36 | **30/27** | 11.9 / 31.9 / 31.0 | 0.9 / 0.9 |
| doan-xem-1 | 4/4 | 4/4 | **2/2** | 0.8 / 0.9 / 0.9 | 1.6 / 1.9 |
| doan-nop-1 | 13/12 | 18/16 | **7/5** | 3.0 / 20.8 / 5.3 | 1.8 / 2.0 |
| doan-xem-2 | 3/3 | 3/3 | **1/1** | 0.5 / 0.7 / 0.6 | 1.6 / 1.6 |
| doan-xem-2b | 6/6 | 6/6 | **3/2** | 1.2 / 1.8 / 1.5 | 2.5 / 2.3 |
| doan-nop-2 | 9/8 | 22/16 | **10/6** | 2.2 / 19.5 / 9.3 | 1.9 / 2.2 |
| vang-xem | 8/8 | 8/8 | **6/4** | 2.0 / 3.0 / 2.5 | 0.2 / 0.2 |
| shop-danh-sach | 5/5 | 5/5 | **5/4** | 1.4 / 1.5 / 2.0 | 3.4 / 3.4 |
| luyen-nen | 5/5 | 5/5 | **4/4** | 0.5 / 0.8 / 0.7 | 0.1 / 0.1 |
| ph-tat-ca-ve-con | 19/13 | 19/13 | **19/5** | 27.4 / 30.5 / 39.8 | 4.8 / 5.3 |
| ph-hoc-2 | 9/6 | 32/22 | **28/11** | 10.2 / 40.0 / 43.1 | 0.3 / 0.5 |
| ph-loi-thay | 3/2 | 3/2 | **3/2** | 0.7 / 0.8 / 0.7 | 0.1 / 0.1 |
| gv-omni-co-doc | 0/0 | 1/1 | **1/1** | 0.2 / 0.2 / 0.2 | 0.1 / 0.1 |
| gv-omni-bang | 0/0 | 24/14 | **21/11** | 0.1 / 47.3 / 48.2 | 0.1 / 10.4 |
| gv-chien-dich | 3/2 | 3/2 | **3/2** | 0.7 / 1.1 / 1.0 | 1.7 / 1.7 |
| gv-chien-dich-thong-ke | 23/4 | 23/4 | **23/3** | 14.1 / 22.1 / 21.5 | 2.3 / 2.4 |
| gv-bai-da-day | 1/1 | 6/4 | **6/3** | 0.4 / 1.0 / 1.0 | 0.1 / 0.8 |
| answer-5 | – | 21/16 | **7/3** | – / 20.8 / 10.0 | – |
| answer-6 | – | 17/11 | **7/3** | – / 18.4 / 8.5 | – |
| **TỔNG chuỗi mở app (đợt)** | 70/53 | 92/69 | **77/28** | main÷SAU = 1.89× | |
| **TỔNG chuỗi chơi (đợt)** | 74/66 | 152/119 | **63/38** | main÷SAU = 1.74× | |
| **Găng mở app** (đăng nhập + lâu nhất của 3 lệnh song song) | 36 | 37 | **14** | main÷SAU = 2.57× | |
| ms chuỗi mở app (trung vị) | | | | 36 / 85 / 126 | |
| ms chuỗi chơi (trung vị) | | | | 27 / 159 / 85 | |
| ms TỔNG 38 lệnh có ở cả 3 bản (trung vị, n=5 lượt/bản) | | | | 202 / 630 / 612 | |


## Bằng chứng KHÔNG đổi kết quả

- `DO_SO` (tệp đo trên): phản hồi JSON của MỌI lệnh trong cả hai kịch bản (OMNI tắt + bật) VÀ ảnh chụp TOÀN BỘ D1 sau kịch bản (mọi bảng,
  mọi dòng; chuẩn hoá mốc giờ / uuid / số ngẫu nhiên) của bản SAU **bằng nhau sâu** với bản trước `676f0870`: `SO|KHOP|0`.
- Lần gộp trước đó cũng vậy: `acee7f00` so `5ffab234` — `SO|KHOP|0`; mẫu `5ffab234` trùng TỪNG BYTE mẫu `b6ea3fa8`.
- Mỗi commit tối ưu trước khi gộp cũng đã so `DO_SO` với `132305bc` (nhánh trước khi nhận làn P3): KHỚP.
- Nguyên tắc giữ kết quả: chỉ dời lượt ĐỌC sớm hơn / gộp lô / chạy song song khi không có lệnh GHI nào xen giữa (bản gộp đọc theo lượt
  `gopDocD1`: ghi chờ mọi đọc trước nó, đọc sau ghi chờ ghi xong); đọc đoán trước chỉ là đọc — quyết định vẫn ở đúng chỗ cũ, đoán thừa thì
  bỏ; lô ghi gộp dùng câu có điều kiện (`changes() = 1`, đúng revision, tổng sổ khớp) — không khớp thì câu ấy không đổi gì và đường cũ chạy
  tiếp. Thứ tự await/đường lỗi (lỗi nào báo trước) giữ như cũ.

## Đổi gì (theo commit, đều chỉ ở `server/src/`)

| Commit | Lệnh | Cách làm |
|---|---|---|
| `790d4836` (làn P3, đã soát) | đăng nhập 3→2, Sảnh lần đầu 11→4 | token cấp từ dòng vừa đọc + vào đệm xác thực; lớp em cùng lô hồ sơ; ghi + đọc lại kế hoạch một lô |
| `3aaf009d` | kế hoạch ngày 34→11 | kiểm SBD cùng đợt hai lượt đọc đầu; cờ (phạm vi, EXP, cửa hàng, Đoàn, cảnh báo) đọc đợt đầu; hồ sơ nắm kiến thức đọc cùng sổ; EXP: mọi lượt đọc chỉ phụ thuộc (em, mốc, hôm nay) một đợt, hồ sơ + tổng sổ một lô |
| `10fd48db` | start/answer/complete/doan-nop, profile 8→2, câu chi tiết 30→4, sổ tay 10→7 | câu của lượt đọc cùng phiên (SQL lấy mã đề/phiên bản từ JSON phiên); phần đọc EXP đọc sẵn; khoản EXP câu đúng GHI CÙNG lô chấm; xác thực game cùng đợt đọc đầu; complete 11→2; cổng đóng băng reset chạy song song, MỌI lệnh ghi chờ cổng (rào ghi) |
| `5ab37faa` | Sảnh Đoàn 37→9, trang phụ huynh chính 13→5 | sổ nhớ theo lượt có khai bảng (chỉ lệnh ghi nhắc đúng bảng mới xoá); Sảnh/Đoàn/vé đọc cùng đợt |
| `ef6c447a` | OMNI bật: trả lời 8→3, nộp Đoàn, Sảnh lần đầu 24→8, phụ huynh hoc-2 20→9 | hồ sơ OMNI nhớ theo lượt + đọc cùng đợt; máy em gửi `msLam` (chỉ khi OMNI áp) ⇒ đọc OMNI ngay đợt đầu (quyết định vẫn do `omniBat`); danh sách lớp / phạm vi lớp đang bay dùng chung trong isolate |
| `d964b522` | Bảng bài OMNI 14→9, chiến dịch thống kê 4→3, bài đã dạy 4→3 | chứng chỉ dùng lại chiến dịch vừa đọc; phần thêm sổ của mọi em đọc cùng lúc; mốc thêm em nhận Promise |
| `fdbc9775` | vàng 8→4, cửa hàng 5→4 | cờ cửa hàng (vẫn đọc tươi) vào lô hồ sơ; đúc vàng + đọc lại một lô |
| `acee7f00` | sau gộp thang 4 bậc: start 17→9 (OMNI bật 16→8); trả lời câu đúng OMNI tắt 3→2 | thang làm lại: công tắc, phạm vi + bối cảnh, chỉ mục câu cùng dạng đọc CÙNG đợt nạp câu khi lượt có câu chắc cần câu anh em (`batDauLamLaiKhac`), `lop` của tờ đọc cùng đợt meta; tổng sổ EXP một câu đọc ngay đợt đầu (`docTongSoSom`, mốc mùa lấy trong SQL, JS đối chiếu lại) |
| `cab9e55d` | Sảnh lần 2 (test 2809) 3→2 đợt khi thiếu bảng dựng lười | đệm isolate "bảng chưa có": câu nhắc bảng D1 vừa báo "no such table" đi riêng, lô còn lại không hỏng theo |

Gộp nhánh OMNI (không rebase): `27e0c677` (b6ea3fa8: thang 4 bậc), `f24fa284` (b165d375: bộ sinh biến thể + chuyển màn nhanh), `8180ed78`
(eed47857: bản vá khối #149 / đổi SBD / migration bật OMNI chuyển sang `server/migration-du-lieu/` — gỡ xung đột: `docMetaCau` giữ tách
đọc/dựng và THÊM cột `lop_json`; `startDao2` / `startDoan2` giữ đọc sớm nhãn nợ VÀ cổng cuối `chanKhacKhoiEm`), `1146d5f8` (676f0870: sổ việc),
`9aa1781d` (38e4522b: sổ việc + bảng nghiệm thu phát hành).

Không migration mới, không bảng/cột mới, không đổi hợp đồng API (chỉ THÊM tham số tuỳ chọn ở hàm nội bộ). Không kênh MỚI nào đưa câu cho
em: câu anh em vẫn chọn đúng chỗ cũ (`chonCauAnhEm`, lọc `cauHopKhoi` + `dungKhoi`), chỉ đọc sớm hơn.

## Chỗ chưa tốt / chưa đạt (nói thẳng)

- **OMNI bật: dưới 2× sau khi gộp bản vá khối** (mở app 53 → 28 = 1,89×; chơi 66 → 38 = 1,74×; trước khi gộp bản vá: 2,12× / 2,00×).
  - Cổng cuối `chanKhacKhoiEm` (`server/src/chan-khac-khoi.ts`, làn khối) đọc khối của các câu vừa chọn (`SELECT q.qid, q.ma_de, q.dang, d.lop …`)
    SAU khi chọn xong ⇒ một đợt nối tiếp mỗi chỗ gọi: start (trong kế hoạch và sau khi nạp lượt), Sảnh, kế hoạch ngày, complete,
    phụ huynh hoc-2. Làn này không được sửa tệp ấy và điều phối dặn không mở mảng tối ưu mới lúc sát giờ đẩy. Hướng làm tiếp:
    đọc khối của TẬP câu ứng viên cùng đợt đọc meta kế hoạch (cùng câu SQL, nhớ theo lượt) để cổng dùng lại.
  - Mỗi lần trả lời OMNI bật vẫn 3 đợt — đợt 2 là phần đọc OMNI phụ thuộc kết quả đợt đầu (phạm vi lớp cần lớp của em; β các câu của hồ sơ
    OMNI cần sổ của em). Nộp Đoàn 5–6 đợt vì dòng sổ học và lưu chặng là hai lô GHI nối tiếp (không gộp vào lô chấm: lỗi ghi sổ không được
    làm hỏng lượt chấm).
  - start có HAI câu cần câu anh em (khác dạng): phần meta theo dạng của câu thứ hai chờ câu thứ nhất chọn xong (vòng lặp `apLamLaiKhac` tuần
    tự vì câu sau phải tránh câu/nhóm câu trước đã lấy) — có thể đọc sớm meta của mọi dạng ngay khi có phạm vi (−1 đợt), chưa làm.
- **OMNI tắt, so main về VÒNG**: start 12 vòng > main 10 (đợt 10 = 10) và phụ huynh hoc-2 10/7 > main 9/6 — phần thêm là thang 4 bậc + cổng
  khối (tính năng MỚI; bản trước 18/17 và 11/7). Mọi lệnh khác có ở main đều ≤ main. Các lệnh mới (`/gv/omni` bảng/cờ, `/gv/bai-da-day`, trả lời
  5–6 của thang) không có ở main.
- Chưa làm (vướng làn khối/thang, rủi ro gộp cao): kế hoạch ngày còn 50 vòng / 12 đợt (đọc đầu vào `docDauVao` từng phần); mở chặng Đoàn
  (`doan-mo`) 26 đợt (chọn câu Trùm nối tiếp `chonCauTrum`); sổ tay `readScope`; vòng lặp `docCauLamHomNay`.
- **ms CPU — gần như không đổi so với bản trước (hồ sơ CPU +0,6%; trung vị OMNI tắt +4%, OMNI bật −3%), nhưng CÓ tăng so với main (do
  tính năng mới của nhánh OMNI — bản trước đã ~2× main — không do làn này).** Trung vị thời gian xử lý (5 lượt xen kẽ, máy tải
  nặng — số dao động mạnh): tổng 38 lệnh OMNI tắt main 216 · trước 423 · SAU 440 ms (+4% so với trước); OMNI bật 202 · 630 · 612 ms (−3%).
  Tăng rõ so với trước: Sảnh Hoá 2.0 lần đầu trong ngày (OMNI tắt 31 → 48 ms, bật 62 → 102 ms; em thứ hai 25 → 42, 53 → 71) — cùng hoặc ÍT câu
  SQL hơn, chưa rõ nguyên nhân, để làn sau soi bằng hồ sơ CPU từng lệnh. Giảm rõ: trả lời / nộp Đoàn OMNI bật (19–21 → 5–10 ms mỗi lần),
  trang phụ huynh chính (42 → 30), câu chi tiết (23 → 18), gợi ý (21 → 15). Hồ sơ CPU V8 (`--cpu-prof`) của CẢ lượt đo ở lần gộp trước
  (`acee7f00` so `5ffab234`): mã máy chủ main 5,5 s · trước 10,7 s · SAU 10,8 s (+0,6%); SQLite tại chỗ (phía D1 trên máy thật) 6,8 · 10,7 ·
  11,1 s (+3,7%: đọc đoán trước + câu tổng sổ EXP mỗi lần trả lời).

## Rủi ro khi gộp

- 30 tệp `server/src/` đổi so với nhánh OMNI (nhiều nhất: `exp-d1.ts`, `omni-d1.ts`, `game-v2.ts`, `srs2-d1.ts`, `doc-d1-theo-luot.ts`).
  Hàm xuất ra ngoài GIỮ tên; chỉ THÊM tham số tuỳ chọn ở cuối (vd. `apLamLaiKhac(…, som?)`, `metaTheoDang(…, som?)`, `trangThaiLop(…, themLucVao?)`,
  `capNhatChungChi(…, cdSan?)`) và thêm hàm mới (`batDauLamLaiKhac`, `docChiMucTheoDang`, `docTongSoSom`, `docSomOmniTraLoi`, `daNho`…). Bỏ đúng một
  hàm xuất do chính làn này thêm trước đó (`docTongSoTruocKhoanGame`, thay bằng `docTongSoSom`; không nơi nào khác dùng).
- Làn KHỐI: không sửa `src/lib/khoi-cau.ts`, `server/src/chan-khac-khoi.ts`; không thêm kênh đưa câu/danh sách câu nào; mọi chỗ gọi cổng cuối
  của nhánh OMNI giữ nguyên (hai chỗ xung đột ở `srs2-game.ts` đã gỡ: giữ cả cổng lẫn phần đọc sớm). Câu anh em vẫn chọn đúng chỗ cũ
  (`chonCauAnhEm`: `cauHopKhoi` + `dungKhoi`) rồi qua cổng cuối ở `startDao2`/`startDoan2`.
- Bộ sinh biến thể (`bien-the-sinh.ts`, chưa nối): khi nối thêm một bậc TRƯỚC câu anh em, đọc sớm của thang có thể đọc thừa (chỉ phí vài lượt
  đọc) — `apLamLaiKhac` vẫn quyết y hệt; nên cho `batDauLamLaiKhac` biết bậc mới để khỏi đọc thừa.
- Đọc đoán trước đúng nghĩa "đọc": đoán sai ⇒ thêm vòng D1 (không thêm đợt, không đổi kết quả). Mỗi lần trả lời thêm một câu tổng sổ EXP
  (theo `sbd`, có chỉ mục) trong lô đọc đầu — không thêm vòng.
- Rào ghi của cổng đóng băng reset (`reset-toan-app.ts`, `raoGhiD1`): lệnh ghi chỉ tới D1 sau khi cổng báo mở; cổng báo đóng băng ⇒ trả đúng lời cũ, không ghi.
- Đệm "bảng chưa có" (`doc-d1-theo-luot.ts`, 60 s/isolate): ngay sau khi bảng được tạo (DDL), câu nhắc bảng ấy còn đi riêng tối đa 60 s —
  thêm vòng D1, không thêm đợt, không đổi kết quả. Trên D1 thật đủ bảng thì đệm luôn rỗng (đường cũ y hệt).

## Test (chạy SAU khi gộp nhánh OMNI `676f0870`, trên mã `cab9e55d` — các lần gộp sau chỉ đổi tài liệu)

- 246 tệp test liên quan (`npx vitest run <tệp…> --reporter=dot`, lô 40 tệp): mọi tệp test máy chủ của các tệp đã sửa (EXP, game-v2,
  Đoàn, Bi-a, srs2/kế hoạch ngày, OMNI 3 `omni-3-*`, chiến dịch/bảng thầy, phụ huynh, cửa hàng/vàng, reset `reset-toan-app-1909`,
  `reset-hoa2-2709`, hai test ngân sách `do-toi-uu-may-chu-2809`, `do-cham-dap-an-2909`), 6 tệp thang làm lại (`lam-lai-cau-sai-0510-d1/-thuan/-do-phu`,
  `cau-bo-tro-gop-0510`, `chat-luong-loi-0510`, `may-soan-hoc-lieu-0510`), mọi tệp test do lần gộp đổi + mọi tệp test luật khối
  (`chan-khac-khoi-0510`, `chan-khac-khoi-kenh-0510`, `chan-khac-khoi-omni-*`, `khoi-cau`…): **3801/3829 test xanh; 31 tên đỏ — 30 có trong nền
  `nen-do-ac234db2.txt`; tên còn lại `dao-bao-nham-ca-2909` "bàn Bi-a bỏ dở quá 30 phút…" phụ thuộc GIỜ CHẠY** (lấy `Date.now()` + 40 phút: chạy
  23:20–24:00 giờ VN thì qua ngày mới ⇒ kế hoạch ngày khác) — ĐỎ Y HỆT trên `676f0870` không có làn này lúc ấy; chạy lại lúc 17:01 UTC (00:01 giờ VN): 7/7 xanh trên cả SAU lẫn `676f0870`.
- 10 tệp `d1-runtime-*` (workerd thật, `npx vitest run -c vitest.config.d1.ts`): 95/97 — 2 test đỏ của `d1-runtime-lo-dap-an-kho.test.ts`
  ĐỎ Y HỆT trên nhánh OMNI `676f0870` KHÔNG có làn này (có từ lần gộp bản vá khối; trước đó 97/97 xanh) ⇒ không do làn này.
- `(cd server && npx tsc --noEmit -p .)` và `npx tsc -b`: sạch.
