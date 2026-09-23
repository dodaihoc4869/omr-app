# ROUTE-MAPPING — bản đồ đường gọi thật (P00/P01)

Nguồn: `server/src/index.ts` (3371 dòng) tại HEAD `539cd99`. Bảng dưới chỉ liệt kê đường **đang chạy**
trong worker (khối `if (p === ...)` trong `fetch`). Cột "Đọc/ghi" đánh dấu đường có ảnh hưởng tới
câu hỏi / điểm / EXP / giữ chỗ — đây là phạm vi CNH-1.0 phải rà.

## 1. Cổng vào ba app

| Method | Path | Handler | Ghi chú |
|---|---|---|---|
| GET | `/` `/hs` `/hoc-sinh` `/hocsinh` | HTML app học sinh | SPA |
| GET | `/ph` `/phu-huynh` `/phuhuynh` | HTML app phụ huynh | SPA |
| GET | `/gv` `/giaovien` | HTML app giáo viên | SPA |
| GET | `/khoe` | health | không cần auth |
| GET | `/de/:maDe` | `layDe(env, …)` | đọc đề từ R2; công khai có mã |
| GET | `/phieu/:ma` | `layPhieuR2(env, …)` | đọc phiếu, CÔNG KHAI (đặt trước mọi cổng bí mật) |
| GET | `/t/…` `/d/…` | redirect sang Pages | — |

## 2. Đường thi (ca thi) — chấm điểm

| Method | Path | Handler | Đọc/ghi |
|---|---|---|---|
| POST | `/vao-thi` | `vaoThi(env,b)` | ** điểm** |
| POST | `/luu-tam` | `luuTam(env,b)` | lưu nháp |
| POST | `/nop` | `nop(env,b)` | **điểm** |
| POST | `/trang-thai` | `dayTrangThai(env,b)` | trạng thái ca |
| POST | `/phong-cho` | `ghiPhongCho(env,b)` | giữ chỗ ca |
| GET | `/trang-thai` `/phong-cho` `/ten-theo-sbd` | đọc trạng thái | — |
| POST | `/ca/day` | `dayCa(env,b)` | đẩy ca |
| POST | `/ca/xac-nhan` | `xacNhanCa(…)` | — |
| POST | `/danh-sach/day` | `dayDanhSach(env,b)` | — |
| POST | `/goi` | `goiCu(req,env,b)` | kênh cũ (Apps Script) — P06 phải nối |

Chấm ca thi thật: `src/engine/score.ts` (`scoreStudent`, `scorePhanIII` dùng `khopPhanIII`).
Sửa điểm ca thi: `server/src/cham-lai-ca.ts` (dùng `khopPhanIII` + `scoreStudent`).

## 3. Đường chọn câu / làm bài / nộp — học sinh

| Method | Path | Handler | Đọc/ghi |
|---|---|---|---|
| POST | `/hs/dang-nhap` | đăng nhập | — |
| POST | `/hs/ke-hoach-ngay` | `hsKeHoachNgay` (`server/src/ke-hoach-ngay.ts`, `ke-hoach-ngay-d1.ts`) | **chọn câu, giữ chỗ** |
| POST | `/hs/cau-theo-qid` | `hsCauTheoQid` (`server/src/cau-theo-qid.ts`) | **nội dung câu** |
| POST | `/hs/on-lai/nop` | `hsOnLaiNop` (`server/src/on-lai-nop.ts` → `chamMotCau`) | **điểm, EXP** |
| POST | `/hs/thu-thach-hom-nay` `/nop` | `server/src/thu-thach-rieng.ts` | **chọn câu, điểm** |
| POST | `/btvn/nop` `/btvn/xong-lo` `/btvn/cua-em` | `server/src/btvn-*` | **điểm, EXP** |
| POST | `/hs/thoi-gian-hoc` | `hsThoiGianHoc` | thời gian học |
| POST | `/hs/thi-dua-hom-nay` | `hsThiDuaHomNay` | — |
| POST | `/hs/lich-su` `/hs/cau-sai` `/hs/cau-da-thi` `/hs/btvn` | đọc lịch sử | — |
| POST | `/hs/ca-dang-mo` | `hsCaDangMo` | — |

## 4. Game, Đoàn, luyện đề

| Method | Path | Handler | Đọc/ghi |
|---|---|---|---|
| POST | `/game-v2/*` | `server/src/game-v2.ts` → `game-v2-ho-so.ts`, `game-v2-bank.ts`, `game-v2-luot.ts`, `game-v2-doan*.ts`, `game-v2-escort.ts`, `game-v2-hap-thu.ts`, `game-v2-shop.ts`, `game-v2-academic.ts` | **chọn câu, EXP, kinh tế** |
| POST | `/luyen-de/*` | `server/src/luyen-de.ts` | **chọn đề** |
| POST | `/game-v2-parent` | `server/src/game-v2-*.ts` | — |
| POST | `/game-v2-admin` | `adminGame(env,b)` | — |
| POST | `/vo-dai/*` | `server/src/vo-dai.ts` | game võ đài |
| POST | `/mom/*` | `server/src/mom.ts` (`gradeMom` → `soKhopSo`) | **điểm** |

