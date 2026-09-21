// BUỔI CHỮA XẾP SẴN — lõi thuần `src/lib/buoi-chua-de-xuat.ts` (Code 1, 21/09/2026; B6, Boss duyệt: giai đoạn 1 tính-khi-mở, CÓ lọc tự luận).
// Khoá: ẩn khi thiếu dữ liệu; chọn câu theo ngưỡng + điểm; tự luận / câu thiếu trong kho bị bỏ và đếm; vừa ngân sách giờ; em từ gợi ý Bộ não + em sai; tất định; đầu vào hỏng không làm sập.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { DE_XUAT_BUOI_CHUA, deXuatBuoiChua, docDauVao, type CauKho, type DauVaoDeXuat } from '../src/lib/buoi-chua-de-xuat'
import { CAU_HINH_LEN_BANG_MAC_DINH } from '../src/lib/len-bang-cau-hinh'
import { laCauRutDuoc } from '../src/lib/cau-tu-luan'
import { mulberry32 } from '../src/lib/exam-shuffle'

/** Câu trắc nghiệm hợp lệ (rút được). */
const cauI = (id: string) => ({ id, text: `Câu ${id}: ester nào sau đây thuỷ phân trong môi trường kiềm tạo muối và ancol?`, choices: ['CH3COOC2H5', 'C2H5OH', 'CH3COOH', 'C2H5Cl'], correct: 'A' })
/** Câu phần III đáp án dài nhiều từ ⇒ TỰ LUẬN (không rút được). */
const cauTuLuan = (id: string) => ({ id, text: `Câu ${id}: giải thích`, correct: 'Do có liên kết hydrogen giữa các phân tử nên nhiệt độ sôi cao' })

/** Kho mẫu: 6 dạng D0–D5 × 6 câu (phần I), qid `T-I-<số>`; thêm 2 câu tự luận ở D0 (T-III-1, T-III-2). */
function khoMau(): CauKho[] {
  const ra: CauKho[] = []
  let so = 1
  for (let d = 0; d < 6; d++)
    for (let k = 0; k < 6; k++) {
      const qid = `T-I-${so++}`
      ra.push({ qid, phan: 'I', dang: `D${d}`, sao: ((d + k) % 3) as 0 | 1 | 2, q: cauI(qid) })
    }
  ra.push({ qid: 'T-III-1', phan: 'III', dang: 'D0', sao: 2, q: cauTuLuan('T-III-1') })
  ra.push({ qid: 'T-III-2', phan: 'III', dang: 'D0', sao: 1, q: cauTuLuan('T-III-2') })
  return ra
}
const KHO = khoMau()
const qidCua = (d: number, k: number) => `T-I-${d * 6 + k + 1}`

const emSai = (...s: string[]) => s.map((sbd) => ({ sbd, hoTen: `Em ${sbd}` }))
const dauVao = (o: Partial<DauVaoDeXuat> = {}): DauVaoDeXuat => ({
  ngay: '2026-09-22',
  lop: '12A1',
  soEmCoSo: 24,
  dangYeu: [
    { ma: 'D0', ten: 'Thuỷ phân ester', soEmYeu: 9, nguon: ['ho_so', 'bo_nao'] },
    { ma: 'D1', ten: 'Xà phòng hoá', soEmYeu: 7, nguon: ['ho_so'] },
  ],
  cauSaiNhieu: [
    { qid: qidCua(0, 0), dang: 'D0', loi: true, soEmLam: 20, soEmSai: 9, emSai: emSai('a1', 'a2', 'a3') },
    { qid: qidCua(0, 1), dang: 'D0', loi: false, soEmLam: 20, soEmSai: 7, emSai: emSai('a1', 'a4') },
    { qid: qidCua(0, 2), dang: 'D0', loi: false, soEmLam: 20, soEmSai: 6, emSai: emSai('a5') },
    { qid: qidCua(1, 0), dang: 'D1', loi: true, soEmLam: 18, soEmSai: 8, emSai: emSai('b1', 'a1') },
    { qid: qidCua(2, 0), dang: 'D2', loi: false, soEmLam: 22, soEmSai: 5, emSai: emSai('c1') },
  ],
  goiY: [
    { sbd: 'g1', hoTen: 'Em g1', hanhDong: 'goi_len_bang', dang: 'D0' },
    { sbd: 'g2', hoTen: 'Em g2', hanhDong: 'dua_vao_buoi_chua', dang: 'D1' },
    { sbd: 'g3', hoTen: 'Em g3', hanhDong: 'nhan_phu_huynh', dang: 'D1' },
  ],
  ...o,
})

