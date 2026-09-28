# Xem trước: "Thành thạo lần đầu" (28/09/2026) — CHƯA phát hành, chờ thầy chốt

Nhánh `thanh-thao-lan-dau`. Chưa đẩy lên máy chủ, chưa ghi dữ liệu thật. Số liệu đầy đủ: `ket-qua-mo-phong.txt`.

## Luật đề xuất (cách hiểu, thầy duyệt)
- "2 sao" là câu vận dụng cao đánh dấu **2 sao** trong kho (trường `canChua.sao` của câu, khi lên game gọi là `sao`).
- Câu làm **lần đầu** (từ mọi nguồn: ca đã công bố, game, lên bảng) mà **đúng, không dùng gợi ý, và không phải câu 2 sao** thì **thành thạo ngay**, không phải ôn lại trong chiến dịch. Sau hạn chỉ còn ôn duy trì (cách ít nhất 30 ngày).
- Đúng lần đầu nhưng nhờ gợi ý: giữ như cũ, em cần đúng thêm một ngày khác.
- Câu 2 sao: giữ như cũ, em cần đúng 2 ngày khác nhau.
- Sai lần đầu: giữ như cũ, em cần đúng 2 ngày khác nhau sau đó.
- Câu đã thành thạo (kể cả câu thành thạo ngay) mà làm lại sai thì mất thành thạo, vào vòng ôn từ hôm sau.
- "Lần đầu" tính từ lúc giao chiến dịch (theo luật 28/09 đang chạy, lịch sử trước khi giao không tính).
- Muốn lùi về luật cũ: đổi một dòng `THANH_THAO_LAN_DAU = true` thành `false` trong `server/src/srs2-loi.ts`.

## Trần ngày và Huyết Chiến: công thức KHÔNG đổi
- Trần ngày = thể lực/ngày của chiến dịch (mặc định 40). Trần Huyết Chiến = 2 × thể lực/ngày (40 thì 80, 60 thì 120).
- Huyết Chiến bật khi *số lượt còn cần > 0,9 × số ngày còn lại × trần ngày*. Máy tính lại mỗi ngày theo tình trạng thật của em.
- Điểm khác duy nhất là **số lượt còn cần**. Câu thành thạo ngay không còn tính lượt nào, nên Huyết Chiến bật ít hơn và tắt sớm hơn. Riêng câu **mới (chưa làm)** vẫn cần chọn cách ước số lượt, xem hai phương án bên dưới.

## Mô phỏng: lớp 30 em, 15% câu 2 sao, 5 lần chạy, đi qua đúng lõi thuật toán
Mỗi em được chạy cả ba luật với cùng một hạt ngẫu nhiên, nên may rủi ở lần làm đầu giống nhau giữa các luật. Mô phỏng có tính đoán mò (Phần I 25%, Phần II 1/16, Phần III 0), có gợi ý và có quên dần.

### Bộ A: 120 câu × 10 ngày, trần 40/ngày (đề bài của thầy)
P1 và P2 cho kết quả **trùng nhau** ở bộ này, vì Huyết Chiến chỉ bật ở 1–2 ngày cuối, lúc đó không còn câu mới.

| Chỉ số (trung bình mỗi em) | 40% cũ | 40% mới | 60% cũ | 60% mới | 80% cũ | 80% mới |
|---|---:|---:|---:|---:|---:|---:|
| Câu phải làm mỗi ngày (trung bình) | 50 | 41 | 44 | 32 | 37 | 24 |
| Câu phải làm ở ngày nhiều nhất | 80 | 65 | 76 | 40 | 55 | 40 |
| Tổng lượt làm tới hạn | 503 | 406 | 443 | 324 | 374 | 244 |
| Ngày làm xong câu mới | ngày 7 | ngày 7 | ngày 7 | ngày 4 | ngày 7 | ngày 4 |
| Số em gặp Huyết Chiến | 100% | 82% | 91% | 29% | 38% | 1% |
| Số ngày Huyết Chiến (trung bình mỗi em) | 3,3 | 1,1 | 1,5 | 0,3 | 0,4 | 0 |
| Huyết Chiến bật từ | ngày 8 | ngày 10 | ngày 10 | ngày 10 | ngày 10 | ngày 10 |
| % thành thạo lúc hạn | 58% | 76% | 70% | 88% | 86% | 96% |
| Số em đạt 100% trước hạn | 0% | 0% | 0% | 1% | 0% | 9% |
| Ngày đạt 90% | chưa đạt | ngày 10 (3% em) | ngày 10 (3% em) | ngày 10 (49% em) | ngày 10 (43% em) | ngày 7 |
| Thành thạo "ảo" (em thật ra biết dưới 50%) | 25% | 45% | 9% | 15% | 1% | 1% |
| Mức biết thật lúc hạn (theo mô hình) | 59% | 54% | 68% | 65% | 81% | 81% |
| Câu cần thầy dạy lại (mỗi em) | 8,7 | 11,0 | 2,7 | 4,4 | 0,5 | 1,0 |

