// Màn "Bảng nhiệm vụ" (prompt-giao-dien-nhiem-vu-hoc-sinh-phu-huynh.md): đúng 1 nút
// nổi bật, thẻ bị cổng mờ + nhãn, trống thì không bịa, reduced-motion tắt nền.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import BangNhiemVu, { type BangNhiemVuProps } from '../src/components/bang-nhiem-vu/BangNhiemVu'
import { dungBangNhiemVu, tuKeHoachNgay, type DuLieuBangNhiemVu, type KeHoachNgayMayChu, type TrangThaiThanThu } from '../src/lib/nhiem-vu-adapter'
import { PETS } from '../src/game/than-thu-v2/core'
import { tongHopKeHoachTroLy } from '../src/lib/tro-ly-ca-nhan'

vi.mock('../src/game/than-thu-v2/Spirit2D', () => ({
  default: ({ index, level, motion, reducedMotion }: any) => (
    <div role="img" aria-label="Thần thú" data-index={index} data-level={level} data-motion={motion} data-tinh={reducedMotion ? 'co' : 'khong'} />
  ),
}))

const NOW = Date.parse('2026-09-19T19:00:00+07:00')
const gio = (h: number) => new Date(NOW + h * 3600_000).toISOString()
const THU = { kieu: 'co', pet: 'lua_phuong', cap: 12, ten: 'Hoả Long' } as const
const INDEX_LUA = PETS.findIndex((p) => p.id === 'lua_phuong')
const conThu = (d: DuLieuBangNhiemVu, thanThu: TrangThaiThanThu = THU): DuLieuBangNhiemVu => ({ ...d, thanThu })
const THU_MUC = join(__dirname, '../src/components/bang-nhiem-vu')

const btKhan = { maBtvn: 'B-KHAN', tenBtvn: 'BTVN Ancol', soCau: 12, giaoLuc: gio(-30), hanNop: gio(1.5) }
const btHomNay = { maBtvn: 'B-HOMNAY', tenBtvn: 'BTVN Este', soCau: 12, giaoLuc: gio(-30), hanNop: gio(40) }
const mom = { id: 'M1', tieuDe: 'Bài của Mẹ giao', soCau: 8, trangThai: 'chua_lam' }

const troLy = (over: object = {}) =>
  tongHopKeHoachTroLy({ sbd: 't', hoTen: 'Minh', dsBtvn: [], dsMomGiao: [], dsLichSu: [], tongCauSai: 0, now: NOW, ...over })
const duLieu = (over: object = {}) => conThu(dungBangNhiemVu({ keHoachTroLy: troLy(over), now: NOW }))

const dsBtvnMay = [
  { maBtvn: 'BT-ANCOL', maCa: 'CA-ANCOL', tenBtvn: 'BTVN Ancol', soCau: 12 },
  { maBtvn: 'BT-ESTE', maCa: 'CA-ESTE', tenBtvn: 'BTVN Este', soCau: 12 },
]
const momDangLam = { id: 'M9', tieuDe: 'Bài của Mẹ giao', soCau: 8, trangThai: 'dang_lam' }
const phu = { dsBtvn: dsBtvnMay, dsMomGiao: [momDangLam] }
const vm = (o: object) => ({ thuTu: 1, batBuoc: false, khan: false, cong: null, hien: true, nhan: null, trangThai: 'cho', ghiChu: '', chiTiet: {}, hanCung: null, hanMem: null, nguon: 'x', ...o })
// Hình dạng thật của POST /hs/ke-hoach-ngay: 5 việc phủ đủ 4 bậc; 2 việc cuối bị cổng (hien:false).
const keHoachMayChu: KeHoachNgayMayChu = {
  ok: true,
  nganSach: { mucTieuCau: 12, toiThieuCau: 6, vanTocGiay: 78, vanTocNguon: 'do', ghiChuVanToc: '' },
  viec: [
    vm({ id: 'mom:M9', loai: 'mom', soCau: 8, hanCung: gio(0.7), batBuoc: true, khan: true, nhan: 'khan_cap', chiTiet: { id: 'M9' } }),
    vm({ id: 'btvn_lo:BT-ANCOL:1', loai: 'btvn_lo', soCau: 6, hanCung: gio(1.5), batBuoc: true, khan: true, nhan: 'khan_cap', cong: 'mom:M9', chiTiet: { ma: 'BT-ANCOL', chiSo: 1, tongLo: 4 } }),
    vm({ id: 'btvn_lo:BT-ESTE:0', loai: 'btvn_lo', soCau: 6, hanCung: gio(40), batBuoc: true, cong: 'btvn_lo:BT-ANCOL:1', chiTiet: { ma: 'BT-ESTE', chiSo: 0, tongLo: 2 } }),
    vm({ id: 'on_lai:2026-09-19', loai: 'on_lai', soCau: 3, hien: false, nhan: 'bu', cong: 'btvn_lo:BT-ESTE:0', ghiChu: 'Ôn 3 câu đã tới hạn nhắc lại' }),
    vm({ id: 'than_thu:X', loai: 'than_thu', soCau: 6, hien: false, nhan: 'tuy_chon', cong: 'on_lai:2026-09-19', ghiChu: 'Luyện dạng còn yếu với thần thú' }),
  ] as any,
  canhBao: [{ loai: 'qua_tai', noiDung: 'Hôm nay dồn 26 câu, vượt mức 12 câu (+14).' }],
  quaHan: [{ loai: 'btvn', ma: 'BT-CU', hanNop: gio(-30), conLai: 10 }],
  tienBo: { daLamCau: 6, lenBac: 2, conThieu: 0 },
  chuoiDat: 5,
  lanNghi: true,
  capNhatLuc: gio(-0.2),
}
const duLieuMay = (cu = false) => conThu(tuKeHoachNgay(keHoachMayChu, NOW, phu, cu))

const vinhDanh3 = async () => ({
  day: '2026-09-19',
  live: true,
  winners: [
    { rank: 1, name: 'Hoả Long', score: 9.75, seconds: 2460, exam: 'Ca Este', pet: 'dat_quy', level: 12 },
    { rank: 2, name: 'Thuỷ Lân', score: 9.5, seconds: 2280, exam: 'Ca Este', pet: 'nuoc_long', level: 9 },
    { rank: 3, name: 'Mộc Tinh', score: 9.25, seconds: 2640, exam: 'Ca Este', pet: null, level: 8 },
  ],
})
const vinhDanhRong = async () => ({ day: '2026-09-19', live: true, winners: [] })

function ve(props: Partial<BangNhiemVuProps> = {}) {
  return render(
    <BangNhiemVu
      vaiTro="hocsinh"
      hoTen="Đỗ Minh"
      now={NOW}
      duLieu={duLieu({ dsBtvn: [btKhan, btHomNay], dsMomGiao: [mom] })}
      taiVinhDanh={vinhDanh3}
      onHanhDong={() => {}}
      onVaoThi={() => {}}
      onMoThanThu={() => {}}
      {...props}
    />,
  )
}

function giaLapMedia(giamChuyenDong: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((q: string) => ({
      matches: giamChuyenDong && q.includes('reduce'),
      media: q,
      addEventListener() {},
      removeEventListener() {},
    })),
  )
}

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  delete (navigator as any).getBattery
})

