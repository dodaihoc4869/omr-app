# Bản đo tải giả — 571fa65-am

Bộ bắn tải giả `scripts/ban-tai-gia/` (Code 1). Chạy lúc 2026-09-22 11:44:13 (giờ VN). **D1 CỤC BỘ** nạp từ bản sao lưu `omr-d1-20260921-1807-truoc-929aad6.sql`; Worker = mã tại commit `571fa65-am` bọc vỏ đo (`vo-do.ts`); **không** bắn vào máy chủ thật.

- **Mô phỏng:** 250 em × 10 phút giờ cao điểm (chạy thật 652 giây): mở app (kế hoạch ngày, bài về nhà, Thi đua, thông báo…), hỏi nền mỗi 180 giây, làm + nộp 1 chặng, ôn 3 câu, 1 lượt Đảo.
- **Tổng:** 12.595 lượt gọi · 136.617 truy vấn D1 · 6.010.573 dòng đọc · trung bình 10.8 truy vấn và 477 dòng đọc mỗi lượt.
- **Ngân sách (Boss):** ≤ 8 truy vấn và ≤ 2.000 dòng đọc mỗi lượt; lệnh nộp ≤ 15 truy vấn.
- **Kết luận:** ❌ **16/32 lệnh VƯỢT ngân sách** (xem mục 2).

## 1. Bảng theo lệnh (xếp theo tổng dòng đọc giảm dần)

