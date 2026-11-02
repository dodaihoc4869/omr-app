-- DỌN LƯỢT LÊN BẢNG GHI ĐÔI (trước 02/11/2026) — BẢN SOẠN, CHƯA CHẠY.
-- Bối cảnh: máy thầy gửi mỗi lượt gọi lên bảng hai lần (lệnh cũ `ghiLenBang` + soi `/len-bang`) ⇒ 158/159 lượt thật có HAI dòng `len_bang`
-- cách nhau ~0,85 giây. Từ PR #750/#753 máy chủ không ghi đôi nữa. Bốn bảng đã bỏ trùng khi đọc (`boTrungBang`, server/src/bon-tren-lop.ts).
-- Các chỗ khác (hồ sơ lên bảng, đầu giờ, buổi học, dòng thời gian Hôm nay, lịch sử câu, phụ huynh qua `su_kien_hoc`) VẪN đếm đôi.
--
-- ĐÂY LÀ XOÁ DỮ LIỆU THẬT ⇒ theo CLAUDE.md phải Boss / thầy duyệt rồi mới chạy. Phiên soạn không đọc được D1 thật.
-- Luật trùng = đúng luật chặn ghi đôi của #753: cùng em · cùng câu · cùng chuyên đề · cùng kết quả, dòng sau cách dòng trước ≤ 10 giây ⇒ GIỮ DÒNG ĐẦU.
--
-- KHÔNG đụng: `exp_so` (EXP đã cộng, mỗi lượt đôi đã được +EXP lên bảng hai lần). Quyết định 02/11: KHÔNG thu hồi EXP của em vì lỗi của máy.
-- Sổ EXP không tự đối soát lại theo `su_kien_hoc` (chỉ cộng sự kiện của ngày đang tính), nên xoá dòng sổ sự kiện không làm đổi EXP.

-- ─── BƯỚC 1 · ĐẾM THỬ (chỉ đọc) ───────────────────────────────────────────────────────────────────────────────────────────
-- Số dòng trùng theo em (kỳ vọng tổng ≈ 158).
SELECT l.sbd, COUNT(*) AS dong_trung
FROM len_bang l
WHERE EXISTS (
  SELECT 1 FROM len_bang t
  WHERE t.sbd = l.sbd AND t.id < l.id
    AND COALESCE(t.qid, '') = COALESCE(l.qid, '') AND COALESCE(t.chuyen_de, '') = COALESCE(l.chuyen_de, '') AND t.dat = l.dat
    AND (julianday(l.luc) - julianday(t.luc)) * 86400.0 BETWEEN 0 AND 10
)
GROUP BY l.sbd ORDER BY dong_trung DESC;

-- Số dòng sổ sự kiện đi kèm (khoá `len_bang|lb|<sbd>|<qid>|<id dòng len_bang>`).
SELECT COUNT(*) AS su_kien_kem
FROM su_kien_hoc s
JOIN len_bang l ON s.khoa = 'len_bang|lb|' || l.sbd || '|' || l.qid || '|' || l.id
WHERE EXISTS (
  SELECT 1 FROM len_bang t
  WHERE t.sbd = l.sbd AND t.id < l.id
    AND COALESCE(t.qid, '') = COALESCE(l.qid, '') AND COALESCE(t.chuyen_de, '') = COALESCE(l.chuyen_de, '') AND t.dat = l.dat
    AND (julianday(l.luc) - julianday(t.luc)) * 86400.0 BETWEEN 0 AND 10
);

-- ─── BƯỚC 2 · XOÁ (CHỈ CHẠY KHI ĐƯỢC DUYỆT; không chạy lúc có ca thi mở) ─────────────────────────────────────────────────────
-- Một lô (giao dịch): sổ sự kiện trước (cần dòng len_bang để khớp khoá), rồi bộ đếm `qid_da_lam.so_lan`, rồi chính dòng len_bang.
-- (Không dùng bảng tạm: D1 không chắc giữ TEMP giữa các câu của lô. Mỗi câu tự dò trùng trên `len_bang` còn nguyên ⇒ xoá `len_bang` CUỐI CÙNG.)
-- DELETE FROM su_kien_hoc WHERE khoa IN (SELECT 'len_bang|lb|' || l.sbd || '|' || l.qid || '|' || l.id FROM len_bang l WHERE l.qid IS NOT NULL AND EXISTS (SELECT 1 FROM len_bang t WHERE t.sbd = l.sbd AND t.id < l.id AND COALESCE(t.qid, '') = COALESCE(l.qid, '') AND COALESCE(t.chuyen_de, '') = COALESCE(l.chuyen_de, '') AND t.dat = l.dat AND (julianday(l.luc) - julianday(t.luc)) * 86400.0 BETWEEN 0 AND 10));
-- UPDATE qid_da_lam SET so_lan = MAX(1, so_lan - (SELECT COUNT(*) FROM len_bang l WHERE l.sbd || '|' || l.qid = qid_da_lam.khoa AND EXISTS (SELECT 1 FROM len_bang t WHERE t.sbd = l.sbd AND t.id < l.id AND COALESCE(t.qid, '') = COALESCE(l.qid, '') AND COALESCE(t.chuyen_de, '') = COALESCE(l.chuyen_de, '') AND t.dat = l.dat AND (julianday(l.luc) - julianday(t.luc)) * 86400.0 BETWEEN 0 AND 10)))
--   WHERE khoa IN (SELECT l.sbd || '|' || l.qid FROM len_bang l WHERE l.qid IS NOT NULL AND EXISTS (SELECT 1 FROM len_bang t WHERE t.sbd = l.sbd AND t.id < l.id AND COALESCE(t.qid, '') = COALESCE(l.qid, '') AND COALESCE(t.chuyen_de, '') = COALESCE(l.chuyen_de, '') AND t.dat = l.dat AND (julianday(l.luc) - julianday(t.luc)) * 86400.0 BETWEEN 0 AND 10));
-- DELETE FROM len_bang WHERE id IN (SELECT l.id FROM len_bang l WHERE EXISTS (SELECT 1 FROM len_bang t WHERE t.sbd = l.sbd AND t.id < l.id AND COALESCE(t.qid, '') = COALESCE(l.qid, '') AND COALESCE(t.chuyen_de, '') = COALESCE(l.chuyen_de, '') AND t.dat = l.dat AND (julianday(l.luc) - julianday(t.luc)) * 86400.0 BETWEEN 0 AND 10));
--
-- Sau khi xoá: hồ sơ / nắm dạng dựng từ `su_kien_hoc` sẽ tự đúng ở lượt tính kế tiếp; bốn bảng không đổi (đã bỏ trùng khi đọc).
