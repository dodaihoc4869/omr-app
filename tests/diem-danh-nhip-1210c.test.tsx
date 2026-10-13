// ĐIỂM DANH + BẢN CHIẾU NHỊP HỌC (thầy 12/10 duyệt bản vẽ GV-DiemDanh · Main · ChieuNhipLop · ChieuHoSoEm). Kiểm:
//   · PHÉP THUẦN: nhóm em có mặt / vắng đếm đúng (em học ghép lớp khác, em không có số nhịp học, em mới vào lớp), em vắng đang Lười đứng trước;
//     ba cột Chăm (ngày đủ giảm dần) · Lười (tăng dần, kèm "bỏ N ngày liền"); hôm qua cả lớp đủ mức x/y · hôm nay z em;
//   · BƯỚC 1 trên màn thầy: ô mã + QR, "x/y em có mặt" + đếm nhóm, ô "Vắng N em — k em đang Lười", Vừa điểm danh (mới nhất trước) bấm em ⇒ tấm
//     Hồ sơ làm bài đúng SBD; GIỮ chức năng cũ: mở buổi (mở xong tự chiếu), thêm em tay, bớt em nhầm, kết thúc buổi;
//   · BẢN CHIẾU A: ô tên tô theo nhóm (em không có số ⇒ không màu nhóm), em vừa vào viền vàng, bấm tên ⇒ hồ sơ đúng SBD (Esc lúc tấm mở không đóng
//     bản chiếu); → sang bản chiếu B;
//   · BẢN CHIẾU B: ba cột xếp đúng, em vắng mờ + chữ "vắng", phím H ẩn / hiện tên Lười (mặc định hiện), → sang Gọi lên bảng đầu giờ, Esc đóng.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { EmNhipHoc } from '../server/src/nhip-hoc-kieu'

const { goi } = vi.hoisted(() => ({ goi: vi.fn() }))
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: (duong: string, body: Record<string, unknown>) => goi(duong, body) }))
vi.mock('../src/components/hop-thoai', () => ({ hoiXacNhan: async () => true }))
vi.mock('../src/components/chien-dich/HoSoLamCauEm', () => ({
  default: (p: { em: { sbd: string; ten: string; lop?: string; khoi: string | null }; onDong: () => void }) => (
    <div role="dialog" aria-label="Hồ sơ làm bài">
      <p>
        Giả: hồ sơ {p.em.ten} · {p.em.sbd} · {p.em.lop} · khối {String(p.em.khoi)}
      </p>
      <button type="button" onClick={p.onDong}>
        Đóng hồ sơ
      </button>
    </div>
  ),
}))

import { BuocDiemDanh, useDiemDanhBuoi } from '../src/components/day-hoc/DiemDanhBuoi'
import { cotNhipLop, demNhom, homQuaHomNay, khoaNhom, luoiDiemDanh, nhipTheoSbd, soNgayBo, thongKeBuoi, type EmBuoi } from '../src/lib/diem-danh-nhip'
import { gioDd } from '../src/lib/diem-danh-nhip'
import { dongMotCot } from '../src/components/day-hoc/BanChieuDiemDanh'
import { coLuoiThe } from '../src/components/day-hoc/chieu-bac'
import type { TrangThaiBuoi } from '../src/lib/buoi-hoc-api'
import type { KetQuaNhipHoc } from '../src/lib/nhip-hoc-thay'

