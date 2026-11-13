// @vitest-environment jsdom
// KHUNG CHAT LUÔN HIỆN BÊN PHẢI MÁY THẦY (thầy duyệt bản vẽ 55–59 ngày 13/11): «thêm một khung chat bên phải luôn hiện … không làm ảnh hưởng tới bố cục phần
// chiếu cho hs. Tin nhắn hiển thị màu theo đội có họ tên đầy đủ của hs màu theo đội in đậm dòng trên và nội dung chữ nhỏ hơn ở dòng dưới».
import { describe, expect, it } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { COT_HEP, COT_MAN_CAO, COT_MAN_RONG, COT_TRAN, KHOA_COT, cotTheoDai, docCotMuon, ghiCotMuon, hinhCot, vungChieu } from '../src/components/live-khoi/cot-chat-hinh'
import KeoCot from '../src/components/live-khoi/KeoCot'
import { DanhSachTin } from '../src/components/live-khoi/ChatEm'
import type { TinChat } from '../src/lib/live-khoi/chat-loi'

describe('hình học cột chat cố định', () => {
  it('phần chiếu thu ĐỀU: tỉ lệ rộng / cao giữ nguyên ở mọi cỡ màn ⇒ tỉ lệ bảng gửi máy em không đổi', () => {
    for (const [w, h] of [[880, 480], [1000, 590], [1024, 600], [1280, 720], [1366, 768], [1536, 864], [1920, 1080], [2560, 1440]] as const) {
      const g = hinhCot(w, h)!
      expect(g.c).toBeGreaterThanOrEqual(232); expect(g.c).toBeLessThanOrEqual(340)
      const rong = w * g.s, cao = h * g.s
      expect(rong).toBeCloseTo(w - g.c, 6) // phần chiếu sát mép trái cột, không hở, không đè
      expect(rong / cao).toBeCloseTo(w / h, 9) // cùng tỉ lệ với khi không có cột
      expect(Math.abs(g.d - (h - cao))).toBeLessThanOrEqual(0.5) // dải dưới lấp đúng phần dư
    }
    expect(hinhCot(1366, 768)).toEqual({ c: 273, s: (1366 - 273) / 1366, d: 153 })
    // thanh bên trái của app chiếm 18 px ⇒ tờ bắt đầu từ x = 18: phần chiếu vẫn sát mép trái cột
    const g18 = hinhCot(1366, 768, 18)!; expect(18 + (1366 - 18) * g18.s).toBeCloseTo(1366 - g18.c, 6)
    // cửa sổ máy xách tay thấp (thầy 13/11 «chưa thấy cột nhắn tin»): 1000 × 590 vẫn dựng cột
    expect(hinhCot(1000, 590)).not.toBeNull()
  })
  it('cửa sổ nhỏ (điện thoại, cửa sổ thu hẹp) ⇒ không dựng cột cố định', () => {
    expect(hinhCot(COT_MAN_RONG - 1, 900)).toBeNull(); expect(hinhCot(1400, COT_MAN_CAO - 1)).toBeNull(); expect(hinhCot(844, 390)).toBeNull(); expect(hinhCot(NaN, NaN)).toBeNull()
  })
  it('vùng phần chiếu: gốc trang có số đo cột thì trừ cột và dải, không thì kín cửa sổ', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1366, configurable: true }); Object.defineProperty(window, 'innerHeight', { value: 768, configurable: true })
    expect(vungChieu()).toEqual({ w: 1366, h: 768 })
    const g = document.documentElement.style; g.setProperty('--lkc-w', '273px'); g.setProperty('--lkc-s', String(1093 / 1366))
    const v = vungChieu(); expect(v.w).toBe(1093); expect(v.h).toBeCloseTo(768 * (1093 / 1366), 6)
    g.removeProperty('--lkc-w'); g.removeProperty('--lkc-s')
  })
})

