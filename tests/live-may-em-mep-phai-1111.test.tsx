// LIVE BẢNG — MÁY EM, BỐ CỤC «MÉP PHẢI» (thầy 11/11 LẦN 3, kèm ảnh máy em: «Chuyển mic, tắt tiếng, thanh ẩn sang hẳn góc phải ở giữa bảng đen, tối ưu không
// gian hiển thị đề và bảng đen phải full để hs đọc rõ, thiết kế ẩn hết vào thanh ẩn»). Lớp bảng live thật (LopLive) với thư viện live GIẢ. Khoá:
//   · trên bảng KHÔNG còn phần tử nổi nào ngoài MỘT tay nắm (+ khay của nó): hết viên «Tiếng đang tắt», hết huy hiệu mic tròn, hết thẻ mic;
//   · trạng thái báo bằng DẤU rất nhỏ ngay trên tay nắm: tiếng đang tắt · mic của em đang bật · em đang giơ tay · mạng yếu (kèm nhãn cho trình đọc màn);
//   · lần ĐẦU vào live mà tiếng đang tắt ⇒ khay tự mở 3 giây rồi tự thu, MỘT lần mỗi buổi (kể cả khi đổi qua lại màn câu hỏi ⇄ bảng live);
//   · khay: chạm ra ngoài ⇒ thu; mở tay ⇒ tự thu sau 4 giây; trình duyệt chặn phát ⇒ ô «Tiếng» ghi «Chạm để nghe» (chạm là mở khoá, không phải tắt);
//   · giấy + bảng vẽ PHỦ KÍN khung nhìn (ô giấy sát trái, ô bảng sát phải, cùng chạm trên / dưới);
//   · dải lượt: em đoán xong thì thu về một viên nhỏ (tên bạn + điều em đoán + nút tiếp sức).
// Diện tích ≥ 92 % ở các khổ máy: phép kiểm thuần ở tests/live-xoay-chia-doi-1011.test.ts («GIẤY + BẢNG PHỦ KÍN»).
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { duDoan, goiLenBang, moLuot, nhanTra, taoPhong, viewEm } from '../src/lib/bpu/phong'
import { _datLaiTatMan } from '../src/components/bpu/tat-man'
import { daiLuot } from '../src/components/live/DaiLuot'

type Tt = Record<string, unknown>
const NEN: Tt = { duocXem: true, san: true, bat: true, tu: 1, tieng: 'co', nghe: false, kenhNet: 'ws', duBang: true, bang: true, duocMoMic: false, duocMoi: false, tay: false, hangTay: null, mic: 'tat', banNoi: null, nghi: false }
let dau: Tt = {}
let dat: (o: Tt) => void = () => {}
const goi: string[] = []
vi.mock('../src/lib/live', () => ({
  taoLiveEm: (tuy: { khiTrangThai?: (t: Tt) => void }) => {
    let tt = { ...NEN, ...dau }
    dat = (o) => { tt = { ...tt, ...o }; act(() => { tuy.khiTrangThai?.({ ...tt }) }) }
    setTimeout(() => dat({}), 0)
    return {
      trangThai: () => ({ ...tt }), nhanView() {}, nhanTinPhong() {}, khiNoiLai() {}, moKhoaTieng: async () => { goi.push('mo-khoa'); return true }, datTieng: (b: boolean) => { goi.push(`tieng:${b}`); dat({ nghe: b }) }, datRoiMan() {},
      bang: () => ({ trang: '', tiLe: 16 / 9, net: [], cuoi: 0, lichSu: [], ghep: null }), khung: () => ({ dau: [], tro: null }), mucAm: () => 0, mucAmMic: () => 0, mucAmBan: () => 0, soDo: () => ({ kenhNet: 'ws' }), huy() {},
      batMicLenBang: async () => ({ ok: true }), tatMic() {}, dangChoQuyenMic: () => false, gioTay() {}, deSau() {}, datGiayLech() {}, datHienBang() {},
    }
  },
}))

const view = { duocXem: true, san: true, bat: true, tu: 1, phien: 1, ss: null, tieng: 'tat', soNet: 0, bang: true, emTay: false, hangTay: null, emDuocMoi: false, emNoi: false, noi: [] } as never
const dangKy = () => {}
const cho = (ms: number) => act(async () => { await new Promise((r) => setTimeout(r, ms)) })
async function dung(che: 'bang' | 'dau' = 'bang', them: { matMang?: boolean } = {}) {
  const { default: LopLive } = await import('../src/components/live/LopLive')
  const ve = (c: 'bang' | 'dau', t: { matMang?: boolean } = them) => <LopLive ve="ve" goc="https://may-chu" guiTho={() => {}} dangKy={dangKy} view={view} che={c} de={null} khoaDe="q1" doi={{ ten: 'Đội Kali', ky: 'K', kj: 120 }} matMang={!!t.matMang} roi={false} />
  const r = render(ve(che))
  await waitFor(() => expect(document.querySelector(che === 'bang' ? '.lv' : '.lv-phu')).toBeTruthy())
  return { doi: (c: 'bang' | 'dau', t?: { matMang?: boolean }) => r.rerender(ve(c, t)) }
}
const khayMo = () => !!document.querySelector('.lv-khay')?.hasAttribute('data-mo')
const dauNam = () => [...document.querySelectorAll('.lv-nam .lv-nam-dau [data-dau]')].map((e) => e.getAttribute('data-dau'))
beforeEach(() => { goi.length = 0; dau = {}; _datLaiTatMan() })
afterEach(() => { _datLaiTatMan() })

