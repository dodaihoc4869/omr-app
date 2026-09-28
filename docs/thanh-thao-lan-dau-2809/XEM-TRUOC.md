# "Thành thạo lần đầu" — LUẬT THẦY ĐÃ CHỐT (28/09/2026)

Nhánh `thanh-thao-chot` (dựng trên `origin/main`). Chưa đẩy máy chủ, chưa ghi dữ liệu thật. Số liệu đầy đủ: `ket-qua-mo-phong.txt`.

## Luật chốt
- Câu làm **lần đầu** (từ lúc giao chiến dịch; mọi nguồn: ca đã công bố, game, lên bảng) mà **đúng, không gợi ý** thì **thành thạo ngay** — CHỈ với câu **khó đoán mò**:
  - **Phần II đúng cả 4 ý** (sổ chỉ ghi "đúng" khi đủ 4 ý; đoán mò trúng khoảng 1/16),
  - **Phần III** (điền số, gần như không đoán mò được),
  - **Phần I mức Nhận biết**.
- Còn lại giữ luật cũ (**đúng ở 2 ngày khác nhau**): Phần I Thông hiểu/Vận dụng (4 phương án ⇒ đoán mò trúng khoảng 25%), **câu 2 sao** (mọi phần), câu đúng **nhờ gợi ý**, câu **sai lần đầu**.
- Câu đã thành thạo (kể cả thành thạo lần đầu) mà làm lại **sai** ⇒ mất thành thạo, vào vòng ôn từ hôm sau.
- Câu thành thạo lần đầu không được xếp ôn trong chiến dịch; chỉ ôn duy trì sau hạn (cách ít nhất 30 ngày).
- Lùi về luật cũ: đổi một dòng `THANH_THAO_LAN_DAU = true` → `false` trong `server/src/srs2-loi.ts`. Loại câu: hàm `laCauKhoDoanMo`.

## Ước lượt: P1, một hàm cho mọi ô
- Câu **mới** vẫn ước **2 lượt**; câu đang ôn 2 − chuỗi đúng; câu **đã thành thạo (kể cả thành thạo lần đầu) = 0**. Hàm duy nhất: `khoiLuongCan`.
- Dùng ở: bật/tắt Huyết Chiến (`lapKeHoachNgay`); màn Giao chiến dịch — "Khối lượng so với thời gian còn lại", "Tự tính" số lượt câu mỗi ngày, số em quá tải; màn Sửa chiến dịch — tự nâng số câu/ngày = ⌈lượt còn cần lớn nhất / ngày còn lại⌉ (trước đây đếm "câu chưa làm", nay đếm lượt như màn Giao).
- Công thức trần ngày / trần Huyết Chiến (2 × thể lực) / ngưỡng bật (lượt còn cần > 0,9 × ngày còn lại × trần ngày) **không đổi**.
- P2 (ước lượt câu mới theo tỉ lệ đúng lần đầu của em) **đã bỏ khỏi mã** — mô phỏng sáng 28/09 cho thấy chỉ khác P1 ở chiến dịch giao quá sức với lớp yếu (Huyết Chiến tắt sớm hơn ~1 ngày, ít hơn 2–3% lượt).

## Mô phỏng: lớp 30 em, 15% câu 2 sao, 5 lần chạy, đi qua đúng lõi thuật toán
Mỗi em chạy cả ba luật với cùng hạt ngẫu nhiên. Có đoán mò (Phần I 25%, Phần II 1/16, Phần III 0), gợi ý, quên dần. Kho câu mô phỏng: 60% Phần I, 25% Phần II, 15% Phần III; mức độ NB/TH/TH/VD xoay vòng.
**Xem trước** = bản sáng 28/09 (mọi câu không 2 sao được thành thạo lần đầu) — để thầy so.

### Bộ A: 120 câu × 10 ngày, trần 40/ngày
| Chỉ số (trung bình mỗi em) | 40% cũ | 40% xem trước | **40% chốt** | 60% cũ | 60% xem trước | **60% chốt** | 80% cũ | 80% xem trước | **80% chốt** |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Câu phải làm mỗi ngày (TB) | 50 | 41 | **46** | 44 | 32 | **38** | 37 | 24 | **32** |
| Câu ở ngày nhiều nhất | 80 | 65 | **76** | 76 | 40 | **59** | 55 | 40 | **41** |
| Tổng lượt tới hạn | 503 | 406 | **457** | 443 | 324 | **383** | 374 | 244 | **317** |
| Số em gặp Huyết Chiến | 100% | 82% | **91%** | 91% | 29% | **49%** | 38% | 1% | **5%** |
| Số ngày Huyết Chiến | 3,3 | 1,1 | **1,8** | 1,5 | 0,3 | **0,5** | 0,4 | 0 | **0,1** |
| % thành thạo lúc hạn | 58% | 76% | **71%** | 70% | 88% | **81%** | 86% | 96% | **90%** |
| Thành thạo "ảo" (em biết thật < 50%) | 25% | 45% | **34%** | 9% | 15% | **10%** | 1% | 1% | **1%** |
| Mức biết thật lúc hạn | 59% | 54% | **57%** | 68% | 65% | **67%** | 81% | 81% | **81%** |
| Câu cần thầy dạy lại | 8,7 | 11,0 | **10,3** | 2,7 | 4,4 | **3,4** | 0,5 | 1,0 | **0,7** |

