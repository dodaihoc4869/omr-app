// LIVE — SỬA KHẨN 11/11 trên MÀN CHIẾU (thầy test máy thật): chạy THẬT đoạn JS mặt live của tờ chiếu (src/lib/live-to-chieu.ts) trong DOM giả, bơm trạng thái
// `live-tt` như app gửi, đọc lại DOM + tin tờ gửi về app.
//   K3  cửa sổ của nút Live có «Tạm dừng» ⇄ «Tiếp tục» và «Kết thúc live» (bấm một lần); viên Live ghi «TẠM DỪNG» lúc dừng.
//   K4  nút Live / viên Live đứng ĐẦU thanh (mép trái); cửa sổ nút Live neo mép trái.
//   K5  lúc live các nút phím của thanh gom vào MỘT nút lưới; bấm ⇒ xoè, bấm ra ngoài / 8 giây ⇒ thu; chưa live thì thanh như cũ.
//       SỬA CÓ CHỦ ĐÍCH chiều 11/11 (thầy, kèm ảnh màn chiếu lúc CHƯA live: «Phần nút ở dưới chưa gọn, làm cho gọn lại tinh tế đẹp»): nút lưới thành nút
//       «thêm» + khay có nhãn, dùng cho MỌI trạng thái, dựng ở src/lib/thanh-day-to-chieu.ts ⇒ phần mặt live không còn nút lưới riêng, không còn ẩn
//       «Lên bảng» / nhóm phím lúc live. Luật của khay kiểm ở tests/thanh-day-1111.test.ts.
//   B2  thẻ «em rời màn» ghi KIỂU rời.   Đợt 2: thẻ gọn «N em giơ tay» ⇒ hàng chờ + «Mời nói» + «Hạ hết tay»; công tắc em ở xa chỉ hiện khi cờ `dot2` bật.
// + phần nối ở app (thay-noi.ts): tin `tam-dung` của tờ ⇒ thư viện `tamDung`; trạng thái gửi tờ có `nghi`, `roi[].kieu`.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { CSS_LIVE_TO_CHIEU, JS_LIVE_TO_CHIEU } from '../src/lib/live-to-chieu'
import { goiLenBang, moLuot, roiMan, taoPhong, viewBang, type TrangThaiPhong } from '../src/lib/bpu/phong'
import { datCoLive, liveBat, liveDat } from '../src/lib/bpu/phong-live'

type Tin = Record<string, unknown>
const NEN = { co: true, pha: 'live', tu: Date.now() - 65_000, xem: 28, tong: 30, lop: '12A1', coTieng: true, khongTieng: false, micIm: false, noiLai: false, mayKhac: false, bang: false, noi: [], ngheEm: false, chuaGui: 0, the: null, roi: [], tay: [], moi: null, micLoi: '', nghi: false, dot2: false }

const daGan: [EventTarget, string, EventListener, (boolean | AddEventListenerOptions)?][] = []
function dungTo() {
  document.body.innerHTML = '<div class="mc-thanh" id="mc-thanh"><div class="mc-buoc"></div><span class="mc-pha"></span><button id="mc-len-bang">Lên bảng</button><div class="mc-phim-nhom" id="mc-phim-nhom"><button data-k="G">G</button></div><div id="mc-tiep"></div><button id="mc-cai-btn">Cài đặt</button></div>'
  const body = document.body, thanh = document.getElementById('mc-thanh')!
  const gui: Tin[] = []
  vi.spyOn(window, 'postMessage').mockImplementation(((m: Tin) => { gui.push(m) }) as never)
  const tao = (the: string, lop: string, cha: HTMLElement) => { const e = document.createElement(the); e.className = lop; cha.appendChild(e); return e }
  // Tờ thật mỗi lần dựng là một tài liệu mới; ở đây các ca dùng chung `document` ⇒ ghi lại mọi bộ nghe tờ gắn lên document / window để gỡ sau mỗi ca.
  for (const dich of [document, window] as EventTarget[]) {
    const goc = dich.addEventListener.bind(dich)
    vi.spyOn(dich, 'addEventListener').mockImplementation(((loai: string, f: EventListener, tuy?: boolean | AddEventListenerOptions) => { daGan.push([dich, loai, f, tuy]); goc(loai, f, tuy) }) as never)
  }
  new Function('body', 'tao', 'thanh', 'dichApp', 'baoNhanh', 'dot', JS_LIVE_TO_CHIEU)(body, tao, thanh, () => window, () => {}, () => null)
  vi.mocked(document.addEventListener).mockRestore(); vi.mocked(window.addEventListener).mockRestore()
  const bom = (tt: Tin | null) => { window.dispatchEvent(new MessageEvent('message', { data: { nguon: 'bpu-bang', lenh: 'live-tt', tt }, source: window })) }
  const viec = (v: string) => gui.filter((m) => m.loai === 'live' && m.viec === v)
  return { thanh, gui, bom, viec, the: () => document.querySelector<HTMLElement>('.mc-lv-the')!, cot: () => document.querySelector<HTMLElement>('.mc-lv-roi')! }
}
const bam = (goc: ParentNode, chu: string | RegExp) => {
  const b = [...goc.querySelectorAll<HTMLElement>('button')].find((x) => (typeof chu === 'string' ? (x.textContent ?? '').trim() === chu : chu.test(x.textContent ?? '')))
  expect(b, `nút «${chu}»`).toBeTruthy()
  b!.click()
}

beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { for (const [dich, loai, f, tuy] of daGan.splice(0)) dich.removeEventListener(loai, f, tuy); vi.useRealTimers(); vi.restoreAllMocks(); document.body.innerHTML = ''; document.body.className = '' })

