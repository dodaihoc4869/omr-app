// Việc C · nhóm B (Code 4): luyện đề + khắc phục — LuyenDeChuan, KhoiKhacPhuc3CheDo, ModalKhacPhucCauSai, KhoiCauSai.
// Ba thứ được khoá ở đây: (1) tệp CSS tương thích SINH TỰ ĐỘNG khớp bản sinh lại và không rò ra ngoài `.m3`;
// (2) cặp màu ĐÚNG / SAI vẫn phân biệt rõ ở sáng lẫn tối sau ánh xạ; (3) từng component: có `m3` ở gốc dưới cổng học sinh,
// KHÔNG có dưới app giáo viên (ModalKhacPhucCauSai dùng chung), bấm được, không mất chữ.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
// @ts-expect-error — tệp .mjs của scripts/, không có khai báo kiểu
import { sinh, quetLop, TEP } from '../scripts/sinh-m3-tuong-thich.mjs'
import LuyenDeChuan from '../src/components/LuyenDeChuan'
import KhoiKhacPhuc3CheDo from '../src/components/KhoiKhacPhuc3CheDo'
import ModalKhacPhucCauSai from '../src/components/ModalKhacPhucCauSai'
import { DongCauSai } from '../src/components/KhoiCauSai'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ URL: 'https://may.test' }), xongNapDiaChi: async () => {} }))

const goc = process.cwd()
const CSS_TT = fs.readFileSync(path.join(goc, 'src/components/m3/m3-tuong-thich.css'), 'utf8')
const THEME = fs.readFileSync(path.join(goc, 'src/components/bang-nhiem-vu/m3-theme.css'), 'utf8')

const datDuong = (d: string) => window.history.replaceState(null, '', d)
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  datDuong('/')
})

