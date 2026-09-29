# MÔ PHỎNG Sổ nợ + Đan xen (29/09/2026)

Chạy đúng lõi `server/src/srs2-loi.ts` (nhánh `so-no-thuat-toan`). Mã: `docs/so-no-2909/mo-phong.ts`
(`npx esbuild docs/so-no-2909/mo-phong.ts --bundle --platform=node --outfile=<tmp>/mp.cjs && node <tmp>/mp.cjs`).
Mô hình em giữ như `docs/thanh-thao-lan-dau-2809/mo-phong.ts`: lớp trung bình (đúng lần đầu ≈ 60%), 15% câu 2 sao;
nợ cũ = 40 câu em đã sai 1 lần (25% sai 2 lần) ở chiến dịch trước đã đóng; em biết câu nợ kém hơn câu mới.
"Thành thạo" theo đúng luật máy (đúng 2 ngày khác nhau / thành thạo lần đầu). Em làm HẾT kế hoạch mỗi ngày.

## Kết luận nhanh
- Nợ cũ KHÔNG làm tụt chiến dịch mới: thành thạo lúc hạn 79%, bằng lớp không nợ (nợ chỉ chiếm ≤ 50% lượt; Quá tải bù lượt).
- 40 câu nợ cũ: tới hạn (ngày 10) 72% câu nợ đã thành thạo lại, còn TB 2–3 câu nợ/em; 81% em còn ≤ 10% nợ khi thầy giữ 40 lượt/ngày,
  93% em khi dùng "Tự tính" có tính nợ (46 lượt/ngày). Trả SẠCH 100% nợ trong 10 ngày thì hiếm (3–11% em) vì câu sai lại phải đúng
  2 ngày khác nhau — phần còn lại tự dời sang ngày sau (hết chiến dịch ⇒ nợ được 100% lượt).
- "Tự tính" tính cả nợ ⇒ số ngày Quá tải giảm từ 3,7 xuống 1,8 ngày/em.
- Đan xen (em yếu, Đảo): lượt tệ nhất từ 19% lên 37% đúng, câu mở lượt 37% → 52%, câu kết lượt 43% → 50%; không còn cặp khó/nợ liền nhau.
- Đoàn của em yếu toàn câu nợ, phần lớn khó (13 nợ, 9 khó, không có câu dễ để đệm) ⇒ luật "≤ 1 khó/lượt" tách thành 9 chặng 1–2 câu.
  Đúng yêu cầu ("trải nhiều lượt, không dồn") nhưng chặng rất ngắn — cần Boss/thầy quyết có nới cho Đoàn khi không còn câu dễ hay không.

## Số liệu (30 em × 3 lần chạy)

| Kịch bản | Lượt/ngày | Ngày nợ còn ≤ 10% (trung vị) | Ngày trả hết nợ (trung vị) | Em hết nợ trước hạn | Nợ còn lúc hạn (TB/em) | Thành thạo chiến dịch lúc hạn | Nợ cũ thành thạo lúc hạn | Ngày Quá tải (TB) |
|---|---|---|---|---|---|---|---|---|
| Không nợ cũ (đối chứng) | 40 | — | — | — | 0.0 | 79% | — | 0.6 |
| Nợ cũ 40, thầy giữ 40 lượt/ngày | 40 | ngày 10 (81% em) | ngày 10 | 3% | 2.9 | 79% | 72% | 3.7 |
| Nợ cũ 40, "Tự tính" có tính nợ | 46 | ngày 10 (93% em) | ngày 10 | 11% | 2.3 | 79% | 72% | 1.8 |

## Đan xen — em yếu (nhóm 10% thấp nhất lớp), ngày 1, Bát Linh Đảo (nợ Đúng–sai + câu mới): 27 câu (7 nợ, 6 khó)

Tỉ lệ đúng là KỲ VỌNG theo mức biết của em trong mô hình (không mô hình hoá "nản"; chỉ đo phân bố câu khó/dễ theo lượt).

**Trước (nợ dồn đầu, lượt 6 câu theo thứ tự)**

| Lượt | Số câu | Câu nợ | Câu khó | Cặp khó liền nhau | Cặp nợ liền nhau | Đúng câu đầu | Đúng câu cuối | Đúng cả lượt |
|---|---|---|---|---|---|---|---|---|
| 1 | 6 | 6 | 5 | 3 | 5 | 8% | 8% | 19% |
| 2 | 6 | 1 | 1 | 0 | 0 | 11% | 55% | 43% |
| 3 | 6 | 0 | 0 | 0 | 0 | 55% | 44% | 47% |
| 4 | 6 | 0 | 0 | 0 | 0 | 55% | 55% | 55% |
| 5 | 3 | 0 | 0 | 0 | 0 | 55% | 55% | 51% |

**Sau (đan xen theo sức em)**

| Lượt | Số câu | Câu nợ | Câu khó | Cặp khó liền nhau | Cặp nợ liền nhau | Đúng câu đầu | Đúng câu cuối | Đúng cả lượt |
|---|---|---|---|---|---|---|---|---|
| 1 | 5 | 2 | 1 | 0 | 0 | 55% | 55% | 37% |
| 2 | 5 | 1 | 1 | 0 | 0 | 40% | 40% | 43% |
| 3 | 5 | 1 | 1 | 0 | 0 | 55% | 44% | 42% |
| 4 | 4 | 1 | 1 | 0 | 0 | 55% | 55% | 47% |
| 5 | 4 | 1 | 1 | 0 | 0 | 55% | 55% | 43% |
| 6 | 4 | 1 | 1 | 0 | 0 | 55% | 55% | 41% |

Tóm tắt: đúng theo lượt 19%–55% → 37%–47%; câu mở lượt 37% → 52%; câu kết lượt 43% → 50%.

## Đan xen — cùng em, Đoàn Hộ Tống (câu ôn Trắc nghiệm / Trả lời ngắn): 13 câu (13 nợ, 9 khó)

**Trước**

| Lượt | Số câu | Câu nợ | Câu khó | Cặp khó liền nhau | Cặp nợ liền nhau | Đúng câu đầu | Đúng câu cuối | Đúng cả lượt |
|---|---|---|---|---|---|---|---|---|
| 1 | 6 | 6 | 3 | 0 | 5 | 40% | 30% | 35% |
| 2 | 6 | 6 | 5 | 3 | 5 | 40% | 27% | 30% |
| 3 | 1 | 1 | 1 | 0 | 0 | 27% | 27% | 27% |

**Sau**

| Lượt | Số câu | Câu nợ | Câu khó | Cặp khó liền nhau | Cặp nợ liền nhau | Đúng câu đầu | Đúng câu cuối | Đúng cả lượt |
|---|---|---|---|---|---|---|---|---|
| 1 | 2 | 2 | 1 | 0 | 1 | 40% | 40% | 40% |
| 2 | 2 | 2 | 1 | 0 | 1 | 40% | 40% | 40% |
| 3 | 2 | 2 | 1 | 0 | 1 | 20% | 30% | 25% |
| 4 | 2 | 2 | 1 | 0 | 1 | 40% | 40% | 40% |
| 5–9 | 1 | 1 | 1 | 0 | 0 | 20–27% | 20–27% | 20–27% |

Tóm tắt: không còn cặp khó liền nhau (trước: 3), nhưng toàn câu nợ nên không có câu dễ để mở/kết lượt; lượt ngắn 1–2 câu.
