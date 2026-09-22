# Bản đo tải giả — d1f9313-am

Bộ bắn tải giả `scripts/ban-tai-gia/` (Code 1). Chạy lúc 2026-09-22 12:07:08 (giờ VN). **D1 CỤC BỘ** nạp từ bản sao lưu `omr-d1-20260921-1807-truoc-929aad6.sql`; Worker = mã tại commit `d1f9313-am` bọc vỏ đo (`vo-do.ts`); **không** bắn vào máy chủ thật.

- **Mô phỏng:** 250 em × 10 phút giờ cao điểm (chạy thật 659 giây): mở app (kế hoạch ngày, bài về nhà, Thi đua, thông báo…), hỏi nền mỗi 180 giây, làm + nộp 1 chặng, ôn 3 câu, 1 lượt Đảo.
- **Tổng:** 12.711 lượt gọi · 137.255 truy vấn D1 · 6.040.029 dòng đọc · trung bình 10.8 truy vấn và 475 dòng đọc mỗi lượt.
- **Ngân sách (Boss):** ≤ 8 truy vấn và ≤ 2.000 dòng đọc mỗi lượt; lệnh nộp ≤ 15 truy vấn.
- **Kết luận:** ❌ **16/32 lệnh VƯỢT ngân sách** (xem mục 2).

## 1. Bảng theo lệnh (xếp theo tổng dòng đọc giảm dần)

