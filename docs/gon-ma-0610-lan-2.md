# Gọn mã lần 2 — 06/10/2026 (phiên OMNI 3, làn "gọn mã 2")

Lệnh thầy: "Bạn tự làm luôn hết rồi đẩy lên luôn nhé" — xử 105 tệp "chỉ test/công cụ dùng" mà đợt 4 (`13bd7724`) để chờ thầy quyết (`OMNI-3-build-status.md` dòng 183, `SO-VIEC-OMNI-3.md` dòng 190).
Luật làm đợt này: CHỈ xoá cụm đã chứng minh "đã bị thay thế + hết đường dùng"; có script/trang xem thử/cấu hình nhập thật thì GIỮ; nghi ngờ thì GIỮ; mã tài chính/điểm (CNH-1.0 EXP) GIỮ.
Mọi số liệu đo bằng máy (`node scripts/quet-to-mo-coi.mjs`, `git show --numstat`, vitest JSON, sha256 gói dựng, bộ quét Tailwind); không ước.

## 1. Kết quả

| | Trước | Sau |
|---|---|---|
| Tệp nhóm 3 "chỉ test/công cụ dùng" (máy quét) | 105 tệp · 23.882 dòng | 76 tệp · 11.728 dòng |
| Tệp MỒ CÔI (`quet-to-mo-coi.mjs --kiem`) | 0 | 0 (thoát mã 0) |
| Tệp nguồn đã XOÁ | — | **29 tệp · 12.154 dòng** (cụm A 25 tệp / 11.121 dòng · cụm B 4 tệp / 1.033 dòng) |
| Tệp test xoá nguyên | — | **20 tệp** · 4.028 dòng · 323 test (24 đỏ sẵn ở nền) |
| Tệp test chỉ gỡ đúng khối/dòng phụ thuộc | — | **17 tệp** · +41 / −821 dòng · gỡ 79 test + đổi tiêu đề 3 test |
| `tsc -b --force` · `tsc -p server/tsconfig.json --noEmit` | 0 lỗi | 0 lỗi · 0 lỗi |
| Toàn bộ vitest (JSON, so TÊN test đỏ) | 14.480 test · 145 đỏ | 14.078 test · 109 đỏ · **0 tên đỏ mới** (lượt 2; lượt 1 có 6 tên chập chờn, mục 6c) |
| Worker (`wrangler deploy --dry-run`, sha256 `index.js`) | `a836b4b1ade9e5e1…` | **trùng byte** |
| Gói app (518 tệp dist) | — | JS trùng; chỉ `index.css` nhỏ hơn 15.931 byte (mục 6b) |

Ba commit trên nhánh `worktree-agent-ab11cdf3160dbbf1c` (gốc `a0d10318`): `45cbd935` cụm A · `64ac1ab7` cụm B · `08897972` ngoại lệ cổng màu (mục 7, tách riêng để gỡ được độc lập). Chưa push, chưa deploy.

## 2. Cách quyết (để phiên sau lặp lại được)

1. Danh sách: `node scripts/quet-to-mo-coi.mjs --json` → `chiTestCongCu` = 105 tệp.
2. Mỗi tệp: ai nhập. Đảo cạnh đồ thị của chính máy quét; "người dùng THẬT" = tệp không phải test, không thuộc nhóm 3, không phải bộ nhớ đệm graphify (`src/**/graphify-out/cache/stat-index.json`, tệp sinh tự động chỉ nhắc tên). Đóng bao theo cạnh mạnh (nhập thật / chuỗi đường dẫn) ⇒ **55 tệp được giữ vì có người dùng thật** (trang xem thử HTML, script đo, `.claude/m3-xem`, bộ sinh CSS…) hoặc là phụ thuộc của chúng. Còn **50 tệp** "chỉ test + chính nhóm" để xét bằng tài liệu.
3. 50 tệp: đọc `DIEU-PHOI.md`, `DE-XUAT-*`, `prompt-*`, `OMNI-3-build-status.md`, `docs/`, ghi chú đầu tệp, `git log` (lịch sử đã bị gộp phẳng ở `f1fe6315` 30/09 nên ít thông tin). Chỉ XOÁ khi (a) có chỗ ghi rõ "đã thay" / "mã chết … lô dọn", (b) không còn người dùng ngoài test (máy quét + `grep` độc lập toàn kho + dựng gói), (c) không có ghi chú "chờ nối / sẽ dùng sau".
4. Test: tệp test nhập CHỈ tệp bị xoá ⇒ xoá nguyên tệp; nhập cả tệp còn sống ⇒ gỡ đúng `it` / `describe` / dòng nhập phụ thuộc, khối còn lại giữ NGUYÊN từng dòng (dựng lại bằng script cắt theo số dòng có kiểm mốc, không gõ lại); test đọc chữ nguồn tệp bị xoá ⇒ gỡ khối đó. Không nới / đổi assertion nào của phần giữ.
5. Bắt ràng buộc ngầm mà đồ thị nhập không thấy: danh sách đường dẫn trong test (`khong-dung-bien-truoc-khi-khai` đòi mỗi tên trong danh sách PHẢI còn bị oxlint báo ⇒ tệp mất thì dòng phải mất theo), `readdirSync` thư mục sắp biến mất (`nhip-may-thay-2109`), bảng xếp loại (`nhip-bang-2109`), `it.each` theo tên tệp (`tu-ngu-cum4-2109`), cổng màu so văn bản (mục 7), và Tailwind quét mọi tệp (mục 6b).

