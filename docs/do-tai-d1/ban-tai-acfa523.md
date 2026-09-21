# Bản đo tải giả — acfa523

Bộ bắn tải giả `scripts/ban-tai-gia/` (Code 1). Chạy lúc 2026-09-21 22:45:01 (giờ VN). **D1 CỤC BỘ** nạp từ bản sao lưu `omr-d1-20260921-1807-truoc-929aad6.sql`; Worker = mã tại commit `acfa523` bọc vỏ đo (`vo-do.ts`); **không** bắn vào máy chủ thật.

- **Mô phỏng:** 250 em × 10 phút giờ cao điểm (chạy thật 659 giây): mở app (kế hoạch ngày, bài về nhà, Thi đua, thông báo…), hỏi nền mỗi 180 giây, làm + nộp 1 chặng, ôn 3 câu, 1 lượt Đảo.
- **Tổng:** 12.575 lượt gọi · 162.705 truy vấn D1 · 11.104.914 dòng đọc · trung bình 12.9 truy vấn và 883 dòng đọc mỗi lượt.
- **Ngân sách (Boss):** ≤ 8 truy vấn và ≤ 2.000 dòng đọc mỗi lượt; lệnh nộp ≤ 15 truy vấn.
- **Kết luận:** ❌ **16/32 lệnh VƯỢT ngân sách** (xem mục 2).

## 1. Bảng theo lệnh (xếp theo tổng dòng đọc giảm dần)

