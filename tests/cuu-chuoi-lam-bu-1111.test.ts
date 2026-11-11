// @vitest-environment node
// LÀM BÙ CỨU CHUỖI (thầy 11/11: «phần làm bù cứu chuỗi bạn tính toán thông minh nhất hiệu quả nhất cho từng học sinh để học sinh mất chuỗi có thể làm bù cứu
// chuỗi. Áp dụng luôn cho tất cả hs mất chuỗi từ hôm qua»). Luật: server/src/chuoi-ngay-bai.ts (đầu khối NGAY_CUU_BU).
import { expect, it } from 'vitest'
import { HAN_CUU_NGAY, NGAY_CUU_BU, NGAY_KT_CHI_28, cauBuNgay, cauThieuNgay, chuoiNgayCuaEm, mucGocNgay, ngayDatChuoi, type NhatKyChuoi } from '../server/src/chuoi-ngay-bai'
import { NGAY_DE_28 } from '../server/src/rut-28'
import { readFileSync } from 'node:fs'

/** `d`: 'MM-DD' → [đã làm, mức (0 = không có dòng mức), trả nợ câu, kt ('nop' | 'chua')]. */
type Ngay = [number, number, number?, ('nop' | 'chua')?]
function nk(d: Record<string, Ngay>, them: Partial<NhatKyChuoi> = {}): NhatKyChuoi {
  const soCau = new Map<string, number>(), muc = new Map<string, number>(), traNo = new Map<string, number>(), kt = new Map<string, boolean>()
  for (const [k, [lam, m, tn, t]] of Object.entries(d)) {
    const n = `2026-${k}`
    if (lam > 0 || t) soCau.set(n, lam)
    if (m > 0) muc.set(n, m)
    if (tn) traNo.set(n, tn)
    if (t) kt.set(n, t === 'nop')
  }
  return { soCau, soCau7: soCau, tuSua: new Set(), phep: new Set(), mua: new Map(), muc, traNo, kt, ...them }
}
const DU: Ngay = [28, 28]
const NAM_NGAY = { '11-04': DU, '11-05': DU, '11-06': DU, '11-07': DU, '11-08': DU } // chuỗi 5 ngày tới 08/11
const kieu = (c: ReturnType<typeof chuoiNgayCuaEm>, ngay: string) => c.lich7.find((x) => x.ngay === `2026-${ngay}`)?.kieu

it('hằng: áp cho ngày lỡ từ 09/11, hạn 4 ngày; mốc Kiểm tra ôn tập chỉ 28 câu trùng mốc đề 28', () => {
  expect(NGAY_CUU_BU).toBe('2026-11-09')
  expect(HAN_CUU_NGAY).toBe(4)
  expect(NGAY_KT_CHI_28).toBe(NGAY_DE_28)
})

it('em mất chuỗi hôm qua (lỡ 09/11, làm 20/28): hôm nay 11/11 còn cứu được — thiếu 8 câu thì bù đúng 8 câu, hạn hết 13/11', () => {
  const goc = { ...NAM_NGAY, '11-09': [20, 28] as Ngay, '11-10': DU }
  const a = chuoiNgayCuaEm(nk(goc), '2026-11-11')
  expect(a.cuu).toEqual({ hetHan: '2026-11-13T17:00:00.000Z', daLam: 0, can: 8, soCu: 6, cau: true, ngayLo: '2026-11-09', soNgay: 1 }) // 24:00 ngày 13/11 giờ VN
  expect(a.so).toBe(1) // chắc chắn còn: ngày 10/11
  expect(kieu(a, '11-09')).toBe('tat')
  // hôm nay làm 31 câu (mức 28): bù được 3, còn 5 — hôm nay vẫn là ngày đạt
  const b = chuoiNgayCuaEm(nk({ ...goc, '11-11': [31, 28] }), '2026-11-11')
  expect(b.cuu).toMatchObject({ daLam: 3, can: 8, soCu: 7 })
  expect(b.so).toBe(2)
  // làm 36 câu: bù đủ 8 ⇒ chuỗi nối lại đúng số cũ + các ngày đạt từ đó
  const c = chuoiNgayCuaEm(nk({ ...goc, '11-11': [36, 28] }), '2026-11-11')
  expect(c.cuu).toBeUndefined()
  expect(c.so).toBe(7)
  expect(kieu(c, '11-09')).toBe('cuu')
  // bù rải qua nhiều ngày cũng được: 11/11 bù 3, 12/11 bù 5
  const d = chuoiNgayCuaEm(nk({ ...goc, '11-11': [31, 28], '11-12': [33, 28] }), '2026-11-12')
  expect(d.cuu).toBeUndefined()
  expect(d.so).toBe(8)
})

