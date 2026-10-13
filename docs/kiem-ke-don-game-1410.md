# Kiểm kê dọn code Đảo · Đoàn · Bi-a · chiến dịch cũ (13/10 23h, chỉ đọc)

Thầy 13/10 22:2x: "sau 00h bạn phải tối ưu chuyên sâu tốc độ ở mọi chỗ, xóa tất cả các code không liên quan, đảo đoàn, bia, chiến dịch cũ các thứ … Cái này phải làm bằng được" · "bạn làm việc này với thằng codex nữa nhé".
Cách lập: lần mọi import trong `src/`, `server/src`, `functions/`, `tests/`, xét phần còn với tới từ `src/main.tsx` và `server/src/index.ts` khi cắt bốn phần. Số dòng theo `wc -l`.
CHỈ xoá code + ảnh. Không xoá bảng/dòng D1, không đổi schema.

**Ba điều đổi kế hoạch**
- Game học sinh ĐÃ rút khỏi app: `src/screens/StudentPortalScreen.tsx:278` chuyển tab `thanthu`/`bia` về `hoctap`; sảnh đảo (`hoa2/SanhBanDo`, `ban-duyet-v2/SanhV2`) không còn ai gắn. Dây cuối: nạp lười ở `src/components/hoa2/man-sanh-luoi.ts:23`.
- "Bia" = game **Bi-a Phản Ứng** (Durable Object `BAN_BIA`). Không có "bắn bia".
- Gói 7 tạo chiến dịch qua CÙNG lệnh máy chủ (`server/src/bai-da-day.ts:364,587,600` gọi `/gv/chien-dich` `suc-chua`/`tao`/`huy`) ⇒ chỉ gỡ GIAO DIỆN chiến dịch cũ + lệnh sửa; phần máy chủ chiến dịch giữ.

## A. Tệp xoá được · đường máy chủ · chỗ gắn

**1. Đảo (thần thú, đảo, cửa hàng, Linh Tâm / đấu trường)**
- `src/game/than-thu-v2/`: `Game, LearningBattle, QuaiSonThuy, ProgressChart, Spirit2D, SpiritArt, BieuCamThu, EscortRoom/Guide/Question, LinhTam, ImmortalShield` (.tsx), `battle-audio.ts`, `dau-trang-cao.ts`, `escort-core.ts`, 7 tệp CSS `game, escort, learning-battle, progress-chart, spirit-2d, thu-quai, bieu-cam-thu` (767 dòng); `dao/**` trừ `dao/anh.ts` (1589); `dao2/**` (2122); `shop/**` (4053); `phu-kien/**` (1702).
- Sảnh đảo: `hoa2/{SanhBanDo,CanhSanh3D,HopDoiTen,hieu-ung-sanh,phong-baloo,sanh-ban-do.css}`, `ban-duyet-v2/*`, `bat-linh/{BanDoHanhTrinh,ban-do-hanh-trinh.css,DongHanh}` (6208).
- Mồ côi sau khi gỡ: `lib/phu-kien-danh-muc.ts`, `lib/toan-man-hinh-game.ts`, `components/NutToanManHinh.tsx`+`.css`, `styles/ban-duyet-v2.css`, `components/xem-thu/phu-kien.*`.
- Máy chủ: `game-v2-shop.ts` (322), `game-v2-escort.ts` (57), `game-v2-room.ts` (58); tuỳ chọn `tron-than-thu.ts`, `goi-cu.ts:3715+` (`/hs/than-thu` không còn máy gọi).
- `index.ts`: 77, 3689-3700 (`shopBat`), 3254-3255 + 3648-3649 (đồng bộ thú v1), 3610 (`/game-v2-parent`). Nhánh chỉ của Đảo trong `game-v2.ts` (qua `/game-v2/*`): 432-433, 451, 459-473, 482-542, 546, 717-718, 769-773, 783-788.
- Chỗ gắn: `man-sanh-luoi.ts:23,45-88`; `StudentPortalScreen.tsx:200,278`; `BangTinPhuHuynh.tsx:589-616` (ô thú); `ParentPortalScreen.tsx:1` (đổi import sang `bat-linh/LoiChao`); `main.tsx:45` (`game-toan-bo.css`).

**2. Đoàn Hộ Tống**
- `Doan{Cau,Hinh,HoTong,KetChang,Sanh,TiepSuc,Tran,TungChuong}.tsx`, `doan-core.ts`, `doan-khoan-exp.ts`, `doan-kieu.ts`, `doan.css`, `doan-xem-thu.*`, `XeLinhTam.tsx`, `NutTuTin.tsx`, `anh-san-sang.ts`, `chu-het-luot.ts`, `learning-battle.ts` (2445); `doan2/**` (994); `lib/giay-co-so.ts`.
- Máy chủ: `game-v2-doan{,-an,-exp,-mua,-the}.ts` (1345). `index.ts:22,155-172`; `game-v2.ts:39,41,217-270 (startDoanKhoLop),349,434,478-480,549-552,625,639`; `game-v2-reports.ts:3,18` (`doan-bao-cao`); `hom-nay-thay.ts:11,312-320`.

