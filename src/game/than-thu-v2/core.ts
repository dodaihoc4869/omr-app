import { normalizeNumericAnswer } from '../../engine/score'
import { cauHopKhoi, type Khoi } from '../../lib/khoi-cau'

export const PETS = [
  { id:'dat_quy', name:'Thạch Quy', element:'Đất', shape:'quy', color:'rgb(180,130,62)', accent:'rgb(86,180,136)', skill:'Chia bài thành từng bước' },
  { id:'nuoc_long', name:'Thuỷ Long', element:'Nước', shape:'long', color:'rgb(43,166,208)', accent:'rgb(127,235,242)', skill:'Ôn lại câu đến hạn' },
  { id:'lua_phuong', name:'Viêm Sư', element:'Lửa', shape:'phuong', color:'rgb(241,99,59)', accent:'rgb(255,201,87)', skill:'Thử câu cùng dạng mới' },
  { id:'khi_lang', name:'Phong Thố', element:'Khí', shape:'lang', color:'rgb(175,203,206)', accent:'rgb(102,233,189)', skill:'So sánh các cách làm' },
  { id:'ductin_lan', name:'Tinh Lang', element:'Đức tin', shape:'lan', color:'rgb(65,101,183)', accent:'rgb(235,192,91)', skill:'Thử lại sau khi sửa lỗi' },
  { id:'tinhyeu_ho', name:'Ái Hồ', element:'Tình yêu', shape:'ho', color:'rgb(224,114,163)', accent:'rgb(245,181,215)', skill:'Đọc kỹ lý do từng đáp án' },
  { id:'bieton_huou', name:'Ân Lộc', element:'Lòng biết ơn', shape:'huou', color:'rgb(171,158,89)', accent:'rgb(122,189,148)', skill:'Ghi nhớ điều vừa học' },
  { id:'sangy_cu', name:'Minh Linh', element:'Sự sáng ý thức', shape:'cu', color:'rgb(171,164,224)', accent:'rgb(99,225,227)', skill:'Tự kiểm trước khi trả lời' },
] as const
export const ALIASES: Record<string,string> = {hoa_long:'lua_phuong',thuy_quai:'nuoc_long',thiet_giap:'dat_quy',loi_dieu:'khi_lang',loi_kim:'ductin_lan',moc_tinh:'tinhyeu_ho',khi_bang:'khi_lang',ductin_su:'ductin_lan',sangy_ma:'sangy_cu'}
export const OLD_SIX = new Set(['hoa_long','thuy_quai','thiet_giap','loi_dieu','loi_kim','moc_tinh'])
export const DAY = 86400000
export type Mode = 'adventure'|'repair'|'tower'|'arena'
export interface Question {
  qid:string; maDe:string; version:string; group:string; phan:'I'|'II'|'III'; text:string
  choices:string[]; ideas:string[]; table?:string[][]; thanCauImg?:string; imageDataUrl?:string
  choiceImgs?:string[]; ideaImgs?:string[]; hinhAnh:{src:string;viTri:string;alt?:string}[]
  dang:string|null; tenDang:string; mucDo:string|null; sao:number|null; kienThuc:string[]
}
export interface PrivateQuestion extends Question { correct:string; solution:unknown; reviewed:boolean }
export interface Evidence { qid:string; group:string; dang:string|null; mucDo:string|null; kienThuc:string[]; wrong:boolean; date:string; ca:string }
export interface Attempt { id:string; session:string; group:string; qid:string; dang:string|null; mucDo:string|null; correct:boolean; assisted:boolean; at:number; novel:boolean }
export interface Mastery { key:string; stage:number; first:number; due:number; groups:string[]; repaired:boolean }
export function publicQuestion(q:PrivateQuestion):Question {
  const {correct:_,solution:__,reviewed:___,...pub}=q
  return {...pub,hinhAnh:pub.hinhAnh.filter(h=>h.viTri!=='sau_loi_giai')}
}
export function grade(q:Pick<PrivateQuestion,'phan'|'correct'>, answer:string):boolean {
  if(!answer.trim()) return false
  return q.phan==='III' ? normalizeNumericAnswer(answer)===normalizeNumericAnswer(q.correct) : answer.trim().toUpperCase()===q.correct
}
export function allowed(q:Question, evidence:Evidence[], blocked:Set<string>):boolean {
  if(blocked.has(q.qid)||blocked.has(q.group)) return false
  if(evidence.some(e=>e.qid===q.qid)) return true
  // Unknown prerequisite sets are never guessed from a chapter title.
  if(!q.dang||!q.mucDo||!q.kienThuc.length) return false
  const same=evidence.filter(e=>e.dang===q.dang)
  const known=new Set(same.flatMap(e=>e.kienThuc))
  return same.length>0 && q.kienThuc.every(k=>known.has(k))
}
const LEVELS=['biet','hieu','van_dung']
export function targetLevel(dang:string|null,evidence:Evidence[],attempts:Attempt[]):number {
  const base=evidence.filter(e=>e.dang===dang).map(e=>LEVELS.indexOf(e.mucDo??'')).filter(n=>n>=0)
  let level=base.length?Math.min(...base):0
  for(let l=level;l<2;l++) {
    const recent=attempts.filter(a=>a.dang===dang&&a.mucDo===LEVELS[l]&&!a.assisted&&a.novel)
    const distinct=[...new Map(recent.map(a=>[a.group,a])).values()].slice(-5)
    if(distinct.length===5&&distinct.filter(a=>a.correct).length>=4&&new Set(distinct.map(a=>a.session)).size>=2) level=l+1
    else break
  }
  const last=attempts.filter(a=>a.dang===dang&&!a.correct).slice(-2)
  if(last.length===2&&last[0]!.group!==last[1]!.group&&attempts.slice(-2).every(a=>!a.correct)) level=Math.max(0,level-1)
  return level
}
/** Vai của một câu trong lượt 6 câu — đúng bốn suất của công thức chọn câu: 2 yếu · 1 tới hạn · lấp · 1 thử thách. Chỉ để KỂ cho em nghe, không đổi cách chọn. */
export type QuestionRole='yeu'|'toi_han'|'lap'|'thu_thach'
export function chooseSession(pool:PrivateQuestion[],evidence:Evidence[],attempts:Attempt[],mastery:Mastery[],mode:Mode,now:number):PrivateQuestion[] {return chooseSessionWithRoles(pool,evidence,attempts,mastery,mode,now).map(x=>x.q)}
export function chooseSessionWithRoles(pool:PrivateQuestion[],evidence:Evidence[],attempts:Attempt[],mastery:Mastery[],mode:Mode,now:number):{q:PrivateQuestion;role:QuestionRole}[] {
  const key=(q:Question)=>q.dang??q.group
  const latest=new Map<string,Attempt>(),counts=new Map<string,number>()
  for(const a of [...attempts].sort((a,b)=>a.at-b.at)){latest.set(a.group,a);counts.set(a.group,(counts.get(a.group)??0)+1)}
  const weak=new Set(evidence.filter(e=>e.wrong&&!latest.get(e.group)?.correct).map(e=>e.dang??e.group))
  for(const a of latest.values())if(!a.correct||a.assisted)weak.add(a.dang??a.group)
  const due=new Set(mastery.filter(m=>m.due<=now).map(m=>m.key))
  const recent=new Set([...attempts].sort((a,b)=>a.at-b.at).slice(-24).map(a=>a.group))
  const levels=new Map<string|null,number>()
  const target=(dang:string|null)=>{if(!levels.has(dang))levels.set(dang,targetLevel(dang,evidence,attempts));return levels.get(dang)!}
  const level=(q:Question)=>q.mucDo===null?-1:LEVELS.indexOf(q.mucDo)
  const suitable=(q:Question)=>level(q)<=target(q.dang)
  // Fresh material first; repeated answers are spaced, with a least-recent fallback
  // for small eligible banks. Never broaden the server's curriculum/protection scope.
  const tier=(q:Question)=>{const a=latest.get(q.group);if(!a)return 0
    const gap=(!a.correct||a.assisted)?20*60000:((counts.get(q.group)??1)>=3?7*DAY:DAY)
    if(now-a.at>=gap&&!recent.has(q.group))return 1
    return recent.has(q.group)?3:2}
  const rank=(q:Question)=>{let h=2166136261;for(const c of q.group)h=Math.imul(h^c.charCodeAt(0),16777619);return (h^(Math.floor(now/3600000)+attempts.length)*2654435761)>>>0}
  const sorted=pool.filter(q=>q.reviewed).sort((a,b)=>tier(a)-tier(b)||(latest.get(a.group)?.at??0)-(latest.get(b.group)?.at??0)||(counts.get(a.group)??0)-(counts.get(b.group)??0)||rank(a)-rank(b)||a.qid.localeCompare(b.qid))
  const used=new Set<string>(),out:PrivateQuestion[]=[],roles=new Map<string,QuestionRole>()
  const withRoles=()=>out.slice(0,6).map(q=>({q,role:roles.get(q.qid)??'lap'}))
  const topics=new Map<string,number>()
  const add=(list:PrivateQuestion[],n:number,role:QuestionRole='lap')=>{while(n>0){const candidates=list.filter(q=>!used.has(q.group));if(!candidates.length)break
    // Rotate topics within the same freshness tier, rather than six copies of one skill.
    const bestTier=tier(candidates[0]!);const q=candidates.filter(q=>tier(q)===bestTier).sort((a,b)=>(topics.get(key(a))??0)-(topics.get(key(b))??0))[0]!
    used.add(q.group);topics.set(key(q),(topics.get(key(q))??0)+1);out.push(q);roles.set(q.qid,role);n--}}
  const base=sorted.filter(suitable)
  if(mode==='repair'){add(base.filter(q=>weak.has(key(q))),6,'yeu');return withRoles()}
  // Keep repair/review quotas only when a non-recent candidate is available.
  add(base.filter(q=>tier(q)<=1&&weak.has(key(q))),2,'yeu')
  add(base.filter(q=>tier(q)<=1&&due.has(key(q))),1,'toi_han')
  add(base.filter(q=>tier(q)<=1),5-out.length)
  // One measured challenge, never more than one difficulty step ahead.
  add(sorted.filter(q=>tier(q)<=1&&level(q)===target(q.dang)+1),1,'thu_thach')
  add(base,6-out.length)
  return withRoles()
}
/**
 * Thưởng EXP khi một dạng lên NẤC 1 · 2 · 3 (một nguồn duy nhất). Đổi 21/09/2026 (thầy chốt Điều 9): 20/40/40 ⇒ 10/20/30 để game không đủ một mình làm thú ăn no
 * (nấc quý nhất là nấc 3 — nhớ được sau 7 ngày). Tổng đã trả cho một dạng ở nấc cao nhất: 10 · 30 · 60 (cũ 20 · 60 · 100) — `CHENH_THUONG_NAC` của `hap-thu-ngay.ts` lấy đúng phần chênh.
 */
