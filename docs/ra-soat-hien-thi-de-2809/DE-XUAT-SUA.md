# Rà soát hiển thị kho đề — 28/09/2026

Nguồn: thầy chụp câu **DH-12-C2-B6 · III.16** ("Cho sơ đồ sau: CO₂ ⁽¹⁾→ (C₆H₁₀O₅)ₙ …"): số (1) treo trước mũi tên,
`(C₆H₁₀O₅)` bị hút lên làm chữ nhỏ trên mũi tên, `ₙ` rơi lại một mình, "Gán số thứ tự…" dính liền sau CH₃COOH.

## Phần 1 — bộ hiển thị (sửa mã, mọi câu, mọi nơi)

Tệp `src/lib/chem-format-so-do.ts` (mới), dùng chung cho `ChemText` (màn thi, game Đảo/Đoàn `TheCau`, Câu đã làm…) và
`chuHtml` (phiếu/PDF `html-phieu.ts`, tờ chiếu `html-may-chieu.ts`). Test: `tests/chem-format-so-do.test.ts` (20 mẫu từ câu thật).

| Mẫu | Trước | Nay |
|---|---|---|
| Số hiệu trước mũi tên `CO₂ ⁽¹⁾→`, `CO₂ (1) →` | số lơ lửng, ngoặc sau bị hút làm nhãn | `→` có (1) ở TRÊN thân |
| Chất bắt đầu bằng ngoặc sau mũi tên `→ (C₆H₁₀O₅)ₙ`, `→ [Cu(C₂H₅NH₂)₄](OH)₂`, `→ (CH₃NH₃)₂SO₄` | thành nhãn nhỏ trên mũi tên | là chất, đúng chỉ số |
| Dãy thứ tự `(1) → (3) → (2)`, nồng độ `→ [OH⁻] = 0,1 M` | (3), [OH⁻] lên mũi tên | giữ nguyên |
| Nhãn thứ hai cách dấu cách `→(1) (C₆H₁₀O₅)ₙ` | (C₆H₁₀O₅) thành nhãn dưới | chỉ nhận nhãn dính liền |
| Mũi tên dài PDF `—(O₂, t°, xt)→`, `—t°→`, `--enzyme→` | chữ rời + mũi tên trần | nhãn trên mũi tên |
| Điều kiện trước mũi tên `t°→`, `Pt,t°→`, `NH₄Clto→` | "t°" nằm ngang dòng | nhãn trên mũi tên |
| Sơ đồ/phương trình dính câu chữ (`…→CH₃COOH Gán số…`, `…sau: A → B. Biết…`, `…; (3) …; (4) …`) | dính một dòng | sơ đồ thành khối riêng dòng |
| Ngắt dòng | có thể ngắt giữa mũi tên và chất, giữa `CH₂-` và `COOH` | "mũi tên + chất sau" và công thức có gạch nối bọc `nowrap`; vẫn được ngắt TRƯỚC mũi tên nên sơ đồ dài không tràn khổ |
| Ion, trạng thái (s)(l)(g)(aq), ⇌, t°, xt, điện phân | — | giữ đúng (có test) |

Không làm đỏ test cũ (các test đỏ còn lại là nền có sẵn: `html-phieu › oGiaiHtml` ×2, `cau-da-lam-2109` ×1, `phieu-tuong-phan-trinh-duyet` thiếu trình duyệt).
Ảnh trước/sau (4 câu): `scratchpad/hienthi/truoc.jpg`, `sau.jpg`.

## Phần 2 — rà TỪNG câu kho đề

Đọc chỉ-đọc toàn kho qua `/kho/danh-sach` + `/kho/lay`: **268 tờ · 15 359 câu · 95 828 trường chữ**
(đề, phương án, ý, lời giải chốt/bước/kết quả). Chạy `ra-soat.ts` (luật dưới) trên từng trường.

**Kết quả: 882 trường cần sửa trong 799 câu, 158 tờ** — chi tiết từng mục (qid, mã đề, trường, trước, sau, lý do)
ở `sua-tung-cau.json`; tóm tắt số ở `tom-tat.json`.

