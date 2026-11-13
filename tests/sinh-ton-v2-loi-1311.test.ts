// «SINH TỒN» BẢN 2 — PHẦN LÕI (thầy duyệt 13/11, docs/dac-ta-sinh-ton-v2-1311.md mục «Sáu khẩu súng», «Sân tự lớn theo sĩ số», «Máy bù mang tên như học sinh»):
// sáu cấp súng + hiệu ứng, cháy, chỉ mục vật chặn theo trang (= quét hết), tên máy bù, phiên bản giao thức.
import { describe, expect, it } from 'vitest'
import {
  BK_NV, BOT_BK, CAP_MAY_TOI_DA, CAP_TOI_DA, CHAY_MOI_GIAY, CHAY_MS, DAN_BAY_MS, NAY_BK, NHIP_BAN_MS, NO_BK, SAT_THUONG_GIAY, SO_CO_SAN, SUNG_TEN, VAN_CHOI_MS, VAN_MS,
  bi, buocToi, chanDi, chanDuong, laMay, nhanDon, satThuong, taoBanDo, taoToi, timDuong, trongBui, type BanDo, type ChuNhat, type NhanVat,
} from '../src/lib/live-khoi/sinh-ton-loi'
import { buocMay, khopMay, taoMay } from '../src/lib/live-khoi/sinh-ton-may'
import { KHO_TEN, chiSoTen, maMay, tenGoi, tenMay } from '../src/lib/live-khoi/ten-may'
import { PHIEN_BAN_ST } from '../src/lib/live-khoi/kieu'
import { MaySinhTon } from '../server/src/sinh-ton-may-chu'

const T0 = 1000 * VAN_MS + 10_000
const bd = taoBanDo(0)
const nv = (o: Partial<NhanVat> & { id: string }): NhanVat => ({ x: 0, y: 0, mau: 100, doi: 1, cap: 1, t: '', ...o })
const hat = (s: number) => () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }

describe('sáu khẩu súng', () => {
  it('đủ 6 cấp ở mọi mảng theo cấp; máy bù tối đa cấp 3; giao thức lên bản 4', () => {
    expect(SUNG_TEN).toEqual(['Súng Hạt', 'Súng Đôi', 'Súng Bọt', 'Súng Sấm', 'Súng Lửa Màu', 'Pháo Sao'])
    expect([CAP_TOI_DA, CAP_MAY_TOI_DA, PHIEN_BAN_ST]).toEqual([6, 3, 4])
    for (const m of [SAT_THUONG_GIAY, NHIP_BAN_MS, DAN_BAY_MS]) expect(m).toHaveLength(6)
    expect([...SAT_THUONG_GIAY]).toEqual([34, 42, 50, 58, 66, 74])
    // Cấp 3 bọt hơi chậm hơn cấp 2; Pháo Sao chậm nhất; đạn luôn tới trước phát kế.
    expect(NHIP_BAN_MS[2]).toBeGreaterThan(NHIP_BAN_MS[1]); expect(Math.max(...NHIP_BAN_MS)).toBe(NHIP_BAN_MS[5])
    for (let i = 0; i < 6; i++) expect(DAN_BAY_MS[i]).toBeLessThan(NHIP_BAN_MS[i])
    expect([BOT_BK, NAY_BK, NO_BK, CHAY_MS, CHAY_MOI_GIAY]).toEqual([40, 90, 60, 2000, 8])
  })
  const toi = { id: 'T', x: 800, y: 700, doi: 0 }
  const ban = (cap: number, t = 'M') => nv({ id: 'A', x: 1000, y: 700, t, cap })
  it('cấp 3 Súng Bọt: vỡ ra — nửa sát thương lên MỌI đối thủ khác trong bán kính 40 quanh mục tiêu', () => {
    const mt = nv({ id: 'M', x: 835, y: 700, doi: 0 }) // cách T 35
    expect(satThuong(toi, [ban(3), mt], 1)).toEqual({ tong: 25, ai: 'A', chay: '' })
    expect(satThuong(toi, [ban(3), { ...mt, x: 845 }], 1).tong).toBe(0) // cách 45 ⇒ ngoài bọt
    // Có bạn khác đứng gần mục tiêu hơn vẫn dính (bọt vỡ lên mọi người, không như sấm chỉ nảy một người).
    expect(satThuong(toi, [ban(3), mt, nv({ id: 'N', x: 830, y: 700, doi: 0 })], 1).tong).toBe(25)
    // Máy bù bắn bọt yếu hơn người.
    expect(satThuong(toi, [{ ...ban(3), id: '~2-0' }, mt], 1).tong).toBeCloseTo(25 * 0.67)
    // Mục tiêu là đồng đội của bên bắn (gói sai) / đã bị hạ ⇒ không vỡ.
    expect(satThuong(toi, [ban(3), { ...mt, doi: 1 }], 1).tong).toBe(0); expect(satThuong(toi, [ban(3), { ...mt, mau: 0 }], 1).tong).toBe(0)
  })
  it('cấp 4 Súng Sấm: nảy sang MỘT đối thủ gần mục tiêu nhất trong 90; cấp 6 Pháo Sao: nổ lan bán kính 60', () => {
    const mt = nv({ id: 'M', x: 880, y: 700, doi: 0 }) // cách T 80
    expect(satThuong(toi, [ban(4), mt], 1).tong).toBe(29)
    expect(satThuong(toi, [ban(4), { ...mt, x: 895 }], 1).tong).toBe(0) // cách 95
    expect(satThuong(toi, [ban(4), mt, nv({ id: 'N', x: 900, y: 700, doi: 2 })], 1).tong).toBe(0) // N gần mục tiêu hơn ⇒ sấm sang N
    expect(satThuong(toi, [ban(6), mt], 1).tong).toBe(0)
    expect(satThuong(toi, [ban(6), { ...mt, x: 855 }], 1).tong).toBe(37)
    expect(satThuong(toi, [ban(6), { ...mt, x: 855 }, nv({ id: 'N', x: 850, y: 700, doi: 0 })], 1).tong).toBe(37) // nổ lan lên mọi người
  })
  it('cấp 5 Súng Lửa Màu: chỉ trúng thẳng mới cháy (không lan); cấp khác không cháy', () => {
    const mt = nv({ id: 'M', x: 830, y: 700, doi: 0 })
    expect(satThuong(toi, [ban(5, 'T')], 1)).toEqual({ tong: 66, ai: 'A', chay: 'A' })
    expect(satThuong(toi, [ban(5), mt], 1)).toEqual({ tong: 0, ai: '', chay: '' })
    for (const cap of [1, 2, 3, 4, 6]) expect(satThuong(toi, [ban(cap, 'T')], 1).chay).toBe('')
    // Ngoài tầm xa ⇒ không trúng, không cháy.
    expect(satThuong(toi, [{ ...ban(5, 'T'), x: 800 + 700 }], 1)).toEqual({ tong: 0, ai: '', chay: '' })
  })
  it('đồng đội không bao giờ hạ nhau ở cả 6 cấp (bắn thẳng, bọt, sấm, lửa, nổ lan)', () => {
    const doiThu = nv({ id: 'X', x: 820, y: 700, doi: 2 })
    for (let cap = 1; cap <= 6; cap++) {
      expect(satThuong(toi, [nv({ id: 'D', x: 900, y: 700, doi: 0, cap, t: 'T' })], 1)).toEqual({ tong: 0, ai: '', chay: '' })
      expect(satThuong(toi, [nv({ id: 'D', x: 900, y: 700, doi: 0, cap, t: 'X' }), doiThu], 1)).toEqual({ tong: 0, ai: '', chay: '' })
    }
  })
})

