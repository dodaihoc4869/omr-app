// Release234f907 has no CNH ledger tables; snapshot all existing Mom effects. No CNH cutover in this release.
// @vitest-environment node
// Actual Worker/auth/Mom command + real SQL (node:sqlite), synthetic R2 fixture.
// Draft saves are allowed; final submission/events/EXP must remain unchanged on validation failure.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { gameToken } from '../server/src/game-v2-auth'
import { taoD1That } from './_d1-that'

const NOW = Date.parse('2026-09-24T04:00:00Z'), ID = 'M-code2', Q = 'SYN-III-1', I = 'SYN-I-1'
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW) })
afterEach(() => { vi.useRealTimers() })

async function setup(key = '12') {
  const d = taoD1That()
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Synthetic','12','mk','x')")
  const bankKey = 'synthetic/mom-code2.json'
  const questions = [
    { id: I, phan: 'I', dapAn: 'B', _khoaXacMinh: 1, text: 'Synthetic I' },
    { id: Q, phan: 'III', dapAn: key, _khoaXacMinh: 1, text: 'Synthetic III', loiGiai: 'PRIVATE-SOLUTION' },
  ]
  d.objects.set(bankKey, questions)
  d.sql.prepare(`INSERT INTO mom_bai(sbd,id,title,created_at,question_count,bank_key,started_at,answers)
    VALUES(?,?,?,?,?,?,?,?)`).run('S1', ID, 'Synthetic', new Date(NOW - 2000).toISOString(), 2, bankKey, new Date(NOW - 1000).toISOString(), JSON.stringify({ [I]: 'A' }))
  d.sql.prepare('INSERT INTO game_v2_profile(sbd,json,created_at) VALUES(?,?,?)').run('S1', JSON.stringify({ pet: 'lua_phuong', choice: false, legacy: null, cap: 1, exp: 0, wallet: 0, earned: 0, tower: 1, mastery: [], arena: null, cutover: '2020-01-01T00:00:00Z' }), 'x')
  const token = await gameToken(d.env, 'S1')
  const post = async (answer: string | undefined, action = 'submit') => {
    const response = await worker.fetch(new Request(`https://local/mom/${action}`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token, id: ID, answers: { [I]: 'B', ...(answer === undefined ? {} : { [Q]: answer }) } }),
    }), d.env)
    return { status: response.status, body: await response.json() as Record<string, any> }
  }
  const row = () => d.sql.prepare('SELECT * FROM mom_bai WHERE sbd=? AND id=?').get('S1', ID)!
  const effects = () => Object.fromEntries(['su_kien_hoc', 'exp_so', 'manh_khien_so', 'game_v2_profile'].map(table => [table, d.chup(table)]))
  return { d, bankKey, questions, post, row, effects }
}

