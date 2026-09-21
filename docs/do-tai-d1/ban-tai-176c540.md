# Bản đo tải giả — 176c540

Bộ bắn tải giả `scripts/ban-tai-gia/` (Code 1). Chạy lúc 2026-09-21 21:58:09 (giờ VN). **D1 CỤC BỘ** nạp từ bản sao lưu `omr-d1-20260921-1807-truoc-929aad6.sql`; Worker = mã tại commit `176c540` bọc vỏ đo (`vo-do.ts`); **không** bắn vào máy chủ thật.

- **Mô phỏng:** 250 em × 10 phút giờ cao điểm (chạy thật 658 giây): mở app (kế hoạch ngày, bài về nhà, Thi đua, thông báo…), hỏi nền mỗi 180 giây, làm + nộp 1 chặng, ôn 3 câu, 1 lượt Đảo.
- **Tổng:** 12.569 lượt gọi · 165.030 truy vấn D1 · 15.612.033 dòng đọc · trung bình 13.1 truy vấn và 1.242 dòng đọc mỗi lượt.
- **Ngân sách (Boss):** ≤ 8 truy vấn và ≤ 2.000 dòng đọc mỗi lượt; lệnh nộp ≤ 15 truy vấn.
- **Kết luận:** ❌ **16/32 lệnh VƯỢT ngân sách** (xem mục 2).

## 1. Bảng theo lệnh (xếp theo tổng dòng đọc giảm dần)

