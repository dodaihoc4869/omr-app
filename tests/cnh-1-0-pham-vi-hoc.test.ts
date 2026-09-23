// @vitest-environment node
// P02 — PHẠM VI HỌC CÁ NHÂN: T01 (phạm vi từng em), T02 (đủ MỌI nền), T03 (kho thiếu nhãn/thu hồi), T11 (bảo vệ bản sao).
// Test gọi CODE SẢN PHẨM THẬT: server/src/pham-vi-hoc.ts + bảng `learner_scope` trên D1 THẬT (node:sqlite,
// đúng `server/schema.sql` + mọi `server/migration-*.sql`), và đối chiếu với vị từ bảo vệ THẬT của
// server/src/cau-theo-qid.ts (`khongBiBaoVe`) để hai chỗ không lệch nhau.
import { describe, expect, it } from 'vitest'
import {
  docMotScope, docPhamVi, docPhamViNhieu, eligibleScope, ghiEncountered, ghiTaught, locTheoPhamVi,
  phamViBat, revisionPhamVi, thuHoiPhamVi, tomTatLyDo, xoaDemPhamVi,
  type CauXetDuyet, type NgoaiLeGiaoBai, type TrangThaiScope,
} from '../server/src/pham-vi-hoc'
import { khongBiBaoVe } from '../server/src/cau-theo-qid'
import { taoD1That } from './_d1-that'

const q = (qid: string, skillIds: string[], prerequisiteIds: string[] = [], o: Partial<CauXetDuyet> = {}): CauXetDuyet => ({
  qid, version: 'v1', contentGroup: `cg-${qid}`, skillIds, prerequisiteIds, qualityStatus: 'approved', ...o,
})
const pv = (cap: [string, TrangThaiScope][]) => new Map(cap)
const MOC = '2026-09-23T05:00:00.000Z'

describe('T01 — phạm vi TỪNG EM: cùng lớp, khác phạm vi', () => {
  it('A taught S1,S2 nhận được Q cần S2; B chỉ taught S1 KHÔNG nhận, lý do NEED_TAUGHT_SCOPE', () => {
    const Q = q('Q', ['S2'])
    const A = pv([['S1', 'taught'], ['S2', 'taught']])
    const B = pv([['S1', 'taught']])
    expect(eligibleScope(Q, A)).toEqual({ duoc: true })
    expect(eligibleScope(Q, B)).toEqual({ duoc: false, lyDo: 'NEED_TAUGHT_SCOPE', thieu: ['S2'] })
  })
  it('`encountered` và `revoked` KHÔNG phải taught — gặp một câu không mở kỹ năng', () => {
    const Q = q('Q', ['S2'])
    expect(eligibleScope(Q, pv([['S2', 'encountered']])).lyDo).toBe('NEED_TAUGHT_SCOPE')
    expect(eligibleScope(Q, pv([['S2', 'revoked']])).lyDo).toBe('NEED_TAUGHT_SCOPE')
    expect(eligibleScope(Q, pv([])).lyDo).toBe('NEED_TAUGHT_SCOPE')
  })
  it('khoá mọi kỹ năng của câu nhiều nhãn (không chỉ nhãn đầu)', () => {
    expect(eligibleScope(q('Q', ['S1', 'S2']), pv([['S1', 'taught']])).lyDo).toBe('NEED_TAUGHT_SCOPE')
    expect(eligibleScope(q('Q', ['S1', 'S2']), pv([['S1', 'taught'], ['S2', 'taught']])).duoc).toBe(true)
  })
})

