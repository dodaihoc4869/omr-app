// VIỆC C · C3 — tab "Bài tập về nhà" của cổng học sinh mặc Material 3 (BtvnM3).
// Đổi áo, không đổi xương: chữ, thứ tự (chưa nộp trước, hạn gần trước), điều kiện "làm lại"/"hết hạn", tên nút và payload mở phiếu giữ nguyên;
// đường không phải cổng học sinh giữ đúng đoạn JSX cũ.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import StudentPortalScreen from '../src/screens/StudentPortalScreen'
import NhanHanBaiTap from '../src/components/NhanHanBaiTap'
import BtvnM3, { nhanHan, sapXepBtvn, type MucBtvn } from '../src/components/bang-nhiem-vu/BtvnM3'

const mocks = vi.hoisted(() => ({ items: [] as any[], homework: vi.fn(), sheet: vi.fn() }))
vi.mock('../src/game/than-thu-v2/Spirit2D', () => ({ default: () => null }))
vi.mock('../src/components/BangVinhDanh', () => ({ default: () => null }))
vi.mock('../src/components/BangTinPhuHuynh', () => ({ default: () => null }))
vi.mock('../src/components/ThongBaoHocSinh', () => ({ default: () => null, noticeApi: vi.fn() }))
vi.mock('../src/game/than-thu-v2/academic-sync', () => ({ syncStudentExp: async () => {} }))
vi.mock('../src/lib/exam-db', async (original) => ({ ...(await original<any>()), loadScriptUrlHoacMacDinh: async () => '/test' }))
vi.mock('../src/lib/exam-api', async (original) => ({
  ...(await original<any>()),
  hsLichSuCaApi: async () => ({ ok: true, items: [] }),
  hsBtvnApi: async () => ({ ok: true, items: mocks.items }),
  thanThuDocApi: async () => ({ ok: true, hoSo: {} }),
}))
vi.mock('../src/lib/mom-api', async (original) => ({ ...(await original<any>()), momApi: async () => ({ ok: true, items: [] }) }))
vi.mock('../src/lib/btvn-may-chu-moi', () => ({ btvnCuaEm: mocks.homework }))
vi.mock('../src/lib/btvn-cho-em', () => ({ layCauHinhChoEmBtvn: async () => ({ URL: '/test' }), dungPhieuBtvn: mocks.sheet }))

const NOW = Date.now()
const gio = (h: number) => new Date(NOW + h * 3600_000).toISOString()
const datDuong = (d: string) => window.history.replaceState(null, '', d)
const BT = (o: Record<string, unknown>): MucBtvn => ({ maBtvn: 'BT1', maCa: 'CA1', tenBtvn: 'Bài test', soCau: 8, hanNop: gio(48), daNop: false, ...o })

beforeEach(() => {
  mocks.items = []
  localStorage.setItem('omr_student_portal_auth', JSON.stringify({ sbd: 'test', hoTen: 'Em thử', token: 'test-token' }))
  mocks.sheet.mockResolvedValue('<html><body>Đề BTVN thử</body></html>')
  mocks.homework.mockResolvedValue({ ok: true, maBtvn: 'BT1', de: {}, soCau: 1 })
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true, items: [] }) }))
})
afterEach(async () => {
  cleanup()
  // Việc bất đồng bộ còn dở của test trước (mở phiếu → viết lại địa chỉ) phải xong TRƯỚC khi đặt lại đường dẫn, kẻo nó đổi `/` thành `/hs`
  // ngay giữa test sau và làm bài kiểm cô lập đọc nhầm đường học sinh.
  await new Promise((r) => setTimeout(r, 60))
  localStorage.clear()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
  datDuong('/')
})
const moTab = async () => {
  fireEvent.click(await screen.findByRole('button', { name: 'Mở menu' }))
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Bài tập về nhà' }))
}
const the = (i: number) => document.querySelectorAll<HTMLElement>('.btm-the')[i]

describe('sắp xếp và nhãn hạn: đúng như bản cũ', () => {
  it('chưa nộp trước, hạn gần trước, không hạn ở cuối; không đổi mảng gốc', () => {
    const a = BT({ maCa: 'A', daNop: true, hanNop: gio(1) })
    const b = BT({ maCa: 'B', hanNop: gio(40) })
    const c = BT({ maCa: 'C', hanNop: gio(2) })
    const d = BT({ maCa: 'D', hanNop: undefined })
    const goc = [a, b, c, d]
    expect(sapXepBtvn(goc).map((x) => x.maCa)).toEqual(['C', 'B', 'D', 'A'])
    expect(goc.map((x) => x.maCa)).toEqual(['A', 'B', 'C', 'D'])
  })

  it('nhanHan ra ĐÚNG chữ của NhanHanBaiTap (dùng chung với app giáo viên) ở cả bốn trạng thái', () => {
    for (const [han, daNop] of [[gio(48), false], [gio(5), false], [gio(-3), false], [gio(5), true]] as const) {
      const { container, unmount } = render(<NhanHanBaiTap han={han} now={NOW} daNop={daNop} />)
      expect(nhanHan(han, NOW, daNop).chu).toBe(container.textContent!.replace(/\s+/g, ' ').trim())
      unmount()
    }
    expect(nhanHan(gio(48), NOW, false).muc).toBe('thuong')
    expect(nhanHan(gio(5), NOW, false).muc).toBe('gap')
    expect(nhanHan(gio(-3), NOW, false).muc).toBe('gap')
    expect(nhanHan(gio(5), NOW, true).muc).toBe('xong')
  })
})

