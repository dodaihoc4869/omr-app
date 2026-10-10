// Lớp gọi máy chủ của Bảng nhiệm vụ: /hs/ke-hoach-ngay + /hs/ca-dang-mo, các hook, và nối dây vào
// StudentPortalScreen THẬT (kế hoạch máy chủ hiện lên; Vào thi đổi tertiary khi ca đang mở; lỗi → trợ lý).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import StudentPortalScreen from '../src/screens/StudentPortalScreen'
import { dongGoiBanNho, tuKeHoachNgay } from '../src/lib/nhiem-vu-adapter'
import { PETS } from '../src/game/than-thu-v2/core'
import {
  taiCaDangMo,
  taiKeHoachNgay,
  useCaDangMo,
  useKeHoachNgay,
  useLamMoiKhiDong,
  useSauVeDauTien,
} from '../src/components/bang-nhiem-vu/may-chu'

const mocks = vi.hoisted(() => ({ homework: vi.fn(), sheet: vi.fn(), items: [] as any[], momItems: [] as any[], lichSuCho: null as Promise<any> | null }))
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/game/than-thu-v2/Spirit2D', () => ({ default: ({ index, level }: any) => <div data-testid="thu" data-index={index} data-level={level} /> }))
vi.mock('../src/components/ThongBaoHocSinh', () => ({ default: () => null, noticeApi: vi.fn() }))
vi.mock('../src/game/than-thu-v2/academic-sync', () => ({ syncStudentExp: async () => {} }))
vi.mock('../src/lib/exam-db', async (original) => ({ ...(await original<any>()), loadScriptUrlHoacMacDinh: async () => '/test' }))
vi.mock('../src/lib/exam-api', async (original) => ({
  ...(await original<any>()),
  hsLichSuCaApi: () => mocks.lichSuCho ?? Promise.resolve({ ok: true, items: [] }),
  hsBtvnApi: async () => ({ ok: true, items: mocks.items }),
  thanThuDocApi: async () => ({ ok: true, hoSo: {} }),
}))
vi.mock('../src/lib/mom-api', async (original) => ({
  ...(await original<any>()),
  momApi: async () => ({ ok: true, items: mocks.momItems }),
}))
vi.mock('../src/lib/btvn-may-chu-moi', () => ({ btvnCuaEm: mocks.homework }))
vi.mock('../src/lib/btvn-cho-em', () => ({ layCauHinhChoEmBtvn: async () => ({ URL: '/test' }), dungPhieuBtvn: mocks.sheet }))

const NOW = Date.now()
const gio = (h: number) => new Date(NOW + h * 3600_000).toISOString()
const KE_HOACH = {
  ok: true,
  ngay: '2026-09-19',
  nganSach: { mucTieuCau: 12, toiThieuCau: 6, vanTocGiay: 78, vanTocNguon: 'do', ghiChuVanToc: '' },
  viec: [
    { id: 'on_lai:2026-09-19', loai: 'on_lai', soCau: 3, thuTu: 1, batBuoc: false, khan: false, cong: null, hien: true, nhan: 'bu', trangThai: 'cho', ghiChu: 'Ôn 3 câu đã tới hạn nhắc lại', chiTiet: { qid: ['a'] }, hanCung: null, hanMem: null, nguon: 'ho_so' },
    { id: 'than_thu:X', loai: 'than_thu', soCau: 6, thuTu: 2, batBuoc: false, khan: false, cong: 'on_lai:2026-09-19', hien: false, nhan: 'tuy_chon', trangThai: 'cho', ghiChu: 'Luyện dạng còn yếu với thần thú', chiTiet: { dang: 'X' }, hanCung: null, hanMem: null, nguon: 'ho_so' },
  ],
  canhBao: [],
  quaHan: [],
  tienBo: { daLamCau: 2, lenBac: 1, tutBac: 0, dat: false, toiThieuCau: 6, conThieu: 4 },
  chuoiDat: 0,
  lanNghi: false,
  capNhatLuc: gio(-0.1),
}

type Tra = { status?: number; body?: any; nem?: boolean; cho?: Promise<void> }
let cuocGoi: { url: string; body: any }[] = []
let tra: Record<string, Tra | (() => Tra)> = {}
function giaLapFetch() {
  cuocGoi = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: any) => {
      const u = String(url)
      let body: any = {}
      try { body = JSON.parse(init?.body || '{}') } catch {}
      cuocGoi.push({ url: u, body })
      const duong = new URL(u).pathname
      const r = typeof tra[duong] === 'function' ? (tra[duong] as () => Tra)() : (tra[duong] as Tra | undefined)
      if (r?.nem) throw new Error('mất mạng')
      if (r?.cho) await r.cho
      const status = r?.status ?? 200
      return { ok: status >= 200 && status < 300, status, json: async () => r?.body ?? { ok: true, items: [] } }
    }),
  )
}
const goiTheo = (duong: string) => cuocGoi.filter((c) => new URL(c.url).pathname === duong)

