// @vitest-environment node
// Tệp SQL ghi mốc bảng tin (server/dat-2109-bang-tin-tu.sql + lệnh lùi): đặt ĐÚNG khoá `bang_tin_tu` = 2026-09-21T05:00:00.000Z (12:00 trưa 21/09 giờ VN), chạy lại an toàn, lùi xoá đúng khoá, không đụng khoá khác.
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That, type D1That } from './_d1-that'
import { gio } from './_btvn-nang-do-mau'

afterEach(() => vi.useRealTimers())
const tien = readFileSync('server/dat-2109-bang-tin-tu.sql', 'utf-8')
const lui = readFileSync('server/dat-2109-bang-tin-tu-lui.sql', 'utf-8')
const cauHinh = (d: D1That) => d.sql.prepare('SELECT khoa, gia_tri FROM cau_hinh ORDER BY khoa').all()
const bangTin = (d: D1That) => goiWorker(worker, d.env, '/gv/bang-tin', {}, true)

describe('mốc bảng tin: tệp ghi + lùi', () => {
  it('ghi đúng một khoá 12:00 trưa 21/09 giờ VN; các khoá khác y nguyên; chạy lại không đổi; /gv/bang-tin thấy mốc', async () => {
    gio(new Date('2026-09-21T13:00:00+07:00'))
    const d = taoD1That()
    d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('khoa_khac','giu-nguyen','x')").run()
    d.sql.exec(tien)
    expect(d.sql.prepare("SELECT gia_tri FROM cau_hinh WHERE khoa = 'bang_tin_tu'").get()).toEqual({ gia_tri: '2026-09-21T05:00:00.000Z' })
    expect(cauHinh(d)).toEqual([{ khoa: 'bang_tin_tu', gia_tri: '2026-09-21T05:00:00.000Z' }, { khoa: 'khoa_khac', gia_tri: 'giu-nguyen' }])
    d.sql.exec(tien)
    expect((d.sql.prepare("SELECT COUNT(*) AS n FROM cau_hinh WHERE khoa = 'bang_tin_tu'").get() as { n: number }).n).toBe(1)
    expect(await bangTin(d)).toMatchObject({ ok: true, tuDangAp: true, tu: '2026-09-21T05:00:00.000Z', tuHomNay: '2026-09-21T05:00:00.000Z' })
  })
  it('ghi đè giá trị cũ; lùi xoá ĐÚNG khoá (khoá khác còn) và bảng tin về 00:00 hôm nay', async () => {
    gio(new Date('2026-09-21T13:00:00+07:00'))
    const d = taoD1That()
    d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('bang_tin_tu','2026-01-01T00:00:00.000Z','x'),('khoa_khac','giu-nguyen','x')").run()
    d.sql.exec(tien)
    expect(d.sql.prepare("SELECT gia_tri FROM cau_hinh WHERE khoa = 'bang_tin_tu'").get()).toEqual({ gia_tri: '2026-09-21T05:00:00.000Z' })
    d.sql.exec(lui)
    expect(cauHinh(d)).toEqual([{ khoa: 'khoa_khac', gia_tri: 'giu-nguyen' }])
    expect(await bangTin(d)).toMatchObject({ tuDangAp: false, tuHomNay: '2026-09-20T17:00:00.000Z' })
    d.sql.exec(lui) // lùi lần hai không lỗi
  })
  it('tệp chỉ đụng cau_hinh: không DROP/UPDATE/ALTER; đúng khoá và giá trị; có câu kiểm + lệnh lùi', () => {
    for (const s of [tien, lui]) expect(s.replace(/^--.*$/gm, '').replace(/DO UPDATE SET/g, 'DO UPSERT')).not.toMatch(/\b(DROP|UPDATE|ALTER|TRUNCATE)\b/i) // `ON CONFLICT … DO UPDATE` là cách ghi đè đúng một dòng
    expect(tien).toContain("'bang_tin_tu', '2026-09-21T05:00:00.000Z'")
    expect(tien).toContain('SELECT khoa, gia_tri FROM cau_hinh WHERE khoa = ')
    expect(lui.replace(/^--.*$/gm, '').trim()).toBe("DELETE FROM cau_hinh WHERE khoa = 'bang_tin_tu';")
  })
})
