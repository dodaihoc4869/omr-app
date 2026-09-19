# HỢP ĐỒNG MÁY THẦY ↔ MÁY CHỦ — hồ sơ nắm kiến thức cho buổi chữa (Gọi lên bảng)

Soạn 19/09/2026 bởi **Code 1** (làn giáo viên) cho **Code 3** (phiên máy chủ duy nhất).
Nguồn thiết kế: `DE-XUAT-CA-NHAN-HOA-1909.md` mục 1.2 và mục 2 "Kênh 3 — Gọi lên bảng".
Phần máy thầy (đã xong, chờ máy chủ): `src/lib/ho-so-lop.ts` (`gopNamKt`, `diemHopCau`, `lyDoChanCau`, `canDayLaiCau`),
`src/lib/xep-buoi-chua.ts`, `src/lib/exam-api.ts` (`goiHoSoLopLenBang`, `NamKtCauMayChu`), `src/screens/GoiLenBangScreen.tsx`.

> **Tóm một dòng:** `hoSoLopLenBang` nhận thêm `dsQid` và trả thêm `em[sbd].namKt[qid]`; `ghiLenBangMoi` thôi cộng thẳng `tien_do_hs`.
> **Thiếu bất kỳ vế nào máy thầy vẫn chạy như trước 19/09** — nên Code 3 có thể phát hành máy chủ độc lập, không cần chờ Pages.

---

## 1. Yêu cầu (request) — thêm MỘT trường tuỳ chọn

```jsonc
POST /goi
{
  "action": "hoSoLopLenBang",
  "secret": "…",                       // như cũ
  "dsSbd": ["12001", "12002"],         // như cũ, ≤ 60
  "soNgay": 60,                        // như cũ
  "dsQid": ["Q-ES-01", "Q-ES-02", …]   // MỚI — các câu của buổi chữa
}
```

| Trường | Kiểu | Quy tắc |
|---|---|---|
| `dsQid` | `string[]` tuỳ chọn | Máy thầy đã bỏ trùng + bỏ rỗng. Máy chủ **cắt ở 200** phần tử, mỗi qid ≤ 80 ký tự (dài hơn thì bỏ). Không có / mảng rỗng ⇒ **không trả `namKt`** (đúng như đời cũ). |

Máy chủ đời cũ đọc `b.dsSbd`/`b.soNgay` rồi bỏ qua trường lạ ⇒ máy thầy mới gọi máy chủ cũ không lỗi.

## 2. Phản hồi (response) — thêm `namKt` cho MỖI em

Mọi trường cũ (`chuyenDe`, `qidSai`, `qidDaLam`, `lenBang`, `btvn`) **giữ nguyên tên và nghĩa**. Chỉ thêm:

```jsonc
{
  "ok": true,
  "em": {
    "12001": {
      "chuyenDe": [ … ], "qidSai": [ … ], "qidDaLam": [ … ], "lenBang": { … }, "btvn": { … },   // như cũ
      "namKt": {                                    // MỚI — chỉ khi request có dsQid
        "Q-ES-01": {
          "lanSai": 3,
          "trangThai": "moi_sai",
          "canDayLai": true,
          "maDang": "ES-01",
          "bac": "biet",
          "dang": { "soGap": 6, "soDaKhacPhuc": 1, "soChuaThaySai": 2 }
        },
        "Q-ES-02": {                                 // em CHƯA gặp câu này, nhưng có bậc ở dạng của nó
          "lanSai": 0,
          "trangThai": null,
          "canDayLai": false,
          "maDang": "ES-02",
          "bac": "hieu",
          "dang": { "soGap": 9, "soDaKhacPhuc": 4, "soChuaThaySai": 3 }
        }
      }
    },
    "12002": { …, "namKt": {} }                     // em có mặt nhưng không có dòng nào cho các qid ấy ⇒ {} (KHÔNG bỏ khoá)
  }
}
```

### Từng trường của một mục `namKt[qid]`

