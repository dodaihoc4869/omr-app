// @vitest-environment node
// LỘ ĐÁP ÁN CA KIỂM TRA QUA HAI LỆNH LUYỆN CÔNG KHAI (29/09).
//
// Luật app: "Đáp án không xuống máy học sinh trước khi nộp". Ca kiểm tra (`de/<mã ca>.json`, khoá đáp án
// `key/<mã ca>.json`) do máy thầy dựng TỪ KHO: `buildTeacherSourceFromKhoDe` giữ nguyên `qid` của kho
// (`c.qid || <mã đề>-<phần>-<số>`) rồi `mergeAndStrip` chép nguyên `id` sang gói ca. Nghĩa là câu của ca
// đang mở CŨNG LÀ câu trong `kho/<mã đề>.json` — gói kho mang `dap_an` + `loi_giai`.
//
// Hai lệnh `/goi` KHÔNG cần mã thầy, KHÔNG cần token, trả gói kho CÓ đáp án:
//   · `cauKhacPhuc`   — không gửi `sbd` thì không lọc khối, không lọc câu đã làm; đường theo chuyên đề trả NGUYÊN tờ.
//   · `deTheoDangBai` — trả trọn tờ dạng bài `DB-…` (câu chép từ tờ gốc, có thể mang qid gốc hoặc qid mới).
// Mười một kênh khác (game, Bi-a, Đoàn, luyện đề, kế hoạch ngày…) đều gỡ câu của đề thi đang bảo vệ bằng
// `protectedQuestions` (qid + nhóm nội dung); hai lệnh này thì KHÔNG — em đang thi gọi lệnh là thấy đáp án.
//
// Test dưới đây tái hiện đúng đường ấy (ca mở, chưa công bố, gọi lệnh KHÔNG kèm `sbd`), rồi khoá bản vá:
// câu của ca đang bảo vệ bị gỡ khỏi gói (khớp qid HOẶC nhóm nội dung), câu khác vẫn phục vụ đủ đáp án,
// ca đã công bố và đã hết giờ thì câu quay lại, không kiểm được phạm vi bảo vệ thì ĐÓNG CỬA (không trả gói).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cauKhacPhucGoi, deTheoDangBai } from '../server/src/goi-cu'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { buildTeacherSourceFromKhoDe, parseKhoDeJson } from '../src/lib/exam-kho-de-import'
import { mergeAndStrip } from '../src/data/examContent'
import worker from '../server/src/index'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

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

// Tờ dạng bài: chép câu từ kho. Một câu GIỮ qid gốc, một câu MẤT qid (thành `DB-…-I-2`) nhưng cùng nội dung,
// một câu tự do. Bản vá phải bắt được cả hai câu thi — một theo qid, một theo nhóm nội dung.
const MA_DB = 'DB-12-B1-D1'
const DB: Tho[] = [
  { ...cauI(1, DE_THI_1, 'B'), qid: 'DE-K-I-1' },
  { ...cauI(2, DE_THI_2, 'C') }, // không có qid ⇒ qid = DB-12-B1-D1-I-2, nội dung trùng câu thi DE-K-I-2
  { ...cauI(3, 'Câu dạng bài tự do.', 'A') },
]

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
  themTo(MA_DB, DB) // tờ DB- không có chỉ mục `cau_hoi` (bộ nạp cố tình bỏ)
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
  xoaDemCaBaoVe() // test sửa bảng `ca` bằng SQL thô ⇒ tự bỏ đệm 5 giây như đường ghi thật
  return maCa
}

/** Mọi câu (kèm đáp án) nằm trong các gói lệnh trả về — đọc cả `cau[]` lẫn `phanI/II/III`. */
function cauTrongGoi(goi: unknown): Tho[] {
  if (!goi || typeof goi !== 'object') return []
  const g = goi as Record<string, unknown>
  return ['cau', 'phanI', 'phanII', 'phanIII'].flatMap((k) => (Array.isArray(g[k]) ? (g[k] as Tho[]) : []))
}
const coDapAn = (c: Tho) => c.dap_an !== undefined && c.dap_an !== '' && c.dap_an !== null
const laDeThi = (c: Tho) => [DE_THI_1, DE_THI_2, DE_THI_3].includes(String(c.de))