export const THUONG_NAC = [10, 20, 30] as const
export function advance(old:Mastery|undefined,a:Attempt):{mastery:Mastery;reward:number;milestone:number} {
  const m:Mastery=old?{...old,groups:[...old.groups]}:{key:a.dang??a.group,stage:0,first:0,due:0,groups:[],repaired:false}
  if(!a.correct||a.assisted) {m.due=a.at+DAY;return {mastery:m,reward:0,milestone:0}}
  let reward=0
  if(m.stage===0){m.stage=1;m.first=a.at;m.due=a.at+DAY;m.groups=[a.group];reward=THUONG_NAC[0]}
  else if(m.stage===1&&a.novel&&!m.groups.includes(a.group)&&a.at>=m.due){m.stage=2;m.groups.push(a.group);m.due=Math.max(a.at+3*DAY,m.first+7*DAY);reward=THUONG_NAC[1]}
  else if(m.stage===2&&a.novel&&!m.groups.includes(a.group)&&a.at>=m.due&&a.at>=m.first+7*DAY){m.stage=3;m.groups.push(a.group);m.repaired=true;m.due=a.at+7*DAY;reward=THUONG_NAC[2]}
  if(m.stage===3&&reward===0)m.due=a.at+7*DAY
  return {mastery:m,reward,milestone:reward?m.stage:0}
}

