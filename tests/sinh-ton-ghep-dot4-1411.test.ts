// SINH TỒN bản 2 — BƯỚC GHÉP ĐỢT 4 (14/11): thống kê ghi D1 THEO LÔ (không mỗi nhịp, bỏ máy bù / Thầy / Ma Mực), đồ + danh hiệu trong danh sách phòng,
// đội cả học kỳ ở phòng ca, đồ CHỈ đổi hình (luật / ảnh chụp không phụ thuộc đồ).
import { describe, expect, it, vi } from 'vitest'
import { GHI_MOI_VAN, MaySinhTon } from '../server/src/sinh-ton-may-chu'
import { PhongSinhTonCa, type KetNoi, type VeDau } from '../server/src/sinh-ton-ca'
import { KenhLopMay } from '../server/src/kenh-lop-may'
import { PhongDauIon } from '../server/src/phong-dau-ion'
import { docDoPhong, type KetQuaVanEm, type NoiDuLieuSt } from '../server/src/sinh-ton-du-lieu'
import { kyVeDau } from '../server/src/dau-ion-ve'
import type { DurableObjectState, Env, WsMayChu } from '../server/src/kieu'
import { liveDat } from '../src/lib/bpu/phong-live'
import { taoPhong, type TrangThaiPhong } from '../src/lib/bpu/phong'
import { THAY, VAN_CHOI_MS, VAN_MS } from '../src/lib/live-khoi/sinh-ton-loi'
import { PHIEN_BAN_ST } from '../src/lib/live-khoi/kieu'
import { chuDanhHieu, gonMac, maTuan, moGon, tuanTruoc, MAC_TRONG } from '../src/lib/live-khoi/tu-do'

/** Giây thứ 10 của một ván. */
const T0 = Math.ceil(Date.UTC(2026, 10, 14, 12) / VAN_MS) * VAN_MS + 10_000
const NGHI = T0 - 10_000 + VAN_CHOI_MS + 100

describe('mã đồ gọn trong danh sách phòng', () => {
  it('gonMac / moGon khứ hồi; trống cả ⇒ chuỗi rỗng; mã lạ / sai ngăn ⇒ ngăn trống; chữ danh hiệu theo chỉ số', () => {
    const mac = { mu: 'mu-phu-thuy', ao: 'ao-sao-dem', dan: 'dan-cau-vong', ha: 'diem-10-do' }
    expect(gonMac(mac)).toBe('3568'); expect(moGon('3568')).toEqual(mac)
    expect(gonMac(MAC_TRONG)).toBe(''); expect(moGon('')).toEqual(MAC_TRONG)
    expect(moGon('4000')).toEqual(MAC_TRONG) // món 4 là áo, không phải mũ
    expect(moGon('xyz')).toEqual(MAC_TRONG); expect(moGon(12)).toEqual(MAC_TRONG)
    expect(chuDanhHieu(0)).toBe('Thợ săn tuần'); expect(chuDanhHieu(2)).toBe('Hạ gục Thầy'); expect(chuDanhHieu(-1)).toBe(''); expect(chuDanhHieu('0')).toBe('')
  })
})

/** Chạy máy trò từ `tu` tới `den`: nhịp 250 ms, mỗi em gửi gói thường mỗi giây (giữ trên sân); `su(t)` chèn gói riêng ở mốc lẻ 500 ms (không đụng gói thường). */
function chay(m: MaySinhTon, em: [string, number, number][], tu: number, den: number, su: (t: number) => void = () => {}): void {
  for (let t = tu; t < den; t += 250) {
    if (t % 1000 === 0) for (const [id, doi, x] of em) m.nhan(id, doi, { p: [x, 500, 60, 1] }, t)
    if (t % 1000 === 500) su(t)
    m.nhip(t + 1)
  }
}
const EM3: [string, number, number][] = [['S1', 0, 800], ['S2', 1, 820], ['S3', 2, 840]]