**3. Bi-a**
- `src/game/bi-a/**` (29 tệp, 5190); `chien-dich/CongTacBia.tsx`. Chỗ gắn `CaiDatScreen.tsx:17,101`; `BiaGame` không còn ai gắn.
- Máy chủ: `bi-a-phong.ts` (424), `bi-a-ve.ts` (46), `bi-a.ts` (725 — CHỈ sau khi dời `coCaDangMo`, mục B). `index.ts:5,4044,4049`; `game-v2.ts:51,280,361,368,440-443,450`; `srs2-gv.ts:15,32-33`.
- `server/wrangler.toml:43-49` (`BAN_BIA` → `BanBiA`, migration `bia-v1`): KHÔNG xoá lớp (xoá lớp DO = xoá dữ liệu DO). Giữ ràng buộc, thay `BanBiA` bằng lớp rỗng trả 410.

**4. Chiến dịch cũ**
- `chien-dich/{GiaoChienDich,DsChienDichDaGiao,SuaChienDich,HopChon,DongHoSucChua,sua-chien-dich.css,NutGiaoTheoBai}`, `lib/tom-tat-sua-chien-dich.ts`, `screens/TongQuanScreen.tsx` (đã không gắn).
- Máy chủ: `srs2-sua.ts` (267), `khoi-phuc-chien-dich-0810.ts` (68). `index.ts:109,3851-3852` (`/gv/chien-dich/sua`), 2 + 3386 (cron một lần).
- Chỗ gắn: `ChienDichScreen.tsx:11-12,20,29-30,37-79`; `CaiDatScreen.tsx:39-41,~105-118`; `ExamMonitorScreen.tsx:12,1346,1844,1942-1950`; `day-hoc/BaiHomNay.tsx:87,438-444,564,601,731-743` (nút "Sửa em" = thêm/bớt em kiểu cũ).
- `ThanhBenTrai.tsx:62` `chiendich` là mục Hành trình — **GIỮ**.

## B. DÙNG CHUNG — KHÔNG xoá
- `src/game/than-thu-v2/core.ts`: `Question, publicQuestion, grade, advance, allowed, chooseLuotMoi, luotHomNay, PETS` dùng ở học tập, Gói 7, kiểm tra cá nhân, OMNI, thi đua. Chỉ phần đấu trường (`Unit, Arena, newArena, arenaAction, arenaPower`) là của Đảo.
- Tệp game nhỏ giữ: `evolution.ts`, `anh-webp.ts`, `dao/anh.ts` (ảnh đăng nhập `LoiChao.tsx:2`, thú trên màn chiếu `GoiLenBangScreen.tsx:1207-1215`, `BangVinhDanh`); `academic-sync.ts` (đồng bộ EXP, `StudentPortalScreen.tsx:20,270,616`); `loi-het-tran.ts`, `shields.ts`, `ly-do-thuong.ts`, `pet-name.ts`; `Reports.tsx` (`NganHangDeScreen:466` sửa `game_v2_scope` — Gói 7 + kiểm tra cá nhân đọc); `src/game/than-thu-hoa-hoc/*` (bảng EXP).
- `game-v2.ts` giữ: `hoc-tap-*` (395-427), `sync`, `answer` (619-756, `ManLamBaiTap.tsx:110` gọi), `start` dự phòng (416, 543-605), `startLuotMoi`, `complete`/`resume`, `academic-sync`, `Profile`/`loadProfile`.
- `srs2-game.ts` dùng chung: `startDao2` (của `hoc-tap-start`), `napLuot`, `napCau`, `goiYCho`, `hoa2Action`→`sanh2`, `cauDaLam`, `cauChiTiet`, `thuSucThem`. Chỉ của phần xoá: `startDao2CoVe`, `startDoan2`, `moRuong`, hàm Bi-a 172-238 (`startDao2` gọi `nhaCauBiaChoDaoDoan` dòng 297 ⇒ rút gọn lời gọi, không xoá `startDao2`).
- `srs2-d1.ts` dùng chung toàn bộ (`dao`/`doan` ở đây là danh sách câu mới / câu ôn của kế hoạch ngày).
- `srs2-gv.ts` giữ `co-doc/co-luu`, `danh-sach`, `bang`, `buoi-chua`, `noi-dung-cau`, `chua-xong`, `ds-em`, `tao/suc-chua/huy/dong`, `tachMaTo`; chỉ `rai-deu`, `bia-co-*` là phần xoá.
- Máy chủ giữ nguyên tệp: `game-v2-bank`, `-auth`, `-luot`, `-reports` (`readGameScope`), `-hap-thu`, `-academic`, `-ho-so`, `-cau-moi`, `thu-hoi-chien-dich`, `noi-dung-cau-chien-dich`.
- **Dời `coCaDangMo` TRƯỚC** (`bi-a.ts:109-126`): `chua-cau-sai.ts:4`, `chua-cau-sai-chieu.ts:7`, `loi-giai.ts:21`, `thang-tu-go.ts:17`, `tu-luyen.ts:23` đang dùng.
- Phía app dùng chung: `chien-dich/api.ts` (chỉ `taoChienDich, tinhSucChua, huyChienDich, doiRaiDeu, danhSachThongKe, *Sua*` là của phần cũ), `ChonEmGiao`, `nguon-giao`, `LenBangChienDich`, `BangChienDich`, `BuoiChua`, `HanhTrinhV2`, `HoSoLamCauEm`, `BangGoi7`, `co-hoa2`, `tinh`, `ngay`, `chien-dich.css`, `hoa2/api.ts`, `man-sanh-luoi.ts`.

