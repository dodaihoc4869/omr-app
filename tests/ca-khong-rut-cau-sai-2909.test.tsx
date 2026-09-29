// CA KIỂM TRA "KHÔNG RÚT CÂU SAI" — đặc tả DAC-TA-KIEM-TRA-DAU-GIO-SO-NO-2909 mục C + E.4.
//
//   1. Mở ca có nút thứ ba "Không rút câu sai"; bấm lại nút đang chọn = bỏ chọn = cùng nghĩa.
//   2. Chế độ đó: 14 câu mới, 0 câu tự luận, 0 câu trùng với MỌI ca trước của em
//      (cả đúng lẫn sai); câu song sinh (khác qid) vẫn dùng được.
//   3. Kho thiếu ⇒ lấy lại câu làm LÂU NHẤT trước, có nhãn "Đã làm ở ca kiểm tra dd/mm"
//      (gói đề ⇒ máy chủ chỉ trả phần của chính em ⇒ thẻ câu ở màn thi) + ghi chú biên bản.
//   4. "Ca gần nhất" / "3 ca ngẫu nhiên" giữ nguyên (Song sinh 50/50) — hồi quy.
//   5. Độ trùng giữa các em vẫn thấp; ngân sách thời gian rút.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { CAU_HINH_DE_RIENG_MAC_DINH, cauHinhDeRieng, docPhamViHoiLai, GIAI_THICH_PHAM_VI, MOI_PHAM_VI_HOI_LAI, TEN_PHAM_VI_HOI_LAI, type CauHinhDeRieng } from '../src/lib/cau-hinh-de-rieng'
import { cauDaGapCuaEm, dungDeRieng, dungDeRiengLuotHai, ngayNganCa, type CaTruocDaCham, type YeuCauDeRieng } from '../src/lib/de-rieng'
import { doTrung } from '../src/lib/de-rieng-tran-trung'
import { daLamLaiCuaEm, dongGoiDeRieng, moGoiDeRieng } from '../src/lib/de-rieng-goi'
import { dungUngVien, PHAN_DE, type CauUngVien, type PhanDe } from '../src/lib/rut-de'
import { laCauRutDuoc } from '../src/lib/cau-tu-luan'
import { locGoiDeRiengChoEm } from '../server/src/index'
import { cauGia, lopGia } from './_lop-gia-de-rieng'
import TheCau from '../src/components/TheCau'

const hoSoOnCa = vi.fn()
const banDoSaiCa = vi.fn()
const danhSachCa = vi.fn()
const danhSachEm = vi.fn()
const noiKhoCa = vi.fn()
const chiTietCa = vi.fn()
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
  chiTietCa: (...a: unknown[]) => chiTietCa(...a),
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
const { default: KhoiRutDe } = await import('../src/components/KhoiRutDe')

afterEach(() => cleanup())

const KHONG: CauHinhDeRieng = { ...CAU_HINH_DE_RIENG_MAC_DINH, PHAM_VI_HOI_LAI: 'khong' }
const SO_14 = { I: 9, II: 2, III: 3 }

function kho(soI: number, soII: number, soIII: number): Record<PhanDe, CauUngVien[]> {
  return {
    I: Array.from({ length: soI }, (_, i) => cauGia('I', i)),
    II: Array.from({ length: soII }, (_, i) => cauGia('II', i)),
    III: Array.from({ length: soIII }, (_, i) => cauGia('III', i)),
  }
}

/** `soCa` ca trước, mới nhất trước; mỗi em làm 14 câu mỗi ca, sai 5 câu đầu. */
function lichSu(dsSbd: string[], soCa: number, uv: Record<PhanDe, CauUngVien[]>, lech = 0): CaTruocDaCham[] {
  return Array.from({ length: soCa }, (_, c) => {
    const daLamCua: Record<string, string[]> = {}
    const saiCua: Record<string, string[]> = {}
    dsSbd.forEach((sbd, e) => {
      const lay = (p: PhanDe, n: number) => Array.from({ length: n }, (_, j) => uv[p][(e * 7 + c * 13 + j * 3 + lech) % uv[p].length]!.id)
      const lam = [...new Set([...lay('I', 9), ...lay('II', 2), ...lay('III', 3)])]
      daLamCua[sbd] = lam
      saiCua[sbd] = lam.slice(0, 5)
    })
    return { maCa: `ca${c}`, daLamCua, saiCua, ngay: `2026-09-${String(26 - c * 3).padStart(2, '0')}T01:00:00Z` }
  })
}

