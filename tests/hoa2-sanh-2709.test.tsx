// GAME HÓA 2.0 — Sảnh bản đồ Bát Linh (src/components/hoa2/SanhBanDo.tsx), nối vào StudentPortalScreen thật, và app phụ huynh đã ngừng.
// Hợp đồng: docs/hop-dong-game-hoa-2.md · bản vẽ: docs/ban-ve-game-hoa-2-2709/Moi-SanhBanDo.dc.html, HS-HuyetChien, HS-XongHomNay.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import SanhBanDo, { viTriOPhucKich, type SanhBanDoProps } from '../src/components/hoa2/SanhBanDo'
import { docNhoKetQuaSanh, docSanh, ghiNhoKetQuaSanh, type KetQuaSanh } from '../src/components/hoa2/api'
import { chuHanNop, thuNgayThang } from '../src/components/hoa2/thoi-gian'
import StudentPortalScreen from '../src/screens/StudentPortalScreen'

const mocks = vi.hoisted(() => ({ items: [] as any[], momItems: [] as any[] }))
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
vi.mock('../src/lib/mom-api', async (original) => ({ ...(await original<any>()), momApi: async () => ({ ok: true, items: mocks.momItems }) }))

// 14:00 Thứ Tư 30/09/2026 giờ Việt Nam
const NOW = Date.UTC(2026, 8, 30, 7, 0, 0)

const SANH = {
  ok: true,
  cheDo2: true,
  ngay: '2026-09-30',
  chienDich: { id: 'cd1', ten: 'Ester – Lipid', hanNop: '2026-10-04', D: 5, tong: 120, coXat: 67, thanhThao: 0, canDayLai: 0, thanhThaoTangTu: '2026-10-02' },
  theLuc: { con: 32, tong: 40 },
  huyetChien: false,
  doan: { con: 4 },
  dao: { con: 28 },
  khoaDao: true,
  loiKhoaDao: 'Có xe hàng đang bị phục kích, hãy hoàn thành Hộ Tống trước khi ra Đảo nhé!',
  ruong: { daLam: 8, tong: 40, moDuoc: false, daMo: false },
}