it('quá hạn (hết ngày thứ 4 sau ngày lỡ) mà chưa bù xong ⇒ ngày ấy tắt hẳn, chuỗi tính lại từ các ngày đạt sau nó', () => {
  const goc = { ...NAM_NGAY, '11-09': [20, 28] as Ngay, '11-10': DU, '11-11': DU, '11-12': [30, 28] as Ngay, '11-13': DU }
  const conHan = chuoiNgayCuaEm(nk(goc), '2026-11-13')
  expect(conHan.cuu).toMatchObject({ daLam: 2, can: 8, soCu: 9 })
  expect(conHan.so).toBe(4)
  const hetHan = chuoiNgayCuaEm(nk({ ...goc, '11-14': DU }), '2026-11-14')
  expect(hetHan.cuu).toBeUndefined()
  expect(hetHan.so).toBe(5) // 10 → 14/11
  expect(kieu(hetHan, '11-09')).toBe('tat')
})

it('câu TRẢ NỢ CÂU chính là câu bù: mức gốc = mức − phần trả nợ', () => {
  const d = nk({ ...NAM_NGAY, '11-09': DU, '11-10': DU, '11-11': [20, 28], '11-12': [34, 34, 6], '11-13': [31, 31, 3] })
  expect(mucGocNgay(d, '2026-11-12')).toBe(28)
  expect(cauThieuNgay(d, '2026-11-11')).toBe(8)
  expect(cauBuNgay(d, '2026-11-12')).toBe(6)
  const a = chuoiNgayCuaEm(d, '2026-11-12')
  expect(a.cuu).toMatchObject({ daLam: 6, can: 8, soCu: 8 })
  const b = chuoiNgayCuaEm(d, '2026-11-13') // bù tiếp 3 ≥ 2 còn thiếu ⇒ nối lại
  expect(b.cuu).toBeUndefined()
  expect(b.so).toBe(9)
  expect(kieu(b, '11-11')).toBe('cuu')
})

it('nghỉ cả ngày (không có dòng mức) ⇒ phải bù 28 câu; làm đủ bài mà thiếu phần trả nợ ⇒ ngày ấy không cộng chuỗi nhưng không phải bù gì', () => {
  const a = chuoiNgayCuaEm(nk({ ...NAM_NGAY, '11-09': DU, '11-10': DU }), '2026-11-12') // 11/11 không làm gì
  expect(a.cuu).toMatchObject({ can: 28, daLam: 0, ngayLo: '2026-11-11', soCu: 7 })
  expect(a.so).toBe(0)
  const b = chuoiNgayCuaEm(nk({ ...NAM_NGAY, '11-09': DU, '11-10': DU, '11-11': [30, 39, 11], '11-12': [28, 28] }), '2026-11-12') // 11/11: đủ 28 câu bài, mới trả 2/11 câu nợ
  expect(kieu(b, '11-11')).toBe('cuu')
  expect(b.cuu).toBeUndefined()
  expect(b.so).toBe(8)
})

it('ngày Kiểm tra ôn tập (từ 11/11 chỉ 28 câu kiểm tra): đã nộp là ngày đạt dù không có câu bài tập; chưa nộp là ngày lỡ, bù 28 câu', () => {
  const nop = nk({ ...NAM_NGAY, '11-09': DU, '11-10': DU, '11-11': [0, 0, 0, 'nop'] })
  expect(ngayDatChuoi(nop, '2026-11-11')).toBe(true)
  expect(chuoiNgayCuaEm(nop, '2026-11-11').so).toBe(8)
  expect(chuoiNgayCuaEm(nop, '2026-11-12').so).toBe(8)
  const lo = nk({ ...NAM_NGAY, '11-09': DU, '11-10': DU, '11-11': [0, 0, 0, 'chua'] })
  expect(ngayDatChuoi(lo, '2026-11-11')).toBe(false)
  expect(chuoiNgayCuaEm(lo, '2026-11-12').cuu).toMatchObject({ can: 28, ngayLo: '2026-11-11' })
})

