// @vitest-environment node
// ĐỔI SỐ BÁO DANH (thầy 05/10: Đỗ Duy Phong 100042 → 10048): mọi bảng, mọi cột chữ; ô đúng bằng và ô chứa SBD như số riêng;
// chạy thử chỉ đếm; từ chối khi SBD mới đã có dữ liệu / đang có ca mở / không phải thầy.
import { describe, expect, it } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That } from './_d1-that'
import type { Env } from '../server/src/kieu'
import { thayTrongChuoi } from '../server/src/doi-sbd'

function dung() {
  const d = taoD1That()
  const env = d.env as unknown as Env
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('100042','Phong','10','x'),('10042','Trường','10','x')")
  d.sql.exec("INSERT INTO danh_sach(sbd,ho_ten,nam_sinh,lop,cap_nhat_luc) VALUES('100042','Phong','2011','10','x'),('10042','Trường','2011','10','x')")
  const sk = d.sql.prepare('INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn) VALUES(?,?,?,?,?,1,1,?,?)')
  sk.run('153169|100042|Q1', '100042', 'Q1', 'thi', '153169', '2026-10-01T03:00:00.000Z', '2026-10-01')
  sk.run('153169|10042|Q1', '10042', 'Q1', 'thi', '153169', '2026-10-01T03:00:00.000Z', '2026-10-01')
  sk.run('X|1000420|Q2', '1000420', 'Q2', 'thi', 'X', '2026-10-01T03:00:00.000Z', '2026-10-01') // dính chữ số ⇒ không đụng
  d.sql.prepare("INSERT INTO ca (ma_ca, ten_ca, trang_thai, thoi_gian_phut, loai, cong_bo, nguong_lan, nguong_giay, bo_theo_em_json, cap_nhat_luc) VALUES ('153169','Ca','dong',45,'thi','ngay',3,30,?,'x')")
    .run(JSON.stringify({ bo: { '100042': ['Q1'], '10042': ['Q1'] } }))
  return { d, env }
}

describe('/gv/doi-sbd', () => {
  it('thay số riêng, không đụng số dính chữ số', () => {
    expect(thayTrongChuoi('153169|100042|1', '100042', '10048')).toBe('153169|10048|1')
    expect(thayTrongChuoi('{"100042":1,"1000420":2,"2100042":3}', '100042', '10048')).toBe('{"10048":1,"1000420":2,"2100042":3}')
  })
  it('chạy thử chỉ đếm; chạy thật đổi đủ mọi chỗ, em khác giữ nguyên', async () => {
    const { d, env } = dung()
    const g = (b: Record<string, unknown>, thay = true) => goiWorker(worker, env, '/gv/doi-sbd', b, thay)
    expect((await g({ cu: '100042', moi: '10048' }, false)).ok).toBe(false)
    const thu = await g({ cu: '100042', moi: '10048' })
    expect(thu).toMatchObject({ ok: true, chayThu: true })
    expect(d.sql.prepare("SELECT COUNT(*) AS n FROM hoc_sinh WHERE sbd = '100042'").get()).toEqual({ n: 1 }) // chưa đổi
    const bang = Object.fromEntries((thu.bang as { bang: string; cot: string; dung: number; nhung: number }[]).map((x) => [`${x.bang}.${x.cot}`, [x.dung, x.nhung]]))
    expect(bang['hoc_sinh.sbd']).toEqual([1, 0])
    expect(bang['danh_sach.sbd']).toEqual([1, 0])
    expect(bang['su_kien_hoc.sbd']).toEqual([1, 0])
    expect(bang['su_kien_hoc.khoa']).toEqual([0, 1])
    expect(bang['ca.bo_theo_em_json']).toEqual([0, 1])
    const that = await g({ cu: '100042', moi: '10048', chayThat: true })
    expect(that).toMatchObject({ ok: true, chayThu: false, soO: 5 })
    expect(d.sql.prepare("SELECT sbd, ho_ten FROM danh_sach ORDER BY sbd").all()).toEqual([{ sbd: '10042', ho_ten: 'Trường' }, { sbd: '10048', ho_ten: 'Phong' }])
    expect(d.sql.prepare('SELECT khoa FROM su_kien_hoc ORDER BY khoa').all().map((x) => (x as { khoa: string }).khoa)).toEqual(['153169|10042|Q1', '153169|10048|Q1', 'X|1000420|Q2'])
    expect(JSON.parse((d.sql.prepare("SELECT bo_theo_em_json AS j FROM ca").get() as { j: string }).j)).toEqual({ bo: { '10048': ['Q1'], '10042': ['Q1'] } })
    // không còn dấu SBD cũ ⇒ chạy lại: không còn gì để đổi
    expect((await g({ cu: '100042', moi: '10049' })).bang).toEqual([])
  })
  it('liệt kê cột; làm từng cột một: chỉ đổi đúng cột đó; cột lạ ⇒ từ chối', async () => {
    const { d, env } = dung()
    const g = (b: Record<string, unknown>) => goiWorker(worker, env, '/gv/doi-sbd', b, true)
    const ds = (await g({ cu: '100042', moi: '10048', lietKeCot: true })).cot as string[]
    expect(ds).toContain('su_kien_hoc.khoa')
    expect(ds).toContain('hoc_sinh.sbd')
    const r = await g({ cu: '100042', moi: '10048', cot: 'su_kien_hoc.khoa', chayThat: true })
    expect(r).toMatchObject({ ok: true, soO: 1, bang: [{ bang: 'su_kien_hoc', cot: 'khoa', dung: 0, nhung: 1 }] })
    expect(d.sql.prepare("SELECT sbd FROM su_kien_hoc WHERE khoa = '153169|10048|Q1'").get()).toEqual({ sbd: '100042' }) // cột khác chưa đổi
    expect((await g({ cu: '100042', moi: '10048', cot: 'khong_co.x' })).ok).toBe(false)
  })
  it('SBD mới đã có dữ liệu ⇒ từ chối, không ghi gì; đang có ca mở ⇒ từ chối', async () => {
    const { d, env } = dung()
    const r = await goiWorker(worker, env, '/gv/doi-sbd', { cu: '100042', moi: '10042', chayThat: true }, true)
    expect(r.ok).toBe(false)
    expect(r.vuong).toContain('hoc_sinh.sbd')
    expect(d.sql.prepare("SELECT COUNT(*) AS n FROM hoc_sinh WHERE sbd = '100042'").get()).toEqual({ n: 1 })
    d.sql.exec("UPDATE ca SET trang_thai = 'mo'")
    expect((await goiWorker(worker, env, '/gv/doi-sbd', { cu: '100042', moi: '10048', chayThat: true }, true)).error).toMatch(/ca thi mở/)
    expect((await goiWorker(worker, env, '/gv/doi-sbd', { cu: '100042', moi: 'abc' }, true)).ok).toBe(false)
  })
})
