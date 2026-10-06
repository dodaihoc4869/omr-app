# Hợp đồng API — OMNI 3 (05/10/2026)

Kiểu dữ liệu: `server/src/omni-kieu.ts` (HỢP ĐỒNG). Chữ hiển thị: `src/lib/omni-chu.ts` (một nguồn cho máy chủ và ba app). Đặc tả: `DAC-TA-BUILD-OMNI-3-0510.md`.

**Luật chung:** mọi phần OMNI chỉ xuất hiện khi công tắc `cau_hinh.omni` áp cho em (và Hoá 2.0 đang bật cho em). Công tắc tắt ⇒ mọi lệnh trả y hệt hôm nay (trường mới vắng). Đáp án/lời giải không xuống máy em trước khi em nộp câu đó. Giao diện giữ nguyên: mọi trường mới là DÒNG THÊM vào thẻ/khung sẵn có.

## A. Học sinh — `POST /game-v2/<lệnh>` (xác thực `token` như mọi lệnh game)

### `hoa2-sanh` (có sẵn) → thêm `omni?: SanhOmni`
```
omni: {
  bat: true,
  baiDangLuyen: [{ id, ten, hanNop }],     // các bài đang luyện (nhiều bài song song), hạn gần trước
  dangVung: { a, b },                      // "Dạng vững a/b" của bài hạn gần nhất
  conDangDe8: number | null,               // "Còn N dạng cần vững để chạm mốc 8" — em KHÔNG thấy điểm dự báo thô
  sEm: number | null, sMucTieu: 0.07,      // "Sơ ý 6 % (mục tiêu dưới 7 %)"
  chungChi: [{ ten, doTin, ngay }],        // chứng chỉ Sẵn sàng 8+ đã đạt (gần nhất trước)
  ve: { con, tong },                       // vé thử thách tuần này
  choBaiMoi: boolean, onBaiCu: number,     // chế độ chờ bài mới / số câu ôn bài cũ hôm nay
  metGio: { khung, tiLe, tiLeTot, coTheDoi } | null,
  nhatKy: string[] | null,                 // 2–5 dòng "Hôm nay em tiến thêm gì" (chỉ khi xong kế hoạch)
  deThu: { duoc, soCau: 14, phut: 25 },
  canThan?: true                           // CHƯƠNG TRÌNH "CẨN THẬN" (mục A·2): CHỈ có khi OMNI bật ∧ Sơ ý (đúng số `sEm` ở trên, đủ dữ liệu) > 7 %. Vắng ⇒ app em y hệt hôm nay.
}
```

### `start` (có sẵn, mode `adventure`, Đảo) → thân thêm `ve?: string` (mã dạng)
- Có `ve` và còn vé tuần này ⇒ trả một chuyến 3 câu cao hơn bậc của em một bậc ở dạng ấy (câu DẠY HỌC trong phạm vi đã dạy, ưu tiên câu chưa gặp), `vai: 'thu_thach'`, trừ 1 vé. Hết vé ⇒ `{ ok:false, lyDo:'het_ve' }`.
- Không có `ve` ⇒ y hệt hôm nay.

### `answer` (có sẵn) → thân thêm `msLam?: number`, `tuTin?: 'chac' | 'chua_chac'`; phản hồi thêm `omni?: KetQuaOmniTraLoi`
```
omni: {
  nhanTocDo: 'troi_chay'|'thuong'|'cham'|'luot'|null, msLam, msKyVong,
  luot: boolean,          // lướt: KHÔNG tính đúng/sai, KHÔNG trừ Máu, câu quay lại ngày mai (≤ 3/ngày; từ lượt 4 tính sai)
  chacMaSai: boolean,     // client mở lời giải từng bước ngay
  tram?: { vkn, ten, tenLoi, nhan, coCauNen, chu },   // 3 câu sai liền: client mở câu nền SẴN CÓ (/hs/luyen-nen {nhan}); không có câu nền ⇒ chỉ báo chữ
  dang?: { ma, ten, pTruoc, pSau, nTuLam, nNgay },
  loiNhan: string | null, // một dòng thêm dưới kết quả (đúng nhưng chậm / lướt / chưa chắc / chắc mà sai)
  canThan?: true,         // CẨN THẬN (mục A·2): CHỈ có khi hồ sơ OMNI TRƯỚC lượt này có Sơ ý > 7 % (đủ dữ liệu). Vắng ⇒ không ô/thẻ nào thêm.
  buocSai?: { lua: [{ ma, ten }] }  // CẨN THẬN (c): CHỈ khi `canThan` ∧ `chacMaSai` ∧ tra được ≥ 1 tên bước; `ten` đã lọc mã nội bộ, ≤ 3 mục; `ma` gửi lại khi em chạm
}
```
- `msLam` do máy em đo từ lúc câu hiện tới lúc bấm chọn; máy chủ kẹp [0, 900 000]; chỉ dùng để THA (lướt), không phạt, không cộng thưởng.
- `tuTin` vắng ⇒ `'chac'`.
- Phần II: máy chủ ghi kết quả từng ý vào sổ (`subitem_json`).

