// RÚT ĐỀ RIÊNG ĐỌC HỒ SƠ NẮM KIẾN THỨC — GĐ 6, Kênh 1 (19/09).
//
// Đề xuất: DE-XUAT-CA-NHAN-HOA-1909.md mục 2 "Kênh 1". Hợp đồng máy chủ:
// docs/hop-dong-ho-so-on-ca-1909.md (lệnh `hoSoOnCa`).
//
// BẢY Ý PHẢI ĐÚNG:
//   1. có hồ sơ → câu `da_khac_phuc` không bị hỏi lại (số CẦN không đổi, không độn);
//   2. câu tới hạn ôn (`mocOnKe ≤ ngayCa`) đứng trước — chỉ đổi THỨ TỰ;
//   3. hai em cùng nhóm nhận song sinh KHÁC nhau khi có ≥ 2 ứng viên; ghép theo mã dạng;
//   4. pha B không phát câu trong `lam` của em khi kho đủ — và giữ mọi bất biến chặn trùng;
//   5. kho mỏng → nới tập cấm của ĐÚNG em đó, câu cũ nhất trước, CÓ BÁO SỐ;
//   6. không có hồ sơ / lệnh lỗi → bộ đề Y HỆT bản trước 19/09 (dấu vân tay lấy từ mã cũ);
//   7. chạy 2 lần cùng đầu vào → cùng JSON.
import fs from 'node:fs'
import path from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CAU_HINH_DE_RIENG_MAC_DINH } from '../src/lib/cau-hinh-de-rieng'
import { chonCauLapChoEm, demLanSai, docHoSoOnEm, dungDeRieng, type CaTruocDaCham, type HoSoOnEm, type YeuCauDeRieng } from '../src/lib/de-rieng'
import { doTrung, lechTanSuat, noiTapCam, sinhBoMotO, type CamTheoEm } from '../src/lib/de-rieng-tran-trung'
import type { CauUngVien, PhanDe } from '../src/lib/rut-de'
import { bocSoGia, cauGia, lopGia, vanTay } from './_lop-gia-de-rieng'

// --- Mạng và IndexedDB giả cho tầng `de-rieng-nguon` ------------------------
const hoSoOnCa = vi.fn()
const banDoSaiCa = vi.fn()
const danhSachCa = vi.fn()
const danhSachEm = vi.fn()
const noiKhoCa = vi.fn(async () => ({ themBank: 0, themKey: 0 }))
const loadSessionTeacherBank = vi.fn()
const docSoCauCa = vi.fn()

vi.mock('../src/lib/exam-api', async (goc) => ({
  ...(await goc<Record<string, unknown>>()),
  hoSoOnCa: (...a: unknown[]) => hoSoOnCa(...a),
  banDoSaiCa: (...a: unknown[]) => banDoSaiCa(...a),
  danhSachCa: (...a: unknown[]) => danhSachCa(...a),
  danhSachEm: (...a: unknown[]) => danhSachEm(...a),
  noiKhoCa: (...a: unknown[]) => noiKhoCa(...(a as [])),
  chiTietCa: vi.fn(async () => {
    throw new Error('test này không được rơi về chiTietCa')
  }),
}))
vi.mock('../src/lib/exam-db', async (goc) => ({
  ...(await goc<Record<string, unknown>>()),
  loadSessionTeacherBank: (...a: unknown[]) => loadSessionTeacherBank(...a),
  saveSessionTeacherBank: vi.fn(async () => {}),
  docSoCauCa: (...a: unknown[]) => docSoCauCa(...a),
  docDeRiengCa: vi.fn(async () => undefined),
  loadExamSources: vi.fn(async () => []),
}))

const { dungDeRiengChoCa, docHoSoOnCa, maDangCuaKho, ngayVnCua } = await import('../src/lib/de-rieng-nguon')

const NGAY_CA = '2026-09-21'
/** Hạn chờ cho test NẶNG (hàng chục lớp × 3 phần × 20 000 vòng đổi chỗ). Mặc định 5 s
 * của vitest là lưới chống TREO chứ không phải phép đo tốc độ: máy thầy đang chạy vài
 * phiên cùng lúc (load 20–28) thì test 2,7 s vọt quá 5 s và đỏ oan. Tốc độ thật đo ở
 * test "dưới 500 ms", không đo bằng hạn chờ. */
const HAN_NANG = 60_000
const KHONG_SONG_SINH = { ...CAU_HINH_DE_RIENG_MAC_DINH, CO_CAU_SONG_SINH: false }

function hoSo(them: Partial<HoSoOnEm> = {}): HoSoOnEm {
  return { tuCa: 'ca0', sai: [], daKhacPhuc: [], lam: [], ...them }
}
const conSai = (qid: string, mocOnKe: string | null, maDang: string | null = null, lanSai = 1) => ({ qid, lanSai, mocOnKe, maDang, trangThai: 'moi_sai' as const })

/** Một ca trước: em `sbd` làm `lam`, sai `sai`. */
function ca(maCa: string, cua: Record<string, { lam: string[]; sai: string[] }>): CaTruocDaCham {
  const daLamCua: Record<string, string[]> = {}
  const saiCua: Record<string, string[]> = {}
  for (const [sbd, v] of Object.entries(cua)) {
    daLamCua[sbd] = v.lam
    saiCua[sbd] = v.sai
  }
  return { maCa, daLamCua, saiCua }
}
const I = (n: number, tu = 0) => Array.from({ length: n }, (_, i) => `I-${tu + i}`)

// ===========================================================================
describe('0. ĐỌC PHÒNG THỦ phản hồi hoSoOnCa — dòng rác không được làm em mất câu hỏi lại', () => {
  it('đúng khuôn thì giữ nguyên, bỏ trùng', () => {
    const ra = docHoSoOnEm({
      tuCa: ' 817428 ',
      sai: [
        { qid: 'Q1', lanSai: 2, mocOnKe: '2026-09-20', maDang: 'ESTER.THUY_PHAN.TINH_KL', trangThai: 'moi_sai' },
        { qid: 'Q1', lanSai: 9, mocOnKe: '2026-01-01', maDang: 'X', trangThai: 'dang_on' },
        { qid: 'Q2', lanSai: 1, mocOnKe: '2026-09-25T00:00:00Z', maDang: '', trangThai: 'dang_on' },
      ],
      daKhacPhuc: ['Q7', 'Q7', ' Q8 '],
      lam: ['A', 'B', 'A'],
    })
    expect(ra.tuCa).toBe('817428')
    expect(ra.sai).toEqual([
      { qid: 'Q1', lanSai: 2, mocOnKe: '2026-09-20', maDang: 'ESTER.THUY_PHAN.TINH_KL', trangThai: 'moi_sai' },
      { qid: 'Q2', lanSai: 1, mocOnKe: '2026-09-25', maDang: null, trangThai: 'dang_on' },
    ])
    expect(ra.daKhacPhuc).toEqual(['Q7', 'Q8'])
    expect(ra.lam).toEqual(['A', 'B'])
  })

  it('sai kiểu ở đâu thì rơi về giá trị VÔ HẠI ở đó, không ném lỗi', () => {
    for (const rac of [null, undefined, 7, 'x', [], { sai: 'x', daKhacPhuc: 5, lam: { a: 1 } }]) {
      expect(docHoSoOnEm(rac)).toEqual({ tuCa: '', sai: [], daKhacPhuc: [], lam: [] })
    }
    const ra = docHoSoOnEm({
      sai: [null, 3, { qid: '' }, { qid: 'Q1', trangThai: 'da_khac_phuc' }, { qid: 'Q2', trangThai: 'la_lam' }, { qid: 'Q3', trangThai: 'moi_sai', lanSai: 'abc', mocOnKe: '21/09/2026', maDang: 5 }],
      daKhacPhuc: [1, null, 'Q9'],
      lam: [true, 'L1'],
    })
    // Trạng thái lạ ⇒ BỎ DÒNG (câu đó xử theo luật cũ, vẫn được hỏi lại).
    expect(ra.sai).toEqual([{ qid: 'Q3', lanSai: 0, mocOnKe: null, maDang: null, trangThai: 'moi_sai' }])
    expect(ra.daKhacPhuc).toEqual(['Q9'])
    expect(ra.lam).toEqual(['L1'])
  })
})

