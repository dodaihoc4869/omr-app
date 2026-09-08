// VÁ BIÊN BẢN CŨ. Ca 638242 thật: đề 12 câu (I:8 II:2 III:2), em cần 9 câu lặp
// mà cả 8 chỗ phần I đã kín, nên câu thứ 9 không vào được. Biên bản cất lúc đó
// dán nhãn 'ngoai_kho' — sai, vì câu ấy CÓ trong kho, chỉ là hết chỗ.
import { describe, expect, it } from 'vitest'
import { lyDoDung, maCaLay, vaBienBanCu } from '../src/lib/va-bien-ban-cu'
import type { BienBanDeRieng } from '../src/lib/exam-db'

const bbCu: BienBanDeRieng = {
  canCua: { '12121212': 9 },
  soLapCua: { '12121212': 8 },
  saiCaTruocCua: { '12121212': 28 },
  thieu: [{ sbd: '12121212', soLap: 8, can: 9, soSaiCaTruoc: 28, lyDo: 'ngoai_kho' }],
  boQua: [],
  caDaQuet: ['845853'],
  lucRut: '2026-09-08T04:00:00.000Z',
  // KHÔNG có phamVi, KHÔNG có tuCaCua — đúng hình dạng bản cất trước 08/09.
}

const KHO = new Set(['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9'])
const LAP = { '12121212': ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9'] }

describe('lyDoDung', () => {
  it('CA 638242: 9 câu đều trong kho, chỉ vào được 8 ⇒ HẾT CHỖ, không phải ngoài kho', () => {
    expect(lyDoDung('ngoai_kho', 8, LAP['12121212'], KHO)).toBe('het_cho')
  })

  it('câu thật sự KHÔNG có trong kho thì giữ nguyên nhãn ngoài kho', () => {
    expect(lyDoDung('ngoai_kho', 8, ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'zz'], KHO)).toBe('ngoai_kho')
  })

  it('lý do KHÔNG dính tới kho thì không đụng vào', () => {
    for (const l of ['moi_vao', 'dung_het', 'khong_nop', 'it_cau_sai', 'het_cho']) {
      expect(lyDoDung(l, 0, LAP['12121212'], KHO)).toBe(l)
    }
  })

  it('thiếu dữ kiện (chưa mở kho, hoặc không có danh sách câu) thì KHÔNG đoán', () => {
    expect(lyDoDung('ngoai_kho', 8, LAP['12121212'], null)).toBe('ngoai_kho')
    expect(lyDoDung('ngoai_kho', 8, null, KHO)).toBe('ngoai_kho')
  })
})

describe('vaBienBanCu', () => {
  it('điền phạm vi từ bản ghi ca khi biên bản cũ không có', () => {
    expect(vaBienBanCu(bbCu, { phamViCa: 'ba_ca' }).phamVi).toBe('ba_ca')
  })

  it('biên bản ĐÃ có phạm vi thì bản ghi ca không được đè lên', () => {
    const co = { ...bbCu, phamVi: 'gan_nhat' as const }
    expect(vaBienBanCu(co, { phamViCa: 'ba_ca' }).phamVi).toBe('gan_nhat')
  })

  it('vá đúng nhãn lý do của ca 638242', () => {
    const r = vaBienBanCu(bbCu, { phamViCa: 'gan_nhat', lapTheoEm: LAP, qidTrongKho: KHO })
    expect(r.thieu[0].lyDo).toBe('het_cho')
  })

  it('KHÔNG đụng bản gốc — bản đã cất là bằng chứng của lượt rút', () => {
    vaBienBanCu(bbCu, { phamViCa: 'gan_nhat', lapTheoEm: LAP, qidTrongKho: KHO })
    expect(bbCu.thieu[0].lyDo).toBe('ngoai_kho')
    expect(bbCu.phamVi).toBeUndefined()
  })

  it('giữ nguyên mọi con số — vá nhãn chứ không vá số', () => {
    const r = vaBienBanCu(bbCu, { phamViCa: 'gan_nhat', lapTheoEm: LAP, qidTrongKho: KHO })
    expect(r.canCua).toEqual(bbCu.canCua)
    expect(r.soLapCua).toEqual(bbCu.soLapCua)
    expect(r.saiCaTruocCua).toEqual(bbCu.saiCaTruocCua)
    expect(r.caDaQuet).toEqual(bbCu.caDaQuet)
    expect(r.thieu[0].soLap).toBe(8)
    expect(r.thieu[0].can).toBe(9)
  })
})

describe('maCaLay', () => {
  it('biên bản cũ KHÔNG có tuCaCua thì trả null — chỗ hiển thị phải im', () => {
    expect(maCaLay(bbCu, '12121212')).toBeNull()
  })

  it('có mã ca thì trả đúng mã', () => {
    expect(maCaLay({ ...bbCu, tuCaCua: { '12121212': '845853' } }, '12121212')).toBe('845853')
  })

  it('mã rỗng cũng là không có, không in chuỗi rỗng ra màn', () => {
    expect(maCaLay({ ...bbCu, tuCaCua: { '12121212': '' } }, '12121212')).toBeNull()
  })
})
