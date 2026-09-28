# Mã chết — soát 28/09 (nhánh toi-uu-app)

Nguồn: knip (`toi-uu/knip2.txt`, `chi-test.txt`) + grep lại từng tệp trong `src/ public/ server/ scripts/ docs/ tests/` (nhập tĩnh, `import()` động, chuỗi đường dẫn, `<script src>` của .html).

## A. 17 tệp không ai nhập — XOÁ 6, GIỮ 11

| Tệp | Lý do | Quyết định |
|---|---|---|
| `src/App.css` | CSS mẫu Vite, không tệp nào nhập | **XOÁ** |
| `src/components/Banner3OTonVinh.css` | CSS của banner đã gỡ, 0 nơi nhập | **XOÁ** |
| `src/game/than-thu-v2/Spirit3D.tsx` | Thần thú 3D (three) đã thay bằng Spirit2D; 0 nơi nhập (docs/ra-soat-du-thua-2109.md D4: BỎ) | **XOÁ** |
| `src/game/than-thu-v2/spirit-model.ts` | chỉ Spirit3D nhập | **XOÁ** |
| `src/lib/doi-chieu-phong-cho.ts` | đối chiếu phòng chờ cũ; test khong-treo-phong-cho-1109 khoá "không còn ai nhập" | **XOÁ** |
| `src/lib/rong-cot.ts` | kéo bề rộng thanh trái cũ; 0 nơi nhập | **XOÁ** |
| `src/sw.ts` | service worker viết tay — vite-plugin-pwa nạp qua `srcDir/filename` (knip không thấy) | GIỮ |
| `src/components/xem-thu/btvn-da-giao.tsx` | trang xem thử dev, nạp từ `.html` cạnh nó; scripts/soi-btvn-da-giao.mjs, kiem-tran-giao-dien-2309.mjs mở | GIỮ |
| `src/components/xem-thu/phu-kien.tsx` | trang xem thử dev (nạp từ .html) | GIỮ |
| `src/components/xem-thu/the-cuoi-chang.tsx` | trang xem thử dev (SO-VIEC-GIAO-DIEN ghi đường dẫn) | GIỮ |
| `src/game/bi-a/xem-thu.tsx` | trang thử Bi-a (BI-A-build-status.md) | GIỮ |
| `src/game/than-thu-v2/dao/xem-thu.tsx` | trang xem thử Đảo (SO-VIEC-DAO.md) | GIỮ |
| `src/game/than-thu-v2/dao2/xem-thu-chuong.tsx` | trang xem thử (nạp từ .html) | GIỮ |
| `src/game/than-thu-v2/dao2/xem-thu.tsx` | trang xem thử (nạp từ .html) | GIỮ |
| `src/game/than-thu-v2/doan-xem-thu.tsx` | trang xem thử Đoàn (nạp từ .html) | GIỮ |
| `src/game/than-thu-v2/doan2/xem-thu-2.tsx` | trang xem thử Đoàn 2.0 (nạp từ .html) | GIỮ |
| `src/game/than-thu-v2/shop/xem-thu.tsx` | trang xem thử cửa hàng (nạp từ .html) | GIỮ |

## B. 90 tệp chỉ test dùng (+ 44 tệp test khoá chúng) — GIỮ cả, chưa xoá

Phân tích cụm (`scratchpad/app/cum-chet.mjs`): gỡ một tệp thì mọi test nhập nó phải xoá theo; test nào đồng thời khoá mã ĐANG CHẠY thì ghim tệp lại. Kết quả: cụm game cũ chỉ còn 4/23 tệp xoá được sạch, cụm app PH cũ 4/31 — và chính 8 tệp ấy vẫn bị tệp giữ lại nhập (`ve-than-thu` ← `anh-than-thu`, `bieu-tuong`/`c-chung`/`nhip-ngay` ← thẻ ph-moi). Không tệp nào xoá được mà không mất luật đang có giá trị ⇒ GIỮ; không vào gói (không màn nào nạp) nên không ảnh hưởng tốc độ app.

Việc đề xuất (riêng): tách các test trộn — chuyển phần khoá `hinh-thai`/`kinh-nghiem`/`lib/ph-moi/*` sang tệp test mới, bỏ tên tệp cũ khỏi danh sách soát chữ — rồi mới xoá hai cụm (≈ 55 tệp).

