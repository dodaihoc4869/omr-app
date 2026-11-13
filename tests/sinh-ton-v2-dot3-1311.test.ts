// «SINH TỒN» BẢN 2 — ĐỢT 3 (thầy duyệt bản vẽ 10 · 11 · 12 ngày 13/11, docs/dac-ta-sinh-ton-v2-1311.md): THẦY VÀO TRẬN (vai theo KẾT NỐI, chỉ phòng live) +
// MA MỰC (máu do máy chủ trừ, % bốn đội, thưởng 5) + «chỉ gửi gần» vẫn = ảnh đủ khi có boss / Thầy + mỗi trang một hộp + vòng co nhanh ở sân lớn + hoà điểm.
import { describe, expect, it, vi } from 'vitest'
import {
  CAP_THAY, CAP_TOI_DA, DOI_BOSS, DOI_THAY, HOI_SINH_THAY_MS, HOP_BK, MA_MUC, MAU_THAY, MM_MAU_GOC, MM_MAU_MOI, MM_SAT_GIAY, MM_THUONG, MM_TROI_MS, SAT_THUONG_GIAY, THAY,
  TOC_DO, TOC_DO_THAY, VAN_CHOI_MS, VAN_MS, apHop, bi, buocToi, chonMucTieu, docDong, heVongCuoi, hopSo, loaiHop, loaiHopO, nhanDon, nvBoss, satThuong, taoBanDo, taoToi,
  trongBui, viTriHop, vong, type KhungNhin, type NhanVat,
} from '../src/lib/live-khoi/sinh-ton-loi'
import type { SinhTonAnh, SinhTonDong } from '../src/lib/live-khoi/kieu'
import { GUI_GAN_BK, GoiSinhTon, MaySinhTon } from '../server/src/sinh-ton-may-chu'
import { KenhLopMay } from '../server/src/kenh-lop-may'
import { PhongSinhTonCa, type KetNoi } from '../server/src/sinh-ton-ca'
import { liveDat } from '../src/lib/bpu/phong-live'
import { taoPhong, vaoLop } from '../src/lib/bpu/phong'
import { xepHangVan } from '../src/components/live-khoi/sinh-ton-tien-ich'
import { chuXep } from '../src/components/live-khoi/sinh-ton-ve'

const hat = (s: number) => () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
/** Đầu một ván (giây 0) và giây 10. */
const V0 = 1000 * VAN_MS
const T0 = V0 + 10_000

// ── LÕI ──
describe('bé ma Thầy + Ma Mực trong lõi', () => {
  it('Thầy: máu 2000, bút đỏ = cấp 2 (Súng Đôi), chạy 165, bị hạ 5 giây; «đội» 4 chỉ cho mã THAY', () => {
    const bd = taoBanDo(0), t = taoToi(bd, DOI_THAY, T0, 0.3)
    expect([t.mau, t.cap, t.doi, CAP_THAY, MAU_THAY]).toEqual([2000, 2, 4, 2, 2000])
    expect(bi(bd, t.x, t.y)).toBe(false)
    // Chạy thẳng 1 giây (10 bước 100 ms) trên sân trống phía dưới tâm: đi đúng 165 (em 190).
    const t2 = buocToi(bd, { ...t, x: 1600, y: 1200 }, { dx: 1, dy: 0 }, 100, T0 + 3000)
    expect(Math.round((t2.x - 1600) * 10)).toBe(TOC_DO_THAY); expect(TOC_DO_THAY).toBeLessThan(TOC_DO)
    // Mất 1999 máu vẫn sống; hết máu ⇒ hồi sinh sau 5 giây, vẫn 2000 máu, vẫn cấp 2.
    const a = nhanDon({ ...t, batTuDen: 0 }, 1999, T0 + 3000)
    expect(a.mau).toBe(1)
    const b = nhanDon(a, 5, T0 + 3100)
    expect(b.chetDen).toBe(T0 + 3100 + HOI_SINH_THAY_MS)
    const c = buocToi(bd, b, { dx: 0, dy: 0 }, 16, T0 + 3100 + HOI_SINH_THAY_MS + 1)
    expect([c.mau, c.cap, c.doi]).toEqual([2000, 2, 4])
    // Hộp «Hồi đầy máu» không kéo máu Thầy xuống 100.
    expect(apHop({ ...t, mau: 1500 }, 'mau', T0).mau).toBe(1500)
    expect(docDong(THAY, [1, 2, 1500, 4, 2])!.doi).toBe(DOI_THAY)
    expect(docDong('123456', [1, 2, 50, 4, 2])!.doi).toBe(3)
  })
  it('Thầy khác đội với mọi người: ai cũng bắn được Thầy, Thầy bắn được mọi người; Ma Mực phun 30 máu / giây vào mục tiêu của nó', () => {
    const bd = taoBanDo(0)
    const thay: NhanVat = { id: THAY, x: 1600, y: 1300, mau: 2000, doi: DOI_THAY, cap: 2, t: 'E1' }
    for (const d of [0, 1, 2, 3]) {
      expect(chonMucTieu(bd, { x: 1700, y: 1300, doi: d }, [thay])).toBe(THAY)
      expect(satThuong({ id: 'E1', x: 1700, y: 1300, doi: d }, [thay], 1).tong).toBe(SAT_THUONG_GIAY[CAP_THAY - 1])
    }
    const mm = nvBoss([1600, 1000, 2000, 'E1'])!
    expect(mm).toMatchObject({ id: MA_MUC, doi: DOI_BOSS, mau: 2000, t: 'E1' })
    expect(satThuong({ id: 'E1', x: 1700, y: 1100, doi: 2 }, [mm], 1)).toEqual({ tong: MM_SAT_GIAY, ai: MA_MUC, chay: '' })
    expect(nvBoss([1, 2, 0])).toBeNull(); expect(nvBoss('rac')).toBeNull(); expect(nvBoss(undefined)).toBeNull()
  })
})

