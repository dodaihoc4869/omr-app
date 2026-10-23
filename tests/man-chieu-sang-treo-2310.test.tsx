// MÀN CHIẾU ĐIỂM DANH + NHỊP HỌC NỀN SÁNG (bản vẽ docs/ban-ve-chieu-diem-danh-2310, thầy 23/10: «thay nền sáng… hiển thị đủ thông tin treo máy», «chốt, build luôn nhé»).
// Kiểm:
//   · phép thuần Cách làm bài / Treo máy (chieu-treo.ts) + máy chủ `tongTreoMay` + bộ đọc `giayTreo`/`soNgayTreo` (vắng ⇒ "—", không bịa 0);
//   · bản B: cột Treo máy đủ tên từng em (nhiều lượt trước) + ba ô số cả lớp; thanh Cách cả lớp làm bài; phím M bật thanh từng em; chữ «Cố tình» KHÔNG lên chiếu;
//   · bản A: dấu ⏸ N trên thẻ em có treo;
//   · ghim nền sáng khi mở, trả lại lựa chọn của thầy khi đóng;
//   · bảng điểm danh hỏi Mức làm ĐỦ mọi em có mặt (> 40 em ⇒ chia lô 40, các lô hỏi song song).
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, renderHook, screen, within } from '@testing-library/react'

const layMucLamLo = vi.fn()
vi.mock('../src/lib/muc-lam-lo-api', async (goc) => ({ ...(await goc<typeof import('../src/lib/muc-lam-lo-api')>()), layMucLamLo: (s: string[]) => layMucLamLo(s) }))

import type { EmNhipHoc } from '../server/src/nhip-hoc-kieu'
import type { KetQuaBac } from '../server/src/bac-cham-chi'
import { tongTreoMay } from '../server/src/muc-lam-lo'
import BanChieuDiemDanh, { chuMaDoi, type PropsBanChieu } from '../src/components/day-hoc/BanChieuDiemDanh'
import { CHO_HOI_MUC_LAM_MS, useMucLamLo } from '../src/components/day-hoc/Buoc1DiemDanh'
import { cachEm, dsTreoMay, phutTreo, tongCachLop } from '../src/components/day-hoc/chieu-treo'
import { docMucLamEm, type MucLamEm } from '../src/lib/muc-lam-lo-api'
import { nhipTheoSbd, thongKeBuoi } from '../src/lib/diem-danh-nhip'
import type { KetQuaNhipHoc } from '../src/lib/nhip-hoc-thay'
import type { TrangThaiBuoi } from '../src/lib/buoi-hoc-api'
import { KHOA_GIAO_DIEN } from '../src/lib/giao-dien-thay'

const ml = (m: [number, number, number, number], treo = 0, coTinh = 0, o: Partial<MucLamEm> = {}): MucLamEm => ({
  soDo: m[0] + m[1] + m[2] + m[3] + treo + coTinh, chuaCoSoDo: 0, m, soUocTinh: 0, soTreo: treo, soCoTinh: coTinh, soChuaDoTreo: 1, saiLamVoi: 2, saiDuNghi: 1, ...o,
})

