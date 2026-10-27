// @vitest-environment node
import { DatabaseSync } from 'node:sqlite'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { CHU_BAO_TRI_KT, laKtBaoTriBo, sqlKhongBaoTriBo } from '../server/src/kiem-tra-ca-nhan'
import { SQL_DS_BAO_TRI } from '../server/src/ngay-bao-tri'
import { dauNgayKt } from '../server/src/kiem-tra-ca-nhan-loi'

const han27 = dauNgayKt('2026-10-28')
const sau00 = han27 + 60_000
const truoc00 = han27 - 3_600_000
const bai = (o: Record<string, unknown> = {}) => ({ id: 'ktcn:1:2026-10-27', ngay: '2026-10-27', han_luc: han27, nop_luc: null, trang_thai: 'hen', ...o })

describe('Boss 27/10 («Tối nay các em không phải làm»): bài kiểm tra cá nhân ngày bảo trì chưa nộp không bị «Đã lỡ»', () => {
  it('nhận đúng bài ngày bảo trì quá hạn chưa nộp; trước hạn / đã nộp / ngày khác / chờ nguồn thì không', () => {
    expect(laKtBaoTriBo(bai(), sau00)).toBe(true)
    expect(laKtBaoTriBo(bai(), truoc00)).toBe(false)
    expect(laKtBaoTriBo(bai({ nop_luc: han27 - 5 }), sau00)).toBe(false)
    expect(laKtBaoTriBo(bai({ ngay: '2026-10-26', han_luc: dauNgayKt('2026-10-27') }), sau00)).toBe(false)
    expect(laKtBaoTriBo(bai({ trang_thai: 'cho_nguon' }), sau00)).toBe(false)
    expect(laKtBaoTriBo(null, sau00)).toBe(false)
    expect(CHU_BAO_TRI_KT).not.toMatch(/lỡ/i)
  })
  it('SQL loại bài: chỉ ẩn bài ngày bảo trì quá hạn chưa nộp, giữ mọi bài khác (không xoá dữ liệu)', () => {
    const db = new DatabaseSync(':memory:')
    db.exec('CREATE TABLE kiem_tra_ca_nhan (id TEXT PRIMARY KEY, ngay TEXT, han_luc INTEGER, nop_luc INTEGER)')
    const them = db.prepare('INSERT INTO kiem_tra_ca_nhan VALUES (?,?,?,?)')
    them.run('do-27', '2026-10-27', han27, null)
    them.run('nop-27', '2026-10-27', han27, han27 - 10)
    them.run('lo-26', '2026-10-26', dauNgayKt('2026-10-27'), null)
    them.run('mai-28', '2026-10-28', dauNgayKt('2026-10-29'), null)
    const ids = (now: number) => (db.prepare(`SELECT id FROM kiem_tra_ca_nhan k WHERE ${sqlKhongBaoTriBo('k', now)} ORDER BY id`).all() as { id: string }[]).map((r) => r.id)
    expect(ids(sau00)).toEqual(['lo-26', 'mai-28', 'nop-27'])
    expect(ids(truoc00)).toEqual(['do-27', 'lo-26', 'mai-28', 'nop-27'])
    expect(db.prepare('SELECT COUNT(*) n FROM kiem_tra_ca_nhan').get()).toEqual({ n: 4 })
    expect(SQL_DS_BAO_TRI).toBe("'2026-10-27'")
  })
  it('máy chủ: cron không chốt «hết hạn» bài ngày bảo trì; lệnh em sau hạn báo không phải làm; lịch thầy, bài hằng ngày, câu bảo vệ đều loại bài này', () => {
    const kt = readFileSync('server/src/kiem-tra-ca-nhan.ts', 'utf8')
    expect(kt).toMatch(/nop_luc IS NULL AND han_luc<=\? AND han_luc>\? AND ngay NOT IN\(\$\{SQL_DS_BAO_TRI\}\)\)/)
    expect(kt.match(/if ?\(laKtBaoTriBo\(r,now\)\) ?throw new Error\(CHU_BAO_TRI_KT\)/g)?.length).toBe(2)
    expect(readFileSync('server/src/kiem-tra-ca-nhan-thay.ts', 'utf8')).toContain("${sqlKhongBaoTriBo('k',now)}")
    expect(readFileSync('server/src/bai-hang-ngay.ts', 'utf8')).toContain("${kt.sqlKhongBaoTriBo('k',Date.now())}")
    expect(readFileSync('server/src/ai-ddh.ts', 'utf8')).toContain("${sqlKhongBaoTriBo('k', Date.now())}")
  })
})
