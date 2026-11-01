// @vitest-environment node
// Đợt 2 đánh giá 99% (01/11): máy chủ nhận / lưu / đọc lại / dùng các số đo mới trong lượt luyện tập — dd đổi lựa chọn · dq số phương án đã thử ·
// rn số lần rời app · ar giây rời app ngay trước lựa chọn cuối · tb mã máy luyện tập. Khoá:
//   · làm sạch: số nguyên không âm, kẹp trần; tb ≤ 32 kí tự [A-Za-z0-9_-]; sai khuôn ⇒ bỏ đúng trường đó; chỉ nhận khi có giây ĐO THẬT (như cụm treo máy);
//   · lưu phẳng vào `raw_json.doc` (không đè khoá cũ) và `docDoMuc` đọc lại đúng; bản ghi cũ không có ⇒ không có trường;
//   · lõi 4 bảng: họ Đối phó «dò đáp án» (≥ 5 lượt và ≥ 10% ⇒ nhẹ; ≥ 10 và ≥ 20% ⇒ mạnh; kiểm tra khớp ⇒ nhẹ) + thẻ + dòng kết luận;
//     «tra ngoài» dùng `ar ≥ 6` khi có, luật cũ (tổng giây ẩn ≥ 8) khi chưa đo.
import { describe, expect, it } from 'vitest'
import { boSungKichThuocDe, docDoGiayMot, docDoGiayNhieu, ghepDocVaoRaw, lamSachDo, lamSachHanhVi, phanSoCuaDo } from '../server/src/do-giay-luot'
import { docDoMuc } from '../server/src/muc-lam-so'
import { tinhBon } from '../server/src/bon-chi-so'
import { danhGiaEm, type DauVaoDanhGia, type LuotDanhGia } from '../server/src/danh-gia-hoc-that'

describe('lamSachHanhVi — làm sạch từng trường', () => {
  it('nhận số nguyên không âm, làm tròn, kẹp trần (dd 99, dq 4, rn 99, ar 30)', () => {
    expect(lamSachHanhVi({ dd: 2, dq: 3, rn: 1, ar: 7, tb: 'a1B2_c-3' })).toEqual({ dd: 2, dq: 3, rn: 1, ar: 7, tb: 'a1B2_c-3' })
    expect(lamSachHanhVi({ dd: 2.6, dq: 9, rn: 500, ar: 45 })).toEqual({ dd: 3, dq: 4, rn: 99, ar: 30 })
    expect(lamSachHanhVi({ dd: 0, dq: 0, rn: 0, ar: 0 })).toEqual({ dd: 0, dq: 0, rn: 0, ar: 0 })
  })
  it('sai khuôn ⇒ bỏ đúng trường đó, trường khác vẫn nhận; không còn gì ⇒ null', () => {
    expect(lamSachHanhVi({ dd: -1, dq: '3', rn: NaN, ar: Infinity, tb: 'x' })).toEqual({ tb: 'x' })
    expect(lamSachHanhVi({ dd: null, dq: true, rn: {}, ar: [] })).toBeNull()
    expect(lamSachHanhVi({})).toBeNull()
  })
  it('tb: chỉ [A-Za-z0-9_-], 1–32 kí tự (không nhận IP / dấu cách / chuỗi dài)', () => {
    expect(lamSachHanhVi({ tb: 'a'.repeat(32) })).toEqual({ tb: 'a'.repeat(32) })
    expect(lamSachHanhVi({ tb: 'a'.repeat(33) })).toBeNull()
    expect(lamSachHanhVi({ tb: '192.168.1.1' })).toBeNull()
    expect(lamSachHanhVi({ tb: 'ab cd' })).toBeNull()
    expect(lamSachHanhVi({ tb: '' })).toBeNull()
    expect(lamSachHanhVi({ tb: 12345 })).toBeNull()
  })
})