## C. Test (1.203 tệp)
- 55 tệp CHỈ khoá phần xoá (xoá theo): `bi-a-{am-thanh,dieu-khien-3009,gay,ket-noi,lan-that-3009,luat,man-choi,mat-than-tra-loi,muot,ngang,sanh-it-cau-3009,tran,vat-ly,ve-vung-ban-3009}.*`; `dao-{luot-ngay,tham-hiem,than-thu-vo}*`; `dao2-*` trừ `loi-giai`, `man-dau-tui-do`; `doan-{core,exp-may-chu,khoan-exp,sanh-hep,sanh-nut-khoa,thoi-gian-doc,tran-khong-nhay}*`; `doan2-{bo-cuc-ngang,bua-tro-giang,danh-tiep,gach-phuong-an,phu,thang-cau-ha}*`; `escort-{context-menu,core}*`; `shop-{bo-cuc,cua-vao-bo-cuc,khoa-nguon,logic,man}*`; `phu-kien-{dat-do*,mac-do*}`; `learning-battle`, `chu-het-luot-2109`, `game-bo-nut-toan-man-hinh-2109`, `ghim-khung-tran-2109`, `hap-thu-man-2109`, `kinh-te-ui-2309`, `omni-3-doan-ket-qua-0510`; `scripts/do-bia/may-chu.do.test.ts`.
- 130 tệp chạm cả hai — SỬA, không xoá: `bi-a-{may-chu,cau-da-lam,giu-cau-3009,rai-deu-3009,sanh-online}`, `doan-{may-chu,mua,het-cau-2809,an-thach,cho-tiep-2809,rut-cau-moi-2109}`, `shop-phu-kien-may-chu-2109`, `than-thu-v2`, `tran-ngay-game-2109`, `game-pham-vi-rut-cau-2309`, `cau-ket-ruong-3009`, `dao-bao-nham-ca-2909`, `sua-chien-dich-*`, `khoi-phuc-chien-dich-0810`, `chien-dich-{giao,giao-chon-em,dong-ho-suc-chua,da-giao,rai-deu}*`; phần còn lại chỉ giả `DongHanh`/`Game` qua màn cổng ⇒ dọn bản giả.

## D. Ảnh chỉ của phần xoá (~47 MB)
- `public/than-thu-v2/spells` (24 MB), `public/than-thu-v2/combat` (19 MB, đã không ai dùng); `public/bat-linh/{ban-do-dao*,canh-ho-tong*,quai-son-thuy,xe-linh-tam,bieu-cam-1,bieu-cam-2}.webp` (3,4 MB); `public/than-thu-v2/nho/the-*.webp` (992 KB).
- GIỮ: `nho/thu-*` (ảnh đăng nhập `vite.config.ts:94`, màn chiếu), `evolution-*-cutout.*` (`BangVinhDanh`), `bat-linh/canh-dao*` (nền đăng nhập `bat-linh.css:15,87`).

## E. Bảng D1 chỉ phần xoá dùng (GIỮ NGUYÊN, không xoá)
- Đoàn: `doan_chang, doan_luot, doan_tiep_suc, doan_trum_cau, doan_trum_lop, doan_ve_so` (`doan_luot` còn được `hom-nay-thay.ts` đọc). Bi-a: `bi_a_van, bi_a_ghe, bi_a_diem_ban, bi_a_moi, bi_a_co_mat`. Đảo: `phu_kien_so_huu, phu_kien_dang_mac, ruong_bat_linh` (`srs2-d1.ts:1777` đọc), `game_v2_room`. Chiến dịch cũ: `chien_dich_sua`.

## F. Chia làn
- **Codex**: phía app (`src/`, `public/`, test giao diện) — mục C1, C2, C3 trong `docs/viec-giao-codex.md`.
- **Claude**: máy chủ (`server/`, test máy chủ): dời `coCaDangMo`, gỡ đường + tệp Đảo/Đoàn/Bi-a, lớp rỗng `BanBiA`, rút gọn `game-v2.ts`/`srs2-game.ts`/`srs2-gv.ts`; `srs2-sua.ts` + `/gv/chien-dich/sua` xoá SAU khi C3 của Codex gộp (nút "Sửa em" cũ còn gọi).
