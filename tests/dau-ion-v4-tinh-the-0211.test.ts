// @vitest-environment node
// «ĐẤU NGUYÊN TỬ» v4 — THÁP · TƯỜNG · TINH THỂ (thầy 02/11 tối: «mỗi bên một tinh thể, bên nào tinh thể bị bắn vỡ trước là thua» · «chướng ngại vật biến thành
// tháp bảo vệ tinh thể, tự bắn khi bị xâm phạm lãnh thổ … bỏ hết chướng ngại … tinh thể có lớp tường chắn nhưng tường này có thể bị phá» · «Chốt hết build đi»).
// Khoá: tường kín (không bắn tỉa tinh thể khi tường còn), BẢO HỘ, tháp chỉ bắn kẻ lấn vùng, muốn bắn tháp phải vào vùng tháp, phá tháp ⇒ cả phe +1 cấp,
// vỡ tinh thể ⇒ thua ngay, hết giờ xét máu tinh thể, trung hoà đạn, bệ hồi sinh trong vùng tháp lớn, cân bằng (mô phỏng A.I).
import { describe, expect, it } from 'vitest'
import { BE_PHE, KHOI, MAU_KHOI_DAU, R, SAN_H, SAN_W, SO_KHOI, TAM_KHOI, TT_CUA, TUONG_DAY, TUONG_R, aiDi, buocTran, chonKhoi, danhDuoc, dungVatCan, laySuKien, taoTran, thayNhau, type SuKien, type Tran } from '../src/lib/dau-ion/loi'

const xa = (ax: number, ay: number, bx: number, by: number) => Math.hypot(bx - ax, by - ay)
function tran(phe: number[]): Tran {
  const tr = taoTran(phe.map((p, i) => ({ id: i + 1, nt: i % 7, phe: p })), 7)
  tr.vp = []; tr.su = []; tr.henXt = 1e9; tr.henKh = 1e9
  for (const g of tr.ghe) { g.che = 0; g.x = -1000 - g.id * 100; g.y = 40; g.nap = 9 }
  return tr
}
const chay = (tr: Tran, giay: number, buoc = 1 / 20) => { const su: SuKien[] = []; for (let t = 0; t < giay - 1e-9; t += buoc) { buocTran(tr, buoc); su.push(...laySuKien(tr)) } return su }

describe('Bố cục khối', () => {
  it('mỗi phe 2 tháp cánh + 1 tháp lớn + 3 mảnh tường + 1 tinh thể; máu 20 / 30 / 8 / 24; đối xứng tâm', () => {
    expect(SO_KHOI).toBe(14)
    expect(KHOI.slice(0, 7).map((k) => k.k)).toEqual(['thap', 'thap', 'thap-lon', 'tuong', 'tuong', 'tuong', 'tt'])
    expect(MAU_KHOI_DAU.slice(0, 7)).toEqual([20, 20, 30, 8, 8, 8, 24])
    for (let i = 0; i < 7; i++) { expect(KHOI[i].x + KHOI[i + 7].x).toBeCloseTo(SAN_W, 6); expect(KHOI[i].y + KHOI[i + 7].y).toBeCloseTo(SAN_H, 6) }
  })
  it('muốn bắn tháp phải bước vào vùng tháp: tầm ngắm khối + bán kính tháp < vùng tháp', () => {
    for (const k of KHOI) if (k.vung) expect(TAM_KHOI + k.r).toBeLessThan(k.vung)
  })
  it('bệ hồi sinh: nằm trong vùng tháp lớn phe mình, ngoài tường, không chạm khối', () => {
    for (const p of [0, 1]) for (const [x, y] of BE_PHE[p]) {
      const lon = KHOI[p * 7 + 2], tt = KHOI[TT_CUA[p]]
      expect(xa(x, y, lon.x, lon.y)).toBeLessThan(lon.vung!)
      expect(xa(x, y, tt.x, tt.y)).toBeGreaterThan(TUONG_R + TUONG_DAY + R)
      expect(dungVatCan(x, y, R)).toBe(false)
    }
  })
  it('TƯỜNG KÍN: tường còn nguyên ⇒ không điểm nào trên sân (bước 10) thấy được tinh thể (không bắn tỉa, không khe)', () => {
    const km = [...MAU_KHOI_DAU]
    for (const p of [0, 1]) {
      const i = TT_CUA[p], t = KHOI[i]
      let thay = 0
      for (let x = R; x <= SAN_W - R; x += 10) for (let y = R; y <= SAN_H - R; y += 10) {
        if (xa(x, y, t.x, t.y) <= TUONG_R + TUONG_DAY + 2 || dungVatCan(x, y, R, km)) continue
        if (thayNhau(x, y, t.x, t.y, km, i)) thay++
      }
      expect(thay).toBe(0)
    }
  }, 60_000)
  it('vỡ một mảnh tường ⇒ có chỗ đứng thấy tinh thể qua khe', () => {
    const km = [...MAU_KHOI_DAU]; km[4] = 0
    const t = KHOI[6]
    const a = (30 * Math.PI) / 180 // giữa cung mảnh giữa (−42…42°), lệch khỏi tháp lớn ở hướng 0°
    expect(thayNhau(t.x + Math.cos(a) * 140, t.y + Math.sin(a) * 140, t.x, t.y, km, 6)).toBe(true)
    km[4] = MAU_KHOI_DAU[4]
    expect(thayNhau(t.x + Math.cos(a) * 140, t.y + Math.sin(a) * 140, t.x, t.y, km, 6)).toBe(false)
  })
})

