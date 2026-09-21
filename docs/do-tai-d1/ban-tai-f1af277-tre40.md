# Bản đo tải giả — f1af277-tre40

Bộ bắn tải giả `scripts/ban-tai-gia/` (Code 1). Chạy lúc 2026-09-21 22:10:52 (giờ VN). **D1 CỤC BỘ** nạp từ bản sao lưu `omr-d1-20260921-1807-truoc-929aad6.sql`; Worker = mã tại commit `f1af277-tre40` bọc vỏ đo (`vo-do.ts`); **không** bắn vào máy chủ thật.

- **Mô phỏng:** 250 em × 6 phút giờ cao điểm (chạy thật 356 giây): mở app (kế hoạch ngày, bài về nhà, Thi đua, thông báo…), hỏi nền mỗi 180 giây, làm + nộp 1 chặng, ôn 3 câu, 1 lượt Đảo.
- **Tổng:** 7.320 lượt gọi · 120.935 truy vấn D1 · 11.287.480 dòng đọc · trung bình 16.5 truy vấn và 1.542 dòng đọc mỗi lượt.
- **Độ trễ giả D1:** +40 ms mỗi truy vấn (mỗi batch một lần) — p50/p95 dưới đây phản ánh số TRUY VẤN TUẦN TỰ; không mô hình hàng đợi một luồng của D1.
- **Ngân sách (Boss):** ≤ 8 truy vấn và ≤ 2.000 dòng đọc mỗi lượt; lệnh nộp ≤ 15 truy vấn.
- **Kết luận:** ❌ **15/32 lệnh VƯỢT ngân sách** (xem mục 2).

## 1. Bảng theo lệnh (xếp theo tổng dòng đọc giảm dần)

