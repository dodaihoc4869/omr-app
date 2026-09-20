// M4 — LƯU BUỔI CHỮA + TỰ NỐI BUỔI SAU: phần THUẦN (`noi-buoi-chua.ts`) và việc Engine E GIỮ em đã định (`emDaDinh`).
// Phần màn hình (tắt app → mở lại) ở `goi-len-bang-noi-buoi-1909.test.tsx`.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  HAN_BUOI_CHUA_NGAY,
  MOC_KHOA_BUOI,
  chuTheTiepTuc,
  conHan,
  emGiuKhiNoi,
  hetHanTu,
  khoaBuoiChua,
  khoaO,
  laBuoiChuaHopLe,
  taoBanGhiBuoi,
  tinhTrangBuoi,
  type BuoiChuaLuu,
  type DauVaoLuuBuoi,
} from '../src/lib/noi-buoi-chua'
import { xepBuoiChua, type CauVaoXep } from '../src/lib/xep-buoi-chua'
import { BTVN_RONG, type HoSoEmDayDu } from '../src/lib/ho-so-lop'
import type { CauChua } from '../src/lib/phan-cong'

const NGAY0 = new Date('2026-09-21T02:00:00.000Z')
const NGUON = { cachLayCau: 'san' as const, maDeChon: ['D1'], soCauChua: 12, locSao: 'tat_ca', locDang: 'tat_ca' }

const dauVao = (o: Partial<DauVaoLuuBuoi> = {}): DauVaoLuuBuoi => ({
  moc: '2026-09-21',
  lop: '12A',
  maCa: '111111',
  tenCa: 'Ca 111111',
  nguon: NGUON,
  cauTrongBuoi: [
    { qid: 'q1', batBuoc: true },
    { qid: 'q2', batBuoc: false },
    { qid: 'q3', batBuoc: false },
    { qid: 'q4', batBuoc: true },
  ],
  kehoach: [
    { qid: 'q1', sbd: 'A' },
    { qid: 'q2', sbd: 'B' },
    { qid: 'q4', sbd: 'C' },
  ],
  ketQua: {},
  nay: NGAY0,
  ...o,
})

describe('khoá buổi và hạn 14 ngày', () => {
  it('21/09 reset GIỮ toàn bộ ca thi ⇒ màn hình dùng khoá KHÔNG gắn mốc reset (nối được qua reset), và không đọc mốc đã dọn nữa', () => {
    expect(MOC_KHOA_BUOI).toBe('')
    expect(khoaBuoiChua(MOC_KHOA_BUOI, '12A', '111111')).toBe('-|12A|111111')
    const man = readFileSync('src/screens/GoiLenBangScreen.tsx', 'utf8')
    expect(man).toContain('khoaBuoiChua(MOC_KHOA_BUOI, du.lop, du.maCa)')
    expect(man).toContain('moc: MOC_KHOA_BUOI')
    expect(man).not.toContain('docMocResetDaDon')
  })

  it('khoá = mốc reset | lớp | mã ca; trống thành "-"; dấu | trong chữ bị đổi để khoá không vỡ đoạn', () => {
    expect(khoaBuoiChua('2026-09-21', '12A', '111111')).toBe('2026-09-21|12A|111111')
    expect(khoaBuoiChua('', '', '111111')).toBe('-|-|111111')
    expect(khoaBuoiChua(' 2026-09-21 ', 'Lớp|12', ' 9 ')).toBe('2026-09-21|Lớp/12|9')
    // hàm vẫn cho gắn mốc (mốc khác ⇒ khoá khác); màn hình thì luôn truyền MOC_KHOA_BUOI = '' — xem test dưới
    expect(khoaBuoiChua('2026-09-21', '12A', '1')).not.toBe(khoaBuoiChua('2026-10-05', '12A', '1'))
    expect(khoaBuoiChua('2026-09-21', '12A', '1')).not.toBe(khoaBuoiChua('2026-09-21', '12B', '1'))
  })

  it('hết hạn sau ĐÚNG 14 ngày kể từ lần lưu gần nhất', () => {
    expect(HAN_BUOI_CHUA_NGAY).toBe(14)
    const rec = taoBanGhiBuoi(null, dauVao())
    expect(rec.hetHan).toBe(hetHanTu(NGAY0))
    expect(Date.parse(rec.hetHan) - Date.parse(rec.luuLuc)).toBe(14 * 86_400_000)
    expect(conHan(rec, new Date(NGAY0.getTime() + 13 * 86_400_000 + 23 * 3_600_000))).toBe(true)
    expect(conHan(rec, new Date(NGAY0.getTime() + 14 * 86_400_000))).toBe(false)
    expect(conHan(rec, new Date(NGAY0.getTime() + 30 * 86_400_000))).toBe(false)
  })

  it('bản ghi hỏng (không hạn, hạn rác) coi như HẾT HẠN; hình dạng lạ không được nhận là buổi hợp lệ', () => {
    expect(conHan({ hetHan: '' }, NGAY0)).toBe(false)
    expect(conHan({ hetHan: 'không phải ngày' }, NGAY0)).toBe(false)
    const tot = taoBanGhiBuoi(null, dauVao())
    expect(laBuoiChuaHopLe(tot)).toBe(true)
    for (const xau of [null, undefined, 5, 'x', [], {}, { ...tot, phienBan: 2 }, { ...tot, cauBuoi: 'q1' }, { ...tot, cauBuoi: [1, 2] }, { ...tot, kehoach: [{ qid: 1 }] }, { ...tot, daGhi: null }, { ...tot, nguon: null }, { ...tot, hetHan: 5 }]) {
      expect(laBuoiChuaHopLe(xau), JSON.stringify(xau)).toBe(false)
    }
  })
})

