// "CẢNH BÁO CỦA THẦY" trên BẢNG NHIỆM VỤ: adapter (khoá `canhBaoThay` không đụng `canhBao` của máy chủ) + thẻ + nút + không lẫn vai + vị trí.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import BangNhiemVu from '../src/components/bang-nhiem-vu/BangNhiemVu'
import TheCanhBaoThay from '../src/components/bang-nhiem-vu/TheCanhBaoThay'
import { tuKeHoachNgay, tuKeHoachTroLy, type DuLieuBangNhiemVu, type KeHoachNgayMayChu, type TrangThaiThanThu } from '../src/lib/nhiem-vu-adapter'
import { tongHopKeHoachTroLy } from '../src/lib/tro-ly-ca-nhan'
import { docCanhBaoThay, type CanhBaoThay } from '../src/lib/canh-bao-thay-hien-thi'

vi.mock('../src/game/than-thu-v2/Spirit2D', () => ({ default: () => <div role="img" aria-label="Thần thú" /> }))

const HAN = '2026-09-21T16:59:00.000Z' // 23:59 Thứ Hai 21/09/2026 giờ VN
const NOW = Date.parse('2026-09-21T09:30:00.000Z') // 16:30 VN
const THU: TrangThaiThanThu = { kieu: 'co', pet: 'lua_phuong', cap: 12, ten: 'Hoả Long' }
const tho = (o: object = {}) => ({ id: 'cb1', maBtvn: 'B1', tenBtvn: 'Ester và lipid', guiLuc: '2026-09-21T08:15:00.000Z', hanNop: HAN, loi: 'Em nhớ nộp bài trước 23:59 nhé.', trangThaiEm: 'chua_mo', daXem: false, ...o })
const cb = (o: object = {}): CanhBaoThay => docCanhBaoThay([tho(o)])[0]!

const v = (o: object) => ({ thuTu: 1, batBuoc: true, khan: false, cong: null, hien: true, nhan: null, trangThai: 'cho', ghiChu: '', chiTiet: {}, hanCung: null, hanMem: null, nguon: 'x', ...o })
const keHoach = (them: object = {}): KeHoachNgayMayChu => ({
  ok: true,
  ngay: '2026-09-21',
  nganSach: { mucTieuCau: 12, toiThieuCau: 6, vanTocGiay: 80, vanTocNguon: 'do', ghiChuVanToc: '' },
  viec: [v({ id: 'on_lai:x', loai: 'on_lai', soCau: 3, chiTiet: { qid: ['a'] } })] as never,
  canhBao: [],
  quaHan: [],
  tienBo: { daLamCau: 3, lenBac: 0, tutBac: 0, dat: false, toiThieuCau: 6, conThieu: 3 },
  chuoiDat: 0,
  lanNghi: false,
  capNhatLuc: new Date(NOW).toISOString(),
  ...them,
})
const troLy = () => tongHopKeHoachTroLy({ sbd: 't', hoTen: 'Minh', dsBtvn: [], dsMomGiao: [], dsLichSu: [], tongCauSai: 0, now: NOW })
const conThu = (d: DuLieuBangNhiemVu): DuLieuBangNhiemVu => ({ ...d, thanThu: THU })

beforeEach(() => localStorage.clear())
afterEach(() => cleanup())

describe('adapter: cảnh báo của thầy đi theo kế hoạch ngày của EM', () => {
  it('khoá `canhBaoThay` ⇒ đọc chặt; khoá `canhBao` SẴN CÓ của máy chủ (quá tải…) giữ nguyên, không bị đè', () => {
    const d = tuKeHoachNgay(keHoach({ canhBao: [{ loai: 'qua_tai', noiDung: 'Hôm nay hơi nhiều việc.' }], canhBaoThay: [tho()] }), NOW)
    expect(d.canhBaoThay).toHaveLength(1)
    expect(d.canhBaoThay![0]!.loi).toBe('Em nhớ nộp bài trước 23:59 nhé.')
    expect(d.canhBao).toEqual([{ loai: 'qua_tai', noiDung: 'Hôm nay hơi nhiều việc.' }])
  })
  it('máy chủ không có khoá / kiểu lạ ⇒ [] — bảng ra y như cũ', () => {
    for (const them of [{}, { canhBaoThay: null }, { canhBaoThay: 'x' }, { canhBaoThay: {} }, { canhBaoThay: [] }]) expect(tuKeHoachNgay(keHoach(them), NOW).canhBaoThay).toEqual([])
  })
  it('nguồn trợ lý (không có máy chủ) ⇒ []', () => {
    expect(tuKeHoachNgay(keHoach(), NOW).canhBaoThay).toBeDefined()
    expect(tuKeHoachTroLy(troLy(), NOW).canhBaoThay).toEqual([])
  })
})

