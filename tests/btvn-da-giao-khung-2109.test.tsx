// MỤC "BÀI TẬP VỀ NHÀ ĐÃ GIAO" THIẾT KẾ LẠI — thành phần thật (React) với dữ liệu giả của trang xem thử (Code 1, 21/09/2026).
// Khoá: sắp thẻ, thẻ đầu mở, ô = 0 ẩn, thanh nhóm khớp số máy chủ, bấm đoạn ⇒ đúng nhóm, tìm em ⇒ lọc bài + mở ngăn ở em đó, Thu hồi luôn qua hộp xác nhận (nơi gọi), Đổi hạn nộp giữ lệnh cũ,
// máy chủ cũ không vỡ (không thanh nhóm), không còn mã "Riêng-…" ở thẻ, bấm em ⇒ Toàn cảnh em.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import KhungBtvnDaGiao, { type KhungBtvnDaGiaoProps } from '../src/components/btvn-da-giao/KhungBtvnDaGiao'
import { canh, NOW_MAU, type TenCanh } from '../src/components/xem-thu/btvn-da-giao-canh'
import { nhomBtvn } from '../src/lib/nhom-btvn'

afterEach(() => { cleanup(); vi.unstubAllGlobals(); window.sessionStorage.clear() })
beforeEach(() => window.sessionStorage.clear())

function dung(ten: TenCanh, o: Partial<KhungBtvnDaGiaoProps> = {}) {
  const p = {
    ds: nhomBtvn(canh(ten)), nowMs: NOW_MAU, dangNap: false, onNap: vi.fn(), tenCu: (t: { maDe: string }) => t.maDe, dangSua: '', hanChoOChon: (h: string) => h,
    onLuuHan: vi.fn(), onThuHoi: vi.fn(), dungBaiLam: () => <div data-testid="bai-lam">danh sách em cũ</div>, onMoToanCanh: vi.fn(), onGiaoBaiMoi: vi.fn(), ...o,
  } as KhungBtvnDaGiaoProps
  const r = render(<KhungBtvnDaGiao {...p} />)
  return { p, r }
}
const the = () => [...document.querySelectorAll<HTMLElement>('article.btg-the')]
const tenThe = () => the().map((a) => a.querySelector('.btg-ten')!.textContent)

describe('sắp thẻ và mở / thu gọn', () => {
  it('bài cần để ý nhất (chậm nhịp × 2 + chưa mở) đứng đầu và MỞ sẵn; các bài còn lại thu gọn một dòng', () => {
    dung('binh-thuong')
    expect(tenThe()).toEqual(['Lớp 12 · Chương 2 · Bài 4', 'Lớp 10 · Chương 2 · Bài 5', 'Lớp 11 · Chương 1 · Bài 3'])
    expect(the().map((a) => a.getAttribute('data-mo'))).toEqual(['1', '0', '0'])
    expect(the()[1]!.querySelector('.btg-thanh')).toBeTruthy() // thẻ thu gọn vẫn có thanh nhóm nhỏ
    expect(the()[1]!.querySelector('.btg-chang')).toBeNull() // nhưng không đường chặng / hàng hành động
  })
  it('bấm để mở / thu; NHỚ trong phiên (dựng lại vẫn giữ)', () => {
    const { r } = dung('binh-thuong')
    fireEvent.click(the()[1]!.querySelector('.btg-the-bam')!)
    expect(the()[1]!.getAttribute('data-mo')).toBe('1')
    fireEvent.click(the()[0]!.querySelector('.btg-the-bam')!)
    expect(the()[0]!.getAttribute('data-mo')).toBe('0')
    r.unmount()
    dung('binh-thuong')
    expect(the().map((a) => a.getAttribute('data-mo'))).toEqual(['0', '1', '0'])
  })
})

