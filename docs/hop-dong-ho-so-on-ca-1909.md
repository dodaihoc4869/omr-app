# HỢP ĐỒNG MÁY THẦY ↔ MÁY CHỦ — lệnh `hoSoOnCa` (hồ sơ ôn cho RÚT ĐỀ RIÊNG, Kênh 1)

Soạn 19/09/2026 bởi phiên **Rút đề riêng** (worktree `busy-austin-a4ab8b`, làn giáo viên) cho **phiên máy chủ**.
Nguồn thiết kế: `DE-XUAT-CA-NHAN-HOA-1909.md` mục 1.1–1.2 và mục 2 "Kênh 1 — Rút đề thi".
Phần máy thầy (đã xong, có test, chờ máy chủ): `src/lib/exam-api.ts` (`hoSoOnCa`), `src/lib/de-rieng-nguon.ts`
(`docHoSoOnCa`, `dungDeRiengChoCa`), `src/lib/de-rieng.ts` (`chonCauLapChoEm`, `dungDeRieng`),
`src/lib/de-rieng-tran-trung.ts` (tập cấm theo từng em). Test: `tests/de-rieng-ho-so-1909.test.ts`.

> **Tóm một dòng:** lệnh MỚI `hoSoOnCa {secret, dsSbd[≤20], maCa, ngayCa}` trả, cho từng em, câu sai của ca gần nhất em có nộp
> kèm trạng thái hồ sơ (`sai`, `daKhacPhuc`) và các câu em vừa làm 7 ngày qua ở MỌI nguồn (`lam`).
> **Máy chủ chưa có lệnh, trả `ok:false`, hay hỏng mạng ⇒ máy thầy rút đề Y HỆT bản trước 19/09** (chỉ dùng `banDoSaiCa`) —
> nên máy chủ và Pages phát hành độc lập được, thứ tự nào cũng không hỏng ca.

Lệnh này **CHỈ ĐỌC**. Không ghi bảng nào, không đổi luật chấm, không đổi luật vào thi. `banDoSaiCa` giữ nguyên — máy thầy vẫn gọi nó
như cũ (cần bản đồ sai của MỌI ca để đếm trần lặp 3 lần); `hoSoOnCa` chỉ là lớp thông tin THÊM.

---

## 1. Yêu cầu (request)

```jsonc
POST /goi
{
  "action": "hoSoOnCa",
  "secret": "…",                          // mã bí mật thầy, như mọi lệnh thầy khác
  "dsSbd": ["12001", "12002", "12003"],   // ≤ 20 em MỘT lượt — máy thầy tự chia lô 20
  "maCa": "481203",                        // ca SẮP MỞ — phải LOẠI khỏi việc tìm "ca gần nhất"
  "ngayCa": "2026-09-21",                  // ngày VN (+07:00) của ca sắp mở, 'YYYY-MM-DD'
  "soCa": 1                                // TUỲ CHỌN: 1 (mặc định) hoặc 3 — xem mục 1.1
}
```

| Trường | Kiểu | Quy tắc |
|---|---|---|
| `secret` | chuỗi | Sai/thiếu ⇒ `{ok:false, error}` như mọi lệnh thầy. |
| `dsSbd` | `string[]` | Máy thầy đã bỏ trùng + bỏ rỗng, gửi **≤ 20**. Máy chủ **chặn cứng > 20** (`{ok:false, error:'Xin quá nhiều em một lượt'}`) — đừng cắt im lặng, máy thầy sẽ tưởng 40 em kia không có hồ sơ. Rỗng ⇒ `{ok:true, em:{}}`. |
| `maCa` | chuỗi | Ca đang chờ bấm Bắt đầu. Chưa ai nộp, nhưng vẫn phải loại tường minh (thi lại, ca mở lại). |
| `ngayCa` | `'YYYY-MM-DD'` | Mốc phải của cửa sổ `lam` (mục 2.3). Thiếu/sai khuôn ⇒ máy chủ dùng ngày VN hiện tại của máy chủ. |
| `soCa` | `1 \| 3` tuỳ chọn | Mặc định 1. Máy thầy gửi 3 khi thầy chọn phạm vi "3 ca" (`PHAM_VI_HOI_LAI = 'ba_ca'`). Giá trị khác ⇒ coi là 1. |

### 1.1 "Ca gần nhất em CÓ NỘP" — định nghĩa phải khớp máy thầy

