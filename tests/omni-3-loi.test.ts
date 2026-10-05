// @vitest-environment node
// OMNI 3 · GĐ A — TEST VÀNG lõi thuần: PMF dự báo khớp mô phỏng (docs/omni-0510/mo-phong-chac-8.mjs), bảng Phần II, Bayes hội + gán trách,
// SPRT, tốc độ (lognormal). Số chuẩn lấy từ chạy `node docs/omni-0510/mo-phong-chac-8.mjs` ngày 05/10.
import { describe, expect, it } from 'vitest'
import { THAM_SO_OMNI } from '../server/src/omni-kieu'
import { phanBoDiem, phanBoDiemTheoMuc, pmfCauDungSai, pmfSoYDung, xacSuatPhan, xacSuatDungCau, trongSoCau, BUOC_DIEM } from '../server/src/du-bao-diem'
import { capNhatHoi, pAnd } from '../server/src/omni-p-vkn'
import { buocSprt, buocSprtPhatLai, nguongSprt, trangThaiSprt } from '../server/src/omni-sprt'
import { betaTuMau, msKyVong, mucDoSo, nguongLuotMs, nhanTocDo, trungVi, uocTau } from '../server/src/omni-toc-do'
import { KHO_MO_PHONG, hoSoTuP, moiKnBang, mulberry32 } from './omni-3-loi-chung'

const ts = THAM_SO_OMNI

