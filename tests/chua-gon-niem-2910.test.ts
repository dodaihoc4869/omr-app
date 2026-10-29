// @vitest-environment node
// KIỂM TRA CỦA SỬA CÂU TỨC THÌ BẰNG TEM NIÊM PHONG (thầy 29/10, video 09:47 «Bấm kiểm tra còn quá lâu. Phải tức thì luôn») — server/src/chua-gon-niem.ts.
// Khoá: gon-mo cấp `sk` mờ; gon-nop `luong: 1` + tem ⇒ dòng 1 (đúng / sai, gợi ý, đáp án + lời giải khi đúng / hết lần) đi KHI D1 TREO HẲN; dòng 2 khớp dòng 1 (bản lưu);
// sai lần 1 ⇒ `sk2` mở lần 2 tại máy em và dòng 1 của lần 2 là «lời giải»; tem hỏng / của đợt khác / hết hạn / không xin luồng ⇒ đường thường.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { taoD1That } from './_d1-that'
import { seedChua, Q } from './_chua-cau-sai-fixture'
import { moDot } from '../server/src/chua-cau-sai'
import { gonMo, gonNop } from '../server/src/chua-gon-lenh'
import { gonNopLuong } from '../server/src/chua-gon-niem'
import { HAN_NIEM_MS } from '../server/src/niem-phong'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { xoaMoiDem } from '../server/src/dem-chung'
import type { Env } from '../server/src/kieu'

const T = Date.parse('2026-10-07T03:00:00Z')
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T); xoaMoiDem(); xoaDemCaBaoVe() })
afterEach(() => { vi.useRealTimers(); xoaDemCaBaoVe() })

async function dung() {
  const d = taoD1That()
  const token = await seedChua(d.env)
  const dotId = (await (await moDot(d.env, { token, qid: Q })).json()).dotId as string
  return { ...d, token, dotId }
}
type D = Awaited<ReturnType<typeof dung>>
type Obj = Record<string, any>
const mo = async (d: D, env: Env = d.env): Promise<Obj> => ({ ...(await (await gonMo(env, { token: d.token, dotId: d.dotId, qid: Q })).json()) as Obj })
let n = 0
const nopThuong = async (d: D, mo: Obj, traLoi: string, khoa = `k${++n}`) => (await (await gonNop(d.env, { token: d.token, dotId: d.dotId, ban: mo.ban, traLoi, khoa, qid: Q })).json()) as Obj
/** Gọi gon-nop theo luồng; trả [dòng…] (hoặc null khi không đi luồng). */
async function nopLuong(d: D, m: Obj, traLoi: string, o: { sk?: string; khoa?: string; env?: Env } = {}): Promise<Obj[] | null> {
  const nen: Promise<unknown>[] = []
  const ctx = { waitUntil: (p: Promise<unknown>) => { nen.push(p) } }
  const b = { token: d.token, dotId: d.dotId, ban: m.ban, traLoi, khoa: o.khoa ?? `k${++n}`, qid: Q, luong: 1, sk: o.sk ?? m.sk }
  const res = await gonNopLuong(d.env, b, {}, async () => (await (await gonNop(o.env ?? d.env, b)).json()) as Obj, (r) => r, ctx)
  if (!res) return null
  const chu = await res.text()
  for (const p of nen) await p.catch(() => null)
  return chu.trim().split('\n').map((x) => JSON.parse(x) as Obj)
}

describe('gon-mo cấp tem', () => {
  it('có `sk` (chuỗi mờ), không lộ đáp án / lời giải; mở lại cho tem khác nhưng cùng bản', async () => {
    const d = await dung()
    const a = await mo(d), b = await mo(d)
    expect(typeof a.sk).toBe('string'); expect(a.sk.length).toBeGreaterThan(40)
    expect(a.sk).not.toBe(b.sk)
    expect(JSON.stringify(a)).not.toContain('"correct"'); expect(JSON.stringify(a)).not.toContain('loiGiai'); expect(JSON.stringify(a)).not.toContain('solution')
    expect(b.ban).toBe(a.ban)
  })
})