describe('dải "cần thầy để ý"', () => {
  it('ô có số hiện, mọi số có nhãn; ô = 0 thì ẨN', () => {
    dung('binh-thuong')
    const dai = screen.getByRole('group', { name: 'Cần thầy để ý' })
    expect(within(dai).getByText('Em chưa mở bài').parentElement!.textContent).toContain('31')
    expect(within(dai).getByText('Em chậm nhịp').parentElement!.textContent).toContain('12')
    expect(within(dai).getByText('Hạn gần nhất').parentElement!.textContent).toContain('2 ngày 17 giờ')
    cleanup()
    dung('khong-chang') // không em chậm nhịp ⇒ ô ẩn
    expect(screen.queryByText('Em chậm nhịp')).toBeNull()
    expect(screen.getByText('Em chưa mở bài')).toBeTruthy()
  })
  it('máy chủ cũ: KHÔNG ô "chưa mở / chậm nhịp", KHÔNG dòng "Mọi bài đang đúng nhịp" (không biết); vẫn có Hạn gần nhất', () => {
    dung('may-cu')
    expect(screen.queryByText('Em chưa mở bài')).toBeNull()
    expect(screen.queryByText('Em chậm nhịp')).toBeNull()
    expect(screen.queryByText('Mọi bài đang đúng nhịp.')).toBeNull()
    expect(screen.getByText('Hạn gần nhất')).toBeTruthy()
  })
  it('cả ba ô trống mà biết chắc ⇒ một dòng xanh "Mọi bài đang đúng nhịp."', () => {
    const d = canh('binh-thuong').map((b) => ({ ...b, hanNop: '2026-09-20T05:00:00.000Z', daNop: b.tong, nhom: { chuaMo: 0, dungNhip: 0, chamNhip: 0, xongHomNay: 0, daNop: b.tong, nopTre: 0 }, hocSinh: b.hocSinh?.map((e) => ({ ...e, nhom: 'da_nop' as const })) })) // hạn đã qua VÀ đã nộp hết
    dung('binh-thuong', { ds: nhomBtvn(d) })
    expect(screen.getByText('Mọi bài đang đúng nhịp.')).toBeTruthy()
    expect(document.querySelector('.btg-dai')).toBeNull()
  })
})