| Lệnh | Lượt | Lỗi | p50 | p95 | Truy vấn TB / p95 / max | Dòng đọc TB / p95 / max | Dòng ghi TB | Vượt |
|---|---:|---:|---:|---:|---|---|---:|---|
| `hs/thi-dua-hom-nay [nền]` | 678 | 0 | 61 ms | 102 ms | 4.2 / 5 / 6 | 1.546 / 7.534 / 27.321 | 0.0 | ❌ 50 lượt > 2.000 dòng |
| `hs/ke-hoach-ngay [nền]` | 678 | 0 | 48 ms | 114 ms | 46.4 / 53 / 56 | 1.467 / 3.348 / 6.761 | 6.2 | ❌ 644 lượt > 8 tv; 176 lượt > 2.000 dòng |
| `hs/ke-hoach-ngay [sau ghi]` | 433 | 0 | 32 ms | 100 ms | 48.1 / 50 / 52 | 1.633 / 3.394 / 6.682 | 1.2 | ❌ 433 lượt > 8 tv; 139 lượt > 2.000 dòng |
| `btvn/xong-lo [nộp chặng]` 🔒 | 243 | 0 | 52 ms | 105 ms | 58.2 / 66 / 68 | 2.470 / 4.307 / 7.630 | 20.9 | ❌ 243 lượt > 15 tv; 137 lượt > 2.000 dòng |
| `hs/ke-hoach-ngay [dựng đầu ngày]` | 250 | 0 | 389 ms | 628 ms | 48.7 / 51 / 55 | 1.530 / 3.055 / 6.628 | 1.0 | ❌ 250 lượt > 8 tv; 68 lượt > 2.000 dòng |
| `game-v2/start [Đảo]` | 100 | 0 | 46 ms | 103 ms | 33.6 / 34 / 36 | 3.478 / 6.302 / 7.297 | 3.0 | ❌ 100 lượt > 8 tv; 81 lượt > 2.000 dòng |
| `hs/on-lai/nop [nộp ôn]` 🔒 | 190 | 0 | 31 ms | 69 ms | 28.5 / 32 / 34 | 1.828 / 2.986 / 4.368 | 51.3 | ❌ 190 lượt > 15 tv; 64 lượt > 2.000 dòng |
| `game-v2/recommendations [Đảo]` | 100 | 0 | 50 ms | 104 ms | 30.7 / 32 / 33 | 3.468 / 6.293 / 7.210 | 0.0 | ❌ 100 lượt > 8 tv; 82 lượt > 2.000 dòng |
| `hs/thi-dua-hom-nay [mở]` | 250 | 0 | 77 ms | 160 ms | 4.0 / 4 / 6 | 1.138 / 1.146 / 24.826 | 0.0 | ❌ 10 lượt > 2.000 dòng |
| `hs/ke-hoach-ngay [mở]` | 250 | 0 | 53 ms | 165 ms | 33.4 / 50 / 52 | 1.081 / 3.054 / 5.782 | 0.7 | ❌ 173 lượt > 8 tv; 49 lượt > 2.000 dòng |
| `daily-honors [nền]` | 678 | 0 | 56 ms | 99 ms | 3.0 / 3 / 3 | 266 / 266 / 266 | 0.0 | — |
| `game-v2/so-tay [Đảo]` | 100 | 0 | 58 ms | 87 ms | 9.7 / 10 / 12 | 1.366 / 1.933 / 3.061 | 0.0 | ❌ 100 lượt > 8 tv; 5 lượt > 2.000 dòng |
| `daily-honors [mở]` | 250 | 0 | 72 ms | 159 ms | 3.0 / 3 / 3 | 266 / 266 / 266 | 0.0 | — |
| `hs/lich-su [mở]` | 250 | 0 | 62 ms | 133 ms | 1.9 / 2 / 2 | 221 / 361 / 660 | 0.0 | — |
| `game-v2/profile [Đảo]` | 250 | 0 | 14 ms | 51 ms | 9.6 / 10 / 11 | 217 / 306 / 488 | 0.0 | ❌ 250 lượt > 8 tv |
| `game-v2/academic-sync [nền]` | 678 | 0 | 62 ms | 106 ms | 9.2 / 10 / 10 | 73 / 101 / 310 | 1.0 | ❌ 678 lượt > 8 tv |
| `btvn/cua-em [chặng]` | 243 | 0 | 12 ms | 47 ms | 3.0 / 3 / 4 | 112 / 133 / 151 | 0.0 | — |
| `game-v2/answer [Đảo]` 🔒 | 600 | 0 | 15 ms | 51 ms | 10.0 / 12 / 23 | 44 / 70 / 952 | 12.7 | ❌ 30 lượt > 15 tv |
| `hs/ca-dang-mo [nền]` | 678 | 0 | 55 ms | 95 ms | 2.1 / 3 / 3 | 29 / 31 / 31 | 0.0 | — |
| `game-v2/academic-sync [mở]` | 250 | 0 | 80 ms | 164 ms | 9.0 / 9 / 10 | 73 / 100 / 309 | 1.0 | ❌ 250 lượt > 8 tv |
| `hs/cau-theo-qid [ôn]` | 190 | 0 | 10 ms | 46 ms | 2.5 / 3 / 4 | 62 / 48 / 851 | 0.0 | — |
| `game-v2/resume [Đảo]` | 100 | 0 | 11 ms | 74 ms | 13.0 / 13 / 14 | 83 / 157 / 868 | 0.0 | ❌ 100 lượt > 8 tv |
| `hs/ca-dang-mo [mở]` | 250 | 0 | 69 ms | 136 ms | 2.0 / 2 / 3 | 29 / 30 / 31 | 0.0 | — |
| `game-v2/complete [Đảo]` 🔒 | 100 | 0 | 13 ms | 40 ms | 13.5 / 14 / 14 | 71 / 151 / 230 | 0.0 | — |
| `notifications/list [nền]` | 678 | 0 | 57 ms | 99 ms | 3.1 / 4 / 4 | 10 / 12 / 15 | 0.0 | — |
| `notifications/list [mở]` | 250 | 0 | 72 ms | 152 ms | 3.0 / 3 / 4 | 9 / 12 / 15 | 0.0 | — |
| `presence [nền]` | 2200 | 0 | 10 ms | 38 ms | 1.0 / 1 / 2 | 1 / 1 / 6 | 2.0 | — |
| `hs/btvn [mở]` | 250 | 0 | 9 ms | 92 ms | 1.0 / 1 / 1 | 7 / 8 / 8 | 0.0 | — |
| `presence [mở]` | 250 | 0 | 50 ms | 118 ms | 1.0 / 1 / 1 | 1 / 1 / 1 | 2.0 | — |
| `mom/list [nền]` | 678 | 0 | 49 ms | 88 ms | 1.1 / 2 / 2 | 0 / 1 / 2 | 0.0 | — |
| `mom/list [mở]` | 250 | 0 | 53 ms | 127 ms | 1.0 / 1 / 2 | 0 / 1 / 2 | 0.0 | — |
| `hs/thu-thach-hom-nay [mở]` | 250 | 0 | 63 ms | 134 ms | 2.0 / 2 / 3 | 0 / 0 / 1 | 0.0 | — |

🔒 = lệnh nộp (ngân sách truy vấn 15). Thời gian p50/p95 là thời gian máy khách đo (gồm cả xếp hàng ở Worker cục bộ), không phải thời gian D1 thật.

## 2. Lệnh VƯỢT ngân sách

