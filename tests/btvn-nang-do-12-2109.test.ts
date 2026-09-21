// BTVN "NÂNG ĐỠ" — BẢN 1.2 (Code 1, 21/09/2026; `prompt-btvn-nang-do.md` CẬP NHẬT 3). Bài học từ BÀI THẬT ĐẦU TIÊN: bài 29 dạng ⇒ lõi 29 câu; em yếu (5 câu/ngày × 4 ngày = 20 < 29) nhận ĐÚNG 29 câu lõi,
// phần riêng 0, 14/29 câu quá sức (`loi_cao`) — trái hai lời dặn của thầy ("mọi em làm đủ câu cốt lõi" + "em yếu không phân câu khó").
// SỬA LUẬT: lõi BẮT BUỘC của em = câu lõi mức ≤ bậc đích + 1 (hoặc câu GHIM); lõi cao hơn ⇒ `thuSucThem[]` (KHÔNG bắt buộc, ngoài `chang`, ngoài ngân sách); ngân sách so với LÕI BẮT BUỘC.
// Cùng khoá: DEADLINE THẮNG MỌI NÚM (số chặng ≤ số ngày, lõi bắt buộc nằm trong chặng, núm không kéo lõi ra), em khá y như trước.
import { describe, expect, it } from 'vitest'
import {
  chonBoCuaEm,
  chonLoi,
  maDangCua,
  thichNghiChangSau,
  type BoCuaEm,
  type CauGiao,
  type DieuChinhEm,
  type HoSoEmRut,
  type Muc,
  type NganSachBai,
} from '../src/lib/btvn-nang-do'
import { mulberry32 } from '../src/lib/exam-shuffle'

// ───────────────────────── BÀI MẪU GIỐNG BÀI THẬT ─────────────────────────
/** 29 dạng (như bài thật, 88 câu): D0–D14 có 4 câu [Biết, Biết, Hiểu, Vận dụng]; D15–D28 CHỈ có Vận dụng (2 câu). Lõi (mức thấp nhất mỗi dạng): 15 câu Biết + 14 câu Vận dụng = 29. */
function bai29(): CauGiao[] {
  const ra: CauGiao[] = []
  for (let d = 0; d < 15; d++)
    ([0, 0, 1, 2] as const).forEach((m, k) => ra.push({ qid: `d${d}-m${m}-${k}`, dang: `D${d}`, chuyenDe: `CD${d % 5}`, mucDo: m, sao: ((d + k) % 3) as 0 | 1 | 2, phan: (['I', 'I', 'II', 'III'] as const)[k] }))
  for (let d = 15; d < 29; d++) for (let k = 0; k < 2; k++) ra.push({ qid: `d${d}-v${k}`, dang: `D${d}`, chuyenDe: `CD${d % 5}`, mucDo: 2, sao: 1, phan: 'III' })
  return ra
}
const CAU = bai29()
const LOI = chonLoi(CAU, [])
const mucCua = (q: string) => CAU.find((c) => c.qid === q)!.mucDo
const dangHS = (bac: Muc, soGap: number, tiLe: number | null) => ({ bac, soGap, soSai: Math.round(soGap * (1 - (tiLe ?? 1))), tiLeKhacPhuc: tiLe })
const rong = (): HoSoEmRut => ({ dang: {}, cau: {} })
/** Em YẾU (như em thật 12121212): mọi dạng ở bậc Biết; D0–D9 đang yếu (khắc phục 40 %). */
const emYeu = (): HoSoEmRut => ({ dang: Object.fromEntries(Array.from({ length: 29 }, (_, d) => [`D${d}`, d < 10 ? dangHS(0, 8, 0.4) : dangHS(0, 6, 0.8)])), cau: {} })
/** Em KHÁ: mọi dạng đủ tin, ổn ở bậc Vận dụng (2) — bậc đích + 1 vẫn 2 (kẹp) ⇒ mọi câu lõi bắt buộc. */
const emKha = (): HoSoEmRut => ({ dang: Object.fromEntries(Array.from({ length: 29 }, (_, d) => [`D${d}`, dangHS(2, 10, 0.95)])), cau: {} })
/** Em Hiểu: mọi dạng đủ tin, ổn ở bậc Hiểu (1) ⇒ bậc đích + 1 = 2 ⇒ Vận dụng vẫn bắt buộc. */
const emHieu = (): HoSoEmRut => ({ dang: Object.fromEntries(Array.from({ length: 29 }, (_, d) => [`D${d}`, dangHS(1, 10, 0.95)])), cau: {} })
const NS = (soNgay: number, cauMoiNgay: number, onLaiMoiNgay: number): NganSachBai => ({ soNgay, cauMoiNgay, onLaiMoiNgay })
const NS_THAT = NS(4, 8, 3) // ngân sách của em thật: 5 câu/ngày × 4 ngày = 20 < 29
const chuoiDang = (q: string) => maDangCua(CAU.find((c) => c.qid === q)!)
const tapCauEm = (bo: BoCuaEm) => [...bo.loi, ...bo.rieng, ...bo.thuThach]
const tap2 = (bo: BoCuaEm) => [...bo.chang.flat(), ...bo.thuSucThem]

