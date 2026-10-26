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

## 4. B3 — chuỗi ngày theo bài + ngày giữ chuỗi (Code app 4 làm đợt sau, chưa có)
- Trường dự kiến: `chuoiNgay?: { so: number; giuChuoi?: number }`, trong phản hồi `hoc-tap-sanh` (dữ liệu Hôm nay).
- Chưa có trường này ⇒ giao diện không hiện số (không bịa).
- Code app 4 báo tên lệnh chính xác trước khi đẩy. Không đụng `exp-*.ts`; phải đụng thì báo trước.

## 5. Ghi chú / phản hồi
- (trống)
