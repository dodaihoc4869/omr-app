// ĐO TRƯỚC KHI LÀM «TỰ SỬA LỖI THEO ĐỀ XUẤT» (thầy duyệt 28/10) — CHỈ ĐỌC, chỉ in SỐ ĐẾM (repo công khai: không sbd, không tên, không mã câu).
// Chạy bằng workflow do-tu-sua-de-xuat-2810.yml. Hai phần:
//   A. Mô phỏng thưởng +2 nguyên tử / câu RA KHỎI HÀNG ở màn sửa câu (chua_gon_lan ket 'tu_sua'), trần 12 câu / em / ngày, không cộng khi câu gốc đã đúng
//      ở kênh khác cùng ngày trước lúc sửa (khớp luật lặp câu #525 so mã gốc + song sinh). So với nguyên tử thật / em / tuần trong exp_so.
//   B. Đợt Tự sửa lỗi còn mở CŨ HƠN 14 ngày (đóng tự động hiện không xét): bao nhiêu đợt đã có lượt đúng qua luật tự làm (sẽ đóng ở cron đêm), đo theo lô 200
//      bằng ĐÚNG điều kiện `sqlDaTuSuaDungLai` (server/src/chua-gon.ts, bản dịch sẵn ở CHUA_GON) — kèm thời gian mỗi lô để chọn cỡ lô cron.
// Mỗi khối một câu SELECT; lỗi một khối ⇒ in lỗi ngắn, đo tiếp khối khác.
const token = process.env.CLOUDFLARE_API_TOKEN
const account = process.env.CLOUDFLARE_ACCOUNT_ID
if (!token || !account) throw new Error('Thiếu cấu hình Cloudflare.')
const DB = 'd2e6d322-374a-45d7-83a3-9fac486b23f1'
async function query(sql, params = []) {
  if (/\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|REPLACE)\b/i.test(sql)) throw new Error('Chỉ đọc.')
  const t0 = Date.now()
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/${DB}/query`, {
    method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ sql, params }), signal: AbortSignal.timeout(90000),
  })
  const j = await r.json()
  if (!r.ok || !j.success) throw new Error(`D1 ${r.status}: ${(j.errors ?? []).map((e) => e.message).join('; ').slice(0, 200)}`)
  return { rows: j.result?.[0]?.results ?? [], ms: Date.now() - t0, dbMs: j.result?.[0]?.meta?.duration ?? null }
}
const { sqlDaTuSuaDungLai, sqlHoCau, NGAY_CUA_SO_GON } = await import(process.env.CHUA_GON || '/tmp/chua-gon.mjs')
const nay = Date.now()
const moc14 = nay - NGAY_CUA_SO_GON * 86_400_000
const MO = `dong_luc IS NULL AND trang_thai_day<>'da_tu_sua'`

const DO = {
  // A0. Bối cảnh: lượt sửa gọn theo ngày (từ khi có đường gọn 25/10).
  a0_lan_theo_ngay: [`SELECT ngay_vn AS ngay, COUNT(*) AS lan, COUNT(DISTINCT sbd) AS soEm, SUM(json_extract(ket,'$.ket')='tu_sua') AS tuSua, SUM(json_extract(ket,'$.ket')='xong_phan') AS xongPhan
    FROM chua_gon_lan GROUP BY ngay_vn ORDER BY ngay_vn`],
  // A1. Câu ra khỏi hàng theo (em, ngày): phân bố số câu, phần vượt trần 12.
  a1_em_ngay: [`SELECT COUNT(*) AS emNgay, SUM(n) AS cau, SUM(MIN(n,12)) AS cauTrongTran, SUM(n>12) AS emNgayVuotTran, MAX(n) AS toiDaMotEmNgay
    FROM (SELECT sbd, ngay_vn, COUNT(DISTINCT dot_id) AS n FROM chua_gon_lan WHERE json_extract(ket,'$.ket')='tu_sua' GROUP BY sbd, ngay_vn)`],
  // A2. Trừ câu mà mã gốc (kể cả song sinh / biến thể) đã ĐÚNG ở kênh khác cùng ngày TRƯỚC lúc sửa (luật lặp câu #525).
  a2_lap_ngay: [`SELECT COUNT(*) AS cauTuSua, SUM(lap) AS daDungKenhKhacCungNgay FROM (
      SELECT l.sbd, l.ngay_vn, l.dot_id, MAX(EXISTS(SELECT 1 FROM su_kien_hoc s WHERE s.sbd=l.sbd AND ${sqlHoCau('s.qid', 'd.qid_chuan')} AND s.ngay_vn=l.ngay_vn AND s.ket_qua=1
        AND s.nguon<>'chua_loi' AND s.luc < strftime('%Y-%m-%dT%H:%M:%fZ', l.luc/1000.0, 'unixepoch'))) AS lap
      FROM chua_gon_lan l JOIN chua_loi_dot d ON d.id=l.dot_id WHERE json_extract(l.ket,'$.ket')='tu_sua' GROUP BY l.sbd, l.ngay_vn, l.dot_id)`],
  // A3. Mô phỏng theo tuần VN (thứ Hai): +2 / câu, trần 12 câu / em / ngày, bỏ câu lặp ngày. Chia cho em CÓ sửa và cho mọi em có nguyên tử tuần ấy.
  a3_tuan: [`WITH c AS (
      SELECT l.sbd, l.ngay_vn, l.dot_id, MAX(EXISTS(SELECT 1 FROM su_kien_hoc s WHERE s.sbd=l.sbd AND ${sqlHoCau('s.qid', 'd.qid_chuan')} AND s.ngay_vn=l.ngay_vn AND s.ket_qua=1
        AND s.nguon<>'chua_loi' AND s.luc < strftime('%Y-%m-%dT%H:%M:%fZ', l.luc/1000.0, 'unixepoch'))) AS lap
      FROM chua_gon_lan l JOIN chua_loi_dot d ON d.id=l.dot_id WHERE json_extract(l.ket,'$.ket')='tu_sua' GROUP BY l.sbd, l.ngay_vn, l.dot_id),
    n AS (SELECT sbd, ngay_vn, MIN(12, SUM(lap=0)) AS cau FROM c GROUP BY sbd, ngay_vn),
    w AS (SELECT sbd, date(ngay_vn, '-' || ((CAST(strftime('%w', ngay_vn) AS INTEGER) + 6) % 7) || ' days') AS tuan, SUM(cau) * 2 AS nt FROM n GROUP BY 1, 2),
    e AS (SELECT sbd, date(ngay_vn, '-' || ((CAST(strftime('%w', ngay_vn) AS INTEGER) + 6) % 7) || ' days') AS tuan, SUM(exp) AS nt FROM exp_so WHERE ngay_vn >= '2026-10-19' GROUP BY 1, 2)
    SELECT e.tuan, COUNT(*) AS emCoNguyenTu, ROUND(AVG(e.nt), 1) AS ntThatTB, COUNT(w.sbd) AS emCoSua, ROUND(AVG(w.nt), 1) AS themTBEmCoSua,
      ROUND(SUM(COALESCE(w.nt, 0)) * 1.0 / COUNT(*), 1) AS themTBMoiEm, MAX(w.nt) AS themToiDaMotEm,
      ROUND(100.0 * SUM(COALESCE(w.nt, 0)) / MAX(1, SUM(e.nt)), 2) AS phanTramTang
    FROM e LEFT JOIN w ON w.sbd = e.sbd AND w.tuan = e.tuan GROUP BY e.tuan ORDER BY e.tuan`],
  // A4. Nguyên tử có đổi ra tinh thể không (bình mua bằng tinh thể): dòng ví 'doi' có exp_tru > 0 trong 14 ngày.
  a4_doi_tinh_the: [`SELECT COUNT(*) AS dong, COALESCE(SUM(exp_tru), 0) AS expDaDoi FROM vang_so WHERE loai='doi' AND exp_tru > 0 AND luc >= date('now', '-14 days')`],
  // B0. Đợt còn mở: trong / ngoài cửa sổ 14 ngày.
  b0_dot_mo: [`SELECT COUNT(*) AS mo, SUM(COALESCE(sai_cuoi_luc,mo_luc) >= ?1) AS trong14, SUM(COALESCE(sai_cuoi_luc,mo_luc) < ?1) AS cu14, COUNT(DISTINCT CASE WHEN COALESCE(sai_cuoi_luc,mo_luc) < ?1 THEN sbd END) AS soEmCoDotCu
    FROM chua_loi_dot WHERE ${MO}`, [moc14]],
  b1_cu_theo_tuoi: [`SELECT CASE WHEN COALESCE(sai_cuoi_luc,mo_luc) >= ?1 - 7*86400000 THEN '15-21' WHEN COALESCE(sai_cuoi_luc,mo_luc) >= ?1 - 16*86400000 THEN '22-30' ELSE '>30' END AS ngay, COUNT(*) AS n
    FROM chua_loi_dot WHERE ${MO} AND COALESCE(sai_cuoi_luc,mo_luc) < ?1 GROUP BY 1 ORDER BY 1`, [moc14]],
  b2_ke_hoach: [`EXPLAIN QUERY PLAN SELECT id FROM chua_loi_dot WHERE id > ?1 AND ${MO} AND COALESCE(sai_cuoi_luc,mo_luc) < ?2 ORDER BY id LIMIT 200`, ['', moc14]],
}
for (const [ten, [sql, p]] of Object.entries(DO)) {
  try { const r = await query(sql, p); console.log(`== ${ten} (${r.ms} ms, D1 ${r.dbMs} ms)`); console.log(JSON.stringify(r.rows)) } catch (e) { console.log(`== ${ten} LỖI ${String(e.message).slice(0, 200)}`) }
}

// B3. Đợt cũ hơn 14 ngày sẽ đóng theo luật tự làm — duyệt theo lô 200 (như cron), chỉ đếm.
{
  let tro = '', lo = 0, xet = 0, dong = 0, tongDbMs = 0, maxDbMs = 0
  const PRED = sqlDaTuSuaDungLai('d', 'd.sbd')
  try {
    for (;;) {
      const ids = (await query(`SELECT id FROM chua_loi_dot WHERE id > ?1 AND ${MO} AND COALESCE(sai_cuoi_luc,mo_luc) < ?2 ORDER BY id LIMIT 200`, [tro, moc14])).rows.map((x) => x.id)
      if (!ids.length) break
      const r = await query(`SELECT COUNT(*) AS n FROM chua_loi_dot d WHERE d.id IN (SELECT value FROM json_each(?1)) AND ${PRED}`, [JSON.stringify(ids)])
      lo++; xet += ids.length; dong += Number(r.rows[0]?.n) || 0
      tongDbMs += Number(r.dbMs) || 0; maxDbMs = Math.max(maxDbMs, Number(r.dbMs) || 0)
      tro = ids[ids.length - 1]
      if (lo >= 400) { console.log('(dừng ở 400 lô)'); break }
    }
    console.log('== b3_cu_se_dong')
    console.log(JSON.stringify({ lo, dotCuDaXet: xet, seDong: dong, d1MsTBMotLo200: lo ? Math.round(tongDbMs / lo) : 0, d1MsLonNhatMotLo: maxDbMs }))
  } catch (e) { console.log(`== b3_cu_se_dong LỖI sau ${lo} lô (${xet} đợt, ${dong} đóng) ${String(e.message).slice(0, 200)}`) }
}
