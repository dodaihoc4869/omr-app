// CẤM RÚT CÂU TỰ LUẬN ở MÁY THẦY (Code 1, 21/09/2026; `prompt-cam-rut-tu-luan.md`): bộ lọc màn Mở ca (`loc-tu-luan-mo-ca.ts`), kho rộng đề riêng (`de-rieng-blueprint.ts`), mã trận 2026
// (`ma-tran-hoa-2026.ts`), bù kho (`de-rieng-nguon.ts chonCauBuKho`), giao BTVN nâng đỡ (`btvn-nang-do-thay.ts taoCauGiao`). Các chỗ rút đi qua `hopLeDeRut` (Code 2) đã lọc từ `77b40a8`.
// Khoá: câu tự luận KHÔNG vào bộ; đề thầy tự chọn nguyên tờ (không bị cắt) giữ nguyên; Gọi lên bảng không đi qua các hàm này.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import type { TeacherExamSource } from '../src/data/examContent'
import { chuBaoBoTuLuan, laCauTuLuan } from '../src/lib/cau-tu-luan'
import { locTuLuanKhiMoCa, SO_CAU_MAC_DINH_MOI_EM } from '../src/lib/loc-tu-luan-mo-ca'
import { sinhBoTheoEm } from '../src/lib/de-rieng-blueprint'
import { MA_TRAN_HOA_2026, rutDeChuan2026, SO_CAU_CHUAN_2026 } from '../src/lib/ma-tran-hoa-2026'
import { chonCauBuKho } from '../src/lib/de-rieng-nguon'
import { taoCauGiao } from '../src/lib/btvn-nang-do-thay'

const SACCHAROSE = 'Theo em, có thể dùng phương pháp nào để tách saccharose ra khỏi hỗn hợp với muối ăn?'

// ───────────────────────── câu mẫu (khuôn TeacherExamSource) ─────────────────────────
type Cau = Record<string, unknown> & { id: string }
const mcq = (id: string, o: Record<string, unknown> = {}): Cau => ({ id, text: 'Chất nào là este?', choices: ['Etyl axetat', 'Metyl axetat', 'Etyl fomat', 'Metyl fomat'], correct: 'A', mucDo: 'biet', chuyenDe: 'Este', ...o })
const tf = (id: string, o: Record<string, unknown> = {}): Cau => ({ id, text: 'Cho este X.', ideas: ['a', 'b', 'c', 'd'], correct: ['D', 'S', 'S', 'D'], mucDo: 'hieu', chuyenDe: 'Este', ...o })
const sa = (id: string, o: Record<string, unknown> = {}): Cau => ({ id, text: 'Tính số mol khí.', correct: '0,5', mucDo: 'hieu', chuyenDe: 'Este', ...o })
// câu TỰ LUẬN theo từng luật
const mcqThieuPa = (id: string) => mcq(id, { choices: ['a', 'b'] })
const tfThieuY = (id: string) => tf(id, { ideas: ['a', 'b', 'c'] })
const saHoiMo = (id: string) => sa(id, { text: SACCHAROSE, correct: 'kết tinh lại' })
const saDaiChu = (id: string) => sa(id, { text: 'Nêu cách nhận biết.', correct: 'Cho tác dụng với dung dịch brom rồi quan sát' })
const nguon = (maDe: string, I: Cau[], II: Cau[], III: Cau[], o: Record<string, unknown> = {}): TeacherExamSource => ({ maDe, phanI: I, phanII: II, phanIII: III, ...o }) as unknown as TeacherExamSource
const ids = (x: TeacherExamSource[]) => x.flatMap((s) => [...s.phanI, ...s.phanII, ...s.phanIII].map((q) => q.id))

describe('chuẩn bị: các câu mẫu đúng là rút được / tự luận', () => {
  it('mcq/tf/sa hợp lệ ⇒ rút được; bốn câu tự luận ⇒ bị bắt', () => {
    for (const [p, c] of [['I', mcq('a')], ['II', tf('b')], ['III', sa('c')]] as const) expect(laCauTuLuan(c, p), c.id).toBe(false)
    expect(laCauTuLuan(mcqThieuPa('a'), 'I')).toBe(true)
    expect(laCauTuLuan(tfThieuY('b'), 'II')).toBe(true)
    expect(laCauTuLuan(saHoiMo('c'), 'III')).toBe(true)
    expect(laCauTuLuan(saDaiChu('d'), 'III')).toBe(true)
  })
})