describe('m3-tuong-thich.css (tệp SINH — scripts/sinh-m3-tuong-thich.mjs)', () => {
  it('khớp bản sinh lại từ danh sách TEP (không ai sửa tay, không tệp nào bị bỏ sót)', () => {
    expect(CSS_TT).toBe(sinh())
    expect(TEP.map((t: string) => path.basename(t))).toEqual(
      expect.arrayContaining(['KhoiCauSai.tsx', 'KhoiKhacPhuc3CheDo.tsx', 'LuyenDeChuan.tsx', 'ModalKhacPhucCauSai.tsx']), // + nhóm C: xem m3-c-1909
    )
    expect(CSS_TT.split('\n')[0]).toContain('TỆP SINH TỰ ĐỘNG — sửa scripts/sinh-m3-tuong-thich.mjs')
  })

  it('MỌI bộ chọn đều mang tiền tố `.m3 ` — không có luật trần, không chạm .bnv hay game', () => {
    const dong = CSS_TT.split('\n').filter((l) => l.includes('{') && !l.startsWith('/*') && !l.startsWith(' *') && !l.startsWith('@media'))
    expect(dong.length).toBeGreaterThan(50)
    for (const l of dong) expect(l.trim().startsWith('.m3 '), l).toBe(true)
    expect(dong.join('\n')).not.toMatch(/\.bnv/)
    expect(CSS_TT).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
  })

  it('luật dark: chỉ nằm trong @media (prefers-color-scheme: dark); màu chỉ là biến --m3-*', () => {
    const [truocMedia, saoMedia] = CSS_TT.split('@media (prefers-color-scheme: dark) {')
    expect(truocMedia).not.toMatch(/dark\\:/)
    expect(saoMedia).toMatch(/dark\\:/)
    for (const m of CSS_TT.matchAll(/(?:background-color|color|border-color|accent-color|--tw-ring-color):\s*([^;]+);/g)) {
      expect(m[1], m[0]).toMatch(/^(var\(--m3-[a-z-]+\)|transparent)$/)
    }
  })

  it('mọi lớp MÀU dùng trong 4 tệp đều có luật (trừ `text-white` trần: giữ trắng trên gradient/ảnh)', () => {
    const co = new Set<string>()
    for (const m of CSS_TT.matchAll(/^\s*\.m3 (?:\.group:hover )?\.(.+?) \{/gm)) co.add(m[1].replace(/\\(.)/g, '$1').replace(/:(hover|focus|active|disabled)$/, ''))
    const thieu: string[] = []
    for (const t of TEP) {
      for (const [ten, c] of quetLop(fs.readFileSync(path.join(goc, t), 'utf8')) as Map<string, any>) {
        if (ten === 'text-white') continue
        if (c.tienIch === 'divide') continue
        if (![...co].some((x) => x === ten || x.startsWith(ten + '.'))) thieu.push(`${path.basename(t)}: ${ten}`)
      }
    }
    expect(thieu).toEqual([])
  })

  it('không rò: dưới KHÔNG có `.m3` (game thần thú, app giáo viên) không luật nào khớp; bọc `.m3` thì khớp', () => {
    const chon: string[] = []
    for (const m of CSS_TT.matchAll(/^\s*(\.m3 \.[^{]+?) \{/gm)) {
      const s = m[1].replace(/:(hover|focus|active|disabled)$/, '')
      if (!s.includes('>')) chon.push(s)
    }
    const lop = chon.map((s) => s.replace(/^\.m3 /, ''))
    const nhan = (h: string) => `<div>${lop.slice(0, 200).map((s, i) => `<span data-i="${i}" class="${s.replace(/^\./, '').split('.').join(' ').replace(/\\/g, '')}">x</span>`).join('')}</div>`
    const a = document.createElement('div')
    a.innerHTML = nhan('')
    document.body.appendChild(a)
    for (const s of chon.slice(0, 200)) expect(a.querySelectorAll(s).length, s).toBe(0) // không có .m3 tổ tiên
    a.className = 'm3'
    let khop = 0
    for (const s of chon.slice(0, 200)) khop += a.querySelectorAll(s).length > 0 ? 1 : 0
    expect(khop).toBeGreaterThan(50)
    a.remove()
  })
})

// ── cặp ĐÚNG / SAI phải phân biệt rõ (0.Planer điều 2) ────────────────────────────────
function rgb(s: string): [number, number, number] {
  const m = s.match(/rgb\((\d+)\s+(\d+)\s+(\d+)\)/)!
  return [Number(m[1]), Number(m[2]), Number(m[3])]
}
const lum = ([r, g, b]: number[]) => {
  const f = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
const tuongPhan = (a: number[], b: number[]) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05)
function hue([r, g, b]: number[]) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn
  if (d === 0) return 0
  const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4
  return (h * 60 + 360) % 360
}
function bien(css: string, ten: string) {
  const m = css.match(new RegExp(`--m3-${ten}:\\s*(rgb\\([^)]+\\))`))
  if (!m) throw new Error('thiếu biến ' + ten)
  return rgb(m[1])
}
describe('cặp màu ĐÚNG (tertiary) / SAI (error) sau ánh xạ', () => {
  const [sang, toi] = [THEME.split('@media (prefers-color-scheme: dark)')[0], THEME.split('@media (prefers-color-scheme: dark)')[1]]
  for (const [ten, css] of [['sáng', sang], ['tối', toi]] as const) {
    it(`${ten}: mỗi vai trò đủ tương phản (≥ 4,5) trên nền của nó và hai nền ĐÚNG/SAI khác sắc rõ`, () => {
      const dung = bien(css, 'tertiary-container'), chuDung = bien(css, 'on-tertiary-container'), nhanDung = bien(css, 'tertiary')
      const sai = bien(css, 'error-container'), chuSai = bien(css, 'on-error-container'), nhanSai = bien(css, 'error')
      expect(tuongPhan(dung, chuDung)).toBeGreaterThanOrEqual(4.5)
      expect(tuongPhan(sai, chuSai)).toBeGreaterThanOrEqual(4.5)
      expect(tuongPhan(dung, nhanDung)).toBeGreaterThanOrEqual(4.5) // chữ/biểu tượng màu đậm trên nền tonal (text-emerald-600 → tertiary)
      expect(tuongPhan(sai, nhanSai)).toBeGreaterThanOrEqual(4.5)
      const lech = Math.abs(hue(dung) - hue(sai))
      expect(Math.min(lech, 360 - lech)).toBeGreaterThanOrEqual(60)
    })
  }
})

// ── LuyenDeChuan (chỉ học sinh) ─────────────────────────────────────────────────────────
const BANK = {
  phanI: [{ id: 'a1', text: 'Ancol nào là ancol bậc II?', choices: ['CH3–CH2–OH', 'CH3–CH(OH)–CH3', '(CH3)3C–OH', 'CH3–OH'] }],
  phanII: [{ id: 'b1', text: 'Mỗi phát biểu đúng hay sai?', ideas: ['a', 'b', 'c', 'd'] }],
  phanIII: [{ id: 'c1', text: 'Tính V lít CO2.' }],
}
function giaLapLuyen(coBaiDangLam = true) {
  const cuoc: string[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const u = new URL(String(url)).pathname
      cuoc.push(u)
      const ok = (b: unknown) => ({ ok: true, status: 200, json: async () => b })
      if (u.endsWith('/history')) return ok({ ok: true, items: coBaiDangLam ? [{ id: 'p1', createdAt: Date.now(), status: 'active', score: null }] : [] })
      return ok({ ok: true, id: 'p1', status: 'active', deadline: Date.now() + 40 * 60000, serverNow: Date.now(), answers: {}, bank: BANK })
    }),
  )
  return cuoc
}

