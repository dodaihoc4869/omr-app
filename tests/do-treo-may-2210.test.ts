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
    b.khoiPhuc({ q1: 20, __do: { v: { q1: 50, q2: 9 }, a: { q1: 7 }, l: { q1: 40 }, n: { q1: 2 }, wh: { q1: 1 } } }, ['q2'])
    chiHien(1)
    cham(1)
    giay(5)
    expect(b.layDoGiay(null)).toEqual({ q1: { g: 25, v: 55, a: 7, l: 40, n: 2, w: 0 } })
  })

  it('datLai xoá cả phần đo thêm của câu đã nộp', () => {
    const { b, chiHien, giay } = taoDo()
    chiHien(1)
    cham(1)
    giay(4)
    b.datLai(['q1'])
    expect(b.layDoGiay(null)).toBeNull()
  })

  it('giữ màn sáng: TẮT mặc định ⇒ không xin wakeLock, w = 0', () => {
    const request = vi.fn(() => Promise.resolve({ released: false, addEventListener() {}, release() {} }))
    const { b, chiHien, giay } = taoDo({}, { wakeLock: { request } })
    chiHien(1)
    cham(1)
    giay(3)
    expect(request).not.toHaveBeenCalled()
    expect(b.layDoGiay(null)!.q1.w).toBe(0)
  })

  it('giữ màn sáng BẬT (tuy.giuManSang) và máy hỗ trợ ⇒ w = 1; khoá bị nhả giữa chừng ⇒ w = 0; hiện lại thì xin lại', async () => {
    let nha: (() => void) | null = null
    const khoa = () => {
      const k = { released: false, addEventListener: (_t: string, f: () => void) => { nha = () => { k.released = true; f() } }, release() {} }
      return k
    }
    const request = vi.fn(() => Promise.resolve(khoa()))
    const { b, chiHien, giay } = taoDo({ giuManSang: true }, { wakeLock: { request } })
    await Promise.resolve()
    chiHien(1)
    cham(1)
    giay(3)
    expect(request).toHaveBeenCalledWith('screen')
    expect(b.layDoGiay(null)!.q1.w).toBe(1)
    nha!() // hệ điều hành nhả khoá
    giay(1)
    expect(b.layDoGiay(null)!.q1.w).toBe(0)
    an()
    hien()
    expect(request).toHaveBeenCalledTimes(2)
  })

  it('giữ màn sáng BẬT nhưng máy KHÔNG hỗ trợ (iOS cũ) / xin bị từ chối ⇒ w = 0, không lỗi', async () => {
    const mot = taoDo({ giuManSang: true }, {})
    mot.chiHien(1)
    cham(1)
    mot.giay(2)
    expect(mot.b.layDoGiay(null)!.q1.w).toBe(0)
    mot.b.dung()
    const tuChoi = taoDo({ giuManSang: true }, { wakeLock: { request: () => Promise.reject(new Error('NotAllowedError')) } })
    await Promise.resolve()
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