| Trường | Kiểu | Lấy từ | Khi không có |
|---|---|---|---|
| `lanSai` | số nguyên ≥ 0 | `nam_kt_cau.lan_sai` (chỉ đếm SAI, bỏ trống không tính) | `0` |
| `trangThai` | `"chua_thay_sai"` \| `"moi_sai"` \| `"dang_on"` \| `"da_khac_phuc"` \| `null` | `nam_kt_cau.trang_thai` | `null` = em **chưa từng gặp** câu này |
| `canDayLai` | boolean | `nam_kt_cau.can_day_lai = 1` | `false` |
| `maDang` | chuỗi \| `null` | `nam_kt_cau.ma_dang`; nếu em chưa có dòng thì tra `game_v2_question.dang` theo qid; thiếu nữa thì `"CD:"+chuyên đề` nếu biết | `null` |
| `bac` | `"biet"` \| `"hieu"` \| `"van_dung"` \| `null` | `nam_kt_dang.bac` của (em, `maDang`): 0→`biet`, 1→`hieu`, 2→`van_dung` (`TEN_BAC_DANG` trong `ho-so-cau-hinh.ts`) | `null` (chưa có dòng dạng ⇒ máy thầy **không chặn** — không đoán em yếu) |
| `dang` | object \| `null` | `nam_kt_dang` của (em, `maDang`): `soGap = so_gap`, `soDaKhacPhuc = so_da_khac_phuc`, `soChuaThaySai = so_chua_thay_sai` | `null` |

**Khi nào có khoá `qid` trong `namKt`:** khi em có dòng `nam_kt_cau` cho qid, **hoặc** có dòng `nam_kt_dang` cho dạng của qid (để hồ sơ mang được bậc cho câu em chưa gặp — cần cho CHẶN CỨNG câu 2 sao). Không có gì ⇒ **không có khoá** (đừng ghi mục rỗng để tiết kiệm dung lượng).

**`bac` là của DẠNG, không phải của câu**: hai câu cùng dạng thì cùng `bac`/`dang`. Đừng quy `bac` về câu chưa từng gặp bằng cách khác.

### Máy thầy dùng các trường ấy ra sao (để Code 3 hiểu vì sao cần từng trường)

- `lanSai` → `pSai = min(1, lanSai/2)` — **thay** `ban_do_sai.so_lan_sai` (không bao giờ > 1 nên điểm cũ kẹt ở 0,5).
- `trangThai = "da_khac_phuc"` → sức nặng "sai câu này" nhân **0,35** (đã chữa). `null` ⇒ máy thầy lùi về `qidSai` cũ.
- `dang.*` → `pYeu = 1 − (soDaKhacPhuc + soChuaThaySai)/soGap` khi `soGap ≥ 4` (`SO_CAU_DU_TIN`); mỏng hơn thì lùi về tỉ lệ sai chuyên đề.
  Hai hằng số `4` và `0,7` (`NGUONG_DANG_YEU`) được chép ở client, test `tests/ho-so-lop-nam-kt-1909.test.ts` soi khớp `server/src/ho-so-cau-hinh.ts` — **đổi ở đó thì test đỏ, nhắc Code 1 chép theo**.
- `bac = "biet"` **và** câu 2 sao → em **không** được nhận câu ấy (CHẶN CỨNG, thầy chốt 19/09).
- `canDayLai = true` của **một em có mặt** → câu ấy vào danh sách **bắt buộc** của buổi chữa.

## 3. Tương thích ngược — bảng quyết định

| Tình huống | Máy chủ làm | Máy thầy làm |
|---|---|---|
| Request không có `dsQid` | không trả `namKt` | như trước 19/09 |
| Máy chủ đời cũ (không biết `dsQid`) | — | `namKt` thiếu ⇒ `HoSoEmDayDu.namKt = undefined` ⇒ đúng công thức cũ, không chặn ai |
| Bảng `nam_kt_*` chưa có (D1 chưa migration, fixture test) | **bọc `try/catch`, bỏ `namKt`, KHÔNG lỗi**, các trường cũ vẫn trả | như dòng trên |
| Em có mặt, chưa có dòng nào | `namKt: {}` | Map rỗng ⇒ y như thiếu |
| Trường sai kiểu / giá trị lạ | — | `gopNamKt` rơi về giá trị an toàn (`lanSai 0`, `bac null`, `canDayLai false`) — dòng hỏng không thể chặn nhầm em |

## 4. Gợi ý cài đặt (Code 3 quyết, đây chỉ là điểm vào)

Không đổi 5 truy vấn hiện có; thêm **tối đa 3 truy vấn**, mỗi cái MỘT tham số `json_each(?)` (bẫy D1 ghi ở mục BÀN GIAO của `SO-VIEC.md`: ≤ 100 tham số, UNION ≤ ~5 vế):

1. `SELECT sbd, qid, ma_dang, lan_sai, trang_thai, can_day_lai FROM nam_kt_cau WHERE sbd IN (…) AND qid IN (SELECT value FROM json_each(?))`
2. `SELECT qid, dang FROM game_v2_question WHERE qid IN (SELECT value FROM json_each(?))` — tra `maDang` cho câu em chưa gặp (độ phủ đo 19/09: 99,9%).
3. `SELECT sbd, ma_dang, so_gap, so_da_khac_phuc, so_chua_thay_sai, bac FROM nam_kt_dang WHERE sbd IN (…) AND ma_dang IN (SELECT value FROM json_each(?))`

