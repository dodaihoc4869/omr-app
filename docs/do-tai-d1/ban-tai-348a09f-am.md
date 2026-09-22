# Bản đo tải giả — 348a09f-am

Bộ bắn tải giả `scripts/ban-tai-gia/` (Code 1). Chạy lúc 2026-09-22 09:15:30 (giờ VN). **D1 CỤC BỘ** nạp từ bản sao lưu `omr-d1-20260921-1807-truoc-929aad6.sql`; Worker = mã tại commit `348a09f-am` bọc vỏ đo (`vo-do.ts`); **không** bắn vào máy chủ thật.

- **Mô phỏng:** 250 em × 10 phút giờ cao điểm (chạy thật 661 giây): mở app (kế hoạch ngày, bài về nhà, Thi đua, thông báo…), hỏi nền mỗi 180 giây, làm + nộp 1 chặng, ôn 3 câu, 1 lượt Đảo.
- **Tổng:** 12.735 lượt gọi · 137.686 truy vấn D1 · 6.028.822 dòng đọc · trung bình 10.8 truy vấn và 473 dòng đọc mỗi lượt.
- **Ngân sách (Boss):** ≤ 8 truy vấn và ≤ 2.000 dòng đọc mỗi lượt; lệnh nộp ≤ 15 truy vấn.
- **Kết luận:** ❌ **16/32 lệnh VƯỢT ngân sách** (xem mục 2).

## 1. Bảng theo lệnh (xếp theo tổng dòng đọc giảm dần)

