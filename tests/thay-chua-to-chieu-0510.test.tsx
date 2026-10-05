// NÚT "THẦY CHỮA" TRÊN MỌI TỜ CHIẾU (thầy 05/10): bấm ⇒ không gọi em lên bảng nữa, câu tính là thầy đã chữa.
//   · giao thức: tin THAY_CHUA {khoa} qua đủ bốn lớp kiểm (`kiemTinToChieu`), khoá phải là ô CÓ trên tờ;
//   · tờ dựng: mỗi ô có nút chấm thì có thêm đúng MỘT nút "Thầy chữa" (lớp riêng, ngoài `.mc-cham`); không cầu nối ⇒ không có;
//   · JS trong tờ (JSDOM): chưa bắt tay không gửi; bấm đúp một tin; app báo xong ⇒ ẩn em + nút chấm, cột làm bài ghi "Thầy chữa"; lỗi/8 giây ⇒ mở lại;
//   · hook `useGhiToChieu`: gọi đúng đường ghi của màn, chống ghi đôi, trả THAY_CHUA_XONG; mở tờ mới thì báo lại ô đã chữa;
//   · máy chủ `/gv/thay-chua-cau`: nhãn `thay_da_chua` + mốc `srs2_day_lai`, idempotent, chỉ thầy, nguồn hợp lệ.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render } from '@testing-library/react'
import { forwardRef, useImperativeHandle } from 'react'
import { JSDOM, VirtualConsole } from 'jsdom'
import { taoHtmlMayChieu, type OBang } from '../src/lib/html-may-chieu'
import { GIAY_CHO_PHAN_HOI, TIN_TO_CHIEU, kiemTinToChieu, type BoiCanhKiemTin } from '../src/lib/to-chieu-cau-noi'
import { useGhiToChieu, type ThayChuaMotO } from '../src/components/chien-dich/ghi-to-chieu'
import type { OGhiToChieu } from '../src/components/chien-dich/to-chieu'
import { useAppStore } from '../src/store/appStore'

const GOC = 'http://localhost:3000'
const MA = 'PHIEN-tc-0510'
const o = (sbd: string, qid = `Q-${sbd}`): OBang => ({
  sbd,
  hoTen: `Em ${sbd}`,
  qid,
  soCau: 1,
  sao: 1,
  cau: { phan: 'I', id: qid, text: 'Câu ngắn', luaChon: ['A', 'B', 'C', 'D'], dapAn: 'A', buoc: [] } as unknown as OBang['cau'],
})

describe('giao thức THAY_CHUA', () => {
  const KHUNG = { la: 'khung' }
  const ctx: BoiCanhKiemTin = { maPhien: MA, gocApp: GOC, laKhungToChieu: (s) => s === KHUNG, khoaHopLe: (k) => k === 'S1|Q1' }
  const tin = (data: Record<string, unknown>) => ({ data: { maPhien: MA, ...data }, origin: GOC, source: KHUNG })
  it('ô có trên tờ ⇒ nhận; ô lạ / thiếu khoá / sai phiên / khung lạ ⇒ bỏ', () => {
    expect(kiemTinToChieu(tin({ type: TIN_TO_CHIEU.THAY_CHUA, khoa: 'S1|Q1' }), ctx)).toEqual({ loai: 'thay_chua', khoa: 'S1|Q1' })
    expect(kiemTinToChieu(tin({ type: TIN_TO_CHIEU.THAY_CHUA, khoa: 'S9|Q9' }), ctx)).toBeNull()
    expect(kiemTinToChieu(tin({ type: TIN_TO_CHIEU.THAY_CHUA }), ctx)).toBeNull()
    expect(kiemTinToChieu({ ...tin({ type: TIN_TO_CHIEU.THAY_CHUA, khoa: 'S1|Q1' }), data: { type: TIN_TO_CHIEU.THAY_CHUA, khoa: 'S1|Q1', maPhien: 'khac' } }, ctx)).toBeNull()
    expect(kiemTinToChieu({ ...tin({ type: TIN_TO_CHIEU.THAY_CHUA, khoa: 'S1|Q1' }), source: {} }, ctx)).toBeNull()
  })
})