| Lệnh | Lượt | Lỗi | p50 | p95 | Truy vấn TB / p95 / max | Dòng đọc TB / p95 / max | Dòng ghi TB | Vượt |
|---|---:|---:|---:|---:|---|---|---:|---|
| `hs/thi-dua-hom-nay [nền]` | 690 | 0 | 60 ms | 103 ms | 4.1 / 5 / 6 | 1.541 / 7.611 / 27.321 | 0.0 | ❌ 49 lượt > 2.000 dòng |
| `hs/ke-hoach-ngay [nền]` | 690 | 0 | 46 ms | 117 ms | 46.8 / 54 / 56 | 1.495 / 3.490 / 6.757 | 6.2 | ❌ 662 lượt > 8 tv; 179 lượt > 2.000 dòng |
| `hs/ke-hoach-ngay [sau ghi]` | 434 | 0 | 29 ms | 87 ms | 48.2 / 50 / 52 | 1.630 / 3.393 / 6.733 | 1.3 | ❌ 434 lượt > 8 tv; 141 lượt > 2.000 dòng |
| `btvn/xong-lo [nộp chặng]` 🔒 | 243 | 0 | 53 ms | 90 ms | 58.2 / 66 / 68 | 2.478 / 4.358 / 7.629 | 20.0 | ❌ 243 lượt > 15 tv; 137 lượt > 2.000 dòng |
| `hs/ke-hoach-ngay [dựng đầu ngày]` | 250 | 0 | 215 ms | 259 ms | 48.5 / 50 / 55 | 1.464 / 3.034 / 5.784 | 1.1 | ❌ 250 lượt > 8 tv; 59 lượt > 2.000 dòng |
| `game-v2/start [Đảo]` | 100 | 0 | 43 ms | 87 ms | 33.6 / 34 / 36 | 3.519 / 6.371 / 7.356 | 3.0 | ❌ 100 lượt > 8 tv; 81 lượt > 2.000 dòng |
| `game-v2/recommendations [Đảo]` | 100 | 0 | 49 ms | 88 ms | 30.7 / 32 / 33 | 3.492 / 6.271 / 7.269 | 0.0 | ❌ 100 lượt > 8 tv; 81 lượt > 2.000 dòng |
| `hs/on-lai/nop [nộp ôn]` 🔒 | 191 | 0 | 32 ms | 77 ms | 28.6 / 32 / 34 | 1.810 / 2.923 / 4.122 | 51.2 | ❌ 191 lượt > 15 tv; 61 lượt > 2.000 dòng |
| `hs/thi-dua-hom-nay [mở]` | 250 | 0 | 57 ms | 116 ms | 4.0 / 4 / 6 | 1.140 / 1.147 / 24.798 | 0.0 | ❌ 10 lượt > 2.000 dòng |
| `hs/ke-hoach-ngay [mở]` | 250 | 0 | 35 ms | 112 ms | 31.8 / 50 / 51 | 1.017 / 2.914 / 5.784 | 0.7 | ❌ 165 lượt > 8 tv; 49 lượt > 2.000 dòng |
| `daily-honors [nền]` | 690 | 0 | 56 ms | 97 ms | 3.0 / 3 / 3 | 266 / 266 / 266 | 0.0 | — |
| `game-v2/so-tay [Đảo]` | 100 | 0 | 52 ms | 85 ms | 9.7 / 10 / 12 | 1.373 / 1.933 / 3.058 | 0.0 | ❌ 100 lượt > 8 tv; 5 lượt > 2.000 dòng |
| `daily-honors [mở]` | 250 | 0 | 53 ms | 110 ms | 3.0 / 3 / 3 | 266 / 266 / 266 | 0.0 | — |
| `hs/lich-su [mở]` | 250 | 0 | 47 ms | 97 ms | 1.9 / 2 / 2 | 221 / 361 / 660 | 0.0 | — |
| `game-v2/profile [Đảo]` | 250 | 0 | 14 ms | 54 ms | 9.5 / 10 / 10 | 217 / 303 / 478 | 0.0 | ❌ 250 lượt > 8 tv |
| `game-v2/academic-sync [nền]` | 690 | 0 | 62 ms | 110 ms | 9.2 / 10 / 10 | 73 / 101 / 309 | 1.0 | ❌ 690 lượt > 8 tv |
| `btvn/cua-em [chặng]` | 243 | 0 | 17 ms | 37 ms | 3.0 / 3 / 3 | 112 / 133 / 150 | 0.0 | — |
| `game-v2/answer [Đảo]` 🔒 | 600 | 0 | 15 ms | 56 ms | 9.8 / 11 / 22 | 43 / 58 / 824 | 12.6 | ❌ 20 lượt > 15 tv |
| `hs/ca-dang-mo [nền]` | 690 | 0 | 55 ms | 95 ms | 2.1 / 3 / 3 | 29 / 31 / 31 | 0.0 | — |
| `game-v2/academic-sync [mở]` | 250 | 0 | 59 ms | 120 ms | 9.0 / 9 / 10 | 73 / 100 / 309 | 1.0 | ❌ 250 lượt > 8 tv |
| `hs/cau-theo-qid [ôn]` | 191 | 0 | 10 ms | 38 ms | 2.5 / 3 / 4 | 54 / 44 / 848 | 0.0 | — |
| `game-v2/resume [Đảo]` | 100 | 0 | 10 ms | 75 ms | 13.0 / 13 / 13 | 75 / 146 / 234 | 0.0 | ❌ 100 lượt > 8 tv |
| `hs/ca-dang-mo [mở]` | 250 | 0 | 51 ms | 103 ms | 2.0 / 2 / 3 | 29 / 30 / 31 | 0.0 | — |
| `game-v2/complete [Đảo]` 🔒 | 100 | 0 | 13 ms | 39 ms | 13.5 / 14 / 14 | 71 / 151 / 230 | 0.0 | — |
| `notifications/list [nền]` | 690 | 0 | 57 ms | 97 ms | 3.1 / 4 / 4 | 9 / 12 / 16 | 0.0 | — |
| `notifications/list [mở]` | 250 | 0 | 53 ms | 105 ms | 3.0 / 3 / 4 | 9 / 12 / 15 | 0.0 | — |
| `presence [nền]` | 2229 | 0 | 11 ms | 39 ms | 1.0 / 1 / 2 | 1 / 1 / 6 | 2.0 | — |
| `hs/btvn [mở]` | 250 | 0 | 4 ms | 58 ms | 1.0 / 1 / 1 | 7 / 8 / 8 | 0.0 | — |
| `presence [mở]` | 250 | 0 | 39 ms | 87 ms | 1.0 / 1 / 1 | 1 / 1 / 1 | 2.0 | — |
| `mom/list [nền]` | 690 | 0 | 48 ms | 86 ms | 1.1 / 2 / 2 | 0 / 1 / 3 | 0.0 | — |
| `mom/list [mở]` | 250 | 0 | 41 ms | 90 ms | 1.0 / 1 / 2 | 0 / 0 / 2 | 0.0 | — |
| `hs/thu-thach-hom-nay [mở]` | 250 | 0 | 48 ms | 101 ms | 2.0 / 2 / 3 | 0 / 0 / 1 | 0.0 | — |

🔒 = lệnh nộp (ngân sách truy vấn 15). Thời gian p50/p95 là thời gian máy khách đo (gồm cả xếp hàng ở Worker cục bộ), không phải thời gian D1 thật.

## 2. Lệnh VƯỢT ngân sách

