// OMNI 3 — DỰ BÁO ĐIỂM THEO MA TRẬN ĐỀ (PMF tích chập chính xác) + ĐIỂM CÒN LẤY ĐƯỢC + TRỌNG SỐ CÂU. LÕI THUẦN.
// Đặc tả mục 4.8 · đúng hàm `phanBoDe` của docs/omni-0510/mo-phong-chac-8.mjs (đề "trung bình": xác suất đúng trung bình từng phần trên
// phạm vi; câu Phần I/III đúng ⇒ 0,25; câu Đúng–sai theo số ý đúng 0/1/2/3/4 ⇒ 0 · 0,1 · 0,25 · 0,5 · 1; tích chập bước 0,05).
// Test vàng: phanBoDiem({pI:0.9,pY:0.9,pIII:0.9}) ⇒ kyVong 8,66 · p8 0,88 (P = 1, S = 0,10) — tests/omni-3-loi.test.ts.
import { THAM_SO_OMNI, type DuBao, type HoSoOmniEm, type KhungDe, type Phan, type PhanBoDiem, type QCau, type ThamSoOmni, type XacSuatPhan } from './omni-kieu'
import { pAnd, vknCaCau, vknCuaY } from './omni-p-vkn'

/** Bước điểm của PMF: mọi điểm câu/ý (0,1 · 0,25 · 0,5 · 1) là bội của 0,05 ⇒ tích chập CHÍNH XÁC. */
export const BUOC_DIEM = 0.05

/**
 * Ba con đường tới 8,0 (bảng 3.2 của NGHIEN-CUU-THAU-HIEU-VA-CHAC-8-0510.md) — xác suất đúng trung bình mỗi phần cần đạt (Phần II: mỗi Ý):
 * A cân bằng (I 90 % · ý 0,90 · III 3/6) · B mạnh Phần I (I 95 % · ý 0,85 · III 4/6) · C mạnh Phần II (I 85 % · ý 0,95 · III 3/6).
 * (Hằng số của con đường, chưa có trong THAM_SO_OMNI — phiên điều phối có thể chuyển vào omni-kieu.ts.)
 */
export const DUONG_8 = Object.freeze({
  A: Object.freeze({ I: 0.9, Y: 0.9, III: 0.5 }),
  B: Object.freeze({ I: 0.95, Y: 0.85, III: 4 / 6 }),
  C: Object.freeze({ I: 0.85, Y: 0.95, III: 0.5 }),
})
export type MucDuong = { readonly I: number; readonly Y: number; readonly III: number }

const kep01 = (x: number): number => (Number.isFinite(x) ? Math.min(1, Math.max(0, x)) : 0)
const soNguyenKhongAm = (x: number): number => (Number.isFinite(x) && x > 0 ? Math.floor(x) : 0)
const trungBinh = (ds: readonly number[]): number => ds.reduce((s, x) => s + x, 0) / ds.length

/** Phân bố số ý đúng 0..n của một câu Đúng–sai khi mỗi ý đúng độc lập với xác suất `py[i]`. */
export function pmfSoYDung(py: readonly number[]): number[] {
  let soY = [1]
  for (const p0 of py) {
    const p = kep01(p0)
    const moi = new Array<number>(soY.length + 1).fill(0)
    for (let j = 0; j < soY.length; j++) {
      moi[j]! += soY[j]! * (1 - p)
      moi[j + 1]! += soY[j]! * p
    }
    soY = moi
  }
  return soY
}
/** PMF điểm MỘT câu Đúng–sai 4 ý: cặp [điểm, xác suất] theo DIEM_Y (0 · 0,1 · 0,25 · 0,5 · 1) — đúng `pmfDungSai` của mô phỏng. */
export function pmfCauDungSai(py: readonly number[], ts: ThamSoOmni = THAM_SO_OMNI): [number, number][] {
  const soY = pmfSoYDung(py)
  return soY.map((pr, j) => [ts.DIEM_Y[Math.min(j, ts.DIEM_Y.length - 1)]!, pr])
}