## 3. Bảng cụm → phân loại → bằng chứng

Loại: **1** đã bị thay thế, hết đường dùng (xoá) · **2** đã duyệt nhưng chưa nối / sẽ dùng sau (giữ) · **3** nhạy cảm tài chính/điểm (giữ) · **T** có script/HTML/cấu hình dùng thật (giữ).

| Cụm | Tệp · dòng | Loại | Quyết định | Bằng chứng (đường dẫn · dòng) |
|---|---|---|---|---|
| **A** Game Thần thú v1: `components/{ThanThuHoaHocGame,ThanThu3D,DauTruongChanLy,CauHoiTrongGame,KhungLoiGiaiGame,OngNghiemExp,PopupThuongExp}.tsx` (7) + `game/than-thu-hoa-hoc/*` (17; còn `kinh-nghiem.ts`, `hinh-thai.ts` là mã sống) + `lib/anh-than-thu.ts` | 25 · 11.121 | 1 | **XOÁ** | `src/screens/StudentPortalScreen.tsx:80` nạp `game/than-thu-v2/Game` dưới tên biến cũ `ThanThuHoaHocGame`; `docs/ra-soat-du-thua-2109.md:67` (D1 "BỎ cụm cũ, giữ 5 tệp còn sống"); `docs/toi-uu-2809/MA-CHET.md:31,45-46,83-99` ("đã thay bằng than-thu-v2"; điều kiện xoá = tách test trộn trước — lần này đã tách); `SO-VIEC-GIAO-DIEN.md:503` ("Mã chết … KHÔNG chạy trên app thật … nên xoá ở đợt dọn"); `docs/kiem-toan-exp-toan-he-thong-2309.md:82`. Võ đài nay là `game/than-thu-v2/EscortRoom.tsx` (chữ "Dùng chiêu này", "Tải lại phòng" chỉ còn ở đó). `lib/anh-than-thu.ts`: người gọi sống đã chuyển sang `anh-than-thu-v2` (`GoiLenBangScreen.tsx:1195`, `BangVinhDanh.tsx:5`). 0 người dùng ngoài test; 24 test đỏ sẵn ở nền nằm trong phần test đã xoá (không ai bảo trì). |
| **B1** Báo cáo xem điểm cũ của thầy: `components/xem-diem-gv/{BaoCaoCaLop.tsx,BaoCaoMotEm.tsx,xem-diem-gv.css}` | 3 · 942 | 1 | **XOÁ** | `src/components/ca-thi/BaoCaoChiTiet.tsx:1-2` ("bản vẽ thầy chốt 28/09/2026 … THAY giao diện báo cáo cũ của thầy (khối gập BaoCaoCaLop + trang BaoCaoMotEm)"); `tests/ca-thi-man-moi-2809.test.tsx:2`; chú thích cũ ở `tests/bao-cao-ca-khoi-2109.test.tsx` ("Khối gập đã THAY bằng màn Kết thúc ca + Báo cáo chi tiết"). Số thuần `lib/bao-cao-ca-lop.ts`, `lib/bao-cao-mot-em.ts` còn sống nên GIỮ. |
| **B2** Thẻ "Ca kiểm tra gần nhất của con" của app phụ huynh cũ: `components/xem-diem/TheCaGanNhat.tsx` | 1 · 91 | 1 | **XOÁ** | `docs/ph-toi-gian-2109.md:3` ("Mã chết mới → lô dọn: `TheCaGanNhat.tsx` + …"); chính test của nó ghi "chưa xoá — lô dọn"; app PH nay là `ph-v3` (`docs/APP-PHU-HUYNH-build-status.md:14`). Hàm thuần `lib/the-ca-gan-nhat.ts` còn sống (`lich-su-ca-hs.ts`) nên GIỮ. |
| **C1** CNH-1.0 EXP: `server/src/cnh-exp-{assistance,correction,p08-chuyen-doi,p08-khoi-tao,p08-legacy,p08-setup}.ts` | 6 · 1.958 | 3 | GIỮ | `DIEU-PHOI.md:98-104`: máy chủ thật ở repo `omr-hotfix-2409`; bản trong omr-app là tham chiếu + test. Test khoá chúng giữ nguyên: `cnh-1-0-exp-assistance`, `cnh-1-0-exp-p08-{chuyen-doi,khoi-tao,legacy,setup}`, `boss-exp-correction-review-2409`, `cline-exp-correction-2409`, `d1-runtime-exp-assistance`. |
| **C2** `server/src/hop-dong-chung.ts` | 1 · 93 | 3 + T | GIỮ | `docs/cline-ca-nhan-hoa-2309/TIEN-DO.json` ghi là sản phẩm bàn giao CNH-1.0. |
| **G1** `lib/uoc-luong-thoi-gian.ts` | 1 · 120 | 3 / 2 | GIỮ | Thuộc gói CNH-1.0 đã port (`DIEU-PHOI.md:104`: "55 tệp MỚI … `src/lib/uoc-luong-thoi-gian.ts`"); đặc tả OMNI 3 dùng làm β_j (`DAC-TA-BUILD-OMNI-3-0510.md:110`, `NGHIEN-CUU-THAU-HIEU-VA-CHAC-8-0510.md:116`) ⇒ "sẽ dùng". |
| **D1** Màn phụ huynh kiểu Apple `components/ph-moi/**` + `lib/ph-moi/nhip-ngay.ts` | 31 · 4.004 | 1 nhưng T | GIỮ | ĐÃ thay bằng ph-v3 (`docs/APP-PHU-HUYNH-build-status.md:38` "không còn được /ph dùng — gỡ hẳn là việc riêng") NHƯNG còn 2 công cụ đo nhập: `scripts/do-may-yeu/trang-do.tsx:25-28` và `scripts/kiem-tran-giao-dien-2309.mjs:24-32` (chế độ `ph` / `phbang`). Xoá = làm hỏng hai chế độ đó ⇒ chờ thầy (mục 8). |
| **D2** `BaoCaoCaThiPhuHuynhModal.tsx`, `KhoiBaPhan.tsx`, `TheTienBo.tsx`, `lib/danh-gia-bai.ts` | 4 · 946 | 1 nhưng T | GIỮ | Không còn nơi gọi trong app (`docs/hs-lich-su-ca-2809/SOAT-BAO-CAO.md:41`) NHƯNG `scripts/sinh-m3-tuong-thich.mjs:32,34` quét đúng các tệp này để sinh CSS tương thích M3 (`docs/hs-lich-su-ca-2809/XOA-BAN-CU.md:12`: đã phải thêm `LOP_GIU_LAI` để CSS không mất 25 luật màu) và `.claude/m3-xem/xem.tsx:11,105` nhập `BaoCaoCaThiPhuHuynhModal`. Xoá phải sửa bộ sinh CSS ⇒ đổi gói. |
| **E1** Trang xem thử (`*xem-thu*`, `phong-cho-xem-truoc/*`, `phong-cho/xem-thu.tsx`, `xem-thu/*`, `game/bi-a/xem-thu.tsx`) | 15 · 1.029 | T | GIỮ | Mỗi tệp có `.html` cạnh nó nạp bằng `<script src>` và/hoặc `scripts/preview-bat-linh/games.tsx`, `scripts/kiem-tran-giao-dien-2309.mjs`. |
| **E2** `lib/mo-phong-bang-gia-exp.ts`, `lib/do-tai-loi.ts`, `lib/bang-tin-san/mau-gia.ts`, `game/than-thu-v2/shop/du-lieu-mau.ts` | 4 · 779 | T | GIỮ | `scripts/mo-phong-bang-gia-exp.mjs` (+ `package.json`), `scripts/do-tai.mjs`, `.claude/m3-xem/bts.tsx`, `scripts/do-app-hs/may-chu-gia.ts`. |
| **F1** `components/KhoiLuyenKhacPhuc.tsx` | 1 · 266 | 2 | GIỮ | `docs/ra-soat-du-thua-2109.md:135-137`: "CHƯA làm (có chủ ý) … đợi dòng 'Đã nộp phiếu khắc phục N/M em' ở Theo dõi ca — cần nguồn `khac_phuc` ở `/gv/em-toan-canh` (rồi mới xoá)"; `SO-VIEC-GIAO-VIEN.md:196` "NGHI MẤT TÍNH NĂNG". Chưa có nguồn mới ⇒ chưa nối. |
| **F2** `components/KhoiBtvnLo.tsx`, `components/LogoDDH.tsx` | 2 · 48 | ? | GIỮ | Không tài liệu nào ghi "đã thay": `KhoiBtvnLo` ghi nhận còn dùng ở Hôm nay/Bảng tin (`prompt-btvn-da-giao-thiet-ke-lai-2109.md:26`); `LogoDDH` "lãi quá nhỏ" (`docs/ra-soat-du-thua-2109.md:135`), test nằm lẫn `logo-bo-moi-1909`. Nghi ngờ ⇒ giữ. |
| **G2** `lib/thu-thach-chon-cau.ts`, `lib/lich-on-lai.ts`, `lib/ke-don-chua.ts` | 3 · 273 | 2 / ? | GIỮ | `thu-thach-chon-cau`: test khoá "LUẬT THẦY 05/10" chặn khối 100% (`tests/thu-thach-chon-cau-2109.test.ts:3-4`), `docs/bao-cao-pham-vi-ca-nhan-2309.md:30` "giữ để tương thích/test cũ"; `lich-on-lai`: gốc thiết kế bậc ôn phía máy chủ (`DE-XUAT-CA-NHAN-HOA-1909.md:100,226`, `SO-VIEC.md:50`), chung tệp test `chan-doan-nguyen-nhan` với `ke-don-chua` (không có bằng chứng "đã thay" cho `ke-don-chua`). |
| **G3** `lib/{bai-tap,danh-sach-hs,exam-answer-key,exam-auto-structure,exam-parse,giao-an-len-bang,xep-gio-len-bang,zip}.ts` | 8 · 2.212 | ? | GIỮ | Không tìm thấy tài liệu nào ghi "đã thay" (`grep` md/txt/json: 0 dòng cho `exam-answer-key`, `exam-auto-structure`, `giao-an-len-bang`, `xep-gio-len-bang`, `zip`); `bai-tap` chỉ có ghi chú bỏ hệ Vòng cũ (`SO-VIEC.md:205-230`) còn 4 test khoá phần khác; `danh-sach-hs` giữ gói `xlsx` (`docs/ra-soat-du-thua-2109.md:68`); `MA-CHET.md` (28/09) cũng để GIỮ "luật thuần có thể còn giá trị". |

