// KHO MỎNG → RÚT LẶP THÔNG MINH — mục 2, SO-VIEC.md 19/09.
//
// Bối cảnh thật: sau vá "rút đề lẫn chương" (chặn bù kho lấy nhầm chuyên đề),
// ca nào kho ĐÚNG chuyên đề quá mỏng thì phần "câu mới" của `dungDeRieng`
// không còn được bù bằng chương khác nữa — mỏng thật thì phải lặp câu trong
// đúng chuyên đề, và lặp phải rải sao cho KHÔNG CẶP EM NÀO TRÙNG QUÁ 2 CÂU.
//
// Thuật toán chặn đỉnh trùng (`de-rieng-tran-trung.ts`, đã đo ở
// `de-rieng-tran-trung.test.ts`: kho 200 · 30 em · 18 câu ⇒ đỉnh ≤ 2) nay được
// nối vào ĐÚNG chỗ trước kia bốc độc lập từng em (`dungDeRieng`, phần "câu
// mới"). File này đo lại đúng cấu hình đã kiểm chứng đó, nhưng đi qua TRỌN
// đường ống `dungDeRieng` — gồm cả câu khắc phục cá nhân bị KHOÁ không được
// đổi — để chắc chỗ nối không làm hỏng số đo gốc.
import { describe, expect, it } from 'vitest'
import { chonCauLapChoEm, demLanSai, dungDeRieng, type CaTruocDaCham } from '../src/lib/de-rieng'
import { rutDeCoBatBuoc, type CauUngVien, type PhanDe, type YeuCauRut } from '../src/lib/rut-de'
import { hashSeed } from '../src/lib/exam-shuffle'

function cau(phan: PhanDe, i: number, chuyenDe = 'Ester – lipid'): CauUngVien {
  return {
    phan,
    id: `${phan}-${i}`,
    maDe: 'de1',
    soGoc: i,
    chuyenDe,
    mucDo: (['biet', 'hieu', 'van_dung'] as const)[i % 3],
    dang: 'chua_ro',
    text: `Câu ${phan}-${i}`,
    coHinh: false,
    canXem: false,
    sao: 0,
    lyDoSao: '',
  }
}

/** Kho MỎNG ĐÚNG MỘT CHUYÊN ĐỀ — 200 câu phần I, y hệt tổ hợp đã đo đỉnh ≤ 2
 * ở `de-rieng-tran-trung.test.ts` ("kho 200 · 30 em · 18 câu"). Phần II/III bỏ
 * trống (soCau 0) để phép đo tập trung đúng vào phần đang mỏng. */
const UV_MONG: Record<PhanDe, CauUngVien[]> = {
  I: Array.from({ length: 200 }, (_, i) => cau('I', i)),
  II: [],
  III: [],
}

const M = 30
const DS = Array.from({ length: M }, (_, i) => `SBD${String(i).padStart(2, '0')}`)
const YC_MONG: YeuCauRut = { soCau: { I: 18, II: 0, III: 0 }, chuyenDe: [], mucDo: [], tranhQid: [], seed: 777 }

/** Đỉnh trùng đo trên TOÀN BỘ bộ câu (`boTheoEm`) của từng cặp em. */
function dinhTrungBoTheoEm(boTheoEm: Record<string, string[]>, dsSbd: string[]): number {
  let dinh = 0
  for (let a = 0; a < dsSbd.length; a++) {
    const A = new Set(boTheoEm[dsSbd[a]!])
    for (let b = a + 1; b < dsSbd.length; b++) {
      const B = boTheoEm[dsSbd[b]!]!
      let g = 0
      for (const x of B) if (A.has(x)) g++
      if (g > dinh) dinh = g
    }
  }
  return dinh
}

