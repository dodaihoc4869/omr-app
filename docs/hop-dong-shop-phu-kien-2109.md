# Hợp đồng máy chủ · Cửa hàng phụ kiện thần thú (Code 3 ↔ Code 2, Code 4, Boss) — 21/09/2026

Nguồn: `DE-XUAT-SHOP-PHU-KIEN-2109.md` mục 2, 5, 7, 8 (giá và luật Boss đã KHOÁ 21/09 sau S0: ống nghiệm p90 337, cao nhất 649) + chữ chốt ở commit 7655c2c (mục 3 và 9). Tài liệu này chỉ chốt phần MÁY CHỦ; những chỗ đề xuất để ngỏ được quyết ở đây và đánh dấu **[chốt]**. Trạng thái: hợp đồng + danh mục viết trước, mã máy chủ làm sau; CHƯA có gì trên Worker/D1 thật; cờ mặc định TẮT.

## 1. Danh mục món (nguồn duy nhất, TRONG MÃ)
`src/lib/phu-kien-danh-muc.ts` (Code 3 giữ, KHÔNG dùng `window`/`localStorage`; máy chủ và giao diện cùng nhập):
`PHIEN_BAN = 'm1-v1'` · `DANH_MUC_PHU_KIEN: readonly MonPhuKien[]` (40 món) · `DOT_MO_BAN = 1` · `O_GAN` · `docMonPhuKien(ma)`.

`MonPhuKien = { ma, o, bac, gia, ten, batMi, canChuoiNgay: number|null, canAnThach: number|null, suatTong: number|null, moBan: 1|2 }`
- **Mã** = tiền tố chỗ đeo + số thứ tự trong chỗ đeo (đúng sổ hình của Code 4, `src/game/than-thu-v2/phu-kien/phu-kien-mon.ts`): `HQ-01…08` Vòng sáng (`hao-quang`) · `VD-01…08` Đuôi sáng (`vet`) · `KT-01…08` Khung tên (`khung`) · `DA-01…08` Trên đầu (`dau`) · `CL-01…08` Trên lưng (`co-lung`). **[chốt]** hai tiền tố mới `DA`, `CL` (đợt 2).
- `o` là một trong năm khoá `hao-quang | vet | khung | dau | co-lung` (khoá máy chủ, không đổi). `bac` 1–5 = Thường · Đẹp · Hiếm · Sử thi · Huyền thoại.
- `ten` và `batMi` chép NGUYÊN VĂN mục 3 (7655c2c). Không có mô tả hình trong mã (chỉ ở tài liệu cho hoạ sĩ).
- `canChuoiNgay` / `canAnThach`: điều kiện học ("Cần chuỗi N ngày" + "M ấn thạch sáng"); `null` = không cần. `suatTong`: số cái tối đa của mùa (`null` = không giới hạn). `moBan`: 1 = đợt 1 (24 món), 2 = đợt 2 (16 món, cần bảng điểm đặt).
- Đợt 2 CHƯA bán: máy chủ chỉ trả/bán món có `moBan <= DOT_MO_BAN`. Khi Code 4 xong C3 + C4, Boss đổi `DOT_MO_BAN = 2` (một commit + Worker + Pages). Giao diện tự vẽ "Sắp mở" cho món trong danh mục mà `shop-danh-sach` không trả.
- Giá đi qua soát commit + test khoá (đủ 40 mã khác nhau, 8 món mỗi chỗ đeo, 12/10/8/5/5 món theo bậc, giá nằm trong khoảng của bậc, bậc + chỗ đeo khớp sổ hình của Code 4).

## 2. Cờ
`cau_hinh.shop_phu_kien = {"bat":true,"chiSbd":["…"]?}`. Vắng hoặc `bat:false` ⇒ đóng. Có `chiSbd` ⇒ chỉ các em ấy thấy cửa hàng mở (bật thử trước, rồi bỏ `chiSbd` là toàn bộ). Cờ tắt: `vang-xem` trả `{"ok":true,"bat":false}` (giao diện ẩn hai đường vào); `vang-doi`, `shop-danh-sach`, `shop-mua` trả lỗi `tam_dong`; `thu-mac-do` vẫn chạy (đồ đã mua không biến mất); trường `phuKien` (mục 5) vẫn trả. **[chốt]**

