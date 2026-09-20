// CẦU NỐI TỜ MÁY CHIẾU → MÀN GIÁO VIÊN (GĐ 6 làn giáo viên, mốc d, 19/09/2026) — PHÍA TỜ CHIẾU VÀ GIAO THỨC.
//
// Thầy chốt "cho lên máy chiếu luôn": nút Đạt / Chưa đạt ngay trên tờ máy chiếu. Tờ là một trang HTML độc lập
// trong `<iframe srcDoc>`; nó KHÔNG có hàm ghi, chỉ gửi tin về khung cha. Tệp này soi:
//   · bốn lớp kiểm tin của màn giáo viên (`kiemTinToChieu`);
//   · tờ dựng ra có/không có nút đúng lúc (không cầu nối ⇒ y hệt cũ; mở riêng ⇒ bỏ hẳn nút);
//   · JS trong tờ chạy thật (JSDOM): bắt tay, bấm, bấm đúp, phản hồi, lỗi, hết 8 giây;
//   · TẾ NHỊ TRƯỚC LỚP: ghi xong chỉ còn nhãn "Đã ghi", cả hai kết quả CÙNG một DOM, không lưu kết quả ở đâu.
import { describe, it, expect, vi } from 'vitest'
import { JSDOM, VirtualConsole } from 'jsdom'
import { taoHtmlMayChieu, type OBang } from '../src/lib/html-may-chieu'
import {
  GIAY_CHO_PHAN_HOI,
  NHIP_BAT_TAY_MS,
  SO_LAN_BAT_TAY,
  TIN_TO_CHIEU,
  chuanMaPhien,
  gocGuiLai,
  khoaToChieu,
  kiemTinToChieu,
  mangNutChamToChieu,
  taoMaPhienChieu,
  type BoiCanhKiemTin,
} from '../src/lib/to-chieu-cau-noi'

const GOC = 'https://app.test'
const MA = 'PHIEN-abc123'

const o = (sbd: string, qid = `Q-${sbd}`, text = 'Câu ngắn'): OBang => ({
  sbd,
  hoTen: `Em ${sbd}`,
  qid,
  soCau: 1,
  sao: 1,
  cau: { phan: 'I', id: qid, text, luaChon: ['A', 'B', 'C', 'D'], dapAn: 'A', buoc: [] } as unknown as OBang['cau'],
})

