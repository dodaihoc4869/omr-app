# Bản đo tải giả — f1af277

Bộ bắn tải giả `scripts/ban-tai-gia/` (Code 1). Chạy lúc 2026-09-21 21:33:54 (giờ VN). **D1 CỤC BỘ** nạp từ bản sao lưu `omr-d1-20260921-1807-truoc-929aad6.sql`; Worker = mã tại commit `f1af277` bọc vỏ đo (`vo-do.ts`); **không** bắn vào máy chủ thật.

- **Mô phỏng:** 250 em × 10 phút giờ cao điểm (chạy thật 652 giây): mở app (kế hoạch ngày, bài về nhà, Thi đua, thông báo…), hỏi nền mỗi 180 giây, làm + nộp 1 chặng, ôn 3 câu, 1 lượt Đảo.
- **Tổng:** 12.376 lượt gọi · 165.720 truy vấn D1 · 15.694.093 dòng đọc · trung bình 13.4 truy vấn và 1.268 dòng đọc mỗi lượt.
- **Ngân sách (Boss):** ≤ 8 truy vấn và ≤ 2.000 dòng đọc mỗi lượt; lệnh nộp ≤ 15 truy vấn.
- **Kết luận:** ❌ **16/32 lệnh VƯỢT ngân sách** (xem mục 2).

## 1. Bảng theo lệnh (xếp theo tổng dòng đọc giảm dần)

