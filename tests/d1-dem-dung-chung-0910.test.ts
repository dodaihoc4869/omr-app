// @vitest-environment node
// Sự cố 09/10: mỗi em mở Sảnh đọc lại ~5.000 dòng kho câu/OMNI/danh sách giống hệt em khác ⇒ D1 quá tải. Bảng dùng chung được nhớ 60 giây giữa các lượt.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { gopDocD1 } from '../server/src/doc-d1-theo-luot'
import { xoaMoiDem } from '../server/src/dem-chung'
import type { D1Database, D1PreparedStatement } from '../server/src/kieu'

function dung() {
  const goi: string[] = []
  const ket = (sql: string) => ({ success: true, results: [{ sql, n: goi.length }], meta: { changes: 0, last_row_id: 0, rows_read: 1, rows_written: 0 } })
  const raw = {
    prepare: (sql: string) => {
      const st = { bind: () => st, all: async () => { goi.push(sql); return ket(sql) }, first: async () => ket(sql).results[0], run: async () => { goi.push(sql); return ket(sql) } }
      return st as unknown as D1PreparedStatement
    },
    batch: vi.fn(async (ds: D1PreparedStatement[]) => Promise.all(ds.map((s) => s.all()))),
  } as unknown as D1Database
  return { raw, goi, luot: () => gopDocD1(raw) }
}

beforeEach(() => xoaMoiDem())

describe('đệm bảng dùng chung giữa các lượt', () => {
  it('kho câu: lượt thứ hai cùng câu + cùng tham số KHÔNG gọi D1; tham số khác thì gọi', async () => {
    const { goi, luot } = dung()
    const sql = 'SELECT ma_de, qid, json FROM game_v2_question WHERE ma_de IN (SELECT value FROM json_each(?))'
    await luot().prepare(sql).bind('["A"]').all()
    await luot().prepare(sql).bind('["A"]').all()
    expect(goi).toHaveLength(1)
    await luot().prepare(sql).bind('["B"]').all()
    expect(goi).toHaveLength(2)
  })
  it('trả bản sao: nơi gọi sửa dòng không làm hỏng lượt sau', async () => {
    const { luot } = dung()
    const sql = 'SELECT qid, y FROM omni_q WHERE qid = ?'
    const a = await luot().prepare(sql).bind('q1').all<Record<string, unknown>>()
    a.results[0]!.sql = 'bị sửa'
    const b = await luot().prepare(sql).bind('q1').all<Record<string, unknown>>()
    expect(b.results[0]!.sql).toBe(sql)
  })
  it('lệnh ghi đụng bảng dùng chung ⇒ xoá đệm ngay', async () => {
    const { goi, luot } = dung()
    const sql = 'SELECT sbd, ho_ten, lop FROM danh_sach'
    await luot().prepare(sql).all()
    await luot().prepare("UPDATE danh_sach SET lop = '12A' WHERE sbd = ?").bind('1').run()
    await luot().prepare(sql).all()
    expect(goi.filter((s) => s === sql)).toHaveLength(2)
  })
  it('KHÔNG nhớ: hoc_sinh (có token/mật khẩu), câu trộn bảng riêng của em, câu có thời gian', async () => {
    const { goi, luot } = dung()
    const cau = [
      'SELECT sbd, ho_ten, lop, ten_lop, trang_thai FROM hoc_sinh',
      'SELECT q.qid FROM game_v2_question q JOIN su_kien_hoc s ON s.qid = q.qid WHERE s.sbd = ?',
      "SELECT qid FROM game_v2_question WHERE cap_nhat_luc > datetime('now', '-1 day')",
    ]
    for (const s of cau) { await luot().prepare(s).bind('1').all(); await luot().prepare(s).bind('1').all() }
    expect(goi).toHaveLength(cau.length * 2)
  })
})