// ── VAI THẦY THEO KẾT NỐI ──
interface Ws { tin: string[]; send(d: string): void }
const taoWs = (): Ws => ({ tin: [], send(d) { this.tin.push(d) } })
function kenhGia() {
  const st = taoPhong({ buoiId: 'b1', lop: 'Live Khối 12', ds: [{ sbd: 'S1', ten: 'Minh Anh', coMat: true, luc: T0 }, { sbd: 'THAY', ten: 'Giả Thầy', coMat: true, luc: T0 }], nay: T0 })
  st.live = { cho: true, sfu: false, san: false, bat: false, tu: null, phien: 0, ss: null, tay: [], noi: [], xa: false, tiengLop: true, soNet: 0, nhip: 0 }
  liveDat(st, { khoi: { k: 12, gd: 'cho', che: 'hoc' } }, T0)
  vaoLop(st, 'S1', T0); vaoLop(st, 'THAY', T0)
  const hs = taoWs(), hs2 = taoWs(), gv = taoWs()
  const ctx = { getWebSockets: (tag?: string) => (tag === 'gv' ? [gv] : [hs, hs2]) }
  const k = new KenhLopMay(ctx as never, () => st)
  const em = (w: Ws, s: string, x: unknown, nay: number) => k.tin(w as never, { v: 'hs', s }, { t: 'lop', k: 'tro', x } as never, st, nay)
  const thay = (x: unknown, nay: number) => k.tin(gv as never, { v: 'gv', s: '' }, { t: 'lop', k: 'tro', x } as never, st, nay)
  return { st, em, thay, hs, hs2, gv }
}
const cuoiAnh = (w: Ws) => (JSON.parse(w.tin.at(-1)!) as { x: SinhTonAnh }).x