// ===========================================================================
describe('1. CÓ HỒ SƠ → câu đã khắc phục KHÔNG bị hỏi lại', () => {
  // Em sai 10 câu ⇒ cần ceil(0,3·10) = 3. Chỉ đếm trên số câu SAI ca trước.
  const dsCa = [ca('ca0', { '12001': { lam: I(15), sai: I(10) } })]
  const demSai = demLanSai(dsCa)

  it('bỏ câu da_khac_phuc, SỐ CẦN giữ nguyên 3, lấy câu kế tiếp bù vào', () => {
    const cu = chonCauLapChoEm('12001', dsCa, 20, demSai, KHONG_SONG_SINH)
    expect(cu.qids).toEqual(['I-0', 'I-1', 'I-2'])
    const moi = chonCauLapChoEm('12001', dsCa, 20, demSai, KHONG_SONG_SINH, undefined, undefined, { hoSo: hoSo({ daKhacPhuc: ['I-0', 'I-2'] }), ngayCa: NGAY_CA })
    expect(moi.can).toBe(3)
    expect(moi.soSaiCaTruoc).toBe(10)
    expect(moi.qids).toEqual(['I-1', 'I-3', 'I-4'])
    expect(moi.daKhacPhuc).toEqual(['I-0', 'I-2'])
    expect(moi.lyDo).toBe('')
  })

  it('đã khắc phục gần hết ⇒ trả ÍT + lý do, KHÔNG độn câu khác cho đủ', () => {
    const moi = chonCauLapChoEm('12001', dsCa, 20, demSai, KHONG_SONG_SINH, undefined, undefined, { hoSo: hoSo({ daKhacPhuc: I(9) }), ngayCa: NGAY_CA })
    expect(moi.can).toBe(3)
    expect(moi.qids).toEqual(['I-9'])
    expect(moi.lyDo).toBe('da_khac_phuc')
    const het = chonCauLapChoEm('12001', dsCa, 20, demSai, KHONG_SONG_SINH, undefined, undefined, { hoSo: hoSo({ daKhacPhuc: I(10) }), ngayCa: NGAY_CA })
    expect(het.qids).toEqual([])
    expect(het.lyDo).toBe('da_khac_phuc')
  })

  it('máy chủ lỡ trả một qid ở CẢ `sai` lẫn `daKhacPhuc` ⇒ vẫn hỏi lại (thà thừa một câu)', () => {
    const moi = chonCauLapChoEm('12001', dsCa, 20, demSai, KHONG_SONG_SINH, undefined, undefined, { hoSo: hoSo({ sai: [conSai('I-0', null)], daKhacPhuc: ['I-0'] }), ngayCa: NGAY_CA })
    expect(moi.qids).toContain('I-0')
    expect(moi.daKhacPhuc).toBeUndefined()
  })

  it('vắng mặt trong hồ sơ KHÔNG bị coi là đã khắc phục', () => {
    const moi = chonCauLapChoEm('12001', dsCa, 20, demSai, KHONG_SONG_SINH, undefined, undefined, { hoSo: hoSo(), ngayCa: NGAY_CA })
    expect(moi.qids).toEqual(['I-0', 'I-1', 'I-2'])
  })

  it('sai ≥ 3 lần vẫn vào canDayLai — trừ khi hồ sơ nói đã khắc phục', () => {
    const ba = [0, 1, 2].map((j) => ca(`ca${j}`, { '12001': { lam: I(15), sai: ['I-5', 'I-6', `I-${7 + j}`] } }))
    const dem = demLanSai(ba)
    const khongHoSo = chonCauLapChoEm('12001', ba, 20, dem, KHONG_SONG_SINH)
    expect(khongHoSo.canDayLai).toEqual(['I-5', 'I-6'])
    const coHoSo = chonCauLapChoEm('12001', ba, 20, dem, KHONG_SONG_SINH, undefined, undefined, { hoSo: hoSo({ daKhacPhuc: ['I-6'] }), ngayCa: NGAY_CA })
    expect(coHoSo.canDayLai).toEqual(['I-5'])
    expect(coHoSo.qids).not.toContain('I-5')
    expect(coHoSo.qids).not.toContain('I-6')
  })

  it('cả lớp: dungDeRieng không phát lại câu đã khắc phục, và khai ra theo từng em', () => {
    const uv = { I: Array.from({ length: 120 }, (_, i) => cauGia('I', i)), II: [], III: [] } as Record<PhanDe, CauUngVien[]>
    const ds = ['12001', '12002']
    const truoc = [ca('ca0', { '12001': { lam: I(15), sai: I(10) }, '12002': { lam: I(15), sai: I(10) } })]
    const y: YeuCauDeRieng = { uv, yc: { soCau: { I: 18, II: 0, III: 0 }, chuyenDe: [], mucDo: [], tranhQid: [], seed: 5 }, dsSbd: ds, dsCa: truoc, ch: KHONG_SONG_SINH, hoSo: { '12001': hoSo({ daKhacPhuc: I(10) }) }, ngayCa: NGAY_CA }
    const ra = dungDeRieng(y)
    expect(ra.lapTheoEm['12001']).toEqual([])
    expect(ra.lapTheoEm['12002']).toEqual(['I-0', 'I-1', 'I-2'])
    expect(ra.daKhacPhucTheoEm).toEqual({ '12001': I(10) })
    expect(ra.thieuLap).toEqual([{ sbd: '12001', soLap: 0, can: 3, soSaiCaTruoc: 10, lyDo: 'da_khac_phuc' }])
    expect(ra.boTheoEm['12001']).toHaveLength(18)
  })
})

