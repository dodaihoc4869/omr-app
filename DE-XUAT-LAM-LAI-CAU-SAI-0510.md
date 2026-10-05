# Làm lại câu sai bằng BẢN KHÁC — không học thuộc đáp án (đề xuất 05/10)

Thầy (05/10): *"thay vì lặp lại câu sai bạn hãy tìm cách để học sinh vẫn hoàn thành được câu sai đó nhưng không học thuộc đáp án được."*

## 1. Hiện trạng (tra mã 05/10)

| Đã có (Vòng học v2, 02/10) | Ở đâu |
|---|---|
| **Câu song sinh**: mỗi câu tối đa **2** bản "cùng cách giải, đổi số" do máy soạn + kiểm (`song_sinh` trong hồ sơ lời giải), lưu `cau_bo_tro` theo băm nội dung | `server/src/cau-bo-tro.ts` (`locBoTro` cắt `slice(0, 2)`), `song-sinh-game.ts` (`apSongSinh`: chỉ Phần I và III, **Phần II không**) |
| Câu sai tới lượt làm lại ở **Đảo** ⇒ phủ song sinh (qid ảo `<gốc>~ss0|1`), xen kẽ 2 bản | `hang-chua-loi.ts` (`chonSongSinh`, `phuNeuCan`), `srs2-d1.ts` (`docHoSo2` → `songSinhCho`), `srs2-game.ts` (`napLuot`) |
| Luật đóng lỗi: 2 lượt tự làm đúng ở 2 ngày khác nhau sau lần sai cuối, **ít nhất một lượt là song sinh nếu câu có**, lượt cuối cách lần sai cuối ≥ 3 ngày; đọc lời giải ⇒ 12 giờ sau không tính độc lập; duy trì 14/30 ngày | `loi-hoc-luat.ts` (`phatLaiLoi`, `LanLamLoi.songSinh`, `nenSongSinh`) |
| Lần làm song sinh được đọc quy về câu gốc | `srs2-d1.ts` `docLanLam` (đọc kèm `q~ss0`, `q~ss1`) |

**Hổng:**
1. Câu **không có song sinh** (chưa soạn tới, hoặc câu lý thuyết không "đổi số" được) ⇒ làm lại **nguyên văn**. Độ phủ song sinh trên kho thật chưa đo được từ đây (cần token Cloudflare của thầy; `scripts/kiem-bang-kho-0210.mjs` là mẫu đọc chỉ-đọc).
2. **Phần II (Đúng–sai)** không bao giờ có bản khác.
3. **Đoàn Hộ Tống** rút câu không qua `napLuot` ⇒ không phủ song sinh: câu sai quay lại nguyên văn.
4. **Tu luyện · Sửa câu sai** lấy đúng câu sai, cho lặp (lệnh thầy 30/09: "lấy lại trùng cũng được") — giữ nguyên trừ khi thầy đổi.

Mẫu quét kho (`docs/loi-giai-a/ket-qua-quet.json`, 799 câu, 29/09): 435 câu duy nhất, 352 bản trùng ở nhiều đề; 218 dạng bài; **210/435 câu (48 %)** nằm trong dạng có ≥ 3 câu ⇒ "câu anh em cùng dạng" có cho khoảng một nửa; nửa còn lại cần song sinh hoặc biến thể.

## 2. Cách làm: thang 4 bậc khi câu sai tới lượt làm lại (Đảo + Đoàn)

Lượt làm lại của câu sai Q lấy bậc đầu tiên có sẵn:

| Bậc | Lấy gì | Chấm & tính cho Q |
|---|---|---|
| **1. Song sinh** (sẵn có) | Bản đổi số của Q; nâng trần 2 → **4** bản (đề xuất 2.7 đã chốt) | như nay |
| **2. Câu anh em** (MỚI) | Câu khác trong kho: cùng `dang`, cùng mức độ (`mucDo`), **khác nhóm nội dung** (`content_group`), em **chưa gặp**, không thuộc ca đang bảo vệ / bài tập chưa nộp, trong phạm vi em (bộ chọn "câu lạ cùng dạng" sẵn có của OMNI: `omni-game.ts` `metaTheoDang` · `hopLeChung` · `xepUngVien` · `napTheoThuTu`). Áp cả Phần II. Hết câu chưa gặp ⇒ câu cùng dạng gặp lâu nhất (> 14 ngày) | Ghi sổ dưới **qid của câu anh em** (sự thật), `raw_json.tc = <qid Q>` ("thay cho"). Phát lại lỗi của Q đọc thêm các dòng `tc = Q` và coi là lượt **song sinh** (`songSinh: true`) ⇒ Q "hoàn thành" đúng luật đóng lỗi. Câu anh em cũng tính lịch sử của chính nó |
| **3. Bản xáo + câu kiểm** (MỚI, khi không có 1–2) | Phần I: xáo thứ tự 4 phương án (đáp án theo, tất định theo em + lần); Phần II: xáo thứ tự 4 ý (mẫu Đ/S theo); Phần III: giữ đề nhưng nếu câu có `cau_kiem` thì em trả lời câu kiểm từng bước TRƯỚC khi nhập đáp số | như câu gốc; lượt mang cờ `raw_json.xt = 1`. Nói thật: bậc này KHÔNG chặn được em nhớ NỘI DUNG đáp án — chỉ chặn nhớ chữ cái / mẫu Đ-S; luật 12 giờ + cách ≥ 3 ngày vẫn áp |
| **4. Nguyên văn** | Khi không có gì khác | như nay; đếm số lượt "lặp nguyên văn" để thầy thấy cần soạn thêm song sinh ở đâu |

Quy tắc chung:
- Trong **cửa sổ lỗi** của Q (từ lần sai cuối tới khi đóng) không bao giờ ra Q nguyên văn nếu còn bậc 1–3.
- Đáp án không xuống máy em trước khi nộp (`publicQuestion` như cũ). Câu anh em mang vai "ÔN LẠI" sẵn có ⇒ **giao diện học sinh không đổi** (thầy 05/10).
- Công tắc an toàn `cau_hinh` khoá `lam_lai_khac` (mặc định BẬT): tắt ⇒ về đúng đường hôm nay.
- Hàng soạn của máy soạn lời giải (`scripts/loi-giai/may-soan.mjs`) ưu tiên **câu em đã sai mà chưa có song sinh** (máy chủ cho danh sách) — lấp hổng 1 theo đúng chỗ em cần.

## 3. Định nghĩa hoàn thành (đo bằng lệnh)

1. Em sai Q (có song sinh) ⇒ lượt làm lại ở Đảo là song sinh (test sẵn có giữ xanh); 4 bản ⇒ xoay đủ 4.
2. Q không có song sinh, dạng có câu chưa gặp ⇒ lượt làm lại ở **Đảo và Đoàn** là câu anh em (cùng `dang`, cùng `mucDo`, khác `content_group`, chưa gặp); phản hồi không chứa đáp án; Q nguyên văn không xuất hiện trong cửa sổ lỗi.
3. Em làm đúng câu anh em độc lập (ngày khác, cách lần sai cuối ≥ 3 ngày) ⇒ `phatLaiLoi(Q)` tiến y như lượt song sinh; Q đóng lỗi đúng luật; Bảng chiến dịch / Câu đã làm / Sửa câu sai thấy Q đã sửa.
4. Không có 1–2 ⇒ Phần I/II được xáo, chấm đúng với thứ tự đã xáo (đáp án nghĩa không đổi); Phần III có `cau_kiem` ⇒ câu kiểm đi trước.
5. Tắt khoá `lam_lai_khac` ⇒ y như hôm nay (test).
6. Cổng giao diện: 9 màn học sinh so điểm ảnh trùng bản đang chạy (OMNI tắt) — `scripts/do-app-hs.mjs --kich=anh` + `scripts/do-app-hs/so-anh.mjs`.
7. Báo cáo độ phủ chỉ-đọc: script đếm trên kho (D1 test; kho thật khi thầy cấp token): % câu có song sinh · có anh em · không có gì, theo chương.

## 4. Giả định đã dùng (thầy không nói khác thì làm theo đây)
- Áp cho MỌI em (đây là luật làm lại câu sai của Thuật toán 2.0, không phụ thuộc công tắc OMNI), có khoá tắt riêng.
- "Cùng mức độ" lấy đúng `mucDo` của Q; không có ⇒ nới sang mức kề.
- Tu luyện · Sửa câu sai giữ nguyên lệnh 30/09 (cho lặp) — thầy muốn áp bậc 2 vào đó thì nhắn.
- Không chạm ca thi, không rút câu tự luận, không đổi hợp đồng API (chỉ thêm trường `raw_json.tc`, `xt`).