describe('một nút nổi bật', () => {
  it('học sinh: đúng 1 nút filled ("Làm ngay"), Vào thi là tonal, không có nút nổi bật thứ hai', async () => {
    const { container } = ve()
    expect(container.querySelectorAll('.bnv-nut-chinh').length).toBe(1)
    expect(container.querySelectorAll('[data-noi-bat="true"]').length).toBe(1)
    expect(container.querySelectorAll('[data-vung="lam-ngay"]').length).toBe(1)
    const fab = screen.getByRole('button', { name: 'Vào thi' })
    expect(fab.classList.contains('bnv-nut-chinh')).toBe(false)
    expect(fab.getAttribute('data-ca-mo')).toBe('false')
    await screen.findByText('Hoả Long')
  })

  it('"Làm ngay" là BTVN khẩn và bấm giữ nguyên payload {bt}', async () => {
    const onHanhDong = vi.fn()
    ve({ onHanhDong })
    const lamNgay = screen.getByRole('region', { name: /^Làm ngay: BTVN Ancol/ })
    fireEvent.click(within(lamNgay).getByRole('button', { name: 'Làm Lô 1' }))
    expect(onHanhDong).toHaveBeenCalledTimes(1)
    expect(onHanhDong.mock.calls[0][0].loai).toBe('mo_btvn')
    expect(onHanhDong.mock.calls[0][0].payload).toEqual({ bt: btKhan })
    await screen.findByText('Hoả Long')
  })

  it('ca đang mở: nút Vào thi đổi sang tertiary + chấm nhịp, vẫn là tonal', async () => {
    const { container } = ve({ caDangMo: true })
    const fab = screen.getByRole('button', { name: 'Vào thi · ca đang mở' })
    expect(fab.getAttribute('data-ca-mo')).toBe('true')
    expect(fab.querySelector('.bnv-fab-cham')).not.toBeNull()
    expect(container.querySelectorAll('.bnv-nut-chinh').length).toBe(1)
    await screen.findByText('Hoả Long')
  })

  it('chạm thần thú mở game; nút Vào thi gọi onVaoThi', async () => {
    const onMoThanThu = vi.fn()
    const onVaoThi = vi.fn()
    ve({ onMoThanThu, onVaoThi })
    fireEvent.click(screen.getByRole('button', { name: /Mở thần thú Hoả Long/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Vào thi' }))
    expect(onMoThanThu).toHaveBeenCalledTimes(1)
    expect(onVaoThi).toHaveBeenCalledTimes(1)
    await screen.findByText('Hoả Long')
  })
})

describe('bốn bậc, bốn vai trò màu, cổng', () => {
  it('nguồn máy chủ: đủ 4 bậc, mỗi bậc đúng 1 vai trò màu', async () => {
    const { container } = ve({ duLieu: duLieuMay() })
    const vaiTro = Object.fromEntries(
      // Mục "quá hạn" là danh sách riêng, không thuộc 4 bậc nhiệm vụ (không có vai trò màu).
      Array.from(container.querySelectorAll('[data-bac][data-vai-tro]')).map((n) => [n.getAttribute('data-bac'), n.getAttribute('data-vai-tro')]),
    )
    expect(vaiTro).toEqual({ khan: 'error', bat_buoc: 'primary', nen_lam: 'secondary', tuy_chon: 'tertiary' })
    // KHẨN đứng đầu danh sách.
    expect(container.querySelector('[data-bac]')!.getAttribute('data-bac')).toBe('khan')
    await screen.findByText('Hoả Long')
  })

  it('việc KHẨN có đồng hồ đếm lùi', async () => {
    ve({ duLieu: duLieuMay() })
    expect(screen.getByRole('timer').textContent).toMatch(/^(\d+:)?\d{2}:\d{2}$/)
    await screen.findByText('Hoả Long')
  })

  it('thẻ bị cổng: mờ 38% (CSS), aria-disabled, nhãn "Mở sau khi xong: <tên việc>", không bấm được', async () => {
    const onHanhDong = vi.fn()
    const { container } = ve({ duLieu: duLieuMay(), onHanhDong })
    const biCong = Array.from(container.querySelectorAll('[data-bi-cong="true"]'))
    expect(biCong.length).toBeGreaterThan(0)
    for (const the of biCong) {
      expect(the.getAttribute('aria-disabled')).toBe('true')
      expect(the.tagName).not.toBe('BUTTON')
      expect(the.textContent).toContain('Mở sau khi xong: ')
      fireEvent.click(the)
    }
    expect(biCong[0].textContent).toContain('Mở sau khi xong: BTVN Este: Lô 1/2')
    expect(onHanhDong).not.toHaveBeenCalled()
    const css = readFileSync(join(THU_MUC, 'bang-nhiem-vu.css'), 'utf8')
    expect(css).toMatch(/\.bnv-the\[aria-disabled='true'\]\s*\{[^}]*opacity:\s*0?\.38/)
    await screen.findByText('Hoả Long')
  })
})

describe('trạng thái trống nói thật', () => {
  it('không có việc: không thẻ nào, không "Làm ngay", thần thú vẫn hiện', async () => {
    const { container } = ve({ duLieu: duLieu(), taiVinhDanh: vinhDanhRong })
    expect(screen.getByText('Hôm nay chưa có việc — thần thú đang nghỉ')).toBeTruthy()
    expect(container.querySelectorAll('.bnv-the').length).toBe(0)
    expect(container.querySelectorAll('[data-vung="lam-ngay"]').length).toBe(0)
    expect(container.querySelectorAll('.bnv-nut-chinh').length).toBe(0)
    expect((await screen.findAllByRole('img', { name: 'Thần thú' })).length).toBeGreaterThan(0)
    expect(await screen.findByText(/Hôm nay chưa có bài chấm xong/)).toBeTruthy()
  })

  it('không có việc: thần thú đứng yên ("nghỉ"); có việc thì không', async () => {
    const { container, unmount } = ve({ duLieu: duLieu(), taiVinhDanh: vinhDanhRong })
    await waitFor(() => expect(container.querySelector('.bnv-thu-vong [data-tinh]')!.getAttribute('data-tinh')).toBe('co'))
    await screen.findByText(/Hôm nay chưa có bài chấm xong/)
    unmount()
    const c2 = ve().container
    await waitFor(() => expect(c2.querySelector('.bnv-thu-vong [data-tinh]')!.getAttribute('data-tinh')).toBe('khong'))
    await screen.findByText('Hoả Long')
  })

  it('đang tải: skeleton, không thẻ trống, không bịa việc', () => {
    const { container } = ve({ dangTai: true, duLieu: duLieu(), taiVinhDanh: vinhDanhRong })
    expect(container.querySelectorAll('[aria-busy="true"] .bnv-xuong').length).toBeGreaterThanOrEqual(3)
    expect(screen.queryByText('Hôm nay chưa có việc — thần thú đang nghỉ')).toBeNull()
    expect(container.querySelectorAll('.bnv-the').length).toBe(0)
  })

  it('đang tải: KHÔNG dựng thẻ Vinh danh (nó sẽ bị nội dung phình ra đẩy đi → CLS)', () => {
    const { container } = ve({ dangTai: true, duLieu: duLieu(), taiVinhDanh: vinhDanhRong })
    expect(container.querySelector('[data-vung="vinh-danh"]')).toBeNull()
  })

  it('chưa đo được tốc độ thì nói "chưa đo"; không có chữ "nắm chắc"', async () => {
    const { container } = ve()
    expect(container.textContent).toContain('tốc độ: chưa đo')
    expect(container.textContent).not.toMatch(/nắm chắc/i)
    await screen.findByText('Hoả Long')
  })

  it('vinh danh: 3 người kèm hạng; không lộ SBD; rỗng thì nói thật', async () => {
    const { container, unmount } = ve()
    await screen.findByText('Hoả Long')
    expect(container.querySelectorAll('.bnv-vd-hang').length).toBe(3)
    expect(container.querySelector('[data-vung="vinh-danh"]')!.textContent).not.toMatch(/SBD|sbd/)
    unmount()
    ve({ taiVinhDanh: vinhDanhRong })
    expect(await screen.findByText(/Hôm nay chưa có bài chấm xong/)).toBeTruthy()
  })
})

describe('giảm chuyển động', () => {
  it('máy cho phép: nền động + shimmer bật', async () => {
    giaLapMedia(false)
    const { container } = ve()
    await screen.findByText('Hoả Long')
    expect(container.querySelector('.bnv')!.getAttribute('data-chuyen-dong')).toBe('bat')
    expect(container.querySelector('.bnv-nen')!.classList.contains('bnv-nen--dong')).toBe(true)
    expect(container.querySelector('.bnv-vd')!.classList.contains('bnv-vd--dong')).toBe(true)
  })

  it('reduce motion: nền đứng yên, thần thú tĩnh, shimmer tắt', async () => {
    giaLapMedia(true)
    const { container } = ve()
    await screen.findByText('Hoả Long')
    expect(container.querySelector('.bnv')!.getAttribute('data-chuyen-dong')).toBe('tat')
    expect(container.querySelector('.bnv-nen')!.classList.contains('bnv-nen--dong')).toBe(false)
    expect(container.querySelector('.bnv-vd')!.classList.contains('bnv-vd--dong')).toBe(false)
    await waitFor(() => expect(container.querySelector('.bnv-thu-vong [data-tinh]')!.getAttribute('data-tinh')).toBe('co'))
    expect(container.querySelector('.bnv-thu-vong [data-motion]')!.getAttribute('data-motion')).toBe('idle')
  })

  it('pin yếu (getBattery): tắt nền động; không có getBattery thì bỏ qua', async () => {
    giaLapMedia(false)
    ;(navigator as any).getBattery = vi.fn().mockResolvedValue({ charging: false, level: 0.1, addEventListener() {}, removeEventListener() {} })
    const { container } = ve()
    await waitFor(() => expect(container.querySelector('.bnv-nen')!.classList.contains('bnv-nen--dong')).toBe(false))
  })

  it('CSS: nền chỉ trôi bằng @keyframes 24 s, độ mờ ≤ 18%, và có chốt reduced-motion', () => {
    const css = readFileSync(join(THU_MUC, 'NenDong.css'), 'utf8')
    expect(css).toMatch(/animation:\s*bnv-troi-1\s+24s/)
    expect(css).toMatch(/animation:\s*bnv-troi-2\s+24s/)
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/)
    const theme = readFileSync(join(THU_MUC, 'm3-theme.css'), 'utf8')
    expect(Number(/--m3-nen-dong-do-mo:\s*([\d.]+)/.exec(theme)![1])).toBeLessThanOrEqual(0.18)
  })

  it('thần thú mừng (victory) 1,2 s khi em vừa làm thêm câu, rồi về idle', async () => {
    vi.useFakeTimers()
    const truoc = duLieuMay()
    const sau = { ...truoc, tienDo: { ...truoc.tienDo, daLam: truoc.tienDo.daLam + 2 } }
    const { container, rerender } = ve({ duLieu: truoc })
    await act(async () => { vi.advanceTimersByTime(300) })
    const motion = () => container.querySelector('.bnv-thu-vong [data-motion]')!.getAttribute('data-motion')
    expect(motion()).toBe('idle')
    rerender(<BangNhiemVu vaiTro="hocsinh" hoTen="Đỗ Minh" now={NOW} duLieu={sau} taiVinhDanh={vinhDanh3} />)
    expect(motion()).toBe('victory')
    await act(async () => { vi.advanceTimersByTime(1250) })
    expect(motion()).toBe('idle')
  })
})

describe('thần thú nạp SAU khung hình đầu (ảnh sprite ~3 MB không được chặn lượt vẽ đầu)', () => {
  it('khung đầu: có vòng giữ chỗ 96 dp nhưng CHƯA có Spirit2D; sau đó mới gắn', async () => {
    vi.useFakeTimers()
    const { container } = ve()
    expect(container.querySelector('.bnv-thu-vong')).not.toBeNull()
    expect(container.querySelector('.bnv-thu-vong [data-motion]')).toBeNull()
    expect(screen.getByRole('button', { name: /Mở thần thú Hoả Long/ })).toBeTruthy()
    await act(async () => { vi.advanceTimersByTime(300) })
    expect(container.querySelector('.bnv-thu-vong [data-motion]')).not.toBeNull()
  })

  it('vòng giữ chỗ có kích thước cố định trong CSS (không xô bố cục khi ảnh về)', () => {
    const css = readFileSync(join(THU_MUC, 'bang-nhiem-vu.css'), 'utf8')
    expect(css).toMatch(/\.bnv-thu-vong\s*\{[^}]*width:\s*96px[^}]*height:\s*96px/s)
  })
})

describe('thần thú CỦA EM (lỗi thầy báo: mọi em đều ra Hoả Long cấp 1)', () => {
  const cho = () => waitFor(() => expect(document.querySelector('.bnv-thu-vong [data-index]')).not.toBeNull())
  const dl = (t: TrangThaiThanThu) => conThu(duLieu(), t)

  it('đúng con, đúng cấp, đúng biệt danh do máy chủ báo (không rơi về hoa_long)', async () => {
    const idx = PETS.findIndex((p) => p.id === 'nuoc_long')
    const { container } = ve({ duLieu: dl({ kieu: 'co', pet: 'nuoc_long', cap: 37, ten: 'Bông' }) })
    await cho()
    const thu = container.querySelector('.bnv-thu-vong [data-index]')!
    expect(Number(thu.getAttribute('data-index'))).toBe(idx)
    expect(idx).not.toBe(INDEX_LUA)
    expect(thu.getAttribute('data-level')).toBe('37')
    expect(screen.getByRole('button', { name: 'Mở thần thú Bông · Cấp 37' })).toBeTruthy()
  })

  it('không có biệt danh thì dùng tên thần thú trong game', async () => {
    ve({ duLieu: dl({ kieu: 'co', pet: 'dat_quy', cap: 5 }) })
    await cho()
    expect(screen.getByRole('button', { name: `Mở thần thú ${PETS.find((p) => p.id === 'dat_quy')!.name} · Cấp 5` })).toBeTruthy()
  })

  it('em CHƯA chọn thần thú: nói "Chưa chọn thần thú", không vẽ con nào, chạm mở game để chọn', async () => {
    const onMoThanThu = vi.fn()
    const { container } = ve({ duLieu: dl({ kieu: 'chua_chon' }), onMoThanThu })
    await new Promise((r) => setTimeout(r, 250))
    expect(container.querySelector('.bnv-thu-vong [data-index]')).toBeNull()
    expect(container.textContent).toContain('Chưa chọn thần thú')
    fireEvent.click(screen.getByRole('button', { name: /Chưa chọn thần thú/ }))
    expect(onMoThanThu).toHaveBeenCalledTimes(1)
  })

  it('mã thần thú lạ (không có trong game) cũng là "chưa chọn", không đoán', async () => {
    const { container } = ve({ duLieu: dl({ kieu: 'co', pet: 'thuy_lan', cap: 37 }) })
    await new Promise((r) => setTimeout(r, 250))
    expect(container.querySelector('.bnv-thu-vong [data-index]')).toBeNull()
    expect(container.textContent).toContain('Chưa chọn thần thú')
  })

  it('chưa có dữ liệu (máy chủ cũ/lỗi/nguồn trợ lý): chỉ giữ chỗ, KHÔNG hiện con mặc định, không nút, không chữ', async () => {
    const { container } = ve({ duLieu: dl({ kieu: 'chua_biet' }) })
    await new Promise((r) => setTimeout(r, 250))
    expect(container.querySelector('.bnv-thu-vong [data-index]')).toBeNull()
    expect(container.querySelector('.bnv-thu-vong')).not.toBeNull() // giữ chỗ 96 dp
    expect(container.querySelector('.bnv-thu-ten')).toBeNull()
    expect(container.querySelector('button.bnv-thu')).toBeNull() // (nút "Luyện với thần thú" của thẻ trống là chuyện khác)
    expect(container.textContent).not.toContain('Hoả Long · Cấp')
  })

  it('phụ huynh: thấy thần thú của con (chỉ đọc); chưa chọn thì nói "Con chưa chọn thần thú"', async () => {
    const { container, unmount } = ve({ vaiTro: 'phuhuynh', duLieu: dl({ kieu: 'co', pet: 'nuoc_long', cap: 37, ten: 'Bông' }), onGiaoBai: () => {} })
    await cho()
    expect(screen.getByRole('group', { name: 'Thần thú của con: Bông · Cấp 37' })).toBeTruthy()
    expect(container.querySelector('button.bnv-thu')).toBeNull()
    unmount()
    ve({ vaiTro: 'phuhuynh', duLieu: dl({ kieu: 'chua_chon' }), onGiaoBai: () => {} })
    expect(screen.getByRole('group', { name: 'Con chưa chọn thần thú' })).toBeTruthy()
  })

  it('bỏ nền: khung thần thú KHÔNG còn vòng tròn/bóng khối; lơ lửng ±4px ~3,2 s chỉ bằng transform; chỉ chạy khi cho phép chuyển động', () => {
    const css = readFileSync(join(THU_MUC, 'bang-nhiem-vu.css'), 'utf8')
    const khung = /\.bnv-thu-vong \{([^}]*)\}/.exec(css)![1]
    expect(khung).not.toMatch(/border-radius:\s*50%|background:\s*var|box-shadow:\s*var|overflow:\s*hidden/)
    expect(khung).toMatch(/width:\s*96px[\s\S]*height:\s*96px/)
    expect(css).toMatch(/@keyframes bnv-lo-lung\s*\{[^}]*translate3d\(0, 4px, 0\)[\s\S]*translate3d\(0, -4px, 0\)/)
    expect(css).toMatch(/animation:\s*bnv-lo-lung 3\.2s ease-in-out infinite/)
    expect(css).toMatch(/\.bnv--dong \.bnv-thu-vong\[data-trang-thai='co'\]\[data-nghi='false'\] \.bnv-thu-than/)
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*\.bnv-thu-than/)
    // chỉ transform/opacity (GPU) trong hai khung hình
    const kf = /@keyframes bnv-lo-lung[\s\S]*?\n\}/.exec(css)![0] + /@keyframes bnv-bong-lo-lung[\s\S]*?\n\}/.exec(css)![0]
    expect(kf.match(/[a-z-]+(?=:)/g)!.filter((k) => !['transform', 'opacity'].includes(k))).toEqual([])
  })

  it('giảm chuyển động / thần thú đang nghỉ: khung KHÔNG được bật lơ lửng (lớp .bnv--dong tắt)', async () => {
    giaLapMedia(true)
    const { container } = ve()
    await cho()
    expect(container.querySelector('.bnv')!.classList.contains('bnv--dong')).toBe(false)
    expect(container.querySelector('.bnv-thu-vong')!.getAttribute('data-nghi')).toBe('false')
  })

  it('trống ("thần thú đang nghỉ"): data-nghi = true nên không lơ lửng', async () => {
    const { container } = ve({ duLieu: conThu(duLieu()), taiVinhDanh: vinhDanhRong })
    await cho()
    expect(container.querySelector('.bnv-thu-vong')!.getAttribute('data-nghi')).toBe('true')
  })
})

