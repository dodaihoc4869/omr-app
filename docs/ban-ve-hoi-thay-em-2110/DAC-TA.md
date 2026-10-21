# Đặc tả · Thẻ «Em và câu này» trong hộp Hỏi Thầy (21/10/2026)

Bước 2 của quy trình 4 bước (`docs/quy-trinh-4-buoc-1310.md`). Thầy duyệt ảnh xong mới build.

Thầy yêu cầu (21/10): "thiết kế thân thiện hiểu rõ được điểm mạnh điểm yếu, mọi dữ liệu của học sinh khi bấm vào mục hỏi thầy để hỗ trợ tốt nhất làm cho học sinh được thấu hiểu nhất".

- Bản vẽ: `hoi-thay-em.html?t=tai|moi|gap|mo|loi|dl|da-hoi`
- Ảnh: `anh/` (18 ảnh)
- Lệnh chụp + soát: `node scripts/chup-ban-ve-hoi-thay-em-2110.mjs`

## 1. Mục tiêu sư phạm, ai dùng
- **Ai dùng:** HỌC SINH, ngay lúc bấm Hỏi thầy ở một câu. Phụ huynh và thầy không dùng thẻ này.
- **Cảm giác cần đạt:** "Thầy biết em đã làm câu này thế nào, biết phần nào em vững, phần nào em đang luyện, nên giảng đúng chỗ em cần."
  - Dòng mở đầu của thẻ nói thẳng điều đó: *"Thầy xem những điều này trước khi trả lời, để giảng đúng chỗ em cần."*
  - Mô hình AI vốn đã đọc đúng các dữ liệu này (`noiDungHoSoHoiThay`); thẻ chỉ cho em THẤY cùng những gì Thầy đang thấy.
- **Thứ tự kể:** câu này → phần đã vững (điểm mạnh, kể trước) → phần đang luyện thêm → chỗ chưa đủ lượt để biết → nút hỏi nhanh. Thẻ nói bằng bằng chứng, không nói bằng nhãn năng lực.
- **Hỏi nhanh:** tối đa 2 nút, gắn với kiến thức CỦA CÂU NÀY mà em đang luyện thêm hoặc chưa đủ lượt. Chạm là gửi đúng câu đó cho Thầy, rồi thẻ gập lại. Không cần gõ.

## 2. Bố cục (thứ tự từ trên xuống)
Đầu hộp «Hỏi Thầy · Câu 33 · chương» → ngăn **Đề câu** → **ngăn mới «Em và câu này»** → hội thoại → ô nhắn (giữ nguyên như app).

**Dòng gập** cao 48 px, cùng kiểu với ô "Đề câu" (nền, bo góc, mũi tên). Trên dòng: biểu tượng người, chữ "Em và câu này", một nhãn tóm tắt (ví dụ "Tự làm đúng **1/3** lần").

**Thân thẻ khi mở:**
- **Khối "Câu này":**
  - con số lớn `1/3` (điểm nhấn duy nhất của thẻ) kèm nhãn "lần em tự làm đúng câu này";
  - dòng "Lần gần nhất: **Sai** · 14:05 · Thứ Tư 21/10/2026";
  - dải chấm các lần làm, từ cũ tới mới, mỗi chấm có ngày. ✓ là Đúng, ✗ là Sai. Vòng nét đứt là lần có trợ giúp, kèm dòng giải nghĩa.
- **Hai nhóm kiến thức:**
  - **«Phần em đã vững»** (xanh lá, dấu ✓) và **«Phần em đang luyện thêm»** (hổ phách, mũi tên lên).
  - Mỗi mục ghi tên kiến thức, rồi "Có trong câu này · tự làm 7 lần trong 5 ngày". Kiến thức cùng dạng mà không có trong câu này mang thẻ "Cùng dạng".
  - Không dùng màu đỏ cho trạng thái học. Đỏ chỉ dùng cho chấm "Sai" và luôn kèm chữ.
- Dòng **"Chưa đủ lượt để biết: … (em mới tự làm 1 lần)"**.
- **Hỏi nhanh:** "Chạm để hỏi Thầy ngay" với các nút viền 48 px. Không tô màu, vì nút chính của hộp vẫn là Gửi.
- Chân thẻ: "Phần kiến thức tính tới 00:00 · Thứ Tư 21/10/2026. Không tính điểm."

**Luật chung:**
- Mặc định gập.
- "Đề câu" và "Em và câu này" là hai ngăn loại trừ nhau: mở ngăn này thì ngăn kia gập.
- Thầy trả lời câu đầu thì cả hai ngăn tự gập, giống ngăn Đề hiện nay.
- Thân thẻ cao tối đa 42dvh, tự cuộn (`overscroll-behavior: contain`).

