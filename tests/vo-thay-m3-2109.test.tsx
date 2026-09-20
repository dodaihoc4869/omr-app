// APP GIÁO VIÊN · G1 — vỏ Material 3 (thầy chốt 21/09): điều hướng TRÁI, rail, thanh đáy ĐỦ mục, màn Cài đặt, giao diện sáng/tối.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import ThanhBenTrai, { MUC_DIEU_HUONG, mucDangSang } from '../src/components/ThanhBenTrai'
import BottomNav from '../src/components/BottomNav'
import { useAppStore } from '../src/store/appStore'
import { apDungGiaoDien, datGiaoDien, docGiaoDien, KHOA_GIAO_DIEN } from '../src/lib/giao-dien-thay'

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

  it('nút "Mở ca kiểm tra" → examsetup; huy hiệu Học sinh hỏi chỉ hiện khi có số', () => {
    const a = render(<ThanhBenTrai />)
    fireEvent.click(screen.getByRole('button', { name: 'Mở ca kiểm tra' }))
    expect(useAppStore.getState().screen).toBe('examsetup')
    expect(a.container.querySelector('.ben-trai-huy-hieu')).toBeNull()
    a.unmount()
    expect(render(<ThanhBenTrai soCauHoi={4} />).container.querySelector('.ben-trai-huy-hieu')!.textContent).toBe('4')
  })
})

describe('BottomNav (< 880 px) — ĐỦ mục', () => {
  it('bốn mục chính + Thêm; tờ Thêm chứa đúng bốn mục còn lại → hợp lại đủ cả 8', () => {
    render(<BottomNav />)
    for (const t of ['Hôm nay', 'Học sinh', 'Ca thi', 'Bài tập', 'Thêm']) expect(screen.getByText(t)).toBeTruthy()
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
