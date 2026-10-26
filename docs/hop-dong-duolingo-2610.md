# Hợp đồng dữ liệu «học kiểu Duolingo» — Code app 4 (máy chủ) ↔ Code app 1 (giao diện HS) — 26/10/2026

Thầy chốt (26/10, Code app 1 chuyển lời): «Chốt thuật toán của Code app 4, làm luôn nhé». Đặc tả: `docs/de-xuat-phan-cau-kieu-duolingo-2610.md`.
Tin nhắn trực tiếp giữa hai phiên bị chặn (`elevated_session_untrusted_device`), nên hợp đồng ghi ở đây. Muốn đổi điều gì thì sửa tệp này hoặc ghi vào mục 5.

## 1. Phân làn
- **Code app 4:** `server/**`, kèm test máy chủ. Không sửa `ManLamBaiTap.tsx`, `trong-lam-bai.css`, `TrongHs.tsx`, `Bi.tsx`, `rung.ts`, `am-thanh.ts`.
- **Code app 1:** toàn bộ giao diện app học sinh, gồm vòng «Làm lại» và màn kết chặng (B1).
- **Code app 4 không làm B2 (nhiệm vụ ngày) và B4 (giải đấu tuần).** Hai mục này thuộc đặc tả điểm thưởng của Code app 1.

## 2. Cờ `cau_hinh.duolingo_bai`
- Giá trị: `{"cheDo":"tat"|"thu"|"bat","lop":["12A1",…]}`.
  - `thu`: chỉ bật cho các lớp có trong `lop` (khớp `hoc_sinh.lop` hoặc `ten_lop`).
  - Không có dòng cấu hình ⇒ coi như **tắt**.
- Cờ gác cả **A1** (trộn chặng 6 câu, độ khó quanh 0,78) lẫn **A3** (làm lại cuối chặng).
- Tắt ⇒ mở chặng giữ y thứ tự cũ, và `hoc-tap-lam-lai` trả `{ok:true,questions:[]}`.
- Bật / tắt / đổi lớp: chạy workflow `bat-duolingo-bai-2610.yml` trên Actions (nút Run workflow, nhập chế độ + danh sách lớp).

## 3. A3 — Làm lại cuối chặng: LỆNH RIÊNG, không nằm trong phản hồi `answer`
**Lý do:** chọn câu anh em tốn khoảng 5–8 lượt đọc D1. Nhét vào `answer` (lệnh nóng nhất) thì câu sai nào cũng chậm thêm, trái luật tốc độ (`CLAUDE.md`). Gọi một lần ở cuối chặng thì không chạm đường nộp câu.

**Gọi lệnh:**
```
goiHoa2('hoc-tap-lam-lai', token, { session: <id phiên chặng (r.id của hoc-tap-start)> }, 15)
⇒ { ok: true, questions: Array<Question & { vaiGoi7: 'lam_lai'; lamLaiCua: <qid câu gốc trong chặng> }> }
```
- **Khi nào gọi:** MỘT lần, sau câu cuối của chặng, chỉ khi chặng có câu sai tự làm (máy em tự biết từ kết quả `answer`). Không câu sai thì không gọi.
- **Dữ liệu trả về:**
  - chỉ có đề (`publicQuestion`), **không** có `correct`/`solution`;
  - tối đa 3 câu, một vòng mỗi chặng;
  - gọi lại (mất mạng, bấm lặp) ⇒ trả đúng các câu đã cấp mà em chưa làm, không cấp vòng thứ hai;
  - `questions` rỗng ⇒ bỏ vòng, vào màn kết chặng.
- **Nộp câu làm lại:** gọi `answer` như mọi câu, cùng `session`.
  - Máy chủ **tự ép có hỗ trợ**: không EXP, không đóng lỗi, câu gốc vẫn vào lịch ôn. Vì vậy **không cần** cờ `lamLai`. Gửi `assisted: true` cũng được.
  - Phản hồi có `attempt.assisted === true`. Giao diện nên ghi «Làm lại đúng» thay cho «Đúng · có hỗ trợ».
- **Câu thay thế:** câu anh em (`chonAnhEmChoCaDaDung`) — cùng dạng, cùng phần, cùng mức hoặc mức kề, khác nhóm nội dung, đúng khối, em chưa gặp, không phải câu đang dùng cho ca thi / BTVN chưa nộp / câu nghi sai đáp án. **Không** lặp nguyên câu vừa sai.
- **Phiên dở:** em rời giữa vòng làm lại ⇒ các câu làm lại **không** thành chặng mới.
- **Từ chuẩn:** «Làm lại» (khác «Ôn lại» theo lịch). Đã ghi trong `docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md`.
- **Bản giao diện mẫu** (đã gỡ khỏi bản phát hành, Code app 1 chép logic nếu muốn): commit `406dbd17` — `ManLamBaiTap.tsx` (`xinLamLai`, `tiep`, `soGoc`, chặn chạm lặp khi đang xin), test `tests/lam-lai-cuoi-chang-giao-dien-2610.test.tsx`, cảnh chụp `lam-lai` / `ket-chang`.