| Lệnh | Lượt | Lỗi | p50 | p95 | Truy vấn TB / p95 / max | Dòng đọc TB / p95 / max | Dòng ghi TB | Vượt |
|---|---:|---:|---:|---:|---|---|---:|---|
| `hs/thi-dua-hom-nay [nền]` | 693 | 0 | 60 ms | 98 ms | 4.1 / 5 / 7 | 1.537 / 7.606 / 27.335 | 0.0 | ❌ 52 lượt > 2.000 dòng |
| `hs/ke-hoach-ngay [nền]` | 693 | 0 | 49 ms | 105 ms | 46.4 / 54 / 56 | 1.473 / 3.397 / 6.796 | 6.2 | ❌ 659 lượt > 8 tv; 181 lượt > 2.000 dòng |
| `hs/ke-hoach-ngay [sau ghi]` | 436 | 0 | 30 ms | 83 ms | 48.1 / 50 / 51 | 1.639 / 3.401 / 6.744 | 1.1 | ❌ 436 lượt > 8 tv; 141 lượt > 2.000 dòng |
| `btvn/xong-lo [nộp chặng]` 🔒 | 243 | 0 | 54 ms | 97 ms | 59.2 / 67 / 70 | 2.493 / 4.390 / 7.644 | 19.3 | ❌ 243 lượt > 15 tv; 140 lượt > 2.000 dòng |
| `hs/ke-hoach-ngay [dựng đầu ngày]` | 250 | 0 | 225 ms | 285 ms | 48.5 / 50 / 55 | 1.438 / 3.055 / 5.784 | 1.1 | ❌ 250 lượt > 8 tv; 59 lượt > 2.000 dòng |
| `hs/on-lai/nop [nộp ôn]` 🔒 | 193 | 0 | 37 ms | 72 ms | 28.8 / 33 / 35 | 1.831 / 2.983 / 4.132 | 51.7 | ❌ 193 lượt > 15 tv; 61 lượt > 2.000 dòng |
| `game-v2/recommendations [Đảo]` | 100 | 0 | 54 ms | 88 ms | 30.8 / 32 / 33 | 3.464 / 6.187 / 7.182 | 0.0 | ❌ 100 lượt > 8 tv; 81 lượt > 2.000 dòng |
| `game-v2/start [Đảo]` | 100 | 0 | 44 ms | 88 ms | 33.6 / 34 / 36 | 3.458 / 6.290 / 7.269 | 3.0 | ❌ 100 lượt > 8 tv; 81 lượt > 2.000 dòng |
| `hs/thi-dua-hom-nay [mở]` | 250 | 0 | 63 ms | 114 ms | 4.0 / 4 / 6 | 1.107 / 1.078 / 24.808 | 0.0 | ❌ 9 lượt > 2.000 dòng |
| `hs/ke-hoach-ngay [mở]` | 250 | 0 | 38 ms | 106 ms | 31.8 / 50 / 51 | 1.021 / 2.866 / 5.785 | 0.7 | ❌ 165 lượt > 8 tv; 49 lượt > 2.000 dòng |
| `daily-honors [nền]` | 693 | 0 | 57 ms | 93 ms | 3.0 / 3 / 3 | 266 / 266 / 266 | 0.0 | — |
| `game-v2/so-tay [Đảo]` | 100 | 0 | 55 ms | 96 ms | 9.7 / 10 / 12 | 1.366 / 1.933 / 3.058 | 0.0 | ❌ 100 lượt > 8 tv; 5 lượt > 2.000 dòng |
| `daily-honors [mở]` | 250 | 0 | 58 ms | 105 ms | 3.0 / 3 / 3 | 266 / 266 / 266 | 0.0 | — |
| `hs/lich-su [mở]` | 250 | 0 | 48 ms | 93 ms | 1.9 / 2 / 2 | 221 / 361 / 660 | 0.0 | — |
| `game-v2/profile [Đảo]` | 250 | 0 | 15 ms | 51 ms | 9.5 / 10 / 10 | 217 / 307 / 478 | 0.0 | ❌ 250 lượt > 8 tv |
| `game-v2/academic-sync [nền]` | 693 | 0 | 62 ms | 103 ms | 9.2 / 10 / 10 | 73 / 101 / 310 | 1.0 | ❌ 693 lượt > 8 tv |
| `btvn/cua-em [chặng]` | 243 | 0 | 15 ms | 55 ms | 3.0 / 3 / 3 | 112 / 133 / 150 | 0.0 | — |
| `game-v2/answer [Đảo]` 🔒 | 600 | 1 | 16 ms | 54 ms | 9.9 / 12 / 22 | 42 / 63 / 850 | 12.6 | ❌ 29 lượt > 15 tv |
| `hs/ca-dang-mo [nền]` | 693 | 0 | 55 ms | 92 ms | 2.1 / 3 / 3 | 29 / 31 / 31 | 0.0 | — |
| `game-v2/academic-sync [mở]` | 250 | 0 | 65 ms | 115 ms | 9.0 / 9 / 10 | 73 / 100 / 309 | 1.0 | ❌ 250 lượt > 8 tv |
| `hs/cau-theo-qid [ôn]` | 193 | 0 | 10 ms | 43 ms | 2.5 / 3 / 4 | 62 / 48 / 851 | 0.0 | — |
| `game-v2/resume [Đảo]` | 100 | 0 | 10 ms | 49 ms | 13.0 / 13 / 13 | 75 / 146 / 234 | 0.0 | ❌ 100 lượt > 8 tv |
| `hs/ca-dang-mo [mở]` | 250 | 0 | 55 ms | 95 ms | 2.0 / 2 / 3 | 29 / 30 / 31 | 0.0 | — |
| `game-v2/complete [Đảo]` 🔒 | 100 | 1 | 13 ms | 51 ms | 13.4 / 14 / 14 | 71 / 151 / 230 | 0.0 | — |
| `notifications/list [nền]` | 693 | 0 | 57 ms | 93 ms | 3.1 / 4 / 5 | 9 / 12 / 16 | 0.0 | — |
| `notifications/list [mở]` | 250 | 0 | 58 ms | 105 ms | 3.0 / 3 / 4 | 9 / 12 / 15 | 0.0 | — |
| `presence [nền]` | 2226 | 0 | 11 ms | 37 ms | 1.0 / 1 / 2 | 1 / 1 / 6 | 2.0 | — |
| `hs/btvn [mở]` | 250 | 0 | 4 ms | 52 ms | 1.0 / 1 / 1 | 7 / 8 / 8 | 0.0 | — |
| `presence [mở]` | 250 | 0 | 42 ms | 79 ms | 1.0 / 1 / 1 | 1 / 1 / 1 | 2.0 | — |
| `mom/list [nền]` | 693 | 0 | 49 ms | 84 ms | 1.1 / 2 / 2 | 0 / 1 / 3 | 0.0 | — |
| `mom/list [mở]` | 250 | 0 | 43 ms | 80 ms | 1.0 / 1 / 2 | 0 / 0 / 2 | 0.0 | — |
| `hs/thu-thach-hom-nay [mở]` | 250 | 0 | 51 ms | 93 ms | 2.0 / 2 / 3 | 0 / 0 / 1 | 0.0 | — |

