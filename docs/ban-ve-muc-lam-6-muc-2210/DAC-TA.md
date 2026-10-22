# Đặc tả · Mức làm 6 mức ở BẢNG ĐIỂM DANH + tờ chiếu «AI ĐÃ SAI?» · 22/10/2026

Phần của **Code app 2**, thuộc Đợt 2 của đặc tả chung `docs/dac-ta-muc-lam-6-muc-2210.md`. Đặc tả chung nằm ở nhánh Boss `claude/stoic-einstein-7jkysb`, chưa vào main.

Trạng thái: **bản vẽ chờ thầy duyệt**. Chưa sửa `src/`, chưa sửa `server/`. Ảnh nằm ở `anh/`, cách đọc ảnh ở `GHI-CHU.md`. Số trong ảnh là **số giả (minh hoạ)**. Mọi ngưỡng ghi "TẠM" sẽ chỉnh sau khoảng 1 tuần có dữ liệu thật.

## 1. Mục tiêu và ai dùng
- **Thầy, ở bước 1 Điểm danh của Hành trình.** Liếc 2 giây là biết em nào hay sai vì làm vội, em nào treo máy, em nào cố tình treo máy trong 14 ngày qua.
  - Không cần mở hồ sơ từng em.
  - Bấm một nút là lọc ra đúng các em ấy.
- **Cả lớp, trên tờ chiếu «Ai đã sai?» (phím X).** Nhìn ra lượt sai vì máy để treo rồi mới nộp. Các lượt này tách khỏi Mức làm 1–4, vì số giây của lượt treo không cho biết em đã nghĩ bao lâu.
  - Tờ chiếu **không bao giờ** hiện chữ "Cố tình treo máy".
- **Cảm giác cần đạt.** Thầy thấy rõ, không phải đoán. Trước lớp thì trung tính: "Treo máy" màu xám có sọc, không dùng màu cảnh báo.

## 2. Bố cục

### 2a. Bảng điểm danh — khối "Vừa điểm danh" (khung 01–04)
- **Sửa một lỗi đang có.** Ở bản hiện tại (`hien-trang/diem-danh-may-tinh-*.jpg`), cột tên em bị ép về 0 trên máy tính:
  - Dòng 1 chỉ còn "Đ…", năm dòng sau mất hẳn tên.
  - Nguyên nhân: lưới `52px 1fr auto minmax(168px,240px)` nằm trong cột hẹp chừng 440 px.
  - Cách sửa: "Vừa điểm danh" chiếm **cả bề ngang** bước 1. Ô "Xong điểm danh thì làm gì?" chuyển xuống dưới thành **một hàng** gồm lời dặn và nút chính. Nút chính vẫn là nút duy nhất của bước.
- **Dòng tổng (mới), ngay dưới tiêu đề:** "14 ngày qua, trong 30 em có mặt:" kèm 4 nút lọc (cao ≥ 44 px, có `aria-pressed`):
  - **Tất cả · 30**
  - **Sai khi làm vội · 9** (viền hồng)
  - **Treo máy · 6** (tím nhạt). Đếm **mọi em có ≥ 1 lượt treo** (Mức 5 hoặc 6), kể cả em chỉ 1 lượt chưa gắn chip.
  - **Cố tình treo máy · 1** (tím đậm)
  - Bấm một nút ⇒ danh sách chỉ còn các em ấy, hiện hết không cắt 6 dòng, kèm dòng "N em có treo máy trong 14 ngày · Bỏ lọc" (khung 03).
- **Chú giải một dòng:**
  - "Thanh 14 ngày: ▮▮▮▮ Mức làm 1 → 4 · ▨ Treo máy · ▮ Cố tình treo máy".
  - Kèm câu "Màn riêng của thầy, không lên bản chiếu".
  - Câu này thay đoạn giải thích 3 dòng đang có.
- **Mỗi dòng em: hai tầng.**
  - Tầng 1: giờ · **tên đủ** (không cắt; dòng hẹp thì xuống dòng) · chip nhóm/bậc (giữ nguyên) · bên phải tối đa **2 dấu hiệu**:
    - "Cố tình treo máy · N ngày": tím đặc.
    - Nếu không có dấu trên thì xét "Treo máy · N lượt": tím nhạt.
    - "Sai khi làm vội · x/y": viền hồng. x/y là **lượt SAI**: x lượt sai ở Mức 1–2 trên y lượt sai có Mức làm 1–4. Đây là CÙNG số "x/y lượt sai là lúc làm vội" của hồ sơ em 14 ngày. Mức làm chỉ giải thích lượt sai; lượt đúng nộp nhanh không phải vội.
  - Tầng 2: thanh 14 ngày gồm **6 đoạn** theo số lượt.
    - Mức 1→4 giữ đúng 4 sắc xanh đang có.
    - Mức 5 tím có sọc, Mức 6 tím đậm.
    - Bên cạnh thanh là dòng số: "Mức làm 1–2: 12/15 lượt · Treo máy: 1 lượt · Cố tình treo máy: 3 lượt". Dòng phụ: "N lượt chưa đo treo máy · N lượt chưa có số đo".
