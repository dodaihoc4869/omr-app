// @vitest-environment node
// OMNI 3 · GĐ A — MÔ PHỎNG "CHẮC 8+" CHẠY BẰNG CHÍNH LÕI THUẦN (thay cho docs/omni-0510/mo-phong-chac-8.mjs):
// 36 vi kỹ năng, kho 60 I + 20 II + 32 III (đúng kho của mô phỏng), thể lực 40, học thật T 0,20, sơ ý thật S, kiến thức xuất phát P0.
// Mỗi ngày: xếp câu theo trongSoCau (nợ ≤ 50 % → mới theo quota → ôn), sinh kết quả từ trạng thái THẬT bằng PRNG tất định, ghi thành
// SuKienOmni, rồi hồ sơ = phatLaiEm(toàn bộ sổ) — P vi kỹ năng, sơ ý riêng (lượt vững), Phần II theo ý — và dự báo = phanBoDiem(xacSuatPhan).
// Chứng chỉ mô hình: P_mô hình(≥ 8) ≥ 0,90. Khai oan: P_thật(≥ 8) < 0,80 lúc cấp (P thật tính từ trạng thái 0/1 thật + S thật).
import { describe, expect, it } from 'vitest'
import { THAM_SO_OMNI, type QCau, type SuKienOmni } from '../server/src/omni-kieu'
import { phatLaiEm } from '../server/src/omni-p-vkn'
import { duBaoDiem, phanBoDiem, trongSoCau, xacSuatPhan } from '../server/src/du-bao-diem'
import { xetChungChi } from '../server/src/omni-chung-chi'
import { KHO_MO_PHONG, TAT_CA_KN, hoSoTuP, mulberry32 } from './omni-3-loi-chung'

const G = THAM_SO_OMNI.G
const T_THAT = 0.2
const THE_LUC = 40
const ngayVn = (n: number): string => `2026-10-${String(n).padStart(2, '0')}`
const msNgay = (n: number): number => Date.parse(`${ngayVn(n)}T01:00:00Z`) // 08:00 giờ VN

interface KetQuaEm { ngayChung: number | null; thatLucChung: number | null; ngayDuBon: number | null; thatLucDuBon: number | null; sEm: number }

function moPhongEm(kho: readonly QCau[], p0: number, sThat: number, rng: () => number, soNgay = 7): KetQuaEm {
  const that = new Map(TAT_CA_KN.map((k) => [k, rng() < p0]))
  const q = new Map(kho.map((c) => [c.qid, c]))
  const p0Map = new Map(TAT_CA_KN.map((k) => [k, p0]))
  const suKien: SuKienOmni[] = []
  const daGap = new Set<string>()
  const sai = new Set<string>()
  const kq: KetQuaEm = { ngayChung: null, thatLucChung: null, ngayDuBon: null, thatLucDuBon: null, sEm: THAM_SO_OMNI.S0 }
  let hs = phatLaiEm('SIM', { suKien, q, p0: p0Map, homNay: ngayVn(1) })
  const quanSat = (kn: readonly string[], g: number): 0 | 1 => {
    const d: 0 | 1 = rng() < (kn.every((k) => that.get(k)) ? 1 - sThat : g) ? 1 : 0
    for (const k of kn) if (!that.get(k) && rng() < T_THAT) that.set(k, true)
    return d
  }
  for (let ngay = 1; ngay <= soNgay; ngay++) {
    const xep = (ds: QCau[]): QCau[] => ds.map((c) => [c, trongSoCau(hs, c, hs.sEm)] as const).sort((a, b) => b[1] - a[1]).map((x) => x[0])
    const no = xep(kho.filter((c) => sai.has(c.qid)))
    const moi = xep(kho.filter((c) => !daGap.has(c.qid)))
    const on = xep(kho.filter((c) => daGap.has(c.qid) && !sai.has(c.qid)))
    const quotaMoi = ngay <= 4 ? Math.ceil(moi.length / (5 - ngay)) : moi.length
    const layNo = Math.min(no.length, Math.floor(THE_LUC * 0.5))
    const layMoi = Math.min(moi.length, quotaMoi, THE_LUC - layNo)
    const layOn = Math.max(0, THE_LUC - layNo - layMoi)
    const luot = [...no.slice(0, layNo), ...moi.slice(0, layMoi), ...on.slice(0, layOn)]
    luot.forEach((c, i) => {
      daGap.add(c.qid)
      const t = msNgay(ngay) + i * 60_000
      let ketQua: 0 | 1
      let y: (0 | 1)[] | null = null
      if (c.phan === 'II') {
        y = [0, 1, 2, 3].map((j) => quanSat(c.vknY![j]!, G.Y))
        ketQua = y.every((v) => v === 1) ? 1 : 0
      } else {
        ketQua = quanSat(c.vkn, c.phan === 'I' ? G.I : G.III)
      }
      if (ketQua) sai.delete(c.qid)
      else sai.add(c.qid)
      suKien.push({
        khoa: `e${t}`, sbd: 'SIM', qid: c.qid, songSinh: false, nguon: 'luyen', ketQua, luc: new Date(t).toISOString(), ngayVn: ngayVn(ngay),
        receivedAt: t, assistance: 'none', purpose: null, phan: c.phan, maDang: c.maDang, mucDo: null, y,
      })
    })
    hs = phatLaiEm('SIM', { suKien, q, p0: p0Map, homNay: ngayVn(ngay) })
    const mo = phanBoDiem(xacSuatPhan(hs, kho, hs.sEm))
    const thatP = phanBoDiem(xacSuatPhan(hoSoTuP(Object.fromEntries(TAT_CA_KN.map((k) => [k, that.get(k) ? 1 : 0]))), kho, sThat)).p8
    if (kq.ngayChung === null && mo.p8 >= 0.9) { kq.ngayChung = ngay; kq.thatLucChung = thatP }
    // Chứng chỉ ĐỦ điều kiện mô hình K ∧ C ∧ M (T = ca chốt thật nằm ngoài mô phỏng — coi như đạt).
    if (kq.ngayDuBon === null && xetChungChi(hs, kho, duBaoDiem(hs, kho), { diem: 10, ngay: ngayVn(ngay) }, THE_LUC).dat) { kq.ngayDuBon = ngay; kq.thatLucDuBon = thatP }
  }
  kq.sEm = hs.sEm
  return kq
}

