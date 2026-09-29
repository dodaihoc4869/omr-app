# Hợp đồng API — Tu luyện (29/09/2026)

Màn "Tu luyện" ở Sảnh (cửa `onTuLuyen` của `SanhBanDo`, màn `src/components/tu-luyen/ManTuLuyen.tsx`). Máy chủ: `server/src/tu-luyen.ts`. Bảng: `server/migration-2909-tu-luyen.sql` (CHỈ-THÊM).

Mọi lệnh: `POST /hs/tu-luyen/<lệnh>`, thân JSON có `token` (token học sinh — SBD lấy từ token, không nhận `sbd` trần).

| Lệnh | Vào | Ra |
|---|---|---|
| `nguon` | — | `{ok, khoi, cacCa:[{maCa,tenCa,soCauSai}], soCauSai, loiCauSai, danhMuc:[{lop,bais:[{tenBai,dangs:[{ma,ten,soCau}]}]}], loiDanhMuc, dangThi}` — danh mục chỉ lớp ≤ khối em |
| `xem-truoc` | `{cheDo, dsMaCa?, dsDang?, mucDo?}` | `{ok, tongToiDa, loi?, thongKe?}` (chế độ 2: `thongKe` theo dạng câu sai) |
| `rut` | `{cheDo:1..4, soCau?, dsMaCa?, dsDang?, mucDo?}` | `{ok, luotId, cheDo, tieuDe, taoLuc, tongToiDa, cau: CauCongKhai[]}` — **không đáp án, không lời giải** |
| `nop` | `{luotId, traLoi:{qid:chuỗi}, giay, giayCau?, coGoiY?}` | `{ok, soCau, soDung, diem (thang 10), giay, nopLuc, cau:[{qid,phan,dung,diem,traLoi,dapAn,yDung?,loiGiai?,anDapAn?}]}` |
| `tong-hop` | — | `{ok, luot:[…], cau:[…]}` (máy em tính bằng `tongHopTuLuyen`) |

Chế độ ↔ hàm rút cũ (`src/lib/thuat-toan-rut-cau-sai-loi.ts`, giữ nguyên thuật toán):
1. Sửa câu sai — `dsCauLamLaiCauSai` (câu sai ở ca đã chọn, qua `hsCauSai`).
2. Dạng câu sai — `rutDsThemDangCauSai` (kho qua `cauKhacPhucGoi`, phân bổ theo tỉ lệ).
3. Dạng bài — `rutDsDangBai` (tờ `DB-…` qua `deTheoDangBai`, chỉ mã trong danh mục của em).
4. Tự do — `rutDsTuDo` (bộ lọc Ngẫu nhiên / 2 sao / 1 sao / Lý thuyết / Bài tập của khối cũ).

Luật: không rút tự luận (`laCauTuLuan`), gỡ câu ca đang bảo vệ (`docBaoVeKho`), em có ca kiểm tra mở ⇒ `rut` trả `khoa:'dang_kiem_tra'`. Chấm: `chamCauTuLuyen` (Phần III = `khopPhanIII`). Nộp lại ⇒ trả kết quả đã chốt. KHÔNG ghi EXP, `su_kien_hoc`, `qid_da_lam`, kế hoạch ngày.

Chạy migration (Code 3/Boss, sau khi gộp): `cd server && npx -y wrangler@latest d1 execute omr --remote --file=migration-2909-tu-luyen.sql`. Chưa chạy ⇒ `rut`/`nop` trả "Máy chủ chưa bật Tu luyện", `tong-hop` trả rỗng.