describe('ẨN thẻ khi không đủ để nói thật', () => {
  it('ít hơn 5 em có sổ ⇒ ẩn (it_du_lieu), không câu, không em', () => {
    const r = deXuatBuoiChua(dauVao({ soEmCoSo: 4 }), KHO)
    expect(r).toMatchObject({ co: false, lyDoAn: 'it_du_lieu', cau: [], em: [], soCau: 0, soEm: 0, phut: 0, cacLyDo: [] })
    expect(deXuatBuoiChua(dauVao({ soEmCoSo: 5 }), KHO).co).toBe(true) // đúng ngưỡng 5 thì hiện
  })
  it('không câu nào đạt ngưỡng và không dạng yếu nào có câu trong kho ⇒ ẩn (khong_co_gi) và vẫn đếm câu bỏ', () => {
    const r = deXuatBuoiChua(dauVao({ dangYeu: [], cauSaiNhieu: [{ qid: 'KHONG-CO-I-1', dang: 'D9', loi: true, soEmLam: 20, soEmSai: 10, emSai: [] }] }), KHO)
    expect(r).toMatchObject({ co: false, lyDoAn: 'khong_co_gi', boQua: { khongCoTrongKho: 1, tuLuan: 0 } })
  })
})

describe('chọn CÂU', () => {
  it('ngưỡng: ≥ 3 em sai VÀ ≥ 30 % số em làm; câu 2 em sai hoặc 25 % bị loại', () => {
    const r = deXuatBuoiChua(
      dauVao({
        dangYeu: [],
        cauSaiNhieu: [
          { qid: qidCua(3, 0), dang: 'D3', loi: false, soEmLam: 10, soEmSai: 3, emSai: [] }, // 3 em, 30 % ⇒ đạt (đúng biên)
          { qid: qidCua(3, 1), dang: 'D3', loi: false, soEmLam: 10, soEmSai: 2, emSai: [] }, // 2 em ⇒ loại
          { qid: qidCua(3, 2), dang: 'D3', loi: false, soEmLam: 20, soEmSai: 5, emSai: [] }, // 25 % ⇒ loại
          { qid: qidCua(4, 0), dang: 'D4', loi: false, soEmLam: 0, soEmSai: 0, emSai: [] }, // chưa em nào làm ⇒ loại
        ],
      }),
      KHO,
    )
    expect(r.cau.map((c) => c.qid)).toEqual([qidCua(3, 0)])
    expect(r.cau[0]).toMatchObject({ nguon: 'sai_nhieu', soEmSai: 3, soEmLam: 10, lyDo: '3/10 em làm sai' })
  })

  it('điểm: câu cốt lõi + dạng cả lớp yếu xếp trước; mỗi dạng ≤ 2 câu; tổng ≤ 10', () => {
    const r = deXuatBuoiChua(dauVao(), KHO)
    const d0 = r.cau.filter((c) => c.dang === 'D0')
    expect(d0).toHaveLength(2) // 3 câu D0 đạt ngưỡng nhưng mỗi dạng chỉ 2
    expect(d0[0].qid).toBe(qidCua(0, 0)) // lõi + tỉ lệ sai cao nhất đứng đầu
    expect(r.cau[0].loi).toBe(true)
    expect(r.cau.length).toBeLessThanOrEqual(10)
    for (const c of r.cau) expect(c.giay).toBeGreaterThan(0)
  })

  it('TỰ LUẬN bị lọc (đúng định nghĩa `cau-tu-luan.ts`) và đếm; câu thiếu trong kho bị bỏ và đếm', () => {
    expect(laCauRutDuoc(cauTuLuan('x'), 'III')).toBe(false) // đối chứng: đúng là tự luận theo định nghĩa chung
    const r = deXuatBuoiChua(
      dauVao({
        cauSaiNhieu: [
          { qid: 'T-III-1', dang: 'D0', loi: true, soEmLam: 20, soEmSai: 15, emSai: [] },
          { qid: 'T-III-2', dang: 'D0', loi: true, soEmLam: 20, soEmSai: 14, emSai: [] },
          { qid: 'CHUA-NAP-I-9', dang: 'D0', loi: true, soEmLam: 20, soEmSai: 13, emSai: [] },
          { qid: qidCua(1, 0), dang: 'D1', loi: true, soEmLam: 18, soEmSai: 8, emSai: [] },
        ],
      }),
      KHO,
    )
    expect(r.boQua).toEqual({ khongCoTrongKho: 1, tuLuan: 2 })
    expect(r.cau.map((c) => c.qid)).not.toContain('T-III-1')
    expect(r.cau.map((c) => c.qid)).not.toContain('T-III-2')
    expect(r.cau.every((c) => laCauRutDuoc(KHO.find((k) => k.qid === c.qid)!.q, KHO.find((k) => k.qid === c.qid)!.phan))).toBe(true)
  })

  it('dạng cả lớp yếu CHƯA có câu nào nhiều em sai ⇒ thêm MỘT câu của dạng ấy từ kho (không tự luận, sao cao trước), nhãn `dang_yeu`', () => {
    const r = deXuatBuoiChua(dauVao({ dangYeu: [{ ma: 'D0', ten: 'Thuỷ phân ester', soEmYeu: 9, nguon: ['ho_so'] }], cauSaiNhieu: [{ qid: qidCua(3, 0), dang: 'D3', loi: false, soEmLam: 10, soEmSai: 4, emSai: [] }] }), KHO)
    const them = r.cau.filter((c) => c.nguon === 'dang_yeu')
    expect(them).toHaveLength(1)
    expect(them[0].dang).toBe('D0')
    const goc = KHO.find((k) => k.qid === them[0].qid)!
    expect(goc.sao).toBe(Math.max(...KHO.filter((k) => k.dang === 'D0' && laCauRutDuoc(k.q, k.phan)).map((k) => k.sao)))
    expect(them[0].lyDo).toBe('Câu của dạng em đang yếu (9 em)')
    expect(them[0]).toMatchObject({ soEmSai: 0, soEmLam: 0, loi: false })
  })

  it('dạng yếu dưới 3 em bị bỏ; chỉ lấy tối đa 3 dạng; thấy ở CẢ hai nguồn xếp trước dù ít em hơn', () => {
    const dangYeu = [
      { ma: 'D0', ten: 'A', soEmYeu: 2, nguon: ['ho_so' as const] }, // 2 em ⇒ loại
      { ma: 'D1', ten: 'B', soEmYeu: 5, nguon: ['ho_so' as const] },
      { ma: 'D2', ten: 'C', soEmYeu: 4, nguon: ['ho_so' as const, 'bo_nao' as const] }, // hai nguồn ⇒ trước D1
      { ma: 'D3', ten: 'D', soEmYeu: 9, nguon: ['ho_so' as const] },
      { ma: 'D4', ten: 'E', soEmYeu: 3, nguon: ['ho_so' as const] },
    ]
    const r = deXuatBuoiChua(dauVao({ dangYeu, cauSaiNhieu: [] }), KHO)
    // không câu nào nhiều em sai ⇒ mỗi dạng yếu được lấy MỘT câu từ kho, theo thứ tự ưu tiên D2, D3, D1 (D4 bị cắt ở 3 dạng, D0 < 3 em)
    expect(r.cau.map((c) => c.dang)).toEqual(['D2', 'D3', 'D1'])
  })

  it('VỪA NGÂN SÁCH GIỜ: ngân sách 10 phút ⇒ bỏ câu điểm thấp nhất tới khi vừa, giữ tối thiểu 1 câu; tổng phút ≤ ngân sách', () => {
    const chNho = { ...CAU_HINH_LEN_BANG_MAC_DINH, NGAN_SACH_PHUT: 10 }
    const day = deXuatBuoiChua(dauVao(), KHO)
    const nho = deXuatBuoiChua(dauVao(), KHO, chNho)
    expect(nho.cau.length).toBeGreaterThanOrEqual(1)
    expect(nho.cau.length).toBeLessThan(day.cau.length)
    expect(nho.phut).toBeLessThanOrEqual(10)
    // câu giữ lại là những câu ĐIỂM CAO của bản đầy đủ (câu đầu bản đầy đủ luôn còn)
    expect(nho.cau.map((c) => c.qid)).toContain(day.cau[0].qid)
    // ngân sách 1 phút (nhỏ hơn cả hao phí): vẫn giữ 1 câu, không rỗng
    const tiHon = deXuatBuoiChua(dauVao(), KHO, { ...CAU_HINH_LEN_BANG_MAC_DINH, NGAN_SACH_PHUT: 1 })
    expect(tiHon.cau).toHaveLength(1)
    expect(tiHon.co).toBe(true)
  })
})

