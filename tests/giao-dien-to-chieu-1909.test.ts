// M3 — GIAO DIỆN TỜ CHIẾU LÊN BẢNG THEO BA BẢN VẼ ĐÃ CHỐT (19/09/2026): thẻ tên + thần thú + hào quang, màn gọi tên đầu đợt,
// thanh dưới (pha LÀM BÀI → CHỮA), ăn mừng khi Đạt, lời giải co chữ trước khi cuộn, tế nhị trước lớp, không chuyển động lúc đọc đề.
//
// Ba lớp: (1) markup/CSS (khoá nguồn); (2) MÃ TRONG TỜ chạy thật trong JSDOM với đồng hồ và bộ hẹn giờ giả (JSDOM không có layout
// nên hình học thật nằm ở ảnh chụp Chrome trong `docs/anh-man-chieu-1909/` và phép đo `scripts/do-bo-cuc-to-chieu.mjs`);
// (3) khoá nguồn màn giáo viên.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { JSDOM, VirtualConsole } from 'jsdom'
import { taoHtmlMayChieu, type OBang } from '../src/lib/html-may-chieu'
import { CSS_GIAO_DIEN_NUT_CHAM, CSS_GIAO_DIEN_TO_CHIEU, GIAO_DIEN_TO_CHIEU, MAU_HAO_QUANG_MAC_DINH, MAU_HAO_QUANG_THEO_HE, mauHaoQuang } from '../src/lib/giao-dien-to-chieu'
import { thoiGianCau, noiDungTuCauLuyen } from '../src/lib/thoi-gian-len-bang'
import { TIN_TO_CHIEU } from '../src/lib/to-chieu-cau-noi'

const MA = 'abc123'
const GOC = 'https://app.test'

const cauI = (id: string, text = 'Ancol nào sau đây là ancol bậc II?', phan: 'I' | 'II' | 'III' = 'I') =>
  ({
    phan,
    id,
    maDe: '',
    chuyenDe: '',
    dang: 'x',
    sao: 1,
    mucDo: '',
    text,
    luaChon: phan === 'III' ? null : ['CH3–CH2–OH', 'CH3–CH(OH)–CH3', '(CH3)3C–OH', 'CH3–OH'],
    dapAn: 'B',
    chot: '',
    lyDo: null,
    buoc: ['Bước 1.', 'Bước 2.'],
    ketQua: 'B',
  }) as unknown as OBang['cau']

const thu = (he: string, ten = 'Hoả Long', capDo = 12): NonNullable<OBang['thanThu']> => ({
  anh: 'https://x/pet.png',
  ten,
  danhHieu: '',
  he,
  capDo,
  hinhThai: 'Thức Tỉnh',
  tangThapCaoNhat: 3,
  soCauDaThanhTay: 0,
  capToiDa: 120,
})

const o = (sbd: string, hoTen: string, extra: Partial<OBang> = {}): OBang => ({
  sbd,
  hoTen,
  qid: `q-${sbd}`,
  soCau: 7,
  sao: 1,
  cau: cauI(`q-${sbd}`),
  ...extra,
})