describe('thống kê em thật trong MaySinhTon', () => {
  it('hạ / bị hạ / hạ Thầy / diệt thủ khoa / hạ liền — Thầy, Ma Mực, máy bù không bao giờ có dòng', () => {
    const m = new MaySinhTon(() => 0.5)
    // S1 (đội 0) hạ S2 (đội 1) ba lần (mỗi lần cách 3 giây) ⇒ thủ khoa; S3 (đội 2) hạ S1 (đang là thủ khoa) ⇒ diệt thủ khoa; S3 hạ Thầy.
    const ha: Record<number, () => void> = {
      [T0 + 1500]: () => m.nhan('S2', 1, { p: [820, 500, 0, 1], a: 'S1' }, T0 + 1500),
      [T0 + 4500]: () => m.nhan('S2', 1, { p: [820, 500, 0, 1], a: 'S1' }, T0 + 4500),
      [T0 + 7500]: () => m.nhan('S2', 1, { p: [820, 500, 0, 1], a: 'S1' }, T0 + 7500),
      [T0 + 9500]: () => { m.nhan('S1', 0, { p: [800, 500, 0, 1], a: 'S3' }, T0 + 9500); m.nhanThay({ p: [860, 500, 1000, 2] }, T0 + 9500) },
      [T0 + 10500]: () => m.nhanThay({ p: [860, 500, 0, 2], a: 'S3' }, T0 + 10500),
    }
    chay(m, EM3, T0, T0 + 12000, (t) => ha[t]?.())
    expect(m.vanChoGhi).toBe(0)
    const truoc = m.layThongKe()
    const theo = new Map(truoc.map((k) => [k.id, k]))
    expect([...theo.keys()].sort()).toEqual(['S1', 'S2', 'S3'])
    expect(theo.get('S1')).toMatchObject({ ha: 3, biHa: 1, chuoiMax: 3, thuKhoa: 0 })
    expect(theo.get('S2')).toMatchObject({ ha: 0, biHa: 3 })
    expect(theo.get('S3')).toMatchObject({ ha: 1, dietTk: 1, haThay: 1 })
    expect(truoc.every((k) => k.van === 0)).toBe(true) // ván chưa chốt ⇒ `van` truyền rõ 0 (nơi ghi coi thiếu là 1)
    // Rút rồi ⇒ rỗng (không cộng trùng).
    expect(m.layThongKe()).toEqual([])
  })
  it('chốt ván ở nhịp NGHỈ ĐẦU TIÊN (một lần): mọi em đã chơi +1 ván, thủ khoa cuối ván +1; `dung()` không xoá thống kê chờ ghi', () => {
    const m = new MaySinhTon(() => 0.5)
    // S1 hạ S2 mỗi 3 giây suốt ván (~36 lượt — chắc chắn hơn mọi máy bù) ⇒ S1 là thủ khoa cuối ván.
    let n = 0
    const ha = (t: number) => { if ((t - T0 - 1500) % 3000 === 0 && t < NGHI - 1000) { n++; m.nhan('S2', 1, { p: [820, 500, 0, 1], a: 'S1' }, t) } }
    chay(m, EM3.slice(0, 2), T0, NGHI + 2000, ha)
    expect(m.vanChoGhi).toBe(1)
    m.dung()
    const ds = new Map(m.layThongKe().map((k) => [k.id, k]))
    expect(n).toBeGreaterThan(30)
    expect(ds.get('S1')).toMatchObject({ van: 1, thuKhoa: 1, ha: n })
    expect(ds.get('S2')).toMatchObject({ van: 1, thuKhoa: 0 })
    expect(ds.get('S2')!.biHa).toBeGreaterThanOrEqual(n)
    expect(m.vanChoGhi).toBe(0)
  })
})

// ── Phòng ca: ghi theo LÔ ──
interface KnGia extends KetNoi { tin: string[]; ma?: number; kem: Record<string, unknown> }
const knGia = (): KnGia => { const k: KnGia = { tin: [], kem: {}, gui(d) { k.tin.push(String(d)) }, dong(ma) { k.ma = ma }, ghiKem(v) { k.kem = { ...k.kem, ...(v as object) } } }; return k }
const ve = (s: string): VeDau => ({ c: '123456', s, t: `Bạn ${s}`, h: T0 + 3_600_000 })
const cuoi = (k: KnGia, t: string) => k.tin.map((x) => JSON.parse(x) as Record<string, unknown>).filter((j) => j.t === t).at(-1)

