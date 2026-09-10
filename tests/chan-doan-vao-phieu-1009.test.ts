// NỐI CHẨN ĐOÁN VÀO PHIẾU — phép kiểm cho đúng cái đường nối, không kiểm lại
// bộ chẩn (đã có `chan-doan-nguyen-nhan.test.ts` lo).
//
// Ba điều phải đúng, và cả ba đều là chỗ sai thì sai IM LẶNG:
//   ① không đủ căn cứ ⇒ KHÔNG dán nhãn, phải có dòng nói thật;
//   ② câu chẩn ra `bua_het_gio` ⇒ bộ câu chữa BỎ câu kê cho nó, và số câu bỏ
//      phải hiện ra bằng con số;
//   ③ mọi dòng chẩn đoán hiện lên phiếu đều phải kèm SỐ, không nói chung chung.
import { describe, expect, it } from 'vitest'
import { chanDoanChoPhieu } from '../src/lib/chan-doan-phieu'
import type { ChiTietCauRow } from '../src/lib/exam-api'
import type { CauLuyen } from '../src/lib/bai-tap-pdf'

function row(p: Partial<ChiTietCauRow> & { qid: string; soCau: number }): ChiTietCauRow {
  return {
    maCa: '447479',
    sbd: '12001',
    phan: 'I',
    soCau: p.soCau,
    qid: p.qid,
    chuyenDe: 'Ester',
    mucDo: 'hieu',
    giay: 30,
    dapAnChon: 'A',
    dapAnDung: 'C',
    dungSai: false,
    ...p,
  } as ChiTietCauRow
}

const cauChua = (id: string, chuaQid: string): CauLuyen =>
  ({
    id,
    text: `luyện ${id}`,
    chuaCho: { qid: chuaQid, soCau: 1, phan: 'I' as const, maDang: 'D1', bac: 1 as const },
  }) as unknown as CauLuyen

describe('KHÔNG ĐỦ CĂN CỨ THÌ KHÔNG ĐOÁN', () => {
  it('không có bảng chấm cả lớp ⇒ 0 nhãn, 0 cụm, và ĐÚNG MỘT dòng nói thật', () => {
    const rows = [row({ qid: 'q1', soCau: 1 })]
    const cau = [cauChua('c1', 'q1')]
    const kq = chanDoanChoPhieu({ rows, rowsLop: null, cau })
    expect(Object.keys(kq.theoCau)).toHaveLength(0)
    expect(kq.cum).toHaveLength(0)
    expect(kq.canhBao).toHaveLength(1)
    expect(kq.canhBao[0]).toContain('chưa có bảng chấm của cả lớp')
    // Và bộ câu KHÔNG bị đụng vào.
    expect(kq.cau).toEqual(cau)
    expect(kq.daBo).toBe(0)
  })

  it('em làm đúng hết ⇒ không chẩn gì, không cảnh báo gì', () => {
    const rows = [row({ qid: 'q1', soCau: 1, dungSai: true, dapAnChon: 'C' })]
    const kq = chanDoanChoPhieu({ rows, rowsLop: rows, cau: [] })
    expect(kq.cum).toHaveLength(0)
    expect(kq.canhBao).toHaveLength(0)
  })

  it('lớp DƯỚI 8 em ⇒ rơi về `thieu_du_lieu`, không dựng nhãn bệnh thật', () => {
    const rows = [row({ qid: 'q1', soCau: 1 })]
    // 5 em cùng làm câu đó — dưới TOI_THIEU_EM_TINH_CHUM = 8.
    const lop = Array.from({ length: 5 }, (_, i) => row({ qid: 'q1', soCau: 1, sbd: `1200${i}` }))
    const kq = chanDoanChoPhieu({ rows, rowsLop: lop, cau: [] })
    expect(kq.theoCau['q1'].benh).toBe('thieu_du_lieu')
    expect(kq.theoCau['q1'].lyDo).toContain('5 em')
  })
})

/** Dựng một ca đủ 8 em cho MỘT câu, chỉ định phương án và giây của từng em. */
function caMotCau(qid: string, soCau: number, em: { chon: string; giay: number }[], phan: 'I' | 'II' | 'III' = 'I'): ChiTietCauRow[] {
  return em.map((e, i) => row({ qid, soCau, phan, sbd: `120${String(i).padStart(2, '0')}`, dapAnChon: e.chon, giay: e.giay, dungSai: e.chon === 'C' }))
}