// ───────────────────────── màn Mở ca ─────────────────────────
describe('locTuLuanKhiMoCa (màn Mở ca)', () => {
  const de = () => [nguon('DE1', [mcq('DE1-I-1'), mcqThieuPa('DE1-I-2'), mcq('DE1-I-3')], [tf('DE1-II-1'), tfThieuY('DE1-II-2')], [sa('DE1-III-1'), saHoiMo('DE1-III-2'), saDaiChu('DE1-III-3')], { nhom: '12A1' })]

  it("chế độ 'luon' (kho rộng để app rút cho từng em): bỏ MỌI câu tự luận ở cả ba phần, đếm đúng, giữ nguyên trường khác", () => {
    const vao = de()
    const r = locTuLuanKhiMoCa(vao, undefined, 'luon')
    expect(ids(r.nguon)).toEqual(['DE1-I-1', 'DE1-I-3', 'DE1-II-1', 'DE1-III-1'])
    expect(r.soBo).toBe(4)
    expect(r.soBoTheoPhan).toEqual({ I: 1, II: 1, III: 2 })
    expect(r.nguon[0].maDe).toBe('DE1')
    expect((r.nguon[0] as { nhom?: string }).nhom).toBe('12A1')
    expect(ids(vao)).toHaveLength(8) // không sửa đầu vào
  })
  it("'luon' không có câu tự luận ⇒ trả CHÍNH mảng vào (không tạo bản sao), soBo 0", () => {
    const sach = [nguon('D', [mcq('D-I-1')], [tf('D-II-1')], [sa('D-III-1')])]
    const r = locTuLuanKhiMoCa(sach, undefined, 'luon')
    expect(r.nguon).toBe(sach)
    expect(r.soBo).toBe(0)
  })
  it("'khi_co_cat' (thầy chọn nguyên tờ): phần VỪA ĐỦ số câu mỗi em (không cắt) ⇒ GIỮ NGUYÊN kể cả câu tự luận — đề thầy tự chọn", () => {
    // mỗi em cần I=3, II=2, III=3 ⇒ đúng bằng số câu của tờ ⇒ không cắt ⇒ không lọc
    const vao = de()
    const r = locTuLuanKhiMoCa(vao, { I: 3, II: 2, III: 3 }, 'khi_co_cat')
    expect(r.nguon).toBe(vao)
    expect(r.soBo).toBe(0)
  })
  it("'khi_co_cat': phần có CẮT NGẪU NHIÊN (nhiều câu hơn số cần) bị lọc, phần vừa đủ giữ nguyên — từng phần độc lập", () => {
    const vao = de()
    const r = locTuLuanKhiMoCa(vao, { I: 2, II: 2, III: 3 }, 'khi_co_cat') // phần I 3 > 2 ⇒ lọc; II 2 = 2 ⇒ giữ; III 3 = 3 ⇒ giữ
    expect(ids(r.nguon)).toEqual(['DE1-I-1', 'DE1-I-3', 'DE1-II-1', 'DE1-II-2', 'DE1-III-1', 'DE1-III-2', 'DE1-III-3'])
    expect(r.soBoTheoPhan).toEqual({ I: 1, II: 0, III: 0 })
  })
  it("'khi_co_cat' không ghi số câu ⇒ dùng luật 18/4/6 cũ: tờ 28 câu vừa đủ giữ nguyên; thêm một câu ⇒ có cắt ⇒ lọc", () => {
    expect(SO_CAU_MAC_DINH_MOI_EM).toEqual({ I: 18, II: 4, III: 6 })
    const vua = [nguon('K', Array.from({ length: 18 }, (_, i) => mcq(`K-I-${i}`)), Array.from({ length: 4 }, (_, i) => tf(`K-II-${i}`)), [...Array.from({ length: 5 }, (_, i) => sa(`K-III-${i}`)), saHoiMo('K-III-9')])]
    const r1 = locTuLuanKhiMoCa(vua, undefined, 'khi_co_cat')
    expect(r1.nguon).toBe(vua) // 18/4/6 đúng bằng cần ⇒ nguyên tờ
    const thua = [nguon('K', vua[0].phanI, vua[0].phanII, [...vua[0].phanIII, sa('K-III-10')])] // 7 câu III > 6 ⇒ cắt
    const r2 = locTuLuanKhiMoCa(thua, undefined, 'khi_co_cat')
    expect(r2.soBoTheoPhan).toEqual({ I: 0, II: 0, III: 1 })
    expect(r2.nguon[0].phanIII.map((q) => q.id)).toEqual(['K-III-0', 'K-III-1', 'K-III-2', 'K-III-3', 'K-III-4', 'K-III-10'])
  })
  it("'khi_co_cat' cộng số câu của NHIỀU tờ (kho gộp) khi so với số cần", () => {
    const a = nguon('A', [], [], [sa('A-III-1'), saHoiMo('A-III-2')])
    const b = nguon('B', [], [], [sa('B-III-1'), sa('B-III-2')])
    expect(locTuLuanKhiMoCa([a, b], { I: 0, II: 0, III: 4 }, 'khi_co_cat').soBo).toBe(0) // 4 câu = 4 cần ⇒ nguyên
    expect(locTuLuanKhiMoCa([a, b], { I: 0, II: 0, III: 3 }, 'khi_co_cat').soBo).toBe(1) // 4 > 3 ⇒ cắt ⇒ lọc
  })
  it('chữ báo thầy khớp số đếm', () => {
    expect(chuBaoBoTuLuan(locTuLuanKhiMoCa(de(), undefined, 'luon').soBo)).toBe('Đã bỏ 4 câu tự luận (chỉ rút câu trắc nghiệm, đúng sai, trả lời ngắn)')
  })
  it('ExamSetupScreen chỉ chọn chế độ lọc ĐÚNG: luôn lọc khi mã trận 2026 / đề riêng / đã bấm Rút đề; còn lại chỉ khi có cắt ngẫu nhiên', () => {
    const ma = readFileSync('src/screens/ExamSetupScreen.tsx', 'utf8')
    expect(ma).toContain("locTuLuanKhiMoCa(nguonTruocLoc, soCauCuoi, chuan2026 || deRiengBat || boRut ? 'luon' : 'khi_co_cat')")
    expect(ma).toContain('const nguonCuoi = locTuLuan.nguon')
    // bộ lọc chạy TRƯỚC khi dựng gói đề đẩy lên máy chủ
    expect(ma.indexOf('locTuLuanKhiMoCa(nguonTruocLoc')).toBeLessThan(ma.indexOf('mergeAndStrip(nguonCuoi, soCauCuoi)'))
    expect(ma).toContain('chuBaoBoTuLuan(locTuLuan.soBo)')
  })
})

