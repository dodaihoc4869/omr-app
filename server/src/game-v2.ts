import {normalizePetName} from '../../src/game/than-thu-v2/pet-name'
import {escortAction,escortContext} from './game-v2-escort'
import {readGameScope} from './game-v2-reports'
import {roomAction} from './game-v2-room'
import type {Env} from './kieu'
import {gameIdentity,parentPass} from './game-v2-auth'
import {hash,readScope,syncIndex,protectedQuestions} from './game-v2-bank'
import {PETS,ALIASES,OLD_SIX,allowed,chooseSession,publicQuestion,grade,advance,newArena,arenaAction} from '../../src/game/than-thu-v2/core'
import type {Attempt,Mastery,PrivateQuestion,Mode,Arena,ArenaAction} from '../../src/game/than-thu-v2/core'
import {nhanExp,thanhExp} from '../../src/game/than-thu-hoa-hoc/kinh-nghiem'
import type {ShieldState} from '../../src/game/than-thu-v2/shields'
import {khienConLai,khienRenChuaDung} from './exp-ho-so-game'
import {MANH_MOI_KHIEN} from './exp-cau-hinh'
import type {KhienRen} from './exp-hoc-tap'
import {syncAcademic,type Academic,academicDay} from './game-v2-academic'
import {masteryTheoHoSo,qidChanHomNay} from './game-v2-ho-so'
import {ghiSuKien} from './su-kien-hoc'
export interface Profile {nickname?:string;academic?:Academic;shields?:ShieldState;expMoi?:{daCong:number;manhDaTinh:number};khienRen?:KhienRen;pet:string;choice:boolean;legacy:unknown;cap:number;exp:number;wallet:number;earned:number;tower:number;mastery:Mastery[];arena:Arena|null;cutover:string;season?:string}
type Row={revision:number;json:string}
type Session={guardian?:string;guardianRound?:number;mode:Mode;questions:{qid:string;maDe:string;version:string;group:string;novel:boolean}[];created:number}
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
    if(season)Object.assign(profile,{pet:'dat_quy',choice:true,cap:1,exp:0,wallet:0,earned:0,tower:1,mastery:[],arena:null,season})
    await env.DB.prepare('INSERT OR IGNORE INTO game_v2_profile(sbd,json,created_at) VALUES(?,?,?)').bind(sbd,JSON.stringify(profile),now()).run()
    row=await env.DB.prepare('SELECT revision,json FROM game_v2_profile WHERE sbd=?').bind(sbd).first<Row>()
  }
  if(!row)throw new Error('Chưa mở được hồ sơ game.')
  const current=JSON.parse(row.json) as Profile
  if(season&&current.season!==season){
    const fresh:Profile={pet:'dat_quy',choice:true,legacy:current.legacy,cap:1,exp:0,wallet:0,earned:0,tower:1,mastery:[],arena:null,cutover:now(),season}
    const updated=await env.DB.prepare('UPDATE game_v2_profile SET json=?,revision=revision+1 WHERE sbd=? AND revision=?').bind(JSON.stringify(fresh),sbd,row.revision).run()
    if(!updated.meta.changes)return loadProfile(env,sbd)
    return {profile:fresh,revision:row.revision+1}
  }
  return {profile:current,revision:row.revision}
}
async function save(env:Env,sbd:string,p:Profile,rev:number){const r=await env.DB.prepare('UPDATE game_v2_profile SET json=?,revision=revision+1 WHERE sbd=? AND revision=?').bind(JSON.stringify(p),sbd,rev).run();if(!r.meta.changes)throw new Error('Hồ sơ vừa đổi trên thiết bị khác. Em tải lại hồ sơ.');return rev+1}
function visible(p:Profile){const {legacy:_,academic,expMoi:__,...rest}=p;return {...rest,khienRen:p.khienRen?{manh:p.khienRen.manh,daRen:p.khienRen.daRen,chuaDung:khienRenChuaDung(p),conLai:khienConLai(p),moiKhien:MANH_MOI_KHIEN}:undefined,academic:academic?{total:academic.total,today:academic.days[academicDay(now())]??0,lastGain:academic.lastGain,at:academic.at,dailyLimit:100}:undefined}}
async function attempts(env:Env,sbd:string){const r=await env.DB.prepare('SELECT json FROM game_v2_attempt WHERE sbd=? ORDER BY created_at DESC LIMIT 3000').bind(sbd).all<{json:string}>();return r.results.map(x=>(JSON.parse(x.json) as {attempt:Attempt}).attempt).reverse()}
async function currentQuestion(env:Env,q:{qid:string;maDe:string;version:string}){
  const row=await env.DB.prepare(`SELECT q.json FROM game_v2_question q JOIN de_kho d ON d.ma_de=q.ma_de JOIN game_v2_index g ON g.ma_de=d.ma_de AND g.source_version=d.cap_nhat_luc WHERE q.ma_de=? AND q.qid=? AND q.version=? AND COALESCE(d.da_xoa,0)=0`).bind(q.maDe,q.qid,q.version).first<{json:string}>()
  if(!row)throw new Error('Câu đã được sửa hoặc rút khỏi kho. Em mở lượt mới; lượt này không bị tính sai.')
  return JSON.parse(row.json) as PrivateQuestion
}
export async function gameV2(env:Env,action:string,b:Record<string,unknown>):Promise<Record<string,unknown>> {
  const sbd=await gameIdentity(env,b)
  if(action==='sync')return {ok:true,...await syncIndex(env)}
  const {profile:p,revision}=await loadProfile(env,sbd)
  if(action.startsWith('escort-')){if(p.choice)throw new Error('Em chọn thần thú trước khi vào võ đài.');return escortAction(env,sbd,p.pet,p.cap,action,b)}
  if(action.startsWith('room-'))return roomAction(env,sbd,p.pet,action,b)
  if(action==='academic-sync'){const result=await syncAcademic(env,sbd,p,b.mom);return {ok:true,...result,profile:visible(p),revision:await save(env,sbd,p,revision)}}
  if(action==='progress-history'){
    const rows=await env.DB.prepare(`SELECT date(created_at,'+7 hours') AS day, COUNT(*) AS total,
      SUM(CASE WHEN json_extract(json,'$.attempt.correct')=1 AND COALESCE(json_extract(json,'$.attempt.assisted'),0)=0 THEN 1 ELSE 0 END) AS correct
      FROM game_v2_attempt WHERE sbd=? AND created_at>=? GROUP BY day ORDER BY day`).bind(sbd,new Date(Math.max(Date.now()-30*86400000,Date.parse(p.cutover)||0)).toISOString()).all()
    return {ok:true,history:rows.results}
  }
  if(action==='rename'){if(p.choice)throw new Error('Em chọn thần thú trước khi đặt tên.');p.nickname=normalizePetName(b.name);return {ok:true,profile:visible(p),revision:await save(env,sbd,p,revision)}}
  if(action==='share')return {ok:true,pass:await parentPass(env,sbd)}
  if(action==='profile'){const tasks=await env.DB.prepare('SELECT id,dang FROM game_v2_task WHERE sbd=? AND completed_at IS NULL ORDER BY created_at LIMIT 20').bind(sbd).all<{id:string;dang:string}>();return {ok:true,profile:visible(p),revision,tasks:tasks.results}}
  if(action==='shield-use'){
    const id=String(b.useId??'');if(!/^[a-zA-Z0-9-]{16,80}$/.test(id))throw new Error('Lượt dùng khiên không hợp lệ.')
    if(p.shields?.lastUse===id||Number(p.shields?.activeUntil)>Date.now())return {ok:true,profile:visible(p),revision}
    if(p.choice||khienConLai(p)<1)throw new Error('Em chưa có Khiên chống đuổi. Tiến hoá thần thú để nhận khiên.')
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
    let capacity=-p.exp;for(let level=p.cap;level<120;level++)capacity+=thanhExp(level)
    const portion=Math.max(0,Math.min(50000,p.wallet,capacity));const res=nhanExp({capDo:p.cap,exp:p.exp},portion)
    p.cap=res.capDo;p.exp=res.exp;p.wallet-=portion
    return {ok:true,profile:visible(p),revision:await save(env,sbd,p,revision)}
  }
  if(action==='start'||action==='recommendations'){
    const mode:Mode=['adventure','repair','tower','arena'].includes(String(b.mode))?b.mode as Mode:'adventure'
    let guardian:string|undefined,guardianRound:number|undefined
    if(b.guardian){guardian=String(b.guardian).trim().toUpperCase();const {r}=await escortContext(env,guardian,sbd);if(!r.started||r.finished||mode!=='arena'||Date.now()>=Math.min(r.deadline,r.roundAt+60000)||b.guardianRound!==undefined&&Number(b.guardianRound)!==r.round)throw new Error('Lượt Linh Tâm đã đổi. Em chờ câu của lượt mới.');guardianRound=r.round}
    const scope=await readScope(env,sbd);const blocked=await protectedQuestions(env)
    const control=await readGameScope(env,sbd);if(!control.enabled)throw new Error('Thầy đang tạm dừng game cho hồ sơ này.')
    for(const key of control.blocked)blocked.add(key)
    // GĐ 5 (Kênh 4): một đồng hồ giờ máy chủ cho cả lượt chọn; câu em đang/đã làm hôm nay ở chỗ khác không ra ở game; mốc ôn theo hồ sơ.
    const tNow=Date.now()
    for(const qid of await qidChanHomNay(env,sbd,tNow))blocked.add(qid)
    const history=await attempts(env,sbd)
    const eligible=scope.pool.filter(q=>allowed(q,scope.evidence,blocked)&&(control.types.length===0||q.dang!==null&&control.types.includes(q.dang))&&(typeof b.dang!=='string'||q.dang===b.dang))
    if(guardian){
      const saved=await env.DB.prepare("SELECT id,json FROM game_v2_session WHERE sbd=? AND json_extract(json,'$.guardian')=? AND json_extract(json,'$.guardianRound')=? ORDER BY created_at DESC LIMIT 1").bind(sbd,guardian,guardianRound).first<{id:string;json:string}>()
      if(saved){const old=JSON.parse(saved.json) as Session;const qs=old.questions.map(ref=>eligible.find(q=>q.qid===ref.qid&&q.version===ref.version));if(qs.every(Boolean)){const answered=await env.DB.prepare('SELECT json FROM game_v2_attempt WHERE session=? AND sbd=?').bind(saved.id,sbd).all<{json:string}>();return {ok:true,id:saved.id,questions:qs.map(q=>publicQuestion(q!)),answered:answered.results.map(x=>JSON.parse(x.json))}}throw new Error('Câu của lượt này đã thay đổi phạm vi. Em chờ lượt mới.')}
    }
    const dayStart=new Date(academicDay(now())+'T00:00:00+07:00')
    const count=await env.DB.prepare('SELECT COUNT(*) AS n FROM game_v2_attempt WHERE sbd=? AND created_at>=?').bind(sbd,dayStart.toISOString()).first<{n:number}>()
    const remaining=Math.max(0,200-(count?.n??0))
    const selected=chooseSession(eligible,scope.evidence,history,await masteryTheoHoSo(env,sbd,p.mastery),mode,tNow).slice(0,remaining)
    if(action==='recommendations')return {ok:true,dailyUsed:count?.n??0,suggestions:selected.map(q=>({title:q.tenDang||'Ôn kiến thức đã học',source:q.maDe,part:q.phan})),remaining}
    if(!remaining)throw new Error('Em đã hoàn thành 200 câu hôm nay. Ngày mai quay lại nhận nhiệm vụ mới nhé.')
    const qs=mode==='arena'?selected.slice(0,b.guardian?1:2):selected
    if(!qs.length)return {ok:true,questions:[],missing:scope.missing,message:'Chưa có câu đã chấm, đã công bố và phù hợp trong kho. Em hoàn thành bài Thầy giao rồi quay lại.'}
    const id=guardian?await hash(`${guardian}|${guardianRound}|${sbd}`):crypto.randomUUID();const groups=new Set(scope.evidence.map(e=>e.group))
    const session:Session={guardian,guardianRound,mode,created:Date.now(),questions:qs.map(q=>({qid:q.qid,maDe:q.maDe,version:q.version,group:q.group,novel:!groups.has(q.group)}))}
    const inserted=await env.DB.prepare('INSERT OR IGNORE INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').bind(id,sbd,JSON.stringify(session),now()).run()
    if(!inserted.meta.changes)return gameV2(env,'start',b)
    return {ok:true,id,questions:qs.map(publicQuestion),missing:scope.missing,sourceCases:[...new Set(scope.evidence.map(e=>e.ca))].slice(0,3)}
  }
  if(action==='resume'){
    const row=await env.DB.prepare('SELECT id,json FROM game_v2_session WHERE sbd=? AND created_at>? ORDER BY created_at DESC LIMIT 1').bind(sbd,new Date(Date.now()-2*3600000).toISOString()).first<{id:string;json:string}>()
    if(!row)return {ok:true,questions:[]}
    const session=JSON.parse(row.json) as Session;const blocked=await protectedQuestions(env);const control=await readGameScope(env,sbd);if(!control.enabled)throw new Error('Thầy đang tạm dừng game.');for(const key of control.blocked)blocked.add(key);const qs=[]
    for(const ref of session.questions){const q=await currentQuestion(env,ref);if(blocked.has(q.qid)||blocked.has(q.group))throw new Error('Lượt cũ có câu đang bảo vệ. Em mở lượt mới.');qs.push(publicQuestion(q))}
    const rows=await env.DB.prepare('SELECT json FROM game_v2_attempt WHERE session=? AND sbd=? ORDER BY created_at').bind(row.id,sbd).all<{json:string}>()
    return {ok:true,id:row.id,questions:qs,mode:session.mode,answered:rows.results.map(x=>JSON.parse(x.json))}
  }
  if(action==='answer'){
    const id=String(b.session??'');const qid=String(b.qid??'');const receipt=`${id}|${qid}`
    const row=await env.DB.prepare('SELECT json FROM game_v2_session WHERE id=? AND sbd=?').bind(id,sbd).first<{json:string}>()
    if(!row)throw new Error('Không tìm thấy lượt học của em.')
    const session=JSON.parse(row.json) as Session
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
    const daily=await env.DB.prepare('SELECT COUNT(*) AS n FROM game_v2_attempt WHERE sbd=? AND created_at>=?').bind(sbd,dailyStart).first<{n:number}>()
    if((daily?.n??0)>=200)throw new Error('Em đã hoàn thành 200 câu hôm nay. Ngày mai quay lại nhận nhiệm vụ mới nhé.')
    const submitted=String(b.answer??'').trim()
    if(q.phan==='I'&&!/^[ABCD]$/.test(submitted)||q.phan==='II'&&!/^[DS]{4}$/.test(submitted)||q.phan==='III'&&(!submitted||submitted.length>40))throw new Error('Em điền đủ đáp án trước khi chấm.')
    const attempt:Attempt={id:receipt,session:id,qid,group:q.group,dang:q.dang,mucDo:q.mucDo,correct:grade(q,String(b.answer??'')),assisted:b.assisted===true,at:Date.now(),novel:ref.novel}
    const step=advance(p.mastery.find(m=>m.key===(q.dang??q.group)),attempt)
    p.mastery=[...p.mastery.filter(m=>m.key!==step.mastery.key),step.mastery];p.wallet+=step.reward;p.earned+=step.reward
    if(session.mode==='arena'&&p.arena&&!p.arena.finished)p.arena.studied=(p.arena.studied??0)+1
    if(session.mode==='arena'&&p.arena&&!p.arena.finished&&attempt.correct&&!attempt.assisted&&p.arena.learned<2&&!(p.arena.learnedGroups??[]).includes(q.group)){p.arena.gold+=2;p.arena.learned++;p.arena.learnedGroups=[...(p.arena.learnedGroups??[]),q.group]}
    const result={attempt,correct:attempt.correct,answer:q.correct,solution:q.solution,solutionImages:q.hinhAnh.filter(h=>h.viTri==='sau_loi_giai'),reward:step.reward,stage:step.mastery.stage}
    const queries=[env.DB.prepare('INSERT INTO game_v2_attempt(id,sbd,session,qid,content_group,json,created_at) SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM game_v2_profile WHERE sbd=? AND revision=?) AND (SELECT COUNT(*) FROM game_v2_attempt WHERE sbd=? AND created_at>=?)<200').bind(receipt,sbd,id,qid,q.group,JSON.stringify(result),now(),sbd,revision,sbd,dailyStart)]
    if(step.reward)queries.push(env.DB.prepare('INSERT OR IGNORE INTO game_v2_reward(id,sbd,amount,created_at) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM game_v2_attempt WHERE id=?)').bind(`${sbd}|${step.mastery.key}|${step.milestone}`,sbd,step.reward,now(),receipt))
    queries.push(env.DB.prepare('UPDATE game_v2_profile SET json=?,revision=revision+1 WHERE sbd=? AND revision=? AND EXISTS(SELECT 1 FROM game_v2_attempt WHERE id=?)').bind(JSON.stringify(p),sbd,revision,receipt))
    const written=await env.DB.batch(queries)
    if(!written[0]?.meta.changes)throw new Error('Một thiết bị khác vừa cập nhật. Em bấm chấm lại để đồng bộ.')
    // SỔ SỰ KIỆN HỌC (GĐ 0): câu có trợ giúp không phải bằng chứng tự làm (bất biến của game) → không ghi.
    if(!attempt.assisted)await ghiSuKien(env,[{nguon:'game',maNguon:id,sbd,qid,lan:1,ketQua:attempt.correct?1:0,luc:new Date(attempt.at).toISOString(),maDang:q.dang,chuyenDe:'',mucDo:q.mucDo??''}])
    return {ok:true,...result,profile:visible(p),revision:revision+1}
  }
  if(action==='complete'){
    const id=String(b.session??'');const row=await env.DB.prepare('SELECT json FROM game_v2_session WHERE id=? AND sbd=?').bind(id,sbd).first<{json:string}>();if(!row)throw new Error('Không có lượt này.')
    const session=JSON.parse(row.json) as Session;const r=await env.DB.prepare('SELECT json FROM game_v2_attempt WHERE session=? AND sbd=?').bind(id,sbd).all<{json:string}>()
    const done=r.results.map(x=>JSON.parse(x.json) as {attempt:Attempt})
    if(done.length!==session.questions.length)throw new Error('Em cần hoàn thành các câu trong lượt.')
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
