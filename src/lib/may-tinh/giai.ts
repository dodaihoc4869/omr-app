// MÁY TÍNH FX4869 — GIẢI: phương trình bậc 2–4, hệ bậc nhất 2–4 ẩn, thống kê một biến. Hệ số hữu tỉ ⇒ nghiệm hữu tỉ ra ĐÚNG phân số
// (tách nghiệm hữu tỉ bằng chia đa thức chính xác); phần còn lại tính số thực.
import { LoiTinh, bangKhong, can, chia, cong, dau, doi, kiem, laPs, nguyen, nhan, ps, soSanh, thuc, tru, type So } from './so'

/** Một nghiệm: thực (`ao` = 0) hoặc phức `thuc ± ao·i` (ao > 0, `am` = dấu của phần ảo). */
export interface Nghiem { thuc: So; ao: So; am?: boolean }
const KHONG = nguyen(0)
const giaTri = (hs: readonly So[], x: So): So => hs.reduce<So>((s, a) => cong(nhan(s, x), a), KHONG)

function bacHai(a: So, b: So, c: So): Nghiem[] {
  const d = tru(nhan(b, b), nhan(nguyen(4), nhan(a, c))), hai = nhan(nguyen(2), a), giua = chia(doi(b), hai)
  if (dau(d) < 0) {
    const ao = chia(can(doi(d)), dau(a) < 0 ? doi(hai) : hai)
    return [{ thuc: giua, ao }, { thuc: giua, ao, am: true }]
  }
  if (bangKhong(d)) return [{ thuc: giua, ao: KHONG }]
  const r = can(d)
  if (laPs(r) && laPs(a) && laPs(b)) return [chia(cong(doi(b), r), hai), chia(tru(doi(b), r), hai)].sort((x, y) => soSanh(y, x)).map((v) => ({ thuc: v, ao: KHONG }))
  // Dạng bền: tránh trừ hai số gần nhau
  const q = nhan(ps(-1n, 2n), dau(b) < 0 ? tru(b, r) : cong(b, r)), x1 = chia(q, a), x2 = bangKhong(q) ? x1 : chia(c, q)
  return [x1, x2].sort((x, y) => soSanh(y, x)).map((v) => ({ thuc: v, ao: KHONG }))
}

type Phuc = [number, number]
const pNhan = (a: Phuc, b: Phuc): Phuc => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]]
const pChia = (a: Phuc, b: Phuc): Phuc => { const m = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / m, (a[1] * b[0] - a[0] * b[1]) / m] }
/** Mọi nghiệm phức của đa thức hệ số thực (Durand–Kerner + vài bước Newton). */
function nghiemSo(hs: readonly number[]): Phuc[] {
  const n = hs.length - 1, c = hs.map((v) => v / hs[0]), f = (z: Phuc): Phuc => c.reduce<Phuc>((s, a) => { const t = pNhan(s, z); return [t[0] + a, t[1]] }, [0, 0])
  const df = (z: Phuc): Phuc => c.slice(0, n).reduce<Phuc>((s, a, k) => { const t = pNhan(s, z); return [t[0] + a * (n - k), t[1]] }, [0, 0])
  const r = 1 + Math.max(...c.slice(1).map(Math.abs))
  let z: Phuc[] = Array.from({ length: n }, (_, k) => [r * Math.cos((2 * Math.PI * k) / n + 0.4), r * Math.sin((2 * Math.PI * k) / n + 0.4)])
  for (let lan = 0; lan < 400; lan += 1) {
    let lech = 0
    z = z.map((zk, k) => {
      let m: Phuc = [1, 0]
      z.forEach((zj, j) => { if (j !== k) m = pNhan(m, [zk[0] - zj[0], zk[1] - zj[1]]) })
      const t = pChia(f(zk), m[0] === 0 && m[1] === 0 ? [1e-12, 0] : m)
      lech = Math.max(lech, Math.abs(t[0]) + Math.abs(t[1]))
      return [zk[0] - t[0], zk[1] - t[1]]
    })
    if (lech < 1e-15 * r) break
  }
  return z.map((zk) => {
    let w = zk
    for (let lan = 0; lan < 4; lan += 1) { const d = df(w); if (d[0] === 0 && d[1] === 0) break; const t = pChia(f(w), d); if (!Number.isFinite(t[0] + t[1])) break; w = [w[0] - t[0], w[1] - t[1]] }
    return Number.isFinite(w[0] + w[1]) ? w : zk
  })
}
/** Phân số gần nhất với x có mẫu ≤ 10000 (liên phân số). */
function gan(x: number): So | null {
  let a = Math.floor(x), [p0, q0, p1, q1] = [1, 0, a, 1], y = x - a
  for (let k = 0; k < 20 && Math.abs(x - p1 / q1) > 1e-13 * Math.max(1, Math.abs(x)); k += 1) {
    if (y < 1e-13) break
    y = 1 / y; a = Math.floor(y); y -= a
    const [p2, q2] = [a * p1 + p0, a * q1 + q0]
    if (q2 > 10000) break
    ;[p0, q0, p1, q1] = [p1, q1, p2, q2]
  }
  return Number.isSafeInteger(p1) && q1 > 0 ? ps(BigInt(p1), BigInt(q1)) : null
}

