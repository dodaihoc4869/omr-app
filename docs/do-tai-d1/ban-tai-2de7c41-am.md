# Bản đo tải giả — 2de7c41-am

Bộ bắn tải giả `scripts/ban-tai-gia/` (Code 1). Chạy lúc 2026-09-22 08:37:35 (giờ VN). **D1 CỤC BỘ** nạp từ bản sao lưu `omr-d1-20260921-1807-truoc-929aad6.sql`; Worker = mã tại commit `2de7c41-am` bọc vỏ đo (`vo-do.ts`); **không** bắn vào máy chủ thật.

- **Mô phỏng:** 250 em × 10 phút giờ cao điểm (chạy thật 656 giây): mở app (kế hoạch ngày, bài về nhà, Thi đua, thông báo…), hỏi nền mỗi 180 giây, làm + nộp 1 chặng, ôn 3 câu, 1 lượt Đảo.
- **Tổng:** 12.507 lượt gọi · 146.009 truy vấn D1 · 6.385.705 dòng đọc · trung bình 11.7 truy vấn và 511 dòng đọc mỗi lượt.
- **Ngân sách (Boss):** ≤ 8 truy vấn và ≤ 2.000 dòng đọc mỗi lượt; lệnh nộp ≤ 15 truy vấn.
- **Kết luận:** ❌ **16/32 lệnh VƯỢT ngân sách** (xem mục 2).

## 1. Bảng theo lệnh (xếp theo tổng dòng đọc giảm dần)