function yeuCau(dsSbd: string[], uv: Record<PhanDe, CauUngVien[]>, dsCa: CaTruocDaCham[], ch: CauHinhDeRieng): YeuCauDeRieng {
  return { uv, yc: { soCau: SO_14, chuyenDe: [], mucDo: [], tranhQid: [], seed: 2909 }, dsSbd, dsCa, ch }
}

const LOP = Array.from({ length: 20 }, (_, i) => String(29000 + i))

// ===========================================================================
describe('1. Cấu hình ca — lựa chọn thứ ba, chỉ-thêm', () => {
  it('ba nút đúng thứ tự, chữ mô tả riêng cho "Không rút câu sai"', () => {
    expect(MOI_PHAM_VI_HOI_LAI).toEqual(['gan_nhat', 'ba_ca', 'khong'])
    expect(TEN_PHAM_VI_HOI_LAI.khong).toBe('Không rút câu sai')
    expect(GIAI_THICH_PHAM_VI.khong).toMatch(/bỏ mọi câu em đã gặp ở các ca kiểm tra trước/)
    expect(GIAI_THICH_PHAM_VI.khong).not.toMatch(/Song sinh 50\/50/)
  })
  it('đọc phòng thủ: khong giữ nguyên; rỗng/lạ ⇒ gan_nhat như cũ', () => {
    expect(docPhamViHoiLai('khong')).toBe('khong')
    expect(docPhamViHoiLai('ba_ca')).toBe('ba_ca')
    expect(docPhamViHoiLai('')).toBe('gan_nhat')
    expect(docPhamViHoiLai(undefined)).toBe('gan_nhat')
    expect(docPhamViHoiLai('xyz')).toBe('gan_nhat')
    expect(cauHinhDeRieng({ PHAM_VI_HOI_LAI: 'khong' }).PHAM_VI_HOI_LAI).toBe('khong')
  })
})