describe('dòng tin gọn của cột cố định', () => {
  const tin = (o: Partial<TinChat>): TinChat => ({ id: '1-S1', sbd: 'S1', ten: 'Nguyễn Thị Thu Hà', doi: 1, luc: Date.parse('2026-11-13T12:50:00Z'), chu: 'Thầy ơi CH3COONa là muối gì ạ?', hoi: true, thay: false, ...o })
  it('dòng trên: HỌ TÊN ĐẦY ĐỦ + màu theo đội + nhãn «Câu hỏi» + giờ; dòng dưới: nội dung (công thức có chỉ số dưới)', () => {
    const { container } = render(<DanhSachTin gon ds={[tin({}), tin({ id: '2-S2', sbd: 'S2', ten: 'Lê Hoàng Nam', doi: 2, chu: 'Dạ rõ ạ', hoi: false }), tin({ id: '3-gv', sbd: 'gv', ten: 'Thầy', doi: -1, chu: 'Muối của acid yếu', hoi: false, thay: true })]} rong="Chưa có tin nhắn nào" />)
    const d = [...container.querySelectorAll<HTMLElement>('.lc-g')]
    expect(d).toHaveLength(3)
    expect(d[0]!.querySelector('.lc-g-ten > span')!.textContent).toBe('Nguyễn Thị Thu Hà')
    expect(d[0]!.style.getPropertyValue('--lc-doi')).toBe('var(--p-tim-2)') // Đội Kali
    expect(d[1]!.style.getPropertyValue('--lc-doi')).toBe('var(--p-xanh)') // Đội Đồng
    expect(d[0]!.querySelector('.lc-g-ten > em')!.textContent).toBe('Câu hỏi'); expect(d[1]!.querySelector('.lc-g-ten > em')).toBeNull()
    expect(d[0]!.querySelector('time')!.textContent).toBe('19:50')
    expect(d[0]!.querySelector('.lc-g-chu')!.innerHTML).toContain('<sub>3</sub>')
    expect(d[2]!.dataset.thay).toBe('true'); expect(d[2]!.querySelector('.lc-g-ten > span')!.textContent).toBe('Thầy')
    expect(container.querySelector('.lc-av')).toBeNull() // không còn ô tròn chữ tắt: tên đầy đủ đã đủ nhận ra
  })
  it('không truyền `gon` ⇒ dòng tin cũ (máy em, cột nổi) giữ nguyên', () => {
    const { container } = render(<DanhSachTin ds={[tin({})]} rong="" />)
    expect(container.querySelector('.lc-tn')).not.toBeNull(); expect(container.querySelector('.lc-g')).toBeNull()
  })
  it('CSS: tên đậm và to hơn nội dung; màu tên lấy từ màu đội; phần chiếu chỉ THU ĐỀU bằng transform, không đổi bề ngang / bề cao của tờ', () => {
    const chat = readFileSync('src/components/live-khoi/chat.css', 'utf8'), thay = readFileSync('src/components/live-khoi/thay-khoi.css', 'utf8')
    const ten = /\.lc-g-ten \{[^}]*font-size: ([\d.]+)px;[^}]*font-weight: (\d+);[^}]*color: color-mix\(in srgb, var\(--lc-doi\)/.exec(chat)!, chu = /\.lc-g-chu \{[^}]*font-size: ([\d.]+)px; font-weight: (\d+);/.exec(chat)!
    expect(Number(ten[1])).toBeGreaterThan(Number(chu[1])); expect(Number(ten[2])).toBeGreaterThanOrEqual(800); expect(Number(chu[2])).toBeLessThanOrEqual(500)
    const luat = /:root\[data-lk-cot\] \.lop-xem-phieu \{([^}]*)\}/.exec(thay)![1]!
    expect(luat).toMatch(/transform: scale\(var\(--lkc-s\)\)/); expect(luat).toMatch(/transform-origin: 0 0/); expect(luat).not.toMatch(/width|height|inset|right|bottom/)
    expect(thay.slice(thay.indexOf('CỘT TIN NHẮN CỐ ĐỊNH'))).not.toMatch(/:has\(/) // phần mới không dùng :has() (luật mượt 27/10)
  })
})

