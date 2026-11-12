// @vitest-environment node
// MÁY TÍNH FX4869 — đồng bộ thầy → em: phòng chỉ chuyển tiếp tin của THẦY; máy em lọc sạch gói tin; cây vẽ biểu thức; nút trên tờ; chốt trong mã.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { KenhLopMay } from '../server/src/kenh-lop-may'
import { liveDat } from '../src/lib/bpu/phong-live'
import { taoPhong, vaoLop } from '../src/lib/bpu/phong'
import { cayBt } from '../src/components/may-tinh/cay-bt'
import { docTin } from '../src/components/may-tinh/dong-bo'
import { bam, manHinh, taoMay } from '../src/lib/may-tinh/may'
import { CSS_LIVE_MT, JS_LIVE_MT } from '../src/lib/live-mt-to-chieu'

const NAY = 1_700_000_000_000
const doc = (p: string) => readFileSync(p, 'utf8')
interface Ws { tin: string[]; send(d: string): void }
const taoWs = (): Ws => ({ tin: [], send(d) { this.tin.push(d) } })
function kenhGia() {
  const st = taoPhong({ buoiId: 'b', lop: '12A', nay: NAY, ds: [{ sbd: 'S1', ten: 'Minh Anh', coMat: true, luc: 1 }, { sbd: 'S2', ten: 'Bảo', coMat: false }] })
  vaoLop(st, 'S1', NAY)
  st.live = { cho: true, sfu: false, san: false, bat: false, tu: null, phien: 0, ss: null, tay: [], noi: [], xa: false, tiengLop: true, soNet: 0, nhip: 0 }
  liveDat(st, { khoi: { k: 12, gd: 'dang', che: 'hoc' } }, NAY)
  const hs = taoWs(), gv = taoWs()
  const k = new KenhLopMay({ getWebSockets: (tag?: string) => (tag === 'gv' ? [gv] : [hs]) } as never, () => st)
  return { hs, gv, em: (s: string, j: unknown) => k.tin(hs as never, { v: 'hs', s } as never, j as never, st, NAY), thay: (j: unknown) => k.tin(gv as never, { v: 'gv', s: '' } as never, j as never, st, NAY) }
}

describe('máy tính — phòng chuyển tiếp', () => {
  it('tin của thầy tới mọi máy em, đóng dấu «gv», không dội lại máy thầy', () => {
    const { hs, gv, thay } = kenhGia()
    expect(thay({ t: 'lop', k: 'mt', x: { mo: true, x: 0.5, y: 0.5, w: 0.3, mh: manHinh(taoMay()) } })).toBe(true)
    expect(hs.tin).toHaveLength(1)
    expect(JSON.parse(hs.tin[0])).toMatchObject({ t: 'lop', k: 'mt', s: 'gv', x: { mo: true, x: 0.5 } })
    expect(gv.tin).toHaveLength(0)
  })
  it('em KHÔNG gửi được tin máy tính (kể cả em đã vào lớp); gói quá lớn bị bỏ', () => {
    const { hs, em, thay } = kenhGia()
    expect(em('S1', { t: 'lop', k: 'mt', x: { mo: true } })).toBe(true)
    expect(em('S2', { t: 'lop', k: 'mt', x: { mo: true } })).toBe(true)
    expect(hs.tin).toHaveLength(0)
    thay({ t: 'lop', k: 'mt', x: { mo: true, rac: 'x'.repeat(9000) } })
    expect(hs.tin).toHaveLength(0)
  })
})

describe('máy tính — máy em đọc gói tin', () => {
  const mh = manHinh('1 chia 3 bang'.split(' ').reduce(bam, taoMay()))
  it('gói đúng ⇒ giữ nguyên màn hình; đóng ⇒ { mo: false }', () => {
    const d = docTin(JSON.parse(JSON.stringify({ mo: true, x: 0.7, y: 0.4, w: 0.3, mh, p: 'bang', n: 5 })))
    expect(d).toMatchObject({ mo: true, x: 0.7, y: 0.4, w: 0.3, p: 'bang', n: 5 })
    expect(d?.mh).toEqual(mh)
    expect(docTin({ mo: false })).toEqual({ mo: false })
  })
  it('gói hỏng / lạ ⇒ bỏ hoặc kẹp về khoảng an toàn (không ném lỗi)', () => {
    for (const x of [null, 1, 'a', {}, { mo: true }, { mo: true, mh: 3 }, { mo: 'co' }]) expect(docTin(x)).toBeNull()
    const d = docTin({ mo: true, x: 99, y: -5, w: 'to', mh: { den: 'D', bt: [1, 'x'.repeat(50)], ct: 1e9, kq: { kieu: 'so', chu: 'y'.repeat(500) }, loi: 'gi-do', ds: [{}] } })
    expect(d).toMatchObject({ x: 1, y: 0, w: 0.25 })
    expect(d?.mh).toMatchObject({ den: [], bt: ['', 'xxxxxx'], ct: 200, loi: '', kieu: 'tinh', ds: [''] })
    expect(d?.mh?.kq).toEqual({ kieu: 'so', chu: 'y'.repeat(60) })
  })
})

