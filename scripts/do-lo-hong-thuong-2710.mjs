// ĐO LỖ HỔNG THƯỞNG PHẠT (thầy 27/10: «Xem lại mọi chỗ tối ưu chặt chẽ logic đảm bảo công bằng cho mọi học sinh») — CHỈ ĐỌC, chỉ in SỐ ĐẾM (repo công khai:
// không sbd, không tên). Chạy bằng workflow do-lo-hong-thuong-2710.yml. Mỗi khối một câu SELECT tổng hợp; lỗi một khối ⇒ in lỗi ngắn, đo tiếp khối khác.
const token = process.env.CLOUDFLARE_API_TOKEN
const account = process.env.CLOUDFLARE_ACCOUNT_ID
if (!token || !account) throw new Error('Thiếu cấu hình Cloudflare.')
const DB = 'd2e6d322-374a-45d7-83a3-9fac486b23f1'
async function query(sql, params = []) {
  if (/\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|REPLACE)\b/i.test(sql)) throw new Error('Chỉ đọc.')
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/${DB}/query`, {
    method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ sql, params }), signal: AbortSignal.timeout(60000),
  })
  const j = await r.json()
  if (!r.ok || !j.success) throw new Error(`D1 ${r.status}: ${(j.errors ?? []).map((e) => e.message).join('; ').slice(0, 160)}`)
  return j.result?.[0]?.results ?? []
}
const TU = process.env.TU || '2026-10-20'
const DO = {
  // L1 chặng ngắn: bài xong ít câu (nhiệm vụ «Xong 2 chặng», «Chặng hoàn hảo», mục tiêu ngày theo chặng đếm mọi bài xong).
  chang_ngan: `SELECT COUNT(*) AS bai, SUM(so_cau < 6) AS duoi6, SUM(so_cau < 3) AS duoi3, SUM(hoan_hao = 1 AND so_cau < 6) AS hoanHaoDuoi6, COUNT(DISTINCT em) AS soEm
    FROM thuong_bai_xong WHERE ngay >= ?`,
  // L1b: (em, ngày) đạt «≥ 2 chặng» CHỈ nhờ chặng ngắn (< 2 chặng đủ 6 câu).
  ngay_nho_chang_ngan: `SELECT COUNT(*) AS emNgay FROM (SELECT em, ngay, COUNT(*) AS c, SUM(so_cau >= 6) AS du FROM thuong_bai_xong WHERE ngay >= ? GROUP BY em, ngay) WHERE c >= 2 AND du < 2`,
  // L1c: phân bố số câu một chặng xong.
  so_cau_chang: `SELECT so_cau AS soCau, COUNT(*) AS n FROM thuong_bai_xong WHERE ngay >= ? GROUP BY so_cau ORDER BY so_cau`,
  // L1d: tinh thể nhiệm vụ đã trả ở ngày chỉ nhờ chặng ngắn (nhiệm vụ xong_bai).
  tt_nho_chang_ngan: `SELECT COUNT(*) AS khoan, COALESCE(SUM(v.so_vang), 0) AS tinhThe FROM vang_so v JOIN (SELECT em, ngay FROM (SELECT em, ngay, COUNT(*) AS c, SUM(so_cau >= 6) AS du FROM thuong_bai_xong WHERE ngay >= ? GROUP BY em, ngay) WHERE c >= 2 AND du < 2) x
    ON v.sbd = x.em AND v.khoa_yeu_cau = 'tt|' || x.ngay || '|nv|xong_bai'`,
  // L2 lặp câu trong ngày: dòng sổ học có kết quả trùng (em, câu, ngày) — nguyên tử chỉ tính lần đầu? đo số dòng exp_so loại câu trùng (em, câu, ngày).
  lap_cau_so_hoc: `SELECT COUNT(*) AS dong, COUNT(DISTINCT sbd || '|' || qid || '|' || ngay_vn) AS cauNgay FROM su_kien_hoc WHERE ngay_vn >= ? AND ket_qua IS NOT NULL`,
  lap_cau_exp: `SELECT COUNT(*) AS cauLap, COALESCE(SUM(t), 0) AS nguyenTuLap FROM (SELECT sbd, qid, ngay_vn, COUNT(*) AS c, SUM(exp) - MAX(exp) AS t FROM exp_so WHERE ngay_vn >= ? AND qid IS NOT NULL AND exp > 0 GROUP BY sbd, qid, ngay_vn HAVING c > 1)`,
  // L2b câu song sinh (mã ảo ~ss|): tách theo mã gốc trước '~'.
  lap_song_sinh: `SELECT COUNT(*) AS nhom, COALESCE(SUM(c - 1), 0) AS dongThua FROM (SELECT sbd, ngay_vn, CASE WHEN instr(qid, '~') > 0 THEN substr(qid, 1, instr(qid, '~') - 1) ELSE qid END AS goc, COUNT(DISTINCT qid) AS c
    FROM su_kien_hoc WHERE ngay_vn >= ? AND ket_qua IS NOT NULL GROUP BY sbd, ngay_vn, goc HAVING COUNT(DISTINCT qid) > 1)`,
  // L3 chuỗi theo luật cũ (1 chặng) vs đủ mức: (em, ngày) có mức chốt — bao nhiêu ngày giữ chuỗi nhờ 1 chặng mà chưa đủ mức.
  chuoi_1_chang_chua_du_muc: `SELECT COUNT(*) AS emNgayCoMuc, SUM(c >= 6) AS du1Chang, SUM(c >= m) AS duMuc, SUM(c >= 6 AND c < m) AS chiNho1Chang
    FROM (SELECT g.sbd, g.ngay, g.muc AS m, (SELECT COUNT(DISTINCT s.qid) FROM su_kien_hoc s WHERE s.sbd = g.sbd AND s.ngay_vn = g.ngay AND s.ket_qua IS NOT NULL AND s.ma_nguon NOT LIKE 'ktcn:%') AS c
      FROM goi_bai_7_muc_ngay g WHERE g.ngay >= ? AND g.ngay < '2026-10-28' AND g.muc > 0)`,
  // L4 công bằng theo lớp: tỉ lệ (em, ngày) ĐỦ MỨC theo lớp — lớp nào mức quá cao / thiếu câu.
  du_muc_theo_lop: `SELECT COALESCE(h.ten_lop, h.lop, 'chua_xep') AS lop, COUNT(*) AS emNgay, SUM(x.c >= x.m) AS duMuc, ROUND(AVG(x.m), 1) AS mucTB, ROUND(AVG(x.c), 1) AS daLamTB
    FROM (SELECT g.sbd, g.ngay, g.muc AS m, (SELECT COUNT(DISTINCT s.qid) FROM su_kien_hoc s WHERE s.sbd = g.sbd AND s.ngay_vn = g.ngay AND s.ket_qua IS NOT NULL AND s.ma_nguon NOT LIKE 'ktcn:%') AS c
      FROM goi_bai_7_muc_ngay g WHERE g.ngay >= ? AND g.ngay < '2026-10-28' AND g.muc > 0) x JOIN hoc_sinh h ON h.sbd = x.sbd GROUP BY 1 ORDER BY 2 DESC LIMIT 20`,
  // L4b em có làm (≥ 1 câu) mà mức > số câu còn có thể làm — đo mức cao bất thường.
  muc_phan_bo: `SELECT muc, COUNT(*) AS n FROM goi_bai_7_muc_ngay WHERE ngay >= ? GROUP BY muc ORDER BY muc`,
  // L5 cược + thưởng tinh thể theo loại (tuần gần nhất) — đường kiếm nào lớn bất thường.
  tt_theo_loai: `SELECT COALESCE(ma_mon, '(khac)') AS maMon, loai, COUNT(*) AS dong, SUM(so_vang) AS tong, COUNT(DISTINCT sbd) AS soEm FROM vang_so WHERE luc >= ? GROUP BY 1, 2 ORDER BY ABS(SUM(so_vang)) DESC LIMIT 25`,
  cuoc: `SELECT trang_thai, COUNT(*) AS n FROM cuoc_chuoi GROUP BY trang_thai`,
  // L6 đổi giờ máy: các mốc thưởng dùng giờ MÁY CHỦ (luc). Đo: bài xong có luc lệch ngày VN với cột ngay (dấu hiệu dùng giờ máy em).
  lech_ngay: `SELECT COUNT(*) AS lech FROM thuong_bai_xong WHERE ngay >= ? AND date(luc, '+7 hours') <> ngay`,
  // L7 bình: bình nhận theo tuần (mua) tối đa của một em — trần 1/tuần.
  binh_tuan: `SELECT tuan, MAX(n) AS toiDaMotEm, COUNT(*) AS soEm FROM (SELECT sbd, strftime('%Y-%W', luc, '+7 hours') AS tuan, SUM(so) AS n FROM chuoi_binh_mua WHERE nguon NOT LIKE 'tt-binh-reset%' GROUP BY sbd, tuan) GROUP BY tuan ORDER BY tuan DESC LIMIT 4`,
}
for (const [ten, sql] of Object.entries(DO)) {
  const thamSo = (sql.match(/\?/g) ?? []).map(() => (ten === 'tt_theo_loai' ? `${TU}T00:00:00Z` : TU))
  try { console.log(JSON.stringify({ do: ten, kq: await query(sql, thamSo) })) } catch (e) { console.log(JSON.stringify({ do: ten, loi: String(e.message ?? e).slice(0, 200) })) }
}
