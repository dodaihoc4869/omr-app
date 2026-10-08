// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import fixture from './fixtures/khoi-phuc-0810.json'
import { khoiPhucChienDich0810, KHOA_KHOI_PHUC, HANH_TRINH_LUU_TRU } from '../server/src/khoi-phuc-chien-dich-0810'
import { docChienDichKemDaHuyCuaEm } from '../server/src/srs2-d1'
import type { Env } from '../server/src/kieu'
const NOW = Date.parse('2026-10-08T15:30:00Z')
function dung() {
  const d = taoD1That(), env = d.env as unknown as Env
  d.sql.exec('CREATE TABLE hanh_trinh_hop_nhat(chien_dich_cu TEXT PRIMARY KEY,chien_dich_moi TEXT,khoi TEXT,hop_nhat_luc TEXT)')
  d.sql.exec('CREATE TABLE IF NOT EXISTS srs2_ke_hoach_omni(sbd TEXT,ngay TEXT,chien_dich_json TEXT,on_bai_cu_json TEXT,met_gio TEXT,cap_nhat_luc TEXT,PRIMARY KEY(sbd,ngay))')
  for (const c of fixture.campaigns) d.sql.prepare('INSERT INTO chien_dich(id,ten,lop,sbd_json,ma_de_json,qid_json,han_nop,the_luc_ngay,huyet_chien,tao_luc,trang_thai,dong_luc) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').run(c.id,'Bài kiểm thử',c.lop,'["S1"]',c.ma_de_json,'["Q1"]',c.han_nop,c.the_luc_ngay,c.huyet_chien,c.tao_luc,c.trang_thai,c.dong_luc)
  for (const m of fixture.maps) d.sql.prepare('INSERT INTO hanh_trinh_hop_nhat VALUES(?,?,?,?)').run(m.chien_dich_cu,m.chien_dich_moi,m.khoi,m.hop_nhat_luc)
  for (const t of fixture.ticks) d.sql.prepare('INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc,chien_dich_id) VALUES(?,?,?,?,?,?,?,?)').run(t.id,t.lop,t.khoa_bai,'Bài',1,t.ma_to_json,t.tick_luc,t.chien_dich_id)
  d.sql.prepare('INSERT INTO srs2_ke_hoach_omni(sbd,ngay,chien_dich_json,on_bai_cu_json) VALUES(?,?,?,?)').run('S1','2026-10-08',JSON.stringify(HANH_TRINH_LUU_TRU),'["Q1"]')
  d.sql.prepare('INSERT INTO srs2_ke_hoach(sbd,ngay,chien_dich_id,dao_json,doan_json,huyet_chien,tong,tao_luc) VALUES(?,?,?,?,?,?,?,?)').run('S1','2026-10-08',HANH_TRINH_LUU_TRU[0],'["Q1"]','[]',0,1,'2026-10-08T00:00:00Z')
  d.sql.exec("CREATE TABLE lich_su_bao_toan(id TEXT,diem INTEGER); INSERT INTO lich_su_bao_toan VALUES('su_kien',8)")
  return {d,env}
}
describe('khôi phục chiến dịch riêng theo dấu vết thật', () => {
  it('không khôi phục trong ca thi đang mở',async()=>{
    const {d,env}=dung()
    d.sql.exec("INSERT INTO ca(ma_ca,trang_thai,cap_nhat_luc) VALUES('CA','mo','2026-10-08')")
    expect(await khoiPhucChienDich0810(env,NOW)).toBe('cho_het_ca_thi')
    expect(d.sql.prepare("SELECT COUNT(*) AS n FROM chien_dich WHERE trang_thai='dang_chay'").get()).toEqual({n:3})
  })
  it('dừng toàn bộ nếu dữ liệu thay đổi ngay trước batch',async()=>{
    const {d,env}=dung()
    const batch=env.DB.batch.bind(env.DB)
    env.DB.batch=async ds=>{
      d.sql.prepare('UPDATE chien_dich SET the_luc_ngay=25 WHERE id=?').run(fixture.maps[0].chien_dich_cu)
      return batch(ds)
    }
    await expect(khoiPhucChienDich0810(env,NOW)).rejects.toThrow()
    expect(d.sql.prepare("SELECT COUNT(*) AS n FROM chien_dich WHERE trang_thai='dang_chay'").get()).toEqual({n:3})
  })
  it('mở lại đúng 9 chiến dịch, giữ cấu hình, sửa 5 liên kết, không xóa kế hoạch/lịch sử; chạy lại không đổi', async () => {
    const {d,env}=dung()
    const before=d.sql.prepare('SELECT * FROM srs2_ke_hoach').all()
    expect(await khoiPhucChienDich0810(env,NOW)).toBe('vua_khoi_phuc')
    expect(d.sql.prepare("SELECT COUNT(*) AS n FROM chien_dich WHERE trang_thai='dang_chay'").get()).toEqual({n:9})
    expect(d.sql.prepare("SELECT COUNT(*) AS n FROM bai_da_day WHERE chien_dich_id LIKE 'hanh-trinh%'").get()).toEqual({n:0})
    for(const c of fixture.campaigns.filter(c=>!c.id.startsWith('hanh-trinh'))) expect(d.sql.prepare('SELECT han_nop,the_luc_ngay FROM chien_dich WHERE id=?').get(c.id)).toEqual({han_nop:c.han_nop,the_luc_ngay:c.the_luc_ngay})
    expect(d.sql.prepare('SELECT * FROM srs2_ke_hoach').all()).toEqual(before)
    expect(d.sql.prepare('SELECT * FROM lich_su_bao_toan').all()).toEqual([{id:'su_kien',diem:8}])
    expect(d.sql.prepare('SELECT chien_dich_json,on_bai_cu_json FROM srs2_ke_hoach_omni').get()).toEqual({chien_dich_json:'[]',on_bai_cu_json:'["Q1"]'})
    expect((await docChienDichKemDaHuyCuaEm(env,'S1')).daHuy).toEqual([])
    expect(await khoiPhucChienDich0810(env,NOW+60000)).toBe('da_xong')
    expect(d.sql.prepare('SELECT COUNT(*) AS n FROM khoi_phuc_0810_sao_luu').get()).toEqual({n:27})
  })
  it('dừng nếu chiến dịch bị đóng riêng sau lần gộp', async()=>{
    const {d,env}=dung()
    d.sql.prepare('UPDATE chien_dich SET dong_luc=? WHERE id=?').run('2026-10-08T10:00:00Z',fixture.maps[0].chien_dich_cu)
    await expect(khoiPhucChienDich0810(env,NOW)).rejects.toThrow('đã đổi')
    expect(d.sql.prepare('SELECT khoa FROM cau_hinh WHERE khoa=?').get(KHOA_KHOI_PHUC)).toBeUndefined()
  })
  it('dừng nếu có bài mới chưa thuộc các chiến dịch riêng',async()=>{
    const {d,env}=dung()
    d.sql.prepare('UPDATE chien_dich SET qid_json=? WHERE id=?').run('["Q1","Q2"]',HANH_TRINH_LUU_TRU[0])
    await expect(khoiPhucChienDich0810(env,NOW)).rejects.toThrow('Có bài mới')
  })
  it('lỗi giữa batch thì rollback cả cập nhật và bản sao',async()=>{
    const {d,env}=dung()
    d.sql.exec("CREATE TRIGGER chan_khoi_phuc BEFORE UPDATE ON bai_da_day BEGIN SELECT RAISE(ABORT,'kiem_thu'); END")
    await expect(khoiPhucChienDich0810(env,NOW)).rejects.toThrow('kiem_thu')
    expect(d.sql.prepare("SELECT COUNT(*) AS n FROM chien_dich WHERE trang_thai='dang_chay'").get()).toEqual({n:3})
    expect(d.sql.prepare('SELECT khoa FROM cau_hinh WHERE khoa=?').get(KHOA_KHOI_PHUC)).toBeUndefined()
  })
})
