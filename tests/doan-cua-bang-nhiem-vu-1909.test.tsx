// Cửa vào game "Đoàn Hộ Tống" trên Bảng nhiệm vụ (Boss giao 21/09; hợp đồng docs/hop-dong-mo-game-doan-ho-tong-1909.md).
// Thẻ "Lên đường cùng Đoàn Hộ Tống" CHỈ hiện khi: học sinh + máy chủ báo `doanMo === true` (gốc /hs/ke-hoach-ngay) + có hàm mở.
// Bấm ⇒ đặt sessionStorage['game-v2:man-dau']='doan' rồi mở tab game; nút "Về app học sinh" của game về ĐÚNG Bảng nhiệm vụ (không phải sheet điểm).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import StudentPortalScreen from '../src/screens/StudentPortalScreen'
import BangNhiemVu from '../src/components/bang-nhiem-vu/BangNhiemVu'
import { dongGoiBanNho, phucHoiBanNho, tuKeHoachNgay } from '../src/lib/nhiem-vu-adapter'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/game/than-thu-v2/Spirit2D', () => ({ default: () => null }))
vi.mock('../src/game/than-thu-v2/Game', () => ({
  KHOA_MAN_DAU: 'game-v2:man-dau',
  default: (p: any) => (
    <div data-testid="game" data-man-dau={sessionStorage.getItem('game-v2:man-dau') ?? ''}>
      <button onClick={p.onDong}>Về app học sinh</button>
    </div>
  ),
}))
vi.mock('../src/components/BangVinhDanh', () => ({ default: () => null }))
vi.mock('../src/components/BangTinPhuHuynh', () => ({ default: () => null }))
vi.mock('../src/components/ThongBaoHocSinh', () => ({ default: () => null, noticeApi: vi.fn() }))
vi.mock('../src/game/than-thu-v2/academic-sync', () => ({ syncStudentExp: async () => {} }))
vi.mock('../src/lib/exam-db', async (original) => ({ ...(await original<any>()), loadScriptUrlHoacMacDinh: async () => '/test' }))
vi.mock('../src/lib/exam-api', async (original) => ({
  ...(await original<any>()),
  hsLichSuCaApi: async () => ({ ok: true, items: [] }),
  hsBtvnApi: async () => ({ ok: true, items: [] }),
  thanThuDocApi: async () => ({ ok: true, hoSo: {} }),
}))
vi.mock('../src/lib/mom-api', async (original) => ({ ...(await original<any>()), momApi: async () => ({ ok: true, items: [] }) }))

const NOW = Date.now()
const gio = (h: number) => new Date(NOW + h * 3600_000).toISOString()
const VIEC = { id: 'on_lai:2026-09-19', loai: 'on_lai', soCau: 3, thuTu: 1, batBuoc: false, khan: false, cong: null, hien: true, nhan: 'bu', trangThai: 'cho', ghiChu: 'Ôn 3 câu đã tới hạn nhắc lại', chiTiet: { qid: ['a', 'b', 'c'] } }
const KE_HOACH: any = {
  ok: true,
  ngay: '2026-09-19',
  nganSach: { mucTieuCau: 12, toiThieuCau: 6, vanTocGiay: 78, vanTocNguon: 'do', ghiChuVanToc: '' },
  viec: [VIEC],
  canhBao: [],
  quaHan: [],
  tienBo: { daLamCau: 2, lenBac: 1, tutBac: 0, dat: false, toiThieuCau: 6, conThieu: 4 },
  chuoiDat: 0,
  lanNghi: false,
  capNhatLuc: gio(-0.1),
  thanThu: { pet: 'lua_phuong', cap: 12, nickname: 'Hoả Long' },
}
const VIEC2 = { id: 'than_thu:X', loai: 'than_thu', soCau: 6, thuTu: 2, batBuoc: false, khan: false, cong: null, hien: true, nhan: 'tuy_chon', trangThai: 'cho', ghiChu: 'Luyện dạng còn yếu với thần thú', chiTiet: { dang: 'X' } }
const duLieu = (rieng: any = {}) => tuKeHoachNgay({ ...KE_HOACH, ...rieng }, NOW, {})
const CARD = () => document.querySelector('[data-vung="doan-ho-tong"]') as HTMLElement | null
const goc = (p: any) => <BangNhiemVu vaiTro="hocsinh" hoTen="Đỗ Minh" now={NOW} duLieu={duLieu()} onLenDuongDoan={() => {}} {...p} />