Cộng GIỮ: 6 + 1 + 1 + 31 + 4 + 15 + 4 + 1 + 2 + 3 + 8 = **76 tệp · 11.728 dòng**; XOÁ 25 + 4 = **29 tệp · 12.154 dòng**; tổng **105 tệp · 23.882 dòng** (đếm `\n`). "55 tệp giữ vì có người dùng thật" = C2 + D1 + D2 + E1 + E2; 50 tệp xét bằng tài liệu = A + B + C1 + F1 + F2 + G1 + G2 + G3.

## 4. Tệp nguồn đã xoá

Cụm A — game Thần thú v1 (25 tệp · 11.121 dòng), commit `45cbd935`

| Tệp | Dòng |
|---|---|
| `src/components/CauHoiTrongGame.tsx` | 99 |
| `src/components/DauTruongChanLy.tsx` | 615 |
| `src/components/KhungLoiGiaiGame.tsx` | 110 |
| `src/components/OngNghiemExp.tsx` | 139 |
| `src/components/PopupThuongExp.tsx` | 127 |
| `src/components/ThanThu3D.tsx` | 366 |
| `src/components/ThanThuHoaHocGame.tsx` | 2.507 |
| `src/game/than-thu-hoa-hoc/am-thanh-pet.ts` | 610 |
| `src/game/than-thu-hoa-hoc/can-bang-thap.ts` | 133 |
| `src/game/than-thu-hoa-hoc/canh-3d-chung.ts` | 138 |
| `src/game/than-thu-hoa-hoc/canh-nen-3d.ts` | 484 |
| `src/game/than-thu-hoa-hoc/cau-hoi-cua-em.ts` | 329 |
| `src/game/than-thu-hoa-hoc/chieu-thuc-3d.ts` | 739 |
| `src/game/than-thu-hoa-hoc/dang-than-thu.ts` | 217 |
| `src/game/than-thu-hoa-hoc/dau-truong-chan-ly.ts` | 706 |
| `src/game/than-thu-hoa-hoc/dong-bo.ts` | 159 |
| `src/game/than-thu-hoa-hoc/dung-than-thu-3d.ts` | 1.560 |
| `src/game/than-thu-hoa-hoc/he-thong-pet.ts` | 324 |
| `src/game/than-thu-hoa-hoc/kho-cau-hoi.ts` | 247 |
| `src/game/than-thu-hoa-hoc/long-thu-3d.ts` | 184 |
| `src/game/than-thu-hoa-hoc/rut-cau-thap.ts` | 285 |
| `src/game/than-thu-hoa-hoc/tan-hu-vo-3d.ts` | 225 |
| `src/game/than-thu-hoa-hoc/tuong-khac.ts` | 256 |
| `src/game/than-thu-hoa-hoc/ve-than-thu.ts` | 404 |
| `src/lib/anh-than-thu.ts` | 158 |

