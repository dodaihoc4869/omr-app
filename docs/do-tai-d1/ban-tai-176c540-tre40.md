# Bản đo tải giả — 176c540-tre40

Bộ bắn tải giả `scripts/ban-tai-gia/` (Code 1). Chạy lúc 2026-09-21 22:18:09 (giờ VN). **D1 CỤC BỘ** nạp từ bản sao lưu `omr-d1-20260921-1807-truoc-929aad6.sql`; Worker = mã tại commit `176c540-tre40` bọc vỏ đo (`vo-do.ts`); **không** bắn vào máy chủ thật.

- **Mô phỏng:** 250 em × 6 phút giờ cao điểm (chạy thật 380 giây): mở app (kế hoạch ngày, bài về nhà, Thi đua, thông báo…), hỏi nền mỗi 180 giây, làm + nộp 1 chặng, ôn 3 câu, 1 lượt Đảo.
- **Tổng:** 7.899 lượt gọi · 124.990 truy vấn D1 · 12.448.463 dòng đọc · trung bình 15.8 truy vấn và 1.576 dòng đọc mỗi lượt.
- **Độ trễ giả D1:** +40 ms mỗi truy vấn (mỗi batch một lần) — p50/p95 dưới đây phản ánh số TRUY VẤN TUẦN TỰ; không mô hình hàng đợi một luồng của D1.
- **Ngân sách (Boss):** ≤ 8 truy vấn và ≤ 2.000 dòng đọc mỗi lượt; lệnh nộp ≤ 15 truy vấn.
- **Kết luận:** ❌ **16/32 lệnh VƯỢT ngân sách** (xem mục 2).

## 1. Bảng theo lệnh (xếp theo tổng dòng đọc giảm dần)

