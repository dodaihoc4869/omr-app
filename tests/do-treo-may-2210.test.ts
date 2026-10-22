// ĐO TREO MÁY (thầy 22/10, docs/dac-ta-muc-lam-6-muc-2210.md mục 3) — phần PHIẾU (bài tập về nhà / khắc phục / chặng): bộ đo `taoBoDoGiay`
// giữ NGUYÊN g, thêm cho từng câu: v (giây mở khi tab hiện, không cắt 180), a (giây ẩn — chỉ khoảng ẩn khép lại trong cùng lần mở trang),
// l (khoảng lặng dài nhất), n (số khoảng lặng 120–179 giây kết thúc bằng một lần chạm), w (màn được giữ sáng suốt lúc câu mở).
// Định nghĩa g có test riêng: tests/do-giay-phieu-2010.test.ts.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nopChangCaNhan, type PhuThuocNopChang } from '../src/lib/btvn-nop-chang-em'
import { taoBoDoGiay } from '../src/lib/html-phieu'

let dongHo = 0
let tabHien = 'visible'
const bo: Array<{ dung: () => void }> = []

class IOGia {
  static ds: IOGia[] = []
  cb: (e: unknown[]) => void
  constructor(cb: (e: unknown[]) => void) {
    this.cb = cb
    IOGia.ds.push(this)
  }
  observe() {}
  disconnect() {}
}

