// Ô TRA CỨU (màn Hôm nay) TÌM CẢ TRÊN MÁY CHỦ — lỗi thầy gặp 21/09: "tôi nhập sbd nhưng không tìm được học sinh nào để Enter". Ô cũ chỉ tìm trên danh sách lớp trên máy thầy ⇒ máy chưa nạp danh sách (hoặc danh sách cũ sau reset) ⇒ 0 gợi ý ⇒ Enter chết.
// Sửa: gọi `/gv/tim-em {q}` (trễ ~200 ms, bỏ lượt cũ), GỘP với danh sách trên máy (máy chủ ưu tiên; lỗi ⇒ rơi về máy, không báo đỏ); Enter KHÔNG BAO GIỜ chết.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import OTraCuu from '../src/components/hom-nay/OTraCuu'
import { gopKetQuaTim, laSbdGo, timEmMayChu } from '../src/lib/hom-nay-v2'

vi.mock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ URL: 'https://may.test' }) }))
vi.mock('../src/lib/exam-db', () => ({ loadTeacherSecret: async () => 'mat-thu' }))

type Tra = { status?: number; json?: unknown }
const goi = vi.fn()
function dungMayChu(timEm: (q: string) => Tra) {
  vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
    const duong = url.replace('https://may.test', '')
    const body = JSON.parse(String(init.body ?? '{}')) as Record<string, unknown>
    goi(duong, body)
    if (duong !== '/gv/tim-em') return { status: 404, ok: false, json: async () => ({}) }
    const r = timEm(String(body.q ?? ''))
    const status = r.status ?? 200
    return { status, ok: status < 400, json: async () => r.json }
  })
}

const dung = (ds: { sbd: string; hoTen: string; lop: string }[] = []) => {
  const onMoEm = vi.fn()
  const onMoCa = vi.fn()
  render(<OTraCuu ds={ds} onMoEm={onMoEm} onMoCa={onMoCa} />)
  return { onMoEm, onMoCa, o: screen.getByRole('combobox') as HTMLInputElement }
}
const EM74 = { sbd: '12074', hoTen: 'Vũ Đức Anh', lop: '12', tenLop: '12 - Lớp Thường' }

