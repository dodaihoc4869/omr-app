# ĐỀ XUẤT — CÁ NHÂN HOÁ "TIẾN BỘ TỪNG NGÀY" CHO 5 KÊNH

Soạn 19/09/2026 · **Chưa build.** Gõ `HÃY THỰC THI PROMPT NÀY` mới làm.

Nguồn: 15 agent đọc mã (896 lượt đọc, 40 nghìn dòng `src/lib` + 9 nghìn dòng máy chủ,
chạy cả bộ 350 tệp test), 3 phương án thiết kế độc lập, tổng hợp lấy phần mạnh nhất
của từng phương án. Mọi tên bảng/hàm/tệp dưới đây đã đối chiếu với mã thật.

---

## 0. HIỆN TRẠNG — VÌ SAO CHƯA "TIẾN BỘ TỪNG NGÀY" ĐƯỢC

Không phải thiếu thuật toán. Dự án có sẵn nhiều mô-đun tốt, nhưng **rời nhau**:

| Vấn đề | Chứng cứ trong mã |
|---|---|
| **7 kho kết quả không nhìn thấy nhau.** Em làm đúng lại câu sai ở BTVN/khắc phục/bài mẹ giao/game thì rút đề, khắc phục, lên bảng vẫn coi câu đó "sai chưa chữa". | Chỉ `chamDiem` (ca thi) và `ghiLenBangMoi` ghi `ban_do_sai`/`qid_da_lam`. `nopBtvnQuaPhieu`, `nopKhacPhuc`, `mom.submit`, `luyen-de`, game chỉ ghi bảng riêng của mình. |
| **3 ngân sách ngày, không nơi nào đọc nơi kia.** | Trợ lý HS `tinhNganSachNgay` (8–16, tốc độ cắm cứng 90 s/câu ở `tro-ly-ca-nhan.ts:273`); bảng tin PH `analyzeParent` (6–18, đo tốc độ thật); phiếu BTVN `btvn-cho-em.ts:103` (12 câu cố định, tải khác = 0). |
| **Lô BTVN cắt theo thứ tự tờ đề**, câu sai/chuyên đề yếu có thể nằm lô cuối, câu 2 sao ở lô đầu. | `tinhLichLoBtvn` chỉ đếm số câu; `phanTangBtvn` (biết chuyên đề yếu) không được gọi ở đâu. |
| **"Xong lô" không cần đúng.** Điền đủ đáp án là xong; không chấm, không phản hồi. | `html-phieu.ts:2009-2021` + `/btvn/xong-lo` chỉ ghi số lô. |
| **6 định nghĩa "sai", 5 định nghĩa "chuyên đề yếu", 3 luật chấm câu.** | `hsCauSai` coi bỏ trống = sai; `ban_do_sai` không; `isAnswerCorrect`/`danhGiaLuot`/`gradeMom` chấm Phần III khác nhau ('0,39' vs '0.39'). |
| **Lỗi dữ liệu nền.** | `ban_do_sai.so_lan_sai` không bao giờ > 1 (ON CONFLICT không cộng, `index.ts:2143`); `da_chua` chỉ bật khi lên bảng đạt; chấm lại một ca **xoá** phần lên bảng đã cộng vào `tien_do_hs` (`index.ts:2195` vs `2263`). |
| **Thần thú không biết BTVN.** "Tự phân thêm bài khi thiếu" chưa tồn tại. | `chooseSession` chỉ đọc bằng chứng ca thi đã công bố (`readScope`); `game_v2_task` chỉ sinh khi PH bấm "nhắc ôn dạng". |
| **Phụ huynh giao hàng ngày có ở máy chủ nhưng giao diện mặc định không hiện.** | `parent-news.ts` tạo `daily_<ngày>`; `BangTinPhuHuynh` chỉ mount khi `giaoDienCu=true`. `daily_` chưa nộp lại tự đếm vào tồn đọng của chính nó. |
| **Đáp án nằm trong phiếu BTVN máy em.** | `html-phieu.ts:2433` nhét `dapAn` vào `#du-nop` — trái luật "đáp án không đi đường công khai". |

Kết luận: cần **một sổ bằng chứng chung**, **một hồ sơ nắm kiến thức**, **một bộ điều phối
ngày** — rồi 5 kênh đọc/ghi qua đó. Không viết lại engine chọn câu nào (chúng đã tốt và
có test); chỉ đổi **đầu vào** cho chúng.

---