describe('phanBoDiem — PMF tích chập chính xác (đúng phanBoDe của mô phỏng)', () => {
  it('VÀNG: P = 1, S = 0,10 ⇒ kỳ vọng 8,66 · P(≥ 8) 0,88', () => {
    const r = phanBoDiem({ pI: 0.9, pY: 0.9, pIII: 0.9 })
    expect(r.kyVong).toBeCloseTo(8.66, 2)
    expect(Math.abs(r.kyVong - 8.66)).toBeLessThanOrEqual(0.01)
    expect(Math.abs(r.p8 - 0.88)).toBeLessThanOrEqual(0.01)
  })
  it('VÀNG: trần điểm theo sơ ý (P = 1): S 0,12/0,10/0,08/0,06 ⇒ (8,40; 78 %) (8,66; 88 %) (8,92; 95 %) (9,18; 99 %)', () => {
    const bang: [number, number, number][] = [[0.12, 8.4, 0.78], [0.1, 8.66, 0.88], [0.08, 8.92, 0.95], [0.06, 9.18, 0.99]]
    for (const [S, ky, p8] of bang) {
      const r = phanBoDiem({ pI: 1 - S, pY: 1 - S, pIII: 1 - S })
      expect(Math.abs(r.kyVong - ky)).toBeLessThanOrEqual(0.01)
      expect(Math.abs(r.p8 - p8)).toBeLessThanOrEqual(0.01)
    }
  })
  it('VÀNG: cùng số khi đi qua xacSuatPhan với hồ sơ P = 1 trên kho mô phỏng', () => {
    for (const [S, ky, p8] of [[0.1, 8.66, 0.88], [0.06, 9.18, 0.99]] as const) {
      const r = phanBoDiem(xacSuatPhan(hoSoTuP(moiKnBang(1)), KHO_MO_PHONG, S))
      expect(Math.abs(r.kyVong - ky)).toBeLessThanOrEqual(0.01)
      expect(Math.abs(r.p8 - p8)).toBeLessThanOrEqual(0.01)
    }
  })
  it('VÀNG (1b): kho mô phỏng (câu I/III cần 2 vi kỹ năng, ý II cần 1), S 0,05 — P 0,85/0,90/0,95/0,97/0,99', () => {
    const bang: [number, number, number][] = [[0.85, 7.57, 0.36], [0.9, 8.13, 0.65], [0.95, 8.71, 0.9], [0.97, 8.95, 0.96], [0.99, 9.19, 0.99]]
    for (const [p, ky, p8] of bang) {
      const r = phanBoDiem(xacSuatPhan(hoSoTuP(moiKnBang(p)), KHO_MO_PHONG, 0.05))
      expect(Math.abs(r.kyVong - ky)).toBeLessThanOrEqual(0.02)
      expect(Math.abs(r.p8 - p8)).toBeLessThanOrEqual(0.02)
    }
  })
  it('VÀNG: phạm vi giả tối giản (1 câu I, 1 câu III cần 2 vi kỹ năng; 1 câu II mỗi ý 1 vi kỹ năng), P 0,95, S 0,05 ⇒ 8,71 · 0,90', () => {
    const phamVi = [
      { qid: 'a', phan: 'I' as const, maDang: 'D', mucDo: null, vkn: ['x', 'y'], nguon: 'thay' as const },
      { qid: 'b', phan: 'III' as const, maDang: 'D', mucDo: null, vkn: ['x', 'z'], nguon: 'thay' as const },
      { qid: 'c', phan: 'II' as const, maDang: 'D', mucDo: null, vkn: ['x', 'y', 'z', 'w'], vknY: [['x'], ['y'], ['z'], ['w']], nguon: 'thay' as const },
    ]
    const r = phanBoDiem(xacSuatPhan(hoSoTuP({ x: 0.95, y: 0.95, z: 0.95, w: 0.95 }), phamVi, 0.05))
    expect(Math.abs(r.kyVong - 8.71)).toBeLessThanOrEqual(0.02)
    expect(Math.abs(r.p8 - 0.9)).toBeLessThanOrEqual(0.02)
  })
  it('PMF hợp lệ: 201 ô bước 0,05, tổng 1; kỳ vọng và độ lệch chuẩn khớp công thức giải tích (độc lập ⇒ cộng phương sai)', () => {
    const p = { pI: 0.83, pY: 0.71, pIII: 0.42 }
    const r = phanBoDiem(p)
    expect(r.pmf).toHaveLength(201)
    expect(r.pmf.reduce((s, x) => s + x, 0)).toBeCloseTo(1, 12)
    const eII = pmfCauDungSai([p.pY, p.pY, p.pY, p.pY]).reduce((s, [d, pr]) => s + d * pr, 0)
    const vII = pmfCauDungSai([p.pY, p.pY, p.pY, p.pY]).reduce((s, [d, pr]) => s + (d - eII) ** 2 * pr, 0)
    const ky = 18 * 0.25 * p.pI + 4 * eII + 6 * 0.25 * p.pIII
    const ps = 18 * 0.0625 * p.pI * (1 - p.pI) + 4 * vII + 6 * 0.0625 * p.pIII * (1 - p.pIII)
    expect(r.kyVong).toBeCloseTo(ky, 10)
    expect(r.saiSo).toBeCloseTo(Math.sqrt(ps), 10)
    const p8 = r.pmf.slice(Math.round(8 / BUOC_DIEM)).reduce((s, x) => s + x, 0)
    expect(r.p8).toBeCloseTo(p8, 12)
  })
  it('khung khác: khung chỉ một câu Đúng–sai; khung rỗng ⇒ điểm 0 chắc chắn; mục tiêu tuỳ chọn', () => {
    const mot = phanBoDiem({ pI: 0, pY: 1, pIII: 0 }, { I: 0, II: 1, III: 0 })
    expect(mot.pmf).toHaveLength(21)
    expect(mot.kyVong).toBeCloseTo(1, 12)
    const rong = phanBoDiem({ pI: 1, pY: 1, pIII: 1 }, { I: 0, II: 0, III: 0 })
    expect(rong).toEqual({ kyVong: 0, p8: 0, saiSo: 0, pmf: [1] })
    const p = { pI: 0.95, pY: 0.95, pIII: 0.95 }
    expect(phanBoDiemTheoMuc(p, ts.KHUNG_DE, 9, ts).p8).toBeLessThan(phanBoDiem(p).p8)
    expect(phanBoDiemTheoMuc(p, ts.KHUNG_DE, 8, ts)).toEqual(phanBoDiem(p))
  })
  it('xác suất ngoài [0, 1] bị kẹp, không làm hỏng PMF', () => {
    const r = phanBoDiem({ pI: 1.3, pY: -0.2, pIII: Number.NaN })
    expect(r.pmf.reduce((s, x) => s + x, 0)).toBeCloseTo(1, 12)
    expect(r.kyVong).toBeCloseTo(4.5, 10)
  })
})

