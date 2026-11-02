# MỐC LÙI — bản đẩy 15-09-2026

Đẩy lên Cloudflare Pages `omr-app` lúc 15-09-2026, theo lệnh thầy "chốt và đẩy luôn đi".

## Đẩy cái gì

- **HEAD `e82fc0f`** — ba commit Thần Thú Hoá Học của ngày 15-09:
  - `3b94ee8` câu hỏi lấy từ bài làm của em · canvas vào màn đấu · bỏ nút tự khai EXP
  - `37905cb` thanh EXP cấp 1 từ 2000 xuống 240
  - `e82fc0f` chốt nhịp EXP: 300 / hệ số 1,28 / tháp `30 + 6 × tầng`
- **Kèm 5 tệp CHƯA COMMIT** đang nằm trong cây làm việc từ 14-09 (12:52–13:09).
  Bản dựng lấy từ cây làm việc nên chúng đi cùng, y như mọi lần bấm đúp
  `DAY-LEN-PAGES.command`:
  - `src/screens/ExamTakeScreen.tsx` — thêm tham số `boEm` vào `taoBaiGhiDiem`
  - `src/screens/PhieuScreen.tsx` · `src/screens/PhieuV3.tsx` — đếm số câu đúng
    theo mảng `du.dai` thay vì trừ `soBoTrong`
  - `public/_headers` — kiểu MIME cho `.mobileconfig`
  - `DAY-TAT-CA.command` — thêm một dòng in địa chỉ `/cai-app`

## Lệnh lùi

Lùi về bản trước ba commit Thần Thú (giữ nguyên 5 tệp chưa commit ở trên):

```
cd "/Volumes/SSD NGOÀI/omr-app"
git stash push -- src/screens/ExamTakeScreen.tsx src/screens/PhieuScreen.tsx \
  src/screens/PhieuV3.tsx public/_headers DAY-TAT-CA.command
git checkout 444f53f -- src tests
npm run build && rm -f dist/404.html
npx wrangler pages deploy dist --project-name=omr-app --branch=main
git checkout e82fc0f -- src tests && git stash pop
```

Lùi hẳn bản đã đẩy mà không dựng lại: vào bảng Deployments của project `omr-app`
trên Cloudflare, chọn bản trước rồi bấm **Rollback**. Nhanh hơn và chắc hơn.

## ĐÃ ĐẨY — 15-09-2026 lúc 01:49

- Bản triển khai: **`https://ccd15554.omr-app-b3u.pages.dev`**
  (địa chỉ chính vẫn là `https://omr-app-b3u.pages.dev`)
- Chạy bằng `~/Documents/DAY-APP-THAN-THU-1509.command` → `DAY-LEN-PAGES.command`.
  Tệp mới này chỉ đẩy APP; `DAY-OMR-APP.command` cũ gọi `DAY-TAT-CA.command`
  (đẩy CẢ máy chủ) nên không dùng, để khỏi đụng máy chủ đang phục vụ ca thi.
- wrangler: `Uploaded 20 files (129 already uploaded)` · `Deployment complete!`
- **Bản đẩy lúc 00:09 hôm nay KHÔNG có việc Thần Thú** — nó chạy trước commit
  đầu tiên (`3b94ee8`, 00:45). Nên lần đẩy này mới là lần đưa việc lên sóng.

### Bằng chứng gói đã đẩy đúng

`dist/` dựng lại lúc 01:49:42, gói `ThanThuHoaHocGame-DeNDnIYX.js` chứa:
`Hồ Sơ Nguyên Tố` · `Quái chưa hạ` · `Khiêu chiến quái tiếp theo` ·
`câu chính em từng làm sai` · `Hình thái` — và **0 lần** xuất hiện
`Quy đổi câu đã sửa` hay `Nạp Tinh Thể`.

## Cổng đã chạy trước khi đẩy

- `npx tsc -b` — 0 lỗi
- `npm run check:mau` — sạch
- `npx vitest run` — **263 tệp / 3.890 phép**, chạy theo sáu lô, không lô nào trượt
- `npm run build` — sạch

## Giả định đã dùng

**Không kiểm được có ca thi nào đang mở hay không** — không có lệnh đọc trạng thái
ca từ máy này mà không đụng dữ liệu thật. Đẩy lúc **1 giờ sáng giờ Việt Nam**, giờ
không có ca. Nếu thầy có mở ca đêm thì báo, lùi bằng nút Rollback là xong.
