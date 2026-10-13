# Soát công cụ còn nhắc mã Game đã gỡ · 14/10

Soát ban đầu chỉ đọc trên `/workspace/don-ma-sau-00-1410`, commit `1048c7b5`. Cập nhật 14/10: đã xóa bốn CLI độc lập và tám tệp gallery Game trên làn C1, sau khi cắt dây và quét lại caller; các công cụ hỗn hợp học tập còn lại vẫn giữ. Không sửa `src/`, luật chấm, caller Three.js, ảnh hoặc bản build của root.

## Có thể bỏ độc lập

Bốn CLI sau chỉ điều khiển các màn Game đã ngừng. Quét tệp mã/cấu hình đang theo dõi: không caller ở `.github/`, `package.json`, test học tập hoặc công cụ khác. Các đoạn nhập/điều hướng dùng component/selector Game đã gỡ, không phải đường học tập hiện tại.

Trạng thái: **D · 4 tệp, 11.887 byte** (đo nội dung Git trước khi xóa). Quét lại cả tên có và không có đuôi `.mjs` trong `src`, `server`, `scripts`, `tests`, `.github`, `package.json`, cấu hình Vite/Vitest: **0 caller còn lại**. Tên trong tài liệu kiểm kê là bằng chứng lịch sử. Xóa CLI không ảnh hưởng các kiểm thử ảnh/evolution hiện tại: bộ sinh thumb và `dao-anh-nho` giữ trên leaf `62a7455f`.

| Tệp | Tham chiếu đã mất | Caller trong workflow/test học tập/package |
| --- | --- | --- |
| `scripts/do-bi-a-trang-suc.mjs` | dòng 6 mở `preview-bat-linh/games.html?game=shop`; dòng 8 nhập `/src/game/bi-a/ve-bi.ts` | 0 / 0 / 0 |
| `scripts/kiem-than-thu-2d-gallery.mjs` | dòng 5 nhập `/src/game/than-thu-v2/Spirit2D.tsx` | 0 / 0 / 0 |
| `scripts/kiem-learning-battle.mjs` | chỉ mở Game, tìm `.learning-battle`, thanh máu, chiêu thức và chốt trận | 0 / 0 / 0 |
| `scripts/kiem-evolution-v2.mjs` | dòng 16–30 mở `Mở game`, `Khám phá đảo`, `.spirit-hero`, `.battle-painted-spell`; xác thực là phiên Game cũ | 0 / 0 / 0 |

## Gallery Game đã cắt dây và xóa

Tám tệp này chỉ dựng/kiểm gallery Game. Đã cắt đầu vào Vite, mục lục, điều hướng và kịch bản Game; quét mã/cấu hình còn lại cho cả tám đường dẫn cho **0 caller**. Trạng thái **D · 8 tệp, 25.448 byte**. Giữ thư mục preview với học tập hiện tại, PH, Tu luyện, Câu đã làm và thầy; `BieuCamThu` cùng atlas đăng nhập/PH giữ nguyên.

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

Tổng kiểm kê ban đầu 12 ứng viên: **37.335 byte**; đã xóa bốn CLI **11.887 byte**, đã cắt dây và xóa tám tệp gallery **25.448 byte**. Những tên chỉ có trong `docs/soat-app-1310/kiem-ke-ma-cu.json` là kiểm kê cũ, không phải caller thực thi.

Các dây đã thích nghi khi bỏ gallery: `preview-bat-linh/{vite.config.mjs,muc-luc.html,trang.tsx,check.mjs,check-theme.mjs,check-bieu-cam.mjs}`. `check-bieu-cam.mjs` có kiểm **Câu đã làm** ở dòng 24, nên chỉ gỡ gallery/xe/trận và giữ phần học tập đó. `check.mjs`/`check-theme.mjs` còn PH, Tu luyện, đăng nhập; `teacher.html`/`teacher.tsx`/`check-teacher-modern.mjs` còn app thầy.

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

## Cổng công cụ sau cắt dây

Biên dịch riêng hai entry preview học tập/thầy bằng Vite, `publicDir:false`, đầu ra `/tmp/c1-preview-1410-compile`: đạt (6 giây); không ghi `dist` hoặc ảnh nguồn. Chromium hệ thống, chặn mạng ngoài origin: tám màn HS/PH và màn thầy đều mở được, **0 lỗi JS, 0 yêu cầu tĩnh bị thiếu**; thực thi Ôn & sửa → Tu luyện. Báo cáo `/tmp/c1-preview-smoke.json`. Bộ kiểm viewport giữ 30 trường hợp sáng/tối/điện thoại/ngang/máy tính, đều 0 JS/ảnh hỏng/tràn; lượt kiểm luồng riêng `/tmp/c1-preview-flows.mjs` đạt cả hai luồng Tu luyện (rút/nộp/lời giải/tổng hợp) và PH (các phần hiện tại/nhận xét/báo cáo ca công bố). Cấu hình preview cho phép đọc đúng thư mục dependency thực khi worktree dùng symlink `node_modules`.