### `doan-nop` (có sẵn, Đoàn) → thân thêm `msLam?`, `tuTin?` (chuyển vào `answer` nội bộ). Trạm hồi phục KHÔNG mở trong Đoàn nhiều người.
**Đoàn MỘT người thật (06/10)**: phòng Hóa 2.0 còn đúng một người thật (`choEmMotMinh`, hiệp kế chờ em bấm ĐÁNH TIẾP, không đồng hồ) CÓ Trạm. `doan-nop` đặt cờ `motMinh` vào `answer` nội bộ (máy chủ đặt, `game-v2.ts` chỉ tin khi đúng là lệnh nội bộ của Đoàn); kết quả `ketQuaCau.omni.tram` (cùng hình với chuyến Đảo: `chu`, `coCauNen`, `nhan`, `tenLoi`). Luật đếm như Đảo (3 câu sai TỰ LÀM liền; lướt không tính; câu đúng hoặc có tiếp sức cắt chuỗi; tối đa 1 Trạm/chặng). Khác Đảo: Đoàn chỉ mở khi CÓ câu nền (ải kế đã chia sẵn cho cả đội nên không đổi bằng câu dễ hơn; không gọi `hoa2-omni-tram-xong`); máy em vẽ thẻ `TheTram2` dưới kết quả câu, nút "Làm 3 câu nền" mở hộp câu nền (`/hs/luyen-nen`).

### `hoa2-omni-tram-xong` `{ session }` → `{ ok, cau: (câu công khai + vai) | null, viTri: number | null }`
Sau Trạm hồi phục: đổi ải KẾ TIẾP chưa làm của chuyến bằng câu cùng dạng thấp hơn một bậc (nếu có). Không có câu thay ⇒ `cau: null`.

### `hoa2-omni-nhat-ky` `{}` → `{ ok, dong: string[] }`

### `hoa2-omni-doi-thu-tu` `{ quyet: 'de_mai' | 'lam_luon' }` → `{ ok, theLuc:{con,tong}, dao:{con}, doan:{con} }`

### `hoa2-omni-de-thu` `{}` → `{ ok, id, cau: CâuCôngKhai[14], phut: 25, hetLuc: ISO }` | `{ ok:false, lyDo }`
### `hoa2-omni-de-thu-nop` `{ id, traLoi: {qid: string}, msLam?: {qid: number} }` → `{ ok, diem, dung, tong, cau:[{ qid, dung, traLoi, dapAn, loiGiai }] }`
Đề thử nửa: 14 câu lạ (DẠY HỌC, bài cũ + bài đang luyện), 25 phút, chấm khi nộp cả bài; ghi sổ nguồn `luyen`, mã nguồn `de_thu:<id>`, purpose `de_thu`.

