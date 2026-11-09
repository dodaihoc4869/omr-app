// @vitest-environment node
// RÚT CÂU MỚI THEO MA TRẬN ĐỀ 2026 (thầy 06/11: «Phần rút câu mới tôi muốn bạn rút theo đúng tỷ lệ ma trận đề thi 2026 theo mỗi ngày chứ không dễ trước
// khó sau nữa»). Khoá: số ma trận trùng bản máy thầy; ô của câu; mọi đoạn đầu bám ma trận; ô ít câu không dồn về cuối (đếm câu đã rút); Gói 7 và chiến
// dịch game rút đúng tỉ lệ mỗi ngày, KHÔNG đổi số câu; lập lại giữa ngày (em làm câu nào trước) không đổi phần câu mới còn lại.
import { describe, expect, it } from 'vitest'
import { MA_TRAN_RUT_MOI, demTheoO, oMaTran, xepTheoMaTran } from '../server/src/ma-tran-rut-moi'
import { MA_TRAN_HOA_2026 } from '../src/lib/ma-tran-hoa-2026'
import { chonGoi7, congNgay7, quotaGoi7, type CauGoi7 } from '../server/src/goi-bai-7-loi'
import { lapKeHoachNgay, phatLaiCau, type CauSrs, type HangEm, type TrangThaiCau } from '../server/src/srs2-loi'

const O = ['I|biet', 'I|hieu', 'I|van_dung', 'II|hieu', 'II|van_dung', 'III|hieu', 'III|van_dung'] as const
const W: Record<string, number> = { 'I|biet': 12, 'I|hieu': 4, 'I|van_dung': 2, 'II|hieu': 2, 'II|van_dung': 2, 'III|hieu': 3, 'III|van_dung': 3 }
const MUC_GOC: Record<string, string> = { biet: 'NB', hieu: 'TH', van_dung: 'VD' }

/** Kho `lan` lần đủ một đề 28 câu đúng ma trận (mã câu lẫn thứ tự để không trùng thứ tự ô). */
function khoDuMaTran(lan: number): { qid: string; phan: 'I' | 'II' | 'III'; mucDo: string }[] {
  const ra: { qid: string; phan: 'I' | 'II' | 'III'; mucDo: string }[] = []
  for (let l = 0; l < lan; l++) for (const o of O) for (let i = 0; i < W[o]!; i++) {
    const [p, m] = o.split('|') as ['I' | 'II' | 'III', string]
    ra.push({ qid: `${p}-${m}-${l}-${i}`, phan: p, mucDo: MUC_GOC[m]! })
  }
  return ra.sort((a, b) => (a.qid.split('').reverse().join('') < b.qid.split('').reverse().join('') ? -1 : 1))
}
const oCua = (c: { phan: string; mucDo: string | null }) => oMaTran(c.phan, c.mucDo)

describe('ma trận và ô của câu', () => {
  it('số ma trận Worker TRÙNG MA_TRAN_HOA_2026 của máy thầy', () => {
    for (const p of ['I', 'II', 'III'] as const) expect(MA_TRAN_RUT_MOI[p]).toEqual({ ...MA_TRAN_HOA_2026[p] })
    expect(Object.values(W).reduce((s, v) => s + v, 0)).toBe(28)
  })
  it('VDC gộp Vận dụng; chưa gắn mức ⇒ Hiểu; Phần II / Phần III Biết (trọng số 0 theo blueprint 09/11) ⇒ Hiểu — ô gần nhất cùng phần; phần lạ ⇒ Phần I', () => {
    expect(oMaTran('I', 'VDC')).toBe('I|van_dung')
    expect(oMaTran('III', 'Vận dụng cao')).toBe('III|van_dung')
    expect(oMaTran('I', null)).toBe('I|hieu')
    expect(oMaTran('I', 'lạ')).toBe('I|hieu')
    expect(oMaTran('II', 'NB')).toBe('II|hieu')
    expect(oMaTran(undefined, 'Nhận biết')).toBe('I|biet')
    expect(oMaTran('III', 'biet')).toBe('III|hieu')
  })
})