describe('tờ dựng: nút "Thầy chữa"', () => {
  it('có cầu nối ⇒ mỗi ô có qid đúng MỘT nút, khoá sbd|qid, nằm NGOÀI .mc-cham; mỗi ô vẫn đúng hai nút chấm', () => {
    const doc = new JSDOM(taoHtmlMayChieu([o('A'), o('B')], { cauNoi: { maPhien: MA } })).window.document
    const ds = [...doc.querySelectorAll('.mc-thay-chua')]
    expect(ds.map((x) => x.getAttribute('data-khoa-tc'))).toEqual(['A|Q-A', 'B|Q-B'])
    // thuộc tính RIÊNG: nơi đếm `data-khoa` (ô chấm) vẫn thấy mỗi ô đúng một lần
    expect([...doc.querySelectorAll('[data-khoa]')].map((x) => x.getAttribute('data-khoa'))).toEqual(['A|Q-A', 'B|Q-B'])
    for (const x of ds) {
      expect(x.closest('.mc-cham')).toBeNull()
      expect(x.querySelector('button')!.textContent).toBe('Thầy chữa')
    }
    expect(doc.querySelectorAll('.mc-cham-nut')).toHaveLength(4)
  })
  it('không cầu nối / ô không qid ⇒ không có nút', () => {
    expect(taoHtmlMayChieu([o('A')], {})).not.toContain('class="mc-thay-chua"')
    const khongQid = { ...o('A'), qid: undefined }
    expect(taoHtmlMayChieu([khongQid], { cauNoi: { maPhien: MA } })).not.toContain('class="mc-thay-chua"')
  })
})

// ─────────── JS trong tờ, chạy thật trong JSDOM ───────────
function moTo() {
  const cha = new JSDOM('<!doctype html><body></body>', { url: `${GOC}/` }).window as unknown as Window & { postMessage: (m: unknown, o?: string) => void }
  const gui: Record<string, unknown>[] = []
  cha.postMessage = ((m: Record<string, unknown>) => void gui.push(m)) as never
  const hen: { f: () => void; ms: number; iv: boolean; id: number; huy: boolean }[] = []
  const dom = new JSDOM(taoHtmlMayChieu([o('A'), o('B')], { cauNoi: { maPhien: MA } }), {
    runScripts: 'dangerously',
    virtualConsole: new VirtualConsole(),
    beforeParse(w) {
      Object.defineProperty(w, 'parent', { get: () => cha, configurable: true })
      let id = 0
      w.setTimeout = ((f: () => void, ms: number) => (hen.push({ f, ms, iv: false, id: ++id, huy: false }), id)) as never
      w.setInterval = ((f: () => void, ms: number) => (hen.push({ f, ms, iv: true, id: ++id, huy: false }), id)) as never
      w.clearTimeout = w.clearInterval = ((h: number) => {
        const x = hen.find((t) => t.id === h)
        if (x) x.huy = true
      }) as never
      w.HTMLElement.prototype.scrollTo = () => {}
    },
  })
  const w = dom.window as unknown as Window & typeof globalThis
  const doc = dom.window.document
  const tuCha = (data: unknown) =>
    w.dispatchEvent(new (dom.window as unknown as { MessageEvent: typeof MessageEvent }).MessageEvent('message', { data, origin: GOC, source: cha as unknown as MessageEventSource }))
  const nutTc = (i = 0) => doc.querySelectorAll<HTMLElement>('.mc-thay-chua')[i]!
  const tinTc = () => gui.filter((m) => m.type === TIN_TO_CHIEU.THAY_CHUA)
  const chayHen = (ms: number) => hen.filter((t) => !t.huy && !t.iv && t.ms === ms).forEach((t) => ((t.huy = true), t.f()))
  return { doc, tuCha, nutTc, tinTc, chayHen, ketNoi: () => tuCha({ type: TIN_TO_CHIEU.KET_NOI, maPhien: MA }) }
}

