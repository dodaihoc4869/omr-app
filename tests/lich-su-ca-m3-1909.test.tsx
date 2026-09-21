// VIỆC C · C2 — tab "Xem điểm & lịch sử ca kiểm tra" của cổng học sinh mặc Material 3 (LichSuCaM3).
// Đổi áo, không đổi xương: hai hành động ("Xem báo cáo", "Xem đề và lời giải kèm lỗi sai") và dòng đếm câu (DongDemCau, khuôn chung
// 3 app) giữ nguyên; ca CHƯA CHẤM không in số bịa. Đường không phải cổng học sinh giữ đúng đoạn JSX cũ.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import StudentPortalScreen from '../src/screens/StudentPortalScreen'
import LichSuCaM3, { mucDiem } from '../src/components/bang-nhiem-vu/LichSuCaM3'

const mocks = vi.hoisted(() => ({ lichSu: [] as any[], chuaXong: false, deVaLoiGiai: vi.fn(), baoCao: vi.fn() }))
vi.mock('../src/game/than-thu-v2/Spirit2D', () => ({ default: () => null }))
vi.mock('../src/components/BangVinhDanh', () => ({ default: () => null }))
vi.mock('../src/components/BangTinPhuHuynh', () => ({ default: () => null }))
vi.mock('../src/components/ThongBaoHocSinh', () => ({ default: () => null, noticeApi: vi.fn() }))
vi.mock('../src/game/than-thu-v2/academic-sync', () => ({ syncStudentExp: async () => {} }))
vi.mock('../src/components/BaoCaoCaThiHocSinhModal', () => ({ default: (p: any) => { mocks.baoCao(p.baiThi); return <div role="dialog" aria-label="Báo cáo thử">Báo cáo {p.baiThi.maCa}</div> } }))
vi.mock('../src/lib/de-loi-giai-cua-em', () => ({ deVaLoiGiaiCuaEm: (...a: any[]) => mocks.deVaLoiGiai(...a) }))
vi.mock('../src/lib/exam-db', async (original) => ({ ...(await original<any>()), loadScriptUrlHoacMacDinh: async () => '/test' }))
vi.mock('../src/lib/exam-api', async (original) => ({
  ...(await original<any>()),
  hsLichSuCaApi: async () => ({ ok: true, items: mocks.lichSu }),
  hsBtvnApi: async () => ({ ok: true, items: [] }),
  thanThuDocApi: async () => ({ ok: true, hoSo: {} }),
}))
vi.mock('../src/lib/mom-api', async (original) => ({ ...(await original<any>()), momApi: async () => ({ ok: true, items: [] }) }))
vi.mock('../src/lib/btvn-may-chu-moi', () => ({ btvnCuaEm: vi.fn() }))
vi.mock('../src/lib/btvn-cho-em', () => ({ layCauHinhChoEmBtvn: async () => ({ URL: '/test' }), dungPhieuBtvn: vi.fn() }))

