// DỜI BÀI KIỂM TRA ÔN TẬP (kiểm tra cá nhân) NGÀY 27/10 SANG 28/10 (thầy DUYỆT 27/10: «Dời sang tối mai» — app HS tạm đóng tối 27/10 để bảo trì,
// bài hạn 27/10 em chưa làm sẽ bị ghi «Đã lỡ»). Chạy từ workflow `doi-han-ktcn-2710.yml` (bấm tay), KHÔNG chạy local.
// Phạm vi: ngay='2026-10-27', CHƯA NỘP (nop_luc NULL), CHƯA BẮT ĐẦU (không chặng nào, revision 0), không 'cho_nguon', chưa quá hạn, id đúng mẫu
// 'ktcn:<sbd>:2026-10-27', em CHƯA có bài ngày 28/10. Đổi: id/ngay sang 28/10, mo_luc và han_luc +24 giờ (cùng giờ), meta theo id. Không đụng bài đã nộp,
// bài đang làm dở, ca thi. Ca thi mở ⇒ DỪNG (cổng trong kiem-phat-hanh-chua.mjs chạy khi import). Log chỉ in TỔNG; bản sao từng dòng (mã + hạn cũ,
// không tên) ghi ra BAN_SAO ⇒ artifact 90 ngày. `GHI=dem` chỉ đếm + lưu bản sao. Chạy lại an toàn (dòng đã dời không còn trong phạm vi).
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

export const NGAY_CU = '2026-10-27'
export const NGAY_MOI = '2026-10-28'
export const MOT_NGAY_MS = 86_400_000
const NOW = "CAST((julianday('now')-2440587.5)*86400000 AS INTEGER)"
const ID_CU = `'ktcn:'||k.sbd||':${NGAY_CU}'`
const ID_MOI = `'ktcn:'||k.sbd||':${NGAY_MOI}'`
/** Điều kiện phạm vi trên bảng `kiem_tra_ca_nhan k` — dùng y hệt cho đếm, bản sao, ghi meta và ghi bài. */
export const PHAM_VI = `k.ngay='${NGAY_CU}' AND k.nop_luc IS NULL AND k.trang_thai<>'cho_nguon' AND k.revision=0 AND k.id=${ID_CU} AND k.han_luc>${NOW}
  AND NOT EXISTS(SELECT 1 FROM kiem_tra_ca_nhan_chang c WHERE c.bai_id=k.id)
  AND NOT EXISTS(SELECT 1 FROM kiem_tra_ca_nhan k2 WHERE k2.sbd=k.sbd AND k2.ngay='${NGAY_MOI}')
  AND NOT EXISTS(SELECT 1 FROM kiem_tra_ca_nhan k3 WHERE k3.id=${ID_MOI})
  AND NOT EXISTS(SELECT 1 FROM ca WHERE trang_thai='mo')`

export const SQL_DEM = `SELECT
  (SELECT COUNT(*) FROM kiem_tra_ca_nhan k WHERE ${PHAM_VI}) se_doi,
  (SELECT COUNT(DISTINCT k.sbd) FROM kiem_tra_ca_nhan k WHERE ${PHAM_VI}) so_em,
  (SELECT COUNT(*) FROM kiem_tra_ca_nhan k WHERE k.ngay='${NGAY_CU}') tong_ngay_cu,
  (SELECT COUNT(*) FROM kiem_tra_ca_nhan k WHERE k.ngay='${NGAY_CU}' AND k.nop_luc IS NOT NULL) da_nop,
  (SELECT COUNT(*) FROM kiem_tra_ca_nhan k WHERE k.ngay='${NGAY_CU}' AND k.nop_luc IS NULL AND EXISTS(SELECT 1 FROM kiem_tra_ca_nhan_chang c WHERE c.bai_id=k.id)) dang_lam_do,
  (SELECT COUNT(*) FROM kiem_tra_ca_nhan k WHERE k.ngay='${NGAY_CU}' AND k.trang_thai='cho_nguon') cho_nguon,
  (SELECT COUNT(*) FROM kiem_tra_ca_nhan k WHERE k.ngay='${NGAY_CU}' AND k.nop_luc IS NULL AND k.trang_thai<>'cho_nguon' AND NOT EXISTS(SELECT 1 FROM kiem_tra_ca_nhan_chang c WHERE c.bai_id=k.id) AND EXISTS(SELECT 1 FROM kiem_tra_ca_nhan k2 WHERE k2.sbd=k.sbd AND k2.ngay='${NGAY_MOI}')) vuong_bai_ngay_moi,
  (SELECT COUNT(*) FROM kiem_tra_ca_nhan k WHERE k.ngay='${NGAY_MOI}') tong_ngay_moi,
  (SELECT COUNT(*) FROM kiem_tra_ca_nhan k JOIN kiem_tra_ca_nhan_meta m ON m.id=k.id WHERE ${PHAM_VI}) co_meta,
  (SELECT COUNT(*) FROM kiem_tra_ca_nhan k WHERE ${PHAM_VI} AND COALESCE(json_extract(k.json,'$.phienBan'),1)<>3) phien_ban_khac_3`

