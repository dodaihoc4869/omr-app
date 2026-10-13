// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { docKeyBankDem, ghiKeyBank } from '../server/src/dem-ca-thi'
import { capNhatKeyBank } from '../server/src/goi-cu'
import type { Env } from '../server/src/kieu'

function cho() { let mo!: () => void; const p = new Promise<void>(r => { mo = r }); return { p, mo } }
function kho() {
  const ds = new Map([['key/C1.json', 'cu'], ['key/C2.json', 'khac']])
  const daDoc = cho(), daGhi = cho()
  let chanDoc: ReturnType<typeof cho> | undefined, chanGhi: ReturnType<typeof cho> | undefined
  let chanCa = 'C1', soDoc = 0, soGhi = 0, loiGhi = false
  const env = { DE: {
    get: async (k: string, o?: { onlyIf: { etagDoesNotMatch: string } }) => {
      const phien = ds.get(k)
      soDoc++; daDoc.mo()
      if (chanDoc && k === `key/${chanCa}.json`) { const c = chanDoc; chanDoc = undefined; await c.p }
      if (!phien) return null
      if (o?.onlyIf.etagDoesNotMatch === phien) return { etag: phien }
      return { etag: phien, body: new Response(JSON.stringify({ phien })).body }
    },
    put: async (k: string, than: string) => { soGhi++; daGhi.mo(); if (chanGhi) await chanGhi.p; if (loiGhi) throw new Error('R2 chưa ghi được'); ds.set(k, JSON.parse(than).phien) },
  } } as unknown as Env
  return { env, daDoc, daGhi, soDoc: () => soDoc, soGhi: () => soGhi, chanDoc: (ca = 'C1') => { chanCa = ca; return chanDoc = cho() }, boChanDoc: () => { chanDoc = undefined }, chanGhi: () => chanGhi = cho(), lamLoiGhi: () => { loiGhi = true } }
}
const phien = async (env: Env, ca = 'C1') => ((await docKeyBankDem(env, ca)).giaTri as { phien: string }).phien

describe('đệm tờ đáp án khi nguồn được cập nhật', () => {
  it('lượt sau ghi nhận bản mới; lượt cũ về trễ không đè lại bản mới', async () => {
    const k = kho(), chan = k.chanDoc()
    const cu = phien(k.env)
    await k.daDoc.p
    await ghiKeyBank(k.env, 'C1', JSON.stringify({ phien: 'moi' }))
    k.boChanDoc()
    expect(await phien(k.env)).toBe('moi')
    chan.mo()
    expect(await cu).toBe('cu')
    expect(await phien(k.env)).toBe('moi')
    expect(k.soGhi()).toBe(1)
  })

  it('ghi một ca giữ lượt đọc đang bay của ca khác và vẫn gom các lượt lạnh', async () => {
    const k = kho(), chan = k.chanDoc('C2')
    const a = phien(k.env, 'C2')
    await k.daDoc.p
    await ghiKeyBank(k.env, 'C1', JSON.stringify({ phien: 'moi' }))
    const b = phien(k.env, 'C2')
    chan.mo()
    expect(await Promise.all([a, b])).toEqual(['khac', 'khac'])
    expect(k.soDoc()).toBe(1)
  })

  it('300 lượt lạnh cùng ca vẫn dùng đúng một lượt R2', async () => {
    const k = kho(), chan = k.chanDoc()
    const ds = Array.from({ length: 300 }, () => phien(k.env))
    chan.mo()
    expect((await Promise.all(ds)).every(x => x === 'cu')).toBe(true)
    expect(k.soDoc()).toBe(1)
  })

  it('lượt đọc chen khi ghi chưa xong không nằm trong đệm sau khi ghi', async () => {
    const k = kho(), chan = k.chanGhi()
    const ghi = ghiKeyBank(k.env, 'C1', JSON.stringify({ phien: 'moi' }))
    await k.daGhi.p
    expect(await phien(k.env)).toBe('cu')
    chan.mo()
    await ghi
    expect(await phien(k.env)).toBe('moi')
  })

  it('ghi lỗi vẫn cho lượt sau đọc nguồn còn nguyên; không giả thành đã ghi', async () => {
    const k = kho()
    expect(await phien(k.env)).toBe('cu')
    k.lamLoiGhi()
    await expect(ghiKeyBank(k.env, 'C1', JSON.stringify({ phien: 'moi' }))).rejects.toThrow('R2 chưa ghi được')
    expect(await phien(k.env)).toBe('cu')
  })

  it('đường capNhatKeyBank thật cũng bỏ lượt lạnh trước khi ghi nguồn mới', async () => {
    const k = kho(), chan = k.chanDoc()
    const cu = phien(k.env)
    await k.daDoc.p
    const st = { bind: () => st, first: async () => null }
    const env = { ...k.env, DB: { prepare: () => st } } as unknown as Env
    expect(await capNhatKeyBank(env, { maCa: 'C1', keyBank: { phien: 'moi', phanI: [], phanII: [], phanIII: [] } })).toMatchObject({ ok: true })
    expect(await phien(k.env)).toBe('moi')
    chan.mo()
    expect(await cu).toBe('cu')
    expect(await phien(k.env)).toBe('moi')
  })
})
