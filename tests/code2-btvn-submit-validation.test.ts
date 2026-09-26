// @vitest-environment node
// Real Worker HTTP + SQL through node:sqlite; synthetic issued questions/R2.
// This verifies no consumption on grading validation, not concurrent Cloudflare D1 execution.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { nopChangBtvn } from '../src/lib/btvn-may-chu-moi'
import { MAC_DINH_MAY_CHU } from '../src/lib/cau-hinh-may-chu'
import { dung, giao, mo, maBtvn, toKho } from './_btvn-nang-do-mau'

const NOW = '2026-09-28T02:00:00Z'
const Q = 'DE1-III-1', R = 'DE1-III-2', BONUS = 'DE1-III-3', I = 'DE1-I-1', II = 'DE1-II-1'
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(NOW)) })
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

async function setup() {
  const d = dung()
  expect((await giao(d)).ok).toBe(true)
  expect((await mo(d)).ok).toBe(true)
  const ma = maBtvn(d)
  // Small, deterministic already-issued set: isolate submit from selection/adaptation.
  d.sql.exec('DELETE FROM btvn_em_cau')
  for (const [n, [qid, chang]] of ([ [I, 0], [II, 0], [Q, 0], [R, 1], [BONUS, -1] ] as [string, number][]).entries()) {
    d.sql.prepare('INSERT INTO btvn_em_cau(khoa,ma_btvn,sbd,qid,chang,nhan,thu_tu) VALUES(?,?,?,?,?,?,?)')
      .run(`${ma}|S1|${qid}`, ma, 'S1', qid, chang, chang < 0 ? 'loi_cao' : 'loi', n)
  }
  d.sql.prepare('UPDATE btvn_em SET so_chang=2,so_cau_em=4,chot_luc=?,chang_mo_json=NULL,lo_da_xong=0,dap_an_json=NULL,nop_luc=NULL')
    .run('2026-09-22T03:00:00Z')
  d.sql.prepare('INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES(?,?,?)').run('btvn_ca_nhan', '{"thichNghi":false}', NOW)
  d.sql.prepare('INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES(?,?,?)').run('exp_moi', '{"tu":"2026-09-01T00:00:00Z","toanBo":true}', NOW)
  const post = async (path: string, answers: Record<string, string>, chiSo = 0) => {
    const pending: Promise<unknown>[] = []
    const res = await worker.fetch(new Request(`https://local${path}`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ maBtvn: ma, ma, sbd: 'S1', dapAn: answers, chiSo, ...(path === '/goi' ? { action: 'nopKhacPhuc' } : {}) }),
    }), d.env, { waitUntil(p: Promise<unknown>) { pending.push(p) } })
    const body = await res.json() as Record<string, any>
    await Promise.all(pending)
    return { status: res.status, body }
  }
  const stage = (answers: Record<string, string>, n = 0) => post('/btvn/xong-lo', answers, n)
  const row = () => d.sql.prepare('SELECT * FROM btvn_em WHERE sbd=?').get('S1')!
  const saved = () => JSON.parse(String(row().dap_an_json ?? '{}')) as Record<string, string>
  const effects = () => Object.fromEntries(['btvn_em', 'btvn_em_cau', 'btvn_cau', 'su_kien_hoc', 'nam_kt_cau', 'nam_kt_dang', 'exp_so', 'manh_khien_so', 'ke_hoach_ngay', 'game_v2_profile'].map(t => [t, d.chup(t)]))
  const setKey = (qid: string, key: string) => {
    const bank = structuredClone(d.objects.get('kho/DE1.json') as ReturnType<typeof toKho>)
    bank.cau.find(c => `DE1-${c.phan}-${c.so}` === qid)!.dap_an = key
    d.objects.set('kho/DE1.json', bank)
  }
  return { d, post, stage, row, saved, effects, setKey }
}
const first = { [I]: 'A', [II]: 'DSDS', [Q]: '0.39' }
const full = { ...first, [R]: '0.39' }
function rejected(r: {status: number; body: Record<string, any>}, status = 422) {
  expect(r.status).toBe(status)
  expect(r.body).toMatchObject({ ok: false, ma: status === 422 ? 'BTVN_GRADING_INPUT_INVALID' : 'BTVN_GRADING_MATERIAL_INVALID' })
  expect(r.body.ketQua).toBeUndefined()
  expect(JSON.stringify(r.body)).not.toContain('LG-BI-MAT')
}

