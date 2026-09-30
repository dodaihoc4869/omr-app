// 30/09: ca kiểm tra đang mở tạm giữ câu còn lại của kế hoạch ⇒ Sảnh nói rõ "Có n câu … tạm giữ" (không còn "chưa có câu nào" gây tưởng lỗi);
// màn xong (dọc + ngang) thêm dòng "+n câu tạm giữ vì ca kiểm tra, mở lại sau ca". Máy chủ chỉ gửi SỐ câu (`tamGiu.ca`), không qid / mã ca.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import SanhBanDo, { type SanhBanDoProps } from '../src/components/hoa2/SanhBanDo'
import { docSanh, type KetQuaSanh } from '../src/components/hoa2/api'
import { MQ_NGANG, MQ_NGANG_THAP } from '../src/components/hoa2/bo-cuc-ngang'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))

const NOW = Date.UTC(2026, 8, 30, 7, 0, 0)
const CD = { id: 'cd1', ten: 'Ester – Lipid', hanNop: '2026-10-04', D: 5, tong: 120, coXat: 67, thanhThao: 0, canDayLai: 0, thanhThaoTangTu: '2026-10-02' }
const GOC = { ok: true, cheDo2: true, ngay: '2026-09-30', chienDich: CD, huyetChien: false, khoaDao: false, loiKhoaDao: '' }
const TRONG = { ...GOC, theLuc: { con: 0, tong: 0 }, doan: { con: 0 }, dao: { con: 0 }, ruong: { daLam: 0, tong: 0, moDuoc: false, daMo: false } }
const XONG = { ...GOC, theLuc: { con: 0, tong: 24 }, doan: { con: 0 }, dao: { con: 0 }, ruong: { daLam: 24, tong: 24, moDuoc: true, daMo: false } }
const CU = 'Hôm nay chưa có câu nào trong kế hoạch của em'
const GIU = 'Có 22 câu hôm nay đang tạm giữ vì lớp đang có ca kiểm tra. Câu sẽ tự mở lại sau khi ca kết thúc.'
const DONG_XONG = '+22 câu tạm giữ vì ca kiểm tra, mở lại sau ca'

function datMan(rong: number, cao: number) {
  const ngangHuong = rong > cao
  vi.stubGlobal('innerHeight', cao)
  vi.stubGlobal('matchMedia', vi.fn((q: string) => ({
    matches: q === MQ_NGANG ? rong >= 1024 || (ngangHuong && rong >= 700) : q === MQ_NGANG_THAP ? ngangHuong && cao <= 500 : false,
    media: q, addEventListener: () => {}, removeEventListener: () => {},
  })))
}
function ve(sanh: Record<string, unknown>) {
  const props: SanhBanDoProps = {
    ketQua: docSanh(sanh) as KetQuaSanh, loi: '', dangTai: false, thu: { index: 2, cap: 7, ten: 'Lửa Nhỏ' }, exp: { homNay: 22, conThieu: 160 }, chuoiNgay: 5,
    caDangMo: true, now: NOW, token: 'tk', shopBat: true,
    onVaoThi: vi.fn(), onPhaPhucKich: vi.fn(), onKhamPhaDao: vi.fn(), onCauDaLam: vi.fn(), onTuiDo: vi.fn(), onCuaHang: vi.fn(), onMoThanThu: vi.fn(), onChonThu: vi.fn(), onDangXuat: vi.fn(), onTaiLai: vi.fn(),
  }
  return render(<SanhBanDo {...props} />)
}

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('docSanh đọc tamGiu', () => {
  it('có tamGiu.ca ⇒ tamGiuCa = số; thiếu / rác ⇒ 0', () => {
    const lay = (x: Record<string, unknown>) => { const k = docSanh(x); return k && 'sanh' in k ? k.sanh.tamGiuCa : NaN }
    expect(lay({ ...TRONG, tamGiu: { ca: 22 } })).toBe(22)
    expect(lay(TRONG)).toBe(0)
    expect(lay({ ...TRONG, tamGiu: { ca: -3 } })).toBe(0)
    expect(lay({ ...TRONG, tamGiu: 'x' })).toBe(0)
  })
})

describe.each([['dọc', 390, 844], ['ngang', 1280, 800]] as const)('Sảnh %s', (_ten, rong, cao) => {
  it('không còn câu vì ca giữ ⇒ báo số câu tạm giữ, không nói "chưa có câu nào"', () => {
    datMan(rong, cao)
    const { container } = ve({ ...TRONG, tamGiu: { ca: 22 } })
    expect(container.textContent).toContain(GIU)
    expect(container.textContent).not.toContain(CU)
    expect(container.querySelector('[data-khoi="tam-giu-ca"]')).not.toBeNull()
  })
  it('không có câu giữ ⇒ giữ nguyên câu cũ', () => {
    datMan(rong, cao)
    const { container } = ve(TRONG)
    expect(container.textContent).toContain(CU)
    expect(container.querySelector('[data-khoi="tam-giu-ca"]')).toBeNull()
  })
  it('xong kế hoạch + câu tạm giữ ⇒ thêm dòng "+n câu tạm giữ…"; không giữ ⇒ không có dòng', () => {
    datMan(rong, cao)
    const a = ve({ ...XONG, tamGiu: { ca: 22 } })
    expect(a.container.textContent).toContain('Hôm nay em xong rồi')
    expect(a.container.textContent).toContain(DONG_XONG)
    cleanup()
    const b = ve(XONG)
    expect(b.container.textContent).not.toContain('tạm giữ')
  })
})
