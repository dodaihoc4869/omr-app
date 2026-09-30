# Hợp đồng API — Tu luyện (29/09/2026)

Màn "Tu luyện" ở Sảnh (cửa `onTuLuyen` của `SanhBanDo`, màn `src/components/tu-luyen/ManTuLuyen.tsx`). Máy chủ: `server/src/tu-luyen.ts`. Bảng: `server/migration-2909-tu-luyen.sql` (CHỈ-THÊM).

Mọi lệnh: `POST /hs/tu-luyen/<lệnh>`, thân JSON có `token` (token học sinh — SBD lấy từ token, không nhận `sbd` trần).

| Lệnh | Vào | Ra |
|---|---|---|
| `nguon` | — | `{ok, khoi, cacCa:[{maCa,tenCa,soCauSai}], soCauSai, loiCauSai, danhMuc:[{lop,bais:[{tenBai,dangs:[{ma,ten,soCau}]}]}], loiDanhMuc, khoCauSai:{tong,tuCa,tuChienDich,loi}, dangThi}` — danh mục chỉ lớp ≤ khối em; `khoCauSai` = kho chế độ 1 (30/09) |
| `xem-truoc` | `{cheDo, dsMaCa?, dsDang?, mucDo?}` | `{ok, tongToiDa, loi?, thongKe?}` (chế độ 2: `thongKe` theo dạng câu sai) |
| `rut` | `{cheDo:1..4, soCau?, dsMaCa?, dsDang?, mucDo?}` | `{ok, luotId, cheDo, tieuDe, taoLuc, tongToiDa, cau: CauCongKhai[]}` — **không đáp án, không lời giải** |
| `nop` | `{luotId, traLoi:{qid:chuỗi}, giay, giayCau?, coGoiY?}` | `{ok, soCau, soDung, diem (thang 10), giay, nopLuc, cau:[{qid,phan,dung,diem,traLoi,dapAn,yDung?,loiGiai?,anDapAn?}]}` |
| `xem-luot` | `{luotId}` (lượt ĐÃ nộp của chính em) | như `nop` (kết quả đã chốt, không chấm lại) + `cauCongKhai` — lượt chưa nộp ⇒ từ chối |
| `tong-hop` | — | `{ok, luot:[…], cau:[…]}` (máy em tính bằng `tongHopTuLuyen`) |

Chế độ ↔ hàm rút cũ (`src/lib/thuat-toan-rut-cau-sai-loi.ts`, giữ nguyên thuật toán):
1. Sửa câu sai — **LUẬT MỚI 30/09 (lệnh thầy)**: `server/src/tu-luyen-cau-sai.ts` — kho = mọi câu em SAI từ 29/09 00:00 (+07) ở ca kiểm tra đã công bố + chiến dịch trong game (sổ `su_kien_hoc`), khử trùng qid + nhóm nội dung, bỏ tự luận/đề bảo vệ/câu rút khỏi kho; chọn chưa luyện → ít lần → lâu nhất; thiếu thì lặp (bản lặp mã `<qid>~2`, tối đa 2 × kho); trộn dễ/khó. `rut` nhận `{cheDo:1, soCau}` (bỏ `dsMaCa`); mỗi câu công khai có thêm `nhanLuyen` ("Luyện lần đầu"/"Luyện lại lần K") và `saiGoc`.
2. Dạng câu sai — `rutDsThemDangCauSai` (kho qua `cauKhacPhucGoi`, phân bổ theo tỉ lệ).
3. Dạng bài — `rutDsDangBai` (tờ `DB-…` qua `deTheoDangBai`, chỉ mã trong danh mục của em).
4. Tự do — `rutDsTuDo` (bộ lọc Ngẫu nhiên / 2 sao / 1 sao / Lý thuyết / Bài tập của khối cũ).

Luật: không rút tự luận (`laCauTuLuan`), gỡ câu ca đang bảo vệ (`docBaoVeKho`), em có ca kiểm tra mở ⇒ `rut` trả `khoa:'dang_kiem_tra'`. Chấm: `chamCauTuLuyen` (Phần III = `khopPhanIII`). Nộp lại ⇒ trả kết quả đã chốt. KHÔNG ghi EXP, `su_kien_hoc`, `qid_da_lam`, kế hoạch ngày.

BẢNG TỰ DỰNG: mọi lệnh gọi `damBaoBangTuLuyen` trước (câu `SQL_BANG_TU_LUYEN` = y hệt tệp migration, `IF NOT EXISTS`, một lần mỗi isolate) vì CI deploy không chạy migration. Chạy tay migration (tuỳ chọn): `cd server && npx -y wrangler@latest d1 execute omr --remote --file=migration-2909-tu-luyen.sql`.