**Theo khổ màn:**
| Khổ | Bố cục |
|---|---|
| Điện thoại dọc (360, 390) | Một cột, hộp sát đáy như hiện nay. Thẻ gập chỉ thêm 56 px. |
| Điện thoại ngang (844 × 390) | **HAI CỘT** (đề xuất mới). Trái: Đề câu + thẻ, tự cuộn. Phải: hội thoại + ô nhắn. Lý do: hộp chỉ cao khoảng 340 px. Bản đang chạy MỘT cột đã cắt nút Gửi ở khổ này (đo 21/10: đáy nút 375 px > đáy hộp 367 px). Mã: bọc Đề + thẻ (+ dòng `lg-hh-goi`, nút lời giải) trong `.lg-hh-trai`; một cột thì `display: contents`; chỉ bật trong `@media (max-height: 500px) and (min-width: 640px)`. |
| Máy tính 1440 | Hộp 560 px giữa màn như cũ. Màn rộng ≥ 600 px thì hai nhóm kiến thức nằm hai cột. |

## 3. Trạng thái
| Trạng thái | Hiện gì | Ảnh |
|---|---|---|
| Đang tải | Dòng 48 px có chữ "Em và câu này" + vạch chờ. Giữ đúng chiều cao để ô nhắn không nhảy. Dữ liệu về CÙNG lượt với đề câu. | 06 |
| Lần đầu (chưa có lần làm, chưa có kiến thức đủ lượt) | Không mở được. Ghi một dòng: "Đây là lần đầu em làm câu này. Em cứ hỏi, Thầy giảng từ đầu." Ô nhắn dùng bình thường. | 07, 18 |
| Có dữ liệu · gập | Dòng tóm tắt. | 01, 02, 12, 13, 16 |
| Có dữ liệu · mở | Đủ khối như mục 2. | 03, 04, 05, 11, 14, 15 |
| Em ĐANG LÀM câu (chưa nộp) | Chỉ ghi "Đã làm 4 lần"; KHÔNG hiện Đúng/Sai từng lần (sợ em đoán lại phương án). Ghi thêm "Kết quả từng lần hiện lại sau khi em trả lời câu này." Nút hỏi nhanh đổi thành "Gợi hướng: …". | 09 |
| Sau khi chạm hỏi nhanh | Câu hỏi hiện như em tự gõ. Thẻ + đề gập. Thầy trả lời bên dưới. | 10, 17 |
| Lỗi / mất mạng / máy chủ cũ không có trường | ẨN thẻ hoàn toàn. Hộp và ô nhắn chạy như cũ. Không hiện báo lỗi riêng cho thẻ (không doạ, không thêm việc cho em). | 08 |
| Có lần làm nhưng không có kiến thức (em chưa bật OMNI) | Chỉ khối "Câu này" + hỏi nhanh chung ("Giải thích lại câu này"). | — |
| Ca kiểm tra đang mở / câu chưa công bố | Hộp đã khoá như hiện nay; máy chủ KHÔNG gửi trường. | — |

## 4. Dữ liệu

**Nguồn có sẵn:** `docHoSoHoiThay(env, sbd, qid, nowMs)` trong `server/src/hoi-thay-ca-nhan.ts`. Hàm chạy 3 lệnh D1 song song:
- `kyNang` ≤ 8 (từ `omni_q.vkn_json` + `omni_p_vkn`);
- `lanLam` ≤ 8 (từ `su_kien_hoc`, đã bỏ dòng xem lời giải / lượt / chưa công bố);
- `cungDang` (≤ 3 + 3).

Hiện các trường này chỉ đi vào lời nhắc cho AI.

**Cần thêm ở máy chủ:**
- **Gọi hàm sớm.** Trong `hsHoiThay` (`server/src/loi-giai.ts`), khởi động `docHoSoHoiThay(env, sbd, qid, nay)` NGAY trong `Promise.all` thứ nhất, dòng ~595, cùng `coCaDangMo` / `cauDangBaoVe`.
  - `qid` là `qidGoc(...)`, trùng với `qid` mà `hoi-tro-ly.ts:569/594` đang dùng.
  - Lỗi thì `.catch(() => null)`.
- **Gắn trường ở đúng chỗ.** Chỉ gắn `emVaCau` vào HAI nhánh `ok: true`: nhánh `chiHoi` và nhánh có lời giải.
  - KHÔNG gắn khi `dang_kiem_tra`, `ca_chua_cong_bo` (kể cả lần kiểm bản chép thứ hai), "không tìm thấy", thiếu `qid`.
