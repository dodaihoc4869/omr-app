// @vitest-environment node
// P01 / T34 — SNAPSHOT ĐỀ LÚC GIAO: chấm theo ảnh chụp v1 hoặc THU HỒI có lý do; KHÔNG trộn đề cũ với đáp án mới.
// Test gọi CODE SẢN PHẨM THẬT (server/src/cau-snapshot.ts + hai route thật qua Worker) và chạy SQL trên
// D1 THẬT bằng `node:sqlite` với đúng `server/schema.sql` + mọi `server/migration-*.sql` (tests/_d1-that.ts).
import { describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import {
  chamTheoSnapshot, docSnapshot, docSnapshotNhieu, ghiSnapshot, LY_DO_THU_HOI, quyetDinhSnapshot,
  snapshotBat, snapshotIdCua, taoSnapshot, type CauSnapshot,
} from '../server/src/cau-snapshot'
import { POLICY_VERSION } from '../src/lib/cham-so-policy'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

vi.mock('../server/src/game-v2-auth', async (orig) => ({
  ...(await orig<typeof import('../server/src/game-v2-auth')>()),
  gameIdentity: async (_e: unknown, b: Record<string, unknown>) => {
    if (b.token !== 'token-S1') throw new Error('Phiên đăng nhập không hợp lệ.')
    return 'S1'
  },
}))

const H = 3_600_000
const cauKho = (qid: string, phan: string, correct: string, version = 'v1', group = `g-${qid}`) => ({
  qid, maDe: 'DE1', version, group, phan, text: `Câu ${qid}.`,
  choices: phan === 'I' ? ['A. a', 'B. b', 'C. c', 'D. d'] : [],
  ideas: phan === 'II' ? ['a', 'b', 'c', 'd'] : [],
  hinhAnh: [], dang: 'ES.A.X', tenDang: 'Dạng', mucDo: 'hieu', sao: 1, kienThuc: ['k1'],
  correct, solution: 'LOI-GIAI-BI-MAT-XYZ', reviewed: true,
})
const I1 = 'DE1-I-1'

function themCau(d: D1That, cau: ReturnType<typeof cauKho>[], capNhatLuc = 'v1') {
  d.sql.prepare("INSERT OR IGNORE INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES('DE1','DE1','12',?,?,0,?)").run(cau.length, 'kho/DE1.json', capNhatLuc)
  d.sql.prepare("INSERT OR IGNORE INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE1',?,'x')").run(capNhatLuc)
  for (const c of cau) d.sql.prepare('INSERT OR REPLACE INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run('DE1', c.qid, c.version, c.group, c.dang, JSON.stringify(c))
}

/** Đổi kho: phiên bản câu + đáp án (mô phỏng thầy sửa đề khi em đang làm). */
function doiKho(d: D1That, qid: string, correct: string, version: string, group?: string) {
  const c = cauKho(qid, 'I', correct, version, group)
  d.sql.prepare('UPDATE game_v2_question SET version = ?, content_group = ?, json = ? WHERE ma_de = ? AND qid = ?').run(c.version, c.group, JSON.stringify(c), 'DE1', qid)
  d.sql.prepare("UPDATE de_kho SET cap_nhat_luc = ? WHERE ma_de = 'DE1'").run(version)
  d.sql.prepare("UPDATE game_v2_index SET source_version = ? WHERE ma_de = 'DE1'").run(version)
}

const batCo = (d: D1That, giaTri = 'bat') =>
  d.sql.prepare("INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('cau_snapshot',?,'x')").run(giaTri)

/** Em S1 đã GẶP câu I1 (sai, cách đây 3 ngày) ⇒ câu phục vụ được cho cả hai đường. */
async function dung(dapAnKho = 'B') {
  const d = taoD1That()
  d.sql.prepare("INSERT OR IGNORE INTO hoc_sinh(sbd,ho_ten,cap_nhat_luc) VALUES('S1','x','x')").run()
  themCau(d, [cauKho(I1, 'I', dapAnKho)])
  const luc = new Date(Date.now() - 72 * H).toISOString()
  const g = await ghiSuKien(d.env, [{ nguon: 'btvn' as const, maNguon: 'B', sbd: 'S1', qid: I1, lan: 1, ketQua: 0 as const, luc }])
  expect(g.ok).toBe(true)
  return d
}
const moCau = (d: D1That, qid = I1) => goiWorker(worker, d.env, '/hs/cau-theo-qid', { token: 'token-S1', qid: [qid] })
const nopBai = (d: D1That, dapAn: string, qid = I1) =>
  goiWorker(worker, d.env, '/hs/on-lai/nop', { token: 'token-S1', traLoi: [{ qid, dapAn }] })
const suKienOnLai = (d: D1That, qid = I1) =>
  d.sql.prepare("SELECT ket_qua FROM su_kien_hoc WHERE sbd='S1' AND nguon='on_lai' AND qid=?").all(qid) as { ket_qua: number }[]
const snapshotTrong = (d: D1That) => d.sql.prepare('SELECT * FROM cau_snapshot WHERE sbd=?').all('S1') as Record<string, unknown>[]

describe('T34 — quyết định snapshot: gọi thẳng hàm sản phẩm', () => {
  const cau = { qid: 'Q1', version: 'v1', group: 'g1', phan: 'I', correct: 'B' }
  const snap = taoSnapshot('S1', cau, 1000)

  it('ảnh chụp giữ phiên bản câu, nhóm nội dung, đáp án và version chính sách', () => {
    expect(snap).toEqual({
      snapshotId: snapshotIdCua('Q1', 'v1', 'g1'), sbd: 'S1', qid: 'Q1',
      questionVersion: 'v1', contentGroup: 'g1', phan: 'I', dapAn: 'B',
      gradingPolicy: 'numeric-value-v1', policyVersion: POLICY_VERSION, issuedAt: 1000,
    })
  })
  it('snapshotId tất định theo (qid, phiên bản, nhóm nội dung); đổi phiên bản ⇒ đổi id', () => {
    expect(snapshotIdCua('Q1', 'v1', 'g1')).toBe(snapshotIdCua('Q1', 'v1', 'g1'))
    expect(snapshotIdCua('Q1', 'v1', 'g1')).not.toBe(snapshotIdCua('Q1', 'v2', 'g1'))
    expect(snapshotIdCua('Q1', 'v1', 'g1')).not.toBe(snapshotIdCua('Q2', 'v1', 'g1'))
  })
  it('lúc PHÁT: chưa có ảnh chụp ⇒ tạo mới từ câu vừa giao', () => {
    const qd = quyetDinhSnapshot(null, cau, 'S1', 2000, 'phat')
    expect(qd.kieu).toBe('tao-moi')
    if (qd.kieu === 'tao-moi') expect(qd.snapshot).toEqual(taoSnapshot('S1', cau, 2000))
  })
  it('lúc NỘP: chưa có ảnh chụp ⇒ THU HỒI, KHÔNG tạo mới (không chấm bằng kho sống)', () => {
    const qd = quyetDinhSnapshot(null, cau, 'S1', 2000, 'nop')
    expect(qd).toEqual({ kieu: 'thu-hoi', lyDo: 'thieu-snapshot', noiDung: LY_DO_THU_HOI['thieu-snapshot'] })
  })
  it('kho đổi PHIÊN BẢN câu ⇒ THU HỒI lý do kho-doi-phien-ban', () => {
    expect(quyetDinhSnapshot(snap, { ...cau, version: 'v2' }, 'S1', 3000, 'nop')).toEqual({ kieu: 'thu-hoi', lyDo: 'kho-doi-phien-ban', noiDung: LY_DO_THU_HOI['kho-doi-phien-ban'] })
  })
  it('kho đổi NHÓM NỘI DUNG ⇒ THU HỒI (khác nhóm nghĩa là không còn cùng câu)', () => {
    expect(quyetDinhSnapshot(snap, { ...cau, group: 'g2' }, 'S1', 3000, 'nop').kieu).toBe('thu-hoi')
  })
  it('version CHÍNH SÁCH đổi ⇒ THU HỒI lý do chinh-sach-doi-phien-ban', () => {
    const cu: CauSnapshot = { ...snap, policyVersion: 'CNH-0.9' }
    expect(quyetDinhSnapshot(cu, cau, 'S1', 3000, 'nop')).toEqual({ kieu: 'thu-hoi', lyDo: 'chinh-sach-doi-phien-ban', noiDung: LY_DO_THU_HOI['chinh-sach-doi-phien-ban'] })
  })
  it('câu không còn trong kho ⇒ THU HỒI khong-con-trong-kho', () => {
    expect(quyetDinhSnapshot(snap, null, 'S1', 3000, 'nop').kieu).toBe('thu-hoi')
    expect(quyetDinhSnapshot(null, null, 'S1', 3000, 'phat').kieu).toBe('thu-hoi')
  })
  it('phiên bản + nhóm KHỚP ⇒ dùng chính ảnh chụp cũ (không đọc lại kho)', () => {
    expect(quyetDinhSnapshot(snap, cau, 'S1', 3000, 'nop')).toEqual({ kieu: 'dung-snapshot', snapshot: snap })
  })
  it('chamTheoSnapshot chấm bằng ĐÁP ÁN TRONG ẢNH CHỤP — khác hẳn kết quả nếu chấm bằng kho mới', () => {
    expect(chamTheoSnapshot(snap, 'B')).toBe(true)
    expect(chamTheoSnapshot(snap, 'C')).toBe(false)
    expect(chamTheoSnapshot({ ...snap, phan: 'III', dapAn: '0,54' }, '０，５４０')).toBe(true)
  })
  it('lý do thu hồi KHÔNG lộ đáp án, KHÔNG lộ nguồn đề bảo vệ', () => {
    const chu = Object.values(LY_DO_THU_HOI).join(' ')
    expect(chu).not.toMatch(/\b(B|C|D)\b\s*(đúng|là đáp án)/i)
    expect(chu).not.toMatch(/bảo vệ|protected|đề thi/i)
    expect(Object.keys(LY_DO_THU_HOI)).toHaveLength(4)
  })
  it('snapshotBat: LỖI ĐỌC ⇒ false (giữ đường cũ, không làm hỏng việc nộp)', async () => {
    const hong = { DB: { prepare: () => { throw new Error('no such table: cau_hinh') } } } as never
    expect(await snapshotBat(hong)).toBe(false)
  })
})

describe('T34 — D1 THẬT: bảng cau_snapshot của repo chạy được', () => {
  it('ghi rồi đọc lại đúng ảnh chụp; giao lại câu (phiên bản mới) thì GHI ĐÈ', async () => {
    const d = taoD1That()
    const s1 = taoSnapshot('S1', { qid: 'Q9', version: 'v1', group: 'g9', phan: 'III', correct: '0,54' }, 1000)
    await ghiSnapshot(d.env, s1)
    expect(await docSnapshot(d.env, 'S1', 'Q9')).toEqual(s1)
    expect(await docSnapshot(d.env, 'S2', 'Q9')).toBeNull()
    const s2 = taoSnapshot('S1', { qid: 'Q9', version: 'v2', group: 'g9', phan: 'III', correct: '0,55' }, 2000)
    await ghiSnapshot(d.env, s2)
    expect(await docSnapshot(d.env, 'S1', 'Q9')).toEqual(s2)
    expect(d.sql.prepare('SELECT COUNT(*) n FROM cau_snapshot').get()).toEqual({ n: 1 })
  })
  it('docSnapshotNhieu: MỘT truy vấn lấy nhiều câu, bỏ qua câu chưa có ảnh chụp', async () => {
    const d = taoD1That()
    await ghiSnapshot(d.env, taoSnapshot('S1', { qid: 'Q1', version: 'v1', group: 'g1', phan: 'I', correct: 'B' }, 1))
    await ghiSnapshot(d.env, taoSnapshot('S1', { qid: 'Q3', version: 'v1', group: 'g3', phan: 'I', correct: 'D' }, 1))
    const m = await docSnapshotNhieu(d.env, 'S1', ['Q1', 'Q2', 'Q3'])
    expect([...m.keys()].sort()).toEqual(['Q1', 'Q3'])
    expect(m.get('Q1')?.dapAn).toBe('B')
    expect(await docSnapshotNhieu(d.env, 'S1', [])).toEqual(new Map())
  })
})


describe('T34 — qua Worker THẬT + D1 THẬT: cờ TẮT thì đường cũ nguyên vẹn', () => {
  it('cờ mặc định TẮT: giao câu KHÔNG ghi ảnh chụp; nộp vẫn chấm theo kho sống', async () => {
    const d = await dung('B')
    const mo = await moCau(d)
    expect(mo.ok).toBe(true)
    expect(snapshotTrong(d)).toHaveLength(0)
    // Thầy đổi đáp án trong kho; cờ TẮT ⇒ hành vi CŨ: chấm bằng kho sống.
    doiKho(d, I1, 'C', 'v2')
    const kq = await nopBai(d, 'C')
    expect(kq.ok).toBe(true)
    expect(kq.ketQua[0].dung).toBe(true)
    expect(suKienOnLai(d)[0].ket_qua).toBe(1)
  })
})

describe('T34 — qua Worker THẬT + D1 THẬT: cờ BẬT thì chấm theo ảnh chụp / thu hồi có lý do', () => {
  it('giao câu ghi ảnh chụp v1 (đáp án phía máy chủ); đáp án công khai KHÔNG lộ', async () => {
    const d = await dung('B')
    batCo(d)
    const mo = await moCau(d)
    expect(mo.ok).toBe(true)
    const chu = JSON.stringify(mo)
    expect(chu).not.toContain('"correct"')
    expect(chu).not.toContain('LOI-GIAI-BI-MAT-XYZ')
    const rows = snapshotTrong(d)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ qid: I1, question_version: 'v1', dap_an: 'B', policy_version: POLICY_VERSION, grading_policy: 'numeric-value-v1' })
  })

  it('kho ĐỔI ĐÁP ÁN nhưng giữ phiên bản ⇒ nộp vẫn chấm theo ảnh chụp v1 (không trộn)', async () => {
    const d = await dung('B')
    batCo(d)
    expect((await moCau(d)).ok).toBe(true)
    doiKho(d, I1, 'C', 'v1') // đảo đáp án mà KHÔNG tăng phiên bản câu
    const kq = await nopBai(d, 'B')
    expect(kq.ok).toBe(true)
    expect(kq.ketQua).toHaveLength(1)
    expect(kq.ketQua[0].dung).toBe(true)          // theo ảnh chụp v1, em trả lời 'B' ⇒ ĐÚNG
    expect(kq.ketQua[0].dapAnDung).toBe('B')      // KHÔNG trả đáp án mới 'C'
    expect(suKienOnLai(d)[0].ket_qua).toBe(1)
    expect(kq.thuHoi).toBeUndefined()
  })

  it('kho TĂNG PHIÊN BẢN sau khi giao ⇒ THU HỒI có lý do: không ghi sổ, không EXP, không lộ đáp án/lời giải', async () => {
    const d = await dung('B')
    batCo(d)
    expect((await moCau(d)).ok).toBe(true)
    doiKho(d, I1, 'C', 'v2')
    const kq = await nopBai(d, 'C')
    expect(kq.ok).toBe(true)                       // không phải lỗi hệ thống, chỉ là thu hồi
    expect(kq.ketQua).toEqual([])
    expect(kq.thuHoi).toEqual([{ qid: I1, lyDo: 'kho-doi-phien-ban' }])
    expect(suKienOnLai(d)).toHaveLength(0)         // KHÔNG ghi sổ
    expect(kq.exp).toBe(0)
    const chu = JSON.stringify(kq)
    expect(chu).not.toContain('LOI-GIAI-BI-MAT-XYZ')
    expect(chu).not.toContain('dapAnDung')
  })

  it('câu đã trả lời mà CHƯA từng mở (thiếu ảnh chụp) ⇒ THU HỒI thieu-snapshot, không chấm', async () => {
    const d = await dung('B')
    batCo(d)
    const kq = await nopBai(d, 'B')                // chưa gọi /hs/cau-theo-qid
    expect(kq.ok).toBe(true)
    expect(kq.ketQua).toEqual([])
    expect(kq.thuHoi).toEqual([{ qid: I1, lyDo: 'thieu-snapshot' }])
    expect(suKienOnLai(d)).toHaveLength(0)
  })

  it('mở lại câu sau khi kho đổi ⇒ ảnh chụp được làm mới theo phiên bản mới, nộp theo bản mới', async () => {
    const d = await dung('B')
    batCo(d)
    expect((await moCau(d)).ok).toBe(true)
    doiKho(d, I1, 'C', 'v2')
    expect((await moCau(d)).ok).toBe(true)         // em mở lại ⇒ ảnh chụp mới
    expect(snapshotTrong(d)).toHaveLength(1)
    expect(snapshotTrong(d)[0]).toMatchObject({ question_version: 'v2', dap_an: 'C' })
    const kq = await nopBai(d, 'C')
    expect(kq.ok).toBe(true)
    expect(kq.ketQua[0].dung).toBe(true)
  })

  it('cờ TẮT lại giữa chừng ⇒ quay về đường cũ ngay (không phụ thuộc ảnh chụp đã ghi)', async () => {
    const d = await dung('B')
    batCo(d)
    expect((await moCau(d)).ok).toBe(true)
    batCo(d, 'tat')
    const kq = await nopBai(d, 'B')
    expect(kq.ok).toBe(true)
    expect(kq.ketQua[0].dung).toBe(true)
    expect(kq.thuHoi).toBeUndefined()
  })
})