describe('K3 · cửa sổ nút Live: Tạm dừng / Tiếp tục / Kết thúc live', () => {
  it('đang live: bấm viên Live ⇒ app mở cửa sổ; cửa sổ có «Tạm dừng», «Kết thúc live», công tắc «Bảng → máy em»; bấm ⇒ gửi đúng một tin', () => {
    const t = dungTo()
    t.bom(NEN)
    document.querySelector<HTMLElement>('.mc-lv-cum')!.click()
    expect(t.viec('bam').length).toBe(1)
    t.bom({ ...NEN, the: { ds: [{ id: 'm1', ten: 'Micro không dây' }], chon: 'm1', loi: '', tiengLop: false, xa: false } })
    const the = t.the()
    expect(the.hidden).toBe(false)
    expect(the.querySelector('h3')!.textContent).toBe('Đang live')
    for (const chu of ['Tạm dừng', 'Kết thúc live', 'Xong', 'Bảng → máy em']) expect(the.textContent).toContain(chu)
    bam(the, 'Tạm dừng')
    expect(t.viec('tam-dung')).toEqual([{ nguon: 'to-chieu', loai: 'live', viec: 'tam-dung', v: true }])
    bam(the, /Kết thúc live/)
    expect(t.viec('tat').length).toBe(1) // bấm MỘT lần là kết thúc
    bam(the, 'Đang tắt') // công tắc «Bảng → máy em» (đang tắt ⇒ bật)
    expect(t.viec('bang')).toEqual([{ nguon: 'to-chieu', loai: 'live', viec: 'bang', v: true }])
  })
  it('đang tạm dừng: viên Live ghi «TẠM DỪNG» (màu nhắc, không còn vạch mic); cửa sổ ghi «Đang tạm dừng live» + «Tiếp tục»', () => {
    const t = dungTo()
    t.bom({ ...NEN, nghi: true, the: { ds: [], chon: '', loi: '', tiengLop: false, xa: false } })
    const cum = document.querySelector<HTMLElement>('.mc-lv-cum')!
    expect(cum.textContent).toContain('TẠM DỪNG')
    expect(cum.className).toContain('vang')
    expect(cum.querySelector('.mc-lv-muc')).toBeNull()
    expect(t.the().querySelector('h3')!.textContent).toBe('Đang tạm dừng live')
    bam(t.the(), 'Tiếp tục')
    expect(t.viec('tam-dung')).toEqual([{ nguon: 'to-chieu', loai: 'live', viec: 'tam-dung', v: false }])
    // không còn nút «Tắt live» / «Bảng → máy em» nằm rời trên thanh
    expect(t.thanh.querySelector('.mc-lv-tat, .mc-lv-bg')).toBeNull()
  })
})

describe('K4 · K5 · nút Live đầu thanh, cửa sổ neo trái; nút lưới «thêm» + khay nay ở thanh-day-to-chieu.ts', () => {
  it('nút Live, viên Live là hai phần tử ĐẦU của thanh; CSS neo cửa sổ nút Live sang trái', () => {
    const t = dungTo()
    expect([...t.thanh.children].slice(0, 3).map((e) => e.className)).toEqual(['mc-lv-nut', 'mc-lv-cum', 'mc-buoc'])
    expect(CSS_LIVE_TO_CHIEU).toMatch(/\.mc-lv-the\{right:auto;left:calc\(var\(--u\)\*\.75\)\}/)
  })
  it('mặt live KHÔNG còn tự gom thanh: không dựng nút lưới riêng, không ẩn «Lên bảng» / nhóm phím / «Cài đặt» lúc live, không lớp mc-lv-xoe (một cơ chế chung ở thanh-day-to-chieu.ts)', () => {
    const t = dungTo()
    t.bom(NEN)
    expect(document.body.classList.contains('mc-live')).toBe(true)
    expect(t.thanh.querySelector('.mc-lv-gon')).toBeNull() // nút «thêm» do thanh-day-to-chieu.ts dựng, không phải mặt live
    expect(JS_LIVE_TO_CHIEU).not.toMatch(/lvGon|lvXoe|mc-lv-xoe/)
    // 12/11 live theo khối: riêng CHẾ ĐỘ BẢNG (`body.mc-che-bang`, bảng xanh than kín màn) được ẩn «Lên bảng» / nhóm phím — không phải gom thanh lúc live thường.
    expect(CSS_LIVE_TO_CHIEU.replace(/^body\.mc-che-bang[^\n]*$/gm, '')).not.toMatch(/mc-lv-xoe|#mc-len-bang|#mc-phim-nhom|#mc-cai-btn/)
    // nhãn chữ của nút không còn bị ẩn riêng lúc live (trước: «T», «Tab», «P» trơ trọi; «?» biến mất)
    expect(CSS_LIVE_TO_CHIEU).not.toMatch(/mc-live[^{]*\.mc-nut-chu|mc-live[^{]*\[data-k="\?"\]/)
    // dáng nút lưới vẫn khai ở đây (cổng giữ màu so theo tệp) — thanh-day-to-chieu.ts dùng lại lớp .mc-lv-gon
    expect(CSS_LIVE_TO_CHIEU).toContain('body.mc .mc-thanh .mc-lv-gon{')
    t.bom({ ...NEN, pha: 'tat', tu: null })
    expect(document.body.classList.contains('mc-live')).toBe(false)
  })
  it('phím tắt V vẫn chạy khi thanh đang gom', () => {
    const t = dungTo()
    t.bom(NEN)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'v', bubbles: true }))
    expect(t.viec('bam').length).toBe(1)
  })
})