// ───────────────────────── đề riêng: kho rộng ─────────────────────────
describe('sinhBoTheoEm (đề riêng): câu tự luận không bao giờ vào bộ của em nào', () => {
  const kho = () => {
    const I = Array.from({ length: 30 }, (_, i) => mcq(`X-I-${i}`, { chuyenDe: `CD${i % 3}`, mucDo: ['biet', 'hieu', 'van_dung'][i % 3] }))
    const II = Array.from({ length: 8 }, (_, i) => tf(`X-II-${i}`, { chuyenDe: `CD${i % 3}` }))
    const III = Array.from({ length: 14 }, (_, i) => sa(`X-III-${i}`, { chuyenDe: `CD${i % 3}` }))
    return { sach: nguon('X', I, II, III), ban: nguon('X', [...I, mcqThieuPa('X-I-BAN1'), mcqThieuPa('X-I-BAN2')], [...II, tfThieuY('X-II-BAN')], [...III, saHoiMo('X-III-BAN1'), saDaiChu('X-III-BAN2'), saHoiMo('X-III-BAN3')]) }
  }
  const em = Array.from({ length: 12 }, (_, i) => `2${String(i).padStart(4, '0')}`)
  const soCau = { I: 6, II: 2, III: 3 }

  it('kho lẫn 6 câu tự luận ⇒ mọi bộ theo em không có câu nào trong số đó; có cảnh báo "Đã bỏ 6 câu tự luận"', () => {
    const { ban } = kho()
    const r = sinhBoTheoEm([ban], em, soCau, 'CA-TU-LUAN')
    const tuLuan = new Set(['X-I-BAN1', 'X-I-BAN2', 'X-II-BAN', 'X-III-BAN1', 'X-III-BAN2', 'X-III-BAN3'])
    for (const [sbd, bo] of Object.entries(r.boTheoEm)) {
      expect(bo.length, sbd).toBe(11)
      for (const q of bo) expect(tuLuan.has(q), `${sbd} nhận ${q}`).toBe(false)
    }
    expect(r.canhBao.some((c: string) => c.includes(chuBaoBoTuLuan(6)))).toBe(true)
  })
  it('kho lẫn tự luận cho ĐÚNG kết quả như kho đã sạch sẵn (bỏ câu ở đầu vào, không đổi cách rút)', () => {
    const { sach, ban } = kho()
    const a = sinhBoTheoEm([sach], em, soCau, 'CA-X')
    const b = sinhBoTheoEm([ban], em, soCau, 'CA-X')
    expect(b.boTheoEm).toEqual(a.boTheoEm)
    expect(a.canhBao.some((c: string) => c.includes('tự luận'))).toBe(false)
  })
})

