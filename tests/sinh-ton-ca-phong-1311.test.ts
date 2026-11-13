// @vitest-environment node
// TRÒ «SINH TỒN» Ở PHÒNG CHỜ CA KIỂM TRA (thầy 13/11: «Chuyển luôn game này sang cả phòng chờ của ca kiểm tra») — phòng của ca (server/src/sinh-ton-ca.ts,
// luật thuần) + Durable Object `PhongDauIon` (vé, công tắc, lệnh `/dong` của phòng chờ ca) + máy trò dùng chung (sinh-ton-may-chu.ts).
// Khoá: vào bằng vé ⇒ đội ít em thật nhất; cùng số báo danh ở máy khác ⇒ kết nối cũ đóng 4002; em thứ 79 ⇒ 4009 «sang:1»; nhịp 250 ms phát đúng MỘT ảnh
// `{ t: 'lop', k: 'tro' }` có máy bù đủ 4 mỗi đội; em rời ⇒ `st-ds` mới + máy bù lại; thầy bắt đầu ⇒ `{ t: 'dong' }` + đóng 4000; hết em thật ⇒ phòng được
// ngủ; phòng thức dậy dựng lại đúng đội; máy còn mảnh trò Đấu Nguyên Tử cũ (đã xoá 13/11) bị đóng 4010; 0 lệnh D1 (phòng không có D1).
import { describe, expect, it, vi } from 'vitest'
import { PhongDauIon } from '../server/src/phong-dau-ion'
import { kyVeDau } from '../server/src/dau-ion-ve'
import { CHU_BAN_CU_ST, CHU_TRO_CU, MA_DONG, PhongSinhTonCa, TRAN_KET_NOI, type KemSinhTon, type KetNoi } from '../server/src/sinh-ton-ca'
import { MaySinhTon, TRO_NHIP_MS } from '../server/src/sinh-ton-may-chu'
import { PHIEN_BAN_ST, type SinhTonAnh, type SinhTonGui } from '../src/lib/live-khoi/kieu'
import { VAN_MS } from '../src/lib/live-khoi/sinh-ton-loi'
import type { DurableObjectState, Env, WsMayChu } from '../server/src/kieu'

interface KnGia extends KetNoi { tin: Record<string, unknown>[]; dongMa: number | null; dongLy: string; kem: unknown }
function kn(): KnGia {
  const k: KnGia = {
    tin: [], dongMa: null, dongLy: '', kem: null,
    gui(d) { if (typeof d === 'string') k.tin.push(JSON.parse(d)) },
    dong(ma, ly) { k.dongMa = ma; k.dongLy = ly },
    ghiKem(v) { k.kem = v },
  }
  return k
}
// Giây thứ 10 của một ván (không rơi vào 5 giây bảng kết quả, không sát mép ván).
const T0 = Math.ceil(Date.UTC(2026, 10, 13, 12, 0, 0) / VAN_MS) * VAN_MS + 10_000
const ve = (s: string, t = `Bạn ${s}`) => ({ c: '123456', s, t, h: T0 + 3_600_000 })
const cuoi = (k: KnGia, t: string) => [...k.tin].reverse().find((m) => m.t === t)
const dem = (k: KnGia, t: string) => k.tin.filter((m) => m.t === t).length
const goi = (x: SinhTonGui) => JSON.stringify({ t: 'st', x })
type Dong = [string, string, number]
function phong(soPhong = 0) {
  let nay = T0
  const p = new PhongSinhTonCa(() => nay, () => 0.5, soPhong)
  return { p, tien: (ms: number) => { nay += ms } }
}
const vao = (p: PhongSinhTonCa, s: string, t?: string) => { const k = kn(); p.vao(k, ve(s, t)); return k }
const doiCua = (k: KnGia) => (cuoi(k, 'st-vao')!.toi as Dong)[2]
const anh = (k: KnGia) => cuoi(k, 'lop')!.x as SinhTonAnh