// ===========================================================================
describe('2. CÂU TỚI HẠN ÔN đứng trước — chỉ đổi THỨ TỰ, không đổi SỐ', () => {
  const dsCa = [ca('ca0', { '12001': { lam: I(15), sai: I(10) } })]
  const demSai = demLanSai(dsCa)

  it('cùng mức ưu tiên: câu mocOnKe ≤ ngày ca lên trước, quá hạn lâu hơn trước nữa', () => {
    const hs = hoSo({ sai: [conSai('I-7', '2026-09-21'), conSai('I-9', '2026-09-18'), conSai('I-1', '2026-09-22'), conSai('I-2', null)] })
    const moi = chonCauLapChoEm('12001', dsCa, 20, demSai, KHONG_SONG_SINH, undefined, undefined, { hoSo: hs, ngayCa: NGAY_CA })
    expect(moi.can).toBe(3)
    // I-9 (quá hạn 3 ngày) → I-7 (đúng hạn hôm nay) → rồi mới tới thứ tự cũ; I-1 hạn NGÀY MAI nên không được ưu tiên.
    expect(moi.qids).toEqual(['I-9', 'I-7', 'I-0'])
  })

  it('số lần sai ở các ca thi VẪN là ưu tiên số một — tới hạn chỉ phân xử khi hoà', () => {
    const hai = [ca('ca0', { '12001': { lam: I(15), sai: I(10) } }), ca('ca1', { '12001': { lam: I(15), sai: ['I-4'] } })]
    const hs = hoSo({ sai: [conSai('I-8', '2026-09-01')] })
    const moi = chonCauLapChoEm('12001', hai, 20, demLanSai(hai), KHONG_SONG_SINH, undefined, undefined, { hoSo: hs, ngayCa: NGAY_CA })
    expect(moi.qids).toEqual(['I-4', 'I-8', 'I-0'])
  })

  it('không có ngày ca, hoặc không câu nào tới hạn ⇒ đúng thứ tự cũ', () => {
    const hs = hoSo({ sai: [conSai('I-9', '2026-09-18')] })
    expect(chonCauLapChoEm('12001', dsCa, 20, demSai, KHONG_SONG_SINH, undefined, undefined, { hoSo: hs }).qids).toEqual(['I-0', 'I-1', 'I-2'])
    expect(chonCauLapChoEm('12001', dsCa, 20, demSai, KHONG_SONG_SINH, undefined, undefined, { hoSo: hs, ngayCa: '2026-09-10' }).qids).toEqual(['I-0', 'I-1', 'I-2'])
  })
})

