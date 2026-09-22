# Bản đo tải giả — ec80ad9

Bộ bắn tải giả `scripts/ban-tai-gia/` (Code 1). Chạy lúc 2026-09-22 07:53:35 (giờ VN). **D1 CỤC BỘ** nạp từ bản sao lưu `omr-d1-20260921-1807-truoc-929aad6.sql`; Worker = mã tại commit `ec80ad9` bọc vỏ đo (`vo-do.ts`); **không** bắn vào máy chủ thật.

- **Mô phỏng:** 250 em × 10 phút giờ cao điểm (chạy thật 657 giây): mở app (kế hoạch ngày, bài về nhà, Thi đua, thông báo…), hỏi nền mỗi 180 giây, làm + nộp 1 chặng, ôn 3 câu, 1 lượt Đảo.
- **Tổng:** 12.782 lượt gọi · 158.039 truy vấn D1 · 11.246.941 dòng đọc · trung bình 12.4 truy vấn và 880 dòng đọc mỗi lượt.
- **Ngân sách (Boss):** ≤ 8 truy vấn và ≤ 2.000 dòng đọc mỗi lượt; lệnh nộp ≤ 15 truy vấn.
- **Kết luận:** ❌ **15/32 lệnh VƯỢT ngân sách** (xem mục 2).

## 1. Bảng theo lệnh (xếp theo tổng dòng đọc giảm dần)