## 1. KIẾN TRÚC — BA TẦNG, MỘT CHIỀU

```
[7 nguồn kết quả] ──ghiSuKien()──▶ su_kien_hoc (sổ, chỉ ghi thêm)
                                        │ phát lại tất định
                                        ▼
                               nam_kt_cau / nam_kt_dang (hồ sơ nắm, Leitner 1/3/7 ngày)
                                        │
                                        ▼
                lapKeHoachNgay() ──▶ ke_hoach_ngay (1 dòng/em/ngày: việc đã xếp + ngân sách + cảnh báo)
                                        │
        ┌──────────┬──────────┬─────────┼──────────┬──────────┐
        ▼          ▼          ▼         ▼          ▼          ▼
     Rút đề     BTVN/lô   Lên bảng   Thần thú   PH hàng ngày  Bảng tin HS/PH
```

Nguyên tắc: **kênh nào chấm thì kênh đó ghi sổ**; **không kênh nào tự tính ngân sách**;
**mọi thứ tất định** (seed = `hashSeed(sbd|ngày|phiên bản)`, `now` = giờ máy chủ truyền vào).

### 1.1 Tầng sổ — `su_kien_hoc` (migration mới, chỉ thêm)

```
khoa      TEXT PK  = nguon|ma_nguon|sbd|qid|lan
sbd, qid, nguon ∈ {thi, btvn, btvn_lo, khac_phuc, mom, len_bang, game, luyen}
ma_nguon  (ma_ca / ma_btvn / ma_phieu / mom id / session / luyen id)
ket_qua   INTEGER  1 = đúng, 0 = sai, NULL = bỏ trống
giay      INTEGER  NULL nếu nguồn không đo
luc       TEXT ISO · ngay_vn TEXT 'YYYY-MM-DD' (+07:00)
ma_dang, chuyen_de, muc_do  (từ gói đề; ma_dang = game_v2_question.dang ?? 'CD:'+chuyen_de)
INDEX (sbd, ngay_vn), (sbd, qid)
```

Một hàm `ghiSuKien(env, ds[])` trong `server/src/su-kien-hoc.ts`, batch ≤ 40 dòng, idempotent theo `khoa`. Móc vào **7 chỗ đã có sẵn đáp án chấm trong tay**:

| Nguồn | Móc | ket_qua lấy từ |
|---|---|---|
| Ca thi | `chamDiem` (`index.ts:2085`) sau INSERT `chi_tiet_cau`; `luuChiTietCauNeuChuaCo` (`goi-cu.ts:2713`) | `dung_sai`, `giay` |
| BTVN cả bài | `nopBtvnQuaPhieu` (`goi-cu.ts:846`) | `isAnswerCorrect` (`btvn-grading.ts`) — đúng hàm academic-sync đang dùng |
| BTVN theo lô | `/btvn/xong-lo` **nhận thêm `dapAn` của lô** | như trên, `lan` = chỉ số lô |
| Khắc phục | `nopKhacPhuc` (`goi-cu.ts:969`) | `isAnswerCorrect` vs `phieu/*.json` |
| Mom / daily | `mom.ts` submit | `isAnswerCorrect` cho **sổ**; điểm bài vẫn `gradeMom` (không đổi điểm đã công bố, giữ test mom-delivery) |
| Lên bảng | `ghiLenBangMoi` (`index.ts:2252`) | đạt → 1, không đạt → 0 |
| Game v2 | `answer` trong `game-v2.ts` sau khi tạo attempt | `correct && !assisted` (trợ giúp không tạo bằng chứng — giữ bất biến) |
| Luyện đề | `luyen-de.ts` submit | result từng câu |

**Nạp lại dữ liệu cũ** một lần: lệnh thầy `POST /ho-so/nap-lai {sbd[]}` (≤ 20 em/lượt) đọc theo thứ tự `luc`: `chi_tiet_cau` → `len_bang` → `btvn_em.dap_an_json` → `nop_khac_phuc` → `mom_bai` → `game_v2_attempt` → `luyen_de_2026`, chấm lại từ R2 bằng cùng hàm.

Chi phí: mỗi lượt nộp thêm ≤ 3 câu lệnh (đúng luật "1–3 câu/lệnh"). Sổ tăng ~30 dòng/em/ngày.

### 1.2 Tầng hồ sơ — `nam_kt_cau` (em × câu) và `nam_kt_dang` (em × dạng)

Dựng **thuần** từ sổ bằng `phatLaiSuKien(sbd)` (phát lại 2 lần ra cùng trạng thái — có test).