| Lệnh | Lượt | Lỗi | p50 ms | p95 ms | Truy vấn TB / p95 / max | Dòng đọc TB / p95 / max | Dòng ghi TB | Vượt |
|---|---:|---:|---:|---:|---|---|---:|---|
| `game-v2/recommendations [Đảo]` | 100 | 0 | 185 | 494 | 40.0 / 48 / 66 | 21.845 / 32.683 / 198.626 | 4.0 | ❌ 100 lượt > 8 tv; 100 lượt > 2.000 dòng |
| `hs/ke-hoach-ngay [nền]` | 669 | 0 | 55 | 184 | 57.6 / 69 / 73 | 3.120 / 6.332 / 10.153 | 77.6 | ❌ 635 lượt > 8 tv; 456 lượt > 2.000 dòng |
| `hs/ke-hoach-ngay [sau ghi]` | 434 | 0 | 42 | 194 | 63.2 / 69 / 73 | 3.762 / 6.842 / 14.472 | 228.8 | ❌ 434 lượt > 8 tv; 354 lượt > 2.000 dòng |
| `game-v2/start [Đảo]` | 100 | 0 | 143 | 423 | 38.9 / 50 / 61 | 15.729 / 29.814 / 48.097 | 2.3 | ❌ 100 lượt > 8 tv; 100 lượt > 2.000 dòng |
| `btvn/xong-lo [nộp chặng]` 🔒 | 243 | 0 | 67 | 158 | 84.1 / 90 / 92 | 5.563 / 9.635 / 14.869 | 910.6 | ❌ 243 lượt > 15 tv; 217 lượt > 2.000 dòng |
| `hs/thi-dua-hom-nay [nền]` | 669 | 0 | 64 | 143 | 5.2 / 6 / 8 | 1.512 / 6.944 / 26.270 | 0.0 | ❌ 51 lượt > 2.000 dòng |
| `hs/ke-hoach-ngay [dựng đầu ngày]` | 250 | 0 | 524 | 680 | 60.8 / 64 / 72 | 3.402 / 6.374 / 10.112 | 206.6 | ❌ 250 lượt > 8 tv; 169 lượt > 2.000 dòng |
| `game-v2/so-tay [Đảo]` | 100 | 0 | 178 | 440 | 14.5 / 21 / 32 | 8.092 / 18.223 / 33.159 | 0.0 | ❌ 100 lượt > 8 tv; 95 lượt > 2.000 dòng |
| `hs/on-lai/nop [nộp ôn]` 🔒 | 191 | 0 | 33 | 258 | 36.3 / 40 / 42 | 3.890 / 5.883 / 10.163 | 548.7 | ❌ 191 lượt > 15 tv; 191 lượt > 2.000 dòng |
| `game-v2/profile [Đảo]` | 250 | 0 | 15 | 172 | 9.5 / 10 / 10 | 2.486 / 3.148 / 5.688 | 0.0 | ❌ 250 lượt > 8 tv; 249 lượt > 2.000 dòng |
| `hs/ke-hoach-ngay [mở]` | 250 | 0 | 69 | 340 | 42.9 / 61 / 62 | 2.391 / 5.539 / 10.112 | 0.8 | ❌ 188 lượt > 8 tv; 126 lượt > 2.000 dòng |
| `notifications/list [nền]` | 669 | 0 | 61 | 137 | 3.1 / 4 / 4 | 585 / 588 / 593 | 0.0 | — |
| `game-v2/answer [Đảo]` 🔒 | 468 | 0 | 13 | 147 | 10.6 / 12 / 23 | 824 / 825 / 872 | 12.5 | ❌ 11 lượt > 15 tv |
| `hs/thi-dua-hom-nay [mở]` | 250 | 0 | 89 | 247 | 5.1 / 6 / 7 | 1.025 / 1.060 / 21.814 | 0.0 | ❌ 9 lượt > 2.000 dòng |
| `game-v2/academic-sync [nền]` | 669 | 0 | 68 | 149 | 9.2 / 10 / 10 | 335 / 362 / 571 | 1.0 | ❌ 669 lượt > 8 tv |
| `btvn/cua-em [chặng]` | 243 | 0 | 14 | 86 | 8.0 / 10 / 10 | 750 / 1.406 / 1.634 | 92.9 | ❌ 174 lượt > 8 tv |
| `daily-honors [nền]` | 669 | 0 | 60 | 140 | 3.0 / 3 / 4 | 266 / 266 / 271 | 0.0 | — |
| `hs/cau-theo-qid [ôn]` | 191 | 0 | 10 | 141 | 3.4 / 4 / 5 | 845 / 851 / 862 | 0.0 | — |
| `notifications/list [mở]` | 250 | 0 | 83 | 249 | 3.0 / 4 / 4 | 585 / 587 / 588 | 0.0 | — |
| `hs/lich-su [mở]` | 250 | 0 | 76 | 210 | 1.9 / 2 / 2 | 484 / 623 / 921 | 0.0 | — |
| `game-v2/academic-sync [mở]` | 250 | 0 | 94 | 259 | 10.7 / 12 / 13 | 334 / 362 / 570 | 2.1 | ❌ 250 lượt > 8 tv |
| `daily-honors [mở]` | 250 | 0 | 84 | 224 | 3.0 / 3 / 3 | 266 / 266 / 266 | 0.0 | — |
| `hs/ca-dang-mo [nền]` | 669 | 0 | 59 | 133 | 2.1 / 3 / 3 | 29 / 31 / 35 | 0.0 | — |
| `hs/ca-dang-mo [mở]` | 250 | 0 | 81 | 231 | 2.1 / 3 / 3 | 29 / 30 / 34 | 0.0 | — |
| `game-v2/complete [Đảo]` 🔒 | 78 | 0 | 11 | 99 | 13.4 / 14 / 14 | 50 / 69 / 78 | 0.1 | — |
| `presence [nền]` | 2195 | 0 | 7 | 108 | 1.0 / 1 / 2 | 1 / 1 / 6 | 2.0 | — |
| `hs/btvn [mở]` | 250 | 0 | 9 | 129 | 1.0 / 1 / 1 | 7 / 8 / 8 | 0.0 | — |
| `game-v2/resume [Đảo]` | 100 | 0 | 11 | 115 | 3.0 / 3 / 3 | 3 / 3 / 3 | 0.0 | — |
| `hs/thu-thach-hom-nay [mở]` | 250 | 0 | 76 | 224 | 2.1 / 3 / 3 | 1 / 2 / 2 | 0.0 | — |
| `mom/list [nền]` | 669 | 0 | 51 | 119 | 1.2 / 2 / 2 | 0 / 1 / 5 | 0.0 | — |
| `mom/list [mở]` | 250 | 0 | 66 | 190 | 1.1 / 2 / 2 | 0 / 1 / 2 | 0.0 | — |
| `presence [mở]` | 250 | 0 | 63 | 185 | 1.0 / 1 / 1 | 0 / 0 / 0 | 3.0 | — |

🔒 = lệnh nộp (ngân sách truy vấn 15). Thời gian p50/p95 là thời gian máy khách đo (gồm cả xếp hàng ở Worker cục bộ), không phải thời gian D1 thật.

## 2. Lệnh VƯỢT ngân sách