describe('Phần II là "phần chính xác" — bảng 3.1 của nghiên cứu', () => {
  it('VÀNG: điểm kỳ vọng / câu tại p ý 0,75/0,85/0,90/0,95 = 0,58/0,73/0,81/0,90; P(đủ 4) = 0,32/0,52/0,66/0,81', () => {
    const bang: [number, number, number][] = [[0.75, 0.58, 0.32], [0.85, 0.73, 0.52], [0.9, 0.81, 0.66], [0.95, 0.9, 0.81]]
    for (const [p, e, du4] of bang) {
      const r = phanBoDiem({ pI: 0, pY: p, pIII: 0 }, { I: 0, II: 1, III: 0 })
      expect(Math.abs(r.kyVong - e)).toBeLessThanOrEqual(0.01)
      expect(Math.abs(pmfSoYDung([p, p, p, p])[4]! - du4)).toBeLessThanOrEqual(0.01)
      expect(Math.abs(phanBoDiem({ pI: 0, pY: p, pIII: 0 }, { I: 0, II: 4, III: 0 }).kyVong - 4 * e)).toBeLessThanOrEqual(0.04)
    }
  })
  it('pmfSoYDung: xác suất từng ý khác nhau, tổng 1', () => {
    const r = pmfSoYDung([0.9, 0.8, 0.5, 0.1])
    expect(r).toHaveLength(5)
    expect(r.reduce((s, x) => s + x, 0)).toBeCloseTo(1, 12)
    expect(r[4]).toBeCloseTo(0.9 * 0.8 * 0.5 * 0.1, 12)
    expect(r[0]).toBeCloseTo(0.1 * 0.2 * 0.5 * 0.9, 12)
  })
})

/** Hàm `capNhat` NGUYÊN VĂN của mô phỏng (mảng P theo chỉ số) — để đối chiếu từng số. */
function capNhatMoPhong(P: number[], kn: number[], dung: boolean, g: number, S: number, T: number): number[] {
  const pAll = kn.reduce((s, k) => s * P[k]!, 1)
  const pc = pAll * (1 - S) + (1 - pAll) * g
  const moi = P.slice()
  for (const k of kn) {
    const pKhac = pAll / P[k]!
    const thich = dung ? ((1 - S) * pKhac + g * (1 - pKhac)) / pc : (S * pKhac + (1 - g) * (1 - pKhac)) / (1 - pc)
    const p = Math.min(0.99, Math.max(0.02, P[k]! * thich))
    moi[k] = p + (1 - p) * T
  }
  return moi
}