describe('bảng live máy em: mọi điều khiển trong MỘT thanh ẩn ở mép phải', () => {
  it('tiếng tắt + mic của em đang bật + em đang giơ tay: trên bảng KHÔNG có phần tử nổi nào ngoài tay nắm (và khay của nó); trạng thái là các dấu nhỏ trên tay nắm', async () => {
    dau = { duocMoMic: true, mic: 'dang-phat', tay: true, hangTay: 2 }
    await dung()
    const goc = document.querySelector('.lv')!
    await cho(700) // viên chào «Thầy đang live» lúc thầy VỪA bật live tự mất sau 0,6 giây (đặc tả 2.2 «Vào live»)
    // con trực tiếp của lớp bảng: thước đo vùng an toàn · nền (giấy + bảng + nét) · tay nắm · khay — hết
    expect([...goc.children].map((e) => e.className.split(' ')[0]).sort()).toEqual(['lv-khay', 'lv-nam', 'lv-nen', 'lv-thuoc'])
    expect(document.querySelector('.lv-tieng-tat, .lv-nam-hh, .lv-bat-tieng, .lv-noi, .lv-dau-cu')).toBeNull()
    expect(screen.queryByText('Tiếng đang tắt')).toBeNull()
    expect(goc.querySelectorAll('.lv-nam').length).toBe(1)
    expect(dauNam()).toEqual(['tieng', 'mic', 'tay'])
    const nam = goc.querySelector('.lv-nam')!
    expect(nam.getAttribute('aria-label')).toMatch(/khay điều khiển · tiếng đang tắt · mic của em đang bật · em đang giơ tay, thứ 2 trong hàng$/)
    // mic + tiếng điều khiển TRONG khay
    expect(goc.querySelector('.lv-khay .lv-vua.mic')!.getAttribute('aria-pressed')).toBe('true')
    expect(goc.querySelector('.lv-khay .lv-vua:not(.mic)')!.textContent).toContain('Đang tắt')
    // hết trạng thái ⇒ tay nắm trơn
    dat({ nghe: true, mic: 'tat', duocMoMic: false, tay: false, hangTay: null })
    await waitFor(() => expect(dauNam()).toEqual([]))
    expect(goc.querySelector('.lv-nam-dau')).toBeNull()
    expect(goc.querySelector('.lv-nam')!.getAttribute('aria-label')).toMatch(/^(Mở|Thu) khay điều khiển$/)
  })

  it('mạng yếu / mất kết nối ⇒ dấu «mạng yếu» trên tay nắm; thầy tạm dừng ⇒ hết dấu tiếng (không có gì để nghe)', async () => {
    dau = { nghe: true }
    const { doi } = await dung('bang')
    expect(dauNam()).toEqual([])
    doi('bang', { matMang: true })
    await waitFor(() => expect(dauNam()).toEqual(['mang']))
    expect(document.querySelector('.lv-nam')!.getAttribute('aria-label')).toContain('mạng yếu')
    doi('bang', { matMang: false })
    await waitFor(() => expect(dauNam()).toEqual([]))
    dat({ nghe: false })
    await waitFor(() => expect(dauNam()).toEqual(['tieng']))
    dat({ nghi: true })
    await waitFor(() => expect(dauNam()).toEqual([]))
  })

  it('lần ĐẦU vào live mà tiếng đang tắt ⇒ khay tự mở 3 giây rồi tự thu; MỘT lần mỗi buổi (về màn câu hỏi rồi vào lại bảng, thầy tạm dừng rồi tiếp tục: không mở lại)', async () => {
    const { doi } = await dung('bang')
    await waitFor(() => expect(khayMo()).toBe(true))
    expect(document.querySelector('.lv-khay .lv-vua')!.getAttribute('aria-label')).toBe('Tiếng thầy: đang tắt. Chạm để bật') // em thấy ngay nút «Tiếng»
    await cho(2500)
    expect(khayMo()).toBe(true)
    await cho(800) // quá 3 giây
    expect(khayMo()).toBe(false)
    doi('dau'); await waitFor(() => expect(document.querySelector('.lv-phu')).toBeTruthy())
    await cho(60)
    expect(khayMo()).toBe(false)
    doi('bang'); await waitFor(() => expect(document.querySelector('.lv')).toBeTruthy())
    await cho(60)
    expect(khayMo()).toBe(false)
    dat({ nghi: true }); dat({ nghi: false })
    await cho(60)
    expect(khayMo()).toBe(false)
    expect(dauNam()).toEqual(['tieng']) // dấu trên tay nắm vẫn nhắc
  }, 15000)

  it('tiếng đang BẬT lúc vào ⇒ khay không tự mở; em mở tay ⇒ tự thu sau 4 giây không chạm; chạm ra ngoài ⇒ thu ngay', async () => {
    dau = { nghe: true }
    await dung('bang')
    await cho(80)
    expect(khayMo()).toBe(false)
    const nam = document.querySelector('.lv-nam')!
    const cham = () => { fireEvent.pointerDown(nam, { pointerId: 1, clientX: 800, clientY: 195 }); fireEvent.pointerUp(nam, { pointerId: 1, clientX: 800, clientY: 195 }) }
    cham()
    expect(khayMo()).toBe(true)
    expect(nam.getAttribute('aria-expanded')).toBe('true')
    await cho(3500)
    expect(khayMo()).toBe(true) // chưa tới 4 giây
    await cho(700)
    expect(khayMo()).toBe(false)
    cham()
    expect(khayMo()).toBe(true)
    fireEvent.pointerDown(document.querySelector('.lv-nen')!, { pointerId: 2, clientX: 200, clientY: 100 })
    expect(khayMo()).toBe(false)
  }, 15000)

  it('vuốt sang TRÁI từ tay nắm ⇒ khay bám ngón tay rồi mở; vuốt ngắn ⇒ không mở; kéo DỌC ⇒ dời tay nắm dọc mép phải (không mở khay)', async () => {
    dau = { nghe: true }
    await dung('bang')
    const nam = document.querySelector<HTMLElement>('.lv-nam')!, khay = document.querySelector<HTMLElement>('.lv-khay')!
    Object.defineProperty(khay, 'offsetWidth', { configurable: true, value: 216 })
    fireEvent.pointerDown(nam, { pointerId: 1, clientX: 830, clientY: 195 })
    fireEvent.pointerMove(nam, { pointerId: 1, clientX: 700, clientY: 198 })
    expect(khay.style.transform).toMatch(/^translate3d\(\d+(\.\d+)?px,-50%,0\)$/) // đang bám ngón tay, chỉ transform
    fireEvent.pointerUp(nam, { pointerId: 1, clientX: 700, clientY: 198 })
    expect(khay.style.transform).toBe('')
    expect(khayMo()).toBe(true)
    fireEvent.pointerDown(document.querySelector('.lv-nen')!, { pointerId: 2 })
    expect(khayMo()).toBe(false)
    fireEvent.pointerDown(nam, { pointerId: 3, clientX: 830, clientY: 195 })
    fireEvent.pointerMove(nam, { pointerId: 3, clientX: 815, clientY: 196 })
    fireEvent.pointerUp(nam, { pointerId: 3, clientX: 815, clientY: 196 })
    expect(khayMo()).toBe(false) // vuốt ngắn (dưới 30 % quãng trượt)
    fireEvent.pointerDown(nam, { pointerId: 4, clientX: 830, clientY: 195 })
    fireEvent.pointerMove(nam, { pointerId: 4, clientX: 832, clientY: 500 })
    fireEvent.pointerUp(nam, { pointerId: 4, clientX: 832, clientY: 500 })
    expect(khayMo()).toBe(false)
    expect(nam.style.top).toMatch(/%$/)
    expect(parseFloat(nam.style.top)).toBeGreaterThan(50)
  })

  it('trình duyệt chặn phát tiếng ⇒ dấu tiếng trên tay nắm, ô «Tiếng» trong khay ghi «Chạm để nghe»: chạm là MỞ KHOÁ (không tắt tiếng)', async () => {
    dau = { nghe: true, tieng: 'bi-chan' }
    await dung('bang')
    await waitFor(() => expect(dauNam()).toEqual(['tieng']))
    expect(document.querySelector('.lv-nam')!.getAttribute('aria-label')).toContain('máy chưa phát được tiếng thầy')
    const nut = screen.getByLabelText('Máy chưa phát được tiếng thầy. Chạm để nghe')
    expect(nut.textContent).toContain('Chạm để nghe')
    goi.length = 0
    fireEvent.click(nut)
    expect(goi).toContain('mo-khoa')
    expect(goi.filter((x) => x.startsWith('tieng:'))).toEqual([]) // không đổi lựa chọn nghe của em
  })

  it('màn câu hỏi (thầy đang live, em chưa gửi): cũng chỉ MỘT tay nắm + khay, có dấu trạng thái; không nút nổi nào khác', async () => {
    await dung('dau')
    const goc = document.querySelector('.lv-phu')!
    expect([...goc.children].map((e) => e.className.split(' ')[0]).sort()).toEqual(['lv-khay', 'lv-nam'])
    expect(goc.querySelector('.lv-nam')!.className).toContain('song') // chấm đỏ «thầy đang live»
    expect(dauNam()).toEqual(['tieng'])
    expect(goc.querySelector('.lv-khay')!.textContent).toContain('Thầy đang live')
    await waitFor(() => expect(khayMo()).toBe(true)) // lần đầu, tiếng đang tắt
    fireEvent.click(screen.getByLabelText('Tiếng thầy: đang tắt. Chạm để bật'))
    await waitFor(() => expect(dauNam()).toEqual([]))
  })

  it('giấy + bảng vẽ PHỦ KÍN khung nhìn jsdom (1024 × 768): ô giấy sát lề trái, ô bảng sát lề phải, cùng chạm lề trên / dưới; tổng diện tích ≥ 92 %', async () => {
    dau = { nghe: true }
    await dung('bang')
    const W = window.innerWidth, H = window.innerHeight
    // (11/11 chiều: hai khung co giãn độc lập — khung giấy / khung bảng đặt thẳng bằng px của hình, không còn lớp `.lv-chieu` co chung)
    const o = (k: string) => { const e = document.querySelector<HTMLElement>(k)!.style; return { x: parseFloat(e.left), y: parseFloat(e.top), w: parseFloat(e.width), h: parseFloat(e.height) } }
    const g = o('.lv-giay'), b = o('.lv-bang')
    expect(g.x).toBeCloseTo(4, 1); expect(b.x + b.w).toBeCloseTo(W - 4, 1)
    for (const v of [g, b]) { expect(v.y).toBeCloseTo(4, 1); expect(v.y + v.h).toBeCloseTo(H - 4, 1) }
    expect((g.w * g.h + b.w * b.h) / (W * H)).toBeGreaterThanOrEqual(0.92)
  })
})

