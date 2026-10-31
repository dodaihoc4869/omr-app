// @vitest-environment node
// GOM GHI «ĐANG TRỰC TUYẾN» (31/10): /presence có ctx ⇒ dồn hàng 3 giây, ghi cả hàng bằng MỘT câu; ý nghĩa bảng y hệt ghi từng lần.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { recordPresence } from '../server/src/teacher-news'
import { taoKhoOmni } from './omni-3-ke-hoach-chung'
import type { Env } from '../server/src/kieu'

beforeEach(() => { vi.useFakeTimers({ toFake: ['setTimeout'] }) })
afterEach(() => { vi.useRealTimers() })

describe('gom ghi presence', () => {
  it('nhiều phiên trong 3 giây ⇒ một câu ghi; cùng phiên ⇒ một dòng, first_seen giữ lần đầu trong ngày', async () => {
    const k = taoKhoOmni({}, 1)
    const env = k.env as Env
    const cau: string[] = []
    const g = env.DB as unknown as { prepare(q: string): unknown }
    const goc = g.prepare.bind(g)
    g.prepare = (q: string) => { if (/app_presence/.test(q)) cau.push(q); return goc(q) }
    const nen: Promise<unknown>[] = []
    const ctx = { waitUntil: (p: Promise<unknown>) => { nen.push(p) } }
    await recordPresence(env, { session: 'phien-mot-1234', role: 'hs' }) // ghi thẳng (không ctx) — lần đầu trong ngày
    const dau = (k.d.sql.prepare("SELECT first_seen FROM app_presence WHERE session_id='phien-mot-1234'").get() as { first_seen: string }).first_seen
    for (const s of ['phien-mot-1234', 'phien-hai-1234', 'phien-ba-12345', 'phien-hai-1234']) expect(await recordPresence(env, { session: s, role: 'hs' }, ctx)).toEqual({ ok: true })
    expect(await recordPresence(env, { session: 'x', role: 'hs' }, ctx)).toMatchObject({ ok: false })
    const n0 = cau.length
    await vi.advanceTimersByTimeAsync(3500)
    await Promise.all(nen)
    expect(cau.length - n0).toBe(1)
    const ds = k.d.sql.prepare("SELECT session_id, role, first_seen, last_seen FROM app_presence ORDER BY session_id").all() as { session_id: string; role: string; first_seen: string; last_seen: string }[]
    expect(ds.map((x) => x.session_id)).toEqual(['phien-ba-12345', 'phien-hai-1234', 'phien-mot-1234'])
    const mot = ds.find((x) => x.session_id === 'phien-mot-1234')!
    expect(mot.first_seen).toBe(dau)
    expect(mot.last_seen >= dau).toBe(true)
  })
})