// ===========================================================================
describe('2. E.4 — Không rút câu sai: 0 câu trùng mọi ca trước, 0 câu tự luận', () => {
  it('20 em, 4 ca trước: không em nào gặp lại câu đã làm (cả đúng lẫn sai), đủ 14 câu, không câu khắc phục', () => {
    const uv = kho(400, 80, 120)
    const dsCa = lichSu(LOP, 4, uv)
    const ra = dungDeRieng(yeuCau(LOP, uv, dsCa, KHONG))
    for (const sbd of LOP) {
      const daGap = cauDaGapCuaEm(dsCa, sbd)
      expect(daGap.size).toBeGreaterThan(20)
      expect(ra.boTheoEm[sbd]).toHaveLength(14)
      expect(ra.boTheoEm[sbd]!.filter((q) => daGap.has(q))).toEqual([])
      expect(ra.lapTheoEm[sbd]).toEqual([])
      expect(ra.songSinhTheoEm[sbd]).toEqual([])
      expect(ra.cauGocTheoEm[sbd]).toEqual([])
    }
    expect(ra.daLamLaiTheoEm).toEqual({})
    expect(ra.thieuLap).toEqual([])
    expect(ra.noiCam).toEqual([])
    expect(ra.soLapTrungBinh).toBe(0)
  })

  it('0 câu tự luận: kho có câu tự luận thì câu đó không bao giờ vào đề', () => {
    const mcq = (id: string) => ({ id, text: `Câu ${id} tính khối lượng m gam`, choices: ['1', '2', '3', '4'] as [string, string, string, string], correct: 'A' as const, chuyenDe: 'Ester' })
    const tuLuan = (id: string) => ({ id, text: `Câu ${id}: Trình bày cơ chế phản ứng`, choices: [] as unknown as [string, string, string, string], correct: '' as unknown as 'A', chuyenDe: 'Ester', kieu: 'tu_luan' })
    const nguon = [{ maDe: 'D', phanI: [...Array.from({ length: 40 }, (_, i) => mcq(`D-${i}`)), ...Array.from({ length: 10 }, (_, i) => tuLuan(`TL-${i}`))], phanII: [], phanIII: [] }]
    const uv = dungUngVien(nguon as never)
    const dsSbd = LOP.slice(0, 4)
    const dsCa: CaTruocDaCham[] = [{ maCa: 'c1', daLamCua: Object.fromEntries(dsSbd.map((s) => [s, ['D-0', 'D-1', 'D-2']])), saiCua: {} }]
    const ra = dungDeRieng({ uv, yc: { soCau: { I: 14, II: 0, III: 0 }, chuyenDe: [], mucDo: [], tranhQid: [], seed: 1 }, dsSbd, dsCa, ch: KHONG })
    const theoId = new Map(nguon[0]!.phanI.map((q) => [q.id, q]))
    for (const s of dsSbd) {
      expect(ra.boTheoEm[s]).toHaveLength(14)
      for (const q of ra.boTheoEm[s]!) {
        expect(q.startsWith('TL-')).toBe(false)
        expect(laCauRutDuoc({ ...theoId.get(q), phan: 'I' })).toBe(true)
      }
      expect(ra.boTheoEm[s]!.some((q) => ['D-0', 'D-1', 'D-2'].includes(q))).toBe(false)
    }
  })

  it('câu song sinh (cùng dạng, KHÁC qid) của câu đã gặp vẫn dùng được', () => {
    // Kho phần I: 9 câu em đã gặp + đúng 9 câu song sinh ⇒ đề phải là 9 câu song sinh.
    const goc = Array.from({ length: 9 }, (_, i) => cauGia('I', i, 'bai_tap', 'Ester'))
    const song = goc.map((c) => ({ ...c, id: `${c.id}-song-sinh` }))
    const uv = { I: [...goc, ...song], II: [], III: [] } as Record<PhanDe, CauUngVien[]>
    const sbd = '29999'
    const dsCa: CaTruocDaCham[] = [{ maCa: 'c1', daLamCua: { [sbd]: goc.map((c) => c.id) }, saiCua: { [sbd]: goc.map((c) => c.id) } }]
    const ra = dungDeRieng({ uv, yc: { soCau: { I: 9, II: 0, III: 0 }, chuyenDe: [], mucDo: [], tranhQid: [], seed: 3 }, dsSbd: [sbd], dsCa, ch: KHONG })
    expect([...ra.boTheoEm[sbd]!].sort()).toEqual(song.map((c) => c.id).sort())
    expect(ra.daLamLaiTheoEm).toEqual({})
  })

  it('độ trùng giữa các em vẫn thấp (kho đủ ⇒ đỉnh trùng mỗi phần như luật tran-trung)', () => {
    const uv = kho(400, 80, 120)
    const dsCa = lichSu(LOP, 3, uv)
    const ra = dungDeRieng(yeuCau(LOP, uv, dsCa, KHONG))
    for (const p of PHAN_DE) {
      const bo = LOP.map((s) => new Set(ra.boTheoEm[s]!.filter((q) => q.startsWith(`${p}-`))))
      expect(doTrung(bo).dinh).toBe(0)
    }
  })
})