describe('KHO MỎNG (200 câu, 30 em, 18 câu/em) — không cặp nào trùng quá 2 câu', () => {
  it('mọi em ĐỦ 18 câu, không em nào nhận trùng câu trong chính đề mình', () => {
    const ra = dungDeRieng({ uv: UV_MONG, yc: YC_MONG, dsSbd: DS, dsCa: [] })
    for (const sbd of DS) {
      const qids = ra.boTheoEm[sbd]!
      expect(qids).toHaveLength(18)
      expect(new Set(qids).size).toBe(18)
    }
  })

  it('ĐỈNH TRÙNG GIỮA HAI EM BẤT KỲ ≤ 2 — đúng ngưỡng đã đo ở de-rieng-tran-trung.test.ts', () => {
    const ra = dungDeRieng({ uv: UV_MONG, yc: YC_MONG, dsSbd: DS, dsCa: [] })
    expect(dinhTrungBoTheoEm(ra.boTheoEm, DS)).toBeLessThanOrEqual(2)
  })

  it('ĐỐI CHỨNG: đường cũ (mỗi em bốc độc lập qua rutDeCoBatBuoc) ra đỉnh CAO HƠN HẲN', () => {
    // Tái hiện ĐÚNG cách bản trước dựng đề — seed riêng từng em, không biết gì
    // về những em khác. Đây là thuật toán ĐANG CHẠY trước vá 19/09.
    const boCu: Record<string, string[]> = {}
    DS.forEach((sbd, idxEm) => {
      const kq = rutDeCoBatBuoc(UV_MONG, { ...YC_MONG, seed: hashSeed(`${YC_MONG.seed}:${idxEm}:${sbd}`) }, {})
      boCu[sbd] = kq.chon.I.map((c) => c.id)
    })
    const dinhCu = dinhTrungBoTheoEm(boCu, DS)

    const ra = dungDeRieng({ uv: UV_MONG, yc: YC_MONG, dsSbd: DS, dsCa: [] })
    const dinhMoi = dinhTrungBoTheoEm(ra.boTheoEm, DS)

    expect(dinhCu).toBeGreaterThan(2)
    expect(dinhMoi).toBeLessThanOrEqual(2)
    expect(dinhMoi).toBeLessThan(dinhCu)
  })

  it('TẤT ĐỊNH — cùng seed, cùng danh sách em thì ra đúng bộ cũ (chấm lại không lệch)', () => {
    const a = dungDeRieng({ uv: UV_MONG, yc: YC_MONG, dsSbd: DS, dsCa: [] })
    const b = dungDeRieng({ uv: UV_MONG, yc: YC_MONG, dsSbd: DS, dsCa: [] })
    for (const sbd of DS) expect([...a.boTheoEm[sbd]!].sort()).toEqual([...b.boTheoEm[sbd]!].sort())
  })
})

describe('CÂU KHẮC PHỤC CÁ NHÂN KHÔNG BỊ ĐỔI MẤT — pha hạ trùng chỉ được động vào câu MỚI', () => {
  /** 10 trong 30 em có ca trước, mỗi em sai đúng 6 câu phần I ⇒ cần 2 câu khắc
   * phục (30% của 6, tròn lên) — đúng cỡ nhỏ, thật, không phải số bịa. */
  const DS_SAI = DS.slice(0, 10)
  const caTruoc: CaTruocDaCham = {
    maCa: 'ca-truoc',
    daLamCua: Object.fromEntries(DS_SAI.map((sbd, k) => [sbd, Array.from({ length: 6 }, (_, j) => `I-${(k * 5 + j) % 200}`)])),
    saiCua: Object.fromEntries(DS_SAI.map((sbd, k) => [sbd, Array.from({ length: 6 }, (_, j) => `I-${(k * 5 + j) % 200}`)])),
  }

  it('mỗi em có ca trước NHẬN ĐỦ đúng những câu mình sai, dù kho mỏng và cả lớp đang bị hạ trùng', () => {
    const ra = dungDeRieng({ uv: UV_MONG, yc: YC_MONG, dsSbd: DS, dsCa: [caTruoc] })
    const demSai = demLanSai([caTruoc])
    for (const sbd of DS_SAI) {
      const lap = chonCauLapChoEm(sbd, [caTruoc], 18, demSai, undefined, new Map(UV_MONG.I.map((c) => [c.id, c])))
      const trongDe = new Set(ra.boTheoEm[sbd])
      for (const q of lap.qids) expect(trongDe.has(q)).toBe(true)
    }
  })

  it('đỉnh trùng vẫn ≤ 2 dù đã khoá câu khắc phục — khoá không phá được ngưỡng đã đo', () => {
    const ra = dungDeRieng({ uv: UV_MONG, yc: YC_MONG, dsSbd: DS, dsCa: [caTruoc] })
    expect(dinhTrungBoTheoEm(ra.boTheoEm, DS)).toBeLessThanOrEqual(2)
  })
})

describe('CA BIÊN — kho mỏng đến mức một em còn không đủ, phải BÁO THIẾU, không im lặng', () => {
  it('kho ít hơn cả chỉ tiêu một em: mọi em nhận trọn kho, `thieuCau` báo đúng số thiếu', () => {
    const uvSieuMong: Record<PhanDe, CauUngVien[]> = { I: Array.from({ length: 5 }, (_, i) => cau('I', i)), II: [], III: [] }
    const ycSieuMong: YeuCauRut = { soCau: { I: 18, II: 0, III: 0 }, chuyenDe: [], mucDo: [], tranhQid: [], seed: 1 }
    const ra = dungDeRieng({ uv: uvSieuMong, yc: ycSieuMong, dsSbd: DS, dsCa: [] })
    for (const sbd of DS) {
      expect(ra.boTheoEm[sbd]).toHaveLength(5)
      const th = ra.thieuCau.find((x) => x.sbd === sbd)
      expect(th?.thieu).toBe(13)
    }
  })
})
