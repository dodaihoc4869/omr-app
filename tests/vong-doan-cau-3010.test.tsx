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
  it('khít, cân đối (thầy 31/10): nút 80 × 74, vòng 102 px đúng tâm khối mặt + đáy, nét 5,7 đầu tròn, không mặt nạ; vòng đứng yên; giảm chuyển động ⇒ đứng yên', () => {
    const css = readFileSync('src/styles/trong-hs.css', 'utf8')
    expect(css).toContain("[data-trong='hs'] .da-nut[data-tt='dang'] { width: 80px; height: 74px; }")
    expect(css).toContain("[data-trong='hs'] .da-vong { width: 92px; height: 92px; top: calc(50% - 3px); -webkit-mask: none; mask: none; }")
    expect(css).toContain("[data-trong='hs'] .da-nut[data-tt='dang'] .da-vong { width: 102px; height: 102px; }")
    expect(css).toContain("[data-trong='hs'] .da-vong circle { stroke-width: 5.7; }")
    expect(css).toContain("[data-trong='hs'] .da-vong :is(.nen, .chay) { stroke-linecap: round; }")
    // vòng không còn nhịp thở phóng to / thu nhỏ (cả hai kiểu vòng); không luật nào đè cỡ riêng cho vòng đoạn
    expect(css).not.toMatch(/\.da-vong(\[data-doan\])? \{ animation: da-vong-tho/)
    expect(css).not.toMatch(/\.da-vong\[data-doan\] \{[^}]*width/)
    // mặt nút, sao, bong bóng: CÙNG một nhịp 2,4 s, cùng đường cong, không lệch pha
    for (const ten of ['da-mat-tho', 'da-sao-tho', 'da-bong-tho']) expect(css).toContain(`animation: ${ten} 2.4s cubic-bezier(.45, 0, .55, 1) infinite; }`)
    // mặt nút là ::after — không khớp trong :is() ⇒ luật đứng yên viết riêng (máy yếu / giảm chuyển động)
    expect(css).toContain("[data-trong='hs'].may-yeu .da-nut[data-tt='dang']::after { animation: none; }")
    expect(css).toContain("@media (prefers-reduced-motion: reduce) { [data-trong='hs'] .da-nut[data-tt='dang']::after { animation: none !important; } }")
    expect(css).toMatch(/prefers-reduced-motion: reduce\) \{ \[data-trong='hs'\] \.da-nut\[data-tt='dang'\] \.da-vong\[data-doan\], \[data-trong='hs'\] \.da-vong\[data-doan\] \.chay\[data-moi\] \{ animation: none !important; \} \}/)
  })
  it('chặng 5 mới mở (bài 8 chặng): đủ 6 câu chuẩn, 6 đoạn xám nguyên 0% khi vừa xong chặng 4', () => {
    // 24 câu đã làm (xong 4 chặng), mức 24, bài 8 chặng ⇒ chặng 1-4 xong (4/8 chặng), chặng 5 là chặng đang học
    const so8 = { daLam: 24, muc: 24, chang: 5, soChang: 8 } as PropsMotTrang['so']
    render(<MotTrangHs {...goc(so8)} />)
    expect(screen.getByText('4/8 chặng')).toBeTruthy()
    expect(doan()).toHaveLength(6) // Đủ 6 câu chuẩn, không bị bóp thành 2 câu
    expect(doan().filter((c) => c.getAttribute('class') === 'chay')).toHaveLength(0) // 0 đoạn tô màu khi chưa làm
  })
})
