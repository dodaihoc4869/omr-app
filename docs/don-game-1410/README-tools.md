# Soát công cụ còn nhắc mã Game đã gỡ · 14/10

Soát ban đầu chỉ đọc trên `/workspace/don-ma-sau-00-1410`, commit `1048c7b5`. Cập nhật 14/10: đã xóa riêng bốn CLI độc lập ở bảng đầu trên làn C1, sau khi quét lại caller; tám tệp gallery và các công cụ hỗn hợp bên dưới vẫn giữ. Không sửa `src/`, luật chấm, caller Three.js, ảnh hoặc bản build của root.

## Có thể bỏ độc lập

Bốn CLI sau chỉ điều khiển các màn Game đã ngừng. Quét tệp mã/cấu hình đang theo dõi: không caller ở `.github/`, `package.json`, test học tập hoặc công cụ khác. Các đoạn nhập/điều hướng dùng component/selector Game đã gỡ, không phải đường học tập hiện tại.

Trạng thái: **D · 4 tệp, 11.887 byte** (đo nội dung Git trước khi xóa). Quét lại cả tên có và không có đuôi `.mjs` trong `src`, `server`, `scripts`, `tests`, `.github`, `package.json`, cấu hình Vite/Vitest: **0 caller còn lại**. Tên trong tài liệu kiểm kê là bằng chứng lịch sử. Xóa CLI không ảnh hưởng các kiểm thử ảnh/evolution hiện tại: bộ sinh thumb và `dao-anh-nho` giữ trên leaf `62a7455f`.

| Tệp | Tham chiếu đã mất | Caller trong workflow/test học tập/package |
| --- | --- | --- |
| `scripts/do-bi-a-trang-suc.mjs` | dòng 6 mở `preview-bat-linh/games.html?game=shop`; dòng 8 nhập `/src/game/bi-a/ve-bi.ts` | 0 / 0 / 0 |
| `scripts/kiem-than-thu-2d-gallery.mjs` | dòng 5 nhập `/src/game/than-thu-v2/Spirit2D.tsx` | 0 / 0 / 0 |
| `scripts/kiem-learning-battle.mjs` | chỉ mở Game, tìm `.learning-battle`, thanh máu, chiêu thức và chốt trận | 0 / 0 / 0 |
| `scripts/kiem-evolution-v2.mjs` | dòng 16–30 mở `Mở game`, `Khám phá đảo`, `.spirit-hero`, `.battle-painted-spell`; xác thực là phiên Game cũ | 0 / 0 / 0 |

## Cụm gallery Game cần cắt dây ở công cụ hỗn hợp trước

Tám tệp này chỉ dựng/kiểm gallery Game. Không caller workflow/test học tập/package. Tuy nhiên `games.html` vẫn nằm trong danh sách đầu vào và kịch bản của các công cụ hỗn hợp; không xóa cả thư mục `preview-bat-linh`.

| Tệp | Tham chiếu / dây giữ |
| --- | --- |
| `scripts/preview-bat-linh/games.html` | gọi `games.tsx`; `vite.config.mjs:13` còn đầu vào `games`; `muc-luc.html:7,10` còn link; `trang.tsx:34` còn `moGame` |
| `scripts/preview-bat-linh/games.tsx` | dòng 5 nhập CSS Game đã gỡ; dòng 18–24 nhập `bieu-cam`, `chuong`, các trang xem Đảo/Cửa hàng/Đoàn/Bi-a đã gỡ |
| `scripts/preview-bat-linh/bieu-cam.tsx` | nhập `DoanHinh`/`XeLinhTam` đã gỡ; gallery vẫn dùng `BieuCamThu` hiện còn ở PH nên giữ module PH ấy |
| `scripts/preview-bat-linh/chuong.tsx` | nhập `DoanTungChuong`, `doan-core`, `doan-kieu`, CSS Đoàn và `phong-baloo` đã gỡ |
| `scripts/preview-bat-linh/ve-bi-baseline.ts` | dòng 6–7 nhập `bi-a/nguyen-to`, `bi-a/vat-ly` đã gỡ; chỉ `do-bi-a-trang-suc.mjs:8` dùng |
| `scripts/preview-bat-linh/check-games.mjs` | toàn bộ kịch bản gallery Đảo/Đoàn/Cửa hàng, gọi `games.html` |
| `scripts/preview-bat-linh/check-shop-luxury.mjs` | toàn bộ kịch bản Cửa hàng, gọi `games.html?game=shop` |
| `scripts/preview-bat-linh/chot-anh.mjs` | chỉ chụp Game Đảo/thần thú qua `games.html` |

Tổng kiểm kê ban đầu 12 ứng viên: **37.335 byte**; đã xóa bốn CLI **11.887 byte**, còn giữ tám tệp gallery **25.448 byte** chờ cắt dây hỗn hợp. Những tên chỉ có trong `docs/soat-app-1310/kiem-ke-ma-cu.json` là kiểm kê cũ, không phải caller thực thi.

Các dây cần thích nghi khi root bỏ gallery: `preview-bat-linh/{vite.config.mjs,muc-luc.html,trang.tsx,check.mjs,check-theme.mjs,check-bieu-cam.mjs}`. `check-bieu-cam.mjs` có kiểm **Câu đã làm** ở dòng 24, nên chỉ gỡ gallery/xe/trận và giữ phần học tập đó. `check.mjs`/`check-theme.mjs` còn PH, Tu luyện, đăng nhập; `teacher.html`/`teacher.tsx`/`check-teacher-modern.mjs` còn app thầy.

