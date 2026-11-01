// @vitest-environment node
// HÔM NAY · 4 BẢNG — LÕI (thầy chốt bản vẽ 01/11; server/src/bon-chi-so.ts). Khoá:
//   · Đối phó: chọn khi chưa đọc hết đề mà sai + bấm lặp + luyện cao kiểm tra thấp ⇒ vào bảng; thẻ xếp từ mạnh tới nhẹ; chuỗi chữ bấm lặp + câu đúng; ví dụ có giờ / giây;
//   · Học thật: câu sai được sửa đúng (cùng câu / song sinh, không vội) + đọc kỹ + kiểm tra khớp ⇒ vào bảng, Đối phó < 30;
//   · Chăm: đủ mức mọi ngày + chuỗi; câu vội-sai KHÔNG tính chăm; Lười = 100 − Chăm; ngày không làm, lần cuối học;
//   · dưới 40 lượt đo thật ⇒ Học thật / Đối phó = null; dưới 3 ngày phải làm ⇒ Chăm / Lười = null;
//   · bấm lặp mà phần lớn đúng (đáp án thật trùng chữ) KHÔNG tính.
import { describe, expect, it } from 'vitest'
import { tinhBon, vaoBang, type DauVaoBon } from '../server/src/bon-chi-so'
import { danhGiaEm, type DauVaoDanhGia, type LuotDanhGia } from '../server/src/danh-gia-hoc-that'

const NGAY = Array.from({ length: 14 }, (_, i) => `2026-10-${String(18 + i).padStart(2, '0')}`).map((n) => (n > '2026-10-31' ? '2026-11-0' + (Number(n.slice(8)) - 31) : n))
const DEN = NGAY[13]!
let tick = 0
/** Một lượt: `ma` 1 = chọn khi chưa đọc hết đề; giây + T_đọc để ví dụ có số. */
const L = (o: Partial<LuotDanhGia> & { ngay: string }): LuotDanhGia => ({ phan: 'I', dung: true, ma: 3, r: 1.2, pLop: 0.6, chon: 'A', coGoiY: false, songSinh: false, luc: new Date(Date.parse(`${o.ngay}T01:00:00Z`) + ++tick * 10_000).toISOString(), cau: `C${tick}`, giay: 40, giayDoc: 16, qid: `Q${tick}`, ...o })
const dg = (luot: LuotDanhGia[], ktDiem: number[] = []) => {
  const dauVao: DauVaoDanhGia = { luot, ngayCuaSo: NGAY, ktcn: { daNop: ktDiem.length, boHan: 0, diem: ktDiem }, thi: [], gianLanXacNhan: 0 }
  return { kq: danhGiaEm(dauVao), dauVao }
}
const ngayDu = (muc = 36, lam = 36) => NGAY.map((ngay) => ({ ngay, muc, lam }))

