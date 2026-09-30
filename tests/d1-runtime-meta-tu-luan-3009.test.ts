// RUNTIME D1 (workerd) cho `docMetaCau` — phản biện vòng 2 PR #110 (30/09): cờ tự luận của KẾ HOẠCH (SQL rút gọn `SQL_CAU_GON` + `tuLuanTuMeta`)
// phải TRÙNG phép `laCauTuLuan` trên câu đầy đủ mà Đảo/Đoàn dùng khi phát câu. Lệch ⇒ kế hoạch đếm câu Đảo bỏ ⇒ rương kẹt (lỗi 48/49).
// Câu SQL chạy ĐÚNG trên D1 thật của workerd (node:sqlite ở tests/_d1-that.ts không chứng minh được).
// Dữ liệu TỔNG HỢP, không dữ liệu thật.
import { beforeAll, describe, expect, it } from 'vitest'
import { DB, ENV } from './_cnh-exp-fixture'
import { docMetaCau } from '../server/src/srs2-d1'
import { laCauTuLuan } from '../server/src/cam-tu-luan'

const MA_DE = 'DE-META-3009' // không chứa -TL/-VD/-DT (mã đề tự luận)
const cau = (qid: string, them: Record<string, unknown>) => ({ qid, maDe: MA_DE, version: 'v1', group: `g-${qid}`, phan: 'I', text: `Câu ${qid}`, choices: ['a', 'b', 'c', 'd'], ideas: [], hinhAnh: [], correct: 'B', reviewed: true, solution: null, ...them })
const II = (qid: string, them: Record<string, unknown>) => cau(qid, { phan: 'II', choices: [], ideas: ['a', 'b', 'c', 'd'], correct: 'DSDS', ...them })
const DS: Record<string, Record<string, unknown>> = {
  M1: cau('M1', {}),
  M2: cau('M2', { choices: ['a', 'b', 'c', ''] }),
  M3: cau('M3', { choices: ['a', 'b', 'c', ''], choiceImgs: ['', '', '', 'data:x'] }),
  M4: cau('M4', { choices: ['a', 'b', 'c', ''], hinhAnh: [{ viTri: 'sau_pa_D', src: 'data:y' }] }),
  // choiceImgs KHÔNG phải mảng: JS bỏ qua (Array.isArray sai) — trước đây json_each trên giá trị đơn ra 1 dòng ⇒ kế hoạch xem phương án A có ảnh.
  M5: cau('M5', { choices: ['', 'b', 'c', 'd'], choiceImgs: 'data:z' }),
  M6: cau('M6', { choices: ['a', 'b', 'c', ''], choiceImgs: ['', '', '', []] }),
  M7: cau('M7', { choices: ['a', 'b', 'c', ''], choiceImgs: ['', '', '', ['', '']] }),
  M8: cau('M8', { choices: ['a', 'b', 'c', ''], choiceImgs: ['', '', '', ['', 'data:w']] }),
  M9: cau('M9', { choices: ['a', 'b', 'c', ''], choiceImgs: ['', '', '', {}] }),
  // `hinh` (kho thô) được ưu tiên trước `hinhAnh` như `lay(c, 'hinh', 'hinhAnh')`.
  M10: cau('M10', { choices: ['a', 'b', 'c', ''], hinh: [{ viTri: 'sau_pa_D', src: 'data:y' }] }),
  M11: cau('M11', { choices: ['a', 'b', 'c', ''], hinh: [], hinhAnh: [{ viTri: 'sau_pa_D', src: 'data:y' }] }),
  // `src ?? url ?? data`: src rỗng (không null) ⇒ JS dừng ở src ⇒ không có hình.
  M12: cau('M12', { choices: ['a', 'b', 'c', ''], hinhAnh: [{ viTri: 'sau_pa_D', src: '', url: 'data:u' }] }),
  M13: cau('M13', { choices: ['a', 'b', 'c', ''], hinhAnh: [{ viTri: 'sau_pa_D', src: null, url: 'data:u' }] }),
  M14: cau('M14', { choices: ['a', 'b', 'c', ''], anhLuaChon: ['', '', '', 'data:x'] }),
  M15: cau('M15', { choices: ['a', 'b', 'c', ''], choiceImgs: null, anhLuaChon: ['', '', '', 'data:x'] }),
  M16: cau('M16', { choices: ['a', 'b', 'c', ''], choiceImgs: ['', '', '', 0] }),
  M17: II('M17', {}),
  M18: II('M18', { ideas: ['a', 'b', 'c', ''], ideaImgs: ['', '', '', 'data:y'] }),
  M19: II('M19', { ideas: ['a', 'b', 'c', ''], ideaImgs: 'data:y' }),
  M20: II('M20', { ideas: ['a', 'b', 'c', ''], hinhAnh: [{ vi_tri: 'sau_y_d', data: 'data:y' }] }),
}

beforeAll(async () => {
  await DB.prepare('CREATE TABLE IF NOT EXISTS game_v2_question (ma_de TEXT NOT NULL, qid TEXT NOT NULL, version TEXT NOT NULL, content_group TEXT NOT NULL, dang TEXT, json TEXT NOT NULL, PRIMARY KEY(ma_de,qid))').run()
  for (const [q, c] of Object.entries(DS)) await DB.prepare('INSERT OR REPLACE INTO game_v2_question VALUES (?,?,?,?,?,?)').bind(MA_DE, q, 'v1', `g-${q}`, 'D1', JSON.stringify(c)).run()
})

describe('docMetaCau trên workerd D1 (phản biện vòng 2 #110)', () => {
  it('meta.tuLuan TRÙNG laCauTuLuan(câu đầy đủ) ở mọi ca ảnh phương án/ý/hình', async () => {
    const m = await docMetaCau(ENV, Object.keys(DS))
    const lech = Object.keys(DS).filter((q) => m.get(q)?.tuLuan !== laCauTuLuan(DS[q]!))
    expect(lech).toEqual([])
    // khoá: có cả hai phía (không phải mọi câu cùng một kết quả)
    expect(m.get('M1')?.tuLuan).toBe(false)
    expect(m.get('M5')?.tuLuan).toBe(true)
    expect(m.get('M10')?.tuLuan).toBe(false)
  })
})