describe('dòng nói thật từ kế hoạch máy chủ', () => {
  it('ghi chú tiến bộ, cảnh báo của máy chủ, ngày nghỉ; không "nắm chắc"', async () => {
    const { container } = ve({ duLieu: duLieuMay() })
    await screen.findByText('Hoả Long')
    const tien = container.querySelector('[data-vung="tien-do"]')!.textContent!
    expect(tien).toContain('Đã làm 6 câu, 2 câu lên bậc ôn')
    expect(container.querySelector('[data-vung="canh-bao"]')!.textContent).toBe('Hôm nay dồn 26 câu, vượt mức 12 câu (+14).')
    expect(container.querySelector('[data-vung="ngay-nghi"]')!.textContent).toContain('ngày nghỉ')
    expect(container.textContent).not.toMatch(/nắm chắc/i)
  })

  it('đang hiện bản cuối: có dòng "Kế hoạch lúc …"; bản mới thì không', async () => {
    const { container, unmount } = ve({ duLieu: duLieuMay(true) })
    await screen.findByText('Hoả Long')
    expect(container.querySelector('[data-vung="ke-hoach-cu"]')!.textContent).toMatch(/^Kế hoạch lúc \d{2}:\d{2} — chưa cập nhật được/)
    unmount()
    const c2 = ve({ duLieu: duLieuMay(false) }).container
    await screen.findByText('Hoả Long')
    expect(c2.querySelector('[data-vung="ke-hoach-cu"]')).toBeNull()
  })

  it('quá hạn: mục RIÊNG, BTVN quá hạn chỉ đọc (cần Thầy gia hạn), không tính vào số việc', async () => {
    const { container } = ve({ duLieu: duLieuMay() })
    await screen.findByText('Hoả Long')
    const qh = container.querySelector('[data-bac="qua_han"]')!
    expect(qh.textContent).toContain('QUÁ HẠN · 1')
    expect(qh.textContent).toContain('cần Thầy gia hạn')
    expect(qh.querySelectorAll('button').length).toBe(0)
  })

  it('bài Mẹ hết giờ bấm được để nộp phần đã lưu', async () => {
    const onHanhDong = vi.fn()
    const kh = conThu(tuKeHoachNgay({ ...keHoachMayChu, quaHan: [{ loai: 'mom', ma: 'M9', hanNop: gio(-1), conLai: 8 }] }, NOW, phu))
    ve({ duLieu: kh, onHanhDong })
    await screen.findByText('Hoả Long')
    fireEvent.click(screen.getByRole('button', { name: /QUÁ HẠN/ }))
    expect(onHanhDong.mock.calls[0][0]).toMatchObject({ loai: 'mo_mom', payload: { id: 'M9' } })
  })

  it('phụ huynh: quá hạn không có nút bấm', async () => {
    const kh = conThu(tuKeHoachNgay({ ...keHoachMayChu, quaHan: [{ loai: 'mom', ma: 'M9', hanNop: gio(-1), conLai: 8 }] }, NOW, phu))
    const { container } = ve({ vaiTro: 'phuhuynh', duLieu: kh, onGiaoBai: () => {} })
    await screen.findByText('Hoả Long')
    expect(container.querySelectorAll('[data-bac="qua_han"] button').length).toBe(0)
  })
})

