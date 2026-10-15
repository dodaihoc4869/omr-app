// Điểm nối ba cỗ máy: chỉ kế hoạch Hành trình, không đổi chấm điểm/EXP/ca thi.
import { boChonV5, danhMuc, docChienDichDay, type BoChonV5 } from './hanh-trinh-v5-d1'
import { ghiDoV6, docChonV6, docMoHinhV6 } from './hanh-trinh-v6-d1'
import type { MoHinhV6 } from './hanh-trinh-v6-mo-hinh'
import { SQL_HT6 } from './hanh-trinh-v6-schema'
import { SQL_HANH_TRINH_V5 } from './hanh-trinh-v5-schema'
import { docNhom, docDauVaoNhom, type PhanNhom } from './hanh-trinh-do-luong'
import type { Env, D1Result, D1PreparedStatement } from './kieu'
import { dbGoc } from './cau-hinh-dem'
import type { HoSo2 } from './srs2-d1'
import { docMetaCau, docChienDichThoCuaEm } from './srs2-d1'
import { docSuKienOmni, qCuaCau, damBaoBangOmni } from './omni-d1'
import { phatLaiEm, vknCaCau } from './omni-p-vkn'
import { duBaoDiem, xacSuatDungCau } from './du-bao-diem'
import { msKyVong } from './omni-toc-do'
import { chayDdlMotLan, ddlDaXong } from './ddl-mot-lan'
import { tangCuaCau } from './hanh-trinh-ngay'
import { quanSatDocLap, chuoiSaiKyNang, type QuanSatHanhTrinh } from './hanh-trinh-quan-sat'
import { fitHalfLife, henHalfLife } from './half-life'
import { dungDoThi, canhDangHoc, type CanhHoc } from './do-thi-tien-quyet'
import { chonBandit, type BangBandit, type CachCuu } from './bandit'
import type { QCau, SuKienOmni, XacNhanThay } from './omni-kieu'
import { SQL_DA_CONG_BO } from './cong-bo-diem'
import { bam } from './srs2-loi'

type Row=Record<string,unknown>
export { SQL_DONG_CO_HANH_TRINH } from './hanh-trinh-dong-co-schema'
import { SQL_DONG_CO_HANH_TRINH } from './hanh-trinh-dong-co-schema'

const KHONG_CA="NOT EXISTS(SELECT 1 FROM ca WHERE trang_thai='mo')"
export interface DongCoHanhTrinh {
  v5?:BoChonV5; chan:Set<string>; hen:Map<string,string>; trongSo:Record<string,number>; canThiep?:{qid:string;nhom:string;kn:string;context:string;cach:CachCuu;xacSuat:number}; soQuanSat:number; soHalfLife:number; soCanhHoc:number; p8:number }
/** Receipt dùng chỉ từ sự kiện máy chủ. Không thưởng vì chỉ đã đề nghị hoặc đúng câu can thiệp. */
export function doCanThiep(r:Row,qs:readonly QuanSatHanhTrinh[],firstSeen?:ReadonlyMap<string,number>,used:ReadonlySet<string>=new Set()):{dungLuc:number|null;doLuc:number|null;ketQua:number|null;receipt:string|null} {
  const delivered=qs.find(o=>o.qid===r.qid && o.nhom===r.nhom && o.luc>=Number(r.goi_luc))
  if(!delivered) return {dungLuc:null,doLuc:null,ketQua:null,receipt:null}
  const first=new Map(firstSeen)
  if(!firstSeen) for(const o of qs) first.set(o.nhom,Math.min(first.get(o.nhom)??Infinity,o.luc))
  const after=qs.find(o=>first.get(o.nhom)===o.luc && !used.has(`${o.nhom}|${o.luc}`) && o.luc>=delivered.luc+86400000 && o.luc<=delivered.luc+14*86400000 && o.nhom!==delivered.nhom && o.kn.includes(String(r.ky_nang)))
  const dung=after?qs.filter(o=>o.nhom===after.nhom && o.luc===after.luc && o.kn.includes(String(r.ky_nang))).every(o=>o.dung):null
  return {dungLuc:delivered.luc,doLuc:after?.luc??null,ketQua:dung===null?null:Number(dung),receipt:after?`${after.nhom}|${after.luc}`:null}
}
export function phanBoCanThiep(rs:readonly Row[],qs:readonly QuanSatHanhTrinh[],first:ReadonlyMap<string,number>,daDung:ReadonlySet<string>=new Set()) {
  const used=new Set(daDung)
  return rs.slice().sort((a,b)=>Number(b.goi_luc)-Number(a.goi_luc) || String(a.ngay).localeCompare(String(b.ngay)) || Number(b.moc)-Number(a.moc)).map(r=>{
    const d=doCanThiep(r,qs,first,used);if(d.receipt) used.add(d.receipt);return {r,d}
  }).filter(x=>x.d.dungLuc!==null)
}