beforeEach(() => {
  goi.mockClear()
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('máy chủ trả em, danh sách trên máy RỖNG', () => {
  it('gõ SBD ⇒ sau ~200 ms hiện gợi ý (kèm tên lớp) ⇒ Enter mở ĐÚNG sbd', async () => {
    dungMayChu((q) => ({ json: { ok: true, ds: q === '12074' ? [EM74] : [] } }))
    const { onMoEm, o } = dung([])
    fireEvent.focus(o)
    fireEvent.change(o, { target: { value: ' 12074 ' } })
    const goiY = await screen.findByRole('option', { name: /Vũ Đức Anh/ })
    expect(goiY.textContent).toContain('12 - Lớp Thường · SBD 12074')
    expect(goi).toHaveBeenCalledWith('/gv/tim-em', { q: '12074' }) // chuỗi đã cắt khoảng trắng
    fireEvent.keyDown(o, { key: 'Enter' })
    expect(onMoEm).toHaveBeenCalledWith('12074')
    expect(o.value).toBe('')
  })

  it('Enter NGAY khi máy chủ chưa kịp trả (chưa có gợi ý) ⇒ hỏi thẳng đúng SBD và mở em, không chết', async () => {
    dungMayChu((q) => ({ json: { ok: true, ds: q === '12074' ? [EM74] : [] } }))
    const { onMoEm, o } = dung([])
    fireEvent.change(o, { target: { value: '12074' } })
    fireEvent.keyDown(o, { key: 'Enter' }) // trước mốc trễ 200 ms
    await waitFor(() => expect(onMoEm).toHaveBeenCalledWith('12074'))
  })

  it('máy chủ ưu tiên trước danh sách máy; trùng SBD chỉ một dòng và lấy tên lớp của máy chủ', async () => {
    dungMayChu(() => ({ json: { ok: true, ds: [{ sbd: '12121007', hoTen: 'Trần Thu Hà', lop: '12', tenLop: '12 - Tinh Hoa' }] } }))
    const { o } = dung([
      { sbd: '12121007', hoTen: 'Trần Thu Hà', lop: '12A1' },
      { sbd: '11111022', hoTen: 'Trần Thu Hải', lop: '11B1' },
    ])
    fireEvent.change(o, { target: { value: 'tran thu' } })
    await waitFor(() => expect(screen.getAllByRole('option')[0].textContent).toContain('12 - Tinh Hoa'))
    const dong = screen.getAllByRole('option').map((x) => x.textContent)
    expect(dong).toEqual(['HTrần Thu Hà12 - Tinh Hoa · SBD 12121007', 'HTrần Thu Hải11B1 · SBD 11111022'])
  })
})

describe('máy chủ LỖI hoặc chưa có lệnh ⇒ rơi về danh sách trên máy, không báo đỏ', () => {
  it.each([[500], [404]])('HTTP %i: vẫn ra gợi ý từ máy, Enter mở em, không có role=alert', async (status) => {
    dungMayChu(() => ({ status, json: { ok: false } }))
    const { onMoEm, o } = dung([{ sbd: '12121002', hoTen: 'Phạm Gia Bảo', lop: '12A1' }])
    fireEvent.change(o, { target: { value: 'gia bao' } })
    expect(screen.getAllByRole('option')).toHaveLength(1) // có NGAY, không đợi máy chủ
    await act(async () => {
      await new Promise((r) => setTimeout(r, 320))
    })
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getAllByRole('option')).toHaveLength(1)
    fireEvent.keyDown(o, { key: 'Enter' })
    expect(onMoEm).toHaveBeenCalledWith('12121002')
  })

  it('máy chủ lỗi + máy không có em ⇒ dòng thật "trong danh sách lớp trên máy này", và hiện gợi ý nạp danh sách', async () => {
    dungMayChu(() => ({ status: 500, json: {} }))
    const { o } = dung([])
    fireEvent.change(o, { target: { value: 'không ai' } })
    expect(await screen.findByText('Không tìm thấy “không ai” trong danh sách lớp trên máy này.')).toBeTruthy()
    expect(screen.getByText(/Chưa hỏi được máy chủ và chưa có danh sách lớp trên máy này/)).toBeTruthy()
  })
})

describe('Enter KHÔNG BAO GIỜ chết — em không tồn tại ⇒ dòng báo thật', () => {
  it('SBD không có ⇒ "Không thấy em nào có số báo danh 12074"; không mở gì', async () => {
    dungMayChu(() => ({ json: { ok: true, ds: [] } }))
    const { onMoEm, o } = dung([])
    fireEvent.focus(o)
    fireEvent.change(o, { target: { value: '12074' } })
    expect(await screen.findByText('Không thấy em nào có số báo danh 12074')).toBeTruthy()
    fireEvent.keyDown(o, { key: 'Enter' })
    expect(onMoEm).not.toHaveBeenCalled()
    expect(await screen.findByText('Không thấy em nào có số báo danh 12074')).toBeTruthy()
    // máy chủ ĐÃ trả lời ⇒ không còn câu "vào Học sinh để nạp danh sách"
    expect(screen.queryByText(/vào Học sinh để nạp danh sách/)).toBeNull()
  })

  it('chữ không có ⇒ "Không thấy em nào tên “…”"', async () => {
    dungMayChu(() => ({ json: { ok: true, ds: [] } }))
    const { o } = dung([])
    fireEvent.change(o, { target: { value: 'abc xyz' } })
    expect(await screen.findByText('Không thấy em nào tên “abc xyz”')).toBeTruthy()
  })

  it('chỉ toàn khoảng trắng ⇒ không hỏi máy chủ, không mở danh sách', async () => {
    dungMayChu(() => ({ json: { ok: true, ds: [] } }))
    const { o } = dung([])
    fireEvent.focus(o)
    fireEvent.change(o, { target: { value: '   ' } })
    await act(async () => {
      await new Promise((r) => setTimeout(r, 320))
    })
    expect(goi).not.toHaveBeenCalled()
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('mã ca 6 số vẫn mở CA (không bị ô tìm em nuốt)', () => {
    dungMayChu(() => ({ json: { ok: true, ds: [] } }))
    const { onMoCa, o } = dung([])
    fireEvent.change(o, { target: { value: '123456' } })
    fireEvent.keyDown(o, { key: 'Enter' })
    expect(onMoCa).toHaveBeenCalledWith('123456')
  })
})

describe('trễ ~200 ms và bỏ lượt cũ', () => {
  it('gõ liên tiếp trong 200 ms ⇒ chỉ MỘT lượt gọi, với chuỗi cuối', async () => {
    vi.useFakeTimers()
    dungMayChu(() => ({ json: { ok: true, ds: [] } }))
    const { o } = dung([])
    fireEvent.change(o, { target: { value: '1' } })
    await act(async () => void vi.advanceTimersByTime(120))
    fireEvent.change(o, { target: { value: '12' } })
    await act(async () => void vi.advanceTimersByTime(120))
    fireEvent.change(o, { target: { value: '1207' } })
    expect(goi).not.toHaveBeenCalled()
    await act(async () => void vi.advanceTimersByTime(250))
    expect(goi.mock.calls.map((c) => c[1])).toEqual([{ q: '1207' }])
  })

  it('lượt cũ về muộn KHÔNG đè kết quả của chuỗi mới', async () => {
    let mo: (v: Tra) => void = () => undefined
    vi.stubGlobal('fetch', async (_u: string, init: RequestInit) => {
      const q = String((JSON.parse(String(init.body)) as { q: string }).q)
      goi('/gv/tim-em', { q })
      if (q === 'aaa') return await new Promise<{ status: number; ok: boolean; json: () => Promise<unknown> }>((res) => (mo = (v) => res({ status: 200, ok: true, json: async () => v.json })))
      return { status: 200, ok: true, json: async () => ({ ok: true, ds: [{ sbd: '2', hoTen: 'Em Mới', lop: '12' }] }) }
    })
    const { o } = dung([])
    fireEvent.change(o, { target: { value: 'aaa' } })
    await waitFor(() => expect(goi).toHaveBeenCalledTimes(1)) // 'aaa' đang treo
    fireEvent.change(o, { target: { value: 'bbb' } })
    await screen.findByRole('option', { name: /Em Mới/ })
    await act(async () => mo({ json: { ok: true, ds: [{ sbd: '1', hoTen: 'Em Cũ', lop: '12' }] } }))
    expect(screen.queryByRole('option', { name: /Em Cũ/ })).toBeNull()
    expect(screen.getByRole('option', { name: /Em Mới/ })).toBeTruthy()
  })
})

describe('hàm lõi', () => {
  it('laSbdGo: toàn chữ số từ 4 số trở lên', () => {
    expect(laSbdGo('12074')).toBe(true)
    expect(laSbdGo(' 1207 ')).toBe(true)
    expect(laSbdGo('120')).toBe(false)
    expect(laSbdGo('12a74')).toBe(false)
    expect(laSbdGo('tran')).toBe(false)
  })

  it('gopKetQuaTim: máy chủ trước, không trùng SBD, tối đa 8, giữ tenLop', () => {
    const mayChu = [{ sbd: '1', hoTen: 'A', lop: '12', tenLop: '12 - Tinh Hoa' }]
    const tren = [
      { sbd: '1', hoTen: 'A', lop: '12A1' },
      ...Array.from({ length: 12 }, (_, i) => ({ sbd: String(10 + i), hoTen: `E${i}`, lop: '11' })),
    ]
    const r = gopKetQuaTim(mayChu, tren)
    expect(r).toHaveLength(8)
    expect(r[0]).toEqual({ sbd: '1', hoTen: 'A', lop: '12', tenLop: '12 - Tinh Hoa' })
    expect(new Set(r.map((e) => e.sbd)).size).toBe(8)
  })

  it('timEmMayChu: thân trả sai dạng ⇒ ok:false; bỏ dòng không có sbd; cắt ≤ 10', async () => {
    dungMayChu(() => ({ json: { ok: true } }))
    expect((await timEmMayChu('12074')).ok).toBe(false)
    vi.unstubAllGlobals()
    dungMayChu(() => ({ json: { ok: true, ds: [{ hoTen: 'Không SBD' }, ...Array.from({ length: 14 }, (_, i) => ({ sbd: `S${i}`, hoTen: `E${i}`, lop: '12' }))] } }))
    const r = await timEmMayChu('S')
    expect(r.ok && r.du.length).toBe(10)
    expect(r.ok && r.du.every((e) => e.sbd)).toBe(true)
  })
})
