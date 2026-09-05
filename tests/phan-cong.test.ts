// PHÂN CÔNG GỌI LÊN BẢNG — 15 phép kiểm mục 8 của MOCAVAGOILENBANG.md.
//
// Bộ giả lập đúng như đặc tả mô tả: 29 em (27 có mặt) · 20 câu · lõi chung 3
// câu cả lớp làm · 5 câu riêng mỗi câu 4 em · 12 câu không ai làm.
import { describe, expect, it } from 'vitest'
import { MAC_DINH, phanCong, thongKeCau, topYeu, type BaiLam, type CauChua, type EmGoi } from '../src/lib/phan-cong'

const CD = ['pH và acid-base', 'Sự điện li', 'Chuẩn độ', 'Sulfur']

const cau = (i: number, sao: 0 | 1 | 2, chuyenDe: string, mucDo: 'biet' | 'hieu' | 'van_dung' | '' = ''): CauChua => ({
  id: `q${i}`,
  phan: 'I',
  so: i,
  chuyenDe,
  mucDo,
  tomTat: `Câu ${i}`,
  viTri: i,
  sao,
  lyDoSao: sao ? 'nền' : '',
})

// 20 câu: q1..q3 lõi chung · q4..q8 câu riêng · q9..q20 không ai làm.
const DS_CAU: CauChua[] = [
  cau(1, 2, CD[0], 'hieu'), // 18/27 cùng chọn B  -> giảng cả lớp
  cau(2, 2, CD[1], 'van_dung'), // 12/27 sai, tản mát -> đáng chữa
  cau(3, 0, CD[0], 'biet'), // 24/27 đúng        -> chỉ đọc đáp án
  ...[4, 5, 6, 7, 8].map((i) => cau(i, i === 4 ? 2 : 1, CD[i % 4], 'hieu')),
  ...Array.from({ length: 12 }, (_, k) => cau(9 + k, (k === 0 ? 2 : k < 4 ? 1 : 0) as 0 | 1 | 2, CD[k % 4], 'biet')),
]

const SBD = Array.from({ length: 29 }, (_, i) => String(i + 1).padStart(3, '0'))

function dungBaiLam(): BaiLam[] {
  const ra: BaiLam[] = []
  const coMat = SBD.slice(0, 27)
  // q1: 18 em cùng chọn B, 9 em đúng  -> doChum 18/27 = 0,67
  coMat.forEach((sbd, i) => ra.push({ sbd, idCau: 'q1', dung: i >= 18, chon: i < 18 ? 'B' : 'A' }))
  // q2: 12 em sai, phương án tản mát  -> doChum thấp
  coMat.forEach((sbd, i) => ra.push({ sbd, idCau: 'q2', dung: i >= 12, chon: i < 12 ? ['B', 'C', 'D'][i % 3] : 'A' }))
  // q3: 24 em đúng                    -> tiLeDung 0,89
  coMat.forEach((sbd, i) => ra.push({ sbd, idCau: 'q3', dung: i >= 3, chon: i < 3 ? 'B' : 'A' }))
  // q4..q8: mỗi câu đúng 4 em làm, 3 em sai cùng chọn B -> chụm cao NHƯNG mẫu nhỏ
  ;[4, 5, 6, 7, 8].forEach((q, k) => {
    coMat.slice(k * 4, k * 4 + 4).forEach((sbd, i) => ra.push({ sbd, idCau: `q${q}`, dung: i === 3, chon: i < 3 ? 'B' : 'A' }))
  })
  return ra
}

const BAI_LAM = dungBaiLam()

const em = (sbd: string, i: number): EmGoi => ({
  sbd,
  hoTen: `Em ${i + 1}`,
  coMat: i < 27,
  // Em i yếu chuyên đề CD[i % 4]: sai nhiều nhất ở đó.
  chuyenDe: CD.map((ten, k) => ({ ten, soCau: 10, soSai: k === i % 4 ? 7 : 1 })),
  daGoiTheoCd: {},
  daGoiCau: [],
  soLanLenBang: 0,
})

const DS_EM: EmGoi[] = SBD.map(em)

const kq = () => phanCong(DS_CAU, BAI_LAM, DS_EM)
const tkCua = (id: string) => thongKeCau(DS_CAU, BAI_LAM).find((t) => t.cau.id === id)!

