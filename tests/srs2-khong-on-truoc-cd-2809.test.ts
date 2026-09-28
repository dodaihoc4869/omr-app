// @vitest-environment node
// Thầy 28/09: "xoá bỏ tất cả các câu ôn trước, khi giao chiến dịch đầu tiên tất cả không có câu ôn, không được lấy câu ôn trước đó".
// ⇒ Câu của chiến dịch chỉ tính lần làm TỪ LÚC GIAO; lịch sử trước đó (ca thi, BTVN, bài Mẹ giao…) không sinh câu ôn.
import { describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import { gvChienDich } from '../server/src/srs2-gv'
import { layKeHoachHomNay, sanh2 } from '../server/src/srs2-d1'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import type { Env } from '../server/src/kieu'

const GIAO = Date.parse('2026-09-28T02:00:00Z') // 09:00 VN
const cau = (qid: string, phan: 'I' | 'II') => JSON.stringify({
  qid, maDe: 'DE1', version: 'v1', group: `g-${qid}`, phan, text: `Câu ${qid}`, choices: phan === 'I' ? ['a', 'b', 'c', 'd'] : [], ideas: phan === 'II' ? ['a', 'b', 'c', 'd'] : [],
  hinhAnh: [], dang: 'D1', tenDang: 'Dạng 1', mucDo: 'NB', sao: 1, kienThuc: ['k'], correct: phan === 'I' ? 'B' : 'DSDS', reviewed: true, solution: { chot: 'c' },
})
async function dung() {
  const d = taoD1That()
  const env = d.env as unknown as Env
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S1','An','12','x')")
  d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true}','x')`)
  const st = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (let i = 1; i <= 12; i++) st.run('DE1', `Q${i}`, 'v1', `g-Q${i}`, 'D1', cau(`Q${i}`, i === 4 ? 'II' : 'I'))
  // LỊCH SỬ TRƯỚC CHIẾN DỊCH: Q1 sai (bài Mẹ giao 16/09), Q2 + Q3 đúng một lần (BTVN 21/09), Q4 Đúng–sai sai
  const ls = [['Q1', '2026-09-16T10:00:00Z', 0, 'mom'], ['Q2', '2026-09-21T00:17:00Z', 1, 'btvn_lo'], ['Q3', '2026-09-21T00:17:00Z', 1, 'btvn_lo'], ['Q4', '2026-09-16T10:00:00Z', 0, 'mom']] as const
  for (const [qid, luc, kq, nguon] of ls) await ghiSuKien(env, [{ nguon, maNguon: `m-${qid}`, sbd: 'S1', qid, lan: 1, ketQua: kq, luc }] as never)
  return { d, env }
}

describe('giao chiến dịch: không lấy câu ôn từ lịch sử trước đó', () => {
  it('ngày đầu KHÔNG có câu ôn (Đoàn 0), mọi câu là câu mới; Bảng chiến dịch cọ xát 0', async () => {
    const { env } = await dung()
    const t = await gvChienDich(env, { action: 'tao', ten: 'T', sbd: ['S1'], maDe: ['DE1'], hanNop: '2026-10-05' }, GIAO) as { id: string }
    const { kh, hs } = await layKeHoachHomNay(env, 'S1', GIAO + 60_000)
    expect(kh.doan).toEqual([])
    expect(hs.ttChienDich.every((x) => x.laMoi)).toBe(true)
    const s = await sanh2(env, 'S1', GIAO + 60_000) as { doan: { con: number }; khoaDao: boolean; chienDich: { coXat: number } }
    expect(s.doan.con).toBe(0)
    expect(s.khoaDao).toBe(false)
    expect(s.chienDich.coXat).toBe(0)
    const b = await gvChienDich(env, { action: 'bang', id: t.id }, GIAO + 60_000) as { em: { coXat: number }[] }
    expect(b.em[0]!.coXat).toBe(0)
  })
  it('lần làm SAU lúc giao vẫn được tính (sai hôm nay ⇒ ôn ngày mai)', async () => {
    const { env } = await dung()
    await gvChienDich(env, { action: 'tao', ten: 'T', sbd: ['S1'], maDe: ['DE1'], hanNop: '2026-10-05' }, GIAO)
    await ghiSuKien(env, [{ nguon: 'game', maNguon: 'p1', sbd: 'S1', qid: 'Q5', lan: 1, ketQua: 0, luc: '2026-09-28T03:00:00Z' }] as never)
    const mai = await layKeHoachHomNay(env, 'S1', Date.parse('2026-09-29T02:00:00Z'))
    expect(mai.kh.doan).toContain('Q5')
    expect(mai.kh.doan).not.toContain('Q1')
  })
  it('sức chứa lúc giao: mọi câu là mới ⇒ lượt cần = 2 × số câu', async () => {
    const { env } = await dung()
    const r = await gvChienDich(env, { action: 'suc-chua', sbd: ['S1'], maDe: ['DE1'], hanNop: '2026-10-05' }, GIAO) as { soCau: number; khoiLuongTrungVi: number }
    expect(r.khoiLuongTrungVi).toBe(2 * r.soCau)
  })
})
