// BỐ CỤC NGANG app học sinh 2.0 (bản vẽ đã chốt docs/ban-ve-ngang-2809: Ngang-Sanh, Ngang-XongHomNay, Ngang-CauDaLam).
// Điểm ngắt `(min-width: 1024px), (orientation: landscape) and (min-width: 700px)`; điện thoại dọc giữ nguyên bản dọc.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import SanhBanDo, { type SanhBanDoProps } from '../src/components/hoa2/SanhBanDo'
import CauDaLam from '../src/components/hoa2/CauDaLam'
import { docSanh, type KetQuaSanh } from '../src/components/hoa2/api'
import { MQ_NGANG, MQ_NGANG_THAP, docBoCucNgang } from '../src/components/hoa2/bo-cuc-ngang'
import { chiSoDuoiRo, propsTheCau } from '../src/components/hoa2/cau-chuyen'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))

const NOW = Date.UTC(2026, 8, 30, 7, 0, 0)
const SANH = {
  ok: true,
  cheDo2: true,
  ngay: '2026-09-30',
  chienDich: { id: 'cd1', ten: 'Carbohydrate', hanNop: '2026-10-04', D: 5, tong: 120, coXat: 67, thanhThao: 0, canDayLai: 0, thanhThaoTangTu: '2026-10-02' },
  theLuc: { con: 28, tong: 40 },
  huyetChien: false,
  doan: { con: 4 },
  dao: { con: 24 },
  khoaDao: true,
  loiKhoaDao: 'Có xe hàng đang bị phục kích, hãy hoàn thành Hộ Tống trước khi ra Đảo nhé!',
  ruong: { daLam: 12, tong: 40, moDuoc: false, daMo: false },
}
const XONG = { ...SANH, theLuc: { con: 0, tong: 40 }, doan: { con: 0 }, dao: { con: 0 }, khoaDao: false, ruong: { daLam: 40, tong: 40, moDuoc: true, daMo: false } }

/** Giả lập màn: `rong`×`cao` (px). Chỉ trả đúng hai truy vấn điểm ngắt của bo-cuc-ngang.ts. */
function datMan(rong: number, cao: number) {
  const ngangHuong = rong > cao
  vi.stubGlobal('innerHeight', cao)
  vi.stubGlobal(
    'matchMedia',
    vi.fn((q: string) => ({
      matches: q === MQ_NGANG ? rong >= 1024 || (ngangHuong && rong >= 700) : q === MQ_NGANG_THAP ? ngangHuong && cao <= 500 : false,
      media: q,
      addEventListener: () => {},
      removeEventListener: () => {},
    })),
  )
}

