# Hợp đồng: GIÂY THẬT của lượt lên bảng (`len_bang.giay_thuc`)

Bên CUNG CẤP hợp đồng (chủ tệp): **Code 1** (app giáo viên). Bên THỰC HIỆN phía máy chủ: **Code 3**. Lập 21/09/2026 (M6 "tự hiệu chỉnh từ giây thật", `prompt-man-chieu-len-bang.md`).

## Vì sao có
Mô hình giờ lên bảng (`thoi-gian-len-bang.ts`, `T = T_đọc + T_làm + T_chữa`) là ước tính. Mỗi lần thầy bấm Đạt / Chưa đạt trên tờ chiếu, tờ đo được số giây THẬT của đợt; app dùng để hiệu chỉnh mô hình theo (phần, sao). App **giữ mẫu trên máy thầy (IndexedDB) và tự hiệu chỉnh từ đó — KHÔNG phụ thuộc máy chủ**. Cột này để máy chủ giữ bản gốc phòng đổi máy / mất bộ nhớ trình duyệt, và để sau này tổng hợp.

## Việc cần bên máy chủ (chỉ-thêm, tương thích ngược)

1. **Migration chỉ-thêm**: `ALTER TABLE len_bang ADD COLUMN giay_thuc REAL` (NULL mặc định, không ràng buộc). Hàng cũ giữ NULL. Chạy được nhiều lần không hại (bọc kiểm tra cột đã có như các migration khác).
2. **`POST /len-bang`** (`ghiLenBangMoi`): đọc thêm trường tuỳ chọn `giayThuc` từ thân JSON.
   - Hợp lệ khi `typeof === 'number'`, hữu hạn, **20 ≤ giayThuc ≤ 1800** (giây, đã làm tròn 0,1 ở app).
   - Hợp lệ ⇒ ghi vào `len_bang.giay_thuc`; thiếu / sai kiểu / ngoài khoảng ⇒ ghi **NULL**. **Không bao giờ từ chối lệnh ghi vì trường này** (kết quả Đạt / Chưa đạt quan trọng hơn số đo).
   - `INSERT INTO len_bang (sbd, chuyen_de, qid, dat, luc, giay_thuc) VALUES (?,?,?,?,?,?)`.
3. Phản hồi, `lichSuLenBang`, sổ `su_kien_hoc`, `ban_do_sai`, `qid_da_lam`: **KHÔNG đổi**.

Phía app đã gửi từ commit M6 của Code 1: thân `/len-bang` có thêm `"giayThuc": 95.5` khi tờ chiếu đo được; máy chủ chưa đọc thì bỏ qua (không lỗi).

## Ý nghĩa của con số (để không hiểu sai khi tổng hợp)
- Giây từ lúc đợt bắt đầu **LÀM BÀI** (sau màn gọi tên) tới lúc thầy bấm ô ấy. Hai ô cùng đợt cùng đo từ MỘT mốc: ô bấm sau đã **gồm cả thời gian chữa ô bấm trước**. Vì vậy KHÔNG lấy trung bình thô của `giay_thuc` theo em / theo câu. App so với "T dự tính của đúng khoảng ấy" (LÀM của đợt + Σ CHỮA các ô đã bấm), nên máy chủ muốn tổng hợp thì phải cùng phép so; chưa cần làm.
- Không đo (chế độ dạy học, bấm ở bảng buổi chữa, bấm trong lúc màn gọi tên, giây ngoài 20..1800): trường vắng ⇒ NULL.
- Đây là số của **mô hình giờ**, không phải nhận xét về em: KHÔNG đưa ra cổng học sinh / phụ huynh, không dùng chấm điểm hay xếp loại.

## Reset
Cột thuộc hàng `len_bang`: reset xử lý hàng nào thì cột đi theo hàng đó. App thầy GIỮ mẫu của mình khi reset (khoá `giayThucLenBang`, dữ liệu của mô hình giờ).

## Kiểm (gợi ý)
- Không gửi `giayThuc` ⇒ NULL, ghi thành công. Gửi 95.5 ⇒ 95.5. Gửi 19 / 1801 / "90" / null / NaN ⇒ NULL, vẫn ghi thành công.
- Migration chạy hai lần không lỗi; hàng cũ đọc được.