describe('chọn CÂU — điểm, biên và cắt (bổ sung)', () => {
  const cau = (qid: string, dang: string, o: Partial<DauVaoDeXuat['cauSaiNhieu'][number]> = {}) => ({ qid, dang, loi: false, soEmLam: 20, soEmSai: 8, emSai: [], ...o })
  const chiDau = (cauSaiNhieu: DauVaoDeXuat['cauSaiNhieu'], dangYeu: DauVaoDeXuat['dangYeu'] = []) => deXuatBuoiChua(dauVao({ cauSaiNhieu, dangYeu, goiY: [] }), KHO)

  it('điểm: CÂU CỐT LÕI xếp trước câu thường (cùng dạng không yếu, cùng số em sai)', () => {
    const r = chiDau([cau(qidCua(3, 0), 'D3'), cau(qidCua(4, 0), 'D4', { loi: true })])
    expect(r.cau.map((c) => c.qid)).toEqual([qidCua(4, 0), qidCua(3, 0)])
  })
  it('điểm: câu thuộc DẠNG CẢ LỚP YẾU xếp trước câu dạng khác (cùng lõi, cùng số em sai)', () => {
    const r = chiDau([cau(qidCua(3, 0), 'D3'), cau(qidCua(4, 0), 'D4')], [{ ma: 'D4', ten: 'Dạng 4', soEmYeu: 6, nguon: ['ho_so'] }])
    expect(r.cau.map((c) => c.qid)).toEqual([qidCua(4, 0), qidCua(3, 0)])
  })
  it('điểm: TỈ LỆ SAI cao xếp trước (cùng lõi, cùng dạng yếu, cùng số em sai tuyệt đối)', () => {
    const r = chiDau([cau(qidCua(3, 0), 'D3', { soEmLam: 40, soEmSai: 12 }), cau(qidCua(4, 0), 'D4', { soEmLam: 20, soEmSai: 12 })]) // 30 % vs 60 %
    expect(r.cau.map((c) => c.qid)).toEqual([qidCua(4, 0), qidCua(3, 0)])
  })
  it('cắt tối đa 10 câu: 12 câu đạt ngưỡng ở 6 dạng (2 câu/dạng) ⇒ đúng 10', () => {
    const ds: DauVaoDeXuat['cauSaiNhieu'] = []
    for (let d = 0; d < 6; d++) for (let k = 0; k < 2; k++) ds.push(cau(qidCua(d, k), `D${d}`, { soEmSai: 8 + k }))
    const r = chiDau(ds)
    expect(r.cau).toHaveLength(10)
    expect(new Set(r.cau.map((c) => c.qid)).size).toBe(10)
  })
  it('BIÊN số em: 2 em sai (dù 40 % số em làm) bị loại; dạng chỉ 2 em yếu bị loại (không có câu nào ⇒ ẩn)', () => {
    expect(chiDau([cau(qidCua(3, 0), 'D3', { soEmLam: 5, soEmSai: 2 })]).co).toBe(false)
    expect(chiDau([], [{ ma: 'D3', ten: 'Dạng 3', soEmYeu: 2, nguon: ['ho_so'] }]).co).toBe(false)
  })
  it('đầu vào vô lý (chưa em nào làm mà có em sai) ⇒ không chọn; không chia cho 0', () => {
    const r = chiDau([cau(qidCua(3, 0), 'D3', { soEmLam: 0, soEmSai: 5 })])
    expect(r.co).toBe(false)
  })
  it('dạng yếu ĐÚNG 3 em thì được lấy (biên); kho của dạng chỉ có tự luận ⇒ không thêm câu tự luận nào', () => {
    const r = chiDau([], [{ ma: 'D3', ten: 'Dạng 3', soEmYeu: 3, nguon: ['ho_so'] }])
    expect(r.cau.map((c) => c.dang)).toEqual(['D3'])
    const khoTuLuan: CauKho[] = [...KHO, { qid: 'T-III-9', phan: 'III', dang: 'D9', sao: 2, q: cauTuLuan('T-III-9') }]
    const r2 = deXuatBuoiChua(dauVao({ cauSaiNhieu: [], goiY: [], dangYeu: [{ ma: 'D9', ten: 'Dạng 9', soEmYeu: 8, nguon: ['ho_so'] }] }), khoTuLuan)
    expect(r2.cau).toEqual([])
    expect(r2.co).toBe(false)
  })
  it('ngân sách: HOÀ điểm thì bỏ câu đứng SAU (mã lớn hơn), giữ câu đứng trước', () => {
    const chNho = { ...CAU_HINH_LEN_BANG_MAC_DINH, NGAN_SACH_PHUT: 1 } // chỉ còn 1 câu
    const r = deXuatBuoiChua(dauVao({ cauSaiNhieu: [cau(qidCua(3, 0), 'D3'), cau(qidCua(4, 0), 'D4')], dangYeu: [], goiY: [] }), KHO, chNho)
    expect(r.cau.map((c) => c.qid)).toEqual([qidCua(3, 0)])
  })
  it('ngân sách: đúng BẰNG ngân sách thì KHÔNG cắt; ngân sách rộng hơn cũng không cắt (không cắt oan)', () => {
    const ds: DauVaoDeXuat['cauSaiNhieu'] = []
    for (let d = 0; d < 6; d++) for (let k = 0; k < 2; k++) ds.push(cau(qidCua(d, k), `D${d}`, { soEmSai: 8 + k }))
    const day = deXuatBuoiChua(dauVao({ cauSaiNhieu: ds, dangYeu: [], goiY: [] }), KHO)
    const tong = day.cau.reduce((n, c) => n + c.giay, 0)
    // hao phí chỉnh để Σ + hao = đúng 60 phút
    const hao = 3600 - tong
    expect(hao).toBeGreaterThan(0)
    const chVua = { ...CAU_HINH_LEN_BANG_MAC_DINH, NGAN_SACH_PHUT: 60, HAO_PHI_MO_DAU_GIAY: hao, HAO_PHI_CHOT_CUOI_GIAY: 0 }
    const vua = deXuatBuoiChua(dauVao({ cauSaiNhieu: ds, dangYeu: [], goiY: [] }), KHO, chVua)
    expect(vua.cau).toHaveLength(day.cau.length) // đúng bằng ⇒ giữ nguyên
    expect(vua.phut).toBe(60)
    // ngân sách vừa đủ + 1 phút: cũng giữ nguyên
    const roong = deXuatBuoiChua(dauVao({ cauSaiNhieu: ds, dangYeu: [], goiY: [] }), KHO, { ...CAU_HINH_LEN_BANG_MAC_DINH, NGAN_SACH_PHUT: Math.ceil((tong + 600) / 60) + 1 })
    expect(roong.cau).toHaveLength(day.cau.length)
  })
  it('phút LÀM TRÒN LÊN: Σ giây + hao phí = 3601 giây ⇒ 61 phút (không phải 60)', () => {
    const ds: DauVaoDeXuat['cauSaiNhieu'] = []
    for (let d = 0; d < 6; d++) for (let k = 0; k < 2; k++) ds.push(cau(qidCua(d, k), `D${d}`, { soEmSai: 8 + k }))
    const day = deXuatBuoiChua(dauVao({ cauSaiNhieu: ds, dangYeu: [], goiY: [] }), KHO)
    const tong = day.cau.reduce((n, c) => n + c.giay, 0)
    const ch = { ...CAU_HINH_LEN_BANG_MAC_DINH, NGAN_SACH_PHUT: 90, HAO_PHI_MO_DAU_GIAY: 3601 - tong, HAO_PHI_CHOT_CUOI_GIAY: 0 }
    expect(deXuatBuoiChua(dauVao({ cauSaiNhieu: ds, dangYeu: [], goiY: [] }), KHO, ch).phut).toBe(61)
  })
  it('không có câu cốt lõi nào ⇒ KHÔNG có dòng "Câu cốt lõi nhiều em sai"', () => {
    const r = deXuatBuoiChua(dauVao({ cauSaiNhieu: [cau(qidCua(3, 0), 'D3')], dangYeu: [], goiY: [] }), KHO)
    expect(r.cacLyDo.join('|')).not.toMatch(/Câu cốt lõi/)
  })
})