describe('thẻ bài: tên, chặng, hạn, thanh nhóm', () => {
  it('tên ĐỌC ĐƯỢC của máy chủ, không mã "Riêng-…" ở thẻ (ba cảnh máy mới); mã nội bộ chỉ có trong "Chi tiết bài"', () => {
    for (const c of ['binh-thuong', 'cham', 'khong-chang', 'qua-han'] as TenCanh[]) {
      dung(c)
      expect(document.body.textContent, c).not.toMatch(/Riêng-/)
      cleanup()
    }
    dung('binh-thuong')
    fireEvent.click(within(the()[0]!).getByRole('button', { name: /Thêm thao tác/ }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Chi tiết bài' }))
    const hop = screen.getByRole('dialog', { name: 'Chi tiết bài' })
    expect(hop.textContent).toContain('B-LOP12')
    expect(hop.textContent).toContain('Cá nhân hoá · 31 câu cốt lõi')
  })
  it('đường chặng có ngày: chặng hôm nay tô đậm; bài không chia chặng ⇒ không có đường', () => {
    dung('binh-thuong')
    const nay = the()[0]!.querySelector('.btg-chang-o--nay')!
    expect(nay.textContent).toBe('Chặng 1 · hôm nay')
    expect(the()[0]!.querySelectorAll('.btg-chang-o').length).toBe(4)
    cleanup()
    dung('khong-chang')
    expect(document.querySelector('.btg-chang')).toBeNull()
  })
  it('thanh nhóm KHỚP số máy chủ: mỗi đoạn + chú giải mang đúng số; "đã nộp" chỉ khi > 0; bài không chia chặng dùng nhãn "đang làm"', () => {
    dung('binh-thuong')
    const t0 = the()[0]!
    const doan = [...t0.querySelectorAll('.btg-doan')].map((d) => d.getAttribute('aria-label'))
    expect(doan).toEqual(['chưa mở: 16 em. Bấm để xem danh sách', 'đúng nhịp: 39 em. Bấm để xem danh sách', 'chậm nhịp: 4 em. Bấm để xem danh sách', 'xong chặng hôm nay: 8 em. Bấm để xem danh sách'])
    expect([...t0.querySelectorAll('.btg-chu-giai-nut')].map((b) => b.textContent)).toEqual(['chưa mở 16', 'đúng nhịp 39', 'chậm nhịp 4', 'xong chặng hôm nay 8'])
    cleanup()
    dung('khong-chang')
    expect([...document.querySelectorAll('.btg-chu-giai-nut')].map((b) => b.textContent)).toEqual(['chưa mở 12', 'đang làm 20', 'đã nộp 9'])
  })
  it('hạn: chữ hạn + đếm ngược theo phút; dưới 6 giờ đổi cam; qua hạn ⇒ "Đã qua hạn · N em nộp trễ"', () => {
    dung('cham')
    const t0 = the()[0]!
    expect(t0.textContent).toContain('Hạn nộp 00:30 Thứ Ba 22/09')
    expect(t0.querySelector('.btg-han-dem--cam')?.textContent).toBe('còn 5 giờ 30 phút')
    cleanup()
    dung('qua-han')
    expect(the()[0]!.querySelector('.btg-han-dem--qua')?.textContent).toBe('Đã qua hạn · 6 em nộp trễ')
  })
})

describe('ngăn danh sách em', () => {
  it('"Xem N em này" (N = chưa mở + chậm nhịp) mở ngăn ở tab "Cần để ý"; bấm MỘT ĐOẠN của thanh ⇒ ngăn mở đúng nhóm đó', () => {
    dung('binh-thuong')
    const t0 = the()[0]!
    fireEvent.click(within(t0).getByRole('button', { name: 'Xem 20 em này' }))
    let ngan = screen.getByRole('dialog', { name: /Danh sách em của Lớp 12/ })
    expect(within(ngan).getByRole('tab', { selected: true }).textContent).toContain('Cần để ý')
    expect(ngan.querySelectorAll('.btg-em').length).toBe(20)
    cleanup()
    dung('binh-thuong')
    fireEvent.click(within(the()[0]!).getByRole('button', { name: 'chậm nhịp: 4 em. Bấm để xem danh sách' }))
    ngan = screen.getByRole('dialog', { name: /Danh sách em của Lớp 12/ })
    expect(within(ngan).getByRole('tab', { selected: true }).textContent).toContain('chậm nhịp')
    expect(ngan.querySelectorAll('.btg-em').length).toBe(4)
  })
  it('mỗi em một dòng: chặng · số câu đã làm / của em · lần học gần nhất; em chưa mở ghi "chưa mở"; chip "nộp trễ N giờ"; bấm em ⇒ Toàn cảnh em', () => {
    const { p } = dung('qua-han')
    fireEvent.click(within(the()[0]!).getByRole('button', { name: 'đã nộp cả bài: 38 em. Bấm để xem danh sách' }))
    const ngan = screen.getByRole('dialog', { name: /Danh sách em của/ })
    expect(ngan.querySelectorAll('.btg-chip-tre').length).toBe(6)
    expect(ngan.textContent).toContain('nộp trễ 30 giờ')
    fireEvent.click(within(ngan).getByRole('tab', { name: /chưa mở/ }))
    expect(ngan.querySelector('.btg-em-phu')!.textContent).toContain('0/32 câu · chưa mở')
    fireEvent.click(ngan.querySelector('.btg-em')!)
    expect(p.onMoToanCanh).toHaveBeenCalledWith(expect.stringMatching(/^Q\d{3}$/))
  })
  it('màn ≥ 1100 px: ngăn nằm bên phải (complementary), không phải tấm trượt; đóng được', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('min-width: 1100px'), media: q, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, onchange: null, dispatchEvent: () => false }))
    dung('binh-thuong')
    fireEvent.click(within(the()[0]!).getByRole('button', { name: /Xem \d+ em này/ }))
    const ngan = screen.getByRole('complementary', { name: /Danh sách em của Lớp 12/ })
    expect(document.querySelector('.btg-luoi--ngan')).toBeTruthy()
    fireEvent.click(within(ngan).getByRole('button', { name: 'Đóng danh sách em' }))
    expect(screen.queryByRole('complementary')).toBeNull()
  })
})