describe('bản ghi buổi: cộng dồn qua các lần nối', () => {
  it('buổi MỚI: giờ bắt đầu và hạn theo lần lưu; câu bắt buộc ghi nhận; chưa có kết quả thì chưa chữa câu nào', () => {
    const r = taoBanGhiBuoi(null, dauVao())
    expect(r.batDauLuc).toBe(NGAY0.toISOString())
    expect(r.cauBuoi).toEqual(['q1', 'q2', 'q3', 'q4'])
    expect(r.batBuoc).toEqual(['q1', 'q4'])
    expect(r.daChua).toEqual([])
    expect(r.khoa).toBe('2026-09-21|12A|111111')
    // giờ bắt đầu ổn định trong phiên: truyền vào thì dùng, kể cả khi lưu nhiều lần
    const a = taoBanGhiBuoi(null, dauVao({ batDauLuc: '2026-09-21T01:00:00.000Z', nay: new Date('2026-09-21T03:00:00.000Z') }))
    expect(a.batDauLuc).toBe('2026-09-21T01:00:00.000Z')
    expect(a.luuLuc).toBe('2026-09-21T03:00:00.000Z')
  })

  it('kết quả bấm ⇒ ô có trong daGhi và CÂU đó thành đã chữa (một câu chữa xong khi có ô ghi, dù Đạt hay Chưa đạt)', () => {
    const r = taoBanGhiBuoi(null, dauVao({ ketQua: { [khoaO('A', 'q1')]: 'dat', [khoaO('B', 'q2')]: 'khong_dat' } }))
    expect(r.daGhi).toEqual({ 'A|q1': 'dat', 'B|q2': 'khong_dat' })
    expect(r.daChua.sort()).toEqual(['q1', 'q2'])
  })

  it('NỐI: giữ giờ bắt đầu, cộng câu mới vào, cộng kết quả mới vào kết quả cũ, kế hoạch lấy của lần xếp mới, hạn tính lại', () => {
    const cu = taoBanGhiBuoi(null, dauVao({ ketQua: { [khoaO('A', 'q1')]: 'dat' } }))
    const sau = new Date('2026-09-28T02:00:00.000Z')
    const moi = taoBanGhiBuoi(cu, dauVao({ nay: sau, cauTrongBuoi: [{ qid: 'q2', batBuoc: false }, { qid: 'q5', batBuoc: true }], kehoach: [{ qid: 'q5', sbd: 'D' }], ketQua: { [khoaO('D', 'q5')]: 'khong_dat' } }))
    expect(moi.batDauLuc).toBe(cu.batDauLuc)
    expect(moi.luuLuc).toBe(sau.toISOString())
    expect(moi.hetHan).toBe(hetHanTu(sau))
    expect(moi.cauBuoi.sort()).toEqual(['q1', 'q2', 'q3', 'q4', 'q5'])
    expect(moi.batBuoc.sort()).toEqual(['q1', 'q4', 'q5'])
    expect(moi.daGhi).toEqual({ 'A|q1': 'dat', 'D|q5': 'khong_dat' })
    expect(moi.daChua.sort()).toEqual(['q1', 'q5'])
    expect(moi.kehoach).toEqual([{ qid: 'q5', sbd: 'D' }])
  })
})