`nam_kt_cau (sbd|qid)`: `lan_gap, lan_sai, lan_trong, dung_lien_tiep, ngay_dung_khac_nhau, ket_qua_cuoi, nguon_cuoi, luc_cuoi, moc_on_ke (ngày VN), trang_thai, giay_tb`.

**Chuyển trạng thái** (hằng số một nguồn `server/src/ho-so-cau-hinh.ts`: `MOC_ON=[1,3,7]` ngày, `SO_MOC_KHAC_PHUC=3`, `SO_CAU_DU_TIN=4`, `NGUONG_DANG_YEU=0.7`, `TRAN_LAP_MOT_CAU=3` — dùng chung với `chan-doan-cau-hinh.ts`, test soi hai bản không lệch):

| Sự kiện ngày d | Cập nhật |
|---|---|
| sai (0) | `lan_sai+1`, `dung_lien_tiep=0`, `ngay_dung_khac_nhau=0`, `moc_on_ke=d+1`, `trang_thai=moi_sai`; dạng: hạ 1 bậc |
| bỏ trống (NULL) | `lan_trong+1`, `moc_on_ke=d+1`, `moi_sai` nếu chưa từng đúng; **không** cộng `lan_sai` (bỏ trống ≠ sai, khớp `dem-ket-qua-test4`) |
| đúng (1), cùng `ngay_vn` với lần đúng trước | chỉ cập nhật `luc_cuoi` (làm 3 lần một tối không thành 3 mốc) |
| đúng (1), ngày khác | `dung_lien_tiep+1`, `ngay_dung_khac_nhau+1`, `moc_on_ke = d + MOC_ON[min(dung_lien_tiep−1, 2)]`; `trang_thai` = `da_khac_phuc` nếu `lan_sai>0 && ngay_dung_khac_nhau ≥ 3`, `dang_on` nếu `lan_sai>0`, `chua_thay_sai` nếu `lan_sai=0`; dạng: nâng 1 bậc |
| `lan_sai ≥ 3` và `dung_lien_tiep = 0` | thêm nhãn `can_day_lai` — rơi khỏi mọi kênh tự động, vào danh sách "dạy lại" trên tờ máy chiếu lên bảng (bắt buộc) |

Ví dụ: em A 20/09 sai ES-01 → mốc 21/09. 21/09 đúng ở lô BTVN → `dang_on`, mốc 22/09. 22/09 đúng ở game → mốc 25/09. 25/09 đúng trong ca thi → `da_khac_phuc`, mốc 02/10 (ôn duy trì). 22/09 sai lại → về `moi_sai`, mốc 23/09, bậc dạng hạ.

`nam_kt_dang (sbd|ma_dang)`: `so_gap, so_sai, so_da_khac_phuc, bac ∈ {biet,hieu,van_dung}, moc_on_ke = min mốc các câu chưa khắc phục`. Đây là `lich-on-lai.ts` (đang chỉ có test, đơn vị BUỔI) chuyển lên máy chủ, đơn vị **NGÀY** — khớp mastery game v2.

**Định nghĩa "dạng yếu" duy nhất** (thay 5 định nghĩa hiện có): `so_gap ≥ 4 && (so_da_khac_phuc + số câu chua_thay_sai)/so_gap < 0.7`, hoặc có ≥ 1 câu `moi_sai` tới hạn. Chữ hiển thị luôn kèm số ("đúng 2/3 mốc"), không bao giờ in "nắm chắc".

### 1.3 Tầng điều phối — `lapKeHoachNgay()` → `ke_hoach_ngay`

Hàm thuần `server/src/ke-hoach-ngay.ts` (máy chủ đã import `../../src/...` nên dùng chung `tinhLichLoBtvn`, `loDangCho`, `tinhNganSachNgay`, `hashSeed`).

**Đầu vào** (mỗi em, 8 truy vấn gộp theo lớp `WHERE sbd IN (...)`): BTVN chưa nộp (kèm 2 cột mới `btvn_em.ngan_sach_lo, tai_khac_lo` đóng băng lúc giao), mom/daily chưa nộp, `nam_kt_cau` tới hạn, `nam_kt_dang` yếu, ca thi của lớp ≤ 3 ngày tới, `game_v2_task` mở, `study_preferences.minutes`, `ke_hoach_ngay` 7 ngày trước.