// Thầy 13/11: «cho tôi điều chỉnh kích thước được của thẻ đen chỉ thầy thấy ở dưới».
describe('thầy tự kéo cỡ dải «Chỉ thầy thấy» / cột tin nhắn', () => {
  it('không đặt gì ⇒ y như cũ; đặt bề ngang cột ⇒ phần chiếu vẫn thu ĐỀU, dải cao theo đúng tỉ lệ; kẹp trong [COT_HEP, min(COT_TRAN, 40 % phần chiếu)]', () => {
    expect(hinhCot(1366, 768, 0, null)).toEqual(hinhCot(1366, 768))
    const a = hinhCot(1366, 768, 0, 200)!
    expect(a.c).toBe(200); expect(a.s).toBeCloseTo(1166 / 1366, 6); expect(a.d).toBe(Math.round(768 - 768 * a.s))
    expect(a.d).toBeLessThan(hinhCot(1366, 768)!.d) // cột hẹp lại ⇔ dải thấp đi ⇔ phần chiếu to ra
    expect(hinhCot(1366, 768, 0, 10)!.c).toBe(COT_HEP)
    expect(hinhCot(1366, 768, 0, 9999)!.c).toBe(COT_TRAN)
    expect(hinhCot(1000, 600, 0, 9999)!.c).toBe(400) // 40 % phần chiếu
    expect(hinhCot(800, 600, 0, 300)).toBeNull() // cửa sổ nhỏ vẫn không dựng cột cố định
  })
  it('kéo mép trên của dải: dải cao d px ⇒ bề ngang cột tương ứng; nhớ / quên trên máy', () => {
    const c = cotTheoDai(1366, 768, 0, 113)
    expect(hinhCot(1366, 768, 0, c)!.d).toBeGreaterThanOrEqual(112); expect(hinhCot(1366, 768, 0, c)!.d).toBeLessThanOrEqual(114)
    localStorage.clear(); expect(docCotMuon()).toBeNull()
    ghiCotMuon(201.4); expect(localStorage.getItem(KHOA_COT)).toBe('201'); expect(docCotMuon()).toBe(201)
    ghiCotMuon(null); expect(docCotMuon()).toBeNull()
  })
  it('hai tay kéo: mép trên dải (dọc) và mép trái cột (ngang); đang kéo báo liên tục, nhả tay mới báo «xong»; bấm hai lần ⇒ về mặc định', () => {
    const goi: Array<[number | null, boolean]> = []
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1366 }); Object.defineProperty(window, 'innerHeight', { configurable: true, value: 768 })
    const r = render(<KeoCot xTo={0} dat={(c, xong) => goi.push([c, xong])} />)
    const ngang = r.container.querySelector<HTMLElement>('.lkt-keo.ngang')!, doc = r.container.querySelector<HTMLElement>('.lkt-keo.doc')!
    expect(ngang.getAttribute('role')).toBe('separator'); expect(ngang.getAttribute('aria-orientation')).toBe('horizontal'); expect(doc.getAttribute('aria-orientation')).toBe('vertical')
    fireEvent.pointerMove(ngang, { pointerId: 1, clientX: 500, clientY: 600 }) // chưa nhấn ⇒ không làm gì
    expect(goi).toHaveLength(0)
    fireEvent.pointerDown(ngang, { pointerId: 1, clientX: 500, clientY: 615 }); fireEvent.pointerMove(ngang, { pointerId: 1, clientX: 500, clientY: 655 }); fireEvent.pointerUp(ngang, { pointerId: 1 })
    expect(goi).toEqual([[cotTheoDai(1366, 768, 0, 768 - 655), false], [cotTheoDai(1366, 768, 0, 768 - 655), true]])
    goi.length = 0
    fireEvent.pointerDown(doc, { pointerId: 2, clientX: 1093, clientY: 300 }); fireEvent.pointerMove(doc, { pointerId: 2, clientX: 1033, clientY: 300 }); fireEvent.pointerUp(doc, { pointerId: 2 })
    expect(goi).toEqual([[333, false], [333, true]])
    goi.length = 0
    fireEvent.doubleClick(ngang)
    expect(goi).toEqual([[null, true]])
  })
  it('kiểu tay kéo chỉ dùng biến màu chuẩn; lớp nổi của thầy nối tay kéo khi cột đang dựng', () => {
    const css = readFileSync('src/components/live-khoi/thay-khoi.css', 'utf8'), thay = readFileSync('src/components/live-khoi/LopNoiThay.tsx', 'utf8')
    expect(css).toMatch(/\.lkt-keo\.ngang \{[^}]*bottom: calc\(var\(--lkc-h\) - 7px\)[^}]*cursor: ns-resize/)
    expect(css.slice(css.indexOf('.lkt-keo {'), css.indexOf('.lkt-dai-nhan {'))).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(/i)
    expect(thay).toContain('{cot ? <KeoCot xTo={xTo} dat={datCot} /> : null}')
    expect(thay).toContain('hinhCot(man.w, man.h, xTo, cotMuon)')
  })
})