| Lệnh | Lượt | Lỗi | p50 | p95 | Truy vấn TB / p95 / max | Dòng đọc TB / p95 / max | Dòng ghi TB | Vượt |
|---|---:|---:|---:|---:|---|---|---:|---|
| `hs/ke-hoach-ngay [nền]` | 665 | 0 | 49 ms | 138 ms | 51.1 / 59 / 62 | 1.675 / 3.658 / 7.250 | 6.3 | ❌ 632 lượt > 8 tv; 261 lượt > 2.000 dòng |
| `hs/thi-dua-hom-nay [nền]` | 665 | 0 | 63 ms | 116 ms | 5.2 / 6 / 8 | 1.539 / 7.458 / 27.374 | 0.0 | ❌ 49 lượt > 2.000 dòng |
| `hs/ke-hoach-ngay [sau ghi]` | 434 | 0 | 32 ms | 92 ms | 53.1 / 55 / 57 | 1.878 / 3.830 / 7.169 | 1.2 | ❌ 434 lượt > 8 tv; 206 lượt > 2.000 dòng |
| `btvn/xong-lo [nộp chặng]` 🔒 | 243 | 0 | 52 ms | 92 ms | 64.2 / 72 / 74 | 2.729 / 4.739 / 8.125 | 20.2 | ❌ 243 lượt > 15 tv; 151 lượt > 2.000 dòng |
| `hs/ke-hoach-ngay [dựng đầu ngày]` | 250 | 0 | 432 ms | 623 ms | 53.4 / 55 / 57 | 1.659 / 3.401 / 6.270 | 1.0 | ❌ 250 lượt > 8 tv; 100 lượt > 2.000 dòng |
| `hs/on-lai/nop [nộp ôn]` 🔒 | 191 | 0 | 31 ms | 78 ms | 30.7 / 34 / 35 | 2.076 / 3.409 / 4.567 | 52.2 | ❌ 191 lượt > 15 tv; 95 lượt > 2.000 dòng |
| `game-v2/start [Đảo]` | 100 | 0 | 47 ms | 119 ms | 33.6 / 34 / 36 | 3.459 / 6.270 / 7.269 | 3.0 | ❌ 100 lượt > 8 tv; 81 lượt > 2.000 dòng |
| `game-v2/recommendations [Đảo]` | 100 | 0 | 57 ms | 98 ms | 30.7 / 32 / 33 | 3.440 / 6.284 / 7.182 | 0.0 | ❌ 100 lượt > 8 tv; 80 lượt > 2.000 dòng |
| `hs/ke-hoach-ngay [mở]` | 250 | 0 | 44 ms | 117 ms | 37.4 / 55 / 56 | 1.267 / 3.421 / 6.270 | 0.7 | ❌ 176 lượt > 8 tv; 80 lượt > 2.000 dòng |
| `hs/thi-dua-hom-nay [mở]` | 250 | 0 | 65 ms | 120 ms | 5.0 / 5 / 7 | 1.112 / 1.088 / 24.852 | 0.0 | ❌ 9 lượt > 2.000 dòng |
| `daily-honors [nền]` | 665 | 0 | 56 ms | 103 ms | 3.0 / 3 / 3 | 266 / 266 / 266 | 0.0 | — |
| `game-v2/so-tay [Đảo]` | 100 | 0 | 52 ms | 104 ms | 9.7 / 10 / 12 | 1.374 / 1.933 / 3.061 | 0.0 | ❌ 100 lượt > 8 tv; 5 lượt > 2.000 dòng |
| `daily-honors [mở]` | 250 | 0 | 58 ms | 102 ms | 3.0 / 3 / 3 | 266 / 266 / 266 | 0.0 | — |
| `hs/lich-su [mở]` | 250 | 0 | 51 ms | 92 ms | 1.9 / 2 / 2 | 221 / 361 / 660 | 0.0 | — |
| `game-v2/profile [Đảo]` | 250 | 0 | 13 ms | 54 ms | 9.5 / 10 / 10 | 217 / 313 / 487 | 0.0 | ❌ 250 lượt > 8 tv |
| `game-v2/academic-sync [nền]` | 665 | 0 | 63 ms | 114 ms | 9.2 / 10 / 10 | 73 / 101 / 310 | 1.0 | ❌ 665 lượt > 8 tv |
| `btvn/cua-em [chặng]` | 243 | 0 | 13 ms | 49 ms | 3.0 / 3 / 3 | 112 / 133 / 150 | 0.0 | — |
| `game-v2/answer [Đảo]` 🔒 | 600 | 0 | 15 ms | 53 ms | 9.7 / 11 / 22 | 44 / 54 / 940 | 12.5 | ❌ 20 lượt > 15 tv |
| `hs/ca-dang-mo [nền]` | 665 | 0 | 54 ms | 100 ms | 2.1 / 3 / 3 | 29 / 31 / 31 | 0.0 | — |
| `game-v2/academic-sync [mở]` | 250 | 0 | 68 ms | 122 ms | 9.0 / 9 / 10 | 73 / 100 / 309 | 1.0 | ❌ 250 lượt > 8 tv |
| `game-v2/resume [Đảo]` | 100 | 0 | 11 ms | 75 ms | 13.0 / 13 / 14 | 83 / 157 / 868 | 0.0 | ❌ 100 lượt > 8 tv |
| `hs/cau-theo-qid [ôn]` | 191 | 0 | 9 ms | 51 ms | 2.4 / 3 / 4 | 41 / 43 / 851 | 0.0 | — |
| `hs/ca-dang-mo [mở]` | 250 | 0 | 55 ms | 103 ms | 2.0 / 2 / 3 | 29 / 30 / 31 | 0.0 | — |
| `game-v2/complete [Đảo]` 🔒 | 100 | 0 | 14 ms | 47 ms | 13.6 / 14 / 14 | 71 / 148 / 230 | 0.0 | — |
| `notifications/list [nền]` | 665 | 0 | 56 ms | 103 ms | 3.1 / 4 / 5 | 10 / 13 / 15 | 0.0 | — |
| `notifications/list [mở]` | 250 | 0 | 58 ms | 102 ms | 3.0 / 3 / 4 | 9 / 12 / 15 | 0.0 | — |
| `presence [nền]` | 2200 | 0 | 8 ms | 40 ms | 1.0 / 1 / 2 | 1 / 1 / 6 | 2.0 | — |
| `hs/btvn [mở]` | 250 | 0 | 5 ms | 67 ms | 1.0 / 1 / 1 | 7 / 8 / 8 | 0.0 | — |
| `presence [mở]` | 250 | 0 | 42 ms | 86 ms | 1.0 / 1 / 1 | 1 / 1 / 1 | 2.0 | — |
| `mom/list [nền]` | 665 | 0 | 47 ms | 87 ms | 1.2 / 2 / 2 | 0 / 1 / 3 | 0.0 | — |
| `mom/list [mở]` | 250 | 0 | 45 ms | 89 ms | 1.0 / 1 / 2 | 0 / 1 / 2 | 0.0 | — |
| `hs/thu-thach-hom-nay [mở]` | 250 | 0 | 52 ms | 97 ms | 2.0 / 2 / 3 | 0 / 0 / 1 | 0.0 | — |

🔒 = lệnh nộp (ngân sách truy vấn 15). Thời gian p50/p95 là thời gian máy khách đo (gồm cả xếp hàng ở Worker cục bộ), không phải thời gian D1 thật.

## 2. Lệnh VƯỢT ngân sách

