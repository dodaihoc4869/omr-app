// @vitest-environment jsdom
// VÒNG TIẾN ĐỘ CHIA THEO CÂU (thầy 30/10 «cái vòng tiến độ này phụ thuộc chặng đó bao nhiêu câu thì chia thành bấy nhiêu đoạn, xong câu nào thì đoạn câu đó
// đồng bộ tức thì tô màu, làm khít lại hơn nữa và hiệu ứng tinh tế hơn nữa»; VongDoan ở src/components/hoc-tap/TrongHs.tsx).
// Khoá: số đoạn = số câu của chặng (ranh 6 câu; chặng đang dở trên máy ⇒ số câu THẬT của chặng) · số đoạn tô = số câu đã nộp · lần đầu vẽ ⇒ không đoạn
// nào chạy hiệu ứng; quay lại sau khi làm thêm câu ⇒ CHỈ đoạn mới chạy (so le) · vòng 100 px, nét 7 đầu tròn, không mặt nạ 4 khe.
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu' }))
vi.mock('../src/lib/phan-hoi', () => ({ phanHoi: vi.fn() }))
import { MotTrangHs, type PropsMotTrang } from '../src/components/hoc-tap/TrongHs'
import { batGoiNgay, luuChangDangLam } from '../src/components/hoc-tap/mo-chang-truoc'

const noop = () => {}
const goc = (so: PropsMotTrang['so']): PropsMotTrang => ({
  so, dangTai: false, tenBai: 'Amine', viec: 'Hiểu · Chặng 3/5', onHoc: noop, khoaHoc: false, hetCau: false, coCa: false, onThi: noop, soSua: 0, onChua: noop,
  ngayKiem: false, soBaiTap: 0, coBaiTap: false, onBaiTap: noop, ghi: [],
})
const so = (daLam: number, chang: number) => ({ daLam, muc: 30, chang, soChang: 5 }) as PropsMotTrang['so']
const nutDang = () => within(screen.getByRole('list', { name: 'Lộ trình hôm nay' })).getAllByRole('listitem').map((li) => li.firstElementChild as HTMLElement)
  .find((n) => n.getAttribute('data-loai') === 'hoc' && n.getAttribute('data-tt') === 'dang')!
const doan = () => [...nutDang().querySelectorAll('.da-vong[data-doan] circle')]
afterEach(() => { cleanup(); batGoiNgay(false); try { localStorage.clear(); sessionStorage.clear() } catch { /* bỏ qua */ } })

describe('vòng tiến độ chia theo câu', () => {
  it('chặng 6 câu, đã làm 2 ⇒ 6 đoạn, 2 đoạn đầu tô; lần đầu vẽ không đoạn nào chạy hiệu ứng', () => {
    render(<MotTrangHs {...goc(so(14, 3))} />)
    expect(doan()).toHaveLength(6)
    expect(doan().map((c) => c.getAttribute('class'))).toEqual(['chay', 'chay', 'nen', 'nen', 'nen', 'nen'])
    expect(doan().some((c) => c.hasAttribute('data-moi'))).toBe(false)
  })
  it('quay lại Lộ trình sau khi làm thêm 2 câu ⇒ CHỈ hai đoạn mới chạy hiệu ứng, so le', () => {
    const { unmount } = render(<MotTrangHs {...goc(so(13, 3))} />)
    expect(doan().filter((c) => c.getAttribute('class') === 'chay')).toHaveLength(1)
    unmount()
    render(<MotTrangHs {...goc(so(15, 3))} />)
    const moi = doan().filter((c) => c.hasAttribute('data-moi'))
    expect(moi.map((c) => doan().indexOf(c))).toEqual([1, 2])
    expect(moi.map((c) => (c as SVGElement).style.getPropertyValue('--tre'))).toEqual(['0ms', '160ms'])
  })
  it('chặng đang dở trên máy có 3 câu thật ⇒ 3 đoạn (không theo ranh 6), tô đúng số câu đã nộp', () => {
    batGoiNgay(true)
    const cau = Array.from({ length: 3 }, (_, i) => ({ qid: `c${i}`, phan: 'I', text: `Câu ${i}`, choices: ['A', 'B', 'C', 'D'], hinhAnh: [], ideas: [], kienThuc: [] }))
    luuChangDangLam('s1', {
      moLuc: Date.now(), phien: 'p', cau, soGoc: 3, viTri: 1, ket: { c0: { correct: true, answer: 'A' } }, tra: '', chang: 3, goi7: undefined, dem: { daLam: 16, muc: 30 },
      moi: { qids: ['c0'], tiep: 0, d0: 15, ngay: '' }, tuLam: true, goiY: false, moLoiGiai: false, msCau: {}, dhMs: 0, dhT: { v: 1, a: 0, l: 0, n: 0, lang: 0 },
      daXinLamLai: false, luotChang: 0, daHoiThay: '', hoTroCham: '',
    } as never)
    render(<MotTrangHs {...goc(so(15, 3))} />)
    expect(doan()).toHaveLength(3)
    expect(doan().filter((c) => c.getAttribute('class') === 'chay')).toHaveLength(1)
  })
  it('khít hơn, tinh tế: vòng 100 px, nét 7 đầu tròn, bỏ mặt nạ 4 khe; giảm chuyển động ⇒ đứng yên', () => {
    const css = readFileSync('src/styles/trong-hs.css', 'utf8')
    expect(css).toContain("[data-trong='hs'] .da-vong[data-doan] { width: 100px; height: 100px; top: calc(50% - 3px); -webkit-mask: none; mask: none; }")
    expect(css).toContain("[data-trong='hs'] .da-vong[data-doan] circle { stroke-width: 7; stroke-linecap: round; }")
    expect(css).toMatch(/prefers-reduced-motion: reduce\) \{ \[data-trong='hs'\] \.da-nut\[data-tt='dang'\] \.da-vong\[data-doan\], \[data-trong='hs'\] \.da-vong\[data-doan\] \.chay\[data-moi\] \{ animation: none !important; \} \}/)
  })
})