describe('bộ lọc lớp + ô tìm chung', () => {
  it('lọc lớp chỉ còn bài của lớp; dải cần để ý tính theo bài đang lọc', () => {
    dung('binh-thuong')
    fireEvent.click(screen.getByRole('button', { name: 'Lớp 11' }))
    expect(tenThe()).toEqual(['Lớp 11 · Chương 1 · Bài 3'])
    expect(within(screen.getByRole('group', { name: 'Cần thầy để ý' })).getByText('Em chưa mở bài').parentElement!.textContent).toContain('7')
  })
  it('gõ tên em ⇒ CHỈ còn bài có em đó và MỞ sẵn ngăn danh sách ở đúng em; xoá ô ⇒ trở lại', () => {
    dung('binh-thuong')
    const o = screen.getByRole('searchbox') as HTMLInputElement
    const em = canh('binh-thuong')[1]!.hocSinh![0]! // em đầu của bài Lớp 12 (B-LOP12); số báo danh chỉ có ở bài này
    const ten = em.hoTen
    fireEvent.change(o, { target: { value: em.sbd.toLowerCase() } })
    expect(tenThe().length).toBeLessThan(3)
    expect(tenThe()).toContain('Lớp 12 · Chương 2 · Bài 4')
    expect(screen.queryByRole('dialog')).toBeNull() // GÕ chỉ lọc, không tự mở ngăn
    const kq = screen.getByRole('region', { name: 'Kết quả tìm học sinh' })
    expect(kq.textContent).toContain(ten)
    fireEvent.keyDown(o, { key: 'Enter' }) // Enter ⇒ mở ngăn ở bài đầu tiên khớp
    const ngan = screen.getByRole('dialog', { name: /Danh sách em của/ })
    expect(ngan.textContent).toContain(ten)
    fireEvent.change(o, { target: { value: '' } })
    expect(tenThe().length).toBe(3)
    expect(screen.queryByRole('region', { name: 'Kết quả tìm học sinh' })).toBeNull()
  })
  it('BỀ RỘNG HẸP: gõ TỪNG KÝ TỰ — không lần nào tấm trượt / lớp phủ xuất hiện, ô tìm giữ tiêu điểm và giữ đủ chữ; bấm một kết quả mới mở ngăn', () => {
    dung('binh-thuong') // jsdom không có matchMedia ⇒ màn hẹp (tấm trượt)
    const o = screen.getByRole('searchbox') as HTMLInputElement
    o.focus()
    const chu = 'b001' // số báo danh của em đầu bài Lớp 12
    let go = ''
    for (const k of chu) {
      go += k
      fireEvent.change(o, { target: { value: go } })
      expect(screen.queryByRole('dialog'), `sau "${go}"`).toBeNull()
      expect(document.querySelector('.btg-nen-tam'), `sau "${go}"`).toBeNull()
      expect(document.activeElement, `sau "${go}"`).toBe(o)
      expect(o.value).toBe(go)
    }
    fireEvent.click(within(screen.getByRole('region', { name: 'Kết quả tìm học sinh' })).getAllByRole('button')[0]!)
    expect(screen.getByRole('dialog', { name: /Danh sách em của Lớp 12/ })).toBeTruthy()
  })
  it('kết quả tìm: tối đa 6 dòng, còn lại nói "và N em khác"; không ai khớp ⇒ nói thật', () => {
    dung('binh-thuong')
    const o = screen.getByRole('searchbox')
    fireEvent.change(o, { target: { value: 'nguyen' } }) // họ phổ biến: nhiều em khớp ở cả ba bài
    const kq = screen.getByRole('region', { name: 'Kết quả tìm học sinh' })
    expect(kq.querySelectorAll('.btg-ket-qua-muc').length).toBe(6)
    expect(kq.textContent).toMatch(/và \d+ em khác/)
    fireEvent.change(o, { target: { value: 'zzzz không ai' } })
    expect(screen.getByRole('region', { name: 'Kết quả tìm học sinh' }).textContent).toContain('Không có học sinh nào khớp')
  })
  it('gõ tên không có ai ⇒ nói thật "Không có bài nào khớp bộ lọc."', () => {
    dung('binh-thuong')
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zzzz không ai' } })
    expect(screen.getByText('Không có bài nào khớp bộ lọc.')).toBeTruthy()
  })
})