| Lệnh | Lượt | Lỗi | p50 | p95 | Truy vấn TB / p95 / max | Dòng đọc TB / p95 / max | Dòng ghi TB | Vượt |
|---|---:|---:|---:|---:|---|---|---:|---|
| `hs/ke-hoach-ngay [nền]` | 696 | 0 | 50 ms | 119 ms | 54.2 / 63 / 65 | 2.920 / 5.756 / 12.340 | 6.3 | ❌ 661 lượt > 8 tv; 426 lượt > 2.000 dòng |
| `hs/ke-hoach-ngay [sau ghi]` | 448 | 0 | 34 ms | 104 ms | 57.1 / 59 / 61 | 3.355 / 5.932 / 12.261 | 1.0 | ❌ 448 lượt > 8 tv; 317 lượt > 2.000 dòng |
| `btvn/xong-lo [nộp chặng]` 🔒 | 243 | 0 | 63 ms | 124 ms | 75.4 / 79 / 81 | 4.946 / 8.249 / 16.141 | 150.0 | ❌ 243 lượt > 15 tv; 236 lượt > 2.000 dòng |
| `hs/thi-dua-hom-nay [nền]` | 696 | 0 | 64 ms | 108 ms | 5.2 / 6 / 7 | 1.485 / 6.996 / 24.805 | 0.0 | ❌ 51 lượt > 2.000 dòng |
| `game-v2/recommendations [Đảo]` | 100 | 0 | 49 ms | 150 ms | 32.7 / 39 / 58 | 8.452 / 7.906 / 191.006 | 14.0 | ❌ 100 lượt > 8 tv; 97 lượt > 2.000 dòng |
| `hs/ke-hoach-ngay [dựng đầu ngày]` | 250 | 0 | 254 ms | 288 ms | 54.4 / 59 / 62 | 2.961 / 5.525 / 9.133 | 4.3 | ❌ 250 lượt > 8 tv; 142 lượt > 2.000 dòng |
| `hs/on-lai/nop [nộp ôn]` 🔒 | 205 | 0 | 36 ms | 79 ms | 35.2 / 39 / 39 | 3.269 / 5.097 / 9.093 | 53.7 | ❌ 205 lượt > 15 tv; 164 lượt > 2.000 dòng |
| `game-v2/answer [Đảo]` 🔒 | 600 | 0 | 16 ms | 54 ms | 10.4 / 11 / 12 | 823 / 824 / 828 | 12.4 | — |
| `hs/ke-hoach-ngay [mở]` | 250 | 0 | 38 ms | 116 ms | 35.3 / 58 / 59 | 1.844 / 4.695 / 9.136 | 0.7 | ❌ 165 lượt > 8 tv; 93 lượt > 2.000 dòng |
| `game-v2/start [Đảo]` | 100 | 0 | 43 ms | 115 ms | 34.6 / 35 / 37 | 4.124 / 6.923 / 7.919 | 3.0 | ❌ 100 lượt > 8 tv; 96 lượt > 2.000 dòng |
| `notifications/list [nền]` | 696 | 0 | 57 ms | 98 ms | 3.1 / 4 / 5 | 585 / 587 / 589 | 0.0 | — |
| `hs/thi-dua-hom-nay [mở]` | 250 | 0 | 58 ms | 115 ms | 4.0 / 4 / 6 | 988 / 1.006 / 19.223 | 0.0 | ❌ 9 lượt > 2.000 dòng |
| `game-v2/so-tay [Đảo]` | 100 | 0 | 54 ms | 113 ms | 10.8 / 12 / 22 | 2.376 / 2.956 / 14.906 | 0.0 | ❌ 100 lượt > 8 tv; 61 lượt > 2.000 dòng |
| `daily-honors [nền]` | 696 | 0 | 57 ms | 97 ms | 3.0 / 3 / 3 | 266 / 266 / 266 | 0.0 | — |
| `btvn/cua-em [chặng]` | 243 | 0 | 18 ms | 58 ms | 8.0 / 10 / 11 | 747 / 1.407 / 1.634 | 84.4 | ❌ 174 lượt > 8 tv |
| `hs/cau-theo-qid [ôn]` | 205 | 0 | 10 ms | 44 ms | 3.4 / 4 / 4 | 845 / 853 / 862 | 0.0 | — |
| `notifications/list [mở]` | 250 | 0 | 54 ms | 107 ms | 3.0 / 3 / 4 | 585 / 587 / 588 | 0.0 | — |
| `daily-honors [mở]` | 250 | 0 | 55 ms | 106 ms | 3.0 / 3 / 6 | 267 / 266 / 531 | 0.0 | — |
| `hs/lich-su [mở]` | 250 | 0 | 47 ms | 94 ms | 1.9 / 2 / 2 | 221 / 361 / 660 | 0.0 | — |
| `game-v2/academic-sync [nền]` | 696 | 0 | 64 ms | 109 ms | 9.2 / 10 / 10 | 73 / 101 / 309 | 1.0 | ❌ 696 lượt > 8 tv |
| `game-v2/profile [Đảo]` | 250 | 0 | 15 ms | 60 ms | 9.5 / 10 / 11 | 183 / 249 / 431 | 0.0 | ❌ 250 lượt > 8 tv |
| `hs/ca-dang-mo [nền]` | 696 | 0 | 55 ms | 94 ms | 2.1 / 3 / 3 | 29 / 31 / 31 | 0.0 | — |
| `game-v2/academic-sync [mở]` | 250 | 0 | 62 ms | 122 ms | 10.6 / 12 / 13 | 73 / 100 / 309 | 2.1 | ❌ 250 lượt > 8 tv |
| `hs/ca-dang-mo [mở]` | 250 | 0 | 52 ms | 102 ms | 2.0 / 2 / 3 | 29 / 30 / 31 | 0.0 | — |
| `game-v2/complete [Đảo]` 🔒 | 100 | 0 | 12 ms | 45 ms | 13.1 / 14 / 14 | 65 / 142 / 222 | 0.1 | — |
| `presence [nền]` | 2216 | 0 | 9 ms | 41 ms | 1.0 / 1 / 2 | 1 / 1 / 6 | 2.0 | — |
| `hs/btvn [mở]` | 250 | 0 | 4 ms | 51 ms | 1.0 / 1 / 1 | 7 / 8 / 8 | 0.0 | — |
| `game-v2/resume [Đảo]` | 100 | 0 | 5 ms | 53 ms | 3.0 / 3 / 3 | 3 / 3 / 3 | 0.0 | — |
| `mom/list [nền]` | 696 | 0 | 50 ms | 87 ms | 1.1 / 2 / 2 | 0 / 1 / 3 | 0.0 | — |
| `mom/list [mở]` | 250 | 0 | 43 ms | 87 ms | 1.0 / 1 / 2 | 0 / 0 / 2 | 0.0 | — |
| `hs/thu-thach-hom-nay [mở]` | 250 | 0 | 49 ms | 94 ms | 2.0 / 2 / 3 | 0 / 0 / 1 | 0.0 | — |
| `presence [mở]` | 250 | 0 | 42 ms | 88 ms | 1.0 / 1 / 1 | 0 / 0 / 0 | 3.0 | — |

🔒 = lệnh nộp (ngân sách truy vấn 15). Thời gian p50/p95 là thời gian máy khách đo (gồm cả xếp hàng ở Worker cục bộ), không phải thời gian D1 thật.

## 2. Lệnh VƯỢT ngân sách

