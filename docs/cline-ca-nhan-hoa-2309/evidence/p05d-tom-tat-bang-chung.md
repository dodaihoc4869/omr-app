# Bằng chứng P04 lát cắt 3 + P05 lát cắt 4 — NỐI DỮ LIỆU THẬT VÀO ĐIỂM §7.2 VÀ LUẬT LẶP

Ngày chạy: 2026-09-23 (20:34–20:40 +07:00).
`sourceFingerprint`: `0c3ad9d0ac426997fc247cc3237a2c24b54e48080a4a1f509f4af5acd8b90cdb`

## Lệnh đã chạy

| # | Lệnh | Exit | Kết quả | Artifact (sha256) |
|---|---|---|---|---|
| 1 | `vitest run tests/cnh-1-0-bo-chon-that.test.ts` | 0 | **9 PASS** (điểm §7.2 + luật lặp trên D1 thật) | `p05d-vitest-bo-chon-that.log` — `0dd9cd6dfe6bac154d9a8c543f1d544b626f7c765d0d2701e80e39c7dd82570c` |
| 2 | `vitest run tests/cnh-1-0-ngan-sach-luot-t09.test.ts` | 0 | **5 PASS** (end-to-end qua Worker thật) | `p05d-vitest-t09.log` — `9b5607f281ae146e341291120def4eb3dc471049f236d36162d7070baabf4990` |
| 3 | nhóm (cnh-1-0, game, tran-ngay, doan, ke-hoach, lich-on, ho-so, chong-lap) | 0 | 52 tệp · **711 PASS / 0 đỏ** | `p05d-vitest-nhom.log` — `9d788527d90e6548b4a99437ecd6674b6405cafc8f6995082b7900e61b899e9d` |
| 4 | `tsc -b` + `tsc -p server/tsconfig.json --noEmit` | 0 / 0 | 0 lỗi | — |
| 5 | chạy LẠI T05/T06 + T32 theo fingerprint mới | 0 | 21 + 6 PASS | `p05d-vitest-t05-t06.log` — `b283cc79f3288f9a7b2f149a1dea365159cddf57af5dc4279afabdcc63017b09` · `p05d-vitest-t32.log` — `f41324469e6712dad6225b1c920867512b6a9f731e375c66c0c4497362c3cf99` |

## Đã nối vào đường thật (không còn "mọi câu cùng điểm")

`server/src/bo-chon-that.ts` (mới) đọc **dữ liệu thật** rồi đưa vào `chamDiem` §7.2:
- **`docHoSoCau`**: `nam_kt_cau` của đúng các câu ứng viên → `repairNeed` thật (can_day_lai ⇒ 1; moi_sai ⇒ practicing ⇒ 1; da_khac_phuc ⇒ 0,5).
- **`mucTheoKyNangCuaEm`**: mức đang luyện từ **bản dựng P03** (`skill_snapshot`) → `fit` thật (0,6/0,8/1 theo độ lệch).
- **mốc ôn** từ `masteryTheoHoSo` (hồ sơ/FSRS) → `reviewNeed` thật (0 khi chưa đến hạn).
- **`locTheoLuatLap`** (P04): chặn `content_group` đã có kết quả **hôm nay** — kể cả **bản sao khác qid** — và áp trần câu/lượt.
- Cả **hai đường phát câu của game** dùng adapter này khi cờ `cau_hinh.ngan_sach_luot` BẬT (mặc định TẮT).

## Ghi rõ phần CHƯA áp (không giấu, có test khoá)

Luật **family** của 02 §4.2.6–4.2.7 (mỗi family 1 câu thường · chưa gán family tối đa 1 câu/lượt · nghỉ 1 ngày VN · 4 ngoại lệ có `repeat_reason`)
**KHÔNG áp** vì **kho thật chưa gắn nhãn family** (P02 ghi nhận). Áp nguyên văn sẽ hạ mọi lượt xuống 1 câu.
Test khẳng định đúng hành vi này (`6 câu "chưa gán family" vẫn qua`) để sau khi có nhãn thì siết lại — KHÔNG bịa family để lách.

## Sản phẩm đúng, test tôi sai (ghi lại để người nghiệm thu biết)

Khi viết test đầu cho `repairNeed`, tôi kỳ vọng `practicing` = 0,5; đặc tả §7.2 cho **cả** `needs_teaching` và `practicing` = 1 (chỉ `recovered` = 0,5).
Đã sửa **fixture** theo đặc tả, không sửa công thức sản phẩm.
