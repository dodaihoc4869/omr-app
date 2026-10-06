// @vitest-environment node
// 06/10 (thầy: "em khối 10 rút câu khối 11 — triệt để 100%"): chiến dịch giao cho cả lớp vẫn chỉ phát cho MỖI EM câu đúng khối em;
// em lớp trống ⇒ khối lấy từ SBD; kế hoạch đã chốt có câu khối khác ⇒ lập lại.
import { describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import type { Env } from '../server/src/kieu'
import { docHoSo2, layKeHoachHomNay } from '../server/src/srs2-d1'
import { gvChienDich } from '../server/src/srs2-gv'
import { khoiTuSbd, docKhoiCacEmCong } from '../server/src/chan-khac-khoi'

const T0 = Date.parse('2026-10-06T03:00:00.000Z')
const cau = (qid: string, maDe: string) => JSON.stringify({
  qid, maDe, lop: '', version: 'v1', group: `g-${qid}`, phan: 'I', text: `Câu ${qid}`, choices: ['a', 'b', 'c', 'd'], hinhAnh: [], dang: 'D1', tenDang: 'Dạng 1', mucDo: 'TH',
  sao: 1, kienThuc: ['k'], correct: 'B', reviewed: true, solution: { chot: `Cốt lõi ${qid}`, tungPa: {} },
})
async function dung(lopEm: string) {
  const d = taoD1That()
  const env = d.env as unknown as Env
  d.sql.exec(`INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('10001','An','10A1','x')`)
  const st = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  st.run('DH-10-C1-B1', 'DH-10-C1-B1-I-1', 'v1', 'g1', 'D1', cau('DH-10-C1-B1-I-1', 'DH-10-C1-B1'))
  st.run('DH-11-C1-B1', 'DH-11-C1-B1-I-1', 'v1', 'g2', 'D1', cau('DH-11-C1-B1-I-1', 'DH-11-C1-B1'))
  d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true,"lop":["10A1"]}','x')`)
  const r = await gvChienDich(env, { action: 'tao', ten: 'Trộn khối', lop: '10A1', maDe: ['DH-10-C1-B1', 'DH-11-C1-B1'], hanNop: '2026-10-12', raiDeu: false }, T0 - 86_400_000)
  expect(r.ok).toBe(true)
  d.sql.prepare('UPDATE hoc_sinh SET lop = ? WHERE sbd = ?').run(lopEm, '10001')
  return { d, env }
}

describe('khối em', () => {
  it('khoiTuSbd: 5 chữ số 10/11/12; còn lại null', () => {
    expect(khoiTuSbd('10048')).toBe(10)
    expect(khoiTuSbd('11094')).toBe(11)
    expect(khoiTuSbd('12006')).toBe(12)
    expect(khoiTuSbd('12121212')).toBeNull()
    expect(khoiTuSbd('9001')).toBeNull()
  })
  it('lớp trống ⇒ khối lấy từ SBD', async () => {
    const { env } = await dung('')
    expect((await docKhoiCacEmCong(env, ['10001'])).get('10001')).toBe(10)
  })
})

describe('chiến dịch trộn khối chỉ phát câu đúng khối em', () => {
  for (const lopEm of ['10', '']) {
    it(`em khối 10 (lop="${lopEm}"): hồ sơ và kế hoạch không có câu khối 11`, async () => {
      const { env } = await dung(lopEm)
      const hs = await docHoSo2(env, '10001', '2026-10-06')
      expect(hs.cau.map((c) => c.qid)).toEqual(['DH-10-C1-B1-I-1'])
      const { kh } = await layKeHoachHomNay(env, '10001', T0)
      expect([...kh.dao, ...kh.doan]).not.toContain('DH-11-C1-B1-I-1')
    })
  }
  it('kế hoạch đã chốt có câu khối 11 ⇒ lập lại, câu khối 11 biến mất', async () => {
    const { d, env } = await dung('10')
    d.sql.prepare('INSERT INTO srs2_ke_hoach(sbd,ngay,chien_dich_id,dao_json,doan_json,huyet_chien,tong,tao_luc) VALUES(?,?,?,?,?,0,2,?)')
      .run('10001', '2026-10-06', (d.sql.prepare('SELECT id FROM chien_dich').get() as { id: string }).id, JSON.stringify(['DH-11-C1-B1-I-1']), JSON.stringify(['DH-10-C1-B1-I-1']), 'x')
    const { kh } = await layKeHoachHomNay(env, '10001', T0)
    expect([...kh.dao, ...kh.doan, ...kh.conDao, ...kh.conDoan]).not.toContain('DH-11-C1-B1-I-1')
  })
})