describe('phép thuần: Cách làm bài + Treo máy', () => {
  const M = new Map<string, MucLamEm>([
    ['A', ml([3, 1, 4, 2], 2, 1, { giayTreo: 900, soNgayTreo: 2 })], // Cố tình gộp vào Treo (bản công khai)
    ['B', ml([0, 0, 5, 5], 0, 0, { giayTreo: 0, soNgayTreo: 0 })],
    ['C', ml([1, 1, 1, 1], 3, 0, { giayTreo: 400, soNgayTreo: 1 })],
  ])
  it('Vội = Mức 1–2 · Có nghĩ = 3–4 · Treo = Treo + Cố tình; tổng chỉ cộng em có số, nêu rõ số em có số', () => {
    expect(cachEm(M.get('A')!)).toEqual({ voi: 4, nghi: 6, treo: 3 })
    const t = tongCachLop(['A', 'B', 'C', 'D'], M)
    expect(t).toMatchObject({ soEm: 4, soEmCoSo: 3, voi: 6, nghi: 18, treo: 6, soDo: 30, sai: 9, saiVoi: 6, giayTreo: 1300, phutTreo: 22, soEmTreo: 2, chuaDoTreo: 3 })
  })
  it('phút treo cả lớp = TỔNG phút từng em như màn hiện (3 em × 89 giây ⇒ 1 + 1 + 1 = 3 phút, không phải 4)', () => {
    const M3 = new Map(['X', 'Y', 'Z'].map((s) => [s, ml([1, 0, 0, 0], 1, 0, { giayTreo: 89, soNgayTreo: 1 })] as const))
    const t = tongCachLop(['X', 'Y', 'Z'], M3)
    expect([t.giayTreo, t.phutTreo]).toEqual([267, 3])
    expect(dsTreoMay(['X', 'Y', 'Z'].map((sbd) => ({ sbd, hoTen: sbd })), M3).reduce((a, d) => a + d.phut!, 0)).toBe(t.phutTreo)
  })
  it('«Mã đổi sau»: chỉ đếm khi khớp lý; về 0 ⇒ «Đang đổi mã…»; giờ máy thầy lệch xa ⇒ không đếm (chữ "Mã đổi mỗi phút")', () => {
    expect(chuMaDoi(100_000, 62_000)).toEqual({ con: 38_000, dangDoi: false })
    expect(chuMaDoi(100_000, 100_500)).toEqual({ con: 0, dangDoi: true })
    expect(chuMaDoi(100_000, 20_000)).toEqual({ con: null, dangDoi: false }) // còn 80 s > một chu kỳ ⇒ máy thầy chậm giờ
    expect(chuMaDoi(100_000, 200_000)).toEqual({ con: null, dangDoi: false }) // quá 15 s sau mốc ⇒ máy thầy nhanh giờ
    expect(chuMaDoi(null, 1)).toEqual({ con: null, dangDoi: false })
  })
  it('em treo mà máy chủ chưa gửi giây treo ⇒ phút cả lớp null (màn ghi "—"), không cộng thiếu', () => {
    const M2 = new Map(M)
    M2.set('C', ml([1, 1, 1, 1], 3))
    expect(tongCachLop(['A', 'C'], M2).giayTreo).toBeNull()
    expect(dsTreoMay([{ sbd: 'C', hoTen: 'Chu' }], M2)).toEqual([{ em: { sbd: 'C', hoTen: 'Chu' }, treo: 3, phut: null, soNgay: null }])
  })
  it('danh sách Treo máy: nhiều lượt trước, cùng lượt ⇒ nhiều giây trước; em không treo không vào; phút làm tròn, tối thiểu 1', () => {
    const ds = [{ sbd: 'A', hoTen: 'An' }, { sbd: 'B', hoTen: 'Bình' }, { sbd: 'C', hoTen: 'Chi' }]
    expect(dsTreoMay(ds, M).map((d) => [d.em.sbd, d.treo, d.phut, d.soNgay])).toEqual([['A', 3, 15, 2], ['C', 3, 7, 1]])
    expect([phutTreo(0), phutTreo(20), phutTreo(90), phutTreo(150)]).toEqual([0, 1, 2, 3])
  })
  it('máy chủ: tổng giây treo + số ngày có treo gồm cả lượt Cố tình (nâng theo ngày không đổi giây)', () => {
    expect(
      tongTreoMay([
        { mucLam: { treo: 'treo', giayTreo: 200 } as never, ngay: '2026-10-20' },
        { mucLam: { treo: 'co_tinh', giayTreo: 300 } as never, ngay: '2026-10-21' },
        { mucLam: { treo: 'co_tinh', giayTreo: 100.4 } as never, ngay: '2026-10-21' },
        { mucLam: { ma: 2 } as never, ngay: '2026-10-22' },
        { mucLam: null, ngay: '2026-10-23' },
      ]),
    ).toEqual({ giay: 600, soNgay: 2 })
  })
  it('bộ đọc: có `giayTreo` + `soNgayTreo` hợp lệ ⇒ giữ; vắng ⇒ vắng; có giây treo mà không lượt treo nào ⇒ bỏ (không bịa)', () => {
    const goc = { soDo: 4, chuaCoSoDo: 0, m: [1, 1, 1, 0], soUocTinh: 0, soTreo: 1, soCoTinh: 0, soChuaDoTreo: 0 }
    expect(docMucLamEm({ ...goc, giayTreo: 300, soNgayTreo: 1 })).toMatchObject({ giayTreo: 300, soNgayTreo: 1 })
    expect(docMucLamEm(goc)).not.toHaveProperty('giayTreo')
    const khongTreo = { ...goc, m: [1, 1, 1, 1], soTreo: 0 }
    expect(docMucLamEm({ ...khongTreo, giayTreo: 0, soNgayTreo: 0 })).toMatchObject({ giayTreo: 0, soNgayTreo: 0 })
    expect(docMucLamEm({ ...khongTreo, giayTreo: 50, soNgayTreo: 1 })).not.toHaveProperty('giayTreo')
  })
})

