// BI-A PHẢN ỨNG · CỬA THỨ BA TRÊN SẢNH BÁT LINH (đặc tả mục 8.1) + công tắc cờ: `hoa2-sanh` gửi `bia` khi cờ bật cho em;
// còn câu ⇒ "Bi-a Phản Ứng · còn c/t câu"; hết trần ⇒ mờ; xong kế hoạch ⇒ Bàn giao hữu; có ca ⇒ mờ; cờ tắt ⇒ không có cửa.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, configure, fireEvent, render, screen, waitFor } from '@testing-library/react'
import SanhBanDo, { type SanhBanDoProps } from '../src/components/hoa2/SanhBanDo'
import { docBiaTrenSanh, docSanh, type KetQuaSanh } from '../src/components/hoa2/api'
import StudentPortalScreen from '../src/screens/StudentPortalScreen'

const mocks = vi.hoisted(() => ({ items: [] as any[] }))
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/game/than-thu-v2/Spirit2D', () => ({ default: ({ index, level }: any) => <div data-testid="thu" data-index={index} data-level={level} /> }))
vi.mock('../src/components/ThongBaoHocSinh', () => ({ default: () => null, noticeApi: vi.fn() }))
vi.mock('../src/game/than-thu-v2/academic-sync', () => ({ syncStudentExp: async () => {} }))
vi.mock('../src/lib/exam-db', async (original) => ({ ...(await original<any>()), loadScriptUrlHoacMacDinh: async () => '/test' }))
vi.mock('../src/lib/exam-api', async (original) => ({
  ...(await original<any>()),
  hsLichSuCaApi: () => Promise.resolve({ ok: true, items: [] }),
  hsBtvnApi: async () => ({ ok: true, items: mocks.items }),
  thanThuDocApi: async () => ({ ok: true, hoSo: {} }),
}))
vi.mock('../src/lib/mom-api', async (original) => ({ ...(await original<any>()), momApi: async () => ({ ok: true, items: [] }) }))

// BiaGame tải lười (lazy + Suspense): máy bận lúc chạy cả bộ test thì lâu hơn 1 giây mặc định.
configure({ asyncUtilTimeout: 10000 })
vi.setConfig({ testTimeout: 30000 })
const NOW = Date.UTC(2026, 8, 30, 7, 0, 0)
const SANH = {
  ok: true, cheDo2: true, ngay: '2026-09-30',
  chienDich: { id: 'cd1', ten: 'Ester – Lipid', hanNop: '2026-10-04', D: 5, tong: 120, coXat: 67, thanhThao: 0, canDayLai: 0, thanhThaoTangTu: '2026-10-02' },
  theLuc: { con: 32, tong: 40 }, huyetChien: false, doan: { con: 4 }, dao: { con: 28 }, khoaDao: false,
  ruong: { daLam: 8, tong: 40, moDuoc: false, daMo: false },
  bia: { bat: true, con: 12, tong: 15, giaoHuu: { mo: false, con: 2 } },
}
let cuocGoi: { url: string; body: any }[] = []
let tra: Record<string, any> = {}
beforeEach(() => {
  tra = {}; cuocGoi = []
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: any) => {
    let body: any = {}
    try { body = JSON.parse(init?.body || '{}') } catch { /* rỗng */ }
    cuocGoi.push({ url: String(url), body })
    return { ok: true, status: 200, json: async () => tra[new URL(String(url)).pathname] ?? { ok: true, items: [] } }
  }))
})
afterEach(() => { cleanup(); localStorage.clear(); sessionStorage.clear(); vi.unstubAllGlobals(); vi.clearAllMocks() })

function veSanh(bia: unknown, ghiDe: Partial<SanhBanDoProps> = {}) {
  const props: SanhBanDoProps = {
    ketQua: docSanh({ ...SANH, bia }) as KetQuaSanh, loi: '', dangTai: false, thu: { index: 2, cap: 7, ten: 'Lửa Nhỏ' }, exp: { homNay: 22, conThieu: 160 },
    chuoiNgay: 5, caDangMo: false, now: NOW, token: 'tk', shopBat: true,
    onVaoThi: vi.fn(), onPhaPhucKich: vi.fn(), onKhamPhaDao: vi.fn(), onCauDaLam: vi.fn(), onTuiDo: vi.fn(), onCuaHang: vi.fn(),
    onMoThanThu: vi.fn(), onChonThu: vi.fn(), onDangXuat: vi.fn(), onTaiLai: vi.fn(), onChoiBia: vi.fn(), ...ghiDe,
  }
  return { ...render(<SanhBanDo {...props} />), props }
}