describe('cháy (Súng Lửa Màu)', () => {
  const dung = (tt: ReturnType<typeof taoToi>) => ({ ...tt, x: 800, y: 700, batTuDen: 0, lucTrung: 0 })
  it('bé ma của em: trúng ⇒ cháy đúng 2 giây, tổng 16 máu sau phát trúng cuối, rồi hết (khung hình đều hay giật cũng vậy)', () => {
    for (const buoc of [16, 33, 250, 700]) {
      let tt = nhanDon(dung(taoToi(bd, 0, T0)), 10, T0, 'K')
      expect([tt.mau, tt.chayDen, tt.chayAi]).toEqual([90, T0 + CHAY_MS, 'K'])
      for (let t = T0 + buoc; t <= T0 + 4000; t += buoc) tt = buocToi(bd, tt, { dx: 0, dy: 0 }, buoc, t)
      expect(tt.mau, `bước ${buoc} ms`).toBeCloseTo(90 - 16, 6)
    }
    // Phát trúng mới giữa chừng ⇒ châm lại 2 giây từ phát đó.
    let tt = nhanDon(dung(taoToi(bd, 0, T0)), 10, T0, 'K')
    for (let t = T0 + 100; t <= T0 + 1000; t += 100) tt = buocToi(bd, tt, { dx: 0, dy: 0 }, 100, t)
    tt = nhanDon(tt, 10, T0 + 1000, 'K')
    for (let t = T0 + 1100; t <= T0 + 5000; t += 100) tt = buocToi(bd, tt, { dx: 0, dy: 0 }, 100, t)
    expect(tt.mau).toBeCloseTo(100 - 20 - 8 - 16, 6)
  })
  it('cháy hết máu ⇒ bị hạ, giữ mã kẻ châm lửa; chết vì vòng an toàn ⇒ không ai; bất tử / nghỉ giữa ván không cháy; hồi sinh hết cháy', () => {
    let tt = nhanDon({ ...dung(taoToi(bd, 0, T0)), mau: 12 }, 5, T0, 'K')
    for (let t = T0 + 100; t <= T0 + 2000 && tt.mau > 0; t += 100) tt = buocToi(bd, tt, { dx: 0, dy: 0 }, 100, t)
    expect([tt.mau, tt.chayAi, tt.chayDen]).toEqual([0, 'K', 0]); expect(tt.chetDen).toBeGreaterThan(T0)
    const song = buocToi(bd, tt, { dx: 0, dy: 0 }, 16, tt.chetDen)
    expect([song.mau, song.chayDen, song.chayAi]).toEqual([100, 0, ''])
    // Vòng an toàn: cuối ván, đứng ở trại, máu sắp hết, có vết cháy cũ đã tắt ⇒ chayAi xoá.
    const cuoi = 1000 * VAN_MS + VAN_CHOI_MS - 1000
    const vong = buocToi(bd, { ...dung(taoToi(bd, 0, T0)), x: bd.trai[0].x, y: bd.trai[0].y, mau: 0.1, chayDen: cuoi - 5000, chayAi: 'K' }, { dx: 0, dy: 0 }, 100, cuoi)
    expect([vong.mau, vong.chayAi]).toEqual([0, ''])
    // Đang bất tử ⇒ không cháy; nghỉ giữa ván ⇒ không cháy, không nhận đạn.
    const batTu = { ...dung(taoToi(bd, 0, T0)), batTuDen: T0 + 5000, chayDen: T0 + 2000, chayAi: 'K' }
    expect(buocToi(bd, batTu, { dx: 0, dy: 0 }, 100, T0 + 100).mau).toBe(100)
    const nghi = 1000 * VAN_MS + VAN_CHOI_MS + 1000
    expect(buocToi(bd, { ...batTu, batTuDen: 0, chayDen: nghi + 1000 }, { dx: 0, dy: 0 }, 100, nghi).mau).toBe(100)
    expect(nhanDon(dung(taoToi(bd, 0, T0)), 10, nghi, 'K').chayDen).toBe(0)
  })
  it('máy bù: một nhịp trúng Lửa Màu ⇒ cháy thêm đúng 16 máu trong 2 giây; cháy hết máu ⇒ trả mã kẻ châm lửa', () => {
    const r = hat(5)
    const m = { ...taoMay(bd, '~0-0', 0, T0, 0), x: 800, y: 700, batTuDen: 0 }
    const lua = nv({ id: 'K', x: 900, y: 700, t: m.id, cap: 5 })
    buocMay(bd, m, [lua], T0, 250, r)
    expect(m.mau).toBeCloseTo(100 - 66 * 0.25, 6); expect([m.chayDen, m.chayAi]).toEqual([T0 + CHAY_MS, 'K'])
    for (let t = T0 + 250; t <= T0 + 2750; t += 250) buocMay(bd, m, [], t, 250, r)
    expect(m.mau).toBeCloseTo(100 - 66 * 0.25 - 16, 6)
    // Cháy hết máu: máy còn 10 máu trúng một phát 0,25 giây (16,5) ⇒ hạ ngay bởi K; còn 20 máu ⇒ sống, rồi cháy hạ ⇒ vẫn trả K.
    const n = { ...taoMay(bd, '~1-1', 0, T0, 0), x: 800, y: 700, batTuDen: 0, mau: 20 }
    expect(buocMay(bd, n, [{ ...lua, t: n.id }], T0, 250, r)).toBe('')
    let ai = ''
    for (let t = T0 + 250; t <= T0 + 2250 && !ai; t += 250) ai = buocMay(bd, n, [], t, 250, r)
    expect(ai).toBe('K'); expect(n.chayDen).toBe(0)
  })
})

