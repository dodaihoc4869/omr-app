import {normalizePetName} from '../../src/game/than-thu-v2/pet-name'
import {escortAction,escortContext} from './game-v2-escort'
import {readGameScope} from './game-v2-reports'
import {roomAction} from './game-v2-room'
import type {Env} from './kieu'
import {gameIdentity,parentPass} from './game-v2-auth'
import {hash,readScope,syncIndex,protectedQuestions} from './game-v2-bank'
import {lyDoThuong} from '../../src/game/than-thu-v2/ly-do-thuong'
import {PETS,ALIASES,OLD_SIX,allowed,chooseSessionWithRoles,chooseLuotMoi,luotHomNay,SO_CAU_MOI_LUOT,publicQuestion,grade,advance,newArena,arenaAction} from '../../src/game/than-thu-v2/core'
import type {Attempt,Mastery,PrivateQuestion,Mode,Arena,ArenaAction} from '../../src/game/than-thu-v2/core'
import type {ShieldState} from '../../src/game/than-thu-v2/shields'
import {khienConLai,khienRenChuaDung} from './exp-ho-so-game'
import {CAP_KHIEN_QUA_DAU,MANH_MOI_KHIEN,NGAY_DAT_MO_KHIEN_QUA} from './exp-cau-hinh'
import type {KhienRen} from './exp-hoc-tap'
import {syncAcademic,type Academic,academicDay} from './game-v2-academic'
import {laCauTuLuan,jsonLaTuLuan} from './cam-tu-luan'
import {masteryTheoHoSo,qidChanHomNay} from './game-v2-ho-so'
import {ghiSuKien} from './su-kien-hoc'
import {doanAction,laGoiNoiBoDoan,doanMoCho} from './game-v2-doan'
import {chonLauNhat,docCauDaLamMoiNguon,docCauLamHomNay,tachMoiCu} from './game-v2-cau-moi'
import {SO_HIEP} from '../../src/game/than-thu-v2/doan-core'
import {LUAT_CAP_MOI,TRAN_EXP_GAME_NGAY,hapThu} from '../../src/lib/hap-thu-ngay'
import {chuyenDoiKhiMo,daExpGameHomNay,docTranHapThu,nhanExpGame} from './game-v2-hap-thu'
import {TRAN_CAU_DAO_NGAY,TRAN_CAU_DOAN_NGAY,demCauTrongNgay,dieuKienLoaiPhien,tranCuaLoai,type LoaiTran,docCauBtvnChuaNop,docDangLop,docDauVaoLuot,docLuotDangCho,luotMoiBat,maiCho,tomTatLuot} from './game-v2-luot'
import {ghiKhoanExpGame} from './exp-d1'
import {expMotCau} from './exp-hoc-tap'
export interface Profile {nickname?:string;academic?:Academic;shields?:ShieldState;expMoi?:{daCong:number;manhDaTinh:number;ngayDat?:number};khienRen?:KhienRen;expGame?:{ngay:string;da:number};hapThu?:{ngay:string;da:number};luatCap?:number;truocSiet?:unknown;pet:string;choice:boolean;legacy:unknown;cap:number;exp:number;wallet:number;earned:number;tower:number;mastery:Mastery[];arena:Arena|null;cutover:string;season?:string}
type Row={revision:number;json:string}
type Session={doan?:number;guardian?:string;guardianRound?:number;mode:Mode;questions:{qid:string;maDe:string;version:string;group:string;novel:boolean;role?:string}[];created:number}
const now=()=>new Date().toISOString()
export async function loadProfile(env:Env,sbd:string):Promise<{profile:Profile;revision:number}>{
  const reset=await env.DB.prepare("SELECT json FROM game_v2_settings WHERE key='season'").first<{json:string}>()
  const season=reset?String(JSON.parse(reset.json).id):''
  let row=await env.DB.prepare('SELECT revision,json FROM game_v2_profile WHERE sbd=?').bind(sbd).first<Row>()
  if(!row){
    const legacy=await env.DB.prepare('SELECT du_lieu_json AS json FROM than_thu WHERE sbd=?').bind(sbd).first<{json:string}>()
    let old:Record<string,unknown>={};try{old=JSON.parse(legacy?.json??'{}')}catch{/* Keep raw snapshot below. */}
    const id=String(old.idThanhThuChon??old.thanThuId??'');const pet=ALIASES[id]??id
    const profile:Profile={pet:PETS.some(p=>p.id===pet)?pet:'dat_quy',choice:!id||OLD_SIX.has(id)||!PETS.some(p=>p.id===pet),legacy:legacy?.json??null,
      cap:Math.max(1,Math.min(120,Number(old.capDo)||1)),exp:Math.max(0,Number(old.exp)||0),wallet:Math.max(0,Number(old.khoExp)||0),earned:0,tower:Math.max(1,Math.min(999,Number(old.tangThapCaoNhat)||1)),mastery:[],arena:null,cutover:now()}
    if(season)Object.assign(profile,{pet:'dat_quy',choice:true,cap:1,exp:0,wallet:0,earned:0,tower:1,mastery:[],arena:null,season,luatCap:LUAT_CAP_MOI})
    await env.DB.prepare('INSERT OR IGNORE INTO game_v2_profile(sbd,json,created_at) VALUES(?,?,?)').bind(sbd,JSON.stringify(profile),now()).run()
    row=await env.DB.prepare('SELECT revision,json FROM game_v2_profile WHERE sbd=?').bind(sbd).first<Row>()
  }
  if(!row)throw new Error('Chưa mở được hồ sơ game.')
  const current=JSON.parse(row.json) as Profile
  if(season&&current.season!==season){
    const fresh:Profile={pet:'dat_quy',choice:true,legacy:current.legacy,cap:1,exp:0,wallet:0,earned:0,tower:1,mastery:[],arena:null,cutover:now(),season,luatCap:LUAT_CAP_MOI}
    const updated=await env.DB.prepare('UPDATE game_v2_profile SET json=?,revision=revision+1 WHERE sbd=? AND revision=?').bind(JSON.stringify(fresh),sbd,row.revision).run()
    if(!updated.meta.changes)return loadProfile(env,sbd)
    return {profile:fresh,revision:row.revision+1}
  }
  // ĐỢT 1 thần thú mỗi ngày: hồ sơ đã chơi theo luật cấp cũ được CHUYỂN ĐỔI LƯỜI khi mở (CAS theo revision; thua CAS/lỗi ⇒ dùng hồ sơ như đã đọc, cron quét nốt).
  if(current.luatCap!==LUAT_CAP_MOI){const doi=await chuyenDoiKhiMo(env,sbd,current,row.revision);if(doi)return doi}
  return {profile:current,revision:row.revision}
}
async function save(env:Env,sbd:string,p:Profile,rev:number){const r=await env.DB.prepare('UPDATE game_v2_profile SET json=?,revision=revision+1 WHERE sbd=? AND revision=?').bind(JSON.stringify(p),sbd,rev).run();if(!r.meta.changes)throw new Error('Hồ sơ vừa đổi trên thiết bị khác. Em tải lại hồ sơ.');return rev+1}
function visible(p:Profile,hapThuInfo?:{tran:number;lyDo?:string|null;soCauHomNay?:number;canCau?:number}){const {legacy:_,academic,expMoi,truocSiet:_ts,...rest}=p;const homNay=academicDay(now());return {...rest,ongNghiem:p.wallet,hapThuHomNay:{da:p.hapThu&&p.hapThu.ngay===homNay?p.hapThu.da:0,tran:hapThuInfo?.tran??null,lyDo:hapThuInfo?.lyDo??null,...(hapThuInfo?.soCauHomNay!==undefined?{soCauHomNay:hapThuInfo.soCauHomNay,canCau:hapThuInfo.canCau}:{})},expGameHomNay:{da:daExpGameHomNay(p,homNay),tran:TRAN_EXP_GAME_NGAY},soNgayDat:expMoi?.ngayDat??0,ngayMoKhienQua:NGAY_DAT_MO_KHIEN_QUA,khienRen:p.khienRen?{manh:p.khienRen.manh,daRen:p.khienRen.daRen,chuaDung:khienRenChuaDung(p),conLai:khienConLai(p),moiKhien:MANH_MOI_KHIEN}:undefined,academic:academic?{total:academic.total,today:academic.days[academicDay(now())]??0,lastGain:academic.lastGain,at:academic.at,dailyLimit:100}:undefined}}
async function attempts(env:Env,sbd:string){const r=await env.DB.prepare('SELECT json FROM game_v2_attempt WHERE sbd=? ORDER BY created_at DESC LIMIT 3000').bind(sbd).all<{json:string}>();return r.results.map(x=>(JSON.parse(x.json) as {attempt:Attempt}).attempt).reverse()}
async function currentQuestion(env:Env,q:{qid:string;maDe:string;version:string}){
  const row=await env.DB.prepare(`SELECT q.json FROM game_v2_question q JOIN de_kho d ON d.ma_de=q.ma_de JOIN game_v2_index g ON g.ma_de=d.ma_de AND g.source_version=d.cap_nhat_luc WHERE q.ma_de=? AND q.qid=? AND q.version=? AND COALESCE(d.da_xoa,0)=0`).bind(q.maDe,q.qid,q.version).first<{json:string}>()
  if(!row)throw new Error('Câu đã được sửa hoặc rút khỏi kho. Em mở lượt mới; lượt này không bị tính sai.')
  const cau=JSON.parse(row.json) as PrivateQuestion
  // CẤM RÚT TỰ LUẬN (21/09): lượt đã tạo trước lệnh cấm mà còn câu tự luận thì đóng như câu rút khỏi kho — không phục vụ, không chấm.
  if(laCauTuLuan(cau))throw new Error('Câu đã được sửa hoặc rút khỏi kho. Em mở lượt mới; lượt này không bị tính sai.')
  return cau
}
/** Các qid trong LƯỢT mà hiện là TỰ LUẬN (lượt soạn trước lệnh cấm 21/09). MỘT truy vấn theo (qid, version); không thấy dòng ⇒ không kết tội. */
async function qidTuLuanTrongLuot(env:Env,refs:{qid:string;version:string}[]):Promise<Set<string>>{
  const ra=new Set<string>();if(!refs.length)return ra
  const r=await env.DB.prepare('SELECT q.qid,q.version,q.json FROM game_v2_question q WHERE q.qid IN (SELECT value FROM json_each(?))').bind(JSON.stringify(refs.map(x=>x.qid))).all<{qid:string;version:string;json:string}>()
  const can=new Set(refs.map(x=>`${x.qid}|${x.version}`))
  for(const x of r.results)if(can.has(`${x.qid}|${x.version}`)&&jsonLaTuLuan(x.json))ra.add(x.qid)
  return ra
}
/** TƯƠNG THÍCH máy em đang sống (Boss 21/09): màn Đảo cũ chỉ biết vai yeu|toi_han|lap|thu_thach ⇒ `role` trả tập cũ (moi → lap, trum → thu_thach); `roleV2` = vai THẬT cho màn mới. */
const vaiChoMay=(v?:string)=>({role:v==='moi'?'lap':v==='trum'?'thu_thach':v,roleV2:v})
/** ĐỢT 2 — lượt Đảo theo bộ chọn mới của Code 1 (`chooseLuotMoi`) trên kho LỚP đã học; quota lượt/ngày (`luotHomNay`) và trần 60 câu ở máy chủ. Lùi nhanh: `cau_hinh.game_luot_moi = 'tat'` (đường cũ ở `start`). */
async function startLuotMoi(env:Env,sbd:string,p:Profile,b:Record<string,unknown>,action:string):Promise<Record<string,unknown>>{
  const tNow=Date.now(),ngay=academicDay(now())
  const control=await readGameScope(env,sbd);if(!control.enabled)throw new Error('Thầy đang tạm dừng game cho hồ sơ này.')
  const dangLop=await docDangLop(env,sbd,tNow)
  const scope=await readScope(env,sbd,dangLop)
  const t=await docTranHapThu(env,sbd,ngay)
  const dauVao=await docDauVaoLuot(env,sbd,ngay,tNow,t.dat)
  const info=luotHomNay(dauVao)
  const dayStart=new Date(ngay+'T00:00:00+07:00').toISOString()
  const count={n:await demCauTrongNgay(env,sbd,dayStart,'dao')} // trần ĐẢO riêng (36), không tính lượt của Đoàn
  const remaining=Math.max(0,TRAN_CAU_DAO_NGAY-count.n)
  const history=await attempts(env,sbd),mastery=await masteryTheoHoSo(env,sbd,p.mastery)
  const cho=maiCho(dangLop,mastery,tNow),tom=tomTatLuot(info,dauVao.soLuotDaLam)
  if(action==='start'){
    // Lượt em vừa mở mà chưa trả lời câu nào: trả lại CHÍNH lượt ấy (không bốc lại câu, không tốn lượt).
    const dangCho=await docLuotDangCho(env,sbd,tNow)
    if(dangCho){
      try{
        const old=JSON.parse(dangCho.json) as Session;const tuLuan=await qidTuLuanTrongLuot(env,old.questions);const qs=[]
        // Thầy có thể giao BTVN SAU khi lượt này đã bốc câu: câu nào nay nằm trong bài em chưa nộp ⇒ bỏ lượt chờ, mở lượt mới (không trả lại câu có thể lộ đáp án).
        const chanBtvn=await docCauBtvnChuaNop(env,sbd);if(old.questions.some(ref=>chanBtvn.has(ref.qid)||chanBtvn.has(ref.group))){await env.DB.prepare('DELETE FROM game_v2_session WHERE id=? AND sbd=?').bind(dangCho.id,sbd).run();return startLuotMoi(env,sbd,p,b,action)} // lượt chờ chưa trả lời câu nào: bỏ hẳn rồi tính lại từ đầu (không mất lượt, số lượt đúng)
        for(const ref of old.questions){if(tuLuan.has(ref.qid))continue;qs.push({...publicQuestion(await currentQuestion(env,ref)),...vaiChoMay(ref.role)})}
        if(qs.length)return {ok:true,id:dangCho.id,questions:qs,missing:scope.missing,luot:tom,maiCho:cho}
      }catch{/* câu đã đổi/rút khỏi kho: mở lượt mới */}
    }
  }
  if(action==='recommendations'&&(!remaining||!info.luotTiepTheo))return {ok:true,dailyUsed:count.n,tranNgay:TRAN_CAU_DAO_NGAY,suggestions:[],remaining,luot:tom}
  if(!info.luotTiepTheo)return {ok:true,questions:[],het:true,luot:tom,maiCho:cho,message:'Hôm nay em đã dùng hết lượt thần thú. Mai thú chờ em.'}
  if(!remaining)throw new Error(`Em đã hoàn thành ${TRAN_CAU_DAO_NGAY} câu hôm nay. Ngày mai quay lại nhận nhiệm vụ mới nhé.`)
  const blocked=await protectedQuestions(env)
  for(const key of control.blocked)blocked.add(key)
  for(const qid of await qidChanHomNay(env,sbd,tNow))blocked.add(qid)
  for(const x of await docCauBtvnChuaNop(env,sbd))blocked.add(x)
  // Chỉ nhận câu ĐỦ `dang` và `mucDo` (hàm chọn coi câu thiếu mức là dễ nhất), đã duyệt, không tự luận, không bị chặn, trong phạm vi thầy đặt.
  const eligible=scope.pool.filter(q=>q.reviewed&&!laCauTuLuan(q)&&!!q.dang&&!!q.mucDo&&!blocked.has(q.qid)&&!blocked.has(q.group)&&(control.types.length===0||control.types.includes(q.dang))&&(typeof b.dang!=='string'||q.dang===b.dang))
  const lt=info.luotTiepTheo
  const chon=chooseLuotMoi(eligible,scope.evidence,history,mastery,{loai:lt.loai,cap:p.cap,now:tNow,thuong:lt.thuong,blocked,soCau:Math.min(SO_CAU_MOI_LUOT,remaining)})
  if(action==='recommendations')return {ok:true,dailyUsed:count.n,tranNgay:TRAN_CAU_DAO_NGAY,suggestions:chon.map(x=>({title:x.q.tenDang||'Ôn kiến thức đã học',source:x.q.maDe,part:x.q.phan})),remaining,luot:tom}
  if(!chon.length)return {ok:true,questions:[],lyDo:eligible.length?'chi_con_cau_qua_bac':'kho_trong',luot:tom,maiCho:cho,missing:scope.missing,message:eligible.length?'Các câu còn lại của lớp đều cao hơn một bậc so với sức em ở dạng đó. Em làm thêm bài tập về nhà và phần ôn lại, mai thú mở câu mới cho em.':'Lớp em chưa học dạng nào có câu phù hợp cho thần thú. Khi Thầy giao bài mới, câu sẽ mở ra.'}
  const id=crypto.randomUUID(),groups=new Set(scope.evidence.map(e=>e.group))
  const session:Session={mode:'adventure',created:Date.now(),questions:chon.map(x=>({qid:x.q.qid,maDe:x.q.maDe,version:x.q.version,group:x.q.group,novel:!groups.has(x.q.group),role:x.role}))}
  const inserted=await env.DB.prepare('INSERT OR IGNORE INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').bind(id,sbd,JSON.stringify(session),now()).run()
  if(!inserted.meta.changes)return startLuotMoi(env,sbd,p,b,action)
  return {ok:true,id,questions:chon.map(x=>({...publicQuestion(x.q),...vaiChoMay(x.role)})),missing:scope.missing,sourceCases:[...new Set(scope.evidence.map(e=>e.ca))].slice(0,3),luot:{...tomTatLuot({...info,conLai:Math.max(0,info.conLai-1)},dauVao.soLuotDaLam+1),luotDangMo:lt},maiCho:cho}
}
/** ĐOÀN HỘ TỐNG lấy câu cá nhân từ KHO LỚP (thầy 21/09, Boss/Code 1 W3 — cùng kho lớp với lượt Đảo mới): trước đây Đoàn gọi `start` nội bộ bằng đường CŨ, kho bó theo bằng chứng của CHÍNH em ⇒ em mới / ít dữ liệu báo "Chưa có câu vừa sức".
 *  Nay: dạng LỚP đã học (`docDangLop`) ∪ dạng em đã gặp; câu PHẦN I hoặc III (hiệp Đoàn trả lời bằng một chữ A–D hoặc một số; Phần II thuộc câu chung của trùm, KHÔNG làm câu cá nhân), đã duyệt, không tự luận, đủ `dang` + `mucDo` — KHÔNG đòi bằng chứng cùng dạng / kiến thức nền của CHÍNH em
 *  (như Đảo mới). Cách CHỌN giữ NGUYÊN của Đoàn (`chooseSessionWithRoles`: câu tới hạn ôn → dạng đang yếu → còn lại), nên em có hồ sơ vẫn thấy câu ôn của mình trước. Giữ nguyên rào của đường cũ: thầy tạm dừng game, câu bảo vệ / thầy chặn riêng,
 *  câu em đã/đang làm hôm nay ở chỗ khác, bài tập về nhà CHƯA nộp (Game hiện lời giải ngay), trần 60 câu/ngày. KHÔNG tốn lượt Đảo (Đoàn có trần 4 chặng/ngày riêng). Phiên tạo ra được `taoNguoi` đóng dấu `doan` như trước.
 *  Lùi nhanh: cờ `cau_hinh.game_luot_moi = 'tat'` (cùng cờ với Đảo) ⇒ đường cũ. */
