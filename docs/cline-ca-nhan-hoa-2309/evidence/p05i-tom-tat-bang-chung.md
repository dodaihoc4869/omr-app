# Bằng chứng P05 lát cắt 9 — MẪU TỐC ĐỘ THEO PART × MỨC đã ghép vào ngân sách

Ngày chạy: 2026-09-23 (21:03–21:05 +07:00). `sourceFingerprint`: `a789d7499168d58058727fcd13d4828d27156e5b71188af4c635958125bc927b`

| Lệnh | Exit | Kết quả | Artifact (sha256) |
|---|---|---|---|
| `vitest run tests/cnh-1-0-mau-toc-do-p05.test.ts` | 0 | **4 PASS** (D1 thật) | `p05i-vitest-mau-toc-do.log` — `bdbfddf6726de3436e5087def9d4d588de550ac1ff8d701abeaea767c777adad` |
| `vitest run tests/cnh-1-0-ngan-sach-luot-t09.test.ts` | 0 | 7 PASS (end-to-end) | `p05i-vitest-t09.log` — `53f154336fd3ad6b6855412291617e47265106745caf8f3cf8e9a3d2d08f598c` |
| nhóm (cnh-1-0, game, ke-hoach, ho-so, tran-ngay, doan, lich-on) | 0 | **748 PASS / 0 đỏ** | `p05i-vitest-nhom.log` — `664826286a71aefc3c735c7aa95accc0b4e9eb0e0ccc8722ac81bc2fbb4ded43` |
| `tsc -b` / `tsc -p server/tsconfig.json --noEmit` | 0 / 0 | 0 lỗi | — |
| chạy LẠI T05/T06 + T32 theo fingerprint mới | 0 | 21 + 6 PASS | `p05i-vitest-t05-t06.log` — `93a07f3158b849cd76c781970f42e2050651e641727b6216db6b8f4097dfcaed` · `p05i-vitest-t32.log` — `7b06d243d2feff7c7d866e02793e069773a940f2a339a7909cde7f747aa49bd7` |

## Đã chứng minh

- `docMauTocDo` đọc **sổ thật** 30 ngày, chỉ nhận mẫu **ĐỘC LẬP** (`assistance = 'none'`) và **ĐÃ CÔNG BỐ**
  (không `embargoed`): mẫu có hỗ trợ / `unknown` / đang che bị **loại** (test riêng), mẫu ngoài 30 ngày bị loại.
- `part` lấy từ **chính kho câu đã phục vụ** (`game_v2_question.json.phan`), `difficulty` từ `muc_do` của sổ
  (thiếu ⇒ từ kho) — đúng 02 §5.1 (mẫu phải cùng part × mức).
- `docNganSachConLai.mau` **không còn luôn rỗng** ⇒ bộ ước lượng dùng **hệ số đo được** thay vì luôn 1; khi chưa đủ
  mẫu vẫn trả `ghiChu` nói rõ "hệ số 1" (không giả vờ đo được) và đường dùng cờ TẮT không đổi hành vi.

## Còn lại của P05

- `chotNgayCu` chưa gọi `danhGiaCore` (ánh xạ `su_kien_hoc` → `KetQuaTaskCore` cho từng task core).
- Revision khi có mục lỗi chưa nối vào command giáo viên (P07); nhả chỗ khi lượt kết thúc (P07).
