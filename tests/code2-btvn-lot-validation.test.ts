// @vitest-environment node
// Delta B: real Worker HTTP with node:sqlite + synthetic R2; no production or workerd claim.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { taoD1That } from './_d1-that'

const NOW = '2026-09-24T04:00:00Z', HAN = '2026-09-29T04:00:00Z', MA = 'B-CODE2'
const I = 'DE1-I-1', II = 'DE1-II-1', Q = 'DE1-III-1'
const answers = { [I]: 'A', [II]: 'DSDS', [Q]: '12' }
const routes = ['/btvn/nop', '/goi', '/btvn/xong-lo'] as const
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(NOW)) })
afterEach(() => vi.useRealTimers())

function setup() {
  const d = taoD1That()
  const bank = { cau: [
    { phan: 'I', so: 1, de: 'Synthetic I', pa: { A: 'a', B: 'b', C: 'c', D: 'd' }, dap_an: 'A' },
    { phan: 'II', so: 1, de: 'Synthetic II', y: { a: 'a', b: 'b', c: 'c', d: 'd' }, dap_an: 'DSDS' },
    { phan: 'III', so: 1, de: 'Synthetic III', dap_an: '12', loi_giai: 'PRIVATE-SOLUTION' },
  ] }
  d.objects.set('kho/DE1.json', bank)
  d.sql.prepare('INSERT INTO btvn(ma_btvn,ma_ca,ma_de,so_cau,giao_luc,han_nop,da_xoa,cap_nhat_luc) VALUES(?,?,?,?,?,?,0,?)').run(MA, 'CA1', 'DE1', 3, '2026-09-20T04:00:00Z', HAN, NOW)
  d.sql.prepare('INSERT INTO btvn_em(khoa,ma_btvn,sbd,ho_ten) VALUES(?,?,?,?)').run(`${MA}|S1`, MA, 'S1', 'Synthetic')
  d.sql.prepare('INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES(?,?,?,?,?)').run('S1', 'Synthetic', '12', 'mk', NOW)
  d.sql.prepare('INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES(?,?,?)').run('exp_moi', '{"tu":"2026-09-01T00:00:00Z","toanBo":true}', NOW)
  let reads = 0
  const get = d.env.DE.get.bind(d.env.DE)
  d.env.DE.get = async (...args) => { if (args[0] === 'kho/DE1.json') reads++; return get(...args) }
  const post = async (path: string, dapAn?: Record<string, string>, chiSo = 0) => {
    const pending: Promise<unknown>[] = []
    const r = await worker.fetch(new Request(`https://local${path}`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ maBtvn: MA, ma: MA, sbd: 'S1', chiSo, ...(dapAn === undefined ? {} : { dapAn }), ...(path === '/goi' ? { action: 'nopKhacPhuc' } : {}) }),
    }), d.env, { waitUntil(p: Promise<unknown>) { pending.push(p) } })
    const body = await r.json() as Record<string, any>
    await Promise.all(pending)
    return { status: r.status, body }
  }
  const row = () => d.sql.prepare('SELECT * FROM btvn_em WHERE khoa=?').get(`${MA}|S1`)!
  const effects = () => Object.fromEntries(['btvn_em', 'su_kien_hoc', 'nam_kt_cau', 'nam_kt_dang', 'exp_so', 'manh_khien_so', 'ke_hoach_ngay', 'game_v2_profile'].map(t => [t, d.chup(t)]))
  const setKey = (key: string) => { bank.cau[2]!.dap_an = key; d.objects.set('kho/DE1.json', structuredClone(bank)) }
  return { d, post, row, effects, setKey, reads: () => reads }
}
function reject(r: { status: number; body: Record<string, any> }, status = 422) {
  expect(r.status).toBe(status)
  expect(r.body).toMatchObject({ ok: false, ma: status === 422 ? 'BTVN_GRADING_INPUT_INVALID' : 'BTVN_GRADING_MATERIAL_INVALID' })
  expect(r.body.suKien).toBeUndefined()
  expect(JSON.stringify(r.body)).not.toContain('PRIVATE-SOLUTION')
}

