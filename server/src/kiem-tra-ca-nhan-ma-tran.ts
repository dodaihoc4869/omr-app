// Khung Hóa 2026 trong app: 18 TN · 4 ĐS · 6 TLN, 50 phút.
// Mức độ do app phân tích 4 đề 2026; không gọi là ma trận chính thức của Bộ.
import { bamKt, type BangChungKt, type MucKt, type UngKt } from './kiem-tra-ca-nhan-loi'
import { CO_CHE, VIEC } from '../../src/lib/tu-vung-dang'
export const KHUNG_KT_2026 = { I: { biet: 11, hieu: 4, van_dung: 3 }, II: { biet: 0, hieu: 3, van_dung: 1 }, III: { biet: 1, hieu: 2, van_dung: 3 } } as const
export interface CauMaTranKt extends UngKt { phan: 'I'|'II'|'III'; mucDo: 'biet'|'hieu'|'van_dung' }
const oCau = (q: CauMaTranKt) => `${q.phan}:${q.mucDo}`
const khung = Object.entries(KHUNG_KT_2026).flatMap(([phan, muc]) => Object.entries(muc).filter(([,n])=>n>0).map(([m,n])=>({o:`${phan}:${m}`,n})))

/** Cây thật trong kho: chương → cơ chế kiến thức → thao tác. Sổ vi kỹ năng giữ riêng toàn bộ lá. */
export function nhomKienThucKt(muc:readonly MucKt[],cau:readonly CauMaTranKt[],hs:ReadonlyMap<string,BangChungKt>){
  const anhXa=new Map<string,string>(),ms=new Map<string,MucKt>(),bc=new Map<string,BangChungKt>()
  for(const m of muc){
    const ma=m.kyNang.replace(/^dang:/,'').split('#')[0]!,[chuong,coChe,viec]=ma.split('.')
    const nhom=m.loai!=='bai'&&chuong&&coChe&&viec&&CO_CHE[chuong]?.[coChe]&&VIEC[viec]?`${chuong}.${coChe}`:null
    const id=nhom?`kien_thuc:${nhom}`:m.id,cu=ms.get(id),bais=[...new Set([...(cu?.baiLienQuan??[]),...(m.baiLienQuan??[m.bai])])]
    anhXa.set(m.id,id);ms.set(id,{...m,id,kyNang:nhom??m.kyNang,baiLienQuan:bais})
    const b=hs.get(m.id),tr=bc.get(id)
    if(b)bc.set(id,tr?{p:Math.min(tr.p,b.p),vung:tr.vung&&b.vung,n:Math.min(tr.n,b.n),ngayCuoi:[tr.ngayCuoi,b.ngayCuoi].filter((s):s is string=>!!s).sort()[0]??null}:b)
  }
  return {muc:[...ms.values()],cau:cau.map(q=>({...q,muc:[...new Set(q.muc.map(id=>anhXa.get(id)??id))]})),hs:bc,anhXa}
}

