# SỔ VIỆC — 14/09 lượt 11 · ĐỒNG BỘ KHO + TỜ MÁY CHIẾU

- [x] "Bạn phải đồng bộ sang máy học sinh"  | bằng chứng: đã lên live `4498d442`; đo thật ca Test6: 8 tờ · 187 KB · 164 ứng viên · 5/9 dạng (trước là 1 tờ · 396 KB · 6 ứng viên · 1/9 dạng)
- [x] "Lời giải hiện trong mục chiếu lên bảng bị lỗi"  | bằng chứng: `vitest run tests/may-chieu-len-bang-1409.test.ts` 15/15
- [x] "nội dung đề bị lỗi chữ, sửa lại đúng chuẩn"  | bằng chứng: `vitest run tests/gop-dau-nfc-1409.test.ts` 8/8 · commit `f2dc080`
- [x] "cho tôi một nút toàn màn hình ở mục chiếu lên bảng"  | bằng chứng: 15/15 như trên · commit `f2dc080`
- [x] "1 đợt là 1 trang chia đôi bảng, bấm đợt tiếp thì chuyển ngang"  | bằng chứng: 15/15 như trên · commit `f2dc080`
- [x] Chọn tờ đề chia đều theo chuyên đề (để đủ 9/9 dạng)  | bằng chứng: 7 cửa xanh, CHƯA phát hành
- [!] Phát hành  | KẸT: phiên Claude khác đang sửa đường phát hành ngay lúc này

## 7 CỬA — đo lúc 13:00–13:10 ngày 14/09, trên đúng cây đang có

| Cửa | Kết quả |
|---|---|
| `npx tsc -b` | 0 lỗi |
| `npx tsc -p server/tsconfig.json --noEmit` | 0 lỗi |
| `npx vitest run --shard=1..3/3` | 253 tệp · 3.697 phép · 0 trượt |
| `npm run check:mau` | sạch |
| `node scripts/kiem-13.mjs` | ĐẠT 18/18 |
| `node scripts/kiem-sw.mjs` | ĐẠT 6/6 |
| `npx vite build` | rc=0 |

## KẸT: phiên khác đang sửa đường phát hành

Lúc 12:55 phiên ấy để `server/src/goi-cu.ts` ở trạng thái VỠ: viết lại
`danhGiaLuot` theo `layCauPhan` nhưng bỏ mất ba dòng dựng `pI`/`pII`/`pIII`,
18 lỗi biên dịch. `wrangler` bó bằng esbuild nên KHÔNG chặn — đẩy lên là mỗi
lượt chấm ném ReferenceError và mọi báo cáo câu sai chết. Tôi khôi phục đúng ba
dòng ấy lúc 12:59, không đổi một chữ nào trong thiết kế của nó.

Sau đó, từ 13:02 đến 13:09 phiên ấy sửa tiếp:
`DAY-TAT-CA.command` · `public/_headers` · `public/_redirects` · `src/sw.ts` ·
`src/screens/ExamTakeScreen.tsx` · `PhieuScreen.tsx` · `PhieuV3.tsx` ·
`tests/dem-cau-bao-cao-1409.test.ts` — đang dựng trang `/cai-app`.

Đáng chú ý: `_redirects` đổi `/hs` và `/ph` từ phục vụ thẳng (mã 200, giữ
nguyên đường dẫn) sang chuyển hướng 302. Chú thích cũ ghi rõ vì sao phải là
200. Đổi này chạm đúng phần cài app lên màn hình iPhone đã sửa sáng nay.

`DAY-TAT-CA.command` dựng từ CÂY LÀM VIỆC, nên bấm phát hành bây giờ là đẩy
luôn trang `/cai-app` còn dở và luật chuyển hướng mới. Đã dừng, chờ thầy.

Lệnh khi thầy cho phép: `~/Documents/DAY-OMR-APP.command`
Lùi phần của tôi: `git revert f2dc080`