/**
 * PMF điểm (bước 0,05) của đề khung `khung` với xác suất đúng trung bình từng phần; Phần II theo số ý đúng (0/0,1/0,25/0,5/1), 4 ý cùng `pY`.
 * kyVong = kỳ vọng · p8 = P(điểm ≥ ts.MUC_TIEU) (mặc định 8,0) · saiSo = độ lệch chuẩn · pmf[b] = P(điểm = b × 0,05).
 */
export function phanBoDiem(p: XacSuatPhan, khung: KhungDe = THAM_SO_OMNI.KHUNG_DE, ts: ThamSoOmni = THAM_SO_OMNI): PhanBoDiem {
  return phanBoDiemTheoMuc(p, khung, ts.MUC_TIEU, ts)
}
/** Như `phanBoDiem` nhưng p8 = P(điểm ≥ `mucTieu`) với mục tiêu tuỳ chọn (mục tiêu 9 khi đã có ≥ 3 chứng chỉ). */
export function phanBoDiemTheoMuc(p: XacSuatPhan, khung: KhungDe, mucTieu: number, ts: ThamSoOmni = THAM_SO_OMNI): PhanBoDiem {
  const pI = kep01(p.pI)
  const pY = kep01(p.pY)
  const pIII = kep01(p.pIII)
  const nI = soNguyenKhongAm(khung.I)
  const nII = soNguyenKhongAm(khung.II)
  const nIII = soNguyenKhongAm(khung.III)
  const dichI = Math.round(ts.DIEM_CAU.I / BUOC_DIEM)
  const dichIII = Math.round(ts.DIEM_CAU.III / BUOC_DIEM)
  const cauII = pmfCauDungSai([pY, pY, pY, pY], ts).map(([d, pr]) => [Math.round(d / BUOC_DIEM), pr] as [number, number])
  const toiDaII = Math.max(0, ...cauII.map(([d]) => d))
  const soBin = nI * dichI + nII * toiDaII + nIII * dichIII + 1
  let pmf = new Float64Array(soBin)
  pmf[0] = 1
  const nhan = (ds: readonly (readonly [number, number])[]): void => {
    const moi = new Float64Array(soBin)
    for (const [dich, pr] of ds) {
      if (!pr) continue
      for (let b = 0; b + dich < soBin; b++) if (pmf[b]) moi[b + dich]! += pmf[b]! * pr
    }
    pmf = moi
  }
  for (let i = 0; i < nI; i++) nhan([[0, 1 - pI], [dichI, pI]])
  for (let i = 0; i < nII; i++) nhan(cauII)
  for (let i = 0; i < nIII; i++) nhan([[0, 1 - pIII], [dichIII, pIII]])
  const binMucTieu = Math.ceil(mucTieu / BUOC_DIEM - 1e-9)
  let kyVong = 0
  let p8 = 0
  for (let b = 0; b < soBin; b++) {
    kyVong += b * BUOC_DIEM * pmf[b]!
    if (b >= binMucTieu) p8 += pmf[b]!
  }
  let phuongSai = 0
  for (let b = 0; b < soBin; b++) phuongSai += (b * BUOC_DIEM - kyVong) ** 2 * pmf[b]!
  return { kyVong, p8: Math.min(1, p8), saiSo: Math.sqrt(phuongSai), pmf: Array.from(pmf) }
}

// ---------------------------------------------------------------- xác suất đúng theo câu / ý trên phạm vi
/** Một "mục" quan sát được của phạm vi: câu Phần I/III, hoặc MỘT Ý của câu Đúng–sai (y = 0..3). */
export interface MucPhamVi { qid: string; phan: Phan; y: number | null; kn: string[]; g: number }

