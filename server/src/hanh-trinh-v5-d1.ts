import type { Env, D1PreparedStatement } from './kieu'
import type { HoSo2 } from './srs2-d1'
import type { QCau,HoSoOmniEm } from './omni-kieu'
import { vknCaCau } from './omni-p-vkn'
import { qCuaCau } from './omni-d1'
import type { QuanSatHanhTrinh } from './hanh-trinh-quan-sat'
import type { DoThiHanhTrinh } from './do-thi-tien-quyet'
import { tangViKyNang } from './do-thi-tien-quyet'
import { SQL_HANH_TRINH_V5,KHONG_CA_HT5 } from './hanh-trinh-v5-schema'
import { chayDdlMotLan } from './ddl-mot-lan'
import { mucKyNang,thieuTheoCau,docNhanHanhTrinh,tienDoMuc,hoTroChuyenDe,type VaiTroCau,type NhanHanhTrinh } from './hanh-trinh-v5-loi'
import { vaiTroL4 } from './hanh-trinh-l4'
import { phanNhom,type NhomThu,type PhanNhom } from './hanh-trinh-do-luong'
import { xacSuatDungCau } from './du-bao-diem'
import { msKyVong } from './omni-toc-do'
import { tachSongSinh } from './loi-hoc-luat'
import { bam } from './srs2-loi'
import { PHIEN_BAN_HT6,quyenCau } from './hanh-trinh-v6-loi'
import { docMoHinhV6,type ChonV6 } from './hanh-trinh-v6-d1'
import type { MoHinhV6 } from './hanh-trinh-v6-mo-hinh'
import { featuresV6,pDoKhoV6,giaTriV6 } from './hanh-trinh-v6-mo-hinh'
import { dbGoc } from './cau-hinh-dem'
import { dauKhoCau, dauTruocLucDoc } from './dau-kho-cau'
type Row=Record<string,unknown>
export interface CauDanhMuc { qid:string;q:QCau;tang:number;nhan:NhanHanhTrinh|null }
const cache=new WeakMap<object,Map<string,{luc:number;kiem:number;dau:string;ds:CauDanhMuc[]}>>()
/** BỘ NHỚ ISOLATE (đo 13/10 21:20–22:05: 111 lỗi `exceededMemory` — Worker vượt 128 MB): danh mục có thể ~24.000 câu (mỗi câu một QCau + nhãn).
 *  Trần TỔNG số câu của mọi danh mục đang đệm trong một isolate (trước: tối đa 8 danh mục, không trần cỡ); vượt ⇒ bỏ danh mục cũ nhất. */
export const TRAN_CAU_DEM_DANH_MUC=40_000
/** MỘT LƯỢT DỰNG cho mỗi khoá trong isolate: các yêu cầu đến cùng lúc (giờ cao điểm) dùng chung lượt đang dựng thay vì mỗi yêu cầu tự đọc ~24.000 dòng
 *  và dựng một bản riêng (gấp N lần bộ nhớ + D1). Cùng câu SQL, cùng kết quả; lỗi tới mọi bên chờ như khi tự đọc. */
const dangDung=new WeakMap<object,Map<string,Promise<CauDanhMuc[]>>>()
/** Đợt 22: tuổi tối đa của một danh mục trong đệm dù dấu kho không đổi (bằng mức nhớ giờ cao điểm đã chốt 12/10). */
export const HAN_TOI_DA_DANH_MUC=600_000
type DongChienDichDay={qid_json:string;ma_de_json:string}
/** Dòng chiến dịch đầy đủ (danh sách câu + tờ) — đầu vào của `danhMuc`. Tách riêng (đợt 18) để động cơ ĐỌC TRƯỚC cùng đợt (cùng câu SQL, cùng tham số). */
export function docChienDichDay(env:Env,id:string):Promise<DongChienDichDay|null>{
  return env.DB.prepare('SELECT qid_json,ma_de_json FROM chien_dich WHERE id=?').bind(id).first<DongChienDichDay>()
}
/** Danh mục đầy đủ trong phạm vi đã cho học; mẫu số không lấy cửa sổ xoay 96 câu. Chỉ đọc nhãn, không đáp án.
 *  `fullSom` = lượt `docChienDichDay(env, hs.chienDich.id)` nơi gọi đã bắt đầu sớm cho ĐÚNG chiến dịch này (vắng ⇒ đọc như cũ). */
