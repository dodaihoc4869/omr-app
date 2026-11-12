// @vitest-environment jsdom
// Thầy 12/11 tối: (1) phím «/» hỏi nhanh «Hiểu chưa?» — máy em hiện hai phím 1 · 2 giữa phần bảng 1/3 bên phải, «chọn xong tự ẩn luôn», kết quả
// hiện lung linh ở máy thầy; (2) «bỏ luôn cảnh báo lúc học sinh đang chơi game trong phòng chờ, bắt đầu vào live bảng hoặc học mới bật cảnh báo».
import { readFileSync } from 'node:fs'
import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { KenhLopMay } from '../server/src/kenh-lop-may'
import HoiHieuEm from '../src/components/live-khoi/HoiHieuEm'
import HoiHieuThay from '../src/components/live-khoi/HoiHieuThay'
import { HET_HAN_MS, bam01, choDom, docHoi, docTraLoi } from '../src/components/live-khoi/hoi-hieu'
import { liveDat } from '../src/lib/bpu/phong-live'
import { KJ, roiMan, taoPhong, vaoLop, veMan, viewBang, viewEm, type TrangThaiPhong } from '../src/lib/bpu/phong'
import type { KenhLop, LoaiTinLop, TinLop } from '../src/lib/live-khoi/kieu'
import { JS_LIVE_MT } from '../src/lib/live-mt-to-chieu'

const NAY = 1_700_000_000_000
const doc = (p: string) => readFileSync(p, 'utf8')
function phong(gd: 'cho' | 'dang'): TrangThaiPhong {
  const st = taoPhong({ buoiId: 'b', lop: 'Live Khối 10', nay: NAY, ds: [{ sbd: 'S1', ten: 'Minh Anh', coMat: true, luc: 1 }, { sbd: 'S2', ten: 'Gia Bảo', coMat: true, luc: 1 }] })
  vaoLop(st, 'S1', NAY); vaoLop(st, 'S2', NAY)
  st.live = { cho: true, sfu: false, san: false, bat: false, tu: null, phien: 0, ss: null, tay: [], noi: [], xa: false, tiengLop: true, soNet: 0, nhip: 0 }
  liveDat(st, { khoi: { k: 10, gd, che: 'hoc' } }, NAY)
  return st
}
function kenhGia() {
  const nghe = new Map<LoaiTinLop, Set<(t: TinLop) => void>>(), gui: Array<[LoaiTinLop, unknown]> = []
  const kenh: KenhLop = { gui: (k, x) => { gui.push([k, x]) }, nghe: (k, f) => { let s = nghe.get(k); if (!s) { s = new Set(); nghe.set(k, s) } s.add(f); return () => { s.delete(f) } } }
  const phat = (s: string, n: string, x: unknown) => act(() => { for (const f of nghe.get('hieu') ?? []) f({ k: 'hieu', s, n, d: 0, l: Date.now(), x }) })
  return { kenh, gui, phat }
}
afterEach(() => { cleanup(); vi.useRealTimers() })

describe('phòng chờ live khối: chưa tính, chưa báo rời màn', () => {
  it('em rời lúc phòng chờ ⇒ không trừ kJ, không đếm, bảng KHÔNG thấy tên; phòng vẫn nhớ để `ve` gỡ', () => {
    const st = phong('cho'), kj = st.ds[0].kj, doi = [...st.doiThuong], soBd = (st.bienDong ?? []).length
    expect(roiMan(st, 'S1', NAY + 1)).toBe(true)
    expect(roiMan(st, 'S1', NAY + 2)).toBe(false)
    expect(st.ds[0]).toMatchObject({ kj, roi: 0 })
    expect(st.doiThuong).toEqual(doi)
    expect((st.bienDong ?? []).length).toBe(soBd) // không thêm biến động «Rời màn hình»
    expect(viewBang(st).roiNay).toEqual([])
    expect(viewEm(st, 'S1').em?.dangRoi).toBe(true)
    expect(veMan(st, 'S1', NAY + 3)).toBe(true)
    expect(st.roiNay).toEqual([])
  })
  it('bắt đầu live ⇒ em CÒN ở ngoài hiện tên ngay; từ đó rời màn tính như cũ (−50 kJ)', () => {
    const st = phong('cho')
    roiMan(st, 'S1', NAY + 1)
    liveDat(st, { khoi: { k: 10, gd: 'dang', che: 'bang' } }, NAY + 2)
    expect(viewBang(st).roiNay).toEqual(['S1'])
    st.ds[1].kj = 120
    expect(roiMan(st, 'S2', NAY + 3)).toBe(true)
    expect(st.ds[1]).toMatchObject({ kj: 120 - KJ.roiMan, roi: 1 })
    expect(viewBang(st).roiNay).toEqual(['S1', 'S2'])
  })
})

