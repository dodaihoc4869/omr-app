# Bản đo tải giả — 071f5b6

Bộ bắn tải giả `scripts/ban-tai-gia/` (Code 1). Chạy lúc 2026-09-22 08:52:01 (giờ VN). **D1 CỤC BỘ** nạp từ bản sao lưu `omr-d1-20260921-1807-truoc-929aad6.sql`; Worker = mã tại commit `071f5b6` bọc vỏ đo (`vo-do.ts`); **không** bắn vào máy chủ thật.

- **Mô phỏng:** 250 em × 10 phút giờ cao điểm (chạy thật 662 giây): mở app (kế hoạch ngày, bài về nhà, Thi đua, thông báo…), hỏi nền mỗi 180 giây, làm + nộp 1 chặng, ôn 3 câu, 1 lượt Đảo.
- **Tổng:** 12.764 lượt gọi · 145.568 truy vấn D1 · 6.351.283 dòng đọc · trung bình 11.4 truy vấn và 498 dòng đọc mỗi lượt.
- **Ngân sách (Boss):** ≤ 8 truy vấn và ≤ 2.000 dòng đọc mỗi lượt; lệnh nộp ≤ 15 truy vấn.
- **Kết luận:** ❌ **15/32 lệnh VƯỢT ngân sách** (xem mục 2).

## 1. Bảng theo lệnh (xếp theo tổng dòng đọc giảm dần)