/* ══════════════════════════ BỘ CHỌN LƯỢT MỚI — ĐỢT 2 (thầy chốt 21/09/2026) ══════════════════════════
 * Thuần, tất định, KHÔNG đổi `chooseSession*` cũ (máy chủ cũ vẫn chạy). Điều 3–5 của `DE-XUAT-THAN-THU-MOI-NGAY-2109.md`:
 *  • KHO = phần LỚP đã học (máy chủ đưa vào `pool`): bỏ điều kiện "chính em phải có bằng chứng cùng dạng"; vẫn chặn `blocked`, không tự luận (máy chủ lọc trước, hàm còn kiểm `phan`),
 *    bậc ≤ bậc của em ở dạng đó (+1 CHỈ cho suất thử thách và Lượt trùm); dạng em chưa có bằng chứng ⇒ bậc Biết (`targetLevel`).
 *  • CHỐNG LẶP: mỗi lượt ≥ 3 (thực tế ≥ 4) câu em CHƯA TỪNG gặp khi kho còn, ≤ 2 câu cũ; câu SAI quay lại sớm nhất NGÀY VN hôm sau; đã sai ≥ 3 lần ⇒ đổi sang câu KHÁC cùng dạng;
 *    câu đã ĐÚNG nghỉ 30 ngày. Lượt ôn (`mastery`) vốn đòi nhóm mới nên không cần ngoại lệ.
 *  • LOẠI LƯỢT: `khoi_dong` (đúng bậc, chỉ Phần I) · `kham_pha` (ưu tiên dạng em chưa gặp; 1 câu dài, lượt thưởng 2 câu dài) · `trum` (6 câu bậc + 1 từ CẢ kho, ≥ 3 câu dài Phần II/III).
 *    Trần câu dài theo cấp thú: 1–9 ⇒ 1 · 10–29 ⇒ 2 · ≥ 30 ⇒ 3 (Lượt trùm không theo trần này). Em không có câu yếu: 1 tới hạn + 3 mới đúng bậc + 2 thử thách.
 *  • THANG NỚI khi thiếu câu: dạng đang học → dạng đã học khác → bậc + 1 → câu lâu nhất chưa gặp; KHÔNG trả rỗng khi kho còn câu. */
