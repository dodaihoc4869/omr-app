# ĐỀ XUẤT — BTVN "NÂNG ĐỠ": giao 80 câu, mỗi em nhận bộ câu vừa sức và tiến lên từng ngày

Người viết: Boss · 21/09/2026 · CHỜ THẦY CHỐT (chưa build gì).
Thầy lệnh: "rút số câu phù hợp cho từng em theo hướng nâng đỡ tiến bộ từng ngày… mọi em làm đủ câu cốt lõi bao quát kiến thức… em yếu không phân câu khó nhưng phải tiến bộ lên được… làm xong thấy mình giỏi lên một chút."

## 0 · HIỆN TRẠNG (đã dò mã, không đoán)
- Giao 80 câu ⇒ MỌI em nhận đủ 80 câu y hệt (`server/src/index.ts:1573`; `btvn_em` không có cột câu riêng). Máy chủ không đọc hồ sơ em khi giao.
- Chia lô theo hạn đã có (`src/lib/lich-lo-btvn.ts`), nhưng phiếu có nút "Mở hết câu" và điểm tính trên CẢ 80 câu (`server/src/goi-cu.ts:864`).
- Dữ liệu dùng được NGAY: hồ sơ từng câu `nam_kt_cau` (sai/đang ôn/đã khắc phục, giây trung bình), hồ sơ từng DẠNG `nam_kt_dang` (số câu gặp, số sai, **bậc 0/1/2 = biết/hiểu/vận dụng**), ngân sách 8–16 câu/ngày theo tốc độ thật của em, sự kiện theo lô (`btvn_lo`), EXP theo câu.
- Dữ liệu CÒN THIẾU ở máy chủ: **mã dạng** và **sao cốt lõi (0/1/2)** của câu chỉ nằm trên máy thầy (AI gán lúc nạp đề). Mức độ chỉ có 3 bậc (biết/hiểu/vận dụng), chưa có vận dụng cao.
- Đã có sẵn ba cỗ máy chọn câu chạy tốt để học theo: game thần thú (2 yếu · 1 tới hạn · 2 lấp · 1 thử thách), ôn lại 1·3·7, đề riêng `boTheoEm {sbd → qid[]}`.

## 1 · Ý TƯỞNG MỘT CÂU
Bài của mỗi em = **LÕI CHUNG** (cả lớp giống nhau, phủ hết các dạng) + **PHẦN RIÊNG** (chọn theo hồ sơ em, đúng "bậc thang" của em) — chia thành **chặng mỗi ngày**, chặng sau được chọn lại theo kết quả chặng trước, mỗi chặng kết thúc bằng một thẻ **"hôm nay em tiến thêm gì"**.

## 2 · THUẬT TOÁN
**Bước A — Phân loại 80 câu (lúc thầy bấm giao).** Máy thầy gửi kèm mỗi câu: dạng, mức độ, sao, phần I/II/III. Câu thiếu mã dạng ⇒ dùng chuyên đề + mức độ thay thế.

**Bước B — Chọn LÕI CHUNG (≈ 25–35 % số câu, tự tính theo số dạng).** Với MỖI dạng có trong 80 câu: lấy 1–2 câu đại diện, ưu tiên sao 2 → mức thấp nhất của dạng → phần I trước. Thầy được **ghim** thêm câu "cả lớp bắt buộc". Lõi bảo đảm: bao quát kiến thức, có mẫu số chung để so lớp, đủ câu chung cho bộ chống chép bài (cần ≥ 6), và là nguồn chọn câu chữa trên bảng.

**Bước C — Bậc thang của từng em ở từng dạng.** Bậc hiện tại lấy từ `nam_kt_dang.bac`; chưa đủ 4 câu đã gặp ⇒ bắt đầu ở Biết. **Bậc đích = bậc hiện tại**; chỉ mở **+1 bậc** khi em đúng ≥ 2 câu liền ở bậc hiện tại của dạng đó (tính cả trong chính bài này). Không bao giờ nhảy 2 bậc. ⇒ Em yếu KHÔNG nhận câu Vận dụng của dạng em còn ở Biết, nhưng có đường lên rõ ràng.

**Bước D — Số câu của em.** `số câu = số ngày tới hạn × (ngân sách ngày của em − phần ôn lại tới hạn)`, kẹp trong [LÕI, 80]. Ví dụ hạn 7 ngày: em chậm/đang nợ nhiều ≈ 40–45 câu; em trung bình ≈ 55–60; em nhanh ≈ 65–80.