Câu máy phát mỗi ngày, ghi dạng **mới + ôn**, từ ngày 1 đến ngày 10. Ôn duy trì bằng 0 vì mô phỏng chưa có câu cũ.
- 40% cũ: 40+0 · 20+20 · 21+19 · 10+30 · 10+30 · 10+31 · 9+48 · 0+48 · 0+78 · 0+80
- 40% mới: 40+0 · 20+20 · 21+19 · 21+19 · 8+30 · 6+30 · 4+28 · 0+29 · 0+45 · 0+65
- 60% cũ: 40+0 · 28+12 · 27+13 · 7+33 · 6+34 · 6+34 · 6+34 · 0+32 · 0+55 · 0+76
- 60% mới: 40+0 · 28+12 · 27+13 · 21+15 · 3+24 · 1+21 · 0+22 · 0+18 · 0+39 · 0+40
- 80% cũ: 40+0 · 36+4 · 33+7 · 3+37 · 3+37 · 3+37 · 2+22 · 0+14 · 0+41 · 0+55
- 80% mới: 40+0 · 36+4 · 33+7 · 11+10 · 0+10 · 0+14 · 0+17 · 0+10 · 0+31 · 0+20

Huyết Chiến ở bộ này là cú dồn ôn cuối kỳ. Khi đã bật thì giữ tới hạn, không tắt giữa chừng, ở cả luật cũ lẫn luật mới.

### Bộ B: 170 câu × 8 ngày, thể lực 60 (Huyết Chiến 120), giống chiến dịch thật
P1 và P2 cũng trùng nhau ở bộ này.

| Chỉ số | 40% cũ | 40% mới | 60% cũ | 60% mới | 80% cũ | 80% mới |
|---|---:|---:|---:|---:|---:|---:|
| Câu mỗi ngày (trung bình / nhiều nhất) | 85 / 120 | 68 / 103 | 77 / 118 | 52 / 60 | 64 / 86 | 39 / 60 |
| Số em gặp Huyết Chiến · số ngày | 100% · 3,9 | 95% · 1,8 | 97% · 2,5 | 56% · 0,6 | 43% · 0,7 | 4% · 0 |
| Huyết Chiến bật từ | ngày 5 | ngày 7 | ngày 6 | ngày 8 | ngày 8 | ngày 8 |
| Ngày làm xong câu mới | ngày 5 | ngày 5 | ngày 5 | ngày 4 | ngày 5 | ngày 4 |
| % thành thạo lúc hạn | 57% | 78% | 68% | 88% | 84% | 96% |

### Bộ C: giao quá sức, 260 câu × 8 ngày, thể lực 60 (Huyết Chiến bật ngay ngày đầu)
Đây là bộ duy nhất mà hai cách ước số lượt cho câu mới (P1, P2) cho kết quả khác nhau.

| Chỉ số | 40% cũ | 40% P1 | 40% P2 | 60% cũ | 60% P1 | 60% P2 | 80% cũ | 80% P1 | 80% P2 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Số ngày Huyết Chiến (trung bình mỗi em) | 8,0 | 6,6 | 6,4 | 7,7 | 3,4 | 3,4 | 5,0 | 1,3 | 1,3 |
| Huyết Chiến tắt (trung vị) | không tắt | ngày 3 (64% em) | ngày 2 (75% em) | ngày 5 (19% em) | ngày 2 (99% em) | ngày 2 (99% em) | ngày 3 (91% em) | ngày 2 | ngày 2 |
| Câu mỗi ngày (trung bình) | 119 | 102 | 99 | 113 | 78 | 77 | 94 | 57 | 57 |
| Tổng lượt tới hạn | 956 | 817 | 796 | 906 | 623 | 615 | 750 | 455 | 455 |
| Ngày làm xong câu mới | ngày 5 | ngày 5 | ngày 5 | ngày 3 | ngày 5 | ngày 5 | ngày 3 | ngày 4 | ngày 4 |
| % thành thạo lúc hạn | 65% | 77% | 76% | 76% | 88% | 88% | 85% | 95% | 95% |

Ở mức 60–80%, luật mới làm Huyết Chiến tắt ngay từ ngày 2. Lý do: sau ngày đầu, phần lớn câu đã thành thạo ngay nên số lượt còn cần tụt mạnh. Ở mức 60%, "ngày làm xong câu mới" chậm hơn (ngày 5 so với ngày 3), vì khi Huyết Chiến tắt thì trần ngày về lại 60 câu và câu mới được rải đều ra các ngày.