| Lệnh | Lượt | Lỗi | p50 | p95 | Truy vấn TB / p95 / max | Dòng đọc TB / p95 / max | Dòng ghi TB | Vượt |
|---|---:|---:|---:|---:|---|---|---:|---|
| `hs/ke-hoach-ngay [nền]` | 693 | 0 | 50 ms | 125 ms | 57.5 / 69 / 71 | 2.839 / 5.979 / 9.892 | 5.2 | ❌ 658 lượt > 8 tv; 407 lượt > 2.000 dòng |
| `hs/ke-hoach-ngay [sau ghi]` | 433 | 0 | 39 ms | 111 ms | 62.1 / 66 / 69 | 3.404 / 6.259 / 13.517 | 1.4 | ❌ 433 lượt > 8 tv; 301 lượt > 2.000 dòng |
| `btvn/xong-lo [nộp chặng]` 🔒 | 243 | 0 | 64 ms | 120 ms | 81.0 / 86 / 88 | 4.966 / 8.718 / 13.914 | 130.9 | ❌ 243 lượt > 15 tv; 217 lượt > 2.000 dòng |
| `hs/thi-dua-hom-nay [nền]` | 693 | 0 | 67 ms | 117 ms | 5.2 / 6 / 7 | 1.495 / 6.912 / 26.287 | 0.0 | ❌ 50 lượt > 2.000 dòng |
| `game-v2/recommendations [Đảo]` | 100 | 0 | 44 ms | 117 ms | 31.4 / 39 / 52 | 8.667 / 14.396 / 191.057 | 14.0 | ❌ 100 lượt > 8 tv; 97 lượt > 2.000 dòng |
| `hs/ke-hoach-ngay [dựng đầu ngày]` | 250 | 0 | 289 ms | 331 ms | 59.6 / 62 / 69 | 3.054 / 6.038 / 9.851 | 2.8 | ❌ 250 lượt > 8 tv; 143 lượt > 2.000 dòng |
| `hs/on-lai/nop [nộp ôn]` 🔒 | 190 | 0 | 34 ms | 83 ms | 35.6 / 39 / 39 | 3.426 / 5.398 / 9.220 | 51.9 | ❌ 190 lượt > 15 tv; 169 lượt > 2.000 dòng |
| `hs/ke-hoach-ngay [mở]` | 250 | 0 | 40 ms | 121 ms | 38.2 / 61 / 63 | 1.897 / 5.114 / 9.851 | 0.7 | ❌ 168 lượt > 8 tv; 92 lượt > 2.000 dòng |
| `game-v2/start [Đảo]` | 100 | 0 | 44 ms | 95 ms | 32.9 / 35 / 36 | 4.225 / 7.222 / 8.387 | 2.3 | ❌ 100 lượt > 8 tv; 94 lượt > 2.000 dòng |
| `notifications/list [nền]` | 693 | 0 | 60 ms | 105 ms | 3.1 / 4 / 4 | 585 / 587 / 589 | 0.0 | — |
| `game-v2/answer [Đảo]` 🔒 | 468 | 0 | 15 ms | 62 ms | 10.6 / 12 / 22 | 824 / 825 / 873 | 12.5 | ❌ 8 lượt > 15 tv |
| `hs/thi-dua-hom-nay [mở]` | 250 | 0 | 63 ms | 109 ms | 5.0 / 5 / 7 | 1.025 / 1.060 / 21.814 | 0.0 | ❌ 9 lượt > 2.000 dòng |
| `game-v2/so-tay [Đảo]` | 100 | 0 | 53 ms | 97 ms | 10.8 / 11 / 19 | 2.234 / 2.841 / 11.030 | 0.0 | ❌ 100 lượt > 8 tv; 59 lượt > 2.000 dòng |
| `daily-honors [nền]` | 693 | 0 | 59 ms | 104 ms | 3.0 / 3 / 3 | 266 / 266 / 266 | 0.0 | — |
| `btvn/cua-em [chặng]` | 243 | 0 | 17 ms | 59 ms | 8.0 / 10 / 10 | 750 / 1.406 / 1.634 | 92.9 | ❌ 174 lượt > 8 tv |
| `hs/cau-theo-qid [ôn]` | 190 | 0 | 9 ms | 53 ms | 3.4 / 4 / 4 | 845 / 852 / 862 | 0.0 | — |
| `notifications/list [mở]` | 250 | 0 | 57 ms | 96 ms | 3.0 / 3 / 4 | 585 / 587 / 588 | 0.0 | — |
| `game-v2/profile [Đảo]` | 250 | 0 | 14 ms | 56 ms | 9.5 / 10 / 10 | 289 / 1.002 / 3.660 | 0.0 | ❌ 250 lượt > 8 tv; 2 lượt > 2.000 dòng |
| `daily-honors [mở]` | 250 | 0 | 57 ms | 98 ms | 3.0 / 3 / 3 | 266 / 266 / 266 | 0.0 | — |
| `hs/lich-su [mở]` | 250 | 0 | 50 ms | 85 ms | 1.9 / 2 / 2 | 221 / 361 / 660 | 0.0 | — |
| `game-v2/academic-sync [nền]` | 693 | 0 | 68 ms | 114 ms | 9.2 / 10 / 10 | 73 / 101 / 309 | 1.0 | ❌ 693 lượt > 8 tv |
| `hs/ca-dang-mo [nền]` | 693 | 0 | 58 ms | 102 ms | 2.1 / 3 / 3 | 29 / 31 / 31 | 0.0 | — |
| `game-v2/academic-sync [mở]` | 250 | 0 | 67 ms | 114 ms | 10.6 / 12 / 13 | 73 / 100 / 309 | 2.1 | ❌ 250 lượt > 8 tv |
| `hs/ca-dang-mo [mở]` | 250 | 0 | 54 ms | 91 ms | 2.0 / 2 / 3 | 29 / 30 / 35 | 0.0 | — |
| `game-v2/complete [Đảo]` 🔒 | 78 | 0 | 13 ms | 34 ms | 13.4 / 14 / 14 | 50 / 68 / 75 | 0.0 | — |
| `presence [nền]` | 2229 | 0 | 8 ms | 40 ms | 1.0 / 1 / 2 | 1 / 1 / 6 | 2.0 | — |
| `hs/btvn [mở]` | 250 | 0 | 4 ms | 51 ms | 1.0 / 1 / 1 | 7 / 8 / 8 | 0.0 | — |
| `game-v2/resume [Đảo]` | 100 | 0 | 5 ms | 55 ms | 3.0 / 3 / 3 | 3 / 3 / 3 | 0.0 | — |
| `hs/thu-thach-hom-nay [mở]` | 250 | 0 | 51 ms | 86 ms | 2.0 / 2 / 3 | 1 / 1 / 2 | 0.0 | — |
| `mom/list [nền]` | 693 | 0 | 50 ms | 87 ms | 1.1 / 2 / 2 | 0 / 1 / 2 | 0.0 | — |
| `mom/list [mở]` | 250 | 0 | 45 ms | 76 ms | 1.0 / 1 / 2 | 0 / 0 / 2 | 0.0 | — |
| `presence [mở]` | 250 | 0 | 43 ms | 75 ms | 1.0 / 1 / 1 | 0 / 0 / 0 | 3.0 | — |

