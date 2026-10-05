// LÊN BẢNG — BẢN VẼ MỚI THẦY CHỐT 28/09/2026 (docs/ban-ve-len-bang-2809/LenBang-Moi.html): kiểm lớp `len-bang-moi-to-chieu.ts`
// chạy THẬT trong JSDOM (bố cục giả vì JSDOM không có layout; hình học thật chụp bằng Chromium — xem báo cáo phiên).
//   · KHÔNG co chữ · LẬT TRANG khi chờ gọi (Space / PageDown, "Câu N (tiếp)", "Trang i/n") · ← → đổi đợt
//   · ĐÃ LÊN BẢNG: cuộn trong 2/3, cột 1/3 ĐEN · KHÔNG lộ tên em trước khi bấm Lên bảng (kể cả lưới tổng quan)
//   · D/K ghi qua cầu nối, nhãn Đạt/Chưa đạt một dòng trên thẻ tên · bảng chi tiết em xin hồ sơ qua app thầy
import { describe, it, expect } from 'vitest'
import { JSDOM, VirtualConsole } from 'jsdom'
import { taoHtmlMayChieu, type OBang } from '../src/lib/html-may-chieu'
import { CSS_LEN_BANG_MOI, thongKeHtml } from '../src/lib/len-bang-moi-to-chieu'
import { thongKeLopCau, thongKeTuSoGop } from '../src/lib/thong-ke-lop-cau'
import { TIN_TO_CHIEU, kiemTinToChieu } from '../src/lib/to-chieu-cau-noi'

const MA = 'phien2809'
const GOC = 'https://app.test'
const cau = (id: string, phan: 'I' | 'II' | 'III' = 'I', text = 'Đề bài dài.') =>
  ({ phan, id, maDe: '', chuyenDe: 'x', dang: 'x', sao: 1, mucDo: '', text, luaChon: phan === 'III' ? null : ['Một', 'Hai', 'Ba', 'Bốn'], dapAn: phan === 'II' ? 'DSSD' : 'B', chot: 'Cốt lõi.', lyDo: [{ khoa: phan === 'II' ? 'a' : 'A', ly: 'Vì a.' }, { khoa: phan === 'II' ? 'b' : 'B', ly: 'Vì b.' }], buoc: ['Bước 1.', 'Bước 2.'], ketQua: 'B' }) as unknown as OBang['cau']
const o = (sbd: string, hoTen: string, extra: Partial<OBang> = {}): OBang => ({ sbd, hoTen, qid: `DE-I-${sbd}`, soCau: 36, sao: 1, cau: cau(`DE-I-${sbd}`), bacUoc: 2, lop: '12A1', lanLenBang: 3, ...extra })

function moTo(dsO: OBang[], opt: { cauNoi?: boolean; giam?: boolean } = {}) {
  const guiLen: Record<string, unknown>[] = []
  const cha = new JSDOM('<!doctype html><body></body>', { url: `${GOC}/` }).window as unknown as Window
  ;(cha as unknown as { postMessage: (m: Record<string, unknown>) => void }).postMessage = (m) => { guiLen.push(m) }
  const html = taoHtmlMayChieu(dsO, opt.cauNoi ? { cauNoi: { maPhien: MA } } : {})
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    virtualConsole: new VirtualConsole(),
    beforeParse(w) {
      if (opt.cauNoi) Object.defineProperty(w, 'parent', { get: () => cha, configurable: true })
      w.setTimeout = ((f: () => void) => { void f; return 0 }) as never
      w.setInterval = (() => 0) as never
      w.HTMLElement.prototype.scrollTo = () => {}
      ;(w as unknown as { matchMedia: unknown }).matchMedia = () => ({ matches: opt.giam ?? true })
      // BỐ CỤC GIẢ: vùng đề cao 500 px; khối nào có __y/__h thì trả đúng hình chữ nhật ấy.
      Object.defineProperty(w.HTMLElement.prototype, 'clientHeight', { configurable: true, get(this: HTMLElement) { return this.classList.contains('mc-vung-de') ? 500 : 0 } })
      w.Element.prototype.getBoundingClientRect = function (this: Element & { __y?: number; __h?: number }) {
        const y = this.classList.contains('mc-vung-de') ? 0 : this.__y ?? 0
        const h = this.classList.contains('mc-vung-de') ? 500 : this.__h ?? 0
        return { top: y, bottom: y + h, left: 0, right: 100, width: 100, height: h, x: 0, y, toJSON() {} } as DOMRect
      }
    },
  })
  const w = dom.window as unknown as Window & typeof globalThis & { __mcXepTrang: () => void; __mcLenh: (k: string) => void }
  const doc = dom.window.document
  const phim = (key: string) => doc.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key, bubbles: true }))
  const tuCha = (data: Record<string, unknown>) => w.dispatchEvent(new dom.window.MessageEvent('message', { data: { maPhien: MA, ...data }, origin: GOC, source: cha as unknown as MessageEventSource }))
  /** Xếp khối của vùng đề đợt đang chiếu: đầu đề 40, đề 300, mỗi phương án 120 px ⇒ 2 trang ở vùng 500 px. */
  const datBoCuc = () => {
    const v = doc.querySelector<HTMLElement>('.mc-dot .mc-vung-de')!
    const dat = (e: Element | null, y: number, h: number) => { if (e) Object.assign(e, { __y: y, __h: h }) }
    dat(v.querySelector('.mc-de-dau'), 0, 40)
    dat(v.querySelector('.mc-de'), 40, 300)
    v.querySelectorAll('.mc-pa').forEach((p, i) => dat(p, 340 + i * 120, 120))
    w.__mcXepTrang()
    return v
  }
  return { dom, doc, w, phim, tuCha, datBoCuc, guiLen, html }
}