Máy thầy (`chonCauLapChoEm`) lấy: ca **thi** (`loai ≠ 'baitap'`), **chưa xoá** (`trang_thai ≠ 'da_xoa'`), **khác `maCa`**, mà **chính em đó có nộp**
(có dòng trong `chi_tiet_cau`), sắp theo giờ mở ca MỚI NHẤT trước; `soCa = 1` lấy ca đầu, `soCa = 3` lấy tối đa 3 ca đầu.
Mỗi em một đáp số riêng — em nghỉ buổi trước thì ca của em là buổi trước nữa, KHÔNG phải ca lớp vừa thi.

Nếu hai bên chọn lệch ca (máy thầy còn lọc theo thư mục năm sinh) thì **không hỏng gì**: máy thầy tra hồ sơ THEO QID, qid nào
không thấy trong phản hồi thì xử như trước 19/09. Trường `tuCa` trả về là để máy thầy ghi biên bản khi lệch.

## 2. Phản hồi (response)

```jsonc
{
  "ok": true,
  "em": {
    "12001": {
      "tuCa": "817428",                    // ca máy chủ đã lấy nguồn (soCa=3: nối bằng " + ", mới nhất trước)
      "sai": [                             // câu em SAI ở ca đó MÀ hồ sơ còn moi_sai / dang_on
        { "qid": "Q-ES-01", "lanSai": 2, "mocOnKe": "2026-09-20", "maDang": "ESTER.THUY_PHAN_BASE.TINH_KHOI_LUONG", "trangThai": "moi_sai" },
        { "qid": "Q-ES-04", "lanSai": 1, "mocOnKe": "2026-09-25", "maDang": "CD:Ester - Lipid",                     "trangThai": "dang_on" }
      ],
      "daKhacPhuc": ["Q-ES-07"],           // câu em SAI ở ca đó MÀ hồ sơ đã da_khac_phuc — KHÔNG hỏi lại nữa
      "lam": ["Q-ES-33", "Q-ES-01", "Q-AM-12"]   // qid có sự kiện 7 ngày qua, MỌI nguồn, MỚI NHẤT đứng đầu
    },
    "12002": { "tuCa": "", "sai": [], "daKhacPhuc": [], "lam": [] },   // em chưa nộp ca nào, chưa có sự kiện ⇒ vẫn CÓ khoá
    "12003": { "tuCa": "817428", "sai": [], "daKhacPhuc": [], "lam": ["Q-ES-02"] }
  }
}
```

**Mọi `sbd` trong `dsSbd` đều có khoá trong `em`** (kể cả rỗng) — để máy thầy phân biệt "em không có gì" với "lô này hỏng".

### 2.1 `sai[]` — câu còn phải hỏi lại

Tập gốc = các `qid` trong `ban_do_sai` của (em, ca đã chọn ở 1.1). Với từng qid, tra `nam_kt_cau (sbd, qid)`:

| `trang_thai` trong hồ sơ | Đưa vào |
|---|---|
| `moi_sai`, `dang_on` | `sai[]` kèm 4 trường dưới |
| `da_khac_phuc` | `daKhacPhuc[]` (chỉ qid) |
| `chua_thay_sai` hoặc KHÔNG có dòng hồ sơ | **không đưa vào đâu cả** — máy thầy sẽ xử câu đó theo luật cũ (vẫn là ứng viên hỏi lại). Đừng đoán. |

| Trường | Kiểu | Lấy từ | Thiếu thì |
|---|---|---|---|
| `qid` | chuỗi | `nam_kt_cau.qid` | — |
| `lanSai` | số nguyên ≥ 0 | `nam_kt_cau.lan_sai` (mọi nguồn; bỏ trống không tính) | `0` |
| `mocOnKe` | `'YYYY-MM-DD'` \| `null` | `nam_kt_cau.moc_on_ke` | `null` |
| `maDang` | chuỗi \| `null` | `nam_kt_cau.ma_dang` (mã ba tầng, hoặc `CD:<chuyên đề>`) | `null` |
| `trangThai` | `"moi_sai"` \| `"dang_on"` | `nam_kt_cau.trang_thai` | — |

Thứ tự trong `sai[]` không quan trọng (máy thầy tự sắp). Không cần trả `can_day_lai`: trần lặp 3 lần máy thầy vẫn đếm bằng `banDoSaiCa` như cũ (luật đã chốt, không đổi).

**Vì sao có `daKhacPhuc` riêng mà không suy từ "vắng mặt trong `sai`":** sổ `su_kien_hoc` có chỗ thưa (nạp lại chưa đủ, BTVN thiếu 135 dòng — xem BÀN GIAO).
Suy "vắng = đã khắc phục" thì một câu CHƯA có dòng hồ sơ sẽ bị bỏ hỏi lại IM LẶNG. Máy thầy chỉ bỏ câu khi máy chủ nói thẳng `da_khac_phuc`.

### 2.2 `tuCa`

