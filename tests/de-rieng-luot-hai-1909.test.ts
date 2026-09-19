// EM VÀO MUỘN — LƯỢT HAI CỦA RÚT ĐỀ RIÊNG (19/09, 0.Planer giao sau khi gộp 5e99e08).
//
// Thầy dạy lớp thật: em vào muộn vài phút là chuyện thường ngày. Bản 17/09 gộp cả
// lớp vào lượt chia (em vắng chiếm suất, đỉnh trùng của em có mặt cao lên vô cớ);
// bản 19/09 sáng bỏ hẳn em vắng (em vào muộn bốc theo hash, mất câu hỏi lại). Nay:
//
//   1. em CÓ MẶT: bộ đề không đổi một qid so với 5e99e08 — khoá bằng dấu vân tay;
//   2. em cùng lớp CHƯA vào phòng chờ: dựng ở LƯỢT HAI, sau khi em có mặt đã chốt,
//      nhận bộ đếm tần suất của lượt một để lấy câu ít dùng nhất; không vào con số
//      nào của biên bản, biên bản thêm đúng một dòng tin;
//   3. đúng MỘT lượt `hoSoOnCa` thêm (chia lô 20); lượt đó hỏng ⇒ em vắng luật cũ,
//      không kéo em có mặt theo; lượt `noiKhoCa` của em vắng hỏng ⇒ vẫn Bắt đầu được;
//   4. lớp 40 em (25 có mặt) không chậm hơn bản chỉ-em-có-mặt quá 1,5 lần;
//   5. tất định.
import fs from 'node:fs'
import path from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CAU_HINH_DE_RIENG_MAC_DINH } from '../src/lib/cau-hinh-de-rieng'
import { dungDeRieng, dungDeRiengLuotHai, type CaTruocDaCham, type HoSoOnEm, type YeuCauDeRieng } from '../src/lib/de-rieng'
import { doTrung } from '../src/lib/de-rieng-tran-trung'
import { PHAN_DE, type CauUngVien, type PhanDe } from '../src/lib/rut-de'
import { bocSoGia, cauGia, lopGia, lopGiaCoHoSo, vanTay } from './_lop-gia-de-rieng'

const hoSoOnCa = vi.fn()
const banDoSaiCa = vi.fn()
const danhSachCa = vi.fn()
const danhSachEm = vi.fn()
const noiKhoCa = vi.fn()
const loadSessionTeacherBank = vi.fn()
const saveSessionTeacherBank = vi.fn(async () => {})
const docSoCauCa = vi.fn()
const loadExamSources = vi.fn()

vi.mock('../src/lib/exam-api', async (goc) => ({
  ...(await goc<Record<string, unknown>>()),
  hoSoOnCa: (...a: unknown[]) => hoSoOnCa(...a),
  banDoSaiCa: (...a: unknown[]) => banDoSaiCa(...a),
  danhSachCa: (...a: unknown[]) => danhSachCa(...a),
  danhSachEm: (...a: unknown[]) => danhSachEm(...a),
  noiKhoCa: (...a: unknown[]) => noiKhoCa(...a),
  chiTietCa: vi.fn(async () => {
    throw new Error('test này không được rơi về chiTietCa')
  }),
}))
vi.mock('../src/lib/exam-db', async (goc) => ({
  ...(await goc<Record<string, unknown>>()),
  loadSessionTeacherBank: (...a: unknown[]) => loadSessionTeacherBank(...a),
  saveSessionTeacherBank: (...a: unknown[]) => saveSessionTeacherBank(...(a as [])),
  docSoCauCa: (...a: unknown[]) => docSoCauCa(...a),
  docDeRiengCa: vi.fn(async () => undefined),
  loadExamSources: (...a: unknown[]) => loadExamSources(...a),
}))

const { dungDeRiengChoCa } = await import('../src/lib/de-rieng-nguon')

const NGAY_CA = '2026-09-21'
const HAN_NANG = 60_000
const hoSo = (them: Partial<HoSoOnEm> = {}): HoSoOnEm => ({ tuCa: 'cu', sai: [], daKhacPhuc: [], lam: [], ...them })
const boCuaPhan = (de: string[], p: PhanDe) => new Set(de.filter((q) => q.startsWith(`${p}-`)))