Cụm B — báo cáo xem điểm cũ + thẻ ca gần nhất PH cũ (4 tệp · 1.033 dòng), commit `64ac1ab7`

| Tệp | Dòng |
|---|---|
| `src/components/xem-diem-gv/BaoCaoCaLop.tsx` | 296 |
| `src/components/xem-diem-gv/BaoCaoMotEm.tsx` | 482 |
| `src/components/xem-diem-gv/xem-diem-gv.css` | 164 |
| `src/components/xem-diem/TheCaGanNhat.tsx` | 91 |

## 5. Test đã xoá / sửa

Đo bằng máy: vitest JSON toàn bộ ở worktree sạch TRƯỚC (`a0d10318`: 14.480 test) so với SAU (`08897972`: 14.078 test) — tên từng test ở phụ lục [`docs/gon-ma-0610-lan-2-ten-test.txt`](gon-ma-0610-lan-2-ten-test.txt) (405 tên: **402 test xoá hẳn** + 3 tên cũ của test chỉ đổi tiêu đề; 33 trong số đó đã ĐỎ sẵn ở nền). Không `it` nào của phần giữ bị đổi assertion.

### 5.1 Tệp test xoá nguyên (20 tệp · 323 test · 24 đỏ sẵn ở nền) — chỉ khoá tệp nguồn đã xoá

