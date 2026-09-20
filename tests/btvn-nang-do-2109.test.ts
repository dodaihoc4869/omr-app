// BTVN "NÂNG ĐỠ" — LÕI THUẦN `src/lib/btvn-nang-do.ts` (Code 1, 21/09/2026). Đề bài `prompt-btvn-nang-do.md`, thiết kế `DE-XUAT-BTVN-NANG-DO-2109.md`;
// Boss duyệt thêm: lõi lấy mức THẤP NHẤT của dạng; câu lõi cao hơn bậc đích + 1 mang nhãn `loi_cao` (cuối chặng, ≤ 2 mỗi chặng, không bao giờ mở chặng);
// ghim là TUỲ CHỌN (`[]` và ≤ 10).
//
// Kiểm TÍNH CHẤT (chạy trên nhiều em ngẫu nhiên có hạt giống cố định) chứ không chỉ ví dụ: lõi ⊆ bộ mọi em · không câu ngoài lõi vượt bậc đích + 1 · +1 bậc ≤ 20 % chỉ ở
// dạng ổn · em chưa hồ sơ ⇒ lõi + Biết/Hiểu · mỗi dạng yếu ≥ 2 câu khi kho còn · |bộ| ∈ [|lõi|, N] và ≤ ngân sách · mỗi chặng mở bằng 2 khởi động, thử thách cuối · tất định · nhanh.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  BTVN_NANG_DO,
  chonBoCuaEm,
  chonLoi,
  maDangCua,
  mucTuChu,
  theTienBo,
  thichNghiChangSau,
  type BoCuaEm,
  type CauGiao,
  type HoSoEmRut,
  type Muc,
  type NganSachBai,
} from '../src/lib/btvn-nang-do'
import { NGUONG_DANG_YEU, SO_CAU_DU_TIN_DANG } from '../src/lib/ho-so-lop'
import { mulberry32 } from '../src/lib/exam-shuffle'

// ───────────────────────── dữ liệu mẫu ─────────────────────────
/** 80 câu, 20 dạng × 4 câu: mức [Biết, Biết, Hiểu, Vận dụng]; phần [I, I, II, III]; sao xoay vòng. */
const cau80 = (): CauGiao[] =>
  Array.from({ length: 80 }, (_, i) => ({
    qid: `q${i}`,
    dang: `D${i % 20}`,
    chuyenDe: `CD${i % 5}`,
    mucDo: ([0, 0, 1, 2] as const)[Math.floor(i / 20)],
    sao: ((i * 7) % 3) as 0 | 1 | 2,
    phan: (['I', 'I', 'II', 'III'] as const)[Math.floor(i / 20)],
  }))
const CAU = cau80()
const dangCuaCau = (i: number) => `D${i % 20}`
const qidCuaDang = (d: number) => [d, d + 20, d + 40, d + 60].map((i) => `q${i}`)

const rong = (): HoSoEmRut => ({ dang: {}, cau: {} })
const dangHS = (bac: Muc, soGap: number, tiLe: number | null) => ({ bac, soGap, soSai: Math.round(soGap * (1 - (tiLe ?? 1))), tiLeKhacPhuc: tiLe })
/** Em YẾU: D0–D9 yếu (bậc Biết), D10–D19 ổn (bậc Biết); vài câu đang sai. */
const emYeu = (): HoSoEmRut => ({
  dang: { ...Object.fromEntries(Array.from({ length: 10 }, (_, d) => [`D${d}`, dangHS(0, 8, 0.4)])), ...Object.fromEntries(Array.from({ length: 10 }, (_, d) => [`D${d + 10}`, dangHS(0, 6, 0.8)])) },
  cau: Object.fromEntries(Array.from({ length: 5 }, (_, d) => [`q${d + 20}`, { trangThai: 'moi_sai' as const, ngayDungKhacNhau: 0, lanSai: 2 }])),
})
/** Em trung bình: D0–D4 yếu, D5–D14 ổn ở Hiểu, còn lại chưa có dữ liệu. */
const emTB = (): HoSoEmRut => ({
  dang: { ...Object.fromEntries(Array.from({ length: 5 }, (_, d) => [`D${d}`, dangHS(0, 8, 0.4)])), ...Object.fromEntries(Array.from({ length: 10 }, (_, d) => [`D${d + 5}`, dangHS(1, 8, 0.85)])) },
  cau: {},
})
/** Em khá: mọi dạng ổn ở Hiểu; mọi câu Biết đã đúng lại ≥ 3 ngày khác nhau. */
const emKha = (): HoSoEmRut => ({
  dang: Object.fromEntries(Array.from({ length: 20 }, (_, d) => [`D${d}`, dangHS(1, 10, 0.95)])),
  cau: Object.fromEntries(Array.from({ length: 40 }, (_, i) => [`q${i}`, { trangThai: 'da_khac_phuc' as const, ngayDungKhacNhau: 3, lanSai: 1 }])),
})
const NS = (soNgay = 7, cauMoiNgay = 12, onLaiMoiNgay = 3): NganSachBai => ({ soNgay, cauMoiNgay, onLaiMoiNgay })

