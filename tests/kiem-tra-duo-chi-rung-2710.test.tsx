// @vitest-environment jsdom
// MÀN KIỂM TRA KIỂU DUOLINGO (thầy 27/10: «Màn làm bài kiểm tra của hs đổi sang dolingo … tự động tắt âm thanh chỉ để rung»):
//  1. Cờ «đang kiểm tra» (batCheDoThi): màn kiểm tra mở ⇒ phanHoi('chon') CHỈ rung, không tiếng nào (kể cả tiếng thưởng), dù công tắc «Âm thanh» bật; gỡ cờ ⇒ tiếng trở lại;
//     hai màn lồng nhau / gỡ hai lần vẫn đúng.
//  2. Khung ca thi (ThiDuo): một câu một màn — «Câu tiếp» đi câu sau, câu cuối là nút nộp (mở tấm xác nhận, KHÔNG nộp thẳng), ← → đổi câu, tấm lưới
//     chỉ có «đã làm / chưa làm» (không đúng/sai), tấm nộp có Bi + câu chưa làm bấm được, chạm nút ⇒ rung. Chỉ nộp phút cuối ⇒ nút nộp khoá.
//  3. Kiểm tra ôn tập (ManKiemTraCaNhan) với <html data-trong="hs">: màn chặng kiểu Duo, chọn phương án ⇒ lưu như cũ, nộp chặng qua tấm có Bi.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createElement as h } from 'react'

const api = vi.hoisted(() => vi.fn())
vi.mock('../src/components/hoa2/api', async (goc) => ({ ...(await goc<Record<string, unknown>>()), goiHoa2: api }))

let soOsc = 0
class GiaCtx {
  state = 'running'; currentTime = 0; destination = {}
  resume() { return Promise.resolve() }
  createGain() { return { gain: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, setTargetAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} } }
  createOscillator() { soOsc++; return { type: '', frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, start() {}, stop() {} } }
  createBuffer() { return { getChannelData: () => new Float32Array(16) } }
  createBufferSource() { return { buffer: null, connect() {}, start() {}, stop() {} } }
  createBiquadFilter() { return { type: '', Q: { value: 0 }, frequency: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} } }
  get sampleRate() { return 44100 }
}
const vibrate = vi.fn(() => true)
beforeEach(() => {
  soOsc = 0
  vibrate.mockClear()
  vi.stubGlobal('AudioContext', GiaCtx)
  Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true, writable: true })
  document.documentElement.dataset.trong = 'hs'
  Object.defineProperty(document, 'hidden', { value: false, configurable: true })
})
afterEach(() => { cleanup(); vi.unstubAllGlobals(); localStorage.clear(); delete document.documentElement.dataset.trong })

describe('cờ «đang kiểm tra» — chỉ rung, không tiếng', () => {
  it('bật cờ ⇒ phanHoi rung nhưng không tạo oscillator; gỡ cờ ⇒ có tiếng lại', async () => {
    const { batCheDoThi, dangCheDoThi } = await import('../src/lib/am-thanh')
    const { phanHoi } = await import('../src/lib/phan-hoi')
    const { phat } = await import('../src/lib/am-thanh')
    localStorage.setItem('ddh.am', 'bat') // công tắc «Âm thanh» đang bật
    const go = batCheDoThi()
    expect(dangCheDoThi()).toBe(true)
    phanHoi('chon'); phanHoi('xong'); phat('dung')
    expect(vibrate).toHaveBeenCalledWith([35])
    expect(soOsc).toBe(0)
    go()
    expect(dangCheDoThi()).toBe(false)
    phanHoi('chon')
    expect(soOsc).toBeGreaterThan(0)
  })
  it('tiếng thưởng (am-thanh-thuong) cũng im khi cờ bật', async () => {
    const { batCheDoThi } = await import('../src/lib/am-thanh')
    const { phatThuong } = await import('../src/lib/am-thanh-thuong')
    const go = batCheDoThi()
    phatThuong('tinhThe')
    expect(soOsc).toBe(0)
    go()
  })
  it('hai màn lồng nhau: gỡ một vẫn im; gỡ hai lần một hàm không làm âm bộ đếm', async () => {
    const { batCheDoThi, dangCheDoThi } = await import('../src/lib/am-thanh')
    const a = batCheDoThi(), b = batCheDoThi()
    a(); a()
    expect(dangCheDoThi()).toBe(true)
    b()
    expect(dangCheDoThi()).toBe(false)
    b()
    const c = batCheDoThi()
    expect(dangCheDoThi()).toBe(true)
    c()
    expect(dangCheDoThi()).toBe(false)
  })
})