/** Lớp 40 em trên kho đủ rộng: 25 em có mặt, 15 em vắng; ai cũng nộp ca trước, sai 7 câu. */
function lop40(soI = 300): { y: YeuCauDeRieng; coMat: string[]; vang: string[]; saiCua: Record<string, string[]> } {
  const r = bocSoGia(4040)
  const uv = { I: Array.from({ length: soI }, (_, i) => cauGia('I', i, 'bai_tap')), II: Array.from({ length: 40 }, (_, i) => cauGia('II', i)), III: Array.from({ length: 60 }, (_, i) => cauGia('III', i)) } as Record<PhanDe, CauUngVien[]>
  const tat = Array.from({ length: 40 }, (_, i) => String(12000 + i))
  const daLamCua: Record<string, string[]> = {}
  const saiCua: Record<string, string[]> = {}
  for (const sbd of tat) {
    const lam = uv.I.map((c) => c.id).filter(() => r() < 0.08).slice(0, 18)
    daLamCua[sbd] = lam
    saiCua[sbd] = lam.slice(0, 7)
  }
  const dsCa: CaTruocDaCham[] = [{ maCa: 'cu', daLamCua, saiCua }]
  const coMat = tat.filter((_, i) => i % 8 !== 3 && i % 8 !== 6 && i % 8 !== 7).slice(0, 25)
  const vang = tat.filter((s) => !coMat.includes(s))
  return { y: { uv, yc: { soCau: { I: 18, II: 4, III: 6 }, chuyenDe: [], mucDo: [], tranhQid: [], seed: 20260921 }, dsSbd: coMat, dsCa, hoSo: {}, ngayCa: NGAY_CA }, coMat, vang, saiCua }
}

// ===========================================================================
describe('1. EM CÓ MẶT — bộ đề KHÔNG đổi một qid so với bản đã gộp (5e99e08)', () => {
  // Dấu vân tay lấy bằng mã 5e99e08/30b2fb7 TRƯỚC khi viết lượt hai, trên 12 lớp
  // `lopGiaCoHoSo` (đường CÓ hồ sơ ôn). [vân tay boTheoEm, tổng câu lặp, tổng câu nới].
  // 30 lớp đường KHÔNG hồ sơ vẫn khoá ở `de-rieng-ho-so-1909.test.ts` mục 6.
  const VANG_CO_HO_SO: [number, number, number][] = [
    [4078385753, 21, 0], [3297704658, 98, 0], [789399926, 10, 0], [3340388121, 32, 0], [210465268, 109, 3], [1677583010, 69, 0],
    [763908218, 7, 0], [1016822231, 41, 2], [1180176885, 93, 1], [1631501142, 137, 0], [2612460314, 107, 0], [2123849021, 76, 4],
  ]

  it('12 lớp có hồ sơ: vân tay lượt một khớp từng lớp — dù có hay không có lượt hai đi sau', () => {
    VANG_CO_HO_SO.forEach(([van, soLap, soNoi], c) => {
      const y = lopGiaCoHoSo(c)
      const ra = dungDeRieng(y)
      expect(vanTay(ra.boTheoEm), `lớp ${c}`).toBe(van)
      expect(Object.values(ra.lapTheoEm).reduce((t, x) => t + x.length, 0)).toBe(soLap)
      expect(ra.noiCam.reduce((t, x) => t + x.soNoi, 0)).toBe(soNoi)
      // Chạy lượt hai cho 10 em lạ rồi soi lại: `ra` không bị sửa tại chỗ.
      const truoc = JSON.stringify({ ...ra, ids: [...ra.ids] })
      dungDeRiengLuotHai({ y, luotMot: ra, dsSbdVang: Array.from({ length: 10 }, (_, i) => String(99000 + i)), hoSoVang: {} })
      expect(JSON.stringify({ ...ra, ids: [...ra.ids] })).toBe(truoc)
    })
  }, HAN_NANG)

  it('lượt hai KHÔNG nhận em có mặt: SBD trùng phòng chờ bị bỏ, không ai bị dựng đề hai lần', () => {
    const { y, coMat, vang } = lop40()
    const ra = dungDeRieng(y)
    const hai = dungDeRiengLuotHai({ y, luotMot: ra, dsSbdVang: [...coMat.slice(0, 5), ...vang, vang[0]!], hoSoVang: {} })
    expect(Object.keys(hai.boTheoEm).sort()).toEqual([...vang].sort())
  })
})