/** Bậc đích tính LẠI theo đúng lời của thiết kế (mục 2C), độc lập với cách cài. */
function bacDichTest(ho: HoSoEmRut, cau: CauGiao[], ma: string): { bac: Muc; yeu: boolean; duTin: boolean } {
  const d = ho.dang[ma]
  const duTin = !!d && d.soGap >= 4
  let bac: Muc = duTin ? d.bac : 0
  const yeu = duTin && d.tiLeKhacPhuc !== null && d.tiLeKhacPhuc < 0.7
  const dung = cau.filter((c) => maDangCua(c) === ma && c.mucDo === bac && ho.cau[c.qid] && ['da_khac_phuc', 'chua_thay_sai'].includes(ho.cau[c.qid].trangThai)).length
  if (!yeu && dung >= 2) bac = Math.min(2, bac + 1) as Muc
  return { bac, yeu, duTin }
}
const tapCua = (bo: BoCuaEm) => [...bo.loi, ...bo.rieng, ...bo.thuThach]
const mucCua = (cau: CauGiao[], q: string) => cau.find((c) => c.qid === q)!.mucDo

/** Em ngẫu nhiên (hạt giống cố định) để chạy tính chất. */
function emNgauNhien(seed: number, cau: CauGiao[]): HoSoEmRut {
  const r = mulberry32(seed)
  const ho: HoSoEmRut = { dang: {}, cau: {} }
  const dangs = [...new Set(cau.map(maDangCua))]
  for (const ma of dangs) {
    if (r() < 0.25) continue // chưa có số liệu dạng
    const soGap = Math.floor(r() * 12)
    const tiLe = soGap < 4 ? null : Math.round(r() * 100) / 100
    ho.dang[ma] = dangHS(Math.floor(r() * 3) as Muc, soGap, tiLe)
  }
  for (const c of cau) {
    const x = r()
    if (x < 0.3) continue // chưa làm
    ho.cau[c.qid] = {
      trangThai: x < 0.5 ? 'da_khac_phuc' : x < 0.65 ? 'chua_thay_sai' : x < 0.85 ? 'dang_on' : 'moi_sai',
      ngayDungKhacNhau: Math.floor(r() * 4),
      lanSai: Math.floor(r() * 4),
    }
  }
  return ho
}

// ───────────────────────── hằng số + hàm nhỏ ─────────────────────────
describe('hằng số và hàm nhỏ', () => {
  it('một nguồn: ngưỡng dạng yếu và số câu đủ tin TRÙNG `ho-so-lop.ts`; các hằng số của thiết kế được khoá', () => {
    expect(BTVN_NANG_DO.SO_CAU_DU_TIN_DANG).toBe(SO_CAU_DU_TIN_DANG)
    expect(BTVN_NANG_DO.NGUONG_DANG_YEU).toBe(NGUONG_DANG_YEU)
    expect(BTVN_NANG_DO).toMatchObject({ TL_LOI: 0.3, LOI_TOI_DA_MOI_DANG: 2, DANG_YEU_TOI_THIEU_CAU: 2, TL_THU_THACH: 0.15, TL_THU_THACH_TOI_DA: 0.2, DUNG_MO_BAC: 2, SO_KHOI_DONG: 2, NGAY_DUNG_LAI_BO: 2 })
  })
  it('`mucTuChu`: chữ của phiếu → 0/1/2, chữ lạ hoặc rỗng ⇒ 0', () => {
    expect([mucTuChu('biet'), mucTuChu('hieu'), mucTuChu('van_dung'), mucTuChu(' Van_Dung '), mucTuChu('cao'), mucTuChu(''), mucTuChu(null), mucTuChu(undefined)]).toEqual([0, 1, 2, 2, 0, 0, 0, 0])
  })
  it('`maDangCua`: dạng nếu có, thiếu ⇒ `CD:<chuyên đề>` (đúng quy ước `nam_kt_dang.ma_dang`)', () => {
    expect(maDangCua({ dang: 'D7', chuyenDe: 'Ester' })).toBe('D7')
    expect(maDangCua({ dang: null, chuyenDe: 'Ester' })).toBe('CD:Ester')
    expect(maDangCua({ dang: '  ', chuyenDe: 'Ester' })).toBe('CD:Ester')
  })
})

