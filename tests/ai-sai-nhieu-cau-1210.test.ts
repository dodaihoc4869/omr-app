// @vitest-environment node
// MÁY CHỦ `/gv/ai-sai-nhieu-cau` (12/10, Chữa câu khó & tính toán — mỗi câu của đề gọi được một em làm SAI câu ấy lên bảng): CHỈ ĐỌC sổ, THEO LÔ,
// chỉ các em của lớp. Ứng viên = em có LẦN LÀM MỚI NHẤT sai (câu gốc + song sinh); kèm số lần sai · lúc sai gần nhất · số giây; `lam` = số em đã làm.
import { describe, expect, it } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That } from './_d1-that'
import type { Env } from '../server/src/kieu'

function dung() {
  const d = taoD1That()
  const env = d.env as unknown as Env
  for (const [sbd, ten] of [['S1', 'Trần An'], ['S2', 'Lê Bình'], ['S3', 'Phạm Chi'], ['X9', 'Em lớp khác']])
    d.sql.prepare('INSERT INTO danh_sach (sbd, ho_ten, nam_sinh, lop, cap_nhat_luc) VALUES (?,?,?,?,?)').run(sbd, ten, '2009', '12A1', 'x')
  d.sql.prepare("INSERT INTO ca (ma_ca, ten_ca, trang_thai, cap_nhat_luc) VALUES ('C1', 'Kiểm tra tuần 3', 'dong', 'x')").run()
  const sk = (khoa: string, sbd: string, qid: string, nguon: string, kq: number | null, giay: number | null, luc: string, them: { purpose?: string; visibility?: string } = {}) =>
    d.sql
      .prepare('INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, ket_qua, giay, luc, ngay_vn, purpose, visibility) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
      .run(khoa, sbd, qid, nguon, nguon === 'thi' ? 'C1' : 'm', kq, giay, luc, luc.slice(0, 10), them.purpose ?? '', them.visibility ?? 'visible')
  return { d, env, sk }
}

describe('máy chủ /gv/ai-sai-nhieu-cau', () => {
  it('theo lô cho nhiều câu, chỉ em của lớp; ứng viên = lần mới nhất SAI (đã làm lại đúng thì thôi); song sinh tính chung; số lần sai · lúc · giây', async () => {
    const { env, sk } = dung()
    // Q1: S1 sai 2 lần (một lần ở song sinh), S2 sai rồi làm lại ĐÚNG ⇒ không ứng viên, S3 bỏ trống ở ca thi ⇒ sai; X9 lớp khác ⇒ không tính
    sk('a1', 'S1', 'Q1', 'btvn', 0, 40, '2026-10-05T02:00:00Z')
    sk('a2', 'S1', 'Q1~ss1', 'len_bang', 0, 75, '2026-10-08T03:00:00Z')
    sk('a3', 'S2', 'Q1', 'btvn', 0, 30, '2026-10-05T02:00:00Z')
    sk('a4', 'S2', 'Q1', 'on_lai', 1, 20, '2026-10-07T02:00:00Z')
    sk('a5', 'S3', 'Q1', 'thi', null, null, '2026-10-06T02:00:00Z')
    sk('a6', 'X9', 'Q1', 'btvn', 0, 50, '2026-10-09T02:00:00Z')
    // Q2: chỉ S2 làm đúng ⇒ có `lam`, không ứng viên; Q3: chỉ sự kiện đọc lời giải + sự kiện còn che ⇒ không ai làm (vắng)
    sk('b1', 'S2', 'Q2', 'btvn', 1, 12, '2026-10-05T02:00:00Z')
    sk('c1', 'S1', 'Q3', 'on_lai', 0, 9, '2026-10-05T02:00:00Z', { purpose: 'xem_loi_giai' })
    sk('c2', 'S3', 'Q3', 'thi', 0, 33, '2026-10-05T02:00:00Z', { visibility: 'embargoed' })
    const body = { sbd: ['S1', 'S2', 'S3'], qids: ['Q1', 'Q2', 'Q3'] }
    expect((await goiWorker(worker, env, '/gv/ai-sai-nhieu-cau', body)).ok).toBe(false) // chỉ thầy
    const r = await goiWorker(worker, env, '/gv/ai-sai-nhieu-cau', body, true)
    expect(r).toMatchObject({ ok: true, conNua: false })
    expect(Object.keys(r.cau).sort()).toEqual(['Q1', 'Q2'])
    expect(r.cau.Q1).toEqual({
      lam: 3,
      sai: [
        { sbd: 'S1', ten: 'Trần An', soLanSai: 2, lucSai: '2026-10-08T03:00:00Z', giay: 75 },
        { sbd: 'S3', ten: 'Phạm Chi', soLanSai: 1, lucSai: '2026-10-06T02:00:00Z', giay: null },
      ],
    })
    expect(r.cau.Q2).toEqual({ lam: 1, sai: [] })
  })

  it('ca thi thiếu giây ⇒ chi_tiet_cau.giay; thiếu mã câu ⇒ lỗi; lớp rỗng ⇒ rỗng (không đọc sổ)', async () => {
    const { d, env, sk } = dung()
    d.sql.prepare('INSERT INTO chi_tiet_cau (khoa, ma_ca, sbd, lan_thu, phan, so_cau, qid, dap_an_chon, giay, cap_nhat_luc) VALUES (?,?,?,?,?,?,?,?,?,?)').run('C1|S1|1|I|1', 'C1', 'S1', 1, 'I', 1, 'Q1', 'B', 64, 'x')
    sk('a1', 'S1', 'Q1', 'thi', 0, null, '2026-10-01T02:00:00Z')
    const r = await goiWorker(worker, env, '/gv/ai-sai-nhieu-cau', { sbd: ['S1'], qids: ['Q1'] }, true)
    expect(r.cau.Q1.sai).toEqual([{ sbd: 'S1', ten: 'Trần An', soLanSai: 1, lucSai: '2026-10-01T02:00:00Z', giay: 64 }])
    expect((await goiWorker(worker, env, '/gv/ai-sai-nhieu-cau', { sbd: ['S1'], qids: [] }, true)).ok).toBe(false)
    expect(await goiWorker(worker, env, '/gv/ai-sai-nhieu-cau', { sbd: [], qids: ['Q1'] }, true)).toMatchObject({ ok: true, cau: {}, conNua: false })
  })
})
