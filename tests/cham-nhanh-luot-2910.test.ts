// @vitest-environment node
// CHẤM NHANH CÂU SAI CỦA EM OMNI (thầy 29/10, video «Bấm kiểm tra vẫn chưa tức thì»): trước đây MỌI câu sai của em đang được xét OMNI (phiên Hoá 2.0) đi đường D1 chậm
// vì «lướt» (sai ∧ quá nhanh ∧ < 3 lượt/ngày) cần số đọc D1. Ngưỡng lướt nằm trong [3 s, 8 s] ⇒ câu sai làm TỪ 8 giây trở lên (hoặc không đo được) không thể là lướt ⇒ chấm nhanh.
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { chamNhanh, nhoBaoVe, nhoCau, nhoEm, nhoPhien, xoaChamNhanh } from '../server/src/cham-nhanh'
import { THAM_SO_OMNI } from '../server/src/omni-kieu'

const NOW = Date.parse('2026-10-29T03:00:00Z')
const REF = { qid: 'Q1', maDe: 'DH-B8', version: 'v1' }
const Q = { qid: 'Q1', maDe: 'DH-B8', version: 'v1', group: 'g1', phan: 'I', text: 'Câu', choices: ['a', 'b', 'c', 'd'], correct: 'A', solution: 'Lời giải', hinhAnh: [], ideas: [], mucDo: 'hieu', dang: 'd1', reviewed: true }
function dung(o: { omni: boolean; hoa2?: 1 | 0 }) {
  xoaChamNhanh()
  nhoPhien('P1', 'S1', { created: NOW - 60_000, questions: [REF], hocTap: 1, ...(o.hoa2 === 0 ? {} : { hoa2: 1 }) }, NOW)
  nhoCau(REF, Q as never, NOW)
  nhoEm('S1', { enabled: true, blocked: [], types: [] }, o.omni, NOW)
  nhoBaoVe(new Set(), NOW)
}
const cham = (answer: string, msLam?: unknown) => chamNhanh('S1', { session: 'P1', qid: 'Q1', answer, ...(msLam === undefined ? {} : { msLam }) }, NOW)
beforeEach(() => dung({ omni: true }))
afterEach(() => xoaChamNhanh())

describe('câu SAI của em OMNI (hoa2) — chấm nhanh khi không thể là «lướt»', () => {
  it('ngưỡng lướt luôn ≤ LUOT_MS_MAX (cơ sở của luật)', () => {
    expect(THAM_SO_OMNI.LUOT_MS_MAX).toBe(8000)
  })
  it('sai, làm từ 8 giây trở lên ⇒ có dòng 1 (sai, kèm đáp án đúng + lời giải)', () => {
    for (const ms of [8000, 8001, 30_000, '45000', 900_000, 5_000_000]) {
      const r = cham('B', ms)
      expect(r, `msLam=${String(ms)}`).toMatchObject({ ok: true, tam: true, correct: false, answer: 'A', traLoi: 'B' })
    }
  })
  it('sai, không đo được thời lượng (vắng / âm / chữ lạ) ⇒ không thể lướt ⇒ có dòng 1', () => {
    for (const ms of [undefined, -1, 'abc', null, NaN]) expect(cham('B', ms), `msLam=${String(ms)}`).toMatchObject({ tam: true, correct: false })
  })
  it('sai, làm dưới 8 giây ⇒ có thể là lướt ⇒ KHÔNG chấm nhanh (đường D1 quyết)', () => {
    for (const ms of [0, 1000, 2999, 3000, 7999, 7999.4, '5000']) expect(cham('B', ms), `msLam=${String(ms)}`).toBeNull()
  })
  it('đúng ⇒ luôn chấm nhanh, kể cả làm rất nhanh (lướt chỉ áp cho câu sai)', () => {
    for (const ms of [0, 1000, 30_000, undefined]) expect(cham('A', ms), `msLam=${String(ms)}`).toMatchObject({ tam: true, correct: true })
  })
  it('em không bị xét OMNI, hoặc phiên không phải Hoá 2.0 ⇒ câu sai chấm nhanh dù làm rất nhanh (như cũ)', () => {
    dung({ omni: false })
    expect(cham('B', 500)).toMatchObject({ tam: true, correct: false })
    dung({ omni: true, hoa2: 0 })
    expect(cham('B', 500)).toMatchObject({ tam: true, correct: false })
  })
})