## 3. Chung cho 5 lệnh
Dưới `/game-v2/…`, xác thực học sinh như lệnh game hiện có (bỏ khỏi mẫu). Lỗi luôn `{"ok":false,"ma":"<mã>","loi":"<lời tiếng Việt hiện thẳng lên màn>"}`; `loi` là chữ chốt ở mục 9.3 [L1–L8]. `khoaYeuCau`: chuỗi 8–64 ký tự `[A-Za-z0-9_-]`, máy em sinh MỘT lần cho mỗi lần bấm; gọi lại cùng khoá ⇒ không ghi thêm, trả `lapLai:true`.
Mã lỗi: `duoi_nguong` · `thieu_vang` · `chua_mo` · `het_suat` · `da_co` · `gia_doi` · `tam_dong` · `chua_co` · `khong_co_mon` (mã món không có) · `sap_mo` (món đợt 2) · `sai_dau_vao`. **[chốt]** `khong_co_mon`, `sap_mo`, `sai_dau_vao` là mã mới, lời chờ Boss viết (tạm: "Không tìm thấy món này." · "Món này chưa mở bán. Em quay lại sau nhé." · "Yêu cầu chưa đúng. Em thử lại nhé.").

## 4. Năm lệnh
1. `vang-xem` — vào `{}` · ra `{"ok":true,"bat":true,"vang":340,"ongNghiem":620,"giuLai":200,"doiToiDa":420,"ngayAn":3,"chuoiNgay":9,"anThachSang":3,"mua":"m1"}`. `ongNghiem` = `wallet` của hồ sơ game (EXP chưa nạp); `giuLai` = 200 (hằng, luật hấp thụ); `doiToiDa = max(0, ongNghiem − 200)`; `ngayAn = floor(ongNghiem / 200)`; `vang = SUM(vang_so.so_vang)` của em; `chuoiNgay` = số ngày liên tiếp ĐẠT nhiệm vụ ngày, tính cả hôm nay nếu đã đạt (đúng con số Bảng nhiệm vụ đang hiện); `anThachSang` = số ấn thạch ở trạng thái sáng (`docAnThach`).
2. `vang-doi` — vào `{"soExp":180,"khoaYeuCau":"doi-7f3a"}` · ra `{"ok":true,"daDoi":180,"vang":520,"ongNghiem":440,"ngayAn":2,"lapLai":false}`. `soExp` là số nguyên ≥ 1 và ≤ `doiToiDa` (KHÔNG bắt bội của 10: thanh kéo bước 10 là việc của màn; nút "đổi hết" gửi đúng `doiToiDa`). Vượt ⇒ `duoi_nguong` (lời kèm số tối đa thật). 1 EXP = 1 vàng. Gọi lại cùng khoá: `daDoi` = của lần gốc, các số còn lại là số HIỆN TẠI. Không ghi vào `exp_so`; không đụng luật EXP, thú ăn 200, trần 120.
3. `shop-danh-sach` — vào `{}` · ra `{"ok":true,"phienBan":"m1-v1","vang":340,"mon":[{"ma":"KT-08","gia":6000,"daCo":false,"dangMac":false,"moKhoa":false,"thieu":"Cần chuỗi 14 ngày","suatCon":12,"suatTong":30}],"dangMac":{"hao-quang":null,"vet":"VD-04","khung":null,"dau":null,"co-lung":null},"emCo":{"chuoiNgay":9,"anThachSang":3}}`. Chỉ món `moBan <= DOT_MO_BAN`. `thieu` = `null` khi đã mở khoá, ngược lại chữ ngắn "Cần chuỗi N ngày" (kèm " + M ấn thạch sáng" nếu có). `suatCon` / `suatTong` = `null` khi không giới hạn; `suatCon = suatTong − số cái đã bán`. `giaThay` do giao diện gửi lại ở `shop-mua` là giá nó đang hiện. Số cái đã bán đọc bằng một truy vấn gộp trên `phu_kien_so_huu(ma_mon)`.
4. `shop-mua` — vào `{"maMon":"VD-04","giaThay":120,"khoaYeuCau":"mua-91c2"}` · ra `{"ok":true,"maMon":"VD-04","vang":220,"daMac":true,"lapLai":false}`. Thứ tự kiểm (dừng ở lỗi đầu tiên; khoá đã ghi thành công thì trả `lapLai:true` TRƯỚC mọi kiểm khác): `tam_dong` → `khong_co_mon` → `sap_mo` → `da_co` → `het_suat` → `chua_mo` (chuỗi/ấn thạch) → `gia_doi` (`giaThay` ≠ giá máy chủ) → `thieu_vang`. Món mua xong TỰ MẶC vào chỗ đeo của nó (`daMac:true`, thay món đang mặc ở chỗ ấy). **[chốt]** Mua = MỘT lô nguyên tử (mục 6); hai em cùng mua cái cuối ⇒ chỉ một em được, em kia nhận `het_suat`.
5. `thu-mac-do` — vào `{"oGan":"vet","maMon":"VD-04"}` (`maMon:null` = cởi) · ra `{"ok":true,"dangMac":{"hao-quang":null,"vet":"VD-04","khung":"KT-03","dau":null,"co-lung":null}}`. Lỗi: `chua_co` (chưa sở hữu, hoặc món không thuộc chỗ đeo ấy), `sai_dau_vao` (`oGan` lạ).