| Tệp (`tests/…`) | Test | Đỏ nền | Chỉ khoá |
|---|---:|---:|---|
| `anh-bang-vao-game-1609.test.ts` | 9 | 0 | ảnh/bảng trong câu vào game v1 (`cau-hoi-cua-em.ts`) + soi chữ `ThanThuHoaHocGame`, `CauHoiTrongGame` |
| `dau-truong-chan-ly.test.ts` | 40 | 2 | luật Đấu trường chân lý v1 (`dau-truong-chan-ly.ts`, `tuong-khac.ts`) |
| `than-thu-3d.test.ts` | 18 | 3 | mô hình 3D thần thú (`dung-than-thu-3d.ts`, `chieu-thuc-3d.ts`, `he-thong-pet.ts`) |
| `than-thu-am-thanh.test.ts` | 11 | 0 | `am-thanh-pet.ts` |
| `than-thu-cau-hoi-cua-em.test.ts` | 18 | 0 | `cau-hoi-cua-em.ts` (đổi câu sai thành câu chơi) |
| `than-thu-chon-mot-lan.test.tsx` | 9 | 4 | màn chọn thú một lần (`ThanThuHoaHocGame`, `he-thong-pet.ts`) |
| `than-thu-dong-bo-cap-do.test.ts` | 16 | 1 | `dong-bo.ts`, `he-thong-pet.ts` (`kinh-nghiem` chỉ làm đồ phụ) |
| `than-thu-dong-bo-hien-ra.test.tsx` | 16 | 2 | thanh đồng bộ trên màn `ThanThuHoaHocGame` |
| `than-thu-dong-bo-man.test.tsx` | 9 | 1 | nuốt/đẩy hồ sơ ở màn `ThanThuHoaHocGame` |
| `than-thu-dong-bo.test.ts` | 20 | 2 | `dong-bo.ts`, `he-thong-pet.ts` |
| `than-thu-kho-cau-hoi.test.ts` | 10 | 0 | `kho-cau-hoi.ts` (60 câu tháp) |
| `than-thu-khung-ve.test.ts` | 6 | 0 | `ve-than-thu.ts` |
| `than-thu-loi-giai.test.tsx` | 14 | 0 | `KhungLoiGiaiGame.tsx`, `cau-hoi-cua-em.ts`, màn game |
| `than-thu-long-canh.test.ts` | 19 | 1 (chập chờn: 0 ở lượt chạy 38 tệp) | `long-thu-3d.ts`, `canh-nen-3d.ts`, `dung-than-thu-3d.ts` |
| `than-thu-man-dau.test.tsx` | 11 | 0 | màn đấu `ThanThuHoaHocGame` |
| `than-thu-ong-nghiem.test.tsx` | 18 | 0 | `OngNghiemExp.tsx`, `ThanThuHoaHocGame` |
| `than-thu-san-khau.test.ts` | 15 | 0 | `chieu-thuc-3d.ts`, `canh-3d-chung.ts` |
| `than-thu-sau-he.test.ts` | 17 | 8 | `tuong-khac.ts`, `he-thong-pet.ts` |
| `thap-999-va-sao.test.ts` | 16 | 0 | `can-bang-thap.ts`, `rut-cau-thap.ts`, `kho-cau-hoi.ts`, `cau-hoi-cua-em.ts` |
| `bao-cao-mot-em-trang-2109.test.tsx` | 31 | 0 | trang vẽ "Báo cáo một em" của thầy (`xem-diem-gv/BaoCaoMotEm.tsx`) |

### 5.2 Tệp test chỉ gỡ đúng khối/dòng phụ thuộc (17 tệp · gỡ 79 test · đổi tên 3 · 9 trong số gỡ đã đỏ sẵn)

| Tệp (`tests/…`) | Test trước → sau | Đã gỡ | Giữ NGUYÊN (vì sao còn đứng được) |
|---|---|---|---|
| `than-thu-hinh-thai.test.ts` | 31 → 19 | 3 `describe`: "không bịa dữ liệu" (6), "hồ sơ lưu" (3), "tương khắc nguyên tố" (3) — dùng `he-thong-pet.ts` / chữ nguồn `ThanThuHoaHocGame` | "mười hai hình thái" + "kinh nghiệm": khoá `hinh-thai.ts`, `kinh-nghiem.ts` (mã sống: server, `dao-core`, `hap-thu-ngay`) |
| `than-thu-so-exp.test.tsx` | 16 → 5 | 1 `it` đọc hồ sơ qua `vaHoSo` + 4 `describe` (quy đổi, popup, bảng tóm tắt: màn game + `PopupThuongExp`) | "Năm nguồn EXP" + 2 `it` của "Sổ EXP đọc từ máy": chỉ dùng `kinh-nghiem.ts` |
| `than-thu-to-chieu.test.ts` | 16 → 5 | 3 `describe` dùng `anh-than-thu.ts` ("Vẽ thú ra ảnh", "Ảnh 3D", "Đọc hồ sơ cho tờ chiếu") | "Tờ chiếu in ra góc thần thú": khoá `taoHtmlMayChieu` (`html-may-chieu.ts` sống; tờ chiếu nay lấy thú v2 qua `anh-than-thu-v2`) |
| `ten-than-thu-1609.test.ts` | 13 → 3 | "tên sáu thần thú" (6), "âm chưởng tối thượng" (3), 1 `it` lặp `DANH_SACH_THAN_THU` | 3 `it` đọc bảng bậc `TEN_BAC_THEO_THU` ở `hinh-thai.ts` |
| `experiment-catalog.test.tsx` | 7 → 7 | gỡ biến thể `ThanCauGame` (CauHoiTrongGame đã xoá) khỏi một `it` ⇒ đổi tiêu đề `…exams, Mom exercises and game questions` → `…exams and Mom exercises` | biến thể `TheCau`, `MomQuestionStem`: assertion y nguyên (game v2 dựng câu bằng `TheCau`) |
| `bao-cao-ca-khoi-2109.test.tsx` | 21 → 1 | mọi khối vẽ `BaoCaoCaLopKhoi` (20) | 1 khối soi nguồn `ExamMonitorScreen` |
| `bao-cao-may-chu-2109.test.tsx` | 18 → 13 | `describe` "BaoCaoCaLopKhoi có layMayChu" (5) | các khối bộ đọc máy chủ ở `lib/bao-cao-may-chu` |
| `the-ca-gan-nhat-2109.test.tsx` | 15 → 9 | `describe` "TheCaGanNhatCua — vẽ thẻ" (5) + 1 `it` soi nguồn `TheCaGanNhat.tsx` | "chonTheCaGanNhat" (lib sống) + `it` soi `BangNhiemVu.tsx` |
| `an-nhan-nang-luc-hs-ph-2109.test.tsx` | 7 → 7 | 1 dòng `expect` soi `xem-diem-gv/BaoCaoMotEm.tsx` ⇒ đổi tiêu đề bỏ "BaoCaoMotEm" | 2 dòng còn lại của `it` |
| `loi-giai-chuan-react.test.tsx` | 14 → 13 | `it` "KhungLoiGiaiGame (Leo tháp, Săn câu sai)" + entry `BaoCaoMotEm.tsx` khỏi mảng ⇒ đổi tiêu đề bỏ "báo cáo thầy" | mọi `it` khác |
| `tu-ngu-cum4-2109.test.ts` | 25 → 23 | 2 mục khỏi `TEP_HS_PH` (`it.each` theo tên tệp): `ThanThuHoaHocGame.tsx`, `TheCaGanNhat.tsx` | các tệp còn lại trong danh sách |
| `tu-ngu-cum8-2109.test.ts` | 7 → 6 | 1 hàng `KhungLoiGiaiGame.tsx` | 6 hàng còn lại |
| `btn-google-primary-toi-1909.test.ts` | 4 → 4 | bỏ nguồn `ThanThuHoaHocGame.tsx` khỏi một `it` | `StudentPortalScreen` một mình vẫn đủ 6 nút nền riêng ⇒ ngưỡng `≥ 6` giữ NGUYÊN |
| `khong-dung-bien-truoc-khi-khai.test.ts` | 3 → 3 | dòng `DA_RA_SOAT['src/components/ThanThuHoaHocGame.tsx']` | test "danh sách KHÔNG phình ra" đòi mỗi tên trong danh sách còn bị oxlint báo ⇒ tệp mất thì dòng phải mất |
| `chu-thay-hoc-sinh-2809.test.ts` | 6 → 6 | `KhungLoiGiaiGame.tsx` khỏi `TEP` | các tệp còn lại |
| `nhip-bang-2109.test.ts` | 22 → 22 | 2 dòng "MÃ CHẾT" (`DauTruongChanLy`, `ThanThuHoaHocGame`) khỏi `NGOAI_LENH` | luật xếp loại `setInterval` giữ nguyên |
| `nhip-may-thay-2109.test.tsx` | 20 → 20 | thư mục `xem-diem-gv` khỏi vòng `readdirSync` (thư mục không còn) | còn 43 tệp quét, ngưỡng `> 20` giữ NGUYÊN |

