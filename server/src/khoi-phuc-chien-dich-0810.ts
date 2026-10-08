// Phục hồi một lần theo lệnh thầy 08/10. Không xóa sổ học, điểm hay hồ sơ.
import type { Env, D1PreparedStatement } from './kieu'
type Row = Record<string, unknown>
export const KHOA_KHOI_PHUC = 'khoi_phuc_chien_dich_rieng_0810_v1'
const MOC_GOP = '2026-10-08T05:35:52.832Z'
export const HANH_TRINH_LUU_TRU = [10, 11, 12].map(k => `hanh-trinh-gioi-hoa-khoi-${k}`)
const ID_CU = ['9c1d4f24-ea90-48f6-ba5d-3be8bb859321','3c954a63-cbe1-4409-9a87-3e285ecd9040','d889c5df-c789-44aa-ac36-a4b7ca81da6f','11086881-bbe7-4e36-a918-ceb1e8a566b8','05d6eec7-1ade-4909-a040-8dacd6d2e41a','a4ab8354-ea7e-419d-a2f8-0562c4daa62b','55a8b436-4d66-477b-9989-e90e3b4c97cc','786c4708-f4c4-4bbb-b002-30dfe68d09e4','520ba715-162a-4150-b1e1-c81b41367e37']
const TICK: Record<string, string> = {
  '08b9ea69-3215-4b08-af39-28ce327a9a67': '786c4708-f4c4-4bbb-b002-30dfe68d09e4',
  '016c5460-1812-4029-b0c9-c094ac7cf165': '520ba715-162a-4150-b1e1-c81b41367e37',
  '6ada3a36-4b61-4d81-9106-8f3e23afed51': '55a8b436-4d66-477b-9989-e90e3b4c97cc',
  'ef09500a-e695-4851-9104-7507c816ac87': '11086881-bbe7-4e36-a918-ceb1e8a566b8',
  'd103e254-d632-4b7f-9461-1b382bb2cc6a': '3c954a63-cbe1-4409-9a87-3e285ecd9040',
}
const arr = (x: unknown): string[] => JSON.parse(String(x ?? '[]'))
export async function khoiPhucChienDich0810(env: Env, nowMs = Date.now()): Promise<string> {
  if (await env.DB.prepare('SELECT khoa FROM cau_hinh WHERE khoa=?').bind(KHOA_KHOI_PHUC).first()) return 'da_xong'
  const co = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='hanh_trinh_hop_nhat'").first()
  if (!co) return 'khong_co_hop_nhat'
  if (await env.DB.prepare("SELECT 1 FROM ca WHERE trang_thai='mo' LIMIT 1").first()) return 'cho_het_ca_thi'
  const maps = (await env.DB.prepare('SELECT * FROM hanh_trinh_hop_nhat').all<Row>()).results
  if (maps.length !== 9 || maps.some(m => !ID_CU.includes(String(m.chien_dich_cu)) || m.hop_nhat_luc !== MOC_GOP)) throw new Error('Dấu vết gộp đã đổi; không tự khôi phục.')
  const rows = (await env.DB.prepare('SELECT * FROM chien_dich WHERE id IN (SELECT value FROM json_each(?))').bind(JSON.stringify([...ID_CU, ...HANH_TRINH_LUU_TRU])).all<Row>()).results
  if (rows.length !== 12) throw new Error('Thiếu chiến dịch gốc.')
  const old = rows.filter(r => ID_CU.includes(String(r.id)))
  if (old.some(r => r.trang_thai !== 'da_dong' || r.dong_luc !== MOC_GOP)) throw new Error('Chiến dịch cũ đã đổi sau lần gộp.')
  const journeys = rows.filter(r => HANH_TRINH_LUU_TRU.includes(String(r.id)))
  for (const j of journeys) {
    if (j.trang_thai !== 'dang_chay' || j.han_nop !== '9999-12-31') throw new Error('Hành trình đã đổi trạng thái.')
    const ids = maps.filter(m => m.chien_dich_moi === j.id).map(m => m.chien_dich_cu)
    const qs = new Set(old.filter(r => ids.includes(r.id)).flatMap(r => arr(r.qid_json)))
    if (arr(j.qid_json).some(q => !qs.has(q))) throw new Error('Có bài mới sau lần gộp; cần giữ phạm vi riêng.')
  }
  const ticks = (await env.DB.prepare('SELECT * FROM bai_da_day WHERE chien_dich_id IN (SELECT value FROM json_each(?))').bind(JSON.stringify(HANH_TRINH_LUU_TRU)).all<Row>()).results
  if (ticks.length !== 5 || ticks.some(t => !TICK[String(t.id)] || !old.some(o => o.id === TICK[String(t.id)] && o.lop === t.lop && o.tao_luc === t.tick_luc))) throw new Error('Liên kết bài đã dạy không còn khớp.')
  const luc = new Date(nowMs).toISOString()
  const ngay = new Date(nowMs + 7 * 3600000).toISOString().slice(0, 10)
  const em = JSON.stringify([...new Set(journeys.flatMap(j => arr(j.sbd_json)))])
  const st: D1PreparedStatement[] = [
    env.DB.prepare('CREATE TABLE IF NOT EXISTS khoi_phuc_0810_sao_luu (bang TEXT NOT NULL, id TEXT NOT NULL, noi_dung TEXT NOT NULL, luc TEXT NOT NULL, PRIMARY KEY(bang,id))'),
    env.DB.prepare('CREATE TABLE IF NOT EXISTS khoi_phuc_0810_chot (id TEXT PRIMARY KEY, ok INTEGER NOT NULL CHECK(ok=1))'),
    // Mọi thay đổi cùng batch giao dịch: không được mở nửa số chiến dịch, không ghi đè bản sao.
    env.DB.prepare("INSERT INTO khoi_phuc_0810_chot(id,ok) SELECT 'mot_lan', CASE WHEN NOT EXISTS(SELECT 1 FROM ca WHERE trang_thai='mo') THEN 1 ELSE 0 END"),
    env.DB.prepare("INSERT INTO khoi_phuc_0810_chot(id,ok) SELECT 'so_luong', CASE WHEN (SELECT COUNT(*) FROM hanh_trinh_hop_nhat)=9 AND (SELECT COUNT(*) FROM bai_da_day WHERE chien_dich_id IN (SELECT value FROM json_each(?)))=5 THEN 1 ELSE 0 END").bind(JSON.stringify(HANH_TRINH_LUU_TRU)),
  ]
  for (const [table, data] of [['chien_dich', rows], ['bai_da_day', ticks], ['hanh_trinh_hop_nhat', maps]] as const) {
    for (const row of data) {
      const key = table === 'hanh_trinh_hop_nhat' ? 'chien_dich_cu' : 'id'
      const fields = Object.keys(row)
      if (fields.some(f => !/^[a-z_]+$/.test(f))) throw new Error('Tên cột không hợp lệ.')
      // CAS tất cả cột, kể cả danh sách em/câu; thay đổi đồng thời ⇒ rollback cả batch.
      st.push(env.DB.prepare(`INSERT INTO khoi_phuc_0810_chot(id,ok) SELECT ?, CASE WHEN EXISTS(SELECT 1 FROM ${table} WHERE ${fields.map(f => `${f} IS ?`).join(' AND ')}) THEN 1 ELSE 0 END`).bind(`${table}:${row[key]}`, ...fields.map(f => row[f])))
      st.push(env.DB.prepare('INSERT INTO khoi_phuc_0810_sao_luu(bang,id,noi_dung,luc) VALUES(?,?,?,?)').bind(table, row[key], JSON.stringify(row), luc))
    }
  }
  // Bản sao kế hoạch nằm trong D1 riêng, không xuất danh tính ra Actions.
  st.push(env.DB.prepare(`INSERT INTO khoi_phuc_0810_sao_luu(bang,id,noi_dung,luc)
    SELECT 'srs2_ke_hoach_omni', sbd||':'||ngay, json_object('sbd',sbd,'ngay',ngay,'chien_dich_json',chien_dich_json,'cap_nhat_luc',cap_nhat_luc), ?
    FROM srs2_ke_hoach_omni WHERE ngay=? AND sbd IN (SELECT value FROM json_each(?))`).bind(luc, ngay, em))
  st.push(env.DB.prepare("UPDATE chien_dich SET trang_thai='dang_chay', dong_luc=NULL WHERE id IN (SELECT value FROM json_each(?))").bind(JSON.stringify(ID_CU)))
  // Chỉ ẩn hành trình tổng hợp; giữ nguyên câu, em, mọi lịch sử và dấu vết hợp nhất.
  st.push(env.DB.prepare("UPDATE chien_dich SET trang_thai='da_huy', dong_luc=? WHERE id IN (SELECT value FROM json_each(?))").bind(luc, JSON.stringify(HANH_TRINH_LUU_TRU)))
  for (const t of ticks) st.push(env.DB.prepare('UPDATE bai_da_day SET chien_dich_id=? WHERE id=?').bind(TICK[String(t.id)], t.id))
  st.push(env.DB.prepare("UPDATE srs2_ke_hoach_omni SET chien_dich_json='[]', cap_nhat_luc=? WHERE ngay=? AND sbd IN (SELECT value FROM json_each(?))").bind(luc, ngay, em))
  st.push(env.DB.prepare('INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES(?,?,?)').bind(KHOA_KHOI_PHUC, JSON.stringify({trangThai:'xong',luc,chienDich:9,hanhTrinhLuuTru:3,baiDaDay:5,mocMa:'44132317'}), luc))
  await env.DB.batch(st)
  return 'vua_khoi_phuc'
}