describe('capNhatHoi — Bayes hội qua cổng AND + bước học (đúng capNhat của mô phỏng)', () => {
  it('khớp từng số với capNhat của mô phỏng trên 2 000 trường hợp ngẫu nhiên tất định', () => {
    const rng = mulberry32(7)
    for (let lan = 0; lan < 2000; lan++) {
      const P = Array.from({ length: 6 }, () => 0.02 + 0.97 * rng())
      const soKn = 1 + Math.floor(rng() * 3)
      const kn = [...new Set(Array.from({ length: soKn }, () => Math.floor(rng() * 6)))]
      const dung = rng() < 0.5
      const g = [0.25, 0.5, 0.01, 0.0625][Math.floor(rng() * 4)]!
      const S = 0.02 + 0.15 * rng()
      const T = rng() < 0.5 ? 0.15 : 0
      const ky = capNhatMoPhong(P, kn, dung, g, S, T)
      const ra = capNhatHoi(Object.fromEntries(P.map((p, i) => [`v${i}`, p])), kn.map((k) => `v${k}`), dung, g, S, T)
      for (let i = 0; i < 6; i++) expect(ra[`v${i}`]).toBe(ky[i])
    }
  })
  it('gán trách: sai câu 2 vi kỹ năng ⇒ vi kỹ năng P thấp hơn giảm nhiều hơn; đúng ⇒ cả hai cùng tăng', () => {
    const P = { a: 0.9, b: 0.5 }
    const sai = capNhatHoi(P, ['a', 'b'], false, 0.25, 0.08, 0)
    expect(sai.a).toBeLessThan(0.9)
    expect(sai.b).toBeLessThan(0.5)
    expect(0.5 - sai.b!).toBeGreaterThan(0.9 - sai.a!)
    expect(sai.b! / 0.5).toBeLessThan(sai.a! / 0.9)
    const dung = capNhatHoi(P, ['a', 'b'], true, 0.25, 0.08, 0)
    expect(dung.a).toBeGreaterThan(0.9)
    expect(dung.b).toBeGreaterThan(0.5)
  })
  it('không sửa đầu vào; vi kỹ năng chưa có ⇒ P0; vi kỹ năng không liên quan giữ nguyên; kẹp [P_MIN, P_MAX] rồi bước học', () => {
    const P = Object.freeze({ a: 0.6, z: 0.4 })
    const ra = capNhatHoi(P, ['a', 'moi'], true, 0.25, 0.08, 0.15)
    expect(P).toEqual({ a: 0.6, z: 0.4 })
    expect(ra.z).toBe(0.4)
    expect(ra.moi).toBe(capNhatHoi({ a: 0.6, moi: ts.P0 }, ['a', 'moi'], true, 0.25, 0.08, 0.15).moi)
    const tran = capNhatHoi({ a: 0.99 }, ['a'], true, 0.25, 0.02, 0)
    expect(tran.a).toBe(ts.P_MAX)
    expect(capNhatHoi({ a: 0.99 }, ['a'], true, 0.25, 0.02, 0.15).a).toBeCloseTo(0.99 + 0.01 * 0.15, 12)
    const day = capNhatHoi({ a: 0.03 }, ['a'], false, 0.01, 0.02, 0)
    expect(day.a).toBe(ts.P_MIN)
  })
  it('vi kỹ năng trùng trong kn ⇒ tính một lần; kn rỗng ⇒ bản sao y hệt', () => {
    expect(capNhatHoi({ a: 0.5 }, ['a', 'a'], false, 0.25, 0.08, 0.15)).toEqual(capNhatHoi({ a: 0.5 }, ['a'], false, 0.25, 0.08, 0.15))
    const P = { a: 0.5 }
    const ra = capNhatHoi(P, [], true, 0.25, 0.08, 0.15)
    expect(ra).toEqual(P)
    expect(ra).not.toBe(P)
  })
  it('pAnd = tích P (trùng tính một lần), vắng ⇒ P0', () => {
    const hs = hoSoTuP({ a: 0.9, b: 0.5 })
    expect(pAnd(hs, ['a', 'b'])).toBeCloseTo(0.45, 12)
    expect(pAnd(hs, ['a', 'a', 'b'])).toBeCloseTo(0.45, 12)
    expect(pAnd(hs, ['a', 'zz'])).toBeCloseTo(0.9 * ts.P0, 12)
    expect(pAnd(hs, [])).toBe(1)
  })
})