| Lệnh | Vượt truy vấn | Vượt dòng đọc | Truy vấn max (trần) | Dòng đọc max (trần 2.000) |
|---|---:|---:|---|---|
| `game-v2/recommendations [Đảo]` | 100/100 | 97/100 | 58 (8) | 191.006 |
| `hs/thi-dua-hom-nay [nền]` | 0/696 | 51/696 | 7 (8) | 24.805 |
| `hs/thi-dua-hom-nay [mở]` | 0/250 | 9/250 | 6 (8) | 19.223 |
| `btvn/xong-lo [nộp chặng]` | 243/243 | 236/243 | 81 (15) | 16.141 |
| `game-v2/so-tay [Đảo]` | 100/100 | 61/100 | 22 (8) | 14.906 |
| `hs/ke-hoach-ngay [nền]` | 661/696 | 426/696 | 65 (8) | 12.340 |
| `hs/ke-hoach-ngay [sau ghi]` | 448/448 | 317/448 | 61 (8) | 12.261 |
| `hs/ke-hoach-ngay [mở]` | 165/250 | 93/250 | 59 (8) | 9.136 |
| `hs/ke-hoach-ngay [dựng đầu ngày]` | 250/250 | 142/250 | 62 (8) | 9.133 |
| `hs/on-lai/nop [nộp ôn]` | 205/205 | 164/205 | 39 (15) | 9.093 |
| `game-v2/start [Đảo]` | 100/100 | 96/100 | 37 (8) | 7.919 |
| `btvn/cua-em [chặng]` | 174/243 | 0/243 | 11 (8) | 1.634 |
| `game-v2/profile [Đảo]` | 250/250 | 0/250 | 11 (8) | 431 |
| `game-v2/academic-sync [nền]` | 696/696 | 0/696 | 10 (8) | 309 |
| `game-v2/academic-sync [mở]` | 250/250 | 0/250 | 13 (8) | 309 |

## 3. Top 15 truy vấn theo tổng dòng đọc

| # | Dòng đọc tổng | Số lần | Dòng/lần | Lệnh gọi nhiều nhất | Khung câu SQL |
|---:|---:|---:|---:|---|---|
| 1 | 2.501.601 | 3.077 | 813 | hs/ke-hoach-ngay [nền], game-v2/answer [Đảo] | `SELECT ca.ma_ca,ca.bank_r2,ca.cap_nhat_luc,ca.trang_thai,ca.cong_bo,ca.het_han_vao,ca.thoi_gian_phut,ca.loai,ca.han_nop,ca.bat_dau, (SELECT COUNT(*) …` |
| 2 | 868.132 | 3.042 | 285 | hs/ke-hoach-ngay [nền], btvn/xong-lo [nộp chặng] | `SELECT qid, MIN(dang) AS dang FROM game_v2_question WHERE dang IS NOT NULL AND qid IN (SELECT value FROM json_each(?)) GROUP BY qid` |
| 3 | 729.224 | 946 | 771 | hs/thi-dua-hom-nay [nền], hs/thi-dua-hom-nay [mở] | `SELECT sbd, ngay_vn, COUNT(*) AS n, MAX(luc1) AS luc FROM ( SELECT sbd, ngay_vn, qid, MIN(luc) AS luc1 FROM su_kien_hoc WHERE sbd IN (SELECT value FR…` |
| 4 | 643.884 | 3.042 | 212 | hs/ke-hoach-ngay [nền], btvn/xong-lo [nộp chặng] | `SELECT qid, chuyen_de FROM cau_hoi WHERE COALESCE(chuyen_de,'') <> '' AND qid IN (SELECT value FROM json_each(?))` |
| 5 | 612.061 | 1.524 | 402 | hs/ke-hoach-ngay [nền], hs/ke-hoach-ngay [sau ghi] | `SELECT 'g' AS k, giay AS a, NULL AS b FROM (SELECT giay FROM su_kien_hoc WHERE sbd = ? AND giay IS NOT NULL AND ngay_vn >= ? ORDER BY luc DESC LIMIT …` |
| 6 | 601.179 | 206 | 2.918 | game-v2/recommendations [Đảo], game-v2/start [Đảo] | `SELECT DISTINCT q.dang AS dang FROM chi_tiet_cau cc JOIN ca c ON c.ma_ca = cc.ma_ca JOIN game_v2_question q ON q.qid = cc.qid WHERE cc.sbd IN (SELECT…` |
| 7 | 549.887 | 946 | 581 | notifications/list [nền], notifications/list [mở] | `SELECT * FROM (SELECT e.sbd,'btvn:'\|\|e.khoa id,'Bài tập mới từ Thầy' title,b.ma_de body,'btvn' target,b.giao_luc created_at,b.han_nop deadline FROM b…` |
| 8 | 508.048 | 1.972 | 258 | hs/ke-hoach-ngay [nền], hs/ke-hoach-ngay [sau ghi] | `SELECT khoa, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, ma_dang, chuyen_de FROM su_kien_hoc WHERE sbd = ? ORDER BY luc, khoa` |
| 9 | 501.380 | 946 | 530 | hs/thi-dua-hom-nay [nền], hs/thi-dua-hom-nay [mở] | `SELECT sbd, ho_ten, lop, ten_lop, 1 AS uu FROM hoc_sinh WHERE COALESCE(trang_thai, '') <> 'khoa' UNION ALL SELECT sbd, ho_ten, lop, NULL AS ten_lop, …` |
| 10 | 374.570 | 1.917 | 195 | hs/ke-hoach-ngay [nền], hs/ke-hoach-ngay [sau ghi] | `SELECT qid, MIN(json_extract(json, '$.phan')) AS phan, MIN(json_extract(json, '$.sao')) AS sao FROM game_v2_question WHERE qid IN (SELECT value FROM …` |
| 11 | 308.394 | 1.141 | 270 | btvn/xong-lo [nộp chặng], hs/on-lai/nop [nộp ôn] | `SELECT khoa, sbd, qid, nguon, ket_qua, giay, luc, ngay_vn, ma_dang, chuyen_de FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?)) ORDER BY…` |
| 12 | 250.955 | 947 | 265 | daily-honors [nền], daily-honors [mở] | `SELECT l.sbd,COALESCE(h.ho_ten,l.ho_ten) ho_ten,l.tong,l.nop_luc,l.vao_luc,c.ten_ca, json_extract(g.json,'$.nickname') nickname,json_extract(g.json,'…` |
| 13 | 246.244 | 1.767 | 139 | hs/ke-hoach-ngay [nền], hs/ke-hoach-ngay [sau ghi] | `SELECT e.sbd, COUNT(*) AS so_su_kien, COUNT(DISTINCT CASE WHEN e.ngay_vn = ? THEN e.qid END) AS da_lam, COUNT(DISTINCT CASE WHEN e.ngay_vn = ? AND e.…` |
| 14 | 222.313 | 903 | 246 | btvn/xong-lo [nộp chặng], btvn/cua-em [chặng] | `SELECT 'd' AS k, sbd, ma_dang AS a, bac AS b, so_gap AS c, so_sai AS d, so_da_khac_phuc AS e, so_chua_thay_sai AS f FROM nam_kt_dang WHERE sbd IN (SE…` |
| 15 | 210.160 | 1.548 | 136 | hs/ke-hoach-ngay [nền], hs/ke-hoach-ngay [sau ghi] | `SELECT q.qid, q.content_group, q.json FROM game_v2_question q JOIN de_kho d ON d.ma_de = q.ma_de JOIN game_v2_index g ON g.ma_de = d.ma_de AND g.sour…` |

