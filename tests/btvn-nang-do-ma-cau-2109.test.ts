// BTVN "NÂNG ĐỠ" — MÃ CÂU app thầy gửi PHẢI KHỚP mã máy chủ chấm (Code 4, 21/09; Boss chặn đẩy vì `qidCuaCau` cũ gửi `q.id`).
// Máy chủ: `homeworkQuestions` (server/src/btvn-grading.ts) định danh câu = `<mã tờ kho gốc>-<phần>-<so>`; qid lạ ⇒ `boQuaQid`, nhãn mất, cá nhân hoá mù.
// Test KHOÁ bằng chính hàm của máy chủ (import thẳng): với cùng một tờ đề mẫu có đủ ba phần, danh sách qid app thầy gửi = danh sách qid máy chủ tạo ra, cùng thứ tự.
import { describe, expect, it } from 'vitest'
import { homeworkQuestions } from '../server/src/btvn-grading'
import { tachTheoPhan } from '../src/lib/tach-phan-de'
import { mayChuBoCauTuLuan, maDeGocMayChu, qidCuaCau, taoCauGiao } from '../src/lib/btvn-nang-do-thay'
import type { TeacherExamSource } from '../src/data/examContent'

/** Tờ kho MẪU trên máy chủ (R2 `kho/<mã gốc>.json`): đủ ba phần, `so` không liên tục (49, 3, 6…) để chứng minh mã theo `so`, không theo vị trí; phần III có câu tự luận bị máy chủ loại. */
const khoMau = (): Record<string, unknown>[] => [
  { phan: 'I', so: 1, dap_an: 'A', muc_do: 'biet' },
  { phan: 'I', so: 2, dap_an: 'B', muc_do: 'hieu' },
  { phan: 'I', so: 49, dap_an: 'C', muc_do: 'van_dung' },
  { phan: 'II', so: 3, dap_an: 'DDSS' },
  { phan: 'II', so: 4, dap_an: 'SSDD' },
  { phan: 'III', so: 5, dap_an: '2,5' },
  { phan: 'III', so: 6, dap_an: '0,25' },
  { phan: 'III', so: 7, dap_an: 'tạo ra este và nước cùng muối' }, // > 20 ký tự có khoảng trắng ⇒ bị loại
  { phan: 'III', so: 8, dap_an: 'CH3COOH; H2O' }, // có dấu ; ⇒ bị loại
  { phan: 'III', so: 9, dap_an: 'A→B' }, // có mũi tên ⇒ bị loại
]

