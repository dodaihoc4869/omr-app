// @vitest-environment node
// Chiến dịch đang chạy đã chốt trước bản 08/10: chưa bắt đầu thì tự đổi sang phân bổ hồ sơ; đang làm thì không đổi đề giữa chừng.
import { beforeEach, describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import { gvChienDich } from '../server/src/srs2-gv'
import { docHoSo2, layKeHoachHomNay, qidGoc, xoaDemChienDich } from '../server/src/srs2-d1'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import { xoaMoiDem } from '../server/src/dem-chung'
import type { Env } from '../server/src/kieu'

const T0 = Date.parse('2026-10-08T03:00:00Z')
const NGAY = '2026-10-08'
const MUC = ['NB', 'TH', 'VD', 'VDC'] as const

function cauJson(qid: string, mucDo: string) {
  return JSON.stringify({ qid, maDe: 'DE', lop: '12', version: 'v1', group: `g-${qid}`, phan: 'II', text: qid, choices: [], ideas: ['a', 'b', 'c', 'd'], hinhAnh: [], dang: 'D1', tenDang: 'Dạng 1', mucDo, sao: 0, correct: ['Đ', 'S', 'Đ', 'S'], reviewed: true, solution: { chot: 'c' } })
}

async function boTri(daBatDau: boolean) {
  const d = taoD1That()
  const env = d.env as unknown as Env
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Nguyễn An','12A1','mk','x')")
  // 1/10 đúng ⇒ p = 3/14 < 0,4: L1.
  d.sql.exec("INSERT INTO nam_kt_dang(khoa,sbd,ma_dang,so_gap,so_sai,so_da_khac_phuc,so_moi_sai,so_chua_thay_sai,bac,cap_nhat_luc) VALUES('S1|D1','S1','D1',10,9,1,0,0,1,'x')")
  d.sql.exec("INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DE','Bài đang chạy',80,0,'v1')")
  d.sql.exec("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE','v1','x')")
  const st = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  const qids: string[] = []
  for (let m = 0; m < 4; m++) for (let i = 0; i < 20; i++) {
    const qid = `${MUC[m]}-${i}`
    qids.push(qid)
    st.run('DE', qid, 'v1', `g-${qid}`, 'D1', cauJson(qid, MUC[m]!))
  }
  d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true,"lop":["12A1"]}','x')`)
  const tao = await gvChienDich(env, { action: 'tao', ten: 'Bài đang chạy', lop: '12A1', maDe: ['DE'], hanNop: '2026-11-08', theLucNgay: 40, raiDeu: false }, T0)
  const id = String(tao.id)
  // Mô phỏng kế hoạch cũ 30 câu (nhiều hơn trần riêng 24 của L1).
  const hopLe = (await docHoSo2(env, 'S1', NGAY)).cau.map((c) => c.qid)
  const cu = hopLe.slice(0, 30)
  expect(cu).toHaveLength(30)
  d.sql.prepare('INSERT INTO srs2_ke_hoach(sbd,ngay,chien_dich_id,dao_json,doan_json,huyet_chien,tong,tao_luc) VALUES(?,?,?,?,?,0,30,?)')
    .run('S1', NGAY, id, JSON.stringify(cu), '[]', new Date(T0 - 60_000).toISOString())
  if (daBatDau) await ghiSuKien(env, [{ nguon: 'game', maNguon: 'phien-cu', sbd: 'S1', qid: cu[0]!, lan: 1, ketQua: 1, luc: new Date(T0 - 30_000).toISOString() }])
  return { env, cu }
}

beforeEach(() => { xoaMoiDem(); xoaDemChienDich() })

describe('áp chính sách mới lên chiến dịch đang chạy', () => {
  it('em chưa bắt đầu: đổi ngay sang 24 câu L1 và không còn câu mới quá Thông hiểu', async () => {
    const { env } = await boTri(false)
    const { kh, hs } = await layKeHoachHomNay(env, 'S1', T0)
    const muc = new Map(hs.cau.map((c) => [c.qid, c.mucDo]))
    expect(kh.tong).toBe(24)
    expect([...kh.dao, ...kh.doan].every((k) => ['NB', 'TH'].includes(muc.get(qidGoc(k)) ?? ''))).toBe(true)
    const demTh = [...kh.dao, ...kh.doan].filter((k) => muc.get(qidGoc(k)) === 'TH').length
    const sucChuaNb = hs.cau.filter((c) => c.mucDo === 'NB').length
    expect(demTh).toBeGreaterThan(0)
    // Kho sau cổng khối có thể thiếu NB: giữ đủ tổng 24 quan trọng hơn, chỉ vượt 20% đúng phần bất khả kháng.
    expect(demTh).toBeLessThanOrEqual(Math.max(Math.ceil(kh.tong * .2), kh.tong - sucChuaNb))
  })

  it('em đã làm một câu: giữ nguyên kế hoạch 30 câu hôm nay, chính sách mới áp từ kế hoạch kế tiếp', async () => {
    const { env, cu } = await boTri(true)
    const { kh } = await layKeHoachHomNay(env, 'S1', T0)
    expect(kh.tong).toBe(30)
    expect(kh.dao).toEqual(cu)
    expect(kh.conDao).toHaveLength(29)
  })
})