describe('phụ huynh: đọc-chỉ', () => {
  const phuHuynh = (props: Partial<BangNhiemVuProps> = {}) =>
    ve({ vaiTro: 'phuhuynh', hoTen: 'Đỗ Minh', duLieu: duLieuMay(), onGiaoBai: () => {}, ...props })

  it('không nút Vào thi, không nút "Làm ngay", các thẻ không bấm được; thần thú của con vẫn hiện', async () => {
    const { container } = phuHuynh()
    await screen.findByText('Hoả Long')
    expect(screen.queryByRole('button', { name: /Vào thi/ })).toBeNull()
    expect(container.querySelectorAll('.bnv-nut-chinh').length).toBe(0)
    expect(container.querySelectorAll('button.bnv-the').length).toBe(0)
    expect(screen.getByRole('group', { name: /Thần thú của con/ })).toBeTruthy()
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Hôm nay của Minh')
  })

  it('có hàng "Giao bài cho con" mở luồng giao bài; không có "Nhắn Thầy" khi app chưa có luồng nhắn', async () => {
    const onGiaoBai = vi.fn()
    phuHuynh({ onGiaoBai })
    fireEvent.click(screen.getByRole('button', { name: 'Giao bài cho con' }))
    expect(onGiaoBai).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: 'Nhắn Thầy' })).toBeNull()
    await screen.findByText('Hoả Long')
  })

  it('chưa có danh sách BTVN của con: nói thật bằng một dòng, không dựng thẻ việc', async () => {
    const { container } = phuHuynh({ duLieu: duLieu(), ghiChuNguon: 'Con còn 2 bài tập Thầy giao chưa nộp.' })
    await screen.findByText('Hoả Long')
    expect(container.querySelectorAll('.bnv-the').length).toBe(0)
    expect(screen.getByText('Chưa có bài gia đình giao nào đang chờ')).toBeTruthy()
    expect(container.querySelector('[data-vung="ghi-chu-nguon"]')!.textContent).toContain('2 bài tập Thầy giao chưa nộp')
  })
})