// ---------------------------------------------------------------- dữ liệu: 12 ngày 01/10 → 12/10, hôm nay 12/10 (11 ngày đã qua)
const NGAY = Array.from({ length: 12 }, (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`)
const LAM: Record<string, number> = { d: 24, i: 14, k: 0, '-': 0 }
const em = (sbd: string, hoTen: string, ma: string, o: Partial<EmNhipHoc> = {}): EmNhipHoc => ({
  sbd, hoTen, lop: '12A1', khoi: '12', ngayVao: '2026-10-01', muc: NGAY.map(() => 24), lam: ma.split(' ').map((c) => LAM[c]!), doiPho: null, ...o,
})
const NHIP: KetQuaNhipHoc = {
  ok: true, tu: '2026-10-01', den: '2026-10-12', homNay: '2026-10-12', ngay: NGAY, lop: [], doiPhoDaTinh: { quaNhanh: true, chonLap: true }, canhBao: [],
  em: [
    em('S1', 'Nguyễn Minh Anh', 'd d d d d d d d d d d d'), // Chăm 11/11, hôm nay đủ
    em('S2', 'Trần Gia Bảo', 'd d d d d d d d d i d i'), // Chăm 10/11
    em('S3', 'Đỗ Mai Phương', 'd i d i d i d i d i d k'), // Chưa đều 6/11
    em('S4', 'Hoàng Đức Huy', 'k k k k k k k k k k k k'), // Lười 0/11, bỏ 11 ngày liền
    em('S5', 'Bùi Quang Minh', 'd k k k k d d k k k k k'), // Lười 3/11, bỏ 4 ngày liền — VẮNG
    em('S6', 'Trịnh Bảo Ngọc', 'i d k k k i i i i i d d'), // Lười 2/11, bỏ 3 ngày liền — VẮNG
    em('S7', 'Lê Khánh Vy', 'd d d d d d d d d d d d'), // Chăm 11/11 — VẮNG
    em('S8', 'Quách Gia Linh', '- - - - - - - - - - d d', { ngayVao: '2026-10-11' }), // Mới (1 ngày đã qua)
  ],
}
const BUOI = { id: 'BH-12', ten: 'Buổi học 12/10 · 12A1', lop: '12A1', moLuc: '2026-10-12T10:50:00Z', hetHan: '2026-10-13T10:50:00Z', dongLuc: null, dangMo: true }
const LOP = [
  ['S1', 'Nguyễn Minh Anh'], ['S2', 'Trần Gia Bảo'], ['S3', 'Đỗ Mai Phương'], ['S4', 'Hoàng Đức Huy'], ['S5', 'Bùi Quang Minh'],
  ['S6', 'Trịnh Bảo Ngọc'], ['S7', 'Lê Khánh Vy'], ['S8', 'Quách Gia Linh'], ['S10', 'Hà Minh Khang'],
].map(([sbd, hoTen]) => ({ sbd: sbd!, hoTen: hoTen!, tenLop: '12A1' }))
const LOP_EM = [...LOP, { sbd: 'S9', hoTen: 'Phạm Hà', tenLop: '12 - Tinh Hoa' }]
// có mặt: S1 → S4 đến lần lượt 10:53 … ; S9 học ghép lớp khác, không có số nhịp học
const luc = (phut: number) => `2026-10-12T10:${String(phut).padStart(2, '0')}:00Z`
const CO_MAT = [
  { sbd: 'S1', hoTen: 'Nguyễn Minh Anh', luc: luc(53), cach: 'ma' as const },
  { sbd: 'S2', hoTen: 'Trần Gia Bảo', luc: luc(54), cach: 'ma' as const },
  { sbd: 'S3', hoTen: 'Đỗ Mai Phương', luc: luc(55), cach: 'ma' as const },
  { sbd: 'S9', hoTen: 'Phạm Hà', luc: luc(56), cach: 'thay' as const },
  { sbd: 'S8', hoTen: 'Quách Gia Linh', luc: luc(57), cach: 'ma' as const },
  { sbd: 'S4', hoTen: 'Hoàng Đức Huy', luc: luc(58), cach: 'ma' as const },
]
const TT: TrangThaiBuoi = { buoi: BUOI, ma: '482915', doiMaLuc: 1, coMat: CO_MAT, siSo: 9, lopEm: LOP_EM }

const ten = (ds: readonly EmBuoi[]) => ds.map((e) => e.sbd)

describe('phép thuần: nhóm em có mặt / vắng', () => {
  const bang = nhipTheoSbd(NHIP)
  const tk = thongKeBuoi(TT, bang)
  it('em của buổi = lớp của buổi ∪ em có mặt (học ghép); nhóm theo nhip-hoc-thay; không có số ⇒ "chưa có số"', () => {
    expect(ten(tk.ds)).toEqual(['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S10', 'S9'])
    expect(tk.ds.map(khoaNhom)).toEqual(['cham', 'cham', 'chua-deu', 'luoi', 'luoi', 'luoi', 'cham', 'moi', 'chua-co', 'chua-co'])
    expect(tk.ds.find((e) => e.sbd === 'S9')).toMatchObject({ coMat: true, lop: '12 - Tinh Hoa', nhip: null })
  })
  it('đếm nhóm TRONG em có mặt và của cả lớp; em vắng đang Lười đứng trước (ngày đủ tăng dần), rồi theo tên', () => {
    expect(tk.demCoMat).toEqual({ tong: 6, cham: 2, chuaDeu: 1, luoi: 1, moi: 1, chuaCo: 1 })
    expect(tk.demLop).toEqual({ tong: 10, cham: 3, chuaDeu: 1, luoi: 3, moi: 1, chuaCo: 2 })
    expect(ten(tk.vang)).toEqual(['S6', 'S5', 'S10', 'S7'])
    expect(tk.vangLuoi).toBe(2)
    // có mặt: vừa điểm danh đứng trước
    expect(ten(tk.coMat)).toEqual(['S4', 'S8', 'S9', 'S3', 'S2', 'S1'])
    // lưới bản chiếu A: theo nhóm, trong nhóm theo giờ đến
    expect(ten(luoiDiemDanh(tk.coMat))).toEqual(['S1', 'S2', 'S3', 'S4', 'S8', 'S9'])
  })
  it('buổi "Mọi lớp" ⇒ không tính vắng; chưa có Nhịp học ⇒ mọi em "chưa có số"', () => {
    const moi = thongKeBuoi({ ...TT, buoi: { ...BUOI, lop: '' } }, bang)
    expect(moi.vang).toEqual([])
    expect(ten(moi.ds)).toEqual(['S1', 'S2', 'S3', 'S9', 'S8', 'S4'])
    expect(demNhom(thongKeBuoi(TT, nhipTheoSbd(null)).coMat)).toEqual({ tong: 6, cham: 0, chuaDeu: 0, luoi: 0, moi: 0, chuaCo: 6 })
  })
  it('ba cột: Chăm ngày đủ giảm dần · Lười tăng dần (cùng số ⇒ bỏ liền dài hơn trước) kèm số ngày bỏ liền; Mới + chưa có số không vào cột', () => {
    const c = cotNhipLop(tk.ds)
    expect(ten(c.cham)).toEqual(['S7', 'S1', 'S2'])
    expect(ten(c.chuaDeu)).toEqual(['S3'])
    expect(ten(c.luoi)).toEqual(['S4', 'S6', 'S5'])
    expect(c.luoi.map((e) => soNgayBo(e.nhip))).toEqual([11, 3, 4])
    expect(ten(c.khac)).toEqual(['S8', 'S10', 'S9'])
  })
  it('co giãn theo khổ: lưới tên A thêm cột khi đông em; cột B tách đôi khi quá số dòng cao ≥ 44 px vừa khung; giờ điểm danh theo giờ Việt Nam', () => {
    // SỬA CÓ CHỦ ĐÍCH 13/10 (đợt 19 làn Q — lưới THẺ em theo bậc): ≤ 30 em 5 cột thẻ đủ · 31–48 em 6 cột thẻ gọn · nhiều hơn 7 cột
    expect([30, 31, 48, 49, 60].map((n) => coLuoiThe(n).cot)).toEqual([5, 6, 6, 7, 7])
    expect([dongMotCot(1920, 1080), dongMotCot(1280, 720), dongMotCot(3840, 2160)]).toEqual([12, 8, 12])
    expect(gioDd('2026-10-12T10:58:00Z')).toBe('17:58')
    expect(gioDd('hỏng')).toBe('')
  })
  it('chân bản chiếu B: hôm qua cả lớp đủ mức 6/8 (em có số, đã vào học) · hôm nay đã có 4 em đủ mức', () => {
    expect(homQuaHomNay(tk.ds, NHIP)).toEqual({ homQua: { du: 6, tong: 8 }, homNayDu: 4 })
    expect(homQuaHomNay(tk.ds, null)).toEqual({ homQua: null, homNayDu: null })
  })
})

// ---------------------------------------------------------------- giao diện
let coBuoi = true
let tt: TrangThaiBuoi = TT
function mayChu() {
  goi.mockImplementation(async (duong: string, b: Record<string, unknown>) => {
    if (duong === '/gv/lop') return { ok: true, du: { ok: true, lop: [{ tenLop: '12A1', khoi: '12', soEm: 9, sbd: [] }] } }
    if (duong === '/gv/nhip-hoc') return { ok: true, du: NHIP as unknown as Record<string, unknown> }
    if (duong === '/gv/buoi-hoc') {
      if (b.action === 'dang-mo') return { ok: true, du: { ok: true, buoi: coBuoi ? [BUOI] : [] } }
      if (b.action === 'mo') {
        coBuoi = true
        return { ok: true, du: { ok: true, ...TT } }
      }
      if (b.action === 'bot-em') tt = { ...tt, coMat: tt.coMat.filter((e) => e.sbd !== b.sbd) }
      if (b.action === 'them-em') tt = { ...tt, coMat: [...tt.coMat, ...(b.sbd as string[]).map((s) => ({ sbd: s, hoTen: LOP_EM.find((e) => e.sbd === s)!.hoTen, luc: luc(59), cach: 'thay' as const }))] }
      if (b.action === 'dong') tt = { ...tt, buoi: { ...tt.buoi, dangMo: false }, ma: null }
      return { ok: true, du: { ok: true, ...tt, lopEm: b.kemLop ? tt.lopEm : null } }
    }
    return { ok: false, loai: 'chua_co_lenh', chu: 'lệnh lạ' }
  })
}
const lenh = (duong: string, action?: string) => goi.mock.calls.filter(([d, b]) => d === duong && (action === undefined || (b as Record<string, unknown>).action === action))

function Khung({ onSang }: { onSang?: () => void }) {
  const dd = useDiemDanhBuoi()
  return <BuocDiemDanh dd={dd} soBuoc={1} idTieuDe="bd-b1" thanh onSangDauGio={onSang} />
}
const veBuoc1 = async (onSang?: () => void) => {
  const r = render(<Khung onSang={onSang} />)
  await screen.findByText('Vắng 4 em — 2 em đang Lười')
  return r
}

beforeEach(() => {
  goi.mockReset()
  coBuoi = true
  tt = TT
  mayChu()
})
afterEach(() => {
  cleanup()
})

describe('bước 1 Điểm danh (bản vẽ GV-DiemDanh)', () => {
  it('ô mã + QR · x/y em có mặt + đếm nhóm trong em có mặt · ô vắng có em Lười trước · Vừa điểm danh mới nhất trước; MỘT lệnh Nhịp học', async () => {
    const { container } = await veBuoc1()
    expect(screen.getByRole('heading', { level: 2, name: 'Điểm danh — việc đầu tiên của buổi' })).toBeTruthy()
    const ma = container.querySelector<HTMLElement>('[data-khoi="ma-buoi"]')!
    expect(within(ma).getByText('482 915')).toBeTruthy()
    expect(within(ma).getByRole('img', { name: 'Mã QR điểm danh' })).toBeTruthy()
    const coMat = container.querySelector<HTMLElement>('[data-khoi="co-mat"]')!
    expect(coMat.querySelector('.dd1-co-mat-so')?.textContent).toBe('6/9 em có mặt · 12A1')
    expect(within(coMat).getByRole('img', { name: 'Có mặt 6 trên 9 em' })).toBeTruthy()
    expect([...coMat.querySelectorAll('.dd1-dem-nhom .dd1-chip')].map((x) => x.textContent)).toEqual(['Chăm 2', 'Chưa đều 1', 'Lười 1', 'Mới 1', 'Chưa có số 1'])
    const vang = container.querySelector<HTMLElement>('[data-khoi="em-vang"]')!
    expect(vang.querySelector('.dd1-vang-ten')?.textContent).toBe('Trịnh Bảo Ngọc · Bùi Quang Minh')
    fireEvent.click(within(vang).getByRole('button', { name: 'Xem 2 em vắng còn lại ›' }))
    expect(vang.querySelector('.dd1-vang-ten')?.textContent).toBe('Trịnh Bảo Ngọc · Bùi Quang Minh · Hà Minh Khang · Lê Khánh Vy')
    const vua = within(screen.getByRole('list', { name: /Em vừa điểm danh/ })).getAllByRole('button')
    expect(vua.map((b) => b.querySelector('.dd1-vua-ten')?.textContent)).toEqual(['Hoàng Đức Huy', 'Quách Gia Linh', 'Phạm Hà', 'Đỗ Mai Phương', 'Trần Gia Bảo', 'Nguyễn Minh Anh'])
    expect(vua.map((b) => b.querySelector('.dd1-chip')?.textContent)).toEqual(['Lười · 0/11', 'Mới', 'Chưa có số', 'Chưa đều · 6/11', 'Chăm · 10/11', 'Chăm · 11/11'])
    expect(vua[0]!.querySelector('.dd1-vua-gio')?.textContent).toBe(gioDd(luc(58)))
    expect(screen.getByRole('button', { name: 'Xong điểm danh · chiếu Nhịp học của lớp' }).className).toContain('m3-nut-chinh')
    expect(lenh('/gv/nhip-hoc')).toHaveLength(1)
  })

  it('bấm em ở Vừa điểm danh ⇒ CHÍNH tấm Hồ sơ làm bài đúng SBD; đóng tấm ⇒ focus về đúng dòng', async () => {
    await veBuoc1()
    const dong = screen.getByRole('button', { name: /^Đỗ Mai Phương, Chưa đều, đủ mức 6\/11 ngày — mở hồ sơ làm bài/ })
    fireEvent.click(dong)
    const ho = await screen.findByRole('dialog', { name: 'Hồ sơ làm bài' })
    expect(ho.textContent).toContain('Giả: hồ sơ Đỗ Mai Phương · S3 · 12A1 · khối 12')
    fireEvent.click(within(ho).getByRole('button', { name: 'Đóng hồ sơ' }))
    expect(screen.queryByRole('dialog', { name: 'Hồ sơ làm bài' })).toBeNull()
    expect(document.activeElement).toBe(dong)
  })

  it('giữ chức năng cũ: thêm em tay · bớt em nhầm · kết thúc buổi', async () => {
    await veBuoc1()
    fireEvent.click(screen.getByRole('button', { name: 'Thêm em tay' }))
    const them = screen.getByRole('group', { name: 'Thêm em chưa điểm danh được' })
    fireEvent.click(within(them).getByRole('checkbox', { name: /Bùi Quang Minh/ }))
    fireEvent.click(within(them).getByRole('button', { name: 'Thêm 1 em vào danh sách có mặt' }))
    await waitFor(() => expect(lenh('/gv/buoi-hoc', 'them-em').map(([, b]) => (b as Record<string, unknown>).sbd)).toEqual([['S5']]))
    await screen.findByText('Vắng 3 em — 1 em đang Lười')
    // bớt em: danh sách có mặt gập sẵn
    fireEvent.click(screen.getByText(/^Xem danh sách em có mặt \(7 em\)/))
    fireEvent.click(screen.getByRole('button', { name: 'Bớt Hoàng Đức Huy khỏi danh sách có mặt' }))
    await waitFor(() => expect(lenh('/gv/buoi-hoc', 'bot-em')).toHaveLength(1))
    await screen.findByText('Vắng 4 em — 2 em đang Lười')
    fireEvent.click(screen.getByRole('button', { name: 'Kết thúc buổi' }))
    await waitFor(() => expect(lenh('/gv/buoi-hoc', 'dong')).toHaveLength(1))
    expect(await screen.findByText('Đã kết thúc')).toBeTruthy()
    expect(screen.getByText('Buổi đã kết thúc — mã hết hiệu lực')).toBeTruthy()
    // buổi đã kết thúc ⇒ lại có ô mở buổi mới (nút chính "Điểm danh")
    expect(screen.getByRole('button', { name: 'Điểm danh' })).toBeTruthy()
  })

  it('chưa có buổi: "Điểm danh" mở buổi rồi TỰ CHIẾU bản chiếu đang điểm danh (không còn tấm chiếu mã cũ)', async () => {
    coBuoi = false
    render(<Khung />)
    fireEvent.click(await screen.findByRole('button', { name: 'Điểm danh' }))
    const chieu = await screen.findByRole('dialog', { name: 'Bản chiếu điểm danh' })
    expect(lenh('/gv/buoi-hoc', 'mo')).toHaveLength(1)
    expect(within(chieu).getByText('482 915')).toBeTruthy()
    expect(screen.queryByRole('dialog', { name: 'Chiếu mã điểm danh' })).toBeNull()
  })
})

describe('bản chiếu A — đang điểm danh', () => {
  it('ô tên tô theo nhóm + "đủ mức x/y ngày"; em không có số ⇒ không màu nhóm; em vừa vào viền vàng; bấm tên ⇒ hồ sơ đúng SBD; Esc lúc tấm mở không đóng bản chiếu', async () => {
    await veBuoc1()
    fireEvent.click(screen.getByRole('button', { name: 'Chiếu điểm danh' }))
    const chieu = await screen.findByRole('dialog', { name: 'Bản chiếu điểm danh' })
    expect(within(chieu).getByText('ĐIỂM DANH ĐẦU GIỜ')).toBeTruthy()
    expect(within(chieu).getByRole('status', { name: 'Có mặt 6 trên 9 em' })).toBeTruthy()
    expect(within(chieu).getByRole('img', { name: 'Mã QR điểm danh' })).toBeTruthy()
    const o = within(within(chieu).getByRole('list', { name: 'Bấm tên em để mở hồ sơ làm bài' })).getAllByRole('button')
    // SỬA CÓ CHỦ ĐÍCH 13/10 (đợt 19 làn Q — ô tên ⇒ THẺ em: dòng nhóm + "Đủ mức x/y ngày" riêng; máy chủ này chưa gửi bậc nên thẻ tô theo nhóm
    // như cũ; nhãn "Vừa vào" + viền vàng cho BA em vào muộn nhất theo bản vẽ thầy duyệt, không còn một em)
    expect(
      o.map((b) => [b.querySelector('b')?.textContent, b.getAttribute('data-nhom'), b.querySelector('.ddc-em-chu span')?.textContent, b.querySelector('.ddc-the-dong')?.textContent ?? null]),
    ).toEqual([
      ['Nguyễn Minh Anh', 'cham', 'Nhóm Chăm', 'Đủ mức 11/11 ngày'],
      ['Trần Gia Bảo', 'cham', 'Nhóm Chăm', 'Đủ mức 10/11 ngày'],
      ['Đỗ Mai Phương', 'chua-deu', 'Nhóm Chưa đều', 'Đủ mức 6/11 ngày'],
      ['Hoàng Đức Huy', 'luoi', 'Nhóm Lười', 'Đủ mức 0/11 ngày'],
      ['Quách Gia Linh', 'moi', 'Mới vào lớp', 'Đã có số 1/3 ngày'],
      ['Phạm Hà', 'chua-co', `Điểm danh ${gioDd(luc(56))}`, 'Chưa có số nhịp học'],
    ])
    expect(o.filter((b) => b.hasAttribute('data-moi')).map((b) => b.querySelector('b')?.textContent)).toEqual(['Hoàng Đức Huy', 'Quách Gia Linh', 'Phạm Hà'])
    expect([...chieu.querySelectorAll('.ddc-chip')].map((x) => x.textContent)).toEqual(['Chăm 2', 'Chưa đều 1', 'Lười 1', 'Mới 1', 'Chưa có số 1'])
    expect(chieu.querySelector('.ddc-chan')?.textContent).toContain('thoát khi đủ mức 6 ngày liền')
    fireEvent.click(o[3]!)
    const ho = await screen.findByRole('dialog', { name: 'Hồ sơ làm bài' })
    expect(ho.textContent).toContain('S4')
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.getByRole('dialog', { name: 'Bản chiếu điểm danh' })).toBeTruthy()
    fireEvent.click(within(ho).getByRole('button', { name: 'Đóng hồ sơ' }))
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: 'Bản chiếu điểm danh' })).toBeNull()
  })

  it('phím → ⇒ bản chiếu Nhịp học của lớp (đọc lại Nhịp học)', async () => {
    await veBuoc1()
    fireEvent.click(screen.getByRole('button', { name: 'Chiếu điểm danh' }))
    await screen.findByRole('dialog', { name: 'Bản chiếu điểm danh' })
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(await screen.findByRole('dialog', { name: 'Bản chiếu nhịp học của lớp 12A1' })).toBeTruthy()
    await waitFor(() => expect(lenh('/gv/nhip-hoc')).toHaveLength(2))
  })
})

describe('bản chiếu B — Nhịp học của lớp', () => {
  it('thanh nhóm cả lớp · ba cột xếp đúng · em vắng mờ + "vắng" · Lười kèm "bỏ N ngày liền" · chân hôm qua / hôm nay', async () => {
    await veBuoc1()
    fireEvent.click(screen.getByRole('button', { name: 'Xong điểm danh · chiếu Nhịp học của lớp' }))
    const chieu = await screen.findByRole('dialog', { name: 'Bản chiếu nhịp học của lớp 12A1' })
    expect(within(chieu).getByText('NHỊP HỌC 12A1')).toBeTruthy()
    expect(within(chieu).getByText('Từ 01/10 đến 11/10 · 11 ngày đã qua')).toBeTruthy()
    expect(within(chieu).getByRole('img', { name: 'Chăm 3 em · 30% · Chưa đều 1 · 10% · Lười 3 em · 30% · 3 em mới vào lớp hoặc chưa có số' })).toBeTruthy()
    const cot = (k: string) => [...chieu.querySelectorAll(`.ddc-cot[data-nhom="${k}"] .ddc-dong-em`)]
    const chu = (k: string) => cot(k).map((b) => [b.querySelector('.ddc-dong-ten')?.textContent, b.querySelector('.ddc-dong-so')?.textContent, b.hasAttribute('data-vang')])
    expect(chu('cham')).toEqual([
      ['Lê Khánh Vy', '11/11', true],
      ['Nguyễn Minh Anh', '11/11', false],
      ['Trần Gia Bảo', '10/11', false],
    ])
    expect(chu('chua-deu')).toEqual([['Đỗ Mai Phương', '6/11', false]])
    expect(chu('luoi')).toEqual([
      ['Hoàng Đức Huy', '0/11 · bỏ 11 ngày liền', false],
      ['Trịnh Bảo Ngọc', '2/11 · bỏ 3 ngày liền', true],
      ['Bùi Quang Minh', '3/11 · bỏ 4 ngày liền', true],
    ])
    expect(cot('cham')[0]!.querySelector('.ddc-vang-chu')?.textContent).toBe('vắng')
    expect(chieu.querySelector('.ddc-cot[data-nhom="cham"] .ddc-cot-dk')?.textContent).toBe('đủ mức ≥ 9/11 ngày')
    expect(chieu.querySelector('.ddc-chan-so')?.textContent).toBe('Hôm qua cả lớp 6/8 em đủ mức · hôm nay đã có 4 em đủ mức')
  })

  it('bấm tên (kể cả em vắng) ⇒ hồ sơ đúng SBD; phím H ẩn / hiện tên nhóm Lười (mặc định hiện); → sang Gọi lên bảng đầu giờ; Esc đóng', async () => {
    const sang = vi.fn()
    await veBuoc1(sang)
    fireEvent.click(screen.getByRole('button', { name: 'Xong điểm danh · chiếu Nhịp học của lớp' }))
    const chieu = await screen.findByRole('dialog', { name: 'Bản chiếu nhịp học của lớp 12A1' })
    fireEvent.click(within(chieu).getByRole('button', { name: /^Bùi Quang Minh, vắng, Lười, đủ mức 3\/11 ngày — mở hồ sơ làm bài, bỏ 4 ngày liền$/ }))
    const ho = await screen.findByRole('dialog', { name: 'Hồ sơ làm bài' })
    expect(ho.textContent).toContain('Giả: hồ sơ Bùi Quang Minh · S5 · 12A1 · khối 12')
    fireEvent.keyDown(window, { key: 'h' })
    expect(within(chieu).getByText('Bùi Quang Minh')).toBeTruthy() // tấm hồ sơ mở ⇒ bản chiếu không nghe phím
    fireEvent.click(within(ho).getByRole('button', { name: 'Đóng hồ sơ' }))
    // H ẩn tên nhóm Lười — thanh nhóm vẫn đếm
    act(() => {
      fireEvent.keyDown(window, { key: 'h' })
    })
    expect(chieu.querySelector('[data-khoi="luoi-da-an"]')?.textContent).toBe('Đã ẩn tên 3 em — bấm H để hiện')
    expect(within(chieu).queryByText('Bùi Quang Minh')).toBeNull()
    expect(within(chieu).getByRole('button', { name: /Hiện tên nhóm Lười/ }).getAttribute('aria-pressed')).toBe('true')
    fireEvent.keyDown(window, { key: 'H' })
    expect(within(chieu).getByText('Bùi Quang Minh')).toBeTruthy()
    // → sang Gọi lên bảng đầu giờ (bản chiếu đóng, cha cuộn + bấm bước 2)
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(sang).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog', { name: /Bản chiếu/ })).toBeNull()
    // mở lại rồi Esc đóng
    fireEvent.click(screen.getByRole('button', { name: 'Xong điểm danh · chiếu Nhịp học của lớp' }))
    await screen.findByRole('dialog', { name: 'Bản chiếu nhịp học của lớp 12A1' })
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: /Bản chiếu/ })).toBeNull()
  })

  it('máy chủ chưa có lệnh Nhịp học ⇒ tên vẫn hiện (không màu nhóm) ở bản chiếu A; bản chiếu B nói thật + Thử lại', async () => {
    goi.mockImplementation(async (duong: string, b: Record<string, unknown>) => {
      if (duong === '/gv/nhip-hoc') return { ok: false, loai: 'chua_co_lenh', chu: 'Máy chủ chưa có lệnh Nhịp học — cần đẩy bản máy chủ mới.' }
      if (duong === '/gv/buoi-hoc' && b.action === 'dang-mo') return { ok: true, du: { ok: true, buoi: [BUOI] } }
      if (duong === '/gv/buoi-hoc') return { ok: true, du: { ok: true, ...TT } }
      return { ok: false, loai: 'chua_co_lenh', chu: 'lệnh lạ' }
    })
    render(<Khung />)
    await screen.findByText(/Chưa có nhóm Chăm \/ Lười: Máy chủ chưa có lệnh Nhịp học/)
    expect(screen.getByText('Vắng 4 em')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Chiếu điểm danh' }))
    const a = await screen.findByRole('dialog', { name: 'Bản chiếu điểm danh' })
    const o = within(within(a).getByRole('list', { name: 'Bấm tên em để mở hồ sơ làm bài' })).getAllByRole('button')
    expect(o).toHaveLength(6)
    expect(o.every((b) => b.getAttribute('data-nhom') === 'chua-co')).toBe(true)
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    const b = await screen.findByRole('dialog', { name: 'Bản chiếu nhịp học của lớp 12A1' })
    expect(await within(b).findByText(/Chưa tải được nhịp học của lớp: Máy chủ chưa có lệnh Nhịp học/)).toBeTruthy()
    expect(within(b).getByRole('button', { name: 'Thử lại' })).toBeTruthy()
  })
})
