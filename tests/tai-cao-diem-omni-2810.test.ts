// @vitest-environment node
// THỬ TẢI 270 EM (28/10, D1 sao): D1 đọc ~30 triệu dòng/phút — (1) prior lớp: hồ sơ thô CẢ LỚP / phát lại sổ cả lớp ở mỗi lần dựng hồ sơ; (2) `cau_meta` / `omni_q`
// theo lô qid; (3) `thoCuaLop` ~144 nghìn mục ⇒ tràn bộ nhớ. Sửa (server/src/omni-d1.ts): prior tính sẵn theo em (`omni_prior_em`, cron đêm + cất nền lượt đầu),
// kho câu + Q nạp toàn bảng một lần / isolate. Khoá ĐÚNG KẾT QUẢ:
//  · `gopPriorCaLop` = `gopPrior` từng em, ĐÚNG TỪNG BIT (cùng thứ tự cộng), kể cả em không thuộc lớp / không quan sát / ngưỡng tối thiểu.
//  · hồ sơ OMNI dựng từ prior ĐÃ CẤT = dựng như cũ (tính lại hồ sơ thô cả lớp); lượt sau không đọc `omni_p_vkn` cả lớp, không đọc sổ em khác.
//  · nạp toàn kho (`batNapToanKho`) ⇒ siêu dữ liệu câu + Q y hệt đọc theo lô.
import { afterEach, expect, it } from 'vitest'
import { gopPrior, gopPriorCaLop, hoSoOmniEm, docCauKho, qCuaCau, batNapToanKho, xoaDemOmni, chupHoSoTho } from '../server/src/omni-d1'
import { THAM_SO_OMNI } from '../server/src/omni-kieu'
import { dongBoCauMeta } from '../server/src/cau-meta'
import { taoKhoOmni } from './omni-3-ke-hoach-chung'
import type { Env } from '../server/src/kieu'

afterEach(() => { batNapToanKho(false); xoaDemOmni() })

it('gopPriorCaLop = gopPrior từng em, đúng từng bit (300 lớp ngẫu nhiên)', () => {
  let hat = 7
  const ngau = () => { hat = (hat * 1103515245 + 12345) % 2147483648; return hat / 2147483648 }
  for (let lan = 0; lan < 300; lan++) {
    const tho = new Map<string, Map<string, { p: number; n: number }>>()
    const soEm = 1 + Math.floor(ngau() * 12), soK = 1 + Math.floor(ngau() * 9)
    for (let i = 0; i < soEm; i++) {
      const m = new Map<string, { p: number; n: number }>()
      for (let k = 0; k < soK; k++) if (ngau() < 0.7) m.set(`v${Math.floor(ngau() * soK)}`, { p: ngau() < 0.05 ? NaN : ngau(), n: ngau() < 0.2 ? 0 : 1 + Math.floor(ngau() * 5) })
      tho.set(`S${String(Math.floor(ngau() * 1000)).padStart(3, '0')}`, m)
    }
    const ems = [...tho.keys(), 'S999X', 'A000']
    const ca = gopPriorCaLop(tho, ems, THAM_SO_OMNI)
    for (const s of ems) {
      const mot = gopPrior(tho, s, THAM_SO_OMNI)
      expect([...ca.get(s)!], `lần ${lan}, em ${s}`).toEqual([...mot])
    }
  }
})

/** Kho OMNI: 3 bài, một lớp 6 em bật OMNI, mỗi em có sổ trước hôm nay (để có ảnh chụp + prior lớp). */
async function khoLop() {
  const k = taoKhoOmni({}, 8)
  k.d.sql.exec(`INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true,"lop":["12A1"]}','x'),('omni','{"bat":true,"lop":["12A1"]}','x')`)
  const now = Date.parse('2026-10-12T13:30:00Z')
  const qs = k.qids('DH-B1')
  const st = k.d.sql.prepare("INSERT INTO su_kien_hoc (khoa, nguon, ma_nguon, sbd, qid, lan, ket_qua, luc, ngay_vn, ma_dang, received_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)")
  let i = 0
  for (let e = 1; e <= 8; e++) for (const q of qs.slice(0, 8)) { const luc = now - 86_400_000 * 2 - i * 60_000; st.run(`k${i++}`, 'game', 'p', `S${e}`, q, 1, (e + i) % 3 ? 1 : 0, new Date(luc).toISOString(), '2026-10-10', 'DH-B1.D0', luc) }
  return { k, env: k.env as Env, now }
}

it('hồ sơ dựng từ prior ĐÃ CẤT = dựng như cũ; lượt sau không đọc hồ sơ thô cả lớp', async () => {
  const { k, env, now } = await khoLop()
  await chupHoSoTho(env, ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'], '2026-10-12')
  xoaDemOmni()
  const cu = await hoSoOmniEm(env, 'S1', now) // lượt đầu: tính hồ sơ thô cả lớp (như cũ) rồi cất NỀN prior cả lớp
  await new Promise((r) => setTimeout(r, 50))
  expect(k.d.dem('omni_prior_em')).toBeGreaterThanOrEqual(8)
  expect(cu.vkn && Object.keys(cu.vkn).length).toBeGreaterThan(0)
  xoaDemOmni()
  const sql: string[] = []
  const g = env.DB as unknown as { prepare(q: string): unknown }
  const envDem = { ...env, DB: { ...env.DB, prepare: (q: string) => { sql.push(q); return g.prepare(q) }, batch: (env.DB as unknown as { batch: unknown }).batch } } as unknown as Env
  const moi = await hoSoOmniEm(envDem, 'S1', now)
  expect(JSON.stringify(moi)).toBe(JSON.stringify(cu))
  expect(sql.some((q) => /FROM omni_p_vkn WHERE sbd IN/.test(q)), 'không đọc hồ sơ thô cả lớp').toBe(false)
  // S2 (cùng lớp) cũng đã có prior cất sẵn ⇒ không đọc hồ sơ thô cả lớp
  sql.length = 0
  await hoSoOmniEm(envDem, 'S2', now)
  expect(sql.some((q) => /FROM omni_p_vkn WHERE sbd IN/.test(q))).toBe(false)
})

it('nạp toàn kho ⇒ siêu dữ liệu câu + Q y hệt đọc theo lô', async () => {
  const k = taoKhoOmni({}, 2)
  const env = k.env as Env
  for (let i = 0; i < 20; i++) { const r = await dongBoCauMeta(env, 50); if (!r.conNua) break }
  const qs = [...k.qids('DH-B1'), ...k.qids('DH-B2'), 'khong-co']
  k.d.sql.prepare("INSERT INTO omni_q (qid, y, vkn_json, nguon) VALUES (?, -1, ?, 'thay')").run(qs[0], JSON.stringify(['DH-B1.D0.v1']))
  batNapToanKho(false); xoaDemOmni()
  const loKho = await docCauKho(env, qs), loQ = await qCuaCau(env, qs)
  batNapToanKho(true); xoaDemOmni()
  const toanKho = await docCauKho(env, qs), toanQ = await qCuaCau(env, qs)
  expect(toanKho.size).toBeGreaterThan(0)
  expect([...toanKho].sort()).toEqual([...loKho].sort())
  expect(JSON.stringify([...toanQ])).toBe(JSON.stringify([...loQ]))
  expect(toanQ.get(qs[0]!)!.nguon).toBe('thay')
})