// ───────────────────────── mã trận 2026 ─────────────────────────
describe('rutDeChuan2026: câu tự luận không lọt vào đề chuẩn', () => {
  /** Kho Bộ đề 12 đủ ma trận + `them` câu dư mỗi ô; `tuLuan` câu tự luận trong mỗi ô (chiếm chỗ). */
  function khoChuan(them: number, tuLuan: number): TeacherExamSource[] {
    const I: Cau[] = []
    const II: Cau[] = []
    const III: Cau[] = []
    const dua = (ds: Cau[], mk: (id: string, o: Record<string, unknown>) => Cau, phan: 'I' | 'II' | 'III', muc: 'biet' | 'hieu' | 'van_dung', bo: (id: string) => Cau) => {
      const can = MA_TRAN_HOA_2026[phan][muc]
      if (can === 0) return
      // chữ đề RIÊNG từng câu (khử trùng của `rutDeChuan2026` gộp các câu giống chữ)
      for (let i = 0; i < can + them; i++) ds.push(mk(`M-${phan}-${muc}-${i}`, { mucDo: muc, loiGiaiTrangThai: 'khop', canXem: false, text: `Câu hỏi riêng số ${i} của ô ${phan}-${muc}: xét hợp chất X${i}${phan}${muc} có phản ứng tạo sản phẩm Y${i * 7 + 3}.` }))
      for (let i = 0; i < tuLuan; i++) {
        const c = bo(`M-${phan}-${muc}-TL${i}`)
        ds.push({ ...c, mucDo: muc, loiGiaiTrangThai: 'khop', canXem: false, text: `${String(c.text)} (bản ${i} ${phan}-${muc}) thí nghiệm Z${i * 11 + 5}` })
      }
    }
    for (const muc of ['biet', 'hieu', 'van_dung'] as const) {
      dua(I, mcq, 'I', muc, mcqThieuPa)
      dua(II, tf, 'II', muc, tfThieuY)
      dua(III, sa, 'III', muc, saHoiMo)
    }
    return [nguon('BD12', I, II, III, { nhom: '12 · Bộ đề' })]
  }
  it('kho đủ câu sạch + nhiều câu tự luận xen kẽ ⇒ đề chuẩn 18/4/6, không câu tự luận nào', () => {
    const de = rutDeChuan2026(khoChuan(3, 4), 'ca-1')
    const dsCau = de.flatMap((s) => [...s.phanI.map((q) => ['I', q]), ...s.phanII.map((q) => ['II', q]), ...s.phanIII.map((q) => ['III', q])] as [string, Cau][])
    expect(dsCau.filter(([p]) => p === 'I')).toHaveLength(SO_CAU_CHUAN_2026.I)
    expect(dsCau.filter(([p]) => p === 'II')).toHaveLength(SO_CAU_CHUAN_2026.II)
    expect(dsCau.filter(([p]) => p === 'III')).toHaveLength(SO_CAU_CHUAN_2026.III)
    for (const [p, q] of dsCau) {
      expect(q.id, q.id).not.toMatch(/-TL\d+$/)
      expect(laCauTuLuan(q, p as 'I' | 'II' | 'III'), q.id).toBe(false)
    }
  })
  it('nhiều seed khác nhau: không seed nào rút câu tự luận', () => {
    const kho = khoChuan(2, 3)
    for (let i = 0; i < 25; i++) for (const s of rutDeChuan2026(kho, `ca-${i}`)) expect(ids([s]).some((id) => /-TL\d+$/.test(id))).toBe(false)
  })
  it('câu tự luận KHÔNG được tính vào số câu của ô: ô chỉ đủ câu nhờ câu tự luận ⇒ báo thiếu (không lấy tự luận cho đủ)', () => {
    expect(() => rutDeChuan2026(khoChuan(0, 2), 'ca-1')).not.toThrow() // đủ câu sạch đúng bằng cần
    const kho = khoChuan(0, 2)
    kho[0].phanI = kho[0].phanI.filter((q) => q.id !== 'M-I-biet-0') // bớt một câu sạch của ô Phần I · Biết
    expect(() => rutDeChuan2026(kho, 'ca-1')).toThrow(/Phần I, Biết: cần 11, có 10/)
  })
})

