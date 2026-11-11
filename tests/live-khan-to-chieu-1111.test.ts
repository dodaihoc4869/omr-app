// LIVE — SỬA KHẨN 11/11 trên MÀN CHIẾU (thầy test máy thật): chạy THẬT đoạn JS mặt live của tờ chiếu (src/lib/live-to-chieu.ts) trong DOM giả, bơm trạng thái
// `live-tt` như app gửi, đọc lại DOM + tin tờ gửi về app.
//   K3  cửa sổ của nút Live có «Tạm dừng» ⇄ «Tiếp tục» và «Kết thúc live» (bấm một lần); viên Live ghi «TẠM DỪNG» lúc dừng.
//   K4  nút Live / viên Live đứng ĐẦU thanh (mép trái); cửa sổ nút Live neo mép trái.
//   K5  lúc live các nút phím của thanh gom vào MỘT nút lưới; bấm ⇒ xoè, bấm ra ngoài / 8 giây ⇒ thu; chưa live thì thanh như cũ.
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

describe('K4 · K5 · nút Live đầu thanh, cửa sổ neo trái, thanh gom vào một nút', () => {
  it('nút Live, viên Live, nút lưới là ba phần tử ĐẦU của thanh; CSS neo cửa sổ nút Live sang trái', () => {
    const t = dungTo()
    expect([...t.thanh.children].slice(0, 3).map((e) => e.className)).toEqual(['mc-lv-nut', 'mc-lv-cum', 'mc-lv-gon'])
    expect(CSS_LIVE_TO_CHIEU).toMatch(/\.mc-lv-the\{right:auto;left:calc\(var\(--u\)\*\.75\)\}/)
  })
  it('chưa live: không có nút lưới, thanh như cũ; đang live: thanh gom (CSS ẩn nhóm phím, «Lên bảng», «Cài đặt»), bấm nút lưới ⇒ xoè; bấm ra ngoài / 8 giây ⇒ thu; hết live ⇒ bỏ gom', () => {
    const t = dungTo(), gon = document.querySelector<HTMLElement>('.mc-lv-gon')!
    t.bom({ ...NEN, pha: 'tat', tu: null })
    expect(gon.hidden).toBe(true)
    expect(document.body.classList.contains('mc-live')).toBe(false)
    t.bom(NEN)
    expect(gon.hidden).toBe(false)
    expect(document.body.classList.contains('mc-live')).toBe(true)
    expect(document.body.classList.contains('mc-lv-xoe')).toBe(false)
    expect(CSS_LIVE_TO_CHIEU).toContain('body.mc-live:not(.mc-lv-xoe) .mc-thanh>#mc-phim-nhom,body.mc-live:not(.mc-lv-xoe) .mc-thanh>#mc-len-bang,body.mc-live:not(.mc-lv-xoe) .mc-thanh>#mc-cai-btn{display:none!important}')
    gon.click()
    expect(document.body.classList.contains('mc-lv-xoe')).toBe(true)
    expect(gon.getAttribute('aria-expanded')).toBe('true')
    vi.advanceTimersByTime(7000)
    t.thanh.dispatchEvent(new Event('pointerdown', { bubbles: true })) // thầy còn đang bấm trong thanh ⇒ chưa thu
    vi.advanceTimersByTime(7000)
    expect(document.body.classList.contains('mc-lv-xoe')).toBe(true)
    vi.advanceTimersByTime(1500)
    expect(document.body.classList.contains('mc-lv-xoe')).toBe(false)
    gon.click()
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true })) // bấm ra ngoài thanh
    expect(document.body.classList.contains('mc-lv-xoe')).toBe(false)
    gon.click()
    t.bom({ ...NEN, pha: 'tat', tu: null })
    expect(document.body.classList.contains('mc-lv-xoe')).toBe(false)
    expect(gon.hidden).toBe(true)
  })
  it('phím tắt V vẫn chạy khi thanh đang gom', () => {
    const t = dungTo()
    t.bom(NEN)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'v', bubbles: true }))
    expect(t.viec('bam').length).toBe(1)
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
