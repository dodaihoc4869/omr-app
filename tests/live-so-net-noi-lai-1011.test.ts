// @vitest-environment node
// LIVE BẢNG — SỔ NÉT của phòng + bắt kịp (đặc tả mục 4.3, 5): phòng đánh số, chuyển nguyên khung, lưu gom; em vào muộn / nối lại nhận đúng phần thiếu;
// xoá hết / bảng mới dọn sổ; phòng ngủ rồi thức lại vẫn còn sổ; chỉ máy THẦY gửi được khung; khung > 16 KB bị từ chối; sổ quá dài ⇒ xin ảnh trạng thái.
// Kèm bộ rút gọn phía máy em (src/lib/live/so-net.ts): áp mục ⇒ đúng sự kiện của bộ máy bút.
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { taoLoiBut, type NetBut, type SuKienBut } from '../src/lib/but-bang-loi'
import { KHUNG_TOI_DA, docStt } from '../src/lib/bpu/phong-live'
import { giaiSo, maBangMoi, maHoanTac, maNetXong, maXoaHet, maXoaNet, type MucSo } from '../src/lib/live/ma-net'
import { apMuc, datLai, taoBang } from '../src/lib/live/so-net'
import { KHUNG_MOI_MANH, SO_MEM } from '../server/src/phong-live'
import { chu, datWebSocketPairGia, nhiPhan, taoPhongGia, viewCuoi, type WsGia } from './_live-phong-gia'

const loi = taoLoiBut()
const net = (id: string, n = 6): NetBut => ({ id, cong: 'but', mau: 'rgb(244,239,228)', co: 2.3, diem: Array.from({ length: n }, (_, i) => loi.diem(10 + i * 9, 20 + i * 4, 0.5, i * 8, 1000, 500)) })
const k1 = (n: NetBut, vt?: number) => maNetXong(n, vt)[0]!
/** Bảng mà một máy em dựng được từ MỌI tin đã nhận (theo đúng thứ tự): `live-so lamLai` ⇒ làm lại; khung sổ nét ⇒ áp. */
function bangCua(ws: WsGia) {
  const b = taoBang(), ds: NetBut[] = []
  for (const t of ws.tin) {
    if (typeof t === 'string') { const m = JSON.parse(t) as { t?: string; lamLai?: boolean }; if (m.t === 'live-so' && m.lamLai) loi.apSuKien(ds, datLai(b)) ; continue }
    const m = giaiSo(t)
    if (m) for (const sk of apMuc(b, m)) loi.apSuKien(ds, sk)
  }
  return { b, ds }
}