describe('Thầy vào trận: vai theo KẾT NỐI `gv`, chỉ phòng live', () => {
  it('máy thầy gửi gói ⇒ dòng THAY «đội» 4, máu kẹp 2000, cấp ÉP 2, `ty`; em (kể cả em mang số báo danh «THAY») không giả làm Thầy được; `roi: 1` ⇒ rời trận', () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(T0)
      const { em, thay, hs, hs2, gv } = kenhGia()
      em(hs, 'S1', { p: [1500, 1200, 100, 1] }, T0)
      // Em mang số báo danh «THAY» gửi gói như thường ⇒ phòng bỏ (mã dành riêng), không thành Thầy.
      em(hs2, 'THAY', { p: [1600, 1200, 100, 1] }, T0 + 1)
      vi.advanceTimersByTime(260)
      expect(cuoiAnh(gv).ty).toBeUndefined(); expect(cuoiAnh(gv).ds.THAY).toBeUndefined()
      thay({ p: [1600, 1300, 9999, 6], t: 'S1' }, T0 + 300)
      vi.advanceTimersByTime(250)
      const du = cuoiAnh(gv)
      expect(du.ty).toBe(THAY)
      expect(du.ds.THAY).toEqual([1600, 1300, MAU_THAY, DOI_THAY, CAP_THAY, 'S1'])
      // Mọi em đều có dòng Thầy (cả lớp thấy thanh máu Thầy).
      expect(cuoiAnh(hs).ds.THAY).toEqual(du.ds.THAY)
      // Em khai bắn Thầy ⇒ phòng nhận (Thầy khác đội với mọi em).
      em(hs, 'S1', { p: [1500, 1200, 100, 1], t: THAY }, T0 + 600)
      vi.advanceTimersByTime(250)
      expect(cuoiAnh(gv).ds.S1[5]).toBe(THAY)
      thay({ p: [0, 0, 0, 2], roi: 1 }, T0 + 900)
      vi.advanceTimersByTime(250)
      expect(cuoiAnh(gv).ty).toBeUndefined(); expect(cuoiAnh(gv).ds.THAY).toBeUndefined()
    } finally { vi.useRealTimers() }
  })
  it('máy chủ: nhan("THAY") / nhan("MM") bị bỏ; hạ Thầy không cộng điểm đội (chỉ ghi lượt hạ), Thầy hạ em không cộng điểm; Thầy không thành thủ khoa', () => {
    const m = new MaySinhTon(hat(1))
    m.nhan(THAY, 0, { p: [100, 100, 100, 1] }, T0); m.nhan(MA_MUC, 0, { p: [100, 100, 100, 1] }, T0)
    m.nhan('E1', 0, { p: [1500, 1200, 100, 1] }, T0)
    let a = m.nhip(T0)!
    expect(a.ds.THAY).toBeUndefined(); expect(a.ds.MM).toBeUndefined()
    m.nhanThay({ p: [1600, 1300, 2000, 1] }, T0 + 250)
    // Thầy bị E1 hạ (máy thầy báo `a`).
    m.nhanThay({ p: [1600, 1300, 0, 1], a: 'E1' }, T0 + 500)
    a = m.nhip(T0 + 500)!
    expect(a.an).toEqual([['E1', THAY, 0, 0, 0]]); expect(a.d).toEqual([0, 0, 0, 0])
    // Thầy hạ em 4 lần (cách 2,5 giây) ⇒ không điểm đội nào, không thủ khoa.
    for (let i = 1; i <= 4; i++) m.nhan('E1', 0, { p: [1500, 1200, 0, 1], a: THAY }, T0 + 500 + i * 2600)
    a = m.nhip(T0 + 500 + 4 * 2600)!
    expect(a.d).toEqual([0, 0, 0, 0]); expect(a.tk).toBeUndefined()
    expect(a.an.every((h) => h[0] === THAY && h[1] === 'E1')).toBe(true)
  })
  it('phòng chờ CA KIỂM TRA không có Thầy: không có đường nhận vai Thầy; gói nào cũng không sinh `ty`', () => {
    let nay = T0
    const p = new PhongSinhTonCa(() => nay, () => 0.5)
    const tin: string[] = []
    const k: KetNoi = { gui(d) { if (typeof d === 'string') tin.push(d) }, dong() {}, ghiKem() {} }
    p.vao(k, { c: '123456', s: '1', t: 'Bạn 1', h: T0 + 3_600_000 })
    for (const x of [{ p: [1600, 1300, 2000, 1] }, { p: [1600, 1300, 100, 1], roi: 1, thay: 1 }, { p: [1600, 1300, 100, 1], t: THAY }]) {
      p.nhan(k, JSON.stringify({ t: 'st', x })); nay += 250; p.nhip()
      const x2 = (JSON.parse(tin.filter((d) => d.includes('"k":"tro"')).at(-1)!) as { x: SinhTonAnh }).x
      expect(x2.ty).toBeUndefined(); expect(x2.ds.THAY).toBeUndefined(); expect(x2.ds['1']?.[5] ?? '').toBe('')
    }
    expect('nhanThay' in PhongSinhTonCa.prototype).toBe(false)
  })
})