describe('Phòng Sinh Tồn của ca — vào bằng vé, chia bốn đội', () => {
  it('em vào ⇒ đội ít em thật nhất (bằng nhau ⇒ đội số nhỏ); riêng em nhận `st-vao`, cả phòng nhận `st-ds`; dữ liệu gắn kết nối đủ để dựng lại', () => {
    const { p } = phong()
    const ks = ['1', '2', '3', '4', '5', '6'].map((s) => vao(p, s))
    expect(ks.map(doiCua)).toEqual([0, 1, 2, 3, 0, 1])
    expect(cuoi(ks[0], 'st-vao')).toEqual({ t: 'st-vao', toi: ['1', 'Bạn 1', 0], ds: [['1', 'Bạn 1', 0]] })
    expect(ks[5].kem).toEqual({ st: 1, s: '6', t: 'Bạn 6', doi: 1 })
    // Mỗi lượt vào, MỌI máy đang ở phòng nhận danh sách mới.
    expect(dem(ks[0], 'st-ds')).toBe(6)
    expect((cuoi(ks[0], 'st-ds')!.ds as Dong[]).map((d) => d[0])).toEqual(['1', '2', '3', '4', '5', '6'])
    expect(p.soNguoi).toBe(6)
    // Tên gọi cắt 16 ký tự.
    expect((cuoi(vao(p, '7', 'Một cái tên dài quá mười sáu ký tự'), 'st-vao')!.toi as Dong)[1]).toHaveLength(16)
  })
  it('em rời rồi em mới vào ⇒ lấp đúng đội vừa hụt', () => {
    const { p } = phong()
    const ks = ['1', '2', '3', '4'].map((s) => vao(p, s))
    p.roi(ks[2])
    expect(doiCua(vao(p, '9'))).toBe(2)
  })
  it('cùng số báo danh mở ở máy khác ⇒ kết nối CŨ đóng 4002, em giữ nguyên đội; kết nối cũ báo rời sau đó KHÔNG gỡ em', () => {
    const { p } = phong()
    vao(p, '1'); const cu = vao(p, '2')
    const moi = kn(); p.vao(moi, ve('2'))
    expect(cu.dongMa).toBe(MA_DONG.thayMay)
    expect(moi.dongMa).toBeNull()
    expect(doiCua(moi)).toBe(1)
    expect(p.soNguoi).toBe(2)
    p.roi(cu)
    expect(p.soNguoi).toBe(2)
    // Gói của kết nối cũ không còn được nhận.
    p.nhan(cu, goi({ p: [100, 100, 100, 1] }))
    expect(p.canThuc()).toBe(false)
  })
  it(`em thứ ${TRAN_KET_NOI + 1} ⇒ đóng 4009 «sang:1» (phòng cuối ⇒ «day»), không vào phòng`, () => {
    const { p } = phong()
    for (let i = 0; i < TRAN_KET_NOI; i++) vao(p, `s${i}`)
    expect(p.soNguoi).toBe(TRAN_KET_NOI)
    const thua = vao(p, 'thua')
    expect(thua.dongMa).toBe(MA_DONG.day); expect(thua.dongLy).toBe('sang:1')
    expect(thua.tin).toHaveLength(0)
    expect(p.soNguoi).toBe(TRAN_KET_NOI)
    // Em đã ở phòng nối lại thì vẫn vào được dù phòng đang đầy.
    expect(vao(p, 's3').dongMa).toBeNull()
    const cuoiCa = phong(7)
    for (let i = 0; i < TRAN_KET_NOI; i++) vao(cuoiCa.p, `s${i}`)
    const k = vao(cuoiCa.p, 'thua')
    expect(k.dongMa).toBe(MA_DONG.day); expect(k.dongLy).toBe('day')
  })
})

