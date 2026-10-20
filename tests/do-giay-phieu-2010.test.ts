// ĐO GIÂY TỪNG CÂU QUA PHIẾU HTML (thầy 20/10/2026, docs/dac-ta-muc-lam-bai-2010.md mục 4) — ba đường nộp: btvn, khac_phuc, btvn_lo.
//
// Thiết kế (điều phối viên đổi 20/10): máy em CHỈ gửi giây (`doGiay: {qid: {g}}`); kích thước đề (số từ, có hình, phần) do MÁY CHỦ tự đo từ câu nó
// vừa lấy để chấm (`boSungKichThuocDe`), không tin số máy em khai. Phiếu không import thêm gì (giữ cổng tốc độ / service worker).
//
//   (a) phiếu: chỉ nhúng hàm đo cho phiếu NỘP ĐƯỢC, không phát data-tu / data-hinh; hàm đo tự đủ
//   (b) bộ đo giây: một câu mỗi nhịp, dừng khi tab ẩn / 180 giây không chạm, trần 900, không gửi 0 · chạy thật trong phiếu (jsdom)
//   (c) máy em chuyển giây: KhungXemPhieu → nopChangCaNhan → thân gửi
//   (d) máy chủ (SQLite thật, môi trường node): tệp riêng tests/do-giay-phieu-may-chu-2010.test.ts — jsdom không nạp được node:sqlite
import { createElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import KhungXemPhieu from '../src/components/KhungXemPhieu'
import { nopChangCaNhan, type PhuThuocNopChang, type TinNopChang } from '../src/lib/btvn-nop-chang-em'
import type { CauLuyen } from '../src/lib/bai-tap-pdf'
import { DO_GIAY_PHIEU, JS_PHIEU, boLoiGiai, dungPhieu, taoBoDoGiay, theCauHtml, type ThongTinPhieu } from '../src/lib/html-phieu'

// ───────────────────────────────────────── công cụ dùng chung ─────────────────────────────────────────
let dongHo = 0 // ms, do test điều khiển (thay Date.now của bộ đo)
let tabHien = 'visible'
const bo: Array<{ dung: () => void }> = []

/** IntersectionObserver giả: giữ lời gọi lại để test tự "báo" câu nào đang hiện bao nhiêu. */
class IOGia {
  static ds: IOGia[] = []
  cb: (e: unknown[]) => void
  quanSat: Element[] = []
  constructor(cb: (e: unknown[]) => void) {
    this.cb = cb
    IOGia.ds.push(this)
  }
  observe(e: Element) {
    this.quanSat.push(e)
  }
  disconnect() {}
}

beforeEach(() => {
  dongHo = 0
  tabHien = 'visible'
  IOGia.ds = []
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => tabHien })
  localStorage.clear()
})
afterEach(() => {
  for (const b of bo.splice(0)) b.dung()
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

const dungCau = (n = 3) => {
  document.body.innerHTML = Array.from({ length: n }, (_, i) => `<article class="q-card" data-qid="q${i + 1}"><div class="q-text">đề ${i + 1}</div><button type="button" class="lam-o" data-chon="A">A</button><input class="lam-nhap"></article>`).join('')
}
const cauDom = (n: number) => document.querySelector(`.q-card[data-qid="q${n}"]`)!
const bamCau = (n: number, sel = '.lam-o') => cauDom(n).querySelector(sel)!.dispatchEvent(new Event('click', { bubbles: true }))
const baoHien = (io: IOGia, ds: Array<[number, number, number]>) => io.cb(ds.map(([n, ti, cao]) => ({ target: cauDom(n), intersectionRatio: ti, intersectionRect: { height: cao } })))

/** Dựng bộ đo trên `win` giả: nhịp 1 giây do test gọi tay. */
function taoDo(tuy: Record<string, unknown> = {}, coIO = true) {
  const w: any = {
    innerHeight: 800,
    nhip: [] as Array<() => void>,
    setInterval: (f: () => void) => (w.nhip.push(f), w.nhip.length),
    clearInterval: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    ...(coIO ? { IntersectionObserver: IOGia } : {}),
  }
  const b = taoBoDoGiay(w, document, { bayGio: () => dongHo, ...tuy })
  bo.push(b)
  return { w, b, nhip: (n = 1) => { for (let i = 0; i < n; i++) w.nhip[0]() }, io: () => IOGia.ds[IOGia.ds.length - 1]! }
}

// ═══════════════════════════════════════ (a) PHIẾU ═══════════════════════════════════════
const C = (o: Partial<CauLuyen>): CauLuyen =>
  ({ phan: 'I', id: 'x', maDe: 'X', chuyenDe: 'Ester – lipid', dang: 'chua_ro', sao: 0, mucDo: 'hieu', text: 'Đề', luaChon: ['a', 'b', 'c', 'd'], dapAn: 'A', chot: 'c', lyDo: null, buoc: ['Bước một.'], ketQua: '', ...o }) as CauLuyen
const TT: ThongTinPhieu = { hoTen: '', sbd: '12121212', ngay: new Date(2026, 8, 21), tenChuyenDe: 'Bài tập về nhà', ketQua: '', hienDapAn: false, nhanBia: 'BÀI TẬP VỀ NHÀ', oBia: [{ nhan: 'Hạn nộp', gia: '20:00 ngày 28/09' }] }
const NOP = { ma: 'BTVN-abc', sbd: '12121212', url: 'https://may-chu.thu/goi' }
const CAU3: CauLuyen[] = [C({ id: 'q1', dapAn: 'B' }), C({ id: 'q2', phan: 'II', dapAn: 'DSDS', luaChon: ['ý a', 'ý b', 'ý c', 'ý d'] }), C({ id: 'q3', phan: 'III', luaChon: null, dapAn: '12,5' })]

describe('(a) phiếu: nhúng hàm đo, KHÔNG phát thuộc tính đo từ', () => {
  it('phiếu NỘP ĐƯỢC có đúng một khối __taoBoDoGiay, đứng TRƯỚC mã phiếu; phiếu đọc / phiếu in không có một byte nào', () => {
    const nop = dungPhieu(TT, CAU3, { nop: NOP })
    expect(nop.split('window.__taoBoDoGiay=').length - 1).toBe(1)
    expect(nop).toContain(DO_GIAY_PHIEU)
    expect(nop.indexOf(DO_GIAY_PHIEU)).toBeLessThan(nop.indexOf(`<script>${JS_PHIEU}</script>`))
    for (const khong of [dungPhieu(TT, CAU3), dungPhieu(TT, CAU3, { anGiai: true }), dungPhieu({ ...TT, nhanBia: 'BÀI TẬP VỀ NHÀ' }, CAU3, { laBtvn: true })]) {
      expect(khong).not.toContain(DO_GIAY_PHIEU)
      expect(khong).not.toContain('window.__taoBoDoGiay=')
      expect(khong).not.toContain('function taoBoDoGiay')
    }
  })

  it('máy chủ tự đo: thẻ câu KHÔNG mang data-tu / data-hinh (số từ máy em khai không được tin)', () => {
    const h = dungPhieu(TT, CAU3, { nop: NOP })
    expect(h).not.toContain('data-tu')
    expect(h).not.toContain('data-hinh')
    expect(theCauHtml(CAU3[0], 1, false, false, true)).not.toContain('data-tu')
  })

  it('khối nhúng KHÔNG chứa thẻ đóng script (không phá trang) và hàm TỰ ĐỦ: chạy từ chuỗi, không tham chiếu phạm vi mô-đun', () => {
    expect(DO_GIAY_PHIEU.slice('<script>'.length, -'</script>'.length)).not.toContain('</script')
    const nguon = DO_GIAY_PHIEU.slice('<script>window.__taoBoDoGiay='.length, -';</script>'.length)
    const tuChuoi = new Function(`return (${nguon})`)() as typeof taoBoDoGiay
    dungCau(2)
    const w: any = { nhip: [] as Array<() => void>, innerHeight: 800, setInterval: (f: () => void) => (w.nhip.push(f), 1), clearInterval: vi.fn() }
    const b = tuChuoi(w, document, { bayGio: () => dongHo })
    bo.push(b)
    bamCau(1)
    w.nhip[0]()
    w.nhip[0]()
    expect(b.layDoGiay(null)).toEqual({ q1: { g: 2 } })
  })
})

// ═══════════════════════════════════════ (b) BỘ ĐO GIÂY ═══════════════════════════════════════
describe('(b) bộ đo giây: MỘT câu mỗi nhịp', () => {
  beforeEach(() => dungCau(3))

  it('cộng cho câu em tương tác gần nhất, không cộng cho câu khác dù cũng đang hiện', () => {
    const { nhip, io, b } = taoDo()
    baoHien(io(), [[1, 1, 300], [2, 1, 300], [3, 1, 200]])
    bamCau(2)
    nhip(5)
    expect(b.layDoGiay(null)).toEqual({ q2: { g: 5 } })
    bamCau(1)
    nhip(3)
    expect(b.layDoGiay(null)).toEqual({ q1: { g: 3 }, q2: { g: 5 } })
    expect(Object.keys(b.layDoGiay(null)!.q1)).toEqual(['g']) // máy em CHỈ gửi giây — không t / h / p
  })

  it('chưa tương tác: câu hiện lớn nhất (≥ 50%) nhận giây; câu chỉ hiện một góc thì không', () => {
    const { nhip, io, b } = taoDo()
    baoHien(io(), [[1, 0.3, 240], [2, 0.9, 700], [3, 0.6, 300]])
    nhip(4)
    expect(b.layDoGiay(null)).toEqual({ q2: { g: 4 } })
    baoHien(io(), [[1, 0.9, 500], [2, 0.2, 100], [3, 0, 0]])
    nhip(2)
    expect(b.layDoGiay(null)).toEqual({ q1: { g: 2 }, q2: { g: 4 } })
    const hai = taoDo()
    baoHien(hai.io(), [[1, 0.4, 300]]) // 40% câu, 300/800 màn: chưa đủ
    hai.nhip(5)
    expect(hai.b.layDoGiay(null)).toBeNull()
  })

  it('câu dài hơn hai màn (chưa bao giờ đạt 50% của chính nó) vẫn được tính khi chiếm ≥ 50% chiều cao màn', () => {
    const { nhip, io, b } = taoDo()
    baoHien(io(), [[1, 0.3, 500]]) // 500 ≥ 400 = nửa màn 800
    nhip(3)
    expect(b.layDoGiay(null)).toEqual({ q1: { g: 3 } })
  })

  it('câu em chạm lần cuối mà đã cuộn ra khỏi màn thì NHƯỜNG: thời gian đọc câu mới không bị cộng nhầm vào câu cũ', () => {
    const { nhip, io, b } = taoDo()
    baoHien(io(), [[1, 1, 300]])
    bamCau(1)
    nhip(2)
    baoHien(io(), [[1, 0, 0], [2, 0.8, 600]])
    nhip(3)
    expect(b.layDoGiay(null)).toEqual({ q1: { g: 2 }, q2: { g: 3 } })
  })

  it('tab ẩn thì dừng; hiện lại thì chạy tiếp (không cần chạm)', () => {
    const { nhip, io, b } = taoDo()
    baoHien(io(), [[1, 1, 300]])
    bamCau(1)
    nhip(2)
    tabHien = 'hidden'
    nhip(5)
    tabHien = 'visible'
    nhip(1)
    expect(b.layDoGiay(null)).toEqual({ q1: { g: 3 } })
  })

  it('180 giây không chạm thì dừng; chạm lại thì chạy tiếp; 179,9 giây vẫn tính', () => {
    const { nhip, io, b } = taoDo()
    baoHien(io(), [[1, 1, 300]])
    bamCau(1)
    nhip(2)
    dongHo += 179_900
    nhip(1)
    expect(b.layDoGiay(null)).toEqual({ q1: { g: 3 } })
    dongHo += 100 // đủ 180 giây từ lần chạm cuối
    nhip(5)
    expect(b.layDoGiay(null)).toEqual({ q1: { g: 3 } })
    bamCau(1)
    nhip(1)
    expect(b.layDoGiay(null)).toEqual({ q1: { g: 4 } })
  })

  it('cuộn trang / bàn phím chỉ giữ "em còn ở đó" (kéo dài 180 giây), không đổi câu đang làm; chạm vào ô chọn của câu khác mới đổi', () => {
    const { nhip, io, b } = taoDo()
    baoHien(io(), [[1, 1, 300], [2, 1, 300]])
    bamCau(1)
    dongHo += 170_000
    document.dispatchEvent(new Event('scroll'))
    dongHo += 170_000 // 340 giây từ lần chạm đầu, 170 giây từ lần cuộn
    nhip(1)
    expect(b.layDoGiay(null)).toEqual({ q1: { g: 1 } })
    cauDom(2).querySelector('.q-text')!.dispatchEvent(new Event('pointerdown', { bubbles: true })) // chạm vào chữ đề: chỉ "có mặt"
    nhip(1)
    expect(b.layDoGiay(null)).toEqual({ q1: { g: 2 } })
    cauDom(2).querySelector('.lam-o')!.dispatchEvent(new Event('pointerdown', { bubbles: true })) // ô chọn (cú chạm di động không phát click)
    nhip(1)
    expect(b.layDoGiay(null)).toEqual({ q1: { g: 2 }, q2: { g: 1 } })
  })

  it('KHÔNG gửi 0: câu chưa có nhịp nào không có mặt; không câu nào ⇒ null (phiếu bỏ khoá doGiay)', () => {
    const { nhip, io, b } = taoDo()
    expect(b.layDoGiay(null)).toBeNull()
    baoHien(io(), [[1, 1, 300]])
    bamCau(1)
    nhip(3)
    expect(b.layDoGiay(['q2', 'q3'])).toBeNull()
    expect(b.layDoGiay(['q1', 'q2'])).toEqual({ q1: { g: 3 } })
  })

  it('trần 900 giây mỗi câu', () => {
    const { nhip, io, b } = taoDo()
    baoHien(io(), [[1, 1, 300]])
    bamCau(1)
    nhip(1000)
    expect(b.layDoGiay(null)).toEqual({ q1: { g: 900 } })
  })

  it('thẻ đã chấm (da-cham) không đo', () => {
    const { nhip, io, b } = taoDo()
    baoHien(io(), [[1, 1, 300]])
    cauDom(1).classList.add('da-cham')
    bamCau(1)
    nhip(4)
    expect(b.layDoGiay(null)).toBeNull()
  })

  it('không có IntersectionObserver: chỉ câu em chạm vào được đo (không ước theo vị trí)', () => {
    const { nhip, b } = taoDo({}, false)
    nhip(3)
    expect(b.layDoGiay(null)).toBeNull()
    bamCau(3, '.lam-nhap')
    nhip(2)
    expect(b.layDoGiay(null)).toEqual({ q3: { g: 2 } })
  })

  it('khôi phục: giây đã lưu cộng dồn; câu đã có đáp án mà KHÔNG có đồng hồ cũ thì không đo (giây ngắn sai = "chưa đọc hết đề" oan)', () => {
    const { nhip, io, b } = taoDo()
    b.khoiPhuc({ q1: 40, q9: 5, q2: 'x', q3: -3 }, ['q1', 'q2', 'q3'])
    baoHien(io(), [[1, 1, 300], [2, 1, 300], [3, 1, 300]])
    bamCau(2)
    nhip(4)
    bamCau(1)
    nhip(2)
    bamCau(3)
    nhip(2)
    expect(b.layDoGiay(null)).toEqual({ q1: { g: 42 } }) // q2, q3 có đáp án sẵn mà không có đồng hồ ⇒ bỏ; q9 không phải thẻ ⇒ bỏ
  })

  it('lưu giây qua tuy.luu mỗi 10 nhịp và khi tab ẩn; datLai xoá câu đã nộp và lưu lại', () => {
    const luu = vi.fn()
    const { nhip, io, b } = taoDo({ luu })
    baoHien(io(), [[1, 1, 300]])
    bamCau(1)
    nhip(9)
    expect(luu).not.toHaveBeenCalled()
    nhip(1)
    expect(luu).toHaveBeenLastCalledWith({ q1: 10 })
    nhip(2)
    tabHien = 'hidden'
    document.dispatchEvent(new Event('visibilitychange'))
    expect(luu).toHaveBeenLastCalledWith({ q1: 12 })
    b.datLai(['q1'])
    expect(luu).toHaveBeenLastCalledWith({})
    expect(b.layDoGiay(null)).toBeNull()
  })

  it('dung() gỡ bộ nghe và dừng đồng hồ', () => {
    const { w, nhip, b } = taoDo()
    b.dung()
    bamCau(1)
    nhip(3)
    expect(b.layDoGiay(null)).toBeNull()
    expect(w.clearInterval).toHaveBeenCalled()
  })
})

// ───────────────────────── chạy THẬT trong phiếu (jsdom) ─────────────────────────
const addGoc = document.addEventListener
let boNghe: Array<[string, EventListenerOrEventListenerObject, unknown]> = []
let nhipPhieu: () => void = () => {}
let boHienTai: { layDoGiay: (d: string[] | null) => unknown; khoiPhuc: (a: unknown, b: unknown) => void } | null = null
let spyInterval: ReturnType<typeof vi.spyOn> | null = null

function moPhieu(html: string) {
  for (const [ten, ham, ch] of boNghe) document.removeEventListener(ten, ham, ch as boolean)
  boNghe = []
  document.addEventListener = ((ten: string, ham: EventListenerOrEventListenerObject, ch?: unknown) => {
    boNghe.push([ten, ham, ch])
    addGoc.call(document, ten, ham, ch as boolean)
  }) as typeof document.addEventListener
  const nhipHam: Array<() => void> = []
  boHienTai = null
  delete (window as any).__taoBoDoGiay // mỗi lần mở là một trang mới (iframe mới) — không thừa hưởng hàm của lần trước
  spyInterval?.mockRestore()
  spyInterval = vi.spyOn(window, 'setInterval').mockImplementation(((f: () => void) => (nhipHam.push(f), nhipHam.length)) as never)
  document.documentElement.innerHTML = html.slice(html.indexOf('<body'), html.lastIndexOf('</body>')).replace(/<\/?body[^>]*>/g, '')
  document.body.className = /<body class="([^"]*)"/.exec(html)?.[1] ?? ''
  const khoi = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1])
  const viTriDo = khoi.findIndex((k) => k.startsWith('window.__taoBoDoGiay='))
  if (viTriDo >= 0) {
    new Function(khoi[viTriDo])()
    const goc = (window as any).__taoBoDoGiay
    ;(window as any).__taoBoDoGiay = (w: unknown, d: unknown, t: Record<string, unknown>) => {
      const truoc = nhipHam.length
      const b = goc(w, d, { ...t, bayGio: () => dongHo })
      nhipPhieu = nhipHam[truoc]
      boHienTai = b
      return b
    }
  } else {
    boHienTai = null
  }
  new Function(khoi.filter((_, i) => i !== viTriDo).join('\n'))()
  document.addEventListener = addGoc
}
const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector<T>(s)!
const chonPa = (qid: string, k: number) => document.querySelectorAll<HTMLElement>(`.q-card[data-qid="${qid}"] .q-opt.lam-o`)[k].click()
const chonY = (qid: string, ds: string) => ds.split('').forEach((c, i) => c !== '-' && $(`.q-card[data-qid="${qid}"] .tf-item[data-y="${'abcd'[i]}"] .tf-badge.lam-o[data-chon="${c}"]`).click())
const go = (qid: string, v: string) => {
  const i = $<HTMLInputElement>(`.q-card[data-qid="${qid}"] .lam-nhap`)
  i.value = v
  i.dispatchEvent(new Event('input', { bubbles: true }))
}
const nhips = (n: number) => { for (let i = 0; i < n; i++) nhipPhieu() }
const cho = () => new Promise((r) => setTimeout(r, 0))
const thanGui = (f: ReturnType<typeof vi.fn>, k = 0) => JSON.parse(String(f.mock.calls[k][1].body))