Rồi ghép trong JS: với mỗi (em, qid) tính `maDang` (dòng câu → `game_v2_question` → `null`), tra dòng dạng. Cỡ tối đa 60 em × 200 qid = 12.000 mục nhưng thực tế thưa (chỉ mục có thông tin).

Test gợi ý (SQLite thật qua `tests/_d1-that.ts`): (a) em có dòng câu + dòng dạng ⇒ đủ 6 trường; (b) em chưa gặp câu nhưng có dạng ⇒ `trangThai:null`, `bac` đúng; (c) không dòng nào ⇒ không có khoá; (d) không có `dsQid` ⇒ không có `namKt`; (e) thiếu bảng `nam_kt_*` ⇒ `ok:true`, không `namKt`; (f) `btvn-len-bang-1409.test.ts` (đang xanh, soi `hoSoLopLenBang`) vẫn xanh nguyên.

## 5. Việc thứ hai của Code 3: `ghiLenBangMoi` ngừng cộng thẳng `tien_do_hs`

`server/src/index.ts` ~dòng 2321–2362 (`ghiLenBangMoi`). Thầy chốt 19/09 (câu 11): **ngừng**. Lý do: `chamDiem` xoá rồi dựng lại `tien_do_hs` từ `chi_tiet_cau` khi chấm lại một ca ⇒ phần lên bảng đã cộng bị mất (`DE-XUAT` mục 0, dòng "chấm lại xoá phần lên bảng").

- **Bỏ** câu lệnh `INSERT INTO tien_do_hs … ON CONFLICT … so_cau + 1` trong mảng `cau`.
- **Giữ** `INSERT INTO len_bang`, `qid_da_lam`, `UPDATE ban_do_sai SET da_chua`, và `ghiSuKien(nguon:'len_bang')` (sổ `su_kien_hoc` — nguồn sự thật mới; hồ sơ `nam_kt_*` dựng từ đó).
- Hàm giữ nguyên tên và **dạng phản hồi** `{ ok: true }` ⇒ máy thầy không phải đổi gì (nút Đạt/Không đạt gọi `ghiLenBang` → `ghiLenBangMoi`).
- **Test bị ảnh hưởng:** `tests/khoi-a-va-kho-de-1209.test.ts:89-93` đang khoá `expect(lb).toContain('INSERT INTO tien_do_hs')` — phải đổi thành `not.toContain` (đây là thay đổi theo quyết định của thầy, không phải hạ ngưỡng). Thêm test đếm: một lượt `ghiLenBang` ⇒ +1 dòng `len_bang`, +1 dòng `su_kien_hoc nguon='len_bang'`, **0** thay đổi ở `tien_do_hs`.
- **Hệ quả cần biết:** `hoSoLopLenBang.chuyenDe` đọc `tien_do_hs`. Sau khi ngừng cộng, kết quả chữa tại lớp KHÔNG còn cộng vào bảng mạnh–yếu theo chuyên đề ở đó (chỉ còn ở sổ/hồ sơ nắm). Đúng ý thiết kế ("hồ sơ mạnh–yếu đọc sổ"); nếu muốn bảng chuyên đề vẫn phản ánh lên bảng thì dựng nó từ sổ ở bước sau — **không thuộc việc này**.

## 6. Ai làm gì / khi nào

| Việc | Ai | Ghi chú |
|---|---|---|
| Phần máy thầy (đọc `namKt`, chặn cứng, dạy lại, gửi `dsQid`, xin lại hồ sơ khi đổi em/câu) | Code 1 | xong, có test, chờ 0.Planer soát rồi Pages đẩy |
| `hoSoLopLenBang` nhận `dsQid`, trả `namKt` (mục 1–4) | **Code 3** | phát hành máy chủ độc lập được (tương thích ngược) |
| `ghiLenBangMoi` ngừng cộng `tien_do_hs` (mục 5) | **Code 3** | kèm sửa 1 test khoá như nêu trên |
| Nút Đạt/Không đạt trên bảng buổi chữa (Engine E) | Code 1 | gọi đúng `ghiLenBang` mà Engine C đang dùng — máy chủ ghi `nguon='len_bang'` như hiện nay |

Cần hỏi lại điều gì về phía máy thầy: nhắn **Code 1** (tên phiên "Code 1").