| Tệp | Nhóm | Quyết định |
|---|---|---|
| `src/components/BaoCaoCaThiPhuHuynhModal.tsx` | Chỉ test nhập, không màn nào nạp | GIỮ — không rõ là chức năng đã gỡ (luật thuần có thể còn giá trị) |
| `src/components/CauHoiTrongGame.tsx` | Game Thần thú Hoá học cũ / Võ đài (đã thay bằng than-thu-v2) | GIỮ — test trộn: cùng tệp test khoá `hinh-thai.ts`/`kinh-nghiem.ts` (đang dùng ở dao-core, SanhBanDo, hap-thu-ngay) và danh sách soát chữ (chu-thay, nhip-bang, experiment-catalog); xoá phải tách test trước |
| `src/components/DauTruongChanLy.tsx` | Game Thần thú Hoá học cũ / Võ đài (đã thay bằng than-thu-v2) | GIỮ — test trộn: cùng tệp test khoá `hinh-thai.ts`/`kinh-nghiem.ts` (đang dùng ở dao-core, SanhBanDo, hap-thu-ngay) và danh sách soát chữ (chu-thay, nhip-bang, experiment-catalog); xoá phải tách test trước |
| `src/components/KhoiBaPhan.tsx` | Chỉ test nhập, không màn nào nạp | GIỮ — không rõ là chức năng đã gỡ (luật thuần có thể còn giá trị) |
| `src/components/KhoiBtvnLo.tsx` | Chỉ test nhập, không màn nào nạp | GIỮ — không rõ là chức năng đã gỡ (luật thuần có thể còn giá trị) |
| `src/components/KhoiLuyenKhacPhuc.tsx` | Chỉ test nhập, không màn nào nạp | GIỮ — không rõ là chức năng đã gỡ (luật thuần có thể còn giá trị) |
| `src/components/KhungLoiGiaiGame.tsx` | Game Thần thú Hoá học cũ / Võ đài (đã thay bằng than-thu-v2) | GIỮ — test trộn: cùng tệp test khoá `hinh-thai.ts`/`kinh-nghiem.ts` (đang dùng ở dao-core, SanhBanDo, hap-thu-ngay) và danh sách soát chữ (chu-thay, nhip-bang, experiment-catalog); xoá phải tách test trước |
| `src/components/LogoDDH.tsx` | Chỉ test nhập, không màn nào nạp | GIỮ — không rõ là chức năng đã gỡ (luật thuần có thể còn giá trị) |
| `src/components/OngNghiemExp.tsx` | Game Thần thú Hoá học cũ / Võ đài (đã thay bằng than-thu-v2) | GIỮ — test trộn: cùng tệp test khoá `hinh-thai.ts`/`kinh-nghiem.ts` (đang dùng ở dao-core, SanhBanDo, hap-thu-ngay) và danh sách soát chữ (chu-thay, nhip-bang, experiment-catalog); xoá phải tách test trước |
| `src/components/PopupThuongExp.tsx` | Game Thần thú Hoá học cũ / Võ đài (đã thay bằng than-thu-v2) | GIỮ — test trộn: cùng tệp test khoá `hinh-thai.ts`/`kinh-nghiem.ts` (đang dùng ở dao-core, SanhBanDo, hap-thu-ngay) và danh sách soát chữ (chu-thay, nhip-bang, experiment-catalog); xoá phải tách test trước |
| `src/components/ThanThu3D.tsx` | Game Thần thú Hoá học cũ / Võ đài (đã thay bằng than-thu-v2) | GIỮ — test trộn: cùng tệp test khoá `hinh-thai.ts`/`kinh-nghiem.ts` (đang dùng ở dao-core, SanhBanDo, hap-thu-ngay) và danh sách soát chữ (chu-thay, nhip-bang, experiment-catalog); xoá phải tách test trước |
| `src/components/ThanThuHoaHocGame.tsx` | Game Thần thú Hoá học cũ / Võ đài (đã thay bằng than-thu-v2) | GIỮ — test trộn: cùng tệp test khoá `hinh-thai.ts`/`kinh-nghiem.ts` (đang dùng ở dao-core, SanhBanDo, hap-thu-ngay) và danh sách soát chữ (chu-thay, nhip-bang, experiment-catalog); xoá phải tách test trước |
| `src/components/TheTienBo.tsx` | Chỉ test nhập, không màn nào nạp | GIỮ — không rõ là chức năng đã gỡ (luật thuần có thể còn giá trị) |
| `src/components/ph-moi/BangMoiThu.tsx` | App phụ huynh cũ (ph-moi, đã thay bằng ph-v3) | GIỮ — test của thẻ cũ đồng thời khoá `lib/ph-moi/du-lieu.ts`, `api.ts` (ph-v3 đang dùng) và luật CSS không va chạm lớp; xoá phải tách test trước |
| `src/components/ph-moi/BieuTuongAp.tsx` | App phụ huynh cũ (ph-moi, đã thay bằng ph-v3) | GIỮ — test của thẻ cũ đồng thời khoá `lib/ph-moi/du-lieu.ts`, `api.ts` (ph-v3 đang dùng) và luật CSS không va chạm lớp; xoá phải tách test trước |
| `src/components/ph-moi/ManChinh.tsx` | App phụ huynh cũ (ph-moi, đã thay bằng ph-v3) | GIỮ — test của thẻ cũ đồng thời khoá `lib/ph-moi/du-lieu.ts`, `api.ts` (ph-v3 đang dùng) và luật CSS không va chạm lớp; xoá phải tách test trước |
| `src/components/ph-moi/ThanhDayAp.tsx` | App phụ huynh cũ (ph-moi, đã thay bằng ph-v3) | GIỮ — test của thẻ cũ đồng thời khoá `lib/ph-moi/du-lieu.ts`, `api.ts` (ph-v3 đang dùng) và luật CSS không va chạm lớp; xoá phải tách test trước |
| `src/components/ph-moi/bang/AiLam.tsx` | App phụ huynh cũ (ph-moi, đã thay bằng ph-v3) | GIỮ — test của thẻ cũ đồng thời khoá `lib/ph-moi/du-lieu.ts`, `api.ts` (ph-v3 đang dùng) và luật CSS không va chạm lớp; xoá phải tách test trước |
| `src/components/ph-moi/bang/Btvn.tsx` | App phụ huynh cũ (ph-moi, đã thay bằng ph-v3) | GIỮ — test của thẻ cũ đồng thời khoá `lib/ph-moi/du-lieu.ts`, `api.ts` (ph-v3 đang dùng) và luật CSS không va chạm lớp; xoá phải tách test trước |
| `src/components/ph-moi/bang/Ca.tsx` | App phụ huynh cũ (ph-moi, đã thay bằng ph-v3) | GIỮ — test của thẻ cũ đồng thời khoá `lib/ph-moi/du-lieu.ts`, `api.ts` (ph-v3 đang dùng) và luật CSS không va chạm lớp; xoá phải tách test trước |
| `src/components/ph-moi/bang/Dang.tsx` | App phụ huynh cũ (ph-moi, đã thay bằng ph-v3) | GIỮ — test của thẻ cũ đồng thời khoá `lib/ph-moi/du-lieu.ts`, `api.ts` (ph-v3 đang dùng) và luật CSS không va chạm lớp; xoá phải tách test trước |
| `src/components/ph-moi/bang/DauTrang.tsx` | App phụ huynh cũ (ph-moi, đã thay bằng ph-v3) | GIỮ — test của thẻ cũ đồng thời khoá `lib/ph-moi/du-lieu.ts`, `api.ts` (ph-v3 đang dùng) và luật CSS không va chạm lớp; xoá phải tách test trước |
| `src/components/ph-moi/bang/DieuMung.tsx` | App phụ huynh cũ (ph-moi, đã thay bằng ph-v3) | GIỮ — test của thẻ cũ đồng thời khoá `lib/ph-moi/du-lieu.ts`, `api.ts` (ph-v3 đang dùng) và luật CSS không va chạm lớp; xoá phải tách test trước |
| `src/components/ph-moi/bang/DongThoiGian.css` | App phụ huynh cũ (ph-moi, đã thay bằng ph-v3) | GIỮ — test của thẻ cũ đồng thời khoá `lib/ph-moi/du-lieu.ts`, `api.ts` (ph-v3 đang dùng) và luật CSS không va chạm lớp; xoá phải tách test trước |
| `src/components/ph-moi/bang/DongThoiGian.tsx` | App phụ huynh cũ (ph-moi, đã thay bằng ph-v3) | GIỮ — test của thẻ cũ đồng thời khoá `lib/ph-moi/du-lieu.ts`, `api.ts` (ph-v3 đang dùng) và luật CSS không va chạm lớp; xoá phải tách test trước |
| `src/components/ph-moi/bang/LichOn.tsx` | App phụ huynh cũ (ph-moi, đã thay bằng ph-v3) | GIỮ — test của thẻ cũ đồng thời khoá `lib/ph-moi/du-lieu.ts`, `api.ts` (ph-v3 đang dùng) và luật CSS không va chạm lớp; xoá phải tách test trước |
| `src/components/ph-moi/bang/LoiAi.tsx` | App phụ huynh cũ (ph-moi, đã thay bằng ph-v3) | GIỮ — test của thẻ cũ đồng thời khoá `lib/ph-moi/du-lieu.ts`, `api.ts` (ph-v3 đang dùng) và luật CSS không va chạm lớp; xoá phải tách test trước |
| `src/components/ph-moi/bang/Nhip14.tsx` | App phụ huynh cũ (ph-moi, đã thay bằng ph-v3) | GIỮ — test của thẻ cũ đồng thời khoá `lib/ph-moi/du-lieu.ts`, `api.ts` (ph-v3 đang dùng) và luật CSS không va chạm lớp; xoá phải tách test trước |
| `src/components/ph-moi/bang/SapCo.tsx` | App phụ huynh cũ (ph-moi, đã thay bằng ph-v3) | GIỮ — test của thẻ cũ đồng thời khoá `lib/ph-moi/du-lieu.ts`, `api.ts` (ph-v3 đang dùng) và luật CSS không va chạm lớp; xoá phải tách test trước |
| `src/components/ph-moi/bang/TongQuan.css` | App phụ huynh cũ (ph-moi, đã thay bằng ph-v3) | GIỮ — test của thẻ cũ đồng thời khoá `lib/ph-moi/du-lieu.ts`, `api.ts` (ph-v3 đang dùng) và luật CSS không va chạm lớp; xoá phải tách test trước |
| `src/components/ph-moi/bang/TongQuan.tsx` | App phụ huynh cũ (ph-moi, đã thay bằng ph-v3) | GIỮ — test của thẻ cũ đồng thời khoá `lib/ph-moi/du-lieu.ts`, `api.ts` (ph-v3 đang dùng) và luật CSS không va chạm lớp; xoá phải tách test trước |
| `src/components/ph-moi/bang/TungCau.css` | App phụ huynh cũ (ph-moi, đã thay bằng ph-v3) | GIỮ — test của thẻ cũ đồng thời khoá `lib/ph-moi/du-lieu.ts`, `api.ts` (ph-v3 đang dùng) và luật CSS không va chạm lớp; xoá phải tách test trước |
| `src/components/ph-moi/bang/TungCau.tsx` | App phụ huynh cũ (ph-moi, đã thay bằng ph-v3) | GIỮ — test của thẻ cũ đồng thời khoá `lib/ph-moi/du-lieu.ts`, `api.ts` (ph-v3 đang dùng) và luật CSS không va chạm lớp; xoá phải tách test trước |
| `src/components/ph-moi/bang/VoBang.tsx` | App phụ huynh cũ (ph-moi, đã thay bằng ph-v3) | GIỮ — test của thẻ cũ đồng thời khoá `lib/ph-moi/du-lieu.ts`, `api.ts` (ph-v3 đang dùng) và luật CSS không va chạm lớp; xoá phải tách test trước |
| `src/components/ph-moi/bang/Vong3.tsx` | App phụ huynh cũ (ph-moi, đã thay bằng ph-v3) | GIỮ — test của thẻ cũ đồng thời khoá `lib/ph-moi/du-lieu.ts`, `api.ts` (ph-v3 đang dùng) và luật CSS không va chạm lớp; xoá phải tách test trước |
| `src/components/ph-moi/bang/bieu-tuong.tsx` | App phụ huynh cũ (ph-moi, đã thay bằng ph-v3) | GIỮ — test của thẻ cũ đồng thời khoá `lib/ph-moi/du-lieu.ts`, `api.ts` (ph-v3 đang dùng) và luật CSS không va chạm lớp; xoá phải tách test trước |
| `src/components/ph-moi/bang/c-chung.ts` | App phụ huynh cũ (ph-moi, đã thay bằng ph-v3) | GIỮ — test của thẻ cũ đồng thời khoá `lib/ph-moi/du-lieu.ts`, `api.ts` (ph-v3 đang dùng) và luật CSS không va chạm lớp; xoá phải tách test trước |
| `src/components/ph-moi/bang/dung-chung.tsx` | App phụ huynh cũ (ph-moi, đã thay bằng ph-v3) | GIỮ — test của thẻ cũ đồng thời khoá `lib/ph-moi/du-lieu.ts`, `api.ts` (ph-v3 đang dùng) và luật CSS không va chạm lớp; xoá phải tách test trước |
| `src/components/ph-moi/bang/khoi-c.css` | App phụ huynh cũ (ph-moi, đã thay bằng ph-v3) | GIỮ — test của thẻ cũ đồng thời khoá `lib/ph-moi/du-lieu.ts`, `api.ts` (ph-v3 đang dùng) và luật CSS không va chạm lớp; xoá phải tách test trước |
| `src/components/ph-moi/bang/nhom-cau.ts` | App phụ huynh cũ (ph-moi, đã thay bằng ph-v3) | GIỮ — test của thẻ cũ đồng thời khoá `lib/ph-moi/du-lieu.ts`, `api.ts` (ph-v3 đang dùng) và luật CSS không va chạm lớp; xoá phải tách test trước |
| `src/components/ph-moi/bang/so-dem.tsx` | App phụ huynh cũ (ph-moi, đã thay bằng ph-v3) | GIỮ — test của thẻ cũ đồng thời khoá `lib/ph-moi/du-lieu.ts`, `api.ts` (ph-v3 đang dùng) và luật CSS không va chạm lớp; xoá phải tách test trước |
| `src/components/ph-moi/ph-apple-bang.css` | App phụ huynh cũ (ph-moi, đã thay bằng ph-v3) | GIỮ — test của thẻ cũ đồng thời khoá `lib/ph-moi/du-lieu.ts`, `api.ts` (ph-v3 đang dùng) và luật CSS không va chạm lớp; xoá phải tách test trước |
| `src/components/ph-moi/ph-apple.css` | App phụ huynh cũ (ph-moi, đã thay bằng ph-v3) | GIỮ — test của thẻ cũ đồng thời khoá `lib/ph-moi/du-lieu.ts`, `api.ts` (ph-v3 đang dùng) và luật CSS không va chạm lớp; xoá phải tách test trước |
| `src/components/xem-diem-gv/BaoCaoCaLop.tsx` | Báo cáo xem điểm của thầy (bản cũ) | GIỮ — chưa chắc đã gỡ hẳn |
| `src/components/xem-diem-gv/BaoCaoMotEm.tsx` | Báo cáo xem điểm của thầy (bản cũ) | GIỮ — chưa chắc đã gỡ hẳn |
| `src/components/xem-diem-gv/xem-diem-gv.css` | Báo cáo xem điểm của thầy (bản cũ) | GIỮ — chưa chắc đã gỡ hẳn |
| `src/components/xem-diem/TheCaGanNhat.tsx` | Chỉ test nhập, không màn nào nạp | GIỮ — không rõ là chức năng đã gỡ (luật thuần có thể còn giá trị) |
| `src/components/xem-thu/btvn-da-giao-canh.ts` | Dữ liệu trang xem thử (dev) | GIỮ — trang dev dùng |
| `src/game/than-thu-hoa-hoc/am-thanh-pet.ts` | Game Thần thú Hoá học cũ / Võ đài (đã thay bằng than-thu-v2) | GIỮ — test trộn: cùng tệp test khoá `hinh-thai.ts`/`kinh-nghiem.ts` (đang dùng ở dao-core, SanhBanDo, hap-thu-ngay) và danh sách soát chữ (chu-thay, nhip-bang, experiment-catalog); xoá phải tách test trước |
| `src/game/than-thu-hoa-hoc/can-bang-thap.ts` | Game Thần thú Hoá học cũ / Võ đài (đã thay bằng than-thu-v2) | GIỮ — test trộn: cùng tệp test khoá `hinh-thai.ts`/`kinh-nghiem.ts` (đang dùng ở dao-core, SanhBanDo, hap-thu-ngay) và danh sách soát chữ (chu-thay, nhip-bang, experiment-catalog); xoá phải tách test trước |
| `src/game/than-thu-hoa-hoc/canh-3d-chung.ts` | Game Thần thú Hoá học cũ / Võ đài (đã thay bằng than-thu-v2) | GIỮ — test trộn: cùng tệp test khoá `hinh-thai.ts`/`kinh-nghiem.ts` (đang dùng ở dao-core, SanhBanDo, hap-thu-ngay) và danh sách soát chữ (chu-thay, nhip-bang, experiment-catalog); xoá phải tách test trước |
| `src/game/than-thu-hoa-hoc/canh-nen-3d.ts` | Game Thần thú Hoá học cũ / Võ đài (đã thay bằng than-thu-v2) | GIỮ — test trộn: cùng tệp test khoá `hinh-thai.ts`/`kinh-nghiem.ts` (đang dùng ở dao-core, SanhBanDo, hap-thu-ngay) và danh sách soát chữ (chu-thay, nhip-bang, experiment-catalog); xoá phải tách test trước |
| `src/game/than-thu-hoa-hoc/cau-hoi-cua-em.ts` | Game Thần thú Hoá học cũ / Võ đài (đã thay bằng than-thu-v2) | GIỮ — test trộn: cùng tệp test khoá `hinh-thai.ts`/`kinh-nghiem.ts` (đang dùng ở dao-core, SanhBanDo, hap-thu-ngay) và danh sách soát chữ (chu-thay, nhip-bang, experiment-catalog); xoá phải tách test trước |
| `src/game/than-thu-hoa-hoc/chieu-thuc-3d.ts` | Game Thần thú Hoá học cũ / Võ đài (đã thay bằng than-thu-v2) | GIỮ — test trộn: cùng tệp test khoá `hinh-thai.ts`/`kinh-nghiem.ts` (đang dùng ở dao-core, SanhBanDo, hap-thu-ngay) và danh sách soát chữ (chu-thay, nhip-bang, experiment-catalog); xoá phải tách test trước |
| `src/game/than-thu-hoa-hoc/dang-than-thu.ts` | Game Thần thú Hoá học cũ / Võ đài (đã thay bằng than-thu-v2) | GIỮ — test trộn: cùng tệp test khoá `hinh-thai.ts`/`kinh-nghiem.ts` (đang dùng ở dao-core, SanhBanDo, hap-thu-ngay) và danh sách soát chữ (chu-thay, nhip-bang, experiment-catalog); xoá phải tách test trước |
| `src/game/than-thu-hoa-hoc/dau-truong-chan-ly.ts` | Game Thần thú Hoá học cũ / Võ đài (đã thay bằng than-thu-v2) | GIỮ — test trộn: cùng tệp test khoá `hinh-thai.ts`/`kinh-nghiem.ts` (đang dùng ở dao-core, SanhBanDo, hap-thu-ngay) và danh sách soát chữ (chu-thay, nhip-bang, experiment-catalog); xoá phải tách test trước |
| `src/game/than-thu-hoa-hoc/dong-bo.ts` | Game Thần thú Hoá học cũ / Võ đài (đã thay bằng than-thu-v2) | GIỮ — test trộn: cùng tệp test khoá `hinh-thai.ts`/`kinh-nghiem.ts` (đang dùng ở dao-core, SanhBanDo, hap-thu-ngay) và danh sách soát chữ (chu-thay, nhip-bang, experiment-catalog); xoá phải tách test trước |
| `src/game/than-thu-hoa-hoc/dung-than-thu-3d.ts` | Game Thần thú Hoá học cũ / Võ đài (đã thay bằng than-thu-v2) | GIỮ — test trộn: cùng tệp test khoá `hinh-thai.ts`/`kinh-nghiem.ts` (đang dùng ở dao-core, SanhBanDo, hap-thu-ngay) và danh sách soát chữ (chu-thay, nhip-bang, experiment-catalog); xoá phải tách test trước |
| `src/game/than-thu-hoa-hoc/he-thong-pet.ts` | Game Thần thú Hoá học cũ / Võ đài (đã thay bằng than-thu-v2) | GIỮ — test trộn: cùng tệp test khoá `hinh-thai.ts`/`kinh-nghiem.ts` (đang dùng ở dao-core, SanhBanDo, hap-thu-ngay) và danh sách soát chữ (chu-thay, nhip-bang, experiment-catalog); xoá phải tách test trước |
| `src/game/than-thu-hoa-hoc/kho-cau-hoi.ts` | Game Thần thú Hoá học cũ / Võ đài (đã thay bằng than-thu-v2) | GIỮ — test trộn: cùng tệp test khoá `hinh-thai.ts`/`kinh-nghiem.ts` (đang dùng ở dao-core, SanhBanDo, hap-thu-ngay) và danh sách soát chữ (chu-thay, nhip-bang, experiment-catalog); xoá phải tách test trước |
| `src/game/than-thu-hoa-hoc/long-thu-3d.ts` | Game Thần thú Hoá học cũ / Võ đài (đã thay bằng than-thu-v2) | GIỮ — test trộn: cùng tệp test khoá `hinh-thai.ts`/`kinh-nghiem.ts` (đang dùng ở dao-core, SanhBanDo, hap-thu-ngay) và danh sách soát chữ (chu-thay, nhip-bang, experiment-catalog); xoá phải tách test trước |
| `src/game/than-thu-hoa-hoc/rut-cau-thap.ts` | Game Thần thú Hoá học cũ / Võ đài (đã thay bằng than-thu-v2) | GIỮ — test trộn: cùng tệp test khoá `hinh-thai.ts`/`kinh-nghiem.ts` (đang dùng ở dao-core, SanhBanDo, hap-thu-ngay) và danh sách soát chữ (chu-thay, nhip-bang, experiment-catalog); xoá phải tách test trước |
| `src/game/than-thu-hoa-hoc/tan-hu-vo-3d.ts` | Game Thần thú Hoá học cũ / Võ đài (đã thay bằng than-thu-v2) | GIỮ — test trộn: cùng tệp test khoá `hinh-thai.ts`/`kinh-nghiem.ts` (đang dùng ở dao-core, SanhBanDo, hap-thu-ngay) và danh sách soát chữ (chu-thay, nhip-bang, experiment-catalog); xoá phải tách test trước |
| `src/game/than-thu-hoa-hoc/tuong-khac.ts` | Game Thần thú Hoá học cũ / Võ đài (đã thay bằng than-thu-v2) | GIỮ — test trộn: cùng tệp test khoá `hinh-thai.ts`/`kinh-nghiem.ts` (đang dùng ở dao-core, SanhBanDo, hap-thu-ngay) và danh sách soát chữ (chu-thay, nhip-bang, experiment-catalog); xoá phải tách test trước |
| `src/game/than-thu-hoa-hoc/ve-than-thu.ts` | Game Thần thú Hoá học cũ / Võ đài (đã thay bằng than-thu-v2) | GIỮ — test trộn: cùng tệp test khoá `hinh-thai.ts`/`kinh-nghiem.ts` (đang dùng ở dao-core, SanhBanDo, hap-thu-ngay) và danh sách soát chữ (chu-thay, nhip-bang, experiment-catalog); xoá phải tách test trước |
| `src/game/than-thu-v2/shop/du-lieu-mau.ts` | Chỉ test nhập, không màn nào nạp | GIỮ — không rõ là chức năng đã gỡ (luật thuần có thể còn giá trị) |
| `src/lib/anh-than-thu.ts` | Game Thần thú Hoá học cũ / Võ đài (đã thay bằng than-thu-v2) | GIỮ — test trộn: cùng tệp test khoá `hinh-thai.ts`/`kinh-nghiem.ts` (đang dùng ở dao-core, SanhBanDo, hap-thu-ngay) và danh sách soát chữ (chu-thay, nhip-bang, experiment-catalog); xoá phải tách test trước |
| `src/lib/bai-tap.ts` | Chỉ test nhập, không màn nào nạp | GIỮ — không rõ là chức năng đã gỡ (luật thuần có thể còn giá trị) |
| `src/lib/bang-tin-san/mau-gia.ts` | Chỉ test nhập, không màn nào nạp | GIỮ — không rõ là chức năng đã gỡ (luật thuần có thể còn giá trị) |
| `src/lib/btvn-nang-do-lich.ts` | Chỉ test nhập, không màn nào nạp | GIỮ — không rõ là chức năng đã gỡ (luật thuần có thể còn giá trị) |
| `src/lib/danh-gia-bai.ts` | Chỉ test nhập, không màn nào nạp | GIỮ — không rõ là chức năng đã gỡ (luật thuần có thể còn giá trị) |
| `src/lib/danh-sach-hs.ts` | Chỉ test nhập, không màn nào nạp | GIỮ — không rõ là chức năng đã gỡ (luật thuần có thể còn giá trị) |
| `src/lib/dat-nhiem-vu-ngay.ts` | Chỉ test nhập, không màn nào nạp | GIỮ — không rõ là chức năng đã gỡ (luật thuần có thể còn giá trị) |
| `src/lib/do-tai-loi.ts` | Chỉ test nhập, không màn nào nạp | GIỮ — không rõ là chức năng đã gỡ (luật thuần có thể còn giá trị) |
| `src/lib/exam-answer-key.ts` | Chỉ test nhập, không màn nào nạp | GIỮ — không rõ là chức năng đã gỡ (luật thuần có thể còn giá trị) |
| `src/lib/exam-auto-structure.ts` | Chỉ test nhập, không màn nào nạp | GIỮ — không rõ là chức năng đã gỡ (luật thuần có thể còn giá trị) |
| `src/lib/exam-parse.ts` | Chỉ test nhập, không màn nào nạp | GIỮ — không rõ là chức năng đã gỡ (luật thuần có thể còn giá trị) |
| `src/lib/giao-an-len-bang.ts` | Chỉ test nhập, không màn nào nạp | GIỮ — không rõ là chức năng đã gỡ (luật thuần có thể còn giá trị) |
| `src/lib/giao-them-cho-con.ts` | Chỉ test nhập, không màn nào nạp | GIỮ — không rõ là chức năng đã gỡ (luật thuần có thể còn giá trị) |
| `src/lib/ke-don-chua.ts` | Chỉ test nhập, không màn nào nạp | GIỮ — không rõ là chức năng đã gỡ (luật thuần có thể còn giá trị) |
| `src/lib/kho-de-giao.ts` | Chỉ test nhập, không màn nào nạp | GIỮ — không rõ là chức năng đã gỡ (luật thuần có thể còn giá trị) |
| `src/lib/kinh-te-game.ts` | Chỉ test nhập, không màn nào nạp | GIỮ — không rõ là chức năng đã gỡ (luật thuần có thể còn giá trị) |
| `src/lib/lich-on-lai.ts` | Chỉ test nhập, không màn nào nạp | GIỮ — không rõ là chức năng đã gỡ (luật thuần có thể còn giá trị) |
| `src/lib/mo-phong-bang-gia-exp.ts` | Chỉ test nhập, không màn nào nạp | GIỮ — không rõ là chức năng đã gỡ (luật thuần có thể còn giá trị) |
| `src/lib/ph-moi/nhip-ngay.ts` | App phụ huynh cũ (ph-moi, đã thay bằng ph-v3) | GIỮ — test của thẻ cũ đồng thời khoá `lib/ph-moi/du-lieu.ts`, `api.ts` (ph-v3 đang dùng) và luật CSS không va chạm lớp; xoá phải tách test trước |
| `src/lib/thu-thach-chon-cau.ts` | Chỉ test nhập, không màn nào nạp | GIỮ — không rõ là chức năng đã gỡ (luật thuần có thể còn giá trị) |
| `src/lib/uoc-luong-thoi-gian.ts` | Chỉ test nhập, không màn nào nạp | GIỮ — không rõ là chức năng đã gỡ (luật thuần có thể còn giá trị) |
| `src/lib/ve-dich.ts` | Chỉ test nhập, không màn nào nạp | GIỮ — không rõ là chức năng đã gỡ (luật thuần có thể còn giá trị) |
| `src/lib/xep-gio-len-bang.ts` | Chỉ test nhập, không màn nào nạp | GIỮ — không rõ là chức năng đã gỡ (luật thuần có thể còn giá trị) |
| `src/lib/zip.ts` | Chỉ test nhập, không màn nào nạp | GIỮ — không rõ là chức năng đã gỡ (luật thuần có thể còn giá trị) |

## C. Ảnh công khai không nơi dùng (việc 9)

| Tệp | Lý do | Quyết định |
|---|---|---|
| `public/than-thu-v2/bat-linh.png` (3,0 MB) | 0 tham chiếu (chữ `bat-linh` còn lại là tên mùa game trong dữ liệu) | **XOÁ** |
| `public/than-thu-v2/evolution-elements.png` (2,8 MB) | bản chưa tách nền; mã chỉ dùng `-cutout` | **XOÁ** |
| `public/than-thu-v2/evolution-virtues.png` (2,5 MB) | như trên | **XOÁ** |
| `public/than-thu-v2/combat/0..7.png` (19 MB) | không màn nào nạp, NHƯNG là ảnh nguồn của `scripts/cat-anh-than-thu.mjs` (sinh `nho/the-*.webp`) | GIỮ |
| `public/than-thu-v2/evolution-*-cutout.png`, `spells/*.png` | nay app đọc bản `.webp`; PNG là đường lui khi trình duyệt không đọc được WebP, và là nguồn của script cắt ảnh | GIỮ |
