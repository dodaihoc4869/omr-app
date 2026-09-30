// SẢNH 3D (lớp hình theo bản vẽ động docs/ban-ve-sanh-dong-2809/Sanh-Dong.html, thầy chốt 28/09):
// dữ liệu/nút/luồng giữ nguyên; kiểm 3 trạng thái, sương mù theo % khai phá THẬT, giảm chuyển động ⇒ không thị sai / không mở màn.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import SanhBanDo, { type SanhBanDoProps } from '../src/components/hoa2/SanhBanDo'
import { banKinhKhaiPha, taoCanh } from '../src/components/hoa2/CanhSanh3D'
import { KHOA_MO_MAN } from '../src/components/hoa2/hieu-ung-sanh'
import { docSanh, type KetQuaSanh } from '../src/components/hoa2/api'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))

const NOW = Date.UTC(2026, 8, 30, 7, 0, 0)
const A = {
  ok: true,
  cheDo2: true,
  ngay: '2026-09-30',
  chienDich: { id: 'cd1', ten: 'Carbohydrate', hanNop: '2026-10-05', D: 5, tong: 170, coXat: 13, thanhThao: 0, canDayLai: 0 },
  theLuc: { con: 47, tong: 60 },
  huyetChien: false,
  doan: { con: 3 },
  dao: { con: 44 },
  khoaDao: true,
  loiKhoaDao: 'Có xe hàng đang bị phục kích, hãy hoàn thành Hộ Tống trước khi ra Đảo nhé!',
  ruong: { daLam: 13, tong: 60, moDuoc: false, daMo: false },
}
const B = { ...A, doan: { con: 0 }, khoaDao: false, loiKhoaDao: undefined }
const C = { ...A, theLuc: { con: 0, tong: 60 }, doan: { con: 0 }, dao: { con: 0 }, khoaDao: false, ruong: { daLam: 60, tong: 60, moDuoc: true, daMo: false } }

function ve(sanh: Record<string, unknown>) {
  const props: SanhBanDoProps = {
    ketQua: docSanh(sanh) as KetQuaSanh,
    loi: '',
    dangTai: false,
    thu: { index: 2, cap: 7, ten: 'Lửa Nhỏ' },
    exp: { homNay: 169, conThieu: 160 },
    chuoiNgay: 4,
    caDangMo: false,
    now: NOW,
    token: 'tk',
    shopBat: true,
    onVaoThi: vi.fn(),
    onPhaPhucKich: vi.fn(),
    onKhamPhaDao: vi.fn(),
    onCauDaLam: vi.fn(),
    onTuiDo: vi.fn(),
    onCuaHang: vi.fn(),
    onMoThanThu: vi.fn(),
    onChonThu: vi.fn(),
    onDangXuat: vi.fn(),
    onTaiLai: vi.fn(),
  }
  return { ...render(<SanhBanDo {...props} />), props }
}

/** matchMedia giả: chỉ trả lời truy vấn prefers-reduced-motion (bản dọc cho mọi điểm ngắt khác). */
function datGiam(giam: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((q: string) => ({ matches: q.includes('prefers-reduced-motion') ? giam : false, media: q, addEventListener: () => {}, removeEventListener: () => {} })),
  )
}

afterEach(() => {
  cleanup()
  sessionStorage.clear()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('Sảnh 3D — ba trạng thái giữ đúng nút và chữ', () => {
  it('(a) còn ổ phục kích: MỘT nút vàng "PHÁ 3 Ổ PHỤC KÍCH", 3 ổ trên đường, cầu kéo lên, Đảo khoá kèm câu máy chủ', () => {
    const { container, props } = ve(A)
    expect(container.querySelectorAll('.h2-nut-chinh').length).toBe(1)
    fireEvent.click(screen.getByRole('button', { name: /PHÁ 3 Ổ PHỤC KÍCH/ }))
    expect(props.onPhaPhucKich).toHaveBeenCalledTimes(1)
    expect(container.querySelector('.h2-ban-do')!.getAttribute('data-tt')).toBe('a')
    expect(container.querySelector('[data-ve="o-phuc-kich"]')!.getAttribute('data-so')).toBe('3')
    expect(container.querySelector('[data-ve="cau-keo-len"]')).not.toBeNull()
    expect(container.textContent).toContain('3 câu ôn còn lại')
    expect(container.textContent).toContain('Đảo Carbohydrate · 8% đã khai phá')
    const dao = screen.getByRole('button', { name: /Khám phá Bát Linh Đảo · 44 câu/ }) as HTMLButtonElement
    expect(dao.disabled).toBe(true)
    expect(dao.textContent).toContain(A.loiKhoaDao)
    // HUD: ảnh THẬT của thần thú (không hình tượng trưng)
    expect(container.querySelector('.h2-luc-giac img')!.getAttribute('src')).toBe('/than-thu-v2/nho/thu-2-0-be.webp')
    expect(screen.getByLabelText('Thể lực hôm nay: còn 47/60 câu')).toBeTruthy()
    expect(container.textContent).toContain('Chuỗi 4 ngày')
  })

  it('(b) hết ổ: MỘT nút vàng "KHÁM PHÁ BÁT LINH ĐẢO · 44 câu", cầu hạ, nhãn "Cầu sang đảo đã hạ", 0 ổ', () => {
    const { container, props } = ve(B)
    expect(container.querySelectorAll('.h2-nut-chinh').length).toBe(1)
    fireEvent.click(screen.getByRole('button', { name: /KHÁM PHÁ BÁT LINH ĐẢO · 44 câu/ }))
    expect(props.onKhamPhaDao).toHaveBeenCalledTimes(1)
    expect(container.querySelector('.h2-ban-do')!.getAttribute('data-tt')).toBe('b')
    expect(container.querySelector('.h2-ban-do')!.getAttribute('data-khoa-dao')).toBe('false')
    expect(container.querySelector('[data-ve="cau-ha"]')).not.toBeNull()
    expect(container.querySelector('[data-ve="o-phuc-kich"]')!.getAttribute('data-so')).toBe('0')
    expect(container.textContent).toContain('Cầu sang đảo đã hạ')
    expect(screen.queryByText(/Ổ PHỤC KÍCH/)).toBeNull()
  })

  it('(c) xong hôm nay: "Hôm nay em xong rồi" + rương 3D + MỘT nút "MỞ RƯƠNG BÁT LINH"; không nút đi Đoàn/Đảo', () => {
    const { container } = ve(C)
    expect(container.querySelector('.h2-ban-do')!.getAttribute('data-tt')).toBe('c')
    expect(container.textContent).toContain('Hôm nay em xong rồi')
    expect(container.textContent).toContain('60/60 câu · +169 EXP hôm nay')
    expect(container.querySelector('.h2-ruong-3d')!.getAttribute('data-mo')).toBe('false')
    expect(container.querySelectorAll('.h2-nut-chinh').length).toBe(1)
    expect(screen.getByRole('button', { name: /MỞ RƯƠNG BÁT LINH/ })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /KHÁM PHÁ|PHÁ .* Ổ/ })).toBeNull()
  })
})