describe('xepTheoMaTran', () => {
  const kho = khoDuMaTran(5)
  const xep = xepTheoMaTran(kho, oCua)
  it('không mất, không thêm câu; thứ tự TRONG một ô giữ nguyên', () => {
    expect([...xep].sort((a, b) => a.qid.localeCompare(b.qid))).toEqual([...kho].sort((a, b) => a.qid.localeCompare(b.qid)))
    for (const o of O) expect(xep.filter((c) => oCua(c) === o)).toEqual(kho.filter((c) => oCua(c) === o))
  })
  it('mỗi 28 câu liền nhau đúng một đề ma trận; mọi đoạn đầu lệch tỉ lệ < 1 câu mỗi ô', () => {
    for (let d = 0; d < 5; d++) expect(Object.fromEntries(demTheoO(xep.slice(28 * d, 28 * (d + 1)), oCua))).toEqual(W)
    for (let k = 1; k <= xep.length; k++) {
      const n = demTheoO(xep.slice(0, k), oCua)
      for (const o of O) expect(Math.abs((n.get(o) ?? 0) - (W[o]! * k) / 28)).toBeLessThan(1)
    }
  })
  it('ô hết câu ⇒ tỉ lệ chia lại trên các ô còn câu; khoá lạ đứng cuối, không lặp vô hạn', () => {
    const it2 = [...kho.filter((c) => c.phan === 'I'), { qid: 'x', phan: 'I' as const, mucDo: 'NB' }]
    const r = xepTheoMaTran(it2, (c) => (c.qid === 'x' ? 'lạ' : oCua(c)))
    expect(r.at(-1)!.qid).toBe('x')
    const n = demTheoO(r.slice(0, 18), oCua)
    expect([n.get('I|biet'), n.get('I|hieu'), n.get('I|van_dung')]).toEqual([12, 4, 2])
  })
  it('đếm câu đã rút ⇒ ô ít câu (2/28: Phần I VD, Phần II Hiểu, Phần II VD) có mặt sớm, không dồn về ngày cuối', () => {
    // 5 ngày × 6 câu mới/ngày từ kho 5 đề: rút liên tục từng ngày, mỗi ngày tính lại từ phần còn lại.
    let con = [...kho]
    const da: typeof kho = []
    for (let ngay = 0; ngay < 14; ngay++) {
      const hom = xepTheoMaTran(con, oCua, demTheoO(da, oCua)).slice(0, 6)
      da.push(...hom)
      con = con.filter((c) => !hom.includes(c))
      const n = demTheoO(da, oCua)
      for (const o of O) expect(Math.abs((n.get(o) ?? 0) - (W[o]! * da.length) / 28)).toBeLessThan(1)
    }
    // Không đếm (mỗi ngày bắt đầu lại từ 0) thì ô 1/28 không bao giờ vào 6 câu đầu — đúng lỗi «khó sau» trá hình mà `daRut` chặn.
    expect(xepTheoMaTran(kho, oCua).slice(0, 6).some((c) => oCua(c) === 'II|van_dung')).toBe(false)
  })
})