| Lệnh | Vượt truy vấn | Vượt dòng đọc | Truy vấn max (trần) | Dòng đọc max (trần 2.000) |
|---|---:|---:|---|---|
| `hs/thi-dua-hom-nay [nền]` | 0/678 | 50/678 | 6 (8) | 27.321 |
| `hs/thi-dua-hom-nay [mở]` | 0/250 | 10/250 | 6 (8) | 24.826 |
| `btvn/xong-lo [nộp chặng]` | 243/243 | 137/243 | 68 (15) | 7.630 |
| `game-v2/start [Đảo]` | 100/100 | 81/100 | 36 (8) | 7.297 |
| `game-v2/recommendations [Đảo]` | 100/100 | 82/100 | 33 (8) | 7.210 |
| `hs/ke-hoach-ngay [nền]` | 644/678 | 176/678 | 56 (8) | 6.761 |
| `hs/ke-hoach-ngay [sau ghi]` | 433/433 | 139/433 | 52 (8) | 6.682 |
| `hs/ke-hoach-ngay [dựng đầu ngày]` | 250/250 | 68/250 | 55 (8) | 6.628 |
| `hs/ke-hoach-ngay [mở]` | 173/250 | 49/250 | 52 (8) | 5.782 |
| `hs/on-lai/nop [nộp ôn]` | 190/190 | 64/190 | 34 (15) | 4.368 |
| `game-v2/so-tay [Đảo]` | 100/100 | 5/100 | 12 (8) | 3.061 |
| `game-v2/answer [Đảo]` | 30/600 | 0/600 | 23 (15) | 952 |
| `game-v2/resume [Đảo]` | 100/100 | 0/100 | 14 (8) | 868 |
| `game-v2/profile [Đảo]` | 250/250 | 0/250 | 11 (8) | 488 |
| `game-v2/academic-sync [nền]` | 678/678 | 0/678 | 10 (8) | 310 |
| `game-v2/academic-sync [mở]` | 250/250 | 0/250 | 10 (8) | 309 |

## 3. Top 15 truy vấn theo tổng dòng đọc

| # | Dòng đọc tổng | Số lần | Dòng/lần | Lệnh gọi nhiều nhất | Khung câu SQL |
|---:|---:|---:|---:|---|---|
| 1 | 776.618 | 928 | 837 | hs/thi-dua-hom-nay [nền], hs/thi-dua-hom-nay [mở] | `SELECT sbd, ngay_vn, COUNT(*) AS n, MAX(luc1) AS luc FROM ( SELECT sbd, ngay_vn, qid, MIN(luc) AS luc1 FROM su_kien_hoc WHERE sbd IN (SELECT value FR…` |
| 2 | 639.977 | 1.500 | 427 | hs/ke-hoach-ngay [nền], hs/ke-hoach-ngay [sau ghi] | `SELECT 'g' AS k, giay AS a, NULL AS b FROM (SELECT giay FROM su_kien_hoc WHERE sbd = ? AND giay IS NOT NULL AND ngay_vn >= ? ORDER BY luc DESC LIMIT …` |
| 3 | 525.838 | 1.933 | 272 | hs/ke-hoach-ngay [nền], hs/ke-hoach-ngay [sau ghi] | `SELECT khoa, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, ma_dang, chuyen_de FROM su_kien_hoc WHERE sbd = ? ORDER BY luc, khoa` |
| 4 | 491.840 | 928 | 530 | hs/thi-dua-hom-nay [nền], hs/thi-dua-hom-nay [mở] | `SELECT sbd, ho_ten, lop, ten_lop, 1 AS uu FROM hoc_sinh WHERE COALESCE(trang_thai, '') <> 'khoa' UNION ALL SELECT sbd, ho_ten, lop, NULL AS ten_lop, …` |
| 5 | 273.382 | 1.743 | 157 | hs/ke-hoach-ngay [nền], hs/ke-hoach-ngay [sau ghi] | `SELECT e.sbd, COUNT(*) AS so_su_kien, COUNT(DISTINCT CASE WHEN e.ngay_vn = ? THEN e.qid END) AS da_lam, COUNT(DISTINCT CASE WHEN e.ngay_vn = ? AND e.…` |
| 6 | 272.738 | 200 | 1.364 | game-v2/recommendations [Đảo], game-v2/start [Đảo] | `SELECT DISTINCT q.dang AS dang FROM ( SELECT cc.qid FROM chi_tiet_cau cc JOIN ca c ON c.ma_ca = cc.ma_ca WHERE cc.sbd IN (SELECT value FROM json_each…` |
| 7 | 245.920 | 928 | 265 | daily-honors [nền], daily-honors [mở] | `SELECT l.sbd,COALESCE(h.ho_ten,l.ho_ten) ho_ten,l.tong,l.nop_luc,l.vao_luc,c.ten_ca, json_extract(g.json,'$.nickname') nickname,json_extract(g.json,'…` |
| 8 | 237.578 | 775 | 307 | btvn/xong-lo [nộp chặng], hs/on-lai/nop [nộp ôn] | `SELECT khoa, sbd, qid, nguon, ket_qua, giay, luc, ngay_vn, ma_dang, chuyen_de FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?)) ORDER BY…` |
| 9 | 184.672 | 1.376 | 134 | hs/ke-hoach-ngay [nền], hs/ke-hoach-ngay [sau ghi] | `SELECT q.qid, q.content_group, q.json FROM game_v2_question q JOIN de_kho d ON d.ma_de = q.ma_de JOIN game_v2_index g ON g.ma_de = d.ma_de AND g.sour…` |
| 10 | 183.210 | 729 | 251 | btvn/xong-lo [nộp chặng] | `SELECT 'd' AS k, sbd, ma_dang AS a, bac AS b, so_gap AS c, so_sai AS d, so_da_khac_phuc AS e, so_chua_thay_sai AS f FROM nam_kt_dang WHERE sbd IN (SE…` |
| 11 | 162.008 | 190 | 853 | hs/on-lai/nop [nộp ôn] | `SELECT qid, ket_qua FROM su_kien_hoc WHERE sbd = ? AND nguon = ? AND ma_nguon = ? AND lan = 1 AND qid IN (SELECT value FROM json_each(?))` |
| 12 | 160.800 | 300 | 536 | game-v2/recommendations [Đảo], game-v2/so-tay [Đảo] | `SELECT COUNT(*) AS n, COALESCE(MAX(d.cap_nhat_luc),'') AS t, COALESCE(GROUP_CONCAT(d.ma_de),'') AS ids FROM de_kho d JOIN game_v2_index g ON g.ma_de=…` |
| 13 | 123.954 | 474 | 262 | game-v2/recommendations [Đảo], game-v2/so-tay [Đảo] | `SELECT q.json FROM game_v2_question q JOIN de_kho d ON d.ma_de=q.ma_de JOIN game_v2_index g ON g.ma_de=d.ma_de AND g.source_version=d.cap_nhat_luc WH…` |
| 14 | 109.755 | 135 | 813 | hs/ke-hoach-ngay [nền], hs/ke-hoach-ngay [dựng đầu ngày] | `SELECT ca.ma_ca,ca.bank_r2,ca.cap_nhat_luc,ca.trang_thai,ca.cong_bo,ca.het_han_vao,ca.thoi_gian_phut,ca.loai,ca.han_nop,ca.bat_dau, (SELECT COUNT(*) …` |
| 15 | 103.502 | 1.401 | 74 | hs/ke-hoach-ngay [nền], hs/ke-hoach-ngay [dựng đầu ngày] | `SELECT sbd, COUNT(*) AS n FROM nam_kt_cau WHERE sbd IN (SELECT value FROM json_each(?)) AND trang_thai IN ('moi_sai','dang_on') GROUP BY sbd` |