describe('Code2 M03: Mom submit numeric validation before final writes', () => {
  it.each(['12abc', 'sqrt(4)', '1/2'])('unsupported answer %s saves draft, rejects whole batch, then corrected retry succeeds once', async answer => {
    const { d, post, row, effects } = await setup()
    const before = effects(), startedAt = row().started_at
    const result = await post(answer)
    expect(result.status).toBe(422)
    expect(result.body).toMatchObject({ ok: false, ma: 'MOM_GRADING_INPUT_INVALID' })
    expect(result.body.item).toBeUndefined()
    expect(JSON.stringify(result.body)).not.toContain('PRIVATE-SOLUTION')
    expect(row()).toMatchObject({ started_at: startedAt, submitted_at: null, result: null })
    expect(JSON.parse(String(row().answers))).toEqual({ [I]: 'B', [Q]: answer })
    expect(effects()).toEqual(before)
    const accepted = await post('12')
    expect(accepted.status).toBe(200)
    expect(accepted.body.item).toMatchObject({ diem: 10, soCauDung: 2, trangThai: 'da_nop' })
    expect(d.dem('su_kien_hoc', "nguon='mom'")).toBe(2)
    const after = effects(), saved = row()
    const replay = await post('13')
    expect(replay.body.item.diem).toBe(10)
    expect(row()).toEqual(saved)
    expect(effects()).toEqual(after)
  })

  it.each(['12abc', 'sqrt(4)', ''])('invalid server key %s is a material error even for identical/blank answers, without final writes', async key => {
    const { d, bankKey, questions, post, row, effects } = await setup(key)
    const before = effects()
    for (const answer of [key, '12', '']) {
      const result = await post(answer)
      expect(result.status).toBe(500)
      expect(result.body).toMatchObject({ ok: false, ma: 'MOM_GRADING_MATERIAL_INVALID' })
      expect(row()).toMatchObject({ submitted_at: null, result: null })
      expect(JSON.parse(String(row().answers))).toEqual({ [I]: 'B', [Q]: answer })
      expect(effects()).toEqual(before)
    }
    // Synthetic bank repair demonstrates retry without clearing/recreating the learner's draft.
    d.objects.set(bankKey, questions.map(q => q.id === Q ? { ...q, dapAn: '12' } : q))
    expect((await post('12')).body.item.diem).toBe(10)
  })

  it('save accepts unsupported draft text without submitting or producing learning/EXP effects', async () => {
    const { post, row, effects } = await setup()
    const before = effects()
    expect((await post('sqrt(4)', 'save')).status).toBe(200)
    expect(JSON.parse(String(row().answers))[Q]).toBe('sqrt(4)')
    expect(row()).toMatchObject({ submitted_at: null, result: null })
    expect(effects()).toEqual(before)
  })

  it.each(['13', '', undefined])('valid wrong/blank %s preserves existing submission behavior', async answer => {
    const { d, post, row } = await setup()
    const result = await post(answer)
    expect(result.status).toBe(200)
    expect(result.body.item).toMatchObject({ diem: 5, soCauDung: 1, trangThai: 'da_nop' })
    expect(row().submitted_at).not.toBeNull()
    const event = d.sql.prepare('SELECT ket_qua FROM su_kien_hoc WHERE qid=?').get(Q)
    expect(event).toEqual({ ket_qua: answer === '13' ? 0 : null })
  })

  it('after timeout ignores new input and grades the valid saved draft', async () => {
    const { d, post, row } = await setup()
    const draft = { [I]: 'B', [Q]: '12' }
    d.sql.prepare('UPDATE mom_bai SET started_at=?,answers=?').run(new Date(NOW - 8_000_000).toISOString(), JSON.stringify(draft))
    const result = await post('12abc')
    expect(result.status).toBe(200)
    expect(result.body.item.diem).toBe(10)
    expect(JSON.parse(String(row().answers))).toEqual(draft)
  })

  it('after timeout unsupported saved draft is not consumed and new input cannot bypass the deadline', async () => {
    const { d, post, row, effects } = await setup()
    const draft = { [I]: 'B', [Q]: 'sqrt(4)' }
    d.sql.prepare('UPDATE mom_bai SET started_at=?,answers=?').run(new Date(NOW - 8_000_000).toISOString(), JSON.stringify(draft))
    const before = effects()
    expect((await post('12')).status).toBe(422)
    expect(row()).toMatchObject({ submitted_at: null, result: null })
    expect(JSON.parse(String(row().answers))).toEqual(draft)
    expect(effects()).toEqual(before)
  })

  it('unexpected storage failure remains a server error and does not replace the saved draft', async () => {
    const { d, post, row, effects } = await setup()
    const before = effects(), draft = row()
    d.env.DE.get = async () => { throw new Error('synthetic storage unavailable') }
    const result = await post('12')
    expect(result.status).toBe(500)
    expect(result.body.ma).toBeUndefined()
    expect(row()).toEqual(draft)
    expect(effects()).toEqual(before)
  })
})