export async function danhMuc(env:Env,hs:Pick<HoSo2,'chienDich'|'phamVi'> & {cau?:HoSo2['cau']},now:number,fullSom?:Promise<DongChienDichDay|null>):Promise<CauDanhMuc[]>{
  const full=hs.chienDich?await (fullSom??docChienDichDay(env,hs.chienDich.id)):null
  const ids=full?JSON.parse(full.qid_json) as string[]:(hs.cau??[]).map(c=>c.qid),mas=[...(hs.phamVi?.maDe??new Set(full?JSON.parse(full.ma_de_json) as string[]:hs.chienDich?.maDe??[]))].sort()
  // Khoá đệm theo D1 GỐC (`dbGoc`) — mỗi lượt gọi bọc D1 riêng (gameV2 › gopDocD1) nên khoá theo `env.DB` chỉ dùng lại TRONG một lượt (số đo 12/10:
  // ~9.000 lần đọc/ngày dù "nhớ 1 phút"). Đợt 17: cả ngày (đúng ý định nhớ 1 phút ban đầu); giờ cao điểm nhớ 10 phút.
  const caoDiem=new Date(now+7*3_600_000).getUTCHours()>=20,khoaDb=dbGoc(env.DB as unknown as object)
  const key=`${hs.chienDich?.id}|${bam(ids.join('|'))}|${mas.join('|')}`,dem=cache.get(khoaDb)??new Map();cache.set(khoaDb,dem)
  // Giờ cao điểm 20:00–23:59 VN (khẩn 12/10 22h30, số đo D1 thật: câu đọc danh mục này ~23.000 dòng/lần, ~49 ms, gần 9.000 lần/ngày — đứng thứ hai
  // về tổng thời gian D1): nhớ 10 phút thay vì 1 phút. Danh mục chỉ đổi khi thầy sửa kho ⇒ câu sửa lúc cao điểm vào danh mục chậm nhất 10 phút.
  const nho=caoDiem?600000:60000
  const cu=dem.get(key);if(cu&&Math.abs(now-cu.kiem)<nho&&Math.abs(now-cu.luc)<HAN_TOI_DA_DANH_MUC)return cu.ds
  // Đợt 22: đệm hết hạn nhưng chưa quá HẠN TỐI ĐA ⇒ hỏi DẤU KHO (một dòng, bảng nhỏ) THAY cho lượt đọc lại ~30.000 dòng; kho không đổi ⇒ dùng tiếp.
  // Câu sửa/duyệt (lập lại chỉ mục) vào danh mục sau ≤ 1 phút như cũ; nhãn kỹ năng đã duyệt (omni_q) vào chậm nhất HAN_TOI_DA_DANH_MUC (= mức giờ cao điểm).
  // Lần đọc đầu KHÔNG hỏi dấu (không thêm lệnh); lần kiểm đầu tiên: mốc lập chỉ mục mới nhất có trước lúc đọc ⇒ dữ liệu đang giữ là bản mới nhất.
  if(cu&&Math.abs(now-cu.luc)<HAN_TOI_DA_DANH_MUC){const d=await dauKhoCau(env);if(d&&(cu.dau?d===cu.dau:dauTruocLucDoc(d,cu.luc))){cu.dau=d;cu.kiem=now;return cu.ds}}
  const bay=dangDung.get(khoaDb)??new Map<string,Promise<CauDanhMuc[]>>();dangDung.set(khoaDb,bay)
  const dangCo=bay.get(key);if(dangCo)return dangCo
  const p=dungDanhMuc(env,ids,mas).then(ds=>{
    dem.delete(key);dem.set(key,{luc:now,kiem:now,dau:'',ds})
    let tong=0;for(const v of dem.values())tong+=v.ds.length
    for(const k of dem.keys()){if(tong<=TRAN_CAU_DEM_DANH_MUC||k===key)break;tong-=dem.get(k)!.ds.length;dem.delete(k)}
    return ds
  }).finally(()=>{if(bay.get(key)===p)bay.delete(key)})
  bay.set(key,p)
  return p
}
async function dungDanhMuc(env:Env,ids:readonly string[],mas:readonly string[]):Promise<CauDanhMuc[]>{
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
  return ds
}
export interface BoChonV5 { tang:Map<string,1|2|3|4>;chan:Set<string>;chanDoan:Set<string>;chon:Record<string,ChonV6>;ungNgoai:{qid:string;nhom:string;moi:boolean;hoc:boolean}[];uuTienThamDo?:string;vai:Record<string,VaiTroCau>;trongSo:Record<string,number>;phut:Record<string,number>;phamVi:string;nhom:NhomThu;tienDo:ReturnType<typeof tienDoMuc>;soL4:number;soChanDoan:number }
/**
 * ĐỌC TRƯỚC / GHI DỒN của `boChonV5` (đợt 18 — luật thầy 13/10: sửa xong máy chủ phải nhanh hơn). Trước: mô hình v6 + dòng chiến dịch (một đợt) ⇒ nhóm thử
 * nghiệm (một đợt) ⇒ ghi mức kỹ năng (một đợt) — ba đợt D1 nối tiếp. Nay động cơ bắt đầu ba lượt đọc từ đầu (mỗi lượt vẫn SAU lệnh tạo bảng của nó) và
 * `ghiTre` nhận lệnh ghi `hanh_trinh_v5_muc` để động cơ gửi CHUNG lô ghi cuối (không lệnh đọc nào sau đó đụng bảng này). Vắng ⇒ y như cũ.
 */
