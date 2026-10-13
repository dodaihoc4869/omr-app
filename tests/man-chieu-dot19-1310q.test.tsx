// MÀN CHIẾU ĐIỂM DANH ĐỢT 19 (làn Q — bản vẽ docs/ban-ve-dot19/man-chieu-diem-danh.html, thầy duyệt 13/10: "duyệt cả hai giữ xếp theo bậc phụ huynh
// xem được hạng"). Kiểm:
//   · lưới thẻ XẾP THEO BẬC cao → thấp, cùng bậc thì điểm chăm cao trước; em chưa xếp bậc đứng sau (Mới → chưa có số);
//   · thẻ có huy hiệu đúng bậc + số bậc + tên bậc + Điểm chăm + Chuỗi ngày (Lười: "Thoát Lười k/6") + Đủ mức x/y ngày;
//   · thang 12 bậc đếm đúng số em có mặt mỗi bậc + số em mỗi nhóm + ô Mới;
//   · khối "Bậc cao nhất lớp" đúng em cao nhất + hai em theo sát;
//   · em chưa xếp bậc (Mới · chưa có số nhịp học) có thẻ riêng, không vỡ;
//   · máy chủ cũ không gửi `bacCham` ⇒ màn vẫn chạy (thẻ tô theo nhóm, chip đếm nhóm, không thang / vinh danh);
//   · ba em vào muộn nhất có "Vừa vào"; em MỚI vào trong lượt làm mới ⇒ thẻ nổi "Vừa điểm danh" (câu lên bậc) rồi tự gỡ; lần đầu mở không nổi;
//   · giữ chức năng: bấm thẻ ⇒ mở hồ sơ đúng em, Esc đóng, → sang Nhịp học của lớp, nút "Chiếu Nhịp học của lớp", mã buổi + QR.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import type { EmNhipHoc } from '../server/src/nhip-hoc-kieu'
import type { KetQuaBac } from '../server/src/bac-cham-chi'
import BanChieuDiemDanh, { GIU_THE_NOI_MS, type PropsBanChieu } from '../src/components/day-hoc/BanChieuDiemDanh'
import { coBacBuoi, coLuoiThe, dauLop, demThang, emVuaVao, lenBac, soThe } from '../src/components/day-hoc/chieu-bac'
import { luoiDiemDanh, nhipTheoSbd, thongKeBuoi, type EmBuoi } from '../src/lib/diem-danh-nhip'
import type { KetQuaNhipHoc } from '../src/lib/nhip-hoc-thay'
import type { TrangThaiBuoi } from '../src/lib/buoi-hoc-api'