**Ngân sách ngày** — giữ nguyên `tinhNganSachNgay(tongPending, tongCauSai, vanToc, daLam)` (test đang khoá 8–16), chỉ **sửa đầu vào** và thêm tham số thứ 5 `phutNgay?` chỉ được hạ:
- `vanToc` = trung vị `giay` 30 ngày từ sổ (lọc 5..1200 s, ≥ 5 mẫu, kẹp [45, 240]); thiếu → 90 và chữ "chưa đo được tốc độ (N/5 mẫu)".
- `tongCauSai` = số qid `trang_thai ∈ {moi_sai, dang_on}` (giảm khi em chữa được — hết "kẹt 8 câu vĩnh viễn").
- `tongPending` = số **bài** chưa nộp còn hạn (đúng đơn vị test).
- `phutNgay` = `study_preferences.minutes` (bảng đã có, chưa ai ghi; PH/em đặt trong [10, 45]).
- Điều chỉnh lịch sử: 7 ngày có ≥ 3 ngày không đạt → −2 (sàn 8); 7/7 đạt và vanToc < 75 → +2 (trần 16). `toiThieuCau = clamp(round(mucTieu/2), 4, 8)`.
- `taiKhac` (đóng băng lúc giao) = Σ bài khác còn hạn `conLai_j / max(1, soNgayConLai_j)` — bài hạn 2 tuần không bóp lô hôm nay.

**Xếp việc** (tất định):
```
cung = [lô BTVN đang chờ (loDangCho — đúng 1 lô/bài, xong sớm KHÔNG mở sớm), mom đã bắt đầu]
       sắp theo EDF: hạn cứng → mốc lô kế → loại
mem  = [ôn tới hạn (nam_kt_cau.moc_on_ke ≤ hôm nay, ≤ 40% mụcTiêu),
        thần thú (dạng yếu nhất, bội 6 câu), ôn thi (ca ≤ 3 ngày, 4 câu)]
kiểm khả thi: ∀k  Σ_{i≤k} conLai_i ≤ B × ngày(now → hạn_k)   // điều kiện cần-và-đủ của EDF
   không đạt → cảnh báo khong_kip {bài, canMoiNgay}, đề xuất tăng tạm (≤16) hoặc "cần Thầy gia hạn"
bu     = taiCung < toiThieu ? lấy từ mem đủ (toiThieu − taiCung) : []        // "tự phân thêm khi thiếu"
tuyChon = taiCung + Σbu < B ? phần còn lại của mem : []
taiCung > B → nhãn qua_tai +X, cắt việc mềm, KHÔNG cắt việc bắt buộc (chốt G08)
viec = [...cung, ...bu, ...tuyChon]; cong[i] = viec[i−1].id
```

**Cổng hiển thị**: việc *i* hiện khi mọi việc bắt buộc trước nó đã xong (có đủ sự kiện trong sổ) **hoặc** việc *i* mang `khan`. Vì thứ tự là EDF, cổng không bao giờ che một hạn gần hơn hạn đang hiện.

**Đầu ra** `ke_hoach_ngay (sbd, ngay)`: `phien_ban, seed, ngan_sach_json, viec_json[{id, loai, thuTu, soCau, hanCung, hanMem, batBuoc, khan, cong, nguon, trangThai}], canh_bao_json, ket_qua ∈ {NULL, dat, mot_phan, khong}, so_cau_da_lam, so_cau_len_bac, so_cau_tut_bac`. Ngày đã qua không sửa (để streak đọc).

**Chạy**: cron `'1 17 * * *'` đã có (`index.ts:2703`) chốt ngày cũ + lập ngày mới theo lớp (≈10 câu lệnh/lớp); lập lại khi có sự kiện: `giaoBtvn`, `mom create`, mọi handler nộp, `suaBtvn` (gia hạn/reset). Đọc: `POST /hs/ke-hoach-ngay` (token HS, công khai như `/btvn/cua-em`); PH đọc qua `/ke-hoach/xem`.

**"Hôm nay tiến bộ"** (`ket_qua = dat`): `so_cau_da_lam ≥ toiThieuCau` (qid khử trùng, mọi nguồn, kể cả lô và game) **và** không việc bắt buộc nào trễ nhịp **và** (`so_cau_len_bac ≥ 1` hoặc không có câu tới hạn). Nộp ≠ nắm: bảng tin chỉ nói "đã làm N câu, 2 câu lên bậc". **Streak** = ngày `dat` liên tiếp; ngày nghỉ thầy đặt (`cau_hinh` key `ngay_nghi`) không đứt. `so_cau_khac_phuc` cần ít nhất 11 ngày cho một câu (3 mốc 1/3/7) — phải nói trước với PH.

