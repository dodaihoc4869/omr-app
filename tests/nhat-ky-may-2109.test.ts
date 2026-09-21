// @vitest-environment node
// NHẬT KÝ LỖI CỦA MÁY (B11): `ghiLoiMay` không bao giờ ném lỗi, chống trùng 30 phút mỗi nguồn, giữ ≤ 500 dòng, câu đơn giản; móc vào cron; bảng lưu không bị reset xoá; migration chỉ-thêm.
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { chuLoiMay, ghiLoiMay, TEN_NGUON_NHAT_KY } from '../server/src/nhat-ky-may'
import { taoD1That, type D1That } from './_d1-that'
import { gio } from './_btvn-nang-do-mau'

afterEach(() => vi.useRealTimers())
const NAY = Date.parse('2026-09-21T13:00:00+07:00')
const dong = (d: D1That) => d.sql.prepare('SELECT nguon, luc, muc, chu FROM nhat_ky_may ORDER BY id').all() as { nguon: string; luc: string; muc: string; chu: string }[]

describe('ghiLoiMay', () => {
  it('ghi một dòng với câu đơn giản cho thầy; không chứa chi tiết kỹ thuật; mọi nguồn có tên bằng lời', async () => {
    const d = taoD1That()
    expect(await ghiLoiMay(d.env, 'nhac_nop_bai', NAY)).toBe(true)
    expect(dong(d)).toEqual([{ nguon: 'nhac_nop_bai', luc: new Date(NAY).toISOString(), muc: 'loi', chu: 'Nhắc nộp bài lỗi, A.I Đỗ Đại Học sẽ thử lại' }])
    expect(Object.keys(TEN_NGUON_NHAT_KY).sort()).toEqual(['exp_ngay', 'gui_thong_bao', 'ke_hoach_ngay', 'nhac_nop_bai', 'tin_phu_huynh'])
    for (const n of Object.keys(TEN_NGUON_NHAT_KY)) expect(chuLoiMay(n)).toMatch(/ lỗi, A.I Đỗ Đại Học sẽ thử lại$/)
    expect(chuLoiMay('nguon_la')).toBe('Một việc của máy lỗi, A.I Đỗ Đại Học sẽ thử lại')
  })
  it('CHỐNG TRÙNG: cùng nguồn trong 30 phút (kể cả đúng 30 phút) không ghi thêm; quá 30 phút ghi; nguồn khác độc lập', async () => {
    const d = taoD1That()
    expect(await ghiLoiMay(d.env, 'nhac_nop_bai', NAY)).toBe(true)
    expect(await ghiLoiMay(d.env, 'nhac_nop_bai', NAY + 29 * 60_000 + 59_000)).toBe(false)
    expect(await ghiLoiMay(d.env, 'nhac_nop_bai', NAY + 30 * 60_000)).toBe(false) // đúng 30 phút vẫn là trùng
    expect(await ghiLoiMay(d.env, 'ke_hoach_ngay', NAY + 60_000)).toBe(true)
    expect(await ghiLoiMay(d.env, 'nhac_nop_bai', NAY + 30 * 60_000 + 1)).toBe(true)
    expect(dong(d).map((x) => x.nguon)).toEqual(['nhac_nop_bai', 'ke_hoach_ngay', 'nhac_nop_bai'])
  })
  it('giữ ≤ 500 dòng MỚI NHẤT (xoá dòng cũ nhất)', async () => {
    const d = taoD1That()
    for (let i = 0; i < 507; i++) expect(await ghiLoiMay(d.env, 'gui_thong_bao', NAY + i * 31 * 60_000)).toBe(true)
    const r = dong(d)
    expect(r).toHaveLength(500)
    expect(r[r.length - 1]!.luc).toBe(new Date(NAY + 506 * 31 * 60_000).toISOString()) // dòng mới nhất còn
    expect(r[0]!.luc).toBe(new Date(NAY + 7 * 31 * 60_000).toISOString()) // 7 dòng cũ nhất đã bị xoá
  })
  it('KHÔNG BAO GIỜ ném lỗi: thiếu bảng (chưa chạy migration) ⇒ false; D1 hỏng ⇒ false', async () => {
    const d = taoD1That()
    d.sql.exec('DROP TABLE nhat_ky_may')
    expect(await ghiLoiMay(d.env, 'nhac_nop_bai', NAY)).toBe(false)
    const hong = { DB: { prepare: () => { throw new Error('D1 hỏng') } } } as never
    expect(await ghiLoiMay(hong, 'nhac_nop_bai', NAY)).toBe(false)
  })
})

describe('móc vào cron', () => {
  it('nhắc nộp bài lỗi (lyDo = loi) ⇒ ghi nhật ký MỘT dòng; các phút sau trong 30 phút không ghi thêm', async () => {
    gio(new Date(NAY))
    const d = taoD1That()
    d.sql.exec('DROP TABLE btvn') // nhắc nộp bài đọc bài ⇒ ném lỗi bên trong, nhacTuDong trả lyDo = loi (gửi thông báo cũng đọc bài ⇒ lỗi riêng)
    await worker.scheduled({ cron: '* * * * *' }, d.env)
    const nguon = () => dong(d).map((x) => x.nguon).sort()
    expect(nguon()).toEqual(['gui_thong_bao', 'nhac_nop_bai'])
    gio(new Date(NAY + 60_000))
    await worker.scheduled({ cron: '* * * * *' }, d.env)
    expect(nguon()).toEqual(['gui_thong_bao', 'nhac_nop_bai']) // không ghi thêm trong 30 phút
  })
  it('lượt cron chạy bình thường ⇒ KHÔNG ghi dòng nào', async () => {
    gio(new Date(NAY))
    const d = taoD1That()
    await worker.scheduled({ cron: '* * * * *' }, d.env)
    expect(dong(d)).toEqual([])
  })
  it('tệp index.ts móc ghi lỗi ở cả năm việc nền (kế hoạch ngày, chốt điểm ngày, tin phụ huynh + vinh danh, nhắc nộp bài, gửi thông báo)', () => {
    const ma = readFileSync('server/src/index.ts', 'utf-8')
    for (const n of ['ke_hoach_ngay', 'exp_ngay', 'tin_phu_huynh', 'nhac_nop_bai', 'gui_thong_bao']) expect(ma, n).toContain(`ghiLoiMay(env,'${n}')`)
  })
})

describe('bảng + migration', () => {
  it('migration chỉ THÊM bảng và chỉ mục (không DROP/ALTER/UPDATE/DELETE); nạp cùng schema không lỗi', () => {
    const m = readFileSync('server/migration-2109-nhat-ky-may.sql', 'utf-8').replace(/^--.*$/gm, '')
    expect(m).not.toMatch(/\b(DROP|ALTER|UPDATE|DELETE|INSERT)\b/i)
    expect(m).toMatch(/CREATE TABLE IF NOT EXISTS nhat_ky_may/)
    const d = taoD1That()
    expect((d.sql.prepare('PRAGMA table_info(nhat_ky_may)').all() as { name: string }[]).map((c) => c.name)).toEqual(['id', 'luc', 'nguon', 'muc', 'chu'])
  })
  it('reset toàn app GIỮ bảng nhật ký máy', async () => {
    const { BANG_GIU, BANG_XOA } = await import('../server/src/reset-toan-app')
    expect(BANG_GIU).toContain('nhat_ky_may')
    expect(BANG_XOA).not.toContain('nhat_ky_may')
  })
})