describe('docBiaTrenSanh (đọc chặt)', () => {
  it('cờ tắt / thiếu ⇒ null; số âm hay sai kiểu ⇒ 0; lý do khoá giữ nguyên', () => {
    expect(docBiaTrenSanh(undefined)).toBeNull()
    expect(docBiaTrenSanh({ bat: false, con: 3 })).toBeNull()
    expect(docBiaTrenSanh({ bat: true, con: -2, tong: 'x', giaoHuu: { mo: true, con: 1 }, lyDoKhoa: 'dang_co_ca' })).toEqual({ con: 0, tong: 0, giaoHuu: { mo: true, con: 1 }, lyDoKhoa: 'dang_co_ca' })
  })
})

describe('Cửa Bi-a trên Sảnh bản đồ', () => {
  it('còn câu ⇒ "Bi-a Phản Ứng · còn 12/15 câu", bấm được', () => {
    const { props } = veSanh(SANH.bia)
    const nut = screen.getByRole('button', { name: /Bi-a Phản Ứng · còn 12\/15 câu/ }) as HTMLButtonElement
    expect(nut.disabled).toBe(false)
    fireEvent.click(nut)
    expect(props.onChoiBia).toHaveBeenCalledTimes(1)
  })
  it('hết trần Bi-a ⇒ "Hết câu Bi-a hôm nay" mờ, nhắc số câu Đoàn/Đảo còn lại', () => {
    veSanh({ bat: true, con: 0, tong: 15, lyDoKhoa: 'het_tran', giaoHuu: { mo: false, con: 2 } })
    const nut = screen.getByRole('button', { name: /Hết câu Bi-a hôm nay/ }) as HTMLButtonElement
    expect(nut.disabled).toBe(true)
    expect(nut.textContent).toContain('Đoàn còn 4 câu · Đảo còn 28 câu')
  })
  it('xong kế hoạch ⇒ Bàn giao hữu (không câu, không EXP)', () => {
    veSanh({ bat: true, con: 0, tong: 15, lyDoKhoa: 'xong_ke_hoach', giaoHuu: { mo: true, con: 1 } })
    const nut = screen.getByRole('button', { name: /Bàn giao hữu Bi-a · còn 1\/2 ván/ }) as HTMLButtonElement
    expect(nut.disabled).toBe(false)
    expect(nut.textContent).toContain('Không câu, không EXP')
  })
  it('đang có ca kiểm tra ⇒ mờ, "Bi-a mở lại khi ca kết thúc"', () => {
    veSanh({ bat: true, con: 12, tong: 15, lyDoKhoa: 'dang_co_ca', giaoHuu: { mo: false, con: 2 } })
    const nut = screen.getByRole('button', { name: /đang có ca kiểm tra/ }) as HTMLButtonElement
    expect(nut.disabled).toBe(true)
    expect(nut.textContent).toContain('Bi-a mở lại khi ca kết thúc')
  })
  it('cờ Bi-a tắt (máy chủ không gửi bia) ⇒ không có cửa', () => {
    veSanh(undefined)
    expect(screen.queryByRole('button', { name: /Bi-a/ })).toBeNull()
  })
})



// 10/10: cờ Bi-a cũ không được mở lại game ở giao diện học tập.
it('máy chủ vẫn có cờ Bi-a nhưng app học sinh chỉ mở học tập',async()=>{tra['/game-v2/hoc-tap-sanh']=SANH;localStorage.setItem('omr_student_portal_auth',JSON.stringify({sbd:'test',hoTen:'Em thử',token:'test-token'}));render(<StudentPortalScreen/>);expect(await screen.findByRole('button',{name:'Tiếp tục học'})).toBeTruthy();expect(screen.queryByRole('button',{name:/Bi-a/})).toBeNull();expect(cuocGoi.some(x=>x.url.includes('/bia-sanh'))).toBe(false)})