- **Theo khổ màn:**
  - Điện thoại dọc (390): dấu hiệu xuống dưới tên; nút lọc xếp 2 cột.
  - Điện thoại ngang (844) và máy tính (1440): dấu hiệu nằm cùng hàng với tên, căn phải.
- **Phần giữ nguyên.** Ô mã, ô có mặt, ô vắng, thêm em tay, bớt em nhầm. Trên bản vẽ các phần này tô mờ và gắn nhãn "Giữ nguyên".

### 2b. Tờ chiếu «Ai đã sai?» (khung 11–13; tờ chiếu chỉ có nền tối)
- **Thanh trên mỗi thẻ có thêm đoạn "Treo máy"**: xám sọc, biểu tượng tạm dừng ⏸, kèm số lượt.
- **Làn mới "Treo máy"** nằm sau Mức làm 4 và trước "Chưa có số đo".
  - Đầu làn: "để máy ≥ 5 phút không làm, rồi mới nộp".
  - Thẻ tên: tên kèm **số phút treo**.
  - Lượt treo **rời** làn Mức 1–4 của nó, không đếm hai lần.
- **Số cột thẻ tên.** Chọn **ít cột nhất** (2 → 3 → 4) mà thẻ không tràn và ít tên bị "…" nhất.
  - Khi phải dùng 4 cột, thẻ tên bỏ chữ "giây"/"phút"; đầu làn ghi "số = giây làm" / "số = phút treo" để vẫn đủ đơn vị.
  - Dòng chú thích dưới cùng nói vì sao lượt treo không xếp Mức 1–4.
- **Máy chiếu 4:3 (ngang ≤ 1100 px, mới).** Hai thẻ đặt cạnh nhau quá hẹp ⇒ hiện **một thẻ rộng** và hai nút chuyển "Đã điểm danh · 22 em" / "Cả lớp · 27 em" (phím **L**). Ở khổ 1024×768, lớp đông (khung 12), thẻ đang hiện không cắt tên nào, không tràn.

## 3. Trạng thái
| Trạng thái | Bảng điểm danh | Tờ chiếu |
|---|---|---|
| Đang tải | Dòng em vẫn hiện ngay. Thanh mờ kèm "Đang đo…". Lệnh được hỏi sau khi danh sách ổn định, như hiện nay (khung 04). | Giữ như hiện nay. |
| Lỗi / mất mạng | Dải hồng: "Chưa tải được Mức làm 14 ngày…: lý do · **Thử tải lại**". Dòng lỗi ghi "Chưa tải được Mức làm". Điểm danh không bị chặn (khung 04). | Giữ như hiện nay. |
| Trống | "Chưa có lượt 14 ngày qua" · "Chưa có số đo (N lượt)". | Không có lượt treo ⇒ làn Treo máy mờ, ghi "0 lượt". |
| **Những ngày đầu: chưa đo treo máy** (trạng thái chính tuần đầu) | Dòng tổng thay hai nút Treo bằng ô nét đứt "Treo máy: đo từ lượt làm sau 23/10". Từng dòng vẫn có Mức 1–4 và dấu "Sai khi làm vội". Chip "Chưa đo treo máy" **không lặp** ở từng dòng (khung 02). | Làn "Treo máy" nét đứt, ghi "Chưa đo — lượt làm trước 23/10 chưa ghi khoảng treo máy" (khung 13). |
| Một số lượt chưa đo | Dòng phụ "6 lượt chưa đo treo máy". Nếu cả 14 ngày của em đều chưa đo (máy em chưa nạp bản mới) ⇒ chip nét đứt "Chưa đo treo máy". | Lượt chưa đo nằm trong làn Mức 1–4 như cũ. |
| Ít lượt | "Ít lượt sai có số đo (2) — chưa kết luận". Không gắn dấu "Sai khi làm vội". | — |
| Có số ước tính | Giữ dấu "≈" như hiện nay. | Giữ như hiện nay. |