describe('B1 · tờ đo bố cục giấy đề', () => {
  it('biểu thức chính quy trong chuỗi chèn vào tờ còn nguyên dấu gạch chéo ngược (viết `\\\\s` trong nguồn) — lỗi này làm tờ báo nhầm «giấy có khối lạ»', () => {
    expect(JS_LIVE_TO_CHIEU).toContain('/\\S/.test(n.data)')
    expect(JS_LIVE_TO_CHIEU).toContain('(^|\\s)(mc-de|mc-ds-pa|mc-ngan)(\\s|$)')
    expect(JS_LIVE_TO_CHIEU).toContain(".replace(/\\D+/g, '')")
    expect(JS_LIVE_TO_CHIEU).not.toMatch(/\/S\/\.test|\(\^\|s\)/)
  })
  it('tờ có giấy đề chữ thường ⇒ gửi app bố cục CHỈ GỒM SỐ (không chữ đề, không đáp án), `la` = false; giấy có ảnh ⇒ `la` = true', () => {
    document.body.innerHTML = '<div class="mc-thanh" id="mc-thanh"></div><div id="dot"><div class="mc-vung-de"><div class="mc-de-dau"><span class="mc-de-so">Câu 7</span><span class="mc-de-phan">Phần I · Trắc nghiệm</span></div><div class="mc-than"><div class="mc-de">Chất nào là amine bậc hai?</div><div class="mc-ds-pa mc-auto-options"><div class="mc-pa mc-pa-dung"><span class="mc-ky">A</span><span class="mc-pa-chu">CH3NH2</span></div><div class="mc-pa"><span class="mc-ky">B</span><span class="mc-pa-chu">CH3NHCH3</span></div></div></div><div class="mc-giai">Đáp án B vì …</div></div></div>'
    const gui: Tin[] = []
    vi.spyOn(window, 'postMessage').mockImplementation(((m: Tin) => { gui.push(m) }) as never)
    // jsdom không dàn trang ⇒ giả hộp của mọi phần tử (đủ để tờ coi là «đang hiện»)
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) { const sau = this.classList.contains('mc-vung-de') ? 0 : 20; return { left: 10 + sau, top: 10 + sau, right: 910, bottom: 710, width: 900 - sau, height: 700 - sau, x: 10, y: 10, toJSON() {} } as DOMRect })
    ;(Range.prototype as unknown as { getClientRects: () => unknown[] }).getClientRects = () => [{ left: 380, right: 400, top: 60, bottom: 90 }]
    ;(window as unknown as { __mcBut: unknown }).__mcBut = { trang: () => '3', nghe() {}, vung: () => ({}), xuat: () => ({ tiLe: 16 / 9, net: [] }), bat() {} }
    const thanh = document.getElementById('mc-thanh')!
    for (const dich of [document, window] as EventTarget[]) { const goc = dich.addEventListener.bind(dich); vi.spyOn(dich, 'addEventListener').mockImplementation(((loai: string, f: EventListener, tuy?: boolean | AddEventListenerOptions) => { daGan.push([dich, loai, f, tuy]); goc(loai, f, tuy) }) as never) }
    new Function('body', 'tao', 'thanh', 'dichApp', 'baoNhanh', 'dot', JS_LIVE_TO_CHIEU)(document.body, (the: string, lop: string, cha: HTMLElement) => { const e = document.createElement(the); e.className = lop; cha.appendChild(e); return e }, thanh, () => window, () => {}, () => document.getElementById('dot'))
    vi.mocked(document.addEventListener).mockRestore(); vi.mocked(window.addEventListener).mockRestore()
    window.dispatchEvent(new MessageEvent('message', { data: { nguon: 'bpu-bang', lenh: 'live-tt', tt: NEN }, source: window }))
    vi.advanceTimersByTime(100)
    const g = gui.filter((m) => m.viec === 'giay').pop()!.giay as { k: string; w: number; h: number; la: boolean; o: number[][] }
    expect(g).toMatchObject({ k: '3', w: 900, h: 700, la: false })
    expect(g.o.map((b) => b[0])).toEqual([0, 1, 2, 5, 4, 3, 5, 4, 3]) // số câu · phần · đề · (khung, ký hiệu, chữ) × 2 phương án
    expect(g.o[0]![1]).toBe(7) // «Câu 7» đi bằng SỐ
    expect(g.o.every((b) => b.length === 11 && b.every((n) => Number.isInteger(n)))).toBe(true)
    const chu = JSON.stringify(g)
    expect(chu).not.toMatch(/amine|CH3|Đáp án|dung/) // không chữ đề, không lời giải, không dấu phương án đúng
    // giấy có ảnh ⇒ máy em không soi (dùng cách dựng thường, ẩn nét trên giấy)
    document.querySelector('.mc-than')!.appendChild(document.createElement('img'))
    vi.advanceTimersByTime(1100)
    expect((gui.filter((m) => m.viec === 'giay').pop()!.giay as { la: boolean }).la).toBe(true)
    expect(g.o[2]!.slice(9)).toEqual([400 - 10 - 20, 60 - 10 - 20]) // chỗ hết chữ của khối đề, tính từ góc hộp chữ
    delete (window as unknown as { __mcBut?: unknown }).__mcBut
    delete (Range.prototype as unknown as { getClientRects?: unknown }).getClientRects
  })
})

