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
  type DieuChinhEm,
  type HoSoEmRut,
  type Muc,
  type NganSachBai,
  type NhanCau,
} from '../src/lib/btvn-nang-do'
import { NGUONG_DANG_YEU, SO_CAU_DU_TIN_DANG } from '../src/lib/ho-so-lop'
import { hashSeed, mulberry32 } from '../src/lib/exam-shuffle'

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
        expect(bo.thuThach.length, ten).toBeLessThanOrEqual(Math.floor(0.2 * (bo.rieng.length + bo.thuThach.length))) // ≤ 20 % phần NGOÀI lõi, làm tròn xuống
      }
  })

  it('BOSS — CHỖ TRỐNG SAU LÕI ÍT: em yếu, ngân sách = lõi + 3 ⇒ 0 thử thách, 3 câu đều đúng bậc đích ở dạng YẾU; thử thách ≤ 20 % phần ngoài lõi (làm tròn xuống) ở mọi cỡ ngân sách', () => {
    const ho = emYeu()
    const bo = chonBoCuaEm(CAU, LOI, ho, NS(1, LOI.length + 3, 0), 'B1|it')
    expect(bo.thuThach).toEqual([])
    expect(bo.rieng).toHaveLength(3)
    for (const q of bo.rieng) {
      const c = CAU.find((x) => x.qid === q)!
      const t = bacDichTest(ho, CAU, maDangCua(c))
      expect(t.yeu, `${q} phải ở dạng yếu`).toBe(true)
      expect(c.mucDo, `${q} đúng bậc đích`).toBe(t.bac)
    }
    // "7 ngày × 4 câu/ngày" từng làm toàn bộ chỗ trống thành thử thách: nay chỗ trống là phần riêng
    const bay = chonBoCuaEm(CAU, LOI, rong(), NS(7, 4, 0), 'B1|it')
    expect(bay.tomTat.nganSachCau).toBe(28)
    expect(bay.thuThach).toEqual([])
    expect(bay.rieng).toHaveLength(4)
    // mọi số chỗ trống 0..40 × 3 kiểu em × nhiều số ngày: thử thách ≤ floor(20 % phần ngoài lõi) và ≤ số chặng
    for (const tao of [rong, emYeu, emTB, emKha])
      for (const soNgay of [1, 3, 7, 14])
        for (let them = 0; them <= 40; them++) {
          const b = chonBoCuaEm(CAU, LOI, tao(), { soNgay, cauMoiNgay: Math.ceil((LOI.length + them) / soNgay), onLaiMoiNgay: 0 }, 'B1|it')
          const ngoaiLoi = b.rieng.length + b.thuThach.length
          expect(b.thuThach.length, `${tao.name} ${soNgay} ngày +${them}`).toBeLessThanOrEqual(Math.floor(0.2 * ngoaiLoi))
          expect(b.thuThach.length).toBeLessThanOrEqual(b.chang.length)
          expect(b.tomTat.tong).toBeLessThanOrEqual(Math.max(LOI.length, b.tomTat.nganSachCau))
        }
  })

  it('THỨ TỰ LẤP chỗ trống: dạng yếu đúng bậc đích → củng cố → thử thách (chỗ trống 10 ⇒ ưu tiên dạng yếu, thử thách ≤ 2)', () => {
    const ho = emYeu()
    const bo = chonBoCuaEm(CAU, LOI, ho, NS(1, LOI.length + 10, 0), 'B1|tt')
    const yeuDungBac = bo.rieng.filter((q) => {
      const c = CAU.find((x) => x.qid === q)!
      const t = bacDichTest(ho, CAU, maDangCua(c))
      return t.yeu && c.mucDo === t.bac
    })
    expect(yeuDungBac.length).toBeGreaterThanOrEqual(Math.min(6, bo.rieng.length)) // dạng yếu (kho còn) chiếm phần lớn phần riêng
    expect(bo.thuThach.length).toBeLessThanOrEqual(1) // 1 ngày ⇒ tối đa 1 chặng ⇒ tối đa 1 thử thách
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

// ───────────────────────── CỔNG ĐIỀU CHỈNH `dieuChinh` ─────────────────────────
describe('chonBoCuaEm — cổng `dieuChinh` (bộ não đêm)', () => {
  const LOI = chonLoi(CAU, [])
  /** Chữ ký vàng của kết quả khi VẮNG cổng: 60 em ngẫu nhiên × 6 ngân sách (hạt giống cố định). Đổi số này = đổi hành vi khi vắng cổng — phải có lý do.
   * Lịch sử: 1036170693 = bản 569ebfd (đã kiểm: bản có cổng cho đúng số ấy). 21/09 Boss QUYẾT sửa cách chia chỗ trống (thử thách tính trên phần NGOÀI lõi, ≤ 20 % làm tròn xuống)
   * ⇒ số mới 1419150711; chưa có gì của lõi lên máy chủ nên đổi kết quả không hại. */
  const VANG = 1419150711
  const NS6: [number, number, number][] = [[7, 12, 3], [7, 10, 4], [5, 16, 2], [3, 8, 8], [14, 16, 0], [1, 12, 2]]
  /** BẢN 1.2 thêm `thuSucThem` / `tomTat.soThuSucThem` / `tomTat.soBatBuoc`: bỏ ba trường MỚI (phải rỗng / bằng số cũ) rồi băm ⇒ vẫn ra ĐÚNG số 1419150711 của bản trước ⇒ với bài
   * KHÔNG có lõi cao (như bộ mẫu 80 câu) bản 1.2 cho kết quả Y HỆT từng byte. */
  const gocCu = (bo: BoCuaEm) => {
    const { thuSucThem, ...con } = bo as BoCuaEm & { thuSucThem: string[] }
    expect(thuSucThem).toEqual([])
    const { soThuSucThem, soBatBuoc, ...tt } = con.tomTat
    expect(soThuSucThem).toBe(0)
    expect(soBatBuoc).toBe(con.tomTat.tong)
    return { ...con, tomTat: tt }
  }
  const chuKy = (dc?: DieuChinhEm | null) => {
    let x = 0
    for (let sd = 1; sd <= 60; sd++)
      for (const [a, b, c] of NS6) x = (Math.imul(x, 31) + hashSeed(JSON.stringify(gocCu(chonBoCuaEm(CAU, LOI, emNgauNhien(sd, CAU), { soNgay: a, cauMoiNgay: b, onLaiMoiNgay: c }, `B1|ngẫu nhiên ${sd}`, dc as DieuChinhEm))))) >>> 0
    return x
  }

  it('VẮNG cổng (hoặc cổng rỗng / vô hại) ⇒ kết quả Y HỆT bản trước khi có cổng — khoá bằng chữ ký vàng trên 360 bộ', () => {
    expect(chuKy(undefined)).toBe(VANG)
    for (const dc of [null, {}, { nhip: 0 }, { dang: [] }, { khoiDong: 2 }, { nhip: 0, khoiDong: 2, dang: [] }, { nhip: NaN, khoiDong: NaN }, { dang: [{ ma: 'KHONG-CO-TRONG-BAI', nut: 'tam_nghi' as const }] }]) {
      expect(chuKy(dc as DieuChinhEm | null), JSON.stringify(dc)).toBe(VANG)
    }
  })

  it('NHỊP ±3: số câu/ngày đổi đúng, kẹp [6, 16] mà không kéo ngân sách gốc nằm ngoài khoảng; ngoài ±3 thì kẹp ±3', () => {
    const ns = (moi: number) => ({ soNgay: 2, cauMoiNgay: moi, onLaiMoiNgay: 2 })
    const budget = (moi: number, nhip?: number) => chonBoCuaEm(CAU, LOI, rong(), ns(moi), 'B1|n', nhip === undefined ? undefined : { nhip }).tomTat.nganSachCau
    // 14 + 3 = 17 ⇒ kẹp 16 ⇒ (16 − 2) × 2 = 28; +1 ⇒ 15 ⇒ 26; +2 và +3 cùng ra 28
    expect([budget(14, 1), budget(14, 2), budget(14, 3), budget(14, 9)]).toEqual([26, 28, 28, 28])
    // 8 − 3 = 5 ⇒ kẹp 6 ⇒ 6 × 7 = 42 (không thấp hơn 6 dù nhịp âm)
    const b2 = (moi: number, nhip?: number) => chonBoCuaEm(CAU, LOI, rong(), { soNgay: 7, cauMoiNgay: moi, onLaiMoiNgay: 0 }, 'B1|n', nhip === undefined ? undefined : { nhip }).tomTat.nganSachCau
    expect([b2(8), b2(8, -1), b2(8, -3), b2(8, -9)]).toEqual([56, 49, 42, 42]) // −3 ⇒ 5 ⇒ kẹp 6 ⇒ 42; không thấp hơn
    // ngân sách gốc DƯỚI 6: nhịp âm không kéo lên 6 (giữ 4), nhịp dương từ 4 lên 7
    expect([b2(4), b2(4, -3), b2(4, 3)]).toEqual([28, 28, 49]) // 4 × 7 = 28; nhịp âm không kéo lên 6 và không hạ dưới sàn của chính nó; +3 ⇒ 7 × 7
    // ngân sách gốc TRÊN 16: nhịp dương không kéo lên; nhịp âm hạ đúng
    expect([b2(20, 3), b2(20, -3)]).toEqual([80, 80]) // đều kẹp ở N = 80
    // nhịp ngoài ±3 kẹp về ±3 (khi chưa chạm sàn/trần): 8 + 9 ⇒ như +3 = 11; 12 − 9 ⇒ như −3 = 9
    expect([b2(8, 9), b2(12, -9)]).toEqual([b2(8, 3), b2(12, -3)])
    expect([b2(8, 3), b2(12, -3)]).toEqual([77, 63])
    // nhịp 0 tường minh không đổi gì, kể cả khi ngân sách gốc nằm ngoài [6, 16]
    for (const moi of [4, 8, 20]) expect(chonBoCuaEm(CAU, LOI, rong(), { soNgay: 7, cauMoiNgay: moi, onLaiMoiNgay: 0 }, 'B1|n', { nhip: 0 })).toEqual(chonBoCuaEm(CAU, LOI, rong(), { soNgay: 7, cauMoiNgay: moi, onLaiMoiNgay: 0 }, 'B1|n'))
    const nho = (moi: number, nhip: number) => chonBoCuaEm(CAU, LOI, rong(), { soNgay: 3, cauMoiNgay: moi, onLaiMoiNgay: 0 }, 'B1|n', { nhip }).tomTat.nganSachCau
    expect([nho(18, 3), nho(18, -3)]).toEqual([54, 45]) // 18 + 3 = 21 ⇒ giữ 18 (không hạ về 16 khi tăng); 18 − 3 = 15 ⇒ 45
  })

  it('KHỞI ĐỘNG 1–3 mỗi chặng (mặc định 2); ngoài khoảng kẹp lại', () => {
    const mo = (kd?: number) => {
      const bo = chonBoCuaEm(CAU, LOI, emTB(), NS(7, 14, 2), 'B1|kd', kd === undefined ? undefined : { khoiDong: kd })
      return bo.chang.map((c) => c.filter((q, k) => bo.nhan[q] === 'khoi_dong' && c.slice(0, k).every((x) => bo.nhan[x] === 'khoi_dong')).length)
    }
    expect(mo(1).every((x) => x === 1)).toBe(true)
    expect(mo(2).every((x) => x === 2)).toBe(true)
    expect(mo(3).every((x) => x === 3)).toBe(true)
    expect(mo(9)).toEqual(mo(3))
    expect(mo(0)).toEqual(mo(1))
    expect(mo(-4)).toEqual(mo(1))
    expect(mo(undefined)).toEqual(mo(2))
  })

  it('`tam_nghi`: phần riêng và thử thách KHÔNG lấy câu của dạng; câu LÕI của dạng vẫn ở lại (lõi không bao giờ bị rút)', () => {
    const bo0 = chonBoCuaEm(CAU, LOI, rong(), NS(), 'B1|nghi')
    const bo = chonBoCuaEm(CAU, LOI, rong(), NS(), 'B1|nghi', { dang: [{ ma: 'D3', nut: 'tam_nghi' }, { ma: 'D4', nut: 'tam_nghi' }] })
    for (const q of [...bo.rieng, ...bo.thuThach]) expect(['D3', 'D4']).not.toContain(dangCuaCau(Number(q.slice(1))))
    expect([...bo0.rieng, ...bo0.thuThach].some((q) => ['D3', 'D4'].includes(dangCuaCau(Number(q.slice(1)))))).toBe(true) // trước đó CÓ lấy
    expect(bo.loi).toEqual(LOI)
    expect(LOI.some((q) => dangCuaCau(Number(q.slice(1))) === 'D3')).toBe(true)
    expect(bo.chang.flat()).toEqual(expect.arrayContaining(LOI))
  })

  it('`ha_mot_bac`: bậc đích thấp đi một bậc — phần riêng ≤ bậc−1, câu lõi cao hơn bậc−1+1 thành `loi_cao`; không đụng dạng khác', () => {
    const ho = emKha() // mọi dạng bậc Hiểu
    const dang = Array.from({ length: 20 }, (_, d) => ({ ma: `D${d}`, nut: 'ha_mot_bac' as const })).slice(0, 3)
    const bo = chonBoCuaEm(CAU, LOI, ho, NS(7, 16, 2), 'B1|ha', { dang })
    for (const q of bo.rieng) {
      const d = dangCuaCau(Number(q.slice(1)))
      if (['D0', 'D1', 'D2'].includes(d)) expect(mucCua(CAU, q), q).toBe(0)
    }
    // mức Vận dụng của D0–D2 ở lõi (nếu có) không thành câu thường: đã cao hơn bậc 0 + 1
    for (const q of bo.loi) {
      const d = dangCuaCau(Number(q.slice(1)))
      if (['D0', 'D1', 'D2'].includes(d) && mucCua(CAU, q) > 1) expect(bo.nhan[q]).toBe('loi_cao')
    }
    const goc = chonBoCuaEm(CAU, LOI, ho, NS(7, 16, 2), 'B1|ha')
    expect(bo.tomTat.tong).toBeLessThanOrEqual(goc.tomTat.tong) // hạ bậc không thêm câu
  })

  it('`cho_thu_len_bac`: dạng ổn được nhận câu bậc +1 làm PHẦN RIÊNG (không chỉ thử thách); không quá bậc hồ sơ + 1; dạng YẾU bị bỏ qua', () => {
    const ho = emTB() // D0–D4 yếu (bậc 0), D5–D14 ổn ở Hiểu(1)
    const ns = NS(7, 16, 2)
    const goc = chonBoCuaEm(CAU, LOI, ho, ns, 'B1|len')
    const len = chonBoCuaEm(CAU, LOI, ho, ns, 'B1|len', { dang: [{ ma: 'D5', nut: 'cho_thu_len_bac' }, { ma: 'D1', nut: 'cho_thu_len_bac' }] })
    const vd = (b: BoCuaEm, ma: number, cho: 'rieng' | 'thuThach') => b[cho].filter((q) => Number(q.slice(1)) % 20 === ma && mucCua(CAU, q) === 2)
    expect(vd(len, 5, 'rieng')).toEqual(['q65'])
    expect(vd(len, 5, 'thuThach')).toEqual([]) // đã là phần riêng, không còn ở thử thách
    expect(vd(goc, 5, 'rieng')).toEqual([])
    // D1 yếu: nút bị bỏ qua — bộ không có câu mức > 0 của D1 ngoài lõi
    for (const q of [...len.rieng, ...len.thuThach].filter((x) => Number(x.slice(1)) % 20 === 1)) expect(mucCua(CAU, q)).toBe(0)
    // bất biến chung: mọi câu ngoài lõi ≤ bậc đích (chưa điều chỉnh) + 1
    for (const q of [...len.rieng, ...len.thuThach]) {
      const c = CAU.find((x) => x.qid === q)!
      expect(c.mucDo).toBeLessThanOrEqual(bacDichTest(ho, CAU, maDangCua(c)).bac + 1)
    }
  })

  it('`cho_thu_len_bac` KHÔNG nhảy 2 bậc: dạng đã được mở +1 bậc (đúng ≥ 2 câu) thì nút không nâng thêm — kết quả y hệt không có nút', () => {
    const dung = { trangThai: 'da_khac_phuc' as const, ngayDungKhacNhau: 1, lanSai: 1 }
    const ho: HoSoEmRut = { dang: { D0: dangHS(0, 8, 0.9) }, cau: { q0: dung, q20: dung } } // đã mở: bậc đích 1
    const ns = NS(7, 40, 0)
    const khong = chonBoCuaEm(CAU, ['q1'], ho, ns, 'B1|2b')
    const co = chonBoCuaEm(CAU, ['q1'], ho, ns, 'B1|2b', { dang: [{ ma: 'D0', nut: 'cho_thu_len_bac' }] })
    expect(co).toEqual(khong)
    expect(co.rieng).not.toContain('q60') // Vận dụng (hồ sơ + 2) chỉ có thể là thử thách, không phải phần riêng
  })

  it('`uu_tien` ÉP ≥ 2 câu như dạng yếu: dù câu thứ hai đã đúng lại nhiều ngày (điểm âm) vẫn được lấy; và điểm cộng đưa câu của dạng ưu tiên lên trước khi chỗ trống ít', () => {
    const dung3 = { trangThai: 'da_khac_phuc' as const, ngayDungKhacNhau: 3, lanSai: 1 }
    const ho: HoSoEmRut = { dang: { D0: dangHS(1, 8, 0.9) }, cau: { q0: dung3, q20: dung3 } } // D0 ỔN (không yếu), bậc Hiểu
    const bo = chonBoCuaEm(CAU, ['q1'], ho, NS(7, 40, 0), 'B1|utep', { dang: [{ ma: 'D0', nut: 'uu_tien' }] })
    const goc = chonBoCuaEm(CAU, ['q1'], ho, NS(7, 40, 0), 'B1|utep')
    const d0 = (b: BoCuaEm) => b.rieng.filter((q) => qidCuaDang(0).includes(q))
    expect(d0(bo).length).toBeGreaterThanOrEqual(2)
    expect(d0(goc)).toEqual(['q40']) // không ưu tiên thì hai câu Biết đã đúng lại bị bỏ, chỉ còn câu Hiểu
    // ĐIỂM CỘNG (ngoài phần ép ≥ 2): D9/D12/D15 ở bậc Vận dụng; chỗ trống chỉ 7 riêng, các dạng khác chưa có hồ sơ (điểm 3). Ép ≥ 2 chỉ lấy câu Vận dụng của mỗi dạng;
    // câu HIỂU của ba dạng ấy (1,5 điểm khi không ưu tiên, 4,5 khi có) chỉ thắng nhờ điểm cộng của `uu_tien`.
    const hoVD: HoSoEmRut = { dang: Object.fromEntries([9, 12, 15].map((d) => [`D${d}`, dangHS(2, 8, 0.9)])), cau: {} }
    const ut = [{ ma: 'D9', nut: 'uu_tien' as const }, { ma: 'D12', nut: 'uu_tien' as const }, { ma: 'D15', nut: 'uu_tien' as const }]
    const chat = chonBoCuaEm(CAU, LOI, hoVD, NS(1, 36, 0), 'B1|utep', { dang: ut })
    const khongUt = chonBoCuaEm(CAU, LOI, hoVD, NS(1, 36, 0), 'B1|utep')
    for (const d of [9, 12, 15]) {
      expect(chat.rieng, `D${d} Hiểu có ưu tiên`).toContain(`q${d + 40}`)
      expect(khongUt.rieng, `D${d} Hiểu không ưu tiên`).not.toContain(`q${d + 40}`)
    }
  })

  it('`uu_tien`: dạng ổn được đối xử như dạng yếu — ≥ 2 câu, nhãn `dang_yeu`, đứng trước phần củng cố; `soDangYeu` vẫn chỉ đếm dạng yếu THẬT', () => {
    const ho = emTB()
    const ns = NS(7, 10, 4) // ngân sách chặt để thấy ưu tiên
    const goc = chonBoCuaEm(CAU, LOI, ho, ns, 'B1|ut')
    const ut = chonBoCuaEm(CAU, LOI, ho, ns, 'B1|ut', { dang: [{ ma: 'D9', nut: 'uu_tien' }] })
    const so = (b: BoCuaEm) => tapCua(b).filter((q) => Number(q.slice(1)) % 20 === 9).length
    expect(so(ut)).toBeGreaterThanOrEqual(2)
    expect(so(ut)).toBeGreaterThanOrEqual(so(goc))
    const rieng9 = ut.rieng.filter((x) => Number(x.slice(1)) % 20 === 9)
    for (const q of rieng9) expect(['dang_yeu', 'khoi_dong']).toContain(ut.nhan[q]) // câu dễ nhất chặng vẫn làm khởi động
    expect(rieng9.some((q) => ut.nhan[q] === 'dang_yeu') || rieng9.length === 0 || rieng9.every((q) => ut.nhan[q] === 'khoi_dong')).toBe(true)
    expect(ut.tomTat.soDangYeu).toBe(goc.tomTat.soDangYeu) // 5 dạng yếu thật, không tính D9
  })

  it('TỐI ĐA 3 DẠNG (dòng thứ 4 bỏ), dạng LẶP lấy dòng đầu, nút lạ bị bỏ, đầu vào không bị sửa', () => {
    const dc: DieuChinhEm = { dang: [{ ma: 'D5', nut: 'tam_nghi' }, { ma: 'D6', nut: 'tam_nghi' }, { ma: 'D7', nut: 'tam_nghi' }, { ma: 'D8', nut: 'tam_nghi' }, { ma: 'D5', nut: 'uu_tien' }, { ma: 'D9', nut: 'xoa_cau' as never }] }
    const truoc = JSON.stringify(dc)
    const goc = chonBoCuaEm(CAU, LOI, rong(), NS(7, 16, 0), 'B1|3')
    const bo = chonBoCuaEm(CAU, LOI, rong(), NS(7, 16, 0), 'B1|3', dc)
    expect(JSON.stringify(dc)).toBe(truoc)
    const co = (b: BoCuaEm, d: number) => [...b.rieng, ...b.thuThach].filter((q) => Number(q.slice(1)) % 20 === d).length
    for (const d of [5, 6, 7, 8, 9]) expect(co(goc, d), `D${d} trước điều chỉnh có câu riêng`).toBeGreaterThan(0)
    for (const d of [5, 6, 7]) expect(co(bo, d), `D${d} nghỉ`).toBe(0)
    expect(co(bo, 8), 'D8 là dòng thứ 4: KHÔNG được nghỉ').toBeGreaterThan(0)
    // nút lạ (không thuộc 4 nút) bị bỏ: một mình nó không đổi gì
    expect(chonBoCuaEm(CAU, LOI, rong(), NS(7, 16, 0), 'B1|3', { dang: [{ ma: 'D9', nut: 'xoa_cau' as never }] })).toEqual(goc)
  })

  it('BẤT BIẾN dưới MỌI điều chỉnh (60 em × 40 cổng ngẫu nhiên): lõi nguyên · ba tập rời, hợp = chặng · ≤ ngân sách sau nhịp · không câu ngoài lõi vượt bậc đích (chưa điều chỉnh) + 1 · nhãn đủ', () => {
    const NUT: DieuChinhEm['dang'] = []
    void NUT
    for (let sd = 1; sd <= 60; sd++) {
      const ho = emNgauNhien(sd, CAU)
      const r = mulberry32(9000 + sd)
      for (let k = 0; k < 40; k++) {
        const nut = ['uu_tien', 'ha_mot_bac', 'cho_thu_len_bac', 'tam_nghi'] as const
        const dc: DieuChinhEm = {
          nhip: Math.floor(r() * 9) - 4,
          khoiDong: Math.floor(r() * 5),
          dang: Array.from({ length: Math.floor(r() * 5) }, () => ({ ma: `D${Math.floor(r() * 20)}`, nut: nut[Math.floor(r() * 4)] })),
        }
        const ns = NS6[k % 6]
        const bo = chonBoCuaEm(CAU, LOI, ho, { soNgay: ns[0], cauMoiNgay: ns[1], onLaiMoiNgay: ns[2] }, `B1|${sd}`, dc)
        const tap = tapCua(bo)
        expect(bo.loi, `em ${sd}`).toEqual(LOI)
        expect(new Set(tap).size).toBe(tap.length)
        expect([...bo.chang.flat()].sort()).toEqual([...tap].sort())
        expect(Object.keys(bo.nhan).sort()).toEqual([...tap].sort())
        expect(tap.length).toBeLessThanOrEqual(Math.max(LOI.length, Math.min(80, bo.tomTat.nganSachCau)))
        for (const q of [...bo.rieng, ...bo.thuThach]) {
          const c = CAU.find((x) => x.qid === q)!
          expect(c.mucDo, `em ${sd} ${q}`).toBeLessThanOrEqual(bacDichTest(ho, CAU, maDangCua(c)).bac + 1)
        }
        expect(bo.thuThach.length).toBeLessThanOrEqual(Math.floor(0.2 * (bo.rieng.length + bo.thuThach.length)))
      }
    }
  })
})

// ───────────────────────── THÍCH NGHI SAU CHẶNG (ĐỢT 2) ─────────────────────────
describe('thichNghiChangSau — bước G', () => {
  /** Bài nhỏ: ba dạng A / B / C, mỗi dạng 6 câu mức [0,0,0,0,1,2]. */
  const cauNho: CauGiao[] = ['A', 'B', 'C', 'E'].flatMap((d, di) =>
    [0, 0, 0, 0, 1, 2].map((m, k) => ({ qid: `${d}${k}`, dang: d, chuyenDe: `c${di}`, mucDo: m as Muc, sao: 1 as const, phan: 'I' as const })),
  )
  const hsNho: HoSoEmRut = { dang: { A: dangHS(0, 8, 0.9), B: dangHS(0, 8, 0.4), C: dangHS(1, 8, 0.9), E: dangHS(2, 8, 0.9) }, cau: {} }
  const tomTat = (loi: string[], rieng: string[], thu: string[], nganSachCau: number) => ({ tong: loi.length + rieng.length + thu.length, soLoi: loi.length, soRieng: rieng.length, soThuThach: thu.length, soLoiCao: 0, soBiet: 0, soHieu: 0, soVanDung: 0, soChang: 0, soDangYeu: 1, soDangYeuDuCau: 1, nganSachCau })
  /** Dựng tay một bộ: `chang` = [qid, nhãn][] theo chặng. */
  function boTay(chang: [string, NhanCau][][], loi: string[], nganSachCau = 99): BoCuaEm {
    const nhan: Record<string, NhanCau> = {}
    for (const c of chang) for (const [q, n] of c) nhan[q] = n
    const thu = Object.keys(nhan).filter((q) => nhan[q] === 'thu_thach')
    const rieng = Object.keys(nhan).filter((q) => !loi.includes(q) && nhan[q] !== 'thu_thach')
    const b: BoCuaEm = { loi, rieng, thuThach: thu, chang: chang.map((c) => c.map(([q]) => q)), nhan, tomTat: tomTat(loi, rieng, thu, nganSachCau) }
    b.tomTat.soChang = chang.length
    return b
  }
  const dungTat = (ds: string[], v: boolean | Record<string, boolean>) => ({ dung: Object.fromEntries(ds.map((q) => [q, typeof v === 'boolean' ? v : v[q]])) })
  const BO_A = () =>
    boTay(
      [
        [['A0', 'loi'], ['A1', 'cung_co'], ['E0', 'khoi_dong']],
        [['C0', 'khoi_dong'], ['A2', 'cung_co'], ['C1', 'cung_co']],
        [['C2', 'khoi_dong'], ['A3', 'cung_co']],
      ],
      ['A0'],
    )

  it('ĐÚNG ≥ 80 % (≥ 2 câu thường của dạng): chặng SAU đổi 1 câu bậc thấp của dạng lấy 1 câu đúng bậc đích + 1; lõi và chặng đã mở nguyên', () => {
    const bo = BO_A()
    const kq = thichNghiChangSau(bo, cauNho, hsNho, 0, dungTat(['A0', 'A1'], true))
    expect(kq.doi).toEqual([{ ma: 'A', loai: 'len_bac', chang: 1, vao: 'A4', ra: 'A2' }]) // A4 = Hiểu, đúng bậc đích (Biết) + 1
    expect(kq.bo.chang[1]).toEqual(['C0', 'A4', 'C1'])
    expect(kq.bo.chang[0]).toEqual(bo.chang[0])
    expect(kq.bo.chang[2]).toEqual(bo.chang[2])
    expect(kq.bo.loi).toEqual(['A0'])
    expect(kq.bo.nhan.A4).toBe('cung_co')
    expect(kq.bo.nhan.A2).toBeUndefined()
    expect(kq.bo.rieng).toContain('A4')
    expect(kq.bo.rieng).not.toContain('A2')
    expect(kq.bo.tomTat.tong).toBe(bo.tomTat.tong) // đổi, không thêm
    expect(kq.henOnLai).toEqual([])
  })

  it('SAI ≥ 50 %: chặng sau THÊM 1 câu cùng dạng bậc thấp hơn (nhãn dạng yếu, sau phần lõi/khởi động), và câu sai vào lịch ôn', () => {
    const bo = boTay(
      [
        [['B0', 'loi'], ['B1', 'dang_yeu'], ['B2', 'dang_yeu'], ['E0', 'khoi_dong']],
        [['C0', 'khoi_dong'], ['C1', 'khoi_dong'], ['B4', 'cung_co'], ['C2', 'cung_co']],
      ],
      ['B0'],
    )
    const kq = thichNghiChangSau(bo, cauNho, hsNho, 0, dungTat(['B0', 'B1', 'B2', 'E0'], { B0: false, B1: false, B2: true, E0: false }))
    // B yếu: cần ≥ 3 câu mẫu (có B0, B1, B2): sai 2/3 ≥ 50 % ⇒ thêm câu bậc Biết (B3), chưa hết ngân sách nên không phải nhường
    expect(kq.doi).toEqual([{ ma: 'B', loai: 'them_cau_de', chang: 1, vao: 'B3', ra: null }])
    expect(kq.bo.chang[1]).toEqual(['C0', 'C1', 'B3', 'B4', 'C2']) // chèn sau khởi động, trước củng cố
    expect(kq.bo.nhan.B3).toBe('dang_yeu')
    expect(kq.bo.tomTat.tong).toBe(bo.tomTat.tong + 1)
    expect(kq.henOnLai).toEqual(['B0', 'B1', 'E0']) // sai ở câu thường (kể cả khởi động); B2 đúng không vào
  })

  it('HẾT NGÂN SÁCH: thêm câu dễ thì NHƯỜNG CHỖ một câu củng cố của dạng khác (không lõi, không thử thách); không có gì để nhường thì không đổi', () => {
    const chang: [string, NhanCau][][] = [
      [['B0', 'loi'], ['B1', 'dang_yeu'], ['B2', 'dang_yeu']],
      [['C0', 'khoi_dong'], ['C1', 'khoi_dong'], ['B4', 'cung_co'], ['C2', 'cung_co'], ['C4', 'thu_thach']],
    ]
    const bo = boTay(chang, ['B0'], 8) // tong = 8 = ngân sách
    const kq = thichNghiChangSau(bo, cauNho, hsNho, 0, dungTat(['B0', 'B1', 'B2'], false))
    expect(kq.doi).toEqual([{ ma: 'B', loai: 'them_cau_de', chang: 1, vao: 'B3', ra: 'C2' }])
    expect(kq.bo.tomTat.tong).toBe(8)
    expect(kq.bo.chang[1].slice(-1)).toEqual(['C4']) // thử thách vẫn cuối
    expect(kq.bo.chang[1]).not.toContain('C2')
    const khongCoGi = boTay([[['B0', 'loi'], ['B1', 'dang_yeu'], ['B2', 'dang_yeu']], [['C0', 'khoi_dong'], ['C1', 'khoi_dong'], ['B4', 'cung_co']]], ['B0'], 6)
    const k2 = thichNghiChangSau(khongCoGi, cauNho, hsNho, 0, dungTat(['B0', 'B1', 'B2'], false))
    expect(k2.doi).toEqual([]) // chỉ còn củng cố cùng dạng B ⇒ không nhường được
    expect(k2.bo).toBe(khongCoGi)
    expect(k2.henOnLai).toEqual(['B0', 'B1', 'B2'])
  })

  it('KHOẢNG GIỮA (đúng 2/3, sai 1/3): không lên bậc, không hạ — không đổi gì', () => {
    const bo = boTay(
      [
        [['A0', 'loi'], ['A1', 'cung_co'], ['A2', 'cung_co'], ['E0', 'khoi_dong']],
        [['C0', 'khoi_dong'], ['A3', 'cung_co'], ['C1', 'cung_co']],
      ],
      ['A0'],
    )
    const kq = thichNghiChangSau(bo, cauNho, hsNho, 0, dungTat(['A0', 'A1', 'A2'], { A0: true, A1: true, A2: false }))
    expect(kq.doi).toEqual([])
    expect(kq.bo).toBe(bo)
    expect(kq.henOnLai).toEqual(['A2']) // câu sai vẫn được hẹn ôn dù không đổi chặng
  })

  it('MẪU quá ít (dưới 2 câu thường của dạng; dạng yếu dưới 3): không đổi; khởi động, thử thách, lõi cao KHÔNG vào mẫu và không vào lịch ôn', () => {
    const bo = boTay(
      [
        [['A0', 'loi'], ['A1', 'thu_thach'], ['A2', 'loi_cao'], ['A3', 'khoi_dong'], ['B0', 'loi'], ['B1', 'dang_yeu']],
        [['C0', 'khoi_dong'], ['A4', 'cung_co'], ['B4', 'cung_co']],
      ],
      ['A0', 'A2', 'B0'],
    )
    // dạng A còn câu bậc Biết CHƯA có trong bộ (A6) để phép thử có nghĩa: nếu khởi động/thử thách/lõi cao lọt vào mẫu thì A sai 4/4 và SẼ thêm A6
    const cauLon: CauGiao[] = [...cauNho, { qid: 'A6', dang: 'A', chuyenDe: 'c0', mucDo: 0, sao: 1, phan: 'I' }]
    const kq = thichNghiChangSau(bo, cauLon, hsNho, 0, dungTat(['A0', 'A1', 'A2', 'A3', 'B0', 'B1'], false))
    expect(kq.doi).toEqual([]) // A chỉ có 1 câu thường (A0); B là dạng yếu, mẫu 2 < 3
    expect(kq.henOnLai).toEqual(['A0', 'A3', 'B0', 'B1']) // không có A1 (thử thách) và A2 (lõi cao)
    // câu CHƯA có kết quả không tính
    const k2 = thichNghiChangSau(BO_A(), cauNho, hsNho, 0, { dung: { A0: true } })
    expect(k2.doi).toEqual([])
  })

  it('câu thay ra phải THẤP HƠN bậc đích + 1: chặng sau chỉ còn câu đã ở bậc đó thì không đổi qua lại vô ích', () => {
    const cauLon: CauGiao[] = [...cauNho, { qid: 'A7', dang: 'A', chuyenDe: 'c0', mucDo: 1, sao: 1, phan: 'I' }]
    const bo = boTay(
      [
        [['A0', 'loi'], ['A1', 'cung_co'], ['E0', 'khoi_dong']],
        [['C0', 'khoi_dong'], ['A4', 'cung_co'], ['C1', 'cung_co']], // A4 đã là Hiểu = bậc đích + 1
      ],
      ['A0'],
    )
    expect(thichNghiChangSau(bo, cauLon, hsNho, 0, dungTat(['A0', 'A1'], true)).doi).toEqual([])
  })

  it('CHẶNG CUỐI hoặc chỉ số lạ: không đổi gì nhưng vẫn báo câu cần hẹn ôn; `soChangDaMo` đẩy chặng đích ra sau; số chặng đã mở tính cả chặng mở sớm', () => {
    const bo = BO_A()
    const cuoi = thichNghiChangSau(bo, cauNho, hsNho, 2, dungTat(['A3'], false))
    expect(cuoi.doi).toEqual([])
    expect(cuoi.henOnLai).toEqual(['A3'])
    for (const k of [-1, 7, NaN, 1.5]) expect(thichNghiChangSau(bo, cauNho, hsNho, k, dungTat(['A0', 'A1'], true)).doi, String(k)).toEqual([])
    const mo = boTay(
      [
        [['A0', 'loi'], ['A1', 'cung_co'], ['E0', 'khoi_dong']],
        [['C0', 'khoi_dong'], ['C1', 'cung_co']],
        [['C2', 'khoi_dong'], ['A2', 'cung_co'], ['C3', 'cung_co']],
      ],
      ['A0'],
    )
    const kq = thichNghiChangSau(mo, cauNho, hsNho, 0, dungTat(['A0', 'A1'], true), { soChangDaMo: 2 })
    expect(kq.doi.map((x) => x.chang)).toEqual([2])
    expect(kq.bo.chang[1]).toEqual(mo.chang[1]) // chặng 2 (chỉ số 1) đã mở sớm — không đụng
  })

  it('`dieuChinh` truyền lại: `tam_nghi` ⇒ không đổi dạng ấy; `ha_mot_bac` ⇒ bậc lên thấp hơn; dạng bậc Vận dụng không lên nữa', () => {
    const bo = BO_A()
    const ketQua = dungTat(['A0', 'A1'], true)
    expect(thichNghiChangSau(bo, cauNho, hsNho, 0, ketQua, { dieuChinh: { dang: [{ ma: 'A', nut: 'tam_nghi' }] } }).doi).toEqual([])
    // C ở Hiểu: đúng ⇒ lên Vận dụng (C5); hạ một bậc ⇒ đích chỉ là Hiểu (C4)
    const boC = boTay([[['C0', 'loi'], ['C1', 'cung_co'], ['E0', 'khoi_dong']], [['E1', 'khoi_dong'], ['C2', 'cung_co'], ['E2', 'cung_co']]], ['C0'])
    expect(thichNghiChangSau(boC, cauNho, hsNho, 0, dungTat(['C0', 'C1'], true)).doi[0]).toMatchObject({ vao: 'C5', ra: 'C2' })
    expect(thichNghiChangSau(boC, cauNho, hsNho, 0, dungTat(['C0', 'C1'], true), { dieuChinh: { dang: [{ ma: 'C', nut: 'ha_mot_bac' }] } }).doi[0]).toMatchObject({ vao: 'C4', ra: 'C2' })
    // E đã ở Vận dụng: không có bậc cao hơn
    const boE = boTay([[['E0', 'loi'], ['E1', 'cung_co'], ['C0', 'khoi_dong']], [['C1', 'khoi_dong'], ['E2', 'cung_co'], ['C2', 'cung_co']]], ['E0'])
    expect(thichNghiChangSau(boE, cauNho, hsNho, 0, dungTat(['E0', 'E1'], true)).doi).toEqual([])
  })

  it('TỐI ĐA 3 thay đổi mỗi chặng, theo mã dạng tăng dần', () => {
    const cau4: CauGiao[] = ['A', 'B', 'C', 'E'].flatMap((d, di) => [0, 0, 0, 1].map((m, k) => ({ qid: `${d}${k}`, dang: d, chuyenDe: `c${di}`, mucDo: m as Muc, sao: 1 as const, phan: 'I' as const })))
    const hs4: HoSoEmRut = { dang: { A: dangHS(0, 8, 0.9), B: dangHS(0, 8, 0.9), C: dangHS(0, 8, 0.9), E: dangHS(0, 8, 0.9) }, cau: {} }
    const bo = boTay(
      [
        [['A0', 'loi'], ['A1', 'cung_co'], ['B0', 'loi'], ['B1', 'cung_co'], ['C0', 'loi'], ['C1', 'cung_co'], ['E0', 'loi'], ['E1', 'cung_co']],
        [['A2', 'cung_co'], ['B2', 'cung_co'], ['C2', 'cung_co'], ['E2', 'cung_co']],
      ],
      ['A0', 'B0', 'C0', 'E0'],
    )
    const kq = thichNghiChangSau(bo, cau4, hs4, 0, dungTat(['A0', 'A1', 'B0', 'B1', 'C0', 'C1', 'E0', 'E1'], true))
    expect(kq.doi.map((x) => x.ma)).toEqual(['A', 'B', 'C'])
    expect(kq.bo.chang[1]).toEqual(['A3', 'B3', 'C3', 'E2'])
  })

  it('TÍNH CHẤT (64 em × 12 kết quả ngẫu nhiên × mọi chặng): lõi + thử thách nguyên · chỉ đổi chặng chưa mở · câu mới không lõi/trùng, ≤ bậc đích + 1 · tổng ≤ ngân sách · ≤ 3 đổi · tất định · không sửa đầu vào', () => {
    // BÀI ĐẶC: 6 dạng × ~13 câu để mỗi chặng có NHIỀU câu cùng dạng (mẫu ≥ 2) — bài 20 dạng × 4 câu hiếm khi có
    const CAU_P: CauGiao[] = Array.from({ length: 80 }, (_, i) => ({ qid: `p${i}`, dang: `D${i % 6}`, chuyenDe: `CD${i % 3}`, mucDo: ([0, 0, 0, 0, 1, 1, 2][Math.floor(i / 6) % 7]) as Muc, sao: ((i * 5) % 3) as 0 | 1 | 2, phan: (['I', 'I', 'II', 'III'] as const)[i % 4] }))
    const LOI = chonLoi(CAU_P, [])
    const emMau: [string, () => HoSoEmRut][] = [['rỗng', rong], ...Array.from({ length: 63 }, (_, sd) => [`ngẫu nhiên ${sd + 1}`, () => emNgauNhien(sd + 1, CAU_P)] as [string, () => HoSoEmRut])]
    let soDoi = 0
    let k0 = 0
    for (const [ten, tao] of emMau) {
      k0++
      const ho = tao()
      const bo = chonBoCuaEm(CAU_P, LOI, ho, k0 % 2 ? NS(7, 14, 2) : NS(7, 9, 3), `B1|${ten}`)
      const truoc = JSON.stringify(bo)
      const r = mulberry32(hashSeed(ten))
      for (let lan = 0; lan < 12; lan++) {
        const k = Math.floor(r() * bo.chang.length)
        const dungMap = Object.fromEntries(bo.chang[k].filter(() => r() < 0.9).map((q) => [q, r() < (lan % 3 === 0 ? 0.95 : lan % 3 === 1 ? 0.2 : 0.55)]))
        const kq = thichNghiChangSau(bo, CAU_P, ho, k, { dung: dungMap })
        expect(JSON.stringify(bo), 'đầu vào bị sửa').toBe(truoc)
        expect(JSON.stringify(thichNghiChangSau(bo, CAU_P, ho, k, { dung: dungMap })), 'tất định').toBe(JSON.stringify(kq))
        const b2 = kq.bo
        expect(b2.loi, `${ten}`).toEqual(bo.loi)
        expect(b2.thuThach, `${ten}`).toEqual(bo.thuThach)
        for (let c = 0; c < bo.chang.length; c++) if (c !== k + 1) expect(b2.chang[c], `${ten} chặng ${c + 1} (đã mở hoặc không phải chặng sau)`).toEqual(bo.chang[c])
        const tap = tapCua(b2)
        expect(new Set(tap).size).toBe(tap.length)
        expect([...b2.chang.flat()].sort()).toEqual([...tap].sort())
        expect(Object.keys(b2.nhan).sort()).toEqual([...tap].sort())
        expect(tap.length, ten).toBeLessThanOrEqual(bo.tomTat.nganSachCau)
        expect(kq.doi.length).toBeLessThanOrEqual(3)
        const cu = new Set(tapCua(bo))
        for (const q of tap.filter((x) => !cu.has(x))) {
          const c = CAU_P.find((x) => x.qid === q)!
          expect(b2.loi, `${ten} câu mới ${q} không được là lõi`).not.toContain(q)
          expect(c.mucDo, `${ten} câu mới ${q}`).toBeLessThanOrEqual(bacDichTest(ho, CAU_P, maDangCua(c)).bac + 1)
        }
        for (const q of kq.henOnLai) {
          expect(bo.chang[k]).toContain(q)
          expect(dungMap[q]).toBe(false)
          expect(['thu_thach', 'loi_cao']).not.toContain(bo.nhan[q])
        }
        expect(b2.tomTat.tong).toBe(tap.length)
        expect(b2.tomTat.soBiet + b2.tomTat.soHieu + b2.tomTat.soVanDung).toBe(tap.length)
        soDoi += kq.doi.length
      }
    }
    expect(soDoi, 'phép thử phải thật sự có đổi để các bất biến ở trên có nghĩa').toBeGreaterThan(50)
  })
})

describe('khoá nguồn', () => {
  it('lõi THUẦN: không Math.random, không đồng hồ, không IO, không React; không chữ "nắm chắc"', () => {
    const nguon = readFileSync('src/lib/btvn-nang-do.ts', 'utf8').replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '')
    for (const cam of ['Math.random', 'Date.now', 'new Date', 'performance.now', 'fetch(', 'localStorage', 'indexedDB', "from 'react'", 'console.']) expect(nguon, cam).not.toContain(cam)
    expect(nguon.toLowerCase(), 'chữ hiển thị cho em/thầy (không tính chú thích)').not.toMatch(/nắm chắc/)
    // chỉ import hashSeed từ exam-shuffle (thuần) — máy chủ import được
    expect([...readFileSync('src/lib/btvn-nang-do.ts', 'utf8').matchAll(/^import .* from '([^']+)'/gm)].map((m) => m[1])).toEqual(['./exam-shuffle'])
  })
})
