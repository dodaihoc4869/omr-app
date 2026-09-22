# Bản đo tải giả — 2de7c41-lanh

Bộ bắn tải giả `scripts/ban-tai-gia/` (Code 1). Chạy lúc 2026-09-22 08:26:27 (giờ VN). **D1 CỤC BỘ** nạp từ bản sao lưu `omr-d1-20260921-1807-truoc-929aad6.sql`; Worker = mã tại commit `2de7c41-lanh` bọc vỏ đo (`vo-do.ts`); **không** bắn vào máy chủ thật.

- **Mô phỏng:** 250 em × 10 phút giờ cao điểm (chạy thật 659 giây): mở app (kế hoạch ngày, bài về nhà, Thi đua, thông báo…), hỏi nền mỗi 180 giây, làm + nộp 1 chặng, ôn 3 câu, 1 lượt Đảo.
- **Tổng:** 12.744 lượt gọi · 149.086 truy vấn D1 · 6.801.476 dòng đọc · trung bình 11.7 truy vấn và 534 dòng đọc mỗi lượt.
- **Ngân sách (Boss):** ≤ 8 truy vấn và ≤ 2.000 dòng đọc mỗi lượt; lệnh nộp ≤ 15 truy vấn.
- **Kết luận:** ❌ **15/32 lệnh VƯỢT ngân sách** (xem mục 2).

## 1. Bảng theo lệnh (xếp theo tổng dòng đọc giảm dần)

