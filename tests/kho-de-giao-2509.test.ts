// KHO ĐỀ GIAO THEO TUẦN (`src/lib/kho-de-giao.ts`) — khoá LÕI THUẦN (thầy chốt 26/09/2026).
//
// Bảy điều phải luôn đúng:
//   1. docKhoDeGiao: parse + kiểm; deadline < 7 ngày ⇒ lỗi (trần cứng).
//   2. dangTrongHan: now < deadline; deadline hỏng ⇒ false.
//   3. locCauTheoKhoDe: chỉ giữ câu trong kho đề ĐÃ CHỌN và rút được (lọc tự luận).
//   4. ngayOnKe: sai +1/+3/+7; đúng +3; đủ 2 lần đúng liên tiếp ⇒ null (thông thạo).
//   5. tyLeThongThao + trangThaiEm: ngưỡng 90 %; nhánh "lười".
//   6. keHoachCoXat: cọ sát 100 %, dồn, "em đã quá lười biếng", tất định.
//   7. keHoachCoXat: chịu đầu vào rỗng/hỏng, không bịa.
import { describe, expect, it } from 'vitest'
import {
  dangTrongHan,
  docKhoDeGiao,
  keHoachCoXat,
  locCauTheoKhoDe,
  ngayOnKe,
  trangThaiEm,
  tyLeThongThao,
  type HoSoCauGiao,
} from '../src/lib/kho-de-giao'

const MA_DE = 'DH-12-C1-B2-TN'
const GOC = {
  ma: 'kho_de_giao',
  bat: true,
  khoi: 12,
  lop: '12 - Tinh Hoa',
  sbd: ['1201', '1202'],
  maDe: [MA_DE],
  giaoLuc: '2026-10-01T08:00:00+07:00',
  deadline: '2026-10-15T23:59:59+07:00',
}
const NAY = Date.parse('2026-10-01T08:00:00+07:00')
const HAN = '2026-10-11T23:59:59+07:00' // 11 ngày học kể từ 01/10
const cauTrongDe = (qid: string) => ({ qid, maDe: MA_DE, phan: 'I', text: `Câu ${qid}?`, choices: ['A', 'B', 'C', 'D'], correct: 'A' })
const cauTuLuan = (qid: string) => ({ qid, maDe: MA_DE, phan: 'III', text: 'Theo em, vì sao có hiện tượng này?' })
const hs = (o: Partial<HoSoCauGiao> = {}): HoSoCauGiao => ({ lanGap: 0, dungLienTiep: 0, ketQuaCuoi: null, ...o })
const hoSoCua = (pairs: [string, Partial<HoSoCauGiao>][]) => new Map(pairs.map(([q, o]) => [q, hs(o)]))
const dsCau = (n: number, giay?: number) => Array.from({ length: n }, (_, i) => (giay !== undefined ? { qid: `Q${i}`, giay } : { qid: `Q${i}` }))