describe('kiemTinToChieu — bốn lớp kiểm tin (không nhận lệnh ghi từ cửa sổ lạ)', () => {
  const KHUNG = { la: 'khung-to-chieu' }
  const ctx: BoiCanhKiemTin = {
    maPhien: MA,
    gocApp: GOC,
    laKhungToChieu: (s) => s === KHUNG,
    khoaHopLe: (k) => k === 'S1|Q1',
  }
  const tot = { data: { type: TIN_TO_CHIEU.CHAM, maPhien: MA, khoa: 'S1|Q1', dat: true }, origin: GOC, source: KHUNG }

  it('tin đủ bốn lớp ⇒ nhận, đúng khoá và đúng kết quả boolean', () => {
    expect(kiemTinToChieu(tot, ctx)).toEqual({ loai: 'cham', khoa: 'S1|Q1', dat: true })
    expect(kiemTinToChieu({ ...tot, data: { ...tot.data, dat: false } }, ctx)).toEqual({ loai: 'cham', khoa: 'S1|Q1', dat: false })
    expect(kiemTinToChieu({ ...tot, data: { type: TIN_TO_CHIEU.SAN_SANG, maPhien: MA } }, ctx)).toEqual({ loai: 'san_sang' })
  })

  it('LỚP 3 — sai/thiếu MÃ PHIÊN ⇒ bỏ', () => {
    expect(kiemTinToChieu({ ...tot, data: { ...tot.data, maPhien: 'doan-mo' } }, ctx)).toBeNull()
    expect(kiemTinToChieu({ ...tot, data: { type: tot.data.type, khoa: 'S1|Q1', dat: true } }, ctx)).toBeNull()
    expect(kiemTinToChieu(tot, { ...ctx, maPhien: '' })).toBeNull() // chưa có phiên nào đang mở
  })

  it('LỚP 1 — tin từ cửa sổ/khung KHÁC (dù biết mã phiên) ⇒ bỏ', () => {
    expect(kiemTinToChieu({ ...tot, source: { la: 'cua-so-la' } }, ctx)).toBeNull()
    expect(kiemTinToChieu({ ...tot, source: null }, ctx)).toBeNull()
  })

  it('LỚP 2 — origin lạ ⇒ bỏ; origin "null" của khung srcdoc/sandbox thì chấp nhận (nguồn đã kiểm ở lớp 1)', () => {
    expect(kiemTinToChieu({ ...tot, origin: 'https://ke-xau.example' }, ctx)).toBeNull()
    expect(kiemTinToChieu({ ...tot, origin: 'null' }, ctx)).not.toBeNull()
  })

  it('LỚP 4 — khoá không có trên tờ, kết quả không phải boolean, dữ liệu không phải object ⇒ bỏ', () => {
    expect(kiemTinToChieu({ ...tot, data: { ...tot.data, khoa: 'S9|Q9' } }, ctx)).toBeNull()
    expect(kiemTinToChieu({ ...tot, data: { ...tot.data, khoa: 42 } }, ctx)).toBeNull()
    for (const dat of ['true', 1, null, undefined]) expect(kiemTinToChieu({ ...tot, data: { ...tot.data, dat } }, ctx)).toBeNull()
    for (const data of ['ddh-mc-cham', 42, null, undefined, [], [1, 2]]) expect(kiemTinToChieu({ ...tot, data }, ctx)).toBeNull()
  })

  it('kiểu tin lạ ⇒ bỏ (KHÔNG chạy lệnh nào ngoài bắt tay và chấm)', () => {
    for (const type of ['ddh-mc-phan-hoi', 'ddh-mc-da-ghi', 'ddh-mc-ket-noi', 'xoa-het', '', undefined]) {
      expect(kiemTinToChieu({ ...tot, data: { ...tot.data, type } }, ctx)).toBeNull()
    }
  })
})

