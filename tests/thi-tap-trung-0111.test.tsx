// @vitest-environment jsdom
// THI TẬP TRUNG (thầy 01/11: «Thanh màu xanh đồng hồ và nút hơi rối, khi vào kiểm tra thì ẩn hết đi. Lúc nào 15 phút cuối, 5 phút cuối, 1 phút cuối thì
// hiện thời gian lên tinh tế đẹp mắt báo một lần rồi lại ẩn đi. Tôi muốn full màn hình để hs kiểm tra cho tập trung»; thầy chốt lại mốc cùng ngày:
// 12 phút · 6 phút · 1 phút).
//  1. Lõi báo giờ (src/lib/thi-tap-trung.ts): mốc nào báo, khi nào; mỗi mốc một lần / lượt (nhớ qua tải lại); vào bài đã sát mốc ⇒ bỏ mốc ấy.
//  2. Khung ca thi (ThiDuo): ca có giờ ⇒ thanh trên ẩn, tay nắm / vuốt / Esc ⇒ hiện 5 s rồi ẩn; lời báo «Còn 6 phút» (polite) · «Còn 1 phút» (assertive);
//     bài tập về nhà (không giờ) y cũ.
//  3. App TỰ xin toàn màn hình KHÔNG bị tính là rời màn: mọi lượt xin đi qua thuVaoToanManHinh (để lại mốc); bộ đếm rời màn chờ hết quãng chuyển rồi
//     mới đọc lại tiêu điểm; vào toàn màn chỉ ghi 'focus' (không cộng đếm); RA khỏi toàn màn giữ luật cũ.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createElement as h } from 'react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  GIAY_CUA_SO_BAO, MOC_BAO_GIO, MS_HIEN_BAO, MS_HIEN_TREN, chuBaoGio, docSoBao, ghiSoBao, mocCanBao,
} from '../src/lib/thi-tap-trung'
import { MS_APP_XIN_TOAN_MAN, msChoAppXinToanMan, thuVaoToanManHinh } from '../src/lib/lam-bai-ngang'
import { MS_XAC_NHAN_BLUR } from '../src/lib/chong-gian-lan'
import type { KhoGio } from '../src/lib/dong-ho-thi'

const doc = (p: string) => readFileSync(resolve(__dirname, '..', p), 'utf8')

beforeEach(() => {
  document.documentElement.dataset.trong = 'hs'
  Object.defineProperty(navigator, 'vibrate', { value: vi.fn(() => true), configurable: true, writable: true })
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  localStorage.clear()
  delete document.documentElement.dataset.trong
})

// ---------------------------------------------------------------- 1. LÕI BÁO GIỜ
describe('mocCanBao — báo một lần ở 12 · 6 · 1 phút', () => {
  it('ba mốc đúng thứ tự, chữ báo đúng', () => {
    expect([...MOC_BAO_GIO]).toEqual([720, 360, 60])
    expect(MOC_BAO_GIO.map(chuBaoGio)).toEqual(['Còn 12 phút', 'Còn 6 phút', 'Còn 1 phút'])
  })
  it('ca 45 phút: báo đúng lúc qua mốc, chưa tới mốc thì chưa báo', () => {
    const vao = 2700
    expect(mocCanBao(721, vao, [])).toBeNull()
    expect(mocCanBao(720, vao, [])).toBe(720)
    expect(mocCanBao(719.4, vao, [])).toBe(720)
    expect(mocCanBao(361, vao, [720])).toBeNull()
    expect(mocCanBao(360, vao, [720])).toBe(360)
    expect(mocCanBao(59.2, vao, [720, 360])).toBe(60)
    expect(mocCanBao(900, vao, [])).toBeNull() // 15 phút / 5 phút (mốc cũ) không còn báo
    expect(mocCanBao(300, vao, [720, 360])).toBeNull()
  })
  it('mỗi mốc MỘT lần: đã báo thì thôi (tải lại không báo lại)', () => {
    expect(mocCanBao(719, 2700, [720])).toBeNull()
    expect(mocCanBao(359, 2700, [720, 360])).toBeNull()
    expect(mocCanBao(59, 2700, [720, 360, 60])).toBeNull()
  })
  it('qua mốc quá lâu (máy tắt, mở lại muộn) ⇒ không báo muộn', () => {
    expect(mocCanBao(720 - GIAY_CUA_SO_BAO, 2700, [])).toBeNull()
    expect(mocCanBao(700.5, 2700, [])).toBe(720)
    expect(mocCanBao(200, 2700, [720])).toBeNull()
  })
  it('vào bài khi đã ít hơn (hoặc sát) mốc ⇒ bỏ mốc ấy; ca 12 phút không báo «Còn 12 phút» lúc mở đề', () => {
    expect(mocCanBao(719, 719.6, [])).toBeNull() // ca 12 phút
    expect(mocCanBao(719, 740, [])).toBeNull() // vào khi còn 12:20 — vừa vào, khỏi báo
    expect(mocCanBao(360, 600, [])).toBe(360) // ca 10 phút: vẫn báo 6 phút
    expect(mocCanBao(359, 340, [])).toBeNull() // vào muộn, chỉ còn 5:40
    expect(mocCanBao(60, 340, [])).toBe(60) //   … nhưng 1 phút vẫn báo
  })
  it('hết giờ / số hỏng ⇒ không báo', () => {
    expect(mocCanBao(0, 2700, [])).toBeNull()
    expect(mocCanBao(-3, 2700, [])).toBeNull()
    expect(mocCanBao(Number.NaN, 2700, [])).toBeNull()
  })
})