describe('docKhoDeGiao — đọc + kiểm cấu hình', () => {
  it('nhận đối tượng và chuỗi JSON; khối chuỗi "11" đọc được', () => {
    const a = docKhoDeGiao(GOC)
    expect(a.ok).toBe(true)
    if (a.ok) {
      expect(a.cfg.khoi).toBe(12)
      expect(a.cfg.sbd).toEqual(['1201', '1202'])
      expect(a.cfg.maDe).toEqual([MA_DE])
    }
    const b = docKhoDeGiao(JSON.stringify({ ...GOC, khoi: '11' }))
    expect(b.ok && b.cfg.khoi).toBe(11)
  })

  it('deadline dưới 7 ngày ⇒ LỖI (trần cứng)', () => {
    const r = docKhoDeGiao({ ...GOC, deadline: '2026-10-06T00:00:00+07:00' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toContain('tối thiểu 7 ngày')
  })

  it('thiếu em / thiếu nguồn đề / khối sai / JSON hỏng / để trống ⇒ LỖI rõ', () => {
    expect(docKhoDeGiao({ ...GOC, sbd: [] }).ok).toBe(false)
    expect(docKhoDeGiao({ ...GOC, maDe: [] }).ok).toBe(false)
    expect(docKhoDeGiao({ ...GOC, khoi: 9 }).ok).toBe(false)
    expect(docKhoDeGiao('khong-phai-json').ok).toBe(false)
    expect(docKhoDeGiao('').ok).toBe(false)
  })
})

describe('dangTrongHan — còn trong hạn?', () => {
  it('now < deadline ⇒ true; quá hạn / deadline hỏng ⇒ false', () => {
    expect(dangTrongHan({ now: NAY, deadline: HAN })).toBe(true)
    expect(dangTrongHan({ now: Date.parse('2026-10-12T00:00:00+07:00'), deadline: HAN })).toBe(false)
    expect(dangTrongHan({ now: NAY, deadline: 'khong-phai-ngay' })).toBe(false)
  })
})

describe('locCauTheoKhoDe — chỉ câu trong kho đề, lọc tự luận', () => {
  it('giữ câu trong đề + rút được; loại ngoài đề, tự luận, không rõ mã đề', () => {
    const ngoai = { ...cauTrongDe('NGOAI'), maDe: 'DH-12-C2-B3-TN' }
    const khongRo = { qid: 'XR', phan: 'I', text: 'x', choices: ['A', 'B', 'C', 'D'], correct: 'A' }
    const r = locCauTheoKhoDe({ cau: [cauTrongDe('Q1'), cauTuLuan('TL1'), ngoai, khongRo], maDe: [MA_DE] })
    expect(r.giu.map((c) => c.qid)).toEqual(['Q1'])
    expect(r.bo.map((x) => x.cau.qid)).toEqual(['TL1', 'NGOAI', 'XR'])
    expect(r.bo[0]!.lyDo).toContain('hỏi mở')
    expect(r.bo[1]!.lyDo).toContain('ngoài kho đề')
    expect(r.bo[2]!.lyDo).toContain('không rõ mã đề')
  })
})

describe('ngayOnKe — lịch lặp sai +1/+3/+7, đúng +3', () => {
  const nay = '2026-10-01'
  it('sai leo +1/+3/+7 rồi kẹp ở +7', () => {
    expect(ngayOnKe({ ngayHomNay: nay, dung: false, dungLienTiep: 0, saiLienTiep: 0 })).toBe('2026-10-02')
    expect(ngayOnKe({ ngayHomNay: nay, dung: false, dungLienTiep: 0, saiLienTiep: 1 })).toBe('2026-10-04')
    expect(ngayOnKe({ ngayHomNay: nay, dung: false, dungLienTiep: 0, saiLienTiep: 2 })).toBe('2026-10-08')
    expect(ngayOnKe({ ngayHomNay: nay, dung: false, dungLienTiep: 0, saiLienTiep: 8 })).toBe('2026-10-08')
  })
  it('đúng +3; đủ 2 lần đúng liên tiếp ⇒ null (thông thạo)', () => {
    expect(ngayOnKe({ ngayHomNay: nay, dung: true, dungLienTiep: 0, saiLienTiep: 0 })).toBe('2026-10-04')
    expect(ngayOnKe({ ngayHomNay: nay, dung: true, dungLienTiep: 1, saiLienTiep: 0 })).toBeNull()
  })
})

describe('tyLeThongThao + trangThaiEm', () => {
  it('thông thạo = đúng ≥ 2 lần liên tiếp; rỗng ⇒ 0', () => {
    expect(tyLeThongThao({ dsQid: [], hoSo: new Map<string, HoSoCauGiao>() })).toBe(0)
    const r = tyLeThongThao({ dsQid: ['a', 'b', 'c', 'd'], hoSo: hoSoCua([['a', { dungLienTiep: 2 }], ['b', { dungLienTiep: 1 }], ['c', { dungLienTiep: 3 }]]) })
    expect(r).toBe(0.5)
  })
  it('trạng thái: lười ⇒ kết thúc; ≥ 90 % ⇒ hoàn thành; còn lại ⇒ đang học', () => {
    expect(trangThaiEm({ tyLe: 0.9 })).toBe('hoan_thanh')
    expect(trangThaiEm({ tyLe: 0.89 })).toBe('dang_hoc')
    expect(trangThaiEm({ tyLe: 1, luoi: true })).toBe('ket_thuc_luoi')
  })
})

describe('keHoachCoXat — cọ sát 100 %, tất định', () => {
  it('10 câu chưa gặp ⇒ mọi câu xuất hiện, không dồn, đang học', () => {
    const kq = keHoachCoXat({ now: NAY, deadline: HAN, cau: dsCau(10), hoSo: new Map<string, HoSoCauGiao>() })
    const co = new Set(kq.ngay.flatMap((d) => d.cau))
    expect(co.size).toBe(10)
    expect(kq.tongLuot).toBe(20)
    expect(kq.luotXepDuoc).toBe(20)
    expect(kq.luoi).toBe(false)
    expect(kq.trangThai).toBe('dang_hoc')
    expect(kq.ngay[0]!.moi).toBe(10)
  })
  it('gọi hai lần ra ĐÚNG một lịch (tất định)', () => {
    const v = { now: NAY, deadline: HAN, cau: dsCau(30), hoSo: new Map<string, HoSoCauGiao>() }
    expect(JSON.stringify(keHoachCoXat(v))).toBe(JSON.stringify(keHoachCoXat(v)))
  })
  it('câu đã thông thạo bị bỏ khỏi kế hoạch và tính vào tỉ lệ', () => {
    const hoSo = hoSoCua([['Q0', { dungLienTiep: 2, lanGap: 3 }], ['Q1', { dungLienTiep: 2, lanGap: 3 }]])
    const kq = keHoachCoXat({ now: NAY, deadline: HAN, cau: dsCau(10), hoSo })
    expect(kq.daThongThao).toBe(2)
    expect(kq.tyLe).toBeCloseTo(0.2, 5)
    const co = new Set(kq.ngay.flatMap((d) => d.cau))
    expect(co.has('Q0')).toBe(false)
    expect(co.size).toBe(8)
  })
})

describe('keHoachCoXat — dồn và "quá lười biếng"', () => {
  it('100 câu: trần thường không đủ ⇒ DỒN (không báo lười), xếp đủ 200 lượt', () => {
    const kq = keHoachCoXat({ now: NAY, deadline: HAN, cau: dsCau(100), hoSo: new Map<string, HoSoCauGiao>() })
    expect(kq.luoi).toBe(false)
    expect(kq.luotXepDuoc).toBe(200)
    expect(kq.canhBao.some((c) => c.includes('DỒN'))).toBe(true)
    expect(kq.canhBao.some((c) => c.includes('lười biếng'))).toBe(false)
  })
  it('300 câu, 11 ngày ⇒ vượt trần cứng 40/ngày ⇒ "em đã quá lười biếng" + kết thúc', () => {
    const kq = keHoachCoXat({ now: NAY, deadline: HAN, cau: dsCau(300), hoSo: new Map<string, HoSoCauGiao>() })
    expect(kq.luoi).toBe(true)
    expect(kq.trangThai).toBe('ket_thuc_luoi')
    expect(kq.canhBao).toContain('em đã quá lười biếng')
    expect(kq.luotXepDuoc).toBeLessThan(kq.tongLuot)
  })
  it('câu nặng thời gian: ngày đầu không vượt 30 phút (1800 giây)', () => {
    const kq = keHoachCoXat({ now: NAY, deadline: HAN, cau: dsCau(10, 300), hoSo: new Map<string, HoSoCauGiao>() })
    expect(kq.ngay[0]!.giay).toBeLessThanOrEqual(1800)
    expect(kq.ngay[0]!.cau.length).toBe(6)
  })
})

describe('keHoachCoXat — chịu đầu vào rỗng/hỏng, không bịa', () => {
  it('deadline hỏng ⇒ cảnh báo rõ, không xếp lịch', () => {
    const kq = keHoachCoXat({ now: NAY, deadline: 'khong-phai-ngay', cau: dsCau(10), hoSo: new Map<string, HoSoCauGiao>() })
    expect(kq.soNgay).toBe(0)
    expect(kq.ngay).toEqual([])
    expect(kq.canhBao[0]).toContain('Hạn chót không hợp lệ')
  })
  it('kho đề rỗng ⇒ hoàn thành, không bịa câu', () => {
    const kq = keHoachCoXat({ now: NAY, deadline: HAN, cau: [], hoSo: new Map<string, HoSoCauGiao>() })
    expect(kq.tongCau).toBe(0)
    expect(kq.trangThai).toBe('hoan_thanh')
    expect(kq.tongLuot).toBe(0)
  })
  it('còn dưới 7 ngày ⇒ có cảnh báo dưới hạn tối thiểu', () => {
    const kq = keHoachCoXat({ now: NAY, deadline: '2026-10-04T23:59:59+07:00', cau: dsCau(5), hoSo: new Map<string, HoSoCauGiao>() })
    expect(kq.soNgay).toBe(4)
    expect(kq.canhBao.some((c) => c.includes('dưới hạn tối thiểu'))).toBe(true)
  })
})