describe('BÀI THẬT: em yếu, ngân sách 20 < lõi 29', () => {
  it('lõi = 29 câu (14 Vận dụng); em yếu KHÔNG còn nhận câu Vận dụng bắt buộc: 15 lõi bắt buộc + 4 riêng đúng bậc + 1 thử thách = 20; 14 câu Vận dụng thành thử sức thêm', () => {
    expect(LOI).toHaveLength(29)
    expect(LOI.filter((q) => mucCua(q) === 2)).toHaveLength(14)
    const bo = chonBoCuaEm(CAU, LOI, emYeu(), NS_THAT, 'B|yeu')
    expect(bo.tomTat).toMatchObject({ tong: 20, soBatBuoc: 20, soLoi: 15, soRieng: 4, soThuThach: 1, soThuSucThem: 14, soLoiCao: 14, nganSachCau: 20 }) // chỗ trống 5 = 4 riêng đúng bậc + 1 thử thách (≤ 20 % làm tròn xuống, mục tiêu 15 %)
    expect(bo.thuSucThem).toHaveLength(14)
    expect(bo.thuSucThem.every((q) => mucCua(q) === 2)).toBe(true)
    expect(bo.chang.flat().filter((q) => mucCua(q) === 2)).toEqual([]) // 0 câu Vận dụng trong các chặng
    expect(bo.loi).toEqual(LOI) // lõi vẫn là lõi chung của cả lớp
  })
  it('PHẦN RIÊNG đúng bậc ở dạng YẾU: các câu riêng đều mức Biết (= bậc đích) và ở dạng em yếu (D0–D9); có ≥ 2 dạng yếu được thêm câu (trước: 0 câu riêng)', () => {
    const bo = chonBoCuaEm(CAU, LOI, emYeu(), NS_THAT, 'B|yeu')
    expect(bo.rieng).toHaveLength(4)
    for (const q of bo.rieng) {
      expect(mucCua(q), q).toBe(0)
      expect(Number(chuoiDang(q).slice(1)), `${q} phải ở dạng yếu D0–D9`).toBeLessThan(10)
    }
    // trước bản 1.2: cùng em, cùng ngân sách ⇒ 29 câu lõi, 0 riêng — nay có riêng đúng bậc
    expect(new Set(bo.rieng.map(chuoiDang)).size).toBe(4)
  })
  it('em KHÁ (bậc Vận dụng) và em HIỂU (bậc đích + 1 = Vận dụng): mọi câu lõi vẫn BẮT BUỘC, thử sức thêm rỗng — y như trước', () => {
    for (const ho of [emKha(), emHieu()]) {
      const bo = chonBoCuaEm(CAU, LOI, ho, NS_THAT, 'B|kha')
      expect(bo.thuSucThem).toEqual([])
      expect(bo.tomTat.soLoi).toBe(29)
      expect(bo.tomTat.soThuSucThem).toBe(0)
      for (const q of LOI) expect(bo.chang.flat()).toContain(q)
      // không còn nhãn loi_cao
      expect(Object.values(bo.nhan)).not.toContain('loi_cao')
    }
  })
  it('em CHƯA có hồ sơ: bậc Biết ở mọi dạng ⇒ giống em yếu về lõi bắt buộc (15) và thử sức thêm (14)', () => {
    const bo = chonBoCuaEm(CAU, LOI, rong(), NS_THAT, 'B|rong')
    expect(bo.tomTat.soLoi).toBe(15)
    expect(bo.tomTat.soThuSucThem).toBe(14)
  })
})

