// @vitest-environment node
// MỐC KHOÁ CA (thầy xác nhận 29/09): ca ĐÃ ĐÓNG bắt đầu trước 29/09/2026 00:00 (+07) không còn khoá câu; ca từ mốc trở đi và ca cũ còn MỞ vẫn khoá.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MOC_KHOA_CA, protectedQuestions, xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { buildTeacherSourceFromKhoDe, parseKhoDeJson } from '../src/lib/exam-kho-de-import'
import { mergeAndStrip } from '../src/data/examContent'
import { taoD1That, type D1That } from './_d1-that'

const T0 = Date.parse('2026-09-29T19:00:00+07:00')
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0); xoaDemCaBaoVe() })
afterEach(() => { vi.useRealTimers(); xoaDemCaBaoVe() })

type Tho = Record<string, unknown>
const PA = { A: 'Phương án A', B: 'Phương án B', C: 'Phương án C', D: 'Phương án D' }
const DANG = { ma: 'ES.A.X', ten: 'Dạng X' }
const cauI = (so: number, de: string, dapAn: string): Tho => ({
  phan: 'I', so, de, pa: PA, dap_an: dapAn, dang: DANG, chuyen_de: 'CD1', muc_do: 'biet',
  loi_giai: { noi_dung: `Lời giải câu I.${so}: chọn ${dapAn}.`, trang_thai: 'khop' },
})
const cauII = (so: number, de: string): Tho => ({
  phan: 'II', so, de, y: { a: 'ý a', b: 'ý b', c: 'ý c', d: 'ý d' }, dap_an: 'DSDS', dang: DANG, chuyen_de: 'CD1', muc_do: 'hieu',
  loi_giai: { noi_dung: `Lời giải câu II.${so}.`, trang_thai: 'khop' },
})

// Tờ kho gốc. I-1, I-2, II-1 sẽ vào ca đang mở; I-3, I-4 thì không.
const MA = 'DE-K'
const DE_THI_1 = 'Chất nào sau đây là ester no, đơn chức, mạch hở?'
const DE_THI_2 = 'Thuỷ phân hoàn toàn methyl acetate trong NaOH thu được muối nào?'
const DE_THI_3 = 'Cho các phát biểu về chất béo sau:'
const KHO: Tho[] = [
  cauI(1, DE_THI_1, 'B'),
  cauI(2, DE_THI_2, 'C'),
  cauI(3, 'Câu luyện tự do số ba.', 'A'),
  cauI(4, 'Câu luyện tự do số bốn.', 'D'),
  cauII(1, DE_THI_3),
]
const qidKho = (t: Tho) => `${MA}-${String(t.phan)}-${String(t.so)}`
const QID_THI = ['DE-K-I-1', 'DE-K-I-2', 'DE-K-II-1']
const QID_TU_DO = ['DE-K-I-3', 'DE-K-I-4']

function dungKho(): D1That {
  const d = taoD1That()
  const themTo = (maDe: string, cau: Tho[]) => {
    d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES(?,?,'12',?,?,0,'v1')")
      .run(maDe, maDe.startsWith('DB-') ? 'Dạng bài · 12 · Bài 1. Ester · Dạng X' : maDe, cau.length, `kho/${maDe}.json`)
    d.objects.set(`kho/${maDe}.json`, { ma_de: maDe, cau: cau.map((c) => ({ ...c })) })
  }
  themTo(MA, KHO)
  for (const t of KHO) {
    d.sql.prepare("INSERT INTO cau_hoi(qid,ma_de,chuyen_de,muc_do,phan,lop,co_loi_giai,cap_nhat_luc) VALUES(?,?,'CD1','biet',?,'12',1,'x')")
      .run(qidKho(t), MA, String(t.phan))
  }
  return d
}

/** Mở ca ĐÚNG như máy thầy: tờ kho → `buildTeacherSourceFromKhoDe` → lọc câu chọn → `mergeAndStrip` (gói công khai, không đáp án). */
function moCa(d: D1That, o: { maCa?: string; trangThai?: string; congBo?: string; batDau?: number; hetHanVao?: number; phut?: number } = {}) {
  const maCa = o.maCa ?? 'CA-MO'
  const parsed = parseKhoDeJson({ ma_de: MA, cau: KHO })
  const { source, errors } = buildTeacherSourceFromKhoDe(parsed.json!)
  expect(errors).toEqual([])
  const chon = new Set(QID_THI)
  const src = { ...source, phanI: source.phanI.filter((q) => chon.has(q.id)), phanII: source.phanII.filter((q) => chon.has(q.id)), phanIII: [] }
  const bank = mergeAndStrip([src])
  expect([...bank.phanI, ...bank.phanII].map((q) => q.id).sort()).toEqual([...QID_THI].sort()) // qid của ca = qid của kho
  expect(JSON.stringify(bank)).not.toContain('Lời giải') // gói ca công khai không có lời giải
  d.objects.set(`de/${maCa}.json`, bank)
  d.objects.set(`key/${maCa}.json`, { phanI: source.phanI.filter((q) => chon.has(q.id)), phanII: source.phanII.filter((q) => chon.has(q.id)), phanIII: [] })
  const batDau = o.batDau ?? T0 - 10 * 60_000
  d.sql.prepare(`INSERT INTO ca(ma_ca,ten_ca,trang_thai,bat_dau,het_han_vao,thoi_gian_phut,loai,cong_bo,bank_r2,cap_nhat_luc)
    VALUES(?,?,?,?,?,?,'thi',?,?,?)`).run(
    maCa, 'Ca kiểm tra Ester', o.trangThai ?? 'mo', new Date(batDau).toISOString(),
    new Date(o.hetHanVao ?? T0 + 20 * 60_000).toISOString(), o.phut ?? 45, o.congBo ?? 'khong', `de/${maCa}.json`, new Date(T0).toISOString(),
  )
  xoaDemCaBaoVe()
  return maCa
}

const TRUOC = Date.parse('2026-09-28T20:00:00+07:00')
describe('Mốc khoá ca 29/09 (thầy xác nhận)', () => {
  it('mốc là 00:00 ngày 29/09 giờ VN', () => { expect(Date.parse(MOC_KHOA_CA)).toBe(Date.parse('2026-09-29T00:00:00+07:00')) })
  it('ca ĐÃ ĐÓNG chưa công bố, bắt đầu TRƯỚC mốc ⇒ không khoá câu', async () => {
    const d = dungKho(); moCa(d, { trangThai: 'dong', congBo: 'khong', batDau: TRUOC, hetHanVao: TRUOC + 20 * 60_000 })
    const chan = await protectedQuestions(d.env)
    for (const q of QID_THI) expect(chan.has(q)).toBe(false)
  })
  it('ca đã đóng chưa công bố, bắt đầu TỪ mốc ⇒ vẫn khoá', async () => {
    const d = dungKho(); moCa(d, { trangThai: 'dong', congBo: 'khong', batDau: T0 - 3 * 3_600_000, hetHanVao: T0 - 3 * 3_600_000 + 20 * 60_000 })
    const chan = await protectedQuestions(d.env)
    for (const q of QID_THI) expect(chan.has(q)).toBe(true)
  })
  it('ca trước mốc mà vẫn ĐANG MỞ ⇒ vẫn khoá', async () => {
    const d = dungKho(); moCa(d, { trangThai: 'mo', congBo: 'khong', batDau: TRUOC, hetHanVao: T0 + 20 * 60_000 })
    const chan = await protectedQuestions(d.env)
    for (const q of QID_THI) expect(chan.has(q)).toBe(true)
  })
})