const SQL_CANH_LOP=`SELECT tu,den,SUM(n_co) nCo,SUM(dung_co) dungCo,SUM(n_chua) nChua,SUM(dung_chua) dungChua,COUNT(DISTINCT sbd) soEm FROM hanh_trinh_v4_canh WHERE den IN (SELECT value FROM json_each(?)) AND cap_nhat_luc>=? AND n_co+n_chua>0 GROUP BY tu,den`
/**
 * CẠNH TIÊN QUYẾT CẢ LỚP. Giờ cao điểm 20:00–23:59 VN (khẩn 12/10 23h — số đo D1 thật: câu tổng hợp này ~9.700 lần/ngày × 26 ms, ~9.400 dòng/lần): số
 * liệu cả lớp đổi chậm ⇒ nhớ 10 phút theo isolate (khoá D1 gốc), THEO TỪNG kỹ năng đích `den` — GROUP BY (tu, den) nên dòng của mỗi `den` độc lập; em sau
 * chỉ đọc kỹ năng còn thiếu. Trả theo thứ tự (tu, den) như GROUP BY.
 * ĐỢT 21 (thầy 13/10 "tối ưu máy chủ chuyên sâu"; số đo D1 3 giờ trưa: 512 lần × 17 ms, ~9.700 dòng/lần ngoài cao điểm): nhớ CẢ NGÀY — ngoài cao điểm
 * 3 phút (số liệu 7 ngày cả lớp, lệch tối đa 3 phút không đổi thứ tự ưu tiên bài), cao điểm 10 phút như cũ.
 */
const demCanh=new WeakMap<object,{luc:number;moc:number;theoDen:Map<string,CanhHoc[]>}>()
async function docCanhLop(env:Env,targets:readonly string[],now:number):Promise<CanhHoc[]>{
  const han=new Date(now+7*3_600_000).getUTCHours()>=20?600_000:180_000
  const goc=dbGoc(env.DB as unknown as object)
  let d=demCanh.get(goc)
  if(!d||now-d.luc>=han||now<d.luc){d={luc:now,moc:now-7*86400000,theoDen:new Map()};demCanh.set(goc,d)}
  const dem=d,ds=[...new Set(targets)],thieu=ds.filter(t=>!dem.theoDen.has(t)),moi=new Map<string,CanhHoc[]>(thieu.map(t=>[t,[]]))
  if(thieu.length){
    for(const x of (await env.DB.prepare(SQL_CANH_LOP).bind(JSON.stringify(thieu),dem.moc).all<CanhHoc>()).results??[])moi.get(String(x.den))?.push(x)
    for(const [t,a] of moi)dem.theoDen.set(t,a)
  }
  const so=(a:string,b:string)=>a<b?-1:a>b?1:0
  return ds.flatMap(t=>moi.get(t)??dem.theoDen.get(t)??[]).sort((a,b)=>so(String(a.tu),String(b.tu))||so(String(a.den),String(b.den)))
}

/** Promise bắt đầu SỚM: đánh dấu đã bắt lỗi để không thành lỗi treo — nơi dùng vẫn `await` và nhận đúng lỗi, đúng chỗ cũ. */
const som=<T,>(p:Promise<T>):Promise<T>=>{p.catch(()=>{});return p}
/**
 * ĐỌC TRƯỚC CỦA ĐỘNG CƠ (đợt 18 — luật thầy 13/10: "sửa xong tốc độ máy chủ phải nhanh hơn"). Trước: các lượt đọc dưới đi NỐI TIẾP bên trong động cơ
 * (sổ OMNI ⇒ can thiệp/bandit/receipt ⇒ chiến dịch + mô hình v6 ⇒ nhóm thử nghiệm ⇒ [ghi mức] ⇒ nhật ký chọn v6 ⇒ dòng động cơ cũ) ≈ 7 đợt D1 mỗi lần lập
 * kế hoạch. Mọi lượt ở đây CHỈ phụ thuộc (em, lúc) ⇒ bắt đầu CÙNG LÚC — nơi gọi biết sớm (vd. `lapGoi7` ngay khi biết em có gói) thì gọi sớm hơn nữa.
 * Cùng câu SQL, cùng tham số; mỗi lượt vẫn chạy SAU đúng lệnh tạo bảng của nó; trong cùng lượt không lệnh ghi nào đụng các bảng này trước lúc đọc cũ
 * (ghi của động cơ ở lô cuối, sau mọi lượt đọc). `ghi=false` ⇒ không đọc hai bảng chỉ phần ghi cần (như cũ). Lỗi: `som` giữ, nổi lên đúng chỗ `await` cũ.
 */