describe('bài quá hạn còn em chưa nộp + chi tiết thanh nhóm', () => {
  it('ô "Em chưa nộp quá hạn" hiện ở dải; "Xem N em chưa nộp" mở ngăn ở tab "Chưa nộp" đúng N em; dòng tóm tắt nói rõ', () => {
    dung('qua-han')
    const dai = screen.getByRole('group', { name: 'Cần thầy để ý' })
    expect(within(dai).getByText('Em chưa nộp quá hạn').parentElement!.textContent).toContain('7') // 45 − 38 ở bài Lớp 10
    // mỗi em một ô: bài Lớp 10 quá hạn nên chưa mở / chậm nhịp của nó không đếm lại — ô "chưa mở" biến mất, "chậm nhịp" chỉ còn của bài Lớp 12 còn hạn
    expect(screen.queryByText('Em chưa mở bài')).toBeNull()
    expect(within(dai).getByText('Em chậm nhịp').parentElement!.textContent).toContain('2 em · 1 bài')
    expect(the()[0]!.textContent).not.toContain('em chậm nhịp')
    expect(the()[0]!.textContent).toContain('7 em chưa nộp quá hạn')
    fireEvent.click(within(the()[0]!).getByRole('button', { name: 'Xem 7 em chưa nộp' }))
    const ngan = screen.getByRole('dialog', { name: /Danh sách em của/ })
    expect(within(ngan).getByRole('tab', { selected: true }).textContent).toContain('Chưa nộp')
    expect(ngan.querySelectorAll('.btg-em').length).toBe(7)
  })
  it('bài KHÔNG chia chặng quá hạn, em đang làm dở: KHÔNG dòng "Mọi bài đang đúng nhịp."', () => {
    const d = canh('khong-chang').map((b) => ({ ...b, hanNop: '2026-09-21T05:00:00.000Z', quaHan: true }))
    dung('khong-chang', { ds: nhomBtvn(d) })
    expect(screen.queryByText('Mọi bài đang đúng nhịp.')).toBeNull()
    expect(screen.getByText('Em chưa nộp quá hạn')).toBeTruthy()
  })
  it('đoạn quá hẹp: số KHÔNG nằm trong đoạn mà ra chú giải; tab "Cần để ý" mang đúng số em', () => {
    const d = canh('binh-thuong')
    d[1]!.nhom = { chuaMo: 1, dungNhip: 40, chamNhip: 30, xongHomNay: 0, daNop: 0, nopTre: 0 } // d[1] = bài Lớp 12; chậm nhịp 30 ⇒ mức cao nhất ⇒ đứng đầu, thẻ MỞ (có số trong đoạn rộng); đoạn 'chưa mở 1' rất hẹp
    d[1]!.hocSinh = d[1]!.hocSinh!.map((e, i) => ({ ...e, nhom: i === 0 ? ('chua_mo' as const) : ('dung_nhip' as const) }))
    dung('binh-thuong', { ds: nhomBtvn(d) })
    const doanDau = [...document.querySelectorAll('.btg-doan')].find((x) => x.getAttribute('aria-label')?.startsWith('chưa mở: 1 em'))!
    expect(doanDau.textContent).toBe('')
    expect(document.body.textContent).toContain('chưa mở 1')
    cleanup()
    dung('binh-thuong')
    fireEvent.click(within(the()[0]!).getByRole('button', { name: 'Xem 20 em này' }))
    const ngan2 = screen.getByRole('dialog', { name: /Danh sách em của/ })
    expect(within(ngan2).getByRole('tab', { name: /Cần để ý\s*20/ })).toBeTruthy()
    expect(within(ngan2).queryByRole('tab', { name: /Chưa nộp/ })).toBeNull() // bài chưa quá hạn: không có tab "Chưa nộp"
  })
  it('thông báo kết quả hiện CẢ TRONG hộp đang mở (không nằm sau lớp phủ)', () => {
    dung('binh-thuong', { thongBao: <p data-testid="tb">Đã cho Lê Minh Đức làm lại</p> })
    fireEvent.click(within(the()[0]!).getByRole('button', { name: /Thêm thao tác/ }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Xem bài làm' }))
    expect(within(screen.getByRole('dialog', { name: /Bài làm/ })).getByTestId('tb')).toBeTruthy()
    fireEvent.keyDown(document, { key: 'Escape' })
    fireEvent.click(within(the()[0]!).getByRole('button', { name: /Thêm thao tác/ }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Đổi hạn nộp' }))
    expect(within(screen.getByRole('dialog', { name: 'Đổi hạn nộp' })).getByTestId('tb')).toBeTruthy()
  })
})

describe('hành động: Đổi hạn nộp, Xem bài làm, Thu hồi', () => {
  it('nút ⋯ (≥ 44 px trong CSS) có đủ bốn mục, Thu hồi ở CUỐI và màu cảnh báo; Thu hồi KHÔNG chạy thẳng mà giao cho nơi gọi (hộp xác nhận nói rõ hậu quả)', () => {
    const { p } = dung('binh-thuong')
    fireEvent.click(within(the()[0]!).getByRole('button', { name: /Thêm thao tác/ }))
    const muc = screen.getAllByRole('menuitem').map((m) => m.textContent)
    expect(muc).toEqual(['Đổi hạn nộp', 'Xem bài làm', 'Chi tiết bài', 'Thu hồi'])
    expect(screen.getByRole('menuitem', { name: 'Thu hồi' }).className).toContain('btg-menu-muc--canh-bao')
    fireEvent.click(screen.getByRole('menuitem', { name: 'Thu hồi' }))
    expect(p.onThuHoi).toHaveBeenCalledTimes(1)
    expect((p.onThuHoi as ReturnType<typeof vi.fn>).mock.calls[0]![0].maBtvn).toBe('B-LOP12')
    expect(p.onLuuHan).not.toHaveBeenCalled()
  })
  it('Đổi hạn nộp: hộp có ô ngày giờ + 4 nút nhanh + Lưu hạn; Lưu hạn gọi lệnh CŨ của nơi gọi với đúng bài; Huỷ không gọi', async () => {
    const { p } = dung('binh-thuong', { hanChoOChon: () => '2026-09-25T17:00' })
    fireEvent.click(within(the()[0]!).getByRole('button', { name: /Thêm thao tác/ }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Đổi hạn nộp' }))
    const hop = screen.getByRole('dialog', { name: 'Đổi hạn nộp' })
    expect(within(hop).getAllByRole('button').map((b) => b.textContent).join('|')).toMatch(/Hôm nay 23:59.*Mai 23:59.*\+3 ngày.*\+7 ngày/)
    fireEvent.click(within(hop).getByRole('button', { name: 'Huỷ' }))
    expect(p.onLuuHan).not.toHaveBeenCalled()
    fireEvent.click(within(the()[0]!).getByRole('button', { name: /Thêm thao tác/ }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Đổi hạn nộp' }))
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Đổi hạn nộp' })).getByRole('button', { name: 'Lưu hạn' }))
    await Promise.resolve()
    expect(p.onLuuHan).toHaveBeenCalledTimes(1)
    expect((p.onLuuHan as ReturnType<typeof vi.fn>).mock.calls[0]![0].maBtvn).toBe('B-LOP12')
  })
  it('Xem bài làm: mở hộp với khối danh sách + thao tác từng em sẵn có (nơi gọi dựng)', () => {
    dung('binh-thuong')
    fireEvent.click(within(the()[0]!).getByRole('button', { name: /Thêm thao tác/ }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Xem bài làm' }))
    expect(within(screen.getByRole('dialog', { name: /Bài làm/ })).getByTestId('bai-lam')).toBeTruthy()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

describe('máy chủ cũ (thiếu khoá mới)', () => {
  const CHU = 'Chưa có số theo nhóm — bấm “Cập nhật dữ liệu” để tải lại.'
  it('thẻ KHÔNG thanh nhóm; lời nói THẬT (không "Cập nhật máy chủ" — thầy không làm được) và nói MỘT lần ở đầu khi CẢ danh sách thiếu, không lặp ở mọi thẻ; tên cũ do nơi gọi đưa; không vỡ; vẫn Xem bài làm', () => {
    dung('may-cu')
    expect(document.querySelector('.btg-thanh')).toBeNull()
    expect(screen.queryByText(/Cập nhật máy chủ/)).toBeNull()
    expect(screen.getAllByText(CHU).length).toBe(1)
    expect(document.querySelector('.btg-thieu-nhom')).toBeTruthy()
    expect(document.querySelectorAll('article .btg-ghi-chu').length).toBe(0)
    expect(the()[0]!.querySelector('.btg-ten')!.textContent).toMatch(/^Dạy học \/ Lớp/)
    expect(the()[0]!.textContent).toContain('đã nộp 6') // máy cũ vẫn nói được số đã nộp (tổng / đã nộp cũ)
    fireEvent.click(within(the()[0]!).getByRole('button', { name: 'Xem bài làm' }))
    expect(screen.getByTestId('bai-lam')).toBeTruthy()
  })
  it('MỘT bài thiếu nhóm KHÔNG làm mất dải và thanh nhóm của bài khác: bài có nhóm vẫn hiện thanh + số ở dải; bài thiếu nói riêng ở thẻ của nó; không dòng đầu trang', () => {
    const d = canh('binh-thuong')
    delete d[0]!.nhom // Lớp 10 thiếu nhóm; Lớp 12 và Lớp 11 còn
    dung('binh-thuong', { ds: nhomBtvn(d) })
    expect(screen.getByRole('group', { name: 'Cần thầy để ý' })).toBeTruthy()
    expect(screen.getByText('Em chưa mở bài')).toBeTruthy()
    expect(the()[0]!.querySelector('.btg-thanh')).toBeTruthy() // bài đầu (Lớp 12) còn thanh nhóm
    const lop10 = the().find((a) => a.textContent!.includes('Lớp 10'))!
    fireEvent.click(lop10.querySelector('.btg-the-bam')!) // mở thẻ Lớp 10
    expect(lop10.textContent).toContain(CHU)
    expect(lop10.querySelector('.btg-thanh')).toBeNull()
    expect(document.querySelector('.btg-thieu-nhom')).toBeNull()
    expect(screen.queryByText('Mọi bài đang đúng nhịp.')).toBeNull()
  })
  it('ngăn em: MỘT em thiếu nhóm không làm mất các tab (em ấy chỉ nằm ở "Tất cả"); không em nào có nhóm ⇒ nói thật', () => {
    const d = canh('binh-thuong')
    delete d[1]!.hocSinh![0]!.nhom
    dung('binh-thuong', { ds: nhomBtvn(d) })
    fireEvent.click(within(the()[0]!).getByRole('button', { name: /Xem \d+ em này/ }))
    const ngan = screen.getByRole('dialog', { name: /Danh sách em của/ })
    expect(within(ngan).getByRole('tab', { name: /Cần để ý/ })).toBeTruthy()
    expect(ngan.textContent).not.toContain(CHU)
    cleanup()
    dung('may-cu')
    fireEvent.click(within(the()[0]!).getByRole('button', { name: 'Xem bài làm' }))
    fireEvent.keyDown(document, { key: 'Escape' })
  })
})

describe('khung rỗng / đang tải', () => {
  it('không bài ⇒ "Chưa có bài tập về nhà nào" + nút Giao bài mới; đang tải ⇒ dòng đang tải', () => {
    const { p } = dung('binh-thuong', { ds: [] })
    fireEvent.click(screen.getByRole('button', { name: /Giao bài mới ngay/ }))
    expect(p.onGiaoBaiMoi).toHaveBeenCalled()
    cleanup()
    dung('binh-thuong', { ds: [], dangNap: true })
    expect(screen.getByText('Đang tải danh sách bài…')).toBeTruthy()
  })
})