describe('TheCanhBaoThay', () => {
  const dung = (canhBao: CanhBaoThay[], p: Partial<Parameters<typeof TheCanhBaoThay>[0]> = {}) =>
    render(<TheCanhBaoThay vaiTro="hocsinh" now={NOW} canhBao={canhBao} onLam={() => {}} onDaXem={() => {}} {...p} />)

  it('không có cảnh báo ⇒ KHÔNG dựng gì (không khung rỗng)', () => {
    const { container } = dung([])
    expect(container.innerHTML).toBe('')
  })
  it('học sinh: nhãn, tiêu đề, lời thầy, tình trạng thật, hạn nộp có mốc, giờ gửi', () => {
    const { container } = dung([cb()])
    const t = container.textContent!
    expect(t).toContain('Cảnh báo của thầy')
    expect(t).toContain('Thầy nhắc: em chưa nộp Ester và lipid')
    expect(t).toContain('Em nhớ nộp bài trước 23:59 nhé.')
    expect(t).toContain('Em chưa mở bài.')
    expect(t).toContain('Hạn nộp: 23:59 · Thứ Hai 21/09/2026 — còn 7 giờ 29 phút')
    expect(t).toContain('Thầy gửi lúc 15:15 · Thứ Hai 21/09/2026')
    expect(screen.getByRole('button', { name: 'Làm ngay' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Đã xem' })).toBeTruthy()
  })
  it('chữ máy chủ gửi luôn là CHỮ (không dựng HTML)', () => {
    const { container } = dung([cb({ loi: '<img src=x onerror=alert(1)><b>đậm</b>', tenBtvn: '<script>x</script>' })])
    expect(container.querySelector('img, script, b')).toBeNull()
    expect(container.textContent).toContain('<b>đậm</b>')
  })
  it('"Đã xem": báo cha đúng cảnh báo, thẻ thu gọn NGAY thành một dòng (không lời, không "Đã xem"), vẫn còn "Làm ngay"', () => {
    const onDaXem = vi.fn()
    const { container } = dung([cb()], { onDaXem })
    fireEvent.click(screen.getByRole('button', { name: 'Đã xem' }))
    expect(onDaXem).toHaveBeenCalledTimes(1)
    expect(onDaXem.mock.calls[0]![0].id).toBe('cb1')
    expect(container.querySelector('.bnv-cb--gon')).not.toBeNull()
    expect(container.textContent).not.toContain('Em nhớ nộp bài trước 23:59 nhé.')
    expect(screen.queryByRole('button', { name: 'Đã xem' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Làm ngay' })).toBeTruthy()
    expect(container.textContent).toContain('Thầy nhắc: em chưa nộp Ester và lipid')
  })
  it('máy chủ nói đã xem từ đầu ⇒ vào thẳng dạng một dòng, không gọi lại "đã xem"', () => {
    const onDaXem = vi.fn()
    const { container } = dung([cb({ daXem: true })], { onDaXem })
    expect(container.querySelector('.bnv-cb--gon')).not.toBeNull()
    expect(onDaXem).not.toHaveBeenCalled()
  })
  it('"Làm ngay" (lần đầu) ghi đã xem RỒI mở bài; ở dạng gọn thì chỉ mở bài, không ghi lại', () => {
    const thuTu: string[] = []
    const { rerender } = dung([cb()], { onDaXem: () => thuTu.push('xem'), onLam: () => thuTu.push('lam') })
    fireEvent.click(screen.getByRole('button', { name: 'Làm ngay' }))
    expect(thuTu).toEqual(['xem', 'lam'])
    thuTu.length = 0
    fireEvent.click(screen.getByRole('button', { name: 'Làm ngay' })) // đã thu gọn
    expect(thuTu).toEqual(['lam'])
    rerender(<TheCanhBaoThay vaiTro="hocsinh" now={NOW} canhBao={[cb({ id: 'cb2', daXem: true })]} onLam={() => thuTu.push('lam2')} onDaXem={() => thuTu.push('xem2')} />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Làm ngay' })[0]!)
    expect(thuTu).toContain('lam2')
    expect(thuTu).not.toContain('xem2')
  })
  it('bài KHÔNG có trong danh sách việc của em (coTheLam=false) hoặc quá Hạn nộp ⇒ không nút "Làm ngay", vẫn có "Đã xem"', () => {
    dung([cb()], { coTheLam: () => false })
    expect(screen.queryByRole('button', { name: 'Làm ngay' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Đã xem' })).toBeTruthy()
    cleanup()
    const { container } = dung([cb({ trangThaiEm: 'qua_han' })])
    expect(screen.queryByRole('button', { name: 'Làm ngay' })).toBeNull()
    expect(container.textContent).toContain('Đã qua Hạn nộp.')
  })
  it('phụ huynh: đọc-chỉ — không nút "Làm ngay", lời + "con"; có "Đã xem"', () => {
    const { container } = dung([cb({ trangThaiEm: 'do_chang', chang: { hienTai: 2, tong: 7 }, loi: 'Anh chị nhắc con nộp bài giúp thầy.' })], { vaiTro: 'phuhuynh' })
    expect(screen.queryByRole('button', { name: 'Làm ngay' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Đã xem' })).toBeTruthy()
    expect(container.textContent).toContain('Thầy nhắc: con chưa nộp Ester và lipid')
    expect(container.textContent).toContain('Con đang dở chặng 2 trong 7 chặng.')
    expect(container.textContent).not.toMatch(/\bEm\b/)
  })
  it('nhiều cảnh báo: mỗi cái một thẻ, đúng thứ tự máy chủ', () => {
    const { container } = dung(docCanhBaoThay([tho({ id: 'a', tenBtvn: 'Bài A' }), tho({ id: 'b', tenBtvn: 'Bài B' })]))
    const ten = [...container.querySelectorAll('section')].map((s) => s.getAttribute('aria-label'))
    expect(ten).toEqual(['Cảnh báo của thầy: Thầy nhắc: em chưa nộp Bài A', 'Cảnh báo của thầy: Thầy nhắc: em chưa nộp Bài B'])
  })
})

describe('trên Bảng nhiệm vụ', () => {
  const bang = (duLieu: DuLieuBangNhiemVu, p: object = {}) =>
    render(<BangNhiemVu vaiTro="hocsinh" hoTen="Minh" now={NOW} duLieu={conThu(duLieu)} {...p} />)

  it('thẻ nằm ở ĐẦU thân bảng, trước thẻ tiến độ; không có cảnh báo ⇒ không có vùng "canh-bao-thay"', () => {
    const { container } = bang(tuKeHoachNgay(keHoach({ canhBaoThay: [tho()] }), NOW))
    const vung = [...container.querySelectorAll('[data-vung]')].map((e) => e.getAttribute('data-vung'))
    expect(vung.indexOf('canh-bao-thay')).toBeGreaterThanOrEqual(0)
    expect(vung.indexOf('canh-bao-thay')).toBeLessThan(vung.indexOf('tien-do'))
    cleanup()
    const trong = bang(tuKeHoachNgay(keHoach(), NOW))
    expect(trong.container.querySelector('[data-vung="canh-bao-thay"]')).toBeNull()
  })
  it('học sinh: "Đã xem" gọi onCanhBaoDaXem đúng id; bài không nằm trong việc của em ⇒ không nút "Làm ngay"', () => {
    const onCanhBaoDaXem = vi.fn()
    bang(tuKeHoachNgay(keHoach({ canhBaoThay: [tho({ id: 'z9' })] }), NOW), { onCanhBaoDaXem })
    expect(screen.queryByRole('button', { name: 'Làm ngay' })).toBeNull() // việc mẫu chỉ có "on_lai", không có bài maBtvn=B1
    fireEvent.click(screen.getByRole('button', { name: 'Đã xem' }))
    expect(onCanhBaoDaXem).toHaveBeenCalledTimes(1)
    expect(onCanhBaoDaXem.mock.calls[0]![0].id).toBe('z9')
  })
  it('"Làm ngay" mở ĐÚNG bài: việc mo_btvn có bt.maBtvn khớp maBtvn của cảnh báo (cũng khớp maCa)', () => {
    const dl = conThu(tuKeHoachNgay(keHoach(), NOW))
    const mau = [...(dl.lamNgay ? [dl.lamNgay] : []), ...dl.cacBac.flatMap((b) => b.viec)][0]!
    expect(mau).toBeDefined()
    const theBtvn = (ma: string) => ({ ...mau, id: `btvn:${ma}`, hanhDong: { loai: 'mo_btvn' as const, payload: { bt: { maBtvn: ma, maCa: `CA-${ma}` } }, nhanNut: 'Làm bài' } })
    const du: DuLieuBangNhiemVu = { ...dl, canhBaoThay: [cb({ maBtvn: 'B7' })], lamNgay: null, cacBac: dl.cacBac.map((b, i) => (i === 0 ? { ...b, viec: [theBtvn('B5'), theBtvn('B7')] } : { ...b, viec: [] })) }
    const onHanhDong = vi.fn()
    render(<BangNhiemVu vaiTro="hocsinh" hoTen="Minh" now={NOW} duLieu={du} onHanhDong={onHanhDong} />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Làm ngay' })[0]!)
    expect(onHanhDong).toHaveBeenCalledTimes(1)
    expect(onHanhDong.mock.calls[0]![0].payload.bt.maBtvn).toBe('B7')
    cleanup()
    const onHanhDong2 = vi.fn()
    render(<BangNhiemVu vaiTro="hocsinh" hoTen="Minh" now={NOW} duLieu={{ ...du, canhBaoThay: [cb({ maBtvn: 'CA-B5' })] }} onHanhDong={onHanhDong2} />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Làm ngay' })[0]!)
    expect(onHanhDong2.mock.calls[0]![0].payload.bt.maBtvn).toBe('B5')
  })
  it('khớp bài CHẶT: việc không phải mo_btvn (dù có bt trùng mã) hoặc cảnh báo không mã bài ⇒ không nút "Làm ngay"', () => {
    const dl = conThu(tuKeHoachNgay(keHoach(), NOW))
    const mau = [...(dl.lamNgay ? [dl.lamNgay] : []), ...dl.cacBac.flatMap((b) => b.viec)][0]!
    const dungBang = (hanhDong: unknown, cbo: CanhBaoThay) => {
      const the = { ...mau, id: 'x', hanhDong }
      const du = { ...dl, canhBaoThay: [cbo], lamNgay: null, cacBac: dl.cacBac.map((b, i) => (i === 0 ? { ...b, viec: [the] } : { ...b, viec: [] })) } as unknown as DuLieuBangNhiemVu
      return render(<BangNhiemVu vaiTro="hocsinh" hoTen="Minh" now={NOW} duLieu={du} onHanhDong={() => {}} />)
    }
    dungBang({ loai: 'mo_mom', payload: { bt: { maBtvn: 'B7' } }, nhanNut: 'Làm bài' }, cb({ maBtvn: 'B7' })) // sai loại việc
    expect(screen.queryByRole('button', { name: 'Làm ngay' })).toBeNull()
    cleanup()
    dungBang({ loai: 'mo_btvn', payload: { bt: { maBtvn: '', maCa: '' } }, nhanNut: 'Làm bài' }, cb({ maBtvn: '' })) // hai bên đều rỗng
    expect(screen.queryByRole('button', { name: 'Làm ngay' })).toBeNull()
    cleanup()
    dungBang({ loai: 'mo_btvn', payload: { bt: { maBtvn: 'B7' } }, nhanNut: 'Làm bài' }, cb({ maBtvn: 'B7' })) // đối chứng: đúng loại + đúng mã
    expect(screen.getByRole('button', { name: 'Làm ngay' })).toBeTruthy()
  })
  it('không lẫn vai: học sinh chỉ đọc `duLieu.canhBaoThay` (bỏ qua canhBaoPh); phụ huynh chỉ đọc `canhBaoPh` (bỏ qua duLieu.canhBaoThay)', () => {
    const dl = conThu(tuKeHoachNgay(keHoach({ canhBaoThay: [tho({ id: 'cua-em', tenBtvn: 'Bài của em' })] }), NOW))
    const ph = [cb({ id: 'cua-ph', tenBtvn: 'Bài của PH' })]
    const hs = render(<BangNhiemVu vaiTro="hocsinh" hoTen="Minh" now={NOW} duLieu={dl} canhBaoPh={ph} />)
    expect(hs.container.textContent).toContain('Bài của em')
    expect(hs.container.textContent).not.toContain('Bài của PH')
    cleanup()
    const p = render(<BangNhiemVu vaiTro="phuhuynh" hoTen="Minh" now={NOW} duLieu={dl} canhBaoPh={ph} />)
    expect(p.container.textContent).toContain('Bài của PH')
    expect(p.container.textContent).not.toContain('Bài của em')
    expect(screen.queryByRole('button', { name: 'Làm ngay' })).toBeNull()
  })
})