const datDuong = (d: string) => window.history.replaceState(null, '', d)
const CA = (o: Record<string, unknown>) => ({ maCa: 'CA-1', tenCa: 'Ca Este 12/09', nopLuc: '2026-09-12T10:00:00Z', tong: 8, diemI: 3, diemII: 2.5, diemIII: 2.5, tongCau: 28, soCauDung: 23, soCauSai: 5, ...o })
beforeEach(() => {
  mocks.lichSu = [CA({}), CA({ maCa: 'CA-2', tenCa: 'Ca Halogen 08/09', tong: 6.5, diemI: 3, diemII: 2, diemIII: 1.5 })]
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
const moTab = async () => {
  fireEvent.click(await screen.findByRole('button', { name: 'Mở menu' }))
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Xem điểm & lịch sử ca kiểm tra' }))
}

describe('mucDiem: bậc điểm → vai trò màu', () => {
  it('≥8 cao · ≥6,5 khá · ≥5 tb · dưới 5 thấp · null/NaN chưa chấm; đúng ở biên', () => {
    expect([10, 8, 7.99, 6.5, 6.49, 5, 4.99, 0].map(mucDiem)).toEqual(['cao', 'cao', 'kha', 'kha', 'tb', 'tb', 'thap', 'thap'])
    expect([null, undefined, NaN].map((x) => mucDiem(x as any))).toEqual(['chua', 'chua', 'chua'])
  })
})

describe('C2 · tab điểm ở cổng học sinh (/hs)', () => {
  it('mỗi ca một thẻ M3: tên, mã, điểm theo bậc, ngày giờ, dòng đếm, 3 điểm phần, hai nút; KHÔNG còn khung cuộn lồng nhau', async () => {
    datDuong('/hs')
    render(<StudentPortalScreen />)
    await moTab()
    await waitFor(() => expect(document.querySelectorAll('.lsc-the').length).toBe(2))
    const [a, b] = Array.from(document.querySelectorAll<HTMLElement>('.lsc-the'))
    expect(within(a).getByText('Ca Este 12/09')).toBeTruthy()
    expect(within(a).getByText('#CA-1')).toBeTruthy()
    expect(a.querySelector('.lsc-diem')!.getAttribute('data-muc')).toBe('cao')
    expect(a.querySelector('.lsc-diem')!.textContent).toBe('8.00/10')
    expect(b.querySelector('.lsc-diem')!.getAttribute('data-muc')).toBe('kha')
    expect(within(a).getByText('Phần I · Trắc nghiệm').nextElementSibling!.textContent).toBe('3.00')
    expect(a.querySelector('.lsc-dem')!.textContent).toMatch(/Đúng 23\/28 câu/)
    expect(screen.getByRole('region', { name: 'Lịch sử ca kiểm tra và báo cáo' })).toBeTruthy()
    expect(document.querySelector('.max-h-\\[65vh\\]')).toBeNull()
  })

  it('"Xem báo cáo" mở báo cáo ĐÚNG ca; "Xem đề và lời giải kèm lỗi sai" gọi đường cũ với mã ca + SBD', async () => {
    datDuong('/hs')
    mocks.deVaLoiGiai.mockResolvedValue({ html: '<html><body>Đề của em</body></html>' })
    render(<StudentPortalScreen />)
    await moTab()
    await waitFor(() => expect(document.querySelectorAll('.lsc-the').length).toBe(2))
    const b = document.querySelectorAll<HTMLElement>('.lsc-the')[1]
    fireEvent.click(within(b).getByRole('button', { name: /Xem báo cáo/ }))
    expect(await screen.findByText('Báo cáo CA-2')).toBeTruthy()
    expect(mocks.baoCao.mock.calls[0][0].maCa).toBe('CA-2')
    cleanup()
    mocks.deVaLoiGiai.mockClear()
    render(<StudentPortalScreen />)
    await moTab()
    await waitFor(() => expect(document.querySelectorAll('.lsc-the').length).toBe(2))
    fireEvent.click(within(document.querySelectorAll<HTMLElement>('.lsc-the')[0]).getByRole('button', { name: 'Xem đề và lời giải kèm lỗi sai' }))
    await waitFor(() => expect(mocks.deVaLoiGiai).toHaveBeenCalledTimes(1))
    expect(mocks.deVaLoiGiai.mock.calls[0].slice(1, 4)).toEqual(['CA-1', 'test', 'Em thử'])
  })

  it('ca CHƯA CHẤM: điểm "--", bậc "chua", KHÔNG có dòng đếm câu (cấm in "Đúng 0/0 câu")', async () => {
    datDuong('/hs')
    mocks.lichSu = [CA({ tong: null, diemI: null, diemII: null, diemIII: null, tongCau: null, soCauDung: null, soCauSai: null })]
    render(<StudentPortalScreen />)
    await moTab()
    await waitFor(() => expect(document.querySelectorAll('.lsc-the').length).toBe(1))
    const t = document.querySelector<HTMLElement>('.lsc-the')!
    expect(t.querySelector('.lsc-diem')!.getAttribute('data-muc')).toBe('chua')
    expect(t.querySelector('.lsc-diem b')!.textContent).toBe('--')
    expect(t.querySelector('.lsc-dem')).toBeNull()
    expect(t.textContent).not.toMatch(/Đúng 0\/0/)
    expect(t.querySelectorAll('.lsc-phan dd')[0].textContent).toBe('--')
  })

  it('chưa có ca nào: thẻ trống nói rõ; đang tải: skeleton, không khoảng trắng', () => {
    const { rerender, container } = render(<LichSuCaM3 dangTai ds={[]} ngayGio={() => ''} dongDem={() => null} dangMoDe={false} onXemBaoCao={() => {}} onXemDe={() => {}} />)
    expect(container.querySelector('[aria-busy="true"]')).toBeTruthy()
    expect(container.querySelectorAll('.m3-xuong').length).toBe(2)
    rerender(<LichSuCaM3 dangTai={false} ds={[]} ngayGio={() => ''} dongDem={() => null} dangMoDe={false} onXemBaoCao={() => {}} onXemDe={() => {}} />)
    expect(screen.getByText('Chưa có ca kiểm tra nào')).toBeTruthy()
    expect(screen.getByText(/chưa tham gia ca kiểm tra nào/)).toBeTruthy()
  })

  it('đang mở đề thì nút "Xem đề…" tắt (chống bấm đôi)', () => {
    render(<LichSuCaM3 dangTai={false} ds={[CA({}) as any]} ngayGio={() => 'x'} dongDem={() => null} dangMoDe onXemBaoCao={() => {}} onXemDe={() => {}} />)
    expect((screen.getByRole('button', { name: 'Xem đề và lời giải kèm lỗi sai' }) as HTMLButtonElement).disabled).toBe(true)
  })
})

describe('C2 · cô lập', () => {
  it('đường KHÔNG phải cổng học sinh (jsdom `/`): giữ NGUYÊN đoạn cũ, không có .lsc', async () => {
    datDuong('/')
    render(<StudentPortalScreen />)
    await moTab()
    expect(await screen.findByText('Lịch sử ca kiểm tra & Báo cáo kết quả')).toBeTruthy()
    await waitFor(() => expect(screen.getByRole('region', { name: 'Lịch sử ca kiểm tra và báo cáo' }).className).toContain('max-h-[65vh]'))
    expect(document.querySelector('.lsc')).toBeNull()
  })
})

describe('C2 · CSS', () => {
  const css = fs.readFileSync(path.join(process.cwd(), 'src/components/bang-nhiem-vu/lich-su-ca.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
  it('không mã màu cứng nào; mọi bộ chọn dưới .lsc; hai nút cao ≥ 48 px', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(css).not.toMatch(/\brgba?\(/)
    for (const m of css.replace(/@media[^{]*\{/g, '').matchAll(/([^{}]+)\{/g)) for (const b of m[1].split(',')) expect(b.trim().startsWith('.lsc'), b).toBe(true)
    expect(css).toMatch(/\.lsc-nut \.m3-nut-tonal[^{]*\{[^}]*min-height:\s*48px/)
  })
})