// ───────────────────────── LÕI ─────────────────────────
describe('chonLoi — lõi chung', () => {
  const nhomTheoDang = (cau: CauGiao[]) => {
    const m = new Map<string, CauGiao[]>()
    for (const c of cau) m.set(maDangCua(c), [...(m.get(maDangCua(c)) ?? []), c])
    return m
  }

  it('GHIM TRỐNG: lõi tự phủ MỌI dạng, ≈ 30 % (24/80), mỗi dạng 1–2 câu, theo thứ tự đề, chỉ câu có trong bài', () => {
    const loi = chonLoi(CAU, [])
    expect(loi).toHaveLength(24)
    const idx = loi.map((q) => Number(q.slice(1)))
    expect([...idx].sort((a, b) => a - b)).toEqual(idx) // thứ tự đề
    const dangLoi = loi.map((q) => dangCuaCau(Number(q.slice(1))))
    for (let d = 0; d < 20; d++) {
      const n = dangLoi.filter((x) => x === `D${d}`).length
      expect(n, `D${d}`).toBeGreaterThanOrEqual(1)
      expect(n, `D${d}`).toBeLessThanOrEqual(2)
    }
    expect(chonLoi(CAU)).toEqual(loi) // bỏ hẳn tham số ghim cũng như `[]`
  })

  it('GHIM ≤ 10: mọi câu ghim đều nằm trong lõi, vẫn phủ mọi dạng, không vượt tổng số câu; qid lạ bị bỏ', () => {
    const ghim = ['q60', 'q61', 'q62', 'q63', 'q79', 'q3', 'q44', 'q50', 'q71', 'q12']
    const loi = chonLoi(CAU, ghim)
    for (const q of ghim) expect(loi).toContain(q)
    const dang = new Set(loi.map((q) => dangCuaCau(Number(q.slice(1)))))
    expect(dang.size).toBe(20)
    expect(loi.length).toBeLessThanOrEqual(80)
    expect(new Set(loi).size).toBe(loi.length) // không trùng
    expect(chonLoi(CAU, ['khong-co', 'q60'])).toEqual(chonLoi(CAU, ['q60']))
    expect(chonLoi(CAU, ghim)).toEqual(loi) // tất định
  })

  it('MỨC THẤP NHẤT của dạng đứng trước sao cao (Boss: em yếu không phân câu khó); cùng mức thì sao cao; cùng mức + sao thì phần I trước', () => {
    const cau: CauGiao[] = [
      { qid: 'a', dang: 'X', chuyenDe: 'c', mucDo: 2, sao: 2, phan: 'I' },
      { qid: 'b', dang: 'X', chuyenDe: 'c', mucDo: 0, sao: 0, phan: 'III' },
      { qid: 'c', dang: 'X', chuyenDe: 'c', mucDo: 0, sao: 2, phan: 'II' },
      { qid: 'd', dang: 'X', chuyenDe: 'c', mucDo: 0, sao: 2, phan: 'I' },
    ]
    expect(chonLoi(cau, [])).toEqual(['d']) // 1 dạng, mục tiêu 30 % của 4 = 1 ⇒ một câu
    const nhieu = Array.from({ length: 10 }, (_, i) => ({ ...cau[i % 4], qid: `x${i}`, dang: i < 5 ? 'X' : 'Y' }))
    // dạng X có mức 0 sao 2 phần I ở (i=3) ⇒ chọn nó; câu mức 2 không bao giờ được chọn khi còn mức thấp hơn
    const loi = chonLoi(nhieu, [])
    for (const q of loi) expect(mucCua(nhieu, q)).toBe(0)
  })

  it('MỌI dạng có câu mức thấp nhất của dạng trong lõi (tính chất, 40 bài ngẫu nhiên)', () => {
    for (let s = 1; s <= 40; s++) {
      const r = mulberry32(s)
      const cau: CauGiao[] = Array.from({ length: 30 + Math.floor(r() * 60) }, (_, i) => ({ qid: `k${i}`, dang: r() < 0.15 ? null : `D${Math.floor(r() * 25)}`, chuyenDe: `CD${Math.floor(r() * 4)}`, mucDo: Math.floor(r() * 3) as Muc, sao: Math.floor(r() * 3) as 0 | 1 | 2, phan: (['I', 'II', 'III'] as const)[Math.floor(r() * 3)] }))
      const loi = new Set(chonLoi(cau, []))
      const nhom = new Map<string, CauGiao[]>()
      for (const c of cau) nhom.set(c.dang ?? `CD:${c.chuyenDe}|${c.mucDo}`, [...(nhom.get(c.dang ?? `CD:${c.chuyenDe}|${c.mucDo}`) ?? []), c])
      for (const [k, ds] of nhom) {
        const thap = Math.min(...ds.map((c) => c.mucDo))
        expect(ds.some((c) => loi.has(c.qid) && c.mucDo === thap), `bài ${s} nhóm ${k}`).toBe(true)
      }
    }
  })

  it('câu THIẾU dạng: nhóm theo chuyên đề + mức — mỗi nhóm có đại diện trong lõi', () => {
    const cau: CauGiao[] = []
    for (const cd of ['Ester', 'Lipid'])
      for (const muc of [0, 1] as const)
        for (let k = 0; k < 3; k++) cau.push({ qid: `${cd}${muc}${k}`, dang: null, chuyenDe: cd, mucDo: muc, sao: 1, phan: 'I' })
    const loi = chonLoi(cau, [])
    for (const cd of ['Ester', 'Lipid']) for (const muc of [0, 1]) expect(loi.some((q) => q.startsWith(`${cd}${muc}`)), `${cd} ${muc}`).toBe(true)
  })

  it('quá nhiều dạng (số dạng > 35 % số câu) vẫn mỗi dạng một câu — phủ dạng quan trọng hơn con số 30 %', () => {
    const cau: CauGiao[] = Array.from({ length: 40 }, (_, i) => ({ qid: `n${i}`, dang: `D${i % 30}`, chuyenDe: 'c', mucDo: 0, sao: 1, phan: 'I' }))
    const loi = chonLoi(cau, [])
    expect(new Set(loi.map((q) => cau.find((c) => c.qid === q)!.dang)).size).toBe(30)
  })

  it('đầu vào xấu: bài rỗng ⇒ []; qid trùng chỉ tính một lần', () => {
    expect(chonLoi([], [])).toEqual([])
    const trung: CauGiao[] = [CAU[0], CAU[0], CAU[1]]
    expect(chonLoi(trung, []).filter((q) => q === 'q0')).toHaveLength(1)
  })
})