describe('tờ chiếu chạy thật — bấm "Thầy chữa"', () => {
  it('chưa bắt tay ⇒ không gửi; sau bắt tay bấm đúp ⇒ đúng MỘT tin {khoa}, nút khoá "Đang ghi…"', () => {
    const t = moTo()
    t.nutTc().querySelector('button')!.click()
    expect(t.tinTc()).toHaveLength(0)
    t.ketNoi()
    const b = t.nutTc().querySelector('button')!
    b.click()
    b.click()
    expect(t.tinTc()).toEqual([{ type: TIN_TO_CHIEU.THAY_CHUA, khoa: 'A|Q-A', maPhien: MA }])
    expect(b.disabled).toBe(true)
    expect(t.nutTc().textContent).toContain('Đang ghi…')
  })
  it('app báo da_ghi ⇒ đợt đó thôi gọi em (data-thay-chua), nhãn "Thầy đã chữa"; ô kia không đổi', () => {
    const t = moTo()
    t.ketNoi()
    t.nutTc().querySelector('button')!.click()
    t.tuCha({ type: TIN_TO_CHIEU.THAY_CHUA_XONG, maPhien: MA, khoa: 'A|Q-A', kq: 'da_ghi' })
    expect(t.nutTc().textContent).toBe('Thầy đã chữa')
    const dot = t.nutTc().closest('.mc-dot')!
    expect(dot.getAttribute('data-thay-chua')).toBe('1')
    expect(t.nutTc(1).closest('.mc-dot')!.hasAttribute('data-thay-chua')).toBe(false)
    expect(t.nutTc(1).querySelector('button')).not.toBeNull()
  })
  it('app báo loi ⇒ mở lại nút "chưa ghi được, bấm lại"; không trả lời sau 8 giây ⇒ cũng mở lại', () => {
    const t = moTo()
    t.ketNoi()
    t.nutTc().querySelector('button')!.click()
    t.tuCha({ type: TIN_TO_CHIEU.THAY_CHUA_XONG, maPhien: MA, khoa: 'A|Q-A', kq: 'loi' })
    expect(t.nutTc().querySelector('button')!.disabled).toBe(false)
    expect(t.nutTc().textContent).toContain('chưa ghi được, bấm lại')
    t.nutTc(1).querySelector('button')!.click()
    t.chayHen(GIAY_CHO_PHAN_HOI * 1000)
    expect(t.nutTc(1).querySelector('button')!.disabled).toBe(false)
  })
  it('đợt đã "Thầy chữa": phím L (gọi em) / D / K không gọi, không chấm — chỉ nhắc', () => {
    const t = moTo()
    t.ketNoi()
    t.nutTc().querySelector('button')!.click()
    t.tuCha({ type: TIN_TO_CHIEU.THAY_CHUA_XONG, maPhien: MA, khoa: 'A|Q-A', kq: 'da_ghi' })
    const w = t.doc.defaultView as unknown as { __mcLenh?: (k: string) => void }
    const pha = t.doc.body.getAttribute('data-pha')
    w.__mcLenh?.('L')
    w.__mcLenh?.('D')
    expect(t.doc.body.getAttribute('data-pha')).toBe(pha)
    expect(t.doc.querySelector('.mc-bao')?.textContent).toBe('Câu này thầy chữa — không gọi em')
  })
  it('thanh dưới: nút C "Thầy chữa" (và phím c) bấm đúng nút của đợt đang chiếu; xong thì nút C ẩn', () => {
    const t = moTo()
    const c = t.doc.querySelector<HTMLButtonElement>('#mc-phim-nhom [data-k="C"]')!
    expect(c.textContent).toContain('Thầy chữa')
    expect(c.hidden).toBe(true)
    t.ketNoi()
    expect(c.hidden).toBe(false)
    c.click()
    expect(t.tinTc()).toEqual([{ type: TIN_TO_CHIEU.THAY_CHUA, khoa: 'A|Q-A', maPhien: MA }])
    t.tuCha({ type: TIN_TO_CHIEU.THAY_CHUA_XONG, maPhien: MA, khoa: 'A|Q-A', kq: 'da_ghi' })
    expect(c.hidden).toBe(true)
  })
  it('mở tờ mới: app báo THAY_CHUA_XONG ngay lúc bắt tay ⇒ ô khoá luôn (không cần đang bấm)', () => {
    const t = moTo()
    t.ketNoi()
    t.tuCha({ type: TIN_TO_CHIEU.THAY_CHUA_XONG, maPhien: MA, khoa: 'B|Q-B', kq: 'da_ghi' })
    expect(t.nutTc(1).textContent).toBe('Thầy đã chữa')
  })
})