| Lệnh | Lượt | Lỗi | p50 ms | p95 ms | Truy vấn TB / p95 / max | Dòng đọc TB / p95 / max | Dòng ghi TB | Vượt |
|---|---:|---:|---:|---:|---|---|---:|---|
| `hs/ke-hoach-ngay [sau ghi]` | 416 | 0 | 6.443 | 42.811 | 62.0 / 69 / 73 | 3.659 / 6.788 / 14.485 | 213.3 | ❌ 409 lượt > 8 tv; 329 lượt > 2.000 dòng |
| `game-v2/recommendations [Đảo]` | 64 | 0 | 26.053 | 35.079 | 40.3 / 49 / 60 | 22.457 / 41.953 / 184.619 | 13.3 | ❌ 64 lượt > 8 tv; 64 lượt > 2.000 dòng |
| `btvn/xong-lo [nộp chặng]` 🔒 | 243 | 0 | 3.811 | 19.156 | 84.1 / 90 / 92 | 5.568 / 9.643 / 14.869 | 911.3 | ❌ 243 lượt > 15 tv; 217 lượt > 2.000 dòng |
| `game-v2/start [Đảo]` | 64 | 0 | 18.790 | 35.567 | 41.9 / 51 / 58 | 19.078 / 31.650 / 42.241 | 2.5 | ❌ 64 lượt > 8 tv; 64 lượt > 2.000 dòng |
| `hs/ke-hoach-ngay [dựng đầu ngày]` | 250 | 0 | 2.704 | 2.867 | 60.8 / 64 / 72 | 3.402 / 6.374 / 10.112 | 206.6 | ❌ 250 lượt > 8 tv; 169 lượt > 2.000 dòng |
| `hs/ke-hoach-ngay [mở]` | 250 | 0 | 2.545 | 2.794 | 53.6 / 62 / 63 | 2.910 / 5.599 / 10.112 | 0.9 | ❌ 233 lượt > 8 tv; 157 lượt > 2.000 dòng |
| `hs/ke-hoach-ngay [nền]` | 250 | 1 | 27.151 | 40.861 | 53.0 / 66 / 73 | 2.820 / 5.539 / 14.485 | 33.8 | ❌ 220 lượt > 8 tv; 162 lượt > 2.000 dòng |
| `hs/on-lai/nop [nộp ôn]` 🔒 | 173 | 0 | 20.253 | 24.319 | 36.6 / 40 / 43 | 3.860 / 5.867 / 9.995 | 546.2 | ❌ 173 lượt > 15 tv; 172 lượt > 2.000 dòng |
| `game-v2/so-tay [Đảo]` | 64 | 0 | 10.741 | 15.537 | 16.0 / 19 / 25 | 9.680 / 15.913 / 22.489 | 0.0 | ❌ 64 lượt > 8 tv; 63 lượt > 2.000 dòng |
| `game-v2/profile [Đảo]` | 174 | 0 | 6.201 | 8.197 | 9.4 / 10 / 11 | 2.447 / 2.742 / 4.066 | 0.0 | ❌ 174 lượt > 8 tv; 174 lượt > 2.000 dòng |
| `hs/thi-dua-hom-nay [nền]` | 250 | 1 | 2.796 | 5.135 | 5.4 / 6 / 7 | 1.646 / 6.634 / 25.074 | 0.0 | ❌ 24 lượt > 2.000 dòng |
| `hs/thi-dua-hom-nay [mở]` | 250 | 0 | 281 | 343 | 5.6 / 6 / 8 | 1.027 / 1.061 / 21.821 | 0.0 | ❌ 9 lượt > 2.000 dòng |
| `btvn/cua-em [chặng]` | 243 | 0 | 237 | 309 | 8.0 / 10 / 11 | 750 / 1.408 / 1.634 | 92.9 | ❌ 174 lượt > 8 tv |
| `notifications/list [mở]` | 250 | 0 | 190 | 238 | 3.5 / 4 / 5 | 586 / 588 / 590 | 0.0 | — |
| `hs/cau-theo-qid [ôn]` | 173 | 0 | 2.026 | 3.756 | 3.4 / 4 / 5 | 845 / 854 / 862 | 0.0 | — |
| `notifications/list [nền]` | 250 | 1 | 2.003 | 3.599 | 3.3 / 4 / 4 | 583 / 588 / 590 | 0.0 | — |
| `hs/lich-su [mở]` | 250 | 0 | 102 | 136 | 1.9 / 2 / 3 | 484 / 623 / 921 | 0.0 | — |
| `game-v2/academic-sync [mở]` | 250 | 0 | 559 | 679 | 11.1 / 13 / 13 | 335 / 362 / 571 | 2.1 | ❌ 250 lượt > 8 tv |
| `game-v2/academic-sync [nền]` | 250 | 2 | 4.659 | 7.865 | 9.3 / 10 / 10 | 333 / 362 / 570 | 1.0 | ❌ 249 lượt > 8 tv |
| `daily-honors [nền]` | 250 | 0 | 1.916 | 3.576 | 3.0 / 3 / 4 | 266 / 266 / 271 | 0.0 | — |
| `daily-honors [mở]` | 250 | 0 | 154 | 192 | 3.0 / 3 / 4 | 266 / 266 / 271 | 0.0 | — |
| `game-v2/answer [Đảo]` 🔒 | 36 | 0 | 6.863 | 9.038 | 10.5 / 12 / 12 | 824 / 828 / 829 | 12.4 | — |
| `hs/ca-dang-mo [mở]` | 250 | 0 | 146 | 188 | 2.5 / 3 / 4 | 30 / 31 / 36 | 0.0 | — |
| `hs/ca-dang-mo [nền]` | 250 | 1 | 1.535 | 2.978 | 2.4 / 3 / 4 | 29 / 31 / 36 | 0.0 | — |
| `hs/btvn [mở]` | 250 | 0 | 49 | 68 | 1.0 / 1 / 1 | 7 / 8 / 8 | 0.0 | — |
| `presence [nền]` | 855 | 1 | 105 | 2.177 | 1.0 / 1 / 2 | 1 / 1 / 6 | 2.0 | — |
| `hs/thu-thach-hom-nay [mở]` | 250 | 0 | 145 | 187 | 2.6 / 3 / 4 | 1 / 2 / 6 | 0.0 | — |
| `game-v2/resume [Đảo]` | 64 | 0 | 2.691 | 4.170 | 3.2 / 4 / 5 | 3 / 4 / 9 | 0.0 | — |
| `mom/list [mở]` | 250 | 0 | 97 | 130 | 1.6 / 2 / 3 | 1 / 1 / 6 | 0.0 | — |
| `mom/list [nền]` | 250 | 1 | 1.134 | 2.337 | 1.4 / 2 / 2 | 0 / 1 / 5 | 0.0 | — |
| `game-v2/complete [Đảo]` 🔒 | 1 | 0 | 11.087 | 11.087 | 14.0 / 14 / 14 | 67 / 67 / 67 | 0.0 | — |
| `presence [mở]` | 250 | 0 | 55 | 86 | 1.0 / 1 / 2 | 0 / 0 / 5 | 3.0 | — |

🔒 = lệnh nộp (ngân sách truy vấn 15). Thời gian p50/p95 là thời gian máy khách đo (gồm cả xếp hàng ở Worker cục bộ), không phải thời gian D1 thật.

## 2. Lệnh VƯỢT ngân sách