describe('khung ca thi kiểu Duo (ThiDuo)', () => {
  const dung = async (them: Record<string, unknown> = {}) => {
    const { default: ThiDuo } = await import('../src/components/kiem-tra-duo/ThiDuo')
    const p = {
      tenCa: 'Ca thử', dongHo: '37:57', nhanDongHo: 'Thời gian còn lại', gap: false, daLam: 1, tong: 3,
      luu: { nhan: 'đã lưu', tt: 'da' as const }, cauHien: 1, onDenCau: vi.fn(), phan: ['I', 'I', 'II'], moTaPhan: (ph: string) => `Biểu điểm phần ${ph}`,
      moLuoi: false, onMoLuoi: vi.fn(), moNop: false, onMoNop: vi.fn(), chuaLam: [2, 3], danhDau: [3], nhanNutNop: 'Nộp bài', camNopSom: false,
      onNop: vi.fn(), onThoat: vi.fn(), tatPhim: false,
      ...them,
    }
    const r = render(h(ThiDuo, p as never, h('div', { id: 'cau-1' }, 'Đề câu 1')))
    return { p, r }
  }
  it('Câu tiếp ⇒ câu sau; câu cuối là nút nộp mở tấm xác nhận (không nộp thẳng); X ⇒ hộp thoát; khung báo đã dựng', async () => {
    const { p, r } = await dung()
    expect(p.onDenCau).toHaveBeenCalledWith(2) // mở khung ⇒ tới câu chưa làm đầu tiên
    fireEvent.click(screen.getByRole('button', { name: 'Câu tiếp' }))
    expect(p.onDenCau).toHaveBeenCalledWith(2)
    expect(vibrate).toHaveBeenCalled() // chạm nút ⇒ rung
    expect((screen.getByRole('button', { name: 'Câu trước' }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Thoát bài làm' }))
    expect(p.onThoat).toHaveBeenCalled()
    const { default: ThiDuo } = await import('../src/components/kiem-tra-duo/ThiDuo')
    r.rerender(h(ThiDuo, { ...p, cauHien: 3 } as never, h('div', null, 'Đề câu 3')))
    expect(screen.queryByRole('button', { name: 'Câu tiếp' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Nộp bài' }))
    expect(p.onMoNop).toHaveBeenCalledWith(true)
    expect(p.onNop).not.toHaveBeenCalled()
  })
  it('phím ← → đổi câu; đang mở tấm thì không', async () => {
    const { p } = await dung({ cauHien: 2 })
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(p.onDenCau).toHaveBeenLastCalledWith(3)
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(p.onDenCau).toHaveBeenLastCalledWith(1)
    cleanup()
    const { p: p2 } = await dung({ cauHien: 2, tatPhim: true })
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(p2.onDenCau).toHaveBeenCalledTimes(1) // chỉ lượt tới câu chưa làm đầu tiên lúc mở
  })
  it('tấm lưới: chỉ «đã làm / chưa làm» + cờ xem lại, không đúng/sai; bấm số ⇒ tới câu', async () => {
    const { p } = await dung({ moLuoi: true })
    const tam = screen.getByRole('dialog', { name: 'Danh sách câu' })
    expect(tam.textContent).not.toMatch(/Chính xác|Chưa đúng|đáp án|câu đúng|câu sai/i)
    expect(screen.getByRole('button', { name: 'Câu 1 · đã làm' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Câu 3 · chưa làm · xem lại sau' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Câu 2 · chưa làm' }))
    expect(p.onMoLuoi).toHaveBeenCalledWith(false)
    expect(p.onDenCau).toHaveBeenCalledWith(2)
  })
  it('tấm nộp: có Bi, câu chưa làm bấm được, «Nộp bài» gọi nộp; chỉ nộp phút cuối ⇒ nút khoá', async () => {
    const { p, r } = await dung({ moNop: true })
    const tam = screen.getByRole('dialog', { name: 'Nộp bài?' })
    expect(tam.querySelector('svg.bi')).toBeTruthy()
    expect(tam.textContent).toContain('Sau khi nộp không sửa được nữa.')
    fireEvent.click(screen.getAllByRole('button', { name: 'Câu 2' })[0]!)
    expect(p.onDenCau).toHaveBeenCalledWith(2)
    fireEvent.click(screen.getByRole('button', { name: 'Nộp bài' }))
    expect(p.onNop).toHaveBeenCalledTimes(1)
    const { default: ThiDuo } = await import('../src/components/kiem-tra-duo/ThiDuo')
    r.rerender(h(ThiDuo, { ...p, camNopSom: true, nhanNutNop: 'Nộp bài (còn 3:00)' } as never, h('div', null, 'x')))
    expect((screen.getAllByRole('button', { name: 'Nộp bài (còn 3:00)' })[0] as HTMLButtonElement).disabled).toBe(true)
  })
})

describe('Kiểm tra ôn tập kiểu Duo (ManKiemTraCaNhan, data-trong="hs")', () => {
  const now = Date.now()
  const ngay = new Date(now + 7 * 3600_000).toISOString().slice(0, 10)
  const KT = { id: 'kt1', ngay, moLuc: now - 3600_000, hanLuc: now - 3600_000 + 86400_000, serverNow: now, trangThai: 'can_lam', homNay: true, baiNgayToiThieu: 12, tong: 6, daTra: 0, con: 6,
    soChang: 1, phut: 10, soBai: 2, tongKienThuc: 4, phuDe: 4, nguonDayDu: true, lyDo: '', thieuNguon: 0, diem: null, nopLuc: null }
  const CAU = [
    { qid: 'A1', version: '1', group: 'g', phan: 'I', tenDang: 'Ester', mucDo: 'hieu', text: 'Câu hỏi một?', choices: ['Một.', 'Hai.', 'Ba.', 'Bốn.'], ideas: [], hinhAnh: [] },
    { qid: 'A2', version: '1', group: 'g', phan: 'I', tenDang: 'Ester', mucDo: 'hieu', text: 'Câu hỏi hai?', choices: ['Năm.', 'Sáu.', 'Bảy.', 'Tám.'], ideas: [], hinhAnh: [] },
  ]
  it('mở chặng ⇒ một câu một màn; chọn phương án ⇒ lưu (không đúng/sai); câu cuối «Nộp chặng» ⇒ tấm có Bi ⇒ chốt chặng', async () => {
    const goi: string[] = []
    api.mockImplementation(async (lenh: string) => {
      goi.push(lenh)
      const kt = { ...KT, serverNow: Date.now() }
      if (lenh === 'hoc-tap-ktcn-trang-thai') return { ok: true, kiemTra: kt, chang: [{ stt: 0, soCau: 2, giay: 600, han: null, daChot: goi.includes('hoc-tap-ktcn-chot-chang'), daTra: 0 }] }
      if (lenh === 'hoc-tap-ktcn-start') return { ok: true, kiemTra: kt, revision: 1, hanChang: Date.now() + 600_000, daChot: false, questions: CAU, tra: {} }
      return { ok: true, kiemTra: kt, revision: 2, daLuu: true }
    })
    const { default: Man } = await import('../src/components/hoc-tap/ManKiemTraCaNhan')
    render(h(Man, { token: 't', sbd: '1', id: 'kt1', onVe: vi.fn(), onCapNhat: vi.fn() }))
    fireEvent.click(await screen.findByRole('button', { name: /Làm chặng 1/ }))
    await screen.findByText('Câu 1/2')
    expect(document.querySelector('.duo-kt')).toBeTruthy()
    fireEvent.click(screen.getByRole('radio', { name: /Hai\./ }))
    expect(vibrate).toHaveBeenCalled()
    expect(document.body.textContent).not.toMatch(/Chính xác|Chưa đúng|Đáp án/)
    await waitFor(() => expect(goi).toContain('hoc-tap-ktcn-luu'), { timeout: 2000 })
    fireEvent.click(screen.getByRole('button', { name: 'Câu tiếp' }))
    await screen.findByText('Câu 2/2')
    fireEvent.click(screen.getByRole('button', { name: 'Nộp chặng 1' }))
    const tam = await screen.findByRole('dialog', { name: 'Nộp chặng 1?' })
    expect(tam.querySelector('svg.bi')).toBeTruthy()
    expect(goi).not.toContain('hoc-tap-ktcn-chot-chang')
    await act(async () => { fireEvent.click(screen.getAllByRole('button', { name: 'Nộp chặng 1' }).at(-1)!) })
    await waitFor(() => expect(goi).toContain('hoc-tap-ktcn-chot-chang'))
  })
})
