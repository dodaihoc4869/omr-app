// @vitest-environment node
import { DatabaseSync } from 'node:sqlite'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { SQL_KT_CN } from '../server/src/kiem-tra-ca-nhan-schema'
import { chay, MOT_NGAY_MS } from '../scripts/doi-han-ktcn-2710.mjs'
import { ktDangKhoaChang, laNgayKt, tomTatKt } from '../server/src/kiem-tra-ca-nhan'
import { dauNgayKt } from '../server/src/kiem-tra-ca-nhan-loi'

const DE = JSON.stringify({ phienBan: 3, lyDo: 'lich', bai: [], muc: [], cau: [], soPhu: 0, phut: 50, thieu: [], chang: [{ qids: [], giay: 600 }] })
function moDb() {
  const db = new DatabaseSync(':memory:')
  for (const s of SQL_KT_CN) db.exec(s)
  db.exec(`CREATE TABLE ca (ma_ca TEXT PRIMARY KEY, trang_thai TEXT)`)
  const query = async (sql: string) => {
    const st = db.prepare(sql)
    return /^\s*(SELECT|WITH)/i.test(sql) ? (st.all() as Record<string, unknown>[]) : (st.run(), [])
  }
  const sau = Date.now() + 3_600_000
  const them = (sbd: string, ngay: string, o: { nop?: number; tt?: string; rev?: number } = {}) => {
    const id = `ktcn:${sbd}:${ngay}`
    db.prepare(`INSERT INTO kiem_tra_ca_nhan(id,sbd,lop,ngay,mo_luc,han_luc,trang_thai,json,revision,nop_luc,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,?,?,?,?)`)
      .run(id, sbd, '12A', ngay, sau - 86_400_000, sau, o.tt ?? 'hen', DE, o.rev ?? 0, o.nop ?? null, 1)
    db.prepare(`INSERT INTO kiem_tra_ca_nhan_meta(id,meta_json) VALUES(?,?)`).run(id, '{"tong":0}')
    return id
  }
  return { db, query, them, sau }
}
const banSaoPath = () => join(mkdtempSync(join(tmpdir(), 'dh-')), 'truoc.json')

describe('27/10 thầy duyệt «Dời sang tối mai»: dời bài kiểm tra ôn tập 27/10 chưa làm sang 28/10', () => {
  it('chỉ dời bài chưa bắt đầu, chưa nộp; không đụng bài đã nộp / đang làm dở / chờ nguồn / em đã có bài 28/10', async () => {
    const { db, query, them, sau } = moDb()
    them('1', '2026-10-27')
    them('2', '2026-10-27')
    them('3', '2026-10-27', { nop: 5 })
    const lamDo = them('4', '2026-10-27')
    db.prepare(`INSERT INTO kiem_tra_ca_nhan_chang(bai_id,stt,bat_dau,han) VALUES(?,0,1,?)`).run(lamDo, sau)
    them('5', '2026-10-27', { tt: 'cho_nguon' })
    them('6', '2026-10-27'); them('6', '2026-10-28')
    them('7', '2026-10-26')
    const p = banSaoPath()
    const dem = await chay({ query, ghi: false, banSaoPath: p, log: () => {} })
    expect(dem).toEqual({ ghi: false, seDoi: 2 })
    expect(db.prepare(`SELECT COUNT(*) n FROM kiem_tra_ca_nhan WHERE ngay='2026-10-28'`).get()).toEqual({ n: 1 })
    const bs = JSON.parse(readFileSync(p, 'utf8'))
    expect(bs.dong.map((r: { ma: string }) => r.ma)).toEqual(['ktcn:1:2026-10-27', 'ktcn:2:2026-10-27'])
    expect(Object.keys(bs.dong[0]).sort()).toEqual(['cap_nhat_luc', 'han_luc', 'ma', 'mo_luc', 'ngay', 'trang_thai'])

    expect(await chay({ query, ghi: true, banSaoPath: banSaoPath(), log: () => {} })).toEqual({ ghi: true, daDoi: 2 })
    const r1 = db.prepare(`SELECT * FROM kiem_tra_ca_nhan WHERE sbd='1'`).all() as Record<string, number | string>[]
    expect(r1).toHaveLength(1)
    expect(r1[0]).toMatchObject({ id: 'ktcn:1:2026-10-28', ngay: '2026-10-28', han_luc: sau + MOT_NGAY_MS, mo_luc: sau, trang_thai: 'hen' })
    expect(db.prepare(`SELECT COUNT(*) n FROM kiem_tra_ca_nhan_meta WHERE id IN('ktcn:1:2026-10-28','ktcn:2:2026-10-28')`).get()).toEqual({ n: 2 })
    expect(db.prepare(`SELECT COUNT(*) n FROM kiem_tra_ca_nhan_meta WHERE id IN('ktcn:1:2026-10-27','ktcn:2:2026-10-27')`).get()).toEqual({ n: 0 })
    for (const sbd of ['3', '4', '5', '6']) expect(db.prepare(`SELECT ngay,han_luc FROM kiem_tra_ca_nhan WHERE sbd=? AND id LIKE '%2026-10-27'`).get(sbd)).toMatchObject({ ngay: '2026-10-27', han_luc: sau })
    // Chạy lại: không còn gì trong phạm vi.
    expect(await chay({ query, ghi: true, banSaoPath: banSaoPath(), log: () => {} })).toEqual({ ghi: false, seDoi: 0 })
  })
  it('có ca thi mở ⇒ phạm vi rỗng, không ghi gì', async () => {
    const { db, query, them } = moDb()
    them('1', '2026-10-27')
    db.exec(`INSERT INTO ca VALUES('C1','mo')`)
    expect(await chay({ query, ghi: true, banSaoPath: banSaoPath(), log: () => {} })).toEqual({ ghi: false, seDoi: 0 })
    expect(db.prepare(`SELECT ngay FROM kiem_tra_ca_nhan WHERE sbd='1'`).get()).toEqual({ ngay: '2026-10-27' })
  })
  it('bài đã dời: tối 27/10 không «Đã lỡ»; ngày 28/10 là bài hôm nay cần làm và khoá chặng tới khi làm (#485)', () => {
    const r = { id: 'ktcn:1:2026-10-28', sbd: '1', ngay: '2026-10-28', mo_luc: dauNgayKt('2026-10-28'), han_luc: dauNgayKt('2026-10-29'), trang_thai: 'hen', json: DE, tra_json: '{}', nop_luc: null, diem: null }
    const toi27 = dauNgayKt('2026-10-27') + 21 * 3_600_000
    expect(tomTatKt(r, toi27).trangThai).toBe('sap_den')
    expect(ktDangKhoaChang(r, toi27)).toBeNull()
    const ngay28 = dauNgayKt('2026-10-28') + 19 * 3_600_000
    expect(laNgayKt(r, ngay28)).toBe(true)
    expect(tomTatKt(r, ngay28)).toMatchObject({ trangThai: 'can_lam', homNay: true, ngay: '2026-10-28' })
    expect(ktDangKhoaChang(r, ngay28)).not.toBeNull()
    expect(tomTatKt(r, dauNgayKt('2026-10-29') + 1).trangThai).toBe('het_han')
  })
})