| Lệnh | Vượt truy vấn | Vượt dòng đọc | Truy vấn max (trần) | Dòng đọc max (trần 2.000) |
|---|---:|---:|---|---|
| `game-v2/recommendations [Đảo]` | 100/100 | 100/100 | 66 (8) | 198.626 |
| `game-v2/start [Đảo]` | 100/100 | 100/100 | 61 (8) | 48.097 |
| `game-v2/so-tay [Đảo]` | 100/100 | 95/100 | 32 (8) | 33.159 |
| `hs/thi-dua-hom-nay [nền]` | 0/669 | 51/669 | 8 (8) | 26.270 |
| `hs/thi-dua-hom-nay [mở]` | 0/250 | 9/250 | 7 (8) | 21.814 |
| `btvn/xong-lo [nộp chặng]` | 243/243 | 217/243 | 92 (15) | 14.869 |
| `hs/ke-hoach-ngay [sau ghi]` | 434/434 | 354/434 | 73 (8) | 14.472 |
| `hs/on-lai/nop [nộp ôn]` | 191/191 | 191/191 | 42 (15) | 10.163 |
| `hs/ke-hoach-ngay [nền]` | 635/669 | 456/669 | 73 (8) | 10.153 |
| `hs/ke-hoach-ngay [dựng đầu ngày]` | 250/250 | 169/250 | 72 (8) | 10.112 |
| `hs/ke-hoach-ngay [mở]` | 188/250 | 126/250 | 62 (8) | 10.112 |
| `game-v2/profile [Đảo]` | 250/250 | 249/250 | 10 (8) | 5.688 |
| `btvn/cua-em [chặng]` | 174/243 | 0/243 | 10 (8) | 1.634 |
| `game-v2/answer [Đảo]` | 11/468 | 0/468 | 23 (15) | 872 |
| `game-v2/academic-sync [nền]` | 669/669 | 0/669 | 10 (8) | 571 |
| `game-v2/academic-sync [mở]` | 250/250 | 0/250 | 13 (8) | 570 |

## 3. Top 15 truy vấn theo tổng dòng đọc

| # | Dòng đọc tổng | Số lần | Dòng/lần | Lệnh gọi nhiều nhất | Khung câu SQL |
|---:|---:|---:|---:|---|---|
| 1 | 2.033.313 | 2.501 | 813 | hs/ke-hoach-ngay [nền], game-v2/answer [Đảo] | `SELECT ca.ma_ca,ca.bank_r2,ca.cap_nhat_luc,ca.trang_thai,ca.cong_bo,ca.het_han_vao,ca.thoi_gian_phut,ca.loai,ca.han_nop,ca.bat_dau, (SELECT COUNT(*) …` |
| 2 | 1.303.866 | 1.645 | 793 | game-v2/recommendations [Đảo], game-v2/start [Đảo] | `SELECT q.ma_de,q.qid,q.json FROM json_each(?) j JOIN game_v2_question q ON q.ma_de=json_extract(j.value,'$[0]') AND q.qid=json_extract(j.value,'$[1]'…` |
| 3 | 1.128.191 | 241 | 4.681 | game-v2/recommendations [Đảo], game-v2/start [Đảo] | `SELECT q.dang,q.ma_de,q.qid FROM game_v2_question q JOIN de_kho d ON d.ma_de=q.ma_de JOIN game_v2_index g ON g.ma_de=d.ma_de AND g.source_version=d.c…` |
| 4 | 1.083.398 | 450 | 2.408 | game-v2/profile [Đảo], game-v2/recommendations [Đảo] | `SELECT (SELECT COUNT(*) FROM btvn_em be JOIN btvn b ON b.ma_btvn = be.ma_btvn WHERE be.sbd = ? AND be.nop_luc IS NULL AND b.da_xoa = 0 AND COALESCE(b…` |
| 5 | 813.154 | 2.934 | 277 | hs/ke-hoach-ngay [nền], btvn/xong-lo [nộp chặng] | `SELECT qid, MIN(dang) AS dang FROM game_v2_question WHERE dang IS NOT NULL AND qid IN (SELECT value FROM json_each(?)) GROUP BY qid` |
| 6 | 697.817 | 919 | 759 | hs/thi-dua-hom-nay [nền], hs/thi-dua-hom-nay [mở] | `SELECT sbd, ngay_vn, COUNT(*) AS n, MAX(luc1) AS luc FROM ( SELECT sbd, ngay_vn, qid, MIN(luc) AS luc1 FROM su_kien_hoc WHERE sbd IN (SELECT value FR…` |
| 7 | 603.090 | 2.934 | 206 | hs/ke-hoach-ngay [nền], btvn/xong-lo [nộp chặng] | `SELECT qid, chuyen_de FROM cau_hoi WHERE COALESCE(chuyen_de,'') <> '' AND qid IN (SELECT value FROM json_each(?))` |
| 8 | 596.740 | 1.507 | 396 | hs/ke-hoach-ngay [nền], hs/ke-hoach-ngay [sau ghi] | `SELECT 'g' AS k, giay AS a, NULL AS b FROM (SELECT giay FROM su_kien_hoc WHERE sbd = ? AND giay IS NOT NULL AND ngay_vn >= ? ORDER BY luc DESC LIMIT …` |
| 9 | 559.238 | 1.941 | 288 | hs/ke-hoach-ngay [nền], hs/ke-hoach-ngay [sau ghi] | `SELECT l.ma_ca, c.ten_ca, l.lan_thu, l.nop_luc, l.diem_i, l.diem_ii, l.diem_iii FROM luot l JOIN ca c ON c.ma_ca = l.ma_ca WHERE l.sbd = ? AND l.tran…` |
| 10 | 534.199 | 919 | 581 | notifications/list [nền], notifications/list [mở] | `SELECT * FROM (SELECT e.sbd,'btvn:'\|\|e.khoa id,'Bài tập mới từ Thầy' title,b.ma_de body,'btvn' target,b.giao_luc created_at,b.han_nop deadline FROM b…` |
| 11 | 489.462 | 1.941 | 252 | hs/ke-hoach-ngay [nền], hs/ke-hoach-ngay [sau ghi] | `SELECT khoa, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, ma_dang, chuyen_de FROM su_kien_hoc WHERE sbd = ? ORDER BY luc, khoa` |
| 12 | 487.070 | 919 | 530 | hs/thi-dua-hom-nay [nền], hs/thi-dua-hom-nay [mở] | `SELECT sbd, ho_ten, lop, ten_lop, 1 AS uu FROM hoc_sinh WHERE COALESCE(trang_thai, '') <> 'khoa' UNION ALL SELECT sbd, ho_ten, lop, NULL AS ten_lop, …` |
| 13 | 472.779 | 202 | 2.340 | game-v2/recommendations [Đảo], game-v2/start [Đảo] | `SELECT DISTINCT q.dang AS dang FROM chi_tiet_cau cc JOIN ca c ON c.ma_ca = cc.ma_ca JOIN game_v2_question q ON q.qid = cc.qid WHERE cc.sbd IN (SELECT…` |
| 14 | 366.510 | 1.862 | 197 | hs/ke-hoach-ngay [nền], hs/ke-hoach-ngay [sau ghi] | `SELECT qid, MIN(json_extract(json, '$.phan')) AS phan, MIN(json_extract(json, '$.sao')) AS sao FROM game_v2_question WHERE qid IN (SELECT value FROM …` |
| 15 | 259.848 | 1.063 | 244 | btvn/xong-lo [nộp chặng], hs/on-lai/nop [nộp ôn] | `SELECT khoa, sbd, qid, nguon, ket_qua, giay, luc, ngay_vn, ma_dang, chuyen_de FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?)) ORDER BY…` |