// ─────────── hook dùng chung (Chiến dịch · Đầu giờ · Dạy học) ───────────
const toast = vi.fn()
beforeEach(() => {
  toast.mockReset()
  useAppStore.setState({ showToast: toast } as never)
  localStorage.clear()
})
afterEach(cleanup)

type Tay = ReturnType<typeof useGhiToChieu>
const Khung = forwardRef<Tay, { id: string; tc: ThayChuaMotO }>(function Khung({ id, tc }, ref) {
  const h = useGhiToChieu(id, undefined, tc)
  useImperativeHandle(ref, () => h, [h])
  return (
    <div className="lop-xem-phieu">
      <iframe title="tờ" />
    </div>
  )
})

describe('useGhiToChieu — tin "Thầy chữa"', () => {
  const O: OGhiToChieu = { sbd: '01', hoTen: 'Em 01', qid: 'DE-A-I-17', chuyenDe: 'Ester' }
  const dung = (tc: ThayChuaMotO) => {
    const tay: { current: Tay | null } = { current: null }
    const r = render(<Khung id="cd-1" tc={tc} ref={(x) => void (tay.current = x)} />)
    const khung = r.container.querySelector('iframe') as HTMLIFrameElement
    let ma = ''
    act(() => {
      ma = tay.current!.moPhien()
      tay.current!.ganO(ma, new Map([['01|DE-A-I-17', O]]))
    })
    const nhan: Record<string, unknown>[] = []
    khung.contentWindow!.addEventListener('message', (e) => nhan.push((e as MessageEvent).data))
    const gui = (data: Record<string, unknown>) =>
      act(() => {
        window.dispatchEvent(new MessageEvent('message', { data: { maPhien: ma, ...data }, origin: window.location.origin, source: khung.contentWindow }))
      })
    return { gui, nhan }
  }
  const cho = () => act(async () => { await new Promise((r) => setTimeout(r, 20)) })

  it('gọi đúng đường ghi của màn với đúng ô; trả da_ghi; bấm lại không ghi đôi; ô lạ bị bỏ', async () => {
    const tc = vi.fn<ThayChuaMotO>(async () => ({ ok: true }))
    const t = dung(tc)
    t.gui({ type: TIN_TO_CHIEU.SAN_SANG })
    t.gui({ type: TIN_TO_CHIEU.THAY_CHUA, khoa: '01|DE-A-I-17' })
    t.gui({ type: TIN_TO_CHIEU.THAY_CHUA, khoa: '01|DE-A-I-17' })
    t.gui({ type: TIN_TO_CHIEU.THAY_CHUA, khoa: '99|X' })
    await cho()
    expect(tc).toHaveBeenCalledTimes(1)
    expect(tc).toHaveBeenCalledWith(O)
    expect(t.nhan.filter((m) => m.type === TIN_TO_CHIEU.THAY_CHUA_XONG).every((m) => m.kq === 'da_ghi' && m.khoa === '01|DE-A-I-17')).toBe(true)
    // tờ mở lại (bắt tay lần nữa) ⇒ app báo lại ô đã chữa
    t.nhan.length = 0
    t.gui({ type: TIN_TO_CHIEU.SAN_SANG })
    await cho()
    expect(t.nhan).toContainEqual(expect.objectContaining({ type: TIN_TO_CHIEU.THAY_CHUA_XONG, khoa: '01|DE-A-I-17', kq: 'da_ghi' }))
  })

  it('máy chủ từ chối ⇒ trả loi, báo lỗi; bấm lại thì thử lại', async () => {
    const tc = vi.fn<ThayChuaMotO>(async () => ({ ok: false, chu: 'Mất mạng' }))
    const t = dung(tc)
    t.gui({ type: TIN_TO_CHIEU.SAN_SANG })
    t.gui({ type: TIN_TO_CHIEU.THAY_CHUA, khoa: '01|DE-A-I-17' })
    await cho()
    expect(t.nhan).toContainEqual(expect.objectContaining({ type: TIN_TO_CHIEU.THAY_CHUA_XONG, kq: 'loi' }))
    expect(toast).toHaveBeenCalledWith('Mất mạng', 'error')
    t.gui({ type: TIN_TO_CHIEU.THAY_CHUA, khoa: '01|DE-A-I-17' })
    await cho()
    expect(tc).toHaveBeenCalledTimes(2)
  })
})
