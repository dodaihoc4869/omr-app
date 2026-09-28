// MÃ QR TỰ VIẾT (không thêm thư viện — gói app đang sát trần precache): chế độ BYTE (UTF-8), mức sửa lỗi M, phiên bản 1–10 (đủ cho link vào thi
// ~30–150 ký tự). Dùng cho màn Chiếu mã vào thi. Đã đối chiếu từng ô với thư viện `qrcode-generator` (tests/ma-qr-2809.test.ts giữ mẫu).
// Chuẩn ISO/IEC 18004: Reed–Solomon trên GF(256) đa thức 0x11D; thông tin định dạng BCH 0x537 ⊕ 0x5412; thông tin phiên bản BCH 0x1F25 (≥ 7).

/** Bảng mức M: [tổng số từ mã, số từ mã sửa lỗi mỗi khối, [số khối × số từ dữ liệu]...] */
const BANG_M: readonly [number, number, readonly (readonly [number, number])[]][] = [
  [26, 10, [[1, 16]]],
  [44, 16, [[1, 28]]],
  [70, 26, [[1, 44]]],
  [100, 18, [[2, 32]]],
  [134, 24, [[2, 43]]],
  [172, 16, [[4, 27]]],
  [196, 18, [[4, 31]]],
  [242, 22, [[2, 38], [2, 39]]],
  [292, 22, [[3, 36], [2, 37]]],
  [346, 26, [[4, 43], [1, 44]]],
]
const CAN_CHINH: readonly (readonly number[])[] = [[], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]]
const DU_BIT = [0, 7, 7, 7, 7, 7, 0, 0, 0, 0]

// ── GF(256) ──
const MU = new Array<number>(512)
const LOG = new Array<number>(256)
{
  let x = 1
  for (let i = 0; i < 255; i++) {
    MU[i] = x
    LOG[x] = i
    x <<= 1
    if (x & 0x100) x ^= 0x11d
  }
  for (let i = 255; i < 512; i++) MU[i] = MU[i - 255]!
}
const nhan = (a: number, b: number) => (a === 0 || b === 0 ? 0 : MU[LOG[a]! + LOG[b]!]!)

function sinhDaThuc(n: number): number[] {
  let g = [1]
  for (let i = 0; i < n; i++) {
    const moi = new Array<number>(g.length + 1).fill(0)
    for (let j = 0; j < g.length; j++) {
      moi[j] ^= g[j]!
      moi[j + 1] ^= nhan(g[j]!, MU[i]!)
    }
    g = moi
  }
  return g
}
function suaLoi(duLieu: number[], n: number): number[] {
  const g = sinhDaThuc(n)
  const r = [...duLieu, ...new Array<number>(n).fill(0)]
  for (let i = 0; i < duLieu.length; i++) {
    const c = r[i]!
    if (c !== 0) for (let j = 0; j < g.length; j++) r[i + j] ^= nhan(g[j]!, c)
  }
  return r.slice(duLieu.length)
}

function utf8(s: string): number[] {
  return [...new TextEncoder().encode(s)]
}

/** Chọn phiên bản nhỏ nhất chứa được `n` byte (mức M). Quá phiên bản 10 ⇒ null. */
function chonPhienBan(n: number): number | null {
  for (let v = 1; v <= 10; v++) {
    const cap = BANG_M[v - 1]![2].reduce((t, [k, d]) => t + k * d, 0)
    const bitDem = v < 10 ? 8 : 16
    if (4 + bitDem + n * 8 <= cap * 8) return v
  }
  return null
}