function veSanh(sanh: Record<string, unknown> = SANH, ghiDe: Partial<SanhBanDoProps> = {}) {
  const props: SanhBanDoProps = {
    ketQua: docSanh(sanh) as KetQuaSanh,
    loi: '',
    dangTai: false,
    thu: { index: 2, cap: 7, ten: 'Lửa Nhỏ' },
    exp: { homNay: 22, conThieu: 160 },
    chuoiNgay: 5,
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
    ...ghiDe,
  }
  return { ...render(<SanhBanDo {...props} />), props }
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('điểm ngắt ngang', () => {
  it('truy vấn đúng bản vẽ: ≥ 1024 px HOẶC xoay ngang ≥ 700 px; không có matchMedia ⇒ bản dọc', () => {
    expect(MQ_NGANG).toBe('(min-width: 1024px), (orientation: landscape) and (min-width: 700px)')
    vi.stubGlobal('matchMedia', undefined)
    expect(docBoCucNgang()).toEqual({ ngang: false, thap: false, tiLe: 1 })
  })
  it('1440×900, 1024×768 (máy tính bảng dọc rộng), 844×390 (điện thoại xoay) ⇒ ngang; 390×844 và 600×400 ⇒ dọc', () => {
    for (const [r, c, ngang] of [
      [1440, 900, true],
      [1024, 768, true],
      [844, 390, true],
      [390, 844, false],
      [600, 400, false],
    ] as const) {
      datMan(r, c)
      expect(docBoCucNgang().ngang, `${r}×${c}`).toBe(ngang)
    }
  })
  it('điện thoại xoay ngang thấp (≤ 500 px) ⇒ thu tỉ lệ (0,75..1); màn cao ⇒ không thu', () => {
    datMan(844, 390)
    const t = docBoCucNgang()
    expect(t.thap).toBe(true)
    expect(t.tiLe).toBeGreaterThanOrEqual(0.75)
    expect(t.tiLe).toBeLessThan(1)
    datMan(1440, 900)
    expect(docBoCucNgang()).toEqual({ ngang: true, thap: false, tiLe: 1 })
  })
  it('CSS: lưới 12 cột — Sảnh 7/5, Câu đã làm 5/7; thu tỉ lệ bằng zoom; cột phải tự cuộn thay vì tràn', () => {
    const cssSanh = readFileSync(resolve(__dirname, '../src/components/hoa2/sanh-ban-do.css'), 'utf8').replace(/\s+/g, ' ')
    expect(cssSanh).toContain('grid-template-columns: repeat(12, minmax(0, 1fr))')
    expect(cssSanh).toMatch(/\.h2-ng-trai \{ grid-column: 1 \/ span 7;/)
    expect(cssSanh).toMatch(/\.h2-ng-phai \{ grid-column: 8 \/ span 5;[^}]*overflow-y: auto;/)
    expect(cssSanh).toMatch(/\.h2-ngang\[data-thap='true'\] \{ zoom: var\(--h2-ti-le, 1\);/)
    const cssCdl = readFileSync(resolve(__dirname, '../src/components/hoa2/cau-da-lam.css'), 'utf8').replace(/\s+/g, ' ')
    expect(cssCdl).toContain('grid-template-columns: minmax(0, 5fr) minmax(0, 7fr)')
    expect(cssCdl).toMatch(/\.h2-cdl sub \{ font-size: 0\.78em;/)
  })
})

describe('Sảnh ngang (Ngang-Sanh)', () => {
  beforeEach(() => datMan(1440, 900))

  it('bản đồ cột 7, cột 5: thẻ chiến dịch (vòng %, hạn, Cọ xát/Thành thạo) · Thể lực · MỘT nút chính · Rương · Câu đã làm', () => {
    const { container, props } = veSanh()
    const goc = container.querySelector('[data-bo-cuc="ngang"]')!
    expect(goc).not.toBeNull()
    expect(goc.getAttribute('data-thap')).toBe('false')
    // 28/09 lớp hình Sảnh 3D: cảnh tự khớp khung (đo DOM); jsdom không có kích thước ⇒ viewBox mặc định của vùng cảnh (thay '-190 0 600 600' cũ có chủ ý).
    expect(container.querySelector('.h2-ng-trai .h2-ban-do svg')!.getAttribute('viewBox')).toBe('-12 -14 424 522')
    expect(container.querySelector('.h2-ng-trai')!.textContent).toContain('Đảo Carbohydrate')
    expect(container.querySelector('[data-ve="o-phuc-kich"]')!.getAttribute('data-so')).toBe('4')
    // bản dọc không còn: không thanh lối tắt dọc, không tấm dưới
    expect(container.querySelector('.h2-ray')).toBeNull()
    expect(container.querySelector('.h2-tam')).toBeNull()

    const phai = container.querySelector('.h2-ng-phai')!
    const cd = screen.getByRole('region', { name: 'Chiến dịch đang mở' })
    expect(phai.contains(cd)).toBe(true)
    expect(screen.getByRole('img', { name: 'Cọ xát 56%' })).toBeTruthy()
    expect(cd.textContent).toContain('Hạn nộp: còn 4 ngày 9 giờ (tới 23:59 Chủ Nhật 04/10)')
    expect(screen.getByRole('progressbar', { name: 'Cọ xát' }).getAttribute('aria-valuenow')).toBe('67')
    expect(screen.getByRole('progressbar', { name: 'Thành thạo' }).getAttribute('aria-valuenow')).toBe('0')
    expect(screen.getByRole('region', { name: 'Thể lực hôm nay' }).textContent).toContain('28/40 câu còn lại')
    expect(screen.getByRole('region', { name: 'Rương Bát Linh' }).textContent).toContain('12/40 câu')

    expect(container.querySelectorAll('.h2-nut-chinh').length).toBe(1)
    fireEvent.click(screen.getByRole('button', { name: /PHÁ 4 Ổ PHỤC KÍCH/ }))
    expect(props.onPhaPhucKich).toHaveBeenCalledTimes(1)
    const dao = screen.getByRole('button', { name: /Khám phá Bát Linh Đảo · 24 câu/ }) as HTMLButtonElement
    expect(dao.disabled).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: /^Câu đã làm/ }))
    expect(props.onCauDaLam).toHaveBeenCalledTimes(1)
    // hàng trên: thần thú của em (ảnh thật), Chuỗi ngày một chỗ, lối tắt
    expect(container.querySelector('.h2-ng-tren .h2-luc-giac img')!.getAttribute('src')).toBe('/than-thu-v2/nho/thu-2-0-be.webp')
    expect(screen.getAllByText(/Chuỗi 5 ngày/).length).toBe(1)
    expect(screen.getAllByText(/28\/40/).length).toBe(1)
    fireEvent.click(screen.getByRole('button', { name: 'Túi đồ' }))
    expect(props.onTuiDo).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Cửa hàng' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Đăng xuất' })).toBeTruthy()
  })

  it('điện thoại xoay ngang 844×390: vẫn 7/5, đánh dấu thu tỉ lệ (--h2-ti-le)', () => {
    datMan(844, 390)
    const { container } = veSanh()
    const goc = container.querySelector('[data-bo-cuc="ngang"]') as HTMLElement
    expect(goc.getAttribute('data-thap')).toBe('true')
    expect(Number(goc.style.getPropertyValue('--h2-ti-le'))).toBeGreaterThanOrEqual(0.75)
  })

  it('điện thoại dọc 390×844: giữ nguyên bản dọc (tấm dưới + thanh lối tắt)', () => {
    datMan(390, 844)
    const { container } = veSanh()
    expect(container.querySelector('[data-bo-cuc="ngang"]')).toBeNull()
    expect(container.querySelector('.h2-tam')).not.toBeNull()
    expect(container.querySelector('.h2-ray')).not.toBeNull()
  })

  it('Xong hôm nay (Ngang-XongHomNay): màn mừng cột 7 với thần thú EM ĐÃ CHỌN (ảnh thật theo cấp) + nút Mở rương; cột 5 có Kế hoạch ngày mai', () => {
    const { container } = veSanh(XONG)
    const trai = container.querySelector('.h2-ng-trai')!
    expect(trai.getAttribute('data-xong')).toBe('true')
    expect(trai.textContent).toContain('Hôm nay em xong rồi!')
    expect(trai.textContent).toContain('Kế hoạch hôm nay · Thứ Tư 30/09')
    expect(trai.querySelector('img.h2-ng-xong-thu')!.getAttribute('src')).toBe('/than-thu-v2/nho/thu-2-0.webp')
    expect(trai.textContent).toContain('40/40câu kế hoạch')
    expect(trai.textContent).toContain('+22EXP cho Lửa Nhỏ')
    expect(trai.contains(screen.getByRole('button', { name: /MỞ RƯƠNG BÁT LINH/ }))).toBe(true)
    expect(container.querySelectorAll('.h2-nut-chinh').length).toBe(1)
    expect(screen.getByRole('region', { name: 'Kế hoạch ngày mai' }).textContent).toContain('Sẵn lúc 00:00 Thứ Năm 01/10')
    expect(screen.getByRole('region', { name: 'Thể lực hôm nay' }).textContent).toContain('0/40 câu còn lại')
    expect(screen.queryByRole('region', { name: 'Rương Bát Linh' })).toBeNull()
  })
})