describe('xacSuatPhan / xacSuatDungCau / trongSoCau', () => {
  const cauI = { qid: 'q1', phan: 'I' as const, maDang: 'D', mucDo: null, vkn: ['a', 'b'], nguon: 'thay' as const }
  const cauIII = { qid: 'q3', phan: 'III' as const, maDang: 'D', mucDo: null, vkn: ['a'], nguon: 'thay' as const }
  const cauII = { qid: 'q2', phan: 'II' as const, maDang: 'D', mucDo: null, vkn: ['a'], vknY: [['a'], ['b'], ['c'], ['a', 'b']], nguon: 'thay' as const }
  const hs = hoSoTuP({ a: 0.9, b: 0.8, c: 0.5 })
  it('Phần I/III theo cổng AND; Phần II trung bình 4 ý trên vknY', () => {
    const s = 0.08
    const r = xacSuatPhan(hs, [cauI, cauII, cauIII], s)
    expect(r.pI).toBeCloseTo(0.72 * 0.92 + 0.28 * 0.25, 12)
    expect(r.pIII).toBeCloseTo(0.9 * 0.92 + 0.1 * 0.01, 12)
    const y = [0.9, 0.8, 0.5, 0.72].map((p) => p * 0.92 + (1 - p) * 0.5)
    expect(r.pY).toBeCloseTo(y.reduce((a, b) => a + b, 0) / 4, 12)
    expect(xacSuatDungCau(hs, cauII, s)).toBeCloseTo(r.pY, 12)
  })
  it('vknY vắng ⇒ mỗi ý dùng vkn; vknY[i] rỗng ⇒ vkn', () => {
    const khongY = { ...cauII, vknY: undefined, vkn: ['b'] }
    expect(xacSuatPhan(hs, [khongY], 0.1).pY).toBeCloseTo(0.8 * 0.9 + 0.2 * 0.5, 12)
    const yRong = { ...cauII, vkn: ['c'], vknY: [[], ['c'], ['c'], ['c']] }
    expect(xacSuatPhan(hs, [yRong], 0.1).pY).toBeCloseTo(0.5 * 0.9 + 0.5 * 0.5, 12)
  })
  it('phần không có câu trong phạm vi ⇒ prior P0(1 − s) + (1 − P0)G (thận trọng)', () => {
    const r = xacSuatPhan(hs, [cauI], 0.1)
    expect(r.pY).toBeCloseTo(ts.P0 * 0.9 + (1 - ts.P0) * 0.5, 12)
    expect(r.pIII).toBeCloseTo(ts.P0 * 0.9 + (1 - ts.P0) * 0.01, 12)
  })
  it('trongSoCau = điểm câu × (1 − pAnd) × hệ số vùng học (0,75–0,90 ×1,3 · < 0,5 ×0,8)', () => {
    // Phần I: pAnd 0,72 ⇒ P(đúng) 0,7324 (ngoài vùng học, ≥ 0,5) ⇒ ×1
    expect(trongSoCau(hs, cauI, 0.08)).toBeCloseTo(0.25 * (1 - 0.72) * 1, 12)
    // Phần III vkn [a]: pAnd 0,9 ⇒ P(đúng) 0,829 (trong vùng) ⇒ ×1,3
    expect(trongSoCau(hs, cauIII, 0.08)).toBeCloseTo(0.25 * 0.1 * 1.3, 12)
    // Phần II: điểm đủ 4 ý = 1; pAnd cả câu = a·b·c = 0,36; P(đúng) trung bình ý ≈ 0,8 (trong vùng) ⇒ ×1,3
    expect(trongSoCau(hs, cauII, 0.08)).toBeCloseTo(1 * (1 - 0.9 * 0.8 * 0.5) * 1.3, 12)
    // P(đúng) < 0,5 ⇒ ×0,8
    const yeu = hoSoTuP({ a: 0.1, b: 0.1 })
    expect(trongSoCau(yeu, cauI, 0.08)).toBeCloseTo(0.25 * (1 - 0.01) * 0.8, 12)
    // Nắm hết ⇒ còn lấy được ~ 0
    expect(trongSoCau(hoSoTuP({ a: 1, b: 1 }), cauI, 0.05)).toBe(0)
  })
})

