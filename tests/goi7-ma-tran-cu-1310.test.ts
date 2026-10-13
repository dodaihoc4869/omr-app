// @vitest-environment node
// MA TRẬN CŨ + ỨNG VIÊN YẾU Gói 7 qua ĐỆM THEO ISOLATE (13/10 tối — thầy: "tất cả mọi chỗ rút câu rất là lag … tối ưu máy chủ chuyên sâu"). Hai câu SQL cũ
// quét ~6.500–8.900 dòng câu kèm JSON ~24.000 lần/ngày dù phần quét kho giống hệt cho mọi em. Đường mới: bản đồ câu → nhãn kỹ năng quét MỘT lần mỗi
// isolate (10 phút, hỏi dấu kho sau 60 giây), điểm của em đọc riêng, tính lại ĐÚNG phép SQL. Khoá: kết quả TRÙNG KHÍT hai câu SQL cũ (nhiều em, câu chưa
// duyệt, nhãn theo ý, nhãn rỗng, câu không nhãn); em thứ hai cùng isolate không quét kho; điểm KHÔNG lẫn giữa các em; kho đổi ⇒ quét lại.
import { afterEach, expect, it } from 'vitest'
import { taoKhoOmni } from './omni-3-ke-hoach-chung'
import { docMaTranCu7 } from '../server/src/goi-bai-7'
import { xoaMoiDem } from '../server/src/dem-chung'
import type { Env } from '../server/src/kieu'

const NOW = Date.parse('2026-10-13T14:00:00Z')
afterEach(() => { xoaMoiDem() })

function kho() {
  const k = taoKhoOmni({ 'DH-B8': 24, 'DH-B7': 12 }, 2)
  k.d.sql.exec(`INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B8','v1','2026-10-13T01:00:00Z'),('DH-B7','v1','2026-10-13T01:00:00Z')`)
  const q8 = k.qids('DH-B8'), q7 = k.qids('DH-B7')
  // câu chưa duyệt (không vào ứng viên yếu, vẫn vào ma trận nhãn)
  for (const q of [q8[1], q7[2]]) k.d.sql.prepare("UPDATE game_v2_question SET json=json_set(json,'$.reviewed',json('false')) WHERE qid=?").run(q)
  const iq = k.d.sql.prepare('INSERT INTO omni_q(qid,y,vkn_json,nguon,duyet_luc) VALUES(?,?,?,?,?)')
  iq.run(q8[0], -1, '["k1","k2"]', 'thay', 'x'); iq.run(q8[0], 0, '["k3"]', 'thay', 'x') // nhiều dòng (theo ý)
  iq.run(q8[1], -1, '["k1"]', 'thay', 'x'); iq.run(q8[2], -1, '[]', 'thay', 'x') // nhãn rỗng ⇒ dạng/câu dự phòng
  iq.run(q8[3], -1, '["k4"]', 'goi_y', null); iq.run(q7[0], -1, '["k2","k5"]', 'thay', 'x')
  const ip = k.d.sql.prepare('INSERT INTO omni_p_vkn(sbd,vkn_id,p,n_tu_lam,n_ngay,trang_thai,phien_ban,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,?)')
  ip.run('S1', 'k1', 0.12, 3, 1, 'yeu', 'v1', 'x'); ip.run('S1', 'k2', 0.91, 9, 2, 'vung', 'v1', 'x'); ip.run('S1', 'k5', 0.05, 2, 1, 'yeu', 'v1', 'x')
  ip.run('S2', 'k1', 0.95, 9, 3, 'vung', 'v1', 'x'); ip.run('S2', 'k4', 0.2, 1, 1, 'yeu', 'v1', 'x')
  const dang = k.d.sql.prepare("SELECT dang FROM game_v2_question WHERE dang IS NOT NULL AND dang<>'' LIMIT 1").get() as { dang?: string } | undefined
  if (dang?.dang) ip.run('S1', `dang:${dang.dang}`, 0.07, 1, 1, 'yeu', 'v1', 'x')
  let quet = 0
  const goc = k.env.DB
  const env = { ...k.env, DB: { prepare: (q: string) => { if (q.includes('FROM game_v2_question q LEFT JOIN omni_q o')) quet++; return goc.prepare(q) }, batch: goc.batch.bind(goc) } } as unknown as Env
  return { ...k, env, envGoc: k.env, quet: () => quet }
}
// Hai câu SQL CŨ của lapGoi7 (trước 13/10) — phép thử: đường mới phải ra TRÙNG KHÍT.
const SQL_KN_CU = `SELECT DISTINCT j.value AS kn,p.trang_thai FROM game_v2_question q LEFT JOIN omni_q o ON q.qid=o.qid,
      json_each(CASE WHEN json_array_length(COALESCE(o.vkn_json,'[]'))>0 THEN o.vkn_json ELSE json_array(CASE WHEN COALESCE(q.dang,'')<>'' THEN 'dang:'||q.dang ELSE 'cau:'||q.qid END) END) j LEFT JOIN omni_p_vkn p ON p.vkn_id=j.value AND p.sbd=? WHERE q.ma_de IN (SELECT value FROM json_each(?))`