// ── MA MỰC ──
/** 16 em (4 mỗi đội ⇒ không máy bù) đứng quanh tâm sân cỡ 0; đội `banDoi` cấp `cap` nhắm Ma Mực. */
function sanBoss(banDoi: number[], cap = 1) {
  const m = new MaySinhTon(hat(4))
  const em = Array.from({ length: 16 }, (_, i) => ({ id: `E${i}`, doi: i % 4 }))
  const gui = (nay: number, t?: (e: { id: string; doi: number }) => string) => {
    for (const e of em) m.nhan(e.id, e.doi, { p: [1300 + (e.doi % 2) * 600, 900 + Math.floor(e.doi / 2) * 300, 100, cap], ...(t ? { t: t(e) } : {}) }, nay)
  }
  return { m, em, gui, banDoi }
}
describe('Ma Mực: thực thể máy chủ', () => {
  it('trồi ở giây 60 (mỗi ván một lần), máu 1500 + 40 × số nhân vật; `bx` có mặt trong ảnh đủ và mọi ảnh lọc; `bp` chỉ ở ảnh đủ vành', () => {
    const { m, gui } = sanBoss([])
    const t59 = V0 + MM_TROI_MS - 250
    gui(t59); expect(m.nhip(t59)!.bx).toBeUndefined()
    const t60 = V0 + MM_TROI_MS
    gui(t60)
    const a = m.nhip(t60)!
    expect(a.bx?.slice(0, 3)).toEqual([1600, 1000, MM_MAU_GOC + MM_MAU_MOI * 16])
    expect(a.bp).toEqual([MM_MAU_GOC + MM_MAU_MOI * 16, 0, 0, 0, 0])
    const goi = m.goi(a, t60)
    for (const id of ['E0', 'E5']) expect((JSON.parse(goi.cho(id)) as { x: SinhTonAnh }).x.bx).toEqual(a.bx)
  })
  it('máu do MÁY CHỦ trừ theo `t = MM` của người bắn trong tầm (sát thương / giây của súng); % bốn đội; ngoài tầm không trừ', () => {
    const { m, gui } = sanBoss([])
    const t60 = V0 + MM_TROI_MS
    gui(t60); m.nhip(t60)
    // Đội 0 (cấp 1) và đội 1 nhắm boss; đội 1 bị đẩy ra xa (ngoài 660) ở lượt sau ⇒ chỉ đội 0 trừ máu.
    let nay = t60
    for (let k = 1; k <= 4; k++) { nay += 250; gui(nay, (e) => (e.doi <= 1 ? MA_MUC : '')); m.nhip(nay) }
    nay += 250; gui(nay, (e) => (e.doi <= 1 ? MA_MUC : '')); const a = m.nhip(nay)!
    const max = MM_MAU_GOC + MM_MAU_MOI * 16
    // 5 nhịp × 0,25 giây × 4 em mỗi đội × 34 máu / giây × 2 đội (tâm đám đông ngay tâm sân ⇒ boss đứng yên, mọi em trong tầm).
    expect(max - a.bx![2]).toBeGreaterThanOrEqual(Math.floor(5 * 0.25 * 4 * SAT_THUONG_GIAY[0] * 2) - 1)
    expect(a.bp!.slice(1)).toEqual([50, 50, 0, 0])
  })
  it('bị hạ ⇒ đội gây nhiều sát thương nhất +5 lượt hạ (`d`), `bh` một ảnh rồi thôi, boss biến mất; hết ván chưa hạ ⇒ không thưởng', () => {
    const { m, gui } = sanBoss([], CAP_TOI_DA)
    let nay = V0 + MM_TROI_MS
    gui(nay); m.nhip(nay)
    let a: SinhTonAnh | null = null, bh = -1, k = 0
    // Đội 2 bắn từ đầu, đội 3 vào sau ⇒ đội 2 nhiều sát thương hơn.
    while (k++ < 400) {
      nay += 250
      gui(nay, (e) => (e.doi === 2 || (e.doi === 3 && k > 10) ? MA_MUC : ''))
      a = m.nhip(nay)!
      if (typeof a.bh === 'number') { bh = a.bh; break }
    }
    expect(bh).toBe(2); expect(a!.d[2]).toBe(MM_THUONG); expect(a!.bx).toBeUndefined()
    nay += 250; gui(nay); const sau = m.nhip(nay)!
    expect(sau.bh).toBeUndefined(); expect(sau.bx).toBeUndefined(); expect(sau.d[2]).toBe(MM_THUONG)
    // Ván khác: boss sống tới hết giờ chơi ⇒ biến mất ở 5 giây nghỉ, không ai được thưởng.
    const s2 = sanBoss([])
    let t = 7 * VAN_MS + MM_TROI_MS
    s2.gui(t); s2.m.nhip(t)
    t = 7 * VAN_MS + VAN_CHOI_MS + 100; s2.gui(t)
    const b = s2.m.nhip(t)!
    expect(b.bx).toBeUndefined(); expect(b.bh).toBeUndefined(); expect(b.d).toEqual([0, 0, 0, 0])
  })
  it('em khai `t = MM` khi không có boss ⇒ phòng bỏ mục tiêu', () => {
    const m = new MaySinhTon(hat(2))
    m.nhan('E1', 0, { p: [1600, 1000, 100, 1], t: MA_MUC }, T0)
    expect(m.nhip(T0)!.ds.E1[5] ?? '').toBe('')
  })
})