describe('GHIM luôn bắt buộc', () => {
  const ghim = 'd20-v0' // câu Vận dụng của dạng D20 (chỉ có Vận dụng)
  it('ghim qua tuyChon.ghim: em yếu VẪN nhận câu ghim trong chặng, KHÔNG nằm trong thử sức thêm, nhãn thường (không loi_cao)', () => {
    const loi = chonLoi(CAU, [ghim])
    expect(loi).toContain(ghim)
    const bo = chonBoCuaEm(CAU, loi, emYeu(), NS_THAT, 'B|ghim', undefined, { ghim: [ghim] })
    expect(bo.chang.flat()).toContain(ghim)
    expect(bo.thuSucThem).not.toContain(ghim)
    expect(bo.nhan[ghim]).toBe('loi')
    expect(bo.thuSucThem).toHaveLength(13)
    expect(bo.tomTat.soLoi).toBe(16)
  })
  it('ghim qua cờ CauGiao.ghim cho KẾT QUẢ Y HỆT tuyChon.ghim', () => {
    const loi = chonLoi(CAU, [ghim])
    const caoCo = CAU.map((c) => (c.qid === ghim ? { ...c, ghim: true } : c))
    expect(chonBoCuaEm(caoCo, loi, emYeu(), NS_THAT, 'B|ghim')).toEqual(chonBoCuaEm(CAU, loi, emYeu(), NS_THAT, 'B|ghim', undefined, { ghim: [ghim] }))
  })
  it('ghim câu thường (dưới bậc đích + 1) không đổi gì so với không ghim ở phần bắt buộc', () => {
    const g = 'd3-m1-2'
    const loi = chonLoi(CAU, [g])
    const bo = chonBoCuaEm(CAU, loi, emYeu(), NS_THAT, 'B|g', undefined, { ghim: [g] })
    expect(bo.chang.flat()).toContain(g)
    expect(bo.thuSucThem.length).toBe(14)
  })
})