| Lệnh | Lượt | Lỗi | p50 ms | p95 ms | Truy vấn TB / p95 / max | Dòng đọc TB / p95 / max | Dòng ghi TB | Vượt |
|---|---:|---:|---:|---:|---|---|---:|---|
| `game-v2/recommendations [Đảo]` | 100 | 0 | 210 | 734 | 40.4 / 50 / 67 | 22.189 / 35.870 / 192.685 | 5.6 | ❌ 100 lượt > 8 tv; 100 lượt > 2.000 dòng |
| `hs/ke-hoach-ngay [nền]` | 694 | 0 | 52 | 225 | 57.7 / 69 / 70 | 3.088 / 6.163 / 10.140 | 5.2 | ❌ 661 lượt > 8 tv; 468 lượt > 2.000 dòng |
| `game-v2/start [Đảo]` | 100 | 0 | 156 | 567 | 39.0 / 50 / 65 | 16.032 / 29.544 / 51.832 | 2.3 | ❌ 100 lượt > 8 tv; 100 lượt > 2.000 dòng |
| `hs/ke-hoach-ngay [sau ghi]` | 435 | 0 | 43 | 215 | 62.1 / 66 / 69 | 3.675 / 6.633 / 13.765 | 1.4 | ❌ 435 lượt > 8 tv; 352 lượt > 2.000 dòng |
| `btvn/xong-lo [nộp chặng]` 🔒 | 243 | 0 | 64 | 151 | 81.0 / 86 / 88 | 5.227 / 8.979 / 14.175 | 130.3 | ❌ 243 lượt > 15 tv; 217 lượt > 2.000 dòng |
| `hs/thi-dua-hom-nay [nền]` | 694 | 0 | 71 | 179 | 5.2 / 6 / 7 | 1.454 / 6.902 / 26.270 | 0.0 | ❌ 50 lượt > 2.000 dòng |
| `hs/ke-hoach-ngay [dựng đầu ngày]` | 250 | 0 | 325 | 371 | 59.6 / 62 / 69 | 3.315 / 6.299 / 10.112 | 2.8 | ❌ 250 lượt > 8 tv; 167 lượt > 2.000 dòng |
| `game-v2/so-tay [Đảo]` | 100 | 0 | 186 | 532 | 14.5 / 20 / 30 | 8.058 / 15.944 / 29.801 | 0.0 | ❌ 100 lượt > 8 tv; 97 lượt > 2.000 dòng |
| `hs/on-lai/nop [nộp ôn]` 🔒 | 192 | 0 | 34 | 293 | 35.6 / 39 / 40 | 3.700 / 5.591 / 9.668 | 51.6 | ❌ 192 lượt > 15 tv; 192 lượt > 2.000 dòng |
| `game-v2/profile [Đảo]` | 250 | 0 | 14 | 232 | 9.6 / 10 / 11 | 2.484 / 3.008 / 5.687 | 0.0 | ❌ 250 lượt > 8 tv; 249 lượt > 2.000 dòng |
| `hs/ke-hoach-ngay [mở]` | 250 | 0 | 40 | 132 | 38.2 / 61 / 62 | 2.087 / 5.374 / 10.112 | 0.7 | ❌ 168 lượt > 8 tv; 111 lượt > 2.000 dòng |
| `notifications/list [nền]` | 694 | 0 | 63 | 162 | 3.1 / 4 / 4 | 585 / 587 / 590 | 0.0 | — |
| `game-v2/answer [Đảo]` 🔒 | 468 | 0 | 14 | 241 | 10.5 / 11 / 22 | 824 / 824 / 866 | 12.5 | ❌ 5 lượt > 15 tv |
| `hs/thi-dua-hom-nay [mở]` | 250 | 0 | 62 | 115 | 5.0 / 5 / 8 | 1.101 / 1.152 / 21.858 | 0.0 | ❌ 10 lượt > 2.000 dòng |
| `game-v2/academic-sync [nền]` | 694 | 0 | 73 | 178 | 9.2 / 10 / 11 | 334 / 362 / 571 | 1.0 | ❌ 694 lượt > 8 tv |
| `daily-honors [nền]` | 694 | 0 | 62 | 159 | 3.0 / 3 / 4 | 266 / 266 / 271 | 0.0 | — |
| `btvn/cua-em [chặng]` | 243 | 0 | 15 | 44 | 8.0 / 10 / 11 | 750 / 1.406 / 1.634 | 92.9 | ❌ 174 lượt > 8 tv |
| `hs/cau-theo-qid [ôn]` | 192 | 0 | 11 | 192 | 3.4 / 4 / 4 | 845 / 853 / 862 | 0.0 | — |
| `notifications/list [mở]` | 250 | 0 | 57 | 112 | 3.0 / 3 / 4 | 585 / 587 / 588 | 0.0 | — |
| `hs/lich-su [mở]` | 250 | 0 | 49 | 92 | 1.9 / 2 / 2 | 484 / 623 / 921 | 0.0 | — |
| `game-v2/academic-sync [mở]` | 250 | 0 | 65 | 120 | 10.6 / 12 / 13 | 334 / 361 / 571 | 2.1 | ❌ 250 lượt > 8 tv |
| `daily-honors [mở]` | 250 | 0 | 57 | 112 | 3.0 / 3 / 3 | 266 / 266 / 266 | 0.0 | — |
| `hs/ca-dang-mo [nền]` | 694 | 0 | 60 | 162 | 2.1 / 3 / 3 | 29 / 31 / 35 | 0.0 | — |
| `hs/ca-dang-mo [mở]` | 250 | 0 | 54 | 109 | 2.0 / 2 / 3 | 29 / 30 / 31 | 0.0 | — |
| `game-v2/complete [Đảo]` 🔒 | 78 | 0 | 14 | 99 | 13.5 / 14 / 14 | 50 / 67 / 75 | 0.0 | — |
| `presence [nền]` | 2210 | 0 | 7 | 111 | 1.0 / 1 / 2 | 1 / 1 / 6 | 2.0 | — |
| `hs/btvn [mở]` | 250 | 0 | 4 | 58 | 1.0 / 1 / 1 | 7 / 8 / 8 | 0.0 | — |
| `game-v2/resume [Đảo]` | 100 | 0 | 22 | 221 | 3.0 / 3 / 3 | 3 / 3 / 3 | 0.0 | — |
| `hs/thu-thach-hom-nay [mở]` | 250 | 0 | 50 | 93 | 2.0 / 2 / 3 | 1 / 1 / 2 | 0.0 | — |
| `mom/list [nền]` | 694 | 0 | 52 | 132 | 1.2 / 2 / 2 | 0 / 1 / 3 | 0.0 | — |
| `mom/list [mở]` | 250 | 0 | 43 | 83 | 1.0 / 1 / 2 | 0 / 0 / 3 | 0.0 | — |
| `presence [mở]` | 250 | 0 | 43 | 81 | 1.0 / 1 / 1 | 0 / 0 / 0 | 3.0 | — |

🔒 = lệnh nộp (ngân sách truy vấn 15). Thời gian p50/p95 là thời gian máy khách đo (gồm cả xếp hàng ở Worker cục bộ), không phải thời gian D1 thật.

## 2. Lệnh VƯỢT ngân sách

