// Việc C · C7 (Code 4): PhieuScreen — trang phiếu công khai (/p#<mã>, ?vai=phieu). Chỉ hai thứ đổi áo:
//  · VỎ TẢI / LỖI (không phải báo cáo, chỉ là trạng thái của trang) → bảng màu M3, nút Thử lại 48 px;
//  · nút "Xem đề em/con vừa làm" → đích chạm 48 px, GIỮ bảng --p-* vì nó nằm trong thẻ giấy của báo cáo.
// Báo cáo bên dưới, KhoiBaiLuyen, PhieuV3 KHÔNG đổi. Ngoài M3 (vitest ở `/`) mọi thứ phải ra đúng giá trị cũ:
// kiểu nội tuyến chỉ đổi thành `var(--…, <giá trị cũ>)`.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import type { PhieuDayDu } from '../src/lib/phieu-du-lieu'

// "Đang mở báo cáo…" cần một lời gọi treo mãi: máy chủ chưa trả lời.
vi.mock('../src/lib/exam-db', async (goc) => ({ ...(await goc<typeof import('../src/lib/exam-db')>()), loadScriptUrlHoacMacDinh: () => new Promise<string>(() => {}) }))
import PhieuScreen from '../src/screens/PhieuScreen'

const goc = process.cwd()
const doc = (p: string) => fs.readFileSync(path.join(goc, p), 'utf8')
const datDuong = (d: string) => window.history.replaceState(null, '', d)
afterEach(() => {
  cleanup()
  datDuong('/')
})

const CSS = doc('src/components/m3/phieu-screen.css')
const SRC = doc('src/screens/PhieuScreen.tsx')
const M3 = '/?vai=phieu'
const CO_MA = '#ABCDEFGHJK'

const cau = (id: string, phan: 'I' | 'II' | 'III', o: object = {}) => ({ phan, id, maDe: 'X', chuyenDe: 'Este – lipit', dang: 'chua_ro', sao: 0, mucDo: 'hieu', text: 'Đề', luaChon: ['a', 'b', 'c', 'd'], dapAn: 'A', chot: 'c', lyDo: null, buoc: ['b'], ketQua: '', ...o })
function goiPhieu(): PhieuDayDu {
  return {
    v: 2, hoTen: 'Bùi Hồng Hân', sbd: '12054', lop: '12', tenCa: 'Ca Este 12/09', maCa: '447479', ngay: '2026-09-08T12:09:17.983Z', diem: 7.88,
    diemPhan: { I: 3.38, II: 3, III: 1.5 }, soCauSai: 3, tongSoCau: 12, hang: 10, siSo: 36, chuyenDeCa: [], chuyenDeTong: [], lichSu: [], diemLop: [], vieCanLam: '',
    thongKe: null, tinHieu: [], ducKet: [], cauSai: [], dai: [], deCuaEm: [cau('q1', 'I'), cau('q3', 'III', { luaChon: null, dapAn: '12,5' })],
  } as unknown as PhieuDayDu
}
const goc_ = () => document.querySelector('.bc') as HTMLElement
const nutThuLai = () => screen.getByRole('button', { name: 'Thử lại' }) as HTMLButtonElement
const nutXemDe = () => screen.getByRole('button', { name: /Xem đề con vừa làm \(2 câu\) kèm lời giải/ }) as HTMLButtonElement

describe('vỏ TẢI / LỖI', () => {
  it('ngoài M3 (`/`): gốc chỉ là `bc`, không lớp m3 ở đâu; chữ phụ và nút Thử lại mang ĐÚNG giá trị cũ làm dự phòng', () => {
    datDuong('/' + CO_MA)
    const a = render(<PhieuScreen />)
    expect(goc_().className).toBe('bc')
    expect(document.querySelector('[class*="m3"]')).toBeNull()
    expect(screen.getByText('Đang mở báo cáo…').getAttribute('style')).toContain('color: var(--phieu-chu-phu, var(--p-nhat))')
    a.unmount()
    datDuong('/')
    render(<PhieuScreen />) // không có mã trong link → lỗi ngay
    expect(goc_().className).toBe('bc')
    expect(document.querySelector('[class*="m3"]')).toBeNull()
    const st = nutThuLai().getAttribute('style')!
    expect(st).toContain('background: var(--phieu-nut-nen, var(--p-muc))')
    expect(st).toContain('color: var(--phieu-nut-chu, var(--p-giay))')
    expect(st).toContain('border-radius: var(--phieu-nut-bo, 10px)')
    expect(st).toContain('padding: var(--phieu-nut-dem, 10px 22px)')
    expect(st).toContain('min-height: var(--phieu-nut-cao, 0px)')
  })

  it('cổng học sinh / phụ huynh (?vai=phieu): cả hai trạng thái mang `bc m3`; nút Thử lại vẫn là <button> bấm được', () => {
    datDuong(M3 + CO_MA)
    const a = render(<PhieuScreen />)
    expect(goc_().className).toBe('bc m3')
    expect(screen.getByText('Đang mở báo cáo…')).toBeTruthy()
    a.unmount()
    datDuong(M3)
    render(<PhieuScreen />)
    expect(goc_().className).toBe('bc m3')
    expect(screen.getByText('Không mở được báo cáo')).toBeTruthy()
    expect(screen.getByText(/Link không đúng hoặc bị cắt ngắn/)).toBeTruthy()
    expect(nutThuLai().tagName).toBe('BUTTON')
    expect(nutThuLai().type).toBe('button')
  })
})