/** Hạt giống y như mô phỏng tham chiếu: 50 000 + 1000·round(100 S) + 97·i + round(100 P0). */
const chayO = (soEm: number, p0: number, sThat: number): KetQuaEm[] =>
  Array.from({ length: soEm }, (_, i) => moPhongEm(KHO_MO_PHONG, p0, sThat, mulberry32(50_000 + 1000 * Math.round(sThat * 100) + 97 * i + Math.round(p0 * 100))))
const tiLe = (n: number, d: number): number => (d ? n / d : 0)

describe('mô phỏng "chắc 8+" bằng lõi thuần (phatLaiEm + xacSuatPhan + phanBoDiem)', () => {
  it('60 em · sơ ý thật 0,06 · P0 0,45 · thể lực 40: ≥ 85 % đạt P_mô hình(≥ 8) ≥ 0,90 trong 7 ngày; khai oan ≤ 8 %', () => {
    const bat = Date.now()
    const kq = chayO(60, 0.45, 0.06)
    const dat = kq.filter((x) => x.ngayChung !== null && x.ngayChung <= 7)
    const oan = dat.filter((x) => x.thatLucChung! < 0.8)
    const sTb = kq.reduce((s, x) => s + x.sEm, 0) / kq.length
    console.info(`[mô phỏng S 0,06 · P0 0,45] đạt ≤ 7 ngày ${dat.length}/60 · khai oan ${oan.length}/${dat.length} · sơ ý ước ngày 7 ${sTb.toFixed(3)} · ${Date.now() - bat} ms`)
    expect(tiLe(dat.length, kq.length)).toBeGreaterThanOrEqual(0.85)
    expect(tiLe(oan.length, dat.length)).toBeLessThanOrEqual(0.08)
    expect(sTb).toBeGreaterThan(0.04)
    expect(sTb).toBeLessThan(0.08)
  })
  it('chứng chỉ ĐỦ K ∧ C ∧ M (ca chốt coi như đạt), 14 ngày: S 0,06 ⇒ ≥ 75 % em đạt, khai oan ≤ 5 %; S 0,10 ⇒ điều kiện Cẩn thận chặn (≤ 10 % em được cấp)', () => {
    const thuong = Array.from({ length: 40 }, (_, i) => moPhongEm(KHO_MO_PHONG, 0.45, 0.06, mulberry32(50_000 + 6000 + 97 * i + 45), 14))
    const cap = thuong.filter((x) => x.ngayDuBon !== null)
    const oan = cap.filter((x) => x.thatLucDuBon! < 0.8)
    const soY = Array.from({ length: 40 }, (_, i) => moPhongEm(KHO_MO_PHONG, 0.45, 0.1, mulberry32(50_000 + 10_000 + 97 * i + 45), 14))
    const capSoY = soY.filter((x) => x.ngayDuBon !== null)
    console.info(`[chứng chỉ K∧C∧M, 14 ngày] S 0,06: cấp ${cap.length}/40, khai oan ${oan.length} · S 0,10: cấp ${capSoY.length}/40`)
    expect(tiLe(cap.length, 40)).toBeGreaterThanOrEqual(0.75)
    expect(tiLe(oan.length, cap.length)).toBeLessThanOrEqual(0.05)
    expect(tiLe(capSoY.length, 40)).toBeLessThanOrEqual(0.1)
    // Chứng chỉ đủ bốn điều kiện không bao giờ đến TRƯỚC mốc chỉ-mô-hình.
    for (const x of [...thuong, ...soY]) if (x.ngayDuBon !== null) expect(x.ngayChung).not.toBeNull()
    for (const x of [...thuong, ...soY]) if (x.ngayDuBon !== null) expect(x.ngayDuBon).toBeGreaterThanOrEqual(x.ngayChung!)
  })
  it('cùng hạt giống ⇒ cùng kết quả (tất định)', () => {
    expect(chayO(3, 0.45, 0.06)).toEqual(chayO(3, 0.45, 0.06))
  })
})