| Lệnh | Vượt truy vấn | Vượt dòng đọc | Truy vấn max (trần) | Dòng đọc max (trần 2.000) |
|---|---:|---:|---|---|
| `game-v2/recommendations [Đảo]` | 100/100 | 100/100 | 67 (8) | 192.685 |
| `game-v2/start [Đảo]` | 100/100 | 100/100 | 65 (8) | 51.832 |
| `game-v2/so-tay [Đảo]` | 100/100 | 97/100 | 30 (8) | 29.801 |
| `hs/thi-dua-hom-nay [nền]` | 0/694 | 50/694 | 7 (8) | 26.270 |
| `hs/thi-dua-hom-nay [mở]` | 0/250 | 10/250 | 8 (8) | 21.858 |
| `btvn/xong-lo [nộp chặng]` | 243/243 | 217/243 | 88 (15) | 14.175 |
| `hs/ke-hoach-ngay [sau ghi]` | 435/435 | 352/435 | 69 (8) | 13.765 |
| `hs/ke-hoach-ngay [nền]` | 661/694 | 468/694 | 70 (8) | 10.140 |
| `hs/ke-hoach-ngay [dựng đầu ngày]` | 250/250 | 167/250 | 69 (8) | 10.112 |
| `hs/ke-hoach-ngay [mở]` | 168/250 | 111/250 | 62 (8) | 10.112 |
| `hs/on-lai/nop [nộp ôn]` | 192/192 | 192/192 | 40 (15) | 9.668 |
| `game-v2/profile [Đảo]` | 250/250 | 249/250 | 11 (8) | 5.687 |
| `btvn/cua-em [chặng]` | 174/243 | 0/243 | 11 (8) | 1.634 |
| `game-v2/answer [Đảo]` | 5/468 | 0/468 | 22 (15) | 866 |
| `game-v2/academic-sync [nền]` | 694/694 | 0/694 | 11 (8) | 571 |
| `game-v2/academic-sync [mở]` | 250/250 | 0/250 | 13 (8) | 571 |

## 3. Top 15 truy vấn theo tổng dòng đọc

| # | Dòng đọc tổng | Số lần | Dòng/lần | Lệnh gọi nhiều nhất | Khung câu SQL |
|---:|---:|---:|---:|---|---|
| 1 | 2.036.565 | 2.505 | 813 | hs/ke-hoach-ngay [nền], game-v2/answer [Đảo] | `SELECT ca.ma_ca,ca.bank_r2,ca.cap_nhat_luc,ca.trang_thai,ca.cong_bo,ca.het_han_vao,ca.thoi_gian_phut,ca.loai,ca.han_nop,ca.bat_dau, (SELECT COUNT(*) …` |
| 2 | 1.333.479 | 1.680 | 794 | game-v2/recommendations [Đảo], game-v2/start [Đảo] | `SELECT q.ma_de,q.qid,q.json FROM json_each(?) j JOIN game_v2_question q ON q.ma_de=json_extract(j.value,'$[0]') AND q.qid=json_extract(j.value,'$[1]'…` |
| 3 | 1.140.707 | 247 | 4.618 | game-v2/recommendations [Đảo], game-v2/start [Đảo] | `SELECT q.dang,q.ma_de,q.qid FROM game_v2_question q JOIN de_kho d ON d.ma_de=q.ma_de JOIN game_v2_index g ON g.ma_de=d.ma_de AND g.source_version=d.c…` |
| 4 | 1.082.294 | 450 | 2.405 | game-v2/profile [Đảo], game-v2/recommendations [Đảo] | `SELECT (SELECT COUNT(*) FROM btvn_em be JOIN btvn b ON b.ma_btvn = be.ma_btvn WHERE be.sbd = ? AND be.nop_luc IS NULL AND b.da_xoa = 0 AND COALESCE(b…` |
| 5 | 813.214 | 2.937 | 277 | hs/ke-hoach-ngay [nền], btvn/xong-lo [nộp chặng] | `SELECT qid, MIN(dang) AS dang FROM game_v2_question WHERE dang IS NOT NULL AND qid IN (SELECT value FROM json_each(?)) GROUP BY qid` |
| 6 | 704.582 | 944 | 746 | hs/thi-dua-hom-nay [nền], hs/thi-dua-hom-nay [mở] | `SELECT sbd, ngay_vn, COUNT(*) AS n, MAX(luc1) AS luc FROM ( SELECT sbd, ngay_vn, qid, MIN(luc) AS luc1 FROM su_kien_hoc WHERE sbd IN (SELECT value FR…` |
| 7 | 602.847 | 2.937 | 205 | hs/ke-hoach-ngay [nền], btvn/xong-lo [nộp chặng] | `SELECT qid, chuyen_de FROM cau_hoi WHERE COALESCE(chuyen_de,'') <> '' AND qid IN (SELECT value FROM json_each(?))` |
| 8 | 597.123 | 1.514 | 394 | hs/ke-hoach-ngay [nền], hs/ke-hoach-ngay [sau ghi] | `SELECT 'g' AS k, giay AS a, NULL AS b FROM (SELECT giay FROM su_kien_hoc WHERE sbd = ? AND giay IS NOT NULL AND ngay_vn >= ? ORDER BY luc DESC LIMIT …` |
| 9 | 561.128 | 1.949 | 288 | hs/ke-hoach-ngay [nền], hs/ke-hoach-ngay [sau ghi] | `SELECT l.ma_ca, c.ten_ca, l.lan_thu, l.nop_luc, l.diem_i, l.diem_ii, l.diem_iii FROM luot l JOIN ca c ON c.ma_ca = l.ma_ca WHERE l.sbd = ? AND l.tran…` |
| 10 | 548.724 | 944 | 581 | notifications/list [nền], notifications/list [mở] | `SELECT * FROM (SELECT e.sbd,'btvn:'\|\|e.khoa id,'Bài tập mới từ Thầy' title,b.ma_de body,'btvn' target,b.giao_luc created_at,b.han_nop deadline FROM b…` |
| 11 | 500.320 | 944 | 530 | hs/thi-dua-hom-nay [nền], hs/thi-dua-hom-nay [mở] | `SELECT sbd, ho_ten, lop, ten_lop, 1 AS uu FROM hoc_sinh WHERE COALESCE(trang_thai, '') <> 'khoa' UNION ALL SELECT sbd, ho_ten, lop, NULL AS ten_lop, …` |
| 12 | 490.656 | 1.949 | 252 | hs/ke-hoach-ngay [nền], hs/ke-hoach-ngay [sau ghi] | `SELECT khoa, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, ma_dang, chuyen_de FROM su_kien_hoc WHERE sbd = ? ORDER BY luc, khoa` |
| 13 | 474.101 | 203 | 2.335 | game-v2/recommendations [Đảo], game-v2/start [Đảo] | `SELECT DISTINCT q.dang AS dang FROM chi_tiet_cau cc JOIN ca c ON c.ma_ca = cc.ma_ca JOIN game_v2_question q ON q.qid = cc.qid WHERE cc.sbd IN (SELECT…` |
| 14 | 367.034 | 1.876 | 196 | hs/ke-hoach-ngay [nền], hs/ke-hoach-ngay [sau ghi] | `SELECT qid, MIN(json_extract(json, '$.phan')) AS phan, MIN(json_extract(json, '$.sao')) AS sao FROM game_v2_question WHERE qid IN (SELECT value FROM …` |
| 15 | 259.909 | 1.060 | 245 | btvn/xong-lo [nộp chặng], hs/on-lai/nop [nộp ôn] | `SELECT khoa, sbd, qid, nguon, ket_qua, giay, luc, ngay_vn, ma_dang, chuyen_de FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?)) ORDER BY…` |