describe('phụ huynh: "Giao bài cho con" đi đường bài hằng ngày cá nhân hoá (Kênh 5)', () => {
  const LY_DO_DU = 'Mục tiêu hôm nay 12 câu. Bài đang chờ còn 8 câu, con đã làm 4 câu. Chưa cần giao thêm.'
  const LY_DO_DU_CHO = 'Còn dư 3 câu trong mục tiêu 12 câu hôm nay; ưu tiên câu ôn tới hạn trước.'
  const ph = (giaoBai: object | undefined, props: Partial<BangNhiemVuProps> = {}) => {
    const onGiaoBai = vi.fn()
    const onGiaoHangNgay = vi.fn()
    const r = ve({ vaiTro: 'phuhuynh', duLieu: duLieuMay(), onGiaoBai, onGiaoHangNgay, giaoBai, ...props } as any)
    return { ...r, onGiaoBai, onGiaoHangNgay }
  }
  const nut = () => screen.getByRole('button', { name: /Giao bài cho con|Đang giao/ })

  it('CÒN DƯ (soCauDeXuat > 0): in NGUYÊN VĂN lý do của máy chủ; nút dạng tonal; bấm = giao bài hằng ngày, KHÔNG mở luồng tay', async () => {
    const { container, onGiaoBai, onGiaoHangNgay } = ph({ reason: LY_DO_DU_CHO, soCauDeXuat: 3 })
    await screen.findByText('Hoả Long')
    expect(container.querySelector('[data-vung="ly-do-giao-bai"]')!.textContent).toBe(LY_DO_DU_CHO)
    expect(container.querySelector('[data-vung="giao-bai"]')!.getAttribute('data-trang-thai')).toBe('con-du')
    expect(nut().classList.contains('bnv-nut-tonal')).toBe(true)
    fireEvent.click(nut())
    expect(onGiaoHangNgay).toHaveBeenCalledTimes(1)
    expect(onGiaoBai).not.toHaveBeenCalled()
  })

  it('ĐÃ ĐỦ (soCauDeXuat = 0): ô vàng in nguyên văn lý do, nút thành dạng PHỤ nhưng KHÔNG bị chặn — bấm vào luồng giao tay cũ (chốt G08)', async () => {
    const { container, onGiaoBai, onGiaoHangNgay } = ph({ reason: LY_DO_DU, soCauDeXuat: 0 })
    await screen.findByText('Hoả Long')
    expect(container.querySelector('[data-vung="ly-do-giao-bai"]')!.textContent).toBe(LY_DO_DU)
    expect(container.querySelector('[data-vung="giao-bai"]')!.getAttribute('data-trang-thai')).toBe('da-du')
    expect(nut().classList.contains('bnv-nut-vien')).toBe(true)
    expect((nut() as HTMLButtonElement).disabled).toBe(false)
    fireEvent.click(nut())
    expect(onGiaoBai).toHaveBeenCalledTimes(1)
    expect(onGiaoHangNgay).not.toHaveBeenCalled()
    const css = readFileSync(join(THU_MUC, 'bang-nhiem-vu.css'), 'utf8')
    expect(css).toMatch(/\.bnv-giao-bai\[data-trang-thai='da-du'\]\s*\{[^}]*canh-bao-nen/)
  })

  it('ĐÃ GIAO hôm nay: "Hôm nay đã giao N câu · trạng thái bài"; nút phụ mở luồng tay; không giao trùng', async () => {
    for (const [tt, chu] of [['chua_lam', 'con chưa làm'], ['dang_lam', 'con đang làm'], ['da_nop', 'con đã nộp']] as const) {
      cleanup()
      const { container, onGiaoBai, onGiaoHangNgay } = ph({ reason: LY_DO_DU_CHO, soCauDeXuat: 3, daGiao: { soCau: 9, trangThai: tt } })
      await screen.findByText('Hoả Long')
      expect(container.querySelector('[data-vung="da-giao"]')!.textContent).toBe(`Hôm nay đã giao 9 câu · ${chu}`)
      expect(container.querySelector('[data-vung="giao-bai"]')!.getAttribute('data-trang-thai')).toBe('da-giao')
      fireEvent.click(nut())
      expect(onGiaoBai).toHaveBeenCalledTimes(1)
      expect(onGiaoHangNgay).not.toHaveBeenCalled()
    }
  })

  it('CHƯA BIẾT (máy chủ chưa trả): không in câu nào (không bịa), nút bấm vào luồng giao tay như cũ; không giả định "≥ 12 câu"', async () => {
    const { container, onGiaoBai, onGiaoHangNgay } = ph(undefined)
    await screen.findByText('Hoả Long')
    expect(container.querySelector('[data-vung="ly-do-giao-bai"]')).toBeNull()
    expect(container.querySelector('[data-vung="giao-bai"]')!.getAttribute('data-trang-thai')).toBe('chua-biet')
    fireEvent.click(nut())
    expect(onGiaoBai).toHaveBeenCalledTimes(1)
    expect(onGiaoHangNgay).not.toHaveBeenCalled()
    // Chỉ xét ô giao bài (các dòng khác như cảnh báo qua_tai là chữ của máy chủ): không còn chữ "3 Vòng", không giả định số câu.
    expect(container.querySelector('[data-vung="giao-bai"]')!.textContent).not.toMatch(/3 Vòng|Phân Tầng|tối đa|\d+ câu\/ngày/i)
  })

  it('không có onGiaoHangNgay (chưa nối): "còn dư" vẫn bấm được vào luồng tay, không hỏng', async () => {
    const onGiaoBai = vi.fn()
    ve({ vaiTro: 'phuhuynh', duLieu: duLieuMay(), onGiaoBai, giaoBai: { reason: LY_DO_DU_CHO, soCauDeXuat: 3 } } as any)
    await screen.findByText('Hoả Long')
    fireEvent.click(nut())
    expect(onGiaoBai).toHaveBeenCalledTimes(1)
  })

  it('đang gửi: nút khoá, ghi "Đang giao…", aria-busy — không bấm đúp được', async () => {
    const { onGiaoHangNgay } = ph({ reason: LY_DO_DU_CHO, soCauDeXuat: 3, dangGui: true })
    await screen.findByText('Hoả Long')
    const b = nut() as HTMLButtonElement
    expect(b.disabled).toBe(true)
    expect(b.getAttribute('aria-busy')).toBe('true')
    expect(b.textContent).toContain('Đang giao…')
    fireEvent.click(b)
    expect(onGiaoHangNgay).not.toHaveBeenCalled()
  })

  it('thông báo kết quả: thành công là "status", lỗi là "alert" và in nguyên văn lỗi của máy chủ', async () => {
    const { container, unmount } = ph({ soCauDeXuat: 3, thongBao: { loai: 'ok', chu: 'Đã giao 1 bài gồm 3 câu sang app của con.' } })
    await screen.findByText('Hoả Long')
    expect(screen.getByRole('status').textContent).toBe('Đã giao 1 bài gồm 3 câu sang app của con.')
    unmount()
    ph({ soCauDeXuat: 3, thongBao: { loai: 'loi', chu: 'Chưa tìm được câu phù hợp để giao hôm nay. Vui lòng thử lại sau.' } })
    await screen.findByText('Hoả Long')
    expect(screen.getByRole('alert').textContent).toBe('Chưa tìm được câu phù hợp để giao hôm nay. Vui lòng thử lại sau.')
  })
})