| Lệnh | Lượt | Lỗi | p50 | p95 | Truy vấn TB / p95 / max | Dòng đọc TB / p95 / max | Dòng ghi TB | Vượt |
|---|---:|---:|---:|---:|---|---|---:|---|
| `hs/ke-hoach-ngay [nền]` | 690 | 0 | 52 ms | 199 ms | 51.2 / 59 / 62 | 1.633 / 3.706 / 7.158 | 6.4 | ❌ 655 lượt > 8 tv; 259 lượt > 2.000 dòng |
| `hs/thi-dua-hom-nay [nền]` | 690 | 0 | 65 ms | 176 ms | 5.2 / 6 / 8 | 1.493 / 7.039 / 24.853 | 0.0 | ❌ 52 lượt > 2.000 dòng |
| `hs/ke-hoach-ngay [sau ghi]` | 448 | 0 | 47 ms | 309 ms | 53.2 / 55 / 57 | 1.806 / 3.760 / 7.120 | 1.2 | ❌ 448 lượt > 8 tv; 195 lượt > 2.000 dòng |
| `game-v2/recommendations [Đảo]` | 100 | 0 | 60 ms | 237 ms | 31.7 / 38 / 57 | 7.755 / 7.093 / 182.045 | 14.0 | ❌ 100 lượt > 8 tv; 79 lượt > 2.000 dòng |
| `btvn/xong-lo [nộp chặng]` 🔒 | 243 | 0 | 76 ms | 341 ms | 68.7 / 73 / 77 | 2.793 / 4.882 / 8.902 | 149.4 | ❌ 243 lượt > 15 tv; 149 lượt > 2.000 dòng |
| `hs/ke-hoach-ngay [dựng đầu ngày]` | 250 | 0 | 228 ms | 269 ms | 51.9 / 58 / 60 | 1.592 / 3.760 / 7.662 | 4.3 | ❌ 250 lượt > 8 tv; 89 lượt > 2.000 dòng |
| `game-v2/start [Đảo]` | 100 | 0 | 51 ms | 180 ms | 33.7 / 34 / 36 | 3.320 / 6.114 / 7.106 | 3.0 | ❌ 100 lượt > 8 tv; 77 lượt > 2.000 dòng |
| `hs/on-lai/nop [nộp ôn]` 🔒 | 205 | 0 | 35 ms | 139 ms | 30.5 / 34 / 37 | 1.416 / 2.718 / 3.960 | 53.3 | ❌ 205 lượt > 15 tv; 39 lượt > 2.000 dòng |
| `hs/ke-hoach-ngay [mở]` | 250 | 0 | 36 ms | 99 ms | 33.4 / 55 / 56 | 1.044 / 3.135 / 6.181 | 0.7 | ❌ 165 lượt > 8 tv; 60 lượt > 2.000 dòng |
| `hs/thi-dua-hom-nay [mở]` | 250 | 0 | 54 ms | 102 ms | 4.0 / 4 / 6 | 1.010 / 1.108 / 19.223 | 0.0 | ❌ 10 lượt > 2.000 dòng |
| `daily-honors [nền]` | 690 | 0 | 60 ms | 158 ms | 3.0 / 3 / 3 | 266 / 266 / 266 | 0.0 | — |
| `btvn/cua-em [chặng]` | 243 | 0 | 18 ms | 62 ms | 8.0 / 10 / 10 | 747 / 1.407 / 1.634 | 84.4 | ❌ 174 lượt > 8 tv |
| `game-v2/so-tay [Đảo]` | 100 | 0 | 57 ms | 178 ms | 10.0 / 11 / 22 | 1.653 / 2.184 / 21.380 | 0.0 | ❌ 100 lượt > 8 tv; 9 lượt > 2.000 dòng |
| `daily-honors [mở]` | 250 | 0 | 51 ms | 96 ms | 3.0 / 3 / 6 | 267 / 266 / 531 | 0.0 | — |
| `hs/lich-su [mở]` | 250 | 0 | 47 ms | 88 ms | 1.9 / 2 / 2 | 221 / 361 / 660 | 0.0 | — |
| `game-v2/academic-sync [nền]` | 690 | 0 | 66 ms | 189 ms | 9.2 / 10 / 10 | 73 / 101 / 310 | 1.0 | ❌ 690 lượt > 8 tv |
| `game-v2/profile [Đảo]` | 250 | 0 | 16 ms | 116 ms | 9.5 / 10 / 10 | 184 / 250 / 431 | 0.0 | ❌ 250 lượt > 8 tv |
| `game-v2/answer [Đảo]` 🔒 | 600 | 0 | 15 ms | 65 ms | 9.4 / 11 / 12 | 40 / 12 / 825 | 12.4 | — |
| `hs/ca-dang-mo [nền]` | 690 | 0 | 58 ms | 152 ms | 2.1 / 3 / 3 | 29 / 31 / 34 | 0.0 | — |
| `game-v2/academic-sync [mở]` | 250 | 0 | 58 ms | 108 ms | 10.6 / 12 / 13 | 73 / 100 / 309 | 2.1 | ❌ 250 lượt > 8 tv |
| `hs/cau-theo-qid [ôn]` | 205 | 0 | 13 ms | 133 ms | 2.5 / 3 / 4 | 44 / 41 / 850 | 0.0 | — |
| `hs/ca-dang-mo [mở]` | 250 | 0 | 49 ms | 88 ms | 2.0 / 2 / 3 | 29 / 30 / 31 | 0.0 | — |
| `notifications/list [nền]` | 690 | 0 | 60 ms | 158 ms | 3.1 / 4 / 4 | 10 / 12 / 16 | 0.0 | — |
| `game-v2/complete [Đảo]` 🔒 | 100 | 0 | 13 ms | 53 ms | 13.2 / 14 / 14 | 65 / 136 / 223 | 0.1 | — |
| `notifications/list [mở]` | 250 | 0 | 51 ms | 91 ms | 3.0 / 3 / 4 | 9 / 12 / 15 | 0.0 | — |
| `presence [nền]` | 2220 | 0 | 9 ms | 62 ms | 1.0 / 1 / 2 | 1 / 1 / 6 | 2.0 | — |
| `hs/btvn [mở]` | 250 | 0 | 4 ms | 43 ms | 1.0 / 1 / 1 | 7 / 8 / 8 | 0.0 | — |
| `game-v2/resume [Đảo]` | 100 | 0 | 9 ms | 120 ms | 3.0 / 3 / 3 | 3 / 3 / 3 | 0.0 | — |
| `mom/list [nền]` | 690 | 0 | 50 ms | 131 ms | 1.2 / 2 / 2 | 0 / 1 / 3 | 0.0 | — |
| `mom/list [mở]` | 250 | 0 | 40 ms | 77 ms | 1.0 / 1 / 2 | 0 / 0 / 2 | 0.0 | — |
| `hs/thu-thach-hom-nay [mở]` | 250 | 0 | 47 ms | 87 ms | 2.0 / 2 / 3 | 0 / 0 / 1 | 0.0 | — |
| `presence [mở]` | 250 | 0 | 39 ms | 76 ms | 1.0 / 1 / 1 | 0 / 0 / 0 | 3.0 | — |

🔒 = lệnh nộp (ngân sách truy vấn 15). Thời gian p50/p95 là thời gian máy khách đo (gồm cả xếp hàng ở Worker cục bộ), không phải thời gian D1 thật.

## 2. Lệnh VƯỢT ngân sách