describe('nút "Xem đề … vừa làm" (trong thẻ giấy của báo cáo)', () => {
  it('ngoài M3: wrapper KHÔNG có lớp nào; cao dự phòng 46 px như cũ', () => {
    render(<PhieuScreen duCoSan={goiPhieu()} />)
    const nut = nutXemDe()
    expect(nut.parentElement!.className).toBe('')
    expect(nut.getAttribute('style')).toContain('min-height: var(--xem-de-cao, 46px)')
    expect(document.querySelector('[class*="m3"]')).toBeNull()
  })

  it('dưới M3: wrapper mang m3-phieu-xem-de (đặt --xem-de-cao); nút GIỮ bảng --p-* của thẻ giấy; báo cáo không có lớp m3', () => {
    datDuong(M3)
    render(<PhieuScreen duCoSan={goiPhieu()} />)
    const nut = nutXemDe()
    expect(nut.parentElement!.className).toBe('m3-phieu-xem-de')
    const st = nut.getAttribute('style')!
    expect(st).toContain('border: 1.5px solid var(--p-tim)')
    expect(st).toContain('background: var(--p-giay)')
    expect(st).toContain('color: var(--p-tim)')
    expect(st).not.toContain('--m3-')
    // báo cáo (giấy trắng mực đen) không bị đóng dấu m3
    expect(document.querySelector('.bc')!.className).toBe('bc')
    expect(document.querySelector('.bc [class*="m3"]:not(.m3-phieu-xem-de)')).toBeNull()
  })

  for (const [duong, coM3] of [['/', false], [M3, true]] as const) {
    it(`bấm nút mở khung xem phiếu — ${coM3 ? 'M3 (thanh trên + nút Đóng)' : 'giáo viên/cũ (nút X nổi)'}`, async () => {
      datDuong(duong)
      render(<PhieuScreen duCoSan={goiPhieu()} />)
      fireEvent.click(nutXemDe())
      await waitFor(() => expect(document.querySelector('.lop-xem-phieu')).toBeTruthy(), { timeout: 5000 })
      const khung = document.querySelector('.lop-xem-phieu') as HTMLElement
      expect(khung.classList.contains('m3')).toBe(coM3)
      expect(!!khung.querySelector('.khung-phieu-thanh')).toBe(coM3)
      expect(!!khung.querySelector('.nut-dong-phieu')).toBe(!coM3)
      expect(khung.getAttribute('aria-label')).toBe('Đề con vừa làm')
    })
  }
})

describe('m3/phieu-screen.css', () => {
  const luat = (chon: string) => [...CSS.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)].find((m) => m[1].split(',').map((s) => s.trim()).includes(chon))![2]

  it('vỏ: nền surface + chữ on-surface (thắng `.bc` giấy nhờ hai lớp); nút chính M3 cao 48 px, bo tròn, chữ on-primary', () => {
    const r = luat('.bc.m3')
    expect(r).toMatch(/background:\s*var\(--m3-surface\)/)
    expect(r).toMatch(/color:\s*var\(--m3-on-surface\)/)
    expect(r).toMatch(/--phieu-chu-phu:\s*var\(--m3-on-surface-variant\)/)
    expect(r).toMatch(/--phieu-nut-nen:\s*var\(--m3-primary\)/)
    expect(r).toMatch(/--phieu-nut-chu:\s*var\(--m3-on-primary\)/)
    expect(r).toMatch(/--phieu-nut-bo:\s*var\(--m3-bo-tron\)/)
    expect(r).toMatch(/--phieu-nut-cao:\s*48px/)
  })

  it('nút xem đề: chỉ đổi SỐ ĐO (48 px) — tuyệt đối không có màu --m3-* (chữ primary của chế độ tối sẽ rơi lên giấy trắng); vòng focus dùng --p-tim', () => {
    const r = luat('.m3-phieu-xem-de')
    expect(r).toMatch(/--xem-de-cao:\s*48px/)
    expect(r).not.toContain('--m3-')
    expect(luat('.m3-phieu-xem-de button:focus-visible')).toMatch(/outline:\s*3px solid var\(--p-tim\)/)
  })

  it('kỷ luật thư viện M3: không !important, không mã màu #, không khai lại biến --m3-*', () => {
    expect(CSS.replace(/\/\*[\s\S]*?\*\//g, '')).not.toContain('!important')
    expect(CSS).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(CSS).not.toMatch(/--m3-[a-z-]+\s*:/)
  })
})

describe('PhieuScreen.tsx: chỉ thêm móc M3, giá trị cũ nằm trong dự phòng', () => {
  it('dự phòng = giá trị cũ; báo cáo / KhoiBaiLuyen / PhieuV3 không bị đóng dấu m3', () => {
    for (const s of ["'var(--xem-de-cao, 46px)'", "'var(--phieu-nut-dem, 10px 22px)'", "'var(--phieu-nut-bo, 10px)'", "'var(--phieu-nut-nen, var(--p-muc))'", "'var(--phieu-nut-chu, var(--p-giay))'", "'var(--phieu-chu-phu, var(--p-nhat))'"]) expect(SRC).toContain(s)
    expect(SRC).toContain("import '../components/m3/phieu-screen.css'")
    expect(SRC).toContain("className={m3 ? 'bc m3' : 'bc'}")
    expect(SRC.match(/<div className="bc">/g)).toHaveLength(1) // bố cục báo cáo cũ giữ nguyên lớp `bc` trần
    expect(SRC).toContain('<PhieuV3 du={du} laCuaEm={laCuaEm} xinLink={xinLink} />')
    expect(SRC).toContain('<NutTaiBaiTap du={du} laCuaEm={laCuaEm} xinLink={xinLink} />')
    expect(SRC).toContain('location.reload()')
  })
})