describe('BẤT BIẾN trên nhiều em × nhiều ngân sách', () => {
  const NSS = [NS(4, 8, 3), NS(7, 12, 3), NS(5, 16, 2), NS(3, 8, 8), NS(14, 16, 0), NS(1, 12, 2), NS(2, 6, 5)]
  function emNgauNhien(seed: number): HoSoEmRut {
    const r = mulberry32(seed)
    const ho: HoSoEmRut = { dang: {}, cau: {} }
    for (let d = 0; d < 29; d++) {
      if (r() < 0.2) continue
      const soGap = Math.floor(r() * 12)
      ho.dang[`D${d}`] = dangHS(Math.floor(r() * 3) as Muc, soGap, soGap < 4 ? null : Math.round(r() * 100) / 100)
    }
    for (const c of CAU) {
      const x = r()
      if (x < 0.4) continue
      ho.cau[c.qid] = { trangThai: x < 0.6 ? 'da_khac_phuc' : x < 0.75 ? 'chua_thay_sai' : x < 0.9 ? 'dang_on' : 'moi_sai', ngayDungKhacNhau: Math.floor(r() * 4), lanSai: Math.floor(r() * 4) }
    }
    return ho
  }
  const em: [string, HoSoEmRut][] = [['rỗng', rong()], ['yếu', emYeu()], ['khá', emKha()], ['hiểu', emHieu()], ...Array.from({ length: 80 }, (_, s) => [`ngẫu nhiên ${s + 1}`, emNgauNhien(s + 1)] as [string, HoSoEmRut])]

  it('MỌI em × MỌI ngân sách: ba tập rời nhau; hợp = chặng ∪ thử sức thêm; thử sức thêm ⊆ lõi và NGOÀI chặng; tong = |chặng|; nhãn đúng; số chặng ≤ số ngày', () => {
    for (const [ten, ho] of em)
      for (const ns of NSS) {
        const bo = chonBoCuaEm(CAU, LOI, ho, ns, `B|${ten}`)
        const a = tapCauEm(bo)
        expect(new Set(a).size, `${ten} trùng`).toBe(a.length)
        expect([...tap2(bo)].sort(), ten).toEqual([...a].sort())
        expect(bo.thuSucThem.every((q) => bo.loi.includes(q)), ten).toBe(true)
        expect(bo.thuSucThem.filter((q) => bo.chang.flat().includes(q)), ten).toEqual([])
        expect(bo.tomTat.tong, ten).toBe(bo.chang.flat().length)
        expect(bo.tomTat.soLoi + bo.tomTat.soRieng + bo.tomTat.soThuThach, ten).toBe(bo.tomTat.tong)
        expect(bo.tomTat.soThuSucThem, ten).toBe(bo.thuSucThem.length)
        for (const q of bo.thuSucThem) expect(bo.nhan[q], `${ten} ${q}`).toBe('loi_cao')
        expect(bo.chang.length, ten).toBeLessThanOrEqual(ns.soNgay)
        expect(bo.chang.length, ten).toBe(bo.tomTat.tong === 0 ? 0 : Math.min(ns.soNgay, bo.tomTat.tong))
        // lõi BẮT BUỘC nằm trọn trong các chặng
        for (const q of bo.loi.filter((x) => !bo.thuSucThem.includes(x))) expect(bo.chang.flat(), `${ten} lõi ${q} phải nằm trong chặng`).toContain(q)
      }
  })
  it('TỔNG BẮT BUỘC ≤ sức chứa (ngân sách) hoặc = lõi bắt buộc; thử sức thêm KHÔNG tính vào ngân sách', () => {
    for (const [ten, ho] of em)
      for (const ns of NSS) {
        const bo = chonBoCuaEm(CAU, LOI, ho, ns, `B|${ten}`)
        const suc = ns.soNgay * Math.max(0, ns.cauMoiNgay - ns.onLaiMoiNgay)
        expect(bo.tomTat.tong, `${ten} ${JSON.stringify(ns)}`).toBeLessThanOrEqual(Math.max(bo.tomTat.soLoi, suc))
        expect(bo.tomTat.nganSachCau, ten).toBeLessThanOrEqual(CAU.length - bo.thuSucThem.length)
      }
  })
  it('em bậc BIẾT ở mọi dạng ⇒ 0 câu VẬN DỤNG bắt buộc (trừ ghim); em chưa/ít hồ sơ cũng vậy', () => {
    const biet = (): HoSoEmRut => ({ dang: Object.fromEntries(Array.from({ length: 29 }, (_, d) => [`D${d}`, dangHS(0, 8, d % 2 ? 0.4 : 0.9)])), cau: {} })
    for (const ho of [biet(), rong(), emYeu()])
      for (const ns of NSS) {
        const bo = chonBoCuaEm(CAU, LOI, ho, ns, 'B|biet')
        expect(bo.chang.flat().filter((q) => mucCua(q) === 2), JSON.stringify(ns)).toEqual([])
      }
  })
  it('KHÔNG câu nào NGOÀI lõi vượt bậc đích + 1; riêng ≤ bậc đích (giữ tính chất cũ)', () => {
    for (const [ten, ho] of em) {
      const bo = chonBoCuaEm(CAU, LOI, ho, NS_THAT, `B|${ten}`)
      for (const q of [...bo.rieng, ...bo.thuThach]) {
        const d = ho.dang[chuoiDang(q)]
        const bac = d && d.soGap >= 4 ? d.bac : 0
        expect(mucCua(q), `${ten} ${q}`).toBeLessThanOrEqual(Math.min(2, bac + 2)) // thử thách tối đa +1 ⇒ bậc đích ≤ bac + 1 (mở bậc) ⇒ ≤ bac + 2
      }
    }
  })
  it('TẤT ĐỊNH: cùng đầu vào cùng bộ; không phụ thuộc thứ tự đầu vào của `loi` (chỉ theo đề)', () => {
    const a = chonBoCuaEm(CAU, LOI, emYeu(), NS_THAT, 'B|td')
    expect(chonBoCuaEm(CAU, LOI, emYeu(), NS_THAT, 'B|td')).toEqual(a)
    expect(chonBoCuaEm(CAU, [...LOI].reverse(), emYeu(), NS_THAT, 'B|td')).toEqual(a)
  })
})