**Nhãn**: `khan_cap` (trễ nhịp lô hoặc hạn ≤ 24 h), `qua_han` (liệt kê riêng + nút "Xin Thầy gia hạn" → `tin_nhan`; **không** đếm vào tồn đọng — hết kẹt `quaTai ≥ 40` vĩnh viễn), `khong_kip {canMoiNgay}`, `qua_tai +X`, `bu`, `tuy_chon`.

---

## 2. TỪNG KÊNH

### Kênh 1 — Rút đề thi (cả lớp cùng lúc)
Giữ nguyên `sinhBoTheoEm`, blueprint parity ("cấm cho em này đề dễ hơn em kia" — chốt), chặn trần trùng ≤ 2, seed `hashSeed`, luật 30% trên số câu sai ca trước. Đổi **đầu vào**:
- `banDoSaiCa` (`goi-cu.ts:1355`) → thêm lệnh `hoSoOnCa(dsSbd, maCa)` trả: `sai` = câu ca gần nhất em nộp có `trang_thai ∈ {moi_sai, dang_on}` (câu `da_khac_phuc` ở BTVN/game **không** hỏi lại nữa); `lam` = qid có sự kiện 7 ngày qua mọi nguồn.
- Pha A ưu tiên câu `moc_on_ke ≤ ngày ca`; song sinh (`de-rieng.ts:194`) khoá theo `ma_dang` thay `${phan}:{ly_thuyet|bai_tap}`, ứng viên xoay theo `hash(seed|sbd)` thay "lấy đầu tiên" (hết chuyện cả nhóm nhận cùng twin).
- Pha B truyền `tranhQid = lam` (hiện `de-rieng-nguon.ts:492` truyền `[]`) — đề thi không trùng câu vừa giao BTVN/khắc phục trong tuần.
- `thi-lai.ts:79` seed = `hashSeed(maCa|sbd|lanThu)` thay `Date.now()`.
- `dsSbd` đề riêng = **phòng chờ** (không ∪ cả lớp — `ExamMonitorScreen.tsx:743-747` đang trái ghi chú/test).

### Kênh 2 — BTVN
Giữ `giaoBtvn` nguyên tờ, `btvnCuaEm` không sort/slice, hạn 48 h, 3 lượt làm lại, `/btvn/xong-lo` chỉ tăng.
- Lúc giao, máy chủ điền `btvn_em.ngan_sach_lo, tai_khac_lo` (đóng băng) và `lo_json` = danh sách qid mỗi lô từ hàm thuần `chiaCauVaoLo(qids, hoSoEm, lich)`: lô sớm = câu `moi_sai/dang_on` + câu dạng yếu bậc thấp; lô cuối = câu 2 sao dạng `chua_thay_sai`; cỡ lô vẫn từ `tinhLichLoBtvn`. **Số thứ tự trên tờ không đổi** (thầy vẫn gọi bảng theo số câu).
- `btvn-cho-em.ts:103`, `tro-ly-ca-nhan.ts:351`, `html-phieu.ts` cùng đọc `lich` + `dsQidSang` từ máy chủ (`hsBtvn` trả) → **một lịch lô**, xoá ba cách tính `soCauSang`.
- `/btvn/xong-lo` nhận `dapAn` lô → chấm → ghi sổ `btvn_lo` → tiến bộ trong ngày và streak tính ngay; nộp cả bài không ghi trùng (khoá sự kiện).
- **Bỏ** đáp án khỏi `#du-nop` (`html-phieu.ts:2433`) — máy chủ chấm.
- **Bỏ** ô `thu_thach_vong3`/`sua_loi_vong1` cố định, banner "3 VÒNG", chữ "nắm chắc" (`StudentPortalScreen.tsx:1635`, `html-phieu.ts:1555`) → thay bằng việc từ kế hoạch ngày.