Mã ca đã lấy nguồn. Em chưa nộp ca nào ⇒ `""`. Chỉ để ghi biên bản, máy thầy không dựa vào nó để quyết định.

### 2.3 `lam[]` — câu em vừa làm trong tuần

`qid` có **ít nhất một dòng** trong `su_kien_hoc` của em với `ngay_vn` trong `[ngayCa − 7 ngày, ngayCa]` (đủ cả hai đầu), **mọi `nguon`**
(`thi, btvn, btvn_lo, khac_phuc, mom, len_bang, game, luyen`), **mọi `ket_qua`** (đúng, sai, bỏ trống đều tính — em ĐÃ THẤY câu đó).

- Khử trùng theo qid. **Sắp `MAX(luc)` GIẢM DẦN, hoà thì `qid` tăng dần** — thứ tự này là một phần hợp đồng: khi kho mỏng máy thầy
  phải nới tập cấm của đúng em đó và nới **từ CUỐI mảng** (câu cũ nhất trước).
- Chặn **≤ 400 qid/em** (cắt phần cũ nhất). Thực tế ~100–150/em/tuần.
- Câu của chính ca thi tuần trước CŨNG nằm trong `lam` — đúng ý: phần câu MỚI không phát lại câu em vừa thi. Câu khắc phục (Pha A)
  không bị `lam` chặn — máy thầy tự miễn.

## 3. Máy thầy dùng từng trường ra sao

| Trường | Dùng ở | Tác dụng |
|---|---|---|
| `daKhacPhuc` | Pha A (`chonCauLapChoEm`) | Bỏ khỏi ứng viên hỏi lại VÀ khỏi danh sách "cần dạy lại". **Số câu lặp CẦN không đổi** (vẫn `min(n, ceil(0,3·n))` trên số câu SAI ca trước, n đếm từ `banDoSaiCa`); còn ít hơn số cần thì trả ít + lý do `da_khac_phuc` — không độn. |
| `sai[].mocOnKe` | Pha A | Cùng mức ưu tiên (số lần sai ở các ca thi) thì câu `mocOnKe ≤ ngayCa` đứng trước, quá hạn lâu hơn đứng trước nữa. Chỉ đổi THỨ TỰ. |
| `sai[].maDang` | Song sinh | Khoá ghép câu song sinh = `phan + maDang` (thay `phan + lý thuyết/bài tập`). Mã dạng của ỨNG VIÊN lấy từ kho máy thầy (`dang.ma` của câu, thiếu thì `CD:<chuyên đề>`) — **cùng bảng mã với `su_kien_hoc.ma_dang`** (`su-kien-hoc.ts:418`). Thiếu `maDang` ⇒ khoá cũ. |
| `sai[].lanSai`, `trangThai` | biên bản | Chưa đổi luật nào. Giữ trong hợp đồng để bước sau dùng không phải đổi lệnh. |
| `lam` | Pha B (`sinhBoMotO`) + song sinh | Tập CẤM THEO TỪNG EM cho phần câu mới; ứng viên song sinh cũng né. Kho mỏng ⇒ nới từ cuối mảng, số câu nới ghi vào kết quả (`noiCam`) và biên bản. |

## 4. Tương thích ngược — bảng quyết định

| Tình huống | Máy chủ | Máy thầy |
|---|---|---|
| Máy chủ đời cũ (không biết `hoSoOnCa`) | trả `ok:false` / 404 | bắt lỗi ⇒ **đúng đường cũ**, `boTheoEm` y hệt bản trước 19/09 (test khoá) + một dòng biên bản "chưa đọc được hồ sơ ôn" |
| Bảng `nam_kt_cau` / `su_kien_hoc` chưa có (D1 chưa migration, fixture test) | **bọc `try/catch` ⇒ `{ok:false, error}`** — ĐỪNG trả `ok:true` với dữ liệu rỗng (rỗng thật ≠ hỏng) | như dòng trên |
| Một lô 20 em hỏng, lô khác được | — | lô hỏng: các em đó không có hồ sơ (luật cũ cho riêng các em), lô khác vẫn dùng; biên bản ghi số em |
| Em không có dòng nào | `{tuCa:"", sai:[], daKhacPhuc:[], lam:[]}` | em đó đi đúng luật cũ |
| Trường sai kiểu / giá trị lạ | — | `docHoSoOnCa` đọc phòng thủ: `trangThai` lạ ⇒ bỏ dòng; `mocOnKe` sai khuôn ⇒ `null`; `lam` không phải mảng chuỗi ⇒ `[]` — dòng hỏng không thể làm mất câu hỏi lại của em |

## 5. Giới hạn chi phí + gợi ý cài đặt (phiên máy chủ quyết, đây chỉ là điểm vào)