describe('lamSachDo / ghepDocVaoRaw / docDoMuc — đi trọn đường lưu', () => {
  it('có giây đo thật ⇒ nhận cụm hành vi; không có giây ⇒ bỏ (như cụm treo máy)', () => {
    expect(lamSachDo({ g: 20, v: 25, a: 3, l: 10, dd: 2, dq: 3, rn: 1, ar: 3, tb: 'abc' })?.hv).toEqual({ dd: 2, dq: 3, rn: 1, ar: 3, tb: 'abc' })
    expect(lamSachDo({ g: 0, t: 30, dd: 2 })?.hv).toBeUndefined()
    expect(lamSachDo({ g: 20 })?.hv).toBeUndefined()
    expect(lamSachDo({ g: 14.4, t: 46, h: 0, p: 'I' })).toEqual({ giay: 14, tu: 46, hinh: 0, phan: 'I', dh: 1 }) // bản cũ: y nguyên
  })
  it('đường lệnh một câu (game) và nhiều câu giữ cụm hành vi; đường lùi `msLam` cũ thì không', () => {
    expect(docDoGiayMot({ doGiay: { g: 9, dd: 1, dq: 2 } }, { ms: 99_000 })?.hv).toEqual({ dd: 1, dq: 2 })
    expect(docDoGiayMot({}, { ms: 12_000 })?.hv).toBeUndefined()
    expect(docDoGiayNhieu({ doGiay: { q1: { g: 9, rn: 2, ar: 0 } } }).get('q1')?.hv).toEqual({ rn: 2, ar: 0 })
  })
  it('ghi phẳng vào raw.doc cạnh khoá cũ; docDoMuc đọc lại đúng; bản ghi cũ không có trường', () => {
    const d = boSungKichThuocDe(docDoGiayMot({ doGiay: { g: 30, v: 32, a: 4, l: 9, n: 0, w: 1, dd: 3, dq: 3, rn: 1, ar: 4, tb: 'm4yA' } }), 'I', { phan: 'I', content: 'Chất nào sau đây là axit?', choices: ['A', 'B', 'C', 'D'] })
    const ps = phanSoCuaDo(d, { chon: 'B' })
    const raw = ps.raw as { chon: string; doc: Record<string, unknown> }
    expect(ps.giay).toBe(30)
    expect(raw.chon).toBe('B')
    expect(raw.doc).toMatchObject({ dh: 1, p: 'I', v: 32, a: 4, l: 9, n: 0, w: 1, dd: 3, dq: 3, rn: 1, ar: 4, tb: 'm4yA' })
    const m = docDoMuc(raw)!
    expect(m).toMatchObject({ phan: 'I', treo: { v: 32, a: 4, l: 9, n: 0, w: 1 }, dd: 3, dq: 3, rn: 1, ar: 4, tb: 'm4yA' })
    const cu = docDoMuc({ doc: { t: 40, p: 'I', dh: 1, v: 30, a: 0, l: 5 } })!
    for (const k of ['dd', 'dq', 'rn', 'ar', 'tb']) expect(k in cu).toBe(false)
  })
  it('giây không phải của đồng hồ mới (không có dh) ⇒ không ghi cụm hành vi', () => {
    const raw = ghepDocVaoRaw(undefined, { giay: 9, tu: 20, hinh: 0, phan: 'I', hv: { dd: 2 } }) as { doc: Record<string, unknown> }
    expect(raw.doc.dd).toBeUndefined()
  })
})

// ───────── Lõi 4 bảng
const NGAY = Array.from({ length: 14 }, (_, i) => `2026-10-${String(18 + i)}`)
const DEN = NGAY[13]!
let tick = 0
const L = (o: Partial<LuotDanhGia> = {}): LuotDanhGia => {
  const ngay = o.ngay ?? NGAY[tick % 12]!
  return { phan: 'I', dung: true, ma: 3, r: 1.5, pLop: 0.5, chon: 'ABCD'[tick % 4]!, coGoiY: false, songSinh: false, ngay, luc: new Date(Date.parse(`${ngay}T08:00:00Z`) + ++tick * 60_000).toISOString(), cau: `C${tick}`, qid: `Q${tick}`, giay: 40, giayDoc: 16, an: 0, ...o }
}
const em = (luot: LuotDanhGia[], kt: number[] = []) => {
  const dauVao: DauVaoDanhGia = { luot, ngayCuaSo: NGAY, ktcn: { daNop: kt.length, boHan: 0, diem: kt }, thi: [], gianLanXacNhan: 0 }
  return tinhBon({ dg: { kq: danhGiaEm(dauVao), dauVao }, ngay: NGAY.map((ngay) => ({ ngay, muc: 10, lam: 10 })), lanCuoiHoc: DEN, den: DEN })
}
/** `n` lượt Phần I có đo dq, `doN` lượt trong số đó dò (dq 3); `khongDo` lượt chưa đo (bản cũ). */
const luotDo = (n: number, doN: number, khongDo = 0) => [
  ...Array.from({ length: n }, (_, i) => L(i < doN ? { dq: 3, dd: 3 } : { dq: 1, dd: 0 })),
  ...Array.from({ length: khongDo }, () => L()),
]

