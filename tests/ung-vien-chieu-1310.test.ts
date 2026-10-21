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
 // 21/10: em hợp lệ (kể cả chưa có số đo) có một lần trong bảng `em` để máy thầy chia tầng — không bịa khả năng; em khoá không có.
 expect(Object.keys(r.em)).toEqual(['S3'])
 k.d.sql.exec("UPDATE hoc_sinh SET lop='12A2' WHERE sbd='S3'")
 expect((await ungVienChieu(k.env,{qids:['DH-B0-0'],sbd:['S3'],lop:'12A1'})).cau['DH-B0-0']).toEqual([])
})
it('21/10 phân tầng: kèm số lần sai câu, số lần lên bảng 14 ngày, lần lên bảng gần nhất, mức độ câu — chung một đợt đọc',async()=>{
 const k=kho()
 await lam(k.env,'S1','DH-B0-0',T,false,{cauVersion:'v1',assistance:'none'})
 await lam(k.env,'S1','DH-B0-0',T+1000,false,{cauVersion:'v1',assistance:'none'})
 const gan=new Date(Date.now()-3*86400000).toISOString(),xa=new Date(Date.now()-30*86400000).toISOString()
 for(const luc of [gan,gan,xa])k.d.sql.prepare('INSERT INTO len_bang(sbd,chuyen_de,qid,dat,luc) VALUES(?,?,?,?,?)').run('S2','x','DH-B0-0',1,luc)
 k.d.sql.exec("CREATE TABLE IF NOT EXISTS cau_meta(ma_de TEXT NOT NULL,qid TEXT NOT NULL,thu_tu INTEGER NOT NULL,version,muc_do,PRIMARY KEY(ma_de,qid))")
 k.d.sql.exec("INSERT INTO cau_meta(ma_de,qid,thu_tu,muc_do) VALUES('DH-B0','DH-B0-0',0,'biet')")
 const r=await ungVienChieu(k.env,{qids:['DH-B0-0'],sbd:['S1','S2']})
 expect(r.soSai).toEqual({'DH-B0-0':{S1:2}})
 expect(r.em.S1).toMatchObject({soLan14:0,lanCuoiLenBang:null})
 expect(r.em.S2).toMatchObject({soLan14:2,lanCuoiLenBang:gan})
 // trường theo em KHÔNG lặp ở từng dòng câu × em (gói nhỏ)
 expect(JSON.stringify(r.cau)).not.toMatch(/soLan14|lanCuoiLenBang|soSai/)
 expect(r.mucDo).toEqual({'DH-B0-0':'biet'})
})
it('21/10: câu không có kỹ năng ⇒ không dòng nào (không lấp 0,3); câu có kỹ năng ⇒ mọi dòng có p đo được',async()=>{
 const k=kho()
 const r=await ungVienChieu(k.env,{qids:['DH-B0-0','DH-B0-1'],sbd:['S1','S2','S3','S4']})
 expect(r.cau['DH-B0-1']).toEqual([])
 expect(r.cau['DH-B0-0'].every(e=>e.p!==null)).toBe(true)
})