export interface DocTruocDongCo {
  sbd:string; now:number; ghi:boolean; ddl:Promise<void>
  so:Promise<Map<string,SuKienOmni[]>>; allowed:Promise<D1Result<{khoa:string}>>; xacNhan:Promise<D1Result<XacNhanThay>>
  offers:Promise<D1Result<Row>>; stats:Promise<D1Result<BangBandit>>; rewards:Promise<D1Result<{do_receipt:string}>>
  moHinh:Promise<MoHinhV6|null>; nhom:Promise<PhanNhom|null>; chonV6:Promise<D1Result<Row>>|null; emCu:Promise<DongDongCoCu|null>|null
  /** Gói R 15/10: em CHƯA có nhóm thử nghiệm (lần đầu) ⇒ đầu vào phân nhóm đọc NGAY sau lượt đọc nhóm (trước: nối tiếp sau danh mục — một đợt riêng); có nhóm ⇒ null, không đọc. */
  vaoNhom:Promise<Awaited<ReturnType<typeof docDauVaoNhom>>>|null
  /** Hai lượt đọc theo hồ sơ (β câu của `hs.cau`, dòng chiến dịch của `hs.chienDich`) — khoá theo đúng tham số; lệch ⇒ bắt đầu lại cho đúng tham số. */
  theoHoSo?:TheoHoSoDongCo
  /** Gói R 15/10: β câu ĐỌC ĐOÁN cho cả tập ứng viên của hồ sơ (`docBetaRongSom`, cùng đợt lượt đọc meta của hồ sơ). */
  betaRong?:{ds:ReadonlySet<string>;p:Promise<D1Result<{qid:string;beta:number}>>}
}
const SQL_BETA_CAU='SELECT qid,beta FROM omni_beta_cau WHERE qid IN (SELECT value FROM json_each(?))'
/**
 * β câu ĐỌC ĐOÁN (Gói R 15/10 — luật thầy 13/10 "sửa xong máy chủ phải nhanh hơn"): nơi gọi biết tập ứng viên của hồ sơ (`docHoSo2` › `khiCoQids`, trước lượt đọc
 * meta/lần làm) ⇒ đọc β của CẢ tập ấy cùng đợt — trước: chờ hồ sơ xong mới đọc β đúng `hs.cau` (một đợt D1 riêng). `docTruocDongCoTheoHoSo` chỉ dùng khi `hs.cau`
 * nằm trọn trong tập, và chỉ lấy ĐÚNG các dòng của `hs.cau` (khoá chính qid ⇒ cùng dòng như câu đọc cũ); không trọn ⇒ đọc như cũ. Chỉ đọc bảng β (không lệnh ghi nào đụng).
 */
export function docBetaRongSom(env:Env,t:DocTruocDongCo,qids:readonly string[]):void {
  if(t.theoHoSo)return
  t.betaRong={ds:new Set(qids),p:som(t.ddl.then(()=>env.DB.prepare(SQL_BETA_CAU).bind(JSON.stringify([...new Set(qids)])).all<{qid:string;beta:number}>()))}
}
/** Dòng chiến dịch đầy đủ của `hs.chienDich` (Gói R 15/10 — dùng lại dòng chiến dịch ĐÃ ĐỌC): lấy từ danh sách chiến dịch của em mà hồ sơ vừa đọc (`docChienDichThoCuaEm`,
 *  đệm dùng chung — CÙNG ảnh chụp đã dựng `hs.chienDich`) thay cho một lượt đọc lại bảng `chien_dich`; không thấy dòng ⇒ đọc như cũ. */