## 4. Tải D1 (ước lượng)

- Tổng thời gian D1 ghi nhận (`meta.duration` của D1 cục bộ): 18.40 giây trong 652 giây chạy thật ⇒ ~1.7 giây D1 / phút ở tải thật. D1 cục bộ là SQLite trong bộ nhớ đệm, **nhanh hơn D1 thật nhiều lần**: dùng SỐ TRUY VẤN và SỐ DÒNG ĐỌC làm thước đo chính, không dùng mili-giây.
- Mỗi dòng đọc trên D1 thật tính tiền/tải như nhau; lệnh nào đọc > 2.000 dòng là ứng viên chỉ mục hoặc đệm.

## Ghi chú đo

- Đăng nhập được 250/250 em giả (bước thiết lập, không tính vào bảng).
- Chặng: 243 em thử làm, 243 nộp được, 7 lỗi/không có bài. Ôn: 191 em có việc ôn (nộp được 191), 59 em không có câu tới hạn. Đảo: 250 em thử, 78 xong lượt, 22 hết lượt/không có câu.
- Lỗi/từ chối hay gặp (không phải lỗi bộ đo — nhiều là đúng luật máy chủ): Đảo start không có câu: Hôm nay em đã dùng hết lượt thần thú. Mai thú chờ em. ×22 · chặng: em không có bài về nhà chưa nộp ×7
- Đáp án của em giả là NGẪU NHIÊN; thời gian "làm" giữa các bước là ngẫu nhiên. D1 cục bộ nhanh hơn D1 thật: số truy vấn và dòng đọc là thước đo chính.
- Cây mã: commit f1af277 (worktree sạch); bộ đệm mô-đun của Worker bắt đầu TRỐNG (như vừa đẩy bản mới).