describe('HIẾM: bài không có gì bắt buộc (mọi câu lõi đều quá cao, không có phần riêng)', () => {
  it('lõi toàn câu cao cho em bậc Biết + không câu Biết/Hiểu nào ⇒ các câu ấy vào chặng như bản cũ (nhãn loi_cao ở cuối chặng), bài không rỗng', () => {
    const cauCao: CauGiao[] = Array.from({ length: 6 }, (_, i) => ({ qid: `c${i}`, dang: `X${i}`, chuyenDe: 'CD', mucDo: 2, sao: 1, phan: 'III' }))
    const loi = chonLoi(cauCao, [])
    const bo = chonBoCuaEm(cauCao, loi, rong(), NS(3, 8, 0), 'B|cao')
    expect(bo.thuSucThem).toEqual([])
    expect(bo.tomTat.tong).toBe(6)
    expect(bo.chang.flat().sort()).toEqual([...loi].sort())
    expect(Object.values(bo.nhan).every((n) => n === 'loi_cao' || n === 'khoi_dong')).toBe(true)
    expect(bo.tomTat.soLoiCao).toBeGreaterThan(0)
  })
})

describe('DEADLINE THẮNG MỌI NÚM (bộ não): không núm nào làm lõi bắt buộc trễ hạn hay đổi số ngày', () => {
  const nutHopLe: DieuChinhEm[] = [
    { nhip: -3 },
    { nhip: -3, khoiDong: 3 },
    { nhip: 3, khoiDong: 1 },
    { dang: [{ ma: 'D2', nut: 'tam_nghi' }, { ma: 'D3', nut: 'ha_mot_bac' }, { ma: 'D20', nut: 'cho_thu_len_bac' }] },
    { dang: [{ ma: 'D0', nut: 'uu_tien' }, { ma: 'D1', nut: 'uu_tien' }, { ma: 'D4', nut: 'uu_tien' }] },
    { nhip: -3, khoiDong: 3, dang: [{ ma: 'D10', nut: 'ha_mot_bac' }, { ma: 'D16', nut: 'ha_mot_bac' }, { ma: 'D5', nut: 'tam_nghi' }] },
    { nhip: NaN, khoiDong: 99, dang: [{ ma: 'KHONG-CO', nut: 'tam_nghi' }] } as unknown as DieuChinhEm,
  ]
  const NSS = [NS(4, 8, 3), NS(7, 12, 3), NS(2, 6, 5), NS(1, 12, 2), NS(14, 16, 0)]
  it('nhịp −3 và mọi tổ hợp núm: số chặng ≤ số ngày; MỌI câu lõi bắt buộc nằm trong các chặng; hạn (số ngày) không đổi; lõi bắt buộc GIỮ NGUYÊN so với không núm', () => {
    for (const ho of [emYeu(), emHieu(), rong()])
      for (const ns of NSS) {
        const goc = chonBoCuaEm(CAU, LOI, ho, ns, 'B|dl')
        for (const dc of nutHopLe) {
          const bo = chonBoCuaEm(CAU, LOI, ho, ns, 'B|dl', dc)
          expect(bo.chang.length, JSON.stringify(dc)).toBeLessThanOrEqual(ns.soNgay)
          const batBuoc = bo.loi.filter((q) => !bo.thuSucThem.includes(q))
          for (const q of batBuoc) expect(bo.chang.flat(), `${JSON.stringify(dc)} ${q}`).toContain(q)
          // núm KHÔNG kéo lõi ra khỏi phần bắt buộc, cũng không biến thử sức thêm thành bắt buộc
          expect(bo.thuSucThem, JSON.stringify(dc)).toEqual(goc.thuSucThem)
          expect(batBuoc).toEqual(goc.loi.filter((q) => !goc.thuSucThem.includes(q)))
          expect(bo.tomTat.tong).toBeGreaterThanOrEqual(bo.tomTat.soLoi)
        }
      }
  })
  it('nhịp −3 làm tổng bắt buộc GIẢM nhưng không dưới lõi bắt buộc; nhịp +3 không vượt sức chứa mới', () => {
    const ho = emYeu()
    const ns = NS(2, 12, 3) // 2 × 9 = 18 chỗ (< số câu có thể cho) để nhịp có tác dụng
    const goc = chonBoCuaEm(CAU, LOI, ho, ns, 'B|n')
    const giam = chonBoCuaEm(CAU, LOI, ho, ns, 'B|n', { nhip: -3 })
    const tang = chonBoCuaEm(CAU, LOI, ho, ns, 'B|n', { nhip: 3 })
    expect(giam.tomTat.tong).toBeLessThan(goc.tomTat.tong)
    expect(giam.tomTat.tong).toBeGreaterThanOrEqual(giam.tomTat.soLoi)
    expect(tang.tomTat.tong).toBeLessThanOrEqual(2 * (15 - 3))
    expect(giam.thuSucThem).toEqual(goc.thuSucThem)
  })
  it('em thật (ngân sách 20): nhịp −3 hạ còn ĐÚNG lõi bắt buộc (15), không rút thêm; nhịp +3 thêm chỗ cho phần riêng', () => {
    const ho = emYeu()
    const goc = chonBoCuaEm(CAU, LOI, ho, NS_THAT, 'B|nt')
    const giam = chonBoCuaEm(CAU, LOI, ho, NS_THAT, 'B|nt', { nhip: -3 })
    const tang = chonBoCuaEm(CAU, LOI, ho, NS_THAT, 'B|nt', { nhip: 3 })
    expect(goc.tomTat.tong).toBe(20)
    expect(giam.tomTat.tong).toBe(15)
    expect(giam.tomTat.soRieng).toBe(0)
    expect(tang.tomTat.tong).toBeGreaterThan(goc.tomTat.tong)
  })
})