Test đỏ ở nền mà phần giữ vẫn còn (4, tên y nguyên, không phải do đợt này): `ten-than-thu-1609` "từ bậc 2 trở lên, bậc nào cũng nêu được THẦN THÚ của nó" · `than-thu-hinh-thai` "BẢNG NGUỒN EXP phải khớp đúng con số trong mã" · `tu-ngu-cum8-2109` hàng `StudentPortalScreen.tsx` · `khong-dung-bien-truoc-khi-khai` "KHÔNG có chỗ vi phạm nào ngoài danh sách đã rà soát".

## 6. Bằng chứng đo (a–d) và đối chứng

Công cụ dựng: `scratchpad/ban-dung.sh` (đồng hồ + mã phiên bản ghim), nhãn `c2-truoc`, `c2-truoc2`, `c2-sau-song`, `c2-sau-gm`; tệp `bd-dist-<nhãn>.txt` (sha256 từng tệp dist), `bd-wk-<nhãn>.sha` (băm Worker) cạnh script.

**a. Kiểu.** `npx tsc -b --force` = 0 lỗi; `npx tsc -p server/tsconfig.json --noEmit` = 0 lỗi (cả hai ở commit `08897972`).

**b. Gói app + Worker.** Hai worktree sạch NẰM CẠNH nhau (cùng độ sâu thư mục — đường dẫn tuyệt đối đi vào thứ tự mô-đun và chú thích đường dẫn của gói; dựng hai worktree khác độ sâu cho Worker khác 14 dòng chú thích `// ../../node_modules/…` dù mã y hệt): `wt-truoc` (`a0d10318`) và `wt-sau` (`08897972`).
- Dựng TRƯỚC hai lần: 518 tệp dist + Worker trùng nhau từng byte ⇒ cách dựng tất định.
- **Worker** `index.js` sha256 `a836b4b1ade9e5e15b14674fabfc5d0d5cb14e367606b63196213c53d35a5740` ở cả TRƯỚC và SAU ⇒ **trùng byte**.
- **Gói app**: 143/518 tệp dist khác tên băm; sau khi chuẩn hoá tên băm (`x-HASH.js` ⇒ `x.js`) chỉ còn **2 tệp khác nội dung**: `assets/index.css` (347.779 → 331.848 ký tự, **−15.931**) và `sw.js` (danh sách precache chứa băm `index.css`). Mọi mảnh JS trùng nội dung.
- Nguyên nhân (đo bằng chính bộ quét Tailwind 4.3.3 `@tailwindcss/oxide` trên hai cây): Tailwind sinh tiện ích theo CHỮ trong MỌI tệp của kho (3.442 tệp quét ở TRƯỚC, 3.393 ở SAU = đúng 49 tệp bị xoá), KHÔNG theo đồ thị nhập. 856 chuỗi ứng viên chỉ nằm trong 29 tệp nguồn + 27 tệp test bị xoá/sửa nên không còn được sinh ⇒ 158 quy tắc tiện ích biến mất (`z-[5]`, `col-span-2`, `bg-slate-950`, `dark:bg-white`, `text-4xl`…) và 3 quy tắc gộp nhóm lại (`.text-slate-300,.text-slate-300\/85{…}` ⇒ `.text-slate-300{…}`); 0 chuỗi mất mà không truy được về tệp xoá/sửa.
- Không mất lớp nào đang dùng: (i) 0 ứng viên bị lược còn xuất hiện ở bất kỳ tệp nào của cây SAU; (ii) mã sống không ghép tên lớp tiện ích Tailwind động (quét `${…}` / nối chuỗi trong `src/`: chỉ có tiền tố CSS tự viết `cd-muc-`, `km-c-`, `bts-`, `hn2-`… — 0 tiền tố kiểu `bg-`/`text-`/`h-`); (iii) cổng điểm ảnh 9 màn học sinh (`do-app-hs.mjs --kich=anh` + `so-anh.mjs`, OMNI tắt, bản dựng TRƯỚC vs SAU): **9/9 trùng khít, 0 điểm ảnh khác**; OMNI bật: **9/9 trùng khít** ở lượt so với ảnh chụp lần hai của bản TRƯỚC (lượt đầu khác ở `7-doan-tran` 9.523 điểm ảnh — chụp CHÍNH bản TRƯỚC hai lần rồi so với nhau cũng khác đúng con số ấy ⇒ nhiễu thời gian của màn Đoàn như đã ghi ở `OMNI-3-build-status.md`, không phải đổi mã).
- **Thí nghiệm đối chứng**: dựng cây SAU nhưng đặt nguyên văn 66 tệp đã xoá/sửa vào `_xacminh-chu-da-xoa/*.txt` (ngoài `src/`, `tests/` nên Vite/tsc/vitest không thấy, Tailwind vẫn quét) ⇒ gói **trùng byte từng tệp với TRƯỚC** (`diff bd-dist-c2-truoc.txt bd-dist-c2-sau-gm.txt` rỗng, 518/518) và Worker trùng. Vậy việc xoá đổi đúng MỘT thứ: các tiện ích CSS chỉ do chữ của tệp chết sinh ra; đồ thị mô-đun, JS, Worker không đổi.
- ⇒ Tiêu chí "gói không đổi byte" KHÔNG đạt nguyên văn cho `index.css` (nhỏ đi 15,9 KB), đạt ở dạng đối chứng. Mỗi cụm là một commit riêng (`45cbd935`, `64ac1ab7`) để phiên chủ hoàn lại nếu không chấp nhận.