beforeEach(() => {
  dongHo = 0
  tabHien = 'visible'
  IOGia.ds = []
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => tabHien })
  document.body.innerHTML = [1, 2].map((i) => `<article class="q-card" data-qid="q${i}"><button type="button" class="lam-o">A</button></article>`).join('')
})
afterEach(() => {
  for (const b of bo.splice(0)) b.dung()
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

const cauDom = (n: number) => document.querySelector(`.q-card[data-qid="q${n}"]`)!
/** Một lần chạm vào ô chọn của câu n (đúng đường "chạm" của bộ đo: pointerdown + click). */
const cham = (n: number) => {
  const nut = cauDom(n).querySelector('.lam-o')!
  nut.dispatchEvent(new Event('pointerdown', { bubbles: true }))
  nut.dispatchEvent(new Event('click', { bubbles: true }))
}
const an = () => { tabHien = 'hidden'; document.dispatchEvent(new Event('visibilitychange')) }
const hien = () => { tabHien = 'visible'; document.dispatchEvent(new Event('visibilitychange')) }

function taoDo(tuy: Record<string, unknown> = {}, navigator?: unknown) {
  const w: any = {
    innerHeight: 800,
    nhip: [] as Array<() => void>,
    setInterval: (f: () => void) => (w.nhip.push(f), w.nhip.length),
    clearInterval: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    IntersectionObserver: IOGia,
    ...(navigator ? { navigator } : {}),
  }
  const b = taoBoDoGiay(w, document, { bayGio: () => dongHo, ...tuy })
  bo.push(b)
  const io = IOGia.ds[IOGia.ds.length - 1]!
  /** Câu n hiện trọn màn. */
  const chiHien = (n: number) => io.cb([1, 2].map((k) => ({ target: cauDom(k), intersectionRatio: k === n ? 1 : 0, intersectionRect: { height: k === n ? 600 : 0 } })))
  /** s nhịp, mỗi nhịp 1 giây đồng hồ thật. */
  const giay = (s: number) => { for (let i = 0; i < s; i++) { dongHo += 1000; w.nhip[0]() } }
  return { b, chiHien, giay }
}

describe('phiếu — đo treo máy (v a l n w)', () => {
  it('10 phút không chạm khi màn sáng ⇒ l ≥ 600, v = 600; g vẫn dừng ở 180 như cũ', () => {
    const { b, chiHien, giay } = taoDo()
    chiHien(1)
    cham(1)
    giay(600)
    const d = b.layDoGiay(null)!.q1
    expect(d.l).toBeGreaterThanOrEqual(600)
    expect(d.v).toBe(600)
    expect(d.g).toBe(179) // g: chỉ đếm khi chạm trong 180 giây gần nhất (định nghĩa cũ, không đổi)
    expect(d.a).toBe(0)
  })

  it('ẩn 3 phút (khép lại trong cùng lần mở) ⇒ a = 180, cộng cho câu đang làm lúc ẩn', () => {
    const { b, chiHien, giay } = taoDo()
    chiHien(2)
    cham(2)
    giay(5)
    an()
    dongHo += 180_000
    hien()
    giay(1)
    expect(b.layDoGiay(null)!.q2).toMatchObject({ a: 180, v: 6 })
  })

  it('ba lần lặng 150 giây rồi chạm ⇒ n = 3; lặng dài nhất l = 150', () => {
    const { b, chiHien, giay } = taoDo()
    chiHien(1)
    cham(1)
    for (let k = 0; k < 3; k++) { giay(150); cham(1) }
    expect(b.layDoGiay(null)!.q1).toMatchObject({ n: 3, l: 150 })
  })

  it('tính nháp 4 phút, chạm mỗi 100 giây ⇒ l < 300 (không phải treo), n = 0', () => {
    const { b, chiHien, giay } = taoDo()
    chiHien(1)
    cham(1)
    for (let k = 0; k < 4; k++) { giay(60); cham(1) }
    giay(40)
    const d = b.layDoGiay(null)!.q1
    expect(d.l).toBeLessThan(300)
    expect(d.n).toBe(0)
    expect(d.g).toBe(280) // chạm đều ⇒ g = v
    expect(d.v).toBe(280)
  })

  it('lặng tới lúc nộp (không có lần chạm cuối) vẫn tính vào l; lặng ≥ 180 giây không tính vào n', () => {
    const { b, chiHien, giay } = taoDo()
    chiHien(1)
    cham(1)
    giay(200)
    cham(1) // lặng 200 giây: vượt ngưỡng cắt 180 ⇒ không phải "chạm giữ"
    giay(130) // tới lúc nộp
    expect(b.layDoGiay(null)!.q1).toMatchObject({ l: 200, n: 0 })
  })

  it('lưng chừng giữa hai câu (không câu nào hiện đủ 50%): v / l vẫn cộng cho câu vừa đếm; g không cộng', () => {
    const { b, chiHien, giay } = taoDo()
    chiHien(1)
    cham(1)
    giay(3)
    IOGia.ds[0]!.cb([1, 2].map((k) => ({ target: cauDom(k), intersectionRatio: 0.3, intersectionRect: { height: 200 } })))
    giay(10)
    expect(b.layDoGiay(null)!.q1).toMatchObject({ v: 13, g: 3, l: 13 })
  })

  it('tải lại trang lúc đang ẩn: khoảng ẩn đó KHÔNG cộng (đóng tối mở sáng không thành "treo"); khoảng ẩn sau khi mở lại vẫn cộng', () => {
    const luu = vi.fn()
    const { b, chiHien, giay } = taoDo({ luu })
    chiHien(1)
    cham(1)
    giay(12)
    an() // tab ẩn ⇒ lưu ngay
    const bang = luu.mock.lastCall![0]
    b.dung()
    dongHo += 10 * 3600_000 // 10 tiếng sau mở lại
    tabHien = 'visible'
    const lai = taoDo({ luu })
    lai.b.khoiPhuc(bang, [])
    lai.chiHien(1)
    cham(1)
    lai.giay(2)
    expect(lai.b.layDoGiay(null)!.q1).toMatchObject({ a: 0, v: 14, l: 12 }) // cộng dồn v / l qua lần mở; a không có khoảng 10 tiếng
    an()
    dongHo += 30_000
    hien()
    expect(lai.b.layDoGiay(null)!.q1.a).toBe(30)
  })

  it('mở lại phiếu: v a l n cộng dồn từ bảng lưu (khoá __do); câu có đáp án sẵn mà không có đồng hồ cũ ⇒ không đo gì', () => {
    const { b, chiHien, giay } = taoDo()
    b.khoiPhuc({ q1: 20, __do: { v: { q1: 50, q2: 9 }, a: { q1: 7 }, l: { q1: 40 }, n: { q1: 2 }, wc: { q1: 1 } } }, ['q2'])
    chiHien(1)
    cham(1)
    giay(5)
    expect(b.layDoGiay(null)).toEqual({ q1: { g: 25, v: 55, a: 7, l: 40, n: 2, w: 1 } }) // w: lần mở trước đã giữ được màn sáng
  })

  it('datLai xoá cả phần đo thêm của câu đã nộp', () => {
    const { b, chiHien, giay } = taoDo()
    chiHien(1)
    cham(1)
    giay(4)
    b.datLai(['q1'])
    expect(b.layDoGiay(null)).toBeNull()
  })

  /** Khoá màn sáng giả: `nha()` = hệ điều hành / trình duyệt tự nhả. */
  const taoKhoa = () => {
    const ds: Array<{ released: boolean; nha: () => void; release: ReturnType<typeof vi.fn> }> = []
    const request = vi.fn(() => {
      let f: () => void = () => {}
      const k = { released: false, addEventListener: (_t: string, g: () => void) => { f = g }, release: vi.fn(() => { k.released = true; f(); return Promise.resolve() }), nha: () => { k.released = true; f() } }
      ds.push(k)
      return Promise.resolve(k)
    })
    return { request, ds }
  }
  const vong = () => new Promise((r) => setTimeout(r, 0))

  it('giữ màn sáng TẮT (tuy.giuManSang = false) ⇒ không xin, w = 0', () => {
    const { request } = taoKhoa()
    const { b, chiHien, giay } = taoDo({ giuManSang: false }, { wakeLock: { request } })
    chiHien(1)
    cham(1)
    giay(3)
    expect(request).not.toHaveBeenCalled()
    expect(b.layDoGiay(null)!.q1.w).toBe(0)
  })

  it('giữ màn sáng MẶC ĐỊNH BẬT: xin khi mở ⇒ w = 1; tab ẩn (trình duyệt tự nhả) KHÔNG hạ w; hiện lại thì xin lại; không xin chồng', async () => {
    const { request, ds } = taoKhoa()
    const { b, chiHien, giay } = taoDo({}, { wakeLock: { request } })
    cham(1) // chạm ngay lúc đang xin ⇒ cờ đang-xin chặn lần xin thứ hai
    expect(request).toHaveBeenCalledTimes(1)
    await vong()
    chiHien(1)
    cham(1)
    giay(3)
    expect(request).toHaveBeenCalledWith('screen')
    expect(b.layDoGiay(null)!.q1.w).toBe(1)
    an()
    ds[0]!.nha()
    hien()
    expect(request).toHaveBeenCalledTimes(2)
    giay(1)
    expect(b.layDoGiay(null)!.q1.w).toBe(1)
  })

  it('10 phút không chạm ⇒ NHẢ giữ màn sáng (máy bỏ quên không sáng mãi); chạm lại ⇒ xin lại', async () => {
    const { request, ds } = taoKhoa()
    const { chiHien, giay } = taoDo({}, { wakeLock: { request } })
    await vong()
    chiHien(1)
    cham(1)
    giay(599)
    expect(ds[0]!.release).not.toHaveBeenCalled()
    giay(2)
    expect(ds[0]!.release).toHaveBeenCalledTimes(1)
    cham(1)
    expect(request).toHaveBeenCalledTimes(2)
  })

  it('máy KHÔNG hỗ trợ (iOS cũ) / xin bị từ chối ⇒ w = 0, không lỗi', async () => {
    const mot = taoDo({}, {})
    mot.chiHien(1)
    cham(1)
    mot.giay(2)
    expect(mot.b.layDoGiay(null)!.q1.w).toBe(0)
    mot.b.dung()
    const tuChoi = taoDo({}, { wakeLock: { request: () => Promise.reject(new Error('NotAllowedError')) } })
    await vong()
    tuChoi.chiHien(1)
    cham(1)
    tuChoi.giay(2)
    expect(tuChoi.b.layDoGiay(null)!.q1.w).toBe(0)
  })
})

describe('máy em chuyển cụm đo lên máy chủ (nopChangCaNhan)', () => {
  it('giữ g v a l n w là số nguyên trong khoảng; bỏ trường lạ; câu chỉ có v (không g) vẫn đi', async () => {
    const nopChang = vi.fn(async () => ({ ok: true, ketQua: [] }))
    const dep = { layCauHinh: async () => ({ url: 'https://x', ma: 'M' }), nopChang } as unknown as PhuThuocNopChang
    await nopChangCaNhan(
      {
        ma: 'BTVN-1', sbd: '1', chiSo: 0, dapAn: { q1: 'A', q2: 'B' },
        doGiay: { q1: { g: 12, v: 700.4, a: 9e9, l: -3, n: 2.6, w: 1, t: 99 }, q2: { v: 30, l: 30, n: 0, a: 0, w: 0 }, q3: { x: 1 } },
      } as never,
      'CA',
      dep,
    )
    const than = (nopChang.mock.calls[0] as unknown[])[1] as { doGiay: Record<string, unknown> }
    expect(than.doGiay).toEqual({ q1: { g: 12, v: 700, a: 7200, l: 0, n: 3, w: 1 }, q2: { v: 30, a: 0, l: 30, n: 0, w: 0 } })
  })
})

describe('ca thi — bộ đếm treo máy (do-treo-may-thi.ts) + cụm gửi', async () => {
  const { taoDoTreoMay, doGiayThi } = await import('../src/lib/do-treo-may-thi')
  let gio = 0
  const tao = (dau?: Parameters<typeof taoDoTreoMay>[0]) => taoDoTreoMay(dau, () => gio)
  const nhip = (d: ReturnType<typeof tao>, q: string | null, s: number, giuSang = false) => { for (let i = 0; i < s; i++) { gio += 1000; d.nhip(q, giuSang) } }

  it('10 phút không chạm ⇒ l ≥ 600', () => {
    gio = 0
    const d = tao()
    d.cham()
    nhip(d, 'c1', 600)
    expect(d.bang().c1!.l).toBeGreaterThanOrEqual(600)
  })
  it('ẩn 3 phút ⇒ a = 180 cho câu đang làm lúc ẩn; tải lại giữa lúc ẩn ⇒ không cộng', () => {
    gio = 0
    const d = tao()
    nhip(d, 'c2', 5)
    d.an()
    gio += 180_000
    d.hien()
    expect(d.bang().c2!.a).toBe(180)
    d.an() // ẩn rồi trang bị tải lại: bộ mới chỉ nạp bảng đã lưu, không biết lúc ẩn
    const lai = tao(d.bang())
    gio += 3_600_000
    lai.hien()
    expect(lai.bang().c2!.a).toBe(180)
  })
  it('3 lần lặng 150 giây rồi chạm ⇒ n = 3; lặng ≥ 180 không tính n', () => {
    gio = 0
    const d = tao()
    for (let k = 0; k < 3; k++) { nhip(d, 'c1', 150); d.cham() }
    nhip(d, 'c1', 200)
    d.cham()
    expect(d.bang().c1).toMatchObject({ n: 3, l: 200 })
  })
  it('tính nháp 4 phút chạm mỗi 100 giây ⇒ l < 300, n = 0', () => {
    gio = 0
    const d = tao()
    for (let k = 0; k < 4; k++) { nhip(d, 'c1', 60); d.cham() }
    expect(d.bang().c1!.l).toBeLessThan(300)
    expect(d.bang().c1!.n ?? 0).toBe(0)
  })
  it('không câu nào hiện đủ ⇒ lặng cộng cho câu vừa đếm', () => {
    gio = 0
    const d = tao()
    nhip(d, 'c1', 3)
    nhip(d, null, 7)
    expect(d.bang().c1!.l).toBe(10)
  })
  it('cụm gửi: g = v = giayCau (định nghĩa ca thi hiện hành); w = 1 khi đã giữ được màn sáng; câu không có g không gửi; không gì ⇒ null', () => {
    gio = 0
    const d = tao()
    nhip(d, 'c1', 4, true)
    nhip(d, 'c2', 2, false)
    d.an()
    gio += 30_000
    d.hien()
    // g = giayCau (định nghĩa ca thi, trần 900); l kẹp ≤ v như máy chủ (lamSachTreo)
    expect(doGiayThi({ c1: 4, c2: 2 }, d.bang())).toEqual({ c1: { g: 4, v: 4, a: 0, l: 4, n: 0, w: 1 }, c2: { g: 2, v: 2, a: 30, l: 2, n: 0, w: 0 } })
    expect(doGiayThi({}, { c3: { a: 12 } })).toBeNull() // câu không có g: máy chủ bỏ cụm treo (lamSachDo) ⇒ không gửi
    expect(doGiayThi({ c4: 1500 }, {})!.c4).toMatchObject({ g: 900, v: 1500 })
    expect(doGiayThi({}, {})).toBeNull()
    expect(doGiayThi(null, null)).toBeNull()
  })
  it('nạp bảng lưu: kẹp khoảng, bỏ rác', () => {
    const d = taoDoTreoMay({ c1: { a: 9e9, l: -1, n: 70.4, wc: 1 }, c2: null as never })
    expect(d.bang()).toEqual({ c1: { a: 7200, n: 60, wc: 1 } })
  })
})

describe('ca thi — batDoTreoMay trên trang (nạp lười từ màn thi)', async () => {
  const { batDoTreoMay } = await import('../src/lib/do-treo-may-thi')
  it('nghe chạm thật trên document; mỗi nhịp tự ghi doCau vào lượt làm (chưa nộp); dung() gỡ bộ nghe; lượt đã nộp thì không ghi', () => {
    const luot: { current: { doCau?: Record<string, unknown>; submitted?: boolean } | null } = { current: {} }
    const d = batDoTreoMay(luot as never, false)
    for (let i = 0; i < 150; i++) d.nhip('c1')
    document.dispatchEvent(new Event('pointerdown'))
    d.nhip('c1')
    expect(luot.current!.doCau).toMatchObject({ c1: { n: 1, l: 150 } })
    expect(luot.current!.doCau!.c1).not.toHaveProperty('wc') // giữ màn sáng tắt ⇒ chưa từng giữ được
    d.dung()
    for (let i = 0; i < 150; i++) d.nhip('c1')
    document.dispatchEvent(new Event('pointerdown')) // đã gỡ ⇒ không đếm thêm lần lặng
    luot.current!.submitted = true
    const truoc = JSON.stringify(luot.current!.doCau)
    d.nhip('c1')
    expect(JSON.stringify(luot.current!.doCau)).toBe(truoc)
  })
})

describe('ca thi — giữ màn sáng (luật Boss 22/10)', async () => {
  const { batDoTreoMay, doGiayThi } = await import('../src/lib/do-treo-may-thi')
  it('xin khi vào đề, không xin chồng; w = 1 kể cả sau khi tab ẩn tự nhả; 10 phút không chạm ⇒ nhả; chạm ⇒ xin lại; dung() nhả', async () => {
    let gio = 0
    const khoa: Array<{ released: boolean; release: ReturnType<typeof vi.fn> }> = []
    const request = vi.fn(() => { const k = { released: false, addEventListener() {}, release: vi.fn(() => { k.released = true; return Promise.resolve() }) }; khoa.push(k); return Promise.resolve(k) })
    Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request } })
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => tabHien !== 'visible' })
    const luot: { current: { doCau?: Record<string, { wc?: 1 }>; submitted?: boolean } | null } = { current: {} }
    const d = batDoTreoMay(luot as never, true, () => gio)
    document.dispatchEvent(new Event('pointerdown')) // đang xin ⇒ không xin chồng
    expect(request).toHaveBeenCalledTimes(1)
    await new Promise((r) => setTimeout(r, 0))
    gio += 1000; d.nhip('c1')
    expect(luot.current!.doCau!.c1!.wc).toBe(1)
    an(); hien() // trình duyệt tự nhả khi ẩn ⇒ hiện lại xin lại
    expect(request).toHaveBeenCalledTimes(2)
    await new Promise((r) => setTimeout(r, 0))
    for (let i = 0; i < 601; i++) { gio += 1000; d.nhip('c1') }
    expect(khoa[1]!.release).toHaveBeenCalledTimes(1)
    document.dispatchEvent(new Event('keydown'))
    expect(request).toHaveBeenCalledTimes(3)
    await new Promise((r) => setTimeout(r, 0))
    expect(doGiayThi({ c1: 602 }, luot.current!.doCau as never)!.c1!.w).toBe(1)
    d.dung()
    expect(khoa[2]!.release).toHaveBeenCalledTimes(1)
    delete (navigator as unknown as Record<string, unknown>).wakeLock
  })
})