describe('Bảo hộ', () => {
  it('tháp cánh: luôn; tháp lớn: sau khi vỡ một tháp cánh; tường cánh: sau tháp cánh cùng cánh; tường giữa: sau tháp lớn; tinh thể: luôn', () => {
    const km = [...MAU_KHOI_DAU]
    expect([0, 1, 2, 3, 4, 5, 6].map((i) => danhDuoc(km, i))).toEqual([true, true, false, false, false, false, true])
    km[0] = 0
    expect([1, 2, 3, 4, 5].map((i) => danhDuoc(km, i))).toEqual([true, true, true, false, false])
    km[2] = 0
    expect([4, 5].map((i) => danhDuoc(km, i))).toEqual([true, false])
  })
  it('đạn trúng khối đang bảo hộ ⇒ sự kiện «chặn», máu giữ nguyên; hết bảo hộ ⇒ trừ máu', () => {
    const tr = tran([0])
    tr.km = tr.km.map((m, i) => (KHOI[i].k === 'thap' || KHOI[i].k === 'thap-lon' ? 0 : m)); tr.km[7] = tr.km[8] = MAU_KHOI_DAU[7] // tháp cánh Axit còn
    const w = KHOI[11], am = (w.a0! + w.a1!) / 2, tx = w.x + Math.cos(am) * w.r, ty = w.y + Math.sin(am) * w.r // tường giữa Axit
    const ban = () => tr.dan.push({ chu: 1, nt: 0, phe: 0, cap: 1, x: tx - 60, y: ty, vx: 520, vy: 0, con: 460 })
    tr.km[9] = MAU_KHOI_DAU[9] // tháp lớn Axit còn ⇒ tường giữa đang bảo hộ
    ban(); let su = chay(tr, 0.3)
    expect(su.find((s) => s.t === 'kh')).toMatchObject({ k: 11, chan: true, mau: 8 })
    tr.km[9] = 0; ban(); su = chay(tr, 0.3)
    expect(su.find((s) => s.t === 'kh')).toMatchObject({ k: 11, chan: false, mau: 7 })
  })
})

