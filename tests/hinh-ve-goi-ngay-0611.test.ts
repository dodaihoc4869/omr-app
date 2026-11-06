// @vitest-environment node
// HÌNH VẼ LẠI ĐI KÈM GÓI BÀI CẢ NGÀY (thầy 06/11 «vẽ lại toàn bộ những câu có ảnh … tải sẵn cho app hs»).
// Khoá: chỉ hỏi câu có ảnh CỦA ĐỀ; trả cảnh đạt theo qid + danh sách đã hỏi; lỗi D1 ⇒ rỗng (máy em tự xin lười như cũ); gói cả ngày mang `hinhVe`.
import { expect, it } from 'vitest'
import { taoKhoOmni } from './omni-3-ke-hoach-chung'
import { SQL_BANG_HINH, hinhVeChoGoiNgay } from '../server/src/hinh-ve'
import { PHIEN_BAN_HINH } from '../src/lib/hinh-ve/kieu'
import type { Env } from '../server/src/kieu'

const CANH = { phienBan: PHIEN_BAN_HINH, tieuDe: 'Công thức chiếu Fischer', canh: { loai: 'fischer', dau: 'CHO', cuoi: 'CH2OH', hang: [['H', 'OH'], ['HO', 'H']] } }

function kho() {
  const k = taoKhoOmni({ 'DH-B8': 6 }, 1)
  for (const q of SQL_BANG_HINH) k.d.sql.exec(q)
  const nay = '2026-11-06T00:00:00Z'
  k.d.sql.prepare('INSERT INTO hinh_ve(bam,canh_json,cong,ly_do,phien_am,phien_ban,so_lan,tao_luc) VALUES(?,?,?,?,?,?,1,?)').run('b1', JSON.stringify(CANH), 'dat', '', '[]', PHIEN_BAN_HINH, nay)
  k.d.sql.prepare('INSERT INTO hinh_ve(bam,canh_json,cong,ly_do,phien_am,phien_ban,so_lan,tao_luc) VALUES(?,?,?,?,?,?,1,?)').run('b2', JSON.stringify(CANH), 'lech', 'lệch', '[]', PHIEN_BAN_HINH, nay)
  k.d.sql.prepare('INSERT INTO hinh_ve_cau(qid,bam,ma_de,vi_tri) VALUES(?,?,?,?)').run('Q1', 'b1', 'DH-B8', 'sau_de')
  k.d.sql.prepare('INSERT INTO hinh_ve_cau(qid,bam,ma_de,vi_tri) VALUES(?,?,?,?)').run('Q2', 'b2', 'DH-B8', 'sau_de')
  return k.env as unknown as Env
}
const anhDe = [{ src: '/anh/abc', viTri: 'sau_de' }]

it('chỉ hỏi câu có ảnh của đề; cảnh đạt về đúng qid, cảnh chưa đạt không xuống máy', async () => {
  const env = kho()
  const r = await hinhVeChoGoiNgay(env, [
    { qid: 'Q1', hinhAnh: anhDe },
    { qid: 'Q2', hinhAnh: anhDe },
    { qid: 'Q3', hinhAnh: [{ src: '/anh/x', viTri: 'sau_loi_giai' }] }, // ảnh lời giải: không hỏi
    { qid: 'Q4' },
  ])
  expect(r.hoi).toEqual(['Q1', 'Q2'])
  expect(Object.keys(r.ban)).toEqual(['Q1'])
  expect(JSON.stringify(r.ban.Q1)).toContain('fischer')
})

it('không câu nào có ảnh ⇒ không gọi D1; D1 lỗi ⇒ rỗng, không ném', async () => {
  const hong = { DB: { prepare: () => { throw new Error('D1 hỏng') } } } as unknown as Env
  expect(await hinhVeChoGoiNgay(hong, [{ qid: 'Q4' }])).toEqual({ ban: {}, hoi: [] })
  expect(await hinhVeChoGoiNgay(hong, [{ qid: 'Q1', hinhAnh: anhDe }])).toEqual({ ban: {}, hoi: [] })
})