| Lệnh | Vượt truy vấn | Vượt dòng đọc | Truy vấn max (trần) | Dòng đọc max (trần 2.000) |
|---|---:|---:|---|---|
| `hs/thi-dua-hom-nay [nền]` | 0/690 | 49/690 | 6 (8) | 27.321 |
| `hs/thi-dua-hom-nay [mở]` | 0/250 | 10/250 | 6 (8) | 24.798 |
| `btvn/xong-lo [nộp chặng]` | 243/243 | 137/243 | 68 (15) | 7.629 |
| `game-v2/start [Đảo]` | 100/100 | 81/100 | 36 (8) | 7.356 |
| `game-v2/recommendations [Đảo]` | 100/100 | 81/100 | 33 (8) | 7.269 |
| `hs/ke-hoach-ngay [nền]` | 662/690 | 179/690 | 56 (8) | 6.757 |
| `hs/ke-hoach-ngay [sau ghi]` | 434/434 | 141/434 | 52 (8) | 6.733 |
| `hs/ke-hoach-ngay [dựng đầu ngày]` | 250/250 | 59/250 | 55 (8) | 5.784 |
| `hs/ke-hoach-ngay [mở]` | 165/250 | 49/250 | 51 (8) | 5.784 |
| `hs/on-lai/nop [nộp ôn]` | 191/191 | 61/191 | 34 (15) | 4.122 |
| `game-v2/so-tay [Đảo]` | 100/100 | 5/100 | 12 (8) | 3.058 |
| `game-v2/answer [Đảo]` | 20/600 | 0/600 | 22 (15) | 824 |
| `game-v2/profile [Đảo]` | 250/250 | 0/250 | 10 (8) | 478 |
| `game-v2/academic-sync [nền]` | 690/690 | 0/690 | 10 (8) | 309 |
| `game-v2/academic-sync [mở]` | 250/250 | 0/250 | 10 (8) | 309 |
| `game-v2/resume [Đảo]` | 100/100 | 0/100 | 13 (8) | 234 |

## 3. Top 15 truy vấn theo tổng dòng đọc

| # | Dòng đọc tổng | Số lần | Dòng/lần | Lệnh gọi nhiều nhất | Khung câu SQL |
|---:|---:|---:|---:|---|---|
| 1 | 784.686 | 940 | 835 | hs/thi-dua-hom-nay [nền], hs/thi-dua-hom-nay [mở] | `SELECT sbd, ngay_vn, COUNT(*) AS n, MAX(luc1) AS luc FROM ( SELECT sbd, ngay_vn, qid, MIN(luc) AS luc1 FROM su_kien_hoc WHERE sbd IN (SELECT value FR…` |
| 2 | 645.831 | 1.511 | 427 | hs/ke-hoach-ngay [nền], hs/ke-hoach-ngay [sau ghi] | `SELECT 'g' AS k, giay AS a, NULL AS b FROM (SELECT giay FROM su_kien_hoc WHERE sbd = ? AND giay IS NOT NULL AND ngay_vn >= ? ORDER BY luc DESC LIMIT …` |
| 3 | 529.757 | 1.945 | 272 | hs/ke-hoach-ngay [nền], hs/ke-hoach-ngay [sau ghi] | `SELECT khoa, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, ma_dang, chuyen_de FROM su_kien_hoc WHERE sbd = ? ORDER BY luc, khoa` |
| 4 | 498.200 | 940 | 530 | hs/thi-dua-hom-nay [nền], hs/thi-dua-hom-nay [mở] | `SELECT sbd, ho_ten, lop, ten_lop, 1 AS uu FROM hoc_sinh WHERE COALESCE(trang_thai, '') <> 'khoa' UNION ALL SELECT sbd, ho_ten, lop, NULL AS ten_lop, …` |
| 5 | 280.956 | 200 | 1.405 | game-v2/recommendations [Đảo], game-v2/start [Đảo] | `SELECT DISTINCT q.dang AS dang FROM ( SELECT y.qid FROM ( SELECT cc.qid, ROW_NUMBER() OVER (PARTITION BY cc.sbd ORDER BY c.bat_dau DESC) AS rn FROM c…` |
| 6 | 275.032 | 1.754 | 157 | hs/ke-hoach-ngay [nền], hs/ke-hoach-ngay [sau ghi] | `SELECT e.sbd, COUNT(*) AS so_su_kien, COUNT(DISTINCT CASE WHEN e.ngay_vn = ? THEN e.qid END) AS da_lam, COUNT(DISTINCT CASE WHEN e.ngay_vn = ? AND e.…` |
| 7 | 249.100 | 940 | 265 | daily-honors [nền], daily-honors [mở] | `SELECT l.sbd,COALESCE(h.ho_ten,l.ho_ten) ho_ten,l.tong,l.nop_luc,l.vao_luc,c.ten_ca, json_extract(g.json,'$.nickname') nickname,json_extract(g.json,'…` |
| 8 | 243.816 | 787 | 310 | btvn/xong-lo [nộp chặng], hs/on-lai/nop [nộp ôn] | `SELECT khoa, sbd, qid, nguon, ket_qua, giay, luc, ngay_vn, ma_dang, chuyen_de FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?)) ORDER BY…` |
| 9 | 183.596 | 1.377 | 133 | hs/ke-hoach-ngay [nền], hs/ke-hoach-ngay [sau ghi] | `SELECT q.qid, q.content_group, q.json FROM game_v2_question q JOIN de_kho d ON d.ma_de = q.ma_de JOIN game_v2_index g ON g.ma_de = d.ma_de AND g.sour…` |
| 10 | 183.230 | 729 | 251 | btvn/xong-lo [nộp chặng] | `SELECT 'd' AS k, sbd, ma_dang AS a, bac AS b, so_gap AS c, so_sai AS d, so_da_khac_phuc AS e, so_chua_thay_sai AS f FROM nam_kt_dang WHERE sbd IN (SE…` |
| 11 | 162.120 | 191 | 849 | hs/on-lai/nop [nộp ôn] | `SELECT qid, ket_qua FROM su_kien_hoc WHERE sbd = ? AND nguon = ? AND ma_nguon = ? AND lan = 1 AND qid IN (SELECT value FROM json_each(?))` |
| 12 | 160.800 | 300 | 536 | game-v2/recommendations [Đảo], game-v2/so-tay [Đảo] | `SELECT COUNT(*) AS n, COALESCE(MAX(d.cap_nhat_luc),'') AS t, COALESCE(GROUP_CONCAT(d.ma_de),'') AS ids FROM de_kho d JOIN game_v2_index g ON g.ma_de=…` |
| 13 | 123.894 | 474 | 261 | game-v2/recommendations [Đảo], game-v2/so-tay [Đảo] | `SELECT q.json FROM game_v2_question q JOIN de_kho d ON d.ma_de=q.ma_de JOIN game_v2_index g ON g.ma_de=d.ma_de AND g.source_version=d.cap_nhat_luc WH…` |
| 14 | 102.720 | 1.401 | 73 | hs/ke-hoach-ngay [nền], hs/ke-hoach-ngay [dựng đầu ngày] | `SELECT sbd, COUNT(*) AS n FROM nam_kt_cau WHERE sbd IN (SELECT value FROM json_each(?)) AND trang_thai IN ('moi_sai','dang_on') GROUP BY sbd` |
| 15 | 91.869 | 113 | 813 | hs/ke-hoach-ngay [nền], game-v2/answer [Đảo] | `SELECT ca.ma_ca,ca.bank_r2,ca.cap_nhat_luc,ca.trang_thai,ca.cong_bo,ca.het_han_vao,ca.thoi_gian_phut,ca.loai,ca.han_nop,ca.bat_dau, (SELECT COUNT(*) …` |