// ===========================================================================
describe('3. Kho thiếu (hiếm) — lấy lại câu làm LÂU NHẤT trước, có nhãn ngày ca', () => {
  it('pool 12 câu, em đã gặp 8 (3 ở ca 26/09, 5 ở ca 12/09) ⇒ 4 câu mới + 5 câu của ca 12/09, nhãn "12/09"', () => {
    const uv = { I: Array.from({ length: 12 }, (_, i) => cauGia('I', i)), II: [], III: [] } as Record<PhanDe, CauUngVien[]>
    const sbd = '29001'
    const moi = ['I-0', 'I-1', 'I-2']
    const cu = ['I-3', 'I-4', 'I-5', 'I-6', 'I-7']
    const dsCa: CaTruocDaCham[] = [
      { maCa: 'moi', daLamCua: { [sbd]: moi }, saiCua: {}, ngay: '2026-09-26T02:00:00Z' },
      { maCa: 'cu', daLamCua: { [sbd]: cu }, saiCua: { [sbd]: ['I-3'] }, ngay: '2026-09-12' },
    ]
    const ra = dungDeRieng({ uv, yc: { soCau: { I: 9, II: 0, III: 0 }, chuyenDe: [], mucDo: [], tranhQid: [], seed: 5 }, dsSbd: [sbd], dsCa, ch: KHONG })
    const de = ra.boTheoEm[sbd]!
    expect(de).toHaveLength(9)
    expect(de.filter((q) => moi.includes(q))).toEqual([])
    expect(de.filter((q) => cu.includes(q)).sort()).toEqual(cu)
    expect(ra.daLamLaiTheoEm[sbd]).toEqual(Object.fromEntries(cu.map((q) => [q, '12/09'])))
    expect(ra.noiCam).toEqual([{ sbd, soNoi: 5 }])
  })

  it('ngày ca: ISO ⇒ dd/mm giờ VN; YYYY-MM-DD ⇒ dd/mm; hỏng ⇒ rỗng', () => {
    expect(ngayNganCa('2026-09-25T18:30:00Z')).toBe('26/09')
    expect(ngayNganCa('2026-09-12')).toBe('12/09')
    expect(ngayNganCa('')).toBe('')
    expect(ngayNganCa('abc')).toBe('')
  })

  it('gói đề: nhãn đi theo gói, máy chủ CHỈ trả phần của chính em, không kèm đáp án', () => {
    const goi = dongGoiDeRieng({ '1': ['a', 'b'], '2': ['c'] }, {}, {}, null, { '1': { a: '12/09' }, '2': { c: '' } })
    expect(moGoiDeRieng(JSON.parse(JSON.stringify(goi))).daLam).toEqual({ '1': { a: '12/09' }, '2': { c: '' } })
    const cua1 = locGoiDeRiengChoEm(goi as unknown as Record<string, unknown>, '1') as Record<string, unknown>
    expect(cua1.daLam).toEqual({ '1': { a: '12/09' } })
    // Gói không có nhãn (ca cũ, hai chế độ kia) ⇒ không có trường daLam — dáng cũ y nguyên.
    const cu = locGoiDeRiengChoEm({ bo: { '1': ['a'] }, lap: {}, dem: {} }, '1') as Record<string, unknown>
    expect('daLam' in cu).toBe(false)
    expect(daLamLaiCuaEm({ a: '12/09', b: 'rác', '': 'x' })).toEqual({ a: '12/09', b: '' })
    expect(daLamLaiCuaEm(null)).toEqual({})
  })

  it('màn thi: thẻ câu hiện "Đã làm ở ca kiểm tra 12/09", không lộ đáp án', () => {
    render(<TheCau cheDo="thi" phan="I" stt={1} text="Câu thử" choices={['1', '2', '3', '4']} choicePerm={[0, 1, 2, 3]} selected={null} daLamO={{ ngay: '12/09' }} />)
    const dai = document.querySelector('[data-da-lam="1"]')
    expect(dai?.textContent).toBe('Đã làm ở ca kiểm tra 12/09')
    expect(document.body.textContent).not.toMatch(/Đáp án|đúng|sai/)
  })
})