🔒 = lệnh nộp (ngân sách truy vấn 15). Thời gian p50/p95 là thời gian máy khách đo (gồm cả xếp hàng ở Worker cục bộ), không phải thời gian D1 thật.

## 2. Lệnh VƯỢT ngân sách

| Lệnh | Vượt truy vấn | Vượt dòng đọc | Truy vấn max (trần) | Dòng đọc max (trần 2.000) |
|---|---:|---:|---|---|
| `hs/thi-dua-hom-nay [nền]` | 0/693 | 52/693 | 7 (8) | 27.335 |
| `hs/thi-dua-hom-nay [mở]` | 0/250 | 9/250 | 6 (8) | 24.808 |
| `btvn/xong-lo [nộp chặng]` | 243/243 | 140/243 | 70 (15) | 7.644 |
| `game-v2/start [Đảo]` | 100/100 | 81/100 | 36 (8) | 7.269 |
| `game-v2/recommendations [Đảo]` | 100/100 | 81/100 | 33 (8) | 7.182 |
| `hs/ke-hoach-ngay [nền]` | 659/693 | 181/693 | 56 (8) | 6.796 |
| `hs/ke-hoach-ngay [sau ghi]` | 436/436 | 141/436 | 51 (8) | 6.744 |
| `hs/ke-hoach-ngay [mở]` | 165/250 | 49/250 | 51 (8) | 5.785 |
| `hs/ke-hoach-ngay [dựng đầu ngày]` | 250/250 | 59/250 | 55 (8) | 5.784 |
| `hs/on-lai/nop [nộp ôn]` | 193/193 | 61/193 | 35 (15) | 4.132 |
| `game-v2/so-tay [Đảo]` | 100/100 | 5/100 | 12 (8) | 3.058 |
| `game-v2/answer [Đảo]` | 29/600 | 0/600 | 22 (15) | 850 |
| `game-v2/profile [Đảo]` | 250/250 | 0/250 | 10 (8) | 478 |
| `game-v2/academic-sync [nền]` | 693/693 | 0/693 | 10 (8) | 310 |
| `game-v2/academic-sync [mở]` | 250/250 | 0/250 | 10 (8) | 309 |
| `game-v2/resume [Đảo]` | 100/100 | 0/100 | 13 (8) | 234 |

## 3. Top 15 truy vấn theo tổng dòng đọc