type Tra = { status?: number; body?: any; nem?: boolean }
let cuocGoi: { url: string; body: any }[] = []
let tra: Record<string, Tra> = {}
function giaLapFetch() {
  cuocGoi = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: any) => {
      let body: any = {}
      try {
        body = JSON.parse(init?.body || '{}')
      } catch {}
      cuocGoi.push({ url: String(url), body })
      const r = tra[new URL(String(url)).pathname]
      if (r?.nem) throw new Error('mất mạng')
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
  sessionStorage.clear()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

function veSanh(ghiDe: Partial<SanhBanDoProps> = {}, sanh: Record<string, unknown> = SANH) {
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

describe('ngày giờ hạn nộp (luật 6 bảng từ chuẩn)', () => {
  it('"còn X ngày Y giờ (tới 23:59 Thứ … dd/mm)", giờ Việt Nam; đã qua ⇒ "đã hết hạn"', () => {
    expect(thuNgayThang('2026-09-24')).toBe('Thứ Năm 24/09')
    expect(chuHanNop('2026-10-04', NOW)).toBe('còn 4 ngày 9 giờ (tới 23:59 Chủ Nhật 04/10)')
    expect(chuHanNop('2026-09-30', NOW)).toBe('còn 9 giờ (tới 23:59 Thứ Tư 30/09)')
    expect(chuHanNop('2026-09-29', NOW)).toBe('đã hết hạn (23:59 Thứ Ba 29/09)')
  })
  it('docSanh đọc chặt: cờ tắt ⇒ cheDo2 false; thiếu Thể lực ⇒ null (không bịa số)', () => {
    expect(docSanh({ ok: true, cheDo2: false })).toEqual({ cheDo2: false })
    expect(docSanh({ ok: true, cheDo2: true, canChonThu: true })).toEqual({ cheDo2: true, canChonThu: true })
    expect(docSanh({ ok: true, cheDo2: true })).toBeNull()
  })
})

describe('SanhBanDo — theo bản vẽ Moi-SanhBanDo', () => {
  it('còn ổ phục kích: MỘT nút chính "PHÁ 4 Ổ PHỤC KÍCH", 4 ổ trên đường, Đảo khoá kèm đúng câu của máy chủ, số có nhãn', () => {
    const { container, props } = veSanh()
    expect(container.querySelectorAll('.h2-nut-chinh').length).toBe(1)
    const chinh = screen.getByRole('button', { name: /PHÁ 4 Ổ PHỤC KÍCH/ })
    expect(chinh.textContent).toContain('Đoàn Hộ Tống · 4 câu ôn')
    fireEvent.click(chinh)
    expect(props.onPhaPhucKich).toHaveBeenCalledTimes(1)
    expect(container.querySelector('[data-ve="o-phuc-kich"]')!.getAttribute('data-so')).toBe('4')
    expect(container.querySelector('[data-ve="cau-keo-len"]')).not.toBeNull()
    expect(container.textContent).toContain('4 câu ôn còn lại')
    const dao = screen.getByRole('button', { name: /Khám phá Bát Linh Đảo · 28 câu/ }) as HTMLButtonElement
    expect(dao.disabled).toBe(true)
    expect(dao.textContent).toContain(SANH.loiKhoaDao)
    expect(container.textContent).toContain('Chiến dịch Ester – Lipid')
    expect(container.textContent).toContain('Hạn nộp: còn 4 ngày 9 giờ (tới 23:59 Chủ Nhật 04/10)')
    expect(container.textContent).toContain('Cọ xát 67/120')
    expect(container.textContent).toContain('Thành thạo 0/120')
    expect(container.textContent).toContain('(tăng từ 02/10)')
    expect(container.textContent).toContain('Đảo Ester – Lipid · 56% đã khai phá')
    // HUD: thần thú + cấp + EXP + Thể lực + chuỗi ngày
    expect(screen.getByRole('button', { name: 'Mở thần thú của em: Lửa Nhỏ · Cấp 7' })).toBeTruthy()
    expect(container.querySelector('.h2-luc-giac img')!.getAttribute('src')).toBe('/than-thu-v2/nho/thu-2-0-be.webp')
    expect(container.querySelector('.h2-hud-phu')!.textContent).toMatch(/^\d+\/\d+ EXP · \+22 hôm nay$/)
    expect(screen.getByLabelText('Thể lực hôm nay: còn 32/40 câu')).toBeTruthy()
    expect(container.textContent).toContain('Chuỗi 5 ngày')
    // thanh phải
    fireEvent.click(screen.getByRole('button', { name: 'Câu đã làm' }))
    expect(props.onCauDaLam).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Túi đồ' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Cửa hàng' })).toBeTruthy()
    // không ca mở ⇒ không dải Vào thi
    expect(screen.queryByRole('button', { name: 'Vào thi' })).toBeNull()
  })

  it('có ca kiểm tra đang mở: dải "Vào thi" hiện và mở đúng luồng cũ; vẫn chỉ một nút chính', () => {
    const { container, props } = veSanh({ caDangMo: true })
    expect(container.textContent).toContain('Ca kiểm tra đang mở')
    fireEvent.click(screen.getByRole('button', { name: 'Vào thi' }))
    expect(props.onVaoThi).toHaveBeenCalledTimes(1)
    expect(container.querySelectorAll('.h2-nut-chinh').length).toBe(1)
  })

  it('đã phá hết ổ phục kích: nút chính thành "KHÁM PHÁ BÁT LINH ĐẢO · 28 câu", cầu hạ, không ổ nào', () => {
    const { container, props } = veSanh({}, { ...SANH, doan: { con: 0 }, khoaDao: false, loiKhoaDao: undefined })
    const chinh = screen.getByRole('button', { name: /KHÁM PHÁ BÁT LINH ĐẢO · 28 câu/ })
    fireEvent.click(chinh)
    expect(props.onKhamPhaDao).toHaveBeenCalledTimes(1)
    expect(container.querySelectorAll('.h2-nut-chinh').length).toBe(1)
    expect(container.querySelector('[data-ve="cau-ha"]')).not.toBeNull()
    expect(container.querySelector('[data-ve="o-phuc-kich"]')!.getAttribute('data-so')).toBe('0')
    expect(screen.queryByText(/PHÁ .* Ổ PHỤC KÍCH/)).toBeNull()
  })

  it('hết kế hoạch: "Hôm nay em xong rồi" + nút Rương Bát Linh; mở rương gọi hoa2-ruong-mo bằng token và hiện +20 vàng', async () => {
    tra['/game-v2/hoa2-ruong-mo'] = { body: { ok: true, qua: { vang: 20 }, lapLai: false } }
    const { container, props } = veSanh({}, { ...SANH, theLuc: { con: 0, tong: 40 }, doan: { con: 0 }, dao: { con: 0 }, khoaDao: false, ruong: { daLam: 40, tong: 40, moDuoc: true, daMo: false } })
    expect(container.textContent).toContain('Hôm nay em xong rồi')
    expect(container.textContent).toContain('40/40 câu · +22 EXP hôm nay')
    expect(container.textContent).toContain('Kế hoạch ngày mai sẵn lúc 00:00 Thứ Năm 01/10')
    fireEvent.click(screen.getByRole('button', { name: /MỞ RƯƠNG BÁT LINH/ }))
    await screen.findByText(/Rương Bát Linh đã mở · \+20 vàng/)
    expect(goiTheo('/game-v2/hoa2-ruong-mo')[0].body).toEqual({ token: 'tk' })
    expect(props.onTaiLai).toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: /MỞ RƯƠNG BÁT LINH/ })).toBeNull()
  })

  it('mở rương khi chưa đủ: máy chủ trả { ok:false, ma:"chua_du", loi } ⇒ hiện ĐÚNG lời máy chủ, không lời chung (28/09)', async () => {
    const loi = 'Em làm xong 40/40 câu hôm nay thì rương mở. Hiện em đã làm 38 câu.'
    tra['/game-v2/hoa2-ruong-mo'] = { body: { ok: false, ma: 'chua_du', loi } }
    veSanh({}, { ...SANH, theLuc: { con: 0, tong: 40 }, doan: { con: 0 }, dao: { con: 0 }, khoaDao: false, ruong: { daLam: 40, tong: 40, moDuoc: true, daMo: false } })
    fireEvent.click(screen.getByRole('button', { name: /MỞ RƯƠNG BÁT LINH/ }))
    await screen.findByText(loi)
    expect(screen.queryByText(/Máy chủ chưa trả lời được/)).toBeNull()
  })

  it('Huyết Chiến: thẻ đỏ "Thành trì bị vây hãm", hôm nay N câu, từ câu thứ 41 không nhận EXP', () => {
    const { container } = veSanh({}, { ...SANH, huyetChien: true, theLuc: { con: 80, tong: 80 } })
    const the = screen.getByRole('region', { name: 'Huyết Chiến' })
    expect(the.textContent).toContain('Thành trì bị vây hãm')
    expect(the.textContent).toContain('Hôm nay em cần 80 câu để kịp hạn nộp')
    expect(the.textContent).toContain('Từ câu thứ 41 trở đi em không nhận EXP')
    expect(container.querySelectorAll('.h2-nut-chinh').length).toBe(1)
  })

  it('em chưa chọn thần thú (canChonThu) ⇒ màn chọn thần thú có sẵn; ổ phục kích rải trên đường tối đa 6', () => {
    const { props } = veSanh({}, { ok: true, cheDo2: true, canChonThu: true })
    fireEvent.click(screen.getByRole('button', { name: /CHỌN THẦN THÚ CỦA EM/ }))
    expect(props.onChonThu).toHaveBeenCalledTimes(1)
    expect(viTriOPhucKich(4)).toHaveLength(4)
    expect(viTriOPhucKich(27)).toHaveLength(6)
    expect(viTriOPhucKich(0)).toHaveLength(0)
  })
})