// ── «CHỈ GỬI GẦN» = ẢNH ĐỦ khi có Ma Mực + Thầy ──
function docNhu(x: SinhTonAnh, toi: string): NhanVat[] {
  const kq: NhanVat[] = []
  for (const id in x.ds) { if (id === toi) continue; const n = docDong(id, x.ds[id]); if (n) kq.push(n) }
  const b = nvBoss(x.bx)
  if (b) kq.push(b)
  return kq
}
describe('«chỉ gửi gần» vẫn bằng ảnh đủ khi có Ma Mực + Thầy', () => {
  it('ngẫu nhiên: Thầy (đội 4, máu ≤ 2000), người bắn boss cấp 3 · 4 · 6, em sát boss, ảnh mỏng xen kẽ ⇒ 0 sai khác (sát thương + ngắm)', () => {
    const r = hat(2027)
    let soLech = 0, soNhan = 0, lanBoss = 0, banThay = 0
    const lech: string[] = []
    for (let lan = 0; lan < 120; lan++) {
      const co = lan % 2 ? 4 : 0, bd = taoBanDo(co), n = 10 + Math.floor(r() * 80)
      const tam = { x: bd.rong * (0.3 + r() * 0.4), y: bd.cao * (0.3 + r() * 0.4) }
      const ds: Record<string, SinhTonDong> = {}
      const ids: string[] = []
      for (let i = 0; i < n; i++) {
        const id = r() < 0.25 ? `~${Math.floor(r() * 80)}-${i}` : String(100000 + Math.floor(r() * 900000))
        if (ds[id]) continue
        // Một phần ba đứng sát boss (≤ 120) — nơi lan quanh boss trúng người.
        const sat = r() < 0.33, x = sat ? tam.x + (r() - 0.5) * 240 : r() * bd.rong, y = sat ? tam.y + (r() - 0.5) * 240 : r() * bd.cao
        ds[id] = [Math.round(x), Math.round(y), r() < 0.1 ? 0 : 1 + Math.floor(r() * 100), Math.floor(r() * 4), 1 + Math.floor(r() * CAP_TOI_DA), '']
        ids.push(id)
      }
      // Thầy ở một chỗ ngẫu nhiên (có lúc sát boss), bắn ai đó.
      const tx = r() < 0.5 ? tam.x + 80 : r() * bd.rong, ty = r() < 0.5 ? tam.y + 60 : r() * bd.cao
      ds[THAY] = [Math.round(tx), Math.round(ty), 1 + Math.floor(r() * MAU_THAY), DOI_THAY, CAP_THAY, ids[Math.floor(r() * ids.length)]]
      for (const id of ids) {
        const u = r(), row = ds[id]
        if (u < 0.3) continue
        if (u < 0.6 && Math.hypot(row[0] - tam.x, row[1] - tam.y) < 700) row[5] = MA_MUC
        else if (u < 0.7) row[5] = THAY
        else { const k = ids.filter((b) => ds[b][3] !== row[3]); if (k.length) row[5] = k[Math.floor(r() * k.length)] }
      }
      const bx: SinhTonAnh['bx'] = [Math.round(tam.x), Math.round(tam.y), 1500, ids[Math.floor(r() * ids.length)]]
      const anh: SinhTonAnh = { ds, an: [], d: [0, 0, 0, 0], v: 1, c: co, h: [-1, ''], ty: THAY, bx, bp: [3000, 25, 25, 25, 25] }
      const goi = new GoiSinhTon(anh, T0, new Map(), lan % 4 >= 2)
      const du = (JSON.parse(goi.du()) as { x: SinhTonAnh }).x
      expect(du.bx).toEqual(bx); expect(du.ty).toBe(THAY); expect(du.bp).toEqual(anh.bp)
      for (const id of ids) {
        const loc = (JSON.parse(goi.cho(id)) as { x: SinhTonAnh }).x
        expect(loc.bx).toEqual(bx); expect(loc.ty).toBe(THAY); expect(loc.ds.THAY).toEqual(ds.THAY)
        expect(loc.bp === undefined).toBe(lan % 4 >= 2)
        const row = ds[id], dsDu = docNhu(du, id), dsLoc = docNhu(loc, id)
        for (const truot of [0, 250]) {
          const g = r() * Math.PI * 2, d = truot * Math.sqrt(r())
          const toi = { id, x: row[0] + Math.cos(g) * d, y: row[1] + Math.sin(g) * d, doi: row[3] }
          const k: KhungNhin = { x0: toi.x - 420, y0: toi.y - 180, x1: toi.x + 420, y1: toi.y + 220 }
          const a = satThuong(toi, dsDu, 0.25), b = satThuong(toi, dsLoc, 0.25)
          soNhan++
          if (a.tong > 0 && dsDu.some((e) => e.t === MA_MUC && e.doi !== toi.doi && (e.cap === 3 || e.cap === 4 || e.cap === 6) && Math.hypot(e.x - toi.x, e.y - toi.y) > 1) && Math.hypot(tam.x - toi.x, tam.y - toi.y) <= 90) lanBoss++
          if (dsDu.some((e) => e.id === THAY && e.t === id)) banThay++
          if (a.tong !== b.tong || a.ai !== b.ai || a.chay !== b.chay) { soLech++; if (lech.length < 3) lech.push(`${id} ${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`) }
          for (const kh of [undefined, k]) if (chonMucTieu(bd, toi, dsDu, kh) !== chonMucTieu(bd, toi, dsLoc, kh)) { soLech++; if (lech.length < 3) lech.push(`ngắm ${id}`) }
        }
      }
    }
    expect(lech).toEqual([]); expect(soLech).toBe(0)
    // Bộ thử thật sự có lan quanh boss và có Thầy bắn (không phải 0 = 0 suông).
    expect(lanBoss).toBeGreaterThan(50); expect(banThay).toBeGreaterThan(20); expect(soNhan).toBeGreaterThan(10_000)
  })
})