describe('BỪA / HẾT GIỜ — bỏ câu chữa, và nói ra bằng số', () => {
  // Câu 18/18 (cuối Phần I), em làm 3 giây trong khi lớp trung vị 40 giây,
  // phương án rải rác ⇒ đúng bốn dấu hiệu của bệnh `bua_het_gio`.
  const lop = caMotCau('q9', 18, [
    { chon: 'A', giay: 3 },
    { chon: 'B', giay: 40 },
    { chon: 'D', giay: 42 },
    { chon: 'B', giay: 38 },
    { chon: 'D', giay: 45 },
    { chon: 'A', giay: 41 },
    { chon: 'B', giay: 39 },
    { chon: 'D', giay: 44 },
  ])
  const rows = [lop[0], row({ qid: 'qx', soCau: 1, dungSai: true, dapAnChon: 'C' })]

  it('chẩn ra `bua_het_gio` và BỎ đúng câu chữa kê cho nó', () => {
    const cau = [cauChua('c1', 'q9'), cauChua('c2', 'qkhac')]
    const kq = chanDoanChoPhieu({ rows, rowsLop: [...lop, rows[1]], cau })
    expect(kq.theoCau['q9'].benh).toBe('bua_het_gio')
    expect(kq.daBo).toBe(1)
    expect(kq.cau.map((c) => c.id)).toEqual(['c2'])
  })

  it('sinh ĐÚNG MỘT cờ cho thầy, và cờ đó kèm số câu đã bỏ', () => {
    const kq = chanDoanChoPhieu({ rows, rowsLop: [...lop, rows[1]], cau: [cauChua('c1', 'q9')] })
    const coHetGio = kq.co.filter((c) => c.chu.includes('hết giờ'))
    expect(coHetGio).toHaveLength(1)
    expect(coHetGio[0].qids).toEqual(['q9'])
    expect(coHetGio[0].chu).toContain('đã bỏ 1 câu chữa')
    // Tên câu phải là tên người đọc được, không phải mã qid.
    expect(coHetGio[0].chu).toContain('câu 18 phần I')
  })

  it('cụm `bua_het_gio` báo 0 câu kê, và nói việc cần sửa là THỜI GIAN', () => {
    const kq = chanDoanChoPhieu({ rows, rowsLop: [...lop, rows[1]], cau: [cauChua('c1', 'q9')] })
    const cum = kq.cum.find((c) => c.benh === 'bua_het_gio')
    expect(cum?.soCauKe).toBe(0)
    expect(cum?.chu).toContain('phân bổ thời gian')
    expect(cum?.chu).not.toContain('câu dưới')
  })
})

describe('NHẦM KHÁI NIỆM — cụm phải kèm số và nối đúng câu chữa', () => {
  // 8 em, 7 em sai và 5 trong số đó cùng chọn B ⇒ độ chụm 5/7 ≈ 0,71 ≥ 0,35.
  // Em ta xét làm 5 giây trong khi lớp trung vị 40 ⇒ nhanh.
  const lop = caMotCau('q3', 5, [
    { chon: 'B', giay: 5 },
    { chon: 'B', giay: 40 },
    { chon: 'B', giay: 42 },
    { chon: 'B', giay: 38 },
    { chon: 'B', giay: 45 },
    { chon: 'D', giay: 41 },
    { chon: 'A', giay: 39 },
    { chon: 'C', giay: 44 },
  ])
  const rows = [lop[0]]

  it('ra `nham_khai_niem`, và dòng cụm kèm CẢ phần trăm lẫn số câu kê', () => {
    const kq = chanDoanChoPhieu({ rows, rowsLop: lop, cau: [cauChua('c1', 'q3'), cauChua('c2', 'q3')] })
    expect(kq.theoCau['q3'].benh).toBe('nham_khai_niem')
    const cum = kq.cum.find((c) => c.benh === 'nham_khai_niem')
    expect(cum?.soCauKe).toBe(2)
    expect(cum?.chu).toContain('%')
    expect(cum?.chu).toContain('2 câu dưới')
    expect(cum?.tenCau).toEqual(['câu 5 phần I'])
    expect(kq.daBo).toBe(0)
  })

  it('cờ "đáng gán nhãn mức phương án" bật đúng câu — để thầy có SỐ mà quyết', () => {
    const kq = chanDoanChoPhieu({ rows, rowsLop: lop, cau: [] })
    const co = kq.co.find((c) => c.chu.includes('TỪNG PHƯƠNG ÁN'))
    expect(co?.qids).toEqual(['q3'])
  })
})