// ===========================================================================
describe('2. EM VẮNG — đề riêng dựng ở lượt hai, có câu hỏi lại của CHÍNH MÌNH', () => {
  const { y, coMat, vang, saiCua } = lop40()
  const ra = dungDeRieng(y)
  const hai = dungDeRiengLuotHai({ y, luotMot: ra, dsSbdVang: vang, hoSoVang: {} })

  it('mỗi em vắng đủ 28 câu, không trùng câu trong đề mình, đúng số câu từng phần', () => {
    expect(hai.thieuCau).toEqual([])
    for (const s of vang) {
      const de = hai.boTheoEm[s]!
      expect(de).toHaveLength(28)
      expect(new Set(de).size).toBe(28)
      expect(PHAN_DE.map((p) => boCuaPhan(de, p).size)).toEqual([18, 4, 6])
    }
  })

  it('câu hỏi lại lấy từ câu CHÍNH EM sai ca trước: sai 7 ⇒ cần 3 (gốc + song sinh cùng dạng)', () => {
    for (const s of vang) {
      expect(hai.canCua[s]).toBe(3)
      expect(hai.soLapCua[s]).toBe(3)
      for (const q of hai.cauGocTheoEm[s]!) expect(saiCua[s]).toContain(q)
      for (const q of hai.lapTheoEm[s]!) expect(hai.boTheoEm[s]).toContain(q)
      expect(hai.cauGocTheoEm[s]!.length + hai.songSinhTheoEm[s]!.length).toBe(3)
    }
  })

  it('hồ sơ của em vắng được tôn trọng: câu đã khắc phục không hỏi lại, câu vừa làm trong tuần không phát lại', () => {
    const s = vang[0]!
    const lamTuan = y.uv.I.slice(200, 230).map((c) => c.id)
    const co = dungDeRiengLuotHai({ y, luotMot: ra, dsSbdVang: vang, hoSoVang: { [s]: hoSo({ daKhacPhuc: saiCua[s]!.slice(0, 6), lam: lamTuan }) } })
    expect(co.daKhacPhucTheoEm[s]).toEqual(saiCua[s]!.slice(0, 6))
    expect(co.lapTheoEm[s]!.length).toBeLessThanOrEqual(1)
    for (const q of co.lapTheoEm[s]!) expect(saiCua[s]!.slice(0, 6)).not.toContain(q)
    for (const q of lamTuan) expect(co.boTheoEm[s]).not.toContain(q)
    expect(co.noiCam).toEqual([])
  })

  it('lượt hồ sơ của em vắng HỎNG (hoSoVang = undefined) ⇒ em vắng rút theo LUẬT CŨ: song sinh lấy phần tử đầu, không tập cấm', () => {
    const cu = dungDeRiengLuotHai({ y, luotMot: ra, dsSbdVang: vang })
    for (const s of vang) {
      expect(cu.boTheoEm[s]).toHaveLength(28)
      expect(cu.soLapCua[s]).toBe(3)
    }
    expect(cu.daKhacPhucTheoEm).toEqual({})
  })

  it('em vắng KHÔNG nằm trong bất kỳ con số nào của lượt một', () => {
    for (const s of vang) {
      expect(ra.boTheoEm[s]).toBeUndefined()
      expect(ra.canCua[s]).toBeUndefined()
      expect(ra.thieuLap.some((t) => t.sbd === s)).toBe(false)
    }
    expect(Object.keys(ra.boTheoEm).sort()).toEqual([...coMat].sort())
  })
})