describe('Gói 7 (chonGoi7)', () => {
  const cau: CauGoi7[] = khoDuMaTran(3).map((c) => ({ ...c, group: c.qid, maDe: 'x', version: 'v1', kho: c.mucDo === 'VD', tinhToan: c.phan === 'III', kyNang: ['a'] }))
  const ids = cau.map((c) => c.qid)
  const coBan = { cau, daLamNgay: new Set<string>(), sanSang: new Set(ids), chan: new Set<string>(), sua: [], on: [], ngay: '2026-11-06', chiTrongMuc: true }
  it('28 câu mới theo lịch = đúng một đề ma trận (không còn dễ trước khó sau); số câu không đổi', () => {
    const r = chonGoi7({ ...coBan, daGap: new Set(), quotaCon: 28, mucTieuNgay: 28 })
    expect(r.viec).toHaveLength(28)
    expect(r.viec.every((v) => v.vai === 'moi')).toBe(true)
    const theo = new Map(cau.map((c) => [c.qid, c]))
    expect(Object.fromEntries(demTheoO(r.viec.map((v) => theo.get(v.qid)!), oCua))).toEqual(W)
  })
  it('lịch 7 câu/ngày: cộng dồn các ngày bám ma trận; nhóm phụ (nhiều gói) cũng vậy', () => {
    const theo = new Map(cau.map((c) => [c.qid, c]))
    const daGap = new Set<string>()
    for (let ngay = 0; ngay < 6; ngay++) {
      const r = chonGoi7({ ...coBan, daGap: new Set(daGap), quotaCon: 0, mucTieuNgay: 7, nhomPhu: [{ qids: ids, quota: 7 }] })
      expect(r.viec).toHaveLength(7)
      for (const v of r.viec) daGap.add(v.qid)
      const n = demTheoO([...daGap].map((q) => theo.get(q)!), oCua)
      for (const o of O) expect(Math.abs((n.get(o) ?? 0) - (W[o]! * daGap.size) / 28)).toBeLessThan(1)
    }
  })
  it('lập lại giữa ngày: em làm 3 câu bất kỳ của kế hoạch (không theo thứ tự) ⇒ phần câu mới còn lại y hệt', () => {
    const truoc = new Set(ids.slice(0, 10)) // đã gặp những ngày trước
    const sang = chonGoi7({ ...coBan, daGap: new Set(truoc), quotaCon: 9, mucTieuNgay: 9, gapHomNay: new Set() })
    const lam = [sang.viec[7]!.qid, sang.viec[2]!.qid, sang.viec[4]!.qid]
    const hn = new Set(lam)
    const chieu = chonGoi7({ ...coBan, daGap: new Set([...truoc, ...lam]), daLamNgay: hn, quotaCon: 6, mucTieuNgay: 6, gapHomNay: hn })
    expect(chieu.viec.map((v) => v.qid)).toEqual(sang.viec.map((v) => v.qid).filter((q) => !hn.has(q)))
  })
})

describe('chiến dịch game (lapKeHoachNgay)', () => {
  const HAN = '2026-11-15'
  const cau: CauSrs[] = khoDuMaTran(4).map((c) => ({ ...c, dang: `D${c.qid.length % 3}` }))
  it('mỗi ngày câu mới rút sát ma trận, cộng dồn bám ma trận; tổng câu mới mỗi ngày = bản tắt ma trận', () => {
    const tt = new Map<string, TrangThaiCau>(cau.map((c) => [c.qid, phatLaiCau(c.qid, [], HAN)]))
    const ttCu = new Map(tt)
    const theo = new Map(cau.map((c) => [c.qid, c]))
    const da: CauSrs[] = []
    for (let k = 0; k < 6; k++) {
      const homNay = `2026-11-0${k + 1}`
      const kh = lapKeHoachNgay(cau, tt, { homNay, hanNop: HAN, tranNgay: 40, tranHuyetChien: 40, raiDeu: true })
      const cu = lapKeHoachNgay(cau, ttCu, { homNay, hanNop: HAN, tranNgay: 40, tranHuyetChien: 40, raiDeu: true, giuThuTuMoiCu: true })
      const moi = kh.dao.map((q) => theo.get(q)!).filter((c) => tt.get(c.qid)!.laMoi)
      expect(moi.length).toBe(cu.dao.filter((q) => ttCu.get(q)!.laMoi).length)
      expect(moi.length).toBeGreaterThan(0)
      for (const c of moi) tt.set(c.qid, { ...tt.get(c.qid)!, laMoi: false, henOn: null })
      for (const q of cu.dao) if (ttCu.get(q)!.laMoi) ttCu.set(q, { ...ttCu.get(q)!, laMoi: false, henOn: null })
      da.push(...moi)
      const n = demTheoO(da, oCua)
      for (const o of O) expect(Math.abs((n.get(o) ?? 0) - (W[o]! * da.length) / 28)).toBeLessThan(1)
    }
  })
})

