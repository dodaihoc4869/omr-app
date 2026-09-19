// @vitest-environment node
// GĐ 5 — KÊNH 5: số câu = phần dư ngân sách của kế hoạch ngày; thứ tự chọn câu (hàm thuần, tất định).
import { describe, it, expect } from 'vitest'
import { lapKeHoachNgay, type DauVaoKeHoach } from '../server/src/ke-hoach-ngay'
import {
  chonCauChoPhuHuynh, chuyenDeCuaDang, soCauPhanDu, tomTatKeHoach, type ChonCauVao, type KeHoachChoPhuHuynh, type UngVien,
} from '../server/src/parent-news-chon-cau'

const NOW = Date.parse('2026-09-20T05:00:00.000Z') // 12:00 giờ VN
const H = 3_600_000
const iso = (gio: number) => new Date(NOW + gio * H).toISOString()
const dv = (o: Partial<DauVaoKeHoach> = {}): DauVaoKeHoach => ({
  sbd: 'S1', now: NOW, homNay: '2026-09-20', phutNgay: null, mauGiay: [], btvn: [], mom: [], cauToiHan: [], soCauChuaKhacPhuc: 0, dang: [],
  nhiemVuThanThu: [], caSapToi: [], lichSu: [], daLamHomNay: { soCau: 0, lenBac: 0, tutBac: 0 }, homNayLaNgayNghi: false, ...o,
})
const hs = { toiHanSai: 3, toiHanDuyTri: 1, chuaKhacPhuc: 5 }
const kh = (o: Partial<KeHoachChoPhuHuynh> = {}): KeHoachChoPhuHuynh => ({ mucTieuCau: 10, taiCung: 0, daLamCau: 0, vanTocGiay: 90, ...hs, ...o })

describe('số câu phụ huynh được giao = phần dư ngân sách', () => {
  it('mục tiêu − việc bắt buộc − đã làm', () => {
    expect(soCauPhanDu(kh({ mucTieuCau: 10, taiCung: 6, daLamCau: 2 }))).toBe(2)
    expect(soCauPhanDu(kh({ mucTieuCau: 12, taiCung: 0, daLamCau: 0 }))).toBe(12)
  })
  it('con đã đủ việc hoặc đã làm đủ thì là 0, không âm', () => {
    expect(soCauPhanDu(kh({ mucTieuCau: 8, taiCung: 8 }))).toBe(0)
    expect(soCauPhanDu(kh({ mucTieuCau: 8, taiCung: 30 }))).toBe(0)
    expect(soCauPhanDu(kh({ mucTieuCau: 8, taiCung: 0, daLamCau: 9 }))).toBe(0)
  })
  it('không bao giờ vượt trần 16 của ngân sách', () => {
    for (let b = 8; b <= 16; b++) for (let c = 0; c <= 20; c += 2) expect(soCauPhanDu(kh({ mucTieuCau: b, taiCung: c }))).toBeLessThanOrEqual(16)
  })

  it('lấy từ kế hoạch thật: bài hằng ngày của chính hôm nay KHÔNG tính vào việc đã giao', () => {
    const co = lapKeHoachNgay(dv({
      btvn: [{ ma: 'B1', soCau: 30, giaoLuc: iso(-24), hanNop: iso(48), loDaXong: 0, daNop: false }],
      mom: [{ id: 'daily_2026-09-20', soCau: 4, taoLuc: iso(-1), batDauLuc: iso(-0.2) }],
    }))
    const khong = lapKeHoachNgay(dv({ btvn: [{ ma: 'B1', soCau: 30, giaoLuc: iso(-24), hanNop: iso(48), loDaXong: 0, daNop: false }] }))
    expect(co.tai.cung).toBe(khong.tai.cung + 4)
    expect(tomTatKeHoach(co, hs, 'daily_2026-09-20').taiCung).toBe(khong.tai.cung)
    // Bài Mom KHÁC (do mẹ giao tay) vẫn tính là việc đã giao.
    expect(tomTatKeHoach(co, hs, 'daily_khac').taiCung).toBe(co.tai.cung)
  })
  it('tóm tắt mang đúng mục tiêu, số câu đã làm và tốc độ của kế hoạch', () => {
    const k = lapKeHoachNgay(dv({ daLamHomNay: { soCau: 3, lenBac: 1, tutBac: 0 }, mauGiay: [40, 50, 60, 70, 80, 90] }))
    const t = tomTatKeHoach(k, hs, 'daily_x')
    expect(t.mucTieuCau).toBe(k.nganSach.mucTieuCau)
    expect(t.daLamCau).toBe(3)
    expect(t.vanTocGiay).toBe(k.nganSach.vanTocGiay)
  })
})