| Lệnh | Lượt | Lỗi | p50 ms | p95 ms | Truy vấn TB / p95 / max | Dòng đọc TB / p95 / max | Dòng ghi TB | Vượt |
|---|---:|---:|---:|---:|---|---|---:|---|
| `game-v2/recommendations [Đảo]` | 83 | 0 | 2.275 | 3.537 | 39.4 / 49 / 62 | 20.680 / 36.180 / 190.365 | 6.5 | ❌ 83 lượt > 8 tv; 83 lượt > 2.000 dòng |
| `game-v2/start [Đảo]` | 83 | 0 | 2.421 | 3.360 | 42.6 / 53 / 58 | 20.635 / 33.362 / 41.735 | 2.5 | ❌ 83 lượt > 8 tv; 83 lượt > 2.000 dòng |
| `hs/ke-hoach-ngay [sau ghi]` | 433 | 0 | 1.702 | 2.537 | 61.9 / 66 / 69 | 3.649 / 6.579 / 13.765 | 1.4 | ❌ 432 lượt > 8 tv; 347 lượt > 2.000 dòng |
| `btvn/xong-lo [nộp chặng]` 🔒 | 243 | 0 | 2.740 | 3.259 | 81.0 / 86 / 89 | 5.230 / 8.979 / 14.175 | 131.1 | ❌ 243 lượt > 15 tv; 217 lượt > 2.000 dòng |
| `hs/ke-hoach-ngay [dựng đầu ngày]` | 250 | 0 | 1.665 | 1.860 | 59.6 / 62 / 69 | 3.315 / 6.299 / 10.112 | 2.8 | ❌ 250 lượt > 8 tv; 167 lượt > 2.000 dòng |
| `game-v2/so-tay [Đảo]` | 83 | 0 | 918 | 1.783 | 16.0 / 21 / 31 | 9.899 / 17.910 / 33.108 | 0.0 | ❌ 83 lượt > 8 tv; 83 lượt > 2.000 dòng |
| `hs/ke-hoach-ngay [mở]` | 250 | 0 | 1.448 | 1.653 | 51.1 / 62 / 63 | 2.847 / 5.598 / 10.112 | 0.9 | ❌ 223 lượt > 8 tv; 156 lượt > 2.000 dòng |
| `hs/on-lai/nop [nộp ôn]` 🔒 | 190 | 0 | 1.725 | 2.376 | 35.7 / 39 / 40 | 3.683 / 5.518 / 9.469 | 52.3 | ❌ 190 lượt > 15 tv; 190 lượt > 2.000 dòng |
| `hs/ke-hoach-ngay [nền]` | 250 | 0 | 1.782 | 2.264 | 52.2 / 62 / 68 | 2.761 / 5.911 / 10.111 | 1.0 | ❌ 219 lượt > 8 tv; 154 lượt > 2.000 dòng |
| `game-v2/profile [Đảo]` | 213 | 0 | 503 | 748 | 9.5 / 10 / 11 | 2.474 / 2.933 / 5.687 | 0.0 | ❌ 213 lượt > 8 tv; 212 lượt > 2.000 dòng |
| `hs/thi-dua-hom-nay [nền]` | 250 | 0 | 305 | 420 | 5.4 / 6 / 8 | 1.460 / 6.464 / 25.197 | 0.0 | ❌ 18 lượt > 2.000 dòng |
| `hs/thi-dua-hom-nay [mở]` | 250 | 0 | 246 | 317 | 5.3 / 6 / 8 | 1.050 / 1.153 / 21.825 | 0.0 | ❌ 10 lượt > 2.000 dòng |
| `game-v2/answer [Đảo]` 🔒 | 226 | 0 | 496 | 933 | 10.5 / 11 / 22 | 824 / 824 / 868 | 12.5 | ❌ 3 lượt > 15 tv |
| `btvn/cua-em [chặng]` | 243 | 0 | 231 | 268 | 8.0 / 10 / 10 | 750 / 1.406 / 1.634 | 92.9 | ❌ 174 lượt > 8 tv |
| `hs/cau-theo-qid [ôn]` | 190 | 0 | 180 | 260 | 3.4 / 4 / 4 | 845 / 851 / 862 | 0.0 | — |
| `notifications/list [nền]` | 250 | 0 | 197 | 297 | 3.4 / 4 / 5 | 585 / 588 / 593 | 0.0 | — |
| `notifications/list [mở]` | 250 | 0 | 154 | 222 | 3.3 / 4 / 5 | 585 / 588 / 591 | 0.0 | — |
| `hs/lich-su [mở]` | 250 | 0 | 103 | 131 | 1.9 / 2 / 3 | 484 / 623 / 921 | 0.0 | — |
| `game-v2/academic-sync [nền]` | 250 | 0 | 368 | 524 | 9.4 / 10 / 11 | 334 / 362 / 571 | 1.0 | ❌ 250 lượt > 8 tv |
| `game-v2/academic-sync [mở]` | 250 | 0 | 405 | 499 | 10.9 / 13 / 13 | 334 / 362 / 571 | 2.1 | ❌ 250 lượt > 8 tv |
| `daily-honors [mở]` | 250 | 0 | 151 | 184 | 3.0 / 3 / 4 | 266 / 266 / 271 | 0.0 | — |
| `daily-honors [nền]` | 250 | 0 | 179 | 249 | 3.0 / 3 / 4 | 266 / 266 / 271 | 0.0 | — |
| `hs/ca-dang-mo [nền]` | 250 | 0 | 149 | 228 | 2.4 / 3 / 4 | 29 / 31 / 36 | 0.0 | — |
| `hs/ca-dang-mo [mở]` | 250 | 0 | 110 | 173 | 2.3 / 3 / 4 | 29 / 31 / 36 | 0.0 | — |
| `hs/btvn [mở]` | 250 | 0 | 48 | 59 | 1.0 / 1 / 1 | 7 / 8 / 8 | 0.0 | — |
| `presence [nền]` | 1061 | 0 | 53 | 110 | 1.0 / 1 / 2 | 1 / 1 / 6 | 2.0 | — |
| `game-v2/complete [Đảo]` 🔒 | 18 | 0 | 688 | 1.624 | 13.4 / 15 / 15 | 49 / 73 / 73 | 0.0 | — |
| `game-v2/resume [Đảo]` | 83 | 0 | 174 | 276 | 3.0 / 3 / 4 | 3 / 3 / 4 | 0.0 | — |
| `hs/thu-thach-hom-nay [mở]` | 250 | 0 | 108 | 171 | 2.3 / 3 / 4 | 1 / 2 / 6 | 0.0 | — |
| `mom/list [nền]` | 250 | 0 | 85 | 165 | 1.4 / 2 / 3 | 0 / 1 / 6 | 0.0 | — |
| `mom/list [mở]` | 250 | 0 | 60 | 122 | 1.3 / 2 / 3 | 0 / 1 / 6 | 0.0 | — |
| `presence [mở]` | 250 | 0 | 53 | 81 | 1.0 / 1 / 2 | 0 / 0 / 5 | 3.0 | — |

🔒 = lệnh nộp (ngân sách truy vấn 15). Thời gian p50/p95 là thời gian máy khách đo (gồm cả xếp hàng ở Worker cục bộ), không phải thời gian D1 thật.

## 2. Lệnh VƯỢT ngân sách