describe('hàng "Bài cũ chưa làm" và thu gọn nhóm dài', () => {
  const baiCu = (n: number) => ({
    soBai: n, soCau: n * 5,
    bai: Array.from({ length: n }, (_, i) => ({ id: `C${i + 1}`, tieuDe: `Bài cũ ${i + 1}`, soCau: 5, hanhDong: { loai: 'mo_mom' as const, payload: { id: `C${i + 1}` }, nhanNut: 'Làm bài của Mom' } })),
  })
  const voiTonCu = (n: number) => ({ ...duLieuMay(), tonCu: baiCu(n) })

  it('rỗng → không vẽ gì; có → thu gọn mặc định, KHÔNG phải thẻ việc, không có màu vai trò', async () => {
    const { container, unmount } = ve({ duLieu: duLieuMay() })
    await screen.findByText('Hoả Long')
    expect(container.querySelector('[data-vung="ton-cu"]')).toBeNull()
    unmount()
    const c2 = ve({ duLieu: voiTonCu(3) }).container
    await screen.findByText('Hoả Long')
    const hang = c2.querySelector('[data-vung="ton-cu"]')!
    expect(hang.querySelector('button')!.getAttribute('aria-expanded')).toBe('false')
    expect(hang.textContent).toContain('Bài cũ chưa làm · 3 bài')
    expect(hang.querySelectorAll('.bnv-the').length).toBe(0)
    expect(hang.closest('[data-vai-tro]')).toBeNull()
  })

  it('mở ra: tối đa 10 dòng + "Xem thêm N bài"; mỗi dòng mở đúng bài đó', async () => {
    const onHanhDong = vi.fn()
    const { container } = ve({ duLieu: voiTonCu(25), onHanhDong })
    await screen.findByText('Hoả Long')
    fireEvent.click(screen.getByRole('button', { name: /Bài cũ chưa làm · 25 bài/ }))
    expect(container.querySelectorAll('[data-vung="ton-cu"] li .bnv-the').length).toBe(10)
    fireEvent.click(screen.getByRole('button', { name: 'Xem thêm 15 bài' }))
    expect(container.querySelectorAll('[data-vung="ton-cu"] li .bnv-the').length).toBe(20)
    fireEvent.click(screen.getByRole('button', { name: 'Bài cũ 3 5 câu — bài cũ' }))
    expect(onHanhDong).toHaveBeenCalledTimes(1)
    expect(onHanhDong.mock.calls[0][0]).toMatchObject({ loai: 'mo_mom', payload: { id: 'C3' } })
  })

  it('phụ huynh: chỉ một dòng chữ "Con còn N bài Mẹ giao cũ chưa làm", không nút, không danh sách', async () => {
    const { container } = ve({ vaiTro: 'phuhuynh', duLieu: voiTonCu(7), onGiaoBai: () => {} })
    await screen.findByText('Hoả Long')
    const hang = container.querySelector('[data-vung="ton-cu"]')!
    expect(hang.textContent).toBe('Con còn 7 bài Mẹ giao cũ chưa làm')
    expect(hang.querySelectorAll('button').length).toBe(0)
  })

  const nhomDai = (n: number) => {
    const d = duLieuMay()
    const mau = d.cacBac.find((b) => b.bac === 'bat_buoc')!.viec[0]
    const viec = Array.from({ length: n }, (_, i) => ({ ...mau, id: `dai${i}`, tieuDe: `Việc dài ${i + 1}`, biCong: false }))
    return { ...d, cacBac: d.cacBac.map((b) => (b.bac === 'bat_buoc' ? { ...b, viec } : b)) }
  }

  it('nhóm > 8 thẻ: thu gọn còn 5 + "Xem thêm N việc" (đếm ở tiêu đề vẫn là tổng, thứ tự giữ nguyên); bấm thì hiện hết', async () => {
    const { container } = ve({ duLieu: nhomDai(12) })
    await screen.findByText('Hoả Long')
    const nhom = () => container.querySelector('[data-bac="bat_buoc"]')!
    expect(nhom().querySelectorAll('.bnv-the').length).toBe(5)
    expect(nhom().querySelector('h2')!.textContent).toContain('· 12')
    expect(Array.from(nhom().querySelectorAll('.bnv-the-ten')).map((e) => e.textContent)).toEqual(['Việc dài 1', 'Việc dài 2', 'Việc dài 3', 'Việc dài 4', 'Việc dài 5'])
    fireEvent.click(screen.getByRole('button', { name: 'Xem thêm 7 việc' }))
    expect(nhom().querySelectorAll('.bnv-the').length).toBe(12)
    expect(screen.queryByRole('button', { name: /Xem thêm/ })).toBeNull()
  })

  it('nhóm ≤ 8 thẻ không thu gọn', async () => {
    const { container } = ve({ duLieu: nhomDai(8) })
    await screen.findByText('Hoả Long')
    expect(container.querySelector('[data-bac="bat_buoc"]')!.querySelectorAll('.bnv-the').length).toBe(8)
    expect(screen.queryByRole('button', { name: /Xem thêm/ })).toBeNull()
  })
})