async function docChienDichDayDaDoc(env:Env,sbd:string,id:string):ReturnType<typeof docChienDichDay>{
  const r=(await docChienDichThoCuaEm(env,sbd)).find(x=>String(x.id)===id)
  return r?{qid_json:r.qid_json as string,ma_de_json:r.ma_de_json as string}:docChienDichDay(env,id)
}
interface TheoHoSoDongCo { khoaBeta:string; coCd:boolean; cdId:string; beta:Promise<D1Result<{qid:string;beta:number}>>; full:ReturnType<typeof docChienDichDay>|undefined }
type DongDongCoCu={cap_nhat_luc:number;bam_canh:string|null;canh_luc:number|null}
export function docTruocDongCo(env:Env,sbd:string,now:number,ghi=true):DocTruocDongCo {
  const ddl=som(chayDdlMotLan(env,'hanh_trinh_v4',SQL_DONG_CO_HANH_TRINH))
  const sau=<T,>(f:()=>Promise<T>):Promise<T>=>som(ddl.then(f))
  const ddl5=som(chayDdlMotLan(env,'hanh_trinh_v5',SQL_HANH_TRINH_V5)), ddl6=ghi?som(chayDdlMotLan(env,'hanh_trinh_v6',SQL_HT6)):null
  const nhom=som(ddl5.then(()=>docNhom(env,sbd)))
  return { sbd, now, ghi, ddl, nhom, vaoNhom:ghi?som(nhom.then(n=>n?null:docDauVaoNhom(env,sbd,now))):null,
    so:sau(()=>docSuKienOmni(env,[sbd])),
    allowed:sau(()=>env.DB.prepare(`SELECT khoa FROM su_kien_hoc WHERE sbd=? AND COALESCE(visibility,'')<>'embargoed' AND (nguon<>'thi' OR EXISTS(SELECT 1 FROM ca c WHERE c.ma_ca=su_kien_hoc.ma_nguon AND c.trang_thai<>'da_xoa' AND ${SQL_DA_CONG_BO('c')})) AND (nguon<>'luyen' OR EXISTS(SELECT 1 FROM luyen_de_2026 ld WHERE ld.id=su_kien_hoc.ma_nguon AND ld.sbd=su_kien_hoc.sbd AND ld.status='submitted') OR EXISTS(SELECT 1 FROM omni_de_thu dt WHERE dt.id=substr(su_kien_hoc.ma_nguon,8) AND su_kien_hoc.ma_nguon LIKE 'de_thu:%' AND dt.sbd=su_kien_hoc.sbd AND dt.nop_luc IS NOT NULL AND dt.nop_luc<=?))`).bind(sbd,new Date(now).toISOString()).all<{khoa:string}>()),
    xacNhan:sau(()=>env.DB.prepare('SELECT sbd,ma_dang AS maDang,ket,luc FROM omni_xac_nhan WHERE sbd=? AND luc<=?').bind(sbd,new Date(now).toISOString()).all<XacNhanThay>()),
    offers:sau(()=>env.DB.prepare('SELECT * FROM hanh_trinh_v4_can_thiep WHERE sbd=? AND goi_luc>=? AND do_luc IS NULL ORDER BY goi_luc DESC,ngay DESC,moc DESC LIMIT 96').bind(sbd,now-15*86400000).all<Row>()),
    stats:sau(()=>env.DB.prepare(`SELECT context,cach,SUM(CASE WHEN ket_qua=1 THEN 1 ELSE 0 END) dung,SUM(CASE WHEN ket_qua=0 THEN 1 ELSE 0 END) sai FROM hanh_trinh_v4_can_thiep WHERE do_luc>=? AND ket_qua IS NOT NULL GROUP BY context,cach`).bind(now-90*86400000).all<BangBandit>()),
    rewards:sau(()=>env.DB.prepare('SELECT do_receipt FROM hanh_trinh_v4_can_thiep WHERE sbd=? AND do_receipt IS NOT NULL').bind(sbd).all<{do_receipt:string}>()),
    moHinh:som(docMoHinhV6(env)),
    chonV6:ddl6?som(ddl6.then(()=>docChonV6(env,sbd,now))):null,
    emCu:ghi?sau(()=>env.DB.prepare(`SELECT cap_nhat_luc,json_extract(mo_hinh_json,'$.bamCanh') AS bam_canh,json_extract(mo_hinh_json,'$.canhLuc') AS canh_luc FROM hanh_trinh_v4_em WHERE sbd=?`).bind(sbd).first<DongDongCoCu>()):null,
  }
}
/** Như `docTruocDongCo` nhưng CHỈ khi ba nhóm bảng của động cơ đã tạo xong trong isolate (thường lệ): gọi rất sớm mà còn phải gửi lệnh tạo bảng (lệnh ghi)
 *  thì mọi lượt đọc gửi sau trong cùng lượt phải chờ nó — chậm hơn. Chưa sẵn ⇒ undefined (nơi gọi để động cơ tự đọc như trước). */