/** Giải a₀xⁿ + a₁xⁿ⁻¹ + … + aₙ = 0 (n = 2, 3, 4; a₀ ≠ 0). Nghiệm thực trước (lớn → bé), rồi tới nghiệm phức. */
export function giaiDaThuc(heSo: readonly So[]): Nghiem[] {
  if (heSo.length < 3 || heSo.length > 5 || bangKhong(heSo[0])) throw new LoiTinh('toan')
  const ra: Nghiem[] = []
  let hs = [...heSo]
  // Tách dần nghiệm hữu tỉ (kiểm bằng số chính xác) cho tới khi còn bậc hai
  while (hs.length > 3 && hs.every(laPs)) {
    const ung = nghiemSo(hs.map(thuc)).filter((z) => Math.abs(z[1]) < 1e-3 * Math.max(1, Math.abs(z[0]))).map((z) => gan(z[0])).find((g) => g != null && bangKhong(giaTri(hs, g)))
    if (!ung) break
    ra.push({ thuc: ung, ao: KHONG })
    const moi: So[] = []
    hs.slice(0, -1).reduce<So>((s, a) => { const v = cong(nhan(s, ung), a); moi.push(v); return v }, KHONG)
    hs = moi
  }
  if (hs.length === 3) ra.push(...bacHai(hs[0], hs[1], hs[2]))
  else {
    const z = nghiemSo(hs.map(thuc)), co = Math.max(1, ...z.map((v) => Math.abs(v[0]) + Math.abs(v[1])))
    // Nghiệm phức đi thành cặp liên hợp ⇒ (số nghiệm thực) + 2 × (số nghiệm phần ảo dương) phải đúng bằng bậc; nghiệm bội làm phần ảo nhiễu ⇒ nới nguong dần.
    const nguong = [1e-8, 1e-6, 1e-4, 1e-2].find((g) => z.filter((v) => Math.abs(v[1]) < g * co).length + 2 * z.filter((v) => v[1] >= g * co).length === z.length) ?? 1e-2
    for (const v of z) {
      if (Math.abs(v[1]) < nguong * co) ra.push({ thuc: kiem(v[0]), ao: KHONG })
      else if (v[1] > 0) { const t = kiem(Math.abs(v[0]) < 1e-12 * co ? 0 : v[0]); ra.push({ thuc: t, ao: kiem(v[1]) }, { thuc: t, ao: kiem(v[1]), am: true }) }
    }
  }
  // nghiệm thực: lớn → bé, nghiệm bội chỉ hiện một lần
  const gan_ = (a: So, b: So): boolean => (laPs(a) && laPs(b) ? soSanh(a, b) === 0 : Math.abs(thuc(a) - thuc(b)) <= 1e-9 * Math.max(1, Math.abs(thuc(a))))
  const thucTruoc = ra.filter((n) => bangKhong(n.ao)).sort((a, b) => soSanh(b.thuc, a.thuc)).filter((n, k, ds) => k === 0 || !gan_(ds[k - 1].thuc, n.thuc))
  return [...thucTruoc, ...ra.filter((n) => !bangKhong(n.ao))]
}

/** Hệ n phương trình bậc nhất n ẩn; mỗi hàng n hệ số + vế phải. Trả nghiệm, hoặc 'vo-nghiem' / 'vo-so'. */
export function giaiHe(he: readonly (readonly So[])[]): So[] | 'vo-nghiem' | 'vo-so' {
  const n = he.length, m = he.map((h) => [...h]), nho = (v: So): boolean => (laPs(v) ? v.n === 0n : Math.abs(v) < 1e-11)
  let hang = 0
  for (let cot = 0; cot < n && hang < n; cot += 1) {
    let chon = -1, lon = 0
    for (let k = hang; k < n; k += 1) { const t = Math.abs(thuc(m[k][cot])); if (!nho(m[k][cot]) && t > lon) { lon = t; chon = k } }
    if (chon < 0) continue
    ;[m[hang], m[chon]] = [m[chon], m[hang]]
    const tru_ = m[hang][cot]
    m[hang] = m[hang].map((v) => chia(v, tru_))
    for (let k = 0; k < n; k += 1) if (k !== hang && !nho(m[k][cot])) { const h = m[k][cot]; m[k] = m[k].map((v, j) => tru(v, nhan(h, m[hang][j]))) }
    hang += 1
  }
  if (hang === n) return m.map((h) => h[n])
  return m.slice(hang).some((h) => !nho(h[n])) ? 'vo-nghiem' : 'vo-so'
}

export interface ThongKe { n: number; tong: So; tongBinh: So; tb: So; /** độ lệch chuẩn tổng thể σx */ sigma: So; /** độ lệch chuẩn mẫu sx (n ≥ 2) */ s: So | null; min: So; max: So; trungVi: So }
export function thongKe(x: readonly So[]): ThongKe {
  if (!x.length) throw new LoiTinh('toan')
  const n = x.length, N = nguyen(n), tong = x.reduce<So>(cong, KHONG), tongBinh = x.reduce<So>((s, v) => cong(s, nhan(v, v)), KHONG), tb = chia(tong, N)
  const lech = tru(tongBinh, nhan(N, nhan(tb, tb))), duong = dau(lech) < 0 ? KHONG : lech, xep = [...x].sort(soSanh)
  return { n, tong, tongBinh, tb, sigma: can(chia(duong, N)), s: n > 1 ? can(chia(duong, nguyen(n - 1))) : null, min: xep[0], max: xep[n - 1], trungVi: n % 2 ? xep[(n - 1) / 2] : chia(cong(xep[n / 2 - 1], xep[n / 2]), nguyen(2)) }
}
