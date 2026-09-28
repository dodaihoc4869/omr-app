// @vitest-environment node
// Giao chiến dịch (thầy 28/09): tờ ĐÃ TÁCH theo phần (-TN/-DS/-TLN) chỉ lấy câu của phần đó; máy chủ trả số câu TỪNG tờ (cộng = tổng) và tách
// lượt của em giữa lớp thành "câu mới × 2 + lượt ôn"; chọn em bằng danh sách SBD (bỏ tích em nào thì em đó không nhận).
import { describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import { gvChienDich, tachMaTo } from '../server/src/srs2-gv'
import type { Env } from '../server/src/kieu'

const T0 = Date.parse('2026-09-30T07:59:00Z')
const cau = (qid: string, phan: 'I' | 'II' | 'III', extra: Record<string, unknown> = {}) => JSON.stringify({
  qid, maDe: 'DE1', version: 'v1', group: `g-${qid}`, phan, text: `Câu ${qid}`, choices: phan === 'I' ? ['a', 'b', 'c', 'd'] : [], ideas: phan === 'II' ? ['a', 'b', 'c', 'd'] : [],
  hinhAnh: [], dang: 'D1', tenDang: 'Dạng 1', mucDo: 'NB', sao: 1, kienThuc: ['k'], correct: phan === 'I' ? 'B' : phan === 'II' ? 'DSDS' : '4', reviewed: true, solution: { chot: 'c' }, ...extra,
})
function dung() {
  const d = taoD1That()
  const env = d.env as unknown as Env
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S1','An','12A1','x'),('S2','Bảo','12A1','x'),('S3','Chi','12A1','x')")
  const st = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  // DE1: 4 câu Phần I, 2 câu Phần II, 1 câu Phần III, 1 câu chưa duyệt (bỏ). DE2: 2 câu Phần I, trong đó Q1 TRÙNG với DE1.
  for (const [q, p] of [['Q1', 'I'], ['Q2', 'I'], ['Q3', 'I'], ['Q4', 'I'], ['Q5', 'II'], ['Q6', 'II'], ['Q7', 'III']] as const) st.run('DE1', q, 'v1', `g-${q}`, 'D1', cau(q, p))
  st.run('DE1', 'QX', 'v1', 'g-QX', 'D1', cau('QX', 'I', { reviewed: false }))
  st.run('DE2', 'Q1', 'v1', 'g-Q1', 'D1', cau('Q1', 'I'))
  st.run('DE2', 'Q9', 'v1', 'g-Q9', 'D1', cau('Q9', 'I'))
  return { d, env }
}

describe('giao chiến dịch theo tờ đã tách + chọn em', () => {
  it('tách mã tờ: -TN/-DS/-TLN ⇒ phần I/II/III; mã thường ⇒ cả tờ', () => {
    expect(tachMaTo('DH-12-C2-B4-TN')).toEqual({ goc: 'DH-12-C2-B4', phan: 'I' })
    expect(tachMaTo('DE1-DS')).toEqual({ goc: 'DE1', phan: 'II' })
    expect(tachMaTo('DE1-TLN')).toEqual({ goc: 'DE1', phan: 'III' })
    expect(tachMaTo('DE1')).toEqual({ goc: 'DE1', phan: null })
  })
  it('tờ tách chỉ lấy câu của phần đó; số câu TỪNG tờ cộng lại đúng bằng tổng (câu trùng giữa tờ chỉ tính một lần)', async () => {
    const { env } = dung()
    const r = await gvChienDich(env, { action: 'suc-chua', lop: '12A1', maDe: ['DE1-TN', 'DE1-DS', 'DE2'], hanNop: '2026-10-04' }, T0) as Record<string, unknown>
    expect(r).toMatchObject({ ok: true, soCau: 7, soCauTheoTo: { 'DE1-TN': 4, 'DE1-DS': 2, 'DE2': 1 } })
    const theoTo = r.soCauTheoTo as Record<string, number>
    expect(Object.values(theoTo).reduce((a, b) => a + b, 0)).toBe(r.soCau)
    // em mới hoàn toàn: 7 câu mới × 2 = 14 lượt
    expect(r).toMatchObject({ khoiLuongTrungVi: 14, tachGiua: { cauMoi: 7, luotOn: 0 } })
  })
  it('chọn em bằng SBD: chỉ em được tích nhận; tạo chiến dịch lưu mã gốc (tra dạng/bảng đúng) và đúng câu của phần đã chọn', async () => {
    const { d, env } = dung()
    const sc = await gvChienDich(env, { action: 'suc-chua', lop: '12A1', sbd: ['S1', 'S3'], maDe: ['DE1-DS'], hanNop: '2026-10-04' }, T0)
    expect(sc).toMatchObject({ soEm: 2, soCau: 2 })
    const t = await gvChienDich(env, { action: 'tao', ten: 'x', lop: '12A1', sbd: ['S1', 'S3'], maDe: ['DE1-DS'], hanNop: '2026-10-04' }, T0) as { id: string }
    const row = d.sql.prepare('SELECT sbd_json, ma_de_json, qid_json FROM chien_dich WHERE id = ?').get(t.id) as Record<string, string>
    expect(JSON.parse(row.sbd_json)).toEqual(['S1', 'S3'])
    expect(JSON.parse(row.ma_de_json)).toEqual(['DE1'])
    expect(JSON.parse(row.qid_json)).toEqual(['Q5', 'Q6'])
    const b = await gvChienDich(env, { action: 'bang', id: t.id }, T0) as { dang: string[] }
    expect(b.dang).toEqual(['Dạng 1'])
  })
})

describe('thể lực tự do + tự động (thầy 28/09)', () => {
  it('thể lực đề xuất = số nhỏ nhất để em giữa lớp ≤ 70% và em nặng nhất ≤ 100%; tối thiểu 10', async () => {
    const { theLucDeXuat } = await import('../server/src/srs2-gv')
    expect(theLucDeXuat(340, 340, 8)).toBe(61) // ceil(340 / 5,6)
    expect(theLucDeXuat(100, 400, 8)).toBe(50) // em nặng nhất quyết định
    expect(theLucDeXuat(0, 0, 8)).toBe(10)
  })
  it('máy chủ nhận thể lực bất kì (135) và trả theLucDeXuat; ds-em trả danh sách học sinh', async () => {
    const { env } = dung()
    const r = await gvChienDich(env, { action: 'suc-chua', lop: '12A1', maDe: ['DE1'], hanNop: '2026-10-04', theLucNgay: 135 }, T0) as Record<string, number>
    expect(r.sucChua).toBe(r.D * 135)
    expect(r.theLucDeXuat).toBe(Math.max(10, Math.ceil(r.khoiLuongTrungVi / (0.7 * r.D))))
    const ds = await gvChienDich(env, { action: 'ds-em' }, T0) as { em: { sbd: string; lop: string }[] }
    expect(ds.em.map((e) => e.sbd)).toEqual(['S1', 'S2', 'S3'])
  })
})

describe('trần Huyết Chiến tự tính (thầy 28/09)', () => {
  it('= gấp đôi thể lực/ngày của chiến dịch, không cố định 80', async () => {
    const { tranHuyetChienTheo } = await import('../server/src/srs2-loi')
    expect(tranHuyetChienTheo(40)).toBe(80)
    expect(tranHuyetChienTheo(61)).toBe(122)
    expect(tranHuyetChienTheo(25)).toBe(50)
  })
})

describe('ds-em trả KHỐI + LỚP ĐÃ PHÂN (thầy 28/09: "học sinh đã phân lớp cho khối 12")', () => {
  it('ten_lop có thì dùng; chưa phân ⇒ mặc định theo khối', async () => {
    const { d, env } = dung()
    d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,ten_lop,cap_nhat_luc) VALUES('K1','Khoa','12','12 - Tinh Hoa','x'),('K2','Lan','12',NULL,'x')")
    const ds = await gvChienDich(env, { action: 'ds-em' }, T0) as { em: { sbd: string; khoi: string; tenLop: string }[] }
    const k = Object.fromEntries(ds.em.map((e) => [e.sbd, e]))
    expect(k.K1).toMatchObject({ khoi: '12', tenLop: '12 - Tinh Hoa' })
    expect(k.K2).toMatchObject({ khoi: '12', tenLop: '12 - Lớp Thường' })
  })
})