describe('sổ nét của phòng', () => {
  beforeAll(datWebSocketPairGia)
  beforeEach(() => { vi.useFakeTimers({ now: 1_700_000_000_000 }) })
  afterEach(() => { vi.useRealTimers() })

  it('phòng đánh số thứ tự, chuyển NGUYÊN khung tới mọi máy em (cả khi chưa bật live), không phát view; máy thầy không nhận lại', async () => {
    const ph = taoPhongGia()
    await ph.khoi([{ sbd: 'S1' }, { sbd: 'S2' }])
    const gv = await ph.noi('gv'), e1 = await ph.noi('hs', 'S1'), e2 = await ph.noi('hs', 'S2')
    await ph.gui(gv, { t: 'chao' })
    const truocGv = gv.tin.length, a = net('a'), b = net('b')
    await ph.guiNp(gv, maBangMoi('3', 1.9512))
    await ph.guiNp(gv, k1(a)); await ph.guiNp(gv, k1(b))
    for (const w of [e1, e2]) {
      expect(w.tin.every((t) => typeof t !== 'string')).toBe(true) // chỉ khung nhị phân, không view
      expect(nhiPhan(w).map(docStt)).toEqual([1, 2, 3])
      const { b: bang, ds } = bangCua(w)
      expect(bang).toMatchObject({ trang: '3', tiLe: 1.9512, cuoi: 3 })
      expect(ds).toEqual([a, b])
    }
    // Khung tới máy em chỉ khác khung thầy gửi ở 4 byte số thứ tự.
    const gui = k1(b), nhan = nhiPhan(e1)[2]!
    expect([...nhan.subarray(5)]).toEqual([...gui.subarray(5)])
    expect(gv.tin.length).toBe(truocGv)
    await ph.gui(gv, { t: 'live-bat' })
    expect(viewCuoi(e1).live).toMatchObject({ bat: true, soNet: 3 })
  })
  it('em VÀO MUỘN nhận cả sổ; em NỐI LẠI với số thứ tự cũ chỉ nhận phần thiếu; `chao` kèm `net` cũng được bù', async () => {
    const ph = taoPhongGia()
    await ph.khoi([{ sbd: 'S1' }, { sbd: 'S2' }, { sbd: 'S3' }])
    const gv = await ph.noi('gv'), e1 = await ph.noi('hs', 'S1')
    await ph.gui(gv, { t: 'live-bat' })
    const ds = ['a', 'b', 'c', 'd', 'e'].map((x) => net(x))
    for (const n of ds.slice(0, 3)) await ph.guiNp(gv, k1(n))
    // S1 rớt mạng sau mục 3; thầy viết tiếp 4, 5, rồi xoá «b».
    await ph.dong(e1)
    for (const n of ds.slice(3)) await ph.guiNp(gv, k1(n))
    await ph.guiNp(gv, maXoaNet('b')[0]!)
    const e1b = await ph.noi('hs', 'S1')
    await ph.gui(e1b, { t: 'live-bu', net: 3 })
    expect(chu(e1b).filter((m) => m.t === 'live-so')).toEqual([{ t: 'live-so', lamLai: false, soNet: 6, muc: 3 }])
    expect(nhiPhan(e1b).map(docStt)).toEqual([4, 5, 6])
    // Bảng của S1 = phần đã có (1..3) + phần bù.
    const b1 = taoBang(), ds1: NetBut[] = []
    for (const k of [...nhiPhan(e1), ...nhiPhan(e1b)]) for (const sk of apMuc(b1, giaiSo(k)!)) loi.apSuKien(ds1, sk)
    expect(ds1.map((x) => x.id)).toEqual(['a', 'c', 'd', 'e'])
    // S2 vào muộn (chưa có gì): nhận cả sổ.
    const e2 = await ph.noi('hs', 'S2')
    await ph.gui(e2, { t: 'live-bu', net: 0 })
    expect(chu(e2).filter((m) => m.t === 'live-so')).toEqual([{ t: 'live-so', lamLai: false, soNet: 6, muc: 6 }])
    expect(bangCua(e2).ds).toEqual(ds1)
    // S3 dùng `chao` kèm `net`: view trước, rồi tin live-so + khung bù.
    const e3 = await ph.noi('hs', 'S3')
    await ph.gui(e3, { t: 'chao', net: 5 })
    expect(e3.tin.map((t) => (typeof t === 'string' ? (JSON.parse(t) as { t: string }).t : docStt(t)))).toEqual(['em', 'live-so', 6])
    // Đã đủ ⇒ không gửi khung nào.
    await ph.gui(e3, { t: 'live-bu', net: 6 })
    expect(chu(e3).filter((m) => m.t === 'live-so').pop()).toEqual({ t: 'live-so', lamLai: false, soNet: 6, muc: 0 })
  })
  it('xoá hết / bảng mới DỌN sổ; em cầm số thứ tự của phần đã dọn (hoặc số lạ) ⇒ `lamLai` + cả sổ mới', async () => {
    const ph = taoPhongGia()
    await ph.khoi([{ sbd: 'S1' }, { sbd: 'S2' }])
    const gv = await ph.noi('gv'), e1 = await ph.noi('hs', 'S1')
    for (const x of ['a', 'b', 'c']) await ph.guiNp(gv, k1(net(x)))
    await ph.guiNp(gv, maXoaHet()) // stt 4
    await ph.guiNp(gv, k1(net('d'))) // stt 5
    await ph.gui(e1, { t: 'live-bu', net: 2 })
    expect(chu(e1).filter((m) => m.t === 'live-so').pop()).toEqual({ t: 'live-so', lamLai: true, soNet: 5, muc: 2 })
    expect(bangCua(e1).ds.map((x) => x.id)).toEqual(['d'])
    await ph.guiNp(gv, maBangMoi('cau-2', 1.5)) // stt 6: sổ chỉ còn mục này
    await ph.guiNp(gv, k1(net('e')))
    const e2 = await ph.noi('hs', 'S2')
    await ph.gui(e2, { t: 'live-bu', net: 999 }) // số của buổi khác / phòng đã khởi động lại
    expect(chu(e2).filter((m) => m.t === 'live-so')).toEqual([{ t: 'live-so', lamLai: true, soNet: 7, muc: 2 }])
    expect(bangCua(e2)).toMatchObject({ b: { trang: 'cau-2', tiLe: 1.5, cuoi: 7 }, ds: [net('e')] })
    // Em đang cầm đúng mục ngay trước đầu sổ (5) ⇒ bù thường, không làm lại.
    await ph.gui(e1, { t: 'live-bu', net: 5 })
    expect(chu(e1).filter((m) => m.t === 'live-so').pop()).toEqual({ t: 'live-so', lamLai: false, soNet: 7, muc: 2 })
  })
  it('sổ ghi storage GOM (không theo từng khung); phòng ngủ rồi thức lại vẫn còn sổ, số thứ tự đi tiếp; sổ nhiều mảnh', async () => {
    const ph = taoPhongGia()
    await ph.khoi([{ sbd: 'S1' }])
    const gv = await ph.noi('gv')
    const ghi0 = ph.kho.ghi
    const N = KHUNG_MOI_MANH * 2 + 5
    for (let i = 0; i < N; i++) await ph.guiNp(gv, k1(net(`n${i}`)))
    expect(ph.kho.ghi).toBe(ghi0) // chưa ghi gì trong lúc khung đang chảy
    await vi.advanceTimersByTimeAsync(1100)
    expect(ph.kho.ghi - ghi0).toBe(3 + 1) // 3 mảnh + mục lục
    expect((ph.kho.du.get('sn:n') as { khung: number; soNet: number })).toEqual({ khung: N, soNet: N })
    await ph.guiNp(gv, k1(net('them')))
    await vi.advanceTimersByTimeAsync(1100)
    expect(ph.kho.ghi - ghi0).toBe(4 + 2) // chỉ ghi lại mảnh cuối + mục lục
    // Phòng ngủ đông: đối tượng mới trên cùng storage + cùng kết nối.
    const ph2 = taoPhongGia({ kho: ph.kho, dsWs: ph.dsWs })
    const e1 = await ph2.noi('hs', 'S1')
    await ph2.gui(e1, { t: 'live-bu', net: 0 })
    expect(bangCua(e1).ds.length).toBe(N + 1)
    await ph2.guiNp(gv, k1(net('sau-ngu')))
    expect(docStt(nhiPhan(e1).pop()!)).toBe(N + 2)
    // Dọn sổ ⇒ mảnh thừa bị xoá khỏi storage.
    await ph2.guiNp(gv, maXoaHet())
    await vi.advanceTimersByTimeAsync(1100)
    expect([...ph.kho.du.keys()].filter((k) => /^sn:\d+$/.test(k))).toEqual(['sn:0'])
    expect((ph.kho.du.get('sn:n') as { khung: number }).khung).toBe(1)
  })
  it('AN TOÀN: chỉ máy THẦY gửi được khung; khung > 16 KB, khung lạ, khung cụt bị bỏ', async () => {
    const ph = taoPhongGia()
    await ph.khoi([{ sbd: 'S1' }, { sbd: 'S2' }])
    const gv = await ph.noi('gv'), e1 = await ph.noi('hs', 'S1'), e2 = await ph.noi('hs', 'S2')
    await ph.gui(gv, { t: 'live-bat' })
    await ph.gui(e2, { t: 'live-ok', dc: false })
    const truoc = e2.tin.length
    await ph.guiNp(e1, k1(net('em-ve-bay')))
    await ph.guiNp(e1, maXoaHet())
    await ph.guiNp(e1, new Uint8Array([0x21, 1, 0, 0, 0, 0, 0, 9, 9]))
    const to = new Uint8Array(KHUNG_TOI_DA + 1); to[0] = 0x11
    await ph.guiNp(gv, to)
    await ph.guiNp(gv, new Uint8Array([0x77, 0, 0, 0, 0, 1]))
    await ph.guiNp(gv, new Uint8Array([0x13, 0]))
    expect(e2.tin.length).toBe(truoc)
    expect(viewCuoi(e2).live.soNet).toBe(0)
    await ph.guiNp(gv, k1(net('that')))
    expect(nhiPhan(e2).map(docStt)).toEqual([1])
  })
  it('sổ quá dài ⇒ phòng xin máy thầy ẢNH TRẠNG THÁI một lần; ảnh (bảng mới + các nét) làm sổ gọn lại', async () => {
    const ph = taoPhongGia()
    await ph.khoi([{ sbd: 'S1' }])
    const gv = await ph.noi('gv')
    const mot = k1(net('x', 2))
    for (let i = 0; i <= SO_MEM.muc + 3; i++) await ph.guiNp(gv, mot)
    expect(chu(gv).filter((m) => m.t === 'live-can-anh').length).toBe(1)
    await ph.guiNp(gv, maBangMoi('1', 1.6)); await ph.guiNp(gv, k1(net('con-lai')))
    const e1 = await ph.noi('hs', 'S1')
    await ph.gui(e1, { t: 'live-bu', net: 0 })
    expect(chu(e1).filter((m) => m.t === 'live-so')).toEqual([{ t: 'live-so', lamLai: true, soNet: SO_MEM.muc + 6, muc: 2 }])
  })
})