| Lệnh | Vượt truy vấn | Vượt dòng đọc | Truy vấn max (trần) | Dòng đọc max (trần 2.000) |
|---|---:|---:|---|---|
| `game-v2/recommendations [Đảo]` | 100/100 | 79/100 | 57 (8) | 182.045 |
| `hs/thi-dua-hom-nay [nền]` | 0/690 | 52/690 | 8 (8) | 24.853 |
| `game-v2/so-tay [Đảo]` | 100/100 | 9/100 | 22 (8) | 21.380 |
| `hs/thi-dua-hom-nay [mở]` | 0/250 | 10/250 | 6 (8) | 19.223 |
| `btvn/xong-lo [nộp chặng]` | 243/243 | 149/243 | 77 (15) | 8.902 |
| `hs/ke-hoach-ngay [dựng đầu ngày]` | 250/250 | 89/250 | 60 (8) | 7.662 |
| `hs/ke-hoach-ngay [nền]` | 655/690 | 259/690 | 62 (8) | 7.158 |
| `hs/ke-hoach-ngay [sau ghi]` | 448/448 | 195/448 | 57 (8) | 7.120 |
| `game-v2/start [Đảo]` | 100/100 | 77/100 | 36 (8) | 7.106 |
| `hs/ke-hoach-ngay [mở]` | 165/250 | 60/250 | 56 (8) | 6.181 |
| `hs/on-lai/nop [nộp ôn]` | 205/205 | 39/205 | 37 (15) | 3.960 |
| `btvn/cua-em [chặng]` | 174/243 | 0/243 | 10 (8) | 1.634 |
| `game-v2/profile [Đảo]` | 250/250 | 0/250 | 10 (8) | 431 |
| `game-v2/academic-sync [nền]` | 690/690 | 0/690 | 10 (8) | 310 |
| `game-v2/academic-sync [mở]` | 250/250 | 0/250 | 13 (8) | 309 |

## 3. Top 15 truy vấn theo tổng dòng đọc

| # | Dòng đọc tổng | Số lần | Dòng/lần | Lệnh gọi nhiều nhất | Khung câu SQL |
|---:|---:|---:|---:|---|---|
| 1 | 733.052 | 940 | 780 | hs/thi-dua-hom-nay [nền], hs/thi-dua-hom-nay [mở] | `SELECT sbd, ngay_vn, COUNT(*) AS n, MAX(luc1) AS luc FROM ( SELECT sbd, ngay_vn, qid, MIN(luc) AS luc1 FROM su_kien_hoc WHERE sbd IN (SELECT value FR…` |
| 2 | 610.364 | 1.518 | 402 | hs/ke-hoach-ngay [nền], hs/ke-hoach-ngay [sau ghi] | `SELECT 'g' AS k, giay AS a, NULL AS b FROM (SELECT giay FROM su_kien_hoc WHERE sbd = ? AND giay IS NOT NULL AND ngay_vn >= ? ORDER BY luc DESC LIMIT …` |
| 3 | 601.179 | 206 | 2.918 | game-v2/recommendations [Đảo], game-v2/start [Đảo] | `SELECT DISTINCT q.dang AS dang FROM chi_tiet_cau cc JOIN ca c ON c.ma_ca = cc.ma_ca JOIN game_v2_question q ON q.qid = cc.qid WHERE cc.sbd IN (SELECT…` |
| 4 | 506.676 | 1.966 | 258 | hs/ke-hoach-ngay [nền], hs/ke-hoach-ngay [sau ghi] | `SELECT khoa, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, ma_dang, chuyen_de FROM su_kien_hoc WHERE sbd = ? ORDER BY luc, khoa` |
| 5 | 498.200 | 940 | 530 | hs/thi-dua-hom-nay [nền], hs/thi-dua-hom-nay [mở] | `SELECT sbd, ho_ten, lop, ten_lop, 1 AS uu FROM hoc_sinh WHERE COALESCE(trang_thai, '') <> 'khoa' UNION ALL SELECT sbd, ho_ten, lop, NULL AS ten_lop, …` |
| 6 | 371.740 | 1.909 | 195 | hs/ke-hoach-ngay [nền], hs/ke-hoach-ngay [sau ghi] | `SELECT qid, MIN(json_extract(json, '$.phan')) AS phan, MIN(json_extract(json, '$.sao')) AS sao FROM game_v2_question WHERE qid IN (SELECT value FROM …` |
| 7 | 308.371 | 1.144 | 270 | btvn/xong-lo [nộp chặng], hs/on-lai/nop [nộp ôn] | `SELECT khoa, sbd, qid, nguon, ket_qua, giay, luc, ngay_vn, ma_dang, chuyen_de FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?)) ORDER BY…` |
| 8 | 249.365 | 941 | 265 | daily-honors [nền], daily-honors [mở] | `SELECT l.sbd,COALESCE(h.ho_ten,l.ho_ten) ho_ten,l.tong,l.nop_luc,l.vao_luc,c.ten_ca, json_extract(g.json,'$.nickname') nickname,json_extract(g.json,'…` |
| 9 | 245.669 | 1.761 | 140 | hs/ke-hoach-ngay [nền], hs/ke-hoach-ngay [sau ghi] | `SELECT e.sbd, COUNT(*) AS so_su_kien, COUNT(DISTINCT CASE WHEN e.ngay_vn = ? THEN e.qid END) AS da_lam, COUNT(DISTINCT CASE WHEN e.ngay_vn = ? AND e.…` |
| 10 | 222.313 | 903 | 246 | btvn/xong-lo [nộp chặng], btvn/cua-em [chặng] | `SELECT 'd' AS k, sbd, ma_dang AS a, bac AS b, so_gap AS c, so_sai AS d, so_da_khac_phuc AS e, so_chua_thay_sai AS f FROM nam_kt_dang WHERE sbd IN (SE…` |
| 11 | 208.806 | 1.536 | 136 | hs/ke-hoach-ngay [nền], hs/ke-hoach-ngay [sau ghi] | `SELECT q.qid, q.content_group, q.json FROM game_v2_question q JOIN de_kho d ON d.ma_de = q.ma_de JOIN game_v2_index g ON g.ma_de = d.ma_de AND g.sour…` |
| 12 | 160.800 | 300 | 536 | game-v2/recommendations [Đảo], game-v2/so-tay [Đảo] | `SELECT COUNT(*) AS n, COALESCE(MAX(d.cap_nhat_luc),'') AS t, COALESCE(GROUP_CONCAT(d.ma_de),'') AS ids FROM de_kho d JOIN game_v2_index g ON g.ma_de=…` |
| 13 | 147.023 | 591 | 249 | btvn/cua-em [chặng], btvn/xong-lo [nộp chặng] | `SELECT qid, dang, chuyen_de, muc_do, sao, phan, loi, ghim FROM btvn_cau WHERE ma_btvn = ? ORDER BY thu_tu` |
| 14 | 120.399 | 459 | 262 | game-v2/recommendations [Đảo], game-v2/so-tay [Đảo] | `SELECT q.json FROM game_v2_question q JOIN de_kho d ON d.ma_de=q.ma_de JOIN game_v2_index g ON g.ma_de=d.ma_de AND g.source_version=d.cap_nhat_luc WH…` |
| 15 | 86.991 | 107 | 813 | hs/ke-hoach-ngay [nền], game-v2/answer [Đảo] | `SELECT ca.ma_ca,ca.bank_r2,ca.cap_nhat_luc,ca.trang_thai,ca.cong_bo,ca.het_han_vao,ca.thoi_gian_phut,ca.loai,ca.han_nop,ca.bat_dau, (SELECT COUNT(*) …` |