describe('T02 — ĐỦ MỌI NỀN: nền dùng AND, không dùng OR', () => {
  it('Q cần nền P1,P2 mà chỉ taught P1 ⇒ BỊ LOẠI (không nhận qua P1)', () => {
    const Q = q('Q', ['S1'], ['P1', 'P2'])
    const r = eligibleScope(Q, pv([['S1', 'taught'], ['P1', 'taught']]))
    expect(r).toEqual({ duoc: false, lyDo: 'NEED_TAUGHT_SCOPE', thieu: ['P2'] })
    expect(eligibleScope(Q, pv([['S1', 'taught'], ['P1', 'taught'], ['P2', 'taught']])).duoc).toBe(true)
  })
  it('thiếu nền trả đúng mã NEED_TAUGHT_SCOPE (không mã riêng cho nền)', () => {
    expect(eligibleScope(q('Q', ['S1'], ['P2']), pv([['S1', 'taught']])).lyDo).toBe('NEED_TAUGHT_SCOPE')
  })
  it('ngoại lệ giáo viên KHÔNG mở game: chỉ đúng bài `btvn_thay_giao` + đúng qid', () => {
    const Q = q('Q', ['S1'], ['P2'])
    const trong = new Map<string, TrangThaiScope>()
    const ngoaiLe: NgoaiLeGiaoBai = { kenh: 'btvn_thay_giao', assignmentId: 'BT-1', teacherId: 'GV-1', lyDo: 'giao bù', qids: new Set(['Q']) }
    expect(eligibleScope(Q, trong, null, ngoaiLe).duoc).toBe(true)
    // qid KHÁC trong cùng bài ⇒ vẫn phải qua phạm vi
    const ngoaiLeKhac: NgoaiLeGiaoBai = { ...ngoaiLe, qids: new Set(['Q-OTHER']) }
    expect(eligibleScope(Q, trong, null, ngoaiLeKhac).lyDo).toBe('NEED_TAUGHT_SCOPE')
    // thiếu teacher_id / assignment_id ⇒ ngoại lệ KHÔNG có hiệu lực
    expect(eligibleScope(Q, trong, null, { ...ngoaiLe, teacherId: '' }).lyDo).toBe('NEED_TAUGHT_SCOPE')
    expect(eligibleScope(Q, trong, null, { ...ngoaiLe, assignmentId: '' }).lyDo).toBe('NEED_TAUGHT_SCOPE')
  })
})

describe('T03 — KHO THIẾU NHÃN / CHƯA DUYỆT / BỊ THU HỒI: 0 câu, đúng mã lý do', () => {
  const taught = pv([['S1', 'taught']])
  it('Q1 thiếu nhãn kỹ năng ⇒ THIEU_NHAN', () => {
    expect(eligibleScope({ ...q('Q1', []), skillIds: [] }, taught)).toEqual({ duoc: false, lyDo: 'THIEU_NHAN' })
  })
  it('Q2 chưa duyệt ⇒ CHUA_DUYET (kể cả khi mọi kỹ năng đã taught)', () => {
    expect(eligibleScope(q('Q2', ['S1'], [], { qualityStatus: 'pending' }), taught)).toEqual({ duoc: false, lyDo: 'CHUA_DUYET' })
  })
  it('Q3 bị thu hồi kỹ năng ⇒ NEED_TAUGHT_SCOPE; và cả ba câu xấu ⇒ 0 câu, KHÔNG phát câu xấu cho đủ lượt', () => {
    const ds = [q('Q1', []), q('Q2', ['S1'], [], { qualityStatus: 'pending' }), q('Q3', ['S1'])]
    const phamVi = pv([['S1', 'revoked']])
    const r = locTheoPhamVi(ds, phamVi)
    expect(r.duoc).toEqual([])
    expect(tomTatLyDo(r.loai)).toEqual({ NEED_TAUGHT_SCOPE: 1, THIEU_NHAN: 1, CHUA_DUYET: 1, DE_BAO_VE: 0 })
    // Thứ tự kiểm CỐ ĐỊNH theo công thức đặc tả: `approved` trước, rồi nhãn, rồi taught — nên Q2 (chưa duyệt)
    // bị xếp CHUA_DUYET chứ không phải NEED_TAUGHT_SCOPE, dù cả hai đều đúng với nó.
    expect(r.loai).toEqual([
      { qid: 'Q1', lyDo: 'THIEU_NHAN' },
      { qid: 'Q2', lyDo: 'CHUA_DUYET' },
      { qid: 'Q3', lyDo: 'NEED_TAUGHT_SCOPE' },
    ])
  })
  it('KHÔNG fallback sang kho khác: hàm thuần chỉ trả về tập đã lọc, không tự thêm câu nào', () => {
    const r = locTheoPhamVi([q('X', ['S1'])], new Map())
    expect(r.duoc).toHaveLength(0)
    expect(r.loai).toEqual([{ qid: 'X', lyDo: 'NEED_TAUGHT_SCOPE' }])
  })
})


