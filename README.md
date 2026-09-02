# OMR-APP — Quét & chấm phiếu trắc nghiệm 2025

PWA offline-first, 100% client-side. Xem đặc tả đầy đủ ở `OMR-APP.md` (nếu có) hoặc trong project "MASTER TẠO APP".

## Chạy thử tại chỗ

```bash
npm install
npm run dev
```

## Chạy test (bắt buộc trước khi build)

```bash
npm test -- --run
```

## Deploy lên GitHub Pages — 3 bước

1. Tạo repo mới trên GitHub, đặt tên đúng bằng `omr-app` (hoặc đổi hằng số
   `REPO_BASE` trong `vite.config.ts` cho khớp tên repo thầy chọn), rồi push
   toàn bộ code lên nhánh `main`:
   ```bash
   git init && git add -A && git commit -m "init"
   git remote add origin <link-repo-github-cua-thay>
   git push -u origin main
   ```
2. Vào **Settings → Pages** của repo, mục "Build and deployment", chọn
   **Source: GitHub Actions** (workflow `.github/workflows/deploy.yml` đã có
   sẵn, tự chạy khi push).
3. Đợi tab **Actions** chạy xong (khoảng 1–2 phút), link app sẽ hiện ở
   Settings → Pages, dạng `https://<username>.github.io/omr-app/`.

Camera chỉ hoạt động trên HTTPS — GitHub Pages đã tự có HTTPS, không cần cấu hình thêm.

## Cấu trúc chính

- `src/data/template2025.json` — nguồn sự thật duy nhất về toạ độ phiếu.
- `src/engine/` — chấm điểm, đọc bubble, cổng chất lượng, ngưỡng cấu hình.
- `src/workers/scan.worker.ts` — pipeline OpenCV.js (anchor, homography).
- `src/screens/` — 6 màn hình.
- `src/lib/` — xuất Excel/JSON, đọc Google Sheet, sinh PDF phiếu in.
- `tests/` — unit test chấm điểm (bài đối chứng 6,60) + bộ ảnh tổng hợp
  kiểm tra Module 2/3 (giảm sáng, bóng đổ, tẩy mờ).