- **Kiểu trả về** (hàm thuần, ví dụ `tomTatEmVaCau(hoSo, { dangLam })` trong `hoi-thay-ca-nhan.ts`):
  ```ts
  emVaCau?: {
    cauNay: { tuLam: number; tuLamDung: number; coTroGiup: number;      // tuLam = số lần KHÔNG trợ giúp
              lan: { ketQua?: 0 | 1; troGiup: boolean; luc: string }[] } // cũ → mới, ≤ 8; dangLam ⇒ bỏ ketQua và troGiup, chỉ còn số lần
    kienThuc: { ten: string; muc: 'vung' | 'luyen_them' | 'chua_du'; tuLam: number; ngay: number; trongCau: boolean }[] // ≤ 8 + 6
    hoiNhanh: string[]   // ≤ 2 tên kiến thức TRONG câu, muc ≠ 'vung', luyen_them trước
    mocKienThuc?: string // cap_nhat_luc của ảnh chụp (00:00 VN)
  }
  ```
- **Mức (`muc`) lấy theo luật ĐÃ CÓ, không đặt ngưỡng mới.**
  - Đọc thêm cột `omni_p_vkn.trang_thai` (SPRT của `omni-kieu.ts`: `vung | chua_vung | chua_du`) trong CÙNG câu lệnh.
  - Ánh xạ: `vung` → đã vững; `chua_vung` → đang luyện thêm; `chua_du`, `p` null hoặc ảnh chụp cũ hơn 14 ngày → chưa đủ lượt.
  - Nhánh `cungDang` đổi điều kiện từ `p<0.6` / `p≥0.8` sang `trang_thai`. Giữ `n_tu_lam ≥ 2` và hai LIMIT 3.
  - Một chữ "vững" ở mọi nơi.
- **Không gửi xuống máy em:**
  - `p` thô;
  - mã vi kỹ năng, mã dạng, `qid`;
  - phương án em đã chọn, đáp án.
- **Tên kiến thức:** máy chủ đã gỡ thẻ HTML và cắt 100 ký tự. Máy em vẽ qua `ChemText` (HNO₂ hạ chỉ số).
- **Vì sao chỉ "đúng a/b" ở mức CÂU:**
  - `su_kien_hoc` có kết quả từng lần nên đếm được đúng/sai thật.
  - `omni_p_vkn` không có cột số lần đúng, nên mức KIẾN THỨC chỉ ghi "tự làm N lần trong M ngày" + nhóm.
  - Không bịa tỉ lệ.
- **Chữ** theo `docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md`:
  - Không "điểm yếu / kém / nắm chắc / kỹ năng / vi kỹ năng".
  - Số nào cũng có nhãn. Giờ 24h, dạng "14:05 · Thứ Tư 21/10/2026".
  - Màn em dùng "kiến thức", không dùng "vi kỹ năng" (A2: chữ đó chỉ dùng ở app thầy).

## 5. Ngoại lệ
- **Bấm lặp hỏi nhanh:** nút khoá trong lúc đang gửi, theo `guiRef` / `dangGui` có sẵn của `HoiThemThay`.
- **Hết lượt hỏi trong ngày / hết lượt hỏi câu này:** nút hỏi nhanh tắt cùng ô nhắn, theo `dung`.
- **Mất mạng giữa chừng:** thẻ đã vẽ thì giữ nguyên. Gửi hỏi nhanh lỗi thì báo như ô nhắn hiện nay; câu hỏi không mất.
- **Tên kiến thức dài (70 ký tự) / công thức:** tự xuống dòng (`overflow-wrap: anywhere`), không cắt. Ảnh có mục "So sánh lực base của amine, ammonia và aniline trong dung dịch nước".
- **Số đột biến:** tối đa 8 chấm (máy chủ đã LIMIT 8). `tuLam` lớn vẫn ghi đủ ("tự làm 23 lần"). Dải chấm tự xuống hàng.
- **Ảnh chụp kiến thức cũ** (em không vào việc đêm OMNI): coi là "chưa đủ lượt". Mốc 00:00 luôn ghi ở chân thẻ.
- **Đổi câu khi hộp đang mở / đổi tab:**
  - Thẻ gắn `key` theo `qid` giống `HoiThemThay`, nên không lẫn câu.
  - Không cần tải lại khi quay tab, vì dữ liệu đi cùng lượt mở hộp.
- **Máy yếu:**
  - Thẻ không có ảnh, không thư viện mới.
  - Chuyển động duy nhất là xoay mũi tên (160 ms), tắt khi giảm chuyển động.
- **Hết giờ:** không áp dụng. Hộp Hỏi thầy không chạy trong ca kiểm tra (đã khoá ở máy chủ).