describe('sổ báo giờ theo lượt (localStorage, một khoá)', () => {
  it('lượt mới ⇒ ghi giây lúc vào; đọc lại cùng lượt giữ nguyên; lượt khác ⇒ sổ mới', () => {
    const a = docSoBao('CA1|2026-11-01T01:00:00.000Z', 2700)
    expect(a).toEqual({ vao: 2700, da: [] })
    a.da.push(720)
    ghiSoBao('CA1|2026-11-01T01:00:00.000Z', a)
    expect(docSoBao('CA1|2026-11-01T01:00:00.000Z', 700)).toEqual({ vao: 2700, da: [720] }) // tải lại lúc còn 11:40
    expect(docSoBao('CA2|2026-11-01T02:00:00.000Z', 1800)).toEqual({ vao: 1800, da: [] })
  })
  it('sổ hỏng / bộ nhớ bị chặn ⇒ không ném, dùng sổ mới', () => {
    localStorage.setItem('omr_bao_gio_thi', '{hỏng')
    expect(docSoBao('x', 100)).toEqual({ vao: 100, da: [] })
    const nem = { getItem: () => { throw new Error('chặn') }, setItem: () => { throw new Error('chặn') } }
    expect(docSoBao('x', 100, nem)).toEqual({ vao: 100, da: [] })
    expect(() => ghiSoBao('x', { vao: 1, da: [] }, nem)).not.toThrow()
  })
})

// ---------------------------------------------------------------- 2. KHUNG CA THI
function khoGia(giay0: number) {
  let g = giay0
  const ds = new Set<() => void>()
  const kho: KhoGio = { conLai: () => g, conLaiNgay: () => g, dangKy: (f) => { ds.add(f); return () => { ds.delete(f) } } }
  return { kho, dat: (x: number) => act(() => { g = x; for (const f of Array.from(ds)) f() }) }
}
async function dung(them: Record<string, unknown> = {}) {
  const { default: ThiDuo } = await import('../src/components/kiem-tra-duo/ThiDuo')
  const p = {
    tenCa: 'Ca thử', dongHo: '37:57', nhanDongHo: 'Thời gian còn lại', gap: false, daLam: 1, tong: 3,
    luu: { nhan: 'đã lưu', tt: 'da' as const }, cauHien: 1, onDenCau: vi.fn(), phan: ['I', 'I', 'II'], moTaPhan: (ph: string) => `Biểu điểm phần ${ph}`,
    moLuoi: false, onMoLuoi: vi.fn(), moNop: false, onMoNop: vi.fn(), chuaLam: [2, 3], danhDau: [], nhanNutNop: 'Nộp bài', camNopSom: false,
    onNop: vi.fn(), onThoat: vi.fn(), tatPhim: false,
    ...them,
  }
  const r = render(h(ThiDuo, p as never, h('div', { id: 'cau-1' }, 'Đề câu 1')))
  return { p, r, goc: r.container.querySelector('.duo-kt-thi') as HTMLElement, ThiDuo }
}