describe('chọn EM cần chú ý', () => {
  it('gợi ý Bộ não (chỉ goi_len_bang / dua_vao_buoi_chua) trước, rồi em sai nhiều câu trong buổi; mỗi em một lần; nhan_phu_huynh KHÔNG vào', () => {
    const r = deXuatBuoiChua(dauVao(), KHO)
    expect(r.em.slice(0, 2)).toEqual([
      { sbd: 'g1', hoTen: 'Em g1', lyDo: 'Bộ não A.I gợi ý' },
      { sbd: 'g2', hoTen: 'Em g2', lyDo: 'Bộ não A.I gợi ý' },
    ])
    expect(r.em.map((e) => e.sbd)).not.toContain('g3')
    // a1 sai 3 câu trong buổi (T-I-1, T-I-2, T-I-7) ⇒ đứng đầu nhóm "em sai"
    const nhomSai = r.em.slice(2)
    expect(nhomSai[0]).toEqual({ sbd: 'a1', hoTen: 'Em a1', lyDo: 'Sai 3 câu trong buổi' })
    expect(new Set(r.em.map((e) => e.sbd)).size).toBe(r.em.length)
  })
  it('gợi ý trùng em sai: em chỉ xuất hiện MỘT lần (lý do của gợi ý Bộ não thắng); trần 20 em', () => {
    const goiY = Array.from({ length: 30 }, (_, i) => ({ sbd: `g${i}`, hoTen: `Em g${i}`, hanhDong: 'goi_len_bang', dang: 'D0' }))
    const r = deXuatBuoiChua(dauVao({ goiY: [{ sbd: 'a1', hoTen: 'Em a1', hanhDong: 'goi_len_bang', dang: 'D0' }, ...goiY] }), KHO)
    expect(r.em).toHaveLength(20)
    expect(r.em.filter((e) => e.sbd === 'a1')).toEqual([{ sbd: 'a1', hoTen: 'Em a1', lyDo: 'Bộ não A.I gợi ý' }])
  })
})