**Bước E — Chọn PHẦN RIÊNG (chấm điểm từng câu cho từng em, lấy từ cao xuống).**
- Cộng điểm: thuộc dạng em đang yếu (tỉ lệ khắc phục < 70 %); đúng bậc đích; câu em từng sai mà chưa đúng lại; câu em chưa từng làm.
- Trừ điểm: câu em đã đúng lại ở ≥ 2 ngày khác nhau (làm nữa là phí sức); cao hơn bậc đích ≥ 2.
- Ràng buộc: mỗi dạng yếu của em ≥ 2 câu; tối đa 15–20 % là câu **thử thách** (+1 bậc), chỉ ở dạng em đang ổn; em chưa có hồ sơ ⇒ lõi + Biết/Hiểu, chặng 1 kiêm luôn chẩn đoán.
- Tất định theo hạt giống `mã bài | SBD`: chạy lại ra đúng bộ cũ, test được, thầy xem lại được.

**Bước F — Xếp CHẶNG MỖI NGÀY (thay "lô").** Mỗi chặng theo nhịp: **2 câu khởi động** (em gần như chắc đúng) → **lõi** → **dạng yếu đúng bậc** → **1 câu thử thách cuối chặng** (sai không bị trừ gì). Bỏ nút "Mở hết câu"; thay bằng **"Em muốn làm thêm"** (mở sớm chặng sau, có EXP thưởng).

**Bước G — THÍCH NGHI sau mỗi chặng (máy chủ chấm chặng, không lộ đáp án).** Dạng X đúng ≥ 80 % ở bậc hiện tại ⇒ chặng sau đổi 1 câu sang bậc cao hơn. Sai ≥ 50 % ⇒ chặng sau thêm 1 câu cùng dạng bậc thấp hơn + hẹn câu sai vào lịch ôn 1·3·7. Lõi không bao giờ bị rút.

## 3 · CÁI HỌC SINH THẤY (để hứng thú)
- Đầu bài: "Bài của riêng em: 52 câu · 7 chặng · mỗi ngày ≈ 12 phút" — không hiện bạn khác nhận bao nhiêu.
- Cuối MỖI chặng, một thẻ so em với chính em hôm qua, bằng con số thật: "Dạng Thuỷ phân ester: Biết → **Hiểu** ↑ · Đúng lại 2 câu từng sai · +46 EXP · Thần thú còn 30 EXP lên cấp". Không xếp hạng, không chữ "nắm chắc", không kết luận năng lực từ điểm.
- Sổ tay dạng bài (đã có, 3 sao/dạng) sáng thêm sao ngay sau chặng.

## 4 · CÁI THẦY THẤY
- Lúc giao: công tắc **"Cá nhân hoá (khuyên dùng)"** — tắt thì như cũ, cả lớp đủ 80 câu. Nút **"Xem trước phân bổ"**: bảng từng em — tổng câu · lõi/riêng · số câu Biết/Hiểu/Vận dụng · số chặng; bấm một em xem đúng danh sách câu.
- Theo dõi: tiến độ "chặng 3/7", điểm của em trên **số câu của em**; so sánh cả lớp CHỈ trên phần lõi; dạng lõi sai nhiều ⇒ gợi ý chữa trên bảng.

## 5 · PHẦN PHẢI ĐỔI (kỹ thuật) + RỦI RO
- Máy chủ: bảng mới CHỈ-THÊM `btvn_cau` (câu + dạng/mức/sao/lõi) và `btvn_em_cau` (câu của từng em theo chặng); `btvnCuaEm` trả đúng câu của em; chấm theo câu của em. **Đây là ĐỔI LUẬT CHẤM ĐIỂM BTVN ⇒ cần thầy duyệt rõ.**
- Chống chép bài: chạy trên phần lõi chung (đủ ≥ 6 câu). Phiếu phụ huynh: ghi "x/y câu của em".
- Mã câu BTVN hiện phụ thuộc số thứ tự trong tờ đề ⇒ khoá tờ đề sau khi giao (không sửa thứ tự câu của bài đang chạy).
- Có cờ tắt toàn cục `cau_hinh.btvn_ca_nhan`; bài cũ đang chạy không bị đụng.
- Làm 2 đợt: **Đợt 1** (A–F tĩnh lúc giao + xem trước + điểm theo câu của em) → thầy giao thử một lớp; **Đợt 2** (G thích nghi + thẻ tiến bộ + "Em muốn làm thêm"). Vẽ mẫu 3 màn (xem trước phân bổ · đầu bài của em · thẻ cuối chặng) cho thầy duyệt trước khi build giao diện.

## 6 · BỐN ĐIỀU XIN THẦY CHỐT (kèm khuyến nghị)
1. Điểm BTVN tính trên **số câu của từng em** thay vì trên 80 — khuyên: CÓ.
2. Lõi chung ≈ 30 % (tự tính theo số dạng, thầy ghim thêm được) — khuyên: CÓ.
3. Em khá giỏi được **bỏ câu dễ đã đúng lại nhiều lần** để nhận câu cao hơn — khuyên: CÓ.
4. Bỏ nút "Mở hết câu", thay bằng "Em muốn làm thêm" có thưởng — khuyên: CÓ.