describe('(b) chạy thật trong phiếu: gui() (btvn / khắc phục) gửi doGiay', () => {
  let fetchSpy: ReturnType<typeof vi.fn>
  beforeEach(() => {
    fetchSpy = vi.fn(async () => ({ json: async () => ({ ok: true, soDung: 1, soCau: 3, lanThu: 1, qidSai: [] }) }))
    globalThis.fetch = fetchSpy as unknown as typeof fetch
  })
  afterEach(() => {
    spyInterval?.mockRestore()
    spyInterval = null
    document.addEventListener = addGoc
  })

  /** Làm đủ ba câu, mỗi câu một lúc: q1 chạm → 7 nhịp, q2 chạm → 3 nhịp, q3 gõ → 4 nhịp. */
  const lamDu = () => {
    chonPa('q1', 1)
    nhips(7)
    chonY('q2', 'DSDS')
    nhips(3)
    go('q3', '12,5')
    nhips(4)
  }

  it('đo từng câu, nộp: thân gửi có doGiay {qid: {g}} đúng giây từng câu; mọi trường cũ giữ nguyên; xong thì xoá giây đã gửi', async () => {
    moPhieu(dungPhieu(TT, CAU3, { nop: NOP }))
    lamDu()
    $('#nut-nop').click()
    await cho()
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(thanGui(fetchSpy)).toEqual({
      action: 'nopKhacPhuc',
      ma: 'BTVN-abc',
      sbd: '12121212',
      dapAn: { q1: 'B', q2: 'DSDS', q3: '12,5' },
      doGiay: { q1: { g: 7 }, q2: { g: 3 }, q3: { g: 4 } },
    })
    expect(boHienTai!.layDoGiay(null)).toBeNull() // gửi xong ⇒ đo lại từ đầu
  })

  it('chưa nhịp nào: thân gửi y hệt phiếu cũ (không có khoá doGiay, không gửi 0)', async () => {
    moPhieu(dungPhieu(TT, CAU3, { nop: NOP }))
    chonPa('q1', 1)
    chonY('q2', 'DSDS')
    go('q3', '12,5')
    $('#nut-nop').click()
    await cho()
    expect(thanGui(fetchSpy)).toEqual({ action: 'nopKhacPhuc', ma: 'BTVN-abc', sbd: '12121212', dapAn: { q1: 'B', q2: 'DSDS', q3: '12,5' } })
    expect(thanGui(fetchSpy)).not.toHaveProperty('doGiay')
  })

  it('câu bỏ trống không có giây trong gói (không phải một lượt làm); câu có đáp án thì có', async () => {
    moPhieu(dungPhieu(TT, CAU3, { nop: NOP }))
    chonPa('q1', 1)
    nhips(5)
    chonY('q2', 'D---') // mới chọn một ý
    nhips(2)
    go('q3', '') // chạm vào ô nhưng bỏ trống
    nhips(6)
    expect(boHienTai!.layDoGiay(['q1', 'q2', 'q3'])).toEqual({ q1: { g: 5 }, q2: { g: 2 }, q3: { g: 6 } }) // bộ đo có số của cả ba…
    // …nhưng phiếu chỉ gửi các câu đã trả lời: ép nộp bằng nút "Nộp luôn" của hộp hỏi
    $('#nut-nop').click()
    await cho()
    document.querySelector<HTMLElement>('.gd-hop .gd-hop-ok')!.click() // hộp hỏi của phiếu: "Còn N câu chưa làm… Nộp luôn?"
    await vi.waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1))
    const goi = thanGui(fetchSpy)
    expect(goi.doGiay).toEqual({ q1: { g: 5 }, q2: { g: 2 } })
  })

  it('đáp án có sẵn từ bản nháp (banNhap) mà không có đồng hồ cũ ⇒ câu ấy KHÔNG có giây dù em chạm lại', async () => {
    moPhieu(dungPhieu(TT, CAU3, { nop: { ...NOP, banNhap: { q1: 'C' } } }))
    chonPa('q1', 1)
    nhips(9)
    chonY('q2', 'DSDS')
    nhips(2)
    go('q3', '12,5')
    nhips(3)
    $('#nut-nop').click()
    await cho()
    expect(thanGui(fetchSpy).doGiay).toEqual({ q2: { g: 2 }, q3: { g: 3 } })
  })

  it('mở lại phiếu: giây cộng dồn qua lần mở (lưu cạnh bản nháp); mất đồng hồ cũ thì câu đã trả lời bị bỏ', () => {
    const html = dungPhieu(TT, CAU3, { nop: NOP })
    moPhieu(html)
    chonPa('q1', 1)
    nhips(12) // lưu ở nhịp thứ 10
    const khoa = Object.keys(localStorage).find((k) => k.endsWith('.giay'))!
    expect(JSON.parse(localStorage.getItem(khoa)!)).toEqual({ q1: 10 })
    moPhieu(html) // mở lại: đáp án q1 và giây đều được khôi phục
    chonPa('q1', 2)
    nhips(3)
    expect(boHienTai!.layDoGiay(null)).toEqual({ q1: { g: 13 } })
    localStorage.removeItem(khoa)
    moPhieu(html) // mất đồng hồ, đáp án còn
    chonPa('q1', 3)
    nhips(3)
    expect(boHienTai!.layDoGiay(null)).toBeNull()
  })

  it('phiếu dựng bởi bản cũ (không có khối đo): mọi thứ chạy y như trước, thân gửi không có doGiay', async () => {
    const cu = dungPhieu(TT, CAU3, { nop: NOP }).replace(DO_GIAY_PHIEU, '')
    expect(cu).not.toContain('__taoBoDoGiay=')
    moPhieu(cu)
    expect(boHienTai).toBeNull()
    chonPa('q1', 1)
    chonY('q2', 'DSDS')
    go('q3', '12,5')
    $('#nut-nop').click()
    await cho()
    expect(thanGui(fetchSpy)).not.toHaveProperty('doGiay')
  })
})

