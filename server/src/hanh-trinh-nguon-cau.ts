// Nguồn dự phòng: câu thật đã duyệt, bản khác có bộ sinh/kiểm; không đổi bằng chứng thành thạo.
import type { Env } from './kieu'
import type { HoSo2 } from './srs2-d1'
import type { BoChonV5 } from './hanh-trinh-v5-d1'
import { napDayDuMem } from './game-v2-bank'
import { apSongSinh,boTroTheoQid } from './song-sinh-game'
import { bienTheTheoQid } from './ban-khac-ao'
import { docKhoiEmCong } from './chan-khac-khoi'
import { tachSongSinh } from './loi-hoc-luat'
import type { PrivateQuestion } from '../../src/game/than-thu-v2/core'
import { chayDdlMotLan } from './ddl-mot-lan'

export const SQL_NGUON_CAU = [`CREATE TABLE IF NOT EXISTS hanh_trinh_nguon_cau (
 sbd TEXT NOT NULL,ngay TEXT NOT NULL,chien_dich_id TEXT NOT NULL,du_phong_json TEXT NOT NULL,
 thieu_json TEXT NOT NULL,toi_thieu INTEGER NOT NULL,da_xep INTEGER NOT NULL,cap_nhat_luc INTEGER NOT NULL,
 PRIMARY KEY(sbd,ngay))`]