describe('C3 · tab BTVN ở cổng học sinh (/hs)', () => {
  it('giữ nguyên chữ bản cũ (banner cách làm theo chặng, không "3 Vòng"); không còn khung cuộn lồng nhau', async () => {
    datDuong('/hs')
    mocks.items = [BT({})]
    const { container } = render(<StudentPortalScreen />)
    await moTab()
    expect(await screen.findByText('Cách làm bài tập về nhà: chia chặng theo ngày/giờ')).toBeTruthy()
    const chu = container.ownerDocument.body.textContent!
    for (const t of ['CHẶNG ĐANG MỞ', 'CHẶNG SAU', 'NỘP BÀI', 'Xong chặng đang mở, chặng sau mở đúng nhịp']) expect(chu).toContain(t)
    expect(chu).not.toMatch(/3 Vòng|Phân Tầng|VÒNG [123]|nắm chắc/i)
    expect(document.querySelector('.max-h-\\[65vh\\]')).toBeNull()
    expect(screen.getByRole('region', { name: 'Bài tập về nhà' })).toBeTruthy()
  })

  it('mọi trạng thái nút: chưa nộp còn hạn → "Vào làm bài"; đã nộp còn lượt+hạn → "Xem lại bài" + "Làm lại (còn n/3 lần)"; hết hạn / hết lượt → chữ giải thích, KHÔNG nút Làm lại; chưa nộp hết hạn → báo Thầy', async () => {
    datDuong('/hs')
    mocks.items = [
      BT({ maBtvn: 'B1', maCa: 'C1', tenBtvn: 'Còn hạn chưa nộp', hanNop: gio(10) }),
      BT({ maBtvn: 'B2', maCa: 'C2', tenBtvn: 'Đã nộp còn lượt', daNop: true, hanNop: gio(30), nopLuc: gio(-2), diem: 8.5, soDung: 7, soLanLamLaiConLai: 2 }),
      BT({ maBtvn: 'B3', maCa: 'C3', tenBtvn: 'Đã nộp hết lượt', daNop: true, hanNop: gio(30), diem: 6, soDung: 5, soLanLamLaiConLai: 0 }),
      BT({ maBtvn: 'B4', maCa: 'C4', tenBtvn: 'Đã nộp quá hạn', daNop: true, hanNop: gio(-5), diem: 5, soDung: 4, soLanLamLaiConLai: 3 }),
      BT({ maBtvn: 'B5', maCa: 'C5', tenBtvn: 'Chưa nộp quá hạn', hanNop: gio(-9) }),
    ]
    render(<StudentPortalScreen />)
    await moTab()
    await waitFor(() => expect(document.querySelectorAll('.btm-the').length).toBe(5))
    const theo = (ten: string) => Array.from(document.querySelectorAll<HTMLElement>('.btm-the')).find((e) => e.textContent!.includes(ten))!
    const conHan = theo('Còn hạn chưa nộp')
    expect(within(conHan).getByRole('button', { name: /Vào làm bài/ })).toBeTruthy()
    expect(within(conHan).getByText('Chưa nộp')).toBeTruthy()
    const conLuot = theo('Đã nộp còn lượt')
    expect(within(conLuot).getByText('Đã nộp')).toBeTruthy()
    expect(within(conLuot).getByRole('button', { name: /Xem lại bài/ })).toBeTruthy()
    expect(within(conLuot).getByRole('button', { name: 'Làm lại (còn 2/3 lần)' })).toBeTruthy()
    expect(within(conLuot).getByText('8.50đ')).toBeTruthy()
    expect(within(conLuot).getByText('7/8 câu đúng')).toBeTruthy()
    const hetLuot = theo('Đã nộp hết lượt')
    expect(within(hetLuot).getByText('Đã hết lượt làm lại')).toBeTruthy()
    expect(within(hetLuot).queryByRole('button', { name: /Làm lại/ })).toBeNull()
    const quaHan = theo('Đã nộp quá hạn')
    expect(within(quaHan).getByText('Cần Thầy gia hạn để làm lại')).toBeTruthy()
    expect(within(quaHan).queryByRole('button', { name: /Làm lại/ })).toBeNull()
    const chuaNopQuaHan = theo('Chưa nộp quá hạn')
    expect(within(chuaNopQuaHan).getByText('Đã hết hạn. Em báo Thầy để được gia hạn.')).toBeTruthy()
    expect(within(chuaNopQuaHan).queryByRole('button')).toBeNull()
    // thứ tự: chưa nộp trước (hạn gần trước), đã nộp sau
    expect(Array.from(document.querySelectorAll('.btm-ten')).map((e) => e.textContent)).toEqual(['Chưa nộp quá hạn', 'Còn hạn chưa nộp', 'Đã nộp quá hạn', 'Đã nộp còn lượt', 'Đã nộp hết lượt'])
  })

  it.each(['moi', 'xem', 'lamlai'])('bấm mở đúng lượt/chế độ như bản cũ: %s → dungPhieuBtvn(lamLai) + btvnCuaEm(đúng mã)', async (mode) => {
    datDuong('/hs')
    vi.stubGlobal('confirm', () => true)
    mocks.items = [BT({ maBtvn: 'BT1', maCa: 'CA1', daNop: mode !== 'moi', soLanLamLaiConLai: 3 })]
    render(<StudentPortalScreen />)
    await moTab()
    const ten = mode === 'moi' ? /Vào làm bài/ : mode === 'xem' ? /Xem lại/ : /Làm lại/
    fireEvent.click(await screen.findByRole('button', { name: ten }))
    expect(await screen.findByRole('dialog', { name: 'Bài tập & Phiếu làm bài' })).toBeTruthy()
    expect(mocks.homework).toHaveBeenCalledWith({ URL: '/test' }, 'CA1', 'test', 'BT1')
    expect(mocks.sheet.mock.calls[0][3].lamLai).toBe(mode === 'lamlai')
  })

  it('"Làm mới" gọi lại danh sách; đang tải: skeleton; chưa có bài: thẻ trống + "Tải lại danh sách"', () => {
    const goi = vi.fn()
    const { container, rerender } = render(<BtvnM3 dangTai ds={[]} now={NOW} dangMoId={null} ngayGio={() => ''} onMo={() => {}} onTaiLai={goi} />)
    expect(container.querySelector('[aria-busy="true"]')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Làm mới' }) as HTMLButtonElement).disabled).toBe(true)
    rerender(<BtvnM3 dangTai={false} ds={[]} now={NOW} dangMoId={null} ngayGio={() => ''} onMo={() => {}} onTaiLai={goi} />)
    expect(screen.getByText('Chưa có bài tập về nhà nào')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Tải lại danh sách' }))
    fireEvent.click(screen.getByRole('button', { name: 'Làm mới' }))
    expect(goi).toHaveBeenCalledTimes(2)
  })

  it('đang mở phiếu của một bài: CHỈ nút bài ấy tắt và ghi "Đang mở..."', () => {
    const ds = [BT({ maBtvn: 'X', maCa: 'X', tenBtvn: 'Bài X' }), BT({ maBtvn: 'Y', maCa: 'Y', tenBtvn: 'Bài Y' })]
    render(<BtvnM3 dangTai={false} ds={ds} now={NOW} dangMoId="X" ngayGio={() => ''} onMo={() => {}} onTaiLai={() => {}} />)
    const nut = (ten: string) => within(screen.getByLabelText(ten)).getByRole('button') as HTMLButtonElement
    expect(nut('Bài X').disabled).toBe(true)
    expect(nut('Bài X').textContent).toContain('Đang mở...')
    expect(nut('Bài Y').disabled).toBe(false)
  })
})

describe('C3 · cô lập và CSS', () => {
  it('đường KHÔNG phải cổng học sinh (jsdom `/`): giữ NGUYÊN đoạn cũ, không có .btm', async () => {
    datDuong('/')
    mocks.items = [BT({})]
    render(<StudentPortalScreen />)
    await moTab()
    await waitFor(() => expect(screen.getByRole('region', { name: 'Bài tập về nhà' }).className).toContain('max-h-[65vh]'))
    expect(document.querySelector('.btm')).toBeNull()
  })

  const css = fs.readFileSync(path.join(process.cwd(), 'src/components/bang-nhiem-vu/btvn-m3.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
  it('không mã màu cứng nào; mọi bộ chọn dưới .btm; tắt xoay khi giảm chuyển động; nút ≥ 48 px', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(css).not.toMatch(/\brgba?\(/)
    for (const m of css.replace(/@media[^{]*\{/g, '').replace(/@keyframes[^{]*\{/g, '').matchAll(/([^{}]+)\{/g)) for (const b of m[1].split(',')) expect(b.trim().startsWith('.btm') || /^\s*to\s*$/.test(b), b).toBe(true)
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
    expect(css).toMatch(/\.btm-nut \.m3-nut-chinh[^{]*\{[^}]*min-height:\s*48px/)
  })
})
