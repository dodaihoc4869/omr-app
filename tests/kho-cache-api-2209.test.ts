// @vitest-environment node
// CACHE API `caches.default` cho kho câu theo dạng (Boss 22/09, tốc độ tối đa — LỚP 2 trên demKhoDang, game-v2-bank.ts
// readScope): demKhoDang (một isolate) → caches.default (cả colo) → D1. Node không có `caches` toàn cục — polyfill BỘ
// NHỚ ở đây để bài test chạy ĐÚNG đường mã thật (không nhánh test riêng), rồi tháo lại sau mỗi test.
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { readScope } from '../server/src/game-v2-bank'
import { xoaMoiDem } from '../server/src/dem-chung'
import { taoD1That, type D1That } from './_d1-that'

/** `caches.default` giả — Map trong bộ nhớ tiến trình test, sống QUA việc xoaMoiDem() (đúng như Cache API thật sống qua khi isolate/đệm mô-đun bị xoá). */
function caCheGia() {
  const kho = new Map<string, string>()
  const cache = {
    async match(req: string) { const v = kho.get(req); return v === undefined ? undefined : new Response(v, { headers: { 'content-type': 'application/json' } }) },
    async put(req: string, res: Response) { kho.set(req, await res.text()) },
  }
  return { kho, cache }
}

function dungKho(d: D1That, maDe: string, dang: string, soCau: number) {
  d.sql.prepare('INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES(?,?,?,0,?)').run(maDe, `Đề ${maDe}`, soCau, `v-${maDe}`)
  d.sql.prepare('INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES(?,?,?)').run(maDe, `v-${maDe}`, 'x')
  const them = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (let i = 1; i <= soCau; i++) {
    const qid = `${maDe}-q${i}`
    them.run(maDe, qid, 'v', `g-${maDe}-${i}`, dang, JSON.stringify({ qid, maDe, version: 'v', group: `g-${maDe}-${i}`, phan: 'I', text: `Câu ${i}`, choices: ['A', 'B'], ideas: [], correct: 'A', dang, tenDang: 'T', mucDo: 'biet', sao: 1, kienThuc: ['K'], reviewed: true }))
  }
  d.sql.prepare("INSERT OR IGNORE INTO hoc_sinh(sbd,ho_ten,cap_nhat_luc) VALUES('S1','x','x')").run()
}

describe('readScope · caches.default (kho câu theo dạng)', () => {
  let goc: typeof globalThis.caches | undefined
  beforeEach(() => { goc = (globalThis as any).caches })
  afterEach(() => { (globalThis as any).caches = goc })

  it('lần 2 (demKhoDang đã xoá) không chạm D1 — lấy thẳng từ caches.default', async () => {
    const d = taoD1That()
    dungKho(d, 'DE1', 'AA.BB', 5)
    const { kho, cache } = caCheGia()
    ;(globalThis as any).caches = { default: cache }

    const lan1 = await readScope(d.env, 'S1', ['AA.BB'])
    expect(lan1.pool.length).toBe(5)
    expect(kho.size).toBe(1) // đã ghi đúng 1 khoá (một dạng)

    xoaMoiDem() // xoá đệm mô-đun (lớp 1) — nếu lớp 2 KHÔNG hoạt động, lượt sau sẽ phải đọc lại D1
    const demKhoQuiz = demTheoMau(d, /FROM game_v2_question/)
    const lan2 = await readScope(d.env, 'S1', ['AA.BB'])
    expect(lan2.pool.length).toBe(5)
    expect(demKhoQuiz()).toBe(0) // KHÔNG một câu nào đọc game_v2_question (nội dung câu) — kho theo dạng lấy từ caches.default, không phải D1
  })

  it('đổi phiên bản kho (thêm một tờ) ⇒ khoá cache khác, không dùng nhầm bản cũ', async () => {
    const d = taoD1That()
    dungKho(d, 'DE1', 'AA.BB', 3)
    const { kho, cache } = caCheGia()
    ;(globalThis as any).caches = { default: cache }

    await readScope(d.env, 'S1', ['AA.BB'])
    const khoaTruoc = [...kho.keys()]
    expect(khoaTruoc).toHaveLength(1)

    dungKho(d, 'DE2', 'AA.BB', 2) // thêm một tờ mới cùng dạng ⇒ phiên bản kho đổi
    xoaMoiDem()
    const lan2 = await readScope(d.env, 'S1', ['AA.BB'])
    expect(lan2.pool.length).toBe(5) // đủ cả DE1 (3) + DE2 (2), không kẹt ở bản cache cũ (3)
    expect([...kho.keys()]).not.toEqual(khoaTruoc) // khoá mới khác khoá cũ (phiên bản kho đổi)
  })

  it('không có `caches` toàn cục (Node/test khác) ⇒ đọc thẳng D1, không ném lỗi', async () => {
    ;(globalThis as any).caches = undefined
    const d = taoD1That()
    dungKho(d, 'DE1', 'AA.BB', 4)
    const r = await readScope(d.env, 'S1', ['AA.BB'])
    expect(r.pool.length).toBe(4)
  })
})

/** Đếm câu lệnh D1 KHỚP một mẫu (giống các test hạ tải khác trong kho) — dùng để khẳng định "không chạm bảng X" chính xác hơn đếm tổng số câu. */
function demTheoMau(d: D1That, mau: RegExp): () => number {
  let n = 0
  const goc = d.env.DB.prepare.bind(d.env.DB)
  d.env.DB.prepare = ((q: string) => { if (mau.test(q)) n++; return goc(q) }) as typeof d.env.DB.prepare
  return () => n
}
