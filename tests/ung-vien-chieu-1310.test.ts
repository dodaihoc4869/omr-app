// @vitest-environment node
import { expect, it } from 'vitest'
import { taoKhoOmni, lam } from './omni-3-ke-hoach-chung'
import { ungVienChieu } from '../server/src/ung-vien-chieu'

const T=Date.parse('2026-10-13T02:00:00Z')
function kho(){
 const k=taoKhoOmni({'DH-B0':2},4)
 k.d.sql.exec(`INSERT INTO omni_q(qid,y,vkn_json,nguon,duyet_luc) VALUES('DH-B0-0',-1,'["nen:a","dang:b"]','thay','x')`)
 for(const [sbd,p] of [['S1',0.5],['S2',0.98],['S3',0.8],['S4',0.7]] as const)for(const kn of ['nen:a','dang:b'])k.d.sql.prepare("INSERT INTO omni_p_vkn(sbd,vkn_id,p,n_tu_lam,n_ngay,trang_thai,phien_ban,cap_nhat_luc) VALUES(?,?,?,3,2,'vung','v1','x')").run(sbd,kn,p)
 return k
}
it('bằng chứng tự làm đúng đúng phiên bản đứng trước dự đoán giỏi hơn; không có đáp án trong API',async()=>{
 const k=kho();await lam(k.env,'S1','DH-B0-0',T,true,{cauVersion:'v1',assistance:'none'})
 const r=await ungVienChieu(k.env,{qids:['DH-B0-0'],sbd:['S1','S2']})
 expect(r.cau['DH-B0-0']).toMatchObject([{sbd:'S1',loai:'da_dung'},{sbd:'S2',loai:'du_bao',p:0.98}])
 expect(JSON.stringify(r)).not.toMatch(/correct|solution|answer/)
})
it('lần độc lập mới nhất sai, phiên bản cũ, trợ giúp và xem chữa gần đây đều không được gắn nhãn đã đúng',async()=>{
 const k=kho()
 await lam(k.env,'S1','DH-B0-0',T,true,{cauVersion:'v1',assistance:'none'})
 await lam(k.env,'S1','DH-B0-0',T+1000,false,{cauVersion:'v1',assistance:'none'})
 await lam(k.env,'S2','DH-B0-0',T,true,{cauVersion:'v0',assistance:'none'})
 await lam(k.env,'S3','DH-B0-0',T,true,{cauVersion:'v1',assistance:'hint'})
 k.d.sql.prepare('INSERT INTO loi_giai_hoi(sbd,qid,luc) VALUES(?,?,?)').run('S4','DH-B0-0',new Date(T-1000).toISOString())
 await lam(k.env,'S4','DH-B0-0',T,true,{cauVersion:'v1',assistance:'none'})
 const r=await ungVienChieu(k.env,{qids:['DH-B0-0'],sbd:['S1','S2','S3','S4']})
 expect(r.cau['DH-B0-0'].every(e=>e.loai==='du_bao')).toBe(true)
 expect(r.cau['DH-B0-0'][0]?.sbd).toBe('S2')
})
it('chỉ chọn trong danh sách, bỏ tài khoản khoá, không bịa khả năng khi chưa có kỹ năng',async()=>{
 const k=kho();k.d.sql.exec("UPDATE hoc_sinh SET trang_thai='khoa' WHERE sbd='S2'")
 const r=await ungVienChieu(k.env,{qids:['DH-B0-0','DH-B0-1'],sbd:['S2','S3']})
 expect(r.cau['DH-B0-0'].map(e=>e.sbd)).toEqual(['S3'])
 expect(r.cau['DH-B0-1']).toEqual([])
 k.d.sql.exec("UPDATE hoc_sinh SET lop='12A2' WHERE sbd='S3'")
 expect((await ungVienChieu(k.env,{qids:['DH-B0-0'],sbd:['S3'],lop:'12A1'})).cau['DH-B0-0']).toEqual([])
})