**c. Test.** 18 tệp test còn lại được xét (17 đã sửa + `logo-bo-moi-1909` chỉ nhắc tên tệp đã xoá, không sửa): 0 test đỏ mới; đỏ còn lại đúng 4 test đỏ-sẵn-ở-nền nêu ở mục 5.2. `npm run check:mau` sạch (thoát 0). `npm run kiem:mau-giu`: xem mục 7. Toàn bộ vitest (`npx vitest run --reporter=json`, hai lượt SAU):
  - NỀN (`a0d10318`): 14.480 test · 14.288 đạt · 145 đỏ · 47 bỏ qua · 1.050 tệp · 5 tệp lỗi tải sẵn (`cnh-1-0-exp-ledger`, `cnh-1-0-exp-p08-migration`, `cnh-1-0-exp-task`, `cnh-1-0-job030-tro-giup`, `notifications-delivery`).
  - SAU lượt 2 (`08897972`): 14.078 test · 13.922 đạt · **109 đỏ** · 47 bỏ qua · 1.030 tệp · cùng 5 tệp lỗi tải. **Tên đỏ MỚI so với nền = 0.** Đỏ 145 → 109 = −33 (đỏ sẵn của test bị xoá) −3 (chập chờn đã xanh: `de-rieng-ho-so-1909` 500 ms, `sua-ba-muc-1609`, `toi-uu-ca-3009`). Tên test: −405 (402 xoá hẳn + 3 đổi tiêu đề), +3 (tên mới của 3 test đổi tiêu đề).
  - SAU lượt 1 có 6 tên đỏ mới, cả 6 thuộc ba tệp ngẫu nhiên / đo thời gian KHÔNG nhập tệp nào bị xoá — `btvn-nang-do-2109` (2), `btvn-nang-do-lich-gio-2109` (1), `chon-luot-2109` (3) — lúc máy đang bị một phiên khác chạy vitest cùng lúc (tải 7–9). Chạy riêng ba tệp ấy: cây TRƯỚC đỏ 6 tên, cây SAU đỏ ĐÚNG 6 tên y hệt (cùng danh sách), và lượt 2 xanh ⇒ chập chờn có sẵn, không do đợt này.

**d. Máy quét.** `node scripts/quet-to-mo-coi.mjs --kiem` thoát 0: MỒ CÔI 0; "chỉ giữ bởi tham chiếu yếu" vẫn 2 (như trước); nhóm 3: 105 → 76; phạm vi 1.109 → 1.080 tệp.

