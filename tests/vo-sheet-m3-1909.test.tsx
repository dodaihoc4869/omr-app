// VIỆC C · C1 — vỏ "sheet toàn màn" của cổng học sinh (thanh trên + nút Quay lại + tiêu đề + nút Đóng) mặc Material 3.
// Đổi áo, không đổi xương: nút Đóng vẫn có title "Đóng toàn màn hình", nút Quay lại vẫn tên "Quay lại Bảng tin", mọi tab vẫn mở đúng.
// Cô lập: chỉ đường học sinh (/hs…) mới có `.m3-sheet`; game thần thú và mọi đường khác giữ đúng cái cũ.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import StudentPortalScreen from '../src/screens/StudentPortalScreen'

const mocks = vi.hoisted(() => ({ items: [] as any[], momItems: [] as any[] }))
vi.mock('../src/game/than-thu-v2/Spirit2D', () => ({ default: () => null }))
vi.mock('../src/game/than-thu-v2/Game', () => ({ default: () => <div data-testid="game-than-thu" /> }))
vi.mock('../src/components/BangVinhDanh', () => ({ default: () => null }))
vi.mock('../src/components/BangTinPhuHuynh', () => ({ default: () => <div>Bảng tin thử</div> }))
vi.mock('../src/components/ThongBaoHocSinh', () => ({ default: () => null, noticeApi: vi.fn() }))
vi.mock('../src/game/than-thu-v2/academic-sync', () => ({ syncStudentExp: async () => {} }))
vi.mock('../src/lib/exam-db', async (original) => ({ ...(await original<any>()), loadScriptUrlHoacMacDinh: async () => '/test' }))
vi.mock('../src/lib/exam-api', async (original) => ({
  ...(await original<any>()),
  hsLichSuCaApi: async () => ({ ok: true, items: [] }),
  hsBtvnApi: async () => ({ ok: true, items: mocks.items }),
  thanThuDocApi: async () => ({ ok: true, hoSo: {} }),
}))
vi.mock('../src/lib/mom-api', async (original) => ({ ...(await original<any>()), momApi: async () => ({ ok: true, items: mocks.momItems }) }))
vi.mock('../src/lib/btvn-may-chu-moi', () => ({ btvnCuaEm: vi.fn() }))
vi.mock('../src/lib/btvn-cho-em', () => ({ layCauHinhChoEmBtvn: async () => ({ URL: '/test' }), dungPhieuBtvn: vi.fn() }))

const datDuong = (d: string) => window.history.replaceState(null, '', d)
beforeEach(() => {
  mocks.items = []
  mocks.momItems = []
  localStorage.setItem('omr_student_portal_auth', JSON.stringify({ sbd: 'test', hoTen: 'Em thử', token: 'test-token' }))
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true, items: [] }) }))
})
afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
  datDuong('/')
})

const moMan = async (nhan: string) => {
  fireEvent.click(await screen.findByRole('button', { name: 'Mở menu' }))
  fireEvent.click(await screen.findByRole('menuitem', { name: nhan }))
}
const tam = () => document.querySelector('.fixed.inset-0.z-50') as HTMLElement

const TAB: [string, string][] = [
  ['Xem điểm & lịch sử ca kiểm tra', 'Xem điểm & lịch sử ca kiểm tra'],
  ['Bài tập về nhà', 'Bài tập về nhà'],
  ['Bài gia đình giao', 'Bài gia đình giao'],
  ['Khắc phục lỗi sai', 'Khắc phục lỗi sai & luyện đề'],
  ['Bảng tin & bài luyện hôm nay', 'Bảng tin & bài luyện hôm nay'],
]

describe('C1 · vỏ sheet toàn màn của cổng học sinh (/hs)', () => {
  it.each(TAB)('tab "%s": gốc `m3 m3-sheet`, thanh trên M3 nằm THẲNG dưới vùng cuộn, tiêu đề đúng, không còn header cũ', async (nhan, tieu) => {
    datDuong('/hs')
    render(<StudentPortalScreen />)
    await moMan(nhan)
    const goc = tam()
    expect(goc.classList.contains('m3')).toBe(true)
    expect(goc.classList.contains('m3-sheet')).toBe(true)
    const thanh = goc.querySelector(':scope > .m3-thanh-tren') as HTMLElement
    expect(thanh).toBeTruthy()
    expect(thanh.querySelector('.m3-thanh-tren-ten')!.textContent).toBe(tieu)
    expect(goc.querySelector(':scope > header')).toBeNull()
    expect(screen.queryByRole('heading', { name: /^(Xem Điểm|Bài Tập Về Nhà|Khắc Phục Lỗi Sai & Luyện Đề$)/ })).toBeNull()
  })

  it('nút Quay lại (tên "Quay lại Bảng tin", tròn 48) và nút Đóng (title "Đóng toàn màn hình") đều đóng sheet về bảng nhiệm vụ', async () => {
    datDuong('/hs')
    render(<StudentPortalScreen />)
    await moMan('Bài tập về nhà')
    const quayLai = screen.getByRole('button', { name: 'Quay lại Bảng tin' })
    expect(quayLai.className).toContain('m3-nut-tron')
    fireEvent.click(quayLai)
    expect(tam()).toBeNull()
    await moMan('Bài tập về nhà')
    const dong = screen.getByTitle('Đóng toàn màn hình')
    expect(dong.className).toContain('m3-nut-chu')
    fireEvent.click(dong)
    expect(tam()).toBeNull()
    expect(await screen.findByRole('button', { name: 'Mở menu' })).toBeTruthy()
  })

  it('game thần thú KHÔNG được bọc `m3` (TheCau trong game có test khoá, không được đổi)', async () => {
    datDuong('/hs')
    render(<StudentPortalScreen />)
    await moMan('Thần thú')
    expect(await screen.findByTestId('game-than-thu')).toBeTruthy()
    const goc = tam()
    expect(goc.classList.contains('m3')).toBe(false)
    expect(goc.classList.contains('m3-sheet')).toBe(false)
    expect(goc.querySelector('.m3')).toBeNull()
  })

  it('đường KHÔNG phải cổng học sinh (jsdom mặc định `/`): giữ NGUYÊN header cũ, không có lớp m3 nào', async () => {
    datDuong('/')
    render(<StudentPortalScreen />)
    await moMan('Bài tập về nhà')
    const goc = tam()
    expect(goc.querySelector('.m3')).toBeNull()
    expect(goc.classList.contains('m3-sheet')).toBe(false)
    expect(goc.querySelector('header h2')!.textContent).toBe('Bài Tập Về Nhà')
    expect(screen.getByRole('button', { name: 'Quay lại Bảng tin' })).toBeTruthy()
    expect(screen.getByTitle('Đóng toàn màn hình')).toBeTruthy()
  })
})

describe('C1 · CSS của vỏ', () => {
  const css = fs.readFileSync(path.join(process.cwd(), 'src/components/bang-nhiem-vu/sheet-m3.css'), 'utf8')
  it('không mã màu cứng nào (chỉ biến --m3-*), mọi bộ chọn nằm dưới .m3-sheet', () => {
    const sach = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*\{/g, '')
    expect(sach).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(sach).not.toMatch(/\brgba?\(/)
    for (const m of sach.matchAll(/([^{}@]+)\{/g)) {
      const t = m[1].trim()
      if (!t || t.startsWith('@')) continue
      for (const b of t.split(',')) expect(b.trim().startsWith('.m3-sheet'), b).toBe(true)
    }
    expect(sach).toContain('var(--m3-surface)')
  })
})