// ===========================================================================
describe('3. ĐỈNH TRÙNG — em vắng không được đẩy trùng của em có mặt lên', () => {
  it('đỉnh trùng giữa các em CÓ MẶT y nguyên (đề không đổi), và em vắng không vượt đỉnh đó trên kho 300', () => {
    const { y, coMat, vang } = lop40(300)
    const ra = dungDeRieng(y)
    const hai = dungDeRiengLuotHai({ y, luotMot: ra, dsSbdVang: vang, hoSoVang: {} })
    for (const p of PHAN_DE) {
      const coMatP = coMat.map((s) => boCuaPhan(ra.boTheoEm[s]!, p))
      const tatCaP = [...coMatP, ...vang.map((s) => boCuaPhan(hai.boTheoEm[s]!, p))]
      const dinhCoMat = doTrung(coMatP).dinh
      // Câu khắc phục bị khoá có thể trùng thật (cùng sai một câu) — cho em vắng đúng biên độ đó, không hơn.
      expect(doTrung(tatCaP).dinh, `phần ${p}`).toBeLessThanOrEqual(Math.max(dinhCoMat, 2))
    }
    expect(hai.dinhTrung).toBeLessThanOrEqual(2)
  })

  it('kho DƯ (≥ tổng câu của cả 40 em): em vắng chỉ nhận câu CHƯA AI DÙNG ở phần câu mới ⇒ trùng với em có mặt chỉ còn do câu khắc phục', () => {
    const { y, coMat, vang } = lop40(900)
    // Chỉ Phần I (900 câu ≥ 40 em × 18): Phần II/III của lớp giả chỉ 40/60 câu cho 40 em
    // nên ở đó trùng là tất yếu, không phải chỗ đo "kho dư". Không ai có câu khắc phục ⇒ phải về 0 tuyệt đối.
    const khongLap: YeuCauDeRieng = { ...y, dsCa: [], yc: { ...y.yc, soCau: { I: 18, II: 0, III: 0 } } }
    const ra = dungDeRieng(khongLap)
    const hai = dungDeRiengLuotHai({ y: khongLap, luotMot: ra, dsSbdVang: vang, hoSoVang: {} })
    expect(hai.dinhTrung).toBe(0)
    const daDung = new Set(coMat.flatMap((s) => [...boCuaPhan(ra.boTheoEm[s]!, 'I')]))
    for (const s of vang) for (const q of boCuaPhan(hai.boTheoEm[s]!, 'I')) expect(daDung.has(q)).toBe(false)
  })

  it('kho MỎNG: em vắng lấy câu ÍT EM DÙNG NHẤT — tần suất cả lớp sau lượt hai lệch không quá 2', () => {
    const { y, coMat, vang } = lop40(60)
    const khongLap: YeuCauDeRieng = { ...y, dsCa: [], yc: { ...y.yc, soCau: { I: 18, II: 0, III: 0 } } }
    const ra = dungDeRieng(khongLap)
    const hai = dungDeRiengLuotHai({ y: khongLap, luotMot: ra, dsSbdVang: vang, hoSoVang: {} })
    const dem = new Map<string, number>(khongLap.uv.I.map((c) => [c.id, 0]))
    for (const s of coMat) for (const q of ra.boTheoEm[s]!) dem.set(q, dem.get(q)! + 1)
    for (const s of vang) for (const q of hai.boTheoEm[s]!) dem.set(q, dem.get(q)! + 1)
    const v = [...dem.values()]
    expect(Math.max(...v) - Math.min(...v)).toBeLessThanOrEqual(2)
    for (const s of vang) expect(hai.boTheoEm[s]).toHaveLength(18)
  })
})

