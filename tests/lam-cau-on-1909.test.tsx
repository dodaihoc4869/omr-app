// VIỆC C · C11 — màn LÀM CÂU ÔN (việc on_lai): lấy đề /hs/cau-theo-qid → làm → /hs/on-lai/nop → lời giải.
// Luật máy chủ mà giao diện phải giữ: đáp án chỉ về SAU nộp; câu CHƯA TRẢ LỜI chưa được tính (không phải sai) và vẫn làm tiếp được;
// nộp lại giữ kết quả LẦN ĐẦU; token bắt buộc; ≤ 20 câu.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import LamCauOn, { daTraLoi } from '../src/components/bang-nhiem-vu/LamCauOn'
import { nopOnLai, taiCauTheoQid } from '../src/components/bang-nhiem-vu/cau-on-api'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))

const CAU = [
  { qid: 'on1', phan: 'I', text: 'Este X có tên gọi là gì?', choices: ['etyl axetat', 'metyl propionat', 'propyl fomat', 'isopropyl fomat'], ideas: [], hinhAnh: [], tenDang: 'Danh pháp este' },
  { qid: 'on2', phan: 'II', text: 'Xét đúng sai từng ý:', choices: [], ideas: ['ý một', 'ý hai', 'ý ba', 'ý bốn'], hinhAnh: [] },
  { qid: 'on3', phan: 'III', text: 'Tính V (ml).', choices: [], ideas: [], hinhAnh: [] },
  { qid: 'on4', phan: 'I', text: 'Chất nào là chất béo?', choices: ['Glixerol', 'Etyl axetat', 'Tristearin', 'Axit oleic'], ideas: [], hinhAnh: [] },
]
const KQ1 = { qid: 'on1', dung: false, dapAnDung: 'A', loiGiai: { chot: 'Gốc ancol là etyl nên este là etyl axetat.', tung_pa: { A: { dung: true, vi_sao: 'Đúng gốc.' }, B: { dung: false, vi_sao: 'Sai gốc.' } } }, anhLoiGiai: [] }
const KQ2 = { qid: 'on2', dung: true, dapAnDung: 'DSDS', loiGiai: { chot: 'Chất béo là trieste.', tung_y: { a: { dung: true, vi_sao: 'Đúng.' }, b: { dung: false, vi_sao: 'Không tan.' } } }, anhLoiGiai: [] }
const KQ3 = { qid: 'on3', dung: true, dapAnDung: '125', loiGiai: { chot: 'n = 0,125 mol.', buoc: ['V = 125 ml.'] }, anhLoiGiai: [] }
const KQ4 = { qid: 'on4', dung: true, dapAnDung: 'C', loiGiai: { chot: 'Chất béo là trieste của glixerol.' }, anhLoiGiai: [] }

type Goi = { url: string; body: any }
let goi: Goi[]
let traCau: () => any
let traNop: (body: any) => any

beforeEach(() => {
  goi = []
  localStorage.clear()
  traCau = () => ({ ok: true, cau: CAU, khongCo: [] })
  traNop = () => ({ ok: true, ketQua: [], khongCo: [], chuaLam: [], tienBo: null, exp: 0 })
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit) => {
      const u = new URL(String(url)).pathname
      const body = JSON.parse(String(init.body || '{}'))
      goi.push({ url: u, body })
      const d = u === '/hs/cau-theo-qid' ? traCau() : u === '/hs/on-lai/nop' ? traNop(body) : {}
      return { ok: true, status: 200, json: async () => d }
    }),
  )
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const dung = (extra: Partial<React.ComponentProps<typeof LamCauOn>> = {}) => {
  const onXong = vi.fn()
  const r = render(<LamCauOn token="tok-hs" sbd="12121212" viecId="on_lai:2026-09-19" qid={['on1', 'on2', 'on3', 'on4']} tieuDe="Ôn 4 câu đã tới hạn nhắc lại" onXong={onXong} {...extra} />)
  return { onXong, ...r }
}
const the = (i: number) => document.querySelectorAll<HTMLElement>('.lco-the')[i]
const chonI = (i: number, k: number) => fireEvent.click(within(the(i)).getAllByRole('radio')[k])
const chonY = (i: number, y: number, v: 'Đúng' | 'Sai') => fireEvent.click(within(document.querySelectorAll<HTMLElement>('.lco-the')[i].querySelectorAll<HTMLElement>('.lco-y')[y]).getByLabelText(v))
const gõ = (i: number, t: string) => fireEvent.change(within(the(i)).getByRole('textbox'), { target: { value: t } })
const nutNop = () => screen.getByRole('button', { name: /^Nộp/ })
const cho = () => new Promise((r) => setTimeout(r, 0))

