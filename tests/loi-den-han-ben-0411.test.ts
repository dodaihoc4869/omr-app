// RÚT ĐỀ RIÊNG KHÔNG RƠI VỀ CÁCH CŨ VÌ MỘT LÔ LỖI (thầy 04/11: «Liên tục báo ko rút đc kiểu mới chỉ rút đc kiểu cũ», «rút cực lâu khi thầy bấm bắt đầu»).
// Gốc lỗi: `loiDenHanTheoEm` đọc hồ sơ lỗi theo lô 20 em, MỘT lô lỗi (D1 nghẽn giờ cao điểm, hết giờ, HTTP 5xx) ⇒ ném cả lượt ⇒ màn Theo dõi báo «Chưa rút
// được theo cách mới … app rút theo cách cũ» và đi đường cũ (đọc lại cả lớp, chậm hơn). Nay lô lỗi ⇒ chia đôi thử lại; vẫn lỗi ⇒ chỉ em của lô ấy vào `hong`.
import { beforeEach, describe, expect, it, vi } from 'vitest'

const fetchCoHan = vi.hoisted(() => vi.fn())
vi.mock('../src/lib/fetch-co-han', async (goc) => ({ ...(await goc<Record<string, unknown>>()), fetchCoHan }))
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu.test' }))

const { loiDenHanTheoEm, LoiChuaCoLenhRut, LO_EM_LOI_DEN_HAN } = await import('../src/lib/ca-em-thay-api')

const ds = Array.from({ length: 25 }, (_, i) => `S${String(i + 1).padStart(2, '0')}`)
const traOk = (sbd: string[]) => new Response(JSON.stringify({ ok: true, em: Object.fromEntries(sbd.map((s) => [s, [{ qid: `q-${s}`, denHan: '2026-11-04', trangThai: 'sai' }]])), daGap: {}, hong: [] }), { status: 200 })
const sbdCua = (init: { body: string }) => (JSON.parse(init.body) as { sbd: string[] }).sbd

// Thân khối (không trả giá trị): `mockReset()` trả lại chính hàm giả — trả nó ra thì vitest coi là hàm dọn và gọi lại không đối số.
beforeEach(() => { fetchCoHan.mockReset() })

describe('loiDenHanTheoEm bền', () => {
  it('chia lô nhỏ (≤ 10 em mỗi lượt) — đủ hồ sơ mọi em', async () => {
    fetchCoHan.mockImplementation(async (_u: string, init: { body: string }) => traOk(sbdCua(init)))
    const r = await loiDenHanTheoEm('u', 'm', ds, '2026-11-04')
    expect(Object.keys(r.em).sort()).toEqual(ds)
    expect(r.hong).toEqual([])
    for (const c of fetchCoHan.mock.calls) expect(sbdCua(c[1]).length).toBeLessThanOrEqual(LO_EM_LOI_DEN_HAN)
  })

  it('MỘT lô lỗi 503 rồi chia đôi thử lại được ⇒ không ném, đủ hồ sơ', async () => {
    let lan = 0
    fetchCoHan.mockImplementation(async (_u: string, init: { body: string }) => {
      const s = sbdCua(init)
      if (s.includes('S01') && s.length === LO_EM_LOI_DEN_HAN && lan++ === 0) return new Response('busy', { status: 503 })
      return traOk(s)
    })
    const r = await loiDenHanTheoEm('u', 'm', ds, '2026-11-04')
    expect(Object.keys(r.em).sort()).toEqual(ds)
    expect(r.hong).toEqual([])
  })

  it('một em đọc mãi không được ⇒ chỉ em đó vào `hong`, các em khác vẫn đủ (không rơi về cách cũ)', async () => {
    fetchCoHan.mockImplementation(async (_u: string, init: { body: string }) => {
      const s = sbdCua(init)
      if (s.includes('S07')) return new Response('timeout', { status: 500 })
      return traOk(s)
    })
    const r = await loiDenHanTheoEm('u', 'm', ds, '2026-11-04')
    expect(r.hong).toContain('S07')
    expect(Object.keys(r.em)).toHaveLength(ds.length - r.hong.length)
    expect(r.hong.length).toBeLessThan(LO_EM_LOI_DEN_HAN)
  })

  it('lỗi mạng (fetch ném) ở một lô cũng không ném cả lượt', async () => {
    fetchCoHan.mockImplementation(async (_u: string, init: { body: string }) => {
      const s = sbdCua(init)
      if (s.includes('S21')) throw new Error('Hết giờ chờ máy chủ')
      return traOk(s)
    })
    const r = await loiDenHanTheoEm('u', 'm', ds, '2026-11-04')
    expect(r.hong).toContain('S21')
    expect(r.em['S01']).toBeTruthy()
  })

  it('máy chủ chưa có lệnh (404) ⇒ vẫn ném (chỗ gọi đi đường cũ)', async () => {
    fetchCoHan.mockImplementation(async () => new Response('', { status: 404 }))
    await expect(loiDenHanTheoEm('u', 'm', ds, '2026-11-04')).rejects.toBeInstanceOf(LoiChuaCoLenhRut)
  })

  it('MỌI lô đều hỏng ⇒ ném (không đọc được hồ sơ em nào)', async () => {
    fetchCoHan.mockImplementation(async () => new Response('x', { status: 500 }))
    await expect(loiDenHanTheoEm('u', 'm', ds, '2026-11-04')).rejects.toThrow(/HTTP 500/)
  })
})