describe('ThiDuo — chế độ tập trung (ca có giờ)', () => {
  it('thanh trên ẩn sẵn (vẫn trong DOM); tay nắm ⇒ hiện, 5 giây sau tự ẩn; Esc cũng hiện', async () => {
    vi.useFakeTimers()
    const { kho } = khoGia(2400)
    const { goc } = await dung({ gio: kho, luot: 'CA|1' })
    expect(goc.hasAttribute('data-tap-trung')).toBe(true)
    expect(goc.hasAttribute('data-tren-hien')).toBe(false)
    expect(document.documentElement.hasAttribute('data-thi-tap-trung')).toBe(true)
    // các nút cũ vẫn còn (Tab / trình đọc màn hình tới được)
    expect(screen.getByRole('button', { name: 'Thoát bài làm' })).toBeTruthy()
    expect(screen.getByRole('timer', { name: 'Thời gian còn lại' })).toBeTruthy()
    const tay = screen.getByRole('button', { name: /Hiện thanh trên/ })
    expect(tay.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(tay)
    expect(goc.hasAttribute('data-tren-hien')).toBe(true)
    expect(tay.getAttribute('aria-expanded')).toBe('true')
    act(() => { vi.advanceTimersByTime(MS_HIEN_TREN - 100) })
    expect(goc.hasAttribute('data-tren-hien')).toBe(true)
    act(() => { vi.advanceTimersByTime(200) })
    expect(goc.hasAttribute('data-tren-hien')).toBe(false)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(goc.hasAttribute('data-tren-hien')).toBe(true)
  })
  it('chạm trong thanh đang hiện ⇒ đếm lại 5 giây; chạm ra đề ⇒ cất ngay', async () => {
    vi.useFakeTimers()
    const { kho } = khoGia(2400)
    const { goc } = await dung({ gio: kho, luot: 'CA|1' })
    fireEvent.click(screen.getByRole('button', { name: /Hiện thanh trên/ }))
    act(() => { vi.advanceTimersByTime(4000) })
    fireEvent.pointerDown(screen.getByRole('button', { name: /Danh sách câu/ }))
    act(() => { vi.advanceTimersByTime(4000) })
    expect(goc.hasAttribute('data-tren-hien')).toBe(true)
    fireEvent.pointerDown(screen.getByText('Đề câu 1'))
    expect(goc.hasAttribute('data-tren-hien')).toBe(false)
  })
  it('vuốt xuống từ mép trên (một ngón) ⇒ hiện thanh; vuốt giữa màn thì không', async () => {
    const { kho } = khoGia(2400)
    const { goc } = await dung({ gio: kho, luot: 'CA|1' })
    const cham = (loai: string, y: number) => window.dispatchEvent(Object.assign(new Event(loai), { touches: [{ clientY: y }] }))
    act(() => { cham('touchstart', 400); cham('touchmove', 480) })
    expect(goc.hasAttribute('data-tren-hien')).toBe(false)
    act(() => { cham('touchstart', 6); cham('touchmove', 50) })
    expect(goc.hasAttribute('data-tren-hien')).toBe(true)
  })
  it('báo «Còn 6 phút» một lần (polite) rồi tự tắt; «Còn 1 phút» là assertive; tải lại không báo lại', async () => {
    vi.useFakeTimers()
    const g = khoGia(2400)
    const { r } = await dung({ gio: g.kho, luot: 'CA|lượt-1' })
    expect(screen.queryByText(/^Còn \d+ phút$/)).toBeNull()
    g.dat(900)
    expect(screen.queryByText(/^Còn \d+ phút$/)).toBeNull() // 15 phút: không còn là mốc
    g.dat(720)
    expect(screen.getByText('Còn 12 phút').closest('[aria-live]')?.getAttribute('aria-live')).toBe('polite')
    act(() => { vi.advanceTimersByTime(MS_HIEN_BAO + 50) })
    expect(screen.queryByText('Còn 12 phút')).toBeNull()
    g.dat(719)
    expect(screen.queryByText('Còn 12 phút')).toBeNull() // một lần thôi
    g.dat(360)
    const bao6 = screen.getByText('Còn 6 phút')
    expect(bao6.closest('[aria-live]')?.getAttribute('aria-live')).toBe('polite')
    expect(bao6.closest('[data-moc]')?.getAttribute('data-moc')).toBe('360')
    // tải lại trang (khung dựng lại, cùng lượt) ngay sau mốc ⇒ không báo lại
    r.unmount()
    act(() => { vi.advanceTimersByTime(MS_HIEN_BAO + 50) })
    const g2 = khoGia(356)
    await dung({ gio: g2.kho, luot: 'CA|lượt-1' })
    expect(screen.queryByText('Còn 6 phút')).toBeNull()
    g2.dat(60)
    expect(screen.getByText('Còn 1 phút').closest('[aria-live]')?.getAttribute('aria-live')).toBe('assertive')
  })
  it('vào bài khi chỉ còn 11 phút ⇒ không báo 12 phút, vẫn báo 6 phút', async () => {
    const g = khoGia(660)
    await dung({ gio: g.kho, luot: 'CA|muộn' })
    g.dat(660)
    expect(screen.queryByText('Còn 12 phút')).toBeNull()
    g.dat(359.5)
    expect(screen.getByText('Còn 6 phút')).toBeTruthy()
  })
  it('bài tập về nhà (không giờ) ⇒ y cũ: không tay nắm, không ẩn thanh, không đánh dấu <html>', async () => {
    const { goc } = await dung({ gio: null, dongHo: 'Hạn 30/10', nhanDongHo: 'Bài tập về nhà — không tính giờ' })
    expect(goc.hasAttribute('data-tap-trung')).toBe(false)
    expect(screen.queryByRole('button', { name: /Hiện thanh trên/ })).toBeNull()
    expect(document.documentElement.hasAttribute('data-thi-tap-trung')).toBe(false)
  })
  it('đóng khung (nộp xong) ⇒ gỡ đánh dấu <html> (nút «Đóng phòng thi» của cổng hiện lại)', async () => {
    const { kho } = khoGia(2400)
    const { r } = await dung({ gio: kho, luot: 'CA|1' })
    expect(document.documentElement.hasAttribute('data-thi-tap-trung')).toBe(true)
    r.unmount()
    expect(document.documentElement.hasAttribute('data-thi-tap-trung')).toBe(false)
  })
  it('CSS: thanh trượt khỏi mép trên (không ẩn khỏi Tab), tay nắm ≥ 44 px, giảm chuyển động chỉ mờ, chỉ biến --tr-*', () => {
    const css = doc('src/styles/trong-kiem-tra.css')
    const muc6 = css.slice(css.indexOf('/* ── 6. THI TẬP TRUNG'))
    expect(muc6).toMatch(/\[data-tap-trung\] > \.duo-kt-tren\.duo-tren \{\s*position: fixed;[^}]*transform: translateY/)
    expect(muc6).not.toMatch(/\.duo-kt-tren[^{]*\{[^}]*(display: none|visibility: hidden)/)
    expect(muc6).toMatch(/\.duo-kt-tay \{[^}]*width: 96px; height: calc\(44px \+ env\(safe-area-inset-top\)\)/)
    expect(muc6).toMatch(/prefers-reduced-motion: reduce\)[\s\S]*animation-name: duo-kt-bao-mo/)
    expect(muc6).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(/i)
  })
})

// ---------------------------------------------------------------- 3. APP TỰ XIN TOÀN MÀN KHÔNG BỊ TÍNH RỜI MÀN
describe('app tự xin toàn màn hình ⇒ không tính là rời màn', () => {
  const taiLieu = (p: Record<string, unknown>) => ({ fullscreenElement: null, documentElement: {}, ...p }) as unknown as Document
  it('thuVaoToanManHinh để lại mốc: trong quãng chuyển, bộ đếm chờ hết quãng; ngoài quãng = nhịp xác nhận cũ', () => {
    const now = vi.spyOn(performance, 'now')
    now.mockReturnValue(10_000)
    expect(msChoAppXinToanMan(10_000)).toBe(0) // chưa xin lần nào trong lượt thử này (hoặc đã quá lâu)
    expect(thuVaoToanManHinh(taiLieu({ documentElement: { requestFullscreen: vi.fn(() => Promise.resolve()) } }))).toBe(true)
    expect(msChoAppXinToanMan(10_000)).toBe(MS_APP_XIN_TOAN_MAN)
    expect(msChoAppXinToanMan(10_400)).toBe(MS_APP_XIN_TOAN_MAN - 400)
    expect(msChoAppXinToanMan(10_000 + MS_APP_XIN_TOAN_MAN + 1)).toBe(0)
    // đang toàn màn rồi ⇒ không xin lại, không dời mốc
    now.mockReturnValue(20_000)
    expect(thuVaoToanManHinh(taiLieu({ fullscreenElement: {}, documentElement: { requestFullscreen: vi.fn() } }))).toBe(false)
    expect(msChoAppXinToanMan(20_000)).toBe(0)
    now.mockRestore()
  })
  it('chớp mất tiêu điểm lúc chuyển vào toàn màn: tiêu điểm về trước khi hết quãng ⇒ KHÔNG đếm; mất hẳn ⇒ VẪN đếm (không nới luật)', () => {
    // Mô phỏng đúng nhịp onBlur của ExamTakeScreen: setTimeout(…, Math.max(MS_XAC_NHAN_BLUR, msChoAppXinToanMan())) rồi đọc lại hasFocus().
    vi.useFakeTimers()
    const now = vi.spyOn(performance, 'now').mockImplementation(() => Date.now())
    const dem = (tieuDiemVeSauMs: number | null) => {
      thuVaoToanManHinh(taiLieu({ documentElement: { requestFullscreen: vi.fn(() => Promise.resolve()) } }))
      let coTieuDiem = false
      let soLan = 0
      vi.advanceTimersByTime(100) // blur bắn 100 ms sau cú xin (hoạt ảnh vào toàn màn)
      setTimeout(() => { if (!coTieuDiem) soLan++ }, Math.max(MS_XAC_NHAN_BLUR, msChoAppXinToanMan()))
      if (tieuDiemVeSauMs !== null) setTimeout(() => { coTieuDiem = true }, tieuDiemVeSauMs)
      vi.advanceTimersByTime(5000)
      return soLan
    }
    expect(dem(900)).toBe(0) // chớp 0,9 s (dài hơn nhịp 600 ms cũ) — do app gây ra, không đếm
    expect(dem(null)).toBe(1) // em rời thật — vẫn tính
    now.mockRestore()
  })
  it('ExamTakeScreen nối đúng: mọi lượt xin đi qua thuVaoToanManHinh; blur chờ hết quãng; vào toàn màn chỉ ghi focus; ra khỏi toàn màn giữ luật cũ', () => {
    const src = doc('src/screens/ExamTakeScreen.tsx')
    expect(src).not.toMatch(/\.requestFullscreen\(|webkitRequestFullscreen\(\)/) // không còn đường xin riêng (batToanManHinh cũ)
    expect(src).toContain("<NutChinh variant=\"phu\" onClick={() => thuVaoToanManHinh()}>")
    const dau = src.indexOf('const onBlur = () => {')
    const khoi = src.slice(dau, src.indexOf("document.addEventListener('visibilitychange', onVis)", dau))
    expect(khoi).toContain('}, Math.max(MS_XAC_NHAN_BLUR, msChoAppXinToanMan()))')
    expect(khoi).toContain("if (tinhLaRoiMan('mat_tieu_diem', camUng, document.hasFocus())) logEvent('blur')")
    // fullscreenchange: vào ⇒ 'focus', ra ⇒ 'hidden' (máy cảm ứng bỏ qua) — y luật cũ
    expect(khoi).toMatch(/const onFs = \(\) => \{\s*if \(camUng\) return\s*logEvent\(dangToanManHinh\(\) \? 'focus' : 'hidden'\)\s*\}/)
    // 'focus' KHÔNG BAO GIỜ cộng đếm: chỉ nhánh hidden / blur tăng leaveCount
    const log = src.slice(src.indexOf('const logEvent = ('), src.indexOf('// ẨN NGẮN KHÔNG PHẢI LÀ RỜI MÀN'))
    const tang = log.indexOf('leaveCount + 1')
    expect(tang).toBeGreaterThan(log.indexOf("if (type === 'hidden' || type === 'blur') {"))
    expect(tang).toBeLessThan(log.indexOf('} else if (hiddenSinceRef.current !== null) {'))
    expect(log.match(/leaveCount \+ 1/g)).toHaveLength(1)
    expect(MS_XAC_NHAN_BLUR).toBeLessThan(MS_APP_XIN_TOAN_MAN)
  })
})