describe('PHÂN CÔNG — 15 phép kiểm', () => {
  it('1. câu 18/27 em cùng chọn B → giảng cả lớp (doChum 0,67)', () => {
    const t = tkCua('q1')
    expect(t.doChum).toBeCloseTo(18 / 27, 4)
    expect(t.nhom).toBe('giang_ca_lop')
    expect(kq().giangCaLop.map((x) => x.cau.id)).toContain('q1')
  })

  it('2. câu 24/27 em làm đúng → chỉ đọc đáp án (tiLeDung 0,89)', () => {
    const t = tkCua('q3')
    expect(t.tiLeDung).toBeCloseTo(24 / 27, 4)
    expect(t.nhom).toBe('chi_doc_dap_an')
  })

  it('3. câu chỉ 4 em làm → doTinCay 0,50', () => {
    expect(tkCua('q4').doTinCay).toBeCloseTo(0.5, 6)
  })

  it('4. câu chỉ 4 em làm dù chụm cao → KHÔNG bị xếp giảng cả lớp', () => {
    const t = tkCua('q4')
    expect(t.doChum).toBeCloseTo(0.75, 4) // chụm rất cao
    expect(t.nhom).toBe('dang_chua') // nhưng mẫu nhỏ, không đủ tư cách kết luận
    expect(kq().giangCaLop.map((x) => x.cau.id)).not.toContain('q4')
    expect(kq().chiDocDapAn.map((x) => x.cau.id)).not.toContain('q4')
  })

  it('5. câu không ai làm → vẫn nằm trong danh sách chữa', () => {
    const r = kq()
    const trongChua = new Set([...r.phanCong.map((p) => p.cau.id), ...r.chuaPhan.map((t) => t.cau.id)])
    expect(trongChua.has('q9')).toBe(true)
    expect(tkCua('q9').soEmLam).toBe(0)
  })

  it('6. câu 2 sao xếp trên câu 0 sao — 226,7 > 0,0', () => {
    const hai = tkCua('q2')
    const khong = tkCua('q20')
    expect(hai.diem).toBeGreaterThan(khong.diem)
    expect(khong.diem).toBe(0)
    // Bảng phân công xếp giảm dần theo điểm, nên câu 2 sao ra trước.
    const r = kq()
    const thuTu = [...r.phanCong.map((p) => p.cau.id), ...r.chuaPhan.map((t) => t.cau.id)]
    expect(thuTu.indexOf('q2')).toBeLessThan(thuTu.indexOf('q20'))
  })

  it('7. không câu nào phân cho hai em', () => {
    const id = kq().phanCong.map((p) => p.cau.id)
    expect(new Set(id).size).toBe(id.length)
  })

  it('8. không em nào nhận hai câu trong một lượt', () => {
    const r = kq()
    for (let l = 1; l <= MAC_DINH.soLuot; l++) {
      const sbd = r.phanCong.filter((p) => p.luot === l).map((p) => p.sbd)
      expect(new Set(sbd).size).toBe(sbd.length)
    }
  })

  it('9. em vắng không xuất hiện', () => {
    const vang = new Set(DS_EM.filter((e) => !e.coMat).map((e) => e.sbd))
    expect(kq().phanCong.some((p) => vang.has(p.sbd))).toBe(false)
    expect(vang.size).toBe(2)
  })

  it('10. câu giảng cả lớp không phân cho ai', () => {
    const r = kq()
    const gc = new Set(r.giangCaLop.map((t) => t.cau.id))
    expect(gc.size).toBeGreaterThan(0)
    expect(r.phanCong.some((p) => gc.has(p.cau.id))).toBe(false)
  })

  it('11. câu chỉ đọc đáp án không phân cho ai', () => {
    const r = kq()
    const dd = new Set(r.chiDocDapAn.map((t) => t.cau.id))
    expect(dd.size).toBeGreaterThan(0)
    expect(r.phanCong.some((p) => dd.has(p.cau.id))).toBe(false)
  })

  it('12. có dòng mức 3 — không làm câu, yếu chuyên đề', () => {
    const m3 = kq().phanCong.filter((p) => p.muc === 3)
    expect(m3.length).toBeGreaterThan(0)
    expect(m3[0].viSao).toContain('không làm câu này')
    expect(m3[0].viSao).toContain('yếu')
  })

  it('13. em sai nhiều chuyên đề → nhắm mức nhận biết', () => {
    const nang = DS_EM.map((e, i) => (i === 0 ? { ...e, chuyenDe: CD.map((ten) => ({ ten, soCau: 10, soSai: 9 })) } : e))
    const r = phanCong(DS_CAU, BAI_LAM, nang)
    const cua = r.phanCong.find((p) => p.sbd === '001')
    expect(cua).toBeTruthy()
    expect(cua!.mucDoNham).toBe('biet')
  })

  it('14. mọi dòng đều có lý do bằng chữ', () => {
    const r = kq()
    expect(r.phanCong.length).toBeGreaterThan(0)
    for (const p of r.phanCong) expect(p.viSao.trim().length).toBeGreaterThan(3)
  })

  it('15. sinh cảnh báo về câu ít em làm', () => {
    const c = kq().canhBao.join(' ')
    expect(c).toContain('câu có dưới 8 em làm')
  })
})