describe('lý do hiển thị = số thật, từ chuẩn', () => {
  it('≤ 3 dòng: "Dạng em đang yếu: <tên> — 9/24 em", "Câu cốt lõi nhiều em sai: N câu", "Bộ não A.I gợi ý gọi lên bảng: N em"', () => {
    const r = deXuatBuoiChua(dauVao(), KHO)
    expect(r.cacLyDo).toEqual([
      'Dạng em đang yếu: Thuỷ phân ester — 9/24 em',
      'Dạng em đang yếu: Xà phòng hoá — 7/24 em',
      `Câu cốt lõi nhiều em sai: ${r.cau.filter((c) => c.loi).length} câu`,
    ])
    expect(r.cacLyDo.length).toBeLessThanOrEqual(3)
    // không nhãn năng lực, không "yếu kém"
    for (const d of r.cacLyDo) expect(d).not.toMatch(/yếu kém|kém|giỏi|nắm chắc/i)
  })
  it('phút: ước = ⌈(Σ giây câu + hao phí mở/chốt) / 60⌉ và số câu/em khớp', () => {
    const r = deXuatBuoiChua(dauVao(), KHO)
    const hao = CAU_HINH_LEN_BANG_MAC_DINH.HAO_PHI_MO_DAU_GIAY + CAU_HINH_LEN_BANG_MAC_DINH.HAO_PHI_CHOT_CUOI_GIAY
    expect(r.phut).toBe(Math.ceil((r.cau.reduce((n, c) => n + c.giay, 0) + hao) / 60))
    expect(r.soCau).toBe(r.cau.length)
    expect(r.soEm).toBe(r.em.length)
    expect(r.phut).toBeLessThanOrEqual(CAU_HINH_LEN_BANG_MAC_DINH.NGAN_SACH_PHUT)
  })
})