| Lệnh | Vượt truy vấn | Vượt dòng đọc | Truy vấn max (trần) | Dòng đọc max (trần 2.000) |
|---|---:|---:|---|---|
| `hs/thi-dua-hom-nay [nền]` | 0/665 | 49/665 | 8 (8) | 27.374 |
| `hs/thi-dua-hom-nay [mở]` | 0/250 | 9/250 | 7 (8) | 24.852 |
| `btvn/xong-lo [nộp chặng]` | 243/243 | 151/243 | 74 (15) | 8.125 |
| `game-v2/start [Đảo]` | 100/100 | 81/100 | 36 (8) | 7.269 |
| `hs/ke-hoach-ngay [nền]` | 632/665 | 261/665 | 62 (8) | 7.250 |
| `game-v2/recommendations [Đảo]` | 100/100 | 80/100 | 33 (8) | 7.182 |
| `hs/ke-hoach-ngay [sau ghi]` | 434/434 | 206/434 | 57 (8) | 7.169 |
| `hs/ke-hoach-ngay [dựng đầu ngày]` | 250/250 | 100/250 | 57 (8) | 6.270 |
| `hs/ke-hoach-ngay [mở]` | 176/250 | 80/250 | 56 (8) | 6.270 |
| `hs/on-lai/nop [nộp ôn]` | 191/191 | 95/191 | 35 (15) | 4.567 |
| `game-v2/so-tay [Đảo]` | 100/100 | 5/100 | 12 (8) | 3.061 |
| `game-v2/answer [Đảo]` | 20/600 | 0/600 | 22 (15) | 940 |
| `game-v2/resume [Đảo]` | 100/100 | 0/100 | 14 (8) | 868 |
| `game-v2/profile [Đảo]` | 250/250 | 0/250 | 10 (8) | 487 |
| `game-v2/academic-sync [nền]` | 665/665 | 0/665 | 10 (8) | 310 |
| `game-v2/academic-sync [mở]` | 250/250 | 0/250 | 10 (8) | 309 |

## 3. Top 15 truy vấn theo tổng dòng đọc

| # | Dòng đọc tổng | Số lần | Dòng/lần | Lệnh gọi nhiều nhất | Khung câu SQL |
|---:|---:|---:|---:|---|---|
| 1 | 748.587 | 915 | 818 | hs/thi-dua-hom-nay [nền], hs/thi-dua-hom-nay [mở] | `SELECT sbd, ngay_vn, COUNT(*) AS n, MAX(luc1) AS luc FROM ( SELECT sbd, ngay_vn, qid, MIN(luc) AS luc1 FROM su_kien_hoc WHERE sbd IN (SELECT value FR…` |
| 2 | 639.000 | 1.492 | 428 | hs/ke-hoach-ngay [nền], hs/ke-hoach-ngay [sau ghi] | `SELECT 'g' AS k, giay AS a, NULL AS b FROM (SELECT giay FROM su_kien_hoc WHERE sbd = ? AND giay IS NOT NULL AND ngay_vn >= ? ORDER BY luc DESC LIMIT …` |
| 3 | 526.394 | 1.926 | 273 | hs/ke-hoach-ngay [nền], hs/ke-hoach-ngay [sau ghi] | `SELECT khoa, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, ma_dang, chuyen_de FROM su_kien_hoc WHERE sbd = ? ORDER BY luc, khoa` |
| 4 | 484.950 | 915 | 530 | hs/thi-dua-hom-nay [nền], hs/thi-dua-hom-nay [mở] | `SELECT sbd, ho_ten, lop, ten_lop, 1 AS uu FROM hoc_sinh WHERE COALESCE(trang_thai, '') <> 'khoa' UNION ALL SELECT sbd, ho_ten, lop, NULL AS ten_lop, …` |
| 5 | 373.238 | 1.915 | 195 | hs/ke-hoach-ngay [nền], hs/ke-hoach-ngay [sau ghi] | `SELECT qid, MIN(json_extract(json, '$.phan')) AS phan, MIN(json_extract(json, '$.sao')) AS sao FROM game_v2_question WHERE qid IN (SELECT value FROM …` |
| 6 | 272.691 | 1.735 | 157 | hs/ke-hoach-ngay [nền], hs/ke-hoach-ngay [sau ghi] | `SELECT e.sbd, COUNT(*) AS so_su_kien, COUNT(DISTINCT CASE WHEN e.ngay_vn = ? THEN e.qid END) AS da_lam, COUNT(DISTINCT CASE WHEN e.ngay_vn = ? AND e.…` |
| 7 | 268.796 | 200 | 1.344 | game-v2/recommendations [Đảo], game-v2/start [Đảo] | `SELECT DISTINCT q.dang AS dang FROM chi_tiet_cau cc JOIN ca c ON c.ma_ca = cc.ma_ca JOIN game_v2_question q ON q.qid = cc.qid WHERE cc.sbd IN (SELECT…` |
| 8 | 242.475 | 915 | 265 | daily-honors [nền], daily-honors [mở] | `SELECT l.sbd,COALESCE(h.ho_ten,l.ho_ten) ho_ten,l.tong,l.nop_luc,l.vao_luc,c.ten_ca, json_extract(g.json,'$.nickname') nickname,json_extract(g.json,'…` |
| 9 | 238.070 | 773 | 308 | btvn/xong-lo [nộp chặng], hs/on-lai/nop [nộp ôn] | `SELECT khoa, sbd, qid, nguon, ket_qua, giay, luc, ngay_vn, ma_dang, chuyen_de FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?)) ORDER BY…` |
| 10 | 184.444 | 1.371 | 135 | hs/ke-hoach-ngay [nền], hs/ke-hoach-ngay [sau ghi] | `SELECT q.qid, q.content_group, q.json FROM game_v2_question q JOIN de_kho d ON d.ma_de = q.ma_de JOIN game_v2_index g ON g.ma_de = d.ma_de AND g.sour…` |
| 11 | 183.169 | 729 | 251 | btvn/xong-lo [nộp chặng] | `SELECT 'd' AS k, sbd, ma_dang AS a, bac AS b, so_gap AS c, so_sai AS d, so_da_khac_phuc AS e, so_chua_thay_sai AS f FROM nam_kt_dang WHERE sbd IN (SE…` |
| 12 | 163.835 | 191 | 858 | hs/on-lai/nop [nộp ôn] | `SELECT qid, ket_qua FROM su_kien_hoc WHERE sbd = ? AND nguon = ? AND ma_nguon = ? AND lan = 1 AND qid IN (SELECT value FROM json_each(?))` |
| 13 | 160.800 | 300 | 536 | game-v2/recommendations [Đảo], game-v2/so-tay [Đảo] | `SELECT COUNT(*) AS n, COALESCE(MAX(d.cap_nhat_luc),'') AS t, COALESCE(GROUP_CONCAT(d.ma_de),'') AS ids FROM de_kho d JOIN game_v2_index g ON g.ma_de=…` |
| 14 | 123.954 | 474 | 262 | game-v2/recommendations [Đảo], game-v2/so-tay [Đảo] | `SELECT q.json FROM game_v2_question q JOIN de_kho d ON d.ma_de=q.ma_de JOIN game_v2_index g ON g.ma_de=d.ma_de AND g.source_version=d.cap_nhat_luc WH…` |
| 15 | 103.070 | 1.396 | 74 | hs/ke-hoach-ngay [nền], hs/ke-hoach-ngay [dựng đầu ngày] | `SELECT sbd, COUNT(*) AS n FROM nam_kt_cau WHERE sbd IN (SELECT value FROM json_each(?)) AND trang_thai IN ('moi_sai','dang_on') GROUP BY sbd` |

