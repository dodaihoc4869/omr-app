// "CẢNH BÁO CỦA THẦY" trên BẢNG NHIỆM VỤ: adapter (khoá `canhBaoThay` không đụng `canhBao` của máy chủ) + thẻ + nút + không lẫn vai + vị trí.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import TheCanhBaoThay from '../src/components/bang-nhiem-vu/TheCanhBaoThay'
import { tuKeHoachNgay, tuKeHoachTroLy, type DuLieuBangNhiemVu, type KeHoachNgayMayChu, type TrangThaiThanThu } from '../src/lib/nhiem-vu-adapter'
import { tongHopKeHoachTroLy } from '../src/lib/tro-ly-ca-nhan'
import { docCanhBaoThay, type CanhBaoThay } from '../src/lib/canh-bao-thay-hien-thi'

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
})