describe('adapter: doanMo đọc CHẶT', () => {
  it('chỉ `true` (boolean) ⇒ doanMo true; vắng/false/"true"/1/{} ⇒ không', () => {
    expect(duLieu({ doanMo: true }).doanMo).toBe(true)
    for (const x of [undefined, false, 'true', 1, {}, null, 'yes']) expect(duLieu({ doanMo: x }).doanMo, String(x)).toBe(false)
  })

  it('bản nhớ: đóng gói rồi phục hồi (qua JSON như localStorage) giữ đúng cờ; bản nhớ hỏng (doanMo kiểu lạ) ⇒ false', () => {
    const d = duLieu({ doanMo: true })
    const b = dongGoiBanNho(d, NOW)!
    expect(b.duLieu.doanMo).toBe(true)
    const qua = JSON.parse(JSON.stringify(b.duLieu))
    expect(phucHoiBanNho({ ...b, duLieu: qua }, NOW)!.doanMo).toBe(true)
    expect(phucHoiBanNho({ ...b, duLieu: { ...qua, doanMo: 'yes' } }, NOW)!.doanMo).toBe(false)
    expect(phucHoiBanNho({ ...b, duLieu: { ...qua, doanMo: undefined } }, NOW)!.doanMo).toBe(false)
  })
})

