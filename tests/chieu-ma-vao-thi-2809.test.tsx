// CHIẾU MÃ VÀO THI làm lại (thầy 28/09): mã to + QR + link ngắn; "Đã vào phòng chờ" tự làm mới MỖI 5 GIÂY, dừng khi tab ẩn / đóng màn,
// lỗi mạng GIỮ danh sách cũ + chấm "mất kết nối"; chỉ tên em (không điểm, không đáp án). Kèm: mã QR tự viết khớp thư viện chuẩn;
// màn "Ca đã mở" mới (CaDaMo) và nút Mở ca giữ chữ khi đang gửi.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import fs from 'node:fs'
import TamPhuChieuMa, { NHIP_PHONG_CHO_MS, gopEmDaVao, tenChip, type PhongChoChieu } from '../src/components/TamPhuChieuMa'
import CaDaMo from '../src/components/ca-thi/CaDaMo'
import { taoQr, taoQrVoiMask } from '../src/lib/ma-qr'

const doc = (f: string) => fs.readFileSync(f, 'utf8')
let an = false
beforeEach(() => {
  an = false
  vi.useFakeTimers()
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (an ? 'hidden' : 'visible') })
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})
const xa = async (ms: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}
const ve = (hoi: () => Promise<PhongChoChieu>) =>
  render(<TamPhuChieuMa maCa="482913" tenCa="Kiểm tra tuần 4" lop="12A1" diaChi="omr.test/t/482913" link="https://omr.test/t/482913" soEmCho={null} onDong={() => {}} hoiPhongCho={hoi} />)

describe('Chiếu mã vào thi · tự làm mới 5 giây', () => {
  it('hỏi ngay khi mở, rồi đúng mỗi 5 giây; hiện "đã vào / sĩ số" và chip tên; em mới vào có lớp xuất hiện', async () => {
    let ds = [{ sbd: '1', hoTen: 'Nguyễn Minh Anh' }]
    const hoi = vi.fn(async () => ({ em: ds, siSo: 30 }))
    const { container } = ve(hoi)
    await xa(0)
    expect(hoi).toHaveBeenCalledTimes(1)
    expect(container.querySelector('.cm-dem')!.textContent).toBe('1 / 30 em')
    expect(screen.getByText('Minh Anh')).toBeTruthy()
    expect(container.querySelectorAll('.cm-moi')).toHaveLength(0) // lần đầu không nháy cả lớp
    ds = [...ds, { sbd: '2', hoTen: 'Trần Thu Hà' }]
    await xa(NHIP_PHONG_CHO_MS - 1)
    expect(hoi).toHaveBeenCalledTimes(1)
    await xa(1)
    expect(hoi).toHaveBeenCalledTimes(2)
    expect(container.querySelector('.cm-dem')!.textContent).toBe('2 / 30 em')
    expect([...container.querySelectorAll('.cm-moi')].map((x) => x.textContent)).toEqual(['Thu Hà'])
    expect(NHIP_PHONG_CHO_MS).toBe(5000)
  })
  it('TAB ẨN ⇒ không hỏi; hiện lại ⇒ hỏi ngay; ĐÓNG màn ⇒ dừng hẳn', async () => {
    const hoi = vi.fn(async () => ({ em: [], siSo: null }))
    const r = ve(hoi)
    await xa(0)
    an = true
    await xa(NHIP_PHONG_CHO_MS * 3)
    expect(hoi).toHaveBeenCalledTimes(1)
    an = false
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(hoi).toHaveBeenCalledTimes(2)
    expect(screen.getByText(/Chưa em nào vào/)).toBeTruthy()
    r.unmount()
    await xa(NHIP_PHONG_CHO_MS * 3)
    expect(hoi).toHaveBeenCalledTimes(2)
  })
  it('lỗi mạng ⇒ GIỮ danh sách cũ + chấm "mất kết nối"; lần sau được ⇒ hết chấm', async () => {
    let loi = false
    const hoi = vi.fn(async () => {
      if (loi) throw new Error('mạng')
      return { em: [{ sbd: '1', hoTen: 'Lê Văn Bình' }], siSo: 20 }
    })
    const { container } = ve(hoi)
    await xa(0)
    loi = true
    await xa(NHIP_PHONG_CHO_MS)
    expect(screen.getByText('Văn Bình')).toBeTruthy()
    expect(container.querySelector('.cm-mat')).toBeTruthy()
    loi = false
    await xa(NHIP_PHONG_CHO_MS)
    expect(container.querySelector('.cm-mat')).toBeNull()
  })
  it('mã to tách nhóm, QR có, link ngắn, tên ca · lớp; KHÔNG điểm / đáp án', async () => {
    const { container } = ve(async () => ({ em: [{ sbd: '1', hoTen: 'An' }], siSo: null }))
    await xa(0)
    expect(container.querySelector('.ca-chieu-ma')!.textContent).toBe('482 913')
    expect(screen.getByRole('img', { name: 'Mã QR vào thi' })).toBeTruthy()
    expect(container.textContent).toContain('omr.test/t/482913')
    expect(container.textContent).toContain('Kiểm tra tuần 4 · Lớp 12A1')
    expect(container.textContent).not.toMatch(/điểm|đáp án/i)
  })
  it('gộp phòng chờ + đã nhận đề không trùng SBD; tên chip ngắn', () => {
    expect(gopEmDaVao([{ sbd: '1', hoTen: 'A' }], [{ sbd: '1', hoTen: 'A' }, { sbd: '2', hoTen: 'B' }])).toEqual([{ sbd: '1', hoTen: 'A' }, { sbd: '2', hoTen: 'B' }])
    expect(tenChip({ sbd: '9', hoTen: '' })).toBe('SBD 9')
    expect(tenChip({ sbd: '9', hoTen: 'Hà' })).toBe('Hà')
  })
})

