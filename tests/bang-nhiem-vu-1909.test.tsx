// Màn "Bảng nhiệm vụ" (prompt-giao-dien-nhiem-vu-hoc-sinh-phu-huynh.md): đúng 1 nút
// nổi bật, thẻ bị cổng mờ + nhãn, trống thì không bịa, reduced-motion tắt nền.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import BangNhiemVu, { type BangNhiemVuProps } from '../src/components/bang-nhiem-vu/BangNhiemVu'
import { dungBangNhiemVu, tuKeHoachNgay, type KeHoachNgayMayChu } from '../src/lib/nhiem-vu-adapter'
import { tongHopKeHoachTroLy } from '../src/lib/tro-ly-ca-nhan'

vi.mock('../src/game/than-thu-v2/Spirit2D', () => ({
  default: ({ motion, reducedMotion }: any) => <div role="img" aria-label="Thần thú" data-motion={motion} data-tinh={reducedMotion ? 'co' : 'khong'} />,
}))

const NOW = Date.parse('2026-09-19T19:00:00+07:00')
const gio = (h: number) => new Date(NOW + h * 3600_000).toISOString()
const THU = { index: 0, cap: 12, ten: 'Hoả Long' }
const THU_MUC = join(__dirname, '../src/components/bang-nhiem-vu')

const btKhan = { maBtvn: 'B-KHAN', tenBtvn: 'BTVN Ancol', soCau: 12, giaoLuc: gio(-30), hanNop: gio(1.5) }
const btHomNay = { maBtvn: 'B-HOMNAY', tenBtvn: 'BTVN Este', soCau: 12, giaoLuc: gio(-30), hanNop: gio(40) }
const mom = { id: 'M1', tieuDe: 'Bài của Mẹ giao', soCau: 8, trangThai: 'chua_lam' }

const troLy = (over: object = {}) =>
  tongHopKeHoachTroLy({ sbd: 't', hoTen: 'Minh', dsBtvn: [], dsMomGiao: [], dsLichSu: [], tongCauSai: 0, now: NOW, ...over })
const duLieu = (over: object = {}) => dungBangNhiemVu({ keHoachTroLy: troLy(over), now: NOW })

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
const duLieuMay = (cu = false) => tuKeHoachNgay(keHoachMayChu, NOW, phu, cu)

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
      thanThu={THU}
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
    rerender(<BangNhiemVu vaiTro="hocsinh" hoTen="Đỗ Minh" now={NOW} duLieu={sau} thanThu={THU} taiVinhDanh={vinhDanh3} />)
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
    const kh = tuKeHoachNgay({ ...keHoachMayChu, quaHan: [{ loai: 'mom', ma: 'M9', hanNop: gio(-1), conLai: 8 }] }, NOW, phu)
    ve({ duLieu: kh, onHanhDong })
    await screen.findByText('Hoả Long')
    fireEvent.click(screen.getByRole('button', { name: /QUÁ HẠN/ }))
    expect(onHanhDong.mock.calls[0][0]).toMatchObject({ loai: 'mo_mom', payload: { id: 'M9' } })
  })

  it('phụ huynh: quá hạn không có nút bấm', async () => {
    const kh = tuKeHoachNgay({ ...keHoachMayChu, quaHan: [{ loai: 'mom', ma: 'M9', hanNop: gio(-1), conLai: 8 }] }, NOW, phu)
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

  it('cảnh báo tải nói đúng số: đã làm + còn lại so với mức gợi ý, "vượt" khi lớn hơn', async () => {
    // 6 câu đã làm + (6 lô + 8 bài Mẹ) còn lại = 20 > 12 ⇒ "vượt"
    const { container } = phuHuynh()
    await screen.findByText('Hoả Long')
    const chu = container.querySelector('[data-vung="giao-bai"] p')!.textContent!
    expect(chu).toMatch(/Con đã làm 6 câu và còn \d+ câu cần làm, vượt mức gợi ý 12 câu\/ngày/)
    expect(chu).not.toMatch(/đã chạm/)
  })

  it('chưa có danh sách BTVN của con: nói thật bằng một dòng, không dựng thẻ việc', async () => {
    const { container } = phuHuynh({ duLieu: duLieu(), ghiChuNguon: 'Con còn 2 bài tập Thầy giao chưa nộp.' })
    await screen.findByText('Hoả Long')
    expect(container.querySelectorAll('.bnv-the').length).toBe(0)
    expect(screen.getByText('Chưa có bài gia đình giao nào đang chờ')).toBeTruthy()
    expect(container.querySelector('[data-vung="ghi-chu-nguon"]')!.textContent).toContain('2 bài tập Thầy giao chưa nộp')
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