// ===========================================================================
describe('4. TẦNG LẤY DỮ LIỆU — dungDeRiengChoCa có lớp', () => {
  const mcq = (id: string) => ({ id, text: `Câu ${id} tính khối lượng m gam`, choices: ['1', '2', '3', '4'] as [string, string, string, string], correct: 'A' as const, chuyenDe: 'Ester' })
  const BANK = [{ maDe: 'D', phanI: Array.from({ length: 120 }, (_, i) => mcq(`D-${i}`)), phanII: [], phanIII: [] }]
  const LOP = Array.from({ length: 40 }, (_, i) => String(12000 + i))
  const CO_MAT = LOP.slice(0, 25)
  const VANG = LOP.slice(25)
  const SAI = Object.fromEntries(LOP.map((s, e) => [s, Array.from({ length: 7 }, (_, j) => `D-${(e * 3 + j * 5) % 120}`)]))
  const LAM = Object.fromEntries(LOP.map((s) => [s, [...SAI[s]!, 'D-118', 'D-119']]))
  const traHoSo = async (_u: string, _m: string, lo: string[]) => Object.fromEntries(lo.map((s) => [s, { tuCa: 'cu', sai: [], daKhacPhuc: [], lam: [] }]))

  beforeEach(() => {
    for (const f of [hoSoOnCa, banDoSaiCa, danhSachCa, danhSachEm, noiKhoCa, loadSessionTeacherBank, docSoCauCa, loadExamSources]) f.mockReset()
    saveSessionTeacherBank.mockClear()
    loadSessionTeacherBank.mockResolvedValue(BANK)
    loadExamSources.mockResolvedValue([])
    noiKhoCa.mockResolvedValue({ themBank: 0, themKey: 0 })
    docSoCauCa.mockResolvedValue({ I: 14, II: 0, III: 0 })
    danhSachCa.mockResolvedValue([
      { maCa: 'moi', tenCa: '2009 - Lớp 1', loai: 'thi', trangThai: 'dang_mo', moLuc: '2026-09-21T01:00:00Z' },
      { maCa: 'cu', tenCa: '2009 - Lớp 1', loai: 'thi', trangThai: 'da_dong', moLuc: '2026-09-14T01:00:00Z' },
    ])
    // Danh sách trường: lớp L1 (40 em) + lớp khác (không được lọt vào lượt hai).
    danhSachEm.mockResolvedValue([...LOP.map((sbd) => ({ sbd, namSinh: '2009', lop: 'L1' })), ...Array.from({ length: 30 }, (_, i) => ({ sbd: String(13000 + i), namSinh: '2009', lop: 'L2' }))])
    banDoSaiCa.mockResolvedValue({ cu: { sai: SAI, lam: LAM } })
    hoSoOnCa.mockImplementation(traHoSo)
  })

  it('(a) em có mặt Y HỆT lời gọi không có lớp; (b) 15 em vắng có đề sẵn kèm câu hỏi lại của chính mình', async () => {
    const khong = await dungDeRiengChoCa('u', 'm', 'moi', CO_MAT, CAU_HINH_DE_RIENG_MAC_DINH, { ngayCa: NGAY_CA })
    const co = await dungDeRiengChoCa('u', 'm', 'moi', CO_MAT, CAU_HINH_DE_RIENG_MAC_DINH, { ngayCa: NGAY_CA, lopCa: 'L1' })
    for (const s of CO_MAT) {
      expect(co.boTheoEm[s]).toEqual(khong.boTheoEm[s])
      expect(co.lapTheoEm[s]).toEqual(khong.lapTheoEm[s])
    }
    expect(Object.keys(khong.boTheoEm).sort()).toEqual(CO_MAT)
    expect(Object.keys(co.boTheoEm).sort()).toEqual(LOP)
    expect(co.vang.dsSbd).toEqual(VANG)
    for (const s of VANG) {
      expect(co.boTheoEm[s]).toHaveLength(14)
      expect(co.lapTheoEm[s]!.length).toBe(3)
      for (const q of co.cauGocTheoEm![s]!) expect(SAI[s]).toContain(q)
      // `lapCua` (số lần sai từng câu lặp) cũng phải có cho em vắng — báo cáo của em vào muộn đọc ở đó.
      expect(Object.keys(co.lapCua[s] ?? {}).length).toBeGreaterThan(0)
    }
  })

  it('em vắng KHÔNG vào con số nào của biên bản; biên bản thêm ĐÚNG MỘT dòng tin', async () => {
    const khong = await dungDeRiengChoCa('u', 'm', 'moi', CO_MAT, CAU_HINH_DE_RIENG_MAC_DINH, { ngayCa: NGAY_CA })
    const co = await dungDeRiengChoCa('u', 'm', 'moi', CO_MAT, CAU_HINH_DE_RIENG_MAC_DINH, { ngayCa: NGAY_CA, lopCa: 'L1' })
    for (const k of ['canCua', 'soLapCua', 'saiCaTruocCua', 'tuCaCua', 'thieu', 'trungBinh', 'cauNoiThem', 'noiCam', 'daKhacPhucTheoEm', 'hoSoOn'] as const) {
      expect(co[k], k).toEqual(khong[k])
    }
    expect(Object.keys(co.canCua).sort()).toEqual(CO_MAT)
    const dongVang = co.ghiChu.filter((g) => g.loi.includes('chưa vào phòng chờ'))
    expect(dongVang).toEqual([{ loai: 'tin', loi: '15 em chưa vào phòng chờ đã được chuẩn bị đề sẵn' }])
    expect(khong.ghiChu).toContainEqual({ loai: 'tin', loi: 'ca không ghi lớp — em vào muộn rút theo luật thường (không chuẩn bị đề sẵn)' })
    expect(khong.vang.dsSbd).toEqual([])
  })

  it('đúng MỘT lượt hoSoOnCa thêm cho 15 em vắng; em lớp khác không lọt vào', async () => {
    await dungDeRiengChoCa('u', 'm', 'moi', CO_MAT, CAU_HINH_DE_RIENG_MAC_DINH, { ngayCa: NGAY_CA, lopCa: 'L1' })
    const lo = hoSoOnCa.mock.calls.map((c) => c[2] as string[])
    expect(lo.map((x) => x.length).sort((a, b) => a - b)).toEqual([5, 15, 20])
    expect(lo.find((x) => x.length === 15)).toEqual(VANG)
    expect(lo.flat().some((s) => s.startsWith('13'))).toBe(false)
  })

  it('(d) lượt hồ sơ của em VẮNG hỏng ⇒ em có mặt không đổi một qid, em vắng vẫn có đề (luật cũ), biên bản cảnh báo', async () => {
    const tot = await dungDeRiengChoCa('u', 'm', 'moi', CO_MAT, CAU_HINH_DE_RIENG_MAC_DINH, { ngayCa: NGAY_CA, lopCa: 'L1' })
    hoSoOnCa.mockImplementation(async (u: string, m: string, lo: string[]) => {
      if (lo.includes(VANG[0]!)) throw new Error('mất mạng')
      return traHoSo(u, m, lo)
    })
    const hong = await dungDeRiengChoCa('u', 'm', 'moi', CO_MAT, CAU_HINH_DE_RIENG_MAC_DINH, { ngayCa: NGAY_CA, lopCa: 'L1' })
    for (const s of CO_MAT) expect(hong.boTheoEm[s]).toEqual(tot.boTheoEm[s])
    expect(hong.hoSoOn).toEqual(tot.hoSoOn)
    expect(hong.vang.coHoSo).toBe(false)
    for (const s of VANG) expect(hong.boTheoEm[s]).toHaveLength(14)
    expect(hong.ghiChu.some((g) => g.loai === 'canh_bao' && g.loi.includes('15 em chưa vào phòng chờ không đọc được'))).toBe(true)
  })

  it('ngược lại: lượt hồ sơ của em CÓ MẶT hỏng không kéo em vắng theo', async () => {
    hoSoOnCa.mockImplementation(async (u: string, m: string, lo: string[]) => {
      if (lo.includes(CO_MAT[0]!) || lo.includes(CO_MAT[24]!)) throw new Error('mất mạng')
      return traHoSo(u, m, lo)
    })
    const ra = await dungDeRiengChoCa('u', 'm', 'moi', CO_MAT, CAU_HINH_DE_RIENG_MAC_DINH, { ngayCa: NGAY_CA, lopCa: 'L1' })
    expect(ra.hoSoOn.coHoSo).toBe(false)
    expect(ra.vang.coHoSo).toBe(true)
  })

  it('câu em vắng từng sai nằm NGOÀI kho ca: nối bằng một lượt noiKhoCa RIÊNG, sau lượt của em có mặt', async () => {
    const ngoai = Array.from({ length: 7 }, (_, j) => `X-${j}`)
    const saiMoi = { ...SAI, [VANG[0]!]: ngoai }
    banDoSaiCa.mockResolvedValue({ cu: { sai: saiMoi, lam: { ...LAM, [VANG[0]!]: ngoai } } })
    loadExamSources.mockResolvedValue([{ maDe: 'X', phanI: ngoai.map(mcq), phanII: [], phanIII: [] }])
    const ra = await dungDeRiengChoCa('u', 'm', 'moi', CO_MAT, CAU_HINH_DE_RIENG_MAC_DINH, { ngayCa: NGAY_CA, lopCa: 'L1' })
    expect(noiKhoCa).toHaveBeenCalledTimes(1)
    expect(ra.cauNoiThem.soCau).toBe(0) // con số của em có mặt không đổi
    expect(ra.vang.soCauNoiThem).toBe(7)
    expect(ra.lapTheoEm[VANG[0]!]!.length).toBe(3)
    for (const q of ra.cauGocTheoEm![VANG[0]!]!) expect(ngoai).toContain(q)
    // Câu nối cho em vắng KHÔNG lọt vào đề của em có mặt (kho phần câu mới là kho lượt một).
    for (const s of CO_MAT) for (const q of ra.boTheoEm[s]!) expect(q.startsWith('X-')).toBe(false)
  })

  it('lượt noiKhoCa của em vắng HỎNG ⇒ vẫn Bắt đầu được, em vắng đó bỏ câu ngoài kho, biên bản cảnh báo', async () => {
    const ngoai = Array.from({ length: 7 }, (_, j) => `X-${j}`)
    banDoSaiCa.mockResolvedValue({ cu: { sai: { ...SAI, [VANG[0]!]: ngoai }, lam: { ...LAM, [VANG[0]!]: ngoai } } })
    loadExamSources.mockResolvedValue([{ maDe: 'X', phanI: ngoai.map(mcq), phanII: [], phanIII: [] }])
    noiKhoCa.mockRejectedValue(new Error('ca đã bắt đầu'))
    const ra = await dungDeRiengChoCa('u', 'm', 'moi', CO_MAT, CAU_HINH_DE_RIENG_MAC_DINH, { ngayCa: NGAY_CA, lopCa: 'L1' })
    expect(ra.boTheoEm[VANG[0]!]).toHaveLength(14)
    expect(ra.lapTheoEm[VANG[0]!]).toEqual([])
    expect(ra.vang.soCauNoiThem).toBe(0)
    expect(ra.lapTheoEm[VANG[1]!]!.length).toBe(3) // em vắng khác không bị ảnh hưởng
    expect(ra.ghiChu.some((g) => g.loai === 'canh_bao' && g.loi.includes('không nối được câu em vắng'))).toBe(true)
  })

  it('không đọc được danh sách lớp ⇒ không có lượt hai, em có mặt vẫn y hệt, biên bản cảnh báo — Bắt đầu KHÔNG hỏng', async () => {
    const khong = await dungDeRiengChoCa('u', 'm', 'moi', CO_MAT, CAU_HINH_DE_RIENG_MAC_DINH, { ngayCa: NGAY_CA })
    // Hỏng MỌI lời gọi danh sách: `docCacCaTruoc` tự lùi về năm sinh trong tên ca ("2009 - …"),
    // nên các ca quét được không đổi và phép so với `khong` là so đúng.
    danhSachEm.mockRejectedValue(new Error('hỏng'))
    const ra = await dungDeRiengChoCa('u', 'm', 'moi', CO_MAT, CAU_HINH_DE_RIENG_MAC_DINH, { ngayCa: NGAY_CA, lopCa: 'L1' })
    expect(ra.vang.dsSbd).toEqual([])
    expect(Object.keys(ra.boTheoEm).sort()).toEqual(CO_MAT)
    for (const s of CO_MAT) expect(ra.boTheoEm[s]).toEqual(khong.boTheoEm[s])
    expect(ra.ghiChu).toContainEqual({ loai: 'canh_bao', loi: 'không đọc được danh sách lớp — em vào muộn rút theo luật thường, không có câu hỏi lại' })
    expect(ra.ghiChu.some((g) => g.loi.includes('chưa vào phòng chờ đã được chuẩn bị'))).toBe(false)
  })

  it('cả lớp đã ở phòng chờ ⇒ không lượt hoSoOnCa thừa, không dòng nào về em vắng', async () => {
    const ra = await dungDeRiengChoCa('u', 'm', 'moi', LOP, CAU_HINH_DE_RIENG_MAC_DINH, { ngayCa: NGAY_CA, lopCa: 'L1' })
    expect(hoSoOnCa.mock.calls.map((c) => (c[2] as string[]).length)).toEqual([20, 20])
    expect(ra.vang.dsSbd).toEqual([])
    expect(ra.ghiChu.some((g) => g.loi.includes('chưa vào phòng chờ'))).toBe(false)
  })
})