describe('(b) chạy thật trong phiếu: nộp chặng (bài ca_nhan) và thử sức gửi doGiay qua host', () => {
  const chua = (o: Partial<CauLuyen>): CauLuyen => ({ ...boLoiGiai(C(o)), caNhan: { chuaCoDapAn: true } })
  const CHUA: CauLuyen[] = [chua({ id: 'q1' }), chua({ id: 'q2', phan: 'II', luaChon: ['ý a', 'ý b', 'ý c', 'ý d'] }), chua({ id: 'q3', phan: 'III', luaChon: null })]
  const DAU = { tong: 52, soChang: 7, phutMoiNgay: 10, han: '28/09', chang: [0, 1, 2, 3, 4, 5, 6].map((chiSo) => ({ chiSo, daXong: false })), chiSoHienThi: 0, nhanChang: { 0: 'Hôm nay' } }
  const CN = (o: Record<string, unknown> = {}) => ({ chiSo: 0, daCham: {}, dauBai: DAU, ghiCho: '', tienTo: 'Chặng 1/7 · ', nutNop: 'Nộp chặng', nutTat: false, ...o })
  let guiHost: ReturnType<typeof vi.fn>
  const nopChangMsg = () => guiHost.mock.calls.filter((c) => c[0]?.type === 'ddh-btvn-nop-chang').map((c) => c[0])
  beforeEach(() => {
    guiHost = vi.fn()
    Object.defineProperty(window, 'parent', { value: { postMessage: guiHost }, configurable: true })
    globalThis.fetch = vi.fn() as unknown as typeof fetch
  })
  afterEach(() => {
    spyInterval?.mockRestore()
    spyInterval = null
    document.addEventListener = addGoc
  })
  const hostTraLoi = (data: Record<string, unknown>) => {
    const ev = new MessageEvent('message', { data })
    Object.defineProperty(ev, 'source', { value: window.parent })
    window.dispatchEvent(ev)
  }

  it('Nộp chặng: tin gửi host có doGiay của đúng các câu trong gói; host báo nhận ⇒ xoá giây đã gửi', () => {
    moPhieu(dungPhieu(TT, CHUA, { nop: NOP, caNhan: CN() }))
    chonPa('q1', 2)
    nhips(8)
    chonY('q2', 'DSDS')
    nhips(5)
    go('q3', '7')
    nhips(2)
    $('#nut-nop').click()
    expect(nopChangMsg()).toEqual([{ type: 'ddh-btvn-nop-chang', ma: 'BTVN-abc', sbd: '12121212', chiSo: 0, dapAn: { q1: 'C', q2: 'DSDS', q3: '7' }, doGiay: { q1: { g: 8 }, q2: { g: 5 }, q3: { g: 2 } } }])
    hostTraLoi({ type: 'ddh-btvn-nop-chang-ket', ok: true })
    expect(boHienTai!.layDoGiay(null)).toBeNull()
  })

  it('host báo lỗi (máy chủ bận) ⇒ giây còn nguyên để nộp lại; chưa nhịp nào ⇒ tin y hệt cũ', () => {
    moPhieu(dungPhieu(TT, CHUA, { nop: NOP, caNhan: CN() }))
    chonPa('q1', 0)
    nhips(3)
    chonY('q2', 'DSDS')
    go('q3', '7')
    $('#nut-nop').click()
    expect(nopChangMsg()[0].doGiay).toEqual({ q1: { g: 3 } })
    expect(nopChangMsg()[0]).not.toHaveProperty('doGiay.q2')
    hostTraLoi({ type: 'ddh-btvn-nop-chang-ket', ok: false, error: 'Máy chủ đang bận', ban: true })
    expect(boHienTai!.layDoGiay(null)).toEqual({ q1: { g: 3 } })
  })

  it('không nhịp nào ⇒ tin nộp chặng không có khoá doGiay', () => {
    moPhieu(dungPhieu(TT, CHUA, { nop: NOP, caNhan: CN() }))
    chonPa('q1', 0)
    chonY('q2', 'DSDS')
    go('q3', '7')
    $('#nut-nop').click()
    expect(nopChangMsg()[0]).toEqual({ type: 'ddh-btvn-nop-chang', ma: 'BTVN-abc', sbd: '12121212', chiSo: 0, dapAn: { q1: 'A', q2: 'DSDS', q3: '7' } })
  })
})