### Kênh 3 — Gọi lên bảng (cả lớp)
Giữ Engine E (`xep-buoi-chua.ts`, thầy chốt 14/09), sàn 20 em/90′, không 2 em một câu.
- `hoSoLopLenBang` (`goi-cu.ts:1420`): `qidDung/qidSai/qidChuaLam` từ sổ (`btvn`, `btvn_lo`, thêm nguồn `khac_phuc`, `mom`) thay tự so chuỗi thô (hết chuyện '0,39' đúng ở BTVN, sai khi đối chiếu).
- `diemHopCau` (`ho-so-lop.ts`): `pSai = min(1, lan_sai/2)` từ hồ sơ thật (hết kẹt 0,5), "đã chữa" 0,35 = `trang_thai = da_khac_phuc`, `pYeu` từ `nam_kt_dang`; **chặn cứng**: em `bac = biet` ở dạng đó không nhận câu 2 sao; câu `can_day_lai` → bắt buộc lên bảng.
- Tờ máy chiếu Engine E **có nút Đạt/Không đạt** → `ghiLenBangMoi` → sổ `len_bang` (hiện chỉ Engine C ghi).
- `ghiLenBangMoi` **ngừng** cộng thẳng `tien_do_hs` (`index.ts:2263`) — hết bị `chamDiem` xoá; hồ sơ mạnh–yếu đọc sổ.
- `phan-cong-day-hoc.ts:42` nhận seed thay `Math.random`.

### Kênh 4 — Thần thú (tự phân nhiệm vụ + tự phân thêm khi thiếu)
- `readScope` (`game-v2-bank.ts`) lấy bằng chứng từ `nam_kt_cau` (mọi nguồn) thay `chi_tiet_cau` ca công bố → câu sai ở BTVN/mom thành "weak"; `due` của mastery = `moc_on_ke` (**một đồng hồ ôn**).
- Bộ điều phối **sinh `game_v2_task`** (đường nội bộ, không qua `parentGame` → test "PH chỉ nhắc dạng có mastery" giữ): `dang` = dạng yếu nhất có câu tới hạn; cỡ = việc `bu` (bội 6, `min(mucTieu − taiCung, 12)`). Đây chính là "tự phân thêm bài khi ngày thiếu".
- `chooseSession` nhận `blocked` = qid đã giao hôm nay ở BTVN/mom (cơ chế chặn đã có), nhận `now` từ máy chủ thay `Date.now()`.
- Còn lô BTVN tới mốc chưa xong: vẫn chơi được, nhưng ô nhiệm vụ đứng sau cổng và `Game.tsx` hiện "Làm Lô N trước" (payload `{bt}` như trợ lý).
- Sửa `tro-ly-ca-nhan.ts:564-567` đọc `game_v2_profile` thay `than_thu` V1 (đang luôn undefined → "hoa_long cấp 1"). EXP giữ 2/câu, trần 100/ngày (chốt).

### Kênh 5 — Phụ huynh giao bài hàng ngày
- `analyzeParent` (`parent-news.ts:87`): `questionCount = du_cau` từ kế hoạch (0 nếu con đã đủ việc thầy giao, lý do nói rõ); câu = ôn tới hạn (`moc_on_ke ≤ hôm nay`, kể cả `da_khac_phuc` tới mốc duy trì = ôn giãn cách thật) → câu mới cùng dạng yếu ở bậc `nam_kt_dang.bac` → bù kho **có lọc chuyên đề/lớp**; loại qid có sự kiện 3 ngày qua (hết giao lại 4–5 câu cũ). Bỏ `.sort(sao ASC)` phá rải chuyên đề.
- `daily_` chưa bắt đầu tới 00:01 hôm sau → `bo`, không tính tồn đọng. Tồn đọng chỉ đếm bài **còn hạn**.
- 1-click câu sai dùng `nam_kt_cau` (có `qid` → outcomes khớp, hết lỗi `cau_N`).
- Mom tay: giữ G08 "không tự giảm số câu, không tự ngăn giao", nhưng PH **thấy nhãn `qua_tai +X` trước khi bấm**.
- `BangTroLyPhuHuynh` (mặc định) đọc `/ke-hoach/xem` → thấy con đang nợ lô nào, ngân sách thật; PH đặt `study_preferences.minutes` (handler mới, chỉ hạ). Cần token PH (bảng `phu_huynh` chưa có handler — hiện ai biết SBD cũng giao bài được).
- Mom 120′ từ lúc bắt đầu: **giữ nguyên** (chốt).

---

## 3. MÂU THUẪN HIỆN CÓ → CÁCH XỬ