describe('họ Đối phó «dò đáp án»', () => {
  it('ngưỡng: < 5 lượt hoặc < 10% ⇒ không; ≥ 5 và ≥ 10% ⇒ nhẹ; ≥ 10 và ≥ 20% ⇒ mạnh', () => {
    expect(em(luotDo(50, 4)).soLieu.ho?.do).toBeUndefined()
    expect(em(luotDo(60, 5)).soLieu.ho?.do).toBeUndefined() // 8%
    expect(em(luotDo(50, 5)).soLieu.ho?.do).toBe(1)
    expect(em(luotDo(50, 9)).soLieu.ho?.do).toBe(1) // < 10 lượt
    expect(em(luotDo(60, 10)).soLieu.ho?.do).toBe(1) // 17%
    expect(em(luotDo(50, 10)).soLieu.ho?.do).toBe(2)
  })
  it('mẫu chỉ gồm lượt Phần I CÓ đo dq — lượt cũ chưa đo không làm loãng; Phần II / III không tính', () => {
    const k = em([...luotDo(40, 10, 100), ...Array.from({ length: 30 }, () => L({ phan: 'II', dq: 4, dd: 4 }))])
    expect(k.soLieu.ho?.do).toBe(2)
    expect(k.soLieu.do).toBe(25)
    expect(em(luotDo(0, 0, 60)).soLieu.do).toBeNull()
  })
  it('kiểm tra cá nhân KHỚP luyện tập ⇒ chỉ nhẹ', () => {
    expect(em(luotDo(50, 12), [9.5]).soLieu.ho?.do).toBe(1)
  })
  it('thẻ «Dò đáp án» (ví dụ mới nhất trước) + dòng kết luận có con số in đậm', () => {
    const k = em(luotDo(50, 12))
    const t = k.the.dp.find((x) => x.ma === 'do')!
    expect(t).toMatchObject({ tieu: 'Dò đáp án', lon: '12/50', so: 24 })
    expect(t.viDu).toHaveLength(3)
    expect(t.viDu![0]!.phu).toBe('thử 3 phương án, đổi 3 lần trước khi bấm Kiểm tra')
    expect(t.viDu![0]!.kq).toMatch(/^chốt [ABCD] · đúng$/)
    expect(t.viDu![0]!.luc > t.viDu![1]!.luc).toBe(true)
    expect(k.ketLuan.dp).toContain('**12 lượt** dò đáp án — thử từ 3 phương án trở lên')
    expect(k.the.dp[0]!.ma).toBe('do')
    expect(k.bc.dp).toBe('**12 lượt** dò đáp án')
  })
  it('dò + luyện cao mà kiểm tra thấp ⇒ vào Đối phó; em thật đổi một lần (dq 2) ⇒ không', () => {
    const doVao = em(luotDo(50, 15), [2.5])
    expect(doVao.soLieu.ho).toMatchObject({ do: 2, lech: 2 })
    expect(doVao.soLieu.vao?.dp).toBe(true)
    const that = em(Array.from({ length: 50 }, (_, i) => L(i % 5 === 0 ? { dq: 2, dd: 1 } : { dq: 1, dd: 0 })))
    expect(that.soLieu.ho?.do).toBeUndefined()
    expect(that.soLieu.do).toBe(0)
  })
})

describe('«tra ngoài» dùng ar (rời app ngay trước khi chọn) khi có', () => {
  const traNgoai = (luot: LuotDanhGia[]) => em(luot).soLieu.traNgoai
  it('có ar: rời 20 giây lúc đọc đề nhưng ar = 0 ⇒ KHÔNG tính; ar ≥ 6 ⇒ tính; ẩn ≥ 180 giây ⇒ không', () => {
    const nen = Array.from({ length: 40 }, () => L({ ar: 0 }))
    expect(traNgoai([...nen, ...Array.from({ length: 10 }, () => L({ an: 20, ar: 0 }))])).toBe(0)
    expect(traNgoai([...nen, ...Array.from({ length: 10 }, () => L({ an: 20, ar: 5 }))])).toBe(0)
    expect(traNgoai([...nen, ...Array.from({ length: 10 }, () => L({ an: 7, ar: 6 }))])).toBe(20)
    expect(traNgoai([...nen, ...Array.from({ length: 10 }, () => L({ an: 200, ar: 30 }))])).toBe(0)
  })
  it('chưa đo ar (lượt cũ) ⇒ luật cũ: tổng giây ẩn 8–179', () => {
    const nen = Array.from({ length: 40 }, () => L())
    expect(traNgoai([...nen, ...Array.from({ length: 10 }, () => L({ an: 20 }))])).toBe(20)
    expect(traNgoai([...nen, ...Array.from({ length: 10 }, () => L({ an: 7 }))])).toBe(0)
  })
  it('câu dễ (lớp đúng ≥ 60%) không tính ở cả hai luật', () => {
    expect(traNgoai([...Array.from({ length: 40 }, () => L()), ...Array.from({ length: 10 }, () => L({ an: 20, ar: 10, pLop: 0.8 }))])).toBe(0)
  })
})
