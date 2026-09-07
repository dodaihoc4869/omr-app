// ĐỀ RIÊNG TỪNG EM — nghiệm thu theo DE-RIENG-TUNG-EM.md mục 8.
//
// Mỗi phép kiểm ứng với một dòng trong bảng "định nghĩa hoàn thành", giữ đúng
// thứ tự bảng để đối chiếu cho nhanh.
import { describe, expect, it } from 'vitest'
import { CAU_HINH_DE_RIENG_MAC_DINH, cauHinhDeRieng, soCauLapCan } from '../src/lib/cau-hinh-de-rieng'
import { chonCauLapChoEm, demLanSai, dungDeRieng, viTriCauLap, type CaTruocDaCham } from '../src/lib/de-rieng'
import { PHAN_DE, rutDeCoBatBuoc, type CauUngVien, type PhanDe, type YeuCauRut } from '../src/lib/rut-de'
import { assignStudentQuestions } from '../src/lib/exam-assign'
import type { PublicExamBank } from '../src/data/examContent'

// --- Kho giả lập -----------------------------------------------------------
// Đủ rộng để 40 em mỗi em một bộ 20 câu mà vẫn còn câu mới.

function cau(phan: PhanDe, i: number): CauUngVien {
  return {
    phan,
    id: `${phan}-${i}`,
    maDe: 'de1',
    soGoc: i,
    chuyenDe: ['Ester – lipid', 'Carbohydrate', 'Amin', 'Polymer'][i % 4],
    mucDo: (['biet', 'hieu', 'van_dung'] as const)[i % 3],
    dang: 'chua_ro',
    text: `Câu ${phan}-${i}`,
    coHinh: false,
    canXem: false,
    sao: 0,
    lyDoSao: '',
  }
}

const UV: Record<PhanDe, CauUngVien[]> = {
  I: Array.from({ length: 120 }, (_, i) => cau('I', i)),
  II: Array.from({ length: 40 }, (_, i) => cau('II', i)),
  III: Array.from({ length: 40 }, (_, i) => cau('III', i)),
}

const YC: YeuCauRut = { soCau: { I: 15, II: 3, III: 2 }, chuyenDe: [], mucDo: [], tranhQid: [], seed: 12345 }

const DS40 = Array.from({ length: 40 }, (_, i) => `120${String(i).padStart(2, '0')}`)

/** Ca trước: mỗi em nộp và sai 8 câu (6 phần I, 1 phần II, 1 phần III).
 *
 * Câu sai TRẢI KHẮP kho phần I, không nằm gọn một khúc — ca trước cũng rút
 * ngẫu nhiên từ kho nên đời thật là như vậy; dồn câu sai vào một khúc rồi đo
 * "có dồn đầu đề không" là đo cái mình vừa tự tạo ra. */
function caDayDu(maCa: string, dsSbd: string[] = DS40, lech = 0): CaTruocDaCham {
  const daLamCua: Record<string, string[]> = {}
  const saiCua: Record<string, string[]> = {}
  dsSbd.forEach((sbd, k) => {
    const d = (k + lech) % 20
    const soI = (j: number) => (d * 7 + j * 19) % 120
    daLamCua[sbd] = [...Array.from({ length: 15 }, (_, j) => `I-${soI(j)}`), `II-${d}`, `III-${d}`]
    saiCua[sbd] = [...Array.from({ length: 6 }, (_, j) => `I-${soI(j)}`), `II-${d}`, `III-${d}`]
  })
  return { maCa, daLamCua, saiCua }
}

