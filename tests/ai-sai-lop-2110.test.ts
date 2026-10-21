// NÚT X "AI ĐÃ SAI?" HAI THẺ (thầy 21/10) — phía app thầy: lớp đang chiếu (em của lớp + em đã điểm danh) đi kèm lệnh `/gv/ai-sai-cau` và tin trả về tờ.
//   · `lopAiSaiToChieu`: sĩ số, số em có mặt, danh sách có mặt đã GIAO với lớp; chưa điểm danh ⇒ `coMat: null` (tờ báo rõ, không để trống); không biết lớp ⇒ null (tờ vẽ một thẻ);
//   · `aiSaiQuaMayChu(qids, sbdLop)`: gửi `sbds` để máy chủ lọc TRƯỚC khi cắt 300 lượt; máy chủ cũ (bỏ qua `sbds`) trả mọi em ⇒ app lọc lại; `mucLam` đi nguyên sang tờ;
//   · `traAiSai`: tin AI_SAI_TRA mang `lop` khi có.
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ URL: 'https://may-chu-gia.example.com' }) }))
vi.mock('../src/lib/exam-db', () => ({ loadTeacherSecret: async () => 'mat-gia' }))
const { aiSaiQuaMayChu, lopAiSaiToChieu, traAiSai } = await import('../src/components/chien-dich/ghi-to-chieu')
const { TIN_TO_CHIEU } = await import('../src/lib/to-chieu-cau-noi')

afterEach(() => vi.unstubAllGlobals())

describe('lopAiSaiToChieu', () => {
  it('giao danh sách có mặt với lớp; chưa điểm danh ⇒ coMat null; không biết lớp ⇒ null', () => {
    expect(lopAiSaiToChieu(null)).toBeNull()
    expect(lopAiSaiToChieu({ sbdLop: [], coMat: new Set(['A']) })).toBeNull()
    expect(lopAiSaiToChieu({ sbdLop: ['A', 'B', 'C'], coMat: new Set(['A', 'C', 'Z']) })).toEqual({ soLop: 3, soCoMat: 2, coMat: ['A', 'C'] }) // Z không thuộc lớp ⇒ bỏ
    expect(lopAiSaiToChieu({ sbdLop: ['A', 'B'], coMat: null })).toEqual({ soLop: 2, soCoMat: null, coMat: null })
    expect(lopAiSaiToChieu({ sbdLop: ['A', 'A', 'B'], coMat: new Set() })).toEqual({ soLop: 2, soCoMat: 0, coMat: [] })
  })
})

describe('aiSaiQuaMayChu', () => {
  const luot = (sbd: string, extra: Record<string, unknown> = {}) => ({ sbd, ten: `Em ${sbd}`, luc: '2026-10-26T11:48:00Z', noi: 'BTVN', giay: 9, ...extra })
  const dungFetch = (ds: unknown[]) => {
    const goi: { url: string; body: Record<string, unknown> }[] = []
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      goi.push({ url, body: JSON.parse(String(init?.body ?? '{}')) })
      return new Response(JSON.stringify({ ok: true, ds, conNua: false }), { status: 200, headers: { 'content-type': 'application/json' } })
    }))
    return goi
  }
  it('có danh sách lớp ⇒ gửi `sbds`; máy chủ cũ trả mọi em ⇒ app lọc lại theo lớp; mucLam đi nguyên', async () => {
    const goi = dungFetch([luot('A', { mucLam: { ma: 1, giay: 9, giayDoc: 24, sanNghi: 6, ranh2: 24, ranh3: 30 } }), luot('X')])
    const r = await aiSaiQuaMayChu(['Q1'], ['A', 'B'])
    expect(goi[0]!.url).toBe('https://may-chu-gia.example.com/gv/ai-sai-cau')
    expect(goi[0]!.body).toEqual({ qids: ['Q1'], sbds: ['A', 'B'] })
    expect(r.ok && r.ds.map((x) => x.sbd)).toEqual(['A'])
    expect(r.ok && r.ds[0]!.mucLam).toMatchObject({ ma: 1, ranh3: 30 })
  })
  it('không có danh sách lớp ⇒ không gửi `sbds`, không lọc', async () => {
    const goi = dungFetch([luot('A'), luot('X')])
    const r = await aiSaiQuaMayChu(['Q1'])
    expect(goi[0]!.body).toEqual({ qids: ['Q1'] })
    expect(r.ok && r.ds).toHaveLength(2)
  })
})

describe('traAiSai', () => {
  it('tin AI_SAI_TRA mang `lop` khi có; lỗi thì chỉ `loi`', () => {
    const gui: Record<string, unknown>[] = []
    const cuaSo = { postMessage: (m: Record<string, unknown>) => void gui.push(m) } as unknown as Window
    traAiSai(cuaSo, '*', 'M', 'id1', { ok: true, ds: [], conNua: false }, { soLop: 34, soCoMat: 28, coMat: ['A'] })
    traAiSai(cuaSo, '*', 'M', 'id2', { ok: true, ds: [], conNua: true })
    traAiSai(cuaSo, '*', 'M', 'id3', { ok: false, chu: 'Mất mạng' }, { soLop: 1, soCoMat: null, coMat: null })
    expect(gui[0]).toMatchObject({ type: TIN_TO_CHIEU.AI_SAI_TRA, id: 'id1', lop: { soLop: 34, soCoMat: 28, coMat: ['A'] } })
    expect(gui[1]).not.toHaveProperty('lop')
    expect(gui[2]).toEqual({ type: TIN_TO_CHIEU.AI_SAI_TRA, maPhien: 'M', id: 'id3', loi: 'Mất mạng' })
  })
})