// ===========================================================================
describe('3. SONG SINH ghép theo MÃ DẠNG và XOAY THEO EM', () => {
  // Kho Phần I: 0–9 là câu ca trước (dạng ESTER), 10–13 là bốn câu CÙNG mã dạng
  // ESTER chưa ai làm, 14–59 là câu bài tập dạng KHÁC (AMIN) — khoá cũ coi tất cả
  // là "cùng dạng" vì cùng `I:bai_tap`.
  const uv = { I: Array.from({ length: 60 }, (_, i) => cauGia('I', i, 'bai_tap')), II: [], III: [] } as Record<PhanDe, CauUngVien[]>
  const cauCua = new Map(uv.I.map((c) => [c.id, c]))
  const ESTER = 'ESTER.THUY_PHAN_BASE.TINH_KHOI_LUONG'
  const maDangCua = new Map(uv.I.map((c, i) => [c.id, i < 14 ? ESTER : 'AMIN.TINH_BAZO.SO_SANH']))
  const ds = ['12001', '12002', '12003', '12004']
  const cung = { lam: I(10), sai: I(10) }
  const dsCa = [ca('ca0', Object.fromEntries(ds.map((s) => [s, cung])))]
  const demSai = demLanSai(dsCa)
  const daLam = new Set(I(10))

  it('BẢN CŨ (không hồ sơ): mọi em cùng nhóm nhận CÙNG một câu song sinh — đây là lỗi đang sửa', () => {
    const ss = ds.map((s) => chonCauLapChoEm(s, dsCa, 20, demSai, CAU_HINH_DE_RIENG_MAC_DINH, cauCua, daLam).songSinh)
    expect(new Set(ss.map((x) => x!.join())).size).toBe(1)
  })

  it('CÓ hồ sơ: bốn em, bốn ứng viên cùng mã dạng ⇒ bốn câu song sinh KHÁC nhau', () => {
    const demSongSinh = new Map<string, number>()
    const ss = ds.map((s) => chonCauLapChoEm(s, dsCa, 20, demSai, CAU_HINH_DE_RIENG_MAC_DINH, cauCua, daLam, { hoSo: hoSo(), ngayCa: NGAY_CA, maDangCua, seed: 99, demSongSinh }).songSinh!)
    for (const x of ss) expect(x).toHaveLength(1) // cần 3 ⇒ floor(3·0,5) = 1 câu song sinh
    expect(new Set(ss.map((x) => x[0])).size).toBe(4)
    // …và đều là câu CÙNG MÃ DẠNG với câu gốc, không phải câu bài tập bất kỳ.
    for (const x of ss) expect(['I-10', 'I-11', 'I-12', 'I-13']).toContain(x[0])
  })

  it('chỉ HAI ứng viên mà hai em ⇒ vẫn khác nhau (đếm số em đã nhận, không trông vào may rủi của hash)', () => {
    const hep = new Map([...maDangCua].map(([q, m]) => [q, q === 'I-12' || q === 'I-13' ? 'KHAC.X.Y' : m]))
    for (let seed = 0; seed < 40; seed++) {
      const dem = new Map<string, number>()
      const a = chonCauLapChoEm('12001', dsCa, 20, demSai, CAU_HINH_DE_RIENG_MAC_DINH, cauCua, daLam, { hoSo: hoSo(), maDangCua: hep, seed, demSongSinh: dem }).songSinh!
      const b = chonCauLapChoEm('12002', dsCa, 20, demSai, CAU_HINH_DE_RIENG_MAC_DINH, cauCua, daLam, { hoSo: hoSo(), maDangCua: hep, seed, demSongSinh: dem }).songSinh!
      expect(a[0]).not.toBe(b[0])
      expect(['I-10', 'I-11']).toContain(a[0])
      expect(['I-10', 'I-11']).toContain(b[0])
    }
  })

  it('mã dạng của câu gốc lấy từ HỒ SƠ trước, kho sau', () => {
    // Kho không biết dạng của I-0 (câu nối từ ca cũ), hồ sơ thì biết.
    const thieu = new Map([...maDangCua].filter(([q]) => q !== 'I-0'))
    const hs = hoSo({ sai: [conSai('I-0', null, ESTER)] })
    const ra = chonCauLapChoEm('12001', [ca('ca0', { '12001': { lam: I(10), sai: ['I-0', 'I-1', 'I-2', 'I-3', 'I-4', 'I-5', 'I-6'] } })], 20, demSai, CAU_HINH_DE_RIENG_MAC_DINH, cauCua, daLam, { hoSo: hs, maDangCua: thieu, seed: 1 })
    expect(ra.songSinh).toHaveLength(1)
    expect(['I-10', 'I-11', 'I-12', 'I-13']).toContain(ra.songSinh![0])
  })

  it('có mã dạng mà kho KHÔNG còn câu cùng dạng ⇒ giữ câu gốc, không ghép bừa sang dạng khác', () => {
    const motMinh = new Map(uv.I.map((c, i) => [c.id, i < 10 ? ESTER : 'AMIN.TINH_BAZO.SO_SANH']))
    const ra = chonCauLapChoEm('12001', dsCa, 20, demSai, CAU_HINH_DE_RIENG_MAC_DINH, cauCua, daLam, { hoSo: hoSo(), maDangCua: motMinh, seed: 1 })
    expect(ra.songSinh).toEqual([])
    expect(ra.cauGoc).toEqual(['I-0', 'I-1', 'I-2'])
  })

  it('THIẾU mã dạng ⇒ lùi về khoá cũ `phan:lý thuyết|bài tập`, vẫn xoay theo em', () => {
    const dem = new Map<string, number>()
    const ss = ds.map((s) => chonCauLapChoEm(s, dsCa, 20, demSai, CAU_HINH_DE_RIENG_MAC_DINH, cauCua, daLam, { hoSo: hoSo(), seed: 3, demSongSinh: dem }).songSinh!)
    for (const x of ss) expect(x).toHaveLength(1)
    expect(new Set(ss.map((x) => x[0])).size).toBe(4)
  })

  it('mã `CD:<chuyên đề>` kèm lý thuyết/bài tập: câu tính toán không ghép với câu lý thuyết cùng chuyên đề', () => {
    const kho = [...I(10).map((_, i) => cauGia('I', i, 'bai_tap', 'Ester')), cauGia('I', 10, 'ly_thuyet', 'Ester'), cauGia('I', 11, 'bai_tap', 'Ester')]
    const ra = chonCauLapChoEm('12001', dsCa, 20, demSai, CAU_HINH_DE_RIENG_MAC_DINH, new Map(kho.map((c) => [c.id, c])), daLam, { hoSo: hoSo(), maDangCua: new Map(kho.map((c) => [c.id, 'CD:Ester'])), seed: 1 })
    expect(ra.songSinh).toEqual(['I-11'])
  })

  it('câu em vừa làm trong tuần (`lam`) không được chọn làm song sinh', () => {
    const ra = chonCauLapChoEm('12001', dsCa, 20, demSai, CAU_HINH_DE_RIENG_MAC_DINH, cauCua, daLam, { hoSo: hoSo({ lam: ['I-10', 'I-11', 'I-12'] }), maDangCua, seed: 1 })
    expect(ra.songSinh).toEqual(['I-13'])
  })

  it('cả lớp qua dungDeRieng: nhóm 4 em cùng sai một bộ câu nhận 4 câu song sinh khác nhau, câu song sinh KHÔNG bị pha B đổi mất', () => {
    const y: YeuCauDeRieng = { uv, yc: { soCau: { I: 12, II: 0, III: 0 }, chuyenDe: [], mucDo: [], tranhQid: [], seed: 77 }, dsSbd: ds, dsCa, hoSo: {}, ngayCa: NGAY_CA, maDangCua: Object.fromEntries(maDangCua) }
    const ra = dungDeRieng(y)
    const ss = ds.map((s) => ra.songSinhTheoEm[s]!)
    for (const x of ss) expect(x).toHaveLength(1)
    expect(new Set(ss.map((x) => x[0])).size).toBe(4)
    for (const s of ds) for (const q of ra.lapTheoEm[s]!) expect(ra.boTheoEm[s]).toContain(q)
  })

  it('thuật toán KHÔNG dùng Math.random; Date.now chỉ còn là mốc ngân sách giờ của sinhBoMotO', () => {
    const DUNG = fs.readFileSync(path.join(process.cwd(), 'src/lib/de-rieng.ts'), 'utf8')
    const TRAN = fs.readFileSync(path.join(process.cwd(), 'src/lib/de-rieng-tran-trung.ts'), 'utf8')
    // Soi LỜI GỌI (có ngoặc) — chữ `Math.random` trong chú thích cấm dùng thì được.
    expect(DUNG).not.toContain('Math.random(')
    expect(TRAN).not.toContain('Math.random(')
    expect(DUNG.match(/Date\.now\(\)/g)).toHaveLength(1)
    expect(DUNG).toContain('CAU_HINH_TRAN_TRUNG_MAC_DINH, Date.now(), boSan, boSan, camTheoEm)')
    expect(DUNG).toContain('hashSeed(`${tuyChon.seed ?? 0}|${sbd}|${khoa}`)')
  })
})