describe('lấy đề', () => {
  it('gọi /hs/cau-theo-qid với TOKEN và đúng các qid; vẽ đủ 4 thẻ đúng phần, chưa lộ đáp án', async () => {
    dung()
    await screen.findByText('Este X có tên gọi là gì?')
    expect(goi[0]).toEqual({ url: '/hs/cau-theo-qid', body: { token: 'tok-hs', qid: ['on1', 'on2', 'on3', 'on4'] } })
    expect(document.querySelectorAll('.lco-the').length).toBe(4)
    expect(screen.getByText('Phần I · Trắc nghiệm', { selector: '.lco-the:nth-child(1) *' })).toBeTruthy()
    expect(screen.getByText('Danh pháp este')).toBeTruthy()
    // Chưa nộp: không chữ nào của phần đáp án/lời giải
    expect(document.body.textContent).not.toMatch(/Đáp án đúng|KIẾN THỨC CỐT LÕI|Em chọn|Chưa đúng/)
    expect(within(the(0)).getAllByRole('radio').length).toBe(4)
    expect(the(1).querySelectorAll('.lco-y').length).toBe(4)
    expect(within(the(2)).getByRole('textbox')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Ôn 4 câu đã tới hạn nhắc lại' })).toBeTruthy()
  })

  it('cắt ở 20 qid, bỏ trùng/rỗng; thiếu token thì báo chứ không gọi mạng', async () => {
    const nhieu = Array.from({ length: 25 }, (_, i) => `q${i}`)
    traCau = () => ({ ok: true, cau: [], khongCo: [] })
    dung({ qid: [...nhieu, 'q1', ''] })
    await waitFor(() => expect(goi.length).toBe(1))
    expect(goi[0].body.qid).toEqual(nhieu.slice(0, 20))
    cleanup()
    goi = []
    render(<LamCauOn token="" viecId="v" qid={['a']} onXong={() => {}} />)
    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(goi.length).toBe(0)
  })

  it('lỗi mạng/máy chủ: nói bằng lời, có nút Thử lại gọi lại được', async () => {
    traCau = () => ({ ok: false })
    dung()
    expect((await screen.findByRole('alert')).textContent).toMatch(/Máy chủ chưa đưa được câu ôn/)
    traCau = () => ({ ok: true, cau: CAU, khongCo: [] })
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    expect(await screen.findByText('Este X có tên gọi là gì?')).toBeTruthy()
    expect(goi.filter((g) => g.url === '/hs/cau-theo-qid').length).toBe(2)
  })

  it('khongCo: vẽ "Chưa mở được câu này", không đoán lý do, các câu khác vẫn làm được', async () => {
    traCau = () => ({ ok: true, cau: CAU.slice(0, 2), khongCo: ['zz'] })
    dung({ qid: ['on1', 'on2', 'zz'] })
    await screen.findByText('Este X có tên gọi là gì?')
    expect(screen.getByText(/Chưa mở được câu này/)).toBeTruthy()
    chonI(0, 0)
    expect(nutNop()).toBeTruthy()
  })
})

describe('trả lời: thế nào là "đã trả lời"', () => {
  it('Phần I có chữ; Phần II phải ĐỦ 4 ý; Phần III phải có chữ (khoảng trắng không tính)', () => {
    const [p1, p2, p3] = CAU as any[]
    expect(daTraLoi(p1, '')).toBe(false)
    expect(daTraLoi(p1, 'B')).toBe(true)
    expect(daTraLoi(p2, 'DS--')).toBe(false)
    expect(daTraLoi(p2, 'DSDS')).toBe(true)
    expect(daTraLoi(p3, '  ')).toBe(false)
    expect(daTraLoi(p3, '12,5')).toBe(true)
  })

  it('nút Nộp tắt khi chưa trả lời câu nào; đếm "Đã trả lời x/N" và "Còn M câu chưa trả lời"', async () => {
    dung()
    await screen.findByText('Este X có tên gọi là gì?')
    expect((nutNop() as HTMLButtonElement).disabled).toBe(true)
    expect(nutNop().textContent).toBe('Nộp bài')
    expect(screen.getByText('Còn 4 câu chưa trả lời')).toBeTruthy()
    chonI(0, 1)
    chonY(1, 0, 'Đúng')
    chonY(1, 1, 'Sai')
    chonY(1, 2, 'Đúng') // mới 3/4 ý
    expect(screen.getByText('Đã trả lời 1/4 câu')).toBeTruthy()
    chonY(1, 3, 'Sai')
    expect(screen.getByText('Đã trả lời 2/4 câu')).toBeTruthy()
    expect(nutNop().textContent).toBe('Nộp 2 câu đã làm')
    expect((nutNop() as HTMLButtonElement).disabled).toBe(false)
  })

  it('bấm lại đổi được đáp án trước khi nộp (Phần I và từng ý Phần II)', async () => {
    dung()
    await screen.findByText('Este X có tên gọi là gì?')
    chonI(0, 0)
    chonI(0, 2)
    expect((within(the(0)).getAllByRole('radio')[2] as HTMLInputElement).checked).toBe(true)
    expect((within(the(0)).getAllByRole('radio')[0] as HTMLInputElement).checked).toBe(false)
    chonY(1, 0, 'Đúng')
    chonY(1, 0, 'Sai')
    expect((within(the(1).querySelectorAll<HTMLElement>('.lco-y')[0]).getByLabelText('Sai') as HTMLInputElement).checked).toBe(true)
  })
})

describe('nộp', () => {
  it('nộp MỘT PHẦN: chỉ gửi câu đã trả lời (Phần II 4 ký tự D/S, đúng token); câu chưa làm KHÔNG bị tô sai, ghi rõ "chưa được tính", vẫn làm tiếp được', async () => {
    traNop = () => ({ ok: true, ketQua: [KQ1, KQ2], khongCo: [], chuaLam: [], tienBo: { daLamCau: 2, lenBac: 1, tutBac: 1 }, exp: 2 })
    dung()
    await screen.findByText('Este X có tên gọi là gì?')
    chonI(0, 1)
    ;([['Đúng'], ['Sai'], ['Đúng'], ['Sai']] as const).forEach(([v], y) => chonY(1, y, v))
    fireEvent.click(nutNop())
    await screen.findByText('Đúng 1/2 câu đã chấm')
    expect(goi.at(-1)).toEqual({ url: '/hs/on-lai/nop', body: { token: 'tok-hs', traLoi: [{ qid: 'on1', dapAn: 'B' }, { qid: 'on2', dapAn: 'DSDS' }] } })
    // kết quả + lời giải chỉ xuất hiện SAU nộp, cho câu đã chấm
    expect(the(0).getAttribute('data-trang-thai')).toBe('sai')
    expect(the(1).getAttribute('data-trang-thai')).toBe('dung')
    expect(within(the(0)).getByText('Chưa đúng')).toBeTruthy()
    expect(within(the(0)).getByText('Đáp án đúng')).toBeTruthy()
    expect(within(the(0)).getByText('Em chọn')).toBeTruthy()
    expect(within(the(0)).getByText('KIẾN THỨC CỐT LÕI')).toBeTruthy()
    // ô đáp án của câu đã chấm KHOÁ (nộp lại giữ kết quả lần đầu)
    for (const r of within(the(0)).getAllByRole('radio')) expect((r as HTMLInputElement).disabled).toBe(true)
    // câu chưa trả lời: "chưa được tính", KHÔNG phải sai, vẫn sửa được
    for (const i of [2, 3]) {
      expect(the(i).getAttribute('data-trang-thai')).toBe('chua')
      expect(within(the(i)).getByText('Chưa trả lời — chưa được tính')).toBeTruthy()
      expect(within(the(i)).queryByText('Chưa đúng')).toBeNull()
      expect(document.body.textContent).not.toMatch(/Bỏ trống, tính là sai/)
    }
    expect((within(the(3)).getAllByRole('radio')[0] as HTMLInputElement).disabled).toBe(false)
    expect((within(the(2)).getByRole('textbox') as HTMLInputElement).disabled).toBe(false)
    expect(screen.getByText(/Còn 2 câu chưa trả lời/, { selector: '.lco-nhac' })).toBeTruthy()
    // tiến bộ + EXP
    expect(screen.getByText('Hôm nay em đã ôn 2 câu · lên bậc 1 · tụt bậc 1')).toBeTruthy()
    expect(screen.getByText('+2 EXP học tập')).toBeTruthy()
  })

  it('EXP = 0 hoặc máy chủ chưa có trường: KHÔNG hiện dòng EXP', async () => {
    traNop = () => ({ ok: true, ketQua: [KQ1], chuaLam: [], tienBo: null })
    dung()
    await screen.findByText('Este X có tên gọi là gì?')
    chonI(0, 1)
    fireEvent.click(nutNop())
    await screen.findByText('Đúng 0/1 câu đã chấm')
    expect(screen.queryByText(/EXP/)).toBeNull()
    expect(screen.queryByText(/lên bậc/)).toBeNull()
  })

  it('máy chủ trả chuaLam cho câu em đã gửi: thẻ ấy giữ lại, nói "chưa được tính", KHÔNG khoá, KHÔNG có lời giải', async () => {
    traNop = () => ({ ok: true, ketQua: [KQ1], chuaLam: ['on4'], tienBo: null, exp: 0 })
    dung()
    await screen.findByText('Este X có tên gọi là gì?')
    chonI(0, 1)
    chonI(3, 0)
    fireEvent.click(nutNop())
    await screen.findByText('Đúng 0/1 câu đã chấm')
    expect(the(3).getAttribute('data-trang-thai')).toBe('chua')
    expect(within(the(3)).getByText('Chưa trả lời — chưa được tính')).toBeTruthy()
    expect(within(the(3)).queryByText('KIẾN THỨC CỐT LÕI')).toBeNull()
    expect((within(the(3)).getAllByRole('radio')[0] as HTMLInputElement).disabled).toBe(false)
  })

  it('nộp lỗi (ok:false hoặc mất mạng): hiện chữ lỗi của máy chủ, GIỮ đáp án em đã chọn, nộp lại được', async () => {
    traNop = () => ({ ok: false, error: 'Chưa ghi được sổ, em nộp lại.' })
    dung()
    await screen.findByText('Este X có tên gọi là gì?')
    chonI(0, 1)
    fireEvent.click(nutNop())
    expect((await screen.findByRole('alert')).textContent).toBe('Chưa ghi được sổ, em nộp lại.')
    expect((within(the(0)).getAllByRole('radio')[1] as HTMLInputElement).checked).toBe(true)
    expect(document.body.textContent).not.toMatch(/Đáp án đúng|KIẾN THỨC CỐT LÕI/)
    traNop = () => ({ ok: true, ketQua: [KQ1], chuaLam: [], tienBo: null, exp: 0 })
    fireEvent.click(nutNop())
    await screen.findByText('Đúng 0/1 câu đã chấm')
    expect(goi.filter((g) => g.url === '/hs/on-lai/nop').length).toBe(2)
  })

  it('nộp lại cùng câu: KẾT QUẢ LẦN ĐẦU được giữ (máy chủ trả lại lần đầu, giao diện không ghi đè)', async () => {
    dung()
    await screen.findByText('Este X có tên gọi là gì?')
    traNop = () => ({ ok: true, ketQua: [KQ1], chuaLam: [], tienBo: null, exp: 0 })
    chonI(0, 1)
    fireEvent.click(nutNop())
    await screen.findByText('Đúng 0/1 câu đã chấm')
    // câu 4 làm và nộp: máy chủ (giả) lại trả cả kết quả câu 1 với `dung:true` — không được ghi đè
    traNop = () => ({ ok: true, ketQua: [{ ...KQ1, dung: true }, KQ4], chuaLam: [], tienBo: null, exp: 0 })
    chonI(3, 2)
    fireEvent.click(nutNop())
    await screen.findByText('Đúng 1/2 câu đã chấm')
    expect(the(0).getAttribute('data-trang-thai')).toBe('sai')
  })

  it('bấm Nộp liên tiếp khi đang gửi: chỉ MỘT lần gọi', async () => {
    let xong: (v: any) => void = () => {}
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init: RequestInit) => {
        const u = new URL(String(url)).pathname
        goi.push({ url: u, body: JSON.parse(String(init.body || '{}')) })
        if (u === '/hs/cau-theo-qid') return { ok: true, status: 200, json: async () => ({ ok: true, cau: CAU, khongCo: [] }) }
        return { ok: true, status: 200, json: () => new Promise((r) => (xong = r)) }
      }),
    )
    dung()
    await screen.findByText('Este X có tên gọi là gì?')
    chonI(0, 1)
    const nut = nutNop()
    fireEvent.click(nut)
    fireEvent.click(nut)
    fireEvent.click(nut)
    await cho()
    expect(goi.filter((g) => g.url === '/hs/on-lai/nop').length).toBe(1)
    expect(nut.textContent).toBe('Đang nộp…')
    expect((nut as HTMLButtonElement).disabled).toBe(true)
    xong({ ok: true, ketQua: [KQ1], chuaLam: [], tienBo: null, exp: 0 })
    await screen.findByText('Đúng 0/1 câu đã chấm')
  })

  it('làm xong hết: hiện "Xong" (không còn nút Nộp), bấm Xong gọi onXong để đóng sheet về Bảng nhiệm vụ', async () => {
    traNop = () => ({ ok: true, ketQua: [KQ1, KQ2, KQ3, KQ4], chuaLam: [], tienBo: { daLamCau: 4, lenBac: 3, tutBac: 1 }, exp: 6 })
    const { onXong } = dung()
    await screen.findByText('Este X có tên gọi là gì?')
    chonI(0, 1)
    ;(['Đúng', 'Sai', 'Đúng', 'Sai'] as const).forEach((v, y) => chonY(1, y, v))
    gõ(2, '125')
    chonI(3, 2)
    expect(nutNop().textContent).toBe('Nộp bài')
    fireEvent.click(nutNop())
    await screen.findByText('Đúng 3/4 câu đã chấm')
    expect(screen.getByText('Em đã làm xong việc này')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /^Nộp/ })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Xong' }))
    expect(onXong).toHaveBeenCalledTimes(1)
  })
})