describe('mã QR tự viết (src/lib/ma-qr.ts)', () => {
  it('khớp từng ô với qrcode-generator (mẫu đã đối chiếu 28/09: phiên bản 3, mức M, mặt nạ 5)', () => {
    const MAU = ['1fce387f', '1053d141', '175ca75d', '17581f5d', '17453e5d', '10472841', '1fd5557f', '1d7300', '10531dce', 'f1e92b8', '7d0f18a', '1c178529', '1364b76b', '12251b53', '46a04b8', '50924ff', '5d41c2d', '1692c371', '186f274d', '11b687db', '14626ffd', '1e4914', '1fc60750', '104a7111', '1748d7f8', '1749c3ae', '174834da', '104b32cd', '1fda7e14']
    const m = taoQrVoiMask('omr-app-b3u.pages.dev/t/482913', 5)!
    expect(m.map((h) => parseInt(h.map((x) => (x ? '1' : '0')).join(''), 2).toString(16))).toEqual(MAU)
  })
  it('link dài tự lên phiên bản lớn hơn; quá dài ⇒ null', () => {
    expect(taoQr('https://omr-app-b3u.pages.dev/t/482913?may=https%3A%2F%2Fomr.ttadodaihoc.workers.dev')!.length).toBe(37)
    expect(taoQr('x'.repeat(400))).toBeNull()
  })
})

describe('màn Ca đã mở (CaDaMo) + nút Mở ca', () => {
  it('thẻ lớn: tên ca, mã ca to, link + Chép link, Chiếu mã lên bảng, Sang Theo dõi ca, Mở ca khác', () => {
    vi.useRealTimers()
    const f = { chep: vi.fn(), chieu: vi.fn(), theo: vi.fn(), khac: vi.fn(), ma: vi.fn() }
    render(<CaDaMo maCa="482913" tenCa="Kiểm tra tuần 4" joinLink="https://x/t/482913" lop="12A1" soCau={28} phut={50} congBo="Thầy công bố sau" gio="Bắt đầu ngay" aiLam="Mọi em có link" daCopy={false} onChepLink={f.chep} onChepMa={f.ma} onChieuMa={f.chieu} onTheoDoi={f.theo} onMoCaKhac={f.khac} />)
    expect(screen.getByRole('heading', { name: 'Ca đã mở' })).toBeTruthy()
    expect(screen.getByText('482913')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Chép link/ }))
    fireEvent.click(screen.getByRole('button', { name: /Chiếu mã lên bảng/ }))
    fireEvent.click(screen.getByRole('button', { name: /Sang Theo dõi ca/ }))
    fireEvent.click(screen.getByRole('button', { name: /Mở ca khác/ }))
    expect([f.chep, f.chieu, f.theo, f.khac].every((x) => x.mock.calls.length === 1)).toBe(true)
  })
  it('nút Mở ca khi đang gửi GIỮ đúng chữ "Mở ca kiểm tra ngay", chỉ mờ (aria-busy) — không đổi sang câu bước dài', () => {
    const src = doc('src/screens/ExamSetupScreen.tsx')
    expect(src).toContain('aria-busy={opening || undefined}')
    expect(src).not.toMatch(/<span role="status">\{buocMoCa\}<\/span>/)
    expect(src).toContain('<CaDaMo')
    expect(doc('src/components/ca-thi/ca-thi.css')).toMatch(/\.ct-nut\[aria-busy='true'\] \{\s*opacity: 0\.55;/)
  })
})
