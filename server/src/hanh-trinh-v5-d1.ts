import type { Env } from './kieu'
import type { HoSo2 } from './srs2-d1'
import type { QCau,HoSoOmniEm } from './omni-kieu'
import { vknCaCau } from './omni-p-vkn'
import { qCuaCau } from './omni-d1'
import type { QuanSatHanhTrinh } from './hanh-trinh-quan-sat'
import type { DoThiHanhTrinh } from './do-thi-tien-quyet'
import { tangViKyNang } from './do-thi-tien-quyet'
import { SQL_HANH_TRINH_V5,KHONG_CA_HT5 } from './hanh-trinh-v5-schema'
import { chayDdlMotLan } from './ddl-mot-lan'
import { PHIEN_BAN_HT5,mucKyNang,thieuTheoCau,docNhanHanhTrinh,tienDoMuc,giaTriHoc,hoTroChuyenDe,type VaiTroCau,type NhanHanhTrinh } from './hanh-trinh-v5-loi'
import { vaiTroL4 } from './hanh-trinh-l4'
import { phanNhom,type NhomThu } from './hanh-trinh-do-luong'
import { xacSuatDungCau } from './du-bao-diem'
import { msKyVong } from './omni-toc-do'
import { bam } from './srs2-loi'
type Row=Record<string,unknown>
interface CauDanhMuc { qid:string;q:QCau;tang:number;nhan:NhanHanhTrinh|null }
const cache=new WeakMap<object,Map<string,{luc:number;ds:CauDanhMuc[]}>>()
/** Danh mục đầy đủ trong phạm vi đã cho học; mẫu số không lấy cửa sổ xoay 96 câu. Chỉ đọc nhãn, không đáp án. */
async function danhMuc(env:Env,hs:HoSo2,now:number):Promise<CauDanhMuc[]>{
  const full=hs.chienDich?await env.DB.prepare('SELECT qid_json,ma_de_json FROM chien_dich WHERE id=?').bind(hs.chienDich.id).first<{qid_json:string;ma_de_json:string}>():null
  const ids=full?JSON.parse(full.qid_json) as string[]:hs.cau.map(c=>c.qid),mas=[...(hs.phamVi?.maDe??new Set(full?JSON.parse(full.ma_de_json) as string[]:hs.chienDich?.maDe??[]))].sort()
  const key=`${hs.chienDich?.id}|${bam(ids.join('|'))}|${mas.join('|')}`,dem=cache.get(env.DB)??new Map();cache.set(env.DB,dem)
  const cu=dem.get(key);if(cu&&now>=cu.luc&&now-cu.luc<60000)return cu.ds
  const r=await env.DB.prepare(`SELECT g.qid,g.dang,g.content_group,json_extract(g.json,'$.phan') phan,json_extract(g.json,'$.mucDo') muc,json_extract(g.json,'$.sao') sao,json_extract(g.json,'$.chuyenDe') cd,json_extract(g.json,'$.reviewed') duyet,json_extract(g.json,'$.hanhTrinh') nhan,json_extract(g.json,'$.kienThuc') kn,(SELECT oq.vkn_json FROM omni_q oq WHERE oq.qid=g.qid AND oq.y=-1 AND oq.duyet_luc IS NOT NULL) q_kn FROM game_v2_question g WHERE g.qid IN(SELECT value FROM json_each(?)) AND g.ma_de IN(SELECT value FROM json_each(?)) AND json_valid(g.json) AND json_extract(g.json,'$.reviewed')=1 ORDER BY g.qid,g.ma_de`).bind(JSON.stringify(ids),JSON.stringify(mas)).all<Row>()
  const fullQ=await qCuaCau(env,[...new Set(r.results.map(x=>String(x.qid)))])
  const ds:CauDanhMuc[]=[],da=new Set<string>()
  for(const x of r.results){const qid=String(x.qid);if(da.has(qid))continue;da.add(qid)
    const base=fullQ.get(qid);if(!base)continue
    const muc=Number(x.sao)>=2?'VDC':base.mucDo,t=tangViKyNang(muc);if(!t)continue
    const q:QCau={...base,mucDo:muc,contentGroup:String(x.content_group||qid)}
    let raw:unknown=null;try{raw=JSON.parse(String(x.nhan))}catch{/* nhãn vắng/lỗi giữ luật mặc định */}
    ds.push({qid,q,tang:t,nhan:docNhanHanhTrinh(raw,q,true)})
  }
  if(dem.size>=8)dem.delete(dem.keys().next().value!);dem.set(key,{luc:now,ds});return ds
}
export interface BoChonV5 { tang:Map<string,1|2|3|4>;chan:Set<string>;vai:Record<string,VaiTroCau>;trongSo:Record<string,number>;phut:Record<string,number>;phamVi:string;nhom:NhomThu;tienDo:ReturnType<typeof tienDoMuc>;soL4:number;soChanDoan:number }
export async function boChonV5(env:Env,sbd:string,now:number,hs:HoSo2,q:ReadonlyMap<string,QCau>,qs:readonly QuanSatHanhTrinh[],graph:DoThiHanhTrinh,omni:HoSoOmniEm,beta:ReadonlyMap<string,number>,ghi:boolean,daGap:ReadonlySet<string>=new Set()):Promise<BoChonV5>{
  await chayDdlMotLan(env,'hanh_trinh_v5',SQL_HANH_TRINH_V5)
  const ds=await danhMuc(env,hs,now),byId=new Map(ds.map(c=>[c.qid,c])),m=mucKyNang(qs,graph)
  const phamVi=maPhamVi(hs,ds)
  const nhom=await phanNhom(env,sbd,now,phamVi,ghi),danh=ds.flatMap(c=>vknCaCau(c.q).map(vkn=>({vkn,tang:c.tang})))
  const out:BoChonV5={tang:new Map(),chan:new Set(),vai:{},trongSo:{},phut:{},phamVi,nhom:nhom?.nhom??'B',tienDo:tienDoMuc(danh,m),soL4:0,soChanDoan:0}
  const unlock=new Map<string,Set<string>>()
  for(const c of ds){const targets=c.nhan?.dich??vknCaCau(c.q),parents=c.nhan?.tienQuyet??(c.tang>1?vknCaCau(c.q).map(vkn=>({vkn,tang:1})):[]);for(const p of parents){const next=unlock.get(p.vkn)??new Set<string>();for(const k of targets)next.add(`${k}@L${c.tang}`);unlock.set(p.vkn,next)}}
  const seen=new Set([...daGap,...qs.map(o=>o.nhom)])
  for(const c of hs.cau){const qc=q.get(c.qid);if(!qc)continue;const record=byId.get(c.qid),t=tangViKyNang(qc.mucDo),kn=vknCaCau(qc),label=record?.nhan??null
    if(!t||(c.nguon==='chien_dich'&&hs.phamVi&&!record)){out.chan.add(c.qid);continue}
    const missing=thieuTheoCau(qc,t,m,omni,label),group=qc.contentGroup||c.qid
    if(missing.length){out.chan.add(c.qid);continue}
    out.tang.set(c.qid,t as 1|2|3|4);if(t===4)out.soL4++
    const fresh=hs.tt.get(c.qid)?.laMoi===true&&!seen.has(group),unknown=kn.some(k=>!m.has(`${k}@L${k.startsWith('nen:')?1:t}`))
    const cross=qs.some(o=>o.dung&&o.nhom!==group&&kn.some(k=>o.kn.includes(k))&&q.get(o.qid)?.khoaBai&&qc.khoaBai&&q.get(o.qid)?.khoaBai!==qc.khoaBai)
    const role:VaiTroCau=!fresh?'on_sua':t===4?vaiTroL4(qc,label,fresh,cross):unknown?'chan_doan':'hoc_moi'
    out.vai[c.qid]=role;if(role==='chan_doan')out.soChanDoan++
    const p=xacSuatDungCau(omni,qc,omni.sEm),weak=Math.max(...kn.map(k=>1-(omni.vkn[k]?.p??0.3)))
    const minute=Math.max(0.25,msKyVong(beta.get(c.qid)??null,omni.tau,qc.phan,qc.mucDo)/60000);out.phut[c.qid]=minute
    out.trongSo[c.qid]=giaTriHoc({p,yeu:weak,phut:minute,moi:fresh,moKhoa:Math.max(0,...kn.map(k=>unlock.get(k)?.size??0)),quen:hs.tt.get(c.qid)?.henOn&&hs.tt.get(c.qid)!.henOn!<=new Date(now+7*3600000).toISOString().slice(0,10)?1:0,chuaRo:unknown,hoTro:hoTroChuyenDe(qc,omni)})
  }
  if(ghi)await env.DB.prepare(`INSERT INTO hanh_trinh_v5_muc SELECT ?,?,?,?,?,? WHERE ${KHONG_CA_HT5} ON CONFLICT(sbd,pham_vi) DO UPDATE SET phien_ban=excluded.phien_ban,muc_json=excluded.muc_json,tien_do_json=excluded.tien_do_json,cap_nhat_luc=excluded.cap_nhat_luc WHERE excluded.cap_nhat_luc>=hanh_trinh_v5_muc.cap_nhat_luc`).bind(sbd,phamVi,PHIEN_BAN_HT5,JSON.stringify([...m.values()]),JSON.stringify({...out.tienDo,soL4:out.soL4,soChanDoan:out.soChanDoan}),now).run()
  return out
}
export function lenhQuyetDinhV5(env:Env,sbd:string,ngay:string,moc:number,now:number,d:BoChonV5,qids:readonly string[]){
  const vai=Object.fromEntries(qids.map(id=>[id,d.vai[id]??'on_sua'])),minute=qids.reduce((s,id)=>s+(d.phut[id]??0),0)
  return env.DB.prepare(`INSERT OR IGNORE INTO hanh_trinh_v5_quyet_dinh SELECT ?,?,?,?,?,?,?,?,? WHERE ${KHONG_CA_HT5} AND changes()=1`).bind(sbd,ngay,moc,PHIEN_BAN_HT5,d.nhom,JSON.stringify(qids),JSON.stringify(vai),minute,now)
}

function maPhamVi(hs:HoSo2,ds:readonly CauDanhMuc[]){const scope=[...new Set(ds.flatMap(c=>vknCaCau(c.q).map(vkn=>`${vkn}@L${c.tang}`)))].sort();return `${hs.chienDich?.id}:${bam(scope.join('|'))}`}
export async function phamViMucTieu(env:Env,hs:HoSo2,now:number){return maPhamVi(hs,await danhMuc(env,hs,now))}