| Lệnh | Lượt | Lỗi | p50 | p95 | Truy vấn TB / p95 / max | Dòng đọc TB / p95 / max | Dòng ghi TB | Vượt |
|---|---:|---:|---:|---:|---|---|---:|---|
| `hs/thi-dua-hom-nay [nền]` | 693 | 0 | 64 ms | 116 ms | 5.1 / 6 / 8 | 1.471 / 6.990 / 24.811 | 0.0 | ❌ 51 lượt > 2.000 dòng |
| `hs/ke-hoach-ngay [nền]` | 693 | 0 | 51 ms | 129 ms | 49.2 / 57 / 61 | 1.423 / 3.269 / 6.671 | 6.4 | ❌ 656 lượt > 8 tv; 165 lượt > 2.000 dòng |
| `game-v2/recommendations [Đảo]` | 100 | 0 | 49 ms | 221 ms | 31.8 / 38 / 57 | 7.773 / 7.093 / 188.117 | 14.0 | ❌ 100 lượt > 8 tv; 81 lượt > 2.000 dòng |
| `hs/ke-hoach-ngay [sau ghi]` | 447 | 0 | 48 ms | 241 ms | 51.2 / 53 / 55 | 1.576 / 3.366 / 6.633 | 1.1 | ❌ 447 lượt > 8 tv; 132 lượt > 2.000 dòng |
| `btvn/xong-lo [nộp chặng]` 🔒 | 243 | 0 | 78 ms | 299 ms | 66.7 / 71 / 75 | 2.574 / 4.602 / 8.415 | 149.1 | ❌ 243 lượt > 15 tv; 141 lượt > 2.000 dòng |
| `hs/ke-hoach-ngay [dựng đầu ngày]` | 250 | 0 | 232 ms | 270 ms | 50.6 / 57 / 60 | 1.413 / 3.399 / 7.595 | 4.3 | ❌ 250 lượt > 8 tv; 61 lượt > 2.000 dòng |
| `game-v2/start [Đảo]` | 100 | 0 | 48 ms | 160 ms | 33.6 / 34 / 36 | 3.311 / 6.097 / 7.106 | 3.0 | ❌ 100 lượt > 8 tv; 77 lượt > 2.000 dòng |
| `hs/thi-dua-hom-nay [mở]` | 250 | 0 | 54 ms | 104 ms | 4.0 / 4 / 6 | 1.008 / 1.108 / 19.223 | 0.0 | ❌ 10 lượt > 2.000 dòng |
| `hs/on-lai/nop [nộp ôn]` 🔒 | 204 | 0 | 33 ms | 91 ms | 29.7 / 33 / 36 | 1.204 / 2.344 / 3.498 | 53.7 | ❌ 204 lượt > 15 tv; 23 lượt > 2.000 dòng |
| `hs/ke-hoach-ngay [mở]` | 250 | 0 | 35 ms | 104 ms | 32.3 / 53 / 54 | 905 / 2.738 / 5.694 | 0.7 | ❌ 165 lượt > 8 tv; 42 lượt > 2.000 dòng |
| `daily-honors [nền]` | 693 | 0 | 59 ms | 101 ms | 3.0 / 3 / 4 | 266 / 266 / 271 | 0.0 | — |
| `btvn/cua-em [chặng]` | 243 | 0 | 19 ms | 101 ms | 8.0 / 10 / 10 | 747 / 1.407 / 1.634 | 84.4 | ❌ 174 lượt > 8 tv |
| `game-v2/so-tay [Đảo]` | 100 | 0 | 55 ms | 159 ms | 9.8 / 10 / 19 | 1.440 / 2.036 / 11.039 | 0.0 | ❌ 100 lượt > 8 tv; 6 lượt > 2.000 dòng |
| `daily-honors [mở]` | 250 | 0 | 50 ms | 94 ms | 3.0 / 3 / 6 | 267 / 266 / 531 | 0.0 | — |
| `hs/lich-su [mở]` | 250 | 0 | 44 ms | 80 ms | 1.9 / 2 / 2 | 221 / 361 / 660 | 0.0 | — |
| `game-v2/academic-sync [nền]` | 693 | 0 | 65 ms | 114 ms | 9.2 / 10 / 10 | 73 / 101 / 310 | 1.0 | ❌ 693 lượt > 8 tv |
| `game-v2/profile [Đảo]` | 250 | 0 | 15 ms | 71 ms | 9.5 / 10 / 10 | 183 / 249 / 431 | 0.0 | ❌ 250 lượt > 8 tv |
| `game-v2/answer [Đảo]` 🔒 | 600 | 0 | 16 ms | 48 ms | 9.4 / 10 / 11 | 37 / 12 / 824 | 12.4 | — |
| `hs/ca-dang-mo [nền]` | 693 | 0 | 58 ms | 100 ms | 2.1 / 3 / 3 | 29 / 31 / 35 | 0.0 | — |
| `game-v2/academic-sync [mở]` | 250 | 0 | 59 ms | 107 ms | 10.6 / 12 / 13 | 73 / 100 / 309 | 2.1 | ❌ 250 lượt > 8 tv |
| `hs/cau-theo-qid [ôn]` | 204 | 0 | 14 ms | 79 ms | 2.5 / 3 / 4 | 68 / 48 / 854 | 0.0 | — |
| `hs/ca-dang-mo [mở]` | 250 | 0 | 49 ms | 85 ms | 2.0 / 2 / 3 | 29 / 30 / 31 | 0.0 | — |
| `notifications/list [nền]` | 693 | 0 | 59 ms | 104 ms | 3.1 / 4 / 4 | 9 / 12 / 16 | 0.0 | — |
| `game-v2/complete [Đảo]` 🔒 | 100 | 0 | 13 ms | 37 ms | 13.2 / 14 / 14 | 65 / 136 / 223 | 0.1 | — |
| `notifications/list [mở]` | 250 | 0 | 51 ms | 90 ms | 3.0 / 3 / 4 | 9 / 12 / 15 | 0.0 | — |
| `presence [nền]` | 2222 | 1 | 10 ms | 54 ms | 1.0 / 1 / 2 | 1 / 1 / 6 | 2.0 | — |
| `hs/btvn [mở]` | 250 | 0 | 4 ms | 43 ms | 1.0 / 1 / 1 | 7 / 8 / 8 | 0.0 | — |
| `game-v2/resume [Đảo]` | 100 | 0 | 5 ms | 62 ms | 3.0 / 3 / 3 | 3 / 3 / 3 | 0.0 | — |
| `mom/list [nền]` | 693 | 0 | 50 ms | 91 ms | 1.1 / 2 / 2 | 0 / 1 / 5 | 0.0 | — |
| `mom/list [mở]` | 250 | 0 | 39 ms | 74 ms | 1.0 / 1 / 2 | 0 / 0 / 2 | 0.0 | — |
| `hs/thu-thach-hom-nay [mở]` | 250 | 0 | 45 ms | 80 ms | 2.0 / 2 / 3 | 0 / 0 / 1 | 0.0 | — |
| `presence [mở]` | 250 | 0 | 37 ms | 71 ms | 1.0 / 1 / 1 | 0 / 0 / 0 | 3.0 | — |

🔒 = lệnh nộp (ngân sách truy vấn 15). Thời gian p50/p95 là thời gian máy khách đo (gồm cả xếp hàng ở Worker cục bộ), không phải thời gian D1 thật.

## 2. Lệnh VƯỢT ngân sách