## 4. B3 — chuỗi ngày theo bài + bình giữ chuỗi (ĐÃ BUILD 26/10, gác cùng cờ `duolingo_bai`)
- Hàm thuần `chuoiNgayCuaEm(nhatKy, homNay)` ở `server/src/chuoi-ngay-bai.ts`; phần D1 ở `server/src/chuoi-ngay-bai-d1.ts`.
- **Trường trả về** (chỉ có khi cờ bật cho em; tắt hoặc lỗi thì vắng, giao diện không hiện số):
  ```
  chuoiNgay: { so, giuChuoi, sucChua, lich7: [{ ngay, kieu }], cuu?: { hetHan, daLam, can: 2, soCu }, binhVuaDo? }
  ```
  - `kieu` ∈ `'hoc' | 'binh' | 'phep' | 'cuu' | 'tat' | 'cho'`. So với đề nghị, thêm hai giá trị:
    - `'cuu'`: ngày lỡ đã được cứu bằng 2 bài bù;
    - `'cho'`: hôm nay chưa xong bài nào; chuỗi giữ tới hôm qua.
  - `cuu.soCu`: số chuỗi sẽ sống lại nếu em học bù đủ.
  - `cuu.hetHan`: hết ngày hôm nay (VN), viết ở dạng ISO UTC.
- **Nơi trả:**
  - `/hs`: phản hồi `hoc-tap-sanh` khi Gói 7 bật, trường `chuoiNgay` ở cấp ngoài cùng.
  - `/ph`: lệnh `ph-tat-ca-ve-con` → `tongQuan.chuoiNgay`; trường cũ `tongQuan.chuoiNgayHoc` lấy cùng số `so`.
  - `/ph/ke-hoach`: trường `chuoiNgay`; trường cũ `chuoiDat` lấy cùng số `so`.
- **Luật:**
  - Một ngày được tính khi em xong ≥ 1 bài (≥ 6 câu khác nhau có kết quả trong ngày, mọi nguồn), hoặc tự sửa xong ≥ 1 câu.
  - Ngày vắng có phép (thầy ghi ở điểm danh) giữ chuỗi, không tốn bình.
  - Bình giữ chuỗi:
    - mang tối đa 2; chuỗi chạm 100 ngày thì nâng lên 3;
    - mỗi thứ Hai tặng 1 bình; chuỗi chạm mốc 30 ngày tặng thêm 1;
    - lỡ ngày thì tự dùng 1 bình: chuỗi giữ nguyên, không cộng ngày.
  - Cứu chuỗi:
    - hết bình mà lỡ ngày thì chuỗi tắt;
    - NGÀY HÔM SAU em xong ≥ 3 bài (1 bài của ngày + 2 bài bù, tức ≥ 18 câu) thì chuỗi sống lại đúng số cũ; «24 giờ» được hiểu là ngày hôm sau theo lịch VN;
    - tối đa 1 lần mỗi tuần (tuần tính từ thứ Hai).
- **Mua bình:** `congBinh(env, sbd, so 1–3, nguon, id)` (`chuoi-ngay-bai-d1.ts`).
  - Bảng chỉ-thêm `chuoi_binh_mua`, tạo khi gọi lần đầu.
  - `id` chống trùng (dùng mã giao dịch ví).
  - Giá và trừ tinh thể thuộc đặc tả điểm thưởng của Code app 1. Hàm này chưa gắn lệnh HTTP: Code app 1 gắn vào lệnh mua của mình.
- **Tốc độ:**
  - cờ đọc KÈM nhóm cờ cấu hình (Sảnh) hoặc kèm truy vấn gộp (phụ huynh) ⇒ cờ tắt thì 0 lệnh D1 thêm;
  - cờ bật ⇒ 4 lượt đọc chạy song song, cùng đợt với các lượt đọc khác.
- Chưa build: chuỗi đôi «Học cùng bạn» (chờ thầy duyệt). `chuoiNgayCuaEm` là hàm thuần, tính được cho từng em.

## 5. Ghi chú / phản hồi
- 26/10 Code app 1 đề nghị, Code app 4 **đồng ý** cho B3: dùng MỘT định nghĩa chuỗi, thay cả `chuoi-ngay-hoc.ts` (≥ 1 câu) lẫn chuỗi «đủ mức» của TrongHs.
  - Một ngày được tính khi em xong ≥ 1 bài (≥ 6 câu có kết quả trong ngày), hoặc tự sửa xong ≥ 1 câu.
  - Bình giữ chuỗi: tặng 1 bình mỗi tuần (thứ Hai), mang tối đa 2. Ngày không đạt (trừ hôm nay) tự dùng 1 bình; hết bình thì chuỗi về 0.
  - Trả `chuoiNgay: { so, giuChuoi }` ở cả /hs (`hoc-tap-sanh`) và /ph, để cùng một số.
- 26/10 (sau): thầy chốt luật giữ chuỗi chi tiết (Code app 1 chuyển lời), Code app 4 **nhận** (đợt B3, sau khi A1/A3 phát hành).
  - **Bình giữ chuỗi:**
    - mang tối đa 2; đạt mốc 100 ngày thì nâng lên 3;
    - mỗi thứ Hai tặng 1 bình nếu chưa đầy; đạt mốc 30 ngày tặng thêm 1;
    - mua bằng tinh thể: phần giá và ví do Code app 1 lo; máy chủ chừa hàm cộng bình;
    - tự dùng khi em lỡ ngày; ghi lại ngày đã dùng (`binhVuaDo`).
  - **Ngày vắng có phép** (dữ liệu P3): tự giữ chuỗi, không tốn bình.
  - **Cứu chuỗi:** hết bình mà lỡ ngày thì chuỗi tắt; trong 24 giờ học bù 2 bài (ngoài bài của hôm đó) thì chuỗi sống lại đúng số cũ; tối đa 1 lần mỗi tuần.
  - **Trả về:** `chuoiNgay: { so, giuChuoi, sucChua, lich7: [{ngay, kieu: 'hoc'|'binh'|'phep'|'tat'}], cuu?: {hetHan, daLam, can: 2}, binhVuaDo?: ngay }` ở cả /hs và /ph.
  - Chừa hàm thuần `chuoiNgayCuaEm(em, ngay)` để sau tính chuỗi đôi. Chuỗi đôi chưa build.

