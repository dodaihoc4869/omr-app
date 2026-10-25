# Sửa gốc trong kho đề: nhãn mũi tên vỡ (phông TCVN3 xen kẽ) — 19/10

Nguồn: thầy chụp câu quang hợp (Chặng 5, câu 6). Soi chỉ-đọc D1 `game_v2_question` (15 359 câu / 268 tờ): đúng **5 câu**.
Nguyên nhân gốc: nhãn hai hàng xếp chồng quanh mũi tên trong tệp Word gõ bằng phông TCVN3; bộ nhập đọc ô công thức theo CỘT nên xen kẽ từng chữ.

**Đã làm ở app (không ghi kho):** `src/lib/phong-cu.ts` (`suaNhanXenKe`) sửa lúc hiển thị — ChemText, phiếu/tờ chiếu/PDF (`chuHtml`), và chữ đề gửi Gemini (Hỏi Thầy). Giữ làm lưới an toàn.
**Chưa làm (cần mã thầy, quy trình 28/09 `docs/ra-soat-hien-thi-de-2809/ap-dung.py` → `/kho/day`, tờ + chỉ mục, lô ≤ 20 câu, chỉ khi `/ca/danh-sach` rỗng, đọc lại so từng trường):** sửa chữ trong kho. Trường `de` của 5 câu:

| Câu | Trước | Sau |
|---|---|---|
| `DB-12-B6-D3-III-46`, `DH-12-C2-B6-III-51`, `DH-12-C2-B6-DT-III-10` | `H₂O chÊtdiÖp¸lⁿôhc₍sc¸hⁿlgorophyll₎→(C₆H₁₀O₅)ₙ` | `H₂O →(ánh sáng)(chất diệp lục (chlorophyll)) (C₆H₁₀O₅)ₙ` |
| `DH-12-C2-B6-DT-III-8` | `(C₆H₁₀O₅)ₙeⁿzim→C₆H₁₂O₆eⁿzim→C₂H₅OH` | `(C₆H₁₀O₅)ₙ →(enzim) C₆H₁₂O₆ →(enzim) C₂H₅OH` |
| `DH-12-C2-B5-DT-III-6` | `Disaccharide eⁿzyme→ Monosaccharide Heⁿ₌z₈y₀m%e→ Ethanol` | `Disaccharide →(enzyme) Monosaccharide →(enzyme)(H = 80%) Ethanol` |

Giải mã dạng thứ ba: `Heⁿ₌z₈y₀m%e` = hàng trên "enzyme" xen hàng dưới "H=80%".
Đối chiếu bản gốc trước khi ghi (chỉ ghi khi giá trị hiện tại đúng bằng "Trước"). Ghi chú nội bộ `loi_giai.ghi_chu` của 4 câu khác (`DB-12-B5-D1-III-33`, `DH-12-C2-B5-III-45`, `DB-11-B8-D3-III-42`, `DH-11-C2-B8-III-30`) còn trích chuỗi vỡ — chỉ thầy thấy, không cần sửa.

**Phạm vi soi:** chỉ mục D1 (tất cả trường chữ lưu ở đó). KHÔNG soi được lời giải trong gói R2 (khoá Cloudflare của Actions bị R2 từ chối 401/403). Cấp quyền đọc R2 cho khoá thì quét được nốt: `scripts/soi-phong-cu-kho.mjs`.