// ---------------------------------------------------------------- dữ liệu: 12 ngày 01/10 → 12/10, hôm nay 12/10 (11 ngày đã qua)
const NGAY = Array.from({ length: 12 }, (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`)
const LAM: Record<string, number> = { d: 24, i: 14, k: 0, '-': 0 }
const em = (sbd: string, hoTen: string, ma: string, bacCham?: KetQuaBac, o: Partial<EmNhipHoc> = {}): EmNhipHoc => ({
  sbd, hoTen, lop: '12A1', khoi: '12', ngayVao: '2026-10-01', muc: NGAY.map(() => 24), lam: ma.split(' ').map((c) => LAM[c]!), doiPho: null,
  ...(bacCham ? { bacCham } : {}), ...o,
})
const DU = 'd d d d d d d d d d d d' // Chăm 11/11, chuỗi đủ mức 12 (hôm nay đã đủ)
const EM: EmNhipHoc[] = [
  em('A', 'Lê Minh An', 'd d d d d d d d d i d d', { bac: 10, diem: 85, diemLenBac: 5 }), // Chăm 10/11, chuỗi 2
  em('B', 'Vũ Thanh Bình', DU, { bac: 12, diem: 99, diemLenBac: null }),
  em('C', 'Chu Hải Chi', DU, { bac: 10, diem: 88, diemLenBac: 2 }),
  em('G', 'Đỗ Mai Giang', 'd i d i d i d i d i d k', { bac: 7, diem: 60, diemLenBac: null }), // Chưa đều 6/11
  em('D', 'Hoàng Đức Duy', 'k k k k k k k k k k k k', { bac: 1, diem: 0, diemLenBac: 8 }), // Lười 0/11
  em('E', 'Quách Gia Linh', '- - - - - - - - - - d d', undefined, { ngayVao: '2026-10-11' }), // Mới (1 ngày đã qua)
  em('H', 'Phan Quang Huy', DU, { bac: 11, diem: 93, diemLenBac: 5 }), // vào sau (thẻ nổi)
]
const KQ: KetQuaNhipHoc = { ok: true, tu: '2026-10-01', den: '2026-10-12', homNay: '2026-10-12', ngay: NGAY, lop: [], doiPhoDaTinh: { quaNhanh: true, chonLap: true }, canhBao: [], em: EM }
const KQ_CU: KetQuaNhipHoc = { ...KQ, em: EM.map(({ bacCham: _bo, ...e }) => e) }
const BUOI = { id: 'BH-12', ten: 'Buổi học 12/10 · 12A1', lop: '12A1', moLuc: '2026-10-12T10:50:00Z', hetHan: '2026-10-13T10:50:00Z', dongLuc: null, dangMo: true }
const luc = (phut: number) => `2026-10-12T10:${String(phut).padStart(2, '0')}:00Z`
const ten = (sbd: string) => EM.find((e) => e.sbd === sbd)?.hoTen ?? 'Phạm Hà'
// có mặt: B C A G D E F theo thứ tự giờ; F học ghép lớp khác, không có số nhịp học
const CO_MAT = ['B', 'C', 'A', 'G', 'D', 'E', 'F'].map((sbd, i) => ({ sbd, hoTen: ten(sbd), luc: luc(50 + i), cach: 'ma' as const }))
const LOP_EM = [...EM.map((e) => ({ sbd: e.sbd, hoTen: e.hoTen, tenLop: '12A1' })), { sbd: 'F', hoTen: 'Phạm Hà', tenLop: '12 - Tinh Hoa' }]
const tt = (coMat = CO_MAT): TrangThaiBuoi => ({ buoi: BUOI, ma: '482915', doiMaLuc: 1, coMat, siSo: 7, lopEm: LOP_EM })

function props(o: Partial<PropsBanChieu> = {}, kq: KetQuaNhipHoc = KQ, coMat = CO_MAT): PropsBanChieu {
  const t = tt(coMat)
  return {
    cheDo: 'diem-danh', tt: t, tk: thongKeBuoi(t, nhipTheoSbd(kq)), nhip: { kq, dangTai: false, loi: '' }, goc: 'https://app.test', matKetNoi: false, hoSoMo: false,
    onDoiCheDo: vi.fn(), onDong: vi.fn(), onMoEm: vi.fn(), onThuLaiNhip: vi.fn(), ...o,
  }
}
const chieu = () => screen.getByRole('dialog', { name: 'Bản chiếu điểm danh' })
const the = () => [...within(chieu()).getByRole('list', { name: 'Bấm tên em để mở hồ sơ làm bài' }).querySelectorAll<HTMLButtonElement>('button.ddc-em')]
const tenThe = (b: Element) => b.querySelector('.ddc-em-chu > b')?.textContent
const coMatTk = (kq: KetQuaNhipHoc = KQ) => thongKeBuoi(tt(), nhipTheoSbd(kq)).coMat

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('phép thuần (chieu-bac.ts + luoiDiemDanh)', () => {
  it('lưới xếp theo bậc cao → thấp, cùng bậc thì điểm chăm cao trước; em chưa xếp bậc đứng sau (Mới rồi chưa có số)', () => {
    expect(luoiDiemDanh(coMatTk()).map((e) => e.sbd)).toEqual(['B', 'C', 'A', 'G', 'D', 'E', 'F'])
    // máy chủ cũ (không bậc) ⇒ đúng cách xếp cũ: nhóm (Chăm → Chưa đều → Lười → Mới → chưa có số) rồi giờ điểm danh
    expect(luoiDiemDanh(coMatTk(KQ_CU)).map((e) => e.sbd)).toEqual(['B', 'C', 'A', 'G', 'D', 'E', 'F'])
    const cu = coMatTk(KQ_CU)
    const theo = (sbd: string) => cu.find((e) => e.sbd === sbd)!
    expect(luoiDiemDanh([theo('E'), theo('A'), theo('B')]).map((e) => e.sbd)).toEqual(['B', 'A', 'E'])
  })
  it('thang đếm đúng: số em mỗi bậc, mỗi nhóm, ô Mới (chưa xếp bậc); máy chủ có bậc khi một em bất kỳ có bậc', () => {
    const d = demThang(coMatTk())
    expect(d.bac).toEqual([1, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 1])
    expect([d.nhom.luoi, d.nhom.chuaDeu, d.nhom.cham, d.nhom.moi, d.nhom.chuaCo, d.chuaXep]).toEqual([1, 1, 3, 1, 1, 2])
    expect(coBacBuoi(coMatTk())).toBe(true)
    expect(coBacBuoi(coMatTk(KQ_CU))).toBe(false)
  })
  it('vinh danh: em đứng đầu lưới có bậc + hai em theo sát; không em nào có bậc ⇒ null', () => {
    const d = dauLop(luoiDiemDanh(coMatTk()))!
    expect([d.dau.sbd, ...d.sau.map((e) => e.sbd)]).toEqual(['B', 'C', 'A'])
    expect(dauLop(luoiDiemDanh(coMatTk(KQ_CU)))).toBeNull()
  })
  it('"Vừa vào" = ba em giờ điểm danh mới nhất; cỡ lưới thẻ theo số em', () => {
    expect([...emVuaVao(coMatTk())].sort()).toEqual(['D', 'E', 'F'])
    expect([5, 30, 31, 42, 48, 49, 56, 57].map((n) => coLuoiThe(n))).toEqual([
      { cot: 5, hang: 1, kieu: 'du' }, { cot: 5, hang: 6, kieu: 'du' }, { cot: 6, hang: 6, kieu: 'gon' }, { cot: 6, hang: 7, kieu: 'gon' },
      { cot: 6, hang: 8, kieu: 'gon' }, { cot: 7, hang: 7, kieu: 'gon' }, { cot: 7, hang: 8, kieu: 'gon' }, { cot: 7, hang: 9, kieu: 'cuon' },
    ])
  })
  it('số trên thẻ: Lười ⇒ "Thoát Lười k/6"; còn lại chuỗi đủ mức; không số ⇒ null', () => {
    const tk = coMatTk()
    const so = (sbd: string) => soThe(tk.find((e) => e.sbd === sbd)!)
    expect(so('D')).toEqual({ thoatLuoi: 0, chuoi: 0, du: '0/11' })
    expect(so('B')).toEqual({ thoatLuoi: null, chuoi: 12, du: '11/11' })
    expect(so('F')).toBeNull()
  })
  it('câu lên bậc của thẻ nổi: còn N điểm (vạch giữa hai ngưỡng) · bậc 11 chuỗi ngắn · cuối nhóm Lười / Chưa đều · bậc 12', () => {
    const e = (bacCham: KetQuaBac, chuoiDuGanNhat = 2, nhom: 'luoi' | 'chua-deu' | 'cham' = 'cham', soNgayDu = 10): Pick<EmBuoi, 'bacCham' | 'nhip'> => ({
      bacCham,
      nhip: { chuoiDuGanNhat, nhom, soNgayQua: 11, soNgayDu, homNay: { muc: 24, lam: 0 } } as EmBuoi['nhip'],
    })
    expect(lenBac(e({ bac: 10, diem: 86, diemLenBac: 4 }))).toEqual({
      ke: 11, cau: 'Còn 4 điểm chăm nữa lên Bậc 11 · Chiến Thần Năng Suất', tien: 0.5, mocTrai: 'Bậc 10 từ 82 điểm', mocPhai: 'Bậc 11 từ 90 điểm',
    })
    expect(lenBac(e({ bac: 8, diem: 36, diemLenBac: 36 }))?.mocTrai).toBe('Bậc 8')
    expect(lenBac(e({ bac: 11, diem: 99, diemLenBac: null }, 4))).toMatchObject({ ke: 12, cau: 'Lên Bậc 12 · Thần Chăm Chỉ Tối Thượng cần chuỗi đủ mức 7 ngày liền', mocTrai: 'Đang có 4 ngày liền' })
    expect(lenBac(e({ bac: 5, diem: 40, diemLenBac: null }, 3, 'luoi', 3))).toMatchObject({ ke: 6, cau: 'Đủ mức 6 ngày liền là thoát Lười, lên Bậc 6 · Lười Có Tính Toán', tien: 0.5 })
    // Chưa đều 6/11 ⇒ cần (80·11 − 100·6)/20 = 14 ngày đủ mức nữa (hôm nay chưa đủ ⇒ tính cả hôm nay)
    expect(lenBac(e({ bac: 7, diem: 60, diemLenBac: null }, 1, 'chua-deu', 6))?.cau).toBe('Thêm 14 ngày đủ mức nữa là lên Chăm · Bậc 8 · Tân Binh Siêng Năng')
    expect(lenBac(e({ bac: 12, diem: 99, diemLenBac: null }, 12))).toMatchObject({ ke: null, tien: null })
    expect(lenBac({ nhip: null })).toBeNull()
  })
})

describe('bản chiếu A — thẻ em theo bậc', () => {
  it('lưới thẻ xếp theo bậc; thẻ có huy hiệu + số bậc + tên bậc + Điểm chăm + Chuỗi / Thoát Lười + Đủ mức; vạch điểm chăm ở đáy', () => {
    render(<BanChieuDiemDanh {...props()} />)
    const o = the()
    expect(o.map(tenThe)).toEqual(['Vũ Thanh Bình', 'Chu Hải Chi', 'Lê Minh An', 'Đỗ Mai Giang', 'Hoàng Đức Duy', 'Quách Gia Linh', 'Phạm Hà'])
    const [b, c, , g, d] = o
    expect(b!.querySelector('svg.bcc-hh')!.getAttribute('data-bac')).toBe('12')
    expect(b!.querySelector('.ddc-the-so')!.textContent).toBe('12')
    expect(b!.querySelector('.ddc-the-bac')!.textContent).toBe('Thần Chăm Chỉ Tối Thượng')
    expect([...b!.querySelectorAll('.ddc-the-dong')].map((x) => x.textContent)).toEqual(['Điểm chăm 99Chuỗi 12 ngày', 'Đủ mức 11/11 ngày'])
    expect(b!.getAttribute('aria-label')).toBe('Vũ Thanh Bình, Chăm, đủ mức 11/11 ngày, Bậc 12/12 · Thần Chăm Chỉ Tối Thượng, điểm chăm 99 — mở hồ sơ làm bài')
    expect(b!.querySelector<HTMLElement>('.ddc-the-diem > i')!.style.transform).toBe('scaleX(0.99)')
    expect(c!.querySelector('.ddc-the-bac')!.textContent).toBe('Cao Thủ Chăm Chỉ')
    expect(g!.querySelector('.ddc-the-bac')!.textContent).toBe('Đại Sư Cân Bằng')
    expect(d!.querySelector('.ddc-the-bac')!.textContent).toBe('Lười Vô Cực')
    expect(d!.querySelector('.ddc-the-thoat')!.textContent).toBe('Thoát Lười 0/6')
    expect(d!.className).toContain('bcc')
    expect(d!.getAttribute('data-bac')).toBe('1')
  })

  it('thang 12 bậc: số em mỗi bậc, ô trống mờ, nhóm Lười 1–5 · Chưa đều 6–7 · Chăm 8–12, ô Mới', () => {
    render(<BanChieuDiemDanh {...props()} />)
    const thang = within(chieu()).getByRole('group', { name: 'Số em có mặt ở mỗi bậc, từ Lười đến Chăm' })
    const cot = [...thang.querySelectorAll('.ddc-bac-cot')]
    expect(cot).toHaveLength(13)
    expect(cot.map((x) => x.querySelector('.ddc-bac-chu b')!.textContent)).toEqual(['1 em', '0 em', '0 em', '0 em', '0 em', '0 em', '1 em', '0 em', '0 em', '2 em', '0 em', '1 em', '2 em'])
    expect(cot.filter((x) => x.hasAttribute('data-khong')).map((x) => x.getAttribute('data-bac'))).toEqual(['2', '3', '4', '5', '6', '8', '9', '11'])
    expect(cot[11]!.querySelector('svg.bcc-hh')!.getAttribute('data-bac')).toBe('12')
    expect(cot[11]!.textContent).toContain('ở Bậc 12/12 · Thần Chăm Chỉ Tối Thượng')
    expect([...thang.querySelectorAll('.ddc-thang-nhom')].map((x) => x.textContent)).toEqual(['Lười bậc 1–5 · 1 em', 'Chưa đều 6–7 · 1 em', 'Chăm bậc 8–12 · 3 em', 'Mới'])
    // bệ bậc cao hơn bệ bậc thấp (bậc thềm)
    const be = (i: number) => Number((cot[i] as HTMLElement).style.getPropertyValue('--be'))
    expect(be(11)).toBeGreaterThan(be(0))
  })

  it('khối "Bậc cao nhất lớp": em cao nhất (bậc, rồi điểm chăm) + ba số + hai em theo sát phía sau', () => {
    render(<BanChieuDiemDanh {...props()} />)
    const vd = within(chieu()).getByRole('region', { name: 'Bậc cao nhất lớp' })
    expect(vd.querySelector('.ddc-vinh-ten')!.textContent).toBe('Vũ Thanh Bình')
    expect(vd.querySelector('.ddc-vinh-bac')!.textContent).toBe('Bậc 12/12 · Thần Chăm Chỉ Tối Thượng')
    expect(vd.querySelector('.ddc-vinh-hh svg.bcc-hh')!.getAttribute('data-bac')).toBe('12')
    expect([...vd.querySelectorAll('.ddc-vinh-so > div')].map((x) => x.textContent)).toEqual(['Điểm chăm99/100', 'Chuỗi ngày12', 'Ngày đủ mức11/11'])
    expect([...vd.querySelectorAll('.ddc-vinh-sau li')].map((x) => x.textContent)).toEqual(['Chu Hải ChiBậc 10 · điểm chăm 88', 'Lê Minh AnBậc 10 · điểm chăm 85'])
  })

  it('em chưa xếp bậc có thẻ riêng (Mới · chưa có số), không huy hiệu bậc, không vạch điểm; vẫn bấm mở hồ sơ', () => {
    const p = props()
    render(<BanChieuDiemDanh {...p} />)
    const o = the()
    const moi = o.find((b) => tenThe(b) === 'Quách Gia Linh')!
    expect(moi.getAttribute('data-nhom')).toBe('moi')
    expect(moi.className).not.toContain('bcc')
    expect(moi.querySelector('svg.bcc-hh, .ddc-the-diem, .ddc-the-so')).toBeNull()
    expect(moi.querySelector('svg.ddc-hh-moi')).toBeTruthy()
    expect([moi.querySelector('.ddc-the-bac')!.textContent, ...[...moi.querySelectorAll('.ddc-the-dong')].map((x) => x.textContent)]).toEqual([
      'Chưa xếp bậc', 'Đã có số 1/3 ngày', 'Đủ 3 ngày sẽ có bậc',
    ])
    const ghep = o.find((b) => tenThe(b) === 'Phạm Hà')!
    expect(ghep.getAttribute('data-nhom')).toBe('chua-co')
    expect(ghep.querySelector('.ddc-the-bac')!.textContent).toBe('Điểm danh 17:56')
    expect(ghep.querySelector('.ddc-the-dong')!.textContent).toBe('Chưa có số nhịp học')
    fireEvent.click(ghep)
    expect(p.onMoEm).toHaveBeenCalledWith(expect.objectContaining({ sbd: 'F' }), ghep)
  })

  it('"Vừa vào": ba em vào muộn nhất có viền vàng + nhãn; lần đầu mở không nổi thẻ', () => {
    render(<BanChieuDiemDanh {...props()} />)
    const vua = the().filter((b) => b.hasAttribute('data-moi'))
    expect(vua.map(tenThe)).toEqual(['Hoàng Đức Duy', 'Quách Gia Linh', 'Phạm Hà'])
    expect(vua.every((b) => b.querySelector('.ddc-the-vua')!.textContent === 'Vừa vào')).toBe(true)
    expect(vua[0]!.getAttribute('title')).toBe('Hoàng Đức Duy · điểm danh lúc 17:54')
    expect(chieu().querySelector('.ddc-noi')).toBeNull()
  })

  it('em MỚI vào trong lượt làm mới ⇒ thẻ nổi "Vừa điểm danh" (bậc, ba số, câu lên bậc) ~4 giây rồi tự gỡ; thẻ khác mờ trong lúc nổi', () => {
    vi.useFakeTimers()
    const { rerender } = render(<BanChieuDiemDanh {...props()} />)
    const coMoi = [...CO_MAT, { sbd: 'H', hoTen: 'Phan Quang Huy', luc: luc(58), cach: 'ma' as const }]
    rerender(<BanChieuDiemDanh {...props({}, KQ, coMoi)} />)
    const noi = within(chieu()).getByRole('status', { name: /^Phan Quang Huy vừa điểm danh lúc 17:58/ })
    expect(noi.getAttribute('data-bac')).toBe('11')
    expect(noi.querySelector('.ddc-noi-nhan')!.textContent).toBe('Vừa điểm danh · 17:58')
    expect(noi.querySelector('.ddc-noi-bac')!.textContent).toBe('Bậc 11/12 · Chiến Thần Năng Suất')
    expect([...noi.querySelectorAll('.ddc-noi-so > span')].map((x) => x.textContent)).toEqual(['Điểm chăm93/100', 'Đủ mức11/11 ngày', 'Chuỗi đủ mức12 ngày liền'])
    expect(noi.querySelector('.ddc-noi-cau')!.textContent).toBe('Còn 5 điểm chăm nữa lên Bậc 12 · Thần Chăm Chỉ Tối Thượng')
    expect(noi.querySelector('.ddc-noi-ke svg.bcc-hh')!.getAttribute('data-bac')).toBe('12')
    expect(chieu().querySelector('.ddc-phai')!.hasAttribute('data-noi')).toBe(true)
    expect(the().filter((b) => b.hasAttribute('data-noi')).map(tenThe)).toEqual(['Phan Quang Huy'])
    // làm mới trả cùng danh sách ⇒ không nổi lại, thẻ vẫn giữ
    rerender(<BanChieuDiemDanh {...props({}, KQ, [...coMoi])} />)
    act(() => vi.advanceTimersByTime(GIU_THE_NOI_MS - 100))
    expect(chieu().querySelector('.ddc-noi')).toBeTruthy()
    act(() => vi.advanceTimersByTime(400))
    expect(chieu().querySelector('.ddc-noi')).toBeNull()
    expect(chieu().querySelector('.ddc-phai')!.hasAttribute('data-noi')).toBe(false)
  })

  it('giữ chức năng: mã buổi 6 số + QR, Có mặt x/y, Esc đóng, → và nút "Chiếu Nhịp học của lớp" sang bản B, bấm thẻ mở hồ sơ đúng em', () => {
    const p = props()
    render(<BanChieuDiemDanh {...p} />)
    expect(within(chieu()).getByText('482 915')).toBeTruthy()
    expect(within(chieu()).getByRole('img', { name: 'Mã QR điểm danh' })).toBeTruthy()
    expect(within(chieu()).getByRole('status', { name: 'Có mặt 7 trên 7 em' })).toBeTruthy()
    expect(document.activeElement?.textContent).toContain('Đóng')
    fireEvent.click(the()[0]!)
    expect(p.onMoEm).toHaveBeenCalledWith(expect.objectContaining({ sbd: 'B' }), the()[0])
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(p.onDoiCheDo).toHaveBeenCalledWith('nhip-lop')
    fireEvent.click(within(chieu()).getByRole('button', { name: 'Chiếu Nhịp học của lớp' }))
    expect(p.onDoiCheDo).toHaveBeenCalledTimes(2)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(p.onDong).toHaveBeenCalledTimes(1)
    // chân: luật điểm chăm + bậc
    expect(chieu().querySelector('.ddc-chan-luat')!.textContent).toContain('Lười bậc 1–5 (thoát khi đủ mức 6 ngày liền)')
  })

  it('mất kết nối vẫn hiện; tấm hồ sơ đang mở ⇒ không nghe phím', () => {
    const p = props({ matKetNoi: true, hoSoMo: true })
    render(<BanChieuDiemDanh {...p} />)
    expect(within(chieu()).getByRole('status', { name: /^Mất kết nối/ }).textContent).toContain('mất kết nối')
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(p.onDong).not.toHaveBeenCalled()
  })
})

describe('máy chủ cũ không có bacCham', () => {
  it('màn vẫn chạy: thẻ tô theo nhóm (không huy hiệu bậc), chip đếm nhóm, không thang / vinh danh, chú giải nhóm như cũ', () => {
    render(<BanChieuDiemDanh {...props({}, KQ_CU)} />)
    const o = the()
    expect(o.map(tenThe)).toEqual(['Vũ Thanh Bình', 'Chu Hải Chi', 'Lê Minh An', 'Đỗ Mai Giang', 'Hoàng Đức Duy', 'Quách Gia Linh', 'Phạm Hà'])
    expect(o.map((b) => b.getAttribute('data-nhom'))).toEqual(['cham', 'cham', 'cham', 'chua-deu', 'luoi', 'moi', 'chua-co'])
    expect(chieu().querySelector('svg.bcc-hh, .ddc-thang, .ddc-vinh, .ddc-the-diem')).toBeNull()
    expect(o[0]!.querySelector('.ddc-the-bac')!.textContent).toBe('Nhóm Chăm')
    expect([...o[4]!.querySelectorAll('.ddc-the-dong')].map((x) => x.textContent)).toEqual(['Đủ mức 0/11 ngày', 'Thoát Lười 0/6'])
    expect(o[5]!.querySelector('.ddc-the-bac')!.textContent).toBe('Mới vào lớp')
    expect([...chieu().querySelectorAll('.ddc-chip')].map((x) => x.textContent)).toEqual(['Chăm 3', 'Chưa đều 1', 'Lười 1', 'Mới 1', 'Chưa có số 1'])
    expect(chieu().querySelector('.ddc-chan')!.textContent).toContain('thoát khi đủ mức 6 ngày liền')
    expect(o[0]!.getAttribute('aria-label')).toBe('Vũ Thanh Bình, Chăm, đủ mức 11/11 ngày — mở hồ sơ làm bài')
  })

  it('chưa tải được Nhịp học ⇒ thẻ chỉ tên + giờ điểm danh, câu nói thật + Thử lại', () => {
    const p = props({ nhip: { kq: null, dangTai: false, loi: 'Máy chủ chưa có lệnh Nhịp học — cần đẩy bản máy chủ mới.' } })
    p.tk = thongKeBuoi(p.tt, nhipTheoSbd(null))
    render(<BanChieuDiemDanh {...p} />)
    const o = the()
    expect(o).toHaveLength(7)
    expect(o.every((b) => b.getAttribute('data-nhom') === 'chua-co' && !b.querySelector('.ddc-the-dong'))).toBe(true)
    expect(within(chieu()).getByText(/Chưa có nhóm Chăm \/ Lười: Máy chủ chưa có lệnh Nhịp học/)).toBeTruthy()
    fireEvent.click(within(chieu()).getByRole('button', { name: 'Thử lại' }))
    expect(p.onThuLaiNhip).toHaveBeenCalled()
  })
})