describe('Sảnh 3D — sương mù tan theo % khai phá thật', () => {
  it('lỗ khai phá nở theo Cọ xát/tổng của máy chủ: 13/170 ⇒ 8%, 170/170 ⇒ 100% (sương ẩn hẳn)', () => {
    const { container, unmount } = ve(A)
    const suong = container.querySelector('[data-ve="suong"]')!
    expect(suong.getAttribute('data-phan-tram')).toBe('8')
    expect(container.querySelector('[data-ve="lo-khai-pha"]')!.getAttribute('r')).toBe(String(banKinhKhaiPha(8)))
    expect(suong.getAttribute('opacity')).toBe('1')
    unmount()
    const { container: c2 } = ve({ ...A, chienDich: { ...A.chienDich, coXat: 170 } })
    expect(c2.querySelector('[data-ve="suong"]')!.getAttribute('data-phan-tram')).toBe('100')
    expect(c2.querySelector('[data-ve="suong"]')!.getAttribute('opacity')).toBe('0')
    expect(c2.textContent).toContain('Đảo Carbohydrate · 100% đã khai phá')
    expect(banKinhKhaiPha(0)).toBeLessThan(banKinhKhaiPha(50))
    expect(banKinhKhaiPha(50)).toBeLessThan(banKinhKhaiPha(100))
  })

  it('hình sinh ngẫu nhiên có hạt giống cố định: hai lần tạo giống hệt', () => {
    expect(JSON.stringify(taoCanh())).toBe(JSON.stringify(taoCanh()))
    expect(taoCanh().tia).toHaveLength(14)
  })
})

describe('Sảnh 3D — chuyển động', () => {
  it('prefers-reduced-motion: không thị sai (không rAF khi rê chuột), không cảnh mở màn', () => {
    datGiam(true)
    const raf = vi.fn(() => 1)
    vi.stubGlobal('requestAnimationFrame', raf)
    const { container } = ve(A)
    expect(container.querySelector('.h2-ban-do')!.getAttribute('data-thi-sai')).toBe('tat')
    expect(container.querySelector('.h2-sanh')!.getAttribute('data-mo-man')).toBe('false')
    fireEvent.pointerMove(window, { pointerType: 'mouse', clientX: 10, clientY: 10 })
    expect(raf).not.toHaveBeenCalled()
    expect(sessionStorage.getItem(KHOA_MO_MAN)).toBeNull()
  })

  it('bản đồ sơn thủy không thị sai; mở màn sảnh chạy LẦN ĐẦU trong phiên rồi tắt', () => {
    vi.useFakeTimers()
    datGiam(false)
    const { container, unmount } = ve(A)
    expect(container.querySelector('.h2-ban-do')!.getAttribute('data-thi-sai')).toBe('tat')
    expect(container.querySelector('.h2-sanh')!.getAttribute('data-mo-man')).toBe('true')
    expect(sessionStorage.getItem(KHOA_MO_MAN)).toBe('1')
    act(() => {
      vi.advanceTimersByTime(2700)
    })
    expect(container.querySelector('.h2-sanh')!.getAttribute('data-mo-man')).toBe('false')
    unmount()
    const { container: c2 } = ve(A)
    expect(c2.querySelector('.h2-sanh')!.getAttribute('data-mo-man')).toBe('false')
  })

  it('sessionStorage bị chặn (ném lỗi) ⇒ Sảnh vẫn vẽ bình thường', () => {
    datGiam(false)
    const goc = Storage.prototype.getItem
    Storage.prototype.getItem = () => {
      throw new Error('chặn')
    }
    try {
      const { container } = ve(B)
      expect(screen.getByRole('button', { name: /KHÁM PHÁ BÁT LINH ĐẢO/ })).toBeTruthy()
      expect(container.querySelector('.h2-sanh')).not.toBeNull()
    } finally {
      Storage.prototype.getItem = goc
    }
  })
})