describe('B2 + đợt 2 trên màn chiếu', () => {
  it('thẻ «em rời màn» mở ra ghi kiểu rời của từng em; em báo bằng bản cũ (không kiểu) ⇒ ghi «rời màn»', () => {
    const t = dungTo()
    t.bom({ ...NEN, roi: [{ sbd: 'S1', ten: 'Nguyễn Thị Hà', ky: 'NH', doi: 'Đội Natri', mau: '', luc: Date.now(), kieu: 'chia đôi màn hình' }, { sbd: 'S2', ten: 'Lê Gia Huy', ky: 'LH', doi: 'Đội Kali', mau: '', luc: Date.now(), kieu: '' }] })
    const mo = t.cot().querySelector('.mc-lv-roi-mo')!
    expect(mo.textContent).toContain('2 em rời màn')
    const dong = [...mo.querySelectorAll('.mc-lv-em small')].map((e) => e.textContent ?? '')
    expect(dong[0]).toMatch(/^Đội Natri · chia đôi màn hình · \d+:\d\d$/)
    expect(dong[1]).toMatch(/^Đội Kali · rời màn · \d+:\d\d$/)
  })
  it('giơ tay: thẻ gọn «2 em giơ tay» ⇒ bấm mở hàng chờ theo thứ tự, mỗi em «Mời nói», dưới cùng «Hạ hết tay»; em đang nói có sóng âm + «Thu mic» + «Tắt mic tất cả»', () => {
    const t = dungTo()
    const tay = [{ sbd: 'S1', ten: 'Nguyễn Thị Hà', ky: 'NH', doi: 'Đội Natri', mau: '', luc: 1 }, { sbd: 'S2', ten: 'Lê Gia Huy', ky: 'LH', doi: 'Đội Kali', mau: '', luc: 2 }]
    t.bom({ ...NEN, tay })
    const gon = t.cot().querySelector<HTMLElement>('.mc-lv-tay-gon')!
    expect(gon.textContent).toContain('2 em giơ tay')
    gon.click()
    const hang = t.cot().querySelector('.mc-lv-tay')!
    expect([...hang.querySelectorAll('.mc-lv-em span')].map((e) => e.firstChild!.textContent)).toEqual(['Nguyễn Thị Hà', 'Lê Gia Huy'])
    bam(hang, 'Mời nói')
    expect(t.viec('moi')).toEqual([{ nguon: 'to-chieu', loai: 'live', viec: 'moi', sbd: 'S1' }])
    bam(hang, 'Hạ hết tay')
    expect(t.viec('ha-tay')).toEqual([{ nguon: 'to-chieu', loai: 'live', viec: 'ha-tay' }])
    t.bom({ ...NEN, tay: [tay[1]], noi: [{ sbd: 'S1', ten: 'Nguyễn Thị Hà', ky: 'NH', doi: 'Đội Natri', mau: '' }], moi: null })
    const noi = t.cot().querySelector('.mc-lv-noi')!
    expect(noi.querySelector('h3')!.textContent).toBe('Đang nói')
    expect(noi.querySelector('#mc-lv-me')!.children.length).toBe(5)
    bam(noi, 'Thu mic')
    bam(noi, 'Tắt mic tất cả')
    expect(t.viec('thu-mic')).toEqual([{ nguon: 'to-chieu', loai: 'live', viec: 'thu-mic', sbd: 'S1' }, { nguon: 'to-chieu', loai: 'live', viec: 'thu-mic' }])
    t.bom({ ...NEN, moi: { sbd: 'S2', ten: 'Lê Gia Huy', ky: 'LH', doi: 'Đội Kali', mau: '' }, micLoi: 'Nguyễn Thị Hà' })
    expect(t.cot().textContent).toContain('đã mời · chờ em bật mic')
    expect(t.cot().textContent).toContain('Nguyễn Thị Hà: chưa bật được mic')
  })
  // SỬA CÓ CHỦ ĐÍCH 12/11 — thầy: bỏ chữ giải thích («làm cái bảng này gọn lại, bỏ hết mấy chỗ giải thích đi, trực quan dễ dùng»): cửa sổ không còn câu
  // «Máy em TRONG LỚP đang tắt tiếng…» / «N em đang nghe qua máy» — nút «Em ở xa» / «Tất cả» được nhấn nói chế độ, số em nghe đứng cạnh nhãn «Máy em».
  it('viên Live đếm cả số em ĐANG NGHE cạnh số em xem; cửa sổ ghi số em nghe cạnh nhãn «Máy em», nút đang nhấn nói chế độ tiếng máy em', () => {
    expect(JS_LIVE_TO_CHIEU).toContain("LV_BT.loa + '<b>' + (t.nghe || 0) + '</b></span>'") // 13/11 viên Live gọn: biểu tượng loa + số (không còn chữ «em nghe» trong viên)
    expect(JS_LIVE_TO_CHIEU).toContain("(t.xem && !t.nghe ? 'im' : '')") // có em xem mà 0 em nghe ⇒ tô cảnh báo
    expect(JS_LIVE_TO_CHIEU).not.toContain('Máy em TRONG LỚP đang tắt tiếng')
    expect(JS_LIVE_TO_CHIEU).not.toContain('em đang nghe qua máy')
    expect(JS_LIVE_TO_CHIEU).not.toContain('Em trong lớp nghe thầy trực tiếp')
    const t = dungTo()
    t.bom({ ...NEN, nghe: 7, the: { ds: [], chon: '', loi: '', tiengLop: false, xa: false } })
    const hang = [...t.the().querySelectorAll<HTMLElement>('.mc-lv-cai')].find((x) => x.querySelector('[data-lv="tieng-lop"]'))!
    expect(hang.querySelector('b')!.textContent).toBe('Máy em 7 em nghe')
    expect(hang.querySelector('[data-v="0"]')!.getAttribute('aria-pressed')).toBe('true') // «Em ở xa»
    bam(hang, 'Tất cả')
    expect(t.viec('tieng-lop')).toEqual([{ nguon: 'to-chieu', loai: 'live', viec: 'tieng-lop', v: true }])
  })
  it('công tắc «Cho em ở xa vào xem» chỉ hiện khi giao diện đợt 2 mở (`dot2`)', () => {
    const t = dungTo(), the = { ds: [], chon: '', loi: '', tiengLop: false, xa: false }
    t.bom({ ...NEN, the })
    expect(t.the().textContent).not.toContain('Cho em ở xa vào xem')
    t.bom({ ...NEN, dot2: true, the })
    expect(t.the().textContent).toContain('Cho em ở xa vào xem')
  })
})

// ── Phần nối ở app (thay-noi.ts) ──
const goi: [string, unknown[]][] = []
vi.mock('../src/lib/live', () => ({
  taoLiveThay: () => {
    const ghi = (ten: string) => (...a: unknown[]) => { goi.push([ten, a]) }
    return { noiSan: async () => {}, dsMic: async () => [], moMic: async () => ({ ok: true }), bat: async () => ({ ok: true }), tat: ghi('tat'), thaMic: ghi('thaMic'), mucAm: () => 0, mucAmEm: () => 0, dat: ghi('dat'),
      thuMic: ghi('thuMic'), datNgheEm: ghi('datNgheEm'), nhanSuKienBut: ghi('nhanSuKienBut'), guiAnh: ghi('guiAnh'), nhanTinPhong: ghi('nhanTinPhong'), khiNoiLai: ghi('khiNoiLai'), huy: ghi('huy'),
      tamDung: ghi('tamDung'), moiNoi: ghi('moiNoi'), haTay: ghi('haTay') }
  },
}))
vi.mock('../src/components/bpu/gan-gv', () => ({ datLive: () => {} }))
class WsGia extends EventTarget { readyState = 1; binaryType = 'blob'; send() {} mo() { this.dispatchEvent(new Event('open')) }
  nhan(v: unknown) { this.dispatchEvent(Object.assign(new Event('message'), { data: JSON.stringify(v) })) } }

