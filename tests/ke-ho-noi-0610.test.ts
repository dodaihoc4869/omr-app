// @vitest-environment node
// 06/10 — nối nốt: (a) ca "Không rút câu sai": câu ca trước (cấm cứng) chỉ bị lấy lại SAU cùng, sau cả câu cấm mềm;
// (b) `/ca/loi-den-han` trả bảng nhóm nội dung cho máy thầy.
import { describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import type { Env } from '../server/src/kieu'
import { loiDenHan } from '../server/src/rut-de-v2'
import { rutDeV2, type CauKhoV2 } from '../src/lib/rut-de-v2'

const kho: CauKhoV2[] = ['Q1', 'Q2', 'Q3', 'Q4'].map((id) => ({ id, phan: 'I', mucDo: 'hieu', dang: 'D0', lyThuyet: false }))

describe('rút đề: camCung', () => {
  it('hết câu mới ⇒ lấy câu cấm mềm (làm ở kênh khác) trước, câu ca trước để cuối', () => {
    // Q1, Q2 em gặp ở ca trước (cũ nhất); Q3, Q4 làm ở kênh khác — Q3 lâu hơn Q4 nhưng cả bốn đều đã gặp.
    const daGap = { Q1: '2026-08-01', Q2: '2026-08-02', Q3: '2026-09-20', Q4: '2026-09-25' }
    const kq = rutDeV2({ kho, soCau: { I: 2, II: 0, III: 0 }, dsSbd: ['S1'], ngay: '2026-10-06', cheDo: 'ca', seed: 'CA1',
      hoSo: { S1: { loi: [], daGap, camCung: ['Q1', 'Q2'] } } })
    expect(kq.theoEm.S1!.map((x) => x.qid).sort()).toEqual(['Q3', 'Q4'])
  })
  it('không có camCung ⇒ như cũ: lấy câu gặp lâu nhất', () => {
    const daGap = { Q1: '2026-08-01', Q2: '2026-08-02', Q3: '2026-09-20', Q4: '2026-09-25' }
    const kq = rutDeV2({ kho, soCau: { I: 2, II: 0, III: 0 }, dsSbd: ['S1'], ngay: '2026-10-06', cheDo: 'ca', seed: 'CA1',
      hoSo: { S1: { loi: [], daGap } } })
    expect(kq.theoEm.S1!.map((x) => x.qid).sort()).toEqual(['Q1', 'Q2'])
  })
})

describe('/ca/loi-den-han trả nhomTrung', () => {
  it('có bó qid ⇒ trả nhóm của các câu có nhóm', async () => {
    const d = taoD1That()
    const env = d.env as unknown as Env
    d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S1','An','12A1','x')")
    const st = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
    for (const q of ['A1', 'A2']) st.run('DE1', q, 'v1', 'gA', 'D1', JSON.stringify({ qid: q, maDe: 'DE1', group: 'gA', phan: 'I', text: q, choices: ['a', 'b', 'c', 'd'], correct: 'B' }))
    const r = (await loiDenHan(env, { sbd: ['S1'], ngay: '2026-10-06', qids: ['A1', 'A2'] })) as { nhomTrung?: Record<string, string> }
    expect(r.nhomTrung?.A1).toBeTruthy()
    expect(r.nhomTrung?.A1).toBe(r.nhomTrung?.A2)
  })
})