export type LoaiLuot='khoi_dong'|'kham_pha'|'trum'
export type QuestionRoleV2=QuestionRole|'moi'|'trum'
export const NGAY_NGHI_CAU_DUNG=30
export const LAN_SAI_DOI_CAU=3
export const SO_CAU_MOI_LUOT=6
/** Trần số câu DÀI (Phần II/III) trong một lượt thường theo cấp thú. Lượt trùm không theo trần này. */
export const tranCauDaiTheoCap=(cap:number)=>cap>=30?3:cap>=10?2:1
const GIO_VN=7*3600000
const ngayVnChi=(ms:number)=>Math.floor((ms+GIO_VN)/DAY)
const ngayVnChuoi=(ms:number)=>new Date(ms+GIO_VN).toISOString().slice(0,10)
export interface OptLuot { loai:LoaiLuot; cap:number; now:number; /** LUẬT KHỐI (Boss 21/09, P0 khối 11 nhận câu khối 12): khối của em — câu của tờ khối CAO hơn KHÔNG BAO GIỜ vào lượt, dù trùng mã dạng. Bỏ trống / không rõ ⇒ không lọc (máy chủ vẫn lọc kho ở `readScope`; đây là lớp bảo hiểm thứ hai, ở chính hàm chọn). */ khoiEm?:Khoi|null; /** Lượt thưởng: lượt khám phá có 2 câu dài (thay vì 1). */ thuong?:boolean; blocked?:ReadonlySet<string>; soCau?:number }
export interface CauLuot { q:PrivateQuestion; role:QuestionRoleV2; dai:boolean; moi:boolean }
interface ThongKeNhom { gap:number; sai:number; lucSaiCuoi:number; lucDungCuoi:number; lucCuoi:number }
export function chooseLuotMoi(pool:PrivateQuestion[],evidence:Evidence[],attempts:Attempt[],mastery:Mastery[],opt:OptLuot):CauLuot[] {
  const N=Math.max(1,Math.min(12,Math.floor(opt.soCau??SO_CAU_MOI_LUOT))),now=opt.now,hom=ngayVnChi(now),homChuoi=ngayVnChuoi(now)
  const blocked=opt.blocked??new Set<string>()
  const tk=new Map<string,ThongKeNhom>();const lay=(g:string)=>{let t=tk.get(g);if(!t){t={gap:0,sai:0,lucSaiCuoi:-1,lucDungCuoi:-1,lucCuoi:-1};tk.set(g,t)}return t}
  for(const a of [...attempts].sort((x,y)=>x.at-y.at)){const t=lay(a.group);t.gap++;t.lucCuoi=a.at;if(a.correct&&!a.assisted)t.lucDungCuoi=a.at;else t.lucSaiCuoi=a.at;if(!a.correct)t.sai++}
  const saiHomNayEv=new Set<string>()
  for(const e of evidence){const t=lay(e.group);t.gap++;if(e.wrong){t.sai++;if(e.date>=homChuoi)saiHomNayEv.add(e.group)}}
  const daGapDang=new Set<string>();for(const q of pool)if(tk.has(q.group)&&q.dang)daGapDang.add(q.dang)
  const gapNhom=(q:Question)=>(tk.get(q.group)?.gap??0)>0
  const saiHomNay=(q:Question)=>{const t=tk.get(q.group);return saiHomNayEv.has(q.group)||(!!t&&t.lucSaiCuoi>=0&&ngayVnChi(t.lucSaiCuoi)>=hom&&t.lucSaiCuoi>=t.lucDungCuoi)}
  const sai3=(q:Question)=>(tk.get(q.group)?.sai??0)>=LAN_SAI_DOI_CAU
  const dung30=(q:Question)=>{const t=tk.get(q.group);return !!t&&t.lucDungCuoi>=0&&hom-ngayVnChi(t.lucDungCuoi)<NGAY_NGHI_CAU_DUNG}
  const key=(q:Question)=>q.dang??q.group
  const weak=new Set(evidence.filter(e=>e.wrong).map(e=>e.dang??e.group))
  for(const a of attempts)if(!a.correct||a.assisted)weak.add(a.dang??a.group)
  const due=new Set(mastery.filter(m=>m.due<=now).map(m=>m.key))
  const levels=new Map<string|null,number>();const target=(d:string|null)=>{if(!levels.has(d))levels.set(d,targetLevel(d,evidence,attempts));return levels.get(d)!}
  const level=(q:Question)=>q.mucDo===null?-1:LEVELS.indexOf(q.mucDo)
  const dai=(q:Question)=>q.phan!=='I'
  const rank=(q:Question)=>{let h=2166136261;for(const c of q.group)h=Math.imul(h^c.charCodeAt(0),16777619);return (h^(Math.floor(now/3600000)+attempts.length)*2654435761)>>>0}
  const kho=pool.filter(q=>q.reviewed&&!blocked.has(q.qid)&&!blocked.has(q.group)&&cauHopKhoi(opt.khoiEm,q)&&(q.phan==='I'||q.phan==='II'||q.phan==='III'))
  const nhanCoYeu=kho.some(q=>weak.has(key(q))&&level(q)<=target(q.dang)&&!saiHomNay(q)),nhanCoTH=kho.some(q=>due.has(key(q))&&level(q)<=target(q.dang)&&!saiHomNay(q))
  const tranDai=opt.loai==='trum'?N:Math.min(opt.thuong?2:1,tranCauDaiTheoCap(opt.cap))
  const tranDaiToiDa=opt.loai==='trum'?N:tranCauDaiTheoCap(opt.cap)
  type Suat={role:QuestionRoleV2;mucCao:boolean;dai:boolean}
  let suat:Suat[]
  const S=(role:QuestionRoleV2,mucCao=false,dai=false):Suat=>({role,mucCao,dai})
  if(opt.loai==='trum')suat=Array.from({length:N},(_,i)=>S('trum',true,i<3))
  else{
    const goc:QuestionRoleV2[]=opt.loai==='khoi_dong'
      ?(nhanCoYeu?['yeu','yeu',...(nhanCoTH?['toi_han' as const]:[]),'moi','moi','moi','moi']:[...(nhanCoTH?['toi_han' as const]:[]),'moi','moi','moi','moi','moi','moi'])
      :(nhanCoYeu?['yeu','yeu',...(nhanCoTH?['toi_han' as const]:[]),'moi','moi','thu_thach','moi']:[...(nhanCoTH?['toi_han' as const]:[]),'moi','moi','moi','thu_thach','thu_thach','moi'])
    let daiCon=opt.loai==='khoi_dong'?0:tranDai
    suat=goc.slice(0,N).map(r=>{const dsd=r==='moi'&&daiCon>0;if(dsd)daiCon--;return S(r,r==='thu_thach',dsd)})
  }
  // Thứ tự chọn: suất yếu / tới hạn (mục tiêu sư phạm) → thử thách → suất DÀI của khám phá → còn lại; Lượt trùm giữ nguyên (3 suất dài đứng đầu). Hạn mức câu dài tính CHUNG cho cả lượt.
  const uuTien=(x:Suat)=>opt.loai==='trum'?(x.dai?0:1):x.role==='yeu'||x.role==='toi_han'?0:x.role==='thu_thach'?1:x.dai?2:3
  suat=suat.map((x,i)=>({x,i})).sort((a,b)=>uuTien(a.x)-uuTien(b.x)||a.i-b.i).map(o=>o.x)
  const dung=new Set<string>(),out:CauLuot[]=[];let soDai=0,soCu=0
  // THANG NỚI (5 mức): 0 chặt · 1 bỏ đòi câu dài · 2 cho bậc + 1 (suất thường) · 3 cho câu sai ≥ 3 lần / đúng chưa đủ 30 ngày · 4 cho cả câu sai hôm nay và lấy quá hạn mức câu dài ("câu lâu nhất chưa gặp").
  // Suất chuyên biệt (yếu, tới hạn) chỉ đi tới mức 1; hết câu thì đổi thành suất mới / lấp. KHÔNG BAO GIỜ vượt bậc + 1 ở mọi mức.
  const thuTuNoi=[0,1,2,3,4] as const
  const noiToiDa=(r:QuestionRoleV2)=>r==='yeu'||r==='toi_han'?1:4
  const hopLe=(q:PrivateQuestion,s:Suat,noi:number)=>{
    if(dung.has(q.group))return false
    const L=level(q),T=target(q.dang),T1=Math.min(2,T+1)
    if(s.mucCao){if(noi<=1?L!==T1:noi===2?!(L>=T&&L<=T1):(L>T1||L<0))return false}   // câu chưa rõ bậc (mucDo null) KHÔNG BAO GIỜ vào suất thử thách / Lượt trùm
    else if(!(L<=T||(noi>=2&&L===T+1)))return false
    if(opt.loai==='khoi_dong'&&noi<4&&dai(q))return false
    if(opt.loai!=='trum'&&dai(q)&&soDai>=Math.min(tranDai,tranDaiToiDa)&&noi<4)return false   // MỘT lượt thường: câu dài ≤ 1 (thưởng ≤ 2) VÀ ≤ trần theo cấp thú
    if(s.dai&&noi<1&&!dai(q))return false
    if(noi<3&&(sai3(q)||dung30(q)))return false
    if(noi<4&&saiHomNay(q))return false
    if(s.role==='yeu'&&!weak.has(key(q)))return false
    if(s.role==='toi_han'&&!due.has(key(q)))return false
    return true
  }
  const tot=(a:PrivateQuestion,b:PrivateQuestion,s:Suat)=>{
    const ma=gapNhom(a)?1:0,mb=gapNhom(b)?1:0
    if(ma!==mb)return ma-mb                                  // câu CHƯA gặp trước
    if(s.role==='moi'&&opt.loai==='kham_pha'){const da=daGapDang.has(a.dang??'')?1:0,db=daGapDang.has(b.dang??'')?1:0;if(da!==db)return da-db}  // khám phá: dạng em chưa gặp trước
    const la=tk.get(a.group)?.lucCuoi??-1,lb=tk.get(b.group)?.lucCuoi??-1
    if(la!==lb)return la-lb                                   // lâu chưa gặp trước
    return rank(a)-rank(b)||a.qid.localeCompare(b.qid)
  }
  const datSuat=(s:Suat):boolean=>{
    for(const noi of thuTuNoi){
      if(noi>noiToiDa(s.role))break
      let ds=kho.filter(q=>hopLe(q,s,noi))
      if(!ds.length)continue
      if(soCu>=2){const moi=ds.filter(q=>!gapNhom(q));if(moi.length)ds=moi}
      ds.sort((a,b)=>tot(a,b,s));const q=ds[0]!
      dung.add(q.group);out.push({q,role:s.role,dai:dai(q),moi:!gapNhom(q)});if(dai(q))soDai++;if(gapNhom(q))soCu++
      return true
    }
    return false
  }
  for(const s of suat)if(!datSuat(s)){
    // suất chuyên biệt không có câu phù hợp ⇒ đổi thành suất "mới/lấp" (không trả thiếu khi kho còn)
    if(s.role!=='moi'&&s.role!=='lap'&&s.role!=='trum')datSuat(S(s.role==='thu_thach'?'lap':'moi',false,false))
  }
  while(out.length<N&&datSuat(S(opt.loai==='trum'?'trum':'lap',opt.loai==='trum',false)));
  return out.slice(0,N)
}