// Bản sao quét-hết (cách bản 1) để so với chỉ mục theo trang: cùng phép cắt theo tấm, cùng biên.
function catHopGoc(c: ChuNhat, x1: number, y1: number, x2: number, y2: number, noi: number): boolean {
  const xa = c.x - noi, xb = c.x + c.w + noi, ya = c.y - noi, yb = c.y + c.h + noi
  if ((x1 < xa && x2 < xa) || (x1 > xb && x2 > xb) || (y1 < ya && y2 < ya) || (y1 > yb && y2 > yb)) return false
  let t0 = 0, t1 = 1
  const tam = (p: number, q: number): boolean => {
    if (p === 0) return q >= 0
    const r = q / p
    if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r } else { if (r < t0) return false; if (r < t1) t1 = r }
    return true
  }
  const dx = x2 - x1, dy = y2 - y1
  return tam(-dx, x1 - xa) && tam(dx, xb - x1) && tam(-dy, y1 - ya) && tam(dy, yb - y1) && t0 <= t1
}
const chanDuongGoc = (b: BanDo, x1: number, y1: number, x2: number, y2: number) => b.chan.some((c) => catHopGoc(c, x1, y1, x2, y2, 0))
const chanDiGoc = (b: BanDo, x1: number, y1: number, x2: number, y2: number) => b.chan.some((c) => catHopGoc(c, x1, y1, x2, y2, BK_NV + 1))
const biGoc = (b: BanDo, x: number, y: number) => b.chan.some((c) => x > c.x - BK_NV && x < c.x + c.w + BK_NV && y > c.y - BK_NV && y < c.y + c.h + BK_NV)
const trongBuiGoc = (b: BanDo, x: number, y: number) => b.bui.some((u) => { const dx = (x - u.x - u.w / 2) / (u.w / 2), dy = (y - u.y - u.h / 2) / (u.h / 2); return dx * dx + dy * dy <= 1 })

