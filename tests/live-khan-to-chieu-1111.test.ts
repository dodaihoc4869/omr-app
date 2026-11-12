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
  it('viên Live đếm cả số em ĐANG NGHE cạnh số em xem; cửa sổ nói rõ hậu quả của «Em ở xa» (máy em trong lớp đang tắt tiếng)', () => {
    expect(JS_LIVE_TO_CHIEU).toContain("'</b><small> em nghe</small></span>'")
    expect(JS_LIVE_TO_CHIEU).toContain("(t.xem && !t.nghe ? 'im' : '')") // có em xem mà 0 em nghe ⇒ tô cảnh báo
    expect(JS_LIVE_TO_CHIEU).toContain('Máy em TRONG LỚP đang tắt tiếng — bấm «Tất cả», hoặc em mở khay bật «Tiếng» mới nghe')
    expect(JS_LIVE_TO_CHIEU).toContain("'</b> em đang nghe qua máy'")
    expect(JS_LIVE_TO_CHIEU).not.toContain('Em trong lớp nghe thầy trực tiếp')
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