describe('MỌI DÒNG HIỆN LÊN PHIẾU ĐỀU PHẢI KÈM SỐ', () => {
  it('không cụm nào nói chung chung — mỗi dòng có ít nhất một chữ số', () => {
    const lop = caMotCau('q3', 5, [
      { chon: 'B', giay: 5 },
      { chon: 'B', giay: 40 },
      { chon: 'B', giay: 42 },
      { chon: 'B', giay: 38 },
      { chon: 'B', giay: 45 },
      { chon: 'D', giay: 41 },
      { chon: 'A', giay: 39 },
      { chon: 'C', giay: 44 },
    ])
    const kq = chanDoanChoPhieu({ rows: [lop[0]], rowsLop: lop, cau: [cauChua('c1', 'q3')] })
    expect(kq.cum.length).toBeGreaterThan(0)
    for (const c of kq.cum) expect(c.chu).toMatch(/\d/)
  })
})

describe('CỔNG THỜI GIAN — ca thiếu giây và em rời màn', () => {
  const lopKhongGiay = caMotCau('q3', 5, [
    { chon: 'B', giay: 0 },
    { chon: 'B', giay: 0 },
    { chon: 'B', giay: 0 },
    { chon: 'B', giay: 0 },
    { chon: 'B', giay: 0 },
    { chon: 'D', giay: 0 },
    { chon: 'A', giay: 0 },
    { chon: 'C', giay: 0 },
  ])

  it('ca thiếu giây ⇒ vẫn chẩn được bằng phương án, và NÓI RÕ là không dùng tốc độ', () => {
    const kq = chanDoanChoPhieu({ rows: [lopKhongGiay[0]], rowsLop: lopKhongGiay, cau: [] })
    expect(kq.theoCau['q3'].benh).toBe('nham_khai_niem')
    expect(kq.canhBao.some((v) => v.includes('không dựa vào tốc độ'))).toBe(true)
    expect(kq.canhBao[0]).toMatch(/\d+%/)
  })

  it('em RỜI MÀN quá lâu ⇒ giây của em ấy bị bỏ, lý do nói thẳng ra', () => {
    const lop = caMotCau('q3', 5, [
      { chon: 'B', giay: 5 },
      { chon: 'B', giay: 40 },
      { chon: 'B', giay: 42 },
      { chon: 'B', giay: 38 },
      { chon: 'B', giay: 45 },
      { chon: 'D', giay: 41 },
      { chon: 'A', giay: 39 },
      { chon: 'C', giay: 44 },
    ])
    const kq = chanDoanChoPhieu({ rows: [lop[0]], rowsLop: lop, giayRoiMan: 600, cau: [] })
    expect(kq.theoCau['q3'].lyDo).toContain('rời màn 600 giây')
  })
})

describe('CUỐI BÀI TÍNH RIÊNG TỪNG PHẦN — không gộp cả đề', () => {
  // Đề thật: Phần I 18 câu, Phần II 4, Phần III 6. Câu 18 là CUỐI Phần I, nhưng
  // nếu đo "cuối bài" trên cả đề (max = 18 vì Phần II/III đánh số lại từ 1) thì
  // ngưỡng vẫn 18 — nên phải dựng ca có Phần III đánh số tới 6 và một câu Phần
  // III số 6 để hai cách tính TÁCH nhau ra:
  //   · tính riêng phần: Phần III cuối = 6 ⇒ câu 6 > 6 × 0,8 = 4,8 ⇒ CUỐI BÀI.
  //   · gộp cả đề: max = 18 ⇒ câu 6 > 14,4 là SAI ⇒ mất nhãn hết giờ.
  const lopIII = caMotCau(
    'q3c6',
    6,
    [
      { chon: 'A', giay: 3 },
      { chon: 'B', giay: 40 },
      { chon: 'D', giay: 42 },
      { chon: 'B', giay: 38 },
      { chon: 'D', giay: 45 },
      { chon: 'A', giay: 41 },
      { chon: 'B', giay: 39 },
      { chon: 'D', giay: 44 },
    ],
    'III',
  )
  // Em này còn làm cả Phần I tới câu 18 — chính chỗ làm hai cách tính lệch nhau.
  const phanI = Array.from({ length: 18 }, (_, i) => row({ qid: `qI${i + 1}`, soCau: i + 1, phan: 'I', dungSai: true, dapAnChon: 'C' }))
  const rows = [lopIII[0], ...phanI]

  it('câu 6/6 Phần III vẫn là CUỐI BÀI dù đề có Phần I tới câu 18', () => {
    const kq = chanDoanChoPhieu({ rows, rowsLop: [...lopIII, ...phanI], cau: [cauChua('c1', 'q3c6')] })
    expect(kq.theoCau['q3c6'].benh).toBe('bua_het_gio')
    expect(kq.daBo).toBe(1)
  })
})