// ───────────────────────── BỘ CÂU CỦA EM ─────────────────────────
describe('chonBoCuaEm — tính chất trên nhiều em', () => {
  const LOI = chonLoi(CAU, [])
  const emMau: [string, () => HoSoEmRut][] = [['rỗng', rong], ['yếu', emYeu], ['trung bình', emTB], ['khá', emKha], ...Array.from({ length: 60 }, (_, s) => [`ngẫu nhiên ${s + 1}`, () => emNgauNhien(s + 1, CAU)] as [string, () => HoSoEmRut])]
  const nganSachMau = [NS(7, 12, 3), NS(7, 10, 4), NS(5, 16, 2), NS(3, 8, 8), NS(14, 16, 0), NS(1, 12, 2)]

  it('MỌI em × MỌI ngân sách: lõi ⊆ bộ · ba tập rời nhau, hợp = các chặng · |bộ| ∈ [|lõi|, N] và ≤ ngân sách · nhãn đủ cho từng câu', () => {
    for (const [ten, tao] of emMau)
      for (const ns of nganSachMau) {
        const bo = chonBoCuaEm(CAU, LOI, tao(), ns, `B1|${ten}`)
        const tap = tapCua(bo)
        expect(bo.loi, ten).toEqual(LOI)
        expect(new Set(tap).size, `${ten} trùng`).toBe(tap.length)
        expect(tap.length, ten).toBeGreaterThanOrEqual(LOI.length)
        expect(tap.length, ten).toBeLessThanOrEqual(CAU.length)
        expect(tap.length, `${ten} ngân sách`).toBeLessThanOrEqual(Math.max(LOI.length, ns.soNgay * Math.max(0, ns.cauMoiNgay - ns.onLaiMoiNgay)))
        expect(bo.tomTat.tong).toBe(tap.length)
        const tuChang = bo.chang.flat()
        expect(new Set(tuChang).size, `${ten} chặng trùng`).toBe(tuChang.length)
        expect([...tuChang].sort(), ten).toEqual([...tap].sort())
        expect(Object.keys(bo.nhan).sort(), ten).toEqual([...tap].sort())
        expect(bo.chang.length, ten).toBe(Math.min(ns.soNgay, tap.length))
      }
  })

  it('KHÔNG câu nào NGOÀI lõi vượt bậc đích + 1; câu +1 bậc chỉ là thử thách ở dạng KHÔNG yếu, ≤ 20 % bộ', () => {
    for (const [ten, tao] of emMau)
      for (const ns of nganSachMau) {
        const ho = tao()
        const bo = chonBoCuaEm(CAU, LOI, ho, ns, `B1|${ten}`)
        for (const q of [...bo.rieng, ...bo.thuThach]) {
          const c = CAU.find((x) => x.qid === q)!
          const t = bacDichTest(ho, CAU, maDangCua(c))
          expect(c.mucDo, `${ten}: ${q}`).toBeLessThanOrEqual(t.bac + 1)
        }
        for (const q of bo.rieng) {
          const c = CAU.find((x) => x.qid === q)!
          expect(c.mucDo, `${ten} riêng ${q}`).toBeLessThanOrEqual(bacDichTest(ho, CAU, maDangCua(c)).bac)
        }
        for (const q of bo.thuThach) {
          const c = CAU.find((x) => x.qid === q)!
          const t = bacDichTest(ho, CAU, maDangCua(c))
          expect(c.mucDo, `${ten} thử thách ${q}`).toBe(t.bac + 1)
          expect(t.yeu, `${ten} thử thách ở dạng yếu ${q}`).toBe(false)
        }
        expect(bo.thuThach.length, ten).toBeLessThanOrEqual(Math.floor(0.2 * tapCua(bo).length))
      }
  })

  it('EM CHƯA HỒ SƠ ⇒ lõi + Biết/Hiểu: phần riêng chỉ Biết, thử thách chỉ Hiểu; không Vận dụng ngoài lõi', () => {
    const bo = chonBoCuaEm(CAU, LOI, rong(), NS(), 'B1|moi')
    for (const q of bo.rieng) expect(mucCua(CAU, q), q).toBe(0)
    for (const q of bo.thuThach) expect(mucCua(CAU, q), q).toBe(1)
    expect(bo.rieng.length).toBeGreaterThan(0)
    expect(bo.chang.length).toBe(7) // chặng 1 kiêm chẩn đoán: em vẫn được chia đủ chặng
    expect(chonBoCuaEm(CAU, LOI, { dang: undefined, cau: undefined } as unknown as HoSoEmRut, NS(), 'B1|moi').tomTat.tong).toBe(bo.tomTat.tong) // hồ sơ thiếu trường
  })

  it('MỖI DẠNG YẾU có ≥ 2 câu trong bộ khi kho còn (ngân sách đủ)', () => {
    const ho = emYeu()
    const bo = chonBoCuaEm(CAU, LOI, ho, NS(7, 12, 3), 'B1|yeu')
    for (let d = 0; d < 10; d++) {
      const n = tapCua(bo).filter((q) => qidCuaDang(d).includes(q)).length
      expect(n, `D${d}`).toBeGreaterThanOrEqual(2)
    }
    expect(bo.tomTat.soDangYeu).toBe(10)
    expect(bo.tomTat.soDangYeuDuCau).toBe(10)
    // ngân sách CHẶT thì dạng yếu vẫn được ưu tiên trước câu điểm cao khác, và ngân sách không bị vượt
    const chat = chonBoCuaEm(CAU, LOI, ho, NS(1, 30, 0), 'B1|yeu')
    expect(chat.tomTat.tong).toBeLessThanOrEqual(30)
    expect(chat.tomTat.soDangYeuDuCau).toBeGreaterThanOrEqual(3)
  })

  it('DẠNG YẾU ≥ 2 câu được ÉP: dù câu thứ hai của dạng đã đúng lại nhiều ngày (điểm âm, lẽ ra bị bỏ) vẫn được lấy cho đủ 2', () => {
    const dung3 = { trangThai: 'da_khac_phuc' as const, ngayDungKhacNhau: 3, lanSai: 1 }
    const ho: HoSoEmRut = { dang: { D0: dangHS(1, 8, 0.4) }, cau: { q0: dung3, q20: dung3 } } // D0 yếu, bậc Hiểu; hai câu Biết đã đúng lại
    const bo = chonBoCuaEm(CAU, ['q1'], ho, NS(7, 40, 0), 'B1|ep')
    const nD0 = tapCua(bo).filter((q) => qidCuaDang(0).includes(q))
    expect(nD0.length).toBeGreaterThanOrEqual(2)
    expect(nD0).toContain('q40') // câu Hiểu đúng bậc
    expect(nD0.some((q) => q === 'q0' || q === 'q20')).toBe(true)
  })

  it('EM KHÁ bỏ câu dễ đã đúng lại nhiều ngày: phần riêng không còn câu Biết đã đúng ≥ 2 ngày; em vẫn nhận câu bậc mình và thử thách', () => {
    const ho = emKha()
    const bo = chonBoCuaEm(CAU, LOI, ho, NS(7, 16, 2), 'B1|kha')
    for (const q of bo.rieng) expect(ho.cau[q]?.ngayDungKhacNhau ?? 0, q).toBeLessThan(2)
    expect(bo.rieng.some((q) => mucCua(CAU, q) === 1)).toBe(true) // câu Hiểu (đúng bậc)
    expect(bo.thuThach.length).toBeGreaterThan(0) // Vận dụng làm thử thách
    for (const q of bo.thuThach) expect(mucCua(CAU, q)).toBe(2)
  })

  it('MỞ +1 BẬC: đúng ≥ 2 câu ở bậc hiện tại của dạng (dạng ổn) ⇒ câu Hiểu của dạng đó thành phần riêng; chưa đủ thì không', () => {
    const cauD0 = qidCuaDang(0) // q0 q20 (Biết) q40 (Hiểu) q60 (Vận dụng)
    const dang = { D0: dangHS(0, 8, 0.9), D1: dangHS(0, 8, 0.9) }
    const dung = (q: string) => ({ trangThai: 'da_khac_phuc' as const, ngayDungKhacNhau: 1, lanSai: 1 })
    const mo: HoSoEmRut = { dang, cau: { q0: dung('q0'), q20: dung('q20') } }
    const khong: HoSoEmRut = { dang, cau: { q0: dung('q0') } }
    const loiNgheo = ['q1', 'q2'] // lõi cố định không chứa câu D0/D1 để nhìn rõ phần riêng
    const boMo = chonBoCuaEm(CAU, loiNgheo, mo, NS(7, 40, 0), 'B1|mo')
    const boKhong = chonBoCuaEm(CAU, loiNgheo, khong, NS(7, 40, 0), 'B1|mo')
    expect(boMo.rieng).toContain('q40')
    expect(boMo.thuThach.includes('q60') || boMo.rieng.includes('q60')).toBe(true)
    expect(boKhong.rieng).not.toContain('q40')
    expect(cauD0).toContain('q40')
  })

  it('NGÂN SÁCH nhỏ hơn lõi ⇒ bộ = đúng lõi (lõi không bao giờ bị rút)', () => {
    const bo = chonBoCuaEm(CAU, LOI, emYeu(), NS(2, 5, 5), 'B1|x')
    expect(tapCua(bo)).toEqual(LOI)
    expect(bo.rieng).toEqual([])
    expect(bo.thuThach).toEqual([])
    expect(bo.tomTat.nganSachCau).toBe(LOI.length)
  })

  it('CHẶNG: chia đều (chênh ≤ 2 câu), mở bằng 2 khởi động, thử thách đứng CUỐI (tối đa một mỗi chặng), thứ tự lõi → dạng yếu → củng cố', () => {
    for (const [ten, tao] of emMau.slice(0, 12)) {
      const bo = chonBoCuaEm(CAU, LOI, tao(), NS(7, 14, 2), `B1|${ten}`)
      const co = bo.chang.map((c) => c.length)
      expect(Math.max(...co) - Math.min(...co), `${ten} chênh`).toBeLessThanOrEqual(2)
      bo.chang.forEach((c, k) => {
        const dau = c.slice(0, 2)
        if (c.length >= 3) for (const q of dau) expect(bo.nhan[q], `${ten} chặng ${k + 1} mở`).toBe('khoi_dong')
        // khởi động = câu DỄ NHẤT của chặng (mức không cao hơn bất kỳ câu thường nào cùng chặng)
        if (c.length >= 3) {
          const muc = (q: string) => mucCua(CAU, q)
          const thuong = c.filter((q) => ['loi', 'dang_yeu', 'cung_co'].includes(bo.nhan[q]))
          for (const q of dau) for (const t of thuong) expect(muc(q), `${ten} chặng ${k + 1}: khởi động ${q} phải dễ hơn ${t}`).toBeLessThanOrEqual(muc(t))
        }
        const thu = c.filter((q) => bo.nhan[q] === 'thu_thach')
        expect(thu.length, `${ten} chặng ${k + 1}`).toBeLessThanOrEqual(1)
        if (thu.length === 1) expect(c[c.length - 1], `${ten} chặng ${k + 1} thử thách cuối`).toBe(thu[0])
        const hang = (q: string) => ({ loi: 0, dang_yeu: 1, cung_co: 2 } as Record<string, number>)[bo.nhan[q]]
        const giua = c.filter((q) => ['loi', 'dang_yeu', 'cung_co'].includes(bo.nhan[q])).map(hang)
        expect([...giua].sort((a, b) => a - b), `${ten} thứ tự`).toEqual(giua)
      })
      // nhãn khớp tập: thu_thach ⇔ thuThach; loi_cao ⊆ lõi; dang_yeu/cung_co ⊆ riêng
      expect(Object.entries(bo.nhan).filter(([, v]) => v === 'thu_thach').map(([q]) => q).sort()).toEqual([...bo.thuThach].sort())
      for (const [q, v] of Object.entries(bo.nhan)) if (v === 'dang_yeu' || v === 'cung_co') expect(bo.rieng).toContain(q)
      for (const [q, v] of Object.entries(bo.nhan)) if (v === 'loi' || v === 'loi_cao') expect(bo.loi).toContain(q)
    }
  })

  it('BOSS — CÂU LÕI CAO: em yếu, lõi có ghim Vận dụng ⇒ mọi câu vượt bậc đích + 1 thuộc lõi và mang nhãn `loi_cao`; đứng cuối chặng, ≤ 2 mỗi chặng, không chặng nào mở bằng nó', () => {
    const ghim = ['q60', 'q61', 'q62', 'q63', 'q64', 'q65', 'q66', 'q67', 'q68', 'q69'] // 10 câu Vận dụng
    const loi = chonLoi(CAU, ghim)
    const ho = emYeu()
    const bo = chonBoCuaEm(CAU, loi, ho, NS(7, 12, 3), 'B1|yeu-ghim')
    const vuot = tapCua(bo).filter((q) => {
      const c = CAU.find((x) => x.qid === q)!
      return c.mucDo > bacDichTest(ho, CAU, maDangCua(c)).bac + 1
    })
    expect(vuot.length).toBeGreaterThanOrEqual(10)
    for (const q of vuot) {
      expect(bo.loi, `${q} phải thuộc lõi`).toContain(q)
      expect(bo.nhan[q], q).toBe('loi_cao')
    }
    expect(bo.tomTat.soLoiCao).toBe(vuot.length)
    bo.chang.forEach((c, k) => {
      const cao = c.filter((q) => bo.nhan[q] === 'loi_cao')
      expect(cao.length, `chặng ${k + 1}`).toBeLessThanOrEqual(2)
      expect(bo.nhan[c[0]], `chặng ${k + 1} mở`).not.toBe('loi_cao')
      expect(bo.nhan[c[1]], `chặng ${k + 1} mở`).not.toBe('loi_cao')
      // các câu cao đứng LIỀN nhau ở cuối (trước thử thách nếu có)
      const cuoi = c[c.length - 1] && bo.nhan[c[c.length - 1]] === 'thu_thach' ? c.slice(0, -1) : c
      expect(cuoi.slice(cuoi.length - cao.length), `chặng ${k + 1} cuối`).toEqual(cao)
    })
    // dồn ĐỀU: chênh giữa các chặng ≤ 1
    const soCao = bo.chang.map((c) => c.filter((q) => bo.nhan[q] === 'loi_cao').length)
    expect(Math.max(...soCao) - Math.min(...soCao)).toBeLessThanOrEqual(1)
  })

  it('không có lõi cao thì không có nhãn `loi_cao` (lõi lấy mức thấp nhất ⇒ em yếu không bị dồn câu khó)', () => {
    const bo = chonBoCuaEm(CAU, LOI, emYeu(), NS(), 'B1|yeu')
    expect(bo.tomTat.soLoiCao).toBe(0)
    expect(Object.values(bo.nhan)).not.toContain('loi_cao')
    // …còn với em KHÁ (bậc Hiểu), lõi Biết/Hiểu không bị coi là cao
    expect(chonBoCuaEm(CAU, LOI, emKha(), NS(), 'B1|kha').tomTat.soLoiCao).toBe(0)
  })

  it('TÓM TẮT khớp bộ: tổng, lõi/riêng/thử thách, Biết/Hiểu/Vận dụng, số chặng, ngân sách kẹp', () => {
    const bo = chonBoCuaEm(CAU, LOI, emTB(), NS(7, 12, 3), 'B1|tb')
    const t = bo.tomTat
    expect(t.tong).toBe(t.soLoi + t.soRieng + t.soThuThach)
    expect(t.soBiet + t.soHieu + t.soVanDung).toBe(t.tong)
    expect(t.soChang).toBe(bo.chang.length)
    expect(t.nganSachCau).toBe(63)
    expect(t.soLoi).toBe(LOI.length)
    expect(t.soDangYeu).toBe(5)
    expect(chonBoCuaEm(CAU, LOI, emTB(), NS(30, 16, 0), 'B1|tb').tomTat.nganSachCau).toBe(80) // kẹp ở N
  })

  it('bài RỖNG hoặc ngân sách rác không làm hỏng: [] chặng, số ngày < 1 coi là 1', () => {
    const bo = chonBoCuaEm([], [], rong(), NS(), 'B1|x')
    expect(bo.chang).toEqual([])
    expect(bo.tomTat.tong).toBe(0)
    const rac = chonBoCuaEm(CAU, LOI, rong(), { soNgay: 0, cauMoiNgay: NaN, onLaiMoiNgay: -3 }, 'B1|x')
    expect(tapCua(rac)).toEqual(LOI)
    expect(rac.chang.length).toBe(1)
  })

  it('TẤT ĐỊNH: cùng đầu vào + cùng hạt giống ⇒ cùng bộ; hạt giống khác thì phá hoà khác nhưng vẫn hợp lệ', () => {
    const ho = emTB()
    const a = chonBoCuaEm(CAU, LOI, ho, NS(7, 9, 3), 'B1|12001')
    expect(JSON.stringify(chonBoCuaEm(CAU, LOI, emTB(), NS(7, 9, 3), 'B1|12001'))).toBe(JSON.stringify(a))
    const khacNhau = new Set<string>()
    for (let s = 0; s < 30; s++) khacNhau.add(JSON.stringify(chonBoCuaEm(CAU, LOI, rong(), NS(7, 6, 0), `B1|${s}`).rieng))
    expect(khacNhau.size).toBeGreaterThan(1)
  })

  it('3 em (yếu · trung bình · khá) nhận 3 bộ KHÁC nhau, cùng chứa đủ lõi; em yếu 0 câu vượt bậc đích ngoài lõi', () => {
    const bo = [emYeu(), emTB(), emKha()].map((h, k) => chonBoCuaEm(CAU, LOI, h, NS(7, 12, 3), `B1|${k}`))
    expect(new Set(bo.map((b) => JSON.stringify(tapCua(b).sort()))).size).toBe(3)
    for (const b of bo) for (const q of LOI) expect(tapCua(b)).toContain(q)
    for (const q of [...bo[0].rieng, ...bo[0].thuThach]) expect(mucCua(CAU, q)).toBeLessThanOrEqual(1)
  })

  it('NHANH: 80 câu × 300 em dưới 200 ms (lấy lần tốt nhất trong 3 để máy tải nặng không làm đỏ oan)', () => {
    const hs = Array.from({ length: 300 }, (_, e) => emNgauNhien(1000 + e, CAU))
    let tot = Infinity
    for (let l = 0; l < 3; l++) {
      const t0 = performance.now()
      for (let e = 0; e < 300; e++) chonBoCuaEm(CAU, LOI, hs[e], NS(7, 12, 3), `B1|${e}`)
      tot = Math.min(tot, performance.now() - t0)
    }
    expect(tot).toBeLessThan(200)
  })
})

