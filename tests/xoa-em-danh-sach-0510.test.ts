// @vitest-environment node
// XOÁ KHỎI DANH SÁCH (05/10): lệnh `deleteStudent` xoá CẢ `hoc_sinh` lẫn `danh_sach` (nguồn màn Học sinh), giữ nguyên bài làm `luot`.
import { describe, expect, it } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That } from './_d1-that'
import type { Env } from '../server/src/kieu'

describe('xoá em khỏi danh sách', () => {
  it('em biến khỏi /em/danh-sach, em khác giữ nguyên', async () => {
    const d = taoD1That()
    const env = d.env as unknown as Env
    for (const s of ['11085', '11072']) {
      d.sql.prepare('INSERT INTO danh_sach (sbd, ho_ten, nam_sinh, lop, cap_nhat_luc) VALUES (?,?,?,?,?)').run(s, 'Triệu Tuyên Minh', '2010', '11', '2026-10-01')
      d.sql.prepare('INSERT INTO hoc_sinh (sbd, ho_ten, nam_sinh, lop, cap_nhat_luc) VALUES (?,?,?,?,?)').run(s, 'Triệu Tuyên Minh', '2010', '11', '2026-10-01')
    }
    const r = await goiWorker(worker, env, '/goi', { action: 'deleteStudent', sbd: '11085' }, true)
    expect(r).toMatchObject({ ok: true, daXoaKhoiDanhSach: true })
    expect(d.sql.prepare("SELECT sbd FROM danh_sach ORDER BY sbd").all().map((x) => (x as { sbd: string }).sbd)).toEqual(['11072'])
    expect(d.sql.prepare("SELECT sbd FROM hoc_sinh ORDER BY sbd").all().map((x) => (x as { sbd: string }).sbd)).toEqual(['11072'])
    const ds = await goiWorker(worker, env, '/em/danh-sach', {}, true)
    expect((ds.items as { sbd: string }[]).map((x) => x.sbd)).toEqual(['11072'])
    // không phải thầy ⇒ không xoá được
    expect((await goiWorker(worker, env, '/goi', { action: 'deleteStudent', sbd: '11072' })).ok).toBe(false)
  })
})