// ===========================================================================
describe('5. THỜI GIAN và TẤT ĐỊNH', () => {
  it('lớp 40 em (25 có mặt): lượt một + lượt hai không chậm hơn riêng lượt một quá 1,5 lần', () => {
    const { y, vang } = lop40(300)
    const hoSoVang = Object.fromEntries(vang.map((s) => [s, hoSo({ lam: y.uv.I.slice(100, 130).map((c) => c.id) })]))
    // Lấy lần NHANH NHẤT trong 3: đo giá thuật toán, không đo máy đang bận tới đâu.
    let mot = Infinity
    let caHai = Infinity
    for (let lan = 0; lan < 3; lan++) {
      let t = performance.now()
      dungDeRieng(y)
      mot = Math.min(mot, performance.now() - t)
      t = performance.now()
      const ra = dungDeRieng(y)
      dungDeRiengLuotHai({ y, luotMot: ra, dsSbdVang: vang, hoSoVang })
      caHai = Math.min(caHai, performance.now() - t)
    }
    console.log(`THỜI GIAN 40 em (25 có mặt + 15 vắng), kho 300/40/60, đề 18-4-6: chỉ lượt một ${mot.toFixed(1)} ms · cả hai lượt ${caHai.toFixed(1)} ms · tỉ lệ ${(caHai / mot).toFixed(2)}`)
    expect(caHai).toBeLessThanOrEqual(mot * 1.5)
  }, HAN_NANG)

  it('chạy hai lần cùng đầu vào → cùng JSON; đổi thứ tự em vắng thì chỉ là đầu vào khác, không ngẫu nhiên', () => {
    const { y, vang } = lop40(120)
    const ra = dungDeRieng(y)
    const a = dungDeRiengLuotHai({ y, luotMot: ra, dsSbdVang: vang, hoSoVang: {} })
    const b = dungDeRiengLuotHai({ y, luotMot: dungDeRieng(y), dsSbdVang: [...vang], hoSoVang: {} })
    expect(JSON.stringify(b)).toBe(JSON.stringify(a))
  })

  it('lớp giả ngẫu nhiên (kho mỏng, có ba_ca, ca 14 câu): em vắng luôn đủ câu như em có mặt, không trùng câu trong đề', () => {
    for (let c = 0; c < 12; c++) {
      const day = lopGia(c)
      const cat = Math.max(1, Math.floor(day.dsSbd.length * 0.6))
      const y: YeuCauDeRieng = { ...day, dsSbd: day.dsSbd.slice(0, cat), hoSo: {}, ngayCa: NGAY_CA }
      const vang = day.dsSbd.slice(cat)
      const ra = dungDeRieng(y)
      const hai = dungDeRiengLuotHai({ y, luotMot: ra, dsSbdVang: vang, hoSoVang: {} })
      const canTong = PHAN_DE.reduce((t, p) => t + Math.min(y.yc.soCau[p], y.uv[p].length), 0)
      for (const s of vang) {
        expect(hai.boTheoEm[s]!.length, `lớp ${c} em ${s}`).toBe(canTong)
        expect(new Set(hai.boTheoEm[s]).size).toBe(canTong)
        for (const q of hai.lapTheoEm[s]!) expect(hai.boTheoEm[s]).toContain(q)
      }
    }
  }, HAN_NANG)

  it('lõi lượt hai không dùng Math.random, không đọc đồng hồ', () => {
    const DUNG = fs.readFileSync(path.join(process.cwd(), 'src/lib/de-rieng.ts'), 'utf8')
    const than = DUNG.slice(DUNG.indexOf('export function dungDeRiengLuotHai('), DUNG.indexOf('/** VỊ TRÍ CÂU LẶP TRONG ĐỀ CỦA MỘT EM'))
    expect(than.length).toBeGreaterThan(2000)
    expect(than).not.toContain('Math.random(')
    expect(than).not.toContain('Date.now(')
    expect(than).not.toContain('new Date(')
  })
})