// ═══════════════════════════════════════ (c) MÁY EM CHUYỂN GIÂY ═══════════════════════════════════════
describe('(c) KhungXemPhieu → nopChangCaNhan → thân gửi lên máy chủ', () => {
  const guiTuPhieu = (data: Record<string, unknown>) => {
    const nop = vi.fn(async () => ({ ok: true }))
    render(createElement(KhungXemPhieu, { html: '<p>phiếu</p>', dong: () => {}, nopChang: nop }))
    const khung = document.querySelector('iframe')!
    window.dispatchEvent(new MessageEvent('message', { data: { type: 'ddh-btvn-nop-chang', ma: 'B1', sbd: 'S1', chiSo: 0, dapAn: { q1: 'A' }, ...data }, source: khung.contentWindow }))
    return nop
  }

  it('khung chuyển nguyên doGiay của phiếu cho nopChang; thiếu thì không có giá trị nào (gói y hệt trước)', () => {
    const doGiay = { q1: { g: 12 }, q5: { g: 7 } }
    expect(guiTuPhieu({ doGiay }).mock.calls[0][0]).toEqual({ ma: 'B1', sbd: 'S1', chiSo: 0, dapAn: { q1: 'A' }, doGiay })
    cleanup()
    const khong = guiTuPhieu({}).mock.calls[0][0]
    expect(khong).toEqual({ ma: 'B1', sbd: 'S1', chiSo: 0, dapAn: { q1: 'A' } })
    expect(khong.doGiay).toBeUndefined()
  })

  const KET = { ok: true, ketQua: [{ qid: 'q1', dung: true, dapAnDung: 'A', loiGiai: null, anhLoiGiai: [] }], chuaLam: [], chang: { chiSo: 0, soCau: 1, soDung: 1, xong: true } }
  const dep = () => ({ layCauHinh: vi.fn(async () => ({ URL: 'https://x' }) as never), nopChang: vi.fn(async () => KET), cuaEm: vi.fn(async () => ({ ok: false })), dungPhieu: vi.fn(async () => '') }) as unknown as PhuThuocNopChang & { nopChang: ReturnType<typeof vi.fn> }
  const goi = async (doGiay: unknown) => {
    localStorage.clear()
    const d = dep()
    await nopChangCaNhan({ ma: 'B1', sbd: 'S1', chiSo: 0, dapAn: { q1: 'A' }, doGiay } as TinNopChang, 'R', d)
    return d.nopChang.mock.calls[0][1] as Record<string, unknown>
  }

  it('nopChangCaNhan chép doGiay hợp lệ (giây là số hữu hạn), bỏ mọi thứ khác — kể cả t / h / p phiếu lỡ gửi', async () => {
    expect(await goi({ q1: { g: 12, t: 9999, h: 1, p: 'III' }, q2: { g: 'x' }, q3: null, q4: { g: Infinity }, q5: { g: 7 } })).toEqual({ ma: 'B1', maBtvn: 'B1', sbd: 'S1', chiSo: 0, dapAn: { q1: 'A' }, doGiay: { q1: { g: 12 }, q5: { g: 7 } } })
  })

  it('thiếu / sai khuôn doGiay ⇒ thân nộp y hệt trước, KHÔNG có khoá doGiay', async () => {
    for (const doGiay of [undefined, null, [], 'x', {}, { q1: { g: 'x' } }]) {
      const tin = await goi(doGiay)
      expect(tin).toEqual({ ma: 'B1', maBtvn: 'B1', sbd: 'S1', chiSo: 0, dapAn: { q1: 'A' } })
      expect(Object.keys(tin)).not.toContain('doGiay')
    }
  })
})