describe('SPRT (Wald) — ba trạng thái', () => {
  const chuoi = (ds: boolean[], laY = false): number => ds.reduce((d, x) => buocSprt(d, x, laY), 0)
  it('ngưỡng: trên ln(0,8/0,1) = 2,079 · dưới ln(0,2/0,9) = −1,504', () => {
    const n = nguongSprt()
    expect(n.tren).toBeCloseTo(Math.log(8), 12)
    expect(n.duoi).toBeCloseTo(Math.log(0.2 / 0.9), 12)
  })
  it('9 đúng liên tiếp ⇒ vững (8 đúng chưa đủ)', () => {
    expect(trangThaiSprt(chuoi(Array(9).fill(true)))).toBe('vung')
    expect(trangThaiSprt(chuoi(Array(8).fill(true)))).toBe('chua_du')
  })
  it('13 đúng + 1 sai ⇒ vững, ở mọi vị trí của lượt sai', () => {
    for (let i = 0; i < 14; i++) {
      const ds = Array(14).fill(true)
      ds[i] = false
      expect(trangThaiSprt(chuoi(ds))).toBe('vung')
      expect(trangThaiSprt(ds.reduce((d, x) => buocSprtPhatLai(d, x, false), 0))).toBe('vung')
    }
    expect(trangThaiSprt(chuoi([...Array(12).fill(true), false]))).toBe('chua_du')
  })
  it('2 sai liên tiếp từ 0 ⇒ chưa vững (−2,197 ≤ −1,504); 1 sai ⇒ chưa đủ bằng chứng', () => {
    expect(chuoi([false, false])).toBeCloseTo(2 * Math.log(1 / 3), 12)
    expect(chuoi([false, false])).toBeCloseTo(-2.197, 3)
    expect(trangThaiSprt(chuoi([false, false]))).toBe('chua_vung')
    expect(trangThaiSprt(chuoi([false]))).toBe('chua_du')
    expect(trangThaiSprt(chuoi([false, false, false]))).toBe('chua_vung')
  })
  it('ý Đúng–sai dùng p1 = 0,93: đúng +ln(0,93/0,7), sai +ln(0,07/0,3); 8 ý đúng ⇒ vững (7 chưa)', () => {
    expect(buocSprt(0, true, true)).toBeCloseTo(Math.log(0.93 / 0.7), 12)
    expect(buocSprt(0, false, true)).toBeCloseTo(Math.log(0.07 / 0.3), 12)
    expect(buocSprt(0, true, false)).toBeCloseTo(Math.log(0.9 / 0.7), 12)
    expect(trangThaiSprt(chuoi(Array(8).fill(true), true))).toBe('vung')
    expect(trangThaiSprt(chuoi(Array(7).fill(true), true))).toBe('chua_du')
  })
  it('bước phát lại liên tục không xuống dưới ngưỡng dưới (em học được thì một lượt đúng ra khỏi "chưa vững")', () => {
    const { duoi } = nguongSprt()
    const d = [false, false, false, false].reduce((x, v) => buocSprtPhatLai(x, v, false), 0)
    expect(d).toBe(duoi)
    expect(trangThaiSprt(d)).toBe('chua_vung')
    expect(trangThaiSprt(buocSprtPhatLai(d, true, false))).toBe('chua_du')
    expect(buocSprtPhatLai(1, true, false)).toBe(buocSprt(1, true, false))
  })
})

