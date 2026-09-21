# App phụ huynh — MỘT MÀN, MỘT NÚT (thầy lệnh 21/09; Nhật ký 97f3abe) — danh sách ĐÃ GỠ

Còn lại trên màn (theo Boss): lời chào + tiến độ hôm nay của con · dải **cảnh báo của thầy** (thụ động, chỉ đọc + "Đã xem") · thẻ **"Ca kiểm tra gần nhất của con"** (ca đã công bố ⇒ bấm mở hộp báo cáo CHỈ XEM của đúng ca; ca chưa công bố ⇒ không bấm được) · **việc hôm nay của con** (chỉ xem) · MỘT nút **"Giao thêm bài cho con"** (lượt/gói + lời lỗi thật của máy chủ ngay dưới nút) · chân màn **"Đổi số báo danh"** + số bản app (đích ≥ 48 px).
Đăng nhập: SBD của con HOẶC liên kết riêng `?ph=`. Nút giao gửi `{pass}` nếu có mã, không thì `{sbd}` (máy chủ nhận cả hai — Code 3, W2a).

## Đã gỡ (ParentPortalScreen.tsx cũ = 943 dòng → 443; bản trước khi gỡ: `git show 85d92c3:src/screens/ParentPortalScreen.tsx`)
| Tính năng | Ở đâu (trước khi gỡ) | Lệnh máy chủ nó gọi | Xử lý |
|---|---|---|---|
| Menu ba chấm: Báo cáo điểm các ca · Giao bài khắc phục · Bảng tin của con · Giao nhanh ×2 | `muc-menu.tsx` `mucMenuPhuHuynh`; ParentPortal `mucMenu={…}` | — | XOÁ hàm + kiểu `ManCuPhuHuynh`; BangNhiemVu không truyền `mucMenu` ⇒ không menu |
| Tab "Báo cáo điểm tất cả các ca" (sheet toàn màn, danh sách ca) | ParentPortal `tabPh==='diem'` | `/hs/lich-su` (vẫn nạp cho thẻ ca gần nhất) | XOÁ sheet; hộp báo cáo mở từ thẻ ca gần nhất |
| Tab "Khắc phục lỗi sai & Luyện đề (4 lựa chọn)" | `KhoiKhacPhuc3CheDo` | `/mom/create`, `/mom/review`, `/hs/cau-sai` | Không còn được ParentPortal dùng (tệp còn — lô dọn) |
| Tab "Bảng tin của con" | `BangTinPhuHuynh` | `/parent-news/*` | Không còn được dùng (tệp còn — lô dọn) |
| Giao nhanh: khắc phục câu sai / luyện bứt phá | `xuLyGiaoBaiKhacPhuc1Click`, `xuLyGiaoBaiLuyen1Click`, `xuLyGiaoBaiTrucTiep` | `/mom/create` | XOÁ hàm |
| Giao bài hằng ngày cá nhân hoá (Kênh 5) + ô "Giao bài cho con" | `giaoHangNgay`, `napDeXuat`, BangNhiemVu prop `giaoBai/onGiaoBai/onGiaoHangNgay/onNhanThay` | `/parent-news/list`, `/parent-news/assign` | XOÁ hàm + prop + khối JSX + CSS dùng; máy khách KHÔNG còn gọi `/parent-news` |
| Đường dự phòng của nút mới ("máy chủ chưa có lệnh ⇒ ô cũ") | BangNhiemVu `{laPh && onGiaoBai && !giaoThem?.san …}` | — | XOÁ; lỗi/404 ⇒ vẫn MỘT nút + câu lỗi chung ("chưa mất lượt nào") |
| Hộp khắc phục câu sai | `ModalKhacPhucCauSai` | — | Không còn mở ở ParentPortal; trong hộp báo cáo: prop `khongGiaoBai` ẩn nút + hộp |
| Nhắn tin cho thầy từ hộp báo cáo | `guiTinNhan` | (tin nhắn nội bộ) | Không truyền `onNhanTinChoThay` nữa |
| Xem phiếu HTML (`KhungXemPhieu`), tiêu đề tab, `NutQuayLai` | ParentPortal | — | XOÁ |
| Lời Bộ não + thư tuần cho phụ huynh | `TheBoNao`, `boNaoPh` | `/ph/ke-hoach` (`boNao`) | Không truyền `boNaoPh` (lệnh giữ nguyên; nội dung sẽ vào bảng "Mọi thứ về con") |
| "Vinh danh hôm nay" ở đầu-cuối bảng PH | `TheVinhDanh` | `/hs/vinh-danh` | Ẩn ở vai phụ huynh (`!laPh`) |
| Bắt buộc đổi hộp thoại `useHopThoai`, `hopLeDeRut`, `DongDemCau`, icon | ParentPortal | — | XOÁ import |

## Còn dùng lệnh máy chủ (KHÔNG đổi)
`/ph/xac-dinh` (đăng nhập bằng liên kết) · `/hs/lich-su` · `/hs/cau-sai` (đếm) · `/hs/btvn` · `/hs/ke-hoach-ngay` · `/mom/parent-list` (bài gia đình giao để vẽ việc hôm nay) · `/ph/ke-hoach` (chỉ lấy `canhBao`) · `/ph/giao-them` (nút).

## Test đổi CÓ CHỦ Ý (khoá cũ của tính năng đã gỡ)
XOÁ tệp `phu-huynh-giao-bai-1909` (10 test Kênh 5 trên màn PH). SỬA: `bang-nhiem-vu-1909` (xoá describe Kênh 5, thay test "hàng Giao bài cho con" bằng "MỘT nút"; neo chờ đổi vì hết Vinh danh) · `giao-them-cho-con-man-2109` (API/hook nhận SBD + lời lỗi thật; menu → "đã gỡ"; cổng PH thật 4 ca; khoá nguồn) · `ph-khong-game-2109` (bỏ `mucMenuPhuHuynh`/`onGiaoBai`, Vinh danh không còn, chân màn) · `the-ca-gan-nhat-2109` (mở hộp báo cáo; ca chưa công bố không bấm được) · `m3-c9-phu-huynh-1909`, `bao-hiem-ban-moi-2109` (số bản ở chân màn), `ba-viec-1409-dot2`, `khac-phuc-mot-nguon-1409`, `dia-chi-may-chu-mot-nguon-1509`, `khac-phuc-khong-co-cau-sai-1509` (1 dòng), `tu-ngu-cum4-2109`, `ph-token-1909` (không còn `/parent-news/list` từ màn PH). MỚI: `ph-mot-man-mot-nut-2109` (chốt chặn: đúng MỘT `.bnv-nut-chinh`, không chuỗi của tính năng đã gỡ, không `/parent-news`). Sinh lại `m3-tuong-thich.css` (−5 dòng).

## Mã chết còn lại → lô dọn sau 16:00 (KHÔNG xoá lúc này, còn test khoá)
`BangTinPhuHuynh.tsx`, `KhoiKhacPhuc3CheDo.tsx`, `ModalKhacPhucCauSai.tsx` (còn dùng ở hộp báo cáo HS/PH chế độ có giao bài), `TheBoNao` nhánh `ph`, `boNaoPh`/`sachBoNaoChoPhuHuynh` trong BangNhiemVu, `parentNewsApi` + `momReviewHtml` (mom-api.ts), `taiThongTinPhuHuynh().boNao`.