describe('Phòng Sinh Tồn của ca — nhịp trò', () => {
  it('nhịp 250 ms phát đúng MỘT ảnh `{ t: "lop", k: "tro" }` cho mỗi máy: em thật đúng đội phòng xếp, máy bù đủ 4 mỗi đội, ghi lượt hạ khác đội', () => {
    const { p, tien } = phong()
    const a = vao(p, 'S1'), b = vao(p, 'S2'), c = vao(p, 'S3')
    expect(p.canThuc()).toBe(false) // chưa em nào gửi gói ⇒ phòng chưa cần nhịp
    p.nhip(); expect(dem(a, 'lop')).toBe(0)
    p.nhan(a, goi({ p: [100.4, 9999, 50, 9], t: 'S2' })) // S2 chưa lên sân ⇒ mục tiêu bị bỏ
    tien(50); p.nhan(a, goi({ p: [200, 200, 50, 1] })) // nhanh hơn 180 ms ⇒ bỏ
    tien(10); p.nhan(b, goi({ p: [300, 300, 0, 2], a: 'S1', t: 'khong-co' }))
    expect(p.canThuc()).toBe(true)
    tien(TRO_NHIP_MS); p.nhip()
    for (const k of [a, b, c]) expect(dem(k, 'lop')).toBe(1)
    const tin = cuoi(a, 'lop')!
    expect(tin).toMatchObject({ t: 'lop', k: 'tro', s: '', n: '', d: -1, l: T0 + 60 + TRO_NHIP_MS })
    const x = anh(a)
    // Toạ độ kẹp trong sân 2000 (cỡ 0 = 3200 × 2000), cấp kẹp về 6; đội do PHÒNG đóng dấu (S1 đội 0, S2 đội 1).
    expect(x.ds.S1).toEqual([100, 2000, 50, 0, 6, ''])
    expect(x.ds.S2).toEqual([300, 300, 0, 1, 2, ''])
    expect(x.ds.S3).toBeUndefined() // S3 mới ở phòng, chưa gửi gói ⇒ chưa lên sân
    expect(x.an).toEqual([['S1', 'S2']]); expect(x.d).toEqual([1, 0, 0, 0]); expect(x.v).toBe(1); expect(x.c).toBe(0)
    expect(Object.keys(x.ds).filter((id) => id.startsWith('~'))).toHaveLength(14)
    expect([0, 1, 2, 3].map((d) => Object.values(x.ds).filter((r) => r[3] === d).length)).toEqual([4, 4, 4, 4])
    // Báo «bị hạ» lặp trong 2,5 giây ⇒ chỉ tính một lượt; lượt hạ của ảnh trước không lặp lại.
    tien(150); p.nhan(b, goi({ p: [300, 300, 0, 1], a: 'S1' }))
    tien(100); p.nhip()
    expect(anh(a).d[0]).toBe(1); expect(anh(a).an).toEqual([])
  })
  it('gói sai dạng / quá dài / không phải `st` ⇒ bỏ, không lên sân', () => {
    const { p } = phong()
    const a = vao(p, 'S1')
    p.nhan(a, 'không phải json'); p.nhan(a, JSON.stringify({ t: 'vao-san' })); p.nhan(a, JSON.stringify({ t: 'st', x: null }))
    p.nhan(a, JSON.stringify({ t: 'st', x: { p: ['a', 1, 1, 1] } })); p.nhan(a, new ArrayBuffer(8))
    p.nhan(a, JSON.stringify({ t: 'st', x: { p: [1, 1, 1, 1], t: 'x'.repeat(400) } }))
    expect(p.canThuc()).toBe(false)
    p.nhan(kn(), goi({ p: [1, 1, 1, 1] })) // kết nối chưa vào bằng vé
    expect(p.canThuc()).toBe(false)
  })
  it('em rời ⇒ cả phòng nhận `st-ds` mới, ảnh kế không còn em đó và máy bù lại đủ 4', () => {
    const { p, tien } = phong()
    const a = vao(p, 'S1'), b = vao(p, 'S2')
    p.nhan(a, goi({ p: [100, 100, 100, 1] })); p.nhan(b, goi({ p: [900, 900, 100, 1] }))
    tien(TRO_NHIP_MS); p.nhip()
    expect(Object.keys(anh(a).ds).filter((id) => id.startsWith('~'))).toHaveLength(14)
    const n = dem(a, 'st-ds')
    p.roi(b)
    expect(dem(a, 'st-ds')).toBe(n + 1)
    expect(cuoi(a, 'st-ds')!.ds).toEqual([['S1', 'Bạn S1', 0]])
    tien(200); p.nhan(a, goi({ p: [100, 100, 100, 1] }))
    tien(50); p.nhip()
    expect(anh(a).ds.S2).toBeUndefined()
    expect(Object.keys(anh(a).ds).filter((id) => id.startsWith('~'))).toHaveLength(15)
    expect([0, 1, 2, 3].map((d) => Object.values(anh(a).ds).filter((r) => r[3] === d).length)).toEqual([4, 4, 4, 4])
  })
  it('không còn em thật (em im quá 5 giây hoặc rời hết) ⇒ `canThuc()` false, nhịp không phát gì; em gửi lại ⇒ chạy tiếp từ ván 1', () => {
    const { p, tien } = phong()
    const a = vao(p, 'S1')
    p.nhan(a, goi({ p: [100, 100, 100, 1] }))
    tien(TRO_NHIP_MS); p.nhip()
    expect(p.canThuc()).toBe(true)
    tien(5100); p.nhip() // em im (ẩn tab, khoá màn) quá 5 giây
    expect(p.canThuc()).toBe(false)
    const n = dem(a, 'lop')
    tien(TRO_NHIP_MS); p.nhip()
    expect(dem(a, 'lop')).toBe(n)
    expect(p.soNguoi).toBe(1) // kết nối vẫn giữ — chỉ trò nghỉ
    p.nhan(a, goi({ p: [100, 100, 100, 1] }))
    expect(p.canThuc()).toBe(true)
    tien(TRO_NHIP_MS); p.nhip()
    expect(anh(a).v).toBe(1)
    p.roi(a); p.nhip()
    expect(p.canThuc()).toBe(false); expect(p.soNguoi).toBe(0)
  })
  it('thầy bấm Bắt đầu: `dongTatCa("bat-dau")` ⇒ mọi máy nhận `{ t: "dong" }` rồi đóng 4000; trò dừng hẳn', () => {
    const { p, tien } = phong()
    const ks = ['S1', 'S2', 'S3'].map((s) => vao(p, s))
    p.nhan(ks[0], goi({ p: [100, 100, 100, 1] }))
    tien(TRO_NHIP_MS); p.nhip()
    p.dongTatCa('bat-dau')
    for (const k of ks) { expect(k.tin.at(-1)).toEqual({ t: 'dong', ly: 'bat-dau' }); expect(k.dongMa).toBe(MA_DONG.batDau) }
    expect(p.soNguoi).toBe(0); expect(p.canThuc()).toBe(false)
    const n = ks[0].tin.length
    p.nhan(ks[0], goi({ p: [100, 100, 100, 1] })); tien(TRO_NHIP_MS); p.nhip()
    expect(ks[0].tin.length).toBe(n)
    // Công tắc tắt ⇒ mã 4010.
    const { p: p2 } = phong(); const k = vao(p2, 'S1'); p2.dongTatCa('tat')
    expect(k.dongMa).toBe(MA_DONG.tat)
  })
  it('phòng vừa thức dậy: `khoiPhuc` dựng lại ĐÚNG đội từ dữ liệu gắn trên kết nối; dữ liệu hỏng ⇒ bỏ', () => {
    const { p, tien } = phong()
    const a = kn(), b = kn(), hong = kn()
    p.khoiPhuc(a, { st: 1, s: 'S1', t: 'Minh Anh', doi: 3 })
    p.khoiPhuc(b, { st: 1, s: 'S2', t: 'Hải Đăng', doi: 3 })
    p.khoiPhuc(hong, { st: 1, s: 'S9', t: 'x', doi: 7 } as KemSinhTon)
    p.khoiPhuc(kn(), { st: 1, s: 'S1', t: 'trùng', doi: 0 })
    expect(p.soNguoi).toBe(2)
    p.nhan(a, goi({ p: [100, 100, 100, 1] }))
    tien(TRO_NHIP_MS); p.nhip()
    expect(anh(b).ds.S1[3]).toBe(3)
    // Em mới vào sau đó được xếp vào đội đang trống.
    expect(doiCua(vao(p, 'S3'))).toBe(0)
    expect((cuoi(a, 'st-ds')!.ds as Dong[]).map((d) => d[2])).toEqual([3, 3, 0])
  })
})