| Lệnh | Vượt truy vấn | Vượt dòng đọc | Truy vấn max (trần) | Dòng đọc max (trần 2.000) |
|---|---:|---:|---|---|
| `game-v2/recommendations [Đảo]` | 100/100 | 81/100 | 57 (8) | 188.117 |
| `hs/thi-dua-hom-nay [nền]` | 0/693 | 51/693 | 8 (8) | 24.811 |
| `hs/thi-dua-hom-nay [mở]` | 0/250 | 10/250 | 6 (8) | 19.223 |
| `game-v2/so-tay [Đảo]` | 100/100 | 6/100 | 19 (8) | 11.039 |
| `btvn/xong-lo [nộp chặng]` | 243/243 | 141/243 | 75 (15) | 8.415 |
| `hs/ke-hoach-ngay [dựng đầu ngày]` | 250/250 | 61/250 | 60 (8) | 7.595 |
| `game-v2/start [Đảo]` | 100/100 | 77/100 | 36 (8) | 7.106 |
| `hs/ke-hoach-ngay [nền]` | 656/693 | 165/693 | 61 (8) | 6.671 |
| `hs/ke-hoach-ngay [sau ghi]` | 447/447 | 132/447 | 55 (8) | 6.633 |
| `hs/ke-hoach-ngay [mở]` | 165/250 | 42/250 | 54 (8) | 5.694 |
| `hs/on-lai/nop [nộp ôn]` | 204/204 | 23/204 | 36 (15) | 3.498 |
| `btvn/cua-em [chặng]` | 174/243 | 0/243 | 10 (8) | 1.634 |
| `game-v2/profile [Đảo]` | 250/250 | 0/250 | 10 (8) | 431 |
| `game-v2/academic-sync [nền]` | 693/693 | 0/693 | 10 (8) | 310 |
| `game-v2/academic-sync [mở]` | 250/250 | 0/250 | 13 (8) | 309 |

## 3. Top 15 truy vấn theo tổng dòng đọc

| # | Dòng đọc tổng | Số lần | Dòng/lần | Lệnh gọi nhiều nhất | Khung câu SQL |
|---:|---:|---:|---:|---|---|
| 1 | 721.468 | 943 | 765 | hs/thi-dua-hom-nay [nền], hs/thi-dua-hom-nay [mở] | `SELECT sbd, ngay_vn, COUNT(*) AS n, MAX(luc1) AS luc FROM ( SELECT sbd, ngay_vn, qid, MIN(luc) AS luc1 FROM su_kien_hoc WHERE sbd IN (SELECT value FR…` |
| 2 | 608.512 | 1.518 | 401 | hs/ke-hoach-ngay [nền], hs/ke-hoach-ngay [sau ghi] | `SELECT 'g' AS k, giay AS a, NULL AS b FROM (SELECT giay FROM su_kien_hoc WHERE sbd = ? AND giay IS NOT NULL AND ngay_vn >= ? ORDER BY luc DESC LIMIT …` |
| 3 | 601.179 | 206 | 2.918 | game-v2/recommendations [Đảo], game-v2/start [Đảo] | `SELECT DISTINCT q.dang AS dang FROM chi_tiet_cau cc JOIN ca c ON c.ma_ca = cc.ma_ca JOIN game_v2_question q ON q.qid = cc.qid WHERE cc.sbd IN (SELECT…` |
| 4 | 505.031 | 1.965 | 257 | hs/ke-hoach-ngay [nền], hs/ke-hoach-ngay [sau ghi] | `SELECT khoa, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, ma_dang, chuyen_de FROM su_kien_hoc WHERE sbd = ? ORDER BY luc, khoa` |
| 5 | 499.790 | 943 | 530 | hs/thi-dua-hom-nay [nền], hs/thi-dua-hom-nay [mở] | `SELECT sbd, ho_ten, lop, ten_lop, 1 AS uu FROM hoc_sinh WHERE COALESCE(trang_thai, '') <> 'khoa' UNION ALL SELECT sbd, ho_ten, lop, NULL AS ten_lop, …` |
| 6 | 305.069 | 1.140 | 268 | btvn/xong-lo [nộp chặng], hs/on-lai/nop [nộp ôn] | `SELECT khoa, sbd, qid, nguon, ket_qua, giay, luc, ngay_vn, ma_dang, chuyen_de FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?)) ORDER BY…` |
| 7 | 250.160 | 944 | 265 | daily-honors [nền], daily-honors [mở] | `SELECT l.sbd,COALESCE(h.ho_ten,l.ho_ten) ho_ten,l.tong,l.nop_luc,l.vao_luc,c.ten_ca, json_extract(g.json,'$.nickname') nickname,json_extract(g.json,'…` |
| 8 | 244.890 | 1.761 | 139 | hs/ke-hoach-ngay [nền], hs/ke-hoach-ngay [sau ghi] | `SELECT e.sbd, COUNT(*) AS so_su_kien, COUNT(DISTINCT CASE WHEN e.ngay_vn = ? THEN e.qid END) AS da_lam, COUNT(DISTINCT CASE WHEN e.ngay_vn = ? AND e.…` |
| 9 | 222.313 | 903 | 246 | btvn/xong-lo [nộp chặng], btvn/cua-em [chặng] | `SELECT 'd' AS k, sbd, ma_dang AS a, bac AS b, so_gap AS c, so_sai AS d, so_da_khac_phuc AS e, so_chua_thay_sai AS f FROM nam_kt_dang WHERE sbd IN (SE…` |
| 10 | 208.844 | 1.541 | 136 | hs/ke-hoach-ngay [nền], hs/ke-hoach-ngay [sau ghi] | `SELECT q.qid, q.content_group, q.json FROM game_v2_question q JOIN de_kho d ON d.ma_de = q.ma_de JOIN game_v2_index g ON g.ma_de = d.ma_de AND g.sour…` |
| 11 | 160.800 | 300 | 536 | game-v2/recommendations [Đảo], game-v2/so-tay [Đảo] | `SELECT COUNT(*) AS n, COALESCE(MAX(d.cap_nhat_luc),'') AS t, COALESCE(GROUP_CONCAT(d.ma_de),'') AS ids FROM de_kho d JOIN game_v2_index g ON g.ma_de=…` |
| 12 | 147.023 | 591 | 249 | btvn/cua-em [chặng], btvn/xong-lo [nộp chặng] | `SELECT qid, dang, chuyen_de, muc_do, sao, phan, loi, ghim FROM btvn_cau WHERE ma_btvn = ? ORDER BY thu_tu` |
| 13 | 120.399 | 459 | 262 | game-v2/recommendations [Đảo], game-v2/so-tay [Đảo] | `SELECT q.json FROM game_v2_question q JOIN de_kho d ON d.ma_de=q.ma_de JOIN game_v2_index g ON g.ma_de=d.ma_de AND g.source_version=d.cap_nhat_luc WH…` |
| 14 | 86.991 | 107 | 813 | hs/ke-hoach-ngay [nền], game-v2/answer [Đảo] | `SELECT ca.ma_ca,ca.bank_r2,ca.cap_nhat_luc,ca.trang_thai,ca.cong_bo,ca.het_han_vao,ca.thoi_gian_phut,ca.loai,ca.han_nop,ca.bat_dau, (SELECT COUNT(*) …` |
| 15 | 86.586 | 300 | 289 | game-v2/recommendations [Đảo], game-v2/so-tay [Đảo] | `SELECT qid,trang_thai,luc_cuoi,nguon_cuoi FROM nam_kt_cau WHERE sbd=? AND qid IN (SELECT qid FROM su_kien_hoc s WHERE s.sbd=? AND (s.nguon NOT IN ('t…` |