const envKho = (kho: Record<string, Record<string, unknown>[]>) =>
  ({ DE: { get: async (k: string) => (kho[k.replace(/^kho\//, '').replace(/\.json$/, '')] ? { body: JSON.stringify({ cau: kho[k.replace(/^kho\//, '').replace(/\.json$/, '')] }) } : null) } }) as never

/** Tờ đề trên MÁY THẦY nạp từ cùng tờ kho: `id = <ma_de>-<phần>-<so>` (exam-kho-de-import.ts:443-469). */
const deMayThay = (maDe: string, kho: Record<string, unknown>[]): TeacherExamSource => {
  const theoPhan = (p: string) => kho.filter((c) => c.phan === p).map((c) => ({ id: `${maDe}-${p}-${c.so}`, correct: c.dap_an, mucDo: c.muc_do, chuyenDe: 'Ester' }))
  return { maDe, nhom: 'n', nguon: 'x', phanI: theoPhan('I'), phanII: theoPhan('II'), phanIII: theoPhan('III') } as never
}

describe('mã câu app thầy gửi = mã máy chủ chấm', () => {
  it('tờ mẫu đủ ba phần, tách TN/DS/TLN như màn Giao: qid y hệt `homeworkQuestions` của máy chủ (cả thứ tự, cả câu tự luận bị loại)', async () => {
    const goc = 'DH-12-C1-B2'
    const kho = khoMau()
    const dsTach = tachTheoPhan(deMayThay(goc, kho))
    expect(dsTach.map((d) => d.maDe)).toEqual([`${goc}-TN`, `${goc}-DS`, `${goc}-TLN`])
    const may = (await homeworkQuestions(envKho({ [goc]: kho }), dsTach.map((d) => d.maDe).join(','))).map((c) => String(c.qid))
    const thay = taoCauGiao(dsTach).map((c) => c.qid)
    expect(may).toEqual([`${goc}-I-1`, `${goc}-I-2`, `${goc}-I-49`, `${goc}-II-3`, `${goc}-II-4`, `${goc}-III-5`, `${goc}-III-6`])
    expect(thay).toEqual(may)
    // đúng ví dụ Code 3 nêu trong hợp đồng
    expect(thay).toContain('DH-12-C1-B2-I-49')
    expect(thay).toContain('DH-12-C1-B2-II-3')
    expect(thay).toContain('DH-12-C1-B2-III-6')
  })

  it('giao nguyên tờ (không tách hậu tố) cũng khớp máy chủ', async () => {
    const goc = 'DH-12-C1-B2'
    const kho = khoMau()
    const may = (await homeworkQuestions(envKho({ [goc]: kho }), goc)).map((c) => String(c.qid))
    expect(taoCauGiao([deMayThay(goc, kho)]).map((c) => c.qid)).toEqual(may)
  })

  it('tờ nạp sẵn theo phần (mã đã có -TN): id `X-TN-I-3` nhưng máy chủ dùng mã gốc ⇒ qid `X-I-3`', async () => {
    const kho = [{ phan: 'I', so: 3, dap_an: 'A' }, { phan: 'I', so: 4, dap_an: 'B' }]
    const de = deMayThay('X-TN', kho)
    const may = (await homeworkQuestions(envKho({ X: kho }), 'X-TN')).map((c) => String(c.qid))
    expect(may).toEqual(['X-I-3', 'X-I-4'])
    expect(taoCauGiao([de]).map((c) => c.qid)).toEqual(may)
    expect(de.phanI[0].id).toBe('X-TN-I-3') // đây là chỗ q.id lệch — nếu gửi thẳng q.id thì máy chủ bỏ hết
  })

  it('câu mang mã riêng của tờ khác (tờ ghép) ⇒ KHÔNG gửi (không đoán mã); máy chủ tự điền nhãn từ tờ kho', () => {
    const ghep = { maDe: 'TONG-ON', phanI: [{ id: 'DH-12-C1-B2-I-49' }, { id: 'TONG-ON-I-2' }], phanII: [], phanIII: [] } as never as TeacherExamSource
    expect(qidCuaCau('TONG-ON', 'I', { id: 'DH-12-C1-B2-I-49' })).toBeNull()
    expect(taoCauGiao([ghep]).map((c) => c.qid)).toEqual(['TONG-ON-I-2'])
  })

  it('id không có đuôi -<phần>-<số>, hoặc phần trong id khác phần đang đứng ⇒ null; số 03 chuẩn hoá thành 3', () => {
    expect(qidCuaCau('A', 'I', { id: 'A-1' })).toBeNull()
    expect(qidCuaCau('A', 'I', { id: 'A-II-1' })).toBeNull()
    expect(qidCuaCau('A', 'I', { id: '' })).toBeNull()
    expect(qidCuaCau('A-DS', 'II', { id: 'A-II-03' })).toBe('A-II-3')
  })

  it('mục dạy học -VD / -DT máy chủ bỏ hẳn ⇒ app thầy không gửi câu của mục ấy', async () => {
    const kho = [{ phan: 'I', so: 1, dap_an: 'A' }]
    expect(await homeworkQuestions(envKho({ M: kho }), 'M-VD')).toEqual([])
    expect(taoCauGiao([deMayThay('M-VD', kho), deMayThay('M-DT-2', kho)])).toEqual([])
  })

  it('hai tờ cùng tờ gốc / tick trùng ⇒ mỗi qid đúng MỘT lần (máy chủ cũng khử trùng)', async () => {
    const goc = 'K'
    const kho = [{ phan: 'I', so: 1, dap_an: 'A' }, { phan: 'II', so: 2, dap_an: 'DDDD' }]
    const dsTach = tachTheoPhan(deMayThay(goc, kho))
    const may = (await homeworkQuestions(envKho({ [goc]: kho }), ['K-TN', 'K-DS', 'K-TN'].join(','))).map((c) => String(c.qid))
    expect(taoCauGiao([...dsTach, dsTach[0]]).map((c) => c.qid)).toEqual(may)
  })

  it('điều kiện loại câu tự luận + mã đề gốc chép đúng máy chủ', () => {
    expect(mayChuBoCauTuLuan('2,5')).toBe(false)
    expect(mayChuBoCauTuLuan('0,25')).toBe(false)
    expect(mayChuBoCauTuLuan('a b')).toBe(false) // có khoảng trắng nhưng ≤ 20 ký tự
    expect(mayChuBoCauTuLuan('tạo ra este và nước cùng muối')).toBe(true)
    expect(mayChuBoCauTuLuan('CH3COOH; H2O')).toBe(true)
    expect(mayChuBoCauTuLuan('A→B')).toBe(true)
    expect(mayChuBoCauTuLuan('A⇌B')).toBe(true)
    expect(mayChuBoCauTuLuan('x:y')).toBe(true)
    expect(maDeGocMayChu('DH-12-C1-B2-TN')).toBe('DH-12-C1-B2')
    expect(maDeGocMayChu('DH-12-C1-B2-DS')).toBe('DH-12-C1-B2')
    expect(maDeGocMayChu('DH-12-C1-B2-TLN')).toBe('DH-12-C1-B2')
    expect(maDeGocMayChu('DH-12-C1-B2')).toBe('DH-12-C1-B2')
    expect(maDeGocMayChu('A-TN-B')).toBe('A-TN-B') // chỉ bỏ hậu tố CUỐI
  })
})