## 7. Cổng `kiem:mau-giu` — ngoại lệ ĐÓNG (commit riêng `08897972`)

`scripts/kiem-mau-giu-nguyen.mjs` (thầy 05/10: giữ nguyên mọi màu) so VĂN BẢN từng tệp `src/` với mốc `origin/main`, nên xoá nguyên một tệp bị tính là "xoá màu đang có": sau đợt này nó báo **52 vi phạm** `ĐỔI/XOÁ màu đang có` (17 ở `chieu-thuc-3d.ts`, 10 ở `KhungLoiGiaiGame.tsx`, 10 ở `xem-diem-gv.css`, 8 ở `canh-nen-3d.ts`, 3 ở `dung-than-thu-3d.ts`, 2 ở `ThanThuHoaHocGame.tsx`, 2 ở `tan-hu-vo-3d.ts`) — toàn bộ ở tệp KHÔNG vào gói app nào, nên không đổi màu nào của ba app. Đã thêm ngoại lệ: chỉ áp cho trạng thái D (xoá) của đúng 29 đường dẫn liệt kê đủ (không glob); mọi đổi/xoá màu khác vẫn bị bắt (thử âm: đổi một màu ở `xem-diem.css` ⇒ 2 vi phạm, thoát mã 1; trả lại ⇒ 0 vi phạm, thoát mã 0). Sau khi gộp, mốc `origin/main` không còn các tệp này thì danh sách vô hại. Muốn bỏ ngoại lệ: `git revert 08897972` (khi đó cổng đỏ cho tới khi `origin/main` đã chứa bản xoá).

## 8. Việc còn lại cho thầy quyết

1. **`ph-moi` (31 tệp · 4.004 dòng) + ~10 tệp test** (`ph-bang-*-2109`, `ph-moi-*-2109`, `khong-va-cham-lop-css-2109`, `mot-dinh-nghia-cau-da-lam-man-2109`, helper `tests/_ph-moi/`): đã thay bằng ph-v3; xoá được ngay khi thầy đồng ý BỎ (hoặc chuyển sang ph-v3) hai chế độ `ph` / `phbang` của `scripts/do-may-yeu/trang-do.tsx` và `scripts/kiem-tran-giao-dien-2309.mjs`.
2. **`BaoCaoCaThiPhuHuynhModal` + `KhoiBaPhan` + `TheTienBo` + `danh-gia-bai`** (4 tệp · 946 dòng): xoá kèm sửa `scripts/sinh-m3-tuong-thich.mjs` (bỏ khỏi `TEP`, thêm `LOP_GIU_LAI` như `docs/hs-lich-su-ca-2809/XOA-BAN-CU.md`) và `.claude/m3-xem/xem.tsx`; phải chứng minh CSS sinh ra không đổi.
3. **`KhoiLuyenKhacPhuc`** (266 dòng): nối nguồn `khac_phuc` (dòng "Đã nộp phiếu khắc phục N/M em" ở Theo dõi ca) hay bỏ hẳn.
4. **`KhoiBtvnLo`, `LogoDDH`, `thu-thach-chon-cau`, `lich-on-lai`, `ke-don-chua`, `bai-tap`, `danh-sach-hs`, `exam-*`, `giao-an-len-bang`, `xep-gio-len-bang`, `zip`** (13 tệp · 2.533 dòng): chưa có tài liệu nào ghi "đã thay" — thầy cho biết còn cần các luật này không (parse đề, xếp giờ lên bảng, nhập danh sách lớp bằng Excel, nén zip phiếu…).
5. **Ngoại lệ cổng màu** (`08897972`): giữ hay gỡ (mục 7). **Tiêu chí "gói trùng byte"**: chấp nhận dạng đối chứng (mục 6b) hay hoàn lại cụm.

## 9. Ghi chú, còn sót

- `server/src/vo-dai.ts:11` còn chú thích nhắc `src/game/than-thu-hoa-hoc/dau-truong-chan-ly.ts` (đã xoá) — không sửa: tệp làn máy chủ.
- `src/screens/StudentPortalScreen.tsx:80,87` còn tên biến `ThanThuHoaHocGame` nạp game v2 — chỉ là tên biến, không sửa để khỏi đụng tệp lớn.
- Ngoài 105 tệp: `src/components/phong-cho/ChuyenBay.tsx` + `chuyen-bay.css` ("chỉ giữ bởi tham chiếu yếu") là Chuyến bay hoá học đã bị mini-game Bắn nguyên tố thay ở `PhongChoGame.tsx` (`4484d2f7`, 06/10) — ứng viên lần sau, cùng trang xem thử `phong-cho-xem-truoc/*`.
- `src/**/graphify-out/cache/stat-index.json` là bộ nhớ đệm sinh tự động, còn nhắc tên tệp đã xoá — vô hại, không sửa. `package.json`: `three` vẫn dùng ở `bang-tin-san/ban-do-3d-three.ts`, không gỡ gói nào.
- Bài học cho lần xoá sau: Tailwind quét chữ MỌI tệp ⇒ xoá tệp có lớp tiện ích riêng luôn làm `index.css` nhỏ đi (và tệp `docs/*.md` mới cũng có thể sinh tiện ích); đo "gói không đổi" bằng thí nghiệm đối chứng ở mục 6b (đặt nguyên văn tệp đã xoá vào `*.txt` ngoài `src/` và `tests/`).