| # | Dòng đọc tổng | Số lần | Dòng/lần | Lệnh gọi nhiều nhất | Khung câu SQL |
|---:|---:|---:|---:|---|---|
| 1 | 775.825 | 943 | 823 | hs/thi-dua-hom-nay [nền], hs/thi-dua-hom-nay [mở] | `SELECT sbd, ngay_vn, COUNT(*) AS n, MAX(luc1) AS luc FROM ( SELECT sbd, ngay_vn, qid, MIN(luc) AS luc1 FROM su_kien_hoc WHERE sbd IN (SELECT value FR…` |
| 2 | 645.179 | 1.510 | 427 | hs/ke-hoach-ngay [nền], hs/ke-hoach-ngay [sau ghi] | `SELECT 'g' AS k, giay AS a, NULL AS b FROM (SELECT giay FROM su_kien_hoc WHERE sbd = ? AND giay IS NOT NULL AND ngay_vn >= ? ORDER BY luc DESC LIMIT …` |
| 3 | 530.442 | 1.946 | 273 | hs/ke-hoach-ngay [nền], hs/ke-hoach-ngay [sau ghi] | `SELECT khoa, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, ma_dang, chuyen_de FROM su_kien_hoc WHERE sbd = ? ORDER BY luc, khoa` |
| 4 | 499.790 | 943 | 530 | hs/thi-dua-hom-nay [nền], hs/thi-dua-hom-nay [mở] | `SELECT sbd, ho_ten, lop, ten_lop, 1 AS uu FROM hoc_sinh WHERE COALESCE(trang_thai, '') <> 'khoa' UNION ALL SELECT sbd, ho_ten, lop, NULL AS ten_lop, …` |
| 5 | 275.006 | 1.753 | 157 | hs/ke-hoach-ngay [nền], hs/ke-hoach-ngay [sau ghi] | `SELECT e.sbd, COUNT(*) AS so_su_kien, COUNT(DISTINCT CASE WHEN e.ngay_vn = ? THEN e.qid END) AS da_lam, COUNT(DISTINCT CASE WHEN e.ngay_vn = ? AND e.…` |
| 6 | 268.796 | 200 | 1.344 | game-v2/recommendations [Đảo], game-v2/start [Đảo] | `SELECT DISTINCT q.dang AS dang FROM chi_tiet_cau cc JOIN ca c ON c.ma_ca = cc.ma_ca JOIN game_v2_question q ON q.qid = cc.qid WHERE cc.sbd IN (SELECT…` |
| 7 | 249.895 | 943 | 265 | daily-honors [nền], daily-honors [mở] | `SELECT l.sbd,COALESCE(h.ho_ten,l.ho_ten) ho_ten,l.tong,l.nop_luc,l.vao_luc,c.ten_ca, json_extract(g.json,'$.nickname') nickname,json_extract(g.json,'…` |
| 8 | 244.901 | 788 | 311 | btvn/xong-lo [nộp chặng], hs/on-lai/nop [nộp ôn] | `SELECT khoa, sbd, qid, nguon, ket_qua, giay, luc, ngay_vn, ma_dang, chuyen_de FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?)) ORDER BY…` |
| 9 | 183.202 | 1.382 | 133 | hs/ke-hoach-ngay [nền], hs/ke-hoach-ngay [sau ghi] | `SELECT q.qid, q.content_group, q.json FROM game_v2_question q JOIN de_kho d ON d.ma_de = q.ma_de JOIN game_v2_index g ON g.ma_de = d.ma_de AND g.sour…` |
| 10 | 183.163 | 729 | 251 | btvn/xong-lo [nộp chặng] | `SELECT 'd' AS k, sbd, ma_dang AS a, bac AS b, so_gap AS c, so_sai AS d, so_da_khac_phuc AS e, so_chua_thay_sai AS f FROM nam_kt_dang WHERE sbd IN (SE…` |
| 11 | 164.328 | 193 | 851 | hs/on-lai/nop [nộp ôn] | `SELECT qid, ket_qua FROM su_kien_hoc WHERE sbd = ? AND nguon = ? AND ma_nguon = ? AND lan = 1 AND qid IN (SELECT value FROM json_each(?))` |
| 12 | 160.800 | 300 | 536 | game-v2/recommendations [Đảo], game-v2/so-tay [Đảo] | `SELECT COUNT(*) AS n, COALESCE(MAX(d.cap_nhat_luc),'') AS t, COALESCE(GROUP_CONCAT(d.ma_de),'') AS ids FROM de_kho d JOIN game_v2_index g ON g.ma_de=…` |
| 13 | 123.939 | 474 | 261 | game-v2/recommendations [Đảo], game-v2/so-tay [Đảo] | `SELECT q.json FROM game_v2_question q JOIN de_kho d ON d.ma_de=q.ma_de JOIN game_v2_index g ON g.ma_de=d.ma_de AND g.source_version=d.cap_nhat_luc WH…` |
| 14 | 102.468 | 1.401 | 73 | hs/ke-hoach-ngay [nền], hs/ke-hoach-ngay [dựng đầu ngày] | `SELECT sbd, COUNT(*) AS n FROM nam_kt_cau WHERE sbd IN (SELECT value FROM json_each(?)) AND trang_thai IN ('moi_sai','dang_on') GROUP BY sbd` |
| 15 | 91.863 | 300 | 306 | game-v2/recommendations [Đảo], game-v2/so-tay [Đảo] | `SELECT qid,trang_thai,luc_cuoi,nguon_cuoi FROM nam_kt_cau WHERE sbd=? AND qid IN (SELECT qid FROM su_kien_hoc s WHERE s.sbd=? AND (s.nguon NOT IN ('t…` |