## 4. Tải D1 (ước lượng)

- Tổng thời gian D1 ghi nhận (`meta.duration` của D1 cục bộ): 9.45 giây trong 662 giây chạy thật ⇒ ~0.9 giây D1 / phút ở tải thật. D1 cục bộ là SQLite trong bộ nhớ đệm, **nhanh hơn D1 thật nhiều lần**: dùng SỐ TRUY VẤN và SỐ DÒNG ĐỌC làm thước đo chính, không dùng mili-giây.
- Mỗi dòng đọc trên D1 thật tính tiền/tải như nhau; lệnh nào đọc > 2.000 dòng là ứng viên chỉ mục hoặc đệm.

## Ghi chú đo

- Đăng nhập được 250/250 em giả (bước thiết lập, không tính vào bảng).
- Chặng: 243 em thử làm, 243 nộp được, 7 lỗi/không có bài. Ôn: 204 em có việc ôn (nộp được 204), 46 em không có câu tới hạn. Đảo: 250 em thử, 100 xong lượt, 0 hết lượt/không có câu.
- Lỗi/từ chối hay gặp (không phải lỗi bộ đo — nhiều là đúng luật máy chủ): chặng: em không có bài về nhà chưa nộp ×7
- Đáp án của em giả là NGẪU NHIÊN; thời gian "làm" giữa các bước là ngẫu nhiên. D1 cục bộ nhanh hơn D1 thật: số truy vấn và dòng đọc là thước đo chính.
- Migration chỉ-thêm của cây mã đã áp lên bản sao D1 cục bộ (câu MỚI so với mẫu; lỗi 'đã có' bỏ qua): migration-2109-chi-muc-luot.sql (+1 đối tượng: bảng/chỉ mục/cột)
- Mẫu phản hồi để so trước/sau: 40 em đầu (`so-sanh-phan-hoi.mjs`); dò lộ đáp án: xem trên
- Cây mã: commit 071f5b6 (worktree sạch).