describe('StudentPortalScreen thật: cờ Game Hóa 2.0', () => {
  beforeEach(() => {
    mocks.items = []
    mocks.momItems = []
    localStorage.setItem('omr_student_portal_auth', JSON.stringify({ sbd: 'test', hoTen: 'Em thử', token: 'test-token' }))
  })

  it('cheDo2:true ⇒ màn chính là Sảnh bản đồ, KHÔNG còn Bảng nhiệm vụ; gọi /game-v2/hoa2-sanh bằng token; nhớ chế độ cho lần sau', async () => {
    tra['/game-v2/hoa2-sanh'] = { body: SANH }
    const { container } = render(<StudentPortalScreen />)
    // BẢN DUYỆT V2 (09/10): màn chính là Hôm nay V2 (SanhV2) — nút vàng "Bắt đầu · gỡ 4 lỗi cũ" (cùng việc với "PHÁ 4 Ổ PHỤC KÍCH" cũ)
    await screen.findByRole('button', { name: /Bắt đầu · gỡ 4 lỗi cũ/ })
    expect(container.querySelector('.bnv')).toBeNull()
    expect(goiTheo('/game-v2/hoa2-sanh')[0].body).toEqual({ token: 'test-token' })
    expect(localStorage.getItem('omr_hoa2_che_do:test')).toBe('1')
    // không còn đường vào BTVN / bài gia đình giao / bảng tin / menu ba chấm cũ
    expect(screen.queryByRole('button', { name: /Bài tập về nhà/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /Mở menu|Thêm/ })).toBeNull()
    // Phá ổ phục kích ⇒ mở game ở Đoàn Hộ Tống qua khoá màn đầu sẵn có
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    fireEvent.click(screen.getByRole('button', { name: /Bắt đầu · gỡ 4 lỗi cũ/ }))
    expect(setItem).toHaveBeenCalledWith('game-v2:man-dau', 'doan')
    setItem.mockRestore()
  })

  it('cờ tắt (cheDo2:false hoặc máy chủ cũ) ⇒ app chạy y như cũ: Bảng nhiệm vụ, không Sảnh', async () => {
    tra['/game-v2/hoa2-sanh'] = { body: { ok: true, cheDo2: false } }
    const { container } = render(<StudentPortalScreen />)
    await waitFor(() => expect(goiTheo('/game-v2/hoa2-sanh').length).toBeGreaterThan(0))
    await waitFor(() => expect(container.querySelector('.bnv')).not.toBeNull())
    expect(container.querySelector('.h2-sanh')).toBeNull()
    expect(localStorage.getItem('omr_hoa2_che_do:test')).toBeNull()
  })

  it('SWR: có đệm phiên trước ⇒ vẽ Sảnh NGAY LẬP TỨC 0ms; mạng đơ/lỗi vẫn giữ Sảnh không bị chặn', async () => {
    const kqDem = docSanh(SANH)!
    ghiNhoKetQuaSanh('test', kqDem)
    expect(docNhoKetQuaSanh('test')).not.toBeNull()
    // Giả lập mạng bị lỗi hoặc timeout
    tra['/game-v2/hoa2-sanh'] = { nem: true }
    render(<StudentPortalScreen />)
    // Sảnh hiển thị ngay từ bản đệm trong 0ms mà không đợi mạng
    expect(screen.getByRole('button', { name: /Bắt đầu · gỡ 4 lỗi cũ/ })).not.toBeNull()
  })
})

// ĐÃ GỠ 28/09: describe "ParentPortalScreen: app phụ huynh đã ngừng" — thầy lệnh trùng tu app phụ huynh (chỉ xem báo cáo), app chạy lại dù Game Hoá 2.0 bật;
// hành vi mới khoá ở tests/ph-ngung-2709.test.tsx + tests/ph-v3-app-2809.test.tsx.