### CHƯƠNG TRÌNH "CẨN THẬN" (đặc tả 4.6; `server/src/omni-can-than.ts`) — mục A·2
`canThan` (chỉ-thêm, CHỈ khi `true`) = **OMNI bật cho em ∧ Sơ ý của em > 7 %** (`THAM_SO_OMNI.C_SO_Y`, nghiêm ngặt). "Sơ ý của em" = đúng số em thấy ở Sảnh: ĐỦ DỮ LIỆU (≥ `S_AO` = 10 lượt ở câu đã vững) mới có — prior 0,08 đã lớn hơn 0,07 nên em chưa làm gì KHÔNG bị coi là sơ ý. Nơi báo: `hoa2-sanh` → `omni.canThan` (cờ lúc mở Đảo / Đoàn / Làm câu ôn) và `answer`/`doan-nop` → `omni.canThan` (hồ sơ trước lượt). `start`/`resume` không có khối `omni` (không thêm lượt đọc hồ sơ); app em lấy cờ từ Sảnh. Vắng cờ ⇒ app em KHÔNG đổi gì (DOM y hệt).
Ba việc khi `canThan`:
- (a) **Mốc kiểm duy trì × 0,7** của luật đóng lỗi (`loi-hoc-luat.ts` `mocDuyTri`, [14, 30] ⇒ [10, 21]; làm tròn, ≥ 3 ngày, tăng dần; mốc riêng của em cũng nhân): `docHoSo2(env, sbd, homNay, omniSom?, canThanSom?)` — `canThanSom` do `layKeHoachChot` đưa vào LÚC LẬP kế hoạch ngày (dùng lại lượt đọc hồ sơ OMNI đã bắt đầu sẵn — KHÔNG thêm truy vấn D1). Kế hoạch đã chốt / nơi không có hồ sơ (phụ huynh, thầy, "Câu đã làm") ⇒ mốc chuẩn. Hằng số hẹn "ôn duy trì sau thành thạo" của srs2 (`HEN_DUY_TRI` 30 / 14 ngày) KHÔNG đổi.
- (b) **Ô "Soát lại đơn vị và số liệu"** trước khi nộp câu Phần III (một chạm, KHÔNG bắt buộc, không chặn nút nộp, không gửi gì lên máy chủ) — phía máy em: Đảo 2.0, Đoàn Hộ Tống, Làm câu ôn. Không có ở màn thi thật, đề thử.
- (c) **Thẻ "Em biết câu này. Sai vì bước nào?"** sau lượt chắc-mà-sai ở câu vững (`omni.buocSai`): em chạm một bước hoặc "Em chưa rõ" ⇒ `hoa2-omni-buoc-sai`.
`canThan` sai / OMNI tắt / chưa đủ dữ liệu ⇒ mọi thứ y hệt hôm nay.

### `hoa2-omni-buoc-sai` `{ qid, ma }` → `{ ok, daGhi }`
Ghi MỘT dòng bảng chỉ-thêm `omni_buoc_sai(sbd, qid, ngay, ma_vkn, luc)` (khoá chính `(sbd, qid, ngay)`; `qid` quy về câu GỐC; `ma` = mã bước trong `buocSai.lua` hoặc `chua_ro`). Gọi lại cùng câu cùng ngày giữ lựa chọn đầu (`daGhi:false`). KHÔNG chấm, KHÔNG ghi sổ học `su_kien_hoc`, không đổi P/EXP/Máu. OMNI tắt ⇒ `{ ok:false, error }`. Bảng tạo lúc chạy (`CREATE TABLE IF NOT EXISTS`), xếp GIỮ ở cả hai job reset.

### Câu nền của Trạm hồi phục: dùng NGUYÊN lệnh có sẵn `/hs/luyen-nen {token, nhan}` và `/hs/luyen-nen/nop {token, id, traLoi, qid}`.
06/10: Trạm chọn tên lỗi / nhãn câu nền theo bước em ĐÃ TỰ KHAI (`omni_buoc_sai`, 14 ngày) nếu bước ấy thuộc vi kỹ năng của 3 câu sai; không có ⇒ như cũ (`omni-buoc-sai-uu-tien.ts`).

### CHẨN ĐOÁN BƯỚC SAI trước lượt làm lại (06/10 — `server/src/chan-doan-buoc-sai.ts`, ghi chú `docs/chan-doan-buoc-sai-0610.md`)
KHÔNG lệnh mới, KHÔNG trường mới xuống máy em: `start` (Đảo / chặng Đoàn) có thể trả MỘT câu chẩn đoán (câu thường, vai `on_lai`, qid `nen:sinh.<nhãn>.<số>` hoặc
`nen:yds.<băm>.<stt>.<stt>`) ĐÚNG CHỖ lượt làm lại đầu tiên của câu lỗi; `answer` / `doan-nop` chấm như câu thường. Sổ: purpose `chan_doan`, raw `{tc, cd: 1}` (không phải
lần làm của câu lỗi; là quan sát OMNI của bước nó kiểm); sai ⇒ một dòng `omni_buoc_sai`. Công tắc `cau_hinh` khoá `chan_doan_buoc_sai` (`{"bat":false}` ⇒ y hệt cũ).