/** Mọi vi kỹ năng của phạm vi (vkn ∪ vknY, đúng tập các mục dự báo dùng), sắp theo id. */
export function vknCuaPhamVi(cauPhamVi: readonly QCau[]): string[] {
  const ds = new Set<string>()
  for (const c of cauPhamVi) {
    for (const k of vknCaCau(c)) ds.add(k)
    if (c.phan === 'II') for (let i = 0; i < 4; i++) for (const k of vknCuaY(c, i)) ds.add(k)
  }
  return [...ds].sort()
}
const gCua = (phan: Phan, ts: ThamSoOmni): number => (phan === 'I' ? ts.G.I : phan === 'II' ? ts.G.Y : ts.G.III)
/** Các mục của phạm vi: câu Phần I/III một mục (G theo phần); câu Phần II bốn mục (mỗi Ý, G.Y). */
export function cacMucPhamVi(cauPhamVi: readonly QCau[], ts: ThamSoOmni = THAM_SO_OMNI): MucPhamVi[] {
  const ra: MucPhamVi[] = []
  for (const c of cauPhamVi) {
    if (c.phan === 'II') for (let i = 0; i < 4; i++) ra.push({ qid: c.qid, phan: 'II', y: i, kn: vknCuaY(c, i), g: ts.G.Y })
    else ra.push({ qid: c.qid, phan: c.phan, y: null, kn: vknCaCau(c), g: gCua(c.phan, ts) })
  }
  return ra
}
/** P(đúng) dự đoán của một mục: pAnd(K)(1 − s) + (1 − pAnd)·G. */
export function xacSuatDungMuc(hs: Pick<HoSoOmniEm, 'vkn'>, muc: Pick<MucPhamVi, 'kn' | 'g'>, s: number, ts: ThamSoOmni = THAM_SO_OMNI): number {
  const pa = pAnd(hs, muc.kn, ts)
  return pa * (1 - s) + (1 - pa) * muc.g
}
/** P(đúng) dự đoán của MỘT câu: Phần I/III theo cổng AND của câu; Phần II = trung bình P(đúng) của 4 ý. */
export function xacSuatDungCau(hs: Pick<HoSoOmniEm, 'vkn'>, cau: QCau, s: number, ts: ThamSoOmni = THAM_SO_OMNI): number {
  return trungBinh(cacMucPhamVi([cau], ts).map((m) => xacSuatDungMuc(hs, m, s, ts)))
}

/**
 * Xác suất đúng trung bình từng phần trên phạm vi: P(đúng câu) = pAnd(K)(1−s) + (1−pAnd)·G; Phần II tính theo ý trên vknY (vắng ⇒ vkn).
 * Phần không có câu nào trong phạm vi ⇒ dùng prior: P0(1−s) + (1−P0)·G của phần (thận trọng — không suy từ phần khác).
 */
export function xacSuatPhan(hs: Pick<HoSoOmniEm, 'vkn'>, cauPhamVi: readonly QCau[], sEm: number, ts: ThamSoOmni = THAM_SO_OMNI): XacSuatPhan {
  const muc = cacMucPhamVi(cauPhamVi, ts)
  const tb = (phan: Phan): number => {
    const ds = muc.filter((m) => m.phan === phan)
    if (!ds.length) return ts.P0 * (1 - sEm) + (1 - ts.P0) * gCua(phan, ts)
    return trungBinh(ds.map((m) => xacSuatDungMuc(hs, m, sEm, ts)))
  }
  return { pI: tb('I'), pY: tb('II'), pIII: tb('III') }
}

// ---------------------------------------------------------------- còn thiếu · lượt cần · con đường rẻ nhất
/** Vi kỹ năng phạm vi còn dưới K_P_VKN (yếu trước, rồi theo id) + số ý Đúng–sai của phạm vi có P nắm ý (pAnd của ý) < SPRT.p1Y. */
export function conThieuCua(hs: Pick<HoSoOmniEm, 'vkn'>, cauPhamVi: readonly QCau[], ts: ThamSoOmni = THAM_SO_OMNI): { vkn: string[]; soY: number } {
  const p = (k: string): number => hs.vkn[k]?.p ?? ts.P0
  const vkn = vknCuaPhamVi(cauPhamVi)
    .filter((k) => p(k) < ts.K_P_VKN)
    .sort((a, b) => p(a) - p(b) || (a < b ? -1 : a > b ? 1 : 0))
  let soY = 0
  for (const c of cauPhamVi) if (c.phan === 'II') for (let i = 0; i < 4; i++) if (pAnd(hs, vknCuaY(c, i), ts) < ts.SPRT.p1Y) soY++
  return { vkn, soY }
}
/**
 * Số lượt có phản hồi để một vi kỹ năng đi từ P lên `pMucTieu` (đặc tả 4.10): ln((1 − mục tiêu)/(1 − P)) / ln(1 − T·p̂), p̂ = tỉ lệ đúng dự kiến.
 * Đã đạt ⇒ 0 · mục tiêu ≥ 1 hoặc T·p̂ ∉ (0, 1) ⇒ Infinity (không với tới).
 */