| Lệnh | Vượt truy vấn | Vượt dòng đọc | Truy vấn max (trần) | Dòng đọc max (trần 2.000) |
|---|---:|---:|---|---|
| `game-v2/recommendations [Đảo]` | 83/83 | 83/83 | 62 (8) | 190.365 |
| `game-v2/start [Đảo]` | 83/83 | 83/83 | 58 (8) | 41.735 |
| `game-v2/so-tay [Đảo]` | 83/83 | 83/83 | 31 (8) | 33.108 |
| `hs/thi-dua-hom-nay [nền]` | 0/250 | 18/250 | 8 (8) | 25.197 |
| `hs/thi-dua-hom-nay [mở]` | 0/250 | 10/250 | 8 (8) | 21.825 |
| `btvn/xong-lo [nộp chặng]` | 243/243 | 217/243 | 89 (15) | 14.175 |
| `hs/ke-hoach-ngay [sau ghi]` | 432/433 | 347/433 | 69 (8) | 13.765 |
| `hs/ke-hoach-ngay [dựng đầu ngày]` | 250/250 | 167/250 | 69 (8) | 10.112 |
| `hs/ke-hoach-ngay [mở]` | 223/250 | 156/250 | 63 (8) | 10.112 |
| `hs/ke-hoach-ngay [nền]` | 219/250 | 154/250 | 68 (8) | 10.111 |
| `hs/on-lai/nop [nộp ôn]` | 190/190 | 190/190 | 40 (15) | 9.469 |
| `game-v2/profile [Đảo]` | 213/213 | 212/213 | 11 (8) | 5.687 |
| `btvn/cua-em [chặng]` | 174/243 | 0/243 | 10 (8) | 1.634 |
| `game-v2/answer [Đảo]` | 3/226 | 0/226 | 22 (15) | 868 |
| `game-v2/academic-sync [nền]` | 250/250 | 0/250 | 11 (8) | 571 |
| `game-v2/academic-sync [mở]` | 250/250 | 0/250 | 13 (8) | 571 |

## 3. Top 15 truy vấn theo tổng dòng đọc

| # | Dòng đọc tổng | Số lần | Dòng/lần | Lệnh gọi nhiều nhất | Khung câu SQL |
|---:|---:|---:|---:|---|---|
| 1 | 1.585.350 | 1.950 | 813 | hs/ke-hoach-ngay [sau ghi], game-v2/answer [Đảo] | `SELECT ca.ma_ca,ca.bank_r2,ca.cap_nhat_luc,ca.trang_thai,ca.cong_bo,ca.het_han_vao,ca.thoi_gian_phut,ca.loai,ca.han_nop,ca.bat_dau, (SELECT COUNT(*) …` |
| 2 | 1.266.951 | 1.617 | 784 | game-v2/start [Đảo], game-v2/recommendations [Đảo] | `SELECT q.ma_de,q.qid,q.json FROM json_each(?) j JOIN game_v2_question q ON q.ma_de=json_extract(j.value,'$[0]') AND q.qid=json_extract(j.value,'$[1]'…` |
| 3 | 1.091.432 | 240 | 4.548 | game-v2/start [Đảo], game-v2/recommendations [Đảo] | `SELECT q.dang,q.ma_de,q.qid FROM game_v2_question q JOIN de_kho d ON d.ma_de=q.ma_de JOIN game_v2_index g ON g.ma_de=d.ma_de AND g.source_version=d.c…` |
| 4 | 909.895 | 379 | 2.401 | game-v2/profile [Đảo], game-v2/recommendations [Đảo] | `SELECT (SELECT COUNT(*) FROM btvn_em be JOIN btvn b ON b.ma_btvn = be.ma_btvn WHERE be.sbd = ? AND be.nop_luc IS NULL AND b.da_xoa = 0 AND COALESCE(b…` |
| 5 | 679.518 | 2.454 | 277 | btvn/xong-lo [nộp chặng], hs/ke-hoach-ngay [sau ghi] | `SELECT qid, MIN(dang) AS dang FROM game_v2_question WHERE dang IS NOT NULL AND qid IN (SELECT value FROM json_each(?)) GROUP BY qid` |
| 6 | 504.031 | 2.454 | 205 | btvn/xong-lo [nộp chặng], hs/ke-hoach-ngay [sau ghi] | `SELECT qid, chuyen_de FROM cau_hoi WHERE COALESCE(chuyen_de,'') <> '' AND qid IN (SELECT value FROM json_each(?))` |
| 7 | 465.291 | 169 | 2.753 | game-v2/recommendations [Đảo], game-v2/start [Đảo] | `SELECT DISTINCT q.dang AS dang FROM chi_tiet_cau cc JOIN ca c ON c.ma_ca = cc.ma_ca JOIN game_v2_question q ON q.qid = cc.qid WHERE cc.sbd IN (SELECT…` |
| 8 | 448.820 | 1.557 | 288 | hs/ke-hoach-ngay [sau ghi], hs/ke-hoach-ngay [dựng đầu ngày] | `SELECT l.ma_ca, c.ten_ca, l.lan_thu, l.nop_luc, l.diem_i, l.diem_ii, l.diem_iii FROM luot l JOIN ca c ON c.ma_ca = l.ma_ca WHERE l.sbd = ? AND l.tran…` |
| 9 | 445.263 | 1.124 | 396 | hs/ke-hoach-ngay [sau ghi], hs/ke-hoach-ngay [dựng đầu ngày] | `SELECT 'g' AS k, giay AS a, NULL AS b FROM (SELECT giay FROM su_kien_hoc WHERE sbd = ? AND giay IS NOT NULL AND ngay_vn >= ? ORDER BY luc DESC LIMIT …` |
| 10 | 393.520 | 1.557 | 253 | hs/ke-hoach-ngay [sau ghi], hs/ke-hoach-ngay [dựng đầu ngày] | `SELECT khoa, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, ma_dang, chuyen_de FROM su_kien_hoc WHERE sbd = ? ORDER BY luc, khoa` |
| 11 | 324.675 | 500 | 649 | hs/thi-dua-hom-nay [mở], hs/thi-dua-hom-nay [nền] | `SELECT sbd, ngay_vn, COUNT(*) AS n, MAX(luc1) AS luc FROM ( SELECT sbd, ngay_vn, qid, MIN(luc) AS luc1 FROM su_kien_hoc WHERE sbd IN (SELECT value FR…` |
| 12 | 296.872 | 1.487 | 200 | hs/ke-hoach-ngay [sau ghi], btvn/xong-lo [nộp chặng] | `SELECT qid, MIN(json_extract(json, '$.phan')) AS phan, MIN(json_extract(json, '$.sao')) AS sao FROM game_v2_question WHERE qid IN (SELECT value FROM …` |
| 13 | 290.638 | 500 | 581 | notifications/list [mở], notifications/list [nền] | `SELECT * FROM (SELECT e.sbd,'btvn:'\|\|e.khoa id,'Bài tập mới từ Thầy' title,b.ma_de body,'btvn' target,b.giao_luc created_at,b.han_nop deadline FROM b…` |
| 14 | 265.000 | 500 | 530 | hs/thi-dua-hom-nay [mở], hs/thi-dua-hom-nay [nền] | `SELECT sbd, ho_ten, lop, ten_lop, 1 AS uu FROM hoc_sinh WHERE COALESCE(trang_thai, '') <> 'khoa' UNION ALL SELECT sbd, ho_ten, lop, NULL AS ten_lop, …` |
| 15 | 233.478 | 969 | 241 | btvn/xong-lo [nộp chặng], hs/on-lai/nop [nộp ôn] | `SELECT khoa, sbd, qid, nguon, ket_qua, giay, luc, ngay_vn, ma_dang, chuyen_de FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?)) ORDER BY…` |