describe('phòng ca — ghi thống kê theo lô', () => {
  it(`không ghi ở nhịp thường; ghi MỘT lần sau ${GHI_MOI_VAN} ván; ghi khi thầy bắt đầu ca; mã phòng ca:<mã ca>:<k>`, () => {
    let gio = T0
    const ghi = vi.fn<(ma: string, ds: readonly KetQuaVanEm[]) => void>()
    const p = new PhongSinhTonCa(() => gio, () => 0.5, 2, { ghi })
    const a = knGia(), b = knGia()
    p.vao(a, ve('S1')); p.vao(b, ve('S2'))
    const goi = (k: KetNoi, x: unknown) => p.nhan(k, JSON.stringify({ t: 'st', x }))
    // 5 ván, mỗi nhịp 250 ms; em gửi gói mỗi giây (không bị gỡ vì im).
    const het = T0 - 10_000 + GHI_MOI_VAN * VAN_MS
    let nhipChay = 0
    for (; gio < het + 1000; gio += 250) {
      if (gio % 1000 < 250) { goi(a, { p: [800, 500, 60, 1] }); goi(b, { p: [820, 500, 60, 1] }) }
      if (gio === T0 + 1500) goi(b, { p: [820, 500, 0, 1], a: 'S1' })
      p.nhip(); nhipChay++
      if (gio < het - VAN_MS + VAN_CHOI_MS) expect(ghi).not.toHaveBeenCalled()
    }
    expect(nhipChay).toBeGreaterThan(2000)
    expect(ghi).toHaveBeenCalledTimes(1)
    const [ma, ds] = ghi.mock.calls[0]!
    expect(ma).toBe('ca:123456:2')
    expect(new Map(ds.map((k) => [k.id, k])).get('S1')).toMatchObject({ ha: 1, van: GHI_MOI_VAN })
    expect(ds.every((k) => !k.id.startsWith('~') && k.id !== THAY)).toBe(true)
    // Thầy bắt đầu ca ⇒ ghi phần còn lại (ván đang dở không tính ván — ở đây không có gì mới ⇒ không gọi).
    p.dongTatCa('bat-dau')
    expect(ghi).toHaveBeenCalledTimes(1)
  })
  it('em cuối rời phòng / hết em trên sân ⇒ ghi phần chờ; không có gì ⇒ không gọi', () => {
    let gio = T0
    const ghi = vi.fn()
    const p = new PhongSinhTonCa(() => gio, () => 0.5, 0, { ghi })
    const a = knGia(), b = knGia()
    p.vao(a, ve('S1')); p.vao(b, ve('S2'))
    p.nhan(a, JSON.stringify({ t: 'st', x: { p: [800, 500, 60, 1] } })); p.nhan(b, JSON.stringify({ t: 'st', x: { p: [820, 500, 60, 1] } }))
    gio += 250; p.nhip()
    gio += 1000; p.nhan(b, JSON.stringify({ t: 'st', x: { p: [820, 500, 0, 1], a: 'S1' } })); p.nhip()
    p.roi(a); expect(ghi).not.toHaveBeenCalled()
    p.roi(b); expect(ghi).toHaveBeenCalledTimes(1)
    expect(ghi.mock.calls[0]![1]).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'S1', ha: 1, van: 0 }), expect.objectContaining({ id: 'S2', biHa: 1 })]))
    gio += 6000; p.nhip(); expect(ghi).toHaveBeenCalledTimes(1)
  })
})