// ── Câu đã làm ngang ──
const CAU = [
  { qid: 'q17', chienDichId: 'cd1', stt: 17, phan: 'I', mucDo: 'VD', tenDang: 'Tráng bạc', trangThai: 'can_day_lai', lanCuoiDung: false, henOn: null, lichSu: [{ ngay: '2026-10-01', dung: false, coGoiY: false }] },
  { qid: 'q22', chienDichId: 'cd1', stt: 22, phan: 'I', mucDo: 'biet', tenDang: 'Disaccharide', trangThai: 'dang_on', lanCuoiDung: false, henOn: '2026-10-06', lichSu: [{ ngay: '2026-09-27', dung: false, coGoiY: false }] },
]
const CT: Record<string, any> = {
  q17: {
    de: { qid: 'q17', phan: 'I', text: 'Cho 18 gam glucose tác dụng với AgNO3/NH3 dư. Khối lượng Ag là', choices: ['10,8 gam', '21,6 gam', '43,2 gam', '32,4 gam'], ideas: [], hinhAnh: [], tenDang: 'Tráng bạc', mucDo: 'van_dung', maDe: 'DE1' },
    dapAn: 'B',
    loiGiai: { chot: '1 mol C₆H₁₂O₆ cho 2 mol Ag.', tung_pa: { A: { dung: false, vi_sao: 'Quên tỉ lệ.' }, B: { dung: true, vi_sao: '0,2 mol Ag.' }, C: { dung: false, vi_sao: 'Nhầm HCHO.' }, D: { dung: false, vi_sao: 'Sai M.' } } },
    emTraLoi: 'C',
  },
  q22: {
    de: { qid: 'q22', phan: 'I', text: 'Chất nào sau đây thuộc loại disaccharide?', choices: ['Glucose', 'Fructose', 'Saccharose', 'Tinh bột'], ideas: [], hinhAnh: [], tenDang: 'Disaccharide', mucDo: 'biet', maDe: 'DE1' },
    dapAn: 'C',
    loiGiai: { chot: 'Saccharose C₁₂H₂₂O₁₁ là disaccharide.' },
    emTraLoi: 'A',
  },
}
function giaMayChu() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: any) => {
      const p = new URL(String(url)).pathname
      const b = JSON.parse(init?.body || '{}')
      const body = p.endsWith('hoa2-cau-da-lam')
        ? { ok: true, chienDich: [{ id: 'cd1', ten: 'Carbohydrate', hanNop: '2026-10-04', tong: 120 }], cau: CAU }
        : p.endsWith('hoa2-cau-chi-tiet')
          ? { ok: true, cau: (b.qids ?? [b.qid]).map((q: string) => CT[q]).filter(Boolean) }
          : { ok: false }
      return { ok: true, status: 200, json: async () => body }
    }),
  )
}