describe('Tháp tự bắn', () => {
  it('chỉ bắn người phe kia ĐANG Ở TRONG VÙNG; đồng đội và người ngoài vùng không bị bắn', () => {
    const tr = tran([0, 1])
    const t = KHOI[0] // tháp cánh Bazơ
    Object.assign(tr.ghe[0], { x: t.x + 60, y: t.y + 40, nap: 99 }) // đồng đội trong vùng
    const dich = Object.assign(tr.ghe[1], { x: t.x + t.vung! + 30, y: t.y, nap: 99 })
    expect(chay(tr, 1).filter((s) => s.t === 'tb' && s.k === 0)).toHaveLength(0)
    Object.assign(dich, { x: t.x + t.vung! - 30, y: t.y })
    const su = chay(tr, 1.3)
    expect(su.filter((s) => s.t === 'tb' && s.k === 0).length).toBeGreaterThanOrEqual(2)
    expect(su.some((s) => s.t === 'trung' && s.ai === 2 && s.boi === 0)).toBe(true)
  })
  it('chonKhoi: tháp phe kia chỉ ngắm được trong tầm 150', () => {
    const t = KHOI[7]
    expect(chonKhoi([...MAU_KHOI_DAU], { x: t.x - t.r - 140, y: t.y, phe: 0 })).toBe(7)
    expect(chonKhoi([...MAU_KHOI_DAU], { x: t.x - t.r - 160, y: t.y, phe: 0 })).toBe(-1)
  })
  it('phá tháp ⇒ sự kiện «vỡ» + CẢ PHE KIA lên 1 cấp; tháp vỡ không bắn nữa, đi xuyên được', () => {
    const tr = tran([0, 0, 1])
    tr.km[7] = 1
    const t = KHOI[7]
    tr.dan.push({ chu: 1, nt: 0, phe: 0, cap: 1, x: t.x - t.r - 30, y: t.y, vx: 520, vy: 0, con: 460 })
    const su = chay(tr, 0.2)
    expect(su.some((s) => s.t === 'vo' && s.k === 7)).toBe(true)
    expect(tr.ghe.filter((g) => g.phe === 0).every((g) => g.cap === 2)).toBe(true)
    expect(tr.ghe.find((g) => g.phe === 1)!.cap).toBe(1)
    expect(dungVatCan(t.x, t.y, R, tr.km)).toBe(false)
  })
})

describe('Thắng / thua', () => {
  it('tinh thể vỡ ⇒ hết ván NGAY, phe kia thắng (lý do «vo»)', () => {
    const tr = tran([0, 1])
    tr.km[13] = 1; tr.km[11] = 0
    const t = KHOI[13]
    tr.dan.push({ chu: 1, nt: 0, phe: 0, cap: 1, x: t.x - 120, y: t.y, vx: 520, vy: 0, con: 460 })
    chay(tr, 0.4)
    expect(tr.xong).toBe(true); expect(tr.thang).toBe(0); expect(tr.lyDo).toBe('vo')
    expect(tr.con).toBeGreaterThan(100)
  })
  it('hết 2 phút: phe còn nhiều máu tinh thể hơn thắng; bằng nhau ⇒ hoà', () => {
    const a = tran([0, 1]); a.km[6] = 12; a.km[13] = 20; chay(a, 121, 0.5)
    expect(a.xong).toBe(true); expect(a.lyDo).toBe('gio'); expect(a.thang).toBe(1)
    const b = tran([0, 1]); chay(b, 121, 0.5)
    expect(b.thang).toBe(2)
  })
})

describe('Trung hoà', () => {
  it('hai viên KHÁC phe chạm nhau giữa đường ⇒ cùng mất + sự kiện «th» (H⁺ + OH⁻ → H₂O); cùng phe ⇒ bay qua nhau', () => {
    const tr = tran([0, 1])
    tr.dan.push({ chu: 1, nt: 0, phe: 0, cap: 1, x: 480, y: 470, vx: 520, vy: 0, con: 460 }, { chu: 2, nt: 1, phe: 1, cap: 1, x: 560, y: 470, vx: -520, vy: 0, con: 460 })
    const su = chay(tr, 0.15)
    expect(su.filter((s) => s.t === 'th')).toHaveLength(1)
    expect(tr.dan).toHaveLength(0)
    const tr2 = tran([0, 0])
    tr2.dan.push({ chu: 1, nt: 0, phe: 0, cap: 1, x: 480, y: 470, vx: 520, vy: 0, con: 460 }, { chu: 2, nt: 1, phe: 0, cap: 1, x: 560, y: 470, vx: -520, vy: 0, con: 460 })
    expect(chay(tr2, 0.15).some((s) => s.t === 'th')).toBe(false)
  })
})

