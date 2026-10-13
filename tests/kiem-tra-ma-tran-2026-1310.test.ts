// @vitest-environment node
import { expect,it } from 'vitest'
import { MA_TRAN_HOA_2026 } from '../src/lib/ma-tran-hoa-2026'
import { KHUNG_KT_2026,chonChuKyKt2026,nhomKienThucKt,type CauMaTranKt } from '../server/src/kiem-tra-ca-nhan-ma-tran'
import type { MucKt } from '../server/src/kiem-tra-ca-nhan-loi'
const bai:MucKt[]=Array.from({length:6},(_,i)=>({id:`bai:${i}`,bai:String(i),tenBai:`Bài ${i}`,kyNang:'',mucDo:'',loai:'bai'}))
const kn=(n:number):MucKt[]=>Array.from({length:n},(_,i)=>({id:`kn:${i}`,bai:'0',tenBai:'Bài 0',kyNang:String(i),mucDo:'',loai:'ky_nang'}))
function pool(nKn:number,soBan=2){
 const ra:CauMaTranKt[]=[]
 for(const phan of ['I','II','III'] as const)for(const mucDo of ['biet','hieu','van_dung'] as const)for(let j=0;j<KHUNG_KT_2026[phan][mucDo]*soBan;j++){
  const i=ra.length;ra.push({qid:`q${i}`,group:`g${i}`,phan,mucDo,muc:[`bai:${i%6}`,`kn:${2*i%nKn}`,`kn:${(2*i+1)%nKn}`].filter((v,j,a)=>a.indexOf(v)===j),phut:1,hopLe:true,daGap:false})
 }return ra
}
const dem=(ids:string[],qs:CauMaTranKt[])=>Object.fromEntries((['I','II','III']as const).map(p=>[p,Object.fromEntries((['biet','hieu','van_dung']as const).map(m=>[m,ids.filter(id=>qs.some(q=>q.qid===id&&q.phan===p&&q.mucDo===m)).length]))]))
it('đúng khung đang phân tích trong app, không tự chế tỉ lệ mức độ',()=>{
 expect(KHUNG_KT_2026).toEqual({I:MA_TRAN_HOA_2026.I,II:MA_TRAN_HOA_2026.II,III:MA_TRAN_HOA_2026.III})
})
it('một đề đã phủ đủ thì chỉ 28 câu/50 phút, đủ 6 bài và đúng từng ô ma trận',()=>{
 const qs=pool(1),r=chonChuKyKt2026([...bai,...kn(1)],qs,new Map(),'S1')
 expect(r).toMatchObject({du:true,tongMuc:7,phu:7,chuaPhu:[]});expect(r.de).toHaveLength(1)
 expect(r.de[0]!.qids).toHaveLength(28);expect(r.de[0]!.phut).toBe(50);expect(dem(r.de[0]!.qids,qs)).toEqual(KHUNG_KT_2026)
})
it('phủ chưa đủ trong đề đầu thì 2 đề đúng ma trận, phủ đủ kiến thức toàn cục, không nhân cùng nền theo bài/mức',()=>{
 const qs=pool(60),r=chonChuKyKt2026([...bai,...kn(60)],qs,new Map(),'S2')
 expect(r).toMatchObject({du:true,tongMuc:66,phu:66,chuaPhu:[]});expect(r.de).toHaveLength(2)
 for(const d of r.de){expect(d.qids).toHaveLength(28);expect(d.phut).toBe(50);expect(dem(d.qids,qs)).toEqual(KHUNG_KT_2026)}
})
it('hàng trăm kỹ năng không thể phủ trong 2 đề thì báo phần còn thiếu, tuyệt đối không sinh 333 câu hoặc báo 100%',()=>{
 const qs=pool(200),r=chonChuKyKt2026([...bai,...kn(200)],qs,new Map(),'S3')
 expect(r.du).toBe(false);expect(r.chuaPhu.length).toBeGreaterThan(0)
 expect(r.de).toHaveLength(2);expect(r.de.every(d=>d.qids.length===28&&d.phut===50)).toBe(true)
})
it('thiếu câu ở ô đúng/sai Vận dụng không lấy câu khác mức/phần bù, vẫn giữ mẫu số kiến thức',()=>{
 const qs=pool(1).filter(q=>!(q.phan==='II'&&q.mucDo==='van_dung')),r=chonChuKyKt2026([...bai,...kn(1)],qs,new Map(),'S4')
 expect(r.du).toBe(false);expect(r.thieuMaTran).toEqual([{o:'II:van_dung',can:1,co:0}]);expect(r.tongMuc).toBe(7)
})

it('phủ kiến thức dùng nhánh cơ chế trong từ vựng thật; nền tính một lần; lá thao tác vẫn có ánh xạ đầy đủ',()=>{
 const a:MucKt={id:'a',bai:'B1',tenBai:'Ester',kyNang:'dang:ESTER.THUY_PHAN_BASE.TINH_KHOI_LUONG',mucDo:'VD'},b:MucKt={...a,id:'b',bai:'B2',kyNang:'dang:ESTER.THUY_PHAN_BASE.TINH_THE_TICH'},nen:MucKt={...a,id:'n',kyNang:'nen:mol'},la:MucKt={...a,id:'l',kyNang:'dang:TU_NGHI.CO_CHE.VIEC'}
 const r=nhomKienThucKt([a,b,nen,la],[],new Map())
 expect(r.muc.map(m=>m.id)).toEqual(['kien_thuc:ESTER.THUY_PHAN_BASE','n','l'])
 expect(r.anhXa.size).toBe(4);expect(r.muc[0]!.baiLienQuan).toEqual(['B1','B2'])
})

it('150 kiến thức cần ba đề thì lập đúng ba đề, mỗi đề 28 câu/50 phút, không thêm đề thứ tư',()=>{
 const qs=pool(150,3),r=chonChuKyKt2026([...bai,...kn(150)],qs,new Map(),'S5')
 expect(r.du).toBe(true);expect(r.de).toHaveLength(3)
 for(const d of r.de){expect(d.qids).toHaveLength(28);expect(dem(d.qids,qs)).toEqual(KHUNG_KT_2026)}
 expect(chonChuKyKt2026([...bai,...kn(200)],pool(200,4),new Map(),'S6').de.length).toBeLessThanOrEqual(3)
})