describe('phần nối ở app: tạm dừng + kiểu rời tới tờ', () => {
  it('tờ gửi `tam-dung` ⇒ thư viện `tamDung(true / false)`; `tat` ⇒ kết thúc; trạng thái gửi tờ có `nghi` theo phòng và `roi[].kieu` bằng chữ', async () => {
    vi.useRealTimers()
    goi.length = 0; localStorage.clear()
    vi.resetModules()
    const M = await import('../src/components/live/thay-noi')
    const C = await import('../src/components/bpu/cau-live')
    const tin: Tin[] = []
    const to = { postMessage: (m: Tin) => { tin.push(m) } } as unknown as Window
    const ws = new WsGia()
    const ttCuoi = () => [...tin].reverse().find((m) => m.lenh === 'live-tt')!.tt as Record<string, any>
    const T0 = Date.now()
    const st: TrangThaiPhong = taoPhong({ buoiId: 'b1', lop: '12A1', nay: T0, ds: [{ sbd: 'S1', ten: 'Nguyễn Thị Hà', coMat: true, luc: T0 }, { sbd: 'S2', ten: 'Lê Gia Huy', coMat: true, luc: T0 }] })
    datCoLive(st, { cho: true, sfu: true }, T0)
    moLuot(st, { qid: 'q1', phan: 'I', tuLuan: false, cau: { qid: 'q1', text: 'Đề' }, dung: 'B', hanGiay: 0 }, T0)
    C.noiLive(ws as unknown as WebSocket, 've-gv', 'https://may-chu'); ws.mo()
    M.nhanTinTo({ viec: 'chao' }, to)
    liveBat(st, T0 + 1); ws.nhan(viewBang(st))
    await new Promise((r) => setTimeout(r, 0))
    expect(ttCuoi()).toMatchObject({ pha: 'live', nghi: false, dot2: false })
    M.nhanTinTo({ viec: 'tam-dung', v: true }, to)
    expect(goi.filter(([t]) => t === 'tamDung').map(([, a]) => a)).toEqual([[true]])
    liveDat(st, { nghi: true }, T0 + 2); goiLenBang(st, 'S2', [], T0 + 3); roiMan(st, 'S1', T0 + 4, 'noi'); ws.nhan(viewBang(st))
    expect(ttCuoi()).toMatchObject({ pha: 'live', nghi: true, bang: true })
    expect(ttCuoi().roi).toMatchObject([{ sbd: 'S1', ten: 'Nguyễn Thị Hà', kieu: 'cửa sổ nổi' }])
    M.nhanTinTo({ viec: 'tam-dung', v: false }, to)
    M.nhanTinTo({ viec: 'tat' }, to)
    expect(goi.filter(([t]) => t === 'tamDung').map(([, a]) => a)).toEqual([[true], [false]])
    expect(goi.filter(([t]) => t === 'tat').length).toBe(1)
    M._datLaiLiveThay()
  })
})

describe('«Chỉ giọng thầy» trên bảng mic của tờ chiếu (12/11 trưa — nút luôn hiện ở app thầy, src/lib/live/chi-thay.ts)', () => {
  const THE = { ds: [{ id: 'm1', ten: 'Microphone (BOYALINK)' }], chon: 'm1', loi: '', tiengLop: false, xa: false }
  const MIC = { tinh: 'tot', ten: 'Microphone (BOYALINK)', loc: false, cheDo: 'tu', locOn: 'manh', locOnChay: 'chay', khac: '', kieuTieng: 'lam-ro', tg: '' }
  it('mic.coThay ⇒ hàng «Lọc ồn» có 4 nút Mạnh / Vừa / Tắt / Chỉ giọng thầy; bấm ⇒ gửi loc-on = thay', () => {
    const t = dungTo()
    t.bom({ ...NEN, the: THE, mic: { ...MIC, coThay: true } })
    const nut = [...t.the().querySelectorAll<HTMLElement>('[data-lv="loc-on"]')].map((b) => (b.textContent ?? '').trim())
    expect(nut).toEqual(['Mạnh', 'Vừa', 'Tắt', 'Chỉ giọng thầy'])
    bam(t.the(), 'Chỉ giọng thầy')
    expect(t.viec('loc-on')).toEqual([{ nguon: 'to-chieu', loai: 'live', viec: 'loc-on', v: 'thay' }])
  })
  // SỬA CÓ CHỦ ĐÍCH 12/11 — thầy: bỏ chữ giải thích: không còn dòng «Chỉ giọng thầy — hạ giọng người khác»; dòng mô hình chuyển vào «Chi tiết» (đóng sẵn).
  it('đang chọn «Chỉ giọng thầy» ⇒ nút ấy được nhấn, KHÔNG dòng giải thích, dòng trạng thái mô hình nằm trong «Chi tiết»; lùi khẩn (coThay false) ⇒ không có nút', () => {
    const t = dungTo()
    t.bom({ ...NEN, the: THE, mic: { ...MIC, coThay: true, locOn: 'thay', tg: 'Mô hình ck-h-51000' } })
    const b = [...t.the().querySelectorAll<HTMLElement>('[data-lv="loc-on"]')].find((x) => x.getAttribute('data-c') === 'thay')!
    expect(b.getAttribute('aria-pressed')).toBe('true')
    expect(t.the().textContent).not.toContain('hạ giọng người khác')
    const ct = t.the().querySelector<HTMLDetailsElement>('details.mc-lv-ct')!
    expect(ct.open).toBe(false)
    expect(ct.textContent).toContain('Mô hình ck-h-51000')
    t.bom({ ...NEN, the: THE, mic: { ...MIC, coThay: false } })
    expect(t.the().querySelector('[data-c="thay"]')).toBeNull()
  })
})