// 0.Planer ĐỔI LUẬT 19/09: chỉ còn việc TUỲ CHỌN của máy chủ không còn là "trống". Đã đạt ⇒ thẻ mừng + bậc "LÀM THÊM · TUỲ CHỌN" bấm được;
// chưa đạt ⇒ việc tuỳ chọn đầu tiên là "Làm ngay"; chỉ viec rỗng mới trống.
describe('xong việc hôm nay: chỉ còn việc tuỳ chọn', () => {
  const tuyChon = [
    vm({ id: 'on_lai:2026-09-19', loai: 'on_lai', soCau: 3, nhan: 'tuy_chon', ghiChu: 'Ôn 3 câu đã tới hạn nhắc lại', chiTiet: { qid: ['a', 'b', 'c'] } }),
    vm({ id: 'than_thu:X', loai: 'than_thu', soCau: 6, nhan: 'tuy_chon', ghiChu: 'Luyện dạng còn yếu với thần thú' }),
  ]
  const kh = (dat: boolean, viec: any[] = tuyChon): KeHoachNgayMayChu => ({ ...keHoachMayChu, viec: viec as any, quaHan: [], canhBao: [], tienBo: { daLamCau: 9, lenBac: 3, dat, conThieu: 0 } as any })
  const d = (dat: boolean, viec?: any[]) => conThu(tuKeHoachNgay(kh(dat, viec), NOW, phu))

  it('học sinh, ĐÃ ĐẠT: thẻ mừng + số đo thật (không "nắm chắc"), KHÔNG thẻ "Làm ngay", KHÔNG trạng thái trống; hai việc bấm được dưới "LÀM THÊM · TUỲ CHỌN"', async () => {
    const onHanhDong = vi.fn()
    const { container } = ve({ duLieu: d(true), onHanhDong, taiVinhDanh: vinhDanhRong })
    const mung = container.querySelector('[data-vung="xong-hom-nay"]') as HTMLElement
    expect(mung.querySelector('h2')!.textContent).toBe('Em đã xong việc hôm nay')
    expect(mung.textContent).toContain('Đã làm 9 câu, 3 câu lên bậc ôn')
    expect(mung.textContent).not.toMatch(/nắm chắc/i)
    expect(container.querySelectorAll('[data-vung="lam-ngay"]').length).toBe(0)
    expect(container.querySelectorAll('[data-vung="trong"]').length).toBe(0)
    expect(screen.queryByText(/Hôm nay chưa có việc/)).toBeNull()
    const bac = container.querySelector('[data-bac="tuy_chon"]') as HTMLElement
    expect(bac.getAttribute('aria-label')).toBe('LÀM THÊM · TUỲ CHỌN: 2 việc')
    expect(bac.textContent).toContain('LÀM THÊM · TUỲ CHỌN · 2')
    const the = bac.querySelectorAll<HTMLElement>('button.bnv-the')
    expect(the.length).toBe(2)
    fireEvent.click(the[0])
    expect(onHanhDong).toHaveBeenCalledTimes(1)
    expect(onHanhDong.mock.calls[0][0]).toMatchObject({ loai: 'lam_cau_on', payload: { qid: ['a', 'b', 'c'] } })
    // đã đạt ⇒ không có nút filled "Làm ngay" (nút nổi bật duy nhất là Vào thi hoặc không có)
    expect(container.querySelectorAll('.bnv-nut-chinh').length).toBe(0)
  })

  it('học sinh, CHƯA ĐẠT: việc tuỳ chọn đầu tiên là "Làm ngay" (nút filled), không thẻ mừng', () => {
    const { container } = ve({ duLieu: d(false), taiVinhDanh: vinhDanhRong })
    expect(container.querySelector('[data-vung="xong-hom-nay"]')).toBeNull()
    expect(container.querySelectorAll('[data-vung="lam-ngay"]').length).toBe(1)
    expect(container.querySelector('[data-vung="lam-ngay"]')!.textContent).toContain('Ôn 3 câu đã tới hạn nhắc lại')
    expect(container.querySelectorAll('.bnv-nut-chinh').length).toBe(1)
    expect(container.querySelector('[data-bac="tuy_chon"]')!.getAttribute('aria-label')).toBe('TUỲ CHỌN: 1 việc')
  })

  it('phụ huynh (đọc-chỉ), ĐÃ ĐẠT: "Con đã xong việc hôm nay", danh sách làm thêm KHÔNG có nút bấm', () => {
    const { container } = render(<BangNhiemVu vaiTro="phuhuynh" hoTen="Phụ huynh" now={NOW} duLieu={d(true)} onHanhDong={() => {}} taiVinhDanh={vinhDanhRong} />)
    expect(container.querySelector('[data-vung="xong-hom-nay"] h2')!.textContent).toBe('Con đã xong việc hôm nay')
    expect(container.querySelector('[data-bac="tuy_chon"]')!.textContent).toContain('LÀM THÊM · TUỲ CHỌN')
    expect(container.querySelectorAll('[data-bac="tuy_chon"] button.bnv-the').length).toBe(0)
    expect(container.querySelectorAll('[data-vung="trong"]').length).toBe(0)
  })

  it('chỉ viec RỖNG mới ra trạng thái trống (kể cả khi đã đạt), câu chữ trống giữ nguyên', () => {
    const { container } = ve({ duLieu: d(true, []), taiVinhDanh: vinhDanhRong })
    expect(screen.getByText('Hôm nay chưa có việc — thần thú đang nghỉ')).toBeTruthy()
    expect(container.querySelector('[data-vung="xong-hom-nay"]')).toBeNull()
    expect(container.querySelectorAll('.bnv-the').length).toBe(0)
  })

  it('thẻ mừng đọc được: chữ ≥ tương phản qua biến M3 (không mã màu cứng) và có vai trò vùng có tên', () => {
    const css = readFileSync(join(THU_MUC, 'bang-nhiem-vu.css'), 'utf8')
    const khoi = css.slice(css.indexOf('.bnv-mung {'), css.indexOf('.bnv-nut-tonal,'))
    expect(khoi).toContain('var(--m3-tertiary-container)')
    expect(khoi).toContain('var(--m3-on-tertiary-container)')
    expect(khoi).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(/)
  })
})

describe('EXP học tập + mảnh khiên trên bảng', () => {
  const EXP = {
    homNay: 22,
    chiTietHomNay: [{ loai: 'cau', exp: 12, ghiChu: '6 câu đúng · +12 EXP', soKhoan: 6 }, { loai: 'lo', exp: 10, ghiChu: 'Xong lô đúng nhịp · +10 EXP', soKhoan: 1 }],
    manhKhien: { manh: 1, moiKhien: 12, khienRen: 0, khienConLai: 0, choCongVaoHoSo: false },
    datNgay: null,
  }
  const co = (extra: object = {}) => conThu(tuKeHoachNgay({ ...keHoachMayChu, exp: EXP, ...extra } as any, NOW, phu))

  it('có exp: dòng "EXP hôm nay 22" + "Mảnh khiên 1/12", chi tiết nguyên văn máy chủ; PH đọc "của con"', () => {
    const { container, unmount } = ve({ duLieu: co(), taiVinhDanh: vinhDanhRong })
    const e = container.querySelector('[data-vung="exp"]') as HTMLElement
    expect(e.textContent).toContain('EXP hôm nay')
    expect(e.querySelector('.bnv-exp-so b')!.textContent).toBe('22')
    expect(e.textContent).toContain('Mảnh khiên 1/12')
    expect(e.querySelector('.bnv-exp-khien')!.textContent).toBe('Mảnh khiên 1/12') // khienConLai = 0 ⇒ không nói "0 khiên"
    expect(Array.from(e.querySelectorAll('li')).map((x) => x.textContent)).toEqual(['6 câu đúng · +12 EXP', 'Xong lô đúng nhịp · +10 EXP'])
    unmount()
    const ph = render(<BangNhiemVu vaiTro="phuhuynh" hoTen="PH" now={NOW} duLieu={co()} taiVinhDanh={vinhDanhRong} />).container
    expect(ph.querySelector('[data-vung="exp"]')!.textContent).toContain('EXP hôm nay của con')
  })

  it('còn khiên dùng được thì nói số khiên; thiếu exp ⇒ KHÔNG dựng vùng EXP, không số bịa', () => {
    const { container, unmount } = ve({ duLieu: co({ exp: { ...EXP, manhKhien: { ...EXP.manhKhien, khienConLai: 2 } } }), taiVinhDanh: vinhDanhRong })
    expect(container.querySelector('[data-vung="exp"]')!.textContent).toContain('Mảnh khiên 1/12 · 2 khiên')
    unmount()
    const c2 = ve({ duLieu: duLieuMay(), taiVinhDanh: vinhDanhRong }).container
    expect(c2.querySelector('[data-vung="exp"]')).toBeNull()
    expect(c2.querySelector('[data-vung="exp-moi"]')).toBeNull()
  })

  it('khoản MỚI nhận trong lần gọi này: băng "+N EXP" nguyên văn ghiChu (kèm mảnh khiên), ẩn được; không có khoản mới thì không băng', async () => {
    const d = co({ expNhan: [{ loai: 'cau', exp: 4, ghiChu: '2 câu đúng · +4 EXP' }, { loai: 'lo', exp: 10, ghiChu: 'Xong lô đúng nhịp · +10 EXP' }], manhNhan: [{ loai: 'dat', so: 1, ghiChu: 'Đạt ngày · +1 mảnh khiên' }] })
    const { container } = ve({ duLieu: d, taiVinhDanh: vinhDanhRong })
    const b = container.querySelector('[data-vung="exp-moi"]') as HTMLElement
    expect(b.getAttribute('role')).toBe('status')
    expect(b.querySelector('b')!.textContent).toBe('+14 EXP học tập')
    expect(b.textContent).toContain('2 câu đúng · +4 EXP')
    expect(b.textContent).toContain('Đạt ngày · +1 mảnh khiên')
    fireEvent.click(screen.getByRole('button', { name: 'Ẩn thông báo EXP' }))
    expect(container.querySelector('[data-vung="exp-moi"]')).toBeNull()
    cleanup()
    expect(ve({ duLieu: co(), taiVinhDanh: vinhDanhRong }).container.querySelector('[data-vung="exp-moi"]')).toBeNull()
  })

  it('chỉ có mảnh khiên mới (không EXP): băng vẫn hiện, không in "+0 EXP"', () => {
    const { container } = ve({ duLieu: co({ manhNhan: [{ loai: 'chuoi7', so: 3, ghiChu: 'Chuỗi 7 ngày · +3 mảnh khiên' }] }), taiVinhDanh: vinhDanhRong })
    const b = container.querySelector('[data-vung="exp-moi"]') as HTMLElement
    expect(b.textContent).toContain('Chuỗi 7 ngày · +3 mảnh khiên')
    expect(b.textContent).not.toMatch(/\+0 EXP/)
  })
})