| Mâu thuẫn | Xử |
|---|---|
| 6 định nghĩa "sai" | Sổ ghi `1/0/NULL`; "cần khắc phục" = 0 ∪ NULL (khớp `soCanKhacPhuc = tong − dung`); `lan_sai` chỉ đếm 0 |
| 5 định nghĩa "chuyên đề yếu" | Một định nghĩa §1.2 trên `nam_kt_dang`; `NGUONG_YEU=0.3/SO_CAU_DU_TIN=4` của `HoSoEmView` giữ xuất (test) nhưng đổi nhãn thành "tỉ lệ sai tích luỹ" |
| 3 ngân sách ngày | Một dòng `ke_hoach_ngay.ngan_sach_json`; `tinhNganSachNgay` client giữ làm dự phòng offline (test không đổi) |
| 2 nơi tính lô | Đầu vào đóng băng trong `btvn_em`, cả hai gọi cùng `tinhLichLoBtvn` |
| 3 luật chấm | **Sổ** dùng `isAnswerCorrect` duy nhất; điểm bài giữ hàm cũ (không đổi điểm đã công bố) |
| `so_lan_sai` không tăng, `da_chua` chưa bao giờ bật | Không sửa `ban_do_sai` (khoá theo ca là chủ ý); số thật ở `nam_kt_cau`; `da_chua` bật khi `da_khac_phuc` để `cauSaiCuaEm` cũ vẫn đúng |
| `tien_do_hs` bị xoá khi chấm lại | Bỏ ghi từ `ghiLenBangMoi`; lên bảng vào sổ |
| `nop_khac_phuc` đè lượt | Sổ giữ mọi lượt (`lan`) |
| `taiKhac` đếm cả bài hạn xa; `daily_` tự đếm vào tồn đọng; BTVN quá hạn kẹt `quaTai` | Công thức câu/ngày §1.3; `daily_` bỏ sau ngày; quá hạn liệt kê riêng |
| Lô theo khung 24 h vs ngày lịch VN | Kế hoạch theo ngày VN; lô vẫn theo khung (bất biến test); nhãn quy về ngày VN |

---

## 4. LỘ TRÌNH — 7 GIAI ĐOẠN, MỖI GIAI ĐOẠN ≤ 1 NGÀY CÔNG, PHÁT HÀNH RIÊNG

| GĐ | Việc | Test mới | Test phải đổi |
|---|---|---|---|
| **0 Sổ** | migration `su_kien_hoc`; `ghiSuKien`; móc 7 handler; `/ho-so/nap-lai`; đếm dòng kiểm chéo "số sự kiện thi = số dòng `chi_tiet_cau`" | idempotent; trống ≠ sai; mỗi handler ghi đúng số dòng; bảng cũ không đổi | không |
| **1 Hồ sơ** | `nam_kt_cau/dang`; `phatLaiSuKien`; `ho-so-cau-hinh.ts` | phát lại 2 lần cùng trạng thái; 3 đúng cùng ngày = 1 mốc; sai lại về mốc 1; `can_day_lai` | không |
| **2 Kế hoạch** | `ke-hoach-ngay.ts` thuần + bảng + `/hs/ke-hoach-ngay` + cron + lập lại theo sự kiện; `study_preferences` handler | cùng đầu vào cùng JSON; EDF đúng thứ tự; khả thi báo số; cổng không che hạn gần; 0 việc → `bu` đủ `toiThieu`; thiếu mẫu giây nói ra | không |
| **3 Lô một nguồn** | 2 cột + `lo_json` `btvn_em`; `chiaCauVaoLo`; `xong-lo` nhận đáp án; client đọc `lich`/`dsQidSang`; bỏ đáp án khỏi `#du-nop`; bỏ 3 vòng | phiếu và bảng tin cùng N câu sáng; câu chưa khắc phục ở lô 0 | `btvn-thong-minh:46-71`, `btvn-phan-tang-va-1click:132-148`, `tro-ly-ca-nhan.test:63-88` (ba test khoá "3 vòng" — thầy đã bỏ 19/09) |
| **4 Bảng tin** | `BangTroLyHocSinh`/`BangTroLyPhuHuynh` hiện việc theo cổng, streak, nhãn; `tro-ly` đọc `game_v2_profile` | cổng; streak; nút biến mất khi quá hạn (giữ `ke-hoach-giao-dien`) | không |
| **5 Kênh 4 + 5** | `readScope` từ hồ sơ; task tự sinh; `blocked`; `now` máy chủ; `analyzeParent` đọc kế hoạch; `daily_` bỏ sau ngày; token PH | `than-thu-v2` giữ; 1-click không giao lại câu 3 ngày | `parent-news.test:12-34` (≥12 câu) và **xoá** `71-95` (18/24/36 — trái trần 16 đã chốt) |
| **6 Kênh 1 + 3** | `hoSoOnCa`; song sinh theo dạng; `tranhQid`; seed thi lại; phòng chờ; `diemHopCau` từ hồ sơ; ghi ngược Engine E; bỏ cộng `tien_do_hs`; seed `phan-cong-day-hoc` | mọi test `de-rieng*` giữ (chỉ đổi đầu vào); twin khác nhau giữa 2 em cùng nhóm; ghi ngược | `de-rieng-luc-bat-dau` nếu đổi dsSbd |