export function docTruocDongCoNeuSanBang(env:Env,sbd:string,now:number,ghi=true):DocTruocDongCo|undefined {
  return ddlDaXong(env,'hanh_trinh_v4')&&ddlDaXong(env,'hanh_trinh_v5')&&ddlDaXong(env,'hanh_trinh_v6')?docTruocDongCo(env,sbd,now,ghi):undefined
}
/** Bắt đầu SỚM hai lượt đọc theo hồ sơ (β câu, dòng chiến dịch đầy đủ) — gọi ngay khi có `hs` (vd. `lapGoi7` trước bước cổng khối). Đã bắt đầu cho đúng tham số ⇒ dùng lại. */
export function docTruocDongCoTheoHoSo(env:Env,t:DocTruocDongCo,hs:Pick<HoSo2,'cau'|'chienDich'>):TheoHoSoDongCo {
  const khoaBeta=JSON.stringify(hs.cau.map(c=>c.qid)), cd=hs.chienDich, coCd=!!cd, cdId=cd?String(cd.id):''
  const cu=t.theoHoSo
  if(cu&&cu.khoaBeta===khoaBeta&&cu.coCd===coCd&&cu.cdId===cdId)return cu
  const ddl5=som(chayDdlMotLan(env,'hanh_trinh_v5',SQL_HANH_TRINH_V5))
  const rong=t.betaRong,tap=new Set(hs.cau.map(c=>c.qid))
  const moi:TheoHoSoDongCo={khoaBeta,coCd,cdId,
    beta:rong&&[...tap].every(q=>rong.ds.has(q))?som(rong.p.then(r=>({...r,results:(r.results??[]).filter(x=>tap.has(x.qid))})))
      :som(t.ddl.then(()=>env.DB.prepare(SQL_BETA_CAU).bind(khoaBeta).all<{qid:string;beta:number}>())),
    full:cd?som(ddl5.then(()=>docChienDichDayDaDoc(env,t.sbd,String(cd.id)))):undefined}
  t.theoHoSo=moi
  return moi
}

/** Lô ghi cuối của động cơ (Gói R 15/10): `ghiTruoc` = lệnh ghi nơi gọi DỒN lại (vd. quota ngày Gói 7) — gửi ĐẦU lô (một đợt D1 thay vì thêm một đợt giữa lượt);
 *  `hoan` có ⇒ KHÔNG gửi lô: đẩy đủ lệnh (đúng thứ tự) vào `hoan` để nơi gọi tự gửi (mở chặng: song song lượt đọc câu, xong hẳn trước khi lưu phiên). */