## 4. Tải D1 (ước lượng)

- Tổng thời gian D1 ghi nhận (`meta.duration` của D1 cục bộ): 7.73 giây trong 661 giây chạy thật ⇒ ~0.7 giây D1 / phút ở tải thật. D1 cục bộ là SQLite trong bộ nhớ đệm, **nhanh hơn D1 thật nhiều lần**: dùng SỐ TRUY VẤN và SỐ DÒNG ĐỌC làm thước đo chính, không dùng mili-giây.
- Mỗi dòng đọc trên D1 thật tính tiền/tải như nhau; lệnh nào đọc > 2.000 dòng là ứng viên chỉ mục hoặc đệm.

## Ghi chú đo

- Đăng nhập được 250/250 em giả (bước thiết lập, không tính vào bảng).
- Chặng: 243 em thử làm, 243 nộp được, 7 lỗi/không có bài. Ôn: 193 em có việc ôn (nộp được 193), 57 em không có câu tới hạn. Đảo: 250 em thử, 99 xong lượt, 0 hết lượt/không có câu.
- Lỗi/từ chối hay gặp (không phải lỗi bộ đo — nhiều là đúng luật máy chủ): chặng: em không có bài về nhà chưa nộp ×7 · game-v2/answer [Đảo] → Một thiết bị khác vừa cập nhật. Em bấm chấm lại để đồng bộ. ×1 · game-v2/complete [Đảo] → Em cần hoàn thành các câu trong lượt. ×1
- Đáp án của em giả là NGẪU NHIÊN; thời gian "làm" giữa các bước là ngẫu nhiên. D1 cục bộ nhanh hơn D1 thật: số truy vấn và dòng đọc là thước đo chính.
- LƯỢT 2 — CÙNG Worker, bộ đệm mô-đun đã ẤM từ lượt 1 (dữ liệu D1 đã đổi theo lượt 1: em đã nộp/ôn/chơi — sát thật hơn "vừa đẩy", vì giờ cao điểm không ai gặp Worker vừa nguội).
- Migration chỉ-thêm của cây mã đã áp lên bản sao D1 cục bộ (câu MỚI so với mẫu; lỗi 'đã có' bỏ qua): migration-2109-chi-muc-luot.sql (+1 đối tượng: bảng/chỉ mục/cột)
- Mẫu phản hồi để so trước/sau: 40 em đầu (`so-sanh-phan-hoi.mjs`); dò lộ đáp án: xem trên
- Cây mã: commit 348a09f (worktree sạch).