| Lệnh | Vượt truy vấn | Vượt dòng đọc | Truy vấn max (trần) | Dòng đọc max (trần 2.000) |
|---|---:|---:|---|---|
| `game-v2/recommendations [Đảo]` | 64/64 | 64/64 | 60 (8) | 184.619 |
| `game-v2/start [Đảo]` | 64/64 | 64/64 | 58 (8) | 42.241 |
| `hs/thi-dua-hom-nay [nền]` | 0/250 | 24/250 | 7 (8) | 25.074 |
| `game-v2/so-tay [Đảo]` | 64/64 | 63/64 | 25 (8) | 22.489 |
| `hs/thi-dua-hom-nay [mở]` | 0/250 | 9/250 | 8 (8) | 21.821 |
| `btvn/xong-lo [nộp chặng]` | 243/243 | 217/243 | 92 (15) | 14.869 |
| `hs/ke-hoach-ngay [sau ghi]` | 409/416 | 329/416 | 73 (8) | 14.485 |
| `hs/ke-hoach-ngay [nền]` | 220/250 | 162/250 | 73 (8) | 14.485 |
| `hs/ke-hoach-ngay [dựng đầu ngày]` | 250/250 | 169/250 | 72 (8) | 10.112 |
| `hs/ke-hoach-ngay [mở]` | 233/250 | 157/250 | 63 (8) | 10.112 |
| `hs/on-lai/nop [nộp ôn]` | 173/173 | 172/173 | 43 (15) | 9.995 |
| `game-v2/profile [Đảo]` | 174/174 | 174/174 | 11 (8) | 4.066 |
| `btvn/cua-em [chặng]` | 174/243 | 0/243 | 11 (8) | 1.634 |
| `game-v2/academic-sync [mở]` | 250/250 | 0/250 | 13 (8) | 571 |
| `game-v2/academic-sync [nền]` | 249/250 | 0/250 | 10 (8) | 570 |

## 3. Top 15 truy vấn theo tổng dòng đọc

| # | Dòng đọc tổng | Số lần | Dòng/lần | Lệnh gọi nhiều nhất | Khung câu SQL |
|---:|---:|---:|---:|---|---|
| 1 | 1.352.019 | 1.663 | 813 | hs/ke-hoach-ngay [sau ghi], hs/ke-hoach-ngay [dựng đầu ngày] | `SELECT ca.ma_ca,ca.bank_r2,ca.cap_nhat_luc,ca.trang_thai,ca.cong_bo,ca.het_han_vao,ca.thoi_gian_phut,ca.loai,ca.han_nop,ca.bat_dau, (SELECT COUNT(*) …` |
| 2 | 963.195 | 1.242 | 776 | game-v2/start [Đảo], game-v2/recommendations [Đảo] | `SELECT q.ma_de,q.qid,q.json FROM json_each(?) j JOIN game_v2_question q ON q.ma_de=json_extract(j.value,'$[0]') AND q.qid=json_extract(j.value,'$[1]'…` |
| 3 | 873.530 | 196 | 4.457 | game-v2/start [Đảo], game-v2/recommendations [Đảo] | `SELECT q.dang,q.ma_de,q.qid FROM game_v2_question q JOIN de_kho d ON d.ma_de=q.ma_de JOIN game_v2_index g ON g.ma_de=d.ma_de AND g.source_version=d.c…` |
| 4 | 723.417 | 302 | 2.395 | game-v2/profile [Đảo], game-v2/recommendations [Đảo] | `SELECT (SELECT COUNT(*) FROM btvn_em be JOIN btvn b ON b.ma_btvn = be.ma_btvn WHERE be.sbd = ? AND be.nop_luc IS NULL AND b.da_xoa = 0 AND COALESCE(b…` |
| 5 | 660.338 | 2.399 | 275 | btvn/xong-lo [nộp chặng], hs/ke-hoach-ngay [sau ghi] | `SELECT qid, MIN(dang) AS dang FROM game_v2_question WHERE dang IS NOT NULL AND qid IN (SELECT value FROM json_each(?)) GROUP BY qid` |
| 6 | 490.351 | 2.399 | 204 | btvn/xong-lo [nộp chặng], hs/ke-hoach-ngay [sau ghi] | `SELECT qid, chuyen_de FROM cau_hoi WHERE COALESCE(chuyen_de,'') <> '' AND qid IN (SELECT value FROM json_each(?))` |
| 7 | 440.791 | 1.528 | 288 | hs/ke-hoach-ngay [sau ghi], hs/ke-hoach-ngay [dựng đầu ngày] | `SELECT l.ma_ca, c.ten_ca, l.lan_thu, l.nop_luc, l.diem_i, l.diem_ii, l.diem_iii FROM luot l JOIN ca c ON c.ma_ca = l.ma_ca WHERE l.sbd = ? AND l.tran…` |
| 8 | 436.107 | 1.112 | 392 | hs/ke-hoach-ngay [sau ghi], hs/ke-hoach-ngay [dựng đầu ngày] | `SELECT 'g' AS k, giay AS a, NULL AS b FROM (SELECT giay FROM su_kien_hoc WHERE sbd = ? AND giay IS NOT NULL AND ngay_vn >= ? ORDER BY luc DESC LIMIT …` |
| 9 | 400.423 | 133 | 3.011 | game-v2/recommendations [Đảo], game-v2/start [Đảo] | `SELECT DISTINCT q.dang AS dang FROM chi_tiet_cau cc JOIN ca c ON c.ma_ca = cc.ma_ca JOIN game_v2_question q ON q.qid = cc.qid WHERE cc.sbd IN (SELECT…` |
| 10 | 382.924 | 1.528 | 251 | hs/ke-hoach-ngay [sau ghi], hs/ke-hoach-ngay [dựng đầu ngày] | `SELECT khoa, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, ma_dang, chuyen_de FROM su_kien_hoc WHERE sbd = ? ORDER BY luc, khoa` |
| 11 | 363.506 | 499 | 728 | hs/thi-dua-hom-nay [mở], hs/thi-dua-hom-nay [nền] | `SELECT sbd, ngay_vn, COUNT(*) AS n, MAX(luc1) AS luc FROM ( SELECT sbd, ngay_vn, qid, MIN(luc) AS luc1 FROM su_kien_hoc WHERE sbd IN (SELECT value FR…` |
| 12 | 290.057 | 499 | 581 | notifications/list [mở], notifications/list [nền] | `SELECT * FROM (SELECT e.sbd,'btvn:'\|\|e.khoa id,'Bài tập mới từ Thầy' title,b.ma_de body,'btvn' target,b.giao_luc created_at,b.han_nop deadline FROM b…` |
| 13 | 289.408 | 1.467 | 197 | hs/ke-hoach-ngay [sau ghi], btvn/xong-lo [nộp chặng] | `SELECT qid, MIN(json_extract(json, '$.phan')) AS phan, MIN(json_extract(json, '$.sao')) AS sao FROM game_v2_question WHERE qid IN (SELECT value FROM …` |
| 14 | 264.470 | 499 | 530 | hs/thi-dua-hom-nay [mở], hs/thi-dua-hom-nay [nền] | `SELECT sbd, ho_ten, lop, ten_lop, 1 AS uu FROM hoc_sinh WHERE COALESCE(trang_thai, '') <> 'khoa' UNION ALL SELECT sbd, ho_ten, lop, NULL AS ten_lop, …` |
| 15 | 225.942 | 943 | 240 | btvn/xong-lo [nộp chặng], hs/on-lai/nop [nộp ôn] | `SELECT khoa, sbd, qid, nguon, ket_qua, giay, luc, ngay_vn, ma_dang, chuyen_de FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?)) ORDER BY…` |