describe('tiện ích của giao thức', () => {
  it('mã phiên: ngẫu nhiên mỗi lần, đủ dài, chỉ ký tự an toàn cho thuộc tính HTML', () => {
    const a = taoMaPhienChieu()
    const b = taoMaPhienChieu()
    expect(a).not.toBe(b)
    expect(a.length).toBeGreaterThanOrEqual(16)
    expect(chuanMaPhien(a)).toBe(a)
  })

  it('chuanMaPhien bỏ ký tự nguy hiểm; không phải chuỗi ⇒ rỗng', () => {
    expect(chuanMaPhien('a"b<c>d e/f')).toBe('abcdef')
    expect(chuanMaPhien(undefined)).toBe('')
    expect(chuanMaPhien(123)).toBe('')
  })

  it('khoá ô là `sbd|qid` (CHUNG với bảng buổi chữa) và gốc gửi lại xử "null" thành "*"', () => {
    expect(khoaToChieu('12001', 'Q7')).toBe('12001|Q7')
    expect(gocGuiLai('null')).toBe('*')
    expect(gocGuiLai(GOC)).toBe(GOC)
  })

  it('mảnh markup thoát dấu ngoặc kép trong khoá', () => {
    const h = mangNutChamToChieu('a"b|q')
    expect(h).toContain('data-khoa="a&quot;b|q"')
    expect(h.match(/data-khoa="/g)).toHaveLength(1)
  })
})

describe('tờ dựng ra: có nút khi nào', () => {
  it('KHÔNG cầu nối ⇒ tờ không có nút, không mã, không kiểu, không script cầu nối (chỉ còn script của tờ và của bố cục)', () => {
    for (const h of [taoHtmlMayChieu([o('A'), o('B')]), taoHtmlMayChieu([o('A'), o('B')], { cauNoi: undefined }), taoHtmlMayChieu([o('A'), o('B')], { cauNoi: { maPhien: '' } }), taoHtmlMayChieu([o('A'), o('B')], { cauNoi: { maPhien: '"<>/ ' } })]) {
      expect(h).not.toContain('mc-cham')
      expect(h).not.toContain('data-cau-noi')
      expect(h).not.toContain('ddh-mc-')
      expect(h).toContain('<body class="mc">')
      expect(h.match(/<script>/g)).toHaveLength(2) // tờ + bố cục đo thật (M2); KHÔNG có script cầu nối
    }
    expect(taoHtmlMayChieu([o('A'), o('B')])).toBe(taoHtmlMayChieu([o('A'), o('B')], { cauNoi: undefined }))
  })

  it('có cầu nối ⇒ MỖI ô em × câu có đúng một mảnh nút, khoá = sbd|qid, mã phiên nằm ở <body>', () => {
    const h = taoHtmlMayChieu([o('A'), o('B'), o('C')], { cauNoi: { maPhien: MA } })
    const doc = new JSDOM(h).window.document
    expect(doc.body.getAttribute('data-cau-noi')).toBe(MA)
    const khoa = [...doc.querySelectorAll('.mc-cham')].map((n) => n.getAttribute('data-khoa'))
    expect(khoa).toEqual(['A|Q-A', 'B|Q-B', 'C|Q-C'])
    for (const v of doc.querySelectorAll('.mc-cham')) {
      expect([...v.querySelectorAll('.mc-cham-nut')].map((b) => b.textContent)).toEqual(['Đạt', 'Chưa đạt'])
    }
  })

  it('ô không có qid ⇒ không nút; nửa để trắng (đợt lẻ) ⇒ không nút', () => {
    const khongQid = { ...o('B'), qid: undefined }
    const h = taoHtmlMayChieu([o('A'), khongQid, o('C')], { cauNoi: { maPhien: MA } })
    const doc = new JSDOM(h).window.document
    expect([...doc.querySelectorAll('.mc-cham')].map((n) => n.getAttribute('data-khoa'))).toEqual(['A|Q-A', 'C|Q-C'])
    expect(doc.querySelectorAll('.mc-trong .mc-cham')).toHaveLength(0)
  })

  it('TRANG ĐÁP ÁN và câu "chỉ đọc đáp án" KHÔNG có nút', () => {
    const dsDapAn = Array.from({ length: 14 }, (_, i) => ({ phan: 'I', id: `D${i}`, text: 'x', luaChon: ['a', 'b', 'c', 'd'], dapAn: 'A', buoc: [], chot: '' })) as unknown as OBang['cau'][]
    const h = taoHtmlMayChieu([o('A')], { cauNoi: { maPhien: MA }, dsDapAn })
    const doc = new JSDOM(h).window.document
    expect(doc.querySelectorAll('.mc-dot-da')).toHaveLength(2)
    expect(doc.querySelectorAll('.mc-dot-da .mc-cham, .mc-da-o .mc-cham')).toHaveLength(0)
    expect(doc.querySelectorAll('.mc-cham')).toHaveLength(1)
  })

  it('câu dài (đợt một em, cột trắng bên phải) cũng có nút, ở vùng lời giải chứ không ở cột trắng', () => {
    const dai = o('A', 'Q-A', 'dài '.repeat(200))
    const doc = new JSDOM(taoHtmlMayChieu([dai], { cauNoi: { maPhien: MA } })).window.document
    expect(doc.querySelectorAll('.mc-dot-don')).toHaveLength(1)
    expect(doc.querySelectorAll('.mc-giai-vung .mc-cham')).toHaveLength(1)
    expect(doc.querySelectorAll('.mc-cot-lam-bai .mc-cham, .mc-trang .mc-cham')).toHaveLength(0)
  })

  it('nút TRUNG TÍNH: CSS của nút không có màu đỏ/xanh lục/cam của thẻ kết quả', () => {
    const h = taoHtmlMayChieu([o('A')], { cauNoi: { maPhien: MA } })
    const css = h.slice(h.lastIndexOf('<style>'), h.indexOf('</head>'))
    expect(css).toContain('.mc-cham-nut')
    expect(css).not.toMatch(/--mc-do\b|--mc-luc\b|--mc-cam\b|#[cC]5221[fF]|red|green/)
  })
})

// ─────────────── JS TRONG TỜ, CHẠY THẬT TRONG JSDOM ───────────────
type Tin = { m: Record<string, unknown>; o: string }

function moTo(opt: { dsO?: OBang[]; coCha?: boolean } = {}) {
  const cha = new JSDOM('<!doctype html><body></body>', { url: `${GOC}/` }).window as unknown as Window & { postMessage: (m: unknown, o?: string) => void }
  const gui: Tin[] = []
  cha.postMessage = ((m: Record<string, unknown>, ogoc: string) => {
    gui.push({ m, o: ogoc })
  }) as never
  const hen: { f: () => void; ms: number; iv: boolean; id: number; huy: boolean }[] = []
  const html = taoHtmlMayChieu(opt.dsO ?? [o('A'), o('B')], { cauNoi: { maPhien: MA } })
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    virtualConsole: new VirtualConsole(),
    beforeParse(w) {
      if (opt.coCha ?? true) Object.defineProperty(w, 'parent', { get: () => cha, configurable: true })
      let id = 0
      w.setTimeout = ((f: () => void, ms: number) => {
        hen.push({ f, ms, iv: false, id: ++id, huy: false })
        return id
      }) as never
      w.setInterval = ((f: () => void, ms: number) => {
        hen.push({ f, ms, iv: true, id: ++id, huy: false })
        return id
      }) as never
      w.clearTimeout = w.clearInterval = ((h: number) => {
        const x = hen.find((t) => t.id === h)
        if (x) x.huy = true
      }) as never
      w.HTMLElement.prototype.scrollTo = () => {}
    },
  })
  const w = dom.window as unknown as Window & typeof globalThis
  const doc = dom.window.document
  const tuCha = (data: unknown, ogoc = GOC, nguon: unknown = cha) => {
    w.dispatchEvent(new (dom.window as unknown as { MessageEvent: typeof MessageEvent }).MessageEvent('message', { data, origin: ogoc, source: nguon as MessageEventSource }))
  }
  const ketNoi = () => tuCha({ type: TIN_TO_CHIEU.KET_NOI, maPhien: MA })
  const o1 = () => doc.querySelectorAll<HTMLElement>('.mc-cham')[0]!
  const nut = (v: HTMLElement, chu: 'Đạt' | 'Chưa đạt') => [...v.querySelectorAll<HTMLButtonElement>('.mc-cham-nut')].find((b) => b.textContent === chu)!
  const hienTai = () => hen.filter((t) => !t.huy)
  const chayHen = (ms: number) => hienTai().filter((t) => !t.iv && t.ms === ms).forEach((t) => (t.huy = true, t.f()))
  const chayNhip = () => hienTai().filter((t) => t.iv).forEach((t) => t.f())
  return { dom, doc, w, cha, gui, hen, tuCha, ketNoi, o1, nut, chayHen, chayNhip, hienTai, html }
}
const daBam = (gui: Tin[]) => gui.filter((t) => t.m.type === TIN_TO_CHIEU.CHAM)

describe('tờ chiếu chạy thật — mở RIÊNG (không qua app)', () => {
  it('không có khung cha ⇒ bỏ HẲN mọi nút, không gửi tin, không hẹn giờ', () => {
    const t = moTo({ coCha: false })
    expect(t.doc.querySelectorAll('.mc-cham')).toHaveLength(0)
    expect(t.doc.querySelectorAll('.mc-cham-nut')).toHaveLength(0)
    expect(t.doc.body.classList.contains('mc-noi')).toBe(false)
    expect(t.gui).toHaveLength(0)
    expect(t.hienTai().filter((x) => x.ms === NHIP_BAT_TAY_MS)).toHaveLength(0)
    // …và phần còn lại của tờ vẫn nguyên: hai em, hai đề, hai nút "Hiện lời giải".
    expect(t.doc.querySelectorAll('.mc-nua .mc-nut-giai').length).toBeGreaterThanOrEqual(2)
  })
})

describe('tờ chiếu chạy thật — bắt tay với màn giáo viên', () => {
  it('gửi SAN_SANG kèm mã phiên ngay khi mở, tới đúng gốc của cha; nút VẪN ẨN cho tới khi có KET_NOI', () => {
    const t = moTo()
    expect(t.gui).toHaveLength(1)
    expect(t.gui[0]).toEqual({ m: { type: TIN_TO_CHIEU.SAN_SANG, maPhien: MA }, o: GOC })
    expect(t.doc.body.classList.contains('mc-noi')).toBe(false)
    expect(t.doc.querySelectorAll('.mc-cham')).toHaveLength(2) // có trong DOM nhưng CSS ẩn (display:none) tới khi kết nối
  })

  it('gửi lặp mỗi nhịp tới khi có KET_NOI (phòng app nghe chậm), rồi thôi', () => {
    const t = moTo()
    t.chayNhip()
    t.chayNhip()
    expect(t.gui.filter((x) => x.m.type === TIN_TO_CHIEU.SAN_SANG)).toHaveLength(3)
    t.ketNoi()
    expect(t.hienTai().filter((x) => x.iv && x.ms === NHIP_BAT_TAY_MS)).toHaveLength(0) // còn nhịp 250 ms của thanh dưới (đồng hồ pha) — không phải nhịp bắt tay
    t.chayNhip()
    expect(t.gui.filter((x) => x.m.type === TIN_TO_CHIEU.SAN_SANG)).toHaveLength(3)
  })

  it('có KET_NOI đúng mã, từ đúng cha ⇒ nút hiện (lớp mc-noi)', () => {
    const t = moTo()
    t.ketNoi()
    expect(t.doc.body.classList.contains('mc-noi')).toBe(true)
  })

  it('KET_NOI sai mã / từ nguồn lạ / gốc lạ ⇒ KHÔNG hiện nút', () => {
    const t = moTo()
    t.tuCha({ type: TIN_TO_CHIEU.KET_NOI, maPhien: 'khac' })
    t.tuCha({ type: TIN_TO_CHIEU.KET_NOI, maPhien: MA }, GOC, t.w) // nguồn không phải khung cha
    t.tuCha({ type: TIN_TO_CHIEU.KET_NOI, maPhien: MA }, 'https://ke-xau.example')
    t.tuCha('ddh-mc-ket-noi')
    expect(t.doc.body.classList.contains('mc-noi')).toBe(false)
  })

  it(`không ai trả lời sau ${SO_LAN_BAT_TAY} nhịp ⇒ BỎ HẲN nút (tờ mở trong khung không phải app)`, () => {
    const t = moTo()
    for (let i = 0; i < SO_LAN_BAT_TAY; i++) t.chayNhip()
    expect(t.doc.querySelectorAll('.mc-cham')).toHaveLength(0)
    expect(t.doc.body.classList.contains('mc-noi')).toBe(false)
  })
})

describe('tờ chiếu chạy thật — bấm nút', () => {
  it('bấm Đạt ⇒ gửi ĐÚNG MỘT tin CHAM {khoa, dat:true, maPhien}; bấm Chưa đạt ⇒ dat:false', () => {
    const t = moTo()
    t.ketNoi()
    t.nut(t.o1(), 'Đạt').click()
    expect(daBam(t.gui)).toHaveLength(1)
    expect(daBam(t.gui)[0]).toEqual({ m: { type: TIN_TO_CHIEU.CHAM, maPhien: MA, khoa: 'A|Q-A', dat: true }, o: GOC })
    const v2 = t.doc.querySelectorAll<HTMLElement>('.mc-cham')[1]!
    t.nut(v2, 'Chưa đạt').click()
    expect(daBam(t.gui)[1].m).toMatchObject({ khoa: 'B|Q-B', dat: false })
  })

  it('BẤM ĐÚP (và bấm nút kia lúc đang chờ) ⇒ vẫn MỘT tin; nút khoá, hiện "Đang ghi…"', () => {
    const t = moTo()
    t.ketNoi()
    const v = t.o1()
    t.nut(v, 'Đạt').click()
    t.nut(v, 'Đạt').click()
    t.nut(v, 'Chưa đạt').click()
    expect(daBam(t.gui)).toHaveLength(1)
    expect(t.nut(v, 'Đạt').disabled).toBe(true)
    expect(t.nut(v, 'Chưa đạt').disabled).toBe(true)
    expect(v.querySelector('.mc-cham-tin')!.textContent).toBe('Đang ghi…')
  })

  it('chưa KẾT NỐI mà bấm (nút bị ép hiện) ⇒ không gửi gì', () => {
    const t = moTo()
    t.nut(t.o1(), 'Đạt').click()
    expect(daBam(t.gui)).toHaveLength(0)
  })

  it('PHAN_HOI da_ghi ⇒ ô chỉ còn nhãn "Đã ghi", không còn nút', () => {
    const t = moTo()
    t.ketNoi()
    t.nut(t.o1(), 'Đạt').click()
    t.tuCha({ type: TIN_TO_CHIEU.PHAN_HOI, maPhien: MA, khoa: 'A|Q-A', kq: 'da_ghi' })
    const v = t.o1()
    expect(v.getAttribute('data-cham')).toBe('xong')
    expect(v.textContent).toBe('Đã ghi')
    expect(v.querySelectorAll('button')).toHaveLength(0)
  })

  it('PHAN_HOI loi ⇒ nút MỞ LẠI + dòng "chưa ghi được, bấm lại"; bấm lại gửi tin thứ hai', () => {
    const t = moTo()
    t.ketNoi()
    const v = t.o1()
    t.nut(v, 'Đạt').click()
    t.tuCha({ type: TIN_TO_CHIEU.PHAN_HOI, maPhien: MA, khoa: 'A|Q-A', kq: 'loi' })
    expect(t.nut(v, 'Đạt').disabled).toBe(false)
    expect(t.nut(v, 'Chưa đạt').disabled).toBe(false)
    expect(v.querySelector('.mc-cham-tin')!.textContent).toBe('chưa ghi được, bấm lại')
    t.nut(v, 'Chưa đạt').click()
    expect(daBam(t.gui)).toHaveLength(2)
    expect(daBam(t.gui)[1].m).toMatchObject({ dat: false })
  })

  it(`KHÔNG phản hồi trong ${GIAY_CHO_PHAN_HOI} giây ⇒ coi là LỖI, mở lại nút`, () => {
    const t = moTo()
    t.ketNoi()
    const v = t.o1()
    t.nut(v, 'Đạt').click()
    expect(t.hienTai().filter((x) => !x.iv && x.ms === GIAY_CHO_PHAN_HOI * 1000)).toHaveLength(1)
    t.chayHen(GIAY_CHO_PHAN_HOI * 1000)
    expect(t.nut(v, 'Đạt').disabled).toBe(false)
    expect(v.querySelector('.mc-cham-tin')!.textContent).toBe('chưa ghi được, bấm lại')
  })

  it('có phản hồi đúng hạn thì hẹn giờ 8 giây bị HUỶ (không nhảy sang "lỗi" sau đó)', () => {
    const t = moTo()
    t.ketNoi()
    t.nut(t.o1(), 'Đạt').click()
    t.tuCha({ type: TIN_TO_CHIEU.PHAN_HOI, maPhien: MA, khoa: 'A|Q-A', kq: 'da_ghi' })
    expect(t.hienTai().filter((x) => !x.iv && x.ms === GIAY_CHO_PHAN_HOI * 1000)).toHaveLength(0)
    expect(t.o1().textContent).toBe('Đã ghi')
  })

  it('phản hồi MUỘN da_ghi sau khi đã báo lỗi ⇒ vẫn khoá ô (app thật đã ghi rồi)', () => {
    const t = moTo()
    t.ketNoi()
    t.nut(t.o1(), 'Đạt').click()
    t.chayHen(GIAY_CHO_PHAN_HOI * 1000)
    t.tuCha({ type: TIN_TO_CHIEU.PHAN_HOI, maPhien: MA, khoa: 'A|Q-A', kq: 'da_ghi' })
    expect(t.o1().textContent).toBe('Đã ghi')
  })

  it('ô đã ghi ở chỗ KHÁC (bảng buổi chữa) ⇒ app đẩy DA_GHI, ô khoá ngay dù thầy chưa bấm gì ở tờ', () => {
    const t = moTo()
    t.ketNoi()
    t.tuCha({ type: TIN_TO_CHIEU.DA_GHI, maPhien: MA, khoa: 'B|Q-B' })
    const v2 = t.doc.querySelectorAll<HTMLElement>('.mc-cham')[1]!
    expect(v2.textContent).toBe('Đã ghi')
    expect(t.doc.querySelectorAll<HTMLElement>('.mc-cham')[0]!.querySelectorAll('button')).toHaveLength(2)
  })

  it('tin phản hồi sai mã / nguồn lạ / khoá không có / ô đang rảnh ⇒ bỏ qua, không đổi gì', () => {
    const t = moTo()
    t.ketNoi()
    const truoc = t.doc.body.innerHTML
    t.tuCha({ type: TIN_TO_CHIEU.PHAN_HOI, maPhien: 'khac', khoa: 'A|Q-A', kq: 'da_ghi' })
    t.tuCha({ type: TIN_TO_CHIEU.PHAN_HOI, maPhien: MA, khoa: 'A|Q-A', kq: 'da_ghi' }, GOC, t.w)
    t.tuCha({ type: TIN_TO_CHIEU.PHAN_HOI, maPhien: MA, khoa: 'X|Q-X', kq: 'da_ghi' })
    t.tuCha({ type: TIN_TO_CHIEU.PHAN_HOI, maPhien: MA, khoa: 'A|Q-A', kq: 'loi' }) // ô chưa bấm mà đã có "lỗi"
    expect(t.doc.body.innerHTML).toBe(truoc)
  })

  it('một ô ghi xong KHÔNG ảnh hưởng ô kia', () => {
    const t = moTo()
    t.ketNoi()
    t.nut(t.o1(), 'Đạt').click()
    t.tuCha({ type: TIN_TO_CHIEU.PHAN_HOI, maPhien: MA, khoa: 'A|Q-A', kq: 'da_ghi' })
    const v2 = t.doc.querySelectorAll<HTMLElement>('.mc-cham')[1]!
    expect(v2.querySelectorAll('button')).toHaveLength(2)
    t.nut(v2, 'Đạt').click()
    expect(daBam(t.gui)).toHaveLength(2)
  })
})

describe('TẾ NHỊ TRƯỚC LỚP — tờ chiếu không bao giờ lộ kết quả', () => {
  /** Chạy một ô tới lúc ghi xong với kết quả `dat`, trả về HTML cuối của ô ấy. */
  function ghiXong(dat: boolean) {
    const t = moTo({ dsO: [o('A')] })
    t.ketNoi()
    t.nut(t.o1(), dat ? 'Đạt' : 'Chưa đạt').click()
    t.tuCha({ type: TIN_TO_CHIEU.PHAN_HOI, maPhien: MA, khoa: 'A|Q-A', kq: 'da_ghi' })
    return t
  }

  it('ô vừa ghi KHÔNG chứa chữ "Chưa đạt" (và không "Đạt") — chỉ "Đã ghi" — với CẢ HAI kết quả', () => {
    for (const dat of [true, false]) {
      const v = ghiXong(dat).o1()
      expect(v.textContent).toBe('Đã ghi')
      expect(v.textContent).not.toContain('Chưa đạt')
      expect(v.outerHTML).not.toMatch(/không đạt|đạt/i)
    }
  })

  it('hai kết quả cho ra CÙNG MỘT DOM (cả lớp không đoán được ai đạt ai không)', () => {
    const a = ghiXong(true).o1().outerHTML
    const b = ghiXong(false).o1().outerHTML
    expect(a).toBe(b)
  })

  it('không lưu kết quả ở BẤT KỲ thuộc tính/đâu trong trang sau khi ghi', () => {
    for (const dat of [true, false]) {
      const t = ghiXong(dat)
      const vung = t.o1()
      expect(vung.getAttributeNames().sort()).toEqual(['class', 'data-cham', 'data-khoa'])
      expect(vung.getAttribute('data-cham')).toBe('xong')
      expect(t.doc.body.getAttributeNames().sort()).toEqual(['class', 'data-cau-noi'])
      expect(t.doc.body.className).not.toMatch(/dat|khong|do\b/)
    }
  })

  it('mảnh nút chưa bấm cũng không có màu trạng thái: không class/inline-style đỏ-xanh', () => {
    const h = mangNutChamToChieu('A|Q')
    expect(h).not.toMatch(/style=|do\b|luc\b|xanh\b|red|green/i)
  })

  it('khi đang ghi hoặc lỗi, tờ chiếu cũng KHÔNG hiện chữ về kết quả (chỉ trạng thái gửi)', () => {
    const t = moTo({ dsO: [o('A')] })
    t.ketNoi()
    t.nut(t.o1(), 'Chưa đạt').click()
    expect(t.o1().querySelector('.mc-cham-tin')!.textContent).toBe('Đang ghi…')
    t.tuCha({ type: TIN_TO_CHIEU.PHAN_HOI, maPhien: MA, khoa: 'A|Q-A', kq: 'loi' })
    expect(t.o1().querySelector('.mc-cham-tin')!.textContent).toBe('chưa ghi được, bấm lại')
    // nhãn Đạt/Chưa đạt chỉ còn ở NÚT bấm được (để thầy bấm lại), không phải ở dòng thông báo.
    expect(t.o1().querySelector('.mc-cham-tin')!.textContent).not.toMatch(/đạt/i)
  })
})

describe('bất biến của tờ chiếu khi có cầu nối', () => {
  it('lời giải, đợt, đếm giờ vẫn chạy: bấm "Hiện lời giải" không đụng tới nút chấm', () => {
    const t = moTo()
    t.ketNoi()
    const nut = t.doc.querySelector<HTMLButtonElement>('.mc-nut-giai[aria-controls^="giai-"]')!
    nut.click()
    expect(nut.getAttribute('aria-expanded')).toBe('true')
    expect(daBam(t.gui)).toHaveLength(0)
    expect(t.doc.querySelectorAll('.mc-cham-nut')).toHaveLength(4)
  })

  it('nút chấm KHÔNG mang class `mc-nut-giai`/`mc-nut-hien-em` (bộ xử lý click của tờ sẽ nuốt mất)', () => {
    const doc = new JSDOM(taoHtmlMayChieu([o('A')], { cauNoi: { maPhien: MA } })).window.document
    for (const b of doc.querySelectorAll('.mc-cham-nut')) {
      expect(b.className).toBe('mc-cham-nut')
      expect(b.closest('.mc-nut-giai')).toBeNull()
    }
  })

  it('hàm dựng vẫn tất định: cùng đầu vào + cùng mã phiên ⇒ cùng HTML', () => {
    expect(taoHtmlMayChieu([o('A'), o('B')], { cauNoi: { maPhien: MA } })).toBe(taoHtmlMayChieu([o('A'), o('B')], { cauNoi: { maPhien: MA } }))
    vi.restoreAllMocks()
  })
})