## Công cụ hỗn hợp đang gãy import · giữ phần học tập

| Công cụ | Chỗ gãy | Phần cần giữ |
| --- | --- | --- |
| `scripts/do-app-hs.mjs` + `do-app-hs/may-chu-gia.ts` | fixture dòng 5 nhập `shop/du-lieu-mau` đã gỡ; script dòng 219 SSR fixture trước mọi kịch bản nên cả đo mở app cũng gãy | khung đo CPU/mạng/heap, mở app, Tu luyện, Câu đã làm; cắt fixture/kịch bản Đảo–Đoàn–Shop |
| `scripts/do-may-yeu/{vite.config.mjs,trang-do.tsx}` + `do-may-yeu.mjs` | config dòng 21–25 có 4 đầu vào HTML Game đã gỡ; `trang-do.tsx:20` nhập `SanhBanDo`; CLI dòng 678–681 còn 4 đường Game | đo màn thi, HS, PH; giữ nhánh `man` sau khi bỏ Sảnh và thay fixture phù hợp |
| `scripts/preview-bat-linh/trang.tsx` | dòng 21 nhập `SanhBanDo` đã gỡ; dòng 221 còn dựng Sảnh | `CauDaLam`, `ManTuLuyen`, `StudentPortalScreen`, `ParentPortalScreen`, app PH hiện tại |
| `scripts/chup-tu-luyen/trang.tsx` | dòng 20 nhập `SanhBanDo` đã gỡ; dòng 195 còn nhánh Sảnh | Tu luyện và các kịch bản chọn nguồn/luyện đề; giữ toàn bộ công cụ chụp Tu luyện |
| `scripts/chup-omni-3/trang.tsx` | dòng 26–30 nhập Sảnh/Đảo/Đoàn; CSS/kiểu Đảo dòng 45–47 | phần thầy/PH/học tập; các fixture `gia/` còn được `chup-v2`/đợt 16 dùng |
| `scripts/chup-v2/trang.tsx` | dòng 32/45–58 nhập Sảnh/Đảo/Cửa hàng/phụ kiện/Đoàn/Đề thử đã gỡ | không xóa `gia/`: `chup-lan-l`, `chup-lan-m`, `chup-dot16-lan-b`, `kiem-vuot-hs`, `kiem-vuot-lam-bai` còn dùng dữ liệu học tập ở đây |
| `scripts/cat-anh-than-thu.mjs` + `tests/dao-anh-nho.test.ts` | còn 16 card/nguồn `combat` sau khi ảnh đã gỡ | đã có leaf riêng `62a7455f`: bỏ chỉ cards, giữ bộ sinh và kiểm **96 thumb**, 48 tọa độ/đảo ảnh, trần 60/12 KB; 6/6 kiểm liên quan xanh, import CLI chỉ đọc |

## Glob Vite dư ở commit 1048

Root đang sở hữu `vite.config.ts`. Có thể cắt tên thuần phần đã gỡ khỏi `globIgnores`: `Spirit3D`; `TongQuanScreen,DaoThanThu,DoanHoTong,Game,Dao2,DoanHinh`; `pk-{cl,da,hq,vd}-*`; `GiaoChienDich,ManShopThat`; `BiaGame,TrongAi,ngang,chu-het-luot`; `SanhV2,ban-duyet-v2`; `ThanThuV2,tran-v2,may-chu-that`. `baloo-2-*` chỉ còn comment/font Game; kiểm dist và import font trước khi cắt phần đó. **Giữ** các tên học tập/thầy cùng các glob hỗn hợp, `ban-do-3d-three`, và `than-thu-v2/**` vì ảnh đăng nhập/màn chiếu còn dùng.

## Yêu cầu ảnh trên bản build thật

Chạy Chromium hệ thống trên dist của `1048c7b5`, dữ liệu giả cục bộ, mạng ngoài bị chặn; mở GV/HS/PH 360×800 sáng, rồi mở lại màn đăng nhập ba vai. Kết quả `/tmp/c1-runtime-assets/matrix.json`: **0 lỗi JS, 0 tệp tĩnh 404, 15 yêu cầu ảnh (8 đường duy nhất), 0 đường thuộc 46 ảnh đã gỡ**. Ảnh thú/nền đã thấy: `/than-thu-v2/nho/thu-1-3.webp`, `/bat-linh/canh-dao-nho.webp`, đều giữ.

Đây là cổng ảnh/mở app ở một khổ sáng. Fixture tạm còn thiếu 4 lệnh chỉ đọc `/hs/buoi-hoc`, `/hs/nhip-hoc`, `/hs/chua-cau-sai/co`, `/ph/ke-hoach`; không dùng lượt này để kết luận dữ liệu báo cáo đầy đủ hoặc tốc độ Worker. Cổng đầy đủ 18 tổ hợp/SW do làn teacher chạy. 96 tên thumb còn dùng đều đã được test kiểm tồn tại và dung lượng; không cắt hay ghi lại ảnh trong lượt sửa này.
