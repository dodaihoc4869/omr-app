// @vitest-environment jsdom
// «XEM LẠI» TỨC THÌ (thầy 29/10 «Bấm vào để xem lại chưa tức thì»):
//   (1) xem-lai-sua.ts: câu vừa sửa XONG (đã khép) được nhớ ở máy trong ngày; không nhớ lần chưa khép (gợi ý) / thiếu lời giải; sang ngày mới ⇒ bỏ; tối đa 40 câu;
//   (2) màn mở câu đã khép hôm nay dựng THẲNG từ bộ nhớ: không gọi mo-dot / gon-mo; hiện kết quả + lời giải ngay;
//   (3) tab «Câu đã làm»: chi tiết (đề + đáp án + lời giải) đã tải được nhớ 3 phút ⇒ mở lại / bấm lại câu có ngay, không gọi máy chủ; hết hạn ⇒ tải mới.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

const api = vi.hoisted(() => ({ apiMoDot: vi.fn(), apiPhatItem: vi.fn(), apiNopItem: vi.fn(), apiXinGoiY: vi.fn(), apiCoChua: vi.fn(), apiGonMo: vi.fn(), apiGonNop: vi.fn() }))
vi.mock('../src/lib/chua-cau-sai-api', () => api)
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ URL: 'https://may.test' }), xongNapDiaChi: async () => {} }))
import Man, { napKhungDuo } from '../src/components/chua-cau-sai/ManChuaCauSai'
import { docXemLai, luuXemLai } from '../src/lib/xem-lai-sua'
import { taiChiTiet, xoaNhoChiTiet } from '../src/components/hoa2/api'

const DE = { qid: 'Q', phan: 'I', text: 'Thuỷ phân hoàn toàn 8,8 gam etyl axetat bằng dung dịch NaOH vừa đủ. Khối lượng muối thu được là', choices: ['8,2 gam.', '6,8 gam.', '9,6 gam.', '4,1 gam.'], ideas: [], hinhAnh: [], tenDang: 'Thuỷ phân ester' }
const CHI_TIET = { de: { ...DE, maDe: 'DH-12', mucDo: 'hieu', sao: 0 }, dapAn: 'A', loiGiai: { chot: 'Muối CH₃COONa là 8,2 gam.' } }
const KHEP = { ok: true, dotId: 'D1', lan: 1, ban: 'Q', dung: true, ket: 'xong_phan', lyDo: 'cung_ngay', chiTiet: CHI_TIET } as never
const SBD = '10044'
const dangNhap = () => localStorage.setItem('omr_student_portal_auth', JSON.stringify({ sbd: SBD, token: 't' }))
const NAY = Date.parse('2026-10-29T10:00:00+07:00')

beforeEach(() => { vi.clearAllMocks(); localStorage.clear(); dangNhap(); document.documentElement.dataset.trong = 'hs'; xoaNhoChiTiet() })
afterEach(() => { cleanup(); delete document.documentElement.dataset.trong; vi.useRealTimers() })

describe('xem-lai-sua.ts', () => {
  it('nhớ câu đã khép (kèm lời giải) trong ngày; trả đúng bản như máy chủ trả (daKhepHomNay)', () => {
    luuXemLai(SBD, 'Q', KHEP, NAY)
    const x = docXemLai(SBD, 'Q', NAY + 3600_000)
    expect(x).toMatchObject({ ok: true, dotId: 'D1', ket: 'xong_phan', daKhepHomNay: true })
    expect(x!.chiTiet).toEqual(CHI_TIET)
    expect(docXemLai(SBD, 'Q2', NAY)).toBeNull()
    expect(docXemLai('khac', 'Q', NAY)).toBeNull() // theo em
  })
  it('không nhớ: lần chưa khép (gợi ý) / thiếu lời giải / lỗi; sang ngày mới thì bỏ', () => {
    luuXemLai(SBD, 'A', { ...(KHEP as object), ket: 'goi_y' } as never, NAY)
    luuXemLai(SBD, 'B', { ok: true, dotId: 'D', ket: 'tu_sua' } as never, NAY)
    luuXemLai(SBD, 'C', { ok: false } as never, NAY)
    expect(['A', 'B', 'C'].map((q) => docXemLai(SBD, q, NAY))).toEqual([null, null, null])
    luuXemLai(SBD, 'Q', KHEP, NAY)
    expect(docXemLai(SBD, 'Q', Date.parse('2026-10-30T00:30:00+07:00'))).toBeNull() // ngày VN khác
  })
  it('tối đa 40 câu (bỏ câu cũ nhất); ghi lại cùng câu thì thay bản cũ', () => {
    for (let i = 0; i < 45; i++) luuXemLai(SBD, `Q${i}`, { ...(KHEP as object), dotId: `D${i}` } as never, NAY)
    expect(docXemLai(SBD, 'Q0', NAY)).toBeNull()
    expect(docXemLai(SBD, 'Q44', NAY)).toMatchObject({ dotId: 'D44' })
    luuXemLai(SBD, 'Q44', { ...(KHEP as object), dotId: 'DMOI' } as never, NAY)
    expect(docXemLai(SBD, 'Q44', NAY)).toMatchObject({ dotId: 'DMOI' })
  })
  it('bộ nhớ hỏng / không ghi được ⇒ bỏ qua, không ném', () => {
    localStorage.setItem(`omr_xem_lai_sua_${SBD}`, '{hỏng')
    expect(docXemLai(SBD, 'Q', NAY)).toBeNull()
    const gan = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('đầy') })
    expect(() => luuXemLai(SBD, 'Q', KHEP, NAY)).not.toThrow()
    gan.mockRestore()
  })
})