describe('phòng ca — đội cả học kỳ + đồ / danh hiệu trong danh sách', () => {
  it('em có đội cả kỳ ⇒ vào đúng đội đó (kể cả lệch người); thiếu ⇒ đội ít em nhất; danh sách mang mã đồ + danh hiệu; phòng thức dậy giữ nguyên', () => {
    const p = new PhongSinhTonCa(() => T0, () => 0.5)
    const a = knGia(), b = knGia(), c = knGia()
    p.vao(a, ve('S1'), { c: '3500', dh: 0, doi: 2 })
    p.vao(b, ve('S2'), { c: '', dh: -1, doi: 2 })
    p.vao(c, ve('S3'), null)
    const ds = cuoi(c, 'st-ds')!.ds as unknown[][]
    expect(ds).toEqual([['S1', 'Bạn S1', 2, '3500', 0], ['S2', 'Bạn S2', 2], ['S3', 'Bạn S3', 0]])
    expect(cuoi(a, 'st-vao')!.toi).toEqual(['S1', 'Bạn S1', 2, '3500', 0])
    expect(a.kem).toMatchObject({ st: 1, doi: 2, c: '3500', dh: 0 })
    // Dữ liệu lạ ⇒ bỏ.
    const d = knGia(); p.vao(d, ve('S4'), { c: '<script>', dh: 9, doi: 7 })
    expect((cuoi(d, 'st-vao')!.toi as unknown[])).toEqual(['S4', 'Bạn S4', 1])
    // Phòng ngủ rồi thức: dựng lại từ dữ liệu gắn kết nối.
    const p2 = new PhongSinhTonCa(() => T0, () => 0.5)
    p2.khoiPhuc(a, a.kem as never); const e = knGia(); p2.vao(e, ve('S9'))
    expect((cuoi(e, 'st-ds')!.ds as unknown[][])[0]).toEqual(['S1', 'Bạn S1', 2, '3500', 0])
  })
  it('đội cả kỳ làm lệch người ⇒ máy bù bù đủ 4 mỗi đội (ảnh đủ của máy trò)', () => {
    const p = new PhongSinhTonCa(() => T0, () => 0.5)
    for (let i = 0; i < 6; i++) p.vao(knGia(), ve(`S${i}`), { c: '', dh: -1, doi: 0 })
    const m = new MaySinhTon(() => 0.5)
    for (let i = 0; i < 6; i++) m.nhan(`S${i}`, 0, { p: [800 + i * 10, 500, 60, 1] }, T0)
    const anh = m.nhip(T0 + 250)!
    const dem = [0, 1, 2, 3].map((d) => Object.entries(anh.ds).filter(([, r]) => r[3] === d))
    expect(dem[0]!.length).toBe(6); expect(dem[0]!.every(([id]) => !id.startsWith('~'))).toBe(true)
    expect(dem.slice(1).map((d) => d.length)).toEqual([4, 4, 4])
    expect(p.soNguoi).toBe(6)
  })
  it('ĐỒ CHỈ ĐỔI HÌNH: cùng gói, cùng rng ⇒ ảnh chụp y hệt dù em mặc đồ hay không', () => {
    const chay = (coDo: boolean): string[] => {
      let gio = T0
      const p = new PhongSinhTonCa(() => gio, () => 0.37)
      const a = knGia(), b = knGia()
      p.vao(a, ve('S1'), coDo ? { c: '3568', dh: 2, doi: 0 } : { c: '', dh: -1, doi: 0 })
      p.vao(b, ve('S2'), coDo ? { c: '1478', dh: 0, doi: 1 } : { c: '', dh: -1, doi: 1 })
      for (let i = 0; i < 40; i++) {
        p.nhan(a, JSON.stringify({ t: 'st', x: { p: [800 + i * 5, 500, 60, 1 + (i % 6)], t: 'S2' } }))
        p.nhan(b, JSON.stringify({ t: 'st', x: { p: [900, 520, 80 - i, 2], t: 'S1', ...(i === 20 ? { a: 'S1' } : {}) } }))
        gio += 250; p.nhip()
      }
      return a.tin.filter((t) => t.startsWith('{"t":"lop"'))
    }
    const co = chay(true), khong = chay(false)
    expect(co.length).toBeGreaterThan(30)
    expect(co).toEqual(khong)
  })
})

// ── Phòng live (KenhLopMay) ──
interface Ws { tin: string[]; send(d: string): void }
const taoWs = (): Ws => ({ tin: [], send(d) { this.tin.push(d) } })
function kenhGia(du: NoiDuLieuSt) {
  const st: TrangThaiPhong = taoPhong({ buoiId: 'buoi-9', lop: 'Live Khối 12', ds: [{ sbd: 'S1', ten: 'Gia Bảo', coMat: true, luc: T0 }, { sbd: 'S2', ten: 'Hải Đăng', coMat: true, luc: T0 }], nay: T0 })
  st.live = { cho: true, sfu: false, san: false, bat: false, tu: null, phien: 0, ss: null, tay: [], noi: [], xa: false, tiengLop: true, soNet: 0, nhip: 0 }
  liveDat(st, { khoi: { k: 12, gd: 'cho', che: 'hoc' } }, T0)
  const hs1 = taoWs(), hs2 = taoWs(), gv = taoWs()
  const ctx = { getWebSockets: (tag?: string) => (tag === 'gv' ? [gv] : [hs1, hs2]) }
  const k = new KenhLopMay(ctx as never, () => st, du)
  const em = (w: Ws, s: string, j: unknown, nay: number) => k.tin(w as never, { v: 'hs', s }, j as never, st, nay)
  return { st, k, hs1, hs2, gv, em }
}
const doc = (w: Ws) => w.tin.map((x) => JSON.parse(x) as Record<string, unknown>)