Câu phát mỗi ngày (mới + ôn), luật chốt, ngày 1 → 10:
- 40%: 40+0 · 20+20 · 21+19 · 17+23 · 8+32 · 8+32 · 7+36 · 0+38 · 0+61 · 0+76
- 60%: 40+0 · 28+12 · 27+13 · 17+21 · 3+34 · 3+32 · 2+28 · 0+22 · 0+41 · 0+59
- 80%: 40+0 · 36+4 · 33+7 · 10+18 · 0+29 · 0+27 · 0+20 · 0+11 · 0+40 · 0+41

### Bộ B: 170 câu × 8 ngày, thể lực 60 (Huyết Chiến 120), giống chiến dịch thật
| Chỉ số | 40% cũ | **40% chốt** | 60% cũ | **60% chốt** | 80% cũ | **80% chốt** |
|---|---:|---:|---:|---:|---:|---:|
| Câu mỗi ngày (TB / nhiều nhất) | 85 / 120 | **77 / 118** | 77 / 118 | **65 / 101** | 64 / 86 | **53 / 67** |
| Tổng lượt tới hạn | 679 | **616** | 615 | **518** | 516 | **426** |
| Em gặp Huyết Chiến · số ngày | 100% · 3,9 | **97% · 2,8** | 97% · 2,5 | **79% · 1,1** | 43% · 0,7 | **19% · 0,2** |
| % thành thạo lúc hạn | 57% | **72%** | 68% | **81%** | 84% | **89%** |
| Thành thạo "ảo" | 26% | **35%** | 9% | **11%** | 1% | **1%** |

(Xem trước: % thành thạo 78/88/96%, "ảo" 45/17/1%.)

### Bộ C: giao quá sức, 260 câu × 8 ngày, thể lực 60 (Huyết Chiến bật ngay ngày đầu)
| Chỉ số | 40% cũ | **40% chốt** | 60% cũ | **60% chốt** | 80% cũ | **80% chốt** |
|---|---:|---:|---:|---:|---:|---:|
| Số ngày Huyết Chiến | 8,0 | **7,7** | 7,7 | **5,5** | 5,0 | **2,4** |
| Huyết Chiến tắt (trung vị) | không tắt | **ngày 3 (23% em)** | ngày 5 (19% em) | **ngày 3 (93% em)** | ngày 3 (91% em) | **ngày 2** |
| Câu mỗi ngày (TB) | 119 | **113** | 113 | **96** | 94 | **76** |
| Tổng lượt tới hạn | 956 | **901** | 906 | **770** | 750 | **605** |
| % thành thạo lúc hạn | 65% | **68%** | 76% | **78%** | 85% | **89%** |
| Thành thạo "ảo" | 33% | **39%** | 9% | **11%** | 0% | **1%** |

## Đọc nhanh
- Luật chốt nằm giữa luật cũ và bản xem trước: bớt 9–15% lượt (Bộ A), Huyết Chiến bật ít hơn rõ ở lớp trung bình/khá.
- Thành thạo "ảo" của lớp yếu giảm từ 45% (xem trước) xuống 34%; lớp trung bình 10% (gần bằng luật cũ 9%).
- Mức biết thật lúc hạn gần như giữ nguyên so với luật cũ (−0 đến −2 điểm).

## Ví dụ 3 em (Bộ A, 60%, luật chốt)
- **Em yếu** (đúng lần đầu 38%): thành thạo ngay 23/120 câu. Vẫn ôn: 75 câu sai lần đầu, 17 câu Phần I Thông hiểu/Vận dụng đúng lần đầu, 5 câu 2 sao. Lượt 511 → 440; thành thạo lúc hạn 60% → 63%.
- **Em trung bình** (71%): thành thạo ngay 45/120. Vẫn ôn: 35 sai lần đầu, 32 Phần I Thông hiểu/Vận dụng, 8 câu 2 sao. Lượt 429 → 343; thành thạo 71% → 84%.
- **Em khá** (74%): thành thạo ngay 44/120. Lượt 418 → 337; thành thạo 75% → 83%.

## Còn lưu ý
- Một câu có ở nhiều tờ với số sao khác nhau: bảng của thầy lấy số sao lớn nhất, kế hoạch của em lấy theo tờ của chiến dịch.
- Chiến dịch thật đang chạy (DH-12-C2-B6, hạn 05/10) sẽ tự tính lại theo luật chốt khi phát hành (không ghi dữ liệu nào; trạng thái suy từ sổ).

Chạy lại mô phỏng: `npx esbuild docs/thanh-thao-lan-dau-2809/mo-phong.ts --bundle --platform=node --outfile=<tmp>/mp.cjs && node <tmp>/mp.cjs`.