## 4. Tải D1 (ước lượng)

- Tổng thời gian D1 ghi nhận (`meta.duration` của D1 cục bộ): 10.31 giây trong 659 giây chạy thật ⇒ ~0.9 giây D1 / phút ở tải thật. D1 cục bộ là SQLite trong bộ nhớ đệm, **nhanh hơn D1 thật nhiều lần**: dùng SỐ TRUY VẤN và SỐ DÒNG ĐỌC làm thước đo chính, không dùng mili-giây.
- Mỗi dòng đọc trên D1 thật tính tiền/tải như nhau; lệnh nào đọc > 2.000 dòng là ứng viên chỉ mục hoặc đệm.

## Ghi chú đo

- Đăng nhập được 250/250 em giả (bước thiết lập, không tính vào bảng).
- Chặng: 243 em thử làm, 243 nộp được, 7 lỗi/không có bài. Ôn: 205 em có việc ôn (nộp được 205), 45 em không có câu tới hạn. Đảo: 250 em thử, 100 xong lượt, 0 hết lượt/không có câu.
- Lỗi/từ chối hay gặp (không phải lỗi bộ đo — nhiều là đúng luật máy chủ): chặng: em không có bài về nhà chưa nộp ×7
- Đáp án của em giả là NGẪU NHIÊN; thời gian "làm" giữa các bước là ngẫu nhiên. D1 cục bộ nhanh hơn D1 thật: số truy vấn và dòng đọc là thước đo chính.
- LƯỢT 1 — bộ đệm mô-đun của Worker (DemTTL: kho câu, xác thực, đề bảo vệ…) còn TRỐNG, y như vừa đẩy bản mới.
- Migration chỉ-thêm của cây mã đã áp lên bản sao D1 cục bộ (câu MỚI so với mẫu; lỗi 'đã có' bỏ qua): migration-2109-chi-muc-luot.sql (+1 đối tượng: bảng/chỉ mục/cột)
- Mẫu phản hồi để so trước/sau: 40 em đầu (`so-sanh-phan-hoi.mjs`); dò lộ đáp án: xem trên
- Cây mã: commit 2de7c41 (worktree sạch).