beforeEach(() => {
  tra = {}
  giaLapFetch()
})
afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
  vi.useRealTimers()
  vi.clearAllMocks()
})

describe('taiKeHoachNgay / taiCaDangMo', () => {
  it('có token → gửi {token} (không lộ sbd); không token → gửi {sbd}; đúng đường /hs/ke-hoach-ngay', async () => {
    tra['/hs/ke-hoach-ngay'] = { body: KE_HOACH }
    expect(await taiKeHoachNgay({ token: 'tk', sbd: '123' })).toMatchObject({ ok: true })
    expect(goiTheo('/hs/ke-hoach-ngay')[0].body).toEqual({ token: 'tk' })
    await taiKeHoachNgay({ sbd: '123' })
    expect(goiTheo('/hs/ke-hoach-ngay')[1].body).toEqual({ sbd: '123' })
    expect(cuocGoi[0].url).toBe('https://may.test/hs/ke-hoach-ngay')
  })

  it('lỗi mạng, 404/500, JSON không đủ phần, ok:false → null (không ném)', async () => {
    for (const t of [{ nem: true }, { status: 404 }, { status: 500, body: KE_HOACH }, { body: { ok: true, items: [] } }, { body: { ok: false, error: 'x' } }, { body: null }] as Tra[]) {
      tra['/hs/ke-hoach-ngay'] = t
      expect(await taiKeHoachNgay({ token: 'tk' })).toBeNull()
    }
  })

  it('ca đang mở: chỉ coCaMo:true (và ok:true) mới là true; lỗi/404/thiếu trường/ok:false → false', async () => {
    tra['/hs/ca-dang-mo'] = { body: { ok: true, coCaMo: true, soCa: 2 } }
    expect(await taiCaDangMo({ token: 'tk' })).toBe(true)
    expect(goiTheo('/hs/ca-dang-mo')[0].body).toEqual({ token: 'tk' })
    for (const t of [{ body: { ok: true, coCaMo: false, soCa: 0 } }, { body: { ok: true } }, { body: { ok: false, coCaMo: true } }, { status: 404 }, { nem: true }] as Tra[]) {
      tra['/hs/ca-dang-mo'] = t
      expect(await taiCaDangMo({ sbd: '1' })).toBe(false)
    }
  })
})

describe('các hook', () => {
  it('useKeHoachNgay: có kế hoạch; lần sau lỗi thì GIỮ bản cuối và báo cu; hồi lại thì hết cu', async () => {
    tra['/hs/ke-hoach-ngay'] = { body: KE_HOACH }
    const { result, rerender } = renderHook(({ n }) => useKeHoachNgay({ token: 'tk' }, true, n), { initialProps: { n: 0 } })
    expect(result.current).toMatchObject({ keHoach: null, daXong: false, cu: false })
    await waitFor(() => expect(result.current.daXong).toBe(true))
    expect(result.current.keHoach?.tienBo.daLamCau).toBe(2)
    expect(result.current.cu).toBe(false)

    tra['/hs/ke-hoach-ngay'] = { nem: true }
    rerender({ n: 1 })
    await waitFor(() => expect(result.current.cu).toBe(true))
    expect(result.current.keHoach?.tienBo.daLamCau).toBe(2)

    tra['/hs/ke-hoach-ngay'] = { body: { ...KE_HOACH, tienBo: { ...KE_HOACH.tienBo, daLamCau: 5 } } }
    rerender({ n: 2 })
    await waitFor(() => expect(result.current.keHoach?.tienBo.daLamCau).toBe(5))
    expect(result.current.cu).toBe(false)
  })

  it('useKeHoachNgay: lỗi ngay lần đầu ⇒ daXong nhưng KHÔNG có kế hoạch cũ (rơi về trợ lý), cu = false', async () => {
    tra['/hs/ke-hoach-ngay'] = { nem: true }
    const { result } = renderHook(() => useKeHoachNgay({ token: 'tk' }, true, 0))
    await waitFor(() => expect(result.current.daXong).toBe(true))
    expect(result.current).toMatchObject({ keHoach: null, cu: false })
  })

  it('useKeHoachNgay: đổi người (đăng xuất/đăng nhập) không rò kế hoạch của người trước; chưa bật thì không gọi', async () => {
    tra['/hs/ke-hoach-ngay'] = { body: KE_HOACH }
    const { result, rerender } = renderHook(({ tk }) => useKeHoachNgay({ token: tk }, !!tk, 0), { initialProps: { tk: 'a' } })
    await waitFor(() => expect(result.current.keHoach).not.toBeNull())
    rerender({ tk: '' })
    expect(result.current).toMatchObject({ keHoach: null, daXong: false })
    const truoc = goiTheo('/hs/ke-hoach-ngay').length
    await new Promise((r) => setTimeout(r, 30))
    expect(goiTheo('/hs/ke-hoach-ngay').length).toBe(truoc)
  })

  it('useCaDangMo: true khi máy chủ báo coCaMo; tự về false khi 404; tắt thì luôn false', async () => {
    tra['/hs/ca-dang-mo'] = { body: { ok: true, coCaMo: true, soCa: 1 } }
    const { result } = renderHook(() => useCaDangMo({ token: 'tk' }, true))
    expect(result.current).toBe(false)
    await waitFor(() => expect(result.current).toBe(true))
    const tat = renderHook(() => useCaDangMo({ token: 'tk' }, false))
    await new Promise((r) => setTimeout(r, 20))
    expect(tat.result.current).toBe(false)
  })

  it('useLamMoiKhiDong: chỉ tăng khi chuyển true → false (vừa đóng một màn)', () => {
    const { result, rerender } = renderHook(({ m }) => useLamMoiKhiDong(m), { initialProps: { m: false } })
    expect(result.current).toBe(0)
    rerender({ m: true })
    expect(result.current).toBe(0)
    rerender({ m: false })
    expect(result.current).toBe(1)
    rerender({ m: false })
    expect(result.current).toBe(1)
  })

  it('useSauVeDauTien: false ở khung đầu, true sau một nhịp rảnh', async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useSauVeDauTien())
    expect(result.current).toBe(false)
    await act(async () => { vi.advanceTimersByTime(300) })
    expect(result.current).toBe(true)
  })
})