## B. Giáo viên (sau cổng mã thầy)

### `POST /gv/bai-da-day` — xem `server/src/bai-da-day.ts`
| action | thân | trả |
|---|---|---|
| `danh-sach` | `{lop}` | `{ ok, bai:[{khoaBai,tenBai,viTri,tickLuc,chienDichId,trangThai,hanNop,conNgay,chungChi:{dat,tong}}], choBaiMoi:{soNgay}|null }` |
| `xem-truoc` | `{lop,khoaBai,tenBai,viTri,maDe[],theLucNgay?,hanNop?,sbd?,phamVi?:[{khoaBai,tenBai,viTri,maDe[]}]}` | `{ ok, soCau, soTuLuan, hanNop, D, luotCan, sucChua, duLuot, tongEm, duDiem8, quaTai:[{sbd,ten}], theLucNgay, onBaiCu?: { toiDaMoiEm, khoCau, phuPhanTram, soBai, tiLe:{thuong,cuoi} } }` |
| `tick` | `{lop,khoaBai,tenBai,viTri,maDe[],phamVi:[{khoaBai,tenBai,viTri,maDe[]}],hanNop?,theLucNgay?,nguoi?}` | `{ ok, chienDichId, hanNop, daCo }` |
| `bo-tick` | `{lop,khoaBai}` | `{ ok, chienDich:'da_huy'|'da_dong'|null }` |

`maDe` = mã tờ đã tách phần (`…-TN`, `…-DS`, `…-TLN`) của bài, không gồm "Ví dụ minh hoạ" trừ khi thầy tích. `phamVi` = mọi bài đứng TRƯỚC bài này trong cây SGK cùng khối (để máy chủ biết bài cũ).

**`onBaiCu` (06/10, chỉ-thêm, tuỳ chọn) — dòng thẻ xác nhận "Ôn bài cũ: tối đa N câu/em · kho X câu · phủ ≈ Y%"** (`server/src/omni-on-bai-cu.ts`, `bai-da-day.ts`). `xem-truoc` nhận thêm `phamVi` (như `tick`; vắng ⇒ chỉ tính phạm vi đã ghi của lớp). Trả: `toiDaMoiEm` N = Σ ngày 1..D ⌊lượt/ngày × tỉ lệ ngày⌋ (D = hạn tự tính 7–14 hoặc hạn thầy đặt; tỉ lệ ngày 4–5 của bài = `tiLe.cuoi`, còn lại `tiLe.thuong`; đúng phép tính `lapKeHoachNgay`); `khoCau` X = câu hợp lệ ĐÚNG KHỐI của các bài đứng trước (phạm vi hiện có của lớp ∪ `phamVi`, tờ DẠY HỌC, đã duyệt, không tự luận, bỏ tờ của bài sắp giao và câu của chiến dịch đang chạy của các em được giao; ĐẾM THẬT, không cắt trần ứng viên 800); `phuPhanTram` Y = min(100, làm tròn(N / X × 100)); `soBai` = số bài trước có câu; `tiLe` = tỉ lệ đang áp cho lớp. **Trường VẮNG** khi kho 0, không rõ khối, lỗi đọc, hoặc đếm quá `HAN_KHO_ON_BAI_CU_MS` (4 s) — app không hiện dòng (màn y hệt cũ).