describe('P02 — bảng learner_scope trên D1 THẬT (node:sqlite + schema + migration của repo)', () => {
  it('T01 trên D1 thật: hai em CÙNG LỚP khác phạm vi; docPhamViNhieu một truy vấn', async () => {
    const d = taoD1That()
    await ghiTaught(d.env, 'A', 'S1', 'thay', 'ev-1', MOC)
    await ghiTaught(d.env, 'A', 'S2', 'thay', 'ev-2', MOC)
    await ghiTaught(d.env, 'B', 'S1', 'thay_hoc_bu', 'ev-3', MOC)
    const m = await docPhamViNhieu(d.env, ['A', 'B', 'C'])
    expect(m.get('A')?.get('S2')).toBe('taught')
    expect(m.get('B')?.get('S2')).toBeUndefined()
    expect(m.get('C')?.size).toBe(0)
    expect([...(await docPhamVi(d.env, 'A')).keys()].sort()).toEqual(['S1', 'S2'])
  })
  it('IMPORT chỉ đánh dấu `encountered`, KHÔNG BAO GIỜ ghi `taught`, không hạ bậc dòng đã taught/revoked', async () => {
    const d = taoD1That()
    expect(await ghiEncountered(d.env, 'S1', ['SK-A', 'SK-B'], MOC, 'import-1')).toBe(2)
    expect((await docMotScope(d.env, 'S1', 'SK-A'))?.state).toBe('encountered')
    await ghiTaught(d.env, 'S1', 'SK-A', 'thay', 'ev-9', MOC)
    await ghiEncountered(d.env, 'S1', ['SK-A'], MOC, 'import-2')
    expect((await docMotScope(d.env, 'S1', 'SK-A'))?.state).toBe('taught')          // KHÔNG bị hạ về encountered
    await thuHoiPhamVi(d.env, 'S1', 'SK-B', 'thu hồi theo yêu cầu', MOC)
    await ghiEncountered(d.env, 'S1', ['SK-B'], MOC, 'import-3')
    expect((await docMotScope(d.env, 'S1', 'SK-B'))?.state).toBe('revoked')         // KHÔNG bị hạ về encountered
    expect(await ghiEncountered(d.env, 'S1', [], MOC)).toBe(0)
  })
  it('xác nhận taught TỪ CHỐI nguồn import và thiếu tham chiếu bằng chứng', async () => {
    const d = taoD1That()
    await expect(ghiTaught(d.env, 'S1', 'SK', 'import', 'ev-1', MOC)).rejects.toThrow(/import/)
    await expect(ghiTaught(d.env, 'S1', 'SK', 'thay', '', MOC)).rejects.toThrow(/bằng chứng/)
    await expect(ghiTaught(d.env, 'S1', 'SK', 'nguon-la', 'ev-1', MOC)).rejects.toThrow(/không được phép/)
    expect(await docMotScope(d.env, 'S1', 'SK')).toBeNull()
  })
  it('T12 (hook): thu hồi quyền làm revision TĂNG ⇒ nơi phát phát hiện cache cũ', async () => {
    const d = taoD1That()
    expect(await revisionPhamVi(d.env, 'S1')).toBe(0)
    await ghiTaught(d.env, 'S1', 'SK', 'thay', 'ev-1', MOC)
    const r1 = await revisionPhamVi(d.env, 'S1')
    expect(r1).toBe(1)
    await thuHoiPhamVi(d.env, 'S1', 'SK', 'thu hồi', MOC)
    expect(await revisionPhamVi(d.env, 'S1')).toBeGreaterThan(r1)
    const ct = await docMotScope(d.env, 'S1', 'SK')
    expect(ct?.state).toBe('revoked')
    expect(ct?.evidenceRef).toBe('thu hồi')
    // Sau khi thu hồi, câu cần kỹ năng đó KHÔNG còn được phát.
    expect(eligibleScope(q('Q', ['SK']), await docPhamVi(d.env, 'S1')).lyDo).toBe('NEED_TAUGHT_SCOPE')
  })
  it('cờ `pham_vi_hoc`: MẶC ĐỊNH TẮT; bật mới lọc; đọc lại trong 30 giây dùng đệm isolate', async () => {
    const d = taoD1That()
    xoaDemPhamVi()
    expect(await phamViBat(d.env)).toBe(false)                       // chưa có dòng cờ ⇒ TẮT
    d.sql.prepare("INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('pham_vi_hoc','bat','x')").run()
    expect(await phamViBat(d.env)).toBe(false)                       // đệm 30 giây giữ giá trị cũ (đúng thiết kế)
    xoaDemPhamVi()
    expect(await phamViBat(d.env)).toBe(true)
    d.sql.prepare("UPDATE cau_hinh SET gia_tri='tat' WHERE khoa='pham_vi_hoc'").run()
    xoaDemPhamVi()
    expect(await phamViBat(d.env)).toBe(false)
  })
})