/**
 * LUẬT "XONG CHẶNG / XONG ÔN TỚI HẠN" cho `luotHomNay` — MỘT chỗ (Boss 21/09 chiều; sửa hai chỗ lỏng của W2a: 1 câu chặng, 1 câu ôn đã mở lượt).
 *   • `coBaiConChang` = có bài tập về nhà ĐANG CHẠY còn ít nhất một chặng CHƯA xong (bài đã xong hết chặng nhưng chưa bấm nộp KHÔNG tính là đang chạy).
 *     Không có ⇒ `xongChangHomNay = null` (lượt thưởng do ôn tới hạn mở); có ⇒ `xongChangHomNay = changXongHomNay` (một chặng đã XONG HẲN hôm nay, đủ câu — không phải mới làm 1 câu).
 *   • `xongOnToiHan` = hôm nay em đã ôn ≥ 1 câu (`soCauOnHomNay`, chỉ nguồn ôn lại — không tính phiếu khắc phục) VÀ không còn câu tới hạn nào (`conCauToiHan = 0`).
 *     Không có câu nào tới hạn từ đầu ngày thì em chưa ôn gì ⇒ false (không cho lượt thưởng miễn phí). Số không hợp lệ ⇒ coi là CHƯA xong (đóng cửa).
 */
export function dauVaoLuotTuSo(v: { changXongHomNay: boolean; soCauOnHomNay: number; conCauToiHan: number; coBaiConChang: boolean }): { xongChangHomNay: boolean | null; xongOnToiHan: boolean } {
  const so = (x: number) => (Number.isFinite(x) ? Math.floor(x) : Number.NaN)
  const on = so(v.soCauOnHomNay), con = so(v.conCauToiHan)
  return {
    xongChangHomNay: v.coBaiConChang === true ? v.changXongHomNay === true : null,
    xongOnToiHan: on >= 1 && con === 0,
  }
}