const SQL_YEU_CU = `SELECT q.qid,MIN(COALESCE(p.p,0.3)) yeu FROM game_v2_question q LEFT JOIN omni_q o ON o.qid=q.qid,
      json_each(CASE WHEN json_array_length(COALESCE(o.vkn_json,'[]'))>0 THEN o.vkn_json ELSE json_array(CASE WHEN COALESCE(q.dang,'')<>'' THEN 'dang:'||q.dang ELSE 'cau:'||q.qid END) END) j LEFT JOIN omni_p_vkn p ON p.vkn_id=j.value AND p.sbd=?
      WHERE q.ma_de IN(SELECT value FROM json_each(?)) AND json_extract(q.json,'$.reviewed')=1
      GROUP BY q.qid ORDER BY yeu,q.qid LIMIT 96`
const docCu = async (env: Env, sbd: string, ma: readonly string[]) => {
  const t = JSON.stringify(ma)
  return Promise.all([env.DB.prepare(SQL_KN_CU).bind(sbd, t).all<Record<string, unknown>>(), env.DB.prepare(SQL_YEU_CU).bind(sbd, t).all<Record<string, unknown>>()])
}
const xep = (rs: Record<string, unknown>[]) => rs.map((r) => `${String(r.kn)}|${r.trang_thai ?? 'null'}`).sort()
const MA = ['DH-B8', 'DH-B7']

it('kết quả TRÙNG KHÍT hai câu SQL cũ — nhiều em, câu chưa duyệt, nhãn theo ý / rỗng / không có', async () => {
  for (const sbd of ['S1', 'S2', 'S3']) {
    const k = kho()
    const [knCu, yeuCu] = await docCu(k.env, sbd, MA)
    const [knMoi, yeuMoi] = await docMaTranCu7(k.env, sbd, MA, NOW)
    expect(xep(knMoi.results)).toEqual(xep(knCu.results))
    expect(yeuMoi.results.map((r) => [r.qid, Number(r.yeu)])).toEqual(yeuCu.results.map((r) => [r.qid, Number(r.yeu)]))
    expect(yeuCu.results.length).toBeGreaterThan(0)
    k.d.sql.close(); xoaMoiDem()
  }
})

it('em thứ hai cùng isolate KHÔNG quét kho; điểm kỹ năng KHÔNG lẫn giữa các em; kho đổi ⇒ quét lại', async () => {
  const k = kho()
  const [, y1] = await docMaTranCu7(k.env, 'S1', MA, NOW)
  expect(k.quet()).toBe(1)
  const [kn2, y2] = await docMaTranCu7(k.env, 'S2', MA, NOW + 1000)
  expect(k.quet()).toBe(1)
  const [kn2Cu, y2Cu] = await docCu(k.envGoc, 'S2', MA)
  expect(xep(kn2.results)).toEqual(xep(kn2Cu.results))
  expect(y2.results.map((r) => r.qid)).toEqual(y2Cu.results.map((r) => r.qid))
  expect(y2.results.map((r) => r.qid)).not.toEqual(y1.results.map((r) => r.qid))
  await docMaTranCu7(k.env, 'S1', MA, NOW + 90_000) // quá 60 giây, dấu kho chưa đổi ⇒ dùng tiếp
  expect(k.quet()).toBe(1)
  k.d.sql.exec(`UPDATE game_v2_index SET indexed_at='2026-10-13T14:01:00Z' WHERE ma_de='DH-B8'`)
  await docMaTranCu7(k.env, 'S1', MA, NOW + 180_000) // kho vừa lập chỉ mục lại ⇒ quét lại
  expect(k.quet()).toBe(2)
  k.d.sql.close()
})