## 4. Tải D1 (ước lượng)

- Tổng thời gian D1 ghi nhận (`meta.duration` của D1 cục bộ): 7.74 giây trong 659 giây chạy thật ⇒ ~0.7 giây D1 / phút ở tải thật. D1 cục bộ là SQLite trong bộ nhớ đệm, **nhanh hơn D1 thật nhiều lần**: dùng SỐ TRUY VẤN và SỐ DÒNG ĐỌC làm thước đo chính, không dùng mili-giây.
- Mỗi dòng đọc trên D1 thật tính tiền/tải như nhau; lệnh nào đọc > 2.000 dòng là ứng viên chỉ mục hoặc đệm.

## Ghi chú đo

- Đăng nhập được 250/250 em giả (bước thiết lập, không tính vào bảng).
- Chặng: 243 em thử làm, 243 nộp được, 7 lỗi/không có bài. Ôn: 191 em có việc ôn (nộp được 191), 59 em không có câu tới hạn. Đảo: 250 em thử, 100 xong lượt, 0 hết lượt/không có câu.
- Lỗi/từ chối hay gặp (không phải lỗi bộ đo — nhiều là đúng luật máy chủ): chặng: em không có bài về nhà chưa nộp ×7
- Đáp án của em giả là NGẪU NHIÊN; thời gian "làm" giữa các bước là ngẫu nhiên. D1 cục bộ nhanh hơn D1 thật: số truy vấn và dòng đọc là thước đo chính.
- LƯỢT 2 — CÙNG Worker, bộ đệm mô-đun đã ẤM từ lượt 1 (dữ liệu D1 đã đổi theo lượt 1: em đã nộp/ôn/chơi — sát thật hơn "vừa đẩy", vì giờ cao điểm không ai gặp Worker vừa nguội).
- Migration chỉ-thêm của cây mã đã áp lên bản sao D1 cục bộ (câu MỚI so với mẫu; lỗi 'đã có' bỏ qua): migration-2109-chi-muc-luot.sql (+1 đối tượng: bảng/chỉ mục/cột)
- Mẫu phản hồi để so trước/sau: 40 em đầu (`so-sanh-phan-hoi.mjs`); dò lộ đáp án: xem trên
- Cây mã: commit d1f9313 (worktree sạch).