// ───────────────────────── bù kho (đề riêng lượt hai / em vào muộn) ─────────────────────────
describe('chonCauBuKho', () => {
  it('lấy câu chưa có trong bộ, KHÔNG tự luận, đúng số thiếu từng phần, theo thứ tự kho', () => {
    const kho = [nguon('K', [mcqThieuPa('k1'), mcq('k2'), mcq('k3'), mcq('k4')], [tfThieuY('k5'), tf('k6')], [saHoiMo('k7'), sa('k8'), sa('k9')])]
    const r = chonCauBuKho(kho, new Set(['k3']), { I: 2, II: 5, III: 1 })
    expect(r.phanI.map((q) => q.id)).toEqual(['k2', 'k4'])
    expect(r.phanII.map((q) => q.id)).toEqual(['k6'])
    expect(r.phanIII.map((q) => q.id)).toEqual(['k8'])
  })
  it('thiếu 0 ⇒ rỗng; kho toàn tự luận ⇒ rỗng (thà thiếu câu còn hơn rút tự luận)', () => {
    const kho = [nguon('K', [mcqThieuPa('a')], [tfThieuY('b')], [saHoiMo('c'), saDaiChu('d')])]
    expect(chonCauBuKho(kho, new Set(), { I: 3, II: 3, III: 3 })).toEqual({ phanI: [], phanII: [], phanIII: [] })
    expect(chonCauBuKho([nguon('K', [mcq('x')], [], [])], new Set(), { I: 0, II: 0, III: 0 })).toEqual({ phanI: [], phanII: [], phanIII: [] })
  })
})

// ───────────────────────── giao BTVN nâng đỡ (máy thầy gửi cau[]) ─────────────────────────
describe('taoCauGiao: câu tự luận không được gửi lên máy chủ', () => {
  it('bỏ phần I thiếu phương án, phần II thiếu ý, phần III hỏi mở / đáp án chữ; giữ câu rút được', () => {
    const de = nguon('DH-12-C2-B6', [mcq('DH-12-C2-B6-I-1'), mcqThieuPa('DH-12-C2-B6-I-2')], [tf('DH-12-C2-B6-II-1'), tfThieuY('DH-12-C2-B6-II-2')], [sa('DH-12-C2-B6-III-1'), saHoiMo('DH-12-C2-B6-III-2'), saDaiChu('DH-12-C2-B6-III-3'), sa('DH-12-C2-B6-III-4', { correct: '7,5', text: 'Theo em, giá trị x là bao nhiêu?' })])
    const kq = taoCauGiao([de])
    expect(kq.map((c) => c.qid)).toEqual(['DH-12-C2-B6-I-1', 'DH-12-C2-B6-II-1', 'DH-12-C2-B6-III-1', 'DH-12-C2-B6-III-4']) // III-4: đáp án số thuần ⇒ trả lời ngắn hợp lệ
  })
})

describe('Gọi lên bảng KHÔNG đi qua các bộ lọc này (thầy tự chọn câu nào hiện câu ấy)', () => {
  it('màn Gọi lên bảng / tờ chiếu không import cau-tu-luan, loc-tu-luan-mo-ca, chonCauBuKho', () => {
    for (const f of ['src/screens/GoiLenBangScreen.tsx']) {
      const ma = readFileSync(f, 'utf8')
      expect(ma, f).not.toMatch(/cau-tu-luan|loc-tu-luan-mo-ca|chonCauBuKho|locTuLuanKhiMoCa/)
    }
  })
})