describe('(c) đường mặc định của nopChangCaNhan chuyển nguyên doGiay cho nopChangBtvn', () => {
  it('thân gửi /btvn/xong-lo có doGiay khi phiếu có đo; không đo thì đúng bốn trường cũ', async () => {
    const nopChangBtvn = vi.fn(async () => ({ ok: true, ketQua: [{ qid: 'q1', dung: true, dapAnDung: 'A', loiGiai: null, anhLoiGiai: [] }], chuaLam: [] }))
    vi.resetModules()
    vi.doMock('../src/lib/btvn-may-chu-moi', () => ({ nopChangBtvn, btvnCuaEm: vi.fn(async () => ({ ok: false })) }))
    vi.doMock('../src/lib/btvn-cho-em', () => ({ layCauHinhChoEmBtvn: vi.fn(async () => ({ URL: 'https://x' })), dungPhieuBtvn: vi.fn() }))
    const { nopChangCaNhan: moi } = await import('../src/lib/btvn-nop-chang-em')
    await moi({ ma: 'B1', sbd: 'S1', chiSo: 0, dapAn: { q1: 'A' }, doGiay: { q1: { g: 9 } } }, 'R')
    expect(nopChangBtvn.mock.calls[0][1]).toEqual({ maBtvn: 'B1', sbd: 'S1', chiSo: 0, dapAn: { q1: 'A' }, doGiay: { q1: { g: 9 } } })
    localStorage.clear()
    await moi({ ma: 'B1', sbd: 'S1', chiSo: 0, dapAn: { q1: 'A' } }, 'R')
    expect(nopChangBtvn.mock.calls[1][1]).toEqual({ maBtvn: 'B1', sbd: 'S1', chiSo: 0, dapAn: { q1: 'A' } })
    vi.doUnmock('../src/lib/btvn-may-chu-moi')
    vi.doUnmock('../src/lib/btvn-cho-em')
  })
})
