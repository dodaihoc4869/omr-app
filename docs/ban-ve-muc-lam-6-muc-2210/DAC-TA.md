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
> **Bản 2 (22/10), làm theo góp ý của Boss sau khi soát ảnh:**
> - 4 sắc xanh không phân biệt được vội với có nghĩ khi liếc.
> - Dòng "chưa có số đo" lặp lại ở mọi dòng.
> - Mức 6 phải là cờ trên tên em.
> - Chip nhịp tranh chỗ với thanh.

- **Dòng tổng (mới), ngay dưới tiêu đề:** "14 ngày qua, trong 30 em có mặt:" kèm 4 nút lọc (cao ≥ 44 px, `aria-pressed`):
  - **Tất cả**
  - **Sai vì vội nhiều** (nền hổ phách)
  - **Treo máy**: em có ≥ 1 lượt treo (Mức 5 hoặc 6)
  - **Cố tình treo máy** (nền hồng)
  - Bấm một nút thì danh sách chỉ còn các em ấy và hiện hết, kèm dòng "N em … · Bỏ lọc" (khung 03).
- **Chú giải một dòng:** Vội (Mức làm 1–2) · Có nghĩ (3–4) · Treo máy · Cố tình treo máy · "Màn riêng của thầy, không lên bản chiếu".
- **Cột thẳng hàng (máy tính và điện thoại ngang), có đầu cột:**

| Cột | Nội dung |
|---|---|
| Giờ | Giờ điểm danh |
| **Em** | Tên đầy đủ, không cắt. Mức 6 là **cờ nổi ngay sau tên**: "⚑ Cố tình treo máy" trên nền hồng đặc, chỉ màn thầy. Chip nhịp (Chăm/Chưa đều/Lười) nằm **nhỏ ngay dưới tên**, không tranh chỗ với thanh nữa |
| **Sai vì vội** | **Số % lớn** = lượt sai ở Mức 1–2 trên lượt sai có Mức làm 1–4, chữ nhỏ "9/10 lượt sai". Từ ngưỡng trở lên thì số tô hổ phách. Ít hơn 5 lượt sai ⇒ "—" và "ít lượt sai (2)" |
| **Cách làm 14 ngày** | Thanh **3 nhóm màu có nghĩa**, đều là biến sẵn có: Vội (Mức 1–2) **hổ phách** `--gvm-hp` · Có nghĩ (3–4) **xanh lục** `--gvm-xl` · Treo **hồng sọc** `--gvm-ho` · Cố tình **hồng đậm** `--gvm-ho-dam`. Chữ nhỏ dưới thanh: "Vội 12 · Có nghĩ 3 · Treo 4 lượt" |
| **Treo máy** | Số lượt treo 14 ngày. Từ 2 lượt trở lên thì ô nền hồng |

- **Điện thoại dọc (390 px):** mỗi em 3 hàng. Hàng 1: giờ · tên · cờ · nhịp. Hàng 2: "Sai vì vội 90%" · "Treo 4 lượt". Hàng 3: thanh và chữ nhỏ, kéo hết bề ngang. Đầu cột ẩn, vì chú giải đã nói nghĩa màu.
- **Chú thích CHUNG dưới danh sách** (thay dòng phụ lặp ở từng dòng): "% và thanh chỉ tính lượt đã đo giờ làm. 6 em đang hiện: 8 lượt chưa có số đo · 6 lượt làm trước khi đo treo máy … · ≈ = có lượt giây ước tính."
- **Màu và luật giữ màu.** Thanh Mức làm của bảng điểm danh đổi từ 4 sắc xanh sang 3 nhóm. Phải thay quy tắc màu `.dd1-ml-thanh i[data-m]` đang có trong `diem-danh-buoc1.css`, mà `kiem:mau-giu` coi đó là đổi màu đang có. Cần một trong hai: Boss duyệt ngoại lệ có ghi lại; hoặc giữ nguyên quy tắc cũ (không còn dùng) và thêm lớp mới `data-g`. Đề xuất cách thứ hai: không đụng màu cũ, `mau-giu` vẫn 0.
- **Hồ sơ em và tờ chiếu GIỮ 4 sắc xanh Mức 1–4,** vì ở đó cần đủ 4 mức. Bảng điểm danh chỉ cần trả lời nhanh "vội hay có nghĩ".
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
| **Những ngày đầu: chưa đo treo máy** (trạng thái chính tuần đầu) | Dòng tổng thay hai nút Treo bằng ô nét đứt "Treo máy: đo từ lượt làm sau 23/10". Cột Treo máy ghi "—", đầu cột ghi "đo từ 23/10". Ô "Sai vì vội" và thanh Vội/Có nghĩ vẫn đủ (khung 02). | Làn "Treo máy" nét đứt, ghi "Chưa đo — lượt làm trước 23/10 chưa ghi khoảng treo máy" (khung 13). |
| Một số lượt chưa đo | Gom vào **chú thích chung** dưới danh sách ("N lượt làm trước khi đo treo máy"), không lặp ở từng dòng. | Lượt chưa đo nằm trong làn Mức 1–4 như cũ. |
| Ít lượt | Ô "Sai vì vội" ghi "—" và "ít lượt sai (2)". Không tô, không vào bộ lọc. | — |
| Có số ước tính | Giữ dấu "≈" như hiện nay. | Giữ như hiện nay. |

## 4. Dữ liệu — theo lõi Boss (nhánh `claude/stoic-einstein-7jkysb` @e7e4760c, sửa 71520b89, 22/10)

### 4a. Lệnh `/gv/muc-lam-lo`
Kiểu `MucLamEmLo` (server/src/muc-lam-lo.ts; bên app đọc ở src/lib/muc-lam-lo-api.ts).

