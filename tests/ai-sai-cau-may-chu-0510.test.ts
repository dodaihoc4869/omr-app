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


describe('lượt game: thời gian ƯỚC TÍNH (thầy 05/10: "chỗ làm trong chưa hiển thị")', () => {
  it('giây ≈ từ lần trả lời trước (câu đầu: từ lúc mở lượt) tới lần này; quá 15 phút ⇒ không đoán (null); có cờ uocTinh', async () => {
    const d = taoD1That()
    const env = d.env as unknown as Env
    d.sql.prepare('INSERT INTO danh_sach (sbd, ho_ten, nam_sinh, lop, cap_nhat_luc) VALUES (?,?,?,?,?)').run('S1', 'Trần An', '2010', '11', 'x')
    const t0 = Date.parse('2026-10-04T13:00:00Z')
    d.sql.prepare('INSERT INTO game_v2_session (id, sbd, json, created_at) VALUES (?,?,?,?)').run('P1', 'S1', JSON.stringify({ created: t0 }), new Date(t0).toISOString())
    const tl = (qid: string, at: number) => d.sql.prepare('INSERT INTO game_v2_attempt (id, sbd, session, qid, content_group, json, created_at) VALUES (?,?,?,?,?,?,?)').run(`P1|${qid}`, 'S1', 'P1', qid, 'g', JSON.stringify({ attempt: { at, qid }, correct: false }) /* hình dạng THẬT: game-v2.ts ghi `result` = {attempt, traLoi, correct, …} */, new Date(at).toISOString())
    const sk = (khoa: string, qid: string, at: number) => d.sql.prepare("INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, ket_qua, giay, luc, ngay_vn) VALUES (?, 'S1', ?, 'game', 'P1', 0, NULL, ?, ?)").run(khoa, qid, new Date(at).toISOString(), '2026-10-04')
    tl('A', t0 + 45_000); sk('g1', 'Q1', t0 + 45_000) // câu đầu lượt: 45 giây từ lúc mở lượt
    tl('B', t0 + 80_000) // câu khác, em làm đúng
    tl('Q1~ss0', t0 + 110_000); sk('g2', 'Q1~ss0', t0 + 110_000) // 30 giây từ câu trước
    tl('C', t0 + 2_000_000); sk('g3', 'Q1', t0 + 3_000_000) // không có lần trả lời khớp ⇒ null
    const r = await goiWorker(worker, env, '/gv/ai-sai-cau', { qids: ['Q1'] }, true)
    expect(r.ds.map((x: { giay: number | null; uocTinh?: boolean }) => [x.giay, x.uocTinh ?? false])).toEqual([[null, false], [30, true], [45, true]])
  })
})
