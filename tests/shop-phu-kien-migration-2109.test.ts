// @vitest-environment node
// MIGRATION CỬA HÀNG PHỤ KIỆN (S1): chỉ-thêm, chạy lại được, ràng buộc chống ghi đôi, GIỮ khi reset toàn app, có tệp lùi.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { BANG_GIU, BANG_XOA } from '../server/src/reset-toan-app'
import { taoD1That } from './_d1-that'

const BA_BANG = ['vang_so', 'phu_kien_so_huu', 'phu_kien_dang_mac']
const SQL = readFileSync('server/migration-2109-shop-phu-kien.sql', 'utf8')
const cot = (d: ReturnType<typeof taoD1That>, b: string) => (d.sql.prepare(`PRAGMA table_info(${b})`).all() as { name: string; pk: number; notnull: number }[])

describe('migration shop phụ kiện', () => {
  it('ba bảng có đủ cột và khoá chính đúng hợp đồng', () => {
    const d = taoD1That()
    expect(cot(d, 'vang_so').map((c) => c.name)).toEqual(['id', 'sbd', 'loai', 'so_vang', 'exp_tru', 'ma_mon', 'khoa_yeu_cau', 'luc'])
    expect(cot(d, 'phu_kien_so_huu').map((c) => c.name)).toEqual(['sbd', 'ma_mon', 'mua', 'gia', 'khoa_yeu_cau', 'luc'])
    expect(cot(d, 'phu_kien_so_huu').filter((c) => c.pk).map((c) => c.name)).toEqual(['sbd', 'ma_mon'])
    expect(cot(d, 'phu_kien_dang_mac').map((c) => c.name)).toEqual(['sbd', 'o_gan', 'ma_mon', 'luc'])
    expect(cot(d, 'phu_kien_dang_mac').filter((c) => c.pk).map((c) => c.name)).toEqual(['sbd', 'o_gan'])
    expect((d.sql.prepare("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='phu_kien_so_huu'").all() as { name: string }[]).map((x) => x.name)).toContain('idx_phu_kien_so_huu_mon')
  })
  it('CHỈ THÊM và chạy lại được: chạy tệp lần nữa không lỗi, không mất dòng đã có; không có DROP/ALTER/DELETE/UPDATE trong tệp', () => {
    const d = taoD1That()
    d.sql.prepare("INSERT INTO vang_so(sbd,loai,so_vang,exp_tru,khoa_yeu_cau,luc) VALUES('S1','doi',50,50,'k1','x')").run()
    d.sql.exec(SQL); d.sql.exec(SQL)
    expect(d.sql.prepare('SELECT COUNT(*) n FROM vang_so').get()).toEqual({ n: 1 })
    expect(SQL.replace(/--.*$/gm, '')).not.toMatch(/\b(DROP|ALTER|DELETE|UPDATE|REPLACE)\b/i)
  })
  it('ràng buộc: cùng (em, khoá yêu cầu) không ghi hai lần; loại lạ bị từ chối; một em một món một lần; chỗ đeo lạ bị từ chối; mỗi chỗ đeo một món', () => {
    const d = taoD1That()
    const v = d.sql.prepare("INSERT INTO vang_so(sbd,loai,so_vang,exp_tru,khoa_yeu_cau,luc) VALUES(?,?,?,?,?,'x')")
    v.run('S1', 'doi', 100, 100, 'k1'); v.run('S2', 'doi', 100, 100, 'k1') // khoá giống nhau ở HAI em khác nhau: được
    expect(() => v.run('S1', 'mua', -20, 0, 'k1')).toThrow(/UNIQUE/i)
    expect(() => v.run('S1', 'tang', 5, 0, 'k2')).toThrow(/CHECK/i)
    const h = d.sql.prepare("INSERT INTO phu_kien_so_huu(sbd,ma_mon,mua,gia,khoa_yeu_cau,luc) VALUES('S1','VD-04','m1',120,?,'x')")
    h.run('a'); expect(() => h.run('b')).toThrow(/UNIQUE|PRIMARY/i)
    const m = d.sql.prepare("INSERT OR REPLACE INTO phu_kien_dang_mac(sbd,o_gan,ma_mon,luc) VALUES('S1',?,?,'x')")
    m.run('vet', 'VD-04'); m.run('vet', 'VD-05')
    expect(d.sql.prepare("SELECT ma_mon FROM phu_kien_dang_mac WHERE sbd='S1' AND o_gan='vet'").all()).toEqual([{ ma_mon: 'VD-05' }])
    expect(() => m.run('tay', 'VD-04')).toThrow(/CHECK/i)
  })
  it('vàng và đồ là tài sản em đã kiếm: cả ba bảng GIỮ khi reset toàn app (không nằm trong danh sách XOÁ)', () => {
    for (const b of BA_BANG) { expect(BANG_GIU, b).toContain(b); expect(BANG_XOA, b).not.toContain(b) }
  })
  it('có tệp lùi cho cả ba bảng và chỉ mục, chỉ dùng DROP ... IF EXISTS', () => {
    const lui = readFileSync('server/lui-2109-shop-phu-kien.sql', 'utf8').replace(/--.*$/gm, '')
    for (const b of BA_BANG) expect(lui).toContain(`DROP TABLE IF EXISTS ${b};`)
    expect(lui).toContain('DROP INDEX IF EXISTS idx_phu_kien_so_huu_mon;')
    expect(lui).not.toMatch(/\b(DELETE|UPDATE|INSERT)\b/i)
  })
})