describe('phòng live — đồ + danh hiệu trong `lop-ds`, thống kê ghi theo lô với mã buổi', () => {
  it('em vào ⇒ một lô đọc đồ; đọc xong ⇒ phát lại `lop-ds` [sbd, tên, đội, kJ, mã đồ, danh hiệu] cho máy em VÀ máy thầy', async () => {
    const doc1 = vi.fn(async (s: string) => (s === 'S1' ? { c: '1500', dh: 0 } : { c: '', dh: -1 }))
    const { k, st, hs2, gv } = kenhGia({ ghi: vi.fn(), doc: doc1 })
    k.soatDs(st)
    expect(doc1).toHaveBeenCalledTimes(2)
    await new Promise((r) => setTimeout(r, 60))
    const ds = doc(hs2).filter((j) => j.t === 'lop-ds').at(-1)!.ds as unknown[][]
    expect(ds.find((r) => r[0] === 'S1')!.slice(4)).toEqual(['1500', 0])
    expect(ds.find((r) => r[0] === 'S2')).toHaveLength(4)
    expect(doc(gv).some((j) => j.t === 'lop-ds')).toBe(true)
    // Phát lại vì sĩ số đổi: không đọc lại em đã có.
    k.soatDs(st); expect(doc1).toHaveBeenCalledTimes(2)
  })
  it('thầy bắt đầu buổi ⇒ trò dừng ⇒ ghi MỘT lần với mã buổi; nhịp thường không ghi; Thầy không có dòng', () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(T0)
      const ghi = vi.fn()
      const { em, hs1, hs2, st } = kenhGia({ ghi, doc: async () => null })
      st.ds.find((e) => e.sbd === 'S2')!.doi = (st.ds.find((e) => e.sbd === 'S1')!.doi + 1) % 4
      em(hs1, 'S1', { t: 'lop', k: 'tro', x: { p: [800, 500, 60, 1] } }, T0)
      em(hs2, 'S2', { t: 'lop', k: 'tro', x: { p: [820, 500, 0, 1], a: 'S1' } }, T0 + 10)
      vi.advanceTimersByTime(3000)
      expect(ghi).not.toHaveBeenCalled()
      st.live!.khoi!.gd = 'dang'
      vi.advanceTimersByTime(600)
      expect(ghi).toHaveBeenCalledTimes(1)
      expect(ghi.mock.calls[0]![0]).toBe('buoi-9')
      expect((ghi.mock.calls[0]![1] as KetQuaVanEm[]).map((x) => x.id).sort()).toEqual(['S1', 'S2'])
      vi.advanceTimersByTime(3000)
      expect(ghi).toHaveBeenCalledTimes(1)
    } finally { vi.useRealTimers() }
  })
})

// ── Đọc D1 một lô ──
type Row = Record<string, unknown>
function dbGia(bang: { mac?: Row[]; doi?: Row[]; tuan?: Row[] }, dem: { n: number }) {
  const tra = (sql: string): Row[] => (sql.includes('FROM st_mac') ? bang.mac ?? [] : sql.includes('FROM st_doi_ky') ? bang.doi ?? [] : sql.includes('FROM st_tuan') ? bang.tuan ?? [] : [])
  return {
    prepare: (sql: string) => ({ bind: (..._v: unknown[]) => ({ all: async () => { dem.n++; return { results: tra(sql) } }, first: async () => tra(sql)[0] ?? null, run: async () => ({}) }) }),
    batch: async () => [],
  }
}