describe('Tốc độ (lognormal) — kỳ vọng riêng, nhãn, τ, β', () => {
  it('mucDoSo nhận mọi cách viết mức độ của kho', () => {
    for (const m of ['NB', 'Nhận biết', 'biet', 'nhan_biet', null, '', 'lạ']) expect(mucDoSo(m)).toBe(0)
    for (const m of ['TH', 'Thông hiểu', 'hieu', 'thong_hieu', 'th']) expect(mucDoSo(m)).toBe(1)
    for (const m of ['VD', 'Vận dụng', 'van_dung', 'VDC', 'Vận dụng cao', 'van_dung_cao', 'vd']) expect(mucDoSo(m)).toBe(2)
  })
  it('msKyVong: β vắng ⇒ giây cơ sở theo phần × mức (I 75/105/150 · II 150/210/300 · III 120/180/240) × 1000; τ > 0 ⇒ nhanh hơn', () => {
    expect(msKyVong(null, 0, 'I', 'NB')).toBeCloseTo(75_000, 6)
    expect(msKyVong(undefined, 0, 'I', 'Thông hiểu')).toBeCloseTo(105_000, 6)
    expect(msKyVong(null, 0, 'I', 'Vận dụng')).toBeCloseTo(150_000, 6)
    expect(msKyVong(null, 0, 'II', 'TH')).toBeCloseTo(210_000, 6)
    expect(msKyVong(null, 0, 'III', 'VDC')).toBeCloseTo(240_000, 6)
    expect(msKyVong(Number.NaN, 0, 'III', null)).toBeCloseTo(120_000, 6)
    expect(msKyVong(Math.log(60_000), 0, 'I', 'NB')).toBeCloseTo(60_000, 6)
    expect(msKyVong(Math.log(60_000), Math.log(2), 'I', null)).toBeCloseTo(30_000, 6)
    expect(msKyVong(Math.log(60_000), -Math.log(2), 'I', null)).toBeCloseTo(120_000, 6)
  })
  it('ngưỡng lướt = max(3 s, 10 % kỳ vọng) kẹp [3 s, 8 s]', () => {
    expect(nguongLuotMs(20_000)).toBe(3000)
    expect(nguongLuotMs(60_000)).toBe(6000)
    expect(nguongLuotMs(200_000)).toBe(8000)
    expect(nguongLuotMs(null)).toBe(3000)
  })
  it('nhãn: trôi chảy ≤ 1,25× · chậm > 2× · lướt = sai và < ngưỡng · sai không lướt = thường · ms hỏng ⇒ null', () => {
    const ky = 60_000
    expect(nhanTocDo(75_000, ky, true)).toBe('troi_chay')
    expect(nhanTocDo(75_001, ky, true)).toBe('thuong')
    expect(nhanTocDo(120_000, ky, true)).toBe('thuong')
    expect(nhanTocDo(120_001, ky, true)).toBe('cham')
    expect(nhanTocDo(5_999, ky, false)).toBe('luot')
    expect(nhanTocDo(6_000, ky, false)).toBe('thuong')
    expect(nhanTocDo(1_000, ky, true)).toBe('troi_chay')
    expect(nhanTocDo(null, ky, true)).toBeNull()
    expect(nhanTocDo(-1, ky, true)).toBeNull()
    expect(nhanTocDo(900_001, ky, true)).toBeNull()
    expect(nhanTocDo(10_000, null, true)).toBeNull()
  })
  it('uocTau: trung vị (β − ln ms) trên ≤ 20 mẫu cuối, co về 0 bằng 10 mẫu ảo; mẫu hỏng bị bỏ', () => {
    expect(uocTau([])).toEqual({ tau: 0, n: 0 })
    const b = Math.log(100_000)
    // 10 mẫu nhanh gấp đôi (β − ln ms = ln 2) ⇒ τ = ln2 × 10/20
    const mau = Array.from({ length: 10 }, () => ({ betaLn: b, ms: 50_000 }))
    expect(uocTau(mau).tau).toBeCloseTo(Math.log(2) * 0.5, 12)
    expect(uocTau(mau).n).toBe(10)
    // 30 mẫu: 10 chậm (cũ) rồi 20 nhanh (mới) ⇒ chỉ lấy 20 mẫu cuối
    const cu = Array.from({ length: 10 }, () => ({ betaLn: b, ms: 400_000 }))
    const moi = Array.from({ length: 20 }, () => ({ betaLn: b, ms: 50_000 }))
    const r = uocTau([...cu, ...moi])
    expect(r.n).toBe(20)
    expect(r.tau).toBeCloseTo((Math.log(2) * 20) / 30, 12)
    // cỡ chẵn ⇒ trung bình hai số giữa
    expect(uocTau([{ betaLn: b, ms: 50_000 }, { betaLn: b, ms: 100_000 }]).tau).toBeCloseTo(((Math.log(2) + 0) / 2) * (2 / 12), 12)
    // mẫu hỏng (ms ≤ 0, quá 900 s, β NaN) bị bỏ
    expect(uocTau([{ betaLn: b, ms: 0 }, { betaLn: b, ms: 950_000 }, { betaLn: Number.NaN, ms: 1000 }])).toEqual({ tau: 0, n: 0 })
  })
  it('betaTuMau: < 8 mẫu hợp lệ ⇒ null; ≥ 8 ⇒ trung vị ln ms', () => {
    expect(betaTuMau([1, 2, 3, 4, 5, 6, 7].map((x) => x * 1000))).toBeNull()
    expect(betaTuMau([0, 0, 0, 0, 1000, 2000, 3000, 4000])).toBeNull()
    const ms = [10, 20, 30, 40, 50, 60, 70, 80].map((x) => x * 1000)
    expect(betaTuMau(ms)).toBeCloseTo((Math.log(40_000) + Math.log(50_000)) / 2, 12)
    expect(trungVi([3, 1, 2])).toBe(2)
    expect(Number.isNaN(trungVi([]))).toBe(true)
  })
})
