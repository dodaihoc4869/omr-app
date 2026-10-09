// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest'
import { dongBoBaHanhTrinh, idHanhTrinh, KHOA_HANH_TRINH, ungVienHanhTrinh } from '../server/src/hanh-trinh-hop-nhat'
import { layKeHoachHomNay, sanh2, xoaDemChienDich } from '../server/src/srs2-d1'
import { taoKhoOmni, themChienDich, lam, T_SANG, HOM_NAY } from './omni-3-ke-hoach-chung'

const kho = (soCau = 100) => {
  const k = taoKhoOmni({ 'DH-B0': 0, 'DH-B1': soCau, 'DH-B2': 0, 'DH-B3': 0, 'KHO-A': 0 })
  const rows = k.d.sql.prepare('SELECT qid,json FROM game_v2_question').all() as { qid: string; json: string }[]
  for (const r of rows) k.d.sql.prepare('UPDATE game_v2_question SET json=? WHERE qid=?').run(JSON.stringify({ ...JSON.parse(r.json), mucDo: 'NB' }), r.qid)
  themChienDich(k.d, { id: 'nguon', maDe: ['DH-B1'], qids: k.qids('DH-B1'), sbd: ['S1','S2'], taoLuc: '2026-10-01T02:00:00Z', hanNop: '2026-10-09' })
  return k
}
afterEach(() => xoaDemChienDich())
describe('Hành trình 3 khối: gộp, tự nhận kho mới, chốt ngày', () => {
  it('quét nhiều trang không bỏ câu; ứng viên mỗi em có giới hạn và xoay khác nhau', async () => {
    const k=kho(600)
    await dongBoBaHanhTrinh(k.env,T_SANG)
    const r=k.d.sql.prepare('SELECT qid_json FROM chien_dich WHERE id=?').get(idHanhTrinh(12)) as {qid_json:string}
    const qids=JSON.parse(r.qid_json) as string[]
    expect(qids).toHaveLength(600)
    const a=await ungVienHanhTrinh(k.env,idHanhTrinh(12),'S1',HOM_NAY,qids)
    const b=await ungVienHanhTrinh(k.env,idHanhTrinh(12),'S2',HOM_NAY,qids)
    expect(a).toHaveLength(96)
    expect(b).toHaveLength(96)
    expect(a).not.toEqual(b)
    k.d.sql.close()
  })
  it('tạo đúng ba hành trình, sao lưu nguồn, giữ sổ học; chạy lại an toàn', async () => {
    const k = kho()
    await lam(k.env, 'S1', 'DH-B1-0', T_SANG - 86400000, false)
    const before = k.d.sql.prepare('SELECT COUNT(*) n FROM su_kien_hoc').get() as {n:number}
    const old = k.d.sql.prepare("SELECT * FROM chien_dich WHERE id='nguon'").get()
    expect(await dongBoBaHanhTrinh(k.env, T_SANG)).toMatchObject({ trangThai: 'vua_hop_nhat', soChienDich: 1 })
    expect(k.d.sql.prepare("SELECT COUNT(*) n FROM chien_dich WHERE trang_thai='dang_chay'").get()).toEqual({n:3})
    expect(k.d.sql.prepare('SELECT COUNT(*) n FROM su_kien_hoc').get()).toEqual(before)
    const backup = k.d.sql.prepare("SELECT noi_dung_json FROM hanh_trinh_v3_nguon WHERE id='nguon'").get() as {noi_dung_json:string}
    expect(JSON.parse(backup.noi_dung_json)).toEqual(old)
    expect(await dongBoBaHanhTrinh(k.env, T_SANG + 1000)).toMatchObject({trangThai:'da_cap_nhat'})
    expect(k.d.sql.prepare('SELECT COUNT(*) n FROM hanh_trinh_v3_nguon').get()).toEqual({n:1})
    expect(k.d.sql.prepare("SELECT gia_tri FROM cau_hinh WHERE khoa=?").get(KHOA_HANH_TRINH)).toBeTruthy()
    k.d.sql.close()
  })
  it('ca đang mở ⇒ không gộp hoặc bật cờ', async () => {
    const k = kho()
    k.d.sql.prepare("INSERT INTO ca(ma_ca,trang_thai,cap_nhat_luc) VALUES('ca-mo','mo','x')").run()
    expect(await dongBoBaHanhTrinh(k.env, T_SANG)).toEqual({trangThai:'cho_het_ca'})
    expect(k.d.sql.prepare("SELECT COUNT(*) n FROM chien_dich WHERE trang_thai='dang_chay'").get()).toEqual({n:1})
    expect(k.d.sql.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa=?').get(KHOA_HANH_TRINH)).toBeUndefined()
    k.d.sql.close()
  })
  it('học sinh nguồn chưa rõ khối ⇒ giữ nguyên nguồn, không gộp một phần', async () => {
    const k=kho()
    k.d.sql.prepare("UPDATE hoc_sinh SET lop='',ten_lop='' WHERE sbd='S2'").run()
    await expect(dongBoBaHanhTrinh(k.env,T_SANG)).rejects.toThrow('chưa xác định được khối')
    expect(k.d.sql.prepare("SELECT COUNT(*) n FROM chien_dich WHERE trang_thai='dang_chay'").get()).toEqual({n:1})
    expect(k.d.sql.prepare('SELECT COUNT(*) n FROM hanh_trinh_v3_nguon').get()).toEqual({n:0})
    expect(k.d.sql.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa=?').get(KHOA_HANH_TRINH)).toBeUndefined()
    k.d.sql.close()
  })
  it('học sinh đã khoá giữ lịch sử nguồn nhưng không được nhận câu hành trình', async () => {
    const k=kho()
    k.d.sql.prepare("UPDATE hoc_sinh SET trang_thai='khoa' WHERE sbd='S2'").run()
    await dongBoBaHanhTrinh(k.env,T_SANG)
    const r=k.d.sql.prepare('SELECT sbd_json FROM chien_dich WHERE id=?').get(idHanhTrinh(12)) as {sbd_json:string}
    expect(JSON.parse(r.sbd_json)).toContain('S1')
    expect(JSON.parse(r.sbd_json)).not.toContain('S2')
    const old=k.d.sql.prepare("SELECT noi_dung_json FROM hanh_trinh_v3_nguon WHERE id='nguon'").get() as {noi_dung_json:string}
    expect(JSON.parse(old.noi_dung_json).sbd_json).toBe('["S1","S2"]')
    k.d.sql.close()
  })
  it('đủ 24 câu, tầng giữ trong ngày, chỉ chọn lại sau chặng; không lặp đã làm', async () => {
    const k = kho()
    await dongBoBaHanhTrinh(k.env, T_SANG)
    const first = await layKeHoachHomNay(k.env, 'S1', T_SANG)
    expect(first.kh.chienDichId).toBe(idHanhTrinh(12))
    expect(first.kh.hanhTrinh).toMatchObject({tang:1,toiThieu:24,daXep:24,conThieu:0})
    for (const q of first.kh.dao.slice(0, 5)) await lam(k.env, 'S1', q, T_SANG + 60_000, true)
    const five = await layKeHoachHomNay(k.env, 'S1', T_SANG + 120_000)
    expect(five.kh.dao).toEqual(first.kh.dao)
    expect(five.kh.hanhTrinh).toMatchObject({daLam:5,changHienTai:1,cauTrongChang:1})
    await lam(k.env, 'S1', first.kh.dao[5]!, T_SANG + 150_000, true)
    const six = await layKeHoachHomNay(k.env, 'S1', T_SANG + 180_000)
    expect(six.kh.hanhTrinh).toMatchObject({tang:1,toiThieu:24,daLam:6,changHienTai:2})
    expect(six.kh.conDao).toHaveLength(18)
    expect(six.kh.conDao.some(q => first.kh.dao.slice(0,6).includes(q))).toBe(false)
    expect(new Set([...six.kh.dao,...six.kh.doan]).size).toBe(24)
    const s = await sanh2(k.env, 'S1', T_SANG + 200_000)
    expect(s.hanhTrinh).toMatchObject({toiThieu:24,daLam:6})
    k.d.sql.close()
  })
  it('đồng thời hai máy ⇒ một kế hoạch và một sàn; không nhân số câu', async () => {
    const k = kho(); await dongBoBaHanhTrinh(k.env, T_SANG)
    const [a,b] = await Promise.all([layKeHoachHomNay(k.env,'S1',T_SANG),layKeHoachHomNay(k.env,'S1',T_SANG)])
    expect(a.kh).toEqual(b.kh)
    expect(a.kh.tong).toBe(24)
    expect(k.d.sql.prepare('SELECT COUNT(*) n FROM hanh_trinh_v3_ngay WHERE sbd=? AND ngay=?').get('S1',HOM_NAY)).toEqual({n:1})
    k.d.sql.close()
  })
  it('kho bổ sung tự nhận vào đúng khối, loại tự luận', async () => {
    const k = kho(); await dongBoBaHanhTrinh(k.env,T_SANG)
    const src = k.d.sql.prepare("SELECT * FROM game_v2_question WHERE qid='DH-B1-1'").get() as Record<string,unknown>
    k.d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
      .run('DH-11-B1','DH-11-B1-moi','v1','moi','d',JSON.stringify({...JSON.parse(String(src.json)),qid:'DH-11-B1-moi',maDe:'DH-11-B1',mucDo:'NB'}))
    k.d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S11','Em 11','11A1','x')").run()
    await dongBoBaHanhTrinh(k.env,T_SANG+6*60_000)
    const cd = k.d.sql.prepare('SELECT qid_json,sbd_json FROM chien_dich WHERE id=?').get(idHanhTrinh(11)) as {qid_json:string;sbd_json:string}
    expect(JSON.parse(cd.qid_json)).toEqual(['DH-11-B1-moi'])
    expect(JSON.parse(cd.sbd_json)).toEqual(['S11'])
    const q12 = k.d.sql.prepare('SELECT qid_json FROM chien_dich WHERE id=?').get(idHanhTrinh(12)) as {qid_json:string}
    expect(JSON.parse(q12.qid_json)).not.toContain('DH-B1-TL')
    expect(JSON.parse(q12.qid_json)).not.toContain('DH-11-B1-moi')
    k.d.sql.close()
  })
})