describe('chỉ mục vật chặn theo trang (tốc độ sân 4 × 4) = quét hết', () => {
  it('mỗi cỡ ≥ 20 000 truy vấn ngẫu nhiên + truy vấn hiểm (mép trang, góc trang, đoạn dài 0, đoạn song song trục, ngoài sân, sát mép vật): 0 sai khác', () => {
    for (let c = 0; c < SO_CO_SAN; c++) {
      const b = taoBanDo(c), r = hat(100 + c)
      const rk = b.rong / b.ngang, ck = b.cao / b.doc
      // Điểm: 1/4 ngẫu nhiên, 1/4 đúng mép trang, 1/4 sát mép một vật chặn / bụi, 1/4 lệch ra ngoài sân.
      const diem = (): [number, number] => {
        const k = r()
        if (k < 0.25) return [r() * b.rong, r() * b.cao]
        if (k < 0.5) return [Math.round(r() * b.ngang) * rk + (r() < 0.5 ? 0 : (r() - 0.5) * 4), Math.round(r() * b.doc) * ck + (r() < 0.5 ? 0 : (r() - 0.5) * 4)]
        if (k < 0.75) {
          const v = r() < 0.7 ? b.chan[Math.floor(r() * b.chan.length)] : b.bui[Math.floor(r() * b.bui.length)]
          const noi = [0, BK_NV, BK_NV + 1, BK_NV + 2][Math.floor(r() * 4)] * (r() < 0.5 ? 1 : -1)
          return r() < 0.5 ? [v.x - noi, v.y + r() * v.h] : [v.x + r() * v.w, v.y + v.h + noi]
        }
        return [-60 + r() * (b.rong + 120), -60 + r() * (b.cao + 120)]
      }
      let saiDuong = 0, saiDi = 0, saiBi = 0, saiBui = 0, n = 0, chanThay = 0
      for (let i = 0; i < 24_000; i++) {
        const [x1, y1] = diem()
        let x2: number, y2: number
        const k = r()
        if (k < 0.1) { x2 = x1; y2 = y1 } // đoạn dài 0
        else if (k < 0.25) { x2 = x1 + (r() - 0.5) * 1400; y2 = y1 } // song song trục ngang
        else if (k < 0.4) { x2 = x1; y2 = y1 + (r() - 0.5) * 1400 }
        else if (k < 0.55) { x2 = x1 + (r() < 0.5 ? -1 : 1) * (rk + r() * 300); y2 = y1 + (r() < 0.5 ? -1 : 1) * (ck + r() * 300) } // cắt hai mép trang hai trục
        else [x2, y2] = r() < 0.5 ? diem() : [x1 + (r() - 0.5) * 1320, y1 + (r() - 0.5) * 1320]
        n++
        const a = chanDuong(b, x1, y1, x2, y2)
        if (a) chanThay++
        if (a !== chanDuongGoc(b, x1, y1, x2, y2)) saiDuong++
        if (chanDi(b, x1, y1, x2, y2) !== chanDiGoc(b, x1, y1, x2, y2)) saiDi++
        if (bi(b, x1, y1) !== biGoc(b, x1, y1)) saiBi++
        if (trongBui(b, x1, y1) !== trongBuiGoc(b, x1, y1)) saiBui++
      }
      expect({ c, n, saiDuong, saiDi, saiBi, saiBui }).toEqual({ c, n: 24_000, saiDuong: 0, saiDi: 0, saiBi: 0, saiBui: 0 })
      expect(chanThay).toBeGreaterThan(3000) // bộ truy vấn có nhiều đoạn bị chắn thật, không chỉ đoạn trống
      // Toạ độ hỏng: kết quả như quét hết.
      expect(chanDuong(b, Number.NaN, 5, 100, 100)).toBe(chanDuongGoc(b, Number.NaN, 5, 100, 100))
      expect(bi(b, Number.NaN, 5)).toBe(biGoc(b, Number.NaN, 5)); expect(trongBui(b, Number.NaN, 5)).toBe(false)
    }
  })
  it('sân 4 × 4: một trang chỉ giữ phần nhỏ vật chặn; A* qua cả sân cho đường không khúc nào cắt vật chặn', () => {
    const b = taoBanDo(4)
    expect(b.chan.length).toBeGreaterThan(500)
    expect(Math.max(...b.chanTrang.map((t) => t.length))).toBeLessThan(b.chan.length / 8)
    for (const [d0, d1] of [[0, 3], [1, 2], [0, 1]]) {
      const a = b.trai[d0], z = b.trai[d1], duong = timDuong(b, a.x, a.y, z.x, z.y)
      expect(duong.at(-1)).toEqual(z)
      let x = a.x, y = a.y
      for (const p of duong) { expect(chanDiGoc(b, x, y, p.x, p.y)).toBe(false); x = p.x; y = p.y }
    }
  })
})