// THẦY HỎI 06/11: «vẫn đảm bảo câu mới được phủ đúng hạn chứ» — ma trận chỉ đổi câu NÀO trong quota, quota vẫn chia số câu chưa gặp cho số ngày còn ⇒
// mọi câu mới vẫn được giao trước hạn. Khoá trên đường MA TRẬN (mặc định máy chủ), kho lệch ma trận (ô thiếu / ô thừa, câu chưa sẵn sàng).
describe('phủ câu mới đúng hạn trên đường ma trận', () => {
  /** Kho lệch hẳn ma trận: nhiều Phần III, ít Phần I Biết, có câu chưa gắn mức. */
  const khoLech = (n: number) => Array.from({ length: n }, (_, i) => ({
    qid: `L${String(i).padStart(3, '0')}`, phan: (['I', 'III', 'III', 'II', 'I'] as const)[i % 5], mucDo: ['VD', 'TH', null, 'NB', 'VDC', 'TH', 'VD'][i % 7] ?? null,
  }))
  it.each([[127, 7], [60, 3], [200, 10], [41, 1]])('Gói 7: kho %i câu, %i ngày — hết hạn thì đã gặp mọi câu (cả câu chưa sẵn sàng)', (n, soNgay) => {
    const cau: CauGoi7[] = khoLech(n).map((c) => ({ ...c, group: c.qid, maDe: 'x', version: 'v1', kho: false, tinhToan: false, kyNang: ['a'] }))
    const ids = cau.map((c) => c.qid)
    const sanSang = new Set(ids.filter((_, i) => i % 6 !== 0)) // 1/6 câu chưa sẵn sàng ⇒ vẫn phải được giao (tiếp cận)
    const batDau = '2026-11-06', han = congNgay7(batDau, soNgay - 1)
    const daGap = new Set<string>()
    for (let k = 0; k < soNgay; k++) {
      const ngay = congNgay7(batDau, k)
      const quota = quotaGoi7(n - daGap.size, ngay, han)
      const r = chonGoi7({ cau, daGap: new Set(daGap), daLamNgay: new Set(), quotaCon: 0, sanSang, chan: new Set(), sua: [], on: [], ngay, chiTrongMuc: true,
        mucTieuNgay: quota, nhomPhu: [{ qids: ids, quota }] })
      expect(r.viec.length).toBe(Math.min(quota, n - daGap.size))
      for (const v of r.viec) daGap.add(v.qid)
    }
    expect(daGap.size).toBe(n)
  })
  it.each([undefined, 'L1', 'L2', 'L3', 'L4'] as const)('chiến dịch game (hạng %s): mọi câu mới giao hết trước hạn − 3 ngày', (h) => {
    const HAN = '2026-11-15' // 10 ngày từ 06/11 ⇒ câu mới phải xong trước 13/11
    const cau: CauSrs[] = khoLech(170).map((c) => ({ ...c, dang: `D${c.qid.charCodeAt(3) % 3}` }))
    const tt = new Map<string, TrangThaiCau>(cau.map((c) => [c.qid, phatLaiCau(c.qid, [], HAN)]))
    const hang = h ? { hangTheoDang: { D0: h, D1: h, D2: h } as Record<string, HangEm>, hangChung: h as HangEm } : {}
    let k = 0
    for (; k < 10; k++) {
      const homNay = congNgay7('2026-11-06', k)
      const kh = lapKeHoachNgay(cau, tt, { homNay, hanNop: HAN, tranNgay: 40, tranHuyetChien: 40, raiDeu: true, ...hang })
      for (const q of kh.dao) if (tt.get(q)!.laMoi) tt.set(q, { ...tt.get(q)!, laMoi: false, henOn: null })
      if ([...tt.values()].every((t) => !t.laMoi)) break
    }
    expect([...tt.values()].filter((t) => t.laMoi).length).toBe(0)
    expect(k).toBeLessThanOrEqual(6) // xong muộn nhất ngày thứ 7 (12/11) — trước ba ngày ôn cuối
  })
})