export const SQL_BAN_SAO = `SELECT k.id ma, k.ngay, k.mo_luc, k.han_luc, k.trang_thai, k.cap_nhat_luc FROM kiem_tra_ca_nhan k WHERE ${PHAM_VI} ORDER BY k.id`

/** Hai lệnh, meta trước bài: nếu lệnh bài lỗi giữa chừng thì bài vẫn còn trong phạm vi (chạy lại được), meta lạc id chỉ làm máy tính lại số từ đề. */
export const SQL_GHI = [
  `UPDATE kiem_tra_ca_nhan_meta SET id=replace(id,':${NGAY_CU}',':${NGAY_MOI}') WHERE id IN(SELECT k.id FROM kiem_tra_ca_nhan k WHERE ${PHAM_VI})
    AND NOT EXISTS(SELECT 1 FROM kiem_tra_ca_nhan_meta m2 WHERE m2.id=replace(kiem_tra_ca_nhan_meta.id,':${NGAY_CU}',':${NGAY_MOI}'))`,
  `UPDATE kiem_tra_ca_nhan SET id=replace(id,':${NGAY_CU}',':${NGAY_MOI}'), ngay='${NGAY_MOI}', mo_luc=mo_luc+${MOT_NGAY_MS}, han_luc=han_luc+${MOT_NGAY_MS}, cap_nhat_luc=${NOW}
    WHERE id IN(SELECT k.id FROM kiem_tra_ca_nhan k WHERE ${PHAM_VI})`,
]

export const SQL_KIEM_SAU = (ids) => `SELECT COUNT(*) da_doi, SUM(k.ngay='${NGAY_MOI}') dung_ngay, SUM(m.id IS NOT NULL) co_meta
  FROM kiem_tra_ca_nhan k LEFT JOIN kiem_tra_ca_nhan_meta m ON m.id=k.id WHERE k.id IN(SELECT value FROM json_each('${JSON.stringify(ids).replace(/'/g, "''")}'))`

/** Đối chiếu bản sao với dòng sau khi ghi: hạn mới = hạn cũ + 24 giờ, id/ngay sang 28/10. */
export function kiemDoiDung(banSao, sau) {
  const theoId = new Map(sau.map((r) => [String(r.ma), r]))
  let dung = 0
  for (const r of banSao) {
    const m = theoId.get(String(r.ma).replace(`:${NGAY_CU}`, `:${NGAY_MOI}`))
    if (m && m.ngay === NGAY_MOI && Number(m.han_luc) === Number(r.han_luc) + MOT_NGAY_MS && Number(m.mo_luc) === Number(r.mo_luc) + MOT_NGAY_MS) dung++
  }
  return dung
}

export async function chay({ query, ghi, banSaoPath, log = console.log }) {
  const truoc = (await query(SQL_DEM))[0]
  log(JSON.stringify({ buoc: 'truoc', ...truoc }))
  const banSao = await query(SQL_BAN_SAO)
  if (banSao.length !== Number(truoc.se_doi)) throw new Error('Bản sao lệch số đếm: dừng, không ghi.')
  mkdirSync(dirname(banSaoPath), { recursive: true })
  writeFileSync(banSaoPath, JSON.stringify({ luc: new Date().toISOString(), ngayCu: NGAY_CU, ngayMoi: NGAY_MOI, soDong: banSao.length, dong: banSao }))
  log(JSON.stringify({ banSao: banSao.length }))
  if (!ghi || !banSao.length) return { ghi: false, seDoi: banSao.length }
  for (const sql of SQL_GHI) await query(sql)
  const idMoi = banSao.map((r) => String(r.ma).replace(`:${NGAY_CU}`, `:${NGAY_MOI}`))
  const kiem = (await query(SQL_KIEM_SAU(idMoi)))[0]
  const sau = (await query(SQL_DEM))[0]
  const dongSau = await query(`SELECT k.id ma, k.ngay, k.mo_luc, k.han_luc FROM kiem_tra_ca_nhan k WHERE k.id IN(SELECT value FROM json_each('${JSON.stringify(idMoi).replace(/'/g, "''")}'))`)
  const dung = kiemDoiDung(banSao, dongSau)
  log(JSON.stringify({ buoc: 'sau', ...kiem, dungHan: dung, ...sau }))
  if (dung !== banSao.length) throw new Error(`Chỉ ${dung}/${banSao.length} bài dời đúng hạn: xem lại (bản sao trong artifact).`)
  return { ghi: true, daDoi: dung }
}

if (process.argv[1]?.endsWith('doi-han-ktcn-2710.mjs')) {
  const { query } = await import('./kiem-phat-hanh-chua.mjs') // import ⇒ cổng ca thi mở chạy trước, có ca mở là dừng
  const ghi = process.env.GHI === 'ghi'
  console.log(JSON.stringify(await chay({ query, ghi, banSaoPath: process.env.BAN_SAO || 'ban-sao-doi-han-ktcn/truoc.json' })))
}