// BẢNG MIC GỌN — thầy yêu cầu thẳng 12/11 trưa (kèm ảnh bảng mic Live trên màn chiếu): «làm cái bảng này gọn lại, bỏ hết mấy chỗ giải thích đi, trực quan dễ dùng».
// Mỗi cài đặt MỘT hàng (nhãn · thanh phân đoạn); không câu mô tả; chữ chỉ khi có vấn đề; «Chi tiết» (đóng sẵn) giữ dòng mô hình + đo tiếng + chẩn đoán mic.
// Bố cục thật (mọi nút một hàng cùng đỉnh, ≥ 40 px, bảng không tràn mép trên ở 1366×768 / 1920×1080) đo bằng Chromium: ảnh + số đo của phiên 12/11.
describe('bảng mic gọn (12/11 trưa)', () => {
  const THE = { ds: [{ id: 'boya', ten: 'Microphone (BOYALINK)' }, { id: 'arr', ten: 'Microphone Array (Realtek(R) Audio)' }], chon: 'boya', loi: '', tiengLop: true, xa: false,
    loa: { ds: [{ id: 'spk', ten: 'Speakers (Realtek(R) Audio)' }, { id: 'hdmi', ten: 'EPSON PJ (HDMI)' }], chon: 'spk' } }
  const MIC = { tinh: 'tot', ten: 'Microphone (BOYALINK)', loc: false, cheDo: 'tu', locOn: 'vua', locOnChay: 'chay', khac: '', kieuTieng: 'lam-ro' }
  const DO = ['Máy thầy gửi: 65 kb/s · mức nguồn 41 · ICE connected (udp)', 'Máy thầy nhận tiếng em: chưa có em nào đang nói', 'Đỗ Đại Học: ICE ok · 48 kb/s']
  const LIVE = { ...NEN, bang: true, doTieng: DO, the: THE, mic: MIC, lyDoKT: '' }
  const canh = (t: ReturnType<typeof dungTo>) => [...t.the().querySelectorAll('.mc-lv-canh')].map((p) => (p.textContent ?? '').trim())
  const muc = (cd: string) => { window.dispatchEvent(new MessageEvent('message', { data: { nguon: 'bpu-bang', lenh: 'live-muc', v: 0.7, em: 0, cd }, source: window })) }

  it('không còn câu mô tả / phụ đề: trạng thái bình thường chỉ có nhãn + nút; mọi đoạn chữ (p) chỉ nằm trong «Chi tiết»', () => {
    const t = dungTo()
    t.bom(LIVE)
    const chu = t.the().textContent ?? ''
    for (const bo of ['em đã vào phòng', 'Mức âm đang gửi cho lớp', 'bớt ồn nền', 'giữ giọng tự nhiên', 'chuỗi làm rõ', 'như Meet', 'chống vọng', 'giọng trong nhất', 'Tiếng em nói sẽ phát ra loa này',
      'Mọi máy em đang phát tiếng thầy', 'đeo tai nghe', 'Đưa cả lớp vào bảng live ngay', 'Cắm lại bộ thu', 'Tiếng trên máy em']) expect(chu, bo).not.toContain(bo)
    expect(canh(t)).toEqual([])
    expect(t.the().querySelectorAll('[role="alert"]').length).toBe(0)
    expect([...t.the().querySelectorAll('p')].every((p) => p.closest('details.mc-lv-ct'))).toBe(true)
    expect(t.the().querySelector('h3')!.textContent).toBe('Đang live')
    muc('')
    expect(document.getElementById('mc-lv-nx')!.textContent).toBe('Hơi to') // mức âm: vạch + chữ ngắn
  })
  it('mỗi cài đặt MỘT hàng: nhãn ngắn + MỘT thanh phân đoạn chứa mọi nút của nó; Loa: ô chọn + «Thử loa» cùng hàng; «Chỉ giọng thầy» (4 nút) ⇒ thanh xuống hàng riêng dưới nhãn', () => {
    const t = dungTo()
    t.bom(LIVE)
    const hang = [...t.the().querySelectorAll<HTMLElement>('.mc-lv-cai')]
    // SỬA CÓ CHỦ ĐÍCH 13/11 — thầy: «chỉ thêm tăng tiếng thôi» ⇒ thêm đúng MỘT hàng «Tăng tiếng» ngay dưới «Tiếng»
    expect(hang.map((h) => h.querySelector('b')!.firstChild!.textContent)).toEqual(['Mức âm', 'Lọc ồn', 'Tiếng', 'Tăng tiếng', 'Khử vọng', 'Máy em', 'Bảng → máy em'])
    for (const h of hang.slice(1)) {
      const seg = h.querySelectorAll('.mc-lv-seg')
      expect(seg.length).toBe(1)
      expect(h.querySelectorAll('button').length).toBe(seg[0]!.querySelectorAll('button').length)
      expect(seg[0]!.getAttribute('role')).toBe('group')
    }
    expect(hang.map((h) => h.querySelectorAll('button').length)).toEqual([0, 3, 2, 4, 3, 2, 1]) // SỬA CÓ CHỦ ĐÍCH 13/11: + hàng «Tăng tiếng» (4 nút)
    expect(hang.some((h) => h.classList.contains('doc'))).toBe(false)
    const loa = t.the().querySelector('.mc-lv-loa')!
    expect(loa.querySelector('select[data-c="loa"]')).toBeTruthy()
    expect(loa.querySelector('[data-lv="thu-loa"]')!.textContent).toBe('Thử loa')
    t.bom({ ...LIVE, mic: { ...MIC, coThay: true } })
    expect(t.the().querySelector('[data-c="thay"]')!.closest('.mc-lv-cai')!.classList.contains('doc')).toBe(true)
    // CSS: thanh phân đoạn không xuống dòng lộn xộn; nút trong bảng ≥ 40 px; luật mới chỉ trong bảng (thẻ «Đang nói» giữ .mc-lv-n.nho cũ)
    expect(CSS_LIVE_TO_CHIEU).toContain('.mc-lv-seg{display:flex;')
    expect(CSS_LIVE_TO_CHIEU).toContain('.mc-lv-seg .mc-lv-n{flex:1 1 auto;height:max(40px,')
    expect(CSS_LIVE_TO_CHIEU).not.toMatch(/flex-wrap:wrap/)
    expect(CSS_LIVE_TO_CHIEU).toContain('.mc-lv-n.nho{height:calc(var(--u)*2.3)')
    expect(CSS_LIVE_TO_CHIEU).toMatch(/\.mc-lv-the\{max-height:calc\(100vh - var\(--u\)\*6\);overflow-y:auto/)
  })
  it('cảnh báo CHỈ khi có vấn đề, mỗi thứ một dòng ngắn: mic dự phòng · mic im / bị tắt / bị rút · «Chỉ giọng thầy» tự tắt · mất đường tiếng · loa', () => {
    const t = dungTo()
    t.bom({ ...LIVE, mic: { ...MIC, khac: 'Microphone (BOYALINK)', ten: 'Microphone Array (Realtek(R) Audio)' } })
    expect(canh(t)).toEqual(['Không mở được BOYALINK — đang dùng mic máy'])
    expect(t.the().querySelector('.mc-lv-ct')!.textContent).toContain('Đã chọn «Microphone (BOYALINK)» · lớp đang nghe Microphone Array (Realtek(R) Audio)')
    t.bom({ ...LIVE, mic: { ...MIC, coThay: true, locOn: 'thay', tg: 'Đã tự tắt (máy chạy không kịp) — lớp nghe tiếng như trước' } })
    expect(canh(t)).toEqual(['Chỉ giọng thầy đã tự tắt: máy chạy không kịp'])
    t.bom({ ...LIVE, mic: { ...MIC, coThay: true, locOn: 'thay', tg: 'Đang tải mô hình giọng thầy…' } })
    expect(canh(t)).toEqual([]) // đang tải: không phải lỗi ⇒ chỉ ở «Chi tiết»
    for (const [tinh, dau] of [['im', 'Mic chưa có tín hiệu'], ['bi-tat', 'Mic đang bị tắt tiếng'], ['mat', 'Mic vừa bị rút']]) {
      t.bom({ ...LIVE, mic: { ...MIC, tinh } })
      expect(canh(t).length).toBe(1)
      expect(canh(t)[0]).toMatch(new RegExp('^' + dau))
    }
    t.bom({ ...LIVE, khongTieng: true, lyDoKT: 'Mạng chặn đường tiếng' })
    expect(canh(t)).toEqual(['Mạng chặn đường tiếng — lớp chưa nghe tiếng thầy'])
    t.bom({ ...LIVE, the: { ...THE, loa: { ...THE.loa, thu: 'loi', trung: 'Microphone (BOYALINK)' } } })
    expect(canh(t)).toEqual(['Loa đang là bộ thu mic — chọn loa khác rồi bấm «Thử loa»', 'Chưa phát được ra loa này — chọn loa khác'])
    t.bom(LIVE)
    expect(canh(t)).toEqual([])
    // lý do tự tắt đọc từ dòng trạng thái app soạn — đổi chữ ở thay-noi.ts thì cảnh báo câm ⇒ khoá chữ
    expect(readFileSync('src/components/live/thay-noi.ts', 'utf8')).toContain('`Đã tự tắt (${')
  })
  it('«Chi tiết» ở cuối, mặc định ĐÓNG, chữ nhỏ: tên mic + dòng mô hình + đo tiếng + chẩn đoán mic (#mc-lv-cd); đang mở thì giữ mở qua mỗi lần vẽ lại; đóng bảng rồi mở ⇒ đóng', () => {
    const t = dungTo()
    t.bom({ ...LIVE, mic: { ...MIC, coThay: true, locOn: 'thay', tg: 'Mô hình ck-h-51000 · luyện 12/11 · máy này chạy 8 % thời gian thực' } })
    const ct = () => t.the().querySelector<HTMLDetailsElement>('details.mc-lv-ct')!
    expect(ct().open).toBe(false)
    expect(t.the().lastElementChild).toBe(ct())
    expect(ct().querySelector('summary')!.textContent).toBe('Chi tiết')
    for (const d of [...DO, 'Mô hình ck-h-51000 · luyện 12/11']) expect(ct().textContent).toContain(d)
    muc('mic «Microphone (BOYALINK)» · 48000 Hz')
    expect(ct().querySelector('#mc-lv-cd')!.textContent).toBe('mic «Microphone (BOYALINK)» · 48000 Hz')
    ct().open = true
    t.bom({ ...LIVE, doTieng: [...DO.slice(0, 2), 'Đỗ Đại Học: ICE ok · 50 kb/s'] }) // app gửi lại ~1 giây / lần
    expect(ct().open).toBe(true)
    expect(ct().textContent).toContain('50 kb/s')
    expect(ct().querySelector('#mc-lv-cd')!.textContent).toBe('mic «Microphone (BOYALINK)» · 48000 Hz') // chẩn đoán mic không mất khi vẽ lại
    muc('mic mới')
    expect(document.getElementById('mc-lv-cd')!.textContent).toBe('mic mới')
    t.bom({ ...LIVE, the: null })
    expect(t.the().hidden).toBe(true)
    t.bom(LIVE)
    expect(ct().open).toBe(false)
  })
  it('GIỮ NGUYÊN mọi data-lv / data-c / data-v, aria-pressed và tin gửi app', () => {
    const t = dungTo()
    t.bom({ ...LIVE, mic: { ...MIC, coThay: true, locOn: 'manh', cheDo: 'bat', kieuTieng: 'chuan' } })
    const ds = [...t.the().querySelectorAll<HTMLElement>('[data-lv]')].map((b) => b.getAttribute('data-lv') + ':' + (b.getAttribute('data-c') ?? b.getAttribute('data-v') ?? '') + (b.getAttribute('aria-pressed') === 'true' ? '*' : ''))
    // SỬA CÓ CHỦ ĐÍCH 13/11 — thầy: «chỉ thêm tăng tiếng thôi» ⇒ thêm bốn nút «Tăng tiếng» (mic không báo bậc ⇒ Gốc được nhấn); mọi nút cũ giữ nguyên
    expect(ds).toEqual(['loc-on:manh*', 'loc-on:vua', 'loc-on:tat', 'loc-on:thay', 'kieu-tieng:lam-ro', 'kieu-tieng:chuan*', 'tang:0*', 'tang:3', 'tang:6', 'tang:9', 'loc:tu', 'loc:bat*', 'loc:tat', 'thu-loa:', 'tieng-lop:0', 'tieng-lop:1*',
      'bang:0*', 'tam-dung:1', 'tat:', 'the-dong:'])
    bam(t.the(), 'Bật')
    bam(t.the(), 'Chuẩn trình duyệt')
    bam(t.the(), 'Vừa')
    bam(t.the(), 'Thử loa')
    bam(t.the(), 'Đang bật')
    expect(t.gui.filter((m) => m.loai === 'live' && m.viec !== 'chao').map((m) => [m.viec, m.v])).toEqual([['loc', 'bat'], ['kieu-tieng', 'chuan'], ['loc-on', 'vua'], ['thu-loa', undefined], ['bang', false]])
    const chon = (sel: string, v: string) => { const s = t.the().querySelector<HTMLSelectElement>(sel)!; s.value = v; s.dispatchEvent(new Event('change', { bubbles: true })) }
    chon('select[aria-label="Chọn mic"]', 'arr')
    chon('select[data-c="loa"]', 'hdmi')
    expect(t.viec('chon-mic')).toEqual([{ nguon: 'to-chieu', loai: 'live', viec: 'chon-mic', id: 'arr' }])
    expect(t.viec('chon-loa')).toEqual([{ nguon: 'to-chieu', loai: 'live', viec: 'chon-loa', id: 'hdmi' }])
  })
  it('chưa live: «Bật live cho lớp …» + «Bắt đầu live» / «Để sau», không phụ đề; mic lỗi ⇒ một dòng + «Live không tiếng» / «Thử lại» / «Để sau»; buổi chưa có tiếng ⇒ nói một dòng', () => {
    const t = dungTo()
    const CHUA = { ...NEN, pha: 'tat', tu: null, doTieng: [], the: THE, mic: MIC, lyDoKT: '' }
    t.bom(CHUA)
    expect(t.the().querySelector('h3')!.textContent).toBe('Bật live cho lớp 12A1')
    expect(t.the().textContent).not.toContain('sẽ thấy màn chiếu này')
    expect([...t.the().querySelectorAll('.mc-lv-hang button')].map((b) => (b.textContent ?? '').trim())).toEqual(['Bắt đầu live', 'Để sau'])
    expect(t.the().querySelector('[data-lv="bang"]')).toBeNull()
    expect(canh(t)).toEqual([])
    t.bom({ ...CHUA, the: { ...THE, loi: 'mic-tu-choi' } })
    expect(canh(t)).toEqual(['Chưa dùng được mic: trình duyệt chưa cho dùng mic'])
    expect([...t.the().querySelectorAll('.mc-lv-hang button')].map((b) => (b.textContent ?? '').trim())).toEqual(['Live không tiếng', 'Thử lại', 'Để sau'])
    t.bom({ ...CHUA, coTieng: false })
    expect(canh(t)).toEqual(['Buổi này live chưa có tiếng trên máy em'])
    expect(t.the().querySelector('details')).toBeNull()
    bam(t.the(), /Bắt đầu live/)
    expect(t.viec('khong-tieng').length).toBe(1)
  })
})

describe('«Tăng tiếng» trên bảng mic (13/11, thầy: «chỉ thêm tăng tiếng thôi»)', () => {
  const NEN = { co: true, pha: 'live', tu: 1, xem: 3, nghe: 2, tong: 4, lop: '12A1', coTieng: true, khongTieng: false, micIm: false, noiLai: false, mayKhac: false, bang: false, noi: [], ngheEm: true, emKet: false, chuaGui: 0, doTieng: [], roi: [], tay: [], moi: null, micLoi: '', nghi: false, dot2: false, lyDoKT: '' }
  const THE = { ds: [{ id: 'by', ten: 'Microphone (BOYALINK)' }], chon: 'by', loi: '', tiengLop: true, xa: false, loa: null }
  const MIC = { tinh: 'tot', ten: 'Microphone (BOYALINK)', loc: false, cheDo: 'tu', locOn: 'vua', locOnChay: 'chay', khac: '', kieuTieng: 'lam-ro' }
  it('một hàng «Tăng tiếng» bốn nút Gốc · +3 · +6 · +9 (thanh phân đoạn); nút đúng bậc được nhấn; bấm ⇒ gửi app `tang` kèm bậc', () => {
    const t = dungTo()
    t.bom({ ...NEN, the: THE, mic: { ...MIC, tang: 6 } })
    const hang = [...t.the().querySelectorAll<HTMLElement>('.mc-lv-cai')].find((h) => h.querySelector('b')!.firstChild!.textContent === 'Tăng tiếng')!
    expect(hang).toBeTruthy()
    const nut = [...hang.querySelectorAll<HTMLElement>('.mc-lv-seg [data-lv="tang"]')]
    expect(nut.map((b) => (b.textContent ?? '').trim())).toEqual(['Gốc', '+3', '+6', '+9'])
    expect(nut.map((b) => b.getAttribute('aria-pressed'))).toEqual(['false', 'false', 'true', 'false'])
    bam(t.the(), '+9'); bam(t.the(), 'Gốc')
    expect(t.gui.filter((m) => m.viec === 'tang').map((m) => m.v)).toEqual(['9', '0'])
  })
})