describe('còn lại bao nhiêu câu, đã chữa bao nhiêu', () => {
  const buoi = (ketQua: DauVaoLuuBuoi['ketQua'] = {}) => taoBanGhiBuoi(null, dauVao({ ketQua }))

  it('chưa ghi gì ⇒ còn hết, bắt buộc đứng đầu; ghi một câu ⇒ còn ít hơn một và đã chữa nhiều hơn một', () => {
    const t0 = tinhTrangBuoi(buoi(), null)
    expect(t0.conLai).toEqual(['q1', 'q4', 'q2', 'q3'])
    expect(t0.daChua).toEqual([])
    expect(chuTheTiepTuc(t0)).toBe('Tiếp tục buổi trước · còn 4 câu (đã chữa 0)')
    const t1 = tinhTrangBuoi(buoi({ [khoaO('A', 'q1')]: 'dat' }), null)
    expect(t1.conLai).toEqual(['q4', 'q2', 'q3'])
    expect(t1.daChua).toEqual(['q1'])
    expect(chuTheTiepTuc(t1)).toBe('Tiếp tục buổi trước · còn 3 câu (đã chữa 1)')
  })

  it('câu ĐỌC ĐÁP ÁN (dời buổi sau, không em nào được gọi) vẫn là câu CÒN LẠI', () => {
    // q3 không có ô nào trong kế hoạch
    expect(tinhTrangBuoi(buoi(), null).conLai).toContain('q3')
    expect(dauVao().kehoach.some((o) => o.qid === 'q3')).toBe(false)
  })

  it('MÁY CHỦ đã ghi (thầy chữa ở máy khác): ô kế hoạch có qid trong lịch sử của em, lần cuối SAU lúc buổi bắt đầu ⇒ tính đã chữa', () => {
    const b = buoi()
    const lichSu = { theoEm: { A: { soLan: 3, lanCuoi: '2026-09-21T05:00:00.000Z', qids: ['q1', 'cauCu'] } } }
    const t = tinhTrangBuoi(b, lichSu)
    expect(t.daChua).toEqual(['q1'])
    expect(t.soTuMayChu).toBe(1)
    expect(t.conLai).not.toContain('q1')
  })

  it('lịch sử máy chủ CŨ HƠN buổi (câu em chữa từ tuần trước) hoặc không đọc được giờ ⇒ KHÔNG tính; em khác cùng qid không tính hộ', () => {
    const b = buoi()
    expect(tinhTrangBuoi(b, { theoEm: { A: { soLan: 1, lanCuoi: '2026-09-10T00:00:00.000Z', qids: ['q1'] } } }).daChua).toEqual([])
    expect(tinhTrangBuoi(b, { theoEm: { A: { soLan: 1, lanCuoi: 'rác', qids: ['q1'] } } }).daChua).toEqual([])
    expect(tinhTrangBuoi(b, { theoEm: { A: { soLan: 1, lanCuoi: '', qids: ['q1'] } } }).daChua).toEqual([])
    // em Z không có ô nào trong kế hoạch của q1 (em định là A) ⇒ không tính
    expect(tinhTrangBuoi(b, { theoEm: { Z: { soLan: 1, lanCuoi: '2026-09-21T05:00:00.000Z', qids: ['q1'] } } }).daChua).toEqual([])
    // chưa đọc được lịch sử (null) ⇒ chỉ dựa vào máy này
    expect(tinhTrangBuoi(b, null).daChua).toEqual([])
  })

  it('không đếm hai lần: câu đã có kết quả trên máy này thì máy chủ xác nhận thêm cũng không tăng soTuMayChu', () => {
    const b = buoi({ [khoaO('A', 'q1')]: 'dat' })
    const t = tinhTrangBuoi(b, { theoEm: { A: { soLan: 1, lanCuoi: '2026-09-21T05:00:00.000Z', qids: ['q1'] } } })
    expect(t.daChua).toEqual(['q1'])
    expect(t.soTuMayChu).toBe(0)
  })
})

describe('em nào được giữ khi nối', () => {
  const b = taoBanGhiBuoi(null, dauVao({ ketQua: { [khoaO('A', 'q1')]: 'dat' } }))
  const conLai = tinhTrangBuoi(b, null).conLai // q4, q2, q3

  it('em còn CÓ MẶT giữ nguyên câu; em VẮNG không có trong kết quả (máy sẽ xếp em khác); ô đã ghi không giữ', () => {
    expect(emGiuKhiNoi(b, conLai, new Set(['A', 'B', 'C']))).toEqual({ q2: 'B', q4: 'C' })
    expect(emGiuKhiNoi(b, conLai, new Set(['A', 'C']))).toEqual({ q4: 'C' }) // B vắng
    expect(emGiuKhiNoi(b, conLai, new Set())).toEqual({})
    // câu q1 đã chữa (không còn lại) ⇒ em A không bị giữ cho q1 dù có mặt
    expect(emGiuKhiNoi(b, conLai, new Set(['A']))).toEqual({})
  })
})