describe('bảng nghiệm thu mục 8', () => {
  it('ĐỦ 30% — 40 em, đề 20 câu, mỗi em ≥ 6 câu lặp', () => {
    const ra = dungDeRieng({ uv: UV, yc: YC, dsSbd: DS40, dsCa: [caDayDu('ca1')] })
    expect(ra.canLap).toBe(6)
    // 100% em, không phải "phần lớn em".
    const du = DS40.filter((s) => ra.soLapCua[s] >= 6)
    expect(du).toHaveLength(40)
    expect(ra.thieuLap).toHaveLength(0)
  })

  it('LÀM TRÒN LÊN — tổng 10 câu, tỉ lệ 0,30 ra 3 câu lặp, không phải 2', () => {
    expect(soCauLapCan(10)).toBe(3)
    expect(soCauLapCan(20)).toBe(6)
    // Kẹp trên bằng chính số câu của đề: đề 2 câu không đòi 3 câu lặp.
    expect(soCauLapCan(2)).toBe(1)
    expect(soCauLapCan(0)).toBe(0)
  })

  it('THIẾU THÌ BÁO, KHÔNG ĐỘN — em chỉ sai 2 câu thì đề có đúng 2 câu lặp', () => {
    const ca: CaTruocDaCham = {
      maCa: 'ca1',
      daLamCua: { '12000': ['I-0', 'I-1', 'I-2', 'I-3'] },
      saiCua: { '12000': ['I-0', 'I-1'] },
    }
    const ra = dungDeRieng({ uv: UV, yc: YC, dsSbd: ['12000'], dsCa: [ca] })
    expect(ra.soLapCua['12000']).toBe(2)
    expect(ra.thieuLap).toEqual([{ sbd: '12000', soLap: 2, can: 6, lyDo: 'it_cau_sai' }])
    // Và KHÔNG có câu ngẫu nhiên nào bị gắn cờ lặp: đúng hai câu em từng sai.
    const trongDe = new Set(ra.boTheoEm['12000'])
    expect(trongDe.has('I-0')).toBe(true)
    expect(trongDe.has('I-1')).toBe(true)
  })

  it('em mới vào lớp và em không nộp ca nào có LÝ DO KHÁC NHAU', () => {
    const ca: CaTruocDaCham = { maCa: 'ca1', daLamCua: { '12000': ['I-0'] }, saiCua: { '12000': [] } }
    const moi = dungDeRieng({ uv: UV, yc: YC, dsSbd: ['99999'], dsCa: [ca] })
    expect(moi.thieuLap[0].lyDo).toBe('moi_vao')
    const vang: CaTruocDaCham = { maCa: 'ca1', daLamCua: { '12001': [] }, saiCua: { '12001': [] } }
    const nghi = dungDeRieng({ uv: UV, yc: YC, dsSbd: ['12001'], dsCa: [vang] })
    expect(nghi.thieuLap[0].lyDo).toBe('khong_nop')
    const dungHet = dungDeRieng({ uv: UV, yc: YC, dsSbd: ['12000'], dsCa: [ca] })
    expect(dungHet.thieuLap[0].lyDo).toBe('dung_het')
  })

  it('LẤY ĐÚNG CA EM CÓ NỘP — em vắng ca gần nhất thì lùi tiếp một ca', () => {
    const gan: CaTruocDaCham = { maCa: 'ca-gan', daLamCua: {}, saiCua: {} }
    const xa: CaTruocDaCham = { maCa: 'ca-xa', daLamCua: { '12000': ['I-7', 'I-8'] }, saiCua: { '12000': ['I-7'] } }
    const lap = chonCauLapChoEm('12000', [gan, xa], 6, demLanSai([gan, xa]))
    expect(lap.tuCa).toBe('ca-xa')
    expect(lap.qids).toEqual(['I-7'])
  })

  it('chỉ quét ngược SO_CA_TRA_NGUOC ca, không quét cả năm', () => {
    const trong = (ma: string): CaTruocDaCham => ({ maCa: ma, daLamCua: {}, saiCua: {} })
    const xa: CaTruocDaCham = { maCa: 'ca-qua-xa', daLamCua: { '12000': ['I-1'] }, saiCua: { '12000': ['I-1'] } }
    const ds = [trong('c1'), trong('c2'), trong('c3'), xa]
    expect(CAU_HINH_DE_RIENG_MAC_DINH.SO_CA_TRA_NGUOC).toBe(3)
    expect(chonCauLapChoEm('12000', ds, 6, demLanSai(ds)).tuCa).toBe('')
  })

  it('GIỮ CẤU TRÚC PHẦN — mọi em vẫn đúng 15/3/2, câu lặp trừ vào chính phần nó', () => {
    const ra = dungDeRieng({ uv: UV, yc: YC, dsSbd: DS40, dsCa: [caDayDu('ca1')] })
    for (const sbd of DS40) {
      const qids = ra.boTheoEm[sbd]
      expect(qids.filter((q) => q.startsWith('I-'))).toHaveLength(15)
      expect(qids.filter((q) => q.startsWith('II-'))).toHaveLength(3)
      expect(qids.filter((q) => q.startsWith('III-'))).toHaveLength(2)
    }
  })

  it('phần thiếu câu lặp thì phần khác KHÔNG BÙ', () => {
    // Em sai 6 câu, TẤT CẢ đều ở phần I. Phần II và III vẫn phải là câu mới,
    // và phần I vẫn đúng 15 câu chứ không phồng lên.
    const ca: CaTruocDaCham = {
      maCa: 'ca1',
      daLamCua: { '12000': Array.from({ length: 10 }, (_, i) => `I-${i}`) },
      saiCua: { '12000': Array.from({ length: 6 }, (_, i) => `I-${i}`) },
    }
    const ra = dungDeRieng({ uv: UV, yc: YC, dsSbd: ['12000'], dsCa: [ca] })
    const qids = ra.boTheoEm['12000']
    expect(qids.filter((q) => q.startsWith('I-'))).toHaveLength(15)
    expect(qids.filter((q) => q.startsWith('II-'))).toHaveLength(3)
    expect(ra.soLapCua['12000']).toBe(6)
  })

  it('câu lặp nhiều hơn chỉ tiêu một phần thì CẮT, không đẩy đề phồng lên', () => {
    // Cần 6 câu lặp mà em sai 6 câu ĐỀU ở phần III — phần III chỉ có 2 chỗ.
    const ca: CaTruocDaCham = {
      maCa: 'ca1',
      daLamCua: { '12000': Array.from({ length: 6 }, (_, i) => `III-${i}`) },
      saiCua: { '12000': Array.from({ length: 6 }, (_, i) => `III-${i}`) },
    }
    const ra = dungDeRieng({ uv: UV, yc: YC, dsSbd: ['12000'], dsCa: [ca] })
    expect(ra.boTheoEm['12000'].filter((q) => q.startsWith('III-'))).toHaveLength(2)
    expect(ra.soLapCua['12000']).toBe(2)
    expect(ra.thieuLap[0]).toMatchObject({ sbd: '12000', soLap: 2, can: 6 })
  })

  it('KHÔNG DỒN ĐẦU ĐỀ — vị trí câu lặp không lệch về đầu quá 20% so với đều', () => {
    const ra = dungDeRieng({ uv: UV, yc: YC, dsSbd: DS40, dsCa: [caDayDu('ca1')] })
    // Đi qua ĐÚNG đường phát đề thật, không tự bịa thứ tự: `assignStudentQuestions`
    // xếp câu theo thứ tự kho, nên phải hỏi chính nó.
    const bank = {
      phanI: UV.I.map((c) => ({ id: c.id, text: c.text, choices: ['a', 'b', 'c', 'd'] })),
      phanII: UV.II.map((c) => ({ id: c.id, text: c.text, ideas: ['a', 'b', 'c', 'd'] })),
      phanIII: UV.III.map((c) => ({ id: c.id, text: c.text })),
      soCau: { I: 15, II: 3, III: 2 },
      boTheoEm: ra.boTheoEm,
    } as unknown as PublicExamBank
    const caTruoc = caDayDu('ca1')
    let tong = 0
    let dauNua = 0
    for (const sbd of DS40) {
      const asg = assignStudentQuestions(bank, 'caMoi', sbd)
      const trongDe = [...asg.phanI.map((a) => a.qid), ...asg.phanII.map((a) => a.qid), ...asg.phanIII.map((a) => a.qid)]
      const lap = new Set(caTruoc.saiCua[sbd])
      const vi = viTriCauLap(trongDe, [...lap])
      tong += vi.length
      dauNua += vi.filter((i) => i < trongDe.length / 2).length
    }
    expect(tong).toBeGreaterThan(0)
    // Rải đều thì nửa đầu chứa 50%. Cho lệch tối đa 20 điểm phần trăm.
    const tiLeDau = dauNua / tong
    expect(tiLeDau).toBeGreaterThan(0.3)
    expect(tiLeDau).toBeLessThan(0.7)
  })

  it('TRẦN LẶP — câu đã lặp 3 lần vẫn sai thì thôi lặp, có tên trong canDayLai', () => {
    const ca = (ma: string): CaTruocDaCham => ({ maCa: ma, daLamCua: { '12000': ['I-5', 'I-6'] }, saiCua: { '12000': ['I-5'] } })
    const ds = [ca('c3'), ca('c2'), ca('c1')]
    expect(demLanSai(ds)['12000']['I-5']).toBe(3)
    const ra = dungDeRieng({ uv: UV, yc: YC, dsSbd: ['12000'], dsCa: ds })
    expect(ra.boTheoEm['12000']).not.toContain('I-5')
    expect(ra.canDayLai).toEqual([{ qid: 'I-5', dsSbd: ['12000'] }])
  })

  it('MỖI EM MỘT ĐỀ THẬT — hai em không nhận trùng bộ câu', () => {
    const ra = dungDeRieng({ uv: UV, yc: YC, dsSbd: DS40, dsCa: [caDayDu('ca1')] })
    const chuoi = DS40.map((s) => [...ra.boTheoEm[s]].sort().join('|'))
    expect(new Set(chuoi).size).toBeGreaterThan(30)
  })

  it('CÙNG ĐẦU VÀO RA CÙNG ĐỀ — dựng lại để chấm lại không ra bộ khác', () => {
    const a = dungDeRieng({ uv: UV, yc: YC, dsSbd: DS40, dsCa: [caDayDu('ca1')] })
    const b = dungDeRieng({ uv: UV, yc: YC, dsSbd: DS40, dsCa: [caDayDu('ca1')] })
    expect(a.boTheoEm).toEqual(b.boTheoEm)
  })

  it('CA CŨ KHÔNG ĐỔI — `rutDe` không bật chế độ này thì không đụng gì', () => {
    // `rutDeCoBatBuoc` với bảng bắt buộc RỖNG phải ra đúng bộ của `rutDe`.
    const khong = rutDeCoBatBuoc(UV, YC, {})
    const cu = rutDeCoBatBuoc(UV, YC, { I: [], II: [], III: [] })
    expect(PHAN_DE.map((p) => khong.chon[p].map((c) => c.id))).toEqual(PHAN_DE.map((p) => cu.chon[p].map((c) => c.id)))
  })

  it('cấu hình đọc vào bị kẹp, không nhận tỉ lệ vô lý', () => {
    expect(cauHinhDeRieng({ TI_LE_CAU_LAP: 0 }).TI_LE_CAU_LAP).toBe(0.3)
    expect(cauHinhDeRieng({ TI_LE_CAU_LAP: 1.5 }).TI_LE_CAU_LAP).toBe(0.3)
    expect(cauHinhDeRieng({ TI_LE_CAU_LAP: 0.5 }).TI_LE_CAU_LAP).toBe(0.5)
    expect(cauHinhDeRieng(null)).toEqual(CAU_HINH_DE_RIENG_MAC_DINH)
  })

  it('CÂU BỎ TRỐNG KHÔNG TỰ TÍNH LÀ SAI — cờ mặc định tắt', () => {
    expect(CAU_HINH_DE_RIENG_MAC_DINH.CHO_LAP_CAU_BO_TRONG).toBe(false)
  })
})
