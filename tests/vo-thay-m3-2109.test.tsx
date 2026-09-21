// APP GIÁO VIÊN · G1 — vỏ Material 3 (thầy chốt 21/09): điều hướng TRÁI, rail, thanh đáy ĐỦ mục, màn Cài đặt, giao diện sáng/tối.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import ThanhBenTrai, { MUC_DIEU_HUONG, mucDangSang } from '../src/components/ThanhBenTrai'
import BottomNav from '../src/components/BottomNav'
import { useAppStore } from '../src/store/appStore'
import { apDungGiaoDien, datGiaoDien, docGiaoDien, KHOA_GIAO_DIEN, vietLaiMedia } from '../src/lib/giao-dien-thay'

vi.mock('../src/components/KhoiMayChuMoi', () => ({ default: () => <div>khối máy chủ</div> }))
vi.mock('../src/components/KhoiMatKhauApp', () => ({ default: () => <div>khối mật khẩu</div> }))
import CaiDatScreen from '../src/screens/CaiDatScreen'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const CSS = doc('src/styles/vo-thay.css')
const APP = doc('src/App.tsx')
beforeEach(() => useAppStore.getState().setScreen('examhub'))
afterEach(() => {
  cleanup()
  localStorage.clear()
  document.documentElement.removeAttribute('data-giao-dien')
})

describe('danh sách mục dùng chung (ngăn kéo · rail · thanh đáy)', () => {
  it('8 mục đúng thứ tự bản vẽ; Cài đặt là mục đáy; nhãn cũ mà test khác khoá còn nguyên', () => {
    expect(MUC_DIEU_HUONG.map((m) => m.id)).toEqual(['examhub', 'hocsinh', 'lichsuca', 'nganhangde', 'giaobtvn', 'goilenbang', 'cauhoi', 'caidat'])
    expect(MUC_DIEU_HUONG.filter((m) => m.cuoi).map((m) => m.id)).toEqual(['caidat'])
    const ten = Object.fromEntries(MUC_DIEU_HUONG.map((m) => [m.id, m.ten]))
    expect(ten).toMatchObject({ examhub: 'Hôm nay', giaobtvn: 'Giao bài tập về nhà', goilenbang: 'Gọi lên bảng', cauhoi: 'Học sinh hỏi', caidat: 'Cài đặt' })
  })

  it('màn con tô sáng mục cha: ExamMonitor + ExamSetup → Ca thi; classlist → Học sinh; màn lạ → không mục nào', () => {
    expect(mucDangSang('exammonitor')).toBe('lichsuca')
    expect(mucDangSang('examsetup')).toBe('lichsuca')
    expect(mucDangSang('classlist')).toBe('hocsinh')
    expect(mucDangSang('caidat')).toBe('caidat')
    expect(mucDangSang('examtake')).toBeNull()
  })
})