describe('Học đối phó', () => {
  it('bấm vội mà sai + bấm lặp B ⇒ vào bảng; thẻ mạnh trước; ví dụ có giây; chuỗi chữ', () => {
    const luot: LuotDanhGia[] = []
    for (const n of NGAY.slice(0, 12)) {
      for (let i = 0; i < 8; i++) luot.push(L({ ngay: n, ma: 1, dung: i < 1, giay: 3, giayDoc: 16, chon: 'C' }))
      for (let i = 0; i < 8; i++) luot.push(L({ ngay: n, ma: 3, dung: i < 7 }))
    }
    for (let i = 0; i < 11; i++) luot.push(L({ ngay: NGAY[11]!, ma: 2, dung: i === 3 || i === 8, chon: 'B', giay: 7 }))
    const k = tinhBon({ dg: dg(luot, [3.5]), ngay: ngayDu(), lanCuoiHoc: DEN, den: DEN })
    expect(k.diem.dp).not.toBeNull()
    expect(k.diem.dp!).toBeGreaterThanOrEqual(50)
    expect(vaoBang(k.diem, 'dp')).toBe(true)
    expect(vaoBang(k.diem, 'ht')).toBe(false)
    expect(k.the.dp[0]!.ma).toBe('voi')
    expect(k.the.dp[0]!.viDu![0]!.kq).toMatch(/^chọn sau 3 giây · C · sai$/)
    expect(k.the.dp[0]!.viDu![0]!.phu).toBe('cần ít nhất 16 giây để đọc đề')
    const lap = k.the.dp.find((t) => t.ma === 'lap')!
    expect(lap.chuoi).toEqual({ chu: 'BBBBBBBBBBB', dung: [3, 8] })
    expect(k.bc.dp).toMatch(/\*\*\d+%\*\* câu chọn khi chưa đọc hết đề/)
    expect(k.ketLuan.dp).toContain('làm cho có')
    // thầy 01/11: hai lý do KHÔNG liền nhau — mỗi lý do một dòng, mở đầu bằng con số có đơn vị
    const dong = k.ketLuan.dp.split('\n')
    expect(dong[0]).toMatch(/^Em làm \d+\/\d+ ngày đủ mức nhưng làm cho có:$/)
    expect(dong.length).toBeGreaterThanOrEqual(3)
    for (const d of dong.slice(1)) expect(d).toMatch(/^\*\*[^*]+\*\* /)
    expect(dong.find((d) => d.includes('bấm cùng một chữ'))).toMatch(/^\*\*\d+ lần\*\* /)
  })
  it('luyện tập đúng ≥ 70% mà kiểm tra cá nhân TB ≤ 5 ⇒ thẻ «Luyện tập cao, kiểm tra thấp» (ô kiểm tra tô đỏ), cộng Đối phó', () => {
    const luot = NGAY.flatMap((n) => Array.from({ length: 10 }, (_, i) => L({ ngay: n, dung: i < 9 })))
    const khop = tinhBon({ dg: dg(luot, [8.5]), ngay: ngayDu(), lanCuoiHoc: DEN, den: DEN })
    const lech = tinhBon({ dg: dg(luot, [3.5]), ngay: ngayDu(), lanCuoiHoc: DEN, den: DEN })
    const t = lech.the.dp.find((x) => x.ma === 'lech')!
    expect(t.lon).toBe('90% → 3,5')
    expect(t.hai![1]).toMatchObject({ so: '3,5/10', lech: true })
    expect(lech.diem.dp! - khop.diem.dp!).toBeGreaterThanOrEqual(20) // v2: + họ «lệch kiểm tra» (mạnh)
    expect(khop.the.dp.some((x) => x.ma === 'lech')).toBe(false)
  })
  it('bấm cùng một chữ mà phần lớn ĐÚNG (đáp án thật trùng chữ) ⇒ không tính bấm lặp', () => {
    const luot = NGAY.flatMap((n) => Array.from({ length: 6 }, (_, i) => L({ ngay: n, chon: 'B', dung: i !== 0 })))
    const k = tinhBon({ dg: dg(luot), ngay: ngayDu(), lanCuoiHoc: DEN, den: DEN })
    expect(k.the.dp.some((t) => t.ma === 'lap')).toBe(false)
  })
})

describe('Học thật', () => {
  it('câu sai được sửa đúng (song sinh, không vội), đọc kỹ, kiểm tra khớp ⇒ vào bảng; ví dụ sửa câu', () => {
    const luot: LuotDanhGia[] = []
    NGAY.slice(0, 10).forEach((n, d) => {
      for (let i = 0; i < 6; i++) luot.push(L({ ngay: n, cau: `S${d}-${i}`, dung: i >= 2, giay: 45 }))
      for (let i = 0; i < 2; i++) luot.push(L({ ngay: NGAY[d + 2]!, cau: `S${d}-${i}`, songSinh: true, dung: true, giay: 50 }))
    })
    const k = tinhBon({ dg: dg(luot, [8.5, 8]), ngay: ngayDu(), lanCuoiHoc: DEN, den: DEN })
    expect(k.diem.ht!).toBeGreaterThanOrEqual(75)
    expect(k.diem.dp!).toBeLessThan(30)
    expect(vaoBang(k.diem, 'ht')).toBe(true)
    const sua = k.the.ht.find((t) => t.ma === 'sua')!
    expect(sua.lon).toMatch(/^\d+\/\d+$/)
    expect(sua.viDu![0]!.phu).toMatch(/^sai \d\d\/\d\d → làm lại câu song sinh khác số liệu \d\d\/\d\d$/)
    expect(k.the.ht.find((t) => t.ma === 'khop')!.hai![1]!.so).toBe('8,3/10')
    expect(k.ketLuan.ht).toMatch(/^Em học thật:\n\*\*\d+\/\d+ câu\*\* từng sai đã sửa đến khi đúng\n/) // mỗi lý do một dòng, số có đơn vị đứng đầu
  })
  it('dưới 40 lượt đo thật ⇒ Học thật / Đối phó chưa xếp (null)', () => {
    const luot = NGAY.slice(0, 3).flatMap((n) => Array.from({ length: 10 }, () => L({ ngay: n })))
    const k = tinhBon({ dg: dg(luot), ngay: ngayDu(), lanCuoiHoc: DEN, den: DEN })
    expect(k.diem.ht).toBeNull()
    expect(k.diem.dp).toBeNull()
    expect(vaoBang(k.diem, 'ht') || vaoBang(k.diem, 'dp')).toBe(false)
  })
})