describe('tab BTVN của học sinh nói đúng hệ CHẶNG (không còn "3 Vòng Phân Tầng", không "nắm chắc")', () => {
  it('mở từ menu ba chấm: tiêu đề/banner/nhãn từng bài nói "chia chặng theo ngày/giờ"', async () => {
    localStorage.setItem('omr_student_portal_auth', JSON.stringify({ sbd: 'test', hoTen: 'Em thử', token: 'test-token' }))
    mocks.items = [{ maBtvn: 'BT1', maCa: 'CA1', soCau: 8, tenBtvn: 'Bài test', giaoLuc: gio(-5), hanNop: gio(48), daNop: false, soLanLamLaiConLai: 3 }]
    mocks.momItems = []
    tra['/hs/ke-hoach-ngay'] = { body: KE_HOACH }
    const { container } = render(<StudentPortalScreen />)
    fireEvent.click(await screen.findByRole('button', { name: 'Của em' }))
    fireEvent.click(await screen.findByRole('button', { name: /^Bài tập được giao/ }))
    expect(await screen.findByText('Cách làm bài tập về nhà: chia chặng theo ngày/giờ')).toBeTruthy()
    const chu = container.textContent!
    expect(chu).toContain('CHẶNG ĐANG MỞ')
    expect(chu).toContain('Chia chặng theo ngày/giờ')
    expect(chu).not.toMatch(/3 Vòng|Phân Tầng|VÒNG [123]|Vòng [123]|nắm chắc/i)
  })
})



// 10/10: thẻ game/việc cũ đã gỡ theo lệnh thầy. Kế hoạch/API/hook vẫn kiểm ở trên;
// giao câu ôn/mới, quyền và nháp kiểm tại hoc-tap-tap-trung/giao-dien-1010.
describe('cổng học tập đọc kế hoạch cũ khi cờ 2.0 tắt',()=>{
 beforeEach(()=>{localStorage.setItem('omr_student_portal_auth',JSON.stringify({sbd:'test',hoTen:'Em thử',token:'test-token'}));tra['/game-v2/hoc-tap-sanh']={body:{ok:true,cheDo2:false}}})
 it('tiến độ đúng nguồn máy chủ, không hiện thần thú từ kế hoạch cũ',async()=>{tra['/hs/ke-hoach-ngay']={body:KE_HOACH};render(<StudentPortalScreen/>);await waitFor(()=>expect(screen.getByRole('progressbar').getAttribute('value')).toBe('2'));expect(screen.getByRole('progressbar').getAttribute('max')).toBe('12');expect(screen.queryByRole('button',{name:/Thần thú|Chưa chọn thần thú/})).toBeNull();expect(goiTheo('/hs/ke-hoach-ngay')[0].body).toEqual({token:'test-token'})})
 it('ca mở có lối vào kiểm tra, không có ca vẫn nhập mã được từ Của em',async()=>{tra['/hs/ca-dang-mo']={body:{ok:true,coCaMo:true}};render(<StudentPortalScreen/>);expect(await screen.findByRole('button',{name:'Vào kiểm tra'})).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'Vào kiểm tra'}));expect(await screen.findByRole('dialog',{name:'Vào phòng thi'})).toBeTruthy()})
})