Fixture `do-app-hs` đã bỏ dependency Shop và các nhánh Đảo/Đoàn/Cửa hàng/Rương trong kịch bản đo; giữ phần đo mở đầu/mở lại, CPU/mạng/khung/heap, Câu đã làm, Tu luyện. Đã kiểm nhập Vite SSR, 11 lệnh học tập, câu rút không có đáp án, câu đã làm có lời giải, đăng nhập NDJSON và lệnh Shop bị từ chối. Chưa chạy benchmark Slow 4G/heap dài trong lượt sửa này.

Quét TypeScript AST tất cả import/export/dynamic import literal tương đối trong `scripts` sau sửa: đã khép **26 import ở sáu tệp, hiện 0 unresolved trong 186 tệp script**; đường dẫn và dòng nằm trong `C1-tools-imports-con-lai.json`. JSON giữ danh sách26 import trước sửa và trạng thái hiện tại0; không xóa công cụ hỗn hợp hoặc fixture học tập để che lỗi. Đợt16 chỉ bỏ một import CSS Game; giữ các cảnh làm bài/ôn/luyện đề/Câu đã làm/thi. `kiem-tran-giao-dien-2309.mjs` là hỗn hợp: giữ6 kind và mọi assert cũ, thay riêng renderer HS từ Bảng nhiệm vụ sang HocTapHomNay.

## Khép công cụ hỗn hợp và lỗi tên dài

- `269fdc4c`: chụp Tu luyện giữ toàn bộ rút/nộp/lời giải/tổng hợp; Sảnh cũ đổi HocTapHomNay. Compile1,46s; Chromium mở Ôn & sửa → Tu luyện → Về Hôm nay đạt.
- `47067468`: đo máy yếu bỏ4 đầu vào/route Game; giữ HS/PH/thi/phòng chờ/thầy/máy chiếu và khung đo. Compile1,57s; hai màn học tập và marker đo `#xong` đạt.
- `a175cbc7`: OMNI/V2 chỉ bỏ cảnh và fixture nội bộ Game; giữ nguyên thư mục `gia/`, các khối HS12/nhịp/hồ sơ/chữa/làm bài/thầy/PH. Compile1,84s/1s. Chụp thật V2 Hôm nay sáng+tối và OMNI Học tập:0JS/tràn, JPG31–33KB. Prefix Game đã nghỉ bị từ chối rõ, không tạo ảnh thay cảnh.
- `4eca5ea0`: giữ Đợt16 và bộ kiểm tràn hỗn hợp. Compile Đợt16 đạt0,73s; Câu đã làm3khổ đạt0tràn/đích nhỏ. Bộ kiểm tràn vẫn kiểm màn hiện tại với nội dung dài.
- Bộ kiểm tràn đã bắt tên/lớp một từ dài: khổ390 có `scrollWidth=3567`, textRange ra khỏi màn. Root giao sửa riêng `hoc-tap.css`: chỉ `min-width:0` ở khối tiêu đề và `overflow-wrap:anywhere` cho tên/nhãn lớp. Leaf `61f2c034`, bằng chứng `C1-ten-dai-chromium.json`:16/16 tổ hợp320/390/768/1280 ×100/115% ×sáng/tối đạt; tiêu đề giữ đủ245ký tự, không cắt/che chữ, không đổi màu/phông. Chỉ chạy kindHS liên quan CSS, không tuyên bố toàn bộ các kind khác đã đạt.

Lệnh compile luôn là `vite.build({configFile,publicDir:false,build:{outDir:'/tmp/...'}})` với từng config riêng, không chạy đồng thời. Không sửa config chính, phát hành, dữ liệu D1/R2, luật chấm hay ảnh nguồn. Bộ preview nguyên `check.mjs` đã chạy lại đạt **32/32** viewport/luồng sau sửa; log `/tmp/c1-preview-final.log`. Graph0 là các import/export/dynamic-import **literal** tương đối và `/src/` trong script; các công cụ đo heap dài/Slow4G và toàn bộ gallery học tập nhiều cảnh chưa chạy trong lượt dọn này.