function maHoa(byte: number[], v: number): number[] {
  const [, ec, khoi] = BANG_M[v - 1]!
  const cap = khoi.reduce((t, [k, d]) => t + k * d, 0)
  const bit: number[] = []
  const day = (x: number, n: number) => {
    for (let i = n - 1; i >= 0; i--) bit.push((x >>> i) & 1)
  }
  day(4, 4)
  day(byte.length, v < 10 ? 8 : 16)
  for (const b of byte) day(b, 8)
  for (let i = 0; i < 4 && bit.length < cap * 8; i++) bit.push(0)
  while (bit.length % 8) bit.push(0)
  const tu: number[] = []
  for (let i = 0; i < bit.length; i += 8) tu.push(bit.slice(i, i + 8).reduce((t, x) => (t << 1) | x, 0))
  for (let p = 0; tu.length < cap; p++) tu.push(p % 2 ? 0x11 : 0xec)
  const dsKhoi: number[][] = []
  let o = 0
  for (const [k, d] of khoi)
    for (let i = 0; i < k; i++) {
      dsKhoi.push(tu.slice(o, o + d))
      o += d
    }
  const dsEc = dsKhoi.map((b) => suaLoi(b, ec))
  const ra: number[] = []
  const dai = Math.max(...dsKhoi.map((b) => b.length))
  for (let i = 0; i < dai; i++) for (const b of dsKhoi) if (i < b.length) ra.push(b[i]!)
  for (let i = 0; i < ec; i++) for (const e of dsEc) ra.push(e[i]!)
  return ra
}

const MASK: readonly ((i: number, j: number) => boolean)[] = [
  (i, j) => (i + j) % 2 === 0,
  (i) => i % 2 === 0,
  (_i, j) => j % 3 === 0,
  (i, j) => (i + j) % 3 === 0,
  (i, j) => (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0,
  (i, j) => ((i * j) % 2) + ((i * j) % 3) === 0,
  (i, j) => (((i * j) % 2) + ((i * j) % 3)) % 2 === 0,
  (i, j) => (((i * j) % 3) + ((i + j) % 2)) % 2 === 0,
]

function bch(x: number, g: number, bac: number): number {
  let r = x << bac
  const doDai = (n: number) => (n === 0 ? 0 : 32 - Math.clz32(n))
  while (doDai(r) - doDai(g) >= 0) r ^= g << (doDai(r) - doDai(g))
  return (x << bac) | r
}

/** Dựng ma trận (true = ô đen) với mặt nạ `mask`. */
export function taoQrVoiMask(text: string, mask: number): boolean[][] | null {
  const byte = utf8(text)
  const v = chonPhienBan(byte.length)
  if (v === null) return null
  const n = 17 + 4 * v
  const m: (boolean | null)[][] = Array.from({ length: n }, () => new Array<boolean | null>(n).fill(null))
  const dinhVi = (r: number, c: number) => {
    for (let i = -1; i <= 7; i++)
      for (let j = -1; j <= 7; j++) {
        const y = r + i, x = c + j
        if (y < 0 || y >= n || x < 0 || x >= n) continue
        m[y]![x] = (i >= 0 && i <= 6 && (j === 0 || j === 6)) || (j >= 0 && j <= 6 && (i === 0 || i === 6)) || (i >= 2 && i <= 4 && j >= 2 && j <= 4)
      }
  }
  dinhVi(0, 0)
  dinhVi(n - 7, 0)
  dinhVi(0, n - 7)
  const pos = CAN_CHINH[v - 1]!
  for (const r of pos)
    for (const c of pos) {
      if (m[r]![c] !== null) continue
      for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) m[r + i]![c + j] = Math.max(Math.abs(i), Math.abs(j)) !== 1
    }
  for (let i = 8; i < n - 8; i++) {
    if (m[i]![6] === null) m[i]![6] = i % 2 === 0
    if (m[6]![i] === null) m[6]![i] = i % 2 === 0
  }
  // thông tin định dạng (mức M = 00)
  const fmt = bch((0 << 3) | mask, 0x537, 10) ^ 0x5412
  for (let i = 0; i < 15; i++) {
    const b = ((fmt >> i) & 1) === 1
    if (i < 6) m[i]![8] = b
    else if (i < 8) m[i + 1]![8] = b
    else m[n - 15 + i]![8] = b
    if (i < 8) m[8]![n - i - 1] = b
    else if (i < 9) m[8]![15 - i - 1 + 1] = b
    else m[8]![15 - i - 1] = b
  }
  m[n - 8]![8] = true
  if (v >= 7) {
    const vi = bch(v, 0x1f25, 12)
    for (let i = 0; i < 18; i++) {
      const b = ((vi >> i) & 1) === 1
      m[Math.floor(i / 3)]![(i % 3) + n - 8 - 3] = b
      m[(i % 3) + n - 8 - 3]![Math.floor(i / 3)] = b
    }
  }
  // dữ liệu
  const tu = maHoa(byte, v)
  const bit: number[] = []
  for (const t of tu) for (let i = 7; i >= 0; i--) bit.push((t >> i) & 1)
  for (let i = 0; i < DU_BIT[v - 1]!; i++) bit.push(0)
  let k = 0
  let len = true
  for (let c = n - 1; c > 0; c -= 2) {
    if (c === 6) c--
    for (let t = 0; t < n; t++) {
      const r = len ? n - 1 - t : t
      for (let d = 0; d < 2; d++) {
        const x = c - d
        if (m[r]![x] !== null) continue
        const b = (bit[k++] ?? 0) === 1
        m[r]![x] = MASK[mask]!(r, x) ? !b : b
      }
    }
    len = !len
  }
  return m.map((h) => h.map((x) => x === true))
}