describe('nháp trong máy', () => {
  it('đóng rồi mở lại cùng việc cùng ngày: đáp án đang làm dở được khôi phục; câu đã chấm không lưu', async () => {
    const a = dung()
    await screen.findByText('Este X có tên gọi là gì?')
    chonI(0, 1)
    gõ(2, '12,5')
    await cho()
    expect(JSON.parse(localStorage.getItem('omr_cauon:12121212:on_lai:2026-09-19')!)).toEqual({ on1: 'B', on3: '12,5' })
    a.unmount()
    dung()
    await screen.findByText('Este X có tên gọi là gì?')
    expect((within(the(0)).getAllByRole('radio')[1] as HTMLInputElement).checked).toBe(true)
    expect((within(the(2)).getByRole('textbox') as HTMLInputElement).value).toBe('12,5')
  })
})

describe('cau-on-api', () => {
  it('nopOnLai: bắt buộc token; ok:false mang chữ lỗi máy chủ; mất mạng → báo giữ bài; tối đa 20 mục', async () => {
    expect((await nopOnLai('', [{ qid: 'a', dapAn: 'A' }])).ok).toBe(false)
    expect(goi.length).toBe(0)
    traNop = () => ({ ok: false, error: 'Token không hợp lệ.' })
    expect(await nopOnLai('t', [{ qid: 'a', dapAn: 'A' }])).toEqual({ ok: false, error: 'Token không hợp lệ.' })
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline') }))
    const r = await nopOnLai('t', [{ qid: 'a', dapAn: 'A' }])
    expect(r.ok).toBe(false)
    expect(r.error).toMatch(/vẫn được giữ/)
    vi.unstubAllGlobals()
    const gui = vi.fn(async (_u: string, i: RequestInit) => ({ ok: true, status: 200, json: async () => ({ ok: true, ketQua: [], _n: JSON.parse(String(i.body)).traLoi.length }) }))
    vi.stubGlobal('fetch', gui)
    await nopOnLai('t', Array.from({ length: 30 }, (_, i) => ({ qid: `q${i}`, dapAn: 'A' })))
    expect(JSON.parse(String((gui.mock.calls[0][1] as RequestInit).body)).traLoi.length).toBe(20)
  })

  it('taiCauTheoQid: bỏ qua câu sai hình dạng (thiếu qid / phần lạ)', async () => {
    traCau = () => ({ ok: true, cau: [CAU[0], { qid: 'x', phan: 'IV' }, { phan: 'I' }, null], khongCo: ['k'] })
    const r = await taiCauTheoQid('t', ['on1', 'x'])
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.cau.map((c) => c.qid)).toEqual(['on1'])
      expect(r.khongCo).toEqual(['k'])
    }
  })
})

describe('CSS của màn', () => {
  const css = fs.readFileSync(path.join(process.cwd(), 'src/components/bang-nhiem-vu/lam-cau-on.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
  it('không mã màu cứng nào; mọi bộ chọn dưới .lco; tắt chuyển động khi giảm chuyển động; hàng chọn ≥ 52 px, đích chạm ≥ 48 px', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(css).not.toMatch(/\brgba?\(/)
    for (const m of css.replace(/@media[^{]*\{/g, '').replace(/@keyframes[^{]*\{/g, '').matchAll(/([^{}]+)\{/g)) {
      for (const b of m[1].split(',')) expect(b.trim().startsWith('.lco'), b).toBe(true)
    }
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
    expect(css).toMatch(/\.lco-lua\s*\{[^}]*min-height:\s*52px/)
    expect(css).toMatch(/\.lco-doan-o\s*\{[^}]*min-height:\s*48px/)
  })
})