## 4. Tải D1 (ước lượng)

- Tổng thời gian D1 ghi nhận (`meta.duration` của D1 cục bộ): 16.36 giây trong 380 giây chạy thật ⇒ ~2.6 giây D1 / phút ở tải thật. D1 cục bộ là SQLite trong bộ nhớ đệm, **nhanh hơn D1 thật nhiều lần**: dùng SỐ TRUY VẤN và SỐ DÒNG ĐỌC làm thước đo chính, không dùng mili-giây.
- Mỗi dòng đọc trên D1 thật tính tiền/tải như nhau; lệnh nào đọc > 2.000 dòng là ứng viên chỉ mục hoặc đệm.

## Ghi chú đo

- Đăng nhập được 250/250 em giả (bước thiết lập, không tính vào bảng).
- Chặng: 243 em thử làm, 243 nộp được, 7 lỗi/không có bài. Ôn: 190 em có việc ôn (nộp được 190), 60 em không có câu tới hạn. Đảo: 213 em thử, 18 xong lượt, 15 hết lượt/không có câu.
- Lỗi/từ chối hay gặp (không phải lỗi bộ đo — nhiều là đúng luật máy chủ): Đảo start không có câu: Hôm nay em đã dùng hết lượt thần thú. Mai thú chờ em. ×15 · chặng: em không có bài về nhà chưa nộp ×7
- Đáp án của em giả là NGẪU NHIÊN; thời gian "làm" giữa các bước là ngẫu nhiên. D1 cục bộ nhanh hơn D1 thật: số truy vấn và dòng đọc là thước đo chính.
- ĐỘ TRỄ GIẢ D1: mỗi truy vấn chờ thêm 40 ms (mỗi batch một lần); KHÔNG mô hình hàng đợi một luồng của D1 ⇒ p50/p95 chỉ để SO SÁNH tương đối giữa các commit.
- Cây mã: commit 176c540 (worktree sạch); bộ đệm mô-đun của Worker bắt đầu TRỐNG (như vừa đẩy bản mới).