// ===========================================================================
describe('4. Hồi quy — "Ca gần nhất" / "3 ca ngẫu nhiên" giữ nguyên Song sinh 50/50', () => {
  it('cùng đầu vào: hai chế độ cũ vẫn rút câu sai (có câu khắc phục), không nhãn đã làm; khong thì 0', () => {
    const uv = kho(120, 30, 40)
    const dsCa = lichSu(LOP, 3, uv)
    for (const pv of ['gan_nhat', 'ba_ca'] as const) {
      const ra = dungDeRieng(yeuCau(LOP, uv, dsCa, { ...CAU_HINH_DE_RIENG_MAC_DINH, PHAM_VI_HOI_LAI: pv }))
      expect(Object.values(ra.lapTheoEm).reduce((t, x) => t + x.length, 0)).toBeGreaterThan(0)
      expect(ra.daLamLaiTheoEm).toEqual({})
    }
    const khong = dungDeRieng(yeuCau(LOP, uv, dsCa, KHONG))
    expect(Object.values(khong.lapTheoEm).reduce((t, x) => t + x.length, 0)).toBe(0)
  })

  // Dấu vân tay byte-từng-byte của 30 lớp giả đã khoá ở `de-rieng-ho-so-1909.test.ts`; ở đây
  // khoá thêm: cấu hình ĐỌC LẠI từ ca (docPhamViHoiLai) cho gan_nhat vẫn đúng bộ đề mặc định.
  it('lớp giả: gan_nhat đọc từ cấu hình ca cho ĐÚNG bộ đề như mặc định', () => {
    for (let c = 0; c < 4; c++) {
      const y = lopGia(c)
      const macDinh = dungDeRieng({ ...y, ch: undefined })
      const ro = dungDeRieng({ ...y, ch: cauHinhDeRieng({ PHAM_VI_HOI_LAI: 'gan_nhat' }) })
      expect(ro.boTheoEm).toEqual(macDinh.boTheoEm)
      expect(ro.daLamLaiTheoEm).toEqual({})
    }
  })
})

// ===========================================================================
describe('5. Em vắng (lượt hai) cũng không gặp lại câu cũ', () => {
  it('10 em có mặt + 5 em vắng: em vắng 0 câu đã gặp, 0 câu khắc phục', () => {
    const uv = kho(300, 60, 90)
    const coMat = LOP.slice(0, 10)
    const vang = LOP.slice(10, 15)
    const dsCa = lichSu([...coMat, ...vang], 3, uv)
    const y = yeuCau(coMat, uv, dsCa, KHONG)
    const mot = dungDeRieng(y)
    const hai = dungDeRiengLuotHai({ y, luotMot: mot, dsSbdVang: vang })
    for (const s of vang) {
      const daGap = cauDaGapCuaEm(dsCa, s)
      expect(hai.boTheoEm[s]).toHaveLength(14)
      expect(hai.boTheoEm[s]!.filter((q) => daGap.has(q))).toEqual([])
      expect(hai.lapTheoEm[s]).toEqual([])
    }
    expect(hai.daLamLaiTheoEm).toEqual({})
  })
})

// ===========================================================================
describe('6. Ngân sách thời gian rút', () => {
  it('60 em, 20 ca trước, kho 600/120/180: rút xong dưới 5 giây', () => {
    const uv = kho(600, 120, 180)
    const lop = Array.from({ length: 60 }, (_, i) => String(30000 + i))
    const dsCa = lichSu(lop, 20, uv)
    const t0 = performance.now()
    const ra = dungDeRieng(yeuCau(lop, uv, dsCa, KHONG))
    const ms = performance.now() - t0
    expect(ms).toBeLessThan(5000)
    for (const s of lop) expect(ra.boTheoEm[s]).toHaveLength(14)
  })
})