// ===========================================================================
describe('4. PHA B — tập CẤM THEO TỪNG EM, giữ mọi bất biến chặn trần trùng', () => {
  const kho = (N: number) => Array.from({ length: N }, (_, i) => `q${i}`)
  /** Tập cấm như đời thật: 12 câu BTVN CẢ LỚP vừa làm + 8 câu riêng từng em. */
  function camDoiThat(ids: string[], m: number, seed: number): string[][] {
    const r = bocSoGia(seed)
    const chung = ids.filter((_, i) => i % 17 === 3).slice(0, 12)
    return Array.from({ length: m }, () => [...Array.from({ length: 8 }, () => ids[Math.floor(r() * ids.length)]!), ...chung])
  }
  const kiem = (bo: Set<string>[], cam: string[][], k: number) => {
    bo.forEach((s, e) => {
      expect(s.size).toBe(k)
      for (const q of cam[e]!) expect(s.has(q), `em ${e} nhận câu cấm ${q}`).toBe(false)
    })
  }

  it('kho đủ: không em nào nhận câu trong tập cấm của mình, đủ số câu, soNoi toàn 0', () => {
    const ids = kho(200)
    const cam = camDoiThat(ids, 30, 1)
    const c: CamTheoEm = { cam }
    const bo = sinhBoMotO(ids, 18, 30, 4242, undefined, 0, undefined, undefined, c)
    kiem(bo, cam, 18)
    expect(c.soNoi).toEqual(new Array(30).fill(0))
  })

  it('kho 200 · 30 em · 18 câu: đỉnh trùng ≤ 2; kho 300: ≤ 1 — CÓ tập cấm vẫn đạt', () => {
    for (const [N, tran] of [[200, 2], [300, 1]] as const) {
      for (let seed = 1; seed <= 5; seed++) {
        const ids = kho(N)
        const cam = camDoiThat(ids, 30, seed)
        const bo = sinhBoMotO(ids, 18, 30, seed * 1000, undefined, 0, undefined, undefined, { cam })
        kiem(bo, cam, 18)
        expect(doTrung(bo).dinh, `kho ${N} seed ${seed}`).toBeLessThanOrEqual(tran)
      }
    }
  }, HAN_NANG)

  it('kho còn lại SAU KHI TRỪ câu cấm vẫn ≥ m·k ⇒ đỉnh trùng bằng 0 tuyệt đối', () => {
    // 30 em × 18 câu = 540. Tập cấm chạm nhiều nhất 12 + 30·8 = 252 câu khác nhau,
    // nên kho 900 còn ≥ 648 câu không ai cấm ⇒ phải về 0.
    const rong = kho(900)
    const camRong = camDoiThat(rong, 30, 9)
    const bo = sinhBoMotO(rong, 18, 30, 31337, undefined, 0, undefined, undefined, { cam: camRong })
    kiem(bo, camRong, 18)
    expect(doTrung(bo).dinh).toBe(0)
    // Kho 600 (còn ≥ 348 < 540) thì không hứa 0 — nhưng vẫn đủ câu và không dính câu cấm.
    const ids = kho(600)
    const cam = camDoiThat(ids, 30, 9)
    kiem(sinhBoMotO(ids, 18, 30, 31337, undefined, 0, undefined, undefined, { cam }), cam, 18)
  })

  it('lệch tần suất ≤ 1 trên các câu KHÔNG ai cấm (câu cả lớp cấm thì đương nhiên 0 lần)', () => {
    const ids = kho(200)
    const chung = ids.filter((_, i) => i % 17 === 3).slice(0, 12)
    const cam = Array.from({ length: 30 }, () => [...chung])
    const c: CamTheoEm = { cam }
    // Chỉ pha 1 mới hứa tần suất; pha 2 đổi chỗ giữ nguyên tần suất nên đo sau cả hai pha.
    const bo = sinhBoMotO(ids, 18, 30, 8, undefined, 0, undefined, undefined, c)
    kiem(bo, cam, 18)
    const tuDo = ids.filter((q) => !chung.includes(q))
    expect(lechTanSuat(bo, tuDo)).toBeLessThanOrEqual(1)
    for (const q of chung) expect(bo.some((s) => s.has(q))).toBe(false)
  })

  it('câu khắc phục bị KHOÁ không bị đổi mất, và được MIỄN tập cấm', () => {
    const ids = kho(120)
    const boSan = Array.from({ length: 25 }, (_, e) => new Set([`q${e}`, `q${e + 40}`, `q${e + 80}`]))
    const cam = camDoiThat(ids, 25, 3)
    const bo = sinhBoMotO(ids, 15, 25, 6, undefined, 0, boSan.map((s) => new Set(s)), boSan, { cam })
    bo.forEach((s, e) => {
      expect(s.size).toBe(15)
      for (const q of boSan[e]!) expect(s.has(q)).toBe(true)
      for (const q of cam[e]!) if (!boSan[e]!.has(q)) expect(s.has(q)).toBe(false)
    })
  })

  it('không em nào nhận hai lần một câu — 40 cấu hình ngẫu nhiên có tập cấm và câu khoá', () => {
    const r = bocSoGia(2026)
    for (let c = 0; c < 40; c++) {
      const N = 20 + Math.floor(r() * 250)
      const k = 1 + Math.floor(r() * 30)
      const m = 2 + Math.floor(r() * 40)
      const ids = kho(N)
      const boSan = Array.from({ length: m }, () => new Set(ids.filter(() => r() < 0.02).slice(0, Math.min(k, 3))))
      const cam = Array.from({ length: m }, () => ids.filter(() => r() < 0.15))
      const ct: CamTheoEm = { cam }
      const bo = sinhBoMotO(ids, k, m, Math.floor(r() * 2 ** 31), undefined, 0, boSan.map((s) => new Set(s)), boSan, ct)
      const can = Math.min(k, N)
      bo.forEach((s, e) => {
        expect(s.size, `cấu hình ${c} em ${e}`).toBe(can)
        for (const q of boSan[e]!) expect(s.has(q)).toBe(true)
        // Số câu cấm lọt vào đề (không kể câu khoá) ĐÚNG BẰNG… không quá số đã báo nới.
        const lot = cam[e]!.filter((q) => s.has(q) && !boSan[e]!.has(q)).length
        expect(lot, `cấu hình ${c} em ${e}`).toBeLessThanOrEqual(ct.soNoi![e]!)
      })
    }
  }, HAN_NANG)

  it('cùng đầu vào → cùng kết quả', () => {
    const ids = kho(200)
    const cam = camDoiThat(ids, 30, 5)
    const a = sinhBoMotO(ids, 18, 30, 77, undefined, 0, undefined, undefined, { cam })
    const b = sinhBoMotO(ids, 18, 30, 77, undefined, 0, undefined, undefined, { cam: cam.map((x) => [...x]) })
    expect(b.map((s) => [...s])).toEqual(a.map((s) => [...s]))
  })

  it('tập cấm TOÀN RỖNG ⇒ y hệt lời gọi không có tập cấm', () => {
    const ids = kho(150)
    const a = sinhBoMotO(ids, 18, 30, 123, undefined, 0)
    const b = sinhBoMotO(ids, 18, 30, 123, undefined, 0, undefined, undefined, { cam: Array.from({ length: 30 }, () => []) })
    expect(b.map((s) => [...s])).toEqual(a.map((s) => [...s]))
  })

  it('60 em × 40 câu, kho 300, CÓ tập cấm: dưới 500 ms', () => {
    // Lấy lần NHANH NHẤT trong 3 lần: cái cần đo là giá của thuật toán, không phải
    // máy lúc đó bận tới đâu. Một lần đo đơn lẻ dưới tải nặng ra 444 ms dù lúc rảnh chỉ 165 ms.
    const ids = kho(300)
    const cam = camDoiThat(ids, 60, 11)
    let nhanhNhat = Infinity
    for (let lan = 0; lan < 3; lan++) {
      const t0 = performance.now()
      const bo = sinhBoMotO(ids, 40, 60, 2024, undefined, Date.now(), undefined, undefined, { cam })
      nhanhNhat = Math.min(nhanhNhat, performance.now() - t0)
      kiem(bo, cam, 40)
    }
    expect(nhanhNhat).toBeLessThan(500)
  }, HAN_NANG)

  it('cả lớp qua dungDeRieng: câu MỚI không nằm trong `lam` của em; câu khắc phục của chính em thì vẫn hỏi lại dù nằm trong `lam`', () => {
    const uv = { I: Array.from({ length: 200 }, (_, i) => cauGia('I', i)), II: Array.from({ length: 40 }, (_, i) => cauGia('II', i)), III: Array.from({ length: 40 }, (_, i) => cauGia('III', i)) }
    const ds = Array.from({ length: 30 }, (_, i) => String(12000 + i))
    const r = bocSoGia(44)
    // Ca tuần trước: mỗi em làm 18 câu Phần I, sai 6 — và CẢ 18 câu đó nằm trong `lam` (nguồn `thi`).
    const cuaEm = Object.fromEntries(ds.map((s) => {
      const lam = uv.I.map((c) => c.id).filter(() => r() < 0.09).slice(0, 18)
      return [s, { lam, sai: lam.slice(0, 6) }]
    }))
    const dsCa = [ca('ca0', cuaEm)]
    const btvn = ['I-190', 'I-191', 'I-192', 'II-5', 'III-7']
    const hoSoLop = Object.fromEntries(ds.map((s) => [s, hoSo({ lam: [...btvn, ...cuaEm[s]!.lam] })]))
    const ra = dungDeRieng({ uv, yc: { soCau: { I: 18, II: 4, III: 6 }, chuyenDe: [], mucDo: [], tranhQid: [], seed: 2026 }, dsSbd: ds, dsCa, ch: KHONG_SONG_SINH, hoSo: hoSoLop, ngayCa: NGAY_CA })
    expect(ra.noiCam).toEqual([])
    expect(ra.thieuCau).toEqual([])
    for (const s of ds) {
      const de = ra.boTheoEm[s]!
      expect(de).toHaveLength(28)
      expect(new Set(de).size).toBe(28)
      const lap = new Set(ra.lapTheoEm[s]!)
      expect(lap.size).toBe(2) // sai 6 ⇒ cần ceil(1,8) = 2
      for (const q of lap) expect(cuaEm[s]!.sai).toContain(q)
      const cam = new Set(hoSoLop[s]!.lam)
      for (const q of de) if (!lap.has(q)) expect(cam.has(q), `em ${s} nhận lại câu vừa làm ${q}`).toBe(false)
    }
  })
})