export const gocNguonCau = (id:string) => tachSongSinh(id.replace(/#\d+$/,'')).goc
export const laBanBu = (id:string) => /~(?:ss|bt)\d+$/.test(id)
/** Mỗi bản giao riêng chỉ được tính một lần. Bản thay câu gốc của luồng cũ vẫn tính cho câu gốc. */
export function idDaLam(r:{qid:unknown;tc?:unknown},plan:ReadonlySet<string>):string {
 const id=String(r.qid??'').replace(/#\d+$/,'')
 return laBanBu(id)&&plan.has(id)?id:String(r.tc||gocNguonCau(id))
}
const khoa = (q:PrivateQuestion) => JSON.stringify([q.text,q.table??null,[...q.choices].sort()]).replace(/\s+/g,' ').normalize('NFC')
const noiDungBan=new WeakMap<HoSo2,Map<string,string>>()
/** Chỉ gắn qid đã dựng/kiểm lại thành công. Metadata giữ contentGroup của gốc. */
export async function ganBanBu(env:Env,sbd:string,hs:HoSo2,ids:readonly string[]):Promise<string[]> {
 const ao=[...new Set(ids.filter(laBanBu))],roots=[...new Set(ao.map(gocNguonCau))].filter(id=>hs.meta.has(id)&&hs.tt.has(id)&&!hs.meta.get(id)!.tuLuan)
 if(!roots.length)return []
 const [day,boTro,khoi]=await Promise.all([
  napDayDuMem(env,roots.map(id=>{const m=hs.meta.get(id)!;return {maDe:m.maDe,version:m.version,qid:id}})),
  boTroTheoQid(env,roots),docKhoiEmCong(env,sbd),
 ])
 const ra:string[]=[],noidung=noiDungBan.get(hs)??new Map<string,string>();noiDungBan.set(hs,noidung)
 const theoGoc=new Map(hs.cau.map(c=>[c.qid,c])),theoNoiDung=new Map([...noidung].map(([id,key])=>[key,id]))
 for(const id of ao){
  const root=gocNguonCau(id),m=hs.meta.get(root),c=theoGoc.get(root),t=hs.tt.get(root)
  if(!m||!c||!t||t.catTia)continue
  const q=day.get(`${m.maDe}|${root}|${m.version}`);if(!q)continue
  const ss=/~ss(\d+)$/.exec(id),bt=/~bt\d+$/.test(id)
  const ban=ss?(()=>{const x=boTro.get(root)?.songSinh[Number(ss[1])];return x?apSongSinh(q,x,Number(ss[1])):null})():bt?bienTheTheoQid(q,id,khoi):null
  if(!ban||ban.qid!==id||khoa(ban)===khoa(q))continue
  const key=`${m.group||root}|${khoa(ban)}`
  if(theoNoiDung.has(key)&&theoNoiDung.get(key)!==id)continue
  noidung.set(id,key);theoNoiDung.set(key,id)
  hs.meta.set(id,{...m,qid:id});hs.tt.set(id,{...t,qid:id,laMoi:true})
  if(!theoGoc.has(id))hs.cau.push({...c,qid:id})
  ra.push(id)
 }
 return ra
}
/** Hai câu/bản tối đa cho một gốc mỗi ngày. Không bù bằng câu chẩn đoán còn thiếu tiên quyết. */
export async function taoNguonBanBu(env:Env,sbd:string,ngay:string,hs:HoSo2,d:BoChonV5,chan:ReadonlySet<string>,da:readonly string[],can:number):Promise<string[]> {
 if(can<=0)return []
 const counts=new Map<string,number>();for(const id of da){const g=hs.meta.get(id)?.group||gocNguonCau(id);counts.set(g,(counts.get(g)??0)+1)}
 const roots=hs.cau.filter(c=>!laBanBu(c.qid)&&d.tang.has(c.qid)&&!d.chan.has(c.qid)&&!d.chanDoan.has(c.qid)&&!chan.has(c.qid)&&!chan.has(hs.meta.get(c.qid)?.group||c.qid)&&!hs.tt.get(c.qid)?.catTia)
  .sort((a,b)=>(d.trongSo[b.qid]??0)-(d.trongSo[a.qid]??0)||a.qid.localeCompare(b.qid))
 const used=await env.DB.prepare('SELECT DISTINCT qid FROM su_kien_hoc WHERE sbd=? AND qid LIKE ?').bind(sbd,'%~%').all<{qid:string}>()
 const seen=new Set(used.results.map(r=>r.qid)),ra:string[]=[],groups=new Map<string,number>()
 const k=Math.floor(Date.parse(ngay+'T00:00:00Z')/86400000)*8
 for(let i=0;i<roots.length&&ra.length<can;i+=24){
  const page=roots.slice(i,i+24),ids=page.flatMap(c=>[0,1,2,3].map(j=>`${c.qid}~ss${j}`).concat([0,1,2].map(j=>`${c.qid}~bt${k+j}`))).filter(id=>!seen.has(id))
  const valid=await ganBanBu(env,sbd,hs,ids)
  for(const id of valid){const root=gocNguonCau(id),g=hs.meta.get(id)!.group||root
   if((counts.get(g)??0)+(groups.get(g)??0)>=2||ra.length>=can)continue
   // Cổng và xếp hạng của câu gốc, không coi bản khác là kỹ năng mới độc lập.
   d.tang.set(id,d.tang.get(root)!);d.vai[id]='on_sua';d.trongSo[id]=d.trongSo[root]??0;d.phut[id]=d.phut[root]??1
   if(d.chon[root])d.chon[id]={...d.chon[root]!,qid:id,prop:0,diagnostic:false}
   ra.push(id);groups.set(g,(groups.get(g)??0)+1)
  }
 }
 return ra
}
/** Chuẩn bị từng ít học sinh, ưu tiên em chưa có nguồn hôm nay; ca mở thì nghỉ hoàn toàn. */
export async function chuanBiNguonCau(env:Env,now:number):Promise<{daQuet:number;hoan:boolean}> {
 const ca=await env.DB.prepare("SELECT COUNT(*) n FROM ca WHERE trang_thai='mo'").first<{n:number}>()
 if(!ca||ca.n)return {daQuet:0,hoan:true}
 await chayDdlMotLan(env,'hanh_trinh_nguon_cau',SQL_NGUON_CAU)
 const ngay=new Date(now+7*3600000).toISOString().slice(0,10)
 const ds=await env.DB.prepare(`SELECT DISTINCT h.sbd FROM hoc_sinh h
  JOIN chien_dich c ON c.id IN('hanh-trinh-v3-khoi-10','hanh-trinh-v3-khoi-11','hanh-trinh-v3-khoi-12')
  JOIN json_each(c.sbd_json) j ON j.value=h.sbd
  LEFT JOIN hanh_trinh_nguon_cau n ON n.sbd=h.sbd AND n.ngay=?
  WHERE c.trang_thai='dang_chay' AND COALESCE(h.trang_thai,'')<>'khoa'
   AND n.sbd IS NULL ORDER BY h.sbd LIMIT 2`).bind(ngay).all<{sbd:string}>()
 let daQuet=0
 for(const h of ds.results){
  if((await env.DB.prepare("SELECT COUNT(*) n FROM ca WHERE trang_thai='mo'").first<{n:number}>())?.n)return {daQuet,hoan:true}
  const {layKeHoachHomNay}=await import('./srs2-d1');await layKeHoachHomNay(env,h.sbd,now);daQuet++
 }
 return {daQuet,hoan:false}
}