// --- Chọn câu ----------------------------------------------------------------------------

const u = (qid: string, dang: string | null, mucDo: string | null = 'hieu'): UngVien => ({ qid, dang, mucDo })
const vao = (o: Partial<ChonCauVao> = {}): ChonCauVao => ({
  soCan: 6, seed: 12345, ungVien: [], toiHan: [], dangYeu: [], suKienGanDay: new Set(), ...o,
})

describe('chọn câu: ôn tới hạn → câu mới cùng dạng yếu → bù kho', () => {
  const kho: UngVien[] = [
    u('T1', 'ES.A.X'), u('T2', 'ES.A.X'), u('T3', 'ES.A.X'),
    u('N1', 'ES.A.X', 'biet'), u('N2', 'ES.A.X', 'hieu'), u('N3', 'ES.A.X', 'van_dung'),
    u('M1', 'AM.B.Y', 'biet'), u('M2', 'AM.B.Y', 'hieu'),
    u('K1', 'ES.C.Z', 'biet'), u('K2', 'GL.D.W', 'biet'), u('K3', null, null),
  ]
  const toiHan = [
    { qid: 'T1', mocOnKe: '2026-09-19', lanSai: 1 },
    { qid: 'T2', mocOnKe: '2026-09-18', lanSai: 1 },
    { qid: 'T3', mocOnKe: '2026-09-18', lanSai: 3 },
  ]

  it('câu tới hạn đứng đầu: mốc sớm trước, cùng mốc thì sai nhiều trước', () => {
    const r = chonCauChoPhuHuynh(vao({ soCan: 3, ungVien: kho, toiHan }))
    expect(r.map((c) => c.qid)).toEqual(['T3', 'T2', 'T1'])
    expect(r.every((c) => c.nguon === 'on_toi_han')).toBe(true)
  })
  it('hết câu tới hạn thì lấy câu MỚI cùng dạng yếu, mức độ không vượt bậc của dạng', () => {
    const r = chonCauChoPhuHuynh(vao({ soCan: 3, ungVien: kho, dangYeu: [{ maDang: 'ES.A.X', bac: 1 }] }))
    expect(r.every((c) => c.nguon === 'cung_dang')).toBe(true)
    const trongDang = r.map((c) => c.qid)
    expect(trongDang).not.toContain('N3') // van_dung > bậc 1
    expect(trongDang.every((q) => kho.find((k) => k.qid === q)!.dang === 'ES.A.X')).toBe(true)
    expect(new Set(trongDang).size).toBe(trongDang.length)
    // bậc 0 (biết): chỉ câu 'biet'
    const r0 = chonCauChoPhuHuynh(vao({ soCan: 5, ungVien: kho, dangYeu: [{ maDang: 'ES.A.X', bac: 0 }] })).filter((c) => c.nguon === 'cung_dang')
    expect(r0.map((c) => c.qid)).toEqual(['N1'])
  })
  it('đúng bậc thì đứng trước mức thấp hơn', () => {
    const r = chonCauChoPhuHuynh(vao({ soCan: 1, ungVien: [u('AA', 'D.E.F', 'biet'), u('BB', 'D.E.F', 'hieu')], dangYeu: [{ maDang: 'D.E.F', bac: 1 }] }))
    expect(r.map((c) => c.qid)).toEqual(['BB'])
  })
  it('xoay vòng qua các dạng yếu (dạng yếu nhất trước), không dồn một dạng', () => {
    const r = chonCauChoPhuHuynh(vao({ soCan: 4, ungVien: kho, dangYeu: [{ maDang: 'AM.B.Y', bac: 2 }, { maDang: 'ES.A.X', bac: 2 }] }))
    const dang = r.map((c) => kho.find((k) => k.qid === c.qid)!.dang)
    expect(dang.slice(0, 2)).toEqual(['AM.B.Y', 'ES.A.X'])
    expect(dang.filter((d) => d === 'AM.B.Y')).toHaveLength(2)
    expect(dang.filter((d) => d === 'ES.A.X')).toHaveLength(2)
  })
  it('câu có sự kiện 3 ngày qua KHÔNG được giao làm câu mới/bù', () => {
    const r = chonCauChoPhuHuynh(vao({
      soCan: 8, ungVien: kho, dangYeu: [{ maDang: 'ES.A.X', bac: 2 }], suKienGanDay: new Set(['N1', 'N2', 'K1']),
    }))
    const qid = r.map((c) => c.qid)
    for (const x of ['N1', 'N2', 'K1']) expect(qid).not.toContain(x)
  })
  it('nhưng câu TỚI HẠN vẫn được ôn dù mới làm hôm qua (mốc 1 ngày chính là hôm qua)', () => {
    const r = chonCauChoPhuHuynh(vao({ soCan: 2, ungVien: kho, toiHan, suKienGanDay: new Set(['T1', 'T2', 'T3']) }))
    expect(r.filter((c) => c.nguon === 'on_toi_han').map((c) => c.qid)).toEqual(['T3', 'T2'])
  })
  it('câu tới hạn không có nội dung (đề bảo vệ/không đọc được) bị bỏ, không làm sập', () => {
    const r = chonCauChoPhuHuynh(vao({ soCan: 2, ungVien: [u('T1', 'ES.A.X')], toiHan }))
    expect(r.map((c) => c.qid)).toEqual(['T1'])
  })
  it('bù kho ưu tiên cùng chuyên đề với dạng yếu, rồi mới tới chuyên đề khác', () => {
    // Không có câu nào ở dạng yếu ES.A.X → cả hai câu đều là bù. Chuyên đề ES đứng trước GL/AM dù mã hash có ra sao.
    const ung = [u('G1', 'GL.P.Q', 'biet'), u('A1', 'AM.P.Q', 'biet'), u('E1', 'ES.P.Q', 'biet')]
    for (const seed of [1, 2, 3, 99, 12345]) {
      const r = chonCauChoPhuHuynh(vao({ seed, soCan: 1, ungVien: ung, dangYeu: [{ maDang: 'ES.A.X', bac: 0 }] }))
      expect(r).toEqual([{ qid: 'E1', nguon: 'bu_kho' }])
    }
    expect(chuyenDeCuaDang('ES.C.Z')).toBe('ES')
  })
  it('bù kho bỏ câu mức "vận dụng" nhưng nhận câu chưa gắn mức', () => {
    const r = chonCauChoPhuHuynh(vao({ soCan: 10, ungVien: [u('V', 'A.B.C', 'van_dung'), u('Z', null, null)] }))
    expect(r.map((c) => c.qid)).toEqual(['Z'])
  })
  it('không trùng, không quá soCan, soCan = 0 hoặc âm thì rỗng', () => {
    const r = chonCauChoPhuHuynh(vao({ soCan: 5, ungVien: kho, toiHan, dangYeu: [{ maDang: 'ES.A.X', bac: 2 }] }))
    expect(r.length).toBeLessThanOrEqual(5)
    expect(new Set(r.map((c) => c.qid)).size).toBe(r.length)
    expect(chonCauChoPhuHuynh(vao({ soCan: 0, ungVien: kho, toiHan }))).toEqual([])
    expect(chonCauChoPhuHuynh(vao({ soCan: -3, ungVien: kho, toiHan }))).toEqual([])
  })
  it('tất định: cùng đầu vào → cùng kết quả, không phụ thuộc thứ tự mảng ứng viên', () => {
    const v = vao({ soCan: 7, ungVien: kho, toiHan, dangYeu: [{ maDang: 'ES.A.X', bac: 2 }, { maDang: 'AM.B.Y', bac: 1 }] })
    const a = JSON.stringify(chonCauChoPhuHuynh(v))
    expect(JSON.stringify(chonCauChoPhuHuynh(v))).toBe(a)
    expect(JSON.stringify(chonCauChoPhuHuynh({ ...v, ungVien: [...kho].reverse(), toiHan: [...toiHan].reverse() }))).toBe(a)
    expect(JSON.stringify(chonCauChoPhuHuynh({ ...v, seed: v.seed + 1 }))).not.toBe('') // seed khác vẫn chạy được
  })
  it('không đọc/ghi thứ gì ngoài đầu vào (không sửa đầu vào)', () => {
    const v = vao({ soCan: 5, ungVien: kho, toiHan, dangYeu: [{ maDang: 'ES.A.X', bac: 2 }] })
    const truoc = JSON.stringify({ ...v, suKienGanDay: [...v.suKienGanDay] })
    chonCauChoPhuHuynh(v)
    expect(JSON.stringify({ ...v, suKienGanDay: [...v.suKienGanDay] })).toBe(truoc)
  })
})