/** Điểm phạt chuẩn (N1–N4) để chọn mặt nạ. */
function diemPhat(m: boolean[][]): number {
  const n = m.length
  let p = 0
  for (let r = 0; r < n; r++)
    for (const doc of [false, true]) {
      let dem = 1
      for (let i = 1; i < n; i++) {
        const a = doc ? m[i]![r] : m[r]![i], b = doc ? m[i - 1]![r] : m[r]![i - 1]
        if (a === b) dem++
        else {
          if (dem >= 5) p += dem - 2
          dem = 1
        }
      }
      if (dem >= 5) p += dem - 2
    }
  for (let r = 0; r < n - 1; r++)
    for (let c = 0; c < n - 1; c++) if (m[r]![c] === m[r + 1]![c] && m[r]![c] === m[r]![c + 1] && m[r]![c] === m[r + 1]![c + 1]) p += 3
  const mau1 = [true, false, true, true, true, false, true, false, false, false, false]
  const mau2 = [...mau1].reverse()
  for (let r = 0; r < n; r++)
    for (let c = 0; c + 11 <= n; c++)
      for (const mau of [mau1, mau2]) {
        if (mau.every((x, i) => m[r]![c + i] === x)) p += 40
        if (mau.every((x, i) => m[c + i]![r] === x)) p += 40
      }
  const den = m.reduce((t, h) => t + h.filter(Boolean).length, 0)
  p += Math.floor(Math.abs((den * 100) / (n * n) - 50) / 5) * 10
  return p
}

/** Ma trận QR của `text` (mặt nạ điểm phạt thấp nhất). Dài quá phiên bản 10 ⇒ null (màn chỉ hiện link). */
export function taoQr(text: string): boolean[][] | null {
  let tot: boolean[][] | null = null
  let diem = Infinity
  for (let k = 0; k < 8; k++) {
    const m = taoQrVoiMask(text, k)
    if (!m) return null
    const d = diemPhat(m)
    if (d < diem) {
      diem = d
      tot = m
    }
  }
  return tot
}

/** Đường SVG (một path) của ma trận, lề 4 ô. */
export function duongQr(m: boolean[][]): { canh: number; d: string } {
  const le = 4
  let d = ''
  m.forEach((h, r) => h.forEach((x, c) => { if (x) d += `M${c + le} ${r + le}h1v1h-1z` }))
  return { canh: m.length + le * 2, d }
}