// ── HỘP MỖI TRANG ──
describe('mỗi trang 1600 × 1000 một hộp + hộp tâm sân', () => {
  it('số hộp theo cỡ sân (trang trùng tâm sân bỏ), không nằm trong vật chặn / bụi; loại hộp 0 = `loaiHop` cũ, giá trị khoá', () => {
    expect([0, 1, 2, 3, 4].map((c) => viTriHop(taoBanDo(c)).length)).toEqual([5, 7, 9, 13, 17])
    for (let c = 0; c < 5; c++) {
      const bd = taoBanDo(c), ds = viTriHop(bd)
      expect(ds[0]).toEqual({ x: bd.rong / 2, y: bd.cao / 2 })
      for (const p of ds) { expect(bi(bd, p.x, p.y)).toBe(false); expect(trongBui(bd, p.x, p.y)).toBe(false) }
      for (let i = 0; i < ds.length; i++) for (let j = i + 1; j < ds.length; j++) expect(Math.hypot(ds[i].x - ds[j].x, ds[i].y - ds[j].y)).toBeGreaterThan(HOP_BK * 4)
    }
    for (const s of [0, 1, 7, 12345]) expect(loaiHopO(s, 0)).toBe(loaiHop(s))
    expect([1, 2, 3, 4, 5, 6, 7, 8].map((k) => loaiHopO(100, k))).toEqual([1, 2, 3, 4, 5, 6, 7, 8].map((k) => loaiHop(6400 + k)))
    expect([1, 2, 3, 4].map((k) => loaiHopO(3, k))).toEqual(['khien', 'sao', 'nhanh', 'mau'])
  })
  it('em chạm hộp trang k ⇒ `hn` {k: mã}; người sau chạm cùng hộp ⇒ không được; hộp tâm vẫn ở `h`; lượt hộp mới ⇒ `hn` sạch; máy bù đi ngang hộp trang ⇒ nhặt', () => {
    const m = new MaySinhTon(hat(9))
    const so = hopSo(T0)
    m.nhan('E1', 0, { p: [800, 500, 100, 1], h: so, k: 1 }, T0)
    m.nhan('E2', 1, { p: [800, 500, 100, 1], h: so, k: 1 }, T0 + 1)
    m.nhan('E3', 2, { p: [1600, 1000, 100, 1], h: so }, T0 + 2)
    let a = m.nhip(T0)!
    expect(a.hn).toEqual({ 1: 'E1' }); expect(a.h).toEqual([so, 'E3'])
    // k lạ ⇒ bỏ.
    m.nhan('E2', 1, { p: [800, 500, 100, 1], h: so, k: 99 }, T0 + 300)
    a = m.nhip(T0 + 300)!
    expect(a.hn).toEqual({ 1: 'E1' })
    const sau = (so + 1) * 20_000 + 1
    m.nhan('E1', 0, { p: [800, 500, 100, 1] }, sau); m.nhan('E2', 1, { p: [800, 500, 100, 1] }, sau); m.nhan('E3', 2, { p: [800, 500, 100, 1] }, sau)
    a = m.nhip(sau)!
    expect(a.hn).toBeUndefined()
    // Máy bù: đặt một máy lên hộp trang 2 (giữa trang phải-trên của sân 2 × 2) ⇒ nhịp kế (cùng giờ, máy không bước) phòng trao hộp.
    const may = (m as unknown as { may: { id: string; x: number; y: number; mau: number }[] }).may
    const hop2 = viTriHop(taoBanDo(0))[2]
    Object.assign(may[0], { x: hop2.x, y: hop2.y, mau: 50 })
    a = m.nhip(sau)! // cùng giờ ⇒ dt = 0, máy đứng yên trên hộp
    expect(Object.values(a.hn ?? {})).toContain(may[0].id)
  })
})