export interface DauVaoLuot { soLuotDaLam:number; xongChangHomNay:boolean|null; xongOnToiHan:boolean; datHomNay:boolean; dungHomNay:number; tongHomNay:number }
export interface KhoaLuot { ma:'chang'|'dat'|'trum'; daMo:boolean; moKhi:string }
export interface KetQuaLuot { tongLuotMo:number; conLai:number; tran:number; danhSach:{so:number;loai:LoaiLuot;thuong:boolean}[]; luotTiepTheo:{so:number;loai:LoaiLuot;thuong:boolean}|null; khoa:KhoaLuot[]; tongCauToiDa:number }
export const SO_LUOT_MO_SAN=3
export const TRAN_LUOT_NGAY=6
export const TI_LE_LUOT_TRUM=0.8
export const SO_CAU_TOI_THIEU_LUOT_TRUM=12
/** Số lượt của HÔM NAY (ngày VN): 3 sẵn · +1 xong chặng BTVN hôm nay (không có bài đang chạy: xong ôn tới hạn) · +1 đạt nhiệm vụ ngày · +1 Lượt trùm khi đúng ≥ 80 % trong ≥ 12 câu thú hôm nay. Trần 6 lượt (36 câu), KHÔNG cộng dồn sang hôm sau. */
export function luotHomNay(v:DauVaoLuot):KetQuaLuot {
  const so=(x:number)=>Number.isFinite(x)?Math.max(0,Math.floor(x)):0
  const dung=so(v.dungHomNay),tong=so(v.tongHomNay),daLam=so(v.soLuotDaLam)
  const moChang=v.xongChangHomNay===null?!!v.xongOnToiHan:v.xongChangHomNay===true
  const moDat=!!v.datHomNay
  const moTrum=tong>=SO_CAU_TOI_THIEU_LUOT_TRUM&&dung>=TI_LE_LUOT_TRUM*tong-1e-9
  const khoa:KhoaLuot[]=[
    {ma:'chang',daMo:moChang,moKhi:v.xongChangHomNay===null?'Em xong phần ôn lại đến lịch hôm nay':'Em xong chặng bài tập về nhà của hôm nay'},
    {ma:'dat',daMo:moDat,moKhi:'Em đạt nhiệm vụ ngày'},
    {ma:'trum',daMo:moTrum,moKhi:`Em đúng từ 80 % trong ít nhất ${SO_CAU_TOI_THIEU_LUOT_TRUM} câu thần thú hôm nay (hôm nay ${dung}/${tong} câu)`},
  ]
  const danhSach:{so:number;loai:LoaiLuot;thuong:boolean}[]=[{so:1,loai:'khoi_dong',thuong:false},{so:2,loai:'kham_pha',thuong:false},{so:3,loai:'kham_pha',thuong:false}]
  if(moChang)danhSach.push({so:danhSach.length+1,loai:'kham_pha',thuong:true})
  if(moDat)danhSach.push({so:danhSach.length+1,loai:'kham_pha',thuong:true})
  if(moTrum)danhSach.push({so:danhSach.length+1,loai:'trum',thuong:true})
  const tongLuotMo=Math.min(TRAN_LUOT_NGAY,danhSach.length)
  return {tongLuotMo,conLai:Math.max(0,tongLuotMo-daLam),tran:TRAN_LUOT_NGAY,danhSach:danhSach.slice(0,TRAN_LUOT_NGAY),luotTiepTheo:daLam<tongLuotMo?danhSach[daLam]!:null,khoa,tongCauToiDa:TRAN_LUOT_NGAY*SO_CAU_MOI_LUOT}
}