async function startDoanKhoLop(env:Env,sbd:string,p:Profile):Promise<Record<string,unknown>>{
  const tNow=Date.now(),ngay=academicDay(now())
  const control=await readGameScope(env,sbd);if(!control.enabled)throw new Error('Thầy đang tạm dừng game cho hồ sơ này.')
  const dangLop=await docDangLop(env,sbd,tNow)
  const scope=await readScope(env,sbd,dangLop)
  const dayStart=new Date(ngay+'T00:00:00+07:00').toISOString()
  const remaining=Math.max(0,TRAN_CAU_DOAN_NGAY-await demCauTrongNgay(env,sbd,dayStart,'doan')) // trần ĐOÀN riêng (60), không tính lượt của Đảo
  if(!remaining)throw new Error(`Em đã hoàn thành ${TRAN_CAU_DOAN_NGAY} câu hôm nay. Ngày mai quay lại nhận nhiệm vụ mới nhé.`)
  const history=await attempts(env,sbd),mastery=await masteryTheoHoSo(env,sbd,p.mastery)
  const blocked=await protectedQuestions(env)
  for(const key of control.blocked)blocked.add(key)
  const chanHomNay=await qidChanHomNay(env,sbd,tNow) // câu làm HÔM NAY ở nguồn khác (+ gói gia đình chưa nộp): loại ở `eligible` nhưng tách riêng để báo THẬT "hết câu mới hôm nay"
  for(const x of await docCauBtvnChuaNop(env,sbd))blocked.add(x)
  const dangHoc=new Set<string>([...dangLop,...scope.evidence.map(e=>e.dang).filter((d):d is string=>!!d)])
  const poolHopLe=scope.pool.filter(q=>q.phan!=='II'&&q.reviewed&&!laCauTuLuan(q)&&!!q.dang&&!!q.mucDo&&dangHoc.has(q.dang)&&!blocked.has(q.qid)&&!blocked.has(q.group)&&(control.types.length===0||control.types.includes(q.dang)))
  const eligible=poolHopLe.filter(q=>!chanHomNay.has(q.qid))
  for(const qid of chanHomNay)blocked.add(qid)
  // RÚT CÂU KHÔNG LẶP (thầy lệnh 21/09 ~19:35, game-v2-cau-moi.ts): CÙNG luật cá nhân hoá với Đảo Đợt 2 (chooseLuotMoi 'kham_pha'); KHÔNG lặp câu em đã làm HÔM NAY (mọi nguồn); ưu tiên câu CHƯA TỪNG làm ở đâu (mọi nguồn, mọi ngày);
  // hết câu mới ⇒ câu LÂU NHẤT chưa gặp + báo thật `hetCauMoi`; không còn gì ⇒ báo thật.
  const homNay=await docCauLamHomNay(env,sbd,dayStart,ngay),daLam=await docCauDaLamMoiNguon(env,sbd)
  const lucGame=new Map<string,number>();for(const a of history)lucGame.set(a.group,Math.max(lucGame.get(a.group)??-1,a.at))
  const {moi,cu}=tachMoiCu(eligible,homNay,daLam,new Set(lucGame.keys()))
  const soCau=Math.min(SO_HIEP-2,remaining),opt={loai:'kham_pha' as const,cap:p.cap,now:tNow,blocked,soCau}
  let chon=chooseLuotMoi(moi,scope.evidence,history,mastery,opt),hetCauMoi=false
  if(chon.length<soCau){
    // Bù bằng câu LÂU NHẤT chưa gặp: thử `k` câu cũ nhất trước (k = số câu còn thiếu), chỉ nới `k` khi luật bậc/đổi câu của chooseLuotMoi loại bớt.
    const daChon=new Set(chon.map(x=>x.q.group)),thieu=soCau-chon.length,cuCon=cu.filter(q=>!daChon.has(q.group))
    for(let k=thieu;k<cuCon.length+thieu;k+=thieu){
      const bu=chooseLuotMoi(chonLauNhat(cuCon,daLam,lucGame,k),scope.evidence,history,mastery,{...opt,soCau:thieu})
      if(bu.length>=thieu||k+thieu>=cuCon.length+thieu){if(bu.length){hetCauMoi=true;chon=[...chon,...bu]};break}
    }
  }
  if(!chon.length){
    const lyDo=!poolHopLe.length?'kho_trong':(!moi.length&&!cu.length)?'het_cau_moi_hom_nay':'chi_con_cau_qua_bac'
    const message=lyDo==='het_cau_moi_hom_nay'?'Hôm nay em đã làm hết câu mới hợp sức em trong kho. Mai có câu mới nhé.':lyDo==='chi_con_cau_qua_bac'?'Các câu còn lại của lớp đều cao hơn một bậc so với sức em ở dạng đó. Em làm thêm bài tập về nhà và phần ôn lại nhé.':'Chưa có câu vừa sức trong kho cho em. Em hoàn thành bài Thầy giao rồi quay lại lên đường nhé.'
    return {ok:true,questions:[],lyDo,missing:scope.missing,message}
  }
  const id=crypto.randomUUID(),groups=new Set(scope.evidence.map(e=>e.group))
  const session:Session={mode:'adventure',created:Date.now(),questions:chon.map(x=>({qid:x.q.qid,maDe:x.q.maDe,version:x.q.version,group:x.q.group,novel:!groups.has(x.q.group)}))}
  const inserted=await env.DB.prepare('INSERT OR IGNORE INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').bind(id,sbd,JSON.stringify(session),now()).run()
  if(!inserted.meta.changes)return startDoanKhoLop(env,sbd,p)
  return {ok:true,id,questions:chon.map(x=>({...publicQuestion(x.q),role:x.role})),missing:scope.missing,sourceCases:[...new Set(scope.evidence.map(e=>e.ca))].slice(0,3),...(hetCauMoi?{hetCauMoi:true}:{})}
}
export async function gameV2(env:Env,action:string,b:Record<string,unknown>):Promise<Record<string,unknown>> {
  const sbd=await gameIdentity(env,b)
  if(action==='sync')return {ok:true,...await syncIndex(env)}
  const {profile:p,revision}=await loadProfile(env,sbd)
  if(action.startsWith('escort-')){if(p.choice)throw new Error('Em chọn thần thú trước khi vào võ đài.');return escortAction(env,sbd,p.pet,p.cap,action,b)}
  if(action.startsWith('room-'))return roomAction(env,sbd,p.pet,action,b)
  if(action.startsWith('doan-')){if(p.choice)throw new Error('Em chọn thần thú trước khi lên đường cùng Đoàn Hộ Tống.');return doanAction(env,sbd,p,action,b,gameV2)}
  if(action==='academic-sync'){const result=await syncAcademic(env,sbd,p,b.mom);return {ok:true,...result,profile:visible(p),revision:await save(env,sbd,p,revision)}}
  if(action==='progress-history'){
    const rows=await env.DB.prepare(`SELECT date(created_at,'+7 hours') AS day, COUNT(*) AS total,
      SUM(CASE WHEN json_extract(json,'$.attempt.correct')=1 AND COALESCE(json_extract(json,'$.attempt.assisted'),0)=0 THEN 1 ELSE 0 END) AS correct
      FROM game_v2_attempt WHERE sbd=? AND created_at>=? GROUP BY day ORDER BY day`).bind(sbd,new Date(Math.max(Date.now()-30*86400000,Date.parse(p.cutover)||0)).toISOString()).all()
    return {ok:true,history:rows.results}
  }
  if(action==='so-tay'){
    // ĐỌC-CHỈ cho Sổ tay dạng bài của Đảo thần thú: mọi dạng em ĐƯỢC PHÉP làm (đúng phạm vi của `start`: readScope + allowed + đề bảo vệ + phạm vi thầy đặt). `key` = q.dang ?? q.group như `advance` dùng.
    const scope=await readScope(env,sbd),blocked=await protectedQuestions(env),control=await readGameScope(env,sbd);for(const k of control.blocked)blocked.add(k)
    const ds=new Map<string,{key:string;ten:string;chuong:string}>()
    for(const q of scope.pool){if(!q.reviewed||laCauTuLuan(q)||!allowed(q,scope.evidence,blocked)||control.types.length&&(!q.dang||!control.types.includes(q.dang)))continue;const key=q.dang??q.group;if(!ds.has(key))ds.set(key,{key,ten:q.tenDang||'',chuong:q.dang?.split('.')[0]??''})}
    return {ok:true,dang:[...ds.values()].sort((a,b)=>a.key.localeCompare(b.key))}
  }
  if(action==='rename'){if(p.choice)throw new Error('Em chọn thần thú trước khi đặt tên.');p.nickname=normalizePetName(b.name);return {ok:true,profile:visible(p),revision:await save(env,sbd,p,revision)}}
  if(action==='share')return {ok:true,pass:await parentPass(env,sbd)}
  if(action==='profile'){const tasks=await env.DB.prepare('SELECT id,dang FROM game_v2_task WHERE sbd=? AND completed_at IS NULL ORDER BY created_at LIMIT 20').bind(sbd).all<{id:string;dang:string}>();const tranHapThu=await docTranHapThu(env,sbd,academicDay(now()));const dauVaoLuot=await docDauVaoLuot(env,sbd,academicDay(now()),Date.now(),tranHapThu.dat);return {ok:true,profile:visible(p,{tran:tranHapThu.tran,soCauHomNay:tranHapThu.soCauHomNay,canCau:tranHapThu.canCau}),revision,luot:tomTatLuot(luotHomNay(dauVaoLuot),dauVaoLuot.soLuotDaLam),tasks:tasks.results,doanMo:await doanMoCho(env,sbd)}}
  if(action==='shield-use'){
    const id=String(b.useId??'');if(!/^[a-zA-Z0-9-]{16,80}$/.test(id))throw new Error('Lượt dùng khiên không hợp lệ.')
    if(p.shields?.lastUse===id||Number(p.shields?.activeUntil)>Date.now())return {ok:true,profile:visible(p),revision}
    if(p.choice||khienConLai(p)<1){
      // Câu báo ĐÚNG luật khiên mới (thầy lệnh 21/09): khiên quà tiến hoá đầu (cấp 10) chỉ mở khi đủ 36 ngày đạt nhiệm vụ ngày từ mốc; còn lại khiên đến từ mảnh (36 mảnh rèn một khiên).
      const ngayDat=p.expMoi?.ngayDat??0
      throw new Error(p.choice?'Em chưa có khiên. Em chọn thần thú của mình trước.':p.cap>=CAP_KHIEN_QUA_DAU&&ngayDat<NGAY_DAT_MO_KHIEN_QUA?`Em chưa có khiên. Khiên đầu tiên mở khi em đạt nhiệm vụ ngày đủ ${NGAY_DAT_MO_KHIEN_QUA} ngày (em đã có ${ngayDat} ngày).`:`Em chưa có khiên. Mỗi ngày đạt nhiệm vụ được 1 mảnh, đủ ${MANH_MOI_KHIEN} mảnh rèn một khiên.`)
    }
    p.shields={used:(p.shields?.used??0)+1,activeUntil:Date.now()+10000,lastUse:id}
    return {ok:true,profile:visible(p),revision:await save(env,sbd,p,revision)}
  }
  if(action==='choose'){
    if(!p.choice)throw new Error('Hồ sơ đã chọn thần thú.')
    const pet=PETS.find(x=>x.id===b.pet);if(!pet)throw new Error('Chọn một trong tám thần thú.')
    p.pet=pet.id;p.choice=false;return {ok:true,profile:visible(p),revision:await save(env,sbd,p,revision)}
  }
  if(action==='invest'){
    if(p.cap>=120)throw new Error('Thần thú đã đạt cấp 120. EXP tiếp tục được giữ trong kho.')
    // MỘT CỔNG HẤP THỤ (Đợt 1 thần thú mỗi ngày): mỗi ngày VN thần thú ăn tối đa 200 EXP khi em đạt nhiệm vụ ngày, 120 khi có học chưa đạt, 0 khi chưa học; phần dư ở lại ống nghiệm.
    if(p.luatCap!==LUAT_CAP_MOI)throw new Error('Hồ sơ thần thú đang được cập nhật sang cách lên cấp mới. Em thử lại sau ít phút.')
    const ngay=academicDay(now());const t=await docTranHapThu(env,sbd,ngay)
    const r=hapThu(p,Number.POSITIVE_INFINITY,ngay,t.tran)
    if(!r.daNap)return {ok:true,profile:visible(p,{tran:t.tran,lyDo:r.lyDo,soCauHomNay:t.soCauHomNay,canCau:t.canCau}),revision,daNap:0,lyDo:r.lyDo,conTran:r.conTran}
    return {ok:true,profile:visible(r.hoSo,{tran:t.tran,lyDo:r.lyDo,soCauHomNay:t.soCauHomNay,canCau:t.canCau}),revision:await save(env,sbd,r.hoSo,revision),daNap:r.daNap,lyDo:r.lyDo,conTran:r.conTran}
  }
  if(action==='start'||action==='recommendations'){
    const mode:Mode=['adventure','repair','tower','arena'].includes(String(b.mode))?b.mode as Mode:'adventure'
    let guardian:string|undefined,guardianRound:number|undefined
    if(b.guardian){guardian=String(b.guardian).trim().toUpperCase();const {r}=await escortContext(env,guardian,sbd);if(!r.started||r.finished||mode!=='arena'||Date.now()>=Math.min(r.deadline,r.roundAt+60000)||b.guardianRound!==undefined&&Number(b.guardianRound)!==r.round)throw new Error('Lượt Linh Tâm đã đổi. Em chờ câu của lượt mới.');guardianRound=r.round}
    // Đoàn Hộ Tống gọi `start` NỘI BỘ (laGoiNoiBoDoan) để lấy câu bằng đường cũ; Linh Tâm (guardian) và võ đài cũng giữ đường cũ — chỉ lượt Đảo của em mới theo bộ chọn lượt mới.
    if(!guardian&&mode==='adventure'&&!laGoiNoiBoDoan(b)&&await luotMoiBat(env))return startLuotMoi(env,sbd,p,b,action)
    // ĐOÀN nội bộ (`start` gọi từ `taoNguoi`): kho LỚP như lượt Đảo mới (cùng cờ lùi `game_luot_moi`); Linh Tâm / võ đài / repair / tower vẫn đường cũ.
    if(!guardian&&mode==='adventure'&&action==='start'&&laGoiNoiBoDoan(b)&&await luotMoiBat(env))return startDoanKhoLop(env,sbd,p)
    const scope=await readScope(env,sbd);const blocked=await protectedQuestions(env)
    const control=await readGameScope(env,sbd);if(!control.enabled)throw new Error('Thầy đang tạm dừng game cho hồ sơ này.')
    for(const key of control.blocked)blocked.add(key)
    // GĐ 5 (Kênh 4): một đồng hồ giờ máy chủ cho cả lượt chọn; câu em đang/đã làm hôm nay ở chỗ khác không ra ở game; mốc ôn theo hồ sơ.
    const tNow=Date.now()
    for(const qid of await qidChanHomNay(env,sbd,tNow))blocked.add(qid)
    // Game hiện lời giải ngay ⇒ đường CŨ (Đoàn nội bộ, Linh Tâm, võ đài, repair/tower) cũng KHÔNG được rút câu nằm trong bài tập về nhà em CHƯA nộp (Code 1 rà chéo W2b).
    for(const x of await docCauBtvnChuaNop(env,sbd))blocked.add(x)
    const history=await attempts(env,sbd)
    const eligible=scope.pool.filter(q=>!laCauTuLuan(q)&&allowed(q,scope.evidence,blocked)&&(control.types.length===0||q.dang!==null&&control.types.includes(q.dang))&&(typeof b.dang!=='string'||q.dang===b.dang))
    if(guardian){
      const saved=await env.DB.prepare("SELECT id,json FROM game_v2_session WHERE sbd=? AND json_extract(json,'$.guardian')=? AND json_extract(json,'$.guardianRound')=? ORDER BY created_at DESC LIMIT 1").bind(sbd,guardian,guardianRound).first<{id:string;json:string}>()
      if(saved){const old=JSON.parse(saved.json) as Session;const qs=old.questions.map(ref=>eligible.find(q=>q.qid===ref.qid&&q.version===ref.version));if(qs.every(Boolean)){const answered=await env.DB.prepare('SELECT json FROM game_v2_attempt WHERE session=? AND sbd=?').bind(saved.id,sbd).all<{json:string}>();return {ok:true,id:saved.id,questions:qs.map(q=>publicQuestion(q!)),answered:answered.results.map(x=>JSON.parse(x.json))}}throw new Error('Câu của lượt này đã thay đổi phạm vi. Em chờ lượt mới.')}
    }
    const dayStart=new Date(academicDay(now())+'T00:00:00+07:00')
    const loaiTran:LoaiTran=laGoiNoiBoDoan(b)?'doan':'dao' // Đoàn gọi `start` nội bộ ⇒ trần Đoàn; Linh Tâm/võ đài/đường cũ ⇒ trần Đảo (36)
    const count={n:await demCauTrongNgay(env,sbd,dayStart.toISOString(),loaiTran)}
    const remaining=Math.max(0,tranCuaLoai(loaiTran)-count.n)
    const chon=chooseSessionWithRoles(eligible,scope.evidence,history,await masteryTheoHoSo(env,sbd,p.mastery),mode,tNow).slice(0,remaining),selected=chon.map(x=>x.q),vai=new Map(chon.map(x=>[x.q.qid,x.role]))
    if(action==='recommendations')return {ok:true,dailyUsed:count.n,tranNgay:tranCuaLoai(loaiTran),suggestions:selected.map(q=>({title:q.tenDang||'Ôn kiến thức đã học',source:q.maDe,part:q.phan})),remaining}
    if(!remaining)throw new Error(`Em đã hoàn thành ${tranCuaLoai(loaiTran)} câu hôm nay. Ngày mai quay lại nhận nhiệm vụ mới nhé.`)
    const qs=mode==='arena'?selected.slice(0,b.guardian?1:2):selected
    if(!qs.length)return {ok:true,questions:[],missing:scope.missing,message:'Chưa có câu đã chấm, đã công bố và phù hợp trong kho. Em hoàn thành bài Thầy giao rồi quay lại.'}
    const id=guardian?await hash(`${guardian}|${guardianRound}|${sbd}`):crypto.randomUUID();const groups=new Set(scope.evidence.map(e=>e.group))
    const session:Session={guardian,guardianRound,mode,created:Date.now(),questions:qs.map(q=>({qid:q.qid,maDe:q.maDe,version:q.version,group:q.group,novel:!groups.has(q.group)}))}
    const inserted=await env.DB.prepare('INSERT OR IGNORE INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').bind(id,sbd,JSON.stringify(session),now()).run()
    if(!inserted.meta.changes)return gameV2(env,'start',b)
    return {ok:true,id,questions:qs.map(q=>({...publicQuestion(q),role:vai.get(q.qid)})),missing:scope.missing,sourceCases:[...new Set(scope.evidence.map(e=>e.ca))].slice(0,3)}
  }
  if(action==='resume'){
    const row=await env.DB.prepare("SELECT id,json FROM game_v2_session WHERE sbd=? AND created_at>? AND json_extract(json,'$.doan') IS NULL ORDER BY created_at DESC LIMIT 1").bind(sbd,new Date(Date.now()-2*3600000).toISOString()).first<{id:string;json:string}>()
    if(!row)return {ok:true,questions:[]}
    const session=JSON.parse(row.json) as Session;const blocked=await protectedQuestions(env);const control=await readGameScope(env,sbd);if(!control.enabled)throw new Error('Thầy đang tạm dừng game.');for(const key of control.blocked)blocked.add(key);const qs=[]
    // CẤM RÚT TỰ LUẬN (21/09): lượt soạn trước lệnh cấm mà còn câu tự luận ⇒ BỎ câu ấy khỏi lượt trả về (em làm nốt các câu còn lại, `complete` cũng chỉ đòi các câu này).
    const tuLuan=await qidTuLuanTrongLuot(env,session.questions)
    for(const ref of session.questions){if(tuLuan.has(ref.qid))continue;const q=await currentQuestion(env,ref);if(blocked.has(q.qid)||blocked.has(q.group))throw new Error('Lượt cũ có câu đang bảo vệ. Em mở lượt mới.');qs.push(publicQuestion(q))}
    if(!qs.length)return {ok:true,questions:[]}
    const rows=await env.DB.prepare('SELECT json FROM game_v2_attempt WHERE session=? AND sbd=? ORDER BY created_at').bind(row.id,sbd).all<{json:string}>()
    return {ok:true,id:row.id,questions:qs,mode:session.mode,answered:rows.results.map(x=>JSON.parse(x.json))}
  }
  if(action==='answer'){
    const id=String(b.session??'');const qid=String(b.qid??'');const receipt=`${id}|${qid}`
    const row=await env.DB.prepare('SELECT json FROM game_v2_session WHERE id=? AND sbd=?').bind(id,sbd).first<{json:string}>()
    if(!row)throw new Error('Không tìm thấy lượt học của em.')
    const session=JSON.parse(row.json) as Session
    if(session.doan&&!laGoiNoiBoDoan(b))throw new Error('Câu này thuộc chặng Đoàn Hộ Tống. Em trả lời ngay trong trận nhé.')
    if(Date.now()-session.created>2*3600000)throw new Error('Lượt học đã hết hạn. Em mở lượt mới.')
    const ref=session.questions.find(q=>q.qid===qid);if(!ref)throw new Error('Câu không thuộc lượt học.')
    const q=await currentQuestion(env,ref);const blocked=await protectedQuestions(env)
    const control=await readGameScope(env,sbd);if(!control.enabled)throw new Error('Thầy đang tạm dừng game cho hồ sơ này.')
    for(const key of control.blocked)blocked.add(key)
    if(control.types.length&&(!q.dang||!control.types.includes(q.dang)))throw new Error('Thầy vừa đổi phạm vi luyện. Em mở lượt mới.')
    if(blocked.has(q.qid)||blocked.has(q.group))throw new Error('Câu đang được dùng cho ca thi. Em mở lượt học khác; câu này không bị tính sai.')
    const previous=await env.DB.prepare('SELECT json FROM game_v2_attempt WHERE id=? AND sbd=?').bind(receipt,sbd).first<{json:string}>()
    if(previous)return {ok:true,...JSON.parse(previous.json),profile:visible(p),revision,replayed:true}
    if(session.guardian){const {r}=await escortContext(env,session.guardian,sbd);if(r.finished||r.round!==session.guardianRound||Date.now()>=Math.min(r.deadline,r.roundAt+60000))throw new Error('Lượt vừa kết thúc. Em làm câu của lượt mới.')}
    const dailyStart=new Date(academicDay(now())+'T00:00:00+07:00').toISOString()
    const loaiTran:LoaiTran=session.doan===1?'doan':'dao' // lượt thuộc phiên Đoàn ⇒ trần Đoàn (60); phiên khác ⇒ trần Đảo (36) — hai trần TÍNH RIÊNG
    const tran=tranCuaLoai(loaiTran)
    if(await demCauTrongNgay(env,sbd,dailyStart,loaiTran)>=tran)throw new Error(`Em đã hoàn thành ${tran} câu hôm nay. Ngày mai quay lại nhận nhiệm vụ mới nhé.`)
    const submitted=String(b.answer??'').trim()
    if(q.phan==='I'&&!/^[ABCD]$/.test(submitted)||q.phan==='II'&&!/^[DS]{4}$/.test(submitted)||q.phan==='III'&&(!submitted||submitted.length>40))throw new Error('Em điền đủ đáp án trước khi chấm.')
    const attempt:Attempt={id:receipt,session:id,qid,group:q.group,dang:q.dang,mucDo:q.mucDo,correct:grade(q,String(b.answer??'')),assisted:b.assisted===true,at:Date.now(),novel:ref.novel}
    const step=advance(p.mastery.find(m=>m.key===(q.dang??q.group)),attempt)
    // ĐIỀU 9: thưởng nấc dạng (Đảo và Đoàn cùng đường này) đi qua MỘT cửa có trần 120 EXP/ngày VN; quá trần ⇒ thưởng 0 nhưng mastery, sổ sự kiện, vé vẫn ghi đủ.
    const thuong=step.reward>0?nhanExpGame(p,academicDay(now()),step.reward):0
    p.mastery=[...p.mastery.filter(m=>m.key!==step.mastery.key),step.mastery];p.wallet+=thuong;p.earned+=thuong
    if(session.mode==='arena'&&p.arena&&!p.arena.finished)p.arena.studied=(p.arena.studied??0)+1
    if(session.mode==='arena'&&p.arena&&!p.arena.finished&&attempt.correct&&!attempt.assisted&&p.arena.learned<2&&!(p.arena.learnedGroups??[]).includes(q.group)){p.arena.gold+=2;p.arena.learned++;p.arena.learnedGroups=[...(p.arena.learnedGroups??[]),q.group]}
    const result={attempt,correct:attempt.correct,answer:q.correct,solution:q.solution,solutionImages:q.hinhAnh.filter(h=>h.viTri==='sau_loi_giai'),reward:thuong,...(thuong<step.reward?{thuongGoc:step.reward}:{}),stage:step.mastery.stage,lyDoThuong:lyDoThuong({correct:attempt.correct,assisted:attempt.assisted,reward:thuong,milestone:step.milestone,stage:step.mastery.stage})}
    const queries=[env.DB.prepare('INSERT INTO game_v2_attempt(id,sbd,session,qid,content_group,json,created_at) SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM game_v2_profile WHERE sbd=? AND revision=?) AND (SELECT COUNT(*) FROM game_v2_attempt a WHERE a.sbd=? AND a.created_at>=? AND '+dieuKienLoaiPhien(loaiTran)+')<?').bind(receipt,sbd,id,qid,q.group,JSON.stringify(result),now(),sbd,revision,sbd,dailyStart,tran)]
    if(step.reward)queries.push(env.DB.prepare('INSERT OR IGNORE INTO game_v2_reward(id,sbd,amount,created_at) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM game_v2_attempt WHERE id=?)').bind(`${sbd}|${step.mastery.key}|${step.milestone}`,sbd,thuong,now(),receipt))
    queries.push(env.DB.prepare('UPDATE game_v2_profile SET json=?,revision=revision+1 WHERE sbd=? AND revision=? AND EXISTS(SELECT 1 FROM game_v2_attempt WHERE id=?)').bind(JSON.stringify(p),sbd,revision,receipt))
    const written=await env.DB.batch(queries)
    if(!written[0]?.meta.changes)throw new Error('Một thiết bị khác vừa cập nhật. Em bấm chấm lại để đồng bộ.')
    // SỔ SỰ KIỆN HỌC (GĐ 0): câu có trợ giúp không phải bằng chứng tự làm (bất biến của game) → không ghi.
    if(!attempt.assisted)await ghiSuKien(env,[{nguon:'game',maNguon:id,sbd,qid,lan:1,ketQua:attempt.correct?1:0,luc:new Date(attempt.at).toISOString(),maDang:q.dang,chuyenDe:'',mucDo:q.mucDo??''}])
    // ĐỢT 2: câu vai THỬ THÁCH / LƯỢT TRÙM làm ĐÚNG lần đầu (tự làm) ⇒ thêm EXP theo bảng giá câu (EXP_CAU, phần × sao), ghi sổ `exp_so` (khoá `thuthach|<qid>` chống cộng đôi), qua cửa trần 120 EXP game/ngày.
    let expThuThach=0,pOut=p,revOut=revision+1
    if(attempt.correct&&!attempt.assisted&&(ref.role==='thu_thach'||ref.role==='trum')){
      const goc=expMotCau(q.phan,Number(q.sao)||0),g=await ghiKhoanExpGame(env,sbd,{khoa:`thuthach|${qid}`,loai:'thu_thach',exp:goc,ngay:academicDay(now()),luc:new Date(attempt.at).toISOString(),ghiChu:`Câu ${ref.role==='trum'?'Lượt trùm':'thử thách'} đúng lần đầu: +${goc}`,maNguon:id,qid},Date.now())
      expThuThach=g.exp
      if(g.bat&&!g.daGhiTruoc){const f=await loadProfile(env,sbd);pOut=f.profile;revOut=f.revision}
    }
    return {ok:true,...result,...(expThuThach?{expThuThach}:{}),profile:visible(pOut),revision:revOut}
  }
  if(action==='complete'){
    const id=String(b.session??'');const row=await env.DB.prepare('SELECT json FROM game_v2_session WHERE id=? AND sbd=?').bind(id,sbd).first<{json:string}>();if(!row)throw new Error('Không có lượt này.')
    const session=JSON.parse(row.json) as Session;const r=await env.DB.prepare('SELECT json FROM game_v2_attempt WHERE session=? AND sbd=?').bind(id,sbd).all<{json:string}>()
    const done=r.results.map(x=>JSON.parse(x.json) as {attempt:Attempt})
    // CẤM RÚT TỰ LUẬN (21/09): câu tự luận còn sót trong lượt cũ không được đòi em làm; chỉ đếm các câu rút được.
    const tuLuan=await qidTuLuanTrongLuot(env,session.questions)
    if(done.filter(x=>!tuLuan.has(x.attempt.qid)).length!==session.questions.filter(x=>!tuLuan.has(x.qid)).length)throw new Error('Em cần hoàn thành các câu trong lượt.')
    if(session.mode==='tower'&&done.filter(x=>x.attempt.correct&&!x.attempt.assisted).length>=Math.ceil(done.length*.7)){
      const milestone=`${sbd}|tower|${id}`
      const res=await env.DB.batch([env.DB.prepare('INSERT OR IGNORE INTO game_v2_reward(id,sbd,amount,created_at) SELECT ?,?,0,? WHERE EXISTS(SELECT 1 FROM game_v2_profile WHERE sbd=? AND revision=?)').bind(milestone,sbd,now(),sbd,revision),env.DB.prepare('UPDATE game_v2_profile SET json=?,revision=revision+1 WHERE sbd=? AND revision=? AND changes()=1').bind(JSON.stringify({...p,tower:Math.min(999,p.tower+1)}),sbd,revision)])
      if(res[1]?.meta.changes)p.tower=Math.min(999,p.tower+1)
    }
    for(const dang of new Set(session.questions.map(q=>done.find(a=>a.attempt.qid===q.qid)?.attempt.dang).filter(Boolean))){await env.DB.prepare('UPDATE game_v2_task SET completed_at=? WHERE sbd=? AND dang=? AND completed_at IS NULL').bind(now(),sbd,dang).run()}
    const fresh=await loadProfile(env,sbd)
    return {ok:true,profile:visible(fresh.profile),revision:fresh.revision,correct:done.filter(x=>x.attempt.correct).length,total:done.length}
  }
  if(action==='arena-new'){if(p.arena&&!p.arena.finished)throw new Error('Em hoàn thành ván đang chơi trước.');p.arena=newArena(crypto.getRandomValues(new Uint32Array(1))[0]!);return {ok:true,profile:visible(p),revision:await save(env,sbd,p,revision)}}
  if(action==='arena-action'){
    if(!p.arena)throw new Error('Em mở ván đấu trước.')
    if(Number(b.revision)!==revision)throw new Error('Bàn cờ vừa thay đổi. Em tải lại trước khi chơi tiếp.')
    p.arena=arenaAction(p.arena,b.action as ArenaAction);return {ok:true,profile:visible(p),revision:await save(env,sbd,p,revision)}
  }
  throw new Error('Không có lệnh game này.')
}
