import type { D1That } from './_d1-that'
/** Hồ sơ tổng hợp không thay thế bằng chứng học. Fixture có một câu đã làm/công bố của chính em. */
export function daHocDang(d: D1That, sbd: string, dang: string) {
  const r = d.sql.prepare('SELECT qid FROM game_v2_question WHERE dang = ? ORDER BY qid LIMIT 1').get(dang) as { qid: string } | undefined
  if (!r) return
  const ma = `PHAM_VI_${sbd}_${dang}`
  const luc = '2026-08-01T00:00:00.000Z'
  d.sql.prepare("INSERT OR IGNORE INTO ca(ma_ca,trang_thai,cong_bo,cap_nhat_luc) VALUES(?,'dong','ngay',?)").run(ma,luc)
  d.sql.prepare("INSERT OR IGNORE INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,nop_luc,trang_thai,cap_nhat_luc) VALUES(?,?,?,1,?,?,'da_nop',?)").run(`${ma}|${sbd}`,ma,sbd,luc,luc,luc)
  d.sql.prepare("INSERT OR IGNORE INTO chi_tiet_cau(khoa,ma_ca,sbd,lan_thu,phan,so_cau,qid,dung_sai,cap_nhat_luc) VALUES(?,?,?,1,'I',1,?,1,?)").run(`${ma}|${sbd}`,ma,sbd,r.qid,luc)
}
