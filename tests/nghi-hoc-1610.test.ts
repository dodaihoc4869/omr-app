// @vitest-environment node
import { describe, it, expect } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That } from './_d1-that'
import { docDanhSachEm } from '../server/src/bai-hang-ngay'
import { SQL_GOI7 } from '../server/src/goi-bai-7-schema'
import { sqlEmDangNhan7 } from '../server/src/goi-bai-7-quyen'

function them(d: ReturnType<typeof taoD1That>, sbd: string, trangThai = '', chiDanhSach = false) {
  d.sql.prepare("INSERT INTO danh_sach(sbd,ho_ten,nam_sinh,lop,cap_nhat_luc) VALUES(?,'Học sinh thử','2010','11','x')").run(sbd)
  if (!chiDanhSach) d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,nam_sinh,lop,mat_khau,token,trang_thai,cap_nhat_luc) VALUES(?,'Học sinh thử','2010','11','mk','tk',?,'x')").run(sbd, trangThai)
}
const nghi = (d: ReturnType<typeof taoD1That>, sbd: string) => goiWorker(worker,d.env,'/gv/nghi-hoc',{sbd},true)

describe('Nghỉ học một chiều, D1 SQLite chạy câu SQL thật', () => {
  it('lưu bền, hồ sơ và danh sách hiện trạng thái; không mất tài khoản, điểm hay lịch sử', async () => {
    const d=taoD1That(); them(d,'11035'); them(d,'12129');
    d.sql.exec("INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,trang_thai,cap_nhat_luc,tong,nop_luc) VALUES('luot-cu','ca-cu','11035',1,'x','da_nop','x',8.25,'2026-10-10')")
    const truoc=d.sql.prepare('SELECT * FROM luot').all()
    expect(await nghi(d,'11035')).toMatchObject({ok:true,sbd:'11035',daNghi:true,trangThai:'da_nghi'})
    expect(d.sql.prepare('SELECT trang_thai,mat_khau,token FROM hoc_sinh WHERE sbd=?').get('11035')).toMatchObject({trang_thai:'da_nghi',mat_khau:'mk',token:'tk'})
    expect(d.sql.prepare('SELECT * FROM luot').all()).toEqual(truoc)
    expect(d.sql.prepare('SELECT trang_thai FROM hoc_sinh WHERE sbd=?').get('12129')).toMatchObject({trang_thai:''})
    const hoSo=await goiWorker(worker,d.env,'/gv/em-toan-canh',{sbd:'11035'},true)
    expect(hoSo.em.trangThai).toBe('da_nghi')
    expect((await goiWorker(worker,d.env,'/goi',{action:'hoSoEm',sbd:'11035'},true)).em.trangThai).toBe('da_nghi')
    expect((await goiWorker(worker,d.env,'/goi',{action:'listStudents'},true)).items.find((x:{sbd:string})=>x.sbd==='11035').trangThai).toBe('da_nghi')
    expect(await nghi(d,'11035')).toMatchObject({ok:true,daNghi:true})
  })
  it('em chỉ có trong danh sách lớp vẫn được đánh dấu và giữ đúng tên', async()=>{
    const d=taoD1That(); them(d,'11072','',true)
    expect(await nghi(d,'11072')).toMatchObject({ok:true,daNghi:true})
    expect(d.sql.prepare('SELECT ho_ten,trang_thai FROM hoc_sinh WHERE sbd=?').get('11072')).toMatchObject({ho_ten:'Học sinh thử',trang_thai:'da_nghi'})
  })
  it('em chỉ có tài khoản đăng ký vẫn được đánh dấu', async()=>{
    const d=taoD1That();them(d,'10046','da_duyet');d.sql.prepare('DELETE FROM danh_sach WHERE sbd=?').run('10046')
    expect(await nghi(d,'10046')).toMatchObject({ok:true,daNghi:true})
  })
  it('từ chối SBD không tồn tại, thiếu SBD, không tạo hồ sơ rác', async()=>{
    const d=taoD1That()
    expect(await nghi(d,'999999')).toMatchObject({ok:false,error:'Không tìm thấy học sinh'})
    expect(await nghi(d,'')).toMatchObject({ok:false,error:'Thiếu số báo danh'})
    expect(d.sql.prepare('SELECT count(*) n FROM hoc_sinh').get()).toMatchObject({n:0})
  })
  it('không đổi trạng thái khóa, không hỗ trợ đi học lại vô tình mở quyền', async()=>{
    const d=taoD1That();them(d,'S1','khoa');them(d,'S2','da_nghi')
    expect(await nghi(d,'S1')).toMatchObject({ok:false})
    expect(await goiWorker(worker,d.env,'/gv/nghi-hoc',{sbd:'S2',nghi:false},true)).toMatchObject({ok:false})
    expect(d.sql.prepare('SELECT trang_thai FROM hoc_sinh ORDER BY sbd').all()).toEqual([{trang_thai:'khoa'},{trang_thai:'da_nghi'}])
  })
  it('cả đường mới và lệnh tương thích đều cần quyền thầy', async()=>{
    const d=taoD1That();them(d,'S1')
    expect(await goiWorker(worker,d.env,'/gv/nghi-hoc',{sbd:'S1'})).toMatchObject({ok:false})
    expect(await goiWorker(worker,d.env,'/goi',{action:'danhDauNghiHoc',sbd:'S1'})).toMatchObject({ok:false})
    expect(await goiWorker(worker,d.env,'/goi',{action:'danhDauNghiHoc',sbd:'S1'},true)).toMatchObject({ok:true,daNghi:true})
  })
  it('loại trạng thái nghỉ khỏi danh sách chăm sóc và nhận bài, không lọc theo tên', async()=>{
    const d=taoD1That();them(d,'11004','da_nghi');them(d,'11053');them(d,'11035','da_nghi');them(d,'12129')
    d.sql.exec("INSERT INTO chien_dich(id,ten,ma_de_json,qid_json,han_nop,tao_luc,trang_thai,sbd_json) VALUES('hanh-trinh-v3-khoi-11','Thử','[]','[]','2026-10-24','x','dang_chay','[\"11004\",\"11053\",\"11035\",\"12129\"]')")
    const ds=await docDanhSachEm(d.env,[])
    expect(ds?.map(e=>e.sbd).sort()).toEqual(['11053','12129'])
    for(const sql of SQL_GOI7) d.sql.exec(sql)
    d.sql.exec("INSERT INTO goi_bai_7(id,tick_id,lop,khoa_bai,ten,bat_dau,han,tao_luc) VALUES('g1','t1','11','b1','Bài thử','2026-10-18','2026-10-24','x'); INSERT INTO goi_bai_7_em(goi_id,sbd,bat_dau,han) SELECT 'g1',sbd,'2026-10-18','2026-10-24' FROM hoc_sinh")
    const nhan=d.sql.prepare(`SELECT e.sbd FROM goi_bai_7_em e JOIN goi_bai_7 g ON g.id=e.goi_id JOIN hoc_sinh h ON h.sbd=e.sbd WHERE ${sqlEmDangNhan7('e','g','h')} ORDER BY e.sbd`).all()
    expect(nhan).toEqual([{sbd:'11053'},{sbd:'12129'}])
  })
})