describe('«Hiểu chưa?» — phòng chuyển tiếp', () => {
  const dung = () => {
    const st = phong('dang'), tin = { hs: [] as string[], gv: [] as string[] }
    const ws = (ds: string[]) => ({ send: (d: string) => { ds.push(d) } })
    const hs = ws(tin.hs), gv = ws(tin.gv)
    const k = new KenhLopMay({ getWebSockets: (tag?: string) => (tag === 'gv' ? [gv] : [hs]) } as never, () => st)
    return { tin, em: (s: string, x: unknown, nay = NAY) => k.tin(hs as never, { v: 'hs', s } as never, { t: 'lop', k: 'hieu', x } as never, st, nay), thay: (x: unknown) => k.tin(gv as never, { v: 'gv', s: '' } as never, { t: 'lop', k: 'hieu', x } as never, st, NAY) }
  }
  it('thầy mở / đóng ⇒ tới mọi máy em (không dội lại máy thầy)', () => {
    const { tin, thay } = dung()
    thay({ mo: true, n: 7 }); thay({ mo: false, n: 7 })
    expect(tin.hs.map((d) => JSON.parse(d).x)).toEqual([{ mo: true, n: 7 }, { mo: false, n: 7 }])
    expect(tin.gv).toEqual([])
  })
  it('em trả lời ⇒ CHỈ máy thầy nhận, phòng đóng dấu số báo danh + tên; bạn khác không thấy; giá trị lạ / em lạ / bấm dồn bị bỏ', () => {
    const { tin, em } = dung()
    em('S1', { v: 2, n: 7 })
    expect(tin.hs).toEqual([])
    expect(JSON.parse(tin.gv[0])).toMatchObject({ t: 'lop', k: 'hieu', s: 'S1', n: 'Minh Anh', x: { v: 2, n: 7 } })
    em('S1', { v: 1, n: 7 }, NAY + 100) // dưới 400 ms
    em('S2', { v: 3, n: 7 }); em('LA', { v: 1, n: 7 }); em('S2', { mo: true, n: 9 })
    expect(tin.gv).toHaveLength(1)
    expect(tin.hs).toEqual([])
    em('S1', { v: 1, n: 7 }, NAY + 500)
    expect(tin.gv).toHaveLength(2)
  })
})

describe('«Hiểu chưa?» — máy em', () => {
  beforeEach(() => { vi.useFakeTimers() })
  it('thầy mở ⇒ hai phím 1 · 2; em chạm ⇒ gửi thầy và TỰ ẨN NGAY, thoáng «Đã gửi thầy»; nhắc lại cùng lượt không hiện lại', () => {
    const { kenh, gui, phat } = kenhGia()
    render(<HoiHieuEm kenh={kenh} />)
    expect(document.querySelector('.hh-em')).toBeNull()
    phat('S9', 'Bạn khác', { mo: true, n: 5 }) // không phải thầy ⇒ bỏ
    expect(document.querySelector('.hh-the')).toBeNull()
    phat('gv', '', { mo: true, n: 5 })
    const nut = [...document.querySelectorAll('.hh-nut')]
    expect(nut.map((n) => n.textContent)).toEqual(['1Hiểu', '2Chưa hiểu'])
    fireEvent.click(nut[1])
    expect(gui).toEqual([['hieu', { v: 2, n: 5 }]])
    expect(document.querySelector('.hh-the')).toBeNull()
    expect(document.querySelector('.hh-da')!.textContent).toBe('✓Đã gửi thầy')
    act(() => { vi.advanceTimersByTime(1200) })
    expect(document.querySelector('.hh-em')).toBeNull()
    phat('gv', '', { mo: true, n: 5 })
    expect(document.querySelector('.hh-the')).toBeNull()
    phat('gv', '', { mo: true, n: 6 }) // thầy hỏi lượt mới
    expect(document.querySelector('.hh-the')).not.toBeNull()
  })
  it('bàn phím: 1 = hiểu, 2 = chưa hiểu (đang gõ tin nhắn thì không ăn phím); thầy đóng / im 13 giây ⇒ tự cất', () => {
    const { kenh, gui, phat } = kenhGia()
    render(<><input data-testid="o" /><HoiHieuEm kenh={kenh} /></>)
    phat('gv', '', { mo: true, n: 1 })
    fireEvent.keyDown(document.querySelector('input')!, { key: '1' })
    expect(gui).toEqual([])
    fireEvent.keyDown(window, { key: '1' })
    expect(gui).toEqual([['hieu', { v: 1, n: 1 }]])
    phat('gv', '', { mo: true, n: 2 })
    phat('gv', '', { mo: false, n: 2 })
    expect(document.querySelector('.hh-the')).toBeNull()
    phat('gv', '', { mo: true, n: 3 })
    act(() => { vi.advanceTimersByTime(HET_HAN_MS + 50) })
    expect(document.querySelector('.hh-the')).toBeNull()
  })
})