/** Phủ có ràng buộc ma trận: tuyệt đối không tăng số câu để chạy theo mẫu số kiến thức. */
export function chonChuKyKt2026(muc: readonly MucKt[], cau: readonly CauMaTranKt[], hs: ReadonlyMap<string,BangChungKt>, seed: string) {
  const can = new Set(muc.map(m=>m.id)), nguon = [...new Map(cau.filter(q=>q.hopLe&&q.muc.some(id=>can.has(id))).map(q=>[q.qid,q])).values()]
  const trong = new Set(nguon.flatMap(q=>q.muc))
  const thieuNguon = [...can].filter(id=>!trong.has(id))
  const thieuMaTran = khung.filter(k=>nguon.filter(q=>oCau(q)===k.o).length<k.n).map(k=>({o:k.o,can:k.n,co:nguon.filter(q=>oCau(q)===k.o).length}))
  const trongSo = (id:string) => {
    const m=muc.find(m=>m.id===id),b=hs.get(id)
    return m?.loai==='bai'?100:1+(1-(b?.p??0.3))*2+(b?.n?0:1)
  }
  const w = new Map([...can].map(id=>[id,trongSo(id)]))
  const phu = (ds: readonly CauMaTranKt[]) => new Set(ds.flatMap(q=>q.muc).filter(id=>can.has(id)))
  const diemPhu = (ds: readonly CauMaTranKt[]) => [...phu(ds)].reduce((n,id)=>n+(w.get(id)??0),0)
  function rut(seedRut:string, daPhu:ReadonlySet<string>, daDung:ReadonlySet<string>) {
    const chon:CauMaTranKt[]=[], con=new Map<string,number>(khung.map(k=>[k.o,k.n])), dem=new Map<string,number>(), dung=new Set<string>()
    const them=(q:CauMaTranKt)=>{chon.push(q);dung.add(q.qid);con.set(oCau(q),con.get(oCau(q))!-1);for(const id of q.muc)dem.set(id,(dem.get(id)??0)+1)}
    while(chon.length<28){
      let tot:CauMaTranKt|undefined,diem=-Infinity
      for(const q of nguon){
        if(dung.has(q.qid)||(con.get(oCau(q))??0)<=0)continue
        const gain=q.muc.reduce((n,id)=>n+(!daPhu.has(id)&&!dem.has(id)?w.get(id)??0:0),0)
        const score=gain+(q.hopSuc??1)*0.01+(daDung.has(q.qid)?0:0.1)+(q.daGap?0:0.001)
        if(score>diem||score===diem&&bamKt(seedRut+q.qid)<bamKt(seedRut+(tot?.qid??''))){tot=q;diem=score}
      }
      if(!tot)break;them(tot)
    }
    // Đổi câu trong cùng ô ma trận nếu tăng độ phủ; không đổi mức/loại để bù thiếu.
    for(let pass=0;pass<3;pass++){
      let doi=false
      for(let i=0;i<chon.length;i++){
        const cu=chon[i]!,base=chon.filter((_,j)=>j!==i),duoc=new Set([...daPhu,...base.flatMap(q=>q.muc)]),mat=cu.muc.reduce((n,id)=>n+(!duoc.has(id)?w.get(id)??0:0),0)
        let tot:CauMaTranKt|undefined,loi=mat
        for(const q of nguon){if(dung.has(q.qid)||oCau(q)!==oCau(cu))continue;const gain=q.muc.reduce((n,id)=>n+(!duoc.has(id)?w.get(id)??0:0),0);if(gain>loi){tot=q;loi=gain}}
        if(tot){dung.delete(cu.qid);dung.add(tot.qid);chon[i]=tot;doi=true}
      }
      if(!doi)break
    }
    return chon.sort((a,b)=>a.phan.localeCompare(b.phan)||bamKt(seedRut+a.qid)-bamKt(seedRut+b.qid))
  }
  let best:CauMaTranKt[][]=[],diem=-Infinity
  for(let thu=0;thu<4;thu++){
    const a=rut(`${seed}:${thu}:1`,new Set(),new Set()),pa=phu(a)
    const b=pa.size===can.size?[]:rut(`${seed}:${thu}:2`,pa,new Set(a.map(q=>q.qid)))
    const ds=b.length?[a,b]:[a],score=diemPhu(ds.flat())
    if(score>diem){best=ds;diem=score}
    if(phu(ds.flat()).size===can.size)break
  }
  const daPhu=phu(best.flat()),chuaPhu=[...can].filter(id=>!daPhu.has(id))
  return {de:best.map(ds=>({qids:ds.map(q=>q.qid),phut:50})),thieuNguon,thieuMaTran,chuaPhu,tongMuc:can.size,phu:daPhu.size,
    du:!thieuNguon.length&&!thieuMaTran.length&&!chuaPhu.length&&best.every(ds=>ds.length===28)}
}