| Loại (mã) | Số câu | Số trường | Ví dụ |
|---|---|---|---|
| Sơ đồ/phương trình dính câu chữ → xuống dòng (`tach-dong-so-do`, chỉ trường đề) | 450 | 450 | `…→CH₃COOH Gán số` → hai dòng |
| Liệt kê (1)(2)… / (a)(b)… dính một dòng → mỗi mục một dòng (`liet-ke-dinh`) | 103 | 103 | `Cho các chất: (1) …, (2) …` |
| Số hiệu/điều kiện trước mũi tên → lên mũi tên (`nhan-truoc-mui`) | 83 | 96 | `⁽¹⁾→` → `→(1)`, `t°→` → `→(t°)`, `—(xt)→` |
| Số hiệu phương trình rơi xuống cuối dòng trên (`so-hieu-cuoi-dong`) | 57 | 57 | `… H₂O (2)\n[C₆…` → `… H₂O\n(2) [C₆…` |
| Dấu cách thừa trước . , (`cach-truoc-dau`) | 60 | 68 | `C₄H₈O₂ .` |
| Đơn vị ml → mL (chuẩn SGK) (`don-vi-ml`) | 58 | 58 | `200 ml` |
| Chỉ số n polymer `]n` → `]ₙ` (`n-sau-ngoac`) | 37 | 46 | `[C₆H₇O₂(OH)₃]n` |
| Công thức gõ số thường → chỉ số dưới (`chi-so-ascii`) | 34 | 83 | `(C17H35COO)3C3H5` |
| Số hiệu bọc hai lớp ngoặc `→((1))` (`nhan-ngoac-kep`) | 10 | 10 | |
| Ngoặc trong điều kiện bị đảo (`nhan-ngoac-hong`) | 4 | 4 | `(+[Ag(NH₃)₂)OH][t°]` → `(+[Ag(NH₃)₂]OH)[t°]` |
| Điều kiện gõ chữ mũ `⁺O²,t°,xt→` (`nhan-mu-truoc-mui`) | 2 | 2 | → `→(+O₂, t°, xt)` |
| Mũi tên thuận nghịch lặp quanh điều kiện (`mui-lap`) | 2 | 2 | `⇌ (+OH⁻ / +H⁺) ⇌` → `⇌(+OH⁻)[+H⁺]` |
| Chỉ số tách rời / liên kết có dấu cách | 2 | 2 | `-CH 2 -`, `(C = O)` |

Tất cả là sửa **cách viết/trình bày**; không đổi chất, số liệu, đáp án, thứ tự phương án, nghĩa lời giải.
Không thấy ký tự lạ (ô vuông, vùng dùng riêng, ký tự 0 rộng) và không thấy phương án dính nhau trong kho hiện tại.

## Cần thầy xem (KHÔNG tự sửa — 88 mục, `can-xem.json`)

1. **Điều kiện phản ứng vỡ chữ khi chép PDF (4 câu)** — vd `2SO₂+O₂V²tOo⁵2SO₃` (mất cả mũi tên, không biết → hay ⇌):
   DB-11-B8-D3-I-33, DB-11-B8-D3-III-39, DH-11-C2-B8-I-69, DH-11-C2-B8-III-5 (câu này còn mục "(d)" lẫn giữa (1)(2)(3) — nghi thiếu/sai số hiệu).
2. **Bảng bị dàn thành chữ có dấu `|` (74 câu)** — hiện đọc được nhưng khó; nên nhập lại vào trường `bang` hoặc ảnh. Danh sách trong `can-xem.json`.
3. **Dãy số liệu của bảng bị dàn thành chữ (10 câu)** — vd 12-C5-B15-I-38 "Cặp oxi hoá – khử Cu²⁺/Cu Zn²⁺/Zn … 0,340 –0,763 …".

Không sửa kiểu `0,1M` → `0,1 M` (cách viết quen của đề thi, không phải lỗi).

## Áp dụng

Thầy cho phép tự áp (28/09). Cách áp có sao lưu + lùi: `ap-dung.md`; nhật ký từng lô: `nhat-ky-ap-dung.md`.