### Ôn bài cũ — cấu hình `cau_hinh` (06/10, chỉ-thêm, không schema mới)
- `on_bai_cu_deu` = `{"bat":false}` ⇒ ôn bài cũ y hệt trước 06/10 (ứng viên "bài gần nhất trước, cắt 800", thứ tự nhóm → bài gần nhất). Vắng / JSON hỏng / khác ⇒ BẬT: ứng viên cắt trần công bằng giữa các bài (vòng r lấy câu thứ r của mỗi bài), thứ tự trong mỗi nhóm (đã gặp tới lịch → chưa gặp → đã gặp chưa tới lịch) xen kẽ BÀI (bài đứng đầu vòng đầu xoay theo ngày, tất định) rồi xen kẽ DẠNG trong bài. Trần ôn mỗi ngày ⌊thể lực × tỉ lệ⌋, thứ tự ưu tiên nợ → câu mới → củng cố → duy trì → ôn bài cũ, hạng theo dạng / trọng số OMNI (khi có) và các cổng khối / tự luận GIỮ NGUYÊN (công bằng chỉ là thứ tự hoà trong cùng hạng / trọng số).
- `on_bai_cu_ti_le` = `{ "mac_dinh": {"thuong":0.2,"cuoi":0.4}, "lop": { "<tên lớp>": {"thuong":x,"cuoi":y} } }`: `thuong` = ngày thường, `cuoi` = các ngày đan xen (`DAN_XEN_NGAY`, ngày thứ 4–5 của bài). Số ngoài [0; 0,6] hoặc sai kiểu ⇒ bỏ qua TỪNG trường (dùng `mac_dinh` rồi hằng cũ 0,2 / 0,4); vắng ⇒ y hệt cũ. Áp cho kế hoạch ngày được LẬP sau khi lưu (kế hoạch đã chốt trong ngày giữ nguyên).
- Hai khoá nằm trong nhóm cờ đọc kèm của `cau-hinh-dem.ts` (đệm 15 s) ⇒ không thêm vòng D1 ở Sảnh / kế hoạch ngày.
- Lệnh thầy `POST /gv/omni`: `on-bai-cu-doc {lop?}` ⇒ `{ ok, macDinh:{thuong,cuoi}, lop:{<lớp>:{thuong,cuoi}}, hieuLuc?:{thuong,cuoi}, toiDa:0.6, buoc:0.05 }`; `on-bai-cu-luu {lop, thuong, cuoi}` ⇒ `{ ok, lop, tiLe }` (số 0–0,6, ghi phần của lớp ấy, giữ lớp khác + `mac_dinh`; sai ⇒ `{ ok:false, error:'Tỉ lệ ôn bài cũ phải là số từ 0 đến 60 %.' }`).

### `POST /kho/thu-muc` `{ ds:[{maDe, thuMuc:'DAY_HOC'|'TU_LUYEN'}] }` → `{ ok, daGhi }`

### `POST /gv/omni` — xem `server/src/omni-gv.ts`
`co-doc` · `co-luu {co}` · `cau-hinh-doc` · `cau-hinh-luu {theLucLop?, maTran?}` · `on-bai-cu-doc {lop?}` · `on-bai-cu-luu {lop, thuong, cuoi}` · `bang {chienDichId}` ⇒ `BangOmni` · `xac-nhan {sbd, maDang, ket}` · `q-lo {chienDichId?|maDang?, sau?}` · `q-duyet {ds, vknMoi?}` · `ca-chot {chienDichId}` ⇒ `{ ok, qids, soLa, soCu }` · `gan-ca-chot {chienDichId, maCa}`.

"Chữa xong" dùng NGUYÊN lệnh có sẵn `/gv/chien-dich {action:'chua-xong', id, qids}`.

## C. Phụ huynh — `POST /ph/hoc-2` (có sẵn) → thêm `omni?: PhOmni`
```
omni: { khoangCach8: number|null, hieuChuan:{soCaChot, du}, dangCanVung: string[], sEm, chungChi:[{ten, doTin, ngay, diem}], gioHoc, canThayChua }
```
`khoangCach8` chỉ hiện cho phụ huynh khi `hieuChuan.du` (≥ 3 ca chốt, sai số trung bình ≤ 0,6 điểm).

## D. Bảng mới (chỉ-thêm) — `server/migration-0510-omni-3.sql`
`bai_da_day` · `pham_vi_lop` · `de_kho_thu_muc` · `omni_vkn` · `omni_q` · `omni_em` · `omni_p_vkn` · `omni_beta_cau` · `omni_du_bao` · `omni_chung_chi` · `omni_xac_nhan` · `omni_ca_chot` · `omni_lo_dien` · `omni_ve` · `omni_de_thu`. Bảng chỉ-thêm của Chương trình Cẩn thận (06/10, tạo lúc chạy, không có trong tệp migration): `omni_buoc_sai(sbd, qid, ngay, ma_vkn, luc)`. Không ALTER bảng cũ: thời lượng, tự tin, nhãn tốc độ ghi trong `su_kien_hoc.raw_json` (`{chon, ms, tt, td}`); lướt ghi `purpose = 'luot'`, `ket_qua = NULL`.