describe('Câu đã làm ngang (Ngang-CauDaLam)', () => {
  it('danh sách trái + chi tiết phải cùng lúc; câu đầu chọn sẵn; bấm câu khác ⇒ cột phải đổi; lời giải là TheCau xem_lai; Tải PDF ở hàng trên', async () => {
    datMan(1440, 900)
    giaMayChu()
    const { container } = render(<CauDaLam token="tk" hoTen="An" sbd="001" onVe={vi.fn()} />)
    await screen.findByRole('group', { name: 'Lọc câu' })
    expect(container.querySelector('[data-bo-cuc="ngang"]')).not.toBeNull()
    const trai = container.querySelector('.h2-cdl-ng-trai')!
    const phai = screen.getByRole('region', { name: 'Chi tiết câu' })
    expect(trai.querySelectorAll('.h2-the').length).toBe(2)
    // câu gần nhất (q17) chọn sẵn, lời giải bằng TheCau
    await waitFor(() => expect(phai.textContent).toContain('Cho 18 gam glucose'))
    expect(phai.querySelector('.h2-the-cau .the-cau')).not.toBeNull()
    expect(trai.querySelector('[data-chon="true"]')!.textContent).toContain('Câu 17')
    // thẻ danh sách chỉ là thẻ gọn: không mở tại chỗ, không nút "Xem lời giải"
    expect(trai.textContent).not.toContain('Xem lời giải')
    fireEvent.click(screen.getByRole('button', { name: /Câu 22/ }))
    await waitFor(() => expect(phai.textContent).toContain('Chất nào sau đây thuộc loại disaccharide?'))
    expect(trai.querySelector('[data-chon="true"]')!.textContent).toContain('Câu 22')
    // Tải PDF: ở hàng trên, đúng số câu đang lọc
    const pdf = screen.getByRole('button', { name: 'Tải PDF · 2 câu đang lọc' })
    expect(container.querySelector('.h2-cdl-ng-dau')!.contains(pdf)).toBe(true)
    expect(screen.getByRole('button', { name: 'Về Hôm nay' }).textContent).toContain('Về Hôm nay')
  })

  it('điện thoại dọc: giữ bản dọc (thẻ mở tại chỗ, nút Tải PDF ở chân)', async () => {
    datMan(390, 844)
    giaMayChu()
    const { container } = render(<CauDaLam token="tk" hoTen="An" sbd="001" onVe={vi.fn()} />)
    await screen.findByRole('group', { name: 'Lọc câu' })
    expect(container.querySelector('[data-bo-cuc="ngang"]')).toBeNull()
    expect(container.querySelector('.h2-cdl-chan .h2-cdl-nut-chinh')).not.toBeNull()
  })
})

describe('chỉ số dưới rõ (không phông dự phòng)', () => {
  it('C₆H₁₂O₆ (Unicode) → C_{6}H_{12}O_{6} để ChemText vẽ <sub> cùng phông; lời giải + đề + phương án qua propsTheCau', () => {
    expect(chiSoDuoiRo('M(C₆H₁₂O₆) = 180; 1 : 2')).toBe('M(C_{6}H_{12}O_{6}) = 180; 1 : 2')
    const p = propsTheCau({ ...CT.q22, de: { ...CT.q22.de, choices: ['H₂O', 'b', 'c', 'd'] } }, 22) as any
    expect(p.loiGiai.chot).toBe('Saccharose C_{12}H_{22}O_{11} là disaccharide.')
    expect(p.choices[0]).toBe('H_{2}O')
    expect(JSON.stringify(p)).not.toMatch(/[₀-₉]/)
  })
})