describe('gon-nop theo luồng + tem', () => {
  it('đúng lần 1: dòng 1 (tam) khớp dòng 2 (bản lưu) — cùng ket / lyDo / dung / lan, kèm đáp án + lời giải', async () => {
    const d = await dung()
    const m = await mo(d)
    const dong = (await nopLuong(d, m, '24'))!
    expect(dong.length).toBe(2)
    const [d1, d2] = dong as [Obj, Obj]
    expect(d1).toMatchObject({ ok: true, tam: true, dung: true, lan: 1, ban: m.ban, dotId: d.dotId })
    expect(d2.ok).toBe(true); expect(d2.tam).toBeUndefined()
    expect(d1.ket).toBe(d2.ket); expect(d1.dung).toBe(d2.dung); expect(d1.lan).toBe(d2.lan); expect(d1.lyDo).toBe(d2.lyDo); expect(d1.trangThai).toBe(d2.trangThai)
    expect(d1.ct.dapAn).toBe(d2.chiTiet.dapAn); expect(JSON.stringify(d1.ct.loiGiai)).toBe(JSON.stringify(d2.chiTiet.loiGiai))
    expect(d1.sk2).toBeUndefined()
  })
  it('sai lần 1: dòng 1 = gợi ý (KHÔNG đáp án / lời giải) + sk2; dòng 2 khớp; làm lần 2 bằng sk2 ⇒ dòng 1 «lời giải» có đáp án; lần 2 đúng ⇒ xong phần có gợi ý', async () => {
    const d = await dung()
    const m = await mo(d)
    const dong = (await nopLuong(d, m, '40'))!
    const [d1, d2] = dong as [Obj, Obj]
    expect(d1).toMatchObject({ ok: true, tam: true, dung: false, ket: 'goi_y', lan: 1 })
    expect(d2).toMatchObject({ ok: true, dung: false, ket: 'goi_y', lan: 1 })
    expect(d1.goiY).toBe(d2.goiY)
    expect(d1.ct).toBeUndefined(); expect(JSON.stringify(d1)).not.toContain('"24"')
    expect(typeof d1.sk2).toBe('string')
    // lần 2 (sai nữa) bằng sk2 ⇒ lời giải
    const l2 = (await nopLuong(d, m, '41', { sk: d1.sk2 }))!
    expect(l2[0]).toMatchObject({ tam: true, dung: false, ket: 'loi_giai', lan: 2 })
    expect(l2[0].ct.dapAn).toBe('24')
    expect(l2[1]).toMatchObject({ ok: true, ket: 'loi_giai', lan: 2 }); expect(l2[1].chiTiet.dapAn).toBe('24')
  })
  it('lần 2 đúng bằng sk2 ⇒ xong phần («co_goi_y»), không tính tự sửa', async () => {
    const d = await dung()
    const m = await mo(d)
    const [d1] = (await nopLuong(d, m, '40'))! as [Obj, Obj]
    const l2 = (await nopLuong(d, m, '24', { sk: d1.sk2 }))!
    expect(l2[0]).toMatchObject({ tam: true, dung: true, ket: 'xong_phan', lyDo: 'co_goi_y', lan: 2 })
    expect(l2[1]).toMatchObject({ ok: true, dung: true, ket: 'xong_phan', lyDo: 'co_goi_y', lan: 2 })
  })
  it('nộp lặp cùng khoá: dòng 2 trả đúng bản đã lưu (không tính hai lần)', async () => {
    const d = await dung()
    const m = await mo(d)
    await nopLuong(d, m, '40', { khoa: 'khoa-lap' })
    const lai = (await nopLuong(d, m, '40', { khoa: 'khoa-lap' }))!
    expect(lai[1]).toMatchObject({ ok: true, lan: 1, ket: 'goi_y' })
    expect(d.sql.prepare('SELECT COUNT(*) AS n FROM chua_gon_lan WHERE dot_id=?').get(d.dotId)).toMatchObject({ n: 1 })
  })
})