describe('«Hiểu chưa?» — máy thầy', () => {
  it('dựng = mở câu hỏi; mỗi em một đốm + số đếm; tên em chưa hiểu; em đổi ý tính theo câu mới nhất; gỡ = đóng', () => {
    const { kenh, gui, phat } = kenhGia()
    const r = render(<HoiHieuThay kenh={kenh} tong={4} />)
    const n = (gui[0][1] as { n: number }).n
    expect(gui[0]).toEqual(['hieu', { mo: true, n }])
    phat('S1', 'Minh Anh', { v: 1, n }); phat('S2', 'Gia Bảo', { v: 2, n }); phat('S3', 'Thu Hà', { v: 1, n })
    phat('S4', 'Lạc Lượt', { v: 2, n: n + 1 }) // lượt khác ⇒ bỏ
    phat('gv', '', { mo: true, n })
    const so = () => [...document.querySelectorAll('.hh-so')].map((e) => e.textContent)
    expect(so()).toEqual(['2', '1'])
    expect(document.querySelectorAll('.hh-dom.a')).toHaveLength(2)
    expect(document.querySelectorAll('.hh-dom.b')).toHaveLength(1)
    expect([...document.querySelectorAll('.hh-ten span')].map((e) => e.textContent)).toEqual(['Gia Bảo'])
    expect(document.querySelector('.hh-vong p')!.textContent).toBe('3/4 em đã trả lời · 67 % hiểu')
    phat('S2', 'Gia Bảo', { v: 1, n })
    expect(so()).toEqual(['3', '0'])
    expect(document.querySelector('.hh-lop')!.parentElement).toBe(document.body)
    r.unmount()
    expect(gui.at(-1)).toEqual(['hieu', { mo: false, n }])
  })
})

describe('«Hiểu chưa?» — gói tin, chỗ đốm, phím /', () => {
  it('đọc gói: sai dạng ⇒ null', () => {
    expect(docHoi({ mo: true, n: 3 })).toEqual({ mo: true, n: 3 })
    for (const x of [null, 1, {}, { mo: 1, n: 1 }, { mo: true }]) expect(docHoi(x)).toBeNull()
    expect(docTraLoi({ v: 2, n: 3 })).toEqual({ v: 2, n: 3 })
    for (const x of [null, { v: 3, n: 1 }, { v: '1', n: 1 }, { v: 1 }]) expect(docTraLoi(x)).toBeNull()
  })
  it('đốm nằm gọn trong nửa của mình, không chồng tâm; số giả-ngẫu-nhiên ổn định theo số báo danh', () => {
    for (let i = 0; i < 70; i += 1) { const a = choDom('a', i), b = choDom('b', i); expect(a.x).toBeGreaterThan(6); expect(a.x).toBeLessThan(48); expect(b.x).toBeGreaterThan(52); expect(b.x).toBeLessThan(94); expect(a.y).toBeGreaterThan(38); expect(a.y).toBeLessThan(70) }
    expect(choDom('a', 0)).not.toEqual(choDom('a', 1))
    expect(bam01('S1')).toBe(bam01('S1'))
    expect(bam01('S1')).not.toBe(bam01('S2'))
  })
  it('tờ chiếu: phím / chỉ ở buổi live theo khối, đang gõ chữ thì bỏ; app: / mở – đóng, máy em nạp lười', () => {
    expect(JS_LIVE_MT).toContain("if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey || e.repeat || !(LV.tt && LV.tt.khoi) || (t && t.closest && t.closest('input,textarea,select,[contenteditable]'))) return;")
    expect(JS_LIVE_MT).toContain("lvGui('lk', { v: 'hieu' });")
    expect(() => new Function('LV', 'lvGui', 'dichApp', 'window', 'document', JS_LIVE_MT)).not.toThrow()
    const lop = doc('src/components/live-khoi/LopNoiThay.tsx'), em = doc('src/components/live-khoi/LopNoiEm.tsx')
    expect(lop).toContain("else if (v === 'hieu') setHieu((c) => !c);")
    expect(lop).toContain("lenhTo.current(e.key === '/' ? 'hieu' :")
    expect(lop).toContain("const HoiHieuThay = lazy(() => import('./HoiHieuThay'))")
    expect(em).toContain('{!cho ? <HoiHieuEm kenh={kenh} /> : null}')
    expect(doc('src/components/live-khoi/hoi-hieu.css')).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })
})