describe('Máy trò dùng chung (MaySinhTon)', () => {
  it('đội ngoài 0..3 ⇒ bỏ gói; `xoa` gỡ em ngay; `dung` xoá sạch; hộp tiếp tế: em chạm ĐẦU TIÊN được nhận', () => {
    const m = new MaySinhTon(() => 0.5)
    m.nhan('S1', 4, { p: [1, 1, 1, 1] }, T0); m.nhan('S1', -1, { p: [1, 1, 1, 1] }, T0)
    expect(m.soEm).toBe(0); expect(m.nhip(T0)).toBeNull()
    const soHop = Math.floor(T0 / 20_000)
    m.nhan('S1', 0, { p: [800, 500, 60, 1], h: soHop }, T0); m.nhan('S2', 1, { p: [800, 500, 60, 1], h: soHop }, T0 + 10)
    expect(m.soEm).toBe(2)
    expect(m.nhip(T0 + 250)!.h).toEqual([soHop, 'S1'])
    m.xoa('S2'); expect(m.soEm).toBe(1)
    expect(m.nhip(T0 + 500)!.ds.S2).toBeUndefined()
    m.dung(); expect(m.soEm).toBe(0); expect(m.nhip(T0 + 750)).toBeNull()
  })
})

/** Durable Object với ngữ cảnh giả (không cần Cloudflare, không có D1). */
function doGia(env: Partial<Env> = {}) {
  type Ws = WsMayChu & { ma?: number; ly?: string; gui: string[]; kem: Record<string, unknown> }
  const ws: Ws[] = []
  const taoWs = (kem: Record<string, unknown> = { ca: '123456', mo: 1 }) => {
    const w = { gui: [] as string[], kem, ma: undefined as number | undefined, ly: undefined as string | undefined,
      send(d: unknown) { w.gui.push(String(d)) }, close(ma?: number, ly?: string) { w.ma = ma; w.ly = ly },
      serializeAttachment(v: unknown) { w.kem = v as Record<string, unknown> }, deserializeAttachment() { return w.kem } } as unknown as Ws
    ws.push(w); return w
  }
  const ctx = { storage: {}, acceptWebSocket() {}, getWebSockets: () => ws, waitUntil() {} } as unknown as DurableObjectState
  const tao = () => new PhongDauIon(ctx, { MA_BI_MAT: 'bi-mat', ...env } as Env)
  return { d: tao(), tao, taoWs }
}
const veKy = (s: string, c = '123456', h = Date.now() + 60_000) => kyVeDau('bi-mat', { c, s, t: `Bạn ${s}`, h })
const vaoSt = async (d: PhongDauIon, w: WsMayChu, s: string) => d.webSocketMessage(w, JSON.stringify({ t: 'vao', v: PHIEN_BAN_ST, tro: 'st', ve: await veKy(s) }))
const docTin = (w: { gui: string[] }) => w.gui.map((x) => JSON.parse(x) as Record<string, unknown>)