describe('docDauVao — không tin dữ liệu từ máy chủ', () => {
  const tot = () => ({
    ok: true,
    ngay: '2026-09-22',
    lop: '12A1',
    soEmCoSo: 24,
    dangYeu: [{ ma: 'D0', ten: 'Thuỷ phân ester', soEmYeu: 9, nguon: ['ho_so', 'bo_nao', 'la'] }],
    cauSaiNhieu: [{ qid: 'T-I-1', dang: 'D0', loi: true, soEmLam: 20, soEmSai: 9, emSai: [{ sbd: 'a1', hoTen: 'Em a1' }, { sbd: '' }, 5] }],
    goiY: [{ sbd: 'g1', hoTen: 'Em g1', hanhDong: 'goi_len_bang', dang: 'D0' }],
  })
  it('nguồn lặp bị khử trùng', () => {
    const j = tot()
    j.dangYeu[0].nguon = ['ho_so', 'ho_so', 'bo_nao', 'bo_nao']
    expect(docDauVao(j)!.dangYeu[0].nguon).toEqual(['ho_so', 'bo_nao'])
  })
  it('đúng dạng ⇒ đọc đủ, nguồn lạ bị bỏ, em không có SBD bị bỏ', () => {
    const d = docDauVao(tot())!
    expect(d.dangYeu[0].nguon).toEqual(['ho_so', 'bo_nao'])
    expect(d.cauSaiNhieu[0].emSai).toEqual([{ sbd: 'a1', hoTen: 'Em a1' }])
    expect(d.soEmCoSo).toBe(24)
    expect(d.goiY).toHaveLength(1)
  })
  it('không phải {ok:true} / không phải đối tượng ⇒ null (thẻ ẩn, không báo lỗi)', () => {
    for (const x of [null, undefined, 'x', 5, [], { ok: false }, { ok: 'true' }, { error: 'x' }]) expect(docDauVao(x)).toBeNull()
  })
  it('phần tử hỏng bị bỏ, số xấu ⇒ 0, soEmSai > soEmLam ⇒ bỏ câu; thiếu mảng ⇒ rỗng', () => {
    const j = { ...tot(), soEmCoSo: -5, dangYeu: [{ ma: '' }, null, { ma: 'D1', soEmYeu: 'x' }], cauSaiNhieu: [{ qid: 'Q', soEmLam: 5, soEmSai: 9 }, { soEmLam: 5, soEmSai: 1 }], goiY: [{ hoTen: 'thiếu sbd' }] }
    const d = docDauVao(j)!
    expect(d.soEmCoSo).toBe(0)
    expect(d.dangYeu).toEqual([{ ma: 'D1', ten: 'D1', soEmYeu: 0, nguon: [] }])
    expect(d.cauSaiNhieu).toEqual([])
    expect(d.goiY).toEqual([])
    expect(docDauVao({ ok: true })).toMatchObject({ dangYeu: [], cauSaiNhieu: [], goiY: [], soEmCoSo: 0 })
  })
  it('đầu vào đọc xong đưa vào hàm chính không làm sập (kể cả tất cả rỗng)', () => {
    expect(deXuatBuoiChua(docDauVao({ ok: true })!, KHO).co).toBe(false)
    expect(() => deXuatBuoiChua(docDauVao(tot())!, [])).not.toThrow()
  })
})