// ───────────────────────── THẺ TIẾN BỘ ─────────────────────────
describe('theTienBo — chỉ số đếm, so em với chính em', () => {
  it('dạng lên bậc, câu sai nay đã khắc phục, câu mới gặp, dạng mới — đúng số đếm', () => {
    const truoc: HoSoEmRut = {
      dang: { D1: dangHS(0, 6, 0.5), D2: dangHS(1, 8, 0.9), D3: dangHS(0, 2, null) },
      cau: { a: { trangThai: 'moi_sai', ngayDungKhacNhau: 0, lanSai: 1 }, b: { trangThai: 'dang_on', ngayDungKhacNhau: 0, lanSai: 2 }, c: { trangThai: 'da_khac_phuc', ngayDungKhacNhau: 2, lanSai: 1 }, f: { trangThai: 'dang_on', ngayDungKhacNhau: 0, lanSai: 1 } },
    }
    const sau: HoSoEmRut = {
      dang: { D1: dangHS(1, 8, 0.8), D2: dangHS(1, 9, 0.9), D3: dangHS(1, 5, 0.75), D4: dangHS(0, 1, null) },
      cau: { a: { trangThai: 'da_khac_phuc', ngayDungKhacNhau: 1, lanSai: 1 }, b: { trangThai: 'dang_on', ngayDungKhacNhau: 0, lanSai: 2 }, c: { trangThai: 'da_khac_phuc', ngayDungKhacNhau: 3, lanSai: 1 }, d: { trangThai: 'chua_thay_sai', ngayDungKhacNhau: 1, lanSai: 0 }, e: { trangThai: 'moi_sai', ngayDungKhacNhau: 0, lanSai: 1 }, f: { trangThai: 'da_khac_phuc', ngayDungKhacNhau: 1, lanSai: 1 } },
    }
    const t = theTienBo(truoc, sau)
    // D1: Biết → Hiểu ↑; D3: trước chưa đủ tin (Biết) → nay đủ tin ở Hiểu ↑; D2 giữ; D4 mới
    expect(t.dangLenBac).toEqual([{ ma: 'D1', tu: 0, den: 1 }, { ma: 'D3', tu: 0, den: 1 }])
    expect(t.soCauDungLai).toBe(2) // câu a (moi_sai → da_khac_phuc) và f (dang_on → da_khac_phuc); b vẫn đang ôn, c đã khắc phục từ trước
    expect(t.soCauMoiGap).toBe(2) // d, e
    expect(t.soDangMoi).toBe(1) // D4
    expect(t.coTienBo).toBe(true)
  })

  it('không đổi gì ⇒ `coTienBo` false (thẻ im lặng, không bịa); hồ sơ rỗng hoặc thiếu trường không ném lỗi; bậc tụt KHÔNG được tính là tiến', () => {
    const h = emTB()
    const t = theTienBo(h, h)
    expect(t).toEqual({ dangLenBac: [], soCauDungLai: 0, soCauMoiGap: 0, soDangMoi: 0, coTienBo: false })
    expect(theTienBo(rong(), rong()).coTienBo).toBe(false)
    expect(theTienBo({ dang: undefined, cau: undefined } as unknown as HoSoEmRut, rong()).coTienBo).toBe(false)
    expect(theTienBo({ dang: { D1: dangHS(2, 8, 0.9) }, cau: {} }, { dang: { D1: dangHS(1, 8, 0.9) }, cau: {} }).dangLenBac).toEqual([])
  })

  it('tất định về thứ tự: dạng lên bậc luôn theo mã tăng dần', () => {
    const truoc: HoSoEmRut = { dang: { Z: dangHS(0, 5, 0.5), A: dangHS(0, 5, 0.5), M: dangHS(0, 5, 0.5) }, cau: {} }
    const sau: HoSoEmRut = { dang: { Z: dangHS(1, 5, 0.9), A: dangHS(1, 5, 0.9), M: dangHS(1, 5, 0.9) }, cau: {} }
    expect(theTienBo(truoc, sau).dangLenBac.map((x) => x.ma)).toEqual(['A', 'M', 'Z'])
  })
})