describe('Code2 delta A: personalized BTVN preflight before consumption', () => {
  it.each(['12abc', 'sqrt(4)'])('mixed stage batch %s rejects before locking valid siblings; corrected retry and replay', async answer => {
    const s = await setup(), before = s.effects()
    rejected(await s.stage({ ...first, [Q]: answer }))
    expect(s.effects()).toEqual(before)
    expect((await s.stage(first)).body.ok).toBe(true)
    expect(s.d.dem('su_kien_hoc')).toBe(3)
    expect(s.d.dem('exp_so')).toBeGreaterThan(0)
    const after = s.effects()
    expect((await s.stage({ ...first, [Q]: 'sqrt(4)', 'OTHER-III-1': 'sqrt(4)' })).body.ok).toBe(true)
    expect(s.saved()).toEqual(first)
    expect(s.effects()).toEqual(after)
  })

  it.each(['/btvn/nop', '/goi'])('full personalized submission through %s rejects then accepts once', async path => {
    const s = await setup(), before = s.effects()
    rejected(await s.post(path, { ...full, [Q]: '12abc' }))
    expect(s.effects()).toEqual(before)
    expect((await s.post(path, full)).body).toMatchObject({ ok: true, soDung: 4, soCau: 4 })
    const after = s.effects()
    expect((await s.post(path, { ...full, [Q]: 'sqrt(4)' })).body).toMatchObject({ ok: true, daNhan: true })
    expect(s.effects()).toEqual(after)
  })

  it.each(['stage', 'full', 'bonus'])('invalid numeric material in %s rejects even with blank answer, repair preserves opportunity', async mode => {
    const s = await setup(), q = mode === 'bonus' ? BONUS : Q
    s.setKey(q, 'sqrt(4)')
    const send = () => mode === 'full' ? s.post('/btvn/nop', full) : s.stage(mode === 'bonus' ? { [BONUS]: '0.39' } : { [I]: 'A', [Q]: '' }, mode === 'bonus' ? 2 : 0)
    const before = s.effects()
    rejected(await send(), 500)
    expect(s.effects()).toEqual(before)
    s.setKey(q, '0.39')
    expect((await send()).body.ok).toBe(true)
  })

  it.each(['answer', 'key', 'bonus'])('last stage checks full finalization material (%s) before stage CAS/events', async kind => {
    const s = await setup()
    expect((await s.stage(first)).body.ok).toBe(true)
    if (kind === 'key') s.setKey(Q, 'sqrt(4)')
    else s.d.sql.prepare('UPDATE btvn_em SET dap_an_json=?').run(JSON.stringify({ ...first, [kind === 'bonus' ? BONUS : Q]: '12abc' }))
    const before = s.effects()
    rejected(await s.stage({ [R]: '0.39' }, 1), kind === 'key' ? 500 : 422)
    expect(s.effects()).toEqual(before)
    if (kind === 'key') s.setKey(Q, '0.39')
    else s.d.sql.prepare('UPDATE btvn_em SET dap_an_json=?').run(JSON.stringify(first))
    expect((await s.stage({ [R]: '0.39' }, 1)).body.nop).toMatchObject({ daNop: true, soDung: 4 })
    const after = s.effects()
    expect((await s.stage({ [R]: 'sqrt(4)' }, 1)).body.ok).toBe(true)
    expect(s.effects()).toEqual(after)
  })

  it('replayed earlier stage can trigger finalization when progress is already complete: preflight entire final input', async () => {
    const s = await setup()
    s.d.sql.prepare('UPDATE btvn_em SET lo_da_xong=2,dap_an_json=?').run(JSON.stringify({ ...first, [R]: '12abc' }))
    const before = s.effects()
    rejected(await s.stage(first))
    expect(s.effects()).toEqual(before)
  })

  it.each([false, true])('bonus malformed answer before/after final=%s never locks or changes score; retry awards once', async finalized => {
    const s = await setup()
    if (finalized) expect((await s.post('/btvn/nop', full)).body.ok).toBe(true)
    const before = s.effects()
    rejected(await s.stage({ [BONUS]: 'sqrt(4)' }, 2))
    expect(s.effects()).toEqual(before)
    expect((await s.stage({ [BONUS]: '0.39' }, 2)).body.ok).toBe(true)
    expect(s.saved()[BONUS]).toBe('0.39')
    if (finalized) expect(s.row()).toMatchObject({ so_dung: 5, so_cau: 5 })
    const after = s.effects()
    expect((await s.stage({ [BONUS]: '12abc' }, 2)).body.ok).toBe(true)
    expect(s.effects()).toEqual(after)
  })

  it('valid wrong bonus keeps first-answer lock and gives no question event/reward', async () => {
    const s = await setup()
    expect((await s.post('/btvn/nop', full)).body.ok).toBe(true)
    expect((await s.stage({ [BONUS]: '99' }, 2)).body.ok).toBe(true)
    expect(s.saved()[BONUS]).toBe('99')
    expect(s.row()).toMatchObject({ so_dung: 4, so_cau: 4 })
    expect(s.d.dem('su_kien_hoc', `qid='${BONUS}'`)).toBe(0)
    expect(s.d.dem('exp_so', `qid='${BONUS}'`)).toBe(0)
  })

  it('blank/partial II stay unlocked, valid wrong numeric is still consumed as wrong', async () => {
    const s = await setup()
    expect((await s.stage({ [I]: 'A', [II]: 'D-S-', [Q]: '---' })).body).toMatchObject({ ok: true, loDaXong: 0 })
    expect(s.saved()).toEqual({ [I]: 'A' })
    expect((await s.stage({ [II]: 'DSDS', [Q]: '99' })).body.ok).toBe(true)
    expect(s.saved()[Q]).toBe('99')
    expect(s.d.sql.prepare('SELECT ket_qua FROM su_kien_hoc WHERE qid=?').get(Q)).toEqual({ ket_qua: 0 })
  })

  it('empty ordinary stage remains read-only status even with bad material; bonus deadline unchanged', async () => {
    const s = await setup()
    s.setKey(Q, 'sqrt(4)')
    const before = s.effects()
    expect((await s.stage({})).body.ok).toBe(true)
    expect(s.effects()).toEqual(before)
    vi.setSystemTime(new Date('2026-09-30T00:00:00Z'))
    expect((await s.stage({ [BONUS]: 'sqrt(4)' }, 2)).body).toMatchObject({ ok: false, lyDo: 'qua_han' })
    expect(s.effects()).toEqual(before)
  })

  it('no-new-answer branch checks saved malformed data before advancing progress', async () => {
    const s = await setup()
    s.d.sql.prepare('UPDATE btvn_em SET dap_an_json=?').run(JSON.stringify({ ...first, [Q]: '12abc' }))
    const before = s.effects()
    rejected(await s.stage(first))
    expect(s.effects()).toEqual(before)
  })

  it.each([
    ['0.39', '0,39', true],
    ['0.39', '0.39009', true],
    ['0.39', '0.3901', false],
    ['0.39 g', '0.39 kg', false],
  ] as const)('numeric policy keeps key=%s answer=%s correct=%s', async (key, answer, correct) => {
    const s = await setup()
    s.setKey(Q, key)
    const result = await s.stage({ ...first, [Q]: answer })
    expect(result.body.ok).toBe(true)
    expect(result.body.ketQua.find((x: { qid: string }) => x.qid === Q).dung).toBe(correct)
  })

  it.each([422, 500])('client preserves validation message from real HTTP %s response', async status => {
    const s = await setup(), before = s.effects()
    if (status === 500) s.setKey(Q, 'sqrt(4)')
    const answers = { ...first, [Q]: '12abc' }
    const response = await s.stage(answers)
    rejected(response, status)
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(response.body), { status: response.status })))
    const result = await nopChangBtvn({ ...MAC_DINH_MAY_CHU, URL: 'https://local' }, { maBtvn: maBtvn(s.d), sbd: 'S1', chiSo: 0, dapAn: answers })
    expect(result).toMatchObject({ ok: false, error: response.body.error, ketQua: [] })
    expect(answers[Q]).toBe('12abc')
    expect(s.effects()).toEqual(before)
  })

  it('full blank answer does not hide a broken numeric server key', async () => {
    const s = await setup()
    s.setKey(Q, 'sqrt(4)')
    const before = s.effects()
    rejected(await s.post('/btvn/nop', {}), 500)
    expect(s.effects()).toEqual(before)
  })

  it.each(['stage', 'last', 'bonus'])('CAS retry revalidates newly saved effective answers (%s)', async mode => {
    const s = await setup()
    if (mode === 'last') expect((await s.stage(first)).body.ok).toBe(true)
    const prepare = s.d.env.DB.prepare.bind(s.d.env.DB)
    let casCalls = 0
    let competingState: ReturnType<typeof s.effects> | undefined
    s.d.env.DB.prepare = (query: string) => {
      const stmt = prepare(query)
      if (query.startsWith('UPDATE btvn_em SET dap_an_json = ?') && query.includes('dap_an_json IS ?')) {
        const run = stmt.run.bind(stmt)
        stmt.run = async () => {
          casCalls++
          if (casCalls === 1) {
            // One competing accepted-state write; our command must perform no further mutation.
            const answers = mode === 'bonus' ? { [BONUS]: '12abc' } : { ...first, [Q]: '12abc' }
            s.d.sql.prepare('UPDATE btvn_em SET dap_an_json=?').run(JSON.stringify(answers))
            competingState = s.effects()
            return { success: true, results: [], meta: { changes: 0 } }
          }
          return run()
        }
      }
      return stmt
    }
    rejected(await s.stage(mode === 'bonus' ? { [BONUS]: '0.39' } : mode === 'last' ? { [R]: '0.39' } : first, mode === 'bonus' ? 2 : mode === 'last' ? 1 : 0))
    expect(casCalls).toBe(1)
    expect(s.effects()).toEqual(competingState)
  })

  it('unexpected database error remains generic HTTP 500 with no grading code or writes', async () => {
    const s = await setup(), before = s.effects()
    const prepare = s.d.env.DB.prepare.bind(s.d.env.DB)
    s.d.env.DB.prepare = (query: string) => {
      if (query === 'SELECT * FROM btvn_em WHERE khoa = ?') throw new Error('synthetic database failure')
      return prepare(query)
    }
    const result = await s.stage(first)
    expect(result.status).toBe(500)
    expect(result.body.ok).toBe(false)
    expect(result.body.ma).toBeUndefined()
    expect(s.effects()).toEqual(before)
  })

  it('full submit validates saved bonus but ignores new bonus/outside answers', async () => {
    const s = await setup()
    expect((await s.post('/btvn/nop', { ...full, [BONUS]: '12abc', 'OTHER-III-1': 'sqrt(4)' })).body).toMatchObject({ ok: true, soDung: 4 })
    const s2 = await setup()
    s2.d.sql.prepare('UPDATE btvn_em SET dap_an_json=?').run(JSON.stringify({ [BONUS]: '12abc' }))
    const before = s2.effects()
    rejected(await s2.post('/btvn/nop', full))
    expect(s2.effects()).toEqual(before)
  })
})
