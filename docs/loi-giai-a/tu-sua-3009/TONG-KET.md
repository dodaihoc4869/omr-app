# Thẩm định 30/09 — đáp án kho lệch lời giải cũ + Phần III đáp án không phải số

Nguồn: quét toàn kho 30/09 (chỉ đọc). Đã loại 14 câu cố ý đổi đáp án ngày 29/09.
- 305 câu có đáp án kho ≠ "đáp án in trong đề" ghi trong lời giải cũ (`loi_giai.dap_an_de`).
- 40 câu Phần III (không phải tự luận) có đáp án máy chấm không đọc được như một số. 260 câu Phần III chữ khác đã được nhận là tự luận ⇒ không bị chấm như số.
- Gộp theo nội dung (bản gốc + bản chép DB-/DH-): **184 nhóm**, chia 4 lô thẩm định độc lập (`tham-dinh-a..d.md`).

| Quyết định | Nhóm | Ghi chú |
|---|---|---|
| Đổi đáp án kho | 1 (2 câu) | DB-12-B2-D1-I-47, 12-C1-B2-I-75 (xà phòng / chất giặt rửa): B → C — trả về đúng đáp án tác giả in trong đề (C) và đáp án tự giải ban đầu (C); kho đổi thành B ở lần soạn lại 11/09. |
| Sửa đề giữ đáp án | 2 (5 câu, 6 việc) | Pentapeptide Gly-Ala-Val-Ala-Gly: thêm "không kể X" (giữ 4) ×4 bản; DH-11-C1-B2-DT-III-12: sửa "pihòng", "cacium". |
| Giữ nguyên | 141 | Đáp án kho đúng; chỗ sai là "đáp án đề" ghi trong lời giải cũ. |
| **Chờ thầy chốt** | **40** | Xem mục "CHỜ THẦY" trong 4 tệp `tham-dinh-*.md`. Gồm ~22 câu Phần III đáp án là công thức/tên chất/nhiều số (K₂O, FeS₂, AlCl₃, (NH₄)₂Fe(SO₄)₂·6H₂O, "25% N₂; 25% H₂; 50% NH₃"…) — đề xuất chuyển sang tự luận (mã -TL) hoặc viết lại thành câu hỏi một số; ~18 câu Đ/S, trắc nghiệm còn tranh luận (maltose dạng mạch hở, đếm triester, đồ thị enzyme, nitrat hoá cellulose, pin điện hoá…). |

ĐÃ GHI 30/09 ~10:50 (giờ VN): 8 việc / 6 đề, đọc lại khớp, không có ca mở. Kế hoạch: `ke-hoach.json`. Bản gốc từng câu: `../tu-sua-2909/sao-luu/<mã đề>.json`; nhật ký: `../tu-sua-2909/da-tu-sua.md`. 2 câu đổi nội dung đã soạn lại lời giải.
Cổng kiểm gói mới (PR sau) sẽ tự gắn cờ `can_xem` cho các câu Phần III đáp án không đọc được ở lần lưu tờ kế tiếp.

## Chuyển tự luận — ĐÃ GHI 30/09 ~11:20 (thầy cho tự xử lý, qua Boss)
40 câu (20 nhóm nội dung, 18 đề) Phần III có đáp án là công thức / tên chất, máy chấm như số nên luôn chấm sai ⇒ đánh dấu TỰ LUẬN đúng cách kho dùng:
nhãn `kieu: "tu_luan"` (định nghĩa chung `cau-tu-luan.ts` ⇒ rút đề, BTVN, Tu luyện bỏ) + cờ `can_xem` (đường game loại). Câu vẫn trong kho, qid không đổi, đáp án giữ để thầy xem.
Công cụ: `tu-sua-kho.mjs` việc `tuLuan`; kế hoạch `ke-hoach-tu-luan.json`; bản gốc từng câu trong `../tu-sua-2909/sao-luu/`; lùi được bằng `--lui`.

| qid | đáp án kho |
|---|---|
| DH-11-C2-B5-III-30 | (NH₄)₂Fe(SO₄)₂·6H₂O |
| DB-11-B5-D2-III-87 | (NH₄)₂Fe(SO₄)₂·6H₂O |
| DH-10-C1-B1-III-22 | K₂O |
| DB-10-B1-D1-III-165 | K₂O |
| DH-10-C1-B1-III-23 | FeS₂ |
| DB-10-B1-D1-III-166 | FeS₂ |
| DH-10-C1-B1-III-31 | K₂O |
| DB-10-B1-D1-III-172 | K₂O |
| DH-10-C1-B1-III-32 | AlCl₃ |
| DB-10-B1-D1-III-173 | AlCl₃ |
| DH-10-C1-B1-III-33 | FeS₂ |
| DB-10-B1-D1-III-174 | FeS₂ |
| DB-10-B5-D1-III-141 | S |
| DH-10-C2-B7-III-22 | S |
| DB-10-B5-D1-III-142 | Sulfur (S) |
| DH-10-C2-B7-III-28 | Sulfur (S) |
| DH-12-C3-B8-III-34 | C₇H₉N |
| DB-12-B8-D1-III-430 | C₇H₉N |
| DH-12-C3-B8-III-35 | (CH₃)₃N |
| DB-12-B8-D1-III-431 | (CH₃)₃N |
| DH-11-C2-B7-III-29 | thấp (khoảng 113 °C) |
| DB-11-B7-D2-III-70 | thấp (khoảng 113 °C) |
| DH-11-C2-B6-III-25 | Fe₃O₄ |
| DB-11-B6-D2-III-80 | Fe₃O₄ |
| DH-11-C2-B6-III-34 | Fe₃O₄ |
| DB-11-B6-D2-III-89 | Fe₃O₄ |
| DH-10-C2-B7-III-21 | N |
| DB-10-B7-D1-III-60 | N |
| DH-10-C2-B7-III-23 | Si |
| DB-10-B7-D1-III-61 | Si |
| DH-10-C2-B7-III-27 | Nitrogen (N) |
| DB-10-B7-D1-III-64 | Nitrogen (N) |
| DH-10-C2-B7-III-29 | Silicon (Si) |
| DB-10-B7-D1-III-65 | Silicon (Si) |
| DH-10-C1-B3-III-47 | AlCl₃ |
| DB-10-B3-D2-III-94 | AlCl₃ |
| DB-12-B9-P2-D1-III-222 | (Ala)₄ |
| DH-12-C3-B9-P2-III-34 | (Ala)₄ |
| DH-12-C3-B9-P2-III-31 | Tyr-Gly-Gly-Phe-Leu |
| DB-12-B9-P2-D2-III-149 | Tyr-Gly-Gly-Phe-Leu |

18 câu còn tranh luận: để nguyên, chờ thầy (mục "CHỜ THẦY" trong `tham-dinh-*.md`).