describe('Cân bằng (mô phỏng 6 A.I — số đo DAC-TA mục THÁP + TƯỜNG)', () => {
  it('60 ván: đa số kết thúc bằng VỠ TINH THỂ, trung vị ≤ 115 giây, hai phe đều thắng được, mọi ván có phá khối', () => {
    const t: number[] = [], th = [0, 0, 0]
    let vo = 0, khongPha = 0
    for (let v = 0; v < 60; v++) {
      const tr = taoTran(Array.from({ length: 6 }, (_, i) => ({ id: 200 + i, nt: i % 7, ai: true, phe: i < 3 ? 0 : 1 })), 1000 + v * 7919)
      while (!tr.xong) { for (const g of tr.ghe) g.yd = aiDi(tr, g, 1 / 20); buocTran(tr, 1 / 20); laySuKien(tr) }
      t.push(tr.t); th[tr.thang]++; if (tr.lyDo === 'vo') vo++
      if (tr.km.every((m, i) => m === MAU_KHOI_DAU[i])) khongPha++
    }
    t.sort((a, b) => a - b)
    console.log(`[dau-ion-v4] 60 ván: trung vị ${t[30].toFixed(0)} s · p25 ${t[15].toFixed(0)} s · vỡ tinh thể ${vo}/60 · Bazơ ${th[0]} · Axit ${th[1]} · hoà ${th[2]}`)
    expect(vo).toBeGreaterThanOrEqual(30)
    expect(t[30]).toBeLessThanOrEqual(115)
    expect(Math.min(th[0], th[1])).toBeGreaterThanOrEqual(15)
    expect(khongPha).toBe(0)
  }, 240_000)
})

// Tối ưu tầm nhìn (02/11 khuya, đo CPU ×6): loại nhanh khối xa đường ngắm + đầu tường tính sẵn — KẾT QUẢ PHẢI Y HỆT cách tính cũ (thử từng điểm × mọi khối).
describe('tầm nhìn tối ưu = cách tính cũ', () => {
  it('20 000 đường ngắm + điểm ngẫu nhiên, nhiều trạng thái khối vỡ: thayNhau / chamKhoi trùng khớp bản tham chiếu', async () => {
    const L = await import('../src/lib/dau-ion/loi')
    const PI2 = Math.PI * 2
    const trongCung = (a: number, a0: number, a1: number) => { let d = a - a0; d -= Math.floor(d / PI2) * PI2; let w = a1 - a0; w -= Math.floor(w / PI2) * PI2; return d <= w }
    const chamCu = (i: number, x: number, y: number, r: number) => {
      const k = L.KHOI[i]
      if (k.k !== 'tuong') return (x - k.x) ** 2 + (y - k.y) ** 2 < (k.r + r) ** 2
      const dx = x - k.x, dy = y - k.y, d = Math.hypot(dx, dy)
      if (Math.abs(d - k.r) < L.TUONG_DAY + r && trongCung(Math.atan2(dy, dx), k.a0!, k.a1!)) return true
      for (const a of [k.a0!, k.a1!]) { const ex = k.x + Math.cos(a) * k.r, ey = k.y + Math.sin(a) * k.r; if ((x - ex) ** 2 + (y - ey) ** 2 < (L.TUONG_DAY + r) ** 2) return true }
      return false
    }
    const thayCu = (ax: number, ay: number, bx: number, by: number, km: number[], bo: number) => {
      const n = Math.ceil(Math.hypot(bx - ax, by - ay) / 10)
      for (let i = 1; i < n; i++) { const x = ax + ((bx - ax) * i) / n, y = ay + ((by - ay) * i) / n; for (let j = 0; j < L.SO_KHOI; j++) if (j !== bo && km[j] > 0 && chamCu(j, x, y, L.R_DAN - 2)) return false }
      return true
    }
    let s = 12345; const rd = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648 }
    let lech = 0
    for (let t = 0; t < 20000; t++) {
      const km = L.KHOI.map((k) => (rd() < 0.25 ? 0 : k.max))
      const ax = rd() * L.SAN_W, ay = rd() * L.SAN_H, bx = rd() * L.SAN_W, by = rd() * L.SAN_H, bo = rd() < 0.3 ? Math.floor(rd() * L.SO_KHOI) : -1
      if (L.thayNhau(ax, ay, bx, by, km, bo) !== thayCu(ax, ay, bx, by, km, bo)) lech++
      const i = Math.floor(rd() * L.SO_KHOI), r = rd() * 30
      if (L.chamKhoi(i, ax, ay, r) !== chamCu(i, ax, ay, r)) lech++
    }
    expect(lech).toBe(0)
  })
})