describe('máy tính — cây vẽ biểu thức', () => {
  const gon = (bt: string[], ct = -1) => JSON.stringify(cayBt(bt, ct))
  it('phân số, căn, số mũ lồng nhau; con trỏ nằm đúng ô', () => {
    const c = cayBt(['ps{', '1', '|', 'can{', '2', '}', '}', '+', '3', 'mu{', '2', '}'], 2)
    expect(c).toHaveLength(4)
    expect(c[0]).toMatchObject({ k: 'n', loai: 'ps{' })
    const ps = c[0] as { o: unknown[][] }
    expect(ps.o[0]).toEqual([{ k: 'c', c: '1' }, { k: 'tro' }]) // con trỏ cuối tử số
    expect(ps.o[1]).toEqual([{ k: 'n', loai: 'can{', o: [[{ k: 'c', c: '2' }]] }])
    expect(c[3]).toMatchObject({ k: 'n', loai: 'mu{' })
  })
  it('×10ⁿ: dấu và chữ số liền sau thành số mũ; con trỏ ở cuối dãy', () => {
    const c = cayBt(['6', ',', '0', '2', 'e10', 'neg', '2', '3', '×', '2'], 10)
    expect(c[4]).toEqual({ k: 'n', loai: 'e10', o: [[{ k: 'c', c: '−' }, { k: 'c', c: '2' }, { k: 'c', c: '3' }]] })
    expect(c.at(-1)).toEqual({ k: 'tro' })
  })
  it('dãy lệch nhóm (tin mạng hỏng) không treo, không ném lỗi', () => {
    expect(() => gon(['}', '|', '1', 'ps{', '2'])).not.toThrow()
    expect(gon(['}', '1'])).toContain('"c":"1"')
  })
})

describe('máy tính — nút trên tờ và chốt trong mã', () => {
  it('JS của nút là ES5 chạy được, chỉ dựng nút ở buổi live theo khối, bấm ⇒ việc lk v = mt', () => {
    expect(() => new Function('LV', 'lvGui', 'dichApp', 'window', 'document', JS_LIVE_MT)).not.toThrow()
    expect(JS_LIVE_MT).not.toMatch(/=>|\bconst\b|\blet\b|`/)
    expect(JS_LIVE_MT).toContain("if (!(LV.tt && LV.tt.khoi)) return null;")
    expect(JS_LIVE_MT).toContain("lvGui('lk', { v: 'mt' })")
    expect(JS_LIVE_MT).toContain("truoc = document.getElementById('mc-nop') || t;")
    expect(CSS_LIVE_MT).not.toMatch(/#[0-9a-f]{3,8}\b/i)
    expect(CSS_LIVE_MT).not.toContain('flex-wrap')
    const khoi = doc('src/lib/live-khoi-to-chieu.ts')
    expect(khoi).toContain('${JS_LIVE_NOP}${JS_LIVE_MT}`')
    expect(khoi).toContain('${CSS_LIVE_MT}`')
  })
  it('máy thầy: nút trên tờ bật / tắt, tạm cất ở bảng danh sách / bảng chọn, Esc giữ nghĩa lùi một màn; nạp lười', () => {
    const lop = doc('src/components/live-khoi/LopNoiThay.tsx'), noi = doc('src/components/live/thay-noi.ts')
    expect(lop).toContain("const MayTinhThay = lazy(() => import('../may-tinh/MayTinhThay'))")
    expect(lop).toContain("else if (v === 'mt') setMt((c) => !c)")
    expect(lop).toContain('const mtHien = mt && dang && !sanh && !chon\n')
    expect(lop).not.toContain('if (mtHien) { setMt(false)')
    expect(noi).toContain("guiTo({ lenh: 'live-mt', mo: mtMo })")
    expect(noi).toContain("if (mtMo) guiTo({ lenh: 'live-mt', mo: true })")
  })
  it('máy em: nạp lười, chỉ xem (không bắt chạm), chỉ nghe tin của thầy', () => {
    const em = doc('src/components/live-khoi/LopNoiEm.tsx'), may = doc('src/components/may-tinh/MayTinhEm.tsx'), css = doc('src/components/may-tinh/may-tinh.css')
    expect(em).toContain("const MayTinhEm = lazy(() => import('../may-tinh/MayTinhEm'))")
    expect(may).toContain("if (!d || t.s !== 'gv') return")
    expect(may).not.toContain('onPhim')
    expect(css).toContain('.mtx-lop-em { position: absolute; inset: 0; z-index: 34; pointer-events: none !important; overflow: hidden; }')
    expect(css).toContain('.mtx[data-xem] { pointer-events: none; }')
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })
  it('tên máy: «Đỗ Đại Học FX4869», không dùng tên hãng máy tính nào', () => {
    const mat = doc('src/components/may-tinh/MatMay.tsx')
    expect(mat).toContain('Đỗ Đại Học <em>FX4869</em>')
    for (const t of ['src/components/may-tinh/MatMay.tsx', 'src/components/may-tinh/may-tinh.css', 'src/lib/may-tinh/may.ts', 'src/lib/live-mt-to-chieu.ts']) expect(doc(t).toLowerCase()).not.toContain('casio')
  })
})