// ── VÒNG CO + HOÀ ĐIỂM ──
describe('vòng an toàn co nhanh hơn ở sân ≥ 3 × 3 trang; hoà điểm cùng hạng', () => {
  it('hệ số cuối ván: 2 × 2 · 3 × 2 ⇒ 0,42; 3 × 3 · 4 × 3 · 4 × 4 ⇒ 0,32', () => {
    expect([0, 1, 2, 3, 4].map((c) => heVongCuoi(taoBanDo(c)))).toEqual([0.42, 0.42, 0.32, 0.32, 0.32])
    for (const c of [0, 2, 4]) {
      const bd = taoBanDo(c), v = vong(bd, V0 + VAN_CHOI_MS)
      expect(v.rx).toBeCloseTo((bd.rong / 2) * heVongCuoi(bd), 6); expect(v.ry).toBeCloseTo((bd.cao / 2) * heVongCuoi(bd), 6)
    }
  })
  it('bằng điểm ⇒ cùng hạng (hạng sau nhảy cóc), chữ «Cùng …»; không còn hai đội cùng ghi trơn «Đỗ á khoa»', () => {
    const h = xepHangVan('5,3,3,1', new Map(), () => '', () => 0)
    expect(h.map((x) => [x.doi, x.xep, x.hoa])).toEqual([[0, 0, false], [1, 1, true], [2, 1, true], [3, 3, false]])
    expect(h.map((x) => chuXep(x.xep, !!x.hoa))).toEqual(['Đỗ thủ khoa', 'Cùng đỗ á khoa', 'Cùng đỗ á khoa', 'Thi lại ván sau'])
    const h2 = xepHangVan('4,4,1,0', new Map(), () => '', () => 0)
    expect(h2.map((x) => chuXep(x.xep, !!x.hoa))).toEqual(['Cùng đỗ thủ khoa', 'Cùng đỗ thủ khoa', 'Đỗ vớt', 'Thi lại ván sau'])
  })
})

// ── Byte: «chỉ gửi gần» với GUI_GAN_BK (đảm bảo hằng số không đổi khi thêm boss) ──
it('bán kính gửi gần giữ nguyên 1100', () => { expect(GUI_GAN_BK).toBe(1100) })