🔒 = lệnh nộp (ngân sách truy vấn 15). Thời gian p50/p95 là thời gian máy khách đo (gồm cả xếp hàng ở Worker cục bộ), không phải thời gian D1 thật.

## 2. Lệnh VƯỢT ngân sách

| Lệnh | Vượt truy vấn | Vượt dòng đọc | Truy vấn max (trần) | Dòng đọc max (trần 2.000) |
|---|---:|---:|---|---|
| `game-v2/recommendations [Đảo]` | 100/100 | 97/100 | 52 (8) | 191.057 |
| `hs/thi-dua-hom-nay [nền]` | 0/693 | 50/693 | 7 (8) | 26.287 |
| `hs/thi-dua-hom-nay [mở]` | 0/250 | 9/250 | 7 (8) | 21.814 |
| `btvn/xong-lo [nộp chặng]` | 243/243 | 217/243 | 88 (15) | 13.914 |
| `hs/ke-hoach-ngay [sau ghi]` | 433/433 | 301/433 | 69 (8) | 13.517 |
| `game-v2/so-tay [Đảo]` | 100/100 | 59/100 | 19 (8) | 11.030 |
| `hs/ke-hoach-ngay [nền]` | 658/693 | 407/693 | 71 (8) | 9.892 |
| `hs/ke-hoach-ngay [dựng đầu ngày]` | 250/250 | 143/250 | 69 (8) | 9.851 |
| `hs/ke-hoach-ngay [mở]` | 168/250 | 92/250 | 63 (8) | 9.851 |
| `hs/on-lai/nop [nộp ôn]` | 190/190 | 169/190 | 39 (15) | 9.220 |
| `game-v2/start [Đảo]` | 100/100 | 94/100 | 36 (8) | 8.387 |
| `game-v2/profile [Đảo]` | 250/250 | 2/250 | 10 (8) | 3.660 |
| `btvn/cua-em [chặng]` | 174/243 | 0/243 | 10 (8) | 1.634 |
| `game-v2/answer [Đảo]` | 8/468 | 0/468 | 22 (15) | 873 |
| `game-v2/academic-sync [nền]` | 693/693 | 0/693 | 10 (8) | 309 |
| `game-v2/academic-sync [mở]` | 250/250 | 0/250 | 13 (8) | 309 |

## 3. Top 15 truy vấn theo tổng dòng đọc