// ---------------------------------------------------------------- màn chiếu thật (dữ liệu nhỏ)
const NGAY = Array.from({ length: 12 }, (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`)
const LAM: Record<string, number> = { d: 24, i: 14, k: 0 }
const em = (sbd: string, hoTen: string, ma: string, bacCham?: KetQuaBac): EmNhipHoc => ({
  sbd, hoTen, lop: '12A1', khoi: '12', ngayVao: '2026-10-01', muc: NGAY.map(() => 24), lam: ma.split(' ').map((c) => LAM[c]!), doiPho: null, ...(bacCham ? { bacCham } : {}),
})
const DU = 'd d d d d d d d d d d d'
const EM: EmNhipHoc[] = [
  em('B', 'Vũ Thanh Bình', DU, { bac: 12, diem: 99, diemLenBac: null }),
  em('C', 'Chu Hải Chi', DU, { bac: 10, diem: 88, diemLenBac: 2 }),
  em('G', 'Đỗ Mai Giang', 'd i d i d i d i d i d k', { bac: 7, diem: 60, diemLenBac: null }),
  em('D', 'Hoàng Đức Duy', 'k k k k k k k k k k k k', { bac: 1, diem: 0, diemLenBac: 8 }),
]
const KQ: KetQuaNhipHoc = { ok: true, tu: '2026-10-01', den: '2026-10-12', homNay: '2026-10-12', ngay: NGAY, lop: [], doiPhoDaTinh: { quaNhanh: true, chonLap: true }, canhBao: [], em: EM }
const BUOI = { id: 'BH-12', ten: 'Buổi học 12/10 · 12A1', lop: '12A1', moLuc: '2026-10-12T10:50:00Z', hetHan: '2026-10-13T10:50:00Z', dongLuc: null, dangMo: true }
const TT: TrangThaiBuoi = {
  buoi: BUOI, ma: '482915', doiMaLuc: 1, siSo: 4,
  coMat: EM.map((e, i) => ({ sbd: e.sbd, hoTen: e.hoTen, luc: `2026-10-12T10:5${i}:00Z`, cach: 'ma' as const })),
  lopEm: EM.map((e) => ({ sbd: e.sbd, hoTen: e.hoTen, tenLop: '12A1' })),
}
const MUC = new Map<string, MucLamEm>([
  ['B', ml([1, 1, 6, 4], 0, 0, { giayTreo: 0, soNgayTreo: 0 })],
  ['C', ml([2, 0, 3, 3], 1, 0, { giayTreo: 240, soNgayTreo: 1 })],
  ['D', ml([5, 3, 1, 0], 2, 3, { giayTreo: 1500, soNgayTreo: 3 })], // có Cố tình: chỉ hiện là Treo máy
  ['G', ml([2, 2, 2, 2], 0, 0, { giayTreo: 0, soNgayTreo: 0 })],
])
// Tổng (tính tay): Vội 2+2+8+4 = 16 · Có nghĩ 10+6+1+4 = 21 · Treo 0+1+5+0 = 6 · đo giờ 12+9+14+8 = 43 · sai 4×3 = 12, sai vội 4×2 = 8 · giây treo 240+1500 = 1740 = 29 phút
const props = (o: Partial<PropsBanChieu> = {}): PropsBanChieu => ({
  cheDo: 'nhip-lop', tt: TT, tk: thongKeBuoi(TT, nhipTheoSbd(KQ)), nhip: { kq: KQ, dangTai: false, loi: '' }, goc: 'https://app.test', matKetNoi: false, hoSoMo: false,
  onDoiCheDo: vi.fn(), onDong: vi.fn(), onMoEm: vi.fn(), onThuLaiNhip: vi.fn(), mucLam: MUC, ...o,
})

afterEach(() => {
  cleanup()
  document.documentElement.removeAttribute('data-giao-dien')
  localStorage.removeItem(KHOA_GIAO_DIEN)
  layMucLamLo.mockReset()
  vi.useRealTimers()
})

describe('bản B — Cách cả lớp làm bài + cột Treo máy', () => {
  it('cột Treo máy: đủ tên từng em có treo (nhiều lượt trước) · ngày · phút · lượt; ba ô số cả lớp; bấm tên ⇒ hồ sơ đúng em', () => {
    const p = props()
    render(<BanChieuDiemDanh {...p} />)
    const cot = screen.getByRole('region', { name: /^Treo máy/ })
    expect(cot.querySelector('h2')!.textContent).toBe('Treo máy2 em14 ngày · em có mặt · rời câu lâu không làm')
    expect([...cot.querySelectorAll('.ddv-treo-tong p')].map((x) => x.textContent)).toEqual(['6lượt treo', '29phút treo', '2em có treo'])
    const dong = [...cot.querySelectorAll<HTMLButtonElement>('.ddv-treo-dong')]
    expect(dong.map((d) => d.textContent)).toEqual(['Hoàng Đức Duy3 ngày · 25 phút5lượt', 'Chu Hải Chi1 ngày · 4 phút1lượt'])
    expect(cot.querySelector('.ddv-treo-chua')!.textContent).toBe('4 lượt chưa đo treo máy')
    fireEvent.click(dong[0]!)
    expect(p.onMoEm).toHaveBeenCalledWith(expect.objectContaining({ sbd: 'D' }), dong[0])
  })
  it('thanh Cách cả lớp làm bài: Vội / Có nghĩ / Treo máy (lượt, %, phút) + câu lượt sai nộp vội', () => {
    render(<BanChieuDiemDanh {...props()} />)
    const cach = screen.getByLabelText('Cách cả lớp làm bài 14 ngày qua')
    expect(cach.querySelector('.ddv-cach-tieu small')!.textContent).toBe('14 ngày qua · 4 em có mặt · 43 lượt đã đo giờ')
    expect([...cach.querySelectorAll('.ddv-cach-thanh > span')].map((x) => x.textContent)).toEqual(['Vội 16 lượt · 37%', 'Có nghĩ 21 lượt · 49%', 'Treo máy 6 lượt · 29 phút'])
    expect(cach.querySelector('.ddv-cach-cau')!.textContent).toBe('8/12 lượt sai (67%) là nộp khi chưa kịp đọc hết đề')
  })
  it('chưa đủ số mọi em ⇒ ghi rõ "số của x/y em"; máy chủ cũ không gửi giây treo ⇒ phút "—"', () => {
    const thieu = new Map([...MUC].filter(([s]) => s !== 'B').map(([s, m]) => [s, { ...m, giayTreo: undefined, soNgayTreo: undefined }]))
    render(<BanChieuDiemDanh {...props({ mucLam: thieu })} />)
    expect(screen.getByLabelText('Cách cả lớp làm bài 14 ngày qua').querySelector('.ddv-cach-tieu small')!.textContent).toContain('số của 3/4 em có mặt')
    const cot = screen.getByRole('region', { name: /^Treo máy/ })
    expect(cot.querySelectorAll('.ddv-treo-tong b')[1]!.textContent).toBe('—')
    expect(cot.querySelector('.ddv-treo-dong small')!.textContent).toBe('— ngày · — phút')
  })
  it('đang tải / lỗi Mức làm ⇒ nói thật, không vẽ số', () => {
    const { unmount } = render(<BanChieuDiemDanh {...props({ mucLam: new Map(), mucLamDang: true })} />)
    expect(screen.getByText('Đang tải cách làm bài của lớp…')).toBeTruthy()
    expect(screen.getByText('Đang tải số treo máy…')).toBeTruthy()
    unmount()
    render(<BanChieuDiemDanh {...props({ mucLam: new Map(), mucLamLoi: 'Không nối được máy chủ.' })} />)
    expect(screen.getByText('Chưa tải được cách làm bài: Không nối được máy chủ.')).toBeTruthy()
  })
  it('phím M bật / tắt thanh cách làm từng em (mặc định tắt: dải ô ngày); chữ «Cố tình» không bao giờ lên chiếu', () => {
    render(<BanChieuDiemDanh {...props()} />)
    const nut = screen.getByRole('button', { name: /^Cách làm từng em: Tắt/ })
    expect(nut.getAttribute('aria-pressed')).toBe('false')
    expect(document.querySelector('.ddv-dong-muc')).toBeNull()
    act(() => {
      fireEvent.keyDown(window, { key: 'm' })
    })
    expect(screen.getByRole('button', { name: /^Cách làm từng em: Bật/ }).getAttribute('aria-pressed')).toBe('true')
    const d = [...document.querySelectorAll('.ddv-dong-em')].find((x) => x.textContent!.includes('Hoàng Đức Duy'))!
    expect([...d.querySelectorAll<HTMLElement>('.ddv-dong-muc i')].map((i) => [i.dataset.k, i.style.flexGrow])).toEqual([['voi', '8'], ['nghi', '1'], ['treo', '5']])
    expect(d.getAttribute('aria-label')).toContain('vội 8, có nghĩ 1, treo máy 5 lượt')
    expect(document.body.textContent).not.toMatch(/Cố tình/i)
    cleanup()
    render(<BanChieuDiemDanh {...props({ cheDo: 'diem-danh' })} />)
    expect(document.body.textContent).not.toMatch(/Cố tình/i)
  })
})

describe('bản A — dấu ⏸ treo máy trên thẻ', () => {
  it('em có treo trong 14 ngày ⇒ dấu số lượt (Cố tình gộp); em không treo ⇒ không dấu; chú giải nói nghĩa', () => {
    render(<BanChieuDiemDanh {...props({ cheDo: 'diem-danh' })} />)
    const the = (ten: string) => [...document.querySelectorAll('.ddv-the')].find((x) => x.textContent!.includes(ten))!
    expect(the('Hoàng Đức Duy').querySelector('.ddv-treo-chip')!.textContent).toBe('5')
    expect(the('Hoàng Đức Duy').querySelector('.ddv-treo-chip')!.getAttribute('title')).toBe('Treo máy 5 lượt trong 14 ngày')
    expect(the('Chu Hải Chi').querySelector('.ddv-treo-chip')!.textContent).toBe('1')
    expect(the('Vũ Thanh Bình').querySelector('.ddv-treo-chip')).toBeNull()
    expect(document.querySelector('.ddv-chan')!.textContent).toContain('N = số lượt treo máy 14 ngày')
  })
})

describe('ghim nền sáng', () => {
  it('mở ⇒ html ép Sáng (không lưu lựa chọn); đóng ⇒ trả về lựa chọn của thầy (Theo máy ⇒ gỡ thuộc tính; Tối ⇒ Tối)', () => {
    const { unmount } = render(<BanChieuDiemDanh {...props()} />)
    expect(document.documentElement.getAttribute('data-giao-dien')).toBe('sang')
    expect(localStorage.getItem(KHOA_GIAO_DIEN)).toBeNull()
    unmount()
    expect(document.documentElement.hasAttribute('data-giao-dien')).toBe(false)
    localStorage.setItem(KHOA_GIAO_DIEN, 'toi')
    document.documentElement.setAttribute('data-giao-dien', 'toi')
    const r = render(<BanChieuDiemDanh {...props()} />)
    expect(document.documentElement.getAttribute('data-giao-dien')).toBe('sang')
    r.unmount()
    expect(document.documentElement.getAttribute('data-giao-dien')).toBe('toi')
  })
})

describe('bảng điểm danh hỏi Mức làm đủ mọi em có mặt', () => {
  it('45 em ⇒ hai lô (40 + 5) hỏi cùng lúc, gộp đủ 45 em; lô lỗi chỉ đánh dấu lỗi, lô kia vẫn giữ số', async () => {
    vi.useFakeTimers()
    const sbds = Array.from({ length: 45 }, (_, i) => `S${i + 1}`)
    layMucLamLo.mockImplementation(async (lo: string[]) =>
      lo.length === 5 ? { ok: false, loai: 'mang', chu: 'Không nối được máy chủ.' } : { ok: true, du: { em: new Map(lo.map((s) => [s, ml([1, 1, 1, 1])])) } },
    )
    const { result } = renderHook(() => useMucLamLo(sbds.join(','), true))
    await act(async () => {
      vi.advanceTimersByTime(CHO_HOI_MUC_LAM_MS + 10)
    })
    expect(layMucLamLo.mock.calls.map((c) => (c[0] as string[]).length)).toEqual([40, 5])
    expect(result.current.theoEm.size).toBe(40)
    expect(result.current.loi).toBe(true)
    expect(result.current.dang).toBe(false)
  })
})

it('màn chiếu có nút Đóng nhận tiêu điểm khi mở (giữ hành vi cũ)', () => {
  render(<BanChieuDiemDanh {...props()} />)
  expect(within(screen.getByRole('dialog')).getByRole('button', { name: /^Đóng/ })).toBe(document.activeElement)
})