export function luotCan(p: number, pMucTieu: number, pHat: number, T: number): number {
  if (p >= pMucTieu) return 0
  if (!(pMucTieu < 1)) return Number.POSITIVE_INFINITY
  const r = 1 - T * pHat
  if (!(r > 0 && r < 1)) return Number.POSITIVE_INFINITY
  return Math.log((1 - pMucTieu) / (1 - Math.max(0, p))) / Math.log(r)
}
/** p̂ của từng vi kỹ năng phạm vi = trung bình P(đúng) dự đoán của các mục (câu/ý) cần vi kỹ năng ấy. */
export function pHatTheoVkn(hs: Pick<HoSoOmniEm, 'vkn'>, cauPhamVi: readonly QCau[], sEm: number, ts: ThamSoOmni = THAM_SO_OMNI): Map<string, number> {
  const tong = new Map<string, { s: number; n: number }>()
  for (const m of cacMucPhamVi(cauPhamVi, ts)) {
    const pc = xacSuatDungMuc(hs, m, sEm, ts)
    for (const k of m.kn) {
      const t = tong.get(k) ?? { s: 0, n: 0 }
      t.s += pc
      t.n += 1
      tong.set(k, t)
    }
  }
  return new Map([...tong].map(([k, t]) => [k, t.s / t.n]))
}
/**
 * "Lượt học" dự kiến để đi một con đường: với mỗi phần còn dưới mốc của đường, tìm mức P* ĐỀU cho mọi vi kỹ năng của phần sao cho
 * P(đúng) trung bình của phần = mốc (chia đôi trên [0, P_MAX]); vi kỹ năng dùng ở nhiều phần lấy mốc cao nhất; tổng `luotCan` từng vi kỹ năng.
 * Mốc vượt mức với tới được (sơ ý chặn: P(đúng) ≤ 1 − s; P ≤ P_MAX) ⇒ Infinity.
 */
export function chiPhiDuong(hs: Pick<HoSoOmniEm, 'vkn'>, cauPhamVi: readonly QCau[], sEm: number, muc: MucDuong, ts: ThamSoOmni = THAM_SO_OMNI): number {
  const cacMuc = cacMucPhamVi(cauPhamVi, ts)
  const pStar = new Map<string, number>()
  for (const phan of ['I', 'II', 'III'] as const) {
    const ds = cacMuc.filter((m) => m.phan === phan)
    if (!ds.length) continue
    const moc = phan === 'I' ? muc.I : phan === 'II' ? muc.Y : muc.III
    if (trungBinh(ds.map((m) => xacSuatDungMuc(hs, m, sEm, ts))) >= moc) continue
    const f = (P: number): number => trungBinh(ds.map((m) => { const a = P ** m.kn.length; return a * (1 - sEm) + (1 - a) * m.g }))
    if (f(ts.P_MAX) < moc - 1e-12) return Number.POSITIVE_INFINITY
    let lo = 0
    let hi: number = ts.P_MAX
    for (let i = 0; i < 60; i++) {
      const giua = (lo + hi) / 2
      if (f(giua) >= moc) hi = giua
      else lo = giua
    }
    for (const m of ds) for (const k of m.kn) pStar.set(k, Math.max(pStar.get(k) ?? 0, hi))
  }
  const pHat = pHatTheoVkn(hs, cauPhamVi, sEm, ts)
  let tong = 0
  for (const [k, ps] of pStar) tong += luotCan(hs.vkn[k]?.p ?? ts.P0, ps, pHat.get(k) ?? 0, ts.T)
  return tong
}
/** Con đường rẻ nhất (ít lượt học nhất) trong A/B/C; hoà ⇒ thứ tự A, B, C; không đường nào với tới (sơ ý quá cao) ⇒ 'A' (cân bằng). */
export function chonConDuong(hs: Pick<HoSoOmniEm, 'vkn'>, cauPhamVi: readonly QCau[], sEm: number, ts: ThamSoOmni = THAM_SO_OMNI): 'A' | 'B' | 'C' {
  let tot: 'A' | 'B' | 'C' = 'A'
  let chiPhiTot = Number.POSITIVE_INFINITY
  for (const ten of ['A', 'B', 'C'] as const) {
    const c = chiPhiDuong(hs, cauPhamVi, sEm, DUONG_8[ten], ts)
    if (c < chiPhiTot) { tot = ten; chiPhiTot = c }
  }
  return tot
}

