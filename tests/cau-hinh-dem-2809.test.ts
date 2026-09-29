// Tối ưu máy chủ 28/09 (việc 2): đệm cờ `cau_hinh` trong isolate ≤ 15 s, xoá khi ghi cờ; lỗi đọc không đệm.
import { describe, it, expect } from 'vitest'
import { docCauHinhDem, xoaDemCauHinh, gan, DEM_CO_MS } from '../server/src/cau-hinh-dem'
import { docCoHoa2, cheDo2 } from '../server/src/srs2-d1'

function dbDem(giaTri: Record<string, string>, hong = { bat: false }) {
  const dem = { n: 0 }
  const db: any = {
    prepare(sql: string) {
      let args: unknown[] = []
      const st: any = {
        bind: (...a: unknown[]) => { args = a; return st },
        first: async () => {
          dem.n++
          if (hong.bat) throw new Error('D1 hỏng')
          if (/FROM cau_hinh/.test(sql)) { const v = giaTri[String(args[0])]; return v === undefined ? null : { gia_tri: v } }
          if (/FROM hoc_sinh/.test(sql)) return { lop: '12A' }
          return null
        },
      }
      return st
    },
  }
  return { env: { DB: db } as any, dem }
}

describe('đệm cờ cau_hinh', () => {
  it('5 lần đọc cờ Game Hóa 2.0 (Sảnh/start/Đoàn/Bi-a trong một request) ⇒ 1 truy vấn (trước: 5)', async () => {
    const { env, dem } = dbDem({ game_hoa_2: JSON.stringify({ bat: true }) })
    for (let i = 0; i < 5; i++) expect((await docCoHoa2(env)).bat).toBe(true)
    expect(await cheDo2(env, '1')).toBe(true)
    expect(dem.n).toBe(1)
  })
  it('lượt đọc song song dùng chung một truy vấn', async () => {
    const { env, dem } = dbDem({ k: 'a' })
    const kq = await Promise.all([1, 2, 3].map(() => docCauHinhDem(env, 'k')))
    expect(kq).toEqual(['a', 'a', 'a'])
    expect(dem.n).toBe(1)
  })
  it('hết hạn 15 s (≤ 30 s) ⇒ đọc lại; xoá đệm khi ghi ⇒ đọc lại ngay', async () => {
    const gt: Record<string, string> = { k: 'a' }
    const { env, dem } = dbDem(gt)
    expect(DEM_CO_MS).toBeLessThanOrEqual(30_000)
    await docCauHinhDem(env, 'k', 1000)
    gt.k = 'b'
    expect(await docCauHinhDem(env, 'k', 1000 + DEM_CO_MS - 1)).toBe('a')
    expect(await docCauHinhDem(env, 'k', 1000 + DEM_CO_MS)).toBe('b')
    gt.k = 'c'
    xoaDemCauHinh(env, 'k')
    expect(await docCauHinhDem(env, 'k', 1000 + DEM_CO_MS)).toBe('c')
    expect(dem.n).toBe(3)
  })
  it('lỗi đọc ⇒ null và KHÔNG đệm', async () => {
    const hong = { bat: true }
    const { env, dem } = dbDem({ k: 'a' }, hong)
    expect(await docCauHinhDem(env, 'k')).toBeNull()
    hong.bat = false
    expect(await docCauHinhDem(env, 'k')).toBe('a')
    expect(dem.n).toBe(2)
  })
  it('bản session withSession gắn D1 gốc ⇒ dùng chung đệm; D1 khác ⇒ không lẫn', async () => {
    const a = dbDem({ k: 'a' })
    const b = dbDem({ k: 'b' })
    const phien = gan({ ...a.env.DB }, a.env.DB)
    await docCauHinhDem(a.env, 'k')
    expect(await docCauHinhDem({ DB: phien } as any, 'k')).toBe('a')
    expect(await docCauHinhDem(b.env, 'k')).toBe('b')
    expect(a.dem.n).toBe(1)
  })
})