type KqKhacPhuc = { ok: boolean; error?: string; items: unknown[]; thuTu: string[] }
type KqDangBai = { ok: boolean; error?: string; de?: unknown }

describe('Lộ đáp án ca đang mở qua `cauKhacPhuc` / `deTheoDangBai` (không kèm sbd)', () => {
  it('ca dựng từ kho giữ NGUYÊN qid của kho — tiền đề của lỗ hổng', () => {
    const d = dungKho()
    moCa(d)
    const ca = d.objects.get('de/CA-MO.json') as { phanI: { id: string }[] }
    expect(ca.phanI.map((q) => q.id)).toEqual(['DE-K-I-1', 'DE-K-I-2'])
  })

  it('cauKhacPhuc theo chuyên đề, KHÔNG sbd, ca đang mở: gói trả về không còn câu nào của ca (kể cả đáp án/lời giải)', async () => {
    const d = dungKho()
    moCa(d)
    const r = await cauKhacPhucGoi(d.env, { chuyenDe: ['CD1'], soCau: 50 }) as KqKhacPhuc
    expect(r.ok).toBe(true)
    const cau = r.items.flatMap(cauTrongGoi)
    expect(cau.filter(laDeThi)).toEqual([]) // trước bản vá: 3 câu thi, kèm dap_an 'B'/'C'/'DSDS' + loi_giai
    expect(r.thuTu.filter((q) => QID_THI.includes(q))).toEqual([])
    // Câu KHÔNG thuộc ca vẫn phục vụ đủ đáp án — luyện tập không bị hỏng.
    expect([...r.thuTu].sort()).toEqual([...QID_TU_DO].sort())
    expect(cau.map((c) => String(c.de)).sort()).toEqual(['Câu luyện tự do số ba.', 'Câu luyện tự do số bốn.'])
    for (const c of cau) expect(coDapAn(c)).toBe(true)
  })

  it('cauKhacPhuc theo dạng (dsDang), KHÔNG sbd, ca đang mở: không trả câu của ca', async () => {
    const d = dungKho()
    moCa(d)
    const r = await cauKhacPhucGoi(d.env, { chuyenDe: ['CD1'], dsDang: ['ES.A.X'], soCau: 50 }) as KqKhacPhuc
    expect(r.ok).toBe(true)
    const cau = r.items.flatMap(cauTrongGoi)
    expect(cau.filter(laDeThi)).toEqual([])
    expect([...r.thuTu].sort()).toEqual([...QID_TU_DO].sort())
  })

  it('deTheoDangBai, ca đang mở: gỡ câu thi khớp qid VÀ câu chép mất qid (khớp nhóm nội dung); câu tự do giữ đáp án', async () => {
    const d = dungKho()
    moCa(d)
    const r = await deTheoDangBai(d.env, { ma: MA_DB }) as KqDangBai
    expect(r.ok).toBe(true)
    const cau = cauTrongGoi(r.de)
    expect(cau.filter(laDeThi)).toEqual([]) // trước bản vá: I-1 (qid gốc) + I-2 (qid DB-…) kèm đáp án
    expect(cau.map((c) => String(c.de))).toEqual(['Câu dạng bài tự do.'])
    expect(coDapAn(cau[0]!)).toBe(true)
  })

  it('đường THẬT `/goi` của Worker, không mã thầy, không sbd: cả hai lệnh không còn đáp án câu đang thi', async () => {
    const d = dungKho()
    moCa(d)
    const r = await goiWorker(worker, d.env, '/goi', { action: 'cauKhacPhuc', chuyenDe: ['CD1'], soCau: 50 }) as KqKhacPhuc
    expect(r.ok).toBe(true)
    expect(r.items.flatMap(cauTrongGoi).filter(laDeThi)).toEqual([])
    expect(JSON.stringify(r)).not.toContain('Lời giải câu I.1')
    const r2 = await goiWorker(worker, d.env, '/goi', { action: 'deTheoDangBai', ma: MA_DB }) as KqDangBai
    expect(r2.ok).toBe(true)
    expect(JSON.stringify(r2)).not.toContain('Lời giải câu I.1')
    expect(JSON.stringify(r2)).not.toContain('Lời giải câu I.2')
  })

  it('có kèm sbd cũng bị gỡ như không kèm', async () => {
    const d = dungKho()
    d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Em Một','12A','mk','x')").run()
    moCa(d)
    const r = await cauKhacPhucGoi(d.env, { sbd: 'S1', chuyenDe: ['CD1'], soCau: 50 }) as KqKhacPhuc
    expect(r.items.flatMap(cauTrongGoi).filter(laDeThi)).toEqual([])
    expect([...r.thuTu].sort()).toEqual([...QID_TU_DO].sort())
  })

  it('tờ dạng bài chỉ toàn câu đang thi: báo tạm khoá, không trả tờ rỗng', async () => {
    const d = dungKho()
    d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES('DB-12-B1-D2','Dạng bài · 12 · Bài 1. Ester · Dạng Y','12',2,'kho/DB-12-B1-D2.json',0,'v1')").run()
    d.objects.set('kho/DB-12-B1-D2.json', { ma_de: 'DB-12-B1-D2', cau: [{ ...DB[0]! }, { ...DB[1]! }] })
    moCa(d)
    const r = await deTheoDangBai(d.env, { ma: 'DB-12-B1-D2' }) as KqDangBai
    expect(r.ok).toBe(false)
    expect(r.error).toContain('tạm khoá')
    expect(r.de).toBeUndefined()
  })

  it('ca đã đóng mà CHƯA công bố (cong_bo = khong): vẫn bảo vệ', async () => {
    const d = dungKho()
    moCa(d, { trangThai: 'dong', congBo: 'khong' })
    const r = await cauKhacPhucGoi(d.env, { chuyenDe: ['CD1'], soCau: 50 }) as KqKhacPhuc
    expect(r.items.flatMap(cauTrongGoi).filter(laDeThi)).toEqual([])
    const r2 = await deTheoDangBai(d.env, { ma: MA_DB }) as KqDangBai
    expect(cauTrongGoi(r2.de).filter(laDeThi)).toEqual([])
  })

  it('ca công bố NGAY nhưng còn trong giờ thi: vẫn bảo vệ (em chưa nộp vẫn đang làm)', async () => {
    const d = dungKho()
    moCa(d, { congBo: 'ngay' })
    const r = await cauKhacPhucGoi(d.env, { chuyenDe: ['CD1'], soCau: 50 }) as KqKhacPhuc
    expect(r.items.flatMap(cauTrongGoi).filter(laDeThi)).toEqual([])
  })

  it('ca đã công bố và hết giờ: câu quay lại kênh luyện (không chặn thừa)', async () => {
    const d = dungKho()
    moCa(d, { trangThai: 'dong', congBo: 'ca_lop_xong', batDau: T0 - 3 * 3_600_000, hetHanVao: T0 - 2 * 3_600_000 })
    const r = await cauKhacPhucGoi(d.env, { chuyenDe: ['CD1'], soCau: 50 }) as KqKhacPhuc
    expect([...r.thuTu].sort()).toEqual([...QID_THI, ...QID_TU_DO].sort())
    const r2 = await deTheoDangBai(d.env, { ma: MA_DB }) as KqDangBai
    expect(cauTrongGoi(r2.de)).toHaveLength(3)
  })

  it('không có ca nào: hai lệnh trả như cũ', async () => {
    const d = dungKho()
    const r = await cauKhacPhucGoi(d.env, { chuyenDe: ['CD1'], soCau: 50 }) as KqKhacPhuc
    expect([...r.thuTu].sort()).toEqual([...QID_THI, ...QID_TU_DO].sort())
    const r2 = await deTheoDangBai(d.env, { ma: MA_DB }) as KqDangBai
    expect(cauTrongGoi(r2.de)).toHaveLength(3)
  })

  it('không đọc được gói của ca đang mở ⇒ ĐÓNG CỬA: không trả gói có đáp án', async () => {
    const d = dungKho()
    moCa(d)
    d.objects.delete('de/CA-MO.json')
    const r = await cauKhacPhucGoi(d.env, { chuyenDe: ['CD1'], soCau: 50 }) as KqKhacPhuc
    expect(r.ok).toBe(false)
    expect(r.items ?? []).toEqual([])
    const r2 = await deTheoDangBai(d.env, { ma: MA_DB }) as KqDangBai
    expect(r2.ok).toBe(false)
    expect(r2.de).toBeUndefined()
  })
})