describe('dải lượt trên bảng live: dải mỏng, đoán xong thu về một viên nhỏ', () => {
  const T0 = 1_700_000_000_000
  const cau = { qid: 'q1', phan: 'I' as const, tuLuan: false, cau: { qid: 'q1', maDe: 'm', phan: 'I', text: 'Chất nào là amine bậc hai?', choices: ['A', 'B', 'C', 'D'], ideas: [], hinhAnh: [], kienThuc: [] }, dung: 'B', hanGiay: 0 }
  it('chưa đoán: câu hỏi + «Làm đúng» · «Chưa đúng» · tiếp sức; đoán xong: chỉ còn «Em đoán … làm đúng» + nút tiếp sức (hai nút đoán không chiếm chỗ trên giấy nữa)', () => {
    const st = taoPhong({ buoiId: 'b1', lop: '12A1', nay: T0, ds: [{ sbd: 'S1', ten: 'Nguyễn Minh Anh', coMat: true, luc: T0 }, { sbd: 'S2', ten: 'Trần Gia Bảo', coMat: true, luc: T0 }] })
    moLuot(st, cau, T0); nhanTra(st, 'S2', 'A', T0 + 1); goiLenBang(st, 'S2', ['Chưa lên bảng buổi này'], T0 + 2)
    const lenh: unknown[] = []
    const ve = () => { const l = viewEm(st, 'S1').luot!; return render(<div className="lv-luot">{daiLuot({ l, sbd: 'S1', doi: 0, daGuiMay: false, ketQuaBang: null, gui: (m) => lenh.push(m) })}</div>) }
    const r1 = ve()
    expect(r1.container.textContent).toContain('Em đoán Gia Bảo làm đúng không?')
    expect([...r1.container.querySelectorAll('button')].map((b) => b.textContent!.replace(/ · \d+\/10$/, ''))).toEqual(['Làm đúng', 'Chưa đúng', expect.stringMatching(/^(Tiếp sức|Cổ vũ)$/)])
    fireEvent.click(r1.container.querySelectorAll('button')[0]!)
    expect(lenh).toEqual([{ t: 'doan', v: 1 }])
    r1.unmount()
    expect(duDoan(st, 'S1', 1, T0 + 3)).toBe(true)
    const r2 = ve()
    expect(r2.container.textContent).toContain('Em đoán Gia Bảo làm đúng')
    expect(r2.container.textContent).not.toContain('không?')
    expect(r2.container.querySelectorAll('button').length).toBe(1)
    expect(r2.container.querySelector('button.tiep')).toBeTruthy()
    fireEvent.click(r2.container.querySelector('button.tiep')!)
    expect(lenh[1]).toEqual({ t: 'tiep' })
  })
})