## 4. Tải D1 (ước lượng)

- Tổng thời gian D1 ghi nhận (`meta.duration` của D1 cục bộ): 10.62 giây trong 657 giây chạy thật ⇒ ~1.0 giây D1 / phút ở tải thật. D1 cục bộ là SQLite trong bộ nhớ đệm, **nhanh hơn D1 thật nhiều lần**: dùng SỐ TRUY VẤN và SỐ DÒNG ĐỌC làm thước đo chính, không dùng mili-giây.
- Mỗi dòng đọc trên D1 thật tính tiền/tải như nhau; lệnh nào đọc > 2.000 dòng là ứng viên chỉ mục hoặc đệm.

## Ghi chú đo

- Đăng nhập được 250/250 em giả (bước thiết lập, không tính vào bảng).
- Chặng: 243 em thử làm, 243 nộp được, 7 lỗi/không có bài. Ôn: 205 em có việc ôn (nộp được 205), 45 em không có câu tới hạn. Đảo: 250 em thử, 100 xong lượt, 0 hết lượt/không có câu.
- Lỗi/từ chối hay gặp (không phải lỗi bộ đo — nhiều là đúng luật máy chủ): chặng: em không có bài về nhà chưa nộp ×7
- Đáp án của em giả là NGẪU NHIÊN; thời gian "làm" giữa các bước là ngẫu nhiên. D1 cục bộ nhanh hơn D1 thật: số truy vấn và dòng đọc là thước đo chính.
- Migration chỉ-thêm của cây mã đã áp lên bản sao D1 cục bộ (câu MỚI so với mẫu; lỗi 'đã có' bỏ qua): migration-2109-chi-muc-luot.sql (+1 đối tượng: bảng/chỉ mục/cột)
- Mẫu phản hồi để so trước/sau: 40 em đầu (`so-sanh-phan-hoi.mjs`); dò lộ đáp án: xem trên
- Cây mã: commit ec80ad9 (worktree sạch).