## 5. Bạn bè nhìn thấy (chỉ-thêm)
Trường `phuKien: {"<chỗ đeo>":"<mã món>"}` (chỉ các chỗ đang mặc; không mặc gì ⇒ `{}`) cho ba nơi: thẻ thần thú ở Bảng nhiệm vụ, sảnh + trận Đoàn (mỗi bạn), Bảng vinh danh. Đọc cho cả đoàn bằng MỘT truy vấn `WHERE sbd IN (SELECT value FROM json_each(?))`. Tên lệnh cụ thể của ba nơi được ghi vào mục 8 khi làm (S3). Cờ tắt vẫn trả. App thầy: một lệnh `/gv/*` chỉ đọc "số em đã mua phụ kiện" (S3).

## 6. D1 (migration CHỈ-THÊM, chạy lại được, có tệp lùi)
- `vang_so(id INTEGER PRIMARY KEY AUTOINCREMENT, sbd, loai CHECK IN('doi','mua','hoan'), so_vang INTEGER, exp_tru INTEGER, ma_mon, khoa_yeu_cau, luc, UNIQUE(sbd, khoa_yeu_cau))` + chỉ mục `(sbd)`. Chỉ INSERT. Số dư = `SUM(so_vang)`. `hoan` chỉ Boss dùng để sửa lỗi máy chủ.
- `phu_kien_so_huu(sbd, ma_mon, mua, gia, khoa_yeu_cau, luc, PRIMARY KEY(sbd, ma_mon))` + chỉ mục `(ma_mon, mua)`.
- `phu_kien_dang_mac(sbd, o_gan, ma_mon, luc, PRIMARY KEY(sbd, o_gan))`.
- Cả ba bảng vào `BANG_GIU` của `server/src/reset-toan-app.ts` (vàng và đồ là tài sản em đã kiếm) + test phân loại.
- `vang-doi` = MỘT `DB.batch`: (a) `UPDATE game_v2_profile SET json=?,revision=revision+1 WHERE sbd=? AND revision=? AND NOT EXISTS(khoá đã có trong vang_so)`; (b) `INSERT OR IGNORE INTO vang_so … SELECT … WHERE EXISTS(hồ sơ đang ở revision+1)`. Hai dòng cùng đổi hoặc cùng không; không đổi ⇒ đọc lại, thử tối đa 3 lần. Luôn giữ ≥ 200 EXP.
- `shop-mua` = MỘT `DB.batch`: (a) `INSERT OR IGNORE INTO phu_kien_so_huu … SELECT … WHERE SUM(vang_so) >= giá AND COUNT(đã bán) < suatTong`; (b) `INSERT OR IGNORE INTO vang_so(−giá) … WHERE EXISTS(dòng sở hữu mang đúng khoá)`; (c) `INSERT OR REPLACE INTO phu_kien_dang_mac … WHERE EXISTS(dòng sở hữu mang đúng khoá)`.
- Truy vấn D1 thật: ≤ 5 vế mỗi UNION, ≤ 100 tham số bind (dùng `json_each(?)`).

## 7. Luật bất di bất dịch
0 cơ chế ngẫu nhiên trả thưởng · 0 chỗ phụ kiện cộng chỉ số, EXP, vé hay thứ hạng · 0 chỗ máy em tự tính số dư · không tặng, không chuyển vàng, không bảng xếp hạng vàng · không đổi luật chấm điểm, luật EXP, thú ăn 200.

## 8. Tiến độ (cập nhật khi có mốc)
- [x] Hợp đồng này + danh mục `src/lib/phu-kien-danh-muc.ts` (S2 trước).
- [ ] S1 migration 3 bảng + `BANG_GIU` + test phân loại.
- [ ] S2 `vang-xem`, `vang-doi`, `shop-danh-sach`, `shop-mua`, `thu-mac-do` + test đua/bấm đúp.
- [ ] S3 `phuKien` ở ba nơi + dòng thống kê cho thầy.
- [ ] S4 đẩy Worker (chờ lời thầy), gọi thử mọi lệnh bị chạm trên D1 thật, bật `chiSbd` một em, rồi toàn bộ.