export interface Unit { id:string; pet:number; star:number; pos:number|null }
export interface Arena { round:number; hp:number; gold:number; level:number; xp:number; shop:(number|null)[]; units:Unit[]; seed:number; learned:number; studied?:number; learnedGroups?:string[]; log:string[]; finished:boolean }
export type ArenaAction={type:'buy';slot:number}|{type:'sell';id:string}|{type:'place';id:string;pos:number|null}|{type:'refresh'}|{type:'xp'}|{type:'fight'}
function random(a:Arena):number {a.seed=(Math.imul(a.seed,1664525)+1013904223)>>>0;return a.seed/4294967296}
function shop(a:Arena){a.shop=Array.from({length:5},()=>Math.floor(random(a)*8))}
export function newArena(seed:number):Arena {const a:Arena={round:1,hp:100,gold:8,level:2,xp:0,shop:[],units:[],seed,learned:0,log:[],finished:false};shop(a);return a}
export function arenaAction(state:Arena,action:ArenaAction):Arena {
  const a: Arena=JSON.parse(JSON.stringify(state))
  if(a.finished)throw new Error('Ván đã kết thúc.')
  if(action.type==='buy'){
    const pet=a.shop[action.slot];if(pet==null||a.gold<2||a.units.length>=12)throw new Error('Cần 2 vàng và một chỗ trống.')
    a.gold-=2;a.shop[action.slot]=null;a.units.push({id:`u${a.seed}-${a.round}-${a.units.length}-${action.slot}`,pet,star:1,pos:null})
    for(let star=1;star<3;star++){
      const same=a.units.filter(u=>u.pet===pet&&u.star===star)
      if(same.length>=3){const ids=new Set(same.slice(0,3).map(u=>u.id));a.units=a.units.filter(u=>!ids.has(u.id));a.units.push({...same[0]!,star:star+1,pos:same.find(u=>u.pos!==null)?.pos??null})}
    }
  }else if(action.type==='sell') {const u=a.units.find(u=>u.id===action.id);if(!u)throw new Error('Không có quân này.');a.gold+=Math.pow(3,u.star-1);a.units=a.units.filter(q=>q.id!==u.id)}
  else if(action.type==='place') {const u=a.units.find(u=>u.id===action.id);if(!u)throw new Error('Không có quân này.');if(action.pos!==null&&(!Number.isInteger(action.pos)||action.pos<0||action.pos>=8))throw new Error('Ô bàn không hợp lệ.');if(action.pos!==null&&u.pos===null&&a.units.filter(x=>x.pos!==null).length>=a.level)throw new Error('Đội đã đủ quân.');const other=a.units.find(x=>x.pos===action.pos&&x.id!==u.id);if(other&&action.pos!==null)other.pos=u.pos;u.pos=action.pos}
  else if(action.type==='refresh'){if(a.gold<2)throw new Error('Cần 2 vàng.');a.gold-=2;shop(a)}
  else if(action.type==='xp'){if(a.gold<4||a.level>=6)throw new Error('Cần 4 vàng hoặc đội đã đạt cấp 6.');a.gold-=4;a.xp+=4;while(a.level<6&&a.xp>=a.level*3){a.xp-=a.level*3;a.level++}}
  else {
    if(a.round>1&&!a.studied)throw new Error('Em làm một câu Hoá của vòng này trước khi giao chiến.')
    const team=a.units.filter(u=>u.pos!==null);if(!team.length)throw new Error('Đặt ít nhất một thần thú lên bàn.')
    const power=arenaPower(a)
    const enemy=75+a.round*31+random(a)*35
    const win=power>=enemy;a.hp=Math.max(0,a.hp-(win?0:Math.min(25,8+a.round)))
    a.log=[`Vòng ${a.round}: ${win?'thắng':'cần đổi đội hình'} (${Math.round(power)} / ${Math.round(enemy)} sức đội).`,...a.log].slice(0,10)
    a.gold+=5+Math.min(5,Math.floor(a.gold/10));a.round++;a.learned=0;a.studied=0;a.learnedGroups=[];shop(a);a.finished=a.hp===0||a.round>10
  }
  return a
}

export function arenaPower(a:Arena):number {
 const team=a.units.filter(u=>u.pos!==null)
 const harmony=new Set(team.map(u=>u.pet)).size>=4?1.2:1
 return team.reduce((sum,u)=>sum+(35+u.star*25)*Math.pow(1.8,u.star-1)*((u.pet===0||u.pet===4)?(u.pos!<4?1.2:1):(u.pos!>=4?1.15:1)),0)*harmony
}