describe('màn mở câu đã khép hôm nay', () => {
  it('còn bản nhớ ⇒ dựng THẲNG kết quả + lời giải, KHÔNG gọi mo-dot / gon-mo', async () => {
    luuXemLai(SBD, 'Q', KHEP, Date.now())
    await napKhungDuo() // như lúc rảnh ở danh sách Tự sửa lỗi (ManTuChua): khung Duo đã nạp trước
    const { container } = render(<Man token="t" qid="Q" onVe={() => {}} />)
    expect(container.textContent).not.toContain('Đang mở câu') // lần vẽ ĐẦU TIÊN đã có kết quả
    expect(await screen.findByRole('heading', { name: 'Đúng rồi · xong phần hôm nay' }, { timeout: 8000 })).toBeTruthy()
    expect(api.apiMoDot).not.toHaveBeenCalled()
    expect(api.apiGonMo).not.toHaveBeenCalled()
  })
  it('không có bản nhớ ⇒ mở như cũ (mo-dot)', async () => {
    api.apiMoDot.mockResolvedValue({ ok: true, dotId: 'D1', gon: { ok: true, dotId: 'D1', lan: 1, ban: 'Q', de: DE } })
    render(<Man token="t" qid="Q" onVe={() => {}} />)
    await screen.findByRole('button', { name: 'Kiểm tra' }, { timeout: 8000 })
    expect(api.apiMoDot).toHaveBeenCalledOnce()
  })
})

describe('tab «Câu đã làm»: chi tiết được nhớ', () => {
  const ct = (q: string) => ({ de: { ...DE, qid: q }, dapAn: 'A', loiGiai: 'x' })
  const may = (qids: string[]) => {
    vi.stubGlobal('fetch', vi.fn(async (_u: string, init: { body: string }) => {
      const b = JSON.parse(init.body) as { qid?: string; qids?: string[] }
      const ds = b.qids ?? (b.qid ? [b.qid] : [])
      expect(ds.every((q) => qids.includes(q))).toBe(true)
      return { ok: true, status: 200, json: async () => ({ ok: true, cau: ds.map(ct) }) }
    }))
    return vi.mocked(globalThis.fetch)
  }
  it('lần hai cùng câu ⇒ không gọi máy chủ; câu mới ⇒ chỉ hỏi câu thiếu; quá 3 phút ⇒ tải mới', async () => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NAY)
    const f = may(['a', 'b', 'c'])
    expect((await taiChiTiet('tk', ['a', 'b'])).map((x) => x.de.qid).sort()).toEqual(['a', 'b'])
    const goi1 = f.mock.calls.length
    expect(goi1).toBeGreaterThan(0)
    expect((await taiChiTiet('tk', ['a', 'b'])).length).toBe(2)
    expect(f.mock.calls.length).toBe(goi1) // lần hai: có ngay, 0 lệnh
    const tienDo = vi.fn()
    expect((await taiChiTiet('tk', ['a', 'c'], tienDo)).map((x) => x.de.qid).sort()).toEqual(['a', 'c'])
    expect(f.mock.calls.length).toBe(goi1 + 1) // chỉ hỏi câu thiếu (c)
    expect(JSON.parse((f.mock.calls.at(-1)![1] as { body: string }).body)).toMatchObject({ qid: 'c' })
    expect(tienDo).toHaveBeenLastCalledWith(2, 2)
    vi.setSystemTime(NAY + 3 * 60_000 + 1000)
    await taiChiTiet('tk', ['a', 'b'])
    expect(f.mock.calls.length).toBeGreaterThan(goi1 + 1) // hết hạn ⇒ tải mới
    expect((await taiChiTiet('tk-khac', ['a'])).length).toBe(1) // theo token: em khác không dùng bản của em này
  })
})