/**
 * Dự báo đầy đủ trên phạm vi: PMF (khung `khung`, hoặc tập câu khả thi `khaThi` ≤ khung — câu không kịp làm không có điểm) + con đường rẻ nhất
 * (null khi kyVong ≥ mục tiêu và p8 ≥ M_P8) + vi kỹ năng/ý còn thiếu + số bằng chứng (Σ nTuLam vi kỹ năng phạm vi). p8 = P(điểm ≥ mục tiêu).
 */
export function duBaoDiem(hs: HoSoOmniEm, cauPhamVi: readonly QCau[], tuy: { khung?: KhungDe; mucTieu?: number; khaThi?: KhungDe; chiKyVong?: boolean } = {}, ts: ThamSoOmni = THAM_SO_OMNI): DuBao {
  const mucTieu = tuy.mucTieu ?? ts.MUC_TIEU
  const khung = tuy.khung ?? ts.KHUNG_DE
  const khaThi = tuy.khaThi
    ? { I: Math.min(soNguyenKhongAm(tuy.khaThi.I), soNguyenKhongAm(khung.I)), II: Math.min(soNguyenKhongAm(tuy.khaThi.II), soNguyenKhongAm(khung.II)), III: Math.min(soNguyenKhongAm(tuy.khaThi.III), soNguyenKhongAm(khung.III)) }
    : undefined
  const pb = phanBoDiemTheoMuc(xacSuatPhan(hs, cauPhamVi, hs.sEm, ts), khaThi ?? khung, mucTieu, ts)
  const soBangChung = vknCuaPhamVi(cauPhamVi).reduce((s, k) => s + (hs.vkn[k]?.nTuLam ?? 0), 0)
  if (tuy.chiKyVong) {
    return {
      ...pb,
      conDuong: null,
      conThieu: { vkn: [], soY: 0 },
      ...(khaThi ? { khaThi } : {}),
      soBangChung,
    }
  }
  const daDat = pb.kyVong >= mucTieu && pb.p8 >= ts.M_P8
  return {
    ...pb,
    conDuong: daDat ? null : chonConDuong(hs, cauPhamVi, hs.sEm, ts),
    conThieu: conThieuCua(hs, cauPhamVi, ts),
    ...(khaThi ? { khaThi } : {}),
    soBangChung,
  }
}

/**
 * Điểm còn lấy được của MỘT câu (trọng số xếp câu mới / ôn bài cũ) = điểm câu (Phần I/III DIEM_CAU = 0,25; Phần II đủ 4 ý = 1,0)
 * × (1 − pAnd(K cả câu)) × hệ số vùng học theo P(đúng) dự đoán (VUNG_HOC: [0,75; 0,90] ×1,3 · < 0,5 ×0,8 · còn lại ×1) — đúng `diem` của mô phỏng.
 */
export function trongSoCau(hs: Pick<HoSoOmniEm, 'vkn'>, cau: QCau, sEm: number, ts: ThamSoOmni = THAM_SO_OMNI): number {
  const diem = cau.phan === 'II' ? ts.DIEM_Y[ts.DIEM_Y.length - 1]! : ts.DIEM_CAU[cau.phan]
  const pall = pAnd(hs, vknCaCau(cau), ts)
  const pc = xacSuatDungCau(hs, cau, sEm, ts)
  const v = ts.VUNG_HOC
  const heSo = pc >= v.tu && pc <= v.den ? v.heSo : pc < v.khoDuoi ? v.khoHeSo : 1
  return diem * (1 - pall) * heSo
}