## 6. Chi phí máy chủ
- **Mỗi lần mở hộp:** thêm **3 lệnh đọc D1, 0 lệnh ghi, 0 đợt chờ nối tiếp.** Cả 3 lệnh chạy chung đợt 1 của `hsHoiThay`, có LIMIT, đọc theo khoá `(sbd, vkn_id)` / `(sbd, qid)`.
- **Lần gửi câu hỏi:** không đổi. `hoi-tro-ly` vẫn tự đọc. Gộp với lần mở hộp là việc tối ưu sau, không thuộc đợt này.
- **Phản hồi:** dài thêm khoảng ≤ 1,5 KB JSON.
- **Đáp án:** không có. Lúc em đang làm, máy chủ bỏ hẳn Đúng/Sai từng lần (cắt ở máy chủ, không trông vào máy em ẩn đi).
- **Mã máy em:** thẻ nằm trong mảnh nạp lười của hộp Hỏi thầy (`hop-hoi-thay.css` + `HopHoiThay`). Byte tải mở app (`taiApp`) KHÔNG tăng.

## 7. Nghiệm thu đo bằng máy

**Test vitest mới:**
- `tests/hoi-thay-em-va-cau-2110.test.ts` (máy chủ):
  - trường `emVaCau` có ở hai nhánh `ok`, vắng ở `dang_kiem_tra` / `ca_chua_cong_bo` / không tìm thấy;
  - không có khoá `p`, `qid`, mã vkn, đáp án;
  - `dangLam` thì `lan[]` không có `ketQua`;
  - `muc` theo `trang_thai`;
  - `tuLam` bỏ lần trợ giúp.
- `tests/the-em-va-cau-2110.test.tsx` (giao diện):
  - mặc định gập;
  - đủ các trạng thái tải, lần đầu, có dữ liệu, đang làm, vắng trường (không vẽ thẻ);
  - mở thẻ thì đề gập;
  - chạm hỏi nhanh gọi `hoiThemThay` đúng một lần với đúng câu, rồi thẻ gập;
  - chữ không chứa "điểm yếu", "kém", "nắm chắc", "kỹ năng", số thập phân dạng `0,xx`.

**Mốc tốc độ (chỉ hạ, không nâng):**
- `tests/toc-do-mo-hoi-thay-1310.test.ts`: mốc `coHoSo [5, 2]`, `chiHoi [4, 2]` giữ nguyên.
- `/hs/hoi-thay` KHÔNG thuộc 4 lệnh nóng của `docs/moc-toc-do.json`. Vẫn chạy `npm run build && npm run kiem:toc-do` 0 đỏ (`taiApp.hoc-sinh` ≤ 290075 byte).

**Cổng khác:**
- `npm run kiem:mau-giu` 0 vi phạm, `npm run check:mau` sạch: chỉ dùng biến có sẵn `--m3-*`, `--m3-canh-bao-nen/-chu`, không hex mới.
- Ảnh Chromium (`scripts/chup-ban-ve-hoi-thay-em-2110.mjs` trên bản vẽ; khi build thì chụp lại trên app thật):
  - 0 lỗi trang, 0 tràn ngang;
  - 0 đích chạm < 44 px (khối mới < 48 px);
  - **ô nhắn + nút Gửi thấy trọn** ở mọi ảnh không chụp toàn bộ.
  - Kết quả bản vẽ 21/10: **18 ảnh, 0 vấn đề.**

## Ba điều cần thầy chốt
1. **Tên gọi.**
   - Đề xuất: «Em và câu này» · «Phần em đã vững» · «Phần em đang luyện thêm» · "Chưa đủ lượt để biết".
   - Không dùng «Phần em cần ôn», vì "ôn lại" / "ôn bài cũ" đã là tên hai việc khác của app.
   - Mức "vững" lấy đúng luật SPRT đang dùng cho "Dạng vững".
2. **Lúc em đang làm câu (chưa nộp).** Đề xuất: vẫn hiện thẻ, nhưng chỉ ghi "Đã làm 4 lần", giấu Đúng/Sai từng lần. Tên kiến thức vẫn hiện (ngang mức Thầy gợi hướng). Hoặc thầy chọn: ẩn hẳn thẻ khi đang làm.
3. **Gập hay mở sẵn.**
   - Đề xuất: luôn gập (dòng tóm tắt đã nói "Tự làm đúng 1/3 lần"), ô nhắn không bị đẩy xuống.
   - Phương án khác: tự mở ở lần đầu em mở hộp trong ngày nếu có phần "đang luyện thêm".
   - Kèm theo: điện thoại ngang chuyển sang hai cột (sửa luôn lỗi cắt nút Gửi đang có).