describe('LuyenDeChuan', () => {
  it('màn chưa mở bài: gốc `m3`, không emoji, nút chính bị khoá tới khi tick "Em đã học xong", nhãn tick ≥ 48 px vùng chạm', async () => {
    datDuong('/hs')
    giaLapLuyen(false)
    const { container } = render(<LuyenDeChuan sbd="12001" token="t" />)
    const goc = container.firstElementChild as HTMLElement
    expect(goc.classList.contains('m3')).toBe(true)
    expect(goc.textContent).not.toMatch(/✨/)
    expect(goc.textContent).toContain('Chuẩn Bộ GD&ĐT 2026')
    const bat = screen.getByRole('button', { name: 'Bắt đầu / Tiếp tục bài luyện' }) as HTMLButtonElement
    expect(bat.className).toContain('m3-nut-chinh')
    expect(bat.disabled).toBe(true)
    const tick = screen.getByRole('checkbox', { name: 'Em đã học xong toàn bộ chương trình.' })
    expect(tick.closest('label')!.className).toContain('min-h-[48px]')
    fireEvent.click(tick)
    expect(bat.disabled).toBe(false)
  })

  it('mở bài đang làm: tấm toàn màn `m3 m3-man-lam`, đồng hồ + Nộp bài (nút chính), Quay lại trả về danh sách', async () => {
    datDuong('/hs')
    const cuoc = giaLapLuyen(true)
    render(<LuyenDeChuan sbd="12001" token="t" />)
    fireEvent.click(await screen.findByRole('button', { name: /^Tiếp tục bài luyện/ }))
    const man = await waitFor(() => {
      const el = document.querySelector('.m3-man-lam')
      if (!el) throw new Error('chưa mở')
      return el as HTMLElement
    })
    expect(man.classList.contains('m3')).toBe(true)
    expect(cuoc.some((u) => u.endsWith('/luyen-de/open'))).toBe(true)
    expect(screen.getByLabelText('Thời gian còn lại').textContent).toMatch(/^\d+:\d\d$/)
    const nop = screen.getByRole('button', { name: 'Nộp bài' })
    expect(nop.className).toContain('m3-nut-chinh')
    expect(document.querySelector('[data-practice-toolbar] .m3-thanh-duoi')).toBeTruthy()
    expect(screen.getByText('PHẦN I')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Quay lại danh sách luyện tập' }))
    expect(document.querySelector('.m3-man-lam')).toBeNull()
    expect(screen.getByRole('button', { name: 'Bắt đầu / Tiếp tục bài luyện' })).toBeTruthy()
  })
})

// ── KhoiKhacPhuc3CheDo (học sinh + phụ huynh) ────────────────────────────────────────────
const LICH_SU = [
  { maCa: 'CA-ANCOL', tenCa: 'Ca Ancol 15/09', tong: 7.75, tongCau: 28, soCauDung: 20, soCauSai: 8, soCauBoTrong: 0 },
  { maCa: 'CA-ESTE', tenCa: 'Ca Este 12/09', tong: 9, tongCau: 28, soCauDung: 26, soCauSai: 2, soCauBoTrong: 0 },
]
describe('KhoiKhacPhuc3CheDo', () => {
  it('gốc `m3 m3-khoi`; 4 chế độ đổi nội dung; nút chính M3 đúng chữ, chọn ca thì đổi số; nhãn học sinh / phụ huynh không đổi', async () => {
    datDuong('/hs')
    giaLapKho()
    const a = render(<KhoiKhacPhuc3CheDo sbd="12001" hoTen="Minh" dsLichSu={LICH_SU} scriptUrl="https://may.test" />)
    const goc = a.container.firstElementChild as HTMLElement
    expect(goc.tagName).toBe('SECTION')
    expect(goc.classList.contains('m3')).toBe(true)
    expect(goc.classList.contains('m3-khoi')).toBe(true)
    expect(screen.getByText('4 CHẾ ĐỘ KHẮC PHỤC CÂU SAI')).toBeTruthy()
    const cta = screen.getByRole('button', { name: 'Bắt đầu sửa câu sai (2 ca đã chọn)' })
    expect(cta.className).toContain('m3-nut-chinh')
    fireEvent.click(screen.getByText('#CA-ESTE · Ca Este 12/09'))
    expect(screen.getByRole('button', { name: 'Bắt đầu sửa câu sai (1 ca đã chọn)' })).toBeTruthy()
    for (const ten of ['1. Sửa câu sai', '2. Dạng câu sai', '3. Dạng bài', '4. Tự do']) expect(screen.getByRole('button', { name: ten })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '3. Dạng bài' }))
    expect(await screen.findByText(/Chọn lớp/i)).toBeTruthy()
    a.unmount()

    render(<KhoiKhacPhuc3CheDo sbd="12001" hoTen="Minh" dsLichSu={LICH_SU} scriptUrl="https://may.test" vaiTro="ph" />)
    expect(screen.getByText('4 CHẾ ĐỘ GIAO BÀI CHO CON')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Giao bài sửa câu sai cho con (2 ca đã chọn)' })).toBeTruthy()
    expect(screen.getByText('Thời gian làm 2 giờ')).toBeTruthy()
  })

  it('không còn lớp amber (màu nhận diện cũ) trong tệp; emoji ✨ đã bỏ', () => {
    const nd = fs.readFileSync(path.join(goc, 'src/components/KhoiKhacPhuc3CheDo.tsx'), 'utf8')
    expect(nd).not.toMatch(/(bg|text|border|ring|accent|divide)-amber-/)
    expect(nd).not.toMatch(/✨/)
  })
})