describe('tính chất: tất định, biên, không sửa đầu vào', () => {
  it('300 đầu vào ngẫu nhiên: cùng đầu vào ⇒ cùng kết quả; câu ∈ kho, không tự luận, không trùng, ≤ 10, mỗi dạng ≤ 2, vừa ngân sách; em không trùng ≤ 20; không sửa đầu vào', () => {
    const rnd = mulberry32(21092026)
    const nguoi = (i: number) => `e${i}`
    for (let lan = 0; lan < 300; lan++) {
      const soEm = 3 + Math.floor(rnd() * 40)
      const cauSai = Array.from({ length: Math.floor(rnd() * 25) }, () => {
        const d = Math.floor(rnd() * 7)
        const k = Math.floor(rnd() * 8)
        const lam = Math.floor(rnd() * 25)
        return { qid: d === 6 ? `KHONG-${k}` : k >= 6 ? (k === 6 ? 'T-III-1' : 'T-III-2') : qidCua(d, k), dang: `D${d}`, loi: rnd() < 0.4, soEmLam: lam, soEmSai: Math.floor(rnd() * (lam + 1)), emSai: Array.from({ length: Math.floor(rnd() * 6) }, () => ({ sbd: nguoi(Math.floor(rnd() * 50)), hoTen: 'x' })) }
      })
      const dv: DauVaoDeXuat = {
        ngay: '2026-09-22',
        lop: '12A1',
        soEmCoSo: soEm,
        dangYeu: Array.from({ length: Math.floor(rnd() * 6) }, (_, d) => ({ ma: `D${d}`, ten: `Dạng ${d}`, soEmYeu: Math.floor(rnd() * 12), nguon: rnd() < 0.5 ? ['ho_so' as const] : ['ho_so' as const, 'bo_nao' as const] })),
        cauSaiNhieu: cauSai,
        goiY: Array.from({ length: Math.floor(rnd() * 8) }, () => ({ sbd: nguoi(Math.floor(rnd() * 50)), hoTen: 'x', hanhDong: rnd() < 0.5 ? 'goi_len_bang' : 'nhan_phu_huynh', dang: 'D0' })),
      }
      const ch = { ...CAU_HINH_LEN_BANG_MAC_DINH, NGAN_SACH_PHUT: 5 + Math.floor(rnd() * 90) }
      const snap = JSON.stringify([dv, ch])
      const a = deXuatBuoiChua(dv, KHO, ch)
      expect(JSON.stringify(deXuatBuoiChua(dv, KHO, ch))).toBe(JSON.stringify(a))
      expect(JSON.stringify([dv, ch])).toBe(snap)
      if (soEm < DE_XUAT_BUOI_CHUA.SO_EM_TOI_THIEU_CO_SO) {
        expect(a.co).toBe(false)
        continue
      }
      expect(a.co).toBe(a.cau.length > 0)
      const qids = a.cau.map((c) => c.qid)
      expect(new Set(qids).size).toBe(qids.length)
      expect(a.cau.length).toBeLessThanOrEqual(10)
      const dem = new Map<string, number>()
      for (const c of a.cau) {
        const k = KHO.find((x) => x.qid === c.qid)
        expect(k, `${lan}: ${c.qid} phải có trong kho`).toBeDefined()
        expect(laCauRutDuoc(k!.q, k!.phan), `${lan}: ${c.qid} không được là tự luận`).toBe(true)
        if (c.nguon === 'sai_nhieu') dem.set(c.dang, (dem.get(c.dang) ?? 0) + 1)
        expect(c.soEmSai).toBeLessThanOrEqual(c.soEmLam)
      }
      for (const [d, n] of dem) expect(n, `${lan}: dạng ${d}`).toBeLessThanOrEqual(2)
      if (a.cau.length > 1) expect(a.phut).toBeLessThanOrEqual(ch.NGAN_SACH_PHUT) // 1 câu có thể vượt ngân sách nhỏ; ≥ 2 câu thì luôn vừa
      expect(a.em.length).toBeLessThanOrEqual(20)
      expect(new Set(a.em.map((e) => e.sbd)).size).toBe(a.em.length)
      expect(a.soCau).toBe(a.cau.length)
      expect(a.soEm).toBe(a.em.length)
    }
  })
})

describe('khoá nguồn', () => {
  it('thuần: chỉ import lõi thuần (cau-tu-luan, len-bang-cau-hinh, thoi-gian-len-bang); không đồng hồ/ngẫu nhiên/IO', () => {
    const goc = readFileSync('src/lib/buoi-chua-de-xuat.ts', 'utf8')
    const ma = goc.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '')
    for (const cam of ['Math.random', 'Date.now', 'new Date', 'fetch(', 'localStorage', 'indexedDB', 'process.']) expect(ma, cam).not.toContain(cam)
    expect([...goc.matchAll(/^import (?:type )?.* from '([^']+)'/gm)].map((m) => m[1]).sort()).toEqual(['./cau-tu-luan', './len-bang-cau-hinh', './thoi-gian-len-bang'])
  })
})