## 4. Tải D1 (ước lượng)

- Tổng thời gian D1 ghi nhận (`meta.duration` của D1 cục bộ): 8.98 giây trong 656 giây chạy thật ⇒ ~0.8 giây D1 / phút ở tải thật. D1 cục bộ là SQLite trong bộ nhớ đệm, **nhanh hơn D1 thật nhiều lần**: dùng SỐ TRUY VẤN và SỐ DÒNG ĐỌC làm thước đo chính, không dùng mili-giây.
- Mỗi dòng đọc trên D1 thật tính tiền/tải như nhau; lệnh nào đọc > 2.000 dòng là ứng viên chỉ mục hoặc đệm.

## Ghi chú đo

- Đăng nhập được 250/250 em giả (bước thiết lập, không tính vào bảng).
- Chặng: 243 em thử làm, 243 nộp được, 7 lỗi/không có bài. Ôn: 191 em có việc ôn (nộp được 191), 59 em không có câu tới hạn. Đảo: 250 em thử, 100 xong lượt, 0 hết lượt/không có câu.
- Lỗi/từ chối hay gặp (không phải lỗi bộ đo — nhiều là đúng luật máy chủ): chặng: em không có bài về nhà chưa nộp ×7
- Đáp án của em giả là NGẪU NHIÊN; thời gian "làm" giữa các bước là ngẫu nhiên. D1 cục bộ nhanh hơn D1 thật: số truy vấn và dòng đọc là thước đo chính.
- LƯỢT 2 — CÙNG Worker, bộ đệm mô-đun đã ẤM từ lượt 1 (dữ liệu D1 đã đổi theo lượt 1: em đã nộp/ôn/chơi — sát thật hơn "vừa đẩy", vì giờ cao điểm không ai gặp Worker vừa nguội).
- Migration chỉ-thêm của cây mã đã áp lên bản sao D1 cục bộ (câu MỚI so với mẫu; lỗi 'đã có' bỏ qua): migration-2109-chi-muc-luot.sql (+1 đối tượng: bảng/chỉ mục/cột)
- Mẫu phản hồi để so trước/sau: 40 em đầu (`so-sanh-phan-hoi.mjs`); dò lộ đáp án: xem trên
- Cây mã: commit 2de7c41 (worktree sạch).