// ── ModalKhacPhucCauSai (DÙNG CHUNG: app giáo viên mở qua báo cáo ca) ─────────────────────
const CAU_SAI = [
  { qid: 'q1', soCau: 7, phan: 'I', chuyenDe: 'Ancol', mucDo: 'Nhận biết', dapAnChon: 'A', dapAnDung: 'B', text: 'Ancol nào là ancol bậc II?', choices: ['a', 'b', 'c', 'd'], maCa: 'CA-ANCOL' },
  { qid: 'q3', soCau: 9, phan: 'III', chuyenDe: 'Este', mucDo: 'Vận dụng', dapAnChon: '4,48', dapAnDung: '4,96', text: 'Tính V.', maCa: 'CA-ESTE' },
]
const dungModal = (isOpen = true, onClose = vi.fn()) =>
  render(<ModalKhacPhucCauSai isOpen={isOpen} onClose={onClose} dsCauSai={CAU_SAI as any} hoTen="Minh" sbd="12001" tieuDeCa="Ca Ancol" />)
function giaLapKho() {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ ok: true, items: [], nguon: [], ds: [] }), text: async () => '{}' })))
}
describe('ModalKhacPhucCauSai', () => {
  it('đường học sinh (/hs): lớp `m3` ở gốc, hộp `m3-hop` (không còn lớp khac-phuc-modal của bản cũ), dải 4 màu Google ẩn, bấm được', async () => {
    datDuong('/hs')
    giaLapKho()
    const onClose = vi.fn()
    dungModal(true, onClose)
    const goc = document.querySelector('.fixed.inset-0') as HTMLElement
    expect(goc.classList.contains('m3')).toBe(true)
    const hop = goc.firstElementChild as HTMLElement
    expect(hop.classList.contains('m3-hop')).toBe(true)
    expect(hop.classList.contains('khac-phuc-modal')).toBe(false)
    expect(hop.getAttribute('style') || '').not.toMatch(/rgba?\(/)
    expect(document.querySelector('.m3-an')).toBeTruthy()
    expect(screen.getByText('Khắc phục câu sai')).toBeTruthy()
    fireEvent.click(screen.getByText(/^1\. Làm lại các câu sai/))
    fireEvent.click(screen.getByRole('button', { name: 'Đóng' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('đường GIÁO VIÊN (/): KHÔNG có lớp m3 ở đâu cả; hộp giữ lớp khac-phuc-modal và nền cũ', async () => {
    datDuong('/')
    giaLapKho()
    dungModal(true)
    expect(document.querySelector('.m3'), document.querySelector('.m3')?.outerHTML.slice(0, 200)).toBeNull()
    expect(document.querySelector('[class*="m3-"]'), document.querySelector('[class*="m3-"]')?.outerHTML.slice(0, 200)).toBeNull()
    const hop = document.querySelector('.khac-phuc-modal') as HTMLElement
    expect(hop).toBeTruthy()
    expect(hop.getAttribute('style') || '').toMatch(/var\(--the/)
    expect(screen.getByText('Khắc phục câu sai')).toBeTruthy()
  })

  it('isOpen=false: không dựng gì', () => {
    datDuong('/hs')
    giaLapKho()
    const { container } = dungModal(false)
    expect(container.innerHTML).toBe('')
  })
})

// ── KhoiCauSai dưới ngữ cảnh GAME (không có `.m3`) ─────────────────────────────────────
describe('KhoiCauSai (dùng chung với game thần thú)', () => {
  it('dựng dưới cổng học sinh nhưng KHÔNG có tổ tiên `.m3`: không lớp m3 nào, chuỗi lớp test khoá còn nguyên', () => {
    datDuong('/hs')
    const { container } = render(
      <DongCauSai stt={3} c={{ qid: 'q1', phan: 'I', text: 'Ancol bậc II?', choices: ['a', 'b', 'c', 'd'], dapAnChon: 'A', dapAnDung: 'B' } as any} />,
    )
    fireEvent.click(container.querySelector('button')!)
    expect(container.querySelector('.m3')).toBeNull()
    expect(container.innerHTML).not.toMatch(/class="[^"]*\bm3-/)
    expect(container.firstElementChild!.className).toContain('rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800')
    const nd = fs.readFileSync(path.join(goc, 'src/components/KhoiCauSai.tsx'), 'utf8')
    expect(nd).toContain('bg-rose-600 text-white border border-rose-700') // dem-cau-bao-cao-1409 khoá chuỗi này
    expect(nd).toContain('block mx-auto max-w-full h-auto') // dong-nhat-bao-cao-1409
    expect(nd).toContain('max-h-[420px]')
  })
})