// ===========================================================================
describe('7. Tầng lấy dữ liệu — dungDeRiengChoCa chế độ khong', () => {
  const mcq = (id: string) => ({ id, text: `Câu ${id} tính khối lượng m gam`, choices: ['1', '2', '3', '4'] as [string, string, string, string], correct: 'A' as const, chuyenDe: 'Ester' })
  const LOP_CA = Array.from({ length: 6 }, (_, i) => String(12000 + i))
  beforeEach(() => {
    for (const f of [hoSoOnCa, banDoSaiCa, danhSachCa, danhSachEm, noiKhoCa, loadSessionTeacherBank, docSoCauCa, loadExamSources, chiTietCa]) f.mockReset()
    noiKhoCa.mockResolvedValue({ themBank: 0, themKey: 0 })
    docSoCauCa.mockResolvedValue({ I: 14, II: 0, III: 0 })
    danhSachCa.mockResolvedValue([
      { maCa: 'moi', tenCa: '2009 - Lớp 1', loai: 'thi', trangThai: 'dang_mo', moLuc: '2026-09-29T01:00:00Z' },
      { maCa: 'cu', tenCa: '2009 - Lớp 1', loai: 'thi', trangThai: 'da_dong', moLuc: '2026-09-26T01:00:00Z' },
    ])
    danhSachEm.mockResolvedValue(LOP_CA.map((sbd) => ({ sbd, namSinh: '2009', lop: 'L1' })))
    hoSoOnCa.mockImplementation(async (_u: string, _m: string, lo: string[]) => Object.fromEntries(lo.map((s) => [s, { tuCa: 'cu', sai: [], daKhacPhuc: [], lam: [] }])))
  })

  it('không kéo câu sai vào kho; 0 câu đã gặp; biên bản có dòng "không rút câu sai"', async () => {
    loadSessionTeacherBank.mockResolvedValue([{ maDe: 'D', phanI: Array.from({ length: 200 }, (_, i) => mcq(`D-${i}`)), phanII: [], phanIII: [] }])
    loadExamSources.mockResolvedValue([{ maDe: 'X', phanI: [mcq('NGOAI-1')], phanII: [], phanIII: [] }])
    const LAM = Object.fromEntries(LOP_CA.map((s, e) => [s, Array.from({ length: 14 }, (_, j) => `D-${(e * 14 + j) % 200}`)]))
    const SAI = Object.fromEntries(LOP_CA.map((s) => [s, ['NGOAI-1', ...LAM[s]!.slice(0, 3)]]))
    banDoSaiCa.mockResolvedValue({ cu: { sai: SAI, lam: LAM } })
    const ra = await dungDeRiengChoCa('u', 'm', 'moi', LOP_CA, KHONG, { ngayCa: '2026-09-29', lopCa: 'L1' })
    expect(noiKhoCa).not.toHaveBeenCalled()
    expect(ra.cauNoiThem.soCau).toBe(0)
    for (const s of LOP_CA) {
      expect(ra.boTheoEm[s]).toHaveLength(14)
      expect(ra.boTheoEm[s]!.filter((q) => LAM[s]!.includes(q) || q === 'NGOAI-1')).toEqual([])
      expect(ra.lapTheoEm[s]).toEqual([])
    }
    expect(ra.daLamLaiTheoEm).toEqual({})
    expect(ra.ghiChu.some((g) => /không rút câu sai/.test(g.loi))).toBe(true)
  })

  it('kho ca thiếu câu mới ⇒ bù từ kho máy thầy bằng câu CHƯA em nào gặp, trước khi phải lấy lại câu cũ', async () => {
    loadSessionTeacherBank.mockResolvedValue([{ maDe: 'D', phanI: Array.from({ length: 20 }, (_, i) => mcq(`D-${i}`)), phanII: [], phanIII: [] }])
    loadExamSources.mockResolvedValue([{ maDe: 'X', phanI: [...Array.from({ length: 20 }, (_, i) => mcq(`D-${i}`)), ...Array.from({ length: 30 }, (_, i) => mcq(`BU-${i}`))], phanII: [], phanIII: [] }])
    const LAM = Object.fromEntries(LOP_CA.map((s) => [s, Array.from({ length: 14 }, (_, j) => `D-${j}`)]))
    banDoSaiCa.mockResolvedValue({ cu: { sai: {}, lam: LAM } })
    const ra = await dungDeRiengChoCa('u', 'm', 'moi', LOP_CA, KHONG, { ngayCa: '2026-09-29', lopCa: 'L1' })
    expect(noiKhoCa).toHaveBeenCalledTimes(1)
    for (const s of LOP_CA) {
      expect(ra.boTheoEm[s]).toHaveLength(14)
      expect(ra.boTheoEm[s]!.filter((q) => LAM[s]!.includes(q))).toEqual([])
    }
    expect(ra.daLamLaiTheoEm).toEqual({})
  })

  it('kho cạn hẳn ⇒ nhãn "26/09" trên đề em + ghi chú cảnh báo cho thầy', async () => {
    loadSessionTeacherBank.mockResolvedValue([{ maDe: 'D', phanI: Array.from({ length: 16 }, (_, i) => mcq(`D-${i}`)), phanII: [], phanIII: [] }])
    loadExamSources.mockResolvedValue([])
    const LAM = Object.fromEntries(LOP_CA.map((s) => [s, Array.from({ length: 14 }, (_, j) => `D-${j}`)]))
    banDoSaiCa.mockResolvedValue({ cu: { sai: {}, lam: LAM } })
    const ra = await dungDeRiengChoCa('u', 'm', 'moi', LOP_CA, KHONG, { ngayCa: '2026-09-29', lopCa: 'L1' })
    for (const s of LOP_CA) {
      expect(ra.boTheoEm[s]).toHaveLength(14)
      const lai = ra.daLamLaiTheoEm[s]!
      expect(Object.keys(lai)).toHaveLength(12)
      expect(new Set(Object.values(lai))).toEqual(new Set(['26/09']))
    }
    const canh = ra.ghiChu.find((g) => g.loai === 'canh_bao' && /kho thiếu câu mới/.test(g.loi))
    expect(canh?.loi).toMatch(/6 em phải làm lại tổng 72 câu/)
  })
})