| # | Dòng đọc tổng | Số lần | Dòng/lần | Lệnh gọi nhiều nhất | Khung câu SQL |
|---:|---:|---:|---:|---|---|
| 1 | 2.030.874 | 2.498 | 813 | hs/ke-hoach-ngay [nền], game-v2/answer [Đảo] | `SELECT ca.ma_ca,ca.bank_r2,ca.cap_nhat_luc,ca.trang_thai,ca.cong_bo,ca.het_han_vao,ca.thoi_gian_phut,ca.loai,ca.han_nop,ca.bat_dau, (SELECT COUNT(*) …` |
| 2 | 808.280 | 2.927 | 276 | hs/ke-hoach-ngay [nền], btvn/xong-lo [nộp chặng] | `SELECT qid, MIN(dang) AS dang FROM game_v2_question WHERE dang IS NOT NULL AND qid IN (SELECT value FROM json_each(?)) GROUP BY qid` |
| 3 | 708.858 | 943 | 752 | hs/thi-dua-hom-nay [nền], hs/thi-dua-hom-nay [mở] | `SELECT sbd, ngay_vn, COUNT(*) AS n, MAX(luc1) AS luc FROM ( SELECT sbd, ngay_vn, qid, MIN(luc) AS luc1 FROM su_kien_hoc WHERE sbd IN (SELECT value FR…` |
| 4 | 601.179 | 206 | 2.918 | game-v2/recommendations [Đảo], game-v2/start [Đảo] | `SELECT DISTINCT q.dang AS dang FROM chi_tiet_cau cc JOIN ca c ON c.ma_ca = cc.ma_ca JOIN game_v2_question q ON q.qid = cc.qid WHERE cc.sbd IN (SELECT…` |
| 5 | 599.182 | 2.927 | 205 | hs/ke-hoach-ngay [nền], btvn/xong-lo [nộp chặng] | `SELECT qid, chuyen_de FROM cau_hoi WHERE COALESCE(chuyen_de,'') <> '' AND qid IN (SELECT value FROM json_each(?))` |
| 6 | 596.266 | 1.509 | 395 | hs/ke-hoach-ngay [nền], hs/ke-hoach-ngay [sau ghi] | `SELECT 'g' AS k, giay AS a, NULL AS b FROM (SELECT giay FROM su_kien_hoc WHERE sbd = ? AND giay IS NOT NULL AND ngay_vn >= ? ORDER BY luc DESC LIMIT …` |
| 7 | 548.143 | 943 | 581 | notifications/list [nền], notifications/list [mở] | `SELECT * FROM (SELECT e.sbd,'btvn:'\|\|e.khoa id,'Bài tập mới từ Thầy' title,b.ma_de body,'btvn' target,b.giao_luc created_at,b.han_nop deadline FROM b…` |
| 8 | 499.790 | 943 | 530 | hs/thi-dua-hom-nay [nền], hs/thi-dua-hom-nay [mở] | `SELECT sbd, ho_ten, lop, ten_lop, 1 AS uu FROM hoc_sinh WHERE COALESCE(trang_thai, '') <> 'khoa' UNION ALL SELECT sbd, ho_ten, lop, NULL AS ten_lop, …` |
| 9 | 489.268 | 1.942 | 252 | hs/ke-hoach-ngay [nền], hs/ke-hoach-ngay [sau ghi] | `SELECT khoa, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, ma_dang, chuyen_de FROM su_kien_hoc WHERE sbd = ? ORDER BY luc, khoa` |
| 10 | 364.532 | 1.871 | 195 | hs/ke-hoach-ngay [nền], hs/ke-hoach-ngay [sau ghi] | `SELECT qid, MIN(json_extract(json, '$.phan')) AS phan, MIN(json_extract(json, '$.sao')) AS sao FROM game_v2_question WHERE qid IN (SELECT value FROM …` |
| 11 | 259.506 | 1.057 | 246 | btvn/xong-lo [nộp chặng], hs/on-lai/nop [nộp ôn] | `SELECT khoa, sbd, qid, nguon, ket_qua, giay, luc, ngay_vn, ma_dang, chuyen_de FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?)) ORDER BY…` |
| 12 | 249.895 | 943 | 265 | daily-honors [nền], daily-honors [mở] | `SELECT l.sbd,COALESCE(h.ho_ten,l.ho_ten) ho_ten,l.tong,l.nop_luc,l.vao_luc,c.ten_ca, json_extract(g.json,'$.nickname') nickname,json_extract(g.json,'…` |
| 13 | 223.246 | 1.752 | 127 | hs/ke-hoach-ngay [nền], hs/ke-hoach-ngay [sau ghi] | `SELECT sbd, giay FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?)) AND giay IS NOT NULL AND ngay_vn >= ?` |
| 14 | 223.201 | 1.752 | 127 | hs/ke-hoach-ngay [nền], hs/ke-hoach-ngay [sau ghi] | `SELECT sbd, COUNT(*) AS n FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?)) GROUP BY sbd` |
| 15 | 219.612 | 903 | 243 | btvn/xong-lo [nộp chặng], btvn/cua-em [chặng] | `SELECT 'd' AS k, sbd, ma_dang AS a, bac AS b, so_gap AS c, so_sai AS d, so_da_khac_phuc AS e, so_chua_thay_sai AS f FROM nam_kt_dang WHERE sbd IN (SE…` |