describe('T11 — BẢO VỆ BẢN SAO: câu cùng content_group không được phát; quyền đúng assignment vẫn chạy', () => {
  const taughtt = pv([['S1', 'taught']])

  it('BTVN chưa nộp giữ Q1 ⇒ Q2 CÙNG content_group bị loại DE_BAO_VE ở kênh tự động', () => {
    const Q1 = q('Q1', ['S1'])
    const Q2 = { ...q('Q2', ['S1']), contentGroup: Q1.contentGroup }
    const baoVe = new Set([Q1.qid, Q1.contentGroup])
    const r = locTheoPhamVi([Q1, Q2], taughtt, baoVe)
    expect(r.duoc).toEqual([])
    expect(r.loai.map((x) => x.lyDo)).toEqual(['DE_BAO_VE', 'DE_BAO_VE'])
  })

  it('quyết định bảo vệ KHỚP vị từ thật của đường phát câu (`khongBiBaoVe`) — hai chỗ không lệch', () => {
    const baoVe = new Set(['CG-BI-BAO-VE'])
    const ds = [q('Q1', ['S1']), { ...q('Q2', ['S1']), contentGroup: 'CG-BI-BAO-VE' }, q('Q3', ['S1'])]
    const { loai } = locTheoPhamVi(ds, taughtt, baoVe)
    for (const c of ds) {
      const biChanBoiSanPham = !khongBiBaoVe({ qid: c.qid, group: c.contentGroup }, baoVe)
      const biChanBoiPhamVi = loai.some((x) => x.qid === c.qid && x.lyDo === 'DE_BAO_VE')
      expect(biChanBoiPhamVi, c.qid).toBe(biChanBoiSanPham)
    }
  })

  it('quyền giáo viên ĐÚNG assignment: câu trong bài được giao VẪN phát, nhưng KHÔNG lộ lời giải', () => {
    const Q1 = q('Q1', ['S1'])
    const baoVe = new Set([Q1.qid, Q1.contentGroup])
    const ngoaiLe: NgoaiLeGiaoBai = { kenh: 'btvn_thay_giao', assignmentId: 'BT-9', teacherId: 'GV-2', lyDo: 'bài đã giao', qids: new Set(['Q1']) }
    expect(eligibleScope(Q1, taughtt, baoVe, ngoaiLe)).toEqual({ duoc: true, khongLoLoiGiai: true })
    // Không có ngoại lệ (tức kênh game / bộ chọn tự động) ⇒ bị loại.
    expect(eligibleScope(Q1, taughtt, baoVe, null)).toEqual({ duoc: false, lyDo: 'DE_BAO_VE' })
    // và `locTheoPhamVi` ghi lại qid không được lộ lời giải cho nơi gọi.
    const r = locTheoPhamVi([Q1], taughtt, baoVe, ngoaiLe)
    expect([...r.khongLoLoiGiai]).toEqual(['Q1'])
  })
})