export interface TruocBoChonV5 { moHinh?:Promise<MoHinhV6|null>; nhom?:Promise<PhanNhom|null>; full?:Promise<DongChienDichDay|null>; ghiTre?:D1PreparedStatement[]
  /** Gói R 15/10: đầu vào phân nhóm lần đầu động cơ đã đọc trước (`docDauVaoNhom`) — vắng ⇒ phân nhóm tự đọc như cũ. */
  vaoNhom?:Promise<{ten_lop:string;lop:string;diem:number|null}|null>
  /** Gói R 15/10: lượt `danhMuc(env,hs,now,full)` động cơ đã bắt đầu sớm (cùng đối số) — vắng ⇒ đọc như cũ. */
  ds?:Promise<CauDanhMuc[]> }
export async function boChonV5(env:Env,sbd:string,now:number,hs:HoSo2,q:ReadonlyMap<string,QCau>,qs:readonly QuanSatHanhTrinh[],graph:DoThiHanhTrinh,omni:HoSoOmniEm,beta:ReadonlyMap<string,number>,ghi:boolean,daGap:ReadonlySet<string>=new Set(),truoc:TruocBoChonV5={}):Promise<BoChonV5>{
  await chayDdlMotLan(env,'hanh_trinh_v5',SQL_HANH_TRINH_V5)
  const [ds,model]=await Promise.all([truoc.ds??danhMuc(env,hs,now,truoc.full),truoc.moHinh??docMoHinhV6(env)]),byId=new Map(ds.map(c=>[c.qid,c])),m=mucKyNang(qs,graph)
  const phamVi=maPhamVi(hs,ds)
  const nhom=await phanNhom(env,sbd,now,phamVi,ghi,truoc.nhom,truoc.vaoNhom),danh=ds.flatMap(c=>vknCaCau(c.q).map(vkn=>({vkn,tang:c.tang})))
  const out:BoChonV5={tang:new Map(),chan:new Set(),chanDoan:new Set(),chon:{},ungNgoai:[],vai:{},trongSo:{},phut:{},phamVi,nhom:nhom?.nhom??'B',tienDo:tienDoMuc(danh,m),soL4:0,soChanDoan:0}
  const blocked=new Map<string,{parents:{vkn:string;tang:number}[];targets:string[]}>()
  for(const c of ds){const missing=thieuTheoCau(c.q,c.tang,m,omni,c.nhan);if(!missing.length)continue
    const parents=[...new Map(missing.map(p=>[`${p.vkn}@L${p.tang}`,p])).values()].sort((a,b)=>a.vkn.localeCompare(b.vkn)||a.tang-b.tang),targets=(c.nhan?.dich??vknCaCau(c.q)).map(k=>`${k}@L${c.tang}`)
    const key=`${parents.map(p=>`${p.vkn}@L${p.tang}`).join('|')}=>${targets.slice().sort().join('|')}`;blocked.set(key,{parents,targets})
  }
  const seen=new Set([...daGap,...qs.map(o=>o.nhom)])
  out.ungNgoai=ds.filter(c=>!hs.meta.has(c.qid)).flatMap(c=>{const access=quyenCau(c.q,c.tang,m,omni,c.nhan);return access.quyen==='sua_nen'?[]:[{qid:c.qid,nhom:c.q.contentGroup||c.qid,moi:!seen.has(c.q.contentGroup||c.qid),hoc:access.quyen==='hoc'}]}).sort((a,b)=>Number(b.hoc)-Number(a.hoc)||Number(b.moi)-Number(a.moi)||a.qid.localeCompare(b.qid))
  for(const c of hs.cau){const qc=q.get(c.qid);if(!qc)continue;const record=byId.get(tachSongSinh(c.qid).goc),t=tangViKyNang(qc.mucDo),kn=vknCaCau(qc),label=record?.nhan??null
    if(!t||(c.nguon==='chien_dich'&&hs.phamVi&&!record)){out.chan.add(c.qid);continue}
    const access=quyenCau(qc,t,m,omni,label),group=qc.contentGroup||c.qid
    if(access.quyen==='sua_nen'){out.chan.add(c.qid);continue}
    const diagnostic=access.quyen==='chan_doan'
    if(diagnostic&&tachSongSinh(c.qid).goc!==c.qid){out.chan.add(c.qid);continue}
    if(diagnostic)out.chanDoan.add(c.qid)
    out.tang.set(c.qid,t as 1|2|3|4);if(t===4&&!diagnostic)out.soL4++
    const fresh=hs.tt.get(c.qid)?.laMoi===true&&!seen.has(group),unknown=kn.some(k=>!m.has(`${k}@L${k.startsWith('nen:')?1:t}`))
    const cross=qs.some(o=>o.dung&&o.nhom!==group&&kn.some(k=>o.kn.includes(k))&&q.get(o.qid)?.khoaBai&&qc.khoaBai&&q.get(o.qid)?.khoaBai!==qc.khoaBai)
    if(diagnostic&&!fresh){out.chan.add(c.qid);continue}
    const role:VaiTroCau=diagnostic?'chan_doan':!fresh?'on_sua':t===4?vaiTroL4(qc,label,fresh,cross):unknown?'chan_doan':'hoc_moi'
    out.vai[c.qid]=role;if(role==='chan_doan')out.soChanDoan++
    const p0=xacSuatDungCau(omni,qc,omni.sEm),weak=Math.max(...kn.map(k=>1-(omni.vkn[k]?.p??0.3)))
    const minute=Math.max(0.25,msKyVong(beta.get(c.qid)??null,omni.tau,qc.phan,qc.mucDo)/60000);out.phut[c.qid]=minute
    const lop=hs.chienDich?.id.split('-').at(-1)??'?',p=pDoKhoV6(model,c.qid,lop,t,qc.phan,p0,hs.meta.get(c.qid)?.version)
    const due=hs.tt.get(c.qid)?.henOn&&hs.tt.get(c.qid)!.henOn!<=new Date(now+7*3600000).toISOString().slice(0,10)?1:0
    // Chỉ đếm kỹ năng đích hiện bị chặn và có thể mở nhờ kỹ năng của câu này.
    const opened=new Set<string>()
    for(const next of blocked.values())if(next.parents.every(parent=>kn.includes(parent.vkn)&&t>=parent.tang))for(const k of next.targets)opened.add(k)
    const x=featuresV6(p,weak,due,opened.size,unknown,fresh,hoTroChuyenDe(qc,omni))
    out.trongSo[c.qid]=giaTriV6(model,x,p,minute,qc.phan==='II'?1:0.25)
    out.chon[c.qid]={qid:c.qid,version:hs.meta.get(c.qid)?.version??'?',nhom:group,lop,tang:t,phan:qc.phan,kn,p:p0,x,prop:0,diagnostic}
  }
  // Một vị trí khám phá trong chặng: 90% câu đứng đầu, 10% chọn đều trong top 8 hợp lệ.
  // Ghi đúng xác suất của câu thực sự được ưu tiên; các câu còn lại không giả có propensity=1.
  const probe=hs.cau.filter(c=>out.chon[c.qid]&&!out.chan.has(c.qid)&&!out.chanDoan.has(c.qid)&&hs.tt.get(c.qid)?.laMoi)
    .sort((a,b)=>out.trongSo[b.qid]!-out.trongSo[a.qid]!||a.qid.localeCompare(b.qid)).slice(0,8)
  if(probe.length){const r=crypto.getRandomValues(new Uint32Array(2)),explore=r[0]!/4294967296<0.1,index=explore?Math.floor(r[1]!/4294967296*probe.length):0,id=probe[index]!.qid;out.uuTienThamDo=id;out.chon[id]!.prop=0.1/probe.length+(index===0?0.9:0)}
  if(ghi){
    const lenh=env.DB.prepare(`INSERT INTO hanh_trinh_v5_muc SELECT ?,?,?,?,?,? WHERE ${KHONG_CA_HT5} ON CONFLICT(sbd,pham_vi) DO UPDATE SET phien_ban=excluded.phien_ban,muc_json=excluded.muc_json,tien_do_json=excluded.tien_do_json,cap_nhat_luc=excluded.cap_nhat_luc WHERE excluded.cap_nhat_luc>=hanh_trinh_v5_muc.cap_nhat_luc`).bind(sbd,phamVi,PHIEN_BAN_HT6,JSON.stringify([...m.values()]),JSON.stringify({...out.tienDo,soL4:out.soL4,soChanDoan:out.soChanDoan}),now)
    if(truoc.ghiTre)truoc.ghiTre.push(lenh);else await lenh.run()
  }
  return out
}
export function lenhQuyetDinhV5(env:Env,sbd:string,ngay:string,moc:number,now:number,d:BoChonV5,qids:readonly string[]){
  const vai=Object.fromEntries(qids.map(id=>[id,d.vai[id]??'on_sua'])),minute=qids.reduce((s,id)=>s+(d.phut[id]??0),0)
  return env.DB.prepare(`INSERT OR IGNORE INTO hanh_trinh_v5_quyet_dinh SELECT ?,?,?,?,?,?,?,?,? WHERE ${KHONG_CA_HT5} AND changes()=1`).bind(sbd,ngay,moc,PHIEN_BAN_HT6,d.nhom,JSON.stringify(qids),JSON.stringify(vai),minute,now)
}

function maPhamVi(hs:HoSo2,ds:readonly CauDanhMuc[]){const scope=[...new Set(ds.flatMap(c=>vknCaCau(c.q).map(vkn=>`${vkn}@L${c.tang}`)))].sort();return `${hs.chienDich?.id}:${bam(scope.join('|'))}`}
export async function phamViMucTieu(env:Env,hs:HoSo2,now:number){return maPhamVi(hs,await danhMuc(env,hs,now))}
