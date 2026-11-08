// @vitest-environment node
// THÊM GIỜ CHO TỪNG EM (thầy 08/11, docs/ban-ve-them-gio-em-0811): `/ca/them-phut-em {maCa, sbd, phut}` chỉ cộng hạn của MỘT lượt.
import { describe, it, expect } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

const T0 = Date.parse('2026-11-08T03:00:00.000Z')
const iso = (ms: number) => new Date(ms).toISOString()
const luot = (d: D1That, sbd: string, tt: string, vao: number, het: string | null) =>
  d.sql.prepare("INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,het_gio_luc,trang_thai,dap_an_json,cap_nhat_luc) VALUES(?,?,?,1,?,?,?,?,?)")
    .run(`C1|${sbd}|1`, 'C1', sbd, iso(vao), het, tt, '{"phanI":{"q1":"A"}}', 'x')
const han = (d: D1That, sbd: string) => (d.sql.prepare('SELECT het_gio_luc AS h FROM luot WHERE sbd = ?').get(sbd) as { h: string | null }).h
const goi = (d: D1That, b: Record<string, unknown>, thay = true) => goiWorker(worker, d.env, '/ca/them-phut-em', b, thay)

/** Ca C1 mở 45 phút. S1 vào đúng giờ, S2 vào muộn 8 phút (đang làm), S3 đã nộp, S4 bị khoá. */
function dung(): D1That {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,thoi_gian_phut,het_han_vao,cap_nhat_luc) VALUES('C1','Ca 1','mo','thi',45,?,'x')").run(iso(T0 + 3_600_000))
  luot(d, 'S1', 'dang_lam', T0, iso(T0 + 45 * 60_000))
  luot(d, 'S2', 'dang_lam', T0 + 8 * 60_000, iso(T0 + 53 * 60_000))
  luot(d, 'S3', 'da_nop', T0, iso(T0 + 45 * 60_000))
  luot(d, 'S4', 'khoa', T0, iso(T0 + 45 * 60_000))
  return d
}

describe('/ca/them-phut-em: chỉ cộng đúng MỘT em', () => {
  it('cộng hạn của em được chọn, các em khác và ca giữ nguyên', async () => {
    const d = dung()
    const r = await goi(d, { maCa: 'C1', sbd: 'S2', phut: 10 })
    expect(r).toMatchObject({ ok: true, phut: 10, sbd: 'S2', themPhutEm: 10, hetGioLuc: iso(T0 + 63 * 60_000) })
    expect(han(d, 'S2')).toBe(iso(T0 + 63 * 60_000))
    expect(han(d, 'S1')).toBe(iso(T0 + 45 * 60_000))
    expect(han(d, 'S4')).toBe(iso(T0 + 45 * 60_000))
    expect(d.sql.prepare("SELECT thoi_gian_phut AS p FROM ca WHERE ma_ca='C1'").get()).toEqual({ p: 45 })
  })
  it('em bị khoá vẫn được cộng (mở khoá sau không thiệt giờ); em đã nộp / chưa vào thì từ chối', async () => {
    const d = dung()
    expect(await goi(d, { maCa: 'C1', sbd: 'S4', phut: 5 })).toMatchObject({ ok: true, themPhutEm: 5 })
    expect(await goi(d, { maCa: 'C1', sbd: 'S3', phut: 5 })).toMatchObject({ ok: false })
    expect(han(d, 'S3')).toBe(iso(T0 + 45 * 60_000))
    expect(await goi(d, { maCa: 'C1', sbd: 'S9', phut: 5 })).toMatchObject({ ok: false })
  })
  it('trần 30 phút mỗi em, tính cả lần trước; phút phải 1–15', async () => {
    const d = dung()
    expect(await goi(d, { maCa: 'C1', sbd: 'S1', phut: 15 })).toMatchObject({ ok: true, themPhutEm: 15 })
    expect(await goi(d, { maCa: 'C1', sbd: 'S1', phut: 10 })).toMatchObject({ ok: true, themPhutEm: 25 })
    const r = await goi(d, { maCa: 'C1', sbd: 'S1', phut: 10 })
    expect(r.ok).toBe(false)
    expect(String(r.error)).toMatch(/25 phút.*30 phút/)
    expect(han(d, 'S1')).toBe(iso(T0 + 70 * 60_000))
    expect(await goi(d, { maCa: 'C1', sbd: 'S1', phut: 16 })).toMatchObject({ ok: false })
    expect(await goi(d, { maCa: 'C1', sbd: 'S1', phut: 0 })).toMatchObject({ ok: false })
  })
  it('phần thầy thêm cho CẢ PHÒNG không tính vào trần riêng của em', async () => {
    const d = dung()
    expect(await goiWorker(worker, d.env, '/ca/them-phut', { maCa: 'C1', phut: 10 }, true)).toMatchObject({ ok: true })
    expect(await goi(d, { maCa: 'C1', sbd: 'S2', phut: 5 })).toMatchObject({ ok: true, themPhutEm: 5 })
    expect(han(d, 'S2')).toBe(iso(T0 + 68 * 60_000))
  })
  it('ca đã đóng ⇒ từ chối; không có mã thầy ⇒ bị chặn', async () => {
    const d = dung()
    d.sql.prepare("UPDATE ca SET trang_thai = 'dong' WHERE ma_ca = 'C1'").run()
    expect(await goi(d, { maCa: 'C1', sbd: 'S2', phut: 5 })).toMatchObject({ ok: false })
    const d2 = dung()
    const r = await goi(d2, { maCa: 'C1', sbd: 'S2', phut: 5 }, false)
    expect(r.ok).not.toBe(true)
    expect(han(d2, 'S2')).toBe(iso(T0 + 53 * 60_000))
  })
})
