// RẢI ĐỀU CÂU MỚI THEO NGÀY (thầy chốt 30/09/2026) — luật thuần `lapKeHoachNgay`:
// BẬT ⇒ câu mới/ngày dừng đúng quota = ceil(số mới còn / (D − 3)), KHÔNG đổ thêm câu mới cho đủ thể lực; lượt dư dồn nợ/củng cố/duy trì (tỉ lệ cũ), vẫn dư thì thôi.
// TẮT / VẮNG ⇒ y hệt cũ (đổ câu mới cho đầy thể lực). Ngày cuối (D ≤ 3) vẫn đổ hết câu mới. Huyết Chiến chỉ nới nợ/ôn, câu mới vẫn theo quota.
// Bối cảnh thật: chiến dịch cd32010c1c2 — 120 câu, 7 ngày, thể lực 49: trước đây em chăm làm 49 câu MỚI/ngày, 120 câu hết trong ~2,5 ngày.
import { describe, expect, it } from 'vitest'
import { lapKeHoachNgay, phatLaiCau, type CauSrs, type LanLam, type TrangThaiCau } from '../server/src/srs2-loi'

const HAN = '2026-10-05'
const cau = (qid: string, phan: CauSrs['phan'] = 'I', nguon?: CauSrs['nguon']): CauSrs => ({ qid, phan, mucDo: ['NB', 'TH', 'VD'][qid.length % 3]!, dang: 'D1', ...(nguon ? { nguon } : {}) })
const lan = (qid: string, ngay: string, dung: boolean): LanLam => ({ qid, ngay, luc: `${ngay}T03:00:00Z`, dung, coGoiY: false })
const moi = (qid: string): TrangThaiCau => phatLaiCau(qid, [], HAN)
/** Câu nợ: sai hôm qua ⇒ tới lịch hôm nay. */
const no = (qid: string, homNay: string): TrangThaiCau => phatLaiCau(qid, [lan(qid, congNgay(homNay, -1), false)], HAN)
function congNgay(ngay: string, n: number): string {
  return new Date(Date.parse(`${ngay}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10)
}
/** Bộ câu: `soMoi` câu mới chiến dịch + `soNo` câu nợ chiến dịch (đã sai hôm qua). */
function bo(soMoi: number, soNo: number, homNay: string) {
  const cs: CauSrs[] = []
  const tt = new Map<string, TrangThaiCau>()
  for (let i = 0; i < soMoi; i++) { const q = `m${i}`; cs.push(cau(q)); tt.set(q, moi(q)) }
  for (let i = 0; i < soNo; i++) { const q = `n${i}`; cs.push(cau(q, 'I')); tt.set(q, no(q, homNay)) }
  return { cs, tt }
}
const demMoi = (ds: readonly string[]) => ds.filter((q) => q.startsWith('m')).length
const demNo = (ds: readonly string[]) => ds.filter((q) => q.startsWith('n')).length
const tatCa = (kh: { dao: string[]; doan: string[] }) => [...kh.dao, ...kh.doan]

describe('rải đều câu mới theo ngày (thầy 30/09)', () => {
  it('(a) BẬT: 120 câu mới / 7 ngày / thể lực 49 ⇒ ngày 1 đúng 30 câu mới (ceil(120/4)), không 49', () => {
    const { cs, tt } = bo(120, 0, '2026-09-29')
    const kh = lapKeHoachNgay(cs, tt, { homNay: '2026-09-29', hanNop: HAN, tranNgay: 49, raiDeu: true })
    expect(kh.D).toBe(7)
    expect(kh.raiDeu).toBe(true)
    expect(kh.dao).toHaveLength(30)
    expect(kh.doan).toEqual([])
  })
  it('(b) TẮT hoặc VẮNG raiDeu ⇒ 49 như cũ (đổ câu mới cho đầy thể lực)', () => {
    const { cs, tt } = bo(120, 0, '2026-09-29')
    const tc = { homNay: '2026-09-29', hanNop: HAN, tranNgay: 49 }
    expect(lapKeHoachNgay(cs, tt, tc).dao).toHaveLength(49)
    expect(lapKeHoachNgay(cs, tt, { ...tc, raiDeu: false }).dao).toHaveLength(49)
    expect(lapKeHoachNgay(cs, tt, tc).raiDeu).toBe(false)
  })
  it('(c) BẬT: em 11084 ngày 2 — còn 25 câu mới, D = 6, 10 nợ ⇒ 9 câu mới + 10 nợ = 19 lượt (< thể lực 49 là bình thường)', () => {
    const { cs, tt } = bo(25, 10, '2026-09-30')
    const kh = lapKeHoachNgay(cs, tt, { homNay: '2026-09-30', hanNop: HAN, tranNgay: 49, raiDeu: true })
    expect(kh.D).toBe(6)
    const ds = tatCa(kh)
    expect(demMoi(ds)).toBe(9)
    expect(demNo(ds)).toBe(10)
    expect(ds).toHaveLength(19)
  })
  it('(c2) BẬT: đủ quota câu mới ⇒ lượt dư dồn cho nợ vượt trần 50 % (chữ màn Giao "lượt dư trong ngày dùng để ôn"); TẮT ⇒ nợ 50 %, câu mới lấp đầy', () => {
    const { cs, tt } = bo(25, 30, '2026-09-30')
    const bat = lapKeHoachNgay(cs, tt, { homNay: '2026-09-30', hanNop: HAN, tranNgay: 49, raiDeu: true })
    expect(demMoi(tatCa(bat))).toBe(9)
    expect(demNo(tatCa(bat))).toBe(30) // 24 (50 %) + 6 lấp chỗ dư — hết nợ tới lịch
    expect(tatCa(bat)).toHaveLength(39)
    const tat = lapKeHoachNgay(cs, tt, { homNay: '2026-09-30', hanNop: HAN, tranNgay: 49 })
    expect(demNo(tatCa(tat))).toBe(24)
    expect(demMoi(tatCa(tat))).toBe(25)
    expect(tatCa(tat)).toHaveLength(49)
  })
  it('(c3) phản biện vòng 2 #110: BẬT, ngày 01/10 — 24 câu mới, 40 nợ tới lịch, thể lực 49 ⇒ 12 mới + 37 nợ = 49 (không bỏ trống 13 lượt khi còn nợ)', () => {
    const { cs, tt } = bo(24, 40, '2026-10-01')
    const bat = lapKeHoachNgay(cs, tt, { homNay: '2026-10-01', hanNop: HAN, tranNgay: 49, raiDeu: true })
    expect(demMoi(tatCa(bat))).toBe(12) // ceil(24 / (5 − 3))
    expect(demNo(tatCa(bat))).toBe(37)
    expect(tatCa(bat)).toHaveLength(49)
  })
  it('(c4) phản biện vòng 2 #110 [NẶNG]: BẬT, ngày ôn (D = 2) còn sót 1 câu mới + 40 nợ ⇒ 1 mới + 40 nợ (như TẮT), không kẹp nợ 50 %', () => {
    const { cs, tt } = bo(1, 40, '2026-10-04')
    const bat = lapKeHoachNgay(cs, tt, { homNay: '2026-10-04', hanNop: HAN, tranNgay: 49, raiDeu: true })
    const tat = lapKeHoachNgay(cs, tt, { homNay: '2026-10-04', hanNop: HAN, tranNgay: 49 })
    expect(bat.D).toBe(2)
    expect(demMoi(tatCa(bat))).toBe(1)
    expect(demNo(tatCa(bat))).toBe(40)
    expect(tatCa(bat)).toHaveLength(tatCa(tat).length)
  })
  it('(d) BẬT: D ≤ 3 ⇒ đổ hết câu mới còn lại (giữ luật ngày cuối)', () => {
    const { cs, tt } = bo(25, 0, '2026-10-03')
    const kh = lapKeHoachNgay(cs, tt, { homNay: '2026-10-03', hanNop: HAN, tranNgay: 49, raiDeu: true })
    expect(kh.D).toBe(3)
    expect(kh.dao).toHaveLength(25)
  })
  it('(e) BẬT + Huyết Chiến (khối lượng > 0,9·D·trần): trần gấp đôi chỉ nới nợ/ôn, câu mới vẫn = quota 30', () => {
    const { cs, tt } = bo(120, 10, '2026-09-29')
    const tc = { homNay: '2026-09-29', hanNop: HAN, tranNgay: 25, tranHuyetChien: 50 }
    const bat = lapKeHoachNgay(cs, tt, { ...tc, raiDeu: true })
    expect(bat.huyetChien).toBe(true)
    expect(bat.tran).toBe(50)
    expect(demMoi(tatCa(bat))).toBe(30)
    expect(demNo(tatCa(bat))).toBe(10)
    const tat = lapKeHoachNgay(cs, tt, tc)
    expect(demMoi(tatCa(tat))).toBe(40) // cũ: đổ câu mới cho đầy trần Huyết Chiến
  })
  it('(f) BẬT: còn 1 câu mới ⇒ quota tối thiểu 1', () => {
    const { cs, tt } = bo(1, 0, '2026-09-29')
    expect(lapKeHoachNgay(cs, tt, { homNay: '2026-09-29', hanNop: HAN, tranNgay: 49, raiDeu: true }).dao).toEqual(['m0'])
  })
  it('(g) BẬT, lập LẠI giữa ngày: quota hôm nay trừ câu mới đã làm (`moiDaLamHomNay`) — làm đủ 30 ⇒ 0 câu mới thêm; làm 29 ⇒ thêm đúng 1', () => {
    const { cs, tt } = bo(90, 0, '2026-09-29') // 120 câu, 30 đã làm hôm nay ⇒ 90 mới còn
    const tc = { homNay: '2026-09-29', hanNop: HAN, tranNgay: 49, raiDeu: true }
    expect(lapKeHoachNgay(cs, tt, { ...tc, moiDaLamHomNay: 30 }, 30).dao).toHaveLength(0)
    expect(lapKeHoachNgay(cs, tt, { ...tc, moiDaLamHomNay: 29 }, 29).dao).toHaveLength(1)
    // TẮT: `moiDaLamHomNay` không có tác dụng — vẫn đổ cho đầy phần thể lực còn lại
    expect(lapKeHoachNgay(cs, tt, { ...tc, raiDeu: false, moiDaLamHomNay: 30 }, 30).dao).toHaveLength(19)
  })
  it('sucChua = D × trần ngày không đổi giữa bật/tắt (đồng hồ sức chứa giữ công thức)', () => {
    const { cs, tt } = bo(120, 0, '2026-09-29')
    const tc = { homNay: '2026-09-29', hanNop: HAN, tranNgay: 49 }
    expect(lapKeHoachNgay(cs, tt, { ...tc, raiDeu: true }).sucChua).toBe(lapKeHoachNgay(cs, tt, tc).sucChua)
  })
})