// THẦY CHỐT reset một lần 00:01 thứ Hai 21/09: EXP về 0, thần thú về cấp 1 và XOÁ lựa chọn ⇒ sáng đó cả trường ở `thanThu: null`.
// Đầu bảng phải là thẻ MỜI "Chọn thần thú của em" (bấm một lần là vào màn chọn của game); phụ huynh: "Con chưa chọn thần thú" (đọc-chỉ).
describe('chưa chọn thần thú: thẻ mời đầu bảng', () => {
  const chua = (d = duLieuMay()) => ({ ...d, thanThu: { kieu: 'chua_chon' } as const })

  it('học sinh: MỘT nút cả thẻ "Chọn thần thú của em" đứng TRƯỚC tiến độ; bấm gọi onMoThanThu đúng 1 lần; không tính là nút filled thứ hai', async () => {
    const onMoThanThu = vi.fn()
    const { container } = ve({ duLieu: chua(), onMoThanThu, taiVinhDanh: vinhDanhRong })
    const the = screen.getByRole('button', { name: 'Chọn thần thú của em' })
    expect(the.className).toContain('bnv-chon-thu')
    expect(the.textContent).toContain('Em chưa có thần thú')
    // đứng đầu vùng nhiệm vụ: trước tiến độ và trước thẻ "Làm ngay"
    const tienDo = container.querySelector('[data-vung="tien-do"]')!
    expect(the.compareDocumentPosition(tienDo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    const lamNgay = container.querySelector('[data-vung="lam-ngay"]')
    if (lamNgay) expect(the.compareDocumentPosition(lamNgay) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    fireEvent.click(the)
    expect(onMoThanThu).toHaveBeenCalledTimes(1)
    expect(container.querySelectorAll('.bnv-nut-chinh').length).toBe(1) // vẫn chỉ MỘT nút filled: "Làm ngay"
    expect(container.querySelectorAll('[data-noi-bat="true"]').length).toBe(1)
  })

  it('CHỈ hiện khi máy chủ nói rõ chưa chọn: có thần thú, chưa biết (nguồn trợ lý/lỗi) hoặc đang tải ⇒ không thẻ', () => {
    for (const d of [conThu(duLieuMay()), { ...duLieuMay(), thanThu: { kieu: 'chua_biet' } as const }]) {
      const { container, unmount } = ve({ duLieu: d as any, taiVinhDanh: vinhDanhRong })
      expect(container.querySelector('[data-vung="chon-than-thu"]')).toBeNull()
      unmount()
    }
    const { container } = ve({ duLieu: chua(), dangTai: true, taiVinhDanh: vinhDanhRong })
    expect(container.querySelector('[data-vung="chon-than-thu"]')).toBeNull()
  })

  it('phụ huynh: "Con chưa chọn thần thú" đọc-chỉ, KHÔNG có nút; cũng khi app không có lối mở game', () => {
    const { container, unmount } = render(<BangNhiemVu vaiTro="phuhuynh" hoTen="PH" now={NOW} duLieu={chua()} onMoThanThu={() => {}} taiVinhDanh={vinhDanhRong} />)
    const s = container.querySelector('[data-vung="chon-than-thu"]') as HTMLElement
    expect(s.tagName).toBe('SECTION')
    expect(s.querySelector('h2')!.textContent).toBe('Con chưa chọn thần thú')
    expect(s.querySelectorAll('button').length).toBe(0)
    unmount()
    const hs = render(<BangNhiemVu vaiTro="hocsinh" hoTen="Em" now={NOW} duLieu={chua()} taiVinhDanh={vinhDanhRong} />).container
    expect(hs.querySelector('[data-vung="chon-than-thu"]')!.tagName).toBe('SECTION')
  })

  it('SAU RESET: chưa chọn thần thú + không việc nào ⇒ trạng thái trống KHÔNG nói "thần thú đang nghỉ" / "luyện với thần thú" (em chưa có con nào); chỉ còn thẻ mời + "Xem bài đã nộp"', () => {
    const { container } = ve({ duLieu: { ...duLieu(), thanThu: { kieu: 'chua_chon' } }, onXemBaiDaNop: () => {}, taiVinhDanh: vinhDanhRong })
    expect(container.querySelector('[data-vung="trong"] h2')!.textContent).toBe('Hôm nay chưa có việc')
    expect(container.querySelector('[data-vung="trong"]')!.textContent).toContain('Em chọn thần thú ở trên')
    expect(screen.queryByText(/thần thú đang nghỉ/)).toBeNull()
    expect(screen.queryByRole('button', { name: /Luyện với thần thú/ })).toBeNull()
    expect(screen.getByRole('button', { name: /Xem bài đã nộp/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Chọn thần thú của em' })).toBeTruthy()
    cleanup()
    // có thần thú: câu chữ cũ giữ nguyên
    ve({ duLieu: duLieu(), onXemBaiDaNop: () => {}, taiVinhDanh: vinhDanhRong })
    expect(screen.getByText('Hôm nay chưa có việc — thần thú đang nghỉ')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Luyện với thần thú/ })).toBeTruthy()
  })

  it('CSS thẻ mời: chỉ biến M3, không mã màu; cao ≥ 88 px', () => {
    const css = readFileSync(join(THU_MUC, 'bang-nhiem-vu.css'), 'utf8')
    const khoi = css.slice(css.indexOf('.bnv-chon-thu {'), css.indexOf('/* Thẻ MỪNG'))
    expect(khoi).toContain('var(--m3-primary-container)')
    expect(khoi).toMatch(/min-height:\s*88px/)
    expect(khoi).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(/)
  })
})

describe('kỷ luật mã nguồn của thư mục bang-nhiem-vu', () => {
  const tep = (dir: string): string[] =>
    readdirSync(dir).flatMap((t) => (statSync(join(dir, t)).isDirectory() ? tep(join(dir, t)) : [join(dir, t)]))

  it('không mã màu thập lục phân nào (NT3), không dựng Spirit3D', () => {
    const tatCa = tep(THU_MUC)
    expect(tatCa.length).toBeGreaterThan(8)
    for (const f of tatCa) {
      const chu = readFileSync(f, 'utf8')
      expect(chu.match(/#[0-9a-f]{6}/gi), f).toBeNull()
      expect(chu.match(/#[0-9a-f]{3,8}\b/gi), f).toBeNull()
      expect(chu, f).not.toMatch(/Spirit3D/)
    }
  })

  it('không thêm thư viện UI/chuyển động ngoài React + lucide-react', () => {
    for (const f of tep(THU_MUC).filter((x) => /\.tsx?$/.test(x))) {
      const nhap = [...readFileSync(f, 'utf8').matchAll(/from\s+'([^'.][^']*)'/g)].map((m) => m[1])
      for (const goi of nhap) expect(['react', 'lucide-react'], `${f}: ${goi}`).toContain(goi)
    }
  })
})
