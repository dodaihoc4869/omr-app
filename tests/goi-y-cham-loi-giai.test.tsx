// LỜI GIẢI KIỂU SƠ ĐỒ (làn B, 26/10): kết quả nộp có `soDo` ⇒ THAY lời giải chữ / bước / kết quả bằng sơ đồ của thầy (lý do từng phương án giữ);
// không có `soDo` hoặc bản hỏng ⇒ lời giải cũ như cũ.
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import KhoiLoiGiaiChuan from '../src/components/loi-giai/KhoiLoiGiaiChuan'
import { KhoiLoiGiaiCoSoDo } from '../src/components/goi-y-cham/thay-bang-so-do'
import { BAN_PYRITE } from './_goi-y-cham-gia'

afterEach(cleanup)
const LG = { chot: 'Bảo toàn S: n SO2 = 2 n FeS2.', buoc: ['n FeS2 = 80000/120', 'm SO2 = 2 · n · 64 · 0,9'], ketQua: '76,8' }

describe('KhoiLoiGiaiCoSoDo (soDo)', () => {
  it('có soDo ⇒ sơ đồ + chuỗi tính có kết quả, ẩn lời giải chữ cũ', async () => {
    render(<KhoiLoiGiaiCoSoDo phan="III" loiGiai={LG} correct="76,8" soDo={BAN_PYRITE} />)
    await screen.findByText('Tóm tắt của thầy Đỗ Đại Học')
    expect(screen.getByText('H = 90%')).toBeTruthy()
    expect(screen.getByText('= 76,8 kg')).toBeTruthy()
    expect(screen.getByText(/Kết quả:/).textContent).toContain('76,8')
    expect(screen.queryByText(/80000\/120/)).toBeNull()
    expect(screen.queryByText('Kiến thức cốt lõi')).toBeNull()
    expect(screen.getByText('LỜI GIẢI')).toBeTruthy()
    expect(document.querySelector('.gyc-bong-so')).toBeNull()
    expect([...document.querySelectorAll('.gyc-dong-yn')].map((d) => d.textContent).join(' ')).toContain('tính xuôi')
  })

  it('không có soDo ⇒ lời giải cũ y như trước (cùng DOM với KhoiLoiGiaiChuan)', () => {
    const a = render(<KhoiLoiGiaiChuan phan="III" loiGiai={LG} correct="76,8" />).container.innerHTML
    cleanup()
    render(<KhoiLoiGiaiCoSoDo phan="III" loiGiai={LG} correct="76,8" />)
    expect(document.body.firstElementChild!.innerHTML).toBe(a)
    expect(screen.getByText('Kiến thức cốt lõi')).toBeTruthy()
    expect(screen.getByText(/80000/)).toBeTruthy()
    expect(screen.queryByText('Tóm tắt của thầy Đỗ Đại Học')).toBeNull()
  })

  it('soDo hỏng ⇒ lời giải cũ (dự phòng)', async () => {
    render(<KhoiLoiGiaiCoSoDo phan="III" loiGiai={LG} correct="76,8" soDo={{ qid: 'x' }} />)
    expect(await screen.findByText('Kiến thức cốt lõi')).toBeTruthy()
    expect(screen.getByText(/80000/)).toBeTruthy()
  })

  it('Phần I: lý do từng phương án vẫn giữ khi có soDo', async () => {
    render(<KhoiLoiGiaiCoSoDo phan="I" correct="B" loiGiai={{ chot: 'x', tungPa: { A: { dung: false, viSao: 'Thiếu hiệu suất.' }, B: { dung: true, viSao: 'Đúng chuỗi.' } } }} soDo={BAN_PYRITE} />)
    await screen.findByText('Tóm tắt của thầy Đỗ Đại Học')
    expect(screen.getByText('Thiếu hiệu suất.')).toBeTruthy()
    expect(document.querySelector('.lg-y[data-dung="1"] .lg-ma')!.textContent).toBe('B.')
  })
})

describe('27/10 thầy (ảnh paracetamol): mũ, tên chất làm chỉ số, không đè chữ', () => {
  it('ChuCo: số mũ ⇒ ký tự mũ Unicode; tên chất sau «_» ⇒ cả tên hạ chỉ số; công thức giữ như cũ', async () => {
    const { ChuCo } = await import('../src/components/goi-y-cham/so-do-thay')
    const h = (chu: string) => { const r = render(<ChuCo chu={chu} />); const v = r.container.innerHTML; r.unmount(); return v }
    expect(h('1,5·10^6 viên thuốc')).toBe('1,5·10⁶ viên thuốc')
    expect(h('10^-6')).toBe('10⁻⁶')
    expect(h('n_paracetamol')).toBe('n<sub class="gyc-cs">paracetamol</sub>')
    expect(h('n_p-nitrophenol')).toBe('n<sub class="gyc-cs">p-nitrophenol</sub>')
    expect(h('FeS_2')).toBe('FeS<sub class="gyc-cs">2</sub>')
    expect(h('H_2SO_4')).toBe('H<sub class="gyc-cs">2</sub>SO<sub class="gyc-cs">4</sub>')
    expect(h('C_nH_{2n}')).toBe('C<sub class="gyc-cs">n</sub>H<sub class="gyc-cs">2n</sub>')
    expect(h('n_CO2')).toBe('n<sub class="gyc-cs">CO₂</sub>')
  })
})

describe('27/10 thầy: V_mL, n_H2SO4, sơ đồ luôn ngang', () => {
  it('ChuCo đọc đúng chỉ số đơn vị / công thức', async () => {
    const { ChuCo } = await import('../src/components/goi-y-cham/so-do-thay')
    const h = (chu: string) => { const r = render(<ChuCo chu={chu} />); const v = r.container.innerHTML; r.unmount(); return v }
    expect(h('V_mL')).toBe('V<sub class="gyc-cs">mL</sub>')
    expect(h('n_H2SO4')).toBe('n<sub class="gyc-cs">H₂SO₄</sub>')
  })
})

describe('27/10 thầy: không còn «_» trong câu giải nghĩa', () => {
  it('ChuTron hạ chỉ số kí hiệu trong câu, giữ phần chữ', async () => {
    const { ChuTron } = await import('../src/components/goi-y-cham/so-do-thay')
    const r = render(<ChuTron chu="số mol: n_paracetamol × 1, rồi m_{CO2}" />)
    expect(r.container.textContent).not.toContain('_')
    expect(r.container.querySelectorAll('sub.gyc-cs').length).toBe(2)
  })
})