// ─────────── Engine E: giữ em đã định ───────────
const CD = ['Ester – lipid', 'Carbohydrate', 'Cân bằng hoá học', 'Nguyên tử']
const vao = (i: number, sao: 0 | 1 | 2, o: Partial<CauVaoXep> = {}): CauVaoXep => ({
  cau: { id: `Q${i}`, phan: 'I', so: i, chuyenDe: CD[i % CD.length], mucDo: 'hieu', tomTat: '', viTri: i, sao, lyDoSao: '' } as CauChua,
  tiLeDung: 0.5,
  soEmLam: 20,
  batBuoc: false,
  ...o,
})

const em = (i: number, coMat = true): HoSoEmDayDu => ({
  sbd: `E${String(i).padStart(2, '0')}`,
  hoTen: `Em ${i}`,
  coMat,
  chuyenDe: CD.map((t) => ({ ten: t, soCau: 10, soSai: 4 })),
  cauSai: [],
  daLam: new Map(),
  lenBang: { soLan: 0, lanCuoi: '', qids: [] },
  btvn: { ...BTVN_RONG, theoCau: new Map() },
})

const lop = (n: number, vang: number[] = []) => Array.from({ length: n }, (_, i) => em(i + 1, !vang.includes(i + 1)))

describe('Engine E giữ em đã định khi nối buổi', () => {
  const ds = () => [vao(1, 2), vao(2, 2), vao(3, 1), vao(4, 1), vao(5, 0), vao(6, 0)]
  const emCua = (kq: ReturnType<typeof xepBuoiChua>) => Object.fromEntries(kq.dong.filter((d) => d.tang === 'len_bang').map((d) => [d.cau.id, d.em!.sbd]))

  it('em đã định CÒN CÓ MẶT thì đứng đúng câu ấy (kể cả khi máy sẽ chọn em khác nếu để tự do)', () => {
    const tuDo = emCua(xepBuoiChua(ds(), lop(24)))
    // chọn một em khác em máy sẽ chọn cho Q1 để chắc "giữ" thắng "hợp nhất"
    const khac = Object.values(tuDo).includes('E24') ? 'E23' : 'E24'
    const dinh = ds().map((c) => (c.cau.id === 'Q1' ? { ...c, emDaDinh: khac } : c))
    const kq = emCua(xepBuoiChua(dinh, lop(24)))
    expect(kq.Q1).toBe(khac)
  })

  it('em đã định VẮNG ⇒ máy chọn em có mặt hợp nhất; không bao giờ trả em vắng', () => {
    const dinh = ds().map((c) => (c.cau.id === 'Q1' ? { ...c, emDaDinh: 'E24' } : c))
    const kq = xepBuoiChua(dinh, lop(24, [24]))
    const sbd = kq.dong.filter((d) => d.tang === 'len_bang').map((d) => d.em!.sbd)
    expect(sbd).not.toContain('E24')
    expect(emCua(kq).Q1).toBeTruthy()
  })

  it('em đã định KHÔNG có trong danh sách (đã nghỉ học/đổi lớp) ⇒ như không có định', () => {
    const dinh = ds().map((c) => (c.cau.id === 'Q1' ? { ...c, emDaDinh: 'KHONG_CO' } : c))
    expect(emCua(xepBuoiChua(dinh, lop(24)))).toEqual(emCua(xepBuoiChua(ds(), lop(24))))
  })

  it('hai câu cùng định một em ⇒ em ấy chỉ đứng MỘT câu (không em nào lên hai lượt)', () => {
    const dinh = ds().map((c) => (c.cau.id === 'Q1' || c.cau.id === 'Q2' ? { ...c, emDaDinh: 'E24' } : c))
    const sbd = xepBuoiChua(dinh, lop(24)).dong.filter((d) => d.tang === 'len_bang').map((d) => d.em!.sbd)
    expect(sbd.filter((x) => x === 'E24').length).toBeLessThanOrEqual(1)
    expect(new Set(sbd).size).toBe(sbd.length)
  })

  it('không có định nào ⇒ Engine E cho ĐÚNG kết quả cũ (bất biến)', () => {
    const a = xepBuoiChua(ds(), lop(24))
    const b = xepBuoiChua(ds().map((c) => ({ ...c, emDaDinh: undefined })), lop(24))
    expect(b.dong.map((d) => [d.cau.id, d.em?.sbd ?? null, d.tang])).toEqual(a.dong.map((d) => [d.cau.id, d.em?.sbd ?? null, d.tang]))
  })
})