describe('mức ghép — thứ tự năm mức', () => {
  const t1 = () => thongKeCau(DS_CAU, BAI_LAM).find((t) => t.cau.id === 'q2')!

  it('mức 3 (không làm, yếu chuyên đề) xếp TRÊN mức 4 (làm đúng, vẫn yếu)', () => {
    // q9 không ai làm. Em yếu đúng chuyên đề của q9 phải ra mức 3.
    const tk9 = thongKeCau(DS_CAU, BAI_LAM).find((t) => t.cau.id === 'q9')!
    const emYeu = DS_EM.find((e) => topYeu(e).includes('ph va acid-base'))!
    const r = phanCong([DS_CAU[0], tk9.cau], BAI_LAM, [emYeu])
    const dong = r.phanCong.find((p) => p.cau.id === 'q9')
    expect(dong?.muc).toBe(3)
  })

  it('em làm sai + yếu đúng chuyên đề → mức 1, lý do nói cả hai', () => {
    const emYeuDienLi = { ...DS_EM[1], chuyenDe: CD.map((ten) => ({ ten, soCau: 10, soSai: ten === CD[1] ? 8 : 0 })) }
    const r = phanCong([t1().cau], BAI_LAM, [emYeuDienLi])
    expect(r.phanCong[0].muc).toBe(1)
    expect(r.phanCong[0].viSao).toContain('sai câu này')
    expect(r.phanCong[0].viSao).toContain('yếu')
  })

  it('em làm sai nhưng không yếu chuyên đề → mức 2', () => {
    const emKhac = { ...DS_EM[1], chuyenDe: CD.map((ten) => ({ ten, soCau: 10, soSai: ten === CD[2] ? 8 : 0 })) }
    const r = phanCong([t1().cau], BAI_LAM, [emKhac])
    expect(r.phanCong[0].muc).toBe(2)
    expect(r.phanCong[0].viSao).toBe('sai câu này')
  })
})

describe('độ tin cậy — sao không bị nhân, phần từ bài làm thì có', () => {
  it('sao × 100 giữ nguyên dù không em nào làm', () => {
    expect(tkCua('q9').diem).toBe(200)
  })

  it('cùng tỉ lệ sai, câu ít em làm cho điểm thấp hơn câu nhiều em làm', () => {
    const c = cau(90, 0, CD[0])
    const it: BaiLam[] = Array.from({ length: 4 }, (_, i) => ({ sbd: SBD[i], idCau: 'q90', dung: false, chon: 'B' }))
    const nhieu: BaiLam[] = Array.from({ length: 16 }, (_, i) => ({ sbd: SBD[i], idCau: 'q90', dung: false, chon: 'B' }))
    const a = thongKeCau([c], it)[0]
    const b = thongKeCau([c], nhieu)[0]
    expect(a.tiLeDung).toBe(b.tiLeDung)
    expect(a.diem).toBeLessThan(b.diem)
    expect(b.doTinCay).toBe(1)
  })
})

describe('ràng buộc chung', () => {
  it('chạy hai lần cùng seed ra kết quả y hệt', () => {
    expect(JSON.stringify(kq())).toBe(JSON.stringify(kq()))
  })

  it('không em nào có mặt thì nói thẳng, không dựng bảng rỗng im lặng', () => {
    const r = phanCong(DS_CAU, BAI_LAM, DS_EM.map((e) => ({ ...e, coMat: false })))
    expect(r.canhBao).toContain('Không em nào có mặt')
    expect(r.phanCong).toEqual([])
  })

  it('câu em ĐÃ được gọi rồi thì không gọi lại chính em đó', () => {
    const daGoi = DS_EM.map((e) => ({ ...e, daGoiCau: ['q2'] }))
    const r = phanCong(DS_CAU, BAI_LAM, daGoi)
    expect(r.phanCong.some((p) => p.cau.id === 'q2')).toBe(false)
  })

  it('em ít lên bảng được ưu tiên khi cùng mức', () => {
    const hai: EmGoi[] = [
      { ...DS_EM[0], sbd: 'A', hoTen: 'Đã lên nhiều', soLanLenBang: 9 },
      { ...DS_EM[0], sbd: 'B', hoTen: 'Ít lên', soLanLenBang: 0 },
    ]
    const r = phanCong([DS_CAU[1]], [], hai)
    expect(r.phanCong[0].hoTen).toBe('Ít lên')
  })
})
