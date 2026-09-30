// THỬ SỨC THÊM (thầy chốt 30/09): Sảnh (dọc + ngang) vẽ nút PHỤ "Thử sức thêm (không bắt buộc)" + dòng "Lấy trước {n} câu mới của ngày mai"
// ở màn xong kế hoạch và chỗ "không còn câu" — CHỈ khi máy chủ gửi `thuSucThem.duoc` với số câu dương. Bấm ⇒ gọi `hoa2-thu-suc-them` ⇒ tải lại Sảnh.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import SanhBanDo, { type SanhBanDoProps } from '../src/components/hoa2/SanhBanDo'
import { docSanh, type KetQuaSanh } from '../src/components/hoa2/api'
import { MQ_NGANG, MQ_NGANG_THAP } from '../src/components/hoa2/bo-cuc-ngang'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))

const NOW = Date.UTC(2026, 8, 30, 7, 0, 0)
const CD = { id: 'cd1', ten: 'Ester – Lipid', hanNop: '2026-10-05', D: 6, tong: 120, coXat: 30, thanhThao: 0, canDayLai: 0, thanhThaoTangTu: '2026-10-02' }
const GOC = { ok: true, cheDo2: true, ngay: '2026-09-30', chienDich: CD, huyetChien: false, khoaDao: false, loiKhoaDao: '' }
const XONG_MO = { ...GOC, theLuc: { con: 0, tong: 30 }, doan: { con: 0 }, dao: { con: 0 }, ruong: { daLam: 30, tong: 30, moDuoc: true, daMo: true, qua: { vang: 20 } } }
const TRONG = { ...GOC, theLuc: { con: 0, tong: 0 }, doan: { con: 0 }, dao: { con: 0 }, ruong: { daLam: 0, tong: 0, moDuoc: false, daMo: false } }
const DUOC = { thuSucThem: { duoc: true, soCau: 19 } }
const NUT = 'Thử sức thêm (không bắt buộc)'
const PHU = 'Lấy trước 19 câu mới của ngày mai'

function datMan(rong: number, cao: number) {
  const ngangHuong = rong > cao
  vi.stubGlobal('innerHeight', cao)
  vi.stubGlobal('matchMedia', vi.fn((q: string) => ({
    matches: q === MQ_NGANG ? rong >= 1024 || (ngangHuong && rong >= 700) : q === MQ_NGANG_THAP ? ngangHuong && cao <= 500 : false,
    media: q, addEventListener: () => {}, removeEventListener: () => {},
  })))
}
function ve(sanh: Record<string, unknown>, onTaiLai = vi.fn()) {
  const props: SanhBanDoProps = {
    ketQua: docSanh(sanh) as KetQuaSanh, loi: '', dangTai: false, thu: { index: 2, cap: 7, ten: 'Lửa Nhỏ' }, exp: { homNay: 22, conThieu: 160 }, chuoiNgay: 5,
    caDangMo: false, now: NOW, token: 'tk', shopBat: true,
    onVaoThi: vi.fn(), onPhaPhucKich: vi.fn(), onKhamPhaDao: vi.fn(), onCauDaLam: vi.fn(), onTuiDo: vi.fn(), onCuaHang: vi.fn(), onMoThanThu: vi.fn(), onChonThu: vi.fn(), onDangXuat: vi.fn(), onTaiLai,
  }
  return render(<SanhBanDo {...props} />)
}
const nut = (c: HTMLElement) => c.querySelectorAll<HTMLButtonElement>('[data-khoi="thu-suc-them"]')

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('docSanh đọc thuSucThem', () => {
  it('duoc + số câu dương ⇒ giữ; thiếu / soCau 0 / rác ⇒ { duoc: false, soCau: 0 }', () => {
    const lay = (x: Record<string, unknown>) => { const k = docSanh(x); return k && 'sanh' in k ? k.sanh.thuSucThem : null }
    expect(lay({ ...XONG_MO, ...DUOC })).toEqual({ duoc: true, soCau: 19 })
    expect(lay(XONG_MO)).toEqual({ duoc: false, soCau: 0 })
    expect(lay({ ...XONG_MO, thuSucThem: { duoc: true, soCau: 0 } })).toEqual({ duoc: false, soCau: 0 })
    expect(lay({ ...XONG_MO, thuSucThem: { duoc: 'true', soCau: 19 } })).toEqual({ duoc: false, soCau: 0 })
    expect(lay({ ...XONG_MO, thuSucThem: 'x' })).toEqual({ duoc: false, soCau: 0 })
  })
})