Thứ tự này để **GĐ 0–2 không đổi hành vi nào người dùng thấy** (chỉ thêm ghi + lệnh đọc mới), phát hành an toàn; từ GĐ 3 mới đổi giao diện.

---

## 5. VIỆC THẦY CẦN CHỐT (mỗi dòng một câu trả lời)

| # | Câu hỏi | Đề nghị |
|---|---|---|
| 1 | Phút học/ngày mặc định khi PH/em chưa đặt? (`study_preferences` đang DEFAULT 10 → 7 câu ở 90 s, dưới sàn 8) | **20 phút** |
| 2 | Bỏ trống: "chưa làm" (không cộng lần sai, vẫn cần khắc phục) hay "sai"? | **chưa làm** — khớp `dem-ket-qua-test4` và lên bảng |
| 3 | Mốc ôn 1/3/7 tính theo **ngày** (khớp game v2) thay vì buổi (`lich-on-lai.ts`)? | **ngày** |
| 4 | Số câu PH giao hàng ngày = phần dư ngân sách (0–16), bỏ luật "luôn ≥ 12" và "36 câu"? | **phần dư**, xoá 2 test |
| 5 | Xoá ba test khoá "3 Vòng Phân Tầng" (thầy đã bỏ vòng 19/09)? | **xoá** |
| 6 | Thần thú khi còn nợ lô tới mốc: vẫn chơi được, nhiệm vụ đứng sau cổng? | **đúng** (không khoá game) |
| 7 | `daily_` chưa bắt đầu hết ngày thì bỏ, không tính tồn đọng? | **bỏ** |
| 8 | Ngày nghỉ (thầy đặt) không đứt streak? | **không đứt** |
| 9 | PH đặt phút/ngày và xem kế hoạch: cần token PH (hiện ai biết SBD cũng giao bài được)? | **cần token**, làm ở GĐ 5 |
| 10 | Đề riêng: danh sách em = phòng chờ (không ∪ cả lớp)? | **phòng chờ** |
| 11 | `ghiLenBangMoi` ngừng cộng `tien_do_hs`? | **ngừng** |

---

## 6. RỦI RO VÀ ĐIỂM YẾU TỰ NHẬN

- **Bề mặt lỗi rộng**: 3 bảng mới, ~10 điểm ghi. Quên một móc là tiến bộ "mất" âm thầm → GĐ 0 có lệnh kiểm chéo đếm dòng và test đếm dòng từng handler.
- **Độ phủ mã dạng** trên kho thật chưa đo (`cau_hoi` D1 không có cột dạng; chỉ `game_v2_question.dang` có với tờ đã index). Việc đầu tiên của GĐ 1 là đo bằng `thong-ke-dang.ts`; thấp thì hồ sơ dạng rơi về chuyên đề và **nói ra**.
- **Tốc độ** chỉ có từ ca thi tới khi phiếu BTVN/mom gửi giây từng câu (GĐ 3 thêm) → mấy tuần đầu nhiều em chạy 90 s mặc định, bảng tin phải ghi "chưa đo".
- **`so_cau_khac_phuc` thấp vài tuần đầu** (cần 11 ngày/câu) — phải báo trước PH.
- **Cỡ việc đo bằng số câu**, chưa cân theo giây/câu theo mức độ (Phần III ≠ Phần I) — bước sau khi đủ dữ liệu.
- **Mất mạng = không có kế hoạch mới**: máy em giữ bản cuối (localStorage) + "kế hoạch lúc HH:MM".
- Bộ điều phối **không giảm được quá tải thật** nếu thầy giao 60 câu hạn 24 h — nó chỉ nói "cần 60 câu/ngày, vượt trần 16" và đề xuất gia hạn.
- Kênh 1 và 3 cá nhân hoá thêm ít (đúng ràng buộc lớp cùng làm) — thầy có thể thấy "ít thay đổi" ở hai kênh này.
- Chưa hợp nhất 3 engine lên bảng, 3 bảng EXP — cố ý để ngoài phạm vi.