## 4. Tải D1 (ước lượng)

- Tổng thời gian D1 ghi nhận (`meta.duration` của D1 cục bộ): 18.49 giây trong 356 giây chạy thật ⇒ ~3.1 giây D1 / phút ở tải thật. D1 cục bộ là SQLite trong bộ nhớ đệm, **nhanh hơn D1 thật nhiều lần**: dùng SỐ TRUY VẤN và SỐ DÒNG ĐỌC làm thước đo chính, không dùng mili-giây.
- Mỗi dòng đọc trên D1 thật tính tiền/tải như nhau; lệnh nào đọc > 2.000 dòng là ứng viên chỉ mục hoặc đệm.

## Ghi chú đo

- Đăng nhập được 250/250 em giả (bước thiết lập, không tính vào bảng).
- Chặng: 243 em thử làm, 243 nộp được, 7 lỗi/không có bài. Ôn: 173 em có việc ôn (nộp được 173), 70 em không có câu tới hạn. Đảo: 174 em thử, 1 xong lượt, 11 hết lượt/không có câu.
- Lỗi/từ chối hay gặp (không phải lỗi bộ đo — nhiều là đúng luật máy chủ): Đảo start không có câu: Hôm nay em đã dùng hết lượt thần thú. Mai thú chờ em. ×11 · chặng: em không có bài về nhà chưa nộp ×7 · game-v2/academic-sync [nền] → Hồ sơ vừa đổi trên thiết bị khác. Em tải lại hồ sơ. ×1
- Đáp án của em giả là NGẪU NHIÊN; thời gian "làm" giữa các bước là ngẫu nhiên. D1 cục bộ nhanh hơn D1 thật: số truy vấn và dòng đọc là thước đo chính.
- ĐỘ TRỄ GIẢ D1: mỗi truy vấn chờ thêm 40 ms (mỗi batch một lần); KHÔNG mô hình hàng đợi một luồng của D1 ⇒ p50/p95 chỉ để SO SÁNH tương đối giữa các commit.
- Cây mã: commit f1af277 (worktree sạch); bộ đệm mô-đun của Worker bắt đầu TRỐNG (như vừa đẩy bản mới).