## 4. Dữ liệu (CẦN BOSS CHỐT — đã nhắn Boss 22/10)

### 4a. Lệnh `/gv/muc-lam-lo`
Kiểu `MucLamEmLo` (server/src/muc-lam-lo.ts; bên app đọc ở src/lib/muc-lam-lo-api.ts):

| Trường | Nghĩa |
|---|---|
| `m` | `[Mức 1, 2, 3, 4]` — **CHỈ lượt KHÔNG treo** |
| `saiLamVoi`, `saiDuNghi` | Lượt SAI ở Mức 1–2 / Mức 3–4. `tongMucLam` đã tính sẵn, chỉ cần trả ra. Hai số này phải bằng `cachLam14` (test `muc-lam-lo-2110` đang ghim lô = `cachLam14`) |
| `treo` | Số lượt Mức 5 (treo, không cố tình) |
| `coTinh` | Số lượt Mức 6 |
| `ngayCoTinh` | Số NGÀY trong 14 ngày có Mức 6. Mức 6 định nghĩa theo ngày nên chip ghi "N ngày" |
| `chuaDoTreo` | Số lượt trong `m` thiếu trường `v/a/l` |
| `soDo` | `= Σm + treo + coTinh` |

- Bộ đọc `docMucLamEm` đổi trong **cùng lượt phát hành**. Hiện nay bộ đọc bỏ hẳn em nào có Σm ≠ soDo. Nếu máy chủ gửi khuôn mới mà app chưa đổi thì cả dòng em mất thanh.
- Bản app cũ đọc khuôn mới: các trường thêm bị bỏ qua, còn Σm ≠ soDo ⇒ em hiện "không có số". Lỗi này chỉ hỏng phần hiển thị, không sai số.
- **Lệnh phải trả cho đủ em có mặt (≤ 40), không chỉ 6 em đang hiện**, vì dòng tổng và nút lọc cần số của cả lớp.
  - Chi phí: xem mục 6.

### 4b. `MucLamLuot` và `TongMucLam` (lõi Boss)
- `MucLamLuot` thêm `treo?: 'treo' | 'co_tinh'` và **`phutTreo?: number`**.
  - `phutTreo` = làm tròn của max(`l`, `a`) / 60, dùng cho thẻ "12 phút" trên tờ chiếu.
- `TongMucLam` thêm `soTreo`, `soCoTinh` và **`chuaDoTreo`**.
  - Không có `chuaDoTreo` thì không màn nào nói được "Chưa đo treo máy".

### 4c. Hạ Mức 6 trước khi lên tờ chiếu
- Hạ ở **app**, tại chỗ dựng tin `AI_SAI_TRA` (`src/components/chien-dich/ghi-to-chieu.ts`): `co_tinh` ⇒ `treo`, và bỏ mọi trường chỉ dành cho thầy.
- **Đường thứ hai lên máy chiếu:** bấm thẻ tên trên tờ ⇒ tin `HO_SO_TRA` mang hồ sơ em, trong đó có "Cách làm bài 14 ngày" (`cachLam14`). Khi `TongMucLam` có `soCoTinh`, phải hạ cả ở đây: cộng vào `soTreo`, bỏ `soCoTinh`. Cùng hàm hạ, cùng tệp `ghi-to-chieu.ts`.
- Tin gửi vào iframe và HTML tờ chiếu **không chứa** chữ "Cố tình", `co_tinh`, `coTinh` hay `soCoTinh` (có test, mục 7).

### 4d. Dấu hiệu từng dòng — hàm thuần, ngưỡng TẠM
Đặt ở `src/lib/muc-lam-lo-api.ts`, tên `dauHieuEm`. Trả tối đa 2 dấu. Bộ lọc dùng hàm riêng `coDauHieu` (lọc "Treo máy" = `treo + coTinh ≥ 1`).

| Dấu | Điều kiện |
|---|---|
| "Cố tình treo máy · N ngày" | `coTinh > 0` |
| "Treo máy · N lượt" | (không có dấu trên) và `treo + coTinh ≥ 2`. Một lượt treo có thể chỉ là em nghe điện thoại, nên chỉ hiện ở dòng số. |
| "Sai khi làm vội · x/y" | `saiLamVoi + saiDuNghi` ≥ **5** lượt sai và `saiLamVoi` / (`saiLamVoi + saiDuNghi`) ≥ **50%** |