## 4. Tải D1 (ước lượng)

- Tổng thời gian D1 ghi nhận (`meta.duration` của D1 cục bộ): 16.29 giây trong 658 giây chạy thật ⇒ ~1.5 giây D1 / phút ở tải thật. D1 cục bộ là SQLite trong bộ nhớ đệm, **nhanh hơn D1 thật nhiều lần**: dùng SỐ TRUY VẤN và SỐ DÒNG ĐỌC làm thước đo chính, không dùng mili-giây.
- Mỗi dòng đọc trên D1 thật tính tiền/tải như nhau; lệnh nào đọc > 2.000 dòng là ứng viên chỉ mục hoặc đệm.

## Ghi chú đo

- Đăng nhập được 250/250 em giả (bước thiết lập, không tính vào bảng).
- Chặng: 243 em thử làm, 243 nộp được, 7 lỗi/không có bài. Ôn: 192 em có việc ôn (nộp được 192), 58 em không có câu tới hạn. Đảo: 250 em thử, 78 xong lượt, 22 hết lượt/không có câu.
- Lỗi/từ chối hay gặp (không phải lỗi bộ đo — nhiều là đúng luật máy chủ): Đảo start không có câu: Hôm nay em đã dùng hết lượt thần thú. Mai thú chờ em. ×22 · chặng: em không có bài về nhà chưa nộp ×7
- Đáp án của em giả là NGẪU NHIÊN; thời gian "làm" giữa các bước là ngẫu nhiên. D1 cục bộ nhanh hơn D1 thật: số truy vấn và dòng đọc là thước đo chính.
- Cây mã: commit 176c540 (worktree sạch); bộ đệm mô-đun của Worker bắt đầu TRỐNG (như vừa đẩy bản mới).