## 4. Tải D1 (ước lượng)

- Tổng thời gian D1 ghi nhận (`meta.duration` của D1 cục bộ): 9.10 giây trong 652 giây chạy thật ⇒ ~0.8 giây D1 / phút ở tải thật. D1 cục bộ là SQLite trong bộ nhớ đệm, **nhanh hơn D1 thật nhiều lần**: dùng SỐ TRUY VẤN và SỐ DÒNG ĐỌC làm thước đo chính, không dùng mili-giây.
- Mỗi dòng đọc trên D1 thật tính tiền/tải như nhau; lệnh nào đọc > 2.000 dòng là ứng viên chỉ mục hoặc đệm.

## Ghi chú đo

- Đăng nhập được 250/250 em giả (bước thiết lập, không tính vào bảng).
- Chặng: 243 em thử làm, 243 nộp được, 7 lỗi/không có bài. Ôn: 190 em có việc ôn (nộp được 190), 60 em không có câu tới hạn. Đảo: 250 em thử, 100 xong lượt, 0 hết lượt/không có câu.
- Lỗi/từ chối hay gặp (không phải lỗi bộ đo — nhiều là đúng luật máy chủ): chặng: em không có bài về nhà chưa nộp ×7
- Đáp án của em giả là NGẪU NHIÊN; thời gian "làm" giữa các bước là ngẫu nhiên. D1 cục bộ nhanh hơn D1 thật: số truy vấn và dòng đọc là thước đo chính.
- LƯỢT 2 — CÙNG Worker, bộ đệm mô-đun đã ẤM từ lượt 1 (dữ liệu D1 đã đổi theo lượt 1: em đã nộp/ôn/chơi — sát thật hơn "vừa đẩy", vì giờ cao điểm không ai gặp Worker vừa nguội).
- Migration chỉ-thêm của cây mã đã áp lên bản sao D1 cục bộ (câu MỚI so với mẫu; lỗi 'đã có' bỏ qua): migration-2109-chi-muc-luot.sql (+1 đối tượng: bảng/chỉ mục/cột)
- Mẫu phản hồi để so trước/sau: 40 em đầu (`so-sanh-phan-hoi.mjs`); dò lộ đáp án: xem trên
- Cây mã: commit 571fa65 (worktree sạch).