## 4. Tải D1 (ước lượng)

- Tổng thời gian D1 ghi nhận (`meta.duration` của D1 cục bộ): 8.89 giây trong 659 giây chạy thật ⇒ ~0.8 giây D1 / phút ở tải thật. D1 cục bộ là SQLite trong bộ nhớ đệm, **nhanh hơn D1 thật nhiều lần**: dùng SỐ TRUY VẤN và SỐ DÒNG ĐỌC làm thước đo chính, không dùng mili-giây.
- Mỗi dòng đọc trên D1 thật tính tiền/tải như nhau; lệnh nào đọc > 2.000 dòng là ứng viên chỉ mục hoặc đệm.

## Ghi chú đo

- Đăng nhập được 250/250 em giả (bước thiết lập, không tính vào bảng).
- Chặng: 243 em thử làm, 243 nộp được, 7 lỗi/không có bài. Ôn: 190 em có việc ôn (nộp được 190), 60 em không có câu tới hạn. Đảo: 250 em thử, 78 xong lượt, 22 hết lượt/không có câu.
- Lỗi/từ chối hay gặp (không phải lỗi bộ đo — nhiều là đúng luật máy chủ): Đảo start không có câu: Hôm nay em đã dùng hết lượt thần thú. Mai thú chờ em. ×22 · chặng: em không có bài về nhà chưa nộp ×7
- Đáp án của em giả là NGẪU NHIÊN; thời gian "làm" giữa các bước là ngẫu nhiên. D1 cục bộ nhanh hơn D1 thật: số truy vấn và dòng đọc là thước đo chính.
- Migration chỉ-thêm của cây mã đã áp lên bản sao D1 cục bộ (câu MỚI so với mẫu; lỗi 'đã có' bỏ qua): migration-1109-chi-tiet-ca.sql (2 câu), migration-1109-danh-sach.sql (2 câu), migration-1109-man-ca-thi.sql (1 câu), migration-1209-goi-cu.sql (8 câu), migration-1209-toan-bo.sql (39 câu), migration-1509-than-thu.sql (2 câu), migration-1609-btvn-quan-ly-em.sql (2 câu), migration-1609-game-season.sql (1 câu), migration-1609-honors.sql (1 câu), migration-1609-luyen-de.sql (3 câu), migration-1609-mom.sql (2 câu), migration-1609-notifications.sql (4 câu), migration-1609-parent-news.sql (1 câu), migration-1609-presence.sql (2 câu), migration-1609-than-thu-v2.sql (15 câu), migration-1609-vo-dai.sql (4 câu), migration-1809-study-plan.sql (3 câu), migration-1909-exp.sql (4 câu), migration-1909-game-doan.sql (7 câu), migration-1909-ho-so.sql (5 câu), migration-1909-ke-hoach.sql (3 câu), migration-1909-ma-da-dung.sql (1 câu), migration-1909-ph-truy-cap.sql (1 câu), migration-1909-su-kien-hoc.sql (4 câu), migration-2109-bo-nao.sql (5 câu), migration-2109-btvn-nang-do.sql (3 câu), migration-2109-canh-bao-thay.sql (4 câu), migration-2109-chi-muc-luot.sql (1 câu), migration-2109-game-doan-mua.sql (4 câu), migration-2109-game-doan-trum-cau.sql (2 câu), migration-2109-hoc-sinh-da-go.sql (2 câu), migration-2109-index-luc.sql (1 câu), migration-2109-index.sql (2 câu), migration-2109-khien.sql (4 câu), migration-2109-nhat-ky-may.sql (2 câu), migration-2109-ph-giao-them.sql (2 câu), migration-2109-shop-phu-kien.sql (4 câu), migration-2109-thu-thach-rieng.sql (2 câu), migration-2109-w2.sql (1 câu)
- Cây mã: commit acfa523 (worktree sạch); bộ đệm mô-đun của Worker bắt đầu TRỐNG (như vừa đẩy bản mới).

