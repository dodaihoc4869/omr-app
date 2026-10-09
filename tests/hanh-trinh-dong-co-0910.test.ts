// @vitest-environment node
import { describe,expect,it } from 'vitest'
import { quanSatDocLap,chuoiSaiKyNang,type QuanSatHanhTrinh } from '../server/src/hanh-trinh-quan-sat'
import { fitHalfLife,halfLife,henHalfLife,xacSuatNho } from '../server/src/half-life'
import { dungDoThi,thieuTienQuyet,canhDangHoc } from '../server/src/do-thi-tien-quyet'
import { chonBandit } from '../server/src/bandit'
import { doCanThiep,phanBoCanThiep,dongCoHanhTrinh,SQL_DONG_CO_HANH_TRINH } from '../server/src/hanh-trinh-dong-co'
import type { QCau,SuKienOmni } from '../server/src/omni-kieu'
import { phatLaiEm } from '../server/src/omni-p-vkn'
import { taoKhoOmni,lam,T_SANG,HOM_NAY,themChienDich } from './omni-3-ke-hoach-chung'
import { docHoSo2,layKeHoachHomNay } from '../server/src/srs2-d1'
import { dongBoBaHanhTrinh } from '../server/src/hanh-trinh-hop-nhat'
const DAY=86400000
const cau=(id='q',mucDo='NB',kn=['dang:a']):QCau=>({qid:id,phan:'I',maDang:'a',mucDo,vkn:kn,nguon:'thay'})
const event=(i:number,extra:Partial<SuKienOmni>={}):SuKienOmni=>({khoa:`e${i}`,sbd:'S',qid:`q${i}`,songSinh:false,nguon:'game',ketQua:1,luc:new Date(T_SANG+i*DAY).toISOString(),ngayVn:new Date(T_SANG+i*DAY).toISOString().slice(0,10),receivedAt:T_SANG+i*DAY,assistance:'none',purpose:'maintenance',phan:'I',maDang:'a',mucDo:'NB',...extra})
const obs=(i:number,dung=true,extra:Partial<QuanSatHanhTrinh>={}):QuanSatHanhTrinh=>({id:`e${i}`,qid:`q${i}`,nhom:`g${i}`,luc:T_SANG+i*DAY,ngay:new Date(T_SANG+i*DAY).toISOString().slice(0,10),dung,kn:['dang:a'],laY:false,mucDo:'NB',ms:30000,...extra})
function rng(seed=8){let x=seed;return()=>{x=(1664525*x+1013904223)>>>0;return (x+0.5)/4294967296}}
describe('Động cơ Hành trình: bằng chứng, trí nhớ, tiên quyết, can thiệp',()=>{
  it('lọc hỗ trợ, đọc lời giải 12 giờ, sai của bản trùng không được đúng lại cùng ngày',()=>{
    const es=[event(0,{ketQua:0,contentGroup:'g'}),event(0,{khoa:'e1',qid:'copy',ketQua:1,contentGroup:'g',receivedAt:T_SANG+1000}),event(1,{purpose:'xem_loi_giai',ketQua:null}),event(1,{khoa:'e9',receivedAt:T_SANG+DAY+1000}),event(2,{assistance:'assisted'}),event(3,{tuTin:'chua_chac'}),event(4,{sbd:'OTHER'}),event(5,{purpose:'shadow'})]
    const q=new Map(es.map(e=>[e.qid,cau(e.qid)]))
    expect(quanSatDocLap('S',es,q,T_SANG+10*DAY).map(o=>[o.qid,o.dung])).toEqual([['q0',false]])
    expect(quanSatDocLap('S',es.slice().reverse(),q,T_SANG+10*DAY)).toEqual(quanSatDocLap('S',es,q,T_SANG+10*DAY))
  })
  it('half-life đáp ứng đường quên, từng em có tốc độ riêng, dữ liệu ít giữ FSRS',()=>{
    expect(xacSuatNho(5,5)).toBeCloseTo(0.5)
    const fast=fitHalfLife(Array.from({length:30},(_,i)=>obs(i,true)))
    const slow=fitHalfLife(Array.from({length:30},(_,i)=>obs(i,i%3===0)))
    expect(halfLife(fast,'dang:a')).toBeGreaterThan(halfLife(slow,'dang:a'))
    expect(henHalfLife(fitHalfLife([obs(0)]),['dang:a'])).toBeNull()
    expect(henHalfLife(fast,['unknown'])).toBeNull()
    expect(fast.kyNang['dang:a'].nDo).toBe(26)
    expect(fast.kyNang['dang:a'].loss).toBeGreaterThan(0)
  })
  it('không nhận hai ý cùng kỹ năng là hai ngày luyện; sai một ý không lấy ý đầu đúng làm toàn câu đúng',()=>{
    const m=fitHalfLife([obs(0,true),obs(0,false,{id:'e0|1'})])
    expect(m.kyNang['dang:a']).toMatchObject({n:1,dung:0,sai:1})
  })
  it('L1 mở, L3 cần SPRT của cả L1/L2 và mọi nền; hiểu một bài không mở kỹ năng bài khác',()=>{
    const qs=Array.from({length:10},(_,i)=>obs(i,true,{kn:['dang:a','nen:mol']}))
    const hs=phatLaiEm('S',{suKien:[],q:new Map(),homNay:HOM_NAY})
    hs.vkn['nen:mol']={vkn:'nen:mol',p:0.95,nTuLam:10,nCau:10,nNgay:10,nTroiChay:0,nCauLaDung:0,diemSprt:3,trangThai:'vung',ngayCuoi:HOM_NAY,dayLai:false}
    const g=dungDoThi(qs,T_SANG+30*DAY)
    expect(thieuTienQuyet(cau('q','VD',['dang:a','nen:mol']),3,g,hs)).toEqual(['dang:a'])
    expect(thieuTienQuyet(cau('q','NB'),1,g,hs)).toEqual([])
    for(let i=10;i<20;i++) qs.push(obs(i,true,{mucDo:'TH',kn:['dang:a','nen:mol']}))
    expect(thieuTienQuyet(cau('q','VD',['dang:a','nen:mol']),3,dungDoThi(qs,T_SANG+30*DAY),hs)).toEqual([])
    expect(thieuTienQuyet(cau('q','VD',['dang:b']),3,dungDoThi(qs,T_SANG+30*DAY),hs)).toEqual(['dang:b'])
    hs.vkn['nen:mol'].dayLai=true
    expect(thieuTienQuyet(cau('q','VD',['dang:a','nen:mol']),3,g,hs)).toContain('nen:mol')
  })
  it('kẹt là sai liên tiếp cùng kỹ năng trên các câu khác nhau; tự làm đúng thì hết kẹt',()=>{
    expect(chuoiSaiKyNang([obs(0,false),obs(1,false)]).get('dang:a')).toBe(2)
    expect(chuoiSaiKyNang([obs(0,false),obs(1,false),obs(2,true)]).get('dang:a')).toBe(0)
    expect(chuoiSaiKyNang([obs(0,true),obs(0,false,{id:'e0|1'})]).get('dang:a')).toBe(1)
  })
  it('cạnh mềm cần đủ hai cohort, tự rút khi tương quan mất; không có chu trình nền ↔ nền',()=>{
    const c={tu:'nen:mol',den:'dang:a',nCo:100,dungCo:95,nChua:100,dungChua:30,soEm:30}
    expect(canhDangHoc([c])).toHaveLength(1)
    expect(canhDangHoc([{...c,soEm:2}])).toEqual([])
    expect(canhDangHoc([{...c,dungChua:95}])).toEqual([])
    expect(canhDangHoc([{...c,den:'nen:mass'}])).toEqual([])
  })
  it('Thompson sampling khám phá cả hai nhánh, ưu tiên nhánh tốt theo ngữ cảnh và chỉ chọn học liệu có thật',()=>{
    const stats=[{context:'C',cach:'on_nen' as const,dung:100,sai:2},{context:'C',cach:'vi_du_de' as const,dung:2,sai:100}]
    expect(chonBandit('C',['on_nen','vi_du_de'],stats,rng())?.cach).toBe('on_nen')
    expect(chonBandit('C',['vi_du_de'],stats,rng())).toEqual({cach:'vi_du_de',xacSuat:1})
    expect(chonBandit('C',[],stats,rng())).toBeNull()
    const choices=new Set(Array.from({length:12},(_,i)=>chonBandit('NEW',['on_nen','vi_du_de'],stats,rng(i+1))!.cach))
    expect(choices.size).toBe(2)
    expect(chonBandit('C',['on_nen','vi_du_de'],stats,rng())!.xacSuat).toBeGreaterThan(0)
  })
  it('can thiệp phải được làm, kiểm mới sau 24 giờ; không thưởng lời đề nghị, chính câu/nhóm cũ hoặc không có lượt kiểm',()=>{
    const r={qid:'q0',nhom:'g0',ky_nang:'dang:a',goi_luc:T_SANG-1}
    expect(doCanThiep(r,[]).ketQua).toBeNull()
    expect(doCanThiep(r,[obs(0),obs(0,true,{qid:'q9',nhom:'g9',luc:T_SANG+1000})]).ketQua).toBeNull()
    expect(doCanThiep(r,[obs(0),obs(1,true,{nhom:'g0'})]).ketQua).toBeNull()
    expect(doCanThiep(r,[obs(-1,true,{nhom:'g1'}),obs(0),obs(1,true)]).ketQua).toBeNull()
    expect(doCanThiep(r,[obs(0),obs(1,false)])).toEqual({dungLuc:T_SANG,doLuc:T_SANG+DAY,ketQua:0,receipt:`g1|${T_SANG+DAY}`})
  })
  it('một lượt kiểm chỉ thưởng một can thiệp; bốn ý cùng kỹ năng không nhân mẫu và cần đúng toàn bộ',()=>{
    const rs=[{qid:'q0',nhom:'g0',ky_nang:'dang:a',goi_luc:T_SANG-1,ngay:'d',moc:0},{qid:'q0',nhom:'g0',ky_nang:'dang:a',goi_luc:T_SANG-2,ngay:'d',moc:6}]
    const qs=[obs(0),obs(1,true),obs(1,false,{id:'e1|1'})],first=new Map([['g0',T_SANG],['g1',T_SANG+DAY]])
    const out=phanBoCanThiep(rs,qs,first)
    expect(out.filter(x=>x.d.doLuc!==null)).toHaveLength(1)
    expect(out.find(x=>x.d.doLuc!==null)!.d.ketQua).toBe(0)
    expect(phanBoCanThiep(rs,qs,first,new Set([`g1|${T_SANG+DAY}`])).every(x=>x.d.doLuc===null)).toBe(true)
    expect(doCanThiep(rs[0],qs,new Map([['g0',T_SANG],['g1',T_SANG+1000]])).doLuc).toBeNull()
  })
  it('D1 thật: ba máy ghi bộ đệm/dự báo, không chạm sổ/điểm; đọc lại không nhân mẫu cạnh',async()=>{
    const k=taoKhoOmni({'DH-B0':0,'DH-B1':40,'DH-B2':0,'DH-B3':0,'KHO-A':0})
    const rows=k.d.sql.prepare('SELECT qid,json FROM game_v2_question').all() as {qid:string;json:string}[]
    for(const r of rows) k.d.sql.prepare('UPDATE game_v2_question SET json=? WHERE qid=?').run(JSON.stringify({...JSON.parse(r.json),mucDo:'NB'}),r.qid)
    themChienDich(k.d,{id:'nguon',sbd:['S1'],maDe:['DH-B1'],qids:k.qids('DH-B1'),taoLuc:'2026-10-01T02:00:00Z',hanNop:'2026-10-09'})
    await dongBoBaHanhTrinh(k.env,T_SANG)
    await lam(k.env,'S1','DH-B1-0',T_SANG-DAY,false,{assistance:'none',purpose:'maintenance'})
    const before=k.d.sql.prepare('SELECT * FROM su_kien_hoc').all()
    const hs=await docHoSo2(k.env,'S1',HOM_NAY)
    const engine=await dongCoHanhTrinh(k.env,'S1',T_SANG,hs)
    expect(engine.soQuanSat).toBe(1)
    expect(k.d.sql.prepare('SELECT * FROM su_kien_hoc').all()).toEqual(before)
    expect(k.d.sql.prepare('SELECT COUNT(*) n FROM omni_du_bao').get()).toEqual({n:1})
    const first=k.d.sql.prepare('SELECT * FROM hanh_trinh_v4_canh ORDER BY tu,den').all()
    await dongCoHanhTrinh(k.env,'S1',T_SANG,hs)
    expect(k.d.sql.prepare('SELECT * FROM hanh_trinh_v4_canh ORDER BY tu,den').all()).toEqual(first)
    const kh=await layKeHoachHomNay(k.env,'S1',T_SANG)
    expect(kh.kh.tong).toBe(24)
    k.d.sql.exec("INSERT INTO ca(ma_ca,trang_thai,cap_nhat_luc) VALUES('open','mo','x')")
    const old=k.d.sql.prepare('SELECT mo_hinh_json,cap_nhat_luc FROM hanh_trinh_v4_em').get()
    await dongCoHanhTrinh(k.env,'S1',T_SANG+1000,hs)
    expect(k.d.sql.prepare('SELECT mo_hinh_json,cap_nhat_luc FROM hanh_trinh_v4_em').get()).toEqual(old)
    k.d.sql.close()
  })
  it('schema chỉ thêm, receipt một lần cho mỗi chặng',()=>{
    expect(SQL_DONG_CO_HANH_TRINH.every(s=>s.startsWith('CREATE'))).toBe(true)
    expect(SQL_DONG_CO_HANH_TRINH.join(' ')).toContain('PRIMARY KEY(sbd,ngay,moc)')
  })
})