## 5. Ngoại lệ và việc cần thầy quyết
- **Màn Hành trình hay được chiếu lên máy chiếu lớp.** Bản vẽ hiện "Cố tình treo máy" bằng chữ rõ trên dòng, đúng ý "chỉ thầy thấy" của đặc tả chung. Nếu thầy hay chiếu màn này, có hai cách:
  - (a) Giữ như bản vẽ.
  - (b) Dòng chỉ hiện "Treo máy"; chữ "Cố tình" chỉ hiện trong hồ sơ em (bấm em mới thấy).
  - **Thầy chọn (a) hay (b).** Không chọn thì làm theo (a).
- **Lọc khi danh sách > 40 em có mặt.** Chỉ hỏi 40 em đầu. Dòng tổng ghi "trong 40 em đầu" để không nói sai.
- **Tên dài (30 ký tự).** Tầng 1 tự xuống dòng, không cắt.
- **Bấm lặp nút lọc** ⇒ bật/tắt. Đổi bộ lọc không gọi lại máy chủ.
- **Đổi tab rồi quay lại.** Số được đệm 5 phút ở máy chủ, như hiện nay.
- **Máy yếu.** Thanh là CSS thuần, không có hoạt ảnh.

## 6. Chi phí máy chủ
- **Không thêm lệnh mới, không thêm vòng chờ nối tiếp.** Vẫn MỘT lệnh `/gv/muc-lam-lo`. Bên trong vẫn 1 đợt đọc sổ + 1 đợt song song (β, kích thước đề, ước tính).
- **Số dòng đọc tăng.** Từ 6 em lên số em có mặt (thường 25–35, trần 40):
  - Khoảng 14 ngày × ~40 lượt × 30 em ≈ 17 000 dòng ở mức cao nhất.
  - Đọc theo chỉ mục `sbd + ngay_vn`, đệm 5 phút.
  - Chỉ hỏi **một lần** sau khi danh sách ổn định. Không hỏi lại khi lọc hoặc khi bấm "Xem cả".
- **Nếu đo thấy chậm** ⇒ máy chủ trả gọn hơn: chỉ số đếm, bỏ hẳn phần dòng lượt.
- **Kích thước gói.** Phần mới nằm trong mảnh bước 1 (nạp lười). Gói mở app thầy **không tăng**: `kiem:toc-do` phải 0 đỏ.

## 7. Nghiệm thu đo bằng máy
- **vitest (tên dự kiến):**
  - `tests/muc-lam-lo-6-muc-2210.test.ts`:
    - Bộ đọc nhận khuôn mới.
    - Σm + treo + coTinh = soDo.
    - Thiếu trường mới ⇒ đọc như cũ, không mất em.
    - `dauHieuEm` đúng ngưỡng: tính trên lượt SAI (lượt đúng ở Mức 1 không làm thành vội); 4 vs 5 lượt sai; treo 1 vs 2; cố tình theo ngày.
    - Số `saiLamVoi/saiDuNghi` của lô = `cachLam14` của cùng em, cùng ngày.
  - `tests/diem-danh-6-muc-2210.test.tsx`:
    - Đủ tên em ở khổ 1440, không bị ép về 0.
    - Nút lọc có `aria-pressed`.
    - Lọc "Treo máy" gồm cả em cố tình.
    - Những ngày đầu hiện ô "đo từ lượt làm sau …".
  - `tests/ai-sai-treo-may-2210.test.ts`:
    - Lượt treo rời làn Mức 1–4.
    - Tin `AI_SAI_TRA`, tin `HO_SO_TRA` và HTML tờ **không** có "Cố tình", `co_tinh`, `coTinh`, `soCoTinh`.
    - Khổ ≤ 1100 px chỉ một thẻ, có phím L.
- **Cổng:** `npm run kiem:toc-do` 0 đỏ · `npm run kiem:mau-giu` 0 · precache ≤ 169.
- **Ảnh Chromium** (bản vẽ đã soát bằng máy, 33 ảnh): 0 lỗi trang · 0 tràn ngang · 0 đích chạm < 44 px · 0 chữ < 12 px · 0 tương phản < 4,5:1 (sáng và tối) · 0 thẻ chiếu bị cắt · 0 tên "…" · 0 chữ "Cố tình" trên tờ chiếu.
- Khi build xong: chụp lại bằng bộ chụp màn thật `scripts/chup-v2` (cảnh `dd12c:muc`, đã sửa để mở bước 1) và `scripts/chup-muc-lam-2110/chup-chieu.mjs`, rồi so với bản vẽ đã duyệt.