export interface GhiDongCo { ghiTruoc?: readonly D1PreparedStatement[]; hoan?: D1PreparedStatement[] }
export async function dongCoHanhTrinh(env:Env,sbd:string,now:number,hs:HoSo2,chan:ReadonlySet<string>=new Set(),ghi=true,truoc?:DocTruocDongCo,ghiNoi:GhiDongCo={}):Promise<DongCoHanhTrinh> {
  const ghiTruoc=ghiNoi.ghiTruoc??[]
  // Đọc trước (đợt 18): dùng bản nơi gọi đã bắt đầu nếu ĐÚNG (em, lúc, ghi); không thì bắt đầu ngay tại đây — mọi lượt đọc độc lập đi CÙNG một đợt.
  const t=truoc&&truoc.sbd===sbd&&truoc.now===now&&truoc.ghi===ghi?truoc:docTruocDongCo(env,sbd,now,ghi)
  const th=docTruocDongCoTheoHoSo(env,t,hs)
  await t.ddl
  const [so,allowed,xacNhan]=await Promise.all([t.so,t.allowed,t.xacNhan])
  const hopLe=new Set(allowed.results.map(r=>r.khoa))
  const events=(so.get(sbd)??[]).filter(e=>hopLe.has(e.khoa) && e.receivedAt<=now)
  const ids=[...new Set([...hs.cau.map(c=>c.qid),...events.map(e=>e.qid)])]
  const [rawQ,metaCu]=await Promise.all([qCuaCau(env,ids),docMetaCau(env,ids.filter(q=>!hs.meta.has(q)))])
  // Gói R 15/10: danh mục của bộ chọn v5 (chỉ phụ thuộc hồ sơ + dòng chiến dịch, cùng đối số) bắt đầu NGAY đây, CÙNG đợt với cạnh lớp — trước: nối tiếp sau cạnh
  // lớp (một đợt D1 riêng khi đệm danh mục lạnh / đến hạn hỏi dấu kho). Bắt đầu SAU ma trận Q của động cơ ⇒ đệm câu đã ấm, danh mục không đọc lại các câu ấy.
  // Lỗi: `som` giữ, nổi lên đúng chỗ bộ chọn `await` như cũ.
  const dsSom=som(chayDdlMotLan(env,'hanh_trinh_v5',SQL_HANH_TRINH_V5).then(()=>danhMuc(env,hs,now,th.full)))
  const q=new Map<string,QCau>()
  for(const [id,c] of rawQ) {
    const m=hs.meta.get(id)??metaCu.get(id)
    q.set(id,{...c,mucDo:(m?.sao??0)>=2?'VDC':c.mucDo??(c.vkn.every(k=>k.startsWith('nen:'))?'NB':null)})
  }
  const qs=quanSatDocLap(sbd,events,q,now), graph=dungDoThi(qs,now), memory=fitHalfLife(qs)
  const targets=[...new Set(hs.cau.flatMap(c=>vknCaCau(q.get(c.qid)!)))]
  const [edges,offers,stats,beta,rewards]=await Promise.all([docCanhLop(env,targets,now),t.offers,t.stats,th.beta,t.rewards])
  const learned=canhDangHoc(edges), b=new Map((beta.results??[]).map(r=>[r.qid,r.beta]))
  const omni=phatLaiEm(sbd,{suKien:events,q,beta:b,homNay:new Date(now+7*3600000).toISOString().slice(0,10),xacNhan:xacNhan.results})
  const out:DongCoHanhTrinh={chan:new Set(chan),hen:new Map(),trongSo:{},soQuanSat:qs.length,soHalfLife:0,soCanhHoc:learned.length,p8:0}
  for(const c of hs.cau) {
    const qc=q.get(c.qid)!, kn=vknCaCau(qc), t=tangCuaCau(c)
    if(t===null) out.chan.add(c.qid)
    const due=henHalfLife(memory,kn)
    if(due) {out.hen.set(c.qid,due);out.soHalfLife++}
    const weakest=Math.min(...kn.map(k=>omni.vkn[k]?.p??0.3)), pc=xacSuatDungCau(omni,qc,omni.sEm)
    const information=Math.exp(-(((pc-0.8)/0.2)**2))
    const soft=learned.filter(e=>kn.includes(e.den) && omni.vkn[e.tu]?.trangThai!=='vung').length
    const minute=Math.max(0.25,msKyVong(b.get(c.qid)??null,omni.tau,qc.phan,qc.mucDo)/60000)
    const point=qc.phan==='II'?1:0.25
    out.trongSo[c.qid]=((1-weakest)+information+(hs.tt.get(c.qid)?.laMoi?0.2:0)-soft*0.1)*point/minute
  }
  // Lệnh ghi mức kỹ năng v5 đi CHUNG lô ghi cuối (đợt 18) khi chắc lô ấy được dựng (`hs.chienDich` có — lô cần mã chiến dịch); không thì ghi ngay như cũ.
  const ghiTre:D1PreparedStatement[]=[]
  const v5=await boChonV5(env,sbd,now,hs,q,qs,graph,omni,b,ghi,new Set(events.map(e=>e.contentGroup||q.get(e.qid)?.contentGroup||e.qid)),{moHinh:t.moHinh,nhom:t.nhom,...(t.vaoNhom?{vaoNhom:t.vaoNhom}:{}),full:th.full,ds:dsSom,...(ghi&&hs.chienDich?{ghiTre}:{})})
  out.v5=v5;for(const id of v5.chan)out.chan.add(id)
  if(v5.nhom==='B')out.trongSo={...out.trongSo,...v5.trongSo}
  // Hai hành động đều là câu thật, chưa gặp, thuộc tầng đã mở. Không rút video/học liệu tưởng tượng.
  const streak=chuoiSaiKyNang(qs),mucKet=(c:typeof hs.cau[number])=>Math.max(...vknCaCau(q.get(c.qid)!).map(k=>streak.get(k)??0))
  const stuck=hs.cau.filter(c=>mucKet(c)>=2).sort((a,b)=>mucKet(b)-mucKet(a) || a.qid.localeCompare(b.qid))
  for(const c of stuck) {
    const kn=vknCaCau(q.get(c.qid)!), weak=kn.filter(k=>(streak.get(k)??0)>=2).sort((a,b)=>(omni.vkn[a]?.p??0.3)-(omni.vkn[b]?.p??0.3))[0]!
    const actions=new Map<CachCuu,typeof hs.cau>()
    for(const x of hs.cau) {
      const tx=tangCuaCau(x),t=tangCuaCau(c),qc=q.get(x.qid)!
      if(!tx || !t || tx>=t || out.chan.has(x.qid) || hs.tt.get(x.qid)?.catTia || !hs.tt.get(x.qid)?.laMoi || !vknCaCau(qc).includes(weak)) continue
      const arm:CachCuu=tx===1?'on_nen':'vi_du_de'
      actions.set(arm,[...(actions.get(arm)??[]),x])
    }
    const context=`${weak.startsWith('nen:')?'nen':'dang'}:${(omni.vkn[weak]?.p??0.3)<0.5?'yeu':'giua'}:L${tangCuaCau(c)}`
    const pick=chonBandit(context,[...actions.keys()],stats.results??[],()=>{const a=new Uint32Array(1);crypto.getRandomValues(a);return (a[0]!+0.5)/4294967296})
    if(!pick) continue
    const chosen=actions.get(pick.cach)!.slice().sort((a,b)=>out.trongSo[b.qid]!-out.trongSo[a.qid]! || a.qid.localeCompare(b.qid))[0]!
    out.canThiep={qid:chosen.qid,nhom:hs.meta.get(chosen.qid)?.group||chosen.qid,kn:weak,context,cach:pick.cach,xacSuat:pick.xacSuat};break
  }
  // Dự báo trên cửa sổ nội dung của em; ghi rõ phạm vi, không coi là xác suất đã hiệu chuẩn của đề thật.
  const scope=hs.cau.filter(c=>c.nguon==='chien_dich').map(c=>q.get(c.qid)!)
  const forecast=duBaoDiem(omni,scope,{chiKyVong:true}), cursor=omni.cursor
  out.p8=forecast.p8
  if(!ghi){if(ghiNoi.hoan)ghiNoi.hoan.push(...ghiTruoc);else if(ghiTruoc.length)await env.DB.batch([...ghiTruoc]);return out}
  await ghiDoV6(env,sbd,now,qs,t.chonV6??undefined)
  const firstSeen=new Map<string,number>()
  for(const e of events) {const g=e.contentGroup||q.get(e.qid)?.contentGroup||e.qid;firstSeen.set(g,Math.min(firstSeen.get(g)??Infinity,e.receivedAt))}
  const updates=phanBoCanThiep(offers.results??[],qs,firstSeen,new Set(rewards.results.map(r=>r.do_receipt)))
  const rows=graph.canh.map(c=>({...c,sbd}))
  // CHỈ GHI CẠNH KHI ĐỔI (đợt 17 — thầy: "bắt buộc tối ưu máy chủ chuyên sâu"; số đo D1 thật 12/10: mỗi lần lập kế hoạch ghi lại TOÀN BỘ bảng cạnh của em
  // ~124 dòng ⇒ ~2,5 triệu dòng ghi/ngày, kể cả khi em chưa làm câu nào mới). Cạnh là số dẫn xuất từ sổ học: bản băm giống lần ghi trước VÀ lần ghi ấy
  // chưa quá 20 giờ ⇒ giữ nguyên các dòng cạnh (bảng y hệt). Vẫn làm mới tối thiểu mỗi 20 giờ để cạnh của em còn trong cửa sổ 7 ngày của số liệu lớp.
  const chuoiCanh=JSON.stringify(graph.canh.map(c=>[c.tu,c.den,c.nCo,c.dungCo,c.nChua,c.dungChua])),bamCanh=`${bam(chuoiCanh)}:${bam(chuoiCanh.split('').reverse().join(''))}:${chuoiCanh.length}`
  const old=await t.emCu!
  const canhLucCu=Number(old?.canh_luc)
  const giuCanh=!!old&&old.bam_canh===bamCanh&&Number.isFinite(canhLucCu)&&now>=canhLucCu&&now-canhLucCu<20*3_600_000
  const snapshot={halfLife:memory,canh:graph.canh,soQuanSat:qs.length,soHalfLife:out.soHalfLife,soCanhHoc:learned.length,duBao:forecast,phamVi:'ung_vien_ngay',soCau:scope.length,bamCanh,canhLuc:giuCanh?canhLucCu:now}
  const commands=[
    ...ghiTruoc,
    ...ghiTre,
    ...(giuCanh?[]:[env.DB.prepare(`UPDATE hanh_trinh_v4_canh SET n_co=0,dung_co=0,n_chua=0,dung_chua=0,cap_nhat_luc=? WHERE sbd=? AND cap_nhat_luc<=? AND ${KHONG_CA}`).bind(now,sbd,Math.min(old?.cap_nhat_luc??now,now))]),
    env.DB.prepare(`INSERT INTO hanh_trinh_v4_em SELECT ?,?,?,?,? WHERE ${KHONG_CA} ON CONFLICT(sbd) DO UPDATE SET cursor=excluded.cursor,phien_ban=excluded.phien_ban,mo_hinh_json=excluded.mo_hinh_json,cap_nhat_luc=excluded.cap_nhat_luc WHERE excluded.cap_nhat_luc>=hanh_trinh_v4_em.cap_nhat_luc`).bind(sbd,cursor,'ht4-0910-v1',JSON.stringify(snapshot),now),
    ...(giuCanh?[]:[env.DB.prepare(`INSERT INTO hanh_trinh_v4_canh SELECT ?,json_extract(value,'$.tu'),json_extract(value,'$.den'),json_extract(value,'$.nCo'),json_extract(value,'$.dungCo'),json_extract(value,'$.nChua'),json_extract(value,'$.dungChua'),? FROM json_each(?) WHERE ${KHONG_CA} ON CONFLICT(sbd,tu,den) DO UPDATE SET n_co=excluded.n_co,dung_co=excluded.dung_co,n_chua=excluded.n_chua,dung_chua=excluded.dung_chua,cap_nhat_luc=excluded.cap_nhat_luc WHERE excluded.cap_nhat_luc>=hanh_trinh_v4_canh.cap_nhat_luc`).bind(sbd,now,JSON.stringify(rows))]),
  ]
  // Tối đa một receipt cho mỗi chặng cũ; không tăng mẫu khi đọc lại hoặc hai thiết bị.
  commands.push(env.DB.prepare(`UPDATE hanh_trinh_v4_can_thiep SET do_receipt=(SELECT json_extract(value,'$.d.receipt') FROM json_each(?1) WHERE json_extract(value,'$.r.ngay')=hanh_trinh_v4_can_thiep.ngay AND json_extract(value,'$.r.moc')=hanh_trinh_v4_can_thiep.moc),dung_luc=(SELECT json_extract(value,'$.d.dungLuc') FROM json_each(?1) WHERE json_extract(value,'$.r.ngay')=hanh_trinh_v4_can_thiep.ngay AND json_extract(value,'$.r.moc')=hanh_trinh_v4_can_thiep.moc),do_luc=(SELECT json_extract(value,'$.d.doLuc') FROM json_each(?1) WHERE json_extract(value,'$.r.ngay')=hanh_trinh_v4_can_thiep.ngay AND json_extract(value,'$.r.moc')=hanh_trinh_v4_can_thiep.moc),ket_qua=(SELECT json_extract(value,'$.d.ketQua') FROM json_each(?1) WHERE json_extract(value,'$.r.ngay')=hanh_trinh_v4_can_thiep.ngay AND json_extract(value,'$.r.moc')=hanh_trinh_v4_can_thiep.moc) WHERE sbd=?2 AND do_luc IS NULL AND EXISTS(SELECT 1 FROM json_each(?1) WHERE json_extract(value,'$.r.ngay')=hanh_trinh_v4_can_thiep.ngay AND json_extract(value,'$.r.moc')=hanh_trinh_v4_can_thiep.moc) AND NOT EXISTS(SELECT 1 FROM hanh_trinh_v4_can_thiep claimed JOIN json_each(?1) u ON json_extract(u.value,'$.r.ngay')=hanh_trinh_v4_can_thiep.ngay AND json_extract(u.value,'$.r.moc')=hanh_trinh_v4_can_thiep.moc AND json_extract(u.value,'$.d.receipt')=claimed.do_receipt WHERE claimed.sbd=hanh_trinh_v4_can_thiep.sbd AND (claimed.ngay<>hanh_trinh_v4_can_thiep.ngay OR claimed.moc<>hanh_trinh_v4_can_thiep.moc)) AND ${KHONG_CA}`).bind(JSON.stringify(updates),sbd))
  // Dự báo OMNI khoá theo mã chiến dịch ⇒ em Gói 7 không thuộc chiến dịch nào (quét 15/10: trước đây nổ ở `hs.chienDich!.id`, sảnh báo lỗi) thì bỏ dòng này.
  if(hs.chienDich) {
    await damBaoBangOmni(env)
    commands.push(env.DB.prepare(`INSERT INTO omni_du_bao(sbd,pham_vi,ky_vong,p8,sai_so,s_dung,con_duong,con_thieu_json,so_bang_chung,luc) SELECT ?,?,?,?,?,?,?,?,?,? WHERE ${KHONG_CA} ON CONFLICT(sbd,pham_vi) DO UPDATE SET ky_vong=excluded.ky_vong,p8=excluded.p8,sai_so=excluded.sai_so,s_dung=excluded.s_dung,con_duong=excluded.con_duong,con_thieu_json=excluded.con_thieu_json,so_bang_chung=excluded.so_bang_chung,luc=excluded.luc`).bind(sbd,`${hs.chienDich.id}:ung_vien_ngay`,forecast.kyVong,forecast.p8,forecast.saiSo,omni.sEm,forecast.conDuong,JSON.stringify(forecast.conThieu),forecast.soBangChung,new Date(now).toISOString()))
  }
  // Gói lớn có trần 30 lệnh; mỗi lệnh tự kiểm ca, không ghi điểm/sổ học.
  if(ghiNoi.hoan){ghiNoi.hoan.push(...commands);return out}
  for(let i=0;i<commands.length;i+=30) await env.DB.batch(commands.slice(i,i+30))
  return out
}
export function lenhGhiCanThiep(env:Env,sbd:string,ngay:string,moc:number,now:number,d:DongCoHanhTrinh,qids:readonly string[]) {
  const c=d.canThiep
  return c && qids.includes(c.qid)?env.DB.prepare(`INSERT OR IGNORE INTO hanh_trinh_v4_can_thiep(sbd,ngay,moc,qid,nhom,ky_nang,context,cach,xac_suat,goi_luc) SELECT ?,?,?,?,?,?,?,?,?,? WHERE ${KHONG_CA} AND changes()=1`).bind(sbd,ngay,moc,c.qid,c.nhom,c.kn,c.context,c.cach,c.xacSuat,now):null
}