describe('Chăm / Lười', () => {
  it('đủ mức 14/14 ngày, câu làm kỹ ⇒ Chăm vào bảng; chuỗi 14; Lười = 100 − Chăm', () => {
    const luot = NGAY.flatMap((n) => Array.from({ length: 36 }, () => L({ ngay: n })))
    const k = tinhBon({ dg: dg(luot), ngay: ngayDu(36, 38), lanCuoiHoc: DEN, den: DEN })
    expect(k.diem.ch).toBeGreaterThanOrEqual(95)
    expect(k.diem.lu).toBe(100 - k.diem.ch!)
    expect(vaoBang(k.diem, 'ch')).toBe(true)
    expect(k.the.ch.find((t) => t.ma === 'chuoi')!.lon).toBe('14')
    expect(k.bc.ch).toBe('Đủ mức **14/14** ngày · 532 câu')
  })
  it('làm đủ số câu nhưng phần lớn chọn vội mà sai ⇒ KHÔNG được chăm trọn', () => {
    const that = tinhBon({ dg: dg(NGAY.flatMap((n) => Array.from({ length: 36 }, () => L({ ngay: n })))), ngay: ngayDu(), lanCuoiHoc: DEN, den: DEN })
    const voi = tinhBon({ dg: dg(NGAY.flatMap((n) => Array.from({ length: 36 }, (_, i) => L({ ngay: n, ma: i < 30 ? 1 : 3, dung: i >= 30, giay: 3 })))), ngay: ngayDu(), lanCuoiHoc: DEN, den: DEN })
    expect(voi.diem.ch!).toBeLessThan(that.diem.ch!)
  })
  it('14 ngày không làm ⇒ Lười vào bảng, lần cuối học, câu chưa làm; cột 14 ngày toàn 0', () => {
    const k = tinhBon({ dg: dg([]), ngay: ngayDu(36, 0), lanCuoiHoc: '2026-10-12', den: DEN })
    expect(k.diem.lu).toBeGreaterThanOrEqual(99)
    expect(vaoBang(k.diem, 'lu')).toBe(true)
    expect(k.the.lu.map((t) => t.ma)).toEqual(['ngayCoLam', 'lanCuoi', 'cauLam'])
    expect(k.the.lu[0]!.lon).toBe('14/14')
    expect(k.the.lu[1]!.lon).toBe('12/10')
    expect(k.bc.lu).toBe('**14/14** ngày không làm · lần cuối 12/10')
    expect(k.ketLuan.lu.split('\n')).toEqual(['Em lười:', '**14/14 ngày** gần nhất không làm câu nào', '**12/10** là lần cuối em học', '**504 câu** được giao chưa làm'])
    expect(k.ngay.every((n) => n.ky === 0 && n.voi === 0)).toBe(true)
  })
  it('sổ học trống nhưng trong 14 ngày có làm ⇒ «lần cuối» = ngày cuối có làm, KHÔNG nói «chưa làm câu nào»', () => {
    const ngay = NGAY.map((n, i) => ({ ngay: n, muc: 36, lam: i === 2 || i === 4 ? 8 : 0 }))
    const k = tinhBon({ dg: dg([]), ngay, lanCuoiHoc: '', den: DEN })
    expect(k.the.lu.find((t) => t.ma === 'lanCuoi')!.lon).toBe('22/10')
    expect(k.ketLuan.lu).toContain('**22/10** là lần cuối em học')
    expect(k.ketLuan.lu).not.toContain('Chưa từng làm câu nào')
    const homNay = tinhBon({ dg: dg([]), ngay, lanCuoiHoc: '2026-11-01', den: '2026-10-31' })
    expect(homNay.the.lu.find((t) => t.ma === 'lanCuoi')!.nhoSo).toBe('hôm nay')
  })
  it('Đối phó mà 0 ngày đủ mức ⇒ kết luận «Em làm cho có: …» (không viết «0/14 ngày đủ mức nhưng…»)', () => {
    const luot = NGAY.flatMap((n) => Array.from({ length: 10 }, (_, i) => L({ ngay: n, ma: i < 7 ? 1 : 3, dung: i >= 7, giay: 3 })))
    const k = tinhBon({ dg: dg(luot), ngay: ngayDu(36, 10), lanCuoiHoc: DEN, den: DEN })
    expect(k.ketLuan.dp).toMatch(/^Em làm cho có:\n\*\*\d+%\*\* số câu/)
  })
  it('dưới 3 ngày phải làm ⇒ Chăm / Lười null', () => {
    const k = tinhBon({ dg: dg([]), ngay: ngayDu().slice(0, 2), lanCuoiHoc: '', den: DEN })
    expect(k.diem.ch).toBeNull()
    expect(k.diem.lu).toBeNull()
  })
})