describe('máy bù mang tên như học sinh', () => {
  it('kho ≥ 80 tên gọi 2 chữ, không trùng; `tenMay` đọc đúng mã máy, mã sai ⇒ null', () => {
    expect(KHO_TEN.length).toBeGreaterThanOrEqual(80)
    expect(new Set(KHO_TEN.map(tenGoi)).size).toBe(KHO_TEN.length)
    for (const t of KHO_TEN) { expect(t.split(' '), t).toHaveLength(2); expect(t, t).toBe(t.normalize('NFC')); expect(t.length).toBeLessThanOrEqual(16) }
    expect(tenMay('~0-3')).toBe('Bảo Ngọc'); expect(tenMay(maMay(5, 12))).toBe('Đăng Khoa'); expect(laMay(maMay(5, 12))).toBe(true)
    for (const sai of ['~0', '0-1', 'S1', '', '~-1-2', '~a-1', `~${KHO_TEN.length}-0`, '~1-2-3', '~1-', '~01x-2']) expect(tenMay(sai), sai).toBeNull()
    expect(tenMay(null as unknown as string)).toBeNull()
  })
  it('khopMay: tên không trùng em thật (so tên gọi 2 chữ cuối, không phân biệt hoa thường) và không trùng nhau; mã duy nhất; tên giữ nguyên khi máy còn trên sân', () => {
    const r = hat(9)
    // Lớp có 70 em trùng tên trong kho (có em ghi cả họ, chữ hoa) ⇒ 16 máy phải lấy trong số tên còn lại.
    const lop = KHO_TEN.slice(0, 70).map((t, i) => (i % 3 === 0 ? `Nguyễn Văn ${t.toUpperCase()}` : t))
    let goi = 0
    const tranh = () => { goi++; return lop }
    const may = khopMay(bd, [], [0, 0, 0, 0], T0, r, tranh)
    expect(may).toHaveLength(16); expect(goi).toBe(1)
    const so = may.map((m) => chiSoTen(m.id))
    expect(so.every((i) => i >= 70)).toBe(true)
    expect(new Set(so).size).toBe(16); expect(new Set(may.map((m) => m.id)).size).toBe(16)
    for (const m of may) { expect(laMay(m.id)).toBe(true); expect(lop.map(tenGoi)).not.toContain(tenGoi(tenMay(m.id)!)) }
    // Đủ máy rồi ⇒ không hỏi danh sách tên; máy cũ giữ nguyên mã (tên ổn định suốt ván).
    const lai = khopMay(bd, may, [0, 0, 0, 0], T0 + 250, r, tranh)
    expect(goi).toBe(1); expect(lai.map((m) => m.id).sort()).toEqual(may.map((m) => m.id).sort())
    // Một em vào đội 0 rồi rời ⇒ máy mới không trùng tên / mã máy đang có.
    const bot = khopMay(bd, lai, [1, 0, 0, 0], T0 + 500, r, tranh)
    const them = khopMay(bd, bot, [0, 0, 0, 0], T0 + 750, r, tranh)
    expect(them).toHaveLength(16); expect(new Set(them.map((m) => chiSoTen(m.id))).size).toBe(16); expect(new Set(them.map((m) => m.id)).size).toBe(16)
    expect(them.map(({ id }) => tenGoi(tenMay(id)!)).some((t) => lop.map(tenGoi).includes(t))).toBe(false)
    // Kho cạn (cả lớp trùng hết kho): vẫn đủ máy, tên giữa các máy vẫn không trùng.
    const can = khopMay(bd, [], [0, 0, 0, 0], T0, r, () => KHO_TEN)
    expect(new Set(can.map((m) => chiSoTen(m.id))).size).toBe(16)
  })
  it('máy chủ (MaySinhTon): máy bù tránh tên do nơi dùng đưa vào; mỗi máy một tên', () => {
    const m = new MaySinhTon(() => 0.5, () => KHO_TEN.slice(0, 60))
    m.nhan('S1', 0, { p: [800, 500, 100, 1] }, T0)
    const anh = m.nhip(T0 + 250)!
    const may = Object.keys(anh.ds).filter(laMay)
    expect(may).toHaveLength(15)
    expect(may.every((id) => chiSoTen(id) >= 60 && tenMay(id) !== null)).toBe(true)
    expect(new Set(may.map(tenMay)).size).toBe(15)
  })
})