describe('docDoPhong — một đợt đọc song song', () => {
  const nay = T0, truoc = tuanTruoc(maTuan(nay))
  it('đồ đang mặc + đội cả kỳ + danh hiệu tuần trước THEO KHỐI; lỗi / thiếu bảng ⇒ rỗng, không ném', async () => {
    const dem = { n: 0 }
    const env = { DB: dbGia({
      mac: [{ sbd: 'S1', mu: 'mu-tot-nghiep', ao: null, dan: 'dan-cau-vong', ha: null }, { sbd: 'S2', mu: 'khong-co', ao: null, dan: null, ha: null }],
      doi: [{ sbd: 'S1', doi: 3 }, { sbd: 'S2', doi: 9 }],
      tuan: [
        { tuan: truoc, sbd: 'S1', ha: 12, diet_tk: 0, ha_thay: 0, lop: '12A1', ten_lop: '' },
        { tuan: truoc, sbd: 'S3', ha: 3, diet_tk: 2, ha_thay: 1, lop: '12A2', ten_lop: '' },
        { tuan: truoc, sbd: 'X', ha: 50, diet_tk: 0, ha_thay: 0, lop: '11A1', ten_lop: '' }, // khối khác ⇒ không cướp danh hiệu của khối 12
      ],
    }, dem) } as unknown as Env
    const m = await docDoPhong(env, ['S1', 'S2', 'S3', '~0-1', 'THAY', 'MM'], true, nay)
    expect(dem.n).toBe(3)
    expect(m.get('S1')).toEqual({ c: '1060', dh: 0, doi: 3 })
    expect(m.has('S2')).toBe(false)
    expect(m.get('S3')).toEqual({ c: '', dh: 1 }) // giữ hai danh hiệu ⇒ hiện cái đầu theo thứ tự (Kẻ phá thủ khoa trước Hạ gục Thầy)
    expect(m.has('THAY')).toBe(false)
    const loi = { DB: { prepare: () => { throw new Error('no such table') } } } as unknown as Env
    expect((await docDoPhong(loi, ['S1'], true, nay + 86_400_000 * 14)).size).toBe(0)
  })
})

describe('Durable Object ca — đọc đội cả kỳ lúc nhận vé', () => {
  it('vé hợp lệ ⇒ đọc một lô (gom các em vào cùng lúc) rồi vào đúng đội cả kỳ, danh sách có đồ', async () => {
    const dem = { n: 0 }
    const ws: (WsMayChu & { gui: string[]; kem: Record<string, unknown> })[] = []
    const taoWs = () => { const w = { gui: [] as string[], kem: { ca: '123456', mo: 1 } as Record<string, unknown>, send(d: unknown) { w.gui.push(String(d)) }, close() {}, serializeAttachment(v: unknown) { w.kem = v as Record<string, unknown> }, deserializeAttachment() { return w.kem } } as unknown as WsMayChu & { gui: string[]; kem: Record<string, unknown> }; ws.push(w); return w }
    const ctx = { storage: {}, acceptWebSocket() {}, getWebSockets: () => ws, waitUntil() {} } as unknown as DurableObjectState
    const env = { MA_BI_MAT: 'bi-mat', DB: dbGia({ mac: [{ sbd: '777', mu: 'tai-nghe', ao: null, dan: null, ha: null }], doi: [{ sbd: '777', doi: 3 }, { sbd: '888', doi: 3 }] }, dem) } as unknown as Env
    const d = new PhongDauIon(ctx, env)
    const vaoSt = async (w: WsMayChu, s: string) => d.webSocketMessage(w, JSON.stringify({ t: 'vao', v: PHIEN_BAN_ST, tro: 'st', ve: await kyVeDau('bi-mat', { c: '123456', s, t: `Bạn ${s}`, h: Date.now() + 60_000 }) }))
    const a = taoWs(), b = taoWs()
    await Promise.all([vaoSt(a, '777'), vaoSt(b, '888')])
    expect(dem.n).toBe(3) // một lô cho hai em: st_mac + st_doi_ky + st_tuan
    const toi = (w: { gui: string[] }) => (w.gui.map((x) => JSON.parse(x) as Record<string, unknown>).find((j) => j.t === 'st-vao')!.toi as unknown[])
    expect(toi(a)).toEqual(['777', 'Bạn 777', 3, '2000'])
    expect(toi(b)).toEqual(['888', 'Bạn 888', 3])
  })
})