describe('Code2 delta B: normal homework validates before final/progress/events/EXP', () => {
  it.each(routes.flatMap(path => ['12abc', 'sqrt(4)'].map(answer => [path, answer] as const)))('%s rejects mixed batch %s before writes; retry/replay', async (path, answer) => {
    const s = setup(), before = s.effects()
    reject(await s.post(path, { ...answers, [Q]: answer }))
    expect(s.effects()).toEqual(before)
    expect((await s.post(path, answers)).body.ok).toBe(true)
    expect(s.d.dem('su_kien_hoc')).toBe(3)
    expect(s.d.dem('exp_so')).toBeGreaterThan(0)
    const after = s.effects()
    expect((await s.post(path, answers)).body.ok).toBe(true)
    expect(s.effects()).toEqual(after)
  })

  it.each(routes)('%s invalid numeric key rejects even identical or blank answers; repair then retry', async path => {
    const s = setup()
    s.setKey('sqrt(4)')
    const before = s.effects()
    for (const answer of ['sqrt(4)', '']) {
      reject(await s.post(path, { ...answers, [Q]: answer }), 500)
      expect(s.effects()).toEqual(before)
    }
    s.setKey('12')
    expect((await s.post(path, answers)).body.ok).toBe(true)
    expect(s.d.dem('su_kien_hoc')).toBe(3)
  })

  it.each([undefined, {}])('no-answer lot payload %j keeps legacy progress-only behavior without reading R2', async payload => {
    const s = setup()
    s.d.env.DE.get = async () => { throw new Error('no-payload must not read R2') }
    const result = await s.post('/btvn/xong-lo', payload)
    expect(result.body).toMatchObject({ ok: true, loDaXong: 1 })
    expect(result.body.suKien).toBeUndefined()
    expect(s.row().nop_luc).toBeNull()
    expect(s.d.dem('su_kien_hoc')).toBe(0)
    expect(s.d.dem('exp_so')).toBe(0)
  })

  it.each(routes)('%s preserves blank markers and valid wrong numeric as different outcomes', async path => {
    const s = setup()
    expect((await s.post(path, { ...answers, [Q]: '---' })).body.ok).toBe(true)
    expect(s.d.sql.prepare('SELECT ket_qua FROM su_kien_hoc WHERE qid=?').get(Q)).toEqual({ ket_qua: null })
    const wrong = setup()
    expect((await wrong.post(path, { ...answers, [Q]: '13' })).body.ok).toBe(true)
    expect(wrong.d.sql.prepare('SELECT ket_qua FROM su_kien_hoc WHERE qid=?').get(Q)).toEqual({ ket_qua: 0 })
  })

  it('lot prepares once before progress and persists the same grading material without rereading R2', async () => {
    const s = setup()
    const prepare = s.d.env.DB.prepare.bind(s.d.env.DB)
    let readsAtProgress = -1
    s.d.env.DB.prepare = (sql: string) => {
      const stmt = prepare(sql)
      if (sql.includes('UPDATE btvn_em SET lo_da_xong = MAX(lo_da_xong, ?)')) {
        const run = stmt.run.bind(stmt)
        stmt.run = async () => {
          readsAtProgress = s.reads()
          s.setKey('13') // R2 changes after prepare: persistence must use the already validated events.
          return run()
        }
      }
      return stmt
    }
    expect((await s.post('/btvn/xong-lo', answers)).body).toMatchObject({ ok: true, loDaXong: 1, suKien: 3 })
    expect(readsAtProgress).toBe(1)
    expect(s.reads()).toBe(1)
    expect(s.d.sql.prepare('SELECT ket_qua FROM su_kien_hoc WHERE qid=?').get(Q)).toEqual({ ket_qua: 1 })
  })

  it('R2 prepare failure is generic HTTP500 before progress/events; storage repair permits retry', async () => {
    const s = setup(), before = s.effects()
    const get = s.d.env.DE.get
    s.d.env.DE.get = async () => { throw new Error('synthetic R2 unavailable') }
    const r = await s.post('/btvn/xong-lo', answers)
    expect(r.status).toBe(500)
    expect(r.body.ma).toBeUndefined()
    expect(s.effects()).toEqual(before)
    s.d.env.DE.get = get
    expect((await s.post('/btvn/xong-lo', answers)).body.ok).toBe(true)
  })

  it.each(['/btvn/nop', '/goi'])('%s canonical combined-paper aliases use preflight on the effective answers', async path => {
    const s = setup()
    const maDe = 'DE1-TN,DE1-DS,DE1-TLN'
    s.d.sql.prepare('UPDATE btvn SET ma_de=?').run(maDe)
    const alias = { [`${maDe}-I-1`]: 'A', [`${maDe}-II-1`]: 'DSDS', [`${maDe}-III-1`]: '12abc' }
    const before = s.effects()
    reject(await s.post(path, alias))
    expect(s.effects()).toEqual(before)
    // Exact qid wins over the malformed alias as in the existing canonicalizer.
    expect((await s.post(path, { ...alias, [Q]: '12' })).body).toMatchObject({ ok: true, soDung: 3, soCau: 3 })
    expect(JSON.parse(String(s.row().dap_an_json))).toEqual(answers)
    expect(s.reads()).toBe(2) // one per request despite three paper-part references
  })

  it('malformed retry does not consume a full-submit attempt; valid retry limits stay four total', async () => {
    const s = setup()
    expect((await s.post('/btvn/nop', answers)).body.lanThu).toBe(1)
    const before = s.effects()
    reject(await s.post('/btvn/nop', { ...answers, [Q]: '12abc' }))
    expect(s.effects()).toEqual(before)
    for (const [n, value] of ['13', '14', '15'].entries()) expect((await s.post('/btvn/nop', { ...answers, [Q]: value })).body.lanThu).toBe(n + 2)
    const after = s.effects()
    expect((await s.post('/btvn/nop', { ...answers, [Q]: '16' })).body).toMatchObject({ ok: false, daHetLuot: true })
    expect(s.effects()).toEqual(after)
  })

  it('late first-submit validation preserves opportunity and subsequent valid submit records lateness once', async () => {
    const s = setup()
    // This fixture must be assigned after the existing late-submission rollout cutoff.
    s.d.sql.prepare('UPDATE btvn SET giao_luc=?').run(NOW)
    vi.setSystemTime(new Date('2026-09-30T04:00:00Z'))
    const before = s.effects()
    reject(await s.post('/btvn/nop', { ...answers, [Q]: 'sqrt(4)' }))
    expect(s.effects()).toEqual(before)
    expect((await s.post('/btvn/nop', answers)).body.ok).toBe(true)
    expect(s.row()).toMatchObject({ nop_tre: 1, gio_tre: 24, so_lan_lam: 1 })
    const after = s.effects()
    expect((await s.post('/btvn/nop', { ...answers, [Q]: '13' })).body).toMatchObject({ ok: false, lyDo: 'qua_han' })
    expect(s.effects()).toEqual(after)
  })

  it('unassigned lot preserves its old response before R2 or malformed-answer validation', async () => {
    const s = setup()
    s.d.sql.exec('DELETE FROM btvn_em')
    const before = s.effects()
    s.d.env.DE.get = async () => { throw new Error('must not read unassigned bank') }
    const result = await s.post('/btvn/xong-lo', { [Q]: '12abc' })
    expect(result.status).toBe(200)
    expect(result.body).toMatchObject({ ok: false, error: 'Em không có bài tập này.' })
    expect(s.effects()).toEqual(before)
  })

  it('outside-only lot payload has prepared [] rather than no payload: legacy progress and zero events', async () => {
    const s = setup()
    s.setKey('sqrt(4)') // not part of this submitted set
    const result = await s.post('/btvn/xong-lo', { 'OUTSIDE-III-1': '12abc' })
    expect(result.body).toMatchObject({ ok: true, loDaXong: 1, suKien: 0 })
    expect(s.reads()).toBe(1)
    expect(s.d.dem('su_kien_hoc')).toBe(0)
  })

  it.each(['SELECT 1 FROM btvn_em WHERE khoa=?', 'SELECT ma_de FROM btvn WHERE ma_btvn = ? AND da_xoa = 0'])('unexpected prepare DB failure (%s) stays generic500 without progress', async query => {
    const s = setup(), before = s.effects()
    const prepare = s.d.env.DB.prepare.bind(s.d.env.DB)
    s.d.env.DB.prepare = (sql: string) => {
      if (sql === query) throw new Error('synthetic database unavailable')
      return prepare(sql)
    }
    const result = await s.post('/btvn/xong-lo', answers)
    expect(result.status).toBe(500)
    expect(result.body.ma).toBeUndefined()
    expect(s.effects()).toEqual(before)
  })

  it('assignment update returning zero after preparation still blocks event/EXP persistence', async () => {
    const s = setup(), before = s.effects()
    const prepare = s.d.env.DB.prepare.bind(s.d.env.DB)
    s.d.env.DB.prepare = (sql: string) => {
      const stmt = prepare(sql)
      if (sql.includes('UPDATE btvn_em SET lo_da_xong = MAX(lo_da_xong, ?)')) {
        stmt.run = async () => ({ success: true, results: [], meta: { changes: 0 } })
      }
      return stmt
    }
    expect((await s.post('/btvn/xong-lo', answers)).body).toMatchObject({ ok: false, error: 'Em không có bài tập này.' })
    expect(s.effects()).toEqual(before)
    expect(s.reads()).toBe(1)
  })

  it('lot then full first submit keeps no-double-counting across sources', async () => {
    const s = setup()
    expect((await s.post('/btvn/xong-lo', { [Q]: '12' })).body.ok).toBe(true)
    expect((await s.post('/btvn/nop', answers)).body.ok).toBe(true)
    expect(s.d.dem('su_kien_hoc')).toBe(3)
    expect(s.d.dem('su_kien_hoc', `qid='${Q}'`)).toBe(1)
  })
})
