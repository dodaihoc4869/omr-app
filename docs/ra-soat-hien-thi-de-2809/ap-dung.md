# Kịch bản áp dụng / lùi — sửa trình bày kho đề (28/09)

Tệp: `ap-dung.py` (cùng thư mục). Đối số đầu là đường tới `goi-api.py` (mã bí mật nằm ở `.hdr` cạnh nó, không in ra).

## Ràng buộc
- CHỈ đổi các trường liệt kê trong `sua-tung-cau.json` (cách viết/trình bày). Không đụng đáp án, số liệu, thứ tự phương án.
- Trước khi ghi: `/ca/danh-sach` phải trả `items` **rỗng**; có ca mở ⇒ script tự dừng.
- Mỗi trường chỉ ghi khi giá trị hiện tại trên máy chủ **đúng bằng** `truoc` (và bằng bản sao lưu); lệch ⇒ bỏ qua, in ra.
- Ghi qua đường chính thức của app `/kho/day` (sau cổng thầy), cả gói tờ + chỉ mục câu (tờ `DB-…` chỉ mục rỗng như luật `/kho/chi-muc`).
  `ngay_nap` của tờ đổi thành ngày áp ⇒ máy thầy/em tự tải lại tờ ấy khi đồng bộ.
- Lô ≤ 20 câu (theo tờ). Sau mỗi lô đọc lại `/kho/lay` so từng trường; lệch ⇒ dừng. Mỗi lô ghi một dòng `nhat-ky-ap-dung.md`.

## Các bước
```bash
G=/tmp/claude-0/-home-user-omr-app/372d898c-b8fd-5f51-b347-5c27b972161c/scratchpad/goi-api.py
python3 docs/ra-soat-hien-thi-de-2809/ap-dung.py $G sao-luu      # 1) xuất nguyên bản 799 câu → sao-luu-truoc-sua.json (commit)
python3 docs/ra-soat-hien-thi-de-2809/ap-dung.py $G ap           # 2) chạy thử, không ghi
python3 docs/ra-soat-hien-thi-de-2809/ap-dung.py $G ap --that    # 3) ghi thật theo lô
```

## Lùi
```bash
python3 docs/ra-soat-hien-thi-de-2809/ap-dung.py $G lui          # thử
python3 docs/ra-soat-hien-thi-de-2809/ap-dung.py $G lui --that   # trả MỌI trường đã sửa về nguyên bản trong sao-luu-truoc-sua.json
```
Lùi cũng kiểm ca mở, đọc lại từng lô, ghi nhật ký. Trường nào đã bị sửa tay sau lượt áp (không còn bằng `sau`) thì bỏ qua, không đè.
Bộ hiển thị mới (commit mã) độc lập với dữ liệu: lùi dữ liệu thì câu vẫn hiện đúng nhờ bộ hiển thị.