// ===========================================================================
describe('6. MÀN CA THI — truyền lớp của ca, in ghi chú biên bản', () => {
  const MAN = fs.readFileSync(path.join(process.cwd(), 'src/screens/ExamMonitorScreen.tsx'), 'utf8')
  const DB = fs.readFileSync(path.join(process.cwd(), 'src/lib/exam-db.ts'), 'utf8')

  it('nhánh đề riêng: dsCho vẫn CHỈ là phòng chờ; lớp của ca đi vào tuỳ chọn, không gộp vào dsCho', () => {
    const than = MAN.slice(MAN.indexOf('const batDauCaNay = async () => {'), MAN.indexOf('/** HUỶ CA ĐANG CHỜ'))
    const nhanh = than.slice(than.indexOf('if (caCanDeRieng) {'), than.indexOf('// CHẶN TRẦN TRÙNG CÂU'))
    expect(nhanh).toContain('const dsCho = (chiTiet.dsCho ?? []).map((x) => x.sbd).filter(Boolean)')
    expect(nhanh).toContain('{ lopCa: chiTiet.ca.lop })')
    expect(nhanh).toContain('ghiChu: ra.ghiChu,')
    expect(nhanh).not.toContain('danhSachEm(')
  })

  it('biên bản: `ghiChu` là trường TUỲ CHỌN, cảnh báo in cam, tin in màu thường, biên bản cũ không in gì', () => {
    expect(DB).toContain("ghiChu?: { loai: 'tin' | 'canh_bao'; loi: string }[]")
    expect(MAN).toContain('{(bb.ghiChu ?? []).map((g, i) => (')
    expect(MAN).toContain("color: g.loai === 'canh_bao' ? 'var(--cam)' : 'var(--nhat)'")
    // Dòng "Ca không đọc được" giữ nguyên cho đúng việc của nó.
    expect(MAN).toContain('Ca không đọc được: {bb.boQua.map((b) => `${b.maCa} (${b.vi_sao})`).join(')
  })
})