// ─────────────────────────── 1. MARKUP + CSS ───────────────────────────
describe('bảng màu, hào quang theo hệ, tế nhị trước lớp', () => {
  it('bốn kiểu giấy giữ nguyên bốn GIÁ TRỊ cũ; nền bảng luôn tối (#15181c) và giấy ấm (#f4efe4) là mặc định', () => {
    const h = taoHtmlMayChieu([o('A', 'An')], {})
    for (const v of ['matte-light', 'soft', 'matte-dark', 'dark']) expect(h).toContain(`<option value="${v}">`)
    expect(CSS_GIAO_DIEN_TO_CHIEU).toContain('--mc-bang:#15181c')
    expect(CSS_GIAO_DIEN_TO_CHIEU).toContain('--mc-giay:#f4efe4')
    expect(CSS_GIAO_DIEN_TO_CHIEU).toMatch(/:root\[data-projector\] body\.mc[^{]*\{background:var\(--mc-bang\)!important/)
    expect(GIAO_DIEN_TO_CHIEU.NEN_BANG).toBe('#15181c')
    expect(GIAO_DIEN_TO_CHIEU.GIAY).toBe('#f4efe4')
  })

  it('CSS giao diện mới được nạp SAU CSS bố cục M2 (thắng về độ ưu tiên), và CSS nút chấm CHỈ khi có cầu nối', () => {
    const co = taoHtmlMayChieu([o('A', 'An')], { cauNoi: { maPhien: MA } })
    const khong = taoHtmlMayChieu([o('A', 'An')], {})
    expect(co.indexOf('GIAO DIỆN MỚI (M3)')).toBeGreaterThan(co.indexOf('BỐ CỤC ĐO THẬT (M2)'))
    expect(co).toContain(CSS_GIAO_DIEN_NUT_CHAM.trim().slice(0, 40))
    expect(khong).not.toContain('mc-cham')
    expect(khong).not.toContain(CSS_GIAO_DIEN_NUT_CHAM.trim().slice(0, 40))
  })

  it('hào quang: mỗi hệ một màu trong bảng; hệ lạ về màu ấm mặc định; không bao giờ chèn chữ lạ vào thuộc tính style', () => {
    expect(Object.keys(MAU_HAO_QUANG_THEO_HE)).toEqual(['Đất', 'Nước', 'Lửa', 'Khí', 'Đức tin', 'Tình yêu', 'Lòng biết ơn', 'Sự sáng ý thức'])
    expect(mauHaoQuang('Lửa')).toBe('241,99,59')
    expect(mauHaoQuang(undefined)).toBe(MAU_HAO_QUANG_MAC_DINH)
    expect(mauHaoQuang('hệ không có')).toBe(MAU_HAO_QUANG_MAC_DINH)
    expect(mauHaoQuang('__proto__')).toBe(MAU_HAO_QUANG_MAC_DINH)
    const h = taoHtmlMayChieu([o('A', 'An', { thanThu: thu('Lửa') }), o('B', 'Bình', { thanThu: thu('"><script>alert(1)</script>') })], {})
    expect(h).toContain('style="--mc-he:241,99,59"')
    expect(h).toContain(`style="--mc-he:${MAU_HAO_QUANG_MAC_DINH}"`)
    expect(h).not.toContain('<script>alert(1)')
  })

  it('TẾ NHỊ: tờ KHÔNG in lý do gọi em (viSao) và CSS không vẽ nhãn bài tập về nhà ("Ở NHÀ LÀM SAI"…) cạnh tên em', () => {
    const h = taoHtmlMayChieu([o('A', 'An', { thanThu: thu('Lửa'), viSao: 'Em sai dạng này hai lần liên tiếp', btvnCau: 'sai', btvnTom: { soCauGiao: 5, soDaLam: 2, soDung: 1, soSai: 1, soChuaLam: 3 } })], {})
    expect(h).not.toContain('Em sai dạng này')
    expect(h).not.toContain('class="mc-viSao"')
    // markup nhãn BTVN vẫn còn cho các test cũ (btvn-len-bang-1409) nhưng KHÔNG được vẽ
    expect(CSS_GIAO_DIEN_TO_CHIEU).toMatch(/\.mc-em \.mc-btvn[^}]*\{display:none\}/)
    expect(CSS_GIAO_DIEN_TO_CHIEU).toMatch(/\.mc-em \.mc-sbd[^}]*\{display:none\}/)
  })

  it('không có chữ/màu đỏ ở giao diện mới: CSS M3 không dùng biến đỏ, không mã màu đỏ', () => {
    for (const css of [CSS_GIAO_DIEN_TO_CHIEU, CSS_GIAO_DIEN_NUT_CHAM]) {
      expect(css).not.toMatch(/--mc-do|var\(--mc-do|#c5221f|#f28b82|\bred\b|rgb\(\s*(?:19[0-9]|2[0-5][0-9])\s*,\s*[0-5]?\d\s*,\s*[0-5]?\d\s*\)/i)
    }
  })
})

describe('thẻ tên: "thú · cấp · lần lên bảng thứ N", nhãn vùng làm bài, dòng đầu thẻ đề', () => {
  it('có thú + lần lên bảng ⇒ thẻ tên in đủ; không biết lần thì không in gì; em không thú thì dòng phụ chỉ có lần', () => {
    const h = taoHtmlMayChieu([o('A', 'Nguyễn Văn Minh', { thanThu: thu('Lửa'), lanLenBang: 3 }), o('B', 'Trần Thu Hà', { thanThu: thu('Nước', 'Thuỷ Lân', 8) })], {})
    expect(h).toContain('<div class="mc-lan">lần lên bảng thứ 3</div>')
    expect(h.match(/mc-lan"/g)).toHaveLength(1)
    expect(h).toContain('<div class="mc-thu-ten">Hoả Long</div>')
    expect(h).toContain('<b>Cấp 12/120</b>')
    const khongThu = taoHtmlMayChieu([o('A', 'An', { lanLenBang: 2 })], {})
    expect(khongThu).toContain('<div class="mc-em-phu">lần lên bảng thứ 2</div>')
    expect(khongThu).not.toContain('class="mc-thu-chu"')
    for (const x of [0, -1, NaN, undefined]) expect(taoHtmlMayChieu([o('A', 'An', { thanThu: thu('Lửa'), lanLenBang: x as number })], {})).not.toContain('lần lên bảng thứ')
  })

  it('nhãn vùng làm bài lấy TÊN GỌI (từ cuối họ tên) và được thoát dấu; có ở cả ô nửa bảng lẫn cột làm bài của đợt đơn', () => {
    const h = taoHtmlMayChieu([o('A', 'Nguyễn Văn Minh'), o('B', 'Trần Thu "Hà"')], {})
    expect(h).toContain('data-nhan="Phần làm bài của Minh"')
    expect(h).toContain('data-nhan="Phần làm bài của &quot;Hà&quot;"')
    const don = taoHtmlMayChieu([o('A', 'Lê Hoàng Nam', { cau: cauI('d', 'từ '.repeat(400)), bacUoc: 2 })], {})
    expect(don.match(/data-nhan="Phần làm bài của Nam"/g)).toHaveLength(2) // `.mc-trang` (ẩn ở đợt đơn) + `.mc-cot-lam-bai`
    expect(don).toMatch(/class="mc-cot-lam-bai"[^>]*data-nhan="Phần làm bài của Nam"/)
  })

  it('đợt đơn có DÒNG ĐẦU thẻ đề: chip "Câu N" + chip phần ("Phần II · Đúng / Sai"); CSS chỉ hiện nó ở đợt đơn', () => {
    const h = taoHtmlMayChieu([o('A', 'An', { cau: cauI('d', 'từ '.repeat(400), 'II'), soCau: 19, bacUoc: 2 })], {})
    expect(h).toContain('<div class="mc-de-dau"><span class="mc-de-so">Câu 19</span><span class="mc-de-phan">Phần II · Đúng / Sai</span></div>')
    expect(CSS_GIAO_DIEN_TO_CHIEU).toContain('body.mc .mc-de-dau{display:none}')
    expect(CSS_GIAO_DIEN_TO_CHIEU).toMatch(/body\.mc-bc \.mc-dot-don \.mc-de-dau\{display:flex/)
    expect(CSS_GIAO_DIEN_TO_CHIEU).toMatch(/body\.mc-bc \.mc-dot-don \.mc-em \.mc-cau-so\{display:none\}/)
  })
})

describe('giờ hai pha của từng ô: MỘT nguồn với Engine E (`thoiGianCau`)', () => {
  it('`data-lam` = T_đọc + T_làm, `data-chua` = T_chữa của chính ô ấy (kể cả tỉ lệ lớp sai và bậc em)', () => {
    const dsO = [
      o('A', 'An', { tiLeLopSai: 0.6, bacEm: 'biet', sao: 2 }),
      o('B', 'Bình', { cau: cauI('q-B', 'từ '.repeat(80), 'III'), sao: 0 }),
    ]
    const h = taoHtmlMayChieu(dsO, {})
    const doc = new JSDOM(h).window.document
    const nua = [...doc.querySelectorAll<HTMLElement>('.mc-nua[data-lam]')]
    expect(nua).toHaveLength(2)
    dsO.forEach((x, i) => {
      const t = thoiGianCau({ phan: x.cau.phan, sao: x.sao as 0 | 1 | 2, noiDung: noiDungTuCauLuyen(x.cau), tiLeLopSai: x.tiLeLopSai, bacEm: x.bacEm ?? null })
      expect(Number(nua[i].getAttribute('data-lam')), x.sbd).toBe(Math.round(t.doc + t.lam))
      expect(Number(nua[i].getAttribute('data-chua')), x.sbd).toBe(Math.round(t.chua))
    })
    // sao 2 + lớp sai nhiều + bậc "biết" phải LÂU HƠN câu 0 sao ngắn
    expect(Number(nua[0].getAttribute('data-lam'))).toBeGreaterThan(Number(new JSDOM(taoHtmlMayChieu([o('C', 'Cường', { sao: 0 })], {})).window.document.querySelector('.mc-nua')!.getAttribute('data-lam')))
  })
})

describe('thanh dưới: đủ phần tử, giữ id cũ, ngân sách buổi', () => {
  it('có đủ id (mã cũ và mới) và hộp cài đặt chứa nền giấy, cỡ chữ, toàn màn hình', () => {
    const h = taoHtmlMayChieu([o('A', 'An')], { tenBuoi: 'Chữa bài ca 111111', nganSachPhut: 90 })
    const doc = new JSDOM(h).window.document
    for (const id of ['mc-thanh', 'mc-truoc', 'mc-sau', 'mc-dem', 'mc-pha', 'mc-len-bang', 'mc-tiep', 'mc-cai-btn', 'mc-cai-dat', 'mc-palette', 'mc-size', 'mc-toan', 'mc-ray']) {
      expect(doc.getElementById(id), id).toBeTruthy()
    }
    expect(doc.getElementById('mc-cai-dat')!.hasAttribute('hidden')).toBe(true)
    expect(doc.getElementById('mc-cai-dat')!.contains(doc.getElementById('mc-palette'))).toBe(true)
    expect(doc.getElementById('mc-cai-dat')!.textContent).toContain('Chữa bài ca 111111')
    expect(doc.body.getAttribute('data-ngan-sach')).toBe('90')
    expect(doc.getElementById('mc-dem')!.textContent).toBe('Đợt 1/1')
    // tờ in ra giấy KHÔNG có thanh và hộp cài đặt
    expect(CSS_GIAO_DIEN_TO_CHIEU).toMatch(/@media print\{\.mc-thanh,#mc-cai-dat,\.mc-intro\{display:none!important\}/)
  })

  it('không truyền ngân sách (hoặc rác) ⇒ không có thuộc tính; không emoji trên thanh', () => {
    for (const ns of [undefined, 0, -5, NaN]) expect(taoHtmlMayChieu([o('A', 'An')], { nganSachPhut: ns as number })).not.toContain('data-ngan-sach="')
    const h = taoHtmlMayChieu([o('A', 'An')], { nganSachPhut: 90 })
    const thanh = h.slice(h.indexOf('<div class="mc-thanh"'), h.indexOf('<div class="mc-ray"'))
    expect(thanh).not.toMatch(/\p{Extended_Pictographic}(?<!⛶)/u)
  })
})

describe('TRONG LÚC ĐỌC ĐỀ KHÔNG CÓ GÌ CHUYỂN ĐỘNG', () => {
  it('thần thú trên thẻ tên và mọi thẻ đọc đề: animation:none; hiệu ứng chỉ có ở màn gọi tên và ăn mừng', () => {
    expect(CSS_GIAO_DIEN_TO_CHIEU).toContain('body.mc .mc-thu-anh,body.mc .mc-ten-reveal{animation:none!important}')
    // mọi `animation:` trong CSS giao diện mới: hoặc là none, hoặc nằm ở luật của màn gọi tên / ăn mừng
    for (const m of CSS_GIAO_DIEN_TO_CHIEU.matchAll(/([^{}]+)\{[^{}]*animation:([^;}]+)/g)) {
      const bo = m[1].trim()
      const ten = m[2].trim()
      if (ten.startsWith('none')) continue
      expect(bo, `luật có chuyển động ngoài màn gọi tên/ăn mừng: ${bo}`).toMatch(/mc-intro|mc-mung/)
    }
    expect(CSS_GIAO_DIEN_TO_CHIEU).toMatch(/@keyframes mc-hao-quang/)
    expect(CSS_GIAO_DIEN_TO_CHIEU).toMatch(/@keyframes mc-nhay/)
  })

  it('`prefers-reduced-motion` tắt hết: CSS tắt hào quang + nhảy + lấp lánh; JS bỏ luôn màn gọi tên', () => {
    expect(CSS_GIAO_DIEN_TO_CHIEU).toMatch(/@media \(prefers-reduced-motion:reduce\)\{[^@]*mc-intro-card:before[^@]*mc-mung[^@]*animation:none!important/)
    const h = taoHtmlMayChieu([o('A', 'An')], {})
    expect(h).toContain("window.matchMedia('(prefers-reduced-motion: reduce)').matches")
  })

  it('thu về thẻ tên đúng thời gian đã chốt: 2,5 s gọi tên, 1,5 s ăn mừng', () => {
    expect(GIAO_DIEN_TO_CHIEU.GOI_TEN_MS).toBe(2500)
    expect(GIAO_DIEN_TO_CHIEU.AN_MUNG_MS).toBe(1500)
  })
})

// ─────────────────────────── 2. MÃ TRONG TỜ (JSDOM) ───────────────────────────
interface Hen {
  f: () => void
  ms: number
  iv: boolean
  id: number
  huy: boolean
}

function moTo(dsO: OBang[], opt: { tuyChon?: Parameters<typeof taoHtmlMayChieu>[1]; giam?: boolean; anh?: boolean; coCha?: boolean } = {}) {
  const hen: Hen[] = []
  let bay = 0
  const cha = new JSDOM('<!doctype html><body></body>', { url: `${GOC}/` }).window as unknown as Window & { postMessage: (m: unknown, o?: string) => void }
  cha.postMessage = (() => {}) as never
  const html = taoHtmlMayChieu(dsO, opt.tuyChon ?? {})
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    virtualConsole: new VirtualConsole(),
    beforeParse(w) {
      if (opt.coCha) Object.defineProperty(w, 'parent', { get: () => cha, configurable: true })
      let id = 0
      w.Date.now = () => bay
      w.setTimeout = ((f: () => void, ms: number) => (hen.push({ f, ms, iv: false, id: ++id, huy: false }), id)) as never
      w.setInterval = ((f: () => void, ms: number) => (hen.push({ f, ms, iv: true, id: ++id, huy: false }), id)) as never
      w.clearTimeout = w.clearInterval = ((h: number) => {
        const x = hen.find((t) => t.id === h)
        if (x) x.huy = true
      }) as never
      w.HTMLElement.prototype.scrollTo = () => {}
      if (opt.anh !== false) {
        Object.defineProperty(w.HTMLImageElement.prototype, 'complete', { get: () => true, configurable: true })
        Object.defineProperty(w.HTMLImageElement.prototype, 'naturalWidth', { get: () => 100, configurable: true })
      }
      if (opt.giam !== undefined) (w as unknown as { matchMedia: unknown }).matchMedia = () => ({ matches: opt.giam })
    },
  })
  const w = dom.window as unknown as Window & typeof globalThis
  const doc = dom.window.document
  const chay = (ms: number) => hen.filter((t) => !t.huy && !t.iv && t.ms === ms).forEach((t) => ((t.huy = true), t.f()))
  const nhip = () => hen.filter((t) => !t.huy && t.iv && t.ms === 250).forEach((t) => t.f())
  const dat = (giay: number) => {
    bay = giay * 1000
  }
  const thanh = () => doc.getElementById('mc-thanh')!
  const pha = () => thanh().getAttribute('data-pha')
  const dong = () => doc.getElementById('mc-clock')!.textContent
  const tiep = () => doc.getElementById('mc-tiep')!.textContent
  const buoi = () => doc.getElementById('mc-buoi')!.textContent
  const goiXong = () => {
    chay(GIAO_DIEN_TO_CHIEU.GOI_TEN_MS)
    chay(GIAO_DIEN_TO_CHIEU.BAY_VE_THE_MS + 60)
  }
  return { dom, doc, w, hen, chay, nhip, dat, thanh, pha, dong, tiep, buoi, goiXong, cha, html }
}

const HAI_EM = () => [o('A', 'Nguyễn Văn Minh', { thanThu: thu('Lửa'), lanLenBang: 3 }), o('B', 'Trần Thu Hà', { thanThu: thu('Nước', 'Thuỷ Lân', 8), lanLenBang: 1, soCau: 9 })]
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

describe('màn gọi tên đầu đợt', () => {
  it('có thần thú ⇒ bấm nút mới hiện màn gọi tên: mỗi em một nửa, tên to, thú · cấp, chip câu + lần lên bảng; đồng hồ đứng yên (pha "goi")', () => {
    const t = moTo(HAI_EM()); t.doc.getElementById('mc-len-bang')!.click()
    const the = [...t.doc.querySelectorAll('.mc-intro-card')]
    expect(the).toHaveLength(2)
    expect(t.doc.querySelector('.mc-intro-label')!.textContent).toBe('Đợt 1 · mời hai bạn lên bảng')
    expect(the[0].querySelector('h2')!.textContent).toBe('Nguyễn Văn Minh')
    expect(the[0].querySelector('p')!.textContent).toBe('Hoả Long · Cấp 12')
    expect([...the[0].querySelectorAll('.mc-intro-chips span')].map((x) => x.textContent)).toEqual(['Câu 7', 'Lần lên bảng thứ 3'])
    expect([...the[1].querySelectorAll('.mc-intro-chips span')].map((x) => x.textContent)).toEqual(['Câu 9', 'Lần lên bảng thứ 1'])
    expect((the[0] as HTMLElement).style.getPropertyValue('--aura')).toBe('241,99,59')
    expect((the[1] as HTMLElement).style.getPropertyValue('--aura')).toBe('43,166,208')
    expect(t.pha()).toBe('goi')
    expect(t.doc.getElementById('mc-pha')!.textContent).toBe('MỜI LÊN BẢNG')
    expect(t.doc.getElementById('mc-clock')).toBeNull()
    t.dat(1000)
    t.nhip()
    expect(t.pha()).toBe('goi')
  })

  it('sau 2,5 s thu về thẻ tên (bay 0,85 s) rồi sang CHỮA; màn gọi tên biến mất', () => {
    const t = moTo(HAI_EM()); t.doc.getElementById('mc-len-bang')!.click()
    expect(t.hen.some((x) => !x.huy && x.ms === GIAO_DIEN_TO_CHIEU.GOI_TEN_MS)).toBe(true)
    t.chay(GIAO_DIEN_TO_CHIEU.GOI_TEN_MS)
    expect(t.doc.querySelector('.mc-intro')!.classList.contains('mc-shrink')).toBe(true)
    expect(t.pha()).toBe('goi') // còn đang bay
    t.chay(GIAO_DIEN_TO_CHIEU.BAY_VE_THE_MS + 60)
    expect(t.doc.querySelector('.mc-intro')).toBeNull()
    expect(t.pha()).toBe('chua')
    expect(t.doc.getElementById('mc-pha')!.textContent).toBe('ĐANG CHỮA')
  })

  it('bấm phím bất kỳ, hoặc chạm vào màn gọi tên ⇒ bỏ qua ngay và sang CHỮA', () => {
    const a = moTo(HAI_EM()); a.doc.getElementById('mc-len-bang')!.click()
    a.doc.dispatchEvent(new a.w.KeyboardEvent('keydown', { key: 'a' }))
    expect(a.doc.querySelector('.mc-intro')).toBeNull()
    expect(a.pha()).toBe('chua')
    const b = moTo(HAI_EM()); b.doc.getElementById('mc-len-bang')!.click()
    ;(b.doc.querySelector('.mc-intro') as HTMLElement).click()
    expect(b.doc.querySelector('.mc-intro')).toBeNull()
    expect(b.pha()).toBe('chua')
  })

  it('giảm chuyển động ⇒ KHÔNG có màn gọi tên nào, bấm nút vào thẳng CHỮA; không phải ⇒ có', () => {
    const giam = moTo(HAI_EM(), { giam: true }); giam.doc.getElementById('mc-len-bang')!.click()
    expect(giam.doc.querySelector('.mc-intro')).toBeNull()
    expect(giam.pha()).toBe('chua')
    const normal=moTo(HAI_EM(),{giam:false});normal.doc.getElementById('mc-len-bang')!.click();expect(normal.doc.querySelector('.mc-intro')).toBeTruthy()
  })

  it('không thần thú nào tải được ⇒ bỏ qua màn gọi tên (không chờ, không bể); đợt sau vẫn gọi tên bình thường', () => {
    const t = moTo([o('A', 'An'), o('B', 'Bình')]); t.doc.getElementById('mc-len-bang')!.click()
    expect(t.doc.querySelector('.mc-intro')).toBeNull()
    expect(t.pha()).toBe('chua')
  })

  it('sang đợt khác ⇒ dọn màn gọi tên cũ, gọi tên đợt mới ("Đợt 2 · mời hai bạn lên bảng")', () => {
    const dsO = [...HAI_EM(), o('C', 'Cường', { thanThu: thu('Đất'), soCau: 11 }), o('D', 'Dung', { thanThu: thu('Khí'), soCau: 12 })]
    const t = moTo(dsO); t.doc.getElementById('mc-len-bang')!.click()
    t.goiXong()
    t.doc.getElementById('mc-sau')!.click(); expect(t.pha()).toBe('cho'); t.doc.getElementById('mc-len-bang')!.click()
    expect(t.doc.querySelectorAll('.mc-intro')).toHaveLength(1)
    expect(t.doc.querySelector('.mc-intro-label')!.textContent).toBe('Đợt 2 · mời hai bạn lên bảng')
    t.doc.getElementById('mc-truoc')!.click(); t.doc.getElementById('mc-len-bang')!.click()
    expect(t.doc.querySelector('.mc-intro-label')!.textContent).toBe('Đợt 1 · mời hai bạn lên bảng')
  })
})

describe('thanh dưới gọi thủ công, không còn đồng hồ',()=>{
  it.each([false,true])('dayHoc=%s: chờ vô hạn trước bấm; gọi xong không tự đổi đợt',dayHoc=>{
    const t=moTo([...HAI_EM(),o('C','Cường'),o('D','Dung')],{tuyChon:{dayHoc,nganSachPhut:90}})
    expect(t.pha()).toBe('cho')
    t.dat(3600);t.nhip()
    expect(t.pha()).toBe('cho')
    expect(t.doc.querySelectorAll('#mc-clock,#mc-buoi,#mc-tien-dong')).toHaveLength(0)
    expect(t.doc.querySelector('.mc-intro')).toBeNull()
    t.doc.getElementById('mc-len-bang')!.click();t.goiXong()
    expect(t.pha()).toBe('chua')
    t.dat(7200);t.nhip()
    expect(t.pha()).toBe('chua')
    expect(t.doc.getElementById('mc-dem')!.textContent).toBe('Đợt 1/2')
    t.doc.getElementById('mc-sau')!.click()
    expect(t.pha()).toBe('cho')
    expect((t.doc.getElementById('mc-len-bang') as HTMLButtonElement).disabled).toBe(false)
  })
  it('trang đáp án không gọi học sinh',()=>{
    const t=moTo([o('A','An')],{tuyChon:{dsDapAn:[cauI('x1')]}})
    t.doc.getElementById('mc-sau')!.click()
    expect(t.doc.getElementById('mc-dem')!.textContent).toBe('Đợt 2/2')
    expect((t.doc.getElementById('mc-len-bang') as HTMLButtonElement).hidden).toBe(true)
  })
})

describe('ăn mừng khi Đạt (chỉ Đạt)', () => {
  const cauNoi = () => moTo([o('A', 'An', { thanThu: thu('Lửa') }), o('B', 'Bình', { thanThu: thu('Nước') })], { tuyChon: { cauNoi: { maPhien: MA } }, coCha: true })
  const tuCha = (t: ReturnType<typeof moTo>, data: unknown) =>
    t.w.dispatchEvent(new (t.dom.window as unknown as { MessageEvent: typeof MessageEvent }).MessageEvent('message', { data, origin: GOC, source: t.cha as unknown as MessageEventSource }))

  it('DA_GHI kèm dat:true ⇒ thẻ tên xanh "Làm tốt lắm" + thần thú nhảy đúng 1,5 s rồi đứng yên (thẻ VẪN xanh)', () => {
    const t = cauNoi()
    tuCha(t, { type: TIN_TO_CHIEU.KET_NOI, maPhien: MA })
    const khoa = t.doc.querySelector('.mc-cham')!.getAttribute('data-khoa')!
    tuCha(t, { type: TIN_TO_CHIEU.DA_GHI, maPhien: MA, khoa, dat: true })
    const the = t.doc.querySelector('.mc-nua .mc-em')!
    expect(the.classList.contains('mc-em-dat')).toBe(true)
    expect(the.classList.contains('mc-mung')).toBe(true)
    expect(the.querySelector('.mc-lam-tot')!.textContent).toBe('Làm tốt lắm')
    // ô thứ hai KHÔNG bị ăn mừng theo
    expect(t.doc.querySelectorAll('.mc-nua')[1].querySelector('.mc-em')!.classList.contains('mc-em-dat')).toBe(false)
    expect(t.hen.some((x) => !x.huy && x.ms === GIAO_DIEN_TO_CHIEU.AN_MUNG_MS)).toBe(true)
    t.chay(GIAO_DIEN_TO_CHIEU.AN_MUNG_MS)
    expect(the.classList.contains('mc-mung')).toBe(false)
    expect(the.classList.contains('mc-em-dat')).toBe(true)
    expect(the.querySelectorAll('.mc-lam-tot')).toHaveLength(1)
  })

  it('PHAN_HOI da_ghi + dat:true (bấm ngay trên tờ) cũng ăn mừng; một lần duy nhất dù nhận thêm tin thứ hai', () => {
    const t = cauNoi()
    tuCha(t, { type: TIN_TO_CHIEU.KET_NOI, maPhien: MA })
    const v = t.doc.querySelector<HTMLElement>('.mc-cham')!
    const khoa = v.getAttribute('data-khoa')!
    ;(v.querySelector('.mc-cham-nut[data-kq="1"]') as HTMLElement).click()
    tuCha(t, { type: TIN_TO_CHIEU.PHAN_HOI, maPhien: MA, khoa, kq: 'da_ghi', dat: true })
    tuCha(t, { type: TIN_TO_CHIEU.DA_GHI, maPhien: MA, khoa, dat: true })
    expect(t.doc.querySelector('.mc-nua .mc-em')!.classList.contains('mc-em-dat')).toBe(true)
    expect(t.doc.querySelectorAll('.mc-lam-tot')).toHaveLength(1)
    expect(v.textContent).toBe('Đã ghi')
  })

  it('CHƯA ĐẠT (dat:false), hoặc tin không nói kết quả (nhắc ô đã ghi từ trước): KHÔNG hiệu ứng, KHÔNG đổi màu, chỉ "Đã ghi"', () => {
    for (const dat of [false, undefined, 'true', 1]) {
      const t = cauNoi()
      tuCha(t, { type: TIN_TO_CHIEU.KET_NOI, maPhien: MA })
      const v = t.doc.querySelector<HTMLElement>('.mc-cham')!
      tuCha(t, { type: TIN_TO_CHIEU.DA_GHI, maPhien: MA, khoa: v.getAttribute('data-khoa'), dat })
      const nua = t.doc.querySelector('.mc-nua')!
      expect(v.textContent, String(dat)).toBe('Đã ghi')
      expect(nua.querySelector('.mc-em')!.classList.contains('mc-em-dat'), String(dat)).toBe(false)
      expect(nua.querySelector('.mc-em')!.classList.contains('mc-mung'), String(dat)).toBe(false)
      expect(nua.querySelector('.mc-lam-tot'), String(dat)).toBeNull()
      // không chữ "Chưa đạt"/"Không đạt" nào cạnh tên em sau khi ghi
      expect(nua.querySelector('.mc-em')!.textContent).not.toMatch(/Chưa đạt|Không đạt/)
      expect(v.textContent).not.toMatch(/Chưa đạt|Không đạt|Đạt/)
    }
  })

  it('giảm chuyển động: vẫn xanh + "Làm tốt lắm" nhưng KHÔNG nhảy (không thêm lớp mc-mung, không hẹn giờ 1,5 s)', () => {
    const t = moTo([o('A', 'An', { thanThu: thu('Lửa') })], { tuyChon: { cauNoi: { maPhien: MA } }, coCha: true, giam: true })
    tuCha(t, { type: TIN_TO_CHIEU.KET_NOI, maPhien: MA })
    tuCha(t, { type: TIN_TO_CHIEU.DA_GHI, maPhien: MA, khoa: t.doc.querySelector('.mc-cham')!.getAttribute('data-khoa'), dat: true })
    const the = t.doc.querySelector('.mc-em')!
    expect(the.classList.contains('mc-em-dat')).toBe(true)
    expect(the.classList.contains('mc-mung')).toBe(false)
    expect(t.hen.some((x) => x.ms === GIAO_DIEN_TO_CHIEU.AN_MUNG_MS)).toBe(false)
  })

  it('sự kiện ăn mừng tự nó cũng chỉ nhận dat === true, và chỉ ăn mừng MỘT lần cho một thẻ', () => {
    const t = cauNoi()
    const vung = t.doc.querySelector('.mc-cham')!
    const phat = (dat: unknown) => t.doc.dispatchEvent(new t.w.CustomEvent('mc-ghi-nhan', { detail: { khoa: 'k', dat, vung } }))
    phat(false)
    phat('true')
    phat(undefined)
    expect(t.doc.querySelector('.mc-em-dat')).toBeNull()
    phat(true)
    phat(true)
    expect(t.doc.querySelectorAll('.mc-em-dat')).toHaveLength(1)
    expect(t.doc.querySelectorAll('.mc-lam-tot')).toHaveLength(1)
  })

  it('không có cầu nối ⇒ script của tờ không nhắc `mc-cham`, sự kiện ăn mừng không làm gì khi thiếu phần tử nguồn', () => {
    const t = moTo([o('A', 'An', { thanThu: thu('Lửa') })])
    t.doc.dispatchEvent(new t.w.CustomEvent('mc-ghi-nhan', { detail: { khoa: 'x', dat: true } }))
    t.doc.dispatchEvent(new t.w.CustomEvent('mc-ghi-nhan', { detail: null }))
    expect(t.doc.querySelector('.mc-em-dat')).toBeNull()
  })
})

describe('lời giải co chữ trước khi phải cuộn (sàn 24 px ở 1920)', () => {
  /** Một lớp phủ giả: chiều cao nội dung tỉ lệ với cỡ chữ đang đặt (`--mc-co-giai`). */
  function moGiai(rong: number, cao: number, tiLe: number, coDot = '') {
    const t = moTo([o('A', 'An')])
    Object.defineProperty(t.doc.getElementById('mc-ray')!, 'clientWidth', { get: () => rong, configurable: true })
    const dot = t.doc.querySelector<HTMLElement>('.mc-dot')!
    if (coDot) dot.style.setProperty('--mc-co', coDot)
    const g = t.doc.querySelector<HTMLElement>('.mc-giai')!
    g.hidden = false
    const co = () => parseFloat(g.style.getPropertyValue('--mc-co-giai'))
    Object.defineProperty(g, 'clientHeight', { get: () => cao, configurable: true })
    Object.defineProperty(g, 'clientWidth', { get: () => 900, configurable: true })
    Object.defineProperty(g, 'scrollHeight', { get: () => Math.round(co() * tiLe), configurable: true })
    Object.defineProperty(g, 'scrollWidth', { get: () => 900, configurable: true })
    const vua = (t.w as unknown as { __mcVuaLoiGiai: (x: HTMLElement) => void }).__mcVuaLoiGiai
    return { g, co, chay: () => vua(g), t }
  }

  it('bắt đầu từ cỡ chữ đề của đợt, giảm từng 1 px, DỪNG ở cỡ LỚN NHẤT còn vừa', () => {
    const x = moGiai(1920, 600, 20, '45px') // cao 600 px: vừa khi cỡ ≤ 30 px
    x.chay()
    expect(x.co()).toBe(30)
    expect(x.g.scrollHeight).toBeLessThanOrEqual(600)
  })

  it('vừa ngay ở cỡ đề ⇒ không co', () => {
    const x = moGiai(1920, 2000, 10, '45px')
    x.chay()
    expect(x.co()).toBe(45)
  })

  it('không vừa ngay cả ở sàn ⇒ co tới đúng SÀN 24 px @1920 (18 px @1440… quy đổi theo bề ngang) rồi để cuộn riêng', () => {
    const a = moGiai(1920, 100, 40, '45px')
    a.chay()
    expect(a.co()).toBe(24)
    const b = moGiai(1280, 100, 40, '30px')
    b.chay()
    expect(b.co()).toBeCloseTo(16, 1)
    // bề ngang lạ: bước co 1 px đi từ cỡ chuẩn nên dừng trong khoảng [sàn, sàn + 1 px) — không bao giờ DƯỚI sàn
    const c = moGiai(1366, 100, 40)
    c.chay()
    const san = Math.round(((1366 * 24) / 1920) * 10) / 10
    expect(c.co()).toBeGreaterThanOrEqual(san)
    expect(c.co()).toBeLessThan(san + 1)
  })

  it('bấm "Hiện lời giải" gọi bộ co chữ; đóng lời giải thì không', () => {
    const t = moTo([o('A', 'An')])
    let goi = 0
    ;(t.w as unknown as { __mcVuaLoiGiai: unknown }).__mcVuaLoiGiai = () => goi++
    const nut = t.doc.querySelector<HTMLButtonElement>('.mc-giai-vung .mc-nut-giai')!
    nut.click()
    expect(t.doc.querySelector('.mc-giai')!.hasAttribute('hidden')).toBe(false)
    nut.click()
    expect(t.doc.querySelector('.mc-giai')!.hasAttribute('hidden')).toBe(true)
    // bản gốc của hàm đã được nối vào click (không phải biến toàn cục thay được lúc chạy)
    expect(goi).toBe(0)
    expect(t.html).toContain('if (!mo) { void o.offsetHeight; vuaLoiGiai(o); }')
    // CSS THẬT SỰ đọc cỡ chữ do JS đặt (không thì co chữ chỉ là số vô nghĩa)
    expect(CSS_GIAO_DIEN_TO_CHIEU).toMatch(/\.mc-giai \.sol-box\{font-size:var\(--mc-co-giai,var\(--mc-co,28px\)\)\}/)
  })

  it('đợt đôi: mở lời giải ⇒ nửa bảng đổi sang chế độ "lời giải lấy cả nửa" (lớp mc-giai-mo), đóng thì trả lại; CSS ẩn vùng làm bài và cho thẻ đề giãn', () => {
    const t = moTo(HAI_EM())
    const nua = t.doc.querySelector('.mc-nua')!
    const nut = nua.querySelector<HTMLButtonElement>('.mc-giai-vung .mc-nut-giai')!
    nut.click()
    expect(nua.classList.contains('mc-giai-mo')).toBe(true)
    // nửa bảng bên kia không bị ảnh hưởng
    expect(t.doc.querySelectorAll('.mc-nua')[1].classList.contains('mc-giai-mo')).toBe(false)
    nut.click()
    expect(nua.classList.contains('mc-giai-mo')).toBe(false)
    expect(CSS_GIAO_DIEN_TO_CHIEU).toContain('body.mc-bc .mc-dot:not(.mc-dot-don) .mc-nua.mc-giai-mo .mc-trang{display:none}')
    expect(CSS_GIAO_DIEN_TO_CHIEU).toContain('body.mc-bc .mc-dot:not(.mc-dot-don) .mc-nua.mc-giai-mo .mc-vung-de{flex:1 1 0}')
    // hàng nút nằm ĐÈ lên giấy của lời giải ⇒ phải đảo màu, không thì chữ giấy-ấm-trên-giấy-ấm biến mất (đã gặp khi chụp ảnh)
    expect(CSS_GIAO_DIEN_TO_CHIEU).toContain('.mc-nua.mc-giai-mo .mc-giai-vung .mc-nut-giai{background:var(--mc-chu);color:var(--mc-giay)}')
    expect(CSS_GIAO_DIEN_NUT_CHAM).toContain('.mc-giai-mo .mc-cham-nut{background:var(--mc-chu);color:var(--mc-giay)}')
    expect(CSS_GIAO_DIEN_TO_CHIEU).toMatch(/\.mc-giai-vung\{position:absolute[^}]*z-index:8/) // trên lớp phủ lời giải (z-index 6)
  })
})

describe('hộp cài đặt trên thanh dưới', () => {
  it('bấm "Cài đặt" mở/đóng; bấm ra ngoài hoặc Esc thì đóng', () => {
    const t = moTo([o('A', 'An')])
    const btn = t.doc.getElementById('mc-cai-btn')!
    const hop = t.doc.getElementById('mc-cai-dat')!
    expect(hop.hidden).toBe(true)
    btn.click()
    expect(hop.hidden).toBe(false)
    expect(btn.getAttribute('aria-expanded')).toBe('true')
    t.doc.getElementById('mc-palette')!.click() // bấm trong hộp: không đóng
    expect(hop.hidden).toBe(false)
    t.doc.body.click()
    expect(hop.hidden).toBe(true)
    btn.click()
    expect(hop.hidden).toBe(false)
    btn.click() // bấm lần nữa: ĐÓNG
    expect(hop.hidden).toBe(true)
    btn.click()
    t.doc.dispatchEvent(new t.w.KeyboardEvent('keydown', { key: 'Escape' }))
    expect(hop.hidden).toBe(true)
    expect(btn.getAttribute('aria-expanded')).toBe('false')
  })
})

// ─────────────────────────── 3. NỐI MÀN GIÁO VIÊN ───────────────────────────
describe('màn giáo viên đưa đủ dữ liệu cho tờ (khoá nguồn)', () => {
  const MAN = readFileSync('src/screens/GoiLenBangScreen.tsx', 'utf8')

  it('lần lên bảng thứ N (lần này tính vào), tỉ lệ lớp sai và bậc em cùng đầu vào Engine E, ngân sách buổi', () => {
    expect(MAN).toContain('lanLenBang: hoSoEmTheoSbd.get(p.sbd) ? hoSoEmTheoSbd.get(p.sbd)!.lenBang.soLan + 1 : undefined')
    expect(MAN).toContain('tiLeLopSai: tiLeDungTheoCau.get(p.cau.id) != null ? 1 - (tiLeDungTheoCau.get(p.cau.id) as number) : undefined')
    expect(MAN).toContain("bacEm: hoSoEmTheoSbd.get(p.sbd)?.namKt?.get(p.cau.id)?.bac ?? null")
    expect(MAN).toContain('nganSachPhut: dayHoc ? undefined : CAU_HINH_LEN_BANG_MAC_DINH.NGAN_SACH_PHUT')
  })

  it('tin về tờ mang `dat` khi ghi xong (DA_GHI và PHAN_HOI) để tờ ăn mừng đúng lúc, đúng em', () => {
    expect(MAN).toContain('guiToChieu({ type: TIN_TO_CHIEU.DA_GHI, khoa, dat })')
    expect(MAN).toContain("kq: ok ? 'da_ghi' : 'loi', dat: ok ? tin.dat : undefined")
    // nhắc lại ô đã ghi từ trước khi tờ mở KHÔNG mang `dat` (không ăn mừng lại chuyện cũ)
    expect(MAN).toContain('guiToChieu({ type: TIN_TO_CHIEU.DA_GHI, khoa })')
  })
})