// ===========================================================================
describe('5. KHO MỎNG → nới tập cấm của ĐÚNG em đó, câu CŨ NHẤT trước, có BÁO SỐ', () => {
  it('noiTapCam: nới vừa đủ số thiếu, từ CUỐI mảng; em kho vẫn đủ thì không nới', () => {
    const ids = Array.from({ length: 20 }, (_, i) => `q${i}`)
    // Em 0: cấm 10 câu (q0 mới nhất … q9 cũ nhất) ⇒ còn 10 câu phát được, cần 18 ⇒ nới 8 câu cũ nhất q2..q9.
    // Em 1: cấm 2 câu ⇒ còn 18, vừa đủ ⇒ không nới. Câu ngoài kho (`la`) không được đếm.
    const ra = noiTapCam(ids, 18, 2, undefined, [['q0', 'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'la'], ['q0', 'q1']])
    expect(ra.soNoi).toEqual([8, 0])
    expect([...ra.cam[0]!]).toEqual(['q0', 'q1'])
    expect([...ra.cam[1]!]).toEqual(['q0', 'q1'])
  })

  it('sinhBoMotO: em thiếu vẫn ĐỦ câu, hai câu mới làm nhất vẫn bị cấm, số nới ghi vào soNoi', () => {
    const ids = Array.from({ length: 20 }, (_, i) => `q${i}`)
    const c: CamTheoEm = { cam: [['q0', 'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9'], [], ['q19']] }
    const bo = sinhBoMotO(ids, 18, 3, 5, undefined, 0, undefined, undefined, c)
    expect(c.soNoi).toEqual([8, 0, 0])
    for (const s of bo) expect(s.size).toBe(18)
    expect(bo[0]!.has('q0')).toBe(false)
    expect(bo[0]!.has('q1')).toBe(false)
    expect(bo[2]!.has('q19')).toBe(false)
  })

  it('dungDeRieng báo đúng em, đúng số — không im lặng, và không em nào thiếu câu', () => {
    const uv = { I: Array.from({ length: 20 }, (_, i) => cauGia('I', i)), II: [], III: [] } as Record<PhanDe, CauUngVien[]>
    const ds = ['12001', '12002', '12003']
    const ra = dungDeRieng({ uv, yc: { soCau: { I: 18, II: 0, III: 0 }, chuyenDe: [], mucDo: [], tranhQid: [], seed: 1 }, dsSbd: ds, dsCa: [], hoSo: { '12001': hoSo({ lam: I(10) }), '12003': hoSo({ lam: ['I-19'] }) }, ngayCa: NGAY_CA })
    expect(ra.noiCam).toEqual([{ sbd: '12001', soNoi: 8 }])
    expect(ra.thieuCau).toEqual([])
    for (const s of ds) expect(ra.boTheoEm[s]).toHaveLength(18)
    expect(ra.boTheoEm['12001']).not.toContain('I-0')
    expect(ra.boTheoEm['12001']).not.toContain('I-1')
    expect(ra.boTheoEm['12003']).not.toContain('I-19')
  })
})

// ===========================================================================
describe('6. KHÔNG CÓ HỒ SƠ / LỆNH LỖI → bộ đề Y HỆT bản trước 19/09', () => {
  // Dấu vân tay lấy bằng cách chạy MÃ CŨ (commit 6eefaa3: de-rieng.ts +
  // de-rieng-tran-trung.ts nguyên bản) trên 30 lớp của `_lop-gia-de-rieng.ts`.
  // Mỗi dòng: [vân tay boTheoEm, tổng câu lặp, tổng câu song sinh]. Lệch MỘT câu
  // của MỘT em là vân tay đổi.
  const VANG: [number, number, number][] = [
    [882033374, 21, 8], [43548604, 94, 36], [133959758, 10, 3], [4052165086, 32, 10], [574300676, 109, 37], [4059737538, 68, 29],
    [1811013718, 7, 3], [808970977, 41, 13], [3497091484, 93, 36], [1827854829, 138, 55], [4197653564, 107, 47], [2452108440, 76, 30],
    [4180710158, 11, 3], [645382804, 51, 19], [3916107363, 17, 8], [1296137954, 90, 25], [2032811580, 3, 1], [430792747, 195, 83],
    [2309753119, 96, 35], [2262812427, 30, 13], [1497405579, 23, 10], [1578608645, 92, 36], [2141141777, 43, 16], [1690039621, 56, 13],
    [1683449833, 29, 8], [1056812084, 56, 24], [2116913886, 23, 7], [3237606809, 77, 31], [2055775028, 96, 35], [148319052, 88, 36],
  ]

  it('30 lớp ngẫu nhiên (có song sinh, có ba_ca, có ca 14 câu): vân tay khớp mã cũ từng lớp', () => {
    VANG.forEach(([van, soLap, soSS], c) => {
      const ra = dungDeRieng(lopGia(c))
      expect(vanTay(ra.boTheoEm), `lớp ${c}`).toBe(van)
      expect(Object.values(ra.lapTheoEm).reduce((t, x) => t + x.length, 0), `lớp ${c} · câu lặp`).toBe(soLap)
      expect(Object.values(ra.songSinhTheoEm).reduce((t, x) => t + x.length, 0), `lớp ${c} · song sinh`).toBe(soSS)
      expect(ra.noiCam).toEqual([])
      expect(ra.daKhacPhucTheoEm).toEqual({})
    })
  }, HAN_NANG)

  // --- Tầng đi lấy dữ liệu: lệnh hỏng thì cả ca rơi về đường cũ -------------
  const mcq = (id: string, them: Record<string, unknown> = {}) => ({ id, text: `Câu ${id} tính khối lượng m gam`, choices: ['1', '2', '3', '4'] as [string, string, string, string], correct: 'A' as const, chuyenDe: 'Ester', ...them })
  const BANK = [{ maDe: 'D', phanI: Array.from({ length: 80 }, (_, i) => mcq(`D-${i}`)), phanII: [], phanIII: [] }]
  const DS = Array.from({ length: 45 }, (_, i) => String(12000 + i))
  const SAI = Object.fromEntries(DS.map((s, e) => [s, Array.from({ length: 7 }, (_, j) => `D-${(e * 3 + j * 5) % 80}`)]))
  const LAM = Object.fromEntries(DS.map((s) => [s, [...SAI[s]!, 'D-70', 'D-71']]))

  beforeEach(() => {
    for (const f of [hoSoOnCa, banDoSaiCa, danhSachCa, danhSachEm, loadSessionTeacherBank, docSoCauCa]) f.mockReset()
    noiKhoCa.mockClear()
    loadSessionTeacherBank.mockResolvedValue(BANK)
    docSoCauCa.mockResolvedValue({ I: 14, II: 0, III: 0 })
    danhSachCa.mockResolvedValue([
      { maCa: 'moi', tenCa: '2009 - Lớp 1', loai: 'thi', trangThai: 'dang_mo', moLuc: '2026-09-21T01:00:00Z' },
      { maCa: 'cu', tenCa: '2009 - Lớp 1', loai: 'thi', trangThai: 'da_dong', moLuc: '2026-09-14T01:00:00Z' },
    ])
    danhSachEm.mockResolvedValue(DS.map((sbd) => ({ sbd, namSinh: '2009', lop: 'L1' })))
    banDoSaiCa.mockResolvedValue({ cu: { sai: SAI, lam: LAM } })
  })

  it('máy chủ CHƯA CÓ lệnh hoSoOnCa (mọi lô ném lỗi) ⇒ boTheoEm y hệt lời gọi không hồ sơ, và biên bản NÓI RA', async () => {
    hoSoOnCa.mockRejectedValue(new Error('Lệnh lạ: hoSoOnCa'))
    const ra = await dungDeRiengChoCa('u', 'm', 'moi', DS, CAU_HINH_DE_RIENG_MAC_DINH, { ngayCa: NGAY_CA })
    expect(ra.hoSoOn).toEqual({ coHoSo: false, ngayCa: NGAY_CA, soEmCoHoSo: 0, soEmHong: 45, loi: 'Lệnh lạ: hoSoOnCa' })
    expect(ra.boQua.some((b) => b.maCa === 'hồ sơ ôn' && b.vi_sao.includes('rút đúng luật cũ'))).toBe(true)
    expect(ra.noiCam).toEqual([])

    // So với LÕI gọi thẳng KHÔNG hồ sơ — chính đường mà 30 dấu vân tay ở trên đã
    // khoá khớp mã cũ (commit 6eefaa3):
    const { dungUngVien } = await import('../src/lib/rut-de')
    const { hashSeed } = await import('../src/lib/exam-shuffle')
    const thang = dungDeRieng({ uv: dungUngVien(BANK as never), yc: { soCau: { I: 14, II: 0, III: 0 }, chuyenDe: [], mucDo: [], tranhQid: [], seed: hashSeed('moi') }, dsSbd: DS, dsCa: [{ maCa: 'cu', daLamCua: LAM, saiCua: SAI }], ch: CAU_HINH_DE_RIENG_MAC_DINH })
    expect(ra.boTheoEm).toEqual(thang.boTheoEm)
    expect(ra.lapTheoEm).toEqual(thang.lapTheoEm)
    expect(ra.songSinhTheoEm).toEqual(thang.songSinhTheoEm)
    // Ca này CÓ câu song sinh — nếu không thì phép so trên chẳng khoá được gì.
    expect(Object.values(thang.songSinhTheoEm).reduce((t, x) => t + x.length, 0)).toBeGreaterThan(0)
  })

  it('chia lô 20 em: 45 em ⇒ 3 lệnh (20 + 20 + 5), đúng tham số hợp đồng', async () => {
    hoSoOnCa.mockImplementation(async (_u: string, _m: string, lo: string[]) => Object.fromEntries(lo.map((s) => [s, { tuCa: 'cu', sai: [], daKhacPhuc: [], lam: [] }])))
    const ra = await dungDeRiengChoCa('u', 'm', 'moi', DS, CAU_HINH_DE_RIENG_MAC_DINH, { ngayCa: NGAY_CA })
    expect(hoSoOnCa.mock.calls.map((c) => (c[2] as string[]).length)).toEqual([20, 20, 5])
    for (const c of hoSoOnCa.mock.calls) expect(c.slice(3)).toEqual(['moi', NGAY_CA, 1])
    expect(ra.hoSoOn.coHoSo).toBe(true)
    expect(ra.hoSoOn.soEmCoHoSo).toBe(45)
    expect(ra.boQua.some((b) => b.maCa === 'hồ sơ ôn')).toBe(false)
  })

  it('phạm vi "3 ca" ⇒ gửi soCa = 3', async () => {
    hoSoOnCa.mockResolvedValue({})
    await dungDeRiengChoCa('u', 'm', 'moi', DS.slice(0, 3), { ...CAU_HINH_DE_RIENG_MAC_DINH, PHAM_VI_HOI_LAI: 'ba_ca' }, { ngayCa: NGAY_CA })
    expect(hoSoOnCa.mock.calls[0]!.slice(3)).toEqual(['moi', NGAY_CA, 3])
  })

  it('MỘT lô hỏng: các em lô đó đi luật cũ, lô khác vẫn dùng hồ sơ; biên bản ghi số em', async () => {
    hoSoOnCa.mockImplementation(async (_u: string, _m: string, lo: string[]) => {
      if (lo.includes('12020')) throw new Error('mất mạng')
      return Object.fromEntries(lo.map((s) => [s, { tuCa: 'cu', sai: [], daKhacPhuc: SAI[s], lam: [] }]))
    })
    const ra = await dungDeRiengChoCa('u', 'm', 'moi', DS, CAU_HINH_DE_RIENG_MAC_DINH, { ngayCa: NGAY_CA })
    expect(ra.hoSoOn).toEqual({ coHoSo: true, ngayCa: NGAY_CA, soEmCoHoSo: 25, soEmHong: 20, loi: 'mất mạng' })
    expect(ra.boQua.some((b) => b.maCa === 'hồ sơ ôn' && b.vi_sao.includes('20 em'))).toBe(true)
    expect(ra.lapTheoEm['12000']).toEqual([]) // đã khắc phục hết ⇒ không hỏi lại
    expect(ra.daKhacPhucTheoEm['12000']).toEqual(SAI['12000'])
    expect(ra.lapTheoEm['12020']!.length).toBe(3) // lô hỏng ⇒ luật cũ: sai 7 ⇒ 3 câu
    for (const s of DS) expect(ra.boTheoEm[s]).toHaveLength(14)
  })

  it('docHoSoOnCa không bao giờ ném lỗi; SBD lạ máy chủ trả thừa thì bỏ', async () => {
    hoSoOnCa.mockResolvedValue({ '12000': { lam: ['X'] }, '99999': { lam: ['Y'] } })
    const ra = await docHoSoOnCa('u', 'm', ['12000', '12000', ' ', '12001'], 'moi', NGAY_CA)
    expect(hoSoOnCa).toHaveBeenCalledTimes(1)
    expect(hoSoOnCa.mock.calls[0]![2]).toEqual(['12000', '12001'])
    expect(ra.hoSo).toEqual({ '12000': { tuCa: '', sai: [], daKhacPhuc: [], lam: ['X'] } })
    hoSoOnCa.mockRejectedValue('hỏng kiểu lạ')
    expect(await docHoSoOnCa('u', 'm', ['12000'], 'moi', NGAY_CA)).toEqual({ hoSo: undefined, soEmHong: 1, loi: 'không đọc được hồ sơ ôn' })
  })

  it('exam-api.hoSoOnCa: gửi đúng action + tham số; ok:false thì NÉM LỖI (không trả {} giả)', () => {
    const API = fs.readFileSync(path.join(process.cwd(), 'src/lib/exam-api.ts'), 'utf8')
    expect(API).toContain("{ action: 'hoSoOnCa', secret, dsSbd: ds, maCa, ngayCa, ...(soCa === 3 ? { soCa: 3 } : {}) }")
    expect(API).toContain("if (!r.ok) throw new Error(r.error || 'Không đọc được hồ sơ ôn')")
  })

  it('mã dạng của kho: `dang.ma` trước, thiếu thì `CD:<chuyên đề>` — đúng quy ước máy chủ', () => {
    expect(maDangCuaKho([{ maDe: 'D', phanI: [mcq('a', { dang: { ma: 'ESTER.X.Y', ten: 't' } }), mcq('b', { dang: null }), mcq('c', { chuyenDe: '' })], phanII: [], phanIII: [] }] as never)).toEqual({ a: 'ESTER.X.Y', b: 'CD:Ester' })
  })

  it('ngày ca tính theo giờ VN: 17:30Z đã là ngày hôm sau ở Việt Nam', () => {
    expect(ngayVnCua(Date.parse('2026-09-20T16:59:59Z'))).toBe('2026-09-20')
    expect(ngayVnCua(Date.parse('2026-09-20T17:30:00Z'))).toBe('2026-09-21')
  })
})

// ===========================================================================
describe('7. CHẠY HAI LẦN cùng đầu vào → cùng JSON (có hồ sơ)', () => {
  it('6 lớp ngẫu nhiên kèm hồ sơ ngẫu nhiên: JSON toàn bộ kết quả trùng khít', () => {
    for (let c = 0; c < 6; c++) {
      const dung = (): string => {
        const y = lopGia(c)
        const r = bocSoGia(500 + c)
        const tat = [...y.uv.I, ...y.uv.II, ...y.uv.III]
        const hoSoLop: Record<string, HoSoOnEm> = {}
        for (const sbd of y.dsSbd) {
          if (r() < 0.15) continue // em chưa có dòng hồ sơ nào
          const sai = (y.dsCa.find((x) => (x.daLamCua[sbd] ?? []).length > 0)?.saiCua[sbd] ?? [])
          hoSoLop[sbd] = {
            tuCa: 'ca0',
            sai: sai.filter(() => r() < 0.5).map((q) => conSai(q, r() < 0.5 ? '2026-09-19' : '2026-09-28', r() < 0.5 ? `DANG.${Math.floor(r() * 4)}.X` : null)),
            daKhacPhuc: sai.filter(() => r() < 0.2),
            lam: tat.filter(() => r() < 0.2).map((x) => x.id),
          }
        }
        const maDangCua = Object.fromEntries(tat.filter(() => r() < 0.7).map((x) => [x.id, `DANG.${Math.floor(r() * 4)}.X`]))
        const ra = dungDeRieng({ ...y, hoSo: hoSoLop, ngayCa: NGAY_CA, maDangCua })
        // Bất biến của mọi lớp: mỗi em không trùng câu trong đề mình, câu lặp có thật trong đề.
        for (const sbd of y.dsSbd) {
          expect(new Set(ra.boTheoEm[sbd]).size).toBe(ra.boTheoEm[sbd]!.length)
          for (const q of ra.lapTheoEm[sbd]!) expect(ra.boTheoEm[sbd]).toContain(q)
          for (const q of ra.daKhacPhucTheoEm[sbd] ?? []) expect(ra.lapTheoEm[sbd]).not.toContain(q)
        }
        return JSON.stringify({ ...ra, ids: [...ra.ids] })
      }
      expect(dung()).toBe(dung())
    }
  }, HAN_NANG)
})

// ===========================================================================
describe('8. MÀN CA THI — đề riêng rút cho ĐÚNG những em trong phòng chờ', () => {
  // Lỗi tái hiện: bản 17/09 (b527061) dựng `dsCho` = phòng chờ ∪ MỌI em cùng lớp
  // trong danh sách đăng ký. Em vắng cũng chiếm suất chia vòng tròn và bị đếm vào
  // biên bản "thiếu câu hỏi lại" — trái ghi chú đầu khối "cho ĐÚNG những em đang đứng chờ".
  const MAN = fs.readFileSync(path.join(process.cwd(), 'src/screens/ExamMonitorScreen.tsx'), 'utf8')
  const than = MAN.slice(MAN.indexOf('const batDauCaNay = async () => {'), MAN.indexOf('/** HUỶ CA ĐANG CHỜ'))
  const nhanh = than.slice(than.indexOf('if (caCanDeRieng) {'), than.indexOf('// CHẶN TRẦN TRÙNG CÂU'))

  it('nhánh đề riêng lấy dsCho từ phòng chờ, KHÔNG gọi danh sách lớp để gộp thêm', () => {
    expect(nhanh.length).toBeGreaterThan(200)
    expect(nhanh).toContain('const dsCho = (chiTiet.dsCho ?? []).map((x) => x.sbd).filter(Boolean)')
    expect(nhanh).not.toContain('danhSachEm(')
    expect(nhanh).not.toContain('registered')
    expect(nhanh).toContain('dungDeRiengChoCa(scriptUrl.trim(), secret.trim(), chiTiet.ca.maCa, dsCho,')
  })

  it('phòng chờ trống thì vẫn dừng và báo, không rút đề cho ai', () => {
    expect(nhanh).toContain('if (dsCho.length === 0) {')
    expect(nhanh).toContain('Chưa em nào vào phòng chờ — chưa rút được đề riêng.')
  })
})
