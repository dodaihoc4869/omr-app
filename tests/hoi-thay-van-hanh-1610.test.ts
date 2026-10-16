// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { apSchemaHoiThay, kiemDdlHoiThay } from '../scripts/hoi-thay-van-hanh.mjs'
import { SQL_HOI_THAY_KIEM } from '../server/src/hoi-thay-kiem-chung-schema'
import { SQL_HOI_THAY_CAN_GIUP } from '../server/src/hoi-thay-can-giup-schema'

const sqls = [...SQL_HOI_THAY_KIEM, ...SQL_HOI_THAY_CAN_GIUP]
describe('schema Hỏi thầy: cổng trước khi đổi bản sống', () => {
  it('nhận đúng DDL đã dùng ở máy chủ, chạy qua API sau kiểm ca', async () => {
    const query = vi.fn(async () => [{ n: 0 }])
    expect(await apSchemaHoiThay(query, sqls)).toMatchObject({ schemaHoiThay: true, soLenhChiThem: sqls.length })
    expect(query.mock.calls.length).toBe(sqls.length + 1)
    expect(String(query.mock.calls[0][0])).toContain('kiem_tra_ca_nhan_chang')
    expect(query.mock.calls.slice(1).map(x => x[0])).toEqual(sqls)
  })
  it('ca cá nhân đang làm hoặc không đọc được thì không chạy DDL nào', async () => {
    for (const r of [[{ n: 1 }], [], [{ n: 'khong_ro' }]]) {
      const query = vi.fn(async () => r)
      await expect(apSchemaHoiThay(query, sqls)).rejects.toThrow('dừng phát hành')
      expect(query).toHaveBeenCalledTimes(1)
    }
    const query = vi.fn(async () => { throw new Error('D1 unavailable') })
    await expect(apSchemaHoiThay(query, sqls)).rejects.toThrow('D1 unavailable')
    expect(query).toHaveBeenCalledTimes(1)
  })
  it('xét toàn bộ DDL trước query đầu; cấm thay bảng dữ liệu/điểm và chỉ mục sổ học', async () => {
    for (const sql of [
      'DROP TABLE hoi_thay_kiem', 'DELETE FROM hoi_thay_kiem',
      'CREATE TABLE IF NOT EXISTS hoc_sinh (sbd TEXT)',
      'CREATE INDEX IF NOT EXISTS htk_doc ON su_kien_hoc(sbd)',
      'CREATE TABLE IF NOT EXISTS hoi_thay_kiem (id TEXT); DROP TABLE ca',
      'CREATE TABLE IF NOT EXISTS hoi_thay_kiem (id TEXT) -- x',
    ]) {
      const query = vi.fn(async () => [{ n: 0 }])
      await expect(apSchemaHoiThay(query, [...sqls, sql])).rejects.toThrow()
      expect(query).not.toHaveBeenCalled()
    }
    expect(() => kiemDdlHoiThay([])).toThrow()
  })
  it('DDL lỗi dừng ngay, không tiếp tục áp nửa sau và không gọi phát hành', async () => {
    const query = vi.fn(async (sql: string) => { if (sql === sqls[1]) throw new Error('DDL lỗi'); return [{ n: 0 }] })
    await expect(apSchemaHoiThay(query, sqls)).rejects.toThrow('DDL lỗi')
    expect(query).toHaveBeenCalledTimes(3)
  })
})
