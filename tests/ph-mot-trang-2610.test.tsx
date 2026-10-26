// «MỘT TRANG» APP PHỤ HUYNH (thầy chốt 26/10, bản vẽ ve-moi/ph-mot-trang.html). Khoá:
//   · main.tsx gắn <html data-trong="ph"> cho cổng phụ huynh (cùng luật lùi `ddh.trong`='tat'); /hoi-thay vẫn không có;
//   · bật ⇒ màn một trang: 8 ô (Hôm nay của con · Lời thầy · Nhịp học · Báo cáo tuần · Kiểm tra và tiến bộ · Câu sai và tự sửa · Thái độ · Thời gian)
//     + lối vào Bài tập về nhà / Buổi học / Lịch sử (khi app cũ có phần ấy); KHÔNG thanh mục cuộn tới;
//   · số phần dưới: CHỈ lệnh sẵn có (/ph/ho-so-thai-do · /ph/lich-su-lam-cau · /ph/bao-cao-tuan), gọi sau màn đầu; chưa có ⇒ «Đang tải…»;
//   · chạm ô ⇒ tấm có ĐÚNG khối cũ; «Đã xem» trên ô Lời thầy báo đã xem như nút cũ;
//   · tắt (không data-trong) ⇒ trang cũ y nguyên.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, waitFor, within } from '@testing-library/react'
import AppPhuHuynh from '../src/components/ph-v3/AppPhuHuynh'
import { hoc2Gia, lichSuGia, loiThayGia, nhipGia, thaiDoGia, tatCaGia, tongQuanGia } from '../scripts/chup-ph-dot19/gia'

const daXem = vi.fn()
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/lib/tai-thong-tin-ph', () => ({
  taiThongTinPhuHuynh: async () => ({
    canhBao: [{ id: 'cb1', maBtvn: 'B7', tenBtvn: 'Ester buổi 7', guiLuc: '2026-10-14T12:30:00Z', hanNop: '2026-10-15T15:00:00Z', loi: '', trangThaiEm: 'do_chang', chang: { hienTai: 2, tong: 5 }, daXem: false }],
  }),
}))
vi.mock('../src/lib/canh-bao-thay-may-chu', () => ({ baoDaXemPhuHuynh: (id: string) => daXem(id) }))

const BAO_CAO = {
  ok: true, soLieu: 'x',
  duLieu: { tu: '08/10', den: '14/10', buoi: { tong: 3, coMat: 3, coPhep: 0 }, soNgay: 7, ngayCoLam: 6, ngayKhongLam: [], soCau: 186, soDung: 141, mucLam: null, ktcn: { nop: 0, hetHan: [], diem: [] }, banKhac: null, banKhacTruoc: null, chuyenDeYeu: [], nhan: 'Học thật', lyDo: [] },
}
const MAY: Record<string, () => unknown> = {
  '/ph/tat-ca-ve-con': tatCaGia, '/ph/con-tong-quan': tongQuanGia, '/ph/nhip-hoc': nhipGia, '/ph/loi-thay': loiThayGia, '/ph/hoc-2': hoc2Gia,
  '/ph/ho-so-thai-do': thaiDoGia, '/ph/lich-su-lam-cau': lichSuGia, '/ph/bao-cao-tuan': () => BAO_CAO,
}
let goi: string[] = []

beforeEach(() => {
  goi = []
  daXem.mockReset()
  localStorage.clear()
  window.history.replaceState(null, '', '/?vai=phuhuynh')
  vi.stubGlobal('scrollTo', vi.fn())
  vi.stubGlobal('IntersectionObserver', class { observe() {} unobserve() {} disconnect() {} })
  Element.prototype.scrollIntoView = vi.fn()
  vi.stubGlobal('fetch', vi.fn((url: string) => {
    const duong = String(url).replace('https://may.test', '')
    goi.push(duong)
    const body = MAY[duong]?.() ?? { ok: true }
    return Promise.resolve({ ok: true, status: 200, json: async () => body, text: async () => JSON.stringify(body) })
  }))
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  delete document.documentElement.dataset.trong
  localStorage.clear()
  window.history.replaceState(null, '', '/')
})

const mo = () => render(<div className="m3"><AppPhuHuynh sbd="12121212" hoTen="Nguyễn Minh Khôi" lop="12A1" onDoiSbd={() => {}} /></div>).container