## 5. Phụ huynh / giáo viên / tin

| Method | Path | Handler |
|---|---|---|
| POST | `/parent-news/*`, `/student-news/*`, `/notifications/*` | `server/src/parent-news.ts`, `notifications.ts` |
| POST | `/ph/xac-dinh` `/ph/ke-hoach` `/ph/giao-them` `/ph/tat-ca-ve-con` `/ph/chi-tiet-cau-ve-con` `/ph/thoi-gian-hoc` `/ph/canh-bao/xem` `/ph/cap-ma` `/ph/dem-truy-cap` | `server/src/ph-*.ts` |
| POST | `/gv/ke-hoach-em` `/gv/chua-nop` `/gv/can-giup` `/gv/vinh-danh-ngay` `/gv/tim-em` `/gv/em-toan-canh` `/gv/lich-su-cau-cua-em` `/gv/bao-cao-ca` `/gv/bao-cao-ca-em` `/gv/bang-tin` `/gv/bang-tin-song` `/gv/lop` `/gv/doi-lop-em` `/gv/buoi-chua-de-xuat` `/gv/nhac-tu-dong` `/gv/tu-dong-cac-viec` | `server/src/gv-*.ts`, `teacher-news.ts` |
| POST | `/ke-hoach/hom-nay-thay` `/ke-hoach/chay-ca-lop` `/ke-hoach/do-phu-phuc-vu` | `server/src/hom-nay-thay.ts`, `ke-hoach-ngay*.ts` |
| POST | `/ho-so/nap-lai` `/ho-so/kiem-cheo` `/ho-so/xem` `/ho-so/do-phu-dang` `/ho-so/dung-lai` | `server/src/su-kien-nap-lai.ts`, `ho-so-*.ts` |
| POST | `/teacher-news` `/daily-honors` `/presence` | `server/src/teacher-news.ts`, `honors.ts`, `danh-sach.ts` |
| POST | `/reset/dry-run` `/reset/chay-tiep` `/reset/do-gioi-han` | `server/src/reset-toan-app.ts` |

## 6. Bảng "một việc → nhiều chỗ đang chạy" (dùng cho P01, P06)

| Việc | Nơi chạy thật (baseline) |
|---|---|
| Chuẩn hóa + quyết định đúng/sai câu Phần III | `src/lib/cham-so.ts` (`soKhopSo`, `khopPhanIII`) — dùng bởi `src/engine/score.ts`, `server/src/btvn-grading.ts`, `server/src/cham-lai-ca.ts`, `server/src/mom.ts`, `src/game/than-thu-v2/core.ts`, `src/lib/html-phieu.ts` (bản chép), `src/lib/chi-tiet-cau.ts`, `src/lib/exam-grade.ts`, `src/components/TheCau.tsx`, `src/lib/cau-hinh-nop-khac-phuc.ts` (qua `normalizeNumericAnswer`) |
| Chấm Phần I/II | `src/engine/score.ts` (`scorePhanI`, `scorePhanII`), `server/src/btvn-grading.ts` (`isAnswerCorrect`) |
| Chọn câu | `server/src/ke-hoach-ngay.ts`, `ke-hoach-ngay-d1.ts`, `game-v2-bank.ts`, `parent-news-chon-cau.ts`, `btvn-nang-do-d1.ts`, `thu-thach-rieng.ts`, `luyen-de.ts`, `src/game/than-thu-v2/core.ts` |
| Ghi EXP / kinh tế | `server/src/exp-*.ts`, `game-v2-hap-thu.ts`, `game-v2-shop.ts`, `game-v2-academic.ts`, `src/lib/hap-thu-ngay.ts`, `src/lib/kinh-te-game.ts`, `src/game/than-thu-hoa-hoc/kinh-nghiem.ts` |
| Sổ học / hồ sơ | `server/src/su-kien-hoc.ts`, `ho-so-nam-kt.ts`, `game-v2-ho-so.ts`, `src/game/than-thu-v2/core.ts` |
| Lịch ôn | `server/src/lich-on-fsrs.ts` |

Ghi chú: các đường **không** được coi là production: `scripts/ban-tai-gia/` (bắn tải),
`.dist-old-*` (build cũ), `.claude/worktrees/*` (worktree lạnh). Không sửa mã chết như thể là đường production.