describe('bộ rút gọn sổ nét phía máy em ⇒ sự kiện của bộ máy bút', () => {
  const m = (stt: number, k: Uint8Array): MucSo => ({ ...giaiSo(k)!, stt })
  const ap = (ds: MucSo[]) => { const b = taoBang(), net: NetBut[] = [], sk: SuKienBut[] = []; for (const x of ds) for (const s of apMuc(b, x)) { sk.push(s); loi.apSuKien(net, s) } return { b, net, sk } }
  it('nét xong ⇒ net-moi (xong, đúng vị trí); trùng id ⇒ thay tại chỗ; mục cũ / trùng số thứ tự bị bỏ', () => {
    const a = net('a'), b = net('b'), c = net('c'), a2 = { ...net('a', 9), co: 5 }
    const r = ap([m(1, k1(a)), m(2, k1(b)), m(2, k1(c)), m(1, k1(c)), m(3, k1(c, 0)), m(4, k1(a2))])
    expect(r.net).toEqual([c, a2, b])
    expect(r.sk.map((s) => s.loai)).toEqual(['net-moi', 'net-moi', 'net-moi', 'xoa', 'net-moi'])
    expect(r.sk[2]).toMatchObject({ loai: 'net-moi', vt: 0, xong: true })
    expect(r.b.cuoi).toBe(4)
  })
  it('xoá nhiều nét; hoàn tác trả nét về ĐÚNG chỗ cũ; hoàn tác thêm nét ⇒ bỏ nét', () => {
    const [a, b, c, d] = ['a', 'b', 'c', 'd'].map((x) => net(x))
    const r = ap([m(1, k1(a!)), m(2, k1(b!)), m(3, k1(c!)), m(4, k1(d!)), m(5, maXoaNet(['b', 'd'])[0]!)])
    expect(r.net.map((x) => x.id)).toEqual(['a', 'c'])
    const r2 = ap([m(1, k1(a!)), m(2, k1(b!)), m(3, k1(c!)), m(4, k1(d!)), m(5, maXoaNet(['b', 'd'])[0]!), m(6, maHoanTac())])
    expect(r2.net).toEqual([a, b, c, d])
    const r3 = ap([m(1, k1(a!)), m(2, k1(b!)), m(3, maHoanTac()), m(4, maHoanTac()), m(5, maHoanTac())])
    expect(r3.net).toEqual([])
  })
  it('nét nhiều khung chỉ vào bảng khi đủ; thiếu phần giữa ⇒ bỏ (chờ ảnh trạng thái), không vẽ nửa nét', () => {
    const dai = net('dai', 4000), khung = maNetXong(dai)
    expect(khung.length).toBeGreaterThan(1)
    const b = taoBang()
    for (let i = 0; i < khung.length - 1; i++) expect(apMuc(b, m(i + 1, khung[i]!))).toEqual([])
    const sk = apMuc(b, m(khung.length, khung[khung.length - 1]!))
    expect(sk.length).toBe(1)
    expect(b.net).toEqual([dai])
    const b2 = taoBang()
    apMuc(b2, m(1, khung[0]!))
    expect(apMuc(b2, m(3, khung[khung.length - 1]!)).length).toBe(khung.length === 2 ? 1 : 0)
  })
})