describe('Đợt 2 (chữ ký) + khoá nguồn', () => {
  it('`thichNghiChangSau` hiện CHƯA đổi gì: trả đúng bộ đã đưa vào', () => {
    const bo = chonBoCuaEm(CAU, chonLoi(CAU, []), rong(), NS(), 'B1|x')
    expect(thichNghiChangSau(bo, CAU, rong(), 0, { dung: {} })).toBe(bo)
  })
  it('lõi THUẦN: không Math.random, không đồng hồ, không IO, không React; không chữ "nắm chắc"', () => {
    const nguon = readFileSync('src/lib/btvn-nang-do.ts', 'utf8').replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '')
    for (const cam of ['Math.random', 'Date.now', 'new Date', 'performance.now', 'fetch(', 'localStorage', 'indexedDB', "from 'react'", 'console.']) expect(nguon, cam).not.toContain(cam)
    expect(nguon.toLowerCase(), 'chữ hiển thị cho em/thầy (không tính chú thích)').not.toMatch(/nắm chắc/)
    // chỉ import hashSeed từ exam-shuffle (thuần) — máy chủ import được
    expect([...readFileSync('src/lib/btvn-nang-do.ts', 'utf8').matchAll(/^import .* from '([^']+)'/gm)].map((m) => m[1])).toEqual(['./exam-shuffle'])
  })
})