describe('ThanhBenTrai (ngăn kéo / rail)', () => {
  it('mỗi mục là một nút có aria-label đầy đủ; bấm là đổi màn; mục đang ở có aria-current', () => {
    render(<ThanhBenTrai />)
    const nav = screen.getByRole('navigation', { name: 'Điều hướng chính' })
    expect(nav.classList.contains('ben-trai')).toBe(true)
    for (const m of MUC_DIEU_HUONG) expect(screen.getByRole('button', { name: m.ten })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Hôm nay' }).getAttribute('aria-current')).toBe('page')
    fireEvent.click(screen.getByRole('button', { name: 'Gọi lên bảng' }))
    expect(useAppStore.getState().screen).toBe('goilenbang')
    fireEvent.click(screen.getByRole('button', { name: 'Cài đặt' }))
    expect(useAppStore.getState().screen).toBe('caidat')
  })

  it('nút "Mở ca kiểm tra" → examsetup; KHÔNG có huy hiệu số ở mục Học sinh hỏi (chưa có lệnh đếm nhẹ ở máy chủ — huy hiệu chết đã gỡ)', () => {
    const a = render(<ThanhBenTrai />)
    fireEvent.click(screen.getByRole('button', { name: 'Mở ca kiểm tra' }))
    expect(useAppStore.getState().screen).toBe('examsetup')
    expect(a.container.querySelector('.ben-trai-huy-hieu')).toBeNull()
  })
})

describe('BottomNav (< 880 px) — ĐỦ mục', () => {
  it('bốn mục chính + Thêm; tờ Thêm chứa đúng bốn mục còn lại → hợp lại đủ cả 8', () => {
    render(<BottomNav />)
    for (const t of ['Hôm nay', 'Học sinh', 'Ca kiểm tra', 'Bài tập', 'Thêm']) expect(screen.getByText(t)).toBeTruthy()
    expect(screen.queryByRole('menu')).toBeNull()
    fireEvent.click(screen.getByText('Thêm'))
    const items = screen.getAllByRole('menuitem').map((e) => e.textContent)
    expect(items).toEqual(['Ngân hàng đề', 'Gọi lên bảng', 'Học sinh hỏi', 'Cài đặt'])
    expect(screen.getByText('Thêm').closest('button')!.getAttribute('aria-expanded')).toBe('true')
    fireEvent.click(screen.getByRole('menuitem', { name: 'Ngân hàng đề' }))
    expect(useAppStore.getState().screen).toBe('nganhangde')
    expect(screen.queryByRole('menu')).toBeNull() // chọn xong tờ tự đóng
  })

  it('tab Học sinh bấm được (test cũ tim-thay-giao-bai-tap); nút nổi Mở ca → examsetup; mục trong tờ Thêm đang ở thì nút Thêm sáng', () => {
    render(<BottomNav />)
    fireEvent.click(screen.getByText('Học sinh'))
    expect(useAppStore.getState().screen).toBe('hocsinh')
    fireEvent.click(screen.getByRole('button', { name: 'Mở ca kiểm tra' }))
    expect(useAppStore.getState().screen).toBe('examsetup')
    cleanup()
    useAppStore.getState().setScreen('goilenbang')
    render(<BottomNav />)
    expect(screen.getByText('Thêm').closest('button')!.className).toContain('dang')
  })
})

describe('BottomNav — nút nổi Mở ca không đè màn theo dõi ca (G4)', () => {
  it.each(['exammonitor', 'examsetup'] as const)('ở màn %s KHÔNG có nút nổi; ở màn khác vẫn có', (man) => {
    useAppStore.getState().setScreen(man)
    render(<BottomNav />)
    expect(screen.queryByRole('button', { name: 'Mở ca kiểm tra' })).toBeNull()
    cleanup()
    useAppStore.getState().setScreen('hocsinh')
    render(<BottomNav />)
    expect(screen.getByRole('button', { name: 'Mở ca kiểm tra' })).toBeTruthy()
  })
})

describe('vo-thay.css: ba dạng, một nguồn màu, không hex / !important', () => {
  const sach = CSS.replace(/\/\*[\s\S]*?\*\//g, '')
  it('ngưỡng 880 / 1100 px; rail 88 px, ngăn kéo 264 px; thanh đáy chỉ < 880; mặc định thanh trái ẩn', () => {
    expect(sach).toMatch(/\.ben-trai \{\s*display: none;/)
    expect(sach).toMatch(/@media \(min-width: 880px\)[\s\S]*grid-template-columns: 88px minmax\(0, 1fr\)/)
    expect(sach).toMatch(/@media \(min-width: 1100px\)[\s\S]*grid-template-columns: 264px minmax\(0, 1fr\)/)
    expect(sach).toMatch(/@media \(max-width: 879px\)[\s\S]*\.day-thay \{\s*display: block/)
    expect(sach).toMatch(/\.day-thay \{\s*display: none;/)
  })

  it('màu chỉ qua token --m3-*; KHÔNG hex, KHÔNG !important; nút nội dung 40 px chỉ ở màn rộng', () => {
    expect(sach).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(sach).not.toContain('!important')
    expect(sach).toContain('var(--m3-primary-container)')
    expect(sach).toContain('var(--m3-bo-28)')
    expect(sach).toMatch(/@media \(min-width: 880px\)[\s\S]*\.vo-thay \.giua-noi-dung button \{\s*min-height: 40px/)
  })

  it('index.css không còn vỏ cũ (.khung-app, .tay-keo, thanh PHẢI); ThanhBenTrai không còn tay kéo', () => {
    const idx = doc('src/index.css')
    expect(idx).not.toContain('.khung-app')
    expect(idx).not.toContain('.tay-keo')
    expect(doc('src/components/ThanhBenTrai.tsx')).not.toContain('TayKeo')
  })
})

describe('App.tsx: vỏ giáo viên', () => {
  it('gốc mang m3 m3-thay vo-thay; ThanhBenTrai đứng TRƯỚC khung nội dung; có màn caidat; áp giao diện khi mở', () => {
    expect(APP).toContain("`min-h-screen m3 m3-thay${laManThi ? '' : ' vo-thay'}`")
    expect(APP.indexOf('<ThanhBenTrai />')).toBeLessThan(APP.indexOf('<div className="khung-noi-dung">'))
    expect(APP).toContain("caidat: 'Cài đặt'")
    expect(APP).toContain("{screen === 'caidat' && <CaiDatScreen />}")
    expect(APP).toContain('if (canHoi) apDungGiaoDien(docGiaoDien())')
    expect(APP).toContain("import './styles/vo-thay.css'")
  })
})

describe('giao diện sáng / tối / theo máy', () => {
  it('đặt sáng/tối → thuộc tính data-giao-dien + nhớ localStorage; theo máy → gỡ thuộc tính và khoá', () => {
    datGiaoDien('toi')
    expect([document.documentElement.getAttribute('data-giao-dien'), localStorage.getItem(KHOA_GIAO_DIEN), docGiaoDien()]).toEqual(['toi', 'toi', 'toi'])
    datGiaoDien('sang')
    expect(document.documentElement.getAttribute('data-giao-dien')).toBe('sang')
    datGiaoDien('may')
    expect([document.documentElement.getAttribute('data-giao-dien'), localStorage.getItem(KHOA_GIAO_DIEN), docGiaoDien()]).toEqual([null, null, 'may'])
    localStorage.setItem(KHOA_GIAO_DIEN, 'lạ')
    expect(docGiaoDien()).toBe('may') // giá trị lạ = theo máy
    apDungGiaoDien('toi')
    expect(document.documentElement.getAttribute('data-giao-dien')).toBe('toi')
  })

  it('CaiDatScreen: ba khối (Giao diện, máy chủ, mật khẩu); chọn Tối / Theo máy đổi aria-checked và thuộc tính', () => {
    render(<CaiDatScreen />)
    expect(screen.getByRole('heading', { name: 'Cài đặt' })).toBeTruthy()
    expect(screen.getByText('khối máy chủ')).toBeTruthy()
    expect(screen.getByText('khối mật khẩu')).toBeTruthy()
    const nhom = screen.getByRole('radiogroup', { name: 'Giao diện' })
    expect(nhom.querySelectorAll('[role=radio]')).toHaveLength(3)
    expect(screen.getByRole('radio', { name: 'Theo máy' }).getAttribute('aria-checked')).toBe('true')
    fireEvent.click(screen.getByRole('radio', { name: 'Tối' }))
    expect(screen.getByRole('radio', { name: 'Tối' }).getAttribute('aria-checked')).toBe('true')
    expect(document.documentElement.getAttribute('data-giao-dien')).toBe('toi')
    fireEvent.click(screen.getByRole('radio', { name: 'Theo máy' }))
    expect(document.documentElement.hasAttribute('data-giao-dien')).toBe(false)
  })
})

describe('ép sáng / tối: viết lại điều kiện `prefers-color-scheme` của mọi luật (một nguồn màu, không bản sao)', () => {
  it('vietLaiMedia: tối → dark đúng, light sai; sáng → ngược lại; theo máy → nguyên văn; giữ điều kiện đi kèm và cả dạng viết liền', () => {
    const D = '(prefers-color-scheme: dark)'
    const L = '(prefers-color-scheme:light)'
    expect(vietLaiMedia(D, 'toi')).toBe('(min-width: 0px)')
    expect(vietLaiMedia(D, 'sang')).toBe('(min-width: 999999px)')
    expect(vietLaiMedia(L, 'toi')).toBe('(min-width: 999999px)')
    expect(vietLaiMedia(L, 'sang')).toBe('(min-width: 0px)')
    expect(vietLaiMedia(D, 'may')).toBe(D)
    expect(vietLaiMedia('(min-width: 880px) and (prefers-color-scheme: dark)', 'toi')).toBe('(min-width: 880px) and (min-width: 0px)')
    expect(vietLaiMedia('print', 'toi')).toBe('print')
  })

  it('áp dụng lên tờ kiểu THẬT: khối dark bị viết lại khi ép, và trả về nguyên văn khi chọn theo máy', () => {
    const st = document.createElement('style')
    st.textContent = '@media (prefers-color-scheme: dark) { .x { color: red } } @media (min-width: 10px) { .y { color: blue } }'
    document.head.appendChild(st)
    const goc = () => (Array.from(st.sheet!.cssRules) as CSSMediaRule[]).map((r) => r.media.mediaText)
    const truoc = goc()
    apDungGiaoDien('sang')
    expect(goc()[0]).not.toContain('prefers-color-scheme')
    expect(goc()[0]).toContain('999999')
    expect(goc()[1]).toBe(truoc[1]) // khối không liên quan không đụng tới
    apDungGiaoDien('toi')
    expect(goc()[0]).toContain('(min-width: 0px)')
    apDungGiaoDien('may')
    expect(goc()[0]).toBe(truoc[0])
    st.remove()
  })
})

describe('G1c: token M3 cho lớp CSS của màn thầy', () => {
  it('exam-setup.css hết mã hex, bốn bước dùng bốn vai trò M3 (không còn Google 4 màu); teacher-layout.css dùng --m3-primary thay --gg-xanh', () => {
    const es = doc('src/screens/exam-setup.css')
    expect(es).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    for (const [id, vai] of [['setup-source', 'primary'], ['setup-info', 'tertiary'], ['setup-people', 'secondary'], ['setup-wait', 'error']]) expect(es).toContain(`#${id}>summary{border-left-color:var(--m3-${vai})}`)
    const tl = doc('src/styles/teacher-layout.css')
    expect(tl).not.toContain('--gg-xanh')
    expect(tl).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(tl).toContain('var(--m3-primary)')
  })

  it('bộ sinh lớp tương thích quét các màn giáo viên: m3-tuong-thich.css có luật cho lớp màu của họ và vẫn chỉ dưới `.m3 `', () => {
    const css = doc('src/components/m3/m3-tuong-thich.css')
    expect(css).toContain('ExamSetupScreen.tsx')
    expect(css).toContain('GoiLenBangScreen.tsx')
    const dong = css.split('\n').map((l) => l.trim()).filter((l) => l.includes('{') && !l.startsWith('/*') && !l.startsWith('*') && !l.startsWith('@'))
    expect(dong.length).toBeGreaterThan(100)
    for (const l of dong) for (const sel of l.split('{')[0].split(',')) expect(sel.trim().startsWith('.m3 '), sel).toBe(true)
  })
})