## Hai phương án ước số lượt cho câu MỚI (thầy chọn, chưa chốt)
- **P1: giữ ước 2 lượt cho mỗi câu mới** (đang cài mặc định). Cách này an toàn. Huyết Chiến có thể bật sớm hơn mức thật sự cần ở 1–2 ngày đầu của chiến dịch giao quá sức. Màn giao chiến dịch (sức chứa xanh/vàng/đỏ) vẫn tính như cũ.
- **P2: ước theo chính em.** Câu mới không phải 2 sao tính 1 + (1 − p) lượt, trong đó p là tỉ lệ đúng lần đầu không gợi ý của em ở câu không 2 sao. Chỉ dùng p khi em đã làm ít nhất 20 câu, chưa đủ thì tính 2. Câu 2 sao vẫn tính 2. Đã có hàm `luotCauMoiTheoTiLe`, **chưa nối vào máy chủ**.
- Kết quả mô phỏng: P2 chỉ khác P1 ở chiến dịch giao quá sức với lớp yếu (Huyết Chiến tắt sớm hơn khoảng 1 ngày, ít hơn 2–3% lượt). Ở các bộ khác, hai phương án trùng nhau. Lý do là máy đã tính lại khối lượng mỗi ngày theo tình trạng thật, nên cái bi quan của P1 chỉ kéo dài 1–2 ngày. **Đề xuất: giữ P1** cho đơn giản. Nếu thầy muốn màn giao chiến dịch báo sức chứa sát hơn thì mới dùng P2 cho màn đó.

## Ví dụ 3 em (Bộ A, kịch bản 60%, luật mới)
- **Em yếu** (đúng lần đầu 42%): thành thạo ngay 44/120 câu (ví dụ c021 Phần I Thông hiểu, c023 Phần II Nhận biết). Vẫn phải ôn 70 câu sai lần đầu (c020, c024…) và 6 câu 2 sao em đã đúng lần đầu (c007, c010…). Lượt làm giảm từ 511 xuống 379. Thành thạo lúc hạn tăng từ 60% lên 73%.
- **Em trung bình** (đúng lần đầu 68%): thành thạo ngay 77/120 câu (c021, c024, c026 Phần III Vận dụng). Vẫn phải ôn 38 câu sai lần đầu và 5 câu 2 sao. Lượt làm giảm từ 429 xuống 289. Thành thạo lúc hạn tăng từ 71% lên 94%.
- **Em khá** (đúng lần đầu 74%): thành thạo ngay 78/120 câu. Vẫn phải ôn 31 câu sai lần đầu và 11 câu 2 sao. Lượt làm giảm từ 418 xuống 277. Thành thạo lúc hạn tăng từ 75% lên 93%.

## Chiến dịch thật đang chạy (chỉ đọc, 28/09)
"Chiến dịch luyện" DH-12-C2-B6: 170 câu, 1 em, thể lực 60, hạn 05/10. Em đã làm 33 câu (19%), theo luật cũ chưa câu nào thành thạo. API của thầy không trả kết quả lần đầu của từng câu, nên chưa tính được con số theo luật mới. Sau khi phát hành, bảng chiến dịch sẽ tự hiện con số này.

## Rủi ro và đề xuất giảm thiểu (chưa làm, chờ thầy)
1. **Em đoán mò đúng ngay lần đầu** (Phần I đoán trúng khoảng 25%) thì câu được tính thành thạo "ảo". Lớp yếu bị nặng nhất: 45% số câu thành thạo là "ảo", so với 25% ở luật cũ. Lớp khá gần như không bị. Cách giảm: chỉ cho thành thạo ngay ở Phần II/III; hoặc ở Phần I chỉ áp cho em hạng Khá/Giỏi của dạng đó; hoặc giữ MỘT lượt kiểm tra chốt vào ngày áp chót cho câu Phần I.
2. Em được luyện ít hơn nên mức biết thật lúc hạn giảm 3–5 điểm ở lớp yếu và trung bình. Số câu cần thầy dạy lại tăng nhẹ, vì câu sai được làm lại dồn hơn.
3. Một câu có ở nhiều tờ với số sao khác nhau: bảng của thầy lấy số sao lớn nhất, còn kế hoạch của em lấy theo tờ của chiến dịch.

Chạy lại mô phỏng: `npx esbuild docs/thanh-thao-lan-dau-2809/mo-phong.ts --bundle --platform=node --outfile=/tmp/mp.cjs && node /tmp/mp.cjs`.