describe('dòng 1 không phụ thuộc D1', () => {
  it('D1 TREO HẲN ⇒ dòng 1 (đúng / sai) vẫn tới ngay', async () => {
    const d = await dung()
    const m = await mo(d)
    const mai = new Promise<never>(() => {})
    const st: Record<string, unknown> = { bind: () => st, first: () => mai, all: () => mai, run: () => mai, raw: () => mai }
    const treo = { prepare: () => st, batch: () => mai, exec: () => mai, withSession: () => treo }
    const envTreo = { ...d.env, DB: treo } as unknown as Env
    const b = { token: d.token, dotId: d.dotId, ban: m.ban, traLoi: '24', khoa: 'k-treo', qid: Q, luong: 1, sk: m.sk }
    const res = await Promise.race([gonNopLuong(envTreo, b, {}, async () => (await (await gonNop(envTreo, b)).json()) as Obj, (r) => r, { waitUntil: () => {} }), new Promise<'het'>((ok) => setTimeout(() => ok('het'), 1500))])
    expect(res).not.toBe('het'); expect(res).not.toBeNull()
    const doc = (res as Response).body!.getReader(); let dem = ''; const gm = new TextDecoder()
    const dong1 = await Promise.race([(async () => { for (;;) { const { value, done } = await doc.read(); if (value) dem += gm.decode(value, { stream: true }); const i = dem.indexOf('\n'); if (i >= 0) return JSON.parse(dem.slice(0, i)) as Obj; if (done) return null } })(), new Promise<'het'>((ok) => setTimeout(() => ok('het'), 1500))])
    expect(dong1).toMatchObject({ ok: true, tam: true, dung: true, ket: expect.stringMatching(/tu_sua|xong_phan/) })
    void doc.cancel().catch(() => {})
  })
})

describe('tem không dùng được ⇒ đường thường', () => {
  it('không xin luồng / thiếu tem / tem hỏng / tem của đợt khác / hết hạn 45 phút ⇒ null (nơi gọi chạy JSON thường)', async () => {
    const d = await dung()
    const m = await mo(d)
    const ctx = { waitUntil: () => {} }
    const goi = (o: Obj) => gonNopLuong(d.env, { token: d.token, dotId: d.dotId, ban: m.ban, traLoi: '24', khoa: 'k-x', qid: Q, luong: 1, sk: m.sk, ...o }, {}, async () => ({ ok: true }), (r) => r, ctx)
    expect(await goi({ luong: 0 })).toBeNull()
    expect(await goi({ sk: undefined })).toBeNull()
    expect(await goi({ sk: m.sk.slice(0, -3) + 'AAA' })).toBeNull()
    expect(await goi({ dotId: 'dot-khac' })).toBeNull() // tem gắn đợt
    expect(await goi({ ban: 'ban-khac' })).toBeNull() // tem gắn bản
    expect(await goi({ traLoi: '' })).toBeNull()
    expect(await goi({ khoa: '' })).toBeNull()
    expect(await goi({ token: 'sai.sai' })).toBeNull()
    expect(await gonNopLuong({ ...d.env, TAT_TAM_SOM: '1' } as unknown as Env, { token: d.token, dotId: d.dotId, ban: m.ban, traLoi: '24', khoa: 'k-y', qid: Q, luong: 1, sk: m.sk }, {}, async () => ({ ok: true }), (r) => r, ctx)).toBeNull()
    vi.setSystemTime(T + HAN_NIEM_MS + 5000)
    expect(await goi({})).toBeNull()
    vi.setSystemTime(T + 1000)
    expect(await goi({})).not.toBeNull() // chính tem ấy còn hạn
  })
  it('tem của HS khác ⇒ không dùng', async () => {
    const d = await dung()
    const m = await mo(d)
    const { gameToken } = await import('../server/src/game-v2-auth')
    const tokenKhac = await gameToken(d.env, 'HS2').catch(() => '')
    if (!tokenKhac) return
    const kq = await gonNopLuong(d.env, { token: tokenKhac, dotId: d.dotId, ban: m.ban, traLoi: '24', khoa: 'k-z', qid: Q, luong: 1, sk: m.sk }, {}, async () => ({ ok: true }), (r) => r, { waitUntil: () => {} })
    expect(kq).toBeNull()
  })
})