describe('LUẬT 1 — không bao giờ thu nhỏ chữ', () => {
  it('đề = phương án = lời giải = --mc-co; không còn cảnh báo "quá dài" hay bậc co chữ trong tờ', () => {
    const { html } = moTo([o('A', 'An')])
    expect(CSS_LEN_BANG_MOI).toContain('body.mc-bc .mc-vung-de .mc-pa,body.mc-bc .mc-vung-de .mc-pa-chu{font-size:var(--mc-co,28px)}')
    expect(CSS_LEN_BANG_MOI).toContain('.mc-giai .sol-box{font-size:var(--mc-co,28px)!important}')
    expect(html).not.toMatch(/quá dài để vừa bảng|chữ nhỏ hơn mức khuyến nghị|em làm ở bảng phụ/)
    expect(html).not.toMatch(/--mc-co-giai', c \+ 'px'/)
  })
})

describe('LUẬT 2 — chờ gọi: LẬT TRANG trong câu, ngắt ở ranh giới khối', () => {
  it('câu dài hơn vùng 2/3 ⇒ Trang 1/2; Space lật sang trang 2 có "Câu N (tiếp)"; PageUp về; khối ngoài trang bị ẩn', () => {
    const t = moTo([o('A', 'An'), o('B', 'Bình')])
    const v = t.datBoCuc()
    expect(t.doc.body.getAttribute('data-pha')).toBe('cho')
    expect(v.getAttribute('data-trang')).toBe('1/2')
    const pa = [...v.querySelectorAll('.mc-pa')]
    expect(pa.map((p) => p.classList.contains('mc-ngoai'))).toEqual([false, true, true, true]) // ngắt TRƯỚC phương án B — không cắt giữa
    expect(v.querySelector('.mc-trang-so')!.textContent).toContain('Trang 1/2')
    expect(v.querySelector('.mc-tiep-bar')!.classList.contains('mc-hien')).toBe(false)
    t.phim(' ')
    expect(v.getAttribute('data-trang')).toBe('2/2')
    expect(v.querySelector('.mc-tiep-bar')!.classList.contains('mc-hien')).toBe(true)
    expect(v.querySelector('.mc-tiep-bar')!.textContent).toBe('Câu 36 (tiếp) · trang 2/2')
    expect(pa.map((p) => p.classList.contains('mc-ngoai'))).toEqual([true, false, false, false])
    expect(v.querySelector('.mc-de')!.classList.contains('mc-ngoai')).toBe(true)
    t.phim('PageUp')
    expect(v.getAttribute('data-trang')).toBe('1/2')
    t.phim('PageDown')
    expect(v.getAttribute('data-trang')).toBe('2/2')
  })

  it('← / → đổi đợt (không lật trang); Home / End; số + Enter nhảy tới đợt', () => {
    const t = moTo([o('A', 'An'), o('B', 'Bình'), o('C', 'Cường')])
    const dem = () => t.doc.getElementById('mc-dem')!.textContent
    t.phim('ArrowRight'); expect(dem()).toBe('Đợt 2/3')
    t.phim('ArrowLeft'); expect(dem()).toBe('Đợt 1/3')
    t.phim('End'); expect(dem()).toBe('Đợt 3/3')
    t.phim('Home'); expect(dem()).toBe('Đợt 1/3')
    t.phim('3'); t.phim('Enter'); expect(dem()).toBe('Đợt 3/3')
  })
})

describe('LUẬT 3 + 4 — tên chỉ hiện khi bấm Lên bảng; đang chữa: cuộn trong 2/3, cột 1/3 ĐEN', () => {
  it('chờ gọi: không thẻ tên nào hiện, lưới tổng quan (Tab) không có tên em nào', () => {
    const t = moTo([o('A', 'Nguyễn Minh Anh'), o('B', 'Trần Gia Bảo')])
    expect([...t.doc.querySelectorAll<HTMLElement>('.mc-em[id]')].every((e) => e.hidden)).toBe(true)
    t.phim('Tab')
    const luoi = t.doc.querySelector('.mc-luoi')!
    expect(luoi.classList.contains('mc-mo')).toBe(true)
    expect(luoi.textContent).not.toMatch(/Minh Anh|Gia Bảo/)
    expect(t.doc.querySelector('.mc-goi')).toBeNull()
  })

  it('bấm L ⇒ tên hiện, pha "chua", vùng đề chuyển sang CUỘN (hết chia trang); CSS tô đen cột 1/3 + vùng làm bài', () => {
    const t = moTo([o('A', 'Nguyễn Minh Anh'), o('B', 'Trần Gia Bảo')])
    const v = t.datBoCuc()
    t.phim('l')
    expect(t.doc.body.getAttribute('data-pha')).toBe('chua')
    expect(t.doc.querySelector<HTMLElement>('.mc-dot .mc-em[id]')!.hidden).toBe(false)
    expect(v.classList.contains('mc-cuon')).toBe(true)
    expect(v.hasAttribute('data-trang')).toBe(false)
    expect([...v.querySelectorAll('.mc-ngoai')]).toHaveLength(0)
    expect(CSS_LEN_BANG_MOI).toContain('--mc-den:rgb(0,0,0)')
    expect(CSS_LEN_BANG_MOI).toContain('body.mc-bc[data-pha="chua"] .mc-cot-lam-bai,body.mc-bc[data-pha="goi"] .mc-cot-lam-bai,body.mc-bc[data-pha="chua"] .mc-trang,body.mc-bc[data-pha="goi"] .mc-trang{background:var(--mc-den)!important')
    expect(CSS_LEN_BANG_MOI).toContain('body.mc-bc .mc-vung-de.mc-cuon{overflow-y:auto!important')
    // lưới tổng quan: đợt ĐÃ gọi mới có tên
    t.phim('Tab')
    expect(t.doc.querySelector('.mc-luoi')!.textContent).toContain('Nguyễn Minh Anh')
    expect(t.doc.querySelector('.mc-luoi')!.textContent).not.toContain('Trần Gia Bảo')
  })
})

describe('LUẬT 6 — lời giải dưới đề, hiện dần bằng Space', () => {
  it('G mở lời giải (mục 1), Space hiện tiếp từng mục, mục cũ mờ; ý/phương án đang giảng sáng dòng trong đề', () => {
    const t = moTo([o('A', 'An')])
    t.phim('g')
    const g = t.doc.querySelector<HTMLElement>('.mc-giai')!
    expect(g.hidden).toBe(false)
    expect(g.querySelector('.mc-giai-dem')!.textContent).toMatch(/1\/\d+$/)
    expect(g.querySelectorAll('.mc-buoc-nay').length).toBeGreaterThan(0)
    t.phim(' '); t.phim(' ')
    expect(g.querySelector('.mc-giai-dem')!.textContent).toMatch(/^Lời giải · Space: hiện tiếp · 3\//)
    expect(g.querySelectorAll('.mc-buoc-cu').length).toBeGreaterThan(0)
    const sang = () => [...t.doc.querySelectorAll('.mc-vung-de .mc-pa.mc-y-sang .mc-ky')].map((k) => k.textContent)
    expect(sang()).toEqual(['A']) // mục 3 = lý do phương án A ⇒ dòng A của đề sáng
    t.phim(' ')
    expect(sang()).toEqual(['B'])
    expect([...t.doc.querySelectorAll('.mc-vung-de .mc-pa.mc-pa-dung .mc-ky')].map((k) => k.textContent)).toEqual(['B'])
    t.phim('g')
    expect(g.hidden).toBe(true)
  })
})

describe('LUẬT 7 — thanh dưới, T, B, ?', () => {
  it('nhóm nút phím trên thanh dưới; chữ thanh ≥ 22 px@1920 (1,15 vw) đậm; D/K chỉ hiện khi đang chữa và đã nối app', () => {
    const t = moTo([o('A', 'An')], { cauNoi: true })
    const k = [...t.doc.querySelectorAll('#mc-phim-nhom [data-k]')].map((b) => b.getAttribute('data-k'))
    // thầy 05/10: thêm "C · Thầy chữa" đầu nhóm (chỉ hiện khi đã nối app và đợt còn nút chưa bấm)
    expect(k).toEqual(['C', 'D', 'K', 'G', 'T', 'B', 'Tab', '?'])
    expect(t.doc.querySelector<HTMLElement>('[data-k="C"]')!.hidden).toBe(true)
    expect(CSS_LEN_BANG_MOI).toMatch(/body\.mc \.mc-thanh\{[^}]*font-size:max\(14px,calc\(var\(--u\)\*1\.15\)\);font-weight:700/)
    expect(t.doc.querySelector<HTMLElement>('[data-k="D"]')!.hidden).toBe(true)
    t.tuCha({ type: TIN_TO_CHIEU.KET_NOI })
    t.phim('l')
    expect(t.doc.querySelector<HTMLElement>('[data-k="D"]')!.hidden).toBe(false)
    expect(t.doc.querySelector<HTMLElement>('[data-k="C"]')!.hidden).toBe(false)
  })

  it('T bật dải thống kê lớp; B bật bút (canvas nhận chuột) — Esc tắt; ? mở bảng phím', () => {
    const t = moTo([o('A', 'An', { thongKe: thongKeLopCau('I', [{ dung: true, chon: 'B', dapAnDung: 'B' }, { dung: false, chon: 'A', dapAnDung: 'B' }]) })])
    expect(t.doc.querySelector('.mc-tk')!.textContent).toContain('2 bài nộp')
    t.phim('t'); expect(t.doc.body.classList.contains('mc-co-tk')).toBe(true)
    t.phim('b'); expect(t.doc.body.classList.contains('mc-co-but')).toBe(true)
    t.phim('Escape'); expect(t.doc.body.classList.contains('mc-co-but')).toBe(false)
    t.phim('?'); expect(t.doc.querySelector('.mc-phim')!.classList.contains('mc-mo')).toBe(true)
  })
  it('(hoàn thiện bản vẽ 28/09) đợt KHÔNG có số liệu lớp ⇒ không có dải; bấm T ⇒ báo "Chưa có số liệu lớp"', () => {
    const t = moTo([o('A', 'An')])
    expect(t.doc.querySelector('.mc-tk')).toBeNull()
    t.phim('t')
    expect(t.doc.querySelector('.mc-bao')!.textContent).toContain('Chưa có số liệu lớp')
  })
})

describe('D/K + nhãn trên thẻ tên + bảng chi tiết em (cầu nối)', () => {
  it('K ⇒ gửi lệnh ghi Chưa đạt qua cầu nối; phản hồi về ⇒ thẻ tên có viên thuốc "Chưa đạt" một dòng', () => {
    const t = moTo([o('A', 'An')], { cauNoi: true })
    t.tuCha({ type: TIN_TO_CHIEU.KET_NOI })
    t.phim('l')
    t.phim('k')
    const lenh = t.guiLen.find((m) => m.type === TIN_TO_CHIEU.CHAM)!
    expect(lenh).toMatchObject({ khoa: 'A|DE-I-A', dat: false })
    t.tuCha({ type: TIN_TO_CHIEU.PHAN_HOI, khoa: 'A|DE-I-A', kq: 'da_ghi', dat: false })
    const nhan = t.doc.querySelector<HTMLElement>('.mc-em .mc-dau-kq')!
    expect([nhan.hidden, nhan.textContent]).toEqual([false, 'Chưa đạt'])
    expect(CSS_LEN_BANG_MOI).toContain('body.mc .mc-em .mc-dau-kq{flex:none;display:inline-flex;align-items:center;white-space:nowrap;font-size:.58em;font-weight:800;line-height:1;border-radius:1em;padding:.35em .75em')
    expect(CSS_LEN_BANG_MOI).toContain('body.mc .mc-em .mc-ten{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')
  })

  it('bấm thẻ tên ⇒ tờ xin hồ sơ (HO_SO, không mang sbd/qid rời — chỉ khoá ô) rồi vẽ bảng chi tiết: "Câu này" lên đầu', () => {
    const t = moTo([o('A', 'Nguyễn Minh Anh')], { cauNoi: true })
    t.tuCha({ type: TIN_TO_CHIEU.KET_NOI })
    t.phim('l')
    ;(t.doc.querySelector('.mc-em[id]') as HTMLElement).click()
    const ct = t.doc.querySelector('.mc-ct')!
    expect(ct.classList.contains('mc-mo')).toBe(true)
    const xin = t.guiLen.find((m) => m.type === TIN_TO_CHIEU.HO_SO)!
    expect(Object.keys(xin).sort()).toEqual(['id', 'khoa', 'maPhien', 'type'])
    t.tuCha({ type: TIN_TO_CHIEU.HO_SO_TRA, id: xin.id, hoSo: {
      em: { hoTen: 'Nguyễn Minh Anh', expTong: 1200, chuoiNgay: 4 },
      cauNay: { soLan: 2, soDung: 1, soSai: 1, lan: [
        { luc: '2026-09-27T13:05:00Z', dung: false, coGoiY: false, nguon: 'Đảo', giay: 52, chon: 'C' },
        { luc: '2026-09-28T01:10:00Z', dung: true, coGoiY: true, nguon: 'Đoàn', giay: 31, chon: null },
      ] },
      ngay14: Array.from({ length: 14 }, (_, i) => ({ ngay: `2026-09-${String(15 + i).padStart(2, '0')}`, dung: i, sai: 1 })),
      dang: [{ ten: 'Este – lipit', soLan: 10, tiLe: 0.72, hang: 'L3' }],
      saiGanNhat: [{ qid: 'DE-I-12', luc: '2026-09-27T13:05:00Z', nguon: 'Đảo', dang: 'Este – lipit' }],
      lenBang: [{ qid: 'DE-II-17', dat: true, luc: '2026-09-27T12:00:00Z' }],
      caGanNhat: { diem: 7.75, tenCa: 'Kiểm tra tuần 38', luc: '2026-09-26T10:00:00Z', diemTruoc: 7.25 },
      chienDich: { ten: 'Ôn Este', hanNop: '2026-10-05', coXat: 0.8, thanhThao: 0.5, nhip: 'vuot', soNgayTre: 0 },
      tienDoCap: { cap: 7, exp: 130, moc: 520, toiDa: false },
    } })
    const txt = ct.textContent!
    expect(ct.querySelector('.mc-cau-nay')).toBeTruthy()
    expect(ct.querySelector('section')!.classList.contains('mc-cau-nay')).toBe(true) // khối "Câu này" LÊN ĐẦU
    expect(txt).toContain('2 lần làm')
    expect(txt).toContain('Chủ Nhật 27/09 · 20:05') // giờ Việt Nam
    expect(txt).toContain('chọn C')
    expect(txt).toContain('chọn —') // sổ chưa có đáp án em chọn
    expect(txt).toContain('Có gợi ý · 31 giây')
    expect(txt).toMatch(/Đảo[\s\S]*Đoàn/)
    expect(txt).toContain('Vượt nhịp')
    expect(txt).toContain('L3 Khá')
    expect(txt).toContain('Câu 12 · Phần I')
    expect(txt).toContain('7,75')
    expect(txt).toContain('Lớp 12A1')
    // hoàn thiện bản vẽ 28/09: thanh tiến độ EXP (cấp · EXP hiện có / mốc cấp sau) từ `tienDoCap`
    const exp = ct.querySelector('.mc-exp-cap')!
    expect(exp.textContent).toContain('Cấp 7')
    expect(exp.textContent).toContain('130 / 520 EXP · lên cấp 8')
    expect((exp.querySelector('.mc-exp-ray i') as HTMLElement).style.width).toBe('25%')
    t.phim('Escape')
    expect(ct.classList.contains('mc-mo')).toBe(false)
  })

  it('tờ mở riêng (không có app cha) ⇒ bảng chi tiết nói rõ không lấy được số, không bịa', () => {
    const t = moTo([o('A', 'An')])
    t.phim('l')
    ;(t.doc.querySelector('.mc-em[id]') as HTMLElement).click()
    expect(t.doc.querySelector('.mc-ct')!.textContent).toContain('Chỉ xem được khi mở tờ chiếu từ app thầy')
  })

  it('app kiểm tin HO_SO: đúng khung + mã phiên + khoá ô có trên tờ + id hợp lệ; sai là bỏ', () => {
    const ctx = { maPhien: MA, gocApp: GOC, laKhungToChieu: () => true, khoaHopLe: (k: string) => k === 'A|Q' }
    const tin = (data: Record<string, unknown>) => kiemTinToChieu({ data: { maPhien: MA, type: TIN_TO_CHIEU.HO_SO, ...data }, origin: GOC, source: {} }, ctx)
    expect(tin({ khoa: 'A|Q', id: 'h1' })).toEqual({ loai: 'ho_so', khoa: 'A|Q', id: 'h1' })
    expect(tin({ khoa: 'B|Q', id: 'h1' })).toBeNull()
    expect(tin({ khoa: 'A|Q', id: '<x>' })).toBeNull()
    expect(tin({ khoa: 'A|Q' })).toBeNull()
  })
})

describe('thống kê lớp (phím T) — số gộp, không tên em', () => {
  it('Phần I: % chọn A–D + đáp án đúng; Phần II: % đúng từng ý; Phần III: % đúng + đáp số sai hay gặp; không bài ⇒ null', () => {
    expect(thongKeLopCau('I', [{ dung: true, chon: 'B', dapAnDung: 'B' }, { dung: false, chon: 'A', dapAnDung: 'B' }, { dung: false, chon: 'A', dapAnDung: 'B' }, { dung: true, chon: 'B', dapAnDung: 'B' }]))
      .toEqual({ kieu: 'pa', bai: 4, dung: 'B', tiLe: { A: 50, B: 50, C: 0, D: 0 } })
    expect(thongKeLopCau('II', [{ dung: false, chon: 'ĐSSĐ', dapAnDung: 'DSSD' }, { dung: false, chon: 'DDSS', dapAnDung: 'DSSD' }]))
      .toEqual({ kieu: 'y', bai: 2, tiLe: { a: 100, b: 50, c: 100, d: 50 } })
    expect(thongKeLopCau('III', [{ dung: true, chon: '5,84' }, { dung: false, chon: '5,04' }, { dung: false, chon: '5,04' }, { dung: false, chon: '7,2' }]))
      .toEqual({ kieu: 'so', bai: 4, dung: 25, saiHay: [{ dap: '5,04', tiLe: 50 }, { dap: '7,2', tiLe: 25 }] })
    expect(thongKeLopCau('I', [])).toBeNull()
    // buổi chữa KHÔNG từ ca: số GỘP từ sổ su_kien_hoc (máy chủ /gv/thong-ke-lop-cau) — không tên em
    expect(thongKeTuSoGop('I', { bai: 4, dung: 2, coChon: 4, chon: { B: 2, A: 2 }, chonSai: { A: 2 } }, 'B')).toEqual({ kieu: 'pa', bai: 4, dung: 'B', tiLe: { A: 50, B: 50, C: 0, D: 0 } })
    // thiếu đáp án chọn của một số em ⇒ KHÔNG bịa % phương án, lùi về "Đúng x%"
    expect(thongKeTuSoGop('I', { bai: 4, dung: 1, coChon: 2, chon: { A: 2 }, chonSai: { A: 2 } }, 'B')).toEqual({ kieu: 'so', bai: 4, dung: 25, saiHay: [{ dap: 'A', tiLe: 50 }] })
    expect(thongKeTuSoGop('II', { bai: 2, dung: 0, coChon: 2, chon: { DSSD: 1, DDSS: 1 }, chonSai: {} }, 'DSSD')).toEqual({ kieu: 'y', bai: 2, tiLe: { a: 100, b: 50, c: 100, d: 50 } })
    expect(thongKeTuSoGop('III', { bai: 2, dung: 1, coChon: 2, chon: { '5,84': 1, '5,04': 1 }, chonSai: { '5,04': 1 } })).toEqual({ kieu: 'so', bai: 2, dung: 50, saiHay: [{ dap: '5,04', tiLe: 50 }] })
    expect(thongKeTuSoGop('I', undefined)).toBeNull()
    expect(thongKeTuSoGop('I', { bai: 0, dung: 0, coChon: 0, chon: {}, chonSai: {} })).toBeNull()
    // SỬA CÓ CHỦ Ý (hoàn thiện bản vẽ 28/09): không có số ⇒ KHÔNG vẽ dải (tờ báo "Chưa có số liệu lớp" khi bấm T)
    expect(thongKeHtml(null)).toBe('')
  })
})
