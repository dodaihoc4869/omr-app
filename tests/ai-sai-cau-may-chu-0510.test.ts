// @vitest-environment node
// MÁY CHỦ `/gv/ai-sai-cau` (thầy 05/10, nút X "Ai sai câu này" trên tờ chiếu): CHỈ ĐỌC sổ — em · lúc · nơi · số giây.
import { describe, expect, it } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That } from './_d1-that'
import type { Env } from '../server/src/kieu'

describe('máy chủ /gv/ai-sai-cau', () => {
  it('lượt sai tự làm của mọi kênh (kể cả song sinh, bỏ trống ở ca thi); bỏ lượt đúng và lượt đọc lời giải; có tên ca + số giây; chỉ thầy', async () => {
    const d = taoD1That()
    const env = d.env as unknown as Env
    d.sql.prepare('INSERT INTO danh_sach (sbd, ho_ten, nam_sinh, lop, cap_nhat_luc) VALUES (?,?,?,?,?)').run('S1', 'Trần An', '2010', '11', 'x')
    d.sql.prepare('INSERT INTO danh_sach (sbd, ho_ten, nam_sinh, lop, cap_nhat_luc) VALUES (?,?,?,?,?)').run('S2', 'Lê Bình', '2010', '11', 'x')
    d.sql.prepare("INSERT INTO ca (ma_ca, ten_ca, trang_thai, cap_nhat_luc) VALUES ('C1', 'Kiểm tra tuần 3', 'dong', 'x')").run()
    const sk = (khoa: string, sbd: string, qid: string, nguon: string, maNguon: string, kq: number | null, giay: number | null, luc: string, purpose = '') =>
      d.sql.prepare('INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, ket_qua, giay, luc, ngay_vn, purpose) VALUES (?,?,?,?,?,?,?,?,?,?)').run(khoa, sbd, qid, nguon, maNguon, kq, giay, luc, luc.slice(0, 10), purpose)
    sk('k1', 'S1', 'Q1', 'thi', 'C1', 0, 95, '2026-10-01T02:05:00Z')
    sk('k2', 'S1', 'Q1~ss0', 'len_bang', 'b', 0, 40, '2026-10-03T03:00:00Z')
    sk('k3', 'S2', 'Q1', 'thi', 'C1', null, null, '2026-10-01T02:06:00Z') // bỏ trống ở ca thi = sai
    sk('k4', 'S2', 'Q1', 'btvn', 'x', 1, 30, '2026-10-02T02:00:00Z') // đúng ⇒ bỏ
    sk('k5', 'S2', 'Q1', 'on_lai', 'x', 0, 10, '2026-10-02T03:00:00Z', 'xem_loi_giai') // đọc lời giải ⇒ bỏ
    sk('k6', 'S2', 'Q9', 'thi', 'C1', 0, 50, '2026-10-01T02:06:00Z') // câu khác ⇒ bỏ
    expect((await goiWorker(worker, env, '/gv/ai-sai-cau', { qids: ['Q1'] })).ok).toBe(false)
    const r = await goiWorker(worker, env, '/gv/ai-sai-cau', { qids: ['Q1'] }, true)
    expect(r).toMatchObject({ ok: true, soEm: 2, conNua: false })
    expect(r.ds).toEqual([
      { sbd: 'S2', ten: 'Lê Bình', luc: '2026-10-01T02:06:00Z', noi: 'Ca Kiểm tra tuần 3', giay: null },
      { sbd: 'S1', ten: 'Trần An', luc: '2026-10-03T03:00:00Z', noi: 'Lên bảng', giay: 40 },
      { sbd: 'S1', ten: 'Trần An', luc: '2026-10-01T02:05:00Z', noi: 'Ca Kiểm tra tuần 3', giay: 95 },
    ])
    expect((await goiWorker(worker, env, '/gv/ai-sai-cau', { qids: [] }, true)).ok).toBe(false)
  })
})