it('còn bình thì bình tự đỡ trước (không phải bù); ngày lỡ trước 09/11 giữ luật cũ; luật cứu cũ (hôm sau đủ mức + 12 câu) vẫn được nhận', () => {
  const coBinh = chuoiNgayCuaEm(nk({ ...NAM_NGAY, '11-09': [20, 28], '11-10': DU }, { mua: new Map([['2026-11-06', 1]]) }), '2026-11-11')
  expect(kieu(coBinh, '11-09')).toBe('binh')
  expect(coBinh.cuu).toBeUndefined()
  expect(coBinh.so).toBe(6)
  const cu = chuoiNgayCuaEm(nk({ '11-03': DU, '11-04': DU, '11-05': DU, '11-06': DU, '11-07': DU, '11-08': [20, 28], '11-09': DU, '11-10': DU }), '2026-11-11')
  expect(cu.cuu).toBeUndefined() // lỡ 08/11: trước mốc ⇒ đã tắt theo luật cũ
  expect(cu.so).toBe(2)
  const luatCu = chuoiNgayCuaEm(nk({ ...NAM_NGAY, '11-09': [0, 28], '11-10': [40, 28] }), '2026-11-11')
  expect(kieu(luatCu, '11-09')).toBe('cuu')
  expect(luatCu.so).toBe(6)
})

it('hai ngày lỡ: bù ngày cũ trước; ngày cũ hết hạn thì chỉ mất phần chuỗi trước nó, ngày lỡ sau vẫn còn hạn riêng', () => {
  const goc = { ...NAM_NGAY, '11-09': [20, 28] as Ngay, '11-10': DU, '11-11': [18, 28] as Ngay, '11-12': DU }
  const a = chuoiNgayCuaEm(nk(goc), '2026-11-13')
  expect(a.cuu).toMatchObject({ can: 18, daLam: 0, soNgay: 2, ngayLo: '2026-11-09', soCu: 7 })
  expect(a.so).toBe(1) // chắc chắn còn: 12/11
  const b = chuoiNgayCuaEm(nk({ ...goc, '11-13': [36, 28] }), '2026-11-13') // bù 8 ⇒ xong ngày 09/11, còn 10 câu của 11/11
  expect(kieu(b, '11-09')).toBe('cuu')
  expect(b.cuu).toMatchObject({ can: 10, daLam: 0, soNgay: 1, ngayLo: '2026-11-11', hetHan: '2026-11-15T17:00:00.000Z', soCu: 8 })
  const c = chuoiNgayCuaEm(nk({ ...goc, '11-13': DU, '11-14': DU }), '2026-11-14') // 09/11 hết hạn 13/11 ⇒ mất 5 ngày đầu + 10/11 vẫn tính; 11/11 còn hạn tới 15/11
  expect(kieu(c, '11-09')).toBe('tat')
  expect(c.cuu).toMatchObject({ can: 10, ngayLo: '2026-11-11', soCu: 4 }) // 10, 12, 13, 14
  expect(c.so).toBe(3)
})

it('migration thưởng khai bảng lựa chọn trả nợ đúng như lược đồ Gói 7 (câu đọc chuỗi luôn chạy được)', () => {
  const ddl = 'CREATE TABLE IF NOT EXISTS goi_bai_7_no_chon (sbd TEXT NOT NULL,ngay TEXT NOT NULL,kieu TEXT NOT NULL,so INTEGER NOT NULL,goc INTEGER NOT NULL,luc TEXT NOT NULL,PRIMARY KEY(sbd,ngay))'
  expect(readFileSync('server/src/goi-bai-7-schema.ts', 'utf8')).toContain(ddl)
  expect(readFileSync('server/migration-2610-thuong-phat.sql', 'utf8')).toContain(`${ddl};`)
})
