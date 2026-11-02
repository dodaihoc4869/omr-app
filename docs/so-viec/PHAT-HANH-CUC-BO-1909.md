# PHÁT HÀNH TỪ MÁY THẦY — 19/09

GitHub Actions ("Phát hành lên Cloudflare Pages") vẫn báo thiếu
`CLOUDFLARE_API_TOKEN` sau 3 lần chạy lại — secret trên GitHub chưa nhận đúng.
Trong lúc chờ sửa chỗ đó, đây là đường THẦY VẪN LUÔN DÙNG từ trước tới giờ:
đẩy thẳng bằng `wrangler` từ máy thầy, dùng phiên đăng nhập Cloudflare có sẵn
trên máy (không cần token, không đụng GitHub Actions).

Dự án ĐÃ CÓ SẴN 3 tệp bấm-đúp cho việc này — không cần gõ lệnh:

| Tệp | Việc làm |
|---|---|
| `DAY-TAT-CA.command` | Đẩy cả máy chủ (Worker) lẫn app (Pages) — dùng cái này khi không chắc |
| `DAY-LEN-PAGES.command` | Chỉ đẩy app (Pages), không đụng máy chủ |
| `DAY-MAY-CHU.command` | Chỉ đẩy máy chủ (Worker), có tự kiểm không có ca thi đang mở trước khi đẩy |

**Cách dùng:** mở Finder tới thư mục dự án trên máy thầy, bấm đúp vào tệp
`.command` cần chạy. Cửa sổ Terminal tự mở, tự chạy, báo kết quả, xong thì bấm
Enter để đóng.

---

## Bước 0 — Lấy code mới nhất về máy thầy

Hai bản vá hôm nay (rút đề kho mỏng + bỏ Vòng 1/Vòng 2) đã nằm trên `main`
trên GitHub. Mở Terminal, vào đúng thư mục dự án trên máy thầy rồi chạy:

```bash
git pull origin main
```

Nếu Terminal báo có thay đổi chưa lưu ("uncommitted changes") mà thầy không
nhớ đã sửa gì trên máy này, dừng lại và cho tôi biết trước khi làm tiếp —
đừng tự ý `git reset`/`git checkout .` kẻo mất việc đang dở.

---

## Bước 1 — Đẩy máy chủ + app (dùng chung một lần)

Bấm đúp `DAY-TAT-CA.command`. Cửa sổ Terminal hiện 4 bước, mỗi bước một dòng
kết quả. Nếu bước nào báo lỗi thì DỪNG NGAY tại đó — các bước sau không chạy,
bản đang sống KHÔNG bị đụng vào.

Lỗi hay gặp nhất và cách xử lý:

- **"chưa đăng nhập" / báo liên quan `wrangler login`:** chạy
  `npx wrangler login` một lần (mở trình duyệt xác nhận), xong bấm lại tệp
  `.command`.
- **DAY-MAY-CHU.command báo "đang có ca thi mở":** đúng ý thiết kế — không đẩy
  máy chủ khi học sinh đang làm bài thật. Đợi ca đó nộp xong rồi chạy lại.

---

## Bước 2 — Chạy migration D1 cho tính năng "lô BTVN" (mục 3, MỚI, BẮT BUỘC)

Bản vá bỏ Vòng 1/Vòng 2 cần thêm một cột trong cơ sở dữ liệu (`btvn_em.lo_da_xong`).
Không có 3 tệp `.command` ở trên tự chạy migration — đây là lệnh MỘT LẦN, thầy
tự gõ:

```bash
npx wrangler d1 execute omr --file=server/migration-1909-lo-btvn.sql --remote -y
```

Chạy sau khi Bước 1 đã đẩy máy chủ xong. **Không chạy cũng không sập app** —
mã máy chủ có phòng vệ (bắt lỗi cột thiếu, báo rõ ràng), chỉ là tính năng "lô
theo ngày/giờ" chưa lưu được tiến độ cho tới khi chạy lệnh này.

Kiểm lại đã chạy đúng chưa:

```bash
npx wrangler d1 execute omr --command="SELECT lo_da_xong FROM btvn_em LIMIT 1" --remote
```

Không báo lỗi "no such column" là đã xong.

---

## Bước 3 — Kiểm nhanh sau khi đẩy

1. Mở `https://omr-app-b3u.pages.dev/?vai=gv` — vào được màn giáo viên là Pages
   đã lên bản mới.
2. Mở màn "Rút đề" (KhoiRutDe), bật "Đề riêng từng em", thử với một chuyên đề
   ít câu — không còn cảnh nhiều em trùng gần hết đề.
3. Giao một BTVN mới cho một em, mở bằng link học sinh — phiếu chỉ hiện một
   phần câu đầu ("Hôm nay em làm N câu sáng"), không còn nhãn "Vòng 1/Vòng 2".

---

## Việc còn treo — sửa secret GitHub (không bắt buộc nếu Bước 1–2 đã ổn)

Muốn GitHub tự động phát hành mỗi lần đẩy code lên `main` (không phải bấm tay
mỗi lần), sửa secret trên GitHub:

1. **github.com/dodaihoc4869/omr-app** → **Settings** → **Secrets and
   variables** → **Actions** → tab **"Repository secrets"** (không phải
   "Environment secrets" hay "Variables").
2. Kiểm đúng có 2 secret, tên VIẾT HOA CHÍNH XÁC: `CLOUDFLARE_API_TOKEN` và
   `CLOUDFLARE_ACCOUNT_ID`.
3. Token tạo ở **dash.cloudflare.com → My Profile → API Tokens → Create
   Token** (template "Edit Cloudflare Workers" hoặc quyền
   `Account → Cloudflare Pages → Edit`). Account ID lấy ở trang chủ dashboard
   Cloudflare, cột phải.
4. Sửa xong, vào tab **Actions** của repo → workflow "Phát hành lên Cloudflare
   Pages" → **Run workflow** để thử lại.

Nếu vẫn báo thiếu token sau khi làm đúng các bước trên, chụp màn hình trang
Repository secrets (chỉ hiện tên, không hiện giá trị — an toàn để gửi) rồi gửi
cho tôi, tôi kiểm tiếp.