describe.each([['dọc', 390, 844], ['ngang', 1280, 800]] as const)('Sảnh %s', (_ten, rong, cao) => {
  it('xong kế hoạch, rương đã mở, máy chủ cho ⇒ ĐÚNG MỘT nút phụ "Thử sức thêm (không bắt buộc)" + dòng "Lấy trước 19 câu mới của ngày mai"', () => {
    datMan(rong, cao)
    const { container } = ve({ ...XONG_MO, ...DUOC })
    expect(container.textContent).toContain('Hôm nay em xong rồi')
    const ds = nut(container)
    expect(ds).toHaveLength(1)
    expect(ds[0]!.textContent).toContain(NUT)
    expect(ds[0]!.textContent).toContain(PHU)
    expect(ds[0]!.classList.contains('h2-nut-chinh')).toBe(false) // nút phụ, không tranh nút chính vàng
    expect(container.textContent).not.toContain('MỞ RƯƠNG BÁT LINH')
  })
  it('máy chủ không cho (hết câu mới / chưa mở rương / máy chủ cũ) ⇒ không có nút', () => {
    datMan(rong, cao)
    const a = ve(XONG_MO)
    expect(nut(a.container)).toHaveLength(0)
    expect(a.container.textContent).not.toContain('Thử sức thêm')
    cleanup()
    const b = ve({ ...XONG_MO, thuSucThem: { duoc: false, soCau: 0 } })
    expect(nut(b.container)).toHaveLength(0)
  })
  it('chỗ "không còn câu" (kế hoạch rỗng) + máy chủ cho ⇒ có nút', () => {
    datMan(rong, cao)
    const { container } = ve({ ...TRONG, ...DUOC })
    expect(container.textContent).toContain('Hôm nay chưa có câu nào trong kế hoạch của em')
    expect(nut(container)).toHaveLength(1)
    expect(container.textContent).toContain(PHU)
  })
  it('bấm ⇒ gọi hoa2-thu-suc-them kèm token ⇒ tải lại Sảnh', async () => {
    datMan(rong, cao)
    const fetch = vi.fn(async () => ({ json: async () => ({ ok: true, them: 19 }) }))
    vi.stubGlobal('fetch', fetch)
    const onTaiLai = vi.fn()
    const { container } = ve({ ...XONG_MO, ...DUOC }, onTaiLai)
    fireEvent.click(nut(container)[0]!)
    await waitFor(() => expect(onTaiLai).toHaveBeenCalledTimes(1))
    const [url, init] = fetch.mock.calls[0] as unknown as [string, { body: string }]
    expect(url).toBe('https://may.test/game-v2/hoa2-thu-suc-them')
    expect(JSON.parse(init.body)).toEqual({ token: 'tk' })
  })
  it('máy chủ từ chối ⇒ hiện đúng câu của máy chủ, không tải lại', async () => {
    datMan(rong, cao)
    vi.stubGlobal('fetch', vi.fn(async () => ({ json: async () => ({ ok: false, ma: 'du_tran', error: 'Hôm nay em đã nhận đủ số câu tối đa trong ngày.' }) })))
    const onTaiLai = vi.fn()
    const { container, findByRole } = ve({ ...XONG_MO, ...DUOC }, onTaiLai)
    fireEvent.click(nut(container)[0]!)
    expect((await findByRole('alert')).textContent).toBe('Hôm nay em đã nhận đủ số câu tối đa trong ngày.')
    expect(onTaiLai).not.toHaveBeenCalled()
  })
})