// ===========================================================================
describe('8. Màn Mở ca — khối chế độ đề 3 lựa chọn, bấm lại để bỏ chọn', () => {
  const mcq = (id: string) => ({ id, text: `Câu ${id} tính khối lượng m gam`, choices: ['1', '2', '3', '4'] as [string, string, string, string], correct: 'A' as const, chuyenDe: 'Ester', mucDo: 'hieu' })
  const nguon = [{ maDe: 'D', phanI: Array.from({ length: 40 }, (_, i) => mcq(`D-${i}`)), phanII: [], phanIII: [] }]

  it('ba nút; bấm lại nút đang chọn ⇒ "Không rút câu sai"; chữ mô tả đổi theo; onDoi mang phạm vi', () => {
    const onDoi = vi.fn()
    render(<KhoiRutDe nguon={nguon as never} qidCaTruoc={[]} phutLamBai={45} onDoi={onDoi} />)
    fireEvent.click(screen.getByText(/Đề riêng từng em/))
    const nut = (ten: string) => screen.getByRole('checkbox', { name: ten })
    expect(nut('Ca gần nhất').getAttribute('aria-checked')).toBe('true')
    expect(nut('3 ca ngẫu nhiên')).toBeTruthy()
    expect(nut('Không rút câu sai').getAttribute('aria-checked')).toBe('false')
    expect(screen.getByText(/Cặp đôi Song sinh \(50\/50\):/)).toBeTruthy()

    fireEvent.click(nut('Ca gần nhất'))
    expect(nut('Không rút câu sai').getAttribute('aria-checked')).toBe('true')
    expect(nut('Ca gần nhất').getAttribute('aria-checked')).toBe('false')
    expect(screen.queryByText(/Cặp đôi Song sinh \(50\/50\):/)).toBeNull()
    expect(document.querySelector('[data-che-do-cau-sai="khong"]')).toBeTruthy()
    expect(onDoi.mock.calls.at(-1)?.[0]?.phamViHoiLai).toBe('khong')

    fireEvent.click(nut('3 ca ngẫu nhiên'))
    expect(onDoi.mock.calls.at(-1)?.[0]?.phamViHoiLai).toBe('ba_ca')
    fireEvent.click(nut('3 ca ngẫu nhiên'))
    expect(onDoi.mock.calls.at(-1)?.[0]?.phamViHoiLai).toBe('khong')
    fireEvent.click(nut('Không rút câu sai'))
    expect(onDoi.mock.calls.at(-1)?.[0]?.phamViHoiLai).toBe('khong')
  })
})