describe('thichNghiChangSau giữ đúng "thử sức thêm"', () => {
  it('bộ mới giữ nguyên thuSucThem; tong tính trên câu BẮT BUỘC; câu thay vào không thuộc thử sức thêm; thử sức thêm không bao giờ vào mẫu thích nghi', () => {
    const bo = chonBoCuaEm(CAU, LOI, emYeu(), NS_THAT, 'B|tn')
    const dung: Record<string, boolean> = {}
    for (const q of bo.chang[0]) dung[q] = true // chặng 0 đúng hết ⇒ có thể lên bậc
    const kq = thichNghiChangSau(bo, CAU, emYeu(), 0, { dung })
    expect(kq.bo.thuSucThem).toEqual(bo.thuSucThem)
    expect(kq.bo.thuSucThem.every((q) => !kq.bo.chang.flat().includes(q))).toBe(true)
    expect(kq.bo.tomTat.tong).toBe(kq.bo.chang.flat().length)
    expect(kq.bo.tomTat.soBatBuoc).toBe(kq.bo.tomTat.tong)
    for (const d of kq.doi) expect(bo.thuSucThem).not.toContain(d.vao)
    // thử sức thêm KHÔNG bao giờ hẹn ôn / vào mẫu dù em (giả sử) sai
    const sai: Record<string, boolean> = {}
    for (const q of bo.chang[0]) sai[q] = false
    const kq2 = thichNghiChangSau(bo, CAU, emYeu(), 0, { dung: { ...sai, ...Object.fromEntries(bo.thuSucThem.map((q) => [q, false])) } })
    for (const q of bo.thuSucThem) expect(kq2.henOnLai).not.toContain(q)
  })
  it('CÓ ĐỔI THẬT (lên bậc / thêm câu dễ): bộ mới giữ nguyên thuSucThem; tong/soBatBuoc tính lại trên câu BẮT BUỘC (không gồm thử sức thêm); ngân sách không bị thử sức thêm ăn mất', () => {
    // bài nhỏ: A, B mỗi dạng 5 Biết + 2 Hiểu + 1 Vận dụng; C, D CHỈ Vận dụng (⇒ 2 câu lõi cao ⇒ thử sức thêm cho em bậc Biết)
    const cau2: CauGiao[] = []
    for (const dg of ['A', 'B'])
      [0, 0, 0, 0, 0, 1, 1, 2].forEach((m, k) => cau2.push({ qid: `${dg}${k}`, dang: dg, chuyenDe: 'CD', mucDo: m as Muc, sao: 1, phan: 'I' }))
    for (const dg of ['C', 'D']) for (let k = 0; k < 2; k++) cau2.push({ qid: `${dg}${k}`, dang: dg, chuyenDe: 'CD', mucDo: 2, sao: 1, phan: 'III' })
    const loi2 = chonLoi(cau2, [])
    const ho: HoSoEmRut = { dang: Object.fromEntries(['A', 'B', 'C', 'D'].map((d) => [d, dangHS(0, 8, 0.9)])), cau: {} }
    let daThayLen = false
    let daThayThem = false
    let soLanKiem = 0
    for (let sd = 0; sd < 80; sd++) {
      for (const ns of [NS(2, 5, 0), NS(2, 6, 0), NS(3, 4, 0), NS(2, 10, 0), NS(3, 8, 0)]) {
        const bo = chonBoCuaEm(cau2, loi2, ho, ns, `B|doi${sd}`)
        expect(bo.thuSucThem.length, 'C, D chỉ có Vận dụng ⇒ thử sức thêm').toBeGreaterThan(0)
        for (const chieu of ['dung', 'sai'] as const) {
          const dung: Record<string, boolean> = {}
          for (const q of bo.chang[0]) dung[q] = chieu === 'dung'
          const kq = thichNghiChangSau(bo, cau2, ho, 0, { dung })
          if (kq.doi.length === 0) continue
          soLanKiem++
          if (kq.doi.some((d) => d.loai === 'len_bac')) daThayLen = true
          if (kq.doi.some((d) => d.loai === 'them_cau_de')) daThayThem = true
          expect(kq.bo.thuSucThem).toEqual(bo.thuSucThem)
          expect(kq.bo.thuSucThem.filter((q) => kq.bo.chang.flat().includes(q))).toEqual([])
          const batBuoc = kq.bo.chang.flat().length
          expect(kq.bo.tomTat.tong).toBe(batBuoc)
          expect(kq.bo.tomTat.soBatBuoc).toBe(batBuoc)
          expect(batBuoc).toBeLessThanOrEqual(Math.max(bo.tomTat.soLoi, bo.tomTat.nganSachCau)) // tổng bắt buộc không vượt ngân sách (thử sức thêm không ăn mất chỗ)
          expect(kq.bo.tomTat.soLoi + kq.bo.tomTat.soRieng + kq.bo.tomTat.soThuThach).toBe(batBuoc)
          for (const d of kq.doi) {
            expect(bo.thuSucThem).not.toContain(d.vao)
            expect(bo.loi).not.toContain(d.vao)
          }
        }
      }
    }
    expect(soLanKiem).toBeGreaterThan(20)
    expect(daThayLen, 'phải gặp ít nhất một lần lên bậc').toBe(true)
  })
  it('THÊM CÂU DỄ với bộ dựng tay: ngân sách còn chỗ (câu thử sức thêm KHÔNG ăn chỗ) ⇒ thêm 1 câu dễ, KHÔNG nhường chỗ câu củng cố; tong/soBatBuoc tính trên câu bắt buộc', () => {
    const cau3: CauGiao[] = [
      ...['A0', 'A1', 'A2', 'A3'].map((q) => ({ qid: q, dang: 'A', chuyenDe: 'CD', mucDo: 0 as Muc, sao: 1 as const, phan: 'I' as const })),
      { qid: 'A4', dang: 'A', chuyenDe: 'CD', mucDo: 1, sao: 1, phan: 'I' },
      ...['B0', 'B1', 'B2'].map((q) => ({ qid: q, dang: 'B', chuyenDe: 'CD', mucDo: 0 as Muc, sao: 1 as const, phan: 'I' as const })),
      { qid: 'C0', dang: 'C', chuyenDe: 'CD', mucDo: 2, sao: 1, phan: 'III' },
      { qid: 'C1', dang: 'C', chuyenDe: 'CD', mucDo: 2, sao: 1, phan: 'III' },
    ]
    const ho: HoSoEmRut = { dang: { A: dangHS(0, 8, 0.9), B: dangHS(0, 8, 0.9), C: dangHS(0, 8, 0.9) }, cau: {} }
    const bo: BoCuaEm = {
      loi: ['A0', 'B0', 'C0'],
      thuSucThem: ['C0'],
      rieng: ['A1', 'A2', 'B1'],
      thuThach: [],
      chang: [['A0', 'A1', 'B0'], ['A2', 'B1']],
      nhan: { A0: 'loi', A1: 'cung_co', B0: 'loi', A2: 'cung_co', B1: 'cung_co', C0: 'loi_cao' },
      tomTat: { tong: 5, soLoi: 2, soRieng: 3, soThuThach: 0, soLoiCao: 1, soThuSucThem: 1, soBatBuoc: 5, soBiet: 5, soHieu: 0, soVanDung: 0, soChang: 2, soDangYeu: 0, soDangYeuDuCau: 0, nganSachCau: 6 },
    }
    const kq = thichNghiChangSau(bo, cau3, ho, 0, { dung: { A0: false, A1: false } }) // dạng A sai 2/2 ⇒ thêm 1 câu dễ cùng dạng vào chặng 1
    expect(kq.doi).toEqual([{ ma: 'A', loai: 'them_cau_de', chang: 1, vao: 'A3', ra: null }]) // còn chỗ (5 bắt buộc < 6) ⇒ KHÔNG nhường chỗ câu củng cố
    expect(kq.bo.chang[1]).toContain('A3')
    expect(kq.bo.chang[1]).toContain('B1')
    expect(kq.bo.thuSucThem).toEqual(['C0'])
    expect(kq.bo.tomTat.tong).toBe(6)
    expect(kq.bo.tomTat.soBatBuoc).toBe(6)
    expect(kq.bo.tomTat.tong).toBe(kq.bo.chang.flat().length)
    // hết chỗ THẬT (6 bắt buộc = ngân sách 6): nay mới phải nhường một câu củng cố của dạng khác
    const day: BoCuaEm = { ...bo, tomTat: { ...bo.tomTat, nganSachCau: 5 } }
    const kq2 = thichNghiChangSau(day, cau3, ho, 0, { dung: { A0: false, A1: false } })
    expect(kq2.doi).toEqual([{ ma: 'A', loai: 'them_cau_de', chang: 1, vao: 'A3', ra: 'B1' }])
    expect(kq2.bo.tomTat.tong).toBe(5)
  })
  it('bộ chốt TRƯỚC bản 1.2 (không có trường thuSucThem) vẫn chạy: coi như rỗng', () => {
    const bo = chonBoCuaEm(CAU, LOI, emKha(), NS_THAT, 'B|cu')
    const { thuSucThem: _t, ...cu } = bo
    void _t
    const kq = thichNghiChangSau(cu as BoCuaEm, CAU, emKha(), 0, { dung: Object.fromEntries(bo.chang[0].map((q) => [q, true])) })
    expect(kq.bo.chang.length).toBe(bo.chang.length)
  })
})