**Đã có trên nhánh Boss:** `soTreo`, `soCoTinh`, `soChuaDoTreo` cho mỗi em.

**Bật khi build giao diện 6 mức:** gọi `tongMucLam(luot, { tachTreo: true })`. Khi đó `m` = Mức 1–4 CHỈ của lượt không treo, và `soDo = Σm + soTreo + soCoTinh`.
- Bộ đọc `docMucLamEm` đổi trong **cùng lượt phát hành**. Hiện nay nó bỏ em nào có Σm ≠ soDo.
- Nếu máy chủ bật `tachTreo` trước khi app đổi bộ đọc, thanh của em có lượt treo sẽ mất (chỉ hỏng phần hiện, không sai số).

**CÒN XIN THÊM:** `saiLamVoi`, `saiDuNghi` mỗi em. `tongMucLam` đã tính sẵn, chỉ cần trả ra.
- Chip «Sai khi làm vội» tính trên lượt sai, cùng số với «Cách làm bài 14 ngày» (`cachLam14`).
- Test `muc-lam-lo-2110` ghim lô = `cachLam14`, nên phải cập nhật cùng lượt.

**Bỏ `ngayCoTinh`.** Chip ghi «Cố tình treo máy · N lượt» (số lượt Mức 6, `soCoTinh`).

**Lô hỏi MỌI em có mặt (≤ 40), không chỉ 6 em đang hiện.** Dòng tổng và nút lọc cần số của cả lớp (chi phí: mục 6).

### 4b. `MucLamLuot` và `TongMucLam` (đã có trên nhánh Boss)
- `MucLamLuot.treo?: 'treo' | 'co_tinh'` · `giayTreo?` · `daDoTreo?: true` (lõi 71520b89: lượt đã đo mà không treo). Vắng cả `treo` lẫn `daDoTreo` ⇒ «Chưa đo treo máy». Mức 6 `co_tinh` CHỈ khi có ≥ 3 lượt treo trong cùng một ngày; một lượt treo đơn lẻ không bao giờ là Mức 6.
  - Thẻ trên tờ chiếu ghi số phút = làm tròn `giayTreo / 60`, tối thiểu 1.
- `TongMucLam.soTreo` · `soCoTinh` · `soChuaDoTreo`.

### 4c. Mức 6 không lên máy chiếu
- **Máy chủ đã hạ Mức 6 về Mức 5** cho tờ «Ai đã sai?» và hồ sơ em lên bảng (công khai).
- App vẫn hạ thêm một lần ở `src/components/chien-dich/ghi-to-chieu.ts` (tin `AI_SAI_TRA` và `HO_SO_TRA`): `co_tinh` ⇒ `treo`, `soCoTinh` cộng vào `soTreo`. Lớp này để phòng máy chủ cũ.
- Tin gửi vào iframe và HTML tờ chiếu **không chứa** «Cố tình», `co_tinh`, `coTinh` hay `soCoTinh` (có test, mục 7).

### 4d. Hàm thuần, ngưỡng TẠM
Đặt ở `src/lib/muc-lam-lo-api.ts`.

| Hàm / ô | Điều kiện |
|---|---|
| `tiLeSaiVoi(em)` | `saiLamVoi / (saiLamVoi + saiDuNghi)` khi tổng ≥ **5**; dưới 5 ⇒ null ("ít lượt sai") |
| Lọc "Sai vì vội nhiều" · tô % hổ phách | `tiLeSaiVoi ≥ 50%` |
| Lọc "Treo máy" | `soTreo + soCoTinh ≥ 1` |
| Ô Treo máy tô hồng | `soTreo + soCoTinh ≥ 2` (1 lượt có thể chỉ là em nghe điện thoại) |
| Cờ "Cố tình treo máy" | `soCoTinh > 0` |

## 5. Ngoại lệ và việc cần thầy quyết
- **Màn Hành trình hay được chiếu lên máy chiếu lớp.** Bản vẽ hiện "Cố tình treo máy" bằng chữ rõ trên dòng, đúng ý "chỉ thầy thấy" của đặc tả chung. Nếu thầy hay chiếu màn này, có hai cách:
  - (a) Giữ như bản vẽ.
  - (b) Dòng chỉ hiện "Treo máy"; chữ "Cố tình" chỉ hiện trong hồ sơ em (bấm em mới thấy).
  - **Thầy chọn (a) hay (b).** Không chọn thì làm theo (a).
- **Lọc khi danh sách > 40 em có mặt.** Chỉ hỏi 40 em đầu. Dòng tổng ghi "trong 40 em đầu" để không nói sai.
- **Tên dài (30 ký tự).** Cột Em tự xuống dòng, không cắt; cờ Cố tình xuống theo.
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
    - `dauHieuEm` đúng ngưỡng: tính trên lượt SAI (lượt đúng ở Mức 1 không làm thành vội); 4 vs 5 lượt sai; treo 1 vs 2; cố tình có lượt.
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
- **Ảnh Chromium** (bản vẽ đã soát bằng máy, 33 ảnh): 0 lỗi trang · 0 tràn ngang · 0 ô chồng nhau trong dòng em · 0 đích chạm < 44 px · 0 chữ < 12 px · 0 tương phản < 4,5:1 (sáng và tối) · 0 thẻ chiếu bị cắt · 0 tên "…" · 0 chữ "Cố tình" trên tờ chiếu.
- Khi build xong: chụp lại bằng bộ chụp màn thật `scripts/chup-v2` (cảnh `dd12c:muc`, đã sửa để mở bước 1) và `scripts/chup-muc-lam-2110/chup-chieu.mjs`, rồi so với bản vẽ đã duyệt.