**≤ 3 truy vấn D1 cho MỘT lượt gọi** (≤ 20 em). 60 em = 3 lượt = ≤ 9 truy vấn. Mỗi truy vấn MỘT tham số `json_each(?)` cho danh sách
(bẫy D1: ≤ 100 tham số, UNION ≤ ~5 vế — mục BÀN GIAO của `SO-VIEC.md`).

1. **Ca gần nhất từng em** — một truy vấn gộp, chọn trong JS:
   `SELECT t.sbd, t.ma_ca, c.mo_luc FROM (SELECT DISTINCT sbd, ma_ca FROM chi_tiet_cau WHERE sbd IN (SELECT value FROM json_each(?1)) AND ma_ca <> ?2 AND qid <> '') t JOIN ca c ON c.ma_ca = t.ma_ca WHERE <c là ca thi, chưa xoá> ORDER BY c.mo_luc DESC`
   → JS: với mỗi sbd lấy `soCa` dòng đầu. (Tên cột `ca` xin đối chiếu lược đồ thật — bẫy "5 cột không có migration".)
2. **Câu sai + hồ sơ** — nối `ban_do_sai` với `nam_kt_cau`:
   `SELECT b.sbd, b.ma_ca, b.qid, k.ma_dang, k.lan_sai, k.moc_on_ke, k.trang_thai FROM ban_do_sai b LEFT JOIN nam_kt_cau k ON k.sbd = b.sbd AND k.qid = b.qid WHERE b.sbd IN (SELECT value FROM json_each(?1)) AND b.ma_ca IN (SELECT value FROM json_each(?2))`
   → JS: giữ dòng có `(sbd, ma_ca)` đúng cặp đã chọn ở bước 1; phân vào `sai` / `daKhacPhuc` theo bảng 2.1.
3. **`lam`**:
   `SELECT sbd, qid, MAX(luc) AS luc FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?1)) AND ngay_vn >= ?2 AND ngay_vn <= ?3 GROUP BY sbd, qid ORDER BY luc DESC, qid ASC`
   (chỉ mục `(sbd, ngay_vn)` đã có.)

Test gợi ý (SQLite thật qua `tests/_d1-that.ts`): (a) em sai 4 câu ca trước, 1 câu `da_khac_phuc`, 2 câu `moi_sai/dang_on`, 1 câu chưa có dòng hồ sơ
⇒ `sai` 2, `daKhacPhuc` 1, câu còn lại không xuất hiện; (b) em nghỉ ca gần nhất ⇒ `tuCa` là ca trước nữa; (c) `maCa` đang mở bị loại;
(d) `lam` đúng cửa sổ 7 ngày, đủ 8 nguồn, mới nhất trước; (e) `dsSbd` 21 em ⇒ `ok:false`; (f) thiếu bảng ⇒ `ok:false`, không ném lỗi;
(g) đếm truy vấn ≤ 3; (h) `soCa = 3` ⇒ hợp 3 ca gần nhất em có nộp; (i) `banDoSaiCa` giữ nguyên phản hồi.

## 5b. Cập nhật 19/09 chiều — máy thầy gọi thêm MỘT lượt cho em vắng (máy chủ KHÔNG phải đổi gì)

Từ bản "lượt hai" (em cùng lớp chưa vào phòng chờ được chuẩn bị đề sẵn), mỗi lần thầy bấm Bắt đầu máy thầy gọi `hoSoOnCa` thêm một lượt
cho danh sách em vắng — cùng `maCa`, `ngayCa`, `soCa`, vẫn chia lô ≤ 20, chạy SONG SONG với các lô của em có mặt. Lớp 40 em (25 có mặt)
= 3 lệnh (20 + 5 + 15) thay vì 2. Lượt của em vắng hỏng thì chỉ em vắng rút theo luật cũ. Ghi chú lệch đã biết của máy chủ so với gợi ý ở mục 5:
cột giờ mở ca là `ca.bat_dau` (không phải `mo_luc`) — khuôn phản hồi giữ đúng hợp đồng.

## 6. Ai làm gì

| Việc | Ai | Ghi chú |
|---|---|---|
| Phần máy thầy (gọi lệnh, đọc phòng thủ, Pha A/B, song sinh, rơi về luật cũ) | phiên Rút đề riêng | xong trên nhánh `claude/busy-austin-a4ab8b`, chờ 0.Planer soát |
| Lệnh `hoSoOnCa` theo mục 1–5 | **phiên máy chủ** | phát hành độc lập được (tương thích ngược hai chiều) |
| Gộp nhánh + phát hành Pages | 0.Planer | không có ca thi mở mới phát hành |
