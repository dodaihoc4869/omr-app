// @vitest-environment node
// 20/10 ĐO GIÂY — đường game (`/game-v2/answer`): máy em gửi `doGiay` (giây + kích thước đề) và/hoặc `msLam`; sổ `su_kien_hoc` phải ghi
// `giay` + `raw.doc` KỂ CẢ KHI OMNI TẮT (trước đây số bị bỏ ⇒ giây NULL). Chạy trên D1 thật (`node:sqlite`) và Worker thật.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { gameToken } from '../server/src/game-v2-auth'
import { xoaBietCotChuan } from '../server/src/su-kien-hoc'
import { xoaBietCotChuanNL, xoaDemNangLuc } from '../server/src/nang-luc-d1'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

const T0 = Date.parse('2026-10-20T12:00:00+07:00')
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0); xoaBietCotChuan(); xoaBietCotChuanNL(); xoaDemNangLuc() })
afterEach(() => vi.useRealTimers())

function dungPhien(): D1That {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES('DE1','DE1','12',3,'kho/DE1.json',0,'v1')").run()
  d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE1','v1','x')").run()
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','ten','12','mk','x')").run()
  for (let i = 0; i < 3; i++) {
    const q = { qid: `Q${i}`, maDe: 'DE1', version: 'v1', group: `cg-Q${i}`, phan: 'I', text: `Đề Q${i}`, choices: ['A. a', 'B. b', 'C. c', 'D. d'], ideas: [], hinhAnh: [], dang: 'D1', tenDang: 'Dạng 1', mucDo: 'hieu', sao: 1, kienThuc: ['SK1'], correct: 'B', solution: 'LG', reviewed: true }
    d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run('DE1', q.qid, 'v1', q.group, q.dang, JSON.stringify(q))
  }
  d.sql.prepare("INSERT INTO game_v2_profile(sbd,json,created_at) VALUES('S1',?,'x')").run(JSON.stringify({
    pet: 'lua_phuong', choice: false, legacy: null, cap: 5, exp: 0, wallet: 0, earned: 0, tower: 1, mastery: [], arena: null, cutover: '2020-01-01T00:00:00.000Z',
  }))
  d.sql.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').run('S1-G', 'S1', JSON.stringify({
    mode: 'adventure', created: T0, questions: [0, 1, 2].map((i) => ({ qid: `Q${i}`, maDe: 'DE1', version: 'v1', group: `cg-Q${i}`, novel: true })),
  }), new Date(T0).toISOString())
  return d
}
const tra = async (d: D1That, qid: string, them: Record<string, unknown>) =>
  goiWorker(worker, d.env, '/game-v2/answer', { token: await gameToken(d.env, 'S1'), session: 'S1-G', qid, answer: 'B', ...them }) as Promise<Record<string, unknown>>
const dong = (d: D1That, qid: string) => d.sql.prepare("SELECT giay, raw_json FROM su_kien_hoc WHERE sbd='S1' AND nguon='game' AND qid=?").get(qid) as { giay: number | null; raw_json: string | null } | undefined

describe('game: giây + kích thước đề vào sổ (OMNI tắt)', () => {
  it('`doGiay` ⇒ cột giay + raw.doc do MÁY CHỦ đo từ câu (bỏ qua số từ máy em tự khai)', async () => {
    const d = dungPhien()
    expect((await tra(d, 'Q0', { doGiay: { g: 14.4, t: 9999, h: 1, p: 'III' } })).ok).toBe(true)
    const r = dong(d, 'Q0')!
    expect(r.giay).toBe(14)
    // Câu Q0: "Đề Q0" (2 từ) + 4 phương án "A. a"… (2 từ mỗi phương án) = 10 từ, không hình, Phần I.
    expect(JSON.parse(r.raw_json!).doc).toEqual({ t: 10, h: 0, p: 'I' })
  })
  it('chỉ có `msLam` (máy cũ) ⇒ giây = ms/1000 và máy chủ vẫn tự đo kích thước đề vào raw.doc', async () => {
    const d = dungPhien()
    await tra(d, 'Q1', { msLam: 30_400 })
    const r = dong(d, 'Q1')!
    expect(r.giay).toBe(30)
    expect(JSON.parse(r.raw_json!).doc).toEqual({ t: 10, h: 0, p: 'I' })
  })
  it('không gửi gì ⇒ giây NULL như hôm nay; đồng hồ hỏng báo 0 ⇒ NULL (không thành Mức làm 1 oan)', async () => {
    const d = dungPhien()
    await tra(d, 'Q0', {})
    expect(dong(d, 'Q0')!.giay).toBeNull()
    await tra(d, 'Q2', { doGiay: { g: 0, t: 20 }, msLam: 0 })
    expect(dong(d, 'Q2')!.giay).toBeNull()
  })
})