describe('main.tsx — công tắc «Một trang» phụ huynh', () => {
  const ma = readFileSync(resolve(__dirname, '../src/main.tsx'), 'utf8')
  it("cổng phụ huynh = 'ph', /hoi-thay không có, lùi bằng ddh.trong='tat'", () => {
    expect(ma).toMatch(/const vaiTrong = laHoiThay \? '' : laCongPhuHuynh \? 'ph' :/)
    expect(ma).toMatch(/localStorage\.getItem\('ddh\.trong'\) !== 'tat'/)
  })
  it('PH KHÔNG nạp trong.css (màu PH giữ bảng PH)', () => {
    const mot = readFileSync(resolve(__dirname, '../src/components/ph-v3/MotTrangPh.tsx'), 'utf8')
    const app = readFileSync(resolve(__dirname, '../src/components/ph-v3/AppPhuHuynh.tsx'), 'utf8')
    for (const t of [mot, app]) expect(t).not.toMatch(/styles\/trong/)
    const css = readFileSync(resolve(__dirname, '../src/components/ph-v3/mot-trang-ph.css'), 'utf8')
    let dem = 0
    for (const khoi of css.replace(/\/\*[\s\S]*?\*\//g, '').split('}')) {
      if (!khoi.includes('{')) continue
      const chon = khoi.replace(/^[\s\S]*@media[^{]*\{/, '').split('{')[0]!.trim()
      for (const c of chon.split(',')) { expect(c.trim(), chon).toMatch(/^\[data-trong=ph\] /); dem++ }
    }
    expect(dem).toBeGreaterThan(80)
    expect(css).not.toMatch(/--tr-/)
  })
})

describe('«Một trang» bật (<html data-trong="ph">)', () => {
  beforeEach(() => { document.documentElement.dataset.trong = 'ph' })

  it('8 ô + lối vào, không thanh mục cuộn tới; số phần dưới về sau màn đầu, chỉ bằng lệnh sẵn có', async () => {
    const c = mo()
    await waitFor(() => expect(c.querySelector('[data-vung="mot-trang-ph"] .mtp-luoi [data-o="hom"]')).toBeTruthy())
    const o = [...c.querySelectorAll('.mtp-luoi > .mtp-o')].map((x) => x.getAttribute('data-o'))
    expect(o).toEqual(['hom', 'thay', 'nhip', 'bao-cao-tuan', 'kiem-tra', 'cau-sai', 'thai-do', 'thoi-gian'])
    expect(c.querySelector('.tvc-muc-luc')).toBeNull()
    expect(c.querySelector('.tvc-ben')).toBeNull()
    const loi = [...c.querySelectorAll('.mtp-them button')].map((b) => b.getAttribute('aria-label'))
    expect(loi.map((x) => x?.replace(/,.*$/, ''))).toEqual(['Bài tập về nhà', 'Buổi học trên lớp', 'Lịch sử từng ngày'])
    // số lúc mở
    const hom = c.querySelector('[data-o="hom"]')!
    expect(hom.textContent).toContain('Còn 12 câu nữa là đủ mức hôm nay')
    expect(hom.textContent).toContain('Có mặt buổi học · 17:52')
    expect(hom.querySelector('[data-vung="goi-y-nhac"]')!.textContent).toMatch(/^Cần nhắc con:/)
    // lúc rảnh: ba lệnh sẵn có, rồi ô có số
    await waitFor(() => expect(c.querySelector('[data-o="thai-do"] .mtp-thanh-3')).toBeTruthy())
    await waitFor(() => expect(c.querySelector('[data-o="bao-cao-tuan"]')!.textContent).toContain('Học thật'))
    expect(c.querySelector('[data-o="thoi-gian"]')!.textContent).toContain('Một nửa số lượt dưới')
    for (const d of goi) expect(Object.keys(MAY)).toContain(d)
    for (const d of ['/ph/ho-so-thai-do', '/ph/lich-su-lam-cau', '/ph/bao-cao-tuan']) expect(goi.filter((x) => x === d)).toHaveLength(1)
    expect(c.textContent).not.toMatch(/CA-45|12121212/)
  })

  it('chạm ô ⇒ tấm có ĐÚNG khối cũ; Esc / Đóng ⇒ đóng', async () => {
    const c = mo()
    await waitFor(() => expect(c.querySelector('[data-o="nhip"] .mtp-n14')).toBeTruthy())
    fireEvent.click(within(c.querySelector('[data-o="nhip"]') as HTMLElement).getByRole('button', { name: /^Mở Nhịp học/ }))
    const tam = await waitFor(() => c.querySelector('[role="dialog"]') as HTMLElement)
    expect(tam.querySelector('[data-vung="nhip-hoc-con"]')).toBeTruthy()
    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => expect(c.querySelector('[role="dialog"]')).toBeNull())
    fireEvent.click(within(c.querySelector('[data-o="thai-do"]') as HTMLElement).getByRole('button', { name: 'Mở Thái độ làm bài' }))
    await waitFor(() => expect(c.querySelector('[role="dialog"] [data-vung="tin-hieu"]')).toBeTruthy())
    fireEvent.click(within(c.querySelector('[role="dialog"]') as HTMLElement).getByRole('button', { name: 'Đóng' }))
    await waitFor(() => expect(c.querySelector('[role="dialog"]')).toBeNull())
    fireEvent.click(c.querySelector('.mtp-them button')!)
    await waitFor(() => expect(c.querySelector('[role="dialog"] [data-vung="btvn"]')).toBeTruthy())
  })

  it('ô Lời thầy: cảnh báo + «Đã xem» (báo máy chủ như nút cũ) + nhận xét mới nhất', async () => {
    const c = mo()
    await waitFor(() => expect(c.querySelector('[data-o="thay"] [data-vung="canh-bao-thay"]')).toBeTruthy())
    expect(c.querySelector('[data-o="thay"] [data-vung="loi-thay-moi"]')!.textContent).toMatch(/^Nhận xét/)
    fireEvent.click(within(c.querySelector('[data-o="thay"]') as HTMLElement).getByRole('button', { name: 'Đã xem' }))
    expect(daXem).toHaveBeenCalledWith('cb1')
    await waitFor(() => expect(c.querySelector('[data-o="thay"] [data-vung="canh-bao-thay"]')).toBeNull())
  })
})

describe('«Một trang» tắt (không data-trong / ddh.trong=tat)', () => {
  it('trang cũ y nguyên: thanh mục, các phần, không có ô', async () => {
    const c = mo()
    await waitFor(() => expect(c.querySelector('[data-vung="man-chinh-ph"] [data-vung="anh-hung"]')).toBeTruthy())
    expect(c.querySelector('.tvc-muc-luc')).toBeTruthy()
    expect(c.querySelector('[data-vung="mot-trang-ph"]')).toBeNull()
    expect(goi).not.toContain('/ph/ho-so-thai-do')
  })
})