describe('thẻ mời trên Bảng nhiệm vụ', () => {
  afterEach(() => cleanup())

  it('có cờ + học sinh + có hàm mở: ĐÚNG một thẻ, nhãn của Code 5, ≥ 48 px, bấm gọi hàm mở; đứng SAU thẻ Làm ngay và TRƯỚC danh sách việc', () => {
    const mo = vi.fn()
    const { container } = render(goc({ duLieu: duLieu({ doanMo: true, viec: [VIEC, VIEC2] }), onLenDuongDoan: mo }))
    expect(document.querySelectorAll('[data-vung="doan-ho-tong"]').length).toBe(1)
    const the = CARD()!
    expect(the.tagName).toBe('BUTTON')
    expect(the.getAttribute('aria-label')).toBe('Lên đường cùng Đoàn Hộ Tống')
    expect(the.textContent).toContain('Lên đường cùng Đoàn Hộ Tống')
    expect(the.textContent).toContain('Cả lớp cùng hộ tống Linh Tâm.')
    const lamNgay = container.querySelector('[data-vung="lam-ngay"]')!
    expect(lamNgay).toBeTruthy()
    expect(lamNgay.compareDocumentPosition(the) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    const ds = container.querySelector('[data-bac]')
    expect(ds).toBeTruthy() // bắt buộc có danh sách việc — khẳng định thứ tự không được lặng lẽ bị bỏ qua
    expect(the.compareDocumentPosition(ds!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    fireEvent.click(the)
    expect(mo).toHaveBeenCalledTimes(1)
  })

  it('KHÔNG hiện — và không có chữ "Đoàn" nào — khi: cờ vắng/false; thiếu hàm mở; phụ huynh (dù có cờ + hàm); đang tải', () => {
    const roi = (el: any) => {
      const r = render(el)
      const co = CARD() !== null
      const chu = r.container.textContent || ''
      r.unmount()
      return { co, doan: /Đoàn|Hộ Tống|Linh Tâm/.test(chu) }
    }
    expect(roi(goc({ duLieu: duLieu() }))).toEqual({ co: false, doan: false })
    expect(roi(goc({ duLieu: duLieu({ doanMo: false }) }))).toEqual({ co: false, doan: false })
    expect(roi(goc({ duLieu: duLieu({ doanMo: 'true' }) }))).toEqual({ co: false, doan: false })
    expect(roi(goc({ duLieu: duLieu({ doanMo: true }), onLenDuongDoan: undefined }))).toEqual({ co: false, doan: false })
    expect(roi(goc({ vaiTro: 'phuhuynh', duLieu: duLieu({ doanMo: true }) }))).toEqual({ co: false, doan: false })
    expect(roi(goc({ duLieu: duLieu({ doanMo: true }), dangTai: true }))).toEqual({ co: false, doan: false })
  })

  it('em CHƯA chọn thần thú vẫn thấy thẻ (game tự mở màn chọn thú có lời mời) — lời phụ đổi cho đúng; cạnh thẻ "Chọn thần thú của em"', () => {
    render(goc({ duLieu: duLieu({ doanMo: true, thanThu: null }), onMoThanThu: () => {} }))
    expect(CARD()!.textContent).toContain('Chọn thần thú để cùng cả lớp hộ tống Linh Tâm.')
    expect(screen.getByRole('button', { name: 'Chọn thần thú của em' })).toBeTruthy()
  })

  it('bảng TRỐNG (không có việc) vẫn có thẻ; em ĐÃ XONG việc: thẻ nằm dưới thẻ mừng', () => {
    const trong = render(goc({ duLieu: duLieu({ doanMo: true, viec: [] }) }))
    expect(trong.container.querySelector('[data-vung="trong"]')).toBeTruthy()
    expect(CARD()).toBeTruthy()
    trong.unmount()
    const xong = duLieu({
      doanMo: true,
      tienBo: { ...KE_HOACH.tienBo, daLamCau: 9, dat: true, conThieu: 0 },
      exp: { homNay: 10, chiTietHomNay: [], manhKhien: null, datNgay: { dat: true, thieu: [], daLam: 9, toiThieu: 6, daTrao: true, laNghi: false } },
      viec: [{ ...VIEC, nhan: 'tuy_chon', batBuoc: false }],
    })
    const r = render(goc({ duLieu: xong }))
    const mung = r.container.querySelector('[data-vung="xong-hom-nay"]')
    expect(mung).toBeTruthy()
    expect(mung!.compareDocumentPosition(CARD()!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})



describe('CSS thẻ Đoàn', () => {
  it('chỉ biến --m3-*, không hex/fixed; đích ≥ 48 px (min-height 80)', () => {
    const css = fs.readFileSync(path.join(process.cwd(), 'src/components/bang-nhiem-vu/bang-nhiem-vu.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
    const luat = css.match(/\.bnv-doan[^{}]*\{[^}]*\}/g) || []
    expect(luat.length).toBeGreaterThanOrEqual(5)
    for (const l of luat) expect(l, l).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|position:\s*fixed/)
    expect(luat.join('\n')).toMatch(/\.bnv-doan\s*\{[^}]*min-height:\s*80px/)
    expect(luat.join('\n')).toMatch(/background:\s*var\(--m3-tertiary-container\)/)
  })
})

// 10/10: Đoàn là nguồn ôn trong kế hoạch, không còn cửa game ở cổng.
it('bản nhớ màn Đoàn cũ không mở game trong cổng học tập',async()=>{localStorage.setItem('omr_student_portal_auth',JSON.stringify({sbd:'test',hoTen:'Em thử',token:'test-token'}));sessionStorage.setItem('game-v2:man-dau','doan');render(<StudentPortalScreen/>);expect(await screen.findByRole('button',{name:'Của em'})).toBeTruthy();expect(screen.queryByRole('button',{name:'Lên đường cùng Đoàn Hộ Tống'})).toBeNull();expect(screen.queryByTestId('game')).toBeNull()})