describe('Durable Object của ca — Sinh Tồn: cửa, vé, lệnh đóng của phòng chờ ca', () => {
  it('gói `vao` có `tro: "st"` + vé đúng ca ⇒ vào phòng Sinh Tồn (`st-vao`), kết nối gắn `st: 1` và giữ mã ca', async () => {
    const { d, taoWs } = doGia()
    const w = taoWs()
    await vaoSt(d, w, '12121')
    expect(w.ma).toBeUndefined()
    expect(docTin(w)[0]).toMatchObject({ t: 'st-vao', toi: ['12121', 'Bạn 12121', 0] })
    expect(w.kem).toMatchObject({ ca: '123456', st: 1, s: '12121', doi: 0 })
    expect(w.kem.id).toBeUndefined()
  })
  it('rào vé giữ nguyên: vé rác / vé ca khác / vé hết hạn ⇒ 4003; sai phiên bản ⇒ 4010 «tải lại trang»; công tắc tắt ⇒ 4010', async () => {
    const { d, taoWs } = doGia()
    const rac = taoWs(); await d.webSocketMessage(rac, JSON.stringify({ t: 'vao', v: PHIEN_BAN_ST, tro: 'st', ve: 'rac' }))
    expect(rac.ma).toBe(MA_DONG.veSai)
    const caKhac = taoWs(); await d.webSocketMessage(caKhac, JSON.stringify({ t: 'vao', v: PHIEN_BAN_ST, tro: 'st', ve: await veKy('1', '999999') }))
    expect(caKhac.ma).toBe(MA_DONG.veSai)
    const het = taoWs(); await d.webSocketMessage(het, JSON.stringify({ t: 'vao', v: PHIEN_BAN_ST, tro: 'st', ve: await veKy('1', '123456', Date.now() - 1) }))
    expect(het.ma).toBe(MA_DONG.veSai)
    const cu = taoWs(); await d.webSocketMessage(cu, JSON.stringify({ t: 'vao', v: PHIEN_BAN_ST + 1, tro: 'st', ve: await veKy('1') }))
    expect(cu.ma).toBe(MA_DONG.tat); expect(cu.ly).toBe(CHU_BAN_CU_ST); expect(CHU_BAN_CU_ST).toMatch(/tải lại trang/)
    for (const w of [rac, caKhac, het, cu]) expect(w.gui).toHaveLength(0)
    const tat = doGia({ TAT_DAU_ION: '1' })
    const w = tat.taoWs(); await vaoSt(tat.d, w, '1')
    expect(w.ma).toBe(MA_DONG.tat)
  })
  it('gói trò ⇒ hẹn giờ 250 ms riêng phát ảnh; hết em thật ⇒ hẹn giờ tự tắt (Durable Object được ngủ)', async () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(T0)
      const { d, taoWs } = doGia()
      const a = taoWs(), b = taoWs()
      await vaoSt(d, a, 'S1'); await vaoSt(d, b, 'S2')
      expect(vi.getTimerCount()).toBe(0) // chỉ ngồi phòng, chưa chơi ⇒ không hẹn giờ nào
      await d.webSocketMessage(a, goi({ p: [100, 100, 100, 1] }))
      expect(vi.getTimerCount()).toBe(1)
      vi.advanceTimersByTime(TRO_NHIP_MS + 10)
      const anhB = docTin(b).filter((t) => t.t === 'lop')
      expect(anhB).toHaveLength(1)
      expect(anhB[0]).toMatchObject({ t: 'lop', k: 'tro' })
      expect((anhB[0].x as SinhTonAnh).ds.S1).toEqual([100, 100, 100, 0, 1, ''])
      vi.advanceTimersByTime(6000) // S1 im quá 5 giây
      expect(vi.getTimerCount()).toBe(0)
      const n = b.gui.length
      vi.advanceTimersByTime(2000)
      expect(b.gui.length).toBe(n)
    } finally { vi.useRealTimers() }
  })
  it('em đóng kết nối ⇒ rời phòng, bạn còn lại nhận `st-ds` mới', async () => {
    const { d, taoWs } = doGia()
    const a = taoWs(), b = taoWs()
    await vaoSt(d, a, 'S1'); await vaoSt(d, b, 'S2')
    await d.webSocketClose(b)
    expect(docTin(a).at(-1)).toEqual({ t: 'st-ds', ds: [['S1', 'Bạn S1', 0]] })
  })
  it('máy còn mảnh trò Đấu Nguyên Tử cũ (gói vào không có `tro`) ⇒ đóng 4010 «tải lại trang», không vào phòng, không ảnh hưởng em đang chơi', async () => {
    const { d, taoWs } = doGia()
    const st = taoWs(), cu = taoWs()
    await vaoSt(d, st, 'S1')
    const truoc = st.gui.length
    await d.webSocketMessage(cu, JSON.stringify({ t: 'vao', v: 4, ve: await veKy('S2'), nt: 0 }))
    expect(cu.ma).toBe(MA_DONG.tat); expect(cu.ly).toBe(CHU_TRO_CU); expect(CHU_TRO_CU).toMatch(/tải lại trang/)
    expect(cu.gui).toEqual([])
    expect(st.gui.length).toBe(truoc); expect(st.ma).toBeUndefined()
  })
  it('POST /dong (thầy bấm Bắt đầu) ⇒ MỌI kết nối đóng 4000: em đang chơi Sinh Tồn và cả kết nối vừa mở chưa kịp gửi vé', async () => {
    const { d, taoWs } = doGia()
    const st = taoWs(), moi = taoWs()
    await vaoSt(d, st, 'S1')
    await d.fetch(new Request('https://phong-dau/dong', { method: 'POST' }))
    expect(st.gui.at(-1)).toBe('{"t":"dong","ly":"bat-dau"}'); expect(st.ma).toBe(MA_DONG.batDau)
    expect(moi.ma).toBe(MA_DONG.batDau)
  })
  it('phòng ngủ rồi thức (bộ nhớ mất): gói trò kế tiếp dựng lại em đúng đội từ kết nối; `/dong` lúc phòng vừa thức vẫn đóng 4000', async () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(T0)
      const { tao, taoWs } = doGia()
      const a = taoWs({ ca: '123456', mo: 1, so: 0, st: 1, s: 'S1', t: 'Minh Anh', doi: 2 })
      const b = taoWs({ ca: '123456', mo: 1, so: 0, st: 1, s: 'S2', t: 'Hải Đăng', doi: 1 })
      const d = tao() // Durable Object mới, chưa có gì trong bộ nhớ
      await d.webSocketMessage(a, goi({ p: [500, 500, 100, 1] }))
      vi.advanceTimersByTime(TRO_NHIP_MS + 10)
      expect((docTin(b).at(-1)!.x as SinhTonAnh).ds.S1).toEqual([500, 500, 100, 2, 1, ''])
      const d2 = tao()
      await d2.fetch(new Request('https://phong-dau/dong', { method: 'POST' }))
      expect(a.ma).toBe(MA_DONG.batDau); expect(b.ma).toBe(MA_DONG.batDau)
    } finally { vi.useRealTimers() }
  })
})
